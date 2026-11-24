/* pointage2.js — pointage strict : hors de la zone du lieu d'affectation, le pointage est refusé (pas de « pointer quand même »).
   La tentative est gardée pour le gérant ; la journée n'est payée que si la personne pointe sur place (ou si le gérant corrige avec un motif). */
if(!COLLS.includes('ptrefus')){COLLS.push('ptrefus');S.ptrefus=S.ptrefus||[]}
async function ptRefus(e,lieu,motif,g,d){try{await save('ptrefus',{employeId:e.id,lieu,chantierId:lieu,date:today(),ts:Date.now(),motif,gps:g?{lat:g.lat,lng:g.lng,acc:g.acc,dist:d}:null,sens:ptOuvert(e.id)?'fin':'debut'})}catch(_){}
  if(typeof log==='function'&&lieu!=='bureau')log(lieu,`Pointage refusé : ${e.nom} (${motif})`)}
pointer=async function(eid,force){const e=S.employes.find(x=>x.id===eid);if(!e)return;
  if(e.pin&&!force){openForm({title:'🔒 '+e.nom,fields:[{k:'p',label:'Code de pointage',type:'tel',req:true}],submit:'Valider',onSave:async o=>{if(String(o.p).trim()!==String(e.pin).trim()){toast('Code incorrect');return false}setTimeout(()=>pointer(eid,'pin'),50)}});return}
  const o=ptOuvert(eid),lieu=e.chantierId||'bureau',lp=lieuPos(lieu),sens=o?'la fin de ta journée':'ton arrivée';let g=null;
  if(lp){try{toast('Vérification de la position…');g=await getPos()}catch(err){await ptRefus(e,lieu,'position indisponible');ptHors(eid,`Impossible de vérifier ta position : ${err.message}`,'gps');return}
    const d=Math.round(distM(g,lp)),tol=Math.min(g.acc||0,50);
    if(g.acc>150){await ptRefus(e,lieu,`GPS imprécis (${g.acc} m)`,g,d);ptHors(eid,`Le GPS de ton téléphone est trop imprécis (${g.acc} m) pour confirmer que tu es sur « ${lieuNom(lieu)} ».`,'gps');return}
    if(d>lp.r+tol){await ptRefus(e,lieu,`à ${d>=1000?N(d/1000,1)+' km':d+' m'} du lieu`,g,d);ptHors(eid,`Tu es à ${d>=1000?N(d/1000,1)+' km':d+' m'} de « ${lieuNom(lieu)} ». Le pointage n'est accepté qu'à moins de ${lp.r} m du lieu.`,'loin',sens);return}
    const gps={...g,dist:d};
    if(o){await save('pointages',{...o,fin:new Date().toISOString(),gF:gps});toast(`✅ ${e.nom} : fin à ${hm(new Date().toISOString())} · ${hTxt(dureeMin({...o,fin:new Date().toISOString()}))}`)}
    else{await save('pointages',{employeId:eid,lieu,chantierId:lieu,date:today(),debut:new Date().toISOString(),fin:null,gD:gps,horsZone:false});toast(`✅ ${e.nom} : arrivée à ${hm(new Date().toISOString())} (à ${d} m du point)`)}
    return}
  /* lieu sans position GPS : accepté, mais signalé au gérant */
  if(o){await save('pointages',{...o,fin:new Date().toISOString(),sansGps:true});toast(`${e.nom} : fin à ${hm(new Date().toISOString())}`)}
  else{await save('pointages',{employeId:eid,lieu,chantierId:lieu,date:today(),debut:new Date().toISOString(),fin:null,sansGps:true,horsZone:false});toast(`${e.nom} : début à ${hm(new Date().toISOString())} (position du lieu non définie)`)}};
ptHors=function(eid,msg,type,sens){const gerant=!(typeof TEAM!=='undefined'&&TEAM.on&&!TEAM.admin);
  $('#modalRoot').innerHTML=`<div class="modal-bg" onclick="if(event.target===this)closeForm()"><div class="modal"><h2>${type==='gps'?'📡 Position non vérifiée':'📍 Tu n\'es pas au bon endroit'}</h2><div class="alert">${esc(msg)}</div>
    <div class="note"><b>Pointage refusé.</b> ${type==='gps'?'Active la localisation (GPS) du téléphone, sors à découvert et réessaie.':`Rends-toi sur le lieu de travail pour pointer ${sens||''}.`} Une journée sans pointage sur place <b>n'est pas payée</b>.</div>
    ${gerant?`<div class="sm mute" style="margin-top:8px">Gérant : la tentative est enregistrée dans les pointages refusés. Si la personne était réellement sur place, corrige le pointage dans Personnel & paie › Pointage, avec un motif.</div>`:''}
    <button class="btn block" style="margin-top:10px" onclick="closeForm()">Compris</button></div></div>`};
