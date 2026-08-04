<script>
/* ======================= PART ONE: the absolute threshold ================= */
const RL_W=[1.0,1.75,2.5,3.25,4.0,4.75];      /* the fixed set, chosen in advance */
const RL={obs:{},log:[],n:0};
RL_W.forEach(w=>{RL.obs[w]={n:0,k:0};});

function rlRun(k){
  let last=null;
  for(let i=0;i<k;i++){
    const w=RL_W[sampleInt(RL_W.length)], yes=feels(w);
    RL.obs[w].n++; if(yes)RL.obs[w].k++; RL.n++;
    if(RL.log.length<400)RL.log.push('trial '+RL.n+' &nbsp; '+fmt(w,2)+' g &nbsp; <span class="'+
      (yes?'r':'w')+'">'+(yes?'felt it':'nothing')+'</span>');
    last={w,yes};
  }
  if(last){$('#rl-w').textContent=fmt(last.w,2)+' g';
    $('#rl-says').textContent=last.yes?'“I feel it”':'“nothing”';}
  $('#rl-n').textContent=RL.n;
  $('#rl-log').innerHTML=RL.log.slice(-120).reverse().join('<br>')||'No trials yet.';
  rlSheet(); rlCalc(); redrawAll();
}
function rlRows(){return RL_W.filter(w=>RL.obs[w].n>0).map(w=>[w,RL.obs[w]]);}
function rlFit(){
  const rows=rlRows().filter(([w,o])=>o.n>=5);
  if(rows.length<3)return null;
  const ps=rows.map(([w,o])=>o.k/o.n);
  if(!(ps.some(p=>p>0.5)&&ps.some(p=>p<0.5)))return null;
  return probitFit(rows.map(([w,o])=>[w,o.k/o.n]));
}
function rlSheet(){
  const rows=rlRows();
  renderSheet('#rl-sheet',['weight','presented','felt it','proportion'],
    rows.map(([w,o])=>({cells:[{t:fmt(w,2)+' g',cls:'rowhead'},String(o.n),
      {t:String(o.k),cls:'yes'},{t:fmt(o.k/o.n,3),cls:'eq'}]})),
    rows.length?'One row per weight. This is the entire record the method produces.':'no trials yet');
}
function rlCalc(){
  const fit=rlFit();
  if(!fit){renderCalc('#rl-calc',[{lbl:'absolute threshold',
    expr:'not enough trials yet to straddle the half-way line',res:'—'}]);return;}
  const rl=fit.at(0.5);
  renderCalc('#rl-calc',[
    {lbl:'fitted curve',expr:'normal ogive through '+rlRows().length+' points',
     res:'spread '+gram(Math.abs(fit.sigma))},
    {lbl:'read at',expr:'proportion felt = 0.500',res:''},
    {lbl:'absolute threshold',expr:'the weight where the curve crosses one half',
     res:gram(rl),k:'k3',sum:true}
  ]);
  const prev=(loadStore().sim||{}).rw||{};
  saveSim('rw',Object.assign({},prev,{RL:rl}));
}
function rlAxes(pl){
  pl.setup({xlim:[0,5.4],ylim:[0,1],mar:[3.4,4,1.4,1.4]});
  pl.axes({xat:[0,1,2,3,4,5],yat:[0,0.25,0.5,0.75,1]});
  pl.axisLabels('weight, grams','proportion felt');
  pl.abline({h:0.5,col:PAL.inkFaint,lty:3});
}
$('#rl-props').appendChild(mkCanvas(240,(pl)=>{
  rlAxes(pl);
  const rows=rlRows();
  if(!rows.length){pl.text(2.7,0.5,'run some trials',{col:PAL.inkFaint,cex:1.05});return;}
  rows.forEach(([w,o])=>pl.points([w],[o.k/o.n],{col:PAL.accent,pch:21,cex:1.6}));
}));
$('#rl-fit').appendChild(mkCanvas(240,(pl)=>{
  rlAxes(pl);
  const fit=rlFit(), rows=rlRows();
  if(!fit){rows.forEach(([w,o])=>pl.points([w],[o.k/o.n],{col:PAL.accent,pch:21,cex:1.6}));
    pl.text(2.7,0.15,'run enough trials to straddle the half-way line',{col:PAL.inkFaint,cex:0.9});return;}
  const xs=[],ys=[];for(let w=0;w<=5.4;w+=0.05){xs.push(w);ys.push(fit.p(w));}
  pl.lines(xs,ys,{col:PAL.accent,lwd:2});
  rows.forEach(([w,o])=>pl.points([w],[o.k/o.n],{col:PAL.accent,pch:21,cex:1.6}));
  const rl=fit.at(0.5);
  pl.abline({v:rl,col:PAL.accent3,lty:2});
  pl.points([rl],[0.5],{col:PAL.accent3,cex:1.8});
  pl.text(rl,0.09,'RL '+gram(rl),{col:PAL.accent3,cex:0.88});
}));
['#rl-1','#rl-20','#rl-200'].forEach((s,i)=>
  $(s).addEventListener('click',()=>rlRun([1,20,200][i])));
