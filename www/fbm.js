/* fbm.js — Firebase « modulaire » (lib/firebase-mod.js, fabriqué par GitHub) : connexion sans la fenêtre Google cachée qui bloque dans l'APK.
   Habillé avec la même interface que la version « compat » pour le reste de l'application. Chargé juste après team.js. */
fbLoad=async function(){if(window.firebase&&firebase.firestore&&firebase.auth)return;
  try{await loadJs('lib/firebase-mod.js');if(window.FBM){window.firebase=fbFacade(window.FBM);return}}catch(e){}
  for(const n of ['app','auth','firestore']){try{await loadJs(`lib/firebase-${n}-compat.js`)}catch(e){await loadJs(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-${n}-compat.js`)}}};
function fbFacade(M){const apps=[],auths=new Map(),stores=new Map();
  const W=(A,u)=>u?{get email(){return u.email},get uid(){return u.uid},get emailVerified(){return u.emailVerified},reload:()=>u.reload(),sendEmailVerification:()=>M.sendEmailVerification(u),updatePassword:p=>M.updatePassword(u,p)}:null;
  const authOf=a=>{if(auths.has(a.name))return auths.get(a.name);
    const A=M.initializeAuth(a._m,{persistence:a.name==='sec'?M.inMemoryPersistence:[M.indexedDBLocalPersistence,M.browserLocalPersistence]});
    const o={get currentUser(){return W(A,A.currentUser)},onAuthStateChanged:cb=>M.onAuthStateChanged(A,u=>cb(W(A,u))),
      signInWithEmailAndPassword:async(e,p)=>({user:W(A,(await M.signInWithEmailAndPassword(A,e,p)).user)}),
      createUserWithEmailAndPassword:async(e,p)=>({user:W(A,(await M.createUserWithEmailAndPassword(A,e,p)).user)}),
      signOut:()=>M.signOut(A),setPersistence:async()=>{},sendPasswordResetEmail:e=>M.sendPasswordResetEmail(A,e)};auths.set(a.name,o);return o};
  const storeOf=a=>{if(stores.has(a.name))return stores.get(a.name);let db;
    try{db=M.initializeFirestore(a._m,{localCache:M.persistentLocalCache({tabManager:M.persistentMultipleTabManager()})})}catch(e){db=M.initializeFirestore(a._m,{})}
    const ds=s=>({id:s.id,exists:s.exists(),data:()=>s.data()||{},metadata:s.metadata});
    const qs=s=>({docs:s.docs.map(d=>({id:d.id,data:()=>d.data()})),metadata:s.metadata});
    const dW=r=>({set:(v,opt)=>M.setDoc(r,v,opt||{}),delete:()=>M.deleteDoc(r),get:opt=>(opt&&opt.source==='server'?M.getDocFromServer(r):M.getDoc(r)).then(ds),onSnapshot:(cb,er)=>M.onSnapshot(r,s=>cb(ds(s)),er)});
    const qW=(q,isC)=>({where:(f,op,v)=>qW(M.query(q,M.where(f&&f.__id?M.documentId():f,op,v))),onSnapshot:(cb,er)=>M.onSnapshot(q,s=>cb(qs(s)),er),doc:id=>dW(M.doc(q,id))});
    const o={collection:c=>qW(M.collection(db,c),true),doc:p=>dW(M.doc(db,p)),enablePersistence:()=>Promise.resolve()};stores.set(a.name,o);return o};
  const F={apps,initializeApp:(cfg,name='[DEFAULT]')=>{const a={name,_m:M.initializeApp(cfg,name)};a.auth=()=>authOf(a);apps.push(a);return a},
    app:()=>apps.find(a=>a.name==='[DEFAULT]')};
  F.auth=Object.assign(()=>authOf(F.app()),{Auth:{Persistence:{NONE:'none'}}});
  F.firestore=Object.assign(()=>storeOf(F.app()),{FieldPath:{documentId:()=>({__id:true})}});return F}
window.teamInit=async function(){
  let local=false;try{local=localStorage.getItem('ge_local')==='1'}catch(e){}
  if(local){localSwitch();return null}
  try{await fbLoad()}catch(e){toast('Mode équipe indisponible hors connexion : données de cet appareil.');localSwitch();return null}
  if(!firebase.apps.find(a=>a.name==='[DEFAULT]'))firebase.initializeApp(FB_CFG);
  TEAM.auth=firebase.auth();TEAM.fs=firebase.firestore();
  try{TEAM.fs.enablePersistence({synchronizeTabs:true}).catch(()=>{})}catch(e){}
  return new Promise(res=>{TEAM.res=res;let first=true;
    setTimeout(()=>{if(first){first=false;loginShow(null,"La connexion au serveur ne répond pas. Vérifie Internet puis réessaie, ou continue sans compte.")}},20000);
    TEAM.auth.onAuthStateChanged(async u=>{if(!first)return;first=false;
      if(u&&await teamUser(u)){res(teamDb());return}
      if(!u)loginShow()})})};
