import json
import shutil
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORLDS_PATH = ROOT / 'site/data/worlds.json'
SYSTEMS_PATH = ROOT / 'site/data/systems.json'
INDEX_PATH = ROOT / 'site/index.html'
VERIFY_PATH = ROOT / 'scripts/verify-site.mjs'
ASSETS = ROOT / 'site/assets'


def now_iso():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00', 'Z')


def merge_named(items, incoming):
    for item in items:
        if item.get('name') == incoming['name']:
            evidence = item.get('evidence')
            item.update(incoming)
            if evidence is not None:
                item['evidence'] = evidence
            return
    items.append(incoming)


def get_named(items, name):
    for item in items:
        if item.get('name') == name:
            return item
    raise KeyError(name)


def fetch_asset(url, target, fallback):
    try:
        urllib.request.urlretrieve(url, target)
    except Exception:
        shutil.copyfile(fallback, target)


worlds = json.loads(WORLDS_PATH.read_text())
systems = json.loads(SYSTEMS_PATH.read_text())
worlds['generatedAt'] = now_iso()
worlds['source'] = "founder-declared portfolio worlds + builder/repository carriers; evidence fields remain FCR-owned"
worlds['registryVersion'] = 2
worlds['canonicalization'] = 'Canonical worlds render once; builder copies and supporting surfaces remain nested carriers.'

base_groups = {
    "Se'kret Bip": 'People & belonging',
    'Founder Control Room': 'Ideas & systems',
    'Chief AI': 'Ideas & systems',
    'Juss Beautiful Hair': 'People & belonging',
    'StoryEngine': 'Stories & play',
    'Sync Party': 'Stories & play',
}
for name, group in base_groups.items():
    get_named(worlds['worlds'], name).setdefault('display', {})['group'] = group

get_named(worlds['worlds'], "Se'kret Bip")['carriers'] = [
    {'platform': 'github', 'ref': 'jussray/Sekret-Bip', 'role': 'canonical source', 'visibility': 'public'},
    {'platform': 'github', 'ref': 'jussray/sekret-bip-demo', 'role': 'demo/supporting source', 'visibility': 'public'},
]
get_named(worlds['worlds'], 'Founder Control Room')['carriers'] = [
    {'platform': 'github', 'ref': 'jussray/founder-control-room', 'role': 'canonical source', 'visibility': 'public'}
]
get_named(worlds['worlds'], 'Chief AI')['carriers'] = [
    {'platform': 'github', 'ref': 'jussray/chief-ai-machine', 'role': 'canonical source', 'visibility': 'public'}
]
get_named(worlds['worlds'], 'Juss Beautiful Hair')['carriers'] = [
    {'platform': 'github', 'ref': 'jussray/jussbeautifulhair-site', 'role': 'canonical storefront source', 'visibility': 'public'},
    {'platform': 'github', 'ref': 'jussray/jussbeautifulhair1', 'role': 'additional private carrier', 'visibility': 'private'},
    {'platform': 'github', 'ref': 'jussray/jbh-private', 'role': 'additional carrier', 'visibility': 'public'},
    {'platform': 'github', 'ref': 'jussray/Juss-beautiful-hair-', 'role': 'archived lineage', 'visibility': 'private', 'archived': True},
]
get_named(worlds['worlds'], 'StoryEngine')['carriers'] = [
    {'platform': 'github', 'ref': 'jussray/StoryEngine', 'role': 'canonical source', 'visibility': 'public'}
]
get_named(worlds['worlds'], 'Sync Party')['carriers'] = [
    {'platform': 'github', 'ref': 'jussray/sync-party-game', 'role': 'canonical game source', 'visibility': 'public'}
]

