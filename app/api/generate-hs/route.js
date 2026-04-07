export const maxDuration = 60;

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

export async function POST(request) {
  try {
    var body = null;
    try { body = await request.json(); } catch(e) { body = {}; }
    var careerGoal = body.careerGoal || body.career || body.careerPath || '';
    
    if (!careerGoal || !careerGoal.trim()) {
      return Response.json({ error: 'Missing career goal' }, { status: 400 });
    }
    careerGoal = careerGoal.trim();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'No API key' }, { status: 500 });
    }

    const career = careerGoal;
    var catalogUrl = body.catalogUrl || '';

    // If user provided a catalog URL, fetch the actual page content
    var catalogContent = '';
    if (catalogUrl && catalogUrl.trim()) {
      try {
        var catalogResponse = await fetch(catalogUrl.trim(), {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PathForge/1.0)' },
          signal: AbortSignal.timeout(10000),
        });
        if (catalogResponse.ok) {
          var html = await catalogResponse.text();
          var text = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
            .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
            .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#\d+;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          if (text.length > 8000) text = text.substring(0, 8000);
          if (text.length > 100) {
            catalogContent = '\n\nSCHOOL CATALOG PAGE CONTENT (from ' + catalogUrl.trim() + '):\n"""\n' + text + '\n"""\n\nYou MUST use the real courses from the catalog content above. These are REAL courses offered at the student\'s actual high school. Extract course names, levels (AP/Honors/Standard), and descriptions from this content. Do NOT make up courses — use ONLY courses found in this catalog.\n';
          }
        }
      } catch (fetchErr) {
        console.error('HS Catalog fetch error:', fetchErr.message);
        catalogContent = '\n\nThe student provided this catalog URL: ' + catalogUrl.trim() + '\nSearch this URL to find real courses offered at their high school.\n';
      }
    }

    // Generate high school roadmap
    const prompt = `You are a high school guidance counselor. Create a 4-year high school roadmap for a student interested in ${career}.
${catalogContent}
CRITICAL: Return ONLY valid JSON with no extra text, no markdown, no backticks, no preamble.

{
  "careerField": "${career}",
  "years": [
    {
      "year": "Freshman",
      "courses": [
        {"name": "Honors Biology", "type": "Honors", "why": "Foundation for life sciences"},
        {"name": "Algebra I", "type": "Standard", "why": "Math fundamentals"},
        {"name": "English I", "type": "Standard", "why": "Writing skills"},
        {"name": "World History", "type": "Standard", "why": "Cultural awareness"},
        {"name": "Physical Education", "type": "Standard", "why": "Health requirement"},
        {"name": "Art or Music", "type": "Elective", "why": "Creative expression"}
      ],
      "focus": "Build strong academic foundation and explore interests",
      "milestones": ["Join 1-2 clubs", "Maintain 3.5+ GPA", "Build study habits"]
    }
  ],
  "extracurriculars": [
    {"activity": "Science Club", "type": "Club", "relevance": "Hands-on science experience", "commitment": "2-3 hours/week"},
    {"activity": "Debate Team", "type": "Competition", "relevance": "Critical thinking", "commitment": "4-5 hours/week"}
  ],
  "topColleges": [
    {"name": "MIT", "strengths": "Top engineering programs", "selectivity": "Highly Selective"},
    {"name": "Stanford", "strengths": "Innovation culture", "selectivity": "Highly Selective"}
  ],
  "standardizedTests": {
    "sat": {"when": "Spring of Junior year", "target": "1400-1600 for top schools", "prep": "Start prep junior fall with Khan Academy"},
    "act": {"when": "Alternative to SAT", "target": "32-36 for top schools", "prep": "Practice tests and official prep"},
    "ap": ["AP Biology", "AP Calculus BC", "AP Chemistry", "AP English Literature"]
  },
  "summerActivities": [
    {"year": "After Freshman Year", "activities": ["Summer reading", "Local internship", "Community service"]},
    {"year": "After Sophomore Year", "activities": ["Pre-college program", "Job or internship", "Leadership role"]},
    {"year": "After Junior Year", "activities": ["Intensive program", "Research project", "College visits"]}
  ],
  "collegeAppTimeline": [
    {"when": "Junior Spring", "tasks": ["Take SAT/ACT", "Visit colleges", "Build college list"]},
    {"when": "Summer Before Senior", "tasks": ["Draft essays", "Request recommendations", "Finalize list"]},
    {"when": "Senior Fall", "tasks": ["Submit early apps", "Continue regular apps", "Interview prep"]},
    {"when": "Senior Winter", "tasks": ["Submit regular apps", "Apply for aid", "Wait for decisions"]}
  ],
  "skills": ["Critical thinking", "Time management", "Written communication", "Research", "Leadership"]
}

Return 4 years (Freshman, Sophomore, Junior, Senior) with 6-8 courses each.
8-12 colleges for ${career}.
5-7 extracurriculars.
JSON ONLY - no other text.`;

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          maxOutputTokens: 4096, 
          temperature: 0.4 
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
    if (!roadmap.years || !Array.isArray(roadmap.years) || roadmap.years.length < 1) {
      throw new Error('Invalid roadmap structure');
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
