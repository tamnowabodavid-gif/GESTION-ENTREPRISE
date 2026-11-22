/* ---------- Inventaire : matériaux (entrées / sorties / stock) & matériel ---------- */
const skey=(nom,u)=>String(nom||'').trim().toLowerCase()+'|'+String(u||'').trim();
const ETAT_MAT={bon:'Bon état',reparer:'À réparer',hs:'Hors service'};
const PROV_MAT={propriete:'Appartient à l\'entreprise',achete:'Acheté pour ce chantier',loue:'Loué'};
const TYPE_MV={initial:'Stock initial',transfert:'Transfert d\'un autre chantier',retour:'Retour sur le chantier',ajust:'Correction d\'inventaire',sortie:'Sortie (utilisé)'};
function stockCfg(cid){return (S.stockcfg.find(x=>x.id===cid)||{}).cfg||{}}
function stockCouv(cid){return num((S.stockcfg.find(x=>x.id===cid)||{}).couverture)||14}
function stockData(cid){
  const items={},get=(nom,u)=>{const k=skey(nom,u);return items[k]||(items[k]={k,nom:String(nom||'').trim(),unite:u||'',ent:0,sor:0,mv:[],lastPu:0})};
  byC('achats',cid).filter(a=>a.statut!=='a_acheter'&&num(a.quantite)>0).sort((a,b)=>(a.date||'').localeCompare(b.date||'')).forEach(a=>{const it=get(a.materiau,a.unite);it.ent+=num(a.quantite);it.mv.push({date:a.date,type:'achat',qte:num(a.quantite),note:a.fournisseur||'',id:a.id});if(num(a.prixUnit))it.lastPu=num(a.prixUnit)});
  byC('mouvements',cid).forEach(m=>{const it=get(m.nom,m.unite);if(m.type==='sortie')it.sor+=num(m.qte);else it.ent+=num(m.qte);it.mv.push({...m,manuel:true})});
  const cfg=stockCfg(cid),lim=addDays(today(),-14);
  return Object.values(items).map(it=>{const st=it.ent-it.sor,s14=it.mv.filter(m=>m.type==='sortie'&&m.date>=lim),jrs=new Set(s14.map(m=>m.date)).size,moy=jrs?sum(s14,m=>num(m.qte))/jrs:0,c=cfg[it.k]||{},seuil=num(c.seuil),delai=c.delai!=null&&c.delai!==''?num(c.delai):3;
    const jr=moy>0?st/moy:null,alerte=st<=0?'rupture':(seuil&&st<=seuil)||(jr!=null&&jr<=delai+2)?'commander':null;
    return{...it,stock:st,moy,jr,seuil,delai,alerte,mv:it.mv.sort((a,b)=>(b.date||'').localeCompare(a.date||''))}}).sort((a,b)=>(!!b.alerte-!!a.alerte)||a.nom.localeCompare(b.nom))}
function joursOuvres(n){let d=today(),k=0;while(k<Math.floor(n)){d=addDays(d,1);if(parseD(d).getDay()!==0)k++}return d}

