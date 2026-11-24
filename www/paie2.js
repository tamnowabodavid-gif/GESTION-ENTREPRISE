/* paie2.js — fiches de paie dans le projet : validation = paiement + envoi automatique du bulletin à l'employé
   (messagerie interne) + copie classée dans l'onglet « Fiches de paie » du chantier */
TABS.bulletins='Fiches de paie';TABL.bulletins='Fiches de paie';
{const r=RUBS.find(x=>x.k==='equipe');if(r&&!r.tabs.includes('bulletins')){const i=r.tabs.indexOf('paie');r.tabs.splice(i<0?r.tabs.length:i+1,0,'bulletins')}
 if(r&&!/Fiches de paie/.test(r.aide))r.aide+=" Fiches de paie : prépare, valide et paie la fiche de chaque ouvrier du chantier. À la validation, le bulletin est envoyé à l'ouvrier dans la messagerie et une copie est classée ici."}
const tfBp=tabsFor;tabsFor=function(t,ch){const o=tfBp(t,ch);if(o&&o.paie&&!o.bulletins){const k=Object.keys(o),n={};k.forEach(x=>{n[x]=o[x];if(x==='paie')n.bulletins='Fiches de paie'});return n}return o};
const vcBp=viewChantier;viewChantier=function(ch){if(ui.tab!=='bulletins')return vcBp(ch);const TB=tabsFor(typ(ch),ch);if(!TB.bulletins)return vcBp(ch);return rubHead(ch)+bottomNav(ch)+tBulletins(ch)};

/* ---------- conversation avec l'employé ---------- */
function empConv(e){
  if(typeof TEAM!=='undefined'&&TEAM.on){const u=(TEAM.users||[]).find(u=>u.employeId===e.id&&u.actif!==false&&!u.remplacePar);if(u)return{conv:dmId(u.uid),membres:['gerant',u.uid]}}
  const it=(S.intervenants||[]).find(i=>i.employeId===e.id&&i.actif!==false);if(it)return{conv:'int:'+it.id,membres:['gerant',it.id]};
  return{conv:'emp:'+e.id,membres:['gerant','emp:'+e.id]}}
const clBp=convList;convList=function(){const C=clBp(),have=new Set(C.map(c=>c.id)),M={};
  S.messages.forEach(m=>{const k=convOf(m);if(k.startsWith('emp:')&&!have.has(k))(M[k]=M[k]||[]).push(m)});
  Object.entries(M).forEach(([k,L])=>{const e=S.employes.find(x=>x.id===k.slice(4));L.sort((a,b)=>num(a.ts)-num(b.ts));
    C.push({id:k,ic:'👷',nom:e?e.nom:'Employé',sub:(e&&e.metier?e.metier+' · ':'')+'Message privé',last:L[L.length-1],n:L.length,nonlus:L.filter(m=>m.uid!==myUid()&&num(m.ts)>num(lsG('ge_lu_'+k,'0'))).length})});
  return C.sort((a,b)=>(b.last?num(b.last.ts):0)-(a.last?num(a.last.ts):0)||(a.id==='general'?-1:b.id==='general'?1:0))};
const ceBp=cvEnvoyer;cvEnvoyer=async function(){const id=ui.conv;if(!String(id).startsWith('emp:'))return ceBp();
  const i=$('#cvIn'),t=(i&&i.value||'').trim();if(!t)return;ui.cvDraft='';i.value='';ui.cvFocus=true;
  try{await save('messages',{conv:id,texte:t,uid:myUid(),auteur:myNom(),date:today(),ts:Date.now(),chantierId:'_dm',membres:['gerant',id]})}catch(e){}};

