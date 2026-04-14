export const maxDuration = 60;

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

export async function POST(request) {
  try {
    const { schoolName, careerPath, majorName, customGoal, programLevel, catalogUrl } = await request.json();
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

    var roadmapPrompt = 'You are an expert college career advisor. Return ONLY valid JSON.\n\nBuild a ' + numSemesters + '-semester ' + levelLabel + ' roadmap at ' + schoolName + ' for ' + career + ' as a ' + (searchedMajor || 'recommended') + ' major.' + courseList + '\n\nCRITICAL — RECRUITMENT & INTERNSHIP TIMELINES:\nYou must include accurate recruitment and internship application timelines in the milestones. These are industry-specific and extremely important:\n- Investment Banking / Finance: Sophomore fall — network and prep. Sophomore winter/spring — apply for junior summer internships. Junior summer — IB summer analyst internship. Senior fall — full-time recruiting.\n- Management Consulting: Junior fall — apply for summer internships. Junior summer — consulting internship. Senior fall — full-time apps.\n- Software Engineering: Sophomore summer — first internship. Junior fall — apply to top companies. Junior summer — SWE internship at target company. Senior fall — full-time recruiting.\n- Data Science: Junior year — internship recruiting. Junior summer — DS internship.\n- Pre-Med: Sophomore/Junior summers — research and clinical experience. Junior spring — MCAT prep. Senior — med school applications.\n- Pre-Law: Junior year — LSAT prep. Senior fall — law school applications.\n- Sales & Trading: Sophomore fall — network with traders. Sophomore winter — apply for S&T summer analyst programs. Junior summer — S&T internship. Senior fall — full-time offers.\n- For ALL careers: include when to start networking, when applications open, when interviews happen, and when internships occur. These milestones are the most important part of the roadmap.\n' + (isMasters ? '\nCRITICAL — This is a MASTER\'S DEGREE student (NOT a PhD, NOT undergraduate).\nYou MUST follow these rules for master\'s programs:\n- ONLY include graduate-level courses (typically 500+, 600+, or 700+ level course codes). Do NOT include any introductory or undergraduate-level courses (100-400 level).\n- The major name should say "M.A.", "M.S.", "M.Ed.", "MBA", or equivalent — NOT "Ph.D." unless the user specifically said PhD.\n- This is a 2-year professional master\'s program with 4 semesters total.\n- Internships and job search happen during the program (summer between Year 1 and Year 2).\n- Networking and recruiting starts immediately in Year 1.\n- Capstone/thesis/practicum in Year 2.\n- All milestones should reflect a 2-year graduate timeline, not a 4-year undergrad one.\n- recommendedMajors should list master\'s-level programs/concentrations available at this school, not undergrad majors.\n' : '') + '\n\n{"schoolFullName":"' + schoolFullName + '","major":"' + (searchedMajor || '') + '","careerTitle":"","departmentUrl":"","recommendedMajors":' + JSON.stringify(searchedMajors.length > 0 ? searchedMajors : [searchedMajor]) + ',"semesters":[{"name":"' + (isMasters ? 'Fall - Year 1' : 'Fall - Freshman') + '","courses":[{"code":"CODE","title":"Title","credits":3,"type":"Core","desc":"5-8 words"}]}],"clubs":[],"milestones":[{"sem":1,"label":"milestone"}],"skills":["s1","s2","s3","s4","s5"],"beyondClassroom":{"intro":"Why beyond classroom matters","technicalSkills":[{"skill":"name","why":"reason","semester":"when","resources":[{"name":"resource","type":"Online Course","url":"https://url","cost":"Free","time":"10 hours"}]},{"skill":"name2","why":"reason2","semester":"when2","resources":[{"name":"resource2","type":"Book","url":"https://url","cost":"Free","time":"5 hours"}]}],"networkingPlaybook":[{"phase":"Build Foundation","semester":"' + (isMasters ? 'Fall - Year 1' : 'Fall - Freshman') + '","actions":["a1","a2"]},{"phase":"Expand Network","semester":"' + (isMasters ? 'Spring - Year 1' : 'Fall - Sophomore') + '","actions":["a1","a2"]}],"interviewPrep":[{"category":"type","timeline":"when to start","resources":[{"name":"resource","url":"https://url","desc":"description"}]}],"weeklyHabits":["h1","h2","h3"],"careerInsiderTips":["t1","t2","t3"]}}\n\n' + numSemesters + ' semesters ' + semesterNames + '. ' + (isMasters ? '3' : '4') + ' courses each. ' + numSemesters + ' milestones that reflect real recruitment timelines. Types: Core/Prerequisite/Elective/Gen Ed. Desc under 8 words. clubs must be []. For beyondClassroom resources, ONLY use URLs from these well-known platforms you are certain exist: coursera.org, udemy.com, edx.org, linkedin.com/learning, youtube.com, leetcode.com, hackerrank.com, kaggle.com, github.com, khanacademy.org, codecademy.com, pluralsight.com, udacity.com, brilliant.org, investopedia.com, wolframalpha.com. If a resource is a book or not on these platforms, set url to an empty string "". Never invent or guess URLs. JSON only.';

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

    // Hardcoded reliable career outcome data - used as fallback or supplement
    var CAREER_OUTCOMES = {
      'Investment Banking': { entrySalary: {low:85000,high:110000,median:95000}, midSalary: {low:200000,high:400000,median:300000}, seniorSalary: {low:500000,high:2000000,median:800000}, topEmployers: [{name:'Goldman Sachs',type:'Bulge Bracket',roles:['Analyst','Associate']},{name:'Morgan Stanley',type:'Bulge Bracket',roles:['Analyst','Associate']},{name:'JPMorgan Chase',type:'Bulge Bracket',roles:['Analyst','Associate']},{name:'Bank of America',type:'Bulge Bracket',roles:['Analyst']},{name:'Citi',type:'Bulge Bracket',roles:['Analyst']},{name:'Evercore',type:'Elite Boutique',roles:['Analyst']},{name:'Lazard',type:'Elite Boutique',roles:['Analyst']},{name:'Moelis & Co',type:'Elite Boutique',roles:['Analyst']}], placementRate:'85-95%', medianTimeToOffer:'Senior fall', topCities:['New York','San Francisco','Chicago','London','Houston'], growthOutlook:'Investment banking remains highly competitive with strong compensation. Dealflow is cyclical but the career path to private equity, hedge funds, or corporate development is well-established.' },
      'Software Engineering': { entrySalary: {low:90000,high:150000,median:120000}, midSalary: {low:150000,high:300000,median:200000}, seniorSalary: {low:250000,high:600000,median:400000}, topEmployers: [{name:'Google',type:'Big Tech',roles:['SWE','SRE']},{name:'Apple',type:'Big Tech',roles:['SWE']},{name:'Microsoft',type:'Big Tech',roles:['SWE']},{name:'Meta',type:'Big Tech',roles:['SWE']},{name:'Amazon',type:'Big Tech',roles:['SDE']},{name:'Netflix',type:'Big Tech',roles:['SWE']},{name:'Stripe',type:'Fintech',roles:['SWE']},{name:'Databricks',type:'AI/Data',roles:['SWE']}], placementRate:'90-95%', medianTimeToOffer:'3-6 months before graduation', topCities:['San Francisco','Seattle','New York','Austin','Boston'], growthOutlook:'Software engineering demand continues to grow with AI/ML driving new opportunities. Remote work has expanded geographic options. Strong fundamentals in CS remain essential.' },
      'Management Consulting': { entrySalary: {low:80000,high:105000,median:95000}, midSalary: {low:150000,high:250000,median:190000}, seniorSalary: {low:300000,high:800000,median:500000}, topEmployers: [{name:'McKinsey & Company',type:'MBB',roles:['Analyst','Associate']},{name:'Boston Consulting Group',type:'MBB',roles:['Analyst','Consultant']},{name:'Bain & Company',type:'MBB',roles:['Analyst','Consultant']},{name:'Deloitte Consulting',type:'Big 4',roles:['Analyst','Consultant']},{name:'Accenture',type:'Global',roles:['Analyst']},{name:'Oliver Wyman',type:'Tier 2',roles:['Analyst']}], placementRate:'80-90%', medianTimeToOffer:'Senior fall', topCities:['New York','Chicago','Boston','San Francisco','Washington DC'], growthOutlook:'Consulting remains a strong entry point for business careers with excellent exit opportunities to industry, private equity, and startups.' },
      'Data Science': { entrySalary: {low:80000,high:120000,median:100000}, midSalary: {low:130000,high:200000,median:160000}, seniorSalary: {low:180000,high:350000,median:250000}, topEmployers: [{name:'Google',type:'Big Tech',roles:['Data Scientist']},{name:'Meta',type:'Big Tech',roles:['Data Scientist']},{name:'Amazon',type:'Big Tech',roles:['Data Scientist']},{name:'Netflix',type:'Big Tech',roles:['Data Scientist']},{name:'Spotify',type:'Tech',roles:['Data Scientist']},{name:'Two Sigma',type:'Quant Finance',roles:['Data Scientist']}], placementRate:'85-92%', medianTimeToOffer:'3-5 months before graduation', topCities:['San Francisco','New York','Seattle','Boston','Austin'], growthOutlook:'Data science continues to evolve rapidly with AI/ML integration. Strong demand for professionals who combine statistical rigor with engineering skills.' },
      'Pre-Med / Medicine': { entrySalary: {low:55000,high:65000,median:60000}, midSalary: {low:200000,high:350000,median:275000}, seniorSalary: {low:300000,high:600000,median:400000}, topEmployers: [{name:'Mayo Clinic',type:'Academic Medical Center',roles:['Resident','Fellow']},{name:'Johns Hopkins Hospital',type:'Academic Medical Center',roles:['Resident']},{name:'Cleveland Clinic',type:'Academic Medical Center',roles:['Resident']},{name:'Massachusetts General Hospital',type:'Academic Medical Center',roles:['Resident']},{name:'UCSF Medical Center',type:'Academic Medical Center',roles:['Resident']}], placementRate:'93% match rate', medianTimeToOffer:'Match Day (March of senior year of med school)', topCities:['Boston','New York','Houston','Philadelphia','Chicago'], growthOutlook:'Healthcare demand is projected to grow significantly. Physician shortages in many specialties create strong job security. Medical school is a long but rewarding path.' },
      'Pre-Law / Law': { entrySalary: {low:70000,high:215000,median:100000}, midSalary: {low:120000,high:350000,median:200000}, seniorSalary: {low:200000,high:1000000,median:400000}, topEmployers: [{name:'Cravath, Swaine & Moore',type:'BigLaw',roles:['Associate']},{name:'Wachtell, Lipton',type:'BigLaw',roles:['Associate']},{name:'Sullivan & Cromwell',type:'BigLaw',roles:['Associate']},{name:'Skadden, Arps',type:'BigLaw',roles:['Associate']},{name:'Davis Polk',type:'BigLaw',roles:['Associate']}], placementRate:'75-90% (varies by school)', medianTimeToOffer:'3L fall', topCities:['New York','Washington DC','Chicago','Los Angeles','San Francisco'], growthOutlook:'Legal industry is evolving with AI tools but demand for top lawyers remains strong. BigLaw continues to raise salaries competitively.' }
    };

    // Find matching hardcoded data
    var hardcodedOutcomes = null;
    var careerLower = career.toLowerCase();
    for (var ck in CAREER_OUTCOMES) {
      if (careerLower.indexOf(ck.toLowerCase()) !== -1 || ck.toLowerCase().indexOf(careerLower) !== -1) {
        hardcodedOutcomes = CAREER_OUTCOMES[ck];
        break;
      }
    }

    // Define all prompts
    var clubPrompt = 'List 3-5 real student clubs at ' + schoolName + ' that are DIRECTLY related to ' + career + ' and ' + (searchedMajor || career) + '.\n\nRULES:\n- ONLY clubs directly relevant to ' + career + '.\n- Use realistic club names that would exist at a college (e.g. Finance Club, Investment Club, Women in Business, Mock Trial, Pre-Med Society).\n- If unsure, use common club names for ' + career + ' students.\n\nReturn ONLY JSON array: [{"name":"Club Name","type":"Professional/Academic/Competition","priority":"Essential/Recommended/Helpful","desc":"What this club does in 8 words max"}] JSON only.';

    var brandPrompt = 'Official school colors and website for ' + schoolFullName + ' (' + schoolName + ')?\n\nReturn ONLY JSON:\n{"primaryColor":"#hex","secondaryColor":"#hex","domain":"school.edu"}\n\nprimaryColor = main/dark brand color. secondaryColor = accent/lighter. domain = .edu domain without https://. JSON only.';

    // Only call outcomes API if we DON'T have hardcoded data
    var needsOutcomesCall = !hardcodedOutcomes;

    var outcomesPrompt = needsOutcomesCall ? ('Salary and career data specifically for ' + career + ' roles.\n\nReturn ONLY JSON (no wrapper):\n{"entrySalary":{"low":50000,"high":70000,"median":60000},"midSalary":{"low":80000,"high":120000,"median":100000},"seniorSalary":{"low":120000,"high":200000,"median":160000},"topEmployers":[{"name":"Company","type":"Industry","roles":["Role"]}],"placementRate":"95%","medianTimeToOffer":"3 months before graduation","topCities":["City1","City2","City3"],"growthOutlook":"2-3 sentence outlook","dailyActions":[' + Array.from({length: numSemesters}, function(_, i) { return '{"semester":' + (i+1) + ',"actions":["action1","action2","action3"]}'; }).join(',') + ']}\n\n5-8 real employers. ' + numSemesters + ' semester entries with 3 specific student daily habits each. Actions must be for a CURRENT STUDENT, not a working professional. JSON only.') : null;

    // Fire calls in parallel — skip outcomes if we have hardcoded data
    var callList = [
      geminiCall(clubPrompt, false, 1024, 0.2),
      geminiCall(brandPrompt, true, 512, 0.1),
    ];
    if (needsOutcomesCall) callList.push(geminiCall(outcomesPrompt, true, 4096, 0.1));
    
    var results = await Promise.all(callList);

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
      roadmap.clubs = [{ name: 'Browse ' + schoolName + ' Clubs', type: 'Resource', priority: 'Essential', desc: 'Search online for clubs at your school' }];
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

    // Parse outcomes - use hardcoded data as supplement/fallback
    if (needsOutcomesCall) {
      try {
        var outText = cleanJson(extractText(results[2]));
        var outObj = parseJsonObj(outText);
        if (outObj) {
          if (outObj.outcomes) roadmap.outcomes = outObj.outcomes;
          else if (outObj.entrySalary || outObj.topEmployers) roadmap.outcomes = outObj;
        }
      } catch(e) { console.error('Outcomes parse:', e.message); }
    }
    
    // Merge with hardcoded data — hardcoded data fills gaps
    if (hardcodedOutcomes) {
      if (!roadmap.outcomes) {
        roadmap.outcomes = { ...hardcodedOutcomes };
        // Add daily actions
        roadmap.outcomes.dailyActions = Array.from({length: numSemesters}, function(_, i) { 
          return {semester: i+1, actions: ['Review course material and prep for recruiting', 'Network with alumni in ' + career, 'Build relevant technical skills']}; 
        });
      } else {
        // Fill in missing fields from hardcoded
        if (!roadmap.outcomes.topEmployers || roadmap.outcomes.topEmployers.length === 0 || (roadmap.outcomes.topEmployers[0] && roadmap.outcomes.topEmployers[0].name === 'Data unavailable')) {
          roadmap.outcomes.topEmployers = hardcodedOutcomes.topEmployers;
        }
        if (!roadmap.outcomes.topCities || roadmap.outcomes.topCities.length === 0) {
          roadmap.outcomes.topCities = hardcodedOutcomes.topCities;
        }
        if (!roadmap.outcomes.growthOutlook || roadmap.outcomes.growthOutlook.indexOf('could not be loaded') !== -1) {
          roadmap.outcomes.growthOutlook = hardcodedOutcomes.growthOutlook;
        }
        if (roadmap.outcomes.placementRate === 'N/A') {
          roadmap.outcomes.placementRate = hardcodedOutcomes.placementRate;
        }
        if (roadmap.outcomes.medianTimeToOffer === 'N/A') {
          roadmap.outcomes.medianTimeToOffer = hardcodedOutcomes.medianTimeToOffer;
        }
        // Use hardcoded salary if API returned zeros or very low
        if (!roadmap.outcomes.entrySalary || roadmap.outcomes.entrySalary.median < 20000) {
          roadmap.outcomes.entrySalary = hardcodedOutcomes.entrySalary;
          roadmap.outcomes.midSalary = hardcodedOutcomes.midSalary;
          roadmap.outcomes.seniorSalary = hardcodedOutcomes.seniorSalary;
        }
      }
    }
    
    // Final fallback if still no outcomes
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
