import json
import shutil
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / 'site/data/worlds.json'
INDEX = ROOT / 'site/index.html'
VERIFY = ROOT / 'scripts/verify-site.mjs'
ASSETS = ROOT / 'site/assets'


def now_iso():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00', 'Z')


def add_or_merge(worlds, incoming):
    for world in worlds:
        if world.get('name') == incoming['name']:
            evidence = world.get('evidence', {})
            world.update(incoming)
            world['evidence'] = evidence
            return
    worlds.append(incoming)


def download_or_fallback(url, destination, fallback):
    try:
        urllib.request.urlretrieve(url, destination)
    except Exception:
        shutil.copyfile(fallback, destination)


data = json.loads(REGISTRY.read_text())
data['generatedAt'] = now_iso()
data['source'] = "founder-declared canonical portfolio registry; evidence fields are filled by Founder Control Room's juss-and-co-status-sync workflow"
data['registryVersion'] = 2
data['canonicalization'] = 'One canonical project identity per public world; builder copies, prototypes and signup surfaces are tracked as carriers/aliases, not duplicate worlds.'

group_map = {
    "Se'kret Bip": 'People & belonging',
    'Founder Control Room': 'Ideas & systems',
    'Chief AI': 'Ideas & systems',
    'Juss Beautiful Hair': 'People & belonging',
    'StoryEngine': 'Stories & play',
    'Sync Party': 'Stories & play',
}
for world in data['worlds']:
    if world['name'] in group_map:
        world.setdefault('display', {})['group'] = group_map[world['name']]

