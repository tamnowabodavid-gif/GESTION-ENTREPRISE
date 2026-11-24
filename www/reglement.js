/* reglement.js — règlement intérieur personnalisé (selon le poste), « Ton chantier en ce moment » (avancement, délais, tâches),
   confidentialité ; affiché à la 1re connexion de chaque personne avec acceptation, envoyé dans la messagerie, modifiable par le gérant */
if(!COLLS.includes('reglacc')){COLLS.push('reglacc');S.reglacc=S.reglacc||[]}
const RGDEF={debut:'07:30',fin:'17:00',pause:'12:00 – 13:00',tol:15,rapport:'18:00',preavis:'la veille'};
const RGPROF={ouvrier:'Ouvriers et corps de métier',chef:"Chef de chantier et chefs d'équipe",bureau:'Personnel du bureau',etudes:'Études et maîtrise d\'œuvre',client:"Maître d'ouvrage (client)",externe:'Partenaires, sous-traitants et fournisseurs'};
const INT_=['ouvrier','chef','bureau','etudes'],TER_=['ouvrier','chef'];
/* modèles : {mots} remplacés à l'affichage ; « - » = puce, « 1. » = étape numérotée */
const RGSEC=[
 {id:'bienvenue',ic:'👋',t:'Bienvenue',pour:[...INT_,'client','externe'],txt:`Bienvenue {nom} ! Tu fais partie du projet « {chantier} » avec {entreprise}, en tant que {poste}.
Ce document explique comment utiliser l'application et les règles à respecter. Lis-le jusqu'au bout : en l'acceptant, tu t'engages à le respecter.`},
 {id:'appli',ic:'📱',t:"Utiliser l'application",pour:INT_,txt:`- Connecte-toi avec ton numéro de téléphone et le code à 6 chiffres donné par le gérant. Ne donne jamais ton code à quelqu'un d'autre.
- L'écran d'accueil te montre : le bouton de pointage, tes chantiers et la messagerie.
- Garde ton téléphone chargé, avec internet et la localisation (GPS) activés pendant le travail.
- Tes messages, ta fiche de paie et les consignes arrivent dans la messagerie de l'application : consulte-la chaque jour.`},
 {id:'pointage',ic:'⏱️',t:'Valider ta journée : le pointage',pour:TER_,txt:`Ta paie est calculée uniquement à partir de tes pointages. Chaque jour :
1. Présente-toi sur le chantier « {chantier} » à l'heure.
2. Ouvre l'application et appuie sur « ▶️ Début de journée ». L'application vérifie que tu es bien sur le chantier (à moins de {rayon} m).
3. À la fin du travail, toujours sur le chantier, appuie sur « ⏹️ Fin de journée » : tes heures sont alors enregistrées.
- Pendant la journée, l'application vérifie ta position toutes les heures, jusqu'à « Fin de journée ». Garde le téléphone sur toi, allumé, avec le GPS activé.
- Si un contrôle te trouve hors du chantier, tu reçois un avertissement. Au 2e contrôle raté d'affilée, le temps passé hors du chantier n'est pas payé, jusqu'à ce que ta présence soit de nouveau confirmée.
- Un pointage fait hors du chantier, ou sans GPS, est refusé : la journée n'est pas payée.
- Sans « Fin de journée », la journée n'est pas comptée.
- Ne pointe jamais pour un collègue et ne prête pas ton téléphone pour pointer : c'est une fraude.
- En cas d'oubli ou de problème de téléphone, préviens {chef} le jour même. Seul le gérant peut corriger un pointage.`},
 {id:'horaires',ic:'🕖',t:'Horaires et ponctualité',pour:INT_,txt:`- Horaires : de {debut} à {fin}, pause de {pause}.
- Sois à l'heure. Au-delà de {tol} minutes de retard, préviens {sup} par message avant d'arriver.
- Les retards répétés sont sanctionnés ; les heures non travaillées ne sont pas payées.
- On ne quitte pas le chantier avant l'heure sans l'accord de {chef}.`},
 {id:'paie',ic:'💵',t:'Ta paie',pour:INT_,txt:`- Tu es payé {rythme}, d'après les journées validées par ton pointage.
- À chaque paie, tu reçois ta fiche de paie dans la messagerie de l'application. Vérifie-la ; s'il y a une erreur, écris au gérant dans les 48 heures.
- Mode de paiement : {mode}.
- Une avance sur salaire se demande au gérant ; elle est retirée de la paie suivante et apparaît sur ta fiche.`},
 {id:'rapport',ic:'📝',t:'Le rapport de chaque journée',pour:['ouvrier'],txt:`- Avant de partir, dis à {sup} ce que tu as fait dans la journée.
- Signale tout de suite tout problème : malfaçon, matériau manquant ou abîmé, outil cassé, danger.
- Tu peux aussi l'écrire dans la discussion du chantier, avec une photo si utile.`},
 {id:'rapportChef',ic:'📝',t:'Le rapport journalier du chantier',pour:['chef'],txt:`Chaque jour avant {rapport}, envoie le rapport du jour dans l'application (Rapports du jour) avec :
- les présents et absents ;
- les travaux faits et l'avancement des étapes (coche les sous-étapes terminées) ;
- les problèmes rencontrés et les décisions à prendre ;
- les besoins en matériaux pour les jours suivants (Demandes de matériel), avec photos.
Un chantier sans rapport est considéré comme non suivi ce jour-là.`},
 {id:'referer',ic:'🧭',t:"À qui t'adresser",pour:INT_,txt:`- Ton responsable direct : {sup}.
- Chef de chantier : {chef}.
- Gérant : {gerant}.
- Un problème sur le travail, un accident, un manque de matériel : préviens {sup} immédiatement. Sans réponse, écris au gérant.
- Utilise la messagerie de l'application : les échanges y restent écrits et datés.`},
 {id:'absence',ic:'📅',t:'Absences',pour:INT_,txt:`- Toute absence se signale à l'avance, au plus tard {preavis}, par message privé à {sup} et au gérant dans l'application.
- En cas d'urgence (maladie, décès…), préviens avant {debut} le jour même et apporte un justificatif dès ton retour.
- Une absence non signalée n'est pas payée et peut être sanctionnée.`},
 {id:'securite',ic:'🦺',t:'Sécurité sur le chantier',pour:[...TER_,'externe'],txt:`- Porte les protections : casque, chaussures de sécurité, gants ; harnais pour tout travail en hauteur.
- Alcool et drogues sont interdits sur le chantier ; une personne en état d'ivresse est renvoyée pour la journée, sans paie.
- Ne touche pas aux installations électriques si ce n'est pas ton métier.
- Garde le chantier propre et rangé ; signale tout danger à {chef}.
- En cas d'accident, préviens immédiatement {chef} et le gérant.`},
 {id:'materiel',ic:'🔒',t:'Matériel, matériaux et vol',pour:[...INT_,'externe'],txt:`- Le vol est strictement interdit : matériaux, outils, carburant, matériel du client ou des voisins. Il entraîne le renvoi immédiat et peut être signalé aux autorités.
- Aucun matériau ne sort du chantier sans l'accord écrit du gérant.
- Les outils confiés sont rendus en fin de journée ; une perte ou une casse doit être signalée le jour même.
- Évite le gaspillage (ciment, fer, eau, carburant).`},
 {id:'conduite',ic:'🤝',t:'Comportement',pour:[...INT_,'externe'],txt:`- Respect envers les collègues, le client, les voisins et les passants. Violence, insultes et harcèlement sont interdits.
- Ne donne pas d'informations sur le chantier (prix, plans, client) à des personnes extérieures.
- Le client s'adresse au gérant ou au chef de chantier ; ne prends aucun engagement à sa place.`},
 {id:'confid',ic:'🔐',t:'Confidentialité et tes données',pour:[...INT_,'client','externe'],txt:`- Les plans, prix, documents et photos du projet sont confidentiels : ne les partage pas en dehors de l'application sans l'accord du gérant.
- L'application enregistre : ton nom, ton téléphone, tes pointages (heure et position GPS au moment du pointage uniquement), ta paie et tes messages.
- Ces informations servent à organiser le travail et à calculer la paie. Seuls le gérant et les personnes qu'il autorise y ont accès ; elles ne sont jamais revendues.
- Tu peux demander à voir ou corriger tes informations auprès du gérant.
La politique de confidentialité complète est consultable dans le menu ☰ › Confidentialité.`},
 {id:'sanctions',ic:'⚖️',t:'Sanctions',pour:INT_,txt:`Selon la gravité : rappel à l'ordre, avertissement écrit, retenue des heures non travaillées, mise à pied, fin de la collaboration ou licenciement, dans le respect du Code du travail.`},
 {id:'client',ic:'🏠',t:'Pour vous, maître d\'ouvrage',pour:['client'],txt:`- Vous suivez dans l'application l'avancement des étapes, les photos et les documents que l'entreprise vous ouvre.
- Votre interlocuteur est le gérant, {gerant}. Sur le chantier, le chef de chantier est {chef}.
- Les demandes de modification se font par écrit, dans la messagerie : elles peuvent changer le prix et les délais.
- Pour votre sécurité, les visites de chantier se font en présence du chef de chantier, avec un casque.`},
 {id:'externe',ic:'🏪',t:'Pour nos partenaires',pour:['externe'],txt:`- Votre interlocuteur est {sup}.
- Les bons de commande et consignes vous sont envoyés dans la messagerie de l'application : confirmez leur réception.
- Les livraisons se font pendant les heures du chantier ({debut} – {fin}), en prévenant {chef}.
- Sur le chantier, les règles de sécurité ci-dessus s'appliquent à votre personnel.`}];
const rgCfg=()=>({...RGDEF,v:1,sec:{},extra:'',...(ent().reglement||{})});
/* ---------- qui est la personne ---------- */
function rgProfil(p){if(p.interv){const f=FNC(p.interv.fonction);if(['chef','chefEq','cond'].includes(f.k))return'chef';if(f.k==='mo')return'client';if(/Partenaires/.test(f.grp))return'externe';if(/Administration/.test(f.grp))return'bureau';if(/Conception|Pilotage/.test(f.grp))return'etudes';return'ouvrier'}
  if(p.role){return{chef:'chef',ouvrier:'ouvrier',collab:'etudes'}[p.role]||'ouvrier'}
  const e=p.employe||{};if((e.chantierId||'bureau')==='bureau')return'bureau';if(/chef/i.test(e.metier||''))return'chef';if(e.statut==='prestataire')return'etudes';return'ouvrier'}
