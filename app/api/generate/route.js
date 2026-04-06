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
    const major = majorName || '';

    var majorLine = major ? ('Use "' + major + '" as the major.') : 'Pick the best major for ' + career + ' at ' + schoolName + '.';

    var roadmapPrompt = 'Return ONLY raw JSON.\n\nCollege roadmap at ' + schoolName + ' for ' + career + '.\n\n' + majorLine + ' Provide 3 recommended majors that exist at this school in "recommendedMajors".\n\nIMPORTANT: Use REAL course codes from ' + schoolName + '. Do not use placeholder codes like 1XX or 2XX. Use actual department prefixes and real course numbers. Each course needs 3 or 4 credits. For departmentUrl use the real department webpage URL at this school.\n\nJSON structure:\n{"schoolFullName":"","major":"","careerTitle":"","departmentUrl":"","recommendedMajors":["","",""],"semesters":[{"name":"Fall - Freshman","courses":[{"code":"ECON 110","title":"Intro Microeconomics","credits":4,"type":"Core","desc":"Supply and demand fundamentals"}]}],"clubs":[],"milestones":[{"sem":1,"label":"milestone text"}],"skills":["skill1","skill2","skill3","skill4","skill5"],"beyondClassroom":{"intro":"Why this matters","technicalSkills":[{"skill":"name","why":"reason","semester":"Fall - Freshman","resources":[{"name":"resource","type":"Online Course","url":"https://example.com","cost":"Free","time":"10 hours"}]},{"skill":"name2","why":"reason2","semester":"Spring - Freshman","resources":[{"name":"resource2","type":"Book","url":"https://example.com","cost":"Free","time":"5 hours"}]}],"networkingPlaybook":[{"phase":"phase1","semester":"Fall - Freshman","actions":["action1","action2"]},{"phase":"phase2","semester":"Fall - Sophomore","actions":["action1","action2"]}],"interviewPrep":[{"category":"type","timeline":"Spring - Junior","resources":[{"name":"resource","url":"https://example.com","desc":"description"}]}],"weeklyHabits":["habit1","habit2","habit3"],"careerInsiderTips":["tip1","tip2","tip3"]}}\n\n8 semesters: "Fall - Freshman" thru "Spring - Senior". 4 courses each. Types: Core/Prerequisite/Elective/Gen Ed. Desc under 8 words. 8 milestones. Leave clubs as []. Nothing after closing brace.';

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
          temperature: 0.7,
        },
      }),
    });

    if (!roadmapResponse.ok) {
      var errBody = await roadmapResponse.text();
      console.error('Gemini error:', roadmapResponse.status, errBody);
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

    // Club search using Gemini with Google Search grounding
    try {
      var clubPrompt = 'Search for real student clubs at ' + schoolName + ' related to ' + career + '.\n\nReturn ONLY a JSON array: [{"name":"real club name","type":"Professional","priority":"Essential","desc":"8 word description","url":"real URL or empty string"}]\n\nFind 3-4 real clubs. JSON array only.';

      var clubResponse = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: clubPrompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { maxOutputTokens: 2048 },
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