additions = [
    {
        'name': 'Bip Jr', 'repo': 'jussray/Bip-Jr', 'st': 'building', 'label': 'Private build',
        'held': 'Private build · tracked internally',
        'contact': {'email': 'hello@jussbeautifulhair.com'}, 'evidence': {},
        'carriers': [{'platform': 'github', 'ref': 'jussray/Bip-Jr', 'role': 'source', 'visibility': 'private'}],
        'display': {
            'group': 'People & belonging', 'accent': '#9A7CFF', 'img': 'assets/w-bip.jpg', 'alt': 'Se’kret Bip family-world artwork',
            'desc': 'The younger-family branch of the Se’kret Bip universe.', 'tags': ['Family', 'Kids', 'Belonging'],
            'tag': 'A younger doorway into the Bip universe.', 'blurb': 'A family-facing branch built around belonging, communication and age-appropriate connection.',
            'facts': [['Source', 'Private GitHub repository tracked'], ['Relationship', 'Part of the wider Se’kret Bip family'], ['Public state', 'No public front door declared']]
        }
    },
    {
        'name': 'PromptOS', 'repo': 'jussray/promptos', 'st': 'building', 'label': 'Building',
        'link': {'text': 'Follow the build', 'url': 'https://github.com/jussray/promptos'},
        'contact': {'github': 'https://github.com/jussray/promptos', 'email': 'hello@jussbeautifulhair.com'}, 'evidence': {},
        'carriers': [{'platform': 'github', 'ref': 'jussray/promptos', 'role': 'canonical source', 'visibility': 'public'}],
        'display': {
            'group': 'Ideas & systems', 'accent': '#7C5CFF', 'img': 'assets/w-fcr.jpg', 'alt': 'Founder systems command-center artwork',
            'desc': 'A governed prompt, skill and mission runtime for turning founder intent into bounded work.', 'tags': ['AI', 'Prompts', 'Governance'],
            'tag': 'Intent becomes bounded missions.', 'blurb': 'A portable instruction and skill runtime that keeps intent, authority, execution and proof separate.',
            'facts': [['Role', 'Prompt + skill runtime'], ['Boundary', 'Consequential authority stays outside the prompt layer'], ['Source', 'Public GitHub build']]
        }
    },
    {
        'name': 'ULTRATHINK', 'st': 'progress', 'label': 'Internal system', 'held': 'Internal system · tracked here',
        'contact': {'email': 'hello@jussbeautifulhair.com'}, 'evidence': {},
        'aliases': ['Untitled (former name of carrier 6a9213ad92e06cfad8756b2b)'],
        'carriers': [
            {'platform': 'base44', 'id': '6a9213ad92e06cfad8756b2b', 'name': 'ULTRATHINK', 'role': 'operator/FCR continuity carrier', 'previous_name': 'Untitled'},
            {'platform': 'base44', 'id': '6a93e49bb1804a2648534bdf', 'name': 'ULTRATHINK', 'role': 'world-radar, evidence and candidate engine'},
        ],
        'display': {
            'group': 'Ideas & systems', 'accent': '#00D8FF', 'img': 'assets/w-fcr.jpg', 'alt': 'Founder systems command-center artwork',
            'desc': 'A higher-order reasoning and continuity system across the portfolio.', 'tags': ['Reasoning', 'Continuity', 'AI'],
            'tag': 'Challenge, reconcile, continue.', 'blurb': 'Two Base44 carriers serve one canonical ULTRATHINK system: portfolio continuity on one side, evidence and candidate reasoning on the other.',
            'facts': [['Base44', '2 tracked carriers · 1 canonical system'], ['Lineage', 'One carrier was renamed from Untitled to ULTRATHINK'], ['Public state', 'Internal system; no public front door declared']]
        }
    },
    {
        'name': 'Living Truth', 'st': 'progress', 'label': 'Tracked build',
        'held': 'Base44 build · public runtime not re-verified in this change',
        'contact': {'email': 'hello@jussbeautifulhair.com'}, 'evidence': {}, 'aliases': ['Think Proof Core'],
        'carriers': [
            {'platform': 'base44', 'id': '6a94a7bfcbb4366d37894ffd', 'name': 'Living Truth', 'role': 'canonical Think Proof Core / Living Truth lab'},
            {'platform': 'base44', 'id': '6a94a9bdf1ac72972e1d1470', 'name': 'Living Truth (Copy)', 'role': 'experimental duplicate; not a separate public world'},
            {'platform': 'base44', 'id': '6a94aed27e712e8fd5058c2f', 'name': 'Untitled', 'role': 'minimal Proof Core prototype shell; tracked as lineage, not a separate world'},
        ],
        'display': {
            'group': 'Ideas & systems', 'accent': '#F5C14B', 'img': 'assets/proof-scene.jpg', 'alt': 'Juss & Co proof-system artwork',
            'desc': 'A truth and reconciliation lab for claims, evidence, continuity and proof.', 'tags': ['Truth', 'Evidence', 'Continuity'],
            'tag': 'Living truth, not frozen claims.', 'blurb': 'The canonical Base44 truth lab. Its copy and minimal prototype remain visible as lineage without inflating the portfolio count.',
            'facts': [['Canonical carrier', 'Living Truth on Base44'], ['Aliases', 'Think Proof Core; Copy + Untitled prototype tracked underneath'], ['Boundary', 'Truth evidence does not create standing execution authority']]
        }
    },
    {
        'name': 'Truth Compass', 'repo': 'jussray/truth-compass', 'st': 'live', 'label': 'Public build',
        'link': {'text': 'Open public build', 'url': 'https://id-preview--0fa1fd0f-9ec2-4bf3-9415-79bbfd4b3917.lovable.app'},
        'contact': {'site': 'https://id-preview--0fa1fd0f-9ec2-4bf3-9415-79bbfd4b3917.lovable.app', 'email': 'hello@jussbeautifulhair.com'}, 'evidence': {},
        'carriers': [
            {'platform': 'lovable', 'id': '0fa1fd0f-9ec2-4bf3-9415-79bbfd4b3917', 'name': 'Truth Compass', 'role': 'published public product', 'latest_commit': '4675f4ea5a1a5f132db55f23f663c25411233b21'},
            {'platform': 'github', 'ref': 'jussray/truth-compass', 'role': 'source mirror', 'visibility': 'private'},
        ],
        'display': {
            'group': 'Ideas & systems', 'accent': '#F2B90C', 'img': 'assets/w-truth-compass.png', 'alt': 'Truth Compass interface with a dark evidence dashboard and gold navigation system',
            'desc': 'A control surface for claims, evidence, continuity and reconciliation state.', 'tags': ['Truth', 'Evidence', 'Decisions'],
            'tag': 'Find the truth. Navigate what is next.', 'blurb': 'A living truth map that keeps evidence, change and decision state in one navigable system.',
            'facts': [['Lovable', 'Published public build'], ['GitHub', 'Private source carrier tracked separately'], ['Role', 'Claims + evidence + continuity control surface']]
        }
    },
    {
        'name': 'Truth Weaver', 'repo': 'jussray/truth-weaver', 'st': 'live', 'label': 'Public build',
        'link': {'text': 'Open public build', 'url': 'https://id-preview--8ef43cd3-8d93-4494-a685-59ce0f795614.lovable.app'},
        'contact': {'site': 'https://id-preview--8ef43cd3-8d93-4494-a685-59ce0f795614.lovable.app', 'email': 'hello@jussbeautifulhair.com'}, 'evidence': {},
        'carriers': [
            {'platform': 'lovable', 'id': '8ef43cd3-8d93-4494-a685-59ce0f795614', 'name': 'Truth Weaver', 'role': 'published public product'},
            {'platform': 'github', 'ref': 'jussray/truth-weaver', 'role': 'source', 'visibility': 'private'},
        ],
        'display': {
            'group': 'Ideas & systems', 'accent': '#B86BFF', 'img': 'assets/w-truth-weaver.png', 'alt': 'Truth Weaver product interface screenshot',
            'desc': 'A reasoning system that separates evidence from inference and stress-tests founder hypotheses.', 'tags': ['Reasoning', 'Red team', 'Evidence'],
            'tag': 'Weave evidence into stronger decisions.', 'blurb': 'Competing hypotheses, evidence lanes and candidate tests turn uncertain ideas into safer next moves.',
            'facts': [['Lovable', 'Published public build'], ['GitHub', 'Private source carrier tracked'], ['Role', 'Reasoning, challenge and candidate testing']]
        }
    },
    {
        'name': 'Exact Match Engine', 'repo': 'jussray/exact-match-engine', 'st': 'live', 'label': 'Public build',
        'link': {'text': 'Open public build', 'url': 'https://id-preview--e1436754-7a41-40bb-927c-c9a0e081e70b.lovable.app'},
        'contact': {'site': 'https://id-preview--e1436754-7a41-40bb-927c-c9a0e081e70b.lovable.app', 'email': 'hello@jussbeautifulhair.com'}, 'evidence': {},
        'tracking_note': 'Lovable and GitHub carriers are tracked separately; equivalence is not assumed without reconciliation proof.',
        'carriers': [
            {'platform': 'lovable', 'id': 'e1436754-7a41-40bb-927c-c9a0e081e70b', 'name': 'Exact Match Engine', 'role': 'published public product'},
            {'platform': 'github', 'ref': 'jussray/exact-match-engine', 'role': 'private source carrier', 'visibility': 'private'},
            {'platform': 'github', 'ref': 'jussray/exact-match-engine-', 'role': 'empty public duplicate shell; not canonical', 'visibility': 'public'},
        ],
        'display': {
            'group': 'Ideas & systems', 'accent': '#3BE3FF', 'img': 'assets/w-exact-match.png', 'alt': 'Exact Match Engine product interface screenshot',
            'desc': 'A deterministic reconciliation engine for comparing project claims with observed evidence.', 'tags': ['Reconciliation', 'Evidence', 'Control'],
            'tag': 'Expected state meets observed state.', 'blurb': 'A focused engine for exact-version comparison, mismatch receipts and evidence-bound reconciliation.',
            'facts': [['Lovable', 'Published public build'], ['GitHub', 'Private source tracked separately'], ['Boundary', 'Carrier equivalence is not assumed without proof']]
        }
    },
    {
        'name': 'SolContinuity', 'repo': 'jussray/solcontinuity', 'st': 'building', 'label': 'Building',
        'link': {'text': 'Follow the build', 'url': 'https://github.com/jussray/solcontinuity'},
        'contact': {'github': 'https://github.com/jussray/solcontinuity', 'email': 'hello@jussbeautifulhair.com'}, 'evidence': {},
        'carriers': [{'platform': 'github', 'ref': 'jussray/solcontinuity', 'role': 'canonical source', 'visibility': 'public'}],
        'display': {
            'group': 'Ideas & systems', 'accent': '#14F195', 'img': 'assets/w-fcr.jpg', 'alt': 'Founder systems command-center artwork',
            'desc': 'A continuity system for carrying verified state across Solana-linked work.', 'tags': ['Solana', 'Continuity', 'Proof'],
            'tag': 'Continuity that survives handoffs.', 'blurb': 'A portfolio experiment in preserving state, evidence and continuity across decentralized workflows.',
            'facts': [['Source', 'Public GitHub build'], ['Focus', 'Continuity + proof'], ['Stage', 'Active build']]
        }
    },
    {
        'name': 'Untold Stories', 'repo': 'jussray/untold-stories-storefront', 'st': 'building', 'label': 'Private build',
        'held': 'Private storefront build · tracked internally', 'contact': {'email': 'hello@jussbeautifulhair.com'}, 'evidence': {},
        'carriers': [{'platform': 'github', 'ref': 'jussray/untold-stories-storefront', 'role': 'storefront source', 'visibility': 'private'}],
        'display': {
            'group': 'Stories & play', 'accent': '#FF8A5B', 'img': 'assets/w-story.jpg', 'alt': 'Story and filmmaking world artwork',
            'desc': 'A storefront world for stories that deserve a place to live.', 'tags': ['Stories', 'Commerce', 'Culture'],
            'tag': 'Stories become tangible worlds.', 'blurb': 'A private storefront build connecting narrative, culture and commerce.',
            'facts': [['Source', 'Private GitHub storefront'], ['Stage', 'Building'], ['Public state', 'No public front door declared']]
        }
    },
    {
        'name': 'SWEATS', 'repo': 'jussray/Sweats', 'st': 'building', 'label': 'Private build',
        'held': 'Private brand build · tracked internally', 'contact': {'email': 'hello@jussbeautifulhair.com'}, 'evidence': {},
        'carriers': [{'platform': 'github', 'ref': 'jussray/Sweats', 'role': 'brand source', 'visibility': 'private'}],
        'display': {
            'group': 'People & belonging', 'accent': '#E8E6E3', 'img': 'assets/w-jbh.jpg', 'alt': 'Fashion and lifestyle world artwork',
            'desc': 'A soft-luxury athleisure brand and buyer-psychology experiment.', 'tags': ['Fashion', 'Brand', 'Commerce'],
            'tag': 'Soft luxury with a point of view.', 'blurb': 'An apparel experiment built to test brand identity, buyer psychology and real demand.',
            'facts': [['Source', 'Private GitHub build'], ['Category', 'Athleisure / fashion'], ['Stage', 'Building']]
        }
    },
    {
        'name': 'SleepWealth Agent', 'repo': 'jussray/SleepWealth-Agent', 'st': 'building', 'label': 'Building',
        'link': {'text': 'Follow the build', 'url': 'https://github.com/jussray/SleepWealth-Agent'},
        'contact': {'github': 'https://github.com/jussray/SleepWealth-Agent', 'email': 'hello@jussbeautifulhair.com'}, 'evidence': {},
        'carriers': [{'platform': 'github', 'ref': 'jussray/SleepWealth-Agent', 'role': 'canonical source', 'visibility': 'public'}],
        'display': {
            'group': 'People & belonging', 'accent': '#6CCFF6', 'img': 'assets/w-bip.jpg', 'alt': 'Calm night-world artwork',
            'desc': 'A public agent experiment in the Juss portfolio.', 'tags': ['Agents', 'Automation', 'Experiment'],
            'tag': 'An agent build under active exploration.', 'blurb': 'A public experimental agent project, tracked here without claiming more than the source proves.',
            'facts': [['Source', 'Public GitHub repository'], ['Stage', 'Active experiment'], ['Claims', 'Runtime impact not promoted without proof']]
        }
    },
    {
        'name': 'Think Tank', 'repo': 'jussray/THINK-TANK', 'st': 'building', 'label': 'Building',
        'link': {'text': 'Follow the build', 'url': 'https://github.com/jussray/THINK-TANK'},
        'contact': {'github': 'https://github.com/jussray/THINK-TANK', 'email': 'hello@jussbeautifulhair.com'}, 'evidence': {},
        'carriers': [{'platform': 'github', 'ref': 'jussray/THINK-TANK', 'role': 'canonical source', 'visibility': 'public'}],
        'display': {
            'group': 'Ideas & systems', 'accent': '#F5C14B', 'img': 'assets/w-fcr.jpg', 'alt': 'Founder systems command-center artwork',
            'desc': 'A public idea-and-experiment workspace for exploring what should exist next.', 'tags': ['Ideas', 'Research', 'Experiments'],
            'tag': 'A place to pressure-test the next idea.', 'blurb': 'A compact public workspace for turning rough ideas into things that can be challenged and tested.',
            'facts': [['Source', 'Public GitHub repository'], ['Stage', 'Building'], ['Role', 'Idea + experiment workspace']]
        }
    },
    {
        'name': 'Alexa Commerce Engine', 'repo': 'jussray/alexa-commerce-engine-', 'st': 'building', 'label': 'Private build',
        'held': 'Private commerce build · tracked internally', 'contact': {'email': 'hello@jussbeautifulhair.com'}, 'evidence': {},
        'carriers': [{'platform': 'github', 'ref': 'jussray/alexa-commerce-engine-', 'role': 'canonical source', 'visibility': 'private'}],
        'display': {
            'group': 'Ideas & systems', 'accent': '#4CB5FF', 'img': 'assets/w-jbh.jpg', 'alt': 'Commerce world artwork',
            'desc': 'A private commerce-engine project inside the Juss portfolio.', 'tags': ['Commerce', 'Automation', 'Systems'],
            'tag': 'Commerce workflows as a system.', 'blurb': 'A private engine build exploring reusable commerce and product-operation workflows.',
            'facts': [['Source', 'Private GitHub repository'], ['Stage', 'Building'], ['Public state', 'No public front door declared']]
        }
    },
    {
        'name': 'Ayure', 'repo': 'jussray/Ayure-', 'st': 'building', 'label': 'Private build',
        'held': 'Private product build · tracked internally', 'contact': {'email': 'hello@jussbeautifulhair.com'}, 'evidence': {},
        'carriers': [{'platform': 'github', 'ref': 'jussray/Ayure-', 'role': 'canonical source', 'visibility': 'private'}],
        'display': {
            'group': 'Ideas & systems', 'accent': '#C98BFF', 'img': 'assets/w-fcr.jpg', 'alt': 'Founder systems command-center artwork',
            'desc': 'An active private product build moving through its architecture and data layer.', 'tags': ['Product', 'Data', 'Architecture'],
            'tag': 'A private product under active construction.', 'blurb': 'Ayure is tracked as an active company project while its product and runtime state continue to mature.',
            'facts': [['Source', 'Private GitHub repository'], ['Stage', 'Active architecture build'], ['Public state', 'No public front door declared']]
        }
    },
]

