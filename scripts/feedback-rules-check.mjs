import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
const config = { apiKey:'AIzaSyBTQ0jS4nh0hH3spvo-rHiCz683ITNzaIk', projectId:'atomsai-guideline-feedback' };
const apps = [initializeApp(config,'rules-test-a'), initializeApp(config,'rules-test-b'), initializeApp(config,'rules-test-unsigned')];
const [a,b,unsigned] = apps.map(app => getFirestore(app));
const [u,v] = await Promise.all(apps.slice(0,2).map(app => signInAnonymously(getAuth(app)).then(r=>r.user.uid)));
const page = `verification-${crypto.randomUUID()}`;
const id = crypto.randomUUID();
const path = `pages/${page}/comments/${id}`;
const now = new Date().toISOString();
const value = {id,ownerUid:u,author:'Rules test A',text:'Temporary verification',createdAt:now,updatedAt:now,resolved:false,resolvedBy:'',resolvedAt:'',anchor:{selector:'#main',offsetX:.5,offsetY:.5,viewportX:.5,viewportY:.5}};
let replyPaths = [];
try {
  await setDoc(doc(a,path),value);
  const context = {browser:'Chrome 140',viewportWidth:1440,viewportHeight:1000,pixelRatio:2,pageUrl:'https://example.com/'};
  const screenshot = {dataUrl:'data:image/jpeg;base64,/9j/AA==',width:480,height:320};
  const withMeta = {...value, meta:{context,screen:'dialog:site-menu:Applications',screenshot}};
  const metaPath = `pages/${page}/comments/context-check`;
  try {
    await setDoc(doc(a,metaPath),{...withMeta,id:'context-check'});
    assert.deepEqual((await getDoc(doc(b,metaPath))).data().meta.context,context);
    await assert.rejects(updateDoc(doc(a,metaPath),{'meta.context.viewportWidth':800}),e=>e.code==='permission-denied');
    await assert.rejects(setDoc(doc(a,`pages/${page}/comments/invalid`),{...withMeta,id:'invalid',meta:{context:{...context,viewportWidth:-1}}}),e=>e.code==='permission-denied');
    await assert.rejects(updateDoc(doc(a,metaPath),{'meta.screenshot.dataUrl':'data:image/jpeg;base64,/9j/BB=='}),e=>e.code==='permission-denied');
    for (const screenshot of [{dataUrl:'data:text/html;base64,AAAA',width:480,height:320},{dataUrl:'data:image/jpeg;base64,'+'A'.repeat(120000),width:480,height:320},{dataUrl:'data:image/jpeg;base64,AAAA',width:481,height:320}]) {
      await assert.rejects(setDoc(doc(a,`pages/${page}/comments/invalid-image`),{...withMeta,id:'invalid-image',meta:{context,screenshot}}),e=>e.code==='permission-denied');
    }
    await updateDoc(doc(a,metaPath),{text:'Edited text'});
    assert.deepEqual((await getDoc(doc(b,metaPath))).data().meta.context,context);
  } finally { await deleteDoc(doc(a,metaPath)); }
  assert.equal((await getDoc(doc(b,path))).data().text,value.text);
  await assert.rejects(getDoc(doc(unsigned,path)),e=>e.code==='permission-denied');
  await assert.rejects(updateDoc(doc(b,path),{text:'Overwrite denied'}),e=>e.code==='permission-denied');
  await assert.rejects(deleteDoc(doc(b,path)),e=>e.code==='permission-denied');
  await updateDoc(doc(b,path),{resolved:true,resolvedBy:'Rules test B',resolvedAt:now});
  assert.equal((await getDoc(doc(a,path))).data().resolved,true);
  replyPaths = [crypto.randomUUID(),crypto.randomUUID()].map(id=>`pages/${page}/replies/${id}`);
  await Promise.all(replyPaths.map((p,i)=>setDoc(doc(i ? b : a,p),{id:p.split('/').at(-1),commentId:id,ownerUid:i?v:u,author:`Guest ${i}`,text:'Concurrent reply',createdAt:now,updatedAt:now})));
  assert.ok((await getDoc(doc(a,replyPaths[0]))).exists());
  assert.ok((await getDoc(doc(a,replyPaths[1]))).exists());
  await assert.rejects(updateDoc(doc(b,replyPaths[0]),{text:'Overwrite denied'}),e=>e.code==='permission-denied');
  await assert.rejects(updateDoc(doc(a,path),{text:'x'.repeat(8001)}),e=>e.code==='permission-denied');
  console.log('PASS: shared reads, guest replies, concurrent writes, ownership enforcement, validation, unsigned access denied');
} finally {
  await Promise.all(replyPaths.map((p,i)=>deleteDoc(doc(i ? b : a,p))));
  await deleteDoc(doc(a,path));
  await Promise.all(apps.map(deleteApp));
}
