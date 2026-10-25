# Deloitte Workload Balancer: results

Built for Deloitte (Consulting). Prepared by K Bhargav Raju.

## Key figures

- **Average week:** 49.2 hrs (24% work over 55)
- **Output peaks at:** 53 hrs (More hours lower output beyond this)
- **Review bottleneck:** Manager review (35% of a 84-hr cycle)
- **Output after rebalance:** +2.3% (Cap at 55 hrs)
- **Cycle time after fix:** 76 hrs (from 84 with +2 reviewers)

## Algorithm, as it ran

1. **Collect workload data**: 600 consultants x 26 weeks
2. **Productivity metrics**: Median 2.41 output points per hour
3. **Find the hours tipping point**: Output peaks at 53.0 hrs/week (R² 0.62)
4. **Detect abnormal workloads**: 20 people flagged by Isolation Forest
5. **Process mining**: Bottleneck: Manager review (29 hrs average wait)
6. **Burnout signals**: Overtime vs absence r = 0.53, vs engagement r = -0.52
7. **Rebalance simulation**: Output +2.3% after rebalancing to 55 hrs
8. **Bottleneck report**: Ready

## Recommended actions

1. **Cap routine weeks at 55 hours.** Output peaks near 53 hours. Moving the excess to colleagues with spare time changes total output by +2.3%. *Impact: +2.3% output*
2. **Add 2 reviewers at Manager review.** Deliverables wait 29 hours there. Delegating first-pass review cuts the cycle from 84 to 76 hours. *Impact: -8 hrs/cycle*
3. **Rotate staff out of 7 burnout-risk teams.** Public Tech, Public Audit, Health Tech, Retail Audit combine long weeks with low engagement. Move people in from teams marked 'Has room'. *Impact: Retention*
4. **Check in with 20 flagged consultants.** Their mix of hours, absence and engagement is in the most unusual 5%. Reset scope this week. *Impact: This week*

_Generated from sample data. Figures are illustrative._
