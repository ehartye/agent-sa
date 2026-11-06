---
name: sa-architect
description: Designs an AI system end to end as structured records in the engagement file, covering requirements, trust zones, components, data flows, decisions with dated evidence and risks, so the design and its diagrams are one thing.
when_to_use: Use when asked to "design the system", "architect this", "give me a reference architecture", "how would this work", for a "design review", or for an end-to-end design covering ingestion, retrieval, orchestration, evaluation, deployment and UX. Not for whether the use case is worth doing (sa-frame). Not for estimates or a statement of work (sa-scope). Not for generating the diagrams, decks or handoff package from a finished file (sa-deliver). Not for selecting one vendor or model as its own question when agent-stack is installed.
---

# sa-architect

This skill produces the `requirements`, `zones`, `components`, `flows`, `decisions` and `risks` sections of the engagement file, plus a rendered diagram you have looked at.

**Design in the engagement file.** The file is the design and the diagrams are drawn from it, so one change reaches every deliverable. Do not write a separate architecture document. Do not write Mermaid or draw a diagram by hand.

`<plugin-root>` is the directory holding `scripts/`, two levels up from this skill's directory. Resolve it from the SKILL.md file you loaded, not the current directory.

If `stack-models`, `stack-backend` or `stack-frontend` are available they can supply decision records. This skill works without them.

For any section's exact fields, run `node "<plugin-root>/scripts/sa.mjs" schema zones`, naming the section you need.

## References

Read these before making the decisions they cover. They hold measured evidence, limits and traps, not general advice.

- [references/data-readiness-and-ingestion.md](references/data-readiness-and-ingestion.md): read when the design has an `ingestion` or `retrieval` component, before you choose a parser, chunker or managed document service.
- [references/permission-aware-retrieval.md](references/permission-aware-retrieval.md): read when any data source has `permissions` other than `none-needed`, before you fix the index, identity or enforcement design. Several choices there cannot be undone.
- [references/agent-design-evidence.md](references/agent-design-evidence.md): read when the approach is `agent` or `multi-agent`, when a model reads untrusted content or can act through tools, when choosing fixed or agentic retrieval, or when deciding what the evaluation component must run.

## Steps

Work in this order. Each step depends on the one before it.

1. **Start from the frame.** Run `node "<plugin-root>/scripts/sa.mjs" check <file> --stage frame`. If there is no file, run `node "<plugin-root>/scripts/sa.mjs" init <file> --name "<engagement>" --customer "<customer>"` first. Errors here belong to `sa-discover` and `sa-frame`: fill what the conversation already establishes and record the rest as open `unknowns`. Never invent a metric or a data source to clear a rule.
   Done when you know the data sources, their sensitivity and permission model, and which metrics the design must hit.

2. **Write requirements.** Give each one a `kind`, a `priority` and a `source`. Where a source has document-level permissions, one requirement must say whose permissions retrieval uses, and how long a revoked permission may keep working, as a number.
   Done when at least one requirement is `security` or `compliance` (`NO_SECURITY_REQ`) and each `must` traces to a stakeholder, unknown, data source or assumption.

3. **Name trust zones first.** List every place data or compute sits: the customer tenant, each cloud, each model provider, and each third party that receives data, including hosted tracing, evaluation, parsing and search services. `BOUNDARY_UNREVIEWED` compares zones, so merging a provider into the customer's zone hides the crossing and the rule stays silent.
   Done when no external service that receives customer data shares a zone with the customer, unless a recorded decision shows why it may.

4. **Add components.** Give each a `layer`, a `zone` and the requirements it `satisfies`. Keep `tech` to a few words, because the diagram cuts off long labels. Every engagement needs a component in layer `evaluation` and one in layer `observability`. Use the evaluation component's `summary` to say what it runs: name the test set and, where it applies, the entitlement check.
   Done when `NO_EVAL`, `NO_OBSERVABILITY` and `UNMET_MUST` are silent.

5. **Trace the flows with their data.** Make the request path `F1`. If there is an index, add the ingestion path as its own flow, because permissions and labels are captured there. Set `data` on every step that carries customer data or anything derived from it: chunks, embeddings, prompts, traces, logs and evaluation samples all count as their source. A step with no `data` escapes `BOUNDARY_UNREVIEWED` and draws as a plain grey line, and log and trace steps are where this usually goes unnoticed.
   Done when every step that crosses a zone says what it carries, or plainly carries nothing sensitive, and `ORPHAN_COMPONENT` is silent.

6. **Record decisions.** For each real choice give `question`, `chosen`, `rationale`, at least one alternative with its `why_not`, `evidence`, `status`, `reversible` and `affects`. Every sensitive zone crossing needs a decision that is actually about that crossing. Set `reversible: false` for one-way choices, and put preview or unlabelled status in the `rationale`.
   Check each vendor fact on the operator's live public page now, and record the claim, the URL and today's date in `evidence`. Say who claims it when it is a vendor's claim about its own results. If you cannot reach the page, record an open unknown instead of evidence.
   Done when `NO_ALTERNATIVES`, `NO_EVIDENCE`, `STALE_EVIDENCE` and `BOUNDARY_UNREVIEWED` are silent.

7. **Record risks.** Add the failure modes the design actually has, including each fail-open and staleness mode from the references that applies. Give each an owner. A high-likelihood, high-impact risk will need a test at the next stage (`TOP_RISK_UNTESTED`).
   Done when `NO_RISKS` is silent and every open-ended concern from steps 2 to 6 is a risk or an unknown.

8. **Check, render and look.** Run `node "<plugin-root>/scripts/sa.mjs" check <file> --stage architect`, then `node "<plugin-root>/scripts/sa.mjs" render <file> --out <dir>`. Open `diagrams/architecture.svg` and each `diagrams/flow-<id>.svg`, in a browser or as an image if your tools can show one. Check that:
   - each component sits in the zone you intended;
   - every path carrying sensitive data is red, including logs and traces;
   - no `tech` label is cut off;
   - each numbered path joins the components you meant, reading the numbered legend, since a line can pass behind a box on its way.

   Fix what you find in the file and render again. Never edit the SVG. If your tools cannot show you the picture, say so in your report instead of claiming you looked.

## Reviewing an existing design

Enter the design as it stands, gaps included, with `status: proposed` on its decisions. Run `check --stage architect` and report the findings as the review, ranked by what would sink the engagement. Do not fix the design silently while transcribing it.

## Hard rules

1. Every design fact lives in the engagement file, and the deliverables come from `render`.
2. No vendor fact from memory. A fact in a decision has a live public URL and the date you read it.
3. Never silence a rule by changing the model of the system: no merged zones, no `data` dropped from a step, no decision added only so that `affects` names a component.
4. Features labelled preview, or with no label, go into the decision as such. Do not present them as production-ready.
5. No bracket placeholders. What you do not know is an open `unknown` with an owner.

## Done

`check --stage architect` reports no errors, the warnings that remain are ones you can explain, and `render` has produced a diagram you have looked at. Report the zones, each sensitive crossing and its decision, the one-way decisions, and the warnings left open.
