/* ---------- Graphiques (Chart.js) ---------- */
const VIZ={s1:'#2a78d6',s2:'#eb6834',s3:'#1baf7a',ink:'#0b0b0b',ink2:'#52514e',grid:'#ece7df',surface:'#ffffff'};
const OUVRAGES=[['parpaings','Maçonnerie de parpaings','m²'],['beton','Béton coulé','m³'],['fouilles','Fouilles','m³'],['ferraillage','Ferraillage','kg'],['coffrage','Coffrage','m²'],['enduit','Enduit','m²'],['chape','Chape','m²'],['carrelage','Carrelage / faïence','m²'],['peinture','Peinture','m²'],['autre','Autre','unité']];
let CHS={},chartObjs=[];
function regChart(id,cfg){CHS[id]=cfg;return `<div class="chartbox"><canvas id="${id}" role="img"></canvas></div>`}
function killCharts(){chartObjs.forEach(c=>{try{c.destroy()}catch(e){}});chartObjs=[]}
function mountCharts(){if(!window.Chart){CHS={};return}
  Chart.defaults.font.family='Inter, system-ui, sans-serif';Chart.defaults.font.size=11.5;Chart.defaults.color=VIZ.ink2;Chart.defaults.animation=false;Chart.defaults.maintainAspectRatio=false;
  Object.entries(CHS).forEach(([id,cfg])=>{const el=document.getElementById(id);if(el)chartObjs.push(new Chart(el,cfg))});CHS={}}
const fcfaTick=v=>Math.abs(v)>=1e6?N(v/1e6,1)+' M':Math.abs(v)>=1e3?N(v/1e3,0)+' k':N(v,0);
const tipF=c=>`${c.dataset.label?c.dataset.label+' : ':''}${F(c.parsed.y??c.parsed.x??c.raw)}`;
function baseOpts({stacked=false,horizontal=false,money=true,pct=false,legend=true}={}){
  const val={grid:{color:VIZ.grid},border:{display:false},ticks:{callback:v=>pct?v+' %':money?fcfaTick(v):N(v,1)},stacked,beginAtZero:true,...(pct?{suggestedMax:100}:{})};
  const cat={grid:{display:false},border:{color:VIZ.grid},ticks:{autoSkip:true,maxRotation:0},stacked};
  return{indexAxis:horizontal?'y':'x',interaction:{mode:'index',intersect:false},
    plugins:{legend:{display:legend,position:'top',align:'start',labels:{boxWidth:10,boxHeight:10,usePointStyle:true,pointStyle:'rectRounded',color:VIZ.ink}},
      tooltip:{backgroundColor:'#1d232b',padding:10,cornerRadius:8,callbacks:{label:c=>{const v=horizontal?c.parsed.x:c.parsed.y;return ` ${c.dataset.label} : ${pct?N(v,0)+' %':money?F(v):N(v,2)}`}}}},
    scales:horizontal?{x:val,y:cat}:{x:cat,y:val}}}
const lineDs=(label,data,color,dash)=>({label,data,borderColor:color,backgroundColor:color,borderWidth:2,pointRadius:3,pointHoverRadius:5,pointBorderColor:VIZ.surface,pointBorderWidth:2,tension:0.2,borderDash:dash||[],spanGaps:true});
const barDs=(label,data,color)=>({label,data,backgroundColor:color,borderColor:VIZ.surface,borderWidth:{top:0,bottom:0,left:0,right:0},borderRadius:4,borderSkipped:'start',maxBarThickness:28,categoryPercentage:0.7,barPercentage:0.9});

