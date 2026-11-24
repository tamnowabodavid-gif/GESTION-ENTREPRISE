/* intervenants.js — équipe de chaque projet en pyramide : fonctions (bureau, études, pilotage, terrain, partenaires, fournisseurs),
   accès aux documents du projet par fonction, supervision, suivi des équipes, droits d'écriture, envoi des bons de commande aux fournisseurs */
if(!COLLS.includes('intervenants')){COLLS.push('intervenants');S.intervenants=S.intervenants||[]}
/* ---------- documents du projet auxquels on peut donner accès ---------- */
const PDOCS=[
 ['Suivi du chantier',[['av','📈','Avancement et étapes'],['etMetier','🔧','Étapes de son métier seulement'],['journal','📓','Journal de chantier et photos'],['rapj','📋','Rapports du jour'],['rapport','📄',"Rapports d'avancement (au client)"]]],
 ['Plans et études',[['plansArch','📐','Plans architecturaux'],['implant','📍',"Plan d'implantation"],['ferr','🧱','Plans de ferraillage et d\'exécution'],['ddc','🧮','Notes de calcul et descente de charges'],['elecP','⚡','Plans et métré électricité'],['plombP','🚰','Plomberie et assainissement'],['solaire','☀️','Dimensionnement solaire'],['calculs','📏','Calculs de quantités'],['dqt','📋','Devis quantitatif (sans les prix)']]],
 ['Chantier et matériaux',[['pointEq','⏱️',"Pointage de l'équipe"],['pointMoi','🕒','Son propre pointage'],['stock','📦','Stock et sorties de matériaux'],['demandes','🧾','Demandes de matériel'],['bons','📑','Bons de commande'],['bonsFour','📥','Ses bons de commande (fournisseur)'],['achats','🛒','Achats et dépenses']]],
 ['Argent',[['devis','💰','Devis chiffré'],['contrat','✍️','Contrat'],['factures','🧾','Factures et reçus'],['paie','👷',"Paie de l'équipe"],['tresor','🏦',"Trésorerie de l'entreprise"]]],
 ['Administratif',[['dossierAdm','📁','Dossier administratif (permis, titre foncier, pièces)'],['contacts','📇','Contacts du projet']]],
 ['Communication',[['msgCh','💬','Discussion du chantier'],['msgPrive','✉️','Messages privés (avec les personnes autorisées)']]]];
