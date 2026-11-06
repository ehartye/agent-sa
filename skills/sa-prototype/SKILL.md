---
name: sa-prototype
description: Plans and builds a demo or proof of concept whose tests and demo beats are validated in the engagement file, with results recorded and every beat marked live, recorded, mock or synthetic data.
when_to_use: Use when planning or building a demo or proof of concept, writing a demo script, asked "what should we build first", or told "the sponsor wants to see something in two weeks". Not for generating the deck or other deliverable files (sa-deliver), designing the full system (sa-architect) or estimates (sa-scope).
---

# sa-prototype

Produces the `tests` and `demo` sections of the engagement file, then a real prototype, with results recorded back into the file.

**Write the tests first. Each names the risk, assumption or unknown it answers, with pass and fail conditions. Then let each demo beat cite a test.** A beat with nothing behind it is a claim you cannot defend, so cut it. Build only what the tests and beats need.

`<plugin-root>` is the directory holding `scripts/`, two levels up from this skill's directory. Resolve it from the SKILL.md file you loaded, not the current directory.

If there is no engagement file yet, start with sa-discover. Run `node "<plugin-root>/scripts/sa.mjs" schema tests` and `schema demo` for the exact fields.

## Hard rules

1. A failed test stays in the file. Change the beat, not the record.
2. A claim says no more than the test measured, and carries its denominator.
3. A number in a claim comes from a test `result`. Vendor or benchmark figures cannot back a beat.
4. Set `pass_if` before running. If the criterion has to change, record why in `result` and add a new test.
5. Never mark a beat `live` if any model output in it is hard-coded.

No credible source on honest demo craft was found, so the demo rules here are this plugin's own position, not a sourced standard.

## Steps

### 1. List what must be answered

```bash
node "<plugin-root>/scripts/sa.mjs" check <name>.engagement.json --stage prototype
```

From the file, list open high-likelihood, high-impact risks, untested assumptions, and open unknowns the decision rests on. Done when you have the list, in order of what would stop the work.

### 2. Write the tests, before any code

For each item, add a `tests` entry: `question`, `de_risks` (the ids it answers), `method`, `pass_if` (specific enough that someone else could judge it), `on_fail` (the decision a failure forces), `timebox_days`, `status: planned`.

Compare the sum of `timebox_days` for the tests you will run before the demo with the time you have. `prototype.md` prints the total still to run, which includes later tests. If it does not fit, cut from the bottom of the list. Do not drop a top risk: leave it `planned` and say so in the demo.

If the system reads permissioned data, include the two-account test from the reference, with the data source id in `method`.

Done when `check` reports no `TOP_RISK_UNTESTED` or `TEST_WITHOUT_PURPOSE`.

### 3. Write the demo plan

Set `demo.audience` to a stakeholder id and `demo.goal` to the decision you want. For each beat, set `shows`, `claim`, `mode`, `backed_by`, `disclosure` and `fallback`.

| Mode | Use it when |
|---|---|
| `live` | Real model calls happen during the demo, on the real pipeline |
| `recorded` | A real run was captured earlier and is being replayed |
| `mock` | Any part is stubbed or simulated |
| `synthetic-data` | The calls are real, but the data is generated, replayed or de-identified |

If a beat mixes modes, use the weakest and disclose it. Write `disclosure` as the words you will say aloud when the beat appears.

Read each beat beside the test it cites. The engine checks that the test exists and passed, not that it measures the claim. A load test does not back a claim about human review. Done when each claim is something its test actually measured.

### 4. Build the thinnest real slice

Use real model calls, on real samples where access allows, for only the path the tests and beats need. Start with the test most likely to stop the work. Anything you stub makes that beat `mock`, so keep a list of stubs and match it against the modes. Put a beat's link in `url`.

If the plan assumed access you do not have, such as a model key, a cloud account or a system of record, build everything else for real behind a clear seam, stand in for the missing part, and rewrite each affected beat: mode `mock`, a disclosure naming the stand-in, and a claim narrowed to what the stand-in can show. Tests that need the missing part stay `planned`. Never write provider code you cannot run.

Done when each test's `method` can be run and every stub is reflected in a beat's mode.

### 5. Run the tests and record results

Set `status` to `passed` or `failed`, and write `result` with the measurement, the denominator, the model and version, and the date. Then update what the test answered: assumption to `confirmed` or `refuted`, unknown to `answered`, risk to `mitigated` if the evidence supports it. Set `engagement.updated`.

If a test fails, follow its `on_fail`, then change or remove any beat that rests on it. If the failure came from the test harness and not the system, keep the failed test, say so in its `result`, fix the harness and add a new test with `supersedes` naming the old one. The old result stays in the spec and drops off the slides.

Done when no test is `running` and `check` reports no `RESULT_MISSING`.

### 6. Check the stage

```bash
node "<plugin-root>/scripts/sa.mjs" check <name>.engagement.json --stage prototype
```

| Code | What it means | Fix |
|---|---|---|
| `UNBACKED_CLAIM` | A beat names no test | Write and run the test, or cut the beat |
| `UNDISCLOSED_DEMO` | A non-live beat has no disclosure | Write what the audience will be told |
| `CLAIM_CONTRADICTED` | The cited test failed | Change or remove the beat |
| `TOP_RISK_UNTESTED` | A high-high open risk has no test | Add a test that names it |
| `CLAIM_UNPROVEN` (warning) | The cited test has not passed yet | Run it, or do not state the claim as fact |
| `NO_FALLBACK` (warning) | A live beat has no fallback | Name what you will show if it breaks |

Done when `check` reports 0 errors and results are recorded. Report to the user: tests by status, which beats are not live, and any claim still unproven. Generate the runbook and decks with sa-deliver.

## Reference

Read [references/prototype-evidence.md](references/prototype-evidence.md) when designing tests. It covers building an evaluation with no user data, error analysis, judge validation, how to read a two-week request, RAG failure points as test ideas, the two-account permission test, and what demos and benchmarks cannot show.