/* ---------- le bulletin dans la messagerie ---------- */
function ficheTexte(f,e){const ch=S.chantiers.find(c=>c.id===f.chantierId);
  return [`🧾 Fiche de paie ${f.numero}`,`${e.nom}${e.metier?' · '+e.metier:''}`,`Période du ${dfr(f.debut)} au ${dfr(f.fin)}`,`Lieu : ${ch?ch.nom:lieuNom(f.chantierId||'bureau')}`,'',
    ...(f.L||[]).map(l=>`• ${l[0]}${l[1]?' ('+l[1]+' × '+l[2]+')':''} : ${F(l[3])}`),`Salaire brut : ${F(f.brut)}`,...(f.R||[]).map(r=>`− ${r[0]} : ${F(r[1])}`),
    `NET ${f.statut==='payee'?'PAYÉ':'À PAYER'} : ${F(f.net)}`,num(f.report)?`Reste d'avance reporté sur la prochaine paie : ${F(f.report)}`:'',f.statut==='payee'?`Payé le ${dfr(f.datePaie)} par ${f.modePaie||''}${e.momo?' ('+e.momo+')':''}`:'','',`${ent().nom||''}`].filter((x,i,a)=>x!==''||a[i-1]!=='').join('\n').trim()}
async function ficheEnvoyer(fid,silent){const f=S.fiches.find(x=>x.id===fid),e=f&&S.employes.find(x=>x.id===f.employeId);if(!f||!e)return;
  const c=empConv(e),ts=Date.now();
  const mid=await save('messages',{conv:c.conv,chantierId:'_dm',membres:c.membres,texte:ficheTexte(f,e),ficheId:f.id,uid:myUid(),auteur:myNom(),date:today(),ts});
  const g=S.fiches.find(x=>x.id===fid)||f;await save('fiches',{...g,envoi:{date:today(),ts,conv:c.conv,msgId:mid,n:num((g.envoi||{}).n)+1}});
  if(typeof log==='function')try{log(f.chantierId,`Fiche de paie ${f.numero} envoyée à ${e.nom}`)}catch(_){}
  if(!silent)toast(`Fiche envoyée à ${e.nom}`)}
/* pièce jointe « bulletin » dans la bulle */
const vvBp=viewConv;viewConv=function(){let h=vvBp();
  S.messages.filter(m=>m.ficheId&&convOf(m)===ui.conv).forEach(m=>{const f=S.fiches.find(x=>x.id===m.ficheId),k=`msgActions('${m.id}')`,i=h.indexOf(k);if(i<0)return;const j=h.indexOf('<div class="bh">',i);if(j<0)return;
    const att=`<div class="batt" onclick="event.stopPropagation();${f?`pdfFiche('${f.id}')`:`toast('Fiche supprimée')`}"><span class="bi2">📄</span><span><b>Bulletin ${esc(f?f.numero:'')}</b><small>PDF · net ${f?F(f.net):''}</small></span></div>`;
    h=h.slice(0,j)+att+h.slice(j)});return h};
const maBp=msgActions;msgActions=function(id){maBp(id);const m=S.messages.find(x=>x.id===id);if(!m||!m.ficheId)return;const g=document.querySelector('#modalRoot .actgrid');
  if(g)g.insertAdjacentHTML('afterbegin',`<button class="actb" onclick="closeForm();pdfFiche('${m.ficheId}')"><span class="ai">📄</span><b>Bulletin PDF</b><small>Ouvrir ou enregistrer</small></button>`)};

/* ---------- validation = paiement + envoi ---------- */
fichePayer=async function(fid){const f=S.fiches.find(x=>x.id===fid),e=f&&S.employes.find(x=>x.id===f.employeId);if(!f)return;
  openForm({title:`✅ Valider la paie de ${e?e.nom:''} – ${F(f.net)}`,values:{date:today(),mode:(e&&e.momoOp)||'Espèces',env:true},
    fields:[{k:'date',label:'Date du paiement',type:'date'},{k:'mode',label:'Payé par',type:'select',opts:MODES_PAIE.map(m=>[m,m])},{type:'html',html:e&&e.momo?`<div class="note">Numéro : <b>${esc(e.momo)}</b></div>`:''},
      {k:'env',label:"Envoyer la fiche de paie à l'employé (messagerie de l'application)",type:'checkbox'},
      {type:'html',html:`<div class="note">Une copie est classée dans le projet : <b>${esc(lieuNom(f.chantierId||'bureau'))} › Équipe › Fiches de paie</b>.</div>`}],submit:'Valider et payer',
    onSave:async o=>{const pid=await save('paiements',{employeId:f.employeId,chantierId:f.chantierId,date:o.date,montant:Math.max(0,num(f.net)),jours:f.nbj||'',mode:o.mode,objet:`Fiche de paie ${f.numero} (du ${dfr(f.debut)} au ${dfr(f.fin)})`,type:'salaire',ficheId:f.id});
      await save('fiches',{...f,statut:'payee',datePaie:o.date,paiementId:pid,modePaie:o.mode,validee:{date:today(),par:myNom()}});await avReport(f.id);
      if(o.env){await new Promise(r=>setTimeout(r,30));await ficheEnvoyer(f.id,true);toast(`Paie validée · fiche envoyée à ${e?e.nom:"l'employé"}`)}else toast('Paie validée')}})};
