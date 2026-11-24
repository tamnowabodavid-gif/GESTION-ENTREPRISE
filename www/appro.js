/* appro.js — circuit fournisseur : demande de prix (sans prix) → le fournisseur remplit prix et disponibilités → comparaison →
   bon de commande officiel à ses prix → il confirme → il livre (photo du reçu et preuve de livraison) → le magasinier réceptionne
   (quantités, écarts) → entrée automatique dans le stock du projet */
if(!COLLS.includes('dprix')){COLLS.push('dprix');S.dprix=S.dprix||[]}
const fourns=()=>(S.intervenants||[]).filter(i=>i.fonction==='four'&&i.actif!==false);
const fournConv=i=>({conv:'int:'+i.id,membres:['gerant',i.id]});
const nomsArt=()=>{try{return[...new Set([...articles().filter(a=>a.secteur!=='mo').map(a=>a.nom+'|'+a.unite),...S.achats.map(a=>a.materiau+'|'+(a.unite||''))])]}catch(e){return[]}};
const DISPO={oui:'Disponible',partiel:'Partiellement',non:'Indisponible'};
async function msgA(i,o){const c=fournConv(i);return save('messages',{conv:c.conv,chantierId:'_dm',membres:c.membres,date:today(),ts:Date.now(),uid:myUid(),auteur:myNom(),...o})}
async function msgDe(i,o){const c=fournConv(i);return save('messages',{conv:c.conv,chantierId:'_dm',membres:c.membres,date:today(),ts:Date.now(),uid:'four:'+i.id,auteur:i.nom,...o})}
async function msgEquipe(cid,texte,o={}){/* magasinier, chef de chantier, fil du chantier */
  const I=(S.intervenants||[]).filter(i=>i.chantierId===cid&&i.actif!==false&&['mag','chef'].includes(i.fonction));
  for(const i of I)await save('messages',{conv:'int:'+i.id,chantierId:'_dm',membres:['gerant',i.id],texte,date:today(),ts:Date.now(),uid:'systeme',auteur:'Approvisionnement',...o});
  await save('messages',{chantierId:cid,texte,date:today(),ts:Date.now(),uid:'systeme',auteur:'Approvisionnement',...o})}

/* ---------- 1. demande de prix ---------- */
function dpLigne(l={}){return `<div class="dpl"><input data-d="designation" list="dpArt" value="${esc(l.designation||'')}" placeholder="Article" oninput="dpUnite(this)"><input data-d="qte" inputmode="decimal" value="${esc(l.qte??'')}" placeholder="Qté"><input data-d="unite" value="${esc(l.unite||'')}" placeholder="Unité"><button type="button" class="btn ghost small" onclick="this.parentNode.remove()">×</button></div>`}
function dpUnite(inp){const v=inp.value,m=nomsArt().find(x=>x.split('|')[0]===v);if(m){const u=inp.parentNode.querySelector('[data-d=unite]');if(u&&!u.value)u.value=m.split('|')[1]}}
function dpImport(src){const box=$('#dpL');if(!box)return;let L=[];const cid=ui.cid;
  if(src==='aacheter')L=byC('achats',cid).filter(a=>a.statut==='a_acheter').map(a=>({designation:a.materiau,qte:num(a.quantite),unite:a.unite}));
  if(src==='stock'&&typeof stockData==='function')L=stockData(cid).filter(x=>x.alerte).map(x=>({designation:x.nom,qte:besoin(x,7),unite:x.unite}));
  if(!L.length){toast('Rien à importer');return}box.insertAdjacentHTML('beforeend',L.map(dpLigne).join(''));toast(L.length+' article(s) ajouté(s)')}
