/* appro2.js — demande de prix par étape (articles du devis), document à remplir à la main (PDF),
   lecture de la photo renvoyée par le fournisseur, mise à jour du devis, bon de commande et appel de fonds au client */
/* ---------- articles d'une étape : lot du devis correspondant, sinon « à acheter » ---------- */
function lotsEtape(cid,eid){const e=S.etapes.find(x=>x.id===eid);if(!e)return[];const k=e.lib||(typeof etMatch==='function'&&(etMatch(e.nom)||{}).k),n=String(e.nom||'').toLowerCase().split(' —')[0];
  const D=byC('devis',cid).sort((a,b)=>(b.statut==='accepte')-(a.statut==='accepte')||num(b.cree)-num(a.cree)),out=[];
  D.forEach(d=>(d.lots||[]).forEach(l=>{const ln=String(l.nom||'').toLowerCase(),lk=typeof etMatch==='function'&&(etMatch(l.nom)||{}).k;if(ln===n||ln.includes(n)||n.includes(ln)||(k&&lk===k))out.push({d,l})}));return out}
function lignesEtape(cid,eid){const L=lotsEtape(cid,eid);if(L.length){const {d,l}=L[0];return{src:`${d.numero||'Devis'} · lot « ${l.nom} »`,lignes:(l.lignes||[]).filter(x=>x.type!=='mo'&&!x.off&&num(x.qte)>0).map(x=>({designation:x.designation,qte:num(x.qte),unite:x.unite||'',src:{d:d.id,l:l.id,g:x.id}}))}}
  const A=byC('achats',cid).filter(a=>a.statut==='a_acheter'&&a.etapeId===eid);return{src:A.length?'articles « à acheter » de l\'étape':'',lignes:A.map(a=>({designation:a.materiau,qte:num(a.quantite),unite:a.unite||''}))}}
function dpEtape(){const s=document.querySelector('.modal select[name=etapeId]'),box=$('#dpL');if(!s||!box)return;if(!s.value){toast("Choisis d'abord l'étape");return}
  const r=lignesEtape(ui.cid,s.value);if(!r.lignes.length){toast("Aucun article trouvé pour cette étape : applique d'abord un devis au chantier, ou ajoute les lignes à la main.");return}
  [...box.querySelectorAll('.dpl')].forEach(x=>{if(!x.querySelector('[data-d=designation]').value)x.remove()});box.insertAdjacentHTML('beforeend',r.lignes.map(dpLigne).join(''));toast(`${r.lignes.length} article(s) repris du ${r.src}`)}
