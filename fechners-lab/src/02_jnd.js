<script>
/* ======================= PART ONE: the absolute threshold ================= */
const A_STEP=0.25, A_TOP=6.0, A_SHOW=12;
const A={series:[],cur:null};

const aNew=(dir)=>({dir,rows:[],cross:null,w:dir==='desc'?A_TOP:0});
function aStep(s){
  if(s.cross!=null)return;
  const yes=feels(s.w);
  s.rows.push({w:s.w,yes});
  const flipped=(s.dir==='desc')?!yes:yes;
  if(flipped){s.cross=Math.max(0,Math.min(A_TOP,
    (s.dir==='desc')?s.w+A_STEP/2:s.w-A_STEP/2));return;}
  s.w+=(s.dir==='desc')?-A_STEP:A_STEP;
  if(s.w<0||s.w>A_TOP)s.cross=Math.max(0,Math.min(A_TOP,s.w));
}
function aFinish(s){let g=0;while(s.cross==null&&g++<200)aStep(s);return s;}
const aNextDir=()=>A.series.length%2===0?'desc':'asc';
function aRun(dir){const s=aNew(dir);aFinish(s);A.series.push(s);return s;}
function aEnsure(){if(!A.cur||A.cur.cross!=null){A.cur=aNew(aNextDir());A.series.push(A.cur);}return A.cur;}
const aCross=(d)=>A.series.filter(s=>s.dir===d&&s.cross!=null).map(s=>s.cross);

