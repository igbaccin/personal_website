// The hourglass mark in motion. The navigation logo fills as a long page is
// read. On the home page the hourglass is a small toy: the sand runs through
// once per visit, the glass twitches when the pointer arrives and leans after
// it, a tap turns it over and a drag spins it. Everything that moves sits on
// a spring, so it rings a little before it settles. The 404 page lets the
// sand run out. Visitors who ask for reduced motion see the static mark.
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var FRAME = '<g fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round">' +
    '<path d="M18 8h28M18 56h28M20 8c0 14 10 18 12 24c-2 6-12 10-12 24M44 8c0 14-10 18-12 24c2 6 12 10 12 24"/></g>';
  // Grains of the mark (images/mark.svg), nearest the neck first, and its bars.
  var MARK_GRAINS = [[29, 25], [34, 22], [37, 19], [24, 19], [31, 17], [40, 15], [26, 13], [36, 12]];
  var BARS = [[22.5, 50, 4], [26.5, 47, 7], [30.5, 43, 11], [34.5, 47, 7], [38.5, 50, 4]];
  // The live hourglass carries a ninth grain. Each grain lands on one of the
  // five bars of the mark, centre first, and melts into it: three grains make
  // the middle bar, two each shoulder, one each edge, so the finished pile is
  // the bar chart of the mark.
  var GRAINS = MARK_GRAINS.concat([[31, 11]]);
  var BAR_OF = [2, 1, 3, 2, 0, 4, 1, 3, 2];
  var BAR_GRAINS = [1, 2, 3, 2, 1];
  // The live glass does not always pour the chart of the mark. Now and then
  // a turn ends skewed, lopsided or twin-peaked: nine grains again, never
  // more in a bar than its place under the glass can hold. HEIGHTS gives a
  // bar's height by the number of grains in it.
  var ODD = 0.35;
  var SHAPES = [[1, 3, 3, 2, 0], [0, 2, 3, 3, 1], [1, 3, 4, 1, 0], [0, 1, 4, 3, 1], [1, 3, 1, 3, 1], [0, 3, 4, 2, 0], [0, 2, 4, 3, 0]];
  var HEIGHTS = [0, 4, 7, 11, 14.5];
  var GRAIN_R = 1.55;
  var MELT_MS = 260;
  var NECK_Y = 31.6, SLIDE_MS = 380, GAP_MS = 190, GRAVITY = 150;
  // Springs (stiffness, damping). The tilt and the bars are loose enough to
  // ring; the turn lands with a small overshoot; the bob is the thud after it.
  var TILT_K = 300, TILT_C = 11, TILT_MAX = 9, BAR_K = 420, BAR_C = 15, TURN_K = 230, TURN_C = 18, BOB_K = 600, BOB_C = 22;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function svgRoot(className) {
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 64 64");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("class", className);
    return svg;
  }

  // The static mark: grains above, bars below. p (0 to 1) drains the grains
  // one after another into the bars; p = 0 is the mark as drawn.
  function markSvg(className) {
    var svg = svgRoot(className);
    svg.innerHTML = FRAME + '<g fill="currentColor">' +
      MARK_GRAINS.map(function (g) { return '<circle class="hg-grain" cx="' + g[0] + '" cy="' + g[1] + '" r="2"/>'; }).join("") +
      '<circle class="hg-fall" cx="32" cy="37" r="2" opacity="0"/>' +
      BARS.map(function (b) { return '<rect class="hg-bar" x="' + b[0] + '" y="' + b[1] + '" width="3" height="' + b[2] + '"/>'; }).join("") +
      "</g>";
    return svg;
  }

  function markDraw(svg, p, barsFull) {
    var grains = svg.querySelectorAll(".hg-grain"), n = grains.length;
    for (var i = 0; i < n; i++) grains[i].setAttribute("r", (2 * (1 - clamp(p * n - i, 0, 1))).toFixed(2));
    svg.querySelector(".hg-fall").setAttribute("opacity", p > 0 && p < 1 ? "1" : "0");
    var scale = barsFull ? 1 : Math.max(0.001, p);
    Array.prototype.forEach.call(svg.querySelectorAll(".hg-bar"), function (bar) { bar.style.transform = "scaleY(" + scale + ")"; });
  }

  // The live hourglass: nine grains that slide to the neck, fall and stack.
  function Sim(svg) {
    var self = this;
    this.svg = svg;
    this.layer = document.createElementNS(NS, "g");
    this.layer.setAttribute("fill", "currentColor");
    svg.appendChild(this.layer);
    this.bars = BARS.map(function (b) {
      var r = document.createElementNS(NS, "rect");
      r.setAttribute("x", b[0]); r.setAttribute("width", "3");
      self.layer.appendChild(r);
      return { el: r, x: b[0], base: b[1] + b[2], full: b[2], count: 0, shown: 0, v: 0 };
    });
    this.grains = GRAINS.map(function (g) {
      var c = document.createElementNS(NS, "circle");
      c.setAttribute("r", GRAIN_R);
      self.layer.appendChild(c);
      return { x: g[0], y: g[1], hx: g[0], hy: g[1], state: "rest", c: c, slot: -1, rank: 0, vy: 0, t0: 0, fx: 0, fy: 0, ctrl: null, landedAt: -1e9, hop: 0, hopV: 0 };
    });
    this.plan(BAR_GRAINS);
    this.taken = this.barOf.map(function () { return false; });
    this.angle = 0; this.target = 0; this.vel = 0; this.mode = "idle";
    this.tilt = 0; this.tiltTarget = 0; this.tiltVel = 0;
    this.bob = 0; this.bobVel = 0;
    this.pouring = false; this.ripples = null; this.dizzy = false;
    this.nextRelease = Infinity;
    this.last = 0; this.raf = 0;
    this.render(0);
  }

  // Plan a pour: how many grains each bar takes and the order they land in,
  // the tallest bar first, then outwards, level by level.
  Sim.prototype.plan = function (counts) {
    var peak = counts.indexOf(Math.max.apply(null, counts)), order = [];
    for (var level = 0; level < HEIGHTS.length; level++) {
      [0, 1, -1, 2, -2, 3, -3, 4, -4].forEach(function (d) {
        var i = peak + d;
        if (i >= 0 && i < counts.length && counts[i] > level) order.push(i);
      });
    }
    this.barGrains = counts;
    this.barOf = counts === BAR_GRAINS ? BAR_OF : order;
    this.bars.forEach(function (b, i) { b.full = HEIGHTS[counts[i]]; });
  };

  // Where a falling grain is heading: the top of its bar as it will stand once
  // this grain has joined it.
  Sim.prototype.landing = function (slot) {
    var bar = this.bars[this.barOf[slot]];
    return [bar.x + 1.5, bar.base - bar.full * (bar.count + 1) / this.barGrains[this.barOf[slot]]];
  };

  Sim.prototype.settled = function () {
    var self = this;
    this.grains.forEach(function (g, i) {
      g.state = "landed"; g.slot = i; g.landedAt = -1e9; self.taken[i] = true;
      var p = self.landing(i); g.x = p[0]; g.y = p[1];
      g.rank = self.bars[self.barOf[i]].count;
      self.bars[self.barOf[i]].count += 1;
    });
    this.bars.forEach(function (b) { b.shown = b.count; });
    this.render(0);
  };

  Sim.prototype.pour = function (delay) {
    this.nextRelease = performance.now() + delay;
    this.kick();
  };

  // A poke. The glass twitches on its tilt spring, loose grains hop and the
  // bars jump like a startled chart, then everything rings back into place.
  Sim.prototype.nudge = function (dir, strength) {
    var s = strength || 1;
    this.tiltVel += dir * 210 * s;
    this.bars.forEach(function (b, i) { if (b.count) b.v += (i % 2 ? -1 : 1) * dir * 11 * s; });
    this.grains.forEach(function (g) { if (g.state === "rest") g.hopV = 7 + 5 * Math.random(); });
    this.kick();
  };

  Sim.prototype.flip = function () {
    if (this.mode === "drag") return;
    this.target = Math.round(this.angle / 180) * 180 + 180;
    this.mode = "spring";
    this.tiltTarget = 0;
    this.kick();
  };

  Sim.prototype.spinTo = function (target, velocity) {
    this.target = target;
    this.vel = velocity || 0;
    this.mode = "spring";
    this.kick();
  };

  Sim.prototype.freeSlot = function () {
    for (var i = 0; i < this.barOf.length; i++) if (!this.taken[i]) { this.taken[i] = true; return i; }
    return this.barOf.length - 1;
  };

  // While the glass turns, the bars loosen into grains: whole bars up to 45
  // degrees from upright, loose sand beyond 135, a blend in between. The same
  // rule runs backwards when a drag returns to the starting face.
  Sim.prototype.looseness = function () {
    var a = Math.abs(((this.angle % 360) + 360) % 360);
    if (a > 180) a = 360 - a;
    return clamp((a - 45) / 90, 0, 1);
  };

  // A landed grain's place inside its bar: stacked in the order it arrived.
  Sim.prototype.stackPos = function (g) {
    var bar = this.bars[this.barOf[g.slot]], n = this.barGrains[this.barOf[g.slot]];
    return [bar.x + 1.5, bar.base - bar.full * (g.rank + 0.5) / n];
  };

  // After an odd number of half turns the picture is the mirror image of the
  // frame at rest, so everything is mirrored and the angle reset: nothing
  // visible changes. The sand, already loose from the turn, rests at the top
  // where the bars were; any grain caught above the neck falls.
  Sim.prototype.settleTurn = function () {
    var self = this, turns = Math.round(this.angle / 180);
    this.angle = 0; this.target = 0; this.vel = 0;
    if (turns % 2 === 0) return;
    this.grains.forEach(function (g) {
      if (g.state === "landed") { var p = self.stackPos(g); g.x = p[0]; g.y = p[1]; }
      g.x = 64 - g.x; g.y = 64 - g.y;
    });
    // A new pour, a new chart: usually the mark's, now and then an odd one.
    this.plan(Math.random() < ODD ? SHAPES[Math.floor(Math.random() * SHAPES.length)] : BAR_GRAINS);
    this.taken = this.barOf.map(function () { return false; });
    this.bars.forEach(function (b) { b.count = 0; b.shown = 0; b.v = 0; });
    this.grains.forEach(function (g) {
      if (g.y < 32) { g.state = "rest"; g.hx = g.x; g.hy = g.y; g.slot = -1; }
      else { g.state = "fall"; g.vy = 0; g.fx = g.x; g.fy = g.y; g.slot = self.freeSlot(); }
    });
    this.nextRelease = performance.now() + 260;
  };

  Sim.prototype.nearestResting = function () {
    var best = null, bestD = Infinity;
    this.grains.forEach(function (g) {
      if (g.state !== "rest") return;
      var d = (g.x - 32) * (g.x - 32) + (g.y - NECK_Y) * (g.y - NECK_Y);
      if (d < bestD) { bestD = d; best = g; }
    });
    return best;
  };

  Sim.prototype.step = function (now) {
    var dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    var busy = false, self = this;

    if (this.mode === "spring") {
      this.vel += ((this.target - this.angle) * TURN_K - this.vel * TURN_C) * dt;
      this.angle += this.vel * dt;
      if (Math.abs(this.target - this.angle) < 0.25 && Math.abs(this.vel) < 3) {
        this.angle = this.target; this.settleTurn(); this.mode = "idle";
        this.bobVel += 26;
        // Turned too often in a row, the glass sways before it stands still.
        if (this.dizzy) { this.dizzy = false; this.tiltVel += 420; }
      }
      busy = true;
    } else if (this.mode === "drag") {
      busy = true;
    }

    var tt = this.mode === "idle" ? this.tiltTarget : 0;
    this.tiltVel += ((tt - this.tilt) * TILT_K - this.tiltVel * TILT_C) * dt;
    this.tilt += this.tiltVel * dt;
    if (Math.abs(tt - this.tilt) > 0.02 || Math.abs(this.tiltVel) > 0.4) busy = true; else { this.tilt = tt; this.tiltVel = 0; }
    this.bobVel += (-this.bob * BOB_K - this.bobVel * BOB_C) * dt;
    this.bob += this.bobVel * dt;
    if (Math.abs(this.bob) > 0.02 || Math.abs(this.bobVel) > 0.4) busy = true; else { this.bob = 0; this.bobVel = 0; }

    if (this.mode === "idle") {
      if (now >= this.nextRelease) {
        var next = this.nearestResting();
        if (next) {
          next.state = "slide"; next.t0 = now; next.fx = next.x; next.fy = next.y; next.hop = 0; next.hopV = 0;
          this.pouring = true;
          next.ctrl = [next.x + (32 - next.x) * 0.7, next.y + (NECK_Y - next.y) * 0.5];
          this.nextRelease = now + GAP_MS;
        } else {
          this.nextRelease = Infinity;
        }
      }
      if (this.nextRelease < Infinity) busy = true;
      this.grains.forEach(function (g) {
        if (g.state === "rest") {
          var tx = g.hx + clamp(self.tilt, -TILT_MAX, TILT_MAX) * 0.3;
          g.x += (tx - g.x) * Math.min(1, dt * 8);
          if (g.hop > 0 || g.hopV > 0) {
            g.hopV -= 90 * dt; g.hop += g.hopV * dt;
            if (g.hop <= 0) { g.hop = 0; g.hopV = g.hopV < -5 ? -g.hopV * 0.35 : 0; }
            busy = true;
          }
          g.y = g.hy - g.hop;
          if (Math.abs(tx - g.x) > 0.02) busy = true; else g.x = tx;
        } else if (g.state === "slide") {
          var u = (now - g.t0) / SLIDE_MS;
          if (u >= 1) {
            g.state = "fall"; g.x = 32; g.y = NECK_Y; g.vy = 18; g.fx = 32; g.fy = NECK_Y; g.slot = self.freeSlot();
          } else {
            var e = u * u, m = 1 - e;
            g.x = m * m * g.fx + 2 * m * e * g.ctrl[0] + e * e * 32;
            g.y = m * m * g.fy + 2 * m * e * g.ctrl[1] + e * e * NECK_Y;
          }
          busy = true;
        }
        if (g.state === "fall") {
          var s = self.landing(g.slot);
          g.vy += GRAVITY * dt; g.y += g.vy * dt;
          var span = s[1] - g.fy, frac = span > 0.01 ? clamp((g.y - g.fy) / span, 0, 1) : 1;
          g.x = g.fx + (s[0] - g.fx) * (1 - (1 - frac) * (1 - frac));
          if (g.y >= s[1]) {
            g.x = s[0]; g.y = s[1]; g.state = "landed"; g.landedAt = now;
            g.rank = self.bars[self.barOf[g.slot]].count;
            self.bars[self.barOf[g.slot]].count += 1;
          }
          busy = true;
        } else if (g.state === "landed" && now - g.landedAt < MELT_MS) {
          busy = true;
        }
      });
      this.bars.forEach(function (b) {
        b.v += ((b.count - b.shown) * BAR_K - b.v * BAR_C) * dt;
        b.shown += b.v * dt;
        if (Math.abs(b.count - b.shown) > 0.01 || Math.abs(b.v) > 0.05) busy = true; else { b.shown = b.count; b.v = 0; }
      });
      // The finished chart takes a bow: one ripple across the bars.
      if (this.pouring && this.nextRelease === Infinity && this.grains.every(function (g) { return g.state === "landed" && now - g.landedAt > MELT_MS; })) {
        this.pouring = false;
        this.ripples = this.bars.map(function (b, i) { return now + 140 + i * 70; });
      }
      if (this.ripples) {
        var waiting = 0;
        this.ripples = this.ripples.map(function (at, i) {
          if (at && now >= at) { self.bars[i].v += 6; return 0; }
          if (at) waiting += 1;
          return at;
        });
        if (waiting) busy = true; else this.ripples = null;
      }
    }
    this.render(now);
    return busy;
  };

  Sim.prototype.render = function (now) {
    var self = this, loose = this.looseness();
    this.grains.forEach(function (g) {
      var r = GRAIN_R, o = 1, x = g.x, y = g.y;
      if (g.state === "landed") {
        // The grain melts into its bar as the bar rises to take it, and
        // reappears from inside the bar when the glass is turned.
        var u = clamp((now - g.landedAt) / MELT_MS, 0, 1), v = Math.max(1 - u, loose);
        r = GRAIN_R * v; o = v;
        if (loose > 0) { var p = self.stackPos(g); x = g.x + (p[0] - g.x) * loose; y = g.y + (p[1] - g.y) * loose; }
      }
      g.c.setAttribute("cx", x.toFixed(2)); g.c.setAttribute("cy", y.toFixed(2));
      g.c.setAttribute("r", r.toFixed(2)); g.c.setAttribute("opacity", o.toFixed(2));
    });
    this.bars.forEach(function (b, i) {
      var n = self.barGrains[i], h = n ? b.full * b.shown / n * (1 - loose) : 0;
      b.el.setAttribute("y", (b.base - h).toFixed(2)); b.el.setAttribute("height", Math.max(0, h).toFixed(2));
    });
    var stretch = clamp(Math.abs(this.vel) / 22000, 0, 0.05);
    this.svg.style.transform = "translateY(" + (this.bob * 100 / 64).toFixed(2) + "%) rotate(" + (this.angle + this.tilt).toFixed(2) + "deg) scale(" + (1 - stretch).toFixed(3) + "," + (1 + stretch).toFixed(3) + ")";
  };

  Sim.prototype.kick = function () {
    var self = this;
    if (this.raf) return;
    this.last = performance.now();
    function loop(now) {
      self.raf = 0;
      if (self.step(now)) self.raf = requestAnimationFrame(loop);
    }
    this.raf = requestAnimationFrame(loop);
  };

  function navLogo() {
    var link = document.querySelector(".navbar-brand-logo");
    if (!link || document.querySelector("[data-hg-hero]")) return;
    var svg = markSvg("navbar-logo hg-logo");
    link.setAttribute("aria-label", "Igor B. Martins, home");
    link.appendChild(svg);
    link.classList.add("hg-live");
    function update() {
      var room = document.documentElement.scrollHeight - window.innerHeight;
      if (room < window.innerHeight * 0.5) { markDraw(svg, 0, true); return; }
      var y = window.scrollY, p = clamp(y / room, 0, 1);
      if (room - y < 2) p = 1;
      markDraw(svg, p, false);
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    document.addEventListener("toggle", update, true);
    update();
  }

  function heroGlass() {
    var button = document.querySelector("[data-hg-hero]");
    if (!button) return;
    var svg = svgRoot("hg-svg");
    svg.innerHTML = FRAME;
    button.appendChild(svg);
    button.hidden = false;
    var sim = new Sim(svg), seen = false;
    try { seen = sessionStorage.getItem("hg-settled") === "1"; sessionStorage.setItem("hg-settled", "1"); } catch (e) {}
    if (seen) sim.settled(); else sim.pour(700);

    var drag = null, suppressClick = false, linger = 0, turns = [];
    function centre() {
      var r = button.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width };
    }
    function pointerAngle(e, c) { return Math.atan2(e.clientY - c.y, e.clientX - c.x) * 180 / Math.PI; }

    button.addEventListener("pointermove", function (e) {
      var c = centre();
      if (drag) {
        var a = pointerAngle(e, c), d = ((a - drag.pa + 540) % 360) - 180, t = performance.now();
        drag.pa = a;
        sim.angle += d;
        drag.w = d / Math.max(0.004, (t - drag.t) / 1000);
        drag.t = t;
        if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 6) drag.moved = true;
        sim.kick();
      } else if (e.pointerType === "mouse") {
        sim.tiltTarget = clamp((e.clientX - c.x) / (c.w / 2), -1, 1) * TILT_MAX;
        sim.kick();
      }
    });
    button.addEventListener("pointerenter", function (e) {
      if (e.pointerType !== "mouse" || drag || sim.mode !== "idle") return;
      sim.nudge(e.clientX < centre().x ? 1 : -1);
      // Nothing happening? The glass shakes once, impatiently.
      clearTimeout(linger);
      linger = setTimeout(function () {
        if (drag || sim.mode !== "idle") return;
        sim.nudge(1, 0.8);
        setTimeout(function () { if (!drag && sim.mode === "idle") sim.nudge(-1, 0.8); }, 130);
      }, 2400);
    });
    button.addEventListener("pointerleave", function () { clearTimeout(linger); if (!drag) { sim.tiltTarget = 0; sim.kick(); } });
    button.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      var c = centre();
      clearTimeout(linger);
      drag = { pa: pointerAngle(e, c), x: e.clientX, y: e.clientY, moved: false, w: 0, t: performance.now() };
      sim.mode = "drag"; sim.vel = 0; sim.tiltTarget = 0;
      try { button.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    });
    function release() {
      if (!drag) return;
      var d = drag;
      drag = null;
      if (d.moved) {
        // A quick fling carries the hourglass on; a slow drag settles to the nearest face.
        suppressClick = true;
        var fling = Math.abs(d.w) > 300 ? Math.sign(d.w) * 90 : 0;
        sim.spinTo(Math.round((sim.angle + fling) / 180) * 180, clamp(d.w, -900, 900));
      } else {
        sim.mode = "idle";
        sim.kick();
      }
    }
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("click", function () {
      if (suppressClick) { suppressClick = false; return; }
      var now = performance.now();
      turns = turns.filter(function (at) { return now - at < 2600; });
      turns.push(now);
      if (turns.length >= 4) { sim.dizzy = true; turns = []; }
      sim.flip();
    });
  }

  function lostGlass() {
    var holder = document.querySelector("[data-hg-404]");
    if (!holder) return;
    var svg = svgRoot("hg-svg");
    svg.innerHTML = FRAME;
    holder.insertBefore(svg, holder.firstChild);
    holder.hidden = false;
    new Sim(svg).pour(400);
  }

  function init() {
    if (reduce) {
      var hero = document.querySelector("[data-hg-hero]"), lost = document.querySelector("[data-hg-404]");
      if (hero) { var a = markSvg("hg-svg"); markDraw(a, 0, true); hero.appendChild(a); hero.hidden = false; hero.disabled = true; hero.setAttribute("aria-hidden", "true"); }
      if (lost) { var b = markSvg("hg-svg"); markDraw(b, 1, true); lost.insertBefore(b, lost.firstChild); lost.hidden = false; }
      return;
    }
    navLogo();
    heroGlass();
    lostGlass();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
