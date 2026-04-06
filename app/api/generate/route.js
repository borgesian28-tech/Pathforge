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
    const prompt = 'Return ONLY a raw JSON object for a ' + major + ' major roadmap at ' + schoolName + ' for ' + career + '. No other text. No markdown.\n\nStructure: {"schoolFullName":"","major":"","careerTitle":"","departmentUrl":"","semesters":[8 with name/courses(4 each: code/title/credits/type/desc/url)],"clubs":[3 with name/type/priority/desc/url],"milestones":[8 with sem/label],"skills":[5],"beyondClassroom":{"intro":"","technicalSkills":[2 with skill/why/resources(1: name/type/url/cost/time)/semester],"networkingPlaybook":[2 with phase/semester/actions],"interviewPrep":[1 with category/resources(1: name/url/desc)/timeline],"weeklyHabits":[3],"careerInsiderTips":[3]}}\n\nSemester names: "Fall - Freshman" thru "Spring - Senior". Types: Core/Prerequisite/Elective/Gen Ed. Keep desc under 8 words. For IB: recruiting is sophomore winter. Use real course codes. Leave url as "" if unsure. Raw JSON only. Nothing after the closing brace.';
    var lastError = null;
    for (var attempt = 0; attempt < 2; attempt++) {
      try {
        var response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 8192, messages: [{ role: 'user', content: prompt }] }),
        });
        if (!response.ok) { lastError = 'API ' + response.status; continue; }
        var data = await response.json();
        var text = '';
        for (var i = 0; i < (data.content || []).length; i++) {
          if (data.content[i].type === 'text') text += data.content[i].text;
        }
        text = text.trim();
        if (text.indexOf('```') !== -1) {
          var fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (fenceMatch) text = fenceMatch[1].trim();
        }
        var braceStart = text.indexOf('{');
        if (braceStart === -1) { lastError = 'No JSON found'; continue; }
        text = text.substring(braceStart);
        var depth = 0;
        var inString = false;
        var escape = false;
        var jsonEnd = -1;
        for (var j = 0; j < text.length; j++) {
          var ch = text[j];
          if (escape) { escape = false; continue; }
          if (ch === '\\') { escape = true; continue; }
          if (ch === '"') { inString = !inString; continue; }
          if (inString) continue;
          if (ch === '{') depth++;
          if (ch === '}') { depth--; if (depth === 0) { jsonEnd = j; break; } }
        }
        if (jsonEnd === -1) { lastError = 'Incomplete JSON'; continue; }
        var jsonStr = text.substring(0, jsonEnd + 1);
        var parsed = JSON.parse(jsonStr);
        if (parsed && parsed.semesters && parsed.semesters.length > 0) {
          return Response.json(parsed);
        }
        lastError = 'No semesters';
      } catch(e) {
        lastError = e.message;
        console.error('Attempt ' + attempt + ' error:', e.message);
      }
    }
    console.error('All attempts failed:', lastError);
    return Response.json({ error: 'Failed: ' + lastError }, { status: 500 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
