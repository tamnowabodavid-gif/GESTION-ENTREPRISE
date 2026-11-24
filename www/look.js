/* look.js — apparence professionnelle : thème par entreprise (logo, couleur, mode sombre, taille du texte),
   écran d'ouverture, menu ☰, nouvel accueil, contacts, aide, conditions d'utilisation et confidentialité */
const CGU_V='1.0',CGU_DATE='22 novembre 2026',EDITEUR='KLEIN TECH-INNOVATION',SUPPORT='tamnowabodavid@gmail.com';
if(!COLLS.includes('contacts')){COLLS.push('contacts');S.contacts=S.contacts||[]}
const PRESETS=[['#e2711d','Orange chantier'],['#1f6feb','Bleu'],['#0e8a5f','Vert'],['#b42318','Rouge brique'],['#6941c6','Violet'],['#0f766e','Turquoise'],['#a16207','Ocre'],['#334155','Ardoise']];
const lsG=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}},lsS=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
function hexRgbL(h){h=String(h||'').replace('#','');if(h.length===3)h=h.split('').map(x=>x+x).join('');const n=parseInt(h,16);return isNaN(n)||h.length!==6?[226,113,29]:[n>>16&255,n>>8&255,n&255]}
const mixHex=(a,b,t)=>{const A=hexRgbL(a),B=hexRgbL(b);return '#'+A.map((x,i)=>Math.round(x+(B[i]-x)*t).toString(16).padStart(2,'0')).join('')};
const lumi=h=>{const[r,g,b]=hexRgbL(h).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*r+.7152*g+.0722*b};
function brand(){const E=ent();let c={};try{c=JSON.parse(lsG('ge_brand','{}'))||{}}catch(e){}
  return{nom:E.nom||c.nom||"GESTION D'ENTREPRISE",logo:E.logo||c.logo||'',couleur:E.couleur||c.couleur||'#e2711d',slogan:E.slogan||c.slogan||''}}
function initials(n){const w=String(n||'').replace(/[^A-Za-zÀ-ÿ0-9 \-]/g,' ').split(/[\s\-]+/).filter(x=>x&&!/^(sarl|sa|sas|ets|et|de|du|la|le|les|d|l)$/i.test(x));
  return(w.length>1?w[0][0]+w[1][0]:(w[0]||'GE').slice(0,2)).toUpperCase()}
const bmark=(b,cls='')=>{b=b||brand();return `<div class="bmark ${cls}">${b.logo?`<img src="${b.logo}" alt="">`:esc(initials(b.nom))}</div>`};
const isTeamUser=()=>typeof TEAM!=='undefined'&&TEAM.on&&!TEAM.admin;
const themeMode=()=>{const m=lsG('ge_theme','auto');return m==='auto'?(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):m};
/* ---------- thème ---------- */
function applyTheme(){const b=brand(),acc=b.couleur,dark=themeMode()==='dark',R=document.documentElement,top=dark?'#0b0f14':mixHex(acc,'#1b222c',.8);
  R.dataset.theme=dark?'dark':'light';R.dataset.fs=lsG('ge_fs','n');
  R.style.setProperty('--acc',acc);R.style.setProperty('--acc2',dark?mixHex(acc,'#171c23',.72):mixHex(acc,'#ffffff',.85));
  R.style.setProperty('--acc-ink',lumi(acc)>.42?'#1d232b':'#fff');R.style.setProperty('--top',top);R.style.setProperty('--slate',top);
  let m=document.querySelector('meta[name=theme-color]');if(!m){m=document.createElement('meta');m.name='theme-color';document.head.appendChild(m)}m.content=top;
  if(typeof VIZ!=='undefined')Object.assign(VIZ,dark?{ink:'#e6e9ee',ink2:'#9aa4b2',grid:'#28303a',surface:'#171c23'}:{ink:'#0b0b0b',ink2:'#52514e',grid:'#ece7df',surface:'#ffffff'});
  const E=ent();if(E.nom||E.logo||E.couleur){const s=JSON.stringify({nom:E.nom||'',couleur:E.couleur||'',slogan:E.slogan||'',logo:(E.logo||'').length<200000?E.logo||'':''});if(s!==lsG('ge_brand',''))lsS('ge_brand',s)}}
