/* ================= Chantier Pro ================= */
const COLLS=['chantiers','etapes','achats','employes','paiements','devis','bons','recus','journal','historique','articles','mouvements','materiel','controles','stockcfg','contrats','baux','quittances'];
const S={config:{tauxCAD:409,entreprise:{}},prixOv:{},artOv:{},sig:'',cachet:''};COLLS.forEach(c=>S[c]=[]);
let db=null,assets=null,downloads=null,mode='loading',slowNote=false;

/* ---------- utilitaires ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>{const n=parseFloat(String(v??'').replace(/\s/g,'').replace(',','.'));return isFinite(n)?n:0};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const today=()=>ymd(new Date());
const parseD=s=>{const[y,m,d]=(s||today()).split('-').map(Number);return new Date(y,m-1,d)};
const addDays=(s,n)=>{const d=parseD(s);d.setDate(d.getDate()+n);return ymd(d)};
const mondayOf=s=>{const d=parseD(s);d.setDate(d.getDate()-((d.getDay()+6)%7));return ymd(d)};
const sum=(a,f)=>a.reduce((s,x)=>s+f(x),0);
const taux=()=>num(S.config.tauxCAD)||409;
const sp=s=>s.replace(/[  ]/g,' ');
const FN=n=>sp(Math.round(n).toLocaleString('fr-FR'));
const F=n=>FN(n)+' FCFA';
const C=n=>sp((n/taux()).toLocaleString('fr-CA',{maximumFractionDigits:Math.abs(n/taux())<100?2:0}))+' $ CA';
const M$=n=>`${F(n)}<small>≈ ${C(n)}</small>`;
const N=(n,d=2)=>sp((+n).toLocaleString('fr-FR',{maximumFractionDigits:d}));
const dfr=d=>{if(!d)return'';const[y,m,j]=d.split('-');return j+'/'+m+'/'+y};
const ent=()=>S.config.entreprise||{};
function toast(msg){const r=$('#toastRoot');r.innerHTML=`<div class="toast">${esc(msg)}</div>`;clearTimeout(toast.t);toast.t=setTimeout(()=>r.innerHTML='',3000)}
function errMsg(e){const c=e&&e.code;return c==='invalid_argument'?"Tu n'as pas l'autorisation de modifier ces données.":c==='quota_exceeded'?'Espace de stockage plein.':"Échec de l'enregistrement, réessaie."}

function lettres(n){
  n=Math.round(Math.abs(n));if(n===0)return 'zéro';
  const u=['','un','deux','trois','quatre','cinq','six','sept','huit','neuf','dix','onze','douze','treize','quatorze','quinze','seize','dix-sept','dix-huit','dix-neuf'];
  const dz=['','dix','vingt','trente','quarante','cinquante','soixante','soixante','quatre-vingt','quatre-vingt'];
  const deux=(x,fin)=>{if(x<20)return u[x];const t=Math.floor(x/10),r=x%10;
    if(t===7||t===9)return dz[t]+(t===7&&r===1?'-et-':'-')+u[10+r];
    if(t===8)return r?'quatre-vingt-'+u[r]:(fin?'quatre-vingts':'quatre-vingt');
    return dz[t]+(r===1?'-et-un':r?'-'+u[r]:'')};
  const trois=(x,fin)=>{const c=Math.floor(x/100),r=x%100;let s='';
    if(c){s=c===1?'cent':u[c]+'-cent';if(!r&&c>1&&fin)s+='s'}
    if(r)s+=(s?'-':'')+deux(r,fin);return s};
  const mi=Math.floor(n/1e9),mo=Math.floor(n%1e9/1e6),k=Math.floor(n%1e6/1000),r=n%1000,p=[];
  if(mi)p.push(trois(mi,true)+'-milliard'+(mi>1?'s':''));
  if(mo)p.push(trois(mo,true)+'-million'+(mo>1?'s':''));
  if(k)p.push(k===1?'mille':trois(k,false)+'-mille');
  if(r)p.push(trois(r,true));
  const s=p.join('-');return s.charAt(0).toUpperCase()+s.slice(1);
}

/* ---------- catalogue ---------- */
const BASE={};CATALOGUE.forEach(s=>s.a.forEach(([ref,nom,unite,prix])=>BASE[ref]={ref,nom,unite,prix,secteur:s.id}));
const SECT=Object.fromEntries(CATALOGUE.map(s=>[s.id,s]));
function art(ref){if(BASE[ref]){const o=S.artOv[ref]||{};return {...BASE[ref],...(o.nom?{nom:o.nom}:{}),...(o.unite?{unite:o.unite}:{}),hidden:!!o.hidden,modif:!!(o.nom||o.unite),prix:prixOf(ref)}}if(String(ref).startsWith('u-')){const a=S.articles.find(x=>'u-'+x.id===ref);if(a)return {ref,nom:a.nom,unite:a.unite,prix:num(a.prix),secteur:a.secteur,custom:true,id:a.id}}return null}
function prixOf(ref){const o=S.prixOv&&S.prixOv[ref];if(o!=null&&o!=='')return num(o);if(BASE[ref])return BASE[ref].prix;const a=art(ref);return a?a.prix:0}
function articles(sect,cach){const out=[];CATALOGUE.forEach(s=>{if(!sect||s.id===sect)s.a.forEach(([ref])=>{const x=art(ref);if(!!x.hidden===!!cach)out.push(x)})});if(cach)return out;S.articles.forEach(a=>{if(!sect||a.secteur===sect)out.push(art('u-'+a.id))});return out}
const CIMENTS=CATALOGUE[0].a.filter(a=>a[0].startsWith('cim-'));

/* ---------- données ---------- */
const byC=(c,cid)=>S[c].filter(x=>x.chantierId===cid);
const etapesOf=cid=>byC('etapes',cid).sort((a,b)=>num(a.ordre)-num(b.ordre));
const totA=a=>num(a.quantite)*num(a.prixUnit);
const totL=ls=>sum(ls||[],x=>num(x.qte)*num(x.pu));
function persistLocal(){try{const o={};COLLS.forEach(c=>o[c]=S[c]);o.config=S.config;o.prixOv=S.prixOv;o.artOv=S.artOv;o.sig=S.sig;o.cachet=S.cachet;localStorage.setItem('chantierpro2',JSON.stringify(o))}catch(e){}}
function loadLocal(){try{const d=JSON.parse(localStorage.getItem('chantierpro2')||'null');if(d){COLLS.forEach(c=>S[c]=d[c]||[]);if(d.config)S.config=d.config;if(d.prixOv)S.prixOv=d.prixOv;if(d.artOv)S.artOv=d.artOv;S.sig=d.sig||'';S.cachet=d.cachet||''}}catch(e){}}
function upsertLocal(c,rec){const a=S[c],i=a.findIndex(x=>x.id===rec.id);if(i>=0)a[i]=rec;else a.push(rec)}
let rq=false;function scheduleRender(){if(rq)return;rq=true;requestAnimationFrame(()=>{rq=false;render()})}
async function save(c,obj){
  const o=JSON.parse(JSON.stringify(obj));const id=o.id||uid();delete o.id;o.maj=Date.now();
  upsertLocal(c,{id,...o});scheduleRender();
  if(mode==='db'){try{await db.collection(c).doc(id).set(o)}catch(e){toast(errMsg(e));throw e}}else persistLocal();
  return id;
}
const saving={};
function queueSave(c,obj){const k=c+'/'+obj.id;upsertLocal(c,obj);scheduleRender();
  if(saving[k]){saving[k].next=obj;return}saving[k]={next:null};
  (async()=>{let o=obj;while(o){try{await save(c,o)}catch(e){}o=saving[k].next;saving[k].next=null}delete saving[k]})()}
async function del(c,id){S[c]=S[c].filter(x=>x.id!==id);scheduleRender();
  if(mode==='db'){try{await db.collection(c).doc(id).delete()}catch(e){toast('Échec de la suppression.');throw e}}else persistLocal()}
async function saveConfig(cfg){S.config={...S.config,...cfg};scheduleRender();
  if(mode==='db'){try{await db.doc('config/app').set(S.config)}catch(e){toast(errMsg(e))}}else persistLocal()}
/* signature et cachet : enregistrés une fois (fichier image dans l'appli + copie sur l'appareil), réutilisés à chaque signature */
const SIGLS='chantierpro_sig';let sigIds={};
function sigCache(){try{const c=JSON.parse(localStorage.getItem(SIGLS)||'{}');['sig','cachet'].forEach(k=>{if(c[k]&&!S[k]){S[k]=c[k].d;sigIds[k]=c[k].id}})}catch(e){}}
function sigCacheSet(){try{localStorage.setItem(SIGLS,JSON.stringify({sig:{id:sigIds.sig||'',d:S.sig},cachet:{id:sigIds.cachet||'',d:S.cachet}}))}catch(e){}}
const blobToUrl=b=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(b)});
async function sigLoad(k,id){if(!id){if(sigIds[k]){S[k]='';sigIds[k]='';sigCacheSet()}return}if(id===sigIds[k]&&S[k])return;
  try{const r=await fetch('/_blob/'+id);if(!r.ok)throw 0;S[k]=await blobToUrl(await r.blob());sigIds[k]=id;sigCacheSet()}catch(e){}}
async function saveImg(k,d){S[k]=d||'';
  if(mode==='db'){try{let id='';if(d){const b=await (await fetch(d)).blob();id=(await assets.upload(b,{type:'image/png'})).id}
      sigIds[k]=id;await db.doc('config/sigs').set({...sigIds,[k]:id});sigCacheSet();return true}
    catch(e){toast((k==='sig'?'Signature':'Cachet')+" non enregistré(e) : "+errMsg(e));return false}}
  persistLocal();return true}
async function savePrix(){scheduleRender();if(mode==='db'){try{await db.doc('config/prix').set({p:S.prixOv,o:S.artOv})}catch(e){toast(errMsg(e))}}else persistLocal()}
function nextNum(c,pre){const y=new Date().getFullYear(),p=pre+'-'+y+'-';const mx=Math.max(0,...S[c].map(x=>String(x.numero||'')).filter(n=>n.startsWith(p)).map(n=>parseInt(n.slice(p.length))||0));return p+String(mx+1).padStart(4,'0')}
const log=(cid,texte,x={})=>save('historique',{chantierId:cid,date:today(),texte,...x}).catch(()=>{});

async function init(){
  render();
  const timer=setTimeout(()=>{if(mode==='loading'){slowNote=true;render()}},10000);
  const use=n=>window.claude&&window.claude.use?window.claude.use(n).catch(()=>null):Promise.resolve(null);
  [db,assets,downloads]=await Promise.all([use('db'),use('assets'),use('downloads')]);if(!downloads)downloads=localDownloads();
  if(!db){clearTimeout(timer);mode='local';loadLocal();render();return}
  const pending=new Set([...COLLS,'cfg','prix']);
  const done=k=>{pending.delete(k);if(!pending.size){clearTimeout(timer);if(slowNote){slowNote=false;scheduleRender()}}};
  const ready=()=>{if(mode==='loading')mode='db'};
  COLLS.forEach(c=>db.collection(c).onSnapshot(s=>{S[c]=s.docs.map(d=>({id:d.id,...d.data()}));ready();if(!s.metadata.fromCache)done(c);scheduleRender()},e=>{done(c);toast('Synchronisation interrompue ('+e.code+')')}));
  db.doc('config/app').onSnapshot(s=>{if(s.exists)S.config={...S.config,...s.data()};ready();if(!s.metadata.fromCache)done('cfg');scheduleRender()},()=>done('cfg'));
  sigCache();db.doc('config/sigs').onSnapshot(x=>{if(x.metadata&&x.metadata.hasPendingWrites)return;const v=x.exists?x.data():{};['sig','cachet'].forEach(k=>sigLoad(k,v[k]))},()=>{});
  db.doc('config/prix').onSnapshot(s=>{S.prixOv=s.exists?(s.data().p||{}):{};S.artOv=s.exists?(s.data().o||{}):{};ready();if(!s.metadata.fromCache)done('prix');scheduleRender()},()=>done('prix'));
}

/* ---------- photos / justificatifs ---------- */
async function compressImage(file,max=1600,q=0.8,type='image/jpeg'){
  const url=URL.createObjectURL(file);
  const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=url});
  const r=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));const w=Math.round(img.naturalWidth*r),h=Math.round(img.naturalHeight*r);
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;const cx=cv.getContext('2d');
  if(type==='image/jpeg'){cx.fillStyle='#fff';cx.fillRect(0,0,w,h)}cx.drawImage(img,0,0,w,h);URL.revokeObjectURL(url);
  return {blob:await new Promise(res=>cv.toBlob(res,type,q)),dataUrl:cv.toDataURL(type,q)};
}
async function uploadFiles(files){const out=[];
  for(const f of files){let b=f,type=f.type;
    if(type.startsWith('image/')){b=(await compressImage(f)).blob;type='image/jpeg'}
    else if(type!=='application/pdf'){toast('Format non pris en charge : '+f.name);continue}
    const r=await assets.upload(b,{type});out.push({id:r.id,type})}
  return out}
const PW={};let pwBusy=0;
function photoWidget(key,list,label){PW[key]=[...(list||[])];
  return `<div class="f"><span class="lbl">${label}</span><div class="thumbs" id="pw_${key}">${thumbsHtml(key,true)}</div>
  ${assets?`<label class="btn sec small upl">📷 Photo ou PDF<input type="file" accept="image/*,application/pdf" multiple onchange="pwAdd('${key}',this)"></label>`:`<div class="sm mute">L'ajout de photos n'est pas disponible ici.</div>`}</div>`}
function thumbsHtml(key,edit,list){const L=list||PW[key]||[];return L.map((p,i)=>`<div class="th">${p.type==='application/pdf'?`<div class="pdfth" onclick="viewAsset('${p.id}','${p.type}')">PDF</div>`:`<img src="/_blob/${esc(p.id)}" loading="lazy" onclick="viewAsset('${p.id}','${p.type}')" alt="justificatif">`}${edit?`<button type="button" onclick="pwDel('${key}',${i})">×</button>`:''}</div>`).join('')}
async function pwAdd(key,input){const files=[...input.files];input.value='';if(!files.length)return;
  const box=$('#pw_'+key);box.insertAdjacentHTML('beforeend','<div class="th up">envoi…</div>');pwBusy++;
  try{PW[key].push(...await uploadFiles(files))}catch(e){toast("Échec de l'envoi ("+(e.code||'erreur')+')')}
  pwBusy--;box.innerHTML=thumbsHtml(key,true)}
function pwDel(key,i){PW[key].splice(i,1);$('#pw_'+key).innerHTML=thumbsHtml(key,true)}
function viewAsset(id,type){$('#viewerRoot').innerHTML=`<div class="viewer" onclick="this.remove()">${type==='application/pdf'?`<a class="btn" href="/_blob/${esc(id)}" target="_blank" rel="noopener">Ouvrir le PDF</a>`:`<img src="/_blob/${esc(id)}" alt="">`}<div class="sm" style="color:#fff;margin-top:10px">Toucher pour fermer</div></div>`}

/* ---------- statistiques ---------- */
function marche(cid){const t=typ(cid);let L=byC('devis',cid);if(t!=='cle'&&t!=='travaux')L=L.filter(x=>x.hon);L=L.sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const d=L.find(x=>x.statut==='accepte')||(t!=='cle'?L.find(x=>x.hon&&x.statut!=='refuse'):null);return d?{d,t:totDevis(d).ttc}:null}
function stats(cid){
  const ach=byC('achats',cid),pays=byC('paiements',cid),ets=etapesOf(cid),ch=S.chantiers.find(c=>c.id===cid)||{};
  const mat=sum(ach.filter(a=>a.statut!=='a_acheter'),totA),aAcheter=sum(ach.filter(a=>a.statut==='a_acheter'),totA),mo=sum(pays,p=>num(p.montant));
  const enc=sum(byC('recus',cid),r=>num(r.montant)),dep=mat+mo,budget=num(ch.budget),wb=sum(ets,e=>num(e.budget));
  const av=ets.length?(wb>0?sum(ets,e=>num(e.avancement)*num(e.budget))/wb:sum(ets,e=>num(e.avancement))/ets.length):0;
  return {mat,aAcheter,mo,dep,budget,reste:budget-dep,av,ets,ach,pays,enc,nbEmp:byC('employes',cid).filter(e=>e.actif!==false).length};
}
function budgetEtapes(cid){const bons=byC('bons',cid).filter(b=>(b.statut||'emis')==='emis'),ach=byC('achats',cid).filter(a=>a.statut!=='a_acheter'),pay=byC('paiements',cid),rec=byC('recus',cid);
  return etapesOf(cid).map(e=>{const bMat=num(e.budgetMat),bMO=num(e.budgetMO),achat=sum(ach.filter(a=>a.etapeId===e.id),totA),engage=sum(bons.filter(b=>b.etapeId===e.id),b=>totL(b.lignes)),paye=sum(pay.filter(p=>p.etapeId===e.id),p=>num(p.montant)),
    rE=rec.filter(r=>r.etapeId===e.id),encMat=sum(rE.filter(r=>r.categorie==='mat'),r=>num(r.montant)),encMO=sum(rE.filter(r=>r.categorie==='mo'),r=>num(r.montant)),encG=sum(rE.filter(r=>!r.categorie||r.categorie==='global'),r=>num(r.montant));
    return{e,bMat,bMO,achat,engage,paye,encMat,encMO,encG,resteMat:bMat-achat-engage,resteMO:bMO-paye,aEncMat:bMat-encMat,aEncMO:bMO-encMO}})}
const budgetEtape=(cid,eid)=>budgetEtapes(cid).find(x=>x.e.id===eid);
const depEtape=eid=>sum(S.achats.filter(a=>a.etapeId===eid&&a.statut!=='a_acheter'),totA)+sum(S.paiements.filter(p=>p.etapeId===eid),p=>num(p.montant));

/* ---------- rendu ---------- */
const ui={view:'home',cid:null,tab:'apercu',achFiltre:'tous',devisId:null,bonId:null,week:mondayOf(today()),open:{},catSect:'liants',catQ:'',
  calc:{type:'beton',beton:{el:'dalle',L:'',l:'',h:'',n:1,dosage:350,marge:5,cim:'cim-robust'},murs:{L:'',H:'',ouv:'',ep:15},enduit:{S:'',faces:1,ep:1.5},carrelage:{S:'',marge:10,carton:''},coulage:{V:'',cap:250,t:6,nb:1,heures:8,dosage:350},etapeId:''}};
const _genDone=new Set();
function genEnAttente(){if(mode==='loading')return;S.devis.forEach(d=>{const P=d.params||(d.paramsJson?JSON.parse(d.paramsJson):null);if(P&&(!d.lots||!d.lots.length)&&!_genDone.has(d.id)){_genDone.add(d.id);try{const lots=genDevis(P);const nd={...d,params:P,lots};delete nd.paramsJson;save('devis',nd).then(()=>toast('Devis '+(d.numero||'')+' calculé à partir des plans'))}catch(e){console.error(e)}}})}
function render(){setTimeout(genEnAttente,0);
  killCharts();const app=$('#app'),E=ent();document.body.classList.toggle('hasnav',ui.view==='chantier'&&mode!=='loading');
  $('#btnBack').style.display=ui.view!=='home'?'':'none';
  $('#brand').innerHTML=E.logo?`<img src="${E.logo}" alt="">`:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V10l7-6 7 6v11M9 21v-6h6v6"/></svg>`;
  $('#brand').className='logo'+(E.logo?' img':'');
  if(mode==='loading'){app.innerHTML=`<div class="loading">Chargement des chantiers…${slowNote?"<br><br>La connexion est lente, les données arrivent dès qu'elle répond.":''}</div>`;return}
  const banner=updBanner()+(mode==='local'?(isNative()?'':`<div class="banner w">Mode hors ligne : données gardées seulement dans ce navigateur.</div>`)+(ui.view==='home'?backupReminder():''):slowNote?`<div class="banner">Les données affichées peuvent ne pas être à jour.</div>`:'');
  let title=E.nom||'Chantier Pro',h='';
  if(ui.view==='chantier'){const ch=S.chantiers.find(c=>c.id===ui.cid);if(!ch){ui.view='home';return render()}title=ch.nom||'Chantier';h=viewChantier(ch)}
  else if(ui.view==='catalogue'){title='Catalogue des matériaux';h=viewCatalogue()}
  else if(ui.view==='regles'){title='Règles de calcul';h=viewRegles()}
  else if(ui.view==='rh'){title='Personnel & paie';h=viewRH()}
  else if(ui.view==='ent'){title='Entreprise';h=viewEnt()}
  else if(ui.view==='fondcat'){title='Fondations types';h=viewFondCat()}
  else if(ui.view==='locations'){title='Mes locations';h=viewLocations()}
  else if(ui.view==='bail'){const b=S.baux.find(x=>x.id===ui.bid);if(!b){ui.view='locations';return render()}title=b.bien||'Location';h=viewBail(b)}
  else h=viewHome();
  $('#title').textContent=title;app.innerHTML=banner+h;mountCharts();
  if(ui.view==='chantier'&&ui.tab==='calculs')updCalc();
}
function go(view){ui.view=view;window.scrollTo(0,0);render()}
function openCh(id){ui.view='chantier';ui.cid=id;ui.tab='apercu';ui.devisId=null;ui.bonId=null;window.scrollTo(0,0);render()}
function setTab(t){ui.tab=t;ui.devisId=null;ui.bonId=null;render()}
const chip=(t,c)=>`<span class="chip ${c||''}">${esc(t)}</span>`;

function viewHome(){
  const tous=S.chantiers.map(c=>({c,s:stats(c.id)})),chs=[...S.chantiers].filter(c=>typ(c)==='cle').sort((a,b)=>num(b.cree)-num(a.cree)),all=chs.map(c=>({c,s:stats(c.id)}));
  const tb=sum(all,x=>x.s.budget),td=sum(tous,x=>x.s.dep),te=sum(tous,x=>x.s.enc);const E=ent();
  let h='';
  h+=guideCard();
  h+=`<div class="grid3" style="margin-bottom:12px">
    <div class="kpi"><div class="l">Chantiers</div><div class="v">${chs.length}</div><small>${chs.filter(c=>c.statut==='cours').length} en cours · ${S.chantiers.length-chs.length} prestation(s)</small></div>
    <div class="kpi"><div class="l">Encaissé</div><div class="v">${F(te)}</div><small>≈ ${C(te)}</small></div>
    <div class="kpi"><div class="l">Dépensé</div><div class="v">${F(td)}</div><small>≈ ${C(td)}</small></div></div>`;
  h+=homeActions();
  if(chs.length)h+=`<button class="btn sec block" style="margin-bottom:12px" onclick="formRapportGlobal()">📄 Rapport de la semaine (tous les chantiers)</button>`;
  h+=`<div class="secth">Chantiers clé en main</div>`;
  if(!chs.length)h+=`<div class="card sm mute">Aucun chantier clé en main pour l'instant. Touche « 🏗️ Chantier clé en main » ci-dessus pour en créer un.</div>`;
  all.forEach(({c,s})=>{const pb=s.budget>0?s.dep/s.budget*100:0,st=c.statut||'prep';
    h+=`<div class="card chcard" onclick="openCh('${c.id}')"><div class="row between" style="align-items:flex-start"><div style="min-width:0"><h2>${esc(c.nom)}</h2>
      <div class="sm mute">${esc([c.lieu,c.client].filter(Boolean).join(' · '))||'—'}</div></div>${chip(STAT_CH[st],{cours:'go',fini:'ok',pause:'bad',prep:'blue'}[st])}</div>
      ${pbar('Avancement',s.av,'ok')}${pbar('Budget',pb,pb>100?'bad':'',s.budget>0)}
      ${(()=>{const du=[...bonsDus(c.id),...achatsDus(c.id)],ed=byC('employes',c.id).filter(e=>e.actif!==false).map(payStatus).filter(x=>x.c!=='ok'&&x.c!=='mute'),cp=clientPay(c.id),bad=du.some(x=>x.p.c==='bad')||ed.some(x=>x.c==='bad');
      const parts=[du.length?`${F(sum(du,x=>x.p.reste))} dû aux fournisseurs`:'',ed.length?`${ed.length} ouvrier(s) à payer`:''].filter(Boolean);
      return (parts.length?`<div class="sm pst ${bad?'bad':'warn'}" style="margin-top:6px">${dot(bad?'bad':'warn')} ${parts.join(' · ')}</div>`:'')+(cp?`<div class="sm pst ${cp.c}" style="margin-top:3px">${dot(cp.c)} ${esc(cp.t)}</div>`:'')})()}<div class="row between" style="margin-top:6px"><div class="sm mute">${F(s.dep)} dépensés · ${F(s.enc)} encaissés · ${s.nbEmp} employé${s.nbEmp>1?'s':''}</div><div class="row" style="gap:2px"><button class="btn ghost small" onclick="event.stopPropagation();formChantier('${c.id}')">✏️</button><button class="btn ghost small delb" title="Supprimer le chantier" onclick="event.stopPropagation();confirmDel(this,()=>delChantier('${c.id}'),true)">🗑</button></div></div></div>`});
  h+=homePresta();
  h+=homeCharts(chs);
  return h;
}
const pbar=(lbl,v,cls,show=true)=>`<div class="pbar-line"><span class="sm mute" style="min-width:78px">${lbl}</span><div class="bar ${cls}"><i style="width:${Math.min(100,Math.max(0,v))}%"></i></div><span class="pct">${show?Math.round(v)+'%':'—'}</span></div>`;

const TABS={apercu:'Aperçu',etapes:'Étapes',journal:'Journal',achats:'Achats',stock:'Stock',commandes:'Bons de commande',equipe:'Équipe',paie:'Paie',devis:'Devis',contrat:'Contrat',recus:'Reçus',rapport:'Rapport',graphes:'Graphiques',calculs:'Calculs'};
function viewChantier(ch){
  const ty=typ(ch),TB=tabsFor(ty,ch);if(!TB[ui.tab])ui.tab='apercu';
  let h=rubHead(ch);
  const s=stats(ch.id);
  return h+bottomNav(ch)+({factures:typeof tFactures==='function'?tFactures:tApercu,solaire:typeof tSolaire==='function'?tSolaire:tApercu,dossier:typeof tDossier==='function'?tDossier:tApercu,pointage:typeof tPointage==='function'?tPointage:tApercu,apercu:tApercu,etapes:tEtapes,journal:tJournal,achats:tAchats,stock:tStock,commandes:tCommandes,equipe:tEquipe,paie:tPaie,devis:tDevis,contrat:tContrat,recus:tRecus,rapport:tRapport,graphes:tGraphes,calculs:tCalculs}[ui.tab]||tApercu)(ch,s);
}

/* ---------- Aperçu ---------- */
function tApercu(ch,s){
  if(typ(ch)!=='cle'&&typ(ch)!=='travaux')return tApercuP(ch,s);
  const pb=s.budget>0?s.dep/s.budget*100:0,m=marche(ch.id);
  let h=`<div class="card"><div class="row between"><div><div class="sm mute">${esc(ch.lieu||'')}${ch.client?' · Client : '+esc(ch.client):''}</div>
    <div class="sm mute">${ch.debut?'Début '+dfr(ch.debut):''}${ch.fin?' · Fin prévue '+dfr(ch.fin):''}</div></div><button class="btn sec small" onclick="formChantier('${ch.id}')">Modifier</button></div>
    ${pbar('Avancement',s.av,'ok')}${pbar('Budget',pb,pb>100?'bad':'',s.budget>0)}
    ${s.budget>0&&s.dep>s.budget?`<div class="alert">Budget dépassé de ${F(s.dep-s.budget)}.</div>`:''}
    ${s.budget>0&&pb>s.av+15&&s.dep<=s.budget?`<div class="alert">${Math.round(pb)} % du budget consommé pour ${Math.round(s.av)} % d'avancement.</div>`:''}</div>
  <div class="grid2" style="margin-bottom:12px">
    <div class="kpi"><div class="l">Montant du marché</div><div class="v">${m?M$(m.t):'<span class="sm mute">Aucun devis accepté</span>'}</div></div>
    <div class="kpi"><div class="l">Encaissé du client</div><div class="v">${M$(s.enc)}</div></div>
    <div class="kpi"><div class="l">Budget prévu</div><div class="v">${M$(s.budget)}</div></div>
    <div class="kpi"><div class="l">Dépensé</div><div class="v">${M$(s.dep)}</div></div>
    <div class="kpi"><div class="l">Matériaux</div><div class="v">${M$(s.mat)}</div></div>
    <div class="kpi"><div class="l">Main-d'œuvre</div><div class="v">${M$(s.mo)}</div></div>
    <div class="kpi"><div class="l">Trésorerie (encaissé − dépensé)</div><div class="v" style="color:${s.enc-s.dep<0?'var(--warn)':'inherit'}">${M$(s.enc-s.dep)}</div></div>
    <div class="kpi"><div class="l">${m?dot((clientPay(ch.id)||{}).c||'warn')+' Reste à encaisser':'À acheter (prévu)'}</div><div class="v">${m?M$(m.t-s.enc):M$(s.aAcheter)}</div></div></div>`;
  {const bd=bonsDus(ch.id),ad=achatsDus(ch.id),ed=byC('employes',ch.id).filter(e=>e.actif!==false).map(e=>({e,p:payStatus(e)})).filter(x=>x.p.c==='warn'||x.p.c==='bad'),cp=clientPay(ch.id);
   const row=(c,txt,tab)=>`<div class="it click" onclick="setTab('${tab}')"><div class="main"><div class="t" style="font-weight:500">${dot(c)} ${txt}</div></div><div class="amt">›</div></div>`;
   const worst=a=>a.some(x=>x.p.c==='bad')?'bad':'warn';let L='';
   L+=bd.length?row(worst(bd),`${bd.length} bon(s) de commande à régler : <b>${F(sum(bd,x=>x.p.reste))}</b>`,'commandes'):row('ok','Bons de commande : tout est réglé','commandes');
   if(ad.length)L+=row(worst(ad),`${ad.length} achat(s) à crédit : <b>${F(sum(ad,x=>x.p.reste))}</b>`,'achats');
   L+=ed.length?row(worst(ed),`${ed.length} ouvrier(s) à payer${ed.some(x=>x.p.c==='bad')?' (dont '+ed.filter(x=>x.p.c==='bad').length+' en retard)':''}`,'equipe'):(byC('employes',ch.id).length?row('ok','Ouvriers : paie à jour','equipe'):'');
   if(cp)L+=row(cp.c,esc(cp.t),'recus');
   h+=`<div class="card list"><h3>Paiements</h3>${L}</div>`}
  const BE=budgetEtapes(ch.id).filter(x=>x.bMat||x.bMO||x.achat||x.engage||x.paye||x.encMat||x.encMO||x.encG);
  h+=`<div class="card"><h3>Suivi budgétaire par étape</h3>`;
  if(!BE.length)h+=`<div class="empty sm">Applique un devis au chantier (onglet Devis) : chaque étape reçoit son budget matériaux et son budget main-d'œuvre. Les bons de commande, achats, paies et reçus rattachés à l'étape le font ensuite baisser.</div>`;
  BE.forEach(x=>{const ln=(lbl,b,used,txt)=>b?`<div class="bl"><div class="lbl"><span>${lbl}</span><span>reste <b style="color:${b-used<0?'var(--warn)':'inherit'}">${F(b-used)}</b></span></div><div class="bar ${used>b?'bad':''}"><i style="width:${Math.min(100,used/b*100)}%"></i></div><div class="s">${txt}</div></div>`:'';
    h+=`<div class="bcard"><div class="t">${esc(x.e.nom)}</div>
      ${ln('Matériaux',x.bMat,x.achat+x.engage,`budget ${F(x.bMat)} · acheté ${F(x.achat)}${x.engage?' · commandé '+F(x.engage):''}`)}
      ${ln("Main-d'œuvre",x.bMO,x.paye,`budget ${F(x.bMO)} · payé aux ouvriers ${F(x.paye)}`)}
      ${!x.bMat&&!x.bMO?`<div class="s">Budget non réparti : ${F(num(x.e.budget))} · dépensé ${F(x.achat+x.paye)}</div>`:''}
      ${x.encMat||x.encMO||x.encG?`<div class="s" style="margin-top:4px">💵 Reçu du client : ${[x.encMat?'matériaux '+F(x.encMat)+(x.bMat?' (reste '+F(x.aEncMat)+')':''):'',x.encMO?"main-d'œuvre "+F(x.encMO)+(x.bMO?' (reste '+F(x.aEncMO)+')':''):'',x.encG?'global '+F(x.encG):''].filter(Boolean).join(' · ')}</div>`:''}</div>`});
  h+=`</div>`;
  const enc=s.ets.filter(e=>e.statut==='cours');
  if(enc.length)h+=`<div class="card"><h3>En cours</h3>${enc.map(e=>pbar(esc(e.nom),num(e.avancement),'ok')).join('')}</div>`;
  if(ch.notes)h+=`<div class="card"><h3>Notes</h3><div class="sm" style="white-space:pre-wrap">${esc(ch.notes)}</div></div>`;
  return h;
}

/* ---------- Étapes ---------- */
function tEtapes(ch,s){
  let h=`<div class="row between" style="margin-bottom:10px"><div class="sm mute">${s.ets.filter(e=>e.statut==='fini').length}/${s.ets.length} terminées · ${Math.round(s.av)} %</div><button class="btn small" onclick="formEtape()">+ Étape</button></div>`;
  if(!s.ets.length)return h+`<div class="card empty">Aucune étape.<br><br><button class="btn sec" onclick="ajouterEtapesTypes('${ch.id}')">Ajouter les étapes types</button><br><span class="sm">ou applique un devis au chantier (onglet Devis).</span></div>`;
  h+=`<div class="card list">`;
  s.ets.forEach(e=>{const d=depEtape(e.id),b=num(e.budget),st=e.statut||'afaire';
    h+=`<div class="it"><div class="main"><div class="row between click" onclick="formEtape('${e.id}')"><span class="t">${esc(e.nom)}</span>${chip(STAT_ET[st],st==='fini'?'ok':st==='cours'?'go':'')}</div>
      <div class="pbar-line"><div class="bar ok"><i style="width:${num(e.avancement)}%"></i></div><span class="pct">${Math.round(num(e.avancement))}%</span></div>
      <div class="s">${(()=>{const x=budgetEtape(e.chantierId,e.id);return x&&(x.bMat||x.bMO)?`Matériaux : reste ${F(x.resteMat)} · Main-d'œuvre : reste ${F(x.resteMO)}`:`${F(d)} dépensés${b>0?' / budget '+F(b):''}`})()}${e.debut?' · '+dfr(e.debut):''}${e.fin?' → '+dfr(e.fin):''}</div>
      <div class="qbtns"><button class="btn sec small" onclick="avance('${e.id}',-10)">−10 %</button><button class="btn sec small" onclick="avance('${e.id}',10)">+10 %</button>${st!=='fini'?`<button class="btn sec small" onclick="avance('${e.id}',100)">✓ Terminée</button>`:''}<button class="btn sec small" onclick="formEtape('${e.id}')">✏️</button>${delBtn('etapes',e.id)}</div></div></div>`});
  return h+`</div>`;
}
async function avance(id,delta){const e=S.etapes.find(x=>x.id===id);if(!e)return;
  const old=num(e.avancement),v=delta===100?100:Math.max(0,Math.min(100,old+delta));if(v===old)return;
  const st=v>=100?'fini':v>0?'cours':'afaire';
  await save('etapes',{...e,avancement:v,statut:st,fin:st==='fini'&&!e.fin?today():e.fin,debut:v>0&&!e.debut?today():e.debut});
  log(e.chantierId,`${e.nom} : ${Math.round(old)} % → ${Math.round(v)} %${st==='fini'?' (terminée)':''}`,{etapeId:e.id,av:v})}
async function ajouterEtapesTypes(cid){for(let i=0;i<ETAPES_TYPES.length;i++)await save('etapes',{chantierId:cid,nom:ETAPES_TYPES[i],ordre:i+1,statut:'afaire',avancement:0,budget:''});toast('Étapes ajoutées')}

/* ---------- Journal ---------- */
function tJournal(ch){
  const list=byC('journal',ch.id).sort((a,b)=>(b.date||'').localeCompare(a.date||'')),etN=Object.fromEntries(etapesOf(ch.id).map(e=>[e.id,e.nom]));
  let h=`<div class="row between" style="margin-bottom:10px"><div class="sm mute">Ce qui a été fait chaque jour, avec photos</div><button class="btn small" onclick="formJournal()">+ Entrée</button></div>`;
  if(!list.length)return h+`<div class="card empty">Note ici les travaux réalisés, l'effectif présent, la météo et les photos du chantier. Tout se retrouve dans le rapport de la semaine.</div>`;
  h+=`<div class="card list">`;
  list.forEach(j=>h+=`<div class="it"><div class="main click" onclick="formJournal('${j.id}')"><div class="t">${dfr(j.date)}${j.etapeId&&etN[j.etapeId]?' · '+esc(etN[j.etapeId]):''}</div>
    <div class="s" style="white-space:pre-wrap;color:var(--ink)">${esc(j.texte)}</div><div class="s">${num(j.effectif)?num(j.effectif)+' ouvriers · ':''}${esc(j.meteo||'')}</div>${(j.prod||[]).length?`<div class="s">📏 ${esc(prodTxt(j))}</div>`:''}
    ${(j.photos||[]).length?`<div class="thumbs sm">${thumbsHtml(null,false,j.photos)}</div>`:''}</div>${delBtn('journal',j.id)}</div>`);
  return h+`</div>`;
}