function tStock(ch){
  const vue=ui.stockVue||'mat';
  let h=`<div class="seg"><button class="${vue==='mat'?'on':''}" onclick="ui.stockVue='mat';render()">Matériaux</button><button class="${vue==='eq'?'on':''}" onclick="ui.stockVue='eq';render()">Matériel</button></div>`;
  return h+(vue==='eq'?stockMateriel(ch):stockMateriaux(ch));
}
function stockMateriaux(ch){
  const D=stockData(ch.id),al=D.filter(x=>x.alerte),couv=stockCouv(ch.id);
  let h=`<div class="qbtns" style="margin:0 0 12px"><button class="btn" onclick="formSorties()">📝 Sorties du jour</button><button class="btn sec" onclick="formEntree()">+ Entrée</button></div>`;
  if(!D.length)return h+`<div class="card empty">Le stock se remplit tout seul avec tes <b>achats</b> (statut « acheté ») et les <b>entrées</b> manuelles (stock initial, transfert, retour). Chaque soir, note les <b>sorties du jour</b> : le stock restant, la consommation moyenne et la date de rupture se calculent.</div>`;
  if(al.length){const tot=sum(al,x=>besoin(x,couv)*x.lastPu);
    h+=`<div class="card" style="border-color:#f1c9a6;background:#fff8f2"><h3>⚠️ ${al.length} article(s) à réapprovisionner</h3>${al.map(x=>`<div class="sm" style="margin:3px 0">• <b>${esc(x.nom)}</b> : ${N(x.stock,1)} ${esc(x.unite)} restant${x.jr!=null?` · rupture vers le <b>${dfr(joursOuvres(x.jr))}</b>`:''} · à commander : <b>${N(besoin(x,couv),1)} ${esc(x.unite)}</b></div>`).join('')}
      <div class="sm mute" style="margin-top:6px">Quantités calculées pour ${couv} jours de travail + le délai de livraison de chaque article. Montant estimé : <b>${F(tot)}</b></div>
      <div class="qbtns"><button class="btn small" onclick="bonDepuisStock()">🧾 Préparer le bon de commande</button><button class="btn sec small" onclick="pdfAppelFonds('${ch.id}')">📄 Appel de fonds au client</button><button class="btn ghost small" onclick="formCouverture()">Réglages</button></div></div>`}
  h+=`<div class="card list">`;
  D.forEach(x=>{const pct=x.ent>0?Math.max(0,Math.min(100,x.stock/x.ent*100)):0;
    h+=`<div class="it click" onclick="detailStock('${encodeURIComponent(x.k)}')"><div class="main"><div class="t">${esc(x.nom)} ${x.alerte==='rupture'?chip('rupture','bad'):x.alerte?chip('à commander','go'):''}</div>
      <div class="pbar-line"><div class="bar ${x.alerte?'bad':'ok'}"><i style="width:${pct}%"></i></div></div>
      <div class="s">Entrées ${N(x.ent,1)} · sorties ${N(x.sor,1)}${x.moy?` · ${N(x.moy,1)} ${esc(x.unite)}/jour`:''}${x.jr!=null?` · ≈ ${N(x.jr,1)} jour(s) restant(s)`:''}</div></div>
      <div class="amt">${N(x.stock,1)}<small>${esc(x.unite)} en stock</small></div></div>`});
  return h+`</div>`;
}
const DISCU=new Set(['pièce','sac','barre','feuille','rouleau','seau','pot','panneau','plaque','sachet','paire','voyage']);
const besoin=(x,couv)=>{const b=Math.max(0,x.moy>0?x.moy*(couv+x.delai)-x.stock:Math.max(x.seuil*2,0)-x.stock);return DISCU.has(x.unite)?Math.ceil(b-1e-9):Math.ceil(b*10)/10};
function formSorties(){
  const D=stockData(ui.cid).filter(x=>x.stock>0);if(!D.length){toast('Aucun matériau en stock. Enregistre d\'abord un achat ou une entrée.');return}
  const ets=etapesOf(ui.cid);
  $('#modalRoot').innerHTML=`<div class="modal-bg"><form class="modal" id="frmS"><h2>Sorties du jour</h2>
    <div class="grid2"><label class="f"><span>Date</span><input type="date" name="date" value="${today()}"></label><label class="f"><span>Étape</span><select name="etapeId"><option value="">—</option>${ets.map(e=>`<option value="${e.id}">${esc(e.nom)}</option>`).join('')}</select></label></div>
    <div class="note" style="margin:-4px 0 8px">Indique ce qui a été utilisé aujourd'hui. Laisse vide les articles non utilisés.</div>
    ${D.map((x,i)=>`<div class="regr"><span>${esc(x.nom)}<br><small class="mute">${N(x.stock,1)} ${esc(x.unite)} en stock</small></span><input inputmode="decimal" data-i="${i}" placeholder="0"></div>`).join('')}
    <label class="f" style="margin-top:10px"><span>Note</span><input name="note" placeholder="ex. coulage des semelles"></label>
    <div class="row" style="margin-top:6px"><button type="button" class="btn sec" onclick="closeForm()">Annuler</button><button class="btn" style="flex:1">Enregistrer les sorties</button></div></form></div>`;
  $('#frmS').onsubmit=async ev=>{ev.preventDefault();const f=ev.target,date=f.date.value||today(),etapeId=f.etapeId.value,note=f.note.value.trim(),L=[];
    for(const inp of f.querySelectorAll('[data-i]')){const q=num(inp.value);if(!q)continue;const x=D[+inp.dataset.i];if(q<0){toast('Quantité négative : '+x.nom);return}if(q>x.stock+1e-9){toast(`${x.nom} : ${N(q,1)} demandé(s), seulement ${N(x.stock,1)} en stock.`);return}L.push({x,q})}
    if(!L.length){toast('Aucune quantité saisie.');return}closeForm();
    for(const{x,q} of L)await save('mouvements',{chantierId:ui.cid,date,type:'sortie',nom:x.nom,unite:x.unite,qte:q,etapeId,note});
    toast(L.length+' sortie(s) enregistrée(s)')};
}
function formEntree(pre){
  const noms=[...new Set([...stockData(ui.cid).map(x=>x.nom),...articles().filter(a=>a.secteur!=='mo').map(a=>a.nom)])];
  openForm({title:'Entrée en stock',values:{date:today(),type:'initial',unite:'sac',...(pre||{})},
    fields:[{k:'nom',label:'Article',req:true,list:noms},{k:'unite',label:'Unité',type:'select',opts:UNITES_ALL.map(u=>[u,u])},{k:'qte',label:'Quantité',type:'number',req:true},
      {k:'type',label:'Origine',type:'select',opts:[['initial',TYPE_MV.initial],['transfert',TYPE_MV.transfert],['retour',TYPE_MV.retour]]},{k:'date',label:'Date',type:'date'},{k:'note',label:'Note'}],
    extra:`<div class="note" style="margin-bottom:12px">Les achats marqués « acheté » entrent en stock automatiquement : ne les saisis pas ici.</div>`,
    onInput:(f,o)=>{const a=articles().find(x=>x.nom===o.nom);if(a&&!f.elements.unite.dataset.t&&UNITES_ALL.includes(a.unite)){f.elements.unite.value=a.unite;f.elements.unite.dataset.t=1}},
    onSave:o=>save('mouvements',{chantierId:ui.cid,...o,qte:num(o.qte)})});
}
function detailStock(kEnc){
  const k=decodeURIComponent(kEnc),x=stockData(ui.cid).find(z=>z.k===k);if(!x)return;const cfg=stockCfg(ui.cid)[k]||{},etN=Object.fromEntries(etapesOf(ui.cid).map(e=>[e.id,e.nom]));
  $('#modalRoot').innerHTML=`<div class="modal-bg" onclick="if(event.target===this)closeForm()"><div class="modal"><h2>${esc(x.nom)}</h2>
    <div class="res" style="margin-bottom:12px"><div class="r"><span>Entrées</span><b>${N(x.ent,1)} ${esc(x.unite)}</b></div><div class="r"><span>Sorties</span><b>${N(x.sor,1)} ${esc(x.unite)}</b></div><div class="r big"><span>Stock restant</span><b>${N(x.stock,1)} ${esc(x.unite)}</b></div>
      <div class="r"><span>Consommation moyenne (14 derniers jours)</span><b>${x.moy?N(x.moy,2)+' '+esc(x.unite)+' / jour':'—'}</b></div><div class="r"><span>Rupture estimée</span><b>${x.jr!=null?dfr(joursOuvres(x.jr))+' ('+N(x.jr,1)+' j)':'—'}</b></div>
      <div class="r"><span>Valeur du stock (dernier prix)</span><b>${F(Math.max(0,x.stock)*x.lastPu)}</b></div></div>
    <div class="grid2"><label class="f"><span>Seuil d'alerte (${esc(x.unite)})</span><input id="sSeuil" inputmode="decimal" value="${esc(cfg.seuil??'')}" placeholder="0"></label><label class="f"><span>Délai de livraison (jours)</span><input id="sDelai" inputmode="decimal" value="${esc(cfg.delai??'')}" placeholder="3"></label></div>
    <div class="qbtns" style="margin-top:0"><button class="btn small" onclick="saveStockCfg('${kEnc}')">Enregistrer l'alerte</button><button class="btn sec small" onclick="comptage('${kEnc}')">📋 Comptage physique</button><button class="btn sec small" onclick="closeForm();formEntree({nom:'${esc(x.nom).replace(/'/g,"\\'")}',unite:'${esc(x.unite)}'})">+ Entrée</button></div>
    <h3 style="margin:16px 0 4px;font-size:15px">Mouvements</h3><div class="list">${x.mv.map(m=>`<div class="it"><div class="main"><div class="t" style="font-weight:500">${m.type==='achat'?'Achat':TYPE_MV[m.type]||m.type}${m.etapeId&&etN[m.etapeId]?' · '+esc(etN[m.etapeId]):''}</div><div class="s">${dfr(m.date)}${m.note?' · '+esc(m.note):''}</div></div>
      <div class="amt" style="color:${m.type==='sortie'||num(m.qte)<0?'var(--warn)':'var(--ok)'}">${m.type==='sortie'?'−':num(m.qte)>=0?'+':''}${N(Math.abs(num(m.qte)),1)}</div>${m.manuel?`<button class="btn ghost small delb" onclick="confirmDel(this,()=>{del('mouvements','${m.id}');closeForm()},true)">🗑</button>`:''}</div>`).join('')}</div>
    <div class="note">Les entrées « Achat » viennent de l'onglet Achats : modifie-les là-bas.</div>
    <button class="btn sec block" style="margin-top:12px" onclick="closeForm()">Fermer</button></div></div>`;
}
async function saveStockCfg(kEnc){const k=decodeURIComponent(kEnc),d=S.stockcfg.find(x=>x.id===ui.cid)||{id:ui.cid,chantierId:ui.cid,cfg:{}},cfg={...(d.cfg||{})};
  cfg[k]={seuil:$('#sSeuil').value,delai:$('#sDelai').value};await save('stockcfg',{...d,cfg});toast('Alerte enregistrée');closeForm()}
