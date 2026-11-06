import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { emptyEngagement, validateStructure } from '../scripts/lib/model.mjs';
import { evaluate } from '../scripts/lib/rules.mjs';
import { renderAll, renderDeck } from '../scripts/lib/render.mjs';
import { architectureSvg } from '../scripts/lib/svg.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const examplePath = join(here, '..', 'examples', 'claims-triage.engagement.json');
const cli = join(here, '..', 'scripts', 'sa.mjs');
const load = () => JSON.parse(readFileSync(examplePath, 'utf8'));
const TODAY = '2026-11-06';
const temp = mkdtempSync(join(tmpdir(), 'agent-sa-'));
after(() => rmSync(temp, { recursive: true, force: true }));

const codes = (findings, level) => findings.filter((f) => !level || f.level === level).map((f) => f.code);
const rule = (mutate, options = {}) => {
  const doc = load();
  mutate(doc);
  assert.deepEqual(validateStructure(doc), [], 'mutation should keep the structure valid');
  return evaluate(doc, { today: TODAY, ...options });
};

test('the shipped example is structurally valid and has no judgment errors', () => {
  const doc = load();
  assert.deepEqual(validateStructure(doc), []);
  assert.deepEqual(codes(evaluate(doc, { today: TODAY }), 'error'), []);
});

test('structure: a misspelled field, a bad enum and a dangling reference are all caught', () => {
  const doc = load();
  doc.metrics[0].baselin = 'typo';
  doc.risks[0].impact = 'huge';
  doc.components[0].zone = 'Z9';
  const found = validateStructure(doc);
  assert.ok(found.some((f) => f.code === 'UNKNOWN_FIELD' && f.where === 'M1.baselin'));
  assert.ok(found.some((f) => f.code === 'SCHEMA' && f.where === 'K1.impact'));
  assert.ok(found.some((f) => f.code === 'DANGLING' && f.where === 'C1.zone'));
});

test('structure: duplicate ids, wrong prefixes and an unknown section are caught', () => {
  const doc = load();
  doc.risks.push({ ...doc.risks[0] });
  doc.tests[0].de_risks = ['C1'];
  doc.rissks = [];
  const found = validateStructure(doc);
  assert.ok(found.some((f) => f.code === 'DUPLICATE_ID' && f.where === 'K1'));
  assert.ok(found.some((f) => f.where === 'T1.de_risks[0]'));
  assert.ok(found.some((f) => f.code === 'UNKNOWN_FIELD' && f.where === 'rissks'));
});

test('structure: an inverted effort range is rejected', () => {
  const doc = load();
  doc.phases[0].effort_weeks = { low: 9, high: 3 };
  assert.ok(validateStructure(doc).some((f) => f.where === 'H1.effort_weeks'));
});

