<script>
const GBASE=128;
const patchCol=(v)=>{const c=Math.max(0,Math.min(255,Math.round(v)));return `rgb(${c},${c},${c})`;};
function setPatches(a,b,d){$(a).style.background=patchCol(GBASE);$(b).style.background=patchCol(GBASE+d);}

/* ============================ one: right and wrong ======================== */
const T1_LV=[3,6,10,16],T1_REPS=8;
const T1={q:[],i:0,res:{},fit:null,dl:null};
function t1Build(){
  T1.q=[];T1_LV.forEach(d=>{for(let r=0;r<T1_REPS;r++)T1.q.push(d);});
  shuffle(T1.q);
  T1.i=0;T1.res={};T1_LV.forEach(d=>{T1.res[d]={n:0,k:0};});T1.fit=T1.dl=null;
}
function t1Draw(){
  const d=T1.q[T1.i];if(d===undefined)return t1End();
  setPatches('#t1-l','#t1-r',d);
  $('#t1-bar').style.width=(T1.i/T1.q.length*100)+'%';
  $('#t1-count').textContent='trial '+(T1.i+1)+' of '+T1.q.length;
}
function t1Ans(yes){
  const d=T1.q[T1.i];if(d===undefined)return;
  T1.res[d].n++;if(yes)T1.res[d].k++;T1.i++;
  T1.i<T1.q.length?t1Draw():t1End();
}
function t1End(){
  $('#t1-run').classList.add('hidden');$('#t1-done').classList.remove('hidden');
  T1.fit=probitFit(T1_LV.map(d=>[d,T1.res[d].k/T1.res[d].n]));
  T1.dl=T1.fit.at(0.75)-T1.fit.at(0.5);
  renderSheet('#t1-sheet',['difference','shown','called different','proportion'],
    T1_LV.map(d=>({cells:[{t:d+' levels',cls:'rowhead'},String(T1.res[d].n),
      {t:String(T1.res[d].k),cls:'yes'},{t:fmt(T1.res[d].k/T1.res[d].n,3),cls:'eq'}]})),
    'Your record.');
  renderCalc('#t1-calc',[
    {lbl:'half-way crossing',expr:'proportion different = 0.500',res:f2(T1.fit.at(0.5))},
    {lbl:'three-quarter crossing',expr:'proportion different = 0.750',res:f2(T1.fit.at(0.75))},
    {lbl:'your difference threshold',expr:f2(T1.fit.at(0.75))+' &minus; '+f2(T1.fit.at(0.5)),
     res:f2(T1.dl)+' levels',k:'k3',sum:true}
  ]);
  saveYou('rw',{DL:T1.dl});youOut();redrawAll();
}
$('#t1-plot').appendChild(mkCanvas(230,(pl)=>{
  pl.setup({xlim:[0,20],ylim:[0,1],mar:[3.4,4,1.4,1.4]});
  pl.axes({xat:[0,5,10,15,20],yat:[0,0.25,0.5,0.75,1]});
  pl.axisLabels('difference, grey levels','proportion called different');
  pl.abline({h:0.5,col:PAL.inkFaint,lty:3});
  pl.abline({h:0.75,col:PAL.inkFaint,lty:3});
  if(!T1.fit)return;
  const xs=[],ys=[];for(let v=0;v<=20;v+=0.2){xs.push(v);ys.push(T1.fit.p(v));}
  pl.lines(xs,ys,{col:PAL.accent,lwd:2});
  T1_LV.forEach(d=>pl.points([d],[T1.res[d].k/T1.res[d].n],{col:PAL.accent,pch:21,cex:1.6}));
  pl.abline({v:T1.fit.at(0.5),col:PAL.accent2,lty:2});
  pl.abline({v:T1.fit.at(0.75),col:PAL.accent3,lty:2});
}));
$('#t1-yes').addEventListener('click',()=>t1Ans(true));
$('#t1-no').addEventListener('click',()=>t1Ans(false));
$('#t1-start').addEventListener('click',()=>{t1Build();$('#t1-intro').classList.add('hidden');
  $('#t1-done').classList.add('hidden');$('#t1-run').classList.remove('hidden');t1Draw();});
$('#t1-again').addEventListener('click',()=>{t1Build();$('#t1-done').classList.add('hidden');
  $('#t1-run').classList.remove('hidden');t1Draw();});