additions = [
    {
        'name': 'Bip Jr', 'repo': 'jussray/Bip-Jr', 'st': 'building', 'label': 'Private build',
        'held': 'Private build · tracked internally', 'contact': {'email': 'hello@jussbeautifulhair.com'}, 'evidence': {},
        'carriers': [{'platform': 'github', 'ref': 'jussray/Bip-Jr', 'role': 'canonical source', 'visibility': 'private'}],
        'display': {'group': 'People & belonging', 'accent': '#9A7CFF', 'img': 'assets/w-bip.jpg', 'alt': 'Se’kret Bip family-world artwork', 'desc': 'The younger-family branch of the Se’kret Bip universe.', 'tags': ['Family', 'Kids', 'Belonging'], 'tag': 'A younger doorway into the Bip universe.', 'blurb': 'A family-facing branch built around belonging, communication and age-appropriate connection.', 'facts': [['Source', 'Private GitHub project'], ['Relationship', 'Part of the wider Se’kret Bip family'], ['Public state', 'No public front door declared']]}
    },
    {
        'name': 'PromptOS', 'repo': 'jussray/promptos', 'st': 'building', 'label': 'Building',
        'link': {'text': 'Follow the build', 'url': 'https://github.com/jussray/promptos'}, 'contact': {'github': 'https://github.com/jussray/promptos', 'email': 'hello@jussbeautifulhair.com'}, 'evidence': {},
        'carriers': [{'platform': 'github', 'ref': 'jussray/promptos', 'role': 'canonical source', 'visibility': 'public'}],
        'display': {'group': 'Ideas & systems', 'accent': '#7C5CFF', 'img': 'assets/w-fcr.jpg', 'alt': 'Founder systems command-center artwork', 'desc': 'A governed prompt, skill and mission runtime for turning founder intent into bounded work.', 'tags': ['AI', 'Prompts', 'Governance'], 'tag': 'Intent becomes bounded missions.', 'blurb': 'A portable instruction and skill runtime that keeps intent, authority, execution and proof separate.', 'facts': [['Role', 'Prompt + skill runtime'], ['Boundary', 'Consequential authority stays outside the prompt layer'], ['Source', 'Public GitHub build']]}
    },
    {
        'name': 'SolContinuity', 'repo': 'jussray/solcontinuity', 'st': 'building', 'label': 'Building',
        'link': {'text': 'Follow the build', 'url': 'https://github.com/jussray/solcontinuity'}, 'contact': {'github': 'https://github.com/jussray/solcontinuity', 'email': 'hello@jussbeautifulhair.com'}, 'evidence': {},
        'carriers': [{'platform': 'github', 'ref': 'jussray/solcontinuity', 'role': 'canonical source', 'visibility': 'public'}],
        'display': {'group': 'Ideas & systems', 'accent': '#14F195', 'img': 'assets/w-fcr.jpg', 'alt': 'Founder systems command-center artwork', 'desc': 'A continuity system for carrying verified state across Solana-linked work.', 'tags': ['Solana', 'Continuity', 'Proof'], 'tag': 'Continuity that survives handoffs.', 'blurb': 'A portfolio experiment in preserving state, evidence and continuity across decentralized workflows.', 'facts': [['Source', 'Public GitHub build'], ['Focus', 'Continuity + proof'], ['Stage', 'Active build']]}
    },
    {
        'name': 'Untold Stories', 'repo': 'jussray/untold-stories-storefront', 'st': 'building', 'label': 'Private build',
        'held': 'Private storefront build · tracked internally', 'contact': {'email': 'hello@jussbeautifulhair.com'}, 'evidence': {},
        'carriers': [{'platform': 'github', 'ref': 'jussray/untold-stories-storefront', 'role': 'canonical storefront source', 'visibility': 'private'}],
        'display': {'group': 'Stories & play', 'accent': '#FF8A5B', 'img': 'assets/w-story.jpg', 'alt': 'Story and filmmaking world artwork', 'desc': 'A storefront world for stories that deserve a place to live.', 'tags': ['Stories', 'Commerce', 'Culture'], 'tag': 'Stories become tangible worlds.', 'blurb': 'A private storefront build connecting narrative, culture and commerce.', 'facts': [['Source', 'Private GitHub storefront'], ['Stage', 'Building'], ['Public state', 'No public front door declared']]}
    },
    {
        'name': 'SWEATS', 'repo': 'jussray/Sweats', 'st': 'building', 'label': 'Private build',
        'held': 'Private brand build · tracked internally', 'contact': {'email': 'hello@jussbeautifulhair.com'}, 'evidence': {},
        'carriers': [{'platform': 'github', 'ref': 'jussray/Sweats', 'role': 'canonical brand source', 'visibility': 'private'}],
        'display': {'group': 'People & belonging', 'accent': '#E8E6E3', 'img': 'assets/w-jbh.jpg', 'alt': 'Fashion and lifestyle world artwork', 'desc': 'A soft-luxury athleisure brand and buyer-psychology experiment.', 'tags': ['Fashion', 'Brand', 'Commerce'], 'tag': 'Soft luxury with a point of view.', 'blurb': 'An apparel experiment built to test brand identity, buyer psychology and real demand.', 'facts': [['Source', 'Private GitHub build'], ['Category', 'Athleisure / fashion'], ['Stage', 'Building']]}
    },
    {
        'name': 'SleepWealth Agent', 'repo': 'jussray/SleepWealth-Agent', 'st': 'building', 'label': 'Building',
        'link': {'text': 'Follow the build', 'url': 'https://github.com/jussray/SleepWealth-Agent'}, 'contact': {'github': 'https://github.com/jussray/SleepWealth-Agent', 'email': 'hello@jussbeautifulhair.com'}, 'evidence': {},
        'carriers': [{'platform': 'github', 'ref': 'jussray/SleepWealth-Agent', 'role': 'canonical source', 'visibility': 'public'}],
        'display': {'group': 'People & belonging', 'accent': '#6CCFF6', 'img': 'assets/w-bip.jpg', 'alt': 'Calm night-world artwork', 'desc': 'A public agent experiment in the Juss portfolio.', 'tags': ['Agents', 'Automation', 'Experiment'], 'tag': 'An agent build under active exploration.', 'blurb': 'A public experimental agent project, tracked here without claiming more than the source proves.', 'facts': [['Source', 'Public GitHub repository'], ['Stage', 'Active experiment'], ['Claims', 'Runtime impact is not promoted without proof']]}
    },
    {
        'name': 'Think Tank', 'repo': 'jussray/THINK-TANK', 'st': 'building', 'label': 'Building',
        'link': {'text': 'Follow the build', 'url': 'https://github.com/jussray/THINK-TANK'}, 'contact': {'github': 'https://github.com/jussray/THINK-TANK', 'email': 'hello@jussbeautifulhair.com'}, 'evidence': {},
        'carriers': [{'platform': 'github', 'ref': 'jussray/THINK-TANK', 'role': 'canonical source', 'visibility': 'public'}],
        'display': {'group': 'Ideas & systems', 'accent': '#F5C14B', 'img': 'assets/w-fcr.jpg', 'alt': 'Founder systems command-center artwork', 'desc': 'A public idea-and-experiment workspace for exploring what should exist next.', 'tags': ['Ideas', 'Research', 'Experiments'], 'tag': 'Pressure-test the next idea.', 'blurb': 'A compact public workspace for turning rough ideas into things that can be challenged and tested.', 'facts': [['Source', 'Public GitHub repository'], ['Stage', 'Building'], ['Role', 'Idea + experiment workspace']]}
    },
    {
        'name': 'Alexa Commerce Engine', 'repo': 'jussray/alexa-commerce-engine-', 'st': 'building', 'label': 'Private build',
        'held': 'Private commerce build · tracked internally', 'contact': {'email': 'hello@jussbeautifulhair.com'}, 'evidence': {},
        'carriers': [{'platform': 'github', 'ref': 'jussray/alexa-commerce-engine-', 'role': 'canonical source', 'visibility': 'private'}],
        'display': {'group': 'Ideas & systems', 'accent': '#4CB5FF', 'img': 'assets/w-jbh.jpg', 'alt': 'Commerce world artwork', 'desc': 'A private commerce-engine project inside the Juss portfolio.', 'tags': ['Commerce', 'Automation', 'Systems'], 'tag': 'Commerce workflows as a system.', 'blurb': 'A private engine build exploring reusable commerce and product-operation workflows.', 'facts': [['Source', 'Private GitHub repository'], ['Stage', 'Building'], ['Public state', 'No public front door declared']]}
    },
    {
        'name': 'Ayure', 'repo': 'jussray/Ayure-', 'st': 'building', 'label': 'Private build',
        'held': 'Private product build · tracked internally', 'contact': {'email': 'hello@jussbeautifulhair.com'}, 'evidence': {},
        'carriers': [{'platform': 'github', 'ref': 'jussray/Ayure-', 'role': 'canonical source', 'visibility': 'private'}],
        'display': {'group': 'Ideas & systems', 'accent': '#C98BFF', 'img': 'assets/w-fcr.jpg', 'alt': 'Founder systems command-center artwork', 'desc': 'An active private product build moving through its architecture and data layer.', 'tags': ['Product', 'Data', 'Architecture'], 'tag': 'A private product under active construction.', 'blurb': 'Ayure is tracked as an active company project while its product and runtime state continue to mature.', 'facts': [['Source', 'Private GitHub repository'], ['Stage', 'Active architecture build'], ['Public state', 'No public front door declared']]}
    },
]
for addition in additions:
    merge_named(worlds['worlds'], addition)

