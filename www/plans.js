/* plans.js — plans de ferraillage, d'escalier et d'implantation tirés des renseignements du devis */
function plansOf(d){const P=d.params||(d.paramsJson?JSON.parse(d.paramsJson):null);if(!P)return null;PLRec={};try{genDevis(P)}catch(e){console.error(e)}const r=PLRec;PLRec=null;r.p=P;return r}
const PL_C={beton:'#efe9df',trait:'#555',acier:'#c0392b',cadre:'#1f5fa8',cote:'#666',sol:'#a08060'};
const pT=(x,y,t,o={})=>`<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${o.s||10}" fill="${o.c||'#222'}" text-anchor="${o.a||'middle'}"${o.b?' font-weight="bold"':''}${o.r!=null?` transform="rotate(${o.r} ${x.toFixed(1)} ${y.toFixed(1)})"`:''}>${esc(String(t))}</text>`;
const pL=(x1,y1,x2,y2,c='#555',w=1,da)=>`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${c}" stroke-width="${w}"${da?` stroke-dasharray="${da}"`:''}/>`;
const pR=(x,y,w,h,f,s='#555',sw=1,o='')=>`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(0,w).toFixed(1)}" height="${Math.max(0,h).toFixed(1)}" fill="${f}" stroke="${s}" stroke-width="${sw}" ${o}/>`;
function pCotH(x1,x2,y,t,up=1){const c=PL_C.cote;return pL(x1,y,x2,y,c,.7)+pL(x1,y-4,x1,y+4,c,.7)+pL(x2,y-4,x2,y+4,c,.7)+pT((x1+x2)/2,y+(up?-3:11),t,{s:9,c:'#333'})}
function pCotV(y1,y2,x,t,left=1){const c=PL_C.cote;return pL(x,y1,x,y2,c,.7)+pL(x-4,y1,x+4,y1,c,.7)+pL(x-4,y2,x+4,y2,c,.7)+pT(x+(left?-4:11),(y1+y2)/2,t,{s:9,c:'#333',r:-90})}
const pSVG=(w,h,body,title)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="max-width:100%;height:auto;background:#fff;font-family:Helvetica,Arial,sans-serif">${title?pT(w/2,18,title,{s:13,b:1}):''}${body}</svg>`;
const cm=x=>N(x*100,0);
/* barres d'un élément : code combiné (4HA12+2HA10) ou n × HA d */
function plBars(code,n,d){const A=code?armParse(code):[];const L=A.length?A:[{n:num(n),d:num(d)}];const out=[];L.forEach(x=>{for(let i=0;i<x.n;i++)out.push(x.d)});return out.sort((a,b)=>b-a)}
function plBarsTxt(code,n,d){const A=code?armParse(code):[];return A.length?A.map(x=>x.n+'HA'+x.d).join(' + '):`${n}HA${d}`}
/* positions des barres dans une section b × h (m) */
function plPos(b,h,bars,kind,enr,cd){const c=enr+cd/1000+bars[0]/2000,x0=c,x1=b-c,y0=c,y1=h-c,P=[[x0,y1],[x1,y1],[x0,y0],[x1,y0]];const rest=bars.slice(4);
  if(bars.length<4)return bars.map((d,i)=>({x:i%2?x1:x0,y:i<2?y1:y0,d}));
  const sides=kind==='pot'?['b','t','l','r']:['b','t'],cnt={b:0,t:0,l:0,r:0};rest.forEach((d,i)=>cnt[sides[i%sides.length]]++);
  const out=bars.slice(0,4).map((d,i)=>({x:P[i][0],y:P[i][1],d}));const k={b:0,t:0,l:0,r:0};
  rest.forEach((d,i)=>{const s=sides[i%sides.length],j=++k[s],f=j/(cnt[s]+1);out.push(s==='b'?{x:x0+(x1-x0)*f,y:y1,d}:s==='t'?{x:x0+(x1-x0)*f,y:y0,d}:s==='l'?{x:x0,y:y0+(y1-y0)*f,d}:{x:x1,y:y0+(y1-y0)*f,d})});return out}
/* coupe transversale */
function plSec(o){const W=300,S=Math.min(160/o.b,150/o.h),bw=o.b*S,bh=o.h*S,ox=(W-bw)/2,oy=46,c=o.enr*S,cd=Math.max(1.2,o.cd/1000*S);
  let s=pR(ox,oy,bw,bh,PL_C.beton,PL_C.trait,1.2)+`<rect x="${(ox+c).toFixed(1)}" y="${(oy+c).toFixed(1)}" width="${(bw-2*c).toFixed(1)}" height="${(bh-2*c).toFixed(1)}" rx="4" fill="none" stroke="${PL_C.cadre}" stroke-width="${cd.toFixed(1)}"/>`;
  s+=pL(ox+c,oy+c,ox+c+12,oy+c+12,PL_C.cadre,cd);o.pos.forEach(b=>{s+=`<circle cx="${(ox+b.x*S).toFixed(1)}" cy="${(oy+b.y*S).toFixed(1)}" r="${Math.max(2.6,b.d/1000*S/2*1.3).toFixed(1)}" fill="${PL_C.acier}"/>`});
  s+=pCotH(ox,ox+bw,oy+bh+16,cm(o.b)+' cm',0)+pCotV(oy,oy+bh,ox-14,cm(o.h)+' cm')+pT(ox+bw+8,oy+c+4,`enrobage ${N(o.enr*100,1)} cm`,{s:8,a:'start',c:'#555'});
  const yy=oy+bh+42;s+=pT(W/2,yy,o.l1,{s:10,b:1,c:PL_C.acier})+pT(W/2,yy+14,o.l2,{s:10,c:PL_C.cadre});return pSVG(W,yy+24,s,o.title)}
/* élévation d'un élément vertical (poteau / amorce) */
function plElevV(o){const W=300,Hpx=Math.min(300,Math.max(180,o.H*80)),S=Hpx/o.Htot,bw=Math.max(34,o.b*S*1.6),ox=W/2-bw/2,oy=40;let s='';
  o.parts.forEach(p=>{s+=pR(ox+(p.dx||0)*S,oy+p.y0*S,p.w?p.w*S:bw,(p.y1-p.y0)*S,p.f||PL_C.beton,PL_C.trait,1)+(p.t?pT(ox-(p.w&&p.w*S>bw?(p.w*S-bw)/2+(p.dx?0:0):0)-8,oy+(p.y0+p.y1)/2*S+3,p.t,{s:8.5,a:'end',c:'#444'}):'')});
  const c=6;o.bars.forEach(b=>{const x=ox+(b.side?bw-c:c);s+=pL(x,oy+b.y0*S,x,oy+b.y1*S,PL_C.acier,2.2);if(b.hook)s+=pL(x,oy+b.y1*S,x+(b.side?-1:1)*b.hook*S,oy+b.y1*S,PL_C.acier,2.2)});
  o.cads.forEach(z=>{const n=Math.max(2,Math.ceil((z.y1-z.y0)/z.e-1e-9)+1);for(let i=0;i<n;i++){const y=oy+(z.y0+(z.y1-z.y0)*i/(n-1))*S;s+=pL(ox+3,y,ox+bw-3,y,PL_C.cadre,1)}if(z.t)s+=pT(ox+bw+8,oy+(z.y0+z.y1)/2*S,z.t,{s:8.5,a:'start',c:PL_C.cadre})});
  (o.cotes||[]).forEach(k=>s+=pCotV(oy+k.y0*S,oy+k.y1*S,ox+bw+(k.x||70),k.t,0));
  (o.notes||[]).forEach((t,i)=>s+=pT(W/2,oy+o.Htot*S+22+i*13,t,{s:9,c:i?'#444':PL_C.acier}));return pSVG(W,oy+o.Htot*S+30+(o.notes||[]).length*13,s,o.title)}
/* élévation d'une poutre (longrine, chaînage, linteau) */
function plElevH(o){const W=560,S=Math.min(380/o.L,300/o.h),bw=o.L*S,bh=Math.max(26,o.h*S),ox=(W-bw)/2-30,oy=46;let s='';
  (o.app||[]).forEach(a=>s+=pR(ox+a.x*S,oy+bh,a.w*S,40,'#ddd','#999',.8)+pT(ox+(a.x+a.w/2)*S,oy+bh+26,a.t,{s:8,c:'#555'}));
  if(o.open)s+=pT(ox+bw/2,oy+bh+26,o.open,{s:9,c:'#555'});
  s+=pR(ox,oy,bw,bh,PL_C.beton,PL_C.trait,1.2);const c=5;s+=pL(ox+c,oy+c,ox+bw-c,oy+c,PL_C.acier,2.2)+pL(ox+c,oy+bh-c,ox+bw-c,oy+bh-c,PL_C.acier,2.6);
  if(o.hooks){s+=pL(ox+c,oy+c,ox+c,oy+bh-c,PL_C.acier,2)+pL(ox+bw-c,oy+c,ox+bw-c,oy+bh-c,PL_C.acier,2)}
  const n=Math.min(80,Math.ceil(o.L/o.e-1e-9)+1);for(let i=0;i<n;i++){const x=ox+6+(bw-12)*i/(n-1);s+=pL(x,oy+3,x,oy+bh-3,PL_C.cadre,1)}
  s+=pCotH(ox,ox+bw,oy-10,o.tL)+pT(ox+bw+6,oy+c+3,o.tSup,{s:8.5,a:'start',c:PL_C.acier})+pT(ox+bw+6,oy+bh-c+3,o.tInf,{s:8.5,a:'start',c:PL_C.acier})+pT(ox+bw/2,oy+bh+(o.app||o.open?58:22),o.tCad,{s:9,c:PL_C.cadre});
  (o.notes||[]).forEach((t,i)=>s+=pT(W/2,oy+bh+(o.app||o.open?74:38)+i*13,t,{s:9,c:'#444'}));return pSVG(W,oy+bh+(o.app||o.open?82:46)+(o.notes||[]).length*13,s,o.title)}
/* semelle isolée : vue en plan + coupe */
function plSem(o){const W=560,S=170/o.a,a=o.a*S,ox=40,oy=50,c=o.c*S,n=o.n1;let s=pR(ox,oy,a,a,PL_C.beton,PL_C.trait,1.2);
  for(let i=0;i<n;i++){const t=c+(a-2*c)*i/Math.max(1,n-1);s+=pL(ox+t,oy+c,ox+t,oy+a-c,PL_C.acier,1.6)+pL(ox+c,oy+t,ox+a-c,oy+t,PL_C.acier,1.6)}
  const pb=o.b*S;s+=pR(ox+(a-pb)/2,oy+(a-pb)/2,pb,pb,'#d9cfc0',PL_C.trait,1)+pT(ox+a/2,oy+a/2+3,'amorce',{s:8});
  s+=pCotH(ox,ox+a,oy+a+16,cm(o.a)+' cm',0)+pCotV(oy,oy+a,ox-14,cm(o.a)+' cm')+pT(ox+a/2,oy+a+40,'VUE EN PLAN',{s:9,b:1});
  const hx=300,hs=Math.min(S*1.2,190/(o.h+o.am+0.65),230/o.a),aw=o.a*hs,hh=o.h*hs,pr=0.05*hs,y0=oy+20+(o.am+0.6)*hs,bx=hx+(200-aw)/2;
  s+=pR(bx-6,y0+hh,aw+12,pr,'#ccc','#999',.8)+pT(bx+aw+12,y0+hh+pr,'propreté 5 cm',{s:8,a:'start',c:'#666'});
  s+=pR(bx,y0,aw,hh,PL_C.beton,PL_C.trait,1.2);const ab=o.b*hs,ax=bx+(aw-ab)/2;s+=pR(ax,y0-o.am*hs,ab,o.am*hs,'#e4dccd',PL_C.trait,1);
  s+=pL(bx+c*hs/S,y0+hh-c*hs/S,bx+aw-c*hs/S,y0+hh-c*hs/S,PL_C.acier,2.4);for(let i=0;i<n;i++){const x=bx+c*hs/S+(aw-2*c*hs/S)*i/Math.max(1,n-1);s+=`<circle cx="${x.toFixed(1)}" cy="${(y0+hh-c*hs/S-3).toFixed(1)}" r="1.8" fill="${PL_C.acier}"/>`}
  [ax+4,ax+ab-4].forEach((x,i)=>{s+=pL(x,y0-(o.am+0.6)*hs,x,y0+hh-c*hs/S-5,PL_C.acier,2.2)+pL(x,y0+hh-c*hs/S-5,x+(i?1:-1)*0.3*hs,y0+hh-c*hs/S-5,PL_C.acier,2.2)});
  s+=pCotV(y0,y0+hh,bx+aw+16,cm(o.h)+' cm',0)+pCotV(y0-o.am*hs,y0,bx-14,'amorce '+cm(o.am))+pCotV(y0-(o.am+0.6)*hs,y0-o.am*hs,bx-14,'attente 60');
  s+=pT(hx+100,oy+a+40,'COUPE',{s:9,b:1});
  const yy=oy+a+60;s+=pT(W/2,yy,`Nappe inférieure : ${n} HA${o.d} par sens, tous les ${N(o.e*100,1)} cm, retours de 15 cm`,{s:10,b:1,c:PL_C.acier})+pT(W/2,yy+14,`Enrobage ${N(o.c*100,1)} cm (béton de propreté dessous) ; aciers de l'amorce posés sur la nappe avec crosse de 30 cm`,{s:9,c:'#444'});
  return pSVG(W,yy+24,s,o.title)}
