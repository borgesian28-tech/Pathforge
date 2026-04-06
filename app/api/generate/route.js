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
    const prompt = 'You must respond with ONLY a JSON object. No text before or after. No markdown fences.\n\nCreate a ' + major + ' major roadmap at ' + schoolName + ' for ' + career + '.\n\nExact JSON structure required:\n{"schoolFullName":"full name","major":"major","careerTitle":"title","departmentUrl":"","semesters":[{"name":"Fall - Freshman","courses":[{"code":"ABC 101","title":"name","credits":3,"type":"Core","desc":"description","url":""}]},{"name":"Spring - Freshman","courses":[4 courses]},{"name":"Fall - Sophomore","courses":[4 courses]},{"name":"Spring - Sophomore","courses":[4 courses]},{"name":"Fall - Junior","courses":[4 courses]},{"name":"Spring - Junior","courses":[4 courses]},{"name":"Fall - Senior","courses":[4 courses]},{"name":"Spring - Senior","courses":[4 courses]}],"clubs":[{"name":"club","type":"Professional","priority":"Essential","desc":"desc","url":""}],"milestones":[{"sem":1,"label":"milestone"}],"skills":["skill"],"beyondClassroom":{"intro":"intro text","technicalSkills":[{"skill":"name","why":"reason","resources":[{"name":"resource","type":"Course","url":"https://real-url.com","cost":"Free","time":"10hrs"}],"semester":"Freshman Year"}],"networkingPlaybook":[{"phase":"name","semester":"timing","actions":["action"]}],"interviewPrep":[{"category":"name","resources":[{"name":"resource","url":"https://real-url.com","desc":"description"}],"timeline":"when"}],"weeklyHabits":["habit"],"careerInsiderTips":["tip"]}}\n\nRules: 4 courses per semester, 4 clubs, 8 milestones, 5 skills, 3 technicalSkills(2 resources each), 2 networkingPlaybook phases, 2 interviewPrep categories, 3 weeklyHabits, 3 careerInsiderTips. For IB: recruiting is sophomore winter. Use real course codes for ' + schoolName + '. Use real URLs for resources. RESPOND WITH ONLY THE JSON OBJECT.';
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
    var text = '';
    for (var i = 0; i < (data.content || []).length; i++) {
      if (data.content[i].type === 'text') text += data.content[i].text;
    }
    text = text.trim();
    if (text.indexOf('```') !== -1) {
      var match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) text = match[1].trim();
    }
    var parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch(e) {
      var start = text.indexOf('{');
      var end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        try {
          parsed = JSON.parse(text.substring(start, end + 1));
        } catch(e2) {
          console.error('Parse failed. First 300 chars:', text.substring(0, 300));
          console.error('Last 300 chars:', text.substring(text.length - 300));
        }
      }
    }
    if (parsed && parsed.semesters) {
      return Response.json(parsed);
    }
    console.error('No valid data. Response length:', text.length);
    return Response.json({ error: 'Failed to parse' }, { status: 500 });
  } catch (err) {
    console.error('Server error:', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
