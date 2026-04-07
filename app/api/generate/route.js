export const maxDuration = 60;

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

export async function POST(request) {
  try {
    const { schoolName, careerPath, majorName, customGoal, programLevel } = await request.json();
    if (!schoolName || (!careerPath && !customGoal)) {
      return Response.json({ error: 'Missing' }, { status: 400 });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'No key' }, { status: 500 });
    }
    const career = customGoal || careerPath;
    const major = majorName || '';
    const isMasters = programLevel === 'masters';
    const levelLabel = isMasters ? 'graduate/master\'s' : 'undergraduate';
    const numSemesters = isMasters ? 4 : 8;
    const semesterNames = isMasters
      ? '"Fall - Year 1", "Spring - Year 1", "Fall - Year 2", "Spring - Year 2"'
      : '"Fall - Freshman" to "Spring - Senior"';

    var majorLine = major ? ('Use "' + major + '" as the major.') : 'Pick the best major for ' + career + ' at ' + schoolName + '.';

    // Step 1: Search for real courses using Google Search grounding
    var searchPrompt = 'Search the web for the ' + levelLabel + ' course catalog at ' + schoolName + ' for students pursuing ' + career + '. ' + majorLine + '\n\nFind REAL ' + levelLabel + ' courses with actual course codes, titles, and credit hours from the official ' + schoolName + ' course catalog.' + (isMasters ? ' IMPORTANT: Only find GRADUATE-level courses (500+ or 600+ level). Do NOT include undergraduate courses (100-400 level). Look for the master\'s/graduate school catalog specifically, NOT the undergraduate catalog. The major should be a master\'s degree program (M.A., M.S., M.Ed., MBA, etc.), NOT a Ph.D. program.' : '') + '\n\nAlso find 3 real ' + levelLabel + ' majors/concentrations at ' + schoolName + ' relevant to ' + career + '.\n\nReturn ONLY valid JSON:\n{"schoolFullName":"","major":"","recommendedMajors":["m1","m2","m3"],"courses":[{"code":"REAL CODE","title":"Real Title","credits":3}]}\n\nFind at least ' + (isMasters ? '12' : '20') + ' real courses. Use only courses found in search results. JSON only.';

    var searchResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: searchPrompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: { maxOutputTokens: 4096, temperature: 0.2 },
      }),
    });

    var searchedCourses = [];
    var searchedMajor = major;
    var searchedMajors = [];
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
            if (searchResult.courses && Array.isArray(searchResult.courses)) searchedCourses = searchResult.courses;
            if (searchResult.major) searchedMajor = searchResult.major;
            if (searchResult.recommendedMajors) searchedMajors = searchResult.recommendedMajors;
            if (searchResult.schoolFullName) schoolFullName = searchResult.schoolFullName;
          } catch(pe) {
            console.error('Search parse error:', pe.message);
          }
        }
      }
    }

    // Step 2: Build roadmap with proper internship/recruitment timelines
    var courseList = '';
    if (searchedCourses.length > 0) {
      courseList = '\n\nVERIFIED COURSES at ' + schoolName + '. Use ONLY these exact codes and titles:\n';
      for (var cl = 0; cl < searchedCourses.length; cl++) {
        courseList += searchedCourses[cl].code + ' - ' + searchedCourses[cl].title + ' (' + (searchedCourses[cl].credits || 3) + ' cr)\n';
      }
      courseList += '\nDo NOT invent any course codes. Only pick from this list.';
    }

    var roadmapPrompt = 'You are an expert college career advisor. Return ONLY valid JSON.\n\nBuild a ' + numSemesters + '-semester ' + levelLabel + ' roadmap at ' + schoolName + ' for ' + career + ' as a ' + (searchedMajor || 'recommended') + ' major.' + courseList + '\n\nCRITICAL — RECRUITMENT & INTERNSHIP TIMELINES:\nYou must include accurate recruitment and internship application timelines in the milestones. These are industry-specific and extremely important:\n- Investment Banking / Finance: Sophomore fall — network and prep. Sophomore winter/spring — apply for junior summer internships. Junior summer — IB summer analyst internship. Senior fall — full-time recruiting.\n- Management Consulting: Junior fall — apply for summer internships. Junior summer — consulting internship. Senior fall — full-time apps.\n- Software Engineering: Sophomore summer — first internship. Junior fall — apply to top companies. Junior summer — SWE internship at target company. Senior fall — full-time recruiting.\n- Data Science: Junior year — internship recruiting. Junior summer — DS internship.\n- Pre-Med: Sophomore/Junior summers — research and clinical experience. Junior spring — MCAT prep. Senior — med school applications.\n- Pre-Law: Junior year — LSAT prep. Senior fall — law school applications.\n- Sales & Trading: Sophomore fall — network with traders. Sophomore winter — apply for S&T summer analyst programs. Junior summer — S&T internship. Senior fall — full-time offers.\n- For ALL careers: include when to start networking, when applications open, when interviews happen, and when internships occur. These milestones are the most important part of the roadmap.\n' + (isMasters ? '\nCRITICAL — This is a MASTER\'S DEGREE student (NOT a PhD, NOT undergraduate).\nYou MUST follow these rules for master\'s programs:\n- ONLY include graduate-level courses (typically 500+, 600+, or 700+ level course codes). Do NOT include any introductory or undergraduate-level courses (100-400 level).\n- The major name should say "M.A.", "M.S.", "M.Ed.", "MBA", or equivalent — NOT "Ph.D." unless the user specifically said PhD.\n- This is a 2-year professional master\'s program with 4 semesters total.\n- Internships and job search happen during the program (summer between Year 1 and Year 2).\n- Networking and recruiting starts immediately in Year 1.\n- Capstone/thesis/practicum in Year 2.\n- All milestones should reflect a 2-year graduate timeline, not a 4-year undergrad one.\n- recommendedMajors should list master\'s-level programs/concentrations available at this school, not undergrad majors.\n' : '') + '\n\n{"schoolFullName":"' + schoolFullName + '","major":"' + (searchedMajor || '') + '","careerTitle":"","departmentUrl":"","recommendedMajors":' + JSON.stringify(searchedMajors.length > 0 ? searchedMajors : [searchedMajor]) + ',"semesters":[{"name":"' + (isMasters ? 'Fall - Year 1' : 'Fall - Freshman') + '","courses":[{"code":"CODE","title":"Title","credits":3,"type":"Core","desc":"5-8 words"}]}],"clubs":[],"milestones":[{"sem":1,"label":"milestone"}],"skills":["s1","s2","s3","s4","s5"],"beyondClassroom":{"intro":"Why beyond classroom matters","technicalSkills":[{"skill":"name","why":"reason","semester":"when","resources":[{"name":"resource","type":"Online Course","url":"https://url","cost":"Free","time":"10 hours"}]},{"skill":"name2","why":"reason2","semester":"when2","resources":[{"name":"resource2","type":"Book","url":"https://url","cost":"Free","time":"5 hours"}]}],"networkingPlaybook":[{"phase":"Build Foundation","semester":"' + (isMasters ? 'Fall - Year 1' : 'Fall - Freshman') + '","actions":["a1","a2"]},{"phase":"Expand Network","semester":"' + (isMasters ? 'Spring - Year 1' : 'Fall - Sophomore') + '","actions":["a1","a2"]}],"interviewPrep":[{"category":"type","timeline":"when to start","resources":[{"name":"resource","url":"https://url","desc":"description"}]}],"weeklyHabits":["h1","h2","h3"],"careerInsiderTips":["t1","t2","t3"]}}\n\n' + numSemesters + ' semesters ' + semesterNames + '. ' + (isMasters ? '3' : '4') + ' courses each. ' + numSemesters + ' milestones that reflect real recruitment timelines. Types: Core/Prerequisite/Elective/Gen Ed. Desc under 8 words. clubs must be []. For beyondClassroom resources, use real website names and URLs where possible. JSON only.';

    var roadmapResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: roadmapPrompt }] }],
        generationConfig: { maxOutputTokens: 8192, temperature: 0.4 },
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

    if (!roadmap.recommendedMajors || roadmap.recommendedMajors.length === 0) {
      roadmap.recommendedMajors = searchedMajors.length > 0 ? searchedMajors : [roadmap.major || searchedMajor];
    }

    // Step 3: Club search
    try {
      var clubPrompt = 'Find real student clubs and organizations at ' + schoolName + ' that are DIRECTLY related to ' + career + ' and the field of ' + (searchedMajor || career) + '.\n\nCRITICAL RULES:\n- ONLY include clubs that are directly relevant to ' + career + ' or the ' + (searchedMajor || career) + ' field.\n- Do NOT include generic clubs like "Accounting Society", "Health Club", "Business Club" unless they are specifically relevant to the career path of ' + career + '.\n- For example, if someone is pursuing Education, only include education-related clubs like "Future Teachers Association", "Student Education Association", etc.\n- If you cannot find at least 2 clubs directly related to this field at ' + schoolName + ', return this exact JSON: [{"name":"Visit ' + schoolName + ' Student Organizations Directory","type":"Directory","priority":"Essential","desc":"Browse all available clubs on campus"}]\n\nReturn ONLY a JSON array: [{"name":"club name","type":"Professional","priority":"Essential","desc":"8 words max"}] Find 3-4 RELEVANT clubs only. No URLs needed. JSON only.';

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
        { name: 'Visit ' + schoolName + ' Student Organizations Directory', type: 'Directory', priority: 'Essential', desc: 'Browse all clubs at your school' }
      ];
    }

    // Step 4: School branding (colors + website domain for logo)
    try {
      var brandPrompt = 'What are the official school colors and website domain for ' + schoolFullName + ' (' + schoolName + ')?\n\nReturn ONLY valid JSON:\n{"primaryColor":"#hexcode","secondaryColor":"#hexcode","domain":"example.edu"}\n\nUse the actual official hex color codes for the school. primaryColor should be the main/darkest brand color. secondaryColor should be the accent/lighter brand color. domain should be the main .edu website domain without https://. JSON only.';

      var brandResponse = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: brandPrompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { maxOutputTokens: 512, temperature: 0.1 },
        }),
      });

      if (brandResponse.ok) {
        var brandData = await brandResponse.json();
        var brandText = '';
        var brandCandidates = brandData.candidates || [];
        if (brandCandidates.length > 0 && brandCandidates[0].content && brandCandidates[0].content.parts) {
          for (var b = 0; b < brandCandidates[0].content.parts.length; b++) {
            if (brandCandidates[0].content.parts[b].text) {
              brandText += brandCandidates[0].content.parts[b].text;
            }
          }
        }
        brandText = brandText.trim();
        if (brandText.indexOf('```') !== -1) {
          var bm = brandText.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (bm) brandText = bm[1].trim();
        }
        var bbs = brandText.indexOf('{');
        var bbe = brandText.lastIndexOf('}');
        if (bbs !== -1 && bbe > bbs) {
          var branding = JSON.parse(brandText.substring(bbs, bbe + 1));
          if (branding.primaryColor) roadmap.schoolBranding = {
            primaryColor: branding.primaryColor,
            secondaryColor: branding.secondaryColor || branding.primaryColor,
            domain: branding.domain || '',
            logoUrl: branding.domain ? 'https://www.google.com/s2/favicons?domain=' + branding.domain + '&sz=128' : '',
          };
        }
      }
    } catch(brandErr) {
      console.error('Brand search failed:', brandErr.message);
    }

    // Step 5: Salary & Outcomes data
    try {
      var outcomesPrompt = 'Find salary and career outcome data for ' + career + ' graduates from ' + schoolFullName + ' (' + schoolName + ').\n\nReturn ONLY valid JSON with this exact structure (no wrapper object):\n{"entrySalary":{"low":50000,"high":70000,"median":60000},"midSalary":{"low":80000,"high":120000,"median":100000},"seniorSalary":{"low":120000,"high":200000,"median":160000},"topEmployers":[{"name":"Company Name","type":"Industry type","roles":["Role 1","Role 2"]}],"placementRate":"95%","medianTimeToOffer":"3 months before graduation","topCities":["New York","San Francisco","Chicago"],"growthOutlook":"Description of industry growth outlook in 2-3 sentences","dailyActions":[{"semester":1,"actions":["Specific action item","Another action"]},{"semester":2,"actions":["Action for sem 2"]},{"semester":3,"actions":["Action for sem 3"]},{"semester":4,"actions":["Action for sem 4"]}' + (isMasters ? '' : ',{"semester":5,"actions":["Action for sem 5"]},{"semester":6,"actions":["Action for sem 6"]},{"semester":7,"actions":["Action for sem 7"]},{"semester":8,"actions":["Action for sem 8"]}') + ']}\n\nUse realistic salary figures for ' + career + '. topEmployers should be 5-8 real companies that recruit for ' + career + ' roles. dailyActions should have ' + numSemesters + ' entries with 3-5 specific, actionable habits per semester (e.g. "Send 2 LinkedIn requests to ' + career + ' professionals" not just "Network"). JSON only, no wrapper object.';

      var outcomesResponse = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: outcomesPrompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { maxOutputTokens: 4096, temperature: 0.3 },
        }),
      });

      if (outcomesResponse.ok) {
        var outcomesData = await outcomesResponse.json();
        var outcomesText = '';
        var outcomesCandidates = outcomesData.candidates || [];
        if (outcomesCandidates.length > 0 && outcomesCandidates[0].content && outcomesCandidates[0].content.parts) {
          for (var oi = 0; oi < outcomesCandidates[0].content.parts.length; oi++) {
            if (outcomesCandidates[0].content.parts[oi].text) {
              outcomesText += outcomesCandidates[0].content.parts[oi].text;
            }
          }
        }
        outcomesText = outcomesText.trim();
        console.log('Outcomes raw length:', outcomesText.length);
        if (outcomesText.indexOf('```') !== -1) {
          var om = outcomesText.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (om) outcomesText = om[1].trim();
        }
        var obs = outcomesText.indexOf('{');
        var obe = outcomesText.lastIndexOf('}');
        if (obs !== -1 && obe > obs) {
          var outcomesResult = JSON.parse(outcomesText.substring(obs, obe + 1));
          // Handle both wrapped {"outcomes":{...}} and unwrapped {...} formats
          if (outcomesResult.outcomes) {
            roadmap.outcomes = outcomesResult.outcomes;
          } else if (outcomesResult.entrySalary || outcomesResult.topEmployers) {
            roadmap.outcomes = outcomesResult;
          }
          console.log('Outcomes parsed successfully:', !!roadmap.outcomes);
        } else {
          console.log('Outcomes: no JSON found in response');
        }
      } else {
        console.error('Outcomes API error:', outcomesResponse.status);
      }
    } catch(outcomesErr) {
      console.error('Outcomes search failed:', outcomesErr.message);
    }

    return Response.json(roadmap);
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