const PDOC=Object.fromEntries([].concat(...PDOCS.map(([g,L])=>L.map(([k,i,l])=>[k,{i,l,g}]))));
/* ---------- fonctions, rangées dans l'ordre de la hiérarchie ---------- */
const T_GO=['prep','fouilles','fond','soub','remblai','dallage','elev','dalle','enduit'];
const NIVH=[[1,"Maître d'ouvrage"],[2,"Maîtrise d'œuvre"],[3,'Conception et études'],[4,'Contrôle des travaux'],[5,'Conduite des travaux'],[6,'Chef de chantier'],[7,"Chefs d'équipe"],[8,'Corps de métier'],[9,'Manœuvres et gardiennage'],[10,'Partenaires et sous-traitants'],[11,'Fournisseurs']];
const FX_=(k,ic,l,niv,grp,docs,o={})=>({k,ic,l,niv,grp,docs,...o});
const FONCTIONS=[
 // pilotage
 FX_('mo','🏛️',"Maître d'ouvrage (client)",1,'Pilotage du projet',['av','journal','rapport','plansArch','devis','contrat','factures','dossierAdm','msgPrive'],{d:'Le propriétaire du projet : suit l\'avancement, reçoit les rapports et ses factures.'}),
 FX_('moe','🧭',"Maître d'œuvre",2,'Pilotage du projet',['av','journal','rapj','rapport','plansArch','implant','ferr','ddc','elecP','plombP','calculs','dqt','dossierAdm','msgCh','msgPrive'],{d:'Conçoit et dirige les travaux pour le compte du client.'}),
 FX_('ctrl','🔍','Contrôleur des travaux / bureau de contrôle',4,'Pilotage du projet',['av','journal','rapj','implant','ferr','ddc','elecP','plombP','msgCh','msgPrive'],{d:'Vérifie la conformité des travaux avant et pendant le chantier.'}),
 FX_('cond','📋','Conducteur de travaux',5,'Pilotage du projet',['av','journal','rapj','rapport','implant','ferr','ddc','elecP','plombP','calculs','dqt','pointEq','stock','demandes','bons','achats','msgCh','msgPrive']),
 // conception & études
 FX_('archi','📐','Architecte',3,'Conception et études',['av','journal','plansArch','implant','dossierAdm','msgCh','msgPrive']),
 FX_('ingGC','🏗️','Ingénieur génie civil / structure',3,'Conception et études',['av','journal','plansArch','implant','ferr','ddc','calculs','msgCh','msgPrive']),
 FX_('ingElec','⚡','Ingénieur génie électrique',3,'Conception et études',['etMetier','journal','plansArch','elecP','msgCh','msgPrive'],{et:['elec','equip']}),
 FX_('ingSol','☀️','Ingénieur solaire / énergies renouvelables',3,'Conception et études',['etMetier','journal','elecP','solaire','msgCh','msgPrive'],{et:['elec','equip']}),
 FX_('ingFlu','🚰','Ingénieur fluides (plomberie, assainissement)',3,'Conception et études',['etMetier','journal','plansArch','plombP','msgCh','msgPrive'],{et:['plomb','assain','equip']}),
 FX_('geot','🪨','Géotechnicien',3,'Conception et études',['plansArch','implant','dossierAdm','msgPrive'],{et:['etudes','fouilles','fond']}),
 FX_('topo','📏','Géomètre / topographe',3,'Conception et études',['plansArch','implant','msgPrive'],{et:['etudes','prep']}),
 FX_('metreur','🧮','Métreur / économiste de la construction',3,'Conception et études',['calculs','dqt','devis','achats','msgPrive']),
 FX_('dessin','🖥️','Dessinateur / projeteur',3,'Conception et études',['plansArch','implant','ferr','elecP','plombP','msgPrive']),
 // terrain
 FX_('chef','👷','Chef de chantier',6,'Équipe de terrain',['av','journal','rapj','implant','ferr','elecP','plombP','calculs','dqt','pointEq','stock','demandes','msgCh','msgPrive'],{d:'Dirige le chantier au quotidien et rend compte directement au gérant.'}),
 FX_('chefEq','🦺',"Chef d'équipe",7,'Équipe de terrain',['etMetier','journal','rapj','pointEq','demandes','implant','ferr','msgCh','msgPrive'],{et:T_GO}),
 FX_('macon','🧱','Maçon',8,'Équipe de terrain',['etMetier','implant','ferr','pointMoi','msgCh'],{et:T_GO}),
 FX_('ferr','🔩','Ferrailleur',8,'Équipe de terrain',['etMetier','ferr','pointMoi','msgCh'],{et:['fond','elev','dalle']}),
 FX_('coff','🪵','Coffreur',8,'Équipe de terrain',['etMetier','ferr','pointMoi','msgCh'],{et:['fond','elev','dalle']}),
 FX_('elec','💡','Électricien',8,'Équipe de terrain',['etMetier','elecP','pointMoi','msgCh'],{et:['elec','equip']}),
 FX_('techSol','🔆','Technicien solaire',8,'Équipe de terrain',['etMetier','elecP','solaire','pointMoi','msgCh'],{et:['elec','equip']}),
 FX_('plomb','🔧','Plombier',8,'Équipe de terrain',['etMetier','plombP','pointMoi','msgCh'],{et:['plomb','assain','equip']}),
 FX_('carr','🔲','Carreleur',8,'Équipe de terrain',['etMetier','pointMoi','msgCh'],{et:['carrelage']}),
 FX_('peint','🎨','Peintre',8,'Équipe de terrain',['etMetier','pointMoi','msgCh'],{et:['peint']}),
 FX_('menB','🚪','Menuisier bois',8,'Équipe de terrain',['etMetier','pointMoi','msgCh'],{et:['menExt','menInt']}),
 FX_('menA','🪟','Menuisier aluminium / métallique',8,'Équipe de terrain',['etMetier','pointMoi','msgCh'],{et:['menExt','menInt']}),
 FX_('soud','🔥','Soudeur / ferronnier',8,'Équipe de terrain',['etMetier','pointMoi','msgCh'],{et:['menInt','ext']}),
 FX_('charp','🏠','Charpentier / couvreur',8,'Équipe de terrain',['etMetier','pointMoi','msgCh'],{et:['charpente']}),
 FX_('plaf','⬜','Plafonneur / plâtrier',8,'Équipe de terrain',['etMetier','pointMoi','msgCh'],{et:['plafond','enduit']}),
 FX_('etanch','💧','Étancheur',8,'Équipe de terrain',['etMetier','pointMoi','msgCh'],{et:['soub','charpente']}),
 FX_('terr','🚜',"Terrassier / conducteur d'engins",8,'Équipe de terrain',['etMetier','implant','pointMoi','msgCh'],{et:['prep','fouilles','remblai']}),
 FX_('manoeuvre','💪','Manœuvre / ouvrier',9,'Équipe de terrain',['pointMoi','msgCh']),
 FX_('gardien','🛡️','Gardien du chantier',9,'Équipe de terrain',['pointMoi','msgCh']),
 // bureau
 FX_('secr','🗂️','Secrétaire',0,'Administration du bureau',['dossierAdm','contacts','devis','contrat','factures','rapport','msgCh','msgPrive']),
 FX_('compta','📊','Comptable',0,'Administration du bureau',['devis','contrat','factures','achats','bons','paie','tresor','msgPrive']),
 FX_('assist','📎','Assistant(e) administratif(ve)',0,'Administration du bureau',['dossierAdm','contacts','rapport','msgPrive']),
 FX_('rh','🪪','Ressources humaines',0,'Administration du bureau',['pointEq','paie','contacts','msgPrive']),
 FX_('comm','🤝','Commercial(e)',0,'Administration du bureau',['devis','contrat','rapport','contacts','msgPrive']),
 FX_('jur','⚖️','Juriste / conseiller juridique',0,'Administration du bureau',['contrat','dossierAdm','msgPrive']),
 FX_('mag','📦','Magasinier',0,'Administration du bureau',['stock','demandes','bons','achats','msgPrive']),
 FX_('achat','🛒','Acheteur / logisticien',0,'Administration du bureau',['demandes','bons','achats','stock','msgPrive']),
 FX_('chauf','🚚','Chauffeur',0,'Administration du bureau',['bons','pointMoi','msgPrive']),
 // partenaires et fournisseurs
 FX_('part','🤝','Partenaire',10,'Partenaires et fournisseurs',['etMetier','journal','msgPrive'],{d:"Entreprise ou personne associée sur une partie précise du projet : choisis les étapes concernées.",choixEt:true}),
 FX_('stt','🏢','Sous-traitant',10,'Partenaires et fournisseurs',['etMetier','journal','pointMoi','msgPrive'],{d:'Entreprise qui réalise un lot du projet : choisis les étapes concernées.',choixEt:true}),
 FX_('four','🏪','Fournisseur',11,'Partenaires et fournisseurs',['bonsFour','msgPrive'],{d:'Reçoit ses bons de commande directement dans l\'application.'})];
