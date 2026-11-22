/* ---------- constantes ---------- */
const ETAPES_TYPES=["Études, plans & autorisations","Installation de chantier & préparation du terrain","Terrassements & traitement anti-termite","Fondations & soubassement (protection contre l'humidité)","Dallage & plancher bas (anti-remontées capillaires)","Élévation des murs, poteaux & chaînages","Planchers, dalles & escalier","Charpente, couverture & plafonds","Plomberie, sanitaires & assainissement","Électricité (NF C 15-100)","Enduits intérieurs & extérieurs","Chapes, carrelage & faïence","Menuiseries, vitrerie & ferronnerie","Peinture & finitions","Aménagements extérieurs & protection des pieds de murs","Essais, nettoyage, réception & remise des clés"];
const UNITES=['sac','m³','kg','tonne','barre','pièce','m²','ml','m','L','voyage','rouleau','seau','pot','feuille','forfait'];
const STAT_CH={prep:'En préparation',cours:'En cours',pause:'En pause',fini:'Terminé'};
const STAT_ET={afaire:'À faire',cours:'En cours',fini:'Terminé'};
const METIERS=['Chef de chantier','Maçon','Manœuvre','Ferrailleur','Coffreur','Charpentier','Plombier','Électricien','Carreleur','Peintre','Menuisier','Soudeur','Étancheur','Gardien','Autre'];
const MODES={jour:'Par jour',tache:'À la tâche',forfait:'Forfait / mois'};
const MODES_PAIE=['Espèces','Orange Money','MTN Mobile Money','Virement bancaire','Chèque','Western Union / transfert'];
const METEO=['Ensoleillé','Nuageux','Pluie','Forte pluie (arrêt)'];

/* ---------- formulaire générique ---------- */
function openForm({title,fields,values={},onSave,onDelete,onInput,extra='',collect,submit}){
  const fh=fields.map(f=>{const v=values[f.k]??f.def??'';
    if(f.type==='checkbox')return `<label class="chk"><input type="checkbox" name="${f.k}" ${v?'checked':''}> ${f.label}</label>`;
    if(f.type==='select')return `<label class="f"><span>${f.label}</span><select name="${f.k}">${f.opts.map(([ov,ol])=>`<option value="${esc(ov)}" ${String(v)===String(ov)?'selected':''}>${esc(ol)}</option>`).join('')}</select></label>`;
    if(f.type==='textarea')return `<label class="f"><span>${f.label}</span><textarea name="${f.k}">${esc(v)}</textarea></label>`;
    if(f.type==='info')return `<div class="res" id="${f.k}" style="margin:-2px 0 12px"></div>`;
    if(f.type==='html')return f.html;
    return `<label class="f"><span>${f.label}</span><input name="${f.k}" type="${f.type==='number'?'text':f.type||'text'}" ${f.type==='number'?'inputmode="decimal"':''} ${f.list?`list="dl_${f.k}"`:''} value="${esc(v)}" placeholder="${esc(f.ph||'')}">${f.list?`<datalist id="dl_${f.k}">${f.list.map(x=>`<option value="${esc(x)}">`).join('')}</datalist>`:''}</label>`}).join('');
  $('#modalRoot').innerHTML=`<div class="modal-bg" onclick="if(event.target===this)closeForm()"><form class="modal" id="frm"><h2>${esc(title)}</h2>${fh}${extra}
    <div class="row" style="margin-top:6px"><button type="button" class="btn sec" onclick="closeForm()">Annuler</button><button class="btn" style="flex:1" type="submit">${esc(submit||'Enregistrer')}</button></div>
    ${onDelete?`<button type="button" class="btn danger block" style="margin-top:12px" id="btnDel">Supprimer</button>`:''}</form></div>`;
  const frm=$('#frm');
  const read=()=>{const o={};fields.forEach(f=>{if(f.type==='info'||f.type==='html')return;const el=frm.elements[f.k];o[f.k]=f.type==='checkbox'?el.checked:el.value.trim()});return o};
  if(onInput){const h=()=>onInput(frm,read());frm.addEventListener('input',h);frm.addEventListener('change',h);h()}
  frm.onsubmit=async ev=>{ev.preventDefault();if(pwBusy){toast("Attends la fin de l'envoi des photos…");return}const o=read();if(collect)Object.assign(o,collect(frm));
    for(const f of fields)if(f.req&&!o[f.k]){toast('Champ requis : '+f.label);return}
    const b=frm.querySelector('button[type=submit]');b.disabled=true;b.textContent='Enregistrement…';
    try{closeForm();await onSave(o)}catch(e){console.error(e);toast('Erreur : '+((e&&(e.message||e.code))||e))}};
  if(onDelete){const bd=$('#btnDel');bd.onclick=async()=>{if(!bd.dataset.c){bd.dataset.c=1;bd.textContent='Toucher encore pour confirmer la suppression';return}closeForm();try{await onDelete()}catch(e){}}}
}
function closeForm(){$('#modalRoot').innerHTML=''}
const etOpts=cid=>[['','— Aucune —'],...etapesOf(cid).map(e=>[e.id,e.nom])];

