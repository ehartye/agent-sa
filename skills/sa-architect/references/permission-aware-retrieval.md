---
as_of: 2026-11-06
---

# Permission-aware retrieval per cloud

An index is built by a privileged process and queried for a less privileged person. Unless retrieval applies the requester's entitlements, the model can quote documents that person could not open.

Nearly all of this is vendor documentation: primary for what a product does, not proof that it works. No independent benchmark of trimming correctness, latency overhead or sync delay was found. These pages change, so re-read them at design time. Lines marked "Inference" are this guide's reading.

## Ingestion and enforcement

| | Azure AI Search | Google Agent Search | AWS Bedrock Knowledge Bases pattern |
|---|---|---|---|
| Where ACLs are ingested | Indexer or push API, per approach below | Drive and third-party connectors need no extra configuration; for Cloud Storage and BigQuery you upload `acl_info` with each document | Builder writes a `.metadata.json` sidecar per document, with a `department` attribute taken from the S3 prefix |
| Where they are enforced | In the search service, from the caller's Entra token; or a filter string your application supplies | In Agent Search, against the user your identity provider identifies; the page gives only an outline | Middleware Lambda asks Verified Permissions, builds a metadata filter, and the Knowledge Base applies it |
| Status on the page | Mixed, see below | No status stated; links `v1alpha` references for `dataSchema` | Reference pattern in a blog, not a product feature |
| Isolation stated | Not characterized | Not characterized | "filter-level (logical) isolation, not IAM-enforced" |

Azure's four approaches:

| Approach | Status | Ingestion | Query time |
|---|---|---|---|
| Security filters | Generally available, any API | String field of identities, loaded with the documents | Application passes the caller's identity as a filter string |
| POSIX-like ACL / RBAC scopes | Preview | Push API, or ADLS Gen2 indexer or Blob knowledge source on a preview API | Entra token in `x-ms-query-source-authorization` |
| Purview sensitivity labels | Preview | Indexer extracts labels from Blob, ADLS Gen2, SharePoint in Microsoft 365, OneLake | Token, label metadata and Purview policies |
| SharePoint in Microsoft 365 ACLs | Preview | SharePoint indexer extracts permission metadata | Same token check |

Microsoft states that preview features have no SLA, "aren't recommended for production workloads", and might change.

Inference: on Azure the only generally available path is the one where your application builds the filter. A production go-live on native trimming means accepting preview terms, so record that in the decision. Agentic retrieval stacks another preview on top: only minimal, extractive retrieval on `2026-04-01` is GA, while LLM query planning is on `2026-08-01-preview`.

Google's reference architecture on Cloud Run and AlloyDB describes no per-document authorization step, so that path means building it.

## One-way decisions

Decide these first, and set `reversible: false`.

- **Google.** The access-control setting is chosen at data store creation and "You can't turn this setting on or off for an existing data store". Google calls turning it on a one-time procedure. There is one identity provider per supported location.
- **Azure.** `ingestionPermissionOptions` cannot be combined with `assetStore`, so image serving (preview) is unavailable with native permission ingestion. A design that shows source images in answers has to pick. The push path also expects an index schema created with permission filters through a preview API or SDK.
- **AWS.** S3 Object Lock in compliance mode makes sidecars immutable, so re-classifying a document needs a deliberate new-version workflow.
- **Isolation level, AWS.** AWS says not to use the filter pattern when you need hard isolation between customers, when compliance mandates infrastructure-level separation, or when a filter failure would be a regulatory breach. Use a knowledge base per tenant with IAM boundaries instead, and layer filters inside it. Moving later means re-provisioning and re-ingesting (inference).

## Limits to check against the estate

- **Google:** 3000 readers per document, with each group or user counting as one. For third-party connectors, `google.subject` must map to the email address field in the external identity provider. The console's Documents tab shows nothing for access-controlled stores, which slows debugging.
- **Azure:**
  - RBAC scope is preserved per document on ADLS Gen2, but only at container level on plain Blob.
  - Purview enforcement is single-tenant and needs RBAC authentication. User-assigned managed identities are not supported for label extraction, and a tenant global or privileged role administrator has to grant access.
  - Autocomplete and Suggest are unavailable on Purview-enabled indexes.
  - Microsoft advises group access over individual users.
- **Azure, chunking:** when a skillset chunks documents, permission fields move from indexer field mappings to index projections. For labels, Microsoft says that without the projection "chunk-level references aren't filtered". Check that every chunk row carries the fields.
- **AWS:** the pattern is scoped to one tenant, with department-level tags and group claims from Cognito. It is not per-document ACL ingestion.