function formDP(id){const d=id&&S.dprix.find(x=>x.id===id),ch=S.chantiers.find(c=>c.id===ui.cid),FR=fourns(),ets=etapesOf(ui.cid);
  openForm({title:d?'Modifier la demande de prix':'📨 Nouvelle demande de prix',values:d?{etapeId:d.etapeId||'',livDate:d.livDate||'',note:d.note||''}:{etapeId:'',livDate:'',note:''},
    fields:[{type:'html',html:`<div class="note">Liste ce dont tu as besoin, <b>sans les prix</b>. Chaque fournisseur choisi reçoit la demande dans l'application, remplit ses prix et ses disponibilités, et te la renvoie.</div>
      <datalist id="dpArt">${nomsArt().slice(0,400).map(x=>`<option value="${esc(x.split('|')[0])}">`).join('')}</datalist>
      <div class="f"><span class="lbl">Articles demandés</span><div class="dph"><span>Article</span><span>Qté</span><span>Unité</span><span></span></div><div id="dpL">${(d?d.lignes:[{},{},{}]).map(dpLigne).join('')}</div>
      <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px"><button type="button" class="btn sec small" onclick="$('#dpL').insertAdjacentHTML('beforeend',dpLigne())">+ Ligne</button><button type="button" class="btn ghost small" onclick="dpImport('aacheter')">⇣ Articles « à acheter »</button><button type="button" class="btn ghost small" onclick="dpImport('stock')">⇣ Stock à réapprovisionner</button></div></div>
      <div class="f"><span class="lbl">Fournisseurs consultés (plusieurs = comparaison des prix)</span>${FR.length?FR.map(i=>`<label class="chk"><input type="checkbox" data-f="${i.id}" ${d?(d.fourns||[]).includes(i.id)?'checked':'':FR.length===1?'checked':''}> ${esc(i.nom)}${i.chantierId!==ui.cid?' <small class="mute">(autre projet)</small>':''}</label>`).join(''):`<div class="sm mute">Aucun fournisseur dans l'application : tu pourras imprimer la demande ou l'envoyer par WhatsApp, puis lire sa réponse en photo (le fournisseur sera ajouté automatiquement).</div><button type="button" class="btn sec small" onclick="closeForm();intAjout('${ui.cid}');setTimeout(()=>intFonction('four'),30)">＋ Ajouter un fournisseur</button>`}</div>`},
      {k:'etapeId',label:'Étape concernée',type:'select',opts:[['','— Aucune —'],...ets.map(e=>[e.id,e.nom])]},{k:'livDate',label:'Livraison souhaitée le',type:'date'},{k:'note',label:'Précisions pour le fournisseur',type:'textarea',ph:'ex. Ciment CPJ 42,5 uniquement ; livraison sur le chantier de '+(ch&&ch.lieu||'…')}],
    submit:d?'Enregistrer':'Envoyer la demande',
    collect:fm=>({lignes:[...fm.querySelectorAll('#dpL .dpl')].map(r=>{const g=k=>r.querySelector(`[data-d=${k}]`).value.trim();let src=null;try{src=JSON.parse(r.dataset.src||'null')}catch(e){}return{designation:g('designation'),qte:num(g('qte')),unite:g('unite'),...(src?{src}:{})}}).filter(l=>l.designation&&l.qte>0),fr:[...fm.querySelectorAll('[data-f]')].filter(c=>c.checked).map(c=>c.dataset.f)}),
    onSave:async o=>{if(!o.lignes.length){toast('Ajoute au moins un article avec sa quantité');return false}
      const v={...(d||{}),chantierId:ui.cid,numero:d?d.numero:nextNum('dprix','DP'),date:d?d.date:today(),etapeId:o.etapeId,livDate:o.livDate,note:o.note,lignes:o.lignes.map((l,i)=>({id:(d&&d.lignes[i]&&d.lignes[i].id)||uid(),...l})),fourns:o.fr,reponses:d?d.reponses||{}:{},statut:d?d.statut:'envoyee'};
      const id=await save('dprix',v);await new Promise(r=>setTimeout(r,30));const dp=S.dprix.find(x=>x.id===id);
      for(const fid of o.fr){if(d&&(d.fourns||[]).includes(fid))continue;const i=S.intervenants.find(x=>x.id===fid);if(i)await msgA(i,{texte:dpTexte(dp,i),dpId:id})}
      if(typeof log==='function')log(ui.cid,`Demande de prix ${v.numero} envoyée à ${o.fr.map(f=>intNom(f)).join(', ')}`);
      ui.tab='commandes';ui.bonId=null;ui.dpId=id;render();toast(o.fr.length?`Demande ${v.numero} envoyée à ${o.fr.length} fournisseur(s)`:`Demande ${v.numero} prête : télécharge le document à remplir`)}})}
function dpTexte(dp,i){const ch=S.chantiers.find(c=>c.id===dp.chantierId)||{};
  return `📨 Demande de prix ${dp.numero} — ${ent().nom||''}\nChantier : ${ch.nom||''}${ch.lieu?' ('+ch.lieu+')':''}${dp.livDate?'\nLivraison souhaitée le '+dfr(dp.livDate):''}\n\n${dp.lignes.map(l=>`• ${l.designation} : ${N(num(l.qte))} ${l.unite||''} — prix : ……`).join('\n')}${dp.note?'\n\n'+dp.note:''}\n\nMerci d'indiquer pour chaque article votre prix unitaire et sa disponibilité.`}

