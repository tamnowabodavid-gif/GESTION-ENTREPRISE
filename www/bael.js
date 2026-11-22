/* ===== Dimensionnement des fondations et poteaux selon le BAEL 91 révisé 99 (+ DTU 13.12) =====
   Prédimensionnement pour devis : ne remplace pas la note de calcul signée par un ingénieur structure. */
const BAELDEF={fc28:25,fe:400,fiss:'prej',cF:5,cE:3,gMur:2.3,gToit:0.7,gTerr:6.0,gPl:5.1,qHab:1.5,qTerr:1.0,maj:1.15,gSol:20};
const BAELLAB=[['fc28','Résistance du béton à 28 jours fc28','MPa'],['fe','Limite élastique de l\'acier HA fe','MPa'],['fiss','Fissuration des fondations','',[['peu','Peu préjudiciable'],['prej','Préjudiciable (au contact du sol, conseillé)'],['tres','Très préjudiciable (eau agressive, mer)']]],
  ['cF','Enrobage des fondations (semelles, radier)','cm'],['cE','Enrobage des poteaux, amorces, longrines','cm'],['gMur','Poids des murs enduits (G)','kN/m²'],['gToit','Toiture tôle + charpente + plafond (G)','kN/m²'],['gTerr','Toiture terrasse en béton (G)','kN/m²'],
  ['gPl','Plancher d\'étage avec revêtement et cloisons (G)','kN/m²'],['qHab','Charge d\'exploitation habitation (Q)','kN/m²'],['qTerr','Terrasse non accessible (Q)','kN/m²'],['maj','Majoration du poteau le plus chargé','×'],['gSol','Poids du sol et du béton sur la semelle','kN/m³']];
function baelH(){const o={...BAELDEF},r=((S.config.regles||{}).bael)||{};Object.entries(r).forEach(([k,v])=>{if(v!=null&&v!=='')o[k]=k==='fiss'?v:num(v)});return o}
const HAS=[8,10,12,14,16,20,25],aB=d=>Math.PI*(d/10)**2/4,c5=x=>Math.ceil(x*20-1e-9)/20,f1=x=>N(x,1),f2=x=>N(x,2);
function baelMat(h){const ft=0.6+0.06*h.fc28,fsu=h.fe/1.15,eta=1.6,ss=h.fiss==='peu'?fsu:Math.min(2*h.fe/3,110*Math.sqrt(eta*ft))*(h.fiss==='tres'?0.8:1);return{ft,fsu,ss,fbu:0.85*h.fc28/1.5}}
/* charges descendantes (kN) */
function baelCharges(x,h){const A=x.A,et=x.et,nN=et+1,H=x.H||3,Lw=x.Lw||Math.sqrt(A)*4*1.6;
  const Gt=A*(x.ter?h.gTerr:h.gToit),Gp=A*h.gPl*et,Gm=Lw*H*nN*0.85*h.gMur*(x.ep20?1.2:1),Gs=0.1*(Gt+Gp+Gm),G=Gt+Gp+Gm+Gs,Q=A*h.qHab*et+(x.ter?A*h.qTerr:0);
  const Ns=G+Q,Nu=1.35*G+1.5*Q,nP=Math.max(1,x.nPot||Math.ceil(A/7));
  return{G,Q,Ns,Nu,nP,NsP:Ns/nP*h.maj,NuP:Nu/nP*h.maj,Lw,
    txt:`Charges (BAEL) : G = ${Math.round(G)} kN (toiture ${Math.round(Gt)}${et?`, planchers ${Math.round(Gp)}`:''}, murs ${Math.round(Gm)}, ossature ${Math.round(Gs)}), Q = ${Math.round(Q)} kN → ELS Ns = G + Q = ${Math.round(Ns)} kN ; ELU Nu = 1,35 G + 1,5 Q = ${Math.round(Nu)} kN. Poteau le plus chargé (÷ ${nP} poteaux × ${N(h.maj)}) : Ns = ${Math.round(Ns/nP*h.maj)} kN, Nu = ${Math.round(Nu/nP*h.maj)} kN.`}}
