/* ---------- Locations : baux à usage professionnel (boutiques) et quittances de loyer ---------- */
const MOISN=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const ym=d=>(d||today()).slice(0,7),ymAdd=(m,n)=>{const[y,mo]=m.split('-').map(Number),t=y*12+mo-1+n;return `${Math.floor(t/12)}-${String(t%12+1).padStart(2,'0')}`},ymTxt=m=>{const[y,mo]=m.split('-');return MOISN[+mo-1]+' '+y},ymDiff=(a,b)=>{const[y1,m1]=a.split('-').map(Number),[y2,m2]=b.split('-').map(Number);return(y2-y1)*12+(m2-m1)};
const qOf=bid=>S.quittances.filter(q=>q.bailId===bid).sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(b.numero||'').localeCompare(a.numero||''));
const actif=b=>(b.statut||'actif')==='actif';
/* état des loyers : mois dus depuis le premier mois de loyer, mois couverts par les reçus */
function loyerEtat(b){const L=num(b.loyer),deb=b.premierMois||ym(b.debut),qs=qOf(b.id),payes=sum(qs,q=>num(q.nbMois)||0),jour=num(b.jour)||5,d=new Date(),cur=ym(today());
  let fin=cur;if(!actif(b)&&b.finEffective)fin=ym(b.finEffective);const dus=deb&&deb<=fin?ymDiff(deb,fin)+1:0,exigibles=dus-(fin===cur&&d.getDate()<=jour?1:0);
  const couvertJusqua=payes>0?ymAdd(deb,payes-1):null,retard=Math.max(0,exigibles-payes),enc=sum(qs,q=>num(q.montant));
  let c='ok',t=couvertJusqua?`Payé jusqu'à ${ymTxt(couvertJusqua)}`:'Aucun loyer payé';
  if(retard>=1){c='bad';t=`${retard} mois de retard (${F(retard*L)})`}else if(dus>payes){c='warn';t=`Loyer de ${ymTxt(cur)} à payer avant le ${jour}`}
  if(!actif(b)){c=retard?'bad':'mute';t=retard?t:'Bail terminé'}
  return{c,t,dus,payes,retard,enc,couvertJusqua,prochain:ymAdd(deb,payes),L}}
function viewLocations(){const B=[...S.baux].sort((a,b)=>(actif(b)-actif(a))||(a.bien||'').localeCompare(b.bien||'')),A=B.filter(actif);
  const mens=sum(A,b=>num(b.loyer)),ret=sum(A,b=>loyerEtat(b).retard*num(b.loyer)),moisC=ym(today()),encM=sum(S.quittances.filter(q=>ym(q.date)===moisC),q=>num(q.montant));
  let h=`<div class="grid2" style="margin-bottom:12px"><div class="kpi"><div class="l">Loyers par mois</div><div class="v">${F(mens)}</div><small>${A.length} bail${A.length>1?'x':''} en cours</small></div>
   <div class="kpi"><div class="l">Encaissé ce mois</div><div class="v">${F(encM)}</div></div>
   <div class="kpi" style="grid-column:1/-1"><div class="l">${dot(ret?'bad':'ok')} Arriérés de loyers</div><div class="v">${F(ret)}</div></div></div>
   <div class="row between" style="margin-bottom:10px"><div class="secth" style="margin:0">Boutiques louées</div><button class="btn small" onclick="formBail()">+ Contrat de location</button></div>`;
  if(!B.length)return h+`<div class="card empty">Ajoute tes boutiques : chaque contrat de location génère son contrat PDF (bail à usage professionnel, droit OHADA) et ses reçus de loyer.<br><br><button class="btn" onclick="formBail()">+ Premier contrat de location</button></div>`;
  h+=`<div class="card list">`;B.forEach(b=>{const e=loyerEtat(b);h+=`<div class="it click" onclick="ui.view='bail';ui.bid='${b.id}';render()"><div class="main"><div class="t" style="font-weight:600">${dot(e.c)} 🏬 ${esc(b.bien||'Boutique')}</div><div class="s">${esc(b.locNom||'—')}${b.activite?' · '+esc(b.activite):''}</div><div class="s pst ${e.c}">${esc(e.t)}</div></div><div class="amt">${F(num(b.loyer))}<small>par mois</small></div></div>`});
  return h+`</div>`}
