/* etapes2.js — étapes détaillées en sous-étapes pondérées : bibliothèque d'étapes (ajout une par une),
   avancement calculé automatiquement, proposition de l'étape suivante quand une étape est terminée */
/* ordre chronologique d'un chantier de bâtiment (de l'ouverture à la remise des clés) — chaque tâche n'appartient qu'à une seule étape.
   Sources : DAO publics camerounais (installation → terrassement → fondation → élévation → charpente-couverture-plafond → revêtements),
   devis gros œuvre de Douala (implantation → fouilles → béton de propreté → semelles → amorces → chaînage bas → maçonnerie),
   coordination second œuvre (gaines et réseaux encastrés avant enduits/plafonds ; menuiseries extérieures avant enduits extérieurs ;
   chapes et carrelage, puis menuiseries intérieures, peinture, et enfin pose des équipements). par:true = peut se faire en parallèle. */
const ETLIB=[
 {k:'etudes',ic:'📐',nom:'Études, plans & autorisations',kw:/[ée]tude|\bplans?\b|permis|autoris/,suiv:['install'],sous:[['Levé topographique du terrain',10],['Étude géotechnique (sol)',15],['Plans architecturaux',25],['Étude de structure (béton armé)',20],['Dossier et dépôt du permis de bâtir',15],['Permis de bâtir obtenu',15]]},
 {k:'install',ic:'🚧',nom:'Installation de chantier',kw:/installation/,suiv:['prep'],sous:[['Clôture provisoire et panneau de chantier',25],['Magasin / abri des matériaux',25],["Point d'eau du chantier",25],['Électricité de chantier',25]]},
 {k:'prep',ic:'🌿',nom:'Préparation du terrain & implantation',kw:/prepar|prépar|implantation|desherb|désherb|debrouss|débrouss/,suiv:['fouilles'],sous:[['Débroussaillage et désherbage',25],['Décapage de la terre végétale',20],['Nivellement de la plateforme',15],['Implantation (chaises, cordeaux, axes)',40]]},
 {k:'fouilles',ic:'⛏️',nom:'Terrassements : fouilles',kw:/fouille|terrassement/,suiv:['fond'],sous:[['Fouilles en puits (semelles isolées)',50],['Fouilles en rigole (semelles filantes)',35],['Évacuation et stockage des déblais',15]]},
 {k:'fond',ic:'🧱',nom:'Fondations',kw:/fondation|semelle/,suiv:['soub'],sous:[['Béton de propreté',12],['Ferraillage des semelles',20],['Coulage des semelles',18],['Amorces de poteaux',20],['Longrines / chaînage bas',30]]},
 {k:'soub',ic:'🧱',nom:'Soubassement & étanchéité',kw:/soubassement/,suiv:['remblai'],sous:[['Maçonnerie de soubassement (parpaings pleins)',55],['Étanchéité du soubassement (enduit hydrofuge)',25],['Réservations des évacuations',20]]},
 {k:'remblai',ic:'🚜',nom:'Remblai & traitement anti-termite',kw:/remblai|termite/,suiv:['dallage'],sous:[['Remblai compacté par couches',55],['Traitement anti-termite du sol',25],['Canalisations sous dallage',20]]},
 {k:'dallage',ic:'⬛',nom:'Dallage (plancher bas)',kw:/dallage|plancher bas|capillaire/,suiv:['elev'],sous:[['Hérisson / tout-venant compacté',25],['Film polyane anti-humidité',15],['Treillis soudé',20],['Coulage du dallage',40]]},
 {k:'elev',ic:'🏗️',nom:'Élévation des murs, poteaux & chaînages',kw:/elevation|élévation|mur|poteau|chainage|chaînage/,suiv:['dalle','charpente'],niv:true,sous:[["Maçonnerie jusqu'aux appuis de fenêtres",25],['Poteaux (ferraillage, coffrage, coulage)',20],['Linteaux et appuis',15],["Maçonnerie jusqu'au chaînage haut",20],['Chaînage haut / poutres',20]],note:'Une fois par niveau (RDC, R+1…).'},
 {k:'dalle',ic:'🧮',nom:'Plancher haut, dalle & escalier',kw:/dalle|plancher|escalier|hourdis/,suiv:['elev','charpente'],niv:true,sous:[['Coffrage et étaiement',20],['Poutrelles et hourdis',20],['Ferraillage de la dalle et réservations',20],['Coulage de la dalle',25],['Escalier',15]],note:'Une fois par niveau (R+1, R+2…).'},
 {k:'charpente',ic:'🏠',nom:'Charpente & couverture (mise hors d\'eau)',kw:/charpente|couverture|toiture/,suiv:['menExt'],sous:[['Charpente (bois ou métal)',45],['Couverture (tôles, faîtières)',40],['Gouttières et descentes',15]]},
 {k:'menExt',ic:'🪟',nom:'Menuiseries extérieures (mise hors d\'air)',kw:/menuiseries? ext|fenetre|fenêtre|vitr/,suiv:['elec','plomb'],sous:[['Cadres et précadres',30],['Fenêtres et portes extérieures',50],['Grilles de protection',20]]},
 {k:'elec',ic:'⚡',nom:'Électricité : gaines et câblage (NF C 15-100)',kw:/electri|électri/,suiv:['plomb','enduit'],sous:[['Saignées et réservations',20],['Gaines et boîtes encastrées',30],['Tableau et mise à la terre',25],['Tirage des câbles',25]]},
 {k:'plomb',ic:'🚰',nom:'Plomberie : réseaux encastrés',kw:/plomberie|sanitaire/,suiv:['enduit'],sous:[["Réseau d'alimentation en eau",45],['Évacuations des eaux usées et vannes',40],["Essais de pression et d'étanchéité",15]]},
 {k:'enduit',ic:'🪣',nom:'Enduits intérieurs & extérieurs',kw:/enduit|crépi/,suiv:['plafond','assain'],sous:[['Enduits intérieurs',50],['Enduits extérieurs',50]]},
 {k:'plafond',ic:'⬜',nom:'Plafonds / faux plafonds',kw:/plafond/,suiv:['carrelage'],sous:[['Ossature',40],['Pose des plaques',45],['Joints et finitions',15]]},
 {k:'assain',ic:'🕳️',nom:'Assainissement : fosse, regards, puisard',kw:/assainissement|fosse|regard|puisard/,suiv:['carrelage'],par:true,sous:[['Regards de visite',25],['Fosse septique',40],['Puisard / puits perdu',25],['Raccordements',10]]},
 {k:'carrelage',ic:'🔲',nom:'Chapes, carrelage & faïence',kw:/chape|carrel|faience|faïence/,suiv:['menInt'],sous:[['Chapes',30],['Carrelage des sols',45],['Faïence murale',25]]},
 {k:'menInt',ic:'🚪',nom:'Menuiseries intérieures & ferronnerie',kw:/menuiseries? int|porte|placard|ferronn/,suiv:['peint'],sous:[['Portes intérieures',40],['Placards et rangements',20],['Garde-corps et ferronnerie',40]]},
 {k:'peint',ic:'🎨',nom:'Peinture',kw:/peinture|finition/,suiv:['equip'],sous:[['Enduit de lissage et impression',40],['Peinture intérieure',35],['Peinture extérieure',25]]},
 {k:'equip',ic:'🚿',nom:'Équipements : sanitaires et appareillage électrique',kw:/equipement|équipement|appareillage/,suiv:['ext'],sous:[['WC, lavabos et douches',40],['Robinetterie',15],['Prises, interrupteurs et luminaires',35],['Raccordement des compteurs (ENEO, CAMWATER)',10]]},
 {k:'ext',ic:'🌳',nom:'Aménagements extérieurs',kw:/exterieur|extérieur|amenagement|aménagement|pieds de murs/,suiv:['recep'],par:true,sous:[['Trottoir et protection des pieds de murs',35],['Clôture définitive et portail',35],['Caniveaux et drainage',15],['Pavage / espaces verts',15]]},
 {k:'recep',ic:'🔑',nom:'Réception & remise des clés',kw:/reception|réception|nettoyage|cles|clés/,suiv:[],sous:[['Essais des réseaux',25],['Nettoyage final',20],['Levée des réserves',30],['Réception et remise des clés',25]]}];
