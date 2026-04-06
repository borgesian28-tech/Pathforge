export const maxDuration = 60;

export async function POST(request) {
  try {
    const { schoolName, careerPath, majorName, customGoal } = await request.json();
    if (!schoolName || (!careerPath && !customGoal)) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }
    const career = customGoal || careerPath;
    const major = majorName || 'best fit';
    const prompt = 'You are an expert college career advisor who knows exact recruiting timelines. Return ONLY valid JSON for a ' + major + ' major at ' + schoolName + ' targeting ' + career + '.\n\nCRITICAL ACCURACY RULES:\n- For Investment Banking: recruiting for junior summer analyst roles happens during SOPHOMORE WINTER (Jan-Feb). Networking starts freshman year. Superdays happen Feb-March of sophomore year.\n- For Consulting: recruiting happens fall of junior year for MBB, earlier for some firms.\n- For Tech/SWE: recruiting happens fall of junior year, some sophomore internships available.\n- All milestones MUST reflect real industry recruiting timelines.\n\nURL RULES:\n- For course urls: use the schools real course catalog URL pattern. For example if the school is Williams College use https://catalog.williams.edu/. If NYU use https://www.nyu.edu/students/student-information-and-resources/registration-records-and-transcripts/albert-help/course-search.html. Use the actual catalog search URL for the specific school.\n- For club urls: search your knowledge for the schools student org directory URL. Example: Williams uses https://williams.campuslabs.com/engage/organizations. NYU uses https://engage.nyu.edu/organizations.\n- For departmentUrl: use the actual department homepage URL at that school.\n- If you do not know the exact URL for a school, use an empty string rather than a fake URL.\n\nFormat: {"schoolFullName":"...","major":"...","careerTitle":"...","departmentUrl":"real dept URL or empty","semesters":[{"name":"Fall - Freshman","courses":[{"code":"XX 101","title":"...","credits":3,"type":"Core","desc":"...","url":"real catalog URL or empty"}]}],"clubs":[{"name":"...","type":"Professional","priority":"Essential","desc":"...","url":"real org directory URL or empty"}],"milestones":[{"sem":1,"label":"..."}],"skills":["..."],"beyondClassroom":{"intro":"...","technicalSkills":[{"skill":"...","why":"...","resources":[{"name":"...","type":"Course","url":"real URL","cost":"Free","time":"10hrs"}],"semester":"..."}],"networkingPlaybook":[{"phase":"...","semester":"...","actions":["..."]}],"interviewPrep":[{"category":"...","resources":[{"name":"...","url":"real URL","desc":"..."}],"timeline":"..."}],"weeklyHabits":["..."],"careerInsiderTips":["..."]}}\n\n8 semesters, 4 courses each, 4 clubs, 8 milestones, 5 skills, 3 technicalSkills with 2 resources each, 3 networkingPlaybook phases, 2 interviewPrep categories, 4 weeklyHabits, 4 careerInsiderTips. Use REAL course codes for ' + schoolName + '. Use REAL URLs for resources like wallstreetprep.com, breakingintowallstreet.com, mergersandinquisitions.com, leetcode.com, coursera.org. No markdown. JSON only.';
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4096, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!response.ok) {
      console.error('API error:', response.status);
      return Response.json({ error: 'AI error' }, { status: 502 });
    }
    const data = await response.json();
    const text = (data.content || []).filter(function(b) { return b.type === 'text'; }).map(function(b) { return b.text; }).join('');
    var parsed = null;
    try { parsed = JSON.parse(text.trim()); } catch(e) {
      var m = text.match(/\{[\s\S]*\}/);
      if (m) try { parsed = JSON.parse(m[0]); } catch(e2) {}
    }
    if (parsed && parsed.semesters) return Response.json(parsed);
    return Response.json({ error: 'Failed' }, { status: 500 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
