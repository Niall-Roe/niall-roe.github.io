<script>
const METH=[['rw','Right and wrong cases'],['jnd','Just noticeable differences'],['ae','Average error']];
const MC={rw:PAL.accent,jnd:PAL.accent3,ae:PAL.accent2};
const HOW={
  rw:{rec:'How often he was right, at each of a few fixed weights',
      rl:'Fit an ogive; read the weight at one half',
      dl:'Fit an ogive; three-quarter point minus half point'},
  jnd:{rec:'The weight at which his answer changed, in each series',
       rl:'Average the crossings from both directions',
       dl:'Average the two limits; halve the gap between them'},
  ae:{rec:'Where he left the dial, over and over',
      rl:'The mean setting',
      dl:'0.8454 × the average distance from the mean setting'}
};

/* one dot per method on a shared axis; anything unrun is named, not hidden */
function dotPlot(sel,rows,unit,hiMin,truth,truthLab){
  const el=$(sel);if(!el)return;
  el.innerHTML='';
  el.appendChild(mkCanvas(160,(pl)=>{
    const vals=rows.filter(r=>r.v!=null).map(r=>r.v);
    const hi=Math.max(hiMin,vals.length?Math.max.apply(null,vals)*1.15:0,truth?truth*1.3:0);
    pl.setup({xlim:[0,hi],ylim:[-0.5,rows.length-0.5],mar:[3,15,1.8,3.4]});
    pl.axes({xat:RPlot.ticks(0,hi,5),yat:[]});
    pl.axisLabels('threshold in '+unit,'');
    pl.axisPlain(2,rows.map((r,i)=>rows.length-1-i),rows.map(r=>r.k),{cex:0.9});
    if(truth!=null){pl.abline({v:truth,col:PAL.ink,lty:2});
      if(truthLab)pl.text(truth,rows.length-0.34,truthLab,{col:PAL.inkSoft,cex:0.8});}
    rows.forEach((r,i)=>{
      const y=rows.length-1-i;
      if(r.v==null){pl.text(0,y,'  not run',{col:PAL.inkFaint,cex:0.85,adj:0});return;}
      pl.segments(0,y,hi,y,{col:PAL.ruleSoft});
      pl.points([r.v],[y],{col:r.c,cex:2.2});
      pl.text(r.v+hi*0.025,y,fmt(r.v,2),{col:PAL.ink,cex:0.9,adj:0});
    });
  }));
}

