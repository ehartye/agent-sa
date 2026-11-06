# agent-sa

An AI solutions architect's workflow for coding agents. It turns a customer use case into one validated engagement file, then generates the deliverables from that file: architecture diagrams, a self-contained slide deck for each audience, a demo runbook, a gated estimate and a delivery handoff.

Change one fact and regenerate, and every deliverable agrees. Nothing is written by hand twice.

## Why a file and not a folder of documents

Agents are good at discovery questions and tradeoffs. Left alone, they scatter the result across many prose files, stop at a deck outline, and leave bracket placeholders for someone to fill in. This plugin keeps the thinking in one structured file and makes the outputs generated artifacts:

- A deck is a real HTML file you can present or print to PDF. It loads nothing from the network.
- A missing baseline prints as "not yet measured", so a slide cannot imply a number nobody has.
- A demo claim with no passing test behind it fails the check. So does a mocked beat with no disclosure.
- An estimate needs ranges, written assumptions, exit criteria at every gate and something out of scope.

The references carry what an expert would not already know: measured evidence with its denominators, the method behind gated estimates, where permission-aware retrieval fails open, and an honest account of what the widely quoted AI failure statistics actually measured. Where no credible evidence exists, they say so.

## Skills

| Skill | Use it to |
|---|---|
| `sa-discover` | Prepare for a customer call and capture what you learn in the engagement file |
| `sa-frame` | Decide whether the use case is worth doing, and whether it needs an LLM, a workflow or an agent at all |
| `sa-architect` | Design the end-to-end system: data, retrieval, orchestration, evaluation, deployment and UX |
| `sa-prototype` | Plan and build a demo that de-risks real questions and says what is real |
| `sa-scope` | Produce a gated estimate and a statement-of-work outline |
| `sa-deliver` | Generate the diagrams, decks and handoff package |

## The command line

```bash
node scripts/sa.mjs init engagement.json --name "Claims triage" --customer "Acme"
node scripts/sa.mjs status engagement.json
node scripts/sa.mjs check engagement.json --stage architect
node scripts/sa.mjs render engagement.json --out deliverables
node scripts/sa.mjs schema [section]
node scripts/sa.mjs example
```

`check` exits 0 with no errors, 1 with errors, and 2 on bad usage. With `--strict`, warnings count as errors. `render` refuses a structurally broken file and reports any judgment errors that remain.

A complete worked file is in [examples/claims-triage.engagement.json](examples/claims-triage.engagement.json).

## Requirements

Node.js 22 or later. No dependencies and no network access.

## Pairing with agent-stack

[agent-stack](https://github.com/ehartye/agent-stack) selects models, backends and frontends from dated, sourced facts, and can export a decision in the shape an engagement file uses. It is optional: this plugin works on its own.

## License

MIT
