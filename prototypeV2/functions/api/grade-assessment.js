export async function onRequestPost({ request, env }) {
  try {
    const { answer, task } = await request.json();

    const prompt = `You are a technical assessment grader. Grade the following candidate submission for a work sample task.

Task: ${task}

Candidate's submission:
${answer || '(empty — candidate submitted nothing)'}

Return ONLY valid JSON with this exact structure. All scores must be 0.0 to 1.0:
{
  "task_completion": <0.0-1.0, did they attempt and complete the task?>,
  "technical_accuracy": <0.0-1.0, is their solution technically correct?>,
  "work_quality": <0.0-1.0, quality and depth of the solution?>,
  "communication": <0.0-1.0, clarity of explanation and reasoning?>,
  "normalised_score": <0.0-1.0, overall normalised percentile score>,
  "feedback": "<one sentence summary of the grade>"
}
Rules:
- If the submission is empty, all scores must be 0.0.
- Be strict and accurate. Do not inflate scores.`;

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();

    if (data.choices && data.choices[0].message.content) {
      return Response.json({ success: true, data: JSON.parse(data.choices[0].message.content) });
    }
    return Response.json({ success: false, error: 'Failed to parse DeepSeek response' }, { status: 500 });
  } catch (error) {
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
