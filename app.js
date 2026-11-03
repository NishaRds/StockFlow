// STOCKFLOW MAIN APPLICATION

const users = safeParseStorage("sf_users", []);
const sessionId = localStorage.getItem("sf_session");

const currentUser = users.find(user =>
  String(user.id) === String(sessionId)
);

if (!currentUser) {
  window.location.replace("index.html");
} else {
  startApp();
}

function safeParseStorage(key, fallback) {
  try { const value = JSON.parse(localStorage.getItem(key) || "null"); return value == null ? fallback : value; }
  catch (error) { console.warn("Invalid localStorage data for", key, error); return fallback; }
}

function startApp() {

  // WHO IS LOGGED IN, AND WHOSE SHOP DATA TO OPEN

  const isStaff = currentUser.role === "staff";
  const shopId = isStaff ? currentUser.ownerId : currentUser.id;

  // SHOP-SPECIFIC STORAGE

  const productKey = "sf_products_" + shopId;
  const customerKey = "sf_customers_" + shopId;
  const salesKey = "sf_sales_" + shopId;

  let products = safeParseStorage(productKey, []);
  let customers = safeParseStorage(customerKey, []);
  let sales = safeParseStorage(salesKey, []);
  if (!Array.isArray(products)) products = [];
  if (!Array.isArray(customers)) customers = [];
  if (!Array.isArray(sales)) sales = [];

  let cart = [];
  let lastReceipt = null;
  let inventoryLowOnly = false;
  let checkoutAfterCustomerSave = false;
  let editingProductId = null;

  function saveProducts() {
    localStorage.setItem(productKey, JSON.stringify(products));
  }

  function saveCustomers() {
    localStorage.setItem(customerKey, JSON.stringify(customers));
  }

  function saveSales() {
    localStorage.setItem(salesKey, JSON.stringify(sales));
  }

  const EXPIRY_WARN_DAYS = 7;

  function money(value) {
    return "₹" + Number(value || 0).toFixed(2);
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }

  function formatDate(value) {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  function formatDateTime(value) {
    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  // SHOP INFORMATION

  document.getElementById("sidebarOwner").textContent = currentUser.ownerName;
  document.getElementById("sidebarShop").textContent = currentUser.shopName;
  document.getElementById("sidebarAvatar").textContent =
    currentUser.ownerName.charAt(0).toUpperCase();

  document.getElementById("welcomeOwner").textContent = currentUser.ownerName;
  document.getElementById("topShopName").textContent = currentUser.shopName;

  document.getElementById("todayDate").textContent =
    new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
      // =================================
  // SIDEBAR MENU
  // =================================

  const sidebar = document.querySelector(".sidebar");
  const menuToggle = document.getElementById("menuToggle");
  const sidebarBackdrop = document.getElementById("sidebarBackdrop");

  function openSidebar() {
    sidebar.classList.add("open");
    sidebarBackdrop.classList.add("show");
    menuToggle.setAttribute("aria-expanded", "true");
  }

  function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarBackdrop.classList.remove("show");
    menuToggle.setAttribute("aria-expanded", "false");
  }

  menuToggle.addEventListener("click", () => {
    if (sidebar.classList.contains("open")) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  sidebarBackdrop.addEventListener("click", closeSidebar);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeSidebar();
      closeSettings();
    }
  });


  // =================================
  // APPEARANCE SETTINGS
  // =================================

  const settingsKey = "sf_settings_" + currentUser.id;

  const settingsPanel = document.getElementById("settingsPanel");
  const settingsToggle = document.getElementById("settingsToggle");
  const closeSettingsButton = document.getElementById("closeSettings");

  const themeSelect = document.getElementById("themeSelect");
  const fontSizeSelect = document.getElementById("fontSizeSelect");
  const fontStyleSelect = document.getElementById("fontStyleSelect");

  const defaultSettings = {
    theme: "light",
    fontSize: "medium",
    fontStyle: "Arial"
  };

  let settings = {};

  try {
    settings = {
      ...defaultSettings,
      ...JSON.parse(localStorage.getItem(settingsKey) || "{}")
    };
  } catch (error) {
    settings = { ...defaultSettings };
  }

  function saveSettings() {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
  }

  function applySettings() {

    // Theme
    document.body.dataset.theme = settings.theme;

    // Font size
    document.body.dataset.fontSize = settings.fontSize;

    // Font style
    const fonts = {
      Arial: "Arial, Helvetica, sans-serif",
      Inter: "'Inter', Arial, sans-serif",
      Poppins: "'Poppins', Arial, sans-serif",
      Roboto: "'Roboto', Arial, sans-serif"
    };

    document.body.style.setProperty(
      "--app-font",
      fonts[settings.fontStyle] || fonts.Arial
    );

    // Update dropdowns
    themeSelect.value = settings.theme;
    fontSizeSelect.value = settings.fontSize;
    fontStyleSelect.value = settings.fontStyle;
  }

  function closeSettings() {
    settingsPanel.classList.add("hidden");
    settingsToggle.setAttribute("aria-expanded", "false");
  }

  function toggleSettings() {
    const isOpen = !settingsPanel.classList.contains("hidden");

    if (isOpen) {
      closeSettings();
    } else {
      settingsPanel.classList.remove("hidden");
      settingsToggle.setAttribute("aria-expanded", "true");
    }
  }

  settingsToggle.addEventListener("click", event => {
    event.stopPropagation();
    toggleSettings();
  });

  closeSettingsButton.addEventListener("click", closeSettings);

  // Close settings when clicking outside
  document.addEventListener("click", event => {
    if (
      !settingsPanel.contains(event.target) &&
      !settingsToggle.contains(event.target)
    ) {
      closeSettings();
    }
  });

  // Theme change
  themeSelect.addEventListener("change", () => {
    settings.theme = themeSelect.value;
    applySettings();
    saveSettings();
  });

  // Font size change
  fontSizeSelect.addEventListener("change", () => {
    settings.fontSize = fontSizeSelect.value;
    applySettings();
    saveSettings();
  });

  // Font style change
  fontStyleSelect.addEventListener("change", () => {
    settings.fontStyle = fontStyleSelect.value;
    applySettings();
    saveSettings();
  });

  // Apply saved settings when dashboard opens
  applySettings();

  // NAVIGATION

  const pageNames = {
    dashboard: "Dashboard",
    products: "Inventory",
    billing: "Billing",
    customers: "Customers",
    sales: "Sales History"
  };

  function showPage(pageName) {
    document.querySelectorAll(".page-section").forEach(section => {
      section.classList.add("hidden");
    });

    const selectedPage = document.getElementById("page-" + pageName);

    if (selectedPage) {
      selectedPage.classList.remove("hidden");
    }

    document.querySelectorAll(".nav-link").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.page === pageName
      );
    });

    document.getElementById("pageTitle").textContent =
      pageNames[pageName] || "Dashboard";

    if (pageName === "dashboard") renderDashboard();
    if (pageName === "products") renderProducts();
    if (pageName === "billing") renderBilling();
    if (pageName === "customers") renderCustomers();
    if (pageName === "sales") renderSales();
  }

  document.querySelectorAll(".nav-link").forEach(button => {
    button.addEventListener("click", () => {
      if (button.dataset.page === "products") inventoryLowOnly = false;
      showPage(button.dataset.page);
    });
  });

  document.querySelectorAll("[data-dashboard-goto]").forEach(button => {
    button.addEventListener("click", () => {
      const target = button.dataset.dashboardGoto;
      if (target === "products-low") { inventoryLowOnly = true; showPage("products"); }
      else { if (target === "products") inventoryLowOnly = false; showPage(target); }
    });
  });

  document.querySelectorAll("[data-goto]").forEach(button => {
    button.addEventListener("click", () => {
      if (button.dataset.goto === "products") inventoryLowOnly = false;
      showPage(button.dataset.goto);
          closeSidebar();
    closeSettings();
    });
  });

  // HOME BUTTON (one click back to the dashboard)

  document.getElementById("homeBtn").addEventListener("click", () => {
    inventoryLowOnly = false;
    showPage("dashboard");
    closeSidebar();
    closeSettings();
  });

  // LOGOUT

  document.getElementById("logoutBtn").addEventListener("click", () => {
    const confirmed = confirm("Are you sure you want to log out?");

    if (confirmed) {
      localStorage.removeItem("sf_session");
      window.location.href = "index.html";
    }
  });

  // DASHBOARD

  function renderWeekChart() {
    // 1. Make a list of the last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        key: d.toDateString(),
        label: d.toLocaleDateString("en-IN", { weekday: "short" }),
        units: 0,
        amount: 0
      });
    }

    // 2. Add every bill to its day
    sales.forEach(sale => {
      const day = days.find(d => d.key === new Date(sale.date).toDateString());
      if (!day) return;
      day.amount += Number(sale.total);
      (sale.items || []).forEach(item => day.units += Number(item.quantity));
    });

    // 3. Work out where each dot goes
    const max = Math.max(...days.map(d => d.units), 1);
    document.getElementById("weekTotal").textContent =
      days.reduce((sum, d) => sum + d.units, 0) + " items sold";

    const pts = days.map((d, i) => ({
      x: 40 + i * 96,
      y: 150 - (d.units / max) * 110,
      d
    }));
    const line = pts.map(p => `${p.x},${p.y}`).join(" ");

    // 4. Draw the line chart
    document.getElementById("weekChart").innerHTML = `
      <svg viewBox="0 0 656 185" class="line-svg">
        <line x1="40" y1="150" x2="616" y2="150" class="line-axis"/>
        <polygon points="40,150 ${line} 616,150" class="line-area"/>
        <polyline points="${line}" class="line-path"/>
        ${pts.map(p => `
          <circle cx="${p.x}" cy="${p.y}" r="5" class="line-dot">
            <title>${p.d.units} items, ${money(p.d.amount)}</title>
          </circle>
          <text x="${p.x}" y="${p.y - 12}" class="line-num">${p.d.units}</text>
          <text x="${p.x}" y="172" class="line-day">${p.d.label}</text>
        `).join("")}
      </svg>`;
  }

  function renderDashboard() {
    renderWeekChart();
    renderExpiryList();
    renderPendingList();
    const lowStockProducts = products.filter(product =>
      Number(product.qty) <= Number(product.limit)
    );

    const totalSales = sales.reduce((sum, sale) =>
      sum + Number(sale.total), 0
    );

    document.getElementById("statProducts").textContent = products.length;
    document.getElementById("statLowStock").textContent = lowStockProducts.length;
    document.getElementById("statCustomers").textContent = customers.length;
    document.getElementById("statSales").textContent = money(totalSales);

    document.getElementById("alertCount").textContent = lowStockProducts.length;

    // Recent sales

    const recentBody = document.getElementById("recentSalesBody");
    const recentSales = [...sales].reverse().slice(0, 5);

    if (recentSales.length === 0) {
      recentBody.innerHTML =
        '<tr><td colspan="4" class="empty-cell">No sales yet.</td></tr>';
    } else {
      recentBody.innerHTML = recentSales.map(sale => `
        <tr>
          <td>${escapeHTML(sale.id)}</td>
          <td>${escapeHTML(sale.customerName)}</td>
          <td>${money(sale.total)}</td>
          <td>${formatDate(sale.date)}</td>
        </tr>
      `).join("");
    }

    // Low-stock alerts

    const alertArea = document.getElementById("dashboardLowStock");

    const outstanding = sales.reduce((sum, sale) => sum + saleDue(sale), 0);
    const dueCustomers = customers.filter(customer => customerDue(customer) > 0);
    const paymentsReceived = sales.reduce((sum, sale) => sum + salePaid(sale), 0);
    document.getElementById("dashboardOutstanding").textContent = money(outstanding);
    document.getElementById("dashboardDueCustomers").textContent = dueCustomers.length;
    document.getElementById("dashboardPaymentsReceived").textContent = money(paymentsReceived);

    if (lowStockProducts.length === 0) {
      alertArea.innerHTML =
        '<p class="empty-note">All products have sufficient stock.</p>';
    } else {
      alertArea.innerHTML = lowStockProducts.map(product => `
        <div class="alert-item">
          <div>
            <strong>${escapeHTML(product.name)}</strong>
            <small>${escapeHTML(product.category)}</small>
          </div>
          <span class="alert-qty">${product.qty} left</span>
        </div>
      `).join("");
    }
  }

  // PRODUCT MANAGEMENT

  const productModal = document.getElementById("productModal");
  const productForm = document.getElementById("productForm");

  document.getElementById("openAddProduct").addEventListener("click", () => {
    productForm.reset();
    editingProductId = null;
    document.getElementById("productLimit").value = 5;
    document.getElementById("productModalTitle").textContent = "Add New Product";
    productModal.classList.remove("hidden");
  });

  document.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", () => {
      document.getElementById(button.dataset.close).classList.add("hidden");
      if (button.dataset.close === "customerModal") checkoutAfterCustomerSave = false;
    });
  });

  productForm.addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("productName").value.trim();
    const category = document.getElementById("productCategory").value.trim();
    const price = Number(document.getElementById("productPrice").value);
    const qty = Number(document.getElementById("productQty").value);
    const limit = Number(document.getElementById("productLimit").value);
    const expiry = document.getElementById("productExpiry").value;

    if (!name || !category || price <= 0 || qty < 0 || limit < 0) {
      alert("Please enter valid product details.");
      return;
    }

    if (editingProductId) {
      const existing = products.find(product => product.id === editingProductId);
      if (!existing) { alert("This product no longer exists."); editingProductId = null; return; }
      Object.assign(existing, { name, category, price, qty, limit, expiry });
    } else {
      products.push({ id: Date.now().toString(), name, category, price, qty, limit, expiry });
    }
    editingProductId = null;

    saveProducts();
    productForm.reset();
    productModal.classList.add("hidden");

    renderProducts();
    renderDashboard();
  });

  // CATEGORY FILTER + EXPIRY HELPERS

  function fillCategoryFilters() {
    const found = new Map();
    products.forEach(p => {
      const name = String(p.category || "").trim();
      if (name && !found.has(name.toLowerCase())) found.set(name.toLowerCase(), name);
    });
    const categories = [...found.values()].sort();

    ["categoryFilter", "billingCategory"].forEach(id => {
      const select = document.getElementById(id);
      const current = select.value;
      select.innerHTML = '<option value="">All categories</option>' +
        categories.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join("");
      select.value = categories.includes(current) ? current : "";
    });
  }

  function sameCategory(product, chosen) {
    return !chosen || String(product.category).trim().toLowerCase() === chosen.toLowerCase();
  }

  function parseExpiry(text) {
    const t = String(text || "").trim();
    let y, m, d, match;
    if ((match = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) {
      [y, m, d] = [match[1], match[2], match[3]];
    } else if ((match = t.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/))) {
      [d, m, y] = [match[1], match[2], match[3]];
    } else {
      return "";
    }
    const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const check = new Date(iso + "T00:00:00");
    return !isNaN(check) && check.getDate() === Number(d) ? iso : "";
  }

  function daysToExpiry(product) {
    if (!product.expiry) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((new Date(product.expiry + "T00:00:00") - today) / 86400000);
  }

  function expiryText(product) {
    return new Date(product.expiry + "T00:00:00").toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric"
    });
  }

  function expiryBadge(product) {
    const days = daysToExpiry(product);
    if (days === null) return "—";
    const date = `<span class="expiry-date">${expiryText(product)}</span>`;
    if (days < 0) return `<span class="status low">Expired</span> ${date}`;
    if (days <= EXPIRY_WARN_DAYS) {
      return `<span class="status low">${days === 0 ? "Today" : days + " day" + (days === 1 ? "" : "s") + " left"}</span> ${date}`;
    }
    return date;
  }

  function renderExpiryList() {
    const area = document.getElementById("dashboardExpiry");

    const soon = products
      .map(product => ({ product, days: daysToExpiry(product) }))
      .filter(x => x.days !== null && x.days <= EXPIRY_WARN_DAYS && Number(x.product.qty) > 0)
      .sort((a, b) => a.days - b.days);

    if (soon.length === 0) {
      area.innerHTML = '<p class="empty-note">No products expiring soon.</p>';
      return;
    }

    area.innerHTML = soon.map(({ product, days }) => `
      <div class="alert-item">
        <div>
          <strong>${escapeHTML(product.name)}</strong>
          <small>${escapeHTML(product.category)} · ${product.qty} in stock · ${expiryText(product)}</small>
        </div>
        <span class="alert-qty">${days < 0 ? "Expired" : days === 0 ? "Today" : days + " day" + (days === 1 ? "" : "s") + " left"}</span>
      </div>
    `).join("");
  }

  function setExpiry(id) {
    const product = products.find(item => item.id === id);
    if (!product) return;

    const text = prompt(
      `Expiry date for ${product.name}\nType it like 25-12-2026 (leave empty to remove):`,
      product.expiry ? expiryText(product) : ""
    );
    if (text === null) return;

    const expiry = parseExpiry(text);
    if (text.trim() && !expiry) {
      alert("Please type the date like 25-12-2026.");
      return;
    }

    product.expiry = expiry;
    saveProducts();
    renderProducts();
    renderDashboard();
  }

  function renderProducts() {
    const search = document.getElementById("productSearch").value
      .trim().toLowerCase();

    fillCategoryFilters();
    const chosen = document.getElementById("categoryFilter").value;

    const filtered = products.filter(product =>
      (!inventoryLowOnly || Number(product.qty) <= Number(product.limit)) &&
      sameCategory(product, chosen) && (
        product.name.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search)
      )
    );

    const body = document.getElementById("productsBody");
    const intro = document.querySelector("#page-products .page-intro p");
    if (intro) intro.innerHTML = inventoryLowOnly
      ? 'Showing low-stock products only. <button type="button" class="text-button" id="showAllProducts">Show All Products</button>'
      : 'Keep track of every product and its available stock.';
    const resetLow = document.getElementById("showAllProducts");
    if (resetLow) resetLow.addEventListener("click", () => { inventoryLowOnly = false; renderProducts(); });

    if (filtered.length === 0) {
      body.innerHTML =
        '<tr><td colspan="8" class="empty-cell">No matching products found.</td></tr>';
      return;
    }

    body.innerHTML = filtered.map(product => {
      const low = Number(product.qty) <= Number(product.limit);

      return `
        <tr class="${low ? "low-stock-row" : ""}">
          <td><strong>${escapeHTML(product.name)}</strong></td>
          <td>${escapeHTML(product.category)}</td>
          <td>${money(product.price)}</td>
          <td>${product.qty}</td>
          <td>${product.limit}</td>
          <td>
            <span class="status ${low ? "low" : "good"}">
              ${low ? "Low Stock" : "In Stock"}
            </span>
          </td>
          <td>${expiryBadge(product)}</td>
          <td>
            <button class="action-btn" data-edit-product="${product.id}">Edit</button>
            <button class="action-btn" data-restock="${product.id}">+ Stock</button>
            <button class="action-btn" data-set-expiry="${product.id}">Expiry</button>
            <button class="action-btn delete" data-delete-product="${product.id}">Delete</button>
          </td>
        </tr>
      `;
    }).join("");

    body.querySelectorAll("[data-edit-product]").forEach(button => {
      button.addEventListener("click", () => {
        const product = products.find(item => item.id === button.dataset.editProduct);
        if (!product) return;
        editingProductId = product.id;
        document.getElementById("productName").value = product.name;
        document.getElementById("productCategory").value = product.category;
        document.getElementById("productPrice").value = product.price;
        document.getElementById("productQty").value = product.qty;
        document.getElementById("productLimit").value = product.limit;
        document.getElementById("productExpiry").value = product.expiry || "";
        document.getElementById("productModalTitle").textContent = "Edit Product";
        productModal.classList.remove("hidden");
      });
    });

    body.querySelectorAll("[data-restock]").forEach(button => {
      button.addEventListener("click", () => {
        addStock(button.dataset.restock);
      });
    });

    body.querySelectorAll("[data-set-expiry]").forEach(button => {
      button.addEventListener("click", () => {
        setExpiry(button.dataset.setExpiry);
      });
    });

    body.querySelectorAll("[data-delete-product]").forEach(button => {
      button.addEventListener("click", () => {
        deleteProduct(button.dataset.deleteProduct);
      });
    });
  }

  function addStock(id) {
    const product = products.find(item => item.id === id);
    if (!product) return;

    const amount = prompt(
      `Current stock: ${product.qty}\nHow many units do you want to add?`
    );

    if (amount === null) return;

    const quantity = Number(amount);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      alert("Please enter a valid positive whole number.");
      return;
    }

    product.qty += quantity;

    saveProducts();
    renderProducts();
    renderDashboard();
    renderBilling();
  }

  function deleteProduct(id) {
    const product = products.find(item => item.id === id);
    if (!product) return;

    if (!confirm(`Delete ${product.name} from inventory?`)) return;

    products = products.filter(item => item.id !== id);
    cart = cart.filter(item => item.productId !== id);

    saveProducts();

    renderProducts();
    renderDashboard();
    renderBilling();
  }

  // IMPORT PRODUCTS FROM CSV

  document.getElementById("importProductsBtn").addEventListener("click", () =>
    document.getElementById("importFile").click()
  );

  document.getElementById("importFile").addEventListener("change", event => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      let added = 0, updated = 0, skipped = 0;

      reader.result.replace(/^\ufeff/, "").split(/\r?\n/).forEach((line, i) => {
        if (!line.trim()) return;
        const [name, category, price, qty, limit, expiryText] =
          line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));

        if (i === 0 && isNaN(Number(price))) return; // header row

        const expiry = parseExpiry(expiryText);
        const existing = products.find(p => p.name.toLowerCase() === (name || "").toLowerCase());

        // Product already exists: just update its expiry date if the file has one
        if (existing && expiry) {
          existing.expiry = expiry;
          updated++;
          return;
        }

        if (!name || !category || !(Number(price) > 0) || qty === "" || !(Number(qty) >= 0) || existing) {
          skipped++;
          return;
        }

        products.push({
          id: Date.now().toString() + i,
          name,
          category,
          price: Number(price),
          qty: Number(qty),
          limit: limit ? Number(limit) : 5,
          expiry
        });
        added++;
      });

      saveProducts();
      renderProducts();
      renderDashboard();
      renderBilling();
      event.target.value = "";
      alert(added + " added, " + updated + " expiry dates updated, " + skipped + " skipped.");
    };
    reader.readAsText(file);
  });

  document.getElementById("productSearch").addEventListener("input", renderProducts);
  document.getElementById("categoryFilter").addEventListener("change", renderProducts);

  // CUSTOMER MANAGEMENT

  const customerModal = document.getElementById("customerModal");
  const customerForm = document.getElementById("customerForm");
  document.getElementById("billingAddCustomer").addEventListener("click", () => {
    checkoutAfterCustomerSave = true;
    customerForm.reset();
    customerModal.classList.remove("hidden");
  });

  document.getElementById("openAddCustomer").addEventListener("click", () => {
    customerForm.reset();
    customerModal.classList.remove("hidden");
  });

  customerForm.addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("customerName").value.trim();
    const phone = document.getElementById("customerPhone").value.trim();

    if (!name) {
      alert("Please enter the customer name.");
      return;
    }

    if (phone && !/^\d{10}$/.test(phone)) {
      alert("Enter a valid 10-digit phone number.");
      return;
    }

    const duplicate = phone ? customers.find(c => String(c.phone || "") === phone) : null;
    if (duplicate) {
      if (checkoutAfterCustomerSave) {
        document.getElementById("billCustomer").value = duplicate.id;
        customerModal.classList.add("hidden");
        checkoutAfterCustomerSave = false;
        renderCustomerOptions();
        checkoutBill();
      } else { alert("A customer with this phone number already exists."); }
      return;
    }
    const newCustomer = { id: Date.now().toString(), name, phone };
    customers.push(newCustomer);

    saveCustomers();

    customerForm.reset();
    customerModal.classList.add("hidden");

    renderCustomers();
    renderDashboard();
    renderCustomerOptions();
    if (checkoutAfterCustomerSave) {
      document.getElementById("billCustomer").value = newCustomer.id;
      checkoutAfterCustomerSave = false;
      checkoutBill();
    }
  });

  // PAYMENTS (UDHAR)
  // Old bills have no "paid" field, so they count as fully paid.

  function salePaid(sale) {
    return sale.paid === undefined ? Number(sale.total) : Number(sale.paid);
  }

  function saleDue(sale) {
    return Math.max(0, Math.round((Number(sale.total) - salePaid(sale)) * 100) / 100);
  }

  function salePayments(sale) {
    return sale.payments || [{ amount: Number(sale.total), date: sale.date }];
  }

  function paymentBadge(sale) {
    const due = saleDue(sale);
    if (due === 0) return '<span class="status good">PAID</span>';
    if (salePaid(sale) > 0) return `<span class="status low">PARTIALLY PAID · ${money(due)} due</span>`;
    return `<span class="status low">PENDING · ${money(due)} due</span>`;
  }

  function customerDue(customer) {
    return salesOfCustomer(customer).reduce((sum, sale) => sum + saleDue(sale), 0);
  }

  function receivePayment(customerId) {
    const customer = customers.find(item => item.id === customerId);
    if (!customer) return;

    const due = Math.round(customerDue(customer) * 100) / 100;
    if (due <= 0) {
      alert("This customer has no pending balance.");
      return;
    }

    const text = prompt(`${customer.name} owes ${money(due)}.\nHow much did they pay now?`, due);
    if (text === null) return;

    const amount = Math.round(Number(text) * 100) / 100;
    if (!(amount > 0) || amount > due) {
      alert("Please enter an amount between 1 and " + due + ".");
      return;
    }

    // The payment clears the oldest pending bills first
    let left = amount;
    const now = new Date().toISOString();

    salesOfCustomer(customer)
      .filter(sale => saleDue(sale) > 0)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .forEach(sale => {
        if (left <= 0) return;
        const part = Math.min(left, saleDue(sale));
        sale.paid = Math.round((salePaid(sale) + part) * 100) / 100;
        sale.payments = sale.payments || [];
        sale.payments.push({ amount: part, date: now });
        left = Math.round((left - part) * 100) / 100;
      });

    saveSales();
    renderCustomers();
    renderDashboard();
    renderSales();

    if (!document.getElementById("customerHistoryModal").classList.contains("hidden")) {
      showCustomerHistory(customerId);
    }
  }

  function renderPendingList() {
    const area = document.getElementById("dashboardPending");

    const owing = customers
      .map(customer => ({ customer, due: customerDue(customer) }))
      .filter(x => x.due > 0)
      .sort((a, b) => b.due - a.due);

    document.getElementById("pendingTotal").textContent =
      owing.length ? money(owing.reduce((sum, x) => sum + x.due, 0)) : "";

    if (owing.length === 0) {
      area.innerHTML = '<p class="empty-note">No pending payments.</p>';
      const recent = [...sales].filter(sale => saleDue(sale) > 0).reverse().slice(0, 5);
      if (recent.length) area.innerHTML = `<strong>Recent Pending Bills</strong>${recent.map(sale => `<div class="alert-item"><div><strong>${escapeHTML(sale.id)}</strong><small>${escapeHTML(sale.customerName)} · ${formatDateTime(sale.date)}</small></div><span class="alert-qty">${money(saleDue(sale))}</span></div>`).join("")}`;
      return;
    }

    const recentPending = [...sales].filter(sale => saleDue(sale) > 0).reverse().slice(0, 5);
    area.innerHTML = owing.map(({ customer, due }) => `
      <div class="alert-item">
        <div>
          <strong>${escapeHTML(customer.name)}</strong>
          <small>${escapeHTML(customer.phone || "No phone number")}</small>
        </div>
        <span class="alert-qty">${money(due)}</span>
      </div>
    `).join("");
    area.innerHTML += recentPending.length ? `<div class="pending-recent"><strong>Recent Pending Bills</strong>${recentPending.map(sale => `<div class="alert-item"><div><strong>${escapeHTML(sale.id)}</strong><small>${escapeHTML(sale.customerName)} · ${formatDateTime(sale.date)}</small></div><span class="alert-qty">${money(saleDue(sale))}</span></div>`).join("")}</div>` : "";
  }

  // CUSTOMER HISTORY

  function salesOfCustomer(customer) {
    const name = String(customer.name).trim().toLowerCase();
    return sales.filter(sale =>
      sale.customerId === customer.id ||
      String(sale.customerName || "").trim().toLowerCase() === name
    );
  }

  function customerSpent(customer) {
    return salesOfCustomer(customer).reduce((sum, sale) => sum + Number(sale.total), 0);
  }

  function showCustomerHistory(id) {
    const customer = customers.find(item => item.id === id);
    if (!customer) return;

    const list = salesOfCustomer(customer).reverse(); // newest first

    document.getElementById("historyTitle").textContent = customer.name;
    document.getElementById("historySub").textContent = customer.phone || "No phone number";

    document.getElementById("historySummary").innerHTML = `
      <div><span>Bills</span><strong>${list.length}</strong></div>
      <div><span>Total Spent</span><strong>${money(customerSpent(customer))}</strong></div>
      <div><span>Balance Due</span><strong>${money(customerDue(customer))}</strong></div>
      <div><span>Last Purchase</span><strong>${list.length ? formatDate(list[0].date) : "—"}</strong></div>
    `;

    document.getElementById("historyBody").innerHTML = list.length === 0
      ? '<tr><td colspan="5" class="empty-cell">No purchases yet.</td></tr>'
      : list.map(sale => `
        <tr>
          <td><strong>${escapeHTML(sale.id)}</strong></td>
          <td>${formatDateTime(sale.date)}</td>
          <td>${(sale.items || []).map(i => escapeHTML(i.name) + " ×" + i.quantity).join(", ")}</td>
          <td>${money(sale.total)}</td>
          <td>${paymentBadge(sale)}</td>
        </tr>
      `).join("");

    const paymentHistory = list.flatMap(sale => (sale.payments || (salePaid(sale) > 0 ? [{ amount: salePaid(sale), date: sale.date }] : []))
      .map(payment => ({ ...payment, billId: sale.id })))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    document.getElementById("historyPayments").innerHTML = `<h4>Payment History</h4>${paymentHistory.length ? paymentHistory.map(payment => `<div class="alert-item"><div><strong>${money(payment.amount)}</strong><small>${escapeHTML(payment.billId)} · ${formatDateTime(payment.date)}</small></div><span class="status good">Received</span></div>`).join("") : '<p class="empty-note">No payments recorded.</p>'}`;

    const receiveBtn = document.getElementById("historyReceiveBtn");
    receiveBtn.classList.toggle("hidden", customerDue(customer) <= 0);
    receiveBtn.onclick = () => receivePayment(id);

    document.getElementById("customerHistoryModal").classList.remove("hidden");
  }

  function renderCustomers() {
    const search = document.getElementById("customerSearch").value
      .trim().toLowerCase();

    const filtered = customers.filter(customer =>
      String(customer.name || "").toLowerCase().includes(search) ||
      String(customer.phone || "").includes(search)
    );

    const body = document.getElementById("customersBody");

    if (filtered.length === 0) {
      body.innerHTML =
        '<tr><td colspan="7" class="empty-cell">No matching customers found.</td></tr>';
      return;
    }

    body.innerHTML = filtered.map(customer => `
      <tr>
        <td><strong>${escapeHTML(customer.name)}</strong></td>
        <td>${escapeHTML(customer.phone || "Not provided")}</td>
        <td>${salesOfCustomer(customer).length}</td>
        <td>${money(customerSpent(customer))}</td>
        <td>${money(salesOfCustomer(customer).reduce((sum, sale) => sum + salePaid(sale), 0))}</td>
        <td>${customerDue(customer) > 0 ? '<span class="status low">' + money(customerDue(customer)) + '</span>' : "—"}</td>
        <td>${customerDue(customer) > 0 ? "PENDING" : "PAID"}</td>
        <td>
          ${customerDue(customer) > 0 ? `<button class="action-btn" data-receive="${customer.id}">Receive</button>` : ""}
          <button class="action-btn" data-customer-history="${customer.id}">History</button>
          <button class="action-btn delete" data-delete-customer="${customer.id}">
            Delete
          </button>
        </td>
      </tr>
    `).join("");

    body.querySelectorAll("[data-receive]").forEach(button => {
      button.addEventListener("click", () => {
        receivePayment(button.dataset.receive);
      });
    });

    body.querySelectorAll("[data-customer-history]").forEach(button => {
      button.addEventListener("click", () => {
        showCustomerHistory(button.dataset.customerHistory);
      });
    });

    body.querySelectorAll("[data-delete-customer]").forEach(button => {
      button.addEventListener("click", () => {
        deleteCustomer(button.dataset.deleteCustomer);
      });
    });
  }

  function deleteCustomer(id) {
    const customer = customers.find(item => item.id === id);
    if (!customer) return;

    const due = customerDue(customer);
    const warning = due > 0
      ? `\n\nThey still owe ${money(due)}. Their pending bills will no longer be tracked.`
      : "";

    if (!confirm(`Delete customer ${customer.name}?${warning}`)) return;

    customers = customers.filter(item => item.id !== id);

    saveCustomers();
    renderCustomers();
    renderDashboard();
    renderCustomerOptions();
  }

  document.getElementById("customerSearch").addEventListener("input", renderCustomers);

  function renderCustomerOptions() {
    const select = document.getElementById("billCustomer");
    const selectedValue = select.value;

    select.innerHTML = '<option value="">Select customer</option>';

    customers.forEach(customer => {
      const option = document.createElement("option");
      option.value = customer.id;
      option.textContent = customer.name;
      select.appendChild(option);
    });

    if (customers.some(customer => customer.id === selectedValue)) {
      select.value = selectedValue;
    }
  }

  // BILLING

  function renderBilling() {
    renderBillingProducts();
    renderCart();
    renderCustomerOptions();
    updatePaymentFields();
  }

  function renderBillingProducts() {
    const search = document.getElementById("billingSearch").value
      .trim().toLowerCase();

    fillCategoryFilters();
    const chosen = document.getElementById("billingCategory").value;

    const available = products.filter(product =>
      sameCategory(product, chosen) && (
        product.name.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search)
      )
    );

    const area = document.getElementById("billingProductList");

    if (available.length === 0) {
      area.innerHTML = '<p class="empty-note">No products found.</p>';
      return;
    }

    area.innerHTML = available.map(product => `
      <div class="billing-product">
        <div>
          <strong>${escapeHTML(product.name)}</strong>
          <small>${escapeHTML(product.category)} · ${product.qty} available</small>
          <div class="product-price">${money(product.price)}</div>
        </div>
        <button class="add-cart-btn"
          data-add-cart="${product.id}"
          ${product.qty <= 0 ? "disabled" : ""}>
          ${product.qty <= 0 ? "Out of stock" : "+ Add"}
        </button>
      </div>
    `).join("");

    area.querySelectorAll("[data-add-cart]").forEach(button => {
      button.addEventListener("click", () => {
        addToCart(button.dataset.addCart);
      });
    });
  }

  function addToCart(productId) {
    const product = products.find(item => item.id === productId);

    if (!product || product.qty <= 0) {
      alert("This product is out of stock.");
      return;
    }

    const existing = cart.find(item => item.productId === productId);

    if (existing) {
      if (existing.quantity >= product.qty) {
        alert("You cannot add more than the available stock.");
        return;
      }

      existing.quantity++;
    } else {
      if (daysToExpiry(product) < 0 && !confirm("This product has expired. Add it to the bill anyway?")) {
        return;
      }

      cart.push({
        productId: product.id,
        quantity: 1
      });
    }

    renderCart();
  }

  function changeCartQuantity(productId, change) {
    const cartItem = cart.find(item => item.productId === productId);
    const product = products.find(item => item.id === productId);

    if (!cartItem || !product) return;

    const newQuantity = cartItem.quantity + change;

    if (newQuantity <= 0) {
      cart = cart.filter(item => item.productId !== productId);
    } else if (newQuantity > product.qty) {
      alert("Not enough stock available.");
      return;
    } else {
      cartItem.quantity = newQuantity;
    }

    renderCart();
  }

  function renderCart() {
    const area = document.getElementById("cartItems");

    const validCart = cart.filter(item =>
      products.some(product => product.id === item.productId)
    );

    cart = validCart;

    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    document.getElementById("cartItemCount").textContent =
      `${itemCount} item${itemCount === 1 ? "" : "s"}`;

    if (cart.length === 0) {
      area.innerHTML = '<p class="empty-note">Your bill is empty.</p>';
      document.getElementById("cartTotal").textContent = money(0);
      return;
    }

    let total = 0;

    area.innerHTML = cart.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return "";

      const lineTotal = product.price * item.quantity;
      total += lineTotal;

      return `
        <div class="cart-row">
          <div>
            <strong>${escapeHTML(product.name)}</strong>
            <small>${money(product.price)} each</small>
            <div class="quantity-controls">
              <button data-cart-change="${product.id}" data-change="-1">−</button>
              <input type="number" class="qty-input" min="1" max="${product.qty}" value="${item.quantity}" data-cart-qty="${product.id}">
              <button data-cart-change="${product.id}" data-change="1">+</button>
            </div>
          </div>
          <span class="cart-line-total" data-line-total="${product.id}">${money(lineTotal)}</span>
        </div>
      `;
    }).join("");

    document.getElementById("cartTotal").textContent = money(total);
    if (document.getElementById("billPendingPreview")) updatePendingPreview();

    area.querySelectorAll("[data-cart-change]").forEach(button => {
      button.addEventListener("click", () => {
        changeCartQuantity(
          button.dataset.cartChange,
          Number(button.dataset.change)
        );
      });
    });

    area.querySelectorAll("[data-cart-qty]").forEach(input => {

  // NEW: update the amount while typing
  input.addEventListener("input", () => {
    const id = input.dataset.cartQty;
    const item = cart.find(i => i.productId === id);
    const product = products.find(p => p.id === id);
    const qty = Math.floor(Number(input.value));
    if (!item || !product || !(qty >= 1) || qty > product.qty) return;

    item.quantity = qty;
    area.querySelector(`[data-line-total="${id}"]`).textContent = money(product.price * qty);

    const total = cart.reduce((sum, i) => {
      const p = products.find(x => x.id === i.productId);
      return sum + (p ? p.price * i.quantity : 0);
    }, 0);
    document.getElementById("cartTotal").textContent = money(total);

    const count = cart.reduce((sum, i) => sum + i.quantity, 0);
    document.getElementById("cartItemCount").textContent = `${count} item${count === 1 ? "" : "s"}`;
    updatePendingPreview();
  });

  // EXISTING: keep this as it was
  input.addEventListener("change", () => {
    const id = input.dataset.cartQty;
    const item = cart.find(i => i.productId === id);
    if (input.value !== "" && item) {
      changeCartQuantity(id, Math.floor(Number(input.value)) - item.quantity);
    }
    renderCart();
  });
});
  }

  document.getElementById("billingSearch").addEventListener("input", renderBillingProducts);
  document.getElementById("billingCategory").addEventListener("change", renderBillingProducts);

  document.getElementById("clearCartBtn").addEventListener("click", () => {
    cart = [];
    renderCart();
  });

  function updatePaymentFields() {
    const mode = document.getElementById("billPayment").value;
    const credit = mode !== "full";
    document.getElementById("billCreditCustomerBox").classList.toggle("hidden", !credit);
    document.getElementById("billPaidNowBox").classList.toggle("hidden", mode !== "partial");
    if (mode === "later") document.getElementById("billPaidNow").value = "0";
    updatePendingPreview();
  }

  function updatePendingPreview() {
    const total = cart.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + (product ? Number(product.price) * item.quantity : 0);
    }, 0);
    const paid = document.getElementById("billPayment").value === "full" ? total :
      (document.getElementById("billPayment").value === "later" ? 0 : Number(document.getElementById("billPaidNow").value || 0));
    document.getElementById("billPendingPreview").textContent = "Pending Amount: " + money(Math.max(0, total - paid));
  }

  document.getElementById("billPayment").addEventListener("change", updatePaymentFields);
  document.getElementById("billPaidNow").addEventListener("input", updatePendingPreview);
  document.getElementById("checkoutBtn").addEventListener("click", checkoutBill);

  function checkoutBill() {
    const message = document.getElementById("billingMessage");
    message.className = "message hidden";
    if (cart.length === 0) { message.textContent = "Add at least one product before checkout."; message.className = "message error"; return; }
    for (const item of cart) {
      const product = products.find(p => p.id === item.productId);
      if (!product || Number(product.qty) < Number(item.quantity)) {
        message.textContent = "Stock changed for one of the products. Please review your bill.";
        message.className = "message error"; renderBilling(); return;
      }
    }
    const mode = document.getElementById("billPayment").value;
    const selectedCustomerId = document.getElementById("billCustomer").value;
let selectedCustomer = customers.find(c => c.id === selectedCustomerId);
const typedName = document.getElementById("billCustomerName").value.trim();
if (mode !== "full" && !selectedCustomer) {
  if (typedName) {
    // reuse a saved customer with this name, or save a new one
    selectedCustomer = customers.find(c => c.name.trim().toLowerCase() === typedName.toLowerCase());
    if (!selectedCustomer) {
      selectedCustomer = { id: Date.now().toString(), name: typedName, phone: "" };
      customers.push(selectedCustomer);
      saveCustomers();
      renderCustomerOptions();
    }
  } else {
    // no customer yet: open the Add Customer form, the bill is created after saving
    document.getElementById("billingAddCustomer").click();
    return;
  }
}
    const customerName = selectedCustomer ? selectedCustomer.name : (typedName || "Walk-in Customer");
    const billItems = cart.map(item => {
      const product = products.find(p => p.id === item.productId);
      return { productId: product.id, name: product.name, price: Number(product.price), quantity: item.quantity, total: Number(product.price) * item.quantity };
    });
    const total = Math.round(billItems.reduce((sum, item) => sum + item.total, 0) * 100) / 100;
    const paidNow = mode === "full" ? total : mode === "later" ? 0 : Math.round(Number(document.getElementById("billPaidNow").value) * 100) / 100;
    if (!Number.isFinite(paidNow) || paidNow < 0 || paidNow > total || (mode === "partial" && paidNow <= 0)) {
      message.textContent = "Enter an amount greater than zero and no more than the bill total."; message.className = "message error"; return;
    }
    const saleDate = new Date().toISOString();
    const sale = {
      id: "SF" + Date.now().toString().slice(-8), customerName,
      customerId: selectedCustomer ? selectedCustomer.id : "",
      customerPhone: selectedCustomer ? selectedCustomer.phone : "",
      items: billItems, total, staff: currentUser.ownerName, date: saleDate,
      paid: paidNow, paymentType: mode === "full" ? "Paid" : mode === "later" ? "Udhar" : "Partial",
      payments: paidNow > 0 ? [{ amount: paidNow, date: saleDate }] : []
    };
    // Persist the unique bill before stock updates; this path runs once per checkout.
    if (sales.some(existing => existing.id === sale.id)) { message.textContent = "Duplicate bill prevented. Please try again."; message.className = "message error"; return; }
    billItems.forEach(item => { products.find(p => p.id === item.productId).qty -= item.quantity; });
    sales.push(sale); saveProducts(); saveSales();
    lastReceipt = sale; cart = [];
    document.getElementById("billCustomerName").value = "";
    document.getElementById("billPayment").value = "full";
    document.getElementById("billPaidNow").value = "";
    updatePaymentFields();
    renderBilling(); renderDashboard(); renderCustomers(); renderSales();
    message.textContent = "Checkout completed successfully!"; message.className = "message success";
    showReceipt(sale); document.getElementById("receiptArea").classList.remove("hidden");
  }

  // EXPORT SALES TO EXCEL (CSV)

  function downloadCSV(filename, rows) {
    const csv = rows
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv" }));
    link.download = filename;
    link.click();
  }

  document.getElementById("exportSalesBtn").addEventListener("click", () => {
    downloadCSV("stockflow-sales.csv", [
      ["Bill ID", "Customer", "Items", "Amount", "Paid", "Due", "Staff", "Date"],
      ...sales.map(s => [
        s.id,
        s.customerName,
        (s.items || []).map(i => i.name + " x" + i.quantity).join("; "),
        s.total,
        salePaid(s),
        saleDue(s),
        s.staff,
        formatDateTime(s.date)
      ])
    ]);
  });

  // RECEIPT

  function showReceipt(sale) {
    const receipt = document.getElementById("receiptContent");

    const itemRows = sale.items.map(item => `
      <tr>
        <td>${escapeHTML(item.name)}</td>
        <td>${item.quantity}</td>
        <td>${money(item.price)}</td>
        <td>${money(item.total)}</td>
      </tr>
    `).join("");

    receipt.innerHTML = `
      <div class="receipt-paper">
        <h2>${escapeHTML(currentUser.shopName)}</h2>
        <p>
          ${escapeHTML(currentUser.address)}<br>
          Pincode: ${escapeHTML(currentUser.pincode)}<br>
          Phone: ${escapeHTML(currentUser.phone)}
        </p>

        <hr style="margin:15px 0; border:0; border-top:1px dashed #bbb;">

        <p style="text-align:left">
          <strong>Bill ID:</strong> ${escapeHTML(sale.id)}<br>
          <strong>Customer:</strong> ${escapeHTML(sale.customerName)}<br>
          ${sale.customerPhone ? `<strong>Phone:</strong> ${escapeHTML(sale.customerPhone)}<br>` : ""}
          <strong>Staff:</strong> ${escapeHTML(sale.staff)}<br>
          <strong>Date:</strong> ${formatDateTime(sale.date)}
        </p>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <div class="receipt-total">Grand Total: ${money(sale.total)}</div>
        <p><strong>Payment:</strong> ${escapeHTML(sale.paymentType || (saleDue(sale) > 0 ? (salePaid(sale) > 0 ? "Partial" : "Udhar") : "Paid"))}</p>
        ${saleDue(sale) > 0 ? `<p>Paid: ${money(salePaid(sale))}<br><strong>Balance due: ${money(saleDue(sale))}</strong></p>` : ""}

        <hr style="margin:15px 0; border:0; border-top:1px dashed #bbb;">
        <p>Thank you for shopping with us!</p>
      </div>
    `;
  }

  document.getElementById("printReceiptBtn").addEventListener("click", () => {
    if (!lastReceipt) return;
    window.print();
  });

  // SALES HISTORY

  function renderSales() {
    const search = document.getElementById("salesSearch").value
      .trim().toLowerCase();

    const filtered = [...sales].reverse().filter(sale =>
      String(sale.id || "").toLowerCase().includes(search) ||
      String(sale.customerName || "").toLowerCase().includes(search)
    );

    const totalRevenue = sales.reduce((sum, sale) =>
      sum + Number(sale.total), 0
    );

    document.getElementById("salesBillCount").textContent = sales.length;
    document.getElementById("salesRevenue").textContent = money(totalRevenue);

    const body = document.getElementById("salesBody");

    if (filtered.length === 0) {
      body.innerHTML =
        '<tr><td colspan="8" class="empty-cell">No sales records found.</td></tr>';
      return;
    }

    body.innerHTML = filtered.map(sale => {
      const itemCount = sale.items.reduce((sum, item) =>
        sum + Number(item.quantity), 0
      );

      return `
        <tr>
          <td><strong>${escapeHTML(sale.id)}</strong></td>
          <td>${escapeHTML(sale.customerName)}</td>
          <td>${itemCount}</td>
          <td>${money(sale.total)}</td>
          <td>${paymentBadge(sale)}</td>
          <td>${escapeHTML(sale.staff)}</td>
          <td>${formatDateTime(sale.date)}</td>
          <td>
            <button class="action-btn" data-view-receipt="${sale.id}">
              View / Print
            </button>
          </td>
        </tr>
      `;
    }).join("");

    body.querySelectorAll("[data-view-receipt]").forEach(button => {
      button.addEventListener("click", () => {
        const sale = sales.find(item => item.id === button.dataset.viewReceipt);
        if (!sale) return;

        lastReceipt = sale;
        showReceipt(sale);
        document.getElementById("receiptArea").classList.remove("hidden");
        showPage("billing");
        document.getElementById("receiptArea").scrollIntoView({
          behavior: "smooth"
        });
      });
    });
  }

  document.getElementById("salesSearch").addEventListener("input", renderSales);

  // DAILY CLOSING REPORT

  function renderReport() {
    const dateValue = document.getElementById("reportDate").value;
    if (!dateValue) return;

    const day = new Date(dateValue + "T00:00:00");
    const daySales = sales.filter(sale =>
      new Date(sale.date).toDateString() === day.toDateString()
    );

    const countItems = sale => (sale.items || []).reduce((n, i) => n + Number(i.quantity), 0);
    const revenue = daySales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const itemsSold = daySales.reduce((sum, sale) => sum + countItems(sale), 0);
    const average = daySales.length ? revenue / daySales.length : 0;

    // Money received that day (includes old pending bills paid that day)
    const collected = sales.reduce((sum, sale) => sum + salePayments(sale)
      .filter(p => new Date(p.date).toDateString() === day.toDateString())
      .reduce((n, p) => n + Number(p.amount), 0), 0);
    const pendingToday = daySales.reduce((sum, sale) => sum + saleDue(sale), 0);
    const pendingAll = sales.reduce((sum, sale) => sum + saleDue(sale), 0);

    // Add up each product sold that day
    const byProduct = {};
    daySales.forEach(sale => (sale.items || []).forEach(item => {
      const row = byProduct[item.name] || (byProduct[item.name] = { qty: 0, amount: 0 });
      row.qty += Number(item.quantity);
      row.amount += Number(item.total);
    }));

    const billRows = daySales.map(sale => `
      <tr>
        <td>${escapeHTML(sale.id)}</td>
        <td>${new Date(sale.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td>
        <td>${escapeHTML(sale.customerName)}</td>
        <td>${countItems(sale)}</td>
        <td>${money(sale.total)}</td>
        <td>${saleDue(sale) > 0 ? money(saleDue(sale)) + " due" : "Paid"}</td>
        <td>${escapeHTML(sale.staff)}</td>
      </tr>
    `).join("") || '<tr><td colspan="7">No sales on this day.</td></tr>';

    const productRows = Object.entries(byProduct)
      .sort((a, b) => b[1].qty - a[1].qty)
      .map(([name, row]) => `
        <tr><td>${escapeHTML(name)}</td><td>${row.qty}</td><td>${money(row.amount)}</td></tr>
      `).join("") || '<tr><td colspan="3">Nothing sold on this day.</td></tr>';

    const lowItems = products
      .filter(p => Number(p.qty) <= Number(p.limit))
      .map(p => `<li>${escapeHTML(p.name)} — ${p.qty} left (limit ${p.limit})</li>`)
      .join("") || "<li>None</li>";

    const expiringItems = products
      .filter(p => {
        const days = daysToExpiry(p);
        return days !== null && days <= EXPIRY_WARN_DAYS && Number(p.qty) > 0;
      })
      .map(p => `<li>${escapeHTML(p.name)} — ${daysToExpiry(p) < 0 ? "expired" : "expires"} ${expiryText(p)} (${p.qty} in stock)</li>`)
      .join("") || "<li>None</li>";

    document.getElementById("reportContent").innerHTML = `
      <div class="report-paper">
        <h2>${escapeHTML(currentUser.shopName)}</h2>
        <p class="report-sub">
          Daily Closing Report ·
          ${day.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}<br>
          Prepared by ${escapeHTML(currentUser.ownerName)}
        </p>

        <div class="report-summary">
          <div><span>Bills</span><strong>${daySales.length}</strong></div>
          <div><span>Items Sold</span><strong>${itemsSold}</strong></div>
          <div><span>Total Sales</span><strong>${money(revenue)}</strong></div>
          <div><span>Average Bill</span><strong>${money(average)}</strong></div>
          <div><span>Money Received</span><strong>${money(collected)}</strong></div>
          <div><span>Unpaid (today's bills)</span><strong>${money(pendingToday)}</strong></div>
          <div><span>All Pending (now)</span><strong>${money(pendingAll)}</strong></div>
        </div>

        <h4>Bills</h4>
        <table>
          <thead><tr><th>Bill ID</th><th>Time</th><th>Customer</th><th>Items</th><th>Amount</th><th>Payment</th><th>Staff</th></tr></thead>
          <tbody>${billRows}</tbody>
        </table>

        <h4>Products Sold</h4>
        <table>
          <thead><tr><th>Product</th><th>Quantity</th><th>Amount</th></tr></thead>
          <tbody>${productRows}</tbody>
        </table>

        <h4>Low-stock items (right now)</h4>
        <ul>${lowItems}</ul>

        <h4>Expired or expiring within ${EXPIRY_WARN_DAYS} days (right now)</h4>
        <ul>${expiringItems}</ul>
      </div>
    `;
  }

  document.getElementById("openReportBtn").addEventListener("click", () => {
    const t = new Date();
    document.getElementById("reportDate").value =
      t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");

    document.getElementById("reportArea").classList.remove("hidden");
    renderReport();
    document.getElementById("reportArea").scrollIntoView({ behavior: "smooth" });
  });

  document.getElementById("reportDate").addEventListener("change", renderReport);

  document.getElementById("printReportBtn").addEventListener("click", () => window.print());

  document.getElementById("closeReportBtn").addEventListener("click", () => {
    document.getElementById("reportArea").classList.add("hidden");
  });

  // INITIAL PAGE LOAD

  renderDashboard();
  renderProducts();
  renderCustomers();
  renderCustomerOptions();
  renderSales();
  showPage("dashboard");
}
