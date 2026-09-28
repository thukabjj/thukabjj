// Applies ?theme=dark|light (default: the board's data-theme or dark) before paint.
(function () {
  var q = new URLSearchParams(location.search).get("theme");
  var root = document.documentElement;
  if (q === "dark" || q === "light") root.setAttribute("data-theme", q);
  else if (!root.getAttribute("data-theme")) root.setAttribute("data-theme", "dark");
})();
