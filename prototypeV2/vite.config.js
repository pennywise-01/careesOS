import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import https from 'node:https';
import 'dotenv/config';

function httpsPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    const { hostname, pathname, search } = new URL(url);
    const bodyStr = JSON.stringify(body);
    const req = https.request(
      {
        hostname,
        path: pathname + search,
        method: 'POST',
        headers: { ...headers, 'Content-Length': Buffer.byteLength(bodyStr) },
        rejectUnauthorized: false,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve(JSON.parse(data)));
      }
    );
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

function deepseekPlugin() {
  return {
    name: 'deepseek-api',
    configureServer(server) {
      server.middlewares.use('/api/grade-assessment', async (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ success: false, error: 'Method not allowed' })); return; }
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const { answer, task } = JSON.parse(body);
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

            const data = await httpsPost(
              'https://api.deepseek.com/chat/completions',
              { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` },
              { model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], temperature: 0.1, response_format: { type: 'json_object' } }
            );
            res.setHeader('Content-Type', 'application/json');
            if (data.choices && data.choices[0].message.content) {
              res.end(JSON.stringify({ success: true, data: JSON.parse(data.choices[0].message.content) }));
            } else {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: 'Failed to parse DeepSeek response' }));
            }
          } catch (error) {
            console.error('Grade Assessment Error:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
          }
        });
      });

      server.middlewares.use('/api/extract-profile', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ success: false, error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const { answers } = JSON.parse(body);

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

            const data = await httpsPost(
              'https://api.deepseek.com/chat/completions',
              { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` },
              { model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], temperature: 0.2, response_format: { type: 'json_object' } }
            );

            res.setHeader('Content-Type', 'application/json');
            if (data.choices && data.choices[0].message.content) {
              const extracted = JSON.parse(data.choices[0].message.content);
              res.end(JSON.stringify({ success: true, data: extracted }));
            } else {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: 'Failed to parse DeepSeek response' }));
            }
          } catch (error) {
            console.error('DeepSeek API Error:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
          }
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), deepseekPlugin()],
  server: {
    allowedHosts: true,
  },
});