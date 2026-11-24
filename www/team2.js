/* team2.js — mode équipe (suite) : accès des clients, fournisseurs, magasiniers et partenaires ; messages privés et documents
   « lecteurs » (seules les personnes concernées les reçoivent) ; fiches de paie de l'employé ; photos stockées dans Firestore ;
   contrôle de présence en arrière-plan sur Android */
Object.assign(ROLES,{client:{l:"Maître d'ouvrage (client)",g:['travaux','dossier','argentClient','messages']},
  fournisseur:{l:'Fournisseur',g:['commandes']},partenaire:{l:'Partenaire / sous-traitant',g:['travaux','messages']},
  magasinier:{l:'Magasinier',g:['magasin','messages','demandes']}});
Object.assign(GROUPS,{argentClient:{l:'💳 Devis, contrat, factures et reçus (pour le client)',c:['devis','contrats','factures','recus'],t:['devis','contrat','factures','recus']},
  magasin:{l:'📦 Stock, achats, bons et réception des livraisons',c:['achats','bons','mouvements','stockcfg','dprix'],t:['achats','stock','commandes']},
  commandes:{l:'🧾 Ses demandes de prix et bons de commande (fournisseur)',c:[],t:[]}});
const LCOLLS=['messages','dprix','bons','fiches'];
const ROLE_F={mo:'client',four:'fournisseur',mag:'magasinier',part:'partenaire',stt:'partenaire',chef:'chef',chefEq:'chef',cond:'chef'};
/* ---------- « lecteurs » : qui reçoit un document privé ---------- */
function lecteursDe(c,o){const set=new Set();
  if(c==='messages')(o.membres||[]).forEach(x=>{if(x!=='gerant')set.add(x)});
  if(c==='dprix')(o.fourns||[]).forEach(x=>set.add(x));
  if(c==='bons'&&o.fournId)set.add(o.fournId);
  if(c==='fiches'&&o.employeId)set.add('emp:'+o.employeId);
  return (TEAM.users||[]).filter(u=>u.actif!==false&&!u.remplacePar&&[u.uid,...(u.ids||[])].some(i=>set.has(i))).map(u=>u.uid).sort()}
const svT2=save;save=async function(c,o){if(TEAM.on&&o){if(LCOLLS.includes(c)){if(TEAM.admin)o={...o,lecteurs:lecteursDe(c,o)};else o={...o,lecteurs:[...new Set([...(o.lecteurs||[]),teamUid()])]}}
    if(c==='messages'&&!TEAM.admin)o={...o,uid:teamUid()}}
  return svT2(c,o)};
/* quand les accès changent, le gérant remet à jour les lecteurs des documents déjà envoyés */
let lecSig='';async function lecteursRefresh(){if(!TEAM.admin||!TEAM.fs)return;const sig=JSON.stringify((TEAM.users||[]).map(u=>[u.uid,u.actif,u.ids]));if(sig===lecSig)return;lecSig=sig;
  for(const c of LCOLLS)for(const d of S[c]||[]){const l=lecteursDe(c,d);if(JSON.stringify(l)!==JSON.stringify([...(d.lecteurs||[])].sort())){try{await TEAM.fs.collection(c).doc(d.id).set({lecteurs:l},{merge:true})}catch(e){}}}}
setInterval(()=>{if(TEAM.admin&&(TEAM.users||[]).length)lecteursRefresh()},20000);
/* ---------- données reçues par un membre (non gérant) ---------- */
function mergeSnap(srcs,cb){const parts=srcs.map(()=>null);const off=srcs.map((s,i)=>s.onSnapshot(x=>{parts[i]=x;emit()},()=>{parts[i]={docs:[],metadata:{fromCache:false}};emit()}));
  function emit(){const m=new Map();parts.forEach(p=>p&&p.docs.forEach(d=>m.set(d.id,d)));cb({docs:[...m.values()],metadata:{fromCache:parts.some(p=>!p||(p.metadata&&p.metadata.fromCache)),hasPendingWrites:false}})}
  return()=>off.forEach(f=>{try{f()}catch(e){}})}