/* ====================== two: just noticeable differences ================== */
const T2_STEP=1.5,T2_MAX=30,T2_TICK=380,T2_N=6;
const T2={i:0,dir:'asc',d:0,timer:null,cross:[],active:false,dl:null};
function t2Label(){
  $('#t2-instr').textContent=T2.dir==='asc'
    ?'Growing from nothing. Press when you first see a difference.'
    :'Shrinking from a clear difference. Press when they stop looking different.';
  $('#t2-resp').textContent=T2.dir==='asc'?'I see it now':'They match now';
  $('#t2-count').textContent='series '+Math.min(T2.i+1,T2_N)+' of '+T2_N;
}
function t2Next(){
  if(T2.i>=T2_N)return t2End();
  T2.dir=(T2.i%2===0)?'asc':'desc';
  T2.d=T2.dir==='asc'?0:T2_MAX;
  T2.active=true;t2Label();setPatches('#t2-l','#t2-r',T2.d);
  clearInterval(T2.timer);
  T2.timer=setInterval(()=>{
    T2.d+=T2.dir==='asc'?T2_STEP:-T2_STEP;
    if(T2.dir==='asc'&&T2.d>=T2_MAX)return t2Cross(T2_MAX);
    if(T2.dir==='desc'&&T2.d<=0)return t2Cross(0);
    setPatches('#t2-l','#t2-r',T2.d);
  },T2_TICK);
}
function t2Cross(v){
  if(!T2.active)return;T2.active=false;clearInterval(T2.timer);
  T2.cross.push({dir:T2.dir,v});T2.i++;
  setTimeout(t2Next,450);
}
$('#t2-resp').addEventListener('click',()=>{if(T2.active)t2Cross(T2.d);});
document.addEventListener('keydown',(e)=>{
  if($('#t2-run').classList.contains('hidden'))return;
  if(e.code==='Space'){e.preventDefault();if(T2.active)t2Cross(T2.d);}
});
function t2End(){
  $('#t2-run').classList.add('hidden');$('#t2-done').classList.remove('hidden');
  const up=T2.cross.filter(c=>c.dir==='asc').map(c=>c.v);
  const dn=T2.cross.filter(c=>c.dir==='desc').map(c=>c.v);
  const all=T2.cross.map(c=>c.v);
  T2.dl=mean(all);
  renderSheet('#t2-sheet',['series','direction','crossing'],
    T2.cross.map((c,i)=>({cells:[{t:String(i+1),cls:'rowhead'},
      c.dir==='asc'?'growing':'shrinking',{t:f1(c.v),cls:'yes'}]})),'Your crossings.');
  renderCalc('#t2-calc',[
    {lbl:'growing series',expr:sumExpr(up,1),res:f2(mean(up))+' levels',k:'k1'},
    {lbl:'shrinking series',expr:sumExpr(dn,1),res:f2(mean(dn))+' levels',k:'k2'},
    {lbl:'difference between them',expr:'growing &minus; shrinking',
     res:signed(mean(up)-mean(dn))+' levels'},
    {lbl:'your difference threshold',expr:'mean of all '+all.length+' crossings',
     res:f2(T2.dl)+' levels',k:'k3',sum:true}
  ]);
  saveYou('jnd',{DL:T2.dl,up:mean(up),dn:mean(dn)});youOut();redrawAll();
}
$('#t2-plot').appendChild(mkCanvas(200,(pl)=>{
  const up=T2.cross.filter(c=>c.dir==='asc').map(c=>c.v);
  const dn=T2.cross.filter(c=>c.dir==='desc').map(c=>c.v);
  pl.setup({xlim:[0,T2_MAX],ylim:[0,1],mar:[3.4,6.4,1.6,1.4]});
  pl.axes({xat:[0,10,20,30],yat:[]});
  pl.axisLabels('crossing, grey levels','');
  pl.axisPlain(2,[0.66,0.30],['growing','shrinking'],{cex:0.9});
  [[up,0.66,PAL.accent],[dn,0.30,PAL.accent2]].forEach(([a,y,col])=>{
    a.forEach((v,i)=>pl.points([v],[y+((i%2)?0.05:-0.05)],{col,pch:21,cex:1.4}));
    if(a.length)pl.segments(mean(a),y-0.14,mean(a),y+0.14,{col,lwd:2});
  });
  if(T2.cross.length){pl.abline({v:T2.dl,col:PAL.accent3,lty:2});
    pl.text(T2.dl,0.97,'mean '+f2(T2.dl),{col:PAL.accent3,cex:0.85});}
}));
$('#t2-start').addEventListener('click',()=>{T2.i=0;T2.cross=[];
  $('#t2-intro').classList.add('hidden');$('#t2-done').classList.add('hidden');
  $('#t2-run').classList.remove('hidden');t2Next();});
$('#t2-again').addEventListener('click',()=>{T2.i=0;T2.cross=[];
  $('#t2-done').classList.add('hidden');$('#t2-run').classList.remove('hidden');t2Next();});

