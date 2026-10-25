"""Hours vs output, workload anomalies, review bottlenecks and rebalancing for Deloitte."""
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

from src.utils import bar, kpi, num, pct, rec, scatter, signed, table

META = json.loads(Path(__file__).with_name("meta.json").read_text())
PARAMS = [
    {"name": "hours_cap", "label": "Weekly hours cap", "min": 45, "max": 70, "step": 1, "default": 55},
    {"name": "extra_reviewers", "label": "Extra manager reviewers", "min": 0, "max": 6, "step": 1, "default": 2},
]


def run(data, hours_cap=55, extra_reviewers=2):
    C, T, W = data["consultants"].copy(), data["teams"], data["deliverables"]
    h, out = C.weekly_hours.to_numpy(), C.output_points.to_numpy()
    b2, b1, b0 = np.polyfit(h, out, 2)
    peak = -b1 / (2 * b2)
    f = np.poly1d([b2, b1, b0])
    r2 = 1 - ((out - f(h)) ** 2).sum() / ((out - out.mean()) ** 2).sum()

    iso = IsolationForest(contamination=0.05, random_state=0).fit(C[["weekly_hours", "absence_days", "engagement"]])
    C["anomaly"] = iso.predict(C[["weekly_hours", "absence_days", "engagement"]]) == -1
    flagged = C[C.anomaly & (C.weekly_hours > 50)]

    wait_cols = [c for c in W.columns if c.startswith("wait_")]
    stage_names = ["Drafting", "Senior review", "Manager review", "Partner sign-off", "Client feedback"]
    waits = pd.DataFrame({"stage": stage_names, "avg_wait_hrs": W[wait_cols].mean().round(1).to_numpy()})
    bott = waits.sort_values("avg_wait_hrs").iloc[-1]
    cycle = waits.avg_wait_hrs.sum(); mgr = waits.set_index("stage").loc["Manager review", "avg_wait_hrs"]
    new_cycle = cycle - mgr + mgr / (1 + 0.18 * extra_reviewers)

    ot = np.maximum(0, h - 40)
    corr = pd.DataFrame({"outcome": ["Absence days", "Engagement", "On-time delivery"], "correlation_with_overtime": [round(np.corrcoef(ot, C[c])[0, 1], 2) for c in ["absence_days", "engagement", "on_time_rate"]]})

    tm = C.groupby("team_id").agg(people=("consultant_id", "count"), avg_hours=("weekly_hours", "mean"), output=("output_points", "mean"),
                                  engagement=("engagement", "mean"), absence=("absence_days", "mean"), over_cap=("weekly_hours", lambda s: (s > hours_cap).mean())).reset_index()
    tm = tm.merge(T[["team_id", "team"]], on="team_id")
    tm["output_per_hour"] = tm.output / tm.avg_hours
    tm["status"] = np.where((tm.avg_hours > peak) & (tm.engagement < 3.6), "Overloaded", np.where(tm.avg_hours < 44, "Has room", "OK"))
    tm = tm.sort_values("avg_hours", ascending=False)[["team", "people", "avg_hours", "output_per_hour", "engagement", "absence", "over_cap", "status"]].round(2)

    excess = np.maximum(0, h - hours_cap).sum(); target = min(hours_cap, peak); room = np.maximum(0, target - h).sum()
    share = min(1, excess / max(1, room))
    new_h = np.where(h > hours_cap, hours_cap, h + np.maximum(0, target - h) * share)
    gain = f(new_h).sum() / f(h).sum() - 1
    burn = tm[tm.status == "Overloaded"]
    pts = pd.DataFrame({"weekly_hours": h[::2], "output_points": out[::2], "group": np.where(h[::2] > hours_cap, "Above cap", "Within cap")})
    return {
        "steps": [f"{len(C)} consultants x 26 weeks", f"Median {np.median(out / h):.2f} output points per hour", f"Output peaks at {peak:.1f} hrs/week (R² {r2:.2f})",
                  f"{len(flagged)} people flagged by Isolation Forest", f"Bottleneck: {bott.stage} ({bott.avg_wait_hrs:.0f} hrs average wait)",
                  f"Overtime vs absence r = {corr.iloc[0, 1]}, vs engagement r = {corr.iloc[1, 1]}", f"Output {signed(gain, pct)} after rebalancing to {hours_cap} hrs", "Ready"],
        "kpis": [kpi("Average week", f"{h.mean():.1f} hrs", f"{pct((h > 55).mean(), 0)} work over 55"), kpi("Output peaks at", f"{peak:.0f} hrs", "More hours lower output beyond this"),
                 kpi("Review bottleneck", bott.stage, f"{pct(bott.avg_wait_hrs / cycle, 0)} of a {cycle:.0f}-hr cycle"),
                 kpi("Output after rebalance", signed(gain, pct), f"Cap at {hours_cap} hrs"), kpi("Cycle time after fix", f"{new_cycle:.0f} hrs", f"from {cycle:.0f} with +{extra_reviewers} reviewers")],
        "charts": [scatter("Hours vs weekly output", pts, "weekly_hours", "output_points", f"Fitted curve peaks at {peak:.0f} hours.", color="group"),
                   bar("Where deliverables wait", waits, "stage", "avg_wait_hrs"), bar("Burnout signals", corr, "outcome", "correlation_with_overtime")],
        "tables": [table("Team workload board", tm), table("Flagged consultants", flagged[["consultant_id", "team_id", "weekly_hours", "absence_days", "engagement"]])],
        "recs": [rec(f"Cap routine weeks at {hours_cap} hours", f"Output peaks near {peak:.0f} hours. Moving the excess to colleagues with spare time changes total output by {signed(gain, pct)}.", signed(gain, pct) + " output"),
                 rec(f"Add {extra_reviewers} reviewers at {bott.stage}", f"Deliverables wait {bott.avg_wait_hrs:.0f} hours there. Delegating first-pass review cuts the cycle from {cycle:.0f} to {new_cycle:.0f} hours.", f"-{cycle - new_cycle:.0f} hrs/cycle"),
                 rec(f"Rotate staff out of {len(burn) or 'the most loaded'} burnout-risk teams", ", ".join((burn if len(burn) else tm).team.head(4)) + " combine long weeks with low engagement. Move people in from teams marked 'Has room'.", "Retention"),
                 rec(f"Check in with {len(flagged)} flagged consultants", "Their mix of hours, absence and engagement is in the most unusual 5%. Reset scope this week.", "This week")],
    }


if __name__ == "__main__":
    from src.data_generator import load_or_generate
    from src.report import write_reports

    out = run(load_or_generate(), **{p["name"]: p["default"] for p in PARAMS})
    for k in out["kpis"]:
        print(f"{k['label']}: {k['value']}  {k['note']}")
    print("Reports written to", write_reports(out, META, Path(__file__).resolve().parent.parent / "reports"))
