/* native.js — application Android (APK), sauvegarde / restauration des données, mises à jour */
const APP_VERSION='2026.11.20.5';
const isNative=()=>!!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform());
const capP=n=>window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins[n];
/* enregistrement des fichiers hors de Claude : partage Android (WhatsApp, Drive, Fichiers) ou téléchargement */
function localDownloads(){return{save:async({filename,data})=>{
  if(isNative()&&capP('Filesystem')&&capP('Share')){const b64=(await blobToUrl(data)).split(',')[1],w=await capP('Filesystem').writeFile({path:filename.replace(/[\/\\:*?"<>|]/g,'-'),data:b64,directory:'CACHE'});
    try{await capP('Share').share({title:filename,files:[w.uri],dialogTitle:'Enregistrer ou envoyer'})}catch(e){if(/cancel/i.test(String(e&&e.message)))throw{code:'declined'};throw e}return{status:'shared'}}
  const f=new File([data],filename,{type:data.type||'application/octet-stream'});
  if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],title:filename});return{status:'shared'}}catch(e){if(e&&e.name==='AbortError')throw{code:'declined'}}}
  const a=document.createElement('a');a.href=URL.createObjectURL(data);a.download=filename;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},3000);return{status:'saved'}}}}
/* ---------- sauvegarde ---------- */
function backupData(){const o={app:'chantier-pro',version:APP_VERSION,date:new Date().toISOString(),source:mode==='db'?'claude':isNative()?'apk':'navigateur',data:{}};
  COLLS.forEach(c=>o.data[c]=S[c]);Object.assign(o.data,{config:S.config,prixOv:S.prixOv,artOv:S.artOv,sig:S.sig,cachet:S.cachet});return o}
async function exportData(){const o=backupData(),n=COLLS.reduce((a,c)=>a+S[c].length,0),d=new Date(),p=x=>String(x).padStart(2,'0'),fn=`Chantier Pro - sauvegarde ${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}h${p(d.getMinutes())}.json`;
  try{await (downloads||localDownloads()).save({filename:fn,data:new Blob([JSON.stringify(o)],{type:'application/json'})});try{localStorage.setItem('cp_lastBackup',String(Date.now()))}catch(e){}
    toast(`Sauvegarde prête (${n} éléments). Garde-la dans Google Drive ou WhatsApp.`);const m=$('#bkInfo');if(m)m.innerHTML=bkInfo()}
  catch(e){toast(e&&e.code==='declined'?'Sauvegarde annulée.':"La sauvegarde n'a pas pu être enregistrée.")}}
async function importData(inp){const f=inp.files&&inp.files[0];inp.value='';if(!f)return;let o;try{o=JSON.parse(await f.text())}catch(e){toast('Fichier illisible.');return}
  if(!o||o.app!=='chantier-pro'||!o.data){toast("Ce fichier n'est pas une sauvegarde Chantier Pro.");return}
  const n=COLLS.reduce((a,c)=>a+((o.data[c]||[]).length),0),dt=o.date?new Date(o.date).toLocaleString('fr-FR'):'?';
  if(!confirm(`Importer la sauvegarde du ${dt} (${n} éléments, version ${o.version||'?'}) ?\n\nLes éléments déjà présents avec le même identifiant sont remplacés ; les autres sont gardés. Les réglages de l'entreprise et les prix sont remplacés.`))return;
  const bar=$('#bkInfo');let k=0;const tick=()=>{if(bar)bar.textContent=`Import… ${k} / ${n}`};
  try{for(const c of COLLS){const L=o.data[c]||[];for(let i=0;i<L.length;i+=15){await Promise.all(L.slice(i,i+15).map(r=>r&&r.id?save(c,r).catch(()=>null):null));k+=Math.min(15,L.length-i);tick()}}
    if(o.data.config)await saveConfig(o.data.config);if(o.data.prixOv||o.data.artOv){S.prixOv=o.data.prixOv||{};S.artOv=o.data.artOv||{};await savePrix()}
    if(o.data.sig)await saveImg('sig',o.data.sig);if(o.data.cachet)await saveImg('cachet',o.data.cachet);if(mode!=='db')persistLocal();
    toast(`${n} éléments importés.`);if(bar)bar.innerHTML=bkInfo();render()}
  catch(e){toast("L'import s'est arrêté : "+(e&&e.message||'erreur'))}}
