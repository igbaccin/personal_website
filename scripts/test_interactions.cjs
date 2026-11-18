// Offline behavior checks. No DOM renderer or browser process.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = name => fs.readFileSync(path.join(__dirname, "..", name), "utf8");

function target() {
  const events = new Map();
  return {
    addEventListener(type, fn) { events.set(type, [...(events.get(type) || []), fn]); },
    fire(type, data = {}) { for (const fn of events.get(type) || []) fn(data); },
    classList: { add() {}, remove() {} }
  };
}

function carousel(reduced) {
  const box = target(), next = target(), count = {}, document = target(), items = [target(), target(), target()];
  box.querySelectorAll = () => items;
  box.querySelector = s => s.includes("next") ? next : count;
  box.contains = el => el === next;
  document.querySelector = () => box;
  const timers = new Map();
  let now = 0, id = 0;
  const context = {
    document, window: { matchMedia: () => ({matches: reduced}) }, performance: {now: () => now},
    setTimeout(fn, ms) { timers.set(++id, {fn, due: now + ms}); return id; },
    clearTimeout(key) { timers.delete(key); }
  };
  const code = [...source("index.qmd").matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
  vm.runInNewContext(code, context);
  function advance(ms) {
    const end = now + ms;
    while (timers.size) {
      const [key, task] = [...timers].sort((a,b) => a[1].due-b[1].due)[0];
      if (task.due > end) break;
      now = task.due; timers.delete(key); task.fn();
    }
    now = end;
  }
  return {box, next, count, document, timers, advance};
}

const c = carousel(false);
c.advance(2000);
c.box.fire("focusin"); c.box.fire("pointerenter"); c.box.fire("pointerleave");
c.box.fire("focusout", {relatedTarget:c.next});
c.advance(30000);
assert.equal(c.timers.size, 0);
c.document.hidden = true; c.document.fire("visibilitychange");
c.box.fire("focusout", {relatedTarget:null});
c.advance(30000); assert.equal(c.count.textContent, "1/3");
c.document.hidden = false; c.document.fire("visibilitychange");
c.advance(4999); assert.equal(c.count.textContent, "1/3");
c.advance(1); assert.equal(c.count.textContent, "2/3");
c.next.fire("click"); c.advance(1000); c.box.fire("pointerenter");
c.advance(30000); c.box.fire("pointerleave"); c.advance(18999);
assert.equal(c.count.textContent, "3/3");
c.advance(1); assert.equal(c.count.textContent, "1/3");
c.advance(7000); assert.equal(c.count.textContent, "2/3");
const still = carousel(true);
still.advance(70000); assert.equal(still.count.textContent, "1/3");
still.next.fire("click"); assert.equal(still.count.textContent, "2/3");

function glass(page, reduced) {
  let writes = 0, queries = 0;
  function element() {
    return Object.assign(target(), {
      namespaceURI: "http://www.w3.org/2000/svg", children: [], style: {},
      setAttribute() { writes++; }, appendChild(e) { this.children.push(e); },
      insertBefore(e) { this.children.unshift(e); },
      querySelectorAll(s) { queries++; return Array.from({length:s === ".hg-bar" ? 5 : 8}, element); },
      querySelector() { queries++; return element(); }
    });
  }
  const link = element(), hero = element(), lost = element(), frames = [];
  const document = Object.assign(target(), {
    readyState:"loading", documentElement:{scrollHeight:2000}, createElementNS:element,
    querySelector(s) { return {".navbar-brand-logo":link, "[data-hg-hero]":page==="home" && hero,
                               "[data-hg-404]":page==="404" && lost}[s] || null; }
  });
  const window = Object.assign(target(), {scrollY:0,innerHeight:800,matchMedia:() => ({matches:reduced})});
  const ctx = vm.createContext({window,document,requestAnimationFrame(fn){frames.push(fn); return frames.length;},
                                performance:{now:() => 100},sessionStorage:{getItem(){return null;},setItem(){}}});
  vm.runInContext(source("hourglass-nav.js"),ctx);
  if (page!=="interior") vm.runInContext(source("hourglass.js"),ctx);
  document.fire("DOMContentLoaded");
  return {window,document,frames,hero,lost,link,writes:()=>writes,queries:()=>queries};
}

const nav = glass("interior",false);
const cached = nav.queries(), idle = nav.writes();
nav.window.fire("scroll"); nav.window.fire("resize"); nav.document.fire("toggle");
assert.equal(nav.frames.length,1); nav.frames.shift()();
assert.equal(nav.writes(),idle);
nav.window.scrollY=300; nav.window.fire("scroll"); nav.frames.shift()();
assert.ok(nav.writes()>idle); assert.equal(nav.queries(),cached);
const home=glass("home",false), error=glass("404",false);
assert.equal(home.hero.hidden,false); assert.equal(home.link.children.length,0);
assert.equal(error.lost.hidden,false); assert.equal(error.link.children.length,1);
assert.ok(home.frames.length && error.frames.length);
assert.equal(glass("home",true).hero.disabled,true);
assert.equal(glass("404",true).frames.length,0);
assert.equal(glass("interior",true).link.children.length,0);

function language(code, {lang="en", search="", saved, browser="en", deny=false}={}) {
  const group=target(), greeting={}, document=target(), values=new Map();
  if (saved) values.set("site-lang",saved);
  const attrs={};
  const element={lang, classList:{add(){},remove(){}},setAttribute(k,v){attrs[k]=v;}};
  Object.assign(document,{
    documentElement:element,querySelectorAll:()=>[],
    querySelector:s=>s===".hs-lang-group" ? group : s==="[data-hs-greeting]" ? greeting : null
  });
  group.setAttribute=()=>{};
  const localStorage={
    getItem(k){return values.get(k);},
    setItem(k,v){if(deny)throw Error("storage disabled");values.set(k,v);}
  };
  const window={};
  vm.runInNewContext(code,{document,window,localStorage,navigator:{language:browser},location:{search},URLSearchParams,setTimeout(){}});
  document.fire("DOMContentLoaded");
  return {group,values,greeting,attrs,window};
}
const english=source("i18n.js");
assert.equal(language(english,{search:"?lang=sv",saved:"pt"}).window.SiteI18n.lang(),"sv");
assert.equal(language(english,{saved:"pt",browser:"sv"}).window.SiteI18n.lang(),"pt");
assert.equal(language(english,{browser:"sv-SE"}).greeting.hidden,true);
assert.match(language(english,{search:"?lang=en&greet=nobel"}).greeting.textContent,/Nobel/);

// Exercise the exact static handler emitted by the generator, supplied by Python.
if (process.env.STATIC_SWITCH_JS) {
  for (const deny of [false,true]) {
    const state=language(process.env.STATIC_SWITCH_JS,{lang:"pt",saved:"en",search:"?lang=sv",deny});
    state.group.fire("click",{target:{closest:()=>({hreflang:"sv"})}});
    assert.equal(state.values.get("site-lang"),deny ? "en" : "sv");
    assert.equal(state.window.SiteI18n,undefined);
    assert.equal(state.greeting.textContent,undefined);
  }
}