/* escalier : coupe de la 1re volée */
function plEsc(e){const W=560,v=e.VV[0],tot=v.rc+(e.Lp?e.lg:0)+0.4,S=Math.min(440/tot,240/(v.ht+0.3)),ox=50,oy=40+v.ht*S+10;let s='',x=ox,y=oy,pts=[[x,y]];
  for(let i=0;i<v.v;i++){y-=e.h*S;pts.push([x,y]);if(i<v.v-1){x+=e.g*S;pts.push([x,y])}}const xe=x+(e.Lp?e.lg*S:0.4*S);pts.push([xe,y]);
  const t=e.e*S/Math.cos(Math.atan(v.ht/Math.max(0.01,v.rc)));const bot=[[xe,y+e.e*S],[x,y+e.e*S],[ox,oy+t]];
  s+=`<polygon points="${[...pts,...bot].map(p=>p.map(z=>z.toFixed(1)).join(',')).join(' ')}" fill="${PL_C.beton}" stroke="${PL_C.trait}" stroke-width="1.2"/>`;
  s+=pL(ox+4,oy+t-5,x,y+e.e*S-5,PL_C.acier,2.2)+pL(x,y+e.e*S-5,xe-4,y+e.e*S-5,PL_C.acier,2.2)+pL(ox+4,oy+t-5,ox+4+0.4*S*0.9,oy+t-5-0.4*S*0.4,PL_C.acier,1.6);
  s+=pL(ox-30,oy,ox+30,oy,'#999',1)+pT(ox-32,oy+3,'±0',{s:8,a:'end'});s+=pCotV(y,oy,ox-18,`${v.v} × ${N(e.h*100,1)} = ${N(v.ht,2)} m`);
  s+=pCotH(ox,x,oy+t+18,`${v.v-1} × ${N(e.g*100,1)} = ${N(v.rc,2)} m`,0)+(e.Lp?pCotH(x,xe,oy+t+18,`palier ${N(e.lg,2)} m`,0):'');
  s+=pT(ox+(x-ox)*0.55,oy-(v.ht*S)*0.55+t+12,`paillasse ${cm(e.e)} cm`,{s:8.5,c:'#444',r:-Math.atan(v.ht/Math.max(0.01,v.rc))*180/Math.PI});
  const yy=oy+t+48,L=[`${e.nC} contremarches de ${N(e.h*100,1)} cm · giron ${N(e.g*100,1)} cm · Blondel 2h + g = ${N(e.bl,1)} cm ${e.bl>=60&&e.bl<=64?'✔':'⚠'}`,`Aciers principaux HA${e.dE} tous les ${N(e.eE*100)} cm + 2 ancrages de 40 cm · répartition HA8 / 20 cm · chapeaux HA10 en haut et en bas`,`${e.ty==='droit'?'Escalier droit':e.ty==='L'?'Escalier en L : la 2ᵉ volée part du palier à 90°':'Escalier en U : la 2ᵉ volée repart du palier en sens inverse'} · largeur ${N(e.lg)} m · trémie ≥ ${N(e.tre,2)} m`];
  L.forEach((z,i)=>s+=pT(W/2,yy+i*14,z,{s:9.5,c:i===1?PL_C.acier:'#333',b:!i}));return pSVG(W,yy+L.length*14+8,s,`ESCALIER – COUPE DE LA VOLÉE 1 (${e.VV[0].v} contremarches)`)}
/* nomenclature des aciers */
function plNom(r){const g=r.gen||{},enr=(g.enr||3)/100,lr=d=>40*d/1000,cadL=(b,h)=>2*(b+h-4*enr)+0.12,rows=[],add=(el,rep,d,forme,lu,nE,nT)=>rows.push({el,rep,d,forme,lu,nE,nT,Lt:lu*nT,kg:lu*nT*(BARW[d]||0)});
  if(r.sem){const s=r.sem,c=(g.cF||5)/100,n1=Math.floor((s.a-2*c)/s.e+1e-9)+1;add('Semelle isolée','S1',s.d,`droite + 2 retours 15 cm`,s.a-2*c+0.3,n1*2,n1*2*s.n)}
  if(r.am){const a=r.am,B=plBars(a.arm,a.n,a.d);[...new Set(B)].forEach((d,i)=>{const k=B.filter(x=>x===d).length;add('Amorce','A'+(i+1),d,'crosse 30 + attente 60 cm',a.h+0.9,k,k*a.nb)});const nc=Math.ceil(a.h/a.ce-1e-9)+1;add('Amorce','Ac',a.cd,`cadre ${cm(a.b)}×${cm(a.b)}`,cadL(a.b,a.b),nc,nc*a.nb)}
  if(r.pot){const p=r.pot,B=plBars(p.arm,p.n,p.d);[...new Set(B)].forEach((d,i)=>{const k=B.filter(x=>x===d).length;add('Poteau (par niveau)','P'+(i+1),d,`droite, recouvrement 40Φ = ${cm(lr(d))} cm`,p.H+lr(d),k,k*p.nb*p.nN)});const nc=Math.ceil(p.H/p.ce-1e-9)+1;add('Poteau (par niveau)','Pc',p.cd,`cadre ${cm(p.b)}×${cm(p.b)}`,cadL(p.b,p.b),nc,nc*p.nb*p.nN)}
  if(r.lon){const o=r.lon,B=plBars(o.arm,o.n,o.d),lb=g.lb||11.5;[...new Set(B)].forEach((d,i)=>{const k=B.filter(x=>x===d).length,nb=Math.ceil(o.L/(lb-lr(d))-1e-9);add(o.rad?'Nervures du radier':'Longrines / chaînage bas','L'+(i+1),d,`barres de ${N(lb,1)} m, recouvrement 40Φ`,lb,k,k*nb)});const nc=Math.ceil(o.L/o.ce-1e-9)+1;add(o.rad?'Nervures du radier':'Longrines / chaînage bas','Lc',o.cd,`cadre ${cm(o.b)}×${cm(o.h)}`,cadL(o.b,o.h),'/'+N(o.ce*100,0)+' cm',nc)}
  if(r.ch){const o=r.ch,lb=g.lb||11.5;o.bars.forEach((b,i)=>{const nb=Math.ceil(o.L/(lb-lr(b[1]))-1e-9);add(o.et?'Poutres / chaînages hauts':'Chaînage haut','C'+(i+1),b[1],`${b[2]==='inf'?'inférieurs':'supérieurs'}, barres de ${N(lb,1)} m`,lb,b[0],b[0]*nb)});const nc=Math.ceil(o.L/o.ce-1e-9)+1;add(o.et?'Poutres / chaînages hauts':'Chaînage haut','Cc',o.cd,`cadre 20×${cm(o.h)}`,cadL(o.b,o.h),'/'+N(o.ce*100,0)+' cm',nc)}
  if(r.lin){const o=r.lin;o.list.forEach((x,i)=>{const big=x.L>1.5,lu=x.L+2*o.app;add('Linteau '+x.lab,'Li'+(i+1),big?12:10,'inférieurs',lu,2,2*x.Q);add('Linteau '+x.lab,'Ls'+(i+1),big?10:8,'supérieurs',lu,2,2*x.Q);const nc=Math.ceil(lu/0.2-1e-9)+1;add('Linteau '+x.lab,'Lc'+(i+1),6,`cadre ${cm(o.b)}×${cm(o.h)}`,cadL(o.b,o.h),nc,nc*x.Q)})}
  return rows}