function comptage(kEnc){const k=decodeURIComponent(kEnc),x=stockData(ui.cid).find(z=>z.k===k);
  openForm({title:'Comptage : '+x.nom,values:{date:today()},fields:[{k:'compte',label:`Quantité comptée sur place (${x.unite})`,type:'number',req:true},{k:'date',label:'Date',type:'date'},{k:'note',label:'Note',ph:'ex. inventaire de fin de semaine'}],
    extra:`<div class="note" style="margin-bottom:12px">Stock théorique : ${N(x.stock,1)} ${esc(x.unite)}. L'écart sera enregistré comme correction d'inventaire.</div>`,
    onSave:async o=>{const d=num(o.compte)-x.stock;if(Math.abs(d)<1e-9){toast('Aucun écart : stock juste');return}await save('mouvements',{chantierId:ui.cid,date:o.date||today(),type:'ajust',nom:x.nom,unite:x.unite,qte:Math.round(d*100)/100,note:(o.note?o.note+' · ':'')+`compté ${N(num(o.compte),1)}, théorique ${N(x.stock,1)}`});toast(`Écart de ${N(d,1)} ${x.unite} enregistré`)}})}
function formCouverture(){const d=S.stockcfg.find(x=>x.id===ui.cid)||{id:ui.cid,chantierId:ui.cid,cfg:{}};
  openForm({title:'Réglages du réapprovisionnement',values:{couverture:stockCouv(ui.cid)},fields:[{k:'couverture',label:'Commander pour combien de jours de travail ?',type:'number'}],
    extra:`<div class="note" style="margin-bottom:12px">Quantité à commander = consommation moyenne par jour × (jours de couverture + délai de livraison) − stock restant.</div>`,
    onSave:o=>save('stockcfg',{...d,couverture:num(o.couverture)||14})})}