function rgPersonne(k){/* k = 'e:<employeId>' | 'i:<intervenantId>' | 'me' */
  let employe=null,interv=null,role=null,nom='';
  if(k==='me'&&typeof TEAM!=='undefined'&&TEAM.on){const me=TEAM.me||{};role=me.role;nom=me.nom||'';employe=me.employeId&&S.employes.find(e=>e.id===me.employeId);interv=(S.intervenants||[]).find(i=>employe&&i.employeId===employe.id&&i.actif!==false)||null}
  else if(k.startsWith('e:')){employe=S.employes.find(e=>e.id===k.slice(2));interv=employe&&(S.intervenants||[]).find(i=>i.employeId===employe.id&&i.actif!==false)||null}
  else if(k.startsWith('i:')){interv=(S.intervenants||[]).find(i=>i.id===k.slice(2));employe=interv&&interv.employeId&&S.employes.find(e=>e.id===interv.employeId)||null}
  nom=nom||(employe&&employe.nom)||(interv&&interv.nom)||'';
  const cid=(interv&&interv.chantierId)||(employe&&employe.chantierId)||((typeof TEAM!=='undefined'&&TEAM.me&&(TEAM.me.chantiers||[])[0])||'');
  const p={k,nom,employe,interv,role,cid};p.profil=rgProfil(p);
  p.poste=interv?FNC(interv.fonction).l:(employe&&employe.metier)||(role&&ROLES&&ROLES[role]?ROLES[role].l:'membre de l\'équipe');return p}
