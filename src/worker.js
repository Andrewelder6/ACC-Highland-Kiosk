const FEED='https://data.texas.gov/download/rmk2-acnw/application%2Foctet-stream';
const targets=[{key:'7n',stop:'1264',route:'7'},{key:'10s',stop:'3532',route:'10'},{key:'7s',stop:'5603',route:'7'}];
function varint(b,p){let n=0,s=0;while(p.i<b.length){let x=b[p.i++];n+=(x&127)*2**s;if(!(x&128))return n;s+=7}return n}
function fields(b){let p={i:0},o=[];while(p.i<b.length){let tag=varint(b,p),no=tag>>3,wt=tag&7;if(wt===0)o.push([no,wt,varint(b,p)]);else if(wt===2){let l=varint(b,p),v=b.subarray(p.i,p.i+l);p.i+=l;o.push([no,wt,v])}else if(wt===1)p.i+=8;else if(wt===5)p.i+=4;else break}return o}
const str=b=>new TextDecoder().decode(b);const sub=(f,n)=>f.filter(x=>x[0]===n&&x[1]===2).map(x=>x[2]);const val=(f,n)=>{let x=f.find(x=>x[0]===n&&x[1]===0);return x?.[2]};
function decode(buf){let b=new Uint8Array(buf),root=fields(b),out={};for(let t of targets)out[t.key]=[];for(let eb of sub(root,2)){let ef=fields(eb),tu=sub(ef,3)[0];if(!tu)continue;let tf=fields(tu),trip=sub(tf,1)[0];if(!trip)continue;let trf=fields(trip),route=(sub(trf,5)[0]&&str(sub(trf,5)[0]))||'';for(let sb of sub(tf,2)){let sf=fields(sb),stop=(sub(sf,4)[0]&&str(sub(sf,4)[0]))||'';for(let t of targets){if(stop!==t.stop||!(route===t.route||route.endsWith('-'+t.route)||route.endsWith('_'+t.route)))continue;let ev=sub(sf,2)[0]||sub(sf,3)[0];if(ev){let tm=val(fields(ev),2);if(tm&&tm*1000>Date.now()-60000)out[t.key].push(tm)}}}}for(let k in out)out[k]=[...new Set(out[k])].sort((a,b)=>a-b).slice(0,3);return out}
const imagePages={weather:'https://www.austintexas.gov/parks/locations/ann-and-roy-butler-hike-and-bike-trail-and-boardwalk-lady-bird-lake',fc:'https://www.austinfc.com/photos/',fcSupporters:'https://www.austinfc.com/news/city-legends-austin-fc-supporters-unveil-first-tifo',acc:'https://offices.austincc.edu/energy-and-sustainability/campus-sustainability-month/',oddBluebook:'https://prologue.blogs.archives.gov/2019/12/19/saucers-over-washington-the-history-of-project-blue-book/',oddRendlesham:'https://www.theblackvault.com/documentarchive/the-halt-memo-the-rendlesham-forest-incident/',oddAAWSAP:'https://www.dia.mil/FOIA/FOIA-Electronic-Reading-Room/FileId/211378/',oddBigfoot:'https://blogs.loc.gov/folklife/2024/05/on-the-trail-of-bigfoot-in-the-library-of-congress/',oddAARO:'https://www.aaro.mil/Next-AARO-Home-redesign/Next-Parent/Presidential-UAP-Transparency-Initiative/',oddTelepathy:'https://med.virginia.edu/perceptual-studies/category/all/study-of-psi/page/2/',oddConsciousness:'https://med.virginia.edu/perceptual-studies/',oddPEAR:'https://www.princeton.edu/news/2017/11/30/robert-jahn-pioneer-deep-space-propulsion-and-mind-machine-interactions-dies-87',oddStargate:'https://www.cia.gov/readingroom/document/cia-rdp96-00788r000900390001-1'};
const weatherPools={
  clear:[
    'https://www.austintexas.gov/parks/locations/ann-and-roy-butler-hike-and-bike-trail-and-boardwalk-lady-bird-lake',
    'https://www.austintexas.gov/parks/locations/lady-bird-lake',
    'https://www.austintexas.gov/parks/locations/zilker-metropolitan-park'
  ],
  cloudy:[
    'https://www.austintexas.gov/parks/locations/lady-bird-lake',
    'https://www.austintexas.gov/parks/locations/ann-and-roy-butler-hike-and-bike-trail-and-boardwalk-lady-bird-lake',
    'https://www.austintexas.gov/parks/locations/zilker-metropolitan-park'
  ],
  rain:[
    'https://www.austintexas.gov/parks/locations/ann-and-roy-butler-hike-and-bike-trail-and-boardwalk-lady-bird-lake',
    'https://www.austintexas.gov/parks/locations/lady-bird-lake'
  ],
  storm:[
    'https://www.austintexas.gov/parks/locations/lady-bird-lake',
    'https://www.austintexas.gov/parks/locations/ann-and-roy-butler-hike-and-bike-trail-and-boardwalk-lady-bird-lake'
  ],
  fog:[
    'https://www.austintexas.gov/parks/locations/lady-bird-lake',
    'https://www.austintexas.gov/parks/locations/ann-and-roy-butler-hike-and-bike-trail-and-boardwalk-lady-bird-lake'
  ]
};
function dayIndex(){return Math.floor(Date.now()/86400000)}
function highResMls(url){
  try{
    const u=new URL(url);
    if(!u.hostname.includes('images.mlssoccer.com'))return url;
    let parts=u.pathname.split('/');
    const i=parts.indexOf('private');
    if(i>=0){
      const tail=parts.slice(i+1).filter(p=>!/^w_\d+/.test(p)&&!/^q_/.test(p)&&!/^f_/.test(p)&&!/^t_/.test(p));
      u.pathname=parts.slice(0,i+1).concat(['w_2400,q_auto:best,f_auto'],tail).join('/');
    }
    return u.href;
  }catch(e){return url}
}
async function pageOgImage(page,headers){
  const r=await fetch(page,{headers}),html=await r.text();
  const m=html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)/i)||html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i);
  return m?new URL(m[1].replace(/&amp;/g,'&'),page).href:null;
}
async function fcDailyImage(headers){
  const listing=imagePages.fc;
  const r=await fetch(listing,{headers}),html=await r.text();
  let albums=[...html.matchAll(/href=["']([^"']*\/albums\/through-the-lens-[^"']+)["']/ig)].map(m=>new URL(m[1],listing).href);
  albums=[...new Set(albums)].slice(0,18);
  if(!albums.length)return null;
  const d=dayIndex();
  // Use several recent match galleries, then a different image within the chosen gallery each day.
  const album=albums[d%albums.length];
  const ar=await fetch(album,{headers}),ah=await ar.text();
  let imgs=[...ah.matchAll(/https:\/\/images\.mlssoccer\.com\/image\/private\/[^"'\s<]+/ig)].map(m=>m[0].replace(/&amp;/g,'&'));
  imgs=[...new Set(imgs)].filter(x=>!/logo|crest|sponsor/i.test(x));
  if(imgs.length)return highResMls(imgs[(d*7)%imgs.length]);
  const og=await pageOgImage(album,headers);
  return og?highResMls(og):null;
}
async function officialImage(kind,mode){
  let page=imagePages[kind];
  const headers={'User-Agent':'Mozilla/5.0'};
  if(kind==='fcDaily'){
    const imageUrl=await fcDailyImage(headers);
    if(!imageUrl)return new Response('image unavailable',{status:404});
    const ir=await fetch(imageUrl,{headers});
    if(!ir.ok)return new Response('image unavailable',{status:502});
    const hd=new Headers(ir.headers);hd.set('Cache-Control','public, max-age=21600');hd.set('X-Kiosk-Image-Source','AustinFC-live-gallery');hd.delete('set-cookie');
    return new Response(ir.body,{status:200,headers:hd});
  }
  if(kind==='weatherDaily'){
    const pool=weatherPools[mode]||weatherPools.clear;
    page=pool[dayIndex()%pool.length];
  }
  if(!page)return new Response('unknown image',{status:404});
  if(kind==='fc'){
    let listing=await fetch(page,{headers}),html=await listing.text();
    let albums=[...html.matchAll(/href=["']([^"']*\/albums\/[^"']+)["']/ig)].map(m=>new URL(m[1],page).href);
    albums=[...new Set(albums)].slice(0,8);
    if(albums.length){
      let pick=albums[Math.floor(Date.now()/86400000)%albums.length];
      let ar=await fetch(pick,{headers}),ah=await ar.text();
      let am=ah.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)/i)||ah.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i);
      if(am)page=pick;
    }
  }
  let r=await fetch(page,{headers}),html=await r.text();
  let m=html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)/i)||html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i);
  if(!m)return new Response('image unavailable',{status:404});
  let imageUrl=new URL(m[1],page).href;
  let ir=await fetch(imageUrl,{headers});
  if(!ir.ok)return new Response('image unavailable',{status:502});
  let hd=new Headers(ir.headers);hd.set('Cache-Control','public, max-age=21600');hd.delete('set-cookie');
  return new Response(ir.body,{status:200,headers:hd})
}
export default{async fetch(req,env){let u=new URL(req.url);if(u.pathname==='/api/official-image')return officialImage(u.searchParams.get('kind'),u.searchParams.get('mode')||'clear');if(u.pathname==='/api/buses'){try{let r=await fetch(FEED,{cf:{cacheTtl:0}});if(!r.ok)throw Error('feed '+r.status);let routes=decode(await r.arrayBuffer());return Response.json({updatedAt:Date.now(),routes},{headers:{'Cache-Control':'no-store'}})}catch(e){return Response.json({updatedAt:Date.now(),routes:{'7n':[],'10s':[],'7s':[]},error:String(e)},{status:503})}}return env.ASSETS.fetch(req)}}