const etLib=k=>ETLIB.find(x=>x.k===k);
function etMatch(nom){const n=String(nom||'').toLowerCase();for(const x of ETLIB)if(n===x.nom.toLowerCase())return x;
  for(const [r,k] of [[/plancher bas|dallage/,'dallage'],[/am[ée]nagement|pieds de murs/,'ext'],[/menuiseries? int/,'menInt'],[/plancher|dalles?\b|hourdis/,'dalle']])if(r.test(n))return etLib(k);for(const x of ETLIB)if(x.kw.test(n))return x;return null}
/* clé d'ordre chronologique : position dans la bibliothèque ; élévation et dalle alternent par niveau (RDC, dalle R+1, R+1, dalle R+2…) */
function etNiv(e){const m=String(e.nom||'').match(/—\s*(RDC|R\+(\d+))\s*$/);if(!m)return 1;const x=etLib(e.lib)||etMatch(e.nom)||{};return m[1]==='RDC'?1:x.k==='dalle'?+m[2]:+m[2]+1}
function etKey(e){const x=etLib(e.lib)||etMatch(e.nom);if(!x)return num(e.ordre)||99;const i=ETLIB.indexOf(x)+1;if(!x.niv)return i;const n=etNiv(e),b=ETLIB.findIndex(z=>z.k==='elev')+1;return b+(n-1)*0.2+(x.k==='dalle'?0.1:0)}
const etTri=L=>[...L].sort((a,b)=>etKey(a)-etKey(b)||num(a.cree)-num(b.cree));
const sousDe=x=>x.sous.map(([nom,poids])=>({id:uid(),nom,poids,fait:false}));
const avSous=L=>{const t=sum(L,s=>num(s.poids)||1);return t?Math.round(sum(L.filter(s=>s.fait),s=>num(s.poids)||1)/t*1000)/10:0};
/* ---------- ajouter une étape depuis la bibliothèque ---------- */
function etPicker(){const cid=ui.cid,deja=new Set(etapesOf(cid).map(e=>e.lib||(etMatch(e.nom)||{}).k)),cons=(ETLIB.find(x=>!x.par&&!deja.has(x.k))||{}).k;
  $('#modalRoot').innerHTML=`<div class="modal-bg" onclick="if(event.target===this)closeForm()"><div class="modal"><h2>Ajouter une étape</h2>
    <div class="note" style="margin:-6px 0 12px">Touche une étape pour l'ajouter. Elle arrive avec ses sous-étapes : coche-les au fur et à mesure, l'avancement se calcule tout seul.</div>
    <div class="etp">${ETLIB.map((x,i)=>{const d=deja.has(x.k)&&!x.niv;return `<button class="${d?'deja':''} ${x.k===cons?'cons':''}" onclick="etAjouter('${x.k}')"><span class="ei">${x.ic}</span><span class="em"><b>${i+1}. ${esc(x.nom)}${x.k===cons?' <span class="chip ok">Conseillée</span>':''}</b><small>${x.sous.length} sous-étapes${d?' · déjà ajoutée':''}${x.par?' · peut se faire en parallèle':''}${x.note?' · '+esc(x.note):''}</small></span><span class="ea">${d?'✓':'＋'}</span></button>`}).join('')}</div>
    <button class="btn sec block" style="margin-top:12px" onclick="closeForm();formEtape()">✏️ Créer une étape personnalisée</button>
    <button class="btn ghost block" style="margin-top:4px" onclick="closeForm()">Fermer</button></div></div>`}
