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
    var searchPrompt = 'Search the web for the ' + levelLabel + ' course catalog at ' + schoolName + ' for students pursuing ' + career + '. ' + majorLine + '\n\nFind REAL ' + levelLabel + ' courses with actual course codes, titles, and credit hours from the official ' + schoolName + ' course catalog.' + (isMasters ? ' IMPORTANT: Only find GRADUATE-level courses (500+ or 600+ level). Do NOT include undergraduate courses (100-400 level). Look for the master\'s/graduate school catalog specifically, NOT the undergraduate catalog. The major should be a master\'s degree program (M.A., M.S., M.Ed., MBA, etc.), NOT a Ph.D. program.' : '') + '\n\nCRITICAL RULES FOR COURSE CODES:\n- Every course code MUST have a real number (e.g. ECON 101, CS 201, MATH 350). \n- NEVER use placeholder codes like "4XX", "3XX", "XXX", or any code with X in it.\n- If you cannot find the exact course number, use a specific real number from the catalog.\n- Each course must have a unique, specific code — no duplicates, no placeholders.\n\nAlso find 3 real ' + levelLabel + ' majors/concentrations at ' + schoolName + ' relevant to ' + career + '.\n\nReturn ONLY valid JSON:\n{"schoolFullName":"","major":"","recommendedMajors":["m1","m2","m3"],"courses":[{"code":"REAL CODE WITH NUMBER","title":"Real Title","credits":3}]}\n\nFind at least ' + (isMasters ? '12' : '20') + ' real courses. Use only courses found in search results. JSON only.';

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
            if (searchResult.courses && Array.isArray(searchResult.courses)) {
              // Filter out placeholder codes containing X
              searchedCourses = searchResult.courses.filter(function(c) {
                return c.code && !/X/i.test(c.code.replace(/[^A-Za-z0-9]/g, '').replace(/^[A-Za-z]+/, ''));
              });
            }
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
      courseList += '\nDo NOT invent any course codes. Only pick from this list. NEVER use placeholder codes like "4XX" or "3XX" — every code must have real numbers.';
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

    // Helper functions for parallel API calls
    var geminiCall = function(prompt, useSearch, maxTokens, temp) {
      var body = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: maxTokens || 2048, temperature: temp !== undefined ? temp : 0.3 } };
      if (useSearch) body.tools = [{ google_search: {} }];
      return fetch(GEMINI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, body: JSON.stringify(body) })
        .then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; });
    };

    var extractText = function(data) {
      if (!data || !data.candidates || !data.candidates[0] || !data.candidates[0].content) return '';
      var parts = data.candidates[0].content.parts || [];
      var txt = '';
      for (var p = 0; p < parts.length; p++) { if (parts[p].text) txt += parts[p].text; }
      return txt.trim();
    };

    var cleanJson = function(text) {
      if (!text) return '';
      if (text.indexOf('```') !== -1) { var m = text.match(/```(?:json)?\s*([\s\S]*?)```/); if (m) text = m[1].trim(); }
      return text;
    };

    var parseJsonObj = function(text) {
      var start = text.indexOf('{');
      if (start === -1) return null;
      var d = 0, inS = false, esc = false, end = -1, t = text.substring(start);
      for (var i = 0; i < t.length; i++) {
        var c = t[i];
        if (esc) { esc = false; continue; }
        if (c === '\\') { esc = true; continue; }
        if (c === '"') { inS = !inS; continue; }
        if (inS) continue;
        if (c === '{') d++; if (c === '}') { d--; if (d === 0) { end = i; break; } }
      }
      if (end === -1) return null;
      return JSON.parse(t.substring(0, end + 1));
    };

    // Build all course codes for professor search
    var allCourses = [];
    for (var si = 0; si < roadmap.semesters.length; si++) {
      var sem = roadmap.semesters[si];
      if (sem.courses) {
        for (var ci = 0; ci < sem.courses.length; ci++) {
          allCourses.push(sem.courses[ci].code + ' - ' + sem.courses[ci].title);
        }
      }
    }

    // Define all prompts
    var clubPrompt = 'Find real student clubs at ' + schoolName + ' DIRECTLY related to ' + career + ' and ' + (searchedMajor || career) + '.\n\nRULES:\n- ONLY clubs directly relevant to ' + career + '.\n- No generic clubs unless specifically relevant.\n- If fewer than 2 relevant clubs found, return: [{"name":"Visit ' + schoolName + ' Student Organizations Directory","type":"Directory","priority":"Essential","desc":"Browse all available clubs on campus"}]\n\nReturn ONLY JSON array: [{"name":"club","type":"Professional","priority":"Essential","desc":"8 words max"}] 3-4 clubs. JSON only.';

    var brandPrompt = 'Official school colors and website for ' + schoolFullName + ' (' + schoolName + ')?\n\nReturn ONLY JSON:\n{"primaryColor":"#hex","secondaryColor":"#hex","domain":"school.edu"}\n\nprimaryColor = main/dark brand color. secondaryColor = accent/lighter. domain = .edu domain without https://. JSON only.';

    var outcomesPrompt = 'Salary and career data specifically for ' + career + ' roles.\n\nCRITICAL RULES:\n- topEmployers MUST be companies that actually hire for ' + career + ' roles specifically. For Investment Banking, only list investment banks (Goldman Sachs, Morgan Stanley, JPMorgan, etc.) — NOT consulting firms, NOT tech companies. For Software Engineering, list tech companies. Match employers to the EXACT career path.\n- topCities MUST be major job market cities where ' + career + ' jobs are concentrated (e.g. New York, London, San Francisco) — NOT the city where ' + schoolName + ' is located unless it is genuinely a major hub for ' + career + '.\n- Salary data should reflect ' + career + ' compensation specifically, not general graduate salaries.\n\nReturn ONLY JSON (no wrapper):\n{"entrySalary":{"low":50000,"high":70000,"median":60000},"midSalary":{"low":80000,"high":120000,"median":100000},"seniorSalary":{"low":120000,"high":200000,"median":160000},"topEmployers":[{"name":"Company","type":"Industry","roles":["Role"]}],"placementRate":"95%","medianTimeToOffer":"3 months before graduation","topCities":["City1","City2","City3"],"growthOutlook":"2-3 sentence outlook","dailyActions":[' + Array.from({length: numSemesters}, function(_, i) { return '{"semester":' + (i+1) + ',"actions":["action1","action2","action3"]}'; }).join(',') + ']}\n\n5-8 real employers that specifically hire ' + career + ' professionals. ' + numSemesters + ' semester entries with 3-5 specific tactical daily habits each. JSON only.';

    var profPrompt = 'Search for highly-rated professors at ' + schoolName + ' who teach these courses:\n' + allCourses.join('\n') + '\n\nFor each course, find the best-rated professor using RateMyProfessors or similar sources.\n\nReturn ONLY JSON array:\n[{"code":"COURSE CODE","professor":"Prof. Name","rating":4.5,"difficulty":3.2,"tags":["Helpful","Clear lectures"]}]\n\nUse real professor names found in search results. rating is out of 5.0. difficulty is out of 5.0. tags are 1-2 word descriptions. If you cannot find a professor for a course, skip it. JSON only.';

    // Fire ALL calls in parallel
    var results = await Promise.all([
      geminiCall(clubPrompt, true, 2048),
      geminiCall(brandPrompt, true, 512),
      geminiCall(outcomesPrompt, true, 4096, 0.1),
      geminiCall(profPrompt, true, 4096),
    ]);

    // Parse clubs
    try {
      var clubText = cleanJson(extractText(results[0]));
      var arrS = clubText.indexOf('['), arrE = clubText.lastIndexOf(']');
      if (arrS !== -1 && arrE > arrS) {
        var clubs = JSON.parse(clubText.substring(arrS, arrE + 1));
        if (Array.isArray(clubs) && clubs.length > 0) roadmap.clubs = clubs;
      }
    } catch(e) { console.error('Club parse:', e.message); }

    if (!roadmap.clubs || roadmap.clubs.length === 0) {
      roadmap.clubs = [{ name: 'Visit ' + schoolName + ' Student Organizations Directory', type: 'Directory', priority: 'Essential', desc: 'Browse all clubs at your school' }];
    }

    // Parse branding
    try {
      var brandText = cleanJson(extractText(results[1]));
      var branding = parseJsonObj(brandText);
      if (branding && branding.primaryColor) {
        roadmap.schoolBranding = {
          primaryColor: branding.primaryColor,
          secondaryColor: branding.secondaryColor || branding.primaryColor,
          domain: branding.domain || '',
          logoUrl: branding.domain ? 'https://www.google.com/s2/favicons?domain=' + branding.domain + '&sz=128' : '',
        };
      }
    } catch(e) { console.error('Brand parse:', e.message); }

    // Parse outcomes
    try {
      var outText = cleanJson(extractText(results[2]));
      console.log('Outcomes raw length:', outText.length);
      var outObj = parseJsonObj(outText);
      if (outObj) {
        if (outObj.outcomes) roadmap.outcomes = outObj.outcomes;
        else if (outObj.entrySalary || outObj.topEmployers) roadmap.outcomes = outObj;
        console.log('Outcomes parsed:', !!roadmap.outcomes);
      }
    } catch(e) { console.error('Outcomes parse:', e.message); }

    // Parse professors and attach to courses
    try {
      var profText = cleanJson(extractText(results[3]));
      console.log('Prof raw length:', profText.length);
      var pArrS = profText.indexOf('['), pArrE = profText.lastIndexOf(']');
      if (pArrS !== -1 && pArrE > pArrS) {
        var profs = JSON.parse(profText.substring(pArrS, pArrE + 1));
        if (Array.isArray(profs)) {
          // Build lookup by normalized course code
          var profMap = {};
          for (var pi = 0; pi < profs.length; pi++) {
            if (profs[pi].code) {
              // Normalize: uppercase, remove all spaces, dashes, dots
              var normCode = profs[pi].code.toUpperCase().replace(/[\s\-\.]/g, '');
              profMap[normCode] = profs[pi];
              // Also store with single space between letters and numbers (e.g. "ECON101" and "ECON 101")
              var spaced = profs[pi].code.toUpperCase().replace(/\s+/g, ' ').trim();
              profMap[spaced] = profs[pi];
            }
          }
          // Attach to semester courses
          var matchCount = 0;
          for (var si2 = 0; si2 < roadmap.semesters.length; si2++) {
            if (roadmap.semesters[si2].courses) {
              for (var ci2 = 0; ci2 < roadmap.semesters[si2].courses.length; ci2++) {
                var courseCode = roadmap.semesters[si2].courses[ci2].code;
                var normC = courseCode.toUpperCase().replace(/[\s\-\.]/g, '');
                var spacedC = courseCode.toUpperCase().replace(/\s+/g, ' ').trim();
                var match = profMap[normC] || profMap[spacedC];
                if (match) {
                  roadmap.semesters[si2].courses[ci2].professor = match.professor;
                  roadmap.semesters[si2].courses[ci2].profRating = parseFloat(match.rating) || 0;
                  roadmap.semesters[si2].courses[ci2].profDifficulty = parseFloat(match.difficulty) || 0;
                  roadmap.semesters[si2].courses[ci2].profTags = match.tags || [];
                  matchCount++;
                }
              }
            }
          }
          console.log('Prof matched:', matchCount, 'of', profs.length);
        }
      }
    } catch(e) { console.error('Prof parse:', e.message); }

    return Response.json(roadmap);
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