/* ---------- 2. le fournisseur répond ---------- */
function dpRepondre(dpid,fid,parGerant){const dp=S.dprix.find(x=>x.id===dpid),i=S.intervenants.find(x=>x.id===fid);if(!dp||!i)return;const r=(dp.reponses||{})[fid]||{L:{}};
  if(dp.statut==='commandee'&&!parGerant){toast('Cette demande a déjà été commandée.');return}
  openForm({title:`📝 ${dp.numero} — prix de ${i.nom}`,values:{delai:r.delai||'',validite:r.validite||'',fraisLiv:r.fraisLiv||'',remarque:r.remarque||''},
    fields:[{type:'html',html:`<div class="note">${parGerant?'Saisis la réponse reçue du fournisseur (téléphone, papier).':'Indiquez votre prix unitaire et la disponibilité de chaque article, puis envoyez.'}</div>
      <div id="rpL">${dp.lignes.map(l=>{const x=r.L[l.id]||{};return `<div class="rpl" data-l="${l.id}"><div class="t"><b>${esc(l.designation)}</b> <span class="mute">· ${N(num(l.qte))} ${esc(l.unite||'')} demandé(s)</span></div>
        <div class="rpg"><label><small>Prix unitaire (FCFA)</small><input data-r="pu" inputmode="decimal" value="${esc(x.pu??'')}" oninput="rpTot()"></label>
        <label><small>Disponibilité</small><select data-r="dispo" onchange="this.closest('.rpl').querySelector('.rpq').style.display=this.value==='partiel'?'':'none';rpTot()">${Object.entries(DISPO).map(([k,v])=>`<option value="${k}" ${(x.dispo||'oui')===k?'selected':''}>${v}</option>`).join('')}</select></label>
        <label class="rpq" style="${x.dispo==='partiel'?'':'display:none'}"><small>Quantité disponible</small><input data-r="qte" inputmode="decimal" value="${esc(x.qte??'')}" oninput="rpTot()"></label></div></div>`}).join('')}</div><div class="res" id="rpT" style="margin:8px 0"></div>`},
      {k:'fraisLiv',label:'Frais de livraison (FCFA, vide = inclus)',type:'number'},{k:'delai',label:'Délai de livraison',ph:'ex. 48 heures après la commande'},{k:'validite',label:'Prix valables jusqu\'au',type:'date'},{k:'remarque',label:'Remarque',type:'textarea'}],
    submit:parGerant?'Enregistrer la réponse':'Envoyer mes prix',
    collect:fm=>({L:Object.fromEntries([...fm.querySelectorAll('.rpl')].map(r=>{const g=k=>r.querySelector(`[data-r=${k}]`).value;return[r.dataset.l,{pu:num(g('pu')),dispo:g('dispo'),qte:num(g('qte'))}]}))}),
    onSave:async o=>{const manque=dp.lignes.filter(l=>o.L[l.id].dispo!=='non'&&!o.L[l.id].pu);if(manque.length){toast('Prix manquant : '+manque[0].designation);return false}
      const g=S.dprix.find(x=>x.id===dpid);const rep={L:o.L,fraisLiv:num(o.fraisLiv),delai:o.delai,validite:o.validite,remarque:o.remarque,date:today(),ts:Date.now(),parGerant:!!parGerant,photos:window.__dpPhotos||(((g.reponses||{})[fid]||{}).photos)||[]};window.__dpPhotos=null;
      await save('dprix',{...g,reponses:{...(g.reponses||{}),[fid]:rep},statut:g.statut==='commandee'?'commandee':'repondue'});
      const t=dpTotal(g,rep);await (parGerant?msgA:msgDe)(i,{texte:`💰 Prix pour ${g.numero}${parGerant?' (saisis par le gérant)':''}\n\n${g.lignes.map(l=>{const x=o.L[l.id];return `• ${l.designation} : ${x.dispo==='non'?'indisponible':F(x.pu)+' / '+(l.unite||'u')+(x.dispo==='partiel'?' — '+N(x.qte)+' disponible(s)':'')}`}).join('\n')}${rep.fraisLiv?'\n• Livraison : '+F(rep.fraisLiv):''}\n\nTotal : ${F(t.tot)}${rep.delai?'\nDélai : '+rep.delai:''}`,dpId:g.id,dpRep:fid});
      toast(parGerant?'Réponse enregistrée':'Vos prix ont été envoyés. Merci !')}});setTimeout(rpTot,0)}
function rpTot(){const z=$('#rpT');if(!z)return;let t=0,n=0;document.querySelectorAll('#rpL .rpl').forEach(r=>{const g=k=>r.querySelector(`[data-r=${k}]`).value,dp=S.dprix.find(x=>x.lignes.some(l=>l.id===r.dataset.l)),l=dp&&dp.lignes.find(l=>l.id===r.dataset.l);if(!l)return;
  const d=g('dispo');if(d==='non')return;const q=d==='partiel'?num(g('qte')):num(l.qte);t+=q*num(g('pu'));n++});z.innerHTML=`<div class="r big"><span>Total (${n} article(s))</span><b>${F(t)}</b></div>`}
function dpTotal(dp,r){let tot=0,n=0;dp.lignes.forEach(l=>{const x=(r.L||{})[l.id];if(!x||x.dispo==='non')return;tot+=(x.dispo==='partiel'?num(x.qte):num(l.qte))*num(x.pu);n++});return{tot:tot+num(r.fraisLiv),n}}