/* tentatives refusées : visibles par le gérant */
function refusCard(lieu){const td=today(),L=S.ptrefus.filter(r=>(lieu?r.lieu===lieu:true)&&r.date>=addDays(td,-6)).sort((a,b)=>num(b.ts)-num(a.ts));if(!L.length)return'';
  return `<div class="card"><h3>⛔ Pointages refusés (7 derniers jours)</h3><div class="sm mute" style="margin:-6px 0 8px">Tentatives faites hors de la zone : non comptées dans la paie.</div><div class="list">${L.slice(0,30).map(r=>{const e=S.employes.find(x=>x.id===r.employeId)||{};
    return `<div class="it"><div class="main"><div class="t">${esc(e.nom||'?')} ${chip(r.sens==='fin'?'fin':'arrivée','bad')}</div><div class="s">${dfr(r.date)} à ${new Date(num(r.ts)).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})} · ${esc(r.motif||'')}${lieu?'':' · '+esc(lieuNom(r.lieu))}</div></div>${r.gps&&r.gps.lat?`<button class="btn ghost small" onclick="window.open('https://maps.google.com/?q=${r.gps.lat},${r.gps.lng}','_blank')">🗺️</button>`:''}</div>`}).join('')}</div></div>`}
const vpP2=viewPointage;viewPointage=function(){return vpP2().replace(/Il faut être à moins de [^<]*<\/div>|il faut être à moins de [^<]*<\/div>/,m=>m.replace('</div>',' Hors de cette zone, le pointage est <b>refusé</b> et la journée n\'est pas payée.</div>'))+refusCard()};
const tpP2=tPointage;tPointage=function(ch){const h=tpP2(ch),pos=lieuPos(ch.id);
  return (pos?`<div class="note" style="margin-bottom:10px">📍 Pointage accepté seulement à moins de ${pos.r} m du chantier. Hors zone : refusé, journée non payée.</div>`:`<div class="alert" style="margin-bottom:10px">📍 La position de ce chantier n'est pas définie : les pointages ne peuvent pas être vérifiés. <button class="btn small" onclick="formChantier('${ch.id}')">Définir la position</button></div>`)+h+refusCard(ch.id)};

/* ---------- contrôle de présence toutes les heures entre « Début » et « Fin de journée » ----------
   Chaque contrôle : ✓ sur place / ✗ hors zone / ? non vérifié (téléphone éteint, appli fermée, pas de GPS) = compté comme absent.
   1 contrôle raté : avertissement. 2 contrôles ratés d'affilée : message « retourne sur le chantier », et le temps depuis le 1er raté
   jusqu'au retour vérifié (ou la fin) n'est pas payé. */
const CTRL_MIN=60;
const ctrlL=p=>[...(p.ctrl||[])].sort((a,b)=>num(a.ts)-num(b.ts));
function ptDeduit(p){const L=ctrlL(p),t0=new Date(p.debut).getTime(),t1=p.fin?new Date(p.fin).getTime():Date.now(),Z=[];let i=0;
  while(i<L.length){if(L[i].ok){i++;continue}let j=i;while(j<L.length&&!L[j].ok)j++;
    if(j-i>=2){const a=Math.max(t0,num(L[i].ts)),b=Math.min(t1,j<L.length?num(L[j].ts):t1);if(b>a)Z.push([a,b])}i=j}
  return{min:Math.round(sum(Z,z=>(z[1]-z[0])/60000)),Z}}
/* la paie ne compte pas le temps hors chantier */
const fcCtrl=ficheCalc;ficheCalc=function(e,d1,d2,x){const P0=S.pointages;
  S.pointages=P0.map(p=>{if(p.employeId!==e.id||!p.fin||!(p.ctrl||[]).length)return p;const d=ptDeduit(p).min;if(!d)return p;return{...p,debut:new Date(new Date(p.debut).getTime()+d*60000).toISOString(),_ded:d}});
  try{const c=fcCtrl(e,d1,d2,x);const ded=sum(S.pointages.filter(p=>p._ded&&p.date>=d1&&p.date<=d2),p=>p._ded);if(ded)c.horsCtrl=ded;return c}finally{S.pointages=P0}};
const moi=()=>typeof TEAM!=='undefined'&&TEAM.on&&TEAM.me&&TEAM.me.employeId||null;
async function ctrlVerifier(eid,force){const o=ptOuvert(eid),e=S.employes.find(x=>x.id===eid);if(!o||!e)return;const lp=lieuPos(o.lieu||e.chantierId||'bureau');if(!lp)return;
  const L=ctrlL(o),now=Date.now(),last=L.length?num(L[L.length-1].ts):new Date(o.debut).getTime();if(!force&&now-last<CTRL_MIN*60000-30000)return;
  const nv=[];for(let t=last+CTRL_MIN*60000;t<now-CTRL_MIN*60000*0.5;t+=CTRL_MIN*60000)nv.push(typeof window.ctrlManque==='function'?window.ctrlManque(t,lp):{ts:t,ok:false,manque:true});
  let c={ts:now,ok:false};try{const g=await getPos(),d=Math.round(distM(g,lp));c={ts:now,ok:d<=lp.r+Math.min(g.acc||0,50)&&(g.acc||0)<=150,dist:d,acc:g.acc}}catch(err){c={ts:now,ok:false,gps:false}}
  nv.push(c);const p2={...o,ctrl:[...(o.ctrl||[]),...nv]};await save('pointages',p2);ctrlSuite(e,p2,c);return c}