function viewBail(b){const e=loyerEtat(b),qs=qOf(b.id);
  let h=`<div class="card"><div class="row between"><div style="min-width:0"><div class="sm mute">${esc(b.adresse||'')}${num(b.surface)?' · '+N(num(b.surface))+' m²':''}</div><div class="sm">Locataire : <b>${esc(b.locNom||'—')}</b>${b.locTel?' · '+esc(b.locTel):''}</div></div>${chip(actif(b)?'En cours':'Terminé',actif(b)?'ok':'')}</div>
    <div class="res" style="margin-top:10px"><div class="r"><span>Loyer mensuel</span><b>${F(num(b.loyer))}</b></div><div class="r"><span>Contrat</span><b>${esc(b.numero||'')} · du ${dfr(b.debut)}${num(b.duree)?' pour '+num(b.duree)+' an'+(num(b.duree)>1?'s':''):' (durée indéterminée)'}</b></div>
    <div class="r"><span>Caution / avance</span><b>${num(b.cautionMois)} mois / ${num(b.avanceMois)} mois</b></div><div class="r"><span>Payable le</span><b>${num(b.jour)||5} de chaque mois</b></div></div>
    <div class="qbtns"><button class="btn" onclick="formQuittance('${b.id}')">💵 Reçu de paiement</button><button class="btn sec" onclick="pdfBail('${b.id}')">📄 Contrat PDF</button><button class="btn sec" onclick="pdfBail('${b.id}',true)">✍️ Contrat signé</button><button class="btn ghost" onclick="formBail('${b.id}')">Modifier</button></div></div>
  <div class="card"><h3>${dot(e.c)} Paiement des loyers</h3><div class="pst ${e.c}" style="margin-bottom:8px">${esc(e.t)}</div><div class="mgrid">${(()=>{let out='';const deb=b.premierMois||ym(b.debut),cur=ym(today());for(let i=-8;i<=3;i++){const m=ymAdd(cur,i);if(m<deb)continue;const k=ymDiff(deb,m),paid=k<e.payes,late=!paid&&(m<cur||(m===cur&&new Date().getDate()>(num(b.jour)||5)));out+=`<div class="mcell ${paid?'ok':late?'bad':m===cur?'warn':''}"><b>${MOISN[+m.slice(5)-1].slice(0,4)}.</b><small>${m.slice(2,4)}</small></div>`}return out})()}</div>
    <div class="note">Vert = payé · orange = à payer ce mois · rouge = en retard. Prochain mois à payer : <b>${ymTxt(e.prochain)}</b>.</div></div>`;
  h+=`<div class="card list"><div class="row between"><h3 style="margin:0">Reçus de loyer</h3><span class="sm mute">${F(e.enc)} encaissés</span></div>`;
  h+=qs.length?qs.map(q=>`<div class="it"><div class="main"><div class="t">${esc(q.numero)} · ${dfr(q.date)}</div><div class="s">${esc(periodeTxt(b,q))} · ${esc(q.mode||'')}</div></div><div class="amt">${F(num(q.montant))}<div class="row" style="gap:2px;justify-content:flex-end"><button class="btn ghost small" onclick="pdfQuittance('${q.id}')">PDF</button><button class="btn ghost small" onclick="formQuittance('${b.id}','${q.id}')">✏️</button>${delBtn('quittances',q.id)}</div></div></div>`).join(''):'<div class="sm mute" style="padding:8px 0">Aucun reçu pour l\'instant.</div>';
  return h+`</div>`}
