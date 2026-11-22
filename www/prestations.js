/* ---------- Prestations hors clé en main : plans, étude de structure, devis seul, travaux ponctuels ---------- */
const PTYPES={cle:{ic:'🏗️',nom:'Chantier clé en main',court:'Clé en main'},plans:{ic:'📐',nom:'Plans architecturaux',court:'Plans'},structure:{ic:'🧮',nom:'Étude de structure',court:'Structure'},devis:{ic:'📋',nom:'Devis seul',court:'Devis seul'},travaux:{ic:'🔨',nom:'Travaux ponctuels',court:'Travaux'}};
const typ=x=>{const c=typeof x==='string'?S.chantiers.find(y=>y.id===x):x;return(c&&c.type&&PTYPES[c.type])?c.type:'cle'};
const NIVX=[[0,'Plain-pied (RDC)'],[1,'R+1'],[2,'R+2'],[3,'R+3'],[4,'R+4'],[5,'R+5']];
function tabsFor(t){const k={plans:['apercu','dossier','devis','recus'],structure:['apercu','dossier','devis','recus'],devis:['apercu','dossier','devis','recus'],travaux:['apercu','dossier','etapes','journal','achats','stock','commandes','equipe','pointage','paie','devis','recus','rapport']}[t];
  if(!k)return TABS;const o={};k.forEach(x=>o[x]=x==='devis'&&t!=='devis'&&t!=='travaux'?'Devis d\'honoraires':x==='devis'&&t==='devis'?'Devis':TABS[x]);return o}
function quickFor(t){
  if(t==='travaux')return `<div class="quick"><button class="btn small" onclick="bonRapide()">🧾 Bon de commande</button><button class="btn small" onclick="formRecu()">💵 Reçu de paiement</button><button class="btn sec small" onclick="formAchat()">+ Achat</button><button class="btn sec small" onclick="formJournal()">+ Journal</button></div>`;
  return `<div class="quick"><button class="btn small" onclick="formRecu()">💵 Reçu de paiement</button><button class="btn sec small" onclick="formPresta('${t}','${ui.cid}')">✏️ Modifier</button></div>`}
const honOf=cid=>byC('devis',cid).filter(d=>d.hon).sort((a,b)=>(b.date||'').localeCompare(a.date||''))[0];
const NIVTXT=n=>['RDC','R+1','R+2','R+3','R+4','R+5'].slice(0,n+1).join(' + ');
const LIVR={plans:"Livrables : plan de situation, plan de masse, vues en plan de chaque niveau, coupes, façades, plan de toiture, et un exemplaire numérique (PDF). Deux séries de modifications sont incluses ; au-delà, elles font l'objet d'un avenant.",
  structure:"Livrables : note de calcul, plans de fondations, plans de coffrage et de ferraillage (semelles, longrines, poteaux, poutres, chaînages, dalles, escaliers), nomenclature des aciers, et un exemplaire numérique (PDF). L'étude se fait sur la base des plans d'architecture fournis par le client.",
  devis:"Livrable : devis quantitatif et estimatif détaillé, lot par lot, matériaux et main-d'oeuvre séparés, établi sur la base des plans fournis par le client et des prix du marché à la date de l'étude."};
