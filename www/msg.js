/* msg.js — messagerie interne (canal Général + un fil par chantier + messages privés en mode équipe),
   menu « Partager » (WhatsApp, Telegram, Facebook, LinkedIn, e-mail, SMS, copier, autres applis), pages de l'entreprise */
if(!COLLS.includes('messages')){COLLS.push('messages');S.messages=S.messages||[]}
/* ---------- conversations ---------- */
const myUid=()=>typeof TEAM!=='undefined'&&TEAM.on?TEAM.user.uid:'moi';
const myNom=()=>typeof TEAM!=='undefined'&&TEAM.on?(TEAM.admin?'Gérant':(TEAM.me&&TEAM.me.nom)||'?'):(ent().signataire||'Gérant');
const convOf=m=>m.conv||(m.chantierId&&m.chantierId!=='_general'?'ch:'+m.chantierId:'general');
function convList(){const C=[{id:'general',ic:'📢',nom:'Général',sub:"Toute l'entreprise"}];
  [...S.chantiers].sort((a,b)=>(a.statut==='fini')-(b.statut==='fini')||num(b.cree)-num(a.cree)).forEach(c=>C.push({id:'ch:'+c.id,ic:'🏗️',nom:c.nom||'Chantier',sub:c.lieu||'Fil du chantier',cid:c.id,fini:c.statut==='fini'}));
  if(typeof TEAM!=='undefined'&&TEAM.on&&TEAM.admin)(TEAM.users||[]).filter(u=>u.actif!==false&&!u.remplacePar).forEach(u=>C.push({id:dmId(u.uid),ic:'👤',nom:u.nom,sub:'Message privé',uid:u.uid}));
  else if(typeof TEAM!=='undefined'&&TEAM.on)C.push({id:dmId('gerant'),ic:'👔',nom:'Gérant',sub:'Message privé',uid:'gerant'});
  const M={};S.messages.forEach(m=>{const k=convOf(m);(M[k]=M[k]||[]).push(m)});
  C.forEach(c=>{const L=(M[c.id]||[]).sort((a,b)=>num(a.ts)-num(b.ts));c.last=L[L.length-1];c.n=L.length;c.nonlus=L.filter(m=>m.uid!==myUid()&&num(m.ts)>num(lsG('ge_lu_'+c.id,'0'))).length});
  return C.sort((a,b)=>(b.last?num(b.last.ts):0)-(a.last?num(a.last.ts):0)||(a.id==='general'?-1:b.id==='general'?1:0))}
const dmId=u=>{const a=typeof TEAM!=='undefined'&&TEAM.on&&TEAM.admin?'gerant':myUid(),b=u;return 'dm:'+[a,b].sort().join('|')};
const nonLus=()=>convList().reduce((s,c)=>s+c.nonlus,0);
const heure=ts=>{const d=new Date(num(ts)||Date.now()),t=today();const ds=d.toISOString().slice(0,10);return ds===t?d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}):d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})};
function viewMsg(){const C=convList(),q=(ui.msgQ||'').toLowerCase();
  return `<input class="srch" placeholder="🔍 Rechercher une conversation…" value="${esc(ui.msgQ||'')}" oninput="ui.msgQ=this.value;document.querySelectorAll('.cvl').forEach(e=>e.style.display=e.dataset.s.includes(this.value.toLowerCase())?'':'none')">
  <div class="card" style="padding:4px 14px">${C.map(c=>`<div class="cvl click" data-s="${esc((c.nom+' '+c.sub).toLowerCase())}" style="${q&&!(c.nom+' '+c.sub).toLowerCase().includes(q)?'display:none':''}" onclick="ouvrirConv('${c.id}')">
    <div class="av">${c.id==='general'?bmark():c.ic}</div><div class="cm"><div class="row between"><b>${esc(c.nom)}</b><small>${c.last?heure(c.last.ts):''}</small></div>
    <div class="row between"><small class="pv">${c.last?esc((c.last.uid===myUid()?'Vous : ':(c.last.auteur||'')+' : ')+String(c.last.texte||'').slice(0,70)):esc(c.sub)}</small>${c.nonlus?`<span class="badge">${c.nonlus}</span>`:''}</div></div></div>`).join('')}</div>
  <div class="note">La messagerie reste dans l'application : seuls les membres de l'entreprise y ont accès. Pour envoyer quelque chose à l'extérieur, utilise le bouton ↗ Partager d'un message.${typeof TEAM!=='undefined'&&TEAM.on?'':' Dans cette version, tu es seul : les échanges avec ton équipe se font dans l\'application Android, Windows ou web, connectées au mode équipe.'}</div>`}
