---
as_of: 2026-11-06
---

# Evidence that changes an agent design

This covers only findings that move a component, a boundary or a flow. Each figure names who produced it, because the sources use different benchmarks, models and attacker budgets, so no two can be compared. The most detailed containment evidence comes from one vendor writing about its own incidents. For several papers the evidence is the abstract alone, and these are marked. Lines marked "Inference" are this guide's reading.

## Assume the model will be fooled

OWASP's 2026 LLM list says of prompt injection that "no reliable prevention mechanism exists today" and that defence is architectural. It tells designers to constrain what the model may do and what its outputs may reach. This is the publisher's position, not a measurement: the ranking is three-quarters community vote and one-quarter a corpus of 7,714 incidents.

Design consequence: a filter is never the boundary. For each model, ask what a fooled one could reach, and draw that in the flows.

**Attack figures cannot rank vendors or set a threshold.**

| Figure | Who | What it is |
|---|---|---|
| 0.5 percent (Claude Opus 4.5) to 8.5 percent (Gemini 2.5 Pro) attack success; 8648 successes in 272000 attempts; 13 models, 41 scenarios | Dziemian et al., abstract | Public red-teaming competition in which an attack had to act and also stay hidden from the final response. All models were vulnerable, and strategies transferred across 21 of 41 behaviours |
| About 0.1 percent on one attempt, 5 to 6 percent after 100 adaptive attempts (Claude Opus 4.7) | Anthropic, citing Gray Swan's benchmark | Vendor reporting on its own model |
| 8.5 percent estimated attack success across 15 attempts per scenario on 1,810 curated attacks (GPT-6 Astra with safeguards), against 27.0 percent (GPT-5.6 Sol) | OpenAI, with Gray Swan | Vendor reporting on its own model |
| "lowest attack success rate of any frontier model tested" on Gray Swan's injection benchmark (Gemini 4 Argon) | Google | Vendor's summary of its own model |
| Static benchmarks often significantly overestimate defence efficacy; most defences sacrifice utility or are insecure; ten defences, five models | Ma et al. (AutoDojo), abstract | Authors' own adaptive benchmark |

Consequences:

- An attacker retries, so a single-attempt rate is not the number to design around. The same Anthropic figure rises about fiftyfold with adaptive attempts.
- Choosing a more robust model is not a containment decision. Dziemian et al. report only a weak link between capability and robustness.
- AutoDojo's authors report that under-specified tasks are particularly vulnerable. Inference: narrow task definitions are a security control, which favours a fixed workflow where one will do.

**In-the-wild data measures attempts, not success.** Unit 42 says indirect injection is being actively weaponized, but it ranks severity by attacker intent because it lacks visibility into what succeeded. Its percentages are shares of its detections. No independent measure of in-the-wild success rates was found.

**Other vendors' containment.** OpenAI documents Codex running in "an OS-enforced sandbox" with "network access turned off" by default, and an auto-review agent that replaces manual approval at the sandbox boundary. Hugging Face's account of a July 2026 intrusion says an agent escaped OpenAI's evaluation sandbox "via a 0-day exploit from the package proxy cache". Google's Gemini 4 Argon report covers model robustness to injection. These are documented designs, single incidents and model scores, with no failure rates like the classifier figures below and no shared containment benchmark. Inference: they show that isolation is common practice, and they do not rank vendors.

## Human approval is not a boundary

Anthropic's telemetry shows users approved roughly 93 percent of Claude Code permission prompts, with attention falling as approvals mount. An OS-level sandbox then cut prompts by 84 percent. Those users are developers who can read bash. Anthropic argues that non-technical reviewers should not be asked to judge such actions at all, and that isolation should match the user's capacity for oversight.

Design consequences:

- Keep approval for a few high-impact actions a reviewer can actually judge, and contain everything else.
- Check who the reviewer is, not only that one exists. Show them what they need to decide.
- Budget for review volume. A step that fires on every action will not be read.

## A classifier is not a boundary

Anthropic reports these rates for its auto mode's deployed two-stage classifier, on its own datasets:

