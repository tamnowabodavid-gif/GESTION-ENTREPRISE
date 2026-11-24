/* gantt.js — chronologie de chaque étape du projet (diagramme de Gantt) : prévu / réel, avancement, retard, aujourd'hui ;
   au toucher : la progression de l'étape dans le temps et ses sous-étapes datées */
const dd=(a,b)=>Math.round((new Date(b)-new Date(a))/864e5);
function ganttData(cid){const ch=S.chantiers.find(c=>c.id===cid)||{},ct=typeof contratOf==='function'&&contratOf(cid),td=today();
  const E=(typeof etTri==='function'?etTri(etapesOf(cid)):etapesOf(cid));if(!E.length)return null;
  const H=byC('historique',cid).filter(h=>h.etapeId&&h.av!=null&&h.date).sort((a,b)=>(a.date+(a.maj||'')).localeCompare(b.date+(b.maj||'')));
  const cr=ch.cree?new Date(num(ch.cree)).toISOString().slice(0,10):td;
  let d0=(ct&&ct.debut)||ch.debut||[...E.map(e=>e.debut).filter(Boolean),...H.map(h=>h.date)].sort()[0]||cr;
  let d1=ch.fin||(ct&&num(ct.delai)?addDays(d0,Math.round(num(ct.delai)*30.4)):null)||[...E.map(e=>e.fin).filter(Boolean)].sort().pop()||addDays(d0,180);if(d1<=d0)d1=addDays(d0,90);
  let cur=d0;const rest=i=>E.slice(i).filter(e=>!(e.statut==='fini'||num(e.avancement)>=100)&&!e.finPrevue).length||1;
  const R=E.map((e,i)=>{const h=H.filter(x=>x.etapeId===e.id),deb1=h.find(x=>num(x.av)>0),fini=e.statut==='fini'||num(e.avancement)>=100;
    const sous=(e.sous||[]).filter(s=>s.fait&&s.date).map(s=>s.date).sort();
    const rDeb=e.debut||(deb1&&deb1.date)||sous[0]||null,rFin=fini?(e.fin||(h.length&&h[h.length-1].date)||td):null;
    /* prévu : dates saisies ; sinon, à la suite des étapes précédentes, en partageant le temps restant jusqu'à la fin du projet */
    let pDeb=e.debutPrevu||null,pFin=e.finPrevue||(!fini&&e.fin)||null,est=false,noPlan=false;
    if(!pFin){if(fini){pDeb=pDeb||rDeb||cur;pFin=rFin;noPlan=true}else{pDeb=pDeb||rDeb||cur;pFin=addDays(pDeb,Math.max(7,Math.round(dd(pDeb,d1)/rest(i))));est=true}}
    if(!pDeb)pDeb=rDeb&&rDeb<pFin?rDeb:(cur<pFin?cur:addDays(pFin,-14));if(pDeb>pFin)pDeb=addDays(pFin,-7);
    cur=[cur,pFin,rFin].filter(Boolean).sort().pop();
    const av=Math.round(num(e.avancement)),retard=!fini&&!est&&pFin<td?dd(pFin,td):fini&&!noPlan&&rFin>pFin?dd(pFin,rFin):0;
    const st=fini?'fini':av>0||rDeb?'encours':'afaire';
    return{e,av,st,rDeb,rFin,pDeb,pFin,est,noPlan,retard,h,sous:(e.sous||[])}});
  const all=[d0,d1,td,...R.flatMap(r=>[r.pDeb,r.pFin,r.rDeb,r.rFin].filter(Boolean))].sort();return{R,a:all[0],b:all[all.length-1],td,d0,d1}}