$('#rl-clear').addEventListener('click',()=>{RL.log=[];RL.n=0;
  RL_W.forEach(w=>{RL.obs[w]={n:0,k:0};});
  $('#rl-w').textContent='—';$('#rl-says').textContent='—';rlRun(0);});

/* ==================== PART TWO: the difference threshold ================== */
const STD=100;
const DL_C=[92,96,99,101,104,108,112];
const DL={obs:{},log:[],n:0};
DL_C.forEach(c=>{DL.obs[c]={n:0,k:0};});

function dlRun(k){
  let last=null;
  for(let i=0;i<k;i++){
    const c=DL_C[sampleInt(DL_C.length)], up=heavier(c,STD);
    DL.obs[c].n++; if(up)DL.obs[c].k++; DL.n++;
    if(DL.log.length<400)DL.log.push('trial '+DL.n+' &nbsp; '+c+' g vs 100 g &nbsp; <span class="'+
      (up?'r':'w')+'">'+(up?'heavier':'lighter')+'</span>');
    last={c,up};
  }
  if(last){$('#dl-c').textContent=fmt(last.c,1)+' g';
    $('#dl-says').textContent=last.up?'“the right is heavier”':'“the left is heavier”';}
  $('#dl-n').textContent=DL.n;
  $('#dl-log').innerHTML=DL.log.slice(-120).reverse().join('<br>')||'No trials yet.';
  dlSheet(); dlCalc(); redrawAll();
}
function dlRows(){return DL_C.filter(c=>DL.obs[c].n>0).map(c=>[c,DL.obs[c]]);}
function dlFit(){
  const rows=dlRows().filter(([c,o])=>o.n>=5);
  if(rows.length<3)return null;
  const ps=rows.map(([c,o])=>o.k/o.n);
  if(!(ps.some(p=>p>0.55)&&ps.some(p=>p<0.45)))return null;
  return probitFit(rows.map(([c,o])=>[c,o.k/o.n]));
}
function dlSheet(){
  const rows=dlRows();
  renderSheet('#dl-sheet',['comparison','presented','called heavier','proportion'],
    rows.map(([c,o])=>({cells:[{t:fmt(c,1)+' g',cls:'rowhead'},String(o.n),
      {t:String(o.k),cls:'gt'},{t:fmt(o.k/o.n,3),cls:'eq'}]})),
    rows.length?'One row per comparison weight.':'no trials yet');
}
function dlCalc(){
  const fit=dlFit();
  if(!fit){renderCalc('#dl-calc',[{lbl:'thresholds',
    expr:'not enough trials yet to straddle the half-way line',res:'—'}]);return;}
  const pse=fit.at(0.5), p75=fit.at(0.75), dl=p75-pse, ce=pse-STD;
  renderCalc('#dl-calc',[
    {lbl:'fitted curve',expr:'normal ogive through '+dlRows().length+' points',
     res:'spread '+gram(Math.abs(fit.sigma))},
    {lbl:'half-way crossing',expr:'proportion heavier = 0.500',res:gram(pse)},
    {lbl:'point of subjective equality',expr:'the comparison that feels equal',res:gram(pse),k:'k2'},
    {lbl:'constant error',expr:f2(pse)+' &minus; 100.00',res:signed(ce)+' g',k:'k2'},
    {lbl:'three-quarter crossing',expr:'proportion heavier = 0.750',res:gram(p75)},
    {lbl:'difference threshold',expr:f2(p75)+' &minus; '+f2(pse),res:gram(dl),k:'k3',sum:true}
  ]);
  const prev=(loadStore().sim||{}).rw||{};
  saveSim('rw',Object.assign({},prev,{DL:dl,PSE:pse,CE:ce,sigma:Math.abs(fit.sigma)}));
}
function dlAxes(pl){
  pl.setup({xlim:[90,114],ylim:[0,1],mar:[3.4,4,1.6,1.4]});
  pl.axes({xat:[92,96,100,104,108,112],yat:[0,0.25,0.5,0.75,1]});
  pl.axisLabels('comparison weight, grams','proportion called heavier');
  pl.abline({h:0.5,col:PAL.inkFaint,lty:3});
  pl.abline({v:STD,col:PAL.ink,lty:2});
}
$('#dl-props').appendChild(mkCanvas(240,(pl)=>{
  dlAxes(pl);
  const rows=dlRows();
  if(!rows.length){pl.text(102,0.5,'run some trials',{col:PAL.inkFaint,cex:1.05});return;}
  rows.forEach(([c,o])=>pl.points([c],[o.k/o.n],{col:PAL.accent,pch:21,cex:1.6}));
}));
$('#dl-fit').appendChild(mkCanvas(265,(pl)=>{
  dlAxes(pl);
  pl.abline({h:0.75,col:PAL.inkFaint,lty:3});
  const fit=dlFit(), rows=dlRows();
  if(!fit){rows.forEach(([c,o])=>pl.points([c],[o.k/o.n],{col:PAL.accent,pch:21,cex:1.6}));
    pl.text(102,0.15,'run enough trials to straddle the half-way line',{col:PAL.inkFaint,cex:0.9});return;}
  const pse=fit.at(0.5),p75=fit.at(0.75);
  pl.rect(pse,0,p75,1,{col:'rgba(74,124,89,.10)',border:null});
  const xs=[],ys=[];for(let c=90;c<=114;c+=0.15){xs.push(c);ys.push(fit.p(c));}
  pl.lines(xs,ys,{col:PAL.accent,lwd:2});
  rows.forEach(([c,o])=>pl.points([c],[o.k/o.n],{col:PAL.accent,pch:21,cex:1.6}));
  pl.abline({v:pse,col:PAL.accent2,lty:2});
  pl.abline({v:p75,col:PAL.accent3,lty:2});
  pl.points([pse,p75],[0.5,0.75],{col:PAL.accent2,cex:1.8});
  pl.text(pse,0.09,'PSE',{col:PAL.accent2,cex:0.88});
  pl.text(p75,0.90,'75%',{col:PAL.accent3,cex:0.88});
}));
['#dl-1','#dl-20','#dl-200'].forEach((s,i)=>
  $(s).addEventListener('click',()=>dlRun([1,20,200][i])));
$('#dl-clear').addEventListener('click',()=>{DL.log=[];DL.n=0;
  DL_C.forEach(c=>{DL.obs[c]={n:0,k:0};});
  $('#dl-c').textContent='—';$('#dl-says').textContent='—';dlRun(0);});

rlRun(0);dlRun(0);
</script>
