// ================================================================
//  POWERPATCH ADMIN — admin.js
//  Firebase Firestore (CDN) | Vanilla JS | No backend
//  All original logic preserved — UI layer upgraded
// ================================================================

import { initializeApp }  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, orderBy, query }
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ── Firebase config ─────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBWHLZ1qRzDQIEpBZ0TZSzt_cdTx27toG4",
  authDomain: "powerpatch-7d9ae.firebaseapp.com",
  projectId: "powerpatch-7d9ae",
  storageBucket: "powerpatch-7d9ae.firebasestorage.app",
  messagingSenderId: "370451089713",
  appId: "1:370451089713:web:42109b8cd0084da3184810",
  measurementId: "G-ZG4LY5TX42"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── DOM refs ────────────────────────────────────────────────────
const container    = document.getElementById("orders-container");
const searchInput  = document.getElementById("searchInput");
const filterBtns   = document.querySelectorAll(".filter-btn");
const menuBtn      = document.getElementById("menuBtn");
const sidebar      = document.getElementById("sidebar");
const modalOverlay = document.getElementById("modalOverlay");
const modalClose   = document.getElementById("modalClose");
const modalContent = document.getElementById("modalContent");
const toast        = document.getElementById("toast");
const refreshBtn   = document.getElementById("refreshBtn");
const navOrderCount = document.getElementById("navOrderCount");

// ── State ────────────────────────────────────────────────────────
let allOrders    = [];
let activeFilter = "all";

const STATUS_ORDER = ["pending", "confirmed", "shipped", "delivered"];


// AUTH CHECK //
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const auth = getAuth();

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "/admin/login.html";
  }
});

// ── Init ─────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadOrders();
  setupMobileMenu();
  setupModalClose();
  setupSearch();
  setupFilters();
  refreshBtn?.addEventListener("click", () => {
    allOrders = [];
    container.innerHTML = `<div class="loading-state"><div class="spinner"></div><span>Refreshing…</span></div>`;
    loadOrders();
  });
});

// ── Load Orders ──────────────────────────────────────────────────
async function loadOrders() {
  try {
    const q    = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    allOrders  = snap.docs.map(d => ({ id: d.id, data: d.data() }));
  } catch {
    // Fallback: fetch without index, sort manually
    try {
      const snap = await getDocs(collection(db, "orders"));
      allOrders  = snap.docs.map(d => ({ id: d.id, data: d.data() }));
      allOrders.sort((a, b) => {
        const ta = a.data.createdAt?.seconds || 0;
        const tb = b.data.createdAt?.seconds || 0;
        return tb - ta;
      });
    } catch (e) {
      showToast("Failed to load orders: " + e.message, true);
      container.innerHTML = `<div class="empty-state">⚠️ Could not load orders.</div>`;
      return;
    }
  }

  updateStats();
  renderOrders();
}

// ── Stats ────────────────────────────────────────────────────────
function updateStats() {
  const total   = allOrders.length;
  const pending = allOrders.filter(o => o.data.status === "pending").length;
  const active  = allOrders.filter(o => ["confirmed", "shipped"].includes(o.data.status)).length;
  const revenue = allOrders.reduce((sum, o) => sum + (Number(o.data.order?.total) || 0), 0);

  document.getElementById("totalOrders").textContent  = total;
  document.getElementById("pendingOrders").textContent = pending;
  document.getElementById("activeOrders").textContent  = active;
  document.getElementById("totalRevenue").textContent  = "₹" + revenue.toLocaleString("en-IN");

  // Sidebar badge
  if (navOrderCount) navOrderCount.textContent = total || "—";

  // Progress bars
  if (total > 0) {
    document.getElementById("pendingBar").style.width = (pending / total * 100) + "%";
    document.getElementById("activeBar").style.width  = (active  / total * 100) + "%";
  }
}

