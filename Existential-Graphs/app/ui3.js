/* =========================== CONVENTIONS & RULES =========================== */
const CONVENTIONS = [
 ['C1','The sheet of assertion in all of its parts is a graph.','4.396, 397'],
 ['C2','Whatever is scribed on the sheet of assertion is asserted to be true of the universe represented by that sheet.','4.397'],
 ['C3','Graphs scribed on different parts of the sheet of assertion are all asserted to be true.','4.433'],
 ['C4','The scroll is the sign of a conditional proposition de inesse.','4.401, 435, 437'],
 ['C5','The empty cut is the pseudograph; and the cut precisely denies its contents.','4.467'],
 ['C6','The scribing of a heavy dot or unattached line on the sheet of assertion denotes the existence of a single, individual (but otherwise undesignated) object in the universe of discourse. And it is always permitted to scribe such a dot or line on the sheet.','4.404, 405, 417, 559, 567'],
 ['C7','A heavy line, called a line of identity, shall be a graph asserting the numerical identity of the individuals denoted by its two extremities.','4.406, 444'],
 ['C8','A branching line of identity with n number of branches will be used to express the identity of the n individuals denoted by its n extremities.','4.446, 561'],
 ['C9','Points on a cut shall be considered to lie outside the area of that cut.','4.407, 450']
];
const RULES = [
 ['R1','The rule of erasure.','Any evenly enclosed graph and any evenly enclosed portion of a line of identity may be erased.','4.492(1), 505'],
 ['R2','The rule of insertion.','Any graph may be scribed on any oddly enclosed area, and two lines of identity (or portions of lines) oddly enclosed on the same area, may be joined.','4.492(1), 505'],
 ['R3','The rule of iteration.','If a graph P occurs on SA or in a nest of cuts, it may be scribed on any area not part of P, which is contained by {P}. Consequently, (a) a branch with a loose end may be added to any line of identity, provided that no crossing of cuts results from this addition; (b) any loose end of a ligature may be extended inwards through cuts; (c) any ligature thus extended may be joined to the corresponding ligature of an iterated instance of a graph; and (d) a cycle may be formed by joining, by inward extensions, the two loose ends that are the innermost parts of a ligature.','4.492(2), 506'],
 ['R4','The rule of deiteration.','Any graph whose occurrence could be the result of iteration may be erased. Consequently, (a) a branch with a loose end may be retracted into any line of identity, provided that no crossing of cuts occurs in the retraction; (b) any loose end of a ligature may be retracted outwards through cuts; and (c) any cyclical part of a ligature may be cut at its inmost part.','4.492(2), 506'],
 ['R5','The rule of the double cut.','The double cut may be inserted around or removed (where it occurs) from any graph on any area. And these transformations will not be prevented by the presence of ligatures passing from outside the outer cut to inside the inner cut.','4.492(4), 508, 567']
];
$('#n-conv').innerHTML = CONVENTIONS.map(c =>
  '<dt>'+c[0]+'</dt><dd>'+esc(c[1])+' <span class="cite">CP '+c[2]+'</span></dd>').join('') +
  '<dd class="cite" style="margin-top:14px">Quoted from Roberts 1973, Appendix 3, pp. 137–138. ' +
  'Gamma conventions C10 and C11, and the changes occasioned by the tinctures, are not implemented here.</dd>';
$('#n-rules').innerHTML = RULES.map(r =>
  '<dt>'+r[0]+' — '+esc(r[1])+'</dt><dd>'+esc(r[2])+' <span class="cite">CP '+r[3]+'</span></dd>').join('') +
  '<dd class="cite" style="margin-top:14px">Roberts 1973, Appendix 3, p. 138. All five are implemented, '+
  'including clauses (a)–(d) of R3 and (a)–(c) of R4.</dd>';

$('#n-about').innerHTML = [
 '<p><b>Reading a graph.</b> The interpretation is <i>endoporeutic</i>: it proceeds inwards, ',
 'so that "a nest sucks the meaning from without inwards unto its centre, as a sponge absorbs ',
 'water" (Peirce, Ms 650, quoted Roberts p. 39 n. 13). Each area is read as a conjunction; ',
 'each cut denies its contents; and a line of identity is as much enclosed as its least ',
 'enclosed part, so that an evenly enclosed line reads <i>some</i> and an oddly enclosed one ',
 '<i>any</i> (Roberts p. 51).</p>',
 '<p><b>Shading.</b> Shading the oddly enclosed areas is Peirce\'s own device in MS 514, and ',
 'it is offered here as an aid rather than as part of the formation rules. Nothing in the ',
 'logic depends on it.</p>',
 '<p><b>Hook numerals.</b> Peirce distinguishes the hooks of a spot by where the line meets ',
 'it. Since this page lays every hook on the left edge, the small numerals give the order of ',
 'the places instead. They are an artefact of this drawing, not of the system.</p>',
 '<p><b>What the proof finder does.</b> It searches forwards from the premisses and backwards ',
 'from the conclusion at the same time, using nothing but the five rules, and reports a ',
 'proof when the two halves meet. For Alpha it also decides validity outright by truth-value ',
 'analysis, so a failed search is never reported as a disproof. Alpha is complete and ',
 'decidable (Roberts, Appendix 4), so where a valid Alpha inference defeats the search, the ',
 'fault is the search\'s and not the system\'s. Beta validity is not decidable at all: there a ',
 'countermodel on a small domain refutes an inference conclusively, but no amount of ',
 'searching can establish validity by failing.</p>',
 '<p><b>Deeper Beta proofs.</b> The syllogism Barbara is beyond the present search, which is ',
 'why it is given on the Proofs tab in the form Roberts prints, each of its eight steps ',
 'checked against the rules by this page.</p>',
 '<p><b>What is not here.</b> Gamma — the broken cut, graphs of graphs, the potentials, ',
 'modality — and the tinctured graphs of 1906. Roberts, chapters 5 and 6.</p>',
 '<hr class="sep"><p><b>Sources.</b> Don D. Roberts, <i>The Existential Graphs of Charles S. ',
 'Peirce</i> (The Hague: Mouton, 1973), chapters 3 and 4 and Appendices 3 and 4. ',
 'Charles S. Peirce, MS 514 (1909), transcribed with commentary by John F. Sowa, ',
 'jfsowa.com/peirce/ms514.htm. References of the form 4.492 are to the ',
 '<i>Collected Papers</i>.</p>'
].join('');

/* ---- go ------------------------------------------------------------------ */
translate();
pfLoad(0);
drawRender();