/* ---------- plan d'implantation ---------- */
/* axes nommés « Axe 7 (B à I) » : on retrouve les coordonnées de la grille à partir des longueurs */
const plKey=k=>/^\d+$/.test(k)?+k:k.toUpperCase();
function plKcmp(a,b){a=plKey(a);b=plKey(b);return typeof a===typeof b?(a<b?-1:a>b?1:0):typeof a==='number'?-1:1}
function plGrid(AX){const re=/axe\s+([A-Za-z0-9]+)\s*\(\s*([A-Za-z0-9]+)\s*(?:à|a|-|→)\s*([A-Za-z0-9]+)\s*\)/i,G=AX.map(a=>{const m=(a.nom||'').match(re);return m?{a,id:m[1].toUpperCase(),f:m[2].toUpperCase(),t:m[3].toUpperCase()}:null});
  if(G.filter(Boolean).length<Math.max(3,AX.length*0.6))return null;const E={x:[],y:[]};
  G.forEach(g=>{if(!g)return;const d=g.a.sens==='L'?'x':'y';let [f,t]=[g.f,g.t];if(plKcmp(f,t)>0)[f,t]=[t,f];E[d].push({f,t,L:num(g.a.len)})});
  const keys={x:new Set(),y:new Set()};G.forEach(g=>{if(!g)return;if(g.a.sens==='L'){keys.y.add(g.id);keys.x.add(g.f);keys.x.add(g.t)}else{keys.x.add(g.id);keys.y.add(g.f);keys.y.add(g.t)}});
  const pos={x:{},y:{}},warn=[];G.forEach(g=>{if(g&&g.a.pos!==''&&g.a.pos!=null)pos[g.a.sens==='L'?'y':'x'][g.id]=num(g.a.pos)});
  const solve=d=>{const K=[...keys[d]].sort(plKcmp),V={...pos[d]},est={};if(!Object.keys(V).length&&K.length)V[K[0]]=0;
    for(let it=0;it<50;it++){let ch=0;E[d].forEach(e=>{if(V[e.f]!=null&&V[e.t]==null){V[e.t]=V[e.f]+e.L;ch=1}else if(V[e.t]!=null&&V[e.f]==null){V[e.f]=V[e.t]-e.L;ch=1}});if(!ch)break}
    E[d].forEach(e=>{if(V[e.f]!=null&&V[e.t]!=null&&Math.abs(V[e.t]-V[e.f]-e.L)>0.03)warn.push(`Écart de ${N(Math.abs(V[e.t]-V[e.f]-e.L)*100,0)} cm entre ${e.f} et ${e.t} : vérifie les longueurs des axes.`)});
    K.forEach((k,i)=>{if(V[k]!=null)return;let a=i-1,b=i+1;while(a>=0&&V[K[a]]==null)a--;while(b<K.length&&V[K[b]]==null)b++;
      const va=a>=0?V[K[a]]:null,vb=b<K.length?V[K[b]]:null;V[k]=va!=null&&vb!=null?va+(vb-va)*(i-a)/(b-a):va!=null?va+1:vb!=null?vb-1:0;est[k]=1});
    const m=Math.min(...K.map(k=>V[k]));K.forEach(k=>V[k]-=m);return{K,V,est}};
  const X=solve('x'),Y=solve('y'),H=[],Vv=[];
  G.forEach(g=>{if(!g)return;if(g.a.sens==='L'){const x1=Math.min(X.V[g.f],X.V[g.t]),x2=Math.max(X.V[g.f],X.V[g.t]);H.push({y:Y.V[g.id],x1,x2,nom:g.a.nom,key:g.id,est:Y.est[g.id]||X.est[g.f]||X.est[g.t]})}
    else{const y1=Math.min(Y.V[g.f],Y.V[g.t]),y2=Math.max(Y.V[g.f],Y.V[g.t]);Vv.push({x:X.V[g.id],y1,y2,nom:g.a.nom,key:g.id,est:X.est[g.id]||Y.est[g.f]||Y.est[g.t]})}});
  const ex=Object.keys(X.est),ey=Object.keys(Y.est);if(ex.length||ey.length)warn.push(`Position${ex.length+ey.length>1?'s':''} estimée${ex.length+ey.length>1?'s':''} (trait orange) : axe${ex.length+ey.length>1?'s':''} ${[...ex,...ey].join(', ')}. Aucune longueur ne la fixe : indique sa distance (champ « à … m ») à l'écran 2 de l'assistant.`);
  return{H,V:Vv,warn,Lx:Math.max(...X.K.map(k=>X.V[k])),Ly:Math.max(...Y.K.map(k=>Y.V[k])),grid:1}}
function plImpl(r,AXo){const p=r.p,g=r.gen||{},AX=(AXo||p.axes||[]).filter(a=>num(a.len)>0),isF=a=>a.fac||/^(Façade avant|Façade arrière|Pignon gauche|Pignon droit)$/.test(a.nom||'');
  let Lx=num(p.L),Ly=num(p.l),H,V,warn=[],grid=0;const GR=plGrid(AX);
  if(GR){({H,V,warn,Lx,Ly}=GR);grid=1}else{
  const F=AX.filter(isF);const fL=F.filter(a=>a.sens==='L'),fl=F.filter(a=>a.sens==='l');if(fL.length)Lx=Math.max(...fL.map(a=>num(a.len)));if(fl.length)Ly=Math.max(...fl.map(a=>num(a.len)));
  H=[{y:0,x1:0,x2:Lx,nom:'Façade avant',f:1},{y:Ly,x1:0,x2:Lx,nom:'Façade arrière',f:1}];V=[{x:0,y1:0,y2:Ly,nom:'Pignon gauche',f:1},{x:Lx,y1:0,y2:Ly,nom:'Pignon droit',f:1}];
  const I=AX.filter(a=>!isF(a));['L','l'].forEach(sn=>{const A=I.filter(a=>a.sens===sn),noP=A.filter(a=>a.pos===''||a.pos==null);let k=0;
   A.forEach(a=>{const lim=sn==='L'?Ly:Lx,LIM=sn==='L'?Lx:Ly;let pos=num(a.pos),est=false;if(a.pos===''||a.pos==null){pos=lim*(++k)/(noP.length+1);est=true}const d0=Math.max(0,num(a.deb)),d1=Math.min(LIM,d0+num(a.len));
    if(sn==='L')H.push({y:pos,x1:d0,x2:d1,nom:a.nom||'Mur',est});else V.push({x:pos,y1:d0,y2:d1,nom:a.nom||'Mur',est})});if(noP.length)warn.push(`${noP.length} axe${noP.length>1?'s':''} intérieur${noP.length>1?'s':''} ${sn==='L'?'dans le sens de la longueur':'dans le sens de la largeur'} sans position : placé${noP.length>1?'s':''} à intervalles réguliers (trait orange). Indique leur position à l'écran 2 de l'assistant.`)})}
  const tol=0.05,PT=[];H.forEach(h=>V.forEach(v=>{if(v.x>=h.x1-tol&&v.x<=h.x2+tol&&h.y>=v.y1-tol&&h.y<=v.y2+tol&&!PT.some(q=>Math.abs(q.x-v.x)<tol&&Math.abs(q.y-h.y)<tol))PT.push({x:v.x,y:h.y,h,v})}));
  PT.sort((a,b)=>a.y-b.y||a.x-b.x);const xs=[...new Set(V.map(v=>+v.x.toFixed(3)))].sort((a,b)=>a-b),ys=[...new Set(H.map(h=>+h.y.toFixed(3)))].sort((a,b)=>a-b);
  const kx={},ky={};V.forEach(v=>{if(v.key)kx[+v.x.toFixed(3)]=v.key});H.forEach(h=>{if(h.key)ky[+h.y.toFixed(3)]=h.key});const lab=x=>kx[+x.toFixed(3)]||String.fromCharCode(65+xs.indexOf(+x.toFixed(3))),num_=y=>ky[+y.toFixed(3)]||ys.indexOf(+y.toFixed(3))+1;PT.forEach((q,i)=>{q.id='P'+(i+1);q.ax=lab(q.x)+num_(q.y)});
  const rc=g.recul||1.5,sSI=g.nSI>0&&(g.FT==='isolees'||g.FT==='mixte')?g.sSI:0,sur=(r.sem&&r.sem.sur)||0.2,W=760,mg=90,S=Math.min((W-2*mg)/(Lx+2*rc),460/(Ly+2*rc)),Hh=(Ly+2*rc)*S+2*mg,X=x=>mg+(x+rc)*S,Y=y=>Hh-mg-(y+rc)*S;
  let s=grid?'':pR(X(0),Y(Ly),Lx*S,Ly*S,'#faf7f2','none',0);
  H.forEach(h=>s+=pL(X(h.x1),Y(h.y),X(h.x2),Y(h.y),h.est?'#e67e22':'#bbb',Math.max(3,0.2*S)));V.forEach(v=>s+=pL(X(v.x),Y(v.y1),X(v.x),Y(v.y2),v.est?'#e67e22':'#bbb',Math.max(3,0.2*S)));
  ys.forEach(y=>{s+=pL(X(-rc),Y(y),X(Lx+rc),Y(y),'#8e44ad',.7,'5 3');[X(-rc),X(Lx+rc)].forEach(x=>s+=pL(x,Y(y)-7,x,Y(y)+7,'#6b4226',3)+`<circle cx="${x}" cy="${Y(y)-7}" r="1.8" fill="#6b4226"/><circle cx="${x}" cy="${Y(y)+7}" r="1.8" fill="#6b4226"/>`)});
  xs.forEach(x=>{s+=pL(X(x),Y(-rc),X(x),Y(Ly+rc),'#8e44ad',.7,'5 3');[Y(-rc),Y(Ly+rc)].forEach(y=>s+=pL(X(x)-7,y,X(x)+7,y,'#6b4226',3)+`<circle cx="${X(x)-7}" cy="${y}" r="1.8" fill="#6b4226"/><circle cx="${X(x)+7}" cy="${y}" r="1.8" fill="#6b4226"/>`)});
  if(sSI)PT.forEach(q=>{const a=sSI*S,f=(sSI+2*sur)*S;s+=pR(X(q.x)-f/2,Y(q.y)-f/2,f,f,'none','#a08060',.7,'stroke-dasharray="3 2"')+pR(X(q.x)-a/2,Y(q.y)-a/2,a,a,'rgba(160,128,96,.18)','#a08060',.8)});
  const pb=(r.pot?r.pot.b:0.2)*S;PT.forEach(q=>{s+=pR(X(q.x)-Math.max(4,pb)/2,Y(q.y)-Math.max(4,pb)/2,Math.max(4,pb),Math.max(4,pb),'#333','#000',.5)+pT(X(q.x)+6,Y(q.y)-6,q.id,{s:8,a:'start',c:'#000'})});
  xs.forEach(x=>{s+=`<circle cx="${X(x)}" cy="${Y(Ly+rc)-22}" r="9" fill="#fff" stroke="#8e44ad"/>`+pT(X(x),Y(Ly+rc)-18.5,lab(x),{s:10,b:1,c:'#8e44ad'})});
  ys.forEach(y=>{s+=`<circle cx="${X(-rc)-22}" cy="${Y(y)}" r="9" fill="#fff" stroke="#8e44ad"/>`+pT(X(-rc)-22,Y(y)+3.5,num_(y),{s:10,b:1,c:'#8e44ad'})});
  for(let i=1;i<xs.length;i++)s+=pCotH(X(xs[i-1]),X(xs[i]),Y(-rc)+22,N(xs[i]-xs[i-1],2),0);s+=pCotH(X(0),X(Lx),Y(-rc)+44,`${N(Lx,2)} m (axe à axe)`,0);
  for(let i=1;i<ys.length;i++)s+=pCotV(Y(ys[i]),Y(ys[i-1]),X(Lx+rc)+24,N(ys[i]-ys[i-1],2),0);s+=pCotV(Y(Ly),Y(0),X(Lx+rc)+50,`${N(Ly,2)} m`,0);
  s+=pL(X(0),Y(0),X(Lx),Y(Ly),'#27ae60',.6,'2 3')+`<circle cx="${X(0)}" cy="${Y(0)}" r="5" fill="none" stroke="#c0392b" stroke-width="1.5"/>`+pL(X(0)-8,Y(0),X(0)+8,Y(0),'#c0392b',1)+pL(X(0),Y(0)-8,X(0),Y(0)+8,'#c0392b',1)+pT(X(0)-8,Y(0)+16,'0 (repère)',{s:8.5,a:'end',c:'#c0392b'});
  s+=pT(X(Lx/2),Y(0)+16,'FAÇADE AVANT',{s:8.5,c:'#777'});
  const dg=Math.sqrt(Lx*Lx+Ly*Ly),nCh=(xs.length+ys.length)*2,yl=Hh-10;
  s+=pT(W/2,yl,`Poteaux ■  Semelles ${sSI?cm(sSI)+' cm':''} et fouilles ${sSI?cm(sSI+2*sur)+' cm':''} ▢  Chaises ┃ à ${N(rc)} m  Cordeaux - - -  Diagonale contrôle ${N(dg,2)} m`,{s:9,c:'#444'});
  const svg=pSVG(W,Hh,s,`PLAN D'IMPLANTATION – axes des murs, poteaux et chaises (${N(Lx,2)} × ${N(Ly,2)} m)`);
  const nPd=num(p.poteaux);if(nPd&&nPd!==PT.length)warn.push(`Le devis compte ${nPd} poteaux par niveau ; le plan en place ${PT.length} aux croisements des axes. Vérifie les positions des murs ou le nombre de poteaux.`);
  return{svg,PT,xs,ys,lab,num_,Lx,Ly,dg,rc,nCh,warn,H,V,grid}}
