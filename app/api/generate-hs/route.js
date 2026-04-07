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

    // If user provided a catalog URL, we'll use Gemini's Google Search grounding
    // to actually visit the page and its linked PDFs to find real courses.
    // Our own server-side fetch often gets marketing pages without course lists,
    // so Gemini's search is more reliable for this.
    var catalogContent = '';
    var hasCatalogUrl = catalogUrl && catalogUrl.trim();
    
    if (hasCatalogUrl) {
      var cleanUrl = catalogUrl.trim().replace(/\?.*$/, ''); // strip tracking params
      catalogContent = '\n\nCRITICAL — REAL SCHOOL CATALOG:\nThe student attends a specific school. Their course catalog is at: ' + cleanUrl + '\n\nYou MUST:\n1. Search and visit this URL: ' + cleanUrl + '\n2. Look for any linked PDF documents on that page (often called "Curriculum Pathways", "Course Catalog", "Course of Studies", "Program of Studies")\n3. Search for and read those PDFs to find the REAL courses offered at this school\n4. Use ONLY course names that actually exist at this school\n5. Do NOT use generic course names like "Algebra I", "World History", "Introduction to Economics" — use the EXACT names from the school\'s catalog\n6. If the catalog lists courses like "MPS 1", "Physics Mechanics", "Foundations of Citizenship and Democracy", "English 9" — use THOSE exact names\n\nThis is the most important instruction: every course in your response must be a real course from this specific school. Search the URL thoroughly.\n';
    }

    // Generate high school roadmap
    var hasCatalog = !!hasCatalogUrl;

    var courseInstruction = hasCatalog
      ? 'CRITICAL — CATALOG PROVIDED: The student uploaded their actual school course catalog URL. You MUST search that URL and any linked PDFs to find the real courses. Do NOT use generic course names — use the EXACT course names from the school\'s catalog.\n'
      : 'Use realistic course names typical of American high schools (AP, Honors, Standard).\n';

    const prompt = 'You are a high school guidance counselor. Create a 4-year high school roadmap for a student interested in ' + career + '.\n\n' + courseInstruction + catalogContent + '\nCRITICAL: Return ONLY valid JSON with no extra text, no markdown, no backticks, no preamble.\n\n{\n  "careerField": "' + career + '",\n  "years": [\n    {\n      "year": "Freshman",\n      "courses": [\n        {"name": "REAL COURSE NAME FROM CATALOG", "type": "Honors", "why": "Brief reason this course helps"},\n        {"name": "REAL COURSE NAME FROM CATALOG", "type": "Standard", "why": "Brief reason"}\n      ],\n      "focus": "Focus for this year",\n      "milestones": ["milestone1", "milestone2"]\n    }\n  ],\n  "extracurriculars": [\n    {"activity": "Club Name", "type": "Club", "relevance": "Why it matters", "commitment": "2-3 hours/week"}\n  ],\n  "topColleges": [\n    {"name": "University", "strengths": "Why this school", "selectivity": "Highly Selective"}\n  ],\n  "standardizedTests": {\n    "sat": {"when": "When to take", "target": "Score range", "prep": "How to prepare"},\n    "act": {"when": "When to take", "target": "Score range", "prep": "How to prepare"},\n    "ap": ["AP Exam 1", "AP Exam 2"]\n  },\n  "summerActivities": [\n    {"year": "After Freshman Year", "activities": ["activity1", "activity2"]}\n  ],\n  "collegeAppTimeline": [\n    {"when": "Junior Spring", "tasks": ["task1", "task2"]}\n  ],\n  "skills": ["skill1", "skill2"]\n}\n\nReturn 4 years (Freshman, Sophomore, Junior, Senior) with 6-8 courses each.\n' + (hasCatalog ? 'EVERY course name MUST come from the school\'s actual catalog. Do NOT invent course names. Search the catalog URL provided.\n' : '') + '8-12 colleges for ' + career + '.\n5-7 extracurriculars.\nJSON ONLY - no other text.';

    // ALWAYS use search grounding when catalog URL is provided so Gemini can visit it
    var useSearch = hasCatalog;
    
    var geminiBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { 
        maxOutputTokens: hasCatalog ? 6144 : 4096, 
        temperature: 0.3 
      },
    };
    if (useSearch) geminiBody.tools = [{ google_search: {} }];

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(geminiBody),
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
