import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORLDS_PATH = ROOT / 'site/data/worlds.json'
SYSTEMS_PATH = ROOT / 'site/data/systems.json'
INDEX_PATH = ROOT / 'site/index.html'
VERIFY_PATH = ROOT / 'scripts/verify-site.mjs'


def now_iso():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00', 'Z')


def named(items, name):
    for item in items:
        if item.get('name') == name:
            return item
    raise KeyError(name)


def merge_named(items, incoming):
    for item in items:
        if item.get('name') == incoming['name']:
            evidence = item.get('evidence')
            item.update(incoming)
            if evidence is not None:
                item['evidence'] = evidence
            return
    items.append(incoming)


worlds = json.loads(WORLDS_PATH.read_text())
systems = json.loads(SYSTEMS_PATH.read_text())
worlds['generatedAt'] = now_iso()
worlds['source'] = "founder-declared portfolio worlds + builder/repository carriers; evidence fields remain FCR-owned"
worlds['registryVersion'] = 2
worlds['canonicalization'] = 'Worlds render once; standalone OS products live in systems.json; copies and supporting surfaces stay nested carriers.'

base_groups = {
    "Se'kret Bip": 'People & belonging',
    'Founder Control Room': 'Ideas & systems',
    'Chief AI': 'Ideas & systems',
    'Juss Beautiful Hair': 'People & belonging',
    'StoryEngine': 'Stories & play',
    'Sync Party': 'Stories & play',
}
for n, group in base_groups.items():
    named(worlds['worlds'], n).setdefault('display', {})['group'] = group

named(worlds['worlds'], "Se'kret Bip")['carriers'] = [
    {'platform': 'github', 'ref': 'jussray/Sekret-Bip', 'role': 'canonical source', 'visibility': 'public'},
    {'platform': 'github', 'ref': 'jussray/sekret-bip-demo', 'role': 'demo/supporting source', 'visibility': 'public'},
]
named(worlds['worlds'], 'Founder Control Room')['carriers'] = [{'platform': 'github', 'ref': 'jussray/founder-control-room', 'role': 'canonical source', 'visibility': 'public'}]
named(worlds['worlds'], 'Chief AI')['carriers'] = [{'platform': 'github', 'ref': 'jussray/chief-ai-machine', 'role': 'canonical source', 'visibility': 'public'}]
named(worlds['worlds'], 'Juss Beautiful Hair')['carriers'] = [
    {'platform': 'github', 'ref': 'jussray/jussbeautifulhair-site', 'role': 'canonical storefront source', 'visibility': 'public'},
    {'platform': 'github', 'ref': 'jussray/jussbeautifulhair1', 'role': 'additional private carrier', 'visibility': 'private'},
    {'platform': 'github', 'ref': 'jussray/jbh-private', 'role': 'additional carrier', 'visibility': 'public'},
    {'platform': 'github', 'ref': 'jussray/Juss-beautiful-hair-', 'role': 'archived lineage', 'visibility': 'private', 'archived': True},
]
named(worlds['worlds'], 'StoryEngine')['carriers'] = [{'platform': 'github', 'ref': 'jussray/StoryEngine', 'role': 'canonical source', 'visibility': 'public'}]
named(worlds['worlds'], 'Sync Party')['carriers'] = [{'platform': 'github', 'ref': 'jussray/sync-party-game', 'role': 'canonical game source', 'visibility': 'public'}]

