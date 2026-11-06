---
as_of: 2026-11-06
---

# Prototype evidence

## The demo rules are this plugin's position

No credible source on honest demo craft was found in the evidence behind this reference, up to the date above. The rules on disclosure, modes and claims backed by tests are this plugin's own position. They come from reasoning about what a demo can mislead people into believing, not from a study.

## How far to trust the evaluation advice

The sections on synthetic data, error analysis and judges come from one post by consultant Hamel Husain, drawn from his work with what he describes as more than 30 companies. It is self-reported and he also sells a course on the topic.

## Bootstrapping an evaluation with no user data

Husain's method:

- **Dimensions.** Choose features, scenarios and user personas. Add others if they matter, such as tone or locale. His real-estate example crosses search, analysis, scheduling and follow-up with exact match, multiple matches, no matches and invalid criteria.
- **Generate inputs, not outputs.** Have a model write user queries, not expected answers, so the set does not inherit the generating model's biases.
- **Ground it.** Use real IDs, real availability and real business rules. With no production data, generate the underlying records too, within realistic constraints.
- **Verify coverage.** Check that each case triggers its scenario. A "no matches" query should return zero results.
- **Start simple,** then add complexity.

He says this is proven across dozens of companies, and shows no data. He also says what begins as a stopgap often becomes permanent. A beat built on this data is `synthetic-data`, and a passing test on it says nothing yet about the customer's real inputs, so say which data a result used.

## Error analysis

Husain calls error analysis "the single most valuable activity in AI development" and shows one client's method, from Nurture Boss's apartment-industry assistant:

1. Start with a spreadsheet or simple viewer, one row per conversation.
2. Write open-ended notes on any undesired behaviour.
3. Use an LLM to build a taxonomy of failure modes from those notes.
4. Map each row to failure-mode labels and count them, for example in a pivot table.

He prefers this bottom-up route to starting from generic metrics such as "hallucination" or "toxicity", which he says misses domain-specific issues. He reports that after "dozens of conversations" date handling was failing 66 percent of the time, that it improved "from 33% to 95%" once the team had built specific tests, and that "just three issues accounted for over 60% of all problems". These are one client's self-reported numbers with no denominator. "Dozens" is the only sample size he gives, and he offers no stopping rule.

For the tool, he recommends a custom viewer that puts all context in one place, takes one-click pass or fail, takes open-ended notes, filters and sorts quickly, and has hotkeys. His example viewer filters sessions, annotates them, then aggregates and counts errors. He says a spreadsheet is better than nothing to start.

His claim that teams with such viewers iterate 10x faster has no measurement behind it. Do not repeat it as a finding.

Use it like this: read real outputs, write a note on each failure, label and count the error types, and let the counts choose the next test.

## Judge validation

- **Prefer binary judgments** to 1-to-5 scales, and put the nuance in a written critique.
- **Use the critiques as few-shot examples** in the judge prompt. Husain reports this "often yields 15-20% higher agreement rates" between human and LLM evaluations. That is his own observation, with no denominator.
- **Measure agreement against a person.** With Honeycomb it took three iterations to pass 90 percent agreement between the LLM judge and one domain expert. That is one case and one rater.
- **Keep calibrating.** He warns that automated evaluations drift from human expectations as inputs change. His sequence: high human involvement early, study where judge and human diverge, sample where agreement is weakest, recalibrate regularly.

**Criteria drift.** Husain, citing Shankar et al., says people define their criteria partly by grading outputs, so criteria are living documents. This does not license moving a `pass_if` after a result. Record the original result, say why the criterion changed, and add a new test for the new one.

## Reading a two-week request

Eugene Yan, quoted by Husain, describes a common timeline: two weeks for data feasibility ("do I have the right data?"), an additional month for technical feasibility ("can AI solve this?"), then six weeks for a prototype that can be A/B tested. He reassures leadership with timeboxes and a three-month decision. This is one practitioner's self-report. It was developed for traditional machine learning, and Husain's statement that it applies to LLM work comes with no evidence. Treat the durations as a starting point.

