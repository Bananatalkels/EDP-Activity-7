/**
 * Shared UI helpers — auth guard, sidebar nav, alerts
 * Firearm Registry System v1.0.5
 */

const APP_COMPANY = {
  name: "Firearm Registry Bureau",
  tagline: "Official Records & Compliance Division",
  version: "v1.0.5",
};

const NAV_PAGES = [
  { section: "Main", items: [
    { href: "dashboard.html", icon: "⊞", label: "Dashboard", key: "dashboard" },
    { href: "inventory.html", icon: "⊟", label: "Inventory", key: "inventory" },
    { href: "users.html", icon: "◉", label: "User Management", key: "users" },
  ]},
  { section: "Transactions", items: [
    { href: "sales.html", icon: "◎", label: "Sales Transaction", key: "sales" },
    { href: "borrowing.html", icon: "⇄", label: "Firearm Borrowing", key: "borrowing" },
    { href: "inventory-count.html", icon: "⊡", label: "Inventory Count", key: "inventory-count" },
  ]},
  { section: "Reports", items: [
    { href: "reports.html", icon: "▤", label: "Report Generation", key: "reports" },
  ]},
  { section: "System", items: [
    { href: "about.html", icon: "ℹ", label: "About Program", key: "about" },
  ]},
];

function renderSidebarNav(activeKey) {
  return NAV_PAGES.map((group) => `
    <div class="nav-label">${group.section}</div>
    ${group.items.map((item) => `
      <a href="${item.href}" class="nav-item${item.key === activeKey ? " active" : ""}">
        <span class="icon">${item.icon}</span> ${item.label}
      </a>
    `).join("")}
  `).join("");
}

function initApp(activeKey) {
  DB.seedFromJSON("users.json");
  DB.seedDemoData();
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
  if (!currentUser) {
    window.location.href = "login.html";
    return null;
  }

  const navEl = document.getElementById("sidebarNav");
  if (navEl) navEl.innerHTML = renderSidebarNav(activeKey);

  const avatar = document.getElementById("sidebarAvatar");
  const name = document.getElementById("sidebarName");
  const role = document.getElementById("sidebarRole");
  if (avatar) avatar.textContent = currentUser.avatar || currentUser.fullName.slice(0, 2).toUpperCase();
  if (name) name.textContent = currentUser.fullName;
  if (role) role.textContent = currentUser.role;

  return currentUser;
}

function logout() {
  sessionStorage.removeItem("currentUser");
  window.location.href = "login.html";
}

function showAlert(elId, msg, type) {
  const b = document.getElementById(elId);
  if (!b) return;
  b.textContent = msg;
  b.className = `alert alert-${type}`;
  b.style.display = "block";
  setTimeout(() => { b.style.display = "none"; }, 4000);
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function nextTxnNo(prefix, table) {
  const rows = DB.select(table);
  const n = rows.length + 1;
  return `${prefix}-${String(n).padStart(5, "0")}`;
}