additions = [
    {
        'name': 'Bip Jr', 'repo': 'jussray/Bip-Jr', 'st': 'building', 'label': 'Private build', 'held': 'Private build · tracked internally',
        'contact': {'email': 'hello@jussbeautifulhair.com'}, 'evidence': {}, 'carriers': [{'platform': 'github', 'ref': 'jussray/Bip-Jr', 'role': 'canonical source', 'visibility': 'private'}],
        'display': {'group': 'People & belonging', 'accent': '#9A7CFF', 'img': 'assets/w-bip.jpg', 'alt': 'Se’kret Bip family-world artwork', 'desc': 'The younger-family branch of the Se’kret Bip universe.', 'tags': ['Family', 'Kids', 'Belonging'], 'tag': 'A younger doorway into the Bip universe.', 'blurb': 'A family-facing branch built around belonging, communication and age-appropriate connection.', 'facts': [['Source', 'Private GitHub project'], ['Relationship', 'Part of the wider Se’kret Bip family'], ['Public state', 'No public front door declared']]}
    },
    {
        'name': 'PromptOS', 'repo': 'jussray/promptos', 'st': 'building', 'label': 'Building', 'link': {'text': 'Follow the build', 'url': 'https://github.com/jussray/promptos'},
        'contact': {'github': 'https://github.com/jussray/promptos', 'email': 'hello@jussbeautifulhair.com'}, 'evidence': {}, 'carriers': [{'platform': 'github', 'ref': 'jussray/promptos', 'role': 'canonical source', 'visibility': 'public'}],
        'display': {'group': 'Ideas & systems', 'accent': '#7C5CFF', 'img': 'assets/w-fcr.jpg', 'alt': 'Founder systems command-center artwork', 'desc': 'A governed prompt, skill and mission runtime for turning founder intent into bounded work.', 'tags': ['AI', 'Prompts', 'Governance'], 'tag': 'Intent becomes bounded missions.', 'blurb': 'A portable instruction and skill runtime that keeps intent, authority, execution and proof separate.', 'facts': [['Role', 'Prompt + skill runtime'], ['Boundary', 'Consequential authority stays outside the prompt layer'], ['Source', 'Public GitHub build']]}
    },
    {
        'name': 'SolContinuity', 'repo': 'jussray/solcontinuity', 'st': 'building', 'label': 'Building', 'link': {'text': 'Follow the build', 'url': 'https://github.com/jussray/solcontinuity'},
        'contact': {'github': 'https://github.com/jussray/solcontinuity', 'email': 'hello@jussbeautifulhair.com'}, 'evidence': {}, 'carriers': [{'platform': 'github', 'ref': 'jussray/solcontinuity', 'role': 'canonical source', 'visibility': 'public'}],
        'display': {'group': 'Ideas & systems', 'accent': '#14F195', 'img': 'assets/w-fcr.jpg', 'alt': 'Founder systems command-center artwork', 'desc': 'A continuity system for carrying verified state across Solana-linked work.', 'tags': ['Solana', 'Continuity', 'Proof'], 'tag': 'Continuity that survives handoffs.', 'blurb': 'A portfolio experiment in preserving state, evidence and continuity across decentralized workflows.', 'facts': [['Source', 'Public GitHub build'], ['Focus', 'Continuity + proof'], ['Stage', 'Active build']]}
    },
    {
        'name': 'Untold Stories', 'repo': 'jussray/untold-stories-storefront', 'st': 'building', 'label': 'Private build', 'held': 'Private storefront build · tracked internally',
        'contact': {'email': 'hello@jussbeautifulhair.com'}, 'evidence': {}, 'carriers': [{'platform': 'github', 'ref': 'jussray/untold-stories-storefront', 'role': 'canonical storefront source', 'visibility': 'private'}],
        'display': {'group': 'Stories & play', 'accent': '#FF8A5B', 'img': 'assets/w-story.jpg', 'alt': 'Story and filmmaking world artwork', 'desc': 'A storefront world for stories that deserve a place to live.', 'tags': ['Stories', 'Commerce', 'Culture'], 'tag': 'Stories become tangible worlds.', 'blurb': 'A private storefront build connecting narrative, culture and commerce.', 'facts': [['Source', 'Private GitHub storefront'], ['Stage', 'Building'], ['Public state', 'No public front door declared']]}
    },
    {
        'name': 'SWEATS', 'repo': 'jussray/Sweats', 'st': 'building', 'label': 'Private build', 'held': 'Private brand build · tracked internally',
        'contact': {'email': 'hello@jussbeautifulhair.com'}, 'evidence': {}, 'carriers': [{'platform': 'github', 'ref': 'jussray/Sweats', 'role': 'canonical brand source', 'visibility': 'private'}],
        'display': {'group': 'People & belonging', 'accent': '#E8E6E3', 'img': 'assets/w-jbh.jpg', 'alt': 'Fashion and lifestyle world artwork', 'desc': 'A soft-luxury athleisure brand and buyer-psychology experiment.', 'tags': ['Fashion', 'Brand', 'Commerce'], 'tag': 'Soft luxury with a point of view.', 'blurb': 'An apparel experiment built to test brand identity, buyer psychology and real demand.', 'facts': [['Source', 'Private GitHub build'], ['Category', 'Athleisure / fashion'], ['Stage', 'Building']]}
    },
    {
        'name': 'SleepWealth Agent', 'repo': 'jussray/SleepWealth-Agent', 'st': 'building', 'label': 'Building', 'link': {'text': 'Follow the build', 'url': 'https://github.com/jussray/SleepWealth-Agent'},
        'contact': {'github': 'https://github.com/jussray/SleepWealth-Agent', 'email': 'hello@jussbeautifulhair.com'}, 'evidence': {}, 'carriers': [{'platform': 'github', 'ref': 'jussray/SleepWealth-Agent', 'role': 'canonical source', 'visibility': 'public'}],
        'display': {'group': 'People & belonging', 'accent': '#6CCFF6', 'img': 'assets/w-bip.jpg', 'alt': 'Calm night-world artwork', 'desc': 'A public agent experiment in the Juss portfolio.', 'tags': ['Agents', 'Automation', 'Experiment'], 'tag': 'An agent build under active exploration.', 'blurb': 'A public experimental agent project, tracked here without claiming more than the source proves.', 'facts': [['Source', 'Public GitHub repository'], ['Stage', 'Active experiment'], ['Claims', 'Runtime impact is not promoted without proof']]}
    },
    {
        'name': 'Think Tank', 'repo': 'jussray/THINK-TANK', 'st': 'building', 'label': 'Building', 'link': {'text': 'Follow the build', 'url': 'https://github.com/jussray/THINK-TANK'},
        'contact': {'github': 'https://github.com/jussray/THINK-TANK', 'email': 'hello@jussbeautifulhair.com'}, 'evidence': {}, 'carriers': [{'platform': 'github', 'ref': 'jussray/THINK-TANK', 'role': 'canonical source', 'visibility': 'public'}],
        'display': {'group': 'Ideas & systems', 'accent': '#F5C14B', 'img': 'assets/w-fcr.jpg', 'alt': 'Founder systems command-center artwork', 'desc': 'A public idea-and-experiment workspace for exploring what should exist next.', 'tags': ['Ideas', 'Research', 'Experiments'], 'tag': 'Pressure-test the next idea.', 'blurb': 'A compact public workspace for turning rough ideas into things that can be challenged and tested.', 'facts': [['Source', 'Public GitHub repository'], ['Stage', 'Building'], ['Role', 'Idea + experiment workspace']]}
    },
    {
        'name': 'Alexa Commerce Engine', 'repo': 'jussray/alexa-commerce-engine-', 'st': 'building', 'label': 'Private build', 'held': 'Private commerce build · tracked internally',
        'contact': {'email': 'hello@jussbeautifulhair.com'}, 'evidence': {}, 'carriers': [{'platform': 'github', 'ref': 'jussray/alexa-commerce-engine-', 'role': 'canonical source', 'visibility': 'private'}],
        'display': {'group': 'Ideas & systems', 'accent': '#4CB5FF', 'img': 'assets/w-jbh.jpg', 'alt': 'Commerce world artwork', 'desc': 'A private commerce-engine project inside the Juss portfolio.', 'tags': ['Commerce', 'Automation', 'Systems'], 'tag': 'Commerce workflows as a system.', 'blurb': 'A private engine build exploring reusable commerce and product-operation workflows.', 'facts': [['Source', 'Private GitHub repository'], ['Stage', 'Building'], ['Public state', 'No public front door declared']]}
    },
    {
        'name': 'Ayure', 'repo': 'jussray/Ayure-', 'st': 'building', 'label': 'Private build', 'held': 'Private product build · tracked internally',
        'contact': {'email': 'hello@jussbeautifulhair.com'}, 'evidence': {}, 'carriers': [{'platform': 'github', 'ref': 'jussray/Ayure-', 'role': 'canonical source', 'visibility': 'private'}],
        'display': {'group': 'Ideas & systems', 'accent': '#C98BFF', 'img': 'assets/w-fcr.jpg', 'alt': 'Founder systems command-center artwork', 'desc': 'An active private product build moving through its architecture and data layer.', 'tags': ['Product', 'Data', 'Architecture'], 'tag': 'A private product under active construction.', 'blurb': 'Ayure is tracked as an active company project while its product and runtime state continue to mature.', 'facts': [['Source', 'Private GitHub repository'], ['Stage', 'Active architecture build'], ['Public state', 'No public front door declared']]}
    },
]
for item in additions:
    merge_named(worlds['worlds'], item)