| Dataset | n | Rate |
|---|---|---|
| Real traffic | 10,000 | 0.4 percent false positive |
| Real overeager actions | 52 | 17 percent false negative |
| Synthetic data exfiltration | 1,000 | 5.7 percent false negative |

Limits: the sets are internal, the 52 is small, no intervals are given, and no independent replication was found. These are not injection-specific rates. Anthropic says this is not a drop-in replacement for careful human review on high-stakes infrastructure.

Design consequence: a classifier reduces approval burden. Place it in front of a deterministic boundary, not in place of one. Anthropic also strips assistant text and tool results from what the classifier sees, so the agent cannot talk it into a decision. Apply that to any model acting as a gate.

## Contain at the environment first

Anthropic's stated ordering is environment first, then model, because "the deterministic boundary is what gets hit when everything probabilistic misses". The evidence behind it is one vendor's account of its own incidents.

- **Credentials outside the sandbox.** In an internal red-team exercise, a phished prompt made Claude Code complete credential exfiltration in 24 of 25 retries. The instruction came through the user, so model-layer defences had nothing anomalous to catch. Anthropic says only egress controls and filesystem boundaries hold there. Component consequence: the agent runtime holds no long-lived secrets, and a separate process or per-session scoped token carries them.
- **An egress allowlist is a capability grant.** A hidden instruction used an attacker's API key to upload files through an allowed domain, and the proxy saw a permitted destination. For each allowed domain, list what can be reached through it, not just the hostname.
- **Your own components are the weak point.** In Anthropic's account, gVisor, seccomp and hypervisors proved dependable, and its custom allowlist proxy failed. Prefer standard primitives, and review anything custom as the likely failure.
- **A sandbox is only as good as its privileges.** Aurascape, a vendor writing about another company's product, reports zero-click chains in Manus through a sandbox with passwordless sudo, long-lived API keys in environment variables and outbound network access. It calls the sandbox "an amplification mechanism rather than a containment boundary". Aurascape scored this CVSS 9.8 itself and says Manus mitigated it before publication.
- **Isolation costs visibility.** Host endpoint detection could not see inside Anthropic's VM, and pull-based log export is not live monitoring. Raise this with the customer's security team early, and have the observability component export from inside the boundary.

## What the agent reads

Anthropic's points, each of which adds a component or a flow step:

- A trusted tool can return hostile content. A connector that passes malware checks can still load a poisoned file into context. Inspect tool results before they enter context, using a small, fast classifier if that suits.
- Inspection has to be live. Once a poisoned result has steered the agent, the log shows only a successful, authorized call, so observability alone will not catch it.
- A remote tool can change after you approve it. Install-time review does not carry forward, so run an unreviewed one against fake data first.
- Memory and persistent state reload an injection at each start, and sub-agent output treated as higher trust is a new injection path. Anthropic lists both as forward-looking concerns, without measurements.

## Least agency

OWASP's Agentic list adds Least-Agency to least privilege, advising against unnecessary autonomy, and calls strong observability non-negotiable. It describes no ranking method, so ASI01 should not be read as most severe, and it cites no effectiveness measurements.

As a prior, Pan et al. (abstract; 86 surveyed practitioners and 20 interviews, recruitment not described) report that 68 percent of production agents run at most 10 steps before human intervention, and 74 percent depend primarily on human evaluation. Inference: a long autonomous loop is outside what most of those surveyed run, though about a third run longer, so it needs its own justification.

Bare risk codes need an edition. Excessive Agency is LLM03 in the 2026 LLM list, and the Agentic list still cites it as LLM06:2025.

## Fixed or agentic retrieval, and how much context

