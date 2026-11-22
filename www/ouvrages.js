/* ---------- Devis par ouvrage (travaux ponctuels) ---------- */
const SAB=[['gr-sable-sanaga','Sable Sanaga'],['gr-sable','Sable de rivière'],['gr-sable-carriere','Sable de carrière'],['gr-sable-fin','Sable fin']],GRAV=[['mixte','Mélange 5/15 + 15/25 (moitié-moitié)'],['gr-gravier-515','Gravier 5/15 (petit)'],['gr-gravier-1525','Gravier 15/25 (moyen)']];
const HA=[['6','HA6'],['8','HA8'],['10','HA10'],['12','HA12'],['14','HA14'],['16','HA16']];
const PPS=[['pp-10','Parpaing creux de 10'],['pp-15c','Parpaing creux de 15'],['pp-15p','Parpaing plein de 15'],['pp-20c','Parpaing creux de 20'],['pp-20p','Parpaing plein de 20']];
const CARR=()=>CATALOGUE.find(s=>s.id==='revetements').a.filter(a=>/^rv-(\d|antid|faience)/.test(a[0])).map(a=>[a[0],a[1]]);
const OUV={
  semelles:{ic:'🟫',nom:'Semelles isolées',f:[['n','Nombre de semelles','8'],['L','Longueur (m)','1'],['l','Largeur (m)','1'],['h','Épaisseur (m)','0.3'],['pf','Profondeur de fouille (m)','1'],['sur','Surlargeur de fouille de chaque côté (cm)','10'],['d','Aciers de la nappe','10',HA],['e','Espacement des aciers (cm)','15']]},
  filantes:{ic:'〰️',nom:'Semelles filantes (en tranchée)',f:[['ml','Longueur totale des tranchées (m)','40'],['lt','Largeur de la tranchée (m)','0.6'],['pf','Profondeur de la tranchée (m)','0.8'],['sb','Largeur de la semelle (m)','0.5'],['sh','Hauteur de la semelle (m)','0.25'],['nb','Aciers filants : nombre','4'],['d','Aciers filants : diamètre','10',HA],['td','Aciers transversaux','8',HA],['te','Espacement des transversaux (cm)','20']]},
  amorces:{ic:'📍',nom:'Amorces de poteaux (fondation)',f:[['n','Nombre d\'amorces','8'],['a','Section : côté a (cm)','20'],['b','Section : côté b (cm)','20'],['H','Hauteur : du dessus de la semelle à la longrine (m)','0.8'],['nb','Nombre de barres','4'],['d','Diamètre des barres','12',HA],['ret','Retour (crosse) dans la semelle (cm)','30'],['att','Attentes au-dessus pour le poteau (cm)','60'],['cd','Cadres','6',HA],['ce','Espacement des cadres (cm)','15']]},
  poteaux:{ic:'🏛️',nom:'Poteaux',f:[['n','Nombre de poteaux','8'],['a','Section : côté a (cm)','20'],['b','Section : côté b (cm)','20'],['H','Hauteur (m)','3'],['nb','Nombre de barres','4'],['d','Diamètre des barres','12',HA],['cd','Cadres','6',HA],['ce','Espacement des cadres (cm)','15']]},
  poutres:{ic:'➖',nom:'Longrines, chaînages ou poutres',f:[['k','Élément','chainage',[['longrine','Longrines'],['chainage','Chaînages'],['poutre','Poutres']]],['ml','Longueur totale (m)','30'],['b','Largeur (cm)','20'],['h','Hauteur (cm)','30'],['nb','Nombre de barres','4'],['d','Diamètre des barres','10',HA],['cd','Cadres','6',HA],['ce','Espacement des cadres (cm)','20']]},
  dalle:{ic:'⬛',nom:'Dalle pleine en béton armé',f:[['S','Surface (m²)','50'],['ep','Épaisseur (cm)','15'],['d','Aciers','10',HA],['e','Espacement des aciers (cm)','15'],['nap','Nappes d\'aciers','1',[['1','1 nappe (en bas)'],['2','2 nappes (haut et bas)']]],['mois','Location des étais (mois)','1']]},
  murs:{ic:'🧱',nom:'Murs (élévation ou soubassement)',f:[['ml','Longueur totale des murs (m)','30'],['H','Hauteur (m)','3'],['pp','Parpaing','pp-15c',()=>PPLIST()],['bour','Parpaings bourrés (trous remplis)','non',[['non','Non'],['beton','Oui, au béton (gravier 5/15)'],['mortier','Oui, au mortier']]],['bDos','Dosage du remplissage (kg/m³)','250'],['ded','Ouvertures à déduire (m²)','0']]},
  enduit:{ic:'🪣',nom:'Enduit (crépissage)',f:[['S','Surface à enduire (m²)','100'],['face','Type','int',[['int','Intérieur'],['ext','Extérieur (façade)']]],['ep','Épaisseur (cm)','']]},
  dallage:{ic:'▭',nom:'Dallage de sol',f:[['S','Surface (m²)','50'],['ep','Épaisseur du béton (cm)','10'],['her','Hérisson de pierres (cm, 0 = sans)','20'],['poly','Film polyane anti-humidité','1',[['1','Oui'],['0','Non']]],['tr','Treillis soudé','0',[['0','Non'],['1','Oui']]]]},
  chape:{ic:'▬',nom:'Chape',f:[['S','Surface (m²)','50'],['ep','Épaisseur (cm)','']]},
  carrelage:{ic:'🔲',nom:'Carrelage / faïence',f:[['S','Surface (m²)','30'],['ref','Carreau','rv-6060',CARR],['pl','Plinthes (m, 0 = sans)','0']]},
  terrass:{ic:'⛏️',nom:'Fouilles et remblai',f:[['ft','Type de fouille','tranchee',[['tranchee','Tranchées (rigoles)'],['puits','Puits (fouilles isolées)'],['masse','En masse (décapage, sous-sol)'],['vol','Volume déjà connu']]],['nf','Nombre (puits)','1'],['L','Longueur (m)','20'],['lt','Largeur (m)','0.6'],['pf','Profondeur (m)','0.8'],['V','Volume (m³) si connu',''],['R','Volume de remblai (m³, 0 = sans)','0'],['lat','Latérite d\'apport','0',[['0','Non (terre du site)'],['1','Oui, latérite livrée']]]]}};