/* ---------- Achats ---------- */
function tAchats(ch,s){
  const f=ui.achFiltre;let list=[...s.ach].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  if(f==='achete')list=list.filter(a=>a.statut!=='a_acheter');if(f==='a_acheter')list=list.filter(a=>a.statut==='a_acheter');
  const etN=Object.fromEntries(s.ets.map(e=>[e.id,e.nom]));
  let h=`<div class="seg">${[['tous','Tous'],['achete','Achetés'],['a_acheter','À acheter']].map(([k,v])=>`<button class="${f===k?'on':''}" onclick="ui.achFiltre='${k}';render()">${v}</button>`).join('')}</div>
  <div class="row between" style="margin-bottom:10px"><div><div class="sm mute">${list.length} ligne${list.length>1?'s':''} · total</div><div class="money"><b>${F(sum(list,totA))}</b><small>≈ ${C(sum(list,totA))}</small></div></div><button class="btn small" onclick="formAchat()">+ Achat</button></div>`;
  if(f==='a_acheter'&&list.length)h+=`<button class="btn sec block" style="margin-bottom:10px" onclick="nouveauBon('aacheter')">🧾 Faire un bon de commande avec ces articles</button>`;
  if(!list.length)return h+`<div class="card empty">Aucun achat${f==='a_acheter'?' à prévoir. Les calculateurs et les bons de commande remplissent cette liste.':'.'}</div>`;
  h+=`<div class="card list">`;
  list.forEach(a=>{const aa=a.statut==='a_acheter',nj=(a.justifs||[]).length,ap=achatPay(a);
    h+=`<div class="it"><div class="main click" onclick="formAchat('${a.id}')"><div class="t">${ap?dot(ap.c)+' ':''}${esc(a.materiau)} ${aa?chip('à acheter','blue'):''} ${nj?chip('📎 '+nj,'ok'):(!aa?chip('sans reçu','bad'):'')}</div>${ap&&ap.c!=='ok'?`<div class="s pst ${ap.c}">${esc(ap.t)}</div>`:''}
      <div class="s">${N(num(a.quantite))} ${esc(a.unite||'')} × ${F(num(a.prixUnit))}${a.fournisseur?' · '+esc(a.fournisseur):''}</div>
      <div class="s">${dfr(a.date)}${a.etapeId&&etN[a.etapeId]?' · '+esc(etN[a.etapeId]):''}</div>
      ${aa?`<div class="qbtns"><button class="btn sec small" onclick="event.stopPropagation();marquerAchete('${a.id}')">✓ Marquer acheté</button></div>`:''}${ap&&!ap.viaBon&&ap.reste>0?`<div class="qbtns"><button class="btn sec small" onclick="event.stopPropagation();reglerAchat('${a.id}')">💵 Marquer payé</button></div>`:''}</div>
      <div class="amt">${F(totA(a))}<small>≈ ${C(totA(a))}</small>${delBtn('achats',a.id)}</div></div>`});
  return h+`</div>`;
}
async function marquerAchete(id){const a=S.achats.find(x=>x.id===id);if(a){await save('achats',{...a,statut:'achete',date:today()});toast('Marqué acheté — pense à ajouter la photo du reçu')}}

/* ---------- Équipe & paie ---------- */
function payStatus(e){
  const pays=S.paiements.filter(p=>p.employeId===e.id&&p.date).sort((a,b)=>b.date.localeCompare(a.date)),last=pays[0],td=today();
  if(e.actif===false)return{c:'mute',t:'Inactif'+(last?' · dernier paiement le '+dfr(last.date):'')};
  if(e.mode==='forfait'){const m=td.slice(0,7),pm=(()=>{const d=parseD(td);d.setDate(1);d.setMonth(d.getMonth()-1);return ymd(d).slice(0,7)})(),mt=sum(pays.filter(p=>p.date.startsWith(m)),p=>num(p.montant));
    if(mt>0)return{c:mt>=num(e.taux)||!num(e.taux)?'ok':'warn',t:mt>=num(e.taux)||!num(e.taux)?`Payé ce mois (${F(mt)})`:`Payé en partie ce mois : ${F(mt)} sur ${F(num(e.taux))}`};
    return last&&last.date.startsWith(pm)?{c:'warn',t:'Salaire du mois à payer'}:{c:'bad',t:last?'Non payé depuis le '+dfr(last.date):'Jamais payé'}}
  const ws=mondayOf(td),we=addDays(ws,6),pws=addDays(ws,-7),sw=sum(pays.filter(p=>p.date>=ws&&p.date<=we),p=>num(p.montant));
  if(sw>0)return{c:'ok',t:`Payé cette semaine (${F(sw)})`};
  if(e.mode==='tache')return last?{c:'mute',t:'Dernier paiement le '+dfr(last.date)}:{c:'warn',t:'Pas encore payé'};
  if(last&&last.date>=pws)return{c:'warn',t:'Paie de la semaine à faire (dimanche '+dfr(we)+')'};
  if(!last){const arr=e.debut&&e.debut<ws;return{c:arr?'bad':'warn',t:arr?'Jamais payé depuis son arrivée ('+dfr(e.debut)+')':'Pas encore payé'}}
  return{c:'bad',t:'Non payé depuis le '+dfr(last.date)}}
const dot=c=>`<span class="dot ${c}"></span>`;
function tEquipe(ch){
  const PR={bad:0,warn:1,ok:2,mute:3},emps=byC('employes',ch.id).sort((a,b)=>(a.actif===false)-(b.actif===false)||PR[payStatus(a).c]-PR[payStatus(b).c]||(a.nom||'').localeCompare(b.nom||''));
  let h=`<div class="row between" style="margin-bottom:10px"><div class="sm mute">${emps.filter(e=>e.actif!==false).length} actif(s) sur le chantier</div><button class="btn small" onclick="formEmploye()">+ Employé</button></div>`;
  if(emps.length){const st=emps.filter(e=>e.actif!==false).map(payStatus),n=c=>st.filter(x=>x.c===c).length;
    h+=`<div class="card" style="padding:10px 14px"><div class="row" style="gap:14px;flex-wrap:wrap;font-size:13px"><span>${dot('ok')} ${n('ok')} payé(s)</span><span>${dot('warn')} ${n('warn')} à payer</span><span>${dot('bad')} ${n('bad')} en retard</span></div><div class="sm mute" style="margin-top:4px">Semaine du ${dfr(mondayOf(today()))} au dimanche ${dfr(addDays(mondayOf(today()),6))} (au mois pour les forfaits)</div></div>`}
  if(!emps.length)return h+`<div class="card empty">Ajoute les ouvriers du chantier : nom, métier, téléphone et mode de paie.</div>`;
  h+=`<div class="card list">`;
  emps.forEach(e=>{const pays=S.paiements.filter(p=>p.employeId===e.id),tot=sum(pays,p=>num(p.montant)),jours=sum(pays,p=>num(p.jours));
    const ps=payStatus(e);h+=`<div class="it" style="${e.actif===false?'opacity:.55':''}"><div class="main click" onclick="formEmploye('${e.id}')"><div class="t">${dot(ps.c)} ${esc(e.nom)} ${e.actif===false?chip('inactif'):''}</div><div class="s pst ${ps.c}">${esc(ps.t)}</div>
      <div class="s">${esc(e.metier||'')}${e.tel?' · '+esc(e.tel):''}</div><div class="s">${MODES[e.mode]||''}${num(e.taux)?' · '+F(num(e.taux)):''}${jours?' · '+N(jours,1)+' j payés':''}</div></div>
      <div class="amt">${F(tot)}<small>payé</small><div class="row" style="gap:2px;justify-content:flex-end"><button class="btn ghost small" onclick="formPaiement(null,'${e.id}')">Payer</button>${delBtn('employes',e.id)}</div></div></div>`});
  return h+`</div>`;
}
function tPaie(ch,s){
  const list=[...s.pays].sort((a,b)=>(b.date||'').localeCompare(a.date||'')),empN=Object.fromEntries(S.employes.map(e=>[e.id,e])),etN=Object.fromEntries(s.ets.map(e=>[e.id,e.nom]));
  const ws=mondayOf(today()),tS=sum(list.filter(p=>p.date>=ws&&p.date<=addDays(ws,6)),p=>num(p.montant));
  let h=`<div class="grid2" style="margin-bottom:12px"><div class="kpi"><div class="l">Total payé</div><div class="v">${M$(s.mo)}</div></div><div class="kpi"><div class="l">Cette semaine</div><div class="v">${M$(tS)}</div></div></div>
    <div class="row between" style="margin-bottom:10px"><div class="sm mute">${list.length} paiement(s)</div><button class="btn small" onclick="formPaiement()">+ Paiement</button></div>`;
  {const rp=byC('recus',ch.id).filter(r=>r.motif==='paie'||r.categorie==='mo'),wk={};rp.forEach(r=>{const w=mondayOf(r.date);(wk[w]=wk[w]||{r:0,v:0}).r+=num(r.montant)});list.forEach(p=>{const w=mondayOf(p.date);(wk[w]=wk[w]||{r:0,v:0}).v+=num(p.montant)});
   const ks=Object.keys(wk).sort().reverse().slice(0,8);if(rp.length)h+=`<div class="card"><h3>Argent reçu pour la paie / paie versée</h3><div class="list">${ks.map(w=>{const x=wk[w],e=x.r-x.v;return `<div class="it"><div class="main"><div class="t" style="font-weight:500">Semaine du ${dfr(w)}</div><div class="s">reçu ${F(x.r)} · versé ${F(x.v)}</div></div><div class="amt" style="color:${e<0?'var(--warn)':e>0?'var(--ok)':'inherit'}">${e>0?'+':''}${F(e)}<small>${e<0?'avancé de ta poche':e>0?'reste en caisse':'équilibré'}</small></div></div>`}).join('')}</div></div>`}
  if(!list.length)return h+`<div class="card empty">Aucun paiement de main-d'œuvre.</div>`;
  h+=`<div class="card list">`;
  list.forEach(p=>{const e=empN[p.employeId];h+=`<div class="it click" onclick="formPaiement('${p.id}')"><div class="main"><div class="t">${esc(e?e.nom:'Employé supprimé')} ${(p.justifs||[]).length?chip('📎','ok'):''}</div>
    <div class="s">${dfr(p.date)}${num(p.jours)?' · '+N(num(p.jours),1)+' j':''}${p.objet?' · '+esc(p.objet):''}</div>${p.etapeId&&etN[p.etapeId]?`<div class="s">${esc(etN[p.etapeId])}</div>`:''}</div>
    <div class="amt">${F(num(p.montant))}<small>≈ ${C(num(p.montant))}</small>${delBtn('paiements',p.id)}</div></div>`});
  return h+`</div>`;
}

/* ---------- Reçus clients ---------- */
function tRecus(ch,s){
  const list=byC('recus',ch.id).sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(b.numero||'').localeCompare(a.numero||'')),m=marche(ch.id);
  let h=`<div class="grid2" style="margin-bottom:12px"><div class="kpi"><div class="l">Montant du marché</div><div class="v">${m?M$(m.t):'<span class="sm mute">Aucun devis accepté</span>'}</div></div>
    <div class="kpi"><div class="l">Encaissé</div><div class="v">${M$(s.enc)}</div></div>${m?`<div class="kpi" style="grid-column:1/-1"><div class="l">${dot((clientPay(ch.id)||{}).c||'warn')} Reste à payer par le client</div><div class="v">${M$(m.t-s.enc)}</div></div>`:''}</div>
    <div class="row between" style="margin-bottom:10px"><div class="sm mute">Chaque versement du client = un reçu</div><button class="btn small" onclick="formRecu()">+ Reçu</button></div>`;
  if(!list.length)return h+`<div class="card empty">Quand ton client te verse de l'argent, enregistre-le ici : le reçu PDF est généré avec ton logo, le montant en lettres et le reste à payer.</div>`;
  h+=`<div class="card list">`;
  list.forEach(r=>h+=`<div class="it"><div class="main click" onclick="formRecu('${r.id}')"><div class="t">${esc(r.numero)} · ${esc(r.payeur||ch.client||'')}</div><div class="s">${dfr(r.date)} · ${esc(r.mode||'')}${r.etapeId?' · '+esc((S.etapes.find(e=>e.id===r.etapeId)||{}).nom||''):''}${r.motif?' · '+esc((MOTIFS.find(x=>x[0]===r.motif)||[,''])[1]):''}${r.periode?' · '+esc(r.periode):''}</div></div>
    <div class="amt">${F(num(r.montant))}<div class="row" style="gap:2px;justify-content:flex-end"><button class="btn ghost small" onclick="pdfRecu('${r.id}')">PDF</button>${delBtn('recus',r.id)}</div></div></div>`);
  return h+`</div>`;
}

/* ---------- Commandes (bons) ---------- */
const prodTxt=j=>(j.prod||[]).map(p=>{const o=OUVRAGES.find(x=>x[0]===p.ouvrage)||[,p.ouvrage,''];return `${o[1]} ${N(num(p.qte),1)} ${o[2]} (${p.ouvriers} ${String(p.metier||'').toLowerCase()}${num(p.ouvriers)>1?'s':''})`}).join(' ; ');
const STAT_BON={emis:'Émis',livre:'Livré',annule:'Annulé'};
function bonPay(b){const t=totL(b.lignes),pd=sum(b.reglements||[],r=>num(r.montant)),reste=t-pd,ech=b.echeance||b.livreLe||b.livraisonDate||b.date,late=ech&&ech<today();
  if((b.statut||'emis')==='annule')return{c:'mute',t:'Annulé',t2:0,pd,reste:0,ech};
  if(t>0&&reste<=0.5)return{c:'ok',t:`Réglé (${F(pd)})`,pd,reste:0,ech};
  if(pd>0)return{c:late?'bad':'warn',t:`Payé en partie : reste ${F(reste)}${late?' · échéance du '+dfr(ech)+' dépassée':''}`,pd,reste,ech};
  return{c:late?'bad':'warn',t:late?`Non réglé · échéance du ${dfr(ech)} dépassée`:`Non réglé · échéance le ${dfr(ech)}`,pd,reste,ech}}
function achatPay(a){if(a.statut==='a_acheter')return null;
  if(a.bonId){const b=S.bons.find(x=>x.id===a.bonId);if(b){const p=bonPay(b);return{...p,t:'Via '+(b.numero||'bon')+' : '+p.t,viaBon:true}}}
  if(a.reglement==='credit'){const late=a.echeance&&a.echeance<today();return{c:late?'bad':'warn',t:late?`À crédit · échéance du ${dfr(a.echeance)} dépassée`:`À crédit${a.echeance?' · à régler le '+dfr(a.echeance):' · à régler'}`,reste:totA(a)}}
  return{c:'ok',t:'Payé'+(a.datePaye&&a.datePaye!==a.date?' le '+dfr(a.datePaye):''),reste:0}}
function achatsDus(cid){return byC('achats',cid).map(a=>({a,p:achatPay(a)})).filter(x=>x.p&&!x.p.viaBon&&x.p.reste>0)}
async function reglerAchat(id){const a=S.achats.find(x=>x.id===id);if(a){await save('achats',{...a,reglement:'paye',datePaye:today()});toast('Achat marqué comme payé')}}
function clientPay(cid){const m=marche(cid);if(!m)return null;const enc=sum(byC('recus',cid),r=>num(r.montant)),t=m.t,ac=t*num(m.d.acompte)/100,reste=t-enc;
  if(reste<=0.5)return{c:'ok',t:'Client : soldé',reste:0};
  if(enc>=ac-0.5)return{c:'warn',t:`Client : ${ac>0?'acompte reçu · ':''}reste ${F(reste)} à encaisser`,reste};
  return{c:'bad',t:`Client : acompte de ${F(ac)} attendu, ${F(enc)} reçu`,reste}}
function bonsDus(cid){return byC('bons',cid).map(b=>({b,p:bonPay(b)})).filter(x=>x.p.reste>0.5&&x.p.c!=='mute')}
function formReglement(bid,rid){const b=S.bons.find(x=>x.id===bid);if(!b)return;const r=rid?(b.reglements||[]).find(x=>x.id===rid):null,p=bonPay(b);
  openForm({title:r?'Modifier le règlement':'Règlement au fournisseur',values:r||{date:today(),montant:Math.max(0,Math.round(p.reste)),mode:'Espèces'},
    fields:[{type:'html',html:`<div class="res" style="margin-bottom:12px"><div class="r"><span>${esc(b.numero)} · ${esc(b.fournisseur||'')}</span><b>${F(totL(b.lignes))}</b></div><div class="r"><span>Déjà payé</span><b>${F(p.pd)}</b></div><div class="r big"><span>Reste à payer</span><b>${F(p.reste)}</b></div></div>`},
      {k:'montant',label:'Montant payé (FCFA)',type:'number',req:true},{k:'date',label:'Date',type:'date'},{k:'mode',label:'Mode de paiement',type:'select',opts:MODES_PAIE.map(m=>[m,m])},{k:'reference',label:'Référence (reçu du fournisseur, n° de transaction…)'}],
    onSave:o=>mutDoc('bons',bid,d=>{d.reglements=d.reglements||[];o.montant=num(o.montant);if(r){const i=d.reglements.findIndex(x=>x.id===r.id);d.reglements[i]={...d.reglements[i],...o}}else d.reglements.push({id:uid(),...o})}),
    onDelete:r?()=>mutDoc('bons',bid,d=>{d.reglements=(d.reglements||[]).filter(x=>x.id!==r.id)}):null})}