additions.append({
    'name': 'Sync Party',
    'carriers': [
        {'platform': 'github', 'ref': 'jussray/sync-party-game', 'role': 'canonical game source', 'visibility': 'public'},
        {'platform': 'lovable', 'id': '06f8665b-2f48-409a-a2d7-ec60362808f2', 'name': 'Sync Playtest Signups', 'role': 'published playtest-signup carrier; not a separate world', 'public_preview': 'https://id-preview--06f8665b-2f48-409a-a2d7-ec60362808f2.lovable.app'},
    ]
})

for incoming in additions:
    add_or_merge(data['worlds'], incoming)

REGISTRY.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n')

# Pull the Lovable product screenshots into first-party site assets. Fallbacks preserve the build.
download_or_fallback(
    'https://screenshot2.lovable.dev/lovp_37zth2rn308449gxdy1v13tqhe/0ab259453c5d52af15a826fd599cec6e_1790828534534.png',
    ASSETS / 'w-truth-compass.png', ASSETS / 'w-fcr.jpg')
download_or_fallback(
    'https://screenshot2.lovable.dev/lovp_350v7xmdnk8sp8g0awnpe2mcsd/b27a923c7d40317214b873fccf664372_1790829330094.png',
    ASSETS / 'w-truth-weaver.png', ASSETS / 'w-fcr.jpg')
