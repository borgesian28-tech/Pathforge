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
    const prompt = 'Respond with ONLY raw JSON. NO markdown. NO ```json. NO ``` fences. Just the raw JSON object starting with { and ending with }.\n\nCreate a ' + major + ' major roadmap at ' + schoolName + ' for ' + career + '. JSON: {"schoolFullName":"","major":"","careerTitle":"","departmentUrl":"","semesters":[8 objects with name and courses(4 each with code/title/credits/type/desc/url)],"clubs":[3 with name/type/priority/desc/url],"milestones":[8 with sem/label],"skills":[5],"beyondClassroom":{"intro":"","technicalSkills":[2 with skill/why/resources(1 each)/semester],"networkingPlaybook":[2 with phase/semester/actions],"interviewPrep":[1 with category/resources(1)/timeline],"weeklyHabits":[3],"careerInsiderTips":[3]}}. Semester names: "Fall - Freshman","Spring - Freshman","Fall - Sophomore","Spring - Sophomore","Fall - Junior","Spring - Junior","Fall - Senior","Spring - Senior". Types: Core/Prerequisite/Elective/Gen Ed. For IB: recruiting is sophomore winter. Keep descriptions SHORT (under 10 words). NO markdown fences. Raw JSON only.';
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 8192, messages: [{ role: 'user', content: prompt }] }),
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
    var start = text.indexOf('{');
    var end = text.lastIndexOf('}');
    if (start !== -1 && end > start) {
      text = text.substring(start, end + 1);
    }
    var parsed = null;
    try { parsed = JSON.parse(text); } catch(e) {
      console.error('Parse error:', e.message, 'Length:', text.length);
    }
    if (parsed && parsed.semesters) {
      return Response.json(parsed);
    }
    return Response.json({ error: 'Failed' }, { status: 500 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