function tCommandes(ch){
  if(ui.bonId){const b=S.bons.find(x=>x.id===ui.bonId);if(b)return bonEditor(ch,b);ui.bonId=null}
  const list=byC('bons',ch.id).sort((a,b)=>(b.numero||'').localeCompare(a.numero||''));
  let h=`<div class="row between" style="margin-bottom:10px"><div class="sm mute">Bons de commande fournisseurs</div><div class="row" style="gap:6px"><button class="btn small" onclick="bonRapide()">🧾 Bon rapide</button><button class="btn sec small" onclick="nouveauBonChoix()">Autres options</button></div></div>`;
  if(!list.length)return h+`<div class="card empty">Crée un bon de commande vierge, à partir d'un lot du devis, ou à partir des articles « à acheter » d'une étape. Le fournisseur reçoit un PDF à ton nom.</div>`;
  {const st=list.map(bonPay),n=c=>st.filter(x=>x.c===c).length,du=sum(st,x=>x.reste);
   h+=`<div class="card" style="padding:10px 14px"><div class="row" style="gap:14px;flex-wrap:wrap;font-size:13px"><span>${dot('ok')} ${n('ok')} réglé(s)</span><span>${dot('warn')} ${n('warn')} à régler</span><span>${dot('bad')} ${n('bad')} en retard</span></div>${du>0?`<div class="sm" style="margin-top:4px">Total dû aux fournisseurs : <b>${F(du)}</b></div>`:''}</div>`}
  h+=`<div class="card list">`;
  const PR={bad:0,warn:1,ok:2,mute:3};
  [...list].sort((x,y)=>PR[bonPay(x).c]-PR[bonPay(y).c]||(y.numero||'').localeCompare(x.numero||'')).forEach(b=>{const t=totL(b.lignes),st=b.statut||'emis',ps=bonPay(b);h+=`<div class="it click" onclick="ui.bonId='${b.id}';render()"><div class="main"><div class="t">${dot(ps.c)} ${esc(b.numero)} ${chip(STAT_BON[st],st==='livre'?'ok':st==='annule'?'bad':'blue')}</div>
    <div class="s pst ${ps.c}">${esc(ps.t)}</div><div class="s">${esc(b.fournisseur||'Fournisseur à préciser')} · ${dfr(b.date)} · ${(b.lignes||[]).length} article(s)</div></div><div class="amt">${F(t)}${ps.reste>0.5&&ps.c!=='mute'?`<button class="btn ghost small" onclick="event.stopPropagation();formReglement('${b.id}')">Régler</button>`:''}${delBtn('bons',b.id)}</div></div>`});
  return h+`</div>`;
}
function bonEditor(ch,b){
  const ets=etapesOf(ch.id),t=totL(b.lignes),st=b.statut||'emis';
  const inp=(k,l,type='text',ph='')=>`<label class="f"><span>${l}</span><input type="${type}" value="${esc(b[k]||'')}" placeholder="${esc(ph)}" onchange="docSet('bons','${b.id}','${k}',this.value)"></label>`;
  let h=`<button class="btn ghost small" onclick="ui.bonId=null;render()">← Tous les bons</button>
  <div class="card"><div class="row between"><h3 style="margin:0">${esc(b.numero)}</h3>${chip(STAT_BON[st],st==='livre'?'ok':st==='annule'?'bad':'blue')}</div><div style="height:10px"></div>
   <div class="grid2">${inp('fournisseur','Fournisseur','text','ex. Quincaillerie X, Bonabéri')}${inp('fournTel','Téléphone fournisseur','tel')}</div>
   ${inp('fournAdresse','Adresse du fournisseur')}
   <div class="grid2">${inp('date','Date du bon','date')}${inp('livraisonDate','Livraison souhaitée le','date')}</div>
   ${inp('livraisonLieu','Lieu de livraison','text',ch.lieu||'')}${inp('contact','Contact sur le chantier (nom, tél.)')}
   <label class="f"><span>Étape</span><select onchange="docSet('bons','${b.id}','etapeId',this.value)"><option value="">— Aucune —</option>${ets.map(e=>`<option value="${e.id}" ${b.etapeId===e.id?'selected':''}>${esc(e.nom)}</option>`).join('')}</select></label>
   ${(()=>{const x=b.etapeId&&budgetEtape(ch.id,b.etapeId);return x&&x.bMat?`<div class="note" style="margin:-6px 0 10px">Matériaux de l'étape : budget ${F(x.bMat)} · reste ${F(x.resteMat)}${(b.statut||'emis')==='emis'?' (ce bon compris)':''}</div>`:''})()}
   <label class="f"><span>Notes / conditions</span><textarea onchange="docSet('bons','${b.id}','notes',this.value)">${esc(b.notes||'')}</textarea></label></div>
  <div class="card list"><div class="row between"><h3 style="margin:0">Articles</h3><span class="money"><b>${F(t)}</b></span></div>`;
  (b.lignes||[]).forEach(l=>h+=lineRow('bons',b.id,null,l));
  if(!(b.lignes||[]).length)h+=`<div class="empty sm">Aucun article.</div>`;
  h+=`<div class="qbtns"><button class="btn sec small" onclick="pickArticle('bons','${b.id}',null,'mat')">+ Du catalogue</button><button class="btn sec small" onclick="formLigne('bons','${b.id}',null,null,{type:'mat'})">+ Ligne libre</button></div></div>
  ${(()=>{const p=bonPay(b);return `<div class="card list"><div class="row between"><h3 style="margin:0">${dot(p.c)} Règlement au fournisseur</h3>${p.reste>0.5&&p.c!=='mute'?`<button class="btn small" onclick="formReglement('${b.id}')">💵 Régler</button>`:''}</div>
    <div class="res" style="margin:10px 0"><div class="r"><span>Total du bon</span><b>${F(t)}</b></div><div class="r"><span>Déjà payé</span><b>${F(p.pd)}</b></div><div class="r big"><span>Reste à payer</span><b style="color:${p.reste>0.5?'var(--warn)':'var(--ok)'}">${F(p.reste)}</b></div></div>
    <label class="f"><span>Échéance de paiement</span><input type="date" value="${esc(b.echeance||'')}" onchange="docSet('bons','${b.id}','echeance',this.value)"></label><div class="note" style="margin:-6px 0 8px">Vide = à la livraison${b.livreLe?' ('+dfr(b.livreLe)+')':b.livraisonDate?' prévue le '+dfr(b.livraisonDate):''}.</div>
    ${(b.reglements||[]).map(r=>`<div class="it click" onclick="formReglement('${b.id}','${r.id}')"><div class="main"><div class="t" style="font-weight:500">${dfr(r.date)} · ${esc(r.mode||'')}</div>${r.reference?`<div class="s">${esc(r.reference)}</div>`:''}</div><div class="amt">${F(num(r.montant))}</div></div>`).join('')}</div>`})()}
  <div class="card"><div class="qbtns" style="margin:0"><button class="btn" onclick="pdfBon('${b.id}')">📄 PDF du bon</button>
   ${st==='emis'?`<button class="btn sec" onclick="receptionner('${b.id}')">✓ Réceptionner la livraison</button><button class="btn sec" onclick="docSet('bons','${b.id}','statut','annule')">Annuler</button>`:''}
   <button class="btn danger" id="delBon" onclick="confirmDel(this,()=>{del('bons','${b.id}');ui.bonId=null})">Supprimer</button></div>
   ${st==='emis'?`<div class="note">« Réceptionner » ajoute les articles livrés dans tes achats (statut acheté), rattachés à l'étape, au fournisseur et à ce bon. Ensuite, ajoute la photo de la facture ou du bordereau de livraison sur l'achat.</div>`:''}</div>`;
  return h;
}
function docSet(c,id,k,v){const d=S[c].find(x=>x.id===id);if(!d)return;queueSave(c,{...d,[k]:v})}
function confirmDel(btn,fn,court){if(!btn.dataset.c){btn.dataset.c=1;btn.textContent=court?'Confirmer ?':'Toucher encore pour confirmer';btn.classList.add('conf');clearTimeout(btn._t);btn._t=setTimeout(()=>{delete btn.dataset.c;btn.textContent=court?'🗑':'Supprimer';btn.classList.remove('conf')},4000);return}fn()}
const delBtn=(c,id,after='')=>`<button class="btn ghost small delb" title="Supprimer" onclick="event.stopPropagation();confirmDel(this,()=>{del('${c}','${id}');${after}toast('Supprimé')},true)">🗑</button>`;
function nouveauBonChoix(){
  const ch=S.chantiers.find(c=>c.id===ui.cid),dv=byC('devis',ui.cid),ets=etapesOf(ui.cid);
  const lots=[];dv.forEach(d=>(d.lots||[]).forEach(l=>{if((l.lignes||[]).some(x=>x.type!=='mo'))lots.push([d.id+'|'+l.id,(d.numero||'Devis')+' – '+l.nom])}));
  openForm({title:'Nouveau bon de commande',fields:[{k:'src',label:'Partir de',type:'select',opts:[['vierge','Bon vierge'],...(lots.length?[['lot','Un lot du devis (fournitures)']]:[]),['aacheter','Les articles « à acheter »']]},
    ...(lots.length?[{k:'lot',label:'Lot du devis',type:'select',opts:lots}]:[]),{k:'etapeId',label:'Étape (pour « à acheter »)',type:'select',opts:[['','Toutes les étapes'],...ets.map(e=>[e.id,e.nom])]}],
    onSave:async o=>{if(o.src==='lot'){const[did,lid]=o.lot.split('|');return nouveauBon('lot',{did,lid})}return nouveauBon(o.src,{etapeId:o.etapeId})}});
}
async function nouveauBon(src,opt={}){
  const ch=S.chantiers.find(c=>c.id===ui.cid);let lignes=[],etapeId=opt.etapeId||'';
  if(src==='lot'){const d=S.devis.find(x=>x.id===opt.did),l=d&&(d.lots||[]).find(x=>x.id===opt.lid);
    if(l){lignes=l.lignes.filter(x=>x.type!=='mo'&&!x.off).map(x=>({id:uid(),ref:x.ref||'',designation:x.designation,unite:x.unite,qte:x.qte,pu:x.pu}));
      const e=etapesOf(ui.cid).find(e=>e.nom.toLowerCase()===l.nom.toLowerCase());if(e)etapeId=e.id}}
  if(src==='aacheter'){lignes=byC('achats',ui.cid).filter(a=>a.statut==='a_acheter'&&(!etapeId||a.etapeId===etapeId)).map(a=>({id:uid(),achatId:a.id,designation:a.materiau,unite:a.unite,qte:num(a.quantite),pu:num(a.prixUnit)}))}
  const id=await save('bons',{chantierId:ui.cid,numero:nextNum('bons','BC'),date:today(),statut:'emis',fournisseur:'',livraisonLieu:ch?ch.lieu||'':'',etapeId,lignes,notes:'Merci de joindre ce bon de commande à votre facture et au bordereau de livraison.'});
  ui.tab='commandes';ui.bonId=id;render();
}
async function receptionner(id){const b=S.bons.find(x=>x.id===id);if(!b)return;
  for(const l of (b.lignes||[])){const base={chantierId:b.chantierId,materiau:l.designation,quantite:num(l.qte),unite:l.unite,prixUnit:num(l.pu),fournisseur:b.fournisseur||'',etapeId:b.etapeId||'',statut:'achete',date:today(),bonId:b.id,notes:'Bon '+b.numero};
    const ex=l.achatId&&S.achats.find(a=>a.id===l.achatId);await save('achats',ex?{...ex,...base,justifs:ex.justifs||[]}:base)}
  await save('bons',{...b,statut:'livre',livreLe:today()});toast('Livraison enregistrée dans les achats');}

/* ---------- lignes (devis / bons) ---------- */
function getLines(c,id,lotId){const d=S[c].find(x=>x.id===id);if(!d)return null;if(lotId){const l=(d.lots||[]).find(x=>x.id===lotId);return l?l.lignes:null}return d.lignes||(d.lignes=[])}
function lineRow(c,id,lotId,l,base){const t=l.pct!=null?num(l.pct)/100*(base||0):num(l.qte)*num(l.pu);
  return `<div class="it click${l.off?' off':''}" onclick="formLigne('${c}','${id}',${lotId?`'${lotId}'`:'null'},'${l.id}')">${c==='devis'?`<input type="checkbox" class="lchk" title="Inclure dans le devis" ${l.off?'':'checked'} onclick="event.stopPropagation();toggleLine('${id}','${lotId}','${l.id}')">`:''}<div class="main"><div class="t" style="font-weight:500">${esc(l.designation)}</div><div class="s">${l.pct!=null?`${N(num(l.pct))} % de ${F(base||0)} de fournitures`:`${N(num(l.qte))} ${esc(l.unite||'')} × ${F(num(l.pu))}`}</div></div><div class="amt">${F(t)}<button class="btn ghost small delb" title="Supprimer la ligne" onclick="event.stopPropagation();confirmDel(this,()=>delLine('${c}','${id}',${lotId?`'${lotId}'`:'null'},'${l.id}'),true)">🗑</button></div></div>`}
function delLine(c,id,lotId,lnid){mutDoc(c,id,d=>{const L=lotId?d.lots.find(z=>z.id===lotId).lignes:d.lignes;const i=L.findIndex(z=>z.id===lnid);if(i>=0)L.splice(i,1)});toast('Ligne supprimée')}
async function delChantier(id){for(const c of COLLS.filter(c=>c!=='chantiers'&&c!=='articles'))for(const x of byC(c,id))await del(c,x.id);await del('chantiers',id);ui.view='home';render();toast('Supprimé')}
function toggleLine(id,lid,lnid){mutDoc('devis',id,d=>{const x=d.lots.find(z=>z.id===lid).lignes.find(z=>z.id===lnid);x.off=!x.off})}
function toggleAcier(id,lid){mutDoc('devis',id,d=>{const L=d.lots.find(z=>z.id===lid).lignes.filter(z=>String(z.ref).startsWith('fer-'));const allOff=L.every(z=>z.off);L.forEach(z=>z.off=!allOff)})}
function mutDoc(c,id,fn){const d=S[c].find(x=>x.id===id);if(!d)return;const n=JSON.parse(JSON.stringify(d));fn(n);queueSave(c,n)}
function formLigne(c,id,lotId,lineId,def={}){
  const ls=getLines(c,id,lotId)||[],l=lineId?ls.find(x=>x.id===lineId):null;
  if(l&&l.pct!=null){openForm({title:"Main-d'œuvre en pourcentage",values:{designation:l.designation,pct:l.pct},fields:[{k:'designation',label:'Désignation',req:true},{k:'pct',label:'Pourcentage des fournitures de l\'étape (%)',type:'number',req:true}],
    onSave:o=>mutDoc(c,id,d=>{const x=d.lots.find(z=>z.id===lotId).lignes.find(z=>z.id===l.id);x.designation=o.designation;x.pct=num(o.pct);x.qte=num(o.pct)}),onDelete:()=>mutDoc(c,id,d=>{const L=d.lots.find(z=>z.id===lotId).lignes;L.splice(L.findIndex(z=>z.id===l.id),1)})});return}
  openForm({title:l?'Modifier la ligne':'Nouvelle ligne',values:l||{unite:'pièce',qte:1,...def},
    fields:[{k:'designation',label:'Désignation',req:true},...(c==='devis'?[{k:'type',label:'Section',type:'select',opts:[['mat','Fournitures (matériaux)'],['mo',"Main-d'œuvre / prestations"]]}]:[]),
      {k:'qte',label:'Quantité',type:'number',req:true},{k:'unite',label:'Unité',type:'select',opts:UNITES_ALL.map(u=>[u,u])},{k:'pu',label:'Prix unitaire (FCFA)',type:'number'},{k:'tInfo',type:'info'}],
    onInput:(f,o)=>{f.querySelector('#tInfo').innerHTML=`<div class="r"><span>Montant</span><b>${F(num(o.qte)*num(o.pu))}</b></div>`},
    onSave:o=>{o.qte=num(o.qte);o.pu=num(o.pu);mutDoc(c,id,d=>{const L=lotId?d.lots.find(x=>x.id===lotId).lignes:(d.lignes=d.lignes||[]);
      if(l){const i=L.findIndex(x=>x.id===l.id);L[i]={...L[i],...o}}else L.push({id:uid(),ref:def.ref||'',type:o.type||def.type||'mat',...o})})},
    onDelete:l?()=>mutDoc(c,id,d=>{const L=lotId?d.lots.find(x=>x.id===lotId).lignes:d.lignes;L.splice(L.findIndex(x=>x.id===l.id),1)}):null});
}
const UNITES_ALL=['pièce','sac','m³','m²','ml','m','kg','tonne','barre','L','feuille','rouleau','seau','pot','panneau','plaque','sachet','voyage','jour','mois','point','forfait','ens.'];
function pickArticle(c,id,lotId,type){
  let sect=type==='mo'?'mo':'liants',q='';
  const draw=()=>{const list=(q?articles():articles(sect)).filter(a=>!q||a.nom.toLowerCase().includes(q.toLowerCase())).filter(a=>type==='mo'?a.secteur==='mo':a.secteur!=='mo');
    $('#pkList').innerHTML=list.slice(0,150).map(a=>`<div class="it click" data-ref="${esc(a.ref)}"><div class="main"><div class="t" style="font-weight:500">${esc(a.nom)}</div><div class="s">${esc(SECT[a.secteur]?SECT[a.secteur].nom:'')}</div></div><div class="amt">${F(a.prix)}<small>/ ${esc(a.unite)}</small></div></div>`).join('')||'<div class="empty sm">Aucun article.</div>';
    $('#pkList').querySelectorAll('[data-ref]').forEach(el=>el.onclick=()=>{const a=art(el.dataset.ref);closeForm();formLigne(c,id,lotId,null,{ref:a.ref,designation:a.nom,unite:a.unite,pu:a.prix,qte:1,type})});
    $('#pkSect').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.s===sect&&!q))};
  const sects=CATALOGUE.filter(s=>type==='mo'?s.id==='mo':s.id!=='mo');
  $('#modalRoot').innerHTML=`<div class="modal-bg" onclick="if(event.target===this)closeForm()"><div class="modal"><h2>${type==='mo'?"Main-d'œuvre & prestations":'Catalogue des matériaux'}</h2>
    <input class="cin" id="pkQ" placeholder="Rechercher (ex. coude, 42.5, câble 2,5…)" style="margin-bottom:10px">
    ${sects.length>1?`<div class="seg wrapseg" id="pkSect">${sects.map(s=>`<button data-s="${s.id}">${esc(s.nom)}</button>`).join('')}</div>`:'<div id="pkSect"></div>'}
    <div class="list" id="pkList"></div><button class="btn sec block" style="margin-top:10px" onclick="closeForm()">Fermer</button></div></div>`;
  $('#pkQ').oninput=e=>{q=e.target.value;draw()};$('#pkSect').querySelectorAll('button').forEach(b=>b.onclick=()=>{sect=b.dataset.s;q='';$('#pkQ').value='';draw()});draw();
}

/* ---------- Devis ---------- */
const STAT_DEV={brouillon:'Brouillon',envoye:'Envoyé',accepte:'Accepté',refuse:'Refusé'};
function totDevis(d){let mat=0,mo=0;const lots=(d.lots||[]).map(l=>{let m=0,w=0;(l.lignes||[]).forEach(x=>{if(x.off||x.pct!=null)return;const t=num(x.qte)*num(x.pu);if(x.type==='mo')w+=t;else m+=t});(l.lignes||[]).forEach(x=>{if(!x.off&&x.pct!=null&&!x.glob)w+=num(x.pct)/100*m});mat+=m;mo+=w;return{m,w,t:m+w}});
  const matBase=(d.lots||[]).reduce((a,l,i)=>a+(l.moBase===false?0:lots[i].m),0);(d.lots||[]).forEach((l,i)=>(l.lignes||[]).forEach(x=>{if(!x.off&&x.pct!=null&&x.glob){const v=num(x.pct)/100*matBase;lots[i].w+=v;lots[i].t+=v;mo+=v}}));
  const st=mat+mo,imp=st*num(d.imprevus)/100,rem=(st+imp)*num(d.remise)/100,ht=st+imp-rem,tva=d.tva?ht*(num(d.tauxTVA)||19.25)/100:0,ttc=ht+tva;
  return{lots,mat,matBase,mo,st,imp,rem,ht,tva,ttc,acompte:ttc*num(d.acompte)/100}}
function tDevis(ch){
  if(ui.devisId){const d=S.devis.find(x=>x.id===ui.devisId);if(d)return devisEditor(ch,d);ui.devisId=null}
  const list=byC('devis',ch.id).sort((a,b)=>(b.numero||'').localeCompare(a.numero||''));
  let h=`<div class="card"><h3>Créer un devis</h3><div class="sm mute" style="margin-bottom:10px">L'assistant prépare un devis complet, lot par lot, des études jusqu'à la remise des clés (fondations, protection contre l'humidité, élévation, toiture, réseaux, finitions, contrôles et réception), avec les matériaux et la main-d'œuvre séparés. Tu ajustes ensuite chaque ligne.</div>
    <div class="qbtns" style="margin:0"><button class="btn" onclick="formAssistant()">✨ Assistant devis complet</button><button class="btn sec" onclick="formOuvrages()">🧱 Devis par ouvrage</button><button class="btn sec" onclick="devisVierge()">Devis vierge</button></div></div>`;
  if(typ(ch)==='travaux')h=`<div class="card"><h3>Créer un devis</h3><div class="sm mute" style="margin-bottom:10px">Pour un travail ponctuel, choisis les parties du bâtiment à réaliser (poteaux, semelles, chaînages, dalle, murs, enduits, dallage, chape, carrelage, fouilles) et leurs dimensions : les matériaux et la main-d'œuvre sont calculés automatiquement.</div>
    <div class="qbtns" style="margin:0"><button class="btn" onclick="formOuvrages()">🧱 Devis par ouvrage</button><button class="btn sec" onclick="devisVierge()">Devis vierge</button></div></div>`;
  if(list.length){h+=`<div class="card list">`;list.forEach(d=>{const t=totDevis(d),st=d.statut||'brouillon';
    const cp=st==='accepte'&&(marche(ch.id)||{}).d===d?clientPay(ch.id):null;h+=`<div class="it click" onclick="ui.devisId='${d.id}';render()"><div class="main"><div class="t">${cp?dot(cp.c)+' ':''}${esc(d.numero)} ${chip(STAT_DEV[st],{accepte:'ok',envoye:'blue',refuse:'bad'}[st])}</div>${cp?`<div class="s pst ${cp.c}">${esc(cp.t)}</div>`:''}<div class="s">${dfr(d.date)} · ${esc(d.objet||'')}</div></div><div class="amt">${F(t.ttc)}<small>≈ ${C(t.ttc)}</small></div>${delBtn('devis',d.id)}</div>`});h+=`</div>`}
  return h;
}
async function devisVierge(){const ch=S.chantiers.find(c=>c.id===ui.cid);
  const id=await save('devis',{chantierId:ui.cid,numero:nextNum('devis','DEV'),date:today(),validite:30,statut:'brouillon',objet:'Travaux de construction – '+(ch.nom||''),tva:false,tauxTVA:19.25,imprevus:5,remise:0,acompte:30,lots:[{id:uid(),nom:'Lot 1',lignes:[]}],conditions:CONDITIONS});
  ui.devisId=id;render()}
const CONDITIONS="Devis valable 30 jours. Acompte à la signature, puis règlements selon l'avancement des travaux (situations).\nPrix établis sur la base des prix du marché de Douala à la date du devis ; les matériaux à prix homologué (ciment, fer à béton) suivent les prix officiels en vigueur.\nSont exclus, sauf mention contraire : mobilier, électroménager, climatiseurs, clôture et portail, aménagement paysager.\nTravaux exécutés selon les règles de l'art, les plans approuvés et le permis de bâtir.";
function devisEditor(ch,d){
  const t=totDevis(d),st=d.statut||'brouillon';
  const inp=(k,l,type='text',extra='')=>`<label class="f"><span>${l}</span><input type="${type}" ${type==='number'?'inputmode="decimal"':''} value="${esc(d[k]??'')}" ${extra} onchange="docSet('devis','${d.id}','${k}',${type==='number'?'num(this.value)':'this.value'})"></label>`;
  let h=`<div class="row between" style="flex-wrap:wrap;gap:6px;margin-bottom:6px"><button class="btn ghost small" onclick="ui.devisId=null;render()">← Tous les devis</button><div class="row" style="gap:6px;flex-wrap:wrap">${d.ouv?`<button class="btn sec small" onclick="formOuvrages('${d.id}')">🧱 Modifier les ouvrages</button>`:''}${d.ouv||d.params||d.paramsJson?`<button class="btn sec small" onclick="viewMetre('${d.id}')">📏 Avant-métré</button><button class="btn sec small" onclick="viewPlans('${d.id}')">📐 Plans</button>`:''}${d.params?`<button class="btn sec small" onclick="formRegDevis('${d.id}')">⚙️ Détails et réglages${(()=>{const n=Object.keys(d.params.reg||{}).length+Object.keys(d.params).filter(k=>k.startsWith('d_')&&d.params[k]!=='').length;return n?' ('+n+')':''})()}</button>`:''}</div></div>
  <div class="card"><div class="row between"><h3 style="margin:0">${esc(d.numero)}</h3><select style="width:auto" class="cin" onchange="docSet('devis','${d.id}','statut',this.value)">${Object.entries(STAT_DEV).map(([k,v])=>`<option value="${k}" ${st===k?'selected':''}>${v}</option>`).join('')}</select></div><div style="height:10px"></div>
   ${inp('objet','Objet')}<div class="grid2">${inp('date','Date','date')}${inp('validite','Validité (jours)','number')}</div>
   <div class="grid3">${inp('imprevus','Imprévus (%)','number')}${inp('remise','Remise (%)','number')}${inp('acompte','Acompte (%)','number')}</div>
   <label class="chk"><input type="checkbox" ${d.tva?'checked':''} onchange="docSet('devis','${d.id}','tva',this.checked)"> Appliquer la TVA (${N(num(d.tauxTVA)||19.25)} %)</label>
   <div class="sm mute">Client : ${esc(ch.client||'à renseigner dans le chantier')}${ch.clientTel?' · '+esc(ch.clientTel):''}</div></div>`;
  (d.lots||[]).forEach((l,i)=>{const lt=t.lots[i],op=ui.open[l.id];
    h+=`<div class="card lot"><div class="row between click" onclick="ui.open['${l.id}']=!ui.open['${l.id}'];render()"><div style="min-width:0"><div class="t" style="font-weight:700">${i+1}. ${esc(l.nom)}</div>
      <div class="sm mute">Fournitures ${F(lt.m)} · MO ${F(lt.w)}</div></div><div class="amt" style="font-weight:800">${F(lt.t)}<small>${op?'▲':'▼'}</small></div></div>`;
    if(op){const mats=l.lignes.filter(x=>x.type!=='mo'),mos=l.lignes.filter(x=>x.type==='mo');
      h+=`<div class="note" style="margin-top:0">Décoche une ligne pour la retirer du devis : elle reste visible, grisée, et tu peux la remettre.</div><div class="subh">Fournitures (matériaux)</div><div class="list">${mats.map(x=>lineRow('devis',d.id,l.id,x)).join('')||'<div class="sm mute">—</div>'}</div>
      <div class="qbtns"><button class="btn sec small" onclick="pickArticle('devis','${d.id}','${l.id}','mat')">+ Matériau</button><button class="btn sec small" onclick="formLigne('devis','${d.id}','${l.id}',null,{type:'mat'})">+ Ligne libre</button></div>
      <div class="subh">Main-d'œuvre & prestations</div><div class="list">${mos.map(x=>lineRow('devis',d.id,l.id,x,x.glob?t.matBase:lt.m)).join('')||'<div class="sm mute">—</div>'}</div>
      <div class="qbtns"><button class="btn sec small" onclick="pickArticle('devis','${d.id}','${l.id}','mo')">+ Main-d'œuvre</button><button class="btn sec small" onclick="formLigne('devis','${d.id}','${l.id}',null,{type:'mo',unite:'forfait'})">+ Ligne libre</button></div>
      ${l.note?`<div class="note">${esc(l.note)}</div>`:''}
      <div class="qbtns" style="border-top:1px solid var(--line);padding-top:10px"><button class="btn sec small" onclick="nouveauBon('lot',{did:'${d.id}',lid:'${l.id}'})">🧾 Bon de commande du lot</button>${l.lignes.some(x=>String(x.ref).startsWith('fer-'))?`<button class="btn sec small" onclick="toggleAcier('${d.id}','${l.id}')">${l.lignes.filter(x=>String(x.ref).startsWith('fer-')).every(x=>x.off)?'Remettre':'Retirer'} tout l'acier</button>`:''}<button class="btn sec small" onclick="renommerLot('${d.id}','${l.id}')">Renommer</button>
      <button class="btn sec small" onclick="moveLot('${d.id}','${l.id}',-1)">↑</button><button class="btn sec small" onclick="moveLot('${d.id}','${l.id}',1)">↓</button>
      <button class="btn danger small" onclick="confirmDel(this,()=>mutDoc('devis','${d.id}',x=>x.lots=x.lots.filter(z=>z.id!=='${l.id}')))">Supprimer le lot</button></div>`}
    h+=`</div>`});
  h+=`<button class="btn sec block" style="margin-bottom:12px" onclick="ajouterLot('${d.id}')">+ Ajouter un lot</button>
  <div class="card res" style="border-style:solid"><div class="r"><span>Total fournitures</span><b>${F(t.mat)}</b></div><div class="r"><span>Total main-d'œuvre & prestations</span><b>${F(t.mo)}</b></div>
   <div class="r"><span>Sous-total</span><b>${F(t.st)}</b></div>${t.imp?`<div class="r"><span>Imprévus (${N(num(d.imprevus))} %)</span><b>${F(t.imp)}</b></div>`:''}${t.rem?`<div class="r"><span>Remise (${N(num(d.remise))} %)</span><b>− ${F(t.rem)}</b></div>`:''}
   <div class="r"><span>Total HT</span><b>${F(t.ht)}</b></div>${d.tva?`<div class="r"><span>TVA ${N(num(d.tauxTVA)||19.25)} %</span><b>${F(t.tva)}</b></div>`:''}
   <div class="r big"><span>TOTAL ${d.tva?'TTC':'NET'}</span><b>${F(t.ttc)}<br><small class="mute">≈ ${C(t.ttc)}</small></b></div>${num(d.acompte)?`<div class="r"><span>Acompte demandé (${N(num(d.acompte))} %)</span><b>${F(t.acompte)}</b></div>`:''}
   <div class="note">${esc(lettres(t.ttc))} francs CFA</div></div>
  <div class="card"><label class="f"><span>Conditions & mentions</span><textarea style="min-height:110px" onchange="docSet('devis','${d.id}','conditions',this.value)">${esc(d.conditions||'')}</textarea></label></div>
  <div class="card"><div class="qbtns" style="margin:0"><button class="btn" onclick="pdfDevis('${d.id}')">📄 PDF du devis</button><button class="btn sec" onclick="appliquerDevis('${d.id}')">Appliquer au chantier</button>
   <button class="btn sec" onclick="dupliquerDevis('${d.id}')">Dupliquer</button><button class="btn danger" onclick="confirmDel(this,()=>{del('devis','${d.id}');ui.devisId=null})">Supprimer</button></div>
   <div class="note">« Appliquer au chantier » crée une étape par lot avec son budget, et fixe le budget du chantier au total HT. Passe le statut à « Accepté » quand le client signe : son montant devient le montant du marché pour les reçus.</div></div>`;
  return h;
}
function ajouterLot(id){openForm({title:'Nouveau lot',fields:[{k:'nom',label:'Nom du lot',req:true,list:ETAPES_TYPES}],onSave:o=>mutDoc('devis',id,d=>d.lots.push({id:uid(),nom:o.nom,lignes:[]}))})}
function renommerLot(id,lid){const d=S.devis.find(x=>x.id===id),l=d.lots.find(x=>x.id===lid);openForm({title:'Renommer le lot',values:{nom:l.nom},fields:[{k:'nom',label:'Nom du lot',req:true}],onSave:o=>mutDoc('devis',id,d=>d.lots.find(x=>x.id===lid).nom=o.nom)})}
function moveLot(id,lid,dir){mutDoc('devis',id,d=>{const i=d.lots.findIndex(x=>x.id===lid),j=i+dir;if(j<0||j>=d.lots.length)return;[d.lots[i],d.lots[j]]=[d.lots[j],d.lots[i]]})}
async function dupliquerDevis(id){const d=S.devis.find(x=>x.id===id);const n=JSON.parse(JSON.stringify(d));delete n.id;n.numero=nextNum('devis','DEV');n.date=today();n.statut='brouillon';const nid=await save('devis',n);ui.devisId=nid;render();toast('Devis dupliqué')}
async function appliquerDevis(id){const d=S.devis.find(x=>x.id===id),t=totDevis(d),ets=etapesOf(d.chantierId);
  for(let i=0;i<d.lots.length;i++){const l=d.lots[i],e=ets.find(x=>x.nom.toLowerCase()===l.nom.toLowerCase());
    const bb={budget:Math.round(t.lots[i].t),budgetMat:Math.round(t.lots[i].m),budgetMO:Math.round(t.lots[i].w),ordre:i+1};if(e)await save('etapes',{...e,...bb});else await save('etapes',{chantierId:d.chantierId,nom:l.nom,statut:'afaire',avancement:0,...bb})}
  const ch=S.chantiers.find(c=>c.id===d.chantierId);await save('chantiers',{...ch,budget:Math.round(t.ht)});toast('Étapes et budgets (matériaux / main-d\'œuvre) mis à jour')}

/* ---------- Assistant devis (génération) ---------- */
const MOB_LOTS=[['etudes','Études, plans & autorisations'],['installation','Installation de chantier'],['implantation','Implantation & traçage'],['terrassement','Terrassements'],['fondations','Fondations & soubassement'],['dallage','Dallage'],['elevation','Élévation des murs'],['dalles','Planchers, dalles & escalier'],['toiture','Toiture / étanchéité'],['plomberie','Plomberie & assainissement'],['electricite','Électricité'],['enduits','Enduits'],['carrelage','Chapes & carrelage'],['menuiserie','Menuiseries'],['peinture','Peinture'],['exterieur','Aménagements extérieurs'],['reception','Nettoyage & réception'],['outillage','Petit outillage & matériel'],['options','Options du client']];
const MO_LOTS=[['installation','Installation de chantier'],['implantation','Implantation & traçage'],['terrassement','Terrassements'],['fondations','Fondations & soubassement'],['dallage','Dallage'],['elevation','Élévation des murs'],['dalles','Dalles & escalier'],['toiture','Toiture / étanchéité'],['plomberie','Plomberie & assainissement'],['electricite','Électricité'],['enduits','Enduits'],['carrelage','Chapes & carrelage'],['menuiserie','Menuiseries'],['peinture','Peinture'],['exterieur','Aménagements extérieurs'],['reception','Nettoyage & réception']];
const PIECES=[['sejour','Séjour / salon'],['sam','Salle à manger'],['chambre','Chambre'],['cuisine','Cuisine'],['douche','Douche / salle d\'eau'],['wc','WC'],['couloir','Couloir / dégagement'],['bureau','Bureau'],['magasin','Magasin / débarras'],['veranda','Véranda / terrasse couverte'],['buanderie','Buanderie'],['autre','Autre pièce']];
const HUMIDES=['douche','wc','buanderie'];
const CARREAUX=[['6060','60 × 60 grès cérame','rv-6060',0.6,0.6,6],['5050','50 × 50','rv-5050',0.5,0.5,5],['4545','45 × 45','rv-4545',0.45,0.45,5],['4040','40 × 40','rv-4040',0.4,0.4,5],['4040a','40 × 40 antidérapant','rv-antid',0.4,0.4,5],['3030a','30 × 30 antidérapant (douche)','rv-3030',0.3,0.3,4],['aucun','Pas de carrelage',null,1,1,0]];
const FAIENCES=[['2540','25 × 40','rv-faience',0.25,0.4,4],['4040','40 × 40','rv-faience4040',0.4,0.4,5],['3060','30 × 60','rv-faience3060',0.3,0.6,4.5],['2020','20 × 20','rv-faience2020',0.2,0.2,4]];
const PIECE_DEF={sejour:['6060',0],sam:['6060',0],chambre:['4545',0],cuisine:['4040',0.6],douche:['3030a',2.1],wc:['3030a',1.5],couloir:['6060',0],bureau:['4545',0],magasin:['4040',0],veranda:['4040a',0],buanderie:['3030a',1.2],autre:['4545',0]};
const cmr0=x=>Math.round(x*100);let PLRec=null;const PLR=(k,v)=>{if(PLRec)PLRec[k]=v};
const ALLUM=[['auto','Auto (selon la pièce)'],['simple','Simple allumage'],['double','Double allumage (2 groupes de lampes)'],['vv','Va-et-vient (2 interrupteurs)'],['tele','Télérupteur + 3 boutons poussoirs']];
const ALLUML={simple:'simple allumage',double:'double allumage',vv:'va-et-vient',tele:'télérupteur'};
/* minimums NF C 15-100 (prises 16 A, points lumineux) et usages courants, selon le type et la surface */
function elecDef(t,L,l){const S=L*l,Lm=Math.max(L,l);
  const pl=({sejour:S>30?3:S>18?2:1,sam:S>16?2:1,couloir:Math.max(1,Math.ceil(Lm/4)),veranda:Math.max(1,Math.ceil(S/10)),cuisine:S>10?2:1,douche:2,escalier:1})[t]||1;
  const pr=({sejour:Math.min(7,Math.max(5,Math.ceil(S/4))),sam:Math.min(7,Math.max(3,Math.ceil(S/4))),chambre:S>14?4:3,bureau:Math.max(3,Math.ceil(S/4)),cuisine:S>4?6:3,douche:1,wc:0,couloir:S>4?1:0,magasin:S>4?1:0,veranda:1,buanderie:2,escalier:0})[t];
  const al=({sejour:'vv',couloir:Lm>6?'tele':'vv',escalier:'vv',douche:'simple'})[t]||(pl>1?'double':'simple');
  const cl=({chambre:1,sejour:S>16?1:0})[t]||0;return{pl,pr:pr==null?(S>4?1:0):pr,al,cl}}
let wizStep=1;const WSTEPS=7;
function wf(name,label,val,o={}){const t=o.type||'number';
  if(t==='select')return `<label class="f"><span>${label}</span><select name="${name}">${o.opts.map(([v,l])=>`<option value="${esc(v)}" ${String(v)===String(val)?'selected':''}>${esc(l)}</option>`).join('')}</select>${o.help?`<div class="note" id="h_${name}">${o.help}</div>`:''}</label>`;
  if(t==='checkbox')return `<label class="chk"><input type="checkbox" name="${name}" ${val?'checked':''}> ${label}</label>`;
  return `<label class="f"><span>${label}</span><input name="${name}" ${t==='number'?'inputmode="decimal"':''} value="${esc(val??'')}" placeholder="${esc(o.ph||'')}">${o.help?`<div class="note" id="h_${name}" style="margin-top:4px">${o.help}</div>`:''}</label>`}
const opt=(arr,v)=>arr.map(([k,l])=>`<option value="${k}" ${k===v?'selected':''}>${esc(l)}</option>`).join('');
function axeRow(sens,len,nom,auto,pos,deb){return `<div class="axr" ${auto?'data-auto="'+auto+'"':''}><input data-a="nom" value="${esc(nom||'')}" placeholder="Nom (ex. mur chambre 1)"><select data-a="sens">${opt([['L','Sens long.'],['l','Sens larg.']],sens)}</select><input data-a="len" inputmode="decimal" value="${esc(len??'')}" placeholder="m"><button type="button" class="btn ghost small delb" onclick="this.parentNode.remove();wizUpd()">×</button>${auto?'':`<div class="axp"><input data-a="pos" inputmode="decimal" value="${esc(pos??'')}"><input data-a="deb" inputmode="decimal" value="${esc(deb??'')}"></div>`}</div>`}
function pieceCard(type,niv){const d=PIECE_DEF[type]||PIECE_DEF.autre;
  return `<div class="pcard"><div class="row between"><select data-p="type" onchange="pieceType(this)">${opt(PIECES,type)}</select><button type="button" class="btn ghost small delb" onclick="this.closest('.pcard').remove();wizUpd()">×</button></div>
   <div class="grid3" style="margin-top:6px"><label class="mini">Longueur (m)<input data-p="L" inputmode="decimal"></label><label class="mini">Largeur (m)<input data-p="l" inputmode="decimal"></label><label class="mini">Niveau<select data-p="niv">${opt([['0','RDC'],['1','R+1'],['2','R+2'],['3','R+3'],['4','R+4'],['5','R+5']],String(niv||0))}</select></label></div>
   <div class="grid3" style="margin-top:6px"><label class="mini" style="grid-column:span 2">Carreau au sol<select data-p="carreau">${opt(CARREAUX.map(c=>[c[0],c[1]]),d[0])}</select></label><label class="mini">Faïence h. (m)<input data-p="fh" inputmode="decimal" value="${d[1]||''}" placeholder="0"></label></div>
   <label class="mini" style="margin-top:6px" data-fz>Format de faïence (si hauteur de faïence)<select data-p="faience">${opt(FAIENCES.map(c=>[c[0],c[1]]),'2540')}</select></label>
   <div class="grid2 elr" style="margin-top:6px"><label class="mini">⚡ Points lumineux<input data-p="pl" inputmode="decimal"></label><label class="mini">Allumage<select data-p="al">${opt(ALLUM,'auto')}</select></label><label class="mini">Prises 16 A<input data-p="pr" inputmode="decimal"></label><label class="mini">Climatiseurs<input data-p="cl" inputmode="decimal"></label></div>
   <div class="sm mute" data-ps></div></div>`}
function pieceType(sel){const c=sel.closest('.pcard'),d=PIECE_DEF[sel.value]||PIECE_DEF.autre;c.querySelector('[data-p=carreau]').value=d[0];c.querySelector('[data-p=fh]').value=d[1]||'';wizUpd()}
function formAssistant(){
  const ch=S.chantiers.find(c=>c.id===ui.cid);wizStep=1;
  const c42=CIMENTS.filter(a=>!a[1].includes('32.5')&&!a[0].includes('lion')).map(a=>[a[0],a[1].replace(' (sac 50 kg)','')]),c32=CIMENTS.filter(a=>a[1].includes('32.5')).map(a=>[a[0],a[1].replace(' (sac 50 kg)','')]);
  const s1=`<h3>1. Le bâtiment</h3>${wf('objet','Objet du devis','Construction clés en main – '+(ch.nom||''),{type:'text'})}
   <div class="grid2">${wf('L','Longueur hors tout (m) *','',{ph:'ex. 15'})}${wf('l','Largeur hors tout (m) *','',{ph:'ex. 10'})}</div>
   <div class="grid2">${wf('etages','Niveaux','0',{type:'select',opts:[['0','Plain-pied'],['1','R+1'],['2','R+2'],['3','R+3'],['4','R+4'],['5','R+5']]})}${wf('H','Hauteur sous plafond (m)','3')}</div>
   ${wf('toiture','Toiture','tole',{type:'select',opts:[['tole','Charpente bois + tôles bac alu'],['terrasse','Toiture-terrasse (dalle + étanchéité)']]})}
   ${wf('dalle','Dalle','aucune',{type:'select',opts:[['aucune','Pas de dalle (plain-pied sous tôles)'],['coulees','Hourdis + poutrelles coulées sur place'],['hourdis','Hourdis + poutrelles préfabriquées'],['pleine','Dalle pleine en béton armé']],help:'Obligatoire pour un étage ou une toiture-terrasse.'})}
   ${wf('dalleExtra','Dalle en plus à couler (terrasse sur toiture, auvent, balcon) en m²','',{help:'Vide = aucune. Elle reçoit aussi son étanchéité.'})}
   <div id="dxBox">${wf('dxT','Type de la dalle en plus','pleine',{type:'select',opts:[['pleine','Dalle pleine en béton armé'],['coulees','Hourdis + poutrelles coulées sur place'],['hourdis','Hourdis + poutrelles préfabriquées']]})}
    <div class="grid3" data-dx="pleine">${wf('dxEp','Épaisseur (cm)','15')}${wf('dxD','Fer (HA)','10')}${wf('dxEsp','Espacement (cm)','15')}</div>
    <div class="grid3" data-dx="coulees">${wf('dxPouB','Poutrelle : largeur (cm)','15')}${wf('dxPouH','Poutrelle : hauteur (cm)','16')}${wf('dxEnt','Entraxe (cm)','60')}${wf('dxCompr','Compression (cm)','5')}</div>
    <div data-dx="hourdis coulees">${wf('dxHour','Hourdis','pp-hourdis',{type:'select',opts:[['pp-hourdis12','12 × 20 × 50'],['pp-hourdis','16 × 20 × 50'],['pp-hourdis20','20 × 20 × 50']]})}</div></div>
   ${wf('branchement','Branchement ENEO','mono',{type:'select',opts:[['mono','Monophasé 220 V'],['tri','Triphasé 380 V']]})}
   ${wf('cimBA','Ciment pour le béton armé (42.5R)','cim-robust',{type:'select',opts:c42})}${wf('cimMac','Ciment pour maçonnerie et enduits (32.5R)','cim-multix',{type:'select',opts:c32})}`;
  const s2=`<h3>2. Implantation & structure (plan de fondation)</h3>
   <div class="note" style="margin:-4px 0 10px">Relève sur ton plan chaque <b>axe de mur</b> (ligne qui passe au milieu d'un mur porteur) avec sa longueur. Les 4 façades sont déjà là ; ajoute chaque mur intérieur avec sa <b>position</b> (distance d'axe à axe depuis la façade avant pour un mur dans le sens de la longueur, depuis le pignon gauche dans l'autre sens) et l'endroit où il <b>commence</b> : ils servent au plan d'implantation. Si tu nommes les axes comme sur ton plan, par exemple « Axe 7 (B à I) », les positions sont retrouvées automatiquement à partir des longueurs. Ces longueurs donnent les fouilles, les semelles filantes, les longrines, les chaînages, les chaises d'implantation et la ficelle.</div>
   <div id="axes">${FACADES()}</div>
   <div class="qbtns" style="margin:6px 0 10px"><button type="button" class="btn sec small" onclick="document.getElementById('axes').insertAdjacentHTML('beforeend',axeRow('l','',''));wizUpd()">+ Ajouter un axe de mur intérieur</button><button type="button" class="btn ghost small" onclick="axesDefaut()">↺ Rétablir les 4 façades</button></div>
   <div class="res" id="axSum" style="margin-bottom:12px"></div><div id="axEtBox"></div>
   <div class="grid2">${wf('poteaux','Nombre de poteaux (par niveau) *','',{help:'Compte-les sur le plan de structure.'})}${wf('decro','Décrochements de façade','0',{help:'Angles en plus du rectangle ÷ 2.'})}</div>
   <div class="grid2">${wf('nbSI','Semelles isolées (nombre)','',{help:'Sous les poteaux. Vide = une par poteau (avec des semelles isolées, voir le type de fondation à l\'écran 6).'})}${wf('siCote','Côté des semelles isolées (cm)','',{help:'Vide = selon le type de sol (environ 80 cm en plain-pied, 100 cm avec étage).'})}</div>
   ${ouvTable()}`;
  const s3=`<h3>3. Les pièces et les finitions</h3>
   <div class="note" style="margin:-4px 0 10px">Entre les dimensions intérieures de chaque pièce et choisis le carreau. Pour les pièces humides, indique la hauteur de faïence. Ces surfaces servent au carrelage, à la faïence, aux plinthes, à la chape, à l'étanchéité des douches, aux enduits et à la peinture.</div>
   <div class="seg wrapseg" id="nivTabs" style="margin-bottom:8px"></div><div class="note" id="nivNote" style="margin:0 0 8px"></div>
   <div id="pieces">${['sejour','cuisine','chambre','chambre','chambre','douche','douche','couloir'].map(t=>pieceCard(t,0)).join('')}</div>
   <div class="qbtns" style="margin:6px 0 10px"><button type="button" class="btn sec small" onclick="document.getElementById('pieces').insertAdjacentHTML('beforeend',pieceCard('chambre',wizNiv));wizUpd()">+ Ajouter une pièce à ce niveau</button><button type="button" class="btn ghost small" id="nivCopy" onclick="nivCopy()">⧉ Copier les pièces du niveau inférieur</button><button type="button" class="btn ghost small" onclick="piecesDefaut()">↺ Pièces par défaut</button></div>
   <div class="res" id="pcSum"></div>`;
  const s4=`<h3>4. Le terrain</h3><div id="geoAl"></div>${wf('sol','Type de sol','bon',{type:'select',opts:Object.entries(SOLS).map(([k,s])=>[k,s.nom]),help:SOLS.bon.desc})}
   ${wf('humide','Nappe d\'eau proche / terrain humide',true,{type:'checkbox'})}
   <div class="grid2">${wf('terrL','Longueur du terrain à dégager (m)','')}${wf('terrl','Largeur du terrain à dégager (m)','')}</div><div class="note" id="h_terr" style="margin:-6px 0 10px"></div>
   ${wf('eau','Eau sur le chantier','reseau',{type:'select',opts:[['reseau','Branchement CAMWATER sur le terrain'],['citerne','Livraison par camion-citerne'],['forage','Puits ou forage sur place']]})}
   ${wf('elec','Électricité sur le chantier','eneo',{type:'select',opts:[['eneo','Branchement provisoire ENEO'],['groupe','Groupe électrogène'],['thermique','Aucune (bétonnière thermique)']]})}
   <div class="grid2">${wf('magasin','Magasin de chantier (m²)','9',{help:'0 = pas de magasin.'})}${wf('cloture','Clôture provisoire (m)','0')}</div>`;
  const s5=`<h3>5. L'équipe et la durée</h3>
   <div class="grid2">${wf('macons','Maçons','4')}${wf('ferrailleurs','Ferrailleurs / coffreurs','2')}${wf('manoeuvres','Manœuvres','6')}${wf('chefJours','Chef de chantier (jours / semaine, 0 = aucun)','6')}</div>
   <div class="grid2">${wf('duree','Durée totale des travaux (mois)','')}${wf('dureeGO','Dont gros œuvre (mois)','')}</div><div class="note" id="h_duree" style="margin:-6px 0 10px"></div>
   <div class="grid2">${wf('betonnieres','Bétonnières','1')}${wf('rendement','Rendement par bétonnière (m³ / jour)','12')}</div>
   ${wf('gardien','Gardiennage du chantier','oui',{type:'select',opts:[['oui','Oui, pendant toute la durée'],['non','Non']]})}
   ${wf('epi','Équipements de protection (casques, gants, bottes)','oui',{type:'select',opts:[['oui','Inclure dans le devis'],['non','Ne pas inclure']]})}
   ${wf('outilsPossedes','J\'ai déjà le petit outillage (les lignes seront décochées)',false,{type:'checkbox'})}`;
  const s6=`<h3>7. Main-d'œuvre</h3>${wf('moG','Main-d\'œuvre du projet','detail',{type:'select',opts:[['detail','Détaillée par étape (réglages ci-dessous)'],['pct','Pourcentage global de toutes les fournitures du projet'],['forfait','Montant global pour tout le projet']],help:'Global : une seule ligne de main-d\'œuvre pour tout le projet (ex. 25 % des fournitures), à la place de la main-d\'œuvre de chaque étape. Les études, essais et gardiennage restent comptés à part.'})}
   ${wf('moGv','Pourcentage (%) ou montant global (FCFA)','',{ph:'ex. 25 ou 15000000'})}
   <div class="note" style="margin:6px 0 10px">Détail par étape : tarifs unitaires de ton catalogue, pourcentage des fournitures de l'étape, ou montant forfaitaire. </div>`;
  const s6b=`<div class="subh" style="margin-top:4px">Étapes où la main-d'œuvre s'applique</div><div class="note" style="margin:0 0 6px">Décoche une étape pour ne lui mettre aucune main-d'œuvre (ni tarifs, ni pourcentage) et l'exclure de la base du pourcentage global. Les prestations (plans, études, permis, essais, gardiennage) restent toujours facturées.</div>
   <div class="row" style="gap:6px;margin-bottom:6px"><button type="button" class="btn ghost small" onclick="document.querySelectorAll('#wiz [name^=mob_]').forEach(x=>x.checked=true)">Tout cocher</button><button type="button" class="btn ghost small" onclick="document.querySelectorAll('#wiz [name^=mob_]').forEach(x=>x.checked=false)">Tout décocher</button></div>
   <div class="mobox">${MOB_LOTS.map(([k,l])=>`<label class="chk"><input type="checkbox" name="mob_${k}" checked> ${esc(l)}</label>`).join('')}</div>
   <div class="row" style="margin-bottom:10px"><input class="cin" id="pctAll" inputmode="decimal" placeholder="% pour toutes les étapes" style="flex:1"><button type="button" class="btn sec small" onclick="wizPctAll()">Appliquer</button></div>
   ${MO_LOTS.map(([k,lbl])=>`<div class="mor"><span>${lbl}</span><select name="mo_${k}_m" onchange="this.nextElementSibling.placeholder=this.value==='pct'?'%':this.value==='forfait'?'FCFA':'—';this.nextElementSibling.disabled=this.value==='unit'"><option value="unit">Tarifs unitaires</option><option value="pct">% des fournitures</option><option value="forfait">Forfait</option></select><input name="mo_${k}_v" inputmode="decimal" placeholder="—" disabled></div>`).join('')}`;
  $('#modalRoot').innerHTML=`<div class="modal-bg"><div class="modal" id="wiz"><div class="row between" style="margin-bottom:6px"><h2 style="margin:0">Assistant devis</h2><button type="button" class="btn ghost small" onclick="closeForm()">Fermer</button></div>
    <div class="wsteps">${Array.from({length:WSTEPS},(_,i)=>`<span data-i="${i+1}">${i+1}</span>`).join('')}</div>
    ${[s1,s2,s3,s4,s5,detStep(),s6+s6b].map((s,i)=>`<div class="wstep" data-s="${i+1}">${s}</div>`).join('')}
    <div class="row" style="margin-top:12px"><button type="button" class="btn sec" id="wPrev" onclick="wizGo(-1)">Précédent</button><button type="button" class="btn" style="flex:1" id="wNext" onclick="wizGo(1)">Suivant</button></div></div></div>`;
  const W=$('#wiz');W.addEventListener('input',e=>{if(e.target.closest('.ouvt'))e.target.dataset.t=1;if(e.target.dataset.a==='len')e.target.closest('.axr').removeAttribute('data-auto');wizUpd()});W.addEventListener('change',wizUpd);wizShow();wizUpd();wizAides();
}
const FACADES=()=>axeRow('L','','Façade avant','L')+axeRow('L','','Façade arrière','L')+axeRow('l','','Pignon gauche','l')+axeRow('l','','Pignon droit','l');
function axCopyN(i){const W=$('#wiz'),src=i>1?W.querySelector(`.axN[data-n="${i-1}"] .axl`):W.querySelector('#axes'),dst=W.querySelector(`.axN[data-n="${i}"] .axl`);if(!src||!dst)return;dst.innerHTML=readAxes(W,src).map(a=>axeRow(a.sens,a.len,a.nom,'',a.pos,a.deb)).join('');wizUpd();toast('Axes copiés')}
function axesDefaut(){const b=$('#axes'),ints=[...b.querySelectorAll('.axr')].filter(r=>!/^(Façade avant|Façade arrière|Pignon gauche|Pignon droit)$/.test(r.querySelector('[data-a=nom]').value.trim()));
  b.innerHTML=FACADES();ints.forEach(r=>b.appendChild(r));wizUpd();toast('Les 4 façades sont rétablies (tes murs intérieurs sont gardés)')}