const FNC=k=>FONCTIONS.find(f=>f.k===k)||{k,ic:'👤',l:k,niv:8,grp:'',docs:[]};
const GRPS=['Pilotage du projet','Conception et études','Équipe de terrain','Administration du bureau','Partenaires et fournisseurs'];
const intOf=cid=>S.intervenants.filter(i=>i.chantierId===cid);
const intNom=id=>id==='gerant'?'Gérant ('+(ent().signataire||ent().nom||'entreprise')+')':((S.intervenants.find(i=>i.id===id)||{}).nom||'?');
/* supérieur par défaut : le plus proche au-dessus dans la hiérarchie du projet (les corps de métier → chef d'équipe → chef de chantier → conducteur → gérant) */
function supDefaut(cid,f){const F=FNC(f),L=intOf(cid);if(F.niv===0||F.niv<=4||F.niv>=10)return 'gerant';
  const chain=F.niv>=8?['chefEq','chef','cond']:F.niv===7?['chef','cond']:F.niv===6?['cond']:[];for(const k of chain){const p=L.find(i=>i.fonction===k&&i.actif!==false);if(p)return p.id}return 'gerant'}
/* ---------- rubrique 👥 Intervenants du projet ---------- */
function tInterv(ch){const L=intOf(ch.id),act=L.filter(i=>i.actif!==false);
  let h=`<div class="row between" style="margin-bottom:10px"><div class="sm mute">${act.length} intervenant${act.length>1?'s':''} sur ce projet</div><button class="btn small" onclick="intAjout('${ch.id}')">＋ Ajouter</button></div>`;
  const card=i=>{const F=FNC(i.fonction);return `<div class="ipc click ${i.actif===false?'off':''}" onclick="intFiche('${i.id}')"><span class="ii">${F.ic}</span><span class="im"><b>${esc(i.nom)}</b><small>${esc(F.l)}${i.societe?' · '+esc(i.societe):''}</small><small>${(i.docs||[]).length} accès · sous ${esc(intNom(i.sup||'gerant').replace(/ \(.*/,''))}</small></span></div>`};
  h+=`<div class="pyr"><div class="tier top"><div class="tl">Entreprise</div><div class="ipc"><span class="ii">${bmark()}</span><span class="im"><b>${esc(ent().signataire||'Gérant')}</b><small>Gérant · ${esc(ent().nom||'')}</small><small>Voit tout, décide des accès</small></span></div></div>`;
  NIVH.forEach(([n,l])=>{const P=act.filter(i=>FNC(i.fonction).niv===n);if(P.length)h+=`<div class="tier"><div class="tl">${n}. ${esc(l)}</div><div class="tg">${P.map(card).join('')}</div></div>`});
  h+=`</div>`;const B=act.filter(i=>FNC(i.fonction).niv===0);if(B.length)h+=`<div class="secth">Administration du bureau (sur ce projet)</div><div class="card tg">${B.map(card).join('')}</div>`;
  const O=L.filter(i=>i.actif===false);if(O.length)h+=`<details class="card"><summary class="sm">Anciens intervenants (${O.length})</summary><div class="tg" style="margin-top:8px">${O.map(card).join('')}</div></details>`;
  if(!L.length)h+=`<div class="card empty">Ajoute les personnes qui travaillent sur ce projet : client, maître d'œuvre, architecte, chef de chantier, corps de métier, partenaires, fournisseurs… Chacun ne verra que les documents que tu lui ouvres.</div>`;
  return h}