/* ---------- 3. comparaison et bon de commande officiel ---------- */
function dpVue(ch,dp){const R=dp.reponses||{},F_=dp.fourns||[],rep=F_.filter(f=>R[f]);
  const best={};dp.lignes.forEach(l=>{let b=null;rep.forEach(f=>{const x=R[f].L[l.id];if(x&&x.dispo!=='non'&&num(x.pu)>0&&(!b||num(x.pu)<b.pu))b={f,pu:num(x.pu)}});best[l.id]=b});
  let h=`<button class="btn ghost small" onclick="ui.dpId=null;render()">← Approvisionnement</button>
   <div class="card"><div class="row between"><h3 style="margin:0">📨 ${esc(dp.numero)}</h3>${chip({envoyee:'En attente des prix',repondue:'Prix reçus',commandee:'Commandée',annulee:'Annulée'}[dp.statut]||'',dp.statut==='commandee'?'ok':dp.statut==='repondue'?'blue':'warn')}</div>
   <div class="sm mute" style="margin-top:4px">Envoyée le ${dfr(dp.date)} · ${rep.length}/${F_.length} réponse(s)${dp.livDate?' · livraison souhaitée le '+dfr(dp.livDate):''}${dp.etapeId?' · '+esc((S.etapes.find(e=>e.id===dp.etapeId)||{}).nom||''):''}</div></div>`;
  h+=`<div class="card"><h3>Comparaison des prix</h3><div class="cmpw"><table class="cmp"><thead><tr><th>Article</th>${F_.map(f=>`<th>${esc(intNom(f))}</th>`).join('')}</tr></thead><tbody>
    ${dp.lignes.map(l=>`<tr><td><b>${esc(l.designation)}</b><br><small class="mute">${N(num(l.qte))} ${esc(l.unite||'')}</small></td>${F_.map(f=>{const x=R[f]&&R[f].L[l.id];if(!R[f])return'<td class="mute">en attente</td>';if(!x||x.dispo==='non')return'<td class="mute">indisponible</td>';const b=best[l.id]&&best[l.id].f===f;
      return `<td class="${b?'best':''}">${F(num(x.pu))}${b?' ⭐':''}${x.dispo==='partiel'?`<br><small>${N(num(x.qte))} dispo</small>`:''}</td>`}).join('')}</tr>`).join('')}
    <tr class="tot"><td>Livraison</td>${F_.map(f=>`<td>${R[f]?(R[f].fraisLiv?F(R[f].fraisLiv):'incluse'):''}</td>`).join('')}</tr>
    <tr class="tot"><td><b>Total</b></td>${F_.map(f=>{if(!R[f])return'<td></td>';const t=dpTotal(dp,R[f]);return `<td><b>${F(t.tot)}</b><br><small>${t.n}/${dp.lignes.length} art.</small></td>`}).join('')}</tr>
    <tr><td>Délai</td>${F_.map(f=>`<td><small>${esc(R[f]&&R[f].delai||'')}</small></td>`).join('')}</tr></tbody></table></div>
    ${rep.length?'':'<div class="sm mute" style="margin-top:8px">Les prix apparaîtront ici dès que les fournisseurs auront répondu.</div>'}</div>`;
  h+=`<div class="card"><h3>Fournisseurs</h3><div class="list">${F_.map(f=>{const i=S.intervenants.find(x=>x.id===f)||{nom:'?'},r=R[f],t=r&&dpTotal(dp,r),bc=S.bons.filter(b=>b.dpId===dp.id&&b.fournId===f);
    return `<div class="it"><div class="main"><div class="t">${dot(r?'ok':'warn')} ${esc(i.nom)}</div><div class="s">${r?`a répondu le ${dfr(r.date)}${r.parGerant?' (saisi par toi)':''} · ${F(t.tot)}`:'en attente de réponse'}${bc.length?' · '+bc.map(b=>b.numero).join(', '):''}</div>
      <div class="row" style="gap:4px;margin-top:6px;flex-wrap:wrap">${r&&dp.statut!=='annulee'?`<button class="btn small" onclick="dpCommander('${dp.id}','${f}')">🧾 Commander chez lui</button>`:''}<button class="btn ghost small" onclick="dpRepondre('${dp.id}','${f}',true)">✏️ ${r?'Corriger':'Saisir'} sa réponse</button>${!r?`<button class="btn ghost small" onclick="dpRelancer('${dp.id}','${f}')">🔔 Relancer</button>`:''}<button class="btn ghost small" onclick="ouvrirConv('int:${f}')">💬</button><button class="btn ghost small" onclick="partager({titre:'Demande de prix ${esc(dp.numero)}',texte:dpTexte(S.dprix.find(x=>x.id==='${dp.id}'),S.intervenants.find(x=>x.id==='${f}'))})">↗️</button></div></div></div>`}).join('')}</div>
    ${rep.length>1&&dp.statut!=='annulee'?`<button class="btn block" style="margin-top:10px" onclick="dpMeilleurs('${dp.id}')">⭐ Commander chaque article au meilleur prix</button>`:''}</div>
   <div class="card"><div class="qbtns" style="margin:0"><button class="btn sec" onclick="formDP('${dp.id}')">✏️ Modifier / ajouter un fournisseur</button>${dp.statut!=='annulee'?`<button class="btn sec" onclick="docSet('dprix','${dp.id}','statut','annulee')">Annuler</button>`:''}<button class="btn danger" onclick="confirmDel(this,()=>{del('dprix','${dp.id}');ui.dpId=null})">Supprimer</button></div></div>`;
  return h}