download_or_fallback(
    'https://screenshot2.lovable.dev/lovp_1qrsxn24ep9e5aswy6xh9p635f/840348371ed6da0faac80a3f44e4c76d_1790832790165.png',
    ASSETS / 'w-exact-match.png', ASSETS / 'w-fcr.jpg')

text = INDEX.read_text()
text = text.replace('A founder studio for a brighter tomorrow. Six worlds, one proof protocol.', 'A founder studio for a brighter tomorrow. Connected worlds, one proof protocol.')
text = text.replace('a 3×2 grid of project worlds with an inline detail drawer', 'a growing grid of project worlds with an inline detail drawer')

render_start = text.index('  var grid = document.getElementById("grid"), drawer = document.getElementById("drawer");')
live_marker = text.index('  var LIVE = {};', render_start)
render_block = '''  var grid = document.getElementById("grid"), drawer = document.getElementById("drawer");
  var cards = [], current = -1;
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
    return {
      name:L.name, group:p.group||"Ideas & systems", st:L.st||"building", label:L.label||"Building",
      w:p.accent||"#8B5CF6", img:p.img||"assets/w-fcr.jpg", alt:p.alt||"",
      desc:p.desc||"", tags:Array.isArray(p.tags)?p.tags:[], tag:p.tag||"", blurb:p.blurb||p.desc||"",
      facts:Array.isArray(p.facts)?p.facts:[], held:L.held||"Tracked · no public link yet",
      link:(L.link&&L.link.url)?[L.link.text||"Open",L.link.url]:null
    };
  }
  fetch("data/worlds.json",{cache:"no-store"}).then(function(r){ return r.ok ? r.json() : null; }).then(function(d){
    if(!d || !d.worlds) return;
    d.worlds.forEach(function(L){
      LIVE[L.name] = L;
      var idx = -1;
      for(var i=0;i<WORLDS.length;i++){ if(WORLDS[i].name===L.name){ idx=i; break; } }
      if(idx<0 && L.display){
        var added=worldFromRegistry(L); WORLDS.push(added); idx=WORLDS.length-1; renderWorldCard(added,idx);
      }
      if(idx<0) return;
      var w=WORLDS[idx];
      if(L.st && L.label){ w.st=L.st; w.label=L.label; var b=cards[idx].querySelector(".badge"); b.className="badge s-"+L.st; b.textContent=L.label; }
      if(L.link && L.link.url){ w.link=[L.link.text||"Open", L.link.url]; w.held=null; } else if(L.held){ w.held=L.held; w.link=null; }
    });
    var n=document.querySelector('#filters .chip[data-group=""] .n'); if(n) n.textContent=String(WORLDS.length).padStart(2,"0");
    if(d.company && d.company.email) document.getElementById("mail").textContent = d.company.email;
    if(d.quotes && d.quotes.length) setQuotes(d.quotes);
    var stamp=document.getElementById("liveStamp"); if(stamp && d.generatedAt) stamp.textContent="Status synced "+new Date(d.generatedAt).toUTCString().replace(/:\\d\\d GMT$/," UTC");
    if(current>=0){ var k=current; current=-1; open(k); }
  }).catch(function(){});'''