function rgChef(cid){const i=(S.intervenants||[]).find(x=>x.chantierId===cid&&x.fonction==='chef'&&x.actif!==false);if(i)return i.nom;const e=S.employes.find(x=>x.chantierId===cid&&x.actif!==false&&/chef de chantier/i.test(x.metier||''));return e?e.nom:null}
function rgCtx(p){const R=rgCfg(),E=ent(),ch=S.chantiers.find(c=>c.id===p.cid)||{},G=E.signataire?E.signataire+' (gérant)':'le gérant',chef=rgChef(p.cid),e=p.employe||{};
  let sup=null;if(p.interv&&p.interv.sup&&typeof intNom==='function')sup=intNom(p.interv.sup);if(!sup||/^\?$/.test(sup))sup=p.profil==='ouvrier'&&chef&&chef!==p.nom?'le chef de chantier, '+chef:G;
  const pos=p.cid&&typeof lieuPos==='function'?lieuPos(p.cid):null;
  return{nom:p.nom||'',entreprise:E.nom||'l\'entreprise',poste:(p.poste||'').toLowerCase(),chantier:ch.nom||(p.cid==='bureau'?'Bureau':'ton chantier'),gerant:G,chef:chef&&chef!==p.nom?chef:(chef?'toi-même (chef de chantier)':G),sup,
    rayon:pos?pos.r:(typeof PR==='function'?PR().rayon:150),debut:R.debut,fin:R.fin,pause:R.pause,tol:R.tol,rapport:R.rapport,preavis:R.preavis,
    rythme:(typeof PERIODES!=='undefined'?(PERIODES[e.periode||'semaine']||'chaque semaine'):'chaque semaine').toLowerCase(),mode:(e.momoOp||'espèces')+(e.momo?' ('+e.momo+')':'')}}