/* ---------- assemblage ---------- */
function plansAll(r){const g=r.gen||{},enr=(g.enr||3)/100,out=[];
  out.push({k:'impl',t:"Plan d'implantation",im:plImpl(r)});
  if(r.sem){const s=r.sem,c=(g.cF||5)/100,am=r.am?r.am.h:0.6;out.push({k:'sem',t:'Semelles isolées',svg:plSem({title:`SEMELLE ISOLÉE ${cm(s.a)}×${cm(s.a)}×${cm(s.h)} cm (${s.n})`,a:s.a,h:s.h,d:s.d,e:s.e,c,n1:Math.floor((s.a-2*c)/s.e+1e-9)+1,b:r.am?r.am.b:0.2,am})})}
  if(r.am){const a=r.am,B=plBars(a.arm,a.n,a.d),tx=plBarsTxt(a.arm,a.n,a.d);out.push({k:'am',t:'Amorces',svg:plSec({title:`AMORCE – COUPE (${a.nb})`,b:a.b,h:a.b,enr,cd:a.cd,pos:plPos(a.b,a.b,B,'pot',enr,a.cd),l1:tx,l2:`Cadres HA${a.cd} tous les ${N(a.ce*100)} cm`}),
    svg2:plElevV({title:'AMORCE – ÉLÉVATION',H:a.h,Htot:a.h+0.6+0.35,b:a.b,parts:[{y0:0,y1:0.6,f:'#fff',t:'attentes 60 cm'},{y0:0.6,y1:0.6+a.h,t:`amorce ${N(a.h,2)} m`},{y0:0.6+a.h,y1:0.6+a.h+0.3,w:a.b*3,dx:-a.b,t:'semelle'}],bars:[{y0:0,y1:0.6+a.h+0.25,hook:0.3},{y0:0,y1:0.6+a.h+0.25,hook:0.3,side:1}],cads:[{y0:0.65,y1:0.55+a.h,e:a.ce,t:`${Math.ceil(a.h/a.ce-1e-9)+1} cadres HA${a.cd} / ${N(a.ce*100)} cm`}],notes:[tx+' : crosse de 30 cm sur la nappe de la semelle']})})}
  if(r.pot){const p=r.pot,B=plBars(p.arm,p.n,p.d),tx=plBarsTxt(p.arm,p.n,p.d),lr=40*B[0]/1000,nc=Math.ceil(p.H/p.ce-1e-9)+1;out.push({k:'pot',t:'Poteaux',svg:plSec({title:`POTEAU ${cm(p.b)}×${cm(p.b)} – COUPE (${p.nb} par niveau)`,b:p.b,h:p.b,enr,cd:p.cd,pos:plPos(p.b,p.b,B,'pot',enr,p.cd),l1:tx,l2:`Cadres HA${p.cd} tous les ${N(p.ce*100)} cm`}),
    svg2:plElevV({title:'POTEAU – ÉLÉVATION SUR UN NIVEAU',H:p.H,Htot:p.H+0.3,b:p.b,parts:[{y0:0,y1:p.ch||0.2,w:p.b*3,dx:-p.b,t:'chaînage / poutre'},{y0:p.ch||0.2,y1:p.H+0.3,t:''}],bars:[{y0:0.05,y1:p.H+0.3},{y0:0.05,y1:p.H+0.3,side:1}],cads:[{y0:(p.ch||0.2)+0.05,y1:p.H+0.25,e:p.ce,t:`${nc} cadres HA${p.cd} / ${N(p.ce*100)} cm`}],cotes:[{y0:p.H+0.3-lr,y1:p.H+0.3,t:`recouvr. ${cm(lr)} cm`,x:80},{y0:0,y1:p.H+0.3,t:`H ${N(p.H,2)} m`,x:115}],notes:[tx+' filants',`recouvrement 40Φ = ${cm(lr)} cm sur les attentes du niveau inférieur`]})})}
  if(r.lon){const o=r.lon,B=plBars(o.arm,o.n,o.d),tx=plBarsTxt(o.arm,o.n,o.d);out.push({k:'lon',t:o.rad?'Nervures du radier':'Longrines',svg:plSec({title:`${o.rad?'NERVURE':'LONGRINE'} ${cm(o.b)}×${cm(o.h)} – COUPE`,b:o.b,h:o.h,enr,cd:o.cd,pos:plPos(o.b,o.h,B,'beam',enr,o.cd),l1:tx,l2:`Cadres HA${o.cd} tous les ${N(o.ce*100)} cm`}),
    svg2:plElevH({title:'LONGRINE – ÉLÉVATION ENTRE DEUX POTEAUX',L:3,h:o.h,e:o.ce,tL:'portée type 3,00 m',tSup:'aciers supérieurs',tInf:'aciers inférieurs',tCad:`cadres HA${o.cd} / ${N(o.ce*100)} cm`,app:[{x:-0.1,w:0.2,t:'amorce'},{x:2.9,w:0.2,t:'amorce'}],hooks:1,notes:['Aux angles et croisements : équerres de liaison de 50 cm ; recouvrement 40Φ décalé']})})}
  if(r.ch){const o=r.ch,B=[];o.bars.forEach(b=>{for(let i=0;i<b[0];i++)B.push(b[1])});const pos=[];['inf','sup'].forEach(k=>{const z=o.bars.filter(b=>b[2]===k)[0];if(!z)return;const c=enr+o.cd/1000+z[1]/2000,y=k==='inf'?o.h-c:c;for(let i=0;i<z[0];i++)pos.push({x:c+(o.b-2*c)*i/Math.max(1,z[0]-1),y,d:z[1]})});
    const tx=o.bars.map(b=>`${b[0]}HA${b[1]} ${b[2]==='inf'?'inférieurs':'supérieurs'}`).join(' + ');out.push({k:'ch',t:o.et?'Poutres et chaînages':'Chaînage haut',svg:plSec({title:`${o.et?'POUTRE / CHAÎNAGE':'CHAÎNAGE HAUT'} ${cm(o.b)}×${cm(o.h)} – COUPE`,b:o.b,h:o.h,enr,cd:o.cd,pos,l1:tx,l2:`Cadres HA${o.cd} tous les ${N(o.ce*100)} cm`}),
    svg2:plElevH({title:`${o.et?'POUTRE':'CHAÎNAGE'} – ÉLÉVATION ENTRE DEUX POTEAUX`,L:3,h:o.h,e:o.ce,tL:'portée type 3,00 m',tSup:o.bars[1]?`${o.bars[1][0]}HA${o.bars[1][1]}`:'',tInf:`${o.bars[0][0]}HA${o.bars[0][1]}`,tCad:`cadres HA${o.cd} / ${N(o.ce*100)} cm`,app:[{x:-0.1,w:0.2,t:'poteau'},{x:2.9,w:0.2,t:'poteau'}],hooks:1,notes:['Ancrage des aciers dans les poteaux d\'angle par retours de 40Φ']})})}
  if(r.lin){const o=r.lin,x=o.list.slice().sort((a,b)=>b.L-a.L)[0];if(x){const big=x.L>1.5,lu=x.L+2*o.app;out.push({k:'lin',t:'Linteaux',svg:plSec({title:`LINTEAU ${cm(o.b)}×${cm(o.h)} – COUPE`,b:o.b,h:o.h,enr,cd:6,pos:plPos(o.b,o.h,[big?12:10,big?12:10,big?10:8,big?10:8],'beam',enr,6).map((q,i)=>i<2?{...q,y:o.h-(enr+0.006+q.d/2000)}:{...q,y:enr+0.006+q.d/2000}),l1:`2HA${big?12:10} inférieurs + 2HA${big?10:8} supérieurs`,l2:'Cadres HA6 tous les 20 cm'}),
    svg2:plElevH({title:`LINTEAU AU-DESSUS DE : ${x.lab.toUpperCase()} (${N(x.L,2)} m)`,L:lu,h:o.h,e:0.2,tL:`${N(lu,2)} m = ${N(x.L,2)} + 2 × ${N(o.app,2)} d'appui`,tSup:`2HA${big?10:8}`,tInf:`2HA${big?12:10}`,tCad:`${Math.ceil(lu/0.2-1e-9)+1} cadres HA6 / 20 cm`,app:[{x:0,w:o.app,t:'appui'},{x:lu-o.app,w:o.app,t:'appui'}],open:`ouverture ${N(x.L,2)} m`,notes:[`Les ${o.list.length} types de linteaux sont détaillés dans la nomenclature.`]})})}}
  if(r.esc)out.push({k:'esc',t:'Escalier – coupe et marches',svg:plEsc(r.esc)},{k:'escf',t:'Escalier – ferraillage',svg:plEscFer(r.esc)});
  if(r.dal){const D=plDalle(r.dal,out[0].im,g);out.dalC=D.C;out.push({k:'dal',t:r.dal.t==='pleine'?'Dalle pleine – ferraillage':'Plancher – poutrelles',svg:D.svg,tab:D.C},{k:'dalc',t:'Plancher – coupe type',svg:plDalleCoupe(r.dal,g)})}
  if(r.fos)out.push({k:'fos',t:'Fosse septique',svg:plFosse(r.fos)});
  if(r.reg)out.push({k:'reg',t:'Regards et réseau',svg:plRegard(r.reg)});
  return out}