function aUpd(){
  const s=A.cur, last=s&&s.rows.length?s.rows[s.rows.length-1]:null;
  $('#a-dir').textContent=s?(s.dir==='desc'?'descending':'ascending'):'—';
  $('#a-w').textContent=last?fmt(last.w,2)+' g':(s?fmt(s.w,2)+' g':'—');
  $('#a-says').textContent=last?(last.yes?'“I feel it”':'“nothing”'):'—';
  $('#a-cross').textContent=s&&s.cross!=null?gram(s.cross):'—';
  aSheet();aCalc();redrawAll();
}
function aSheet(){
  const shown=A.series.slice(-8);
  if(!shown.length){renderSheet('#a-sheet',null,[],'no series yet');return;}
  const levels=[];for(let w=A_TOP;w>=0;w-=A_STEP)levels.push(+fmt(w,2));
  const used=levels.filter(w=>shown.some(s=>s.rows.some(r=>Math.abs(r.w-w)<1e-6)));
  const rows=used.map(w=>({cells:[{t:fmt(w,2),cls:'rowhead'}].concat(
    shown.map(s=>{const r=s.rows.find(r=>Math.abs(r.w-w)<1e-6);
      if(!r)return{t:'·',cls:'blank'};
      const near=s.cross!=null&&s.rows.indexOf(r)>=s.rows.length-2;
      return{t:r.yes?'+':'−',cls:(r.yes?'yes':'no')+(near?' brack':'')};}))}));
  rows.push({cls:'derived',cells:[{t:'crossing',cls:'rowhead'}].concat(
    shown.map(s=>s.cross!=null?fmt(s.cross,2):'—'))});
  renderSheet('#a-sheet',['g'].concat(shown.map(s=>s.dir==='asc'?'up':'down')),rows,
    'Plus is “felt it”. The two shaded cells in each column are the steps his answer changed '+
    'between; the crossing is their midpoint.');
}
function aCalc(){
  const up=aCross('asc'),dn=aCross('desc'),all=up.concat(dn);
  if(!all.length){renderCalc('#a-calc',[{lbl:'absolute threshold',expr:'no series yet',res:'—'}]);return;}
  const lines=[];
  if(up.length)lines.push({lbl:'ascending mean',expr:sumExpr(up,2),res:gram(mean(up)),k:'k1'});
  if(dn.length)lines.push({lbl:'descending mean',expr:sumExpr(dn,2),res:gram(mean(dn)),k:'k2'});
  if(up.length&&dn.length)lines.push({lbl:'difference',expr:'ascending &minus; descending',
    res:signed(mean(up)-mean(dn))+' g'});
  lines.push({lbl:'absolute threshold',expr:'mean of all '+all.length+' crossings',
    res:gram(mean(all)),k:'k3',sum:true});
  renderCalc('#a-calc',lines);
  if(up.length&&dn.length){
    const prev=(loadStore().sim||{}).jnd||{};
    saveSim('jnd',Object.assign({},prev,{RL:mean(all)}));
  }
}
$('#a-ladder').appendChild(mkCanvas(300,(pl)=>{
  const shown=A.series.slice(-A_SHOW), n=Math.max(shown.length,5);
  pl.setup({xlim:[-0.5,n-0.5],ylim:[0,A_TOP],mar:[3.4,4,1.6,1.4]});
  pl.axes({xat:[],yat:[0,1,2,3,4,5,6]});
  pl.axisLabels('series','weight, grams');
  if(!shown.length){pl.text((n-1)/2,A_TOP/2,'present a step to begin',{col:PAL.inkFaint,cex:1.05});return;}
  shown.forEach((s,i)=>{
    const col=s.dir==='asc'?PAL.accent:PAL.accent2;
    pl.segments(i,0,i,A_TOP,{col:PAL.ruleSoft});
    s.rows.forEach(r=>pl.points([i],[r.w],{col,pch:r.yes?1:21,cex:1.4}));
    if(s.cross!=null)pl.segments(i-0.16,s.cross,i+0.16,s.cross,{col:PAL.accent3,lwd:2.4});
    pl.text(i,-0.22,s.dir==='asc'?'up':'down',{col:PAL.inkFaint,cex:0.75});
  });
  pl.text(shown.length>1?0.6:0,A_TOP*0.98,
    A.series.length>A_SHOW?'last '+A_SHOW+' of '+A.series.length+' series':'filled = felt it',
    {col:PAL.inkFaint,cex:0.8,adj:0});
}));
$('#a-cross-plot').appendChild(mkCanvas(205,(pl)=>{
  const up=aCross('asc'),dn=aCross('desc');
  pl.setup({xlim:[0,A_TOP],ylim:[0,1],mar:[3.4,7,1.6,1.4]});
  pl.axes({xat:[0,1,2,3,4,5,6],yat:[]});
  pl.axisLabels('crossing, grams','');
  pl.axisPlain(2,[0.68,0.30],['ascending','descending'],{cex:0.9});
  if(!up.length&&!dn.length){pl.text(A_TOP/2,0.5,'no crossings yet',{col:PAL.inkFaint,cex:1.05});return;}
  [[up,0.68,PAL.accent],[dn,0.30,PAL.accent2]].forEach(([a,y,col])=>{
    a.forEach((v,i)=>pl.points([v],[y+((i%3)-1)*0.055],{col,pch:21,cex:1.4}));
    if(a.length)pl.segments(mean(a),y-0.16,mean(a),y+0.16,{col,lwd:2});
  });
  const all=up.concat(dn);
  if(all.length){pl.abline({v:mean(all),col:PAL.accent3,lty:2});
    pl.text(mean(all),0.97,'mean '+gram(mean(all)),{col:PAL.accent3,cex:0.85});}
}));
$('#a-step').addEventListener('click',()=>{aStep(aEnsure());aUpd();});
$('#a-finish').addEventListener('click',()=>{aFinish(aEnsure());aUpd();});
$('#a-new').addEventListener('click',()=>{A.cur=aNew(aNextDir());A.series.push(A.cur);aUpd();});
$('#a-run10').addEventListener('click',()=>{for(let i=0;i<10;i++)aRun(aNextDir());
  A.cur=A.series[A.series.length-1];aUpd();});
$('#a-clear').addEventListener('click',()=>{A.series=[];A.cur=null;aUpd();});

/* ==================== PART TWO: the difference threshold ================== */
const B_STEP=1.0, B_LO=84, B_HI=120, B_SHOW=10, STD_B=100;
const B={sweeps:[],cur:null,caution:SUBJ.CAUTION};

const bNew=(dir)=>({dir,rows:[],lo:null,hi:null,done:false,
  w:dir==='asc'?B_LO:B_HI,prev:null});
function bStep(s){
  if(s.done)return;
  const say=compare(s.w,STD_B,B.caution);
  s.rows.push({w:s.w,say});
  if(s.dir==='asc'){
    if(s.prev==='less'&&say==='equal'&&s.lo===null)s.lo=s.w-B_STEP/2;
    if(s.prev==='equal'&&say==='greater'&&s.hi===null)s.hi=s.w-B_STEP/2;
  }else{
    if(s.prev==='greater'&&say==='equal'&&s.hi===null)s.hi=s.w+B_STEP/2;
    if(s.prev==='equal'&&say==='less'&&s.lo===null)s.lo=s.w+B_STEP/2;
  }
  s.prev=say;
  s.w+=(s.dir==='asc')?B_STEP:-B_STEP;
  if(s.w<B_LO||s.w>B_HI||(s.lo!==null&&s.hi!==null))s.done=true;
}
function bFinish(s){let g=0;while(!s.done&&g++<200)bStep(s);return s;}
const bNextDir=()=>B.sweeps.length%2===0?'asc':'desc';
function bRun(dir){const s=bNew(dir);bFinish(s);
  if(s.lo!==null&&s.hi!==null&&s.hi>s.lo)B.sweeps.push(s);return s;}