# Preserve standalone-OS architecture and add only missing identity lineage.
systems['generatedAt'] = now_iso()
for system in systems.get('systems', []):
    builder = system.get('builder', {})
    if builder.get('appId') == '6a9213ad92e06cfad8756b2b':
        system['lineage'] = [{'previousName': 'Untitled', 'relationship': 'renamed same Base44 app'}]
    elif system.get('name') == 'Proof Core':
        system['aliases'] = ['Untitled (current Base44 app name)']
    elif system.get('name') == 'Exact Match Engine':
        system['lineage'] = [{'repo': 'jussray/exact-match-engine-', 'relationship': 'empty public duplicate shell; not canonical'}]

WORLDS_PATH.write_text(json.dumps(worlds, indent=2, ensure_ascii=False) + '\n')
SYSTEMS_PATH.write_text(json.dumps(systems, indent=2, ensure_ascii=False) + '\n')

text = INDEX_PATH.read_text()
text = text.replace('A founder studio for a brighter tomorrow. Six worlds, one proof protocol.', 'A founder studio for a brighter tomorrow. Connected worlds, one proof protocol.')
text = text.replace('a 3×2 grid of project worlds with an inline detail drawer', 'a growing grid of project worlds with an inline detail drawer')
old_link = '.os-link{align-self:flex-start;color:var(--cyan);font-family:var(--f-mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;text-decoration:none}'
new_link = '.os-link{align-self:flex-start;color:var(--cyan);font-family:var(--f-mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;display:inline-flex;align-items:center;min-height:44px;padding:8px 2px}'
if old_link in text:
    text = text.replace(old_link, new_link, 1)
