const BUILD='2026-10-05.2014';
const FEED='https://data.texas.gov/download/rmk2-acnw/application%2Foctet-stream';
const targets=[{key:'7n',stop:'1264',route:'7'},{key:'10s',stop:'3532',route:'10'},{key:'7s',stop:'5603',route:'7'}];
function varint(b,p){let n=0,s=0;while(p.i<b.length){let x=b[p.i++];n+=(x&127)*2**s;if(!(x&128))return n;s+=7}return n}
function fields(b){let p={i:0},o=[];while(p.i<b.length){let tag=varint(b,p),no=tag>>3,wt=tag&7;if(wt===0)o.push([no,wt,varint(b,p)]);else if(wt===2){let l=varint(b,p),v=b.subarray(p.i,p.i+l);p.i+=l;o.push([no,wt,v])}else if(wt===1)p.i+=8;else if(wt===5)p.i+=4;else break}return o}
const str=b=>new TextDecoder().decode(b);const sub=(f,n)=>f.filter(x=>x[0]===n&&x[1]===2).map(x=>x[2]);const val=(f,n)=>{let x=f.find(x=>x[0]===n&&x[1]===0);return x?.[2]};
function decode(buf){let b=new Uint8Array(buf),root=fields(b),out={};for(let t of targets)out[t.key]=[];for(let eb of sub(root,2)){let ef=fields(eb),tu=sub(ef,3)[0];if(!tu)continue;let tf=fields(tu),trip=sub(tf,1)[0];if(!trip)continue;let trf=fields(trip),route=(sub(trf,5)[0]&&str(sub(trf,5)[0]))||'';for(let sb of sub(tf,2)){let sf=fields(sb),stop=(sub(sf,4)[0]&&str(sub(sf,4)[0]))||'';for(let t of targets){if(stop!==t.stop||!(route===t.route||route.endsWith('-'+t.route)||route.endsWith('_'+t.route)))continue;let ev=sub(sf,2)[0]||sub(sf,3)[0];if(ev){let tm=val(fields(ev),2);if(tm&&tm*1000>Date.now()-60000)out[t.key].push(tm)}}}}for(let k in out)out[k]=[...new Set(out[k])].sort((a,b)=>a-b).slice(0,3);return out}

const FC_PHOTOS_PAGE='https://www.austinfc.com/photos/';
function dayIndex(){
  const parts=new Intl.DateTimeFormat('en-US',{
    timeZone:'America/Chicago',year:'numeric',month:'numeric',day:'numeric'
  }).formatToParts(new Date());
  const n=t=>Number(parts.find(p=>p.type===t)?.value||0);
  return Math.floor(Date.UTC(n('year'),n('month')-1,n('day'))/86400000);
}

function ogFromHtml(html,page){
  const m=html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)/i)
    ||html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i);
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
    const original=tail.match(/(v\d+\/.+)$/);
    if(original)tail=original[1];
    else tail=tail.replace(/^(?:[^/]*\/)*(?=(?:mls-atx-prd|mls-atx)\/)/,'');
    u.pathname=marker+'w_3000,q_auto:best,f_auto/'+tail;
    return u.href;
  }catch{return url}
}

async function fetchImageResponse(imageUrl,headers,label){
  const r=await fetch(imageUrl,{headers});
  if(!r.ok)return null;
  const hd=new Headers(r.headers);
  hd.set('Cache-Control','public, max-age=21600');
  if(label)hd.set('X-Kiosk-Image-Source',label);
  hd.delete('set-cookie');
  return new Response(r.body,{status:200,headers:hd});
}

async function fcDailyImage(headers,slot=0){
  const listing=await fetch(FC_PHOTOS_PAGE,{headers});
  if(!listing.ok)return null;
  const html=await listing.text();
  let albums=[...html.matchAll(/href=["']([^"']*\/albums\/[^"']+)["']/ig)]
    .map(m=>new URL(m[1],FC_PHOTOS_PAGE).href)
    .filter(u=>/through-the-lens/i.test(u));
  albums=[...new Set(albums)].slice(0,40);
  if(!albums.length)return null;

  const d=dayIndex();
  const album=albums[d%albums.length];
  const page=await fetch(album,{headers});
  if(!page.ok)return null;
  const albumHtml=await page.text();

  let imgs=[...albumHtml.matchAll(/https:\/\/images\.mlssoccer\.com\/image\/private\/[^"'\s<)]+/ig)]
    .map(m=>m[0].replace(/&amp;/g,'&').replace(/\\u0026/g,'&'));
  imgs=[...new Set(imgs)]
    .filter(x=>/mls-atx-prd/i.test(x))
    .filter(x=>!/logo|crest|sponsor|icon|avatar/i.test(x));

  if(imgs.length)return highResMls(imgs[(d*11+Math.max(0,slot)*7)%imgs.length]);
  const og=ogFromHtml(albumHtml,album);
  return og?highResMls(og):null;
}

async function officialImage(kind,slot){
  const headers={'User-Agent':'Mozilla/5.0'};
  if(kind==='fcDaily'){
    const url=await fcDailyImage(headers,slot);
    if(!url)return new Response('image unavailable',{status:404});
    return await fetchImageResponse(url,headers,'AustinFC-ThroughTheLens-retina')
      ||new Response('image unavailable',{status:502});
  }
  return new Response('unknown image',{status:404});
}

export default{
  async fetch(req,env){
    const u=new URL(req.url);

    if(u.pathname==='/api/version'){
      return Response.json({build:BUILD},{headers:{'Cache-Control':'no-store'}});
    }

    if(u.pathname==='/api/official-image'){
      const slot=Math.max(0,Number.parseInt(u.searchParams.get('slot')||'0',10)||0);
      return officialImage(u.searchParams.get('kind'),slot);
    }

    if(u.pathname==='/api/buses'){
      try{
        const r=await fetch(FEED,{cf:{cacheTtl:0}});
        if(!r.ok)throw Error('feed '+r.status);
        const routes=decode(await r.arrayBuffer());
        return Response.json({updatedAt:Date.now(),routes},{headers:{'Cache-Control':'no-store'}});
      }catch(e){
        return Response.json(
          {updatedAt:Date.now(),routes:{'7n':[],'10s':[],'7s':[]},error:String(e)},
          {status:503,headers:{'Cache-Control':'no-store'}}
        );
      }
    }

    const asset=await env.ASSETS.fetch(req);
    if(u.pathname==='/'||u.pathname==='/index.html'){
      const hd=new Headers(asset.headers);
      hd.set('Cache-Control','no-store, max-age=0');
      return new Response(asset.body,{status:asset.status,headers:hd});
    }
    return asset;
  }
};
