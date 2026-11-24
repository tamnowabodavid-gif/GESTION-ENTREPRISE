/* contrat2.js — échéancier du contrat suivant l'avancement réel : chaque tranche est liée aux étapes qui la déclenchent,
   exigible quand ces étapes sont terminées, date prévue estimée ; affiché au client et rappel automatique quand une tranche devient exigible */
const ECH_RG=[[/signature|acompte|démarrage|demarrage/i,'sign'],[/r[ée]ception|solde|livraison des cl/i,['recep']],[/fondation|soubassement/i,['fond','soub']],[/[ée]l[ée]vation|murs|cha[iî]nage/i,['elev']],
  [/toiture|dalle|plancher|charpente/i,['dalle','charpente']],[/r[ée]seau|plomberie|[ée]lectricit|enduit/i,['plomb','elec','enduit']],[/finition|carrelage|menuiserie|peinture/i,['carrelage','menInt','peint']],[/terrassement|implantation|fouille/i,['prep','fouilles']]];
const ekOf=e=>e.lib||(typeof etMatch==='function'&&(etMatch(e.nom)||{}).k)||'';
function echCles(x){if(x.et)return x.et;for(const[r,k]of ECH_RG)if(r.test(x.l||''))return k;const m=typeof etMatch==='function'&&etMatch(x.l||'');return m?[m.k]:null}
function echSuivi(cid){const ct=contratOf(cid);if(!ct)return null;const pr=contratPrix(ct);if(!pr)return null;const base=echeancier(ct),ch=S.chantiers.find(c=>c.id===cid)||{},ets=etapesOf(cid),td=today();
  const d0=ct.debut||ch.debut||ct.dateSignature||ch.cree&&new Date(num(ch.cree)).toISOString().slice(0,10)||td,d1=ch.fin||(num(ct.delai)?addDays(d0,Math.round(num(ct.delai)*30.4)):null);
  const pos=k=>{const i=(typeof ETLIB!=='undefined'?ETLIB.findIndex(x=>x.k===k):-1);return i<0?0.5:(i+1)/ETLIB.length};
  return base.map((x,i)=>{const cles=echCles(x);let E=[],dec=null,av=0,prev=null,etat;
    if(cles==='sign'){dec=ct.statut==='signe'?(ct.dateSignature||d0):null;prev=ct.dateSignature||d0;av=dec?100:0}
    else if(cles){E=ets.filter(e=>cles.includes(ekOf(e)));
      if(E.length){av=Math.round(sum(E,e=>num(e.avancement))/E.length);const fin=E.every(e=>e.statut==='fini'||num(e.avancement)>=100);dec=fin?E.map(e=>e.fin||td).sort().pop():null;const pl=E.filter(e=>e.statut!=='fini').map(e=>e.finPrevue||e.fin).filter(Boolean).sort().pop();prev=dec||pl||null}
      if(!prev&&d1)prev=addDays(d0,Math.round((new Date(d1)-new Date(d0))/864e5*Math.max(...cles.map(pos))))}
    else if(i===base.length-1&&d1)prev=d1;
    if(x.c==='ok')etat={c:'ok',t:'Payé'};
    else if(dec){const j=Math.round((new Date(td)-new Date(dec))/864e5);etat={c:j>15?'bad':'warn',t:x.c==='warn'?x.t:(j>15?`Exigible depuis le ${dfr(dec)} (${j} j de retard)`:`À payer maintenant · exigible depuis le ${dfr(dec)}`)}}
    else if(av>0)etat={c:'blue',t:`Travaux en cours (${av} %)${prev?(prev<td?' · prévue le '+dfr(prev)+', travaux en retard':' · prévue vers le '+dfr(prev)):''}`};
    else etat={c:'mute',t:prev?`À venir · prévue vers le ${dfr(prev)}`:'À venir'};
    return{...x,n:i+1,cles,E,av,dec,prev,etat}})}