# Preserve the newer systems registry and enrich identity lineage only.
systems['generatedAt'] = now_iso()
for system in systems.get('systems', []):
    builder = system.get('builder', {})
    if builder.get('appId') == '6a9213ad92e06cfad8756b2b':
        system['lineage'] = [{'previousName': 'Untitled', 'relationship': 'renamed same Base44 app'}]
    if system.get('name') == 'Proof Core':
        system['aliases'] = ['Untitled (current Base44 app name)']
    if system.get('name') == 'Exact Match Engine':
        system['lineage'] = [{'repo': 'jussray/exact-match-engine-', 'relationship': 'empty public duplicate shell; not canonical'}]

WORLDS_PATH.write_text(json.dumps(worlds, indent=2, ensure_ascii=False) + '\n')
SYSTEMS_PATH.write_text(json.dumps(systems, indent=2, ensure_ascii=False) + '\n')

fetch_asset('https://screenshot2.lovable.dev/lovp_37zth2rn308449gxdy1v13tqhe/0ab259453c5d52af15a826fd599cec6e_1790828534534.png', ASSETS / 'w-truth-compass.png', ASSETS / 'w-fcr.jpg')
fetch_asset('https://screenshot2.lovable.dev/lovp_350v7xmdnk8sp8g0awnpe2mcsd/b27a923c7d40317214b873fccf664372_1790829330094.png', ASSETS / 'w-truth-weaver.png', ASSETS / 'w-fcr.jpg')
fetch_asset('https://screenshot2.lovable.dev/lovp_1qrsxn24ep9e5aswy6xh9p635f/840348371ed6da0faac80a3f44e4c76d_1790832790165.png', ASSETS / 'w-exact-match.png', ASSETS / 'w-fcr.jpg')