const judgment = [
  ['NO_SPONSOR', 'error', (d) => { d.stakeholders[0].authority = 'other'; }],
  ['DATA_NOT_SAMPLED', 'warning', (d) => { d.data_sources[0].sampled = false; }],
  ['ACCESS_UNTRACKED', 'warning', (d) => { d.data_sources[1].access = 'blocked'; }],
  ['PERMISSIONS_UNKNOWN', 'warning', (d) => { d.data_sources[0].permissions = 'unknown'; }],
  ['NO_BASELINE', 'error', (d) => { delete d.metrics[0].baseline; delete d.metrics[0].baseline_source; }],
  ['NO_KILL_CRITERIA', 'error', (d) => { d.value.kill_criteria = []; }],
  ['NO_SIMPLER_OPTION', 'error', (d) => { d.qualification.rejected = []; }],
  ['AGENT_UNJUSTIFIED', 'warning', (d) => { d.qualification.approach = 'agent'; d.qualification.rejected = [{ approach: 'Vendor add-on', why: 'Wrong scope' }]; }],
  ['UNMET_MUST', 'error', (d) => { d.components.forEach((c) => { c.satisfies = (c.satisfies ?? []).filter((r) => r !== 'R5'); }); }],
  ['NO_EVAL', 'error', (d) => { d.components = d.components.filter((c) => c.layer !== 'evaluation'); }],
  ['NO_ALTERNATIVES', 'error', (d) => { d.decisions[0].alternatives = []; }],
  ['STALE_EVIDENCE', 'warning', (d) => { d.decisions[0].evidence[0].as_of = '2026-01-01'; }],
  ['BOUNDARY_UNREVIEWED', 'error', (d) => { d.decisions[0].affects = ['C6']; }],
  ['CROSSING_WITHOUT_DATA', 'warning', (d) => { delete d.flows[0].steps[2].data; }],
  ['PERMISSIONS_UNTESTED', 'warning', (d) => { d.data_sources[0].permissions = 'source-acl'; d.tests = d.tests.map((t) => ({ ...t, question: 'Does it work?', method: 'Run it.' })); }],
  ['TOP_RISK_UNTESTED', 'error', (d) => { d.tests.forEach((t) => { t.de_risks = t.de_risks.filter((r) => r !== 'K1'); }); }],
  ['UNDISCLOSED_DEMO', 'error', (d) => { delete d.demo.beats[0].disclosure; }],
  ['UNBACKED_CLAIM', 'error', (d) => { delete d.demo.beats[0].backed_by; }],
  ['CLAIM_CONTRADICTED', 'error', (d) => { d.tests[0].status = 'failed'; }],
  ['CLAIM_UNPROVEN', 'warning', (d) => { d.tests[0].status = 'planned'; delete d.tests[0].result; }],
  ['NOTHING_OUT_OF_SCOPE', 'error', (d) => { d.scope.out = []; }],
  ['NO_GATE', 'error', (d) => { d.phases[0].exit_criteria = []; }],
  ['POINT_ESTIMATE', 'error', (d) => { d.phases[0].effort_weeks = { low: 4, high: 4 }; }],
  ['FALSE_PRECISION', 'warning', (d) => { d.phases[2].effort_weeks = { low: 10, high: 11 }; }],
  ['PHASE_ON_REFUTED', 'error', (d) => { d.assumptions[0].status = 'refuted'; }],
  ['NO_EVAL_KIT', 'error', (d) => { d.handoff.eval_kit = []; }],
  ['OPEN_WITHOUT_OWNER', 'error', (d) => { delete d.unknowns[0].owner; }],
];
for (const [code, level, mutate] of judgment) {
  test(`rule ${code} fires as ${level}`, () => {
    assert.ok(codes(rule(mutate), level).includes(code), `expected ${level} ${code}`);
  });
}

test('a placeholder baseline counts as no baseline, and bracket text anywhere is an error', () => {
  const tbd = rule((d) => { d.metrics[0].baseline = 'TBD'; });
  assert.ok(codes(tbd, 'error').includes('NO_BASELINE'));
  assert.ok(codes(tbd, 'error').includes('PLACEHOLDER_TEXT'));
  const bracket = rule((d) => { d.need.pain_points[0] = 'Costs us [X%] of revenue'; });
  assert.ok(codes(bracket, 'error').includes('PLACEHOLDER_TEXT'));
});

test('a phase depending on a failed test is an error; on blocked data, a warning', () => {
  const failed = rule((d) => { d.tests[0].status = 'failed'; d.tests[0].result = 'Below floor.'; });
  assert.ok(codes(failed, 'error').includes('PHASE_ON_FAILED_TEST'));
  const blocked = rule((d) => { d.data_sources[0].access = 'blocked'; });
  assert.ok(codes(blocked, 'warning').includes('PHASE_ON_BLOCKED_DATA'));
});

test('a stale running-cost date is reported', () => {
  const stale = rule((d) => { d.scope.run_cost.as_of = '2026-01-01'; });
  assert.ok(stale.some((f) => f.code === 'STALE_EVIDENCE' && f.where === 'scope.run_cost'));
});

test('a narrow middle phase is false precision, and a word containing "rag" does not justify an agent', () => {
  const narrow = rule((d) => { d.phases[1].effort_weeks = { low: 10, high: 11 }; });
  assert.ok(codes(narrow, 'warning').includes('FALSE_PRECISION'));
  const storage = rule((d) => { d.qualification.approach = 'agent'; d.qualification.rejected = [{ approach: 'Storage upgrade', why: 'Irrelevant' }]; });
  assert.ok(codes(storage, 'warning').includes('AGENT_UNJUSTIFIED'));
});