async function bonDepuisStock(){const couv=stockCouv(ui.cid),al=stockData(ui.cid).filter(x=>x.alerte&&besoin(x,couv)>0);if(!al.length){toast('Rien à commander.');return}
  const ch=S.chantiers.find(c=>c.id===ui.cid);
  const id=await save('bons',{chantierId:ui.cid,numero:nextNum('bons','BC'),date:today(),statut:'emis',fournisseur:'',livraisonLieu:ch.lieu||'',etapeId:'',lignes:al.map(x=>({id:uid(),designation:x.nom,unite:x.unite,qte:besoin(x,couv),pu:x.lastPu})),notes:'Réapprovisionnement du stock de chantier. Merci de joindre ce bon à votre facture et au bordereau de livraison.'});
  ui.tab='commandes';ui.bonId=id;render();toast('Bon de commande préparé : choisis le fournisseur')}

/* --- matériel --- */
function stockMateriel(ch){
  const L=byC('materiel',ch.id).sort((a,b)=>(a.nom||'').localeCompare(b.nom||'')),last=byC('controles',ch.id).sort((a,b)=>(b.date||'').localeCompare(a.date||''))[0];
  let h=`<div class="qbtns" style="margin:0 0 12px"><button class="btn" onclick="controleSoir()">✅ Contrôle du soir</button><button class="btn sec" onclick="formMateriel()">+ Matériel</button>${byC('devis',ch.id).length?`<button class="btn sec" onclick="importerOutillage()">Importer depuis le devis</button>`:''}</div>`;
  if(!L.length)return h+`<div class="card empty">Liste ici l'équipement présent sur le chantier : brouettes, pelles, bétonnière, échafaudages… Chaque soir, le <b>contrôle</b> permet de vérifier que tout est rentré et en bon état.</div>`;
  if(last){const man=(last.lignes||[]).filter(x=>num(x.present)<num(x.attendu));h+=`<div class="card ${man.length?'warnc':''}"><b>Dernier contrôle : ${dfr(last.date)}</b><div class="sm ${man.length?'':'mute'}" style="margin-top:4px">${man.length?'Manquant : '+man.map(x=>`${esc(x.nom)} (${num(x.attendu)-num(x.present)})`).join(', '):'Tout le matériel était présent.'}</div></div>`}
  h+=`<div class="card list">`;
  L.forEach(m=>{const loc=m.provenance==='loue'&&m.retour,lt=loc&&m.retour<=addDays(today(),2);
    h+=`<div class="it click" onclick="formMateriel('${m.id}')"><div class="main"><div class="t">${esc(m.nom)} ${m.etat&&m.etat!=='bon'?chip(ETAT_MAT[m.etat],m.etat==='hs'?'bad':'go'):''}${lt?chip('retour location '+dfr(m.retour),'bad'):''}</div><div class="s">${PROV_MAT[m.provenance]||''}${loc&&!lt?' · retour le '+dfr(m.retour):''}</div></div><div class="amt">${num(m.quantite)}<small>sur le chantier</small>${delBtn('materiel',m.id)}</div></div>`});
  h+=`</div>`;
  const hist=byC('controles',ch.id).sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,10);
  if(hist.length)h+=`<div class="card list"><h3>Historique des contrôles</h3>${hist.map(c=>{const man=(c.lignes||[]).filter(x=>num(x.present)<num(x.attendu));return `<div class="it"><div class="main"><div class="t" style="font-weight:500">${dfr(c.date)}</div><div class="s">${man.length?'Manquant : '+man.map(x=>esc(x.nom)).join(', '):'Complet'}${c.note?' · '+esc(c.note):''}</div></div>${delBtn('controles',c.id)}</div>`}).join('')}</div>`;
  return h;
}
function formMateriel(id){const m=id?S.materiel.find(x=>x.id===id):null;
  openForm({title:m?'Modifier le matériel':'Nouveau matériel',values:m||{quantite:1,etat:'bon',provenance:'propriete'},
    fields:[{k:'nom',label:'Désignation',req:true,list:articles('outillage').map(a=>a.nom).concat(['Bétonnière','Vibreur','Échafaudage','Groupe électrogène','Motopompe'])},{k:'quantite',label:'Quantité sur le chantier',type:'number',req:true},
      {k:'etat',label:'État',type:'select',opts:Object.entries(ETAT_MAT)},{k:'provenance',label:'Provenance',type:'select',opts:Object.entries(PROV_MAT)},{k:'retour',label:'Date de retour (si loué)',type:'date'},{k:'note',label:'Note'}],
    onSave:o=>save('materiel',{...(m||{}),...o,quantite:num(o.quantite),chantierId:ui.cid}),onDelete:m?()=>del('materiel',m.id):null})}
