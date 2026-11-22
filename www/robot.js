/* robot.js — planches d'exécution détaillées (style logiciel de calcul : élévation, coupes, façonnage, nomenclature, cartouche) */
const RB={W:1188,H:840},RBK='#111',RBA='#c0392b',RBC='#1f5fa8';
const rbScale=s=>{const r=4000/s;return [5,10,20,25,40,50,75,100,125,150,200,250].find(x=>x>=r*0.97)||Math.round(r)};
const rT=(x,y,t,o={})=>pT(x,y,t,{s:o.s||10,a:o.a,b:o.b,c:o.c||RBK,r:o.r});
const rL=(x1,y1,x2,y2,c=RBK,w=1,da)=>pL(x1,y1,x2,y2,c,w,da);
const rTag=(x,y,p,c=RBK)=>`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8.5" fill="#fff" stroke="${c}" stroke-width="1.2"/>`+rT(x,y+3.6,p,{s:10,b:1,c});
const rLead=(x1,y1,x2,y2,p,txt,c=RBK,al='start')=>rL(x1,y1,x2,y2,c,.6)+`<circle cx="${x1.toFixed(1)}" cy="${y1.toFixed(1)}" r="1.6" fill="${c}"/>`+rTag(x2,y2,p,c)+(txt?rT(x2+(al==='end'?-13:13),y2+3.5,txt,{s:9.5,a:al,c}):'');
const rDimH=(x1,x2,y,t,s=9)=>rL(x1,y,x2,y,'#333',.6)+[x1,x2].map(x=>rL(x-3,y+3,x+3,y-3,'#333',.9)+rL(x,y-5,x,y+5,'#333',.5)).join('')+rT((x1+x2)/2,y-3,t,{s,c:'#222'});
const rDimV=(y1,y2,x,t,s=9)=>rL(x,y1,x,y2,'#333',.6)+[y1,y2].map(y=>rL(x-3,y+3,x+3,y-3,'#333',.9)+rL(x-5,y,x+5,y,'#333',.5)).join('')+rT(x-3,(y1+y2)/2,t,{s,c:'#222',r:-90});
const rBreak=(x,y1,y2)=>`<polyline points="${x},${y1-6} ${x},${(y1+y2)/2-6} ${x-5},${(y1+y2)/2-2} ${x+5},${(y1+y2)/2+2} ${x},${(y1+y2)/2+6} ${x},${y2+6}" fill="none" stroke="#333" stroke-width=".8"/>`;
const rCut=(x,y1,y2,l)=>rL(x,y1-14,x,y1-4,RBK,1.6)+rL(x,y2+4,x,y2+14,RBK,1.6)+rL(x,y1-14,x+10,y1-14,RBK,1.6)+rL(x,y2+14,x+10,y2+14,RBK,1.6)+rT(x+15,y1-10,l,{s:11,b:1})+rT(x+15,y2+18,l,{s:11,b:1});
const cmr=x=>Math.round(x*100);
/* ---------- section transversale ---------- */
function rbSection(x,y,w,h,o){const S=Math.min((w-70)/o.b,(h-60)/o.h,900),bw=o.b*S,bh=o.h*S,ox=x+(w-bw)/2,oy=y+24,c=o.enr*S,cw=Math.max(1.4,o.cd/1000*S);
  let s=rT(x+w/2,y+12,`COUPE ${o.nom}`,{s:11,b:1})+`<rect x="${ox}" y="${oy}" width="${bw}" height="${bh}" fill="#f4f1ec" stroke="${RBK}" stroke-width="1.6"/>`;
  s+=`<rect x="${(ox+c).toFixed(1)}" y="${(oy+c).toFixed(1)}" width="${(bw-2*c).toFixed(1)}" height="${(bh-2*c).toFixed(1)}" rx="${Math.min(6,c)}" fill="none" stroke="${RBC}" stroke-width="${cw.toFixed(1)}"/>`+rL(ox+c,oy+c,ox+c+Math.min(14,bw/5),oy+c+Math.min(14,bw/5),RBC,cw);
  const used={};o.bars.forEach(b=>{const cx=ox+b.x*S,cy=oy+b.y*S;s+=`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${Math.max(3.2,b.d/1000*S/2).toFixed(1)}" fill="${RBA}"/>`;
    if(!used[b.p]){used[b.p]=1;const right=b.x>o.b/2,dx=right?bw-b.x*S+28:-(b.x*S+28),ty=cy+(b.y>o.h/2?14:-14);s+=rLead(cx,cy,cx+dx,ty,b.p,'',RBA)}});
  if(o.cad)s+=rLead(ox+bw-c,oy+bh/2,ox+bw+28,oy+bh/2+30,o.cad,'',RBC);
  s+=rDimH(ox,ox+bw,oy+bh+16,cmr(o.b))+rDimV(oy,oy+bh,ox-16,cmr(o.h));if(o.sc!==false)s+=rT(x+w/2,oy+bh+38,`éch. 1/${rbScale(S)}`,{s:8.5,c:'#555'});return s}
/* ---------- façonnage d'une barre ---------- */
function rbShape(x,y,w,h,p){let s=`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#bbb" stroke-width=".5"/>`+rTag(x+13,y+14,p.p,p.cad?RBC:RBA)+rT(x+27,y+18,`${p.nT} HA${p.d}  l = ${N(p.L,2)} m`,{s:9.5,a:'start',b:1});
  const ax=x+18,ay=y+30,aw=w-36,ah=h-40;
  if(p.cad){const [b,hh]=p.cad,S=Math.min(aw/b,ah/hh)*0.8,bw=b*S,bh=hh*S,ox=x+w/2-bw/2,oy=ay+(ah-bh)/2;s+=`<rect x="${ox}" y="${oy}" width="${bw}" height="${bh}" rx="3" fill="none" stroke="${RBC}" stroke-width="2"/>`+rL(ox,oy,ox+9,oy+9,RBC,2)+rL(ox+5,oy,ox+14,oy+9,RBC,2)+rT(ox+bw/2,oy-3,cmr(b),{s:8.5})+rT(ox+bw+4,oy+bh/2+3,cmr(hh),{s:8.5,a:'start'});return s}
  const P=p.pts,xs=P.map(q=>q[0]),ys=P.map(q=>q[1]),W_=Math.max(...xs)-Math.min(...xs)||0.01,H_=Math.max(...ys)-Math.min(...ys)||0.01;let S=Math.min(aw/W_,ah/H_);if(H_<0.02)S=aw/W_;
  const mx=Math.min(...xs),my=Math.min(...ys),ox=ax+(aw-W_*S)/2,oy=ay+(ah-H_*S)/2+(H_<0.02?ah/2:0),X=q=>ox+(q[0]-mx)*S,Y=q=>oy+(Math.max(...ys)-q[1])*S;
  s+=`<polyline points="${P.map(q=>X(q).toFixed(1)+','+Y(q).toFixed(1)).join(' ')}" fill="none" stroke="${RBA}" stroke-width="2.2" stroke-linejoin="round"/>`;
  for(let i=1;i<P.length;i++){const a=P[i-1],b=P[i],l=Math.hypot(b[0]-a[0],b[1]-a[1]),hz=Math.abs(b[1]-a[1])<1e-3;s+=rT((X(a)+X(b))/2+(hz?0:-8),(Y(a)+Y(b))/2+(hz?-4:3),cmr(l),{s:8.5,a:hz?'middle':'end'})}return s}