/* ---------- formulaires métier ---------- */
function formChantier(id){
  const ch=id?S.chantiers.find(c=>c.id===id):null;
  const fields=[{k:'nom',label:'Nom du chantier',req:true,ph:'ex. Villa R+1 Logbessou'},{k:'lieu',label:'Lieu du chantier',ph:'ex. Douala, Logbessou'},
    {k:'branche',label:'Branche de l\'entreprise',type:'select',opts:Object.entries(BRANCHES).map(([k,v])=>[k,v[0]+' '+v[1]]),def:'gc'},{k:'client',label:'Client / propriétaire'},{k:'clientTel',label:'Téléphone du client',type:'tel'},{k:'clientAdresse',label:'Adresse du client'},
    {k:'debut',label:'Date de début',type:'date'},{k:'fin',label:'Date de fin prévue',type:'date'},{k:'budget',label:'Budget prévu (FCFA)',type:'number',ph:'ou appliquer un devis'},{k:'bInfo',type:'info'},
    {k:'statut',label:'Statut',type:'select',opts:Object.entries(STAT_CH),def:'prep'},{type:'html',html:`<div class="f"><span class="lbl">📍 Position du chantier (pointage GPS du personnel)</span><button type="button" class="btn sec block" onclick="posVers('')">Utiliser ma position actuelle (sois sur le chantier)</button></div>`},{k:'lat',label:'Latitude',type:'number'},{k:'lng',label:'Longitude',type:'number'},{k:'rayon',label:'Rayon autorisé pour le pointage (m, vide = réglage général)',type:'number'},{k:'notes',label:'Notes',type:'textarea'}];
  openForm({title:ch?'Modifier le chantier':'Nouveau chantier',fields,values:ch||{},
    onInput:(f,o)=>{f.querySelector('#bInfo').innerHTML=num(o.budget)?`<span class="sm">${F(num(o.budget))} ≈ <b>${C(num(o.budget))}</b></span>`:'<span class="sm mute">Le budget peut être rempli automatiquement depuis un devis.</span>'},
    onSave:async o=>{const nid=await save('chantiers',{...(ch||{cree:Date.now()}),...o});if(!ch){openCh(nid);ui.tab='devis';render()}},
    onDelete:ch?async()=>{for(const c of COLLS.filter(c=>c!=='chantiers'&&c!=='articles'))for(const x of byC(c,ch.id))await del(c,x.id);await del('chantiers',ch.id);ui.view='home';render();toast('Chantier supprimé')}:null});
}
function formEtape(id){
  const e=id?S.etapes.find(x=>x.id===id):null,n=etapesOf(ui.cid).length;
  openForm({title:e?"Modifier l'étape":'Nouvelle étape',values:e||{ordre:n+1,avancement:0,statut:'afaire'},
    fields:[{k:'nom',label:"Nom de l'étape",req:true,list:ETAPES_TYPES},{k:'statut',label:'Statut',type:'select',opts:Object.entries(STAT_ET)},{k:'avancement',label:'Avancement (%)',type:'number'},
      {k:'budgetMat',label:"Budget matériaux (FCFA)",type:'number'},{k:'budgetMO',label:"Budget main-d'œuvre (FCFA)",type:'number'},{k:'debut',label:'Début',type:'date'},{k:'fin',label:'Fin',type:'date'},{k:'ordre',label:'Ordre',type:'number'},{k:'notes',label:'Notes',type:'textarea'}],
    onSave:async o=>{o.budget=num(o.budgetMat)+num(o.budgetMO)||num((e||{}).budget);o.avancement=Math.max(0,Math.min(100,num(o.avancement)));if(o.avancement>=100)o.statut='fini';else if(o.statut==='fini')o.avancement=100;
      const old=e?num(e.avancement):null;await save('etapes',{...(e||{}),...o,chantierId:ui.cid});
      if(e&&old!==o.avancement)log(ui.cid,`${o.nom} : ${Math.round(old)} % → ${Math.round(o.avancement)} %`,{etapeId:e.id,av:o.avancement});if(!e)log(ui.cid,'Nouvelle étape : '+o.nom)},
    onDelete:e?()=>del('etapes',e.id):null});
}
function formAchat(id){
  const a=id?S.achats.find(x=>x.id===id):null;
  const fourn=[...new Set(S.achats.map(x=>x.fournisseur).filter(Boolean))];
  const mats=[...new Set([...articles().filter(x=>x.secteur!=='mo').map(x=>x.nom),...S.achats.map(x=>x.materiau)])];
  openForm({title:a?"Modifier l'achat":'Nouvel achat',values:a?{reglement:'paye',...a}:{date:today(),unite:'sac',statut:'achete',reglement:'paye'},
    fields:[{k:'materiau',label:'Matériau',req:true,list:mats},{k:'quantite',label:'Quantité',type:'number',req:true},{k:'unite',label:'Unité',type:'select',opts:UNITES_ALL.map(u=>[u,u])},
      {k:'prixUnit',label:'Prix unitaire (FCFA)',type:'number'},{k:'tInfo',type:'info'},{k:'statut',label:'Statut',type:'select',opts:[['achete','Acheté'],['a_acheter','À acheter (prévu)']]},{k:'reglement',label:'Paiement au fournisseur',type:'select',opts:[['paye','Payé comptant'],['credit','À crédit (à régler plus tard)']]},{k:'echeance',label:'À régler au plus tard le (si à crédit)',type:'date'},{k:'modePaie',label:'Payé par',type:'select',opts:MODES_PAIE.map(m=>[m,m])},
      {k:'date',label:'Date',type:'date'},{k:'fournisseur',label:'Fournisseur',list:fourn},{k:'etapeId',label:'Étape',type:'select',opts:etOpts(ui.cid)},
      {type:'html',html:photoWidget('achat',a&&a.justifs,'Reçu / facture (photo ou PDF)')},{k:'notes',label:'Notes',type:'textarea'}],
    onInput:(f,o)=>{const m=articles().find(x=>x.nom===o.materiau);const pu=f.elements.prixUnit;
      if(m&&!a&&!pu.dataset.t){pu.value=m.prix;pu.dataset.t=1;f.elements.unite.value=UNITES_ALL.includes(m.unite)?m.unite:f.elements.unite.value;o.prixUnit=m.prix}
      f.querySelector('#tInfo').innerHTML=`<div class="r"><span>Total</span><b>${F(num(o.quantite)*num(f.elements.prixUnit.value))} <small class="mute">≈ ${C(num(o.quantite)*num(f.elements.prixUnit.value))}</small></b></div>`},
    onSave:o=>{if(o.reglement==='paye'&&a&&a.reglement==='credit')o.datePaye=today();return save('achats',{...(a||{}),...o,justifs:PW.achat,chantierId:ui.cid})},onDelete:a?()=>del('achats',a.id):null});
}
function formEmploye(id){
  const e=id?S.employes.find(x=>x.id===id):null;
  openForm({title:e?"Modifier l'employé":'Nouvel employé',values:e?{...e,actif:e.actif!==false}:{mode:'jour',actif:true,metier:'Maçon'},
    fields:[{k:'nom',label:'Nom complet',req:true},{k:'metier',label:'Métier',type:'select',opts:METIERS.map(m=>[m,m])},{k:'tel',label:'Téléphone',type:'tel'},{k:'cni',label:'N° CNI (facultatif)'},
      {k:'mode',label:'Mode de paie',type:'select',opts:Object.entries(MODES)},{k:'taux',label:'Tarif (FCFA par jour / tâche / mois)',type:'number'},
      {k:'debut',label:'Arrivé le',type:'date'},{k:'actif',label:'Actif sur le chantier',type:'checkbox'},{k:'notes',label:'Notes',type:'textarea'}],
    onSave:o=>save('employes',{...(e||{}),...o,chantierId:ui.cid}),onDelete:e?()=>del('employes',e.id):null});
}
function formPaiement(id,empId){
  const p=id?S.paiements.find(x=>x.id===id):null,emps=byC('employes',ui.cid);
  if(!emps.length){toast("Ajoute d'abord un employé (onglet Équipe).");return}
  let last=null;
  openForm({title:p?'Modifier le paiement':'Nouveau paiement',values:p||{date:today(),employeId:empId||emps[0].id,mode:'Espèces'},
    fields:[{k:'employeId',label:'Employé',type:'select',opts:emps.map(e=>[e.id,e.nom+' ('+(e.metier||'')+')'])},{k:'date',label:'Date',type:'date'},
      {k:'jours',label:'Jours travaillés (si payé par jour)',type:'number'},{k:'montant',label:'Montant payé (FCFA)',type:'number',req:true},{k:'mInfo',type:'info'},
      {k:'type',label:'Nature',type:'select',opts:[['salaire','Paie'],['avance','Avance sur salaire (déduite de la prochaine fiche de paie)']]},{k:'mode',label:'Payé par',type:'select',opts:MODES_PAIE.map(m=>[m,m])},{k:'objet',label:'Objet',ph:'ex. Semaine du 10 au 15, avance, tâche…'},{k:'etapeId',label:'Étape',type:'select',opts:etOpts(ui.cid)},
      {type:'html',html:photoWidget('paie',p&&p.justifs,'Preuve de paiement (reçu signé, capture Mobile Money)')}],
    onInput:(f,o)=>{const e=S.employes.find(x=>x.id===o.employeId),mEl=f.elements.montant;
      const auto=e&&e.mode==='jour'&&num(e.taux)&&num(o.jours)?num(e.taux)*num(o.jours):null;
      if(auto!==null&&(mEl.value===''||num(mEl.value)===last)){mEl.value=auto;last=auto}
      f.querySelector('#mInfo').innerHTML=`<span class="sm">${e?esc(MODES[e.mode]||'')+(num(e.taux)?' · tarif '+F(num(e.taux)):''):''}${num(mEl.value)?' · ≈ <b>'+C(num(mEl.value))+'</b>':''}</span>`},
    onSave:o=>save('paiements',{...(p||{}),...o,justifs:PW.paie,chantierId:ui.cid}),onDelete:p?()=>del('paiements',p.id):null});
}
function formJournal(id){
  const j=id?S.journal.find(x=>x.id===id):null;
  openForm({title:j?"Modifier l'entrée":'Journal de chantier',values:j||{date:today(),meteo:'Ensoleillé'},
    fields:[{k:'date',label:'Date',type:'date'},{k:'etapeId',label:'Étape concernée',type:'select',opts:etOpts(ui.cid)},{k:'texte',label:'Travaux réalisés',type:'textarea',req:true},
      {k:'effectif',label:'Ouvriers présents',type:'number'},{k:'meteo',label:'Météo',type:'select',opts:METEO.map(m=>[m,m])},{k:'incidents',label:'Problèmes / livraisons / visites',type:'textarea'},
      {type:'html',html:prodBlock(j&&j.prod)},{type:'html',html:photoWidget('journal',j&&j.photos,'Photos du chantier')}],collect:f=>({prod:readProds(f)}),
    onSave:o=>save('journal',{...(j||{}),...o,photos:PW.journal,chantierId:ui.cid}),onDelete:j?()=>del('journal',j.id):null});
}
const MOTIFS=[['paie',"Avance pour la paie des ouvriers"],['acompte','Acompte (avance à la commande)'],['materiaux','Achat de matériaux'],['situation','Paiement de situation (avancement des travaux)'],['solde','Solde (paiement final)'],['autre','Autre motif']];
function formRecu(id){
  const r=id?S.recus.find(x=>x.id===id):null;if(!r&&(ui.view!=='chantier'||!ui.cid)){toast("Ouvre d'abord le chantier concerné.");return}
  const cid=r?r.chantierId:ui.cid,ch=S.chantiers.find(c=>c.id===cid)||{},dv=byC('devis',cid),ets=etapesOf(cid);
  const CATS=[['mo',"Main-d'œuvre"],['mat','Matériaux'],['global','Paiement global (non affecté)']],catOf=m=>m==='paie'?'mo':m==='materiaux'?'mat':'global';
  const dim=(()=>{const d=parseD(today());d.setDate(d.getDate()+((7-d.getDay())%7));return ymd(d)})();
  openForm({title:r?'Modifier le reçu '+r.numero:'💵 Reçu de paiement',submit:r?'Enregistrer':'Enregistrer et créer le PDF',
    values:r||(typ(ch)==='cle'?{date:today(),mode:'Espèces',payeur:ch.client||'',motif:'paie',categorie:'mo',periode:'Paie du dimanche '+dfr(dim),devisId:(dv.find(d=>d.statut==='accepte')||{}).id||''}:{date:today(),mode:'Espèces',payeur:ch.client||'',motif:byC('recus',cid).length?'solde':'acompte',categorie:'global',periode:PTYPES[typ(ch)].nom,devisId:((marche(cid)||{}).d||{}).id||''}),
    fields:[{type:'html',html:`<div class="banner" style="margin-bottom:10px">${PTYPES[typ(ch)].ic} ${typ(ch)==='cle'?'Chantier':PTYPES[typ(ch)].nom} : <b>${esc(ch.nom||'')}</b></div>`},
      {k:'montant',label:'Montant reçu (FCFA)',type:'number',req:true,ph:'ex. 150000'},{k:'lInfo',type:'info'},
      {k:'date',label:'Date de réception',type:'date'},{k:'payeur',label:'Reçu de (maître d\'ouvrage / client)',req:true},
      {k:'motif',label:'Motif',type:'select',opts:MOTIFS},{k:'etapeId',label:'Étape concernée',type:'select',opts:[['',ets.length?'— Toutes / aucune étape —':'Aucune étape'],...ets.map(e=>[e.id,e.nom])]},{k:'categorie',label:'Ce paiement couvre',type:'select',opts:CATS},{k:'bInfo',type:'info'},{k:'periode',label:'Précision (période, semaine, étape…)',ph:'ex. Paie du dimanche 22/11/2026'},
      {k:'mode',label:'Mode de paiement',type:'select',opts:MODES_PAIE.map(m=>[m,m])},{k:'reference',label:'Référence (n° de transaction Mobile Money, de chèque…)'},
      {k:'objet',label:'Détail (facultatif)'},{k:'devisId',label:'Devis concerné',type:'select',opts:[['','—'],...dv.map(d=>[d.id,d.numero+' ('+STAT_DEV[d.statut||'brouillon']+')'])]}],
    onInput:(f,o)=>{f.querySelector('#lInfo').innerHTML=num(o.montant)?`<span class="sm"><b>${esc(lettres(num(o.montant)))} francs CFA</b> · ≈ ${C(num(o.montant))}</span>`:'';
      if(f.elements.motif.dataset.v!==o.motif){const old=f.elements.motif.dataset.v;f.elements.motif.dataset.v=o.motif;const p=f.elements.periode;if(old!==undefined){if(!p.dataset.t)p.value=o.motif==='paie'?'Paie du dimanche '+dfr(dim):'';if(!f.elements.categorie.dataset.t){f.elements.categorie.value=catOf(o.motif);o.categorie=f.elements.categorie.value}}}
      const x=o.etapeId&&budgetEtape(cid,o.etapeId),m=num(o.montant),bi=f.querySelector('#bInfo');
      if(x&&o.categorie!=='global'){const b=o.categorie==='mo'?x.bMO:x.bMat,deja=(o.categorie==='mo'?x.encMO:x.encMat)-(r&&r.etapeId===o.etapeId&&r.categorie===o.categorie?num(r.montant):0),lab=o.categorie==='mo'?"Main-d'œuvre":'Matériaux';
        bi.innerHTML=b?`<div class="r"><span>${lab} – ${esc(x.e.nom)} : à encaisser</span><b>${F(b-deja)}</b></div><div class="r"><span>Après ce reçu</span><b style="color:${b-deja-m<0?'var(--warn)':'var(--ok)'}">${F(b-deja-m)}</b></div>${b-deja-m<0?'<div class="alert">Ce montant dépasse ce qui reste à encaisser pour cette étape.</div>':''}`:`<span class="sm mute">Pas de budget ${lab.toLowerCase()} pour cette étape : applique le devis au chantier.</span>`}
      else bi.innerHTML=o.etapeId?'<span class="sm mute">Paiement global : il compte dans l\'encaissé du chantier sans être imputé.</span>':''},
    onSave:async o=>{const nid=r?r.id:uid(),pr=save('recus',{...(r||{id:nid,numero:nextNum('recus','REC')}),...o,montant:num(o.montant),chantierId:cid});
      if(!r){toast('Reçu enregistré, création du PDF…');try{await pdfRecu(nid)}catch(e){toast('Le reçu est enregistré mais le PDF a échoué : '+(e.message||e)+'. Réessaie avec le bouton PDF dans l\'onglet Reçus.')}}
      try{await pr}catch(e){}},
    onDelete:r?()=>del('recus',r.id):null});
  const fr=$('#frm');if(fr){['payeur','periode'].forEach(k=>fr.elements[k]&&fr.elements[k].addEventListener('input',e=>e.target.dataset.t=1));fr.elements.categorie&&fr.elements.categorie.addEventListener('change',e=>e.target.dataset.t=1)}
}
let logoTmp=null;
function formReglages(){
  const E=ent();logoTmp=E.logo||'';IMG.sig=S.sig;IMG.cachet=S.cachet;
  openForm({title:'Mon entreprise & réglages',values:{...E,tauxCAD:S.config.tauxCAD,couleur:E.couleur||'#e2711d'},
    fields:[{type:'html',html:dataBlock()},{type:'html',html:`<div class="f"><span class="lbl">Logo</span><div class="row"><div class="logoprev" id="logoPrev">${logoTmp?`<img src="${logoTmp}" alt="">`:'Aucun'}</div>
      <label class="btn sec small upl">Choisir une image<input type="file" accept="image/*" onchange="chargerLogo(this)"></label>${logoTmp?`<button type="button" class="btn ghost small" onclick="logoTmp='';$('#logoPrev').innerHTML='Aucun'">Retirer</button>`:''}</div></div>`},
      {k:'nom',label:"Nom de l'entreprise",req:true,ph:'ex. BATI-PRO SARL'},{k:'activite',label:'Activité / slogan',ph:'Bâtiment – Travaux publics – Génie civil'},
      {k:'adresse',label:'Adresse',ph:'ex. Rue …, Bonamoussadi'},{k:'ville',label:'Ville / BP',ph:'Douala – BP …'},{k:'tel',label:'Téléphone(s)',ph:'+237 6xx xx xx xx'},{k:'email',label:'E-mail'},
      {k:'niu',label:'NIU (n° contribuable)'},{k:'rccm',label:'RCCM'},{k:'banque',label:'Banque / Mobile Money pour les paiements',ph:'ex. Afriland First Bank, compte … / OM 6xx…'},
      {k:'forme',label:'Forme juridique',ph:'ex. SARL, SARLU, Ets'},{k:'capital',label:'Capital social (FCFA)',ph:'ex. 1 000 000'},
      {k:'signataire',label:'Nom du gérant (signataire)',ph:'ex. Jean NANA'},{k:'qualite',label:'Qualité du signataire',ph:'Gérant'},
      {type:'html',html:sigBlock()},{k:'couleur',label:'Couleur des documents',type:'color'},
      {k:'tauxCAD',label:'Taux de change : 1 $ CA = ? FCFA',type:'number'}],
    extra:`<button type="button" class="btn sec block" style="margin-bottom:12px" onclick="closeForm();go('regles')">📐 Règles de calcul (dosages, ratios, aciers par sol…)</button>`,
    onSave:async o=>{const tx=num(o.tauxCAD)||409;delete o.tauxCAD;if(IMG.sig!==S.sig||IMG.cachet!==S.cachet)saveSigs();await saveConfig({tauxCAD:tx,entreprise:{...o,logo:logoTmp,apkRepo:(($('#apkRepo')||{}).value||'').trim()}});toast('Entreprise enregistrée')}});
}
async function chargerLogo(input){const f=input.files[0];if(!f)return;
  try{let r=await compressImage(f,500,0.92,'image/png');if(r.dataUrl.length>180000)r=await compressImage(f,400,0.85,'image/jpeg');logoTmp=r.dataUrl;$('#logoPrev').innerHTML=`<img src="${logoTmp}" alt="">`}
  catch(e){toast('Image illisible')}}

