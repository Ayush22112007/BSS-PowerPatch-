/* app.js */

document.addEventListener('DOMContentLoaded', () => {

    // --- Search functionality ---
    const searchIcon = document.getElementById('search-icon');
    const searchInput = document.getElementById('search-input');
    const searchContainer = document.querySelector('.search-container');
    const productCards = document.querySelectorAll('.product-card');

    const form = document.querySelector(".contact-form");

    if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        console.log("Form triggered ✅");

        const data = {
        firstName: form.querySelector('input[placeholder="John"]').value,
        lastName: form.querySelector('input[placeholder="Doe"]').value,
        email: form.querySelector('input[type="email"]').value,
        phone: form.querySelector('input[type="tel"]').value,
        message: form.querySelector("textarea").value,
        timestamp: new Date()
        };

        try {
        await addDoc(collection(db, "leads"), data);
        console.log("Saved to Firebase 🔥");
        alert("Submitted successfully!");
        } catch (err) {
        console.error("Firebase error:", err);
        }
    });
    }

    searchIcon.addEventListener('click', () => {
        searchContainer.classList.toggle('active');
        if (searchContainer.classList.contains('active')) {
            searchInput.focus();
        } else {
            searchInput.value = '';
            filterProducts('');
        }
    });

    searchInput.addEventListener('input', (e) => {
        filterProducts(e.target.value.toLowerCase());
    });

    function filterProducts(term) {
        let visibleCount = 0;
        productCards.forEach(card => {
            const title = card.querySelector('.product-title').innerText.toLowerCase();
            if (title.includes(term)) {
                card.style.display = 'flex';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        const resultCount = document.querySelector('.result-count');
        if (resultCount) {
            resultCount.innerText = `Showing 1–${visibleCount} of ${productCards.length} results`;
        }
    }

    let scrollTracked = {
    25: false,
    50: false,
    75: false,
    90: false
    };

    window.addEventListener("scroll", () => {
    const scrollPercent =
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;

    Object.keys(scrollTracked).forEach(level => {
        if (scrollPercent >= level && !scrollTracked[level]) {
        scrollTracked[level] = true;

        gtag("event", "scroll_depth", {
            percent: level
        });

        console.log(`Reached ${level}%`);
        }
    });
    });

    // --- Cart functionality ---
    const cartIcon = document.getElementById('cart-icon');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    const closeCartBtn = document.getElementById('closeCartBtn');

    function toggleCart() {
        cartSidebar.classList.toggle('open');
        cartOverlay.classList.toggle('show');
    }

    cartIcon.addEventListener('click', toggleCart);
    closeCartBtn.addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', toggleCart);

    let cart = [];

    function addToCart(name, price) {
        cart.push({ name, price });
        updateCartUI();
        showToast(`Added ${name} to cart!`, 'success');
    }

    document.querySelectorAll(".add-cart-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        gtag("event", "add_to_cart", {
        item_name: "Transformer Leak Kit"
        });
    });
    });

    document.querySelectorAll('.add-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            addToCart(btn.getAttribute('data-name'), parseFloat(btn.getAttribute('data-price')));
        });
    });

    function updateCartUI() {
        document.getElementById('cart-badge').innerText = cart.length;
        const cartItemsContainer = document.getElementById('cartItemsContainer');
        cartItemsContainer.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p style="color:#6B7280;text-align:center;margin-top:2rem;">Your cart is empty.</p>';
        } else {
            cart.forEach((item, index) => {
                total += item.price;
                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item';
                itemEl.innerHTML = `
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>₹${item.price.toFixed(2)}</p>
                    </div>
                    <button class="cart-item-remove" data-index="${index}">×</button>
                `;
                cartItemsContainer.appendChild(itemEl);
            });

            document.querySelectorAll('.cart-item-remove').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    cart.splice(parseInt(e.target.getAttribute('data-index')), 1);
                    updateCartUI();
                });
            });
        }
        document.getElementById('cartTotalPrice').innerText = `₹${total.toFixed(2)}`;
    }

    // --- Checkout ---
    const checkoutBtn = document.getElementById('checkoutBtn');
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) { showToast('Your cart is empty!', ''); return; }
        checkoutBtn.innerText = 'Processing...';
        checkoutBtn.disabled = true;
        setTimeout(() => {
            cart = [];
            updateCartUI();
            toggleCart();
            checkoutBtn.innerText = 'Buy Now (Checkout)';
            checkoutBtn.disabled = false;
            showToast('Order placed successfully! Our team will contact you shortly.', 'success');
        }, 1500);
    });

    // --- Enquiry ---
    document.querySelectorAll('.enquiry-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const productTitle = e.target.closest('.product-card').querySelector('.product-title').innerText;
            showToast(`Redirecting to enquiry for ${productTitle}...`, 'info');
            setTimeout(() => {
                window.location.href = `#contact?product=${encodeURIComponent(productTitle)}`;
            }, 1500);
        });
    });

    document.querySelectorAll('a[href="#contact"]').forEach(btn => {
  btn.addEventListener("click", () => {
    gtag("event", "contact_click");
  });
});


    // =========================================================
    // --- STATS COUNTER (Animated on scroll into view) ---
    // =========================================================
    const statNumbers = document.querySelectorAll('.stat-number');
    const statsStrip = document.querySelector('.stats-strip');
    let statsAnimated = false;

    function animateCounters() {
        statNumbers.forEach(el => {
            const target = parseInt(el.getAttribute('data-target'));
            const duration = 1800;
            const step = target / (duration / 16);
            let current = 0;
            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    el.textContent = target;
                    clearInterval(timer);
                } else {
                    el.textContent = Math.floor(current);
                }
            }, 16);
        });
    }

    if (statsStrip) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !statsAnimated) {
                statsAnimated = true;
                animateCounters();
                observer.disconnect();
            }
        }, { threshold: 0.3 });
        observer.observe(statsStrip);
    }


    // =========================================================
    // --- PRODUCT QUICK-VIEW MODAL ---
    // =========================================================
    const modalOverlay = document.getElementById('modalOverlay');
    const modalClose  = document.getElementById('modalClose');
    const modalCartBtn = document.getElementById('modalCartBtn');

    let activeModalProduct = null;

    function openModal(card) {
        activeModalProduct = {
            name: card.getAttribute('data-modal-title'),
            price: parseFloat(card.querySelector('.add-cart-btn').getAttribute('data-price'))
        };

        document.getElementById('modalTitle').textContent    = card.getAttribute('data-modal-title');
        document.getElementById('modalCategory').textContent = card.getAttribute('data-modal-category');
        document.getElementById('modalDesc').textContent     = card.getAttribute('data-modal-desc');
        document.getElementById('modalSpecs').textContent    = card.getAttribute('data-modal-specs');
        document.getElementById('modalApps').textContent     = card.getAttribute('data-modal-apps');
        document.getElementById('modalImg').src              = card.getAttribute('data-modal-img');
        document.getElementById('modalImg').alt              = card.getAttribute('data-modal-title');

        modalOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modalOverlay.classList.remove('open');
        document.body.style.overflow = '';
        activeModalProduct = null;
    }

    document.querySelectorAll('.quick-view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(btn.closest('.product-card'));
        });
    });

    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    modalCartBtn.addEventListener('click', () => {
        if (activeModalProduct) {
            addToCart(activeModalProduct.name, activeModalProduct.price);
            closeModal();
        }
    });


    // =========================================================
    // --- BACK TO TOP BUTTON ---
    // =========================================================
    const backToTop = document.getElementById('backToTop');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    if (form) {
    form.addEventListener("submit", () => {
        gtag("event", "form_submit");
    });
    }
    
    // --- Toast Library (global) ---
    window.showToast = function(message, type) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerText = message;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // Initial Render
    updateCartUI();
});