async function ctrlSuite(e,p,c){const L=ctrlL(p);let k=0;for(let i=L.length-1;i>=0&&!L[i].ok;i--)k++;const hh=ts=>new Date(num(ts)).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
  const lieu=lieuNom(p.lieu||e.chantierId);const mine=moi()===e.id;
  if(c.ok){const prev=L[L.length-2];if(prev&&!prev.ok&&L.length>=3&&!L[L.length-3].ok){await ctrlMsg(e,`✅ Retour sur le chantier « ${lieu} » constaté à ${hh(c.ts)}. Le temps hors chantier ne sera pas payé.`)}return}
  const loin=c.gps===false?"ta position n'a pas pu être vérifiée (GPS ou internet coupé)":`tu es à ${c.dist>=1000?N(c.dist/1000,1)+' km':c.dist+' m'} du chantier`;
  if(k===1){if(mine)ctrlAlerte('⚠️ Contrôle de présence',`Contrôle de ${hh(c.ts)} : ${loin}. Retourne sur « ${lieu} » : si le prochain contrôle te trouve encore absent, les heures ne seront pas payées.`);return}
  const dep=L[L.length-k];const t=`⛔ Contrôle de présence de ${hh(c.ts)} : ${loin}, pour la ${k}e fois de suite.\nRetourne sur le chantier « ${lieu} ».\nLes heures depuis ${hh(dep.ts)} ne seront pas payées tant que ta présence n'est pas de nouveau confirmée.`;
  await ctrlMsg(e,t);if(mine)ctrlAlerte('⛔ Retourne sur le chantier',t)}
async function ctrlMsg(e,t){try{const c=empConv(e);await save('messages',{conv:c.conv,chantierId:'_dm',membres:c.membres,texte:t,ctrlAuto:true,uid:'systeme',auteur:'Contrôle de présence',date:today(),ts:Date.now()})}catch(_){}}
function ctrlAlerte(titre,t){$('#modalRoot').innerHTML=`<div class="modal-bg"><div class="modal"><h2>${esc(titre)}</h2><div class="alert" style="white-space:pre-wrap">${esc(t)}</div><button class="btn block" style="margin-top:10px" onclick="closeForm()">Compris</button></div></div>`;try{navigator.vibrate&&navigator.vibrate([300,150,300])}catch(_){}}
/* sur le téléphone de l'employé : vérifie chaque minute si un contrôle est dû, et dès que l'appli revient au premier plan */
setInterval(()=>{const id=moi();if(id&&ptOuvert(id))ctrlVerifier(id).catch(()=>{})},60000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){const id=moi();if(id&&ptOuvert(id))ctrlVerifier(id).catch(()=>{})}});
/* à la fin de journée, le contrôle final compte comme un contrôle réussi (la fin n'est acceptée que sur place) */
/* ---------- affichage pour le gérant ---------- */
function ctrlFrise(p){const L=ctrlL(p);if(!L.length)return'';const d=ptDeduit(p).min;const hh=ts=>new Date(num(ts)).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
  return `<div class="ctrlf">${L.map(c=>`<span class="cx ${c.ok?'ok':c.manque||c.gps===false?'nv':'ko'}" title="${hh(c.ts)} · ${c.ok?'sur place':c.manque?'contrôle manqué':c.gps===false?'non vérifié':'hors zone '+c.dist+' m'}">${hh(c.ts).replace(':','h')}</span>`).join('')}</div>${d?`<div class="s" style="color:var(--bad,#b42318)">⛔ ${hTxt(d)} hors chantier, non payé${d>0?'':''}</div>`:''}`}
function ctrlCard(lieu){const td=today(),L=S.pointages.filter(p=>(lieu?p.lieu===lieu:true)&&p.date>=addDays(td,-6)&&(p.ctrl||[]).length).sort((a,b)=>(b.debut||'').localeCompare(a.debut||''));if(!L.length)return'';
  return `<div class="card"><h3>🛰️ Contrôles de présence (toutes les heures)</h3><div class="sm mute" style="margin:-6px 0 8px"><span class="cx ok">✓</span> sur place · <span class="cx ko">✗</span> hors zone · <span class="cx nv">?</span> non vérifié. Deux contrôles ratés d'affilée : le temps hors chantier n'est pas payé.</div><div class="list">${L.slice(0,20).map(p=>{const e=S.employes.find(x=>x.id===p.employeId)||{};
    return `<div class="it"><div class="main"><div class="t">${esc(e.nom||'?')}</div><div class="s">${dfr(p.date)} · ${hm(p.debut)} → ${p.fin?hm(p.fin):'en cours'}</div>${ctrlFrise(p)}</div><div class="amt">${p.fin?hTxt(Math.max(0,dureeMin(p)-ptDeduit(p).min)):'…'}<small>payé</small></div></div>`}).join('')}</div></div>`}
const tpCtrl=tPointage;tPointage=function(ch){return tpCtrl(ch)+ctrlCard(ch.id)};
const vpCtrl=viewPointage;viewPointage=function(){return vpCtrl()+ctrlCard()};
