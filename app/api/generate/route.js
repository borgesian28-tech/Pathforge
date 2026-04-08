export const maxDuration = 60;

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

export async function POST(request) {
  try {
    const { schoolName, careerPath, majorName, customGoal, programLevel, catalogUrl, clubsUrl } = await request.json();
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

    // If user provided a catalog URL, use Gemini's Google Search grounding to visit it
    var catalogContent = '';
    var hasCatalogUrl = catalogUrl && catalogUrl.trim();
    
    if (hasCatalogUrl) {
      var cleanUrl = catalogUrl.trim().replace(/\?.*$/, '');
      catalogContent = '\n\nCRITICAL — REAL SCHOOL CATALOG:\nThe student provided their school\'s course catalog URL: ' + cleanUrl + '\n\nYou MUST:\n1. Search and visit this URL: ' + cleanUrl + '\n2. Look for any linked PDF documents (often "Course Catalog", "Curriculum Pathways", "Course of Studies", "Bulletin")\n3. Search for and read those PDFs to find REAL course codes and titles\n4. Use ONLY course codes and titles that actually exist at this school\n5. Do NOT use placeholder codes like "ECON 3XX" or generic names like "Elective Course"\n6. Match exact course codes (e.g. ECON 111, MATH 205, CS 201) and exact titles from the catalog\n\nEvery course in your response must be a real course from this specific school\'s catalog. Search thoroughly.\n';
    }

    // Step 1: Search for real courses using TWO parallel searches — one for intro/core, one for advanced/upper-division
    var commonRules = '\n\nCRITICAL RULES FOR COURSE CODES:\n- Every course code MUST have a real number (e.g. ECON 101, CS 201, MATH 350).\n- NEVER use placeholder codes like "4XX", "3XX", "XXX", or any code with X in it.\n- If you cannot find the exact course number, pick a specific real number you found in the catalog.\n- Each course must have a unique, specific code — no duplicates, no placeholders.\n\nReturn ONLY valid JSON:\n{"courses":[{"code":"REAL CODE WITH NUMBER","title":"Real Title","credits":3}]}\n\nUse only courses found in search results. JSON only.';

    var mastersNote = isMasters ? ' IMPORTANT: Only find GRADUATE-level courses (500+ or 600+ level). Do NOT include undergraduate courses (100-400 level). Look for the master\'s/graduate school catalog specifically.' : '';

    var searchPrompt1 = 'Search the web for the ' + levelLabel + ' course catalog at ' + schoolName + ' for students pursuing ' + career + '. ' + majorLine + catalogContent + '\n\nFind REAL ' + (isMasters ? 'introductory graduate' : 'introductory and foundational (100-200 level)') + ' courses — prerequisites, core requirements, and general education courses from the official ' + schoolName + ' course catalog.' + mastersNote + '\n\nAlso find 3 real ' + levelLabel + ' majors/concentrations at ' + schoolName + ' relevant to ' + career + ' and the school\'s full official name.\n\nReturn ONLY valid JSON:\n{"schoolFullName":"","major":"","recommendedMajors":["m1","m2","m3"],"courses":[{"code":"REAL CODE WITH NUMBER","title":"Real Title","credits":3}]}\n\nFind at least ' + (isMasters ? '8' : '12') + ' real courses.' + commonRules;

    var searchPrompt2 = 'Search the web for ADVANCED and UPPER-DIVISION courses at ' + schoolName + ' for ' + (searchedMajor || major || career) + ' majors. ' + catalogContent + '\n\nFind REAL ' + (isMasters ? 'advanced graduate (600+ or 700+ level)' : 'upper-division (300-400 level)') + ' courses — advanced electives, seminars, capstone courses, senior thesis courses, specialized topics, and concentration-specific courses from the official ' + schoolName + ' course catalog.' + mastersNote + '\n\nFocus specifically on:\n- Advanced electives and specialization courses\n- Seminar courses\n- Capstone or senior project courses\n- Research methods courses\n- Courses typically taken in junior/senior year\n\nFind at least ' + (isMasters ? '8' : '12') + ' real UPPER-DIVISION courses.' + commonRules;

    // Fire both searches in parallel
    var searchBody = function(prompt) {
      return {
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: { maxOutputTokens: 4096, temperature: 0.2 },
      };
    };

    var [searchResponse1, searchResponse2] = await Promise.all([
      fetch(GEMINI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, body: JSON.stringify(searchBody(searchPrompt1)) }),
      fetch(GEMINI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, body: JSON.stringify(searchBody(searchPrompt2)) }),
    ]);

    var searchedCourses = [];
    var searchedMajor = major;
    var searchedMajors = [];
    var schoolFullName = schoolName;

    // Helper to extract text from Gemini response
    var extractSearchText = function(response) {
      var text = '';
      var cands = response.candidates || [];
      if (cands.length > 0 && cands[0].content && cands[0].content.parts) {
        for (var p = 0; p < cands[0].content.parts.length; p++) {
          if (cands[0].content.parts[p].text) text += cands[0].content.parts[p].text;
        }
      }
      return text.trim();
    };

    // Helper to parse JSON from response text
    var extractJsonObj = function(text) {
      if (!text) return null;
      if (text.indexOf('```') !== -1) { var m = text.match(/```(?:json)?\s*([\s\S]*?)```/); if (m) text = m[1].trim(); }
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
      try { return JSON.parse(t.substring(0, end + 1)); } catch(e) { return null; }
    };

    // Filter function for valid course codes
    var isValidCode = function(c) {
      if (!c.code) return false;
      if (/X/i.test(c.code)) return false;
      var numPart = c.code.replace(/[^0-9]/g, '');
      return numPart.length > 0;
    };

    // Parse search 1 (intro/core courses + metadata)
    if (searchResponse1.ok) {
      var data1 = await searchResponse1.json();
      var result1 = extractJsonObj(extractSearchText(data1));
      if (result1) {
        if (result1.courses && Array.isArray(result1.courses)) {
          searchedCourses = result1.courses.filter(isValidCode);
        }
        if (result1.major) searchedMajor = result1.major;
        if (result1.recommendedMajors) searchedMajors = result1.recommendedMajors;
        if (result1.schoolFullName) schoolFullName = result1.schoolFullName;
      }
    }

    // Parse search 2 (advanced/upper-division courses) and merge
    if (searchResponse2.ok) {
      var data2 = await searchResponse2.json();
      var result2 = extractJsonObj(extractSearchText(data2));
      if (result2 && result2.courses && Array.isArray(result2.courses)) {
        var advancedCourses = result2.courses.filter(isValidCode);
        // Deduplicate — don't add courses we already have
        var existingCodes = {};
        for (var ec = 0; ec < searchedCourses.length; ec++) {
          existingCodes[searchedCourses[ec].code.toUpperCase()] = true;
        }
        for (var ac = 0; ac < advancedCourses.length; ac++) {
          if (!existingCodes[advancedCourses[ac].code.toUpperCase()]) {
            searchedCourses.push(advancedCourses[ac]);
            existingCodes[advancedCourses[ac].code.toUpperCase()] = true;
          }
        }
      }
    }

    console.log('Found ' + searchedCourses.length + ' verified courses (' + searchedCourses.filter(function(c) { var n = parseInt(c.code.replace(/[^0-9]/g, '')); return n >= 300; }).length + ' upper-division)');

    // Step 2: Build roadmap with proper internship/recruitment timelines
    var courseList = '';
    if (searchedCourses.length > 0) {
      courseList = '\n\nVERIFIED COURSES at ' + schoolName + '. Use ONLY these exact codes and titles:\n';
      for (var cl = 0; cl < searchedCourses.length; cl++) {
        courseList += searchedCourses[cl].code + ' - ' + searchedCourses[cl].title + ' (' + (searchedCourses[cl].credits || 3) + ' cr)\n';
      }
      courseList += '\nDo NOT invent any course codes. Only pick from this list. NEVER use placeholder codes like "4XX" or "3XX" — every code must have real numbers. If you run out of courses from this list, DO NOT make up new ones — instead reuse an elective slot with a course from this list.';
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

    // STRICT: Filter out any XXX/placeholder course codes from the roadmap itself
    for (var fi = 0; fi < roadmap.semesters.length; fi++) {
      if (roadmap.semesters[fi].courses) {
        roadmap.semesters[fi].courses = roadmap.semesters[fi].courses.filter(function(c) {
          if (!c.code) return true;
          // Remove codes with XX, XXX, or any X placeholder pattern
          if (/[Xx]{2,}/.test(c.code)) return false;
          // Remove codes where the number part contains X
          var numPart = c.code.replace(/^[A-Za-z\s]+/, '');
          if (/[Xx]/.test(numPart)) return false;
          return true;
        });
      }
    }

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

    // Define all prompts
    var clubsUrlContent = '';
    if (clubsUrl && clubsUrl.trim()) {
      clubsUrlContent = '\n\nCRITICAL — REAL CLUBS DIRECTORY:\nThe student provided their school\'s clubs/organizations directory URL: ' + clubsUrl.trim() + '\nYou MUST search and visit this URL to find REAL student clubs at this school. Only include clubs that actually exist at this school.\n';
    }

    var clubPrompt = 'Find real student clubs at ' + schoolName + ' DIRECTLY related to ' + career + ' and ' + (searchedMajor || career) + '.' + clubsUrlContent + '\n\nRULES:\n- ONLY clubs directly relevant to ' + career + '.\n- No generic clubs unless specifically relevant.\n- If fewer than 2 relevant clubs found, return: [{"name":"Visit ' + schoolName + ' Student Organizations Directory","type":"Directory","priority":"Essential","desc":"Browse all available clubs on campus"}]\n\nReturn ONLY JSON array: [{"name":"club","type":"Professional","priority":"Essential","desc":"8 words max"}] 3-4 clubs. JSON only.';

    var brandPrompt = 'Official school colors and website for ' + schoolFullName + ' (' + schoolName + ')?\n\nReturn ONLY JSON:\n{"primaryColor":"#hex","secondaryColor":"#hex","domain":"school.edu"}\n\nprimaryColor = main/dark brand color. secondaryColor = accent/lighter. domain = .edu domain without https://. JSON only.';

    var outcomesPrompt = 'Salary and career data specifically for ' + career + ' roles.\n\nCRITICAL RULES:\n- topEmployers MUST be companies that actually hire for ' + career + ' roles specifically. For Investment Banking, only list investment banks (Goldman Sachs, Morgan Stanley, JPMorgan, etc.) — NOT consulting firms, NOT tech companies. For Software Engineering, list tech companies. Match employers to the EXACT career path.\n- topCities MUST be major job market cities where ' + career + ' jobs are concentrated (e.g. New York, London, San Francisco) — NOT the city where ' + schoolName + ' is located unless it is genuinely a major hub for ' + career + '.\n- Salary data should reflect ' + career + ' compensation specifically, not general graduate salaries.\n\nReturn ONLY JSON (no wrapper):\n{"entrySalary":{"low":50000,"high":70000,"median":60000},"midSalary":{"low":80000,"high":120000,"median":100000},"seniorSalary":{"low":120000,"high":200000,"median":160000},"topEmployers":[{"name":"Company","type":"Industry","roles":["Role"]}],"placementRate":"95%","medianTimeToOffer":"3 months before graduation","topCities":["City1","City2","City3"],"growthOutlook":"2-3 sentence outlook","dailyActions":[' + Array.from({length: numSemesters}, function(_, i) { return '{"semester":' + (i+1) + ',"actions":["action1","action2","action3"]}'; }).join(',') + ']}\n\n5-8 real employers that specifically hire ' + career + ' professionals. ' + numSemesters + ' semester entries with 3-5 specific tactical daily habits each.\n\nCRITICAL FOR dailyActions: These actions are for a CURRENT COLLEGE STUDENT who is STILL IN SCHOOL, NOT a working professional. Do NOT include actions like "manage analysts", "oversee work product", "take on client interaction", "lead deal teams", or anything about being an analyst/associate/employee. Instead, focus on what a STUDENT should do each day/week: study habits, networking with alumni, attending info sessions, practicing for interviews, joining clubs, reading industry news, building technical skills, applying for internships, etc. The student has NOT graduated yet.';

    // Fire all calls in parallel — all at temperature 0.1 for consistency
    var results = await Promise.all([
      geminiCall(clubPrompt, true, 2048, 0.1),
      geminiCall(brandPrompt, true, 512, 0.1),
      geminiCall(outcomesPrompt, true, 4096, 0.1),
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

    // Parse outcomes - ensure we always have valid outcomes data
    try {
      var outText = cleanJson(extractText(results[2]));
      var outObj = parseJsonObj(outText);
      if (outObj) {
        if (outObj.outcomes) roadmap.outcomes = outObj.outcomes;
        else if (outObj.entrySalary || outObj.topEmployers) roadmap.outcomes = outObj;
      }
    } catch(e) { console.error('Outcomes parse:', e.message); }
    
    // Fallback if outcomes failed to parse
    if (!roadmap.outcomes) {
      roadmap.outcomes = {
        entrySalary: { low: 45000, high: 65000, median: 55000 },
        midSalary: { low: 75000, high: 110000, median: 90000 },
        seniorSalary: { low: 110000, high: 180000, median: 140000 },
        topEmployers: [{ name: 'Data unavailable', type: 'N/A', roles: ['See career services'] }],
        placementRate: 'N/A',
        medianTimeToOffer: 'N/A',
        topCities: ['New York', 'San Francisco', 'Chicago'],
        growthOutlook: 'Career data could not be loaded. Please regenerate your roadmap or consult your career services office.',
        dailyActions: Array.from({length: numSemesters}, function(_, i) { 
          return {semester: i+1, actions: ['Review course material', 'Network with peers', 'Build relevant skills']}; 
        })
      };
    }

    return Response.json(roadmap);
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