function plImplTable(im){return im.PT.map(q=>[q.id,q.ax,N(q.x,2),N(q.y,2)])}
function viewPlans(id){const d=S.devis.find(x=>x.id===id);if(!d)return;const r=plansOf(d);
  if(!r||!r.gen){openForm({title:'📐 Plans',fields:[{type:'html',html:'<div class="note">Les plans sont disponibles pour les devis créés avec l\'assistant de devis complet.</div>'}],submit:'Fermer',onSave:async()=>{}});return}
  const P=plansAll(r),nom=plNom(r).concat(plNom2(r,P.dalC)),im=P[0].im;
  const tab=(rows,head)=>`<div style="overflow-x:auto"><table class="tbl sm"><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr>${rows.map(z=>`<tr>${z.map(c=>`<td>${esc(String(c))}</td>`).join('')}</tr>`).join('')}</table></div>`;
  const SH=rbSheets(r,rbInfo(d));window.__plMode='D';
  const htmlS=`<div class="note" style="margin-bottom:10px">Plans tirés des renseignements du devis (dimensions, aciers et axes saisis). À faire valider par l'ingénieur structure avant exécution.</div>`+
   `<details class="oreg" open><summary>1. Plan d'implantation</summary>${im.warn.map(w=>`<div class="alert">${esc(w)}</div>`).join('')}<div class="plsvg">${im.svg}</div>
    <div class="sm" style="margin:6px 0"><b>Traçage :</b> planter le repère 0 à l'angle façade avant / pignon gauche, tendre les cordeaux d'axe à axe sur les chaises à ${N(im.rc)} m des murs, vérifier l'équerre par les diagonales (${N(im.dg,2)} m, les deux doivent être égales à ±1 cm) ou par la méthode 3-4-5. ${im.nCh} chaises (2 par axe).</div>
    ${tab(plImplTable(im),['Point','Axes','X (m)','Y (m)'])}</details>`+
   P.slice(1).map((p,i)=>`<details class="oreg"><summary>${i+2}. ${esc(p.t)}</summary><div class="plsvg">${p.svg}</div>${p.svg2?`<div class="plsvg">${p.svg2}</div>`:''}${p.tab&&p.k==='dal'?plCellTab(p.tab,r.dal):''}</details>`).join('')+
   `<details class="oreg"><summary>${P.length+1}. Nomenclature des aciers</summary>${tab(nom.map(z=>[z.el,z.rep,'HA'+z.d,z.forme,N(z.lu,2),z.nE,z.nT,N(z.Lt,1),N(z.kg,1)]),['Élément','Rep.','Φ','Forme','L. unit. (m)','Par élém.','Nombre','L. tot. (m)','kg'])}<div class="sm" style="margin-top:4px">Total : ${N(sum(nom,z=>z.kg),0)} kg (hors chutes et ligatures)</div></details>`;
  const htmlD=`<div class="note" style="margin-bottom:10px">Planches d'exécution : élévation, coupes, façonnage des barres, nomenclature et cartouche, à partir des renseignements du devis. À faire valider par l'ingénieur structure.</div>`+SH.map((p,i)=>`<details class="oreg"${i<2?' open':''}><summary>Planche ${i+1}. ${esc(p.t)}</summary><div class="plsvg">${p.svg}</div></details>`).join('');
  const html=`<div class="seg" style="margin-bottom:10px"><button type="button" class="on" id="plbD" onclick="plMode('D')">📐 Planches d'exécution</button><button type="button" id="plbS" onclick="plMode('S')">Vue simplifiée</button></div><div id="plD">${htmlD}</div><div id="plS" style="display:none">${htmlS}</div>`;
  openForm({title:'📐 Plans '+(d.numero||''),fields:[{type:'html',html}],submit:'📄 Télécharger en PDF',onSave:async()=>{if(window.__plMode==='D')await pdfSheets(d,SH);else await pdfPlans(d,r,P,nom);return false}})}
function plMode(m){window.__plMode=m;$('#plD').style.display=m==='D'?'':'none';$('#plS').style.display=m==='S'?'':'none';$('#plbD').classList.toggle('on',m==='D');$('#plbS').classList.toggle('on',m==='S')}
function svgPng(svg,k=2.5){return new Promise((res,rej)=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=img.width*k;c.height=img.height*k;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(img,0,0,c.width,c.height);res({url:c.toDataURL('image/jpeg',0.92),w:img.width,h:img.height})};img.onerror=rej;img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)})}
async function pdfPlans(d,r,P,nom){const ch=S.chantiers.find(c=>c.id===d.chantierId)||{};const {doc,y:y0,col}=pdfBase('PLANS DE CHANTIER','Devis N° '+d.numero);let y=y0;
  doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text(T((ch.nom||'')+(d.objet?' - '+d.objet:'')),14,y);y+=5;
  const put=async(svg,maxH=200)=>{const im=await svgPng(svg);let w=182,h=w*im.h/im.w;if(h>maxH){h=maxH;w=h*im.w/im.h}if(y+h>282){doc.addPage();y=16}doc.addImage(im.url,'JPEG',14+(182-w)/2,y,w,h);y+=h+4};
  const im=P[0].im;await put(im.svg,190);im.warn.forEach(w=>{doc.setFont('helvetica','italic');doc.setFontSize(8);doc.text(T('! '+w),14,y,{maxWidth:182});y+=8});
  doc.autoTable({...tstyle(col),startY:y,head:[['Point','Axes','X (m)','Y (m)']],body:plImplTable(im),margin:{left:14,right:110},styles:{fontSize:7.5}});y=doc.lastAutoTable.finalY+4;
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text(T(`Traçage : repère 0 à l'angle façade avant / pignon gauche ; cordeaux tendus sur chaises à ${N(im.rc)} m ; équerre contrôlée par les diagonales (${N(im.dg,2)} m chacune) ou la méthode 3-4-5.`),14,y,{maxWidth:182});
  for(const p of P.slice(1)){if((p.k==='dalc'||p.k==='reg')&&y<150){y+=4}else{doc.addPage();y=16}doc.setFont('helvetica','bold');doc.setFontSize(11);doc.text(T(p.t.toUpperCase()),14,y);y+=4;
    if(p.svg2){const a=await svgPng(p.svg),b=await svgPng(p.svg2);const wa=p.k==='lin'||p.k==='lon'||p.k==='ch'?70:85,ha=wa*a.h/a.w;doc.addImage(a.url,'JPEG',14,y,wa,ha);const wb=182-wa-4,hb=Math.min(wb*b.h/b.w,240);doc.addImage(b.url,'JPEG',14+wa+4,y,hb*b.w/b.h,hb);y+=Math.max(ha,hb)+4}
    else await put(p.svg,p.k==='dal'?170:240);
    if(p.k==='dal'&&p.tab){const R_=plCellRows(p.tab,r.dal);doc.autoTable({...tstyle(col),startY:y,head:[R_.h.map(T)],body:R_.b.map(z=>z.map(c=>T(String(c)))),styles:{fontSize:7}});y=doc.lastAutoTable.finalY+4}}
  doc.addPage();y=16;doc.setFont('helvetica','bold');doc.setFontSize(11);doc.text('NOMENCLATURE DES ACIERS',14,y);y+=3;
  doc.autoTable({...tstyle(col),startY:y,head:[['Élément','Rep.','Diam.','Forme','L. unit. (m)','Par élém.','Nombre','L. tot. (m)','kg']].map(r=>r.map(T)),body:nom.map(z=>[T(z.el),z.rep,'HA'+z.d,T(z.forme),N(z.lu,2),String(z.nE),String(z.nT),N(z.Lt,1),N(z.kg,1)]),styles:{fontSize:7}});
  y=doc.lastAutoTable.finalY+5;doc.setFont('helvetica','italic');doc.setFontSize(8);doc.text(T(`Total ${N(sum(nom,z=>z.kg),0)} kg hors chutes et ligatures. Plans établis à partir des renseignements du devis, à faire valider par l'ingénieur structure avant exécution.`),14,y,{maxWidth:182});
  await savePdf(doc,`Plans ${d.numero}.pdf`)}
/* ---------- fosse septique ---------- */
function plFosse(f){const W=600,S=Math.min(360/(f.Ax+0.4),190/(f.Bx+0.4)),ox=(W-f.Ax*S)/2,oy=50,ep=f.ep*S;let s='';
  const X=x=>ox+x*S,Y=y=>oy+y*S;s+=pR(X(0),Y(0),f.Ax*S,f.Bx*S,'#bdb2a3',PL_C.trait,1)+pR(X(f.ep),Y(f.ep),f.Lf*S,f.lf*S,'#e8f1f8',PL_C.trait,1);
  const nm=f.nC===3?['DÉCANTATION','DIGESTION','CLARIFICATION']:['DÉCANTATION','CLARIFICATION'];let x=f.ep;
  f.cL.forEach((c,i)=>{const xc=x+c/2,lb=c*S>78?nm[i]:nm[i].slice(0,4)+'.';s+=pT(X(xc),Y(f.ep)+12,lb,{s:7.5,b:1,c:'#1f5fa8'})+pT(X(xc),Y(f.ep)+23,N(c,2)+' m',{s:7.5,c:'#1f5fa8'});
    const t=Math.min(0.6,c-0.05)*S;s+=pR(X(xc)-t/2,Y(f.ep+f.lf/2)-t/2,t,t,'none','#555',.8,'stroke-dasharray="4 2"');
    x+=c;if(i<f.cL.length-1){s+=pR(X(x),Y(f.ep),f.ep*S*0.75,f.lf*S,'#bdb2a3',PL_C.trait,.8);s+=`<circle cx="${X(x+f.ep*0.37).toFixed(1)}" cy="${Y(f.ep+f.lf*0.75).toFixed(1)}" r="4" fill="#fff" stroke="#c0392b" stroke-width="1.5"/>`;x+=f.ep*0.75}});
  s+=pL(X(-0.5),Y(f.ep+f.lf/2),X(f.ep+0.15),Y(f.ep+f.lf/2),'#c0392b',2.5)+pT(X(-0.5),Y(f.ep+f.lf/2)+12,'entrée Ø110',{s:7.5,a:'start',c:'#c0392b'})+pL(X(f.Ax-f.ep-0.15),Y(f.ep+f.lf/2),X(f.Ax+0.5),Y(f.ep+f.lf/2),'#c0392b',2.5)+pT(X(f.Ax+0.5),Y(f.ep+f.lf/2)+12,'sortie → puisard',{s:7.5,a:'end',c:'#c0392b'});
  s+=`<circle cx="${X(f.ep+0.12).toFixed(1)}" cy="${Y(f.ep+f.lf-0.12).toFixed(1)}" r="4" fill="#fff" stroke="#27ae60" stroke-width="1.5"/>`+pT(X(f.ep),Y(f.Bx)+11,'○ vert : ventilation Ø110',{s:7.5,a:'start',c:'#27ae60'});
  s+=pCotH(X(0),X(f.Ax),Y(f.Bx)+18,`${N(f.Ax,2)} m hors tout (intérieur ${N(f.Lf,2)} m)`,0)+pCotV(Y(0),Y(f.Bx),X(0)-16,`${N(f.Bx,2)} m`)+pT(W/2,Y(f.Bx)+44,'VUE EN PLAN (dalle enlevée) – ▢ tampons 60 × 60, ○ passages par té plongeant',{s:9,b:1});
  const oy2=Y(f.Bx)+64,Sz=Math.min(S,150/(f.hT+0.35)),Z=z=>oy2+(f.hT+0.12-z)*Sz,X2=x=>ox+x*S;
  s+=pR(X2(-0.2),Z(-0.15),(f.Ax+0.4)*S,0.15*Sz,PL_C.beton,PL_C.trait,1)+pR(X2(0),Z(f.hT+0.12),f.Ax*S,0.12*Sz,PL_C.beton,PL_C.trait,1);
  s+=pR(X2(0),Z(f.hT),f.ep*S,f.hT*Sz,'#bdb2a3',PL_C.trait,1)+pR(X2(f.Ax-f.ep),Z(f.hT),f.ep*S,f.hT*Sz,'#bdb2a3',PL_C.trait,1);
  s+=pR(X2(f.ep),Z(f.hw),f.Lf*S,f.hw*Sz,'#d6e8f5','none',0)+pL(X2(f.ep),Z(f.hw),X2(f.Ax-f.ep),Z(f.hw),'#2e86c1',1,'5 3')+pT(X2(f.ep)+4,Z(f.hw)+11,`eau ${N(f.hw,2)} m`,{s:7.5,a:'start',c:'#2e86c1'});
  x=f.ep;f.cL.forEach((c,i)=>{x+=c;if(i<f.cL.length-1){s+=pR(X2(x),Z(f.hT),f.ep*S*0.75,f.hT*Sz,'#bdb2a3',PL_C.trait,.8);const xt=x+f.ep*0.37;s+=pL(X2(xt)-6,Z(f.hw*0.7),X2(xt)+6,Z(f.hw*0.7),'#c0392b',2)+pL(X2(xt)+6,Z(f.hw*0.7),X2(xt)+6,Z(f.hw*0.35),'#c0392b',2);x+=f.ep*0.75}});
  s+=pL(X2(-0.4),Z(f.hw+0.1),X2(f.ep+0.12),Z(f.hw+0.1),'#c0392b',2.5)+pL(X2(f.ep+0.12),Z(f.hw+0.25),X2(f.ep+0.12),Z(f.hw*0.6),'#c0392b',2.5)+pL(X2(f.Ax-f.ep-0.12),Z(f.hw*0.6),X2(f.Ax-f.ep-0.12),Z(f.hw+0.15),'#c0392b',2.5)+pL(X2(f.Ax-f.ep-0.12),Z(f.hw),X2(f.Ax+0.4),Z(f.hw),'#c0392b',2.5);
  s+=pL(X2(-0.15),Z(-0.15)-4,X2(f.Ax+0.15),Z(-0.15)-4,PL_C.acier,1.6)+pL(X2(0.05),Z(f.hT+0.12)+4,X2(f.Ax-0.05),Z(f.hT+0.12)+4,PL_C.acier,1.6);
  s+=pL(X2(f.ep+0.15),Z(f.hT+0.12),X2(f.ep+0.15),Z(f.hT+0.6),'#27ae60',2.5);
  s+=pCotV(Z(f.hT),Z(0),X2(f.Ax)+20,`${N(f.hT,2)} m`,0)+pCotV(Z(0),Z(-0.15),X2(-0.2)-14,'15')+pCotV(Z(f.hT+0.12),Z(f.hT),X2(-0.2)-14,'12');
  const yy=Z(-0.15)+30,Lx=[`COUPE LONGITUDINALE – ${f.nC} compartiments, ${N(f.Vf,1)} m³ utiles`,`Radier 15 cm et dalle 12 cm : HA10 tous les 15 cm dans les 2 sens ; ${f.nC} tampons de visite`,`Murs ${f.bour?'en parpaings bourrés':'en parpaings pleins'} de ${cm(f.ep)} cm, enduit intérieur étanche 2 cm hydrofugé ; ventilation Ø110 jusqu'au-dessus du toit`,f.puis?`Puisard 1,5 × 1,5 m × ${N(f.hp,1)} m en parpaings à joints ouverts, rempli de moellons`:''].filter(Boolean);
  Lx.forEach((t,i)=>s+=pT(W/2,yy+i*14,t,{s:i?9:10,b:!i,c:i===1?PL_C.acier:'#333'}));return pSVG(W,yy+Lx.length*14+6,s,`FOSSE SEPTIQUE ${N(f.Lf,2)} × ${N(f.lf,2)} m intérieur`)}