function bEnsure(){if(!B.cur||B.cur.done)B.cur=bNew(bNextDir());return B.cur;}
const bLos=()=>B.sweeps.map(s=>s.lo), bHis=()=>B.sweeps.map(s=>s.hi);
function bShown(){const l=B.sweeps.slice();
  if(B.cur&&!B.cur.done&&B.cur.rows.length)l.push(B.cur);return l.slice(-B_SHOW);}
const SAYCOL={less:PAL.accent,equal:PAL.accent3,greater:PAL.accent2};

function bUpd(){
  const s=B.cur,last=s&&s.rows.length?s.rows[s.rows.length-1]:null;
  $('#b-dir').textContent=s?(s.dir==='asc'?'ascending':'descending'):'—';
  $('#b-w').textContent=last?fmt(last.w,1)+' g':(s?fmt(s.w,1)+' g':'—');
  $('#b-says').textContent=last?({less:'“lighter”',equal:'“the same”',greater:'“heavier”'})[last.say]:'—';
  $('#b-flips').textContent=s?((s.lo!==null?1:0)+(s.hi!==null?1:0))+' of 2':'—';
  if(s&&s.done&&s.lo!==null&&s.hi!==null&&B.sweeps.indexOf(s)<0)B.sweeps.push(s);
  bSheet();bCalc();redrawAll();
}
function bSheet(){
  const shown=bShown().slice(-7);
  if(!shown.length){renderSheet('#b-sheet',null,[],'no sweeps yet');return;}
  const levels=[];for(let w=B_HI;w>=B_LO;w-=B_STEP)levels.push(+fmt(w,1));
  const used=levels.filter(w=>shown.some(s=>s.rows.some(r=>Math.abs(r.w-w)<1e-6)));
  const SYM={less:'−',equal:'=',greater:'+'},CLS={less:'lt',equal:'eq',greater:'gt'};
  const rows=used.map(w=>({cells:[{t:fmt(w,0),cls:'rowhead'}].concat(
    shown.map(s=>{const r=s.rows.find(r=>Math.abs(r.w-w)<1e-6);
      return r?{t:SYM[r.say],cls:CLS[r.say]}:{t:'·',cls:'blank'};}))}));
  rows.push({cls:'derived',cells:[{t:'lower',cls:'rowhead'}].concat(
    shown.map(s=>s.lo!=null?fmt(s.lo,1):'—'))});
  rows.push({cls:'derived',cells:[{t:'upper',cls:'rowhead'}].concat(
    shown.map(s=>s.hi!=null?fmt(s.hi,1):'—'))});
  renderSheet('#b-sheet',['g'].concat(shown.map(s=>s.dir==='asc'?'up':'down')),rows,
    'Minus is “lighter”, equals “the same”, plus “heavier”. Each sweep yields two crossings.');
}
function bCalc(){
  if(!B.sweeps.length){renderCalc('#b-calc',[{lbl:'thresholds',
    expr:'no completed sweeps yet',res:'—'}]);return;}
  const Ll=mean(bLos()),Lu=mean(bHis());
  const iu=Lu-Ll, dl=iu/2, pse=(Lu+Ll)/2, ce=pse-STD_B;
  renderCalc('#b-calc',[
    {lbl:'lower limit',expr:sumExpr(bLos(),1),res:gram(Ll),k:'k1'},
    {lbl:'upper limit',expr:sumExpr(bHis(),1),res:gram(Lu),k:'k2'},
    {lbl:'interval of uncertainty',expr:f2(Lu)+' &minus; '+f2(Ll),res:gram(iu)},
    {lbl:'difference threshold',expr:f2(iu)+' / 2',res:gram(dl),k:'k3'},
    {lbl:'point of subjective equality',expr:'( '+f2(Lu)+' + '+f2(Ll)+' ) / 2',res:gram(pse),k:'k2'},
    {lbl:'constant error',expr:f2(pse)+' &minus; 100.00',res:signed(ce)+' g',k:'k2',sum:true}
  ]);
  const prev=(loadStore().sim||{}).jnd||{};
  saveSim('jnd',Object.assign({},prev,{DL:dl,IU:iu,PSE:pse,CE:ce,sweeps:B.sweeps.length}));
}
$('#b-ladder').appendChild(mkCanvas(300,(pl)=>{
  const shown=bShown(),n=Math.max(shown.length,5);
  pl.setup({xlim:[-0.5,n-0.5],ylim:[B_LO,B_HI],mar:[3.4,4,1.6,1.4]});
  pl.axes({xat:[],yat:[86,92,98,104,110,116]});
  pl.axisLabels('sweep','comparison, grams');
  if(!shown.length){pl.text((n-1)/2,STD_B,'present a step to begin',{col:PAL.inkFaint,cex:1.05});return;}
  pl.abline({h:STD_B,col:PAL.ink,lty:2});
  shown.forEach((s,i)=>{
    pl.segments(i,B_LO,i,B_HI,{col:PAL.ruleSoft});
    s.rows.forEach(r=>pl.points([i],[r.w],{col:SAYCOL[r.say],cex:1.35}));
    [s.lo,s.hi].forEach(v=>{if(v!=null)pl.segments(i-0.16,v,i+0.16,v,{col:PAL.accent4,lwd:2.4});});
    pl.text(i,B_LO+0.9,s.dir==='asc'?'up':'down',{col:PAL.inkFaint,cex:0.75});
  });
}));
$('#b-band').appendChild(mkCanvas(220,(pl)=>{
  const n=Math.max(B.sweeps.length,1);
  pl.setup({xlim:[B_LO,B_HI],ylim:[0,n],mar:[3.4,4,1.8,1.4]});
  pl.axes({xat:[86,92,98,104,110,116],yat:[]});
  pl.axisLabels('comparison, grams','');
  if(!B.sweeps.length){pl.text((B_LO+B_HI)/2,n/2,'no completed sweeps yet',{col:PAL.inkFaint,cex:1.05});return;}
  const show=B.sweeps.slice(-14);
  show.forEach((s,i)=>{
    const y=i+0.5;
    pl.rect(s.lo,y-0.28,s.hi,y+0.28,{col:'rgba(74,124,89,.16)',border:null});
    pl.points([s.lo],[y],{col:PAL.accent,cex:1.2});
    pl.points([s.hi],[y],{col:PAL.accent2,cex:1.2});
  });
  const Ll=mean(bLos()),Lu=mean(bHis());
  pl.abline({v:Ll,col:PAL.accent,lty:2});
  pl.abline({v:Lu,col:PAL.accent2,lty:2});
  pl.abline({v:(Ll+Lu)/2,col:PAL.accent4,lty:3});
  pl.abline({v:STD_B,col:PAL.ink,lty:2});
  pl.text(Ll,n*0.97,'lower '+f1(Ll),{col:PAL.accent,cex:0.82});
  pl.text(Lu,n*0.97,'upper '+f1(Lu),{col:PAL.accent2,cex:0.82});
}));
$('#b-step').addEventListener('click',()=>{bStep(bEnsure());bUpd();});
$('#b-finish').addEventListener('click',()=>{bFinish(bEnsure());bUpd();});
$('#b-run10').addEventListener('click',()=>{for(let i=0;i<10;i++)bRun(bNextDir());B.cur=null;bUpd();});
$('#b-clear').addEventListener('click',()=>{B.sweeps=[];B.cur=null;bUpd();});

/* the caution slider changes an instruction, not a sense */
$('#b-caution').addEventListener('input',(e)=>{B.caution=+e.target.value;
  $('#b-cautionv').textContent=fmt(B.caution,2)+' × spread';});
$('#b-cautionv').textContent=fmt(B.caution,2)+' × spread';
$('#b-redo').addEventListener('click',()=>{
  B.sweeps=[];B.cur=null;
  for(let i=0;i<20;i++)bRun(bNextDir());
  bUpd();
  const iu=mean(bHis())-mean(bLos());
  renderCalc('#b-caution-out',[
    {lbl:'his senses',expr:'sensory spread, unchanged',res:gram(sigD(100))},
    {lbl:'the instruction',expr:'say “the same” up to',res:fmt(B.caution,2)+' × spread'},
    {lbl:'difference threshold',expr:'half the interval of uncertainty',
     res:gram(iu/2),k:'k3',sum:true}
  ]);
});

aUpd();bUpd();
</script>
