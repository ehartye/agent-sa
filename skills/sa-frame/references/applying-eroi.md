---
as_of: 2026-11-06
---

# Applying eROI, and the costs that stay invisible

## Status of the method

eROI comes from one preprint: Provost and Ipeirotis, "AI Strategy: How to Choose What AI Product to Implement" (arXiv 2607.23733). Keep these caveats, which are the authors' own, attached to it:

- Both authors worked at Compass from 2019 to 2022, the period of their case study, and declare this as a potential conflict of interest.
- The case is retrospective and author-involved. They say it illustrates how the framework organises choices rather than testing its predictive accuracy.
- The business cases are coarse, back-of-the-envelope figures, not audited ones.
- One company in one industry cannot show how far the method generalises.

No source cited here tests whether using eROI improves outcomes. Present it as a way to structure a judgment, not as a validated predictor.

## The method

eROI is proportional to (value if successful x likelihood of success) / investment required. The authors use a proportionality sign on purpose, for two reasons. A quick win and a moonshot can both be attractive. And the quantity usually need not be computed: ordinal ratings carry enough to rank projects, and the final call stays with the stakeholders. Do not multiply the ratings into a score.

The separation breaks a deadlock: a team cannot estimate ROI until it knows whether the project will work, and cannot know that without building it. The authors say the component that most often decides the outcome is whether an AI accurate enough for the application is achievable at all.

## Fitting it to the engagement file

The paper rates on four levels: Low, Medium, High, Very High. The file uses the same four: low, medium, high, very-high. Sub-ratings have no field of their own, so they also go in `why`.

Direction trap: value and likelihood are better when high, and investment is better when low. "High, high, high" is not a good profile.

## What to rate

**Value if successful.** Choose the level of success first. The authors recommend the minimum reasonable level that is still compelling, since a wilder claim raises the bar for likelihood.

| Sub-dimension | The question |
|---|---|
| Strategic alignment | The first filter. If the fit takes long explanation or the benefit is very indirect, question the investment. |
| Direct product value | Revenue: steady-state profit. Cost: net reduction, thought through end to end. Automating one step lifts the workflow only in proportion to that step's share (the paper's analogy to Amdahl's law). Judge against the best existing alternative. |
| Option value | Data assets and platform components later products can reuse. The authors say it is not unusual for this to exceed direct value. |
| Understanding value | What the business learns even if nothing ships. |

Ongoing costs of new roles, such as people verifying AI output, reduce the net saving. One-off reengineering belongs in investment.

**Likelihood of success.** Rate each by its certainty, so higher is always better. Each is necessary: one low caps the overall rating, and more lows only pull it lower.

| Certainty | The question |
|---|---|
| Product | If built, would it realise the value? Would people use and trust it? Trust, safety, compliance, fairness and privacy risks sit here. |
| Technical | Can it be built cost-effectively with this team and infrastructure? |
| Data | Is the data there and good enough? Is the target clear, or a proxy? |
| Scientific | Can it reach sufficient accuracy, and will the cost of its errors make it useless? |

Two traps sit under scientific certainty:

- **Causal prediction.** If the system recommends an action that changes the outcome, the counterfactual is never observed. Without an experiment or natural experiment, observational data cannot reveal the effect. The next step is then a search for identifying variation, not a pilot, and without that variation the authors say the project fails the gate.
- **Generative output.** The predictive difficulty is hidden, because the output does not look like a prediction and errors are harder to detect automatically. The authors say scientific uncertainty matters just as much.

**Investment required.** Team effort (established techniques or research?), data asset investment (can version 1.0 use existing data?), and integration and productization. The last includes UX, pipelines, process reengineering, guardrails, monitoring and more people in the loop. Regulated domains add legal review, fairness and privacy safeguards and disclosure, which the authors say can lift investment well above what a prototype suggests.

## Rating anchors

Paraphrased from the paper's Table 1.

| Rating | Value (higher is better) | Likelihood (higher is better) | Investment (lower is better) |
|---|---|---|---|
| Low | Marginal gain on the best alternative, narrow, little reuse | Low certainty on any of the four: a good outcome is speculative | Established techniques, existing data, light integration |
| Medium | Clear benefit to one product area, some strategic fit | At least one of the four unproven: a pilot is needed | Substantial but understood build, some new data or integration |
| High | Cross-product benefit, strong fit, reusable assets | High certainty on all four, few open risks | Research or heavy productization, new data assets |
| Very High | Strategy-defining, with major option and understanding value | Very high certainty on all four, proven on close comparables | Open-ended, research-grade, major new data and infrastructure |