/* ---------- regards et réseau ---------- */
function plRegard(g){const W=600,S=230;let s='';const a=0.6,e=0.15,ox=40,oy=50,X=x=>ox+x*S,Y=y=>oy+y*S;
  s+=pR(X(0),Y(0),(a+2*e)*S,(a+2*e)*S,'#bdb2a3',PL_C.trait,1)+pR(X(e),Y(e),a*S,a*S,'#f6f2ea',PL_C.trait,1)+pR(X(e),Y(e+a/2-0.07),a*S,0.14*S,'#d6e8f5','#2e86c1',.8)+pT(X(e+a/2),Y(e+a/2)+3,'cunette',{s:8,c:'#2e86c1'});
  s+=pL(X(-0.25),Y(e+a/2),X(e),Y(e+a/2),'#c0392b',3)+pL(X(a+e),Y(e+a/2),X(a+2*e+0.25),Y(e+a/2),'#c0392b',3)+pCotH(X(e),X(e+a),Y(a+2*e)+16,'60 cm',0)+pCotH(X(0),X(a+2*e),Y(a+2*e)+34,'90 cm',0)+pT(X((a+2*e)/2),Y(a+2*e)+58,'VUE EN PLAN',{s:9,b:1});
  const ox2=330,hR=0.6,Z=z=>oy+(hR+0.2-z)*S*0.85,X2=x=>ox2+x*S*0.85;
  s+=pR(X2(-0.05),Z(0),(a+2*e+0.1)*S*0.85,0.1*S*0.85,PL_C.beton,PL_C.trait,1)+pR(X2(0),Z(hR),e*S*0.85,hR*S*0.85,'#bdb2a3',PL_C.trait,1)+pR(X2(a+e),Z(hR),e*S*0.85,hR*S*0.85,'#bdb2a3',PL_C.trait,1);
  s+=pR(X2(0),Z(hR+0.08),(a+2*e)*S*0.85,0.08*S*0.85,PL_C.beton,PL_C.trait,1)+pL(X2(0.04),Z(hR+0.04),X2(a+2*e-0.04),Z(hR+0.04),PL_C.acier,1.6)+pT(X2((a+2*e)/2),Z(hR+0.08)-6,'tampon 8 cm, HA8 / 10 cm',{s:8,c:PL_C.acier});
  s+=pL(X2(-0.25),Z(0.18),X2(e),Z(0.18),'#c0392b',4)+pL(X2(a+e),Z(0.14),X2(a+2*e+0.25),Z(0.14),'#c0392b',4)+pR(X2(e),Z(0.12),a*S*0.85,0.02*S*0.85,'#d6e8f5','none',0);
  s+=pCotV(Z(hR),Z(0),X2(a+2*e)+30,'≈ 60 cm',0)+pT(X2((a+2*e)/2),Y(a+2*e)+58,'COUPE',{s:9,b:1});
  const oy3=Y(a+2*e)+90,n=g.dR==='sep'?g.rpd:g.rpd,L=g.dF,Sx=480/(L+2),X3=x=>60+x*Sx;let z0=0.4;
  s+=pT(W/2,oy3-14,g.dR==='sep'?`RÉSEAU D'UNE DOUCHE → FOSSE (identique pour les ${g.nD} douches)`:'COLLECTEUR COMMUN DES DOUCHES → FOSSE',{s:10,b:1});
  s+=pR(X3(-0.9),oy3,0.8*Sx,22,'#e8f1f8','#2e86c1',1)+pT(X3(-0.5),oy3+14,'douche',{s:8});s+=pR(X3(L+0.1),oy3-4,1.2*Sx,30,'#bdb2a3',PL_C.trait,1)+pT(X3(L+0.7),oy3+14,'fosse',{s:8});
  s+=pL(X3(-0.1),oy3+11,X3(L+0.1),oy3+11+L*0.02*40,'#c0392b',2.5);
  for(let i=1;i<=n;i++){const x=L*i/(n+1)*(n+1)/n*(i===n?0.95:1)*(n/(n+1))+L/(n+1)*0,xx=L*(i)/(n+1),d=z0+xx*0.02;s+=pR(X3(xx)-9,oy3+11+xx*0.02*40-9,18,18,'#f6f2ea','#555',1)+pT(X3(xx),oy3+44+xx*0.8,`R${i}`,{s:9,b:1})+pT(X3(xx),oy3+56+xx*0.8,`fil d'eau −${N(d,2)} m`,{s:8,c:'#555'})}
  s+=pCotH(X3(0),X3(L),oy3+92,`${N(L,1)} m, pente 2 % (PVC Ø110 en tranchée 40 × 60 cm)`,0);
  return pSVG(W,oy3+104,s,`REGARD DE VISITE 60 × 60 (${g.nR} au total)`)}
/* ---------- plancher : calepinage des poutrelles / ferraillage de la dalle ---------- */
function plCells(im){const {H,V,xs,ys}=im,tol=0.05,covV=(x,y0,y1)=>V.some(v=>Math.abs(v.x-x)<tol&&v.y1<=y0+tol&&v.y2>=y1-tol),covH=(y,x0,x1)=>H.some(h=>Math.abs(h.y-y)<tol&&h.x1<=x0+tol&&h.x2>=x1-tol);
  const nx=xs.length-1,ny=ys.length-1,inn={},id=(i,j)=>i*1000+j,par={};const f=a=>par[a]===a?a:(par[a]=f(par[a])),u=(a,b)=>{par[f(a)]=f(b)};
  const ovV0=(x,y0,y1)=>sum(V.filter(v=>Math.abs(v.x-x)<tol),v=>Math.max(0,Math.min(v.y2,y1)-Math.max(v.y1,y0)))/(y1-y0),ovH0=(y,x0,x1)=>sum(H.filter(h=>Math.abs(h.y-y)<tol),h=>Math.max(0,Math.min(h.x2,x1)-Math.max(h.x1,x0)))/(x1-x0);
  const out={},q=[],ok_=(i,j)=>i>=-1&&i<=nx&&j>=-1&&j<=ny,blk=(i,j,i2,j2)=>{if(j<0||j>=ny||j2<0||j2>=ny||i<0&&i2<0||i>=nx&&i2>=nx)if(i!==i2)return false;if(i<0&&i2<0||j<0&&j2<0||i>=nx&&i2>=nx||j>=ny&&j2>=ny)return false;
    if(i!==i2){const x=xs[Math.max(i,i2)];return j>=0&&j<ny&&ovV0(x,ys[j],ys[j+1])>0.95}const y=ys[Math.max(j,j2)];return i>=0&&i<nx&&ovH0(y,xs[i],xs[i+1])>0.95};
  out[id(-1+1,-1+1)-1001]=1;q.push([-1,-1]);const key=(i,j)=>(i+1)*1000+(j+1);const seen={[key(-1,-1)]:1};
  while(q.length){const [i,j]=q.shift();[[1,0],[-1,0],[0,1],[0,-1]].forEach(([a,b])=>{const i2=i+a,j2=j+b;if(!ok_(i2,j2)||seen[key(i2,j2)])return;if(blk(i,j,i2,j2))return;seen[key(i2,j2)]=1;q.push([i2,j2])})}
  for(let i=0;i<nx;i++)for(let j=0;j<ny;j++)if(!seen[key(i,j)]){inn[id(i,j)]=1;par[id(i,j)]=id(i,j)}
  for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){if(!inn[id(i,j)])continue;if(inn[id(i+1,j)]&&!covV(xs[i+1],ys[j],ys[j+1]))u(id(i,j),id(i+1,j));if(inn[id(i,j+1)]&&!covH(ys[j+1],xs[i],xs[i+1]))u(id(i,j),id(i,j+1))}
  const G={};Object.keys(inn).forEach(k=>{const r=f(+k);(G[r]=G[r]||[]).push(+k)});const C=[];
  const ovV=(x,y0,y1)=>sum(V.filter(v=>Math.abs(v.x-x)<tol),v=>Math.max(0,Math.min(v.y2,y1)-Math.max(v.y1,y0)))/(y1-y0),ovH=(y,x0,x1)=>sum(H.filter(h=>Math.abs(h.y-y)<tol),h=>Math.max(0,Math.min(h.x2,x1)-Math.max(h.x1,x0)))/(x1-x0);
  const mk=(x0,x1,y0,y1)=>{const w=x1-x0,h=y1-y0,sx=Math.min(ovV(x0,y0,y1),ovV(x1,y0,y1)),sy=Math.min(ovH(y0,x0,x1),ovH(y1,x0,x1)),short=w<=h?'x':'y',ss=short==='x'?sx:sy,sl=short==='x'?sy:sx;
    const dir=ss>=0.5||ss>=sl?short:(short==='x'?'y':'x'),sup=dir==='x'?sx:sy,port=dir==='x'?w:h;
    return{x0,x1,y0,y1,w,h,dir,port,larg:dir==='x'?h:w,ok:sup>0.95&&port<=5.5,lab:`${im.lab(x0)}-${im.lab(x1)} / ${im.num_(y0)}-${im.num_(y1)}`}};
  Object.values(G).forEach(L=>{const I=L.map(k=>Math.floor(k/1000)),J=L.map(k=>k%1000),i0=Math.min(...I),i1=Math.max(...I),j0=Math.min(...J),j1=Math.max(...J);
    if(L.length===(i1-i0+1)*(j1-j0+1))C.push(mk(xs[i0],xs[i1+1],ys[j0],ys[j1+1]));else{const st=[];for(let i=i0;i<=i1;i++){const js=J.filter((_,n)=>I[n]===i).sort((a,b)=>a-b);let a=null,b=null;js.forEach(j=>{if(a==null){a=b=j}else if(j===b+1)b=j;else{st.push({i0:i,i1:i,a,b});a=b=j}});if(a!=null)st.push({i0:i,i1:i,a,b})}
      const R=[];st.forEach(z=>{const r=R.find(y=>y.i1===z.i0-1&&y.a===z.a&&y.b===z.b);if(r)r.i1=z.i1;else R.push({...z})});R.forEach(z=>C.push(mk(xs[z.i0],xs[z.i1+1],ys[z.a],ys[z.b+1])))}});
  return C.sort((a,b)=>a.y0-b.y0||a.x0-b.x0)}