const XR={propEp:['Épaisseur du béton de propreté','cm',5],ancrage:['Ancrage / attente des barres en pied','cm',60],etaiEsp:['Espacement des étais','m',1.2],etaiM2:['Étais par m² de dalle','',1],
  foison:['Foisonnement du hérisson','%',15],blocage:['Gravier de blocage du hérisson','cm',3],polyRec:['Recouvrements du polyane','%',15],trRec:['Recouvrements du treillis','%',20],latFois:['Compactage de la latérite','%',25],
  mortM2:['Mortier de pose par m² de mur','m³ / m²',null],dosEnd:["Dosage de l'enduit",'kg / m³',null],dosDal:['Dosage du béton de dallage','kg / m³',null]};
const RLAB=(()=>{const o={};REGLES.forEach(g=>g.a.forEach(([k,l,u])=>o[k]=[l,u]));Object.entries(XR).forEach(([k,[l,u]])=>o[k]=[l,u]);return o})();
const BETK=['dosBA','sableBet','gravBet','recouv','enrob','ligat','coffReemploi'];
const PK={semelles:['dosProp','propEp','dosBA','sableBet','gravBet','recouv','enrob','ligat'],filantes:['dosProp','propEp','dosBA','sableBet','gravBet','recouv','enrob','ligat'],amorces:BETK,poteaux:[...BETK,'ancrage'],poutres:[...BETK,'etaiEsp'],dalle:[...BETK,'etaiM2'],
  murs:['ppM2','casse','mortM2','dosPose','sableMor'],enduit:['dosEnd','pertEnd','sableMor','hydro'],dallage:['dosDal','sableBet','gravBet','foison','blocage','polyRec','trRec'],chape:['dosChape','sableMor'],carrelage:['pertCarr','colle','joint'],terrass:['latFois']};
function RDEF(t,o){const R={...RG()};Object.entries(XR).forEach(([k,[,,d]])=>R[k]=d);const pp=(o&&o.pp)||'pp-15c',ep=ppDims(pp).ep;
  R.mortM2=R['mort'+ep];R.dosEnd=o&&o.face==='ext'?R.dosEndExt:R.dosEndInt;R.dosDal=R.dosTrot;return R}