## Combining and comparing

- Value and investment are holistic judgments, not sums or averages. The authors note some practitioners prefer to sum. A single High does not by itself raise investment if the others are lower.
- Likelihood is gated by its weakest part, as above.
- One fact may inform two pillars without double counting. A cheap incumbent shrinks the payoff and makes adoption less certain.
- When one profile is better or equal on every pillar, the choice is easy. When profiles conflict, the method will not settle it. Keep the opposing dimensions visible and let stakeholders decide.
- Build a portfolio, not a single pick. The archetypes are: potential big win (very high, high, medium), quick win (high, high, low), strategic bet (very high, medium, high, with a staged first commitment) and research investment (high value, likelihood uncertain).
- "High investment" describes the eventual cost, not a lump sum committed up front.

**Controls against inflated scores.** Champions have an incentive to inflate. The authors suggest an independent process owner, a cross-functional panel that rates each pillar separately and then reconciles, and treating divergent scores as a prompt to surface assumptions rather than something to average away.

## The worked case, as an illustration only

Three Compass candidates, rated retrospectively by the authors.

| Candidate | Value | Likelihood | Investment | What happened |
|---|---|---|---|---|
| Likely-to-sell recommendations | Very high | High | Medium | Built. The company reported a nine-figure annual commission sum on an earnings call. |
| Time-on-market pricing tool | Medium to high | Low (data and scientific both low) | High | Set aside. A causal problem with no identifying variation in price. |
| Generative renovation visuals | Low to medium | Medium | Medium | Generative errors judged too risky to deploy. The substitute gained limited traction against cheaper virtual staging. |

The first two looked equally attractive to the people championing them, and a simple ROI estimate could not tell them apart. That is the point of the method. The authors also conclude that novelty does not translate into high eROI, and that a project which cannot be deployed responsibly is not high-eROI.

The paper's dimensions do not address growth in running cost after launch.

## Invisible costs

Source: Stanford Digital Economy Lab, "The Enterprise AI Playbook" (April 2026).

**State the selection bias whenever you use it.** The report studies 51 cases in 41 organisations, chosen because they were already live, adopted for 3+ months, quantified and scalable. The authors name selection bias toward positive outcomes as a known limitation, disclaim representative data on how common success is, and say the data is mainly self-reported. So these figures describe what success cost. They say nothing about how often it happens. The report's text does not give the breakdown behind the 77%.

- 77% of the hardest challenges were invisible and intangible costs: change management, data quality and process redesign.
- 61% of successful projects had at least one prior failure, whose cost never appears in the final ROI. The report's methodology text says "Two thirds of the companies", a different unit: 41 organisations against 51 implementations. Do not swap one for the other.
- The report restates earlier J-curve research: for every 1 dollar of tangible technology investment, companies spend up to 10 on intangibles. That is a citation inside the report, not a Stanford measurement. Do not use it as a multiplier.

Cost lines to consider when rating `investment`, each reported by at least one case. The list as a checklist is this plugin's arrangement, not the report's.

| Cost line | What the report shows |
|---|---|
| Process cleanup before building | An invoice case reduced thousands of templates to hundreds, as a precondition for any AI working. |
| Data access layer | Of implementations where architecture could be assessed, 59% had data scattered across teams and 16% had it fully centralised. Success required access, not centralisation. Only 6% had data fully ready. |
| Expert review and annotation | In the invoice case, subject-matter experts reviewed thousands of outputs on top of their daily work. |
| Sponsor time | 58% of sponsors were at active steering level and 29% at strategic integration. |
| Change management and resistance | Legal, HR, Risk and Compliance were the most frequent source of resistance at 35%, against 23% for internal end users. |
| Security and compliance build-out | The report calls it a tax that is real but front-loaded. One regulated case took multiple years to set up, and later projects reused it. |
| Capability handover | The invoice case embedded two junior IT staff from day one so the company could run the system itself. |
| At least one failed attempt | See the 61% above. 73% of implementations started small deliberately. |
| Shadow AI governance | Mentioned in 15% of cases. One security analysis found 1,500 to 1,600 tools in use. |

## Sources

- https://arxiv.org/pdf/2607.23733
- https://digitaleconomy.stanford.edu/app/uploads/2026/03/EnterpriseAIPlaybook_PereiraGraylinBrynjolfsson.pdf
