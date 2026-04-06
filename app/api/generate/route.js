export const maxDuration = 60; // Allow up to 60s for Vercel serverless

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
      ? `a custom career goal described as: "${customGoal}". Determine the best-fit major and build a complete roadmap.`
      : `a career in ${careerPath}, majoring in ${majorName}.`;

    const majorInstruction = customGoal
      ? `Determine the best major for this custom goal at ${schoolName}. Set "major" to whatever you determine is best. Also set "careerTitle" to a short professional title.`
      : `The major is ${majorName}. Set "careerTitle" to "${careerPath}".`;

    const prompt = `You are an elite college career advisor. Search the web for real data from ${schoolName} for a student pursuing ${careerDesc}

Search for: "${schoolName} course catalog", "${schoolName} ${majorName || ''} major requirements", "${schoolName} student organizations", and information about breaking into ${customGoal || careerPath}.

${majorInstruction}

Return ONLY a JSON object (no markdown, no backticks) with this structure:
{
  "schoolFullName": "full name",
  "major": "major name",
  "careerTitle": "short career title",
  "departmentUrl": "URL if found",
  "semesters": [
    {
      "name": "Fall — Freshman",
      "courses": [
        { "code": "ECON 101", "title": "Course Title", "credits": 3, "type": "Core", "desc": "Description", "url": "catalog URL" }
      ]
    }
  ],
  "clubs": [
    { "name": "Club Name", "type": "Professional", "priority": "Essential", "desc": "Description", "url": "club URL" }
  ],
  "milestones": [
    { "sem": 1, "label": "Milestone" }
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"],
  "beyondClassroom": {
    "intro": "1-2 sentence overview of why self-directed learning matters for this career at ${schoolName}.",
    "technicalSkills": [
      {
        "skill": "Skill Name",
        "why": "Why this matters and why schools don't teach it",
        "resources": [
          { "name": "Resource", "type": "Course/Book/Tool", "url": "URL", "cost": "Free/$XX", "time": "X hours" }
        ],
        "semester": "When to learn"
      }
    ],
    "networkingPlaybook": [
      {
        "phase": "Phase name",
        "semester": "Timing",
        "actions": ["Specific action"]
      }
    ],
    "interviewPrep": [
      {
        "category": "Category",
        "resources": [{ "name": "Name", "url": "URL", "desc": "Description" }],
        "timeline": "When to start"
      }
    ],
    "weeklyHabits": ["Habit"],
    "careerInsiderTips": ["Tip"]
  }
}

RULES:
- 8 semesters, 4 courses each, with URLs to ${schoolName}'s catalog
- 4-6 clubs with URLs
- 8 milestones, 5 skills
- beyondClassroom: 4-6 technical skills with 2-3 resources each, 3-4 networking phases, 2-3 interview prep categories, 4-6 weekly habits, 4-6 insider tips
- Use REAL course codes from ${schoolName} when possible
- Return ONLY valid JSON`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      return Response.json({ error: 'AI service error' }, { status: 502 });
    }

    const data = await response.json();
    const textBlocks = data.content?.filter((b) => b.type === 'text').map((b) => b.text) || [];
    const fullText = textBlocks.join('\n');

    let parsed = null;
    try {
      parsed = JSON.parse(fullText.trim());
    } catch {
      const m = fullText.match(/```(?:json)?\s*([\s\S]*?)```/) || fullText.match(/(\{[\s\S]*\})/);
      if (m) try { parsed = JSON.parse(m[1].trim()); } catch {}
    }

    if (parsed?.semesters?.length > 0) {
      return Response.json(parsed);
    }

    // Retry without web search
    const retryResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [{ role: 'user', content: `Return ONLY JSON for a ${majorName || 'recommended'} major at ${schoolName} for ${careerDesc}\n\n8 semesters, 4 courses each with "url", 4-6 clubs with "url", 8 milestones, 5 skills, and detailed "beyondClassroom" with technicalSkills, networkingPlaybook, interviewPrep, weeklyHabits, careerInsiderTips. Include "careerTitle". JSON only, no markdown.` }],
      }),
    });

    const d2 = await retryResponse.json();
    const t2 = d2.content?.filter((b) => b.type === 'text').map((b) => b.text).join('\n') || '';
    let p2 = null;
    try { p2 = JSON.parse(t2.trim()); } catch {
      const m2 = t2.match(/```(?:json)?\s*([\s\S]*?)```/) || t2.match(/(\{[\s\S]*\})/);
      if (m2) p2 = JSON.parse(m2[1].trim());
    }

    if (p2?.semesters) {
      return Response.json(p2);
    }

    return Response.json({ error: 'Failed to generate roadmap' }, { status: 500 });

  } catch (err) {
    console.error('Generate API error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
