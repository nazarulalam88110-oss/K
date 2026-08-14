/* Configuration */
const ALLOWED_PINCODE = "852106";

const TRACKING_STAGES = [
  'Order Placed',
  'Confirmed',
  'Packed',
  'Ready For Pickup',
  'Pickup Completed',
  'Out For Delivery',
  'Reached Location',
  'Delivered Successfully'
];

const DEFAULT_PRODUCTS = [
  { id: 1, name: 'Fortune Sunlite Oil', desc: '1 L', price: 135, mrp: 150, stock: 120, rating: 4.8, category: 'Atta', sale: true, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=350&auto=format&fit=crop&q=60' },
  { id: 2, name: 'Aashirvaad Atta', desc: '5 kg', price: 270, mrp: 310, stock: 80, rating: 4.9, category: 'Atta', sale: false, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=350&auto=format&fit=crop&q=60' },
  { id: 3, name: 'Tata Salt', desc: '1 kg', price: 20, mrp: 24, stock: 200, rating: 4.8, category: 'Snacks', sale: false, image: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=350&auto=format&fit=crop&q=60' },
  { id: 4, name: 'Amul Taaza Milk', desc: '1 L', price: 56, mrp: 60, stock: 150, rating: 4.9, category: 'Dairy', sale: false, image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=350&auto=format&fit=crop&q=60' },
  { id: 5, name: 'Fresh Red Tomatoes', desc: '1 kg', price: 38, mrp: 50, stock: 90, rating: 4.7, category: 'Veggies', sale: true, image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=350&auto=format&fit=crop&q=60' }
];

const CATEGORIES = [
  { id: 'all', name: 'All Items', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=60' },
  { id: 'Veggies', name: 'Veggies & Fruits', image: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=150&auto=format&fit=crop&q=60' },
  { id: 'Dairy', name: 'Dairy & Milk', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=150&auto=format&fit=crop&q=60' },
  { id: 'Atta', name: 'Atta & Oils', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150&auto=format&fit=crop&q=60' },
  { id: 'Snacks', name: 'Snacks', image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=150&auto=format&fit=crop&q=60' }
];

/* LocalStorage State */
let products = JSON.parse(localStorage.getItem('kinex_products')) || DEFAULT_PRODUCTS;
let orders = JSON.parse(localStorage.getItem('kinex_orders')) || [];
let users = JSON.parse(localStorage.getItem('kinex_users')) || [
  { name: 'Nazarul Alam', phone: '6202780297', pass: '1234', address: '', pincode: '' }
];
let riders = JSON.parse(localStorage.getItem('kinex_riders')) || [
  { name: 'Nazarul Alam (Rider)', user: 'nazarul', pass: '1234' }
];
let bannerData = JSON.parse(localStorage.getItem('kinex_banner')) || {
  title: '10-MIN<br>GROCERY',
  sub: 'Fresh Farm Veggies & Dairy',
  img: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=300&auto=format&fit=crop&q=60'
};

let currentUser = JSON.parse(localStorage.getItem('kinex_current_user')) || null;
let currentRole = localStorage.getItem('kinex_current_role') || null;
let activeRider = JSON.parse(localStorage.getItem('kinex_active_rider')) || null;

let selectedCategory = 'All';
let wishlist = [];
let cart = {};
let pendingDirectProduct = null;
let isGateRegisterMode = true;

/* 1. Single Auth Router */
function toggleGateAuthMode() {
  isGateRegisterMode = !isGateRegisterMode;
  document.getElementById('gateTitle').innerText = isGateRegisterMode ? 'Create New Account' : 'Welcome Back (Login)';
  document.getElementById('gateSubmitBtn').innerText = isGateRegisterMode ? 'Register & Start Shopping' : 'Login to Account';
  document.getElementById('gateNameGroup').style.display = isGateRegisterMode ? 'block' : 'none';
  document.getElementById('gateToggleText').innerText = isGateRegisterMode ? 'Already have an account?' : 'New user?';
  document.getElementById('gateToggleLink').innerText = isGateRegisterMode ? 'Login Here' : 'Register Now';
}

function handleUnifiedAuth() {
  const loginInput = document.getElementById('gatePhone').value.trim();
  const pass = document.getElementById('gatePass').value.trim();
  const name = document.getElementById('gateName').value.trim();

  if (!loginInput || !pass) return alert('⚠️ कृपया यूजर/मोबाइल नंबर और पासवर्ड दर्ज करें!');

  // Check 1: Super Admin Login
  if (loginInput === '6202780297' && pass === 'BGMILOVER') {
    currentRole = 'admin';
    localStorage.setItem('kinex_current_role', 'admin');
    switchView('adminPanelView');
    loadAdminDashboard();
    return;
  }

  // Check 2: Delivery Boy Login
  const matchedRider = riders.find(r => r.user === loginInput && r.pass === pass);
  if (matchedRider) {
    currentRole = 'rider';
    activeRider = matchedRider;
    localStorage.setItem('kinex_current_role', 'rider');
    localStorage.setItem('kinex_active_rider', JSON.stringify(activeRider));
    switchView('deliveryPanelView');
    loadDeliveryDashboard();
    return;
  }

  // Check 3: Customer Login / Register
  if (isGateRegisterMode) {
    if (!name) return alert('⚠️ कृपया अपना पूरा नाम दर्ज करें!');
    if (users.find(u => u.phone === loginInput)) return alert('⚠️ यह नंबर पहले से मौजूद है! कृपया लॉगिन करें।');

    const newUser = { name, phone: loginInput, pass, address: '', pincode: '' };
    users.push(newUser);
    localStorage.setItem('kinex_users', JSON.stringify(users));
    currentUser = newUser;
    currentRole = 'customer';
    localStorage.setItem('kinex_current_user', JSON.stringify(currentUser));
    localStorage.setItem('kinex_current_role', 'customer');
    enterAppAsCustomer();
  } else {
    const foundUser = users.find(u => u.phone === loginInput && u.pass === pass);
    if (!foundUser) return alert('❌ गलत मोबाइल नंबर या पासवर्ड!');
    currentUser = foundUser;
    currentRole = 'customer';
    localStorage.setItem('kinex_current_user', JSON.stringify(currentUser));
    localStorage.setItem('kinex_current_role', 'customer');
    enterAppAsCustomer();
  }
}

function enterAppAsCustomer() {
  switchView('customerStoreView');
  document.getElementById('customerBottomNav').style.display = 'flex';
  updateProfileSettingsUI();
}

function logoutApp() {
  if (!confirm('क्या आप सच में लॉग आउट करना चाहते हैं?')) return;
  currentUser = null;
  activeRider = null;
  currentRole = null;
  localStorage.removeItem('kinex_current_user');
  localStorage.removeItem('kinex_active_rider');
  localStorage.removeItem('kinex_current_role');
  switchView('authGateView');
  document.getElementById('customerBottomNav').style.display = 'none';
}

/* 2. Store View & Banner */
function renderBanner() {
  document.getElementById('bannerTitleDisplay').innerHTML = bannerData.title;
  document.getElementById('bannerSubDisplay').innerText = bannerData.sub;
  document.getElementById('bannerImgDisplay').src = bannerData.img;
}

function renderCategories() {
  const bar = document.getElementById('categoriesBar');
  bar.innerHTML = CATEGORIES.map(c => `
    <div class="story-item" onclick="filterByCat('${c.id === 'all' ? 'All' : c.id}')">
      <div class="story-ring ${selectedCategory === c.id || (selectedCategory === 'All' && c.id === 'all') ? 'active' : ''}">
        <img class="story-img" src="${c.image}" alt="${c.name}">
      </div>
      <span class="story-label">${c.name}</span>
    </div>
  `).join('');
}

function renderProducts(items) {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = items.map(p => `
    <div class="product-card">
      <div>
        <div class="card-thumb">
          ${p.sale ? '<span class="sale-badge">FRESH</span>' : ''}
          <button class="fav-btn" onclick="toggleFav(${p.id})">${wishlist.includes(p.id) ? '❤️' : '🤍'}</button>
          <img src="${p.image}" alt="${p.name}">
        </div>
        <div class="p-title">${p.name}</div>
        <div class="p-sub">${p.desc}</div>
        <div class="p-price-row">
          <span class="p-price">₹${p.price}</span>
          ${p.mrp ? `<span class="p-mrp">₹${p.mrp}</span>` : ''}
        </div>
        <div class="p-rating">★ ${p.rating}</div>
        <div class="free-shipping">⚡ 10 Min Delivery</div>
      </div>
      <div class="btn-group">
        <button class="btn-cart" onclick="addToCart(${p.id})">+ Cart</button>
        <button class="btn-buy" onclick="instantBuy(${p.id})">Buy</button>
      </div>
    </div>
  `).join('');
}

function filterByCat(cat) {
  selectedCategory = cat;
  renderCategories();
  document.getElementById('gridTitle').innerText = cat === 'All' ? 'ALL GROCERY ITEMS' : cat.toUpperCase();
  const filtered = cat === 'All' ? products : products.filter(p => p.category === cat);
  renderProducts(filtered);
}

function handleSearch() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const filtered = products.filter(p => p.name.toLowerCase().includes(query) || p.desc.toLowerCase().includes(query));
  renderProducts(filtered);
}

function toggleFav(id) {
  if (wishlist.includes(id)) wishlist = wishlist.filter(x => x !== id);
  else wishlist.push(id);
  renderProducts(products);
}
/* 3. Cart & Buy With Product Photo Objects */
function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  updateCartUI();
  alert('Added to cart!');
}

function updateCartUI() {
  let count = 0;
  let total = 0;
  const list = document.getElementById('cartItemList');
  list.innerHTML = '';

  Object.keys(cart).forEach(id => {
    const p = products.find(x => x.id == id);
    if (!p) return;
    const qty = cart[id];
    count += qty;
    total += p.price * qty;
    list.innerHTML += `
      <div style="display:flex; align-items:center; gap:8px; padding:8px 0; border-bottom:1px solid #f1f5f9; font-size:12px;">
        <img src="${p.image}" style="width:32px; height:32px; border-radius:6px; object-fit:cover;">
        <span style="flex:1;">${p.name} (x${qty})</span>
        <strong>₹${(p.price * qty).toFixed(2)}</strong>
      </div>
    `;
  });

  if (count === 0) list.innerHTML = '<div style="text-align:center; padding:20px; color:#94a3b8; font-size:12px;">Cart is empty!</div>';

  document.getElementById('cartCount').innerText = count;
  document.getElementById('cartTotalVal').innerText = '₹' + total.toFixed(2);
}

function openCartDrawer() { document.getElementById('cartDrawer').classList.add('active'); }
function closeCartDrawer() { document.getElementById('cartDrawer').classList.remove('active'); }

function cartCheckout() {
  if (Object.keys(cart).length === 0) return alert('Cart is empty!');
  
  const userAddr = currentUser && currentUser.address ? currentUser.address.trim() : '';
  const userPin = currentUser && currentUser.pincode ? currentUser.pincode.trim() : '';

  if (!userAddr || !userPin) {
    return alert('⚠️ कृपया पहले प्रोफाइल में जाकर अपना डिलीवरी पता और पिनकोड सेट करें!');
  }
  if (userPin !== ALLOWED_PINCODE) {
    return alert('⚠️ क्षमा करें, इस पिनकोड पर डिलीवरी सेवा उपलब्ध नहीं है!');
  }

  const orderItemsList = Object.keys(cart).map(id => {
    const p = products.find(x => x.id == id);
    return { name: p.name, qty: cart[id], price: p.price, image: p.image };
  });

  const newOrder = {
    id: 'ORD' + Math.floor(1000 + Math.random() * 9000),
    itemsList: orderItemsList,
    itemsText: orderItemsList.map(i => `${i.name} (x${i.qty})`).join(', '),
    amount: document.getElementById('cartTotalVal').innerText,
    numAmount: parseFloat(document.getElementById('cartTotalVal').innerText.replace('₹', '')),
    status: 'Order Placed',
    statusIndex: 0,
    assignedRider: riders[0] ? riders[0].name : 'Auto',
    custName: currentUser.name,
    phone: currentUser.phone,
    address: `${userAddr}, Pin: ${userPin}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    cancelReason: ''
  };

  orders.unshift(newOrder);
  localStorage.setItem('kinex_orders', JSON.stringify(orders));
  alert('🎉 ऑर्डर सफलतापूर्वक दर्ज हुआ!');
  cart = {};
  updateCartUI();
  closeCartDrawer();
  loadUserOrders();
}

function instantBuy(id) {
  pendingDirectProduct = products.find(x => x.id == id);
  document.getElementById('buyProductDetails').innerHTML = `
    <img src="${pendingDirectProduct.image}" style="width:60px; height:60px; border-radius:8px; object-fit:cover;">
    <div>
      <div style="font-weight:bold; font-size:13px;">${pendingDirectProduct.name}</div>
      <div style="font-size:11px; color:#64748b;">${pendingDirectProduct.desc}</div>
      <div style="font-size:14px; font-weight:800; color:#059669; margin-top:2px;">₹${pendingDirectProduct.price}</div>
    </div>
  `;

  if (currentUser) {
    document.getElementById('buyCustName').value = currentUser.name || '';
    document.getElementById('buyCustPhone').value = currentUser.phone || '';
    document.getElementById('buyCustAddress').value = currentUser.address || '';
    document.getElementById('buyCustPincode').value = currentUser.pincode || '';
  }
  document.getElementById('buyModal').classList.add('active');
}

function closeBuyModal() { document.getElementById('buyModal').classList.remove('active'); }

function confirmDirectOrder() {
  const name = document.getElementById('buyCustName').value.trim();
  const phone = document.getElementById('buyCustPhone').value.trim();
  const address = document.getElementById('buyCustAddress').value.trim();
  const pincode = document.getElementById('buyCustPincode').value.trim();

  if (!name || !phone) return alert('⚠️ कृपया नाम और मोबाइल नंबर दर्ज करें!');
  if (!address) return alert('⚠️ कृपया डिलीवरी का पता दर्ज करें!');
  if (!pincode) return alert('⚠️ कृपया एरिया पिनकोड दर्ज करें!');
  
  if (pincode !== ALLOWED_PINCODE) {
    return alert('⚠️ क्षमा करें, इस पिनकोड पर डिलीवरी सेवा उपलब्ध नहीं है!');
  }

  // Auto-Save Customer Details
  if (currentUser) {
    currentUser.name = name;
    currentUser.phone = phone;
    currentUser.address = address;
    currentUser.pincode = pincode;
    localStorage.setItem('kinex_current_user', JSON.stringify(currentUser));
    
    const uIdx = users.findIndex(u => u.phone === currentUser.phone);
    if (uIdx !== -1) {
      users[uIdx].name = name;
      users[uIdx].address = address;
      users[uIdx].pincode = pincode;
      localStorage.setItem('kinex_users', JSON.stringify(users));
    }
  }

  const newOrder = {
    id: 'ORD' + Math.floor(1000 + Math.random() * 9000),
    itemsList: [{ name: pendingDirectProduct.name, qty: 1, price: pendingDirectProduct.price, image: pendingDirectProduct.image }],
    itemsText: `${pendingDirectProduct.name} (x1)`,
    amount: '₹' + pendingDirectProduct.price,
    numAmount: pendingDirectProduct.price,
    status: 'Order Placed',
    statusIndex: 0,
    assignedRider: riders[0] ? riders[0].name : 'Auto',
    custName: name,
    phone: phone,
    address: `${address}, Pin: ${pincode}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    cancelReason: ''
  };

  orders.unshift(newOrder);
  localStorage.setItem('kinex_orders', JSON.stringify(orders));
  alert('🎉 ऑर्डर बुक हो गया है!');
  closeBuyModal();
  loadUserOrders();
  if (activeRider) loadDeliveryDashboard();
  loadAdminDashboard();
}

/* 4. Profile & Account Settings */
function switchUserSubTab(tabId, btn) {
  document.getElementById('userSettingsTab').style.display = tabId === 'userSettingsTab' ? 'block' : 'none';
  document.getElementById('userOrdersTab').style.display = tabId === 'userOrdersTab' ? 'block' : 'none';
  document.getElementById('btnUserTabSettings').classList.toggle('active', tabId === 'userSettingsTab');
  document.getElementById('btnUserTabOrders').classList.toggle('active', tabId === 'userOrdersTab');
  if (tabId === 'userOrdersTab') loadUserOrders();
}

function updateProfileSettingsUI() {
  if (currentUser) {
    document.getElementById('uNameEdit').value = currentUser.name || '';
    document.getElementById('uPassEdit').value = currentUser.pass || '';
    document.getElementById('userSavedAddress').value = currentUser.address || '';
    document.getElementById('userSavedPincode').value = currentUser.pincode || '';
  }
}

function updateUserAccount() {
  const newName = document.getElementById('uNameEdit').value.trim();
  const newPass = document.getElementById('uPassEdit').value.trim();

  if (!newName || !newPass) return alert('⚠️ नाम या पासवर्ड खाली नहीं हो सकता!');

  currentUser.name = newName;
  currentUser.pass = newPass;
  localStorage.setItem('kinex_current_user', JSON.stringify(currentUser));

  const idx = users.findIndex(u => u.phone === currentUser.phone);
  if (idx !== -1) {
    users[idx].name = newName;
    users[idx].pass = newPass;
    localStorage.setItem('kinex_users', JSON.stringify(users));
  }
  alert('✅ आपकी प्रोफाइल सफलतापूर्वक अपडेट हो गई!');
}

function saveUserAddress() {
  const addr = document.getElementById('userSavedAddress').value.trim();
  const pin = document.getElementById('userSavedPincode').value.trim();

  if (!addr || !pin) return alert('⚠️ कृपया पूरा पता और पिनकोड दर्ज करें!');
  if (pin !== ALLOWED_PINCODE) return alert('⚠️ क्षमा करें, इस पिनकोड पर डिलीवरी सेवा उपलब्ध नहीं है!');

  currentUser.address = addr;
  currentUser.pincode = pin;
  localStorage.setItem('kinex_current_user', JSON.stringify(currentUser));

  const idx = users.findIndex(u => u.phone === currentUser.phone);
  if (idx !== -1) {
    users[idx].address = addr;
    users[idx].pincode = pin;
    localStorage.setItem('kinex_users', JSON.stringify(users));
  }
  alert('✅ Delivery Address Saved!');
}
/* 5. 8-Step Tracker (With Photos) */
function loadUserOrders() {
  const box = document.getElementById('userOrdersList');
  const filteredOrders = currentUser 
    ? orders.filter(o => o.phone === currentUser.phone || o.custName === currentUser.name)
    : orders;

  if (filteredOrders.length === 0) {
    box.innerHTML = '<div style="text-align:center; padding:20px; font-size:12px; color:#94a3b8;">कोई पुराना ऑर्डर मौजूद नहीं है।</div>';
    return;
  }

  box.innerHTML = filteredOrders.map(o => {
    const isCancelled = o.status === 'Cancelled';
    const currentIdx = o.statusIndex !== undefined ? o.statusIndex : TRACKING_STAGES.indexOf(o.status);

    const itemsHtml = o.itemsList ? o.itemsList.map(it => `
      <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
        <img src="${it.image}" style="width:36px; height:36px; border-radius:6px; object-fit:cover; border:1px solid #e2e8f0;">
        <span style="font-size:11px; color:#1e293b;"><b>${it.name}</b> (x${it.qty})</span>
      </div>
    `).join('') : `<div style="font-size:11px;">🛍️ ${o.itemsText || o.items}</div>`;

    return `
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:bold;">
          <span>${o.id}</span>
          <span style="color:#059669;">${o.amount}</span>
        </div>
        <div style="margin: 6px 0; background:white; padding:8px; border-radius:8px; border:1px solid #f1f5f9;">
          ${itemsHtml}
        </div>
        <div style="font-size:11px; color:#475569;">📍 <b>पता:</b> ${o.address}</div>

        ${!isCancelled ? `
          <div style="margin: 10px 0; padding: 10px; background: white; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="font-size: 11px; font-weight: 800; color: #059669; margin-bottom: 8px;">
              📍 स्थिति: ${TRACKING_STAGES[currentIdx] || o.status}
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${TRACKING_STAGES.map((stage, sIdx) => `
                <div style="display:flex; align-items:center; gap:8px; font-size:10px; font-weight:${sIdx <= currentIdx ? 'bold' : 'normal'}; color:${sIdx <= currentIdx ? '#059669' : '#94a3b8'};">
                  <span style="width:14px; height:14px; border-radius:50%; background:${sIdx <= currentIdx ? '#059669' : '#e2e8f0'}; color:white; display:flex; align-items:center; justify-content:center; font-size:8px;">
                    ${sIdx <= currentIdx ? '✓' : sIdx + 1}
                  </span>
                  <span>${stage}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
          <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:6px 10px; margin-top:8px; color:#ef4444; font-size:11px; font-weight:bold;">
            ❌ Order Cancelled: ${o.cancelReason || 'Cancelled by customer'}
          </div>
        `}

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; border-top:1px solid #eee; padding-top:6px;">
          <span style="font-size:10px; color:#94a3b8;">${o.timestamp} • राइडर: <b>${o.assignedRider || 'Auto'}</b></span>
          ${(!isCancelled && currentIdx < 7) ? `
            <button class="btn-danger" onclick="cancelOrder('${o.id}')">Cancel</button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function cancelOrder(orderId) {
  const reason = prompt('Please enter reason for cancellation:', 'Changed my mind');
  if (reason === null) return;

  const idx = orders.findIndex(o => o.id === orderId);
  if (idx !== -1) {
    orders[idx].status = 'Cancelled';
    orders[idx].cancelReason = reason || 'Cancelled by customer';
    localStorage.setItem('kinex_orders', JSON.stringify(orders));
    alert('Order has been cancelled.');
    loadUserOrders();
    if (activeRider) loadDeliveryDashboard();
    loadAdminDashboard();
  }
}

/* 6. Admin Panel Operations (Banner, Manage Users, Products, Fleet, Orders) */
function switchAdminSubTab(tabId, btn) {
  document.querySelectorAll('.admin-sub-view').forEach(v => v.style.display = 'none');
  document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tabId).style.display = 'block';
  btn.classList.add('active');
}

function adminSaveBanner() {
  const title = document.getElementById('admBannerTitle').value.trim();
  const sub = document.getElementById('admBannerSub').value.trim();
  const img = document.getElementById('admBannerImg').value.trim();

  if (!title || !sub || !img) return alert('⚠️ कृपया सभी बैनर फ़ील्ड भरें!');

  bannerData = { title, sub, img };
  localStorage.setItem('kinex_banner', JSON.stringify(bannerData));
  renderBanner();
  alert('✅ Store Banner Updated Successfully!');
}

function loadAdminDashboard() {
  const totalOrders = orders.length;
  const totalSales = orders.reduce((sum, o) => o.status !== 'Cancelled' ? sum + (o.numAmount || 0) : sum, 0);
  const cancelledOrders = orders.filter(o => o.status === 'Cancelled').length;

  document.getElementById('kpiTotalOrders').innerText = totalOrders;
  document.getElementById('kpiTotalSales').innerText = '₹' + totalSales.toLocaleString('en-IN');
  document.getElementById('kpiCancelledOrders').innerText = cancelledOrders;
  document.getElementById('kpiTotalUsers').innerText = users.length;

  // Pre-fill Banner Editor
  document.getElementById('admBannerTitle').value = bannerData.title || '';
  document.getElementById('admBannerSub').value = bannerData.sub || '';
  document.getElementById('admBannerImg').value = bannerData.img || '';

  // Manage Users Table
  const usersTbody = document.getElementById('adminUsersTableBody');
  usersTbody.innerHTML = users.map((u, idx) => `
    <tr>
      <td><strong>${u.name}</strong></td>
      <td>📞 ${u.phone}</td>
      <td><code>${u.pass}</code></td>
      <td>
        <div style="display:flex; gap:4px;">
          <button class="btn-secondary" style="padding:4px 8px; font-size:10px;" onclick="adminEditUser(${idx})">✏️</button>
          <button class="btn-danger" style="padding:4px 8px; font-size:10px;" onclick="adminDeleteUser(${idx})">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');

  // Orders Log
  const orderBox = document.getElementById('adminOrdersDetailedList');
  if (orders.length === 0) {
    orderBox.innerHTML = '<div style="text-align:center; padding:20px; font-size:12px; color:#94a3b8;">No customer orders placed yet.</div>';
  } else {
    orderBox.innerHTML = orders.map((o, idx) => {
      const isCancelled = o.status === 'Cancelled';
      const isDelivered = o.status === 'Delivered Successfully';

      const itemsHtml = o.itemsList ? o.itemsList.map(it => `
        <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
          <img src="${it.image}" style="width:30px; height:30px; border-radius:6px; object-fit:cover; border:1px solid #cbd5e1;">
          <span>${it.name} (x${it.qty})</span>
        </div>
      `).join('') : `<span>${o.itemsText || o.items}</span>`;

      return `
        <div style="background:${isCancelled ? '#fff5f5' : '#f8fafc'}; border:1px solid ${isCancelled ? '#fecaca' : '#e2e8f0'}; border-radius:12px; padding:12px; margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <strong style="font-size:13px;">${o.id}</strong> • <span style="font-size:11px; color:#64748b;">${o.timestamp}</span>
            </div>
            <span style="font-size:12px; font-weight:bold; color:${isCancelled ? '#ef4444' : '#059669'};">
              ${isCancelled ? '❌ CANCELLED' : (isDelivered ? '✅ DELIVERED' : '⚡ LIVE: ' + o.status)}
            </span>
          </div>

          <div style="margin-top:6px; font-size:12px; color:#0f172a;">
            <strong>Customer:</strong> ${o.custName} (📞 <b>${o.phone}</b>)
          </div>
          <div style="font-size:11px; color:#475569; margin-top:2px;">📍 <strong>Address:</strong> ${o.address}</div>
          <div style="font-size:12px; color:#1e293b; font-weight:600; margin-top:6px; background:white; padding:8px; border-radius:8px; border:1px solid #f1f5f9;">
            ${itemsHtml}
            <div style="margin-top:4px; color:#059669; font-weight:bold;">Total Amount: ${o.amount}</div>
          </div>

          ${!isCancelled ? `
            <div style="display:flex; gap:8px; align-items:center; margin-top:8px; border-top:1px solid #eee; padding-top:6px;">
              <span style="font-size:11px; color:#64748b;">Assign Rider:</span>
              <select onchange="adminAssignRider(${idx}, this.value)" class="form-control" style="padding:4px 8px; font-size:11px; flex:1;">
                ${riders.map(r => `<option value="${r.name}" ${o.assignedRider === r.name ? 'selected' : ''}>🛵 ${r.name}</option>`).join('')}
              </select>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  // Delivery Fleet
  const riderBox = document.getElementById('adminRidersDetailedList');
  if (riders.length === 0) {
    riderBox.innerHTML = '<div style="font-size:11px; color:#94a3b8;">No delivery partners registered.</div>';
  } else {
    riderBox.innerHTML = riders.map((r, idx) => `
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:13px; font-weight:bold; color:#0f172a;">🛵 ${r.name}</div>
          <div style="font-size:11px; color:#64748b;">User ID: <b>${r.user}</b> | Pass: <code>${r.pass}</code></div>
        </div>
        <button class="btn-danger" onclick="adminRemoveRider(${idx})">Delete</button>
      </div>
    `).join('');
  }

  // Inventory Table
  const prodTbody = document.getElementById('adminProductsTableBody');
  prodTbody.innerHTML = products.map(p => `
    <tr>
      <td>
        <div class="table-prod">
          <img src="${p.image}" alt="${p.name}">
          <div>
            <div style="font-weight:700;">${p.name}</div>
            <div style="font-size:9px; color:#64748b;">${p.desc}</div>
          </div>
        </div>
      </td>
      <td>${p.category}</td>
      <td>
        <strong>₹${p.price}</strong>
        <div style="font-size:9px; color:#94a3b8; text-decoration:line-through;">₹${p.mrp || p.price}</div>
      </td>
      <td>${p.stock || 50}</td>
      <td>
        <button class="icon-action-btn del" onclick="adminDeleteProduct(${p.id})">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function adminEditUser(idx) {
  const u = users[idx];
  const newName = prompt('Enter new Name:', u.name);
  if (newName === null) return;
  const newPass = prompt('Enter new Password for user:', u.pass);
  if (newPass === null) return;

  users[idx].name = newName || u.name;
  users[idx].pass = newPass || u.pass;
  localStorage.setItem('kinex_users', JSON.stringify(users));
  alert('✅ Member details updated!');
  loadAdminDashboard();
}

function adminDeleteUser(idx) {
  if (!confirm(`Delete user "${users[idx].name}"?`)) return;
  users.splice(idx, 1);
  localStorage.setItem('kinex_users', JSON.stringify(users));
  loadAdminDashboard();
}

function adminAssignRider(orderIdx, riderName) {
  orders[orderIdx].assignedRider = riderName;
  localStorage.setItem('kinex_orders', JSON.stringify(orders));
  alert(`✅ Order assigned to ${riderName}!`);
  loadAdminDashboard();
  loadUserOrders();
}

function adminAddProduct() {
  const name = document.getElementById('admPName').value.trim();
  const desc = document.getElementById('admPDesc').value.trim();
  const price = parseFloat(document.getElementById('admPPrice').value);
  const mrp = parseFloat(document.getElementById('admPMrp').value) || price;
  const stock = parseInt(document.getElementById('admPStock').value) || 50;
  const category = document.getElementById('admPCat').value;
  const image = document.getElementById('admPImg').value.trim() || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=350';

  if (!name || isNaN(price)) return alert('Please enter product name and selling price!');

  const newProduct = { id: Date.now(), name, desc, price, mrp, stock, rating: 4.8, category, sale: false, image };
  products.unshift(newProduct);
  localStorage.setItem('kinex_products', JSON.stringify(products));
  alert('✅ Product added to Store!');
  renderProducts(products);
  loadAdminDashboard();

  document.getElementById('admPName').value = '';
  document.getElementById('admPDesc').value = '';
  document.getElementById('admPPrice').value = '';
  document.getElementById('admPMrp').value = '';
  document.getElementById('admPStock').value = '';
  document.getElementById('admPImg').value = '';
}

function adminDeleteProduct(id) {
  if (!confirm('Remove this product?')) return;
  products = products.filter(p => p.id !== id);
  localStorage.setItem('kinex_products', JSON.stringify(products));
  renderProducts(products);
  loadAdminDashboard();
}
function adminCreateRider() {
  const name = document.getElementById('admRiderName').value.trim();
  const user = document.getElementById('admRiderUser').value.trim();
  const pass = document.getElementById('admRiderPass').value.trim();

  if (!name || !user || !pass) return alert('Fill all credentials!');
  if (riders.find(r => r.user === user)) return alert('Partner ID already exists!');

  riders.push({ name, user, pass });
  localStorage.setItem('kinex_riders', JSON.stringify(riders));
  alert(`✅ Partner Created: ${name}`);

  document.getElementById('admRiderName').value = '';
  document.getElementById('admRiderUser').value = '';
  document.getElementById('admRiderPass').value = '';
  loadAdminDashboard();
}

function adminRemoveRider(idx) {
  if (!confirm('Remove this partner?')) return;
  riders.splice(idx, 1);
  localStorage.setItem('kinex_riders', JSON.stringify(riders));
  loadAdminDashboard();
}

/* 7. Delivery Partner Step-by-Step Flow */
function loadDeliveryDashboard() {
  document.getElementById('riderNameBadge').innerText = activeRider.name;
  const box = document.getElementById('deliveryOrdersList');
  const myOrders = orders.filter(o => o.assignedRider === activeRider.name || o.assignedRider === 'Auto');

  if (myOrders.length === 0) {
    box.innerHTML = '<div style="text-align:center; padding:30px; color:#94a3b8; font-size:12px;">No tasks assigned.</div>';
    return;
  }

  box.innerHTML = myOrders.map((o) => {
    const realIdx = orders.findIndex(x => x.id === o.id);
    const currentIdx = o.statusIndex !== undefined ? o.statusIndex : TRACKING_STAGES.indexOf(o.status);
    const nextStage = TRACKING_STAGES[currentIdx + 1];

    const itemsHtml = o.itemsList ? o.itemsList.map(it => `
      <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
        <img src="${it.image}" style="width:28px; height:28px; border-radius:4px; object-fit:cover;">
        <span>${it.name} (x${it.qty})</span>
      </div>
    `).join('') : `<span>${o.itemsText || o.items}</span>`;

    return `
      <div class="panel-card" style="border-left:4px solid ${currentIdx === 7 ? '#059669' : (o.status === 'Cancelled' ? '#ef4444' : '#f59e0b')};">
        <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:13px;">
          <span>Order ${o.id}</span>
          <span style="color:#059669;">Collect: ${o.amount}</span>
        </div>
        <div style="font-size:11px; margin-top:4px;"><b>Customer:</b> ${o.custName} (📞 <b>${o.phone}</b>)</div>
        <div style="font-size:11px; color:#475569;"><b>Address:</b> ${o.address}</div>
        <div style="font-size:11px; color:#1e293b; margin:6px 0; background:#f1f5f9; padding:6px; border-radius:6px;">
          ${itemsHtml}
        </div>
        <div style="font-size:11px; margin-top:4px;"><b>Status:</b> <span style="color:#059669; font-weight:bold;">${TRACKING_STAGES[currentIdx] || o.status}</span></div>

        ${(o.status !== 'Cancelled' && currentIdx < 7) ? `
          <div style="margin-top:10px;">
            <button class="btn-primary" onclick="advanceOrderStatus(${realIdx})">
              👉 Next: ${nextStage}
            </button>
          </div>
        ` : `<div style="margin-top:8px; font-size:11px; color:${o.status === 'Cancelled' ? '#ef4444' : '#059669'}; font-weight:bold;">${o.status === 'Cancelled' ? '❌ Order Cancelled' : '✅ Delivered Successfully'}</div>`}
      </div>
    `;
  }).join('');
}

function advanceOrderStatus(idx) {
  let curr = orders[idx].statusIndex !== undefined ? orders[idx].statusIndex : TRACKING_STAGES.indexOf(orders[idx].status);
  if (curr < TRACKING_STAGES.length - 1) {
    curr++;
    orders[idx].statusIndex = curr;
    orders[idx].status = TRACKING_STAGES[curr];
    localStorage.setItem('kinex_orders', JSON.stringify(orders));
    loadDeliveryDashboard();
    loadUserOrders();
    loadAdminDashboard();
  }
}

function switchView(viewId) {
  document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
  document.getElementById(viewId).classList.add('active');
  const showNav = (viewId === 'customerStoreView' || viewId === 'userProfileView') && currentRole === 'customer';
  document.getElementById('customerBottomNav').style.display = showNav ? 'flex' : 'none';
  if (viewId === 'userProfileView') updateProfileSettingsUI();
  window.scrollTo(0, 0);
}

function setActiveTab(el) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

/* Boot Application */
renderBanner();
renderCategories();
renderProducts(products);
updateCartUI();

if (currentRole === 'admin') {
  switchView('adminPanelView');
  loadAdminDashboard();
} else if (currentRole === 'rider' && activeRider) {
  switchView('deliveryPanelView');
  loadDeliveryDashboard();
} else if (currentRole === 'customer' && currentUser) {
  enterAppAsCustomer();
} else {
  switchView('authGateView');
}