/* =========================== three: average error ======================== */
const T3_N=7;
const T3={i:0,set:[],dl:null};
function t3Next(){
  if(T3.i>=T3_N)return t3End();
  $('#t3-slider').value=fmt((Math.random()<0.5?-1:1)*(8+Math.random()*14),1);
  t3Upd();$('#t3-count').textContent='setting '+(T3.i+1)+' of '+T3_N;
}
function t3Upd(){
  const v=+$('#t3-slider').value;
  $('#t3-sv').textContent=(v>=0?'+':'')+fmt(v,1);
  setPatches('#t3-l','#t3-r',v);
}
$('#t3-slider').addEventListener('input',t3Upd);
$('#t3-set').addEventListener('click',()=>{T3.set.push(+$('#t3-slider').value);T3.i++;
  T3.i<T3_N?t3Next():t3End();});
function t3End(){
  $('#t3-run').classList.add('hidden');$('#t3-done').classList.remove('hidden');
  const m=mean(T3.set), av=mad(T3.set);
  T3.dl=MAD_TO_PE*av;
  renderSheet('#t3-sheet',['setting','grey levels','from the mean'],
    T3.set.map((v,i)=>({cells:[{t:String(i+1),cls:'rowhead'},
      {t:signed(v),cls:'yes'},{t:signed(v-m),cls:'eq'}]}))
      .concat([{cls:'derived',cells:[{t:'mean',cls:'rowhead'},signed(m),'—']},
               {cls:'derived',cells:[{t:'average of |·|',cls:'rowhead'},'—',fmt(av,2)]}]),
    'Your settings. Zero is physical equality.');
  renderCalc('#t3-calc',[
    {lbl:'your mean setting',expr:sumExpr(T3.set,1),res:signed(m)+' levels',k:'k2'},
    {lbl:'your constant error',expr:'how far that is from equality',res:signed(m)+' levels',k:'k2'},
    {lbl:'average error',expr:'mean distance from '+f2(m),res:f2(av)+' levels'},
    {lbl:'your difference threshold',expr:'0.8454 × '+f2(av),
     res:f2(T3.dl)+' levels',k:'k3',sum:true}
  ]);
  saveYou('ae',{DL:T3.dl,PSE:m,CE:m,avgErr:av});youOut();redrawAll();
}
$('#t3-plot').appendChild(mkCanvas(195,(pl)=>{
  pl.setup({xlim:[-26,26],ylim:[0,1],mar:[3.4,2,1.8,1.4]});
  pl.axes({xat:[-20,-10,0,10,20],yat:[]});
  pl.axisLabels('your setting, grey levels','');
  pl.abline({v:0,col:PAL.ink,lty:2});
  if(!T3.set.length)return;
  const m=mean(T3.set),pe=PE_Z*sdev(T3.set);
  pl.rect(m-pe,0,m+pe,1,{col:'rgba(74,124,89,.12)',border:null});
  T3.set.forEach((v,i)=>pl.points([v],[0.22+((i%5)*0.09)],{col:PAL.accent,cex:1.3}));
  pl.abline({v:m,col:PAL.accent3,lty:2});
  pl.text(m,0.95,'mean '+f2(m),{col:PAL.accent3,cex:0.85});
}));
$('#t3-start').addEventListener('click',()=>{T3.i=0;T3.set=[];
  $('#t3-intro').classList.add('hidden');$('#t3-done').classList.add('hidden');
  $('#t3-run').classList.remove('hidden');t3Next();});
$('#t3-again').addEventListener('click',()=>{T3.i=0;T3.set=[];
  $('#t3-done').classList.add('hidden');$('#t3-run').classList.remove('hidden');t3Next();});

/* ============================== gathering up ============================= */
function youOut(){
  const y=loadStore().you||{};
  const rows=[['rw','Right and wrong cases','three-quarter point minus half point'],
              ['jnd','Just noticeable differences','mean of the six crossings'],
              ['ae','Average error','0.8454 × the average error']];
  const done=rows.filter(r=>y[r[0]]&&y[r[0]].DL!=null);
  renderSheet('#you-out',['method','the arithmetic','your difference threshold'],
    rows.map(r=>({cells:[{t:r[1],cls:'rowhead'},r[2],
      {t:y[r[0]]&&y[r[0]].DL!=null?f2(y[r[0]].DL)+' levels':'not run',
       cls:y[r[0]]&&y[r[0]].DL!=null?'eq':'blank'}]})),
    done.length<2?'Run at least two to compare them.'
      :'Your three will usually disagree more than the simulated subject’s do. You drifted, '+
       'guessed and tired between the tasks, and each of these used far fewer trials than the '+
       'pages before.');
}
$('#you-clear').addEventListener('click',()=>{
  const d=loadStore();d.you={};
  try{localStorage.setItem(STORE_KEY,JSON.stringify(d));}catch(e){/* private mode */}
  youOut();
});
youOut();
</script>
