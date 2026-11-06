---
as_of: 2026-11-06
---

# What the failure statistics actually measured

The "95%" comes from MIT NANDA's "The GenAI Divide: State of AI in Business 2025" (Challapally, Pease, Raskar and Chari, July 2025; pages refer to the copy at mlq.ai, marked "Preliminary Findings"). It says "95% of organizations are getting zero return" (p3) and "The 95% failure rate for enterprise AI solutions" (p7). No sentence in it says 95% of pilots fail. It rests on interviews with representatives from 52 organizations, a review of over 300 public initiatives and 153 survey responses from senior leaders at industry conferences (p2). It defines success as "deployment beyond pilot phase with measurable KPIs" (p24), does not state the base of the 95%, and calls its pilot-to-production figures "directionally accurate based on individual interviews rather than official company reporting" (p6). Treat it as a preliminary claim about organizations, drawn from interviews, a survey and a desk review, not a measured failure rate for projects.

None of the sources below measures a failure rate for enterprise projects built on current LLMs, with a stated definition and a representative sample. No base rate exists in this evidence. Say so, then return to the project's own ratings.

## The 95% figure: the report and its retellings

The report's unit changes within a few pages:

| Page | Wording | Unit |
|---|---|---|
| p3 | "95% of organizations are getting zero return" | organizations, across "enterprises, mid-market, SMBs" |
| p3 | "Just 5% of integrated AI pilots are extracting millions in value, while the vast majority remain stuck with no measurable P&L impact" | integrated pilots |
| p3 | Of enterprise-grade tools, "Sixty percent of organizations evaluated such tools, but only 20 percent reached pilot stage and just 5 percent reached production" | organizations |
| p6 | "only 5% of custom enterprise AI tools reach production" | custom tools |
| p7 | "The 95% failure rate for enterprise AI solutions" | solutions |

Later accounts each pick one:

| Where | Wording | Unit |
|---|---|---|
| The Register, Aug 2025 | 95 percent of enterprise organizations got zero return | organizations, narrowed to "enterprise" |
| Menlo Ventures, Dec 2025 | claims 95% of generative AI initiatives fail | initiatives |
| Stanford, Apr 2026 | 95% of generative AI pilot programs fail to produce measurable financial impact | pilot programs |
| Provost and Ipeirotis, 2026 | roughly 95% of enterprise GenAI pilots deliver no measurable business impact | pilots |

So "95% of pilots fail" is a compression. p3 says 5% of integrated pilots extract "millions in value" and p7 says "failure rate", but no page equates the two, and not extracting millions is not the same as failing. The other things worth knowing:

- **Sample.** p2 and p24 list all three parts: interviews, 300+ public initiatives and 153 survey responses. The Register's account matches, except that it says "business professionals" where the report says "senior leaders". A critic, Shimoni, says 52 organisations were the entire sample, which the report contradicts.
- **Definition.** p24: "Success defined as deployment beyond pilot phase with measurable KPIs. ROI impact measured 6 months post-pilot, adjusted for department size." p7 gives a softer test for task-specific tools: "ones users or executives have remarked as causing a marked and sustained productivity and/or P&L impact". Shimoni reads the report as counting any pilot that does not reach "full production deployment" as a failure, so a planned spike or vendor evaluation counts too. That phrase is not the report's, and his reading leaves out "measurable KPIs", though a planned stop would indeed fall short of p24's test.
- **The report's own limits.** "Sample sizes vary by category, and success definitions may differ across organizations" (p6). "Selection bias possible in organizations willing to participate in AI research", and a "Six-month observation period may be insufficient" for complex systems, "potentially understating success rates" (p24).
- **Cause.** p3 says the divide "does not seem to be driven by model quality or regulation", that "The core barrier to scaling is not infrastructure, regulation, or talent. It is learning", and that most tools "fail due to brittle workflows, lack of contextual learning, and misalignment with day-to-day operations". The Register (systems that cannot retain, adapt and learn) and Stanford (workflow integration rather than model quality) each carry part of that passage.
- **Build or buy.** p19: "external partnerships with learning-capable, customized tools reached deployment ~67% of the time, compared to ~33% for internally built tools." That is reaching deployment, for a subset of tools. Shimoni, citing the same page, calls it success. The report says these are "self-reported outcomes", that the correlation "does not necessarily prove causation" (p19), and that build and buy percentages rest on "interview responses" (p24).
- **Shimoni's own figure** of 25-30% real failures comes from "250+ companies" at his employer, with no stated period or method and an undefined denominator. It does not replace the 95%.
- **Stake.** Project NANDA works "to create infrastructure for distributed agent intelligence" (p23), and the report says frameworks "like NANDA and MCP" will "define which vendors help organizations cross the divide" (p18). Its advice leans toward that kind of system. No funding is stated.
- **The copy.** The file at mlq.ai is hosted outside MIT and named v0.1. A paper's reference list gives another address, nanda.media.mit.edu/ai_report_2025.pdf. Nothing here establishes that the two are identical.