let wizNiv=0;const NIVL=n=>n?'R+'+n:'RDC';
function nivGo(n){wizNiv=n;wizUpd()}
function nivCopy(){if(!wizNiv)return;const W=$('#wiz'),src=[...W.querySelectorAll('.pcard')].filter(c=>num(c.querySelector('[data-p=niv]').value)===wizNiv-1);if(!src.length){toast('Aucune pièce au niveau inférieur.');return}
  src.forEach(c=>{const n=c.cloneNode(true);n.querySelectorAll('select').forEach((x,i)=>x.value=c.querySelectorAll('select')[i].value);n.querySelector('[data-p=niv]').value=String(wizNiv);$('#pieces').appendChild(n)});toast(src.length+' pièce(s) copiée(s) au '+NIVL(wizNiv));wizUpd()}
function piecesDefaut(){if(!confirmWiz('piecesDefaut'))return;wizNiv=0;$('#pieces').innerHTML=['sejour','cuisine','chambre','chambre','chambre','douche','douche','couloir'].map(t=>pieceCard(t,0)).join('');wizUpd()}
let _cw={};function confirmWiz(k){if(_cw[k]&&Date.now()-_cw[k]<4000){_cw[k]=0;return true}_cw[k]=Date.now();toast('Touche encore pour remplacer toutes les pièces par la liste par défaut');return false}
function readAxes(W,box){return[...(box||W.querySelector('#axes')||W).querySelectorAll('.axr')].map(r=>({nom:r.querySelector('[data-a=nom]').value.trim(),sens:r.querySelector('[data-a=sens]').value,len:num(r.querySelector('[data-a=len]').value),fac:/^(Façade avant|Façade arrière|Pignon gauche|Pignon droit)$/.test(r.querySelector('[data-a=nom]').value.trim())||!!r.dataset.auto,pos:r.querySelector('[data-a=pos]')?r.querySelector('[data-a=pos]').value.trim():'',deb:r.querySelector('[data-a=deb]')?r.querySelector('[data-a=deb]').value.trim():''})).filter(a=>a.len>0)}
function readPieces(W){return[...W.querySelectorAll('.pcard')].map(c=>{const g=k=>c.querySelector(`[data-p=${k}]`).value;return{type:g('type'),L:num(g('L')),l:num(g('l')),niv:num(g('niv')),carreau:g('carreau'),fh:num(g('fh')),faience:g('faience'),pl:g('pl'),al:g('al'),pr:g('pr'),cl:g('cl')}})}
function wizRead(){const W=$('#wiz'),o={};W.querySelectorAll('[name]').forEach(e=>o[e.name]=e.type==='checkbox'?e.checked:e.value.trim());
  o.ouv=readOuv(W);o.axes=readAxes(W);o.axesN={};W.querySelectorAll('.axN').forEach(b=>o.axesN[b.dataset.n]=readAxes(W,b.querySelector('.axl')));o.pieces=readPieces(W);
  o.chambres=String(o.pieces.filter(p=>p.type==='chambre').length||1);o.sdb=String(o.pieces.filter(p=>HUMIDES.includes(p.type)&&p.type!=='buanderie').length||1);
  o.moB={};Object.keys(o).filter(k=>k.startsWith('mob_')).forEach(k=>{o.moB[k.slice(4)]=!!o[k];delete o[k]});
  o.mo={};MO_LOTS.forEach(([k])=>{o.mo[k]={m:o['mo_'+k+'_m'],v:o['mo_'+k+'_v']};delete o['mo_'+k+'_m'];delete o['mo_'+k+'_v']});return o}
function wizEst(o){const L=num(o.L),l=num(o.l),et=num(o.etages),ter=o.toiture==='terrasse',R=RG(),duree=num(o.duree)||(R.moisBase+R.moisEtage*et+(ter?1:0));
  return{tL:num(o.terrL)||L+6,tl:num(o.terrl)||l+6,duree,go:num(o.dureeGO)||Math.ceil(duree*R.goPct/100)}}
function wizUpd(){{const W=$('#wiz');if(W){const t=(W.querySelector('[name=dxT]')||{}).value,has=num((W.querySelector('[name=dalleExtra]')||{}).value)>0,bx=W.querySelector('#dxBox');if(bx){bx.style.display=has?'':'none';bx.querySelectorAll('[data-dx]').forEach(e=>e.style.display=e.dataset.dx.split(' ').includes(t)?'':'none')}}}const W=$('#wiz');if(!W)return;
  {const box=W.querySelector('#axEtBox'),et=num((W.querySelector('[name=etages]')||{}).value);if(box){if(!et)box.innerHTML='';else{if(!box.querySelector('[name=axEtMode]'))box.innerHTML=`<label class="f"><span>Murs porteurs des étages</span><select name="axEtMode"><option value="idem">Identiques au rez-de-chaussée</option><option value="diff">Différents : saisir les axes de chaque étage</option></select><div class="note" style="margin-top:4px">Les murs de chaque étage portent le plancher du dessus : ils donnent le calepinage des poutrelles et la longueur des chaînages de l'étage.</div></label><div id="axEtL"></div>`;
    const L_=box.querySelector('#axEtL'),diff=box.querySelector('[name=axEtMode]').value==='diff';L_.style.display=diff?'':'none';L_.querySelectorAll('.axN').forEach(b=>{if(+b.dataset.n>et)b.remove()});
    for(let i=1;i<=et;i++)if(!L_.querySelector(`.axN[data-n="${i}"]`))L_.insertAdjacentHTML('beforeend',`<div class="axN" data-n="${i}" style="border:1px solid var(--line);border-radius:10px;padding:8px;margin-bottom:8px"><div class="row between" style="margin-bottom:6px"><b>Axes du ${NIVL(i)}</b><button type="button" class="btn ghost small" onclick="axCopyN(${i})">⧉ Copier ${i>1?'le '+NIVL(i-1):'le RDC'}</button></div><div class="axl"></div><button type="button" class="btn sec small" onclick="this.previousElementSibling.insertAdjacentHTML('beforeend',axeRow('l','',''));wizUpd()">+ Ajouter un axe</button></div>`);
    L_.querySelectorAll('.axN').forEach(b=>{const ax=readAxes(W,b.querySelector('.axl'));let sm=b.querySelector('.axs');if(!sm){sm=document.createElement('div');sm.className='sm mute axs';b.appendChild(sm)}sm.textContent=ax.length?`${ax.length} axes, ${N(sum(ax,x=>x.len),1)} m de murs`:'Aucun axe : copie celui du niveau inférieur ou ajoute les murs.'})}}}
  W.querySelectorAll('.axr').forEach(r=>{const p=r.querySelector('[data-a=pos]');if(!p)return;const L_=r.querySelector('[data-a=sens]').value==='L';p.placeholder=L_?'Position / façade av. (m)':'Position / pignon g. (m)';r.querySelector('[data-a=deb]').placeholder=L_?'Début / pignon g. (m)':'Début / façade av. (m)'});
  W.querySelectorAll('.axr[data-auto]').forEach(r=>{const v=r.dataset.auto==='L'?$('#wiz [name=L]').value:$('#wiz [name=l]').value;r.querySelector('[data-a=len]').value=v});
  {const et=num((W.querySelector('[name=etages]')||{}).value);if(wizNiv>et)wizNiv=et;const cards=[...W.querySelectorAll('.pcard')],nv=c=>num(c.querySelector('[data-p=niv]').value);
   W.querySelectorAll('[data-p=niv]').forEach(x=>{if(x.options.length!==et+1||x.dataset.et!=String(et)){const v=Math.min(num(x.value),et);x.innerHTML=Array.from({length:et+1},(_,i)=>`<option value="${i}">${NIVL(i)}</option>`).join('');x.value=String(v);x.dataset.et=et}});
   const tb=W.querySelector('#nivTabs');if(tb){tb.style.display=et?'':'none';tb.innerHTML=Array.from({length:et+1},(_,i)=>{const cs=cards.filter(c=>nv(c)===i),S=sum(cs,c=>num(c.querySelector('[data-p=L]').value)*num(c.querySelector('[data-p=l]').value));return `<button type="button" class="${i===wizNiv?'on':''}" onclick="nivGo(${i})">${NIVL(i)} · ${cs.length} pièce${cs.length>1?'s':''}${S?' · '+N(S,0)+' m²':''}</button>`}).join('')}
   cards.forEach(c=>c.style.display=!et||nv(c)===wizNiv?'':'none');const nb=cards.filter(c=>nv(c)===wizNiv).length;
   const nn=W.querySelector('#nivNote');if(nn){nn.style.display=et?'':'none';nn.innerHTML=`Pièces du <b>${NIVL(wizNiv)}</b>${nb?'':' : aucune pièce pour l\'instant. Ajoute-les ou copie celles du niveau inférieur.'}`}
   const cp=W.querySelector('#nivCopy');if(cp)cp.style.display=et&&wizNiv>0?'':'none'}
  W.querySelectorAll('.pcard').forEach(c=>{const fh=num(c.querySelector('[data-p=fh]').value);c.querySelector('[data-fz]').style.display=fh>0?'block':'none';
    const L=num(c.querySelector('[data-p=L]').value),l=num(c.querySelector('[data-p=l]').value);c.querySelector('[data-ps]').textContent=L&&l?`${N(L*l)} m² · périmètre ${N(2*(L+l))} m`:'Dimensions à saisir';
    const e=elecDef(c.querySelector('[data-p=type]').value,L||3,l||3);c.querySelector('[data-p=pl]').placeholder='auto : '+e.pl;c.querySelector('[data-p=pr]').placeholder='auto : '+e.pr;c.querySelector('[data-p=cl]').placeholder='auto : '+e.cl;const ao=c.querySelector('[data-p=al] option[value=auto]');if(ao)ao.textContent='Auto : '+ALLUML[e.pl<2&&e.al==='double'?'simple':e.al]});
  const o=wizRead(),e=wizEst(o),ok=num(o.L)&&num(o.l),R=RG();
  const set=(id,t)=>{const x=W.querySelector('#'+id);if(x)x.innerHTML=t};
  const ax=o.axes,Lw=sum(ax,a=>a.len),P=2*(num(o.L)+num(o.l));
  set('axSum',ax.length?`<div class="r"><span>Axes saisis</span><b>${ax.length}</b></div><div class="r"><span>Longueur totale des murs (fondations, longrines, chaînages)</span><b>${N(Lw,1)} m</b></div><div class="r"><span>Dont murs intérieurs</span><b>${N(Math.max(0,Lw-P),1)} m</b></div><div class="r"><span>Chaises d'implantation (2 par axe)</span><b>${ax.length*2}</b></div><div class="r"><span>Ficelle (axes + ${N(R.recul)} m de recul de chaque côté)</span><b>${N(sum(ax,a=>a.len+2*R.recul),0)} m</b></div>`:'<span class="sm mute">Saisis les longueurs des axes.</span>');
  const pcs=o.pieces.filter(p=>p.L&&p.l),Sh=sum(pcs,p=>p.L*p.l),byF={};pcs.forEach(p=>{if(p.carreau!=='aucun')byF[p.carreau]=(byF[p.carreau]||0)+p.L*p.l});
  set('pcSum',`<div class="r"><span>Pièces renseignées</span><b>${pcs.length} / ${o.pieces.length}</b></div><div class="r"><span>Surface intérieure totale</span><b>${N(Sh)} m²</b></div>${Object.entries(byF).map(([k,s])=>`<div class="r"><span>Carreau ${esc(CARREAUX.find(c=>c[0]===k)[1])}</span><b>${N(s)} m²</b></div>`).join('')}${ok&&Sh>A0(o)*(1+num(o.etages))?'<div class="alert">La surface des pièces dépasse la surface du bâtiment : vérifie les dimensions et les niveaux.</div>':''}`);
  set('h_sol',esc((SOLS[o.sol]||SOLS.bon).desc)+' Précise la ville, la position du terrain et ce que tu observes à l\'écran 6 (Sol : diagnostic) pour une proposition plus juste.');
  {const R2=RG(),x=W.querySelector('#geoAl');if(x)x.innerHTML=num(o.etages)>=R2.geoNiv?`<div class="alert">Bâtiment R+${num(o.etages)} : l'étude géotechnique est obligatoire. Elle est ajoutée au devis ; le type de sol choisi ici reste une hypothèse à confirmer par l'étude.</div>`:''}
  set('h_terr',ok?(num(o.terrL)&&num(o.terrl)?`Surface à dégager : ${N(e.tL*e.tl,0)} m².`:`Vide = bâtiment + 3 m tout autour : ${N(e.tL)} × ${N(e.tl)} m.`):'');
  set('h_duree',ok?`${num(o.duree)?'':'Vide = '+e.duree+' mois (règle de durée). '}Gros œuvre : ${num(o.dureeGO)?o.dureeGO:e.go} mois.`:'');
  const ch=num(o.chambres)||1,sd=num(o.sdb)||1,auto={pc:ch+1,fc:ch,pw:sd,fd:sd};
  Object.entries(auto).forEach(([k,v])=>{const i=W.querySelector(`[data-o="${k}"][data-f="Q"]`);if(i&&!i.dataset.t)i.value=v});
  const O=ouvList({ouv:readOuv(W)},ch,sd),sa=c=>sum(O.filter(c),x=>x.L*x.H*x.Q);
  set('ouvSum',`<div class="r"><span>Portes extérieures</span><b>${N(sa(x=>x.cat==='ext'))} m²</b></div><div class="r"><span>Portes intérieures</span><b>${N(sa(x=>x.cat==='int'))} m²</b></div><div class="r"><span>Fenêtres</span><b>${N(sa(x=>x.cat==='fen'))} m²</b></div><div class="r"><span>Total déduit des murs</span><b>${N(sa(()=>true))} m²</b></div>`)}
const A0=o=>num(o.L)*num(o.l);
function wizPctAll(){const v=$('#pctAll').value;if(!v)return;MO_LOTS.forEach(([k])=>{const s=$(`[name=mo_${k}_m]`),i=$(`[name=mo_${k}_v]`);s.value='pct';i.disabled=false;i.placeholder='%';i.value=v})}
function wizShow(){const W=$('#wiz');W.querySelectorAll('.wstep').forEach(d=>d.style.display=+d.dataset.s===wizStep?'':'none');
  W.querySelectorAll('.wsteps span').forEach(s=>s.className=+s.dataset.i<=wizStep?'on':'');$('#wPrev').style.visibility=wizStep>1?'visible':'hidden';$('#wNext').textContent=wizStep<WSTEPS?'Suivant':'✨ Générer le devis';W.scrollTop=0}
async function wizGo(d){const o=wizRead();
  if(d>0&&wizStep===1&&!(num(o.L)&&num(o.l))){toast('Indique la longueur et la largeur du bâtiment.');return}
  if(d>0&&wizStep===1&&o.dalle==='aucune'&&(num(o.etages)>0||o.toiture==='terrasse')){toast('Un étage ou une toiture-terrasse demande une dalle : choisis corps creux ou dalle pleine.');return}
  if(d>0&&wizStep===2){if(o.axes.length<4){toast('Saisis au moins les 4 façades.');return}if(!num(o.poteaux)){toast('Indique le nombre de poteaux (plan de structure).');return}}
  if(d>0&&wizStep===3){const bad=o.pieces.filter(p=>!(p.L&&p.l));if(!o.pieces.length){toast('Ajoute au moins une pièce.');return}{const et=num(o.etages),vide=Array.from({length:et+1},(_,i)=>i).filter(i=>!o.pieces.some(p=>p.niv===i));if(vide.length){wizNiv=vide[0];wizUpd();toast(`Aucune pièce au ${vide.map(NIVL).join(', ')} : ajoute-les ou copie celles du niveau inférieur.`);return}}if(bad.length){toast(`${bad.length} pièce(s) sans dimensions : complète ou supprime-les.`);return}}
  if(d>0&&wizStep===WSTEPS&&o.moG&&o.moG!=='detail'&&!num(o.moGv)){toast(o.moG==='pct'?'Indique le pourcentage global de main-d\'œuvre.':'Indique le montant global de la main-d\'œuvre.');return}
  if(d>0&&wizStep===WSTEPS&&(!o.moG||o.moG==='detail')){for(const[k,lbl] of MO_LOTS){const m=o.mo[k];if(m.m!=='unit'&&!num(m.v)){toast(`Indique le ${m.m==='pct'?'pourcentage':'montant'} pour : ${lbl}`);return}}
    closeForm();const lots=genDevis(o);const id=await save('devis',{chantierId:ui.cid,numero:nextNum('devis','DEV'),date:today(),validite:30,statut:'brouillon',objet:o.objet,tva:false,tauxTVA:19.25,imprevus:5,remise:0,acompte:30,lots,conditions:CONDITIONS,params:o});
    ui.devisId=id;ui.open={};ui.open[lots[0].id]=true;render();toast(lots.length+' lots générés');return}
  wizStep=Math.max(1,Math.min(WSTEPS,wizStep+d));wizShow()}
const OUV_TYPES=[
 ['pe',"Porte d'entrée principale",'ext',0.9,2.2,'me-porte-metal',null],
 ['pd','Porte double du séjour','ext',1.4,2.2,'me-porte-double',null],
 ['pa','Porte arrière / cuisine','ext',0.8,2.1,'me-porte-service',null],
 ['pg','Porte de garage','ext',2.4,2.2,'me-garage',null],
 ['pc','Porte de chambre / intérieure','int',0.8,2.1,'me-porte-iso',null],
 ['pw','Porte douche / WC','int',0.7,2.1,'me-porte-iso70',null],
 ['fs','Fenêtre du séjour','fen',1.8,1.2,'me-fen-alu','me-grille'],
 ['fc','Fenêtre de chambre','fen',1.2,1.2,'me-fen-alu','me-grille'],
 ['fk','Fenêtre de cuisine','fen',1.0,1.0,'me-fen-alu','me-grille'],
 ['fd','Fenêtre douche / WC (naco)','fen',0.6,0.6,'me-fen-naco','me-grille'],
 ['fb','Baie vitrée','fen',2.4,2.2,'me-baie',null]];
let ouvState=null;
const lc=s=>s.charAt(0).toLowerCase()+s.slice(1);
const ouvDefaults=(ch,sdb)=>({pe:1,pd:0,pa:1,pg:0,pc:ch+1,pw:sdb,fs:2,fc:ch,fk:1,fd:sdb,fb:0});
function ouvTable(){const q=ouvDefaults(3,2);
  return `<div class="f"><span class="lbl">Portes et fenêtres de toute la maison (tous niveaux)</span><div class="sm mute" style="margin-bottom:8px">Dimensions courantes au Cameroun : largeur × hauteur en mètres. Modifie-les selon ton plan.</div>
  <div class="ouvt"><div class="or oh"><span></span><span>Larg.</span><span>Haut.</span><span>Qté</span></div>${OUV_TYPES.map(([k,l,c,L,H])=>`<div class="or"><span>${l}</span><input inputmode="decimal" data-o="${k}" data-f="L" value="${N(L)}"><input inputmode="decimal" data-o="${k}" data-f="H" value="${N(H)}"><input inputmode="numeric" data-o="${k}" data-f="Q" value="${q[k]}"></div>`).join('')}</div>
  <div class="res" id="ouvSum" style="margin-top:8px"></div></div>`}
function readOuv(f){const o={};OUV_TYPES.forEach(([k])=>{const g=x=>num(f.querySelector(`[data-o="${k}"][data-f="${x}"]`).value);o[k]={L:g('L'),H:g('H'),Q:g('Q')}});return o}
function ouvList(p,ch,sdb){const d=ouvDefaults(ch,sdb);return OUV_TYPES.map(([k,label,cat,L0,H0,ref,gr])=>{const v=(p.ouv||{})[k]||{};return{k,label,cat,ref,gr,L:num(v.L)||L0,H:num(v.H)||H0,Q:v.Q!=null?num(v.Q):d[k]}}).filter(x=>x.Q>0)}
const SOLS={
 bon:{nom:'Bon sol',desc:"Latérite compacte, sol ferme ou roche altérée (portance d'environ 2 bars ou plus). Semelles filantes simples, ferraillage minimal.",prof:0.8,sb:0.6,sh:0.25,sl:[3,10],st:[8,0.25],lon:[0.2,0.25,4,10,6,0.2],iso:1.0},
 roche:{nom:'Sol rocheux',desc:"Roche saine ou très compacte. Fouilles au marteau-piqueur, semelles peu profondes, ferraillage minimal.",prof:0.5,sb:0.5,sh:0.2,sl:[3,10],st:[8,0.25],lon:[0.2,0.25,4,10,6,0.2],iso:0.9},
 sable:{nom:'Sol sableux',desc:"Sable compact ou lâche (zones côtières, Douala). Semelles élargies et plus profondes, compactage soigné, protection contre l'affouillement par les eaux.",prof:1.0,sb:0.7,sh:0.3,sl:[4,10],st:[8,0.2],lon:[0.2,0.3,4,10,6,0.2],iso:1.1},
 argile:{nom:'Sol argileux',desc:"Argile qui gonfle à la pluie et se rétracte en saison sèche (risque de fissures). Fondations à 1,20 m minimum, longrines rigides, drainage obligatoire.",prof:1.2,sb:0.8,sh:0.3,sl:[4,12],st:[10,0.2],lon:[0.2,0.4,4,12,8,0.15],iso:1.2,drain:true},
 remblai:{nom:'Remblai / terrain rapporté',desc:"Terre ajoutée récemment ou ancienne décharge. On descend jusqu'au bon sol (gros béton), semelles et longrines renforcées.",prof:1.5,sb:0.8,sh:0.35,sl:[5,12],st:[10,0.15],lon:[0.25,0.4,6,12,8,0.15],iso:1.2,gros:0.7},
 marecage:{nom:'Sol marécageux / nappe haute',desc:"Sol gorgé d'eau, très faible portance (bas-fonds, mangroves). Radier général en béton armé, pompage pendant les fouilles, drainage. Étude de sol indispensable.",prof:0.6,radier:true,lon:[0.25,0.5,6,14,8,0.15],drain:true}};
/* ---------- Règles de calcul (modifiables) ---------- */
const REGLES=[
 {id:'etudes',nom:'Études & plans',a:[
  ['planM2','Conception des plans : prix par m² de plancher','FCFA / m²',600],['geoNiv','Étude géotechnique obligatoire à partir de R+','niveaux',2]]},
 {id:'beton',nom:'Béton & mortier',a:[
  ['dosBA','Dosage du béton armé','kg de ciment / m³',350],['dosProp','Dosage du béton de propreté','kg / m³',150],['dosGros','Dosage du gros béton (remblai)','kg / m³',200],
  ['dosForme','Dosage de la forme de pente','kg / m³',250],['dosTrot','Dosage du trottoir','kg / m³',300],
  ['sableBet','Sable par m³ de béton','m³',0.4],['gravBet','Gravier par m³ de béton','m³',0.8],['densGrav','Densité du gravier (quand il est vendu à la tonne)','t / m³',1.5],
  ['dosPose','Dosage du mortier de pose','kg / m³',300],['dosEndInt',"Dosage de l'enduit intérieur",'kg / m³',350],['dosEndExt',"Dosage de l'enduit extérieur",'kg / m³',400],
  ['dosChape','Dosage de la chape','kg / m³',300],['dosArase',"Dosage de l'arase étanche et de l'enduit de fosse",'kg / m³',400],
  ['sableMor','Sable par m³ de mortier','m³',1.1],['hydro','Hydrofuge par sac de ciment','L',1.5]]},
 {id:'maconnerie',nom:'Maçonnerie, enduits & carrelage',a:[
  ['epJoint','Épaisseur des joints de mortier','cm',1],['casse','Casse des parpaings','%',5],['pertMor','Pertes de mortier de pose (alvéoles, chutes)','%',15],['videPp','Vides d\'un parpaing creux (pour le bourrage)','%',40],
  ['epEndInt',"Épaisseur de l'enduit intérieur",'cm',1.5],['epEndExt',"Épaisseur de l'enduit extérieur",'cm',1.8],['pertEnd','Pertes sur les enduits','%',10],
  ['epChape','Épaisseur de la chape','cm',3.5],['soubH','Hauteur du soubassement (sol normal)','m',0.6],['soubHh','Hauteur du soubassement (terrain humide)','m',0.8],
  ['pertCarr','Coupes et casse du carrelage','%',10],['colle','Ciment-colle','kg / m²',5],['joint','Joint de carrelage','kg / m²',0.4]]},
 {id:'structure',nom:'Structure & ferraillage',a:[
  ['mursInt','Murs intérieurs si non mesurés','% du périmètre',70],['potExt','Espacement des poteaux en façade','m',3.5],['potInt','Espacement des poteaux intérieurs','m',4.5],
  ['potB','Section des poteaux (côté)','cm',20],['chainH','Hauteur du chaînage haut (plain-pied)','cm',30],['poutH','Hauteur des poutres (avec étage)','cm',35],
  ['potCad','Espacement des cadres des poteaux','cm',15],['chainCad','Espacement des cadres des chaînages','cm',20],
  ['recouv','Recouvrements des barres','%',10],['lBarre','Longueur utile d\'une barre de 12 m (chutes déduites)','m',11.5],['ligat',"Fil d'attache",'% du poids d\'acier',1.2],['enrob','Enrobage des aciers','cm',3],
  ['dallePl','Épaisseur de la dalle pleine','cm',15],['dalleEsp','Espacement des aciers de la dalle pleine','cm',15],['dallage','Épaisseur du dallage','cm',10],['herisson','Épaisseur du hérisson','cm',20],
  ['coffReemploi','Réemplois du bois de coffrage','fois',3]]},
 {id:'chantier',nom:'Implantation, outillage & eau',a:[
  ['recul',"Recul des chaises d'implantation",'m',1.5],['pertFic','Pertes sur la ficelle','%',20],['rouleau',"Longueur d'un rouleau de ficelle",'m',50],
  ['pelleMan','Pelles par manœuvre','',1],['pelleMac','Pelles par maçon','',0.5],['piocheMan','Pioches par manœuvre','',0.5],['solDur','Pioches en plus sur sol dur','%',50],
  ['becheMan','Pelles-bêches par manœuvre','',0.34],['brouMan','Brouettes par manœuvre','',0.5],['brouBet','Brouettes minimum par bétonnière','',4],
  ['seauMac','Seaux par maçon','',2],['seauMan','Seaux par manœuvre','',1],['outMac','Truelles, taloches, burins par maçon','',1],['outMac2','Niveaux, règles, massettes, fils à plomb par maçon','',0.5],
  ['gants','Paires de gants par personne et par mois','',2],
  ['eauBet','Eau par m³ de béton','L',180],['eauMor','Eau par m³ de mortier','L',250],['cureL','Arrosage des dalles (cure)','L / m² / jour',5],['cureJ','Durée de la cure','jours',7],['eauJour','Eau de nettoyage','L / jour ouvré',100]]},
 {id:'peinture',nom:'Peinture',a:[
  ['rendInt','Rendement peinture intérieure','m² / kg / couche',9],['rendFac','Rendement peinture façade','m² / kg / couche',7],['rendImp','Rendement impression','m² / kg',10],['couches','Couches de finition','',2]]},
 {id:'duree',nom:'Durée & assainissement',a:[
  ['moisBase',"Durée de base d'un plain-pied",'mois',4],['moisEtage','Mois en plus par étage','mois',3],['goPct','Part du gros œuvre dans la durée','%',60],
  ['fosseBase',"Fosse septique : volume jusqu'à 5 pièces",'m³',3],['fosseSup','Fosse : volume par pièce en plus','m³',1]]}];
const DIAMS=[6,8,10,12,14,16,20];
function RG(){const o={},r=S.config.regles||{};REGLES.forEach(g=>g.a.forEach(([k,,,d])=>{const v=r[k];o[k]=v!=null&&v!==''&&isFinite(num(v))?num(v):d}));const jj=o.epJoint/100,s0=(0.4+jj)*(0.2+jj);o.ppM2=1/s0;[10,15,20].forEach(e=>o['mort'+e]=e/100*(1-0.08/s0)*(1+o.pertMor/100));return o}
const rnd=x=>Math.round(x*1000)/1000;
function solFields(k){const b=SOLS[k],F=[['prof','Profondeur des fondations','m',b.prof]];
  if(!b.radier)F.push(['sb','Largeur des semelles filantes','m',b.sb],['sh','Hauteur des semelles','m',b.sh],['slN','Aciers filants des semelles : nombre','',b.sl[0]],['slD','Aciers filants des semelles : diamètre','mm',b.sl[1]],['stD','Aciers transversaux : diamètre','mm',b.st[0]],['stE','Aciers transversaux : espacement','cm',rnd(b.st[1]*100)],['iso','Semelles isolées (avec étage) : côté','cm',rnd((b.iso||1)*100)]);
  else F.push(['radEp','Épaisseur du radier','cm',25],['radD','Aciers du radier : diamètre','mm',12],['radE','Aciers du radier : espacement','cm',15]);
  F.push(['lonB',b.radier?'Nervures : largeur':'Longrines : largeur','cm',rnd(b.lon[0]*100)],['lonH',b.radier?'Nervures : hauteur':'Longrines : hauteur','cm',rnd(b.lon[1]*100)],['lonN','Nombre de barres','',b.lon[2]],['lonD','Diamètre des barres','mm',b.lon[3]],['lonCd','Diamètre des cadres','mm',b.lon[4]],['lonCe','Espacement des cadres','cm',rnd(b.lon[5]*100)]);
  return F}
function solOf(k){const b=SOLS[k]||SOLS.bon,o=((S.config.regles||{}).sols||{})[SOLS[k]?k:'bon']||{},def=Object.fromEntries(solFields(SOLS[k]?k:'bon').map(f=>[f[0],f[3]])),g=f=>o[f]!=null&&o[f]!==''?num(o[f]):def[f];
  return{...b,prof:g('prof'),sb:b.radier?0.6:g('sb'),sh:b.radier?0.25:g('sh'),sl:b.radier?null:[g('slN'),g('slD')],st:b.radier?null:[g('stD'),g('stE')/100],iso:b.radier?1:g('iso')/100,
    radEp:b.radier?g('radEp')/100:0.25,radD:b.radier?g('radD'):12,radE:b.radier?g('radE')/100:0.15,lon:[g('lonB')/100,g('lonH')/100,g('lonN'),g('lonD'),g('lonCd'),g('lonCe')/100]}}
function viewRegles(){
  if(!ui.regDraft)ui.regDraft=JSON.parse(JSON.stringify(S.config.regles||{}));const d=ui.regDraft;d.sols=d.sols||{};
  const row=(l,u,def,v,inp)=>{const val=v!=null&&v!==''?v:N(def,3),chg=v!=null&&v!==''&&num(v)!==def;return `<div class="regr"><span>${esc(l)}${u?` <small class="mute">(${esc(u)})</small>`:''}${chg?`<br><small class="mute">par défaut : ${N(def,3)}</small>`:''}</span><input inputmode="decimal" class="${chg?'chg':''}" value="${esc(val)}" oninput="${inp}"></div>`};
  let h=`<div class="banner">Ces règles servent à l'assistant devis et aux calculateurs. Les nouveaux devis utilisent les valeurs enregistrées ici ; les devis déjà faits ne changent pas. Une valeur modifiée est encadrée en orange.</div>`;
  REGLES.forEach(g=>{h+=`<div class="card"><div class="row between"><h3 style="margin:0">${esc(g.nom)}</h3><button class="btn ghost small" onclick="regReset('${g.id}')">Par défaut</button></div><div style="height:8px"></div>${g.a.map(([k,l,u,def])=>row(l,u,def,d[k],`ui.regDraft['${k}']=this.value`)).join('')}</div>`});
  h+=`<div class="card"><h3>Fondations par type de sol</h3><div class="sm mute" style="margin:4px 0 10px">Semelles, amorces, poteaux, longrines, radier, ferraillage et dosages pour chaque type de sol et chaque hauteur, et sols typiques par ville.</div><button class="btn sec" onclick="go('fondcat')">🧱 Ouvrir les fondations types</button></div>
  ${ppReglesCard()}
  <div class="card"><div class="qbtns" style="margin:0"><button class="btn" onclick="regSave()">Enregistrer les règles</button><button class="btn sec" onclick="ui.regDraft=null;ui.ppDraft=null;render()">Annuler les changements</button></div></div>`;
  return h;
}
function regReset(g){const G=REGLES.find(x=>x.id===g);G.a.forEach(([k])=>delete ui.regDraft[k]);render()}
async function regSave(){const d=ui.regDraft||{},out={sols:{}};
  for(const g of REGLES)for(const[k,l,,def] of g.a){const v=d[k];if(v==null||v==='')continue;const n=num(v);if(!isFinite(n)||n<0){toast('Valeur invalide : '+l);return}if(n!==def)out[k]=n}
  for(const[sk,ov] of Object.entries(d.sols||{})){const o={};for(const[f,l,,def] of solFields(sk)){const v=ov[f];if(v==null||v==='')continue;const n=num(v);
      if(['slD','stD','radD','lonD','lonCd'].includes(f)&&!DIAMS.includes(n)){toast(`${SOLS[sk].nom} – ${l} : choisis ${DIAMS.join(', ')} mm`);return}
      if(!(n>0)){toast('Valeur invalide : '+l);return}if(n!==def)o[f]=n}if(Object.keys(o).length)out.sols[sk]=o}
  ppSaveDraft(out);out.fcat=(S.config.regles||{}).fcat||{};out.bael=(S.config.regles||{}).bael||{};ui.regDraft=null;await saveConfig({regles:out});toast('Règles enregistrées')}

