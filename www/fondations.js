/* ===== Catalogue des fondations types, sols par ville, recommandation ===== */
const FPROF={
 roche:{nom:'Roche / sol rocheux',desc:'Roche saine ou altérée très compacte. Fouilles au marteau-piqueur.'},
 laterite:{nom:'Latérite ferme (terre rouge)',desc:'Sol ferrallitique rouge, compact, dur à creuser. Bon sol courant au Cameroun (Yaoundé, Centre, Sud, Est).'},
 latVolc:{nom:'Latérite volcanique (Ouest, Nord-Ouest)',desc:'Sol rouge sur basalte : léger et sensible à l\'eau, glissements possibles sur les fortes pentes.'},
 sableSec:{nom:'Sable sec / sablo-argileux',desc:'Sable ou sable argileux hors d\'eau (plateaux de Douala, glacis du Nord).'},
 sableHum:{nom:'Sable humide',desc:'Sable mouillé en saison des pluies ou avec la nappe proche : risque d\'affouillement.'},
 argile:{nom:'Argile (gonflante)',desc:'Argile qui gonfle à la pluie et se fend en saison sèche (vertisols « karal » du Nord, bas de pente).'},
 remblai:{nom:'Remblai / terrain rapporté',desc:'Terre ajoutée, ancien trou comblé, déchets : on fonde sur le sol ferme en dessous.'},
 vase:{nom:'Vase / marécage / mangrove',desc:'Sol mou gorgé d\'eau (bas-fonds, bords du Wouri, mangroves).'}};
const FNIV=[['0','Plain-pied'],['1','R+1'],['2','R+2 et plus']];
const FTYPES=[['isolees','Semelles isolées + soubassement'],['mixte','Isolées + filante sous les murs'],['filantes','Semelles filantes'],['cyclo','Béton cyclopéen'],['radier','Radier général']];
/* champs du catalogue : [clé, libellé, unité, options?] groupés */
const FGRP=[
 ['Généralités',[['type','Fondation conseillée','',FTYPES],['prof','Profondeur des fouilles','m'],['sig','Portance retenue du sol','bar']]],
 ['Semelles isolées (sous poteaux)',[['sem_a','Côté','cm'],['sem_h','Épaisseur','cm'],['sem_d','Aciers (nappe dans les 2 sens) : diamètre','mm'],['sem_e','Aciers : espacement','cm']]],
 ['Amorces de poteaux',[['am_b','Section (côté)','cm'],['am_n','Nombre de barres',''],['am_d','Diamètre des barres','mm'],['am_cd','Cadres : diamètre','mm'],['am_ce','Cadres : espacement','cm']]],
 ['Poteaux (élévation)',[['pot_b','Section (côté)','cm'],['pot_n','Nombre de barres',''],['pot_d','Diamètre des barres','mm'],['pot_cd','Cadres : diamètre','mm'],['pot_ce','Cadres : espacement','cm']]],
 ['Chaînage bas / longrines',[['lon_b','Largeur','cm'],['lon_h','Hauteur','cm'],['lon_n','Nombre de barres',''],['lon_d','Diamètre des barres','mm'],['lon_cd','Cadres : diamètre','mm'],['lon_ce','Cadres : espacement','cm']]],
 ['Semelles filantes (sous murs)',[['fil_B','Largeur','cm'],['fil_h','Épaisseur','cm'],['fil_n','Aciers filants : nombre',''],['fil_d','Aciers filants : diamètre','mm'],['fil_td','Aciers transversaux : diamètre','mm'],['fil_te','Aciers transversaux : espacement','cm']]],
 ['Radier',[['rad_ep','Épaisseur','cm'],['rad_d','Aciers (2 nappes) : diamètre','mm'],['rad_e','Aciers : espacement','cm']]],
 ['Dosages',[['dos_ba','Béton armé des fondations','kg/m³'],['dos_pr','Béton de propreté','kg/m³'],['dos_gb','Gros béton / béton cyclopéen','kg/m³']]]];
