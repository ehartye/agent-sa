---
as_of: 2026-11-06
---

# Discovery method

## How far to trust this

No peer-reviewed method for eliciting LLM-system requirements from enterprise stakeholders was found in the evidence behind this reference, up to the date above. That describes what was found, not proof that none exists. The nearest academic work is a 2022 workshop paper proposing 45 concerns for specifying machine-learning-enabled systems, across objectives, user experience, infrastructure, model and data. Its authors validated it in one focus group of eight professionals. It is a catalogue of concerns, not an elicitation method, and its abstract, the only part relied on here, does not mention LLM systems.

Everything below is practitioner or institutional guidance: a commercial course lesson (Educative), a state government playbook (California Office of Data and Innovation), and one consultant's notes (Husain). None presents outcome data showing that its steps improve project results. The Educative lesson says many enterprise AI projects start to fail during problem definition, and gives no figures. Treat these as inherited practice.

## Session structure (Educative)

The lesson treats discovery as a technical investigation carried out as a conversation, and sets the output as a clear enough picture of problem, data, stakeholders and constraints to write a scope document.

- **Who attends.** Three perspectives: the executive sponsor (owns the problem and the budget), an operations person or domain expert (does the work today), and a technical contact (systems, data, real access). If one is missing, note which and plan a follow-up before finalizing scope.
- **Opening.** Ask for a full account of how the workflow breaks down: the trigger, who gets involved, what gets stuck, how the team recovers. Then ask what people actually do when the official process fails. The lesson calls the workaround often the clearest signal of real pain.
- **Listen for.** Data signals (every system, file type and source named), volume and frequency (how often, how long a run takes), and ownership gaps (a step nobody owns, which the lesson expects to resurface during the build).
- **Closing.** Say back the core problem, the data involved and what success would look like. Close with that summary, not an open invitation to add requirements.

### The five-column notes

The lesson's columns are stated pain, current workflow steps, data available, candidate success metric, and blockers to access. Use them as prompts while listening. The columns map to fields in the engagement file, so they do not need a document of their own: see the table in step 4 of the skill.

### Exit checklist

The lesson asks for answers to four questions before leaving the session:

1. Does the required data exist, and can it be accessed within the project timeline?
2. Is there a specific, measurable success criterion that can be verified before the project ends? (See the conflict below.)
3. Is the customer's timeline realistic for what has to be built?
4. Is there one person who owns the problem, has authority to clear blockers, and will be the main contact?

### Named failure patterns

- **Solutioning too early.** Once architecture is proposed, the customer stops describing the problem and starts reacting to the proposal.
- **The HiPPO problem.** The highest-paid person's opinion dominates, describing a vision rather than the operational pain. Redirect to the people who do the work without alienating the executive.
- **Scope creep in discovery.** Requirements get added in real time. New ones belong in a separate conversation after the scope document is drafted.
- **Discovery theater.** Surface questions, vague answers accepted, and a scope document built on assumptions.
- **Skipping the baseline.** No current cost in time and error rate, and no projected token cost at expected volume, so no credible business case. If the customer cannot state the baseline, measuring it is the first step.

## What to look for in data samples (California)

The playbook's data readiness sheet asks three quality questions that a description will not answer: is the data sparse, was it collected consistently over time (did a technology change alter it), and does it come from reliable sources. Record the findings in `notes` on the data source.

## Questions the sources omit

None of these sources lists as discovery questions what a wrong answer costs, who judges quality today and how, or who will review sample outputs. The ideas appear elsewhere: Provost and Ipeirotis ask "Will the cost of the errors render the product useless?", and Husain builds judgment around a domain expert. This plugin adds them as session questions because they follow from the criteria problem below. They are untested.

## The pre-mortem

**When.** The playbook says to run it at the start of any important or complex project. This plugin's position: after the first call has identified the people, before an approach or scope is committed.

**Evidence.** The playbook asserts that a pre-mortem increases the chance of success and gives no data. It was written for California state departments buying generative AI proofs of concept, and its cover letter says the practices apply to other projects too. Adapt the participant list to the customer's organization.

**Who.** The whole project team, plus leadership. At minimum: program staff (including people who know the data), IT, security, legal, communications or external affairs, procurement, project management and HR.