function ROUV(o){const R=RDEF(o.t,o);(PK[o.t]||[]).forEach(k=>{const v=o['r_'+k];if(v!=null&&String(v).trim()!==''&&isFinite(num(v)))R[k]=num(v)});return R}
const MO_UNIT={semelles:'mo-ba',amorces:'mo-ba',filantes:'mo-ba',poteaux:'mo-ba',poutres:'mo-ba',dalle:'mo-ba',murs:'mo-maconnerie',enduit:'mo-enduit',dallage:'mo-dallage',chape:'mo-chape',carrelage:'mo-carrelage',terrass:'mo-fouilles'};
function ouvCard(o){const D=OUV[o.t];if(!D)return'';
  const fld=([k,l,def,opts])=>{const v=o[k]!=null?o[k]:def,op=typeof opts==='function'?opts():opts;return `<label class="f"><span>${l}</span>${op?`<select data-k="${k}">${op.map(([a,b])=>`<option value="${a}" ${String(v)===a?'selected':''}>${esc(b)}</option>`).join('')}</select>`:`<input data-k="${k}" inputmode="decimal" value="${esc(v)}" ${k==='ep'&&!v?`placeholder="${o.t==='chape'?RG().epChape:'auto'}"`:''}>`}</label>`};
  const m=o.mo||'unit';
  return `<div class="ocard pcard" data-t="${o.t}"><div class="row between"><b>${D.ic} ${D.nom}</b><button type="button" class="btn ghost small delb" onclick="this.closest('.ocard').remove();ouvUpd()">×</button></div>
   <input data-k="lib" placeholder="Précision (ex. poteaux du R+1, mur de clôture…)" value="${esc(o.lib||'')}" style="margin:6px 0">
   <div class="grid2">${D.f.map(fld).join('')}</div>
   <div class="grid2"><label class="f"><span>Main-d'œuvre</span><select data-k="mo"><option value="unit" ${m==='unit'?'selected':''}>Tarif unitaire (catalogue)</option><option value="forfait" ${m==='forfait'?'selected':''}>Forfait</option><option value="pct" ${m==='pct'?'selected':''}>% des fournitures</option><option value="non" ${m==='non'?'selected':''}>Sans main-d'œuvre</option></select></label>
   <label class="f"><span>Montant / % / tarif</span><input data-k="mv" inputmode="decimal" value="${esc(o.mv||'')}" placeholder="${esc(m==='unit'?FN(prixOf(MO_UNIT[o.t]))+' / '+art(MO_UNIT[o.t]).unite:'')}"></label></div>
   ${regBlock(o)}<div class="sm mute ores"></div></div>`}
function regBlock(o){const K=PK[o.t]||[];if(!K.length)return'';const D=RDEF(o.t,o),nm=K.filter(k=>o['r_'+k]!=null&&String(o['r_'+k]).trim()!=='').length;
  return `<details class="oreg"${nm?' open':''}><summary>⚙️ Réglages de calcul de cet ouvrage${nm?` <span class="pst warn">(${nm} modifié${nm>1?'s':''})</span>`:''}</summary>
   <div class="sm mute" style="margin:4px 0 6px">Vide = valeur des Règles de calcul (affichée en gris). Ce que tu saisis ici ne vaut que pour cet ouvrage.</div>
   <div class="grid2">${K.map(k=>`<label class="f"><span>${esc(RLAB[k][0])}${RLAB[k][1]?' ('+esc(RLAB[k][1])+')':''}</span><input data-k="r_${k}" inputmode="decimal" value="${esc(o['r_'+k]??'')}" placeholder="${esc(N(D[k],3))}"></label>`).join('')}</div></details>`}