function plDalle(d,im,g){const W=760,C=plCells(im),rc=0.6,S=Math.min((W-140)/(im.Lx+rc),440/(im.Ly+rc)),mg=60,Hh=im.Ly*S+2*mg+30,X=x=>mg+x*S,Y=y=>Hh-mg-y*S,ent=(d.ent||60)/100,pleine=d.t==='pleine',esp=(d.esp||15)/100;let s='';
  C.forEach(c=>{s+=pR(X(c.x0),Y(c.y1),c.w*S,c.h*S,pleine?'#f4efe6':'#efe3d0','none',0);
    if(!pleine){const n=Math.max(1,Math.ceil(c.larg/ent-1e-9)-1);c.n=n;c.Lp=c.port+0.2;c.hd=(n+1)*Math.ceil(c.port/0.2-1e-9);for(let i=1;i<=n;i++){const t=c.larg*i/(n+1);s+=c.dir==='x'?pL(X(c.x0)+2,Y(c.y0+t),X(c.x1)-2,Y(c.y0+t),'#8e5a2b',2.2):pL(X(c.x0+t),Y(c.y0)-2,X(c.x0+t),Y(c.y1)+2,'#8e5a2b',2.2)}}
    else{const k=Math.max(2,Math.round(Math.min(c.w,c.h)/esp/3));for(let i=1;i<k;i++){const tx=c.w*i/k,ty=c.h*i/k;s+=pL(X(c.x0+tx),Y(c.y0)-2,X(c.x0+tx),Y(c.y1)+2,PL_C.acier,.6)+pL(X(c.x0)+2,Y(c.y0+ty),X(c.x1)-2,Y(c.y0+ty),PL_C.acier,.6)}
      const ch=0.25*Math.min(c.w,c.h)*S;s+=pR(X(c.x0),Y(c.y1),c.w*S,ch,'rgba(31,95,168,.10)','none',0)+pR(X(c.x0),Y(c.y0)-ch,c.w*S,ch,'rgba(31,95,168,.10)','none',0)+pR(X(c.x0),Y(c.y1),ch,c.h*S,'rgba(31,95,168,.10)','none',0)+pR(X(c.x1)-ch,Y(c.y1),ch,c.h*S,'rgba(31,95,168,.10)','none',0)}
    const tx=X((c.x0+c.x1)/2),ty=Y((c.y0+c.y1)/2);s+=`<rect x="${(tx-30).toFixed(1)}" y="${(ty-9).toFixed(1)}" width="60" height="18" rx="4" fill="#fff" opacity=".85"/>`+pT(tx,ty+3,(c.dir==='x'?'↔ ':'↕ ')+N(c.port,2)+' m',{s:8.5,b:1,c:c.ok?'#333':'#e67e22'})});
  im.H.forEach(h=>s+=pL(X(h.x1),Y(h.y),X(h.x2),Y(h.y),'#888',Math.max(3,0.2*S)));im.V.forEach(v=>s+=pL(X(v.x),Y(v.y1),X(v.x),Y(v.y2),'#888',Math.max(3,0.2*S)));
  im.xs.forEach(x=>s+=pT(X(x),Y(im.Ly)-14,im.lab(x),{s:10,b:1,c:'#8e44ad'}));im.ys.forEach(y=>s+=pT(X(0)-16,Y(y)+3,im.num_(y),{s:10,b:1,c:'#8e44ad'}));
  const leg=pleine?`Dalle pleine ${d.ep} cm : nappe inférieure HA${d.dd} tous les ${N(esp*100)} cm dans les 2 sens ; zones bleues = chapeaux sur appuis (¼ de la portée)`:`Poutrelles ${d.t==='hourdis'?'préfabriquées':'coulées sur place '+(d.pb||15)+'×'+(d.ph||16)+' cm'} à ${N(ent*100)} cm d'entraxe, posées dans le sens de la plus petite portée entre murs porteurs`;
  s+=pT(W/2,Hh-24,leg,{s:9,c:'#444'})+pT(W/2,Hh-10,'Portée en orange : appui pas continu sur toute la longueur ou portée de plus de 5,5 m : poutre à prévoir, à faire vérifier.',{s:8.5,c:'#e67e22'});
  return{svg:pSVG(W,Hh,s,pleine?'PLANCHER – FERRAILLAGE DE LA DALLE PLEINE (vue en plan)':'PLANCHER – CALEPINAGE DES POUTRELLES (vue en plan)'),C}}
function plDalleCoupe(d,g){const W=560,pleine=d.t==='pleine';let s='';
  if(pleine){const ep=d.ep/100,L=3,S=420/L,Sy=Math.min(5*S,90/ep)*ep,ox=70,oy=60,esp=(d.esp||15)/100;s+=pR(ox,oy,L*S,Sy,PL_C.beton,PL_C.trait,1.2)+pR(ox-20,oy+Sy,24,50,'#bdb2a3','#777',.8)+pR(ox+L*S-4,oy+Sy,24,50,'#bdb2a3','#777',.8);
    s+=pL(ox+4,oy+Sy-6,ox+L*S-4,oy+Sy-6,PL_C.acier,2.4);const n=Math.round(L/esp);for(let i=0;i<=n;i++)s+=`<circle cx="${(ox+6+(L*S-12)*i/n).toFixed(1)}" cy="${(oy+Sy-10).toFixed(1)}" r="2" fill="${PL_C.acier}"/>`;
    s+=pL(ox-10,oy+6,ox+L*S*0.25,oy+6,PL_C.cadre,2.4)+pL(ox+L*S*0.75,oy+6,ox+L*S+10,oy+6,PL_C.cadre,2.4)+pCotH(ox,ox+L*S*0.25,oy-10,'chapeau ¼ portée')+pCotV(oy,oy+Sy,ox+L*S+40,`${d.ep} cm`,0);
    [`Nappe inférieure HA${d.dd} tous les ${N(esp*100)} cm dans les 2 sens, enrobage 2,5 cm, calée sur cales béton`,`Chapeaux HA${d.dd} sur tous les appuis, longueur ¼ de la portée de chaque côté`].forEach((t,i)=>s+=pT(W/2,oy+Sy+80+i*14,t,{s:9.5,c:i?PL_C.cadre:PL_C.acier}));return pSVG(W,oy+Sy+110,s,`COUPE TYPE – DALLE PLEINE ${d.ep} cm`)}
  const pb=(d.pb||15)/100,ph=(d.ph||16)/100,ec=(d.ec||5)/100,ent=(d.ent||60)/100,S=360/(ent*2),ox=(W-ent*2*S)/2,oy=60,Ht=(ph+ec)*S,pre=d.t==='hourdis';
  s+=pR(ox,oy,ent*2*S,ec*S,PL_C.beton,PL_C.trait,1);[0,1].forEach(k=>{const x=ox+(k*ent+pb/2)*S;s+=pR(x,oy+ec*S,(ent-pb)*S,ph*S,'#cfc6b8','#888',1)+pR(x+8,oy+ec*S+6,(ent-pb)*S/2-12,ph*S-12,'#fff','#aaa',.6)+pR(x+(ent-pb)*S/2+4,oy+ec*S+6,(ent-pb)*S/2-12,ph*S-12,'#fff','#aaa',.6)});
  [0,1,2].forEach(k=>{const x=ox+(k*ent-pb/2)*S;if(k===0||k===2){return}s+=pR(x,oy+ec*S,pb*S,ph*S,PL_C.beton,PL_C.trait,1.2);const c=0.025*S;
    if(!pre){s+=`<rect x="${(x+c).toFixed(1)}" y="${(oy+ec*S*0.6).toFixed(1)}" width="${(pb*S-2*c).toFixed(1)}" height="${(ph*S+ec*S*0.4-c).toFixed(1)}" rx="3" fill="none" stroke="${PL_C.cadre}" stroke-width="1.6"/>`;
      [[x+c+4,1],[x+pb*S-c-4,1],[x+pb*S/2,.8]].forEach(([xx,r])=>s+=`<circle cx="${xx.toFixed(1)}" cy="${(oy+ec*S+ph*S-c-4).toFixed(1)}" r="${(4*r).toFixed(1)}" fill="${PL_C.acier}"/>`);s+=`<circle cx="${(x+pb*S/2).toFixed(1)}" cy="${(oy+ec*S*0.6+5).toFixed(1)}" r="3" fill="${PL_C.acier}"/>`}
    else s+=pT(x+pb*S/2,oy+ec*S+ph*S/2,'préfa',{s:8,r:-90})});
  s+=pL(ox+4,oy+ec*S/2,ox+ent*2*S-4,oy+ec*S/2,PL_C.acier,1.4,'6 3');s+=pCotV(oy,oy+ec*S,ox-14,`${N(ec*100)} cm`)+pCotV(oy+ec*S,oy+Ht,ox-14,`${N(ph*100)} cm`)+pCotH(ox+(ent-pb/2)*S,ox+(ent+pb/2)*S,oy+Ht+16,`${N(pb*100)} cm`,0)+pCotH(ox,ox+ent*S,oy-12,`entraxe ${N(ent*100)} cm`);
  const L=[pre?'Poutrelle préfabriquée posée sur les chaînages (appui 10 cm minimum)':`Poutrelle coulée : 2HA12 + 1HA10 inférieurs, 1HA8 supérieur, cadres HA6 tous les 20 cm`,`Table de compression ${N(ec*100)} cm : ${d.tab==='treillis'?'treillis soudé':'quadrillage HA6 (12 ml/m², maille ≈ 17 cm)'} ; chapeaux HA10 sur appuis`,`Hourdis ${d.hour==='pp-hourdis12'?'12':d.hour==='pp-hourdis20'?'20':'16'} × 20 × 50 entre les poutrelles ; étaiement tous les 1 m sous les poutrelles`];
  L.forEach((t,i)=>s+=pT(W/2,oy+Ht+42+i*14,t,{s:9.5,c:i===0?PL_C.acier:'#333'}));return pSVG(W,oy+Ht+42+L.length*14+6,s,`COUPE TYPE DU PLANCHER ${pre?'PRÉFABRIQUÉ':'À POUTRELLES COULÉES'} ${N(ph*100)} + ${N(ec*100)}`)}