elif 'min-height:44px' not in text:
    raise SystemExit('OS link tap-target marker missing')

render_start = text.index('  var grid = document.getElementById("grid"), drawer = document.getElementById("drawer");')
live_marker = text.index('  var LIVE = {};', render_start)
render_block = '''  var grid = document.getElementById("grid"), drawer = document.getElementById("drawer");
  var cards = [], current = -1;
  function renderWorldCard(w,i){
    w.tags=Array.isArray(w.tags)?w.tags:[]; w.facts=Array.isArray(w.facts)?w.facts:[];
    var c=document.createElement("article"); c.className="card"; c.style.setProperty("--w",w.w||"#8B5CF6");
    c.innerHTML='<figure><img loading="'+(i<3?"eager":"lazy")+'" width="322" height="132"><span class="badge s-'+w.st+'">'+w.label+'</span></figure><div class="body"><span class="grp"></span><h3></h3><p class="desc"></p><div class="row"><div class="tags"></div><button class="go" type="button" aria-expanded="false" aria-controls="drawer" id="go-'+i+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></div></div>';
    var img=c.querySelector("img");img.src=w.img;img.alt=w.alt||"";c.querySelector("h3").textContent=w.name;c.querySelector(".grp").textContent=w.group;c.querySelector(".desc").textContent=w.desc||"";
    var go=c.querySelector(".go");go.setAttribute("aria-label","Open "+w.name);var tags=c.querySelector(".tags");w.tags.forEach(function(x){var s=document.createElement("span");s.textContent=x;tags.appendChild(s);});
    c.addEventListener("click",function(e){if(e.target.closest("a"))return;toggle(i);});go.addEventListener("click",function(e){e.stopPropagation();toggle(i);});grid.appendChild(c);cards.push(c);
  }
  WORLDS.forEach(function(w,i){renderWorldCard(w,i);});
'''
text = text[:render_start] + render_block + text[live_marker:]

fetch_start = text.index('  fetch("data/worlds.json",{cache:"no-store"})')
fetch_end = text.index('  }).catch(function(){});', fetch_start) + len('  }).catch(function(){});')
fetch_block = '''  function worldFromRegistry(L){var p=L.display||{};return{name:L.name,group:p.group||"Ideas & systems",st:L.st||"building",label:L.label||"Building",w:p.accent||"#8B5CF6",img:p.img||"assets/w-fcr.jpg",alt:p.alt||"",desc:p.desc||"",tags:Array.isArray(p.tags)?p.tags:[],tag:p.tag||"",blurb:p.blurb||p.desc||"",facts:Array.isArray(p.facts)?p.facts:[],held:L.held||"Tracked · no public link yet",link:(L.link&&L.link.url)?[L.link.text||"Open",L.link.url]:null};}
  fetch("data/worlds.json",{cache:"no-store"}).then(function(r){return r.ok?r.json():null;}).then(function(d){
    if(!d||!d.worlds)return;
    d.worlds.forEach(function(L){LIVE[L.name]=L;var idx=WORLDS.findIndex(function(w){return w.name===L.name;});if(idx<0&&L.display){var added=worldFromRegistry(L);WORLDS.push(added);idx=WORLDS.length-1;renderWorldCard(added,idx);}if(idx<0)return;var w=WORLDS[idx];if(L.st&&L.label){w.st=L.st;w.label=L.label;var b=cards[idx].querySelector(".badge");b.className="badge s-"+L.st;b.textContent=L.label;}if(L.link&&L.link.url){w.link=[L.link.text||"Open",L.link.url];w.held=null;}else if(L.held){w.held=L.held;w.link=null;}});
    var n=document.querySelector('#filters .chip[data-group=""] .n');if(n)n.textContent=String(WORLDS.length).padStart(2,"0");
    if(d.company&&d.company.email)document.getElementById("mail").textContent=d.company.email;if(d.quotes&&d.quotes.length)setQuotes(d.quotes);var stamp=document.getElementById("liveStamp");if(stamp&&d.generatedAt)stamp.textContent="Status synced "+new Date(d.generatedAt).toUTCString().replace(/:\\d\\d GMT$/," UTC");if(current>=0){var k=current;current=-1;open(k);}
  }).catch(function(){});'''
