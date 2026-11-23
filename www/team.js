/* team.js — mode équipe : connexion (gérant / employés), synchronisation Firebase, accès par rubrique et par chantier,
   messages par chantier, rapports journaliers du chef de chantier, demandes de matériel */
const FB_CFG={apiKey:"AIzaSyCFoRHwCMKgozswMbN1kC1AtSCkuuXxccY",authDomain:"gestion-entreprise-1995.firebaseapp.com",projectId:"gestion-entreprise-1995",storageBucket:"gestion-entreprise-1995.firebasestorage.app",messagingSenderId:"851857071640",appId:"1:851857071640:web:d0d5cd38041de08f5fed6d"};
const OWNER='tamnowabodavid@gmail.com',ALIAS='@equipe.gestion-entreprise.app',FB_VER='13.4.0';
const APK_URL='https://github.com/tamnowabodavid-gif/GESTION-ENTREPRISE/releases/latest';
const TEAM={on:false,admin:false,user:null,me:null,users:[],fs:null,auth:null,res:null};
['messages','rapports','demandes'].forEach(c=>{if(!COLLS.includes(c)){COLLS.push(c);S[c]=S[c]||[]}});
const ROLES={chef:{l:'Chef de chantier',g:['travaux','equipe','dossier','messages','rapports','demandes']},
  ouvrier:{l:'Ouvrier',g:['messages']},
  collab:{l:'Collaborateur (architecte, ingénieur…)',g:['travaux','dossier','messages']}};
const GROUPS={travaux:{l:'🧱 Travaux (étapes, journal)',c:['etapes','journal','historique'],t:['etapes','journal']},
  equipe:{l:"⏱️ Pointage de toute l'équipe du chantier",c:['employes','pointages'],t:['pointage']},
  dossier:{l:'📁 Dossier du projet',c:['pieces'],t:['dossier']},
  messages:{l:'💬 Messages du chantier',c:['messages'],t:['messages']},
  rapports:{l:'📋 Rapports journaliers',c:['rapports'],t:['rapj']},
  demandes:{l:'🧾 Demandes de matériel',c:['demandes'],t:['demandes']}};
const gColls=g=>['chantiers',...[].concat(...g.map(k=>(GROUPS[k]||{c:[]}).c))];
const teamUid=()=>TEAM.user?TEAM.user.uid:'';
const teamNom=()=>TEAM.admin?'Gérant':(TEAM.me&&TEAM.me.nom)||'?';
function normTel(v){let t=String(v||'').replace(/\D/g,'');if(t.startsWith('00'))t=t.slice(2);if(t.length===9&&/^[26]/.test(t))t='237'+t;return t}
const telAff=t=>t&&t.startsWith('237')?'+237 '+t.slice(3).replace(/(\d)(\d{2})(\d{2})(\d{2})(\d{2})/,'$1 $2 $3 $4 $5'):(t?'+'+t:'');
function fbErr(e){const c=(e&&e.code)||'';
  if(/invalid-credential|wrong-password|invalid-login/.test(c))return'Mot de passe ou code incorrect.';
  if(/user-not-found/.test(c))return'Compte introuvable.';if(/email-already-in-use/.test(c))return'Ce compte existe déjà : connecte-toi.';
  if(/weak-password/.test(c))return'Mot de passe trop court (6 caractères minimum).';if(/invalid-email/.test(c))return'Adresse e-mail invalide.';
  if(/network-request-failed|unavailable/.test(c))return'Pas de connexion Internet. Réessaie quand le réseau revient.';
  if(/too-many-requests/.test(c))return'Trop d\'essais. Patiente quelques minutes.';if(/requires-recent-login/.test(c))return'Pour cette action, déconnecte-toi puis reconnecte-toi.';
  if(/permission-denied/.test(c))return'Accès refusé (vérifie les règles de sécurité Firebase).';
  return (e&&e.message)||'Erreur inconnue.'}
