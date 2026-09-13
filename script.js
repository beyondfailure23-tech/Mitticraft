// ===== MittiCraft — Main Logic =====

// ---- Product Images ----
// Google Sheet mein sirf Name/Price/Stock hai — IMAGES yaha map hoti hain,
// isse loading fast rehti hai.
// Kaise add karein:
//   1. Image file "assets/products/" folder mein daalo (jaise diya-plain-1.jpg)
//   2. Neeche uska Sheet wala "ID" se path map karo.
// Example:
// const PRODUCT_IMAGES = {
//   "diya-plain-1": "assets/products/diya-plain-1.jpg",
// };
const PRODUCT_IMAGES = {
  // yaha apni entries add karo
};

// ---- State ----
let allProducts = [];
let activeCategory = "All";
let cart = loadCart();
let buyNowProduct = null; // agar Buy Now se aaya hai to sirf ye ek product order hoga
let lastOrderId = null;

// ---- Cart persistence (localStorage) ----
function loadCart() {
  try {
    return JSON.parse(localStorage.getItem("mitticraft_cart")) || [];
  } catch {
    return [];
  }
}
function saveCart() {
  localStorage.setItem("mitticraft_cart", JSON.stringify(cart));
}

function addToCart(product, qty = 1) {
  const existing = cart.find((i) => i.id === product.ID);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: product.ID,
      name: product.Name,
      price: Number(product.Price) || 0,
      qty,
    });
  }
  saveCart();
  updateCartBadge();
}
function removeFromCart(id) {
  cart = cart.filter((i) => i.id !== id);
  saveCart();
  updateCartBadge();
  renderCart();
}
function updateQty(id, qty) {
  if (qty <= 0) return removeFromCart(id);
  const item = cart.find((i) => i.id === id);
  if (item) item.qty = qty;
  saveCart();
  updateCartBadge();
  renderCart();
}
function cartTotal() {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}
function cartCount() {
  return cart.reduce((sum, i) => sum + i.qty, 0);
}
function updateCartBadge() {
  const badge = document.getElementById("cartCount");
  const count = cartCount();
  if (count > 0) {
    badge.style.display = "flex";
    badge.textContent = count;
  } else {
    badge.style.display = "none";
  }
}

// ---- View switching ----
function showView(name) {
  ["catalog", "cart", "checkout", "confirm"].forEach((v) => {
    document.getElementById(v + "View").style.display = v === name ? "block" : "none";
  });
  window.scrollTo(0, 0);
}

// ---- Fetch products from Google Sheet ----
async function fetchProducts() {
  try {
    const res = await fetch(`${CONFIG.SHEET_API_URL}?action=products`);
    if (!res.ok) throw new Error("fetch failed");
    const data = await res.json();
    allProducts = data;
    renderCategoryFilters();
    renderProducts();
  } catch (err) {
    document.getElementById("productGrid").innerHTML =
      '<p class="status-text">Products load nahi ho paye. Baad mein try karo.</p>';
  }
}

// ---- Render category filter buttons ----
function renderCategoryFilters() {
  const cats = ["All", ...new Set(allProducts.map((p) => p.Category).filter(Boolean))];
  const wrap = document.getElementById("categoryFilters");
  wrap.innerHTML = "";
  if (cats.length <= 1) return;
  cats.forEach((cat) => {
    const btn = document.createElement("button");
    btn.textContent = cat;
    if (cat === activeCategory) btn.classList.add("active");
    btn.onclick = () => {
      activeCategory = cat;
      renderCategoryFilters();
      renderProducts();
    };
    wrap.appendChild(btn);
  });
}

