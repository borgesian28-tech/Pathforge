export const maxDuration = 30;

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

export async function POST(request) {
  try {
    const { careerGoal, courses } = await request.json();
    
    if (!careerGoal || !courses) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    const prompt = `You are a high school guidance counselor helping a student choose their senior year courses.

STUDENT'S GOAL: ${careerGoal}
COURSE OPTIONS: ${courses}

Provide a clear recommendation on which course(s) to take and explain why. Consider:
- Which courses best prepare for college major requirements in ${careerGoal}
- Which courses demonstrate academic rigor to admissions officers
- Which courses build foundational skills needed for ${careerGoal}
- Real-world relevance to the career path

Return ONLY valid JSON (no markdown, no backticks):
{
  "recommendation": "One clear sentence stating which course to take",
  "reasoning": "2-3 sentences explaining why this is the best choice",
  "details": ["point 1", "point 2", "point 3"]
}

Be specific, practical, and encouraging. JSON only.`;

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          maxOutputTokens: 1024, 
          temperature: 0.3 
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Gemini API failed');
    }

    const data = await response.json();
    
    // Extract text from response
    let text = '';
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.text) text += part.text;
      }
    }

    text = text.trim();
    
    // Clean markdown code blocks if present
    if (text.includes('```')) {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) text = match[1].trim();
    }

    // Extract JSON object
    const start = text.indexOf('{');
    if (start === -1) {
      throw new Error('No JSON found in response');
    }

    let depth = 0, inString = false, escape = false, end = -1;
    const substr = text.substring(start);
    
    for (let i = 0; i < substr.length; i++) {
      const char = substr[i];
      if (escape) { escape = false; continue; }
      if (char === '\\') { escape = true; continue; }
      if (char === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (char === '{') depth++;
      if (char === '}') { depth--; if (depth === 0) { end = i; break; } }
    }

    if (end === -1) {
      throw new Error('Incomplete JSON in response');
    }

    const result = JSON.parse(substr.substring(0, end + 1));
    
    // Validate response structure
    if (!result.recommendation || !result.reasoning) {
      throw new Error('Invalid response structure');
    }

    return Response.json(result);
    
  } catch (err) {
    console.error('HS advisor error:', err);
    return Response.json({ 
      error: 'Failed to generate recommendation',
      message: err.message 
    }, { status: 500 });
  }
}
