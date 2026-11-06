---
name: sa-scope
description: Turns a framed AI engagement into gated phases with low and high effort ranges, written assumptions, exclusions and a dated running-cost range, and generates the estimate from them.
when_to_use: Use when asked to "scope this", "estimate this", "how long will this take", for a "statement of work" or "SOW", when "sales needs a number by Friday", "what will this cost to run", or for a ballpark or a quote. Not for whether it is worth doing (sa-frame), system design (sa-architect), or generating the final deck and documents for an audience (sa-deliver renders those).
---

# sa-scope

Produces the `scope`, `phases` and `assumptions` sections of the engagement file, and a generated `estimate.md`. Never hand-write an estimate or a statement of work: both come from `render`.

**Estimate through gates. Each phase has a low and high range, exit criteria and a `depends_on` naming what it rests on. Each gate decides proceed, pivot, reduce scope, pause or stop, and re-estimates what remains from evidence.** The first estimate is a hypothesis to test, not a commitment to defend. Only the next phase is firm enough to commit to.

`<plugin-root>` is the directory holding `scripts/`, two levels up from this skill's directory. Resolve it from the SKILL.md file you loaded, not the current directory.

## Hard rules

1. No base figure and no tightening claim, such as "+/-25% after Phase 0". There is no empirical basis for one. If asked, say so plainly: see [references/estimating-through-gates.md](references/estimating-through-gates.md).
2. No false precision. Give ranges in whole weeks unless a prototype measured something finer. "8.5 person-weeks" implies a measurement nobody made.
3. Set `estimate_basis` honestly. It is `judgment` unless you hold actuals from comparable finished projects (`reference-class`) or measured the work in a prototype (`measured-prototype`).
4. Never quote a price from memory. Read it on the vendor's page today and set `run_cost.as_of`, or leave the range out and say so.
5. Do not invent a design or a demo to clear earlier stages. A provisional estimate that says it is provisional is fine.
6. Do not quote analyst forecasts or case-study week counts as benchmarks.

## Steps

### 1. Read the current state

```bash
node "<plugin-root>/scripts/sa.mjs" status <file>
node "<plugin-root>/scripts/sa.mjs" schema phases
```

Run `schema scope` and `schema assumptions` as well.

`check --stage scope` also runs every earlier stage, including architect and prototype. If those are blocked, a deadline does not change that. Do the scope work anyway, check it with `--only-stage`, say in your reply which stages are unfinished and that the estimate rests on them, and hand the gaps to the skills that own them (sa-frame, sa-architect, sa-prototype). Never invent ratings, a sponsor or a design to clear them. `render` marks everything as a draft until they clear.

Done when you know which earlier stages are blocked and what the estimate cannot yet rest on.

### 2. Set the boundary

Fill `scope.in` and `scope.out` (NOTHING_OUT_OF_SCOPE). Make `out` hold things someone would otherwise assume were included. A spend cap and loop limit for any agent belong in `in`.

Done when a customer reading `out` could disagree with a line.

### 3. Write the assumptions

Each entry has a `statement`, a `source`, and an `if_wrong` saying what happens to the estimate (NO_ASSUMPTIONS). Where an assumption has no test covering it, ASSUMPTION_UNTESTED warns. Answer it by adding a test through sa-prototype or by naming the warning in your reply.

Done when each `if_wrong` names a consequence, not just "the estimate may change".

### 4. Build phases around gates

Read [references/estimating-through-gates.md](references/estimating-through-gates.md). Use its five gates as the source of exit criteria, merged into as many phases as suit the work. Then for each phase:

- Give `effort_weeks` with low below high (POINT_ESTIMATE).
- Write `exit_criteria` a person could check, tied to metrics and tests where possible (NO_GATE). They should be able to fail.
- Set `depends_on` to the unknowns, assumptions, data sources and tests it rests on. An open unknown raises PHASE_ON_OPEN_UNKNOWN, which is a correct warning: keep it visible and do not close the unknown to silence it. A refuted assumption raises PHASE_ON_REFUTED: redo the phase.
- Keep later ranges at least as wide as the first, in proportion (FALSE_PRECISION). Later work is less known. A phase resting on a failed test raises PHASE_ON_FAILED_TEST, and on blocked data, PHASE_ON_BLOCKED_DATA.

Done when the first phase tests the riskiest assumption, and every phase could end in something other than proceed.

### 5. State the basis

Set `estimate_basis` and `effort_unit` (person-weeks or calendar-weeks), and use `basis_note` to say who judged the ranges and which phases differ when the basis is mixed. `estimate_basis` holds one value for the whole file.

Done when a reader knows how each range was reached, and the note claims nothing you lack data for.

### 6. Running cost

Read [references/cost-overruns-and-forecasts.md](references/cost-overruns-and-forecasts.md). Look up prices on the vendor's page. If a page shows no figures to your tool, use the vendor's own price API where one exists, such as the Azure Retail Prices API, and say which you used. Set `run_cost.range`, `as_of` and `drivers`, with volumes taken from the file. If you cannot read the page, record `drivers` and `as_of` without a `range`, add an open unknown for the prices and say so.

Done when each price in the range was read today, or when no price appears and your reply says why.

### 7. Check and render

```bash
node "<plugin-root>/scripts/sa.mjs" check <file> --stage scope --only-stage
node "<plugin-root>/scripts/sa.mjs" render <file> --out <dir> --only estimate
```

Done when `check --stage scope --only-stage` has no errors and `estimate.md` exists in the output directory. If earlier stages are still blocked, the estimate carries a draft banner: keep it, and say so in your reply.

Read `estimate.md` before sharing it. Its total adds up every phase, including those beyond the first gate, so present the first phase as the commitment and the total as a hypothesis.

## At a gate, later

Record the result: update assumption statuses, unknowns and test results, add an entry to the phase's `gate_log` with the decision and any earlier range, change the ranges of the remaining phases from what was found, re-run step 7, and report the decision in plain words. Re-estimate from evidence, never by analogy to another project.

## References

- [references/estimating-through-gates.md](references/estimating-through-gates.md): read for step 4, and when asked how accurate an estimate is, why estimates overrun, or what a SOW should follow. The gates and decisions, the status of the method, and what no source supplies.
- [references/cost-overruns-and-forecasts.md](references/cost-overruns-and-forecasts.md): read for step 6, and whenever an analyst cost or cancellation figure comes up. Overrun failure classes, cost drivers, and forecasts labelled as forecasts.
