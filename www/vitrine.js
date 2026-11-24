/* vitrine.js — page d'accueil : vitrine publicitaire de l'entreprise (photos + textes) vue par clients, employés, partenaires ;
   graphiques déplacés dans chaque projet ; mini-frise d'avancement sous chaque chantier */
const vitCfg=()=>({titre:'',slogan:'',cover:null,blocs:[],...(ent().vitrine||{})});
const imgU=p=>p&&p.id?'/_blob/'+encodeURIComponent(p.id):'';
const VCIB={clients:'Clients',employes:'Employés',partenaires:'Partenaires'};
function vitPublic(){if(typeof TEAM==='undefined'||!TEAM.on||TEAM.admin)return null;try{const p=rgPersonne('me').profil;return p==='client'?'clients':p==='externe'?'partenaires':'employes'}catch(e){return'employes'}}
function vitLien(l){l=String(l||'').trim();if(!l)return'';if(/^\+?[\d\s]{8,}$/.test(l)){const t=typeof telWa==='function'?telWa(l):l.replace(/\D/g,'');return 'https://wa.me/'+t}return /^https?:/i.test(l)?l:'https://'+l}
function vitrineHome(){const V=vitCfg(),E=ent(),pub=vitPublic(),adm=!pub,B=V.blocs.filter(b=>!b.cache&&(!pub||!(b.pour&&b.pour.length)||b.pour.includes(pub)));
  if(!adm&&!V.cover&&!B.length&&!V.slogan)return'';
  const cov=V.cover?`<div class="vcov" style="background-image:url('${imgU(V.cover)}')"><div class="vcov-t"><b>${esc(V.titre||E.nom||'')}</b>${V.slogan||E.slogan?`<span>${esc(V.slogan||E.slogan)}</span>`:''}</div></div>`
    :`<div class="vcov vcov0"><div class="vcov-t"><b>${esc(V.titre||E.nom||'Notre entreprise')}</b><span>${esc(V.slogan||E.slogan||E.activite||'Ajoute une photo de couverture et ton slogan')}</span></div></div>`;
  const cards=B.map(b=>`<div class="vcard">${b.photos&&b.photos[0]?`<div class="vph" style="background-image:url('${imgU(b.photos[0])}')">${b.photos.length>1?`<span class="vnb">+${b.photos.length-1}</span>`:''}</div>`:''}
    <div class="vtx">${b.titre?`<b>${esc(b.titre)}</b>`:''}${b.texte?`<p>${esc(b.texte)}</p>`:''}${b.btn&&b.lien?`<a class="btn small" href="${esc(vitLien(b.lien))}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${esc(b.btn)}</a>`:''}</div></div>`).join('');
  return `<div class="vitrine"><div class="row between" style="margin:4px 0 8px"><div class="secth" style="margin:0">${adm?'Vitrine de l\'entreprise':'À la une'}</div>${adm?`<button class="btn ghost small" onclick="go('vitedit')">✏️ Personnaliser</button>`:''}</div>
    ${cov}${cards?`<div class="vrow">${cards}</div>`:adm?`<div class="card sm mute" style="margin-top:10px">Ajoute des blocs : réalisations en photos, offres du moment, savoir-faire, témoignages, recrutement… Ils s'affichent à l'accueil chez tes clients, employés et partenaires.<br><button class="btn small" style="margin-top:8px" onclick="formVitBloc()">＋ Ajouter un bloc</button></div>`:''}
    <button class="btn sec block" style="margin-top:10px" onclick="go('vitrine')">🏢 Découvrir ${esc(E.nom||'l\'entreprise')}</button>
    ${adm?`<div class="note">Ce que voient tes clients, employés et partenaires à l'ouverture de l'application. Chaque bloc peut être réservé à un public.</div>`:''}</div>`}
/* ---------- gestion de la vitrine ---------- */
function viewVitEdit(){const V=vitCfg();
  let h=`<div class="card"><h3>Couverture</h3>${V.cover?`<div class="vcov" style="background-image:url('${imgU(V.cover)}');margin-bottom:8px"></div>`:''}<div class="sm mute" style="margin-bottom:8px">${esc(V.titre||ent().nom||'')} — ${esc(V.slogan||'pas de slogan')}</div><button class="btn small" onclick="formVitCouv()">✏️ Photo, titre et slogan</button></div>
    <div class="card"><div class="row between"><h3 style="margin:0">Blocs (${V.blocs.length})</h3><button class="btn small" onclick="formVitBloc()">＋ Bloc</button></div><div class="sm mute" style="margin:4px 0 8px">Ils défilent à l'accueil, dans cet ordre.</div>`;
  if(!V.blocs.length)h+=`<div class="empty sm">Idées : « Nos réalisations » (photos de chantiers finis), « Clé en main : de la conception à la remise des clés », « Énergie solaire », « Ils nous font confiance », « Nous recrutons »…</div>`;
  else h+=`<div class="list">${V.blocs.map((b,i)=>`<div class="it"><div class="main click" onclick="formVitBloc('${b.id}')"><div class="t">${b.cache?'🙈 ':''}${esc(b.titre||'(sans titre)')}</div><div class="s">${(b.photos||[]).length} photo(s) · ${b.pour&&b.pour.length?b.pour.map(x=>VCIB[x]).join(', '):'Tout le monde'}</div></div>
    <div class="amt"><div class="row" style="gap:2px"><button class="btn ghost small" ${i?'':'disabled'} onclick="vitMove(${i},-1)" aria-label="Monter">↑</button><button class="btn ghost small" ${i<V.blocs.length-1?'':'disabled'} onclick="vitMove(${i},1)" aria-label="Descendre">↓</button></div></div></div>`).join('')}</div>`;
  return h+`</div><div class="card"><h3>Aperçu</h3>${vitrineHome()}</div>`}
async function vitSave(v){await saveConfig({entreprise:{...ent(),vitrine:{...vitCfg(),...v}}})}
async function vitMove(i,d){const B=[...vitCfg().blocs],j=i+d;if(j<0||j>=B.length)return;[B[i],B[j]]=[B[j],B[i]];await vitSave({blocs:B})}
function formVitCouv(){const V=vitCfg();openForm({title:'Couverture de la vitrine',values:{titre:V.titre||ent().nom||'',slogan:V.slogan||ent().slogan||''},fields:[{type:'html',html:photoWidget('vitCov',V.cover?[V.cover]:[],'Photo de couverture (ex. ton plus beau chantier fini)')},{k:'titre',label:'Titre'},{k:'slogan',label:'Slogan',ph:'ex. Bâtir solide, livrer à temps'}],
  onSave:o=>vitSave({cover:(PW.vitCov||[])[0]||null,titre:o.titre,slogan:o.slogan})})}
function formVitBloc(id){const V=vitCfg(),b=id?V.blocs.find(x=>x.id===id):null;
  openForm({title:b?'Modifier le bloc':'Nouveau bloc de la vitrine',values:b?{...b,cache:!!b.cache,...Object.fromEntries(Object.keys(VCIB).map(k=>['p_'+k,!b.pour||!b.pour.length||b.pour.includes(k)]))}:{p_clients:true,p_employes:true,p_partenaires:true,cache:false},
    fields:[{type:'html',html:photoWidget('vitB',b?b.photos:[],'Photos')},{k:'titre',label:'Titre',ph:'ex. Nos réalisations 2026'},{k:'texte',label:'Texte',type:'textarea',ph:'ex. Villa R+1 à Bandjoun livrée en 8 mois, clé en main.'},
      {k:'btn',label:'Texte du bouton (facultatif)',ph:'ex. Demander un devis'},{k:'lien',label:'Lien du bouton',ph:'site web, page Facebook ou numéro WhatsApp'},
      {type:'html',html:'<div class="lbl" style="margin:6px 0 2px">Visible par</div>'},...Object.entries(VCIB).map(([k,l])=>({k:'p_'+k,label:l,type:'checkbox'})),{k:'cache',label:'Masquer pour l\'instant',type:'checkbox'}],
    onDelete:b?async()=>vitSave({blocs:vitCfg().blocs.filter(x=>x.id!==id)}):null,
    onSave:async o=>{const pour=Object.keys(VCIB).filter(k=>o['p_'+k]);const nb={id:b?b.id:uid(),photos:[...(PW.vitB||[])],titre:o.titre,texte:o.texte,btn:o.btn,lien:o.lien,cache:o.cache,pour:pour.length===3?[]:pour};
      if(!nb.titre&&!nb.texte&&!nb.photos.length){toast('Ajoute au moins une photo ou un texte');return false}
      const B=vitCfg().blocs;await vitSave({blocs:b?B.map(x=>x.id===b.id?nb:x):[...B,nb]});toast('Vitrine mise à jour')}})}
Object.assign(LVIEWS,{vitedit:['Vitrine de l\'entreprise',viewVitEdit]});
/* ---------- accueil : graphiques retirés, vitrine à la place ---------- */
homeCharts=function(){return vitrineHome()};
/* mini-frise sous chaque chantier */
function miniFrise(cid){const G=typeof ganttData==='function'&&ganttData(cid);if(!G)return'';const R=G.R;
  return `<div class="mfr" title="Étapes">${R.map(r=>`<span class="${r.st}${r.retard&&r.st!=='fini'?' late':''}" title="${esc(r.e.nom)} · ${r.av} %"></span>`).join('')}</div><div class="sm mute" style="margin-top:2px">${(()=>{const c=R.find(r=>r.st==='encours')||R.find(r=>r.st==='afaire');return c?(c.st==='encours'?'En cours : ':'Prochaine : ')+esc(c.e.nom)+(c.st==='encours'?' ('+c.av+' %)':''):'Toutes les étapes sont terminées'})()}</div>`}
const vhV=viewHome;viewHome=function(){let h=vhV();S.chantiers.forEach(c=>{const k=`onclick="openCh('${c.id}')"`,i=h.indexOf(k);if(i<0)return;const j=h.indexOf('<div class="pbar-line">',i),e=h.indexOf('</div></div>',h.indexOf('<div class="pbar-line">',j));if(j<0||e<0)return;const m=miniFrise(c.id);if(!m)return;
  const end=h.indexOf('</div>',h.indexOf('<span class="pct">',j))+6;h=h.slice(0,end)+m+h.slice(end)});return h};
/* employés, clients, partenaires : la vitrine sur leur accueil */
const rdV=render;render=function(){rdV.apply(this,arguments);try{if(typeof TEAM!=='undefined'&&TEAM.on&&!TEAM.admin&&ui.view==='home'){const app=$('#app');if(app&&!app.querySelector('.vitrine')){const v=vitrineHome();if(v)app.insertAdjacentHTML('beforeend',v)}}}catch(e){}};
/* ---------- graphiques dans chaque projet ---------- */
const tfV=tabsFor;tabsFor=function(t,ch){const o=tfV(t,ch);if(o&&o.etapes&&!o.graphes)o.graphes='Graphiques';return o};
function projCharts(ch){const s=stats(ch.id),av=Math.round(s.av),b=s.budget>0?Math.round(s.dep/s.budget*100):null;
  let h=`<div class="card"><h3>Avancement et budget consommé</h3><div class="sm mute" style="margin:-6px 0 10px">Ce projet, en %</div>
    ${pbar('Avancement',av,'ok')}${pbar('Budget',b||0,b>100?'bad':'',b!=null)}
    <div class="sm ${b!=null&&b>av+15?'pst warn':'mute'}" style="margin-top:6px">${b==null?'Applique un devis ou un budget aux étapes pour suivre le budget.':b>av+15?`${b} % du budget dépensé pour ${av} % de travaux faits : surveille les dépenses.`:`Dépenses en ligne avec l'avancement (${F(s.dep)} sur ${F(s.budget)}).`}</div></div>`;
  const months=[],d=new Date();for(let i=5;i>=0;i--){const x=new Date(d.getFullYear(),d.getMonth()-i,1);months.push(x.getFullYear()+'-'+pad(x.getMonth()+1))}
  const mat=months.map(m=>sum(byC('achats',ch.id).filter(a=>a.statut!=='a_acheter'&&(a.date||'').startsWith(m)),totA)),mo=months.map(m=>sum(byC('paiements',ch.id).filter(p=>(p.date||'').startsWith(m)),p=>num(p.montant)));
  const ML=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
  if(sum(mat,x=>x)+sum(mo,x=>x)>0)h+=`<div class="card"><h3>Dépenses des 6 derniers mois</h3><div class="sm mute" style="margin:-6px 0 8px">Ce projet, en FCFA</div>${regChart('pg2',{type:'bar',data:{labels:months.map(m=>ML[+m.slice(5)-1]),datasets:[barDs('Matériaux',mat,VIZ.s1),barDs("Main-d'œuvre",mo,VIZ.s2)]},options:baseOpts({stacked:true})})}</div>`;
  else h+=`<div class="card"><h3>Dépenses des 6 derniers mois</h3><div class="sm mute">Aucune dépense enregistrée sur ce projet pour l'instant.</div></div>`;
  return h}
tGraphes=(f=>function(ch,s){return projCharts(ch)+f(ch,s).replace(ganttHtml(ch.id),'')})(tGraphes);
{const r=RUBS.find(x=>x.k==='travaux');if(r&&!r.tabs.includes('graphes'))r.tabs.push('graphes')}