/* la ligne garde son lien vers le devis */
const dlA2=dpLigne;dpLigne=function(l={}){const h=dlA2(l);return l.src?h.replace('<div class="dpl">',`<div class="dpl" data-src='${esc(JSON.stringify(l.src))}'>`):h};
const fdA2=formDP;formDP=function(id,eid){fdA2(id);const s=document.querySelector('.modal select[name=etapeId]');if(!s)return;
  s.insertAdjacentHTML('afterend',`<button type="button" class="btn sec small" style="margin:-4px 0 12px" onclick="dpEtape()">⇣ Reprendre les articles du devis pour cette étape</button>`);
  const box=$('#dpL');if(box){const b=box.parentNode.querySelector('.row');if(b)b.insertAdjacentHTML('afterbegin',`<button type="button" class="btn small" onclick="dpEtape()">⇣ Articles de l'étape</button>`)}
  if(eid){s.value=eid;const e=S.etapes.find(x=>x.id===eid),t=document.querySelector('.modal h2');if(t&&e)t.textContent='📨 Demande de prix — '+e.nom;dpEtape()}
};
/* ---------- document à remplir à la main ---------- */
async function pdfDP(dpid){const dp=S.dprix.find(x=>x.id===dpid);if(!dp)return;const ch=S.chantiers.find(c=>c.id===dp.chantierId)||{},et=S.etapes.find(e=>e.id===dp.etapeId);
  const {doc,y:y0,col}=pdfBase('DEMANDE DE PRIX','N° '+dp.numero,`Date : ${dfr(dp.date)}${et?'  ·  Étape : '+et.nom:''}`);let y=y0;
  y=Math.max(box(doc,14,y,88,'Fournisseur (à remplir)',['Nom : ................................................','Tél. : ................................................','Adresse : ..........................................'],col),
    box(doc,108,y,88,'Livraison',[ch.lieu||'',`Chantier : ${ch.nom||''}`,dp.livDate?'Souhaitée le '+dfr(dp.livDate):'Date à convenir'].filter(Boolean),col))+5;
  doc.setFontSize(9);doc.setFont('helvetica','normal');const it=doc.splitTextToSize(T("Merci d'indiquer à la main, pour chaque article, s'il est disponible, votre prix unitaire et le montant. Prenez ensuite une photo nette de cette page (bien éclairée, à plat) et renvoyez-la-nous par WhatsApp."),182);doc.text(it,14,y);y+=it.length*4.3+2;
  doc.autoTable({...tstyle(col),startY:y,head:[['N°','Désignation','Unité','Qté','Dispo (O/N)','P.U. (FCFA)','Montant (FCFA)']],
    body:dp.lignes.map((l,i)=>[i+1,T(l.designation),T(l.unite),N(num(l.qte)),'','','']),styles:{...tstyle(col).styles,fontSize:9,minCellHeight:9,valign:'middle'},
    columnStyles:{0:{cellWidth:9},2:{cellWidth:14,halign:'center'},3:{cellWidth:14,halign:'right'},4:{cellWidth:18},5:{cellWidth:26},6:{cellWidth:30}}});
  y=doc.lastAutoTable.finalY+6;doc.setFontSize(9.5);
  [['Frais de livraison :','........................ FCFA'],['TOTAL :','........................ FCFA'],['Délai de livraison :','........................................'],['Prix valables jusqu\'au :','........................................']].forEach(([a,b])=>{doc.setFont('helvetica','bold');doc.text(T(a),110,y);doc.setFont('helvetica','normal');doc.text(T(b),150,y);y+=7});
  if(dp.note){doc.setFontSize(8.5);const nl=doc.splitTextToSize(T('Précisions : '+dp.note),182);doc.text(nl,14,y);y+=nl.length*4+4}
  signatures(doc,y+4,'Cachet et signature du fournisseur',E_sign());
  await savePdf(doc,`Demande de prix ${dp.numero}${et?' - '+T(et.nom):''}.pdf`)}
const E_sign=()=>ent().signataire?'Pour '+(ent().nom||"l'entreprise")+' : '+ent().signataire:"Pour l'entreprise";
/* ---------- lecture de la photo renvoyée ---------- */
async function lirePhotoDP(dp,files){const sample=await (window.claude&&claude.use?claude.use('sample'):null);if(!sample)return{err:'indispo'};
  try{const lim=sample.limits?await sample.limits():{images:true};if(lim&&lim.images===false)return{err:'indispo'}}catch(e){}
  const consigne=`Tu lis la photo d'une DEMANDE DE PRIX de chantier (BTP, Cameroun) remplie À LA MAIN par un fournisseur. Montants en FCFA.
Voici les articles demandés (id | désignation | quantité | unité) :
${dp.lignes.map(l=>`${l.id} | ${l.designation} | ${num(l.qte)} | ${l.unite||''}`).join('\n')}
Pour CHAQUE id, lis sur la photo : la disponibilité ("oui", "partiel" ou "non"), le prix unitaire en FCFA (nombre entier, sans espaces ; 5.200 ou 5 200 = 5200), et la quantité disponible si elle est indiquée.
Si un prix n'est pas lisible, mets null. Si seul le montant est écrit, divise-le par la quantité. Lis aussi le nom et le téléphone du fournisseur, les frais de livraison, le délai, la date de validité (AAAA-MM-JJ) et le total écrit.
Réponds UNIQUEMENT avec ce JSON : {"fournisseur":"","tel":"","lignes":[{"id":"","dispo":"oui","pu":0,"qte":null,"lisible":true}],"fraisLiv":0,"delai":"","validite":"","totalEcrit":0,"remarque":""}`;
  const blobs=[...files];let v;try{v=sample.json?await sample.json(consigne,{images:blobs,modelTier:'complex'}):JSON.parse((await sample(consigne,{images:blobs,modelTier:'complex'})).text.replace(/^[^{]*/,'').replace(/[^}]*$/,''))}catch(e){return{err:e&&e.code||'lecture'}}
  return{v}}