/* ---------- assistant d'ajout : 1. fonction → 2. identité → 3. documents → 4. hiérarchie et échanges ---------- */
let INT=null;
function intAjout(cid,id){const i=id?S.intervenants.find(x=>x.id===id):null;
  INT=i?{...i,docs:[...(i.docs||[])],voit:[...(i.voit||[])],ecrit:[...(i.ecrit||[])],etapes:[...(i.etapes||[])],step:2}:{chantierId:cid,step:1,docs:[],voit:[],ecrit:[],etapes:[]};intStep()}
function intStep(){const s=INT.step,F=INT.fonction?FNC(INT.fonction):null,ch=S.chantiers.find(c=>c.id===INT.chantierId)||{};
  const dots=`<div class="wsteps">${[1,2,3,4].map(n=>`<span class="${n<=s?'on':''}"></span>`).join('')}</div>`;let b='';
  if(s===1){const q=(INT.q||'').toLowerCase();b=`<h2>Quelle est sa fonction ?</h2><div class="sm mute" style="margin:-8px 0 10px">Projet : ${esc(ch.nom||'')}</div>
    <input class="srch" placeholder="🔍 Chercher une fonction (plombier, comptable…)" value="${esc(INT.q||'')}" oninput="INT.q=this.value;document.querySelectorAll('.fnb').forEach(e=>e.style.display=e.dataset.s.includes(this.value.toLowerCase())?'':'none')">
    ${GRPS.map(g=>`<div class="secth">${esc(g)}</div><div class="fng">${FONCTIONS.filter(f=>f.grp===g).map(f=>`<button class="fnb" data-s="${esc((f.l+' '+g).toLowerCase())}" style="${q&&!(f.l+' '+g).toLowerCase().includes(q)?'display:none':''}" onclick="intFonction('${f.k}')"><span>${f.ic}</span>${esc(f.l)}</button>`).join('')}</div>`).join('')}`}
  if(s===2){const E=S.employes.filter(e=>e.actif!==false),C=(S.contacts||[]);b=`<h2>${F.ic} ${esc(F.l)}</h2>${F.d?`<div class="note" style="margin:-8px 0 12px">${esc(F.d)}</div>`:''}
    <label class="f"><span>Personne déjà connue (personnel ou contact)</span><select onchange="intPick(this.value)"><option value="">— Nouvelle personne —</option><optgroup label="Personnel">${E.map(e=>`<option value="e:${e.id}" ${INT.employeId===e.id?'selected':''}>${esc(e.nom)} · ${esc(e.metier||'')}</option>`).join('')}</optgroup><optgroup label="Contacts">${C.map(c=>`<option value="c:${c.id}">${esc(c.nom)} · ${esc(c.cat||'')}</option>`).join('')}</optgroup></select></label>
    <label class="f"><span>Nom complet *</span><input id="iN" value="${esc(INT.nom||'')}"></label>
    <div class="grid2"><label class="f"><span>Téléphone</span><input id="iT" type="tel" value="${esc(INT.tel||'')}" placeholder="+237 6XX XX XX XX"></label><label class="f"><span>E-mail</span><input id="iE" type="email" value="${esc(INT.email||'')}"></label></div>
    <label class="f"><span>${F.niv>=10||F.niv<=3?'Entreprise / cabinet':'Entreprise (si sous-traitant)'}</span><input id="iS" value="${esc(INT.societe||'')}"></label>
    ${F.choixEt||F.k==='four'?'':''}`}
  if(s===3){const sel=new Set(INT.docs);b=`<h2>Accès de ${esc(INT.nom)}</h2><div class="note" style="margin:-8px 0 12px">Les documents conseillés pour « ${esc(F.l)} » sont cochés. Touche une ligne pour ouvrir ou fermer l'accès.</div>
    <div class="row" style="gap:6px;margin-bottom:8px"><button class="btn ghost small" onclick="INT.docs=[...FNC(INT.fonction).docs];intStep()">↺ Accès conseillés</button><button class="btn ghost small" onclick="INT.docs=[];intStep()">Tout retirer</button></div>
    ${PDOCS.map(([g,L])=>`<div class="dgr"><div class="dgt">${esc(g)}</div>${L.map(([k,i,l])=>`<label class="dck ${sel.has(k)?'on':''}"><input type="checkbox" ${sel.has(k)?'checked':''} onchange="intDoc('${k}',this.checked)"><span>${i}</span>${esc(l)}${F.docs.includes(k)?'<em>conseillé</em>':''}</label>`).join('')}</div>`).join('')}
    ${sel.has('etMetier')||F.choixEt?`<div class="dgr"><div class="dgt">Étapes sur lesquelles il intervient</div>${ETLIB.map(x=>`<label class="dck ${INT.etapes.includes(x.k)?'on':''}"><input type="checkbox" ${INT.etapes.includes(x.k)?'checked':''} onchange="intEt('${x.k}',this.checked)"><span>${x.ic}</span>${esc(x.nom)}</label>`).join('')}</div>`:''}`}
  if(s===4){const L=intOf(INT.chantierId).filter(i=>i.id!==INT.id&&i.actif!==false),sup=INT.sup||supDefaut(INT.chantierId,INT.fonction),sous=L.filter(i=>FNC(i.fonction).niv>F.niv||(F.niv===0&&false));
    const opt=[['gerant','Gérant (entreprise)'],...L.filter(i=>{const n=FNC(i.fonction).niv;return n>0&&n<F.niv}).sort((a,b)=>FNC(a.fonction).niv-FNC(b.fonction).niv).map(i=>[i.id,`${i.nom} · ${FNC(i.fonction).l}`])];
    b=`<h2>Place dans l'équipe</h2>
    <label class="f"><span>Travaille sous la direction de</span><select id="iSup">${opt.map(([v,l])=>`<option value="${v}" ${v===sup?'selected':''}>${esc(l)}</option>`).join('')}</select></label>
    ${L.length?`<div class="dgr"><div class="dgt">Peut suivre le travail de…</div><div class="note" style="margin:0 0 6px">Il verra ce que ces personnes voient sur ce projet (étapes, rapports, plans de leur métier).</div>
      ${L.map(i=>`<label class="dck ${INT.voit.includes(i.id)?'on':''}"><input type="checkbox" ${INT.voit.includes(i.id)?'checked':''} onchange="intArr('voit','${i.id}',this.checked)"><span>${FNC(i.fonction).ic}</span>${esc(i.nom)} · ${esc(FNC(i.fonction).l)}</label>`).join('')}</div>`:''}
    <div class="dgr"><div class="dgt">Peut écrire en privé à…</div>
      ${[['gerant','👔','Gérant (toi)'],...L.map(i=>[i.id,FNC(i.fonction).ic,i.nom+' · '+FNC(i.fonction).l])].map(([v,ic,l])=>`<label class="dck ${INT.ecrit.includes(v)?'on':''}"><input type="checkbox" ${INT.ecrit.includes(v)?'checked':''} onchange="intArr('ecrit','${v}',this.checked)"><span>${ic}</span>${esc(l)}</label>`).join('')}</div>`}
  const nav=`<div class="row" style="margin-top:12px">${s>1&&!(s===2&&INT.id)?`<button class="btn sec" onclick="intPrec()">← Retour</button>`:`<button class="btn sec" onclick="closeForm()">Annuler</button>`}${s>1?`<button class="btn" style="flex:1" onclick="intSuiv()">${s===4?(INT.id?'Enregistrer':'Ajouter au projet'):'Continuer →'}</button>`:''}</div>`;
  $('#modalRoot').innerHTML=`<div class="modal-bg" onclick="if(event.target===this)closeForm()"><div class="modal">${dots}${b}${nav}</div></div>`}
