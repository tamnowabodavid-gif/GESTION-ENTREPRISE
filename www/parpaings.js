/* ===== Parpaings : types, dimensions réelles, nombre et mortier de pose ===== */
/* dimensions lues dans la désignation « ép × h × L » (ex. 15 × 20 × 40), modifiables dans les Règles de calcul */
const PPX=/(hourdis|poutrelle|claustra|entrevous)/i;
function ppNomDims(nom){const m=String(nom||'').match(/(\d+(?:[.,]\d+)?)\s*[×x]\s*(\d+(?:[.,]\d+)?)\s*[×x]\s*(\d+(?:[.,]\d+)?)/);if(!m)return null;const v=[m[1],m[2],m[3]].map(num);return{ep:v[0],H:v[1],L:v[2]}}
function ppIs(a){return a&&!a.hidden&&!PPX.test(a.nom)&&(String(a.ref).startsWith('pp-')||/(parpaing|agglo|bloc|brique)/i.test(a.nom))&&!!ppNomDims(a.nom)}
function ppAll(){return articles().filter(ppIs)}
function ppDims(ref){const a=art(ref)||{nom:''},ov=(((S.config.regles||{}).ppd)||{})[ref]||{},d=ppNomDims(a.nom)||{ep:/10/.test(ref)?10:/20/.test(ref)?20:15,H:20,L:40};
  const g=k=>ov[k]!=null&&ov[k]!==''&&num(ov[k])>0?num(ov[k]):d[k];return{L:g('L'),H:g('H'),ep:g('ep'),creux:!/plein/i.test(a.nom),nom:a.nom||ref}}
function PPLIST(){return ppAll().map(a=>{const d=ppDims(a.ref);return[a.ref,`${a.nom.replace(/\s*\(.*\)\s*$/,'')}`]})}
function SOUBLIST(){const L=[['auto','Même parpaing que les murs extérieurs, bourré']];ppAll().forEach(a=>{const d=ppDims(a.ref),n=a.nom.replace(/\s*\(.*\)\s*$/,'');if(d.creux)L.push([a.ref+'#b',n+' — bourré']);L.push([a.ref,n+(d.creux?' — non bourré':'')])});return L}
/* calcul : nombre de parpaings et mortier de pose pour une surface S (m²) */
function ppCalc(ref,S,R){const d=ppDims(ref),j=(R.epJoint??1)/100,Lb=d.L/100,Hb=d.H/100,e=d.ep/100,s=(Lb+j)*(Hb+j),nb0=S/s,nb=nb0*(1+R.casse/100),part=1-Lb*Hb/s,V0=S*e*part,Vm=V0*(1+(R.pertMor??15)/100),vide=d.creux?(R.videPp??40)/100:0;
  const steps=[`Parpaing ${d.L} × ${d.H} cm, épaisseur ${d.ep} cm, joints de ${N(j*100)} cm → il occupe (${N(Lb)} + ${N(j)}) × (${N(Hb)} + ${N(j)}) = ${N(s,4)} m² de mur, soit ${N(1/s,2)} parpaings par m²`,
    `Nombre : ${N(S)} m² ÷ ${N(s,4)} m² = ${N(nb0,0)} parpaings + ${R.casse} % de casse = ${N(Math.ceil(nb),0)} parpaings`,
    `Mortier de pose = volume des joints : ${N(S)} m² × ${N(e)} m d'épaisseur × (1 − ${N(Lb*Hb,3)} ÷ ${N(s,4)}) = ${N(S)} × ${N(e)} × ${N(part*100,1)} % = ${N(V0,3)} m³ + ${R.pertMor??15} % de pertes (alvéoles, chutes) = ${N(Vm,3)} m³`];
  return{...d,j,s,nb0,nb,V0,Vm,part,vide,steps}}
/* ===== Règles : dimensions réelles des parpaings ===== */
function ppReglesCard(){if(!ui.ppDraft)ui.ppDraft=JSON.parse(JSON.stringify(((S.config.regles||{}).ppd)||{}));const D=ui.ppDraft;
  return `<div class="card"><h3>Parpaings : types et dimensions réelles</h3><div class="sm mute" style="margin:4px 0 8px">Longueur × hauteur × épaisseur réelles du bloc, sans le joint (l'épaisseur des joints se règle plus haut dans « Maçonnerie »). Les dimensions sont lues dans le nom de l'article (« 15 × 20 × 40 » = épaisseur × hauteur × longueur) ; tu peux les corriger ici. Pour un autre type, ajoute un article dans le Catalogue avec ses dimensions dans le nom.</div>
   ${ppAll().map(a=>{const d0=ppNomDims(a.nom)||{},o=D[a.ref]||{},f=(k,l)=>{const v=o[k],chg=v!=null&&v!==''&&num(v)!==d0[k];return `<label class="f"><span>${l} (cm)</span><input inputmode="decimal" class="${chg?'chg':''}" value="${esc(v!=null&&v!==''?v:N(d0[k]))}" oninput="(ui.ppDraft['${a.ref}']=ui.ppDraft['${a.ref}']||{})['${k}']=this.value"></label>`};
     return `<div style="margin:8px 0 2px;font-weight:600">${esc(a.nom)}</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${f('L','Longueur')}${f('H','Hauteur')}${f('ep','Épaisseur')}</div>`}).join('')}
   <button class="btn ghost small" style="margin-top:8px" onclick="go('catalogue');ui.catSect='maconnerie';render()">+ Ajouter un type de parpaing (Catalogue)</button></div>`}
function ppSaveDraft(out){const D=ui.ppDraft||{},o={};Object.entries(D).forEach(([ref,v])=>{const a=art(ref),d0=ppNomDims(a&&a.nom)||{},x={};['L','H','ep'].forEach(k=>{const n=num(v[k]);if(v[k]!=null&&v[k]!==''&&n>0&&n!==d0[k])x[k]=n});if(Object.keys(x).length)o[ref]=x});out.ppd=o;ui.ppDraft=null}