let ganttHtml=function(cid,opt={}){const G=ganttData(cid);if(!G)return'';const {R,a,b,td}=G,T=Math.max(1,dd(a,b)),x=d=>Math.max(0,Math.min(100,dd(a,d)/T*100));
  const mois=[];{let m=new Date(a.slice(0,7)+'-01');const fin=new Date(b);while(m<=fin&&mois.length<40){const s=m.toISOString().slice(0,10);if(s>=a)mois.push(s);m.setMonth(m.getMonth()+1)}}
  const pas=Math.ceil(mois.length/6);
  const fin=R.filter(r=>r.st==='fini').length,enc=R.filter(r=>r.st==='encours').length,ret=R.filter(r=>r.retard&&r.st!=='fini').length;
  const glob=Math.round(sum(R,r=>r.av)/R.length);
  return `<div class="card gantt"><div class="row between"><h3 style="margin:0">📅 Chronologie des étapes</h3><span class="sm"><b>${glob} %</b></span></div>
    <div class="sm mute" style="margin:2px 0 8px">${fin} terminée(s) · ${enc} en cours · ${R.length-fin-enc} à venir${ret?` · <b style="color:var(--bad,#b42318)">${ret} en retard</b>`:''}${opt.client?'':' · touche une étape pour voir sa progression'}</div>
    <div class="gx"><div class="gmo">${mois.map((m,i)=>i%pas?'':`<span style="left:${x(m)}%">${new Date(m).toLocaleDateString('fr-FR',{month:'short',year:'2-digit'})}</span>`).join('')}</div>
    <div class="gbody"><div class="gtd" style="left:${x(td)}%"><span>Aujourd'hui</span></div>
    ${R.map((r,i)=>{const pl=`left:${x(r.pDeb)}%;width:${Math.max(1.2,x(r.pFin)-x(r.pDeb))}%`,rd=r.rDeb?`left:${x(r.rDeb)}%;width:${Math.max(1.2,x(r.rFin||td)-x(r.rDeb))}%`:'';
      const lab=r.st==='fini'?`✓ terminée le ${dfr(r.rFin)}`:r.st==='encours'?`${r.av} % · fin prévue ${dfr(r.pFin)}${r.est?' (estimée)':''}`:`prévue du ${dfr(r.pDeb)} au ${dfr(r.pFin)}${r.est?' (estimé)':''}`;
      return `<div class="grow ${r.st}${r.retard&&r.st!=='fini'?' late':''}" ${opt.client?'':`onclick="ganttDetail('${r.e.id}')"`}><div class="glab"><b>${esc(r.e.nom)}</b><small>${esc(lab)}${r.retard?` · <span class="glate">${r.st==='fini'?'+':''}${r.retard} j de retard</span>`:''}</small></div>
        <div class="gtrack">${r.noPlan?'':`<i class="gplan${r.est?' est':''}" style="${pl}"></i>`}${rd?`<i class="greal" style="${rd}"><b style="width:${r.st==='fini'?100:r.av}%"></b></i>`:''}</div></div>`}).join('')}</div></div>
    <div class="gleg"><span><i class="gplan"></i> Prévu</span><span><i class="greal"><b style="width:100%"></b></i> Réalisé</span><span><i class="greal"><b style="width:45%"></b></i> En cours (%)</span><span><i class="gtdl"></i> Aujourd'hui</span></div>
    ${R.some(r=>r.est)?`<div class="note" style="margin-top:6px">Les dates hachurées sont estimées d'après le délai du projet. Indique les dates prévues dans chaque étape (✏️) pour un planning exact.</div>`:''}</div>`};
/* détail d'une étape : courbe de progression + sous-étapes datées */
function ganttDetail(eid){const e=S.etapes.find(x=>x.id===eid);if(!e)return;const G=ganttData(e.chantierId),r=G&&G.R.find(z=>z.e.id===eid);if(!r)return;
  const pts=[];if(r.rDeb)pts.push([r.rDeb,0]);r.h.forEach(h=>pts.push([h.date,num(h.av)]));if(!r.h.length&&r.av)pts.push([today(),r.av]);if(r.st!=='fini'&&pts.length)pts.push([today(),r.av]);
  const P=[...new Map(pts.map(p=>[p[0],p])).values()].sort((a,b)=>a[0].localeCompare(b[0]));
  let svg='';if(P.length>1){const a=P[0][0],b=[P[P.length-1][0],r.pFin].sort().pop(),T=Math.max(1,dd(a,b)),X=d=>14+dd(a,d)/T*292,Y=v=>116-v*1.0;
    const pf=X(r.pFin);svg=`<svg viewBox="0 0 320 136" class="gsvg" role="img" aria-label="Progression de l'étape dans le temps">
      ${[0,50,100].map(v=>`<line x1="14" x2="306" y1="${Y(v)}" y2="${Y(v)}" class="gg"/><text x="2" y="${Y(v)+3}" class="gt">${v}</text>`).join('')}
      <line x1="${pf}" x2="${pf}" y1="12" y2="116" class="gpf"/><text x="${Math.min(pf,270)}" y="10" class="gt">fin prévue</text>
      <polyline points="${P.map(p=>X(p[0])+','+Y(p[1])).join(' ')}" class="gpl"/>${P.map(p=>`<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="4" class="gpc"><title>${dfr(p[0])} : ${Math.round(p[1])} %</title></circle>`).join('')}
      <text x="14" y="132" class="gt">${dfr(a)}</text><text x="306" y="132" class="gt" text-anchor="end">${dfr(b)}</text></svg>`}
  const S_=r.sous;
  $('#modalRoot').innerHTML=`<div class="modal-bg" onclick="if(event.target===this)closeForm()"><div class="modal"><h2>${esc(e.nom)}</h2>
    <div class="res"><div class="r"><span>Avancement</span><b>${r.av} %</b></div><div class="r"><span>Prévu</span><b>${dfr(r.pDeb)} → ${dfr(r.pFin)}${r.est?' (estimé)':''}</b></div><div class="r"><span>Réel</span><b>${r.rDeb?dfr(r.rDeb):'pas commencé'}${r.rFin?' → '+dfr(r.rFin):r.rDeb?' → en cours':''}</b></div>${r.retard?`<div class="r"><span>Retard</span><b style="color:var(--bad,#b42318)">${r.retard} jour(s)</b></div>`:''}</div>
    ${svg?`<h4 style="margin:12px 0 4px">Progression dans le temps</h4>${svg}`:'<div class="sm mute" style="margin-top:10px">La courbe apparaîtra dès les premières mises à jour de l\'étape.</div>'}
    ${S_.length?`<h4 style="margin:12px 0 4px">Sous-étapes</h4><div class="gsous">${S_.map(s=>`<div class="${s.fait?'ok':''}"><span>${s.fait?'✓':'○'}</span><b>${esc(s.nom)}</b><small>${s.fait&&s.date?dfr(s.date):N(num(s.poids),0)+' %'}</small></div>`).join('')}</div>`:''}
    <div class="row" style="gap:6px;margin-top:12px"><button class="btn sec" style="flex:1" onclick="closeForm();formEtapeDates('${e.id}')">📅 Dates prévues</button><button class="btn" style="flex:1" onclick="closeForm()">Fermer</button></div></div></div>`}
function formEtapeDates(eid){const e=S.etapes.find(x=>x.id===eid);if(!e)return;const G=ganttData(e.chantierId),r=G&&G.R.find(z=>z.e.id===eid);
  openForm({title:'📅 '+e.nom,values:{debutPrevu:e.debutPrevu||(r&&r.pDeb)||'',finPrevue:e.finPrevue||(r&&r.pFin)||''},fields:[{k:'debutPrevu',label:'Début prévu',type:'date'},{k:'finPrevue',label:'Fin prévue',type:'date'},{type:'html',html:'<div class="note">Ces dates servent au planning, aux retards et aux dates prévues des tranches du contrat.</div>'}],
    onSave:o=>save('etapes',{...S.etapes.find(x=>x.id===eid),debutPrevu:o.debutPrevu,finPrevue:o.finPrevue})})}
/* ---------- dans le projet ---------- */
const tgG=tGraphes;tGraphes=function(ch,s){return ganttHtml(ch.id)+tgG(ch,s)};
const teG=tEtapes;tEtapes=function(ch,s){return ganttHtml(ch.id)+`<div class="secth" style="margin-top:4px">Gérer les étapes</div>`+teG(ch,s)};
/* client : la chronologie dans son espace */
if(typeof rgChantier==='function'){const rcG=rgChantier;rgChantier=function(p){const h=rcG(p);return p.profil==='client'&&p.cid?h+ganttHtml(p.cid,{client:true}).replace('<div class="card frise">','<div class="frise rgech">'):h}}

/* ---------- modèle retenu : frise verticale ---------- */
function friseHtml(cid,opt={}){const G=ganttData(cid);if(!G)return'';const {R,td}=G;
  const fin=R.filter(r=>r.st==='fini').length,enc=R.filter(r=>r.st==='encours').length,ret=R.filter(r=>r.retard&&r.st!=='fini').length,glob=Math.round(sum(R,r=>r.av)/R.length);
  const cur=R.findIndex(r=>r.st!=='fini');
  return `<div class="card frise"><div class="row between"><h3 style="margin:0">📅 Avancement des étapes</h3><span class="fpct">${glob} %</span></div>
    <div class="pb2"><i style="width:${glob}%"></i></div>
    <div class="sm mute" style="margin:4px 0 12px">${fin} terminée(s) sur ${R.length} · ${enc} en cours${ret?` · <b class="flate">${ret} en retard</b>`:''}</div>
    ${R.map((r,i)=>{const last=i===R.length-1,ic=r.st==='fini'?'✓':r.st==='encours'?'⚒':'';
      const sous=(r.sous||[]),nf=sous.filter(s=>s.fait).length;
      const info=r.st==='fini'?`Terminée le ${dfr(r.rFin)}${r.retard?` · <span class="flate">${r.retard} j après la date prévue</span>`:''}`
        :r.st==='encours'?`${r.retard?`<span class="flate">${r.retard} jour${r.retard>1?'s':''} de retard</span> · `:''}fin prévue le ${dfr(r.pFin)}${r.est?' (estimée)':''}`
        :`Prévue du ${dfr(r.pDeb)} au ${dfr(r.pFin)}${r.est?' (estimé)':''}`;
      return `<div class="fr2 ${r.st}${r.retard&&r.st!=='fini'?' late':''}${i===cur?' now':''}" ${opt.client?'':`onclick="ganttDetail('${r.e.id}')"`}>
        <div class="frl"><span class="frd">${ic}</span>${last?'':'<span class="frv"></span>'}</div>
        <div class="frt"><div class="row between" style="gap:8px"><b>${esc(r.e.nom)}</b>${r.st==='encours'?`<span class="frp">${r.av} %</span>`:''}</div>
          ${r.st==='encours'?`<div class="pb2 sm2"><i style="width:${r.av}%"></i></div>`:''}
          <small>${info}</small>${r.st==='encours'&&sous.length?`<small>${nf}/${sous.length} sous-étapes faites${sous.find(s=>!s.fait)?' · à faire : '+esc(sous.find(s=>!s.fait).nom):''}</small>`:''}</div></div>`}).join('')}
    ${opt.client?'':`<div class="sm mute" style="margin-top:4px">Touche une étape pour voir sa progression et fixer ses dates prévues.</div>`}</div>`}
ganttHtml=friseHtml;