function readOuvr(f){return [...f.querySelectorAll('.ocard')].map(c=>{const o={t:c.dataset.t};c.querySelectorAll('[data-k]').forEach(i=>o[i.dataset.k]=i.value);return o})}
function readG(f){const g={};['cimBA','cimMac','sabBet','gravBet','sabMac','sabEnd','voy','bet','vib','imprevus','acompte'].forEach(k=>{const e=f.elements[k];if(e)g[k]=e.value});g.tva=f.elements.tva&&f.elements.tva.checked;return g}
function genOuvrages(list,g){
  let R=RG(),rc=1+R.recouv/100,cs=1+R.casse/100,enr=R.enrob/100;const lots=[];let cur,kgF=0;
  const add=(type,ref,q,note,pu)=>{if(!(q>0))return;const a=art(ref);if(!a)return;if(/^gr-(gravier|tout|sable)/.test(ref)&&/^t/i.test(a.unite)){q*=R.densGrav;note=(note?note+' ':'')+`× ${N(R.densGrav)} t/m³`}const k=type+ref+(note||'');if(cur._m[k]){cur._m[k].qte+=q;return}
    const ln={id:uid(),type,ref,designation:a.nom+(note?' — '+note:''),unite:a.unite,qte:q,pu:pu!=null?pu:a.prix};cur._m[k]=ln;cur.lignes.push(ln)};
  const M=(r,q,n)=>add('mat',r,q,n),W=(r,q,n,pu)=>add('mo',r,q,n,pu);
  const cimBA=g.cimBA||'cim-robust',cimMac=g.cimMac||'cim-multix';let Vbet=0;
  const SB=g.sabBet||'gr-sable-sanaga',GB=g.gravBet||'mixte',SM=g.sabMac||'gr-sable',SE=g.sabEnd||'gr-sable-fin';
  const grav=(V,n)=>{if(GB==='mixte'){M('gr-gravier-515',V/2,`${n} (moitié 5/15)`);M('gr-gravier-1525',V/2,`${n} (moitié 15/25)`)}else M(GB,V,n)};
  const beton=(V,dos,ba,lab)=>{if(V<=0)return;mtp(cur,{k:'b',d:lab,V,dos,sb:R.sableBet,gb:R.gravBet});Vbet+=V;const n=`${lab} : ${N(V,2)} m³`;M(ba?cimBA:cimMac,V*dos/50,`${n} × ${dos} kg/m³`);M(SB,V*R.sableBet,`${n} × ${N(R.sableBet)} m³/m³`);grav(V*R.gravBet,`${n} × ${N(R.gravBet)} m³/m³`)};
  const mortier=(V,dos,lab,sr)=>{if(V<=0)return;mtp(cur,{k:'m',d:lab,V,dos,sm:R.sableMor});const n=`${lab} = ${N(V,2)} m³ de mortier`;M(cimMac,V*dos/50,`${n} × ${dos} kg/m³`);M(sr||SM,V*R.sableMor,`${n} × ${N(R.sableMor)} m³/m³`)};
  const fil=(nb,d,ml,elem)=>{if(!(ml>0)||!nb)return;mtp(cur,{k:'f',d:elem,nb,dia:d,ml,rc});M('fer-'+d,nb*ml*rc/R.lBarre,`${elem} : ${nb} HA${d} × ${N(ml,1)} m (+${R.recouv} % recouvrements)`);kgF+=nb*ml*rc*BARW[d]};
  const cad=(d,e,ml,b,h,elem,nEl=1)=>{if(!(ml>0))return;const n=(Math.ceil(ml/e)+1)*nEl,len=2*(b+h-4*enr)+0.12;mtp(cur,{k:'c',d:elem,dia:d,e,ml,n,len,b,h,nEl});M('fer-'+d,n*len*1.05/R.lBarre,`${elem} : ${n} cadres HA${d} tous les ${Math.round(e*100)} cm`);kgF+=n*len*1.05*BARW[d]};
  const barres=(d,n,len,elem)=>{if(!(n>0))return;mtp(cur,{k:'r',d:elem,dia:d,n,len});M('fer-'+d,n*len*1.05/R.lBarre,`${elem} : ${n} barres HA${d} de ${N(len,2)} m`);kgF+=n*len*1.05*BARW[d]};
  const ferFin=()=>{if(kgF>0)M('fer-fil',kgF*R.ligat/100,`ligatures (${N(kgF,0)} kg d'acier × ${R.ligat} %)`);kgF=0};
  const coff=(m2,lab)=>{if(!(m2>0))return;M('bo-planche',m2/R.coffReemploi*1.1/1,`coffrage ${lab} ${N(m2,1)} m² ÷ ${R.coffReemploi} réemplois (planche = 1 m²)`);M('bo-chevron68',m2*0.12,'raidisseurs');M('fer-pointes',m2*0.15,'coffrage')};
  list.forEach((o,i)=>{const D=OUV[o.t];if(!D)return;const v=k=>num(o[k]);R=ROUV(o);rc=1+R.recouv/100;cs=1+R.casse/100;enr=R.enrob/100;
    const nom0=o.t==='poutres'?({longrine:'Longrines',chainage:'Chaînages',poutre:'Poutres'}[o.k]||D.nom):D.nom;cur={id:uid(),nom:nom0+(o.lib?' – '+o.lib:''),note:'',lignes:[],_m:{}};lots.push(cur);let qMO=0,uMO='';
    if(o.t==='semelles'){const n=v('n'),L=v('L'),l=v('l'),h=v('h')||0.3,pf=v('pf'),d=o.d||'10',e=(v('e')||15)/100;
      const su=2*(o.sur!==''&&o.sur!=null?v('sur'):10)/100,Vf=n*(L+su)*(l+su)*pf;if(Vf)W('mo-fouilles',Vf,`${n} puits × ${N(L+su)} × ${N(l+su)} × ${N(pf)} m (semelle + ${N(su*50)} cm de chaque côté)`);
      beton(n*L*l*R.propEp/100,R.dosProp,false,`béton de propreté ${N(R.propEp)} cm`);W('mo-beton',n*L*l*R.propEp/100,'béton de propreté');
      beton(n*L*l*h,R.dosBA,true,`${n} semelles ${N(L)} × ${N(l)} × ${N(h)} m`);
      barres(d,n*((Math.ceil((l-2*enr)/e)+1)+(Math.ceil((L-2*enr)/e)+1)),Math.max(L,l)-2*enr+0.2,`nappe ${N(L)} × ${N(l)} m, deux sens`);ferFin();qMO=n*L*l*h;uMO='m³'}
    if(o.t==='filantes'){const ml=v('ml'),lt=v('lt'),pf=v('pf'),sb=v('sb'),sh=v('sh');
      if(ml*lt*pf)W('mo-fouilles',ml*lt*pf,`tranchées ${N(ml)} m × ${N(lt)} m de large × ${N(pf)} m de profondeur`);
      beton(ml*lt*R.propEp/100,R.dosProp,false,`béton de propreté ${N(ml)} m × ${N(lt)} m × ${N(R.propEp)} cm`);W('mo-beton',ml*lt*R.propEp/100,'béton de propreté');
      beton(ml*sb*sh,R.dosBA,true,`semelles ${N(ml)} m × ${N(sb)} × ${N(sh)} m`);fil(v('nb'),o.d||'10',ml,'semelles filantes');
      const nt=Math.ceil(ml/((v('te')||20)/100))+1;barres(o.td||'8',nt,sb-2*enr+0.2,`transversaux tous les ${v('te')||20} cm`);ferFin();qMO=ml*sb*sh;
      cur.note=`Tranchée ${N(lt)} m × ${N(pf)} m ; semelle ${N(sb)} × ${N(sh)} m. Le remblai autour du soubassement se chiffre dans « Fouilles et remblai ».`}
    if(o.t==='amorces'){const n=v('n'),a=v('a')/100,b=v('b')/100,H=v('H'),ret=v('ret')/100,att=v('att')/100,V=n*a*b*H;
      beton(V,R.dosBA,true,`${n} amorces ${v('a')}×${v('b')} × ${N(H)} m`);
      barres(o.d||'12',v('nb')*n,H+ret+att,`${v('nb')} barres par amorce = ${N(H)} m + ${N(ret*100)} cm de retour + ${N(att*100)} cm d'attente`);
      cad(o.cd||'6',(v('ce')||15)/100,H,a,b,'amorces',n);ferFin();coff(2*(a+b)*H*n,'des amorces');qMO=V;
      cur.note=`Les attentes de ${N(att*100)} cm servent au recouvrement avec les barres des poteaux de l'élévation.`}
    if(o.t==='poteaux'){const n=v('n'),a=v('a')/100,b=v('b')/100,H=v('H'),V=n*a*b*H;beton(V,R.dosBA,true,`${n} poteaux ${v('a')}×${v('b')} × ${N(H)} m`);
      fil(v('nb')*n,o.d||'12',H+R.ancrage/100,`poteaux (hauteur + ${N(R.ancrage)} cm d'ancrage)`);cad(o.cd||'6',(v('ce')||15)/100,H,a,b,'poteaux',n);ferFin();coff(2*(a+b)*H*n,'des poteaux');qMO=V}
    if(o.t==='poutres'){const lab={longrine:'longrines',chainage:'chaînages',poutre:'poutres'}[o.k]||'poutres',ml=v('ml'),b=v('b')/100,h=v('h')/100,V=ml*b*h;
      beton(V,R.dosBA,true,`${lab} ${N(ml)} m × ${v('b')}×${v('h')}`);fil(v('nb'),o.d||'10',ml,lab);cad(o.cd||'6',(v('ce')||20)/100,ml,b,h,lab);ferFin();
      coff(ml*(2*h+(o.k==='poutre'?b:0)),'des '+lab);if(o.k==='poutre')M('bo-etai',Math.ceil(ml/R.etaiEsp),`étaiement tous les ${N(R.etaiEsp)} m (location 1 mois)`);qMO=V}
    if(o.t==='dalle'){const S=v('S'),ep=(v('ep')||15)/100,d=o.d||'10',e=(v('e')||15)/100,nap=v('nap')||1,V=S*ep;beton(V,R.dosBA,true,`dalle ${N(S)} m² × ${N(ep*100)} cm`);
      const ml=nap*2*S/e*1.05*rc;M('fer-'+d,ml/R.lBarre,`${nap} nappe${nap>1?'s':''}, deux sens, tous les ${Math.round(e*100)} cm : ${N(ml,0)} m`);kgF+=ml*BARW[d];
      if(nap>1)M('fer-8',S/1*1.2/R.lBarre,'chaises d\'écartement des nappes');ferFin();
      M('bo-cp15',S/2.98*1.1/R.coffReemploi,`coffrage de fond ${N(S)} m² (feuille 2,98 m², ${R.coffReemploi} réemplois)`);M('bo-chevron68',S*0.8/R.coffReemploi,'solives et lisses');
      M('bo-etai',Math.ceil(S*R.etaiM2)*Math.max(1,v('mois')||1),`${N(R.etaiM2)} étai par m² × ${Math.max(1,v('mois')||1)} mois`);M('fer-pointes',S*0.1,'coffrage');M('ch-vibreur',Math.ceil(V/15),`vibrage (${N(V,1)} m³)`);qMO=V}
    if(o.t==='murs'){const A=Math.max(0,v('ml')*v('H')-v('ded')),pp=o.pp||'pp-15c',c=ppCalc(pp,A,R),ep=c.ep;
      mtp(cur,{k:'p',d:'murs',steps:[`${N(v('ml'))} ml × ${N(v('H'))} m = ${N(v('ml')*v('H'),2)} m²`,`− ouvertures ${N(v('ded'))} m²`,`= ${N(A,2)} m² de maçonnerie`,...c.steps],S:A,ep,nb:c.nb,Vm:c.Vm});
      M(pp,c.nb,`${N(A)} m² ÷ ${N(c.s,4)} m² (${c.L}×${c.H} cm + joint ${N(c.j*100)} cm) + ${R.casse} % casse`);mortier(c.Vm,R.dosPose,`pose : ${N(A)} m² × ${N(ep/100)} m × ${N(c.part*100,1)} % de joints + ${R.pertMor??15} % de pertes`);qMO=A;uMO='m²';
      if(o.bour&&o.bour!=='non'&&c.creux){const vb=A*ep/100*(R.videPp??40)/100,dB=v('bDos')||250,n=`bourrage ${N(A)} m² × ${N(ep/100)} m × ${R.videPp??40} % de vides = ${N(vb,2)} m³`;if(o.bour==='mortier')mortier(vb,dB,n);else{M(cimMac,vb*dB/50,`${n} × ${dB} kg/m³`);M(SB,vb*R.sableBet,n);M('gr-gravier-515',vb*R.gravBet,n)}}
      cur.note=`Surface : ${N(v('ml'))} m × ${N(v('H'))} m${v('ded')?' − '+N(v('ded'))+' m² d\'ouvertures':''} = ${N(A)} m². Les poteaux et chaînages se chiffrent dans leurs propres ouvrages.`}
    if(o.t==='enduit'){const S=v('S'),ext=o.face==='ext',ep=v('ep')||(ext?R.epEndExt:R.epEndInt),V=S*ep/100*(1+R.pertEnd/100);
      mortier(V,R.dosEnd,`${N(S)} m² × ${N(ep)} cm (+${R.pertEnd} % pertes)`,SE);if(ext)M('et-hydrofuge',V*R.dosEnd/50*R.hydro,`${N(R.hydro)} L par sac`);qMO=S;uMO='m²'}
    if(o.t==='dallage'){const S=v('S'),ep=(v('ep')||10)/100,her=v('her')/100;
      if(her>0){M('gr-moellons',S*her*(1+R.foison/100),`hérisson ${N(S)} m² × ${N(her*100)} cm (+${N(R.foison)} % foisonnement)`);M('gr-gravier-2540',S*R.blocage/100,`blocage du hérisson ${N(R.blocage)} cm`)}
      if(o.poly!=='0')M('et-polyane',S*(1+R.polyRec/100),`+${N(R.polyRec)} % recouvrements`);if(o.tr==='1')M('fer-treillis',S*(1+R.trRec/100)/14.4,`panneaux de 14,4 m² (+${N(R.trRec)} % recouvrements)`);
      beton(S*ep,R.dosDal,false,`dallage ${N(S)} m² × ${N(ep*100)} cm`);qMO=S;uMO='m²'}
    if(o.t==='chape'){const S=v('S'),ep=v('ep')||R.epChape;mortier(S*ep/100,R.dosChape,`${N(S)} m² × ${N(ep)} cm`);qMO=S;uMO='m²'}
    if(o.t==='carrelage'){const S=v('S');M(o.ref||'rv-6060',S*(1+R.pertCarr/100),`${N(S)} m² + ${R.pertCarr} % coupes`);M('rv-colle',S*R.colle/25,`${R.colle} kg/m²`);M('rv-joint',S*R.joint/5,`${R.joint} kg/m²`);M('rv-croisillons',Math.ceil(S/10),'1 sachet / 10 m²');
      if(v('pl')){M('rv-plinthe',v('pl')*1.05,'+5 % coupes');}qMO=S+v('pl')*0.1;uMO='m²'}
    if(o.t==='terrass'){const ft=o.ft||'vol',nf=ft==='puits'?Math.max(1,v('nf')):1,Vc=ft==='vol'?v('V'):(v('V')||nf*v('L')*v('lt')*v('pf'));
      W('mo-fouilles',Vc,ft==='vol'?'volume indiqué':v('V')?'volume indiqué':`${ft==='puits'?nf+' puits × ':ft==='masse'?'en masse ':'tranchées '}${N(v('L'))} m × ${N(v('lt'))} m × ${N(v('pf'))} m de profondeur`);if(v('R')){W('mo-remblai',v('R'));if(o.lat==='1')M('gr-laterite',v('R')*(1+R.latFois/100),`+${N(R.latFois)} % compactage`)}qMO=0}
    const mm=o.mo||'unit',mv=num(o.mv),ref=MO_UNIT[o.t];
    if(mm==='unit'&&qMO>0)W(ref,qMO,o.t==='carrelage'&&v('pl')?`dont plinthes ${N(v('pl'))} m`:'',mv||undefined);
    if(mm==='forfait'&&mv){cur.lignes=cur.lignes.filter(z=>z.type!=='mo');cur.lignes.push({id:uid(),type:'mo',ref:'',designation:`Main-d'œuvre : ${D.nom.toLowerCase()} (forfait)`,unite:'forfait',qte:1,pu:mv})}
    if(mm==='pct'&&mv){cur.lignes=cur.lignes.filter(z=>z.type!=='mo');cur.lignes.push({id:uid(),type:'mo',ref:'',designation:`Main-d'œuvre (${N(mv)} % des fournitures)`,unite:'%',qte:mv,pct:mv,pu:0})}
    if(mm==='non')cur.lignes=cur.lignes.filter(z=>z.type!=='mo')});
  if(num(g.voy)||num(g.bet)||num(g.vib)){cur={id:uid(),nom:'Matériel et transport',note:'',lignes:[],_m:{}};lots.push(cur);M('ch-transport',num(g.voy),'livraison des matériaux');M('ch-betonniere',num(g.bet));M('ch-vibreur',num(g.vib))}
  const disc=new Set(['pièce','sac','barre','feuille','rouleau','seau','pot','panneau','plaque','sachet','forfait','point','voyage','mois','jour','L']);
  lots.forEach(x=>{x.lignes.forEach(ln=>{if(ln.pct!=null)return;ln.qte=disc.has(ln.unite)?Math.ceil(ln.qte-1e-9):Math.ceil(ln.qte*10-1e-9)/10});delete x._m});
  return {lots:lots.filter(x=>x.lignes.length),Vbet};
}
function ouvUpd(){const f=$('#frm');if(!f)return;const list=readOuvr(f),g=readG(f);
  f.querySelectorAll('.ocard').forEach((c,i)=>{const r=genOuvrages([list[i]],{}),t=r.lots[0]?totDevis({lots:r.lots}):null;const el=c.querySelector('.ores');if(el)el.innerHTML=t?`Fournitures ${F(t.mat)} · main-d'œuvre ${F(t.mo)} · <b>${F(t.st)}</b>`:'Renseigne les dimensions.'});
  const r=genOuvrages(list,g),t=totDevis({lots:r.lots,imprevus:g.imprevus,tva:g.tva});const el=$('#ouvT');
  if(el)el.innerHTML=list.length?`<div class="res"><div class="r"><span>Fournitures</span><b>${F(t.mat)}</b></div><div class="r"><span>Main-d'œuvre</span><b>${F(t.mo)}</b></div>${t.imp?`<div class="r"><span>Imprévus ${N(num(g.imprevus))} %</span><b>${F(t.imp)}</b></div>`:''}${t.tva?`<div class="r"><span>TVA</span><b>${F(t.tva)}</b></div>`:''}<div class="r big"><span>Total</span><b>${F(t.ttc)}</b></div>${r.Vbet?`<div class="r sm"><span>Béton à couler</span><b>${N(r.Vbet,2)} m³</b></div>`:''}</div>`:'<div class="sm mute">Ajoute au moins un ouvrage.</div>'}