function dpPhoto(dpid,fid0){const dp=S.dprix.find(x=>x.id===dpid);if(!dp)return;const FR=fourns();
  $('#modalRoot').innerHTML=`<div class="modal-bg" onclick="if(event.target===this)closeForm()"><div class="modal"><h2>📷 Lire la réponse d'un fournisseur</h2>
    <div class="note">Prends en photo (ou choisis) la demande de prix ${esc(dp.numero)} remplie à la main par le fournisseur. L'application lit les prix et remplit le formulaire : tu vérifies, puis tu valides.</div>
    <label class="f"><span>Fournisseur</span><select id="phF" onchange="$('#phNew').style.display=this.value==='_new'?'':'none'">${FR.map(i=>`<option value="${i.id}" ${i.id===fid0?'selected':''}>${esc(i.nom)}</option>`).join('')}<option value="_new" ${!FR.length?'selected':''}>＋ Nouveau fournisseur (lu sur la photo)</option></select></label>
    <div id="phNew" style="${FR.length?'display:none':''}"><label class="f"><span>Nom (vide = lu sur la photo)</span><input id="phN"></label><label class="f"><span>Téléphone</span><input id="phT" type="tel"></label></div>
    <label class="btn block upl" style="margin:6px 0">📷 Prendre / choisir la photo<input type="file" id="phI" accept="image/*" multiple onchange="phApercu(this)"></label><div class="thumbs" id="phP"></div>
    <button class="btn block" id="phB" disabled onclick="phLire('${dpid}')">🔎 Lire les prix</button><button class="btn sec block" style="margin-top:6px" onclick="closeForm()">Annuler</button></div></div>`}
function phApercu(inp){const b=$('#phP');b.innerHTML=[...inp.files].map(f=>`<div class="th"><img src="${URL.createObjectURL(f)}" alt="photo"></div>`).join('');$('#phB').disabled=!inp.files.length}
async function phLire(dpid){const dp=S.dprix.find(x=>x.id===dpid),files=[...($('#phI').files||[])],sel=$('#phF').value,nN=($('#phN')||{}).value||'',nT=($('#phT')||{}).value||'';if(!files.length)return;
  const b=$('#phB');b.disabled=true;b.textContent='Lecture de la photo…';const r=await lirePhotoDP(dp,files);
  let ph=[];try{if(typeof uploadFiles==='function')ph=await uploadFiles(files)}catch(e){}
  let fid=sel;if(sel==='_new'){const nom=(nN||(r.v&&r.v.fournisseur)||'').trim()||'Fournisseur '+dp.numero;fid=await save('intervenants',{chantierId:dp.chantierId,nom,tel:nT||(r.v&&r.v.tel)||'',fonction:'four',docs:['bonsFour','msgPrive'],etapes:[],voit:[],ecrit:[],sup:'gerant',actif:true,cree:Date.now()});await new Promise(x=>setTimeout(x,40))}
  const g=S.dprix.find(x=>x.id===dpid);if(!(g.fourns||[]).includes(fid))await save('dprix',{...g,fourns:[...(g.fourns||[]),fid]});
  closeForm();
  if(r.err){toast(r.err==='indispo'?"Lecture automatique indisponible ici : saisis les prix à partir de la photo.":"La photo n'a pas pu être lue : saisis les prix à la main.");dpRepondre(dpid,fid,true,{photos:ph});return}
  const v=r.v||{},L={};(v.lignes||[]).forEach(x=>{if(x&&x.id)L[x.id]={pu:x.pu==null?'':num(x.pu),dispo:['oui','partiel','non'].includes(x.dispo)?x.dispo:'oui',qte:x.qte==null?'':num(x.qte),flou:x.lisible===false||x.pu==null}});
  dpRepondre(dpid,fid,true,{L,fraisLiv:num(v.fraisLiv)||'',delai:v.delai||'',validite:/^\d{4}-\d{2}-\d{2}$/.test(v.validite||'')?v.validite:'',remarque:v.remarque||'',photos:ph,totalEcrit:num(v.totalEcrit),lu:true})}