function intFonction(k){const F=FNC(k);INT.fonction=k;if(!INT.id){INT.docs=[...F.docs];INT.etapes=[...(F.et||[])];INT.sup=null;INT.voit=[];
  const L=intOf(INT.chantierId),sup=supDefaut(INT.chantierId,k);INT.ecrit=F.niv===1||F.niv===6||F.niv===0?['gerant']:[sup];
  if(['chef','cond','chefEq'].includes(k))INT.voit=L.filter(i=>FNC(i.fonction).niv>F.niv&&FNC(i.fonction).niv<10).map(i=>i.id)}INT.step=2;intStep()}
function intPick(v){if(!v)return;const[t,id]=v.split(':');const x=t==='e'?S.employes.find(e=>e.id===id):(S.contacts||[]).find(c=>c.id===id);if(!x)return;
  $('#iN').value=x.nom||'';$('#iT').value=x.tel||'';if(x.email)$('#iE').value=x.email;if(t==='e')INT.employeId=id;else INT.contactId=id}
function intDoc(k,on){INT.docs=on?[...new Set([...INT.docs,k])]:INT.docs.filter(x=>x!==k);intStep()}
function intEt(k,on){INT.etapes=on?[...new Set([...INT.etapes,k])]:INT.etapes.filter(x=>x!==k);intStep()}
function intArr(a,v,on){INT[a]=on?[...new Set([...INT[a],v])]:INT[a].filter(x=>x!==v);const e=event&&event.target&&event.target.closest('.dck');if(e)e.classList.toggle('on',on)}
function intLire(){if(INT.step===2){INT.nom=$('#iN').value.trim();INT.tel=$('#iT').value.trim();INT.email=$('#iE').value.trim();INT.societe=$('#iS').value.trim()}if(INT.step===4)INT.sup=$('#iSup').value}
function intPrec(){intLire();INT.step--;intStep()}
async function intSuiv(){intLire();if(INT.step===2&&!INT.nom){toast('Indique le nom.');return}
  if(INT.step<4){INT.step++;intStep();return}
  const {step,q,...o}=INT;o.actif=o.actif!==false;if(!o.cree)o.cree=Date.now();const id=await save('intervenants',o);closeForm();
  const F=FNC(o.fonction);toast(`${o.nom} ajouté(e) comme ${F.l} · ${o.docs.length} accès.`);
  if(o.fonction==='four'&&o.nom&&!(S.contacts||[]).some(c=>c.nom.toLowerCase()===o.nom.toLowerCase()))save('contacts',{nom:o.nom,cat:'Fournisseurs',tel:o.tel||'',email:o.email||''}).catch(()=>{})}