function ouvAdd(t){$('#ouvs').insertAdjacentHTML('beforeend',ouvCard({t}));ouvUpd()}
function formOuvrages(did){
  const d=did?S.devis.find(x=>x.id===did):null,p=(d&&d.ouv)||{list:[],g:{}},ch=S.chantiers.find(c=>c.id===ui.cid)||{},g=p.g||{};
  const c42=CIMENTS.filter(a=>!a[1].includes('32.5')&&!a[0].includes('lion')).map(a=>[a[0],a[1].replace(' (sac 50 kg)','')]),c32=CIMENTS.filter(a=>a[1].includes('32.5')).map(a=>[a[0],a[1].replace(' (sac 50 kg)','')]);
  openForm({title:'🧱 Devis par ouvrage',submit:d?'Recalculer le devis':'Créer le devis',values:{cimBA:'cim-robust',cimMac:'cim-multix',sabBet:'gr-sable-sanaga',gravBet:'mixte',sabMac:'gr-sable',sabEnd:'gr-sable-fin',imprevus:5,acompte:50,...g},
    fields:[{type:'html',html:`<div class="banner">Ajoute chaque partie du bâtiment à réaliser. Les matériaux et la main-d'œuvre sont calculés à partir des dimensions et des <b>Règles de calcul</b>. Tu pourras ajuster chaque ligne ensuite.</div>
      <div id="ouvs">${(p.list.length?p.list:[]).map(ouvCard).join('')}</div>
      <div class="f"><span class="lbl">Ajouter un ouvrage</span><div class="ogrid">${Object.entries(OUV).map(([k,o])=>`<button type="button" class="btn sec small" onclick="ouvAdd('${k}')">${o.ic} ${o.nom}</button>`).join('')}</div></div>`},
      {type:'html',html:'<div class="subh">Ciment, matériel et prix</div>'},
      {k:'cimBA',label:'Ciment du béton armé',type:'select',opts:c42},{k:'cimMac',label:'Ciment des mortiers, enduits et dallages',type:'select',opts:c32},
      {k:'sabBet',label:'Sable du béton',type:'select',opts:SAB},{k:'gravBet',label:'Gravier du béton',type:'select',opts:GRAV},{k:'sabMac',label:'Sable des mortiers (pose des parpaings, chapes)',type:'select',opts:SAB},{k:'sabEnd',label:'Sable des enduits (crépissage)',type:'select',opts:SAB},
      {k:'voy',label:'Transport des matériaux (voyages)',type:'number'},{k:'bet',label:'Location bétonnière (jours)',type:'number'},{k:'vib',label:'Location vibreur en plus (jours)',type:'number'},
      {k:'imprevus',label:'Imprévus (%)',type:'number'},{k:'acompte',label:'Acompte demandé (%)',type:'number'},{k:'tva',label:'Appliquer la TVA (19,25 %)',type:'checkbox'},
      {type:'html',html:'<div id="ouvT"></div>'}],
    collect:f=>({list:readOuvr(f),g:readG(f)}),
    onSave:async o=>{if(!o.list.length){toast('Ajoute au moins un ouvrage.');return}const r=genOuvrages(o.list,o.g);
      const noms=r.lots.filter(x=>x.nom!=='Matériel et transport').map(x=>x.nom.split(' – ')[0].toLowerCase());let objet='Travaux : '+noms.join(', ');if(objet.length>85)objet=`Travaux : ${noms.slice(0,3).join(', ')}… (${noms.length} ouvrages)`;
      const base=d||{chantierId:ui.cid,numero:nextNum('devis','DEV'),date:today(),validite:30,statut:'brouillon',remise:0,tauxTVA:19.25,
        conditions:"Devis valable 30 jours. Acompte à la commande, solde à la fin des travaux.\nQuantités calculées à partir des dimensions relevées ; toute modification des dimensions ou travail supplémentaire fera l'objet d'un avenant.\nPrix établis sur la base des prix du marché de Douala à la date du devis ; ciment et fer à béton aux prix homologués en vigueur.\nTravaux exécutés selon les règles de l'art."};
      const id=await save('devis',{...base,objet:d&&d.objet?d.objet:objet,tva:!!o.g.tva,imprevus:num(o.g.imprevus),acompte:num(o.g.acompte)||50,lots:r.lots,ouv:o});
      ui.tab='devis';ui.devisId=id;render();toast(d?'Devis recalculé':'Devis créé')}});
  setTimeout(()=>{const f=$('#frm');if(!f)return;f.addEventListener('input',ouvUpd);f.addEventListener('change',e=>{if(['mo','pp','face'].includes(e.target.dataset.k)){const c=e.target.closest('.ocard'),o=readOuvr(f)[[...f.querySelectorAll('.ocard')].indexOf(c)];const ix=[...f.querySelectorAll('.ocard')].indexOf(c),op=c.querySelector('.oreg')&&c.querySelector('.oreg').open;c.outerHTML=ouvCard(o);const nc=f.querySelectorAll('.ocard')[ix],dd=nc&&nc.querySelector('.oreg');if(dd&&op)dd.open=true}ouvUpd()});ouvUpd()},30);
}

