const nav = document.getElementById('navbar');

const mainProductImage = document.getElementById('MainImage');
const smallImages = document.getElementsByClassName('smallImage');

if (mainProductImage && smallImages.length > 0) {
    Array.from(smallImages).forEach(smallImg => {
        smallImg.addEventListener('click', () => {
            mainProductImage.src = smallImg.src;
        });
    });
}


document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded fired.');
    if (document.getElementById('hero')) {
        console.log('Calling loadProducts for home page.');
        loadProducts('home');
    }
    if (document.body.classList.contains('shop')) {
        console.log('Calling loadProducts for shop page.');
        loadProducts('shop');
    }
    if (document.getElementById('prodetails')) {
        console.log('Calling loadSingleProduct and loadProducts for sproduct page.');
        loadSingleProduct();
        loadProducts('featured');
    }
    if (document.getElementById('cart')) {
        console.log('Calling displayCartItems and setupCartEventListeners.');
        displayCartItems();
        setupCartEventListeners();
    }
    console.log('Calling setupAccountDropdown.');
    setupAccountDropdown();
    console.log('Calling setupMobileMenu.');
    setupMobileMenu();
    console.log('Calling injectNotificationContainer.');
    injectNotificationContainer();
    console.log('Calling updateCartCounter.');
    updateCartCounter();
});

function injectNotificationContainer() {
    const notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    document.body.appendChild(notificationContainer);
}

function showNotification(message) {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    container.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            container.removeChild(notification);
        }, 500);
    }, 3000);
}

async function loadProducts(context) {
    console.log(`loadProducts called with context: ${context}`);
    try {
        console.log('Fetching products.json...');
        const response = await fetch('assets/json/products.json');
        console.log('Response received:', response);
        const products = await response.json();
        console.log('Products data parsed:', products);

        if (context === 'home') {
            const featuredContainer = document.querySelector('#product1 .pro-container');
            const newArrivalsContainer = document.querySelector('#new-arrivals .pro-container');

            if (featuredContainer) {
                console.log('Injecting featured products HTML.');
                const featuredProducts = products.slice(0, 8);
                featuredContainer.innerHTML = featuredProducts.map(product => createProductHtml(product)).join('');
            }
            if (newArrivalsContainer) {
                console.log('Injecting new arrivals HTML.');
                const newArrivals = products.slice(8, 16);
                newArrivalsContainer.innerHTML = newArrivals.map(product => createProductHtml(product)).join('');
            }
        } else if (context === 'shop') {
            const shopContainer = document.querySelector('#product1 .pro-container');
            if (shopContainer) {
                console.log('Injecting shop products HTML.');
                shopContainer.innerHTML = products.map(product => createProductHtml(product)).join('');
            }
        } else if (context === 'featured') {
            const featuredContainer = document.querySelector('#product1 .pro-container');
            if (featuredContainer) {
                console.log('Injecting featured products for sproduct page HTML.');
                const featuredProducts = products.slice(0, 4);
                featuredContainer.innerHTML = featuredProducts.map(product => createProductHtml(product)).join('');
            }
        }

        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const product = products.find(p => p.id === id);
                if (product) {
                    addToCart(product.id, product.name, product.price, product.image, 1, 'M');
                    showNotification(`${product.name} added to cart!`);
                }
            });
        });
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function createProductHtml(product) {
    const html = `
        <div class="pro" onclick="window.location.href='sproduct.html?id=${product.id}'" role="link" tabindex="0">
            <img src="${product.image}" alt="${product.name}">
            <div class="des">
                <span>${product.category}</span>
                <h5>${product.name}</h5>
                <div class="star">${'<i class="fas fa-star"></i>'.repeat(product.stars)}</div>
                <h4>$${product.price.toFixed(2)}</h4>
            </div>
            <a href="#" class="add-to-cart" data-id="${product.id}" aria-label="Add ${product.name} to cart">
                <i class="fas fa-shopping-cart cart"></i>
            </a>
        </div>
    `;
    console.log('Generated product HTML:', html);
    return html;
}


