import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gitBlobSha, extractScrapedRegistry, verifyWorldRegistry, verifySiteMarkdown, verifyDestinationMarkdown, verifyGamesHubMarkdown, verifyBipContent, assertSha, assertReleaseContext, verifyReceiverHealthHtml, runProof, createQuickActionPacer, cfRequest, assertFinalDestination, verifyHtmlSourceMatch, makePartialReadbackWitness } from './verify-provider-site.mjs';

const site = `---\ntitle: "Juss & Co"\n---\nTurn thoughts into living works.\nExplore our products\nEnter the portfolio\nScan to explore www.jussco.company`;

test('Git blob hash matches known Git SHA-1 format', () => {
  assert.equal(gitBlobSha(Buffer.from('hello\n')), 'ce013625030ba8dba906f756967f9e9ca394464a');
  assert.notEqual(gitBlobSha('hello'), gitBlobSha('hello\n'));
});

test('registry scraper requires a full unique pre element', () => {
  assert.equal(extractScrapedRegistry([{selector:'pre',results:[{text:'{"ok":true}'}]}]), '{"ok":true}');
  assert.throws(()=>extractScrapedRegistry([{selector:'pre',results:[]}]), /exactly one/);
  assert.throws(()=>extractScrapedRegistry([{selector:'pre',results:[{text:'abc'},{text:'def'}]}]), /exactly one/);
});

test('world registry preserves standalone Bip and preview truth', () => {
  const base={worlds:[{name:"Se'kret Bip",st:'soon',label:'Opening soon',held:'Opening soon · no public link yet',contact:{site:'https://sekretbip.net'}}]};
  assert.doesNotThrow(()=>verifyWorldRegistry(JSON.stringify(base)));
  base.worlds[0].label='Live signup';
  assert.throws(()=>verifyWorldRegistry(JSON.stringify(base)), /gated upcoming product/);
});

test('public company QR and honest upcoming project state must appear in browser markdown', () => {
  assert.doesNotThrow(()=>verifySiteMarkdown(site));
  assert.throws(()=>verifySiteMarkdown(site.replace('Scan to explore','')),/QR destination/);
  assert.throws(()=>verifySiteMarkdown(site.replace('Explore our products','')),/landing navigation/);
  assert.throws(()=>verifySiteMarkdown('Just a moment... '+site),/Cloudflare challenge/);
});

test('standalone destinations reject challenge and unrelated pages',()=>{
  assert.doesNotThrow(()=>verifyDestinationMarkdown(`---\ntitle: "Se'kret Bip"\n---`,'bip'));
  assert.doesNotThrow(()=>verifyDestinationMarkdown(`---\ntitle: "Juss & Co. Games | Choose your adventure"\n---`,'games'));
  assert.throws(()=>verifyDestinationMarkdown('---\ntitle: "Sign in ・ Cloudflare Access"\n---','bip'),/title mismatch/);
  assert.throws(()=>verifyDestinationMarkdown('Origin DNS error','games'),/challenge or DNS/);
});

test('production Games hub proof requires the actual Game Hub heading, playable SYNC and honest unreleased status',()=>{
  const valid='---\ntitle: "Juss & Co. Games | SYNC Party, Chat SYNC & Lovable SYNC"\n---\n# Game Hub\n[Play Live SYNC ↗](https://sync.jussco.company/)\nLUMORA · In development\nLast Laugh · Private prototype';
  assert.doesNotThrow(()=>verifyGamesHubMarkdown(valid));
  assert.throws(()=>verifyGamesHubMarkdown(valid.replace('# Game Hub','# Choose your next adventure.')),/Game Hub heading/);
  assert.throws(()=>verifyGamesHubMarkdown(valid.replace('https://sync.jussco.company/','https://other.invalid/')),/live SYNC destination/);
  assert.throws(()=>verifyGamesHubMarkdown(valid.replace('In development','Available now')),/unreleased/);
  assert.throws(()=>verifyGamesHubMarkdown(valid.replace('Private prototype','Live now')),/unreleased/);
});

test('exact head rejects prefixes and invalid identities',()=>{
  assert.equal(assertSha('a'.repeat(40)),'a'.repeat(40));
  assert.throws(()=>assertSha('a'.repeat(7)),/40-character/);
});

