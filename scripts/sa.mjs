#!/usr/bin/env node
// agent-sa command line: create, check and render an engagement file. No dependencies.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STAGES, currentStage, describeSchema, emptyEngagement, validateStructure } from './lib/model.mjs';
import { evaluate } from './lib/rules.mjs';
import { renderAll } from './lib/render.mjs';

const USAGE = `usage:
  sa.mjs init <file> --name "<engagement>" --customer "<customer>" [--date YYYY-MM-DD]
  sa.mjs check <file> [--stage ${STAGES.join('|')}] [--only-stage] [--json] [--strict] [--today YYYY-MM-DD]
  sa.mjs status <file> [--today YYYY-MM-DD]
  sa.mjs render <file> --out <dir> [--only <path-prefix>] [--today YYYY-MM-DD]
  sa.mjs compare <file> <file>...
  sa.mjs schema [section]
  sa.mjs example

check exits 0 when there are no errors, 1 when there are (with --strict, warnings count too), 2 on bad usage.
render refuses a file with structural errors and reports judgment findings without blocking.`;

function parse(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) flags[key] = true;
      else {
        flags[key] = next;
        i += 1;
      }
    } else positional.push(arg);
  }
  return { positional, flags };
}

function fail(message, code = 2) {
  process.stderr.write(`${message}\n`);
  process.exit(code);
}

function load(file) {
  if (!file) fail(USAGE);
  const path = resolve(file);
  if (!existsSync(path)) fail(`no such file: ${path}`);
  try {
    return JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
  } catch (error) {
    return fail(`${path} is not valid JSON: ${error.message}`, 1);
  }
}

function checkToday(flags) {
  if (flags.today && !/^\d{4}-\d{2}-\d{2}$/.test(flags.today)) fail('--today must be YYYY-MM-DD');
  return flags.today;
}

function printFindings(findings) {
  for (const f of findings) process.stdout.write(`${f.level === 'error' ? 'ERROR' : 'warn '} ${f.code} ${f.where}: ${f.message}\n`);
}

function cmdInit({ positional, flags }) {
  const file = positional[1];
  if (!file || typeof flags.name !== 'string' || typeof flags.customer !== 'string') fail(USAGE);
  const path = resolve(file);
  if (existsSync(path)) fail(`refusing to overwrite ${path}`);
  const updated = typeof flags.date === 'string' ? flags.date : new Date().toISOString().slice(0, 10);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(emptyEngagement({ name: flags.name, customer: flags.customer, updated }), null, 2)}\n`);
  process.stdout.write(`created ${path}\n`);
}

function cmdCheck({ positional, flags }) {
  if (flags.stage !== undefined && !STAGES.includes(flags.stage)) fail(`--stage must be one of: ${STAGES.join(', ')}`);
  const today = checkToday(flags);
  const doc = load(positional[1]);
  const structural = validateStructure(doc);
  const stage = flags.stage ?? (structural.length ? 'discover' : currentStage(doc));
  const findings = structural.length ? structural : evaluate(doc, { stage, today, only: Boolean(flags['only-stage']) });
  const errors = findings.filter((f) => f.level === 'error').length;
  const warnings = findings.length - errors;
  if (flags.json) {
    process.stdout.write(`${JSON.stringify({ stage, errors, warnings, findings }, null, 2)}\n`);
  } else {
    printFindings(findings);
    process.stdout.write(`${stage}: ${errors} errors, ${warnings} warnings\n`);
  }
  process.exit(errors > 0 || (flags.strict && warnings > 0) ? 1 : 0);
}

function cmdStatus({ positional, flags }) {
  const today = checkToday(flags);
  const doc = load(positional[1]);
  const structural = validateStructure(doc);
  if (structural.length) {
    printFindings(structural);
    process.stdout.write('fix the structural errors first\n');
    process.exit(1);
  }
  let next;
  for (const stage of STAGES) {
    const errors = evaluate(doc, { stage, today }).filter((f) => f.level === 'error');
    process.stdout.write(`${errors.length === 0 ? 'ready  ' : 'blocked'} ${stage}${errors.length ? ` (${errors.length} errors)` : ''}\n`);
    if (errors.length && !next) next = { stage, errors };
  }
  if (next) {
    process.stdout.write(`\nnext: clear ${next.stage}\n`);
    printFindings(next.errors);
  } else {
    process.stdout.write('\nall stages clear\n');
  }
}

function cmdRender({ positional, flags }) {
  if (typeof flags.out !== 'string') fail(USAGE);
  const today = checkToday(flags);
  const doc = load(positional[1]);
  const structural = validateStructure(doc);
  if (structural.length) {
    printFindings(structural);
    process.stdout.write('not rendered: fix the structural errors first\n');
    process.exit(1);
  }
  let draft;
  for (const stage of STAGES.slice(0, STAGES.indexOf(currentStage(doc)) + 1)) {
    const errors = evaluate(doc, { stage, today }).filter((f) => f.level === 'error');
    if (errors.length) {
      draft = { stage, errors: errors.length };
      break;
    }
  }
  const { files, skipped } = renderAll(doc, { draft });
  const out = resolve(flags.out);
  const only = typeof flags.only === 'string' ? flags.only : '';
  const chosen = [...files].filter(([path]) => path.startsWith(only));
  if (chosen.length === 0) fail(`nothing to render matches --only ${only}. Available: ${[...files.keys()].join(', ')}`);
  for (const [path, content] of chosen) {
    const target = join(out, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
    process.stdout.write(`wrote ${target}\n`);
  }
  for (const s of skipped) process.stdout.write(`skipped ${s.path}: ${s.why}\n`);
  if (draft) process.stdout.write(`note: the ${draft.stage} stage has ${draft.errors} errors, so these files are marked as drafts\n`);
}

// One row per candidate use case, so a portfolio can be read side by side.
function cmdCompare({ positional }) {
  const files = positional.slice(1);
  if (files.length < 2) fail(USAGE);
  const lines = ['| Use case | Value if successful | Likelihood | Investment | Approach | Open unknowns | Kill criteria |', '| --- | --- | --- | --- | --- | --- | --- |'];
  for (const file of files) {
    const doc = load(file);
    const structural = validateStructure(doc);
    if (structural.length) {
      printFindings(structural);
      fail(`${file} has structural errors`, 1);
    }
    const open = (doc.unknowns ?? []).filter((u) => u.status === 'open').length;
    lines.push(`| ${doc.engagement.name} | ${doc.value?.value_if_successful ?? 'not rated'} | ${doc.value?.likelihood ?? 'not rated'} | ${doc.value?.investment ?? 'not rated'} | ${doc.qualification?.approach ?? 'not qualified'} | ${open} | ${doc.value?.kill_criteria.length ?? 0} |`);
  }
  process.stdout.write(`${lines.join('\n')}\n`);
}

function cmdSchema({ positional }) {
  const text = describeSchema(positional[1]);
  if (text === null) fail(`no section named "${positional[1]}". Run: sa.mjs schema`);
  process.stdout.write(`${text.trimEnd()}\n`);
}

function cmdExample() {
  const here = dirname(fileURLToPath(import.meta.url));
  process.stdout.write(readFileSync(join(here, '..', 'examples', 'claims-triage.engagement.json'), 'utf8'));
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  process.stdout.write(`${USAGE}\n`);
  process.exit(0);
}
const args = parse(process.argv.slice(2));
const commands = { init: cmdInit, check: cmdCheck, status: cmdStatus, render: cmdRender, compare: cmdCompare, schema: cmdSchema, example: cmdExample };
const command = commands[args.positional[0]];
if (!command) fail(USAGE);
command(args);
