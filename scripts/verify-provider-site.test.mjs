import test from 'node:test';
import assert from 'node:assert/strict';
import { gitBlobSha, extractScrapedRegistry, verifyWorldRegistry, verifySiteMarkdown, verifyDestinationMarkdown, verifyBipContent, assertSha, runProof, createQuickActionPacer, verifyLayoutHtml, verifyHtmlSourceMatch, cfRequest, assertFinalDestination } from './verify-provider-site.mjs';

const bipLink = '[Visit Se\'kret Bip preview ↗](https://sekretbip.jussco.company/)';
const site = `---\ntitle: "Juss & Co"\n---\nTurn thoughts into living works.\n### Se'kret Bip\n${bipLink}`;

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
  const base={worlds:[{name:"Se'kret Bip",label:'Public preview',link:{url:'https://sekretbip.jussco.company/'},contact:{site:'https://sekretbip.net'}}]};
  assert.doesNotThrow(()=>verifyWorldRegistry(JSON.stringify(base)));
  base.worlds[0].label='Live signup';
  assert.throws(()=>verifyWorldRegistry(JSON.stringify(base)), /public preview/);
});

test('public parent-card CTA must actually appear in browser markdown', () => {
  assert.doesNotThrow(()=>verifySiteMarkdown(site));
  assert.throws(()=>verifySiteMarkdown(site.replace(bipLink,'')),/card button/);
  assert.throws(()=>verifySiteMarkdown('Just a moment... '+site),/Cloudflare challenge/);
});

test('standalone destinations reject challenge and unrelated pages',()=>{
  assert.doesNotThrow(()=>verifyDestinationMarkdown(`---\ntitle: "Se'kret Bip"\n---`,'bip'));
  assert.doesNotThrow(()=>verifyDestinationMarkdown(`---\ntitle: "Juss & Co. Games | Choose your adventure"\n---`,'games'));
  assert.throws(()=>verifyDestinationMarkdown('---\ntitle: "Sign in ・ Cloudflare Access"\n---','bip'),/title mismatch/);
  assert.throws(()=>verifyDestinationMarkdown('Origin DNS error','games'),/challenge or DNS/);
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

test('production witness rejects non-main and non-manual contexts before checkout or network',async()=>{
  const safe={GITHUB_SHA:'a'.repeat(40),CLOUDFLARE_ACCOUNT_ID:'f'.repeat(32),CLOUDFLARE_BROWSER_RENDERING_TOKEN:'test-only'};
  await assert.rejects(()=>runProof({env:{...safe,GITHUB_REF:'refs/heads/feature',GITHUB_EVENT_NAME:'workflow_dispatch'}}),/only on a manually dispatched main/);
  await assert.rejects(()=>runProof({env:{...safe,GITHUB_REF:'refs/heads/main',GITHUB_EVENT_NAME:'pull_request'}}),/only on a manually dispatched main/);
});


test('rate limiter spaces actions to protect Cloudflare Free quota',async()=>{
  let clock=100;const delays=[];
  const pace=createQuickActionPacer({intervalMs:11000,now:()=>clock,sleep:async ms=>{delays.push(ms);clock+=ms}});
  await pace();await pace();await pace();
  assert.deepEqual(delays,[11000,11000]);
});

test('mobile layout proof fails on overflow and missing CTA geometry',()=>{
  const embed=x=>'<html data-proof-layout="'+JSON.stringify(x).replaceAll('"','&quot;')+'"></html>';
  const base={vw:390,vh:844,scroll:390,cta:true,rect:{width:252,height:49,left:37,right:289,top:227,bottom:276}};
  assert.equal(verifyLayoutHtml(embed(base),390).scroll,390);
  assert.throws(()=>verifyLayoutHtml(embed({...base,scroll:410}),390),/overflows/);
  assert.throws(()=>verifyLayoutHtml(embed({...base,cta:false}),390),/CTA/);
  assert.throws(()=>verifyLayoutHtml(embed({...base,rect:{...base.rect,right:500}}),390),/CTA/);
  assert.throws(()=>verifyLayoutHtml('<html></html>',390),/No browser layout/);
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

test('browser response fails closed if the target redirected off-domain',async()=>{
  const fake=async()=>({ok:true,status:200,json:async()=>({success:true,meta:{status:200,finalUrl:'https://elsewhere.example/'},result:'valid-looking content'})});
  await assert.rejects(()=>cfRequest({accountId:'a'.repeat(32),token:'fake',endpoint:'content',body:{url:'https://jussco.company/'},fetchImpl:fake}),/unexpected destination/);
});

test('public raw HTML must match exact source Git blob and requested hostname',()=>{
  const sha='a'.repeat(40);
  const make=(p)=>'<html data-source-check="'+JSON.stringify(p).replaceAll('"','&quot;')+'"></html>';
  const valid={http:200,bytes:69598,gitBlobSha1:sha,url:'https://jussco.company/'};
  assert.equal(verifyHtmlSourceMatch(make(valid),sha,'jussco.company'),sha);
  assert.throws(()=>verifyHtmlSourceMatch(make({...valid,gitBlobSha1:'b'.repeat(40)}),sha,'jussco.company'),/does not match/);
  assert.throws(()=>verifyHtmlSourceMatch(make({...valid,url:'https://example.org/'}),sha,'jussco.company'),/does not match/);
  assert.throws(()=>verifyHtmlSourceMatch(make({...valid,http:503}),sha,'jussco.company'),/does not match/);
  assert.throws(()=>verifyHtmlSourceMatch(make({error:'blocked'}),sha,'jussco.company'),/does not match/);
  assert.throws(()=>verifyHtmlSourceMatch('<html></html>',sha,'jussco.company'),/did not record/);
});
