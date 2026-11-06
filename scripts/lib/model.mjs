// The engagement file format and its structural validation.
// One JSON file is the single source of truth; every deliverable is generated from it.

export const SCHEMA = 'agent-sa/engagement@1';
export const STAGES = ['discover', 'frame', 'architect', 'prototype', 'scope', 'handoff'];

const LMH = ['low', 'medium', 'high'];
const RATING = ['low', 'medium', 'high', 'very-high'];

const str = { type: 'string' };
const optStr = { type: 'string', optional: true };
const strList = { type: 'strings' };
const optStrList = { type: 'strings', optional: true };
const en = (values, optional = false) => ({ type: 'enum', values, optional });
const ref = (...prefixes) => ({ type: 'ref', prefixes });
const optRef = (...prefixes) => ({ type: 'ref', prefixes, optional: true });
const refs = (...prefixes) => ({ type: 'refs', prefixes, optional: true });

// Collections hold records with a stable id. The prefix makes a reference self-describing.
export const COLLECTIONS = {
  stakeholders: {
    prefix: 'P',
    fields: {
      role: str,
      authority: en(['sponsor', 'decision-maker', 'data-owner', 'security', 'compliance', 'it-owner', 'end-user', 'procurement', 'other']),
      name: optStr,
      cares_about: optStr,
    },
  },
  data_sources: {
    prefix: 'D',
    fields: {
      name: str,
      system: str,
      format: str,
      volume: optStr,
      access: en(['approved', 'requested', 'blocked', 'unknown']),
      owner: optRef('P'),
      sensitivity: en(['public', 'internal', 'confidential', 'regulated', 'unknown']),
      permissions: en(['none-needed', 'source-acl', 'app-level', 'unknown']),
      sampled: { type: 'boolean' },
      notes: optStr,
    },
  },
  unknowns: {
    prefix: 'U',
    fields: {
      question: str,
      why: str,
      owner: optRef('P'),
      status: en(['open', 'answered', 'assumed']),
      about: refs('M', 'D', 'R', 'C', 'K'),
      answer: optStr,
    },
  },
  assumptions: {
    prefix: 'A',
    fields: {
      statement: str,
      source: en(['customer-stated', 'observed', 'inferred', 'benchmark']),
      if_wrong: str,
      status: en(['untested', 'confirmed', 'refuted']),
    },
  },
  metrics: {
    prefix: 'M',
    fields: {
      name: str,
      kind: en(['business', 'quality', 'latency', 'cost', 'safety']),
      baseline: optStr,
      baseline_source: optStr,
      target: str,
      floor: optStr,
      how_measured: str,
    },
  },
  requirements: {
    prefix: 'R',
    fields: {
      kind: en(['functional', 'quality', 'security', 'compliance', 'integration', 'operational']),
      statement: str,
      priority: en(['must', 'should', 'could']),
      source: refs('P', 'U', 'D', 'A'),
      metric: optRef('M'),
    },
  },
  zones: {
    prefix: 'Z',
    fields: {
      name: str,
      kind: en(['customer', 'cloud', 'model-provider', 'third-party', 'public']),
    },
  },
  components: {
    prefix: 'C',
    fields: {
      name: str,
      kind: en(['person', 'external-system', 'ui', 'service', 'agent', 'model', 'datastore', 'queue', 'gateway', 'pipeline', 'eval', 'observability']),
      layer: en(['ux', 'orchestration', 'retrieval', 'ingestion', 'model', 'evaluation', 'observability', 'security', 'integration', 'external']),
      zone: ref('Z'),
      tech: optStr,
      summary: optStr,
      satisfies: refs('R'),
    },
  },
  flows: {
    prefix: 'F',
    fields: {
      name: str,
      steps: {
        type: 'list',
        of: {
          from: ref('C'),
          to: ref('C'),
          label: str,
          data: optRef('D'),
        },
      },
    },
  },
  decisions: {
    prefix: 'X',
    fields: {
      question: str,
      chosen: str,
      rationale: str,
      status: en(['proposed', 'accepted', 'superseded']),
      reversible: { type: 'boolean' },
      alternatives: { type: 'list', optional: true, of: { option: str, why_not: str } },
      evidence: { type: 'list', optional: true, of: { claim: str, source: str, as_of: { type: 'date' } } },
      affects: refs('C'),
      consequences: optStr,
    },
  },
  risks: {
    prefix: 'K',
    fields: {
      statement: str,
      likelihood: en(LMH),
      impact: en(LMH),
      mitigation: str,
      owner: str,
      status: en(['open', 'mitigated', 'accepted']),
      internal: { type: 'boolean', optional: true },
    },
  },
  tests: {
    prefix: 'T',
    fields: {
      question: str,
      de_risks: refs('K', 'A', 'U'),
      method: str,
      pass_if: str,
      on_fail: str,
      timebox_days: { type: 'number' },
      status: en(['planned', 'running', 'passed', 'failed']),
      result: optStr,
      supersedes: refs('T'),
    },
  },
  phases: {
    prefix: 'H',
    fields: {
      name: str,
      goal: str,
      effort_weeks: { type: 'object', of: { low: { type: 'number' }, high: { type: 'number' } } },
      team: strList,
      deliverables: strList,
      exit_criteria: strList,
      depends_on: refs('U', 'A', 'D', 'T'),
      gate_log: {
        type: 'list',
        optional: true,
        of: {
          date: { type: 'date' },
          decision: en(['proceed', 'pivot', 'reduce-scope', 'pause', 'stop']),
          note: str,
          previous_low: { type: 'number', optional: true },
          previous_high: { type: 'number', optional: true },
        },
      },
    },
  },
};

