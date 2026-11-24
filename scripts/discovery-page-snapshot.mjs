#!/usr/bin/env node
// Generates only public presentation snapshots from the public discovery manifest.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const SITE=fileURLToPath(new URL('../site/',import.meta.url));
const esc=s=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function catalogRows(d){return d.products.map(x=>`<a class="directory-card" href="${esc(x.source)}" rel="noopener noreferrer"><strong>${esc(x.name)}</strong><span>${esc(x.purpose)}</span><small>Public source · Current operation unverified ↗</small></a>`).join("\n")}
function destinationRows(d){return d.destinations.map(x=>`<a class="directory-card" href="${esc(x.url)}" rel="noopener noreferrer"><strong>${esc(x.name)}</strong><span>${esc(x.purpose)}</span><small>Open destination · Operation unverified ↗</small></a>`).join("\n")}
function schema(d,kind){const games=kind==="games";const items=games?d.gameEditions:kind==="sites"?d.destinations:d.products;const page=games?"https://games.jussco.company/":d.canonicalOrigin+"/"+kind+".html";return JSON.stringify({"@context":"https://schema.org","@type":"CollectionPage",name:kind==="products"?"Juss & Co products":kind==="sites"?"Juss & Co public destinations":"Juss & Co games",url:page,description:"Discover independent products and declared public destinations. Current operation is not verified by this directory.",isPartOf:{"@type":"WebSite",name:d.company,url:d.canonicalOrigin+"/"},mainEntity:{"@type":"ItemList",itemListElement:items.map((x,i)=>({"@type":"ListItem",position:i+1,name:x.name,url:x.source??x.url,description:x.purpose}))}}).replace(/</g,"\\u003c")}
function destinationText(d){return [...d.destinations,...d.gameEditions].map(x=>`- ${x.name}: ${x.url} — current operation unverified.`).join("\n")}
function sitemap(d){return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+d.pages.map(x=>"  <url><loc>"+esc(x)+"</loc></url>").join("\n")+"\n</urlset>\n"}
function region(html,id,body){const start=`<!-- ${id}:start -->`,end=`<!-- ${id}:end -->`;const a=html.indexOf(start),b=html.indexOf(end,a+start.length);if(a<0||b<0)throw Error("missing snapshot markers "+id);return html.slice(0,a+start.length)+"\n"+body+"\n"+html.slice(b)}
function scriptRegion(html,id,body){const start=`<script type="application/ld+json" id="${id}">`,end="</script>";const a=html.indexOf(start),b=html.indexOf(end,a+start.length);if(a<0||b<0)throw Error("missing schema "+id);return html.slice(0,a+start.length)+body+html.slice(b)}
const d=JSON.parse(readFileSync(join(SITE,'data/discovery.json'),'utf8'));
if(d.schema!=='jussco/public-discovery@v2')throw Error('unsupported public manifest schema');
const jobs={
 'products.html':html=>scriptRegion(region(html,'discovery-products',catalogRows(d)),'public-product-schema',schema(d,'products')),
 'sites.html':html=>scriptRegion(region(html,'discovery-sites',destinationRows(d)),'public-sites-schema',schema(d,'sites')),
 'games/index.html':html=>scriptRegion(html,'public-games-schema',schema(d,'games')),
 'llms.txt':html=>region(html,'discovery-destinations',destinationText(d)),
 'sitemap.xml':()=>sitemap(d)
};
for(const [path,generate] of Object.entries(jobs)){
 const file=join(SITE,path),before=readFileSync(file,'utf8'),after=generate(before);
 if(process.argv.includes('--check')){if(before!==after){console.error('stale public discovery snapshot: '+path);process.exitCode=1;}}
 else if(before!==after)writeFileSync(file,after);
}
if(!process.exitCode)console.log('public discovery snapshots aligned');
