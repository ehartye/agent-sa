---
name: sa-deliver
description: Generates architecture diagrams, per-audience slide decks, a demo runbook, an estimate with a statement-of-work outline, and a delivery handoff from the engagement file.
when_to_use: Use when asked to "make the deck", produce an "architecture diagram", "generate the slides", build an "exec presentation", "update the deliverables", "hand this off to delivery" or draft a "statement of work". Not for gathering facts (sa-discover), design choices (sa-architect), deciding what a demo proves (sa-prototype) or estimating (sa-scope).
---

# sa-deliver

Produces everything `render` writes: decks, diagrams, spec, questions, runbook, estimate and handoff.

**Never hand-write these files. To change a deliverable, change the engagement file and regenerate.** A hand edit disagrees with every other deliverable and disappears on the next render. This holds for a one-word slide fix too.

`<plugin-root>` is the directory holding `scripts/`, two levels up from this skill's directory. Resolve it from the SKILL.md file you loaded, not the current directory.

## Hard rules

1. Never add a value to the engagement file only to silence a rule. If a fact is missing, say so.
2. Never report a deck as finished if nobody has looked at it. Say who looked, or that nobody did.
3. Never share files while errors remain without naming those errors to the user.

## What render writes

| File | Holds | Needs |
|---|---|---|
| `deck-<id>-<depth>.html` | One deck per audience | `audiences`; otherwise one `deck.html` with no ask |
| `diagrams/architecture.svg`, `.mmd` | Components, trust zones, flows | `components` and `zones` |
| `diagrams/flow-<id>.svg`, `.mmd` | A sequence diagram per flow | `flows` |
| `diagrams/roadmap.svg` | Phases and gates (SVG only) | `phases` |
| `spec.md` | Need through unknowns, with Mermaid inline | Always written |
| `questions.md` | Open questions by owner | Always written |
| `prototype.md` | Tests and demo runbook | `tests` or `demo` |
| `estimate.md` | Scope, phases, statement-of-work outline | `phases` |
| `handoff.md` | What delivery inherits | `handoff` |

## Steps

### 1. Set the audiences

Add one `audiences` entry per deck: `audience` (a stakeholder id), `depth` (`executive` or `technical`) and `ask`. The ask appears on the title slide and the closing slide. Tailor it using the reference.

Done when each audience has an ask that names a decision only that person can make.

### 2. Fill in the handoff, if delivery is taking over

Set `handoff.delivery_owner`, `handoff.commitments` and `handoff.eval_kit`.

The evaluation kit must list the working artifacts and where they live: the test set with its labels, the judge and its record of agreement with people, the harness that re-runs them, and the viewer for reading results. A slide about evaluation is not a kit.

What was shown but not real is generated from the demo's non-live beats, so check every beat has the right `mode`. `handoff.md` also lists unaccepted decisions, open unknowns, untested assumptions, open risks and prototype results.

Done when each `eval_kit` item is something delivery can open and run.

### 3. Check

```bash
node "<plugin-root>/scripts/sa.mjs" check <name>.engagement.json
```

With no `--stage`, this checks up to the furthest stage the file has started, so a passing check does not mean the later stages are done. `status` shows every stage. Clear errors with real facts, going back to the skill that owns the section if needed.

Done when `check` reports 0 errors, or you can name each remaining error and tell the user why it stands.

### 4. Render

```bash
node "<plugin-root>/scripts/sa.mjs" render <name>.engagement.json --out deliverables
```

Read the output. A `skipped` line means a section has no data, and a `note` line means judgment errors remain. Tell the user about both.

Done when every file you expected is listed as written.

### 5. Open each deck and look at it

Step through every slide of every deck, using screenshots if you have a browser tool. Some browser tools block `file:` URLs; if so, serve the folder on localhost. If you cannot view the decks, say so and ask the user to check them.

Look for clipped or very small text, tables that run off the slide, overlapping diagram labels, and any statement you would not say to that audience. Fix these by shortening text in the engagement file and rendering again.

Done when each slide has been seen and each fix was made in the engagement file.

### 6. Report the file paths

Give absolute paths to each file, then remaining errors and warnings, skipped sections, and which decks were viewed.

## Presenting

- **Move:** right and left arrows, Page Up and Page Down, or Space to advance. Home and End jump to the ends. Clicking the left third of the screen goes back; clicking elsewhere advances. Adding `#5` to the address opens slide 5.
- **Notes:** press `n` to show or hide speaker notes on the slide. Demo disclosures appear there.
- **PDF:** use the browser's Print, Save as PDF. Each slide starts a new 13.33 by 7.5 inch page, and a slide too long for one page flows onto the next rather than being cut. Enable background graphics to keep shading. Check every page.

The decks load nothing from the network, so one HTML file can be sent as is.

## Using the diagrams

Use the `.svg` files directly in documents. The `.mmd` files are Mermaid source, for any tool that renders Mermaid, and `spec.md` carries the same diagrams in fenced blocks for Markdown viewers that render them. Treat changes in another tool as one-off copies: put the facts back in the engagement file, or the next render will drop them.

## Limits

`estimate.md` holds a statement-of-work outline, not a contract. Commercial and legal terms are not generated. Decks are HTML only, with PDF through printing. Say this when asked for a full statement of work or a PowerPoint file.

## Reference

Read [references/formats-and-asks.md](references/formats-and-asks.md) when a reader expects C4, arc42 or ADR formats, when writing an `ask`, or when deciding what goes in the evaluation kit.