/* le formulaire de réponse accepte une pré-saisie (photo lue) */
const drA2=dpRepondre;dpRepondre=function(dpid,fid,parGerant,pre){const dp=S.dprix.find(x=>x.id===dpid);if(!dp)return;
  if(!pre){window.__dpPhotos=null;return drA2(dpid,fid,parGerant)}
  const old=dp.reponses&&dp.reponses[fid];const tmp={...(old||{}),L:{...((old||{}).L||{}),...(pre.L||{})},fraisLiv:pre.fraisLiv??(old||{}).fraisLiv,delai:pre.delai||(old||{}).delai,validite:pre.validite||(old||{}).validite,remarque:pre.remarque||(old||{}).remarque};
  dp.reponses={...(dp.reponses||{}),[fid]:tmp};try{drA2(dpid,fid,parGerant)}finally{if(old)dp.reponses[fid]=old;else delete dp.reponses[fid]}
  window.__dpPhotos=pre.photos||[];
  const m=document.querySelector('.modal');if(!m)return;const h=m.querySelector('h2');if(h&&pre.lu)h.insertAdjacentHTML('afterend',`<div class="alert" style="background:#e8f1ff;border-color:#bcd3f5;color:#1b3a66">🔎 Prix lus sur la photo. <b>Vérifie chaque ligne</b> avant d'enregistrer${Object.values(pre.L||{}).some(x=>x.flou)?' : les cases en orange étaient illisibles':''}.${pre.totalEcrit?` Total écrit par le fournisseur : <b>${F(pre.totalEcrit)}</b>.`:''}</div>`);
  if(pre.photos&&pre.photos.length)m.querySelector('#rpL').insertAdjacentHTML('beforebegin',`<div class="thumbs" style="margin-bottom:8px">${thumbsHtml('x',false,pre.photos)}</div>`);
  Object.entries(pre.L||{}).forEach(([lid,x])=>{if(x.flou){const r=m.querySelector(`.rpl[data-l="${lid}"] [data-r=pu]`);if(r)r.style.cssText='border-color:#e2711d;background:#fff4ea'}});setTimeout(rpTot,0)};

/* ---------- commander : mise à jour du devis + bon de commande + appel de fonds ---------- */
const dcA2=dpCommander;dpCommander=async function(dpid,fid,only){const id=await dcA2(dpid,fid,only);if(!id)return id;const dp=S.dprix.find(x=>x.id===dpid),r=dp&&dp.reponses[fid],b=S.bons.find(x=>x.id===id);
  const maj=[];for(const l of dp.lignes){if(!l.src||!r.L[l.id]||r.L[l.id].dispo==='non')continue;if(only&&!only[l.id])continue;const d=S.devis.find(x=>x.id===l.src.d);if(!d)continue;
    const lots=(d.lots||[]).map(lt=>lt.id!==l.src.l?lt:{...lt,lignes:lt.lignes.map(g=>g.id!==l.src.g?g:{...g,puAvant:g.puAvant??g.pu,pu:num(r.L[l.id].pu),prixFourn:{dp:dp.numero,f:intNom(fid),date:today()}})});
    await save('devis',{...d,lots});await new Promise(x=>setTimeout(x,10));maj.push(l.designation)}
  if(b&&maj.length)await save('bons',{...b,majDevis:maj.length});
  if(maj.length)toast(`Bon ${b?b.numero:''} créé · ${maj.length} prix mis à jour dans le devis`);return id};
async function bcClient(bid){const b=S.bons.find(x=>x.id===bid);if(!b)return;const ch=S.chantiers.find(c=>c.id===b.chantierId)||{},mo=(S.intervenants||[]).find(i=>i.chantierId===b.chantierId&&i.fonction==='mo'&&i.actif!==false),et=S.etapes.find(e=>e.id===b.etapeId),t=totL(b.lignes);
  const texte=`💰 Demande de fonds — ${ch.nom||''}\n\nPour lancer ${et?'l\'étape « '+et.nom+' »':'la suite des travaux'}, nous devons régler au fournisseur ${b.fournisseur||''} le bon de commande ${b.numero} :\n\n${(b.lignes||[]).map(l=>`• ${l.designation} : ${N(num(l.qte))} ${l.unite||''} × ${F(num(l.pu))} = ${F(num(l.qte)*num(l.pu))}`).join('\n')}\n\nMontant à verser : ${F(t)}\n${ent().banque?'Paiement : '+ent().banque+'\n':''}\nLe bon de commande est joint. Les prix sont ceux du fournisseur (demande de prix comparée).\n\n${ent().nom||''}`;
  openForm({title:'💰 Demander les fonds au client',values:{msg:texte},fields:[{type:'html',html:`<div class="note">Le bon de commande ${esc(b.numero)} (${F(t)}) est envoyé au client pour qu'il verse les fonds nécessaires au paiement du fournisseur.${mo?'':' Ajoute le maître d\'ouvrage dans Équipe › Intervenants pour le lui envoyer dans l\'application.'}</div>`},{k:'msg',label:'Message',type:'textarea'}],
    submit:mo?`Envoyer à ${mo.nom}`:'Partager (WhatsApp, e-mail…)',
    extra:`<button type="button" class="btn sec block" style="margin-bottom:10px" onclick="pdfBon('${b.id}')">📄 Télécharger le bon de commande (PDF) à joindre</button>`,
    onSave:async o=>{if(mo){await save('messages',{conv:'int:'+mo.id,chantierId:'_dm',membres:['gerant',mo.id],texte:o.msg,bonId:b.id,fonds:true,uid:myUid(),auteur:myNom(),date:today(),ts:Date.now()})}
      const g=S.bons.find(x=>x.id===bid);await save('bons',{...g,fonds:{date:today(),montant:t,a:mo?mo.id:''}});
      if(typeof log==='function')log(b.chantierId,`Demande de fonds au client : ${F(t)} pour le bon ${b.numero}`);
      if(mo)toast(`Demande de fonds envoyée à ${mo.nom}`);else partager({titre:'Demande de fonds '+b.numero,texte:o.msg})}})}