async function dpRelancer(dpid,fid){const dp=S.dprix.find(x=>x.id===dpid),i=S.intervenants.find(x=>x.id===fid);if(!dp||!i)return;await msgA(i,{texte:`🔔 Rappel : nous attendons vos prix pour la demande ${dp.numero}. Merci !`,dpId:dp.id});toast('Relance envoyée')}
async function dpCommander(dpid,fid,only){const dp=S.dprix.find(x=>x.id===dpid),i=S.intervenants.find(x=>x.id===fid),r=dp&&(dp.reponses||{})[fid];if(!r||!i)return null;const ch=S.chantiers.find(c=>c.id===dp.chantierId)||{};
  const lignes=dp.lignes.filter(l=>(!only||only[l.id])&&r.L[l.id]&&r.L[l.id].dispo!=='non').map(l=>{const x=r.L[l.id],mx=x.dispo==='partiel'?Math.min(num(x.qte),num(l.qte)):num(l.qte);return{id:uid(),designation:l.designation,unite:l.unite,qte:only?Math.min(mx,num(only[l.id])):mx,pu:num(x.pu),dpl:l.id}}).filter(l=>l.qte>0);
  if(num(r.fraisLiv)&&!only)lignes.push({id:uid(),designation:'Frais de livraison',unite:'forfait',qte:1,pu:num(r.fraisLiv)});
  if(!lignes.length){toast('Aucun article disponible chez ce fournisseur');return null}
  const id=await save('bons',{chantierId:dp.chantierId,numero:nextNum('bons','BC'),date:today(),statut:'emis',fournId:i.id,fournisseur:i.nom,fournTel:i.tel||'',livraisonLieu:ch.lieu||'',livraisonDate:dp.livDate||'',etapeId:dp.etapeId||'',dpId:dp.id,lignes,
    notes:`Établi d'après vos prix du ${dfr(r.date)} (demande ${dp.numero}).${r.delai?' Délai annoncé : '+r.delai+'.':''} Merci de confirmer la commande dans l'application, puis de joindre à la livraison le bordereau signé.`});
  await new Promise(x=>setTimeout(x,30));await bonEnvoyer(id,i.id);
  const g=S.dprix.find(x=>x.id===dpid);await save('dprix',{...g,statut:'commandee'});
  if(typeof log==='function')log(dp.chantierId,`Bon de commande établi chez ${i.nom} d'après la demande ${dp.numero}`);
  if(!only){ui.dpId=null;ui.bonId=id;render()}return id}
async function dpMeilleurs(dpid){const dp=S.dprix.find(x=>x.id===dpid);if(!dp)return;const R=dp.reponses||{},G={};
  /* chaque article chez le moins cher ; s'il n'en a qu'une partie, le reste chez le suivant */
  dp.lignes.forEach(l=>{let reste=num(l.qte);const O=Object.keys(R).map(f=>({f,x:R[f].L[l.id]})).filter(o=>o.x&&o.x.dispo!=='non'&&num(o.x.pu)>0).sort((a,b)=>num(a.x.pu)-num(b.x.pu));
    for(const o of O){if(reste<=1e-9)break;const q=Math.min(reste,o.x.dispo==='partiel'?num(o.x.qte):reste);if(q<=0)continue;(G[o.f]=G[o.f]||{})[l.id]=q;reste-=q}});
  const ids=[];for(const[f,L]of Object.entries(G)){const id=await dpCommander(dpid,f,L);if(id)ids.push(id)}
  toast(`${ids.length} bon(s) de commande envoyé(s)`);ui.dpId=null;ui.bonId=null;render()}

/* ---------- 4. le fournisseur confirme, puis livre ---------- */
function bcConfirmer(bid){const b=S.bons.find(x=>x.id===bid),i=b&&S.intervenants.find(x=>x.id===b.fournId);if(!b||!i)return;
  openForm({title:`✅ Confirmer la commande ${b.numero}`,values:{liv:b.livraisonDate||'',note:''},fields:[{type:'html',html:`<div class="res">${(b.lignes||[]).map(l=>`<div class="r"><span>${esc(l.designation)} · ${N(num(l.qte))} ${esc(l.unite||'')}</span><b>${F(num(l.qte)*num(l.pu))}</b></div>`).join('')}<div class="r big"><span>Total</span><b>${F(totL(b.lignes))}</b></div></div>`},
    {k:'liv',label:'Livraison prévue le',type:'date',req:true},{k:'note',label:'Message (facultatif)'}],submit:'Confirmer la commande',
    onSave:async o=>{const g=S.bons.find(x=>x.id===bid);await save('bons',{...g,fConf:{date:today(),ts:Date.now(),liv:o.liv,note:o.note},livraisonDate:o.liv});
      await msgDe(i,{texte:`✅ Commande ${b.numero} confirmée. Livraison prévue le ${dfr(o.liv)}.${o.note?'\n'+o.note:''}`,bonId:bid});toast('Commande confirmée')}})}
