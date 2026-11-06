---
name: sa-frame
description: Decides whether an AI use case is worth doing and which approach fits it, and records metrics, a three-part value rating, kill criteria and the simpler options rejected in the engagement file.
when_to_use: Use when asked "is this worth doing", "should this be an agent", "do we need AI for this", "which use case first", to prioritise use cases, to build a business case, "what is the ROI", for kill criteria, "what do we tell the CFO", or when someone quotes "95% of AI pilots fail" or "80% of AI projects fail". Not for discovery questions or call notes (sa-discover), system design (sa-architect), or effort and running-cost estimates (sa-scope).
---

# sa-frame

Produces the `metrics`, `value` and `qualification` sections of the engagement file, and a verdict the sponsor can act on: proceed, test the weakest point first, or stop.

**Rate value if successful, likelihood of success and investment separately, on low, medium, high and very-high. Do not produce a single ROI figure.** Nobody can state a return before knowing whether the thing works, and nobody knows that without building some of it. Three ratings let people argue about each one. One number hides the argument, and on a slide it reads as a measurement.

`<plugin-root>` is the directory holding `scripts/`, two levels up from this skill's directory. Resolve it from the SKILL.md file you loaded, not the current directory.

## Hard rules

1. No ROI figure, payback period or savings number unless every input is measured and sourced. An unmeasured baseline stays unmeasured.
2. Likelihood is capped by the weakest of its four parts: product, technical, data and scientific certainty. One low makes the overall rating low.
3. A `high` likelihood rests on a pilot result, a comparable deployed system or concrete signals from the data. Say which in `why`. Optimism is not evidence.
4. A kill criterion names a metric or an observable event, a threshold and when it is read. "If it does not deliver value" stops nothing.
5. Every simpler approach gets a reason specific to this case. "Not flexible enough" is not a reason.
6. A failure statistic is quoted with its unit, sample and kind of claim, and is never used as this project's odds.

## Steps

### 1. Read the current state

```bash
node "<plugin-root>/scripts/sa.mjs" status <file>
node "<plugin-root>/scripts/sa.mjs" schema value
```

Run `schema metrics` and `schema qualification` as well. If there is no file, create one with `node "<plugin-root>/scripts/sa.mjs" init <file> --name "<engagement>" --customer "<customer>"`.

`check --stage frame` also runs the discover rules, so NO_PAIN, NO_SPONSOR and NO_DATA can block this stage. Those facts come from sa-discover or from asking the customer. Do not make them up to clear the check.

Done when you know which sections exist and which questions the file already answers.

### 2. Qualify the approach

Read [references/qualifying-the-approach.md](references/qualifying-the-approach.md) and work up from the simplest rung: rules or regular code, classical ML, a single model call, a fixed workflow, RAG, an agent. Stop at the first rung that can validate the business value.

Write `qualification` with `approach`, `why`, `build_or_buy` and `rejected`. List in `rejected` the rungs you passed over and the alternatives considered, each with its reason. This clears NO_QUALIFICATION and NO_SIMPLER_OPTION. If you chose `agent` or `multi-agent`, a rejected workflow, RAG, rules or single-call option must be on record, or AGENT_UNJUSTIFIED fires.

If the answer is `rules`, there is still something simpler to reject: doing nothing, or changing the process. If the answer is `no-ai`, finish this skill and stop there. Later stages do not apply.

Done when `approach` is set and each rejected entry would make sense only for this customer.

### 3. Define the metrics

Add at least one `business` metric, since technical quality alone will not justify the work (NO_METRICS, NO_BUSINESS_METRIC). Each metric has a `target`, a `floor` where one applies and a `how_measured` someone could actually carry out.

For the baseline there are two honest states:

- **Measured.** Set `baseline` and `baseline_source`. Without a source, BASELINE_UNSOURCED fires.
- **Not measured.** Leave `baseline` out. Add an open entry to `unknowns` with `about` naming the metric, for example `"question": "What share of claims is re-triaged today?", "about": ["M2"]`. NO_BASELINE then drops from error to warning, and the warning stays until someone measures it. That is correct.

"TBD" or "unknown" in `baseline` still counts as missing (NO_BASELINE, PLACEHOLDER_TEXT). Your own estimate would pass, and would make a guess read as a measurement, so do not write one.

Done when every metric is in one of those two states.

### 4. Rate the value

Read [references/applying-eroi.md](references/applying-eroi.md) before rating. Set `value_if_successful`, `likelihood` and `investment`, and write a `hypothesis` at the lowest level of success that would still be compelling, because a bolder claim lowers the likelihood.

Use `why` to give the sub-ratings that drove each rating: the best existing alternative for value, the weakest certainty for likelihood, the hidden cost lines for investment. Investment is the one rating where high is bad, so say so if a reader might miss it.

If likelihood is not high, name the smallest piece of work that would move the weakest certainty, and record it as an open unknown or an assumption.

With several candidates, give each its own engagement file and rate them all before comparing, then run `node "<plugin-root>/scripts/sa.mjs" compare <file> <file>` for the table. Keep the conflicts visible rather than averaging them. Recommend a mix, not only the top row.

Done when a reader can see from `why` what would have to change for each rating to move.

### 5. Write the kill criteria

Add them to `value.kill_criteria`, tied to metric floors where possible (NO_KILL_CRITERIA). The sponsor should agree to them now, while nobody has spent anything. Include at least one that a pilot could trip early.

Done when each criterion could be read off a report by someone who was not in the room.

### 6. Check

```bash
node "<plugin-root>/scripts/sa.mjs" check <file> --stage frame
```

Done when there are no errors, and each remaining warning is either fixed or named in your reply with the reason it stands. Then state the verdict in plain words. A CFO-facing page comes from `render` through sa-deliver, not from a document you write here.

## When someone quotes a failure statistic

Read [references/failure-statistics.md](references/failure-statistics.md) and answer from it: who produced the figure, what it counted, and whether anyone has read the original. It opens with an answer to the 95% claim. Then return to this project's own ratings. Those are the odds that matter, and no source supplies a base rate.

## References

- [references/qualifying-the-approach.md](references/qualifying-the-approach.md): read for step 2, and for any "should this be an agent" question. Vendor criteria, where vendors disagree, measured agent results and what no source can tell you.
- [references/applying-eroi.md](references/applying-eroi.md): read for step 4 and for prioritising. The method with its authors' caveats, rating anchors, and the cost lines successful deployments reported.
- [references/failure-statistics.md](references/failure-statistics.md): read whenever a rate of AI failure or value comes up, or before putting one in a deliverable.
