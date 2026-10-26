// The hourglass mark in motion. The navigation logo fills as a long page is
// read. On the home page the hourglass is a small toy: the sand runs through
// once per visit, hovering tilts it so the sand slides, a tap turns it over
// and a drag spins it. The 404 page lets the sand run out. Visitors who ask
// for reduced motion see the static mark.
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var FRAME = '<g fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round">' +
    '<path d="M18 8h28M18 56h28M20 8c0 14 10 18 12 24c-2 6-12 10-12 24M44 8c0 14-10 18-12 24c2 6 12 10 12 24"/></g>';
  // Grains of the mark (images/mark.svg), nearest the neck first, and its bars.
  var MARK_GRAINS = [[29, 25], [34, 22], [37, 19], [24, 19], [31, 17], [40, 15], [26, 13], [36, 12]];
  var BARS = [[22.5, 50, 4], [26.5, 47, 7], [30.5, 43, 11], [34.5, 47, 7], [38.5, 50, 4]];
  // The live hourglass carries a ninth grain. The grains settle into the five
  // columns of the mark's distribution, stacked 1, 2, 3, 2, 1 high and filled
  // from the centre outwards, so the finished pile is the bar chart.
  var GRAINS = MARK_GRAINS.concat([[31, 11]]);
  var SLOTS = [[32, 52], [32, 48], [32, 44], [28, 52], [36, 52], [28, 48], [36, 48], [24, 52], [40, 52]];
  var NECK_Y = 31.6, SLIDE_MS = 380, GAP_MS = 190, GRAVITY = 150;
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
    this.grains = GRAINS.map(function (g) {
      var c = document.createElementNS(NS, "circle");
      c.setAttribute("r", "2");
      self.layer.appendChild(c);
      return { x: g[0], y: g[1], hx: g[0], hy: g[1], state: "rest", c: c, slot: -1, vy: 0, t0: 0, fx: 0, fy: 0, ctrl: null, landedAt: -1e9 };
    });
    this.taken = SLOTS.map(function () { return false; });
    this.angle = 0; this.target = 0; this.vel = 0; this.mode = "idle";
    this.tilt = 0; this.tiltTarget = 0;
    this.nextRelease = Infinity;
    this.last = 0; this.raf = 0;
    this.render(0);
  }

  Sim.prototype.settled = function () {
    var self = this;
    this.grains.forEach(function (g, i) {
      g.state = "landed"; g.slot = i; g.x = SLOTS[i][0]; g.y = SLOTS[i][1]; self.taken[i] = true;
    });
    this.render(0);
  };

  Sim.prototype.pour = function (delay) {
    this.nextRelease = performance.now() + delay;
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
    for (var i = 0; i < SLOTS.length; i++) if (!this.taken[i]) { this.taken[i] = true; return i; }
    return SLOTS.length - 1;
  };

  // After an odd number of half turns the picture is the mirror image of the
  // frame at rest, so the grains are mirrored and the angle reset: nothing
  // visible changes. Grains above the neck now rest there; grains below fall.
  Sim.prototype.settleTurn = function () {
    var self = this, turns = Math.round(this.angle / 180);
    this.angle = 0; this.target = 0; this.vel = 0;
    if (turns % 2 === 0) return;
    this.taken = SLOTS.map(function () { return false; });
    this.grains.forEach(function (g) {
      g.x = 64 - g.x; g.y = 64 - g.y;
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
      this.vel += ((this.target - this.angle) * 140 - this.vel * 17) * dt;
      this.angle += this.vel * dt;
      if (Math.abs(this.target - this.angle) < 0.25 && Math.abs(this.vel) < 3) { this.angle = this.target; this.settleTurn(); this.mode = "idle"; }
      busy = true;
    } else if (this.mode === "drag") {
      busy = true;
    }

    var tt = this.mode === "idle" ? this.tiltTarget : 0;
    this.tilt += (tt - this.tilt) * Math.min(1, dt * 9);
    if (Math.abs(tt - this.tilt) > 0.02) busy = true; else this.tilt = tt;

    if (this.mode === "idle") {
      if (now >= this.nextRelease) {
        var next = this.nearestResting();
        if (next) {
          next.state = "slide"; next.t0 = now; next.fx = next.x; next.fy = next.y;
          next.ctrl = [next.x + (32 - next.x) * 0.7, next.y + (NECK_Y - next.y) * 0.5];
          this.nextRelease = now + GAP_MS;
        } else {
          this.nextRelease = Infinity;
        }
      }
      if (this.nextRelease < Infinity) busy = true;
      this.grains.forEach(function (g) {
        if (g.state === "rest") {
          var tx = g.hx + self.tilt * 0.45;
          g.x += (tx - g.x) * Math.min(1, dt * 8); g.y = g.hy;
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
          var s = SLOTS[g.slot];
          g.vy += GRAVITY * dt; g.y += g.vy * dt;
          var span = s[1] - g.fy, frac = span > 0.01 ? clamp((g.y - g.fy) / span, 0, 1) : 1;
          g.x = g.fx + (s[0] - g.fx) * (1 - (1 - frac) * (1 - frac));
          if (g.y >= s[1]) { g.x = s[0]; g.y = s[1]; g.state = "landed"; g.landedAt = now; }
          busy = true;
        } else if (g.state === "landed" && now - g.landedAt < 200) {
          busy = true;
        }
      });
    }
    this.render(now);
    return busy;
  };

  Sim.prototype.render = function (now) {
    this.grains.forEach(function (g) {
      var r = 2;
      if (g.state === "landed") r += 0.6 * Math.max(0, 1 - (now - g.landedAt) / 180);
      g.c.setAttribute("cx", g.x.toFixed(2)); g.c.setAttribute("cy", g.y.toFixed(2)); g.c.setAttribute("r", r.toFixed(2));
    });
    this.svg.style.transform = "rotate(" + (this.angle + this.tilt).toFixed(2) + "deg)";
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

    var drag = null, suppressClick = false;
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
        sim.tiltTarget = clamp((e.clientX - c.x) / (c.w / 2), -1, 1) * 5;
        sim.kick();
      }
    });
    button.addEventListener("pointerleave", function () { if (!drag) { sim.tiltTarget = 0; sim.kick(); } });
    button.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      var c = centre();
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
