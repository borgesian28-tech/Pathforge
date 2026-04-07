export const maxDuration = 60;

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

export async function POST(request) {
  try {
    const { careerGoal } = await request.json();
    
    if (!careerGoal) {
      return Response.json({ error: 'Missing career goal' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'No API key' }, { status: 500 });
    }

    const career = careerGoal;

    // Generate high school roadmap
    const prompt = `You are a high school guidance counselor helping a student prepare for college in the field of ${career}.

Create a comprehensive 4-year high school roadmap (Freshman through Senior year) with specific course recommendations, extracurriculars, and college prep advice.

IMPORTANT RULES:
- Recommend REAL course names (AP Biology, Honors Chemistry, AP Calculus BC, etc.)
- Be specific about which AP/Honors courses to take each year
- Focus on rigor and courses that prepare for ${career}
- Include realistic timeline for standardized tests (SAT/ACT, AP exams)
- Recommend 5-7 extracurricular activities relevant to ${career}
- List 8-12 top colleges/universities known for ${career} programs

Return ONLY valid JSON (no markdown, no backticks):
{
  "careerField": "${career}",
  "years": [
    {
      "year": "Freshman",
      "courses": [
        {
          "name": "Course name",
          "type": "AP/Honors/Standard",
          "why": "Brief reason why this matters for ${career}"
        }
      ],
      "focus": "Main focus areas this year",
      "milestones": ["milestone 1", "milestone 2"]
    }
  ],
  "extracurriculars": [
    {
      "activity": "Activity name",
      "type": "Club/Sport/Competition/Volunteer",
      "relevance": "How this relates to ${career}",
      "commitment": "Time commitment description"
    }
  ],
  "topColleges": [
    {
      "name": "University name",
      "strengths": "What makes this school great for ${career}",
      "selectivity": "Highly Selective/Selective/Moderately Selective"
    }
  ],
  "standardizedTests": {
    "sat": {
      "when": "When to take it",
      "target": "Target score for top programs",
      "prep": "Preparation advice"
    },
    "act": {
      "when": "When to take it",
      "target": "Target score",
      "prep": "Preparation advice"
    },
    "ap": ["List of recommended AP exams to take"]
  },
  "summerActivities": [
    {
      "year": "After Freshman Year",
      "activities": ["activity 1", "activity 2", "activity 3"]
    }
  ],
  "collegeAppTimeline": [
    {
      "when": "Junior Spring",
      "tasks": ["task 1", "task 2"]
    }
  ],
  "skills": ["skill1", "skill2", "skill3", "skill4", "skill5"]
}

Requirements:
- 4 years with 6-8 courses each
- 5-7 extracurriculars
- 8-12 top colleges
- 4 summer activity entries
- Realistic college app timeline
- 5-8 key skills to develop

JSON only. No extra text.`;

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: { 
          maxOutputTokens: 8192, 
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

    const roadmap = JSON.parse(substr.substring(0, end + 1));
    
    // Validate response structure
    if (!roadmap.years || !Array.isArray(roadmap.years) || roadmap.years.length !== 4) {
      throw new Error('Invalid roadmap structure - must have 4 years');
    }

    return Response.json(roadmap);
    
  } catch (err) {
    console.error('HS roadmap error:', err);
    return Response.json({ 
      error: 'Failed to generate high school roadmap',
      message: err.message 
    }, { status: 500 });
  }
}
