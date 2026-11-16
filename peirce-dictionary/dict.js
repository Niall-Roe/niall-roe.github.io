// Peirce's dictionary entries: the Century (data/cd) and Baldwin (data/dpp) in one list. One row a headword;
// a headword in both dictionaries opens both side by side. Search: headwords first, then entries whose text holds
// every word typed (the last word as a prefix), as the Century page's search does.
(function(){
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fold=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const keyOf=h=>fold(h).replace(/\s*\(.*?\)\s*/g,' ').replace(/[^a-z0-9' -]/g,'').replace(/\s+/g,' ').trim();
const L0=k=>{const c=k.charAt(0); return c>='a'&&c<='z'?c:'#';};
let CD=[], CDSR=null, DP=[], DPSR={}, ROWS=[], BYKEY=new Map(), hits=null, cur=null; const CH={};
function hh(){document.documentElement.style.setProperty('--hh',$('header').offsetHeight+'px');}

Promise.all([fetch('data/cd/index.json').then(r=>r.json()), fetch('data/dpp/entries.json').then(r=>r.json()),
             fetch('data/dpp/search.json').then(r=>r.json())]).then(([ix,dp,ds])=>{
  CD=ix.entries; DP=dp.entries; DPSR=ds;
  CD.forEach((r,i)=>add(keyOf(r[1]), r[1], 'cd', i));
  DP.forEach((x,i)=>add(keyOf(x.h), x.h, 'dpp', i));
  ROWS=[...BYKEY.values()].sort((a,b)=>a.k<b.k?-1:a.k>b.k?1:0);
  ROWS.forEach((r,i)=>r.n=i);
  init();
});
function add(k,label,src,i){ if(!k) return; let r=BYKEY.get(k);
  if(!r){r={k:k,label:label,cd:[],dpp:[]}; BYKEY.set(k,r);} r[src].push(i); }

function init(){
  const have=new Set(ROWS.map(r=>L0(r.k)));
  'abcdefghijklmnopqrstuvwxyz'.split('').forEach(L=>{const b=document.createElement('button'); b.textContent=L.toUpperCase();
    b.disabled=!have.has(L); b.onclick=()=>{ if(hits){$('#q').value=''; hits=null; render();}
      const t=document.getElementById('L-'+L); if(t) t.scrollIntoView({block:'start'});}; $('#az').appendChild(b);});
  $('#fboth').addEventListener('change',()=>{ if($('#fboth').checked){$('#fcd').checked=true; $('#fdpp').checked=true;} render(); if(cur) open(cur,true);});
  ['#fcd','#fdpp'].forEach(s=>$(s).addEventListener('change',()=>{ if(!$(s).checked) $('#fboth').checked=false; if(!$('#fcd').checked&&!$('#fdpp').checked) $(s==='#fcd'?'#fdpp':'#fcd').checked=true; render(); if(cur) open(cur,true);}));
  const ab=$('#about'); try{ if(localStorage.getItem('dictAbout')==='closed') ab.open=false; }catch(e){}
  ab.addEventListener('toggle',()=>{ try{localStorage.setItem('dictAbout',ab.open?'open':'closed');}catch(e){} hh(); });
  hh(); window.addEventListener('resize',hh); render();
  const k=new URLSearchParams(location.hash.slice(1)).get('k'); open(k&&BYKEY.has(k)?k:'analogy');
  window.addEventListener('hashchange',()=>{const k=new URLSearchParams(location.hash.slice(1)).get('k'); if(k&&k!==cur&&BYKEY.has(k)) open(k);});
}
const showCD=()=>$('#fcd').checked, showDP=()=>$('#fdpp').checked;
const visible=r=>$('#fboth').checked?(r.cd.length&&r.dpp.length):((showCD()&&r.cd.length)||(showDP()&&r.dpp.length));

function render(){
  const rs=(hits||ROWS).filter(visible); let last='', h='';
  rs.forEach(r=>{ const L=L0(r.k); if(!hits&&L!==last){h+='<div class="lt" id="L-'+L+'"></div>'; last=L;}
    h+='<a href="#k='+encodeURIComponent(r.k)+'" data-k="'+esc(r.k)+'"><span class="hw">'+esc(r.label)+'</span>'+
      '<span class="c1">'+(r.cd.length&&showCD()?'<span class="tag cd">CD</span>':'')+'</span>'+
      '<span class="c2">'+(r.dpp.length&&showDP()?'<span class="tag dpp">Baldwin</span>':'')+'</span></a>'; });
  $('#list').innerHTML=h||'<div class="none">No entries</div>';
  $('#count').textContent=rs.length.toLocaleString()+(rs.length===1?' headword':' headwords');
  $('#list').querySelectorAll('a').forEach(a=>a.onclick=ev=>{ev.preventDefault(); open(a.dataset.k);});
  mark();
}
function mark(){ let on=null; document.querySelectorAll('#list a').forEach(a=>{const k=a.dataset.k===cur; a.classList.toggle('on',k); if(k) on=a;});
  if(on){const r=on.getBoundingClientRect(), b=$('#list').getBoundingClientRect(); if(r.top<b.top||r.bottom>b.bottom) on.scrollIntoView({block:'center'});} }

let qt; $('#q').addEventListener('input',()=>{clearTimeout(qt); qt=setTimeout(search,220);});
function search(){
  const q=fold($('#q').value.trim()); if(!q){hits=null; render(); return;}
  const ws=q.match(/[a-z]+/g)||[]; if(!ws.length){hits=[]; render(); return;}
  const head=ROWS.filter(r=>r.k.includes(q)||fold(r.label).includes(q));
  const go=()=>{
    // the Century: its word index (hex row numbers); Baldwin: each entry's word list
    let cdset=null; ws.forEach((w,k)=>{ const s=new Set(), last=k===ws.length-1;
      if(last&&w.length>=3){ for(const key in CDSR){ if(key.startsWith(w)) CDSR[key].split(',').forEach(x=>s.add(parseInt(x,16))); } }
      else if(CDSR[w]) CDSR[w].split(',').forEach(x=>s.add(parseInt(x,16)));
      cdset=cdset===null?s:new Set([...cdset].filter(x=>s.has(x))); });
    const dpset=new Set(); DP.forEach((x,i)=>{ const t=' '+(DPSR[x.id]||'')+' ';
      if(ws.every((w,k)=>k===ws.length-1&&w.length>=3?t.includes(' '+w):t.includes(' '+w+' '))) dpset.add(i); });
    const seen=new Set(head.map(r=>r.k)), more=[];
    ROWS.forEach(r=>{ if(seen.has(r.k)) return;
      if(r.cd.some(i=>cdset&&cdset.has(i))||r.dpp.some(i=>dpset.has(i))) more.push(r); });
    hits=head.concat(more); render(); };
  if(CDSR) go(); else { hits=head; render(); fetch('data/cd/search.json').then(r=>r.json()).then(d=>{CDSR=d; go();}); }
}

function chunk(L){ const f=L==='#'?'other':L; if(CH[f]) return Promise.resolve(CH[f]);
  return fetch('data/cd/'+f+'.json').then(r=>r.json()).then(d=>(CH[f]=d)); }
function cdLetter(r){ return r[3]; }
function cols(c){ return c.map(x=>'p. '+x[0]+', col. '+x[1]).filter((v,i,a)=>a.indexOf(v)===i).join('; '); }
function tex(root){ if(!window.katex) return; root.querySelectorAll('.tex').forEach(el=>{
  try{katex.render(el.textContent, el, {displayMode: el.classList.contains('d'), throwOnError:false});}catch(e){} }); }

async function open(k, keep){
  const r=BYKEY.get(k); if(!r) return; cur=k; mark();
  if(!keep) history.replaceState(null,'','#k='+encodeURIComponent(k));
  const parts=[];
  if(r.cd.length&&showCD()){
    const es=await Promise.all(r.cd.map(i=>chunk(cdLetter(CD[i])).then(d=>d[CD[i][0]])));
    let h='<div class="dh"><span class="tag cd">CD</span>The Century Dictionary</div>';
    es.forEach(x=>{ if(!x) return; h+='<div class="meta">'+esc(cols(x.c||[[x.p,'?']]))+'</div><div class="ent">'+x.html+'</div>'; });
    parts.push(h);
  }
  if(r.dpp.length&&showDP()){
    let h='<div class="dh"><span class="tag dpp">Baldwin</span>Baldwin\'s Dictionary of Philosophy and Psychology</div>';
    r.dpp.forEach(i=>{ const x=DP[i];
      h+='<div class="meta">'+esc(x.h)+' · vol. '+x.v+' ('+x.y+'), p. '+x.pg.join(', ')+(x.co.length?' · with '+esc(x.co.join(', ')):'')+'</div>';
      const many=x.parts.length>1;
      x.parts.forEach((p,j)=>{ h+=(many?'<div class="ph">Part '+(j+1)+' · signed '+esc(p.s)+'</div>':'')+'<div class="ent">'+p.html+'</div>'; });
      if(x.o.length) h+='<div class="note">Online: '+x.o.map(o=>'<a href="'+esc(o.u)+'" target="_blank" rel="noopener noreferrer">'+esc(o.s)+'</a>').join(' · ')+'</div>';
    });
    parts.push(h);
  }
  if(cur!==k) return;
  $('#entry').innerHTML=parts.length?'<div class="cols'+(parts.length>1?' two':' one')+'">'+parts.map(p=>'<section>'+p+'</section>').join('')+'</div>'
    :'<p class="empty">Not in the dictionaries chosen above.</p>';
  tex($('#entry')); hilite($('#entry')); $('#entry').scrollTop=0;
  const m=$('#entry mark'); if(m) m.scrollIntoView({block:'center'});
}
// the words searched for, marked in the entry (the last word as a prefix)
function hilite(root){
  const ws=(fold($('#q').value.trim()).match(/[a-z]+/g)||[]); if(!ws.length) return;
  const re=new RegExp('\\b('+ws.map((w,k)=>k===ws.length-1&&w.length>=3?w+'[a-z]*':w).join('|')+')\\b','gi');
  const tw=document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const nodes=[];
  while(tw.nextNode()){ const n=tw.currentNode; if(n.parentElement.closest('.katex')) continue; nodes.push(n); }
  nodes.forEach(n=>{ const t=n.nodeValue, f=t; re.lastIndex=0; if(!re.test(f)) return; re.lastIndex=0;
    const frag=document.createDocumentFragment(); let i=0, m;
    while((m=re.exec(f))){ frag.append(t.slice(i,m.index)); const k=document.createElement('mark'); k.textContent=t.slice(m.index,m.index+m[0].length); frag.append(k); i=m.index+m[0].length; }
    frag.append(t.slice(i)); n.replaceWith(frag); });
}
})();