function render(){
  const d=loadStore(), sim=d.sim||{}, truth=d.truth||null;
  const any=METH.some(m=>sim[m[0]]&&(sim[m[0]].RL!=null||sim[m[0]].DL!=null));
  $('#res-empty').style.display=any?'none':'';
  if(!any){$('#res-body').innerHTML='';return;}

  $('#res-body').innerHTML=
    '<h3>The absolute threshold</h3>'+
    '<p>All three methods are looking for the same thing here: the weight he feels half the time. '+
    'They should agree, and the arithmetic that gets them there is different in each case.</p>'+
    '<div class="plot-container" id="p-rl"></div>'+
    '<p class="plot-cap">Each method’s estimate of the absolute threshold.</p>'+
    '<div id="s-rl"></div>'+
    '<h3>The difference threshold</h3>'+
    '<p>Here they are not all measuring the same thing, and the numbers differ. What each one is '+
    'in a position to recover is set out below the table.</p>'+
    '<div class="plot-container" id="p-dl"></div>'+
    '<p class="plot-cap">Each method’s estimate of the difference threshold at a 100 g standard.</p>'+
    '<div id="s-dl"></div><div id="s-why"></div>'+
    '<h3>The point of subjective equality</h3>'+
    '<p>Two of the three report where “equal” sits for him, and both should find the same place.</p>'+
    '<div id="s-pse"></div>';

  dotPlot('#p-rl',METH.map(m=>({k:m[1],v:sim[m[0]]?sim[m[0]].RL:null,c:MC[m[0]]})),
    'grams',6,truth?truth.RL:null,'in the subject');
  renderSheet('#s-rl',['method','what was recorded','the arithmetic','result'],
    METH.map(m=>({cells:[{t:m[1],cls:'rowhead'},HOW[m[0]].rec,HOW[m[0]].rl,
      {t:sim[m[0]]&&sim[m[0]].RL!=null?gram(sim[m[0]].RL):'not run',
       cls:sim[m[0]]&&sim[m[0]].RL!=null?'eq':'blank'}]})),
    truth?'The subject’s own absolute threshold is '+gram(truth.RL)+'.':'');

  dotPlot('#p-dl',METH.map(m=>({k:m[1],v:sim[m[0]]?sim[m[0]].DL:null,c:MC[m[0]]})),
    'grams',10,null,null);
  renderSheet('#s-dl',['method','what was recorded','the arithmetic','result'],
    METH.map(m=>({cells:[{t:m[1],cls:'rowhead'},HOW[m[0]].rec,HOW[m[0]].dl,
      {t:sim[m[0]]&&sim[m[0]].DL!=null?gram(sim[m[0]].DL):'not run',
       cls:sim[m[0]]&&sim[m[0]].DL!=null?'eq':'blank'}]})),'');

  if(truth)renderCalc('#s-why',[
    {lbl:'his sensory spread',expr:'the one quantity all three work from',res:gram(truth.sigma)},
    {lbl:'right and wrong',expr:'0.6745 × '+f2(truth.sigma)+', the spread itself',
     res:gram(truth.PE),k:'k1'},
    {lbl:'just noticeable differences',
     expr:'the spread, and how sure he insists on being before saying “heavier”',
     res:gram(truth.iuHalf),k:'k3'},
    {lbl:'average error',expr:'the spread, and the unsteadiness of his hand',
     res:gram(truth.setPE),k:'k2',sum:true}
  ]);

  const withPse=METH.filter(m=>sim[m[0]]&&sim[m[0]].PSE!=null);
  renderSheet('#s-pse',['method','point of subjective equality','constant error'],
    withPse.map(m=>({cells:[{t:m[1],cls:'rowhead'},
      {t:gram(sim[m[0]].PSE),cls:'gt'},{t:signed(sim[m[0]].CE)+' g',cls:'gt'}]})),
    truth?'His “equal” actually sits at '+gram(truth.PSE)+', a constant error of '+
      signed(truth.CE)+' g. The first method reports it in passing; the third is built around it.':'');
}

/* --------------------------------------------------------------- Weber ---- */
const WSTD=[25,50,100,200,400],WEB={};
$('#web-btns').innerHTML=WSTD.map(v=>`<button class="btn" data-s="${v}">${v} g standard</button>`).join('')+
  '<button class="btn" id="web-clear">Clear</button>';
$$('#web-btns button[data-s]').forEach(b=>b.addEventListener('click',()=>{
  const S=+b.dataset.s;
  const pts=[-0.13,-0.07,-0.03,0.03,0.07,0.13].map(f=>{
    const c=S*(1+f);let k=0;for(let i=0;i<200;i++)if(heavier(c,S))k++;return [c,k/200];});
  const fit=probitFit(pts);
  WEB[S]={dl:fit.at(0.75)-fit.at(0.5)};
  webSheet();redrawAll();
}));
$('#web-clear').addEventListener('click',()=>{Object.keys(WEB).forEach(k=>delete WEB[k]);
  webSheet();redrawAll();});
