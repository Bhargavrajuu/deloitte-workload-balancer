"""Sample data for Deloitte: 600 consultants in 24 teams, timesheets, output, surveys and deliverable stage waits."""
from pathlib import Path

import numpy as np
import pandas as pd

STAGES = ["Drafting", "Senior review", "Manager review", "Partner sign-off", "Client feedback"]
BASE_WAIT = [6, 9, 30, 18, 22]


def generate(seed: int = 42) -> dict:
    rng = np.random.default_rng(seed)
    sectors, practices = ["Banking", "Insurance", "Retail", "Energy", "Health", "Public"], ["Audit", "Tax", "Advisory", "Tech"]
    teams = pd.DataFrame({"team_id": [f"T{i + 1}" for i in range(24)], "team": [f"{sectors[i % 6]} {practices[i // 6]}" for i in range(24)],
                          "load_factor": rng.uniform(0.8, 1.25, 24).round(3), "manager_review_speed": rng.uniform(0.7, 1.3, 24).round(3)})
    rows = []
    for i in range(600):
        t = teams.iloc[i % 24]
        hrs = float(np.clip(rng.normal(46 * t.load_factor, 5), 36, 80)); over = max(0, hrs - 52)
        out = max(5, 2.6 * hrs - 0.032 * (hrs - 40) ** 2 * 2.6 - 0.9 * over ** 2 / 10 + rng.normal(0, 7))
        rows.append({"consultant_id": f"D{7000 + i}", "team_id": t.team_id, "grade": rng.choice(["Analyst", "Consultant", "Senior", "Manager"], p=[4 / 12.5, 4 / 12.5, 3 / 12.5, 1.5 / 12.5]),
                     "weekly_hours": round(hrs, 1), "output_points": round(out, 1), "absence_days": round(max(0, rng.normal(0.5 + 0.09 * max(0, hrs - 48), 0.6)), 2),
                     "engagement": round(float(np.clip(rng.normal(4.0 - 0.05 * max(0, hrs - 45), 0.45), 1, 5)), 2),
                     "on_time_rate": round(float(np.clip(rng.normal(0.92 - 0.006 * max(0, hrs - 50), 0.05), 0.4, 1)), 3)})
    items = []
    for i in range(1800):
        t = teams.iloc[i % 24]
        row = {"deliverable_id": f"W{i + 1}", "team_id": t.team_id}
        for j, s in enumerate(STAGES):
            row[f"wait_{s.lower().replace(' ', '_').replace('-', '_')}_hrs"] = round(max(0.5, rng.normal(BASE_WAIT[j] * (t.manager_review_speed if j == 2 else 1), BASE_WAIT[j] * 0.35)), 1)
        items.append(row)
    return {"teams": teams, "consultants": pd.DataFrame(rows), "deliverables": pd.DataFrame(items)}


# ---------------------------------------------------------------------------
# Save and load helpers
# ---------------------------------------------------------------------------
DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def save(data: dict, folder: Path = DATA_DIR) -> None:
    folder = Path(folder)
    folder.mkdir(parents=True, exist_ok=True)
    for name, df in data.items():
        df.to_csv(folder / f"{name}.csv", index=False)


def load_or_generate(folder: Path = DATA_DIR, seed: int = 42) -> dict:
    """Read the CSVs in data/ if they exist, otherwise generate fresh sample data."""
    folder = Path(folder)
    names = list(generate(seed).keys())
    if all((folder / f"{n}.csv").exists() for n in names):
        return {n: pd.read_csv(folder / f"{n}.csv") for n in names}
    return generate(seed)


if __name__ == "__main__":
    d = generate(42)
    save(d)
    for n, df in d.items():
        print(f"data/{n}.csv  {len(df):,} rows x {df.shape[1]} columns")