const tdb2=teamDb;teamDb=function(){const R=tdb2();if(TEAM.admin)return R;const me=TEAM.me||{},FS=TEAM.fs,FP=firebase.firestore.FieldPath,u=teamUid(),iv=(me.interv||[]).slice(0,10);
  const extra=c=>{const C=FS.collection(c),L=[];
    if(LCOLLS.includes(c))L.push(C.where('lecteurs','array-contains',u));
    if(c==='messages')L.push(C.where('chantierId','==','_general'));
    if(c==='fiches'&&me.employeId)L.push(C.where('employeId','==',me.employeId));
    if(c==='intervenants'&&iv.length)L.push(C.where(FP.documentId(),'in',iv));
    if(c==='reglacc')L.push(C.where('uid','==',u));
    return L};
  return{...R,collection(c){const b=R.collection(c),L=extra(c);if(!L.length)return b;const C=FS.collection(c);return{doc:id=>C.doc(id),onSnapshot:cb=>mergeSnap([b,...L],cb)}}}};
/* ---------- donner un accès à un intervenant (client, fournisseur, magasinier…) ---------- */
const faT2=formAcces;formAcces=function(uid){faT2(uid);const u=uid?TEAM.users.find(x=>x.uid===uid):null,I=(S.intervenants||[]).filter(i=>i.actif!==false),sel=(u&&u.interv||[])[0]||'';
  const e=$('#acE');if(!e)return;e.closest('label').insertAdjacentHTML('afterend',`<label class="f"><span>Ou intervenant d'un projet (client, fournisseur, magasinier…)</span><select id="acI" onchange="acPickI()"><option value="">—</option>${I.map(i=>`<option value="${i.id}" ${sel===i.id?'selected':''}>${esc(i.nom)} · ${esc(FNC(i.fonction).l)} · ${esc((S.chantiers.find(c=>c.id===i.chantierId)||{}).nom||'')}</option>`).join('')}</select></label>`)};
function acPickI(){const i=S.intervenants.find(x=>x.id===$('#acI').value);if(!i)return;$('#acN').value=i.nom||'';const t=$('#acT');if(t&&!t.disabled)t.value=i.tel||'';
  if(i.employeId)$('#acE').value=i.employeId;document.querySelectorAll('.acC').forEach(x=>{if(x.value===i.chantierId)x.checked=true});
  const r=ROLE_F[i.fonction]||(/Administration/.test(FNC(i.fonction).grp)?'collab':/Conception|Pilotage/.test(FNC(i.fonction).grp)?'collab':'ouvrier');$('#acR').value=r;acRole()}
acSave=async function(uid){const nom=$('#acN').value.trim(),role=$('#acR').value,employeId=$('#acE').value||'',ivId=($('#acI')||{}).value||'',chantiers=[...document.querySelectorAll('.acC:checked')].map(x=>x.value).slice(0,30),groups=[...document.querySelectorAll('.acG:checked')].map(x=>x.value);
  if(!nom){toast('Indique le nom.');return}const interv=ivId?[ivId]:[];const ids=u0=>[u0,employeId?'emp:'+employeId:null,...interv].filter(Boolean);
  const d={nom,role,employeId,interv,chantiers,groups,colls:gColls(groups),maj:Date.now()};const btn=$('#acOk');btn.disabled=true;
  try{if(uid){await TEAM.fs.doc('users/'+uid).set({...d,ids:ids(uid)},{merge:true});closeForm();toast('Accès mis à jour.');lecSig='';return}
    const tel=normTel($('#acT').value),code=$('#acK').value.trim();if(tel.length<9){toast('Numéro de téléphone incomplet.');btn.disabled=false;return}if(!/^\d{6}$/.test(code)){toast('Le code doit faire 6 chiffres.');btn.disabled=false;return}
    const ex=await TEAM.fs.doc('logins/'+tel).get();if(ex.exists){const o=TEAM.users.find(x=>x.uid===ex.data().uid);if(o&&o.actif!==false){toast('Ce numéro a déjà un accès : utilise « Nouveau code ».');btn.disabled=false;return}}
    const r=await creerCompte(tel,code);await TEAM.fs.doc('users/'+r.uid).set({...d,ids:ids(r.uid),tel,alias:r.alias,actif:true,cree:Date.now()});await TEAM.fs.doc('logins/'+tel).set({email:r.alias,uid:r.uid});
    if(ivId){const i=S.intervenants.find(x=>x.id===ivId);if(i)await save('intervenants',{...i,uid:r.uid,acces:true})}
    lecSig='';montrerCode(nom,tel,code)}catch(e){toast(fbErr(e));btn.disabled=false}};