/* --- données --- */
function weeksBetween(a,b){const out=[];let w=mondayOf(a);const end=mondayOf(b);while(w<=end&&out.length<200){out.push(w);w=addDays(w,7)}return out}
function chantierSeries(cid){
  const ach=byC('achats',cid).filter(a=>a.statut!=='a_acheter'&&a.date),pay=byC('paiements',cid).filter(p=>p.date),rec=byC('recus',cid).filter(r=>r.date);
  const dates=[...ach,...pay,...rec].map(x=>x.date).sort();if(!dates.length)return null;
  const W=weeksBetween(dates[0],today()),k=d=>mondayOf(d);
  const mat=Object.fromEntries(W.map(w=>[w,0])),mo={...mat},enc={...mat};
  ach.forEach(a=>{if(k(a.date) in mat)mat[k(a.date)]+=totA(a)});pay.forEach(p=>{if(k(p.date) in mo)mo[k(p.date)]+=num(p.montant)});rec.forEach(r=>{if(k(r.date) in enc)enc[k(r.date)]+=num(r.montant)});
  let cd=0,ce=0;return{W,lab:W.map(w=>dfr(w).slice(0,5)),mat:W.map(w=>mat[w]),mo:W.map(w=>mo[w]),cumDep:W.map(w=>cd+=mat[w]+mo[w]),cumEnc:W.map(w=>ce+=enc[w])}}
function avancementSerie(cid){
  const ets=etapesOf(cid);if(!ets.length)return null;const ev=byC('historique',cid).filter(h=>h.etapeId&&h.av!=null&&h.date).sort((a,b)=>(a.date+(a.maj||0)).localeCompare(b.date+(b.maj||0)));
  const st=Object.fromEntries(ets.map(e=>[e.id,0])),wb=sum(ets,e=>num(e.budget));
  const glob=()=>wb>0?sum(ets,e=>st[e.id]*num(e.budget))/wb:sum(ets,e=>st[e.id])/ets.length;
  const pts={};ev.forEach(h=>{if(h.etapeId in st){st[h.etapeId]=num(h.av);pts[h.date]=glob()}});
  pts[today()]=stats(cid).av;const ks=Object.keys(pts).sort();return{lab:ks.map(d=>dfr(d).slice(0,5)),val:ks.map(d=>Math.round(pts[d]*10)/10)}}
function rendements(cid){const rows={};byC('journal',cid).forEach(j=>(j.prod||[]).forEach(p=>{const q=num(p.qte),o=num(p.ouvriers);if(!(q>0&&o>0))return;const k=p.ouvrage+'|'+(p.metier||'');
  const r=rows[k]||(rows[k]={ouvrage:p.ouvrage,metier:p.metier||'',q:0,o:0,jours:0,best:0});r.q+=q;r.o+=o;r.jours++;r.best=Math.max(r.best,q/o)}));
  return Object.values(rows).map(r=>({...r,moy:r.q/r.o,u:(OUVRAGES.find(x=>x[0]===r.ouvrage)||[,'',''])[2],nom:(OUVRAGES.find(x=>x[0]===r.ouvrage)||[,r.ouvrage])[1]}))}