async function etAjouter(k,ouvrir=true){const x=etLib(k),cid=ui.cid,L=etapesOf(cid);if(!x)return;
  if(L.some(e=>(e.lib||(etMatch(e.nom)||{}).k)===k)&&!x.niv&&!confirm(`« ${x.nom} » est déjà dans ce chantier. L'ajouter encore ?`))return;
  const niv=x.niv?L.filter(e=>(e.lib||(etMatch(e.nom)||{}).k)===k).length+1:0;const NV=n=>k==='dalle'?'R+'+n:(n===1?'RDC':'R+'+(n-1));
    const nom=x.nom+(niv?` — ${NV(niv)}`:''),id=await save('etapes',{chantierId:cid,nom,lib:k,ordre:etKey({lib:k,nom}),statut:'afaire',avancement:0,budget:'',sous:sousDe(x)});
  closeForm();if(ouvrir){ui.etOpen=id;ui.tab='etapes';render();setTimeout(()=>{const e=document.getElementById('et_'+id);e&&e.scrollIntoView({behavior:'smooth',block:'center'})},120)}toast(`« ${x.nom} » ajoutée avec ${x.sous.length} sous-étapes.`)}
/* ---------- cocher une sous-étape ---------- */
function etAvant(e){const x=etLib(e.lib)||etMatch(e.nom);if(x&&x.par)return[];const k=etKey(e);return etapesOf(e.chantierId).filter(z=>z.id!==e.id&&etKey(z)<k&&z.statut!=='fini'&&!((etLib(z.lib)||etMatch(z.nom)||{}).par))}
async function sousToggle(eid,sid){const e=S.etapes.find(x=>x.id===eid);if(!e)return;const z0=(e.sous||[]).find(z=>z.id===sid);
  if(z0&&!z0.fait){const A=etTri(etAvant(e));if(A.length&&!confirm(`Attention : « ${A[0].nom} »${A.length>1?` (et ${A.length-1} autre${A.length>2?'s':''})`:''} n'est pas encore terminée. Elle se fait normalement avant « ${e.nom} ».\n\nMarquer quand même « ${z0.nom} » comme terminée ?`))return}const L=(e.sous||[]).map(s=>s.id===sid?{...s,fait:!s.fait,date:!s.fait?today():''}:s);await sousMaj(e,L,L.find(s=>s.id===sid))}
