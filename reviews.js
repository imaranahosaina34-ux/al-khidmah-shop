import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, query, where, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const sec = document.getElementById("reviews");
if (sec) {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const stars = n => "★".repeat(n) + "☆".repeat(5 - n);

  const st = document.createElement("style");
  st.textContent = `
  .rvl{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin-bottom:18px}
  .rvc{background:#fff;border:1px solid var(--line,#dfe8e1);border-radius:14px;padding:16px}
  .rvc .s{color:#f2a900;letter-spacing:2px}
  .rvm{color:var(--mut,#5f6f65)}
  .rvf{background:#fff;border:1px solid var(--line,#dfe8e1);border-radius:16px;padding:18px;display:grid;gap:10px;max-width:520px}
  .rvf h3{color:var(--gd,#14562a);font-size:18px}
  .rvs{display:flex;gap:4px}
  .rvs button{background:none;border:0;font-size:32px;line-height:1;color:#c9d3cc;cursor:pointer;padding:0 2px}
  .rvs button.on{color:#f2a900}
  .rvf .hp{position:absolute;left:-9999px;height:0;overflow:hidden}
  .rvmsg{font-size:15px;min-height:20px}
  `;
  document.head.appendChild(st);

  sec.innerHTML = `<h2>কাস্টমার রিভিউ</h2><p class="sub">আমাদের গ্রাহকদের অভিজ্ঞতা</p>
  <div class="rvl" id="rvList"><p class="rvm">লোড হচ্ছে...</p></div>
  <form class="rvf" id="rvForm">
    <h3>আপনার মতামত লিখুন</h3>
    <div class="rvs" id="rvStars" role="radiogroup" aria-label="রেটিং">
      <button type="button" data-v="1">★</button><button type="button" data-v="2">★</button><button type="button" data-v="3">★</button><button type="button" data-v="4">★</button><button type="button" data-v="5">★</button>
    </div>
    <input id="rvName" placeholder="আপনার নাম" maxlength="60" required>
    <textarea id="rvText" rows="3" placeholder="পণ্য ও সেবা কেমন লেগেছে?" maxlength="400" required></textarea>
    <div class="hp"><input id="rvHp" tabindex="-1" autocomplete="off" placeholder="website"></div>
    <div class="rvmsg" id="rvMsg"></div>
    <button class="btn p" type="submit" id="rvBtn">রিভিউ জমা দিন</button>
  </form>`;

  const $ = s => sec.querySelector(s);
  const db = getFirestore(getApps().length ? getApp() : initializeApp(firebaseConfig));
  let rating = 0;

  async function loadList() {
    try {
      const snap = await getDocs(query(collection(db, "reviews"), where("approved", "==", true), limit(60)));
      const list = snap.docs.map(d => d.data()).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      $("#rvList").innerHTML = list.length
        ? list.map(r => `<div class="rvc"><p class="s">${stars(Math.min(5, Math.max(1, Number(r.rating) || 5)))}</p><p>“${esc(r.text)}”</p><b>— ${esc(r.name)}</b></div>`).join("")
        : '<p class="rvm">এখনো কোনো রিভিউ নেই। আপনিই প্রথম রিভিউটি দিন!</p>';
    } catch (e) {
      console.error(e);
      $("#rvList").innerHTML = "";
    }
  }

  $("#rvStars").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    rating = Number(b.dataset.v);
    sec.querySelectorAll("#rvStars button").forEach(x => x.classList.toggle("on", Number(x.dataset.v) <= rating));
  });

  $("#rvForm").addEventListener("submit", async e => {
    e.preventDefault();
    const msg = t => { $("#rvMsg").textContent = t; };
    if ($("#rvHp").value) return;
    if (!rating) return msg("⭐ অনুগ্রহ করে তারা (রেটিং) বেছে নিন।");
    try { if (Date.now() - Number(localStorage.getItem("ak_rv") || 0) < 60000) return msg("একটু পরে আবার চেষ্টা করুন।"); } catch {}
    const btn = $("#rvBtn"); btn.disabled = true; msg("");
    try {
      await addDoc(collection(db, "reviews"), {
        name: $("#rvName").value.trim(), rating, text: $("#rvText").value.trim(),
        approved: false, createdAt: serverTimestamp()
      });
      try { localStorage.setItem("ak_rv", String(Date.now())); } catch {}
      $("#rvForm").reset(); rating = 0;
      sec.querySelectorAll("#rvStars button").forEach(x => x.classList.remove("on"));
      msg("✅ ধন্যবাদ! আপনার রিভিউ যাচাইয়ের পর সাইটে দেখা যাবে।");
    } catch (err) {
      console.error(err); msg("রিভিউ জমা হয়নি, আবার চেষ্টা করুন।");
    }
    btn.disabled = false;
  });

  loadList();
}