/* --- onglet Graphiques d'un chantier --- */
function tGraphes(ch,s){
  let h='';const se=chantierSeries(ch.id);
  if(se){h+=`<div class="card"><h3>Dépenses et encaissements cumulés</h3><div class="sm mute" style="margin:-6px 0 8px">Par semaine, en FCFA${s.budget?' · la ligne pointillée est le budget prévu':''}</div>${regChart('cg1',{type:'line',data:{labels:se.lab,datasets:[lineDs('Dépensé',se.cumDep,VIZ.s2),lineDs('Encaissé',se.cumEnc,VIZ.s1),...(s.budget?[lineDs('Budget prévu',se.W.map(()=>s.budget),VIZ.s3,[5,4])]:[])]},options:baseOpts()})}</div>`;
    h+=`<div class="card"><h3>Dépenses par semaine</h3><div class="sm mute" style="margin:-6px 0 8px">Matériaux et main-d'œuvre, en FCFA</div>${regChart('cg2',{type:'bar',data:{labels:se.lab,datasets:[barDs('Matériaux',se.mat,VIZ.s1),barDs("Main-d'œuvre",se.mo,VIZ.s2)]},options:baseOpts({stacked:true})})}</div>`}
  const av=avancementSerie(ch.id);
  if(av&&av.lab.length>1)h+=`<div class="card"><h3>Avancement global</h3><div class="sm mute" style="margin:-6px 0 8px">En %, à chaque mise à jour d'étape</div>${regChart('cg3',{type:'line',data:{labels:av.lab,datasets:[lineDs('Avancement',av.val,VIZ.s1)]},options:{...baseOpts({money:false,pct:true,legend:false}),scales:{x:{grid:{display:false},border:{color:VIZ.grid}},y:{min:0,max:100,grid:{color:VIZ.grid},border:{display:false},ticks:{callback:v=>v+' %'}}}}})}</div>`;
  const lg=s.ets.map(e=>({n:e.nom.length>20?e.nom.slice(0,19)+'…':e.nom,b:num(e.budget),d:depEtape(e.id)})).filter(x=>x.b||x.d);
  if(lg.length)h+=`<div class="card"><h3>Budget et dépenses par étape</h3><div class="sm mute" style="margin:-6px 0 8px">En FCFA</div><div style="height:${Math.max(220,lg.length*44+60)}px">${regChart('cg4',{type:'bar',data:{labels:lg.map(x=>x.n),datasets:[barDs('Budget',lg.map(x=>x.b),VIZ.s1),barDs('Dépensé',lg.map(x=>x.d),VIZ.s2)]},options:baseOpts({horizontal:true})}).replace('class="chartbox"','class="chartbox" style="height:100%"')}</div></div>`;
  const emp=Object.fromEntries(S.employes.map(e=>[e.id,e])),pm={};s.pays.forEach(p=>{const m=(emp[p.employeId]||{}).metier||'Autre';const r=pm[m]||(pm[m]={m:0,j:0});r.m+=num(p.montant);r.j+=num(p.jours)});
  const pk=Object.keys(pm).sort((a,b)=>pm[b].m-pm[a].m);
  if(pk.length)h+=`<div class="card"><h3>Paie par métier</h3><div class="sm mute" style="margin:-6px 0 8px">Total payé en FCFA</div>${regChart('cg5',{type:'bar',data:{labels:pk,datasets:[barDs('Payé',pk.map(k=>pm[k].m),VIZ.s1)]},options:baseOpts({legend:false})})}
    <div class="list sm" style="margin-top:8px">${pk.map(k=>`<div class="it"><div class="main">${esc(k)}</div><div class="amt">${F(pm[k].m)}<small>${pm[k].j?N(pm[k].j,1)+' j payés · '+F(pm[k].m/pm[k].j)+' / jour':''}</small></div></div>`).join('')}</div></div>`;
  const rd=rendements(ch.id);
  h+=`<div class="card"><h3>Rendement par profil de travailleur</h3><div class="sm mute" style="margin:-6px 0 8px">Quantité réalisée par ouvrier et par jour, d'après la production notée dans le Journal.</div>`;
  if(!rd.length)h+=`<div class="empty sm">Aucune production notée. Dans le Journal, ajoute pour chaque journée l'ouvrage réalisé, la quantité, le métier et le nombre d'ouvriers.</div>`;
  else h+=`<div class="list">${rd.sort((a,b)=>a.nom.localeCompare(b.nom)).map(r=>`<div class="it"><div class="main"><div class="t">${esc(r.nom)}</div><div class="s">${esc(r.metier||'—')} · ${r.jours} jour(s) mesuré(s) · ${N(r.q,1)} ${r.u} au total</div></div><div class="amt">${N(r.moy,2)} ${r.u}<small>par ouvrier / jour · max ${N(r.best,2)}</small></div></div>`).join('')}</div>`;
  h+=`</div>`;
  if(!se&&!lg.length&&!pk.length)h=`<div class="card empty">Les graphiques apparaîtront dès les premiers achats, paiements, reçus ou mises à jour d'étapes.</div>`+h;
  return h;
}