function controleSoir(){const L=byC('materiel',ui.cid).sort((a,b)=>(a.nom||'').localeCompare(b.nom||''));if(!L.length){toast('Ajoute d\'abord le matériel.');return}
  $('#modalRoot').innerHTML=`<div class="modal-bg"><form class="modal" id="frmC"><h2>Contrôle du soir</h2><label class="f"><span>Date</span><input type="date" name="date" value="${today()}"></label>
    <div class="note" style="margin:-4px 0 8px">Compte le matériel rentré et indique son état.</div>
    ${L.map((m,i)=>`<div class="ctr"><span>${esc(m.nom)}<br><small class="mute">attendu : ${num(m.quantite)}</small></span><input inputmode="numeric" data-i="${i}" value="${num(m.quantite)}"><select data-e="${i}">${Object.entries(ETAT_MAT).map(([k,v])=>`<option value="${k}" ${(m.etat||'bon')===k?'selected':''}>${v}</option>`).join('')}</select></div>`).join('')}
    <label class="f" style="margin-top:10px"><span>Note</span><input name="note" placeholder="ex. brouette prêtée au voisin"></label>
    <div class="row"><button type="button" class="btn sec" onclick="closeForm()">Annuler</button><button class="btn" style="flex:1">Enregistrer le contrôle</button></div></form></div>`;
  $('#frmC').onsubmit=async ev=>{ev.preventDefault();const f=ev.target,lignes=L.map((m,i)=>({id:m.id,nom:m.nom,attendu:num(m.quantite),present:num(f.querySelector(`[data-i="${i}"]`).value),etat:f.querySelector(`[data-e="${i}"]`).value}));closeForm();
    await save('controles',{chantierId:ui.cid,date:f.date.value||today(),lignes,note:f.note.value.trim()});
    for(const x of lignes){const m=L.find(z=>z.id===x.id);if((m.etat||'bon')!==x.etat)await save('materiel',{...m,etat:x.etat})}
    const man=lignes.filter(x=>x.present<x.attendu);toast(man.length?`${man.length} article(s) manquant(s)`:'Contrôle enregistré : tout est présent')}}
