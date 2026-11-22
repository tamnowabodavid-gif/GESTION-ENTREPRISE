/* ---------- Contrat de construction clé en main ---------- */
const ECH_DEF=[['À la signature du contrat (acompte)',30],['Fin des fondations et du soubassement',15],['Fin de l\'élévation des murs et des chaînages',20],['Fin de la toiture ou de la dalle',15],['Fin des réseaux (plomberie, électricité) et des enduits',10],['Fin des finitions (carrelage, menuiseries, peinture)',5],['À la réception des travaux (solde)',5]];
const contratOf=cid=>S.contrats.find(c=>c.chantierId===cid);
function contratPrix(ct){const d=ct&&S.devis.find(x=>x.id===ct.devisId)||(marche(ct?ct.chantierId:ui.cid)||{}).d;return d?{d,t:totDevis(d)}:null}
function echeancier(ct){const pr=contratPrix(ct),T=pr?pr.t.ttc:0,enc=sum(byC('recus',ct.chantierId),r=>num(r.montant));let cum=0,first=true;
  return(ct.echeancier||ECH_DEF.map(([l,p])=>({l,p}))).map(x=>{const m=T*num(x.p)/100;cum+=m;const ok=enc>=cum-0.5,part=!ok&&enc>cum-m+0.5;let c='mute';if(ok)c='ok';else if(first){c=part?'warn':'bad';first=false}return{...x,m,cum,c,t:ok?'Payé':part?`Payé en partie : reste ${F(cum-enc)}`:c==='bad'?'À encaisser maintenant':'À venir'}})}
function descOuvrage(cid){const d=(marche(cid)||{}).d,p=d&&d.params;if(!p)return'';const et=num(p.etages),ch=num(p.chambres);
  return `Bâtiment à usage d'habitation ${et?'R+'+et:'en plain-pied'} de ${N(num(p.L))} m × ${N(num(p.l))} m${ch?', comprenant '+ch+' chambre'+(ch>1?'s':''):''}${num(p.sdb)?', '+num(p.sdb)+' salle'+(num(p.sdb)>1?'s':'')+' d\'eau':''}, toiture ${p.toiture==='terrasse'?'terrasse':'en tôles sur charpente bois'}`}
