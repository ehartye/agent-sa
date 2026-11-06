# Formats and asks

## Architecture formats a reader may expect

**Foundational.** C4, arc42 and ADRs are general software-architecture practice. Their home pages do not mention LLM systems, and no source cited here shows them applied to one. The mappings below are this plugin's own reading. None of these sites states them.

### C4 model

C4 is notation independent and tooling independent. It defines four levels of diagram (system context, containers, components, code) and three supporting diagrams (system landscape, dynamic, deployment).

| C4 diagram | What the engine generates |
|---|---|
| System context | Partly: `architecture.svg` shows people and external systems, but on one view with everything else |
| Containers | Partly: same diagram, grouped by trust zone rather than by system |
| Components, code | Not generated |
| Dynamic | `flow-<id>.svg` |
| Deployment | Partly: trust zones show where things sit, not infrastructure |
| System landscape | Not generated |

The engine draws one combined view, not separate levels. Tell a reader who expects strict C4 levels.

### arc42

| arc42 section | Where it is |
|---|---|
| 1 Introduction and Goals | `spec.md` sections 1 to 3 |
| 2 Constraints | Partly: security and compliance entries in section 7 |
| 3 Context and Scope | Section 8 diagram; scope in `estimate.md` |
| 4 Solution Strategy | Section 5 |
| 5 Building Block View | Section 8 component table |
| 6 Runtime View | Flows in section 8 |
| 7 Deployment View | Partly: zones in section 8 |
| 8 Crosscutting Concepts | Not generated |
| 9 Architecture Decisions | Section 9 |
| 10 Quality Requirements | Sections 3 and 7 |
| 11 Risks and Technical Debt | Sections 10 and 11; no separate debt list |
| 12 Glossary | Not generated |

### Architecture decision records

An ADR records one architectural decision and its rationale, and a project's set of ADRs is its decision log. Named forms include the Y-statement (Zdun et al.), Michael Nygard's 2011 template, and MADR. Field lists for the first two are at the links on the ADR site.

| MADR section | Engagement file field in `decisions` |
|---|---|
| Context and Problem Statement | `question` |
| Considered Options | `alternatives` plus `chosen` |
| Decision Outcome | `chosen` and `rationale` |
| Status (optional) | `status` |
| Consequences (optional) | Not a field; state them in `rationale` |
| Decision Drivers (optional) | Not a field; `rationale` can name the requirement |

`spec.md` section 9 prints each decision in this order, with its alternatives and evidence.

## Tailoring an ask

No source cited here gives evidence on how to write an ask, so the form here is this plugin's position. Write one sentence that starts with a verb, names a decision this person can make, and says what it costs or commits them to.

| Weak | Better |
|---|---|
| Feedback on the proposal | Fund the 3 to 5 week proof phase and name an owner for the re-triage baseline |
| Review the architecture | Confirm the boundary in X1 and review the audit log design |

Depth changes what the deck shows, so choose it by the decision the person must make:

| | `executive` | `technical` |
|---|---|---|
| Metrics | Business, safety and cost | All |
| Flow slides | None | One per flow |
| Decisions | Up to 5, with why | Up to 10, with alternatives |
| Rejected approaches | Up to 3 | Up to 6 |
| Risks | Top 5 | Top 8 |

Two practitioner habits, both self-reported in Husain's post, help with the wording:

- **For executives, offer a decision point instead of a feature date.** Eugene Yan reassures leadership with timeboxes and a pivot at any step. Bryan Bischof's capability funnel reports progress as levels of usefulness, for a query assistant from valid syntax up to solving the user's problem.
- **Match the language to the reader.** Say "making sure the model has the right context" to a domain expert, and keep the precise technical term for technical readers.

## What the evaluation kit can hold

Husain's post describes these as parts of a team's improvement loop. It does not call them a handoff package, and grouping them here is this plugin's choice. No source here tested whether handing them over helps. Consider listing each in `eval_kit`:

- The data viewer and its labelled sessions
- The prompt environment, an admin mode of the real interface for editing prompts. The post's section is about letting domain experts write prompts, while its caption says the mode is "used by the engineering & product team"
- Synthetic and real test sets
- Judge prompts with their record of agreement with people
- The log of experiments, including failures

## Sources

- https://c4model.com/
- https://docs.arc42.org/home/
- https://adr.github.io/
- https://adr.github.io/madr/
- https://hamel.dev/blog/posts/field-guide/