text = INDEX_PATH.read_text()
text = text.replace('A founder studio for a brighter tomorrow. Six worlds, one proof protocol.', 'A founder studio for a brighter tomorrow. Connected worlds, one proof protocol.')
text = text.replace('a 3×2 grid of project worlds with an inline detail drawer', 'a growing grid of project worlds with an inline detail drawer')

render_start = text.index('  var grid = document.getElementById("grid"), drawer = document.getElementById("drawer");')
live_marker = text.index('  var LIVE = {};', render_start)
render_block = '''  var grid = document.getElementById("grid"), drawer = document.getElementById("drawer");
  var cards = [], current = -1, RELATED = {};
  function renderWorldCard(w,i){
    w.tags = Array.isArray(w.tags) ? w.tags : [];
    w.facts = Array.isArray(w.facts) ? w.facts : [];
    var c = document.createElement("article"); c.className = "card"; c.style.setProperty("--w", w.w || "#8B5CF6");
    c.innerHTML =
      '<figure><img loading="'+(i<3?"eager":"lazy")+'" width="322" height="132"><span class="badge s-'+w.st+'">'+w.label+'</span></figure>'+
      '<div class="body"><span class="grp"></span><h3></h3><p class="desc"></p><div class="row"><div class="tags"></div>'+
      '<button class="go" type="button" aria-expanded="false" aria-controls="drawer" id="go-'+i+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></div></div>';
    var img = c.querySelector("img"); img.src = w.img; img.alt = w.alt || "";
    c.querySelector("h3").textContent = w.name; c.querySelector(".grp").textContent = w.group; c.querySelector(".desc").textContent = w.desc || "";
    var go = c.querySelector(".go"); go.setAttribute("aria-label","Open "+w.name);
    var t = c.querySelector(".tags"); w.tags.forEach(function(x){ var s=document.createElement("span"); s.textContent=x; t.appendChild(s); });
    c.addEventListener("click", function(e){ if(e.target.closest("a")) return; toggle(i); });
    go.addEventListener("click", function(e){ e.stopPropagation(); toggle(i); });
    grid.appendChild(c); cards.push(c);
  }
  WORLDS.forEach(function(w,i){ renderWorldCard(w,i); });
'''
text = text[:render_start] + render_block + text[live_marker:]

