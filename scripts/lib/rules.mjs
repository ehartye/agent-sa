// Judgment rules. Each encodes a failure that sinks real engagements, and each stays
// silent until the stage where its section is expected to exist.

import { NEED_PLACEHOLDER, STAGES, index } from './model.mjs';

const DAY = 86_400_000;

export const STALE_EVIDENCE_DAYS = 90;

export function evaluate(doc, { stage = 'handoff', today, only = false } = {}) {
  const findings = [];
  const add = (level, code, where, message) => findings.push({ level, code, where, message });
  const byId = index(doc);
  const list = (name) => doc[name] ?? [];
  const now = today ? Date.parse(today) : Date.now();
  const active = (target) => (only ? stage === target : STAGES.indexOf(stage) >= STAGES.indexOf(target));

  // A placeholder anywhere would reach a deck, so it is an error at every stage.
  for (const { where, text } of allStrings(doc)) {
    if (PLACEHOLDER.test(text)) {
      add('error', 'PLACEHOLDER_TEXT', where, `"${truncate(text)}" looks like a placeholder; state the fact, or record an unknown`);
    }
  }

  // discover
  if (active('discover')) {
  if (doc.need?.statement === NEED_PLACEHOLDER) {
    add('error', 'PLACEHOLDER_NEED', 'need.statement', "replace the template text with the need in the customer's own words");
  }
  if (doc.need && doc.need.pain_points.length === 0) {
    add('error', 'NO_PAIN', 'need.pain_points', 'name at least one pain point in the customer\'s words');
  }
  if (!list('stakeholders').some((p) => p.authority === 'sponsor')) {
    add('error', 'NO_SPONSOR', 'stakeholders', 'no sponsor is recorded; who funds this and can stop it?');
  }
  if (!list('stakeholders').some((p) => ['security', 'compliance'].includes(p.authority))) {
    add('warning', 'NO_RISK_OWNER', 'stakeholders', 'no security or compliance contact; they are a frequent late blocker, so find one early');
  }
  if (list('data_sources').length === 0) {
    add('error', 'NO_DATA', 'data_sources', 'no data source is recorded; ask what the system would actually read');
  }
  for (const d of list('data_sources')) {
    if (!d.sampled) {
      add('warning', 'DATA_NOT_SAMPLED', d.id, `nobody has looked at real samples of "${d.name}"; descriptions such as "mostly PDFs" are not evidence`);
    }
    if (d.access !== 'approved') {
      const tracked = list('unknowns').some((u) => u.status === 'open' && mentions(u, d.id))
        || list('risks').some((k) => mentions(k, d.id))
        || list('tests').some((t) => mentions(t, d.id));
      if (!tracked) {
        add('warning', 'ACCESS_UNTRACKED', d.id, `access to "${d.name}" is ${d.access} and no open unknown, risk or test names ${d.id}`);
      }
    }
    if (d.permissions === 'unknown' && ['confidential', 'regulated', 'unknown'].includes(d.sensitivity)) {
      add('warning', 'PERMISSIONS_UNKNOWN', d.id, `"${d.name}" may be sensitive and its permission model is unknown; retrieval can leak what a user may not open`);
    }
  }

  }

  // frame
  if (active('frame')) {
    if (list('metrics').length === 0) add('error', 'NO_METRICS', 'metrics', 'no success metric; define what "working" means before designing');
    if (!list('metrics').some((m) => m.kind === 'business')) {
      add('warning', 'NO_BUSINESS_METRIC', 'metrics', 'no business metric; technical quality alone will not justify the work');
    }
    for (const m of list('metrics')) {
      if (!m.baseline || NOT_A_VALUE.test(m.baseline.trim())) {
        const asked = list('unknowns').some((u) => u.status === 'open' && mentions(u, m.id));
        add(asked ? 'warning' : 'error', 'NO_BASELINE', m.id,
          asked
            ? `"${m.name}" has no baseline yet; an open unknown tracks it, so no improvement claim can be made until it is answered`
            : `"${m.name}" has no baseline and no open unknown names ${m.id}; improvement cannot be shown without one`);
      } else if (!m.baseline_source) {
        add('warning', 'BASELINE_UNSOURCED', m.id, `say where the baseline for "${m.name}" came from`);
      }
    }
    if (!doc.value) add('error', 'NO_VALUE', 'value', 'no value hypothesis');
    else if (doc.value.kill_criteria.length === 0) {
      add('error', 'NO_KILL_CRITERIA', 'value.kill_criteria', 'state what result would stop this work');
    }
    if (!doc.qualification) add('error', 'NO_QUALIFICATION', 'qualification', 'no approach has been qualified');
    else {
      const simpler = !['no-ai', 'rules'].includes(doc.qualification.approach) && (doc.qualification.rejected ?? []).length === 0;
      if (simpler) add('error', 'NO_SIMPLER_OPTION', 'qualification.rejected', 'record the simpler approaches considered and why each falls short');
      if (['agent', 'multi-agent'].includes(doc.qualification.approach)
        && !(doc.qualification.rejected ?? []).some((r) => /\b(workflow|rag|single|rules?|classical)\b/i.test(r.approach))) {
        add('warning', 'AGENT_UNJUSTIFIED', 'qualification', 'an agent was chosen with no rejected workflow, RAG, rules or single-call option on record');
      }
    }
  }

  // architect
  if (active('architect')) {
    if (list('requirements').length === 0) add('error', 'NO_REQUIREMENTS', 'requirements', 'no requirements');
    if (list('components').length === 0) add('error', 'NO_COMPONENTS', 'components', 'no components');
    if (list('zones').length === 0) add('error', 'NO_ZONES', 'zones', 'no trust zones; say where data and compute sit');
    if (list('flows').length === 0) add('error', 'NO_FLOWS', 'flows', 'no flow; a diagram without a request path hides the design');
    const satisfied = new Set(list('components').flatMap((c) => c.satisfies ?? []));
    for (const r of list('requirements')) {
      if (r.priority === 'must' && !satisfied.has(r.id)) {
        add('error', 'UNMET_MUST', r.id, 'a must-have requirement is met by no component');
      }
    }
    if (!list('requirements').some((r) => ['security', 'compliance'].includes(r.kind))) {
      add('warning', 'NO_SECURITY_REQ', 'requirements', 'no security or compliance requirement');
    }
    if (!list('components').some((c) => c.layer === 'evaluation')) {
      add('error', 'NO_EVAL', 'components', 'no evaluation component; quality cannot be held in production without one');
    }
    if (!list('components').some((c) => c.layer === 'observability')) {
      add('warning', 'NO_OBSERVABILITY', 'components', 'no observability component; cost and failures will be invisible');
    }
    if (list('decisions').length === 0) add('error', 'NO_DECISIONS', 'decisions', 'no decisions recorded; say what was chosen and what was not');
    if (list('risks').length === 0) add('error', 'NO_RISKS', 'risks', 'no risks recorded');

    for (const x of list('decisions')) {
      if ((x.alternatives ?? []).length === 0) add('error', 'NO_ALTERNATIVES', x.id, 'a decision with no alternative is not a decision');
      if ((x.evidence ?? []).length === 0) {
        add('warning', 'NO_EVIDENCE', x.id, 'no evidence recorded; vendor facts change, so cite a source and a date');
      }
      for (const e of x.evidence ?? []) {
        const age = Math.floor((now - Date.parse(e.as_of)) / DAY);
        if (age > STALE_EVIDENCE_DAYS) {
          add('warning', 'STALE_EVIDENCE', x.id, `evidence "${truncate(e.claim)}" is ${age} days old; re-check ${e.source}`);
        }
      }
    }

    const zoneOf = new Map(list('components').map((c) => [c.id, c.zone]));
    for (const f of list('flows')) {
      for (const [i, step] of f.steps.entries()) {
        const from = zoneOf.get(step.from);
        const to = zoneOf.get(step.to);
        if (from === to) continue;
        const data = step.data ? byId.get(step.data) : undefined;
        if (!data) {
          add('warning', 'CROSSING_WITHOUT_DATA', `${f.id}.steps[${i}]`, `this step crosses from ${from} to ${to} and does not say what data it carries`);
          continue;
        }
        if (!['confidential', 'regulated', 'unknown'].includes(data.sensitivity)) continue;
        if (list('zones').find((z) => z.id === from)?.kind === 'public') continue;
        const reviewed = list('decisions').some((x) => (x.affects ?? []).includes(step.from) && (x.affects ?? []).includes(step.to));
        if (!reviewed) {
          add('error', 'BOUNDARY_UNREVIEWED', `${f.id}.steps[${i}]`,
            `${data.sensitivity} data "${data.name}" crosses from ${from} to ${to} and no single decision covers both ${step.from} and ${step.to}`);
        }
      }
    }
    const used = new Set(list('flows').flatMap((f) => f.steps.flatMap((s) => [s.from, s.to])));
    for (const c of list('components')) {
      if (!used.has(c.id) && !['evaluation', 'observability'].includes(c.layer)) {
        add('warning', 'ORPHAN_COMPONENT', c.id, `"${c.name}" appears in no flow`);
      }
    }
  }

  // prototype
  if (active('prototype')) {
    if (list('tests').length === 0) add('error', 'NO_TESTS', 'tests', 'no de-risking tests; a prototype should answer questions, not just look good');
    const tested = new Set(list('tests').flatMap((t) => t.de_risks ?? []));
    for (const k of list('risks')) {
      if (k.status === 'open' && k.likelihood === 'high' && k.impact === 'high' && !tested.has(k.id)) {
        add('error', 'TOP_RISK_UNTESTED', k.id, 'a high-likelihood, high-impact risk has no test');
      }
    }
    for (const t of list('tests')) {
      if ((t.de_risks ?? []).length === 0) add('warning', 'TEST_WITHOUT_PURPOSE', t.id, 'names no risk, assumption or unknown');
      if (t.status === 'failed' && !t.result) add('warning', 'RESULT_MISSING', t.id, 'a failed test should record what happened');
      if (t.status === 'passed' && !t.result) add('warning', 'RESULT_MISSING', t.id, 'a passed test should record the measurement');
    }
    for (const d of list('data_sources')) {
      if (d.permissions !== 'source-acl') continue;
      const tested = list('tests').some((t) => /permission|entitle|two-account|acl|access/i.test(`${t.question} ${t.method}`));
      if (!tested) add('warning', 'PERMISSIONS_UNTESTED', d.id, `"${d.name}" enforces source permissions and no test checks that retrieval respects them; answer-quality tests will not catch a leak`);
    }
    if (!doc.demo) add('error', 'NO_DEMO', 'demo', 'no demo plan');
    else {
      if (doc.demo.beats.length === 0) add('error', 'NO_DEMO', 'demo.beats', 'the demo has no beats');
      for (const [i, beat] of doc.demo.beats.entries()) {
        const where = `demo.beats[${i}]`;
        if (beat.mode !== 'live' && !beat.disclosure) {
          add('error', 'UNDISCLOSED_DEMO', where, `this beat is ${beat.mode}; state what the audience will be told`);
        }
        if (!beat.backed_by) {
          add('error', 'UNBACKED_CLAIM', where, `"${truncate(beat.claim)}" names no test`);
        } else {
          const test = byId.get(beat.backed_by);
          if (test?.status === 'failed') add('error', 'CLAIM_CONTRADICTED', where, `the claim rests on ${beat.backed_by}, which failed`);
          else if (test && test.status !== 'passed') add('warning', 'CLAIM_UNPROVEN', where, `the claim rests on ${beat.backed_by}, which is ${test.status}`);
        }
        if (beat.mode === 'live' && !beat.fallback) add('warning', 'NO_FALLBACK', where, 'a live beat has no fallback');
      }
    }
  }

  // scope
  if (active('scope')) {
    if (list('phases').length === 0) add('error', 'NO_PHASES', 'phases', 'no phases');
    if (!doc.scope) add('error', 'NO_SCOPE', 'scope', 'no scope');
    else {
      if (doc.scope.out.length === 0) add('error', 'NOTHING_OUT_OF_SCOPE', 'scope.out', 'say what is out of scope; an empty list invites scope creep');
      if (!doc.scope.run_cost) add('warning', 'NO_RUN_COST', 'scope.run_cost', 'no running-cost range; inference usually outlasts the build');
      else {
        const age = Math.floor((now - Date.parse(doc.scope.run_cost.as_of)) / DAY);
        if (age > STALE_EVIDENCE_DAYS) add('warning', 'STALE_EVIDENCE', 'scope.run_cost', `running-cost prices are ${age} days old; re-read the vendor pages`);
      }
    }
    if ((list('phases').length > 0) && list('assumptions').length === 0) {
      add('error', 'NO_ASSUMPTIONS', 'assumptions', 'an estimate with no written assumptions cannot be defended');
    }
    for (const h of list('phases')) {
      if (h.exit_criteria.length === 0) add('error', 'NO_GATE', h.id, 'a phase needs exit criteria that decide proceed, pivot, reduce, pause or stop');
      if (h.effort_weeks.low === h.effort_weeks.high) add('error', 'POINT_ESTIMATE', h.id, 'give a range; a single number hides the uncertainty');
      for (const dep of h.depends_on ?? []) {
        const u = byId.get(dep);
        if (u?.status === 'open') add('warning', 'PHASE_ON_OPEN_UNKNOWN', h.id, `depends on open unknown ${dep}: ${truncate(u.question)}`);
        if (u?.status === 'refuted') add('error', 'PHASE_ON_REFUTED', h.id, `depends on refuted assumption ${dep}`);
        if (u?.status === 'failed') add('error', 'PHASE_ON_FAILED_TEST', h.id, `depends on ${dep}, which failed: ${truncate(u.question)}`);
        if (u?.access === 'blocked') add('warning', 'PHASE_ON_BLOCKED_DATA', h.id, `depends on ${dep}, whose access is blocked: ${u.name}`);
      }
    }
    const widths = list('phases').map((h) => (h.effort_weeks.low > 0 ? h.effort_weeks.high / h.effort_weeks.low : 2));
    if (widths.slice(1).some((w) => w < widths[0])) {
      add('warning', 'FALSE_PRECISION', 'phases', 'a later phase has a narrower range than the first; later work is usually less certain');
    }
    const untested = list('assumptions').filter((a) => a.status === 'untested');
    const covered = new Set(list('tests').flatMap((t) => t.de_risks ?? []));
    for (const a of untested) {
      if (!covered.has(a.id)) add('warning', 'ASSUMPTION_UNTESTED', a.id, `no test covers: ${truncate(a.statement)}`);
    }
  }

  // handoff
  if (active('handoff')) {
    if (!doc.handoff) add('error', 'NO_HANDOFF', 'handoff', 'no handoff section');
    else if (doc.handoff.eval_kit.length === 0) {
      add('error', 'NO_EVAL_KIT', 'handoff.eval_kit', 'delivery needs the test set, judge and data viewer, not just a slide');
    }
    for (const u of list('unknowns')) {
      if (u.status === 'open' && !u.owner) add('error', 'OPEN_WITHOUT_OWNER', u.id, 'an open unknown handed to delivery needs an owner');
    }
  }

  return findings;
}

const PLACEHOLDER = /\[[A-Za-z0-9%$ ,_-]{1,24}\]|\b(TBD|TODO|TKTK|FIXME)\b|\b(lorem ipsum)\b/;
const NOT_A_VALUE = /^(tbd|todo|unknown|n\/?a|none|\?+|-+)$/i;

function allStrings(value, where = '', found = []) {
  if (typeof value === 'string') found.push({ where, text: value });
  else if (Array.isArray(value)) value.forEach((v, i) => allStrings(v, `${where}[${i}]`, found));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (k !== 'id' && k !== 'schema') allStrings(v, where ? `${where}.${k}` : k, found);
    }
  }
  return found;
}

function mentions(record, id) {
  const pattern = new RegExp(`\\b${id}\\b`);
  return Object.values(record).some((v) => (typeof v === 'string' ? pattern.test(v) : Array.isArray(v) && v.includes(id)));
}

function truncate(text, length = 70) {
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}