/* choisit nombre/diamètre/espacement pour une section requise sur une largeur */
function nappe(As,L,d0,e0,c){let d=d0;for(let k=0;k<6;k++){const n=Math.max(Math.ceil(As/aB(d)),Math.floor((L-2*c)/(e0/100))+1,2),e=Math.floor((L-2*c)/(n-1)*100/0.5)*0.5;if(e>=10||d>=25)return{d,n,e,A:n*aB(d)};d=HAS[HAS.indexOf(d)+1]||d}return{d,n:2,e:e0,A:2*aB(d)}}
/* ===== vérification / correction ===== fix=true : corrige c (valeurs du catalogue) ; fix=false : signale seulement */
function baelRun(c,x,ft,fix){const h=baelH(),m=baelMat(h),L=baelCharges(x,h),out=[L.txt],ok=t=>out.push('✔ '+t),ko=t=>out.push('⚠ '+t),sig=(x.sig||c.sig)*100,D=x.prof||c.prof,cf=h.cF/100,ce=h.cE/100;
  out.push(`Matériaux : béton fc28 = ${h.fc28} MPa (ft28 = ${f2(m.ft)} MPa), acier HA fe = ${h.fe} MPa (fsu = fe/1,15 = ${Math.round(m.fsu)} MPa) ; fissuration ${h.fiss==='peu'?'peu préjudiciable':h.fiss==='tres'?'très préjudiciable':'préjudiciable'} → σs ≤ ${Math.round(m.ss)} MPa à l'ELS ; enrobages ${h.cF} cm (fondations) et ${h.cE} cm (poteaux).`);
  const qn=sig-h.gSol*D;if(qn<=0){ko('Portance trop faible pour cette profondeur : étude de sol indispensable.');return{c,lines:out,L}}
  /* poteaux (élévation) puis amorces : compression centrée BAEL B.8.4 */
  const pot=(b,n,d,cd,cdE,l0,lab,kb,kn,kd,kcd,kce)=>{let a=b/100,dd=d,nn=n,ee=cdE;const ax=fix?0:(c[kn.replace('_n','_ax')]||0),AR=()=>nn*aB(dd)+ax,LB=()=>ax?`${nn} HA${dd} + barres complémentaires`:`${nn} HA${dd}`;
    for(let it=0;it<8;it++){const lf=0.7*l0,lam=3.464*lf/a,alpha=(lam<=50?0.85/(1+0.2*(lam/35)**2):0.6*(50/lam)**2)/1.1,Br=(a-0.02)**2,Areq=Math.max(0,(L.NuP/alpha-Br*h.fc28*1000/1.35)*1.15/(h.fe*1000)*1e4),Amin=Math.max(4*4*a,0.002*a*a*1e4),Amax=0.05*a*a*1e4,need=Math.max(Areq,Amin);
      if(lam>70||need>Amax){if(!fix){ko(`${lab} ${b}×${b} : ${lam>70?'élancement λ = '+f1(lam)+' > 70':'acier nécessaire > 5 % de la section'} → section insuffisante.`);break}a+=0.05;continue}
      if(AR()<need){if(!fix){ko(`${lab} : ${LB()} = ${f2(AR())} cm² < ${f2(need)} cm² nécessaires (${Areq>Amin?'ELU':'minimum 4 cm²/m de périmètre et 0,2 %'}).`);break}const nd=HAS.find(z=>z>=dd&&nn*aB(z)>=need);if(nd)dd=nd;else{nn+=2;continue}}
      const stM=Math.min(15*dd/10,40,a*100+10),cdm=Math.max(6,Math.ceil(dd/3));
      if(fix){c[kb]=Math.round(a*100);c[kn]=nn;c[kd]=dd;c[kcd]=Math.max(c[kcd],cdm);c[kce]=Math.min(c[kce],Math.floor(stM/2.5)*2.5)}
      const okc=cd>=dd/3-1e-9||fix,oks=ee<=stM||fix;
      (okc&&oks?ok:ko)(`${lab} ${Math.round(a*100)}×${Math.round(a*100)} cm : λ = ${f1(lam)} ${lam<=50?'≤ 50':'≤ 70'}, α = ${f2(alpha)} (÷1,10, charges avant 90 j) ; Nu = ${Math.round(L.NuP)} kN ≤ α(Br·fc28/0,9γb + A·fe/γs) → A ≥ ${f2(need)} cm², retenu ${LB()} = ${f2(AR())} cm² (max 5 % = ${f1(Amax)} cm²) ; cadres Φt ≥ Φl/3 ${okc?'✓':'✗'}, espacement ≤ min(15Φl ; 40 cm ; a+10) = ${f1(stM)} cm ${oks?'✓':'✗ ('+ee+' cm)'}.`);break}};
  pot(c.pot_b,c.pot_n,c.pot_d,c.pot_cd,c.pot_ce,x.H||3,'Poteaux','pot_b','pot_n','pot_d','pot_cd','pot_ce');
  const iso=ft==='isolees'||ft==='mixte';
  if(iso){if(fix&&c.am_b<c.pot_b)c.am_b=c.pot_b;pot(c.am_b,c.am_n,c.am_d,c.am_cd,c.am_ce,Math.max(0.5,x.amH||1),'Amorces','am_b','am_n','am_d','am_cd','am_ce')}
  /* semelles isolées : DTU 13.12 / méthode des bielles */
  if(iso&&ft!=='radier'){const a=(c.am_b||c.pot_b)/100;let A=x.siA?x.siA/100:c.sem_a/100,hh=c.sem_h/100,bad=false;const Areq=c5(Math.sqrt(L.NsP/qn));
    if(A<Areq){if(fix)A=Areq;else{bad=true;ko(`Semelles ${Math.round(A*100)} cm : surface insuffisante, il faut A ≥ √(Ns/(σsol − γ·D)) = ${Math.round(Areq*100)} cm.`)}}
    const dmin=(A-a)/4,hmin=c5(Math.max(dmin+cf,0.15,(12*c.sem_d/10+6)/100));if(hh<hmin){if(fix)hh=hmin;else{bad=true;ko(`Semelles : épaisseur ${Math.round(hh*100)} cm < ${Math.round(hmin*100)} cm (d ≥ (A − a)/4 et rebord ≥ max(15 cm ; 12Φ + 6 cm)).`)}}
    const d=hh-cf,Au=L.NuP*(A-a)/(8*d*m.fsu*1000)*1e4,As=h.fiss==='peu'?Au:Math.max(Au,L.NsP*(A-a)/(8*d*m.ss*1000)*1e4),nap=nappe(As,A,c.sem_d,c.sem_e,cf),ls=40*nap.d/10;
    if(fix){c.sem_a=Math.round(A*100);c.sem_h=Math.round(hh*100);c.sem_d=nap.d;c.sem_e=nap.e}
    const real=fix?nap:{d:c.sem_d,e:c.sem_e,A:(Math.floor((A-2*cf)/(c.sem_e/100))+1)*aB(c.sem_d)};
    (real.A>=As-1e-6&&!bad?ok:ko)(`Semelles ${Math.round(A*100)}×${Math.round(A*100)}×${Math.round(hh*100)} cm : contrainte sur le sol ${f2((L.NsP/(A*A)+h.gSol*D)/100)} bar ${(L.NsP/(A*A)+h.gSol*D)<=sig?'≤':'> (trop forte)'} ${f2(sig/100)} bar ; d = ${Math.round(d*100)} cm ≥ (A − a)/4 = ${f1(dmin*100)} cm ; aciers par sens As = max(ELU Nu(A−a)/8d·fsu ; ELS Ns(A−a)/8d·σs) = ${f2(As)} cm² → HA${real.d} tous les ${N(real.e)} cm = ${f2(real.A)} cm² ; ancrage ls = 40Φ = ${ls} cm ${ls>A*25?'> A/4 → crochets aux extrémités':ls>A*12.5?'> A/8 → barres sur toute la longueur, sans crochets':'≤ A/8 → barres arrêtables'}.`)}
  /* semelles filantes : charge par mètre linéaire de mur */
  if(ft==='filantes'||ft==='mixte'||ft==='cyclo'){const qs=L.Ns/L.Lw*(iso?0.5:1),qu=L.Nu/L.Lw*(iso?0.5:1),b=0.2;let B=x.fsb?x.fsb:c.fil_B/100,hh=c.fil_h/100;const Breq=c5(Math.max(0.4,qs/qn));
    if(B<Breq){if(fix)B=Breq;else ko(`Semelles filantes ${Math.round(B*100)} cm : il faut B ≥ q/(σsol − γ·D) = ${Math.round(Breq*100)} cm.`)}
    if(ft!=='cyclo'){const hmin=c5(Math.max((B-b)/4+cf,0.15));if(hh<hmin){if(fix)hh=hmin;else ko(`Semelles filantes : épaisseur < ${Math.round(hmin*100)} cm.`)}
      const d=hh-cf,Au=qu*(B-b)/(8*d*m.fsu*1000)*1e4,As=Math.max(Au,h.fiss==='peu'?0:qs*(B-b)/(8*d*m.ss*1000)*1e4),e=Math.min(c.fil_te,Math.floor(aB(c.fil_td)/Math.max(As,0.01)*100/2.5)*2.5),Ar=Math.max(As*B/4,0.0),nl=Math.max(c.fil_n,Math.ceil(Ar/aB(c.fil_d)),3);
      if(fix){c.fil_B=Math.round(B*100);c.fil_h=Math.round(hh*100);if(e<10){c.fil_td=HAS[HAS.indexOf(c.fil_td)+1]||c.fil_td}else c.fil_te=e;c.fil_n=nl}
      ok(`Semelles filantes ${Math.round(B*100)}×${Math.round(hh*100)} cm : q = ${f1(qs)} kN/ml → contrainte ${f2((qs/B+h.gSol*D)/100)} bar ≤ ${f2(sig/100)} bar ; aciers transversaux As = ${f2(As)} cm²/ml → HA${c.fil_td} tous les ${c.fil_te} cm ; répartition Ar = As·B/4 = ${f2(Ar)} cm² → ${c.fil_n} HA${c.fil_d}.`)}
    else ok(`Béton cyclopéen ${Math.round(B*100)} cm : contrainte ${f2((qs/B+h.gSol*D)/100)} bar ≤ ${f2(sig/100)} bar.`)}
  /* radier */
  if(ft==='radier'){const Ar=x.Arad||(x.A*1.15),qs=L.Ns/Ar,qu=L.Nu/Ar,Lx=Math.max(2.5,Math.sqrt(x.A/L.nP)),hmin=c5(Math.max(0.2,Lx/20));let hh=c.rad_ep/100;
    if(qs/100>sig/100)ko(`Radier : contrainte ${f2(qs/100)} bar > portance ${f2(sig/100)} bar → améliorer le sol (substitution) ou étude spécifique.`);
    if(hh<hmin){if(fix)hh=hmin;else ko(`Radier : épaisseur < Lx/20 = ${Math.round(hmin*100)} cm.`)}
    const d=hh-cf,Mu=0.85*0.0368*qu*Lx*Lx,Ms=0.85*0.0441*qs*Lx*Lx,As=Math.max(Mu/(0.9*d*m.fsu*1000)*1e4,h.fiss==='peu'?0:Ms/(0.9*d*m.ss*1000)*1e4,0.0008*hh*1e4),emax=Math.min(h.fiss==='peu'?33:25,2*hh*100);
    let dd=c.rad_d,e=Math.min(c.rad_e,emax,Math.floor(aB(dd)/As*100/2.5)*2.5);while(e<10&&dd<20){dd=HAS[HAS.indexOf(dd)+1];e=Math.min(c.rad_e,emax,Math.floor(aB(dd)/As*100/2.5)*2.5)}
    if(fix){c.rad_ep=Math.round(hh*100);c.rad_d=dd;c.rad_e=e}
    ok(`Radier ${Math.round(hh*100)} cm : réaction du sol ${f2(qs/100)} bar ; panneau Lx ≈ ${f1(Lx)} m (h ≥ Lx/20) ; Mx = μx·q·Lx² (×0,85 continuité) → As = ${f2(As)} cm²/m par nappe et par sens (min 0,08 %) → HA${dd} tous les ${N(e)} cm (≤ ${N(emax)} cm).`)}
  /* chaînage bas / longrines (ou nervures du radier) */
  {const b=c.lon_b/100,hh=c.lon_h/100,d=hh-ce-0.01;let need=Math.max(2*0.23*b*d*m.ft/h.fe*1e4,(L.NuP/10)/(m.fsu*1000)*1e4),lab='Chaînage bas / longrines',why='non-fragilité 0,23·b·d·ft28/fe par face et traction Nu/10';
    if(ft==='radier'){const Lp=Math.max(3,L.Lw/L.nP),q=L.Nu/L.Lw,Mu=q*Lp*Lp/10,qs=L.Ns/L.Lw;need=Math.max(need,2*Mu/(0.9*d*m.fsu*1000)*1e4,h.fiss==='peu'?0:2*qs*Lp*Lp/10/(0.9*d*m.ss*1000)*1e4);lab='Nervures du radier';why='flexion q·L²/10 entre poteaux, 2 faces'}
    let n=c.lon_n,dd=c.lon_d;const lax=fix?0:(c.lon_ax||0);if(n*aB(dd)+lax<need){if(fix){const nd=HAS.find(z=>z>=dd&&n*aB(z)>=need);if(nd)dd=nd;else{n+=2;dd=HAS.find(z=>n*aB(z)>=need)||dd}}else ko(`${lab} : ${f2(n*aB(dd)+lax)} cm² < ${f2(need)} cm² (${why}).`)}
    const stM=Math.min(0.9*d*100,40);if(fix){c.lon_n=n;c.lon_d=dd;c.lon_ce=Math.min(c.lon_ce,Math.floor(stM/2.5)*2.5);c.lon_cd=Math.max(c.lon_cd,Math.ceil(dd/3),6)}
    const okE=fix||c.lon_ce<=stM+1e-9;if(fix||n*aB(dd)+lax>=need)(okE?ok:ko)(`${lab} ${c.lon_b}×${c.lon_h} cm : A ≥ ${f2(need)} cm² (${why}) → ${n} HA${dd}${lax?' + barres complémentaires':''} = ${f2(n*aB(dd)+lax)} cm² ; cadres HA${c.lon_cd} tous les ${N(c.lon_ce)} cm ${okE?'≤':'> (trop espacés)'} min(0,9d ; 40 cm) = ${f1(stM)} cm.`)}
  out.push(`Béton de propreté ≥ 5 cm sous toutes les fondations ; dosage du béton armé ${c.dos_ba} kg/m³ (fc28 = ${h.fc28} MPa visé, à contrôler par essais d'écrasement).`);
  return{c,lines:out,L}}
