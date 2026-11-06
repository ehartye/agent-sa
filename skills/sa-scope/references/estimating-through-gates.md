---
as_of: 2026-11-06
---

# Estimating through gates

## What no source supplies

In the evidence behind this reference:

- **No empirical study of effort estimation for LLM, RAG or agent projects.** Nothing compares estimates against actual effort, duration or cost.
- **No authoritative SOW standard for this work.** The vendor pages give process guidance and no effort or duration norms. `render` produces an outline only.
- **No basis for a tightening claim.** Nothing supports "+/-25% after Phase 0" or any rate at which a range narrows after a gate. Nothing shows gates beat analogy either.

If asked how accurate an estimate is, say: "These are judgment ranges. I know of no measured data on how accurate estimates for this kind of project are, or how much a discovery phase narrows them, so I will not put a percentage on it. Each gate replaces part of the guess with evidence, and I will re-estimate then." State that estimating guidance here is analytic and vendor-sourced rather than empirical.

**Limits of that null.** Checkpoint Sizing cites two estimation papers. The abstract of Coelho et al. (arXiv 2402.07158, effort and size estimation for software with LLM-based interfaces) offers "a comparison against traditional methods" through UI-based user stories and a way to estimate effort from data sources, interfaces and algorithms. It reports no comparison with actual effort, though the full paper may. Bui et al. (arXiv 2509.14483) is cited as an LLM-based framework for agile effort estimation, which is LLMs doing the estimating, not estimates for LLM projects. Check both if this question becomes contractual.

**What this does to `estimate_basis`.** No public reference class was found, so `reference-class` means your own finished comparable projects with actuals. `measured-prototype` covers only the phases the prototype measured. The rest is `judgment`.

## Checkpoint Sizing: status of the method

Source: Soundaramourty, Kilic and Chenchaiah (Cisco), "Five Fatal Assumptions: Why T-Shirt Sizing Systematically Fails for AI Projects" (arXiv 2602.17734). Keep its status attached.

- **Analytic.** The authors say the violations are characterised analytically, not through a new controlled study of their own.
- **Unvalidated.** They propose the method without empirically validating it against other approaches, and list controlled comparisons and benchmark datasets of estimates against actuals as future work.
- **Synthetic case study, with an arithmetic defect.** The worked example starts at 6-8 weeks and adds +3, +2, +3-5, +2 and +1-2 across the gates. Those sum to 11-14, which gives 17-22 weeks. The paper states 12-16. It does not say whether gate work overlaps. Use the example to show the shape of the method, a named cost for a named finding. Never quote its weeks or its overrun ratio.
- **Silent on thresholds.** The gates list artefacts. They do not say how much evidence is enough or what triggers each decision.
- **Scope.** The authors say simpler ML projects may violate fewer of the assumptions.

## The five gates

Each gate produces artefacts and metrics that change the estimate. Use these as raw material for `exit_criteria`. The paper's example runs A to E without mandating an order.

| Gate | Artefacts | Minimum evidence to exit |
|---|---|---|
| A. Data readiness | Data inventory, schema, quality report, labelling and PII policy, drift risks | Representative samples, missingness and outlier profile, edge-case map, governance sign-off if required |
| B. Evaluation harness | Task taxonomy, gold set, automated eval pipeline, failure categories | Baseline score with confidence intervals, regression tests, and a count of "unknown unknowns" the eval surfaced |
| C. Safety, reliability, control | Safety policy, refusal or grounding strategy, escalation paths, red-team plan, loop and termination controls for agents | Observed error modes, multi-turn reliability characterised, a mitigation plan mapped to failure classes |
| D. Cost and latency budgets | Throughput model, caching strategy, prompt and token budgets, tool-call budget, spend forecast | Measured p50 and p95 latency and cost per task, sensitivity to context length and agent count, a rollback plan if budgets are exceeded |
| E. Operationalisation | Dashboards, incident playbooks, feedback loops, drift detection, evaluation in production | Canary plan, SLOs, alerting, a definition of done that includes post-deploy monitoring |

Thresholds must come from the customer and from `metrics`. No source supplies them.

## The five decisions