const BARW={6:0.222,8:0.395,10:0.617,12:0.888,14:1.21,16:1.58,20:2.47};
const up=d=>({6:8,8:10,10:12,12:14,14:16,16:20,20:20})[d]||d;
function genDevis(p){
  const Dq=(k,d)=>{const v=p['d_'+k];if(v==null||v===''||v==='auto')return d;return typeof d==='number'?num(v):v};
  const R={...RG(),...(p.reg||{})},rc=1+R.recouv/100,cs=1+R.casse/100;
  const L=num(p.L),l=num(p.l),et=num(p.etages),nN=et+1,H=num(p.H)||3,A=L*l,P=2*(L+l),AX=(p.axes||[]).filter(x=>num(x.len)>0),LwAx=sum(AX,x=>num(x.len)),Pi=AX.length>=4?Math.max(0,LwAx-P):(num(p.murs)||P*R.mursInt/100),Lw=AX.length>=4?LwAx:P+Pi,ter=p.toiture==='terrasse',hum=!!p.humide;
  const ch=Math.max(1,num(p.chambres)||3),sdb=Math.max(1,num(p.sdb)||1),O=ouvList(p,ch,sdb);
  {const pi=Dq('porteInt','me-porte-iso'),ft=Dq('fenType','me-fen-alu'),gr=Dq('grilles','oui');O.forEach(x=>{if(x.k==='pc'&&pi!=='me-porte-iso')x.ref=pi;if(['fs','fc','fk'].includes(x.k))x.ref=ft;if(gr==='non')x.gr=null})}
  const RM=(p.pieces||[]).filter(x=>num(x.L)&&num(x.l)).map((r,i)=>({...r,_i:i})).sort((a,b)=>num(a.niv)-num(b.niv)||a._i-b._i).map((r,i,arr)=>{const Lr=num(r.L),lr=num(r.l),nv=num(r.niv),tl=(PIECES.find(z=>z[0]===r.type)||[,'Pièce'])[1],same=arr.filter(z=>z.type===r.type&&num(z.niv)===nv),k=same.length>1?' '+(same.indexOf(r)+1):'';return{...r,S:Lr*lr,per:2*(Lr+lr),nom:(et?(nv?'R+'+nv:'RDC')+' – ':'')+tl+k+' '+N(Lr)+'×'+N(lr)+' m'}});
  const sA=f=>sum(O.filter(f),x=>x.L*x.H*x.Q),sQ=f=>sum(O.filter(f),x=>x.Q);
  const aExt=sA(x=>x.cat!=='int'),aInt=sA(x=>x.cat==='int'),ouv=aExt+aInt,ouvExt=aExt,pe=sQ(x=>x.cat==='ext'),pi=sQ(x=>x.cat==='int'),fe=sQ(x=>x.cat==='fen'),mlLint=sum(O,x=>(x.L+2*Dq('lintApp',20)/100)*x.Q);
  const nbPot0=num(p.poteaux)||(Math.ceil(P/R.potExt)+Math.ceil(Pi/R.potInt)),RQ=recoFond(recoIn(k=>p[k]),{A,nPot:nbPot0,Lw,H,ter,ft:(p.d_fType&&p.d_fType!=='auto')?p.d_fType:''}),RD=RQ.dims,FD=(k,f,div)=>Dq(k,div?RD[f]/div:RD[f]),dosF=FD('fDos','dos_ba'),sol0=solOf(RQ.solKey),nD=et+(ter?1:0),w=FD('fsb','fil_B',100),reh=Dq('rehausse',RQ.reh),hS=Dq('soubH',((hum||sol0.drain||RQ.drain)?R.soubHh:R.soubH)+({legere:0.2,forte:0.4}[Dq('terPente','plat')]||0))+reh,nbPot=num(p.poteaux)||(Math.ceil(P/R.potExt)+Math.ceil(Pi/R.potInt));
  const lots=[];let cur;
  const LK=[['Études','etudes'],['Installation','installation'],['Implantation','implantation'],['Terrassements','terrassement'],['Fondations','fondations'],['Dallage','dallage'],['Élévation','elevation'],['Planchers','dalles'],['Dalle de toiture','dalles'],['Charpente','toiture'],['Étanchéité de la toiture','toiture'],['Plomberie','plomberie'],['Électricité','electricite'],['Enduits','enduits'],['Chapes','carrelage'],['Menuiseries','menuiserie'],['Peinture','peinture'],['Aménagements','exterieur'],['Essais','reception'],['Petit outillage','outillage']];
  const lot=(nom,note)=>{cur={id:uid(),nom,note:note||'',lignes:[],_m:{},key:(LK.find(([k])=>nom.startsWith(k))||[])[1]};lots.push(cur)};
  let Vbet=0,Vmor=0,Vba=0;
  const add=(type,ref,q,note,pu)=>{if(!(q>0))return;const a=art(ref);if(!a)return;if(/^gr-(gravier|tout|sable)/.test(ref)&&/^t/i.test(a.unite)){q*=R.densGrav;note=(note?note+' ':'')+`× ${N(R.densGrav)} t/m³`}const k=type+ref+(note||'');
    if(cur._m[k]){cur._m[k].qte+=q;return}const ln={id:uid(),type,ref,designation:a.nom+(note?' — '+note:''),unite:a.unite,qte:q,pu:pu!=null?pu:a.prix};cur._m[k]=ln;cur.lignes.push(ln)};
  const M=(r,q,n)=>add('mat',r,q,n),W=(r,q,n)=>add('mo',r,q,n);
  const SB=Dq('sabBet','gr-sable-sanaga'),GB=Dq('gravBet','mixte'),SM=Dq('sabMac','gr-sable'),SE=Dq('sabEnd','gr-sable-fin'),SC=Dq('sabChape','gr-sable');
  const grav=(V,n)=>{if(GB==='mixte'){M('gr-gravier-515',V/2,n&&`${n} (moitié 5/15)`);M('gr-gravier-1525',V/2,n&&`${n} (moitié 15/25)`)}else M(GB,V,n)};
  const pSF=Dq('sabFinBet',0)/100,pTV=Dq('propTV','gravier')==='toutvenant';
  const beton=(V,dos,ba,lab,tv)=>{if(V<=0)return;const T=tv&&pTV;mtp(cur,{k:'b',d:lab||'béton',V,dos,sb:T?0.5:R.sableBet,gb:T?0.55:R.gravBet,tv:T,sf:T?0:pSF});Vbet+=V;if(ba)Vba+=V;const n=lab?`${lab} : ${N(V,2)} m³`:'';M(ba?p.cimBA:p.cimMac,V*dos/50,n&&`${n} × ${dos} kg/m³`);
    if(T){M(SB,V*0.5,n&&`${n} × 0,5 m³/m³`);M('gr-tout-venant',V*0.55,n&&`${n} × 0,55 m³/m³`);return}
    M(SB,V*R.sableBet*(1-pSF),n&&`${n} × ${N(R.sableBet*(1-pSF),3)} m³/m³`);if(pSF>0)M('gr-sable-fin',V*R.sableBet*pSF,n&&`${n} × ${N(R.sableBet*pSF,3)} m³/m³ (${N(pSF*100,0)} % de sable fin)`);grav(V*R.gravBet,n&&`${n} × ${N(R.gravBet)} m³/m³`)};
  const mortier=(V,dos,lab,sr)=>{if(V<=0)return;mtp(cur,{k:'m',d:lab||'mortier',V,dos,sm:R.sableMor});Vmor+=V;const n=lab?`${lab} = ${N(V,2)} m³ de mortier`:'';M(p.cimMac,V*dos/50,n&&`${n} × ${dos} kg/m³`);M(sr||SM,V*R.sableMor,n&&`${n} × ${N(R.sableMor)} m³/m³`)};
  const fer=kg=>{M('fer-12',kg*0.45/10.66);M('fer-10',kg*0.25/7.4);M('fer-8',kg*0.15/4.74);M('fer-6',kg*0.15/2.66);M('fer-fil',kg*0.012)};
  const coff=m2=>{if(!(m2>0))return;if(Dq('boisCoff','5m')==='5m'){M('bo-planche5',m2/1.5/R.coffReemploi*1.1,`coffrage ${N(m2,1)} m² ÷ 1,5 m² par planche ÷ ${R.coffReemploi} réemplois + 10 %`);M('bo-chevron88',m2*0.1,'raidisseurs de coffrage')}else{M('bo-planche',m2/R.coffReemploi*1.1);M('bo-chevron68',m2*0.12)}M('fer-pointes',m2*0.15)};
  const mois=num(p.duree)||(R.moisBase+R.moisEtage*et+(ter?1:0)),go=num(p.dureeGO)||Math.ceil(mois*R.goPct/100);
  const sol=sol0,bad=['argile','remblai','marecage'].includes(p.sol);
  let kgF=0;
  const fil=(nb,d,ml,elem)=>{if(!(ml>0)||!nb)return;mtp(cur,{k:'f',d:elem,nb,dia:d,ml,rc});M('fer-'+d,nb*ml*rc/R.lBarre,`${elem} : ${nb} HA${d} filants`);kgF+=nb*ml*rc*BARW[d]};
  const cad=(d,e,ml,b,h,elem,nEl=1)=>{if(!(ml>0))return;const n=(Math.ceil(ml/nEl/e-1e-9)+1)*nEl,len=2*(b+h-4*R.enrob/100)+0.12;mtp(cur,{k:'c',d:elem,dia:d,e,ml,n,len,b,h,nEl});M('fer-'+d,n*len*1.05/R.lBarre,`${elem} : cadres HA${d} tous les ${Math.round(e*100)} cm`);kgF+=n*len*1.05*BARW[d]};
  const trv=(d,e,ml,len,elem)=>{if(!(ml>0))return;const n=Math.ceil(ml/e)+1;mtp(cur,{k:'t',d:elem,dia:d,e,ml,n,len});M('fer-'+d,n*len*1.05/R.lBarre,`${elem} : barres HA${d} tous les ${Math.round(e*100)} cm`);kgF+=n*len*1.05*BARW[d]};
  const parp=(ref,S,lab,steps)=>{if(!(S>0))return;const c=ppCalc(ref,S,R);mtp(cur,{k:'p',d:lab,steps:[...(steps||[]),...c.steps],S,ep:c.ep,nb:c.nb,Vm:c.Vm});M(ref,c.nb,`${lab} : ${N(S)} m² ÷ ${N(c.s,4)} m² (${c.L}×${c.H} cm + joint ${N(c.j*100)} cm) + ${R.casse} % de casse`);mortier(c.Vm,R.dosPose,`pose ${lab} : ${N(S)} m² × ${N(c.ep/100)} m × ${N(c.part*100,1)} % de joints + ${R.pertMor} % de pertes`);return c};
  const armFil=(code,nb,d,ml,elem)=>{const A=armParse(code);if(A.length){A.forEach(x=>fil(x.n,x.d,ml,elem+` (${x.n} HA${x.d})`));return}fil(nb,d,ml,elem)};
  const ferFin=()=>{if(kgF>0)M('fer-fil',kgF*R.ligat/100,'ligatures');kgF=0};

  const geoOb=et>=R.geoNiv;
  lot('Études, plans & autorisations',(geoOb?`Bâtiment R+${et} : l'étude géotechnique est obligatoire ; elle fixe le type de sol et le type de fondation (le type de sol choisi dans ce devis est une hypothèse à confirmer).`:'Étude géotechnique facultative en plain-pied et R+1 : coche sa ligne pour l\'inclure.')+' Plans et permis conformes aux règles d\'urbanisme de la commune.');
  {const Sp=A*nN,niv=['RDC','R+1','R+2','R+3','R+4','R+5'].slice(0,nN).join(' + ');add('mo','mo-plans',Sp,`${nN} plancher${nN>1?'s':''} (${niv}) × ${N(A)} m² = ${N(Sp)} m² × ${FN(R.planM2)} FCFA/m²`,R.planM2)}
  W('mo-etude-ba',A*nN);W('mo-geotech',1,geoOb?`obligatoire à partir de R+${R.geoNiv} : type de sol et type de fondation`:'facultative en plain-pied et R+1');if(!geoOb)cur.lignes[cur.lignes.length-1].off=true;W('mo-geometre',1);W('mo-permis',1);
  {const g=Dq('geo','auto'),gl=cur.lignes.find(z=>z.ref==='mo-geotech');if(gl){gl.off=g==='non'||(g==='auto'&&!geoOb);if(g==='non'&&geoOb)cur.note+=' Attention : l\'étude géotechnique a été retirée alors qu\'elle est obligatoire pour ce bâtiment.'}
   if(Dq('geom','oui')==='non')cur.lignes.find(z=>z.ref==='mo-geometre').off=true;if(Dq('permis','oui')==='non')cur.lignes.find(z=>z.ref==='mo-permis').off=true}

  lot('Installation de chantier & préparation du terrain');const instLot=cur;
  const Tl=num(p.terrL)||L+6,Tw=num(p.terrl)||l+6,mag=num(p.magasin),clo=num(p.cloture),cj=num(p.chefJours);
  M('ch-panneau',Dq('panneau',1));
  if(mag>0){const pm=4*Math.sqrt(mag);M('to-ondulee',Math.ceil(mag*1.3/1.6),`toiture du magasin ${N(mag)} m² (+30 % débords)`);M('bo-planche',Math.ceil(pm*Dq('magH',2.2)*1.05),`murs du magasin : ${N(pm,1)} m × ${N(Dq('magH',2.2))} m`);M('bo-chevron68',Math.ceil(pm/1.5)+Math.ceil(mag/2),'ossature du magasin');M('fer-pointes',mag*0.3,'magasin')}
  if(clo>0){M('to-ondulee',Math.ceil(clo/0.8),`clôture provisoire ${N(clo)} m (0,8 m utile par feuille)`);M('bo-chevron68',Math.ceil(clo/Dq('cloEsp',2))+1,`poteaux de clôture tous les ${N(Dq('cloEsp',2))} m`);M('fer-pointes',clo*0.1,'clôture')}
  if(p.elec==='eneo')M('ch-eneo-prov',1);
  W('mo-debrous',Tl*Tw,`terrain ${N(Tl)} × ${N(Tw)} m`);
  if(p.gardien!=='non')W('mo-gardien',mois,`${N(mois)} mois de travaux`);
  if(cj>0)W('mo-chef',Math.ceil(mois*4.33*cj),`${cj} jours / semaine × ${N(mois)} mois`);

  lot('Implantation & traçage','Chaises d\'implantation à '+N(R.recul)+' m en retrait de chaque extrémité d\'axe ; équerrage par la méthode 3-4-5 ; niveaux reportés au tuyau à eau.');
  const ang=4+2*num(p.decro);let chs,mlAx,axNote;
  const cpa=Dq('chParAxe',2),chE=Dq('chEsp',0),nCh=len=>chE>0?Math.ceil(len/chE-1e-9)+1:cpa,trv1=Dq('trav',1);if(AX.length){chs=sum(AX,x=>nCh(num(x.len)));mlAx=sum(AX,x=>num(x.len)+2*R.recul);axNote=`${AX.length} axes, ${N(LwAx,1)} m de murs + ${N(R.recul)} m de recul à chaque bout = ${N(mlAx,0)} m`}
  else{const aL=num(p.axesL)||(2+Math.max(1,Math.round(l/4))),aW=num(p.axesW)||(2+Math.max(1,Math.round(L/4)));chs=aL*nCh(L)+aW*nCh(l);mlAx=aL*(L+2*R.recul)+aW*(l+2*R.recul);axNote=`${aL} axes × ${N(L+2*R.recul)} m + ${aW} axes × ${N(l+2*R.recul)} m = ${N(mlAx,0)} m`}
  M('bo-chevron46',Math.ceil(chs*2/4),`${chs} chaises${chE>0?` (une tous les ${N(chE)} m le long des axes)`:' (une à chaque bout des axes)'} × 2 piquets de 1 m (4 piquets par chevron)`);M('bo-planche',Math.ceil(chs*trv1/4),`${chs} traverses de ${N(trv1)} m (planches de 4 m)`);M('fer-pointes',chs*0.05,'chaises');
  M('ou-cordeau',Math.ceil(mlAx*(1+R.pertFic/100)/R.rouleau),`${axNote}, +${R.pertFic} %, rouleaux de ${R.rouleau} m`);
  M('ou-jalon',ang*2+2,`${ang} angles × 2 + 2 repères de niveau`);M('ou-chaux',Math.max(1,Math.ceil(Lw*2*0.3/25)),'traçage des deux bords des fouilles');
  M('ou-tuyau',Math.ceil(Math.max(L,l)+5),'niveau à eau');M('ou-decametre',1);M('ou-equerre',1);
  W('mo-chaise',chs,'pose des chaises, report des axes et traçage');
  if(AX.length)cur.note+=' Axes : '+AX.map(x=>(x.nom||'axe')+' '+N(num(x.len))+' m').join(' ; ')+'.';

  lot('Terrassements & traitement anti-termite','Type de sol retenu : '+FPROF[RQ.pk].nom+'. '+FPROF[RQ.pk].desc);
  const SB0=solOf('bon'),FT0=Dq('fType','auto'),FT=FT0==='auto'?RQ.ft:FT0,isRad=FT==='radier';
  const fpr=Dq('fprof',RQ.prof),shF=FD('fsh','fil_h',100),isoF=['isolees','mixte'].includes(FT);
  const nSI=p.nbSI!=null&&p.nbSI!==''?num(p.nbSI):(isoF||et?nbPot:0),sSI=Dq('siA',num(p.siCote)||RD.sem_a)/100,hSI=FD('siH','sem_h',100),sur=Dq('puitsSur',20)/100;
  const rigT=Dq('rigType','beton'),rigB=Dq('rigB',0.4),rigE=Dq('rigE',rigT==='filante'?0.2:0.1);
  const sBur=FT==='isolees'?Dq('soubProf',0.4):FT==='cyclo'?Dq('soubProf',0):isRad?0:Dq('soubProf',Math.max(0,fpr-shF));
  const Ar=(L+1)*(l+1),Vpuits=nSI>0&&!isRad?nSI*(sSI+2*sur)**2*fpr:0,Vf=isRad?Ar*0.6+Lw*0.25*0.3:FT==='isolees'?Vpuits+Lw*rigB*(sBur+(rigT==='aucun'?0:rigE)):Lw*w*fpr+(FT==='mixte'?Vpuits:0),Vr=A*Dq('remEp',0.3);
  if(isRad||RQ.pomp)M('ch-pompe',10+5*et,'épuisement des eaux pendant les fouilles');if(p.sol==='roche')M('ch-marteau',Math.ceil(Vf/3),'fouilles en roche');
  {const st=[];if(isRad)st.push(`Radier : (${N(L)} + 1) × (${N(l)} + 1) m × 0,60 m = ${N(Ar*0.6,2)} m³`,`Nervures : ${N(Lw,1)} ml × 0,25 × 0,30 m = ${N(Lw*0.075,2)} m³`);
    else{if(nSI>0&&(FT==='isolees'||FT==='mixte'))st.push(`Fouilles des semelles : ${nSI} × (${N(sSI)} + 2 × ${N(sur)})² × ${N(fpr)} m = ${N(Vpuits,2)} m³`);
      if(FT==='isolees')st.push(`Rigole du soubassement : ${N(Lw,1)} ml × ${N(rigB)} m × ${N(sBur+(rigT==='aucun'?0:rigE))} m = ${N(Lw*rigB*(sBur+(rigT==='aucun'?0:rigE)),2)} m³`);else st.push(`Tranchées : ${N(Lw,1)} ml × ${N(w)} m × ${N(fpr)} m = ${N(Lw*w*fpr,2)} m³`)}
    st.push(`Total des fouilles = ${N(Vf,2)} m³ ; déblais à évacuer = ${N(Vf,2)} × ${N(1+Dq('foisDeb',25)/100)} (foisonnement) = ${N(Vf*(1+Dq('foisDeb',25)/100),2)} m³ ÷ ${N(Dq('camion',8))} m³ = ${Math.ceil(Vf*(1+Dq('foisDeb',25)/100)/Dq('camion',8))} voyages`,
      `Remblai sous dallage : ${N(L)} × ${N(l)} = ${N(A)} m² × ${N(Dq('remEp',0.3))} m = ${N(Vr,2)} m³ × ${N(1+Dq('foisRem',30)/100)} (compactage) = ${N(Vr*(1+Dq('foisRem',30)/100),2)} m³`);mtp(cur,{k:'x',d:'Fouilles, déblais et remblai',steps:st})}
  M('gr-laterite',Vr*(1+Dq('foisRem',30)/100),`remblai ${N(A)} m² × ${N(Dq('remEp',0.3))} m (+${N(Dq('foisRem',30))} % compactage)`);if(Dq('evac','oui')!=='non')M('ch-transport',Math.ceil(Vf*(1+Dq('foisDeb',25)/100)/Dq('camion',8)),`évacuation des déblais ${N(Vf,1)} m³ +${N(Dq('foisDeb',25))} % ÷ camion de ${N(Dq('camion',8))} m³`);
  W('mo-fouilles',Vf);W('mo-remblai',Vr);
  {const pt=Dq('terPente','plat'),kp={legere:0.3,forte:0.8}[pt];if(kp){W('mo-fouilles',A*kp,`mise à niveau d'un terrain en ${pt==='forte'?'forte':'légère'} pente : ${N(A)} m² × ${N(kp)} m de déblai`);M('gr-laterite',A*kp*0.5*(1+Dq('foisRem',30)/100),'remblai de la partie basse du terrain en pente');W('mo-remblai',A*kp*0.5,'remblai de la partie basse')}}
  if(Dq('antiT','oui')!=='non')W('mo-antitermite',isRad?Ar:A+Lw*(FT==='isolees'?rigB:w),'fonds de fouilles et plate-forme');
  {const se=Dq('subEp',RQ.sub),sm=Dq('subMat',RQ.subMat),As=(L+1)*(l+1);if(se>0){const Vs=As*se;cur.note+=` Purge du mauvais sol sur ${N(se)} m et remplacement par ${SUBL[sm]||'matériau'} compacté par couches de 20 cm.`;
     W('mo-fouilles',Vs,`purge du mauvais sol ${N(As)} m² × ${N(se)} m`);M('ch-transport',Math.ceil(Vs*1.25/Dq('camion',8)),`évacuation du mauvais sol ${N(Vs,1)} m³ +25 %`);M(sm,Vs*1.3,`substitution ${N(Vs,1)} m³ + 30 % de compactage`);W('mo-remblai',Vs,'mise en place et compactage par couches de 20 cm');M('ch-compacteur',Math.ceil(Vs/20)+1,'compactage de la substitution');
     if(RQ.geot||sm==='gr-gravier-2540')M('et-geotextile',As*1.15,'séparation entre le sol et la couche de substitution')}
   if(reh>0){M('gr-laterite',A*reh*(1+Dq('foisRem',30)/100),`rehausse de la plate-forme ${N(A)} m² × ${N(reh)} m (terrain inondable)`);W('mo-remblai',A*reh,'rehausse de la plate-forme')}
   if(RQ.trait.length||RQ.why.length)cur.note+=(p.d_ville&&VILLES[p.d_ville]?` Lieu : ${VILLES[p.d_ville].nom.split(':')[0].trim()}${p.d_quartier?' – '+p.d_quartier:''}.`:(p.d_quartier?` Lieu : ${p.d_quartier}.`:''))+' Diagnostic du sol : '+RQ.why.join(' ')+(RQ.chk.length?' '+RQ.chk.join(' '):'')}

  const hm=hum||sol.drain||RQ.drain,FTN={isolees:'Semelles isolées sous les poteaux, amorces, soubassement en maçonnerie et chaînage bas',mixte:'Semelles isolées sous les poteaux + semelles filantes sous les murs',filantes:'Semelles filantes sous les murs',cyclo:'Fondation en béton cyclopéen (béton + moellons) dans les tranchées',radier:'Radier général en béton armé avec nervures sous les murs'};
  const pBf=Dq('amB',num(p.d_potB)||RD.am_b)/100,amH=Dq('amH',Math.max(0.3,fpr-hSI+hS));
  lot('Fondations & soubassement (protection contre l\'humidité)','Sol : '+FPROF[RQ.pk].nom+'. '+(FT0==='auto'?'Fondation recommandée par le diagnostic du sol : ':(FT0===RQ.ft?'Fondation validée par le concepteur : ':'Fondation choisie par le concepteur : '))+FTN[FT]+(isRad?'':` ; fouilles à ${N(fpr)} m de profondeur`)+(nSI>0&&!isRad&&FT!=='filantes'&&FT!=='cyclo'?`, ${nSI} semelles ${Math.round(sSI*100)}×${Math.round(sSI*100)}×${Math.round(hSI*100)} cm`:'')+'. Arase étanche hydrofugée contre les remontées capillaires ; enduit bitumineux sur la face enterrée du soubassement'+(hm?' ; drainage périphérique.':'.')+' Dimensions et aciers indicatifs : à confirmer par l\'étude de sol et les plans de structure.');
  const nAm=isoF?nSI:0,S4=Math.max(0,Lw*(hS+sBur)-nAm*pBf*(hS+sBur));let VbaF=0,Vpr=0;
  if(isRad){
    const ep=FD('radEp','rad_ep')/100,rD=FD('radD','rad_d'),rS=FD('radE','rad_e')/100,Vrad=Ar*ep,lb=FD('lonB','lon_b')/100,lh=Math.max(ep+0.1,FD('lonH','lon_h')/100),ln=FD('lonN','lon_n'),ld=FD('lonD','lon_d'),cd=FD('lonCd','lon_cd'),ce=FD('lonCe','lon_ce')/100,Vn=Lw*lb*(lh-ep);
    Vpr=Ar*0.05;beton(Vpr,R.dosProp,false,'béton de propreté',1);M('gr-gravier-2540',Ar*0.2,'hérisson sous radier');M('et-polyane',Ar*1.15,'sous radier');
    beton(Vrad+Vn,dosF,true,`radier ${N(Ar)} m² × ${N(ep)} m + nervures ${N(Lw,1)} ml`);VbaF=Vrad+Vn;
    const dR=rD,ml=Ar*(1/rS)*2;M('fer-'+dR,ml*2*rc/R.lBarre,`radier : 2 nappes HA${dR} tous les ${Math.round(rS*100)} cm dans les 2 sens`);kgF+=ml*2*rc*BARW[dR];
    M('fer-10',Ar*0.6/R.lBarre*1.1,'radier : chaises de support des nappes');kgF+=Ar*0.6*0.617;
    PLR('lon',{b:lb,h:lh,arm:Dq('lonArm',''),n:ln,d:ld,cd,ce,L:Lw,rad:1});armFil(Dq('lonArm',''),ln,ld,Lw,`nervures ${Math.round(lb*100)}×${Math.round(lh*100)}`);cad(cd,ce,Lw,lb,lh,'nervures');
    coff(2*(L+l+2)*ep+2*Lw*(lh-ep));
  }else{
    const sl=[FD('flN','fil_n'),FD('flD','fil_d')],st=[FD('ftD','fil_td'),FD('ftE','fil_te')/100],lb=FD('lonB','lon_b')/100,lh=FD('lonH','lon_h')/100,ln=FD('lonN','lon_n'),ld=FD('lonD','lon_d'),cd=FD('lonCd','lon_cd'),ce=FD('lonCe','lon_ce')/100,V5=Lw*lb*lh;let V2=0,V3=0,Vam=0;
    if(FT==='filantes'||FT==='mixte'){V2=Lw*w*shF;Vpr+=Lw*w*0.05;beton(V2,dosF,true,`semelles filantes ${N(Lw,1)} ml × ${N(w)} × ${N(shF)} m`);
      fil(sl[0],sl[1],Lw,`semelles filantes ${Math.round(w*100)}×${Math.round(shF*100)}`);trv(st[0],st[1],Lw,w-0.06+0.2,'semelles filantes (aciers transversaux)');coff(2*Lw*shF)}
    if(FT==='cyclo'){const Vc=Lw*w*Math.max(0.2,fpr-sBur);beton(Vc*0.6,RD.dos_gb,false,`béton cyclopéen ${N(Lw,1)} ml × ${N(w)} × ${N(fpr-sBur)} m (60 % béton)`);M('gr-moellons',Vc*0.4,'béton cyclopéen (40 % de moellons)');W('mo-beton',Vc,'béton cyclopéen')}
    if(FT==='isolees'&&rigT!=='aucun'){const Vg=Lw*rigB*rigE;if(rigT==='filante'){beton(Vg,R.dosBA,true,`semelle filante légère sous soubassement ${N(Lw,1)} ml × ${N(rigB)} × ${N(rigE)} m`);fil(4,10,Lw,'semelle filante légère');trv(6,0.25,Lw,rigB+0.1,'semelle filante légère');V2=Vg}
      else{beton(Vg,RD.dos_gb,false,`rigole en béton maigre ${N(Lw,1)} ml × ${N(rigB)} × ${N(rigE)} m`);W('mo-beton',Vg,'rigole sous soubassement')}}
    if(nSI>0&&FT!=='cyclo'){const di=FD('siD','sem_d'),se=FD('siE','sem_e')/100;V3=nSI*sSI*sSI*hSI;Vpr+=nSI*sSI*sSI*0.05;PLR('sem',{a:sSI,h:hSI,d:di,e:se,n:nSI,fpr,sur});beton(V3,dosF,true,`${nSI} semelles isolées ${N(sSI)} × ${N(sSI)} × ${N(hSI)} m`);
      {const cS=baelH().cF/100,n1=Math.floor((sSI-2*cS)/se+1e-9)+1,nt=n1*2*nSI,ln=sSI-2*cS+0.3,Lt=nt*ln*1.05;M('fer-'+di,Lt/R.lBarre,`semelles isolées ${Math.round(sSI*100)}×${Math.round(sSI*100)} (${nSI}) : ${n1} HA${di} par sens tous les ${N(se*100,1)} cm`);kgF+=Lt*BARW[di];mtp(cur,{k:'x',kg:Lt*BARW[di],d:`Acier – semelles isolées (nappe HA${di} dans les 2 sens)`,steps:[`Barres par sens : (${N(sSI)} m − 2 × ${N(cS)} m d'enrobage) ÷ ${N(se)} m + 1 = ${n1} barres`,`${n1} barres × 2 sens × ${nSI} semelles = ${nt} barres de ${N(ln)} m (avec retours de 15 cm)`,`${nt} × ${N(ln)} m × 1,05 = ${N(Lt,1)} m ÷ 12 = ${N(Lt/R.lBarre,1)} barres de 12 m ; poids ${N(Lt*BARW[di],0)} kg`]})};coff(nSI*4*sSI*hSI)}
    if(nAm>0){PLR('am',{b:pBf,h:amH,arm:Dq('amArm',''),n:FD('amN','am_n'),d:FD('amD','am_d'),cd:FD('amCd','am_cd'),ce:FD('amCe','am_ce')/100,nb:nAm});Vam=nAm*pBf*pBf*amH;beton(Vam,dosF,true,`${nAm} amorces de poteaux ${Math.round(pBf*100)}×${Math.round(pBf*100)} cm × ${N(amH)} m`);armFil(Dq('amArm',''),FD('amN','am_n'),FD('amD','am_d'),nAm*(amH+0.3+0.6),`amorces (crosse 30 cm + attentes 60 cm)`);cad(FD('amCd','am_cd'),FD('amCe','am_ce')/100,nAm*amH,pBf,pBf,'amorces',nAm);coff(nAm*4*pBf*amH)}
    beton(Vpr,RD.dos_pr,false,'béton de propreté',1);
    PLR('lon',{b:lb,h:lh,arm:Dq('lonArm',''),n:ln,d:ld,cd,ce,L:Lw});armFil(Dq('lonArm',''),ln,ld,Lw,`chaînage bas / longrines ${Math.round(lb*100)}×${Math.round(lh*100)}`);cad(cd,ce,Lw,lb,lh,'chaînage bas / longrines');
    {const gH=Dq('grosH',RQ.gros);if(gH>0){const Vg=FT==='isolees'?nSI*(sSI+2*sur)**2*gH:Lw*w*gH+(FT==='mixte'?nSI*(sSI+2*sur)**2*gH:0);beton(Vg*0.7,RD.dos_gb,false,'gros béton jusqu\'au bon sol');M('gr-moellons',Vg*0.3,'gros béton jusqu\'au bon sol');W('mo-beton',Vg,'gros béton')}}
    coff(2*Lw*lh);VbaF=V2+V3+V5+Vam;beton(V5,dosF,true,`chaînage bas / longrines ${N(Lw,1)} ml × ${N(lb)} × ${N(lh)} m`);
  }
  {const cf={...RD,sem_a:Math.round(sSI*100),sem_h:Math.round(hSI*100),sem_d:FD('siD','sem_d'),sem_e:FD('siE','sem_e'),am_b:Math.round(pBf*100),am_n:FD('amN','am_n'),am_d:FD('amD','am_d'),am_cd:FD('amCd','am_cd'),am_ce:FD('amCe','am_ce'),pot_b:FD('potB','pot_b'),pot_n:FD('potNb','pot_n'),pot_d:num(FD('potD','pot_d')),pot_cd:FD('potCd','pot_cd'),pot_ce:FD('potCe','pot_ce'),
     lon_b:FD('lonB','lon_b'),lon_h:FD('lonH','lon_h'),lon_n:FD('lonN','lon_n'),lon_d:FD('lonD','lon_d'),lon_cd:FD('lonCd','lon_cd'),lon_ce:FD('lonCe','lon_ce'),fil_B:Math.round(w*100),fil_h:Math.round(shF*100),fil_n:FD('flN','fil_n'),fil_d:FD('flD','fil_d'),fil_td:FD('ftD','fil_td'),fil_te:FD('ftE','fil_te'),rad_ep:FD('radEp','rad_ep'),rad_d:FD('radD','rad_d'),rad_e:FD('radE','rad_e'),dos_ba:dosF};
   {const sa=(k,cn,cd,code)=>{const A=armParse(code);if(A.length){cf[cn]=A[0].n;cf[cd]=A[0].d;cf[k]=armArea(code)-A[0].n*Math.PI*(A[0].d/10)**2/4}};sa('am_ax','am_n','am_d',Dq('amArm',''));sa('pot_ax','pot_n','pot_d',Dq('potArm',''));sa('lon_ax','lon_n','lon_d',Dq('lonArm',''))}
   if(nSI===0&&isoF)cf.sem_a=0;const BK=baelRun(cf,{A,Lw,nPot:nbPot,et,H,ter,sig:RD.sig,prof:fpr,amH,siA:0,Arad:Ar},FT,false),nw=BK.lines.filter(t=>t.startsWith('⚠')).length;
   cur.note+=` VÉRIFICATIONS BAEL 91 MOD. 99${nw?` (${nw} point${nw>1?'s':''} à revoir)`:' (conformes)'} : `+BK.lines.join(' ')+' Prédimensionnement pour devis : note de calcul d\'exécution à faire valider par un ingénieur structure.'}
  ferFin();
  {const sm0=Dq('soubMat','auto'),sm=sm0==='auto'?Dq('ppExt','pp-15c')+'#b':({'pp-15b':'pp-15c#b','pp-20b':'pp-20c#b'}[sm0]||sm0),bour=sm.endsWith('#b'),ref=sm.replace('#b',''),ep=ppDims(ref).ep,lib=`soubassement ${N(S4)} m² (${N(hS)} m hors sol${sBur>0?' + '+N(sBur)+' m enterré':''})`;
   const pc=parp(ref,S4,'soubassement'+(bour?' (parpaings bourrés)':''),[`${N(Lw,1)} ml de murs × (${N(hS)} m hors sol + ${N(sBur)} m enterré) = ${N(Lw*(hS+sBur),2)} m²`,...(nAm>0?[`− ${nAm} amorces × ${N(pBf)} m × ${N(hS+sBur)} m = ${N(nAm*pBf*(hS+sBur),2)} m²`]:[]),`= ${N(S4,2)} m² de maçonnerie`]);
   if(bour){const vd=(R.videPp||40)/100,vb=S4*ep/100*vd,dB=Dq('bourDos',250),bt=`bourrage des parpaings de ${ep} : ${N(S4)} m² × ${N(ep/100)} m × ${N(vd*100,0)} % de vides`;if(Dq('bourMat','beton')==='mortier')mortier(vb,dB,bt);
     else{Vbet+=vb;mtp(cur,{k:'b',d:bt+' (gravier 5/15 seul)',V:vb,dos:dB,sb:R.sableBet,gb:R.gravBet});const n=`${bt} = ${N(vb,2)} m³`;M(p.cimMac,vb*dB/50,`${n} × ${dB} kg/m³`);M(SB,vb*R.sableBet,n);M('gr-gravier-515',vb*R.gravBet,n+' (gravier 5/15, seul à passer dans les trous)')}}}
  const Va=Lw*0.2*Dq('araseEp',2)/100*1.1;mortier(Va,R.dosArase,'arase étanche');M('et-hydrofuge',Math.max(5,Va*R.dosArase/50*R.hydro),'arase étanche');
  M('et-bitume',Math.ceil(P*(hS+0.2)*0.6*Dq('bitC',2)/20),`${Dq('bitC',2)} couches × 0,6 kg/m², face extérieure du soubassement`);
  if(Dq('drain','auto')==='oui'||(Dq('drain','auto')==='auto'&&hm)){M('et-drain',P+4,'drainage périphérique');M('et-geotextile',P*1.5);M('gr-gravier-2540',P*0.4*0.4,'massif drainant');W('mo-fouilles',P*0.4*0.6,'tranchée drainante')}
  W('mo-ba',VbaF);W('mo-beton',Vpr);W('mo-maconnerie',S4);W('mo-etancheite',Lw*0.2+P*(hS+0.2),'arase étanche et bitume');W('mo-essais-beton',1);

  lot('Dallage & plancher bas (anti-remontées capillaires)','Hérisson drainant + film polyane 200 µ sous dallage : barrière contre l\'humidité du sol.');
  {const he=Dq('herEp',R.herisson),de=Dq('dalEp',R.dallage),ls=Dq('litS',5),pr=Dq('polyRec',15);M('gr-gravier-2540',A*he/100,`hérisson ${N(A)} m² × ${N(he)} cm`);if(ls>0)M('gr-sable',A*ls/100,`lit de réglage ${N(ls)} cm`);M('et-polyane',A*(1+pr/100),`recouvrements ${N(pr)} %`);if(Dq('treil','oui')!=='non')M('fer-treillis',Math.ceil(A*1.1/13));
  beton(A*de/100,R.dosBA,true,`dallage ${N(A)} m² × ${N(de)} cm`,1)}W('mo-dallage',A);

  lot('Élévation des murs, poteaux & chaînages');PLR('gen',{L,l,et,H,nN,FT,fpr,enr:R.enrob,cF:baelH().cF,nbPot,nSI,sSI,Lw,P,recul:R.recul,lb:R.lBarre});
  const pB=FD('potB','pot_b'),cHp=Dq('chainH',R.poutH),cHc=Dq('chainH',R.chainH),lB=Dq('lintB',15)/100,lH=Dq('lintH',20)/100,lA=2*Dq('lintApp',20)/100,ppE=Dq('ppExt','pp-15c'),ppI=Dq('ppInt','pp-15c'),epOf=r=>r.includes('10')?10:r.includes('20')?20:15;
  const AXN=p.axEtMode==='diff'&&p.axesN?p.axesN:null,LwN=Array.from({length:nN},(_,i)=>i?(AXN&&AXN[i]&&AXN[i].length?sum(AXN[i],x=>num(x.len)):Dq('mlEtage',Lw)):Lw);
  const LwE=et?sum(LwN.slice(1),x=>x)/et:Dq('mlEtage',Lw),PiE=Math.max(0,LwE-P),PiT=Pi+PiE*et,LwT=Lw+LwE*et,cHx=(et?cHp:cHc)/100,hmc=Math.max(0,H-cHx),pBm=pB/100,dPE=nbPot*pBm*hmc*nN*(P/Lw),dPI=nbPot*pBm*hmc*nN*(Pi/Lw),SmE0=Math.max(0,P*hmc*nN-dPE-aExt),SmI0=Math.max(0,PiT*hmc-dPI-aInt),Sm=SmE0+SmI0,PN=et&&Dq('potNiv','oui')!=='non'?baelNiv({A,et,H,Lw,LwN,ter,nPot:nbPot,b0:pB/100,arm0:Dq('potArm','')||`${FD('potNb','pot_n')}HA${num(FD('potD','pot_d'))}`,ce0:FD('potCe','pot_ce'),aMin:Dq('potMin',20)/100}):null,Vp=PN?sum(PN,q=>nbPot*q.a*q.a*H):nbPot*(pB/100)**2*H*nN,Lct=et&&!ter?LwN[et]:0,Vc=((LwT-Lct)*(et?cHp:cHc)+Lct*cHc)*0.2/100,Vl=mlLint*lB*lH;
  const SmE=SmE0,SmI=SmI0,hTx=`hauteur maçonnée ${N(H)} m − chaînage ${N(cHx)} m = ${N(hmc)} m${nN>1?' × '+nN+' niveaux':''}`;
  parp(ppE,SmE,'murs extérieurs',[`Périmètre extérieur ${N(P,1)} ml × ${hTx} = ${N(P*hmc*nN,2)} m²`,`− poteaux : ${nbPot} poteaux × ${N(P,1)}/${N(Lw,1)} ml ≈ ${N(dPE/(pBm*hmc*nN||1),1)} × ${N(pBm)} m × ${N(hmc)} m${nN>1?' × '+nN:''} = ${N(dPE,2)} m²`,`− ouvertures extérieures (portes et fenêtres) = ${N(aExt,2)} m²`,`= ${N(SmE,2)} m² de maçonnerie`]);
  parp(ppI,SmI,'murs intérieurs',[et&&PiE!==Pi?`Murs intérieurs : RDC ${N(Pi,1)} ml + ${et} étage(s) × ${N(PiE,1)} ml = ${N(PiT,1)} ml × ${N(hmc)} m = ${N(PiT*hmc,2)} m²`:`Murs intérieurs ${N(Pi,1)} ml × ${hTx} = ${N(Pi*hmc*nN,2)} m²`,`− poteaux : ${nbPot} poteaux × ${N(Pi,1)}/${N(Lw,1)} ml ≈ ${N(dPI/(pBm*hmc*nN||1),1)} × ${N(pBm)} m × ${N(hmc)} m${nN>1?' × '+nN:''} = ${N(dPI,2)} m²`,`− portes intérieures = ${N(aInt,2)} m²`,`= ${N(SmI,2)} m² de maçonnerie`]);
  beton(Vp,R.dosBA,true,PN?`poteaux ${nbPot} par niveau : `+PN.map(q=>`${NIVL(q.i)} ${cmr0(q.a)}×${cmr0(q.a)}`).join(', ')+` × ${N(H)} m`:`poteaux ${nbPot} × ${N(pBm)} × ${N(pBm)} m × ${N(H*nN)} m`);beton(Vc,R.dosBA,true,Lct?`poutres d'étage ${N(LwT-Lct,1)} ml × 0,20 × ${N(cHp/100)} m + chaînage de toiture ${N(Lct,1)} ml × 0,20 × ${N(cHc/100)} m`:`chaînages ${N(LwT,1)} ml × 0,20 × ${N(cHx)} m`);beton(Vl,R.dosBA,true,`linteaux ${N(mlLint,1)} ml × ${N(lB)} × ${N(lH)} m`);
  const dp=num(FD('potD','pot_d'));PLR('pot',{b:pB/100,arm:Dq('potArm',''),n:FD('potNb','pot_n'),d:dp,cd:FD('potCd','pot_cd'),ce:FD('potCe','pot_ce')/100,H,nN,nb:nbPot,ch:cHx});
  if(PN){PLR('potN',PN.map(q=>({...q,H,nb:nbPot,ch:(q.i<et||ter?cHp:cHc)/100})));PN.forEach(q=>{const P_=armParse(q.arm),lr=40*Math.max(...P_.map(z=>z.d))/1000;armFil(q.arm,0,0,nbPot*(H+lr),`poteaux ${NIVL(q.i)} ${cmr0(q.a)}×${cmr0(q.a)}`);cad(q.cd,q.ce/100,nbPot*H,q.a,q.a,`poteaux ${NIVL(q.i)}`,nbPot)});
    cur.note+=' Poteaux dimensionnés niveau par niveau (descente de charges BAEL) : '+PN.map(q=>`${NIVL(q.i)} ${cmr0(q.a)}×${cmr0(q.a)} ${q.arm} (Nu ${Math.round(q.Nu)} kN)`).join(' ; ')+'.';
    mtp(cur,{k:'x',d:'Descente de charges et poteaux par niveau (BAEL 91 B.8.4)',steps:PN.map(q=>`${NIVL(q.i)} : porte ${q.nPl} plancher${q.nPl>1?'s':''} + toiture ; G = ${Math.round(q.G)} kN, Q = ${Math.round(q.Q)} kN → Nu par poteau = (1,35 G + 1,5 Q) ÷ ${nbPot} × ${N(baelH().maj)} = ${Math.round(q.Nu)} kN ; section ${cmr0(q.a)}×${cmr0(q.a)}, λ = ${N(q.lam,1)}, α = ${N(q.alpha,2)} ; A ≥ max(${N(q.Areq,2)} ; Amin ${N(q.Amin,2)}) = ${N(q.need,2)} cm² → ${q.arm} = ${N(q.A,2)} cm² ; cadres HA${q.cd} tous les ${N(q.ce,1)} cm`)})}
  else{armFil(Dq('potArm',''),FD('potNb','pot_n'),dp,nbPot*(H*nN+0.6),`poteaux ${pB}×${pB} (${nbPot})`);cad(FD('potCd','pot_cd'),FD('potCe','pot_ce')/100,nbPot*H*nN,pB/100,pB/100,'poteaux',nbPot*nN)}
  PLR('ch',{b:0.2,h:cHx,bars:et?[[3,et>1?14:12,'inf'],[2,10,'sup']]:[[2,10,'inf'],[2,10,'sup']],cd:6,ce:(et?R.potCad:R.chainCad)/100,et,L:LwT-Lct});if(Lct)PLR('chT',{b:0.2,h:cHc/100,bars:[[2,10,'inf'],[2,10,'sup']],cd:6,ce:R.chainCad/100,et:0,L:Lct,toit:1});
  if(et){const db=et>1?14:12,Lpo=LwT-Lct;fil(3,db,Lpo,`poutres d'étage 20×${cHp} (aciers inférieurs)`);fil(2,10,Lpo,'poutres d\'étage (aciers supérieurs)');cad(6,R.potCad/100,Lpo,0.2,cHp/100,'poutres d\'étage');if(Lct){fil(4,10,Lct,`chaînage de toiture 20×${cHc} (sous charpente)`);cad(6,R.chainCad/100,Lct,0.2,cHc/100,'chaînage de toiture')}}
  else{fil(4,10,Lw,`chaînage haut 20×${cHc}`);cad(6,R.chainCad/100,Lw,0.2,cHc/100,'chaînage haut')}
  PLR('lin',{b:lB,h:lH,app:lA/2,list:O.map(x=>({lab:x.label,L:x.L,H:x.H,Q:x.Q}))});
  O.forEach(x=>{const big=x.L>1.5,ml=(x.L+lA)*x.Q;fil(2,big?12:10,ml,'linteaux '+lc(x.label)+' (inférieurs)');fil(2,big?10:8,ml,'linteaux '+lc(x.label)+' (supérieurs)');cad(6,0.2,ml,lB,lH,'linteaux '+lc(x.label))});
  ferFin();coff(nbPot*0.8*H*nN+Lw*0.7*nN+Vl*13);
  W('mo-maconnerie',Sm);W('mo-ba',Vp+Vc+Vl);

  const Sx=num(p.dalleExtra),dT=p.dalle==='aucune'?'pleine':p.dalle,SdTot=(p.dalle==='aucune'?0:A*nD)+Sx;
  if(SdTot>0){
    lot(et?'Planchers, dalles & escalier':ter?'Dalle de toiture-terrasse':'Dalle (terrasse, auvent)','Essais d\'écrasement du béton recommandés ; décoffrage des dalles pas avant 21 à 28 jours.');
    const dEp=Dq('dalleEp',R.dallePl),Sd=SdTot,SdM=SdTot-Sx;let Vsl=0;
    const slab=(Sd,t,o)=>{if(!(Sd>0))return;if(!o.lab)PLR('dal',{t,Sd,...o,dch:t==='pleine'?0:1});if(t==='pleine'){const dEp=o.ep,de=o.esp/100,dd=String(o.dd);beton(Sd*dEp/100,R.dosBA,true,`${o.lab}dalle pleine ${N(Sd)} m² × ${N(dEp)} cm`);M('fer-'+dd,Sd*(2/de)*rc/R.lBarre,`dalle pleine : nappe inférieure HA${dd} tous les ${N(de*100)} cm dans les 2 sens`);M('fer-'+dd,Sd*0.35*(1/de)*rc/R.lBarre,`dalle pleine : chapeaux sur appuis HA${dd}`);kgF+=Sd*(2/de)*1.175*rc*BARW[dd];M('bo-cp15',Math.ceil(Sd/2.98/R.coffReemploi*1.1),`coffrage, ${R.coffReemploi} réemplois`);Vsl+=Sd*dEp/100}
      else if(t==='coulees'){const pb=o.pb/100,ph=o.ph/100,pe=o.ent/100,ec=o.ec/100,mlP=Sd/pe,nh=Sd/(pe*0.2)*(1+R.casse/100);
      mtp(cur,{k:'x',d:o.lab+'plancher à poutrelles coulées sur place',steps:[`Poutrelles : ${N(Sd)} m² ÷ ${N(pe)} m d'entraxe = ${N(mlP,1)} ml`,`Hourdis : ${N(Sd)} m² ÷ (${N(pe)} × 0,20 m) = ${N(Sd/(pe*0.2),0)} + ${R.casse} % de casse = ${N(Math.ceil(nh),0)} hourdis`,`Dalle de compression : ${N(Sd)} m² × ${N(ec)} m = ${N(Sd*ec,2)} m³`]});
      M(o.hour,nh,`${N(Sd)} m² ÷ (${N(pe)} × 0,20 m) + ${R.casse} % de casse`);beton(mlP*pb*ph,R.dosBA,true,`${o.lab}poutrelles coulées ${N(mlP,1)} ml × ${N(pb)} × ${N(ph)} m`);beton(Sd*ec,R.dosBA,true,`${o.lab}dalle de compression ${N(Sd)} m² × ${N(ec)} m`);
      fil(2,12,mlP,'poutrelles (aciers inférieurs)');fil(1,10,mlP,'poutrelles (acier inférieur)');fil(1,8,mlP,'poutrelles (acier supérieur)');cad(6,0.2,mlP,pb,ph,'poutrelles',Math.max(1,Math.round(mlP/Math.max(1,Math.sqrt(Sd)))));
      if(o.tab==='treillis')M('fer-treillis',Math.ceil(Sd*1.1/13),'table de compression');else{M('fer-6',Sd*12*rc/R.lBarre,`quadrillage de la dalle de compression : ${N(Sd)} m² × 12 ml/m²`);kgF+=Sd*12*rc*BARW[6]}
      M('fer-10',Sd*1*rc/R.lBarre,'chapeaux sur appuis HA10');kgF+=Sd*rc*0.617;coff(mlP*(pb+0.1));Vsl+=Sd*ec+mlP*pb*ph}
      else{M(o.hour,Sd*8.3);M('pp-poutrelle',Sd*1.7);beton(Sd*0.085,R.dosBA,true,`${o.lab}dalle à corps creux ${N(Sd)} m² × 0,085 m³/m²`);M('fer-treillis',Math.ceil(Sd*1.1/13),'table de compression');M('fer-10',Sd*2.2*rc/R.lBarre,'dalle : chapeaux et chaînages HA10');kgF+=Sd*2.2*rc*0.617;Vsl+=Sd*0.085}};
    slab(SdM,dT,{lab:'',ep:dEp,esp:Dq('dalleEsp',R.dalleEsp),dd:Dq('dalleD','10'),pb:Dq('pouB',15),ph:Dq('pouH',16),ent:Dq('pouEnt',60),ec:Dq('comprEp',5),hour:Dq('hourdisT','pp-hourdis'),tab:Dq('tableAc','fer6')});
    if(Sx>0){const xt=p.dxT||(p.dalle==='aucune'?'pleine':dT);slab(Sx,xt,{lab:'dalle en plus : ',ep:num(p.dxEp)||15,esp:num(p.dxEsp)||15,dd:num(p.dxD)||10,pb:num(p.dxPouB)||15,ph:num(p.dxPouH)||16,ent:num(p.dxEnt)||60,ec:num(p.dxCompr)||5,hour:p.dxHour||'pp-hourdis',tab:Dq('tableAc','fer6')});cur.note+=` Dalle en plus : ${N(Sx)} m² (${xt==='pleine'?'dalle pleine '+(num(p.dxEp)||15)+' cm':xt==='coulees'?'hourdis + poutrelles coulées':'hourdis + poutrelles préfabriquées'}).`}
    if(Dq('etaiType','piquets')==='piquets'){M('bo-piquet',Sd*Dq('piqM2',2),`${N(Sd)} m² × ${N(Dq('piqM2',2))} piquets/m²`);M('bo-latte5',Sd,'1 latte par m² (lisses)');M('bo-chevron88',Sd*0.8,'traverses sous coffrage')}else{M('bo-etai',Sd*Dq('etaiM2',0.8)*Dq('etaiMois',1),`${N(Dq('etaiM2',0.8))} étai/m² × ${N(Dq('etaiMois',1))} mois`);M('bo-chevron68',Sd*0.3)}
    let Vesc=0;if(et){const Hs=H+dEp/100,hv=Dq('escH',17)/100,nC=Math.round(Dq('escM',Math.ceil(Hs/hv-1e-9))),h=Hs/nC,g=Dq('escG',Math.min(32,Math.max(25,Math.round(63-2*h*100))))/100,bl=(2*h+g)*100,lg=Dq('escL',1),ty=Dq('escType',Dq('escPal','oui')!=='non'?'U':'droit');
      const vo=ty==='droit'?[nC]:[Math.ceil(nC/2),nC-Math.ceil(nC/2)],Lp=ty==='U'?2*lg+0.1:ty==='L'?lg:0,VV=vo.map(v=>{const rc=(v-1)*g,ht=v*h;return{v,rc,ht,inc:Math.sqrt(rc*rc+ht*ht)}}),port=Math.max(...VV.map(x=>x.rc))+(Lp?lg:0),e=Dq('escEp',Math.max(12,Math.ceil(port*100/30)))/100,dE=Dq('escD',12),eE=Dq('escE',15)/100;
      const Vpa=sum(VV,x=>lg*x.inc*e),Vma=sum(VV,x=>lg*(x.v-1)*h*g/2),Vpl=Lp?lg*Lp*e:0;Vesc=(Vpa+Vma+Vpl)*et;const ech=2+dEp/100,tre=Math.ceil(ech/h)*g;
      PLR('esc',{nC,h,g,bl,lg,ty,vo,VV,Lp,e,dE,eE,Hs,et,tre,dEp});
      beton(Vesc,R.dosBA,true,`escalier${et>1?` × ${et}`:''} : paillasses ${N(Vpa,2)} + marches ${N(Vma,2)} + palier ${N(Vpl,2)} m³`);
      mtp(cur,{k:'x',d:'Escalier – calcul des marches (formule de Blondel)',steps:[`Hauteur à monter : sous plafond ${N(H)} m + dalle ${N(dEp)} cm = ${N(Hs,2)} m`,`Contremarches : ${N(Hs,2)} m ÷ ${N(hv*100)} cm visés = ${nC} contremarches de ${N(h*100,1)} cm`,`Giron : 63 − 2 × ${N(h*100,1)} = ${N(g*100,1)} cm → Blondel 2h + g = ${N(bl,1)} cm ${bl>=60&&bl<=64?'✔ (60 à 64 cm)':'⚠ hors 60–64 cm'}`,
        `${ty==='droit'?'Escalier droit, 1 volée':ty==='L'?'Escalier en L (quart tournant), 2 volées + palier '+N(lg)+' × '+N(lg)+' m':'Escalier en U (demi-tournant), 2 volées + palier '+N(lg)+' × '+N(Lp)+' m'} : ${vo.map((v,i)=>`volée ${i+1} = ${v} contremarches, ${v-1} marches`).join(' ; ')} ; ${nC-vo.length} marches au total`,
        ...VV.map((x,i)=>`Volée ${i+1} : reculement ${x.v-1} × ${N(g*100,1)} cm = ${N(x.rc,2)} m ; hauteur ${x.v} × ${N(h*100,1)} = ${N(x.ht,2)} m ; paillasse inclinée √(${N(x.rc,2)}² + ${N(x.ht,2)}²) = ${N(x.inc,2)} m`),
        `Épaisseur de paillasse : portée ${N(port,2)} m ÷ 30 = ${N(e*100,0)} cm (12 cm minimum)`,`Paillasses : ${N(lg)} m × Σ inclinées × ${N(e,2)} m = ${N(Vpa,3)} m³ ; marches (triangles) : ${N(lg)} × ${nC-vo.length} × ${N(h,3)} × ${N(g,2)} ÷ 2 = ${N(Vma,3)} m³${Vpl?` ; palier ${N(lg)} × ${N(Lp)} × ${N(e,2)} = ${N(Vpl,3)} m³`:''}`,
        `Échappée 2 m sous la dalle → trémie d'au moins ${Math.ceil(ech/h)} marches × ${N(g*100,1)} cm = ${N(tre,2)} m de long sur ${N(lg)} m`]});
      const bars=(d,n,len,el,st)=>{const Lt=n*len*1.05;M('fer-'+d,Lt/R.lBarre,`escalier : ${el}`);kgF+=Lt*BARW[d];mtp(cur,{k:'x',kg:Lt*BARW[d],d:`Acier – escalier : ${el}`,steps:[...st,`${n} × ${N(len,2)} m × 1,05 = ${N(Lt,1)} m ÷ ${N(R.lBarre,1)} m = ${N(Lt/R.lBarre,1)} barres ; poids ${N(Lt*BARW[d],0)} kg`]})};
      const np=Math.floor((lg-0.05)/eE)+1;VV.forEach((x,i)=>{const nr=Math.ceil(x.inc/0.2)+1;
        bars(dE,np*et,x.inc+0.8,`volée ${i+1} aciers principaux HA${dE}`,[`(${N(lg)} m − 5 cm) ÷ ${N(eE*100)} cm + 1 = ${np} barres${et>1?` × ${et} escaliers`:''}, longueur ${N(x.inc,2)} m + 2 ancrages de 40 cm`]);
        bars(8,nr*et,lg-0.05,`volée ${i+1} répartition HA8`,[`${N(x.inc,2)} m ÷ 20 cm + 1 = ${nr} barres de ${N(lg-0.05,2)} m`]);
        bars(10,np*2*et,1.2,`volée ${i+1} chapeaux HA10 (haut et bas)`,[`${np} chapeaux × 2 extrémités, 1,20 m chacun`])});
      if(Lp){const n1=Math.ceil(Lp/0.15)+1,n2=Math.ceil(lg/0.15)+1;bars(10,(n1+n2)*et,Math.max(lg,Lp)*0.5+lg*0.5+0.3,`palier HA10 / 15 cm dans les 2 sens`,[`${n1} barres de ${N(lg+0.3,2)} m + ${n2} barres de ${N(Lp+0.3,2)} m`])}
      coff((sum(VV,x=>lg*x.inc+x.v*h*lg+2*x.inc*(e+h/2))+(Lp?lg*Lp:0))*et);W('mo-escalier',et);
      cur.note+=` Escalier : ${nC} contremarches de ${N(h*100,1)} cm et ${nC-vo.length} marches de ${N(g*100,1)} cm de giron (Blondel ${N(bl,1)} cm), ${ty==='droit'?'droit':ty==='L'?'en L avec palier':'en U avec palier'}, ${N(lg)} m de large, paillasse ${N(e*100,0)} cm, trémie ≥ ${N(tre,2)} m.`}
    ferFin();W('mo-ba',Vsl+Vesc);W('mo-essais-beton',1);
    if(Sx>0&&!ter){beton(Sx*0.06,R.dosForme,false,`forme de pente de la dalle en plus ${N(Sx)} m²`);M('et-primaire',Sx*0.3,'dalle en plus');M('et-membrane',Math.ceil(Sx*1.15*2/10),`étanchéité bicouche de la dalle en plus ${N(Sx)} m²`);M('et-crapaudine',Math.max(1,Math.ceil(Sx/40)),'dalle en plus');W('mo-etancheite',Sx*1.15,'dalle en plus')}
  }
  if(!ter){
    lot('Charpente, couverture & plafonds','Bois de charpente traité (insecticide + fongicide) ; isolant sous tôles contre la chaleur et la condensation.');
    const pans=String(Dq('pans','2')),pg=Dq('pente',30),kp=1/Math.cos(pg*Math.PI/180),db=Dq('debord',0.6),LL=L+2*db,ll=l+2*db,St=LL*ll*kp,fe=Dq('fermeEsp',1.5),pn=Dq('panneEsp',0.9),tole=Dq('tole','to-bac5');
    const TC={'1':{v:1,pi:0,ar:0,no:0},'2':{v:2,pi:2,ar:0,no:0},'4':{v:4,pi:0,ar:4,no:0},'4p1':{v:4,pi:1,ar:2,no:1},'perso':{v:Dq('tPans',4),pi:Dq('tPign',1),ar:Dq('tAret',2),no:Dq('tNoue',0)}}[pans]||{v:2,pi:2,ar:0,no:0},hipE=TC.ar/2;
    const nV=TC.v===1?1:2,ramp=(TC.v===1?ll:ll/2)*kp,nF=Math.ceil(LL/fe)+1,k4=1+0.15*hipE+0.1*TC.no,bast=Math.ceil(nF*(nV*ramp+ll)*1.05*k4/4),nPan=Math.ceil(ramp/pn)+1,chev=Math.ceil(nV*nPan*LL/4*1.1*(1+0.075*(TC.ar+TC.no)));
    const a1=Math.sqrt(2*(ll/2)**2+(ll/2*Math.tan(pg*Math.PI/180))**2),fait=TC.v===1?0:Math.max(0,LL-ll/2*hipE),tl=TOLES.find(t=>t[0]===tole)||TOLES[2];
    cur.note+=` Toit ${pans==='perso'?`personnalisé (${TC.v} pans, ${TC.pi} pignon${TC.pi>1?'s':''}, ${TC.ar} arêtier${TC.ar>1?'s':''}, ${TC.no} noue${TC.no>1?'s':''})`:pans==='4p1'?'4 pans + 1 pignon':pans+' pan'+(pans==='1'?'':'s')}, pente ${N(pg)}°, débords ${N(db*100)} cm : ${N(LL)} × ${N(ll)} m en plan × ${N(kp,3)} = ${N(St,1)} m² de couverture.`;
    M('bo-bastaing',bast,`${nF} fermes tous les ${N(fe)} m`);M('bo-chevron68',chev,`pannes tous les ${N(pn)} m (${nPan} par versant)`);M('bo-traitement',(bast+chev)*0.4);
    const kT=1.05+0.035*(TC.ar+TC.no);if(tl[2]==='f'){const su=tl[3]*(tl[4]-0.15);M(tole,St*kT/su,`${N(St,1)} m² + ${Math.round((kT-1)*100)} % ÷ ${N(su,2)} m² utiles par feuille (${N(tl[3])} m × (${N(tl[4])} − 0,15 m de recouvrement))`)}else M(tole,St*kT/tl[3],`${N(St,1)} m² + ${Math.round((kT-1)*100)} % ÷ ${N(tl[3])} m de largeur utile`);
    if(fait+TC.ar*a1>0)M('to-faitiere',fait+TC.ar*a1,`faîtage ${N(fait,1)} m${TC.ar?` + ${TC.ar} arêtier${TC.ar>1?'s':''} × ${N(a1,1)} m`:''}`);if(TC.no)M('to-noue',TC.no*a1,`${TC.no} noue${TC.no>1?'s':''} × ${N(a1,1)} m`);
    if(TC.v===1)M('to-rive',2*ramp+LL,'2 rives + rive haute');else if(TC.pi)M('to-rive',TC.pi*2*ramp,`rives de ${TC.pi} pignon${TC.pi>1?'s':''}`);
    M('to-tirefond',St*0.06);if(Dq('isol','oui')!=='non')M('to-isolant',St);
    if(Dq('gout','auto')!=='non')M('to-gouttiere',TC.v===1?LL:2*LL+ll*hipE,'bas de pente');
    {const nd=Dq('desc',pans==='1'?2:4+(TC.no?1:0));M('pl-e110',nd*(H*nN+0.5),`${nd} descentes d'eaux pluviales`);M('pl-c110',nd*2,'descentes EP')}
    const pf=Dq('plaf','bo-cp5');if(pf==='bo-lambris'){M('bo-lambris',A*1.08,'plafond lambris bois + 8 % de coupes');M('fer-pointes',A*0.05,'pointes de lambris')}else if(pf==='bo-cp5')M('bo-cp5',Math.ceil(A*1.1/2.98),'plafond');else if(pf==='to-ba13')M('to-ba13',Math.ceil(A*1.1/2.88),'plafond (plaque 1,2 × 2,4 m)');else if(pf!=='aucun'&&pf!=='bo-lambris')M(pf,A*1.05,'plafond');
    if(pf!=='aucun'&&pf!=='to-staff'){M('bo-chevron46',Math.ceil(A*2.5/4),'ossature du plafond');if(pf==='bo-cp5')M('bo-latte',Math.ceil(A*1.2/4),'couvre-joints')}
    W('mo-charpente',St);if(pf!=='aucun')W('mo-plafond',A);
  }else{
    lot('Étanchéité de la toiture-terrasse','Forme de pente ≥ 1,5 %, étanchéité bicouche relevée sur l\'acrotère, essai de mise en eau 48 h avant réception.');
    const nEP=Math.max(2,Math.ceil(A/Dq('naiss',60))),aH=Dq('acroH',0.8),fEp=Dq('formeEp',6)/100,nC=Dq('etanch','bi')==='mono'?1:2,pEp=Dq('protEp',4)/100;
    parp('pp-15c',P*aH,'acrotère',[`${N(P,1)} ml × ${N(aH)} m = ${N(P*aH,2)} m²`]);beton(P*0.15*0.1,R.dosBA,true,'chaînage d\'acrotère');fil(4,8,P,'chaînage d\'acrotère');cad(6,0.25,P,0.15,0.1,'chaînage d\'acrotère');ferFin();
    beton(A*fEp,R.dosForme,false,`forme de pente ${N(fEp*100)} cm`);M('et-primaire',A*0.3);M('et-membrane',Math.ceil((A*1.15+P*0.3)*nC/10),`${nC===2?'bicouche':'monocouche'} + relevés`);mortier(A*pEp,R.dosChape,`chape de protection ${N(pEp*100)} cm`);
    M('et-crapaudine',nEP);M('pl-e110',nEP*(H*nN+0.5),'descentes EP');M('pl-c110',nEP*2);
    W('mo-maconnerie',P*aH,'acrotère');W('mo-beton',A*fEp,'forme de pente');W('mo-etancheite',A*1.15+P*0.3);W('mo-chape',A,'protection de l\'étanchéité');
  }

  lot('Plomberie, sanitaires & assainissement','Essai de pression des canalisations avant fermeture des saignées. Fosse septique enduite au mortier hydrofugé, ventilée, éloignée des puits.');
  const nWC=Dq('wc',sdb),nLav=Dq('lav',sdb),nDou=Dq('dou',sdb),nEv=Dq('evier',1),nRx=Dq('robExt',1),ceN=Dq('ceN',sdb),occ=Dq('occup',ch*2),ceL=occ*40/Math.max(1,ceN),CES=[[30,'pl-ce30'],[50,'pl-ce50'],[80,'pl-ce80'],[100,'pl-ce100'],[150,'pl-ce150'],[200,'pl-ce200']],ceR=Dq('ce','auto')==='auto'?(CES.find(c=>c[0]>=ceL)||CES[CES.length-1])[1]:Dq('ce','auto'),pts=nWC+nLav+nDou+nEv+nRx+(et?1:0);
  cur.note+=` ${pts} points d'eau : ${nWC} WC, ${nLav} lavabo(s), ${nDou} douche(s), ${nEv} évier(s), ${nRx} robinet(s) extérieur(s)${et?', 1 en étage':''}.`;
  M('pl-p32',Dq('compteur',20),'branchement depuis le compteur');M('pl-p25',pts*5+10*nN);M('pl-p20',pts*3);if(ceR!=='0')M('pl-ppr20',(nDou+nLav)*5+6,'eau chaude');
  M('pl-c25',pts*3);M('pl-c20',pts*2);M('pl-t25',pts);M('pl-m25',pts*2);M('pl-v12',pts,'robinet d\'arrêt sous chaque appareil');M('pl-flex',pts);
  M('pl-e110',12+sdb*5+nN*H,'WC, chutes, collecteur');M('pl-e50',pts*2.5);M('pl-e40',pts*1.5);M('pl-c110',sdb*3+4);M('pl-y110',sdb+2);M('pl-c50',pts*2);M('pl-col110',nN*H*2+6);
  M('pl-siphon',nDou+nEv);M('pl-colle',Math.ceil(pts/5));M('pl-teflon',Math.ceil(pts/2));
  M('pl-bidet',Dq('bidet',0));M('pl-access',Dq('accSdb',nWC),'porte-savon, porte-serviette, porte-papier, glace');M('pl-wc',nWC);M('pl-lavabo',nLav);M('pl-rob-lav',nLav);M('pl-douche',nDou);M('pl-receveur',nDou);M('pl-evier',nEv);M('pl-rob-ev',nEv+nRx);if(ceR!=='0')M(ceR,ceN,`${occ} occupants × 40 L = ${occ*40} L d'eau chaude ÷ ${ceN} ballon${ceN>1?'s':''} = ${N(ceL,0)} L par ballon`);
  {const ci=Dq('citerne',et?'pl-cit2000':'pl-cit1000'),su=Dq('surpr','auto');if(ci!=='0')M(ci,1,'réserve d\'eau');if(su==='oui'||(su==='auto'&&et))M('pl-surpresseur',1)}
  {const nD=Math.max(1,nDou),dR=Dq('douRacc','sep'),rpd=Dq('regDou',3),dF=Dq('distFos',Math.round((L+l)/2+3)),nR=dR==='sep'?nD*rpd:rpd+nD,mlC=dR==='sep'?nD*dF:dF+nD*3,cit=Dq('citerne',et?'pl-cit2000':'pl-cit1000')!=='0',spr=Dq('surpr','auto'),sp=spr==='oui'||(spr==='auto'&&et);
   PLR('reg',{nR,dR,rpd,dF,nD});M('pl-regard',nR,dR==='sep'?`${nD} douche${nD>1?'s':''} × ${rpd} regards : chaque douche rejoint la fosse par son propre collecteur`:`${rpd} regards sur le collecteur commun + 1 regard de branchement par douche`);
   M('pl-e110',mlC,dR==='sep'?`collecteurs enterrés ${nD} × ${N(dF)} m douche → fosse, pente 2 %`:`collecteur commun ${N(dF)} m + ${nD} branchements de 3 m, pente 2 %`);
   M('pl-vg110',nD,'vanne à guillotine sur l\'évacuation de chaque douche (isoler pour la maintenance)');W('mo-fouilles',mlC*0.4*0.6,'tranchées des collecteurs d\'assainissement');
   const dN=RM.filter(r=>r.type==='douche').map(r=>({n:r.nom,v:num(r.niv)}));while(dN.length<nD)dN.push({n:'Douche '+(dN.length+1),v:0});
   const dC=Dq('distCol',Math.round((L+l)/4)),cols=dN.slice(0,nD).map(x=>({...x,m:dC+x.v*(H+0.2)+1})),mlCol=sum(cols,x=>x.m),nV=1+(cit?1:0)+(sp?1:0)+(ceR!=='0'?ceN:0);
   M('pl-p25',mlCol,`${nD} colonne${nD>1?'s':''} de distribution (une par douche)`);M('pl-t25',nD,'piquages des colonnes');M('pl-vcol',nD,'vanne d\'arrêt en pied de chaque colonne de douche');
   M('pl-v34',nV,`arrivées principales : compteur${cit?', sortie de la réserve':''}${sp?', surpresseur':''}${ceR!=='0'?`, entrée de ${ceN} chauffe-eau`:''}`);
   cur.note+=` Assainissement : ${dR==='sep'?`chaque douche rejoint la fosse séparément avec ${rpd} regards`:`douches regroupées sur un collecteur commun`} (${nR} regards) ; vanne à guillotine sur chaque évacuation ; 1 colonne d'eau avec vanne d'arrêt par douche ; ${nV} vanne${nV>1?'s':''} d'arrêt aux arrivées principales.`;
   mtp(cur,{k:'x',d:'Assainissement des douches et distribution d\'eau',steps:[dR==='sep'?`Regards : ${nD} douche${nD>1?'s':''} × ${rpd} regards = ${nR} regards (un regard tous les ${N(dF/rpd,1)} m environ)`:`Regards : ${rpd} sur le collecteur + ${nD} de branchement = ${nR}`,
    dR==='sep'?`Collecteurs PVC Ø110 : ${nD} × ${N(dF)} m = ${N(mlC,1)} m ; tranchées ${N(mlC,1)} × 0,40 × 0,60 m = ${N(mlC*0.24,2)} m³`:`Collecteur PVC Ø110 : ${N(dF)} m + ${nD} × 3 m = ${N(mlC,1)} m ; tranchées ${N(mlC*0.24,2)} m³`,
    ...cols.map(x=>`Colonne ${x.n} : ${N(dC)} m depuis l'arrivée${x.v?` + ${x.v} niveau${x.v>1?'x':''} × ${N(H+0.2)} m`:''} + 1 m de raccordement = ${N(x.m,1)} m de PVC Ø25, 1 vanne d'arrêt`),
    `Vannes d'arrêt principales : ${nV} ; vannes de colonne : ${nD} ; vannes à guillotine Ø110 : ${nD}`]})}
  {const pp=ch+1,Vf=Dq('fosse',R.fosseBase+Math.max(0,pp-5)*R.fosseSup),nC=+Dq('fosseComp',3)===2?2:3,hw=Dq('fosseH',1.2),lf=Dq('fosseLarg',Math.max(0.9,Math.round(Math.sqrt(Vf/(hw*2.5))*20)/20)),Lf=Dq('fosseLong',Math.round(Vf/(lf*hw)*20)/20),hT=hw+0.4;
   const prop=nC===3?[1/2,1/4,1/4]:[2/3,1/3],cL=prop.map(x=>Math.round(Lf*x*100)/100),mw=Dq('fosseMur','pp-20p'),bour=mw.endsWith('#b'),mref=mw.replace('#b',''),ep=ppDims(mref).ep/100;
   const SwE=(2*(Lf+lf)+4*ep)*hT,SwC=(nC-1)*lf*hT,Sw=SwE+SwC,Si=2*(Lf+lf)*hT+(nC-1)*2*lf*hT+Lf*lf,Ax=Lf+2*ep,Bx=lf+2*ep,puis=Dq('puisard','oui')!=='non';
   const nf=`fosse septique ${nC} compartiments, ${N(Vf)} m³ utiles : ${N(Lf)} × ${N(lf)} m × ${N(hw)} m d'eau (${cL.map((c,i)=>`${['décantation','digestion','clarification'][nC===3?i:i*2]||'compartiment'} ${N(c)} m`).join(' + ')})`;
   cur.note+=` Fosse septique à ${nC} compartiments (${nC===3?'décantation, digestion, clarification':'décantation, clarification'}) : ${N(Lf)} × ${N(lf)} m intérieur, ${N(hw)} m d'eau, ${N(Vf)} m³, ventilée au-dessus du toit, ${nC} tampons de visite.`;
   mtp(cur,{k:'x',d:'Fosse septique',steps:[`Volume utile : ${N(Vf)} m³ (${pp} pièces principales)`,`Largeur ${N(lf)} m × hauteur d'eau ${N(hw)} m → longueur = ${N(Vf)} ÷ (${N(lf)} × ${N(hw)}) = ${N(Lf)} m`,`Compartiments : ${cL.map(c=>N(c)+' m').join(' + ')} (${nC===3?'1/2 + 1/4 + 1/4':'2/3 + 1/3'})`,`Murs : pourtour (2 × (${N(Lf)} + ${N(lf)}) + 4 × ${N(ep)}) × ${N(hT)} m = ${N(SwE,2)} m² + ${nC-1} cloison${nC>2?'s':''} × ${N(lf)} × ${N(hT)} = ${N(SwC,2)} m²`,`Radier ${N(Ax+0.4)} × ${N(Bx+0.4)} × 0,15 m ; dalle ${N(Ax)} × ${N(Bx)} × 0,12 m avec ${nC} trappes`,`Enduit étanche : ${N(Si,2)} m² × 2 cm`]});
   const pc=parp(mref,Sw,'murs et cloisons de la fosse'+(bour?' (bourrés)':''),[nf]);if(bour){const vb=Sw*ep*((R.videPp||40)/100);beton(vb,250,false,`bourrage des murs de fosse ${N(Sw)} m² × ${N(ep)} m × ${R.videPp||40} %`)}
   const Vr=(Ax+0.4)*(Bx+0.4)*0.15,Vc=Ax*Bx*0.12;beton(Vr+Vc,R.dosBA,true,`radier (${N(Ax+0.4)} × ${N(Bx+0.4)} × 0,15) et dalle (${N(Ax)} × ${N(Bx)} × 0,12) de la fosse`);
   trv(10,0.15,Ax+0.4,Bx+0.4,'radier de fosse (sens 1)');trv(10,0.15,Bx+0.4,Ax+0.4,'radier de fosse (sens 2)');trv(10,0.15,Ax,Bx,'dalle de fosse (sens 1)');trv(10,0.15,Bx,Ax,'dalle de fosse (sens 2)');
   const Vh=Si*0.02;mortier(Vh,R.dosArase,`enduit étanche intérieur de la fosse ${N(Si)} m² × 2 cm`);M('et-hydrofuge',Math.ceil(Vh*R.dosArase/50*R.hydro),'enduit intérieur étanche de la fosse');
   M('pl-teplong',2+(nC-1),`entrée + sortie + ${nC-1} passage${nC>2?'s':''} entre compartiments`);M('pl-tampon',nC,'un tampon de visite par compartiment (vidange)');M('pl-e110',H*nN+2,'ventilation de la fosse jusqu\'au-dessus du toit');M('pl-chapeau',1,'ventilation de la fosse');
   const hp=Math.max(1.5,Vf/2.25),Sp=4*1.5*hp;PLR('fos',{nC,Vf,Lf,lf,hw,hT,cL,ep,Ax,Bx,mref,bour,puis,hp});if(puis){parp('pp-20p',Sp,'puisard (joints ouverts)',[`4 côtés × 1,5 m × ${N(hp,1)} m = ${N(Sp,2)} m²`]);M('gr-moellons',2.25*hp*0.5,'remplissage drainant du puisard');beton(2.25*0.12,R.dosBA,true,'dalle du puisard');trv(10,0.15,1.9,1.9*2,'dalle du puisard')}
   W('mo-fouilles',(Ax+0.8)*(Bx+0.8)*(hT+0.35)+(puis?2.25*hp*1.3:0),puis?'fouilles fosse et puisard':'fouilles de la fosse');ferFin()}
  M('pl-camwater',1);
  W('mo-plomb-point',pts);W('mo-fosse',1);

  lot('Électricité (NF C 15-100)','Mise à la terre obligatoire, différentiels 30 mA, sections de câbles adaptées à chaque circuit, parafoudre. Contrôle de l\'installation avant mise sous tension.');
  if(RM.length){elecMetre()}else{
  const pcs=ch+3+sdb+et,pl=Dq('lum',pcs+nN*2+4),pr=Dq('prises',ch*4+12+sdb+nN*2),it=Dq('inter',pcs+nN*2),ncl=Dq('clim',ch),tri=p.branchement==='tri';
  cur.note+=` ${pl} points lumineux, ${pr} prises, ${it} interrupteurs, ${ncl} circuit(s) de climatiseur.`;
  const g16=pl*6+it*4,g20=pr*7+ncl*12;
  M('el-f15',g16*3);M('el-f25',pr*7*3);M('el-f4',ncl*12*3,'climatiseurs');M('el-f6',2*15*3,'cuisson, chauffe-eau');M('el-f10',25*(tri?5:3),'alimentation du tableau');M(tri?'el-alu4':'el-alu2',Dq('compD',30),'branchement depuis le compteur ENEO');
  M('el-g16',g16);M('el-g20',g20);M('el-g25',30);M('el-boite',pl+pr+it);M('el-derivation',pcs+2);
  M('el-inter',Math.max(0,it-nN*2));M('el-vv',nN*2);M('el-prise',pr);M('el-prise32',1);M('el-tv',Dq('tv',ch+1));
  const nd=Math.ceil(pl/8)+Math.ceil(pr/8)+ncl+3;M(nd>18?'el-tab3':'el-tab2',1);
  M('el-d10',Math.ceil(pl/8));M('el-d16',Math.ceil(pr/8));M('el-d20',ncl+1,'climatiseurs, chauffe-eau');M('el-d32',1,'cuisson');M(tri?'el-diff4':'el-diff2',2);M(tri?'el-dg4':'el-dg2',1);M('el-parafoudre',1);
  M('el-piquet',2);M('el-sel',2,'prise de terre');M('el-terre',25);M('el-barrette',1);M('el-applique-sdb',sdb);M('el-applique',Dq('appl',0));M('el-sonnerie',1);M('el-interphone',Dq('interph',0));M('el-tel',Dq('telP',0));M('el-reglette',pcs);M('el-hublot',4+nN);M(tri?'el-eneo3':'el-eneo1',1);
  W('mo-elec-point',pl+pr+it);}

  function elecMetre(){
   const rho=0.0225,hd=Math.max(1.2,H-1.2),kP=1+Dq('pertCab',10)/100,va=Dq('vaPL',100),tri=p.branchement==='tri';
   const d0=Dq('dTab',Math.round((L+l)/3)),dE=Dq('dTabE',H+3),dT=n=>d0+n*dE;
   const SEC=[1.5,2.5,4,6,10],FA={1.5:'el-f15',2.5:'el-f25',4:'el-f4',6:'el-f6',10:'el-f10'},R2={1.5:'el-r2v15',2.5:'el-r2v',4:'el-r2v4',6:'el-r2v6',10:'el-r2v6'};
   const duP=(Lx,I,sx)=>2*rho*Lx*I/sx/230*100,pick=(Lx,I,lim,s0)=>SEC.find(x=>x>=s0&&duP(Lx,I,x)<=lim)||10;
   const F={},G={16:0,20:0,25:0},n2=x=>N(x,2),n1=x=>N(x,1),fil=(sx,m)=>F[sx]=(F[sx]||0)+m;
   const v=(x,d)=>x===''||x==null||x==='auto'?d:num(x);
   const PCS=RM.map(r=>({...r}));for(let i=1;i<=et;i++)PCS.push({type:'escalier',L:4,l:1.2,niv:i-1,S:4.8,per:10.4,nom:`Cage d'escalier ${NIVL(i-1)} → ${NIVL(i)}`});
   let nS=0,nD=0,nV=0,nT=0,nPo=0,nPL=0,nPR=0,nDer=0,lum={},cnt=0;const lu=(k,q)=>lum[k]=(lum[k]||0)+q;
   const PE=PCS.map(r=>{const Lr=num(r.L),lr=num(r.l),df=elecDef(r.type,Lr,lr),pl=v(r.pl,df.pl),pr=v(r.pr,df.pr),cl=v(r.cl,df.cl);let al=!r.al||r.al==='auto'?df.al:r.al;if(al==='double'&&pl<2)al='simple';
    const Lm=Math.max(Lr,lr),q=r.per/4,st=[];let gl=0,fl=0;
    if(pl>0){const lk=(pl-1)*Lm/pl;gl=q+lk+hd;fl=gl*3;st.push(`¼ périmètre ${n2(q)} m${pl>1?` + ${pl-1} liaison${pl>2?'s':''} entre points ${n2(lk)} m`:''} + descente interrupteur ${n2(hd)} m = ${n2(gl)} m × 3 fils = ${n2(fl)} m`);
     if(al==='double'){fl+=hd;st.push(`double allumage : + 1 fil de retour dans la descente ${n2(hd)} m`);nD++}
     else if(al==='vv'){const x=r.type==='escalier'?H+1:0.75*Lm+hd;gl+=x;fl+=x*3;st.push(`va-et-vient : vers le 2ᵉ interrupteur ${n2(x)} m × 3 fils (2 navettes + retour) = ${n2(x*3)} m`);nV+=2}
     else if(al==='tele'){const x=2*(Lm/2+hd);gl+=x;fl+=x*2;st.push(`télérupteur : 2 poussoirs de plus, ${n2(x)} m × 2 fils = ${n2(x*2)} m`);nT++;nPo+=3}
     else nS++;
     nPL+=pl;nDer+=1+(pl-1);
     if(r.type==='douche'){lu('el-hublot',pl-1);lu('el-applique-sdb',1)}else if(r.type==='veranda')lu('el-hublot',pl);else lu('el-reglette',pl)}
    const gp=pr>0?(H-0.3)+r.per*(pr-1)/pr:0;if(pr>0)st.push(pr>1?`prises : descente ${n2(H-0.3)} m + ${pr-1} liaison${pr>2?'s':''} le long des murs ${n2(r.per*(pr-1)/pr)} m = ${n2(gp)} m × 3 fils = ${n2(gp*3)} m`:`prises : descente ${n2(gp)} m × 3 fils = ${n2(gp*3)} m`);nPR+=pr;
    return{r,pl,pr,cl,al,Lm,q,gl,fl,gp,fp:gp*3,lk:Math.sqrt(r.S),st}});
   const CI=[],grp=(t,key,max)=>{for(let nv=0;nv<nN;nv++){let c=null;PE.filter(e=>num(e.r.niv)===nv&&e[key]>0).forEach(e=>{if(!c||c.n+e[key]>max){c={t,nv,P:[],n:0,home:dT(nv),lk:0,gi:0,fi:0,far:0};CI.push(c)}else c.lk+=e.lk;
     c.P.push(e);c.n+=e[key];c.gi+=t==='L'?e.gl:e.gp;c.fi+=t==='L'?e.fl:e.fp;c.far=Math.max(c.far,c.home+c.lk+(t==='L'?e.q+e.Lm:e.r.per/2))})}};
   grp('L','pl',8);grp('P','pr',Dq('maxPr',8));
   const notes=[];let iL=0,iP=0,dJ={10:0,16:0,20:0,32:0};
   CI.forEach(c=>{const L_=c.t==='L',I=L_?c.n*va/230:16,s0=L_?1.5:2.5,lim=L_?3:5,sx=pick(c.far,I,lim,s0),du=duP(c.far,I,sx),gh=c.home+c.lk,fT=(gh*3+c.fi)*kP,gT=gh+c.gi;
    fil(sx,fT);G[L_?16:20]+=gT;dJ[L_?10:16]++;const id=L_?'E'+(++iL):'P'+(++iP);
    mtp(cur,{k:'x',d:`Circuit ${id} – ${L_?'éclairage':'prises 16 A'} ${NIVL(c.nv)} (${c.n} ${L_?'point'+(c.n>1?'s':''):'prise'+(c.n>1?'s':'')} / ${L_?8:Dq('maxPr',8)} max)`,steps:[...c.P.map(e=>`${e.r.nom}${L_?' ('+e.pl+' point'+(e.pl>1?'s':'')+', '+ALLUML[e.al]+')':' ('+e.pr+' prise'+(e.pr>1?'s':'')+')'} : `+(L_?e.st.filter(x=>!x.startsWith('prises')).join(' ; '):e.st.filter(x=>x.startsWith('prises')).join(' ; '))),
     `Tableau → ${NIVL(c.nv)} ${n2(c.home)} m${c.lk?` + liaisons entre pièces ${n2(c.lk)} m`:''} = ${n2(gh)} m × 3 fils = ${n2(gh*3)} m`,
     `Total : gaine ICTA Ø${L_?16:20} ${n1(gT)} m ; fil ${N(sx)} mm² (${n1(gh*3+c.fi)} m + ${N((kP-1)*100,0)} % chutes) = ${n1(fT)} m`,
     `Chute de tension au point le plus loin (${n1(c.far)} m) : 2 × 0,0225 × ${n1(c.far)} × ${n2(I)} A ÷ ${N(sx)} mm² = ${n2(du*2.3)} V = ${n2(du)} % ${du<=lim?'≤ '+lim+' % ✔':'⚠ > '+lim+' %'}${sx>s0?` (section portée à ${N(sx)} mm²)`:''}`]});
    notes.push(`${id} ${NIVL(c.nv)} ${c.n}${L_?' pts':' pr.'} ${N(sx)} mm² ΔU ${N(du,1)} %`)});
   // circuits spécialisés
   const spec=(lab,nv,lk,In,s0,lim,extra,dj)=>{const Lx=dT(nv)+lk+extra,sx=pick(Lx,In,lim,s0),du=duP(Lx,In,sx);fil(sx,Lx*3*kP);G[sx>=6?25:20]+=Lx;dJ[dj]++;
     mtp(cur,{k:'x',d:`Circuit spécialisé – ${lab}`,steps:[`Tableau → ${NIVL(nv)} ${n2(dT(nv))} m + dans le logement ${n2(lk+extra)} m = ${n2(Lx)} m de gaine Ø${sx>=6?25:20}`,`Fil ${N(sx)} mm² : ${n2(Lx)} m × 3 fils + ${N((kP-1)*100,0)} % = ${n1(Lx*3*kP)} m ; disjoncteur ${dj} A`,`Chute de tension : 2 × 0,0225 × ${n1(Lx)} × ${In} A ÷ ${N(sx)} = ${n2(du)} % ${du<=lim?'≤ '+lim+' % ✔':'⚠'}`]});notes.push(`${lab} ${N(sx)} mm²`)};
   let nCl=0;PE.forEach(e=>{for(let i=0;i<e.cl;i++){nCl++;spec(`climatiseur ${e.r.nom}`,num(e.r.niv),e.lk,20,2.5,5,1,20)}});
   const cui=PE.find(e=>e.r.type==='cuisine');if(cui)spec('cuisson (cuisinière / plaques)',num(cui.r.niv),cui.lk,32,6,5,1,32);
   const nce=Math.max(0,typeof ceN==='number'?ceN:0),dch=PE.filter(e=>e.r.type==='douche');for(let i=0;i<nce;i++){const e=dch[i%Math.max(1,dch.length)];spec(`chauffe-eau ${e?e.r.nom:''}`,e?num(e.r.niv):0,e?e.lk:3,16,2.5,5,2,20)}
   // éclairage extérieur (façades)
   const nX=Dq('extPL',Math.max(4,Math.ceil(P/8))),xT=Dq('extType','el-hublot'),xC=Dq('extCmd','crepu'),xW=Dq('extW',30);
   if(nX>0){const gx=d0+P*(nX-1)/nX+nX*0.5,I=nX*xW/230,sx=pick(d0+P/2,I,3,1.5),du=duP(d0+P/2,I,sx);lu(xT,nX);fil(sx,gx*3*kP);G[16]+=gx;dJ[10]++;nDer+=nX;nPL+=nX;
    if(xC==='inter')nS++;else if(xC==='crepu')lu('el-crepu',1);else lu('el-detect',Math.ceil(nX/2));
    mtp(cur,{k:'x',d:`Éclairage extérieur des façades (${nX} points, 1 tous les ${n1(P/nX)} m)`,steps:[`Tableau → façade ${n2(d0)} m + tour des façades ${n2(P)} m × ${nX-1}/${nX} = ${n2(P*(nX-1)/nX)} m + ${nX} × 0,5 m de remontée = ${n2(gx)} m de gaine Ø16`,`Fil ${N(sx)} mm² : ${n2(gx)} m × 3 fils + ${N((kP-1)*100,0)} % = ${n1(gx*3*kP)} m ; commande : ${({inter:'interrupteur à l\'entrée',crepu:'interrupteur crépusculaire au tableau',detect:'détecteurs de mouvement'})[xC]}`,`Chute de tension : ${nX} × ${xW} W ÷ 230 V = ${n2(I)} A ; 2 × 0,0225 × ${n1(d0+P/2)} m × ${n2(I)} A ÷ ${N(sx)} = ${n2(du)} % ${du<=3?'≤ 3 % ✔':'⚠'}`]});notes.push(`Façades ${nX} pts`)}
   // éclairage de la clôture
   const Lc=Dq('cloLML',Dq('cloML',0)),cT=Dq('cloLType','el-applique-ext');
   if(Lc>0&&cT!=='aucun'){const esp=Dq('cloLEsp',6),nC=Dq('cloPL',Math.ceil(Lc/esp)+Dq('cloPort',2)),cW=Dq('cloW',20);lu(cT,nC);nPL+=nC;
    if(cT==='el-solaire'){mtp(cur,{k:'x',d:`Éclairage de la clôture (${nC} lampes solaires)`,steps:[`${n1(Lc)} m ÷ ${n1(esp)} m + ${Dq('cloPort',2)} au portail = ${nC} lampes autonomes, sans câble`]})}
    else{const dC=Dq('cloDist',5),I=nC*cW/230,eq=d0+dC+Lc/8,sx=pick(eq,I,3,1.5),du=duP(eq,I,sx),gC=d0+Lc+nC*0.3;
     fil(sx,(d0+Lc+nC*0.3)*3*kP);G[20]+=d0+Lc+nC*0.3;lu(R2[sx],(dC+2)*kP);lu('el-tpc40',dC+1);lu('el-grillage',dC);lu('el-boite-et',nC+1);dJ[10]++;W('mo-fouilles',dC*0.3*0.6,'tranchée du câble de la clôture');
     const cC=Dq('cloCmd','crepu');if(cC==='crepu')lu('el-crepu',1);else if(cC==='horloge')lu('el-horloge',1);else nS++;
     mtp(cur,{k:'x',d:`Éclairage de la clôture (${n1(Lc)} m, ${nC} points)`,steps:[`${n1(Lc)} m ÷ ${n1(esp)} m = ${Math.ceil(Lc/esp)} points + ${Dq('cloPort',2)} au portail = ${nC} points`,
      `Tableau → sortie de façade ${n2(d0)} m (gaine Ø20) ; liaison enterrée maison → clôture ${n2(dC)} m + 2 m de remontées en câble U1000 R2V 3G${N(sx)} sous gaine TPC Ø40 à 50 cm de profondeur avec grillage avertisseur rouge`,
      `Le long de la clôture, alimentée au portail : ${n1(Lc)} m + ${nC} × 0,3 m de remontée = ${n1(Lc+nC*0.3)} m de gaine Ø20 dans le chaînage ; fil ${N(sx)} mm² : (${n2(d0)} + ${n1(Lc+nC*0.3)}) m × 3 fils + ${N((kP-1)*100,0)} % = ${n1((d0+Lc+nC*0.3)*3*kP)} m`,
      `Chute de tension : ${nC} × ${cW} W ÷ 230 V = ${n2(I)} A ; charge répartie sur 2 branches de ${n1(Lc/2)} m → longueur équivalente ${n2(d0)} + ${n2(dC)} + ${n1(Lc)}/8 = ${n1(eq)} m ; 2 × 0,0225 × ${n1(eq)} × ${n2(I)} ÷ ${N(sx)} = ${n2(du)} % ${du<=3?'≤ 3 % ✔':'⚠'}`,
      `Commande : ${({crepu:'interrupteur crépusculaire',horloge:'horloge programmable',inter:'interrupteur'})[cC]} ; ${nC+1} boîtes de dérivation étanches IP55`]});notes.push(`Clôture ${nC} pts ${N(sx)} mm²`)}}
   // totaux
   const nCirc=dJ[10]+dJ[16]+dJ[20]+dJ[32],nDiff=Math.max(2,Math.ceil(nCirc/8)),mod=nCirc+nDiff*2+2+2+(nT?nT:0);
   cur.note+=` Métré pièce par pièce (NF C 15-100) : ${nPL} points lumineux, ${nPR} prises 16 A, ${nCl} climatiseur${nCl>1?'s':''}, ${nCirc} circuits (${notes.join(' ; ')}). Tableau à ${nN>1?N(dE)+' m de plus par étage, ':''}${N(d0)} m du RDC.`;
   SEC.forEach(sx=>{if(F[sx])M(FA[sx],Math.ceil(F[sx]),`${N(sx)} mm² selon le métré des circuits`)});
   M('el-f10',25*(tri?5:3),'alimentation du tableau');M(tri?'el-alu4':'el-alu2',Dq('compD',30),'branchement depuis le compteur ENEO');
   M('el-g16',Math.ceil(G[16]));M('el-g20',Math.ceil(G[20]));M('el-g25',Math.ceil(G[25]+5));
   M('el-boite',nS+nD+nV+nPo+nPR+Dq('tv',ch+1));M('el-derivation',nDer+CI.length);
   M('el-inter',nS);M('el-inter-double',nD);M('el-vv',nV);M('el-telerupteur',nT);M('el-poussoir',nPo);M('el-prise',nPR);if(cui)M('el-prise32',1);M('el-tv',Dq('tv',ch+1));
   Object.entries(lum).forEach(([k,q])=>M(k,Math.ceil(q)));
   M(mod>39?'el-tab3':mod>26?'el-tab3':'el-tab2',mod>39?2:1,`${mod} modules`);
   M('el-d10',dJ[10]);M('el-d16',dJ[16]);M('el-d20',dJ[20]);M('el-d32',dJ[32]);M(tri?'el-diff4':'el-diff2',nDiff,`1 différentiel 30 mA pour 8 circuits au plus`);M(tri?'el-dg4':'el-dg2',1);M('el-parafoudre',1);
   M('el-piquet',2);M('el-sel',2,'prise de terre');M('el-terre',25);M('el-barrette',1);M('el-applique',Dq('appl',0));M('el-sonnerie',1);M('el-interphone',Dq('interph',0));M('el-tel',Dq('telP',0));M(tri?'el-eneo3':'el-eneo1',1);
   W('mo-elec-point',nPL+nPR+nS+nD+nV+nPo+nCl+(cui?1:0)+nce)}

  lot('Enduits intérieurs & extérieurs','Enduits extérieurs et pièces humides hydrofugés ; gobetis d\'accrochage avant enduit.');
  const SfaTot=sum(RM,r=>num(r.fh)>0?Math.max(0,r.per*num(r.fh)-0.8*Math.min(num(r.fh),2.1)):0);
  const Sint=Math.max(0,(RM.length?sum(RM,r=>r.per*H):(P+2*Pi)*H*nN)-(aExt+2*aInt)),Sext=Math.max(0,P*(H*nN+hS+(ter?0.8:0.3))-ouvExt),Spl=RM.length?sum(RM.filter(r=>num(r.niv)<et||ter),r=>r.S):A*nD;
  const pE=1+R.pertEnd/100,SplE=Dq('endPlaf','oui')!=='non'?Spl:0,SextE=Dq('endExt','oui')!=='non'?Sext:0;mortier((Sint+SplE)*R.epEndInt/100*pE,R.dosEndInt,`enduit intérieur ${N(Sint+SplE,0)} m² × ${N(R.epEndInt)} cm + ${R.pertEnd} %`,SE);if(SextE){mortier(SextE*R.epEndExt/100*pE,R.dosEndExt,`enduit extérieur ${N(SextE,0)} m² × ${N(R.epEndExt)} cm + ${R.pertEnd} %`,SE);M('et-hydrofuge',Math.ceil(SextE*R.epEndExt/100*pE*R.dosEndExt/50*R.hydro),'enduit extérieur hydrofugé')}
  W('mo-enduit',Sint+SextE+SplE);

  lot('Chapes, carrelage & faïence','Étanchéité liquide (SEL) sous carrelage des douches et salles d\'eau, relevée de 10 cm en pied de mur et 2 m dans la douche.');
  if(et&&RM.length)cur.note+=' Surfaces par niveau : '+Array.from({length:nN},(_,i)=>{const rr=RM.filter(r=>num(r.niv)===i);return `${i?'R+'+i:'RDC'} ${rr.length} pièce${rr.length>1?'s':''} = ${N(sum(rr,r=>r.S),1)} m²`}).join(' ; ')+'.';
  if(RM.length){const pC=1+R.pertCarr/100;let Sf=0,Sc=0,kgCol=0,Ssel=0;
   RM.forEach(r=>{Sf+=r.S;const c=CARREAUX.find(x=>x[0]===r.carreau)||CARREAUX[0],fh=num(r.fh);
    if(c[2]){const n=Math.ceil(r.S*pC/(c[3]*c[4]));M(c[2],n*c[3]*c[4],`${r.nom} : ${N(r.S)} m² + ${R.pertCarr} % = ${n} carreaux ${c[1]}`);Sc+=r.S;kgCol+=r.S*c[5]}
    if(fh>0){const f=FAIENCES.find(x=>x[0]===r.faience)||FAIENCES[0],Sfa=Math.max(0,r.per*fh-0.8*Math.min(fh,2.1)),n=Math.ceil(Sfa*pC/(f[3]*f[4]));M(f[2],n*f[3]*f[4],`${r.nom} : ${N(r.per)} m × ${N(fh)} m − porte = ${N(Sfa)} m², ${n} carreaux ${f[1]}`);Sc+=Sfa;kgCol+=Sfa*f[5]}
    else if(c[2]&&Dq('plinthes','oui')!=='non')M('rv-plinthe',Math.max(0,r.per-0.8)*pC,r.nom);
    if(HUMIDES.includes(r.type))Ssel+=r.S+r.per*Dq('selRel',10)/100+(r.type==='douche'?Dq('selDou',2):0)});
   mortier(Sf*R.epChape/100,R.dosChape,`chape ${N(Sf)} m² × ${N(R.epChape)} cm`,SC);
   if(Ssel)M('et-sel',Ssel*1.5,`${N(Ssel)} m² (sols humides + relevés de ${N(Dq('selRel',10))} cm + ${N(Dq('selDou',2))} m² de paroi par douche) × 1,5 kg/m²`);
   M('rv-colle',Math.ceil(kgCol/25),`${N(kgCol,0)} kg selon le format de chaque carreau`);M('rv-joint',Math.ceil(Sc*R.joint/5),`${N(Sc)} m² × ${N(R.joint)} kg/m²`);M('rv-croisillons',Math.ceil(Sc/10));if(Dq('seuils','oui')!=='non')M('rv-seuil',sum(O.filter(x=>x.cat!=='fen'),x=>x.L*x.Q),'largeur des portes');
   W('mo-chape',Sf);W('mo-carrelage',Sc);if(Ssel)W('mo-etancheite',Ssel,'SEL pièces humides')}
  else{  const pC=1+R.pertCarr/100,Sf=A*nN*0.9,Ssdb=sdb*5,Sfai=(sdb*14+6)*pC,Ssol=Math.max(0,Sf-Ssdb)*pC+et*12;
  mortier(Sf*R.epChape/100,R.dosChape,'',SC);M('et-sel',sdb*(5+6)*1.5,'pièces humides');
  M('rv-6060',Ssol);M('rv-antid',Ssdb*pC);M('rv-faience',Sfai);M('rv-plinthe',(P+2*Pi)*nN*0.8);
  const Sc=Ssol+Ssdb*pC+Sfai;M('rv-colle',Math.ceil(Sc*R.colle/25));M('rv-joint',Math.ceil(Sc*R.joint/5));M('rv-croisillons',Math.ceil(Sc/10));M('rv-seuil',sum(O.filter(x=>x.cat!=='fen'),x=>x.L*x.Q));
  W('mo-chape',Sf);W('mo-carrelage',Sc);W('mo-etancheite',sdb*11,'SEL pièces humides');}

  lot('Menuiseries, vitrerie & ferronnerie');
  O.forEach(x=>{const dim=`${x.Q} × ${N(x.L)} × ${N(x.H)} m`;const u=(art(x.ref)||{}).unite;M(x.ref,u==='m²'?x.L*x.H*x.Q:x.Q,lc(x.label)+(u==='m²'?' ('+dim+')':' ('+N(x.L)+' × '+N(x.H)+' m)'));if(x.gr)M(x.gr,x.L*x.H*x.Q,'protection '+lc(x.label))});{const g=Dq('gc',et?6*et+4:0);if(g>0)M('me-gardecorps',g,'escalier et balcon')}
  M('et-mastic',Math.ceil((pe+fe)/3),'joints menuiseries / maçonnerie');
  W('mo-menuiserie',pe+pi+fe*2);

  lot('Peinture & finitions','Impression avant finition ; peinture façade avec fongicide/algicide contre les moisissures (climat humide).');
  let Spi=RM.length?Math.max(0,Sint-SfaTot)+sum(RM,r=>r.S):Sint+(ter||et?Spl:0)+(!ter?A:0),Swet=RM.length?sum(RM.filter(r=>HUMIDES.includes(r.type)),r=>Math.max(0,r.per*(H-num(r.fh)))+r.S):sdb*30;
  const plafS=RM.length?sum(RM,r=>r.S):(ter||et?Spl:0)+(!ter?A:0);if(Dq('plafP','oui')==='non')Spi=Math.max(0,Spi-plafS);const SextP=Dq('facP','oui')!=='non'?Sext:0,gam=Dq('gamme','pe-acryl'),lis=Dq('liss',60);
  M('pe-impression',Math.ceil((Spi+SextP)/R.rendImp/25));if(lis>0)M('pe-lissage',Math.ceil(Sint*lis/100/25),`${N(lis)} % des murs intérieurs`);M(gam,Math.ceil(Math.max(0,Spi-Swet)*R.couches/R.rendInt/25),`${N(Math.max(0,Spi-Swet),0)} m² × ${R.couches} couches ÷ ${R.rendInt} m²/kg`);M('pe-satin',Math.ceil(Swet*R.couches/R.rendInt/20),`pièces humides ${N(Swet,0)} m² × ${R.couches} couches ÷ ${R.rendInt} m²/kg`);
  if(SextP)M('pe-facade',Math.ceil(SextP*R.couches/R.rendFac/25),`${N(SextP,0)} m² × ${R.couches} couches ÷ ${R.rendFac} m²/kg`);M('pe-glycero',Math.ceil(pi*0.8/4));M('pe-antirouille',Math.ceil((fe+pe)*0.5/4));
  M('pe-colorant',6+nN*2);M('pe-rouleau',4+nN*2);M('pe-pinceau',6);M('pe-diluant',5);
  W('mo-peinture',Spi+SextP);

  lot('Aménagements extérieurs & protection des pieds de murs','Trottoir périphérique en pente vers l\'extérieur pour éloigner les eaux pluviales des fondations.');
  {const tw=Dq('trotL',0.8),te=Dq('trotEp',8)/100,cv=Dq('caniv',P*0.5);if(tw>0){beton(P*tw*te+P*tw*0.1*0.5,R.dosTrot,false,`trottoir ${N(P,1)} ml × ${N(tw)} m × ${N(te*100)} cm + bordure`);M('gr-gravier-2540',P*tw*0.1,'sous trottoir');W('mo-dallage',P*tw,'trottoir périphérique')}
   if(cv>0){M('pl-e110',cv,'évacuation EP');M('pl-regard',Math.max(2,Math.ceil(cv/10)),'regards EP')}
   const cm=Dq('cloML',0),chh=Dq('cloH',2);if(cm>0){const Sc=cm*chh,np=Math.ceil(cm/3)+1;cur.note+=` Clôture ${N(cm)} m × ${N(chh)} m : poteaux 20×20 tous les 3 m, semelle filante 40×25, chaînage haut 15×15.`;
     parp('pp-15c',Sc,'clôture',[`${N(cm)} ml × ${N(chh)} m = ${N(Sc,2)} m²`]);W('mo-fouilles',cm*0.5*0.6,'semelle de clôture');
     beton(cm*0.4*0.25+np*0.04*(chh+0.6)+cm*0.15*0.15,R.dosBA,true,`semelle, ${np} poteaux et chaînage de clôture`);fil(4,10,cm,'semelle de clôture');fil(4,10,np*(chh+1.2)/1,'poteaux de clôture');fil(4,8,cm,'chaînage de clôture');cad(6,0.2,np*chh,0.2,0.2,'poteaux de clôture');ferFin();coff(np*0.8*chh+cm*0.3);
     W('mo-maconnerie',Sc,'clôture');W('mo-ba',cm*0.4*0.25+np*0.04*chh+cm*0.0225,'clôture')}}

  lot('Essais, nettoyage, réception & remise des clés','Réception contradictoire avec le client : PV avec ou sans réserves, levée des réserves, remise des clés, des plans de récolement et des notices.');
  if(Dq('essais','oui')!=='non')W('mo-essais',1);if(Dq('nett','oui')!=='non')W('mo-nettoyage',1);if(Dq('pv','oui')!=='non')W('mo-reception',1);

  lot('Petit outillage, matériel & eau de chantier','Quantités calculées à partir de l\'équipe, de la durée et des volumes de béton et de mortier du devis.');
  {const mac=num(p.macons),fc=num(p.ferrailleurs),man=num(p.manoeuvres),nb=Math.max(1,num(p.betonnieres)||1),rd=num(p.rendement)||12,eff=mac+fc+man+(cj>0?1:0),dur=['roche','argile'].includes(p.sol)?1.5:1;
   const n0=cur.lignes.length;
   const ce=Math.ceil,dd=dur>1?1+R.solDur/100:1;
   M('ou-pelle',ce(man*R.pelleMan+mac*R.pelleMac),`${man} manœuvres × ${N(R.pelleMan)} + ${mac} maçons × ${N(R.pelleMac)}`);M('ou-pioche',ce(man*R.piocheMan*dd),`${man} manœuvres × ${N(R.piocheMan)}${dd>1?' (+'+R.solDur+' % sol dur)':''}`);M('ou-beche',ce(man*R.becheMan),`${man} manœuvres × ${N(R.becheMan)}`);
   M('ou-brouette',Math.max(ce(man*R.brouMan),R.brouBet*nb),`le plus grand de : ${man} manœuvres × ${N(R.brouMan)}, ${R.brouBet} par bétonnière`);M('ou-seau',ce(R.seauMac*mac+R.seauMan*man),`${N(R.seauMac)} par maçon + ${N(R.seauMan)} par manœuvre`);
   const t1=ce(mac*R.outMac),t2=ce(mac*R.outMac2),n1t=`${mac} maçons × ${N(R.outMac)}`,n2t=`${mac} maçons × ${N(R.outMac2)}`;
   M('ou-truelle',t1,n1t);M('ou-taloche',t1,n1t);M('ou-burin',t1,n1t);M('ou-niveau',t2,n2t);M('ou-regle',t2,n2t);M('ou-massette',t2,n2t);M('ou-plomb',t2,n2t);M('ou-tamis',ce(mac/3),'1 pour 3 maçons');
   M('ou-coupefer',Math.max(1,ce(fc/2)),'ferraillage');M('ou-tenaille',Math.max(1,fc),'1 par ferrailleur / coffreur');M('ou-marteau',Math.max(1,fc),'1 par coffreur');M('ou-scie',Math.max(1,ce(fc/2)),'coffrage');
   const n1=cur.lignes.length;
   if(p.epi!=='non'){M('ou-casque',eff,`${eff} personnes`);M('ou-bottes',eff,`${eff} personnes`);M('ou-gants',Math.ceil(eff*mois*R.gants),`${eff} personnes × ${N(mois)} mois × ${N(R.gants)} paires`)}
   const jB=Math.ceil(Vbet/rd),jC=Math.ceil(Vba/(rd*nb));
   M('ch-betonniere',jB,`${N(Vbet,1)} m³ de béton ÷ ${rd} m³ par jour`);M('ch-vibreur',jC,`jours de coulage : ${N(Vba,1)} m³ de béton armé ÷ (${nb} × ${rd} m³)`);
   M('ch-echafaudage',Math.ceil(mac/2)*go,`${Math.ceil(mac/2)} ensembles (1 pour 2 maçons) × ${go} mois de gros œuvre`);
   if(p.elec==='groupe'){M('ch-groupe',jB+Math.ceil(go*4.33),`jours de bétonnage + 1 jour par semaine de gros œuvre`);M('ch-carburant',(jB+Math.ceil(go*4.33))*15,'15 L par jour de groupe')}
   if(p.elec==='thermique')M('ch-carburant',jB*8,'bétonnière thermique : 8 L par jour');
   const cure=(A+A*nD)*R.cureL/1000*R.cureJ,eau=Vbet*R.eauBet/1000+Vmor*R.eauMor/1000+cure+mois*26*R.eauJour/1000,pic=nb*rd*R.eauBet/1000+1;
   const ne=`béton ${N(Vbet,1)} m³ × ${R.eauBet} L + mortier ${N(Vmor,1)} m³ × ${R.eauMor} L + cure des dalles ${R.cureL} L/m² × ${R.cureJ} j + ${R.eauJour} L / jour de nettoyage`;
   if(p.eau==='reseau'){M('gr-eau-reseau',eau,ne);M('ou-fut',Math.ceil(pic/0.2),'réserve pour 1 jour de bétonnage')}
   else if(p.eau==='citerne'){M('gr-eau',eau,ne);M('ou-cubi',Math.ceil(pic),'stockage de 1 jour de bétonnage')}
   else{M('ou-cubi',Math.ceil(pic),'stockage de 1 jour de bétonnage');M('ch-pompe',Math.ceil(jB),'pompage du puits / forage les jours de bétonnage')}
   if(p.outilsPossedes)cur.lignes.slice(n0,n1).forEach(z=>z.off=true)}
  {const ol=lots.pop(),ii=lots.findIndex(x=>x.key==='implantation');lots.splice(ii+1,0,ol)}
  {/* options demandées par le client */const ol={id:uid(),nom:'Options et équipements demandés par le client',note:'Ouvrages hors devis standard, chiffrés selon les prix indiqués.',lignes:[],_m:{}};
   const cx=(designation,unite,qte,pu,type)=>{if(qte>0&&pu>0)ol.lignes.push({id:uid(),type:type||'mat',ref:'',designation,unite,qte,pu})};
   cx('Climatiseur split 1,5 CV fourni et posé','pièce',Dq('optClim',0),Dq('optClimPx',275000));cx('Portail métallique fourni et posé','forfait',1,Dq('optPortail',0));
   cx('Cuisine équipée (placards, plan de travail)','forfait',1,Dq('optCuisine',0));cx('Installation solaire (panneaux, batteries, onduleur)','forfait',1,Dq('optSolaire',0));
   cx('Pierre de parement sur façades (fournie et posée)','m²',Dq('optPierre',0),Dq('optPierrePx',17000));cx(String(Dq('optAutreNom','')||'Autre option demandée par le client'),'forfait',1,Dq('optAutre',0));
   if(ol.lignes.length)lots.push(ol)}
  {/* livraison des matériaux et accès au terrain */const all=lots.flatMap(x=>x.lignes),q=f=>sum(all.filter(f),z=>num(z.qte));
   const gran=q(z=>/^gr-(sable|gravier|moellons|laterite)/.test(z.ref||'')),sacs=q(z=>/^cim-/.test(z.ref||'')),pps=q(z=>/^pp-/.test(z.ref||'')),fers=q(z=>/^fer-\d/.test(z.ref||''));
   const voy=Math.ceil(gran/8)+Math.ceil(sacs/300)+Math.ceil(pps/1500)+Math.ceil(fers/400)+2,km=Dq('distance',0),pv=Dq('prixVoy',30000)+500*km;
   cur=instLot;add('mat','ch-transport',voy,`livraison des matériaux : ${N(gran,1)} m³ de granulats ÷ 8 + ${Math.round(sacs)} sacs ÷ 300 + ${Math.round(pps)} parpaings ÷ 1500 + ${Math.round(fers)} barres ÷ 400 + 2 voyages divers${km?` · ${N(km)} km × 500 FCFA`:''}`,pv);
   if(Dq('acces','facile')==='difficile'){const mt=sum(lots,x=>sum(x.lignes.filter(z=>z.type!=='mo'&&z.pct==null&&!z.off),z=>num(z.qte)*num(z.pu)));instLot.lignes.push({id:uid(),type:'mo',ref:'',designation:'Manutention et portage des matériaux (accès difficile pour les camions) – 3 % des fournitures',unite:'forfait',qte:1,pu:Math.round(mt*0.03)})}}
  {/* gamme des sanitaires et de l'appareillage électrique */const kS={moy:1.4,haut:2}[Dq('sanit','std')],kE={moy:1.5,haut:2.2}[Dq('appar','std')];
   lots.forEach(x=>x.lignes.forEach(z=>{if(kS&&/^pl-(wc|lavabo|rob-|douche|receveur|evier)/.test(z.ref||'')){z.pu=Math.round(z.pu*kS);z.designation+=' (gamme '+(kS>1.5?'haut de gamme':'moyenne')+')'}
     if(kE&&/^el-(inter|inter-double|vv|prise|tv|hublot|reglette|poussoir)$/.test(z.ref||'')){z.pu=Math.round(z.pu*kE);z.designation+=' (gamme '+(kE>2?'haut de gamme':'moyenne')+')'}}))}
  const PRESTA=new Set(['mo-plans','mo-etude-ba','mo-geotech','mo-geometre','mo-permis','mo-essais-beton','mo-essais','mo-gardien','mo-antitermite','mo-reception','mo-chef']);
  lots.forEach(x=>{const md=(p.mo||{})[x.key];if(!md||md.m==='unit'||!md.m||!x.moBase)return;const v=num(md.v);
    x.lignes=x.lignes.filter(z=>z.type!=='mo'||PRESTA.has(z.ref));
    if(md.m==='pct')x.lignes.push({id:uid(),type:'mo',ref:'',designation:`Main-d'œuvre de l'étape (${N(v)} % des fournitures)`,unite:'%',qte:v,pct:v,pu:0});
    if(md.m==='forfait')x.lignes.push({id:uid(),type:'mo',ref:'',designation:"Main-d'œuvre de l'étape (forfait)",unite:'forfait',qte:1,pu:v})});
  /* étapes cochées pour la main-d'œuvre (toutes par défaut) */
  const moB=p.moB||{};lots.forEach(x=>{const k=/^Options/.test(x.nom)?'options':x.key;x.moBase=moB[k]!==false;if(!x.moBase)x.lignes=x.lignes.filter(z=>z.type!=='mo'||PRESTA.has(z.ref))});
  if(p.moG==='pct'||p.moG==='forfait'){const v=num(p.moGv);lots.forEach(x=>{if(x.moBase)x.lignes=x.lignes.filter(z=>z.type!=='mo'||PRESTA.has(z.ref))});
    lots.push({id:uid(),nom:"Main-d'œuvre globale du projet",moBase:false,note:p.moG==='pct'?`${N(v)} % des fournitures des étapes cochées : ${lots.filter(x=>x.moBase&&x.nom!=="Main-d'œuvre globale du projet").map(x=>x.nom.split(/[ ,&(]/)[0]).join(', ')}.`:'Montant global pour les étapes cochées.',lignes:[p.moG==='pct'?{id:uid(),type:'mo',ref:'',designation:`Main-d'œuvre globale (${N(v)} % des fournitures des étapes cochées)`,unite:'%',qte:v,pct:v,glob:true,pu:0}:{id:uid(),type:'mo',ref:'',designation:"Main-d'œuvre globale du projet (forfait)",unite:'forfait',qte:1,pu:v}]})}
  const disc=new Set(['pièce','sac','barre','feuille','rouleau','seau','pot','panneau','plaque','sachet','forfait','point','voyage','mois','jour','L']);
  lots.forEach(x=>{x.lignes.forEach(ln=>{if(ln.pct!=null)return;ln.qte=disc.has(ln.unite)?Math.ceil(ln.qte-1e-9):Math.ceil(ln.qte*10-1e-9)/10});delete x._m;delete x.key;if(x.moBase==null)x.moBase=true});
  return lots;
}

