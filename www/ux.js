/* ux.js — navigation simplifiée (5 rubriques), bouton ➕ d'actions, guide de démarrage, aide par rubrique */
const RUBS=[
  {k:'apercu',ic:'🏠',l:'Aperçu',tabs:['apercu'],aide:"Le résumé du chantier : avancement, budget, argent reçu et dépensé, et les alertes (paiements en retard, budget dépassé). Commence ta journée ici."},
  {k:'travaux',ic:'🧱',l:'Travaux',tabs:['etapes','journal','calculs','graphes'],aide:"Étapes : les phases du chantier (fondations, élévation…) avec leur avancement. Journal : ce qui s'est passé chaque jour, avec photos. Calculs : quantités de béton, parpaings, carrelage. Graphiques : l'évolution du chantier."},
  {k:'mat',ic:'📦',l:'Matériaux',tabs:['achats','stock','commandes'],aide:"Achats : chaque dépense de matériaux avec son reçu. Stock : ce qui entre et sort du magasin, et ce qui reste. Bons de commande : les commandes aux fournisseurs et leur paiement."},
  {k:'equipe',ic:'👷',l:'Équipe',tabs:['equipe','paie'],aide:"Équipe : les ouvriers du chantier, leur poste et leur taux. Paie : les présences et les paiements de chacun."},
  {k:'argent',ic:'💰',l:'Argent',tabs:['devis','contrat','recus','rapport'],aide:"Devis : le prix proposé au client (avec l'assistant de devis). Contrat : le contrat signé. Reçus : l'argent reçu du client. Rapport : le bilan à envoyer au client ou à garder."}];
const TABL={apercu:'Aperçu',etapes:'Étapes',journal:'Journal',calculs:'Calculs',graphes:'Graphiques',achats:'Achats',stock:'Stock',commandes:'Bons de commande',equipe:'Ouvriers',paie:'Paie',devis:'Devis',contrat:'Contrat',recus:'Reçus du client',rapport:'Rapports'};
ui.rLast=ui.rLast||{};
const rubOf=t=>RUBS.find(r=>r.tabs.includes(t))||RUBS[0];
function rubGo(k){const r=RUBS.find(x=>x.k===k),TB=tabsFor(typ(ui.cid),S.chantiers.find(c=>c.id===ui.cid)),av=r.tabs.filter(t=>TB[t]);ui.tab=ui.rLast[k]&&av.includes(ui.rLast[k])?ui.rLast[k]:av[0];ui.devisId=null;ui.bonId=null;ui.aide=false;window.scrollTo(0,0);render()}
function subGo(t){ui.rLast[rubOf(t).k]=t;setTab(t)}
/* en-tête de rubrique + sous-onglets */
function rubHead(ch){const TB=tabsFor(typ(ch),ch),r=rubOf(ui.tab),av=r.tabs.filter(t=>TB[t]);ui.rLast[r.k]=ui.tab;
  return `<div class="rhead"><div class="rtitle">${r.ic} ${r.l}</div><button class="btn ghost small" onclick="ui.aide=!ui.aide;render()">❓ Aide</button></div>`+
    (ui.aide?`<div class="note aidebox">${esc(r.aide)}</div>`:'')+
    (av.length>1?`<div class="seg subtabs">${av.map(t=>`<button class="${ui.tab===t?'on':''}" onclick="subGo('${t}')">${esc(t==='devis'&&TB[t]!=='Devis'?TB[t]:TABL[t]||TB[t])}</button>`).join('')}</div>`:'')}
/* barre du bas */
function bottomNav(ch){const TB=tabsFor(typ(ch),ch),cur=rubOf(ui.tab).k,L=RUBS.filter(r=>r.tabs.some(t=>TB[t]));
  return `<nav class="bnav">${L.map(r=>`<button class="${r.k===cur?'on':''}" onclick="rubGo('${r.k}')"><span class="bi">${r.ic}</span><span>${r.l}</span></button>`).join('')}</nav><button class="fab" onclick="actSheet()" title="Ajouter">＋</button>`}
/* bouton ➕ : les actions du chantier en gros boutons */
function actSheet(){const ch=S.chantiers.find(c=>c.id===ui.cid);if(!ch)return;const t=typ(ch),cle=t==='cle'||t==='travaux';
  const A=[cle&&['🧾','Bon de commande','Commander des matériaux à un fournisseur',"bonRapide()"],cle&&['🛒','Achat','Enregistrer une dépense avec son reçu',"formAchat()"],t==='cle'&&['📝','Sorties du jour','Matériaux utilisés aujourd\'hui',"ui.tab='stock';ui.stockVue='mat';render();setTimeout(formSorties,50)"],
    ['💵','Reçu de paiement','Argent reçu du client',"formRecu()"],cle&&['📓','Journal du jour','Ce qui s\'est passé, avec photos',"formJournal()"],cle&&['👷','Ouvrier','Ajouter quelqu\'un à l\'équipe',"ui.tab='equipe';render();setTimeout(()=>typeof formEmploye==='function'&&formEmploye(),50)"]].filter(Boolean);
  $('#modalRoot').innerHTML=`<div class="modal-bg" onclick="if(event.target===this)closeForm()"><div class="modal sheet"><h2>Ajouter</h2><div class="actgrid">${A.map(([i,l,d,f])=>`<button class="actb" onclick="closeForm();${f}"><span class="ai">${i}</span><b>${l}</b><small>${d}</small></button>`).join('')}</div><button class="btn sec block" style="margin-top:12px" onclick="closeForm()">Fermer</button></div></div>`}
/* guide de démarrage en 3 étapes */
function guideCard(){let hide=false;try{hide=localStorage.getItem('cp_guideHide')==='1'}catch(e){}const E=ent(),c1=!!E.nom,c2=S.chantiers.length>0,c3=S.devis.length>0;if(hide||(c1&&c2&&c3))return'';
  const first=[...S.chantiers].sort((a,b)=>num(b.cree)-num(a.cree))[0];
  const st=[[c1,'Ton entreprise','Nom, logo, téléphone : ils s\'affichent sur tes devis, reçus et bons.','formReglages()','Remplir'],[c2,'Ton premier chantier','Le nom, le lieu et le client du projet.','formChantier()','Créer'],[c3,'Ton premier devis','L\'assistant calcule les quantités et les prix à partir de ton plan.',first?`openCh('${first.id}');rubGo('argent');ui.tab='devis';render()`:'formChantier()','Commencer']];
  const n=st.filter(x=>x[0]).length;
  return `<div class="card guide"><div class="row between"><h3 style="margin:0">👋 Bien démarrer (${n}/3)</h3><button class="btn ghost small" onclick="try{localStorage.setItem('cp_guideHide','1')}catch(e){};render()">Masquer</button></div>
    ${st.map(([ok,t,d,f,b],i)=>`<div class="gstep ${ok?'ok':''}"><div class="gnum">${ok?'✓':i+1}</div><div class="gtx"><b>${t}</b><small>${d}</small></div>${ok?'':`<button class="btn small" onclick="${f}">${b}</button>`}</div>`).join('')}</div>`}