// Singletons are plain objects with no id.
export const SINGLETONS = {
  engagement: {
    name: str,
    customer: str,
    updated: { type: 'date' },
  },
  need: {
    statement: str,
    business_driver: optStr,
    pain_points: strList,
    workflow: { type: 'list', optional: true, of: { step: str, actor: str, system: optStr, minutes: { type: 'number', optional: true } } },
  },
  value: {
    hypothesis: str,
    value_if_successful: en(RATING),
    likelihood: en(RATING),
    investment: en(RATING),
    why: str,
    kill_criteria: strList,
  },
  qualification: {
    approach: en(['no-ai', 'rules', 'classical-ml', 'single-llm-call', 'workflow', 'rag', 'agent', 'multi-agent']),
    why: str,
    build_or_buy: en(['build', 'buy', 'extend', 'undecided']),
    rejected: { type: 'list', optional: true, of: { approach: str, why: str } },
  },
  demo: {
    audience: ref('P'),
    goal: str,
    beats: {
      type: 'list',
      of: {
        shows: str,
        claim: str,
        mode: en(['live', 'recorded', 'mock', 'synthetic-data']),
        disclosure: optStr,
        backed_by: optRef('T'),
        fallback: optStr,
        url: optStr,
      },
    },
  },
  scope: {
    in: strList,
    out: strList,
    estimate_basis: en(['judgment', 'reference-class', 'measured-prototype']),
    basis_note: optStr,
    effort_unit: en(['person-weeks', 'calendar-weeks'], true),
    run_cost: {
      type: 'object',
      optional: true,
      of: {
        as_of: { type: 'date' },
        range: optStr,
        one_time: optStr,
        drivers: { type: 'list', of: { name: str, assumption: str } },
      },
    },
  },
  handoff: {
    delivery_owner: str,
    eval_kit: strList,
    commitments: optStrList,
  },
};

export const AUDIENCES = {
  type: 'list',
  optional: true,
  of: {
    audience: ref('P'),
    depth: en(['executive', 'technical']),
    ask: str,
  },
};

function isDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

class Checker {
  constructor(ids) {
    this.ids = ids;
    this.errors = [];
  }

  error(code, where, message) {
    this.errors.push({ level: 'error', code, where, message });
  }