function brandHeader(){const b=brand(),el=$('#brand');if(el){el.className='logo bm'+(b.logo?' img':'');el.innerHTML=b.logo?`<img src="${b.logo}" alt="">`:esc(initials(b.nom))}
  const t=$('#title');if(t&&(t.textContent==='Chantier Pro'||t.textContent==="GESTION D'ENTREPRISE"))t.textContent=b.nom}
/* ---------- écran d'ouverture ---------- */
const SPLASH_T0=Date.now();
function splashShow(){if($('#splash'))return;const b=brand();document.body.classList.add('splash');
  document.body.insertAdjacentHTML('beforeend',`<div id="splash">${bmark(b,'big')}<h1>${esc(b.nom)}</h1>${b.slogan?`<p>${esc(b.slogan)}</p>`:''}<div class="spin"></div><div class="sf">GESTION D'ENTREPRISE · ${EDITEUR}</div></div>`)}
function splashHide(){const s=$('#splash');if(!s||s.dataset.h)return;s.dataset.h='1';setTimeout(()=>{document.body.classList.remove('splash');s.classList.add('out');setTimeout(()=>s.remove(),320)},Math.max(0,700-(Date.now()-SPLASH_T0)))}
/* ---------- menu ☰ ---------- */
function headerUI(){const top=$('.top');if(!top||$('#btnMenu'))return;
  top.insertAdjacentHTML('afterbegin','<button class="iconbtn menubtn" id="btnMenu" aria-label="Menu">☰</button>');$('#btnMenu').onclick=menuOpen;
  const c=$('#btnCat');if(c)c.style.display='none'}
function menuItems(){const I=(ic,l,f,on)=>({ic,l,f,on}),v=ui.view,T=[];
  T.push(['',[I('🏠','Accueil',"go('home')",v==='home')]]);
  if(!isTeamUser()){
    T.push(['Projets',[I('🏗️','Chantiers et projets',"go('home');setTimeout(()=>{const e=document.querySelector('.secth');e&&e.scrollIntoView({behavior:'smooth'})},120)"),I('🏬','Locations (boutiques)',"go('locations')",v==='locations'||v==='bail')]]);
    T.push(['Gestion',[I('👷','Personnel & paie',"ui.rhTab='fiches';go('rh')",v==='rh'),I('⏱️','Pointage du jour',"ui.rhTab='pointage';go('rh')"),
      I('📊','Tableau de bord',"ui.entTab='bord';go('ent')",v==='ent'&&ui.entTab==='bord'),I('💰','Trésorerie',"ui.entTab='tresor';go('ent')",v==='ent'&&ui.entTab==='tresor'),
      I('🧾','Factures',"ui.entTab='factures';go('ent')",v==='ent'&&ui.entTab==='factures'),I('📤','Export comptable',"ui.entTab='export';go('ent')",v==='ent'&&ui.entTab==='export')]]);
    T.push(['Outils',[I('📦','Catalogue des matériaux',"go('catalogue')",v==='catalogue'),I('📐','Règles de calcul',"go('regles')",v==='regles'),I('🧱','Fondations types',"go('fondcat')",v==='fondcat')]]);
    const carnet=[I('📇','Contacts',"go('contacts')",v==='contacts')];if(typeof TEAM!=='undefined'&&TEAM.admin)carnet.push(I('👥','Équipe & accès',"go('acces')",v==='acces'));T.push(['Carnet',carnet]);
    T.push(['Réglages',[I('🏢','Mon entreprise',"formReglages()"),I('🎨','Apparence',"formApparence()")]]);
  }else T.push(['Mon compte',[I('👤','Mon compte',"monCompte()"),I('🎨','Apparence',"formApparence()")]]);
  const as=[I('❓','Aide',"go('aide')",v==='aide'),I('📜',"Conditions d'utilisation","go('cgu')",v==='cgu'),I('🔒','Confidentialité',"go('confid')",v==='confid')];
  if(typeof TEAM!=='undefined'&&TEAM.on)as.push(I('🚪','Se déconnecter','teamLogout()'));T.push(['Assistance',as]);return T}
