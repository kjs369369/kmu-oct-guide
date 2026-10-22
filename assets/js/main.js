/* =========================================================
   페이지 동작: 테마(밝게/어둡게) · 헤더 메뉴 활성 표시 · 동선 지도 · 토글 일괄 펼치기
   ========================================================= */
(function () {
  "use strict";
  var doc = document.documentElement;
  var KEY = "kmu-oct-theme";

  /* ---------- 1. 테마 ---------- */
  function systemDark() { return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches; }
  function current() { return doc.getAttribute("data-theme") || (systemDark() ? "dark" : "light"); }
  function paint() {
    var btn = document.getElementById("theme-btn");
    if (!btn) return;
    var dark = current() === "dark";
    btn.setAttribute("aria-pressed", dark ? "true" : "false");
    btn.setAttribute("aria-label", dark ? "밝게 보기로 전환" : "어둡게 보기로 전환");
    btn.querySelector(".lbl").textContent = dark ? "밝게" : "어둡게";
    btn.querySelector(".i-sun").style.display = dark ? "" : "none";
    btn.querySelector(".i-moon").style.display = dark ? "none" : "";
  }
  try { var saved = localStorage.getItem(KEY); if (saved === "dark" || saved === "light") doc.setAttribute("data-theme", saved); } catch (e) {}
  document.addEventListener("DOMContentLoaded", function () {
    paint();
    var btn = document.getElementById("theme-btn");
    if (btn) btn.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      doc.setAttribute("data-theme", next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
      paint();
    });
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var onChange = function () { if (!doc.getAttribute("data-theme")) paint(); };
      if (mq.addEventListener) mq.addEventListener("change", onChange); else if (mq.addListener) mq.addListener(onChange);
    }

    /* ---------- 2. 헤더 메뉴: 현재 보고 있는 구역 표시 ---------- */
    var links = Array.prototype.slice.call(document.querySelectorAll(".gnav a[href^='#']"));
    var map = {};
    links.forEach(function (a) { var el = document.querySelector(a.getAttribute("href")); if (el) map[a.getAttribute("href").slice(1)] = a; });
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var a = map[en.target.id];
          if (!a) return;
          links.forEach(function (l) { l.classList.remove("on"); l.removeAttribute("aria-current"); });
          a.classList.add("on"); a.setAttribute("aria-current", "true");
          if (a.scrollIntoView && window.innerWidth <= 720) {
            var nav = a.closest(".gnav");
            if (nav) nav.scrollTo({ left: a.offsetLeft - 16, behavior: "smooth" });
          }
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
    }

    /* ---------- 3. 동선 지도 버튼 ---------- */
    var r = document.getElementById("route");
    if (r) {
      var bs = r.querySelectorAll(".route-ctrl button");
      Array.prototype.forEach.call(bs, function (b) {
        b.addEventListener("click", function () {
          Array.prototype.forEach.call(bs, function (x) { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
          r.setAttribute("data-show", b.getAttribute("data-k"));
          Array.prototype.forEach.call(r.querySelectorAll(".case,.ln"), function (p) { p.style.animation = "none"; void p.getBBox(); p.style.animation = ""; });
        });
      });
    }

    /* ---------- 4. 토글 모두 펼치기/접기 ---------- */
    Array.prototype.forEach.call(document.querySelectorAll("[data-toggle-all]"), function (btn) {
      var scope = document.querySelector(btn.getAttribute("data-toggle-all"));
      if (!scope) return;
      btn.addEventListener("click", function () {
        var items = scope.querySelectorAll("details");
        var open = btn.getAttribute("aria-expanded") !== "true";
        Array.prototype.forEach.call(items, function (d) { d.open = open; });
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        btn.textContent = open ? "모두 접기" : "모두 펼치기";
      });
    });
  });
})();
