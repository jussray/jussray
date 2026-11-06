import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=(p)=>readFileSync(new URL('../'+p,import.meta.url));
const html=read('site/index.html').toString('utf8');
const sitemap=read('site/sitemap.xml').toString('utf8');
const llms=read('site/llms.txt').toString('utf8');
test('public PDF links open safely in new tabs and ship real PDF bytes',()=>{
  for(const name of ['juss-co-company-overview.pdf','juss-co-selected-work-evidence.pdf']){
    assert.match(html,new RegExp('href="/downloads/'+name.replaceAll('.','\\.')+'"[^>]*target="_blank"[^>]*rel="noopener noreferrer"'));
    const bytes=read('site/downloads/'+name);
    assert.ok(bytes.subarray(0,8).toString()==='%PDF-1.4');
    assert.match(bytes.subarray(-40).toString('latin1'),/%%EOF/);
    assert.ok(bytes.length>1200,'PDF cannot be an empty placeholder');
    assert.ok(sitemap.includes('/downloads/'+name));
    assert.ok(llms.includes('/downloads/'+name));
  }
});
test('public resource questions are accessible and status dates are not falsely current',()=>{
  assert.match(html,/id="resources" aria-labelledby="h-resources"/);
  assert.equal((html.match(/<details>/g)||[]).length>=3,true);
  assert.doesNotMatch(html,/Status is shown as it is on 30 Sep 2026/);
  assert.doesNotMatch(html,/Status synced /);
  assert.doesNotMatch(html,/What is true today/);
  assert.doesNotMatch(html,/A beauty brand pays for the systems/);
  assert.match(html,/historical receipt does not establish current uptime/);
  assert.match(html,/product availability requires direct verification/);
  assert.match(html,/Standalone OS registry unavailable; current status is unverified/);
});
test('robots policy and contact routing have not been silently changed',()=>{
  const robots=read('site/robots.txt').toString('utf8');
  assert.match(robots,/User-agent: GPTBot\nDisallow: \/\n/);
  assert.match(html,/href="mailto:founder@jussco\.company"/);
});

test('structured public answers match visible FAQ and avoid unverified availability claims',()=>{
  const start=html.indexOf('<script type="application/ld+json">');
  const end=html.indexOf('</script>',start);
  assert.ok(start>=0&&end>start);
  const graph=JSON.parse(html.slice(start+'<script type="application/ld+json">'.length,end))['@graph'];
  const questions=graph.find((item)=>item['@type']==='FAQPage');
  assert.ok(questions);
  assert.deepEqual(questions.mainEntity.map((item)=>item.name),[
    'What is Juss & Co?',
    'Are all listed products available now?',
    'Where can I review the source and work?',
  ]);
  for(const label of questions.mainEntity.map((item)=>item.name)){
    const escaped=label.replaceAll('&','&amp;');
    assert.ok(html.includes('<summary>'+escaped+'</summary>'));
  }
  assert.ok(JSON.stringify(questions).includes('public repository does not by itself verify'));
});
