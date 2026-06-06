export async function onRequestPost({ request, env }) {
  try {
    const { answers } = await request.json();

    const prompt = `You are a talent intelligence system. A candidate has answered a structured 6-question interview. Extract a structured profile from their answers.

Candidate's answers:
1. Proudest Work: ${answers.q1 || 'Not provided'}
2. Technical Complexity: ${answers.q2 || 'Not provided'}
3. Work Environment: ${answers.q3 || 'Not provided'}
4. Career Trajectory: ${answers.q4 || 'Not provided'}
5. Failure & Learning: ${answers.q5 || 'Not provided'}
6. Domain Approach: ${answers.q6 || 'Not provided'}

Return ONLY valid JSON. Do not include any explanation or preamble.
Rules:
- CRITICAL: If the candidate's answers are nonsensical, single words (e.g., "test", "ok"), or lack any concrete details, you MUST return an empty "skills" array, null for context/goals, and add a red_flag for "vague_answers". Do NOT hallucinate skills or context from meaningless input.
- If a field cannot be confidently inferred from real evidence, set it to null.
- evidence_quote must be verbatim from the candidate's text.
- confidence scores (0.0-1.0): 0.9+ = strong direct evidence, 0.7-0.9 = clear inference, 0.5-0.7 = reasonable, <0.5 = null.
- Flag any answer that reads as suspiciously keyword-dense, templated, or vague in red_flags.

Required JSON structure:
{
  "skills": [
    {
      "name": "string",
      "evidence_quote": "verbatim quote from candidate answer",
      "inferred_level": "junior" | "mid" | "senior" | "expert",
      "confidence": 0.85
    }
  ],
  "work_context": {
    "preferred_team_size": "string or null",
    "preferred_pace": "exploratory" | "balanced" | "execution-focused" | "null",
    "autonomy_level": "low" | "medium" | "high" | "null"
  },
  "goals": {
    "direction": "string or null",
    "anti_preferences": ["string"]
  },
  "soft_signals": {
    "communication_style": "string or null",
    "decision_making_pattern": "string or null"
  },
  "red_flags": [
    {
      "type": "keyword_stuffing" | "inconsistency" | "vague_answers",
      "detail": "string"
    }
  ]
}`;

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();

    if (data.choices && data.choices[0].message.content) {
      const extracted = JSON.parse(data.choices[0].message.content);
      return Response.json({ success: true, data: extracted });
    }
    return Response.json({ success: false, error: 'Failed to parse DeepSeek response' }, { status: 500 });
  } catch (error) {
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
