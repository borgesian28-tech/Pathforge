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
    const careerDesc = customGoal
      ? 'a custom career goal: "' + customGoal + '". Determine the best-fit major.'
      : 'a career in ' + careerPath + ', majoring in ' + majorName + '.';
    const majorInstruction = customGoal
      ? 'Determine the best major at ' + schoolName + '. Set careerTitle to a short title.'
      : 'The major is ' + majorName + '. Set careerTitle to "' + careerPath + '".';
    const prompt = 'You are an elite college career advisor. Build a roadmap for a student at ' + schoolName + ' pursuing ' + careerDesc + ' ' + majorInstruction + ' Use your knowledge of ' + schoolName + ' real course codes and student organizations. Return ONLY a JSON object (no markdown, no backticks) with: schoolFullName, major, careerTitle, departmentUrl, semesters (8 semesters, 4 courses each with code/title/credits/type/desc/url fields), clubs (4-6 with name/type/priority/desc/url), milestones (8 with sem/label), skills (5), and beyondClassroom (with intro, technicalSkills array of 4-6 items each having skill/why/resources array with name/type/url/cost/time and semester field, networkingPlaybook array of 3-4 phases with phase/semester/actions, interviewPrep array of 2-3 categories with category/resources/timeline, weeklyHabits array of 4-6, careerInsiderTips array of 4-6). Course types must be Core/Prerequisite/Elective/Gen Ed. Use real resource URLs. Return ONLY valid JSON.';
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 8000, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      return Response.json({ error: 'AI service error' }, { status: 502 });
    }
    const data = await response.json();
    const fullText = (data.content || []).filter(function(b) { return b.type === 'text'; }).map(function(b) { return b.text; }).join('\n');
    var parsed = null;
    try { parsed = JSON.parse(fullText.trim()); } catch(e) {
      var m = fullText.match(/\{[\s\S]*\}/);
      if (m) try { parsed = JSON.parse(m[0].trim()); } catch(e2) {}
    }
    if (parsed && parsed.semesters && parsed.semesters.length > 0) {
      return Response.json(parsed);
    }
    return Response.json({ error: 'Failed to generate roadmap' }, { status: 500 });
  } catch (err) {
    console.error('Generate API error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
