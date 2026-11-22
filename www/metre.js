/* ===== Avant-métré : détail des calculs (ml × section = volume → dosages → quantités) ===== */
let MTRec=null;
function mtp(cur,e){if(MTRec&&cur){(MTRec[cur.nom]=MTRec[cur.nom]||[]).push(e)}}
function metreOf(d){const P=d.params||(d.paramsJson?JSON.parse(d.paramsJson):null);MTRec={};let order=[];
  try{if(P)order=genDevis(P).map(l=>l.nom);else if(d.ouv)order=genOuvrages(d.ouv.list,d.ouv.g||{}).lots.map(l=>l.nom)}catch(e){console.error(e)}
  const r=MTRec;MTRec=null;return order.filter(n=>r[n]&&r[n].length).map(n=>[n,r[n]])}
const sacs=kg=>Math.ceil(kg/50-1e-9);
/* une entrée → [titre, lignes de calcul] */
function mtLines(e){const n=(x,k=2)=>N(x,k),LB=RG().lBarre||12,lb=n(LB,1);
  if(e.k==='b'){const kg=e.V*e.dos,sf=e.sf||0;return [`Béton – ${e.d}`,[`Volume = ${n(e.V,3)} m³`,`Ciment : ${n(e.V,3)} m³ × ${e.dos} kg/m³ = ${n(kg,0)} kg ÷ 50 kg = ${n(kg/50,1)} sacs`,sf?`Sable : ${n(e.V,3)} m³ × ${n(e.sb)} = ${n(e.V*e.sb)} m³ (dont ${n(sf*100,0)} % de sable fin = ${n(e.V*e.sb*sf)} m³)`:`Sable : ${n(e.V,3)} m³ × ${n(e.sb)} = ${n(e.V*e.sb)} m³`,e.tv?`Tout-venant : ${n(e.V,3)} m³ × ${n(e.gb)} = ${n(e.V*e.gb)} m³`:`Gravier : ${n(e.V,3)} m³ × ${n(e.gb)} = ${n(e.V*e.gb)} m³${/^t/i.test((art('gr-gravier-515')||{}).unite||'')?` × ${n(RG().densGrav)} t/m³ = ${n(e.V*e.gb*RG().densGrav)} t`:''}`]]}
  if(e.k==='m'){const kg=e.V*e.dos;return [`Mortier – ${e.d}`,[`Volume = ${n(e.V,3)} m³`,`Ciment : ${n(e.V,3)} m³ × ${e.dos} kg/m³ = ${n(kg,0)} kg ÷ 50 kg = ${n(kg/50,1)} sacs`,`Sable : ${n(e.V,3)} m³ × ${n(e.sm)} = ${n(e.V*e.sm)} m³`]]}
  if(e.k==='p')return [`Parpaings de ${e.ep} – ${e.d}`,e.steps||[]];
  if(e.k==='f'){const L=e.nb*e.ml*e.rc;return [`Acier – ${e.d}`,[`${e.nb} barres HA${e.dia} × ${n(e.ml,1)} ml × ${n(e.rc)} (recouvrements) = ${n(L,1)} m`,`${n(L,1)} m ÷ ${lb} m = ${n(L/LB,1)} barres de 12 m ; poids ${n(L,1)} × ${n(BARW[e.dia],3)} kg/m = ${n(L*BARW[e.dia],0)} kg`]]}
  if(e.k==='c'){const L=e.n*e.len*1.05,ne=e.nEl||1;return [`Cadres – ${e.d}`,[ne>1?`Par élément : ${n(e.ml/ne)} m ÷ ${n(e.e*100,1)} cm + 1 = ${e.n/ne} cadres × ${ne} éléments = ${e.n} cadres HA${e.dia}`:`${n(e.ml,1)} ml ÷ ${n(e.e*100,1)} cm + 1 = ${e.n} cadres HA${e.dia}`,`Longueur d'un cadre : 2 × (${n(e.b)} + ${n(e.h)} − 4 enrobages) + crochets = ${n(e.len)} m`,`${e.n} × ${n(e.len)} m × 1,05 (chutes) = ${n(L,1)} m ÷ ${lb} = ${n(L/LB,1)} barres ; poids ${n(L*BARW[e.dia],0)} kg`]]}
  if(e.k==='t'){const L=e.n*e.len*1.05;return [`Acier – ${e.d}`,[`${n(e.ml,1)} m ÷ ${n(e.e*100,1)} cm + 1 = ${e.n} barres HA${e.dia} de ${n(e.len)} m`,`${e.n} × ${n(e.len)} m × 1,05 = ${n(L,1)} m ÷ ${lb} = ${n(L/LB,1)} barres ; poids ${n(L*BARW[e.dia],0)} kg`]]}
  if(e.k==='r'){const L=e.n*e.len*1.05;return [`Acier – ${e.d}`,[`${e.n} barres HA${e.dia} × ${n(e.len)} m × 1,05 = ${n(L,1)} m ÷ ${lb} = ${n(L/LB,1)} barres ; poids ${n(L*BARW[e.dia],0)} kg`]]}
  if(e.k==='x')return [e.d,e.steps||[]];return [e.d||'',[]]}
