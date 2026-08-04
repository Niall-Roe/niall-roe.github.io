<script>
/* ==========================================================================
   The laws of facility used throughout this paper's examples.

   Kept out of 04_scaffold.js, which is shared verbatim with the other papers
   on this site: the scaffolding belongs to every edition, these four curves
   belong only to this one. The kinds are the ones Peirce himself names —
   transit observations, the chronograph key on an occultation, a coarse
   instrument, two observers whose series have been run together — and every
   example that needs a law of error takes it from here, so the same four
   shapes recur throughout.
   ========================================================================*/
function rnorm1(mean = 0, sd = 1) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const ERROR_LAWS = {
  transit: {
    name: "Transit observations",
    gloss: "the error is compounded of a great many small independent ones",
    draw: (s) => rnorm1(0, s),
    dens: (e, s) => dnorm(e, 0, s),
  },
  occultation: {
    name: "A star out from behind the moon",
    gloss: "impossible to strike the key too early, possible to strike it indefinitely too late",
    // a shifted gamma: no mass to the left of the shift, a long right tail
    draw: (s) => {
      let g = 0;
      for (let i = 0; i < 3; i++) g += -Math.log(Math.random());
      return (g - 3) * s * 0.62;
    },
    dens: (e, s) => {
      const b = s * 0.62, x = e / b + 3;
      if (x <= 0) return 0;
      return (x * x * Math.exp(-x) / 2) / b;
    },
  },
  coarse: {
    name: "A coarse instrument",
    gloss: "the reading is carried to the nearest division and no further",
    draw: (s) => (Math.random() * 2 - 1) * s * 1.732,
    dens: (e, s) => (Math.abs(e) <= s * 1.732 ? 1 / (2 * s * 1.732) : 0),
  },
  twoObservers: {
    name: "Two observers run together",
    gloss: "one series, but taken under two sets of circumstances",
    draw: (s) => rnorm1(Math.random() < 0.5 ? -1.15 * s : 1.15 * s, s * 0.42),
    dens: (e, s) => 0.5 * dnorm(e, -1.15 * s, s * 0.42) + 0.5 * dnorm(e, 1.15 * s, s * 0.42),
  },
};
</script>