async function sousMaj(e,L,chg){const old=num(e.avancement),v=avSous(L),st=v>=100?'fini':v>0?'cours':'afaire';
  await save('etapes',{...e,sous:L,avancement:v,statut:st,debut:v>0&&!e.debut?today():e.debut,fin:st==='fini'?(e.fin||today()):''});
  if(chg)log(e.chantierId,`${e.nom} · ${chg.nom} : ${chg.fait?'terminé':'rouvert'} (étape à ${Math.round(v)} %)`,{etapeId:e.id,av:v});
  if(st==='fini'&&old<100)setTimeout(()=>etSuivante(e),250)}
function etSuivante(e){const x=etLib(e.lib)||etMatch(e.nom),cid=e.chantierId,deja=new Set(etapesOf(cid).map(z=>z.lib||(etMatch(z.nom)||{}).k));
  const P=(x?x.suiv:[]).map(etLib).filter(Boolean),fini=etapesOf(cid).every(z=>z.statut==='fini');
  $('#modalRoot').innerHTML=`<div class="modal-bg" onclick="if(event.target===this)closeForm()"><div class="modal sheet"><div class="celeb">🎉</div><h2 style="text-align:center">« ${esc(e.nom)} » est terminée</h2>
    ${P.length?`<div class="sm mute" style="text-align:center;margin-bottom:12px">Quelle étape commence ensuite ?</div><div class="etp">${P.map(y=>{const d=deja.has(y.k)&&!y.niv;return `<button onclick="${d?`closeForm();ui.etOpen=(etapesOf('${cid}').find(z=>(z.lib||(etMatch(z.nom)||{}).k)==='${y.k}')||{}).id;render()`:`etAjouter('${y.k}')`}"><span class="ei">${y.ic}</span><span class="em"><b>${esc(y.nom)}</b><small>${d?'Déjà dans le chantier : l\'ouvrir':y.sous.length+' sous-étapes'}</small></span><span class="ea">${d?'→':'＋'}</span></button>`}).join('')}</div>`
      :`<div class="sm" style="text-align:center;margin-bottom:12px">${fini?'Toutes les étapes du chantier sont terminées. Pense au rapport final et à la réception.':'Continue avec les étapes restantes.'}</div>`}
    <button class="btn sec block" style="margin-top:12px" onclick="closeForm();etPicker()">Voir toutes les étapes</button><button class="btn ghost block" style="margin-top:4px" onclick="closeForm()">Plus tard</button></div></div>`}
/* détailler une étape existante (créée avant, ou depuis un devis) */
async function etDetailler(eid){const e=S.etapes.find(x=>x.id===eid),x=e&&etMatch(e.nom);if(!x)return;const L=sousDe(x),a=num(e.avancement);
  if(a>0){let acc=0;const T=sum(L,s=>s.poids);for(const s of L){if((acc+s.poids)/T*100<=a+0.01){s.fait=true;s.date=e.fin||today();acc+=s.poids}else break}}
  await save('etapes',{...e,lib:x.k,sous:L,avancement:a>=100?100:avSous(L)});ui.etOpen=eid;toast('Sous-étapes ajoutées.')}
function sousAjout(eid){const e=S.etapes.find(x=>x.id===eid);if(!e)return;
  openForm({title:'Nouvelle sous-étape',fields:[{k:'nom',label:'Nom de la sous-étape',req:true},{k:'poids',label:"Poids dans l'étape (%)",type:'number',ph:'ex. 10'}],
    onSave:async o=>{if(!o.nom)return false;const L=[...(e.sous||[]),{id:uid(),nom:o.nom,poids:num(o.poids)||Math.round(100/Math.max(1,(e.sous||[]).length)),fait:false}];await sousMaj(e,L)}})}
