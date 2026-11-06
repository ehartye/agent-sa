// Dependency-free SVG diagrams. Output is deterministic so a regenerated file only
// changes when the engagement file changes.

export function esc(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const ZONE_ORDER = ['public', 'customer', 'cloud', 'third-party', 'model-provider'];
const TIERS = { external: 0, ux: 1, integration: 1, orchestration: 2, security: 2, retrieval: 3, ingestion: 3, model: 3, evaluation: 4, observability: 4 };
const SENSITIVE = ['confidential', 'regulated', 'unknown'];
const FONT = "font-family=\"system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif\"";

const COLORS = {
  ink: '#1f2933',
  muted: '#5f6c7b',
  line: '#52606d',
  zoneFill: '#f5f7fa',
  zoneStroke: '#cbd2d9',
  boxFill: '#ffffff',
  boxStroke: '#7b8794',
  accent: '#0b6e99',
  alert: '#b4232c',
  eval: '#2f7d4f',
};

function wrap(text, max) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    if (line && `${line} ${word}`.length > max) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function fit(text, max) {
  const s = String(text);
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function boxColor(component) {
  if (component.layer === 'evaluation' || component.layer === 'observability') return COLORS.eval;
  if (component.kind === 'model') return COLORS.accent;
  return COLORS.boxStroke;
}

// One numbered path per pair of components. Steps that share a path keep all their labels.
export function architectureEdges(doc) {
  const known = new Set((doc.components ?? []).filter((c) => (doc.zones ?? []).some((z) => z.id === c.zone)).map((c) => c.id));
  const dataById = new Map((doc.data_sources ?? []).map((d) => [d.id, d]));
  const edges = [];
  const seen = new Map();
  for (const flow of doc.flows ?? []) {
    for (const step of flow.steps) {
      if (!known.has(step.from) || !known.has(step.to) || step.from === step.to) continue;
      const key = step.from + '>' + step.to;
      const sensitive = Boolean(step.data && SENSITIVE.includes(dataById.get(step.data)?.sensitivity));
      if (seen.has(key)) {
        const edge = seen.get(key);
        edge.sensitive ||= sensitive;
        if (!edge.labels.includes(step.label)) edge.labels.push(step.label);
        continue;
      }
      const edge = { from: step.from, to: step.to, labels: [step.label], sensitive, number: edges.length + 1 };
      seen.set(key, edge);
      edges.push(edge);
    }
  }
  return edges;
}

export function architectureSvg(doc, { idSuffix = '', legend = true } = {}) {
  const zones = [...(doc.zones ?? [])].sort((a, b) => ZONE_ORDER.indexOf(a.kind) - ZONE_ORDER.indexOf(b.kind));
  const components = (doc.components ?? []).filter((c) => zones.some((z) => z.id === c.zone));
  const inZone = (z) => components.filter((c) => c.zone === z.id);

  // Zones holding only people and outside systems share a strip, so each does not cost a full row.
  const stripZones = zones.filter((z) => inZone(z).length > 0 && inZone(z).every((c) => c.layer === 'external'));
  const bandZones = zones.filter((z) => !stripZones.includes(z));

  const bandParts = bandZones.flatMap(inZone);
  const usedTiers = [...new Set(bandParts.map((c) => TIERS[c.layer]))].sort((a, b) => a - b);
  const MAX_ROWS = 3;
  const tierWidth = new Map(usedTiers.map((tier) => [tier, Math.max(1, ...bandZones.map((z) => Math.ceil(inZone(z).filter((c) => TIERS[c.layer] === tier).length / MAX_ROWS)))]));
  const tierStart = new Map();
  let bandCols = 0;
  for (const tier of usedTiers) {
    tierStart.set(tier, bandCols);
    bandCols += tierWidth.get(tier);
  }
  const stripCount = stripZones.reduce((n, z) => n + inZone(z).length, 0);
  const cols = Math.max(bandCols, Math.min(stripCount, 6), 1);

  const boxW = 186;
  const boxH = 66;
  const colGap = 78;
  const gapY = 30;
  const pad = 18;
  const headH = 30;
  const bandGap = 22;
  const left = 20;
  const xOf = (col) => left + pad + col * (boxW + colGap);

  const positions = new Map();
  const bands = [];
  let y = 14;

  if (stripZones.length) {
    let col = 0;
    let row = 0;
    const rows = [];
    for (const zone of stripZones) {
      const members = inZone(zone);
      if (col > 0 && col + members.length > cols) {
        col = 0;
        row += 1;
      }
      rows[row] ??= [];
      rows[row].push({ zone, members, col });
      col += members.length;
    }
    for (const entries of rows) {
      for (const { zone, members, col: first } of entries) {
        members.forEach((c, i) => positions.set(c.id, { x: xOf(first + i), y: y + headH, w: boxW, h: boxH, col: first + i, component: c }));
        bands.push({ zone, x: xOf(first) - pad + 4, y, width: members.length * boxW + (members.length - 1) * colGap + (pad - 4) * 2, height: headH + boxH + 12 });
      }
      y += headH + boxH + 12 + bandGap;
    }
  }

  for (const zone of bandZones) {
    const seen = new Map();
    let rows = 1;
    for (const c of inZone(zone)) {
      const tier = TIERS[c.layer];
      const i = seen.get(tier) ?? 0;
      seen.set(tier, i + 1);
      const col = tierStart.get(tier) + Math.floor(i / MAX_ROWS);
      const row = i % MAX_ROWS;
      rows = Math.max(rows, row + 1);
      positions.set(c.id, { x: xOf(col), y: y + headH + row * (boxH + gapY), w: boxW, h: boxH, col, component: c });
    }
    const height = headH + rows * boxH + (rows - 1) * gapY + 12;
    bands.push({ zone, x: left, y, width: pad * 2 + cols * boxW + (cols - 1) * colGap, height });
    y += height + bandGap;
  }
  const width = left * 2 + pad * 2 + cols * boxW + (cols - 1) * colGap;
  const bandsBottom = y - bandGap;

  const edges = architectureEdges(doc);
  const ports = new Map();
  const claim = (key, edge, other) => {
    if (!ports.has(key)) ports.set(key, []);
    ports.get(key).push({ edge, other });
  };
  for (const edge of edges) {
    edge.a = positions.get(edge.from);
    edge.b = positions.get(edge.to);
    edge.dir = Math.sign(edge.b.col - edge.a.col);
    if (edge.dir === 0) continue;
    claim(edge.from + (edge.dir > 0 ? ':R' : ':L'), edge, edge.b);
    claim(edge.to + (edge.dir > 0 ? ':L' : ':R'), edge, edge.a);
  }
  const portY = new Map();
  const portIndex = new Map();
  for (const [key, list] of ports) {
    list.sort((m, n) => m.other.y - n.other.y || m.edge.number - n.edge.number);
    const box = positions.get(key.split(':')[0]);
    list.forEach((item, i) => {
      portY.set(key + '#' + item.edge.number, box.y + (box.h * (i + 1)) / (list.length + 1));
      portIndex.set(key + '#' + item.edge.number, i);
    });
  }

  const legendTop = bandsBottom + 24;
  const legendRows = legend ? Math.ceil(edges.length / 2) : 0;
  const hasSensitive = edges.some((e) => e.sensitive);
  const height = legend ? legendTop + legendRows * 22 + (hasSensitive ? 26 : 2) : bandsBottom + 8;

  const arrowHead = (id, fill) => '<marker id="' + id + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="' + fill + '"/></marker>';
  const parts = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + width + ' ' + height + '" width="100%" role="img" aria-label="Architecture of ' + esc(doc.engagement.name) + '" ' + FONT + '>',
    '<defs>' + arrowHead('arrow' + idSuffix, COLORS.line) + arrowHead('arrow-alert' + idSuffix, COLORS.alert) + '</defs>',
  ];
  for (const band of bands) {
    parts.push('<rect x="' + band.x + '" y="' + band.y + '" width="' + band.width + '" height="' + band.height + '" rx="10" fill="' + COLORS.zoneFill + '" stroke="' + COLORS.zoneStroke + '" stroke-dasharray="6 4"/>');
  }

  const markers = [];
  for (const edge of edges) {
    const { a, b, dir } = edge;
    let d;
    let mx;
    let my;
    if (dir === 0) {
      const between = [...positions.values()].filter((p) => p !== a && p !== b && p.col === a.col && p.y > Math.min(a.y, b.y) && p.y < Math.max(a.y, b.y));
      const down = b.y > a.y;
      const x = a.x + a.w / 2 + ((edge.number % 3) - 1) * 18;
      if (between.length > 0) {
        // Around the boxes in between, through the gutter on the right.
        const gutter = a.x + a.w + 16 + (edge.number % 3) * 8;
        d = 'M' + (a.x + a.w) + ' ' + (a.y + a.h / 2) + ' L' + gutter + ' ' + (a.y + a.h / 2) + ' L' + gutter + ' ' + (b.y + b.h / 2) + ' L' + (b.x + b.w) + ' ' + (b.y + b.h / 2);
        mx = gutter;
        my = (a.y + b.y + a.h) / 2;
      } else {
        const y1 = down ? a.y + a.h : a.y;
        const y2 = down ? b.y : b.y + b.h;
        d = 'M' + x + ' ' + y1 + ' L' + x + ' ' + y2;
        mx = x + 14;
        my = (y1 + y2) / 2;
      }
    } else {
      const x1 = dir > 0 ? a.x + a.w : a.x;
      const x2 = dir > 0 ? b.x : b.x + b.w;
      const startKey = edge.from + (dir > 0 ? ':R' : ':L') + '#' + edge.number;
      const endKey = edge.to + (dir > 0 ? ':L' : ':R') + '#' + edge.number;
      const y1 = portY.get(startKey);
      const y2 = portY.get(endKey);
      const low = Math.min(a.col, b.col);
      const high = Math.max(a.col, b.col);
      const blockers = [...positions.values()].filter((p) => p.col > low && p.col < high && p.y < Math.max(y1, y2) + 6 && p.y + p.h > Math.min(y1, y2) - 6);
      let onRail = null;
      if (blockers.length > 0) {
        const rail = Math.min(...blockers.map((p) => p.y)) - 8 - (edge.number % 3) * 5;
        const reach = 26;
        const xa = x1 + dir * reach;
        const xb = x2 - dir * reach;
        d = 'M' + x1 + ' ' + y1 + ' C' + xa + ' ' + y1 + ' ' + x1 + ' ' + rail + ' ' + xa + ' ' + rail + ' L' + xb + ' ' + rail + ' C' + x2 + ' ' + rail + ' ' + xb + ' ' + y2 + ' ' + x2 + ' ' + y2;
        onRail = { x: xb - dir * 14, y: rail };
      } else {
        const bend = Math.max(36, Math.abs(x2 - x1) / 2);
        d = 'M' + x1 + ' ' + y1 + ' C' + (x1 + dir * bend) + ' ' + y1 + ' ' + (x2 - dir * bend) + ' ' + y2 + ' ' + x2 + ' ' + y2;
      }
      // Stagger along the arrival so markers on one side do not sit on each other.
      mx = onRail ? onRail.x : x2 - dir * (20 + (portIndex.get(endKey) % 3) * 21);
      my = onRail ? onRail.y : y2;
    }
    const color = edge.sensitive ? COLORS.alert : COLORS.line;
    parts.push('<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="1.5" marker-end="url(#' + (edge.sensitive ? 'arrow-alert' : 'arrow') + idSuffix + ')"/>');
    markers.push({ mx, my, color, number: edge.number });
  }
  for (const band of bands) {
    parts.push('<text x="' + (band.x + 12) + '" y="' + (band.y + 20) + '" font-size="14" font-weight="600" fill="' + COLORS.muted + '" stroke="' + COLORS.zoneFill + '" stroke-width="5" paint-order="stroke">' + esc(fit(band.zone.name, Math.max(18, Math.floor(band.width / 8)))) + '</text>');
  }
  for (const { x, y: by, w, h, component } of positions.values()) {
    const cy = by + h / 2;
    parts.push('<rect x="' + x + '" y="' + by + '" width="' + w + '" height="' + h + '" rx="7" fill="' + COLORS.boxFill + '" stroke="' + boxColor(component) + '" stroke-width="1.7"/>');
    parts.push('<text x="' + (x + w / 2) + '" y="' + (cy - 3) + '" text-anchor="middle" font-size="15" font-weight="600" fill="' + COLORS.ink + '">' + esc(fit(component.name, 22)) + '</text>');
    parts.push('<text x="' + (x + w / 2) + '" y="' + (cy + 16) + '" text-anchor="middle" font-size="12.5" fill="' + COLORS.muted + '">' + esc(fit(component.tech ?? component.kind, 31)) + '</text>');
  }
  for (const { mx, my, color, number } of markers) {
    parts.push('<circle cx="' + mx + '" cy="' + my + '" r="10" fill="#fff" stroke="' + color + '" stroke-width="1.3"/>');
    parts.push('<text x="' + mx + '" y="' + (my + 4) + '" text-anchor="middle" font-size="11.5" font-weight="700" fill="' + color + '">' + number + '</text>');
  }
  if (legend) {
    const columnWidth = (width - 40) / 2;
    edges.forEach((edge, i) => {
      const lx = 20 + (i % 2) * columnWidth;
      const ly = legendTop + Math.floor(i / 2) * 22;
      parts.push('<text x="' + lx + '" y="' + ly + '" font-size="13.5" fill="' + COLORS.ink + '"><tspan font-weight="700" fill="' + (edge.sensitive ? COLORS.alert : COLORS.line) + '">' + edge.number + '</tspan>  ' + esc(fit(edge.labels.join('; '), Math.floor(columnWidth / 7))) + '</text>');
    });
    if (hasSensitive) {
      parts.push('<text x="20" y="' + (height - 6) + '" font-size="12.5" fill="' + COLORS.alert + '">Red paths carry confidential, regulated or unclassified data.</text>');
    }
  }
  parts.push('</svg>');
  return parts.join('\n');
}

// One box per layer in each zone, for an audience that needs the shape and not the parts.
export function summarize(doc) {
  const groups = new Map();
  for (const c of doc.components ?? []) {
    const key = c.zone + '|' + c.layer;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(c);
  }
  const mapping = new Map();
  const components = [];
  let n = 0;
  for (const members of groups.values()) {
    if (members.length === 1) {
      components.push(members[0]);
      mapping.set(members[0].id, members[0].id);
      continue;
    }
    n += 1;
    const id = 'G' + n;
    const layer = members[0].layer;
    components.push({ id, name: layer.charAt(0).toUpperCase() + layer.slice(1), kind: members[0].kind, layer, zone: members[0].zone, tech: members.length + ' components' });
    for (const m of members) mapping.set(m.id, id);
  }
  const flows = (doc.flows ?? []).map((f) => ({ ...f, steps: f.steps.map((s) => ({ ...s, from: mapping.get(s.from), to: mapping.get(s.to) })).filter((s) => s.from !== s.to) }));
  return { ...doc, components, flows };
}

export function sequenceSvg(doc, flow) {
  const byId = new Map((doc.components ?? []).map((c) => [c.id, c]));
  const dataById = new Map((doc.data_sources ?? []).map((d) => [d.id, d]));
  const participants = [];
  for (const step of flow.steps) {
    for (const id of [step.from, step.to]) if (!participants.includes(id)) participants.push(id);
  }
  const colW = 178;
  const headH = 58;
  const rowH = 46;
  const left = 20;
  const width = left * 2 + participants.length * colW;
  const height = headH + 26 + flow.steps.length * rowH + 16;
  const xOf = (id) => left + participants.indexOf(id) * colW + colW / 2;

  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="${esc(flow.name)}" ${FONT}>`,
    `<defs><marker id="seq-${flow.id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${COLORS.line}"/></marker>`,
    `<marker id="seq-alert-${flow.id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${COLORS.alert}"/></marker></defs>`,
  ];
  for (const id of participants) {
    const x = xOf(id);
    const c = byId.get(id);
    parts.push(`<rect x="${x - colW / 2 + 8}" y="10" width="${colW - 16}" height="40" rx="6" fill="#fff" stroke="${c ? boxColor(c) : COLORS.boxStroke}" stroke-width="1.5"/>`);
    parts.push(`<text x="${x}" y="35" text-anchor="middle" font-size="12.5" font-weight="600" fill="${COLORS.ink}">${esc(fit(c?.name ?? id, 22))}</text>`);
    parts.push(`<line x1="${x}" y1="50" x2="${x}" y2="${height - 10}" stroke="${COLORS.zoneStroke}" stroke-dasharray="4 4"/>`);
  }
  flow.steps.forEach((step, i) => {
    const y = headH + 26 + i * rowH;
    const x1 = xOf(step.from);
    const x2 = xOf(step.to);
    const sensitive = step.data && SENSITIVE.includes(dataById.get(step.data)?.sensitivity);
    const color = sensitive ? COLORS.alert : COLORS.line;
    const marker = `${sensitive ? 'seq-alert' : 'seq'}-${flow.id}`;
    const label = `${i + 1}. ${step.label}`;
    if (x1 === x2) {
      parts.push(`<path d="M${x1} ${y - 8} h34 v16 h-34" fill="none" stroke="${color}" stroke-width="1.4" marker-end="url(#${marker})"/>`);
      parts.push(`<text x="${x1 + 40}" y="${y + 4}" font-size="12" fill="${COLORS.ink}">${esc(fit(label, 40))}</text>`);
    } else {
      parts.push(`<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${color}" stroke-width="1.4" marker-end="url(#${marker})"/>`);
      const span = Math.abs(x2 - x1);
      const lines = wrap(label, Math.max(Math.floor(span / 6.6), 22)).slice(0, 2);
      lines.forEach((line, n) => {
        const ly = y - 7 - (lines.length - 1 - n) * 14;
        parts.push(`<text x="${(x1 + x2) / 2}" y="${ly}" text-anchor="middle" font-size="12" fill="${COLORS.ink}">${esc(line)}</text>`);
      });
    }
  });
  parts.push('</svg>');
  return parts.join('\n');
}