## Staleness

Each design has two clocks: how fast a change to a person's groups takes effect, and how fast a change to a document's ACL does. Ask for both numbers and compare them with the revocation requirement.

| Cloud | What is documented | Number |
|---|---|---|
| Azure | Changes to Entra group membership, ADLS ACLs, Purview labels or SharePoint ACLs show in results only after the metadata syncs, through an indexer run, push update or Purview refresh. From `2026-05-01-preview`, SharePoint ACL changes on uniquely permissioned items are picked up on each successful indexer run. Changes inherited from a site, library, list or folder "require an explicit refresh" | No latency given; depends on your schedule |
| Google | Not described for Drive or connectors. For Cloud Storage and BigQuery the ACL is data you upload, so freshness is your pipeline's (inference) | Not stated |
| AWS | Revocation takes effect at once only if the API Gateway authorizer cache TTL is 0 or the entry has expired. A cached-decision circuit breaker adds a further window. New or re-tagged documents wait for the ingestion schedule | 300 s default TTL, so up to 5 minutes; 30 to 60 s suggested where timely revocation matters; ingestion every 5 minutes in the sample |

Trap: a change of site-level permission on Azure can look handled because incremental sync exists, yet it needs the explicit refresh above. Name who triggers that refresh.

Microsoft's pages differ on the group clock. The overview lists "Microsoft Entra group membership" among changes reflected only after metadata syncs. The SharePoint indexer page says "Query-time Microsoft Graph resolution expands the user's transitive Microsoft Entra group memberships". Neither reconciles the two, so measure it: remove a user from a group and repeat the query before and after an indexer run.

AWS also says to bind each conversation session to the user's identity and group, and to invalidate it when membership changes or the token is revoked. Inference: chunks already in a session's history outlive a revocation unless the session ends.

## Fail-open modes

Documented by the vendor:

- **AWS, filter:** if the middleware building the filter fails open, "documents from other groups would be exposed". The sample denies by default when Verified Permissions is unavailable, and AWS names denial as the intended behaviour. Design for that availability cost.
- **AWS, tagging:** an untagged document could bypass metadata filters at query time, and a sidecar edit could re-tag a document into another department. The controls are a sidecar-presence check before each ingestion job, restricting `s3:PutObject` to the tagging role, versioning and CloudTrail alarms.
- **Azure, labels:** an unprojected label leaves chunk references unfiltered, as above.
- **Azure and AWS, sync:** unsynchronized changes keep serving until the next sync or cache expiry.

Reported, not confirmed by the vendor pages cited here:

- VentureBeat says Microsoft documents that for Azure OpenAI On Your Data, if the permitted-groups field is not mapped, document-level access is disabled, and calls this a fail-open default. Check the On Your Data documentation before relying on it.
- VentureBeat says custom pipelines that bypass Azure AI Search index under a broadly privileged service account, with no query-time check unless the developer builds one. Its case took that path.

Inference:

- Security filters are string comparison supplied by the application. The Microsoft page describes no server-side refusal of an unfiltered query, so a missing or empty filter may return everything. Put a gateway in front, or test it.
- On a remote SharePoint knowledge source, Microsoft says invalid KQL filter expressions "are ignored, and the query continues to execute without the filter". User permissions still apply, but a filter meant to narrow scope can silently vanish.
- A semantic cache shared across users can serve one person's answer to another with no retrieval step. Scope any cache to the entitlement.
- Redaction is not entitlement. The first of AWS's two guidance patterns redacts with Comprehend, verifies with Macie, quarantines at severity 3 or above and ingests only the redacted folder. People entitled to the values cannot get them back through that index. The second pattern on that page uses role-based metadata filters and per-role guardrails instead. The page defines no severity scale and reports no detection recall.

## The two-account test

This comes from one practitioner's account in VentureBeat. His assistant passed every answer-quality evaluation his team ran, yet returned SharePoint content a low-privilege user could not open.

1. Pick two identities with different entitlements in the source system.
2. Ask a question the high-privilege account has already asked.
3. Ask the same question as the low-privilege account.
4. Compare the output with what that account can open in the source directly. If it returns more, the boundary is not enforced at query time.

The article estimates the cost at two accounts and thirty minutes.

Additions, inference rather than the article's:

- Revoke a permission in the source, wait one documented sync interval and repeat, to measure staleness. Do the same for a group membership.
- Send a request with no token or an empty filter.
- Confirm that chunk rows carry the permission fields.
- Ingest an untagged document and query for it.

Limits: the test finds leaks but cannot prove absence, and it covers only the identities and questions chosen. Put it in the evaluation component and re-run it after each ingestion or policy change, since answer-quality suites do not exercise it.