/* valeurs de base en plain-pied, par profil */
const FB0={
 roche:   {type:'isolees',prof:0.5,sig:4,  sem_a:60,sem_h:25,sem_d:10,sem_e:15, am_b:15,am_n:4,am_d:10,am_cd:6,am_ce:15, pot_b:15,pot_n:4,pot_d:10,pot_cd:6,pot_ce:15, lon_b:15,lon_h:20,lon_n:4,lon_d:10,lon_cd:6,lon_ce:20, fil_B:40,fil_h:20,fil_n:3,fil_d:10,fil_td:8,fil_te:20, rad_ep:20,rad_d:10,rad_e:15},
 laterite:{type:'isolees',prof:0.8,sig:2,  sem_a:60,sem_h:25,sem_d:10,sem_e:15, am_b:15,am_n:4,am_d:12,am_cd:6,am_ce:15, pot_b:15,pot_n:4,pot_d:10,pot_cd:6,pot_ce:15, lon_b:15,lon_h:20,lon_n:4,lon_d:10,lon_cd:6,lon_ce:20, fil_B:40,fil_h:20,fil_n:3,fil_d:10,fil_td:8,fil_te:20, rad_ep:20,rad_d:10,rad_e:15},
 latVolc: {type:'isolees',prof:1.0,sig:1.5,sem_a:70,sem_h:25,sem_d:10,sem_e:15, am_b:15,am_n:4,am_d:12,am_cd:6,am_ce:15, pot_b:15,pot_n:4,pot_d:10,pot_cd:6,pot_ce:15, lon_b:15,lon_h:25,lon_n:4,lon_d:10,lon_cd:6,lon_ce:20, fil_B:50,fil_h:20,fil_n:3,fil_d:10,fil_td:8,fil_te:20, rad_ep:20,rad_d:10,rad_e:15},
 sableSec:{type:'isolees',prof:1.0,sig:1.5,sem_a:70,sem_h:30,sem_d:10,sem_e:15, am_b:15,am_n:4,am_d:12,am_cd:6,am_ce:15, pot_b:15,pot_n:4,pot_d:10,pot_cd:6,pot_ce:15, lon_b:15,lon_h:25,lon_n:4,lon_d:10,lon_cd:6,lon_ce:20, fil_B:50,fil_h:20,fil_n:3,fil_d:10,fil_td:8,fil_te:20, rad_ep:20,rad_d:10,rad_e:15},
 sableHum:{type:'filantes',prof:1.0,sig:1.2,sem_a:80,sem_h:30,sem_d:12,sem_e:15, am_b:20,am_n:4,am_d:12,am_cd:6,am_ce:15, pot_b:20,pot_n:4,pot_d:12,pot_cd:6,pot_ce:15, lon_b:20,lon_h:30,lon_n:4,lon_d:12,lon_cd:6,lon_ce:15, fil_B:60,fil_h:25,fil_n:4,fil_d:10,fil_td:8,fil_te:15, rad_ep:25,rad_d:10,rad_e:15},
 argile:  {type:'filantes',prof:1.2,sig:1.2,sem_a:80,sem_h:30,sem_d:12,sem_e:15, am_b:20,am_n:4,am_d:12,am_cd:6,am_ce:15, pot_b:20,pot_n:4,pot_d:12,pot_cd:6,pot_ce:15, lon_b:20,lon_h:30,lon_n:4,lon_d:12,lon_cd:6,lon_ce:15, fil_B:60,fil_h:25,fil_n:4,fil_d:12,fil_td:8,fil_te:15, rad_ep:25,rad_d:12,rad_e:15},
 remblai: {type:'isolees',prof:1.5,sig:1.5,sem_a:80,sem_h:30,sem_d:12,sem_e:15, am_b:20,am_n:4,am_d:12,am_cd:6,am_ce:15, pot_b:20,pot_n:4,pot_d:12,pot_cd:6,pot_ce:15, lon_b:20,lon_h:30,lon_n:4,lon_d:12,lon_cd:6,lon_ce:15, fil_B:60,fil_h:25,fil_n:4,fil_d:12,fil_td:8,fil_te:15, rad_ep:25,rad_d:12,rad_e:15},
 vase:    {type:'radier',prof:0.6,sig:0.8, sem_a:100,sem_h:35,sem_d:12,sem_e:12,am_b:20,am_n:4,am_d:14,am_cd:6,am_ce:15, pot_b:20,pot_n:4,pot_d:12,pot_cd:6,pot_ce:15, lon_b:20,lon_h:40,lon_n:6,lon_d:12,lon_cd:8,lon_ce:15, fil_B:80,fil_h:30,fil_n:4,fil_d:12,fil_td:10,fil_te:15, rad_ep:25,rad_d:12,rad_e:15}};