Honest wording: "MIT NANDA's July 2025 report, marked preliminary findings, says 95% of organizations are getting zero return from generative AI. It rests on interviews with representatives of 52 organizations, a review of 300+ public initiatives and 153 survey responses from senior leaders. It defines success as deployment beyond the pilot phase with measurable KPIs and calls its pilot-to-production figures directionally accurate, based on interviews rather than company reporting. It does not state the base of the 95%. One critic says the definition counts planned pilots as failures."

## The others

### RAND: "more than 80 percent of AI projects fail"

- **What it is.** A cited outside estimate, not a RAND finding. The report (August 2024) opens "By some estimates", footnoted to a 2022 Fortune article. The "twice the rate of non-AI IT" part is footnoted to a 2023 HBR article.
- **What RAND did.** 65 semi-structured interviews: 50 industry and 15 academic. Of 379 industry candidates contacted, 50 took part (13.2%). The academics were convenience samples.
- **Definition.** A project "perceived to be a failure by the organization", technical or business.
- **Scope trap.** Projects that simply used pretrained LLMs, which RAND calls prompt engineering, and "did not attempt to train or customize their own" were excluded. Inference: much of today's LLM application work falls outside this report.
- **Bias.** Most interviewees were non-managerial engineers, and the authors warn the results may be skewed toward identifying leadership failures. So treat "84% of interviewees cited a leadership cause" with that warning attached. The sentence sits in the findings from industry interviews and gives no count, so the base is presumably the 50 industry interviewees.
- **Drift.** Provost and Ipeirotis write "A RAND study found", which credits RAND with a measurement it does not claim. Even careful papers repeat this, so correct it when you see it.
- **Cite as:** "A 2024 RAND interview study of 65 practitioners identified five root causes. It repeats an outside estimate that more than 80% of AI projects fail and did not measure that rate."

### S&P Global Market Intelligence: 42% and 46%

- **What it is.** A survey of more than 1,000 respondents in North America and Europe, as reported by CIO Dive (March 2025). The article does not give roles, dates or question wording.
- **Two different numbers.** 42% is the share of companies abandoning most of their AI initiatives, up from 17% the year before. 46% is the average organisation's share of proofs of concept scrapped before production. Neither is "42% of projects".
- **Cite as:** "In an S&P Global Market Intelligence survey of 1,000+ respondents (reported by CIO Dive, March 2025), 42% of companies were abandoning most of their AI initiatives, up from 17%, and the average organisation had scrapped 46% of proofs of concept."

### Gartner: "over 40% of agentic AI projects will be canceled by end of 2027"

- **What it is.** A forecast in a press release dated June 2025. It cannot be checked yet. A forecast is never "found".
- **Basis.** It gives reasons (escalating costs, unclear business value, inadequate risk controls) but no method or population. The report behind it is for Gartner clients.
- **The one measured datum** is a January 2025 poll of 3,412 webinar attendees: 19% significant investment, 42% conservative, 8% none, 31% wait-and-see or unsure. That is investment posture, not outcomes.
- **Stake.** Gartner sells research to technology buyers. The release links a client report and a marketing eBook.
- **Cite as:** "Gartner forecast in June 2025 that over 40% of agentic AI projects will be canceled by the end of 2027. The release does not state how it reached that figure."

### Stanford Digital Economy Lab: 51 successful deployments

- **What it is.** An interview study of successes (April 2026): 51 cases in 41 organisations, chosen because they were live, adopted, quantified and scalable. The authors disclaim representative data and flag selection bias.
- **It cannot give a failure rate by design.** 61% of implementations had an earlier failure. The methodology text says "Two thirds of the companies", a different unit: 41 organisations against 51 cases. The six root causes, led by organisation not ready to adopt at 35%, sit under a "% Cases" heading in cases that went on to succeed. The report does not give the base, and they sum to 122, so causes overlap.
- **Anecdote, not data.** One executive says "Probably 90% of the pilots and tests fail", and they iterate on those.
- **Stake.** Self-reported data. The lab's director co-founded Workhelix, a company that measures the benefits of AI.
- **Cite as:** "In a Stanford study of 51 deployments already in production, 61% had an earlier failed attempt. The study was not designed to estimate how common success is."

### NBER working paper 34836