fetch_start = text.index('  fetch("data/worlds.json",{cache:"no-store"})')
fetch_end = text.index('  }).catch(function(){});', fetch_start) + len('  }).catch(function(){});')
fetch_block = '''  function worldFromRegistry(L){
    var p=L.display||{};
    return {name:L.name, group:p.group||"Ideas & systems", st:L.st||"building", label:L.label||"Building", w:p.accent||"#8B5CF6", img:p.img||"assets/w-fcr.jpg", alt:p.alt||"", desc:p.desc||"", tags:Array.isArray(p.tags)?p.tags:[], tag:p.tag||"", blurb:p.blurb||p.desc||"", facts:Array.isArray(p.facts)?p.facts:[], held:L.held||"Tracked · no public link yet", link:(L.link&&L.link.url)?[L.link.text||"Open",L.link.url]:null};
  }
  function systemWorld(S){
    var b=S.builder||{}, map={"Truth Weaver":["#B86BFF","assets/w-truth-weaver.png"],"Truth Compass":["#F2B90C","assets/w-truth-compass.png"],"Exact Match Engine":["#3BE3FF","assets/w-exact-match.png"],"Living Truth":["#F5C14B","assets/proof-scene.jpg"],"Proof Core":["#8B5CF6","assets/proof-scene.jpg"]};
    var visual=map[S.name]||["#8B5CF6","assets/w-fcr.jpg"], state=S.status==="published"?"live":"progress", label=S.status==="published"?"Live":(S.status==="repairing"?"Surface repair":(S.status==="prototype"?"Prototype":"Tracked"));
    var facts=[["Type","Standalone OS"],["Builder",b.provider||"Tracked"]];
    if(S.embeddedIn&&S.embeddedIn.length) facts.push(["Embedded in",S.embeddedIn.map(function(x){return x.name;}).join(" · ")]);
    if(S.lineage&&S.lineage.length) facts.push(["Lineage",S.lineage.map(function(x){return x.appName||x.previousName||x.repo||"tracked carrier";}).join(" · ")]);
    return {name:S.name,group:"Ideas & systems",st:state,label:label,w:visual[0],img:visual[1],alt:S.name+" product interface",desc:S.role||"Standalone portfolio system.",tags:["Standalone OS",b.provider||"System","Evidence"],tag:S.label||"Standalone portfolio system.",blurb:S.role||"Standalone portfolio system.",facts:facts,held:"Tracked standalone system · public link not re-observed",link:b.preview?["Open public build",b.preview]:null};
  }
  Promise.all([
    fetch("data/worlds.json",{cache:"no-store"}).then(function(r){return r.ok?r.json():null;}).catch(function(){return null;}),
    fetch("data/systems.json",{cache:"no-store"}).then(function(r){return r.ok?r.json():null;}).catch(function(){return null;})
  ]).then(function(res){
    var d=res[0], s=res[1];
    if(d&&d.worlds){
      d.worlds.forEach(function(L){
        LIVE[L.name]=L; var idx=WORLDS.findIndex(function(w){return w.name===L.name;});
        if(idx<0&&L.display){var added=worldFromRegistry(L); WORLDS.push(added); idx=WORLDS.length-1; renderWorldCard(added,idx);}
        if(idx<0)return; var w=WORLDS[idx];
        if(L.st&&L.label){w.st=L.st;w.label=L.label;var badge=cards[idx].querySelector(".badge");badge.className="badge s-"+L.st;badge.textContent=L.label;}
        if(L.link&&L.link.url){w.link=[L.link.text||"Open",L.link.url];w.held=null;}else if(L.held){w.held=L.held;w.link=null;}
      });
      if(d.company&&d.company.email)document.getElementById("mail").textContent=d.company.email;
      if(d.quotes&&d.quotes.length)setQuotes(d.quotes);
      var stamp=document.getElementById("liveStamp");if(stamp&&d.generatedAt)stamp.textContent="Status synced "+new Date(d.generatedAt).toUTCString().replace(/:\\d\\d GMT$/," UTC");
    }
    if(s&&s.systems){
      s.systems.filter(function(x){return x.public===true&&x.kind==="standalone_os";}).forEach(function(S){
        LIVE[S.name]=S;if(WORLDS.some(function(w){return w.name===S.name;}))return;var added=systemWorld(S);WORLDS.push(added);renderWorldCard(added,WORLDS.length-1);
      });
      (s.supportingSurfaces||[]).forEach(function(x){var p=WORLDS.find(function(w){return w.name===x.parent;}),b=x.builder||{};if(!p)return;p.facts.push(["Supporting surface",x.name+" · "+x.status]);if(b.preview){p.relatedLinks=p.relatedLinks||[];p.relatedLinks.push([x.name,b.preview]);}});
    }
    var n=document.querySelector('#filters .chip[data-group=""] .n');if(n)n.textContent=String(WORLDS.length).padStart(2,"0");
    var active=document.querySelector('#filters .chip[aria-pressed="true"]');if(active&&active.dataset.group){cards.forEach(function(c,j){c.hidden=WORLDS[j].group!==active.dataset.group;});}
    if(current>=0){var k=current;current=-1;open(k);}
  });'''
