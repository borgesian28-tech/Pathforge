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
    const prompt = 'Return ONLY valid JSON for a ' + major + ' major at ' + schoolName + ' targeting ' + career + '. Format: {"schoolFullName":"...","major":"...","careerTitle":"...","departmentUrl":"","semesters":[{"name":"Fall - Freshman","courses":[{"code":"XX 101","title":"...","credits":3,"type":"Core","desc":"...","url":""}]},{"name":"Spring - Freshman","courses":[...]},{"name":"Fall - Sophomore","courses":[...]},{"name":"Spring - Sophomore","courses":[...]},{"name":"Fall - Junior","courses":[...]},{"name":"Spring - Junior","courses":[...]},{"name":"Fall - Senior","courses":[...]},{"name":"Spring - Senior","courses":[...]}],"clubs":[{"name":"...","type":"Professional","priority":"Essential","desc":"...","url":""}],"milestones":[{"sem":1,"label":"..."}],"skills":["..."],"beyondClassroom":{"intro":"...","technicalSkills":[{"skill":"...","why":"...","resources":[{"name":"...","type":"Course","url":"https://example.com","cost":"Free","time":"10hrs"}],"semester":"Freshman"}],"networkingPlaybook":[{"phase":"...","semester":"...","actions":["..."]}],"interviewPrep":[{"category":"...","resources":[{"name":"...","url":"https://example.com","desc":"..."}],"timeline":"..."}],"weeklyHabits":["..."],"careerInsiderTips":["..."]}}. Include 4 courses per semester, 4 clubs, 8 milestones, 5 skills, 3 technicalSkills with 2 resources each, 2 networkingPlaybook phases, 2 interviewPrep categories, 3 weeklyHabits, 3 careerInsiderTips. Use real course codes for ' + schoolName + ' if known. No markdown. No explanation. JSON only.';
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