Read against it, two weeks buys the data question, plus whatever narrow technical test fits. So state what the slice will not answer, and leave those tests `planned`. A failed fortnight does not show infeasibility either: Yan's own anecdote reports two to three months where nothing worked, then a solution within a month after new technology appeared. That is one anecdote.

## RAG failure points as test ideas

Barnett et al. name seven failure points from three case studies in research, education and biomedicine. It is an experience report, two of the three cases cannot be checked because of confidentiality, and the models are from the GPT-4 era. Use it as a checklist, not for its numbers. The test ideas below are this plugin's reading.

| Failure point | Test idea |
|---|---|
| Missing content | Ask related questions the documents cannot answer. Pass if it declines. |
| Missed the top-ranked documents | For known answers, check the source document ranks inside the top K you use. |
| Not in context | Check the answer-bearing document survives consolidation into the prompt. |
| Not extracted | Put the answer in a noisy or contradictory context. Check it is still found. |
| Wrong format | Ask for a table or list. Check the format comes back. |
| Incorrect specificity | Have domain experts judge whether answers fit the need, including vague questions. |
| Incomplete | Ask about several documents at once. Check nothing available was missed. |

The authors conclude that validating a RAG system "is only feasible during operation", and that offline evaluation depends on labelled question and answer pairs. So a passing prototype test supports a claim about that test set, not about production.

## The two-account permission test

VentureBeat reports a single case. An enterprise architect's email assistant on a custom Azure OpenAI pipeline passed every evaluation his team ran. A low-privilege account then received SharePoint content it could not have opened directly. The evaluations checked factual accuracy, relevance and task completion, and none asked whose permissions the retrieval used.

**Method, from the article:**

1. Take two identities with different entitlements in the source system.
2. Ask a question the high-privilege account has already asked.
3. Ask the same question as the low-privilege account.
4. Compare the output with what that account can open directly. If it returns more, the boundary is not enforced at query time.

The article's "two accounts and thirty minutes" is the author's estimate.

**This plugin's additions, untested:** revoke a permission in the source, then repeat after one sync interval to measure staleness. Send a request with no user token. On a chunked index, check that access fields reached the chunks.

**Limits.** The test covers only the identities and questions chosen. It can find a leak but cannot prove there is none. Word the claim to match: "no leak in these N questions across these two identities", not "permissions are enforced".

**In the file.** Add a risk, then a test with that risk in `de_risks` and the data source id in `method`. A source with `permissions: unknown` and sensitive data raises `PERMISSIONS_UNKNOWN`.

## What demos and benchmarks cannot show

Narayanan and Kapoor argue that benchmarks measure progress in methods and are often misread as measuring usefulness in applications. They call this a construct validity problem: the test does not measure what it is taken to measure. Their pattern: the easier a task is to measure, the less likely it represents complex, contextual professional work. Sorting legal requests has clear answers, while preparing a filing does not. In their view the only sure way to measure usefulness is to build the application and test it with professionals in realistic scenarios. They say such studies generally show a benefit that is modest and closer to augmentation than substitution. This is an argued essay, not an empirical study.

What follows, as this plugin's reading:

- A model's benchmark score cannot back a beat. Record it as an assumption with `source: benchmark` until your own test replaces it.
- A demo is one scripted path. It can show that a path works, not how often it works or whether anyone's work improves. Those need a test with a denominator and with the people who do the work.
- A pass on an easily measured class of task does not extend to the harder classes. Stratify the test, and report each class separately.

## Sources

- https://hamel.dev/blog/posts/field-guide/
- https://arxiv.org/abs/2404.12272 (cited through Husain)
- https://arxiv.org/html/2401.05856v1
- https://venturebeat.com/security/azure-openai-agent-passed-every-evaluation-served-files-user-couldnt-open
- https://www.normaltech.ai/p/ai-as-normal-technology