const upD=d=>({6:8,8:10,10:12,12:14,14:16,16:20}[d]||d);
function fDef(pk,nv){const b={...(FB0[pk]||FB0.laterite),dos_ba:350,dos_pr:150,dos_gb:200};nv=+nv||0;if(!nv)return b;const o={...b};
  const T1={laterite:'isolees',roche:'isolees',latVolc:'isolees',sableSec:'isolees',sableHum:'filantes',argile:'mixte',remblai:'isolees',vase:'radier'},T2={laterite:'isolees',roche:'isolees',latVolc:'mixte',sableSec:'filantes',sableHum:'radier',argile:'radier',remblai:'mixte',vase:'radier'};
  o.type=(nv===1?T1:T2)[pk]||b.type;if(pk!=='vase'&&pk!=='roche')o.prof=Math.round((b.prof+0.2*nv)*10)/10;
  o.sem_a=b.sem_a+20*nv;o.sem_h=b.sem_h+5*nv;o.sem_d=nv>=2?upD(upD(b.sem_d)):upD(b.sem_d);
  o.am_b=Math.max(b.am_b,nv>=2?25:20);o.am_n=nv>=2?6:4;o.am_d=Math.max(b.am_d,nv>=2?14:12);o.am_cd=nv>=2?8:6;
  o.pot_b=Math.max(b.pot_b,nv>=2?25:20);o.pot_n=nv>=2?6:4;o.pot_d=Math.max(b.pot_d,12);o.pot_cd=nv>=2?8:6;
  o.lon_b=20;o.lon_h=Math.max(b.lon_h,nv>=2?40:30);o.lon_n=nv>=2?6:4;o.lon_d=Math.max(b.lon_d,12);o.lon_cd=nv>=2?8:6;o.lon_ce=15;
  o.fil_B=b.fil_B+10*nv;o.fil_h=b.fil_h+5*nv;o.fil_n=Math.max(b.fil_n,4);o.fil_d=Math.max(b.fil_d,12);o.fil_td=nv>=2?10:b.fil_td;
  o.rad_ep=b.rad_ep+5*nv;o.rad_d=Math.max(b.rad_d,12);o.rad_e=nv>=2?12:b.rad_e;return o}
function fcat(pk,nv){const k=String(Math.min(2,+nv||0)),d=fDef(pk,k),ov=(((S.config.regles||{}).fcat||{})[pk]||{})[k]||{},o={...d};
  Object.entries(ov).forEach(([f,v])=>{if(v==null||v==='')return;o[f]=f==='type'?v:num(v)});return o}

/* ===== Sols par ville (présomptions indicatives, à confirmer par une étude de sol) ===== */
const SITES=[['plateau','Plateau ou haut de colline'],['versant','Versant (sur la pente)'],['bas','Bas de pente'],['basfond','Bas-fond, bord de rivière, marécage ou mangrove']];
const VILLES={
 douala:{nom:'Douala',reg:'Littoral',txt:'Bassin sédimentaire : alternance de sables argileux et d\'argiles sableuses peu consolidés, parfois sans couche dure sur 25 à 30 m ; nappe souvent proche de la surface ; bas-fonds marécageux et mangroves inondables. Interfluves (Bonapriso, Bali, Akwa, Makepe, Logpom, Kotto, Logbessou, PK…) meilleurs que les bas-fonds (Nylon, Tergal, Nkolmintag, Youpwé, bords du Wouri, Bonabéri bas…).',
   s:{plateau:['sableSec','pluies'],versant:['sableHum','pluies'],bas:['sableHum','nappe'],basfond:['vase','nappe',1]},sig:{plateau:1.2,versant:1.2}},
 yaounde:{nom:'Yaoundé',reg:'Centre',txt:'Sols ferrallitiques rouges (latérite) épais sur socle gneissique sur les collines et plateaux ; bas-fonds hydromorphes à nappe très proche, réputés non constructibles sans précautions.',
   s:{plateau:['laterite','sec'],versant:['laterite','pluies'],bas:['argile','pluies'],basfond:['vase','nappe',1]}},
 ouest:{nom:'Ouest : Bafoussam, Bandjoun, Dschang, Mbouda, Bafang, Bangangté, Foumban',reg:'Ouest',txt:'Latérites sur basaltes et roches volcaniques : sols légers (densité 0,7 à 1), argileux et sensibles à l\'eau ; glissements de terrain observés sur les fortes pentes en saison des pluies (Bafoussam, Dschang, Bafang).',
   s:{plateau:['latVolc','sec'],versant:['latVolc','pluies'],bas:['argile','pluies'],basfond:['vase','nappe',1]}},
 volc:{nom:'Nord-Ouest et Sud-Ouest : Bamenda, Buea, Limbé, Kumba, Nkongsamba',reg:'Ligne volcanique',txt:'Sols volcaniques argileux sur les pentes (glissements à Limbé, Buea, Bamenda) ; sables et nappe proche en bord de mer (Limbé).',
   s:{plateau:['latVolc','sec'],versant:['latVolc','pluies'],bas:['argile','pluies'],basfond:['vase','nappe',1]}},
 cote:{nom:'Côte : Kribi, Édéa, Tiko, Campo',reg:'Littoral / Sud',txt:'Sables côtiers et alluvions ; nappe proche ; zones basses inondables.',
   s:{plateau:['sableSec','pluies'],versant:['sableHum','pluies'],bas:['sableHum','nappe'],basfond:['vase','nappe',1]}},
 sud:{nom:'Sud, Est, Centre : Ebolowa, Sangmélima, Mbalmayo, Bertoua, Bafia, Obala',reg:'Sud / Est / Centre',txt:'Latérite sur socle granito-gneissique sur les collines ; bas-fonds marécageux.',
   s:{plateau:['laterite','sec'],versant:['laterite','pluies'],bas:['argile','pluies'],basfond:['vase','nappe',1]}},
 adamaoua:{nom:'Adamaoua : Ngaoundéré, Meiganga, Tibati',reg:'Adamaoua',txt:'Plateau basaltique et granitique : latérite ferme, roche peu profonde par endroits.',
   s:{plateau:['laterite','sec'],versant:['laterite','sec'],bas:['argile','pluies'],basfond:['vase','nappe',1]}},
 nord:{nom:'Nord et Extrême-Nord : Garoua, Maroua, Kousséri, Kaélé, Mokolo',reg:'Nord',txt:'Plaines à vertisols (argiles noires gonflantes « karal », très plastiques) ; arènes et sables sur les glacis et piémonts ; alluvions inondables le long de la Bénoué et du Logone.',
   s:{plateau:['sableSec','sec'],versant:['sableSec','sec'],bas:['argile','pluies'],basfond:['argile','nappe',1]}}};