function sousEdit(eid,sid){const e=S.etapes.find(x=>x.id===eid),s=e&&(e.sous||[]).find(z=>z.id===sid);if(!s)return;
  openForm({title:'Modifier la sous-étape',values:s,fields:[{k:'nom',label:'Nom',req:true},{k:'poids',label:"Poids dans l'étape (%)",type:'number'}],
    onSave:async o=>{await sousMaj(e,e.sous.map(z=>z.id===sid?{...z,nom:o.nom,poids:num(o.poids)||z.poids}:z))},
    onDelete:async()=>{await sousMaj(e,e.sous.filter(z=>z.id!==sid))}})}
/* bouton « ✓ Terminée » : coche toutes les sous-étapes */
const avance0=avance;avance=async function(id,delta){const e=S.etapes.find(x=>x.id===id);
  if(e&&e.sous&&e.sous.length){if(delta===100){const L=e.sous.map(s=>s.fait?s:{...s,fait:true,date:today()});await sousMaj(e,L,{nom:'toutes les sous-étapes',fait:true});}return}
  const old=e?num(e.avancement):0;await avance0(id,delta);const n=S.etapes.find(x=>x.id===id);if(n&&num(n.avancement)>=100&&old<100)setTimeout(()=>etSuivante(n),250)};
async function etReordonner(cid){for(const e of etapesOf(cid)){const k=etKey(e),x=etLib(e.lib)||etMatch(e.nom);if(x&&Math.abs(num(e.ordre)-k)>0.001)await save('etapes',{...e,ordre:k,lib:e.lib||x.k})}toast('Étapes rangées dans l\'ordre chronologique.')}
/* ---------- affichage ---------- */
tEtapes=function(ch,s){const ets=etTri(s.ets),fin=ets.filter(e=>e.statut==='fini').length;
  let h=`<div class="card etsum"><div class="row between"><div><div class="sm mute">Avancement du projet</div><div class="etbig">${Math.round(s.av)} %</div><div class="sm mute">${fin}/${ets.length} étape${ets.length>1?'s':''} terminée${fin>1?'s':''}</div></div>
    <button class="btn" onclick="etPicker()">＋ Étape</button></div>${ets.some(e=>Math.abs(num(e.ordre)-etKey(e))>0.001&&(etLib(e.lib)||etMatch(e.nom)))?`<button class="btn ghost small" style="margin-top:6px" onclick="etReordonner('${ch.id}')">↕️ Ranger dans l'ordre du chantier</button>`:''}<div class="bar ok" style="margin-top:10px;height:10px"><i style="width:${Math.min(100,s.av)}%"></i></div></div>`;
  if(!ets.length)return h+`<div class="card empty">Aucune étape pour l'instant.<br><br><button class="btn" onclick="etPicker()">Choisir la première étape</button><br><br><button class="btn ghost small" onclick="ajouterEtapesTypes('${ch.id}')">ou ajouter toutes les étapes d'un coup</button></div>`;
  const cour=ets.find(e=>e.statut!=='fini');if(ui.etOpen===undefined&&cour)ui.etOpen=cour.id;
  ets.forEach(e=>{const st=e.statut||'afaire',L=e.sous||[],op=ui.etOpen===e.id,x=etMatch(e.nom),a=num(e.avancement),bx=budgetEtape(e.chantierId,e.id),d=depEtape(e.id),b=num(e.budget);
    h+=`<div class="card etc ${st}" id="et_${e.id}"><div class="eth click" onclick="ui.etOpen=ui.etOpen==='${e.id}'?null:'${e.id}';render()">
      <span class="eti">${st==='fini'?'✓':(etLib(e.lib)||x||{ic:'•'}).ic}</span><div class="etm"><div class="row between"><b>${esc(e.nom)}</b><span class="pct">${Math.round(a)} %</span></div>
      <div class="bar ok" style="margin-top:6px"><i style="width:${a}%"></i></div>
      <div class="s">${L.length?`${L.filter(z=>z.fait).length}/${L.length} sous-étapes · `:''}${bx&&(bx.bMat||bx.bMO)?`reste ${F(bx.resteMat+bx.resteMO)}`:`${F(d)} dépensés${b>0?' / '+F(b):''}`}${e.debut?' · '+dfr(e.debut):''}${e.fin&&st==='fini'?' → '+dfr(e.fin):''}</div></div><span class="etv">${op?'▾':'▸'}</span></div>`;
    if(op){if(L.length)h+=`<div class="sous">${L.map(z=>`<div class="so ${z.fait?'ok':''}"><button class="sck" onclick="sousToggle('${e.id}','${z.id}')" aria-label="Terminé">${z.fait?'✓':''}</button>
        <div class="sm1 click" onclick="sousToggle('${e.id}','${z.id}')"><span>${esc(z.nom)}</span><small>${N(num(z.poids),0)} % de l'étape${z.fait&&z.date?' · fait le '+dfr(z.date):''}</small></div><button class="btn ghost small" onclick="sousEdit('${e.id}','${z.id}')">✏️</button></div>`).join('')}
        <button class="btn ghost small" onclick="sousAjout('${e.id}')">＋ Sous-étape</button></div>`;
      else h+=`<div class="sous">${x?`<button class="btn sec small" onclick="etDetailler('${e.id}')">🧩 Détailler en ${x.sous.length} sous-étapes</button>`:`<button class="btn sec small" onclick="sousAjout('${e.id}')">＋ Ajouter des sous-étapes</button>`}
        <div class="qbtns"><button class="btn sec small" onclick="avance('${e.id}',-10)">−10 %</button><button class="btn sec small" onclick="avance('${e.id}',10)">+10 %</button></div></div>`;
      h+=`<div class="qbtns" style="margin-top:8px">${st!=='fini'?`<button class="btn small" onclick="avance('${e.id}',100)">✓ Étape terminée</button>`:`<button class="btn sec small" onclick="etSuivante(S.etapes.find(z=>z.id==='${e.id}'))">➡️ Étape suivante</button>`}
        <button class="btn sec small" onclick="formEtape('${e.id}')">✏️ Modifier</button>${delBtn('etapes',e.id)}</div>`}
    h+=`</div>`});
  return h};
const stEt=document.createElement('style');stEt.textContent=`.etp{display:flex;flex-direction:column;gap:8px}.etp button{display:flex;align-items:center;gap:12px;text-align:left;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:14px;padding:11px 12px}
.etp button.deja{opacity:.6}.etp button.cons{border-color:var(--ok);box-shadow:0 0 0 2px var(--okbg)}.etp .ei{width:40px;height:40px;border-radius:12px;background:var(--acc2);display:grid;place-items:center;font-size:20px;flex:none}.etp .em{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.etp .em b{font-size:14px}.etp .em small{color:var(--mute);font-size:12px}
.etp .ea{width:30px;height:30px;border-radius:50%;background:var(--acc);color:var(--acc-ink);display:grid;place-items:center;font-weight:800;flex:none}.etp button.deja .ea{background:var(--okbg);color:var(--ok)}
.etsum .etbig{font-size:28px;font-weight:800;line-height:1.1}.etc{padding:12px 14px}.etc.fini{opacity:.8}.eth{display:flex;gap:12px;align-items:flex-start}.eth .etm{flex:1;min-width:0}.eth b{font-size:14.5px}.eth .s{font-size:12px;color:var(--mute);margin-top:4px}
.eti{width:38px;height:38px;border-radius:11px;background:var(--acc2);display:grid;place-items:center;font-size:19px;flex:none}.etc.fini .eti{background:var(--ok);color:#fff;font-weight:800}.etv{color:var(--mute);font-size:16px;padding-top:8px}
.sous{margin:10px 0 0 50px;border-left:2px solid var(--line);padding-left:10px}.so{display:flex;align-items:center;gap:10px;padding:7px 0}.so .sm1{flex:1;min-width:0;display:flex;flex-direction:column}.so .sm1 small{color:var(--mute);font-size:11.5px}
.sck{width:28px;height:28px;border-radius:50%;border:2px solid var(--line);background:var(--card);color:#fff;font-weight:800;flex:none;padding:0}.so.ok .sck{background:var(--ok);border-color:var(--ok)}.so.ok .sm1 span{color:var(--mute);text-decoration:line-through}
.celeb{font-size:44px;text-align:center;margin-bottom:4px}@media(max-width:420px){.sous{margin-left:8px}}`;document.head.appendChild(stEt);