/* ---------- fiche d'un intervenant ---------- */
function intFiche(id){const i=S.intervenants.find(x=>x.id===id);if(!i)return;const F=FNC(i.fonction),D=i.docs||[];
  const parG=PDOCS.map(([g,L])=>{const x=L.filter(([k])=>D.includes(k));return x.length?`<div class="dgt">${esc(g)}</div><div class="pgl">${x.map(([k,ic,l])=>`<span class="chip">${ic} ${esc(l)}</span>`).join(' ')}</div>`:''}).join('');
  $('#modalRoot').innerHTML=`<div class="modal-bg" onclick="if(event.target===this)closeForm()"><div class="modal"><div class="row" style="gap:12px;margin-bottom:10px"><span class="ii big">${F.ic}</span><div><h2 style="margin:0">${esc(i.nom)}</h2><div class="sm mute">${esc(F.l)}${i.societe?' · '+esc(i.societe):''}</div></div></div>
    <div class="sm" style="margin-bottom:8px">${i.tel?'📞 '+esc(i.tel)+' · ':''}${i.email?'✉️ '+esc(i.email)+' · ':''}Sous la direction de <b>${esc(intNom(i.sup||'gerant'))}</b></div>
    ${(i.etapes||[]).length?`<div class="sm mute" style="margin-bottom:8px">Intervient sur : ${i.etapes.map(k=>(etLib(k)||{}).nom).filter(Boolean).map(esc).join(', ')}</div>`:''}
    <div class="card" style="padding:10px 12px">${parG||'<div class="sm mute">Aucun accès.</div>'}</div>
    ${(i.voit||[]).length?`<div class="sm" style="margin-bottom:6px">👁️ Suit le travail de : ${i.voit.map(intNom).map(esc).join(', ')}</div>`:''}
    <div class="sm" style="margin-bottom:12px">✉️ Peut écrire à : ${(i.ecrit||[]).map(intNom).map(esc).join(', ')||'personne'}</div>
    <div class="actgrid"><button class="actb" onclick="intAjout('${i.chantierId}','${i.id}')"><span class="ai">✏️</span><b>Modifier</b><small>Identité, accès, hiérarchie</small></button>
    <button class="actb" onclick="closeForm();ouvrirConv('${intConv(i)}')"><span class="ai">💬</span><b>Écrire</b><small>Message dans l'application</small></button>
    <button class="actb" onclick="intAppli('${i.id}')"><span class="ai">📲</span><b>Accès à l'application</b><small>Connexion avec son numéro</small></button>
    <button class="actb" onclick="intActif('${i.id}')"><span class="ai">${i.actif===false?'♻️':'⛔'}</span><b>${i.actif===false?'Réactiver':'Retirer du projet'}</b><small>${i.actif===false?'Lui rendre ses accès':'Ses accès sont coupés'}</small></button></div>
    <button class="btn sec block" style="margin-top:12px" onclick="closeForm()">Fermer</button></div></div>`}