function villeProfil(v,site){const V=VILLES[v];if(!V)return null;const st=site&&V.s[site]?site:'plateau',x=V.s[st];return{pk:x[0],eau:x[1],inond:!!x[2],sig:(V.sig||{})[st],nom:V.nom,site:st}}

/* ===== Lecture des réponses ===== */
const NAT2PK={laterite:'laterite',argile:'argile',roche:'roche',remblai:'remblai',vase:'vase'},SOL2NAT={bon:'laterite',argile:'argile',sable:'sable',roche:'roche',remblai:'remblai',marecage:'vase'};
const PK2SOL={roche:'roche',laterite:'bon',latVolc:'bon',sableSec:'sable',sableHum:'sable',argile:'argile',remblai:'remblai',vase:'marecage'};
const FTL={isolees:'Semelles isolées + soubassement en parpaings',mixte:'Semelles isolées + semelle filante sous les murs',filantes:'Semelles filantes sous tous les murs',cyclo:'Béton cyclopéen dans les tranchées',radier:'Radier général (dalle épaisse sous toute la maison)'};
const SUBL={'gr-laterite':'latérite / tout-venant','gr-gravier-2540':'gravier 25/40','gr-sable-carriere':'sable de carrière'};
function recoIn(get){const v=k=>{const x=get(k);return x==null?'':String(x)};const sol=v('sol')||'bon',hu=get('humide'),VP=villeProfil(v('d_ville'),v('d_site'));
  const natU=v('d_solNat')&&v('d_solNat')!=='auto'?v('d_solNat'):'',eauU=v('d_solEau')&&v('d_solEau')!=='auto'?v('d_solEau'):'';let pk,src;
  if(natU){pk=natU==='sable'?null:NAT2PK[natU];src='observation du terrain'}else if(VP){pk=VP.pk;src=`sols connus à ${VP.nom.split(':')[0].trim()}, terrain en ${({plateau:'plateau',versant:'versant',bas:'bas de pente',basfond:'bas-fond'})[VP.site]}`}else{const n=SOL2NAT[sol]||'laterite';pk=n==='sable'?null:NAT2PK[n];src='type de sol de l\'écran 4'}
  const eau=eauU||(VP&&!natU?VP.eau:(sol==='marecage'||natU==='vase'?'nappe':(hu===true||hu==='true'||hu==='on'?'pluies':'sec')));
  if(!pk)pk=eau==='sec'?'sableSec':'sableHum';
  const inond=v('d_solInond')==='oui'||(!v('d_solInond')&&VP&&VP.inond&&!natU)?'oui':'non';
  return{pk,eau,src,ville:VP,bon:num(v('d_solBon'))||null,port:num(v('d_solPort'))||null,vois:v('d_solVoisin')||'non',inond,et:num(v('etages')),
    A:num(v('L'))*num(v('l')),nPot:num(v('poteaux')),siCote:num(v('siCote')),H:num(v('H'))||3,ter:v('toiture')==='terrasse',ftU:v('d_fType')&&v('d_fType')!=='auto'?v('d_fType'):''}}