const rgFill=(t,c)=>String(t).replace(/\{(\w+)\}/g,(m,k)=>c[k]!=null?c[k]:m);
function rgHtml(t){const L=String(t).split('\n');let h='',ul=null;const close=()=>{if(ul){h+=`</${ul}>`;ul=null}};
  L.forEach(l=>{const s=l.trim();let m;if(!s){close();return}
    if(m=s.match(/^- (.*)/)){if(ul!=='ul'){close();h+='<ul>';ul='ul'}h+=`<li>${esc(m[1])}</li>`}
    else if(m=s.match(/^\d+\. (.*)/)){if(ul!=='ol'){close();h+='<ol>';ul='ol'}h+=`<li>${esc(m[1])}</li>`}
    else{close();h+=`<p>${esc(s)}</p>`}});close();return h.replace(/« ([^»]+) »/g,'« <b>$1</b> »')}
function rgSections(p){const R=rgCfg(),c=rgCtx(p);
  const L=RGSEC.filter(s=>s.pour.includes(p.profil)&&!(R.sec[s.id]||{}).off).map(s=>({id:s.id,ic:s.ic,t:s.t,html:rgHtml(rgFill((R.sec[s.id]||{}).txt||s.txt,c))}));
  if(R.extra&&R.extra.trim())L.push({id:'extra',ic:'📌',t:'Règles particulières de l\'entreprise',html:rgHtml(rgFill(R.extra,c))});return L}
