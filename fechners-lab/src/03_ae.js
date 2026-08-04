<script>
/* ======================= PART ONE: the absolute threshold ================= */
const AR_SPREAD=Math.sqrt(SUBJ.RL_SD*SUBJ.RL_SD+0.5*0.5);
const AR={set:[],path:null};

function arTake(k){
  for(let i=0;i<k;i++){
    const end=setting(SUBJ.RL,AR_SPREAD);
    AR.path=settlePath(Math.random()<0.5?0.2:6.5,end,46);
    AR.set.push(end);
  }
  arSheet();arCalc();redrawAll();
}
function arSheet(){
  if(!AR.set.length){renderSheet('#ar-sheet',null,[],'no settings yet');return;}
  const shown=AR.set.slice(-12), off=AR.set.length-shown.length;
  const rows=shown.map((v,i)=>({cells:[{t:String(off+i+1),cls:'rowhead'},{t:fmt(v,2),cls:'yes'}]}));
  if(AR.set.length>1)rows.push({cls:'derived',cells:[{t:'mean',cls:'rowhead'},fmt(mean(AR.set),2)]});
  renderSheet('#ar-sheet',['setting','grams'],rows,
    AR.set.length>12?'Last 12 of '+AR.set.length+' settings.':'Every setting so far.');
}
function arCalc(){
  if(AR.set.length<2){renderCalc('#ar-calc',[{lbl:'absolute threshold',
    expr:AR.set.length?'one setting is not enough':'no settings yet',res:'—'}]);return;}
  renderCalc('#ar-calc',[
    {lbl:'settings',expr:sumExpr(AR.set,2),res:AR.set.length+' in all'},
    {lbl:'scatter',expr:'standard deviation',res:gram(sdev(AR.set))},
    {lbl:'absolute threshold',expr:'the mean setting',res:gram(mean(AR.set)),k:'k3',sum:true}
  ]);
  const prev=(loadStore().sim||{}).ae||{};
  saveSim('ae',Object.assign({},prev,{RL:mean(AR.set)}));
}
$('#ar-path').appendChild(mkCanvas(205,(pl)=>{
  pl.setup({xlim:[0,46],ylim:[0,7],mar:[3,4,1.4,1.4]});
  pl.axes({xat:[],yat:[0,2,4,6]});
  pl.axisLabels('time','dial, grams');
  if(!AR.path){pl.text(23,3.4,'take a setting',{col:PAL.inkFaint,cex:1.05});return;}
  pl.abline({h:SUBJ.RL,col:PAL.inkFaint,lty:3});
  pl.lines(AR.path.map((v,i)=>i),AR.path,{col:PAL.accent,lwd:1.6});
  const end=AR.path[AR.path.length-1];
  pl.points([45],[end],{col:PAL.accent2,cex:1.8});
  pl.text(41,end+0.75,'stopped at '+gram(end),{col:PAL.accent2,cex:0.85,adj:1});
}));
$('#ar-plot').appendChild(mkCanvas(190,(pl)=>{
  pl.setup({xlim:[0,6.5],ylim:[0,1],mar:[3,2,1.8,1.4]});
  pl.axes({xat:[0,1,2,3,4,5,6],yat:[]});
  pl.axisLabels('setting, grams','');
  if(!AR.set.length){pl.text(3.2,0.5,'no settings yet',{col:PAL.inkFaint,cex:1.05});return;}
  AR.set.forEach((v,i)=>pl.points([v],[0.22+((i%7)*0.09)],{col:PAL.accent,cex:1.2}));
  if(AR.set.length>1){pl.abline({v:mean(AR.set),col:PAL.accent3,lty:2});
    pl.text(mean(AR.set),0.95,'mean '+gram(mean(AR.set)),{col:PAL.accent3,cex:0.85});}
}));
$('#ar-1').addEventListener('click',()=>arTake(1));
$('#ar-9').addEventListener('click',()=>arTake(9));
$('#ar-clear').addEventListener('click',()=>{AR.set=[];AR.path=null;arSheet();arCalc();redrawAll();});

/* ==================== PART TWO: the difference threshold ================== */
const AD_STD=100, AD_SPREAD=SET_SPREAD_TRUE(100);
const AD={set:[],path:null};

