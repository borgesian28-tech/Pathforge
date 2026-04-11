export const maxDuration = 60;

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

export async function POST(request) {
  try {
    var body = await request.json();
    var prefs = body.preferences || {};

    var apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return Response.json({ error: 'No key' }, { status: 500 });

    var prompt = 'Find 5 real US colleges/universities that match these student preferences:\n' +
      '- Intended major: ' + (prefs.major || 'Undecided') + '\n' +
      '- School size: ' + (prefs.size || 'No preference') + '\n' +
      '- Setting: ' + (prefs.setting || 'No preference') + '\n' +
      '- Region: ' + (prefs.region || 'Anywhere in the US') + '\n' +
      '- Priority: ' + (prefs.focus || 'Strong academics') + '\n\n' +
      'Return a JSON array of 5 colleges. Each object must have these exact fields:\n' +
      '- name: Full university name\n' +
      '- location: "City, State"\n' +
      '- size: "XX,XXX students"\n' +
      '- setting: "Urban" or "Suburban" or "Rural"\n' +
      '- acceptanceRate: "XX%"\n' +
      '- topMajors: array of 3 strings\n' +
      '- avgGPA: "X.XX"\n' +
      '- avgSAT: "XXXX-XXXX"\n' +
      '- tuition: "$XX,XXX/year"\n' +
      '- financialAid: "XX% of students receive aid"\n' +
      '- whyGoodFit: 2 sentences why this matches the student\n' +
      '- website: full https URL\n\n' +
      'IMPORTANT: Return ONLY the raw JSON array. No markdown, no code fences, no explanation. Start with [ and end with ].';

    var contents = [
      {
        role: 'user',
        parts: [{ text: 'You are a college admissions data expert. You respond ONLY with valid JSON arrays. No markdown, no backticks, no explanation text. All data must be factually accurate for real accredited US colleges.' }]
      },
      {
        role: 'model',
        parts: [{ text: 'Understood. I will respond only with a raw JSON array of real US colleges.' }]
      },
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ];

    var response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: { maxOutputTokens: 4096, temperature: 0.4 },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        ],
      }),
    });

    if (!response.ok) {
      var errText = await response.text();
      console.error('College search API error:', response.status, errText);
      return Response.json({ colleges: [], error: 'API error' });
    }

    var data = await response.json();
    var reply = '';
    var candidates = data.candidates || [];
    if (candidates.length > 0 && candidates[0].content && candidates[0].content.parts) {
      for (var j = 0; j < candidates[0].content.parts.length; j++) {
        if (candidates[0].content.parts[j].text) {
          reply += candidates[0].content.parts[j].text;
        }
      }
    }

    reply = reply.trim();
    // Strip markdown fences
    reply = reply.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    // Extract JSON array
    var startIdx = reply.indexOf('[');
    var endIdx = reply.lastIndexOf(']');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      reply = reply.substring(startIdx, endIdx + 1);
    }

    try {
      var parsed = JSON.parse(reply);
      var colleges = Array.isArray(parsed) ? parsed : [parsed];
      return Response.json({ colleges: colleges });
    } catch (e) {
      // Try fixing trailing commas
      try {
        var fixed = reply.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}');
        var parsed2 = JSON.parse(fixed);
        var colleges2 = Array.isArray(parsed2) ? parsed2 : [parsed2];
        return Response.json({ colleges: colleges2 });
      } catch (e2) {
        console.error('College search JSON parse failed:', e2.message, reply.substring(0, 300));
        return Response.json({ colleges: [], error: 'Failed to parse results' });
      }
    }
  } catch (err) {
    console.error('College search error:', err);
    return Response.json({ colleges: [], error: 'Server error' });
  }
}
