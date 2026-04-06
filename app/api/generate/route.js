export const maxDuration = 60;

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function POST(request) {
  try {
    const { schoolName, careerPath, majorName, customGoal } = await request.json();
    if (!schoolName || (!careerPath && !customGoal)) {
      return Response.json({ error: 'Missing' }, { status: 400 });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'No key' }, { status: 500 });
    }
    const career = customGoal || careerPath;
    const major = majorName || 'recommended';

    var roadmapPrompt = 'Return ONLY raw JSON. No markdown. No text.\n\n' + major + ' major roadmap at ' + schoolName + ' for ' + career + '.\n\nStructure: {"schoolFullName":"","major":"","careerTitle":"","departmentUrl":"real URL to dept homepage","semesters":[8 with name/courses(4 each: code/title/credits/type/desc)],"clubs":[],"milestones":[8 with sem/label],"skills":[5],"beyondClassroom":{"intro":"","technicalSkills":[2 with skill/why/resources(1: name/type/url/cost/time)/semester],"networkingPlaybook":[2 with phase/semester/actions],"interviewPrep":[1 with category/resources(1: name/url/desc)/timeline],"weeklyHabits":[3],"careerInsiderTips":[3]}}\n\nSemesters: "Fall - Freshman" thru "Spring - Senior". Types: Core/Prerequisite/Elective/Gen Ed. Desc under 8 words. For IB: recruiting sophomore winter. Leave clubs as empty array []. Real course codes. Nothing after closing brace.';

    var roadmapResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: roadmapPrompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!roadmapResponse.ok) {
      var errBody = await roadmapResponse.text();
      console.error('Gemini roadmap error:', roadmapResponse.status, errBody);
      return Response.json({ error: 'AI error' }, { status: 502 });
    }

    var roadmapData = await roadmapResponse.json();
    var roadmapText = '';
    var candidates = roadmapData.candidates || [];
    if (candidates.length > 0 && candidates[0].content && candidates[0].content.parts) {
      for (var i = 0; i < candidates[0].content.parts.length; i++) {
        if (candidates[0].content.parts[i].text) {
          roadmapText += candidates[0].content.parts[i].text;
        }
      }
    }
    roadmapText = roadmapText.trim();
    if (roadmapText.indexOf('```') !== -1) {
      var fm = roadmapText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fm) roadmapText = fm[1].trim();
    }
    var bs = roadmapText.indexOf('{');
    if (bs === -1) return Response.json({ error: 'No JSON' }, { status: 500 });
    roadmapText = roadmapText.substring(bs);
    var depth = 0, inStr = false, esc = false, je = -1;
    for (var j = 0; j < roadmapText.length; j++) {
      var c = roadmapText[j];
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (c === '{') depth++;
      if (c === '}') { depth--; if (depth === 0) { je = j; break; } }
    }
    if (je === -1) return Response.json({ error: 'Incomplete' }, { status: 500 });
    var roadmap = JSON.parse(roadmapText.substring(0, je + 1));
    if (!roadmap || !roadmap.semesters) return Response.json({ error: 'Bad data' }, { status: 500 });

    try {
      var clubPrompt = 'Search for real student clubs and organizations at ' + schoolName + ' related to ' + career + '. Find real clubs that actually exist there.\n\nReturn ONLY a raw JSON array. No markdown. Format: [{"name":"real club name","type":"Professional","priority":"Essential","desc":"what they do in 8 words","url":"real URL to their page"}]\n\nFind 3-4 real clubs. Use real URLs from search results. If you cannot find a URL leave it as "". JSON array only, no other text.';

      var clubResponse = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: clubPrompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: {
            maxOutputTokens: 2048,
          },
        }),
      });

      if (clubResponse.ok) {
        var clubData = await clubResponse.json();
        var clubText = '';
        var clubCandidates = clubData.candidates || [];
        if (clubCandidates.length > 0 && clubCandidates[0].content && clubCandidates[0].content.parts) {
          for (var k = 0; k < clubCandidates[0].content.parts.length; k++) {
            if (clubCandidates[0].content.parts[k].text) {
              clubText += clubCandidates[0].content.parts[k].text;
            }
          }
        }
        clubText = clubText.trim();
        if (clubText.indexOf('```') !== -1) {
          var cm = clubText.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (cm) clubText = cm[1].trim();
        }
        var arrStart = clubText.indexOf('[');
        var arrEnd = clubText.lastIndexOf(']');
        if (arrStart !== -1 && arrEnd > arrStart) {
          var clubs = JSON.parse(clubText.substring(arrStart, arrEnd + 1));
          if (Array.isArray(clubs) && clubs.length > 0) {
            roadmap.clubs = clubs;
          }
        }
      }
    } catch(clubErr) {
      console.error('Club search failed:', clubErr.message);
    }

    if (!roadmap.clubs || roadmap.clubs.length === 0) {
      roadmap.clubs = [
        { name: 'Check ' + schoolName + ' student org directory', type: 'General', priority: 'Essential', desc: 'Find clubs on campus', url: '' }
      ];
    }

    return Response.json(roadmap);
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