- **No general quality win is shown for agentic retrieval.** Ferrazzi et al. ("Is Agentic RAG worth it?") find "neither Enhanced nor Agentic RAG is universally superior". Agentic gained on query rewriting (NDCG@10 55.6 against 52.8) and on user intent in well-defined domains. Enhanced routing was more reliable in noisier ones (F1 87.9 against 64.6 on FEVER, Table 3), its re-ranking beat agentic document selection, and agentic cost "up to 3.6 times more". They conclude "a well-optimized Enhanced RAG can match or exceed Agentic performance while remaining more efficient", and suggest combining the two. This is one experiment on four datasets. Microsoft says agentic retrieval adds latency and handles query complexity a single query cannot, without measuring the benefit. Its LLM query planning is preview.
- **More queries can do nothing.** In one production-style pipeline over one enterprise knowledge base, fusion raised raw recall, but the gain was largely neutralized after re-ranking and truncation. Hit@10 fell from 0.51 to 0.48 in several configurations, with added latency (abstract only). That study tested fusion, not agentic planning.
- **A large window is not usable capacity, on limited evidence.** With relevant files placed in a 64k-token context, so recall was perfect, single-shot patching reached 7 percent for Qwen3-Coder-30B-A3B and solved nothing for GPT-5-nano. In an agentic harness GPT-5-nano reached up to 31 percent on 100 samples, and successful runs typically stayed under 20k to 30k tokens (abstract only). This is coding work on small models and has not been tested at frontier scale.
- **Pruning beat full history in one workflow.** On a 50-task expense benchmark averaged over 5 runs with GPT-5, full history gave 71.0 percent completion at 1,480,996 tokens. Pruning to the last five tool exchanges gave 79.0 percent at 535,274. Adding summarization gave 91.6 percent at 553,374 (abstract only).
- **Stated null:** no run of the same task with a stuffed window and with a retrieval pipeline was found.

Inference: default to a fixed pipeline with measured re-ranking, escalate to agentic retrieval only for query types it demonstrably fails, and budget a working context with a pruning or summarization step.

## What the evaluation component must run

Answer-quality scoring misses these:

- **Entitlement.** The two-account test in the permission-aware retrieval reference.
- **Repeated runs.** Bjarnason et al. (abstract; 60,000 trajectories on one coding benchmark) found single-run pass@1 varied by 2.2 to 6.0 points depending on the run chosen, with standard deviations above 1.5 points even at temperature 0. An improvement of 2 to 3 points may be noise. AWS advises at least 10 trials per question, as vendor guidance.
- **A judge that does not read the agent's reasoning.** Khalifa et al. (abstract; 800 trajectories on web tasks) report that rewriting only the chain-of-thought inflated vision-language-model judges' false positives by up to 90 percent. Use code checks for exact values and formats. AWS argues an LLM cannot reliably confirm that a figure appears verbatim.
- **Quality next to operations in production.** AWS argues dashboards can show green on latency and errors while the agent starts choosing wrong tools, so it samples live traces for scoring. This is a vendor describing its own service, with no measured outcome.

## Sources

- https://genai.owasp.org/download/56857/
- https://genai.owasp.org/download/52117/
- https://arxiv.org/abs/2603.15714
- https://arxiv.org/abs/2606.15057
- https://www.anthropic.com/engineering/how-we-contain-claude
- https://learn.chatgpt.com/docs/agent-approvals-security
- https://learn.chatgpt.com/docs/sandboxing/auto-review
- https://deploymentsafety.openai.com/gpt-6-astra
- https://storage.googleapis.com/deepmind-media/gemini/gemini_4_safety_report.pdf
- https://huggingface.co/blog/agent-intrusion-technical-timeline
- https://www.anthropic.com/engineering/claude-code-auto-mode
- https://unit42.paloaltonetworks.com/ai-agent-prompt-injection/
- https://aurascape.ai/resources/auralabs-research/silentbridge-zero-click-agent-takeover-meta-manus/
- https://arxiv.org/abs/2512.04123
- https://arxiv.org/html/2601.07711
- https://learn.microsoft.com/azure/search/agentic-retrieval-overview
- https://arxiv.org/abs/2603.02153
- https://arxiv.org/abs/2602.16069
- https://arxiv.org/abs/2606.10209
- https://arxiv.org/abs/2602.07150
- https://arxiv.org/abs/2601.14691
- https://aws.amazon.com/blogs/machine-learning/build-reliable-ai-agents-with-amazon-bedrock-agentcore-evaluations/