text = text[:fetch_start] + fetch_block + text[fetch_end:]
text = text.replace(
    'document.getElementById("dIdx").textContent = "0"+(i+1)+" / 0"+WORLDS.length;',
    'document.getElementById("dIdx").textContent = String(i+1).padStart(2,"0")+" / "+String(WORLDS.length).padStart(2,"0");')
INDEX.write_text(text)

verify = VERIFY.read_text()
old_root = "const ROOT = new URL('../site/', import.meta.url).pathname; const MIME = { '.html': 'text/html', '.jpg': 'image/jpeg', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };"
new_root = old_root + "\nconst REGISTRY = JSON.parse(readFileSync(join(ROOT, 'data/worlds.json'), 'utf8')); const EXPECTED = REGISTRY.worlds.map((w) => w.name); const IDEAS = REGISTRY.worlds.filter((w) => w.display?.group === 'Ideas & systems').map((w) => w.name);"
if old_root not in verify:
    raise SystemExit('verify-site root marker missing')
verify = verify.replace(old_root, new_root, 1)
verify = verify.replace(
    "  await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(600);",
    "  await page.goto(url, { waitUntil: 'load' }); await page.waitForFunction((n) => document.querySelectorAll('.card').length === n, EXPECTED.length); await page.waitForTimeout(250);")