function bcLivrer(bid){const b=S.bons.find(x=>x.id===bid),i=b&&S.intervenants.find(x=>x.id===b.fournId);if(!b||!i)return;
  openForm({title:`🚚 Livraison de la commande ${b.numero}`,values:{note:''},fields:[{type:'html',html:`<div class="note">Sur le chantier, photographie le <b>bordereau de livraison ou le reçu signé</b>, et la <b>marchandise déposée</b>. Le magasinier vérifiera et confirmera la réception.</div>`},
    {type:'html',html:photoWidget('livRecu',[],'📄 Reçu / bordereau de livraison signé')},{type:'html',html:photoWidget('livPreuve',[],'📷 Preuve de livraison (marchandise sur le chantier)')},{k:'note',label:'Commentaire',ph:'ex. 2 sacs livrés demain (rupture)'}],submit:'Déclarer la livraison',
    onSave:async o=>{if(!(PW.livRecu||[]).length&&!(PW.livPreuve||[]).length&&typeof assets!=='undefined'&&assets){if(!confirm('Aucune photo jointe. Déclarer quand même ?'))return false}
      const g=S.bons.find(x=>x.id===bid),liv={date:today(),ts:Date.now(),recu:[...(PW.livRecu||[])],preuve:[...(PW.livPreuve||[])],note:o.note};
      await save('bons',{...g,fLiv:liv});await msgDe(i,{texte:`🚚 Commande ${b.numero} livrée sur le chantier le ${dfr(liv.date)}.${o.note?'\n'+o.note:''}`,bonId:bid});
      await msgEquipe(b.chantierId,`🚚 Livraison de ${i.nom} arrivée sur le chantier (bon ${b.numero}). Magasinier : vérifie les quantités et confirme la réception dans Matériaux › Bons de commande.`,{bonId:bid});
      toast('Livraison déclarée : le magasinier va la réceptionner')}})}

/* ---------- 5. le magasinier réceptionne → stock ---------- */
receptionner=function(bid){const b=S.bons.find(x=>x.id===bid);if(!b)return;
  openForm({title:`📦 Réception du bon ${b.numero}`,values:{note:''},fields:[{type:'html',html:`${b.fLiv?`<div class="note">Livraison déclarée par ${esc(b.fournisseur||'le fournisseur')} le ${dfr(b.fLiv.date)}.${b.fLiv.note?' « '+esc(b.fLiv.note)+' »':''}</div>${[...(b.fLiv.recu||[]),...(b.fLiv.preuve||[])].length?`<div class="thumbs" style="margin-bottom:8px">${thumbsHtml('x',false,[...(b.fLiv.recu||[]),...(b.fLiv.preuve||[])])}</div>`:''}`:''}
      <div class="sm mute" style="margin-bottom:6px">Compte ce qui est réellement arrivé en bon état. Seules ces quantités entrent dans le stock du projet.</div>
      <div id="rcL">${(b.lignes||[]).filter(l=>!/^Frais de livraison/.test(l.designation)).map(l=>`<div class="rpl" data-l="${l.id}"><div class="t"><b>${esc(l.designation)}</b> <span class="mute">· commandé ${N(num(l.qte))} ${esc(l.unite||'')}</span></div>
        <div class="rpg"><label><small>Reçu en bon état</small><input data-r="q" inputmode="decimal" value="${num(l.qte)}"></label><label><small>État</small><select data-r="e"><option value="ok">Conforme</option><option value="manque">Manquant</option><option value="abime">Abîmé / refusé</option><option value="autre">Pas le bon article</option></select></label></div></div>`).join('')}</div>`},
      {type:'html',html:photoWidget('rcPh',[],'📷 Photo de la réception (facultatif)')},{k:'note',label:'Observations'}],submit:'Confirmer la réception',
    collect:fm=>({L:Object.fromEntries([...fm.querySelectorAll('#rcL .rpl')].map(r=>[r.dataset.l,{q:num(r.querySelector('[data-r=q]').value),e:r.querySelector('[data-r=e]').value}]))}),
    onSave:async o=>{const g=S.bons.find(x=>x.id===bid),cmd=g.cmd||g.lignes,ec=[];
      for(const l of cmd){const r=o.L[l.id];if(!r)continue;const q=Math.max(0,r.q);if(q<num(l.qte)-1e-9||r.e!=='ok')ec.push(`${l.designation} : ${N(q)} reçu(s) sur ${N(num(l.qte))}${r.e!=='ok'?' ('+{manque:'manquant',abime:'abîmé / refusé',autre:'pas le bon article'}[r.e]+')':''}`);
        if(q>0){const base={chantierId:g.chantierId,materiau:l.designation,quantite:q,unite:l.unite,prixUnit:num(l.pu),fournisseur:g.fournisseur||'',etapeId:g.etapeId||'',statut:'achete',date:today(),bonId:g.id,notes:'Bon '+g.numero+' · réceptionné',justifs:[...((g.fLiv||{}).recu||[])]};
          const ex=l.achatId&&S.achats.find(a=>a.id===l.achatId);await save('achats',ex?{...ex,...base}:base)}}
      const lignes=cmd.map(l=>o.L[l.id]?{...l,qte:Math.max(0,o.L[l.id].q)}:l);
      await save('bons',{...g,cmd,lignes,statut:'livre',livreLe:today(),recep:{date:today(),ts:Date.now(),par:myNom(),L:o.L,ecarts:ec,note:o.note,photos:[...(PW.rcPh||[])]}});
      const i=S.intervenants.find(x=>x.id===g.fournId);
      if(i)await msgA(i,{texte:`📦 Réception du bon ${g.numero} : ${ec.length?'écarts constatés :\n'+ec.map(x=>'• '+x).join('\n')+'\n\nLe montant à payer est ajusté à ce qui a été reçu.':'tout est conforme. Merci !'}${o.note?'\n'+o.note:''}`,bonId:g.id});
      if(typeof log==='function')log(g.chantierId,`Réception du bon ${g.numero} (${g.fournisseur||''})${ec.length?' avec '+ec.length+' écart(s)':' conforme'} · entrée en stock`);
      toast(ec.length?`Réception enregistrée avec ${ec.length} écart(s) · stock mis à jour`:'Réception conforme · stock mis à jour')}})};

