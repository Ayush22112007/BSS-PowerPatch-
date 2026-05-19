/* LeakXpert App Logic - Firebase Firestore version */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaV3Provider } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js";

// REPLACE WITH YOUR ACTUAL CONFIG
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

let appCheck;

try{

    appCheck=initializeAppCheck(app,{
        provider:new ReCaptchaV3Provider(
            '6LcNQtwsAAAAAH18q__7_kQQk926-EZeSoaBTkfZ'
        ),
        isTokenAutoRefreshEnabled:true
    });

}
catch(err){

    console.error(
    "Firebase App Check failed:",
    err);

}

window.addEventListener("load",()=>{

    import("./firebase-init.js");

});

// Enable debug token in development environments
if (location.hostname === 'localhost' || location.hostname.includes('ais-dev') || location.hostname.includes('run.app')) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

const db = getFirestore(app);

function startAnimations() {
  console.log("Animations started");
  // Add any initial animations here if needed
}

window.onload = () => {
   startAnimations();
}

document.addEventListener('DOMContentLoaded', () => {

    const currentProductType = window.location.pathname.includes("sf6")
    ? "sf6"
    : "powerpatch";

    // --- Mobile Menu Toggle ---
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const navbar = document.querySelector('.navbar');
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            mobileMenu.classList.toggle('flex');
            // Toggle hamburger icon if needed
            menuToggle.innerText = mobileMenu.classList.contains('hidden') ? '☰' : '✕';
        });
    }

    if (navbar) {
        let lastScrollY = window.scrollY;
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (ticking) return;
            ticking = true;

            window.requestAnimationFrame(() => {
                const currentScrollY = window.scrollY;
                const isScrollingUp = currentScrollY < lastScrollY - 6;
                const isScrollingDown = currentScrollY > lastScrollY + 10;

                if (currentScrollY <= 40 || isScrollingUp) {
                    navbar.classList.remove('navbar--hidden');
                    navbar.classList.add('navbar--shown');
                } else if (isScrollingDown && currentScrollY > 140) {
                    navbar.classList.add('navbar--hidden');
                    navbar.classList.remove('navbar--shown');
                    if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                        mobileMenu.classList.add('hidden');
                        mobileMenu.classList.remove('flex');
                        if (menuToggle) menuToggle.innerText = '\u2630';
                    }
                }

                lastScrollY = currentScrollY;
                ticking = false;
            });
        }, { passive: true });
    }

    // --- Search functionality ---
    const searchIcon = document.getElementById('search-icon');
    const searchInput = document.getElementById('search-input');
    const searchContainer = document.querySelector('.search-container');
    const productCards = document.querySelectorAll('.product-card');

    const contactForm = document.querySelector(".contact-form");
    
    function formatINR(amount) {
        return "₹" + Number(amount).toLocaleString("en-IN");
    }

    // Capture Leads (Firestore)
    if (contactForm) {
        contactForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const data = {
                firstName: contactForm.querySelector('input[placeholder="First Name"]')?.value || '',
                lastName: contactForm.querySelector('input[placeholder="Last Name"]')?.value || '',
                email: contactForm.querySelector('input[type="email"]')?.value || '',
                phone: contactForm.querySelector('input[type="tel"]')?.value || '',
                message: contactForm.querySelector("textarea")?.value || '',
                timestamp: serverTimestamp()
            };

            try {
                await addDoc(collection(db, "leads"), data);
                if (window.showToast) window.showToast("Inquiry submitted!", "success");
                contactForm.reset();
            } catch (err) {
                console.error("Firestore Error:", err);
                if (window.showToast) window.showToast("Error saving inquiry.", "error");
            }
        });
    }

    if (searchIcon) {
        searchIcon.addEventListener('click', () => {
            searchContainer.classList.toggle('active');
            if (searchContainer.classList.contains('active')) searchInput.focus();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            productCards.forEach(card => {
                const title = card.querySelector('.product-title')?.innerText.toLowerCase() || '';
                card.style.display = title.includes(term) ? 'flex' : 'none';
            });
        });
    }
    const clientGrid = document.querySelector(".client-grid");

    const leftArrow = document.getElementById("client-scroll-left");
    const rightArrow = document.getElementById("client-scroll-right");

    if (clientGrid && leftArrow && rightArrow) {

        const updateArrows = () => {

            const scrollLeft = clientGrid.scrollLeft;
            const maxScroll =
                clientGrid.scrollWidth - clientGrid.clientWidth;

            // LEFT
            if (scrollLeft <= 10) {
                leftArrow.classList.add("hidden");
            } else {
                leftArrow.classList.remove("hidden");
            }

            // RIGHT
            if (scrollLeft >= maxScroll - 10) {
                rightArrow.classList.add("hidden");
            } else {
                rightArrow.classList.remove("hidden");
            }
        };

        rightArrow.addEventListener("click", () => {
            clientGrid.scrollBy({
                left: 320,
                behavior: "smooth"
            });
        });

        leftArrow.addEventListener("click", () => {
            clientGrid.scrollBy({
                left: -320,
                behavior: "smooth"
            });
        });

        clientGrid.addEventListener("scroll", updateArrows);

        updateArrows();
    }

    // --- Cart functionality ---
    const cartIcon = document.getElementById('cart-icon');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    const closeCartBtn = document.getElementById('closeCartBtn');
    let cart = [];
    try {
        cart = JSON.parse(localStorage.getItem("cartItems")) || [];
        // Sanitize to ensure productType exists for all items
        cart = cart.map(item => ({
            ...item,
            productType: item.productType || "powerpatch"
        }));
    } catch {
        cart = [];
    }
    function toggleCart() {
        if (cartSidebar) cartSidebar.classList.toggle('open');
        if (cartOverlay) cartOverlay.classList.toggle('show');
    }

    if (cartIcon) cartIcon.addEventListener('click', toggleCart);
    if (closeCartBtn) closeCartBtn.addEventListener('click', toggleCart);
    if (cartOverlay) cartOverlay.addEventListener('click', toggleCart);

    function updateCartUI() {
        const cartBadge = document.getElementById('cart-badge');
        const cartItemsContainer = document.getElementById('cartItemsContainer');
        const checkoutItemsContainer = document.getElementById('checkout-items');
        const totalPriceEl = document.getElementById('cartTotalPrice');
        if (!cartBadge) return;

        cartBadge.innerText = cart.reduce((sum, item) => sum + item.qty, 0);
        
        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = cart.length === 0 ? '<p style="text-align:center;padding:2rem;color:gray;">Cart is empty.</p>' : '';
        }
        if (checkoutItemsContainer) checkoutItemsContainer.innerHTML = '';
        
        let total = 0;
        cart.forEach((item) => {
            total += item.price * item.qty;
            
            // Sidebar item
            if (cartItemsContainer) {
                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item py-4 border-b border-gray-100 flex justify-between items-center';
                itemEl.innerHTML = `
                    <div class="cart-item-info flex-1">
                        <h4 class="font-bold text-[#393185]">
                        ${item.name}
                        <span style="font-size:11px; color:#888;">
                            (${item.productType.toUpperCase()})
                        </span>
                        </h4>
                        <p class="text-xs text-gray-400">Qty: ${item.qty} ?? ${formatINR(item.price)}</p>
                    </div>
                    <div class="price-col text-right">
                        <strong class="text-[#ea1f22] block font-black">${formatINR(item.price * item.qty)}</strong>
                    </div>
                `;
                cartItemsContainer.appendChild(itemEl);
            }

            // Checkout Summary item (if on checkout page)
            if (checkoutItemsContainer) {
                const li = document.createElement('li');
                li.className = 'flex justify-between items-center text-sm font-medium';
                li.innerHTML = `
                    <span>
                    ${item.name} 
                    <small style="color:gray">(${item.productType.toUpperCase()})</small>
                    x ${item.qty}
                    </span>
                    <span class="font-bold">${formatINR(item.price * item.qty)}</span>
                `;
                checkoutItemsContainer.appendChild(li);
            }
        });

        if (totalPriceEl) totalPriceEl.innerText = formatINR(total);

        const checkoutTotal = document.getElementById("checkout-total");
        if (checkoutTotal) checkoutTotal.innerText = formatINR(total);

        localStorage.setItem("cartItems", JSON.stringify(cart));
        localStorage.setItem("orderTotal", total);

        syncProductButtons();
        
        // Refresh Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    function syncProductButtons() {
        document.querySelectorAll('.add-cart-btn, .buy-now-btn').forEach(btn => {
            const name = btn.dataset.name;
            const item = cart.find(i => i.name === name && i.productType === currentProductType);
            
            if (item) {
                btn.classList.add('in-cart');
                const isLastOne = item.qty === 1;
                btn.innerHTML = `
                    <div class="integrated-stepper flex items-center justify-between w-full h-full px-4">
                        <div class="stepper-action minus flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/20 text-white transition-colors" data-action="minus">
                             <i data-lucide="${isLastOne ? 'trash-2' : 'minus'}" class="w-4 h-4"></i>
                        </div>
                        <span class="qty-val font-black text-white text-lg">${item.qty}</span>
                        <div class="stepper-action plus flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/20 text-white transition-colors" data-action="plus">
                            <i data-lucide="plus" class="w-4 h-4"></i>
                        </div>
                    </div>
                `;
            } else {
                btn.classList.remove('in-cart');
                btn.innerHTML = `🛒 Add to Cart`;
            }
        });
    }

    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".buy-now-btn, .add-cart-btn");
        if (!btn) return;

        const action = e.target.closest("[data-action]")?.dataset.action;
        const name = btn.dataset.name;
        const price = parseFloat(btn.dataset.price);

        let item = cart.find(i => i.name === name && i.productType === currentProductType);

        if (!btn.classList.contains("in-cart")) {
            if (!item) {
                cart.push({ name, price, qty: 1, productType: currentProductType });
            } else {
                item.qty++;
            }
        }
        else if (action === "plus" && item) {
            item.qty++;
        }
        else if (action === "minus" && item) {
            item.qty--;
            if (item.qty <= 0) {
                cart = cart.filter(i => !(i.name === name && i.productType === currentProductType));
            }
        }

        updateCartUI();
    });

    // --- Checkout Page: "Proceed to Pay" button ---
    const placeOrderBtn = document.getElementById("place-order-btn");
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener("click", async () => {
            if (cart.length === 0) return window.showToast?.("Cart is empty", "info");

            const customerData = {
                name: document.getElementById("name")?.value || '',
                email: document.getElementById("email")?.value || '',
                phone: document.getElementById("phone")?.value || '',
                address: document.getElementById("address")?.value || '',
                city: document.getElementById("city")?.value || '',
                pincode: document.getElementById("pincode")?.value || ''
            };

            if (!customerData.name || !customerData.email || !customerData.phone) {
                return window.showToast?.("Fill required fields", "info");
            }

            placeOrderBtn.disabled = true;
            placeOrderBtn.innerText = "Saving Order...";

            try {
                const totalAmount = parseFloat(localStorage.getItem("orderTotal"));
                const orderPayload = {
                    customer: customerData,
                    order: {
                        items: cart,
                        total: totalAmount
                    },
                    status: "pending",
                    createdAt: serverTimestamp()
                };

                await addDoc(collection(db, "orders"), orderPayload);
                if (window.showToast) window.showToast("Order saved!", "success");
                localStorage.setItem("customerData", JSON.stringify(customerData));
                window.location.href = "payment.html";
            } catch (err) {
                console.error("Order Error:", err);
                if (window.showToast) window.showToast("Error processing order", "error");
                placeOrderBtn.disabled = false;
                placeOrderBtn.innerText = "Proceed to Pay →";
            }
        });
    }

    const checkoutBtn = document.getElementById("checkoutBtn");
    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", () => {
            if (cart.length === 0) {
                window.showToast?.("Cart is empty", "info");
                return;
            }
            window.location.href = "checkout.html";
        });
    }

    window.showToast = function(message, type) {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type} show`;
        toast.innerText = message;
        container.appendChild(toast);
        setTimeout(() => { toast.remove(); }, 3000);
    };

    // --- Stats Counter Animation ---
    const stats = document.querySelectorAll('.stat-number');
    const animateStats = () => {
        stats.forEach(stat => {
            const target = +stat.getAttribute('data-target');
            const speed = 200;
            const inc = target / speed;

            const updateCount = () => {
                const currentCount = +stat.innerText.replace(/[+%]/g, '');
                if (currentCount < target) {
                    stat.innerText = Math.ceil(currentCount + inc);
                    setTimeout(updateCount, 10);
                } else {
                    stat.innerText = target;
                }
            };
            stat.innerText = '0';
            updateCount();
        });
    };

    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            animateStats();
            observer.disconnect();
        }
    }, { threshold: 0.5 });

    if (stats.length > 0) observer.observe(stats[0]);

    // --- Product Gallery Logic ---
    const mainImg = document.getElementById('main-product-img');
    const thumbnails = document.querySelectorAll('.thumbnail-item');
    
    if (mainImg && thumbnails.length > 0) {
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', () => {
                mainImg.style.opacity = '0';
                setTimeout(() => {
                    mainImg.src = thumb.src;
                    mainImg.alt = thumb.alt;
                    mainImg.style.opacity = '1';
                }, 300);
                thumbnails.forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            });
        });
    }

    updateCartUI();
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // --- Hero Parallax ---
    const heroImg = document.querySelector('.hero-bg-img');
    if (heroImg) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const limit = window.innerHeight * 0.8; // Roughly hero height
            if (scrolled < limit) {
                // Move image slower than scroll (parallax)
                heroImg.style.transform = `translateY(${scrolled * 0.6}px)`;
            }
        });
    }
});

document.addEventListener("DOMContentLoaded",()=>{

    /* VIDEO PLAY / PAUSE */

    const mainVideo =
    document.getElementById("problemVideo");

    const bgVideo =
    document.querySelector(".video-bg");

    const toggle =
    document.getElementById("videoToggle");

    if(mainVideo && bgVideo && toggle){

        toggle.addEventListener("click",()=>{

            if(mainVideo.paused){

                mainVideo.play();
                bgVideo.play();

                toggle.innerHTML="⏸";

            }else{

                mainVideo.pause();
                bgVideo.pause();

                toggle.innerHTML="▶";

            }

        });

    }

});