/* ---------- Rapport hebdomadaire ---------- */
function rapportData(cids,ws){
  const we=addDays(ws,6),inW=d=>d&&d>=ws&&d<=we;
  return cids.map(cid=>{const ch=S.chantiers.find(c=>c.id===cid),st=stats(cid),empN=Object.fromEntries(S.employes.map(e=>[e.id,e.nom])),etN=Object.fromEntries(st.ets.map(e=>[e.id,e.nom]));
    const ach=byC('achats',cid).filter(a=>a.statut!=='a_acheter'&&inW(a.date)).sort((a,b)=>a.date.localeCompare(b.date));
    const pay=byC('paiements',cid).filter(p=>inW(p.date)).sort((a,b)=>a.date.localeCompare(b.date));
    const rec=byC('recus',cid).filter(r=>inW(r.date)).sort((a,b)=>a.date.localeCompare(b.date));
    const jr=byC('journal',cid).filter(j=>inW(j.date)).sort((a,b)=>a.date.localeCompare(b.date));
    const hi=byC('historique',cid).filter(j=>inW(j.date)).sort((a,b)=>(a.date+a.maj).localeCompare(b.date+b.maj));
    const bons=byC('bons',cid).filter(b=>inW(b.date)||inW(b.livreLe));
    const aa=byC('achats',cid).filter(a=>a.statut==='a_acheter');
    const sor={};byC('mouvements',cid).filter(m=>m.type==='sortie'&&inW(m.date)).forEach(m=>{const k=skey(m.nom,m.unite);(sor[k]=sor[k]||{nom:m.nom,unite:m.unite,q:0}).q+=num(m.qte)});
    const SD=Object.fromEntries(stockData(cid).map(x=>[x.k,x]));const sorties=Object.entries(sor).map(([k,v])=>({...v,stock:(SD[k]||{}).stock??0,alerte:(SD[k]||{}).alerte}));
    const ctl=byC('controles',cid).filter(c=>inW(c.date)).flatMap(c=>(c.lignes||[]).filter(x=>num(x.present)<num(x.attendu)||x.etat!=='bon').map(x=>({...x,date:c.date})));
    const tA=sum(ach,totA),tP=sum(pay,p=>num(p.montant)),tR=sum(rec,r=>num(r.montant));
    return{ch,st,ach,pay,rec,jr,hi,bons,aa,tA,tP,tR,tD:tA+tP,empN,etN,sorties,ctl}});
}
function tRapport(ch){
  const ws=ui.week,we=addDays(ws,6),[r]=rapportData([ch.id],ws);
  let h=`<div class="card row between"><button class="btn sec small" onclick="ui.week=addDays(ui.week,-7);render()">‹</button><div style="text-align:center"><b>Semaine du ${dfr(ws)}</b><div class="sm mute">au ${dfr(we)}</div></div><button class="btn sec small" onclick="ui.week=addDays(ui.week,7);render()">›</button></div>
  <div class="grid2" style="margin-bottom:12px"><div class="kpi"><div class="l">Encaissé</div><div class="v">${M$(r.tR)}</div></div><div class="kpi"><div class="l">Dépenses</div><div class="v">${M$(r.tD)}</div></div>
   <div class="kpi"><div class="l">Achats matériaux</div><div class="v">${M$(r.tA)}</div></div><div class="kpi"><div class="l">Paie</div><div class="v">${M$(r.tP)}</div></div>
   <div class="kpi" style="grid-column:1/-1"><div class="l">Solde de la semaine</div><div class="v" style="color:${r.tR-r.tD<0?'var(--warn)':'var(--ok)'}">${M$(r.tR-r.tD)}</div></div></div>
  <button class="btn block" style="margin-bottom:12px" onclick="pdfRapport(['${ch.id}'],ui.week)">📄 Télécharger le rapport PDF de la semaine</button>`;
  const sec=(t,items)=>`<div class="card list"><h3>${t}</h3>${items||'<div class="sm mute">Rien cette semaine.</div>'}</div>`;
  h+=sec('Travaux réalisés',r.jr.map(j=>`<div class="it"><div class="main"><div class="t">${dfr(j.date)}${j.etapeId&&r.etN[j.etapeId]?' · '+esc(r.etN[j.etapeId]):''}</div><div class="s" style="white-space:pre-wrap;color:var(--ink)">${esc(j.texte)}</div>${(j.photos||[]).length?`<div class="thumbs">${thumbsHtml(null,false,j.photos)}</div>`:''}</div></div>`).join('')+r.hi.map(x=>`<div class="it"><div class="main"><div class="s">${dfr(x.date)} · ${esc(x.texte)}</div></div>${delBtn('historique',x.id)}</div>`).join(''));
  h+=sec('Achats',r.ach.map(a=>`<div class="it"><div class="main"><div class="t">${esc(a.materiau)} ${(a.justifs||[]).length?chip('📎','ok'):chip('sans reçu','bad')}</div><div class="s">${dfr(a.date)} · ${N(num(a.quantite))} ${esc(a.unite||'')} × ${F(num(a.prixUnit))}${a.fournisseur?' · '+esc(a.fournisseur):''}</div>${(a.justifs||[]).length?`<div class="thumbs">${thumbsHtml(null,false,a.justifs)}</div>`:''}</div><div class="amt">${F(totA(a))}</div></div>`).join(''));
  h+=sec('Matériaux utilisés (sorties de stock)',r.sorties.map(x=>`<div class="it"><div class="main"><div class="t">${esc(x.nom)} ${x.alerte?chip('à commander','go'):''}</div><div class="s">Reste en stock : ${N(x.stock,1)} ${esc(x.unite)}</div></div><div class="amt">${N(x.q,1)}<small>${esc(x.unite)} utilisés</small></div></div>`).join(''));
  if(r.ctl.length)h+=sec('Matériel manquant ou abîmé',r.ctl.map(x=>`<div class="it"><div class="main"><div class="t">${esc(x.nom)}</div><div class="s">${dfr(x.date)} · présent ${num(x.present)} / ${num(x.attendu)} · ${ETAT_MAT[x.etat]||''}</div></div></div>`).join(''));
  h+=sec('Paie des employés',r.pay.map(p=>`<div class="it"><div class="main"><div class="t">${esc(r.empN[p.employeId]||'—')}</div><div class="s">${dfr(p.date)}${num(p.jours)?' · '+N(num(p.jours),1)+' j':''}${p.objet?' · '+esc(p.objet):''}</div></div><div class="amt">${F(num(p.montant))}</div></div>`).join(''));
  h+=sec('Argent reçu du client',r.rec.map(x=>`<div class="it"><div class="main"><div class="t">${esc(x.numero)}</div><div class="s">${dfr(x.date)} · ${esc(x.mode||'')}</div></div><div class="amt">${F(num(x.montant))}</div></div>`).join(''));
  h+=sec('Bons de commande',r.bons.map(b=>{const ps=bonPay(b);return `<div class="it"><div class="main"><div class="t">${dot(ps.c)} ${esc(b.numero)} · ${esc(b.fournisseur||'')}</div><div class="s">${STAT_BON[b.statut||'emis']} · ${esc(ps.t)}</div></div><div class="amt">${F(totL(b.lignes))}</div></div>`}).join(''));
  return h;
}
function formRapportGlobal(){openForm({title:'Rapport de la semaine',values:{date:ui.week},fields:[{k:'date',label:'Une date dans la semaine voulue',type:'date'}],
  extra:`<div class="note" style="margin-bottom:12px">Le rapport regroupe tous les chantiers : travaux, achats avec photos des reçus, paie, encaissements et commandes.</div>`,
  onSave:o=>pdfRapport(S.chantiers.map(c=>c.id),mondayOf(o.date||today()))})}

