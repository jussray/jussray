import test from 'node:test';
import assert from 'node:assert/strict';
import { gitBlobSha, extractScrapedRegistry, verifyWorldRegistry, verifySiteMarkdown, verifyDestinationMarkdown, verifyBipContent, assertSha, runProof, runCanonicalProof, verifyCanonicalMarkdown } from './verify-provider-site.mjs';

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


test('canonical witness verifies actual public homepage, rejects Cloudflare challenges and fake facsimiles',()=>{
  const sample='---\ntitle: "Juss & Co"\n---\nTurn thoughts into living works.\nhttps://www.jussco.company/assets/hero.jpg\nJuss & Co';
  assert.doesNotThrow(()=>verifyCanonicalMarkdown(sample,'www.jussco.company'));
  assert.throws(()=>verifyCanonicalMarkdown('Just a moment... '+sample,'www.jussco.company'),/not verified/);
  assert.throws(()=>verifyCanonicalMarkdown(sample.replace('hero.jpg','fake.jpg'),'www.jussco.company'),/not verified/);
});

test('canonical provider witness rejects missing credentials, non-main branches and unapproved contexts',async()=>{
  const env={GITHUB_SHA:'a'.repeat(40),GITHUB_REF:'refs/heads/main',GITHUB_EVENT_NAME:'workflow_dispatch'};
  await assert.rejects(()=>runCanonicalProof({env}),/Missing scoped Cloudflare/);
  const credentials={...env,CLOUDFLARE_ACCOUNT_ID:'f'.repeat(32),CLOUDFLARE_BROWSER_RENDERING_TOKEN:'test-only'};
  await assert.rejects(()=>runCanonicalProof({env:{...credentials,GITHUB_REF:'refs/heads/feature'}}),/manually dispatched main/);
  await assert.rejects(()=>runCanonicalProof({env:{...credentials,GITHUB_EVENT_NAME:'pull_request'}}),/manually dispatched main/);
});