async function importerOutillage(){const dv=byC('devis',ui.cid).sort((a,b)=>(b.date||'').localeCompare(a.date||''))[0];if(!dv)return;
  const ex=new Set(byC('materiel',ui.cid).map(m=>(m.nom||'').toLowerCase())),skip=['ou-cordeau','ou-chaux','ou-tuyau','ou-gants','ou-jalon'];let n=0;
  for(const l of dv.lots)for(const x of l.lignes)if(String(x.ref).startsWith('ou-')&&!skip.includes(x.ref)){const nom=(art(x.ref)||{}).nom||x.designation.split(' — ')[0];if(ex.has(nom.toLowerCase()))continue;ex.add(nom.toLowerCase());
    await save('materiel',{chantierId:ui.cid,nom,quantite:num(x.qte),etat:'bon',provenance:x.off?'propriete':'achete'});n++}
  toast(n?n+' article(s) importé(s) du devis '+dv.numero:'Rien de nouveau à importer')}

/* --- appel de fonds PDF --- */
async function pdfAppelFonds(cid){
  const ch=S.chantiers.find(c=>c.id===cid)||{},couv=stockCouv(cid),al=stockData(cid).filter(x=>x.alerte&&besoin(x,couv)>0),E=ent();if(!al.length){toast('Rien à réapprovisionner.');return}
  const tot=sum(al,x=>besoin(x,couv)*x.lastPu),rup=al.filter(x=>x.jr!=null).map(x=>joursOuvres(x.jr)).sort()[0];
  const {doc,y:y0,col}=pdfBase('APPEL DE FONDS',`Du ${dfr(today())}`);let y=y0;
  y=box(doc,14,y,88,'Destinataire',clientLines(ch),col)+5;
  doc.setFont('helvetica','normal');doc.setFontSize(10);
  const intro=doc.splitTextToSize(T(`Objet : approvisionnement du chantier ${ch.nom||''}${ch.lieu?' ('+ch.lieu+')':''}.\n\nPour assurer la continuité des travaux, nous vous prions de bien vouloir procéder au versement de la somme de ${FN(tot)} FCFA, destinée à l'achat des matériaux ci-dessous, dont le stock sur le chantier arrive à épuisement${rup?' (rupture estimée le '+dfr(rup)+')':''}.`),182);
  doc.text(intro,14,y);y+=intro.length*4.6+3;
  doc.autoTable({...tstyle(col),startY:y,head:[['Matériau','Stock restant','Conso. / jour','Quantité à acheter','P.U. (FCFA)','Montant (FCFA)']],
    body:[...al.map(x=>[T(x.nom),N(x.stock,1)+' '+T(x.unite),x.moy?N(x.moy,1):'-',N(besoin(x,couv),1)+' '+T(x.unite),FN(x.lastPu),FN(besoin(x,couv)*x.lastPu)]),[{content:'TOTAL',colSpan:5,styles:{halign:'right',fontStyle:'bold'}},{content:FN(tot),styles:{fontStyle:'bold',halign:'right'}}]],
    columnStyles:{1:{halign:'right'},2:{halign:'right'},3:{halign:'right'},4:{halign:'right'},5:{halign:'right'}}});
  y=doc.lastAutoTable.finalY+6;doc.setFontSize(9);const ar=doc.splitTextToSize(T(`Arrêté le présent appel de fonds à la somme de : ${lettres(tot)} (${FN(tot)}) francs CFA.`),182);doc.text(ar,14,y);y+=ar.length*4.4+4;
  doc.setFontSize(8.5);doc.setTextColor(90,96,106);const nt=doc.splitTextToSize(T(`Quantités calculées sur la consommation réelle des 14 derniers jours, pour ${couv} jours de travail plus le délai de livraison. Prix unitaires : derniers prix d'achat.${E.banque?' Paiement : '+E.banque+'.':''}`),182);doc.text(nt,14,y);doc.setTextColor(30,35,43);y+=nt.length*4+6;
  signatures(doc,y,'Le client - Bon pour accord',E.signataire||"Pour l'entreprise");
  await savePdf(doc,`Appel de fonds ${today()} - ${T(ch.nom||'')}.pdf`);
}