test('a rules approach needs no simpler rejected option', () => {
  const rules = rule((d) => { d.qualification.approach = 'rules'; d.qualification.rejected = []; });
  assert.ok(!codes(rules).includes('NO_SIMPLER_OPTION'));
});

test('the estimate keeps gate history and names the effort unit; run cost can list drivers without a price', () => {
  const doc = load();
  doc.scope.effort_unit = 'person-weeks';
  doc.phases[0].gate_log = [{ date: '2026-11-01', decision: 'pivot', note: 'Scans were worse than sampled.', previous_low: 2, previous_high: 4 }];
  delete doc.scope.run_cost.range;
  assert.deepEqual(validateStructure(doc), []);
  const { files } = renderAll(doc);
  const text = files.get('estimate.md');
  assert.match(text, /15 to 33 person-weeks/);
  assert.match(text, /Gate history/);
  assert.match(text, /2 to 4/);
  assert.match(text, /Drivers only; no price range yet/);
  assert.match(files.get('deck-P1-executive.html'), /prices not yet confirmed/);
});

test('cli: compare lays candidates side by side and needs at least two', () => {
  const other = join(temp, 'other.json');
  const doc = load();
  doc.engagement.name = 'Second use case';
  doc.value.value_if_successful = 'very-high';
  writeFileSync(other, JSON.stringify(doc));
  const text = execFileSync('node', [cli, 'compare', examplePath, other]).toString();
  assert.match(text, /Property claims triage assistant \| high/);
  assert.match(text, /Second use case \| very-high/);
  assert.equal(spawnSync('node', [cli, 'compare', examplePath]).status, 2);
});

test('--only-stage checks one stage alone, so a provisional scope is not forced to invent earlier sections', () => {
  const doc = load();
  doc.stakeholders[0].authority = 'other';
  assert.ok(codes(evaluate(doc, { stage: 'scope', today: TODAY }), 'error').includes('NO_SPONSOR'));
  assert.deepEqual(codes(evaluate(doc, { stage: 'scope', only: true, today: TODAY }), 'error'), []);
});

test('an unfinished file renders as a draft, and the handoff does not claim what the customer was told', () => {
  const doc = load();
  const clean = renderAll(doc);
  assert.doesNotMatch(clean.files.get('handoff.md'), /Draft/);
  assert.match(clean.files.get('handoff.md'), /What the customer was told/);
  assert.doesNotMatch(clean.files.get('deck-P1-executive.html'), /class="draft"/);
  const draft = renderAll(doc, { draft: { stage: 'architect', errors: 3 } });
  assert.match(draft.files.get('handoff.md'), /Proposed commitments, not yet made/);
  assert.doesNotMatch(draft.files.get('handoff.md'), /What the customer was told/);
  assert.match(draft.files.get('estimate.md'), /^> \*\*Draft\.\*\* The architect stage has 3 open errors/);
  assert.match(draft.files.get('deck-P1-executive.html'), /DRAFT: the architect stage is not complete/);
});