  value(where, spec, value) {
    if (value === undefined || value === null) {
      if (!spec.optional) this.error('SCHEMA', where, 'is required');
      return;
    }
    switch (spec.type) {
      case 'string':
        if (typeof value !== 'string' || value.trim() === '') this.error('SCHEMA', where, 'must be a non-empty string');
        break;
      case 'number':
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) this.error('SCHEMA', where, 'must be a number of zero or more');
        break;
      case 'boolean':
        if (typeof value !== 'boolean') this.error('SCHEMA', where, 'must be true or false');
        break;
      case 'date':
        if (!isDate(value)) this.error('SCHEMA', where, 'must be a date written YYYY-MM-DD');
        break;
      case 'enum':
        if (!spec.values.includes(value)) this.error('SCHEMA', where, `must be one of: ${spec.values.join(', ')}`);
        break;
      case 'strings':
        if (!Array.isArray(value) || value.some((v) => typeof v !== 'string' || v.trim() === '')) {
          this.error('SCHEMA', where, 'must be a list of non-empty strings');
        }
        break;
      case 'ref':
        this.reference(where, spec.prefixes, value);
        break;
      case 'refs':
        if (!Array.isArray(value)) this.error('SCHEMA', where, 'must be a list of ids');
        else value.forEach((v, i) => this.reference(`${where}[${i}]`, spec.prefixes, v));
        break;
      case 'object':
        this.fields(where, spec.of, value);
        break;
      case 'list':
        if (!Array.isArray(value)) this.error('SCHEMA', where, 'must be a list');
        else value.forEach((item, i) => this.fields(`${where}[${i}]`, spec.of, item));
        break;
      default:
        throw new Error(`unknown field type ${spec.type}`);
    }
  }

  reference(where, prefixes, value) {
    if (typeof value !== 'string' || !prefixes.includes(value[0])) {
      this.error('SCHEMA', where, `must be an id starting with ${prefixes.join(' or ')}`);
    } else if (!this.ids.has(value)) {
      this.error('DANGLING', where, `refers to ${value}, which does not exist`);
    }
  }

  fields(where, fields, record) {
    if (typeof record !== 'object' || record === null || Array.isArray(record)) {
      this.error('SCHEMA', where, 'must be an object');
      return;
    }
    for (const [name, spec] of Object.entries(fields)) this.value(`${where}.${name}`, spec, record[name]);
    for (const name of Object.keys(record)) {
      if (name !== 'id' && !(name in fields)) this.error('UNKNOWN_FIELD', `${where}.${name}`, 'is not a field of this format; check the spelling');
    }
  }
}

export function collectIds(doc) {
  const ids = new Set();
  const duplicates = [];
  for (const name of Object.keys(COLLECTIONS)) {
    for (const record of Array.isArray(doc[name]) ? doc[name] : []) {
      if (record && typeof record.id === 'string') {
        if (ids.has(record.id)) duplicates.push(record.id);
        ids.add(record.id);
      }
    }
  }
  return { ids, duplicates };
}

// Structure only: types, enums, id prefixes and references. Judgment rules live in rules.mjs.
export function validateStructure(doc) {
  if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) {
    return [{ level: 'error', code: 'SCHEMA', where: '$', message: 'the engagement file must hold one JSON object' }];
  }
  const { ids, duplicates } = collectIds(doc);
  const check = new Checker(ids);

  if (doc.schema !== SCHEMA) check.error('SCHEMA', 'schema', `must be "${SCHEMA}"`);
  for (const id of duplicates) check.error('DUPLICATE_ID', id, 'is used more than once');

  const known = new Set(['schema', 'audiences', ...Object.keys(COLLECTIONS), ...Object.keys(SINGLETONS)]);
  for (const key of Object.keys(doc)) {
    if (!known.has(key)) check.error('UNKNOWN_FIELD', key, 'is not a section of this format; check the spelling');
  }

  for (const [name, { prefix, fields }] of Object.entries(COLLECTIONS)) {
    if (doc[name] === undefined) continue;
    if (!Array.isArray(doc[name])) {
      check.error('SCHEMA', name, 'must be a list');
      continue;
    }
    doc[name].forEach((record, i) => {
      const where = `${name}[${i}]`;
      const id = record?.id;
      if (typeof id !== 'string' || !new RegExp(`^${prefix}\\d+$`).test(id)) {
        check.error('SCHEMA', `${where}.id`, `must look like ${prefix}1`);
      }
      check.fields(typeof id === 'string' ? id : where, fields, record);
    });
  }

  if (doc.engagement === undefined) check.error('SCHEMA', 'engagement', 'is required');
  for (const [name, fields] of Object.entries(SINGLETONS)) {
    if (doc[name] !== undefined) check.fields(name, fields, doc[name]);
  }
  if (doc.audiences !== undefined) check.value('audiences', AUDIENCES, doc.audiences);

  for (const phase of Array.isArray(doc.phases) ? doc.phases : []) {
    const e = phase?.effort_weeks;
    if (e && typeof e.low === 'number' && typeof e.high === 'number' && e.low > e.high) {
      check.error('SCHEMA', `${phase.id}.effort_weeks`, 'low must not exceed high');
    }
  }
  return check.errors;
}