/* ---------- escalier : ferraillage ---------- */
function plEscFer(e){const W=600,v=e.VV[0],tot=v.rc+(e.Lp?e.lg:0)+0.6,S=Math.min(440/tot,220/(v.ht+0.4)),ox=60,oy=50+v.ht*S+10,ang=Math.atan(v.ht/Math.max(0.01,v.rc)),t=e.e*S/Math.cos(ang),c=0.025*S,xp=ox+v.rc*S,yp=oy-v.ht*S,xe=xp+(e.Lp?e.lg:0.4)*S;let s='';
  let pts=[[ox,oy]],x=ox,y=oy;for(let i=0;i<v.v;i++){y-=e.h*S;pts.push([x,y]);if(i<v.v-1){x+=e.g*S;pts.push([x,y])}}pts.push([xe,y]);const bot=[[xe,y+e.e*S],[xp,y+e.e*S],[ox,oy+t]];
  s+=`<polygon points="${[...pts,...bot].map(p=>p.map(z=>z.toFixed(1)).join(',')).join(' ')}" fill="${PL_C.beton}" stroke="${PL_C.trait}" stroke-width="1"/>`;
  s+=pR(ox-0.4*S,oy,0.6*S,0.3*S,'#ddd','#999',.8)+pT(ox-0.1*S,oy+0.2*S,'semelle / dalle',{s:7.5});
  const ya=oy+t-c,yb=yp+e.e*S-c;s+=pL(ox-0.3*S,ya+0.0,ox,ya,PL_C.acier,2.6)+pL(ox,ya,xp,yb,PL_C.acier,2.6)+pL(xp,yb,xe-6,yb,PL_C.acier,2.6)+pL(xe-6,yb,xe-6,yb-e.e*S*0.6,PL_C.acier,2.6);
  const yt0=oy+c*2,yt1=yp+c*2;s+=pL(ox,yt0-v.ht*S*0.0,ox+0.9*S*Math.cos(ang),yt0-0.9*S*Math.sin(ang),PL_C.cadre,2.6)+pL(xp-0.9*S*Math.cos(ang),yp+e.e*S*0.3+0.9*S*Math.sin(ang),xp+0.6*S,yp+c*1.5,PL_C.cadre,2.6);
  const nr=Math.ceil(v.inc/0.2)+1;for(let i=0;i<nr;i++){const f=i/(nr-1),xx=ox+(xp-ox)*f,yy=ya+(yb-ya)*f-5;s+=`<circle cx="${xx.toFixed(1)}" cy="${yy.toFixed(1)}" r="2.2" fill="#2c7a3f"/>`}
  if(e.Lp)for(let i=0;i<6;i++)s+=`<circle cx="${(xp+(xe-xp)*(i+0.5)/6).toFixed(1)}" cy="${(yb-5).toFixed(1)}" r="2.2" fill="#2c7a3f"/>`;
  const tag=(x,y,t,cl)=>`<rect x="${(x-12).toFixed(1)}" y="${(y-8).toFixed(1)}" width="24" height="14" rx="3" fill="#fff" stroke="${cl}"/>`+pT(x,y+3,t,{s:8.5,b:1,c:cl});
  s+=tag((ox+xp)/2+10,(ya+yb)/2+18,'E1',PL_C.acier)+tag((ox+xp)/2-20,(ya+yb)/2-4,'E2','#2c7a3f')+tag(ox+0.5*S,yt0-0.6*S,'E3',PL_C.cadre)+tag(xp+0.2*S,yp-12,'E3',PL_C.cadre)+(e.Lp?tag((xp+xe)/2,yb+16,'E4',PL_C.acier):'');
  const np=Math.floor((e.lg-0.05)/e.eE)+1,oy2=oy+0.45*S+20,Sx=Math.min(300/e.lg,30/e.e*10),bw=e.lg*Sx,bh=Math.max(22,e.e*Sx),ox2=(W-bw)/2;
  s+=pR(ox2,oy2,bw,bh,PL_C.beton,PL_C.trait,1)+pL(ox2+4,oy2+bh-12,ox2+bw-4,oy2+bh-12,'#2c7a3f',2);for(let i=0;i<np;i++)s+=`<circle cx="${(ox2+6+(bw-12)*i/Math.max(1,np-1)).toFixed(1)}" cy="${(oy2+bh-6).toFixed(1)}" r="3.2" fill="${PL_C.acier}"/>`;
  s+=pCotH(ox2,ox2+bw,oy2+bh+14,`emmarchement ${N(e.lg,2)} m`,0)+pCotV(oy2,oy2+bh,ox2-12,`${cm(e.e)}`)+pT(W/2,oy2-6,'COUPE TRANSVERSALE DE LA PAILLASSE',{s:9,b:1});
  const L=[[`E1 : ${np} HA${e.dE} tous les ${N(e.eE*100)} cm, aciers principaux en sous-face, ancrés 40 cm dans la semelle et le palier`,PL_C.acier],[`E2 : HA8 tous les 20 cm, répartition posée sur E1`,'#2c7a3f'],[`E3 : chapeaux HA10 de 1,20 m en haut de chaque volée et au départ (nappe supérieure)`,PL_C.cadre],[e.Lp?`E4 : palier HA10 tous les 15 cm dans les 2 sens`:'',PL_C.acier],[`Enrobage 2,5 cm ; volée 2 ferraillée de la même façon (${e.VV[1]?e.VV[1].v+' contremarches':''})`,'#444']].filter(z=>z[0]);
  const yy=oy2+bh+40;L.forEach(([t,cl],i)=>s+=pT(W/2,yy+i*14,t,{s:9.5,c:cl}));return pSVG(W,yy+L.length*14+6,s,`ESCALIER – PLAN DE FERRAILLAGE (volée 1, paillasse ${cm(e.e)} cm)`)}
/* nomenclature complémentaire */
function plNom2(r,C){const rows=[],add=(el,rep,d,forme,lu,nE,nT)=>rows.push({el,rep,d,forme,lu,nE,nT,Lt:lu*nT,kg:lu*nT*(BARW[d]||0)});
  if(r.esc){const e=r.esc,np=Math.floor((e.lg-0.05)/e.eE)+1;e.VV.forEach((x,i)=>{const nr=Math.ceil(x.inc/0.2)+1;add(`Escalier volée ${i+1}`,'E1',e.dE,'principaux, ancrages 40 cm',x.inc+0.8,np,np*e.et);add(`Escalier volée ${i+1}`,'E2',8,'répartition',e.lg-0.05,nr,nr*e.et);add(`Escalier volée ${i+1}`,'E3',10,'chapeaux 1,20 m',1.2,np*2,np*2*e.et)});
    if(e.Lp){const n1=Math.ceil(e.Lp/0.15)+1,n2=Math.ceil(e.lg/0.15)+1;add('Escalier palier','E4',10,'sens court',e.lg+0.3,n1,n1*e.et);add('Escalier palier','E5',10,'sens long',e.Lp+0.3,n2,n2*e.et)}}
  if(r.fos){const f=r.fos,a=f.Ax+0.4,b=f.Bx+0.4,na=Math.ceil(b/0.15)+1,nb=Math.ceil(a/0.15)+1,ma=Math.ceil(f.Bx/0.15)+1,mb=Math.ceil(f.Ax/0.15)+1;add('Fosse : radier','F1',10,'sens long',a,na,na);add('Fosse : radier','F2',10,'sens court',b,nb,nb);add('Fosse : dalle','F3',10,'sens long',f.Ax,ma,ma);add('Fosse : dalle','F4',10,'sens court',f.Bx,mb,mb)}
  if(r.reg){add('Tampons de regards','R1',8,'quadrillage 10 cm, 2 sens',0.82,16,16*r.reg.nR)}
  if(r.dal&&C){const d=r.dal;if(d.t==='coulees'){C.forEach(c=>{if(!c.n)return;const lp=c.Lp,nc=Math.ceil(lp/0.2)+1;add(`Poutrelles ${c.lab}`,'Pi',12,'inférieurs',lp,2,2*c.n);add(`Poutrelles ${c.lab}`,'Pm',10,'inférieur',lp,1,c.n);add(`Poutrelles ${c.lab}`,'Ps',8,'supérieur',lp,1,c.n);add(`Poutrelles ${c.lab}`,'Pc',6,'cadres',2*((d.pb||15)/100+(d.ph||16)/100-0.08)+0.12,nc,nc*c.n)})}
    if(d.t==='pleine'){const e=(d.esp||15)/100;C.forEach(c=>{const n1=Math.ceil(c.h/e)+1,n2=Math.ceil(c.w/e)+1;add(`Dalle ${c.lab}`,'D1',+d.dd,'nappe inf. sens X',c.w+0.3,n1,n1);add(`Dalle ${c.lab}`,'D2',+d.dd,'nappe inf. sens Y',c.h+0.3,n2,n2)})}}
  return rows}

function plCellRows(C,d){const pl=d.t==='pleine';const b=C.map(c=>pl?[c.lab,N(c.w,2)+' × '+N(c.h,2),c.dir==='x'?'X':'Y',N(c.port,2)]:[c.lab,N(c.w,2)+' × '+N(c.h,2),c.dir==='x'?'X (↔)':'Y (↕)',N(c.port,2),c.n,N(c.Lp,2),c.hd]);
  if(!pl)b.push(['Total','','','',sum(C,c=>c.n||0),'',sum(C,c=>c.hd||0)]);return{h:pl?['Panneau','Dimensions (m)','Petite portée','Portée (m)']:['Panneau','Dimensions (m)','Sens','Portée (m)','Poutrelles','Long. (m)','Hourdis'],b}}
function plCellTab(C,d){const R_=plCellRows(C,d);return `<div style="overflow-x:auto;margin-top:6px"><table><tr>${R_.h.map(h=>`<th>${esc(h)}</th>`).join('')}</tr>${R_.b.map(z=>`<tr>${z.map(c=>`<td>${esc(String(c))}</td>`).join('')}</tr>`).join('')}</table></div>`}
