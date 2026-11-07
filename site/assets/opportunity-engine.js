/* Source-built controls; research signals are unverified leads, not a sales verdict. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const opportunityDefinitions = [
    {
      id:'ai-discovery-audits',title:'AI Discovery Audits',
      products:['Truth Compass','Truth Weaver','Juss & Co'],
      desc:'Turn your existing systems, content, and customer journeys into an evidence-backed AI discovery audit.',
      buyer:'Merchants and product teams exploring AI-search visibility',
      offer:'A fixed-scope citation and discovery audit using public, reproducible checks.',
      test:'Produce a public sample audit and compare agencies, tools, and actual buyer requests.',
      keywords:'ai search discovery visibility citation geo aeo brand merchant audit opportunity',
      tags:['Discovery','AI','Growth'],
      icon:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="m7 22 25-13 25 13-25 13L7 22Z"/><path d="m7 31 25 13 25-13M7 41l25 13 25-13"/><path d="M7 31v-3m50 3v-3"/></svg>'
    },
    {
      id:'workflow-proof-repair',title:'Workflow Proof & Repair',
      products:['Founder Control Room','PromptOS'],
      desc:'Find, validate, and repair workflow friction using tests, evidence and accountable approvals.',
      buyer:'Teams piloting automation without reliable proof of outcomes',
      offer:'One scoped workflow reliability review with reproducible defects and a documented repair plan.',
      test:'Create one source-backed before-and-after demonstration with an explicit pass criterion.',
      keywords:'workflow automation operations repair reliability proof ai agent business systems',
      tags:['Automation','Optimization','ROI'],
      icon:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="22"/><circle cx="32" cy="32" r="15"/><path d="m23 32 6 6 13-14M32 2v7m0 46v7M2 32h7m46 0h7M11 11l6 6m30 30 6 6M53 11l-6 6M17 47l-6 6"/></svg>'
    },
    {
      id:'shopping-discovery-checks',title:'Shopping Discovery Checks',
      products:['JBH','Truth Weaver'],
      desc:'Identify product-data, shopping-discovery and comparison gaps using public commerce evidence.',
      buyer:'Small retailers with catalogs exposed to AI-driven shopping research',
      offer:'A scoped product fact, availability and AI shopping representation check.',
      test:'Compare one public product catalog with observable discovery results and existing competitors.',
      keywords:'shopping catalog commerce retail merchant products product price ecommerce customer conversion',
      tags:['Commerce','Discovery','Growth'],
      icon:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M6 11h7l8 32h30l7-25H16"/><path d="M24 28h28M29 20v23M42 20v23"/><circle cx="27" cy="52" r="4"/><circle cx="47" cy="52" r="4"/></svg>'
    }
  ];
  let latestSignals = [];
  let audioContext;
  let ambienceGain = null;

  const el = (tag,value,className) => {
    const node = document.createElement(tag);
    if (value !== undefined) node.textContent = value;
    if (className) node.className = className;
    return node;
  };
  const chosen = () => [...document.querySelectorAll('#products input:checked')].map(node => node.value);
  const queryTokens = () => ($('#mission').value.toLowerCase().match(/[a-z]{4,}/g) || [])
    .filter(word => !['this','with','from','have','that','what','into','using','built','already','find','business','create'].includes(word));

  function ranked() {
    const selected = chosen();
    const tokens = new Set(queryTokens());
    return opportunityDefinitions.map((item,index) => ({
      ...item,index,
      portfolioMatches:item.products.filter(product => selected.includes(product)).length,
      promptMatches:[...tokens].filter(word => (item.title+' '+item.buyer+' '+item.keywords).toLowerCase().includes(word)).length,
    })).sort((a,b) =>
      (b.portfolioMatches*5+b.promptMatches)-(a.portfolioMatches*5+a.promptMatches) || a.index-b.index);
  }

  function render() {
    const area = $('#cards');
    area.replaceChildren();
    const selected = chosen();
    for (const item of ranked()) {
      const article = el('article',undefined,'card');
      article.dataset.opportunityId=item.id;
      const icon = el('div',undefined,'op-icon');
      icon.innerHTML = item.icon; // Trusted static icon markup only.
      const copy = el('div',undefined,'card-copy');
      copy.append(el('h3',item.title),el('p',item.desc));
      const pills = el('div',undefined,'pills');
      for (const tag of item.tags) pills.append(el('span',tag));
      copy.append(pills);
      const details = el('details');
      const summary = el('summary','Explore candidate →');
      details.append(summary,
        el('p','Potential buyer: '+item.buyer),
        el('p','Offer hypothesis: '+item.offer),
        el('p','First validation: '+item.test),
        el('p','Portfolio fit: '+item.portfolioMatches+' selected products. Market score withheld — demand and competition not verified.'));
      article.append(icon,copy,details);
      area.append(article);
    }
    $('#status').textContent = 'Three unverified portfolio hypotheses. Market demand, competition and pricing are not yet verified.';
    $('#focus-count').textContent = String(selected.length)+' systems selected';
  }

  function readSignal(item) {
    if (!item || item.evidenceState !== 'unverified') return null;
    if (typeof item.title !== 'string' || typeof item.url !== 'string') return null;
    let href;
    try {
      const url = new URL(item.url);
      if (url.protocol !== 'https:') return null;
      href = url.href;
    } catch { return null; }
    return {
      title:item.title.slice(0,200),
      href,
      date:typeof item.publishedAt === 'string' ? item.publishedAt.slice(0,10) : 'undated',
    };
  }

  async function refresh() {
    const button=$('#sources'),status=$('#status'),destination=$('#research-results');
    button.disabled=true;
    status.textContent='Checking public article leads through the FCR read-only endpoint…';
    destination.replaceChildren();
    latestSignals=[];
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),9000);
    try {
      const response=await fetch('https://api.foundercontrolroom.org/public/opportunity-research/v1',{
        headers:{Accept:'application/json'},signal:controller.signal,
      });
      if(!response.ok)throw new Error('HTTP '+response.status);
      const data=await response.json();
      if (data.contract!=='jussco/public-opportunity-signals@v1' || !Array.isArray(data.opportunities)) {
        throw new Error('Unexpected response contract');
      }
      for (const topic of data.opportunities.slice(0,3)) {
        const sources=(Array.isArray(topic.sources)?topic.sources:[]).slice(0,3).map(readSignal).filter(Boolean);
        if(!sources.length)continue;
        latestSignals.push({title:String(topic.title||'Research topic').slice(0,120),sources});
        const section=el('section');
        section.append(el('h3',String(topic.title||'Research topic')));
        const list=el('ul');
        for(const source of sources) {
          const row=el('li'),link=el('a',source.title);
          link.href=source.href;link.target='_blank';link.rel='noopener noreferrer';
          row.append(link,el('small','UNVERIFIED · '+source.date));
          list.append(row);
        }
        section.append(list);destination.append(section);
      }
      const count=latestSignals.reduce((sum,topic)=>sum+topic.sources.length,0);
      status.textContent = count+
        ' public article leads retrieved — NOT verified demand, low competition or revenue.';
      if(!count)destination.append(el('p','No current links were returned. Market validation remains unknown.'));
    } catch(e) {
      status.textContent='Research source unavailable ('+String(e?.message||'network error')+
        '). No market results fabricated; portfolio candidates remain unverified.';
    } finally {clearTimeout(timer);button.disabled=false}
  }

  function exportBrief() {
    const lines=[
      '# Juss & Co Opportunity Engine — Research Brief',
      '',
      'Evidence state: UNVERIFIED. No customer, revenue or competitor gap has been proven.',
      'Mission: '+$('#mission').value.trim().slice(0,2500),
      'Selected systems: '+(chosen().join(', ')||'none'),
      '',
    ];
    for(const [index,item] of ranked().entries()) {
      lines.push('## '+(index+1)+'. '+item.title,'',
        item.desc,'Potential buyer: '+item.buyer,'Offer: '+item.offer,
        'First validation: '+item.test,'Verified demand: UNKNOWN','Market score: WITHHELD','');
    }
    lines.push('## Public article leads','');
    if(!latestSignals.length)lines.push('No public feeds successfully checked in this session.');
    for(const topic of latestSignals) {
      lines.push('### '+topic.title);
      for(const source of topic.sources) lines.push('- UNVERIFIED '+source.date+': '+source.title+' — '+source.href);
    }
    lines.push('','No outreach, spending, private-data use, publishing, merge or deployment is authorized by this brief.','');
    const blob=new Blob([lines.join('\n')],{type:'text/markdown;charset=utf-8'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download='jussco-opportunity-research.md';
    document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),2000);
  }

  async function toggleAmbience() {
    const button=$('#ambience-toggle');
    if(!audioContext) {
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC) {$('#audio-status').textContent='Audio unavailable on this device';return}
      try {
        audioContext=new AC();
        const seconds=2,buffer=audioContext.createBuffer(1,audioContext.sampleRate*seconds,audioContext.sampleRate);
        const samples=buffer.getChannelData(0);
        let last=0;
        for(let i=0;i<samples.length;i++) {
          last=(last+(Math.random()*2-1)*.12)/1.04;
          samples[i]=Math.max(-1,Math.min(1,last));
        }
        const source=audioContext.createBufferSource();
        source.buffer=buffer;source.loop=true;
        const filter=audioContext.createBiquadFilter();
        filter.type='lowpass';filter.frequency.value=290;
        ambienceGain=audioContext.createGain();
        ambienceGain.gain.value=Number($('#volume').value)*.12;
        source.connect(filter);filter.connect(ambienceGain);ambienceGain.connect(audioContext.destination);
        source.start();
      } catch {
        $('#audio-status').textContent='Ambient audio could not start';
        return;
      }
    }
    const on=button.getAttribute('aria-pressed')!=='true';
    try {if(on)await audioContext.resume();else await audioContext.suspend()}
    catch {$('#audio-status').textContent='Audio controls unavailable';return}
    button.setAttribute('aria-pressed',String(on));
    button.textContent=on?'On':'Off';
    $('#audio-status').textContent=on?'Soft water ambience playing':'Ambient audio off';
  }

  $('#generate').addEventListener('click',render);
  $('#sources').addEventListener('click',refresh);
  $('#export').addEventListener('click',exportBrief);
  $('#ambience-toggle').addEventListener('click',toggleAmbience);
  $('#volume').addEventListener('input',event=>{
    if(ambienceGain)ambienceGain.gain.value=Number(event.target.value)*.12;
  });
  $('#products').addEventListener('change',render);
  $('#mobile-menu').addEventListener('click',()=>{
    const nav=$('#main-nav'),open=nav.classList.toggle('open');
    $('#mobile-menu').setAttribute('aria-expanded',String(open));
  });
  $('#main-nav').addEventListener('click',event=>{
    if(event.target.closest('a')) {
      $('#main-nav').classList.remove('open');
      $('#mobile-menu').setAttribute('aria-expanded','false');
    }
  });
  render();
})();