// ---- Render product grid ----
function renderProducts() {
  const grid = document.getElementById("productGrid");
  const filtered =
    activeCategory === "All"
      ? allProducts
      : allProducts.filter((p) => p.Category === activeCategory);

  if (filtered.length === 0) {
    grid.innerHTML = '<p class="status-text">No products found.</p>';
    return;
  }

  grid.innerHTML = "";
  filtered.forEach((p) => {
    const stock = Number(p.Stock);
    const outOfStock = !isNaN(stock) && stock <= 0;
    const image = PRODUCT_IMAGES[p.ID];

    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-image">
        ${image ? `<img src="${image}" alt="${p.Name}" />` : "📦"}
        ${outOfStock ? '<span class="out-of-stock-badge">Out of Stock</span>' : ""}
      </div>
      <div class="product-body">
        <div class="product-name">${p.Name}</div>
        <div class="product-desc">${p.Description || ""}</div>
        <div class="product-price">₹${p.Price}</div>
        <div class="product-actions">
          <button class="btn-outline" ${outOfStock ? "disabled" : ""} data-action="add" data-id="${p.ID}">Add to Cart</button>
          <button class="btn-primary" ${outOfStock ? "disabled" : ""} data-action="buy" data-id="${p.ID}">Buy Now</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  // Button events
  grid.querySelectorAll('[data-action="add"]').forEach((btn) => {
    btn.onclick = () => {
      const product = allProducts.find((p) => p.ID === btn.dataset.id);
      addToCart(product, 1);
    };
  });
  grid.querySelectorAll('[data-action="buy"]').forEach((btn) => {
    btn.onclick = () => {
      const product = allProducts.find((p) => p.ID === btn.dataset.id);
      buyNowProduct = product;
      renderCheckout();
      showView("checkout");
    };
  });
}

// ---- Render cart view ----
function renderCart() {
  const itemsWrap = document.getElementById("cartItems");
  const emptyText = document.getElementById("cartEmpty");
  const summary = document.getElementById("cartSummary");

  if (cart.length === 0) {
    itemsWrap.innerHTML = "";
    emptyText.style.display = "block";
    summary.style.display = "none";
    return;
  }
  emptyText.style.display = "none";
  summary.style.display = "block";

  itemsWrap.innerHTML = "";
  cart.forEach((item) => {
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <div>
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">₹${item.price} each</div>
      </div>
      <div class="cart-item-right">
        <div class="qty-control">
          <button data-action="dec" data-id="${item.id}">−</button>
          <span>${item.qty}</span>
          <button data-action="inc" data-id="${item.id}">+</button>
        </div>
        <div class="cart-item-total">₹${item.price * item.qty}</div>
        <button class="remove-btn" data-action="remove" data-id="${item.id}">🗑</button>
      </div>
    `;
    itemsWrap.appendChild(row);
  });

  itemsWrap.querySelectorAll('[data-action="dec"]').forEach((btn) => {
    btn.onclick = () => {
      const item = cart.find((i) => i.id === btn.dataset.id);
      updateQty(btn.dataset.id, item.qty - 1);
    };
  });
  itemsWrap.querySelectorAll('[data-action="inc"]').forEach((btn) => {
    btn.onclick = () => {
      const item = cart.find((i) => i.id === btn.dataset.id);
      updateQty(btn.dataset.id, item.qty + 1);
    };
  });
  itemsWrap.querySelectorAll('[data-action="remove"]').forEach((btn) => {
    btn.onclick = () => removeFromCart(btn.dataset.id);
  });

  document.getElementById("cartSubtotal").textContent = `₹${cartTotal()}`;
  document.getElementById("cartDelivery").textContent = `₹${CONFIG.DELIVERY_CHARGE}`;
  document.getElementById("cartGrandTotal").textContent = `₹${cartTotal() + CONFIG.DELIVERY_CHARGE}`;
}

// ---- Checkout items (Buy Now single item OR full cart) ----
function getCheckoutItems() {
  if (buyNowProduct) {
    return [
      {
        id: buyNowProduct.ID,
        name: buyNowProduct.Name,
        price: Number(buyNowProduct.Price) || 0,
        qty: 1,
      },
    ];
  }
  return cart;
}
function getCheckoutTotal() {
  return getCheckoutItems().reduce((sum, i) => sum + i.price * i.qty, 0);
}

function renderCheckout() {
  const wrap = document.getElementById("checkoutItems");
  const items = getCheckoutItems();
  const total = getCheckoutTotal();
  wrap.innerHTML =
    items
      .map(
        (i) => `<div class="summary-row"><span>${i.qty}x ${i.name}</span><span>₹${i.price * i.qty}</span></div>`
      )
      .join("") +
    `<div class="summary-row"><span>Delivery</span><span>₹${CONFIG.DELIVERY_CHARGE}</span></div>
     <div class="summary-row total"><span>Total</span><span>₹${total + CONFIG.DELIVERY_CHARGE}</span></div>`;
  document.getElementById("formError").style.display = "none";
  document.getElementById("checkoutForm").reset();
}

// ---- Submit order to Google Sheet ----
async function submitOrder(order) {
  const res = await fetch(CONFIG.SHEET_API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "order", ...order }),
  });
  if (!res.ok) throw new Error("order failed");
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

// ---- Event bindings ----
document.getElementById("logoBtn").onclick = () => {
  buyNowProduct = null;
  showView("catalog");
};
document.getElementById("cartBtn").onclick = () => {
  renderCart();
  showView("cart");
};
document.querySelectorAll('[data-back="catalog"]').forEach((btn) => {
  btn.onclick = () => {
    buyNowProduct = null;
    showView("catalog");
  };
});
document.getElementById("checkoutBtn").onclick = () => {
  buyNowProduct = null;
  renderCheckout();
  showView("checkout");
};
document.getElementById("checkoutBackBtn").onclick = () => {
  showView(buyNowProduct ? "catalog" : "cart");
};

document.getElementById("checkoutForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("fName").value.trim();
  const phone = document.getElementById("fPhone").value.trim();
  const address = document.getElementById("fAddress").value.trim();
  const pin = document.getElementById("fPin").value.trim();
  const errorEl = document.getElementById("formError");

  let error = "";
  if (!name) error = "Naam daalo";
  else if (!/^\d{10}$/.test(phone)) error = "10 digit phone number daalo";
  else if (!address) error = "Address daalo";
  else if (!/^\d{6}$/.test(pin)) error = "6 digit PIN code daalo";

  if (error) {
    errorEl.textContent = error;
    errorEl.style.display = "block";
    return;
  }
  errorEl.style.display = "none";

  const submitBtn = document.getElementById("placeOrderBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Placing Order...";

  try {
    const items = getCheckoutItems();
    const total = getCheckoutTotal();
    const result = await submitOrder({ name, phone, address, pin, items, total });
    lastOrderId = result.orderId;

    if (!buyNowProduct) {
      cart = [];
      saveCart();
      updateCartBadge();
    }
    buyNowProduct = null;

    document.getElementById("confirmOrderId").textContent = "Order ID: " + lastOrderId;
    const waText = encodeURIComponent(`Hi, maine order place kiya hai. Order ID: ${lastOrderId}`);
    document.getElementById("whatsappLink").href = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${waText}`;
    showView("confirm");
  } catch (err) {
    errorEl.textContent = "Order place nahi ho paya. Dobara try karo.";
    errorEl.style.display = "block";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Place Order";
  }
});

// ---- Init ----
document.getElementById("year").textContent = new Date().getFullYear();
updateCartBadge();
fetchProducts();
