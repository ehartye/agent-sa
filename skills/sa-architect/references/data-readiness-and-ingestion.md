---
as_of: 2026-11-06
---

# Data readiness and ingestion: the evidence

The evidence base is thin: one peer-reviewed measurement study, one experience report, one benchmark whose abstract gives no scores, and vendor documentation that describes features without measuring them. Lines marked "Inference" are this guide's reading, not a source's claim.

## Measured parser, chunker and retriever effects

The one measurement study found is El Bachyr et al., ICSE-SEIP 2026, by authors at the University of Luxembourg, King Fahd University of Petroleum and Minerals, and BGL BNP Paribas.

Denominators: FinanceBench has 150 narrative questions over 168 pages. TableQuest, the authors' own set, has table questions over 169 pages. Its size is printed as 116 in Table 3 and 164 in section 4.6.1. The reported 73.28 percent matches 85 of 116, so 116 is used here. Retrieval is scored per page.

| Question | Result |
|---|---|
| Parser, narrative text (MRR) | pdfminer 0.646, pdfplumber 0.634, PyPDF2 0.588 (last) |
| Parser, table pages (MRR) | pdfplumber 0.807, pdfminer 0.793, PyPDF2 0.758 (last) |
| Parse time per page, 169 pages | pypdfium2 0.003 s, PyMuPDF 0.004 s, PyPDF2 0.036 s, pdfminer 0.080 s, pdfplumber 0.104 s, Unstructured with OCR and a layout model 1.888 s |
| Chunker at 25 percent overlap, pdfplumber and SPLADE (MRR, narrative / table) | neural 0.658 / 0.833, sentence 0.651 / 0.819 |
| Chunks per page, narrative set | recursive 2.06, sentence 2.24, semantic 5.79, neural 8.06 |
| Overlap with neural chunking (MRR, narrative / table) | 0 percent 0.529 / 0.735, 25 percent 0.658 / 0.833, 50 percent 0.647 / 0.832 |
| Retriever (MRR, narrative / table) | BM25 0.210 / 0.677, E5 0.700 / 0.751, ColBERT 0.610 / 0.844, SPLADE 0.625 / 0.784 |
| Best end-to-end answer accuracy, 3 pages retrieved | GPT-5-mini 54.00 percent on narrative (81 of 150), GPT-5 73.28 percent on tables (85 of 116) |

The authors conclude that lightweight parser and chunker combinations often match more complex ones, that moderate overlap helps, and that excess granularity adds cost without consistent benefit. They call sentence chunking a near-optimal, low-cost fallback.

### How far this reaches

Limits the authors state:

- Results may not generalize to other domains such as legal or healthcare, to other tools, or to frontier models.
- Chunks were capped at 512 tokens, and one seed was used because of GPU memory limits.
- GPT-4o-mini graded the answers, not people, and it shares biases with the generators it grades.

Limits of the design:

- All six parsers are open-source libraries. No managed cloud parser and no vision-language model was tested.
- Only pages linked to a question were indexed, 337 in all. A production index holds far more distractors.

Inferences from the paper's tables:

- **A chunker ranking is only true at its overlap.** At 0 percent overlap with pdfplumber on the narrative set, neural scored 0.528 (Figure 5a; Table 11 prints 0.529 for the same setting) while sentence and recursive scored 0.647. At 25 percent, neural led. Attach the overlap to any "best chunker" claim.
- **The retriever moved the score more than the parser did on digital filings.** The parser spread on the narrative set is 0.058, and the top five sit within 0.020. Excluding BM25, the retriever spread is 0.090.
- **Small gaps are noise at this size.** One question is worth about 0.7 points on 150 and 0.9 on 116. A 95 percent interval around these accuracies is about plus or minus 8 points, so a few points between configurations decide nothing.
- **Scans are untested.** Public financial filings are likely to be mostly digital. The rule-based parsers' strength should not be assumed for scans, photos or handwriting.

Design consequence: an expensive parser or chunker has to beat a cheap baseline on the customer's own documents. Neural chunking costs about 3.6 times the chunks of sentence chunking here, which sizes the index.

## No head-to-head of cloud parsers