/* ----- signature et cachet ----- */
const IMG={sig:'',cachet:''};
function sigBlock(){const one=(k,lab)=>`<div class="sigc"><span class="sm">${lab}${S[k]?' <span class="pst ok">✓ enregistré</span>':''}</span><div class="sigprev" id="prev_${k}">${IMG[k]?`<img src="${IMG[k]}" alt="">`:'Aucune'}</div>
  <div class="row"><label class="btn sec small upl">Choisir<input type="file" accept="image/*" onchange="chargerSig('${k}',this)"></label><button type="button" class="btn ghost small" onclick="IMG['${k}']='';$('#prev_${k}').innerHTML='Aucune'">Retirer</button></div></div>`;
  return `<div class="f"><span class="lbl">Signature et cachet de l'entreprise</span><div class="sigrow">${one('sig','Ma signature')}${one('cachet','Cachet')}</div>
  <div class="note">Photographie ta signature et le cachet sur une feuille blanche, bien éclairée et à plat. Le fond blanc est retiré automatiquement. Enregistrés une seule fois dans l'application : ensuite, il suffit de toucher « ✍️ Signer et cacheter » sur n'importe quel document.</div></div>`}
async function chargerSig(k,input){const f=input.files[0];input.value='';if(!f)return;
  try{IMG[k]=await detourer(f,k==='sig'?700:500);$('#prev_'+k).innerHTML=`<img src="${IMG[k]}" alt="">`}catch(e){toast('Image illisible')}}