/* ---------- planche ---------- */
function rbSheet(o,info){let s=`<rect x="0" y="0" width="${RB.W}" height="${RB.H}" fill="#fff"/><rect x="12" y="12" width="${RB.W-24}" height="${RB.H-24}" fill="none" stroke="${RBK}" stroke-width="1.6"/>`;
  s+=rL(745,12,745,622,RBK,.8)+rL(12,622,RB.W-12,622,RBK,1.2)+rL(745,300,RB.W-12,300,RBK,.6);
  s+=rT(24,32,`ÉLÉVATION – ${o.titre}`,{s:12.5,b:1,a:'start'})+(o.elevSc?rT(735,32,`éch. 1/${o.elevSc}${o.dil?' (hauteur ×'+N(o.dil,1)+')':''}`,{s:9,a:'end',c:'#555'}):'')+o.elev;
  s+=o.sec;s+=rT(757,318,'FAÇONNAGE DES ARMATURES (cotes en cm)',{s:11,b:1,a:'start'});
  const P=o.pos,cols=P.length>6?3:2,cw=(RB.W-12-757-10)/cols,rh=Math.min(92,(612-326)/Math.ceil(P.length/cols));P.forEach((p,i)=>s+=rbShape(757+(i%cols)*cw,326+Math.floor(i/cols)*rh,cw-6,rh-6,p));
  /* nomenclature */
  const tx=20,ty=634,cw2=[40,150,72,72,80,80,72,80],head=['Pos.','Armature','Ø (mm)','Par élém.','Nombre','L unit. (m)','L tot. (m)','Poids (kg)'];let xx=tx;
  s+=rT(tx,ty+4,`NOMENCLATURE – ${o.nb} élément${o.nb>1?'s':''} identique${o.nb>1?'s':''}`,{s:11,b:1,a:'start'});const y0=ty+12,rh2=Math.min(16,(RB.H-24-y0-40)/(P.length+2));
  head.forEach((h,i)=>{s+=`<rect x="${xx}" y="${y0}" width="${cw2[i]}" height="${rh2}" fill="#e9e4da" stroke="#666" stroke-width=".5"/>`+rT(xx+cw2[i]/2,y0+rh2-4.5,h,{s:8.5,b:1});xx+=cw2[i]});
  let kg=0;P.forEach((p,j)=>{const w=p.L*p.nT*BARW[p.d];kg+=w;const v=[p.p,p.lab,p.d,p.nE,p.nT,N(p.L,2),N(p.L*p.nT,1),N(w,1)];xx=tx;v.forEach((c,i)=>{s+=`<rect x="${xx}" y="${y0+rh2*(j+1)}" width="${cw2[i]}" height="${rh2}" fill="none" stroke="#999" stroke-width=".4"/>`+rT(i===1?xx+4:xx+cw2[i]/2,y0+rh2*(j+2)-4.5,c,{s:8.5,a:i===1?'start':'middle'});xx+=cw2[i]})});
  const yt=y0+rh2*(P.length+1)+16,ratio=o.V>0?kg/(o.V*o.nb):0;s+=rT(tx,yt,`Acier : ${N(kg,1)} kg   ·   Béton : ${N(o.V*o.nb,3)} m³ (${N(o.V,3)} m³ × ${o.nb})   ·   Ratio : ${N(ratio,0)} kg/m³   ·   Coffrage : ${N((o.coff||0)*o.nb,2)} m²`,{s:9.5,a:'start',b:1});
  if(o.note)s+=rT(tx,yt+14,o.note,{s:8.5,a:'start',c:'#555'});
  s+=rbCart(info,o.cTitre||o.titre);return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${RB.W} ${RB.H}" width="${RB.W}" height="${RB.H}" style="max-width:100%;height:auto;font-family:Helvetica,Arial,sans-serif">${s}</svg>`}
function rbCart(info,titre){const x=760,y=634,w=RB.W-12-x-8,h=RB.H-12-y-8,hb=baelH();let s=`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${RBK}" stroke-width="1.2"/>`;
  const rows=[[info.ent,1,13],[`Projet : ${info.projet}`,0,10],[`Client : ${info.client||'—'}   ·   Devis ${info.num}`,0,9.5],[titre,1,11.5],[`Béton fc28 = ${hb.fc28} MPa   ·   Acier HA FeE${hb.fe}   ·   Enrobage ${info.enr} cm (fondations ${hb.cF} cm)`,0,9],[`Règles BAEL 91 mod. 99   ·   Date ${info.date}`,0,9]];
  let yy=y;rows.forEach(([t,b,fs],i)=>{const hh=i===0?26:i===3?24:20;s+=rT(x+8,yy+hh-7,t,{s:fs,b,a:'start'});yy+=hh;s+=rL(x,yy,x+w,yy,'#666',.5)});
  const cw=w/3;['Établi par','Vérifié par',`Planche ${info.no} / ${info.tot}`].forEach((t,i)=>{s+=rT(x+cw*i+6,yy+13,t,{s:8.5,a:'start',c:'#555'});if(i)s+=rL(x+cw*i,yy,x+cw*i,y+h,'#666',.5)});
  s+=rT(x+cw*0+6,yy+30,info.auteur||'',{s:9,a:'start',b:1});return s}
/* cadre autour d'un dessin existant (implantation, plancher, fosse, regards) */
function rbWrap(svg,titre,info,extra){const m=svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/),w=+m[1],h=+m[2],S=Math.min((RB.W-48)/w,(622-30)/h),inner=svg.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
  let s=`<rect x="0" y="0" width="${RB.W}" height="${RB.H}" fill="#fff"/><rect x="12" y="12" width="${RB.W-24}" height="${RB.H-24}" fill="none" stroke="${RBK}" stroke-width="1.6"/>`+rL(12,622,RB.W-12,622,RBK,1.2);
  s+=`<g transform="translate(${(RB.W-w*S)/2},${18}) scale(${S})">${inner}</g>`;if(extra)s+=extra;s+=rbCart(info,titre);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${RB.W} ${RB.H}" width="${RB.W}" height="${RB.H}" style="max-width:100%;height:auto;font-family:Helvetica,Arial,sans-serif">${s}</svg>`}
function rbTextBlock(x,y,lines,w){return lines.map((t,i)=>rT(x,y+i*14,t,{s:9,a:'start',c:i?'#333':RBK,b:!i})).join('')}
/* ---------- élévation de poutre (longrine, chaînage, linteau, poutrelle) ---------- */
function rbBeam(o){const X0=40,X1=725,Y0=70,avail=X1-X0-90,Ltot=o.L+2*o.sup,S=avail/(Ltot+(o.cont?0.6:0.2)),hs=Math.max(o.h*S,Math.min(110,o.h*S*3)),dil=hs/(o.h*S),sc=rbScale(S);
  const ox=X0+45+(o.cont?0.3*S:0.1*S),oy=Y0+70,x=v=>ox+(v+o.sup)*S,c=(o.enr)*S*dil;let s='';
  o.supL&&[[-o.sup,0],[o.L,o.L+o.sup]].forEach(([a,b])=>{s+=`<rect x="${x(a).toFixed(1)}" y="${oy+hs}" width="${((b-a)*S).toFixed(1)}" height="70" fill="#e6e2da" stroke="#777" stroke-width=".8"/>`+rT((x(a)+x(b))/2,oy+hs+40,o.supL,{s:8.5,c:'#555',r:-90})});
  const xa=o.cont?x(-o.sup)-0.3*S:x(-o.sup),xb=o.cont?x(o.L+o.sup)+0.3*S:x(o.L+o.sup);s+=`<rect x="${xa.toFixed(1)}" y="${oy}" width="${(xb-xa).toFixed(1)}" height="${hs.toFixed(1)}" fill="#f4f1ec" stroke="${RBK}" stroke-width="1.6"/>`;if(o.cont)s+=rBreak(xa,oy,oy+hs)+rBreak(xb,oy,oy+hs);
  const yi=oy+hs-c-3,ysu=oy+c+3,hk=o.hook?Math.min(hs-2*c-6,0.15*S*dil):0;
  s+=rL(xa+3,yi,xb-3,yi,RBA,2.6)+rL(xa+3,ysu,xb-3,ysu,RBA,2.2);if(hk){s+=rL(xa+3,yi,xa+3,yi-hk,RBA,2.6)+rL(xb-3,yi,xb-3,yi-hk,RBA,2.6)+rL(xa+3,ysu,xa+3,ysu+hk,RBA,2.2)+rL(xb-3,ysu,xb-3,ysu+hk,RBA,2.2)}
  const e=o.e,z0=0.05,nC=Math.floor((o.L-2*z0)/e+1e-9)+1;for(let i=0;i<nC;i++){const xx=x(z0+i*e);s+=rL(xx,oy+c,xx,oy+hs-c,RBC,1.2)}
  s+=rDimH(x(0),x(z0),oy+hs+(o.supL?86:24),'5')+rDimH(x(z0),x(z0+(nC-1)*e),oy+hs+(o.supL?86:24),`${nC-1} × ${N(e*100,0)} = ${N((nC-1)*e*100,0)}`)+rDimH(x(z0+(nC-1)*e),x(o.L),oy+hs+(o.supL?86:24),cmr(o.L-z0-(nC-1)*e));
  s+=rDimH(x(0),x(o.L),oy-34,`${o.Llab||'portée'} ${cmr(o.L)}`)+rDimV(oy,oy+hs,xa-14,cmr(o.h));
  s+=rLead(x(o.L*0.3),yi,x(o.L*0.3)-20,oy+hs+(o.supL?110:48),o.pi.p,o.pi.t,RBA)+rLead(x(o.L*0.62),ysu,x(o.L*0.62)+10,oy-14,o.ps.p,o.ps.t,RBA)+rLead(x(z0+e*Math.floor(nC*0.82)),oy+hs/2,x(o.L*0.86),oy+hs+(o.supL?110:48),o.pc.p,o.pc.t,RBC);
  s+=rCut(x(o.L/2)+e*S/2,oy,oy+hs,'A');(o.notes||[]).forEach((t,i)=>s+=rT(X0,oy+hs+(o.supL?150:90)+i*14,t,{s:9,a:'start',c:'#333'}));return{s,sc,dil}}
/* ---------- planches par élément ---------- */
function rbSheets(r,info){const g=r.gen||{},enr=(g.enr||3)/100,cF=(baelH().cF||5)/100,lr=d=>40*d/1000,cadL=(b,h,e_=enr)=>2*(b+h-4*e_)+0.12,out=[],im=plImpl(r);
  const spans=[];im.H.forEach(h=>{const q=im.PT.filter(p=>Math.abs(p.y-h.y)<0.05&&p.x>=h.x1-0.05&&p.x<=h.x2+0.05).map(p=>p.x).sort((a,b)=>a-b);for(let i=1;i<q.length;i++)spans.push(q[i]-q[i-1])});
  im.V.forEach(v=>{const q=im.PT.filter(p=>Math.abs(p.x-v.x)<0.05&&p.y>=v.y1-0.05&&p.y<=v.y2+0.05).map(p=>p.y).sort((a,b)=>a-b);for(let i=1;i<q.length;i++)spans.push(q[i]-q[i-1])});
  const Lmax=Math.round((spans.length?Math.max(...spans):4)*100)/100,bp=r.pot?r.pot.b:0.2;
  const grp=(B,pos0)=>{const u=[...new Set(B)];return u.map((d,i)=>({p:pos0+i,d,k:B.filter(x=>x===d).length}))};
  /* fondation : semelle + amorce */
  if(r.sem){const sm=r.sem,am=r.am||{b:bp,h:0.6,arm:'',n:4,d:sm.d,cd:6,ce:0.15,nb:sm.n},n1=Math.floor((sm.a-2*cF)/sm.e+1e-9)+1,B=plBars(am.arm,am.n,am.d),G=grp(B,3),nc=Math.ceil(am.h/am.ce-1e-9)+1,cp=3+G.length,Lam=am.h+0.6+0.3+sm.h-cF;
    const pos=[{p:1,d:sm.d,lab:`HA${sm.d} nappe sens X`,nE:n1,nT:n1*sm.n,L:sm.a-2*cF+0.3,pts:[[0,0.15],[0,0],[sm.a-2*cF,0],[sm.a-2*cF,0.15]]},{p:2,d:sm.d,lab:`HA${sm.d} nappe sens Y`,nE:n1,nT:n1*sm.n,L:sm.a-2*cF+0.3,pts:[[0,0.15],[0,0],[sm.a-2*cF,0],[sm.a-2*cF,0.15]]},
      ...G.map(z=>({p:z.p,d:z.d,lab:`${z.k} HA${z.d} amorce`,nE:z.k,nT:z.k*sm.n,L:Lam,pts:[[0.3,0],[0,0],[0,Lam-0.3]]})),{p:cp,d:am.cd,lab:`cadres HA${am.cd} / ${cmr(am.ce)} cm`,nE:nc,nT:nc*sm.n,L:cadL(am.b,am.b),cad:[am.b-2*enr,am.b-2*enr]}];
    const Ht=0.05+sm.h+am.h+0.6,S=Math.min(520/Ht,560/(sm.a+0.6)),ox=390-sm.a*S/2,yb=600-40,ys=yb-0.05*S,yt=ys-sm.h*S,ya=yt-am.h*S,yat=ya-0.6*S,ab=am.b*S,ax=390-ab/2,c=cF*S;let e='';
    e+=`<rect x="${ox-0.1*S}" y="${ys}" width="${(sm.a+0.2)*S}" height="${0.05*S}" fill="#ddd" stroke="#888"/>`+rT(ox+sm.a*S+0.1*S+6,ys+0.05*S-2,'béton de propreté 5 cm',{s:8.5,a:'start',c:'#555'});
    e+=`<rect x="${ox}" y="${yt}" width="${sm.a*S}" height="${sm.h*S}" fill="#f4f1ec" stroke="${RBK}" stroke-width="1.6"/><rect x="${ax}" y="${ya}" width="${ab}" height="${am.h*S}" fill="#f4f1ec" stroke="${RBK}" stroke-width="1.6"/>`;
    e+=rL(ax,yat,ax,ya,'#999',.8,'4 3')+rL(ax+ab,yat,ax+ab,ya,'#999',.8,'4 3')+rT(ax+ab+8,yat+12,'départ poteau',{s:8.5,a:'start',c:'#555'});
    e+=`<polyline points="${ox+c},${yt+c+0.15*S*0.6} ${ox+c},${ys-c} ${ox+sm.a*S-c},${ys-c} ${ox+sm.a*S-c},${yt+c+0.15*S*0.6}" fill="none" stroke="${RBA}" stroke-width="2.6"/>`;for(let i=0;i<n1;i++)e+=`<circle cx="${(ox+c+5+(sm.a*S-2*c-10)*i/Math.max(1,n1-1)).toFixed(1)}" cy="${(ys-c-5).toFixed(1)}" r="3" fill="${RBA}"/>`;
    const xb1=ax+enr*S+4,xb2=ax+ab-enr*S-4,yf=ys-c-9;e+=rL(xb1,yat,xb1,yf,RBA,2.6)+rL(xb1,yf,xb1-0.3*S,yf,RBA,2.6)+rL(xb2,yat,xb2,yf,RBA,2.6)+rL(xb2,yf,xb2+0.3*S,yf,RBA,2.6);
    for(let i=0;i<nc;i++){const y=ya+0.05*S+(am.h-0.1)*S*i/Math.max(1,nc-1);e+=rL(ax+3,y,ax+ab-3,y,RBC,1.3)}
    e+=rLead(ox+sm.a*S*0.25,ys-c,ox-30,ys+40,1,'',RBA)+rLead(ox+c+5+(sm.a*S-2*c-10)*0.66,ys-c-5,ox+sm.a*S+40,yt-20,2,'',RBA)+rLead(xb1,ya+am.h*S*0.3,ax-70,ya+am.h*S*0.3,3,'',RBA)+rLead(ax+ab/2,ya+am.h*S*0.7,ax+ab+70,ya+am.h*S*0.7,cp,'',RBC);
    e+=rDimH(ox,ox+sm.a*S,yb+22,cmr(sm.a))+rDimV(yt,ys,ox-16,cmr(sm.h))+rDimV(ya,yt,ax-24,cmr(am.h))+rDimV(yat,ya,ax-24,'60')+rDimV(yt,ys,ox+sm.a*S+16,'')+rDimH(xb2,xb2+0.3*S,yf+14,'30',8)+rCut(ax+ab+18,ya+am.h*S*0.45,ya+am.h*S*0.45+1,'A');
    e+=rT(40,600,`Profondeur de fouille ${N(sm.fpr||g.fpr||1,2)} m ; fouille ${cmr(sm.a+2*(sm.sur||0.2))} × ${cmr(sm.a+2*(sm.sur||0.2))} cm`,{s:9,a:'start',c:'#333'});
    let sec=rbSection(757,40,200,250,{nom:'A-A (amorce)',b:am.b,h:am.b,enr,cd:am.cd,cad:cp,bars:plPos(am.b,am.b,B,'pot',enr,am.cd).map(q=>({...q,p:G.find(z=>z.d===q.d).p}))});
    {const Sx=Math.min(180/sm.a,220/sm.a),aw=sm.a*Sx,px=990+(170-aw)/2,py=70;sec+=rT(1075,52,'VUE EN PLAN (semelle)',{s:11,b:1})+`<rect x="${px}" y="${py}" width="${aw}" height="${aw}" fill="#f4f1ec" stroke="${RBK}" stroke-width="1.4"/>`;
      for(let i=0;i<n1;i++){const t=cF*Sx+(aw-2*cF*Sx)*i/Math.max(1,n1-1);sec+=rL(px+t,py+cF*Sx,px+t,py+aw-cF*Sx,RBA,1.4)+rL(px+cF*Sx,py+t,px+aw-cF*Sx,py+t,RBA,1.4)}
      sec+=`<rect x="${px+aw/2-am.b*Sx/2}" y="${py+aw/2-am.b*Sx/2}" width="${am.b*Sx}" height="${am.b*Sx}" fill="#ddd" stroke="#333"/>`+rDimH(px,px+aw,py+aw+16,cmr(sm.a))+rT(px+aw/2,py+aw+40,`${n1} HA${sm.d} e = ${N(sm.e*100,0)} cm / sens`,{s:9,c:RBA})+rT(px+aw/2,py+aw+54,`éch. 1/${rbScale(Sx)}`,{s:8.5,c:'#555'})}
    out.push({k:'fond',titre:`SEMELLE ${cmr(sm.a)}×${cmr(sm.a)}×${cmr(sm.h)} + AMORCE ${cmr(am.b)}×${cmr(am.b)}`,elev:e,elevSc:rbScale(S),sec,pos,nb:sm.n,V:sm.a*sm.a*sm.h+am.b*am.b*am.h,coff:4*sm.a*sm.h+4*am.b*am.h,note:'Aciers de l\'amorce posés sur la nappe avec crosse de 30 cm ; attentes de 60 cm pour le recouvrement du poteau.',cTitre:'Fondation : semelle isolée + amorce'})}
  /* poteaux : un niveau par planche (descente de charges) */
  const potSheet=(p,lev,below)=>{const B=plBars(p.arm,p.n,p.d),G=grp(B,1),lrr=lr(B[0]),nc=Math.ceil((p.H-p.ch)/p.ce-1e-9)+1,cp=1+G.length,Lp=p.H+lrr,nE=lev==null?p.nb*p.nN:p.nb;
    const pos=[...G.map(z=>({p:z.p,d:z.d,lab:`${z.k} HA${z.d} filants`,nE:z.k,nT:z.k*nE,L:Lp,pts:[[0,0],[0,Lp]]})),{p:cp,d:p.cd,lab:`cadres HA${p.cd} / ${N(p.ce*100,1)} cm`,nE:nc,nT:nc*nE,L:cadL(p.b,p.b),cad:[p.b-2*enr,p.b-2*enr]}];
    const Ht=p.H+lrr+0.25,S=Math.min(500/Ht,900),bw=Math.max(p.b*S,40),ox=360-bw/2,yb=585,yt=yb-p.H*S,ych=yt+p.ch*S;let e='';
    e+=`<rect x="${ox-60}" y="${yt}" width="${bw+120}" height="${p.ch*S}" fill="#ebe7df" stroke="#666"/>`+rT(ox+bw+66,yt+p.ch*S/2+3,p.toit?'chaînage de toiture':'poutre / plancher haut',{s:8.5,a:'start',c:'#555'});
    e+=`<rect x="${ox}" y="${ych}" width="${bw}" height="${yb-ych}" fill="#f4f1ec" stroke="${RBK}" stroke-width="1.6"/>`+rL(ox-90,yb,ox+bw+90,yb,'#333',1.2)+rT(ox-92,yb-4,lev?'plancher bas':'niveau fini RDC',{s:8.5,a:'start',c:'#555'});
    const bwb=below?Math.max(below.a*S,40):bw;e+=`<rect x="${360-bwb/2}" y="${yb}" width="${bwb}" height="${0.25*S}" fill="#ebe7df" stroke="#666"${below&&below.a>p.b?' stroke-dasharray="4 2"':''}/>`;
    const c=enr*S+4,x1=ox+c,x2=ox+bw-c;e+=rL(x1,yt-(p.top?0:lrr*S),x1,yb,RBA,2.6)+rL(x2,yt-(p.top?0:lrr*S),x2,yb,RBA,2.6);if(p.top)e+=rL(x1,yt+4,x1+0.2*S,yt+4,RBA,2.6)+rL(x2,yt+4,x2-0.2*S,yt+4,RBA,2.6);
    if(below&&below.a>p.b+0.001){const cb=enr*S+4,xb1=360-bwb/2+cb,xb2=360+bwb/2-cb;e+=`<polyline points="${xb1},${yb+0.25*S} ${xb1},${yb-0.05*S} ${x1+5},${yb-lrr*S*0.4} ${x1+5},${yb-lrr*S}" fill="none" stroke="${RBA}" stroke-width="1.6" stroke-dasharray="5 3"/><polyline points="${xb2},${yb+0.25*S} ${xb2},${yb-0.05*S} ${x2-5},${yb-lrr*S*0.4} ${x2-5},${yb-lrr*S}" fill="none" stroke="${RBA}" stroke-width="1.6" stroke-dasharray="5 3"/>`}
    else e+=rL(x1+5,yb-lrr*S,x1+5,yb+0.25*S,RBA,1.6,'5 3')+rL(x2-5,yb-lrr*S,x2-5,yb+0.25*S,RBA,1.6,'5 3');
    for(let i=0;i<nc;i++){const y=yb-0.05*S-(p.H-p.ch-0.1)*S*i/Math.max(1,nc-1);e+=rL(ox+3,y,ox+bw-3,y,RBC,1.3)}
    e+=rDimV(yb-lrr*S,yb,ox+bw+40,`recouvr. ${cmr(lrr)}`)+(p.top?'':rDimV(yt-lrr*S,yt,ox+bw+40,`attente ${cmr(lrr)}`))+rDimV(yt,yb,ox+bw+90,`H ${cmr(p.H)}`)+rDimV(ych,yb,ox-30,`${nc-1} × ${N(p.ce*100,1)}`)+rDimH(ox,ox+bw,yb+0.25*S+18,cmr(p.b));
    e+=rLead(x1,yt+p.H*S*0.45,ox-110,yt+p.H*S*0.4,1,'',RBA)+rLead(ox+bw/2,ych+(yb-ych)*0.65,ox+bw+140,ych+(yb-ych)*0.6,cp,'',RBC)+rCut(ox+bw+10,ych+(yb-ych)*0.3,ych+(yb-ych)*0.3+1,'A');
    e+=rT(40,600,below&&below.a>p.b+0.001?`Changement de section ${cmr(below.a)} → ${cmr(p.b)} : barres du niveau inférieur coudées à 1/6 dans le plancher (pointillés)`:'Barres en pointillé : attentes du niveau inférieur',{s:9,a:'start',c:'#333'})+(p.top?rT(40,614,'Dernier niveau : barres ancrées par retours de 20 cm dans le chaînage de toiture',{s:9,a:'start',c:'#333'}):'');
    if(p.q)e+=rbTextBlock(40,60,[`DESCENTE DE CHARGES – ${NIVL(lev)}`,`G = ${Math.round(p.q.G)} kN · Q = ${Math.round(p.q.Q)} kN (${p.q.nPl} plancher${p.q.nPl>1?'s':''} + toiture)`,`Nu = ${Math.round(p.q.Nu)} kN par poteau (majoré ×${N(baelH().maj)})`,`λ = ${N(p.q.lam,1)} · α = ${N(p.q.alpha,2)}`,`A ≥ ${N(p.q.need,2)} cm² → ${p.arm} = ${N(p.q.A,2)} cm²`]);
    const sec=rbSection(757,40,410,250,{nom:'A-A',b:p.b,h:p.b,enr,cd:p.cd,cad:cp,bars:plPos(p.b,p.b,B,'pot',enr,p.cd).map(q=>({...q,p:G.find(z=>z.d===q.d).p}))});
    out.push({k:'pot'+(lev==null?'':lev),titre:`POTEAU ${cmr(p.b)}×${cmr(p.b)} – ${lev==null?'un niveau':NIVL(lev)} (H = ${N(p.H,2)} m)`,elev:e,elevSc:rbScale(S),sec,pos,nb:nE,V:p.b*p.b*(p.H-p.ch),coff:4*p.b*(p.H-p.ch),note:lev==null?`${p.nb} poteaux par niveau × ${p.nN} niveau${p.nN>1?'x':''}. Recouvrement 40Ø décalé au-dessus de chaque plancher.`:`${p.nb} poteaux au ${NIVL(lev)}. Recouvrement 40Ø au-dessus du plancher.`,cTitre:lev==null?'Poteaux':`Poteaux ${NIVL(lev)}`})};
  if(r.potN)r.potN.forEach((q,i)=>potSheet({b:q.a,arm:q.arm,n:0,d:0,cd:q.cd,ce:q.ce/100,H:q.H,nN:1,nb:q.nb,ch:q.ch,q,top:i===r.potN.length-1},q.i,i?r.potN[i-1]:null));
  else if(r.pot)potSheet(r.pot,null,null);
  /* poutres : longrine, chaînage */
  const beamSheet=(k,o,titre,cT,supL,bars,note)=>{const B=bars,inf=B.filter(q=>q.y>o.h/2),sup=B.filter(q=>q.y<=o.h/2),gi=grp(inf.map(q=>q.d),1),gs=grp(sup.map(q=>q.d),1+gi.length),lb=g.lb||11.5,L=o.L||Lmax*10,nbE=1;
    const P=[...gi.map(z=>({...z,lab:`${z.k} HA${z.d} inférieurs`})),...gs.map(z=>({...z,lab:`${z.k} HA${z.d} supérieurs`}))].map(z=>{const n=Math.ceil(L/(lb-lr(z.d))-1e-9);return{p:z.p,d:z.d,lab:z.lab,nE:z.k,nT:z.k*n,L:lb,pts:[[0,0],[lb,0]]}});
    const cp=P.length+1,nc=Math.ceil(L/o.ce-1e-9)+1,eq=Math.max(4,g.nbPot||4)*2;P.push({p:cp,d:o.cd,lab:`cadres HA${o.cd} / ${cmr(o.ce)} cm`,nE:'—',nT:nc,L:cadL(o.b,o.h),cad:[o.b-2*enr,o.h-2*enr]});
    const dq=B[0].d;P.push({p:cp+1,d:dq,lab:`équerres d'angle HA${dq}`,nE:'—',nT:eq,L:1.0,pts:[[0,0],[0.5,0],[0.5,0.5]]});
    const tI=gi.map(z=>`${z.k}HA${z.d}`).join('+'),tS=gs.map(z=>`${z.k}HA${z.d}`).join('+');
    const bm=rbBeam({L:Lmax,h:o.h,sup:bp,enr,e:o.ce,cont:1,supL,pi:{p:gi[0]?gi[0].p:1,t:tI},ps:{p:gs[0]?gs[0].p:1,t:tS},pc:{p:cp,t:`HA${o.cd} e=${cmr(o.ce)}`},Llab:'plus grande portée',notes:[`Barres de ${N(lb,1)} m filantes, recouvrement 40Ø décalé ; équerres de 50 × 50 cm aux angles et croisements (pos. ${cp+1}).`,note||'']});
    const pos=B.map(q=>({...q,p:(q.y>o.h/2?gi:gs).find(z=>z.d===q.d).p}));const sec=rbSection(757,40,410,250,{nom:'A-A',b:o.b,h:o.h,enr,cd:o.cd,cad:cp,bars:pos});
    out.push({k,titre,elev:bm.s,elevSc:bm.sc,dil:bm.dil>1.05?bm.dil:0,sec,pos:P,nb:nbE,V:L*o.b*o.h,coff:2*L*o.h,note:`Quantités pour l'ensemble : ${N(L,1)} ml.`,cTitre:cT})};
  if(r.lon){const o=r.lon,B=plBars(o.arm,o.n,o.d);beamSheet('lon',o,`${o.rad?'NERVURE':'LONGRINE'} ${cmr(o.b)}×${cmr(o.h)} – ${N(o.L,1)} ml`,o.rad?'Nervures du radier':'Longrines / chaînage bas','amorce',plPos(o.b,o.h,B,'beam',enr,o.cd))}
  if(r.ch){const o=r.ch,pos=[];['inf','sup'].forEach(k=>{const z=o.bars.find(b=>b[2]===k);if(!z)return;const c=enr+o.cd/1000+z[1]/2000,y=k==='inf'?o.h-c:c;for(let i=0;i<z[0];i++)pos.push({x:c+(o.b-2*c)*i/Math.max(1,z[0]-1),y,d:z[1]})});
    beamSheet('ch',{...o,L:o.L},`${o.et?'POUTRE D\'ÉTAGE':'CHAÎNAGE HAUT'} ${cmr(o.b)}×${cmr(o.h)} – ${N(o.L,1)} ml`,o.et?'Poutres d\'étage (planchers)':'Chaînage haut','poteau',pos,o.et?'Poutres sous chaque plancher (RDC à avant-dernier niveau).':'')}
  if(r.chT){const o=r.chT,pos=[];['inf','sup'].forEach(k=>{const z=o.bars.find(b=>b[2]===k);const c=enr+o.cd/1000+z[1]/2000,y=k==='inf'?o.h-c:c;for(let i=0;i<z[0];i++)pos.push({x:c+(o.b-2*c)*i/Math.max(1,z[0]-1),y,d:z[1]})});
    beamSheet('chT',o,`CHAÎNAGE DE TOITURE ${cmr(o.b)}×${cmr(o.h)} – ${N(o.L,1)} ml`,'Chaînage de toiture (dernier niveau)','poteau',pos,'Ne porte que la charpente et la couverture : plus léger que les poutres d\'étage.')}
  /* linteaux */
  if(r.lin&&r.lin.list.length){const o=r.lin,L=o.list.slice().sort((a,b)=>b.L-a.L),x=L[0],big=x.L>1.5,lu=x.L+2*o.app,nc=Math.ceil(lu/0.2-1e-9)+1;
    const P=[];L.forEach((z,i)=>{const bg=z.L>1.5,l_=z.L+2*o.app;P.push({p:P.length+1,d:bg?12:10,lab:`2 HA${bg?12:10} inf. – ${z.lab}`,nE:2,nT:2*z.Q,L:l_+0.2,pts:[[0,0.1],[0,0],[l_,0],[l_,0.1]]})});
    const ps=P.length+1;P.push({p:ps,d:big?10:8,lab:`2 HA${big?10:8} sup. (tous linteaux)`,nE:2,nT:2*sum(L,z=>z.Q),L:lu,pts:[[0,0],[lu,0]]},{p:ps+1,d:6,lab:'cadres HA6 / 20 cm',nE:nc,nT:sum(L,z=>(Math.ceil((z.L+2*o.app)/0.2-1e-9)+1)*z.Q),L:cadL(o.b,o.h),cad:[o.b-2*enr,o.h-2*enr]});
    const bm=rbBeam({L:x.L,h:o.h,sup:o.app,enr,e:0.2,cont:0,hook:1,supL:'appui',pi:{p:1,t:`2HA${big?12:10}`},ps:{p:ps,t:`2HA${big?10:8}`},pc:{p:ps+1,t:'HA6 e=20'},Llab:`ouverture ${x.lab}`,notes:[`Appuis de ${cmr(o.app)} cm de chaque côté ; une ligne de nomenclature par type d'ouverture.`]});
    const bars=plPos(o.b,o.h,[big?12:10,big?12:10,big?10:8,big?10:8],'beam',enr,6).map((q,i)=>i<2?{...q,y:o.h-(enr+0.006+q.d/2000),p:1}:{...q,y:enr+0.006+q.d/2000,p:ps});
    out.push({k:'lin',titre:`LINTEAU ${cmr(o.b)}×${cmr(o.h)} – ${x.lab} (${N(x.L,2)} m)`,elev:bm.s,elevSc:bm.sc,dil:bm.dil>1.05?bm.dil:0,sec:rbSection(757,40,410,250,{nom:'A-A',b:o.b,h:o.h,enr,cd:6,cad:ps+1,bars}),pos:P.slice(0,9),nb:1,V:sum(L,z=>(z.L+2*o.app)*z.Q)*o.b*o.h,coff:sum(L,z=>(z.L+2*o.app)*z.Q)*(2*o.h+o.b),note:`${sum(L,z=>z.Q)} linteaux au total, ${L.length} types.`,cTitre:'Linteaux'})}
  /* poutrelle coulée */
  if(r.dal&&r.dal.t==='coulees'){const d=r.dal,C=plCells(im),Lp=C.length?Math.max(...C.map(c=>c.port)):Lmax,pb=(d.pb||15)/100,ph=(d.ph||16)/100,ec=(d.ec||5)/100,np=sum(C,c=>Math.max(1,Math.ceil(c.larg/((d.ent||60)/100)-1e-9)-1));
    const lp=Lp+0.2,nc=Math.ceil(lp/0.2-1e-9)+1,mlP=sum(C,c=>(Math.max(1,Math.ceil(c.larg/((d.ent||60)/100)-1e-9)-1))*(c.port+0.2));
    const P=[{p:1,d:12,lab:'2 HA12 inférieurs',nE:2,nT:2*np,L:lp,pts:[[0,0],[lp,0]]},{p:2,d:10,lab:'1 HA10 inférieur',nE:1,nT:np,L:lp,pts:[[0,0],[lp,0]]},{p:3,d:8,lab:'1 HA8 supérieur',nE:1,nT:np,L:lp,pts:[[0,0],[lp,0]]},{p:4,d:6,lab:'cadres HA6 / 20 cm',nE:nc,nT:Math.ceil(mlP/0.2)+np,L:cadL(pb,ph+ec*0.6,0.02),cad:[pb-0.04,ph+ec*0.6-0.04]},{p:5,d:10,lab:'chapeaux HA10 sur appuis',nE:2,nT:2*np,L:1.0,pts:[[0,0],[1,0]]}];
    const bm=rbBeam({L:Lp,h:ph+ec,sup:0.2,enr:0.02,e:0.2,cont:0,supL:'chaînage',pi:{p:1,t:'2HA12 + 1HA10 (pos. 2)'},ps:{p:3,t:'1HA8'},pc:{p:4,t:'HA6 e=20'},Llab:'plus grande portée',notes:[`Poutrelles posées tous les ${d.ent||60} cm, appui de 10 cm dans les chaînages ; chapeaux HA10 de 1 m (pos. 5) sur chaque appui.`]});
    const bars=[{x:0.025,y:ph+ec-0.03,d:12,p:1},{x:pb-0.025,y:ph+ec-0.03,d:12,p:1},{x:pb/2,y:ph+ec-0.03,d:10,p:2},{x:pb/2,y:ec*0.5,d:8,p:3}];
    out.push({k:'pou',titre:`POUTRELLE COULÉE ${cmr(pb)}×${cmr(ph)} + table ${cmr(ec)} – portée ${N(Lp,2)} m`,elev:bm.s,elevSc:bm.sc,dil:bm.dil>1.05?bm.dil:0,sec:rbSection(757,40,410,250,{nom:'A-A (poutrelle)',b:pb,h:ph+ec,enr:0.02,cd:6,cad:4,bars}),pos:P,nb:1,V:mlP*pb*ph,coff:mlP*pb,note:`${np} poutrelles, ${N(mlP,1)} ml au total (calepinage planche suivante).`,cTitre:'Plancher : poutrelles coulées'})}
  /* escalier */
  if(r.esc){const e=r.esc,v=e.VV[0],np=Math.floor((e.lg-0.05)/e.eE)+1,nr=Math.ceil(v.inc/0.2)+1,ang=Math.atan(v.ht/Math.max(0.01,v.rc));
    const P=[{p:1,d:e.dE,lab:`HA${e.dE} principaux e=${cmr(e.eE)}`,nE:np,nT:np*e.VV.length*e.et,L:v.inc+0.8,pts:[[-0.4,0],[0,0],[v.rc,v.ht],[v.rc+0.4,v.ht]]},{p:2,d:8,lab:'HA8 répartition e=20',nE:nr,nT:nr*e.VV.length*e.et,L:e.lg-0.05,pts:[[0,0],[e.lg-0.05,0]]},{p:3,d:10,lab:'HA10 chapeaux',nE:np*2,nT:np*2*e.VV.length*e.et,L:1.2,pts:[[0,0],[0.6,0],[0.6+0.6*Math.cos(ang),0.6*Math.sin(ang)]]}];
    if(e.Lp){const n1=Math.ceil(e.Lp/0.15)+1,n2=Math.ceil(e.lg/0.15)+1;P.push({p:4,d:10,lab:'HA10 palier sens court',nE:n1,nT:n1*e.et,L:e.lg+0.3,pts:[[0,0],[e.lg+0.3,0]]},{p:5,d:10,lab:'HA10 palier sens long',nE:n2,nT:n2*e.et,L:e.Lp+0.3,pts:[[0,0],[e.Lp+0.3,0]]})}
    const tot=v.rc+(e.Lp?e.lg:0)+0.9,S=Math.min(620/tot,430/(v.ht+0.5)),ox=90,oy=510,xp=ox+v.rc*S,yp=oy-v.ht*S,xe=xp+(e.Lp?e.lg:0.4)*S,t=e.e*S/Math.cos(ang),c=0.025*S;let s='';
    let pts=[[ox,oy]],x=ox,y=oy;for(let i=0;i<v.v;i++){y-=e.h*S;pts.push([x,y]);if(i<v.v-1){x+=e.g*S;pts.push([x,y])}}pts.push([xe,y]);const bot=[[xe,y+e.e*S],[xp,y+e.e*S],[ox,oy+t]];
    s+=`<polygon points="${[...pts,...bot].map(p=>p.map(z=>z.toFixed(1)).join(',')).join(' ')}" fill="#f4f1ec" stroke="${RBK}" stroke-width="1.4"/>`+`<rect x="${ox-0.5*S}" y="${oy}" width="${0.7*S}" height="${0.3*S}" fill="#e6e2da" stroke="#777"/>`;
    const ya=oy+t-c-2,yb=yp+e.e*S-c-2;s+=`<polyline points="${ox-0.4*S},${ya} ${ox},${ya} ${xp},${yb} ${xe-5},${yb}" fill="none" stroke="${RBA}" stroke-width="2.6"/>`;
    s+=`<polyline points="${ox+5},${oy-e.e*S*0.2} ${ox+0.6*S*Math.cos(ang)},${oy-0.6*S*Math.sin(ang)+c*2}" fill="none" stroke="${RBA}" stroke-width="2.2"/>`+`<polyline points="${xp-0.6*S*Math.cos(ang)},${yp+0.6*S*Math.sin(ang)+c*2} ${xp},${yp+c*2} ${xp+0.6*S},${yp+c*2}" fill="none" stroke="${RBA}" stroke-width="2.2"/>`;
    for(let i=0;i<nr;i++){const f=i/(nr-1);s+=`<circle cx="${(ox+(xp-ox)*f).toFixed(1)}" cy="${(ya+(yb-ya)*f-5).toFixed(1)}" r="2.6" fill="${RBC}"/>`}
    s+=rLead((ox+xp)/2,(ya+yb)/2,(ox+xp)/2+30,(ya+yb)/2+50,1,`${np} HA${e.dE} e=${cmr(e.eE)}`,RBA)+rLead(ox+(xp-ox)*0.3,ya+(yb-ya)*0.3-5,ox+(xp-ox)*0.3-50,ya+(yb-ya)*0.3+60,2,'HA8 e=20',RBC,'end')+rLead(xp-0.3*S*Math.cos(ang),yp+0.3*S*Math.sin(ang)+c*2,xp-90,yp-30,3,'chapeaux HA10',RBA,'end');
    if(e.Lp)s+=rLead((xp+xe)/2,yb,(xp+xe)/2+20,yp-40,4,'palier HA10 e=15',RBA);
    s+=rDimV(yp,oy,ox-30,`${v.v} × ${N(e.h*100,1)} = ${cmr(v.ht)}`)+rDimH(ox,xp,oy+t+28,`${v.v-1} × ${N(e.g*100,1)} = ${cmr(v.rc)}`)+(e.Lp?rDimH(xp,xe,oy+t+28,`palier ${cmr(e.lg)}`):'')+rCut((ox+xp)/2-40,(oy+yp)/2-10,(oy+yp)/2+40,'A');
    s+=rT(40,604,`${e.nC} contremarches de ${N(e.h*100,1)} cm · giron ${N(e.g*100,1)} cm · Blondel 2h + g = ${N(e.bl,1)} cm · paillasse ${cmr(e.e)} cm · volée 2 identique`,{s:9,a:'start',c:'#333'});
    const bars=[];for(let i=0;i<np;i++)bars.push({x:0.03+(e.lg-0.06)*i/Math.max(1,np-1),y:e.e-0.03,d:e.dE,p:1});const sec=rbSection(757,40,410,250,{nom:'A-A (paillasse)',b:e.lg,h:e.e,enr:0.025,cd:8,cad:2,bars});
    out.push({k:'esc',titre:`ESCALIER – volée 1 (${v.v} contremarches), largeur ${N(e.lg,2)} m`,elev:s,elevSc:rbScale(S),sec,pos:P,nb:1,V:(sum(e.VV,x=>e.lg*x.inc*e.e+e.lg*(x.v-1)*e.h*e.g/2)+(e.Lp?e.lg*e.Lp*e.e:0))*e.et,coff:0,note:`${e.et} escalier${e.et>1?'s':''} ; quantités pour l'ensemble des volées et paliers.`,cTitre:'Escalier'})}
  /* planches encadrées : implantation, plancher, fosse, regards */
  const W=[{k:'impl',svg:im.svg,t:"Plan d'implantation",x:rbTextBlock(30,640,['TRAÇAGE',`Repère 0 à l'angle façade avant / pignon gauche`,`Cordeaux tendus sur chaises à ${N(im.rc)} m des murs`,`Équerre : diagonales ${N(im.dg,2)} m égales à ±1 cm (ou 3-4-5)`,`${im.PT.length} points d'axes, coordonnées dans la vue simplifiée`])}];
  const nPl=g.et+(r.p.toiture==='terrasse'?1:0),AXN=r.p.axEtMode==='diff'&&r.p.axesN?r.p.axesN:null,levs=[];if(r.dal){for(let i=0;i<Math.max(1,nPl);i++){const ax=i&&AXN&&AXN[i]&&AXN[i].length?AXN[i]:null;levs.push({i,ax})}}
  const lvDistinct=levs.filter((l,j)=>j===0||l.ax);
  if(r.dal)lvDistinct.forEach((lv,j)=>{const imL=lv.ax?plImpl(r,lv.ax):im,D=plDalle(r.dal,imL,g),same=levs.filter(l=>l.i===lv.i||(!l.ax&&!lv.ax)).map(l=>'haut '+NIVL(l.i));W.push({k:'dal'+j,svg:D.svg,t:(r.dal.t==='pleine'?'Dalle pleine':'Calepinage des poutrelles')+' – plancher '+same.join(', '),x:rbTextBlock(30,640,['PLANCHER '+same.join(', ').toUpperCase(),...(r.dal.t==='pleine'?[`Dalle pleine ${r.dal.ep} cm, HA${r.dal.dd} e=${r.dal.esp} cm dans les 2 sens`,'Chapeaux sur appuis : ¼ de la portée']:[`${sum(D.C,c=>c.n||0)} poutrelles, ${sum(D.C,c=>c.hd||0)} hourdis`,`Entraxe ${r.dal.ent||60} cm, sens de la plus petite portée`]),lv.ax?`Axes du ${NIVL(lv.i)} (murs porteurs de ce niveau)`:'Axes du rez-de-chaussée','Orange : appui à vérifier / poutre à prévoir'])})});
  if(false){const D=null;W.push({k:'dal',svg:'',t:'',x:rbTextBlock(30,640,['PLANCHER',...(0?[`Dalle pleine ${r.dal.ep} cm, HA${r.dal.dd} e=${r.dal.esp} cm dans les 2 sens`,'Chapeaux sur appuis : ¼ de la portée']:[`${sum(D.C,c=>c.n||0)} poutrelles, ${sum(D.C,c=>c.hd||0)} hourdis`,`Entraxe ${r.dal.ent||60} cm, sens de la plus petite portée`]),'Orange : appui à vérifier / poutre à prévoir'])});}if(r.dal)W.push({k:'dalc',svg:plDalleCoupe(r.dal,g),t:'Plancher : coupe type'})
  if(r.fos)W.push({k:'fos',svg:plFosse(r.fos),t:'Fosse septique'});if(r.reg)W.push({k:'reg',svg:plRegard(r.reg),t:'Regards et réseau des douches'});
  const all=[];W.slice(0,1).forEach(w=>all.push({k:w.k,t:w.t,wrap:w}));if(r.potN)all.push({k:'ddc',t:'Descente de charges',raw:1});out.filter(o=>/^(fond|pot\d*|lon|ch|chT|lin)$/.test(o.k)).forEach(o=>all.push({k:o.k,t:o.cTitre,o}));
  W.filter(w=>/^dal/.test(w.k)).forEach(w=>all.push({k:w.k,t:w.t,wrap:w}));out.filter(o=>o.k==='pou'||o.k==='esc').forEach(o=>all.push({k:o.k,t:o.cTitre,o}));W.filter(w=>w.k==='fos'||w.k==='reg').forEach(w=>all.push({k:w.k,t:w.t,wrap:w}));
  return all.map((a,i)=>{const inf={...info,no:i+1,tot:all.length};return{k:a.k,t:a.t,svg:a.raw?rbDDC(r,inf):a.o?rbSheet(a.o,inf):rbWrap(a.wrap.svg,a.wrap.t,inf,a.wrap.x)}})}
function rbInfo(d){const ch=S.chantiers.find(c=>c.id===d.chantierId)||{},E=ent(),r=plansOf(d)||{};return{ent:E.nom||'KLEIN TECH-INNOVATION',auteur:E.nom||'',projet:(ch.nom||'')+(d.objet?' – '+d.objet:''),client:d.client||ch.client||'',num:d.numero||'',date:new Date().toLocaleDateString('fr-FR'),enr:N(((r.gen||{}).enr||3),1)}}
async function pdfSheets(d,sheets){const {jsPDF}=window.jspdf,doc=new jsPDF({unit:'mm',format:'a4',orientation:'landscape'});
  for(let i=0;i<sheets.length;i++){if(i)doc.addPage('a4','landscape');const im=await svgPng(sheets[i].svg,2);doc.addImage(im.url,'JPEG',0,0,297,210)}
  const save=window.savePdfRaw||savePdf;await save(doc,`Plans d'exécution ${d.numero}.pdf`)}

/* note de descente de charges */
function rbDDC(r,info){const h=baelH(),g=r.gen||{},P=r.potN,p=r.p;let s=`<rect x="0" y="0" width="${RB.W}" height="${RB.H}" fill="#fff"/><rect x="12" y="12" width="${RB.W-24}" height="${RB.H-24}" fill="none" stroke="${RBK}" stroke-width="1.6"/>`+rL(12,622,RB.W-12,622,RBK,1.2);
  s+=rT(24,36,'DESCENTE DE CHARGES ET DIMENSIONNEMENT DES POTEAUX PAR NIVEAU (BAEL 91 mod. 99, B.8.4)',{s:13,b:1,a:'start'});
  const hyp=[`Hypothèses : toiture ${p.toiture==='terrasse'?'terrasse G = '+h.gTerr+' kN/m², Q = '+h.qTerr:'tôle + charpente + plafond G = '+h.gToit} kN/m² · plancher G = ${h.gPl} kN/m², Q = ${h.qHab} kN/m² · murs ${h.gMur} kN/m² · ossature +10 %`,`Surface par niveau ${N(g.L*g.l,1)} m² · ${g.nbPot} poteaux · poteau le plus chargé majoré × ${N(h.maj)} · hauteur d'étage ${N(g.H,2)} m · longueur de flambement lf = 0,7 H`,`Nu = 1,35 G + 1,5 Q ; λ = lf √12 / a ; α = 0,85 / (1 + 0,2 (λ/35)²) ÷ 1,10 ; Nu ≤ α [Br fc28 / (0,9 γb) + A fe / γs] ; Amin = max(4 cm²/m de périmètre ; 0,2 % B)`];
  hyp.forEach((t,i)=>s+=rT(24,62+i*16,t,{s:10,a:'start',c:'#333'}));
  const cols=[['Niveau',70],['Planchers portés',90],['G total (kN)',85],['Q total (kN)',85],['Nu / poteau (kN)',105],['Section (cm)',85],['λ',55],['α',55],['A requise (cm²)',95],['A min (cm²)',80],['Armatures',115],['A réelle (cm²)',90],['Cadres',95]];
  let y=120,x=24;cols.forEach(([t,w])=>{s+=`<rect x="${x}" y="${y}" width="${w}" height="24" fill="#e9e4da" stroke="#666" stroke-width=".5"/>`+rT(x+w/2,y+16,t,{s:9,b:1});x+=w});
  P.slice().reverse().forEach((q,j)=>{y+=24;x=24;const v=[NIVL(q.i),q.nPl+' + toit',Math.round(q.G),Math.round(q.Q),Math.round(q.Nu),`${cmr(q.a)} × ${cmr(q.a)}`,N(q.lam,1),N(q.alpha,2),N(q.Areq,2),N(q.Amin,2),q.arm,N(q.A,2),`HA${q.cd} e=${N(q.ce,1)}`];
    cols.forEach(([t,w],i)=>{s+=`<rect x="${x}" y="${y}" width="${w}" height="24" fill="${i===5||i===10?'#fbf6ec':'none'}" stroke="#999" stroke-width=".4"/>`+rT(x+w/2,y+16,v[i],{s:10,b:i===5||i===10});x+=w})});
  y+=50;const mx=Math.max(...P.map(q=>q.Nu)),bx=24,bw=600;s+=rT(bx,y,'Effort normal ultime par poteau selon le niveau',{s:11,b:1,a:'start'});
  P.slice().reverse().forEach((q,j)=>{const yy=y+16+j*30,w=q.Nu/mx*(bw-120);s+=rT(bx+60,yy+16,NIVL(q.i),{s:10,a:'end'})+`<rect x="${bx+70}" y="${yy}" width="${w.toFixed(1)}" height="22" fill="${RBC}" opacity="${0.45+0.5*q.Nu/mx}"/>`+rT(bx+76+w,yy+15,`${Math.round(q.Nu)} kN → ${cmr(q.a)}×${cmr(q.a)} ${q.arm}`,{s:9.5,a:'start'})});
  s+=rbTextBlock(700,y,['LECTURE',"Le poteau du RDC porte tous les planchers et la toiture :",'sa section et ses aciers sont les plus forts.','En montant, la charge baisse : section et aciers réduits,','jamais plus grands qu\'au niveau du dessous.','Les semelles sont calculées avec la charge du RDC.']);
  if(r.am&&r.am.b+0.001<P[0].a)s+=rT(24,600,`⚠ L'amorce du devis (${cmr(r.am.b)}×${cmr(r.am.b)}) est plus petite que le poteau du RDC (${cmr(P[0].a)}×${cmr(P[0].a)}) : mets l'amorce à ${cmr(P[0].a)} cm à l'écran 6 de l'assistant.`,{s:10.5,b:1,a:'start',c:'#c0392b'});
  s+=rbCart(info,'Descente de charges – poteaux par niveau');return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${RB.W} ${RB.H}" width="${RB.W}" height="${RB.H}" style="max-width:100%;height:auto;font-family:Helvetica,Arial,sans-serif">${s}</svg>`}