His fix was a query-path filter that checks the user's SharePoint permissions before the model sees a chunk. The assistant still resolves about 60 percent of email, with no before-the-filter figure given. Some content is now excluded by design, so plan for unanswered queries.

Do not quote the same article's Straiker figure as a rate of entitlement failure. It says 91 percent of successful attacks on productivity agents ended in silent exfiltration. The "more than 1,700" successful attempts cover production agents generally, and the article gives no count for productivity agents. The article says it does not measure that.

## SharePoint principals on Azure AI Search

Microsoft's overview says its SharePoint approach "Honors native SharePoint permissions, including SharePoint site groups". VentureBeat (2026-09-01) says only Entra-backed principals are "documented as reliably enforced at query time". Microsoft's indexer page is more specific than either, and all of it is preview. The table describes the indexer path:

| Access path | Stated support |
|---|---|
| User or Entra group assigned directly to the item | Yes |
| User reaching an assigned Entra group through Entra nesting | Yes, expanded at query time through Microsoft Graph |
| User assigned directly to a SharePoint site group | Yes from `2026-05-01-preview`, with extra configuration; IDs carry the `spg:` prefix |
| Entra group nested inside a SharePoint group | **No.** Results that depend on it are filtered out |
| Other mixed nesting | Not specified; the page says not to infer support |
| "Anyone" or "People in your organization" links | Not supported in preview |
| External or guest users | Not supported |
| Information Management policies | Not evaluated at query time |

**A second route.** The same page says: "For scenarios that require the full SharePoint permissions model, sensitivity labels, and out-of-the-box security trimming, use a remote SharePoint knowledge source". That is preview too. It queries SharePoint live through the Copilot Retrieval API (preview) with the end user's token, so it needs no search index and "no ingestion-time permissions configuration". Microsoft says "SharePoint permissions and Microsoft Purview sensitivity labels are honored". Its limits: each querying user needs a Microsoft 365 Copilot add-on licence or pay-as-you-go consumption; 200 requests per user per hour; 1,500-character queries; at most 25 unordered results; no tables, images or charts; SharePoint sites only, under the same Entra tenant. Inference: it avoids the sync clock and the unsupported paths below, at the price of licences, throughput and no control over chunking. Put it in `decisions` as an alternative.

Three traps follow for the indexer path:

- **Features that silently drop permissions.** If a skillset or indexer uses a custom Web API skill, the knowledge store (including the asset store that image serving needs), the indexer enrichment cache or debug sessions, "document-level permissions aren't included in the indexed content". Check the planned enrichment pipeline against this list before designing it.
- **Over-restriction looks like poor retrieval.** A user whose only route is a nested Entra group gets filtered results, not an error, so it can read as a relevance problem.
- **Sync is partial.** Incremental ACL updates need `2026-05-01-preview` or later, and parent-scope permission changes are not picked up automatically on later indexer runs.

The page also requires application permissions (delegated are not supported), REST API `2026-08-01-preview` or an equivalent preview SDK, and has no portal support.

For each engagement: find out whether the estate grants access through site groups, nested Entra groups, guests or org-wide links, and add those paths to the two-account test in both directions, a person who should see the document and a person who should not.

## Where this goes in the engagement file

- `data_sources[].permissions`: `source-acl` or `app-level` as observed. Leave `unknown` until someone has looked.
- `requirements`: whose permissions retrieval uses, and the revocation window as a number.
- `decisions`: the enforcement path, its status on the page, the alternatives, `reversible`, and dated evidence.
- `risks`: each fail-open and staleness mode that applies, with an owner.
- `components`: the evaluation component's `summary` names the two-account test.

## Sources

- https://learn.microsoft.com/en-us/azure/search/search-document-level-access-overview
- https://learn.microsoft.com/azure/search/agentic-retrieval-overview
- https://learn.microsoft.com/en-us/azure/search/search-indexer-sharepoint-access-control-lists
- https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-sharepoint-remote
- https://docs.cloud.google.com/generative-ai-app-builder/docs/data-source-access-control
- https://docs.cloud.google.com/architecture/rag-capable-gen-ai-app-using-vertex-ai
- https://aws.amazon.com/blogs/architecture/secure-multi-tenant-rag-with-amazon-bedrock-and-verified-permissions/
- https://docs.aws.amazon.com/solutions/securing-sensitive-data-in-rag-applications-using-amazon-bedrock/
- https://venturebeat.com/security/azure-openai-agent-passed-every-evaluation-served-files-user-couldnt-open