const intConv=i=>'int:'+i.id;
async function intActif(id){const i=S.intervenants.find(x=>x.id===id);if(!i)return;if(i.actif!==false&&!confirm(`Retirer ${i.nom} de ce projet ? Ses accès seront coupés.`))return;await save('intervenants',{...i,actif:i.actif===false});closeForm();toast(i.actif===false?'Réactivé(e).':'Retiré(e) du projet.')}
function intAppli(id){const i=S.intervenants.find(x=>x.id===id);if(!i)return;
  if(typeof TEAM!=='undefined'&&TEAM.on&&TEAM.admin&&typeof formAcces==='function'){closeForm();formAcces();setTimeout(()=>{const n=$('#acN'),t=$('#acT');if(n)n.value=i.nom;if(t&&!t.disabled)t.value=i.tel||''},50);return}
  toast("L'accès à l'application se donne depuis l'application Android, Windows ou web, connectée en mode équipe.")}
/* conversations avec les intervenants dans la messagerie */
const clInt=convList;convList=function(){const C=clInt();const M={};S.messages.forEach(m=>{const k=convOf(m);(M[k]=M[k]||[]).push(m)});
  S.intervenants.filter(i=>i.actif!==false).forEach(i=>{const id=intConv(i),ch=S.chantiers.find(c=>c.id===i.chantierId)||{},L=(M[id]||[]).sort((a,b)=>num(a.ts)-num(b.ts));
    C.push({id,ic:FNC(i.fonction).ic,nom:i.nom,sub:FNC(i.fonction).l+' · '+(ch.nom||''),cid:null,last:L[L.length-1],n:L.length,nonlus:L.filter(m=>m.uid!==myUid()&&num(m.ts)>num(lsG('ge_lu_'+id,'0'))).length})});
  return C.sort((a,b)=>(b.last?num(b.last.ts):0)-(a.last?num(a.last.ts):0))};