/* ===== descente de charges et dimensionnement des poteaux niveau par niveau (BAEL B.8.4) =====
   x : {A, et, H, Lw (murs RDC), LwN:[murs par niveau], ter, nPot, b0 (section RDC du devis, m), arm0, ce0, aMin} */
function baelNiv(x){const h=baelH(),nN=x.et+1,nP=Math.max(1,x.nPot),R=[];let aUp=x.aMin||0.2;const LwN=x.LwN||Array.from({length:nN},(_,i)=>i?x.LwE||x.Lw:x.Lw);
  for(let i=x.et;i>=0;i--){const nPl=x.et-i,Gt=x.A*(x.ter?h.gTerr:h.gToit),Gp=x.A*h.gPl*nPl;let Gm=0;for(let j=i;j<nN;j++)Gm+=LwN[j]*x.H*0.85*h.gMur;
    const Gs=0.1*(Gt+Gp+Gm),G=Gt+Gp+Gm+Gs,Q=x.A*h.qHab*nPl+(x.ter?x.A*h.qTerr:0),Nu=(1.35*G+1.5*Q)/nP*h.maj,Ns=(G+Q)/nP*h.maj;
    let a=Math.max(aUp,x.aMin||0.2);if(i===0&&x.b0)a=Math.max(a,x.b0);let res=null;
    for(let it=0;it<12&&!res;it++){const lam=3.464*0.7*x.H/a,alpha=(lam<=50?0.85/(1+0.2*(lam/35)**2):0.6*(50/lam)**2)/1.1,Br=(a-0.02)**2,Areq=Math.max(0,(Nu/alpha-Br*h.fc28*1000/1.35)*1.15/(h.fe*1000)*1e4),Amin=Math.max(4*4*a,0.002*a*a*1e4),need=Math.max(Areq,Amin);
      if(lam>70||need>(x.rmax||0.025)*a*a*1e4){a=Math.round((a+0.05)*100)/100;continue}
      const maxB=a<0.3?8:12,keep=i===0&&x.arm0&&armArea(x.arm0)>=need-1e-6?x.arm0:null;
      const cand=keep?[keep]:ARMS.filter(s=>{const P=armParse(s);return sum(P,q=>q.n)<=maxB&&Math.min(...P.map(q=>q.d))>=10&&armArea(s)>=need-1e-6}).sort((p,q)=>armArea(p)-armArea(q)||sum(armParse(p),z=>z.n)-sum(armParse(q),z=>z.n));
      if(!cand.length){a=Math.round((a+0.05)*100)/100;continue}
      const arm=cand[0],P=armParse(arm),dmax=Math.max(...P.map(q=>q.d)),dmin=Math.min(...P.map(q=>q.d)),cd=[6,8,10].find(z=>z>=dmax/3)||10,ce=Math.max(10,Math.floor(Math.min(15*dmin/10,40,a*100+10,x.ce0||15)/2.5)*2.5);
      res={i,G,Q,Nu,Ns,a,arm,A:armArea(arm),need,Areq,Amin,lam,alpha,cd,ce,nPl}}
    if(!res)res={i,G,Q,Nu,Ns,a,arm:'4HA14',A:armArea('4HA14'),need:0,Areq:0,Amin:0,lam:0,alpha:0,cd:6,ce:15,nPl,ko:1};R.unshift(res);aUp=res.a}
  /* une section ne peut pas grandir en montant : on garde la plus grande vers le bas */
  for(let i=1;i<R.length;i++)if(R[i].a>R[i-1].a)R[i-1].a=R[i].a;return R}
