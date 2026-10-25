# Deloitte Workload Balancer

AI solution 07 of 14 · HR · built for **Deloitte (Consulting)**

Prepared by **K Bhargav Raju**.

## Problem statement

Management observes declining productivity despite increasing working hours. Build an AI system that analyzes workload, overtime, absenteeism, task completion, employee engagement and performance data to identify potential operational bottlenecks and recommend workload interventions.

## Why Deloitte (Consulting)

Consulting runs on billable hours and tight deadlines, and long weeks can quietly lower output and raise burnout. This tool finds the point where extra hours stop paying off and where work gets stuck.

## Algorithm

1. **Collect workload data**: Hours, overtime, absence, tasks, deadlines, engagement, ratings
2. **Productivity metrics**: Tasks completed per hour and on-time rate
3. **Find the hours tipping point**: Quadratic regression of weekly output on hours
4. **Detect abnormal workloads**: Distance-based outlier score on hours, absence and engagement
5. **Process mining**: Average wait at each review stage of the deliverable flow
6. **Burnout signals**: Correlate overtime with absence and engagement
7. **Rebalance simulation**: Cap hours, move excess work to lighter teams
8. **Bottleneck report**: AI analyst explains fixes

## Data

600 consultants in 24 engagement teams, 26 weeks of timesheets, task logs and pulse surveys (sample data). All figures are illustrative and are not Deloitte (Consulting)'s actual numbers.

## How to use

Open `index.html` in any web browser. No installation is needed; the whole tool is one self-contained file.

The controls panel lets you change weekly hours cap, extra manager reviewers, and the analysis reruns instantly. "New sample data" generates a fresh dataset.

## AI analyst panel

The "Ask the AI analyst" panel answers questions about the results in plain English through Claude. It works when the page is opened as a Claude artifact on claude.ai. Opened from GitHub, GitHub Pages or a local folder, all the models, charts and controls still run, and the panel shows that it is unavailable.