const webRows=()=>Object.keys(WEB).map(k=>[+k,WEB[k]]).sort((a,b)=>a[0]-b[0]);
function webSheet(){
  const E=webRows();
  renderSheet('#web-sheet',['standard','difference threshold','threshold ÷ standard'],
    E.map(([S,o])=>({cells:[{t:S+' g',cls:'rowhead'},{t:gram(o.dl),cls:'yes'},
      {t:fmt(o.dl/S*100,2)+'%',cls:'eq'}]})),
    E.length>1?'The middle column changes a great deal; the right-hand one hardly at all.'
      :'no standards measured yet');
}
$('#web-plot').appendChild(mkCanvas(265,(pl)=>{
  const E=webRows();
  pl.setup({xlim:[0,430],ylim:[0,1],mar:[3.4,4.4,1.6,1.4]});
  pl.axes({xat:[0,100,200,300,400],yat:[]});
  pl.axisLabels('standard weight, grams','');
  const mid=0.46;
  const Yt=v=>mid+0.04+(v/34)*(0.96-mid-0.04), Yf=v=>0.04+(v/0.10)*(mid-0.12);
  [0,10,20,30].forEach(v=>{pl.segments(0,Yt(v),430,Yt(v),{col:PAL.ruleSoft});
    pl.text(-12,Yt(v),String(v),{col:PAL.inkFaint,cex:0.8,adj:1});});
  [0,0.04,0.08].forEach(v=>{pl.segments(0,Yf(v),430,Yf(v),{col:PAL.ruleSoft});
    pl.text(-12,Yf(v),fmt(v*100,0)+'%',{col:PAL.inkFaint,cex:0.8,adj:1});});
  pl.text(6,0.99,'threshold, grams',{col:PAL.inkSoft,cex:0.82,adj:0});
  pl.text(6,mid-0.03,'threshold ÷ standard',{col:PAL.inkSoft,cex:0.82,adj:0});
  if(!E.length){pl.text(215,0.5,'measure a standard or two',{col:PAL.inkFaint,cex:1.05});return;}
  if(E.length>1)pl.lines(E.map(e=>e[0]),E.map(e=>Yt(e[1].dl)),{col:PAL.accent,lwd:1.4});
  E.forEach(([S,o])=>{
    pl.points([S],[Yt(o.dl)],{col:PAL.accent,cex:1.6});
    pl.points([S],[Yf(o.dl/S)],{col:PAL.accent3,cex:1.6});
    pl.text(S,Yt(o.dl)+0.055,fmt(o.dl,1),{col:PAL.inkSoft,cex:0.78});
    pl.text(S,Yf(o.dl/S)+0.055,fmt(o.dl/S*100,1)+'%',{col:PAL.inkSoft,cex:0.78});
  });
}));

/* ---------------------------------------------------------------- scale ---- */
const SC={n:0};
function scRatio(){const d=loadStore();
  const dl=(d.sim&&d.sim.rw&&d.sim.rw.DL!=null)?d.sim.rw.DL:PE_TRUE(100);
  return 1+dl/100;}
const scAt=(n)=>SUBJ.RL*Math.pow(scRatio(),n);
function scUpd(){
  $('#sc-n').textContent=SC.n;
  $('#sc-w').textContent=gram(scAt(SC.n));
  $('#sc-st').textContent=SC.n?gram(scAt(SC.n)-scAt(SC.n-1)):'—';
  redrawAll();
}
$('#sc-plot').appendChild(mkCanvas(285,(pl)=>{
  const nMax=Math.log(120/SUBJ.RL)/Math.log(scRatio());
  pl.setup({xlim:[0,120],ylim:[0,nMax],mar:[3.4,4,1.6,1.4]});
  pl.axes({xat:[0,20,40,60,80,100,120],yat:[0,20,40,60,80].filter(v=>v<=nMax)});
  pl.axisLabels('weight, grams','units of sensation');
  for(let i=0;i<=SC.n;i++){const w=scAt(i);if(w>120)break;
    pl.segments(w,0,w,nMax*(i===SC.n?0.045:0.022),
      {col:i===SC.n?PAL.accent3:'rgba(74,124,89,.32)',lwd:i===SC.n?1.7:1});}
  if(!SC.n){pl.text(60,nMax/2,'add a unit',{col:PAL.inkFaint,cex:1.05});return;}
  const xs=[],ys=[];
  for(let i=0;i<=SC.n;i++){const w=scAt(i);if(w>120)break;xs.push(w);ys.push(i);}
  pl.lines(xs,ys,{col:PAL.accent,lwd:2});
  const w=Math.min(120,scAt(SC.n));
  pl.points([w],[SC.n],{col:PAL.accent,cex:1.6});
  pl.text(w-3,SC.n,SC.n+' units at '+gram(w),{col:PAL.ink,cex:0.88,adj:1});
}));
$('#sc-1').addEventListener('click',()=>{SC.n++;scUpd();});
$('#sc-10').addEventListener('click',()=>{SC.n+=10;scUpd();});
$('#sc-full').addEventListener('click',()=>{
  SC.n=Math.round(Math.log(100/SUBJ.RL)/Math.log(scRatio()));scUpd();});
$('#sc-reset').addEventListener('click',()=>{SC.n=0;scUpd();});
$('#res-clear').addEventListener('click',()=>{clearStore();render();redrawAll();});

render();webSheet();scUpd();
</script>