async function detourer(file,max){
  const url=URL.createObjectURL(file);const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=url});
  let w=img.naturalWidth,h=img.naturalHeight;const r=Math.min(1,1400/Math.max(w,h));w=Math.round(w*r);h=Math.round(h*r);
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;const cx=cv.getContext('2d');cx.drawImage(img,0,0,w,h);URL.revokeObjectURL(url);
  const id=cx.getImageData(0,0,w,h),d=id.data;
  // seuil : fond = pixels clairs ; on estime le blanc du papier (90e centile de luminosité)
  const L=new Uint8Array(w*h);for(let i=0;i<w*h;i++){const o=i*4;L[i]=0.299*d[o]+0.587*d[o+1]+0.114*d[o+2]}
  const hist=new Array(256).fill(0);L.forEach(v=>hist[v]++);let acc=0,paper=255;for(let v=255;v>=0;v--){acc+=hist[v];if(acc>=w*h*0.5){paper=v;break}}
  const hi=paper-25,lo=Math.max(0,paper-110);let x0=w,y0=h,x1=0,y1=0;
  for(let i=0;i<w*h;i++){const o=i*4,v=L[i];let a=v>=hi?0:v<=lo?255:Math.round(255*(hi-v)/(hi-lo));d[o+3]=a;
    if(a>40){const x=i%w,y=(i/w)|0;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}}
  cx.putImageData(id,0,0);if(x1<=x0||y1<=y0)throw new Error('vide');
  const m=8;x0=Math.max(0,x0-m);y0=Math.max(0,y0-m);x1=Math.min(w-1,x1+m);y1=Math.min(h-1,y1+m);
  const cw=x1-x0+1,chh=y1-y0+1,s2=Math.min(1,max/Math.max(cw,chh));const out=document.createElement('canvas');out.width=Math.round(cw*s2);out.height=Math.round(chh*s2);
  out.getContext('2d').drawImage(cv,x0,y0,cw,chh,0,0,out.width,out.height);return out.toDataURL('image/png')}

async function saveSigs(){const r=[];for(const k of ['sig','cachet'])if(IMG[k]!==S[k])r.push(await saveImg(k,IMG[k]));if(r.length&&r.every(Boolean))toast('✅ Signature et cachet enregistrés dans l\'application');return r.every(Boolean)}
function formSig(apres){IMG.sig=S.sig;IMG.cachet=S.cachet;
  openForm({title:'Ma signature et mon cachet',fields:[{type:'html',html:sigBlock()}],submit:'Enregistrer',
    onSave:async()=>{if(!IMG.sig&&!IMG.cachet){toast('Choisis au moins la signature ou le cachet.');return}if(await saveSigs()&&apres)setTimeout(apres,200)}})}
