/* =========================================================
   Dot Field 히어로 (업로드 코드의 React 컴포넌트를 바닐라 JS로 옮긴 것)
   - 제목을 점(dot) 격자로 그려 모이게 하고, 커서는 점을 밀어내며,
     빛이 글자를 훑고 지나가고, 스크롤하면 다시 흩어진다.
   - 의존성 없음. 글자색은 .stage 의 color(테마 토큰)를 따른다.
   사용: <section class="dot-hero" data-headline="..." data-accent="#E60023">
   ========================================================= */
(function () {
  "use strict";
  var root = document.querySelector(".dot-hero");
  if (!root) return;

  var cfg = {
    headline: root.getAttribute("data-headline") || "",
    accent: root.getAttribute("data-accent") || "#E60023",
    grid: [20, 13],
    fontFamily: '"Noto Sans KR", "Inter", system-ui, sans-serif',
    fontWeight: 700,
    repelRadius: 120,
    scrollScatter: true,
    hint: { scatter: "스크롤하면 흩어집니다", gather: "위로 올리면 다시 모입니다" }
  };

  var stage = root.querySelector(".stage");
  var cv = root.querySelector("canvas.dots");
  var gl = root.querySelector("canvas.glow");
  var spot = root.querySelector(".spot");
  var copy = root.querySelector(".copy");
  var hint = root.querySelector(".hint");
  var hintLabel = root.querySelector(".hint-label");
  var ctx = cv.getContext("2d"), gtx = gl.getContext("2d");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var s = { W: 0, H: 0, N: 0, P: new Float32Array(0), t0: 0, scrollP: 0, btnP: 0, btnT: 0, last: 0, kick: 0, mouse: { x: -9999, y: -9999, on: false } };
  var raf = 0, visible = true, readyTimer = 0, ready = false, fg = "#000", frameNo = 0;

  function FLOW(x, y, t) {
    return (Math.sin(x * 0.004 + t * 0.7) + Math.cos(y * 0.005 - t * 0.5) + Math.sin((x + y) * 0.002 + t * 0.3)) * Math.PI;
  }
  /* 제목 중심 높이: 좁은 화면은 아래 설명 문구와 겹치지 않게 위로 */
  function cyRatio() { return s.W < 640 ? 0.37 : 0.46; }
  function readFg() { fg = getComputedStyle(stage).color || fg; }

  /* 화면 밖 캔버스에 제목을 그리고 픽셀을 샘플링 */
  function sample() {
    var W = s.W, H = s.H;
    var c = document.createElement("canvas"), g = c.getContext("2d", { willReadFrequently: true });
    c.width = W; c.height = H;
    function font(px) { return cfg.fontWeight + " " + px + "px " + cfg.fontFamily; }
    var words = cfg.headline.split(/\s+/);
    var size = Math.min(W * (W < 640 ? 0.15 : 0.115), H * (W < 640 ? 0.1 : 0.2), 168), lines = [];
    for (;;) {
      g.font = font(size); lines = []; var cur = "";
      for (var i = 0; i < words.length; i++) {
        var w = words[i], t = cur ? cur + " " + w : w;
        if (g.measureText(t).width > W * 0.88 && cur) { lines.push(cur); cur = w; } else cur = t;
      }
      lines.push(cur);
      var fits = lines.length <= 3 && lines.every(function (l) { return g.measureText(l).width <= W * 0.92; });
      if (fits || size < 28) break;
      size *= 0.9;
    }
    g.font = font(size); g.textAlign = "center"; g.textBaseline = "middle";
    try { g.letterSpacing = (-size * 0.03) + "px"; } catch (e) {}
    var lh = size * 1.05, top = H * cyRatio() - ((lines.length - 1) * lh) / 2;
    lines.forEach(function (l, i) { g.fillText(l, W / 2, top + i * lh); });
    var d = g.getImageData(0, 0, W, H).data, pts = [], step = Math.max(3, Math.round(size / 30));
    for (var y = 0; y < H; y += step) for (var x = 0; x < W; x += step) if (d[(y * W + x) * 4 + 3] > 128) pts.push(x, y);
    return pts;
  }

  /* 점 1개당 10칸: x y vx vy homeX homeY textX textY delay isText */
  function build() {
    var r = stage.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    s.W = Math.max(1, Math.round(r.width)); s.H = Math.max(1, Math.round(r.height));
    [cv, gl].forEach(function (c) { c.width = s.W * dpr; c.height = s.H * dpr; });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); gtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var GX = cfg.grid[0], GY = cfg.grid[1], tgt = sample();
    var cols = Math.ceil(s.W / GX) + 1, rows = Math.ceil(s.H / GY) + 1, cells = cols * rows, nText = tgt.length / 2;
    s.N = Math.max(cells, nText);
    var P = new Float32Array(s.N * 10), i;
    for (i = 0; i < s.N; i++) {
      var cell = i < cells ? i : (Math.random() * cells) | 0;
      var hx = (cell % cols) * GX - 6, hy = Math.floor(cell / cols) * GY - 1, o = i * 10;
      P[o] = hx; P[o + 1] = hy; P[o + 4] = hx; P[o + 5] = hy;
    }
    var ids = []; for (i = 0; i < s.N; i++) ids.push(i);
    for (i = ids.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, tmp = ids[i]; ids[i] = ids[j]; ids[j] = tmp; }
    var diag = Math.hypot(s.W, s.H);
    for (var k = 0; k < nText; k++) {
      var oo = ids[k] * 10, tx = tgt[k * 2], ty = tgt[k * 2 + 1];
      P[oo + 6] = tx; P[oo + 7] = ty; P[oo + 9] = 1;
      P[oo + 8] = 0.15 + Math.min(0.9, Math.hypot(tx - s.W / 2, ty - s.H * cyRatio()) / diag) * 1.1 + Math.random() * 0.25;
    }
    s.P = P;
  }

  function setCopy() {
    var p = s.scrollP;
    if (copy) copy.style.opacity = ready ? String(Math.max(0, 1 - p * 1.6)) : "";
    if (hint && hintLabel) {
      var up = p > 0.85;
      hint.setAttribute("data-up", up ? "true" : "false");
      hintLabel.textContent = up ? cfg.hint.gather : cfg.hint.scatter;
      hint.style.opacity = ready ? String(up ? 1 : Math.max(0, 1 - p * 5)) : "0";
    }
  }

  function restart() {
    s.btnP = s.btnT = 0; s.kick = 0;
    readFg(); build(); s.t0 = performance.now();
    ready = false; root.classList.remove("ready");
    clearTimeout(readyTimer);
    readyTimer = setTimeout(function () { ready = true; root.classList.add("ready"); setCopy(); }, reduce ? 0 : 1700);
  }

  function frame(now) {
    raf = 0;
    if (visible) {
      var t = (now - s.t0) / 1000, W = s.W, H = s.H, N = s.N, P = s.P, R = cfg.repelRadius, R2 = R * R;
      if (++frameNo % 30 === 0) readFg();
      s.btnP += (s.btnT - s.btnP) * 0.06;
      var SC = Math.max(s.scrollP, s.btnP);
      s.kick = s.kick * 0.93 + Math.abs(SC - s.last) * 6; s.last = SC;
      var q = Math.min(1, SC), sweep = ((t * 0.35) % 1.6) - 0.3, m = s.mouse;
      ctx.clearRect(0, 0, W, H); gtx.clearRect(0, 0, W, H);
      ctx.fillStyle = fg; gtx.fillStyle = cfg.accent;

      for (var i = 0; i < N; i++) {
        var o = i * 10, isT = P[o + 9] === 1;
        var tx = P[o + 4], ty = P[o + 5], k = 0.06, fl = 0;
        var local = t - P[o + 8];
        if (isT) {
          if (local > 0) {
            var dd = Math.min(1, SC * (0.8 + P[o + 8] * 0.6));
            tx = P[o + 6] + (P[o + 4] - P[o + 6]) * dd; ty = P[o + 7] + (P[o + 5] - P[o + 7]) * dd;
            k = Math.min(0.09, 0.02 + local * 0.08);
          }
          fl = local > -1 ? Math.max(0, 1 - Math.max(0, local) * 1.4) : 0;
        }
        if (s.kick > 0.01) fl = Math.max(fl, Math.min(1, s.kick) * 0.9);

        if (reduce) {
          var d0 = isT ? 1 - q : 0;
          P[o] = P[o + 4] + ((isT ? P[o + 6] : P[o + 4]) - P[o + 4]) * d0;
          P[o + 1] = P[o + 5] + ((isT ? P[o + 7] : P[o + 5]) - P[o + 5]) * d0;
        } else {
          var ax = (tx - P[o]) * k, ay = (ty - P[o + 1]) * k;
          if (fl > 0) { var a = FLOW(P[o], P[o + 1], t); ax += Math.cos(a) * 2.2 * fl; ay += Math.sin(a) * 2.2 * fl; }
          if (m.on && R > 0) {
            var dx = P[o] - m.x, dy = P[o + 1] - m.y, d2 = dx * dx + dy * dy;
            if (d2 < R2) { var dist = Math.sqrt(d2) || 1, f = (1 - dist / R) * 6; ax += (dx / dist) * f; ay += (dy / dist) * f; }
          }
          P[o + 2] = (P[o + 2] + ax) * 0.82; P[o + 3] = (P[o + 3] + ay) * 0.82;
          P[o] += P[o + 2]; P[o + 1] += P[o + 3];
        }

        var x = P[o], y = P[o + 1], sp = Math.abs(P[o + 2]) + Math.abs(P[o + 3]);
        var gridA = Math.min(0.5, 0.12 + sp * 0.05);
        if (isT) {
          var settle = reduce ? 1 - q : Math.min(1, Math.max(0, local * 1.2)) * (1 - q);
          var al = (0.34 + settle * 0.6) * (1 - q) + gridA * q, r = 1 - q * 0.25;
          ctx.globalAlpha = al; ctx.fillRect(x - r, y - r, r * 2, r * 2);
          if (q < 1 && !reduce) {
            var w = Math.max(0, 1 - Math.abs(x / W - sweep) * 7), ga = (w * 0.9 + (1 - settle) * 0.25) * (1 - q);
            if (ga > 0.02) { gtx.globalAlpha = ga; gtx.fillRect(x - 2, y - 2, 4, 4); }
          }
        } else {
          ctx.globalAlpha = gridA; ctx.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);
        }
      }
      ctx.globalAlpha = 1; gtx.globalAlpha = 1;
    }
    raf = requestAnimationFrame(frame);
  }

  /* 섹션 스크롤 진행도: 맨 위 0, 화면 70% 내려가면 1 */
  function onScroll() {
    if (!cfg.scrollScatter) return;
    var r = root.getBoundingClientRect();
    s.scrollP = Math.min(1, Math.max(0, -r.top / (window.innerHeight * 0.7)));
    setCopy();
  }
  function move(e) {
    var r = stage.getBoundingClientRect();
    s.mouse.x = e.clientX - r.left; s.mouse.y = e.clientY - r.top; s.mouse.on = true;
    if (spot) { spot.style.setProperty("--x", s.mouse.x + "px"); spot.style.setProperty("--y", s.mouse.y + "px"); }
  }
  function leave() { s.mouse.on = false; }

  var rt = 0;
  var ro = new ResizeObserver(function () {
    clearTimeout(rt);
    rt = setTimeout(function () { build(); s.t0 = performance.now() - 3000; }, 150);
  });
  var io = new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0 });

  stage.addEventListener("pointermove", move);
  stage.addEventListener("pointerleave", leave);
  window.addEventListener("scroll", onScroll, { passive: true });

  /* 테마가 바뀌면 글자색을 다시 읽는다 */
  new MutationObserver(readFg).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  var fontReady = document.fonts && document.fonts.load
    ? document.fonts.load(cfg.fontWeight + " 100px " + cfg.fontFamily, cfg.headline).catch(function () { return []; })
    : Promise.resolve([]);
  fontReady.then(function () {
    restart(); onScroll();
    ro.observe(stage); io.observe(stage);
    raf = requestAnimationFrame(frame);
  });

  window.dotHero = { replay: restart, setScattered: function (v) { s.btnT = v ? 1 : 0; } };
})();