async function loadSingleProduct() {
    const productId = new URLSearchParams(window.location.search).get('id');
    if (!productId) return;

    try {
        const response = await fetch('assets/json/products.json');
        const products = await response.json();
        const product = products.find(p => p.id === productId);

        if (!product) return;

        document.getElementById('MainImage').src = product.image;
        document.querySelector('.sproDetails h4').textContent = product.name;
        document.querySelector('.sproDetails h2').textContent = `$${product.price.toFixed(2)}`;
        document.querySelector('.sproDetails span').textContent = product.description;

        const smallImageGroup = document.querySelector('.smallImageGroup');
        if (smallImageGroup) {
            smallImageGroup.innerHTML = '';
            for (let i = 0; i < 4; i++) {
                const smallImageCol = document.createElement('div');
                smallImageCol.className = 'smallImageCol';
                const img = document.createElement('img');
                img.src = product.image;
                img.alt = `${product.name} thumbnail ${i + 1}`;
                img.width = 100;
                img.className = 'smallImage';
                smallImageCol.appendChild(img);
                smallImageGroup.appendChild(smallImageCol);

                img.addEventListener('click', () => {
                    document.getElementById('MainImage').src = img.src;
                });
            }
        }

        document.querySelector('#prodetails .normal').addEventListener('click', () => {
            const quantity = parseInt(document.getElementById('quantity-input').value) || 1;
            const size = document.getElementById('size-select').value || 'M';
            addToCart(product.id, product.name, product.price, product.image, quantity, size);
            showNotification(`${product.name} added to cart!`);
        });
    } catch (error) {
        console.error('Error loading product:', error);
    }
}

function getCart() {
    return JSON.parse(localStorage.getItem('hexa-cart')) || [];
}

function saveCart(cart) {
    localStorage.setItem('hexa-cart', JSON.stringify(cart));
}

function addToCart(id, name, price, image, quantity, size) {
    const cart = getCart();
    const existingItem = cart.find(item => item.id === id && item.size === size);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ id, name, price: parseFloat(price), image, quantity, size });
    }

    saveCart(cart);
    updateCartCounter();
}

function removeFromCart(id, size) {
    let cart = getCart().filter(item => !(item.id === id && item.size === size));
    saveCart(cart);
    displayCartItems();
}

function updateCartQuantity(id, size, newQuantity) {
    const cart = getCart();
    const item = cart.find(item => item.id === id && item.size === size);
    
    if (item) {
        item.quantity = parseInt(newQuantity);
        if (item.quantity <= 0) removeFromCart(id, size);
        else saveCart(cart);
    }

    displayCartItems();
}

function displayCartItems() {
    console.log('displayCartItems called.');
    const cart = getCart();
    console.log('Cart data retrieved:', cart);
    const tbody = document.querySelector('#cart tbody');
    if (!tbody) {
        console.log('Cart tbody not found.');
        return;
    }

    if (cart.length === 0) {
        console.log('Cart is empty. Hiding cart table, showing empty message.');
        tbody.innerHTML = '';
        document.getElementById('cart-empty').style.display = 'block';
        document.getElementById('cart-add').style.display = 'none';
    } else {
        console.log('Cart has items. Showing cart table, hiding empty message.');
        document.getElementById('cart-empty').style.display = 'none';
        document.getElementById('cart-add').style.display = 'flex';
        tbody.innerHTML = cart.map(item => `
            <tr>
                <td><a href="#" onclick="removeFromCart('${item.id}', '${item.size}')"><i class="fas fa-times-circle"></i></a></td>
                <td><img src="${item.image}" alt="${item.name}"></td>
                <td>${item.name} (${item.size})</td>
                <td>${item.price.toFixed(2)}</td>
                <td><input type="number" value="${item.quantity}" min="1" onchange="updateCartQuantity('${item.id}', '${item.size}', this.value)"></td>
                <td>${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `).join('');
    }


    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
    const subtotalContainer = document.getElementById('subtotal');
    if (subtotalContainer) {
        console.log('Updating subtotal container.');
        subtotalContainer.innerHTML = `
            <h3>Cart Totals</h3>
            <table>
                <tr>
                    <td>Subtotal</td>
                    <td>${subtotal}</td>
                </tr>
                <tr>
                    <td>Shipping</td>
                    <td>Free</td>
                </tr>
                <tr>
                    <td><strong>Total</strong></td>
                    <td><strong>${subtotal}</strong></td>
                </tr>
            </table>
            <button class="normal proceed-checkout">Proceed To Checkout</button>
        `;
    }
}