/* ===== Recommandation : type + traitement du sol + dimensions et ferraillage du catalogue ===== */
function recoFond(q,g){g=g||{};const et=q.et,nv=Math.min(2,et),why=[],trait=[],chk=[];const pk=q.pk,c=fcat(pk,nv);let ft=c.type,prof=c.prof,sub=0,subMat='gr-laterite',gros=0,reh=0,drain=false,pomp=false,geot=false;const b=q.bon,P=q.port;
  why.push(`Profil de sol : ${FPROF[pk].nom} (d'après ${q.src}). ${FPROF[pk].desc}`);
  if(q.ville&&q.ville.sig&&!P)c.sig=Math.min(c.sig,q.ville.sig);
  if(P){c.sig=P;if(P<1)ft='radier';else if(P<1.5)ft=et>=1?'radier':(ft==='isolees'?'filantes':ft);else if(P<2)ft=et>=2&&ft==='isolees'?'mixte':ft;why.push(`Portance mesurée par l'étude de sol : ${N(P)} bar (elle passe avant les présomptions).`)}
  if(pk==='remblai'){const bb=b??1.5;
    if(bb<=1.0){sub=bb;prof=0.8;trait.push(`Enlever les ${N(bb)} m de remblai sous la maison et les remplacer par de la latérite compactée par couches de 20 cm.`)}
    else if(bb<=2.5){prof=bb;gros=Math.round(Math.max(0,bb-0.8)*100)/100;trait.push(`Creuser chaque fouille jusqu'au sol ferme (${N(bb)} m) et remplir le bas de ${N(gros)} m de gros béton avant de couler la semelle.`)}
    else{ft='radier';sub=0.4;subMat='gr-gravier-2540';geot=true;trait.push('Sol ferme trop profond : radier sur une couche de forme de 40 cm de gravier compacté sur géotextile.')}
    if(b==null)why.push('Profondeur du sol ferme inconnue : 1,50 m supposé. Fais un sondage.')}
  if(pk==='vase'){pomp=true;drain=true;geot=true;
    if(b!=null&&b<=1.0){sub=b;subMat='gr-gravier-2540';if(!P)ft=et>=1?'radier':'filantes';trait.push(`Purger les ${N(b)} m de vase et les remplacer par du gravier compacté sur géotextile.`)}
    else{sub=0.4;subMat='gr-gravier-2540';trait.push('Couche de forme de 40 cm de gravier compacté sur géotextile sous la fondation.')}}
  if(pk==='argile'||pk==='latVolc')drain=true;
  if(q.eau==='nappe'&&pk!=='vase'){pomp=true;drain=true;why.push('Eau à moins de 1 m : pompage pendant les fouilles et drain.');if(ft==='isolees'&&!P){ft='filantes';why.push('Avec l\'eau si proche, des semelles filantes sont plus sûres que des semelles isolées.')}}
  else if(q.eau==='pluies')drain=true;
  if(q.vois==='oui'){const up={isolees:'mixte',filantes:'mixte',mixte:'radier',cyclo:'mixte'}[ft];if(up){ft=up;why.push('Fissures chez les voisins : le sol bouge, fondation plus rigide.')}}
  if(q.inond==='oui'){reh=0.5;drain=true;trait.push('Rehausser la plate-forme et le soubassement de 50 cm (terrain inondable).')}
  if(drain)trait.push('Drain autour de la maison.');if(pomp)trait.push('Motopompe pendant les fouilles.');
  /* dimensionnement BAEL 91 mod. 99 sur le type retenu (proposé ou choisi) */
  const ftD=g.ft||q.ftU||ft,A=g.A||q.A,Lw=g.Lw||(A?Math.sqrt(A)*4*1.6:0),nP=g.nPot||q.nPot||(A?Math.max(4,Math.ceil(A/7)):0);let bael=null;
  if(A>0){const B=baelRun(c,{A,Lw,nPot:nP,et,H:g.H||q.H,ter:g.ter??q.ter,sig:c.sig,prof:Math.max(prof,c.prof),amH:Math.max(prof,c.prof)-c.sem_h/100+0.6,siA:q.siCote||0,Arad:(Math.sqrt(A)+1)**2},ftD,true);bael=B.lines}
  if(!P&&et>=2)why.push(`Bâtiment R+${et} : l'étude de sol est obligatoire ; cette proposition est provisoire.`);else if(!P&&['vase','remblai','argile','latVolc','sableHum'].includes(pk))why.push('Une étude de sol est vivement conseillée pour confirmer.');
  if(gros)prof=Math.max(prof,b||prof);
  return{ft,ftD,bael,prof:Math.max(prof,gros?prof:c.prof),sub,subMat,gros,reh,drain,pomp,geot,why,trait,chk,dims:c,pk,solKey:PK2SOL[pk]||'bon'}}