/* --- vue d'ensemble (accueil) --- */
function homeCharts(chs){
  if(!chs.length)return '';let h='';
  const rows=chs.map(c=>{const s=stats(c.id);return{n:c.nom.length>22?c.nom.slice(0,21)+'…':c.nom,av:Math.round(s.av),b:s.budget>0?Math.round(s.dep/s.budget*100):0}});
  if(rows.every(r=>!r.av&&!r.b))return `<div class="card"><h3>Avancement et budget consommé</h3><div class="note" style="margin:6px 0 0">Le graphique apparaîtra dès qu'un chantier aura un <b>budget</b> (devis accepté ou budget des étapes) et un <b>avancement</b> : ouvre le chantier → 🧱 Travaux → Étapes, et indique le pourcentage réalisé de chaque étape.</div></div>`;
  h+=`<div class="card"><h3>Avancement et budget consommé</h3><div class="sm mute" style="margin:-6px 0 8px">Par chantier, en %</div><div style="height:${Math.max(180,rows.length*48+60)}px">${regChart('hg1',{type:'bar',data:{labels:rows.map(r=>r.n),datasets:[barDs('Avancement',rows.map(r=>r.av),VIZ.s1),barDs('Budget consommé',rows.map(r=>r.b),VIZ.s2)]},options:baseOpts({horizontal:true,pct:true,money:false})}).replace('class="chartbox"','class="chartbox" style="height:100%"')}</div></div>`;
  const months=[];const d=new Date();for(let i=5;i>=0;i--){const x=new Date(d.getFullYear(),d.getMonth()-i,1);months.push(x.getFullYear()+'-'+pad(x.getMonth()+1))}
  const mat=months.map(m=>sum(S.achats.filter(a=>a.statut!=='a_acheter'&&(a.date||'').startsWith(m)),totA)),mo=months.map(m=>sum(S.paiements.filter(p=>(p.date||'').startsWith(m)),p=>num(p.montant)));
  if(sum(mat,x=>x)+sum(mo,x=>x)>0){const ML=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
    h+=`<div class="card"><h3>Dépenses des 6 derniers mois</h3><div class="sm mute" style="margin:-6px 0 8px">Tous chantiers, en FCFA</div>${regChart('hg2',{type:'bar',data:{labels:months.map(m=>ML[+m.slice(5)-1]),datasets:[barDs('Matériaux',mat,VIZ.s1),barDs("Main-d'œuvre",mo,VIZ.s2)]},options:baseOpts({stacked:true})})}</div>`}
  return h;
}

/* --- production dans le journal --- */
function prodRow(p={}){return `<div class="prr"><select data-r="ouvrage">${OUVRAGES.map(([k,l,u])=>`<option value="${k}" ${p.ouvrage===k?'selected':''}>${esc(l)} (${u})</option>`).join('')}</select>
  <input data-r="qte" inputmode="decimal" placeholder="Quantité" value="${esc(p.qte??'')}"><select data-r="metier">${METIERS.map(m=>`<option ${p.metier===m?'selected':''}>${esc(m)}</option>`).join('')}</select>
  <input data-r="ouvriers" inputmode="numeric" placeholder="Ouvriers" value="${esc(p.ouvriers??'')}"><button type="button" class="btn ghost small delb" onclick="this.parentNode.remove()">×</button></div>`}
function prodBlock(list){return `<div class="f"><span class="lbl">Production du jour (sert au rendement par métier)</span><div id="prods">${(list||[]).map(prodRow).join('')}</div>
  <button type="button" class="btn sec small" onclick="document.getElementById('prods').insertAdjacentHTML('beforeend',prodRow({metier:'Maçon'}))">+ Ajouter une production</button></div>`}
function readProds(f){return[...f.querySelectorAll('.prr')].map(r=>{const g=k=>r.querySelector(`[data-r=${k}]`).value;return{ouvrage:g('ouvrage'),qte:num(g('qte')),metier:g('metier'),ouvriers:num(g('ouvriers'))}}).filter(x=>x.qte>0)}
