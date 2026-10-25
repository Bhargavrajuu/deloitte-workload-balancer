/* Deloitte Workload Balancer: sample data generator and algorithm for Deloitte (Consulting). */
const TOOL = {
  num: 7, area: "HR", product: "Productivity vs Workload", seed: 77,
  title: "Deloitte Workload Balancer", company: "Deloitte (Consulting)",
  why: "Consulting runs on billable hours and tight deadlines, and long weeks can quietly lower output and raise burnout. This tool finds the point where extra hours stop paying off and where work gets stuck.",
  statement: "Management observes declining productivity despite increasing working hours. Build an AI system that analyzes workload, overtime, absenteeism, task completion, employee engagement and performance data to identify potential operational bottlenecks and recommend workload interventions.",
  dataNote: "600 consultants in 24 engagement teams, 26 weeks of timesheets, task logs and pulse surveys (sample data).",
  steps: [
    ["Collect workload data", "Hours, overtime, absence, tasks, deadlines, engagement, ratings"],
    ["Productivity metrics", "Tasks completed per hour and on-time rate"],
    ["Find the hours tipping point", "Quadratic regression of weekly output on hours"],
    ["Detect abnormal workloads", "Distance-based outlier score on hours, absence and engagement"],
    ["Process mining", "Average wait at each review stage of the deliverable flow"],
    ["Burnout signals", "Correlate overtime with absence and engagement"],
    ["Rebalance simulation", "Cap hours, move excess work to lighter teams"],
    ["Bottleneck report", "AI analyst explains fixes"]
  ],
  params: [
    { id: "cap", label: "Weekly hours cap", min: 45, max: 70, step: 1, value: 55, fmt: v => v + " hrs" },
    { id: "rev", label: "Extra manager reviewers", min: 0, max: 6, step: 1, value: 2, fmt: v => "+" + v }
  ],
  questions: ["At how many hours does output start falling?", "Which teams are burning out?", "Where does work get stuck in review?", "What happens if we cap hours at 50?"],
  generate(r) {
    const sectors = ["Banking", "Insurance", "Retail", "Energy", "Health", "Public"];
    const teams = S.range(24).map(i => ({ id: "T" + (i + 1), name: `${sectors[i % 6]} ${["Audit", "Tax", "Advisory", "Tech"][Math.floor(i / 6)]}`, load: r.u(0.85, 1.35), mgr: r.u(0.7, 1.3) }));
    const people = S.range(600).map(i => { const t = teams[i % 24]; const hrs = S.clamp(r.n(46 * t.load, 5), 36, 80); return { id: "D" + (7000 + i), team: t.id, hrs, grade: r.wpick(["Analyst", "Consultant", "Senior", "Manager"], [4, 4, 3, 1.5]) }; });
    people.forEach(p => { const over = Math.max(0, p.hrs - 52); p.out = Math.max(5, 2.6 * p.hrs - 0.032 * (p.hrs - 40) ** 2 * 2.6 - 0.9 * over * over / 10 + r.n(0, 7)); p.abs = Math.max(0, r.n(0.5 + 0.09 * Math.max(0, p.hrs - 48), 0.6)); p.eng = S.clamp(r.n(4.0 - 0.05 * Math.max(0, p.hrs - 45), 0.45), 1, 5); p.ontime = S.clamp(r.n(0.92 - 0.006 * Math.max(0, p.hrs - 50), 0.05), 0.4, 1); p.perf = S.clamp(r.n(3.4 + 0.01 * (p.out - 110) / 2, 0.5), 1, 5); });
    const stages = ["Drafting", "Senior review", "Manager review", "Partner sign-off", "Client feedback"];
    const base = [6, 9, 30, 18, 22];
    const items = S.range(1800).map(i => ({ team: teams[i % 24].id, waits: stages.map((_, j) => Math.max(0.5, r.n(base[j] * (j === 2 ? teams[i % 24].mgr : 1), base[j] * 0.35))) }));
    return { teams, people, stages, items, base };
  },
  analyze(D, P, r) {
    const pe = D.people;
    const X = pe.map(p => [p.hrs, p.hrs * p.hrs]), y = pe.map(p => p.out);
    const fit = M.ols(X, y); const [b0, b1, b2] = fit.beta; const opt = -b1 / (2 * b2);
    const outAt = h => b0 + b1 * h + b2 * h * h;
    const prod = pe.map(p => p.out / p.hrs);
    // outlier score: standardized distance
    const F3 = pe.map(p => [p.hrs, p.abs, -p.eng]); const sc = M.scaler(F3); const dist = F3.map(f => Math.sqrt(S.sum(sc.t(f).map(v => v * v)))); const thr = S.quantile(dist, 0.95);
    const flagged = pe.filter((_, i) => dist[i] > thr && pe[i].hrs > 50);
    // process mining
    const waits = D.stages.map((s, j) => S.mean(D.items.map(it => it.waits[j])));
    const bott = waits.indexOf(Math.max(...waits));
    const cycle = S.sum(waits), newMgr = waits[2] / (1 + 0.18 * P.rev), newCycle = cycle - waits[2] + newMgr;
    // burnout correlations
    const ot = pe.map(p => Math.max(0, p.hrs - 40));
    const cAbs = S.corr(ot, pe.map(p => p.abs)), cEng = S.corr(ot, pe.map(p => p.eng)), cOn = S.corr(ot, pe.map(p => p.ontime));
    // teams
    const tm = D.teams.map(t => { const g = pe.filter(p => p.team === t.id); return { ...t, n: g.length, hrs: S.mean(g.map(p => p.hrs)), out: S.mean(g.map(p => p.out)), prod: S.mean(g.map(p => p.out / p.hrs)), eng: S.mean(g.map(p => p.eng)), abs: S.mean(g.map(p => p.abs)), over: g.filter(p => p.hrs > P.cap).length / g.length }; }).sort((a, b) => b.hrs - a.hrs);
    // rebalance: cap hours; excess hours move to people under cap (up to cap); compare predicted output
    const excess = S.sum(pe.map(p => Math.max(0, p.hrs - P.cap))); const room = S.sum(pe.map(p => Math.max(0, Math.min(P.cap, opt) - p.hrs)));
    const share = Math.min(1, excess / Math.max(1, room));
    const newH = pe.map(p => p.hrs > P.cap ? P.cap : p.hrs + Math.max(0, Math.min(P.cap, opt) - p.hrs) * share);
    const before = S.sum(pe.map(p => outAt(p.hrs))), after = S.sum(newH.map(outAt));
    const gain = after / before - 1;
    const pts = pe.filter((_, i) => i % 2 === 0).map(p => ({ x: p.hrs, y: p.out, g: 0, tone: p.hrs > P.cap ? "c3" : "c2", o: 0.5 }));
    const curve = S.range(45).map(i => { const h = 36 + i * 1; return { x: h, y: outAt(h) }; });
    const burnTeams = tm.filter(t => t.eng < 3.5 && t.hrs > 52);
    return {
      steps: [`${pe.length} consultants × 26 weeks`, `Median ${S.quantile(prod, 0.5).toFixed(2)} tasks per hour`, `Output peaks at ${opt.toFixed(1)} hrs/week (R² ${fit.r2.toFixed(2)})`, `${flagged.length} people flagged as abnormal workload`, `Bottleneck: ${D.stages[bott]} (${waits[bott].toFixed(0)} hrs avg wait)`, `Overtime vs absence r = ${cAbs.toFixed(2)}, vs engagement r = ${cEng.toFixed(2)}`, `Output ${F.sgn(gain, v => F.pct(v))} after rebalancing to ${P.cap} hrs`, "Ready"],
      kpis: [
        { label: "Average week", value: S.mean(pe.map(p => p.hrs)).toFixed(1) + " hrs", note: `${F.pct(pe.filter(p => p.hrs > 55).length / pe.length, 0)} work over 55` },
        { label: "Output peaks at", value: opt.toFixed(0) + " hrs", note: "Beyond this, more hours lower output", tone: "warn" },
        { label: "Review bottleneck", value: D.stages[bott], note: `${F.pct(waits[bott] / cycle, 0)} of a ${cycle.toFixed(0)}-hr cycle`, tone: "bad" },
        { label: "Output after rebalance", value: F.sgn(gain, v => F.pct(v)), note: `Cap at ${P.cap} hrs, shift excess`, tone: gain >= 0 ? "good" : "bad" },
        { label: "Cycle time after fix", value: newCycle.toFixed(0) + " hrs", note: `from ${cycle.toFixed(0)} with +${P.rev} reviewers`, tone: "good" }
      ],
      sections: [
        { title: "Hours vs weekly output", note: "Each dot is a consultant. The black curve is the fitted model; the red line marks the hours cap. Red dots work above the cap.", chart: C.scatter(pts, { xf: v => v + "h", yf: v => F.num(v), curve, vline: P.cap, xl: "Hours per week", yl: "Output points per week" }) },
        { pair: [
          { title: "Where deliverables wait", note: "Average hours a deliverable sits at each stage before moving on.", chart: C.bar(D.stages.map((s, j) => ({ label: s, value: waits[j], tone: j === bott ? "bad" : "" })), { fmt: v => v.toFixed(0) + "h", labelW: 140 }) },
          { title: "Burnout signals", note: "Correlation between overtime and each outcome across all consultants.", chart: C.bar([{ label: "Absence days", value: cAbs, tone: "bad" }, { label: "Engagement score", value: cEng, tone: cEng < 0 ? "bad" : "" }, { label: "On-time delivery", value: cOn, tone: cOn < 0 ? "bad" : "" }], { fmt: v => v.toFixed(2), labelW: 140 }) }
        ] },
        { title: "Team workload board", html: T.table(["Team", "People", "Avg hours", "Output / hr", "Engagement", "Absence days", `Over ${P.cap}h`, "Status"], tm.map(t => [t.name, t.n, t.hrs.toFixed(1), t.prod.toFixed(2), t.eng.toFixed(2), t.abs.toFixed(1), F.pct(t.over, 0), T.pill(t.hrs > opt && t.eng < 3.6 ? "Overloaded" : t.hrs < 44 ? "Has room" : "OK", t.hrs > opt && t.eng < 3.6 ? "bad" : t.hrs < 44 ? "good" : "mut")]), { right: [1, 2, 3, 4, 5, 6] }) }
      ],
      recs: [
        { title: `Cap routine weeks at ${P.cap} hours`, body: `Output peaks near ${opt.toFixed(0)} hours. Moving the excess from ${F.num(pe.filter(p => p.hrs > P.cap).length)} people to colleagues with spare time changes total output by ${F.sgn(gain, v => F.pct(v))}.`, impact: F.sgn(gain, v => F.pct(v)) + " output", tone: gain >= 0 ? "good" : "bad" },
        { title: `Add ${P.rev} reviewers at the ${D.stages[bott]} stage`, body: `Deliverables wait ${waits[bott].toFixed(0)} hours there on average. Delegating first-pass review to seniors cuts the cycle from ${cycle.toFixed(0)} to ${newCycle.toFixed(0)} hours.`, impact: `-${(cycle - newCycle).toFixed(0)} hrs/cycle`, tone: "good" },
        { title: `Rotate staff out of ${burnTeams.length || "the most loaded"} burnout-risk team${burnTeams.length === 1 ? "" : "s"}`, body: `${(burnTeams.length ? burnTeams : tm.slice(0, 2)).map(t => t.name).slice(0, 4).join(", ")} combine long weeks with low engagement. Move people in from teams marked "Has room".`, impact: "Retention", tone: "bad" },
        { title: `Check in with ${flagged.length} flagged consultants`, body: "Their mix of hours, absence and engagement is in the top 5% of unusual patterns. Managers should reset scope this week.", impact: "This week", tone: "warn" }
      ],
      context: { optimal_hours: +opt.toFixed(1), model_r2: +fit.r2.toFixed(2), avg_hours: +S.mean(pe.map(p => p.hrs)).toFixed(1), stage_waits_hours: Object.fromEntries(D.stages.map((s, j) => [s, +waits[j].toFixed(1)])), bottleneck: D.stages[bott], correlations: { overtime_absence: +cAbs.toFixed(2), overtime_engagement: +cEng.toFixed(2), overtime_ontime: +cOn.toFixed(2) }, flagged_people: flagged.length, teams: tm.map(t => ({ team: t.name, avg_hours: +t.hrs.toFixed(1), output_per_hour: +t.prod.toFixed(2), engagement: +t.eng.toFixed(2), absence: +t.abs.toFixed(1) })), scenario: { hours_cap: P.cap, extra_reviewers: P.rev, output_change: +gain.toFixed(3), cycle_before: +cycle.toFixed(0), cycle_after: +newCycle.toFixed(0) } }
    };
  }
};