/* bouton « Envoyer » dans la fiche ouverte */
const foBp=ficheOuvrir;ficheOuvrir=function(eid,d1,d2){foBp(eid,d1,d2);const f=S.fiches.find(x=>x.employeId===eid&&x.debut===d1&&x.fin===d2);if(!f)return;
  const b=[...document.querySelectorAll('#modalRoot button')].find(x=>/pdfFiche\(/.test(x.getAttribute('onclick')||''));if(!b)return;
  const p=[...b.parentNode.querySelectorAll('button')].find(x=>/fichePayer\(/.test(x.getAttribute('onclick')||''));if(p)p.textContent='✅ Valider et payer '+F(f.net);const nt=[...document.querySelectorAll('#modalRoot .note')].find(x=>/« Payer »/.test(x.textContent));if(nt)nt.textContent="« Enregistrer » fige la fiche ; « Valider et payer » enregistre le paiement, envoie le bulletin à l'employé et en garde une copie dans le projet.";
  if(f.statut==='payee')b.insertAdjacentHTML('afterend',`<button type="button" class="btn sec small" onclick="ficheEnvoyer('${f.id}')">📤 ${f.envoi?'Renvoyer':'Envoyer'} à l'employé</button>`);
  if(f.envoi)b.parentNode.insertAdjacentHTML('afterend',`<div class="sm mute" style="margin:-4px 0 8px">✓ Envoyée le ${dfr(f.envoi.date)} dans la messagerie</div>`)};

/* ---------- onglet du projet ---------- */
function tBulletins(ch){const E=S.employes.filter(e=>e.chantierId===ch.id&&e.actif!==false),cnt={};E.forEach(e=>{const p=e.periode||'semaine';cnt[p]=(cnt[p]||0)+1});
  const pers=Object.keys(PERIODES).filter(p=>cnt[p]),per=ui.bpPer&&cnt[ui.bpPer]?ui.bpPer:(pers.sort((a,b)=>cnt[b]-cnt[a])[0]||'semaine'),[d1,d2]=ui.bpP&&ui.bpPer===per?ui.bpP:periodeDe(per);
  const A=S.fiches.filter(f=>f.chantierId===ch.id).sort((a,b)=>(b.fin||'').localeCompare(a.fin||'')||num(b.cree)-num(a.cree)),payees=A.filter(f=>f.statut==='payee');
  let h=`<div class="card"><div class="grid2"><div class="kpi"><div class="l">Fiches validées</div><div class="v">${payees.length}</div></div><div class="kpi"><div class="l">Total net payé</div><div class="v">${F(sum(payees,f=>num(f.net)))}</div></div></div>
    <div class="sm mute" style="margin-top:6px">Toutes les fiches de paie de ce projet restent ici. Valider une fiche enregistre le paiement, envoie le bulletin à l'ouvrier dans la messagerie et en garde la copie.</div></div>`;
  h+=`<div class="card"><h3>À préparer et valider</h3>`;
  if(!E.length)h+=`<div class="empty sm">Aucun ouvrier rattaché à ce chantier. Ajoute-les dans <b>Équipe › Ouvriers</b> avec leur mode et rythme de paie.</div>`;
  else{if(pers.length>1)h+=`<div class="seg">${pers.map(k=>`<button class="${per===k?'on':''}" onclick="ui.bpPer='${k}';ui.bpP=null;render()">${PERIODES[k].replace('Chaque ','').replace('Toutes les deux semaines','2 semaines')}</button>`).join('')}</div>`;
    h+=`<div class="row" style="gap:6px;margin:4px 0 8px"><button class="btn ghost small" onclick="ui.bpPer='${per}';ui.bpP=periodeDe('${per}',addDays('${d1}',-1));render()">‹</button><b style="align-self:center">Du ${dfr(d1)} au ${dfr(d2)}</b><button class="btn ghost small" onclick="ui.bpPer='${per}';ui.bpP=periodeDe('${per}',addDays('${d2}',1));render()">›</button></div>`;
    const L=E.filter(e=>(e.periode||'semaine')===per);
    h+=`<div class="list">`+L.map(e=>{const f=S.fiches.find(x=>x.employeId===e.id&&x.debut===d1&&x.fin===d2),c=f||ficheCalc(e,d1,d2);
      const st=!f?[dot('mute'),'brouillon — touche pour préparer']:f.statut!=='payee'?[dot('warn'),'enregistrée — à valider']:[dot('ok'),`validée le ${dfr(f.datePaie)}${f.envoi?' · envoyée ✓':''}`];
      const avT=sum((c.R||[]).filter(r=>/^Avance|^Reste d'avance/.test(r[0])),r=>num(r[1]));
      return `<div class="it click" onclick="ficheOuvrir('${e.id}','${d1}','${d2}')"><div class="main"><div class="t">${st[0]} ${esc(e.nom)}</div><div class="s">${esc(e.metier||'')} · ${st[1]}</div>${avT?`<div class="s">💸 Avance déduite : ${F(avT)} · brut ${F(c.brut)}</div>`:''}${num(c.report)?`<div class="s" style="color:var(--warn)">Avance plus forte que la paie : ${F(c.report)} reporté sur la prochaine paie</div>`:''}</div><div class="amt">${F(c.net)}<small>net</small>${f&&f.statut!=='payee'?`<button class="btn small" onclick="event.stopPropagation();fichePayer('${f.id}')">✅ Valider</button>`:''}</div></div>`}).join('')+`</div>`}
  h+=`</div>`;
  h+=`<div class="card"><h3>📁 Fiches de paie du projet</h3><div class="sm mute" style="margin:-6px 0 8px">Ta copie de chaque bulletin, la plus récente en premier.</div>`;
  if(!A.length)h+=`<div class="empty sm">Aucune fiche pour l'instant.</div>`;
  else{const G={};A.forEach(f=>{const k=(f.fin||'').slice(0,7);(G[k]=G[k]||[]).push(f)});
    h+=Object.entries(G).map(([k,L])=>`<div class="sm mute" style="margin:10px 0 2px;text-transform:capitalize">${k?new Date(k+'-15').toLocaleDateString('fr-FR',{month:'long',year:'numeric'}):''}</div><div class="list">${L.map(f=>{const e=S.employes.find(x=>x.id===f.employeId)||{};
      return `<div class="it"><div class="main click" onclick="pdfFiche('${f.id}')"><div class="t">${esc(e.nom||'Employé supprimé')} · ${esc(f.numero)}</div><div class="s">Du ${dfr(f.debut)} au ${dfr(f.fin)}</div><div class="s">${f.statut==='payee'?chip('payée','ok'):chip('à valider','warn')} ${f.envoi?chip('envoyée le '+dfr(f.envoi.date),'blue'):f.statut==='payee'?chip('non envoyée',''):''}</div></div>
        <div class="amt">${F(num(f.net))}<div class="row" style="gap:2px;justify-content:flex-end"><button class="btn ghost small" title="PDF" onclick="pdfFiche('${f.id}')">📄</button>${f.statut==='payee'?`<button class="btn ghost small" title="Envoyer à l'employé" onclick="ficheEnvoyer('${f.id}')">📤</button>`:''}${f.envoi?`<button class="btn ghost small" title="Voir la conversation" onclick="ouvrirConv('${f.envoi.conv}')">💬</button>`:''}</div></div></div>`}).join('')}</div>`).join('')}
  return h+`</div>`}

/* ---------- valider toute l'équipe d'un coup ---------- */
async function ficheCreer(e,d1,d2){const f=S.fiches.find(x=>x.employeId===e.id&&x.debut===d1&&x.fin===d2);if(f)return f.id;
  const c=ficheCalc(e,d1,d2,{}),n='BP-'+d1.replace(/-/g,'').slice(2)+'-'+(S.fiches.length+1);
  const id=await save('fiches',{numero:n,employeId:e.id,chantierId:e.chantierId||'bureau',debut:d1,fin:d2,x:{},brut:c.brut,ret:c.ret,net:c.net,L:c.L,R:c.R,pat:c.pat,nbj:c.nbj,hrs:c.hrs,statut:'a_payer',datePaie:''});
  for(const tid of c.taches||[]){const t=S.taches.find(z=>z.id===tid);if(t&&t.ficheId!==id)await save('taches',{...t,ficheId:id})}
  for(const pid of c.av||[]){const p=S.paiements.find(z=>z.id===pid);if(p&&p.ficheId!==id)await save('paiements',{...p,ficheId:id})}return id}
const bpMode=m=>{if(!m)return'Espèces';if(MODES_PAIE.includes(m))return m;const w=String(m).split(' ')[0].toLowerCase();return MODES_PAIE.find(x=>x.toLowerCase().startsWith(w))||'Espèces'};
function bpEquipe(cid,per,d1,d2){const ch=S.chantiers.find(c=>c.id===cid),E=S.employes.filter(e=>e.chantierId===cid&&e.actif!==false&&(e.periode||'semaine')===per);
  const R=E.map(e=>{const f=S.fiches.find(x=>x.employeId===e.id&&x.debut===d1&&x.fin===d2);return{e,f,c:f||ficheCalc(e,d1,d2),mode:bpMode((f&&f.modePaie)||e.momoOp)}}).filter(x=>!(x.f&&x.f.statut==='payee'));
  if(!R.length){toast('Toutes les fiches de la période sont déjà validées');return}
  const tot=()=>{const M={};let t=0,n=0;document.querySelectorAll('#bpL .bpr').forEach(r=>{if(!r.querySelector('input').checked)return;const m=r.querySelector('select').value,v=num(r.dataset.n);M[m]=(M[m]||0)+v;t+=v;n++});
    const z=$('#bpT');if(z)z.innerHTML=`${Object.entries(M).map(([m,v])=>`<div class="r"><span>${esc(m)}</span><b>${F(v)}</b></div>`).join('')}<div class="r big"><span>Total à sortir · ${n} personne(s)</span><b>${F(t)}</b></div>`};
  window.bpTot=tot;
  openForm({title:`✅ Valider la paie de l'équipe`,values:{date:today(),env:true},
    fields:[{type:'html',html:`<div class="sm mute" style="margin-bottom:8px">${esc(ch?ch.nom:'')} · du ${dfr(d1)} au ${dfr(d2)}. Décoche ceux à ne pas payer maintenant, et choisis le moyen de paiement de chacun.</div>
      <div id="bpL" class="list">${R.map(x=>`<div class="it bpr" data-e="${x.e.id}" data-n="${x.c.net}"><div class="main"><label class="chk" style="margin:0"><input type="checkbox" ${x.c.brut>0?'checked':''} onchange="bpTot()"> <b>${esc(x.e.nom)}</b></label><div class="s">${esc(x.e.metier||'')}${x.e.mode==='jour'?' · '+N(x.c.nbj,1)+' j':''}${x.f?' · fiche enregistrée':' · fiche créée à la validation'}${x.e.momo?' · '+esc(x.e.momo):''}</div>${(()=>{const a=sum((x.c.R||[]).filter(r=>/^Avance|^Reste d'avance/.test(r[0])),r=>num(r[1]));return a?`<div class="s">💸 brut ${F(x.c.brut)} − avance ${F(a)}${num(x.c.report)?` · ${F(x.c.report)} reporté`:''}</div>`:''})()}
        <select style="margin-top:4px;max-width:180px" onchange="bpTot()">${MODES_PAIE.map(m=>`<option ${m===x.mode?'selected':''}>${esc(m)}</option>`).join('')}</select></div><div class="amt">${F(x.c.net)}<small>net</small></div></div>`).join('')}</div>
      <div class="res" id="bpT" style="margin:10px 0"></div>`},
      {k:'date',label:'Date du paiement',type:'date'},{k:'env',label:"Envoyer à chacun sa fiche de paie (messagerie de l'application)",type:'checkbox'},
      {type:'html',html:`<div class="note">Les copies sont classées dans ce projet, onglet Fiches de paie.</div>`}],submit:'Valider et payer',collect:fm=>({sel:[...fm.querySelectorAll('#bpL .bpr')].filter(r=>r.querySelector('input').checked).map(r=>({eid:r.dataset.e,mode:r.querySelector('select').value}))}),
    onSave:async o=>{const sel=o.sel||[];
      if(!sel.length){toast('Coche au moins une personne');return false}let n=0,t=0;
      for(const s of sel){const e=S.employes.find(x=>x.id===s.eid);if(!e)continue;const fid=await ficheCreer(e,d1,d2);await new Promise(r=>setTimeout(r,20));const f=S.fiches.find(x=>x.id===fid);if(!f||f.statut==='payee')continue;
        const pid=await save('paiements',{employeId:f.employeId,chantierId:f.chantierId,date:o.date,montant:Math.max(0,num(f.net)),jours:f.nbj||'',mode:s.mode,objet:`Fiche de paie ${f.numero} (du ${dfr(f.debut)} au ${dfr(f.fin)})`,type:'salaire',ficheId:f.id});
        await save('fiches',{...f,statut:'payee',datePaie:o.date,paiementId:pid,modePaie:s.mode,validee:{date:today(),par:myNom()}});await avReport(f.id);
        if(o.env){await new Promise(r=>setTimeout(r,20));await ficheEnvoyer(f.id,true)}n++;t+=num(f.net)}
      if(typeof log==='function')log(cid,`Paie de l'équipe validée (${n} fiche(s), ${F(t)}) pour la période du ${dfr(d1)} au ${dfr(d2)}`);
      toast(`${n} fiche(s) validée(s) · ${F(t)}${o.env?' · envoyées':''}`)}});
  setTimeout(tot,0)}
const tbBp=tBulletins;tBulletins=function(ch){let h=tbBp(ch);const E=S.employes.filter(e=>e.chantierId===ch.id&&e.actif!==false);if(!E.length)return h;
  const m=h.match(/ui\.bpPer='(\w+)';ui\.bpP=periodeDe\('\w+',addDays\('([\d-]+)',-1\)\).*?addDays\('([\d-]+)',1\)/);
  let per,d1,d2;if(m){[,per,d1,d2]=m}else{per=(E[0].periode||'semaine');[d1,d2]=periodeDe(per)}
  const reste=E.filter(e=>(e.periode||'semaine')===per&&!S.fiches.some(f=>f.employeId===e.id&&f.debut===d1&&f.fin===d2&&f.statut==='payee')).length;
  const btn=reste?`<button class="btn block" style="margin-top:10px" onclick="bpEquipe('${ch.id}','${per}','${d1}','${d2}')">✅ Valider toute l'équipe (${reste})</button>`:`<div class="sm" style="margin-top:10px;color:var(--ok)">✓ Toute l'équipe est payée pour cette période.</div>`;
  const k='<div class="card"><h3>📁';const i=h.indexOf(k);return i<0?h:h.slice(0,i).replace(/<\/div>\s*$/,btn+'</div>')+avCard(ch)+h.slice(i)};

/* ---------- avances sur salaire ---------- */
/* calcul : ajoute le reste d'avance reporté d'une fiche précédente ; une paie ne descend jamais sous 0 */
const fcBp=ficheCalc;ficheCalc=function(e,d1,d2,x={}){const c=fcBp(e,d1,d2,x);
  const P=S.fiches.filter(f=>f.employeId===e.id&&num(f.report)>0&&f.fin<d1&&f.id!==x.id&&(!f.reportPris||f.reportPris===x.id));
  P.forEach(f=>c.R.push([`Reste d'avance reporté (${f.numero})`,num(f.report)]));
  if(P.length){c.ret=Math.round(sum(c.R,r=>num(r[1])));c.net=Math.round(c.brut-c.ret)}
  c.reportDe=P.map(f=>f.id);c.report=0;if(c.net<0){c.report=-c.net;c.net=0}return c};
async function avReport(fid){const f=S.fiches.find(x=>x.id===fid),e=f&&S.employes.find(x=>x.id===f.employeId);if(!f||!e)return;
  const c=ficheCalc(e,f.debut,f.fin,{...(f.x||{}),id:f.id});
  for(const pid of c.reportDe||[]){const g=S.fiches.find(x=>x.id===pid);if(g&&g.reportPris!==f.id)await save('fiches',{...g,reportPris:f.id})}
  for(const pid of c.av||[]){const p=S.paiements.find(z=>z.id===pid);if(p&&p.ficheId!==f.id)await save('paiements',{...p,ficheId:f.id})}
  const g=S.fiches.find(x=>x.id===fid)||f;await save('fiches',{...g,R:c.R,ret:c.ret,net:c.net,report:c.report})}
const avEtat=p=>{const f=p.ficheId&&S.fiches.find(x=>x.id===p.ficheId);return f&&f.statut==='payee'?{ok:1,t:`déduite sur ${f.numero} (paie du ${dfr(f.debut)} au ${dfr(f.fin)})`}:{ok:0,t:'à déduire sur la prochaine paie'}};
function avCard(ch){const L=S.paiements.filter(p=>p.type==='avance'&&(p.chantierId===ch.id||S.employes.some(e=>e.id===p.employeId&&e.chantierId===ch.id))).sort((a,b)=>(b.date||'').localeCompare(a.date||'')||num(b.cree)-num(a.cree));
  const ouv=L.filter(p=>!avEtat(p).ok),fait=L.filter(p=>avEtat(p).ok),nm=id=>(S.employes.find(e=>e.id===id)||{}).nom||'Employé supprimé';
  const row=p=>{const st=avEtat(p);return `<div class="it click" onclick="formAvance('${ch.id}',null,'${p.id}')"><div class="main"><div class="t">${dot(st.ok?'ok':'warn')} ${esc(nm(p.employeId))}</div><div class="s">${dfr(p.date)} · ${esc(p.mode||'')}${p.motif?' · '+esc(p.motif):''}</div><div class="s">${esc(st.t)}</div></div><div class="amt">${F(num(p.montant))}</div></div>`};
  return `<div class="card"><div class="row between"><h3 style="margin:0">💸 Avances sur salaire</h3><button class="btn small" onclick="formAvance('${ch.id}')">+ Avance</button></div>
    <div class="sm mute" style="margin:4px 0 8px">Chaque avance est retirée automatiquement de la prochaine fiche de paie de la personne.</div>
    ${ouv.length?`<div class="list">${ouv.map(row).join('')}</div><div class="row between" style="margin-top:6px"><b>À déduire</b><b>${F(sum(ouv,p=>num(p.montant)))}</b></div>`:'<div class="empty sm">Aucune avance en attente.</div>'}
    ${fait.length?`<details class="oreg" style="margin-top:8px"><summary>Avances déjà déduites (${fait.length})</summary><div class="list">${fait.map(row).join('')}</div></details>`:''}</div>`}
function formAvance(cid,eid,pid){const p=pid&&S.paiements.find(x=>x.id===pid),E=S.employes.filter(e=>e.chantierId===cid&&e.actif!==false);
  if(!E.length&&!p){toast("Ajoute d'abord les ouvriers du chantier (Équipe › Ouvriers).");return}
  if(p&&avEtat(p).ok){toast('Avance déjà déduite sur une fiche payée : elle ne peut plus être modifiée.');return}
  const e0=S.employes.find(e=>e.id===(p?p.employeId:eid||E[0].id));
  openForm({title:p?'💸 Modifier l\'avance':'💸 Avance sur salaire',values:p?{...p,env:false}:{employeId:e0.id,date:today(),mode:bpMode(e0.momoOp),env:true},
    fields:[{k:'employeId',label:'Personne',type:'select',opts:(p&&!E.some(e=>e.id===p.employeId)?[e0,...E]:E).filter(Boolean).map(e=>[e.id,e.nom+(e.metier?' ('+e.metier+')':'')])},{k:'date',label:'Jour de l\'avance',type:'date'},
      {k:'montant',label:'Montant (FCFA)',type:'number',req:true},{k:'aInfo',type:'info'},{k:'mode',label:'Donnée par',type:'select',opts:MODES_PAIE.map(m=>[m,m])},{k:'motif',label:'Motif (facultatif)',ph:'ex. transport, santé, famille…'},
      {k:'env',label:"Prévenir la personne dans la messagerie (avec le montant et la paie où il sera déduit)",type:'checkbox'}],
    submit:p?'Enregistrer':'Enregistrer l\'avance',
    onInput:(fm,o)=>{const e=S.employes.find(x=>x.id===o.employeId),z=fm.querySelector('#aInfo');if(!e||!z)return;const[d1,d2]=periodeDe(e.periode||'semaine',o.date||today()),c=ficheCalc(e,d1,d2,{});
      const deja=sum(S.paiements.filter(q=>q.type==='avance'&&q.employeId===e.id&&q.id!==pid&&!avEtat(q).ok),q=>num(q.montant)),m=num(o.montant);
      z.innerHTML=`<div class="res"><div class="r"><span>Paie du ${dfr(d1)} au ${dfr(d2)} (brut jusqu'ici)</span><b>${F(c.brut)}</b></div>${deja?`<div class="r"><span>Avances déjà en attente</span><b>${F(deja)}</b></div>`:''}<div class="r big"><span>Il restera à lui verser</span><b style="color:${c.brut-deja-m<0?'var(--warn)':'inherit'}">${F(Math.max(0,c.brut-deja-m))}</b></div>${c.brut-deja-m<0?`<div class="sm" style="color:var(--warn)">L'avance dépasse ce qu'il a gagné cette période : le reste sera retiré de la paie suivante.</div>`:''}</div>`},
    onDelete:p?async()=>{await del('paiements',p.id);toast('Avance supprimée')}:null,
    onSave:async o=>{const e=S.employes.find(x=>x.id===o.employeId);const v={...(p||{}),type:'avance',employeId:o.employeId,chantierId:cid,date:o.date,montant:num(o.montant),mode:o.mode,motif:o.motif,objet:'Avance sur salaire'+(o.motif?' – '+o.motif:'')};
      const id=await save('paiements',v);if(typeof log==='function')log(cid,`Avance de ${F(num(o.montant))} à ${e?e.nom:''}`);
      if(o.env&&e){const[d1,d2]=periodeDe(e.periode||'semaine',o.date),c=empConv(e);
        await save('messages',{conv:c.conv,chantierId:'_dm',membres:c.membres,texte:`💸 Avance sur salaire\n${e.nom}\nMontant : ${F(num(o.montant))}\nDonnée le ${dfr(o.date)} par ${o.mode}${o.motif?'\nMotif : '+o.motif:''}\n\nCe montant sera déduit de ta paie du ${dfr(d1)} au ${dfr(d2)}.\n\n${ent().nom||''}`.trim(),avanceId:id,uid:myUid(),auteur:myNom(),date:today(),ts:Date.now()})}
      toast(p?'Avance modifiée':`Avance enregistrée${o.env?' · '+(e?e.nom:'')+' prévenu(e)':''}`)}})}
/* bouton ➕ du chantier */
const asBp=actSheet;actSheet=function(){asBp();const g=document.querySelector('#modalRoot .actgrid'),ch=S.chantiers.find(c=>c.id===ui.cid);if(!g||!ch||!tabsFor(typ(ch),ch).bulletins)return;
  g.insertAdjacentHTML('beforeend',`<button class="actb" onclick="closeForm();formAvance('${ch.id}')"><span class="ai">💸</span><b>Avance de paie</b><small>Argent donné à un ouvrier avant la paie</small></button>`)};
