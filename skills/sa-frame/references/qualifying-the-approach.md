---
as_of: 2026-11-06
---

# Qualifying the approach

## What the evidence is

The screening rules below come from vendors who sell models, agents or cloud services: OpenAI, Microsoft and AWS. None reports measurements behind its rules. Treat them as informed practice, not a validated procedure. The one body of measurement here is a vendor-affiliated benchmark on synthetic data. Say this when a recommendation leans on any of it.

## What no source tells you

State these plainly rather than filling the gap with a confident rule.

- **No source gives numeric criteria separating a fixed workflow from an agent.** No threshold on step count, tool count, latency, cost or accuracy. Decide by cost, latency and reliability in a proof of concept, and say the choice is judgment.
- **No controlled study here shows rules or classical ML beating an LLM on a business task.** The nearest item is Pavlidis et al. (arXiv 2508.17391), on its abstract alone: on small structured datasets, few-shot LLMs did well on classification and poorly against ML models on regression, with clustering also limited. No figures, margins or dataset sizes are in the abstract, and these are not business deployments. RAND offers one interviewee's anecdote about datasets a few if-then rules could have captured. So "rules would beat the model here" is a hypothesis to test on this customer's data, not a finding to cite.
- **No source gives an accuracy level at which an agent is "ready".**

## A screening order

This order joins the sources. None of them states it in this form.

| Rung | `approach` value | Use it when | Who says so |
|---|---|---|---|
| 1 | `rules` | Steps are clear, repeatable and follow strict rules, and the rules are writable and maintainable | Microsoft; OpenAI ("a deterministic solution may suffice") |
| 2 | `classical-ml` | Prediction on structured data, especially numeric | Microsoft's pointer to non-generative models; Pavlidis abstract |
| 3 | `single-llm-call` | Summarising, generating or simple classification from general knowledge, with no outside or proprietary information | AWS, step 1 |
| 4 | `workflow` | Fixed sequence with model calls at known steps | No criteria in any source. Decide as above. |
| 5 | `rag` | Answers must rest on specific, proprietary or current documents, with no tools or multistep reasoning | Microsoft; AWS, step 2 |
| 6 | `agent` | The system must choose its next step, use tools in a flexible order or cope with unclear input, and the conditions below clearly hold | OpenAI; Microsoft; AWS, step 3 |
| 7 | `multi-agent` | See the disagreement below | OpenAI and Microsoft differ |

AWS lists fine-tuning as a fourth, later step, for a style or niche terminology that prompting and RAG cannot reach, and says RAG is the better start for most knowledge injection. The file has no approach value for it. Record it as a `decisions` entry at the architect stage.

## The criteria, by source

**OpenAI** ("A Practical Guide to Building Agents", which says it distils customer deployments and reports no data). Prioritise workflows where deterministic and rule-based methods fall short:

1. Complex decision-making: nuanced judgment, exceptions, context-sensitive decisions (refund approval).
2. Difficult-to-maintain rules: rulesets so extensive and intricate that updates are costly or error-prone (vendor security reviews).
3. Heavy reliance on unstructured data: natural language, documents, conversation (a home insurance claim).

Validate that the use case clearly meets these; otherwise a deterministic solution may suffice. Simple chatbots, single-turn LLM uses and sentiment classifiers are "not agents" in OpenAI's definition. On tools: the issue is similarity or overlap more than count, with some implementations managing more than 15 distinct tools and others struggling with fewer than 10 overlapping ones.

**Microsoft** (Cloud Adoption Framework, business plan page). Two questions rule an agent out:

- Structured or predictable task? Use regular code or non-generative models, which it calls faster, cheaper and more reliable for fixed workflows.
- Static knowledge retrieval? Use classic RAG.

Three signals favour an agent: multistep decisions where the path changes with what the system finds, many tools in a flexible order, and adaptive behaviour for incomplete or unclear input. After that it asks whether an existing SaaS agent already meets the need, before any build.

Its prioritisation rubric scores 1 to 5 on business impact, technical feasibility and user desirability, and gives no weights, combining rule or cut-off. Two of its feasibility lines read as vetoes: pause until risks can be named, and never advance with unclear or incomplete safeguards. Averaging could hide a failure on either. That reading is this plugin's, not Microsoft's. It also advises piloting the hardest steps first.

