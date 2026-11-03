import test from 'node:test';
import assert from 'node:assert/strict';
import { gitBlobSha, extractScrapedRegistry, verifyWorldRegistry, verifySiteMarkdown, verifyDestinationMarkdown, verifyBipContent, assertSha, assertReleaseContext, verifyReceiverHealthHtml, runProof } from './verify-provider-site.mjs';

const site = `---\ntitle: "Juss & Co"\n---\nTurn thoughts into living works.\n### Se'kret Bip\nOpening soon · no public link yet\nScan to explore www.jussco.company`;

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
  assert.throws(()=>verifySiteMarkdown(site.replace('Opening soon · no public link yet','Public signup live')),/must not claim/);
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
