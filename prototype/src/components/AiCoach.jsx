import { useState, useRef, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { trajectoryNodes } from '../data/trajectory';
import { salaryData, cityLabels } from '../data/salary';

const preloadedMessages = {
  ahmad: "Based on your 3 years in IT Support at a financial institution in KL, your highest-probability next move is Cloud Engineer (AWS focus) — 41% of similar profiles reached this within 18 months. You have 7 of 9 required skills. The 2 gaps are Terraform and AWS Solutions Architect cert. Want me to map the 6-month learning path?",
  priya: "Your profile shows a strong signal toward HR Tech / People Analytics — a fast-growing vertical in Singapore. 3 of the companies that hired from your university recently are scaling these teams. Your psychology background is a differentiator most candidates lack. Should we look at that path?",
  david: "With 12 years as a Senior Software Engineer, your trajectory data shows two high-probability paths: Engineering Manager (30% of similar profiles) and Solutions Architect (25%). Given your mentoring and system design experience, the EM path would compound your leadership skills fastest — VPs with your background made the leap in ~20 months on average.",
  siti: "At your career stage, the data shows two patterns: 35% move into C-suite executive roles within their industry, while 25% pivot to consulting. Your 18 years in marketing gives you unique leverage for both. Companies in property and construction are particularly seeking board-level marketing expertise right now.",
};

function buildSystemPrompt(persona, selectedNode) {
  const currentRoleNode = trajectoryNodes.find(n => n.role === persona.currentRole);
  const targetRoleNode = selectedNode || trajectoryNodes.find(n => n.role === persona.targetRole);
  const roleSalary = salaryData.filter(s => s.role === persona.currentRole);
  const targetSalary = salaryData.filter(s => s.role === persona.targetRole);
  const mySalary = roleSalary.find(s => s.city === persona.city);
  const tgtSalaryKL = targetSalary.find(s => s.city === 'KL');

  const missingSkills = targetRoleNode
    ? targetRoleNode.skills.filter(s => !persona.skills.includes(s))
    : [];

  return `You are Career OS — an AI career co-pilot built specifically for Asia professionals.
You have access to the user's full career profile, their current trajectory graph position, skill gaps, and regional salary market data.

YOUR RULES:
1. NEVER give generic career advice. Always reference the user's actual role, company type, city, years of experience, and life chapter.
2. When referencing data, use numbers. Don't say "you could earn more" — say "Cloud Engineers at your level in KL earn RM 7,500–11,000."
3. Be direct. You are a senior mentor who has seen thousands of careers across Asia, not a chatbot.
4. Proactively surface moves the user hasn't thought of. If their trajectory data suggests a high-probability path they haven't explored, mention it.
5. Anchor every recommendation to their trajectory graph.
6. Understand Asia career contexts: GLCs, MNCs in KLCC, startup ecosystems in Bangsar South, regional moves to Singapore, etc.
7. Be empathetic but efficient. Career decisions are high-stakes. Treat them seriously.

RESPONSE FORMAT:
- Lead with the most important insight
- Keep responses concise but specific (150 words or fewer unless asked to elaborate)
- End with ONE specific, actionable next step

CURRENT USER CONTEXT:
Name: ${persona.name || 'User'}
Life Chapter: ${persona.chapterLabel} (${persona.chapterDesc || ''})
Current Role: ${persona.currentRole}
Company Type: ${persona.companySize}
Industry: ${persona.industry}
City: ${cityLabels[persona.city] || persona.city}
Years of Experience: ${persona.yearsExperience}
Skills: ${(persona.skills || []).join(', ')}
Target Role: ${persona.targetRole || 'Not specified'}
Career Stage: ${persona.chapterLabel} professional in ${persona.city}

SALARY CONTEXT:
Current role market salary (${persona.city}): ${mySalary ? `RM ${mySalary.p50.toLocaleString()}/mo (P25: ${mySalary.p25.toLocaleString()}, P75: ${mySalary.p75.toLocaleString()})` : 'Not available'}
Target role market salary (KL): ${tgtSalaryKL ? `RM ${tgtSalaryKL.p50.toLocaleString()}/mo (P25: ${tgtSalaryKL.p25.toLocaleString()}, P75: ${tgtSalaryKL.p75.toLocaleString()})` : 'Not available'}
Salary growth trajectory for target role: 8–12% year-over-year in Asia.

SKILL GAP ANALYSIS:
${targetRoleNode ? `Required skills for ${persona.targetRole}: ${targetRoleNode.skills.join(', ')}` : `Target role "${persona.targetRole}" not found in trajectory data.`}
${missingSkills.length > 0 ? `Missing skills (${missingSkills.length}): ${missingSkills.join(', ')}` : 'You have all required skills for this target role.'}
Current skill count vs required: ${persona.skills.length} of ${targetRoleNode?.skills.length || '?'} required skills.

TRAJECTORY DATA:
${currentRoleNode ? `Your current node: ${currentRoleNode.role} (${currentRoleNode.specialisation}, ${currentRoleNode.seniority} level, salary range RM ${currentRoleNode.salaryMin.toLocaleString()}–${currentRoleNode.salaryMax.toLocaleString()})` : ''}
${targetRoleNode ? `Target node: ${targetRoleNode.role} (${targetRoleNode.specialisation}, ${targetRoleNode.seniority} level, salary range RM ${targetRoleNode.salaryMin.toLocaleString()}–${targetRoleNode.salaryMax.toLocaleString()})` : ''}`;
}

export default function AiCoach() {
  const { state } = useApp();
  const persona = state.currentPersona;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (persona) {
      setMessages([
        {
          role: 'assistant',
          content: preloadedMessages[persona.id] ||
            `Welcome to Career OS, ${persona.name || 'ready to get started'}. I have full context on your profile — ${persona.yearsExperience} years as ${persona.currentRole} in ${cityLabels[persona.city] || persona.city}. Ask me anything about your career path, skills, or salary outlook.`,
        },
      ]);
    }
  }, [persona?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    const systemPrompt = buildSystemPrompt(persona, state.selectedPathNode);
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMsg },
    ];

    try {
      const response = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Sorry, I couldn't process that. ${data.error || 'Please check your connection and try again.'}`,
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.reply,
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Connection error. Make sure the dev server is running and your DeepSeek API key is set in .env.`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-accent/10 flex-shrink-0">
        <div className="font-mono text-[10px] uppercase tracking-wider text-accent mb-1">02 · Growth</div>
        <h3 className="font-medium text-sm">AI Career Coach</h3>
        <div className="flex items-center gap-2 mt-2">
          <div className={`w-2 h-2 rounded-full ${loading ? 'bg-accent animate-pulse' : 'bg-success'}`} />
          <span className="text-[10px] text-text-muted">
            {loading ? 'Thinking...' : `Context loaded — ${persona?.name || 'your profile'}`}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-accent/15 border border-accent/20 text-text'
                : 'bg-surface border border-accent/10 text-text-secondary'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface border border-accent/10 rounded-xl px-4 py-3 text-sm text-text-muted animate-pulse">
              Analysing your profile...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-accent/10 flex-shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask about career paths, skills, salary..."
            disabled={loading}
            className="flex-1 bg-surface border border-accent/10 rounded-lg px-4 py-2.5 text-sm text-text placeholder-text-muted focus:border-accent/50 outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 rounded-lg bg-accent text-[#0d1f1a] font-semibold text-sm hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