/* ---------- « Ton chantier en ce moment » : avancement, délais, tâches ---------- */
function rgChantier(p){const ch=S.chantiers.find(c=>c.id===p.cid);if(!ch)return'';const td=today(),ets=(typeof etTri==='function'?etTri(etapesOf(ch.id)):etapesOf(ch.id));
  const f=p.interv?FNC(p.interv.fonction):null,mes=f&&(p.interv.etapes&&p.interv.etapes.length?p.interv.etapes:f.et)||null;
  const mien=e=>{if(!mes||!mes.length)return true;const k=e.lib||(typeof etMatch==='function'&&(etMatch(e.nom)||{}).k);return mes.includes(k)};
  const av=Math.round(ets.length?sum(ets,e=>num(e.avancement))/ets.length:0),enc=ets.filter(e=>e.statut==='encours'||(num(e.avancement)>0&&num(e.avancement)<100)),suiv=ets.find(e=>!num(e.avancement)&&e.statut!=='fini');
  const jr=d=>{const n=Math.round((new Date(d)-new Date(td))/864e5);return n<0?`<b style="color:var(--bad,#b42318)">en retard de ${-n} j</b>`:n===0?'<b>aujourd\'hui</b>':`dans ${n} j`};
  let h=`<div class="rgch"><div class="row between"><b>🏗️ ${esc(ch.nom)}</b><span class="sm">${av} %</span></div><div class="bar ok" style="margin:6px 0"><i style="width:${av}%"></i></div>
    <div class="sm mute">${esc(ch.lieu||'')}${ch.fin?` · fin prévue le ${dfr(ch.fin)} (${jr(ch.fin)})`:''}</div></div>`;
  const E2=enc.filter(mien);
  if(E2.length)h+=`<h4>En cours ${mes&&mes.length?'pour ton métier':'sur le chantier'}</h4>`+E2.map(e=>{const rest=(e.sous||[]).filter(s=>!s.fait);return `<div class="rget"><div class="row between"><b>${esc(e.nom)}</b><span class="sm">${Math.round(num(e.avancement))} %</span></div>${e.fin&&e.statut!=='fini'?`<div class="sm mute">À terminer : ${dfr(e.fin)} (${jr(e.fin)})</div>`:''}${rest.length?`<div class="sm" style="margin-top:4px">Reste à faire :</div><ul>${rest.slice(0,6).map(s=>`<li>${esc(s.nom)}</li>`).join('')}</ul>`:''}</div>`}).join('');
  else if(enc.length)h+=`<div class="sm mute" style="margin:6px 0">Aucune étape de ton métier n'est en cours. Étape en cours : ${esc(enc.map(e=>e.nom).join(', '))}.</div>`;
  const prochaine=ets.filter(e=>!num(e.avancement)&&e.statut!=='fini'&&mien(e))[0]||null;
  if(prochaine)h+=`<h4>Prochaine étape ${mes&&mes.length?'pour toi':''}</h4><div class="sm">${esc(prochaine.nom)}${prochaine.debut?' · prévue le '+dfr(prochaine.debut):''}</div>`;
  else if(suiv&&!E2.length)h+=`<h4>Prochaine étape</h4><div class="sm">${esc(suiv.nom)}</div>`;
  const T=p.employe?S.taches.filter(t=>t.employeId===p.employe.id&&t.statut!=='recue'):[];
  if(T.length)h+=`<h4>Tes tâches à forfait</h4><ul>${T.map(t=>`<li>${esc(t.libelle)} — ${F(num(t.montant))}</li>`).join('')}</ul>`;
  if(!ets.length)h+=`<div class="sm mute" style="margin-top:6px">Les étapes du chantier n'ont pas encore été définies.</div>`;
  return h}
/* ---------- le document complet ---------- */
function rgDoc(p){const R=rgCfg(),S_=rgSections(p),cc=rgChantier(p);
  return `<div class="rgdoc"><div class="sm mute">${esc(ent().nom||'')} · Règlement intérieur, version ${R.v} · ${esc(RGPROF[p.profil])}</div>
    ${cc?`<div class="rgs"><h3>📍 Ton chantier en ce moment</h3>${cc}</div>`:''}
    ${S_.map(s=>`<div class="rgs"><h3>${s.ic} ${esc(s.t)}</h3>${s.html}</div>`).join('')}</div>`}
function rgTexte(p){const tmp=document.createElement('div');tmp.innerHTML=rgSections(p).map(s=>`<p>${s.ic} ${s.t.toUpperCase()}</p>${s.html}`).join('');
  tmp.querySelectorAll('li').forEach(li=>li.textContent='• '+li.textContent);tmp.querySelectorAll('p,li').forEach(x=>x.append('\n'));return tmp.textContent.replace(/\n{3,}/g,'\n\n').trim()}