function tContrat(ch){
  const ct=contratOf(ch.id);
  let h=`<div class="banner">Modèle de contrat de construction clé en main établi selon le droit camerounais (Code civil applicable au Cameroun, loi n° 2004/003 du 21 avril 2004 régissant l'urbanisme). Fais-le relire par un avocat ou un notaire avant de le signer pour un montant important.</div>`;
  if(!ct)return h+`<div class="card empty">Aucun contrat pour ce chantier.<br><br><button class="btn" onclick="formContrat()">📝 Préparer le contrat</button><br><span class="sm">Les informations du chantier, du client et du devis accepté sont reprises automatiquement.</span></div>`;
  const pr=contratPrix(ct),E=ent(),ech=echeancier(ct),signe=ct.statut==='signe';
  h+=`<div class="card"><div class="row between"><h3 style="margin:0">${dot(signe?'ok':'warn')} ${esc(ct.numero)}</h3>${chip(signe?'Signé'+(ct.dateSignature?' le '+dfr(ct.dateSignature):''):'Brouillon',signe?'ok':'go')}</div>
    <div class="res" style="margin-top:10px"><div class="r"><span>Entreprise</span><b>${esc(E.nom||'—')}</b></div><div class="r"><span>Représentée par</span><b>${esc(E.signataire||'—')}${E.qualite?', '+esc(E.qualite):''}</b></div>
    <div class="r"><span>Maître d'ouvrage</span><b>${esc(ct.moNom||'—')}</b></div><div class="r"><span>Prix du marché</span><b>${pr?F(pr.t.ttc):'<span class="mute">aucun devis</span>'}</b></div>
    <div class="r"><span>Délai d'exécution</span><b>${num(ct.delai)} mois${ct.debut?' à partir du '+dfr(ct.debut):''}</b></div></div>
    ${!E.signataire||!E.nom?`<div class="alert">Complète dans ⚙︎ le nom de l'entreprise et le nom du gérant (signataire).</div>`:''}
    <div class="qbtns"><button class="btn" onclick="pdfContrat('${ch.id}')">📄 Contrat PDF</button><button class="btn" onclick="pdfContrat('${ch.id}',true)">✍️ Signé et cacheté</button><button class="btn sec" onclick="formContrat()">Modifier</button>
      <button class="btn danger small" onclick="confirmDel(this,()=>del('contrats','${ct.id}'),true)">🗑</button></div></div>`;
  if(pr)h+=`<div class="card list"><h3>Échéancier de paiement</h3>${ech.map(x=>`<div class="it"><div class="main"><div class="t" style="font-weight:500">${dot(x.c)} ${esc(x.l)}</div><div class="s pst ${x.c}">${esc(x.t)}</div></div><div class="amt">${F(x.m)}<small>${N(num(x.p))} %</small></div></div>`).join('')}
    <div class="note">Le statut suit les reçus de paiement enregistrés pour ce chantier.</div></div>`;
  h+=`<div class="card"><h3>Contrat signé par les deux parties</h3>${(ct.scans||[]).length?`<div class="thumbs">${thumbsHtml(null,false,ct.scans)}</div>`:'<div class="sm mute">Ajoute la photo ou le PDF du contrat signé dans « Modifier » (en bas du formulaire), et passe le statut à « Signé ».</div>'}</div>`;
  return h;
}
function echRow(x={}){return `<div class="ecr"><input data-e="l" value="${esc(x.l||'')}" placeholder="Étape de paiement"><input data-e="p" inputmode="decimal" value="${esc(x.p??'')}" placeholder="%"><button type="button" class="btn ghost small delb" onclick="this.parentNode.remove();echTot()">×</button></div>`}
function echTot(){const f=$('#frm');if(!f)return;const t=sum([...f.querySelectorAll('.ecr [data-e=p]')],i=>num(i.value)),pr=contratPrix(contratOf(ui.cid)||{chantierId:ui.cid}),el=$('#echT');if(el)el.innerHTML=`<span class="${Math.abs(t-100)<0.01?'pst ok':'pst bad'}">Total : ${N(t)} %${Math.abs(t-100)<0.01?'':' (doit faire 100 %)'}</span>${pr?` · ${F(pr.t.ttc)}`:''}`}
function formContrat(){
  const ch=S.chantiers.find(c=>c.id===ui.cid),ct=contratOf(ui.cid),dv=byC('devis',ui.cid),mk=marche(ui.cid),E=ent();
  const p=(mk&&mk.d.params)||{};
  const v=ct||{numero:nextNum('contrats','CT'),date:today(),lieu:(String(E.ville||ch.lieu||'Douala').split(/[–,-]/)[0]).trim(),moNom:ch.client||'',moQualite:'particulier',moAdresse:ch.clientAdresse||'',moTel:ch.clientTel||'',
    terrainLieu:ch.lieu||'',permisPar:'mo',ouvrage:descOuvrage(ui.cid),devisId:mk?mk.d.id:'',prixFerme:true,retenue:5,retenueLib:'reserves',delai:num(p.duree)||(4+3*num(p.etages)),debut:ch.debut||'',penalite:1,plafond:5,miseDemeure:15,juridiction:(String(E.ville||'Douala').split(/[–,-]/)[0]).trim(),litige:'tribunaux',assurance:true,statut:'brouillon',echeancier:ECH_DEF.map(([l,p])=>({l,p:l.includes('acompte')&&mk?num(mk.d.acompte)||p:p}))};
  openForm({title:ct?'Modifier le contrat':'Préparer le contrat',values:v,submit:'Enregistrer le contrat',
    fields:[{k:'numero',label:'Numéro du contrat'},{k:'date',label:'Date du contrat',type:'date'},{k:'lieu',label:'Fait à'},
      {type:'html',html:'<div class="subh">Maître d\'ouvrage (client)</div>'},
      {k:'moNom',label:'Nom et prénoms / raison sociale',req:true},{k:'moQualite',label:'Agit en qualité de',type:'select',opts:[['particulier','Particulier (propriétaire du terrain)'],['societe','Représentant d\'une société'],['mandataire','Mandataire du propriétaire']]},
      {k:'moRep',label:'Si société ou mandataire : nom du représentant et qualité'},{k:'moCni',label:'N° de CNI / passeport'},{k:'moCniDate',label:'Délivrée le',type:'date'},{k:'moCniLieu',label:'Délivrée à'},
      {k:'moAdresse',label:'Adresse / domicile'},{k:'moTel',label:'Téléphone',type:'tel'},{k:'moEmail',label:'E-mail'},
      {type:'html',html:'<div class="subh">Terrain et autorisations</div>'},
      {k:'tf',label:'Titre foncier n°'},{k:'terrainLieu',label:'Situation du terrain (ville, quartier, lieu-dit)'},{k:'terrainSup',label:'Superficie du terrain (m²)',type:'number'},
      {k:'permisPar',label:'Permis de construire',type:'select',opts:[['obtenu','Déjà obtenu'],['mo','À obtenir par le maître d\'ouvrage'],['ent','À obtenir par l\'entreprise (inclus au devis)']]},{k:'permisNum',label:'N° et date du permis (si obtenu)'},
      {type:'html',html:'<div class="subh">Ouvrage, prix et délais</div>'},
      {k:'ouvrage',label:'Description de l\'ouvrage',type:'textarea'},{k:'devisId',label:'Devis de référence (prix)',type:'select',opts:[['','—'],...dv.map(d=>[d.id,d.numero+' – '+FN(totDevis(d).ttc)+' FCFA ('+STAT_DEV[d.statut||'brouillon']+')'])]},
      {k:'prixFerme',label:'Prix forfaitaire, ferme et non révisable',type:'checkbox'},{k:'delai',label:'Délai d\'exécution (mois)',type:'number'},{k:'debut',label:'Date de démarrage des travaux',type:'date'},
      {k:'penalite',label:'Pénalité de retard (pour mille du prix par jour)',type:'number'},{k:'plafond',label:'Plafond des pénalités (% du prix)',type:'number'},
      {type:'html',html:`<div class="f"><span class="lbl">Échéancier de paiement (en % du prix)</span><div id="ech">${v.echeancier.map(echRow).join('')}</div><div class="row between"><button type="button" class="btn sec small" onclick="document.getElementById('ech').insertAdjacentHTML('beforeend',echRow());echTot()">+ Tranche</button><span class="sm" id="echT"></span></div></div>`},
      {k:'retenue',label:'Retenue de garantie (% du prix)',type:'number'},{k:'retenueLib',label:'Libérée',type:'select',opts:[['reserves','à la levée des réserves'],['un_an','un an après la réception']]},
      {k:'miseDemeure',label:'Délai après mise en demeure (jours)',type:'number'},
      {type:'html',html:'<div class="subh">Litiges et divers</div>'},
      {k:'litige',label:'Règlement des litiges (après tentative amiable)',type:'select',opts:[['tribunaux','Tribunaux compétents'],['ohada','Arbitrage OHADA (CCJA)']]},{k:'juridiction',label:'Ville des tribunaux compétents'},
      {k:'assurance',label:'L\'entreprise justifie d\'une assurance responsabilité civile',type:'checkbox'},{k:'clauses',label:'Clauses particulières',type:'textarea'},
      {type:'html',html:'<div class="subh">Signature</div>'},{k:'statut',label:'Statut',type:'select',opts:[['brouillon','Brouillon (à signer)'],['signe','Signé par les deux parties']]},{k:'dateSignature',label:'Date de signature',type:'date'},
      {type:'html',html:photoWidget('contrat',ct&&ct.scans,'Contrat signé (photo ou PDF)')}],
    collect:f=>({echeancier:[...f.querySelectorAll('#ech .ecr')].map(r=>({l:r.querySelector('[data-e=l]').value.trim(),p:num(r.querySelector('[data-e=p]').value)})).filter(x=>x.l||x.p)}),
    onSave:async o=>{const t=sum(o.echeancier,x=>x.p);if(Math.abs(t-100)>0.01)toast(`Attention : l'échéancier fait ${N(t)} % au lieu de 100 %.`);
      await save('contrats',{...(ct||{}),...o,scans:PW.contrat,chantierId:ui.cid});toast('Contrat enregistré')}});
  setTimeout(()=>{echTot();const f=$('#frm');f&&f.addEventListener('input',echTot)},30);
}
async function pdfContrat(cid,signe){
  const ct=contratOf(cid);if(!ct){toast('Prépare d\'abord le contrat.');return}
  if(signe)return signerEtCacheter(()=>pdfContrat(cid));
  if(!SIGN)lastGen=()=>pdfContrat(cid);
  const ch=S.chantiers.find(c=>c.id===cid)||{},E=ent(),pr=contratPrix(ct),TT=pr?pr.t:null,P=TT?TT.ttc:0,ech=echeancier(ct),R=ct.retenue?num(ct.retenue):0;
  const ville=ct.juridiction||'Douala',ff=s=>FN(s);
  const {doc,y:y0,col}=pdfBase('CONTRAT DE CONSTRUCTION CLÉ EN MAIN','N° '+ct.numero);let y=y0;
  const W=182,par=(t,o={})=>{doc.setFont('helvetica',o.b?'bold':o.i?'italic':'normal');doc.setFontSize(o.s||9.5);const L=doc.splitTextToSize(T_(t),o.w||W);L.forEach(l=>{y=ensure(doc,y,6);doc.text(l,o.x||14,y);y+=o.lh||4.6});y+=o.after??2.5};
  const T_=s=>T(s);
  const art=(n,t)=>{y=ensure(doc,y,14);y+=2;doc.setFillColor(245,240,232);doc.rect(14,y-4.2,W,6.4,'F');doc.setTextColor(...col);par(`ARTICLE ${n} - ${t.toUpperCase()}`,{b:true,s:9.5,after:2});doc.setTextColor(30,35,43)};
  par('ENTRE LES SOUSSIGNÉS :',{b:true,after:2});
  par(`${E.nom||'[Raison sociale]'}${E.forme?', '+E.forme:''}${E.capital?' au capital de '+E.capital+' FCFA':''}, ${E.rccm?'immatriculée au RCCM sous le n° '+E.rccm+', ':''}${E.niu?'NIU '+E.niu+', ':''}dont le siège est situé à ${[E.adresse,E.ville].filter(Boolean).join(', ')||'[adresse]'}${E.tel?', tél. '+E.tel:''}, représentée par ${E.signataire||'[nom du gérant]'}, en sa qualité de ${E.qualite||'Gérant'}, dûment habilité(e) à cet effet,`);
  par('ci-après dénommée « l\'Entreprise », d\'une part,',{i:true});
  par('ET',{b:true});
  const qual={particulier:'agissant en son nom personnel en qualité de propriétaire du terrain',societe:'agissant pour le compte de la société qu\'il représente'+(ct.moRep?' ('+ct.moRep+')':''),mandataire:'agissant en qualité de mandataire du propriétaire'+(ct.moRep?' ('+ct.moRep+')':'')}[ct.moQualite||'particulier'];
  par(`${ct.moNom||'[Nom du maître d\'ouvrage]'}${ct.moCni?', titulaire de la CNI / du passeport n° '+ct.moCni+(ct.moCniDate?' délivré(e) le '+dfr(ct.moCniDate):'')+(ct.moCniLieu?' à '+ct.moCniLieu:''):''}, demeurant à ${ct.moAdresse||'[adresse]'}${ct.moTel?', tél. '+ct.moTel:''}${ct.moEmail?', e-mail '+ct.moEmail:''}, ${qual},`);
  par('ci-après dénommé « le Maître d\'ouvrage », d\'autre part,',{i:true});
  par('Ensemble dénommés « les Parties ».',{i:true,after:4});
  par('IL A ÉTÉ CONVENU ET ARRÊTÉ CE QUI SUIT :',{b:true,after:3});
  let n=1;
  art(n++,'Objet du contrat');
  par(`Le Maître d'ouvrage confie à l'Entreprise, qui l'accepte, la réalisation clés en main de l'ouvrage suivant : ${ct.ouvrage||descOuvrage(cid)||'[description de l\'ouvrage]'}, sur le terrain situé à ${ct.terrainLieu||ch.lieu||'[lieu]'}${ct.tf?', objet du titre foncier n° '+ct.tf:''}${num(ct.terrainSup)?', d\'une superficie de '+N(num(ct.terrainSup))+' m²':''}.`);
  par('La prestation comprend la fourniture des matériaux et de la main-d\'œuvre, l\'exécution de l\'ensemble des travaux décrits au devis de référence, depuis l\'installation du chantier jusqu\'au nettoyage final et à la remise des clés, conformément aux plans approuvés et aux règles de l\'art.');
  art(n++,'Documents contractuels');
  par(`Le présent contrat est constitué des pièces suivantes, qui prévalent dans l'ordre ci-après en cas de contradiction : 1) le présent contrat et ses éventuels avenants ; 2) le devis quantitatif et estimatif ${pr?'n° '+pr.d.numero+' du '+dfr(pr.d.date):'de référence'} ; 3) les plans d'architecture et de structure approuvés ; 4) le permis de construire ; 5) le planning des travaux.`);
  art(n++,'Autorisations administratives');
  par(ct.permisPar==='obtenu'?`Le permis de construire${ct.permisNum?' n° '+ct.permisNum:''} a été obtenu par le Maître d'ouvrage conformément à la loi n° 2004/003 du 21 avril 2004 régissant l'urbanisme au Cameroun. Il sera affiché de manière visible sur le chantier pendant toute la durée des travaux.`:
    ct.permisPar==='ent'?`L'Entreprise se charge de constituer et de déposer le dossier de permis de construire, dont les frais sont inclus au devis, conformément à la loi n° 2004/003 du 21 avril 2004 régissant l'urbanisme au Cameroun. Le Maître d'ouvrage fournit les pièces relatives à la propriété du terrain. Les travaux de construction ne débutent qu'après obtention du permis.`:
    `Le Maître d'ouvrage s'engage à obtenir le permis de construire conformément à la loi n° 2004/003 du 21 avril 2004 régissant l'urbanisme au Cameroun, avant le démarrage des travaux de construction. Le permis sera affiché de manière visible sur le chantier pendant toute la durée des travaux.`);
  art(n++,'Prix du marché');
  if(TT)par(`Le présent marché est conclu pour un prix global et forfaitaire de ${ff(P)} FCFA ${pr.d.tva?'TTC (TVA de '+N(num(pr.d.tauxTVA)||19.25)+' % incluse)':'(montant net)'}, soit en toutes lettres : ${lettres(P)} francs CFA, réparti comme suit : fournitures ${ff(TT.mat)} FCFA, main-d'œuvre et prestations ${ff(TT.mo)} FCFA${TT.imp?', imprévus '+ff(TT.imp)+' FCFA':''}${TT.rem?', remise -'+ff(TT.rem)+' FCFA':''}.`);
  else par('Le prix du marché est celui du devis de référence annexé au présent contrat.');
  par(ct.prixFerme?'Ce prix est ferme et non révisable pendant la durée contractuelle, sauf modification des travaux à la demande du Maître d\'ouvrage dans les conditions de l\'article relatif aux travaux supplémentaires.':'Ce prix pourra être révisé, d\'un commun accord écrit, en cas de variation officielle des prix homologués des matériaux (ciment, fer à béton) survenant pendant l\'exécution.');
  art(n++,'Modalités de paiement');
  par('Le prix est payé selon l\'échéancier ci-dessous, chaque tranche étant exigible à l\'achèvement de l\'étape correspondante, constaté contradictoirement par les Parties. Chaque paiement donne lieu à la remise d\'un reçu par l\'Entreprise.');
  if(TT){y=ensure(doc,y,30);doc.autoTable({...tstyle(col),startY:y,head:[['N°','Étape de paiement','%','Montant (FCFA)']],body:[...ech.map((x,i)=>[i+1,T_(x.l),N(num(x.p))+' %',ff(x.m)]),[{content:'TOTAL',colSpan:2,styles:{fontStyle:'bold',halign:'right'}},N(sum(ech,x=>num(x.p)))+' %',{content:ff(sum(ech,x=>x.m)),styles:{fontStyle:'bold'}}]],columnStyles:{0:{cellWidth:10},2:{cellWidth:18,halign:'right'},3:{cellWidth:34,halign:'right'}}});y=doc.lastAutoTable.finalY+5}
  if(R)par(`Une retenue de garantie de ${N(R)} % du prix, soit ${ff(P*R/100)} FCFA, est conservée par le Maître d'ouvrage sur le dernier paiement. Elle est libérée ${ct.retenueLib==='un_an'?'un an après la réception des travaux':'à la levée de l\'ensemble des réserves formulées à la réception'}.`);
  par(`Les paiements sont effectués en francs CFA${E.banque?', par versement sur : '+E.banque:''}, ou en espèces contre reçu. En cas de retard de paiement de plus de ${num(ct.miseDemeure)||15} jours après une mise en demeure restée sans effet, l'Entreprise peut suspendre les travaux ; le délai d'exécution est alors prolongé d'autant.`);
  art(n++,'Délai d\'exécution');
  par(`Les travaux seront exécutés dans un délai de ${num(ct.delai)||'[ ]'} mois${ct.debut?' à compter du '+dfr(ct.debut):' à compter de la date de démarrage notifiée par écrit, après paiement de l\'acompte et obtention des autorisations'}.`);
  par('Ce délai est prolongé de plein droit en cas de force majeure, d\'intempéries exceptionnelles empêchant le travail, de retard de paiement du Maître d\'ouvrage, de travaux supplémentaires ou de modifications demandés par celui-ci, ou de retard dans la fourniture des autorisations à sa charge.');
  if(num(ct.penalite))par(`Sauf cause de prolongation ci-dessus, tout retard imputable à l'Entreprise donne lieu à une pénalité de ${N(num(ct.penalite))} pour mille du prix du marché par jour calendaire de retard, plafonnée à ${N(num(ct.plafond)||5)} % du prix du marché.`);
  art(n++,'Obligations de l\'Entreprise');
  par('L\'Entreprise s\'engage à : exécuter les travaux conformément aux plans, au devis et aux règles de l\'art ; employer des matériaux conformes aux normes en vigueur au Cameroun et un personnel qualifié ; assurer la sécurité et le gardiennage du chantier jusqu\'à la réception ; tenir le Maître d\'ouvrage informé de l\'avancement des travaux ; nettoyer le chantier et évacuer les déblais en fin de travaux.'+(ct.assurance?' Elle justifie d\'une assurance couvrant sa responsabilité civile pour les dommages causés aux tiers pendant les travaux.':''));
  art(n++,'Obligations du Maître d\'ouvrage');
  par('Le Maître d\'ouvrage s\'engage à : garantir qu\'il est propriétaire du terrain ou dûment autorisé à y construire ; mettre le terrain libre de toute occupation à la disposition de l\'Entreprise ; obtenir les autorisations administratives à sa charge ; payer le prix aux échéances convenues ; prendre en charge les frais de branchement définitif aux réseaux (ENEO, CAMWATER) sauf mention contraire du devis ; prendre ses décisions de choix (matériaux, couleurs, modèles) dans des délais compatibles avec le planning.');
  art(n++,'Travaux supplémentaires et modifications');
  par('Toute modification, tout travail supplémentaire ou toute variante demandés par le Maître d\'ouvrage fait l\'objet d\'un avenant écrit, chiffré et signé par les deux Parties avant exécution, précisant son incidence sur le prix et sur le délai. Aucun travail supplémentaire non constaté par écrit ne peut être réclamé.');
  art(n++,'Réception des travaux et remise des clés');
  par('À l\'achèvement des travaux, l\'Entreprise invite par écrit le Maître d\'ouvrage à procéder à la réception. La réception est prononcée contradictoirement et constatée par un procès-verbal, avec ou sans réserves. L\'Entreprise lève les réserves dans un délai de trente (30) jours. Les clés sont remises au Maître d\'ouvrage après la réception et le paiement des sommes exigibles. La prise de possession de l\'ouvrage par le Maître d\'ouvrage vaut réception sans réserve.');
  art(n++,'Garanties');
  par('Conformément aux articles 1792 et 2270 du Code civil applicable au Cameroun, l\'Entreprise est responsable pendant dix (10) ans à compter de la réception des dommages qui compromettent la solidité de l\'ouvrage, résultant d\'un vice de construction ou du sol. En outre, l\'Entreprise garantit pendant un (1) an à compter de la réception la réparation des malfaçons et le bon fonctionnement des équipements (plomberie, électricité, menuiseries), hors usure normale et mauvais usage.');
  art(n++,'Résiliation');
  par(`En cas de manquement grave de l'une des Parties à ses obligations, l'autre Partie peut résilier le contrat ${num(ct.miseDemeure)||15} jours après une mise en demeure par écrit restée sans effet. Il est alors établi contradictoirement un décompte des travaux exécutés et des matériaux approvisionnés sur le chantier, qui sont payés à l'Entreprise, sans préjudice des dommages et intérêts éventuels.`);
  art(n++,'Force majeure');
  par('Aucune des Parties n\'est responsable de l\'inexécution de ses obligations causée par un événement de force majeure, c\'est-à-dire imprévisible, irrésistible et extérieur à sa volonté. La Partie concernée en informe l\'autre par écrit sans délai. Si l\'empêchement dure plus de trois (3) mois, chaque Partie peut résilier le contrat sans indemnité, après décompte des travaux exécutés.');
  art(n++,'Règlement des litiges');
  par(`Les Parties s'efforcent de régler à l'amiable tout différend relatif à l'interprétation ou à l'exécution du présent contrat, dans un délai de trente (30) jours à compter de sa notification écrite. À défaut d'accord, ${ct.litige==='ohada'?'le différend est tranché définitivement par voie d\'arbitrage conformément au Règlement d\'arbitrage de la Cour Commune de Justice et d\'Arbitrage (CCJA) de l\'OHADA.':'le différend est porté devant les juridictions compétentes de '+ville+'.'} Le présent contrat est régi par le droit camerounais.`);
  if(ct.clauses){art(n++,'Clauses particulières');par(ct.clauses)}
  art(n++,'Dispositions finales');
  par(`Les Parties élisent domicile à leurs adresses respectives indiquées en tête du présent contrat. Le présent contrat prend effet à la date de sa signature. Il peut être soumis à la formalité de l'enregistrement à la diligence de la Partie la plus diligente, conformément au Code général des impôts. Il est établi en deux (2) exemplaires originaux, un pour chaque Partie.`);
  y+=2;par(`Fait à ${ct.lieu||ville}, le ${ct.dateSignature?dfr(ct.dateSignature):ct.date?dfr(ct.date):'..................'}`,{b:true,after:4});
  par('Signatures précédées de la mention manuscrite « Lu et approuvé ».',{i:true,s:8.5,after:3});
  signatures(doc,y,'Le Maître d\'ouvrage',`Pour l'Entreprise, ${E.signataire||'le Gérant'}`);
  const np=doc.getNumberOfPages();for(let i=1;i<=np;i++){doc.setPage(i);doc.setFontSize(7.5);doc.setTextColor(110,115,125);const x0=62;doc.text('Paraphes -  Entreprise :',x0,281);let xx=x0+doc.getTextWidth('Paraphes -  Entreprise :')+2;
    if(SIGN&&S.sig){try{const p=doc.getImageProperties(S.sig),hh=6,ww=Math.min(20,hh*p.width/p.height);doc.addImage(S.sig,'PNG',xx,276,ww,hh)}catch(e){}}
    doc.setDrawColor(190,184,174);doc.line(xx,281.5,xx+22,281.5);xx+=30;doc.text(T_("Maître d'ouvrage :"),xx,281);xx+=doc.getTextWidth(T_("Maître d'ouvrage :"))+2;doc.line(xx,281.5,xx+22,281.5);doc.setTextColor(30,35,43)}
  await savePdf(doc,`Contrat ${ct.numero} - ${T(ch.nom||'')}.pdf`);
}

/* mémorise la dernière génération pour pouvoir la refaire signée */
['pdfDevis','pdfBon','pdfRecu','pdfAppelFonds'].forEach(n=>{const f=window[n];if(typeof f!=='function')return;window[n]=function(...a){if(!SIGN)lastGen=()=>f(...a);return f(...a)}});