No independent comparison of managed cloud parsers was found. Statements about them are vendor claims about features, not measured quality. A recommendation between clouds on parsing quality is unsupported today, so a bake-off on the customer's documents is the defensible route.

OmniDocBench could help. Its authors describe nine document sources, including handwritten notes and dense newspapers, with evaluation of pipeline and vision-language methods. The abstract names no parser and gives no score. Read the paper and its repository before relying on it.

Vendor facts that change a design:

- **Azure Content Understanding.** Microsoft recommends `prebuilt-documentSearch` for RAG ingestion. `prebuilt-digitalParse` reads a file's internal structure, so scans need `prebuilt-read` or `prebuilt-layout`. Figure analysis covers PDF and image formats only. Prebuilt definitions "can change across API versions", so Microsoft says to copy the analyzer for production. Embedded metadata comes back by default from `prebuilt-digitalParse` alone in GA `2025-11-01`. In `2026-06-01-preview` it also comes from read and layout. The page gives no accuracy, latency or price.
- **AWS.** An AWS blog states that Bedrock Knowledge Bases defaults to 300-token chunks with 20 percent overlap. That is not the setting the study above measured, so its results do not transfer directly.
- **Google Cloud.** The AlloyDB reference architecture has a Cloud Run function parse and chunk the data, and it names no managed parser. Parsing quality is then the builder's job.

## Test set first

Microsoft's RAG design series puts representative test files and test queries in its first phase, before any chunking choice. The queries include synthetic ones and ones the files do not cover. It says to evaluate each step independently, and to remember that customers experience the end result. The series' introduction page gives no chunk sizes or thresholds, so it is a method, not a benchmark.

Barnett et al. conclude that validating a RAG system is feasible only during operation. These two positions pull apart.

Inference: build the test set anyway, since nothing else can compare parsers before traffic exists, and also budget for monitoring and recalibration, since real inputs are unknown in advance.

Design consequences:

- The test set exists before the parser decision, and that decision's evidence cites results on it.
- Record the count of each question type: answerable, table, multi-document and unanswerable.
- Sample across the real document classes. Born-digital and scanned, narrative and table-heavy, should be measured apart.
- Record parser and API version, chunker, size, overlap, embedding model and top-k with each result. Microsoft says to document the hyperparameters with the results.

## Seven Failure Points as a design checklist

From Barnett et al., an experience report from early 2024 with GPT-4. It covers three case studies, two of them on non-public data, and one BioASQ run of 1000 questions. The document count for that run is printed as 15,000 twice and 4,017 twice. The names and descriptions are the paper's. The design questions are this guide's mapping.

| FP | Failure | Design question |
|---|---|---|
| 1 | Missing content: the answer is not in the documents, yet the system may answer | Does the test set hold unanswerable questions, and what does the design do on no answer? |
| 2 | Missed the top-ranked documents | What top-K, and which metadata and parser output explain failed queries? |
| 3 | Not in context: retrieved, then dropped in consolidation | How many chunks fit the prompt budget, and what is the consolidation strategy? |
| 4 | Not extracted: in context, but noise or contradiction hid it | Are headers, footers and broken tables cleaned out? |
| 5 | Wrong format: table or list instruction ignored | Do tables survive parsing as structure, and is the format tested? |
| 6 | Incorrect specificity | Who is the audience, and does the test set reflect it? |
| 7 | Incomplete: available information left out | Are multi-document questions split and tested? |

Findings from the same paper that change a design:

- Changing the embedding strategy means re-indexing all chunks. Treat the choice as costly to reverse.
- Adding file name and chunk number to the retrieved context helped the reader (AI Tutor case).
- Automated grading was more pessimistic than a human rater in the biomedical run, though the raters were not domain experts. Spot-check judge verdicts with a person.

## Sources

- https://arxiv.org/pdf/2604.12047
- https://arxiv.org/html/2401.05856v1
- https://arxiv.org/abs/2412.07626
- https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/rag/rag-solution-design-and-evaluation-guide
- https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/concepts/prebuilt-analyzers
- https://aws.amazon.com/blogs/architecture/secure-multi-tenant-rag-with-amazon-bedrock-and-verified-permissions/
- https://docs.cloud.google.com/architecture/rag-capable-gen-ai-app-using-vertex-ai