function periodeTxt(b,q){if(q.type==='caution')return'Caution (dépôt de garantie)';const n=num(q.nbMois)||1;return n===1?'Loyer de '+ymTxt(q.du):`Loyers de ${ymTxt(q.du)} à ${ymTxt(ymAdd(q.du,n-1))} (${n} mois)`}
function formBail(id){const b=id?S.baux.find(x=>x.id===id):null,E=ent();
  const v=b||{numero:nextNum('baux','BAIL'),date:today(),lieu:'Douala',bailNom:E.signataire||'',bailQual:'propriétaire',bailAdr:[E.adresse,E.ville].filter(Boolean).join(', '),bailTel:E.tel||'',debut:today(),duree:3,jour:5,cautionMois:2,avanceMois:0,revision:3,preavis:6,mdDelai:1,juridiction:'Douala',enreg:'preneur',statut:'actif',eau:'preneur',elec:'preneur'};
  openForm({title:b?'Modifier le contrat de location':'Nouveau contrat de location',values:v,submit:'Enregistrer',
    fields:[{k:'numero',label:'Numéro du contrat'},{k:'date',label:'Date du contrat',type:'date'},{k:'lieu',label:'Fait à'},
      {type:'html',html:'<div class="subh">Le bailleur</div>'},{k:'bailNom',label:'Nom du bailleur (propriétaire)',req:true},{k:'bailQual',label:'Agit en qualité de',type:'select',opts:[['propriétaire','Propriétaire'],['mandataire','Mandataire du propriétaire'],['gérant','Gérant de la société propriétaire']]},
      {k:'bailCni',label:'N° CNI / passeport du bailleur'},{k:'bailAdr',label:'Adresse du bailleur'},{k:'bailTel',label:'Téléphone du bailleur',type:'tel'},
      {type:'html',html:'<div class="subh">La boutique</div>'},{k:'bien',label:'Nom de la boutique',req:true,ph:'ex. Boutique n° 1 – Akwa'},{k:'adresse',label:'Adresse / situation',ph:'ex. Rue …, quartier …, Douala'},
      {k:'surface',label:'Superficie (m²)',type:'number'},{k:'descr',label:'Description (pièces, équipements, compteurs)',type:'textarea',ph:'ex. 1 salle de vente de 20 m², 1 arrière-boutique, rideau métallique, compteur ENEO séparé'},
      {k:'tf',label:'Titre foncier n° (facultatif)'},
      {type:'html',html:'<div class="subh">Le locataire (preneur)</div>'},{k:'locNom',label:'Nom et prénoms / raison sociale',req:true},{k:'locRep',label:'Si société : représentée par'},
      {k:'locCni',label:'N° CNI / passeport'},{k:'locRccm',label:'RCCM / NIU (si commerçant)'},{k:'locAdr',label:'Adresse / domicile'},{k:'locTel',label:'Téléphone',type:'tel'},{k:'activite',label:'Activité exercée dans la boutique',req:true,ph:'ex. vente de vêtements et accessoires'},
      {type:'html',html:'<div class="subh">Durée et loyer</div>'},{k:'debut',label:'Date d\'entrée en vigueur',type:'date'},{k:'duree',label:'Durée (années, 0 = indéterminée)',type:'number'},
      {k:'loyer',label:'Loyer mensuel (FCFA)',type:'number',req:true},{k:'jour',label:'Payable d\'avance au plus tard le (jour du mois)',type:'number'},
      {k:'cautionMois',label:'Caution / dépôt de garantie (mois de loyer)',type:'number'},{k:'avanceMois',label:'Avance de loyers versée à la signature (mois)',type:'number'},
      {k:'premierMois',label:'Premier mois de loyer (si différent du mois d\'entrée)',type:'month'},{k:'lInfo',type:'info'},
      {k:'revision',label:'Révision du loyer tous les (années)',type:'number'},{k:'eau',label:'Eau (CAMWATER)',type:'select',opts:[['preneur','À la charge du locataire'],['bailleur','À la charge du bailleur']]},{k:'elec',label:'Électricité (ENEO)',type:'select',opts:[['preneur','À la charge du locataire'],['bailleur','À la charge du bailleur']]},
      {k:'enreg',label:'Frais d\'enregistrement du bail',type:'select',opts:[['preneur','À la charge du locataire'],['bailleur','À la charge du bailleur'],['partage','Partagés à parts égales']]},
      {k:'preavis',label:'Préavis de congé (mois)',type:'number'},{k:'juridiction',label:'Tribunaux compétents de'},{k:'clauses',label:'Clauses particulières',type:'textarea'},
      {k:'entete',label:'En-tête des documents',type:'select',opts:[['ent','Logo et nom de mon entreprise'],['simple','Sans en-tête d\'entreprise']]},{k:'cachet',label:'En signant, apposer aussi le cachet',type:'select',opts:[['auto','Selon l\'en-tête (sans en-tête = signature seule)'],['oui','Toujours : signature + cachet'],['non','Jamais : signature seule']]},
      {type:'html',html:'<div class="subh">Suivi</div>'},{k:'statut',label:'Statut',type:'select',opts:[['actif','En cours'],['termine','Terminé']]},{k:'finEffective',label:'Date de fin (si terminé)',type:'date'}],
    onInput:(f,o)=>{const L=num(o.loyer);f.querySelector('#lInfo').innerHTML=L?`<div class="res"><div class="r"><span>Caution</span><b>${F(L*num(o.cautionMois))}</b></div><div class="r"><span>Avance</span><b>${F(L*num(o.avanceMois))}</b></div><div class="r big"><span>À verser à la signature</span><b>${F(L*(num(o.cautionMois)+num(o.avanceMois)))}</b></div><div class="r sm"><span>Loyer annuel</span><b>${F(L*12)}</b></div></div>`:''},
    onSave:async o=>{if(o.premierMois&&!/^\d{4}-\d{2}$/.test(o.premierMois)){toast('Premier mois : format AAAA-MM, ex. 2026-12');o.premierMois=''}
      const nid=await save('baux',{...(b||{cree:Date.now()}),...o});
      if(!b&&num(o.avanceMois)>0){await save('quittances',{bailId:nid,numero:nextNum('quittances','QL'),date:o.date||today(),du:o.premierMois||ym(o.debut),nbMois:num(o.avanceMois),montant:num(o.loyer)*num(o.avanceMois),mode:'Espèces',type:'loyer',auto:true})}
      ui.view='bail';ui.bid=nid;render();toast(b?'Contrat modifié':'Contrat enregistré'+(num(o.avanceMois)>0?' (avance enregistrée comme reçu)':''))},
    onDelete:b?async()=>{for(const q of qOf(b.id))await del('quittances',q.id);await del('baux',b.id);go('locations');toast('Contrat supprimé')}:null});
}
function formQuittance(bid,qid){const b=S.baux.find(x=>x.id===bid);if(!b)return;const q=qid?S.quittances.find(x=>x.id===qid):null,e=loyerEtat(b);
  openForm({title:q?'Modifier le reçu '+q.numero:'💵 Reçu de paiement (loyer)',submit:q?'Enregistrer':'Enregistrer et créer le PDF',values:q||{date:today(),type:'loyer',du:e.prochain,nbMois:1,montant:num(b.loyer),mode:'Espèces'},
    fields:[{type:'html',html:`<div class="banner" style="margin-bottom:10px">🏬 ${esc(b.bien)} · ${esc(b.locNom||'')}<br>Loyer : ${F(num(b.loyer))} / mois · ${esc(e.t)}</div>`},
      {k:'type',label:'Nature du paiement',type:'select',opts:[['loyer','Loyer'],['caution','Caution (dépôt de garantie)']]},
      {k:'du',label:'Premier mois payé',type:'select',opts:Array.from({length:37},(_,i)=>ymAdd(e.prochain,i-12)).map(m=>[m,ymTxt(m).replace(/^./,c=>c.toUpperCase())+(m===e.prochain?' (prochain à payer)':'')])},{k:'nbMois',label:'Nombre de mois payés',type:'number'},{k:'montant',label:'Montant reçu (FCFA)',type:'number',req:true},{k:'qInfo',type:'info'},
      {k:'date',label:'Date du paiement',type:'date'},{k:'mode',label:'Mode de paiement',type:'select',opts:MODES_PAIE.map(m=>[m,m])},{k:'reference',label:'Référence (Mobile Money, chèque…)'},{k:'obs',label:'Observation (facultatif)'}],
    onInput:(f,o)=>{const n=num(o.nbMois)||1,ok=/^\d{4}-\d{2}$/.test(o.du||'');f.querySelector('#qInfo').innerHTML=o.type==='caution'?'<span class="sm mute">La caution n\'entre pas dans le calcul des loyers payés.</span>':ok?`<span class="sm">${esc(periodeTxt(b,{du:o.du,nbMois:n}))} · attendu ${F(n*num(b.loyer))}${num(o.montant)&&Math.abs(num(o.montant)-n*num(b.loyer))>0.5?` <span class="pst warn">(écart ${F(num(o.montant)-n*num(b.loyer))})</span>`:''}</span>`:'<span class="pst bad">Mois au format AAAA-MM, ex. 2026-12</span>';
      const m=f.elements.montant;if(!m.dataset.t&&o.type!=='caution')m.value=n*num(b.loyer)},
    onSave:async o=>{if(o.type==='caution')o.nbMois=0;else if(!/^\d{4}-\d{2}$/.test(o.du||'')){toast('Premier mois : format AAAA-MM');return}
      const id=q?q.id:uid();save('quittances',{...(q||{bailId:bid,numero:nextNum('quittances','QL')}),...o,id});if(!q)setTimeout(()=>pdfQuittance(id),120);else toast('Reçu modifié')}});
  setTimeout(()=>{const f=$('#frm');f&&f.elements.montant&&f.elements.montant.addEventListener('input',e=>e.target.dataset.t=1)},30);
}
function bailleurLines(b){return[b.bailNom,b.bailAdr,b.bailTel&&'Tél. '+b.bailTel].filter(Boolean)}
async function pdfQuittance(qid){const q=S.quittances.find(x=>x.id===qid);if(!q)return;const b=S.baux.find(x=>x.id===q.bailId)||{};NOENT=b.entete==='simple';NOCACHET=(b.cachet==='oui'||b.cachet==='non')?b.cachet==='non':b.entete==='simple';try{if(!SIGN)lastGen=()=>pdfQuittance(qid);
  const {doc,y:y0,col}=pdfBase(q.type==='caution'?'REÇU DE CAUTION':'QUITTANCE DE LOYER','N° '+q.numero);let y=y0+2;
  const yb=Math.max(box(doc,14,y,88,'Bailleur',bailleurLines(b),col),box(doc,108,y,88,'Locataire',[b.locNom||'',b.locAdr,b.locTel&&'Tél. '+b.locTel].filter(Boolean),col));y=yb+6;
  doc.setFont('helvetica','normal');doc.setFontSize(10);const per=periodeTxt(b,q),M=num(q.montant);
  const txt=`Je soussigné(e), ${b.bailNom||'[bailleur]'}, ${b.bailQual||'propriétaire'} de la boutique « ${b.bien||''} » située ${b.adresse||'[adresse]'}, déclare avoir reçu de ${b.locNom||'[locataire]'} la somme de ${lettres(M)} (${FN(M)}) francs CFA, au titre de : ${per.toLowerCase()}, en vertu du contrat de bail n° ${b.numero||''} du ${dfr(b.date||b.debut)}.`;
  doc.splitTextToSize(T(txt),182).forEach(l=>{doc.text(l,14,y);y+=5});y+=4;
  const rows=[['Nature',q.type==='caution'?'Caution / dépôt de garantie':'Loyer'],['Période',per],['Loyer mensuel',F(num(b.loyer))],['Montant reçu',F(M)],['En lettres',lettres(M)+' francs CFA'],['Mode de paiement',(q.mode||'')+(q.reference?' – réf. '+q.reference:'')],['Date du paiement',dfr(q.date)]];
  if(q.obs)rows.push(['Observation',q.obs]);
  doc.autoTable({...tstyle(col),startY:y,body:rows.map(r=>r.map(T)),columnStyles:{0:{cellWidth:45,fontStyle:'bold'}},styles:{...tstyle(col).styles,fontSize:9.5}});y=doc.lastAutoTable.finalY+6;
  if(q.type!=='caution'){const e=loyerEtat(b);doc.setFontSize(9);doc.setTextColor(90,96,106);doc.text(T(e.couvertJusqua?`Loyers payés jusqu'à ${ymTxt(e.couvertJusqua)} inclus.${e.retard?' Reste dû : '+e.retard+' mois.':''}`:''),14,y);doc.setTextColor(30,35,43);y+=6}
  doc.setFontSize(8.5);doc.setTextColor(90,96,106);doc.text(T('Cette quittance annule tous les reçus qui auraient pu être donnés pour acompte sur la même période. Elle ne vaut pas renonciation aux sommes restant dues.'),14,y,{maxWidth:182});doc.setTextColor(30,35,43);y+=10;
  doc.setFontSize(10);doc.text(T(`Fait à ${b.lieu||'Douala'}, le ${dfr(q.date)}`),14,y);y+=6;
  signatures(doc,y,'Le locataire','Le bailleur - '+(b.bailNom||''));
  await savePdf(doc,`Quittance ${q.numero} - ${T(b.bien||'')}.pdf`)}finally{NOENT=false;NOCACHET=false}}
