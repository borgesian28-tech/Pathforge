export const maxDuration = 60;

export async function POST(request) {
  try {
    const { schoolName, careerPath, majorName, customGoal } = await request.json();
    if (!schoolName || (!careerPath && !customGoal)) {
      return Response.json({ error: 'Missing' }, { status: 400 });
    }
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'No key' }, { status: 500 });
    }
    const career = customGoal || careerPath;
    const major = majorName || 'recommended';
    const prompt = 'JSON only. No markdown. A ' + major + ' major roadmap at ' + schoolName + ' for ' + career + '. Return: {"schoolFullName":"","major":"","careerTitle":"","departmentUrl":"","semesters":[8 semesters named "Fall - Freshman" thru "Spring - Senior", each with 4 courses having code/title/credits/type/desc/url],"clubs":[4 items with name/type/priority/desc/url],"milestones":[8 items with sem(1-8)/label],"skills":[5 strings],"beyondClassroom":{"intro":"","technicalSkills":[3 items with skill/why/resources(2 each with name/type/url/cost/time)/semester],"networkingPlaybook":[2 items with phase/semester/actions],"interviewPrep":[2 items with category/resources(2 with name/url/desc)/timeline],"weeklyHabits":[3 strings],"careerInsiderTips":[3 strings]}}. For IB: sophomore winter is when recruiting happens. Use real course codes for ' + schoolName + ' if known. Use real URLs for resources (wallstreetprep.com, breakingintowallstreet.com, leetcode.com, coursera.org). Leave url empty if unknown. JSON only.';
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 4096, messages: [{ role: 'user', content: prompt }] }),
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
