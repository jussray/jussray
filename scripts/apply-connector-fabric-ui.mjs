import { readFileSync, writeFileSync } from 'node:fs';

function patch(path, transforms) {
  let s = readFileSync(path, 'utf8');
  for (const [label, oldText, newText] of transforms) {
    const count = s.split(oldText).length - 1;
    if (count !== 1) throw new Error(`${path} ${label}: expected one anchor, found ${count}`);
    s = s.replace(oldText, newText);
  }
  writeFileSync(path, s);
}

patch('site/index.html', [
  ['connector css',
    '.os-meta{display:flex;gap:7px;flex-wrap:wrap}',
    `.os-meta{display:flex;gap:7px;flex-wrap:wrap}\n.os-connectors{display:flex;gap:7px;flex-wrap:wrap;padding-top:11px;border-top:1px solid rgba(59,227,255,.12)}\n.os-connectors b{width:100%;font-family:var(--f-mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--cyan);font-weight:700}\n.os-connectors span{font-family:var(--f-mono);font-size:9px;letter-spacing:.06em;text-transform:uppercase;padding:6px 8px;border-radius:999px;border:1px solid rgba(59,227,255,.2);color:var(--muted);background:rgba(59,227,255,.035)}\n.os-connectors span[data-state="blocked"]{border-color:rgba(255,103,141,.35);color:#ff9bb4}\n.os-connectors span[data-state="connected"]{border-color:rgba(118,255,190,.35);color:#9dffd0}\n.os-connectors span[data-state="needs_setup"],.os-connectors span[data-state="not_configured"]{border-color:rgba(245,193,75,.3);color:var(--gold-2)}`],
  ['registry declaration',
    'var osGrid=document.getElementById("osGrid"), surfaceStrip=document.getElementById("surfaceStrip");',
    'var osGrid=document.getElementById("osGrid"), surfaceStrip=document.getElementById("surfaceStrip"), connectorRegistry=null;'],
  ['connector render',
    `    card.appendChild(meta);\n    if(x.embeddedIn&&x.embeddedIn.length){`,
    `    card.appendChild(meta);\n    var connectorEntry=connectorRegistry&&connectorRegistry.systems&&connectorRegistry.systems[x.name];\n    var bindings=connectorEntry&&Array.isArray(connectorEntry.bindings)?connectorEntry.bindings:[];\n    if(bindings.length){\n      var cw=document.createElement("div"); cw.className="os-connectors"; var cwb=document.createElement("b"); cwb.textContent="Connector fabric"; cw.appendChild(cwb);\n      bindings.forEach(function(binding){ var lane=(connectorRegistry.lanes||[]).find(function(l){ return l.id===binding.id; }); var sp=document.createElement("span"); sp.dataset.connector=binding.id; sp.dataset.state=binding.state; sp.textContent=(lane?lane.name:binding.id)+" · "+String(binding.state||"unknown").replace(/_/g," "); cw.appendChild(sp); });\n      card.appendChild(cw);\n    }\n    if(x.embeddedIn&&x.embeddedIn.length){`],
  ['dual registry fetch',
    'fetch("data/systems.json",{cache:"no-store"}).then(function(r){ return r.ok?r.json():null; }).then(renderSystems).catch(function(){});',
    `Promise.all([\n  fetch("data/systems.json",{cache:"no-store"}).then(function(r){ return r.ok?r.json():null; }),\n  fetch("data/connectors.json",{cache:"no-store"}).then(function(r){ return r.ok?r.json():null; })\n]).then(function(pair){ connectorRegistry=pair[1]; renderSystems(pair[0]); }).catch(function(){});`]
]);