export function roadmapSvg(doc) {
  const phases = doc.phases ?? [];
  const totalHigh = phases.reduce((sum, h) => sum + h.effort_weeks.high, 0) || 1;
  const labelW = 210;
  const chartW = 620;
  const rowH = 38;
  const width = labelW + chartW + 70;
  const height = phases.length * rowH + 58;
  const scale = chartW / totalHigh;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="Phases with low and high effort ranges" ${FONT}>`,
  ];
  let start = 0;
  phases.forEach((h, i) => {
    const y = 14 + i * rowH;
    const { low, high } = h.effort_weeks;
    parts.push(`<text x="${labelW - 12}" y="${y + 17}" text-anchor="end" font-size="13" fill="${COLORS.ink}">${esc(fit(h.name, 30))}</text>`);
    const x = labelW + start * scale;
    parts.push(`<rect x="${x}" y="${y}" width="${Math.max(low * scale, 1)}" height="24" rx="3" fill="${COLORS.accent}"/>`);
    if (high > low) {
      parts.push(`<rect x="${x + low * scale}" y="${y}" width="${(high - low) * scale}" height="24" rx="3" fill="${COLORS.accent}" fill-opacity="0.28"/>`);
    }
    parts.push(`<text x="${x + high * scale + 8}" y="${y + 17}" font-size="12" fill="${COLORS.muted}">${low}–${high} wk</text>`);
    start += low;
  });
  const lowSum = phases.reduce((sum, h) => sum + h.effort_weeks.low, 0);
  parts.push(`<text x="${labelW}" y="${height - 12}" font-size="12" fill="${COLORS.muted}">Solid: low estimate. Pale: range to high. Bars start at the cumulative low, so the full range is ${lowSum}–${totalHigh} weeks of sequential effort.</text>`);
  parts.push('</svg>');
  return parts.join('\n');
}

function quote(text) {
  return `"${String(text).replace(/"/g, '#quot;').replace(/\n/g, ' ')}"`;
}