function menuOpen(){menuClose(true);const b=brand(),who=typeof TEAM!=='undefined'&&TEAM.on?(TEAM.admin?'Gérant · '+TEAM.user.email:(TEAM.me&&TEAM.me.nom)||''):'Version '+(typeof APP_VERSION!=='undefined'?APP_VERSION:'');
  document.body.insertAdjacentHTML('beforeend',`<div class="drw-bg" id="drwBg" onclick="menuClose()"></div><nav class="drw" id="drw"><div class="drw-h">${bmark(b)}<div style="min-width:0"><b>${esc(b.nom)}</b><small>${esc(who)}</small></div></div>
    ${menuItems().map(([t,L])=>(t?`<div class="drw-sec">${t}</div>`:'')+L.map(x=>`<button class="drw-it ${x.on?'on':''}" onclick="menuClose();${x.f}"><span class="di">${x.ic}</span>${esc(x.l)}</button>`).join('')).join('')}
    <div class="drw-f">GESTION D'ENTREPRISE ${typeof APP_VERSION!=='undefined'?APP_VERSION:''} · ${EDITEUR}</div></nav>`);
  requestAnimationFrame(()=>{$('#drwBg').classList.add('on');$('#drw').classList.add('on')})}
function menuClose(now){const d=$('#drw'),g=$('#drwBg');if(!d)return;if(now){d.remove();g&&g.remove();return}d.classList.remove('on');g&&g.classList.remove('on');setTimeout(()=>{d.remove();g&&g.remove()},230)}
/* ---------- accueil ---------- */
function heroCard(){const b=brand(),d=new Date(),m=today().slice(0,7),h=d.getHours();
  const enc=S.chantiers.filter(c=>(c.statut||'prep')==='cours').length,att=(S.rapports||[]).filter(r=>r.statut!=='valide').length+(S.demandes||[]).filter(x=>(x.statut||'attente')==='attente').length;
  const encM=sum(S.recus.filter(r=>String(r.date||'').startsWith(m)),r=>num(r.montant));
  return `<div class="hero">${bmark(b)}<div style="min-width:0"><h2>${h<12?'Bonjour':h<18?'Bon après-midi':'Bonsoir'} 👋</h2>
    <div class="hs">${esc(b.nom)} · ${d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</div>
    <div class="hc"><span>🏗️ ${enc} chantier${enc>1?'s':''} en cours</span><span>💵 ${F(encM)} reçus ce mois</span>${att?`<span>🔔 ${att} à valider</span>`:''}</div></div></div>`}
homeActions=function(){const P=k=>PTYPES[k]||{ic:'•',nom:k},D={cle:'Construction complète : devis, plans, suivi, paie',plans:'Plans architecturaux et dossier de permis',structure:'Calculs de béton armé et plans d\'exécution',devis:'Estimation chiffrée seule',travaux:'Réparations, rénovations, petits chantiers'};
  const t=(ic,l,d,f)=>`<button class="tile" onclick="${f}"><span class="ti">${ic}</span><b>${l}</b><small>${d}</small></button>`;
  return `<div class="secth" style="margin-top:4px">Démarrer un projet</div><div class="tiles" style="margin-bottom:14px">
    ${t(P('cle').ic,P('cle').nom,D.cle,'formChantier()')}${['plans','structure','devis','travaux'].map(k=>t(P(k).ic,P(k).nom,D[k],`formPresta('${k}')`)).join('')}
    ${t('☀️','Installation solaire','Dimensionnement panneaux, batteries, onduleur',"window.__brPreset='solaire';formPresta('travaux');window.__brPreset=''")}
    ${t('⚡','Installation électrique','Circuits, câbles et protections NF C 15-100',"window.__brPreset='elec';formPresta('travaux');window.__brPreset=''")}
    ${t('🏬','Locations','Boutiques, contrats de bail et loyers',"go('locations')")}</div>
    <div class="secth">Raccourcis</div><div class="shorts" style="margin-bottom:14px">
    <button onclick="choisirProjet('bon')">🧾 Bon de commande</button><button onclick="choisirProjet('recu')">💵 Reçu de paiement</button>
    <button onclick="ui.rhTab='pointage';go('rh')">⏱️ Pointage</button><button onclick="ui.rhTab='fiches';go('rh')">👷 Paie</button>
    <button onclick="ui.entTab='bord';go('ent')">📊 Tableau de bord</button><button onclick="go('contacts')">📇 Contacts</button></div>`};