/* ===== Encadré de recommandation (assistant et réglages du devis) ===== */
const DIMKEYS=[['siA','sem_a'],['siH','sem_h',100],['siD','sem_d'],['siE','sem_e'],['amB','am_b'],['amN','am_n'],['amD','am_d'],['amCd','am_cd'],['amCe','am_ce'],['potB','pot_b'],['potNb','pot_n'],['potD','pot_d'],['potCd','pot_cd'],['potCe','pot_ce'],['lonB','lon_b'],['lonH','lon_h'],['lonN','lon_n'],['lonD','lon_d'],['lonCd','lon_cd'],['lonCe','lon_ce'],['fsb','fil_B',100],['fsh','fil_h',100],['flN','fil_n'],['flD','fil_d'],['ftD','fil_td'],['ftE','fil_te'],['radEp','rad_ep'],['radD','rad_d'],['radE','rad_e'],['fDos','dos_ba']];
function dimsTxt(c,ft,siCote){const L=[],sem=siCote?`${siCote} × ${siCote} cm (côté de tes plans, écran 2)`:`${c.sem_a} × ${c.sem_a} × ${c.sem_h} cm`;
  if(ft!=='radier'&&ft!=='filantes'&&ft!=='cyclo')L.push(['Semelles isolées',`${sem}, nappe HA${c.sem_d} tous les ${N(c.sem_e)} cm dans les 2 sens`]);
  if(ft==='filantes'||ft==='mixte')L.push(['Semelles filantes',`${c.fil_B} × ${c.fil_h} cm, ${c.fil_n} HA${c.fil_d} filants, HA${c.fil_td} tous les ${c.fil_te} cm`]);
  if(ft==='cyclo')L.push(['Béton cyclopéen',`tranchée de ${c.fil_B} cm, béton ${c.dos_gb} kg/m³ + 40 % de moellons`]);
  if(ft==='radier')L.push(['Radier',`${c.rad_ep} cm, 2 nappes HA${c.rad_d} tous les ${c.rad_e} cm ; nervures ${c.lon_b} × ${c.lon_h} cm`]);
  if(ft==='isolees'||ft==='mixte')L.push(['Amorces',`${c.am_b} × ${c.am_b} cm, ${c.am_n} HA${c.am_d}, cadres HA${c.am_cd} tous les ${c.am_ce} cm`]);
  L.push(['Poteaux',`${c.pot_b} × ${c.pot_b} cm, ${c.pot_n} HA${c.pot_d}, cadres HA${c.pot_cd} tous les ${c.pot_ce} cm`]);
  if(ft!=='radier')L.push(['Chaînage bas / longrines',`${c.lon_b} × ${c.lon_h} cm, ${c.lon_n} HA${c.lon_d}, cadres HA${c.lon_cd} tous les ${c.lon_ce} cm`]);
  L.push(['Béton des fondations',`${c.dos_ba} kg de ciment par m³ ; propreté ${c.dos_pr} kg/m³`]);return L}
function recoGet(box){const root=box.closest('#wiz')||box.closest('form')||box.closest('.modal')||document;let base={};try{base=JSON.parse(box.dataset.base||'{}')}catch(e){}
  return [root,k=>{if(k.startsWith('d_')){const e=root.querySelector(`[name="${k}"],[data-d="${k}"]`);return e?e.value:''}const e=root.querySelector(`[name="${k}"]`);if(e)return e.type==='checkbox'?e.checked:e.value;return base[k]}]}