/* ---------- Bon de commande rapide ---------- */
function bcLigne(l={}){return `<div class="bcl"><input data-b="designation" list="bcArt" placeholder="Article (ex. Ciment 42.5R)" value="${esc(l.designation||'')}">
  <input data-b="qte" inputmode="decimal" placeholder="Qté" value="${esc(l.qte??'')}"><select data-b="unite">${UNITES_ALL.map(u=>`<option ${(l.unite||'pièce')===u?'selected':''}>${u}</option>`).join('')}</select>
  <input data-b="pu" inputmode="decimal" placeholder="P.U." value="${esc(l.pu??'')}"><button type="button" class="btn ghost small delb" onclick="this.parentNode.remove();bcTot()">×</button></div>`}
function prixConnu(nom){const n=String(nom||'').trim().toLowerCase();if(!n)return null;
  const a=S.achats.filter(x=>String(x.materiau||'').trim().toLowerCase()===n&&num(x.prixUnit)).sort((x,y)=>(y.date||'').localeCompare(x.date||''))[0];if(a)return{pu:num(a.prixUnit),unite:a.unite};
  const c=articles().find(x=>x.nom.toLowerCase()===n);return c?{pu:c.prix,unite:c.unite}:null}
function bonRapide(){
  if(ui.view!=='chantier'||!ui.cid){toast('Ouvre d\'abord le chantier concerné.');return}
  const cid=ui.cid,ch0=S.chantiers.find(c=>c.id===cid)||{},ets=etapesOf(cid),fourn=[...new Set(S.bons.map(b=>b.fournisseur).concat(S.achats.map(a=>a.fournisseur)).filter(Boolean))];
  const noms=[...new Set([...articles().filter(a=>a.secteur!=='mo').map(a=>a.nom),...S.achats.map(a=>a.materiau)])];
  $('#modalRoot').innerHTML=`<div class="modal-bg"><form class="modal" id="frmB"><h2>🧾 Bon de commande</h2>
   <datalist id="bcArt">${noms.map(n=>`<option value="${esc(n)}">`).join('')}</datalist><datalist id="bcF">${fourn.map(n=>`<option value="${esc(n)}">`).join('')}</datalist>
   <div class="banner" style="margin-bottom:10px">Chantier : <b>${esc(ch0.nom||'')}</b></div>
   <label class="f"><span>Étape concernée${ets.length?' *':''}</span><select name="etapeId"><option value="">${ets.length?'— Choisis l\'étape —':'Aucune étape (applique un devis pour suivre les budgets)'}</option>${ets.map(e=>`<option value="${e.id}">${esc(e.nom)}</option>`).join('')}</select></label>
   <div class="grid2"><label class="f"><span>Fournisseur *</span><input name="fournisseur" list="bcF" placeholder="ex. Quincaillerie X"></label><label class="f"><span>Téléphone</span><input name="fournTel" type="tel"></label></div>
   <div class="grid2"><label class="f"><span>Livraison souhaitée le</span><input name="livraisonDate" type="date" value="${today()}"></label><label class="f"><span>Contact sur le chantier</span><input name="contact" placeholder="nom, tél."></label></div>
   <div class="f"><span class="lbl">Articles à livrer</span><div class="bcl bch"><span>Article</span><span>Qté</span><span>Unité</span><span>P.U.</span><span></span></div><div id="bcL">${[0,1,2].map(()=>bcLigne()).join('')}</div>
   <button type="button" class="btn sec small" onclick="document.getElementById('bcL').insertAdjacentHTML('beforeend',bcLigne())">+ Ajouter un article</button></div>
   <div class="res" id="bcT"></div>
   <label class="f" style="margin-top:10px"><span>Note pour le fournisseur</span><input name="notes" value="Merci de joindre ce bon de commande à votre facture et au bordereau de livraison."></label>
   <div class="row" style="margin-top:6px"><button type="button" class="btn sec" onclick="closeForm()">Annuler</button><button class="btn" style="flex:1">Enregistrer et créer le PDF</button></div></form></div>`;
  const f=$('#frmB');
  f.addEventListener('change',bcTot);f.addEventListener('input',e=>{const r=e.target.closest('.bcl');if(r&&e.target.dataset.b==='designation'){const k=prixConnu(e.target.value);if(k){const pu=r.querySelector('[data-b=pu]');if(!pu.value||pu.dataset.auto){pu.value=k.pu;pu.dataset.auto=1}if(UNITES_ALL.includes(k.unite))r.querySelector('[data-b=unite]').value=k.unite}}if(e.target.dataset.b==='pu')delete e.target.dataset.auto;bcTot()});
  bcTot();
  f.onsubmit=async ev=>{ev.preventDefault();const lignes=[...f.querySelectorAll('#bcL .bcl')].map(r=>{const g=k=>r.querySelector(`[data-b=${k}]`).value.trim();return{id:uid(),designation:g('designation'),qte:num(g('qte')),unite:g('unite'),pu:num(g('pu'))}}).filter(l=>l.designation&&l.qte>0);
    if(!f.fournisseur.value.trim()){toast('Indique le fournisseur.');return}if(ets.length&&!f.etapeId.value){toast('Choisis l\'étape concernée.');return}if(!lignes.length){toast('Ajoute au moins un article avec sa quantité.');return}
    const c=ch0;const eid=f.etapeId.value;closeForm();
    const id=uid(),pb=save('bons',{id,chantierId:cid,numero:nextNum('bons','BC'),date:today(),statut:'emis',fournisseur:f.fournisseur.value.trim(),fournTel:f.fournTel.value.trim(),livraisonDate:f.livraisonDate.value,livraisonLieu:c.lieu||'',contact:f.contact.value.trim(),etapeId:eid,lignes,notes:f.notes.value.trim()});
    toast('Bon enregistré, création du PDF…');try{await pdfBon(id)}catch(e){toast('Le bon est enregistré mais le PDF a échoué : '+(e.message||e))}try{await pb}catch(e){}};
}
function bcTot(){const f=$('#frmB');if(!f)return;const L=[...f.querySelectorAll('#bcL .bcl')].map(r=>num(r.querySelector('[data-b=qte]').value)*num(r.querySelector('[data-b=pu]').value));
  const t=sum(L,x=>x),eid=f.etapeId&&f.etapeId.value,x=eid&&budgetEtape(ui.cid,eid);
  $('#bcT').innerHTML=`<div class="r big"><span>Total</span><b>${F(t)}</b></div>${x&&x.bMat?`<div class="r"><span>Budget matériaux de l'étape</span><b>${F(x.bMat)}</b></div><div class="r"><span>Déjà acheté ou commandé</span><b>${F(x.achat+x.engage)}</b></div><div class="r"><span>Reste après ce bon</span><b style="color:${x.resteMat-t<0?'var(--warn)':'var(--ok)'}">${F(x.resteMat-t)}</b></div>${x.resteMat-t<0?'<div class="alert">Ce bon dépasse le budget matériaux de l\'étape.</div>':''}`:''}<div class="sm mute">${t?esc(lettres(t))+' francs CFA':'Le prix est rempli tout seul si l\'article est dans ton catalogue ou dans tes achats.'}</div>`}