/* récapitulatif des matières par lot */
function mtTotals(list){let V=0,cim=0,sab=0,gra=0,nb=0,kg=0;list.forEach(e=>{if(e.k==='b'){V+=e.V;cim+=e.V*e.dos;sab+=e.V*e.sb;gra+=e.V*e.gb}if(e.k==='m'){cim+=e.V*e.dos;sab+=e.V*e.sm}if(e.k==='p')nb+=e.nb;
  if(e.k==='f')kg+=e.nb*e.ml*e.rc*BARW[e.dia];if(e.k==='c'||e.k==='t'||e.k==='r')kg+=e.n*e.len*1.05*BARW[e.dia];if(e.k==='x'&&e.kg)kg+=e.kg});
  return [V?`béton ${N(V,2)} m³`:'',cim?`ciment ${N(cim,0)} kg (${N(cim/50,0)} sacs)`:'',sab?`sable ${N(sab)} m³`:'',gra?`gravier ${N(gra)} m³`:'',nb?`${N(Math.ceil(nb),0)} parpaings`:'',kg?`acier ${N(kg,0)} kg`:''].filter(Boolean).join(' · ')}
function viewMetre(id){const d=S.devis.find(x=>x.id===id);if(!d)return;const M=metreOf(d);
  const html=M.length?`<div class="note" style="margin-bottom:10px">Chaque quantité part des longueurs (ml), surfaces (m²) et volumes (m³), puis des dosages. Calculé à partir des paramètres du devis : les lignes modifiées à la main ne sont pas reprises ici.</div>`+
    M.map(([lot,list],i)=>`<details class="oreg"${i<2?' open':''}><summary>${i+1}. ${esc(lot)}</summary><div class="sm mute" style="margin:4px 0 6px">${esc(mtTotals(list))}</div>${list.map(e=>{const [t,L]=mtLines(e);return `<div class="mtit"><b>${esc(t)}</b><ul>${L.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`}).join('')}</details>`).join('')
    :`<div class="note">L'avant-métré est disponible pour les devis créés avec l'assistant ou le devis par ouvrage.</div>`;
  openForm({title:'📏 Avant-métré '+(d.numero||''),fields:[{type:'html',html}],submit:M.length?'📄 Télécharger en PDF':'Fermer',onSave:async()=>{if(M.length)pdfMetre(id)}})}
async function pdfMetre(id){const d=S.devis.find(x=>x.id===id),ch=S.chantiers.find(c=>c.id===d.chantierId)||{},M=metreOf(d);
  const {doc,y:y0,col}=pdfBase('AVANT-MÉTRÉ','Devis N° '+d.numero);let y=y0;doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text(T((ch.nom||'')+(d.objet?' - '+d.objet:'')),14,y);y+=4;
  const body=[];M.forEach(([lot,list],i)=>{body.push([{content:`${i+1}. ${T(lot).toUpperCase()}`,colSpan:2,styles:{fillColor:[238,232,222],fontStyle:'bold'}}]);
    list.forEach(e=>{const [t,L]=mtLines(e);body.push([T(t),T(L.join('\n'))])});body.push([{content:T('Total du lot : '+mtTotals(list)),colSpan:2,styles:{fontStyle:'italic'}}])});
  doc.autoTable({...tstyle(col),startY:y,head:[['Ouvrage','Calcul (longueur x section = volume, dosages, quantités)']],body,columnStyles:{0:{cellWidth:55,fontStyle:'bold'},1:{fontSize:7.5}}});
  y=doc.lastAutoTable.finalY+6;doc.setFont('helvetica','italic');doc.setFontSize(8);doc.text(T('Ciment en sacs de 50 kg ; barres de fer de 12 m ; parpaings : surface / surface d\'un parpaing + casse. Coefficients modifiables dans les Règles de calcul.'),14,y,{maxWidth:182});
  await savePdf(doc,`Avant-metre ${d.numero}.pdf`)}
