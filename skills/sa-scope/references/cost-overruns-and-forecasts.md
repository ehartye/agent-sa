---
as_of: 2026-11-06
---

# Cost overruns, and forecasts labelled as forecasts

## Budget-overrun failure classes

Source: Khan, "Token Budgets: An Empirical Catalog of 63 LLM-Agent Budget-Overrun Incidents" (arXiv 2606.04056). This concerns run-time spend in agent frameworks, not project effort. It names what a cost gate should expect.

**Recurrence, not prevalence.** Keep this attached to any use of the catalog. The author says it establishes recurrence, not incidence, because its sampling frame selects on the dependent variable. Projects were retained partly because they showed budget failures. No "X% of deployments overrun" claim can be drawn from it, and the author makes none. Dollar figures are lower bounds seen in the public record.

- **What was counted.** 110 rows from 21 open-source sub-projects, 2023 to 2026: 63 confirmed production failure reports (57.3% of rows), 28 maintainer-acknowledged structural gaps, 14 feature requests, 5 borderline. The author calls the boundary between feature requests and unfixed bugs the codebook's weakest seam (kappa 0.727), but that concerns a separate four-class label. The 63/28/14/5 split is "a coarser editorial grouping" not recoverable from a single column, and the paper's text gives no agreement figure for the 63 itself.
- **A separate check.** A keyword-neutral cohort of 20 popular projects found qualifying rows in 12. The author calls this exploratory, since it was single-coder, and draws two weaker claims from it: the mechanisms recur, and demand for budget primitives is sustained. Its 60% is "a project-level coverage statistic, not an incidence rate".
- **Cluster counts are soft.** The eight clusters are called exploratory and descriptive. Agreement on cluster assignment was moderate (kappa 0.44), and only cost-observability (0.78) and multimodal (0.65) were reliably identified. The author does not rest claims on exact per-cluster counts. Nor should you.

| Mechanism cluster | Rows / frameworks | What to plan for |
|---|---|---|
| Retry loop | 27 / 12 | A loop costing cents per attempt, with no cumulative bound, can reach thousands of dollars before anyone notices. Set a loop limit and a spend cap. |
| Cost observability | 22 / 9 | Spend is not visible. Meter cost per task from the first prototype. |
| Context amplification | 13 / 7 | Context grows without bound in loops and optimisers. Budget for it and test sensitivity to context length. |
| Storage amplification | 13 / 5 | The paper names this cluster. Check whether stores grow with use. |
| Budget primitive missing | 12 / 6 | The framework has no real aggregate cap, or its cap regressed. Do not assume one exists. Test it. |
| Delegation fan-out | 11 / 6 | Concurrent sub-agents race past a shared budget. Test under concurrency. |
| Provider options silently dropped | 6 / 3 | A setting such as a retry limit is ignored without error. Verify settings took effect. |
| Multimodal cost amplification | 6 / 2 | Encoded images can overflow context. Test with real attachments. |

Other points from the paper:

- Magnitudes are single observations: about 2,150 US dollars of unintended spend by one user (the largest), and 235 dollars in four days by another. Do not project from them.
- Fixes ship quickly once reported, but the author found no case where an overrun was prevented before some user had paid for it. So the cap goes in scope from the start.
- Prefer a provider-side hard cap where one applies, or a runtime cap otherwise, and use provider reasoning controls for reasoning models, whose thinking tokens are not bounded by the output limit.
- A cap bounds only what the provider reports. In the author's fault-injection test, under-reporting by a factor of 2 made 666 of 1,000 simulated sessions overshoot.
- The author's evaluation of his own tool is synthetic and live-API, with no field data on reducing incidents.

**In the file.** Put the cap and loop limit in `scope.in` and make them part of a gate's `exit_criteria`. A kill criterion on cost per task belongs with the metrics.

## Writing `run_cost`

- Read prices on the vendor's own page on the day. Set `as_of` to that date. Nothing in the engine warns when it goes stale, so re-check before quoting.
- Take volumes from the file (`data_sources`, `need.workflow`) and show them in `drivers`, since a reader must be able to re-run the sum. AWS names prompt lengths, data architecture and access patterns, model selection and agent orchestration as cost drivers.
- Gate D's measured cost per task should replace the assumed figures. Say which you have.
- The `range` is text. Keep it rough and state what it excludes.

## Forecasts and analyst statements

None of these is a measured cost or a rate. Label them, and do not put them in an estimate as benchmarks.

| Statement | Origin | Status |
|---|---|---|
| "500 to 1000 percent errors of AI cost estimates are possible" | A Gartner analyst (Mary Mesaglio) in a symposium keynote, reported by The Register, September 2024 | Spoken claim, "possible" and not typical. The article gives no data. Named causes: vendor price rises, inattention to usage, AI used where search would do, longer queries under token pricing, and costly data-access designs. |
| Productivity leakage drains ten to thirty percent of AI's benefits | Same keynote | Spoken claim with no data shown. The related 43 minutes a day saved is attributed to Gartner research the article does not detail. |
| Over 40% of agentic AI projects canceled by end of 2027 | Gartner press release, June 2025 | Forecast. Reasons given (escalating costs, unclear business value, inadequate risk controls), no method or population. The report behind it is for Gartner clients. It cannot be checked until 2027 is over. |
| At least 15% of day-to-day work decisions made autonomously, and 33% of enterprise applications including agentic AI, by 2028 | Same release | Forecasts. |
| Only about 130 of the thousands of agentic AI vendors are real | Same release | Gartner's estimate, with no method given. |

The one measured item in that release is a January 2025 poll of 3,412 webinar attendees on how much they had invested in agentic AI. It says nothing about cost or cancellation. Gartner sells research to technology buyers, and the release points to a client report and a marketing eBook.

**How to use them.** They justify asking the question: what happens if usage grows and prices change? They do not answer it. Stress the range on usage growth and price change using this customer's own volumes, and show the assumptions.

For a full treatment of failure statistics, the sa-frame skill holds one.

## Sources

- https://arxiv.org/html/2606.04056
- https://www.theregister.com/software/2024/09/09/ai-bills-can-blow-out-by-1000-percent-gartner/562722
- https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027
- https://docs.aws.amazon.com/wellarchitected/latest/generative-ai-lens/generative-ai-lifecycle.html
