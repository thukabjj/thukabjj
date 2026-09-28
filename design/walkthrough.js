// Autoplay walkthrough over window.DESIGN_SCENES.
// Query: ?theme=dark|light  ?scene=N (1-based)  ?record=1 (play once, no controls,
// ignores reduced motion, sets window.__walkthroughDone when the last scene ends).
(function () {
  "use strict";
  var data = window.DESIGN_SCENES || { scenes: [] };
  var scenes = data.scenes || [];
  var params = new URLSearchParams(location.search);
  var record = params.get("record") === "1";
  var reduced = !record && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;
  var $ = function (id) { return document.getElementById(id); };
  var TICK = 100;
  var state = { i: 0, t: 0, playing: !reduced, theme: root.getAttribute("data-theme") || "dark" };

  if (record) document.body.classList.add("record");
  if (data.title) document.title = data.title;
  $("title").textContent = data.title || "Walkthrough";
  window.__walkthroughDone = scenes.length === 0;
  window.__walkthroughTotalMs = scenes.reduce(function (s, x) { return s + (x.dur || 5000); }, 0);

  var chapters = [];
  scenes.forEach(function (s) { if (chapters.indexOf(s.chapter) < 0) chapters.push(s.chapter); });
  var segs = scenes.map(function (s, i) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "seg";
    b.setAttribute("aria-label", "Show " + s.chapter + ": " + s.title);
    b.dataset.alt = String(chapters.indexOf(s.chapter) % 2);
    b.appendChild(document.createElement("i"));
    b.addEventListener("click", function () { go(i); });
    $("segs").appendChild(b);
    return b;
  });

  function fit() {
    var s = scenes[state.i]; if (!s) return;
    var st = $("stage"), vp = $("viewport");
    var w = s.w || 1440, h = s.h || 900;
    var scale = Math.min((st.clientWidth - 48) / w, (st.clientHeight - 32) / h, 1);
    vp.style.width = w + "px"; vp.style.height = h + "px";
    vp.style.transform = "scale(" + scale + ")";
  }

  function frameSrc(s) {
    return s.board + (s.board.indexOf("?") < 0 ? "?" : "&") + "theme=" + state.theme;
  }

  function load() {
    var s = scenes[state.i]; if (!s) return;
    var f = $("frame"), en = $("enter");
    f.style.width = (s.w || 1440) + "px";
    f.style.height = ((s.h || 900) + (s.scroll || 0)) + "px";
    f.style.transform = "none";
    f.src = frameSrc(s);
    // The enter animation lives on an inner wrapper so it never overrides the fit scale.
    en.classList.remove("scene"); void en.offsetWidth; en.classList.add("scene");
    $("chapter").textContent = s.chapter + " · " + (state.i + 1) + " of " + scenes.length;
    $("scene-title").textContent = s.title;
    $("caption").textContent = s.caption || "";
    $("counter").textContent = String(state.i + 1).padStart(2, "0") + " / " + scenes.length;
    segs.forEach(function (b, k) {
      if (k === state.i) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
      b.firstChild.style.width = k < state.i ? "100%" : "0";
    });
    fit();
  }

  function paint() {
    var s = scenes[state.i]; if (!s) return;
    var dur = s.dur || 5000;
    segs[state.i].firstChild.style.width = Math.min(100, (state.t / dur) * 100) + "%";
    if (s.scroll) {
      // Hold still for 1.2 s, glide, hold again for the last 1.2 s.
      var p = Math.max(0, Math.min(1, (state.t - 1200) / Math.max(1, dur - 2400)));
      $("frame").style.transform = "translateY(" + (-Math.round(s.scroll * p)) + "px)";
    }
  }

  function go(i) { state.i = (i + scenes.length) % scenes.length; state.t = 0; load(); }

  function setPlaying(on) {
    state.playing = on;
    $("play").textContent = on ? "Pause" : "Play";
  }

  function setTheme(t) {
    state.theme = t;
    root.setAttribute("data-theme", t);
    document.querySelectorAll("[data-theme-set]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-theme-set") === t));
    });
    load();
  }

  $("prev").addEventListener("click", function () { go(state.i - 1); });
  $("next").addEventListener("click", function () { go(state.i + 1); });
  $("play").addEventListener("click", function () { setPlaying(!state.playing); });
  document.querySelectorAll("[data-theme-set]").forEach(function (b) {
    b.addEventListener("click", function () { setTheme(b.getAttribute("data-theme-set")); });
  });
  document.addEventListener("keydown", function (e) {
    var tag = (e.target && e.target.tagName) || "";
    if (/INPUT|TEXTAREA|SELECT/.test(tag) || e.target.isContentEditable) return;
    if (e.key === "ArrowRight") { go(state.i + 1); e.preventDefault(); }
    else if (e.key === "ArrowLeft") { go(state.i - 1); e.preventDefault(); }
    else if (e.key === " " && tag !== "BUTTON") { setPlaying(!state.playing); e.preventDefault(); }
  });
  window.addEventListener("resize", fit);

  if (!scenes.length) { $("scene-title").textContent = "No scenes: fill scenes.js"; return; }
  var start = parseInt(params.get("scene") || "1", 10);
  state.i = isNaN(start) ? 0 : Math.max(0, Math.min(scenes.length - 1, start - 1));
  setPlaying(state.playing);
  setTheme(state.theme);

  setInterval(function () {
    if (!state.playing) return;
    state.t += TICK;
    var dur = scenes[state.i].dur || 5000;
    if (state.t >= dur) {
      if (record && state.i === scenes.length - 1) { setPlaying(false); window.__walkthroughDone = true; return; }
      go(state.i + 1);
    }
    paint();
  }, TICK);
})();