function honLignes(ch){const t=ch.type,Sp=num(ch.surface)*(num(ch.niveaux)+1),L=[];
  const mo=(designation,unite,qte,pu)=>({id:uid(),type:'mo',designation,unite,qte,pu});
  if(t==='plans'){L.push(mo(`Conception des plans architecturaux – ${num(ch.niveaux)+1} plancher${num(ch.niveaux)?'s':''} (${NIVTXT(num(ch.niveaux))}) × ${N(num(ch.surface))} m²`,'m²',Sp,num(ch.prixM2)||RG().planM2));
    if(ch.avecStructure)L.push(mo('Étude de structure béton armé (note de calcul, plans de coffrage et de ferraillage)','m²',Sp,num(ch.prixM2s)||prixOf('mo-etude-ba')))}
  else if(t==='structure')L.push(mo(`Étude de structure béton armé – ${num(ch.niveaux)+1} plancher${num(ch.niveaux)?'s':''} (${NIVTXT(num(ch.niveaux))}) × ${N(num(ch.surface))} m²`,'m²',Sp,num(ch.prixM2s)||prixOf('mo-etude-ba')));
  else if(t==='devis')L.push(mo('Établissement du devis quantitatif et estimatif détaillé'+(num(ch.surface)?` (bâtiment ${NIVTXT(num(ch.niveaux))}, ${N(num(ch.surface))} m² au sol)`:''),'forfait',1,num(ch.forfait)));
  else if(t==='travaux'&&num(ch.forfait))L.push(mo(ch.description||'Travaux','forfait',1,num(ch.forfait)));
  if(num(ch.deplacement))L.push(mo('Frais de déplacement et de visite du terrain','forfait',1,num(ch.deplacement)));
  return L.filter(x=>num(x.qte)*num(x.pu)>0)}