function bkInfo(){let t='';try{const l=+localStorage.getItem('cp_lastBackup')||0;t=l?`Dernière sauvegarde depuis cet appareil : ${new Date(l).toLocaleString('fr-FR')}`:'Aucune sauvegarde faite depuis cet appareil.'}catch(e){}
  return `${t}<br>Données : ${mode==='db'?'synchronisées avec ton compte Claude':isNative()?'enregistrées sur ce téléphone (application Android)':'enregistrées dans ce navigateur'} · version ${APP_VERSION}`}
function dataBlock(){const E=ent();return `<div class="f" style="border:1px solid var(--line);border-radius:12px;padding:10px;margin-bottom:12px"><span class="lbl">💾 Mes données et l'application</span>
  <div class="sm mute" id="bkInfo" style="margin:4px 0 8px">${bkInfo()}</div>
  <div class="qbtns"><button type="button" class="btn sec small" onclick="exportData()">💾 Sauvegarder mes données</button><label class="btn ghost small upl">📥 Restaurer une sauvegarde<input type="file" accept=".json,application/json" onchange="importData(this)"></label></div>
  <div class="note" style="margin-top:6px">La sauvegarde est un fichier unique avec tous les chantiers, devis, prix et réglages. Envoie-le dans Google Drive pour l'avoir dans le cloud, ou restaure-le dans l'autre version (Claude ou application Android).</div>
  ${isNative()?`<div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap"><button type="button" class="btn sec small" onclick="checkUpdate(true)">🔄 Vérifier les mises à jour</button></div>`:''}
  <label class="f" style="margin-top:8px"><span>Dépôt GitHub de l'application Android (pour les mises à jour)</span><input id="apkRepo" value="${esc(E.apkRepo||'')}" placeholder="ex. kleintech/chantier-pro" onchange="saveConfig({entreprise:{...ent(),apkRepo:this.value.trim()}})"></label></div>`}
/* ---------- mises à jour de l'application Android ---------- */
const verCmp=(a,b)=>{const A=String(a).replace(/^v/,'').split(/[.\-]/).map(Number),B=String(b).replace(/^v/,'').split(/[.\-]/).map(Number);for(let i=0;i<Math.max(A.length,B.length);i++){const d=(A[i]||0)-(B[i]||0);if(d)return d}return 0};
async function checkUpdate(manual){const repo=(ent().apkRepo||'').trim();if(!repo){if(manual)toast("Indique d'abord le dépôt GitHub de l'application.");return}
  try{const r=await fetch(`https://api.github.com/repos/${repo}/releases/latest`,{headers:{Accept:'application/vnd.github+json'}});if(!r.ok)throw new Error(r.status===404?'dépôt ou version introuvable (le dépôt doit être public)':'GitHub '+r.status);
    const j=await r.json(),tag=j.tag_name||'',apk=(j.assets||[]).find(a=>/\.apk$/i.test(a.name));
    if(verCmp(tag,APP_VERSION)>0&&apk){window.__upd={tag,url:apk.browser_download_url,notes:j.body||''};render();if(manual)toast('Nouvelle version '+tag+' disponible.')}else if(manual)toast(`Tu as la dernière version (${APP_VERSION}).`)}
  catch(e){if(manual)toast('Vérification impossible : '+e.message)}}
async function openUpdate(){const u=window.__upd;if(!u)return;try{localStorage.setItem('cp_lastBackup_hint','1')}catch(e){}
  if(capP('Browser'))await capP('Browser').open({url:u.url});else window.open(u.url,'_blank')}
function updBanner(){const u=window.__upd;return u?`<div class="banner" style="display:flex;justify-content:space-between;align-items:center;gap:8px">Nouvelle version ${esc(u.tag)} de Chantier Pro <button class="btn small" onclick="openUpdate()">Télécharger</button></div>`:''}
function backupReminder(){if(mode==='db')return'';let l=0;try{l=+localStorage.getItem('cp_lastBackup')||0}catch(e){}const j=l?Math.floor((Date.now()-l)/864e5):null;
  return j===null||j>=7?`<div class="banner w" style="display:flex;justify-content:space-between;align-items:center;gap:8px">${j===null?'Aucune sauvegarde de tes données.':'Dernière sauvegarde il y a '+j+' jours.'} <button class="btn small" onclick="exportData()">💾 Sauvegarder</button></div>`:''}
if(isNative()){document.documentElement.classList.add('native');setTimeout(()=>checkUpdate(false),4000);
  const app=capP('App');if(app)app.addListener('backButton',()=>{if(document.querySelector('.modal-bg')){closeForm();return}if(ui.view!=='home'){$('#btnBack').click();return}app.minimizeApp()})}