// ── Render Orders ────────────────────────────────────────────────
function renderOrders() {
  const search = searchInput.value.trim().toLowerCase();

  const filtered = allOrders.filter(({ data }) => {
    const matchFilter = activeFilter === "all" || data.status === activeFilter;
    const matchSearch = !search ||
      (data.customer?.name  || "").toLowerCase().includes(search) ||
      (data.customer?.phone || "").toLowerCase().includes(search);
    return matchFilter && matchSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state">📭 No orders found.</div>`;
    return;
  }

  container.innerHTML = "";

  filtered.forEach(({ id, data }, idx) => {
    const row = document.createElement("div");
    const status = (data.status || "pending").toLowerCase();

    row.className = "order-row" + (status === "pending" ? " is-pending" : "");
    row.style.animationDelay = (idx * 35) + "ms";

    // Items chips (max 3 + overflow count)
    const items    = data.order?.items || [];
    const chips    = items.slice(0, 3).map(i =>
      `<span class="item-chip">${esc(i.name)} ×${i.qty}</span>`
    ).join("");
    const overflow = items.length > 3
      ? `<span class="item-chip">+${items.length - 3} more</span>`
      : "";

    const date = data.createdAt
      ? new Date(data.createdAt.seconds * 1000).toLocaleDateString("en-IN", {
          day: "2-digit", month: "short", year: "numeric"
        })
      : "—";

    row.innerHTML = `
      <div>
        <div class="order-customer-name" data-id="${id}">${esc(data.customer?.name || "—")}</div>
        <div class="order-customer-city">${esc(data.address?.city || "")}</div>
      </div>
      <div class="order-phone">${esc(data.customer?.phone || "—")}</div>
      <div class="order-items-preview">${chips || "—"}${overflow}</div>
      <div class="order-total">${esc("₹" + Number(data.order?.total || 0).toLocaleString("en-IN"))}</div>
      <div><span class="status-badge status-${status}">${capitalize(status)}</span></div>
      <div class="order-date">${date}</div>
      <div>
        <select class="status-select" data-id="${id}" data-current="${status}">
          ${STATUS_ORDER.map(s =>
            `<option value="${s}" ${s === status ? "selected" : ""}>${capitalize(s)}</option>`
          ).join("")}
        </select>
      </div>
    `;

    // Click name → modal
    row.querySelector(".order-customer-name").addEventListener("click", () => openModal(id, data));

    // Status change → Firestore
    row.querySelector(".status-select").addEventListener("change", (e) => {
      updateStatus(id, e.target.value, e.target);
    });

    container.appendChild(row);
  });
}

// ── Update Status ────────────────────────────────────────────────
async function updateStatus(orderId, newStatus, selectEl) {
  const prev = selectEl.getAttribute("data-current");
  if (prev === newStatus) return;

  selectEl.disabled = true;

  try {
    await updateDoc(doc(db, "orders", orderId), { status: newStatus });

    // Update local cache
    const order = allOrders.find(o => o.id === orderId);
    if (order) order.data.status = newStatus;

    selectEl.setAttribute("data-current", newStatus);
    updateStats();
    showToast(`✅ Status updated → ${capitalize(newStatus)}`);

    // Refresh badge + pending class in same row
    const row   = selectEl.closest(".order-row");
    const badge = row.querySelector(".status-badge");
    if (badge) {
      badge.className = `status-badge status-${newStatus}`;
      badge.textContent = capitalize(newStatus);
    }
    if (newStatus === "pending") {
      row.classList.add("is-pending");
    } else {
      row.classList.remove("is-pending");
    }

  } catch (err) {
    showToast("❌ Update failed: " + err.message, true);
    selectEl.value = prev;
  } finally {
    selectEl.disabled = false;
  }
}

// ── Modal ────────────────────────────────────────────────────────
function openModal(id, data) {
  const items  = data.order?.items || [];
  const status = (data.status || "pending").toLowerCase();
  const date   = data.createdAt
    ? new Date(data.createdAt.seconds * 1000).toLocaleString("en-IN")
    : "—";

  const itemRows = items.map(i => `
    <tr>
      <td>${esc(i.name)}</td>
      <td>${i.qty}</td>
      <td>₹${Number(i.price).toLocaleString("en-IN")}</td>
      <td>₹${Number(i.price * i.qty).toLocaleString("en-IN")}</td>
    </tr>
  `).join("");

  modalContent.innerHTML = `

    <div class="modal-section">
      <div class="modal-section-title">Customer</div>
      <div class="modal-row">
        <span class="modal-row-label">Name</span>
        <span class="modal-row-value">${esc(data.customer?.name || "—")}</span>
      </div>
      <div class="modal-row">
        <span class="modal-row-label">Phone</span>
        <span class="modal-row-value" style="font-family:'DM Mono',monospace">${esc(data.customer?.phone || "—")}</span>
      </div>
      <div class="modal-row">
        <span class="modal-row-label">Email</span>
        <span class="modal-row-value">${esc(data.customer?.email || "—")}</span>
      </div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Delivery Address</div>
      <div class="modal-row">
        <span class="modal-row-label">Street</span>
        <span class="modal-row-value">${esc(address.line || "—")}</span>
      </div>
      <div class="modal-row">
        <span class="modal-row-label">City</span>
        <span class="modal-row-value">${esc(address.city || "—")}</span>
      </div>
      <div class="modal-row">
        <span class="modal-row-label">Pincode</span>
        <span class="modal-row-value" style="font-family:'DM Mono',monospace">${esc(address.pincode || "—")}</span>
      </div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Order Items</div>
      <table class="modal-items-table">
        <thead>
          <tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr>
        </thead>
        <tbody>
          ${itemRows || `<tr><td colspan="4" style="color:var(--text-muted);text-align:center;padding:16px">No items</td></tr>`}
          <tr class="modal-total-row">
            <td colspan="3">Order Total</td>
            <td>₹${Number(data.order?.total || 0).toLocaleString("en-IN")}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Order Info</div>
      <div class="modal-row">
        <span class="modal-row-label">Order ID</span>
        <span class="order-id-mono">${id}</span>
      </div>
      <div class="modal-row">
        <span class="modal-row-label">Status</span>
        <span><span class="status-badge status-${status}">${capitalize(status)}</span></span>
      </div>
      <div class="modal-row">
        <span class="modal-row-label">Date</span>
        <span class="modal-row-value" style="font-family:'DM Mono',monospace;font-size:12px">${date}</span>
      </div>
    </div>
  `;

  modalOverlay.classList.add("open");
}

// ── Modal close ──────────────────────────────────────────────────
function setupModalClose() {
  modalClose.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}
function closeModal() { modalOverlay.classList.remove("open"); }

// ── Search ───────────────────────────────────────────────────────
function setupSearch() {
  searchInput.addEventListener("input", renderOrders);
}

// ── Filters ──────────────────────────────────────────────────────
function setupFilters() {
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.dataset.filter;
      renderOrders();
    });
  });
}

// ── Mobile menu ──────────────────────────────────────────────────
function setupMobileMenu() {
  const backdrop = document.createElement("div");
  backdrop.className = "sidebar-backdrop";
  document.body.appendChild(backdrop);

  menuBtn?.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    backdrop.classList.toggle("open");
  });
  backdrop.addEventListener("click", () => {
    sidebar.classList.remove("open");
    backdrop.classList.remove("open");
  });
}

// ── Helpers ──────────────────────────────────────────────────────
function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

let toastTimer;
function showToast(msg, isError = false) {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.className = "toast show" + (isError ? " error" : "");
  toastTimer = setTimeout(() => { toast.className = "toast"; }, 3200);
}