/* ----- réglages de calcul propres à un devis de l'assistant ----- */
function formRegDevis(did){const d=S.devis.find(x=>x.id===did);if(!d||!d.params)return;const ov=d.params.reg||{},G=RG();
  const groups=REGLES.filter(g=>g.id!=='etudes'||true);
  openForm({title:'⚙️ Détails et réglages de ce devis',submit:'Recalculer le devis',
    fields:[{type:'html',html:`<div class="banner">Ces réglages ne valent que pour <b>${esc(d.numero)}</b>. Vide = valeur des Règles de calcul (en gris). <br>⚠️ Le recalcul refait toutes les lignes : les modifications faites à la main sur les lignes seront remplacées.</div><div class="subh">Détails par étape</div>${detHTML(d.params,'data-d')}<div class="subh">Règles de calcul</div>
      ${groups.map(g=>`<details class="oreg" ${g.a.some(([k])=>ov[k]!=null)?'open':''}><summary>${esc(g.nom)}${g.a.filter(([k])=>ov[k]!=null).length?` <span class="pst warn">(${g.a.filter(([k])=>ov[k]!=null).length} modifié(s))</span>`:''}</summary><div class="grid2" style="margin-top:6px">${g.a.map(([k,l,u])=>`<label class="f"><span>${esc(l)}${u?' ('+esc(u)+')':''}</span><input data-r="${k}" inputmode="decimal" value="${esc(ov[k]??'')}" placeholder="${esc(N(G[k],3))}"></label>`).join('')}</div></details>`).join('')}`}],
    collect:f=>{const reg={},dv={};f.querySelectorAll('[data-d]').forEach(i=>dv[i.dataset.d]=i.value.trim());f.querySelectorAll('[data-r]').forEach(i=>{if(i.value.trim()!==''&&isFinite(num(i.value)))reg[i.dataset.r]=num(i.value)});return{reg,dv}},
    onSave:async o=>{const params={...d.params,...o.dv,reg:o.reg};const lots=genDevis(params);await save('devis',{...d,params,lots});ui.open={};render();toast('Devis recalculé avec ses réglages')}})}