function ouvrirConv(id){ui.conv=id;ui.view='conv';window.scrollTo(0,0);render()}
function convInfo(id){return convList().find(c=>c.id===id)||{id,ic:'💬',nom:'Conversation',sub:''}}
function viewConv(){const id=ui.conv,c=convInfo(id),L=S.messages.filter(m=>convOf(m)===id).sort((a,b)=>num(a.ts)-num(b.ts)).slice(-400),moi=myUid();
  lsS('ge_lu_'+id,String(Date.now()));let jour='',h='';
  L.forEach(m=>{const d=new Date(num(m.ts)||Date.now()),j=d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});if(j!==jour){jour=j;h+=`<div class="dsep"><span>${esc(j)}</span></div>`}
    const mine=m.uid===moi;h+=`<div class="bub ${mine?'me':''}" onclick="msgActions('${m.id}')">${mine?'':`<div class="ba">${esc(m.auteur||'?')}</div>`}<div class="bt">${esc(m.texte)}</div><div class="bh">${d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</div></div>`});
  setTimeout(()=>{const b=$('#bubs');if(b)b.scrollTop=b.scrollHeight;const i=$('#cvIn');if(i&&ui.cvFocus){i.focus();ui.cvFocus=false}},0);
  return `<div class="cvh">${c.id==='general'?bmark():`<div class="av">${c.ic}</div>`}<div style="min-width:0;flex:1"><b>${esc(c.nom)}</b><small>${esc(c.sub)}</small></div>${c.cid?`<button class="btn sec small" onclick="openCh('${c.cid}')">Ouvrir le chantier</button>`:''}</div>
  <div class="bubs" id="bubs">${h||'<div class="empty">Aucun message. Écris le premier !</div>'}</div>
  <div class="cvf"><textarea id="cvIn" rows="1" placeholder="Écrire un message…" oninput="ui.cvDraft=this.value;this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px'" onkeydown="if(event.key==='Enter'&&!event.shiftKey&&!('ontouchstart' in window)){event.preventDefault();cvEnvoyer()}">${esc(ui.cvDraft||'')}</textarea><button class="btn" onclick="cvEnvoyer()" aria-label="Envoyer">➤</button></div>`}
async function cvEnvoyer(){const i=$('#cvIn'),t=(i&&i.value||'').trim();if(!t)return;ui.cvDraft='';i.value='';ui.cvFocus=true;const id=ui.conv,c=convInfo(id);
  const o={conv:id,texte:t,uid:myUid(),auteur:myNom(),date:today(),ts:Date.now()};if(c.cid)o.chantierId=c.cid;else if(id==='general')o.chantierId='_general';else{o.chantierId='_dm';o.membres=id.startsWith('int:')?['gerant',id.slice(4)]:id.slice(3).split('|')}
  try{await save('messages',o)}catch(e){}}
function msgActions(id){const m=S.messages.find(x=>x.id===id);if(!m)return;const peut=m.uid===myUid()||!(typeof TEAM!=='undefined'&&TEAM.on&&!TEAM.admin);
  $('#modalRoot').innerHTML=`<div class="modal-bg" onclick="if(event.target===this)closeForm()"><div class="modal sheet"><div class="sm mute" style="margin-bottom:6px">${esc(m.auteur||'')} · ${new Date(num(m.ts)).toLocaleString('fr-FR')}</div><div class="card" style="white-space:pre-wrap">${esc(m.texte)}</div>
    <div class="actgrid"><button class="actb" onclick="navigator.clipboard&&navigator.clipboard.writeText(${esc(JSON.stringify(m.texte))});closeForm();toast('Copié.')"><span class="ai">📋</span><b>Copier</b></button>
    <button class="actb" onclick="closeForm();partager({titre:'Message',texte:${esc(JSON.stringify(m.texte))}})"><span class="ai">↗️</span><b>Partager</b><small>WhatsApp, e-mail, Telegram…</small></button>
    ${peut?`<button class="actb" onclick="if(confirm('Supprimer ce message ?')){del('messages','${m.id}');closeForm()}"><span class="ai">🗑️</span><b>Supprimer</b></button>`:''}</div>
    <button class="btn sec block" style="margin-top:12px" onclick="closeForm()">Fermer</button></div></div>`}