**Kit.** At least 30 minutes; 60 for large groups or complex projects. One moderator and one note taker. In person, sticky notes, enough for 5 to 10 per person. Remotely, a shared whiteboard, with anonymous notes if the tool allows. Draw a "T" for each of the three categories, with People and Technical columns.

### Terms

- **Tiger:** a threat you are afraid of.
- **Paper tiger:** a threat others might worry about but you are not afraid of, because of scope or because it is yours to mitigate.
- **Elephant:** a failure nobody wants to say aloud, but people need to know about.

### Script (30 minutes)

1. **Assign** the moderator and note taker.
2. **Welcome.** Everyone gives name, title and role. Name the business areas in the room.
3. **Set the stage.** Thinking through failure now is planning for success.
4. **Explain** the three terms, and that notes get sorted into People failures and Technical failures.
5. **Logistics.** Hand out notes, or explain the whiteboard.
6. **Ground rules.** Be honest, because the team cannot mitigate what is not shared. You need not be an expert, and gut feelings count. Be generous: naming a risk does not blame the team that owns it.
7. **Brainstorm, on a timer, 7 to 10 minutes.** Put this prompt on the screen: imagine the project has failed, on the technical side or the people side. Why? What happened, or did not happen, to cause it? Each person writes at least 2 Tigers, 2 Paper Tigers and 1 Elephant.
8. **Sort.** Each person places their notes under the category, in the People or Technical column.
9. **Read.** A few minutes for everyone to read all the notes.
10. **Re-sort.** Someone may move a Tiger or Elephant to Paper Tiger only if it can be fully avoided or mitigated and it is within their own responsibility.
11. **Discuss for the remaining time** (the playbook allots 20 minutes). What stood out? Any surprises? What themes? Which matter most? Why now? How might we address them? Did anyone move a note, and why? Did one issue appear as both Tiger and Paper Tiger, and are mitigations already in place? Then pick one Elephant, perhaps the most important or volatile, and talk about it.
12. **Take notes** throughout. The playbook uses them as a foundation for the problem statement.
13. **Wrap up.** Say the results will be typed up and shared.

Afterwards the note taker records every note and where it ended up, in a table of category by People and Technical, marks it "Draft-deliberative" or similar, and shares it with attendees.

**Limits of the playbook.** Its sorting step (8) breaks off at "Participants will put", so the wording above comes from its suggested slide. The playbook is inconsistent on Elephants: at least 2 in the run of show, at least 1 on the slide. This script uses 1.

### Where the output goes

| Note | Record in the file |
|---|---|
| Tiger | `risks`, `status: open`, with likelihood, impact, mitigation and owner |
| Elephant | `risks` in neutral wording, or an open unknown for the sponsor |
| Paper Tiger with a named mitigation and owner | `risks`, `status: mitigated` |
| Anything people could not answer | `unknowns` with an owner |

The riskiest entries reach the decks: the "What could go wrong" slide shows the top 5 for an executive audience and 8 for a technical one. Reword an Elephant before recording it, or set `internal: true` on a risk that must stay out of decks. It still appears in the spec and the handoff, so keep the verbatim note with the attendees.

## Conflict: fix the success criterion now, or later?

The Educative checklist requires a specific, measurable success criterion before the session closes. Husain argues that criteria cannot be fully set in advance: "it is impossible to completely determine evaluation criteria prior to human judging of LLM outputs", building on Shankar et al. Neither source addresses the other, and neither tested its view.

This plugin's position, also untested: split by kind of metric.

- **Business, cost and safety metrics** can be fixed in discovery. They measure the process (minutes per case, error rate, cost per item), and the baseline exists or can be measured.
- **Quality metrics on model output** get a method now and a provisional target. Name who judges and how, say "provisional" in `target`, and revise it once people have judged real outputs in the prototype stage.

So the second checklist question has an answer without pretending the quality bar is settled.

## Sources

- https://www.educative.io/courses/forward-deployed-engineer/running-customer-discovery
- https://www.genai.ca.gov/wp-content/uploads/sites/360/2025/02/odi-innovation-playbook.pdf
- https://hamel.dev/blog/posts/field-guide/
- https://arxiv.org/pdf/2607.23733
- https://arxiv.org/abs/2404.12272 (cited through Husain)
- https://werpapers.dimap.ufrn.br/proceedings/WER2022/wer202201.html