/* ---------- bons de commande → fournisseur, dans l'application ---------- */
const beInt=bonEditor;bonEditor=function(ch,b){const h=beInt(ch,b),F=S.intervenants.filter(i=>i.fonction==='four'&&i.actif!==false),cur=F.find(i=>i.id===b.fournId)||F.find(i=>i.nom.toLowerCase()===String(b.fournisseur||'').toLowerCase());
  const env=b.envoi?`<div class="sm" style="margin-top:6px">✅ Envoyé à <b>${esc(intNom(b.envoi.a))}</b> le ${dfr(b.envoi.date)}${b.envoi.lu?' · lu':''}</div>`:'';
  return `<div class="card fsend"><div class="row between"><b>📤 Envoyer au fournisseur</b>${b.envoi?chip('Envoyé','ok'):''}</div>
    ${F.length?`<div class="row" style="gap:6px;margin-top:8px"><select id="bfF" class="cin" style="flex:1">${F.map(i=>`<option value="${i.id}" ${cur&&cur.id===i.id?'selected':''}>${esc(i.nom)}${i.chantierId!==ch.id?' (autre projet)':''}</option>`).join('')}</select><button class="btn small" onclick="bonEnvoyer('${b.id}',$('#bfF').value)">Envoyer</button></div>`
      :`<div class="sm mute" style="margin-top:6px">Ajoute ce fournisseur dans 👥 Intervenants (fonction « Fournisseur ») pour lui envoyer ses bons dans l'application.</div><button class="btn sec small" style="margin-top:8px" onclick="intAjout('${ch.id}');setTimeout(()=>intFonction('four'),30)">＋ Ajouter un fournisseur</button>`}
    ${env}<button class="btn ghost small" style="margin-top:6px" onclick="partager({titre:${esc(JSON.stringify('Bon de commande '+(b.numero||'')))},texte:bonTexte(S.bons.find(x=>x.id==='${b.id}'))})">↗️ Ou partager (WhatsApp, e-mail…)</button></div>`+h};
function bonTexte(b){const t=totL(b.lignes),ch=S.chantiers.find(c=>c.id===b.chantierId)||{};
  return `🧾 Bon de commande ${b.numero||''} — ${ent().nom||''}\nChantier : ${ch.nom||''}${b.livraisonLieu?'\nLivraison : '+b.livraisonLieu:''}${b.livraisonDate?' le '+dfr(b.livraisonDate):''}\n\n`+
    (b.lignes||[]).map(l=>`• ${l.designation} : ${N(num(l.qte))} ${l.unite||''}${num(l.pu)?' × '+F(num(l.pu)):''}`).join('\n')+`\n\nTotal : ${F(t)}${b.notes?'\n\n'+b.notes:''}`}
async function bonEnvoyer(bid,iid){const b=S.bons.find(x=>x.id===bid),i=S.intervenants.find(x=>x.id===iid);if(!b||!i)return;
  await save('messages',{conv:intConv(i),chantierId:'_dm',membres:['gerant',i.id],texte:bonTexte(b),bonId:b.id,uid:myUid(),auteur:myNom(),date:today(),ts:Date.now()});
  await save('bons',{...b,fournId:i.id,fournisseur:b.fournisseur||i.nom,fournTel:b.fournTel||i.tel||'',envoi:{a:i.id,date:today(),ts:Date.now()}});
  toast(`Bon ${b.numero||''} envoyé à ${i.nom} dans l'application.`)}
/* ---------- branchements ---------- */
TABS.interv='Intervenants';TABL.interv='Intervenants';{const r=RUBS.find(x=>x.k==='equipe');if(r&&!r.tabs.includes('interv'))r.tabs.unshift('interv')}
const tfInt=tabsFor;tabsFor=function(t,ch){const o=tfInt(t,ch);return o&&Object.keys(o).length?{interv:'Intervenants',...o}:o};
const vcInt=viewChantier;viewChantier=function(ch){if(ui.tab!=='interv')return vcInt(ch);const TB=tabsFor(typ(ch),ch);if(!TB.interv)return vcInt(ch);return rubHead(ch)+bottomNav(ch)+tInterv(ch)};
const stInt=document.createElement('style');stInt.textContent=`.pyr{position:relative;display:flex;flex-direction:column;gap:10px;margin-bottom:14px}
.tier{position:relative;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:10px 12px;box-shadow:var(--shadow)}.tier.top{border-color:var(--acc);background:var(--acc2)}.tier .im b{color:var(--ink)}
.tier:not(:last-child)::after{content:'';position:absolute;left:50%;bottom:-11px;width:2px;height:10px;background:var(--line)}
.tl{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--mute);margin-bottom:6px}
.tg{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px}
.ipc{display:flex;gap:10px;align-items:center;padding:6px;border-radius:12px}.ipc.click:hover{background:var(--acc2)}.ipc.off{opacity:.5}
.ii{width:40px;height:40px;border-radius:12px;background:var(--acc2);display:grid;place-items:center;font-size:20px;flex:none}.ii .bmark{width:40px;height:40px;font-size:15px}.ii.big{width:52px;height:52px;font-size:26px}
.im{display:flex;flex-direction:column;min-width:0}.im b{font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.im small{font-size:11.5px;color:var(--mute)}
.fng{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px}.fnb{display:flex;align-items:center;gap:8px;text-align:left;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:12px;padding:9px 10px;font-size:13px;font-weight:600}.fnb span{font-size:18px}.fnb:hover{border-color:var(--acc)}
.dgr{margin-bottom:10px}.dgt{font-size:11.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--mute);margin:10px 0 4px}
.dck{display:flex;align-items:center;gap:10px;padding:9px 10px;border:1px solid var(--line);border-radius:12px;margin-bottom:5px;font-size:14px;cursor:pointer;background:var(--card)}.dck.on{border-color:var(--acc);background:var(--acc2)}.dck input{width:18px;height:18px;accent-color:var(--acc);flex:none}
.dck em{margin-left:auto;font-style:normal;font-size:10.5px;font-weight:700;color:var(--ok);background:var(--okbg);padding:2px 7px;border-radius:10px}
.fsend{border-color:var(--acc)}`;document.head.appendChild(stInt);