/* ---------- partager vers l'extérieur ---------- */
const SHARE_T={};
function partager(o){const k='s'+Date.now();SHARE_T[k]=o;const t=o.texte||'',u=o.url||'',tu=(t+(u?'\n'+u:'')).trim(),e=encodeURIComponent;
  const L=[['💬','WhatsApp',`https://wa.me/?text=${e(tu)}`],['✈️','Telegram',`https://t.me/share/url?url=${e(u||' ')}&text=${e(t)}`],
    ['📘','Facebook',u?`https://www.facebook.com/sharer/sharer.php?u=${e(u)}`:''],['💼','LinkedIn',u?`https://www.linkedin.com/sharing/share-offsite/?url=${e(u)}`:''],
    ['✉️','E-mail',`mailto:?subject=${e(o.titre||ent().nom||'')}&body=${e(tu)}`],['📱','SMS',`sms:?body=${e(tu)}`]].filter(x=>x[2]);
  $('#modalRoot').innerHTML=`<div class="modal-bg" onclick="if(event.target===this)closeForm()"><div class="modal sheet"><h2>↗️ Partager${o.titre?' · '+esc(o.titre):''}</h2>
    <div class="shg">${L.map(([i,l,h])=>`<button onclick="partLien(${esc(JSON.stringify(h))})"><span>${i}</span>${l}</button>`).join('')}
    <button onclick="navigator.clipboard&&navigator.clipboard.writeText(${esc(JSON.stringify(tu))});closeForm();toast('Copié : tu peux le coller où tu veux.')"><span>📋</span>Copier</button>
    ${navigator.share||(typeof capP==='function'&&capP('Share'))?`<button onclick="partNatif('${k}')"><span>📤</span>Autres applis</button>`:''}</div>
    ${!u?'<div class="note">Facebook et LinkedIn ne partagent que des liens : ajoute les pages de ton entreprise pour pouvoir les partager.</div>':''}
    <button class="btn sec block" style="margin-top:12px" onclick="closeForm()">Fermer</button></div></div>`}
function partLien(h){closeForm();if(/^(mailto|sms):/.test(h)){location.href=h;return}if(typeof capP==='function'&&capP('Browser'))capP('Browser').open({url:h});else window.open(h,'_blank')}
async function partNatif(k){const o=SHARE_T[k]||{};closeForm();try{if(typeof capP==='function'&&capP('Share'))await capP('Share').share({title:o.titre||'',text:o.texte||'',url:o.url||undefined});else await navigator.share({title:o.titre||'',text:o.texte||'',url:o.url||undefined})}catch(e){}}
/* ---------- pages de l'entreprise ---------- */
const PAGES=[['site','🌐','Site internet','https://…'],['facebook','📘','Page Facebook','https://facebook.com/…'],['instagram','📸','Instagram','https://instagram.com/…'],
  ['linkedin','💼','LinkedIn','https://linkedin.com/company/…'],['tiktok','🎵','TikTok','https://tiktok.com/@…'],['youtube','▶️','YouTube','https://youtube.com/@…'],
  ['whatsapp','💬','WhatsApp Business (numéro)','+237 6XX XX XX XX'],['telegram','✈️','Telegram','https://t.me/…'],['maps','📍','Localisation (Google Maps)','https://maps.app.goo.gl/…']];