**AWS** (Prescriptive Guidance, generative AI proof of concept). Choose in this order: prompt engineering, then RAG, then agentic AI, then fine-tuning, and for a proof of concept start with the simplest method that can validate the core business value. The approaches may be combined later. A go decision needs evidence on four things: business value, data readiness, technical feasibility and risk mitigation, with exit criteria on quality, latency and cost. AWS gives no numeric thresholds. Its own page disagrees with itself on one example, 20% in prose and 30% in the table for the same handle-time goal, so do not cite either as a norm.

**Gartner** (press release, June 2025, analyst opinion). Use agents when decisions are needed, automation for routine workflows and assistants for simple retrieval. It adds that many use cases positioned as agentic do not need agents.

## Where the vendors disagree

**Single agent first, or multi-agent from the start.** OpenAI's general recommendation is to maximise a single agent first, because more agents add complexity and overhead, and to split only when an agent fails to follow complicated instructions or keeps choosing the wrong tools. Microsoft says to start with multiple agents if the use case crosses security and compliance boundaries, involves multiple teams, or has known future growth, and otherwise to test a single agent. Microsoft's sentence adds "unless the system is low complexity", which is unclear, and it appears in the alternative text of a diagram rather than the body of the page. So they share a default and differ on the governance exception. If your case crosses a compliance boundary, say which source you are following and why.

**Large rulesets: agent or code.** OpenAI lists unwieldy rulesets as a reason to consider an agent. Microsoft sends tasks that follow strict rules to regular code. The conditions differ, unwieldy against clear, and neither gives a threshold between them. A large ruleset does not settle the question on its own. Ask whether the rules can be written down and kept current, and what a wrong answer costs.

## Measured results: CRMArena-Pro

Salesforce AI Research (arXiv 2505.18878, 2025). Quote it with its limits.

**Setup.** 19 tasks with 100 query instances per task in each of two synthetic Salesforce orgs, B2B and B2C. Agents use the ReAct prompting framework. Multi-turn runs use an LLM-simulated user. The figures are percentages scored by exact match or, for free-text tasks, token-level F1, so they are not all pure success rates. Nine 2025 models were run. These results describe those models, not current ones.

Best score among the nine models, by skill:

| Skill (tasks; instances per org) | B2B single-turn | B2C single-turn | B2B multi-turn | B2C multi-turn |
|---|---|---|---|---|
| Workflow execution (2; 200) | 83.0 | 90.0 | 54.5 | 40.5 |
| Database querying and computation (8; 800) | 57.6 | 64.9 | 41.1 | 35.9 |
| Policy compliance (4; 400) | 43.3 | 42.0 | 33.8 | 33.8 |
| Text retrieval and reasoning (5; 500) | 34.7 | 36.2 | 20.7 | 20.2 |

Reading it accurately:

- The best model varies by cell (mostly gemini-2.5-pro, sometimes o1, once gemini-2.0-flash).
- The headline "58% single-turn, 35% multi-turn" comes from two different orgs: gemini-2.5-pro at 58.3 in B2C and 35.1 in B2B. Its other two scores are 54.1 (B2B single-turn) and 30.0 (B2C multi-turn). The paper's prose gives 57.6 for its B2B single-turn score. That is the Database cell: Table 2 and the mean of the four skills give 54.1.
- These overall scores are unweighted means of the four skills, not of all instances.
- Multi-turn overall scores across all nine models and both orgs run from 14.9 to 35.1.
- In a hand review of 20 failed gemini-2.5-pro runs, 9 failed because the agent did not gather the information it needed. In 1, the simulated user erred.
- The authors report near-zero confidentiality awareness across all models, measured on B2B customer-facing tasks. Targeted prompting improved it, less so for open-source models ("often below 10%"), and often at some cost to task completion.

**A reading of two sources, not a finding of either.** The authors define workflow execution as following predefined rules or conditions, and it scored highest. That is close to what Microsoft says regular code should do. The skills needing judgment over text and policy scored lowest, and that is where vendors say agents add value. So the strongest measured agent result sits where a simpler option may do, and the weakest sits where agents are said to be needed. Interactive use also needs testing in multi-turn conditions, since single-turn scores overstate it.

## Sources

- https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf
- https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ai-agents/business-strategy-plan
- https://docs.aws.amazon.com/prescriptive-guidance/latest/gen-ai-lifecycle-operational-excellence/dev-architecting.html
- https://arxiv.org/html/2505.18878v1
- https://arxiv.org/abs/2508.17391
- https://www.rand.org/pubs/research_reports/RRA2680-1.html
- https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027