At each gate: run the work, update the risks (retire, add, re-rank), re-estimate scope, timeline and cost from the evidence and not by analogy, then decide. If the decision is anything but proceed, record why.

The paper names the five decisions but does not define them. The meanings and file changes below are this plugin's working form.

| Decision | Meaning | What changes in the file |
|---|---|---|
| Proceed | Evidence meets the exit criteria | Update test results and assumption statuses; revise the remaining ranges |
| Pivot | The goal stands and the approach does not | Update `qualification` and affected phases, then re-run the earlier stages |
| Reduce scope | Part of the goal is unreachable or not worth it | Move items to `scope.out`; revise phases |
| Pause | Blocked on something outside the team | Open unknown with an owner, and `depends_on` on the waiting phase |
| Stop | A kill criterion tripped or the value is gone | Record the reason and stop. Rendered documents use the word "stop"; the paper says "Terminate". |

Agree the gate list and the decision options before work starts, so that pausing or stopping is already legitimate in the contract rather than a failure.

## Why estimates overrun

The paper argues T-shirt sizing rests on five assumptions that fail when the main delivery risk is model behaviour and data-dependent uncertainty. It says the slippage is a property of the problem rather than the team. Check where each figure came from before repeating it.

| Assumption | Why the paper says it fails | Figures, and their status |
|---|---|---|
| Linear effort scaling | Effort climbs steeply near high accuracy, and interaction surfaces grow combinatorially | "85% to 95% is often a 10x jump": no citation. Pairwise interactions N(N-1) (2 agents 2, 5 agents 20, 10 agents 90): arithmetic, an upper bound and not measured effort. Coordination gains saturate above about 45% baseline: second-hand, cited from Kim et al. |
| Repeatability from prior experience | Every dataset is new, and unknown unknowns surface late | "70-80% confidence" for traditional teams: no citation. 39% average drop from single-turn to multi-turn: second-hand, cited from Laban et al. |
| Effort and duration are interchangeable | Sequential phases have duration floors and do not compress with headcount | A 5-agent chain at about 3 seconds a call means about 15 seconds minimum: the paper's own arithmetic. |
| Task decomposability | Data, model and prompt layers are coupled, so changes propagate and component estimates do not add | Example 128k-token shared context window. |
| Deterministic completion | "Done" is probabilistic and can reopen on new safety or legal demands; guardrail tuning oscillates | "Weeks" of calibration: no figure. |

The authors' practical conclusions: a flat buffer such as 20% cannot cover the AI part, one finished chatbot does not predict the next, UI and backend cannot be sized separately and summed, and "done" moves. The practical consequence for this file: state whether a week is calendar time or person effort, because the third assumption says they do not convert.

## What AWS says to settle in scoping

AWS Well-Architected, Generative AI Lens, lifecycle page. Vendor guidance with no effort or duration norms. The page says "seven key phases" and lists six.

Questions to answer in scoping:

1. What kinds of models do we need to consider?
2. Will an off-the-shelf model satisfy the requirements, or must it be customised?
3. Does one model address the problem, or are several needed in an orchestrated workflow?

It also asks for success metrics, technical and organisational feasibility, a risk profile covering technology and business risks, the availability and quality of any data needed to customise the model, and security scoping matrices. Its cost drivers are prompt lengths, data architecture and access patterns, model selection and agent orchestration.

The AWS page does not say how the answers change an estimate. Treat a changed answer as a reason to re-estimate.

**Other sources on gates.** AWS's proof-of-concept guidance sets exit criteria on quality, latency and cost: pivot or end if they are missed. It also says to test core components before end-to-end integration, and to track unit economics early. Microsoft's Cloud Adoption Framework says to use business metrics as decision gates at each stage. These and Checkpoint Sizing converge on gating by evidence. None validates the others.

## Sources

- https://arxiv.org/html/2602.17734
- https://arxiv.org/pdf/2602.17734
- https://docs.aws.amazon.com/wellarchitected/latest/generative-ai-lens/generative-ai-lifecycle.html
- https://docs.aws.amazon.com/prescriptive-guidance/latest/gen-ai-lifecycle-operational-excellence/dev-architecting.html
- https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ai-agents/business-strategy-plan
- https://arxiv.org/abs/2402.07158