const pagesE=()=>(ent().pages)||{};
function pageUrl(k,v){v=String(v||'').trim();if(!v)return'';if(k==='whatsapp')return 'https://wa.me/'+telWa(v);if(!/^https?:\/\//i.test(v))v='https://'+v.replace(/^\/+/,'');return v}
function pagesLiens(cls='pgl'){const P=pagesE();const L=PAGES.filter(([k])=>P[k]);return L.length?`<div class="${cls}">${L.map(([k,i,l])=>`<button title="${esc(l)}" onclick="partLien(${esc(JSON.stringify(pageUrl(k,P[k])))})"><span>${i}</span>${esc(l.replace(/ \(.*\)/,''))}</button>`).join('')}</div>`:''}
function formPages(){const P=pagesE();
  openForm({title:"🌐 Pages de l'entreprise",values:P,fields:[{type:'html',html:'<div class="note" style="margin:-4px 0 12px">Ajoute les pages de ton entreprise : elles apparaissent dans « Notre entreprise », dans le menu et dans le bouton Partager. Laisse vide ce que tu n\'as pas.</div>'},
    ...PAGES.map(([k,i,l,ph])=>({k,label:i+' '+l,ph}))],submit:'Enregistrer',
    onSave:async o=>{const p={};PAGES.forEach(([k])=>{if(o[k])p[k]=o[k].trim()});await saveConfig({entreprise:{...ent(),pages:p}});toast('Pages enregistrées.')}})}
function viewVitrine(){const E=ent(),b=brand(),P=pagesE(),url=pageUrl('site',P.site)||pageUrl('facebook',P.facebook)||'';
  const co=[['📞',E.tel,'tel:'+String(E.tel||'').split(/[\/,;]/)[0].replace(/\s/g,'')],['✉️',E.email,'mailto:'+E.email],['📍',[E.adresse,E.ville].filter(Boolean).join(', '),'']].filter(x=>x[1]);
  return `<div class="vit">${bmark(b,'big')}<h2>${esc(b.nom)}</h2>${E.activite||b.slogan?`<p>${esc(E.activite||b.slogan)}</p>`:''}</div>
  <div class="card">${co.map(([i,v,h])=>`<div class="ctc"><div class="av">${i}</div><div class="cm"><b style="white-space:normal">${esc(v)}</b></div>${h?`<div class="ca"><a href="${esc(h)}">↗</a></div>`:''}</div>`).join('')||'<div class="sm mute">Ajoute téléphone, e-mail et adresse dans « Mon entreprise ».</div>'}</div>
  <div class="card"><h3>Nos pages</h3>${pagesLiens('pgl big')||'<div class="sm mute">Aucune page ajoutée pour l\'instant.</div>'}
    ${typeof TEAM!=='undefined'&&TEAM.on&&!TEAM.admin?'':`<button class="btn sec small" style="margin-top:10px" onclick="formPages()">✏️ Ajouter ou modifier les pages</button>`}</div>
  <button class="btn block" onclick="partager({titre:${esc(JSON.stringify(b.nom))},texte:${esc(JSON.stringify(b.nom+(E.activite?' – '+E.activite:'')+(E.tel?'\n📞 '+E.tel:'')))},url:${esc(JSON.stringify(url))}})">↗️ Faire connaître l'entreprise</button>`}
/* ---------- branchements ---------- */
Object.assign(LVIEWS,{msg:['Messagerie',viewMsg],conv:[()=>convInfo(ui.conv).nom,()=>viewConv()],vitrine:['Notre entreprise',viewVitrine]});
const miMsg=menuItems;menuItems=function(){const T=miMsg(),n=nonLus();T.splice(1,0,['Échanges',[{ic:'💬',l:'Messagerie'+(n?` (${n})`:''),f:"go('msg')",on:ui.view==='msg'||ui.view==='conv'},{ic:'🏢',l:'Notre entreprise',f:"go('vitrine')",on:ui.view==='vitrine'}]]);
  const r=T.find(x=>x[0]==='Réglages');if(r)r[1].push({ic:'🌐',l:"Pages de l'entreprise",f:'formPages()'});return T};
const mcMsg=menuOpen;menuOpen=function(){mcMsg();const f=$('#drw .drw-f'),p=pagesLiens('pgl mini');if(f&&p)f.insertAdjacentHTML('beforebegin',`<div style="padding:8px 16px 0">${p}</div>`)};
const hcMsg=heroCard;heroCard=function(){const h=hcMsg(),n=nonLus();return n?h.replace('<div class="hc">',`<div class="hc"><span class="click" onclick="go('msg')">💬 ${n} message${n>1?'s':''} non lu${n>1?'s':''}</span>`):h};
/* contacts : 📞 appeler · ↗ partager / écrire à l'extérieur (plus de lien WhatsApp direct) */
function ctExterne(t){const d=telWa(t);if(!telOk(d)){toast(`Numéro « ${t} » incomplet : ajoute l'indicatif du pays (ex. +237 6XX XX XX XX).`);return}
  $('#modalRoot').innerHTML=`<div class="modal-bg" onclick="if(event.target===this)closeForm()"><div class="modal sheet"><h2>Écrire à +${d}</h2><div class="shg">
    <button onclick="partLien('https://wa.me/${d}')"><span>💬</span>WhatsApp</button><button onclick="partLien('https://t.me/+${d}')"><span>✈️</span>Telegram</button>
    <button onclick="partLien('sms:+${d}')"><span>📱</span>SMS</button><button onclick="partLien('tel:+${d}')"><span>📞</span>Appeler</button></div>
    <div class="note">Ces options ouvrent une application extérieure. Pour échanger avec ton équipe, utilise la 💬 Messagerie de l'application.</div>
    <button class="btn sec block" style="margin-top:12px" onclick="closeForm()">Fermer</button></div></div>`}
/* fil du chantier accessible depuis l'aperçu du chantier */
const vchMsg=viewChantier;viewChantier=function(ch){const h=vchMsg(ch);if(ui.tab!=='apercu')return h;const c=convInfo('ch:'+ch.id);
  return h.replace('<div class="card">',`<button class="btn sec block" style="margin-bottom:12px" onclick="ouvrirConv('ch:${ch.id}')">💬 Discussion du chantier${c.nonlus?` · <span class="badge">${c.nonlus}</span>`:c.n?` · ${c.n} message${c.n>1?'s':''}`:''}</button><div class="card">`)};
const stMsg=document.createElement('style');stMsg.textContent=`.cvl{display:flex;gap:12px;align-items:center;padding:11px 0;border-top:1px solid var(--line)}.cvl:first-child{border-top:0}
.cvl .av,.cvh .av{width:44px;height:44px;border-radius:50%;background:var(--acc2);display:grid;place-items:center;font-size:20px;flex:none}.cvl .bmark{width:44px;height:44px;font-size:16px;border-radius:50%}
.cvl .cm{flex:1;min-width:0}.cvl .cm b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cvl small{color:var(--mute);font-size:12px}.cvl .pv{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;margin-right:8px}
.badge{display:inline-grid;place-items:center;min-width:20px;height:20px;padding:0 6px;border-radius:10px;background:var(--acc);color:var(--acc-ink);font-size:11.5px;font-weight:800}
.cvh{display:flex;gap:10px;align-items:center;margin-bottom:10px}.cvh .bmark{width:40px;height:40px;font-size:15px;border-radius:50%}.cvh b{display:block}.cvh small{color:var(--mute);font-size:12px}
.bubs{display:flex;flex-direction:column;gap:6px;height:calc(100vh - 250px);min-height:260px;overflow-y:auto;padding:10px;background:var(--card);border:1px solid var(--line);border-radius:16px}
.bub{max-width:82%;align-self:flex-start;background:var(--bg);border-radius:4px 16px 16px 16px;padding:7px 11px 5px;cursor:pointer;box-shadow:var(--shadow)}
.bub.me{align-self:flex-end;background:var(--acc);color:var(--acc-ink);border-radius:16px 4px 16px 16px}.bub .ba{font-size:11.5px;font-weight:700;color:var(--acc);margin-bottom:1px}
.bub .bt{white-space:pre-wrap;word-break:break-word;line-height:1.4}.bub .bh{font-size:10.5px;opacity:.65;text-align:right;margin-top:2px}
.dsep{text-align:center;margin:8px 0}.dsep span{font-size:11.5px;color:var(--mute);background:var(--bg);padding:3px 10px;border-radius:10px}
.cvf{display:flex;gap:8px;align-items:flex-end;margin-top:10px}.cvf textarea{flex:1;resize:none;padding:11px 14px;border:1px solid var(--line);border-radius:22px;background:var(--card);font-size:15px;max-height:120px}
.cvf .btn{width:46px;height:46px;border-radius:50%;padding:0;font-size:18px;flex:none}
.shg{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.shg button{display:flex;flex-direction:column;align-items:center;gap:4px;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:14px;padding:12px 4px;font-size:12.5px;font-weight:600}.shg button span{font-size:24px}
.pgl{display:flex;flex-wrap:wrap;gap:6px}.pgl button{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:20px;padding:6px 11px;font-size:13px;font-weight:600}
.pgl.big button{padding:9px 13px;font-size:14px}.pgl.mini button{padding:5px 9px;font-size:12px}
.vit{text-align:center;padding:10px 0 16px}.vit .bmark.big{margin:0 auto}.vit h2{margin:14px 0 4px;font-size:21px}.vit p{margin:0;color:var(--mute)}`;document.head.appendChild(stMsg);
$('#btnBack').addEventListener('click',e=>{if(ui.view==='conv'){e.stopImmediatePropagation();ui.view='msg';render()}},true);
