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

    // Smart catalog fetcher — fetches the page, finds PDF links and sub-pages, fetches those too
    var catalogContent = '';
    if (catalogUrl && catalogUrl.trim()) {
      try {
        var baseUrl = catalogUrl.trim().replace(/\?.*$/, ''); // strip query params
        var origin = '';
        try { var u = new URL(baseUrl); origin = u.origin; } catch(e) {}

        var stripHtml = function(h) {
          return h
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
            .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
            .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#\d+;/g, ' ')
            .replace(/\s+/g, ' ').trim();
        };

        var allText = '';
        var fetchOpts = { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PathForge/1.0)' }, signal: AbortSignal.timeout(10000) };

        // 1. Fetch the main page
        var mainRes = await fetch(catalogUrl.trim(), fetchOpts);
        if (mainRes.ok) {
          var contentType = mainRes.headers.get('content-type') || '';
          var mainHtml = await mainRes.text();

          if (contentType.includes('pdf')) {
            // User directly linked a PDF — use as-is (text extraction from PDF won't work server-side, tell Gemini to search)
            catalogContent = '\n\nThe student provided a PDF catalog link: ' + catalogUrl.trim() + '\nSearch this PDF URL to find real courses offered at their high school.\n';
          } else {
            // It's HTML — extract text and look for PDF links
            allText = stripHtml(mainHtml);

            // 2. Find PDF links on the page (course catalogs are often PDFs)
            var pdfLinks = [];
            var pdfRegex = /href=["']([^"']*\.pdf[^"']*)/gi;
            var pdfMatch;
            while ((pdfMatch = pdfRegex.exec(mainHtml)) !== null) {
              var pdfUrl = pdfMatch[1];
              if (pdfUrl.startsWith('/')) pdfUrl = origin + pdfUrl;
              if (!pdfUrl.startsWith('http')) continue;
              // Only include PDFs that look like course/curriculum catalogs
              var pdfLower = pdfUrl.toLowerCase();
              if (pdfLower.includes('curriculum') || pdfLower.includes('course') || pdfLower.includes('catalog') || pdfLower.includes('pathway') || pdfLower.includes('program') || pdfLower.includes('academic')) {
                pdfLinks.push(pdfUrl);
              }
            }

            // 3. Fetch the first relevant PDF found (via Gemini search grounding since we can't parse PDFs server-side)
            if (pdfLinks.length > 0) {
              catalogContent = '\n\nThe student\'s school catalog page links to these PDF documents with real course listings:\n';
              for (var pi = 0; pi < Math.min(pdfLinks.length, 3); pi++) {
                catalogContent += '- ' + pdfLinks[pi] + '\n';
              }
              catalogContent += '\nSearch these PDF URLs to find REAL courses offered at this high school. Extract exact course names from these documents.\n';
            }

            // 4. Also find sub-pages that might list courses (department pages)
            var deptLinks = [];
            var linkRegex = /href=["']([^"']*(?:math|english|science|history|language|arts|computer|department|courses)[^"']*)/gi;
            var linkMatch;
            while ((linkMatch = linkRegex.exec(mainHtml)) !== null) {
              var subUrl = linkMatch[1];
              if (subUrl.startsWith('/')) subUrl = origin + subUrl;
              if (!subUrl.startsWith('http')) continue;
              if (subUrl === catalogUrl.trim() || subUrl === baseUrl) continue;
              if (deptLinks.indexOf(subUrl) === -1) deptLinks.push(subUrl);
            }

            // 5. Fetch up to 4 department sub-pages for more course data
            var subTexts = [];
            for (var di = 0; di < Math.min(deptLinks.length, 4); di++) {
              try {
                var subRes = await fetch(deptLinks[di], { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PathForge/1.0)' }, signal: AbortSignal.timeout(5000) });
                if (subRes.ok) {
                  var subHtml = await subRes.text();
                  var subText = stripHtml(subHtml);
                  if (subText.length > 100) subTexts.push(subText.substring(0, 2000));
                }
              } catch(se) { /* skip failed sub-pages */ }
            }

            // Combine all text content
            var combined = allText;
            if (subTexts.length > 0) combined += '\n\n--- DEPARTMENT PAGES ---\n' + subTexts.join('\n\n');
            if (combined.length > 12000) combined = combined.substring(0, 12000);

            if (combined.length > 200 && !catalogContent) {
              catalogContent = '\n\nSCHOOL CATALOG PAGE CONTENT (from ' + baseUrl + '):\n"""\n' + combined + '\n"""\n\nYou MUST use the real courses from the catalog content above. These are REAL courses offered at the student\'s actual high school. Extract course names, levels (AP/Honors/Standard), and descriptions from this content. Do NOT make up courses — use ONLY courses found in this catalog.\n';
            } else if (combined.length > 200 && catalogContent) {
              // We have both PDF links AND page content
              catalogContent += '\n\nADDITIONAL PAGE CONTENT:\n"""\n' + combined.substring(0, 4000) + '\n"""\n';
            }
          }
        }
      } catch (fetchErr) {
        console.error('HS Catalog fetch error:', fetchErr.message);
        catalogContent = '\n\nThe student provided this catalog URL: ' + catalogUrl.trim() + '\nSearch this URL to find real courses offered at their high school.\n';
      }
    }

    // Generate high school roadmap
    var hasCatalog = catalogContent.length > 100;

    var courseInstruction = hasCatalog
      ? 'CRITICAL — CATALOG PROVIDED: The student uploaded their actual school course catalog. You MUST use ONLY course names that appear in the CATALOG PAGE CONTENT below. Do NOT use generic course names like "Honors Biology" or "Algebra I" — use the EXACT course names from the catalog (e.g. if the catalog says "BIO 101 — Introduction to Biological Sciences", use that exact name). If a course type (AP/Honors/Standard) is indicated in the catalog, use it. Every single course in your response must come directly from the catalog content.\n'
      : 'Use realistic course names typical of American high schools (AP, Honors, Standard).\n';

    const prompt = 'You are a high school guidance counselor. Create a 4-year high school roadmap for a student interested in ' + career + '.\n\n' + courseInstruction + catalogContent + '\nCRITICAL: Return ONLY valid JSON with no extra text, no markdown, no backticks, no preamble.\n\n{\n  "careerField": "' + career + '",\n  "years": [\n    {\n      "year": "Freshman",\n      "courses": [\n        {"name": "REAL COURSE NAME FROM CATALOG", "type": "Honors", "why": "Brief reason this course helps"},\n        {"name": "REAL COURSE NAME FROM CATALOG", "type": "Standard", "why": "Brief reason"}\n      ],\n      "focus": "Focus for this year",\n      "milestones": ["milestone1", "milestone2"]\n    }\n  ],\n  "extracurriculars": [\n    {"activity": "Club Name", "type": "Club", "relevance": "Why it matters", "commitment": "2-3 hours/week"}\n  ],\n  "topColleges": [\n    {"name": "University", "strengths": "Why this school", "selectivity": "Highly Selective"}\n  ],\n  "standardizedTests": {\n    "sat": {"when": "When to take", "target": "Score range", "prep": "How to prepare"},\n    "act": {"when": "When to take", "target": "Score range", "prep": "How to prepare"},\n    "ap": ["AP Exam 1", "AP Exam 2"]\n  },\n  "summerActivities": [\n    {"year": "After Freshman Year", "activities": ["activity1", "activity2"]}\n  ],\n  "collegeAppTimeline": [\n    {"when": "Junior Spring", "tasks": ["task1", "task2"]}\n  ],\n  "skills": ["skill1", "skill2"]\n}\n\nReturn 4 years (Freshman, Sophomore, Junior, Senior) with 6-8 courses each.\n' + (hasCatalog ? 'EVERY course name MUST come from the catalog content above. Do NOT invent course names.\n' : '') + '8-12 colleges for ' + career + '.\n5-7 extracurriculars.\nJSON ONLY - no other text.';

    var useSearch = catalogContent.indexOf('PDF') !== -1 || catalogContent.indexOf('.pdf') !== -1;
    
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
