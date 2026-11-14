/* ফাতিহ ’২১ · অতীত থেকে ভবিষ্যৎ — পেজের আচরণ */
(function () {
  "use strict";

  var SITE = window.SITE || {};
  var NOTICES = Array.isArray(window.NOTICES) ? window.NOTICES.slice() : [];

  var BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  var BN_MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];

  function bn(n) {
    return String(n).replace(/\d/g, function (d) { return BN_DIGITS[d]; });
  }

  function bnDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
    if (!m) return iso || "";
    return bn(parseInt(m[3], 10)) + " " + BN_MONTHS[parseInt(m[2], 10) - 1] + " " + bn(m[1]);
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* ── নোটিশ ─────────────────────────────────── */
  function sortedNotices() {
    return NOTICES.sort(function (a, b) {
      if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
      return String(b.date).localeCompare(String(a.date));
    });
  }

  function renderNotices() {
    var list = document.getElementById("noticeList");
    if (!list) return;
    var items = sortedNotices();
    list.textContent = "";

    if (!items.length) {
      var empty = el("li", "empty", "এখনো কোনো নোটিশ নেই। নতুন ঘোষণা এলে এখানেই দেখা যাবে।");
      list.appendChild(empty);
    }

    items.forEach(function (n) {
      var li = el("li", "notice");
      li.appendChild(el("time", "notice__date", bnDate(n.date)));
      li.firstChild.setAttribute("datetime", n.date);

      var box = el("div", "notice__body");
      if (n.pinned) box.appendChild(el("span", "pin", "গুরুত্বপূর্ণ"));
      box.appendChild(el("h3", null, n.title));
      if (n.body) box.appendChild(el("p", null, n.body));
      if (n.link && n.link.url) {
        var a = el("a", "btn btn--line", n.link.text || "বিস্তারিত");
        a.href = n.link.url;
        a.target = "_blank";
        a.rel = "noopener";
        box.appendChild(a);
      }
      li.appendChild(box);
      list.appendChild(li);
    });

    var badge = document.getElementById("noticeCount");
    if (badge && items.length) {
      badge.textContent = bn(items.length);
      badge.hidden = false;
    }

    var ticker = document.getElementById("ticker");
    if (ticker && items.length) {
      document.getElementById("tickerText").textContent = items[0].title;
      ticker.hidden = false;
    }
  }

  /* ── ফুটারের ফোন ──────────────────────────── */
  function renderPhone() {
    var p = document.getElementById("phone");
    if (!p || !SITE.phone) return;
    var a = el("a", null, SITE.phone);
    a.href = "tel:" + SITE.phone.replace(/[^\d+]/g, "");
    p.replaceWith(a);
  }

  /* ── সময় গণনা ────────────────────────────── */
  function renderCountdown() {
    var row = document.getElementById("countdownRow");
    var out = document.getElementById("countdown");
    if (!row || !out || !SITE.registrationDeadline) return;
    var end = new Date(SITE.registrationDeadline).getTime();
    if (isNaN(end)) return;

    function tick() {
      var ms = end - Date.now();
      row.hidden = false;
      if (ms <= 0) {
        out.textContent = "সময় শেষ";
        return;
      }
      var days = Math.floor(ms / 86400000);
      var hours = Math.floor((ms % 86400000) / 3600000);
      out.textContent = days > 0
        ? bn(days) + " দিন " + bn(hours) + " ঘণ্টা"
        : bn(hours) + " ঘণ্টা " + bn(Math.floor((ms % 3600000) / 60000)) + " মিনিট";
    }
    tick();
    setInterval(tick, 60000);
  }

  /* ── ফর্মের ট্যাব ─────────────────────────── */
  function initTabs() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.tabs [role="tab"]'));
    if (!tabs.length) return;

    function select(name, focus) {
      tabs.forEach(function (t) {
        var on = t.getAttribute("data-tab") === name;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
        if (on && focus) t.focus();
      });
    }

    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(t.getAttribute("data-tab")); });
      t.addEventListener("keydown", function (e) {
        var j = null;
        if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
        if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
        if (j !== null) {
          e.preventDefault();
          select(tabs[j].getAttribute("data-tab"), true);
        }
      });
    });

    // অন্য জায়গা থেকে "প্রজেক্ট জমা" ট্যাব খোলার লিংক
    document.querySelectorAll("a[data-tab]").forEach(function (a) {
      a.addEventListener("click", function () { select(a.getAttribute("data-tab")); });
    });
  }

  /* ── মেনুতে বর্তমান অংশ চিহ্নিত করা ───────── */
  function initNavHighlight() {
    var links = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));
    var sections = links
      .map(function (l) { return document.getElementById(l.getAttribute("data-nav")); })
      .filter(Boolean);
    if (!("IntersectionObserver" in window) || !sections.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (l) {
          l.removeAttribute("aria-current");
          if (l.getAttribute("data-nav") === en.target.id) l.setAttribute("aria-current", "true");
        });
      });
    }, { rootMargin: "-35% 0px -55% 0px" });

    sections.forEach(function (s) { io.observe(s); });
  }

  renderNotices();
  renderPhone();
  renderCountdown();
  initTabs();
  initNavHighlight();
})();