verify = verify.replace(
    "  say((await page.$$('.card')).length === 6, `${vp.n}: six worlds`);",
    "  say((await page.$$('.card')).length === EXPECTED.length, `${vp.n}: ${EXPECTED.length} canonical worlds`);\n  const cardNames = await page.evaluate(() => [...document.querySelectorAll('.card h3')].map((e) => e.textContent));\n  say(['Truth Compass','Truth Weaver','Exact Match Engine','ULTRATHINK','Living Truth','PromptOS'].every((n) => cardNames.includes(n)), `${vp.n}: external-builder + core worlds render`);\n  say(!cardNames.includes('Living Truth (Copy)') && !cardNames.includes('Sync Playtest Signups'), `${vp.n}: builder aliases do not duplicate public worlds`);\n  say((await page.innerText('#filters .chip[data-group=\"\"] .n')) === String(EXPECTED.length).padStart(2,'0'), `${vp.n}: world count badge matches registry`);")
old_filter = "  say(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.card')].filter((c) => !c.hidden).map((c) => c.querySelector('h3').textContent))) === JSON.stringify(['Founder Control Room', 'Chief AI']), `${vp.n}: filter chips`);"
new_filter = "  say(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.card')].filter((c) => !c.hidden).map((c) => c.querySelector('h3').textContent))) === JSON.stringify(IDEAS), `${vp.n}: filter chips follow registry groups`);\n  await page.locator('.card', { hasText: 'Truth Compass' }).click(); await page.waitForTimeout(150);\n  say((await page.innerText('#dName')) === 'Truth Compass', `${vp.n}: new registry world opens`);\n  say(/lovable\\.app/.test((await page.getAttribute('#dCta a', 'href')) || ''), `${vp.n}: public Lovable carrier link renders`);\n  await page.keyboard.press('Escape'); await page.waitForTimeout(100);"
if old_filter not in verify:
    raise SystemExit('verify-site filter marker missing')
verify = verify.replace(old_filter, new_filter, 1)
VERIFY.write_text(verify)

# Self-checks that do not require Playwright.
json.loads(REGISTRY.read_text())
assert len(data['worlds']) == 20, len(data['worlds'])
assert len({w['name'] for w in data['worlds']}) == 20
assert 'Living Truth (Copy)' not in {w['name'] for w in data['worlds']}
assert 'Sync Playtest Signups' not in {w['name'] for w in data['worlds']}
print('registry repair prepared: 20 canonical worlds')
