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

    // Step 1: Search for real courses and department URL using Google Search grounding
    var searchPrompt = 'Search the web for the course catalog at ' + schoolName + ' for students pursuing ' + career + '. ' + majorLine + '\n\nFind REAL courses with their actual course codes, titles, and credit hours from the official ' + schoolName + ' course catalog or registrar website. Also find the real URL to the relevant department page.\n\nAlso find 3 real majors/concentrations available at ' + schoolName + ' that are relevant to ' + career + '.\n\nReturn ONLY valid JSON in this exact format:\n{"schoolFullName":"","major":"","departmentUrl":"real verified URL","recommendedMajors":["m1","m2","m3"],"courses":[{"code":"REAL CODE","title":"Real Title","credits":3,"dept":"department"},{"code":"REAL CODE","title":"Real Title","credits":4,"dept":"department"}]}\n\nFind at least 20 real courses across different levels (intro, intermediate, advanced, elective). Use only courses you found in search results. JSON only, no other text.';

    var searchResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: searchPrompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: {
          maxOutputTokens: 4096,
          temperature: 0.2,
        },
      }),
    });

    var searchedCourses = [];
    var searchedMajor = major;
    var searchedMajors = [];
    var departmentUrl = '';
    var schoolFullName = schoolName;

    if (searchResponse.ok) {
      var searchData = await searchResponse.json();
      var searchText = '';
      var searchCandidates = searchData.candidates || [];
      if (searchCandidates.length > 0 && searchCandidates[0].content && searchCandidates[0].content.parts) {
        for (var s = 0; s < searchCandidates[0].content.parts.length; s++) {
          if (searchCandidates[0].content.parts[s].text) {
            searchText += searchCandidates[0].content.parts[s].text;
          }
        }
      }
      searchText = searchText.trim();
      if (searchText.indexOf('```') !== -1) {
        var sm = searchText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (sm) searchText = sm[1].trim();
      }
      var sbs = searchText.indexOf('{');
      if (sbs !== -1) {
        var sDepth = 0, sInStr = false, sEsc = false, sJe = -1;
        var sTxt = searchText.substring(sbs);
        for (var sj = 0; sj < sTxt.length; sj++) {
          var sc = sTxt[sj];
          if (sEsc) { sEsc = false; continue; }
          if (sc === '\\') { sEsc = true; continue; }
          if (sc === '"') { sInStr = !sInStr; continue; }
          if (sInStr) continue;
          if (sc === '{') sDepth++;
          if (sc === '}') { sDepth--; if (sDepth === 0) { sJe = sj; break; } }
        }
        if (sJe !== -1) {
          try {
            var searchResult = JSON.parse(sTxt.substring(0, sJe + 1));
            if (searchResult.courses && Array.isArray(searchResult.courses)) {
              searchedCourses = searchResult.courses;
            }
            if (searchResult.major) searchedMajor = searchResult.major;
            if (searchResult.recommendedMajors) searchedMajors = searchResult.recommendedMajors;
            if (searchResult.departmentUrl) departmentUrl = searchResult.departmentUrl;
            if (searchResult.schoolFullName) schoolFullName = searchResult.schoolFullName;
          } catch(pe) {
            console.error('Search JSON parse error:', pe.message);
          }
        }
      }
    } else {
      console.error('Search failed:', searchResponse.status);
    }

    // Step 2: Build the roadmap using the searched courses
    var courseList = '';
    if (searchedCourses.length > 0) {
      courseList = '\n\nHere are REAL verified courses at ' + schoolName + '. You MUST use these exact course codes and titles when building the semester plan. Pick from this list:\n';
      for (var cl = 0; cl < searchedCourses.length; cl++) {
        courseList += searchedCourses[cl].code + ' - ' + searchedCourses[cl].title + ' (' + (searchedCourses[cl].credits || 3) + ' cr)\n';
      }
      courseList += '\nOnly use courses from the list above. Do NOT invent any course codes.';
    }

    var roadmapPrompt = 'You are a college advisor. Return ONLY valid JSON.\n\nBuild an 8-semester roadmap at ' + schoolName + ' for ' + career + ' as a ' + (searchedMajor || 'recommended') + ' major.' + courseList + '\n\n{"schoolFullName":"' + schoolFullName + '","major":"' + (searchedMajor || '') + '","careerTitle":"","departmentUrl":"' + departmentUrl + '","recommendedMajors":' + JSON.stringify(searchedMajors.length > 0 ? searchedMajors : [searchedMajor]) + ',"semesters":[{"name":"Fall - Freshman","courses":[{"code":"CODE","title":"Title","credits":3,"type":"Core","desc":"5-8 words"}]}],"clubs":[],"milestones":[{"sem":1,"label":"milestone"}],"skills":["s1","s2","s3","s4","s5"],"beyondClassroom":{"intro":"Why beyond classroom matters for this career","technicalSkills":[{"skill":"name","why":"reason","semester":"when","resources":[{"name":"resource","type":"Online Course","url":"https://url","cost":"Free","time":"10 hours"}]},{"skill":"name2","why":"reason2","semester":"when2","resources":[{"name":"resource2","type":"Book","url":"https://url","cost":"Free","time":"5 hours"}]}],"networkingPlaybook":[{"phase":"Build Foundation","semester":"Fall - Freshman","actions":["action1","action2"]},{"phase":"Expand Network","semester":"Fall - Sophomore","actions":["action1","action2"]}],"interviewPrep":[{"category":"type","timeline":"Spring - Junior","resources":[{"name":"resource","url":"https://url","desc":"description"}]}],"weeklyHabits":["habit1","habit2","habit3"],"careerInsiderTips":["tip1","tip2","tip3"]}}\n\n8 semesters from "Fall - Freshman" to "Spring - Senior". 4 courses each. 8 milestones. Types: Core/Prerequisite/Elective/Gen Ed. Desc under 8 words. clubs must be []. JSON only.';

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
          temperature: 0.4,
        },
      }),
    });

    if (!roadmapResponse.ok) {
      var errBody = await roadmapResponse.text();
      console.error('Gemini roadmap error:', roadmapResponse.status, errBody);
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
      console.error('Empty roadmap response');
      return Response.json({ error: 'Empty AI response' }, { status: 500 });
    }

    roadmapText = roadmapText.trim();
    if (roadmapText.indexOf('```') !== -1) {
      var fm = roadmapText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fm) roadmapText = fm[1].trim();
    }
    var bs = roadmapText.indexOf('{');
    if (bs === -1) {
      console.error('No JSON in roadmap:', roadmapText.substring(0, 300));
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

    // Ensure recommendedMajors exists
    if (!roadmap.recommendedMajors || roadmap.recommendedMajors.length === 0) {
      roadmap.recommendedMajors = searchedMajors.length > 0 ? searchedMajors : [roadmap.major || searchedMajor];
    }

    // Step 3: Club search using Google Search grounding
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