/* ---------- affichage dans Matériaux › Bons de commande ---------- */
function bcSuivi(b){const s=[[!!b.dpId,'Demande de prix',b.dpId&&(S.dprix.find(x=>x.id===b.dpId)||{}).numero],[!!b.envoi,'Bon envoyé au fournisseur',b.envoi&&dfr(b.envoi.date)],[!!b.fConf,'Commande confirmée',b.fConf&&('livraison prévue le '+dfr(b.fConf.liv))],[!!b.fLiv,'Livré par le fournisseur',b.fLiv&&dfr(b.fLiv.date)],[!!b.recep||b.statut==='livre','Réceptionné · entré en stock',b.recep?dfr(b.recep.date)+(b.recep.ecarts.length?` · ${b.recep.ecarts.length} écart(s)`:' · conforme'):b.livreLe&&dfr(b.livreLe)]];
  return `<div class="tl">${s.map(([ok,l,d])=>`<div class="tli ${ok?'ok':''}"><span class="tld"></span><div><b>${l}</b>${ok&&d?`<small>${esc(d)}</small>`:''}</div></div>`).join('')}</div>`}
const beAp=bonEditor;bonEditor=function(ch,b){let h=beAp(ch,b);const i=b.fournId&&S.intervenants.find(x=>x.id===b.fournId),st=b.statut||'emis';
  let act='';if(st==='emis'&&i){if(!b.fConf)act+=`<button class="btn sec small" onclick="bcConfirmer('${b.id}')">✅ Confirmation du fournisseur</button>`;if(!b.fLiv)act+=`<button class="btn sec small" onclick="bcLivrer('${b.id}')">🚚 Livraison du fournisseur</button>`}
  if(st==='emis')act+=`<button class="btn small" onclick="receptionner('${b.id}')">📦 Réceptionner (magasinier)</button>`;
  const ph=b.fLiv?[...(b.fLiv.recu||[]),...(b.fLiv.preuve||[])]:[];
  const card=`<div class="card"><h3>🚚 Suivi de la commande</h3>${bcSuivi(b)}${ph.length?`<div class="sm" style="margin-top:6px">Photos du fournisseur :</div><div class="thumbs">${thumbsHtml('x',false,ph)}</div>`:''}
    ${b.recep&&b.recep.ecarts.length?`<div class="alert" style="margin-top:8px">${b.recep.ecarts.map(esc).join('<br>')}</div>`:''}${act?`<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px">${act}</div>`:''}
    ${st==='emis'&&i?`<div class="note" style="margin-top:6px">Le fournisseur confirme et déclare sa livraison depuis son téléphone. Les boutons ci-dessus servent si tu le fais à sa place (réponse par téléphone).</div>`:''}</div>`;
  return '<button class="btn ghost small" onclick="ui.bonId=null;render()">← Approvisionnement</button>'+card+h.replace('<button class="btn ghost small" onclick="ui.bonId=null;render()">← Tous les bons</button>','')
    .replace(/<button class="btn sec" onclick="receptionner\('[^']+'\)">✓ Réceptionner la livraison<\/button>/,'').replace(/<div class="note">« Réceptionner » ajoute[^<]*<\/div>/,'')};
const tcAp=tCommandes;tCommandes=function(ch){if(ui.dpId){const dp=S.dprix.find(x=>x.id===ui.dpId);if(dp)return dpVue(ch,dp);ui.dpId=null}
  let h=tcAp(ch);if(ui.bonId)return h;const L=byC('dprix',ch.id).sort((a,b)=>(b.numero||'').localeCompare(a.numero||''));
  const att=S.bons.filter(b=>b.chantierId===ch.id&&(b.statut||'emis')==='emis'&&b.fLiv);
  const top=`<div class="card"><div class="row between"><h3 style="margin:0">📨 Demandes de prix</h3><button class="btn small" onclick="formDP()">+ Demande de prix</button></div>
    <div class="sm mute" style="margin:4px 0 8px">1. Demande de prix sans prix → 2. le fournisseur remplit ses prix → 3. tu compares et commandes → 4. il confirme et livre avec photos → 5. le magasinier réceptionne : le stock se met à jour.</div>
    ${L.length?`<div class="list">${L.map(d=>{const n=Object.keys(d.reponses||{}).length;return `<div class="it click" onclick="ui.dpId='${d.id}';render()"><div class="main"><div class="t">${esc(d.numero)} ${chip({envoyee:'En attente des prix',repondue:'Prix reçus',commandee:'Commandée',annulee:'Annulée'}[d.statut]||'',d.statut==='commandee'?'ok':d.statut==='repondue'?'blue':d.statut==='annulee'?'bad':'warn')}</div><div class="s">${dfr(d.date)} · ${d.lignes.length} article(s) · ${n}/${(d.fourns||[]).length} réponse(s)</div><div class="s">${esc((d.fourns||[]).map(intNom).join(', '))}</div></div></div>`}).join('')}</div>`:''}</div>`;
  const al=att.length?`<div class="card" style="border-color:#f1c9a6;background:#fff8f2"><h3>📦 ${att.length} livraison(s) à réceptionner</h3>${att.map(b=>`<div class="row between" style="margin:4px 0"><span>${esc(b.numero)} · ${esc(b.fournisseur||'')} · livré le ${dfr(b.fLiv.date)}</span><button class="btn small" onclick="receptionner('${b.id}')">Réceptionner</button></div>`).join('')}</div>`:'';
  return al+top+h.replace('Bons de commande fournisseurs','Bons de commande')};
/* bulles : boutons d'action dans la messagerie */
const vvAp=viewConv;viewConv=function(){let h=vvAp();const cv=ui.conv,fid=String(cv).startsWith('int:')?cv.slice(4):null,i=fid&&S.intervenants.find(x=>x.id===fid&&x.fonction==='four');
  S.messages.filter(m=>(m.dpId||m.bonId)&&convOf(m)===cv).forEach(m=>{const k=`msgActions('${m.id}')`,a=h.indexOf(k);if(a<0)return;const j=h.indexOf('<div class="bh">',a);if(j<0)return;let att='';
    if(m.dpId&&!m.dpRep){const dp=S.dprix.find(x=>x.id===m.dpId);if(dp&&i){const r=(dp.reponses||{})[i.id];att=`<div class="batt" onclick="event.stopPropagation();dpRepondre('${dp.id}','${i.id}')"><span class="bi2">📝</span><span><b>${r?'Prix envoyés ✓ — modifier':'Remplir mes prix'}</b><small>Demande ${esc(dp.numero)} · ${dp.lignes.length} article(s)</small></span></div>`}}
    else if(m.dpId&&m.dpRep){att=`<div class="batt" onclick="event.stopPropagation();openCh('${(S.dprix.find(x=>x.id===m.dpId)||{}).chantierId}');ui.tab='commandes';ui.bonId=null;ui.dpId='${m.dpId}';render()"><span class="bi2">📊</span><span><b>Comparer les prix</b><small>et commander</small></span></div>`}
    else if(m.bonId&&i&&/^🧾/.test(m.texte||'')){const b=S.bons.find(x=>x.id===m.bonId);if(b)att=`<div class="batt" onclick="event.stopPropagation();${!b.fConf?`bcConfirmer('${b.id}')`:!b.fLiv?`bcLivrer('${b.id}')`:`toast('Commande livrée')`}"><span class="bi2">${!b.fConf?'✅':!b.fLiv?'🚚':'✓'}</span><span><b>${!b.fConf?'Confirmer la commande':!b.fLiv?'Déclarer la livraison':'Livrée'}</b><small>Bon ${esc(b.numero)} · ${F(totL(b.lignes))}</small></span></div>`}
    if(att)h=h.slice(0,j)+att+h.slice(j)});return h};
