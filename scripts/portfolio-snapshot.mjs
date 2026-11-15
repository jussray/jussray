#!/usr/bin/env node
// Renders the public-safe portfolio projection (site/data/portfolio.json) into
// static HTML inside site/portfolio.html, so the complete map is readable
// before (or without) JavaScript. The markup mirrors the page's client renderer.
//
//   node scripts/portfolio-snapshot.mjs          rewrite the snapshot in place
//   node scripts/portfolio-snapshot.mjs --check  exit 1 if the snapshot is stale
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const HTML_PATH = join(ROOT, 'site/portfolio.html');
export const DATA_PATH = join(ROOT, 'site/data/portfolio.json');

const palette = ['#3be3ff', '#8b5cf6', '#f5c14b', '#ff4fb8', '#3cf0a0', '#5ea8ff'];
const stateColor = (label) => /live/i.test(label) ? '#3cf0a0'
  : /opening|prelaunch|building/i.test(label) ? '#f5c14b'
  : /progress|active/i.test(label) ? '#5ea8ff'
  : /emerging|candidate/i.test(label) ? '#c98bff' : '#b6aed8';
const esc = (s) => String(s ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));

export function renderProjects(projects) {
  return projects.map((p, i) => {
    const aliases = (p.aliases || []).length ? `<div class="aliases">also known as ${esc(p.aliases.join(' · '))}</div>` : '';
    const link = p.link ? `<a class="open" href="${esc(p.link)}" rel="noopener">Open ↗</a>` : '<span class="tag">No public front door yet</span>';
    return `<article class="project" data-slug="${esc(p.slug)}" data-featured="${p.featured ? 'true' : 'false'}" style="--accent:${palette[i % palette.length]};--state:${stateColor(p.publicLabel)}">`
      + `<div class="p-top"><span class="cat">${esc(p.category)}</span><span class="state">${esc(p.publicLabel)}</span></div>`
      + `<h3>${esc(p.name)}</h3>${aliases}<div class="role">${esc(p.role)}</div><p class="desc">${esc(p.description)}</p>`
      + `<div class="p-foot"><span class="tag">${p.featured ? '<span class="featuredmark">◆ Featured world</span>' : esc(p.portfolioStatus)}</span>${link}</div></article>`;
  }).join('\n');
}

export function renderOverlays(overlays) {
  if (!overlays.length) return '';
  return '<div style="margin:32px 0 18px"><div class="kicker">Featured experiments outside the canonical company map</div><p class="map-copy">These independent homepage worlds are visible without inventing additional canonical company identities.</p></div><div class="projects">'
    + overlays.map((p, i) => `<article class="project" data-slug="${esc(p.slug)}" data-featured="true" data-noncanonical="true" style="--accent:${palette[(i + 3) % palette.length]};--state:${stateColor(p.publicLabel)}"><div class="p-top"><span class="cat">Noncanonical featured world</span><span class="state">${esc(p.publicLabel)}</span></div><h3>${esc(p.name)}</h3><div class="role">${esc(p.role)}</div><p class="desc">${esc(p.description)}</p><div class="p-foot"><span class="featuredmark">◆ Featured experiment</span><a class="open" href="https://github.com/${esc(encodeURI(p.repository))}" rel="noopener">Source ↗</a></div></article>`).join('')
    + '</div>';
}

export const countText = (data) => `${data.projects.length} of ${data.projects.length} canonical public identities · ${data.featuredWorlds.length} featured worlds`;

const REGIONS = {
  count: (d) => esc(countText(d)),
  projects: (d) => `\n${renderProjects(d.projects)}\n`,
  overlays: (d) => renderOverlays(d.featuredWorldOverlays || []),
};

export function applySnapshot(html, data) {
  let out = html;
  for (const [name, render] of Object.entries(REGIONS)) {
    const re = new RegExp(`(<!--snapshot:${name}-->)[\\s\\S]*?(<!--/snapshot:${name}-->)`);
    if (!re.test(out)) throw new Error(`portfolio.html is missing the snapshot:${name} markers`);
    out = out.replace(re, (_, a, b) => `${a}${render(data)}${b}`);
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const html = readFileSync(HTML_PATH, 'utf8');
  const next = applySnapshot(html, JSON.parse(readFileSync(DATA_PATH, 'utf8')));
  if (process.argv.includes('--check')) {
    if (next !== html) { console.error('site/portfolio.html snapshot is stale: run node scripts/portfolio-snapshot.mjs'); process.exit(1); }
    console.log('portfolio.html static snapshot matches site/data/portfolio.json');
  } else {
    writeFileSync(HTML_PATH, next);
    console.log(next === html ? 'portfolio.html snapshot already current' : 'portfolio.html snapshot updated');
  }
}
