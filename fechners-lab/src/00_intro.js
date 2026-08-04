<script>
/* the subject's parameters, stated plainly */
renderSheet('#subj-sheet',
  ['', 'quantity', 'value', 'what it is'],
  [
    {cells:[{t:'senses',cls:'rowhead'},'absolute threshold',
            {t:gram(SUBJ.RL),cls:'yes'},'the weight at which he begins to feel anything']},
    {cells:[{t:'',cls:'rowhead'},'sensory spread at 100 g',
            {t:gram(sigD(100)),cls:'yes'},'how much a felt comparison varies from trial to trial']},
    {cls:'rule',cells:[{t:'habits',cls:'rowhead'},'constant error',
            {t:gram(SUBJ.CE),cls:'gt'},'his "equal" sits this far above the standard']},
    {cells:[{t:'',cls:'rowhead'},'caution',
            {t:fmt(SUBJ.CAUTION,2)+' × spread',cls:'gt'},
            'how sure he must be before saying "greater" rather than "equal"']},
    {cells:[{t:'',cls:'rowhead'},'unsteady hand',
            {t:gram(SUBJ.MOTOR),cls:'gt'},'extra scatter when he moves the weight himself']}
  ],
  'Only the first two are senses. Caution is a matter of instruction, and the unsteady hand only '+
  'enters when he works the dial, so the three methods are not all measuring the same thing.');

/* ---- his detection curve, with observed proportions on top ---- */
const IN_W=[0.5,1,1.5,2,2.5,3,3.5,4,4.5,5,6];
const IN={obs:{}};
$('#in-plot').appendChild(mkCanvas(250,(pl)=>{
  pl.setup({xlim:[0,6.4],ylim:[0,1],mar:[3.4,4,1.4,1.4]});
  pl.axes({xat:[0,1,2,3,4,5,6],yat:[0,0.25,0.5,0.75,1]});
  pl.axisLabels('weight on the palm, grams','chance he feels it');
  pl.abline({h:0.5,col:PAL.inkFaint,lty:3});
  const xs=[],ys=[];
  for(let w=0;w<=6.4;w+=0.05){xs.push(w);ys.push(pnorm((w-SUBJ.RL)/SUBJ.RL_SD));}
  pl.lines(xs,ys,{col:PAL.accent,lwd:2});
  pl.abline({v:SUBJ.RL,col:PAL.accent3,lty:2});
  pl.text(SUBJ.RL,1.04,'absolute threshold '+gram(SUBJ.RL),{col:PAL.accent3,cex:0.85});
  const ks=Object.keys(IN.obs);
  ks.forEach((w)=>{const o=IN.obs[w];
    pl.points([+w],[o.k/o.n],{col:PAL.accent2,pch:21,cex:1.5});});
  if(!ks.length)pl.text(3.2,0.14,'the curve is what he is; run some trials to see what that looks like',
    {col:PAL.inkFaint,cex:0.9});
}));
$('#in-run').addEventListener('click',()=>{
  IN_W.forEach(w=>{const k=rbinom(40,pnorm((w-SUBJ.RL)/SUBJ.RL_SD));
    IN.obs[w]=IN.obs[w]||{n:0,k:0};IN.obs[w].n+=40;IN.obs[w].k+=k;});
  redrawAll();
});
$('#in-clear').addEventListener('click',()=>{IN.obs={};redrawAll();});
</script>
