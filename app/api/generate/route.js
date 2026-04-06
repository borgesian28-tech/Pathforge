export const maxDuration = 60;

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

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

    var roadmapPrompt = 'You are a college advisor. Return ONLY valid JSON with no extra text.\n\nCreate a college roadmap at ' + schoolName + ' for ' + career + '.\n' + majorLine + '\n\nProvide 3 recommended majors that exist at ' + schoolName + ' in "recommendedMajors".\n\nUse REAL course codes from ' + schoolName + '. No placeholders like 1XX. Use real department prefixes and numbers. 3-4 credits per course. For departmentUrl use the school website URL.\n\n{"schoolFullName":"full name","major":"chosen major","careerTitle":"career title","departmentUrl":"https://school.edu/dept","recommendedMajors":["m1","m2","m3"],"semesters":[{"name":"Fall - Freshman","courses":[{"code":"ECON 110","title":"Intro Microeconomics","credits":4,"type":"Core","desc":"Supply demand fundamentals"}]},{"name":"Spring - Freshman","courses":[...]},{"name":"Fall - Sophomore","courses":[...]},{"name":"Spring - Sophomore","courses":[...]},{"name":"Fall - Junior","courses":[...]},{"name":"Spring - Junior","courses":[...]},{"name":"Fall - Senior","courses":[...]},{"name":"Spring - Senior","courses":[...]}],"clubs":[],"milestones":[{"sem":1,"label":"m1"},{"sem":2,"label":"m2"},{"sem":3,"label":"m3"},{"sem":4,"label":"m4"},{"sem":5,"label":"m5"},{"sem":6,"label":"m6"},{"sem":7,"label":"m7"},{"sem":8,"label":"m8"}],"skills":["s1","s2","s3","s4","s5"],"beyondClassroom":{"intro":"Why beyond classroom matters","technicalSkills":[{"skill":"name","why":"reason","semester":"when","resources":[{"name":"r","type":"Online Course","url":"https://url","cost":"Free","time":"10h"}]},{"skill":"name2","why":"reason2","semester":"when2","resources":[{"name":"r2","type":"Book","url":"https://url","cost":"Free","time":"5h"}]}],"networkingPlaybook":[{"phase":"p1","semester":"Fall - Freshman","actions":["a1","a2"]},{"phase":"p2","semester":"Fall - Sophomore","actions":["a1","a2"]}],"interviewPrep":[{"category":"cat","timeline":"Spring - Junior","resources":[{"name":"r","url":"https://url","desc":"d"}]}],"weeklyHabits":["h1","h2","h3"],"careerInsiderTips":["t1","t2","t3"]}}\n\n4 courses per semester. Types: Core/Prerequisite/Elective/Gen Ed. Desc under 8 words. clubs must be []. Return ONLY the JSON.';

    var roadmapResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: roadmapPrompt }] }],
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.7,
        },
      }),
    });

    if (!roadmapResponse.ok) {
      var errBody = await roadmapResponse.text();
      console.error('Gemini error:', roadmapResponse.status, errBody);
      return Response.json({ error: 'AI error: ' + roadmapResponse.status }, { status: 502 });
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

    if (!roadmapText) {
      console.error('Empty response from Gemini', JSON.stringify(roadmapData).substring(0, 500));
      return Response.json({ error: 'Empty AI response' }, { status: 500 });
    }

    roadmapText = roadmapText.trim();
    if (roadmapText.indexOf('```') !== -1) {
      var fm = roadmapText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fm) roadmapText = fm[1].trim();
    }
    var bs = roadmapText.indexOf('{');
    if (bs === -1) {
      console.error('No JSON found in response:', roadmapText.substring(0, 300));
      return Response.json({ error: 'No JSON' }, { status: 500 });
    }
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
      var clubPrompt = 'Find real student clubs at ' + schoolName + ' for ' + career + '. Return ONLY a JSON array: [{"name":"club name","type":"Professional","priority":"Essential","desc":"8 words","url":""}] Find 3-4 real clubs. JSON only.';

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