function echHtml(cid,client){const L=echSuivi(cid);if(!L)return'';const ct=contratOf(cid),pr=contratPrix(ct),T=pr.t.ttc,enc=sum(byC('recus',cid),r=>num(r.montant)),du=sum(L.filter(x=>x.dec&&x.etat.c!=='ok'),x=>x.cum)-enc;
  const nx=L.find(x=>x.etat.c!=='ok');
  return `<div class="card"><h3>💳 Échéancier de paiement${client?'':' (vu par le client)'}</h3>
    <div class="grid2" style="margin-bottom:10px"><div class="kpi"><div class="l">Déjà payé</div><div class="v">${F(enc)}</div></div><div class="kpi"><div class="l">${du>0.5?'À payer maintenant':'Prochaine échéance'}</div><div class="v" style="${du>0.5?'color:var(--warn)':''}">${du>0.5?F(du):nx?F(nx.cum-enc):'—'}</div></div></div>
    <div class="bar ok" style="height:8px;border-radius:5px;background:var(--line,#e5e5e5);overflow:hidden;margin-bottom:4px"><i style="display:block;height:100%;width:${Math.min(100,T?enc/T*100:0)}%;background:var(--ok,#0e8a5f)"></i></div><div class="sm mute" style="margin-bottom:8px">${T?Math.round(enc/T*100):0} % du prix (${F(T)}) payé</div>
    <div class="list">${L.map(x=>`<div class="it"><div class="main"><div class="t" style="font-weight:500">${dot(x.etat.c==='blue'?'mute':x.etat.c)} ${x.n}. ${esc(x.l)}</div><div class="s pst ${x.etat.c}">${esc(x.etat.t)}</div>${x.E.length&&x.etat.c!=='ok'?`<div class="s">Étape${x.E.length>1?'s':''} : ${x.E.map(e=>esc(e.nom.split(' —')[0])+' '+Math.round(num(e.avancement))+' %').join(' · ')}</div>`:''}</div><div class="amt">${F(x.m)}<small>${N(num(x.p))} %</small></div></div>`).join('')}</div>
    <div class="note">${client?'Chaque tranche devient exigible quand les travaux correspondants sont terminés. Vous êtes prévenu dans l\'application.':'Chaque tranche devient exigible à la fin des étapes liées ; le client voit cet échéancier et reçoit un message à chaque tranche exigible.'}</div></div>`}
/* contrat : remplace l'ancien échéancier */
const tcC2=tContrat;tContrat=function(ch){const h=tcC2(ch),i=h.indexOf('<div class="card list"><h3>Échéancier de paiement</h3>');if(i<0)return h;const j=h.indexOf('<div class="card"><h3>Contrat signé',i);return h.slice(0,i)+echHtml(ch.id)+(j<0?'':h.slice(j))};
/* aperçu du chantier (gérant) : rappel si une tranche est exigible */
const taC2=tApercu;tApercu=function(ch,s){const h=taC2(ch,s),L=echSuivi(ch.id);if(!L)return h;const x=L.find(y=>y.dec&&y.etat.c!=='ok');if(!x)return h;
  return `<div class="alert" style="margin-bottom:10px">💳 Tranche ${x.n} du contrat exigible : <b>${F(x.m)}</b> (${esc(x.l)}). <button class="btn small" onclick="setTab('contrat')">Voir l'échéancier</button></div>`+h};
/* client : dans « Ton chantier en ce moment » et à sa connexion */
if(typeof rgChantier==='function'){const rcC2=rgChantier;rgChantier=function(p){const h=rcC2(p);return p.profil==='client'&&p.cid?h+echHtml(p.cid,true).replace('<div class="card">','<div class="rgech">').replace(/<\/div>$/,'</div>'):h}}
/* message automatique au client quand une tranche devient exigible */
async function echVerifier(cid){const L=echSuivi(cid);if(!L)return;const ct=contratOf(cid),deja=new Set(ct.echAvis||[]),mo=(S.intervenants||[]).find(i=>i.chantierId===cid&&i.fonction==='mo'&&i.actif!==false),ch=S.chantiers.find(c=>c.id===cid)||{};
  const nv=L.filter(x=>x.dec&&x.etat.c!=='ok'&&x.cles!=='sign'&&!deja.has(x.n));if(!nv.length)return;
  for(const x of nv){const t=`🔔 ${ch.nom||'Votre chantier'} : ${x.E.length?(x.E.length>1?'les étapes '+x.E.map(e=>'« '+e.nom.split(' —')[0]+' »').join(', ')+' sont terminées':'l\'étape « '+x.E[0].nom.split(' —')[0]+' » est terminée'):'les travaux prévus sont terminés'}.\n\nConformément au contrat, la tranche n° ${x.n} — ${x.l} (${N(num(x.p))} %, ${F(x.m)}) est maintenant exigible.\n${ent().banque?'Paiement : '+ent().banque+'\n':''}Un reçu vous sera remis à chaque paiement.\n\n${ent().nom||''}`;
    if(mo)await save('messages',{conv:'int:'+mo.id,chantierId:'_dm',membres:['gerant',mo.id],texte:t,echN:x.n,uid:'systeme',auteur:ent().nom||'Entreprise',date:today(),ts:Date.now()});
    if(typeof log==='function')log(cid,`Tranche ${x.n} du contrat exigible (${F(x.m)})${mo?' · client prévenu':''}`)}
  await save('contrats',{...contratOf(cid),echAvis:[...deja,...nv.map(x=>x.n)]});if(!mo)toast(`Tranche du contrat exigible : ajoute le maître d'ouvrage dans les intervenants pour qu'il soit prévenu.`);else toast(`Le client a été prévenu : tranche ${nv.map(x=>x.n).join(', ')} exigible`)}
const svC2=save;save=async function(c,o){const r=await svC2(c,o);if(c==='etapes'&&o&&o.chantierId&&(o.statut==='fini'||num(o.avancement)>=100))setTimeout(()=>echVerifier(o.chantierId).catch(()=>{}),300);return r};