async function fbLoad(){if(window.firebase&&firebase.firestore&&firebase.auth)return;
  for(const n of ['app','auth','firestore']){try{await loadJs(`lib/firebase-${n}-compat.js`)}catch(e){await loadJs(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-${n}-compat.js`)}}}
/* ---------- démarrage ---------- */
window.teamInit=async function(){
  let local=false;try{local=localStorage.getItem('ge_local')==='1'}catch(e){}
  if(local){localSwitch();return null}
  try{await fbLoad()}catch(e){toast('Mode équipe indisponible hors connexion : données de cet appareil.');localSwitch();return null}
  if(!firebase.apps.find(a=>a.name==='[DEFAULT]'))firebase.initializeApp(FB_CFG);
  TEAM.auth=firebase.auth();TEAM.fs=firebase.firestore();
  try{TEAM.fs.enablePersistence({synchronizeTabs:true}).catch(()=>{})}catch(e){}
  return new Promise(res=>{TEAM.res=res;let first=true;
    TEAM.auth.onAuthStateChanged(async u=>{if(!first)return;first=false;
      if(u&&await teamUser(u)){res(teamDb());return}
      if(!u)loginShow()})})};
async function teamUser(u){TEAM.user=u;
  if((u.email||'').toLowerCase()===OWNER){if(!u.emailVerified){try{await u.reload()}catch(e){}}
    if(!TEAM.auth.currentUser||!TEAM.auth.currentUser.emailVerified){loginShow('verif');return false}
    TEAM.admin=true;TEAM.on=true;return true}
  let me=null;
  try{const d=await TEAM.fs.doc('users/'+u.uid).get();me=d.exists?d.data():null;if(me)localStorage.setItem('ge_me',JSON.stringify({...me,uid:u.uid}))}
  catch(e){try{const c=JSON.parse(localStorage.getItem('ge_me')||'null');if(c&&c.uid===u.uid)me=c}catch(_){}}
  if(!me||me.actif===false){try{await TEAM.auth.signOut()}catch(e){}loginShow(null,me?'Ton accès a été désactivé. Contacte le gérant.':"Ce compte n'a pas encore d'accès.");return false}
  TEAM.me=me;TEAM.on=true;return true}
function teamFinish(){closeForm();slowNote=false;if(TEAM.res){const r=TEAM.res;TEAM.res=null;r(teamDb())}}
/* accès aux données : le gérant voit tout ; les autres reçoivent seulement leurs chantiers et leurs rubriques */
function teamDb(){teamUI();
  if(TEAM.admin){TEAM.fs.collection('users').onSnapshot(s=>{TEAM.users=s.docs.map(d=>({uid:d.id,...d.data()}));scheduleRender()},()=>{});return TEAM.fs}
  const me=TEAM.me,FS=TEAM.fs,FP=firebase.firestore.FieldPath,chs=(me.chantiers||[]).slice(0,30),colls=me.colls||[];
  const vide=cb=>{setTimeout(()=>cb({docs:[],metadata:{fromCache:false,hasPendingWrites:false}}),0);return()=>{}};
  const q=c=>{const C=FS.collection(c);
    if(c==='chantiers')return chs.length?C.where(FP.documentId(),'in',chs):null;
    if(c==='employes'){if(colls.includes('employes')&&chs.length)return C.where('chantierId','in',chs);return me.employeId?C.where(FP.documentId(),'==',me.employeId):null}
    if(c==='pointages'){if(colls.includes('pointages')&&chs.length)return C.where('chantierId','in',chs);return me.employeId?C.where('employeId','==',me.employeId):null}
    return colls.includes(c)&&chs.length?C.where('chantierId','in',chs):null};
  return {collection(c){const Q=q(c),C=FS.collection(c);return{onSnapshot:(cb,er)=>Q?Q.onSnapshot(cb,er):vide(cb),doc:id=>C.doc(id)}},
    doc(p){if(p==='config/app')return FS.doc(p);
      return{onSnapshot:cb=>{setTimeout(()=>cb({exists:false,data:()=>({}),metadata:{fromCache:false,hasPendingWrites:false}}),0);return()=>{}},set:()=>Promise.resolve()}}}}
function allowedTabs(){const me=TEAM.me||{},t=[].concat(...(me.groups||[]).map(k=>(GROUPS[k]||{t:[]}).t));if(me.employeId&&!t.includes('pointage'))t.push('pointage');return t}
/* ---------- branchements dans l'application ---------- */
function teamUI(){if(teamUI.done)return;teamUI.done=true;
  Object.assign(TABS,{messages:'Messages',rapj:'Rapports du jour',demandes:'Demandes de matériel'});Object.assign(TABL,{messages:'Messages',rapj:'Rapports du jour',demandes:'Demandes'});
  if(!RUBS.find(r=>r.k==='echange'))RUBS.push({k:'echange',ic:'💬',l:'Échanges',tabs:['messages','rapj','demandes'],aide:"Messages : la discussion du chantier entre le gérant, le chef de chantier et l'équipe. Rapports du jour : chaque soir, le chef de chantier indique les présents, leur paie du jour, les travaux faits, les problèmes et les besoins. Demandes de matériel : le chef de chantier demande des matériaux, le gérant valide ou refuse."});
  const tf=tabsFor;tabsFor=function(t,ch){const o={...tf(t,ch)};o.messages='Messages';if(['cle','travaux'].includes(t)){o.rapj='Rapports du jour';o.demandes='Demandes de matériel'}
    if(TEAM.admin)return o;const ok=allowedTabs(),r={};Object.keys(o).forEach(k=>{if(ok.includes(k))r[k]=o[k]});return r};
  const vc=viewChantier;viewChantier=function(ch){const TB=tabsFor(typ(ch),ch);if(!TB[ui.tab])ui.tab=Object.keys(TB)[0]||'messages';
    const f={messages:tMessages,rapj:tRapj,demandes:tDemandes}[ui.tab];return f?rubHead(ch)+bottomNav(ch)+f(ch):vc(ch)};
  const bn=bottomNav;bottomNav=function(ch){const h=bn(ch);return TEAM.admin?h:h.replace(/<button class="fab"[\s\S]*?<\/button>/,'')};
  const vh=viewHome;viewHome=function(){return TEAM.admin?teamCard()+vh():homeEquipe()};
  const r0=render;render=function(){if(ui.view!=='acces')return r0();killCharts();document.body.classList.remove('hasnav');$('#btnBack').style.display='';
    $('#title').textContent='Équipe & accès';$('#app').innerHTML=updBanner()+viewAcces()};
  saveImg=async function(k,d){S[k]=d||'';if(!TEAM.admin)return false;try{await TEAM.fs.doc('config/sigs').set({[k]:d||''},{merge:true});sigCacheSet();return true}catch(e){toast(fbErr(e));return false}};
  sigLoad=async function(k,v){if(v&&String(v).startsWith('data:')){S[k]=v;sigIds[k]='d'+String(v).length;sigCacheSet()}};
  const db0=dataBlock;dataBlock=function(){return `<div class="note" style="margin-bottom:10px">👥 Mode équipe · connecté en tant que <b>${esc(TEAM.admin?TEAM.user.email+' (gérant)':teamNom())}</b> · <a href="#" onclick="teamLogout();return false">Se déconnecter</a></div>`+db0()};
  $('#btnSettings').onclick=()=>TEAM.admin?formReglages():monCompte();
  if(!TEAM.admin){const b=$('#btnCat');if(b)b.style.display='none'}
  const st=document.createElement('style');st.textContent=`.msgs{max-height:58vh;overflow:auto;display:flex;flex-direction:column;gap:8px;padding:2px}
.msg{background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:8px 10px;max-width:86%;align-self:flex-start;white-space:pre-wrap;word-break:break-word}
.msg.me{align-self:flex-end;background:var(--acc2);border-color:transparent}.msg .mh{font-size:11.5px;color:var(--mute);margin-bottom:2px}
.usr{border-top:1px solid var(--line);padding:10px 0}.usr:first-child{border-top:0}.chkl{display:flex;flex-direction:column;gap:6px;margin:6px 0 12px}
.rjr{display:grid;grid-template-columns:auto 1fr 90px 100px;gap:6px;align-items:center;margin-bottom:6px}.rjr input{min-width:0}
.dmr{display:grid;grid-template-columns:1fr 70px 70px;gap:6px;margin-bottom:6px}.dmr input{min-width:0}.codebig{font-size:30px;font-weight:700;letter-spacing:6px;text-align:center;padding:10px;background:var(--bg);border-radius:12px;margin:8px 0}`;
  document.head.appendChild(st)}
function localSwitch(){if(localSwitch.done)return;localSwitch.done=true;const db0=dataBlock;
  dataBlock=function(){return `<div class="note" style="margin-bottom:10px">Données de cet appareil seulement. <button type="button" class="btn small" onclick="try{localStorage.removeItem('ge_local')}catch(e){};location.reload()">👥 Se connecter (mode équipe)</button></div>`+db0()}}
/* ---------- connexion ---------- */
function loginShow(state,msg){const t=ui.loginTab||'emp',u=TEAM.auth&&TEAM.auth.currentUser;
  let b='';
  if(state==='verif')b=`<div class="note">Un e-mail de confirmation a été envoyé à <b>${esc(u?u.email:OWNER)}</b>. Ouvre le lien qu'il contient (regarde aussi dans les spams), puis touche « J'ai confirmé ».</div>
    <button class="btn block" style="margin-top:12px" onclick="lgVerif()">J'ai confirmé</button><div class="row" style="gap:6px;margin-top:8px"><button class="btn sec small" style="flex:1" onclick="lgRenvoi()">Renvoyer l'e-mail</button><button class="btn ghost small" style="flex:1" onclick="teamLogout()">Se déconnecter</button></div>`;
  else b=`<div class="seg"><button class="${t==='emp'?'on':''}" onclick="ui.loginTab='emp';loginShow()">👷 Employé</button><button class="${t==='adm'?'on':''}" onclick="ui.loginTab='adm';loginShow()">👔 Gérant</button></div>`+(t==='emp'?
    `<label class="f"><span>Numéro de téléphone</span><input id="lgTel" type="tel" inputmode="tel" placeholder="6XX XX XX XX" autocomplete="username"></label>
     <label class="f"><span>Code à 6 chiffres (donné par le gérant)</span><input id="lgCode" type="password" inputmode="numeric" autocomplete="current-password"></label>
     <button class="btn block" onclick="lgEmp()">Se connecter</button>`:
    `<label class="f"><span>E-mail du gérant</span><input id="lgMail" type="email" value="${OWNER}" autocomplete="username"></label>
     <label class="f"><span>Mot de passe</span><input id="lgPass" type="password" autocomplete="current-password"></label>
     <button class="btn block" onclick="lgAdm()">Se connecter</button>
     <div class="row" style="gap:6px;margin-top:8px"><button class="btn sec small" style="flex:1" onclick="lgCreer()">Créer mon compte (1re fois)</button><button class="btn ghost small" style="flex:1" onclick="lgOubli()">Mot de passe oublié</button></div>`);
  $('#modalRoot').innerHTML=`<div class="modal-bg"><div class="modal"><h2>Connexion</h2>${msg?`<div class="alert" style="margin-bottom:10px">${esc(msg)}</div>`:''}${b}
    <button class="btn ghost block" style="margin-top:16px" onclick="teamLocal()">Continuer sans compte (données sur cet appareil)</button></div></div>`}
async function lgEmp(){const tel=normTel($('#lgTel').value),code=$('#lgCode').value.trim();if(tel.length<9){toast('Numéro de téléphone incomplet.');return}if(code.length<6){toast('Le code fait 6 chiffres.');return}
  toast('Connexion…');try{const d=await TEAM.fs.doc('logins/'+tel).get({source:'server'});if(!d.exists){loginShow(null,"Ce numéro n'a pas d'accès. Demande au gérant de t'en créer un.");return}
    const c=await TEAM.auth.signInWithEmailAndPassword(d.data().email,code);if(await teamUser(c.user))teamFinish()}catch(e){loginShow(null,fbErr(e))}}
async function lgAdm(){const m=$('#lgMail').value.trim().toLowerCase(),p=$('#lgPass').value;if(m!==OWNER){loginShow(null,"Seul le gérant se connecte ici. Employés : onglet « Employé ».");return}
  toast('Connexion…');try{const c=await TEAM.auth.signInWithEmailAndPassword(m,p);if(await teamUser(c.user))teamFinish()}catch(e){loginShow(null,fbErr(e))}}
async function lgCreer(){const m=$('#lgMail').value.trim().toLowerCase(),p=$('#lgPass').value;if(m!==OWNER){loginShow(null,"Ce compte est réservé au gérant ("+OWNER+").");return}
  if(p.length<8){toast('Choisis un mot de passe de 8 caractères minimum.');return}
  try{const c=await TEAM.auth.createUserWithEmailAndPassword(m,p);await c.user.sendEmailVerification();loginShow('verif')}catch(e){loginShow(null,fbErr(e))}}
async function lgOubli(){const m=$('#lgMail').value.trim().toLowerCase();try{await TEAM.auth.sendPasswordResetEmail(m);toast('E-mail de réinitialisation envoyé à '+m)}catch(e){toast(fbErr(e))}}
async function lgVerif(){const u=TEAM.auth.currentUser;if(!u){loginShow();return}try{await u.reload()}catch(e){}if(TEAM.auth.currentUser.emailVerified&&await teamUser(TEAM.auth.currentUser))teamFinish();else toast("Pas encore confirmé : ouvre le lien reçu par e-mail.")}
async function lgRenvoi(){try{await TEAM.auth.currentUser.sendEmailVerification();toast('E-mail renvoyé.')}catch(e){toast(fbErr(e))}}
function teamLocal(){try{localStorage.setItem('ge_local','1')}catch(e){}closeForm();localSwitch();if(TEAM.res){const r=TEAM.res;TEAM.res=null;r(null)}else location.reload()}
async function teamLogout(){try{if(TEAM.auth)await TEAM.auth.signOut()}catch(e){}try{localStorage.removeItem('ge_me')}catch(e){}location.reload()}
function monCompte(){const me=TEAM.me||{};
  $('#modalRoot').innerHTML=`<div class="modal-bg" onclick="if(event.target===this)closeForm()"><div class="modal"><h2>Mon compte</h2>
    <div class="card"><b>${esc(me.nom||'')}</b><div class="sm mute">${esc((ROLES[me.role]||{}).l||'')} · ${esc(telAff(me.tel))}</div></div>
    <button class="btn sec block" onclick="formCode()">🔑 Changer mon code</button>
    <button class="btn sec block" style="margin-top:8px" onclick="checkUpdate&&checkUpdate(true)">🔄 Vérifier les mises à jour</button>
    <button class="btn ghost block" style="margin-top:8px" onclick="teamLogout()">Se déconnecter</button>
    <button class="btn sec block" style="margin-top:12px" onclick="closeForm()">Fermer</button></div></div>`}
function formCode(){openForm({title:'Changer mon code',fields:[{k:'a',label:'Nouveau code (6 chiffres)',type:'password'},{k:'b',label:'Répéter le code',type:'password'}],submit:'Enregistrer',
  onSave:async o=>{if(!/^\d{6}$/.test(o.a)){toast('Le code doit faire exactement 6 chiffres.');return false}if(o.a!==o.b){toast('Les deux codes sont différents.');return false}
    try{await TEAM.auth.currentUser.updatePassword(o.a);toast('Code changé.')}catch(e){toast(fbErr(e));return false}}})}
/* ---------- accueil ---------- */
function localCount(){try{const d=JSON.parse(localStorage.getItem('chantierpro2')||'null');return d?COLLS.reduce((a,c)=>a+((d[c]||[]).length),0):0}catch(e){return 0}}
function teamCard(){const n=TEAM.users.filter(u=>u.actif!==false).length,loc=localCount();
  return `<div class="card"><div class="row between"><div><b>👥 Équipe & accès</b><div class="sm mute">${n} accès actif(s) · ${esc(TEAM.user.email)}</div></div><button class="btn small" onclick="go('acces')">Gérer</button></div>
    ${loc&&!S.chantiers.length?`<div class="note" style="margin-top:8px">Cet appareil contient ${loc} élément(s) enregistré(s) avant la connexion. <button class="btn small" onclick="migrerLocal()">Les envoyer dans le cloud</button></div>`:''}</div>`}
async function migrerLocal(){let d;try{d=JSON.parse(localStorage.getItem('chantierpro2')||'null')}catch(e){}if(!d)return;
  const n=COLLS.reduce((a,c)=>a+((d[c]||[]).length),0);if(!confirm(`Envoyer ${n} élément(s) de cet appareil vers le cloud de l'entreprise ?`))return;let k=0;
  try{for(const c of COLLS){for(const r of (d[c]||[])){if(r&&r.id)await save(c,r);k++;if(k%20===0)toast(`Envoi… ${k} / ${n}`)}}
    if(d.config)await saveConfig(d.config);if(d.prixOv||d.artOv){S.prixOv=d.prixOv||{};S.artOv=d.artOv||{};await savePrix()}
    if(d.sig)await saveImg('sig',d.sig);if(d.cachet)await saveImg('cachet',d.cachet);toast(`${n} élément(s) envoyés dans le cloud.`)}catch(e){toast("L'envoi s'est arrêté : "+fbErr(e))}}
function homeEquipe(){const me=TEAM.me||{},L=[...S.chantiers].sort((a,b)=>num(b.cree)-num(a.cree)),e=me.employeId&&S.employes.find(x=>x.id===me.employeId);
  let h=`<div class="card"><div class="row between"><div><h3 style="margin:0">👋 ${esc(me.nom||'')}</h3><div class="sm mute">${esc((ROLES[me.role]||{}).l||'')}</div></div><button class="btn ghost small" onclick="monCompte()">Mon compte</button></div></div>`;
  if(e){const o=typeof ptOuvert==='function'&&ptOuvert(e.id);h+=`<button class="btn block" style="margin-bottom:12px;padding:16px;font-size:17px" onclick="pointer('${e.id}')">${o?'⏹️ Fin de journée (depuis '+hm(o.debut)+')':'▶️ Début de journée'}</button>`}
  h+=`<div class="secth">Mes chantiers</div>`;
  if(!L.length)h+=`<div class="card sm mute">Aucun chantier ne t'est encore attribué. Le gérant doit t'en donner l'accès.</div>`;
  L.forEach(c=>{const nm=S.messages.filter(m=>m.chantierId===c.id).length;h+=`<div class="card chcard" onclick="openCh('${c.id}')"><h2>${esc(c.nom)}</h2><div class="sm mute">${esc(c.lieu||'')}${nm?' · 💬 '+nm+' message(s)':''}</div></div>`});
  return h}
/* ---------- gestion des accès (gérant) ---------- */
function viewAcces(){const U=[...TEAM.users].filter(u=>!u.remplacePar).sort((a,b)=>(b.actif!==false)-(a.actif!==false)||String(a.nom).localeCompare(String(b.nom)));
  const chN=id=>(S.chantiers.find(c=>c.id===id)||{}).nom||'?';
  let h=`<button class="btn block" style="margin-bottom:12px" onclick="formAcces()">＋ Donner un accès à l'application</button>
  <div class="note" style="margin-bottom:12px">Chaque personne se connecte avec <b>son numéro</b> et <b>un code à 6 chiffres</b>. Elle ne voit que les chantiers et les rubriques que tu choisis. L'argent (devis, achats, reçus, paie, trésorerie) reste visible par toi seul.</div><div class="card">`;
  if(!U.length)h+=`<div class="sm mute">Personne n'a encore d'accès.</div>`;
  U.forEach(u=>{const on=u.actif!==false;h+=`<div class="usr"><div class="row between"><div><b>${esc(u.nom)}</b> ${chip(on?'Actif':'Désactivé',on?'ok':'bad')}<div class="sm mute">${esc((ROLES[u.role]||{}).l||u.role)} · ${esc(telAff(u.tel))}</div>
      <div class="sm mute">${(u.chantiers||[]).map(chN).map(esc).join(', ')||'Aucun chantier'} · ${(u.groups||[]).map(g=>(GROUPS[g]||{l:g}).l.split(' ')[0]).join(' ')}</div></div></div>
    <div class="row" style="gap:6px;margin-top:6px;flex-wrap:wrap"><button class="btn sec small" onclick="formAcces('${u.uid}')">Modifier</button><button class="btn sec small" onclick="nouveauCode('${u.uid}')">🔑 Nouveau code</button>
      <button class="btn ghost small" onclick="accesActif('${u.uid}',${!on})">${on?'Désactiver':'Réactiver'}</button></div></div>`});
  return h+`</div>`}
function formAcces(uid){const u=uid?TEAM.users.find(x=>x.uid===uid):null,role=u?u.role:'chef',g=u?(u.groups||[]):ROLES.chef.g,chs=u?(u.chantiers||[]):(ui.cid?[ui.cid]:[]);
  const E=S.employes.filter(e=>e.actif!==false),C=S.chantiers.filter(c=>c.statut!=='fini'||chs.includes(c.id));
  $('#modalRoot').innerHTML=`<div class="modal-bg" onclick="if(event.target===this)closeForm()"><div class="modal"><h2>${u?'Modifier l\'accès':'Donner un accès'}</h2>
    <label class="f"><span>Personne de ta liste du personnel</span><select id="acE" onchange="acPick()"><option value="">— Personne extérieure (collaborateur) —</option>${E.map(e=>`<option value="${e.id}" ${u&&u.employeId===e.id?'selected':''}>${esc(e.nom)} · ${esc(e.metier||'')}</option>`).join('')}</select></label>
    <label class="f"><span>Nom</span><input id="acN" value="${esc(u?u.nom:'')}"></label>
    <label class="f"><span>Numéro de téléphone (identifiant de connexion)</span><input id="acT" type="tel" value="${esc(u?telAff(u.tel):'')}" ${u?'disabled':''} placeholder="6XX XX XX XX"></label>
    <label class="f"><span>Rôle</span><select id="acR" onchange="acRole()">${Object.entries(ROLES).map(([k,r])=>`<option value="${k}" ${role===k?'selected':''}>${r.l}</option>`).join('')}</select></label>
    <div class="f"><span class="lbl">Chantiers</span><div class="chkl">${C.map(c=>`<label class="chk"><input type="checkbox" class="acC" value="${c.id}" ${chs.includes(c.id)?'checked':''}> ${esc(c.nom)}</label>`).join('')||'<span class="sm mute">Aucun chantier.</span>'}</div></div>
    <div class="f"><span class="lbl">Ce qu'il peut voir et faire</span><div class="chkl">${Object.entries(GROUPS).map(([k,x])=>`<label class="chk"><input type="checkbox" class="acG" value="${k}" ${g.includes(k)?'checked':''}> ${x.l}</label>`).join('')}</div>
      <div class="note">Un ouvrier lié à ta liste du personnel peut toujours faire son propre pointage (début et fin de journée).</div></div>
    ${u?'':`<label class="f"><span>Code à 6 chiffres</span><input id="acK" inputmode="numeric" value="${String(Math.floor(100000+Math.random()*900000))}"></label>`}
    <div class="row" style="margin-top:6px"><button class="btn sec" onclick="closeForm()">Annuler</button><button class="btn" style="flex:1" id="acOk" onclick="acSave('${uid||''}')">${u?'Enregistrer':'Créer l\'accès'}</button></div></div></div>`}
function acPick(){const e=S.employes.find(x=>x.id===$('#acE').value);if(!e)return;if(!$('#acN').value)$('#acN').value=e.nom||'';const t=$('#acT');if(t&&!t.disabled&&!t.value)t.value=e.tel||'';
  if(e.chantierId)document.querySelectorAll('.acC').forEach(x=>{if(x.value===e.chantierId)x.checked=true});
  if(/chef/i.test(e.metier||''))$('#acR').value='chef';else if(e.statut==='prestataire')$('#acR').value='collab';else $('#acR').value='ouvrier';acRole()}
function acRole(){const g=ROLES[$('#acR').value].g;document.querySelectorAll('.acG').forEach(x=>x.checked=g.includes(x.value))}
async function acSave(uid){const nom=$('#acN').value.trim(),role=$('#acR').value,employeId=$('#acE').value||'',chantiers=[...document.querySelectorAll('.acC:checked')].map(x=>x.value).slice(0,30),groups=[...document.querySelectorAll('.acG:checked')].map(x=>x.value);
  if(!nom){toast('Indique le nom.');return}const d={nom,role,employeId,chantiers,groups,colls:gColls(groups),maj:Date.now()};const btn=$('#acOk');btn.disabled=true;
  try{if(uid){await TEAM.fs.doc('users/'+uid).set(d,{merge:true});closeForm();toast('Accès mis à jour.');return}
    const tel=normTel($('#acT').value),code=$('#acK').value.trim();if(tel.length<9){toast('Numéro de téléphone incomplet.');btn.disabled=false;return}if(!/^\d{6}$/.test(code)){toast('Le code doit faire 6 chiffres.');btn.disabled=false;return}
    const ex=await TEAM.fs.doc('logins/'+tel).get();if(ex.exists){const o=TEAM.users.find(x=>x.uid===ex.data().uid);if(o&&o.actif!==false){toast('Ce numéro a déjà un accès : utilise « Nouveau code ».');btn.disabled=false;return}}
    const r=await creerCompte(tel,code);await TEAM.fs.doc('users/'+r.uid).set({...d,tel,alias:r.alias,actif:true,cree:Date.now()});await TEAM.fs.doc('logins/'+tel).set({email:r.alias,uid:r.uid});
    montrerCode(nom,tel,code)}catch(e){toast(fbErr(e));btn.disabled=false}}
async function creerCompte(tel,code){const sec=firebase.apps.find(a=>a.name==='sec')||firebase.initializeApp(FB_CFG,'sec'),A=sec.auth();
  try{await A.setPersistence(firebase.auth.Auth.Persistence.NONE)}catch(e){}
  const alias=tel+'.'+Math.random().toString(36).slice(2,7)+ALIAS,c=await A.createUserWithEmailAndPassword(alias,code);const id=c.user.uid;await A.signOut();return{uid:id,alias}}
function montrerCode(nom,tel,code){const txt=`Bonjour ${nom}, voici ton accès à l'application ${ent().nom||"GESTION D'ENTREPRISE"} :\n• Numéro : ${telAff(tel)}\n• Code : ${code}\nTélécharge l'application ici : ${APK_URL}\n(ouvre le fichier .apk, puis connecte-toi dans l'onglet « Employé »)`;
  $('#modalRoot').innerHTML=`<div class="modal-bg"><div class="modal"><h2>✅ Accès créé</h2><div class="sm">Donne ce code à <b>${esc(nom)}</b> (${esc(telAff(tel))}). Il ne sera plus affiché ensuite.</div><div class="codebig">${esc(code)}</div>
    <button class="btn block" onclick="ouvrirLien('https://wa.me/${tel}?text='+encodeURIComponent(${esc(JSON.stringify(txt))}))">📲 Envoyer par WhatsApp</button>
    <button class="btn sec block" style="margin-top:8px" onclick="closeForm()">Fermer</button></div></div>`}
function ouvrirLien(u){if(typeof capP==='function'&&capP('Browser'))capP('Browser').open({url:u});else window.open(u,'_blank')}
async function nouveauCode(uid){const u=TEAM.users.find(x=>x.uid===uid);if(!u)return;if(!confirm(`Créer un nouveau code pour ${u.nom} ? L'ancien code ne marchera plus.`))return;
  const code=String(Math.floor(100000+Math.random()*900000));
  try{const r=await creerCompte(u.tel,code),{uid:_,...rest}=u;await TEAM.fs.doc('users/'+r.uid).set({...rest,alias:r.alias,actif:true,maj:Date.now()});
    await TEAM.fs.doc('logins/'+u.tel).set({email:r.alias,uid:r.uid});await TEAM.fs.doc('users/'+uid).set({actif:false,remplacePar:r.uid},{merge:true});montrerCode(u.nom,u.tel,code)}catch(e){toast(fbErr(e))}}
async function accesActif(uid,on){try{await TEAM.fs.doc('users/'+uid).set({actif:on,maj:Date.now()},{merge:true});toast(on?'Accès réactivé.':'Accès désactivé : la personne ne voit plus rien.')}catch(e){toast(fbErr(e))}}
/* ---------- 💬 messages ---------- */
function tMessages(ch){const L=S.messages.filter(m=>m.chantierId===ch.id).sort((a,b)=>num(a.ts)-num(b.ts)).slice(-300),moi=teamUid();
  setTimeout(()=>{const b=$('#msgs');if(b)b.scrollTop=b.scrollHeight},0);
  return `<div class="card"><div id="msgs" class="msgs">${L.map(m=>`<div class="msg ${m.uid===moi?'me':''}"><div class="mh">${esc(m.auteur||'?')} · ${dfr(m.date)} ${hm(new Date(num(m.ts)||Date.now()).toISOString())}</div>${esc(m.texte)}</div>`).join('')||'<div class="sm mute">Aucun message. Écris le premier !</div>'}</div>
    <div class="row" style="margin-top:10px;gap:6px;align-items:flex-end"><textarea id="msgIn" rows="2" style="flex:1" placeholder="Écrire un message…" oninput="ui.msgDraft=this.value">${esc(ui.msgDraft||'')}</textarea><button class="btn" onclick="msgSend('${ch.id}')">Envoyer</button></div></div>`}
async function msgSend(cid){const t=($('#msgIn').value||'').trim();if(!t)return;ui.msgDraft='';$('#msgIn').value='';
  try{await save('messages',{chantierId:cid,texte:t,uid:teamUid(),auteur:teamNom(),date:today(),ts:Date.now()})}catch(e){}}
/* ---------- 📋 rapports journaliers ---------- */
function tRapj(ch){const L=S.rapports.filter(r=>r.chantierId===ch.id).sort((a,b)=>(b.date||'').localeCompare(a.date||'')||num(b.maj)-num(a.maj));
  let h=`<button class="btn block" style="margin-bottom:12px" onclick="formRapj('${ch.id}')">📋 Rapport du jour</button>`;
  if(!L.length)h+=`<div class="card sm mute">Aucun rapport. Chaque soir, le chef de chantier indique les présents et leur paie du jour, les travaux faits, les problèmes et les besoins.</div>`;
  L.forEach(r=>{const P=r.presents||[],tot=sum(P,p=>num(p.montant)),v=r.statut==='valide';
    h+=`<div class="card"><div class="row between"><b>${dfr(r.date)}</b>${chip(v?'Validé':'À valider',v?'ok':'warn')}</div>
    <div class="sm mute">Par ${esc(r.auteur||'?')} · ${P.length} présent(s) · Main-d'œuvre du jour : ${F(tot)}</div>
    ${r.travaux?`<div style="margin-top:6px"><b>Travaux faits :</b> ${esc(r.travaux)}</div>`:''}${r.problemes?`<div style="margin-top:4px"><b>Problèmes :</b> ${esc(r.problemes)}</div>`:''}${r.besoins?`<div style="margin-top:4px"><b>Besoins :</b> ${esc(r.besoins)}</div>`:''}
    ${P.length?`<details style="margin-top:6px"><summary class="sm">Présents et paie du jour</summary>${P.map(p=>`<div class="row between sm" style="padding:3px 0"><span>${esc(p.nom)} · ${esc(p.poste||'')}</span><span>${F(num(p.montant))}${p.momo?' · 📱 '+esc(p.momo):''}</span></div>`).join('')}</details>`:''}
    ${v&&r.validePar?`<div class="sm mute" style="margin-top:4px">Validé le ${dfr(r.valideLe)}</div>`:''}
    <div class="row" style="gap:6px;margin-top:8px">${TEAM.admin&&!v?`<button class="btn small" onclick="rapjValider('${r.id}')">✓ Valider</button>`:''}${(TEAM.admin||r.uid===teamUid())&&!v?`<button class="btn sec small" onclick="formRapj('${ch.id}','${r.id}')">Modifier</button>`:''}${TEAM.admin?`<button class="btn ghost small" onclick="if(confirm('Supprimer ce rapport ?'))del('rapports','${r.id}')">Supprimer</button>`:''}</div></div>`});
  return h}
function formRapj(cid,rid){const r=rid?S.rapports.find(x=>x.id===rid):null,E=S.employes.filter(e=>e.chantierId===cid&&e.actif!==false),P=Object.fromEntries((r?r.presents||[]:[]).map(p=>[p.employeId,p]));
  const row=e=>{const p=P[e.id],def=e.mode==='jour'?num(e.taux):'';return `<div class="rjr"><input type="checkbox" class="rjP" data-id="${e.id}" ${p||!r?'checked':''}><span class="sm">${esc(e.nom)}</span><input class="rjPo" data-id="${e.id}" value="${esc(p?p.poste:e.metier||'')}" placeholder="Poste"><input class="rjM" data-id="${e.id}" inputmode="decimal" value="${esc(p?p.montant:def)}" placeholder="FCFA"></div>`};
  $('#modalRoot').innerHTML=`<div class="modal-bg" onclick="if(event.target===this)closeForm()"><div class="modal"><h2>📋 Rapport du jour</h2>
    <label class="f"><span>Date</span><input id="rjD" type="date" value="${esc(r?r.date:today())}"></label>
    <div class="f"><span class="lbl">Présents · poste · paie du jour</span>${E.length?E.map(row).join(''):'<div class="sm mute">Aucun ouvrier n\'est rattaché à ce chantier dans la liste du personnel.</div>'}</div>
    <label class="f"><span>Travaux faits aujourd'hui</span><textarea id="rjT">${esc(r?r.travaux||'':'')}</textarea></label>
    <label class="f"><span>Problèmes rencontrés</span><textarea id="rjPb">${esc(r?r.problemes||'':'')}</textarea></label>
    <label class="f"><span>Besoins pour demain (matériaux, main-d'œuvre…)</span><textarea id="rjB">${esc(r?r.besoins||'':'')}</textarea></label>
    <div class="row" style="margin-top:6px"><button class="btn sec" onclick="closeForm()">Annuler</button><button class="btn" style="flex:1" onclick="rapjSave('${cid}','${rid||''}')">Envoyer le rapport</button></div></div></div>`}
async function rapjSave(cid,rid){const r=rid?S.rapports.find(x=>x.id===rid):null,val=(c,id)=>{const x=document.querySelector(`.${c}[data-id="${id}"]`);return x?x.value.trim():''};
  const presents=[...document.querySelectorAll('.rjP:checked')].map(x=>{const e=S.employes.find(z=>z.id===x.dataset.id)||{};return{employeId:e.id,nom:e.nom||'',poste:val('rjPo',e.id),montant:num(val('rjM',e.id)),momo:e.momo||''}});
  const d={...(r||{}),chantierId:cid,date:$('#rjD').value||today(),presents,travaux:$('#rjT').value.trim(),problemes:$('#rjPb').value.trim(),besoins:$('#rjB').value.trim(),statut:'attente'};
  if(!r){d.uid=teamUid();d.auteur=teamNom()}closeForm();try{await save('rapports',d);toast('Rapport envoyé au gérant.')}catch(e){}}
async function rapjValider(id){const r=S.rapports.find(x=>x.id===id);if(!r)return;await save('rapports',{...r,statut:'valide',validePar:teamNom(),valideLe:today()});
  const P=(r.presents||[]).filter(p=>p.momo&&num(p.montant)>0);toast(P.length?`Validé. À payer par Orange Money / MoMo : ${P.length} personne(s), ${F(sum(P,p=>num(p.montant)))}.`:'Rapport validé.')}
/* ---------- 🧾 demandes de matériel ---------- */
const DST={attente:['En attente','warn'],valide:['Validée','ok'],refuse:['Refusée','bad'],livre:['Livrée','blue']};
function tDemandes(ch){const L=S.demandes.filter(d=>d.chantierId===ch.id).sort((a,b)=>num(b.ts)-num(a.ts));
  let h=`<button class="btn block" style="margin-bottom:12px" onclick="formDemande('${ch.id}')">🧾 Nouvelle demande de matériel</button>`;
  if(!L.length)h+=`<div class="card sm mute">Aucune demande. Le chef de chantier liste ici les matériaux à acheter ; le gérant valide ou refuse.</div>`;
  L.forEach(d=>{const s=DST[d.statut]||DST.attente;h+=`<div class="card"><div class="row between"><b>${dfr(d.date)}${d.urgent?' · 🔴 Urgent':''}</b>${chip(s[0],s[1])}</div><div class="sm mute">Par ${esc(d.auteur||'?')}</div>
    <div style="margin-top:6px">${(d.lignes||[]).map(l=>`<div class="row between sm" style="padding:2px 0"><span>${esc(l.des)}</span><span>${esc(l.qte)} ${esc(l.u||'')}</span></div>`).join('')}</div>
    ${d.note?`<div class="sm" style="margin-top:4px">${esc(d.note)}</div>`:''}${d.reponse?`<div class="note" style="margin-top:6px">Réponse du gérant : ${esc(d.reponse)}</div>`:''}
    <div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap">${TEAM.admin&&d.statut!=='livre'?`${d.statut!=='valide'?`<button class="btn small" onclick="dmStatut('${d.id}','valide')">✓ Valider</button>`:''}${d.statut!=='refuse'?`<button class="btn ghost small" onclick="dmStatut('${d.id}','refuse')">Refuser</button>`:''}${d.statut==='valide'?`<button class="btn sec small" onclick="dmStatut('${d.id}','livre')">📦 Livrée</button>`:''}`:''}
      ${(d.statut||'attente')==='attente'&&(TEAM.admin||d.uid===teamUid())?`<button class="btn sec small" onclick="formDemande('${ch.id}','${d.id}')">Modifier</button>`:''}</div></div>`});
  return h}
function formDemande(cid,id){const d=id?S.demandes.find(x=>x.id===id):null,L=d?d.lignes||[]:[];const n=Math.max(3,L.length+1);
  $('#modalRoot').innerHTML=`<div class="modal-bg" onclick="if(event.target===this)closeForm()"><div class="modal"><h2>🧾 Demande de matériel</h2>
    <div class="dmr sm mute"><span>Matériau</span><span>Qté</span><span>Unité</span></div><div id="dmL">${Array.from({length:n},(_,i)=>dmRow(L[i])).join('')}</div>
    <button class="btn ghost small" onclick="$('#dmL').insertAdjacentHTML('beforeend',dmRow())">＋ Ajouter une ligne</button>
    <label class="chk" style="margin-top:10px"><input type="checkbox" id="dmU" ${d&&d.urgent?'checked':''}> 🔴 Urgent</label>
    <label class="f"><span>Remarque</span><textarea id="dmN">${esc(d?d.note||'':'')}</textarea></label>
    <div class="row" style="margin-top:6px"><button class="btn sec" onclick="closeForm()">Annuler</button><button class="btn" style="flex:1" onclick="dmSave('${cid}','${id||''}')">Envoyer au gérant</button></div></div></div>`}
const dmRow=l=>`<div class="dmr"><input class="dmD" value="${esc(l?l.des:'')}" placeholder="ex. Ciment 50 kg"><input class="dmQ" inputmode="decimal" value="${esc(l?l.qte:'')}"><input class="dmUn" value="${esc(l?l.u:'')}" placeholder="sacs"></div>`;
async function dmSave(cid,id){const d=id?S.demandes.find(x=>x.id===id):null,Q=[...document.querySelectorAll('.dmQ')],U=[...document.querySelectorAll('.dmUn')];
  const lignes=[...document.querySelectorAll('.dmD')].map((x,i)=>({des:x.value.trim(),qte:Q[i].value.trim(),u:U[i].value.trim()})).filter(l=>l.des);
  if(!lignes.length){toast('Ajoute au moins un matériau.');return}
  const o={...(d||{uid:teamUid(),auteur:teamNom(),date:today(),ts:Date.now(),statut:'attente'}),chantierId:cid,lignes,urgent:$('#dmU').checked,note:$('#dmN').value.trim()};
  closeForm();try{await save('demandes',o);toast('Demande envoyée au gérant.')}catch(e){}}
function dmStatut(id,st){const d=S.demandes.find(x=>x.id===id);if(!d)return;
  if(st==='refuse'){openForm({title:'Refuser la demande',fields:[{k:'r',label:'Motif (visible par le chef de chantier)',type:'textarea'}],submit:'Refuser',onSave:o=>save('demandes',{...d,statut:'refuse',reponse:o.r})});return}
  save('demandes',{...d,statut:st,reponse:d.reponse||''}).then(()=>toast(st==='valide'?'Demande validée.':'Marquée comme livrée.'))}