async function majHonoraires(cid,force){const ch=S.chantiers.find(c=>c.id===cid);if(!ch)return;const L=honLignes(ch);if(!L.length)return;const d=honOf(cid);
  if(d&&d.statut==='accepte'&&!force){toast('Devis d\'honoraires déjà accepté : il n\'a pas été modifié.');return}
  const P=PTYPES[ch.type];
  await save('devis',{...(d||{chantierId:cid,numero:nextNum('devis','DEV'),date:today(),statut:'brouillon',hon:true}),validite:30,tva:!!ch.tva,tauxTVA:19.25,imprevus:0,remise:0,acompte:num(ch.acompte)||50,
    objet:(ch.type==='travaux'?'Travaux : ':P.nom+' – ')+(ch.nom||''),lots:[{id:(d&&d.lots[0]&&d.lots[0].id)||uid(),nom:ch.type==='travaux'?'Travaux':P.nom,lignes:L}],
    conditions:(LIVR[ch.type]?LIVR[ch.type]+'\n':'')+`Acompte de ${num(ch.acompte)||50} % à la commande, solde à la remise ${ch.type==='travaux'?'des travaux':'des documents'}.${num(ch.delaiJ)?`\nDélai : ${num(ch.delaiJ)} jours à compter de l'acompte.`:''}`})}
function formPresta(type,id){
  const ch=id?S.chantiers.find(c=>c.id===id):null;type=ch?typ(ch):type;const P=PTYPES[type];
  const base=[{k:'nom',label:type==='travaux'?'Intitulé des travaux':'Nom du projet',req:true,ph:type==='travaux'?'ex. Coulage des poteaux – M. Kamga':'ex. Villa R+1 – M. Kamga'},
    {k:'branche',label:'Branche de l\'entreprise',type:'select',opts:Object.entries(BRANCHES).map(([k,v])=>[k,v[0]+' '+v[1]])},{k:'client',label:'Client'},{k:'clientTel',label:'Téléphone du client',type:'tel'},{k:'clientAdresse',label:'Adresse du client'},{k:'lieu',label:'Lieu (terrain / chantier)'}];
  const surf=[{k:'surface',label:'Surface au sol (emprise) en m²',type:'number'},{k:'niveaux',label:'Nombre de niveaux',type:'select',opts:NIVX.map(([v,l])=>[String(v),l])}];
  const spec={
    plans:[...surf,{k:'prixM2',label:'Prix des plans par m² de plancher (FCFA)',type:'number'},{k:'avecStructure',label:'Ajouter l\'étude de structure',type:'checkbox'},{k:'prixM2s',label:'Prix de l\'étude de structure par m² (FCFA)',type:'number'}],
    structure:[...surf,{k:'prixM2s',label:'Prix de l\'étude par m² de plancher (FCFA)',type:'number'}],
    devis:[...surf,{k:'forfait',label:'Honoraires pour le devis (FCFA)',type:'number',ph:'ex. 50 000'}],
    travaux:[{k:'description',label:'Description des travaux',type:'textarea',ph:'ex. Coffrage, ferraillage et coulage de 12 poteaux 20×20 au R+1'},{k:'forfait',label:'Montant convenu avec le client (FCFA)',type:'number',ph:'laisser vide si tu fais un devis détaillé'},{k:'budget',label:'Budget de dépenses prévu (FCFA)',type:'number'},{k:'debut',label:'Date de début',type:'date'},{k:'fin',label:'Date de fin prévue',type:'date'}]}[type];
  const fin=[...(type!=='travaux'?[{k:'deplacement',label:'Frais de déplacement / visite (FCFA)',type:'number'},{k:'delaiJ',label:'Délai de remise (jours)',type:'number'}]:[]),
    {k:'acompte',label:'Acompte demandé (%)',type:'number'},{k:'tva',label:'Appliquer la TVA (19,25 %)',type:'checkbox'},{k:'hInfo',type:'info'},
    {k:'statut',label:'Statut',type:'select',opts:Object.entries(STAT_CH),def:'prep'},{k:'notes',label:'Notes',type:'textarea'}];
  const v=ch?{...ch,branche:brOf(ch)}:{branche:window.__brPreset||(type==='plans'?'archi':'gc'),niveaux:'0',prixM2:RG().planM2,prixM2s:prixOf('mo-etude-ba'),acompte:50,delaiJ:type==='plans'?21:type==='structure'?14:7,debut:today()};
  openForm({title:(ch?'Modifier – ':'Nouveau – ')+P.ic+' '+P.nom,fields:[...base,...spec,...fin],values:v,submit:ch?'Enregistrer':'Créer',
    onInput:(f,o)=>{const L=honLignes({...o,type,niveaux:num(o.niveaux)}),t=sum(L,x=>num(x.qte)*num(x.pu)),tt=o.tva?t*1.1925:t;
      f.querySelector('#hInfo').innerHTML=t?`<div class="res"><div class="r big"><span>${type==='travaux'?'Montant':'Honoraires'}${o.tva?' TTC':''}</span><b>${F(tt)}</b></div>${L.map(x=>`<div class="r sm"><span>${esc(x.designation)}</span><b>${x.unite==='forfait'?'':N(num(x.qte))+' m² × '+FN(x.pu)+' = '}${FN(num(x.qte)*num(x.pu))}</b></div>`).join('')}<div class="r sm"><span>Acompte ${num(o.acompte)||50} %</span><b>${F(tt*(num(o.acompte)||50)/100)}</b></div></div>`:'<span class="sm mute">'+(type==='travaux'?'Sans montant convenu, prépare un devis détaillé dans l\'onglet Devis.':'Renseigne la surface pour calculer les honoraires.')+'</span>'},
    onSave:async o=>{o.niveaux=String(num(o.niveaux));const nid=await save('chantiers',{...(ch||{cree:Date.now()}),...o,type});await majHonoraires(nid);
      if(!ch){openCh(nid)}else render();toast(ch?'Enregistré':P.nom+' créé(e)')},
    onDelete:ch?()=>delChantier(ch.id):null});
}
function tApercuP(ch,s){const t=typ(ch),P=PTYPES[t],m=marche(ch.id),cp=clientPay(ch.id),d=honOf(ch.id);
  let h=`<div class="card"><div class="row between"><div style="min-width:0"><div class="sm mute">${P.ic} ${P.nom}</div><div class="sm mute">${esc([ch.lieu,ch.client&&'Client : '+ch.client,ch.clientTel].filter(Boolean).join(' · '))}</div></div>${chip(STAT_CH[ch.statut||'prep'],{cours:'go',fini:'ok',pause:'bad',prep:'blue'}[ch.statut||'prep'])}</div>
    ${num(ch.surface)?`<div class="sm" style="margin-top:8px">${NIVTXT(num(ch.niveaux))} · ${N(num(ch.surface))} m² au sol · <b>${N(num(ch.surface)*(num(ch.niveaux)+1))} m² de plancher</b></div>`:''}</div>
  <div class="grid2" style="margin-bottom:12px"><div class="kpi"><div class="l">Honoraires</div><div class="v">${m?F(m.t):'—'}</div><small>${m?(m.d.statut==='accepte'?'devis accepté':'devis non encore accepté'):''}</small></div>
    <div class="kpi"><div class="l">Encaissé</div><div class="v">${F(s.enc)}</div></div>
    ${m?`<div class="kpi" style="grid-column:1/-1"><div class="l">${dot(cp?cp.c:'warn')} Reste à payer par le client</div><div class="v">${F(Math.max(0,m.t-s.enc))}</div><small class="pst ${cp?cp.c:''}">${cp?esc(cp.t):''}</small></div>`:''}</div>
  <div class="card"><h3>Documents</h3><div class="qbtns" style="margin:0">${d?`<button class="btn" onclick="pdfDevis('${d.id}')">📄 Devis d'honoraires</button><button class="btn sec" onclick="ui.tab='devis';ui.devisId='${d.id}';render()">Ajuster les lignes</button>`:''}
    ${d&&d.statut!=='accepte'?`<button class="btn sec" onclick="accepterHon('${d.id}')">✅ Le client a accepté</button>`:''}<button class="btn" onclick="formRecu()">💵 Reçu de paiement</button></div>
    ${t==='devis'?`<div class="note">Le devis des travaux du client se prépare dans l'onglet <b>Devis</b> avec l'assistant (bouton ci-dessous).</div><button class="btn sec" style="margin-top:8px" onclick="ui.tab='devis';render();setTimeout(formAssistant,50)">✨ Préparer le devis des travaux du client</button>`:''}</div>`;
  h+=`<div class="row" style="justify-content:flex-end;gap:6px;margin-bottom:12px"><button class="btn sec small" onclick="formPresta('${t}','${ch.id}')">✏️ Modifier</button><button class="btn danger small" onclick="confirmDel(this,()=>delChantier('${ch.id}'))">🗑 Supprimer cette prestation</button></div>`;
  if(ch.notes)h+=`<div class="card"><h3>Notes</h3><div class="sm" style="white-space:pre-wrap">${esc(ch.notes)}</div></div>`;
  return h}
async function accepterHon(id){const d=S.devis.find(x=>x.id===id);if(!d)return;await save('devis',{...d,statut:'accepte'});const ch=S.chantiers.find(c=>c.id===d.chantierId);if(ch&&(ch.statut||'prep')==='prep')await save('chantiers',{...ch,statut:'cours'});toast('Devis accepté')}
function homePresta(){const L=S.chantiers.filter(c=>typ(c)!=='cle').sort((a,b)=>num(b.cree)-num(a.cree));
  let h=`<div class="secth">Prestations (hors clé en main)</div>`;
  if(!L.length)return h+`<div class="card sm mute">Plans, études de structure, devis seuls et petits travaux (poteaux, rénovation…) apparaîtront ici.</div>`;
  const filt=ui.pfilt||'';const kinds=Object.keys(PTYPES).filter(k=>k!=='cle'&&L.some(c=>typ(c)===k));
  if(kinds.length>1)h+=`<div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:8px"><button class="btn small ${filt?'sec':''}" onclick="ui.pfilt='';render()">Toutes (${L.length})</button>${kinds.map(k=>`<button class="btn small ${filt===k?'':'sec'}" onclick="ui.pfilt='${k}';render()">${PTYPES[k].ic} ${PTYPES[k].court}</button>`).join('')}</div>`;
  h+=`<div class="card list">`;
  L.filter(c=>!filt||typ(c)===filt).forEach(c=>{const m=marche(c.id),enc=sum(byC('recus',c.id),r=>num(r.montant)),cp=clientPay(c.id),P=PTYPES[typ(c)];
    h+=`<div class="it click" onclick="openCh('${c.id}')"><div class="main"><div class="t" style="font-weight:600">${P.ic} ${esc(c.nom)}</div><div class="s">${esc([P.court,c.client,c.lieu].filter(Boolean).join(' · '))}</div>
      ${cp?`<div class="s pst ${cp.c}">${dot(cp.c)} ${esc(cp.t.replace('Client : ',''))}</div>`:m?'':`<div class="s mute">Pas encore de montant</div>`}</div><div class="amt">${m?F(m.t):'—'}<small>${enc?F(enc)+' reçus':STAT_CH[c.statut||'prep']}</small><button class="btn ghost small delb" title="Supprimer" onclick="event.stopPropagation();confirmDel(this,()=>delChantier('${c.id}'),true)">🗑</button></div></div>`});
  return h+`</div>`}
function homeActions(){return `<div class="card"><h3>Nouveau</h3><div class="newgrid">
  <button class="nbtn" onclick="formChantier()"><b>🏗️</b>Chantier clé en main</button><button class="nbtn" onclick="go('locations')"><b>🏬</b>Locations (boutiques)</button>${['plans','structure','devis','travaux'].map(k=>`<button class="nbtn" onclick="formPresta('${k}')"><b>${PTYPES[k].ic}</b>${PTYPES[k].nom}</button>`).join('')}</div>
  <div class="grid2" style="margin-top:10px"><button class="btn" style="min-width:0;padding:10px 6px;font-size:13.5px" onclick="choisirProjet('bon')">🧾 Bon de commande</button><button class="btn" style="min-width:0;padding:10px 6px;font-size:13.5px" onclick="choisirProjet('recu')">💵 Reçu de paiement</button></div>
  <div class="grid2" style="margin-top:8px"><button class="btn sec" style="min-width:0;padding:10px 6px;font-size:13.5px" onclick="ui.rhTab='pointage';go('rh')">⏱️ Pointage</button><button class="btn sec" style="min-width:0;padding:10px 6px;font-size:13.5px" onclick="ui.rhTab='fiches';go('rh')">👷 Personnel & paie</button></div>
  <div class="grid2" style="margin-top:8px"><button class="btn sec" style="min-width:0;padding:10px 6px;font-size:13.5px" onclick="window.__brPreset='solaire';formPresta('travaux');window.__brPreset=''">☀️ Installation solaire</button><button class="btn sec" style="min-width:0;padding:10px 6px;font-size:13.5px" onclick="window.__brPreset='elec';formPresta('travaux');window.__brPreset=''">⚡ Installation électrique</button></div>
  <button class="btn block" style="margin-top:8px" onclick="ui.entTab='bord';go('ent')">🏢 Entreprise : tableau de bord, trésorerie, factures, export</button></div>`}
function choisirProjet(act){const L=[...S.chantiers].sort((a,b)=>num(b.cree)-num(a.cree)).filter(c=>act==='recu'||['cle','travaux'].includes(typ(c)));
  $('#modalRoot').innerHTML=`<div class="modal-bg" onclick="if(event.target===this)closeForm()"><div class="modal"><h2>${act==='bon'?'🧾 Bon de commande':'💵 Reçu de paiement'}</h2>
    <div class="sm mute" style="margin-bottom:10px">Pour quel projet ? Le document y sera rattaché pour ne rien mélanger.</div>
    <div class="list">${L.map(c=>`<div class="it click" onclick="lancer('${act}','${c.id}')"><div class="main"><div class="t" style="font-weight:600">${PTYPES[typ(c)].ic} ${esc(c.nom)}</div><div class="s">${esc([PTYPES[typ(c)].court,c.client].filter(Boolean).join(' · '))}</div></div></div>`).join('')||'<div class="sm mute">Aucun projet pour l\'instant.</div>'}</div>
    <button class="btn sec block" style="margin-top:12px" onclick="closeForm();formPresta('travaux')">🔨 Nouveau travail ponctuel</button><button class="btn ghost block" style="margin-top:6px" onclick="closeForm()">Annuler</button></div></div>`}
function lancer(act,cid){closeForm();openCh(cid);setTimeout(()=>act==='bon'?bonRapide():formRecu(),60)}