const nc2=nouveauCode;nouveauCode=async function(uid){await nc2(uid);setTimeout(async()=>{const old=TEAM.users.find(x=>x.uid===uid),nu=old&&old.remplacePar;if(nu){try{await TEAM.fs.doc('users/'+nu).set({ids:[nu,...(old.ids||[]).filter(x=>x!==uid)]},{merge:true})}catch(e){}lecSig=''}},3000)};
if(typeof intAppli==='function')intAppli=function(id){const i=S.intervenants.find(x=>x.id===id);if(!i)return;if(!TEAM.admin){toast("Seul le gérant donne les accès.");return}closeForm();formAcces();setTimeout(()=>{const s=$('#acI');if(s){s.value=id;acPickI()}},60)};
/* ---------- accueil des fournisseurs : demandes de prix et commandes ---------- */
const rdT2=render;render=function(){rdT2.apply(this,arguments);try{if(!TEAM.on||TEAM.admin||ui.view!=='home')return;const me=TEAM.me||{},iv=me.interv||[];if(!iv.length)return;const app=$('#app');if(!app||app.querySelector('.fcard'))return;
  const D=S.dprix.filter(d=>(d.fourns||[]).some(f=>iv.includes(f))&&d.statut!=='annulee'),B=S.bons.filter(b=>iv.includes(b.fournId)&&(b.statut||'emis')!=='annule');if(!D.length&&!B.length)return;
  const f=iv[0];let h=`<div class="card fcard"><h3>📨 Mes demandes de prix</h3>${D.length?`<div class="list">${D.map(d=>{const r=(d.reponses||{})[f];return `<div class="it"><div class="main"><div class="t">${esc(d.numero)} ${r?chip('prix envoyés','ok'):chip('à remplir','warn')}</div><div class="s">${d.lignes.length} article(s) · ${dfr(d.date)}${d.livDate?' · livraison le '+dfr(d.livDate):''}</div></div>${d.statut!=='commandee'?`<button class="btn small" onclick="dpRepondre('${d.id}','${f}')">${r?'Modifier':'Remplir'}</button>`:chip('commandée','blue')}</div>`}).join('')}</div>`:'<div class="sm mute">Aucune demande en cours.</div>'}</div>
  <div class="card fcard"><h3>🧾 Mes commandes</h3>${B.length?`<div class="list">${B.map(b=>`<div class="it"><div class="main"><div class="t">${esc(b.numero)} · ${F(totL(b.lignes))}</div><div class="s">${b.statut==='livre'?'✅ réceptionnée'+(b.recep&&b.recep.ecarts&&b.recep.ecarts.length?' avec écarts':''):b.fLiv?'🚚 livrée le '+dfr(b.fLiv.date)+', en attente de réception':b.fConf?'✅ confirmée · livraison le '+dfr(b.fConf.liv):'à confirmer'}</div></div>${b.statut!=='livre'?(!b.fConf?`<button class="btn small" onclick="bcConfirmer('${b.id}')">Confirmer</button>`:!b.fLiv?`<button class="btn small" onclick="bcLivrer('${b.id}')">J'ai livré</button>`:''):''}</div>`).join('')}</div>`:'<div class="sm mute">Aucune commande.</div>'}</div>`;
  const rc=app.querySelector('.rgcard');(rc||app.firstElementChild)?(rc||app.firstElementChild).insertAdjacentHTML('afterend',h):app.insertAdjacentHTML('afterbegin',h)}catch(e){}};
/* messages du fournisseur : signés de son propre compte */
if(typeof msgDe==='function'){const md2=msgDe;msgDe=function(i,o){return TEAM.admin?md2(i,o):save('messages',{conv:'int:'+i.id,chantierId:'_dm',membres:['gerant',i.id],date:today(),ts:Date.now(),uid:teamUid(),auteur:i.nom,...o,uid:teamUid()})}}
/* ---------- photos : enregistrées dans Firestore (pas de stockage de fichiers payant) ---------- */
const BLOBS={},BLOBQ={};
window.teamUpload=async function(blob,o={}){const type=o.type||blob.type||'image/jpeg';let d;
  if(type.startsWith('image/')){let r=await compressImage(blob,1280,0.7);d=await blobToUrl(r.blob||r);if(d.length>900000){r=await compressImage(blob,960,0.55);d=await blobToUrl(r.blob||r)}}
  else{if(blob.size>700000)throw{code:'fichier-trop-lourd'};d=await blobToUrl(blob)}
  const id=uid();await TEAM.fs.doc('blobs/'+id).set({d,type,uid:teamUid(),cree:Date.now()});BLOBS[id]=d;return{id}};
function blobGet(id){if(BLOBS[id]||BLOBQ[id]||!TEAM.fs)return;BLOBQ[id]=TEAM.fs.doc('blobs/'+id).get().then(s=>{if(s.exists){BLOBS[id]=s.data().d;blobFix()}}).catch(()=>{})}
const blobId=s=>{const m=String(s||'').match(/_blob\/([^'")?&\s]+)/);return m?decodeURIComponent(m[1]):null};
let bfq=false;function blobFix(){if(bfq)return;bfq=true;requestAnimationFrame(()=>{bfq=false;
  document.querySelectorAll('img[src*="_blob/"]').forEach(el=>{const id=blobId(el.getAttribute('src'));if(!id)return;if(BLOBS[id])el.src=BLOBS[id];else blobGet(id)});
  document.querySelectorAll('[style*="_blob/"]').forEach(el=>{const id=blobId(el.getAttribute('style'));if(!id)return;if(BLOBS[id])el.style.backgroundImage=`url("${BLOBS[id]}")`;else blobGet(id)})})}
new MutationObserver(()=>blobFix()).observe(document.body,{childList:true,subtree:true});
viewAsset=function(id,type){const d=BLOBS[id];if(!d){blobGet(id);toast('Chargement…');return}
  if(type==='application/pdf'){fetch(d).then(r=>r.blob()).then(b=>downloads.save({filename:'document.pdf',data:b})).catch(()=>toast("Impossible d'ouvrir le PDF"));return}
  $('#viewerRoot').innerHTML=`<div class="viewer" onclick="this.remove()"><img src="${d}" alt=""><div class="sm" style="color:#fff;margin-top:10px">Toucher pour fermer</div></div>`};
/* ---------- Android : contrôle de présence même téléphone en poche ---------- */
if(typeof isNative==='function'&&isNative()){const BG=()=>capP('BackgroundGeolocation');let wid=null,last=null;const H=[];
  async function bgStart(){const P=BG();if(!P||wid)return;try{wid=await P.addWatcher({backgroundTitle:(ent().nom||"GESTION D'ENTREPRISE")+' · présence',backgroundMessage:"Contrôle de présence actif jusqu'à ta fin de journée.",requestPermissions:true,stale:false,distanceFilter:20},
      (loc,err)=>{if(err){if(err.code==='NOT_AUTHORIZED'&&confirm("Pour valider tes heures, autorise la position « Toujours » dans les réglages. Ouvrir les réglages ?"))P.openSettings();return}
        if(!loc)return;last={lat:loc.latitude,lng:loc.longitude,acc:Math.round(loc.accuracy||0),t:Date.now()};H.push(last);if(H.length>500)H.shift();
        const id=moi();if(id&&ptOuvert(id))ctrlVerifier(id).catch(()=>{})})}catch(e){wid=null}}
  async function bgStop(){const P=BG();if(P&&wid){try{await P.removeWatcher({id:wid})}catch(e){}}wid=null;last=null;H.length=0}
  /* pendant la surveillance, la dernière position reste valable tant que la personne n'a pas bougé de plus de 20 m */
  const gp2=getPos;getPos=function(){return wid&&last?Promise.resolve({lat:last.lat,lng:last.lng,acc:last.acc}):gp2()};
  window.ctrlManque=function(t,lp){if(!wid||!lp)return{ts:t,ok:false,manque:true};const p=[...H].reverse().find(x=>x.t<=t);if(!p)return{ts:t,ok:false,manque:true};const d=Math.round(distM(p,lp));return{ts:t,ok:d<=lp.r+Math.min(p.acc||0,50),dist:d,acc:p.acc,bg:true}};
  setInterval(()=>{const id=typeof moi==='function'&&moi();if(id&&ptOuvert(id))bgStart();else if(wid)bgStop()},15000)}