const vhL=viewHome;viewHome=function(){return heroCard()+vhL()};
/* ---------- apparence ---------- */
function formApparence(){const b=brand(),adm=!isTeamUser(),mode=lsG('ge_theme','auto'),fs=lsG('ge_fs','n');let col=b.couleur;
  $('#modalRoot').innerHTML=`<div class="modal-bg" onclick="if(event.target===this)closeForm()"><div class="modal"><h2>🎨 Apparence</h2>
    <div class="apv"><div class="t">${bmark(b)}<span>${esc(b.nom)}</span></div><div class="b"><button class="btn small">Bouton</button> <span class="chip go">Étiquette</span></div></div>
    ${adm?`<div class="f"><span class="lbl">Couleur de l'entreprise (pour toute l'équipe)</span><div class="swatches">${PRESETS.map(([c,n])=>`<button type="button" title="${n}" data-c="${c}" style="background:${c}" class="${c.toLowerCase()===col.toLowerCase()?'on':''}" onclick="apCol('${c}')"></button>`).join('')}
      <input type="color" id="apC" value="${esc(col)}" oninput="apCol(this.value)" style="width:44px;height:38px;border:0;background:none;padding:0"></div></div>
      <label class="f"><span>Slogan (sous le nom, à l'ouverture)</span><input id="apS" value="${esc(ent().slogan||'')}" placeholder="ex. Bâtir avec rigueur"></label>
      <div class="f"><span class="lbl">Logo</span><button type="button" class="btn sec small" onclick="closeForm();formReglages()">Changer le logo dans « Mon entreprise »</button></div>`:''}
    <div class="f"><span class="lbl">Thème (sur cet appareil)</span><div class="seg">${[['light','☀️ Clair'],['dark','🌙 Sombre'],['auto','⚙️ Auto']].map(([k,l])=>`<button type="button" class="${mode===k?'on':''}" onclick="lsS('ge_theme','${k}');applyTheme();formApparence()">${l}</button>`).join('')}</div></div>
    <div class="f"><span class="lbl">Taille du texte (sur cet appareil)</span><div class="seg">${[['n','Normale'],['lg','Grande']].map(([k,l])=>`<button type="button" class="${fs===k?'on':''}" onclick="lsS('ge_fs','${k}');applyTheme();formApparence()">${l}</button>`).join('')}</div></div>
    <div class="row" style="margin-top:6px"><button class="btn sec" onclick="applyTheme();closeForm()">Fermer</button>${adm?`<button class="btn" style="flex:1" onclick="apSave()">Enregistrer pour l'entreprise</button>`:''}</div></div></div>`}
function apCol(c){document.documentElement.style.setProperty('--acc',c);document.querySelectorAll('.swatches button').forEach(x=>x.classList.toggle('on',x.dataset.c===c));const i=$('#apC');if(i&&i.value!==c)i.value=c;window.__apCol=c;
  const R=document.documentElement;R.style.setProperty('--acc2',mixHex(c,R.dataset.theme==='dark'?'#171c23':'#ffffff',.8));R.style.setProperty('--acc-ink',lumi(c)>.42?'#1d232b':'#fff')}
async function apSave(){const c=window.__apCol||brand().couleur,s=($('#apS')||{}).value||'';window.__apCol=null;closeForm();await saveConfig({entreprise:{...ent(),couleur:c,slogan:s.trim()}});applyTheme();render();toast('Apparence enregistrée.')}
/* ---------- contacts ---------- */
/* numéro international pour WhatsApp : Cameroun (9 chiffres, 6… ou 2…) → +237 ; Canada / États-Unis (10 chiffres) → +1 */
const telWa=t=>{const raw=String(t||'').trim();let d=raw.replace(/\D/g,'');if(d.startsWith('00'))d=d.slice(2);
  if(!raw.startsWith('+')&&!String(t).trim().startsWith('00')){if(d.length===9&&/^[26]/.test(d))d='237'+d;else if(d.length===10&&/^[2-9]/.test(d))d='1'+d;else if(d.length===8&&/^[2-9]/.test(d))d='237'+(/^[2]/.test(d)?'2':'6')+d}
  return d};
const telOk=d=>/^(237[26]\d{8}|1[2-9]\d{9}|33[1-9]\d{8}|\d{11,15})$/.test(d);
function waOuvrir(t,txt){const d=telWa(t);if(!telOk(d)){toast(`Numéro « ${t} » incomplet pour WhatsApp : ajoute l'indicatif du pays (ex. +237 6XX XX XX XX).`);return}
  const u='https://wa.me/'+d+(txt?'?text='+encodeURIComponent(txt):'');if(typeof capP==='function'&&capP('Browser'))capP('Browser').open({url:u});else window.open(u,'_blank')}
function contactsAll(){const L=[],add=(cat,nom,tel,sub,id)=>{nom=String(nom||'').trim();if(!nom)return;const k=cat+'|'+nom.toLowerCase(),x=L.find(y=>y.k===k);
    if(x){if(!x.tel&&tel)x.tel=tel;if(sub&&!x.subs.includes(sub))x.subs.push(sub);return}L.push({k,cat,nom,tel:tel||'',subs:sub?[sub]:[],id})};
  (S.contacts||[]).forEach(x=>add(x.cat||'Autres',x.nom,x.tel,x.note||x.email||'',x.id));
  S.chantiers.forEach(c=>{const cl=c.cli||{};add('Clients',cl.nom||c.client,cl.tel||c.clientTel,c.nom)});
  S.employes.forEach(e=>add('Personnel',e.nom,e.tel,[e.metier,e.actif===false?'ancien':''].filter(Boolean).join(' · ')));
  [...S.achats,...(S.bons||[])].forEach(a=>add('Fournisseurs',a.fournisseur,a.fournisseurTel||a.telFournisseur,''));
  (S.baux||[]).forEach(b=>{add('Locataires',b.locNom,b.locTel,b.bien);add('Propriétaires',b.bailNom,b.bailTel,b.bien)});
  return L.sort((a,b)=>a.nom.localeCompare(b.nom,'fr'))}
function viewContacts(){const L=contactsAll(),cats=['Tous',...new Set(L.map(x=>x.cat))],cf=ui.ctCat||'Tous',V=cf==='Tous'?L:L.filter(x=>x.cat===cf);
  return `<button class="btn block" style="margin-bottom:12px" onclick="formContact()">＋ Ajouter un contact</button>
  <input class="srch" placeholder="🔍 Rechercher un nom, un numéro…" oninput="ctFiltre(this.value)">
  <div class="tabs">${cats.map(c=>`<button class="tab ${cf===c?'on':''}" onclick="ui.ctCat='${esc(c)}';render()">${esc(c)} ${c==='Tous'?L.length:L.filter(x=>x.cat===c).length}</button>`).join('')}</div>
  <div class="card" id="ctL">${V.map(x=>`<div class="ctc" data-s="${esc((x.nom+' '+x.tel+' '+x.subs.join(' ')+' '+x.cat).toLowerCase())}"><div class="av">${esc(initials(x.nom))}</div>
    <div class="cm ${x.id?'click':''}" ${x.id?`onclick="formContact('${x.id}')"`:''}><b>${esc(x.nom)}</b><small>${esc(x.cat)}${x.subs.length?' · '+esc(x.subs.slice(0,2).join(', ')):''}${x.tel?' · '+esc(x.tel):''}</small></div>
    <div class="ca">${x.tel?`<a href="tel:${esc(x.tel.replace(/\s/g,''))}" title="Appeler">📞</a><a href="#" onclick="(typeof ctExterne==='function'?ctExterne:waOuvrir)('${esc(x.tel).replace(/'/g,"\\'")}');return false" title="Écrire (WhatsApp, SMS, Telegram…)">↗</a>`:''}</div></div>`).join('')||'<div class="empty">Aucun contact pour l\'instant. Les clients, le personnel, les fournisseurs et les locataires saisis dans l\'application apparaissent ici automatiquement.</div>'}</div>`}
function ctFiltre(q){q=q.toLowerCase().trim();document.querySelectorAll('#ctL .ctc').forEach(e=>e.style.display=!q||e.dataset.s.includes(q)?'':'none')}
function formContact(id){const x=id?(S.contacts||[]).find(c=>c.id===id):null;
  openForm({title:x?'Modifier le contact':'Nouveau contact',values:x||{cat:'Fournisseurs'},fields:[{k:'nom',label:'Nom ou entreprise',req:true},{k:'cat',label:'Catégorie',type:'select',opts:['Clients','Fournisseurs','Sous-traitants','Administrations','Banques','Partenaires','Autres'].map(c=>[c,c])},
    {k:'tel',label:'Téléphone (avec +237 ou +1 si besoin)',type:'tel',ph:'+237 6XX XX XX XX'},{k:'email',label:'E-mail',type:'email'},{k:'note',label:'Note (activité, adresse…)',type:'textarea'}],
    onSave:o=>{if(!o.nom){toast('Indique le nom.');return false}return save('contacts',{...(x||{}),...o})},onDelete:x?()=>del('contacts',x.id):null})}
/* ---------- aide ---------- */
const FAQ=[['Comment sauvegarder mes données ?',"Menu ☰ → Mon entreprise → « 💾 Sauvegarder mes données ». Un seul fichier contient tout (chantiers, devis, prix, réglages). Garde-le dans Google Drive ou WhatsApp. En mode équipe, les données sont en plus enregistrées automatiquement dans le cloud de l'entreprise."],
  ['Comment récupérer mes données sur un autre appareil ?',"En mode équipe : connecte-toi simplement avec le même compte, tout revient. Sans compte : fais une sauvegarde sur l'ancien appareil puis « 📥 Restaurer une sauvegarde » sur le nouveau."],
  ['Comment donner un accès à un employé ?',"Menu ☰ → Équipe & accès → « Donner un accès ». Choisis la personne, son rôle (chef de chantier, ouvrier, collaborateur), ses chantiers et ce qu'il peut voir. Envoie-lui le code par WhatsApp. L'argent reste visible par le gérant seul."],
  ['Comment fonctionne le pointage GPS ?',"L'ouvrier touche « Début de journée » sur le chantier : la position est vérifiée une seule fois à ce moment-là. Hors de la zone, le pointage est signalé. Le GPS n'est jamais suivi en continu."],
  ['Et sans connexion Internet ?',"Tout ce qui est saisi est gardé sur l'appareil puis envoyé dès que le réseau revient, même faible. Une journée de travail consomme moins de 1 Mo."],
  ['Comment mettre l\'application à jour ?',"L'application affiche « Nouvelle version disponible » : touche « Télécharger » puis installe par-dessus. Tes données sont conservées."],
  ['Les calculs (métré, ferraillage, paie) sont-ils garantis ?',"Ce sont des aides au calcul basées sur les règles courantes (BAEL, NF C 15-100, barèmes CNPS/IRPP). Ils doivent être vérifiés par un professionnel qualifié avant exécution ou déclaration."]];
function viewAide(){const r=RUBS.map(x=>`<details><summary>${x.ic} ${esc(x.l)}</summary><p>${esc(x.aide||'')}</p></details>`).join('');
  return `<div class="card"><h3>👋 Bien démarrer</h3><div class="doc"><ol style="padding-left:20px;margin:0"><li>Remplis <b>Mon entreprise</b> (nom, logo, téléphone) : ils apparaissent sur tes devis, reçus et à l'ouverture.</li><li>Choisis ta couleur dans <b>Apparence</b>.</li><li>Crée ton premier projet depuis l'accueil (« Démarrer un projet »).</li><li>Ajoute ton personnel, puis donne-leur un accès si tu travailles en équipe.</li></ol></div>
    <div class="row" style="gap:6px;margin-top:10px;flex-wrap:wrap"><button class="btn small" onclick="formReglages()">🏢 Mon entreprise</button><button class="btn sec small" onclick="formApparence()">🎨 Apparence</button></div></div>
  <div class="card faq"><h3>Questions fréquentes</h3>${FAQ.map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
  <div class="card faq"><h3>Les rubriques d'un chantier</h3>${r}</div>
  <div class="card"><h3>Besoin d'aide ?</h3><div class="sm mute" style="margin-bottom:10px">Assistance ${EDITEUR} · version ${typeof APP_VERSION!=='undefined'?APP_VERSION:''}</div>
    <a class="btn sec block" style="text-decoration:none" href="mailto:${SUPPORT}?subject=${encodeURIComponent('Assistance GESTION D\'ENTREPRISE')}">✉️ Écrire à l'assistance</a></div>`}
/* ---------- conditions d'utilisation et confidentialité ---------- */
const DOCS={cgu:()=>`<h2>1. Objet</h2><p>Les présentes conditions encadrent l'utilisation de l'application <b>GESTION D'ENTREPRISE</b> (application Android, application Windows et version web), éditée par <b>${EDITEUR}</b>, Cameroun. Elle aide les entreprises du bâtiment, de l'électricité et de l'énergie à gérer leurs chantiers, devis, achats, personnel, paie et finances.</p>
<h2>2. Accès gratuit</h2><p>L'application est actuellement proposée <b>gratuitement</b>, en phase de lancement. L'éditeur peut faire évoluer l'offre ; toute introduction d'un service payant sera annoncée au moins <b>30 jours</b> à l'avance et ne s'appliquera qu'après acceptation. Les données restent récupérables à tout moment.</p>
<h2>3. Comptes et accès</h2><ul><li>Le gérant de l'entreprise crée le compte principal et reste responsable des accès qu'il donne à ses employés et collaborateurs.</li><li>Chaque utilisateur garde ses codes confidentiels. Tout accès avec ses identifiants est réputé fait par lui.</li><li>Le gérant peut désactiver un accès à tout moment.</li></ul>
<h2>4. Données de l'entreprise</h2><p>Les données saisies (chantiers, clients, personnel, montants, documents) <b>appartiennent à l'entreprise utilisatrice</b>. L'éditeur ne les vend pas, ne les exploite pas à des fins commerciales et n'y accède que pour l'assistance technique demandée par l'entreprise ou une obligation légale. L'entreprise peut les exporter et demander leur suppression.</p>
<h2>5. Calculs et documents produits</h2><p>Les métrés, quantités, calculs de structure (BAEL), dimensionnements électriques et solaires, plans générés, fiches de paie et montants de cotisations sont des <b>aides à la décision</b>. Ils doivent être vérifiés par un professionnel qualifié (ingénieur, architecte inscrit à l'ONAC, comptable) avant toute exécution, signature ou déclaration. L'éditeur ne peut être tenu responsable d'une erreur de saisie, d'un usage sans vérification ou d'une évolution des règles et barèmes.</p>
<h2>6. Bon usage</h2><ul><li>Ne saisir que des informations exactes et dont l'entreprise a le droit de disposer.</li><li>Informer les employés que leurs données et leurs pointages (avec position GPS au moment du pointage) sont enregistrés.</li><li>Ne pas tenter de contourner les accès, de copier ou revendre l'application.</li></ul>
<h2>7. Disponibilité</h2><p>L'éditeur fait ses meilleurs efforts pour assurer le fonctionnement du service, sans garantie d'absence d'interruption. Il est recommandé de faire régulièrement une sauvegarde (menu Mon entreprise).</p>
<h2>8. Évolution des conditions</h2><p>Ces conditions peuvent être mises à jour. La nouvelle version est présentée dans l'application et doit être acceptée pour continuer.</p>
<h2>9. Droit applicable</h2><p>Les présentes conditions sont régies par le droit camerounais. En cas de litige, une solution amiable est recherchée avant toute action devant les juridictions compétentes du Cameroun.</p>
<h2>10. Contact</h2><p>${EDITEUR} · <a href="mailto:${SUPPORT}">${SUPPORT}</a></p>`,
confid:()=>`<h2>1. Qui est responsable ?</h2><p>Chaque entreprise utilisatrice est <b>responsable du traitement</b> des données de ses clients, employés et partenaires. <b>${EDITEUR}</b> agit comme éditeur et prestataire technique (sous-traitant). Ce cadre s'inscrit dans la loi camerounaise n° 2024/017 du 23 décembre 2024 relative à la protection des données à caractère personnel.</p>
<h2>2. Données traitées</h2><ul><li><b>Utilisateurs</b> : nom, numéro de téléphone, rôle, chantiers attribués.</li><li><b>Employés</b> : identité, poste, taux de paie, numéro Mobile Money, pointages (date, heures et position GPS <b>uniquement au moment où la personne pointe</b>).</li><li><b>Clients et partenaires</b> : coordonnées, documents du projet (titre foncier, pièces d'identité si fournies).</li><li><b>Données financières</b> de l'entreprise : devis, achats, reçus, factures, trésorerie.</li></ul>
<h2>3. Pourquoi</h2><p>Uniquement pour faire fonctionner l'application : gestion des chantiers, devis et factures, présence et paie du personnel, communication interne. Aucune publicité, aucune revente, aucun profilage.</p>
<h2>4. Où sont les données</h2><p>Selon le mode choisi : sur l'appareil seulement, ou dans le cloud de l'entreprise hébergé par Google Firebase (centre de données en Belgique, Union européenne), avec chiffrement des échanges. L'accès est limité par des règles de sécurité : chacun ne voit que ses chantiers et ses rubriques ; les données financières restent réservées au gérant.</p>
<h2>5. Combien de temps</h2><p>Tant que l'entreprise utilise l'application, puis jusqu'à sa demande de suppression, sous réserve des durées de conservation imposées par la loi (comptabilité, paie).</p>
<h2>6. Vos droits</h2><p>Toute personne concernée peut demander l'accès, la rectification, l'opposition ou la suppression de ses données auprès de l'entreprise qui l'emploie ou l'a enregistrée, ou en écrivant à <a href="mailto:${SUPPORT}">${SUPPORT}</a>. Une réponse est apportée dans un délai raisonnable.</p>
<h2>7. Sécurité</h2><p>Codes personnels, accès par rôle, désactivation immédiate d'un compte, sauvegarde exportable. En cas d'incident de sécurité affectant des données personnelles, les entreprises concernées sont informées.</p>
<h2>8. Contact</h2><p>${EDITEUR} · <a href="mailto:${SUPPORT}">${SUPPORT}</a></p>`};
function viewDoc(k){return `<div class="card doc"><div class="sm mute" style="margin-bottom:12px">Version ${CGU_V} · en vigueur au ${CGU_DATE}</div>${DOCS[k]()}</div>
  <div class="row" style="gap:6px"><button class="btn sec small" onclick="go('${k==='cgu'?'confid':'cgu'}')">${k==='cgu'?'🔒 Confidentialité':"📜 Conditions d'utilisation"}</button></div>`}
function cguCheck(){if(lsG('ge_cgu','')===CGU_V||$('#modalRoot .modal')||cguCheck.shown)return;cguCheck.shown=true;
  setTimeout(()=>{if($('#modalRoot .modal')){cguCheck.shown=false;return}
    $('#modalRoot').innerHTML=`<div class="modal-bg"><div class="modal"><h2>📜 Avant de commencer</h2><div class="sm" style="line-height:1.55">Bienvenue dans <b>GESTION D'ENTREPRISE</b>. L'application est gratuite. Tes données appartiennent à ton entreprise et ne sont jamais revendues. Les calculs (métrés, structure, paie) sont des aides à vérifier par un professionnel.</div>
      <div class="row" style="gap:6px;margin:12px 0;flex-wrap:wrap"><button class="btn sec small" onclick="cguLire('cgu')">Lire les conditions</button><button class="btn sec small" onclick="cguLire('confid')">Lire la confidentialité</button></div>
      <label class="chk"><input type="checkbox" id="cguOk" onchange="$('#cguBtn').disabled=!this.checked"> J'ai lu et j'accepte les conditions d'utilisation et la politique de confidentialité.</label>
      <button class="btn block" id="cguBtn" disabled onclick="lsS('ge_cgu',CGU_V);closeForm();toast('Merci, bonne utilisation !')">Continuer</button></div></div>`},400)}
function cguLire(k){closeForm();cguCheck.shown=false;go(k)}
/* ---------- branchement ---------- */
const LVIEWS={contacts:['Contacts',viewContacts],aide:['Aide',viewAide],cgu:["Conditions d'utilisation",()=>viewDoc('cgu')],confid:['Confidentialité',()=>viewDoc('confid')]};
const rLook=render;render=function(){applyTheme();
  if(LVIEWS[ui.view]&&mode!=='loading'){killCharts();document.body.classList.remove('hasnav');$('#btnBack').style.display='';{const T=LVIEWS[ui.view][0];$('#title').textContent=typeof T==='function'?T():T}$('#app').innerHTML=updBanner()+LVIEWS[ui.view][1]()}
  else rLook();
  brandHeader();if(mode!=='loading'){splashHide();if(!['cgu','confid'].includes(ui.view))cguCheck()}};
if(window.matchMedia)try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(lsG('ge_theme','auto')==='auto')applyTheme()})}catch(e){}
applyTheme();headerUI();splashShow();brandHeader();