export function architectureMermaid(doc) {
  const lines = ['flowchart LR'];
  for (const zone of doc.zones ?? []) {
    lines.push(`  subgraph ${zone.id}[${quote(zone.name)}]`);
    for (const c of (doc.components ?? []).filter((m) => m.zone === zone.id)) {
      lines.push(`    ${c.id}[${quote(c.tech ? `${c.name}<br/>${c.tech}` : c.name)}]`);
    }
    lines.push('  end');
  }
  const seen = new Set();
  for (const flow of doc.flows ?? []) {
    for (const step of flow.steps) {
      const key = `${step.from}>${step.to}`;
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push(`  ${step.from} -->|${quote(step.label)}| ${step.to}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

export function sequenceMermaid(doc, flow) {
  const byId = new Map((doc.components ?? []).map((c) => [c.id, c]));
  const lines = ['sequenceDiagram'];
  const seen = new Set();
  for (const step of flow.steps) {
    for (const id of [step.from, step.to]) {
      if (!seen.has(id)) {
        seen.add(id);
        lines.push(`  participant ${id} as ${String(byId.get(id)?.name ?? id).replace(/[;:\n]/g, ' ')}`);
      }
    }
  }
  for (const step of flow.steps) {
    lines.push(`  ${step.from}->>${step.to}: ${String(step.label).replace(/[;\n]/g, ',')}`);
  }
  return `${lines.join('\n')}\n`;
}
