# Deloitte Workload Balancer

AI solution 07 of 14 · HR · built for **Deloitte (Consulting)**

Prepared by **K Bhargav Raju**.

**Live website:** https://bhargavrajuu.github.io/deloitte-workload-balancer/

## Problem statement

Management observes declining productivity despite increasing working hours. Build an AI system that analyzes workload, overtime, absenteeism, task completion, employee engagement and performance data to identify potential operational bottlenecks and recommend workload interventions.

## Why Deloitte (Consulting)

Consulting runs on billable hours and tight deadlines, and long weeks can quietly lower output and raise burnout. This tool finds the point where extra hours stop paying off and where work gets stuck.

## Project structure

```
deloitte-workload-balancer/
├── index.html                 Website entry point (served by GitHub Pages)
├── frontend/
│   ├── css/style.css          Layout, typography, light and dark themes
│   └── js/
│       ├── engine.js          Maths, models, charts, page layout and AI analyst panel
│       └── model.js           Sample data and the algorithm for this problem (browser version)
├── app.py                     Streamlit dashboard (Python version of the website)
├── src/
│   ├── data_generator.py      Builds the sample dataset and saves it to data/
│   ├── model.py               The algorithm in Python (pandas, NumPy, scikit-learn)
│   ├── report.py              Writes results to reports/
│   ├── utils.py               Formatting and forecasting helpers
│   └── meta.json              Problem statement, company and algorithm steps
├── data/                      Sample data as CSV
├── reports/                   Results: results.json, summary.md and CSV tables
├── tests/test_model.py        pytest tests for the data and the model
├── requirements.txt
└── pytest.ini
```

## Algorithm

1. **Collect workload data**: Hours, overtime, absence, tasks, deadlines, engagement, ratings
2. **Productivity metrics**: Tasks completed per hour and on-time rate
3. **Find the hours tipping point**: Quadratic regression of weekly output on hours
4. **Detect abnormal workloads**: Distance-based outlier score on hours, absence and engagement
5. **Process mining**: Average wait at each review stage of the deliverable flow
6. **Burnout signals**: Correlate overtime with absence and engagement
7. **Rebalance simulation**: Cap hours, move excess work to lighter teams
8. **Bottleneck report**: AI analyst explains fixes

The same algorithm is implemented twice: in JavaScript (`frontend/js/model.js`) so the website runs in any browser with no server, and in Python (`src/model.py`) for analysis, the Streamlit dashboard and the tests.

## How to run

**Website:** open the live link above, or open `index.html` in a browser.

**Python:**

```bash
pip install -r requirements.txt
python -m src.data_generator     # create the sample data in data/
python -m src.model              # run the algorithm and write reports/
streamlit run app.py             # open the interactive dashboard
pytest                           # run the tests
```

## Data

600 consultants in 24 engagement teams, 26 weeks of timesheets, task logs and pulse surveys (sample data). Files: `data/consultants.csv`, `data/deliverables.csv`, `data/teams.csv`. All figures are illustrative and are not Deloitte (Consulting)'s actual numbers.

## Results (default settings, Python run)

| Measure | Value | Note |
|---|---|---|
| Average week | 49.2 hrs | 24% work over 55 |
| Output peaks at | 53 hrs | More hours lower output beyond this |
| Review bottleneck | Manager review | 35% of a 84-hr cycle |
| Output after rebalance | +2.3% | Cap at 55 hrs |
| Cycle time after fix | 76 hrs | from 84 with +2 reviewers |

### Recommended actions

1. **Cap routine weeks at 55 hours.** Output peaks near 53 hours. Moving the excess to colleagues with spare time changes total output by +2.3%.
2. **Add 2 reviewers at Manager review.** Deliverables wait 29 hours there. Delegating first-pass review cuts the cycle from 84 to 76 hours.
3. **Rotate staff out of 7 burnout-risk teams.** Public Tech, Public Audit, Health Tech, Retail Audit combine long weeks with low engagement. Move people in from teams marked 'Has room'.
4. **Check in with 20 flagged consultants.** Their mix of hours, absence and engagement is in the most unusual 5%. Reset scope this week.

Full output: [`reports/summary.md`](reports/summary.md) and [`reports/results.json`](reports/results.json).

## AI analyst panel

The website includes an "Ask the AI analyst" panel that answers questions about the results through Claude. It works when the page is opened as a Claude artifact on claude.ai. On GitHub Pages the models, charts and controls run in full and the panel shows that it is unavailable.
