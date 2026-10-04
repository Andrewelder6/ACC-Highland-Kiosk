const BUILD='2026-10-04.2418';
const FEED='https://data.texas.gov/download/rmk2-acnw/application%2Foctet-stream';
const targets=[{key:'7n',stop:'1264',route:'7'},{key:'10s',stop:'3532',route:'10'},{key:'7s',stop:'5603',route:'7'}];
function varint(b,p){let n=0,s=0;while(p.i<b.length){let x=b[p.i++];n+=(x&127)*2**s;if(!(x&128))return n;s+=7}return n}
function fields(b){let p={i:0},o=[];while(p.i<b.length){let tag=varint(b,p),no=tag>>3,wt=tag&7;if(wt===0)o.push([no,wt,varint(b,p)]);else if(wt===2){let l=varint(b,p),v=b.subarray(p.i,p.i+l);p.i+=l;o.push([no,wt,v])}else if(wt===1)p.i+=8;else if(wt===5)p.i+=4;else break}return o}
const str=b=>new TextDecoder().decode(b);const sub=(f,n)=>f.filter(x=>x[0]===n&&x[1]===2).map(x=>x[2]);const val=(f,n)=>{let x=f.find(x=>x[0]===n&&x[1]===0);return x?.[2]};
function decode(buf){let b=new Uint8Array(buf),root=fields(b),out={};for(let t of targets)out[t.key]=[];for(let eb of sub(root,2)){let ef=fields(eb),tu=sub(ef,3)[0];if(!tu)continue;let tf=fields(tu),trip=sub(tf,1)[0];if(!trip)continue;let trf=fields(trip),route=(sub(trf,5)[0]&&str(sub(trf,5)[0]))||'';for(let sb of sub(tf,2)){let sf=fields(sb),stop=(sub(sf,4)[0]&&str(sub(sf,4)[0]))||'';for(let t of targets){if(stop!==t.stop||!(route===t.route||route.endsWith('-'+t.route)||route.endsWith('_'+t.route)))continue;let ev=sub(sf,2)[0]||sub(sf,3)[0];if(ev){let tm=val(fields(ev),2);if(tm&&tm*1000>Date.now()-60000)out[t.key].push(tm)}}}}for(let k in out)out[k]=[...new Set(out[k])].sort((a,b)=>a-b).slice(0,3);return out}
const imagePages={weather:'https://www.austintexas.gov/parks/locations/ann-and-roy-butler-hike-and-bike-trail-and-boardwalk-lady-bird-lake',fc:'https://www.austinfc.com/photos/',fcSupporters:'https://www.austinfc.com/news/city-legends-austin-fc-supporters-unveil-first-tifo',acc:'https://offices.austincc.edu/energy-and-sustainability/campus-sustainability-month/',oddBluebook:'https://prologue.blogs.archives.gov/2019/12/19/saucers-over-washington-the-history-of-project-blue-book/',oddRendlesham:'https://www.theblackvault.com/documentarchive/the-halt-memo-the-rendlesham-forest-incident/',oddAAWSAP:'https://www.dia.mil/FOIA/FOIA-Electronic-Reading-Room/FileId/211378/',oddBigfoot:'https://blogs.loc.gov/folklife/2024/05/on-the-trail-of-bigfoot-in-the-library-of-congress/',oddAARO:'https://www.aaro.mil/Next-AARO-Home-redesign/Next-Parent/Presidential-UAP-Transparency-Initiative/',oddTelepathy:'https://med.virginia.edu/perceptual-studies/category/all/study-of-psi/page/2/',oddConsciousness:'https://med.virginia.edu/perceptual-studies/',oddPEAR:'https://www.princeton.edu/news/2017/11/30/robert-jahn-pioneer-deep-space-propulsion-and-mind-machine-interactions-dies-87',oddStargate:'https://www.cia.gov/readingroom/document/cia-rdp96-00788r000900390001-1'};
const ACC_HIGHLAND_HERO='https://www.austincc.edu/wp-content/uploads/RS25712-HLC-campus-page-banner-2-1.jpg';
const ACC_CAMPUS_PAGES=[
  'https://www.austincc.edu/campuses/highland-campus/',
  'https://students.austincc.edu/infohub/2024/11/26/need-a-place-study-spots-around-campus-to-prep-for-finals/',
  'https://sites.austincc.edu/newsroom/2022/04/13/10-years-in-the-making-acc-celebrates-grand-opening-of-highland-campus/',
  'https://sites.austincc.edu/highland/'
];
const AUSTIN_CITY_PAGES=[
  'https://www.austintexas.org/',
  'https://www.austintexas.org/about-acvb/',
  'https://www.austintexas.org/explore/season/'
];
const WEATHER_PAGES=[
  'https://www.austintexas.gov/parks/locations/ann-and-roy-butler-hike-and-bike-trail-and-boardwalk-lady-bird-lake',
  'https://www.austintexas.gov/parks/locations/lady-bird-lake',
  'https://www.austintexas.gov/parks/locations/zilker-metropolitan-park',
  'https://www.austintexas.gov/parks/locations/barton-springs-pool',
  'https://www.austintexas.gov/parks/locations/auditorium-shores-at-town-lake-metropolitan-park'
];
const dayIndex=()=>Math.floor(Date.now()/86400000);
function ogFromHtml(html,page){
  const m=html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)/i)||html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i);
  return m?new URL(m[1].replace(/&amp;/g,'&'),page).href:null;
}
function highResMls(url){
  try{
    const u=new URL(url);
    if(!u.hostname.includes('images.mlssoccer.com'))return url;
    const marker='/image/private/';
    const p=u.pathname.indexOf(marker);
    if(p<0)return url;
    let tail=u.pathname.slice(p+marker.length);
    // Strip MLS/Cloudinary named transformations and keep the original versioned asset path.
    // Otherwise a low-res "editorial landscape" transform can stay in the URL and remain blurry
    // even when we prepend a larger width.
    const original=tail.match(/(v\d+\/.+)$/);
    if(original)tail=original[1];
    else tail=tail.replace(/^(?:[^/]*\/)*(?=(?:mls-atx-prd|mls-atx)\/)/,'');
    u.pathname=marker+'w_3000,q_auto:best,f_auto/'+tail;
    return u.href;
  }catch(e){return url}
}
async function fetchImageResponse(imageUrl,headers,label){
  const ir=await fetch(imageUrl,{headers});
  if(!ir.ok)return null;
  const hd=new Headers(ir.headers);
  hd.set('Cache-Control','public, max-age=21600');
  if(label)hd.set('X-Kiosk-Image-Source',label);
  hd.delete('set-cookie');
  return new Response(ir.body,{status:200,headers:hd});
}
async function fcDailyImage(headers){
  const listing=imagePages.fc;
  const lr=await fetch(listing,{headers});
  if(!lr.ok)return null;
  const html=await lr.text();
  let albums=[...html.matchAll(/href=["']([^"']*\/albums\/[^"']+)["']/ig)]
    .map(m=>new URL(m[1],listing).href)
    .filter(u=>/through-the-lens/i.test(u));
  albums=[...new Set(albums)].slice(0,40);
  if(!albums.length)return null;

  const d=dayIndex();
  const album=albums[d%albums.length];
  const ar=await fetch(album,{headers});
  if(!ar.ok)return null;
  const ah=await ar.text();

  // Prefer actual gallery image assets over og:image. og:image is often a small social-card crop.
  let imgs=[...ah.matchAll(/https:\/\/images\.mlssoccer\.com\/image\/private\/[^"'\s<)]+/ig)]
    .map(m=>m[0].replace(/&amp;/g,'&').replace(/\\u0026/g,'&'));
  imgs=[...new Set(imgs)]
    .filter(x=>/mls-atx-prd/i.test(x))
    .filter(x=>!/logo|crest|sponsor|icon|avatar/i.test(x));

  if(imgs.length){
    // Spread selections across the gallery from day to day, then force a Retina-friendly width.
    return highResMls(imgs[(d*11)%imgs.length]);
  }

  const og=ogFromHtml(ah,album);
  return og?highResMls(og):null;
}

function wordpressOriginal(url){
  try{
    const u=new URL(url);
    u.pathname=u.pathname.replace(/-\d+x\d+(?=\.[a-z0-9]+$)/i,'');
    return u.href;
  }catch(e){return url}
}
async function accCampusDailyImage(headers){
  const page=ACC_CAMPUS_PAGES[dayIndex()%ACC_CAMPUS_PAGES.length];
  const r=await fetch(page,{headers});
  if(!r.ok)return ACC_HIGHLAND_HERO;
  const html=await r.text();
  let imgs=[...html.matchAll(/https?:\/\/[^"'\s<]+\/wp-content\/uploads\/[^"'\s<]+\.(?:jpe?g|png|webp)/ig)]
    .map(m=>m[0].replace(/&amp;/g,'&'))
    .map(wordpressOriginal);
  imgs=[...new Set(imgs)].filter(u=>!/logo|icon|avatar|favicon/i.test(u));
  if(imgs.length)return imgs[(dayIndex()*5)%imgs.length];
  return wordpressOriginal(ogFromHtml(html,page)||ACC_HIGHLAND_HERO);
}
async function austinCityDailyImage(headers){
  const page=AUSTIN_CITY_PAGES[dayIndex()%AUSTIN_CITY_PAGES.length];
  const r=await fetch(page,{headers});
  if(!r.ok)return null;
  const html=await r.text();
  // Prefer an actual photographic page asset rather than a logo/social-card graphic.
  let imgs=[...html.matchAll(/https?:\/\/[^"'\s<]+\.(?:jpe?g|png|webp)(?:\?[^"'\s<]*)?/ig)]
    .map(m=>m[0].replace(/&amp;/g,'&'))
    .filter(u=>!/logo|icon|favicon|avatar|sprite|badge|map/i.test(u));
  imgs=[...new Set(imgs)];
  if(imgs.length)return imgs[(dayIndex()*7)%imgs.length];
  return ogFromHtml(html,page);
}

const AUSTIN_HISTORY_ARKS=[
  'metapth125125', // Congress Avenue, c. 1868
  'metapth124043', // Driskill Hotel, 1888
  'metapth124420', // Barton Springs, 1937
  'metapth125219', // Moonlight Tower, 1930s
  'metapth19409',  // Moonlight tower / UT view, 1954
  'metapth856999', // Driskill front desk, 1952
  'metapth124427', // Barton Springs bathhouse, 1947
  'metapth124687'  // Barton Springs, 1939
];
async function historyDailyImage(headers){
  const ark=AUSTIN_HISTORY_ARKS[dayIndex()%AUSTIN_HISTORY_ARKS.length];
  // UNT's IIIF endpoint serves the archival master image directly and is far more reliable
  // than the previous Library of Congress search JSON for this kiosk use.
  const imageUrl='https://texashistory.unt.edu/iiif/ark:/67531/'+ark+'/m1/1/full/max/0/default.jpg';
  const test=await fetch(imageUrl,{headers});
  if(!test.ok)return null;
  return imageUrl;
}

const AUSTIN_WEATHER_CAM_UIDS=[
  '2939d836b533ffb122d7a9fa3f196e71', // Standard Insurance Tower
  '6dc32d9a0735478a37d6eb85de56b54d', // Hyatt Regency Austin
  'a0cc74fe637214c44ef6823c82fc0214'  // Hyatt Regency Austin alternate
];
async function weatherCamImage(headers){
  const uid=AUSTIN_WEATHER_CAM_UIDS[dayIndex()%AUSTIN_WEATHER_CAM_UIDS.length];
  const imageUrl='https://api.wetmet.net/widgets/image/frame.php?uid='+uid+'&type=image&format=image.jpg';
  const r=await fetch(imageUrl,{headers});
  if(!r.ok)return null;
  const ct=(r.headers.get('content-type')||'').toLowerCase();
  if(!ct.startsWith('image/'))return null;
  return {url:imageUrl,response:r};
}

async function officialImage(kind,mode){
  const headers={'User-Agent':'Mozilla/5.0'};
  if(kind==='fcDaily'){
    const imageUrl=await fcDailyImage(headers);
    if(!imageUrl)return new Response('image unavailable',{status:404});
    return await fetchImageResponse(imageUrl,headers,'AustinFC-ThroughTheLens-retina')||new Response('image unavailable',{status:502});
  }
  if(kind==='historyDaily'){
    const imageUrl=await historyDailyImage(headers);
    if(!imageUrl)return new Response('image unavailable',{status:404});
    return await fetchImageResponse(imageUrl,headers,'Austin-History-Center-UNT-IIIF')||new Response('image unavailable',{status:502});
  }
  if(kind==='weatherCam'){
    const cam=await weatherCamImage(headers);
    if(!cam)return new Response('image unavailable',{status:404});
    const hd=new Headers(cam.response.headers);hd.set('Cache-Control','public, max-age=180');hd.set('X-Kiosk-Image-Source','FOX7-WMVision-Austin-weather-cam');hd.delete('set-cookie');
    return new Response(cam.response.body,{status:200,headers:hd});
  }
  if(kind==='accHighland'){
    return await fetchImageResponse(ACC_HIGHLAND_HERO,headers,'ACC-Highland-official-original')||new Response('image unavailable',{status:502});
  }
  if(kind==='accCampusDaily'){
    const imageUrl=await accCampusDailyImage(headers);
    if(!imageUrl)return new Response('image unavailable',{status:404});
    return await fetchImageResponse(imageUrl,headers,'ACC-campus-daily-official')||await fetchImageResponse(ACC_HIGHLAND_HERO,headers,'ACC-Highland-fallback')||new Response('image unavailable',{status:502});
  }
  if(kind==='austinCityDaily'){
    const imageUrl=await austinCityDailyImage(headers);
    if(!imageUrl)return new Response('image unavailable',{status:404});
    return await fetchImageResponse(imageUrl,headers,'Visit-Austin-downtown-daily')||new Response('image unavailable',{status:502});
  }
  let page=imagePages[kind];
  if(kind==='weatherDaily'){
    const offset={clear:0,cloudy:1,rain:2,storm:3,fog:4}[mode]??0;
    page=WEATHER_PAGES[(dayIndex()+offset)%WEATHER_PAGES.length];
  }
  if(!page)return new Response('unknown image',{status:404});
  if(kind==='fc'){
    const listing=await fetch(page,{headers});
    const html=await listing.text();
    let albums=[...html.matchAll(/href=["']([^"']*\/albums\/[^"']+)["']/ig)].map(m=>new URL(m[1],page).href);
    albums=[...new Set(albums)].slice(0,16);
    if(albums.length)page=albums[dayIndex()%albums.length];
  }
  const r=await fetch(page,{headers});
  if(!r.ok)return new Response('image unavailable',{status:502});
  const html=await r.text();
  const imageUrl=ogFromHtml(html,page);
  if(!imageUrl)return new Response('image unavailable',{status:404});
  return await fetchImageResponse(highResMls(imageUrl),headers,kind)||new Response('image unavailable',{status:502});
}

export default{async fetch(req,env){let u=new URL(req.url);if(u.pathname==='/api/version')return Response.json({build:BUILD},{headers:{'Cache-Control':'no-store'}});if(u.pathname==='/api/official-image')return officialImage(u.searchParams.get('kind'),u.searchParams.get('mode')||'clear');if(u.pathname==='/api/buses'){try{let r=await fetch(FEED,{cf:{cacheTtl:0}});if(!r.ok)throw Error('feed '+r.status);let routes=decode(await r.arrayBuffer());return Response.json({updatedAt:Date.now(),routes},{headers:{'Cache-Control':'no-store'}})}catch(e){return Response.json({updatedAt:Date.now(),routes:{'7n':[],'10s':[],'7s':[]},error:String(e)},{status:503})}}return env.ASSETS.fetch(req)}}