const registryAnchor = "const WORLD_REGISTRY = JSON.parse(readFileSync(join(ROOT, 'data/worlds.json'), 'utf8')); const EXPECTED_WORLDS = WORLD_REGISTRY.worlds.map((w) => w.name); const IDEA_WORLDS = WORLD_REGISTRY.worlds.filter((w) => w.display?.group === 'Ideas & systems').map((w) => w.name);";
const waitAnchor = "  await page.goto(url, { waitUntil: 'load' }); await page.waitForFunction((n) => document.querySelectorAll('.card').length === n, EXPECTED_WORLDS.length); await page.waitForFunction(() => document.querySelectorAll('.os-card').length === 5); await page.waitForTimeout(300);";
const kindAnchor = "  say((await page.evaluate(() => [...document.querySelectorAll('.os-kind')].every((e) => e.textContent === 'Standalone OS'))), `${vp.n}: every public system is labeled standalone OS`);";
patch('scripts/verify-site.mjs', [
  ['connector registry constant', registryAnchor, registryAnchor + "\nconst CONNECTOR_REGISTRY = JSON.parse(readFileSync(join(ROOT, 'data/connectors.json'), 'utf8')); const EXPECTED_CONNECTORS = CONNECTOR_REGISTRY.lanes.map((x) => x.name);"],
  ['connector wait', waitAnchor, "  await page.goto(url, { waitUntil: 'load' }); await page.waitForFunction((n) => document.querySelectorAll('.card').length === n, EXPECTED_WORLDS.length); await page.waitForFunction(() => document.querySelectorAll('.os-card').length === 5 && document.querySelectorAll('.os-connectors').length === 5); await page.waitForTimeout(300);"],
  ['connector assertions', kindAnchor, kindAnchor + "\n  say((await page.evaluate((names) => [...document.querySelectorAll('.os-card')].every((c) => names.every((n) => c.innerText.includes(n))), EXPECTED_CONNECTORS)), `${vp.n}: every standalone OS exposes Exa Notion Linear Slack fabric`);\n  say((await page.evaluate(() => document.querySelector('.os-card:nth-child(3)')?.innerText.includes('blocked'))), `${vp.n}: Exact Match connector fabric remains visibly blocked`);\n  say((await page.evaluate(() => ![...document.querySelectorAll('.os-connectors span')].some((e) => e.dataset.state === 'connected'))), `${vp.n}: no connector claims connected without runtime proof`);" ]
]);

const validateAnchor = '      - name: Verify canonical public URL';
const deployedWait = "            await page.waitForFunction(() => document.querySelectorAll('.card').length === 15 && document.querySelectorAll('.os-card').length === 5, null, { timeout: 20000 });";
const systemNamesAnchor = "            const systemNames = await page.locator('.os-card h3').allTextContents();";
const okAnchor = "            const ok = requiredWorlds.every(n => worldNames.includes(n)) && requiredSystems.every(n => systemNames.includes(n)) && !worldNames.some(n => n.startsWith('ULTRATHINK')) && overflow === 0 && errors.length === 0;";
patch('.github/workflows/site-proof.yml', [
  ['connector registry validator', validateAnchor,
`      - name: Validate connector fabric registry\n        run: node -e "const d=JSON.parse(require('fs').readFileSync('site/data/connectors.json','utf8')); const ids=(d.lanes||[]).map(x=>x.id); const expected=['exa','notion','linear','slack']; const systems=d.systems||{}; const publicSystems=['Truth Weaver','Truth Compass','Exact Match Engine','Living Truth','Proof Core']; if(JSON.stringify(ids)!==JSON.stringify(expected)||!publicSystems.every(n=>Array.isArray(systems[n]?.bindings)&&systems[n].bindings.length===4)||Object.values(systems).flatMap(x=>x.bindings||[]).some(x=>x.state==='connected')) process.exit(1); console.log('connector fabric registry valid; no unproven connected state')"\n${validateAnchor}`],
  ['deployed connector wait', deployedWait, "            await page.waitForFunction(() => document.querySelectorAll('.card').length === 15 && document.querySelectorAll('.os-card').length === 5 && document.querySelectorAll('.os-connectors').length === 5, null, { timeout: 20000 });"],
  ['deployed connector text', systemNamesAnchor, systemNamesAnchor + "\n            const connectorText = await page.locator('#systems').innerText();"],
  ['deployed connector verdict', okAnchor, "            const ok = requiredWorlds.every(n => worldNames.includes(n)) && requiredSystems.every(n => systemNames.includes(n)) && ['Exa','Notion','Linear','Slack'].every(n => connectorText.includes(n)) && connectorText.includes('blocked') && !connectorText.toLowerCase().includes('connected') && !worldNames.some(n => n.startsWith('ULTRATHINK')) && overflow === 0 && errors.length === 0;" ]
]);

console.log('connector fabric UI patch applied');
