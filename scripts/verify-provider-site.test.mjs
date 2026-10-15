import test from 'node:test';
import assert from 'node:assert/strict';
import { gitBlobSha, extractScrapedRegistry, verifyWorldRegistry, verifySiteMarkdown, verifyDestinationMarkdown, assertSha } from './verify-provider-site.mjs';

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