/* ---------- Calculs ---------- */
const FER={dalle:90,poteau:130,poutre:120,semelle:60,longrine:100,proprete:0,autre:80};
const ELN={dalle:'Dalle',semelle:'Semelle',poteau:'Poteaux',poutre:'Poutres',longrine:'Longrines',proprete:'Béton de propreté',autre:'Autre'};
function tCalculs(ch){
  const c=ui.calc,t=c.type,ets=etapesOf(ch.id);
  const inp=(g,k,lbl,ph='')=>`<label class="f"><span>${lbl}</span><input class="cin" inputmode="decimal" data-g="${g}" data-k="${k}" value="${esc(c[g][k])}" placeholder="${ph}" oninput="calcIn(this)"></label>`;
  const sel=(g,k,lbl,opts)=>`<label class="f"><span>${lbl}</span><select data-g="${g}" data-k="${k}" onchange="calcIn(this)">${opts.map(([v,l])=>`<option value="${v}" ${String(c[g][k])===String(v)?'selected':''}>${esc(l)}</option>`).join('')}</select></label>`;
  let h=`<div class="seg">${[['beton','Béton'],['murs','Murs'],['enduit','Enduit'],['carrelage','Carrelage'],['coulage','Débit coulage']].map(([k,v])=>`<button class="${t===k?'on':''}" onclick="ui.calc.type='${k}';render()">${v}</button>`).join('')}</div><div class="card">`;
  if(t==='beton')h+=`<h3>Béton : quantités de matériaux</h3>${sel('beton','el','Élément',Object.entries(ELN))}
    <div class="grid2">${inp('beton','L','Longueur (m)','ex. 10')}${inp('beton','l','Largeur (m)','ex. 8')}${inp('beton','h','Épaisseur / hauteur (m)','ex. 0.15')}${inp('beton','n','Nombre','1')}</div>
    <div class="grid2">${sel('beton','dosage','Dosage',[[150,'150 kg/m³ (propreté)'],[250,'250 kg/m³'],[300,'300 kg/m³'],[350,'350 kg/m³ (béton armé)'],[400,'400 kg/m³']])}${inp('beton','marge','Pertes (%)','5')}</div>
    ${sel('beton','cim','Ciment',CIMENTS.map(a=>[a[0],a[1].replace(' (sac 50 kg)','')+' – '+FN(prixOf(a[0]))]))}`;
  if(t==='murs')h+=`<h3>Murs en parpaings</h3><div class="grid2">${inp('murs','L','Longueur totale des murs (m)','ex. 60')}${inp('murs','H','Hauteur (m)','ex. 3')}</div><div class="grid2">${inp('murs','ouv','Ouvertures à déduire (m²)')}${sel('murs','ep','Parpaing',[[10,'10 cm (cloisons)'],[15,'15 cm'],[20,'20 cm']])}</div>`;
  if(t==='enduit')h+=`<h3>Enduit / crépissage</h3><div class="grid2">${inp('enduit','S','Surface de mur (m²)','ex. 150')}${sel('enduit','faces','Faces',[[1,'1 face'],[2,'2 faces']])}</div>${inp('enduit','ep','Épaisseur (cm)','1.5')}`;
  if(t==='carrelage')h+=`<h3>Carrelage</h3><div class="grid2">${inp('carrelage','S','Surface à carreler (m²)','ex. 90')}${inp('carrelage','marge','Coupes & casse (%)','10')}</div>${inp('carrelage','carton','m² par carton (facultatif)','ex. 1.44')}`;
  if(t==='coulage'){const vb=volBeton();h+=`<h3>Débit de coulage du béton</h3>${inp('coulage','V','Volume à couler (m³)','ex. 12')}
    ${vb>0?`<button class="btn ghost small" style="margin:-6px 0 8px" onclick="ui.calc.coulage.V=${vb.toFixed(2)};ui.calc.coulage.dosage=${num(ui.calc.beton.dosage)};render()">Utiliser le volume calculé (${N(vb)} m³)</button>`:''}
    <div class="grid2">${inp('coulage','cap','Béton par gâchée (L)','250')}${inp('coulage','t',"Durée d'une gâchée (min)",'6')}</div><div class="grid2">${inp('coulage','nb','Nombre de bétonnières','1')}${inp('coulage','heures','Heures de travail / jour','8')}</div>
    ${sel('coulage','dosage','Dosage',[[250,'250 kg/m³'],[300,'300 kg/m³'],[350,'350 kg/m³'],[400,'400 kg/m³']])}`}
  h+=`<div class="res" id="calcRes"></div>`;
  if(t!=='coulage')h+=`<label class="f" style="margin-top:12px"><span>Rattacher à l'étape</span><select onchange="ui.calc.etapeId=this.value"><option value="">— Aucune —</option>${ets.map(e=>`<option value="${e.id}" ${ui.calc.etapeId===e.id?'selected':''}>${esc(e.nom)}</option>`).join('')}</select></label><button class="btn block" onclick="calcVersAchats()">Ajouter à la liste « À acheter »</button>`;
  return h+`</div><div class="card sm mute">Prix tirés de ton catalogue (📦). Ratios de fer et de mortier indicatifs : fais valider le ferraillage par ton ingénieur.</div>`;
}
function calcIn(el){ui.calc[el.dataset.g][el.dataset.k]=el.value;updCalc()}
function volBeton(){const b=ui.calc.beton;return num(b.L)*num(b.l)*num(b.h)*(num(b.n)||1)*(1+num(b.marge)/100)}
function ferLignes(kg,note){const out=[];[[12,0.45,10.66],[10,0.25,7.4],[8,0.15,4.74],[6,0.15,2.66]].forEach(([d,s,w])=>{const q=Math.ceil(kg*s/w);if(q>0)out.push({ref:'fer-'+d,quantite:q,note})});return out}
function calcLines(){
  const c=ui.calc,o={rows:[],achats:[],alerts:[],notes:[]},R=(l,v)=>o.rows.push([l,v]);
  const A=(ref,q,note)=>{const a=art(ref);if(a&&q>0)o.achats.push({materiau:a.nom,quantite:q,unite:a.unite,prixUnit:a.prix,notes:note||''})};
  if(c.type==='beton'){const b=c.beton,V=volBeton(),d=num(b.dosage);if(!V)return o;
    const RR=RG(),sacs=Math.ceil(V*d/50),sab=V*RR.sableBet,grav=V*RR.gravBet,fer=V*(FER[b.el]||0),lab=ELN[b.el];
    R('Volume de béton (pertes incluses)',N(V)+' m³');R('Ciment',N(V*d,0)+' kg → <b>'+sacs+' sacs</b>');R('Sable',N(sab)+' m³');R('Gravier 15/25',N(grav)+' m³');R('Eau',N(V*d*0.5,0)+' L');
    A(b.cim,sacs,lab);A('gr-sable',+sab.toFixed(2),lab);A('gr-gravier-1525',+grav.toFixed(2),lab);
    if(fer){const fl=ferLignes(fer,lab);R('Fer à béton (estimation)',N(fer,0)+' kg → '+fl.map(x=>x.quantite+' HA'+x.ref.slice(4)).join(', '));fl.forEach(x=>A(x.ref,x.quantite,lab))}}
  if(c.type==='murs'){const m=c.murs,Sf=Math.max(0,num(m.L)*num(m.H)-num(m.ouv));if(!Sf)return o;
    const RR=RG(),ep=num(m.ep)||15,nb=Math.ceil(Sf*RR.ppM2*(1+RR.casse/100)),mort=Sf*({10:RR.mort10,15:RR.mort15,20:RR.mort20}[ep]||RR.mort15),sacs=Math.ceil(mort*RR.dosPose/50),sab=mort*RR.sableMor;
    R('Surface de mur',N(Sf)+' m²');R('Parpaings de '+ep+' ('+RG().casse+' % casse)','<b>'+nb+'</b>');R('Mortier de pose',N(mort)+' m³');R('Ciment 32.5',N(mort*RG().dosPose,0)+' kg → <b>'+sacs+' sacs</b>');R('Sable',N(sab)+' m³');
    A({10:'pp-10',15:'pp-15c',20:'pp-20c'}[ep],nb,'Murs');A('cim-multix',sacs,'Mortier murs');A('gr-sable',+sab.toFixed(2),'Mortier murs')}
  if(c.type==='enduit'){const e=c.enduit,Sf=num(e.S)*(num(e.faces)||1);if(!Sf)return o;
    const RR=RG(),mort=Sf*num(e.ep)/100*(1+RR.pertEnd/100),sacs=Math.ceil(mort*RR.dosEndInt/50),sab=mort*RR.sableMor;
    R('Surface à enduire',N(Sf)+' m²');R('Mortier (10 % pertes)',N(mort)+' m³');R('Ciment 32.5',N(mort*RR.dosEndInt,0)+' kg → <b>'+sacs+' sacs</b>');R('Sable fin',N(sab)+' m³');
    A('cim-multix',sacs,'Enduit');A('gr-sable-fin',+sab.toFixed(2),'Enduit')}
  if(c.type==='carrelage'){const k=c.carrelage,m2=num(k.S)*(1+num(k.marge)/100);if(!m2)return o;
    const RR=RG(),ct=num(k.carton)>0?Math.ceil(m2/num(k.carton)):0,colle=Math.ceil(num(k.S)*RR.colle/25);
    R('Carreaux à commander',N(m2)+' m²');if(ct)R('Cartons','<b>'+ct+'</b>');R('Ciment-colle (≈ '+N(RR.colle)+' kg/m²)',colle+' sacs de 25 kg');
    A('rv-6060',+(ct?ct*num(k.carton):m2).toFixed(2),ct?ct+' cartons':'');A('rv-colle',colle);A('rv-joint',Math.ceil(m2*RR.joint/5))}
  if(c.type==='coulage'){const k=c.coulage,V=num(k.V),cap=num(k.cap),t=num(k.t),nb=num(k.nb)||1,hj=num(k.heures)||8;if(!V||!cap||!t)return o;
    const g=Math.ceil(V*1000/cap),deb=nb*(cap/1000)*(60/t),du=V/deb;
    R('Nombre de gâchées','<b>'+g+'</b>'+(nb>1?' ('+Math.ceil(g/nb)+' par bétonnière)':''));R('Débit de coulage','<b>'+N(deb)+' m³/h</b>');
    R('Durée du coulage','<b>'+(du<1?Math.round(du*60)+' min':N(du,1)+' h')+'</b>'+(du>hj?' ≈ '+N(du/hj,1)+' jours':''));R('Consommation de ciment',N(deb*num(k.dosage)/50,1)+' sacs / heure');R('Équipe conseillée','≈ '+6*nb+' à '+8*nb+' personnes');
    if(du>hj)o.alerts.push("Le coulage dépasse une journée. Une dalle se coule d'un seul tenant : ajoute une bétonnière, commande un camion toupie ou prévois une reprise de bétonnage validée par l'ingénieur.");
    else if(du>hj*0.75)o.alerts.push('Coulage serré : commence tôt et prépare tous les matériaux sur place la veille.');
    o.notes.push('Équipe : chargement, transport (brouettes), mise en place, vibrage et réglage.')}
  return o;
}
function updCalc(){const el=$('#calcRes');if(!el)return;const o=calcLines();
  if(!o.rows.length){el.innerHTML='<div class="sm mute">Saisis les dimensions pour voir le résultat.</div>';return}
  let h=o.rows.map(([l,v])=>`<div class="r"><span>${l}</span><b>${v}</b></div>`).join('');
  if(o.achats.length){const t=sum(o.achats,a=>a.quantite*a.prixUnit);h+=`<div class="r"><span>Coût estimé des matériaux</span><b>${F(t)}<br><small class="mute">≈ ${C(t)}</small></b></div>`}
  o.alerts.forEach(a=>h+=`<div class="alert">${a}</div>`);o.notes.forEach(n=>h+=`<div class="note">${n}</div>`);el.innerHTML=h}