text = text[:fetch_start] + fetch_block + text[fetch_end:]
text = text.replace('document.getElementById("dIdx").textContent = "0"+(i+1)+" / 0"+WORLDS.length;', 'document.getElementById("dIdx").textContent = String(i+1).padStart(2,"0")+" / "+String(WORLDS.length).padStart(2,"0");')
text = text.replace('if(e.ci) rows.push(["CI on main", e.ci]);\n    return rows;', 'if(e.ci) rows.push(["CI on main", e.ci]);\n    if(L.carriers&&L.carriers.length) rows.push(["Tracked carriers", L.carriers.map(function(x){return x.name||x.ref||x.id||x.platform;}).join(" · ")]);\n    return rows;')
old_cta = '    if(w.link){ var a=document.createElement("a"); a.className="btn btn-violet"; a.href=w.link[1]; a.textContent=w.link[0]+" ↗"; c.appendChild(a); }\n    else { var s=document.createElement("span"); s.className="held"; s.textContent=w.held; c.appendChild(s); }'
new_cta = '    if(w.link){ var a=document.createElement("a"); a.className="btn btn-violet"; a.href=w.link[1]; a.textContent=w.link[0]+" ↗"; c.appendChild(a); }\n    else if(w.held){ var s=document.createElement("span"); s.className="held"; s.textContent=w.held; c.appendChild(s); }\n    (w.relatedLinks||[]).forEach(function(x){var a=document.createElement("a");a.className="btn btn-ghost";a.href=x[1];a.textContent=x[0]+" ↗";c.appendChild(a);});'
if old_cta not in text:
    raise SystemExit('CTA marker missing')
text = text.replace(old_cta, new_cta, 1)
INDEX_PATH.write_text(text)

verify = VERIFY_PATH.read_text()
root_line = "const ROOT = new URL('../site/', import.meta.url).pathname; const MIME = { '.html': 'text/html', '.jpg': 'image/jpeg', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };"
if root_line not in verify:
    raise SystemExit('verify root marker missing')
