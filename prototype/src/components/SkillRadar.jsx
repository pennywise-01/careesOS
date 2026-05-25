import { useState } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';
import { getSkillGapData } from '../data/skills';
import { useApp } from '../store/AppContext';
import { trajectoryNodes } from '../data/trajectory';

export default function SkillRadar({ targetNode }) {
  const { state, dispatch } = useApp();
  const persona = state.currentPersona;
  const [planAdded, setPlanAdded] = useState(false);
  const [expandedSkills, setExpandedSkills] = useState({});

  if (!persona) return null;

  const target = targetNode || trajectoryNodes.find(n => n.role === persona?.targetRole);

  if (!target) {
    return (
      <div className="space-y-6">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-accent mb-1">03 · Growth</div>
          <h3 className="font-display text-xl">Skill Gap Radar</h3>
          <p className="text-sm text-text-secondary">{persona.name}&apos;s skills</p>
        </div>
        <div className="bg-surface rounded-xl p-6 border border-accent/10 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-text-secondary text-sm">Set a target role to see your skill gap analysis.</p>
          <p className="text-text-muted text-xs mt-2">Click a node on the Trajectory Map or update your target role in the onboarding.</p>
          <button
            onClick={() => dispatch({ type: 'NAVIGATE', view: 'graph' })}
            className="mt-4 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm hover:bg-accent/20 transition-all"
          >
            ← Explore Trajectory Map
          </button>
        </div>
      </div>
    );
  }

  const gapData = getSkillGapData(persona.skills, target.skills);
  const radarData = [
    { category: 'Technical', current: 8, userVal: gapData.categories.Technical.user || 0, requiredVal: Math.min(gapData.categories.Technical.required || 1, 8) },
    { category: 'Leadership', current: 5, userVal: gapData.categories.Leadership.user || 0, requiredVal: Math.min(gapData.categories.Leadership.required || 0, 5) },
    { category: 'Communication', current: 3, userVal: gapData.categories.Communication.user || 0, requiredVal: Math.min(gapData.categories.Communication.required || 0, 3) },
    { category: 'Domain', current: 4, userVal: gapData.categories['Domain Knowledge'].user || 0, requiredVal: Math.min(gapData.categories['Domain Knowledge'].required || 0, 4) },
    { category: 'Certs', current: 2, userVal: gapData.categories.Certifications.user || 0, requiredVal: Math.min(gapData.categories.Certifications.required || 0, 2) },
  ];

  const totalCurrent = Object.values(gapData.categories).reduce((sum, c) => sum + c.user, 0);
  const totalRequired = Object.values(gapData.categories).reduce((sum, c) => sum + c.required, 0);
  const readiness = totalRequired > 0 ? Math.min(Math.round((totalCurrent / totalRequired) * 100), 100) : 0;

  const toggleSkillExpand = (skill) => {
    setExpandedSkills(prev => ({ ...prev, [skill]: !prev[skill] }));
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-accent mb-1">03 · Growth</div>
        <h3 className="font-display text-xl">Skill Gap Radar</h3>
        <p className="text-sm text-text-secondary">
          {persona.name}&apos;s readiness for <span className="text-text">{target.role}</span>
        </p>
      </div>

      <div className="bg-surface rounded-xl p-4 border border-accent/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-3xl font-mono font-medium text-accent">{readiness}%</div>
          <div className="text-sm text-text-secondary">ready for<br /><span className="text-text">{target.role}</span></div>
        </div>
        <div className="h-2 rounded-full bg-elevated overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-accent-muted to-accent transition-all" style={{ width: `${readiness}%` }} />
        </div>
        <div className="text-[10px] text-text-muted mt-2">
          {persona.skills.length} / {target.skills.length} required skills · {gapData.missingSkills.length} gaps
        </div>
      </div>

      <div className="bg-surface rounded-xl p-4 border border-accent/10">
        <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted mb-2">Skill Profile Comparison</div>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="var(--color-elevated)" />
            <PolarAngleAxis dataKey="category" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
            <PolarRadiusAxis angle={90} domain={[0, 8]} tick={false} axisLine={false} />
            <Radar name={`${persona.name.split(' ')[0]}&apos;s Skills`} dataKey="userVal" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.2} strokeWidth={2} />
            <Radar name={`${target.role} (req)`} dataKey="requiredVal" stroke="var(--color-text-muted)" fill="var(--color-text-muted)" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="5 5" />
            <Legend wrapperStyle={{ fontSize: 10, color: 'var(--color-text-secondary)' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {gapData.missingSkills.length > 0 && (
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
            Top Missing Skills ({gapData.missingSkills.length})
          </div>
          {gapData.missingSkills.slice(0, 6).map((skill) => (
            <div key={skill} className="bg-surface rounded-lg border border-accent/10 overflow-hidden">
              <button
                onClick={() => toggleSkillExpand(skill)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-text hover:bg-elevated transition-colors text-left"
              >
                <span>{skill}</span>
                <span className="text-xs text-accent">{expandedSkills[skill] ? '▲' : 'Learn this →'}</span>
              </button>
              {expandedSkills[skill] && (
                <div className="px-4 pb-3 text-xs text-text-secondary space-y-2">
                  <p>Recommended resources for {skill}:</p>
                  <ul className="space-y-1 list-disc pl-4">
                    {skill.includes('AWS') && <li>AWS Certified Solutions Architect — Associate (aws.amazon.com/certification)</li>}
                    {skill.includes('Terraform') && <li>HashiCorp Terraform Associate Certification (hashicorp.com)</li>}
                    {skill.includes('Docker') && <li>Docker Mastery on Udemy (Bret Fisher)</li>}
                    {skill.includes('Kubernetes') && <li>Kubernetes CKA/CKAD (training.linuxfoundation.org)</li>}
                    {skill.includes('Python') && <li>Python for Everybody (Coursera / University of Michigan)</li>}
                    {skill.includes('Azure') && <li>Microsoft Learn — AZ-104 Azure Administrator</li>}
                    {skill.includes('SQL') && <li>SQL for Data Analysis (DataCamp)</li>}
                    {skill.includes('Tableau') && <li>Tableau Desktop Specialist Certification</li>}
                    {skill.includes('Leadership') && <li>Crucial Conversations (book + workshop)</li>}
                    {skill.includes('Security') && <li>CompTIA Security+ or CISSP (isc2.org)</li>}
                    {skill.includes('Stakeholder') && <li>Managing Stakeholders (LinkedIn Learning)</li>}
                    {skill.includes('Mentoring') && <li>Find a formal mentorship program within your organisation</li>}
                    {!['AWS', 'Terraform', 'Docker', 'Kubernetes', 'Python', 'Azure', 'SQL', 'Tableau', 'Leadership', 'Security', 'Stakeholder', 'Mentoring'].some(k => skill.includes(k)) && <li>Search top-rated {skill} courses on Coursera, Udemy, or LinkedIn Learning</li>}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => {
          setPlanAdded(true);
          setTimeout(() => setPlanAdded(false), 2500);
        }}
        className={`w-full py-3 rounded-lg font-semibold text-sm transition-all ${
          planAdded
            ? 'bg-success/20 text-success border border-success/30'
            : 'bg-accent text-[#0d1f1a] hover:bg-accent-hover'
        }`}
      >
        {planAdded ? `✓ Learning plan updated with ${target.role} path skills` : 'Add to Learning Plan'}
      </button>
    </div>
  );
}
