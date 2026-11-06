---
name: sa-discover
description: Prepares a customer discovery call and captures what it finds as a validated engagement file with a generated list of open questions.
when_to_use: Use when preparing for a customer or discovery call, when a prospect describes a pain point or use case, when asked "what should I ask", when capturing call notes, or when a customer says they want "AI agents". Not for choosing the approach (sa-frame), system design (sa-architect) or estimates (sa-scope).
---

# sa-discover

Produces the engagement file at the discover stage, plus a generated `questions.md`.

**Create the file first with `init`, and record every fact, unknown and assumption in it, not in prose files.** Call notes, meeting summaries and question lists written as separate documents force every later change to be copied by hand. The file is the record; `render` writes the documents.

`<plugin-root>` is the directory holding `scripts/`, two levels up from this skill's directory. Resolve it from the SKILL.md file you loaded, not the current directory.

## Hard rules

1. No separate notes files. If it was learned on a call, it goes in the engagement file. A short run-of-show for the call is fine if it restates no facts.
2. A claim the customer made and nobody has checked is an assumption with `source: customer-stated` and an `if_wrong`, not a fact.
3. No bracket placeholders and no invented facts. A missing fact is a record in `unknowns`. A design threshold you propose is not a fact: say "proposed" and let the customer change it.
4. A number enters the file only with where it came from: a `baseline_source`, or the source named in the sentence that holds it.
5. Write every record as if the customer will read it. Pain points, risks, assumptions and open questions all reach the decks. The one exception is a risk marked `internal: true`, which stays out of decks.

## Steps

### 1. Create the file

```bash
node "<plugin-root>/scripts/sa.mjs" init <name>.engagement.json --name "<engagement>" --customer "<customer>"
```

`init` refuses to overwrite, so an existing file is the one to update. Replace the placeholder in `need.statement` as soon as you have the customer's words (PLACEHOLDER_NEED). Run `node "<plugin-root>/scripts/sa.mjs" schema unknowns` (or any section name) for a section's exact fields, and `node "<plugin-root>/scripts/sa.mjs" example` for a complete file.

Done when the file exists and `need.statement` holds no placeholder text.

### 2. Before a call: prepare a short list

Choose at most about ten questions. Keep a question only if its answer changes the design or the decision; if you cannot say what you would do differently for each likely answer, drop it.

Record each as an `unknowns` entry with `status: open`, a `why` that states what the answer changes, and an `owner`. An owner is a stakeholder id, so add the stakeholder first, by role if you have no name.

```bash
node "<plugin-root>/scripts/sa.mjs" render <name>.engagement.json --out deliverables --only questions
```

Use `questions.md`, which groups the questions by owner and adds the data to obtain and the baselines to measure.

Done when `questions.md` has about ten questions or fewer and no "No owner yet" heading.

### 3. Ask for real samples of the data

Ask before the call for real samples of each data source: a few documents, an export, a redacted record. Descriptions such as "mostly PDFs" are not evidence, which is why `DATA_NOT_SAMPLED` exists. Set `sampled: true` only after someone has looked, and put what they found in `notes`, with the count.

If samples are refused or delayed, add an open unknown with `about` naming the data source, such as `"about": ["D1"]`. That also clears `ACCESS_UNTRACKED` for a source whose access is not approved. Keep ids out of the text, because that text reaches the decks.

Done when each data source is sampled with a finding in `notes`, or an open unknown names it.

### 4. After a call: update the file and run status

Put the notes where they belong:

| What you heard | Where it goes |
|---|---|
| Stated pain | `need.pain_points`, in the customer's words |
| How the work runs today | `need.workflow`, with minutes where someone measured them |
| Systems and files named | `data_sources` |
| Candidate success measure | `metrics` if a target and a method exist, otherwise an open unknown |
| Blockers to access | `data_sources[].access` and an open unknown |
| Answers to your questions | Same unknown: `status: answered` and `answer`. Do not delete it. |
| Who owns what | `stakeholders`, with `authority` |

Set `engagement.updated` to today, then run:

```bash
node "<plugin-root>/scripts/sa.mjs" status <name>.engagement.json
```

Done when everything from the call is in the file and `status` has run.

### 5. Run a pre-mortem once the team is known

Run it after the first call has identified the people, before anyone commits to an approach or a scope. It is a meeting with the customer's team. A list you write alone is a risk table, so do not record it as a pre-mortem. The script and how its output maps to `risks` and `unknowns` are in the reference.

Done when the meeting has happened and its threats are in the file, or you have told the user it has not happened and why.

### 6. Check the stage

```bash
node "<plugin-root>/scripts/sa.mjs" check <name>.engagement.json --stage discover
```

Done when this reports 0 errors. Clear `NO_PAIN`, `NO_SPONSOR` and `NO_DATA` with real answers, never filler. Report any warnings that remain (`NO_RISK_OWNER`, `DATA_NOT_SAMPLED`, `ACCESS_UNTRACKED`, `PERMISSIONS_UNKNOWN`) and the number of open questions to the user.

## Reference

Read [references/discovery-method.md](references/discovery-method.md) when planning or running a session, when running a pre-mortem, or when someone demands a fixed success criterion before anyone has seen outputs. It holds the session structure, exit checklist, named failure patterns, the pre-mortem script, the conflict between sources on success criteria, and how far this evidence can be trusted.
