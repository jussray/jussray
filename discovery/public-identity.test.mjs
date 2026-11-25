import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('company homepage retains canonical organization identity',()=>{const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8');const g=JSON.parse(html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1]);const org=g['@graph'].filter(x=>x['@type']==='Organization');assert.equal(org.length,1);assert.equal(org[0]['@id'],'https://www.jussco.company/#organization');assert.equal(org[0].url,'https://www.jussco.company/');assert.ok(html.includes('rel="canonical" href="https://www.jussco.company/"'));});
