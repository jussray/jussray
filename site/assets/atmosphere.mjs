/* Shared atmosphere: local time owns the environment; visitor preferences override visual styling only. */
const southernZones = /^(Australia\/|Pacific\/(Auckland|Chatham)|America\/(Argentina\/|Buenos_Aires|Santiago|Montevideo)|Africa\/(Johannesburg|Maseru|Mbabane))/;
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
export const MOODS = ['violet', 'rose', 'amber', 'emerald', 'sky'];
export const DEFAULT_PREFS = Object.freeze({ adaptive: true, season: 'auto', mood: 'violet', intensity: 70, holidays: true, reduceMotion: false });
const KEY = 'jc-atmosphere-v1';
const LABEL = { spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter', halloween: 'Halloween', 'winter-lights': 'Christmas', 'new-year': "New Year's" };

export function seasonFor(date = new Date(), zone = Intl.DateTimeFormat().resolvedOptions().timeZone || '') {
  const month = zone ? Number(new Intl.DateTimeFormat('en-US',{timeZone:zone,month:'numeric',calendar:'gregory'}).format(date))-1 : date.getMonth();
  let index = month === 11 || month < 2 ? 0 : month < 5 ? 1 : month < 8 ? 2 : 3;
  if (southernZones.test(zone)) index = (index + 2) % 4;
  return ['winter','spring','summer','autumn'][index];
}
export function holidayFor(date = new Date()) {
  const m = date.getMonth() + 1, d = date.getDate();
  if (m === 10 && d === 31) return 'halloween';
  if (m === 12 && d >= 20 && d <= 26) return 'winter-lights';
  if (m === 12 && d >= 31 || m === 1 && d === 1) return 'new-year';
  return '';
}

/* Turns stored preferences into what the page shows. Bad or tampered values fall back to defaults. */
export function cleanPrefs(raw) {
  const p = { ...DEFAULT_PREFS };
  if (raw && typeof raw === 'object') {
    if (typeof raw.adaptive === 'boolean') p.adaptive = raw.adaptive;
    if (raw.season === 'auto' || SEASONS.includes(raw.season)) p.season = raw.season;
    if (MOODS.includes(raw.mood)) p.mood = raw.mood;
    if (Number.isFinite(raw.intensity)) p.intensity = Math.min(100, Math.max(0, Math.round(raw.intensity)));
    if (typeof raw.holidays === 'boolean') p.holidays = raw.holidays;
    if (typeof raw.reduceMotion === 'boolean') p.reduceMotion = raw.reduceMotion;
  }
  return p;
}
export function resolveAtmosphere(prefs = DEFAULT_PREFS, date = new Date(), zone = '', automatic = {}) {
  const p = cleanPrefs(prefs);
  const season = p.season === 'auto' ? (automatic.season ?? seasonFor(date, zone)) : p.season;
  const holiday = p.adaptive && p.holidays ? (automatic.holiday ?? holidayFor(date)) : '';
  return { season, holiday, mood: p.mood, intensity: p.intensity / 100, reduceMotion: p.reduceMotion, label: LABEL[holiday || season] || holiday || season };
}
function loadPrefs() { try { return cleanPrefs(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch { return { ...DEFAULT_PREFS }; } }
function savePrefs(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private window: keep the choice for this visit only */ } }

const COLORS = {
  spring: 'rgba(255,204,224,A)', summer: 'rgba(255,222,141,A)', autumn: 'rgba(255,170,80,A)', winter: 'rgba(239,247,255,A)',
  halloween: ['rgba(255,140,40,A)', 'rgba(170,110,255,A)'], 'winter-lights': ['rgba(255,226,157,A)', 'rgba(255,90,90,A)', 'rgba(120,220,140,A)'],
  'new-year': ['rgba(255,226,157,A)', 'rgba(255,120,220,A)', 'rgba(120,200,255,A)']
};
const MOOD_GLOW = { violet: '150,95,255', rose: '255,95,150', amber: '255,170,60', emerald: '60,200,140', sky: '80,160,255' };


let visitorPrefs = loadPrefs();
export function timePhase(date = new Date(), zone) {
  const h = zone ? Number(new Intl.DateTimeFormat('en-GB', {timeZone:zone,hour:'numeric',hourCycle:'h23'}).format(date)) : date.getHours();
  return h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'sunset' : 'night';
}
// Approximate solar elevation: NOAA GML solar position equations; no remote request.
// https://gml.noaa.gov/grad/solcalc/solareqns.PDF
export function solarPhase(date, coords) {
  if (!coords || !Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude) || Math.abs(coords.latitude)>90 || Math.abs(coords.longitude)>180) return null;
  const rad=Math.PI/180, year=date.getUTCFullYear(), start=Date.UTC(year,0,1), days=(Date.UTC(year+1,0,1)-start)/86400000;
  const gamma=2*Math.PI/days*((+date-start)/86400000-.5);
  const e=229.18*(.000075+.001868*Math.cos(gamma)-.032077*Math.sin(gamma)-.014615*Math.cos(2*gamma)-.040849*Math.sin(2*gamma));
  const dec=.006918-.399912*Math.cos(gamma)+.070257*Math.sin(gamma)-.006758*Math.cos(2*gamma)+.000907*Math.sin(2*gamma)-.002697*Math.cos(3*gamma)+.00148*Math.sin(3*gamma);
  const minutes=date.getUTCHours()*60+date.getUTCMinutes()+date.getUTCSeconds()/60;
  const hour=(((minutes+e+4*coords.longitude)%1440+1440)%1440)/4-180;
  const lat=coords.latitude*rad;
  const elevation=Math.asin(Math.max(-1,Math.min(1,Math.sin(lat)*Math.sin(dec)+Math.cos(lat)*Math.cos(dec)*Math.cos(hour*rad))))/rad;
  return elevation>6?'day':elevation>=-6?(hour<0?'dawn':'sunset'):'night';
}
export function regionalEvent(date, region) {
  const m=date.getMonth()+1,d=date.getDate();
  if(m===1&&d===1||m===12&&d===31)return 'new-year';
  if (m===10&&d===31&&['US','CA','GB','IE','AU','NZ'].includes(region)) return 'halloween';
  if (region==='US'&&m===7&&d===4) return 'independence-day';
  if (region==='CA'&&m===7&&d===1) return 'canada-day';
  if (region==='FR'&&m===7&&d===14) return 'national-day';
  if (region==='DE'&&m===10&&d===3) return 'unity-day';
  if (region==='JP'&&m===2&&d===11) return 'foundation-day';
  if (region==='US'&&m===11&&date.getDay()===4&&d>=22&&d<=28) return 'thanksgiving';
  if (region==='MX'&&m===9&&d===16 || region==='BR'&&m===9&&d===7 || region==='IN'&&m===8&&d===15 || region==='ID'&&m===8&&d===17 || region==='KR'&&m===8&&d===15 || region==='NG'&&m===10&&d===1) return 'national-day';
  if (region==='SG'&&m===8&&d===9 || region==='ZA'&&m===4&&d===27 || region==='AU'&&m===1&&d===26 || region==='NZ'&&m===2&&d===6) return 'national-day';
  if (region==='CN'&&m===10&&d===1 || region==='TR'&&m===10&&d===29 || region==='PT'&&m===6&&d===10 || region==='ES'&&m===10&&d===12 || region==='IT'&&m===6&&d===2) return 'national-day';
  if (['US','CA','GB','FR','DE','AU','NZ','ES','PT','BR','MX'].includes(region)&&m===12&&d>=20&&d<=26) return 'winter-lights';
  return '';
}
export function formatLocalDateTime(date, locale, timeZone) {
  return new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short',...(timeZone?{timeZone}:{})}).format(date);
}
const localeLabels = {"en":["Dawn","Daylight","Sunset","Night","Local time","Use local daylight","Use clock only","Location unavailable; using clock","Preview for one minute","Current Atmosphere","Home","Portfolio","Products","Games","Solutions","Our Work","Ideas","Founder","Contact"],"es":["Amanecer","Luz del día","Atardecer","Noche","Hora local","Usar luz solar local","Usar solo el reloj","Ubicación no disponible; se usa el reloj","Vista previa durante un minuto","Atmósfera actual","Inicio","Portafolio","Productos","Juegos","Soluciones","Nuestro trabajo","Ideas","Fundador","Contacto"],"fr":["Aube","Jour","Crépuscule","Nuit","Heure locale","Utiliser la lumière solaire locale","Utiliser l’horloge uniquement","Position indisponible ; horloge utilisée","Aperçu pendant une minute","Atmosphère actuelle","Accueil","Portfolio","Produits","Jeux","Solutions","Nos réalisations","Idées","Fondateur","Contact"],"de":["Morgendämmerung","Tageslicht","Abenddämmerung","Nacht","Ortszeit","Lokales Sonnenlicht verwenden","Nur Uhr verwenden","Standort nicht verfügbar; Uhr wird verwendet","Eine Minute Vorschau","Aktuelle Atmosphäre","Startseite","Portfolio","Produkte","Spiele","Lösungen","Unsere Arbeit","Ideen","Gründer","Kontakt"],"pt":["Amanhecer","Luz do dia","Anoitecer","Noite","Hora local","Usar luz solar local","Usar apenas o relógio","Localização indisponível; usando o relógio","Prévia por um minuto","Atmosfera atual","Início","Portfólio","Produtos","Jogos","Soluções","Nosso trabalho","Ideias","Fundador","Contato"],"ja":["夜明け","昼","夕暮れ","夜","現地時刻","現地の日照を使用","時計のみ使用","位置情報なし・時計を使用","1分間のプレビュー","現在の雰囲気","ホーム","ポートフォリオ","製品","ゲーム","ソリューション","実績","アイデア","創業者","お問い合わせ"],"ar":["الفجر","النهار","الغروب","الليل","الوقت المحلي","استخدام ضوء الشمس المحلي","استخدام الساعة فقط","الموقع غير متاح؛ تُستخدم الساعة","معاينة لمدة دقيقة","الأجواء الحالية","الرئيسية","الأعمال","المنتجات","الألعاب","الحلول","أعمالنا","الأفكار","المؤسس","اتصل بنا"]};
const translations = {"Creative Technology":{"es":"Tecnología creativa","fr":"Technologie créative","de":"Kreative Technologie","pt":"Tecnologia criativa","ja":"クリエイティブテクノロジー","ar":"التكنولوجيا الإبداعية"},"for a More Beautiful Life":{"es":"para una vida más bella","fr":"pour une vie plus belle","de":"für ein schöneres Leben","pt":"para uma vida mais bonita","ja":"より美しい暮らしのために","ar":"من أجل حياة أجمل"},"AI-powered product creation, systems, brands, and experiences":{"es":"Creación de productos, sistemas, marcas y experiencias con IA","fr":"Création de produits, de systèmes, de marques et d’expériences grâce à l’IA","de":"KI-gestützte Entwicklung von Produkten, Systemen, Marken und Erlebnissen","pt":"Criação de produtos, sistemas, marcas e experiências com IA","ja":"AIを活用した製品、システム、ブランド、体験の創造","ar":"ابتكار المنتجات والأنظمة والعلامات التجارية والتجارب بالذكاء الاصطناعي"},"Create · Build · Launch · Grow · Protect":{"es":"Crear · Construir · Lanzar · Crecer · Proteger","fr":"Créer · Construire · Lancer · Grandir · Protéger","de":"Gestalten · Bauen · Starten · Wachsen · Schützen","pt":"Criar · Construir · Lançar · Crescer · Proteger","ja":"創造 · 構築 · 公開 · 成長 · 保護","ar":"ابتكر · ابنِ · أطلق · انمُ · احمِ"},"Building intelligent products and beautiful experiences for a more creative, free, and abundant life.":{"es":"Creamos productos inteligentes y experiencias hermosas para una vida más creativa, libre y abundante.","fr":"Créer des produits intelligents et de belles expériences pour une vie plus créative, libre et abondante.","de":"Intelligente Produkte und schöne Erlebnisse für ein kreativeres, freieres und erfüllteres Leben entwickeln.","pt":"Criamos produtos inteligentes e belas experiências para uma vida mais criativa, livre e abundante.","ja":"より創造的で自由で豊かな暮らしのために、賢い製品と美しい体験をつくります。","ar":"نبني منتجات ذكية وتجارب جميلة لحياة أكثر إبداعًا وحرية ووفرة."},"The Juss & Co Ecosystem":{"es":"El ecosistema de Juss & Co","fr":"L’écosystème Juss & Co","de":"Das Juss & Co Ökosystem","pt":"O ecossistema Juss & Co","ja":"Juss & Co エコシステム","ar":"منظومة Juss & Co"},"Our Ecosystem":{"es":"Nuestro ecosistema","fr":"Notre écosystème","de":"Unser Ökosystem","pt":"Nosso ecossistema","ja":"私たちのエコシステム","ar":"منظومتنا"},"Our Products":{"es":"Nuestros productos","fr":"Nos produits","de":"Unsere Produkte","pt":"Nossos produtos","ja":"私たちの製品","ar":"منتجاتنا"},"Flagship solutions, real impact.":{"es":"Soluciones emblemáticas, impacto real.","fr":"Des solutions phares, un impact réel.","de":"Wegweisende Lösungen mit echter Wirkung.","pt":"Soluções de destaque, impacto real.","ja":"主力ソリューション、確かな価値。","ar":"حلول رائدة وأثر حقيقي."},"See what we've built.":{"es":"Descubre lo que hemos creado.","fr":"Découvrez nos réalisations.","de":"Entdecken Sie, was wir entwickelt haben.","pt":"Veja o que construímos.","ja":"これまでの制作実績をご覧ください。","ar":"اكتشف ما بنيناه."},"Custom for your goals.":{"es":"Adaptadas a tus objetivos.","fr":"Adaptées à vos objectifs.","de":"Auf Ihre Ziele zugeschnitten.","pt":"Personalizadas para seus objetivos.","ja":"あなたの目標に合わせて。","ar":"مصممة وفق أهدافك."},"Results, case studies, and proof.":{"es":"Resultados, casos de estudio y pruebas.","fr":"Résultats, études de cas et preuves.","de":"Ergebnisse, Fallstudien und Nachweise.","pt":"Resultados, estudos de caso e evidências.","ja":"成果、事例、検証結果。","ar":"نتائج ودراسات حالة وأدلة."},"The vision behind it all.":{"es":"La visión que lo impulsa todo.","fr":"La vision qui anime l’ensemble.","de":"Die Vision hinter allem.","pt":"A visão por trás de tudo.","ja":"すべての原動力となるビジョン。","ar":"الرؤية التي تقف وراء كل ذلك."},"Let's create together.":{"es":"Creemos juntos.","fr":"Créons ensemble.","de":"Gemeinsam etwas erschaffen.","pt":"Vamos criar juntos.","ja":"一緒に創造しましょう。","ar":"لنبتكر معًا."},"Ambient Sound":{"es":"Sonido ambiental","fr":"Ambiance sonore","de":"Umgebungsgeräusche","pt":"Som ambiente","ja":"環境音","ar":"الصوت المحيطي"},"See the complete portfolio →":{"es":"Ver el portafolio completo →","fr":"Voir le portfolio complet →","de":"Das gesamte Portfolio ansehen →","pt":"Ver o portfólio completo →","ja":"ポートフォリオをすべて見る →","ar":"عرض جميع الأعمال ←"},"Skip to content":{"es":"Ir al contenido","fr":"Aller au contenu","de":"Zum Inhalt springen","pt":"Ir para o conteúdo","ja":"本文へ移動","ar":"انتقل إلى المحتوى"},"Public destinations":{"es":"Destinos públicos","fr":"Destinations publiques","de":"Öffentliche Angebote","pt":"Destinos públicos","ja":"公開サイト一覧","ar":"الوجهات العامة"},"Licensing":{"es":"Licencias","fr":"Licences","de":"Lizenzierung","pt":"Licenciamento","ja":"ライセンス","ar":"التراخيص"},"Returns policy (draft)":{"es":"Política de devoluciones (borrador)","fr":"Politique de retour (brouillon)","de":"Rückgaberichtlinie (Entwurf)","pt":"Política de devoluções (rascunho)","ja":"返品ポリシー（草案）","ar":"سياسة الإرجاع (مسودة)"},"Game Hub":{"es":"Centro de juegos","fr":"Espace jeux","de":"Spiele-Hub","pt":"Central de jogos","ja":"ゲームハブ","ar":"مركز الألعاب"},"Built for others.":{"es":"Creado para otros.","fr":"Conçu pour les autres.","de":"Für andere entwickelt.","pt":"Criado para outras pessoas.","ja":"誰かのために。","ar":"صُمم من أجل الآخرين."},"Start with":{"es":"Empieza con","fr":"Commencez par","de":"Beginnen Sie mit","pt":"Comece com","ja":"まずは","ar":"ابدأ بـ"},"an idea.":{"es":"una idea.","fr":"une idée.","de":"einer Idee.","pt":"uma ideia.","ja":"アイデアから。","ar":"فكرة."},"Built with intention. Documented with proof.":{"es":"Creado con intención. Documentado con pruebas.","fr":"Conçu avec intention. Documenté par des preuves.","de":"Mit Absicht entwickelt. Durch Nachweise dokumentiert.","pt":"Criado com intenção. Documentado com evidências.","ja":"意図を持って構築し、証拠とともに記録する。","ar":"بُني بهدف ووُثّق بالأدلة."},"One vision.":{"es":"Una visión.","fr":"Une vision.","de":"Eine Vision.","pt":"Uma visão.","ja":"ひとつのビジョン。","ar":"رؤية واحدة."},"Many living works.":{"es":"Muchas obras vivas.","fr":"De nombreuses œuvres vivantes.","de":"Viele lebendige Werke.","pt":"Muitas obras vivas.","ja":"数多くの生きた作品。","ar":"أعمال حية كثيرة."},"AI Business Idea Generator":{"es":"Generador de ideas de negocio con IA","fr":"Générateur d’idées d’entreprise par IA","de":"KI-Generator für Geschäftsideen","pt":"Gerador de ideias de negócio com IA","ja":"AIビジネスアイデア生成ツール","ar":"مولّد أفكار الأعمال بالذكاء الاصطناعي"},"Original work can create value without giving away the people behind it.":{"es":"El trabajo original puede crear valor sin exponer a las personas que lo hacen posible.","fr":"Une œuvre originale peut créer de la valeur sans exposer les personnes qui en sont à l’origine.","de":"Originelle Arbeit kann Werte schaffen, ohne die Menschen dahinter preiszugeben.","pt":"O trabalho original pode criar valor sem expor as pessoas por trás dele.","ja":"独自の作品は、関わる人々をさらすことなく価値を生み出せます。","ar":"يمكن للعمل الأصلي أن يخلق قيمة دون كشف الأشخاص الذين يقفون وراءه."},"Universe":{"es":"Universo","fr":"Univers","de":"Universum","pt":"Universo","ja":"ユニバース","ar":"عالم"},"Living works.":{"es":"Obras vivas.","fr":"Œuvres vivantes.","de":"Lebendige Werke.","pt":"Obras vivas.","ja":"生きた作品。","ar":"أعمال حية."},"Independent worlds.":{"es":"Mundos independientes.","fr":"Des univers indépendants.","de":"Eigenständige Welten.","pt":"Mundos independentes.","ja":"独立した世界。","ar":"عوالم مستقلة."},"Returns policy":{"es":"Política de devoluciones","fr":"Politique de retour","de":"Rückgaberichtlinie","pt":"Política de devoluções","ja":"返品ポリシー","ar":"سياسة الإرجاع"},"Stop guessing what’s broken.":{"es":"Deja de adivinar qué falla.","fr":"Ne devinez plus ce qui ne fonctionne pas.","de":"Raten Sie nicht länger, was nicht funktioniert.","pt":"Pare de adivinhar o que está falhando.","ja":"何が壊れているか、推測するのはもうやめましょう。","ar":"توقف عن التخمين بشأن ما لا يعمل."},"Ideas made":{"es":"Ideas hechas","fr":"Des idées devenues","de":"Ideen werden","pt":"Ideias tornadas","ja":"アイデアを","ar":"أفكار أصبحت"},"real.":{"es":"realidad.","fr":"réalité.","de":"Wirklichkeit.","pt":"realidade.","ja":"現実に。","ar":"واقعًا."},"Game":{"es":"Centro de","fr":"Espace","de":"Spiele","pt":"Central de","ja":"ゲーム","ar":"مركز"},"Hub":{"es":"juegos","fr":"jeux","de":"Hub","pt":"jogos","ja":"ハブ","ar":"الألعاب"},"Public":{"es":"Destinos","fr":"Destinations","de":"Öffentliche","pt":"Destinos","ja":"公開","ar":"الوجهات"},"destinations.":{"es":"públicos.","fr":"publiques.","de":"Angebote.","pt":"públicos.","ja":"サイト一覧。","ar":"العامة."},"Explore the studio":{"es":"Explora el estudio","fr":"Explorez le studio","de":"Das Studio entdecken","pt":"Explore o estúdio","ja":"スタジオを探索する","ar":"استكشف الاستوديو"},"Public repositories and source code":{"es":"Repositorios públicos y código fuente","fr":"Dépôts publics et code source","de":"Öffentliche Repositories und Quellcode","pt":"Repositórios públicos e código-fonte","ja":"公開リポジトリとソースコード","ar":"المستودعات العامة والشيفرة المصدرية"},"Official company website":{"es":"Sitio web oficial de la empresa","fr":"Site officiel de l’entreprise","de":"Offizielle Unternehmenswebsite","pt":"Site oficial da empresa","ja":"公式企業サイト","ar":"الموقع الرسمي للشركة"},"Open destination ↗":{"es":"Abrir destino ↗","fr":"Ouvrir la destination ↗","de":"Angebot öffnen ↗","pt":"Abrir destino ↗","ja":"サイトを開く ↗","ar":"فتح الوجهة ↗"},"Menu":{"es":"Menú","fr":"Menu","de":"Menü","pt":"Menu","ja":"メニュー","ar":"القائمة"},"Menu ☰":{"es":"Menú ☰","fr":"Menu ☰","de":"Menü ☰","pt":"Menu ☰","ja":"メニュー ☰","ar":"القائمة ☰"},"Open navigation menu":{"es":"Abrir menú de navegación","fr":"Ouvrir le menu de navigation","de":"Navigationsmenü öffnen","pt":"Abrir menu de navegação","ja":"ナビゲーションメニューを開く","ar":"افتح قائمة التنقل"},"Search the ecosystem":{"es":"Buscar en el ecosistema","fr":"Rechercher dans l’écosystème","de":"Ökosystem durchsuchen","pt":"Pesquisar no ecossistema","ja":"エコシステムを検索","ar":"ابحث في المنظومة"},"Ambient volume":{"es":"Volumen ambiental","fr":"Volume ambiant","de":"Umgebungslautstärke","pt":"Volume ambiente","ja":"環境音の音量","ar":"مستوى الصوت المحيطي"},"Previous projects":{"es":"Proyectos anteriores","fr":"Projets précédents","de":"Vorherige Projekte","pt":"Projetos anteriores","ja":"前のプロジェクト","ar":"المشاريع السابقة"},"Next projects":{"es":"Proyectos siguientes","fr":"Projets suivants","de":"Nächste Projekte","pt":"Próximos projetos","ja":"次のプロジェクト","ar":"المشاريع التالية"}};
export function localizedPhrase(phrase, language) { return Object.hasOwn(translations,phrase)&&Object.hasOwn(translations[phrase],language)?translations[phrase][language]:phrase; }

export function resolveVisitorLocale(preferences = []) {
  const candidates = preferences.filter(Boolean);
  for (const candidate of candidates) {
    try { const locale = new Intl.Locale(candidate); if (Object.hasOwn(localeLabels,locale.language)) return {locale:locale.toString(),language:locale.language,region:locale.region||''}; } catch {}
  }
  try { const locale=new Intl.Locale(candidates[0]||'en'); return {locale:locale.toString(),language:'en',region:locale.region||''}; } catch {return {locale:'en',language:'en',region:''};}
}
export function regionForZone(zone, fallback='') {
  // Explicit, curated unambiguous examples only. IANA zones do not universally identify countries.
  const exact = {'Asia/Tokyo':'JP','Asia/Seoul':'KR','Asia/Kolkata':'IN','Asia/Calcutta':'IN','Asia/Shanghai':'CN','Asia/Singapore':'SG','Asia/Jakarta':'ID','Europe/Paris':'FR','Europe/Berlin':'DE','Europe/London':'GB','Europe/Madrid':'ES','Europe/Lisbon':'PT','Europe/Rome':'IT','Europe/Istanbul':'TR','Africa/Johannesburg':'ZA','Africa/Lagos':'NG','Pacific/Auckland':'NZ','America/Mexico_City':'MX','America/Sao_Paulo':'BR','America/Toronto':'CA','America/Vancouver':'CA','America/Halifax':'CA','America/New_York':'US','America/Chicago':'US','America/Denver':'US','America/Los_Angeles':'US','America/Phoenix':'US','America/Anchorage':'US','Pacific/Honolulu':'US'};
  return zone.startsWith('Australia/')?'AU':Object.hasOwn(exact,zone)?exact[zone]:fallback;
}
export function createSkyState(present) {
  const ready=new Set(); let wanted=null, shown=null;
  const flush=()=>{if(wanted && wanted!==shown && ready.has(wanted)){shown=wanted;present(shown);}};
  return {request(phase){wanted=phase;flush();},loaded(phase){ready.add(phase);flush();}};
}

export function createTimeState(resolve = timePhase) {
  const phases = ['dawn','day','sunset','night'];
  let preview = null;
  function read(date = new Date()) {
    const actual = resolve(date);
    if (preview && (preview.actual !== actual || +date >= preview.until || +date < preview.from)) preview = null;
    return preview ? preview.phase : actual;
  }
  return {read, cycle(date = new Date()) {
    const next = phases[(phases.indexOf(read(date))+1)%phases.length];
    preview = {phase:next,actual:resolve(date),from:+date,until:+date+60000};
    return next;
  }};
}
// Device locale is a preference, not proof of a country. Coordinates are optional,
// retained in memory only, and never transmitted or persisted by this module.
function startLocalTime() {
  const root = document.documentElement;
  const {locale,language,region:localeRegion} = resolveVisitorLocale(navigator.languages?.length?navigator.languages:[navigator.language||'en']);
  let skyState=null;
  const labels = localeLabels[language], phases = ['dawn','day','sunset','night'];
  let coords = null, pending = false, request = 0, unavailable = false, lastMinute = '';
  // Remember consent to daylight mode, never the location itself.
  const preferenceKey='jc-solar-daylight';
  const remember = value => { try { sessionStorage.setItem(preferenceKey,value?'on':'off'); } catch {} };
  const preferred = () => { try { return sessionStorage.getItem(preferenceKey)==='on'; } catch { return false; } };
  const state = createTimeState(date => solarPhase(date, coords) || timePhase(date));
  // Preserve English page language for untranslated editorial copy.
  const localize = (el, text) => { if (el.textContent !== text) el.textContent = text; el.lang = language; el.dir = 'auto'; };
  const navNames = localeLabels.en.slice(10);
  function localizeNavigation() {
    for (const el of document.querySelectorAll('header nav a, .ws-nav a')) {
      const i = navNames.indexOf(el.textContent.trim());
      if (i >= 0) localize(el, labels[i+10]);
    }
  }
  localizeNavigation();
  // Translate only explicitly authored strings. Preserve icons, styled spans, links,
  // input values, legal terms and product names. Untranslated copy stays in English.
  function localizeContent() {
    const selectors='h1,h2,.subline,.pillars,.founder-quote blockquote p,.ep-txt strong,.ep-txt span,.eco-foot a,.skip,#sound-label,.page-footer a,.menu-word,.menu-toggle,.menu-btn,.directory-card span,.directory-card small,.kicker';
    for(const el of document.querySelectorAll(selectors)) {
      const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
      let node,changed=false;
      while((node=walker.nextNode())) {
        const raw=node.nodeValue, key=raw.trim(), next=localizedPhrase(key,language);
        if(next!==key){node.nodeValue=raw.replace(key,next);changed=true;}
      }
      if(changed){el.lang=language;el.dir='auto';}
    }
    for(const el of document.querySelectorAll('[aria-label]')){
      const raw=el.getAttribute('aria-label'),next=localizedPhrase(raw,language);
      if(next!==raw)el.setAttribute('aria-label',next);
    }
    root.dataset.interfaceLocale=language;
  }
  localizeContent();
  const footer = document.querySelector('footer');
  const status = document.createElement('div'); status.className = 'local-environment';
  const clock = document.createElement('time'); clock.lang = locale; clock.dir = 'auto';
  const toggle = document.createElement('button'); toggle.type = 'button'; toggle.lang = language; toggle.dir = 'auto';
  status.append(clock, toggle);
  if (footer) footer.before(status); else document.body.append(status);
  function updateEnvironment(date) {
    const minute = Math.floor(+date/60000);
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const region = regionForZone(zone,localeRegion);
    const signature = [minute, coords?.latitude, region, zone].join('|');
    if (signature === lastMinute) return;
    lastMinute = signature;
    let season = seasonFor(date, zone);
    if (coords) { const m = date.getMonth(), idx = m===11||m<2?0:m<5?1:m<8?2:3; season = ['winter','spring','summer','autumn'][(idx+(coords.latitude<0?2:0))%4]; }
    const visual = resolveAtmosphere(visitorPrefs, date, zone, {season, holiday: regionalEvent(date, region)});
    root.dataset.season = visual.season;
    if (visual.holiday) root.dataset.holiday = visual.holiday; else delete root.dataset.holiday;
    root.dataset.mood = visual.mood;
    root.style.setProperty('--atmo-intensity', String(visual.intensity));
    if (visual.reduceMotion) root.dataset.motion = 'reduced'; else delete root.dataset.motion;
    clock.dateTime = date.toISOString();
    clock.textContent = formatLocalDateTime(date, locale);
    const m=date.getMonth(), sm=m===11||m<2?11:m-(m+1)%3;
    const from=new Date(date.getFullYear()-(m<2?1:0),sm,1), to=new Date(from.getFullYear(),from.getMonth()+3,0);
    const fmt = new Intl.DateTimeFormat(locale,{month:'short',day:'numeric'});
    for (const el of document.querySelectorAll('#seasonWindow,#season-window')) { el.textContent=visitorPrefs.season==='auto'?fmt.format(from)+' – '+fmt.format(to):'Visual preview: '+LABEL[visitorPrefs.season]; el.lang=visitorPrefs.season==='auto'?locale:'en'; }
  }
  function apply(phase) {
    if (root.dataset.tod !== phase) root.dataset.tod = phase;
    skyState?.request(phase);
    if (document.body.dataset.atmo !== phase) document.body.dataset.atmo = phase;
    for (const el of document.querySelectorAll('#atmoName, #current-season')) localize(el, labels[phases.indexOf(phase)]);
    root.dataset.daylightSource = coords ? 'solar' : 'clock';
    toggle.disabled = pending;
    localize(toggle, coords ? labels[6] : labels[5]);
    toggle.setAttribute('aria-pressed',String(!!coords));
    toggle.title = unavailable ? labels[7] : labels[4];
  }
  const sync = () => { const date = new Date(); updateEnvironment(date); apply(state.read(date)); };
  document.addEventListener('atmosphere:preferences', () => { lastMinute=''; sync(); });
  for (const button of document.querySelectorAll('#atmo, #atmo-cycle')) {
    button.title = labels[8];
    for (const el of button.querySelectorAll('small')) if (el.textContent.trim().toLowerCase()==='current atmosphere') localize(el, labels[9]);
    button.addEventListener('click', () => apply(state.cycle()));
  }
  const hint = document.querySelector('#atmoHint'); if (hint) localize(hint, labels[8]);
  function requestDaylight() {
    if(pending||coords)return;
    if (!navigator.geolocation) { unavailable=true; sync(); return; }
    pending=true; const id=++request; sync();
    navigator.geolocation.getCurrentPosition(position => {
      if(id!==request)return;
      const c=position.coords; coords={latitude:Math.round(c.latitude*10)/10,longitude:Math.round(c.longitude*10)/10};
      pending=false; unavailable=false; remember(true); lastMinute=''; sync();
    }, () => { if(id!==request)return; pending=false; unavailable=true; remember(false); sync(); }, {enableHighAccuracy:false,timeout:8000,maximumAge:300000});
  }
  toggle.addEventListener('click', () => {
    if(coords){coords=null;request++;unavailable=false;remember(false);lastMinute='';sync();return;}
    requestDaylight();
  });
  // Revoke in-memory coordinates if permission is withdrawn.
  navigator.permissions?.query({name:'geolocation'}).then(permission => {
    if(permission.state==='granted'&&preferred())requestDaylight();
    permission.addEventListener('change',()=>{if(permission.state!=='granted'&&coords){coords=null;pending=false;request++;remember(false);lastMinute='';sync();}});
  }).catch(()=>{});
  // Use four opacity layers, with existing artwork as a no-JS fallback.
  if (document.body.classList.contains('studio-world')) {
    const host = document.querySelector('#living-world-scene, .ws-scene, .scene, .page-scene') || document.body;
    const sky = document.createElement('div'); sky.className='studio-sky'; sky.setAttribute('aria-hidden','true');
    for(const phase of phases){
      const layer=document.createElement('div');layer.className='studio-sky-layer sky-'+phase;
      if(document.body.classList.contains('home-world')){
        const motion=document.createElement('div');motion.className='scene-motion-plate';
        for(const kind of ['blossoms','falls','water']){
          const part=document.createElement('div');part.className='scene-motion scene-'+kind;motion.append(part);
        }
        layer.append(motion);
      }
      sky.append(layer);
    }
    host.prepend(sky); host.classList.add('studio-sky-host');
    // Keep the last decoded painting until the latest requested one is ready.
    // Load the active phase first; prefetch the remaining three in the background.
    const images=new Map();
    const state=createSkyState(phase=>{root.dataset.renderedTod=phase;root.classList.add('studio-sky-ready');});
    function load(phase) {
      if(images.has(phase))return;
      const layer=sky.querySelector('.sky-'+phase);
      const match=getComputedStyle(layer).backgroundImage.match(/^url\(["']?(.*?)["']?\)$/);
      if(!match)return;
      const img=new Image(); images.set(phase,img);
      img.onload=()=>state.loaded(phase);
      img.onerror=()=>images.delete(phase);
      img.src=match[1];
    }
    skyState={request(phase){state.request(phase);load(phase);}};
    sync();
    const preload=()=>phases.forEach(load);
    if(typeof requestIdleCallback==='function')requestIdleCallback(preload,{timeout:3000});else setTimeout(preload,1000);
  }
  sync();
  setInterval(sync, 1000);
  document.addEventListener('visibilitychange', sync);
  addEventListener('pageshow', sync);
  addEventListener('focus', sync);
}

export function startAtmosphere() {
  const root = document.documentElement;
  const canvas = document.createElement('canvas');
  canvas.className = 'world-atmosphere';
  canvas.setAttribute('aria-hidden', 'true');
  const context = canvas.getContext('2d');
  if (!context) return;
  const homeStage = document.querySelector('.home-world .world-stage');
  const scene = homeStage || document.body;
  scene.append(canvas);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => reduced.matches || visitorPrefs.reduceMotion;
  let prefs = visitorPrefs;
  const currentVisual = () => resolveAtmosphere(visitorPrefs, new Date(), '', {season: root.dataset.season, holiday: root.dataset.holiday || ''});
  let state = currentVisual();
  function visualOpacity() { canvas.style.opacity = visitorPrefs.intensity === 0 ? '0' : String(.2 + visitorPrefs.intensity * .0055); }
  let width = 0, height = 0, particles = [], lights = [], frame = 0, last = 0;
  function resize() {
    width = scene.clientWidth;
    height = homeStage ? homeStage.clientHeight : innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const baseCount = Math.min(width < 700 ? 12 : 22, Math.max(8, Math.floor(width / 65)));
    const count = Math.round(baseCount * (.35 + visitorPrefs.intensity / 100));
    particles = Array.from({length: count}, (_,i) => ({x: Math.random()*width,y:Math.random()*height,r:1.5+Math.random()*3,s:.25+Math.random()*.55, phase:Math.random()*6.28,tone:i}));
    // Time-of-day layer, kept small: stars and fireflies, sunset embers, water glints, dawn mist.
    lights = Array.from({length: width < 700 ? 14 : 26}, () => ({x: Math.random()*width, y: Math.random()*height, u: Math.random(), v: Math.random(), phase: Math.random()*6.28}));
  }
  function tod() {
    const body = document.body, s = root.dataset.tod || body?.dataset.atmo || body?.dataset.atmosphere;
    if (s) return s;
    const h = new Date().getHours();
    return h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'sunset' : 'night';
  }
  let sprite = null; // firefly glow, drawn once and reused every frame
  function glow() {
    if (sprite) return sprite;
    sprite = document.createElement('canvas'); sprite.width = sprite.height = 14;
    const c = sprite.getContext('2d'), g = c.createRadialGradient(7,7,0,7,7,7);
    g.addColorStop(0,'rgba(232,255,150,1)'); g.addColorStop(1,'rgba(232,255,150,0)');
    c.fillStyle = g; c.fillRect(0,0,14,14); return sprite;
  }
  function drawLights(time) {
    const scene = tod();
    lights.forEach((p, i) => {
      const pulse = .5 + .5*Math.sin(time/(700+p.u*900)+p.phase);
      if (scene === 'night') {
        if (i % 2) { // stars twinkle in the upper sky
          context.fillStyle = `rgba(235,240,255,${.25+.6*pulse})`;
          context.beginPath(); context.arc(p.u*width, p.v*height*.42, .6+p.u*.9, 0, Math.PI*2); context.fill();
        } else { // fireflies wander above the water
          p.x += Math.sin(time/2100+p.phase)*.45; p.y += Math.cos(time/2600+p.phase)*.3;
          if (p.y < height*.35) p.y = height*.9; if (p.y > height) p.y = height*.4;
          context.globalAlpha = .85*pulse; context.drawImage(glow(), p.x-7, p.y-7); context.globalAlpha = 1;
        }
      } else if (scene === 'sunset') { // warm embers rise slowly
        p.y -= .25+p.u*.35; p.x += Math.sin(time/1900+p.phase)*.3;
        if (p.y < height*.2) { p.y = height+6; p.x = Math.random()*width; }
        context.fillStyle = `rgba(255,${150+Math.round(p.v*60)},90,${.25+.45*pulse})`;
        context.beginPath(); context.arc(p.x,p.y,1+p.v*1.6,0,Math.PI*2); context.fill();
      } else if (scene === 'day') { // sun glints flicker on the lake
        const glint = Math.max(0, Math.sin(time/(380+p.u*420)+p.phase));
        if (glint < .55) return;
        context.fillStyle = `rgba(255,255,240,${(glint-.55)*1.6})`;
        context.beginPath(); context.ellipse(p.u*width, height*(.66+p.v*.3), 3+p.u*6, .8, 0, 0, Math.PI*2); context.fill();
      } else if (i < 6) { // dawn mist drifts low across the water
        const x = ((p.u*width + time*(.006+p.v*.008)) % (width+400)) - 200, y = height*(.6+p.v*.3), r = 160+p.u*160;
        const g = context.createRadialGradient(x,y,0,x,y,r);
        g.addColorStop(0,'rgba(255,236,226,.16)'); g.addColorStop(1,'rgba(255,236,226,0)');
        context.fillStyle = g; context.fillRect(x-r,y-r,r*2,r*2);
      }
    });
  }
  function environment() { /* Local clock owns the environment state independently of animation. */ }
  function tick(time) {
    frame = 0;
    if (document.hidden || still()) return;
    frame = requestAnimationFrame(tick);
    if (time - last < 40) return;
    last = time; environment(); context.clearRect(0,0,width,height);
    const season = root.dataset.season, holiday = root.dataset.holiday;
    const rgb = MOOD_GLOW[visitorPrefs.mood];
    const tint = context.createRadialGradient(width/2,height*.45,Math.min(width,height)*.25,width/2,height*.45,Math.max(width,height)*.75);
    tint.addColorStop(0,`rgba(${rgb},0)`); tint.addColorStop(1,`rgba(${rgb},${visitorPrefs.intensity/1000})`);
    context.fillStyle=tint; context.fillRect(0,0,width,height);
    for (const p of particles) {
      p.y += p.s; p.x += Math.sin(time/1800+p.phase)*.27;
      if (p.y > height+10) {p.y=-10; p.x=Math.random()*width;}
      if (p.x < -10) p.x=width+10; else if (p.x>width+10) p.x=-10;
      const colors = COLORS[holiday] || COLORS[season] || COLORS.autumn;
      context.fillStyle = (Array.isArray(colors)?colors[p.tone%colors.length]:colors).replace('A',holiday?.length?'.65':season==='summer'?'.32':'.55');
      context.beginPath();
      if (season === 'autumn' || season === 'spring') context.ellipse(p.x,p.y,p.r,p.r*.48,time/2500+p.phase,0,Math.PI*2);
      else context.arc(p.x,p.y,p.r*(season === 'summer' ? .45 : .7),0,Math.PI*2);
      context.fill();
    }
    drawLights(time);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0; context.clearRect(0,0,width,height);
    environment();
    visualOpacity();
    if (!document.hidden && !still()) frame = requestAnimationFrame(tick);
  }
  function update(next) {
    visitorPrefs = cleanPrefs({...visitorPrefs,...next}); prefs = visitorPrefs; savePrefs(visitorPrefs);
    document.dispatchEvent(new CustomEvent('atmosphere:preferences'));
    resize(); sync(); render();
  }
  /* Settings panel: opened by any [data-atmo-settings] control, or the button added beside the atmosphere card. */
  if (!document.querySelector('link[href$="/assets/atmosphere.css"]')) {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/assets/atmosphere.css'; document.head.append(css);
  }
  const panel = document.createElement('div');
  panel.className = 'atmo-panel'; panel.hidden = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'atmoPanelTitle');
  panel.innerHTML = `<div class="atmo-sheet">
  <div class="atmo-head"><h2 id="atmoPanelTitle">Adaptive Atmosphere</h2><button type="button" class="atmo-x" data-close aria-label="Close">×</button></div>
  <p class="atmo-lede">A living experience that adapts on its own to the season and the holidays, and to your own style.</p>
  <p class="atmo-now" aria-live="polite"></p>
  <label class="atmo-row"><span><b>Adaptive Theme</b><small>Change with the season and holidays automatically</small></span><input type="checkbox" role="switch" data-k="adaptive"></label>
  <label class="atmo-field"><b>Preferred Season</b><select data-k="season"><option value="auto">Auto (Recommended)</option><option value="spring">Spring</option><option value="summer">Summer</option><option value="autumn">Autumn</option><option value="winter">Winter</option></select></label>
  <fieldset class="atmo-field"><legend><b>Colour Mood</b></legend><div class="atmo-moods">${MOODS.map(m => `<button type="button" class="atmo-mood" data-mood="${m}" aria-label="${m[0].toUpperCase()+m.slice(1)}" aria-pressed="false"></button>`).join('')}</div></fieldset>
  <label class="atmo-field"><b>Visual Intensity</b><input type="range" min="0" max="100" step="5" data-k="intensity"></label>
  <label class="atmo-row"><span><b>Holiday Themes</b><small>Regional holidays and seasonal events</small></span><input type="checkbox" role="switch" data-k="holidays"></label>
  <label class="atmo-row"><span><b>Reduce Motion</b><small>Stills the falling petals, leaves and snow</small></span><input type="checkbox" role="switch" data-k="reduceMotion"></label>
  <fieldset class="atmo-field"><legend><b>Theme Preview</b></legend><div class="atmo-previews">${SEASONS.map(s => `<button type="button" class="atmo-preview" data-season="${s}" aria-pressed="false">${LABEL[s]}</button>`).join('')}</div></fieldset>
  <p class="atmo-note">The daylight scene follows the local clock or optional daylight mode. Season changes affect visual particles and glow. Your choices stay in this browser only.</p>
</div>`;
  document.body.append(panel);
  const $ = (s) => panel.querySelector(s);
  let opener = null;
  function render() {
    prefs = visitorPrefs; state = currentVisual();
    $('[data-k=adaptive]').checked = prefs.adaptive;
    $('[data-k=season]').value = prefs.season;
    $('[data-k=intensity]').value = String(prefs.intensity);
    $('[data-k=holidays]').checked = prefs.holidays;
    $('[data-k=holidays]').disabled = !prefs.adaptive;
    $('[data-k=reduceMotion]').checked = prefs.reduceMotion;
    panel.querySelectorAll('.atmo-mood').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mood === prefs.mood)));
    panel.querySelectorAll('.atmo-preview').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.season === state.season)));
    $('.atmo-now').textContent = `Now showing: ${state.label}${prefs.season === 'auto' ? ' (automatic)' : ' (your choice)'}`;
  }
  panel.addEventListener('change', (e) => {
    const k = e.target.dataset.k; if (!k) return;
    update({ [k]: e.target.type === 'checkbox' ? e.target.checked : k === 'intensity' ? Number(e.target.value) : e.target.value });
  });
  panel.addEventListener('click', (e) => {
    if (e.target === panel || e.target.closest('[data-close]')) return close();
    const mood = e.target.closest('.atmo-mood'); if (mood) return update({ mood: mood.dataset.mood });
    const prev = e.target.closest('.atmo-preview'); if (prev) return update({ season: prev.dataset.season });
  });
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    const items = [...panel.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled])')];
    const first=items[0], last=items.at(-1);
    if (e.shiftKey && document.activeElement===first) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && document.activeElement===last) { e.preventDefault(); first?.focus(); }
  });
  function open(from) { opener = from || document.activeElement; render(); panel.hidden = false; $('[data-k=adaptive]').focus(); }
  function close() { panel.hidden = true; if (opener && opener.focus) opener.focus(); }
  document.addEventListener('click', (e) => { const t = e.target.closest('[data-atmo-settings]'); if (t) { e.preventDefault(); open(t); } });
  const card = document.querySelector('#atmo, #atmo-cycle, [data-atmo-card], .local-environment');
  if (card && !document.querySelector('[data-atmo-settings]')) {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'atmo-settings-btn'; btn.dataset.atmoSettings = '';
    btn.setAttribute('aria-label', 'Adaptive Atmosphere settings'); btn.setAttribute('aria-haspopup', 'dialog');
    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6z"/></svg><span>Adaptive</span>';
    card.insertAdjacentElement('afterend', btn);
  }

  resize(); environment(); sync();
  addEventListener('resize', resize, {passive:true});
  document.addEventListener('visibilitychange', sync);
  if (reduced.addEventListener) reduced.addEventListener('change',sync); else reduced.addListener(sync);
}
if (typeof document !== 'undefined') {
  const start = () => { startLocalTime(); startAtmosphere(); import('./ambience.mjs').then((m) => m.mountAmbienceControl()).catch(() => {}); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
}