function recoRefresh(box){const [root,get]=recoGet(box),q=recoIn(get),r=recoFond(q),fe=root.querySelector('[name="d_fType"],[data-d="d_fType"]'),cur=fe?fe.value:'',ftU=cur||r.ft,c=r.dims;
  const st=!cur?`<div class="ok">✔ Le devis suit cette proposition.</div>`:cur===r.ft?`<div class="ok">✔ Choix validé par le concepteur.</div>`:`<div class="warn">✏️ Choix du concepteur : <b>${esc(FTL[cur])}</b> (différent de la proposition). Les dimensions ci-dessous sont celles du catalogue pour ce type.</div>`;
  const VP=q.ville?VILLES[get('d_ville')]:null;
  const H=`<div class="rtit">🔎 Proposition de fondation</div><div class="rft">${esc(FTL[r.ft])}</div><div class="sm">Fouilles à ${N(r.prof)} m${r.gros?` (dont ${N(r.gros)} m de gros béton)`:''} · portance retenue ${N(c.sig)} bar</div>
   ${VP?`<div class="rsub">Sols à ${esc(VP.nom.split(':')[0])}</div><div class="sm">${esc(VP.txt)}</div>`:''}
   <div class="rsub">Dimensions et ferraillage proposés${cur&&cur!==r.ft?' ('+esc(FTL[cur])+')':''}</div><table class="rtab">${dimsTxt(c,ftU,q.siCote).map(([a,t])=>`<tr><td>${esc(a)}</td><td>${esc(t)}</td></tr>`).join('')}</table>
   ${r.trait.length?`<div class="rsub">Travaux sur le sol</div><ul>${r.trait.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:''}
   <div class="rsub">Pourquoi</div><ul>${[...r.why,...r.chk].map(t=>`<li>${esc(t)}</li>`).join('')}</ul>
   ${r.bael?`<details class="bael"><summary>📐 Vérifications BAEL 91 mod. 99 (${r.bael.filter(t=>t.startsWith('⚠')).length?'⚠ à revoir':'conformes'})</summary><ul>${r.bael.map(t=>`<li class="${t.startsWith('⚠')?'w':''}">${esc(t)}</li>`).join('')}</ul><div class="sm mute">Prédimensionnement pour le devis ; la note de calcul d'exécution reste à faire par un ingénieur structure.</div></details>`:''}${st}
   <div class="rbtn"><button type="button" class="btn sm" data-rv="1">✔ Valider la proposition</button>${cur?`<button type="button" class="btn sm ghost" data-rv="0">↺ Revenir en automatique</button>`:''}</div>
   <div class="sm mute" style="margin-top:6px">Valeurs tirées du catalogue des fondations types (📦 Catalogue → 🧱 Fondations types), que tu peux modifier.</div>`;
  if(box._h===H)return;const wasOpen=!!box.querySelector('details.bael[open]');box._h=H;box.innerHTML=H;if(wasOpen){const d=box.querySelector('details.bael');if(d)d.open=true}
  box.querySelectorAll('[data-rv]').forEach(bt=>bt.onclick=()=>{const set=(k,v)=>{const e=root.querySelector(`[name="d_${k}"],[data-d="d_${k}"]`);if(!e)return;if(e.tagName==='SELECT'&&![...e.options].some(o=>o.value===String(v)))v='';e.value=v};
    if(bt.dataset.rv==='1'){const ft=cur||r.ft;set('fType',ft);set('fprof',r.prof);set('subEp',r.sub);set('subMat',r.sub?r.subMat:'');set('grosH',r.gros);set('rehausse',r.reh);set('drain',r.drain?'oui':'non');
      DIMKEYS.forEach(([k,f,div])=>{if(k==='siA'&&q.siCote)return;set(k,div?c[f]/div:c[f])});toast('Proposition validée : tu peux encore modifier chaque valeur')}
    else{['fType','subEp','subMat','grosH','rehausse','fprof','drain',...DIMKEYS.map(x=>x[0])].forEach(k=>set(k,''));toast('Retour aux valeurs automatiques')}recoRefresh(box)})}
function recoAll(r){(r||document).querySelectorAll('[data-reco]').forEach(recoRefresh)}
document.addEventListener('input',e=>{const r=e.target.closest('#wiz')||e.target.closest('form');if(r)recoAll(r)});
document.addEventListener('change',e=>{const r=e.target.closest('#wiz')||e.target.closest('form');if(r)recoAll(r)});
new MutationObserver(()=>document.querySelectorAll('[data-reco]:not([data-on])').forEach(b=>{b.dataset.on=1;recoRefresh(b)})).observe(document.body,{childList:true,subtree:true});

/* ===== Page « Fondations types » (catalogue modifiable) ===== */
function viewFondCat(){const pk=ui.fcPk||'laterite',nv=ui.fcNv||'0';if(!ui.fcDraft)ui.fcDraft=JSON.parse(JSON.stringify((S.config.regles||{}).fcat||{}));const D=ui.fcDraft,ov=((D[pk]||{})[nv])||{},def=fDef(pk,nv);
  const setv=`((ui.fcDraft['${pk}']=ui.fcDraft['${pk}']||{})['${nv}']=ui.fcDraft['${pk}']['${nv}']||{})`;
  let h=`<div class="banner">Pour chaque type de sol et chaque hauteur de bâtiment : le type de fondation conseillé, les dimensions, le ferraillage et les dosages. L'assistant devis part de ces valeurs (puis les vérifie avec la charge du bâtiment). Une valeur modifiée est encadrée en orange.</div>
   <div class="seg wrapseg">${Object.entries(FPROF).map(([k,p])=>`<button class="${k===pk?'on':''}" onclick="ui.fcPk='${k}';render()">${esc(p.nom)}</button>`).join('')}</div>
   <div class="note" style="margin:8px 0">${esc(FPROF[pk].desc)}</div>
   <div class="seg" style="margin-bottom:10px">${FNIV.map(([k,l])=>`<button class="${k===nv?'on':''}" onclick="ui.fcNv='${k}';render()">${l}</button>`).join('')}</div>`;
  FGRP.forEach(([gn,F])=>{h+=`<div class="card"><h3>${esc(gn)}</h3>${F.map(([k,l,u,op])=>{const v=ov[k],chg=v!=null&&v!==''&&String(v)!==String(def[k]);
    const inp=op?`<select class="${chg?'chg':''}" onchange="${setv}['${k}']=this.value;render()">${op.map(([a,b])=>`<option value="${a}" ${String(v!=null&&v!==''?v:def[k])===a?'selected':''}>${esc(b)}</option>`).join('')}</select>`
      :`<input inputmode="decimal" class="${chg?'chg':''}" value="${esc(v!=null&&v!==''?v:N(def[k],2))}" oninput="${setv}['${k}']=this.value">`;
    return `<div class="regr"><span>${esc(l)}${u?` <small class="mute">(${esc(u)})</small>`:''}${chg?`<br><small class="mute">par défaut : ${esc(op?(op.find(o=>o[0]===def[k])||[,def[k]])[1]:N(def[k],2))}</small>`:''}</span>${inp}</div>`}).join('')}</div>`});
  if(!ui.bDraft)ui.bDraft={...(((S.config.regles||{}).bael)||{})};const BH=baelH();
  h+=`<div class="card"><h3>Hypothèses de calcul (BAEL 91 révisé 99)</h3><div class="sm mute" style="margin-bottom:8px">Valables pour tous les sols. L'assistant vérifie et corrige les valeurs du catalogue avec ces règles (charges G et Q, ELU 1,35G + 1,5Q, ELS, méthode des bielles pour les semelles, flambement des poteaux, non-fragilité des longrines).</div>${BAELLAB.map(([k,l,u,op])=>{const v=ui.bDraft[k],chg=v!=null&&v!==''&&String(v)!==String(BAELDEF[k]);
    return `<div class="regr"><span>${esc(l)}${u?` <small class="mute">(${esc(u)})</small>`:''}</span>${op?`<select class="${chg?'chg':''}" onchange="ui.bDraft['${k}']=this.value">${op.map(([a,b])=>`<option value="${a}" ${String(BH[k])===a?'selected':''}>${esc(b)}</option>`).join('')}</select>`:`<input inputmode="decimal" class="${chg?'chg':''}" value="${esc(v!=null&&v!==''?v:N(BAELDEF[k],2))}" oninput="ui.bDraft['${k}']=this.value">`}</div>`}).join('')}</div>`;
  h+=`<div class="card"><div class="qbtns" style="margin:0"><button class="btn" onclick="fcSave()">Enregistrer</button><button class="btn sec" onclick="if(ui.fcDraft['${pk}'])delete ui.fcDraft['${pk}']['${nv}'];render()">Valeurs par défaut (ce sol, ce niveau)</button><button class="btn ghost" onclick="ui.fcDraft=null;ui.bDraft=null;render()">Annuler</button></div></div>
   <div class="card"><h3>Sols par ville</h3><div class="sm mute" style="margin-bottom:8px">Présomptions utilisées quand le sol n'a pas encore été observé ni étudié. Elles ne remplacent pas une étude de sol.</div>${Object.values(VILLES).map(V=>`<details class="oreg"><summary>${esc(V.nom)}</summary><div class="sm" style="margin:6px 0">${esc(V.txt)}</div><table class="rtab">${SITES.map(([s,sl])=>{const x=V.s[s];return `<tr><td>${esc(sl)}</td><td>${esc(FPROF[x[0]].nom)} · ${x[1]==='sec'?'sec':x[1]==='pluies'?'humide en saison des pluies':'nappe proche'}${x[2]?' · inondable':''}</td></tr>`}).join('')}</table></details>`).join('')}</div>`;
  return h}
async function fcSave(){const D=ui.fcDraft||{},out={};for(const[pk,nvs] of Object.entries(D))for(const[nv,ov] of Object.entries(nvs||{})){const def=fDef(pk,nv),o={};
    for(const[k,v] of Object.entries(ov||{})){if(v==null||v==='')continue;if(k==='type'){if(v!==def.type)o.type=v;continue}const n=num(v);if(!(n>0)){toast('Valeur invalide : '+k);return}
      if(/_(d|cd|td)$/.test(k)&&!DIAMS.includes(n)){toast(`Diamètre ${n} mm : choisis ${DIAMS.join(', ')}`);return}if(n!==def[k])o[k]=n}
    if(Object.keys(o).length)((out[pk]=out[pk]||{})[nv]=o)}
  const bo={};Object.entries(ui.bDraft||{}).forEach(([k,v])=>{if(v==null||v==='')return;if(k==='fiss'){if(v!==BAELDEF.fiss)bo.fiss=v;return}const n=num(v);if(n>0&&n!==BAELDEF[k])bo[k]=n});
  ui.fcDraft=null;ui.bDraft=null;await saveConfig({regles:{...(S.config.regles||{}),fcat:out,bael:bo}});toast('Catalogue des fondations enregistré')}