async function calcVersAchats(){const o=calcLines();if(!o.achats.length){toast('Complète le calcul.');return}
  for(const a of o.achats)await save('achats',{...a,chantierId:ui.cid,statut:'a_acheter',date:today(),etapeId:ui.calc.etapeId||'',fournisseur:''});
  toast(o.achats.length+' ligne(s) ajoutée(s) à « À acheter »')}

/* ---------- Catalogue (vue) ---------- */
function viewCatalogue(){
  const s=SECT[ui.catSect],q=ui.catQ.toLowerCase();
  const list=(q?articles():articles(ui.catSect)).filter(a=>!q||a.nom.toLowerCase().includes(q));
  let h=`<input class="cin" placeholder="Rechercher un article…" value="${esc(ui.catQ)}" oninput="ui.catQ=this.value;clearTimeout(window._cq);window._cq=setTimeout(()=>{render();const i=document.querySelector('.cin');i.focus();i.setSelectionRange(i.value.length,i.value.length)},250)" style="margin-bottom:10px">
  <div class="seg wrapseg">${CATALOGUE.map(x=>`<button class="${x.id===ui.catSect&&!q?'on':''}" onclick="ui.catSect='${x.id}';ui.catQ='';render()">${esc(x.nom)}</button>`).join('')}</div>`;
  if(!q&&s&&s.note)h+=`<div class="banner">${esc(s.note)}</div>`;
  if(!q)h+=`<button class="btn sec block" style="margin-bottom:10px" onclick="go('fondcat')">🧱 Fondations types : semelles, amorces, poteaux, longrines par type de sol et par ville</button>`;
  h+=`<div class="row between" style="margin-bottom:10px"><div class="sm mute">${list.length} article(s) · prix indicatifs, touche un article pour le modifier</div><button class="btn small" onclick="formArticle()">+ Article</button></div><div class="card list">`;
  list.forEach(a=>{const ov=S.prixOv[a.ref]!=null&&S.prixOv[a.ref]!=='';h+=`<div class="it click" onclick="${a.custom?`formArticle('${a.id}')`:`formPrix('${a.ref}')`}"><div class="main"><div class="t" style="font-weight:500">${esc(a.nom)} ${a.custom?chip('perso','blue'):''}${ov?chip('ton prix','ok'):''}${a.modif?chip('modifié','go'):''}</div>${q?`<div class="s">${esc(SECT[a.secteur]?SECT[a.secteur].nom:'')}</div>`:''}</div><div class="amt">${F(a.prix)}<small>/ ${esc(a.unite)}</small><button class="btn ghost small delb" onclick="event.stopPropagation();confirmDel(this,()=>${a.custom?`del('articles','${a.id}')`:`cacherArticle('${a.ref}')`},true)">🗑</button></div></div>`});
  const cach=articles(q?null:ui.catSect,true).filter(a=>!q||a.nom.toLowerCase().includes(q));
  if(cach.length)h+=`</div><div class="card list"><h3>Articles supprimés du catalogue (${cach.length})</h3>${cach.map(a=>`<div class="it"><div class="main"><div class="t" style="font-weight:500;opacity:.6">${esc(a.nom)}</div></div><button class="btn sec small" onclick="restaurerArticle('${a.ref}')">Restaurer</button></div>`).join('')}`;
  return h+`</div><div class="sm mute">Ciments : prix maxima homologués à Douala (MINCOMMERCE). Fer à béton : base du communiqué officiel (fer 400, Douala). Les autres prix sont des estimations à remplacer par ceux de tes fournisseurs.</div>`;
}
function formPrix(ref){const a=art(ref),B=BASE[ref];openForm({title:"Modifier l'article",values:{nom:a.nom,unite:a.unite,prix:a.prix},
  fields:[{k:'nom',label:'Désignation (marque, dimension…)',req:true},{k:'unite',label:'Unité',type:'select',opts:[...new Set([a.unite,...UNITES_ALL])].map(u=>[u,u])},{k:'prix',label:'Prix (FCFA)',type:'number'}],
  extra:`<div class="note" style="margin-bottom:12px">Article d'origine : ${esc(B.nom)} — ${F(B.prix)} / ${esc(B.unite)}.</div>${a.modif||S.prixOv[ref]!=null?`<button type="button" class="btn sec block" style="margin-bottom:12px" onclick="closeForm();resetArticle('${ref}')">Revenir à l'article d'origine</button>`:''}`,
  onSave:async o=>{const ov={...(S.artOv[ref]||{})};if(o.nom&&o.nom!==B.nom)ov.nom=o.nom;else delete ov.nom;if(o.unite!==B.unite)ov.unite=o.unite;else delete ov.unite;
    if(Object.keys(ov).length)S.artOv[ref]=ov;else delete S.artOv[ref];if(o.prix===''||num(o.prix)===B.prix)delete S.prixOv[ref];else S.prixOv[ref]=num(o.prix);await savePrix();toast('Article modifié')},
  onDelete:()=>cacherArticle(ref)})}
async function cacherArticle(ref){S.artOv[ref]={...(S.artOv[ref]||{}),hidden:true};await savePrix();toast('Article supprimé du catalogue (restaurable en bas de la liste)')}
async function restaurerArticle(ref){const o={...(S.artOv[ref]||{})};delete o.hidden;if(Object.keys(o).length)S.artOv[ref]=o;else delete S.artOv[ref];await savePrix();toast('Article restauré')}
async function resetArticle(ref){delete S.artOv[ref];delete S.prixOv[ref];await savePrix();toast("Article d'origine rétabli")}
function formArticle(id){const a=id?S.articles.find(x=>x.id===id):null;
  openForm({title:a?"Modifier l'article":'Nouvel article',values:a||{secteur:ui.catSect,unite:'pièce'},fields:[{k:'secteur',label:'Secteur',type:'select',opts:CATALOGUE.map(s=>[s.id,s.nom])},{k:'nom',label:'Désignation (marque, dimension…)',req:true},{k:'unite',label:'Unité',type:'select',opts:UNITES_ALL.map(u=>[u,u])},{k:'prix',label:'Prix (FCFA)',type:'number'}],
    onSave:o=>save('articles',{...(a||{}),...o,prix:num(o.prix)}),onDelete:a?()=>del('articles',a.id):null})}
