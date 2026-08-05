/* ===== Mykey Pocket — 90s internet art layer ===== */
(function () {
  "use strict";
  var API = "";

  /* ---- starfield canvas ---- */
  function starfield() {
    var c = document.getElementById("stars");
    if (!c) return;
    var ctx = c.getContext("2d");
    var stars = [], w, h;
    function resize() {
      w = c.width = window.innerWidth;
      h = c.height = window.innerHeight;
      stars = [];
      var n = Math.min(55, Math.floor((w * h) / 22000));
      for (var i = 0; i < n; i++) {
        stars.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.1 + 0.25,
          s: Math.random() * 0.22 + 0.06, c: Math.random() > 0.5 ? "#8ACE00" : (Math.random() > 0.5 ? "#9B5CFF" : "#FF5A5F") });
      }
    }
    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < stars.length; i++) {
        var st = stars[i];
        st.y += st.s; if (st.y > h) { st.y = 0; st.x = Math.random() * w; }
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 7);
        ctx.fillStyle = st.c; ctx.globalAlpha = 0.5; ctx.fill();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(tick);
    }
    window.addEventListener("resize", resize);
    resize(); tick();
  }

  /* ---- cursor trail sparkles ---- */
  function cursorTrail() {
    var glyphs = ["✦", "✧", "★", "❀", "✺", "♥", "✩"];
    document.addEventListener("mousemove", function (e) {
      var s = document.createElement("div");
      s.className = "spark";
      s.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
      s.style.left = e.clientX + "px";
      s.style.top = e.clientY + "px";
      s.style.color = ["#8ACE00", "#9B5CFF", "#FF5A5F"][Math.floor(Math.random() * 3)];
      document.body.appendChild(s);
      setTimeout(function () { s.remove(); }, 900);
    });
  }

  /* ---- live visitor counter ---- */
  function visitorCounter() {
    var el = document.getElementById("visitor-count");
    if (!el) return;
    fetch(API + "/api/hit").then(function (r) { return r.json(); }).then(function (d) {
      el.textContent = String(d.count).padStart(6, "0");
    }).catch(function () { el.textContent = "000001"; });
  }

  /* ---- guestbook ---- */
  function guestbook() {
    var list = document.getElementById("gb-list");
    var form = document.getElementById("gb-form");
    if (!list) return;
    function load() {
      fetch(API + "/api/guestbook").then(function (r) { return r.json(); }).then(function (d) {
        list.innerHTML = (d.entries.length ? "" : '<li class="gb-entry"><span class="what">no signatures yet. be the first ✦</span></li>');
        d.entries.forEach(function (e) {
          var li = document.createElement("li");
          li.className = "gb-entry";
          var when = e.ts ? e.ts.slice(0, 10) : "";
          li.innerHTML = '<span class="when">' + when + '</span><span class="who">' + escapeHtml(e.name) + '</span><div class="what">' + escapeHtml(e.message) + "</div>";
          list.appendChild(li);
        });
      }).catch(function () {});
    }
    if (form) {
      form.addEventListener("submit", function (ev) {
        ev.preventDefault();
        var name = document.getElementById("gb-name").value;
        var msg = document.getElementById("gb-msg").value;
        if (!msg.trim()) return;
        fetch(API + "/api/guestbook", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name, message: msg }) })
          .then(function () { form.reset(); load(); }).catch(function () {});
      });
    }
    load();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }

  /* ---- konami rainbow ---- */
  function konami() {
    var seq = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
    var i = 0;
    document.addEventListener("keydown", function (e) {
      if (e.key === seq[i]) { i++; if (i === seq.length) { document.body.classList.add("rainbow"); document.title = "✺ mykey pocket ✺"; i = 0; } }
      else { i = (e.key === seq[0]) ? 1 : 0; }
    });
  }

  /* ---- play a tune (WebAudio, no assets) ---- */
  function tune() {
    var btn = document.getElementById("tune-btn");
    if (!btn) return;
    var ctxA, playing = false, timer;
    var notes = [523.25, 659.25, 783.99, 659.25, 587.33, 783.99, 880.0, 783.99];
    btn.addEventListener("click", function () {
      if (!ctxA) ctxA = new (window.AudioContext || window.webkitAudioContext)();
      if (playing) { playing = false; clearInterval(timer); btn.textContent = "▶ play tune"; return; }
      playing = true; btn.textContent = "⏸ stop tune";
      var n = 0;
      function beep() {
        var o = ctxA.createOscillator(), g = ctxA.createGain();
        o.type = "square"; o.frequency.value = notes[n % notes.length];
        o.connect(g); g.connect(ctxA.destination);
        g.gain.setValueAtTime(0.06, ctxA.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ctxA.currentTime + 0.18);
        o.start(); o.stop(ctxA.currentTime + 0.2); n++;
      }
      beep(); timer = setInterval(beep, 220);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    starfield(); cursorTrail(); visitorCounter(); guestbook(); konami(); tune();
  });
})();