test('Bip entrance requires real rendered welcome controls and advances to age setup',()=>{
  const welcome='<!DOCTYPE html><html><body><div data-testid="web-welcome-shell"></div><button data-testid="web-welcome-enter"></button><button data-testid="web-welcome-sign-in"></button></body></html>';
  const age='<!DOCTYPE html><html><body>How old are you? <button>Choose an age bucket</button> <a>I\'m a parent</a></body></html>';
  assert.doesNotThrow(()=>verifyBipContent(welcome,'welcome'));
  assert.doesNotThrow(()=>verifyBipContent(age,'age'));
  assert.throws(()=>verifyBipContent('<!DOCTYPE html><body></body>','welcome'),/welcome entry controls/);
  assert.throws(()=>verifyBipContent(welcome,'age'),/age-assurance/);
  assert.throws(()=>verifyBipContent('<!DOCTYPE html><title>Sign in ・ Cloudflare Access</title>','welcome'),/access challenge/);
  assert.throws(()=>verifyBipContent('---\ntitle: "Se\'kret Bip"\n---','welcome'),/no rendered HTML/);
});


test('production witness fails closed when provider credentials are missing',async()=>{
  const env={GITHUB_SHA:'a'.repeat(40),GITHUB_REF:'refs/heads/main',GITHUB_EVENT_NAME:'workflow_dispatch'};
  await assert.rejects(()=>runProof({env}),/Missing scoped Cloudflare/);
});

test('production witness accepts main push and manual main dispatch only',()=>{
  assert.equal(assertReleaseContext({GITHUB_REF:'refs/heads/main',GITHUB_EVENT_NAME:'push'}),true);
  assert.equal(assertReleaseContext({GITHUB_REF:'refs/heads/main',GITHUB_EVENT_NAME:'workflow_dispatch'}),true);
  for (const [ref,event] of [
    ['refs/heads/feature','push'],['refs/heads/feature','workflow_dispatch'],
    ['refs/heads/main','pull_request'],['refs/heads/main','schedule']
  ]) assert.throws(()=>assertReleaseContext({GITHUB_REF:ref,GITHUB_EVENT_NAME:event}),/only after main push/);
});

test('provider health proof requires live HTML and actual 204 response', () => {
  const valid = '<!doctype html><html lang="en" data-receiver-health="204"><body></body></html>';
  assert.equal(verifyReceiverHealthHtml(valid), true);
  for (const invalid of [
    '<!doctype html><html data-receiver-health="503"></html>',
    '<!doctype html><html data-receiver-health="400"></html>',
    '<!doctype html><html data-receiver-health="network-error"></html>',
    '<!doctype html><html></html>',
    'HTTP 204 without HTML',
  ]) assert.throws(() => verifyReceiverHealthHtml(invalid), /health probe|rendered HTML/);
});


test('rate limiter spaces actions to protect Cloudflare Free quota',async()=>{
  let clock=100;const delays=[];
  const pace=createQuickActionPacer({intervalMs:11000,now:()=>clock,sleep:async ms=>{delays.push(ms);clock+=ms}});
  await pace();await pace();await pace();
  assert.deepEqual(delays,[11000,11000]);
});

test('provider HTTP 200 must not hide a failing target-page HTTP status',async()=>{
  const fake=async()=>({ok:true,status:200,json:async()=>({success:true,meta:{status:503},result:'<html>Looks fine</html>'})});
  await assert.rejects(()=>cfRequest({accountId:'a'.repeat(32),token:'fake',endpoint:'content',body:{url:'https://jussco.company'},fetchImpl:fake}),/target content: HTTP 503/);
});

test('provider HTTP 429 retries with bounded backoff, without leaking token',async()=>{
  let n=0;const sleeps=[];
  const fake=async()=>{
    n++;
    if(n===1)return {ok:false,status:429,headers:{get:()=> '15'}};
    return {ok:true,status:200,json:async()=>({success:true,meta:{status:200,finalUrl:'https://jussco.company'},result:'public render'})};
  };
  const value=await cfRequest({accountId:'b'.repeat(32),token:'fake',endpoint:'markdown',body:{url:'https://jussco.company'},fetchImpl:fake,sleep:async ms=>sleeps.push(ms)});
  assert.equal(value,'public render');assert.equal(n,2);assert.deepEqual(sleeps,[15000]);
});

test('live final destinations are bound to approved public origins',()=>{
  assert.doesNotThrow(()=>assertFinalDestination('https://jussco.company/','https://jussco.company/'));
  assert.doesNotThrow(()=>assertFinalDestination('https://www.jussco.company/','https://www.jussco.company/'));
  assert.doesNotThrow(()=>assertFinalDestination('https://games.jussco.company/','https://games.jussco.company/'));
  assert.doesNotThrow(()=>assertFinalDestination('https://sekretbip.jussco.company/','https://sekretbip.net/'));
  assert.throws(()=>assertFinalDestination('https://jussco.company/','https://other.example/'),/unexpected destination/);
  assert.throws(()=>assertFinalDestination('https://sekretbip.jussco.company/','https://attacker.example/'),/unexpected destination/);
  assert.throws(()=>assertFinalDestination('https://jussco.company/',undefined),/final URL/);
});