/* ---------- branchements dans l'interface ---------- */
const dvA2=dpVue;dpVue=function(ch,dp){let h=dvA2(ch,dp);
  const top=`<div class="card"><div class="qbtns" style="margin:0"><button class="btn" onclick="pdfDP('${dp.id}')">📄 Document à remplir (PDF)</button><button class="btn" onclick="dpPhoto('${dp.id}')">📷 Lire une réponse en photo</button></div>
    <div class="note" style="margin-top:8px">Envoie le PDF au fournisseur (WhatsApp ou imprimé). Il le remplit à la main et te renvoie une photo : « Lire une réponse en photo » remplit les prix tout seul.</div></div>`;
  h=h.replace('<div class="card"><h3>Comparaison des prix</h3>',top+'<div class="card"><h3>Comparaison des prix</h3>');
  const src=dp.lignes.filter(l=>l.src).length;if(src)h=h.replace('<div class="card"><h3>Fournisseurs</h3>',`<div class="note" style="margin:-4px 0 10px">🔗 ${src} article(s) liés au devis : à la commande, le devis prend les prix du fournisseur choisi.</div><div class="card"><h3>Fournisseurs</h3>`);
  return h.replace(/✏️ (Corriger|Saisir) sa réponse<\/button>/g,(m)=>m).replace(/<button class="btn ghost small" onclick="dpRepondre\('([^']+)','([^']+)',true\)">/g,`<button class="btn ghost small" onclick="dpPhoto('$1','$2')">📷 Photo</button><button class="btn ghost small" onclick="dpRepondre('$1','$2',true)">`)};
const beA2=bonEditor;bonEditor=function(ch,b){const h=beA2(ch,b),t=totL(b.lignes);
  const c=`<div class="card"><div class="row between"><b>💰 Financement par le client</b>${b.fonds?chip('Demandé le '+dfr(b.fonds.date),'ok'):''}</div><div class="sm mute" style="margin:4px 0 8px">Envoie ce bon au client pour qu'il verse ${F(t)} avant le paiement du fournisseur.${b.majDevis?` Les prix de ${b.majDevis} article(s) ont été reportés dans le devis.`:''}</div><button class="btn block" onclick="bcClient('${b.id}')">💰 ${b.fonds?'Renvoyer':'Demander'} les fonds au client</button></div>`;
  const i=h.indexOf('<div class="card fsend">');return i<0?h+c:h.slice(0,i)+c+h.slice(i)};
/* Travaux › Étapes : lancer une demande de prix pour une étape */
const teA2=tEtapes;tEtapes=function(ch,s){const h=teA2(ch,s),E=etTri(etapesOf(ch.id)).filter(e=>e.statut!=='fini');if(!E.length)return h;
  return h+`<div class="card"><h3>📨 Demande de prix pour une étape</h3><div class="sm mute" style="margin:-6px 0 8px">Reprend les matériaux du devis pour l'étape, sans les prix, prêts à envoyer aux fournisseurs.</div><div class="row" style="gap:6px;flex-wrap:wrap">${E.slice(0,12).map(e=>`<button class="btn sec small" onclick="formDP(null,'${e.id}')">${esc(e.nom)}</button>`).join('')}</div></div>`};