text = text[:fetch_start] + fetch_block + text[fetch_end:]
text = text.replace('document.getElementById("dIdx").textContent = "0"+(i+1)+" / 0"+WORLDS.length;', 'document.getElementById("dIdx").textContent = String(i+1).padStart(2,"0")+" / "+String(WORLDS.length).padStart(2,"0");')
text = text.replace('if(e.ci) rows.push(["CI on main", e.ci]);\n    return rows;', 'if(e.ci) rows.push(["CI on main", e.ci]);\n    if(L.carriers&&L.carriers.length) rows.push(["Tracked carriers",L.carriers.map(function(x){return x.ref||x.name||x.id||x.platform;}).join(" · ")]);\n    return rows;', 1)
INDEX_PATH.write_text(text)

verify = VERIFY_PATH.read_text()
root_line = "const ROOT = new URL('../site/', import.meta.url).pathname; const MIME = { '.html': 'text/html', '.jpg': 'image/jpeg', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };"
if 'const WORLD_REGISTRY =' not in verify:
    verify = verify.replace(root_line, root_line + "\nconst WORLD_REGISTRY = JSON.parse(readFileSync(join(ROOT, 'data/worlds.json'), 'utf8')); const EXPECTED_WORLDS = WORLD_REGISTRY.worlds.map((w) => w.name); const IDEA_WORLDS = WORLD_REGISTRY.worlds.filter((w) => w.display?.group === 'Ideas & systems').map((w) => w.name);", 1)
verify = verify.replace("  await page.goto(url, { waitUntil: 'load' }); await page.waitForFunction(() => document.querySelectorAll('.os-card').length === 5); await page.waitForTimeout(300);", "  await page.goto(url, { waitUntil: 'load' }); await page.waitForFunction((n) => document.querySelectorAll('.card').length === n, EXPECTED_WORLDS.length); await page.waitForFunction(() => document.querySelectorAll('.os-card').length === 5); await page.waitForTimeout(300);")
verify = verify.replace("  say((await page.$$('.card')).length === 6, `${vp.n}: six worlds`);", "  say((await page.$$('.card')).length === EXPECTED_WORLDS.length, `${vp.n}: ${EXPECTED_WORLDS.length} portfolio worlds`);\n  const worldNames = await page.evaluate(() => [...document.querySelectorAll('.card h3')].map((e) => e.textContent));\n  say(['Bip Jr','PromptOS','SolContinuity','Untold Stories','SWEATS','SleepWealth Agent','Think Tank','Alexa Commerce Engine','Ayure'].every((n) => worldNames.includes(n)), `${vp.n}: remaining portfolio worlds render`);\n  say((await page.innerText('#filters .chip[data-group=\"\"] .n')) === String(EXPECTED_WORLDS.length).padStart(2,'0'), `${vp.n}: world count follows registry`);")
verify = verify.replace("  say(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.card')].filter((c) => !c.hidden).map((c) => c.querySelector('h3').textContent))) === JSON.stringify(['Founder Control Room', 'Chief AI']), `${vp.n}: filter chips`);", "  say(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.card')].filter((c) => !c.hidden).map((c) => c.querySelector('h3').textContent))) === JSON.stringify(IDEA_WORLDS), `${vp.n}: filter chips follow world registry`);")
VERIFY_PATH.write_text(verify)

assert len(worlds['worlds']) == 15, len(worlds['worlds'])
assert len({w['name'] for w in worlds['worlds']}) == 15
assert len([s for s in systems['systems'] if s.get('public') is True]) == 5
assert all(not w['name'].startswith('ULTRATHINK') for w in worlds['worlds'])
print('prepared 15 world cards while preserving 5-card standalone OS layer')