async function pdfBail(bid,signe){const b=S.baux.find(x=>x.id===bid);if(!b)return;if(signe)return signerEtCacheter(()=>pdfBail(bid));if(!SIGN)lastGen=()=>pdfBail(bid);NOENT=b.entete==='simple';NOCACHET=(b.cachet==='oui'||b.cachet==='non')?b.cachet==='non':b.entete==='simple';try{
  const L=num(b.loyer),ville=b.juridiction||'Douala',dur=num(b.duree);
  const {doc,y:y0,col}=pdfBase('CONTRAT DE BAIL À USAGE PROFESSIONNEL','N° '+(b.numero||''));let y=y0;const W=182;
  const par=(t,o={})=>{doc.setFont('helvetica',o.b?'bold':o.i?'italic':'normal');doc.setFontSize(o.s||9.5);doc.splitTextToSize(T(t),W).forEach(l=>{y=ensure(doc,y,6);doc.text(l,14,y);y+=4.6});y+=o.after??2.5};
  const art=(n,t)=>{y=ensure(doc,y,14);y+=2;doc.setFillColor(245,240,232);doc.rect(14,y-4.2,W,6.4,'F');doc.setTextColor(...col);par(`ARTICLE ${n} - ${t.toUpperCase()}`,{b:true,after:2});doc.setTextColor(30,35,43)};
  par('(Boutique – local à usage commercial, régi par l\'Acte uniforme OHADA portant sur le droit commercial général du 15 décembre 2010, articles 101 et suivants, et à titre supplétif par le Code civil applicable au Cameroun)',{i:true,s:8.5,after:4});
  par('ENTRE LES SOUSSIGNÉS :',{b:true});
  par(`${b.bailNom||'[bailleur]'}${b.bailCni?', titulaire de la CNI / du passeport n° '+b.bailCni:''}, demeurant à ${b.bailAdr||'[adresse]'}${b.bailTel?', tél. '+b.bailTel:''}, agissant en qualité de ${b.bailQual||'propriétaire'},`);
  par('ci-après dénommé « le Bailleur », d\'une part,',{i:true});par('ET',{b:true});
  par(`${b.locNom||'[locataire]'}${b.locRep?', représenté(e) par '+b.locRep:''}${b.locCni?', titulaire de la CNI / du passeport n° '+b.locCni:''}${b.locRccm?', RCCM / NIU '+b.locRccm:''}, demeurant à ${b.locAdr||'[adresse]'}${b.locTel?', tél. '+b.locTel:''},`);
  par('ci-après dénommé « le Preneur », d\'autre part.',{i:true,after:4});
  par('IL A ÉTÉ CONVENU ET ARRÊTÉ CE QUI SUIT :',{b:true,after:3});let n=1;
  art(n++,'Objet et désignation des locaux');
  par(`Le Bailleur donne à bail à usage professionnel au Preneur, qui accepte, la boutique dénommée « ${b.bien||''} », située ${b.adresse||'[adresse]'}${b.tf?', sur l\'immeuble objet du titre foncier n° '+b.tf:''}${num(b.surface)?', d\'une superficie d\'environ '+N(num(b.surface))+' m²':''}${b.descr?', comprenant : '+b.descr:''}. Le Preneur déclare bien connaître les lieux pour les avoir visités.`);
  art(n++,'Destination des lieux');
  par(`Les lieux loués sont destinés exclusivement à l'activité suivante : ${b.activite||'[activité]'}. Le Preneur ne pourra changer cette destination, ni y exercer une autre activité, sans l'accord écrit du Bailleur. Il s'interdit toute activité illicite, dangereuse, insalubre ou de nature à troubler le voisinage. Il fait son affaire personnelle des autorisations administratives, de l'immatriculation et des impôts liés à son activité.`);
  art(n++,'Durée');
  par(dur?`Le présent bail est conclu pour une durée déterminée de ${dur} an${dur>1?'s':''}, qui commence le ${dfr(b.debut)} et prend fin le ${dfr(ymAdd(ym(b.debut),dur*12)+'-'+(b.debut||'').slice(8,10))}. Conformément aux articles 123 et 124 de l'Acte uniforme, le Preneur qui a exploité son activité dans les lieux pendant au moins deux ans peut demander le renouvellement du bail, par acte extrajudiciaire, au plus tard trois mois avant son expiration ; à défaut, il est déchu de ce droit.`
    :`Le présent bail est conclu pour une durée indéterminée à compter du ${dfr(b.debut)}. Chaque partie peut y mettre fin par un congé notifié par acte extrajudiciaire au moins ${num(b.preavis)||6} mois à l'avance, conformément à l'article 125 de l'Acte uniforme.`);
  art(n++,'Loyer');
  par(`Le bail est consenti moyennant un loyer mensuel de ${FN(L)} FCFA (${lettres(L)} francs CFA), soit ${FN(L*12)} FCFA par an. Le loyer est payable d'avance, au plus tard le ${num(b.jour)||5} de chaque mois, en espèces contre quittance, par Mobile Money ou par virement. Chaque paiement donne lieu à la remise d'une quittance signée par le Bailleur.`);
  par(`Le loyer pourra être révisé tous les ${num(b.revision)||3} ans d'un commun accord ; à défaut d'accord, la partie la plus diligente saisit la juridiction compétente, conformément à l'article 117 de l'Acte uniforme, qui le fixe en tenant compte notamment de la situation des locaux et des loyers pratiqués pour des locaux comparables du voisinage.`);
  if(num(b.cautionMois)||num(b.avanceMois)){art(n++,'Caution et avance');
    par(`${num(b.cautionMois)?`À la signature, le Preneur verse une caution (dépôt de garantie) de ${num(b.cautionMois)} mois de loyer, soit ${FN(L*num(b.cautionMois))} FCFA. Elle ne produit pas d'intérêts et ne peut en aucun cas servir au paiement des derniers loyers. Elle est restituée au départ du Preneur, après l'état des lieux de sortie et la remise des clés, déduction faite des sommes restant dues et du coût des réparations locatives. `:''}${num(b.avanceMois)?`Le Preneur verse en outre une avance de ${num(b.avanceMois)} mois de loyer, soit ${FN(L*num(b.avanceMois))} FCFA, qui s'impute sur les loyers des ${num(b.avanceMois)} premiers mois.`:''}`)}
  art(n++,'Charges, impôts et taxes');
  par(`Les consommations d'eau ${b.eau==='bailleur'?'sont à la charge du Bailleur':'(CAMWATER) sont à la charge du Preneur'} ; les consommations d'électricité ${b.elec==='bailleur'?'sont à la charge du Bailleur':'(ENEO) sont à la charge du Preneur, qui souscrit ou fait transférer l\'abonnement à son nom si nécessaire'}. Le Preneur acquitte les impôts, taxes et patentes liés à son activité. L'impôt foncier reste à la charge du Bailleur.`);
  art(n++,'Obligations du Bailleur');
  par('Conformément aux articles 105 et 106 de l\'Acte uniforme, le Bailleur s\'engage à délivrer les locaux en bon état, à en assurer la jouissance paisible au Preneur pendant toute la durée du bail, et à prendre en charge les grosses réparations (gros murs, toiture, structure, canalisations principales). Il ne peut, de son seul fait, apporter des changements à l\'état des locaux ni en restreindre l\'usage.');
  art(n++,'Obligations du Preneur');
  par('Conformément à l\'article 112 de l\'Acte uniforme, le Preneur s\'engage à payer le loyer aux termes convenus et à exploiter les lieux en bon père de famille, conformément à leur destination. Il s\'engage également à : entretenir les lieux et effectuer les réparations d\'entretien courant (peinture, serrures, rideau métallique, appareillages, vitres) ; ne faire aucune transformation ou démolition sans l\'accord écrit du Bailleur, les améliorations restant acquises au Bailleur en fin de bail sans indemnité sauf accord contraire ; laisser le Bailleur visiter les lieux pour constater leur état, après avoir été prévenu ; assurer son stock, ses biens et sa responsabilité civile ; restituer les lieux en bon état en fin de bail, sauf l\'usure normale.');
  art(n++,'Sous-location et cession');
  par('Toute sous-location, totale ou partielle, est interdite sans l\'accord exprès et écrit du Bailleur. La cession du bail n\'est possible qu\'avec le fonds de commerce ou l\'activité exercée dans les lieux, et doit être portée à la connaissance du Bailleur par acte extrajudiciaire, conformément à l\'Acte uniforme ; le cédant reste garant du paiement des loyers.');
  art(n++,'État des lieux');
  par('Un état des lieux contradictoire est établi à l\'entrée du Preneur et à sa sortie, signé par les deux parties. À défaut d\'état des lieux d\'entrée, le Preneur est présumé avoir reçu les locaux en bon état.');
  art(n++,'Résiliation');
  par('Le Preneur et le Bailleur sont tenus chacun au respect des clauses et conditions du bail. En cas de manquement, notamment le défaut de paiement du loyer à son échéance, la partie qui entend obtenir la résiliation doit, conformément à l\'article 133 de l\'Acte uniforme, faire délivrer à l\'autre une mise en demeure par acte extrajudiciaire d\'avoir à respecter ses obligations dans un délai d\'un mois. Si la mise en demeure reste sans effet, la résiliation du bail et l\'expulsion du Preneur et de tout occupant de son chef peuvent être demandées à la juridiction compétente.');
  art(n++,'Enregistrement');
  par(`Le présent bail sera soumis à la formalité de l'enregistrement auprès de l'administration fiscale. Les droits correspondants sont à la charge ${b.enreg==='bailleur'?'du Bailleur':b.enreg==='partage'?'des deux parties, à parts égales':'du Preneur'}.`);
  art(n++,'Litiges et élection de domicile');
  par(`Les parties s'efforcent de régler à l'amiable tout différend né de l'exécution du présent bail. À défaut, le litige est porté devant les juridictions compétentes de ${ville}. Pour l'exécution des présentes, les parties élisent domicile à leurs adresses indiquées ci-dessus. Le présent contrat est régi par l'Acte uniforme OHADA portant sur le droit commercial général et, à titre supplétif, par le Code civil applicable au Cameroun.`);
  if(b.clauses){art(n++,'Clauses particulières');par(b.clauses)}
  y+=2;par(`Fait à ${b.lieu||ville}, le ${dfr(b.date||today())}, en deux (2) exemplaires originaux.`,{b:true,after:3});
  par('Signatures précédées de la mention manuscrite « Lu et approuvé ».',{i:true,s:8.5,after:3});
  signatures(doc,y,'Le Preneur','Le Bailleur - '+(b.bailNom||''));
  const np=doc.getNumberOfPages();for(let i=1;i<=np;i++){doc.setPage(i);doc.setFontSize(7.5);doc.setTextColor(110,115,125);const x0=62;doc.text('Paraphes -  Bailleur :',x0,281);let xx=x0+doc.getTextWidth('Paraphes -  Bailleur :')+2;
    if(SIGN&&S.sig){try{const p=doc.getImageProperties(S.sig),hh=6,ww=Math.min(20,hh*p.width/p.height);doc.addImage(S.sig,'PNG',xx,276,ww,hh)}catch(e){}}
    doc.setDrawColor(190,184,174);doc.line(xx,281.5,xx+22,281.5);xx+=30;doc.text('Preneur :',xx,281);xx+=doc.getTextWidth('Preneur :')+2;doc.line(xx,281.5,xx+22,281.5);doc.setTextColor(30,35,43)}
  await savePdf(doc,`Bail ${b.numero||''} - ${T(b.bien||'')}.pdf`)}finally{NOENT=false;NOCACHET=false}}

function choisirBail(){const L=S.baux.filter(actif);if(!L.length){toast('Crée d\'abord le contrat de location de la boutique.');formBail();return}if(L.length===1)return formQuittance(L[0].id);
  $('#modalRoot').innerHTML=`<div class="modal-bg" onclick="if(event.target===this)closeForm()"><div class="modal"><h2>💵 Reçu de paiement</h2><div class="sm mute" style="margin-bottom:10px">Pour quelle boutique ?</div>
  <div class="list">${L.map(b=>{const e=loyerEtat(b);return `<div class="it click" onclick="closeForm();formQuittance('${b.id}')"><div class="main"><div class="t" style="font-weight:600">${dot(e.c)} 🏬 ${esc(b.bien)}</div><div class="s">${esc(b.locNom||'')} · ${esc(e.t)}</div></div><div class="amt">${F(num(b.loyer))}</div></div>`}).join('')}</div>
  <button class="btn ghost block" style="margin-top:10px" onclick="closeForm()">Annuler</button></div></div>`}