verify = verify.replace(root_line, root_line + "\nconst WR = JSON.parse(readFileSync(join(ROOT, 'data/worlds.json'), 'utf8')); const SR = JSON.parse(readFileSync(join(ROOT, 'data/systems.json'), 'utf8')); const PUBLIC_SYSTEMS = SR.systems.filter((s) => s.public === true && s.kind === 'standalone_os'); const EXPECTED = [...WR.worlds.map((w) => w.name), ...PUBLIC_SYSTEMS.map((s) => s.name)]; const IDEAS = [...WR.worlds.filter((w) => w.display?.group === 'Ideas & systems').map((w) => w.name), ...PUBLIC_SYSTEMS.map((s) => s.name)];", 1)
verify = verify.replace("  await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(600);", "  await page.goto(url, { waitUntil: 'load' }); await page.waitForFunction((n) => document.querySelectorAll('.card').length === n, EXPECTED.length); await page.waitForTimeout(250);")
verify = verify.replace("  say((await page.$$('.card')).length === 6, `${vp.n}: six worlds`);", "  say((await page.$$('.card')).length === EXPECTED.length, `${vp.n}: ${EXPECTED.length} canonical cards`);\n  const cardNames = await page.evaluate(() => [...document.querySelectorAll('.card h3')].map((e) => e.textContent));\n  say(['Truth Compass','Truth Weaver','Exact Match Engine','Living Truth','Proof Core','PromptOS','Ayure'].every((n) => cardNames.includes(n)), `${vp.n}: extended portfolio renders`);\n  say(!cardNames.some((n) => n.startsWith('ULTRATHINK')) && !cardNames.includes('Living Truth (Copy)') && !cardNames.includes('Sync Playtest Signups'), `${vp.n}: internal/copy/supporting carriers are not duplicate cards`);\n  say((await page.innerText('#filters .chip[data-group=\"\"] .n')) === String(EXPECTED.length).padStart(2,'0'), `${vp.n}: world count matches registries`);")
old_filter = "  say(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.card')].filter((c) => !c.hidden).map((c) => c.querySelector('h3').textContent))) === JSON.stringify(['Founder Control Room', 'Chief AI']), `${vp.n}: filter chips`);"
new_filter = "  say(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.card')].filter((c) => !c.hidden).map((c) => c.querySelector('h3').textContent))) === JSON.stringify(IDEAS), `${vp.n}: filter chips follow both registries`);\n  await page.locator('.card', { hasText: 'Truth Compass' }).click(); await page.waitForTimeout(150);\n  say((await page.innerText('#dName')) === 'Truth Compass', `${vp.n}: public system drawer opens`);\n  say(/lovable\\.app/.test((await page.getAttribute('#dCta a', 'href')) || ''), `${vp.n}: Lovable public carrier link renders`);\n  await page.keyboard.press('Escape'); await page.waitForTimeout(100);\n  await page.click('.chip[data-group=\"\"]'); await page.waitForTimeout(100);\n  await page.locator('.card', { hasText: 'Sync Party' }).click(); await page.waitForTimeout(150);\n  say(/Sync Playtest Signups/.test(await page.innerText('#dFacts')), `${vp.n}: Sync supporting surface stays nested`);\n  say(/lovable\\.app/.test((await page.locator('#dCta a').last().getAttribute('href')) || ''), `${vp.n}: nested Sync signup link renders`);\n  await page.keyboard.press('Escape'); await page.waitForTimeout(100);"
if old_filter not in verify:
    raise SystemExit('verify filter marker missing')
verify = verify.replace(old_filter, new_filter, 1)
VERIFY_PATH.write_text(verify)

# Static invariants before browser proof.
assert len(worlds['worlds']) == 15, len(worlds['worlds'])
assert len({w['name'] for w in worlds['worlds']}) == 15
public_systems = [s for s in systems['systems'] if s.get('public') is True and s.get('kind') == 'standalone_os']
assert len(public_systems) == 5, len(public_systems)
assert all(not s['name'].startswith('ULTRATHINK') for s in public_systems)
assert len(worlds['worlds']) + len(public_systems) == 20
print('prepared 15 portfolio worlds + 5 public standalone systems = 20 canonical cards')