// The furthest stage whose sections have been started.
export function currentStage(doc) {
  const has = (name) => (Array.isArray(doc[name]) ? doc[name].length > 0 : doc[name] !== undefined);
  if (has('handoff')) return 'handoff';
  if (has('phases') || has('scope')) return 'scope';
  if (has('tests') || has('demo')) return 'prototype';
  if (has('components') || has('requirements') || has('decisions')) return 'architect';
  if (has('metrics') || has('value') || has('qualification')) return 'frame';
  return 'discover';
}

export function index(doc) {
  const byId = new Map();
  for (const name of Object.keys(COLLECTIONS)) {
    for (const record of doc[name] ?? []) byId.set(record.id, record);
  }
  return byId;
}

function describeField(spec) {
  const optional = spec.optional ? ' (optional)' : '';
  switch (spec.type) {
    case 'enum': return `one of ${spec.values.join(' | ')}${optional}`;
    case 'ref': return `id of ${spec.prefixes.join(' or ')}${optional}`;
    case 'refs': return `list of ids of ${spec.prefixes.join(' or ')}${optional}`;
    case 'strings': return `list of text${optional}`;
    case 'date': return `date YYYY-MM-DD${optional}`;
    case 'list': return `list of { ${describeFields(spec.of)} }${optional}`;
    case 'object': return `{ ${describeFields(spec.of)} }${optional}`;
    default: return `${spec.type === 'string' ? 'text' : spec.type}${optional}`;
  }
}

function describeFields(fields) {
  return Object.entries(fields).map(([name, spec]) => `${name}: ${describeField(spec)}`).join('; ');
}

// The format as text, generated from the validator so the two cannot disagree.
export function describeSchema(section) {
  const lines = [];
  const known = [...Object.keys(SINGLETONS), ...Object.keys(COLLECTIONS), 'audiences'];
  if (section && !known.includes(section)) return null;
  const show = (name) => !section || section === name;
  if (!section) lines.push(`Top level: schema must be "${SCHEMA}". Stages in order: ${STAGES.join(', ')}.`, '');
  for (const [name, fields] of Object.entries(SINGLETONS)) {
    if (show(name)) lines.push(`${name} (one object)`, ...Object.entries(fields).map(([k, spec]) => `  ${k}: ${describeField(spec)}`), '');
  }
  for (const [name, { prefix, fields }] of Object.entries(COLLECTIONS)) {
    if (show(name)) lines.push(`${name} (list, each with id ${prefix}1, ${prefix}2, ...)`, ...Object.entries(fields).map(([k, spec]) => `  ${k}: ${describeField(spec)}`), '');
  }
  if (show('audiences')) lines.push('audiences (list, one deck per entry)', `  ${describeFields(AUDIENCES.of)}`, '');
  return lines.join('\n');
}

export const NEED_PLACEHOLDER = "Replace with the need in the customer's own words.";

export function emptyEngagement({ name, customer, updated }) {
  return {
    schema: SCHEMA,
    engagement: { name, customer, updated },
    need: { statement: NEED_PLACEHOLDER, pain_points: [] },
    stakeholders: [],
    data_sources: [],
    unknowns: [],
    assumptions: [],
  };
}
