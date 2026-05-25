import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../store/AppContext';
import { salaryData, cityLabels, cityCurrencies } from '../data/salary';

export default function FairPayEngine({ targetNode }) {
  const { state } = useApp();
  const persona = state.currentPersona;

  if (!persona) return null;

  const role = targetNode?.role || persona.currentRole;
  const city = persona.city;

  const mySalaryData = salaryData.find(s => s.role === role && s.city === city);
  const comparisons = salaryData.filter(s => s.role === role && s.city !== city).slice(0, 5);

  const currentSalary = mySalaryData?.p50 || 5000;
  const currentPercentile = 42 + (persona.yearsExperience * 2);

  const projection = [
    { year: '2025', salary: currentSalary },
    { year: '2026', salary: Math.round(currentSalary * 1.08) },
    { year: '2027', salary: Math.round(currentSalary * 1.18) },
    { year: '2028', salary: Math.round(currentSalary * 1.30) },
    { year: '2029', salary: Math.round(currentSalary * 1.45) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-accent mb-1">03 · Progression</div>
        <h3 className="font-display text-xl">Fair Pay Engine</h3>
        <p className="text-sm text-text-secondary">{role} · {cityLabels[city] || city}</p>
      </div>

      <div className="bg-surface rounded-xl p-5 border border-accent/10 space-y-4">
        <div>
          <div className="font-mono text-3xl text-accent">
            RM {(mySalaryData?.p25 || 3000).toLocaleString()} – {(mySalaryData?.p75 || 8000).toLocaleString()}
          </div>
          <div className="text-xs text-text-muted mt-1">Market range for {role} in {cityLabels[city] || city}</div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-text-secondary mb-1">
            <span>P25</span>
            <span>P50 (median)</span>
            <span>P75</span>
            <span>P90</span>
          </div>
          <div className="relative h-3 rounded-full bg-elevated">
            <div className="absolute inset-y-0 left-0 w-[60%] rounded-full bg-accent-muted/30" />
            <div
              className="absolute top-[-4px] w-4 h-4 rounded-full bg-accent border-2 border-bg shadow-lg"
              style={{ left: `${currentPercentile}%`, transform: 'translateX(-50%)' }}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="font-mono text-xs text-text-secondary">
              You&apos;re at the <span className="text-accent">{currentPercentile}th percentile</span>
            </span>
          </div>
        </div>
      </div>

      {comparisons.length > 0 && (
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Cross-City Comparison</div>
          {comparisons.map(c => {
            const pctChange = mySalaryData ? Math.round(((c.p50 - mySalaryData.p50) / mySalaryData.p50) * 100) : 0;
            const isPositive = pctChange > 0;
            return (
              <div key={c.city} className="flex items-center justify-between bg-surface rounded-lg px-4 py-3 border border-accent/10">
                <div>
                  <span className="text-sm text-text">{cityLabels[c.city] || c.city}:</span>
                  <span className="font-mono text-sm text-text-secondary ml-2">
                    {cityCurrencies[c.city] || 'RM'} {c.p50.toLocaleString()}/mo
                  </span>
                </div>
                <span className={`font-mono text-xs ${isPositive ? 'text-success' : 'text-danger'}`}>
                  {isPositive ? '+' : ''}{pctChange}%
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-surface rounded-xl p-4 border border-accent/10">
        <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted mb-2">5-Year Salary Projection</div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={projection}>
            <defs>
              <linearGradient id="salaryGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-elevated)" />
            <XAxis dataKey="year" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: 'var(--color-surface)', border: '1px solid rgba(245,197,24,0.2)', borderRadius: 8, fontFamily: 'IBM Plex Mono', fontSize: 12 }}
              formatter={(value) => [`RM ${value.toLocaleString()}`, 'Salary']}
            />
            <Area type="monotone" dataKey="salary" stroke="var(--color-accent)" strokeWidth={2} fill="url(#salaryGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