test('estimate phase headings carry the unit', () => {
  const doc = load();
  doc.scope.effort_unit = 'person-weeks';
  const text = renderAll(doc).files.get('estimate.md');
  assert.match(text, /### H1\. Prove the risky parts \(3 to 5 person-weeks\)/);
  assert.doesNotMatch(text, /section \d of the spec/);
});

test('the template text from init does not pass as a real need', () => {
  const doc = emptyEngagement({ name: 'T', customer: 'C', updated: TODAY });
  assert.ok(codes(evaluate(doc, { stage: 'discover', today: TODAY }), 'error').includes('PLACEHOLDER_NEED'));
});

test('a risk marked internal stays out of the deck but stays in the spec', () => {
  const doc = load();
  doc.risks[0].internal = true;
  const { files } = renderAll(doc);
  assert.doesNotMatch(files.get('deck-P1-executive.html'), /Low-contrast scans cause/);
  assert.match(files.get('spec.md'), /Low-contrast scans cause/);
});

test('a decision can state its consequences', () => {
  assert.match(renderAll(load()).files.get('spec.md'), /\*\*Consequences:\*\* Regional capacity/);
});

test('printing lets long slides flow instead of cutting them off', () => {
  const html = renderDeck(load());
  const print = html.slice(html.indexOf('@media print'));
  assert.doesNotMatch(print.slice(0, print.indexOf('</style>')), /overflow:hidden/);
});

test('cli: render --only writes just the matching files', () => {
  const out = join(temp, 'only');
  execFileSync('node', [cli, 'render', examplePath, '--out', out, '--only', 'questions', '--today', TODAY]);
  assert.deepEqual(readdirSync(out), ['questions.md']);
  assert.equal(spawnSync('node', [cli, 'render', examplePath, '--out', out, '--only', 'nothing']).status, 2);
});

test('a tracked missing baseline is a warning, an untracked one is an error', () => {
  assert.ok(codes(evaluate(load(), { today: TODAY }), 'warning').includes('NO_BASELINE'), 'U1 names M2');
  const untracked = rule((d) => { delete d.unknowns[0].about; });
  assert.ok(codes(untracked, 'error').includes('NO_BASELINE'));
});

test('rules stay silent until their stage', () => {
  const doc = load();
  delete doc.demo;
  delete doc.phases;
  delete doc.scope;
  delete doc.handoff;
  doc.audiences = [];
  assert.equal(codes(evaluate(doc, { stage: 'architect', today: TODAY }), 'error').length, 0);
  assert.ok(codes(evaluate(doc, { stage: 'prototype', today: TODAY }), 'error').includes('NO_DEMO'));
  assert.ok(codes(evaluate(doc, { stage: 'scope', today: TODAY }), 'error').includes('NO_PHASES'));
});

test('render produces every deliverable and is deterministic', () => {
  const a = renderAll(load());
  const b = renderAll(load());
  assert.deepEqual([...a.files.keys()], [...b.files.keys()]);
  for (const [path, content] of a.files) assert.equal(content, b.files.get(path), path);
  for (const path of ['spec.md', 'questions.md', 'estimate.md', 'prototype.md', 'handoff.md', 'diagrams/architecture.svg', 'diagrams/architecture.mmd', 'diagrams/flow-F1.svg', 'diagrams/flow-F1.mmd', 'diagrams/roadmap.svg', 'deck-P1-executive.html', 'deck-P2-technical.html']) {
    assert.ok(a.files.has(path), `missing ${path}`);
  }
  assert.deepEqual(a.skipped, []);
});

test('the deck is self-contained: it loads nothing from the network', () => {
  const doc = load();
  const html = renderDeck(doc, doc.audiences[0]);
  assert.doesNotMatch(html, /<script[^>]+src=|<link(?! rel="icon" href="data:,")|@import|url\(http/);
  assert.match(html, /<svg/);
});

test('the deck never invents a number: a missing baseline reads as not yet measured', () => {
  const doc = load();
  const html = renderDeck(doc, doc.audiences[1]);
  assert.match(html, /not yet measured/);
  assert.doesNotMatch(html.replace(/<script>[\s\S]*<\/script>/, ''), /\[[A-Za-z%]{1,12}\]/, 'no bracket placeholders');
});

test('audience depth changes the deck: flows appear only for the technical audience', () => {
  const doc = load();
  assert.doesNotMatch(renderDeck(doc, doc.audiences[0]), /Flow: New claim/);
  assert.match(renderDeck(doc, doc.audiences[1]), /Flow: New claim/);
});

test('changing one fact in the file changes every deliverable that shows it', () => {
  const doc = load();
  doc.metrics[0].baseline = '13 minutes';
  const { files } = renderAll(doc);
  assert.match(files.get('spec.md'), /13 minutes/);
  assert.match(files.get('deck-P1-executive.html'), /<td>13 minutes<\/td>/);
  assert.doesNotMatch(files.get('deck-P1-executive.html'), /<td>11 minutes<\/td>/);
});

test('hostile text is escaped in SVG and HTML', () => {
  const doc = load();
  doc.components[0].name = '<script>alert(1)</script>';
  doc.need.statement = '<img src=x onerror=alert(1)>';
  assert.doesNotMatch(architectureSvg(doc), /<script>alert/);
  assert.doesNotMatch(renderDeck(doc), /<img src=x/);
});

const crowded = () => {
  const doc = load();
  for (let i = 0; i < 9; i += 1) {
    doc.components.push({ id: `C${20 + i}`, name: `Service ${i}`, kind: 'service', layer: 'orchestration', zone: 'Z1', satisfies: ['R1'] });
    doc.flows[0].steps.push({ from: 'C4', to: `C${20 + i}`, label: `Call service ${i}` });
  }
  return doc;
};
const viewBox = (svg) => svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/).slice(1).map(Number);

test('a crowded design stays landscape, so it fits a slide', () => {
  const [width, height] = viewBox(architectureSvg(crowded()));
  assert.ok(width > height, `${width} by ${height}`);
});

test('the executive deck summarises a crowded design and the technical deck does not', () => {
  const doc = crowded();
  assert.doesNotMatch(renderDeck(doc, doc.audiences[0]), />Service 3</);
  assert.match(renderDeck(doc, doc.audiences[0]), /components</);
  assert.match(renderDeck(doc, doc.audiences[1]), />Service 3</);
});

test('two steps on one path both stay in the legend', () => {
  const doc = load();
  doc.flows[0].steps.push({ from: 'C1', to: 'C3', label: 'Verify and decide' });
  const svg = architectureSvg(doc);
  assert.match(svg, /Confirm or change severity; Verify and decide/);
});

test('each diagram in a deck has its own arrow markers, because hidden slides do not draw shared ones', () => {
  const doc = load();
  doc.flows.push({ id: 'F2', name: 'Second flow', steps: [{ from: 'C1', to: 'C3', label: 'Open' }] });
  const html = renderDeck(doc, doc.audiences[1]);
  const ids = [...html.matchAll(/<marker id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, 'marker ids must be unique');
  assert.match(html, /url\(#seq-F2\)/);
});

test('the executive deck shows every metric kind and all rejected options up to five', () => {
  const doc = load();
  const html = renderDeck(doc, doc.audiences[0]);
  assert.match(html, /Severity agreement with senior adjusters/);
  assert.match(html, /Agent with tool choice/);
});

test('cli: check defaults to the stage the file has reached, and render marks a draft only up to it', () => {
  const full = load();
  const early = { schema: full.schema, engagement: full.engagement, need: full.need, stakeholders: full.stakeholders, data_sources: full.data_sources, unknowns: full.unknowns.map(({ about, ...u }) => u) };
  const file = join(temp, 'early.json');
  writeFileSync(file, JSON.stringify(early));
  const result = spawnSync('node', [cli, 'check', file, '--today', TODAY]);
  assert.equal(result.status, 0);
  assert.match(result.stdout.toString(), /^discover: 0 errors/m);
  const out = join(temp, 'early-out');
  const rendered = execFileSync('node', [cli, 'render', file, '--out', out, '--today', TODAY]).toString();
  assert.doesNotMatch(rendered, /marked as drafts/);
  assert.doesNotMatch(readFileSync(join(out, 'questions.md'), 'utf8'), /Draft/);
});

test('an unknown can track a metric or data source through about, keeping ids out of its text', () => {
  const doc = load();
  assert.doesNotMatch(doc.unknowns[0].question, /\bM2\b/);
  const found = evaluate(doc, { today: TODAY }).find((f) => f.code === 'NO_BASELINE');
  assert.equal(found.level, 'warning');
  const html = renderDeck(doc, doc.audiences[0]);
  const bodies = html.replace(/<style>[\s\S]*?<\/style>/, '').replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<div class="foot">.*?<\/div>/gs, '');
  assert.doesNotMatch(bodies, /\b[MDUX]\d\b/, 'no record ids in the slide bodies');
});

test('sensitive data arriving from the public internet needs no boundary decision', () => {
  const doc = load();
  doc.zones.push({ id: 'Z3', name: 'Internet', kind: 'public' });
  doc.components.push({ id: 'C9', name: 'Policyholder portal', kind: 'external-system', layer: 'external', zone: 'Z3' });
  doc.flows[0].steps.push({ from: 'C9', to: 'C2', label: 'Submit claim', data: 'D1' });
  assert.deepEqual(validateStructure(doc), []);
  assert.ok(!evaluate(doc, { today: TODAY }).some((f) => f.code === 'BOUNDARY_UNREVIEWED' && f.where.includes('steps[7]')));
});

test('the deck leads with open questions the audience owns and says when more exist', () => {
  const doc = load();
  for (let i = 0; i < 6; i += 1) doc.unknowns.unshift({ id: `U${30 + i}`, question: `Other question ${i}?`, why: 'Reason.', owner: 'P2', status: 'open' });
  const html = renderDeck(doc, doc.audiences[0]);
  const section = html.slice(html.indexOf('Open questions'));
  assert.ok(section.indexOf('re-triage today') >= 0 && section.indexOf('re-triage today') < section.indexOf('Other question'), 'the sponsor owns the re-triage question');
  assert.match(html, /And \d more in the spec/);
});

test('the test slide leads with results, caps its length and hides replaced runs', () => {
  const doc = load();
  for (let i = 0; i < 10; i += 1) {
    doc.tests.push({ id: `T${40 + i}`, question: `Later question ${i}?`, de_risks: ['K2'], method: 'Run it.', pass_if: 'It works.', on_fail: 'Stop.', timebox_days: 1, status: 'planned' });
  }
  doc.tests.push({ id: 'T60', question: 'Harness bug run?', de_risks: ['K2'], method: 'Run it.', pass_if: 'It works.', on_fail: 'Stop.', timebox_days: 1, status: 'failed', result: 'The check itself was wrong.' });
  doc.tests.push({ id: 'T61', question: 'Corrected run?', de_risks: ['K2'], method: 'Run it.', pass_if: 'It works.', on_fail: 'Stop.', timebox_days: 1, status: 'passed', result: 'Passed.', supersedes: ['T60'] });
  assert.deepEqual(validateStructure(doc), []);
  const { files } = renderAll(doc);
  const html = files.get('deck-P1-executive.html');
  assert.match(html, /Corrected run\?/);
  assert.doesNotMatch(html, /Harness bug run\?/);
  assert.match(html, /not listed are in the prototype plan/);
  assert.doesNotMatch(html, /Later question 9/);
  assert.match(files.get('prototype.md'), /Harness bug run\?/);
  assert.match(files.get('prototype.md'), /Replaced by a later run/);
});

test('sensitive paths are drawn in the alert colour and explained', () => {
  assert.match(architectureSvg(load()), /Red paths carry/);
});

test('the estimate states its basis, ranges and gates, with no single base figure', () => {
  const text = renderAll(load()).files.get('estimate.md');
  assert.match(text, /Estimate basis: measured-prototype/);
  assert.match(text, /15 to 33 weeks/);
  assert.match(text, /proceed, pivot, reduce scope, pause or stop/);
  assert.match(text, /Statement of work outline/);
});

test('the estimate says to commit to the first phase only, and keeps one-time cost apart', () => {
  const doc = load();
  doc.scope.run_cost.one_time = 'About 9,000 USD for the first indexing run.';
  assert.deepEqual(validateStructure(doc), []);
  const text = renderAll(doc).files.get('estimate.md');
  assert.match(text, /Commit to the first phase only: \*\*Prove the risky parts, 3 to 5 weeks\*\*/);
  assert.match(text, /\*\*One-time cost:\*\* About 9,000 USD/);
});

test('a judgment-based estimate says so in plain words', () => {
  const doc = load();
  doc.scope.estimate_basis = 'judgment';
  assert.match(renderAll(doc).files.get('estimate.md'), /expert judgment/);
});

test('a partial file renders what it can and reports what it skipped', () => {
  const full = load();
  const doc = { schema: full.schema, engagement: full.engagement, need: full.need, stakeholders: full.stakeholders, data_sources: full.data_sources, unknowns: full.unknowns.map(({ about, ...u }) => u) };
  assert.deepEqual(validateStructure(doc), []);
  const { files, skipped } = renderAll(doc);
  assert.ok(files.has('questions.md'));
  assert.ok(files.has('deck.html'));
  assert.ok(skipped.some((s) => s.path === 'estimate.md'));
  assert.ok(skipped.some((s) => s.path === 'diagrams/'));
});

test('cli: init, check exit codes, status and render work end to end', () => {
  const file = join(temp, 'new', 'x.engagement.json');
  execFileSync('node', [cli, 'init', file, '--name', 'Test', '--customer', 'Acme', '--date', TODAY]);
  assert.ok(existsSync(file));
  assert.equal(spawnSync('node', [cli, 'init', file, '--name', 'T', '--customer', 'A']).status, 2, 'refuses to overwrite');
  assert.equal(spawnSync('node', [cli, 'check', file, '--stage', 'discover']).status, 1, 'blank discovery has errors');
  assert.equal(spawnSync('node', [cli, 'check', examplePath, '--today', TODAY]).status, 0);
  assert.equal(spawnSync('node', [cli, 'check', examplePath, '--today', TODAY, '--strict']).status, 1, 'the example carries honest warnings');
  assert.equal(spawnSync('node', [cli, 'check', examplePath, '--stage', 'nonsense']).status, 2);
  assert.equal(spawnSync('node', [cli, 'bogus']).status, 2);
  const json = JSON.parse(execFileSync('node', [cli, 'check', examplePath, '--json', '--today', TODAY]).toString());
  assert.equal(json.errors, 0);
  const status = execFileSync('node', [cli, 'status', examplePath, '--today', TODAY]).toString();
  assert.match(status, /ready\s+handoff/);
  const out = join(temp, 'out');
  execFileSync('node', [cli, 'render', examplePath, '--out', out, '--today', TODAY]);
  assert.ok(existsSync(join(out, 'diagrams', 'architecture.svg')));
  assert.ok(readdirSync(out).includes('deck-P1-executive.html'));
});

test('cli: render refuses a structurally broken file and writes nothing', () => {
  const broken = join(temp, 'broken.json');
  const doc = load();
  doc.components[0].zone = 'Z9';
  writeFileSync(broken, JSON.stringify(doc));
  const out = join(temp, 'out-broken');
  const result = spawnSync('node', [cli, 'render', broken, '--out', out]);
  assert.equal(result.status, 1);
  assert.equal(existsSync(out), false);
});

test('cli: a file saved with a byte-order mark still parses', () => {
  const file = join(temp, 'bom.json');
  writeFileSync(file, `\uFEFF${readFileSync(examplePath, 'utf8')}`);
  assert.equal(spawnSync('node', [cli, 'check', file, '--today', TODAY]).status, 0);
});

test('cli: invalid JSON is a clean failure, not a stack trace', () => {
  const bad = join(temp, 'bad.json');
  writeFileSync(bad, '{not json');
  const result = spawnSync('node', [cli, 'check', bad]);
  assert.equal(result.status, 1);
  assert.match(result.stderr.toString(), /not valid JSON/);
  assert.doesNotMatch(result.stderr.toString(), /at .*\.mjs/);
});

test('cli: schema prints the whole format or one section, and rejects an unknown section', () => {
  const all = execFileSync('node', [cli, 'schema']).toString();
  for (const section of ['stakeholders', 'data_sources', 'metrics', 'decisions', 'phases', 'demo', 'handoff', 'audiences']) assert.match(all, new RegExp(`^${section} \\(`, 'm'));
  const one = execFileSync('node', [cli, 'schema', 'risks']).toString();
  assert.match(one, /likelihood: one of low \| medium \| high/);
  assert.doesNotMatch(one, /stakeholders/);
  assert.equal(spawnSync('node', [cli, 'schema', 'nope']).status, 2);
});

test('cli: the example command prints the shipped example', () => {
  assert.deepEqual(JSON.parse(execFileSync('node', [cli, 'example']).toString()), load());
});
