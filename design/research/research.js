// Renders window.DESIGN_RESEARCH = { captures: [...], analysis: {...} } (built by
// `design-kit research` from research/captures/*.json and research/analysis.json).
// ?section=typography|color|motion|matrices|... shows one section, for boards and video.
(function () {
  "use strict";
  var R = window.DESIGN_RESEARCH || { captures: [], analysis: {} };
  var caps = R.captures || [], an = R.analysis || {};
  var only = new URLSearchParams(location.search).get("section");

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function slot(id) { return document.querySelector("#" + id + " [data-slot]"); }
  function empty(id, msg) { slot(id).appendChild(el("div", "empty", msg)); }
  function pct(x) { return Math.round((x || 0) * 100) + "%"; }
  function bars(rows, label, value) {
    var box = el("div", "bars");
    rows.slice(0, 6).forEach(function (r) {
      var b = el("div", "bar");
      b.appendChild(el("span", null, label(r)));
      var i = el("i"); i.style.width = Math.max(2, (r.share || 0) * 100) + "%";
      var w = el("span"); w.appendChild(i); b.appendChild(w);
      b.appendChild(el("span", "muted", value(r)));
      box.appendChild(b);
    });
    return box;
  }
  function scheme(c) { return (c.schemes && (c.schemes.light || c.schemes.dark)) || {}; }
  function card(c) {
    var k = el("article", "panel card");
    var h = el("div"); h.style.display = "flex"; h.style.justifyContent = "space-between"; h.style.gap = "12px";
    h.appendChild(el("h3", "h3", c.name));
    h.appendChild(el("span", "label", c.bucket || ""));
    k.appendChild(h);
    return k;
  }

  if (an.question) document.getElementById("q").textContent = an.question;

  // Comparables
  if (!caps.length) empty("comparables", "No captures yet. Run: design-kit extract <public-url> --name <product> --bucket direct|adjacent|platform");
  caps.forEach(function (c) {
    var k = card(c), s = scheme(c);
    if (s.screenshot) { var img = el("img", "shot"); img.src = "captures/" + s.screenshot; img.alt = c.name + " screenshot"; k.appendChild(img); }
    k.appendChild(el("span", "mono muted", (c.url || "") + " · " + (c.capturedAt || "").slice(0, 10)));
    if (c.why) k.appendChild(el("p", "small", c.why));
    slot("comparables").appendChild(k);
  });

  // Typography
  caps.forEach(function (c) {
    var k = card(c), t = scheme(c).typography || {};
    var fam = (t.families || [])[0];
    var spec = el("div", "specimen", "Aa Gg 0123 — The quick brown fox");
    if (fam) spec.style.fontFamily = fam.family + ", var(--font-body)";
    k.appendChild(spec);
    k.appendChild(el("span", "mono", "body " + (t.bodySize || "?") + "px / " + (t.bodyLineHeight || "?") + " · ratio " + (t.scaleRatio || "?") + " · weights " + (t.weights || []).map(function (w) { return w.weight; }).join(" ")));
    k.appendChild(bars(t.families || [], function (r) { return r.family; }, function (r) { return pct(r.share); }));
    k.appendChild(bars(t.sizes || [], function (r) { return r.px + "px"; }, function (r) { return pct(r.share); }));
    slot("typography").appendChild(k);
  });
  if (!caps.length) empty("typography", "Typography is compared from captures.");

  // Color
  caps.forEach(function (c) {
    var k = card(c);
    ["light", "dark"].forEach(function (name) {
      var s = (c.schemes || {})[name]; if (!s || !s.color) return;
      if (s.differsFromLight === false) { k.appendChild(el("span", "label", "dark: same as light (no dark mode)")); return; }
      k.appendChild(el("span", "label", name));
      ["background", "text", "border"].forEach(function (role) {
        var row = el("div", "swatches"); row.style.marginBottom = "18px";
        (s.color[role] || []).slice(0, 8).forEach(function (sw) {
          var d = el("div", "sw"); d.style.background = sw.hex; d.title = role + " " + sw.hex + " " + pct(sw.share);
          d.appendChild(el("span", null, sw.hex.replace("#", "")));
          row.appendChild(d);
        });
        k.appendChild(el("span", "small muted", role));
        k.appendChild(row);
      });
      var ct = s.contrast || {};
      k.appendChild(el("span", "mono", "text contrast min " + (ct.min || "?") + " · p10 " + (ct.p10 || "?") + " · median " + (ct.median || "?") + " · below 4.5: " + pct(ct.below45)));
    });
    slot("color").appendChild(k);
  });
  if (!caps.length) empty("color", "Palettes and measured contrast come from captures.");

  // Motion
  caps.forEach(function (c) {
    var k = card(c), m = scheme(c).motion || {};
    k.appendChild(el("span", "mono", (m.animatedElements || 0) + " animated · " + (m.transitionElements || 0) + " with transitions"));
    k.appendChild(bars(m.durations || [], function (r) { return r.ms + "ms"; }, function (r) { return String(r.count); }));
    k.appendChild(bars(m.easings || [], function (r) { return r.easing.length > 22 ? r.easing.slice(0, 21) + "…" : r.easing; }, function (r) { return String(r.count); }));
    slot("motion").appendChild(k);
  });
  if (!caps.length) empty("motion", "Durations and easings come from captures; interaction motion needs a screen recording or DevTools animation panel.");

  // Matrices
  (an.matrices || []).forEach(function (m) {
    var wrap = el("div", "panel card");
    wrap.appendChild(el("h3", "h3", m.decision));
    var tbl = el("table"), hr = el("tr");
    hr.appendChild(el("th", null, "Option"));
    (m.criteria || []).forEach(function (c) { hr.appendChild(el("th", null, c)); });
    hr.appendChild(el("th", null, "Verdict"));
    var thead = el("thead"); thead.appendChild(hr); tbl.appendChild(thead);
    var tb = el("tbody");
    (m.options || []).forEach(function (o) {
      var tr = el("tr"); tr.appendChild(el("th", null, o.name));
      (o.cells || []).forEach(function (cell) {
        var td = el("td"); td.appendChild(el("div", "score num", cell.score != null ? cell.score + "/5" : "–"));
        if (cell.evidence) td.appendChild(el("div", "muted", cell.evidence));
        tr.appendChild(td);
      });
      tr.appendChild(el("td", null, o.verdict || ""));
      tb.appendChild(tr);
    });
    tbl.appendChild(tb); wrap.appendChild(tbl);
    if (m.recommendation) wrap.appendChild(el("p", "p", "Recommendation: " + m.recommendation));
    slot("matrices").appendChild(wrap);
  });
  if (!(an.matrices || []).length) empty("matrices", "Add matrices to research/analysis.json.");

  // Principles and decisions
  var pd = slot("principles");
  (an.principles || []).forEach(function (p) {
    var k = el("div", "panel card"); k.appendChild(el("span", "label", p.id));
    k.appendChild(el("p", "p", p.statement)); if (p.evidence) k.appendChild(el("p", "small muted", p.evidence));
    pd.appendChild(k);
  });
  (an.decisions || []).forEach(function (d) {
    var k = el("div", "panel card"); k.appendChild(el("span", "label", d.needsApproval ? "Needs approval" : "Decided"));
    k.appendChild(el("p", "p", d.chose)); k.appendChild(el("p", "small muted", "Rejected: " + (d.rejected || "–") + ". " + (d.why || "")));
    pd.appendChild(k);
  });
  if (!pd.children.length) empty("principles", "Add principles and decisions to research/analysis.json.");

  // Token derivation
  if ((an.tokens || []).length) {
    var t = el("table"), h = el("tr");
    ["Token", "Value", "Evidence"].forEach(function (x) { h.appendChild(el("th", null, x)); });
    var th = el("thead"); th.appendChild(h); t.appendChild(th);
    var body = el("tbody");
    an.tokens.forEach(function (x) {
      var tr = el("tr"); tr.appendChild(el("td", "mono", x.token)); tr.appendChild(el("td", "mono", x.value)); tr.appendChild(el("td", null, x.evidence));
      body.appendChild(tr);
    });
    t.appendChild(body); slot("tokens").appendChild(t);
  } else empty("tokens", "Every token in tokens.css cites its evidence here.");

  if (only) {
    document.querySelectorAll("main > section").forEach(function (s) { if (s.id !== only) s.hidden = true; });
  }
})();
