// The hourglass mark in motion: the navigation logo fills as a long page is read,
// the home page hourglass settles once per visit and turns when clicked, and the
// 404 page lets the last grains run out. Visitors who ask for reduced motion see
// the static mark.
(function () {
  "use strict";
  // Grains of the mark (images/mark.svg), nearest the neck first: they leave in this order.
  var GRAINS = [[29, 25], [34, 22], [24, 19], [37, 19], [31, 17], [40, 15], [26, 13], [36, 12]];
  var BARS = [[22.5, 50, 4], [26.5, 47, 7], [30.5, 43, 11], [34.5, 47, 7], [38.5, 50, 4]];
  var STEP = 230;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function build(className) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 64 64");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("class", className);
    svg.innerHTML =
      '<g fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round">' +
      '<path d="M18 8h28M18 56h28M20 8c0 14 10 18 12 24c-2 6-12 10-12 24M44 8c0 14-10 18-12 24c2 6 12 10 12 24"/></g>' +
      '<g fill="currentColor">' +
      GRAINS.map(function (g) { return '<circle class="hg-grain" cx="' + g[0] + '" cy="' + g[1] + '" r="2"/>'; }).join("") +
      '<circle class="hg-fall" cx="32" cy="32" r="2" opacity="0"/>' +
      BARS.map(function (b) { return '<rect class="hg-bar" x="' + b[0] + '" y="' + b[1] + '" width="3" height="' + b[2] + '"/>'; }).join("") +
      "</g>";
    return svg;
  }

  // gone: grains that have left the top; landed: grains in the distribution (0 to 8).
  function draw(svg, gone, landed, fx, fy) {
    var grains = svg.querySelectorAll(".hg-grain");
    for (var i = 0; i < grains.length; i++) grains[i].setAttribute("opacity", i < gone ? "0" : "1");
    var fall = svg.querySelector(".hg-fall");
    fall.setAttribute("opacity", fx == null ? "0" : "1");
    if (fx != null) { fall.setAttribute("cx", fx); fall.setAttribute("cy", fy); }
    var scale = Math.max(0.001, landed / GRAINS.length);
    Array.prototype.forEach.call(svg.querySelectorAll(".hg-bar"), function (bar) { bar.style.transform = "scaleY(" + scale + ")"; });
  }

  function full(svg) { draw(svg, 0, GRAINS.length); }
  function emptyTop(svg) { draw(svg, GRAINS.length, GRAINS.length); }

  // Grains fall one at a time: to the neck, then down into the distribution.
  function settle(svg, done) {
    var start = null, n = GRAINS.length;
    draw(svg, 0, 0);
    function frame(now) {
      if (start === null) start = now;
      var e = (now - start) / STEP, i = Math.floor(e);
      if (i >= n) { emptyTop(svg); if (done) done(); return; }
      var u = e - i, g = GRAINS[i], x, y;
      if (u < 0.5) { var w = (u / 0.5) * (u / 0.5); x = g[0] + (32 - g[0]) * w; y = g[1] + (31 - g[1]) * w; }
      else { var v = (u - 0.5) / 0.5; x = 32; y = 31 + 16 * v * v; }
      draw(svg, i + 1, i, x, y);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function navLogo() {
    var link = document.querySelector(".navbar-brand-logo");
    if (!link || document.querySelector("[data-hg-hero]")) return;
    var svg = build("navbar-logo hg-logo");
    link.setAttribute("aria-label", "Igor B. Martins, home");
    link.appendChild(svg);
    link.classList.add("hg-live");
    // Browsers send at most one scroll event per frame, so each one can redraw directly.
    function update() {
      var room = document.documentElement.scrollHeight - window.innerHeight;
      if (room < window.innerHeight * 0.5) { full(svg); return; }
      var p = Math.min(1, Math.max(0, window.scrollY / room)), n = GRAINS.length;
      draw(svg, Math.min(n, Math.floor(p * n + 1e-9)), p * n, p > 0 && p < 1 ? 32 : null, 37);
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    document.addEventListener("toggle", update, true);
    update();
  }

  function heroGlass() {
    var button = document.querySelector("[data-hg-hero]");
    if (!button) return;
    var svg = build("hg-svg");
    button.appendChild(svg);
    button.hidden = false;
    var busy = false, seen = false;
    try { seen = sessionStorage.getItem("hg-settled") === "1"; sessionStorage.setItem("hg-settled", "1"); } catch (e) {}
    if (seen) emptyTop(svg);
    else { busy = true; draw(svg, 0, 0); setTimeout(function () { settle(svg, function () { busy = false; }); }, 650); }
    button.addEventListener("click", function () {
      if (busy) return;
      busy = true;
      button.classList.add("is-turning");
      setTimeout(function () {
        button.classList.add("no-turn");
        button.classList.remove("is-turning");
        draw(svg, 0, 0);
        void svg.getBoundingClientRect();
        button.classList.remove("no-turn");
        settle(svg, function () { busy = false; });
      }, 640);
    });
  }

  function lostGlass() {
    var holder = document.querySelector("[data-hg-404]");
    if (!holder) return;
    var svg = build("hg-svg");
    holder.insertBefore(svg, holder.firstChild);
    holder.hidden = false;
    setTimeout(function () { settle(svg); }, 400);
  }

  function init() {
    if (reduce) {
      var hero = document.querySelector("[data-hg-hero]"), lost = document.querySelector("[data-hg-404]");
      if (hero) { var a = build("hg-svg"); full(a); hero.appendChild(a); hero.hidden = false; hero.disabled = true; hero.setAttribute("aria-hidden", "true"); }
      if (lost) { var b = build("hg-svg"); emptyTop(b); lost.insertBefore(b, lost.firstChild); lost.hidden = false; }
      return;
    }
    navLogo();
    heroGlass();
    lostGlass();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