test('apex accepts only the declared same-path hop to www; nothing else widens',()=>{
  assert.doesNotThrow(()=>assertFinalDestination('https://jussco.company/data/worlds.json','https://www.jussco.company/data/worlds.json'));
  assert.throws(()=>assertFinalDestination('https://jussco.company/data/worlds.json','https://www.jussco.company/'),/unexpected destination/);
  assert.throws(()=>assertFinalDestination('https://www.jussco.company/','https://jussco.company/'),/unexpected destination/);
  assert.throws(()=>assertFinalDestination('https://games.jussco.company/','https://www.games.jussco.company/'),/unexpected destination/);
  assert.throws(()=>assertFinalDestination('https://jussco.company/','https://evil.jussco.company/'),/unexpected destination/);
});

test('browser response fails closed if the target redirected off-domain',async()=>{
  const fake=async()=>({ok:true,status:200,json:async()=>({success:true,meta:{status:200,finalUrl:'https://elsewhere.example/'},result:'valid-looking content'})});
  await assert.rejects(()=>cfRequest({accountId:'a'.repeat(32),token:'fake',endpoint:'content',body:{url:'https://jussco.company/'},fetchImpl:fake}),/unexpected destination/);
});

test('public raw HTML must match exact source Git blob and requested hostname',()=>{
  const sha='a'.repeat(40);
  const make=(p)=>'<html data-source-check="'+JSON.stringify(p).replaceAll('"','&quot;')+'"></html>';
  const valid={http:200,bytes:69598,gitBlobSha1:sha,url:'https://jussco.company/'};
  assert.equal(verifyHtmlSourceMatch(make(valid),sha,'jussco.company'),sha);
  assert.equal(verifyHtmlSourceMatch(make({...valid,url:'https://www.jussco.company/'}),sha,'jussco.company'),sha);
  assert.throws(()=>verifyHtmlSourceMatch(make({...valid,url:'https://jussco.company/'}),sha,'games.jussco.company'),/does not match/);
  assert.throws(()=>verifyHtmlSourceMatch(make({...valid,gitBlobSha1:'b'.repeat(40)}),sha,'jussco.company'),/does not match/);
  assert.throws(()=>verifyHtmlSourceMatch(make({...valid,url:'https://example.org/'}),sha,'jussco.company'),/does not match/);
  assert.throws(()=>verifyHtmlSourceMatch(make({...valid,http:503}),sha,'jussco.company'),/does not match/);
  assert.throws(()=>verifyHtmlSourceMatch(make({error:'blocked'}),sha,'jussco.company'),/does not match/);
  assert.throws(()=>verifyHtmlSourceMatch('<html></html>',sha,'jussco.company'),/did not record/);
});

test('successful public readback still cannot claim exact deployed-SHA verification',()=>{
  const receipt=makePartialReadbackWitness('a'.repeat(40));
  assert.equal(receipt.status,'PARTIAL_PUBLIC_READBACK');
  assert.equal(receipt.deploymentShaAttested,false);
  assert.equal(receipt.sourceSha,'a'.repeat(40));
  assert.deepEqual(receipt.registries,[]);
  assert.deepEqual(receipt.pageProof,[]);
  assert.throws(()=>makePartialReadbackWitness('short'),/40-character/);
});

test('provider Actions ID secret fallback does not weaken dedicated rendering token', () => {
  const yaml = readFileSync(new URL('../.github/workflows/provider-site-proof.yml', import.meta.url), 'utf8');
  assert.match(yaml, /CLOUDFLARE_ACCOUNT_ID: \$\{\{ vars\.CLOUDFLARE_ACCOUNT_ID \|\| secrets\.CLOUDFLARE_ACCOUNT_ID \}\}/);
  assert.match(yaml, /CLOUDFLARE_BROWSER_RENDERING_TOKEN: \$\{\{ secrets\.CLOUDFLARE_BROWSER_RENDERING_TOKEN \}\}/);
  assert.doesNotMatch(yaml, /CLOUDFLARE_BROWSER_RENDERING_TOKEN: \$\{\{ secrets\.CLOUDFLARE_API_TOKEN/);
  assert.match(yaml, /push:\n    branches: \[main\]/);
});