function updateCartCounter() {
    const counter = document.getElementById('cart-counter');
    if (counter) {
        const count = getCart().reduce((sum, item) => sum + item.quantity, 0);
        counter.textContent = count;
        counter.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

function setupCartEventListeners() {
    const checkoutBtn = document.querySelector('.proceed-checkout');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (getCart().length === 0) {
                alert('Your cart is empty!');
                return;
            }
            window.location.href = localStorage.getItem('jwtToken') 
                ? 'checkout.html' 
                : 'login.html?redirect=checkout';
        });
    }
}


function setupAccountDropdown() {
    const token = localStorage.getItem('jwtToken');
    const loggedOutDropdown = document.getElementById('account-dropdown-logged-out');
    const loggedInDropdown = document.getElementById('account-dropdown-logged-in');
    const logoutLink = document.getElementById('logout-link');

    if (token) {
        if (loggedOutDropdown) loggedOutDropdown.style.display = 'none';
        if (loggedInDropdown) loggedInDropdown.style.display = 'inline-block';
    } else {
        if (loggedOutDropdown) loggedOutDropdown.style.display = 'inline-block';
        if (loggedInDropdown) loggedInDropdown.style.display = 'none';
    }

    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            logoutUser();
        });
    }

    [loggedOutDropdown, loggedInDropdown].forEach(dropdown => {
        if (dropdown) {
            const dropbtn = dropdown.querySelector('.dropbtn');
            if (dropbtn) {
                dropbtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropdown.classList.toggle('active');
                });
            }
        }
    });

    window.addEventListener('click', function(event) {
        [loggedOutDropdown, loggedInDropdown].forEach(dropdown => {
            if (dropdown && !dropdown.contains(event.target)) {
                dropdown.classList.remove('active');
            }
        });
    });
}

function logoutUser() {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('hexa-cart');
    updateCartCounter();
    showNotification('Logged out successfully!');
    window.location.href = 'index.html';
    setupAccountDropdown();
}


function setupMobileMenu() {
    const menuToggle = document.getElementById('mobile');
    const navbar = document.getElementById('navbar');
    const closeButton = document.getElementById('close');
    const body = document.body;

    // Ensure navbar is closed on page load
    if (navbar) {
        navbar.classList.remove('active');
        body.classList.remove('menu-active');
    }

    if (menuToggle && navbar) {
        menuToggle.addEventListener('click', () => {
            navbar.classList.add('active');
            body.classList.add('menu-active');
        });
    }

    if (closeButton && navbar) {
        closeButton.addEventListener('click', () => {
            navbar.classList.remove('active');
            body.classList.remove('menu-active');
        });
    }
}

function applyMobileClass() {
    const body = document.body;
    if (window.screen.width <= 768) {
        body.classList.add('is-mobile');
    } else {
        body.classList.remove('is-mobile');
    }
}

// Call on load and resize
document.addEventListener('DOMContentLoaded', applyMobileClass);
window.addEventListener('resize', applyMobileClass);


function validateNewsletterForm() {
    const email = document.getElementById('newsletter-email').value;
    if (!email || !email.includes('@')) {
        alert('Please enter a valid email address.');
        return false;
    }
    return true;
}


if (document.getElementById('newsletter-form')) {
    document.getElementById('newsletter-form').addEventListener('submit', (e) => {
        if (!validateNewsletterForm()) e.preventDefault();
    });
}