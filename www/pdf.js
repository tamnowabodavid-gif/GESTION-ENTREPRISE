/* ---------- génération PDF (jsPDF + autoTable) ---------- */
const T=s=>String(s??'').replace(/œ/g,'oe').replace(/Œ/g,'OE').replace(/[’‘]/g,"'").replace(/[“”«»]/g,'"').replace(/[–—]/g,'-').replace(/…/g,'...').replace(/≈/g,'~').replace(/[  ]/g,' ').replace(/→/g,'->').replace(/ ?µ/g,' microns').replace(/²/g,'2').replace(/³/g,'3').replace(/[^\x00-\xFF]/g,'');
const hexRgb=h=>{const m=/^#?([0-9a-f]{6})$/i.exec(h||'');const n=parseInt(m?m[1]:'e2711d',16);return[n>>16&255,n>>8&255,n&255]};
let NOENT=false,NOCACHET=false;
function pdfBase(titre,numero,sousTitre){
  const {jsPDF}=window.jspdf;const doc=new jsPDF({unit:'mm',format:'a4'});const E=NOENT?{couleur:ent().couleur,nom:' '}:ent(),col=hexRgb(E.couleur);
  let lw=0;
  if(E.logo){try{const pr=doc.getImageProperties(E.logo);const h=22,w=Math.min(50,pr.width/pr.height*h);doc.addImage(E.logo,pr.fileType||'PNG',14,10,w,h);lw=w}catch(e){}}
  doc.setTextColor(30,35,43);doc.setFont('helvetica','bold');doc.setFontSize(15);doc.text(T(E.nom||'Mon entreprise'),196,15,{align:'right'});
  doc.setFont('helvetica','normal');doc.setFontSize(8.3);doc.setTextColor(90,96,106);
  const lines=[E.activite,[E.adresse,E.ville].filter(Boolean).join(', '),[E.tel&&'Tél. '+E.tel,E.email].filter(Boolean).join(' · '),[E.niu&&'NIU : '+E.niu,E.rccm&&'RCCM : '+E.rccm].filter(Boolean).join(' · ')].filter(Boolean);
  lines.forEach((l,i)=>doc.text(T(l),196,20+i*3.8,{align:'right'}));
  const y=Math.max(36,20+lines.length*3.8+3);
  doc.setFillColor(...col);doc.rect(14,y,182,11,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(13);doc.text(T(titre),18,y+7.4);
  doc.setFontSize(10);doc.text(T(numero||''),192,y+7.4,{align:'right'});
  doc.setTextColor(30,35,43);let yy=y+16;
  if(sousTitre){doc.setFont('helvetica','normal');doc.setFontSize(9);doc.text(T(sousTitre),14,yy);yy+=6}
  return {doc,y:yy,col};
}
function pdfFooter(doc){const E=NOENT?{}:ent(),n=doc.getNumberOfPages();
  for(let i=1;i<=n;i++){doc.setPage(i);doc.setDrawColor(220,214,204);doc.line(14,284,196,284);doc.setFontSize(7.5);doc.setTextColor(110,115,125);doc.setFont('helvetica','normal');
    doc.text(T([E.nom,E.banque&&('Paiements : '+E.banque)].filter(Boolean).join(' · ')).slice(0,140),14,288);doc.text(`Page ${i} / ${n}`,196,288,{align:'right'})}}
function box(doc,x,y,w,title,lines,col){doc.setDrawColor(220,214,204);doc.setFillColor(250,247,242);const h=7+lines.length*4.4;doc.roundedRect(x,y,w,h,1.5,1.5,'FD');
  doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(...col);doc.text(T(title.toUpperCase()),x+3,y+4.8);doc.setTextColor(30,35,43);doc.setFont('helvetica','normal');doc.setFontSize(9);
  lines.forEach((l,i)=>{if(i===0)doc.setFont('helvetica','bold');else doc.setFont('helvetica','normal');doc.text(T(l),x+3,y+9.6+i*4.4)});return y+h}
const ensure=(doc,y,need)=>{if(y+need>278){doc.addPage();return 18}return y};
const tstyle=col=>({theme:'grid',styles:{font:'helvetica',fontSize:8,cellPadding:1.5,lineColor:[225,219,209],lineWidth:0.1,textColor:[30,35,43]},headStyles:{fillColor:col,textColor:255,fontStyle:'bold'},margin:{left:14,right:14,bottom:18}});
async function savePdf(doc,filename){if(SIGN)filename=filename.replace(/\.pdf$/,' - signé.pdf');const gen=lastGen,signed=SIGN;pdfFooter(doc);window.__lastPdf=doc;const blob=doc.output('blob');
  $('#modalRoot').innerHTML=`<div class="modal-bg"><div class="modal"><h2>📄 Document prêt</h2><div class="sm mute" style="margin-bottom:14px">${esc(filename)}</div>
    ${signed?'<div class="pst ok" style="margin-bottom:10px">✍️ Signé et cacheté</div>':''}<button class="btn block" id="pdfSave">⬇️ Enregistrer / partager le PDF</button>
    ${gen&&!signed?'<button class="btn sec block" id="pdfSign" style="margin-top:8px">✍️ Signer et cacheter</button>':''}<div class="note">Une fois enregistré, ouvre le fichier depuis <b>Fichiers</b> (iPhone) ou <b>Téléchargements</b> (Android) pour l'imprimer ou l'envoyer par WhatsApp.</div><div class="note" id="pdfMsg"></div>
    <button class="btn sec block" style="margin-top:12px" onclick="closeForm()">Fermer</button></div></div>`;
  const msg=t=>{const m=$('#pdfMsg');if(m)m.innerHTML=t};
  const sb=$('#pdfSign');if(sb)sb.onclick=()=>signerEtCacheter(gen);
  if(!downloads){$('#pdfSave').style.display='none';msg("L'enregistrement n'est pas disponible dans cette vue. Ouvre Chantier Pro dans l'application Claude ou dans ton navigateur.")}
  else $('#pdfSave').onclick=async()=>{msg('Enregistrement…');try{const r=await downloads.save({filename,data:blob});msg(r&&r.status==='saved'?"✅ Enregistré. Sur iPhone, choisis « Enregistrer dans Fichiers » dans le menu de partage ; sur Android, le fichier est dans Téléchargements.":'✅ Envoyé.')}
    catch(e){const c=e&&e.code;msg(c==='declined'?'Enregistrement annulé.':c==='rate_limited'?'Une autre demande est en cours : réessaie dans quelques secondes.':"L'enregistrement a échoué ("+(c||'erreur')+'). Réessaie dans quelques secondes.')}};

}
let SIGN=false,lastGen=null;
function sigImgs(doc,x,y,w,h){const add=(src,X,Y,mw,mh)=>{if(!src)return;try{const p=doc.getImageProperties(src);let ww=mw,hh=mw*p.height/p.width;if(hh>mh){hh=mh;ww=mh*p.width/p.height}doc.addImage(src,'PNG',X+(mw-ww)/2,Y+(mh-hh)/2,ww,hh)}catch(e){}};
  if(!NOCACHET)add(S.cachet,x+w-h-2,y-2,h+4,h+4);add(S.sig,x+3,y+1,w*0.6,h-2)}
async function signerEtCacheter(fn){if(!S.sig&&!S.cachet){toast('Enregistre ta signature et ton cachet une seule fois : ils seront réutilisés automatiquement.');formSig(()=>signerEtCacheter(fn));return}
  SIGN=true;try{await fn()}finally{SIGN=false}}
function signatures(doc,y,gauche,droite){y=ensure(doc,y,32);doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text(T(gauche),20,y);doc.text(T(droite),130,y);
  doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(110,115,125);doc.text('Date, signature',20,y+4);doc.text('Date, signature et cachet',130,y+4);doc.setTextColor(30,35,43);
  doc.setDrawColor(200,194,184);doc.rect(18,y+6,72,22);doc.rect(128,y+6,68,22);
  if(SIGN){sigImgs(doc,128,y+6,68,22);doc.setFontSize(7.5);doc.setTextColor(110,115,125);doc.text('Le '+dfr(today()),131,y+27);doc.setTextColor(30,35,43)}return y+32}
const clientLines=ch=>[ch.client||'Client',ch.clientAdresse,ch.clientTel&&'Tél. '+ch.clientTel].filter(Boolean);

/* ----- Devis ----- */
async function pdfDevis(id){
  const d=S.devis.find(x=>x.id===id),ch=S.chantiers.find(c=>c.id===d.chantierId)||{},t=totDevis(d),E=ent();
  const {doc,y:y0,col}=pdfBase('DEVIS','N° '+d.numero);
  let y=y0;const yb=Math.max(box(doc,14,y,88,'Client',clientLines(ch),col),box(doc,108,y,88,'Chantier',[ch.nom||'',ch.lieu||'',`Date : ${dfr(d.date)} · Validité : ${num(d.validite)||30} jours`],col));
  y=yb+5;doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text(T('Objet : '+(d.objet||'')),14,y);y+=4;
  const body=[];
  d.lots.forEach((l,i)=>{const lt=t.lots[i];body.push([{content:`LOT ${i+1} - ${T(l.nom).toUpperCase()}`,colSpan:6,styles:{fillColor:[238,232,222],fontStyle:'bold'}}]);
    const sec=(lab,arr,tot)=>{if(!arr.length)return;body.push([{content:lab,colSpan:6,styles:{fontStyle:'bolditalic',textColor:col}}]);
      arr.forEach((x,k)=>body.push(x.pct!=null?[`${i+1}.${k+1}`,T(x.designation),'%',N(num(x.pct)),FN(x.glob?t.matBase:lt.m),FN(num(x.pct)/100*(x.glob?t.matBase:lt.m))]:[`${i+1}.${k+1}`,T(x.designation),T(x.unite),N(num(x.qte)),FN(num(x.pu)),FN(num(x.qte)*num(x.pu))]));
      body.push([{content:'Sous-total '+lab.toLowerCase(),colSpan:5,styles:{halign:'right',fontStyle:'italic'}},{content:FN(tot),styles:{fontStyle:'italic',halign:'right'}}])};
    sec('Fournitures',l.lignes.filter(x=>x.type!=='mo'&&!x.off),lt.m);sec("Main-d'oeuvre et prestations",l.lignes.filter(x=>x.type==='mo'&&!x.off),lt.w);
    body.push([{content:`TOTAL LOT ${i+1}`,colSpan:5,styles:{halign:'right',fontStyle:'bold'}},{content:FN(lt.t),styles:{fontStyle:'bold',halign:'right'}}])});
  doc.autoTable({...tstyle(col),startY:y,head:[['N°','Désignation','Unité','Qté','P.U. (FCFA)','Montant (FCFA)']],body,
    columnStyles:{0:{cellWidth:11},2:{cellWidth:14,halign:'center'},3:{cellWidth:15,halign:'right'},4:{cellWidth:23,halign:'right'},5:{cellWidth:27,halign:'right'}}});
  y=doc.lastAutoTable.finalY+8;y=ensure(doc,y,60);
  doc.setFont('helvetica','bold');doc.setFontSize(11);doc.text('RÉCAPITULATIF',14,y);y+=2;
  doc.autoTable({...tstyle(col),startY:y,head:[['Lot','Fournitures','Main-d\'oeuvre','Total']],body:d.lots.map((l,i)=>[`${i+1}. ${T(l.nom)}`,FN(t.lots[i].m),FN(t.lots[i].w),FN(t.lots[i].t)]),
    columnStyles:{1:{halign:'right',cellWidth:28},2:{halign:'right',cellWidth:28},3:{halign:'right',cellWidth:30}}});
  y=doc.lastAutoTable.finalY+4;
  const rows=[['Total fournitures',t.mat],["Total main-d'oeuvre et prestations",t.mo],['Sous-total',t.st]];
  if(t.imp)rows.push([`Imprévus (${N(num(d.imprevus))} %)`,t.imp]);if(t.rem)rows.push([`Remise (${N(num(d.remise))} %)`,-t.rem]);
  rows.push(['Total HT',t.ht]);if(d.tva)rows.push([`TVA ${N(num(d.tauxTVA)||19.25)} %`,t.tva]);rows.push([d.tva?'TOTAL TTC':'TOTAL NET A PAYER',t.ttc]);if(num(d.acompte))rows.push([`Acompte à la signature (${N(num(d.acompte))} %)`,t.acompte]);
  doc.autoTable({...tstyle(col),startY:y,margin:{left:96,right:14,bottom:18},body:rows.map(([l,v])=>[T(l),FN(v)+' FCFA']),
    columnStyles:{0:{fontStyle:'bold'},1:{halign:'right',cellWidth:36}},didParseCell:c=>{if(String(c.row.raw[0]).startsWith('TOTAL')){c.cell.styles.fillColor=col;c.cell.styles.textColor=255;c.cell.styles.fontSize=9.5}}});
  y=doc.lastAutoTable.finalY+6;y=ensure(doc,y,14);
  doc.setFont('helvetica','normal');doc.setFontSize(9);const ar=doc.splitTextToSize(T(`Arrêté le présent devis à la somme de : ${lettres(t.ttc)} (${FN(t.ttc)}) francs CFA ${d.tva?'TTC':''}.`),182);doc.text(ar,14,y);y+=ar.length*4.4+4;
  if(d.conditions){y=ensure(doc,y,20);doc.setFont('helvetica','bold');doc.text('Conditions',14,y);y+=4.5;doc.setFont('helvetica','normal');doc.setFontSize(8);
    const cl=doc.splitTextToSize(T(d.conditions),182);cl.forEach(l=>{y=ensure(doc,y,5);doc.text(l,14,y);y+=3.8});y+=4}
  signatures(doc,y,'Le client - « Bon pour accord »',E.signataire||"Pour l'entreprise");
  await savePdf(doc,`Devis ${d.numero} - ${T(ch.nom||'')}.pdf`);
}

/* ----- Bon de commande ----- */
async function pdfBon(id){
  const b=S.bons.find(x=>x.id===id),ch=S.chantiers.find(c=>c.id===b.chantierId)||{},E=ent(),et=S.etapes.find(e=>e.id===b.etapeId),t=totL(b.lignes);
  const {doc,y:y0,col}=pdfBase('BON DE COMMANDE','N° '+b.numero);let y=y0;
  const yb=Math.max(box(doc,14,y,88,'Fournisseur',[b.fournisseur||'À préciser',b.fournAdresse,b.fournTel&&'Tél. '+b.fournTel].filter(Boolean),col),
    box(doc,108,y,88,'Livraison',[b.livraisonLieu||ch.lieu||'',`Chantier : ${ch.nom||''}`,b.livraisonDate?'Souhaitée le '+dfr(b.livraisonDate):'Date à convenir',b.contact&&'Contact : '+b.contact].filter(Boolean),col));
  y=yb+5;doc.setFontSize(9);doc.setFont('helvetica','normal');doc.text(T(`Date de commande : ${dfr(b.date)}${et?'  ·  Étape : '+et.nom:''}  ·  Paiement : ${b.echeance?'le '+dfr(b.echeance):'à la livraison'}`),14,y);y+=3;
  doc.autoTable({...tstyle(col),startY:y,head:[['N°','Désignation','Unité','Qté','P.U. (FCFA)','Montant (FCFA)']],
    body:[...(b.lignes||[]).map((x,i)=>[i+1,T(x.designation),T(x.unite),N(num(x.qte)),FN(num(x.pu)),FN(num(x.qte)*num(x.pu))]),[{content:'TOTAL DE LA COMMANDE',colSpan:5,styles:{halign:'right',fontStyle:'bold'}},{content:FN(t),styles:{fontStyle:'bold',halign:'right'}}]],
    columnStyles:{0:{cellWidth:9},2:{cellWidth:14,halign:'center'},3:{cellWidth:15,halign:'right'},4:{cellWidth:23,halign:'right'},5:{cellWidth:27,halign:'right'}}});
  y=doc.lastAutoTable.finalY+6;doc.setFontSize(9);const ar=doc.splitTextToSize(T(`Arrêté le présent bon de commande à la somme de : ${lettres(t)} (${FN(t)}) francs CFA.`),182);doc.text(ar,14,y);y+=ar.length*4.4+4;
  if(b.notes){doc.setFontSize(8.5);const nl=doc.splitTextToSize(T(b.notes),182);doc.text(nl,14,y);y+=nl.length*4+4}
  signatures(doc,y,'Le fournisseur - Reçu le',E.signataire||"Pour l'entreprise (bon pour commande)");
  await savePdf(doc,`Bon de commande ${b.numero} - ${T(b.fournisseur||'')}.pdf`);
}

/* ----- Reçu ----- */
async function pdfRecu(id){
  const r=S.recus.find(x=>x.id===id),ch=S.chantiers.find(c=>c.id===r.chantierId)||{},E=ent();
  const {doc,y:y0,col}=pdfBase('REÇU DE PAIEMENT','N° '+r.numero);let y=y0+2;
  doc.setFontSize(10.5);doc.setFont('helvetica','normal');
  {const E2=ent(),phr=doc.splitTextToSize(T(`Je soussigné(e)${E2.signataire?', '+E2.signataire:''}, pour le compte de ${E2.nom||"l'entreprise"}, reconnais avoir reçu de ${r.payeur||ch.client||''} la somme de ${lettres(num(r.montant))} (${FN(num(r.montant))}) francs CFA, aux conditions ci-dessous.`),182);doc.setFont('helvetica','normal');doc.setFontSize(10);doc.text(phr,14,y);y+=phr.length*5+5}
  const line=(lab,val,bold)=>{doc.setFont('helvetica','normal');doc.setTextColor(90,96,106);doc.text(T(lab),14,y);doc.setTextColor(30,35,43);doc.setFont('helvetica',bold?'bold':'normal');const v=doc.splitTextToSize(T(val),130);doc.text(v,62,y);y+=Math.max(7,v.length*5+2)};
  line('Reçu de :',r.payeur||ch.client||'',true);line('La somme de :',FN(num(r.montant))+' FCFA',true);line('En lettres :',lettres(num(r.montant))+' francs CFA');
  const mo=(MOTIFS.find(x=>x[0]===r.motif)||[,''])[1];if(mo||r.periode)line('Motif :',[mo,r.periode].filter(Boolean).join(' - '),true);line('Mode de paiement :',r.mode+(r.reference?' - Réf. '+r.reference:''));if(r.objet)line('Détail :',r.objet);const et=S.etapes.find(e=>e.id===r.etapeId);if(et||r.categorie&&r.categorie!=='global')line('Imputation :',[{mo:"Main-d'oeuvre",mat:'Matériaux',global:'Paiement global'}[r.categorie||'global'],et&&et.nom].filter(Boolean).join(' - '));line('Chantier :',[ch.nom,ch.lieu].filter(Boolean).join(' - '));
  const dv=r.devisId&&S.devis.find(x=>x.id===r.devisId)||(marche(r.chantierId)||{}).d;
  if(dv){const tt=totDevis(dv).ttc,cum=sum(byC('recus',r.chantierId).filter(x=>(x.date+x.numero)<=(r.date+r.numero)),x=>num(x.montant));
    y+=2;doc.autoTable({...tstyle(col),startY:y,margin:{left:14,right:14},head:[['Montant du marché (devis '+T(dv.numero)+')','Total versé à ce jour','Reste à payer']],body:[[FN(tt)+' FCFA',FN(cum)+' FCFA',FN(tt-cum)+' FCFA']],styles:{...tstyle(col).styles,fontSize:9.5,halign:'center'}});y=doc.lastAutoTable.finalY+8}
  doc.setFont('helvetica','normal');doc.setFontSize(10);doc.text(T(`Fait à ${(E.ville||ch.lieu||'Douala').split(/[–,-]/)[0].trim()}, le ${dfr(r.date)}`),14,y);y+=8;
  signatures(doc,y,"Le remettant (maître d'ouvrage)",'Le bénéficiaire'+(E.nom?' - '+E.nom:''));
  await savePdf(doc,`Reçu ${r.numero} - ${T(r.payeur||'')}.pdf`);
}

/* ----- Rapport hebdomadaire ----- */
async function imgData(id){try{const res=await fetch('/_blob/'+id);if(!res.ok)return null;const b=await res.blob();if(!b.type.startsWith('image/'))return null;
  return await new Promise(ok=>{const fr=new FileReader();fr.onload=()=>ok(fr.result);fr.onerror=()=>ok(null);fr.readAsDataURL(b)})}catch(e){return null}}
async function pdfRapport(cids,ws){
  toast('Préparation du rapport…');
  const we=addDays(ws,6),data=rapportData(cids,ws),E=ent();
  const {doc,y:y0,col}=pdfBase('RAPPORT HEBDOMADAIRE',`Semaine du ${dfr(ws)} au ${dfr(we)}`,`Établi le ${dfr(today())}${data.length>1?' - '+data.length+' chantiers':''}`);let y=y0;
  const annex=[];
  if(data.length>1){const tR=sum(data,r=>r.tR),tD=sum(data,r=>r.tD);
    doc.autoTable({...tstyle(col),startY:y,head:[['Chantier','Encaissé','Achats','Paie','Solde semaine']],body:[...data.map(r=>[T(r.ch.nom),FN(r.tR),FN(r.tA),FN(r.tP),FN(r.tR-r.tD)]),[{content:'TOTAL',styles:{fontStyle:'bold'}},FN(tR),FN(sum(data,r=>r.tA)),FN(sum(data,r=>r.tP)),{content:FN(tR-tD),styles:{fontStyle:'bold'}}]],
      columnStyles:{1:{halign:'right'},2:{halign:'right'},3:{halign:'right'},4:{halign:'right'}}});y=doc.lastAutoTable.finalY+8}
  for(const r of data){
    y=ensure(doc,y,40);doc.setFillColor(238,232,222);doc.rect(14,y,182,8,'F');doc.setFont('helvetica','bold');doc.setFontSize(11);doc.setTextColor(30,35,43);doc.text(T(`${r.ch.nom}${r.ch.lieu?' - '+r.ch.lieu:''}`),17,y+5.6);y+=11;
    const m=marche(r.ch.id);
    doc.autoTable({...tstyle(col),startY:y,margin:{left:14,right:105,bottom:18},head:[['Cette semaine','FCFA']],body:[['Argent reçu du client',FN(r.tR)],['Achats de matériaux',FN(r.tA)],['Paie des employés',FN(r.tP)],['Total des dépenses',FN(r.tD)],[{content:'Solde de la semaine',styles:{fontStyle:'bold'}},{content:FN(r.tR-r.tD),styles:{fontStyle:'bold'}}]],columnStyles:{1:{halign:'right'}}});
    const yL=doc.lastAutoTable.finalY;
    doc.autoTable({...tstyle(col),startY:y,margin:{left:108,right:14,bottom:18},head:[['Depuis le début','FCFA']],body:[['Montant du marché',m?FN(m.t):'-'],['Total encaissé',FN(r.st.enc)],['Total dépensé',FN(r.st.dep)],['Budget prévu',FN(r.st.budget)],['Avancement global',Math.round(r.st.av)+' %']],columnStyles:{1:{halign:'right'}}});
    y=Math.max(yL,doc.lastAutoTable.finalY)+6;
    const titre=t=>{y=ensure(doc,y,14);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(...col);doc.text(T(t),14,y);doc.setTextColor(30,35,43);y+=2};
    const table=(head,body,cs)=>{if(!body.length){doc.setFont('helvetica','italic');doc.setFontSize(8.5);doc.text('Rien cette semaine.',14,y+4);y+=9;return}doc.autoTable({...tstyle(col),startY:y,head:[head],body,columnStyles:cs||{}});y=doc.lastAutoTable.finalY+7};
    titre('Travaux réalisés');
    table(['Date','Étape','Travaux / événements','Effectif','Météo'],[...r.jr.map(j=>{(j.photos||[]).forEach((p,k)=>annex.push({p,cap:`${r.ch.nom} - ${dfr(j.date)} - photo chantier ${k+1}`}));return[dfr(j.date),T(r.etN[j.etapeId]||''),T(j.texte+(j.incidents?'\n'+j.incidents:'')+((j.prod||[]).length?'\nProduction : '+prodTxt(j):'')),num(j.effectif)||'',T(j.meteo||'')]}),...r.hi.map(x=>[dfr(x.date),'',T(x.texte),'',''])],{0:{cellWidth:19},1:{cellWidth:38},3:{cellWidth:15,halign:'center'},4:{cellWidth:20}});
    const etc=r.st.ets.filter(e=>e.statut==='cours');if(etc.length){titre('Étapes en cours');table(['Étape','Avancement'],etc.map(e=>[T(e.nom),Math.round(num(e.avancement))+' %']),{1:{halign:'right',cellWidth:25}})}
    titre('Achats de matériaux');
    table(['Date','Matériau','Qté','P.U.','Montant','Fournisseur','Reçu'],r.ach.map((a,i)=>{(a.justifs||[]).forEach((p,k)=>annex.push({p,cap:`${r.ch.nom} - Achat du ${dfr(a.date)} : ${a.materiau} (${FN(totA(a))} FCFA)`+((a.justifs||[]).length>1?' - '+(k+1):'')}));
      return[dfr(a.date),T(a.materiau),N(num(a.quantite))+' '+T(a.unite||''),FN(num(a.prixUnit)),FN(totA(a)),T(a.fournisseur||''),(a.justifs||[]).length?'Oui':'NON']}),{0:{cellWidth:18},2:{cellWidth:18,halign:'right'},3:{halign:'right',cellWidth:18},4:{halign:'right',cellWidth:22},6:{cellWidth:12,halign:'center'}});
    titre('Matériaux utilisés (sorties de stock)');
    table(['Matériau','Utilisé','Reste en stock','Alerte'],r.sorties.map(x=>[T(x.nom),N(x.q,1)+' '+T(x.unite),N(x.stock,1)+' '+T(x.unite),x.alerte?'A commander':'']),{1:{halign:'right'},2:{halign:'right'}});
    if(r.ctl.length){titre('Matériel manquant ou abîmé');table(['Date','Matériel','Présent / attendu','État'],r.ctl.map(x=>[dfr(x.date),T(x.nom),num(x.present)+' / '+num(x.attendu),T(ETAT_MAT[x.etat]||'')]))}
    titre('Paie des employés');
    table(['Date','Employé','Jours','Mode','Objet','Montant'],r.pay.map(p=>{(p.justifs||[]).forEach(x=>annex.push({p:x,cap:`${r.ch.nom} - Paie ${r.empN[p.employeId]||''} du ${dfr(p.date)}`}));return[dfr(p.date),T(r.empN[p.employeId]||'-'),num(p.jours)?N(num(p.jours),1):'',T(p.mode||''),T(p.objet||''),FN(num(p.montant))]}),{0:{cellWidth:18},2:{cellWidth:12,halign:'center'},5:{halign:'right',cellWidth:24}});
    titre('Argent reçu du client');
    table(['Date','N° reçu','Reçu de','Mode','Montant'],r.rec.map(x=>[dfr(x.date),T(x.numero),T(x.payeur||''),T(x.mode||''),FN(num(x.montant))]),{4:{halign:'right'}});
    if(r.bons.length){titre('Bons de commande');table(['N°','Fournisseur','Statut','Montant','Reste à payer'],r.bons.map(b=>{const ps=bonPay(b);return[T(b.numero),T(b.fournisseur||''),STAT_BON[b.statut||'emis'],FN(totL(b.lignes)),ps.reste>0.5?FN(ps.reste):'Réglé']}),{3:{halign:'right'},4:{halign:'right'}})}
    if(r.aa.length){titre('Reste à acheter (prévisions)');table(['Matériau','Qté','Montant estimé'],r.aa.map(a=>[T(a.materiau),N(num(a.quantite))+' '+T(a.unite||''),FN(totA(a))]),{2:{halign:'right'}})}
    const sans=r.ach.filter(a=>!(a.justifs||[]).length).length;
    if(sans){y=ensure(doc,y,8);doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.setTextColor(192,57,43);doc.text(T(`${sans} achat(s) sans reçu ni facture cette semaine.`),14,y);doc.setTextColor(30,35,43);y+=8}
  }
  if(annex.length){doc.addPage();let ya=18;doc.setFont('helvetica','bold');doc.setFontSize(12);doc.text('ANNEXE - REÇUS, FACTURES ET PHOTOS',14,ya);ya+=8;
    for(const a of annex){
      if(a.p.type==='application/pdf'){ya=ensure(doc,ya,8);doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.text(T('[PDF joint dans l\'application] '+a.cap),14,ya);ya+=6;continue}
      const data=await imgData(a.p.id);if(!data){ya=ensure(doc,ya,8);doc.setFontSize(8.5);doc.text(T('[Image indisponible] '+a.cap),14,ya);ya+=6;continue}
      const pr=doc.getImageProperties(data);let w=120,h=w*pr.height/pr.width;if(h>115){h=115;w=h*pr.width/pr.height}
      if(ya+h+8>280){doc.addPage();ya=18}
      doc.addImage(data,'JPEG',14,ya,w,h);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text(doc.splitTextToSize(T(a.cap),182),14,ya+h+4);ya+=h+11}}
  await savePdf(doc,`Rapport semaine ${ws} - ${data.length>1?'tous chantiers':T(data[0].ch.nom)}.pdf`);
}