function adTake(k){
  for(let i=0;i<k;i++){
    const end=setting(PSE_TRUE(AD_STD),AD_SPREAD);
    AD.path=settlePath(AD_STD+(Math.random()<0.5?-1:1)*(14+Math.random()*10),end,46);
    AD.set.push(end);
  }
  adSheet();adCalc();redrawAll();
}
function adSheet(){
  if(!AD.set.length){renderSheet('#ad-sheet',null,[],'no settings yet');return;}
  const m=AD.set.length>1?mean(AD.set):null;
  const shown=AD.set.slice(-12), off=AD.set.length-shown.length;
  const rows=shown.map((v,i)=>({cells:[{t:String(off+i+1),cls:'rowhead'},
    {t:fmt(v,2),cls:'yes'},{t:signed(v-AD_STD)},
    {t:m===null?'—':signed(v-m),cls:'eq'}]}));
  if(m!==null){
    rows.push({cls:'derived',cells:[{t:'mean',cls:'rowhead'},fmt(m,2),signed(m-AD_STD),'—']});
    rows.push({cls:'derived',cells:[{t:'average of |·|',cls:'rowhead'},'—','—',fmt(mad(AD.set),2)]});
  }
  renderSheet('#ad-sheet',['setting','grams','from 100 g','from the mean'],rows,
    'The last column is the “average error” the method is named for: how far a setting typically '+
    'falls from the middle of the settings.'+
    (AD.set.length>12?' Last 12 of '+AD.set.length+' shown.':''));
}
function adCalc(){
  if(AD.set.length<3){renderCalc('#ad-calc',[{lbl:'thresholds',
    expr:AD.set.length?'too few settings yet':'no settings yet',res:'—'}]);return;}
  const m=mean(AD.set), ce=m-AD_STD, av=mad(AD.set), dl=MAD_TO_PE*av;
  const se=sdev(AD.set)/Math.sqrt(AD.set.length);
  renderCalc('#ad-calc',[
    {lbl:'settings',expr:AD.set.length+' in all',res:''},
    {lbl:'mean setting',expr:sumExpr(AD.set,1),res:gram(m),k:'k2'},
    {lbl:'point of subjective equality',expr:'the mean setting',res:gram(m),k:'k2'},
    {lbl:'constant error',expr:f2(m)+' &minus; 100.00',res:signed(ce)+' g',k:'k2'},
    {lbl:'average error',expr:'mean distance of a setting from '+f2(m),res:gram(av)},
    {lbl:'difference threshold',expr:'0.8454 × '+f2(av),res:gram(dl),k:'k3',sum:true},
    {lbl:'',expr:'uncertainty of the mean',res:'± '+gram(se)}
  ]);
  const prev=(loadStore().sim||{}).ae||{};
  saveSim('ae',Object.assign({},prev,
    {DL:dl,PSE:m,CE:ce,avgErr:av,sd:sdev(AD.set),n:AD.set.length}));
}
$('#ad-path').appendChild(mkCanvas(205,(pl)=>{
  pl.setup({xlim:[0,46],ylim:[80,122],mar:[3,4,1.4,1.4]});
  pl.axes({xat:[],yat:[85,95,105,115]});
  pl.axisLabels('time','dial, grams');
  if(!AD.path){pl.text(23,101,'take a setting',{col:PAL.inkFaint,cex:1.05});return;}
  pl.abline({h:AD_STD,col:PAL.ink,lty:2});
  pl.lines(AD.path.map((v,i)=>i),AD.path,{col:PAL.accent,lwd:1.6});
  const end=AD.path[AD.path.length-1];
  pl.points([45],[end],{col:PAL.accent2,cex:1.8});
  pl.text(41,end+3.4,'stopped at '+gram(end),{col:PAL.accent2,cex:0.85,adj:1});
}));
$('#ad-plot').appendChild(mkCanvas(205,(pl)=>{
  pl.setup({xlim:[82,120],ylim:[0,1],mar:[3,2,1.8,1.4]});
  pl.axes({xat:[85,90,95,100,105,110,115],yat:[]});
  pl.axisLabels('setting, grams','');
  pl.abline({v:AD_STD,col:PAL.ink,lty:2});
  if(!AD.set.length){pl.text(101,0.5,'no settings yet',{col:PAL.inkFaint,cex:1.05});return;}
  if(AD.set.length>1){const m=mean(AD.set),pe=PE_Z*sdev(AD.set);
    pl.rect(m-pe,0,m+pe,1,{col:'rgba(74,124,89,.12)',border:null});}
  AD.set.forEach((v,i)=>pl.points([v],[0.2+((i%9)*0.075)],{col:PAL.accent,cex:1.1}));
  if(AD.set.length>1){pl.abline({v:mean(AD.set),col:PAL.accent3,lty:2});
    pl.text(mean(AD.set),0.95,'mean '+gram(mean(AD.set)),{col:PAL.accent3,cex:0.85});}
}));
$('#ad-1').addEventListener('click',()=>adTake(1));
$('#ad-9').addEventListener('click',()=>adTake(9));
$('#ad-30').addEventListener('click',()=>adTake(30));
$('#ad-200').addEventListener('click',()=>adTake(200));
$('#ad-clear').addEventListener('click',()=>{AD.set=[];AD.path=null;adSheet();adCalc();redrawAll();});

arSheet();arCalc();adSheet();adCalc();
</script>
