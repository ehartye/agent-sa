// Every deliverable is generated from the engagement file, so the deck, the diagrams and the
// estimate cannot disagree with each other. A section with no data is left out and reported.

import { index } from './model.mjs';
import { architectureEdges, architectureMermaid, architectureSvg, esc, roadmapSvg, sequenceMermaid, sequenceSvg, summarize } from './svg.mjs';

const NOT_MEASURED = 'not yet measured';

const list = (doc, name) => doc[name] ?? [];
const md = (text) => String(text ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

function table(headers, rows) {
  if (rows.length === 0) return '';
  const out = [`| ${headers.join(' | ')} |`, `| ${headers.map(() => '---').join(' | ')} |`];
  for (const row of rows) out.push(`| ${row.map(md).join(' | ')} |`);
  return `${out.join('\n')}\n`;
}

function bullets(items) {
  return items.map((i) => `- ${i}`).join('\n');
}

function effortTotal(doc) {
  const phases = list(doc, 'phases');
  return {
    low: phases.reduce((s, h) => s + h.effort_weeks.low, 0),
    high: phases.reduce((s, h) => s + h.effort_weeks.high, 0),
  };
}

const RISK_ORDER = { high: 0, medium: 1, low: 2 };
function sortedRisks(doc) {
  return [...list(doc, 'risks')].sort((a, b) =>
    RISK_ORDER[a.impact] - RISK_ORDER[b.impact] || RISK_ORDER[a.likelihood] - RISK_ORDER[b.likelihood]);
}

function unitLabel(doc) {
  return { 'person-weeks': 'person-weeks', 'calendar-weeks': 'calendar weeks' }[doc.scope?.effort_unit] ?? 'weeks';
}

function testsFor(doc, id) {
  return list(doc, 'tests').filter((t) => (t.de_risks ?? []).includes(id)).map((t) => t.id);
}

// ---------- questions: what to ask next ----------

export function renderQuestions(doc) {
  const byId = index(doc);
  const open = list(doc, 'unknowns').filter((u) => u.status === 'open');
  const groups = new Map();
  for (const u of open) {
    const key = u.owner ? `${byId.get(u.owner)?.role ?? u.owner} (${u.owner})` : 'No owner yet';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(u);
  }
  const lines = [`# Open questions: ${doc.engagement.name}`, '', `${doc.engagement.customer}. Updated ${doc.engagement.updated}. ${open.length} open.`, ''];
  for (const [owner, items] of groups) {
    lines.push(`## ${owner}`, '');
    for (const u of items) lines.push(`- **${u.id}. ${u.question}** ${u.why}`);
    lines.push('');
  }
  const blocked = list(doc, 'data_sources').filter((d) => d.access !== 'approved' || !d.sampled);
  if (blocked.length) {
    lines.push('## Data to get hold of', '');
    for (const d of blocked) {
      lines.push(`- **${d.id}. ${d.name}** (${d.system}): access ${d.access}${d.sampled ? '' : '; no real samples seen yet'}.`);
    }
    lines.push('');
  }
  const noBaseline = list(doc, 'metrics').filter((m) => !m.baseline);
  if (noBaseline.length) {
    lines.push('## Baselines to measure', '');
    for (const m of noBaseline) lines.push(`- **${m.id}. ${m.name}**: ${m.how_measured}`);
    lines.push('');
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

// ---------- spec.md ----------

export function renderSpec(doc) {
  const byId = index(doc);
  const nameOf = (id) => byId.get(id)?.name ?? id;
  const out = [`# ${doc.engagement.name}`, '', `**Customer:** ${doc.engagement.customer}  `, `**Updated:** ${doc.engagement.updated}`, ''];

  if (doc.need) {
    out.push('## The need', '', doc.need.statement, '');
    if (doc.need.business_driver) out.push(`**Business driver:** ${doc.need.business_driver}`, '');
    if (doc.need.pain_points.length) out.push(bullets(doc.need.pain_points), '');
    if (doc.need.workflow?.length) {
      out.push('### Current workflow', '', table(['Step', 'Actor', 'System', 'Minutes'],
        doc.need.workflow.map((w) => [w.step, w.actor, w.system ?? '', w.minutes ?? ''])));
    }
  }
  if (list(doc, 'stakeholders').length) {
    out.push('## Stakeholders', '', table(['Id', 'Role', 'Authority', 'Cares about'],
      list(doc, 'stakeholders').map((p) => [p.id, p.name ? `${p.role} (${p.name})` : p.role, p.authority, p.cares_about ?? ''])));
  }
  if (list(doc, 'metrics').length) {
    out.push('## What success means', '', table(['Id', 'Metric', 'Kind', 'Baseline', 'Target', 'Floor', 'How measured'],
      list(doc, 'metrics').map((m) => [m.id, m.name, m.kind, m.baseline ?? NOT_MEASURED, m.target, m.floor ?? '', m.how_measured])));
  }
  if (doc.value) {
    out.push('## Value and kill criteria', '', doc.value.hypothesis, '',
      `Value if successful: **${doc.value.value_if_successful}**. Likelihood of success: **${doc.value.likelihood}**. Investment: **${doc.value.investment}**.`, '',
      doc.value.why, '', '**Stop if:**', '', bullets(doc.value.kill_criteria), '');
  }
  if (doc.qualification) {
    out.push('## Approach', '', `**${doc.qualification.approach}** (${doc.qualification.build_or_buy}). ${doc.qualification.why}`, '');
    if (doc.qualification.rejected?.length) {
      out.push(table(['Rejected approach', 'Why'], doc.qualification.rejected.map((r) => [r.approach, r.why])));
    }
  }
  if (list(doc, 'data_sources').length) {
    out.push('## Data', '', table(['Id', 'Source', 'Format', 'Volume', 'Access', 'Sensitivity', 'Permissions', 'Sampled'],
      list(doc, 'data_sources').map((d) => [d.id, `${d.name} (${d.system})`, d.format, d.volume ?? '', d.access, d.sensitivity, d.permissions, d.sampled ? 'yes' : 'no'])));
  }
  if (list(doc, 'requirements').length) {
    out.push('## Requirements', '', table(['Id', 'Kind', 'Priority', 'Requirement', 'Met by'],
      list(doc, 'requirements').map((r) => [r.id, r.kind, r.priority, r.statement,
        list(doc, 'components').filter((c) => (c.satisfies ?? []).includes(r.id)).map((c) => c.id).join(', ')])));
  }
  if (list(doc, 'components').length) {
    out.push('## Architecture', '', '```mermaid', architectureMermaid(doc).trimEnd(), '```', '');
    out.push(table(['Id', 'Component', 'Layer', 'Zone', 'Technology', 'Summary'],
      list(doc, 'components').map((c) => [c.id, c.name, c.layer, nameOf(c.zone), c.tech ?? '', c.summary ?? ''])));
  }
  for (const flow of list(doc, 'flows')) {
    out.push(`### Flow ${flow.id}: ${flow.name}`, '', '```mermaid', sequenceMermaid(doc, flow).trimEnd(), '```', '');
  }
  if (list(doc, 'decisions').length) {
    out.push('## Decisions', '');
    for (const x of list(doc, 'decisions')) {
      out.push(`### ${x.id}. ${x.question}`, '', `**Chosen (${x.status}${x.reversible ? ', reversible' : ', hard to reverse'}):** ${x.chosen}`, '', x.rationale, '');
      if (x.alternatives?.length) out.push(table(['Alternative', 'Why not'], x.alternatives.map((a) => [a.option, a.why_not])));
      if (x.consequences) out.push(`**Consequences:** ${x.consequences}`, '');
      if (x.evidence?.length) {
        out.push('**Evidence:**', '', bullets(x.evidence.map((e) => `${e.claim} (${e.source}, as of ${e.as_of})`)), '');
      }
    }
  }
  if (list(doc, 'risks').length) {
    out.push('## Risks', '', table(['Id', 'Risk', 'Likelihood', 'Impact', 'Mitigation', 'Owner', 'Tests', 'Status'],
      sortedRisks(doc).map((k) => [k.id, k.statement, k.likelihood, k.impact, k.mitigation, k.owner, testsFor(doc, k.id).join(', '), k.status])));
  }
  if (list(doc, 'assumptions').length) {
    out.push('## Assumptions', '', table(['Id', 'Assumption', 'Source', 'If wrong', 'Tests', 'Status'],
      list(doc, 'assumptions').map((a) => [a.id, a.statement, a.source, a.if_wrong, testsFor(doc, a.id).join(', '), a.status])));
  }
  if (list(doc, 'unknowns').length) {
    out.push('## Unknowns', '', table(['Id', 'Question', 'Status', 'Answer'],
      list(doc, 'unknowns').map((u) => [u.id, u.question, u.status, u.answer ?? ''])));
  }
  return `${out.join('\n').trimEnd()}\n`;
}

// ---------- prototype plan and demo runbook ----------

export function renderPrototype(doc) {
  const byId = index(doc);
  const out = [`# Prototype plan and demo runbook: ${doc.engagement.name}`, ''];
  if (list(doc, 'tests').length) {
    const replaced = new Set(list(doc, 'tests').flatMap((t) => t.supersedes ?? []));
    const days = list(doc, 'tests').filter((t) => t.status === 'planned' || t.status === 'running').reduce((s, t) => s + t.timebox_days, 0);
    out.push('## Questions the prototype answers', '', `Timebox still to run, one after another: ${days} days.`, '');
    for (const t of list(doc, 'tests')) {
      out.push(`### ${t.id}. ${t.question}`, '',
        `- **De-risks:** ${(t.de_risks ?? []).join(', ') || 'nothing named'}`,
        `- **Method:** ${t.method}`,
        `- **Pass if:** ${t.pass_if}`,
        `- **If it fails:** ${t.on_fail}`,
        `- **Timebox:** ${t.timebox_days} ${t.timebox_days === 1 ? 'day' : 'days'}`,
        `- **Status:** ${t.status}${t.result ? `. ${t.result}` : ''}${replaced.has(t.id) ? ' Replaced by a later run.' : ''}`, '');
    }
  }
  if (doc.demo) {
    const audience = byId.get(doc.demo.audience);
    out.push('## Demo runbook', '', `**Audience:** ${audience?.role ?? doc.demo.audience}. **Goal:** ${doc.demo.goal}`, '');
    doc.demo.beats.forEach((beat, i) => {
      const test = beat.backed_by ? byId.get(beat.backed_by) : undefined;
      out.push(`### Beat ${i + 1} [${beat.mode}]`, '',
        `- **Show:** ${beat.shows}`,
        `- **Claim:** ${beat.claim}`,
        `- **Backed by:** ${beat.backed_by ? `${beat.backed_by} (${test?.status ?? 'unknown'})` : 'NOTHING: do not make this claim'}`);
      if (beat.disclosure) out.push(`- **Say out loud:** ${beat.disclosure}`);
      if (beat.fallback) out.push(`- **If it breaks:** ${beat.fallback}`);
      if (beat.url) out.push(`- **Open:** ${beat.url}`);
      out.push('');
    });
  }
  return `${out.join('\n').trimEnd()}\n`;
}

// ---------- estimate and statement-of-work outline ----------

export function renderEstimate(doc) {
  const total = effortTotal(doc);
  const out = [`# Scope and estimate: ${doc.engagement.name}`, '', `${doc.engagement.customer}. Updated ${doc.engagement.updated}.`, ''];
  if (doc.scope) {
    out.push(`**Estimate basis: ${doc.scope.estimate_basis}.** ${doc.scope.basis_note ?? ''}`.trimEnd(), '');
    if (doc.scope.estimate_basis === 'judgment') {
      out.push('These ranges are expert judgment. They are not measured from comparable projects, and each phase gate re-estimates from evidence.', '');
    }
    out.push('## In scope', '', bullets(doc.scope.in), '', '## Out of scope', '', bullets(doc.scope.out), '');
  }
  if (list(doc, 'phases').length) {
    const first = list(doc, 'phases')[0];
    out.push('## Phases', '', `Commit to the first phase only: **${first.name}, ${first.effort_weeks.low} to ${first.effort_weeks.high} ${unitLabel(doc)}**. The rest is a hypothesis that each gate re-estimates.`, '', `Sequential effort range across all phases: **${total.low} to ${total.high} ${unitLabel(doc)}**.`, '');
    for (const h of list(doc, 'phases')) {
      out.push(`### ${h.id}. ${h.name} (${h.effort_weeks.low} to ${h.effort_weeks.high} ${unitLabel(doc)})`, '', h.goal, '',
        `**Team:** ${h.team.join(', ')}`, '', '**Deliverables:**', '', bullets(h.deliverables), '',
        '**Gate. Exit criteria:**', '', bullets(h.exit_criteria), '',
        'At the gate, decide: proceed, pivot, reduce scope, pause or stop, and re-estimate the remaining phases.', '');
      if (h.depends_on?.length) out.push(`**Depends on:** ${h.depends_on.join(', ')}`, '');
      if (h.gate_log?.length) {
        out.push('**Gate history:**', '', table(['Date', 'Decision', 'Note', 'Previous range'], h.gate_log.map((g) => [g.date, g.decision, g.note, g.previous_low === undefined ? '' : `${g.previous_low} to ${g.previous_high}`])));
      }
    }
  }
  if (list(doc, 'assumptions').length) {
    out.push('## Assumptions this estimate rests on', '', table(['Id', 'Assumption', 'If wrong', 'Status'],
      list(doc, 'assumptions').map((a) => [a.id, a.statement, a.if_wrong, a.status])));
  }
  const open = list(doc, 'unknowns').filter((u) => u.status === 'open');
  if (open.length) {
    out.push('## Open questions that can move the estimate', '', bullets(open.map((u) => `${u.id}. ${u.question}`)), '');
  }
  if (doc.scope?.run_cost) {
    const rc = doc.scope.run_cost;
    out.push('## Running cost after launch', '', rc.range ? `${rc.range} (prices as of ${rc.as_of}; re-check before quoting).` : `Drivers only; no price range yet (as of ${rc.as_of}).`, '',
      table(['Driver', 'Assumption'], rc.drivers.map((d) => [d.name, d.assumption])));
    if (rc.one_time) out.push(`**One-time cost:** ${rc.one_time}`, '');
  }
  if (doc.value?.kill_criteria.length) {
    out.push('## Stop if', '', bullets(doc.value.kill_criteria), '');
  }
  out.push('## Statement of work outline', '',
    '1. Background and objectives: "The need" in the spec.',
    '2. Scope and exclusions: above.',
    '3. Deliverables and phase gates: above, with acceptance tied to the exit criteria.',
    '4. Customer responsibilities: data access, named owners, subject-matter time and baseline measurement.',
    '5. Assumptions and change control: above; a refuted assumption triggers re-estimation.',
    '6. Success metrics and how they are measured: "What success means" in the spec.',
    '7. Handoff: evaluation kit, runbooks and open items.', '');
  return `${out.join('\n').trimEnd()}\n`;
}

// ---------- handoff ----------

export function renderHandoff(doc, draft) {
  const out = [`# Handoff to delivery: ${doc.engagement.name}`, ''];
  if (doc.handoff) {
    out.push(`**Delivery owner:** ${doc.handoff.delivery_owner}`, '', '## Evaluation kit', '', bullets(doc.handoff.eval_kit), '');
    if (doc.handoff.commitments?.length) out.push(draft ? '## Proposed commitments, not yet made' : '## What the customer was told', '', bullets(doc.handoff.commitments), '');
  }
  const proposed = list(doc, 'decisions').filter((x) => x.status === 'proposed');
  if (proposed.length) out.push('## Decisions not yet accepted', '', bullets(proposed.map((x) => `${x.id}. ${x.question} Proposed: ${x.chosen}`)), '');
  const open = list(doc, 'unknowns').filter((u) => u.status === 'open');
  if (open.length) out.push('## Open unknowns', '', table(['Id', 'Question', 'Owner'], open.map((u) => [u.id, u.question, u.owner ?? 'none'])));
  const untested = list(doc, 'assumptions').filter((a) => a.status === 'untested');
  if (untested.length) out.push('## Untested assumptions', '', table(['Id', 'Assumption', 'If wrong'], untested.map((a) => [a.id, a.statement, a.if_wrong])));
  const risks = sortedRisks(doc).filter((k) => k.status === 'open');
  if (risks.length) out.push('## Open risks', '', table(['Id', 'Risk', 'Impact', 'Mitigation', 'Owner'], risks.map((k) => [k.id, k.statement, k.impact, k.mitigation, k.owner])));
  const nonLive = doc.demo?.beats.filter((b) => b.mode !== 'live') ?? [];
  if (nonLive.length) {
    out.push('## Shown in the demo but not real yet', '', bullets(nonLive.map((b) => `[${b.mode}] ${b.shows}`)), '');
  }
  if (list(doc, 'tests').length) {
    out.push('## Prototype results', '', table(['Id', 'Question', 'Status', 'Result'], list(doc, 'tests').map((t) => [t.id, t.question, t.status, t.result ?? ''])));
  }
  return `${out.join('\n').trimEnd()}\n`;
}

// ---------- deck ----------

function htmlTable(headers, rows) {
  const head = headers.map((h) => `<th>${esc(h)}</th>`).join('');
  const body = rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('');
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function htmlList(items) {
  return `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
}

function buildSlides(doc, audience) {
  const technical = audience?.depth === 'technical';
  const slides = [];
  const add = (title, body, trace = [], notes = '') => slides.push({ title, body, trace, notes });
  const metrics = list(doc, 'metrics');

  add(doc.engagement.name,
    `<p class="lede">${esc(doc.engagement.customer)}</p>${audience ? `<p class="ask">${esc(audience.ask)}</p>` : ''}<p class="date">${esc(doc.engagement.updated)}</p>`);

  if (doc.need) {
    const measured = metrics.filter((m) => m.baseline && m.kind === 'business');
    add('The problem',
      `<p class="lede">${esc(doc.need.statement)}</p>${htmlList(doc.need.pain_points.slice(0, 5))}${measured.length ? `<p class="callout">${measured.map((m) => `${esc(m.name)}: ${esc(m.baseline)}`).join(' · ')}</p>` : ''}`,
      measured.map((m) => m.id));
  }
  if (metrics.length) {
    const priority = { business: 0, safety: 1, cost: 2, latency: 3, quality: 4 };
    const shown = technical ? metrics : [...metrics].sort((a, b) => priority[a.kind] - priority[b.kind]).slice(0, 6);
    const rows = shown.map((m) => [m.name, m.baseline ?? NOT_MEASURED, m.target, m.floor ?? '—']);
    const gaps = metrics.filter((m) => !m.baseline);
    add('What success means',
      `${htmlTable(['Metric', 'Today', 'Target', 'Floor'], rows)}${gaps.length ? `<p class="callout warn">${gaps.length} of ${metrics.length} baselines are ${NOT_MEASURED}. No improvement figure can be claimed for them yet.</p>` : ''}`,
      metrics.map((m) => m.id));
  }
  if (doc.value || doc.qualification) {
    let body = '';
    if (doc.value) {
      body += `<p class="lede">${esc(doc.value.hypothesis)}</p><div class="trio">
<div><span>Value if successful</span><strong>${esc(doc.value.value_if_successful)}</strong></div>
<div><span>Likelihood of success</span><strong>${esc(doc.value.likelihood)}</strong></div>
<div><span>Investment</span><strong>${esc(doc.value.investment)}</strong></div></div>`;
    }
    if (doc.qualification) {
      body += `<p><strong>Approach: ${esc(doc.qualification.approach)}.</strong> ${esc(doc.qualification.why)}</p>`;
      if (doc.qualification.rejected?.length) {
        body += htmlTable(['Considered', 'Why not'], doc.qualification.rejected.slice(0, technical ? 8 : 5).map((r) => [r.approach, r.why]));
      }
    }
    add('Why this, and why not something simpler', body);
  }
  if (list(doc, 'components').length && list(doc, 'zones').length) {
    const crowded = !technical && list(doc, 'components').length > 8;
    const shown = crowded ? summarize(doc) : doc;
    const edges = architectureEdges(shown);
    const legend = edges.map((e) => `<li class="${e.sensitive ? 'alert' : ''}"><b>${e.number}</b> ${esc(e.labels.join('; '))}</li>`).join('');
    const redNote = edges.some((e) => e.sensitive) ? '<p class="alertnote">Red paths carry confidential, regulated or unclassified data.</p>' : '';
    add('How it works', `<div class="arch"><div class="figure">${architectureSvg(shown, { legend: false })}</div><div class="legend"><ol>${legend}</ol>${redNote}</div></div>`, [], crowded ? 'One box per layer in each zone. The technical deck and diagrams/architecture.svg show every component.' : 'Walk the numbered paths in order. Red paths carry sensitive data.');
  }
  if (technical) {
    for (const flow of list(doc, 'flows')) {
      add(`Flow: ${flow.name}`, `<div class="figure">${sequenceSvg(doc, flow)}</div>`, [flow.id]);
    }
  }
  if (list(doc, 'decisions').length) {
    const rows = list(doc, 'decisions').slice(0, technical ? 10 : 5).map((x) => [x.question, x.chosen,
      technical ? (x.alternatives ?? []).map((a) => a.option).join('; ') : x.rationale]);
    add('Key decisions', htmlTable(['Question', 'Chosen', technical ? 'Alternatives' : 'Why'], rows), list(doc, 'decisions').map((x) => x.id));
  }
  if (list(doc, 'risks').some((k) => !k.internal)) {
    const shareable = sortedRisks(doc).filter((k) => !k.internal);
    const rows = shareable.slice(0, technical ? 8 : 5).map((k) => [k.statement, k.impact, k.mitigation, testsFor(doc, k.id).join(', ') || '—']);
    add('What could go wrong', htmlTable(['Risk', 'Impact', 'Mitigation', 'Test'], rows), shareable.slice(0, 8).map((k) => k.id));
  }
  if (list(doc, 'tests').length) {
    // Lead with what has been found out, leave replaced runs to the spec, and say what was left out.
    const replaced = new Set(list(doc, 'tests').flatMap((t) => t.supersedes ?? []));
    const order = { failed: 0, passed: 1, running: 2, planned: 3 };
    const current = list(doc, 'tests').filter((t) => !replaced.has(t.id)).sort((a, b) => order[a.status] - order[b.status]);
    const shown = current.slice(0, technical ? 8 : 6);
    const counts = ['passed', 'failed', 'running', 'planned'].map((s) => [s, current.filter((t) => t.status === s).length]).filter(([, n]) => n > 0).map(([s, n]) => `${n} ${s}`).join(', ');
    add('What the prototype will prove',
      `<p class="callout">${esc(counts)}.${current.length > shown.length ? ` The ${current.length - shown.length} not listed are in the prototype plan.` : ''}</p>${htmlTable(['Question', 'Pass if', 'Status'], shown.map((t) => [t.question, t.pass_if, t.status]))}`,
      shown.map((t) => t.id));
  }
  if (doc.demo) {
    const nonLive = doc.demo.beats.filter((b) => b.mode !== 'live');
    add('What you are about to see',
      `${htmlTable(['We show', 'Mode'], doc.demo.beats.map((b) => [b.shows, b.mode]))}${nonLive.length ? `<p class="callout">${nonLive.length} of ${doc.demo.beats.length} beats are not live. Each is labelled when it appears.</p>` : ''}`,
      [], doc.demo.beats.filter((b) => b.disclosure).map((b) => b.disclosure).join(' '));
  }
  if (list(doc, 'phases').length) {
    const total = effortTotal(doc);
    const basis = doc.scope?.estimate_basis ?? 'judgment';
    add('The plan',
      `<div class="figure">${roadmapSvg(doc)}</div>${htmlTable(['Phase', 'Exit criteria'], list(doc, 'phases').map((h) => [h.name, h.exit_criteria.join('; ')]))}<p class="callout">${total.low} to ${total.high} ${unitLabel(doc)} of effort, estimate basis: ${esc(basis)}. Each gate re-estimates from evidence and can stop the work.</p>`,
      list(doc, 'phases').map((h) => h.id));
  }
  const openUnknowns = list(doc, 'unknowns').filter((u) => u.status === 'open').sort((a, b) => Number(b.owner === audience?.audience) - Number(a.owner === audience?.audience));
  const untested = list(doc, 'assumptions').filter((a) => a.status === 'untested');
  if (openUnknowns.length || untested.length) {
    const more = (n) => (n > 5 ? `<p class="date">And ${n - 5} more in the spec.</p>` : '');
    add('What could change this',
      `${untested.length ? `<h3>Assumptions not yet tested</h3>${htmlList(untested.slice(0, 5).map((a) => a.statement))}${more(untested.length)}` : ''}${openUnknowns.length ? `<h3>Open questions</h3>${htmlList(openUnknowns.slice(0, 5).map((u) => u.question))}${more(openUnknowns.length)}` : ''}`,
      [...untested.slice(0, 5).map((a) => a.id), ...openUnknowns.slice(0, 5).map((u) => u.id)]);
  }
  if (doc.scope?.run_cost) {
    const rc = doc.scope.run_cost;
    add('Running cost', `<p class="lede">${esc(rc.range ?? 'Drivers identified; prices not yet confirmed')}</p>${htmlTable(['Driver', 'Assumption'], rc.drivers.map((d) => [d.name, d.assumption]))}<p class="date">Prices as of ${esc(rc.as_of)}</p>`);
  }
  if (audience || doc.value) {
    add('Decision needed',
      `${audience ? `<p class="lede">${esc(audience.ask)}</p>` : ''}${doc.value?.kill_criteria.length ? `<h3>We will recommend stopping if</h3>${htmlList(doc.value.kill_criteria)}` : ''}`);
  }
  return slides;
}

const DECK_CSS = `
:root{--ink:#1f2933;--muted:#5f6c7b;--line:#d9e2ec;--accent:#0b6e99;--warn:#8a5a00;--warnbg:#fff7e6;--bg:#ffffff}
*{box-sizing:border-box}html,body{margin:0;height:100%;background:#e4e7eb;color:var(--ink);font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
.slide{display:none;position:absolute;inset:0;margin:auto;width:min(100vw,calc(100vh*16/9));height:min(100vh,calc(100vw*9/16));background:var(--bg);padding:4.5% 6% 6%;overflow:auto;font-size:clamp(13px,1.75vw,24px);line-height:1.38}
.slide.on{display:block}h1,h2{margin:0 0 .6em;font-weight:680;letter-spacing:-.01em}h2{font-size:1.75em}h1{font-size:2.6em;margin-top:18%}h3{margin:.8em 0 .3em;font-size:1em}
.lede{font-size:1.15em;margin:0 0 .7em}.ask{font-size:1.15em;color:var(--accent);font-weight:600}.date{color:var(--muted);font-size:.8em}
ul{margin:.3em 0 .7em;padding-left:1.2em}li{margin:.25em 0}
table{width:100%;border-collapse:collapse;font-size:.8em;margin:.3em 0 .8em}th{text-align:left;color:var(--muted);font-weight:600;border-bottom:2px solid var(--line);padding:.35em .6em .35em 0}td{border-bottom:1px solid var(--line);padding:.4em .6em .4em 0;vertical-align:top}
.callout{background:#eef6fa;border-left:4px solid var(--accent);padding:.5em .8em;font-size:.85em}.callout.warn{background:var(--warnbg);border-left-color:var(--warn)}
.trio{display:flex;gap:1em;margin:.4em 0 .9em}.trio div{flex:1;border:1px solid var(--line);border-radius:8px;padding:.5em .8em}.trio span{display:block;color:var(--muted);font-size:.72em}.trio strong{font-size:1.25em;text-transform:capitalize}
.arch{display:flex;gap:1em;align-items:flex-start}.arch .figure{flex:1 1 76%;min-width:0;margin:0}.legend{flex:0 0 22%;font-size:.58em;line-height:1.3}.legend ol{list-style:none;margin:0;padding:0}.legend li{margin:0 0 .45em}.legend b{display:inline-block;min-width:1.5em}.legend li.alert b{color:#b4232c}.alertnote{color:#b4232c;margin-top:.8em}.figure{margin:.2em 0 .6em}.figure svg{max-height:min(62vh,calc(100vw*9/16*.62));display:block;margin:auto}
.draft{background:#fdecea;color:#8a1c14;border:1px solid #e0a39d;border-radius:4px;padding:.2em .6em;font-size:.65em;font-weight:600;display:inline-block;margin-bottom:.6em}
.foot{position:absolute;left:6%;right:6%;bottom:2.2%;display:flex;justify-content:space-between;color:var(--muted);font-size:.6em}
.notes{display:none;margin-top:1em;border-top:1px dashed var(--line);padding-top:.5em;color:var(--muted);font-size:.8em}body.shownotes .notes{display:block}
@media print{@page{size:13.333in 7.5in;margin:0}html,body{background:#fff;height:auto}.slide{display:block;position:relative;inset:auto;margin:0;width:13.333in;height:auto;min-height:7.5in;page-break-after:always;font-size:20px;overflow:visible}.foot{position:static;margin-top:1em}.figure svg{max-height:4.6in}}
`;

const DECK_JS = `
(function(){var s=[].slice.call(document.querySelectorAll('.slide')),i=0;
function fit(e){e.style.fontSize='';var size=parseFloat(getComputedStyle(e).fontSize),floor=size*0.68;while(e.scrollHeight>e.clientHeight&&size>floor){size-=0.5;e.style.fontSize=size+'px'}}
function show(n){i=Math.max(0,Math.min(s.length-1,n));s.forEach(function(e,k){e.classList.toggle('on',k===i)});fit(s[i]);try{location.replace('#'+(i+1))}catch(e){}}
addEventListener('resize',function(){fit(s[i])});
var h=parseInt((location.hash||'').slice(1),10);show(h?h-1:0);
addEventListener('keydown',function(e){if(['ArrowRight','PageDown',' '].indexOf(e.key)>=0){e.preventDefault();show(i+1)}if(['ArrowLeft','PageUp'].indexOf(e.key)>=0){e.preventDefault();show(i-1)}if(e.key==='Home')show(0);if(e.key==='End')show(s.length-1);if(e.key==='n')document.body.classList.toggle('shownotes')});
addEventListener('click',function(e){if(e.target.closest('a,button'))return;show(i+(e.clientX<innerWidth/3?-1:1))});
})();
`;

export function renderDeck(doc, audience, draft) {
  const slides = buildSlides(doc, audience);
  const mark = draft ? `<div class="draft">DRAFT: the ${esc(draft.stage)} stage is not complete. Not ready to share.</div>` : '';
  const sections = slides.map((slide, i) => {
    const heading = i === 0 ? `<h1>${esc(slide.title)}</h1>` : `<h2>${esc(slide.title)}</h2>`;
    const trace = slide.trace.length ? esc(slide.trace.join(' ')) : '';
    const notes = slide.notes ? `<div class="notes">${esc(slide.notes)}</div>` : '';
    return `<section class="slide">${mark}${heading}${slide.body}${notes}<div class="foot"><span>${trace}</span><span>${i + 1} / ${slides.length}</span></div></section>`;
  });
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(doc.engagement.name)}</title><link rel="icon" href="data:,"><style>${DECK_CSS}</style></head>
<body>${sections.join('\n')}<script>${DECK_JS}</script></body></html>
`;
}

// ---------- the whole set ----------

export function renderAll(doc, { draft } = {}) {
  const files = new Map();
  const skipped = [];
  const banner = draft ? `> **Draft.** The ${draft.stage} stage has ${draft.errors} open errors. Do not share this as settled.\n\n` : '';
  const put = (path, content) => files.set(path, path.endsWith('.md') ? banner + content : content);
  const skip = (path, why) => skipped.push({ path, why });

  put('spec.md', renderSpec(doc));
  put('questions.md', renderQuestions(doc));

  const hasArchitecture = (doc.components ?? []).length > 0 && (doc.zones ?? []).length > 0;
  if (hasArchitecture) {
    put('diagrams/architecture.svg', `${architectureSvg(doc)}\n`);
    put('diagrams/architecture.mmd', architectureMermaid(doc));
    for (const flow of doc.flows ?? []) {
      put(`diagrams/flow-${flow.id}.svg`, `${sequenceSvg(doc, flow)}\n`);
      put(`diagrams/flow-${flow.id}.mmd`, sequenceMermaid(doc, flow));
    }
  } else skip('diagrams/', 'needs components and zones');

  if ((doc.phases ?? []).length > 0) {
    put('diagrams/roadmap.svg', `${roadmapSvg(doc)}\n`);
    put('estimate.md', renderEstimate(doc));
  } else skip('estimate.md', 'needs phases');

  if ((doc.tests ?? []).length > 0 || doc.demo) put('prototype.md', renderPrototype(doc));
  else skip('prototype.md', 'needs tests or a demo');

  if (doc.handoff) put('handoff.md', renderHandoff(doc, draft));
  else skip('handoff.md', 'needs a handoff section');

  const audiences = doc.audiences ?? [];
  if (audiences.length === 0) {
    put('deck.html', renderDeck(doc, undefined, draft));
  } else {
    for (const audience of audiences) put(`deck-${audience.audience}-${audience.depth}.html`, renderDeck(doc, audience, draft));
  }
  return { files, skipped };
}