- **What it is.** A survey of nearly 9,000 CFOs, CEOs and senior executives in seven countries. These figures come from the abstract.
- **Findings.** 78% of firms use AI. Executives report essentially no net employment effect over 3 years, a 0.2% rise in annual labor productivity growth over 3 years, and expect 0.6% a year over the next 3.
- **What it is not.** It concerns adoption and perceived productivity at firms, not whether projects succeed.
- **Date oddity.** The page is dated February 2026 and the abstract says the survey ran in "Summer 2026". Check before quoting a survey date.
- **Cite as:** "Executives in a survey of nearly 9,000 reported that AI raised annual labor productivity growth by 0.2% over three years. This is a perception, taken from the paper's abstract."

### Atlanta Fed working paper 2026-4

- **What it is.** A survey of nearly 750 corporate executives (March 2026). These figures come from the abstract.
- **Findings.** Gains are positive and vary by sector, concentrated in high-skill services and finance. It reports a productivity paradox: perceived gains exceed measured gains, likely reflecting a delay in revenue realisation.
- **Use.** A warning that benefits executives report are perceptions until a measure confirms them.

### Also in circulation

Menlo Ventures (December 2025) reports 47% of AI deals reaching production against 25% for traditional SaaS. That counts purchase deals among 495 U.S. decision-makers at companies already using AI, once they commit to exploring a solution. Menlo is an AI investor. It is not a project success rate.

## Why they cannot be compared

1. **Kind of claim.** Cited estimate (RAND's 80%), preliminary multi-method report (MIT), survey (S&P, NBER, Atlanta Fed, Menlo), forecast (Gartner), success-selected case study (Stanford), undisclosed practitioner data (Shimoni).
2. **Unit.** Projects, pilots, proofs of concept, initiatives, organisations, custom tools, purchase deals, executives.
3. **Definition.** Perceived failure, zero return, deployment beyond pilot with measurable KPIs, abandoned most, canceled, reached production after committing, reported productivity.
4. **Population.** Engineers recruited on LinkedIn with 13.2% taking part, representatives of 52 organizations and leaders surveyed at conferences, companies already using AI, webinar attendees, only successes, executives.
5. **Technology.** RAND excludes prompt-only LLM projects, MIT concerns generative AI, Gartner agentic AI, and Stanford mixes machine learning and agentic cases.
6. **Vintage.** Sources run from a 2022 article behind RAND's footnote to a forecast for 2027.
7. **Stake.** Analyst firm, AI investor, a blogger at a vendor, a lab whose director co-founded a measurement firm, and central bank economists.

Two false matches to avoid. The 42% in Gartner's poll (conservative investment) has nothing to do with the 42% in S&P (abandoning most initiatives). And S&P's 46% does not contradict or support MIT's 5% of custom tools, because they count different things.

## Rules for any deliverable

- Name the producer, the date, and whether you read the original or a retelling.
- Keep the unit. Never carry a percentage from one unit to another.
- Say what kind of claim it is. Give the sample and its filter.
- Do not average, add or chain figures from different sources, or use one to validate another.
- Do not turn "did not reach production" into "AI does not work". A stopped proof of concept can be a good result.
- Asked for a base rate, say none exists in this evidence. Offer causes and a project-specific rating instead.

## What can be used instead

Causes are more usable than rates, with their biases stated. These routes tend to blame organisations, since they ask engineers or people running successful projects.

- **RAND's five root causes:** leadership (including wrong problem or metrics), data, chasing technology over the problem, underinvestment in infrastructure, immature technology.
- **Stanford's six, as a percent of cases (base not stated, causes overlap):** organisation not ready 35, critical knowledge never recorded 27, legal or compliance blocked 18, technology broke or immature 16, wrong problem or unrealistic expectations 14, talent or sponsorship gap 12.
- **The counter-position.** Technology limits are not zero: Gartner says current models lack the maturity for complex goals, and MIT's report says "Most GenAI systems do not retain feedback, adapt to context, or improve over time" (p3).

## Sources

- https://mlq.ai/media/quarterly_decks/v0.1_State_of_AI_in_Business_2025_Report.pdf
- https://www.rand.org/pubs/research_reports/RRA2680-1.html
- https://www.theregister.com/2025/08/18/generative_ai_zero_return_95_percent
- https://arnon.dk/mits-95-ai-failure-rate-is-wrong/
- https://www.ciodive.com/news/AI-project-fail-data-SPGlobal/742590/
- https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027
- https://digitaleconomy.stanford.edu/app/uploads/2026/03/EnterpriseAIPlaybook_PereiraGraylinBrynjolfsson.pdf
- https://www.nber.org/papers/w34836
- https://www.atlantafed.org/research-and-data/publications/working-papers/2026/03/25/04-artificial-intelligence-productivity-and-the-workforce-evidence-from-corporate-executives
- https://menlovc.com/perspective/2025-the-state-of-generative-ai-in-the-enterprise/
- https://arxiv.org/pdf/2607.23733