/* ---------- acceptation ---------- */
const rgAccOf=p=>{const id=p.employe?'e:'+p.employe.id:p.interv?'i:'+p.interv.id:p.k;return S.reglacc.filter(a=>a.pers===id).sort((a,b)=>num(b.ts)-num(a.ts))[0]||null};
function rgOuvrir(k,obligatoire){const p=rgPersonne(k),R=rgCfg(),a=rgAccOf(p),ok=a&&num(a.v)===num(R.v);
  $('#modalRoot').innerHTML=`<div class="modal-bg" ${obligatoire?'':'onclick="if(event.target===this)closeForm()"'}><div class="modal rgmod"><h2>📘 ${obligatoire?'Avant de commencer':'Règlement et consignes'}</h2>
    <div class="sm" style="margin-bottom:8px">${esc(p.nom)} · ${esc(p.poste)}</div><div class="rgscroll" id="rgS">${rgDoc(p)}</div>
    ${ok?`<div class="sm" style="color:var(--ok);margin-top:10px">✓ Accepté le ${dfr(a.date)} (version ${a.v})</div><button class="btn block" style="margin-top:8px" onclick="closeForm()">Fermer</button>`:
    `<label class="chk" style="margin-top:10px"><input type="checkbox" id="rgC" onchange="$('#rgB').disabled=!this.checked"> J'ai lu le règlement et la politique de confidentialité, et je m'engage à les respecter.</label>
     <button class="btn block" id="rgB" disabled style="margin-top:8px" onclick="rgAccepter('${k}')">J'accepte</button>${obligatoire?'':'<button class="btn sec block" style="margin-top:6px" onclick="closeForm()">Plus tard</button>'}`}</div></div>`}
async function rgAccepter(k){const p=rgPersonne(k),R=rgCfg(),pers=p.employe?'e:'+p.employe.id:p.interv?'i:'+p.interv.id:k;
  try{await save('reglacc',{pers,uid:myUid(),nom:p.nom,v:R.v,date:today(),ts:Date.now(),chantierId:p.cid||''})}catch(_){}
  lsS('ge_regl_'+pers,String(R.v));closeForm();toast('Merci ! Bon travail.');rgOuvrir.fait=true}
/* à la connexion d'un membre de l'équipe : obligatoire tant que la version en vigueur n'est pas acceptée */
const rdRg=render;render=function(){rdRg.apply(this,arguments);try{rgHook()}catch(_){}};
function rgHook(){if(typeof TEAM==='undefined'||!TEAM.on||TEAM.admin||!TEAM.me)return;const p=rgPersonne('me'),R=rgCfg(),pers=p.employe?'e:'+p.employe.id:p.interv?'i:'+p.interv.id:'me';
  const vu=Math.max(num(lsG('ge_regl_'+pers,'0')),num((rgAccOf(p)||{}).v));
  if(vu<num(R.v)&&!$('#modalRoot .modal'))rgOuvrir('me',true);
  if(ui.view==='home'){const app=$('#app');if(app&&!app.querySelector('.rgcard')){const cc=rgChantier(p);
    app.insertAdjacentHTML('afterbegin',`<div class="card rgcard">${cc?`<h3 style="margin-top:0">📍 Ton chantier en ce moment</h3>${cc}`:''}<button class="btn sec block" style="margin-top:8px" onclick="rgOuvrir('me')">📘 Règlement et consignes</button></div>`)}}}
/* envoi dans la messagerie */
async function rgEnvoyer(k,silent){const p=rgPersonne(k);if(!p.employe&&!p.interv)return;
  const c=p.employe?empConv(p.employe):{conv:'int:'+p.interv.id,membres:['gerant',p.interv.id]};
  await save('messages',{conv:c.conv,chantierId:'_dm',membres:c.membres,texte:`📘 Règlement intérieur – ${ent().nom||''}\n\n${rgTexte(p)}`,reglement:k,uid:myUid(),auteur:myNom(),date:today(),ts:Date.now()});
  if(!silent)toast(`Règlement envoyé à ${p.nom}`)}
/* nouvel employé ou intervenant : règlement envoyé automatiquement */
const svRg=save;save=async function(c,o){const neuf=(c==='employes'||c==='intervenants')&&o&&!o.id;const id=await svRg(c,o);
  if(neuf&&id&&rgCfg().auto!==false){setTimeout(()=>{const k=(c==='employes'?'e:':'i:')+id,p=rgPersonne(k);if((p.employe||p.interv)&&!(c==='intervenants'&&p.employe))rgEnvoyer(k,true).catch(()=>{})},400)}return id};
/* bulle « règlement » dans la messagerie */
const vvRg=viewConv;viewConv=function(){let h=vvRg();S.messages.filter(m=>m.reglement&&convOf(m)===ui.conv).forEach(m=>{const k=`msgActions('${m.id}')`,i=h.indexOf(k);if(i<0)return;
  const a=h.indexOf('<div class="bt">',i),b=a<0?-1:h.indexOf('</div>',a);if(a<0||b<0)return;
  h=h.slice(0,a)+`<div class="bt">📘 <b>Règlement intérieur</b>\nComment utiliser l'application, le pointage, les horaires, la paie, à qui s'adresser, les absences, la sécurité et la confidentialité.</div><div class="batt" onclick="event.stopPropagation();rgOuvrir('${m.reglement}')"><span class="bi2">📘</span><span><b>Lire le règlement</b><small>et l'accepter</small></span></div>`+h.slice(b+6)});return h};
/* ---------- gestion par le gérant ---------- */
function viewRegl(){const R=rgCfg(),P=[...S.employes.filter(e=>e.actif!==false).map(e=>'e:'+e.id),...(S.intervenants||[]).filter(i=>i.actif!==false&&!i.employeId).map(i=>'i:'+i.id)].map(rgPersonne);
  let h=`<div class="card"><h3>📘 Règlement intérieur · version ${R.v}</h3><div class="sm mute">Chaque personne reçoit automatiquement la version qui correspond à son poste, avec l'état de son chantier (avancement, délais, tâches). Elle doit l'accepter à sa première connexion, et de nouveau à chaque nouvelle version.</div>
    <div class="row" style="gap:6px;margin-top:10px;flex-wrap:wrap"><button class="btn small" onclick="formRegl()">✏️ Modifier le règlement</button><button class="btn sec small" onclick="formReglParams()">⚙︎ Horaires et délais</button></div></div>`;
  h+=`<div class="card"><h3>Qui a accepté</h3>`;
  if(!P.length)h+=`<div class="empty sm">Ajoute du personnel ou des intervenants : le règlement leur est envoyé automatiquement.</div>`;
  else{const n=P.filter(p=>{const a=rgAccOf(p);return a&&num(a.v)===num(R.v)}).length;h+=`<div class="sm mute" style="margin:-6px 0 8px">${n} / ${P.length} à jour</div><div class="list">`+P.map(p=>{const a=rgAccOf(p),ok=a&&num(a.v)===num(R.v),ch=S.chantiers.find(c=>c.id===p.cid);
    return `<div class="it"><div class="main click" onclick="rgOuvrir('${p.k}')"><div class="t">${dot(ok?'ok':a?'warn':'mute')} ${esc(p.nom)}</div><div class="s">${esc(p.poste)} · ${esc(ch?ch.nom:p.cid==='bureau'?'Bureau':'')} · ${esc(RGPROF[p.profil])}</div><div class="s">${ok?'accepté le '+dfr(a.date):a?'version '+a.v+' acceptée, nouvelle version à accepter':'pas encore accepté'}</div></div><div class="amt"><button class="btn ghost small" title="Voir ce qu'il reçoit" onclick="rgOuvrir('${p.k}')">👁️</button><button class="btn ghost small" title="Envoyer dans la messagerie" onclick="rgEnvoyer('${p.k}')">📤</button></div></div>`}).join('')+`</div>`}
  h+=`</div><div class="note">Au Cameroun, le règlement intérieur d'une entreprise est encadré par le Code du travail : fais relire ce texte par un juriste ou l'inspection du travail avant de l'appliquer à tes salariés.</div>`;return h}
function formReglParams(){const R=rgCfg();openForm({title:'⚙︎ Horaires et délais',values:{...R,auto:R.auto!==false},fields:[{k:'debut',label:'Début de journée',type:'time'},{k:'fin',label:'Fin de journée',type:'time'},{k:'pause',label:'Pause'},{k:'tol',label:'Retard toléré (minutes)',type:'number'},{k:'rapport',label:'Heure limite du rapport journalier',type:'time'},{k:'preavis',label:'Prévenir une absence au plus tard',ph:'ex. la veille, 48 heures avant'},
  {k:'auto',label:'Envoyer le règlement automatiquement à chaque nouvelle personne',type:'checkbox'}],submit:'Enregistrer',
  onSave:o=>saveConfig({entreprise:{...ent(),reglement:{...(ent().reglement||{}),debut:o.debut,fin:o.fin,pause:o.pause,tol:num(o.tol),rapport:o.rapport,preavis:o.preavis,auto:o.auto}}})})}
function formRegl(){const R=rgCfg();
  openForm({title:'✏️ Modifier le règlement',values:{extra:R.extra,...Object.fromEntries(RGSEC.flatMap(s=>[['t_'+s.id,(R.sec[s.id]||{}).txt||s.txt],['o_'+s.id,!(R.sec[s.id]||{}).off]]))},
    fields:[{type:'html',html:`<div class="note">Mots remplacés automatiquement : {nom} {poste} {chantier} {chef} {sup} (responsable direct) {gerant} {debut} {fin} {pause} {tol} {rapport} {preavis} {rayon} {rythme} {mode}. Une ligne qui commence par « - » devient une puce, « 1. » une étape. Enregistrer crée une <b>nouvelle version</b> que chacun devra accepter.</div>`},
      ...RGSEC.flatMap(s=>[{type:'html',html:`<div class="secth" style="margin-top:14px">${s.ic} ${esc(s.t)} <small class="mute">· ${s.pour.map(x=>RGPROF[x].split(' ')[0]).join(', ')}</small></div>`},{k:'o_'+s.id,label:'Inclure cette partie',type:'checkbox'},{k:'t_'+s.id,label:'Texte',type:'textarea'}]),
      {type:'html',html:`<div class="secth" style="margin-top:14px">📌 Règles particulières (pour tous)</div>`},{k:'extra',label:'Texte libre',type:'textarea',ph:'ex. - Téléphone personnel interdit pendant le coulage du béton.'}],submit:'Enregistrer (nouvelle version)',
    onSave:o=>{const sec={};RGSEC.forEach(s=>{const t=o['t_'+s.id],off=!o['o_'+s.id],x={};if(t&&t.trim()!==s.txt.trim())x.txt=t;if(off)x.off=true;if(Object.keys(x).length)sec[s.id]=x});
      return saveConfig({entreprise:{...ent(),reglement:{...(ent().reglement||{}),sec,extra:o.extra,v:num(R.v)+1}}}).then(()=>toast(`Version ${num(R.v)+1} enregistrée : chacun devra l'accepter à sa prochaine connexion`))}})}
Object.assign(LVIEWS,{regl:['Règlement intérieur',viewRegl]});
const miRg=menuItems;menuItems=function(){const T=miRg();if(isTeamUser()){const m=T.find(x=>x[0]==='Mon compte');if(m)m[1].unshift({ic:'📘',l:'Règlement et consignes',f:"rgOuvrir('me')"})}else{const g=T.find(x=>x[0]==='Gestion');if(g)g[1].splice(2,0,{ic:'📘',l:'Règlement intérieur',f:"go('regl')",on:ui.view==='regl'})}return T};
/* bouton dans la fiche d'un intervenant */
if(typeof intFiche==='function'){const ifRg=intFiche;intFiche=function(id){ifRg(id);const i=(S.intervenants||[]).find(x=>x.id===id);if(!i)return;const k=i.employeId?'e:'+i.employeId:'i:'+i.id,g=document.querySelector('#modalRoot .actgrid');
  if(g)g.insertAdjacentHTML('beforeend',`<button class="actb" onclick="closeForm();rgOuvrir('${k}')"><span class="ai">📘</span><b>Règlement</b><small>Voir ce qu'il reçoit</small></button>`)}}
