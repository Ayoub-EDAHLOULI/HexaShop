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

        const shopProductSearch = document.getElementById('shop-product-search');
        if (shopProductSearch) {
            shopProductSearch.addEventListener('input', (e) => {
                const searchTerm = e.target.value;
                const activeCategory = document.querySelector('.category-btn.active').dataset.category;
                loadProducts('shop', searchTerm, activeCategory);
            });
        }

        const categoryButtons = document.querySelectorAll('.category-btn');
        categoryButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                const selectedCategory = e.target.dataset.category;
                const currentSearchTerm = document.getElementById('shop-product-search').value;
                loadProducts('shop', currentSearchTerm, selectedCategory);
            });
        });
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
    if (document.getElementById('checkout-container')) {
        console.log('Calling displayCheckoutSummary.');
        displayCheckoutSummary();
    }
    if (document.body.classList.contains('blog')) {
        console.log('Calling loadBlogPosts for blog page.');
        loadBlogPosts();

        const blogSearchInput = document.getElementById('blog-search-input');
        if (blogSearchInput) {
            blogSearchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value;
                loadBlogPosts(searchTerm);
            });
        }
    }
    if (document.getElementById('order-history')) {
        console.log('Calling loadOrderHistory for order history page.');
        loadOrderHistory();
    }
    if (document.getElementById('wishlist')) {
        console.log('Calling loadWishlistPage for wishlist page.');
        loadWishlistPage();
    }
    console.log('Calling setupAccountDropdown.');
    setupAccountDropdown();
    console.log('Calling setupMobileMenu.');
    setupMobileMenu();
    console.log('Calling injectNotificationContainer.');
    injectNotificationContainer();
    console.log('Calling updateCartCounter.');
    updateCartCounter();

    window.addEventListener('scroll', () => {
        const header = document.getElementById('header');
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
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

async function loadProducts(context, searchTerm = '', category = '') {
    console.log(`loadProducts called with context: ${context}, searchTerm: ${searchTerm}, category: ${category}`);
    try {
        console.log('Fetching products...');
        let url = '/api/products';
        const params = new URLSearchParams();
        if (searchTerm) {
            params.append('search', searchTerm);
        }
        if (category && category !== 'all') {
            params.append('category', category);
        }
        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        const response = await fetch(url);
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
                console.log('Injecting featured products HTML for sproduct page.');
                // Display a selection of products as featured, e.g., the first 8
                const featuredProducts = products.slice(0, 8);
                if (featuredProducts.length > 0) {
                    featuredContainer.innerHTML = featuredProducts.map(product => createProductHtml(product)).join('');
                } else {
                    featuredContainer.innerHTML = '<p>No featured products available.</p>';
                    console.log('No featured products found to display.');
                }
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

        document.querySelectorAll('.add-to-wishlist').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                toggleWishlist(id);
            });
        });

        document.querySelectorAll('.add-to-wishlist').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                toggleWishlist(id);
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
                <h4>${product.price.toFixed(2)}</h4>
            </div>
            <a href="#" class="add-to-cart" data-id="${product.id}" aria-label="Add ${product.name} to cart">
                <i class="fas fa-shopping-cart cart"></i>
            </a>
            <a href="#" class="add-to-wishlist" data-id="${product.id}" aria-label="Add ${product.name} to wishlist">
                <i class="far fa-heart"></i>
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
        const response = await fetch(`/api/products/${productId}`);
        const product = await response.json();

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

        // Load and display reviews for this product
        loadProductReviews(productId);

        // Handle review form submission
        const reviewForm = document.getElementById('review-form');
        if (reviewForm) {
            reviewForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const token = localStorage.getItem('jwtToken');
                if (!token) {
                    alert('You must be logged in to submit a review.');
                    window.location.href = 'login.html?redirect=sproduct';
                    return;
                }

                const rating = document.getElementById('review-rating').value;
                const comment = document.getElementById('review-comment').value;

                if (!rating || !comment) {
                    alert('Please provide both a rating and a comment.');
                    return;
                }

                try {
                    const response = await fetch(`/api/products/${productId}/reviews`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ rating, comment })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        alert(data.message);
                        reviewForm.reset();
                        loadProductReviews(productId); // Reload reviews
                    } else {
                        alert(data.message || 'Failed to submit review.');
                    }
                } catch (error) {
                    console.error('Error submitting review:', error);
                    alert('An error occurred while submitting your review. Please try again.');
                }
            });
        }

    } catch (error) {
        console.error('Error loading product:', error);
    }
}

async function loadProductReviews(productId) {
    const reviewsList = document.getElementById('reviews-list');
    if (!reviewsList) return;

    try {
        const response = await fetch(`/api/products/${productId}/reviews`);
        const reviews = await response.json();

        if (reviews.length === 0) {
            reviewsList.innerHTML = '<p>No reviews yet. Be the first to review this product!</p>';
        } else {
            reviewsList.innerHTML = reviews.map(review => `
                <div class="review-item">
                    <p><strong>${review.userName}</strong> - ${review.rating} Stars</p>
                    <p>${review.comment}</p>
                    <small>${new Date(review.date).toLocaleDateString()}</small>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading product reviews:', error);
        reviewsList.innerHTML = '<p>Error loading reviews.</p>';
    }
}

async function getCart() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return [];
    try {
        const response = await fetch('/api/cart', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            return await response.json();
        } else {
            console.error('Failed to fetch cart:', response.statusText);
            return [];
        }
    } catch (error) {
        console.error('Error fetching cart:', error);
        return [];
    }
}

async function addToCart(id, name, price, image, quantity, size) {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        // Store product details in session storage for redirection after login
        sessionStorage.setItem('redirectProduct', JSON.stringify({ id, name, price, image, quantity, size }));
        window.location.href = 'login.html?redirect=sproduct';
        return;
    }

    try {
        const response = await fetch('/api/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ productId: id, name, price, image, quantity, size })
        });

        const data = await response.json();
        if (response.ok) {
            showNotification(data.message);
            updateCartCounter();
        } else {
            showNotification(data.message || 'Failed to add to cart.');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('An error occurred while adding to cart.');
    }
}

async function removeFromCart(id, size) {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        showNotification('Please log in to manage cart.');
        return;
    }

    try {
        const response = await fetch(`/api/cart/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ size })
        });

        const data = await response.json();
        if (response.ok) {
            showNotification(data.message);
            displayCartItems();
            updateCartCounter();
        } else {
            showNotification(data.message || 'Failed to remove from cart.');
        }
    } catch (error) {
        console.error('Error removing from cart:', error);
        showNotification('An error occurred while removing from cart.');
    }
}

async function updateCartQuantity(id, size, newQuantity) {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        showNotification('Please log in to manage cart.');
        return;
    }

    try {
        const response = await fetch(`/api/cart/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ quantity: parseInt(newQuantity), size })
        });

        const data = await response.json();
        if (response.ok) {
            showNotification(data.message);
            displayCartItems();
            updateCartCounter();
        } else {
            showNotification(data.message || 'Failed to update cart quantity.');
        }
    } catch (error) {
        console.error('Error updating cart quantity:', error);
        showNotification('An error occurred while updating cart quantity.');
    }
}

async function displayCartItems() {
    console.log('displayCartItems called.');
    const cart = await getCart(); // Fetch cart from backend
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
                <td><a href="#" onclick="removeFromCart('${item.productId}', '${item.size}')"><i class="fas fa-times-circle"></i></a></td>
                <td><img src="${item.image}" alt="${item.name}"></td>
                <td>${item.name} (${item.size})</td>
                <td>${item.price.toFixed(2)}</td>
                <td><input type="number" value="${item.quantity}" min="1" onchange="updateCartQuantity('${item.productId}', '${item.size}', this.value)"></td>
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
            <button class="normal" id="proceed-to-checkout-btn">Proceed To Checkout</button>
        `;
        setupCartEventListeners(); // Re-attach event listener after re-rendering
    }
}

async function displayCheckoutSummary() {
    const cart = await getCart();
    const summaryTable = document.getElementById('checkout-summary-table');
    if (!summaryTable) return;

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);

    summaryTable.innerHTML = `
        <tr>
            <td>Cart Subtotal</td>
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
    `;
}

async function updateCartCounter() {
    const counter = document.getElementById('cart-counter');
    if (counter) {
        const cart = await getCart();
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        counter.textContent = count;
        counter.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

function setupCartEventListeners() {
    const checkoutBtn = document.getElementById('proceed-to-checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async () => {
            const cart = await getCart(); // Ensure cart is fetched before checking length
            if (cart.length === 0) {
                alert('Your cart is empty!');
                return;
            }
            window.location.href = localStorage.getItem('jwtToken') 
                ? 'checkout.html' 
                : 'login.html?redirect=checkout';
        });
    }
}

// Checkout Form Submission
if (document.getElementById('checkout-form')) {
    document.getElementById('checkout-form').addEventListener('submit', async function(event) {
        event.preventDefault();

        const token = localStorage.getItem('jwtToken');
        if (!token) {
            alert('You must be logged in to place an order.');
            window.location.href = 'login.html?redirect=checkout';
            return;
        }

        const cart = await getCart();
        if (cart.length === 0) {
            alert('Your cart is empty. Please add items before checking out.');
            return;
        }

        const name = document.getElementById('name').value;
        const address = document.getElementById('address').value;
        const city = document.getElementById('city').value;
        const zip = document.getElementById('zip').value;
        const cardNumber = document.getElementById('card-number').value;
        const expiryDate = document.getElementById('expiry-date').value;
        const cvv = document.getElementById('cvv').value;

        const orderDetails = {
            shippingInfo: { name, address, city, zip },
            paymentInfo: { cardNumber, expiryDate, cvv },
            items: cart,
            totalAmount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            orderDate: new Date().toISOString()
        };

        try {
            const response = await fetch('/api/place-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderDetails)
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                // Clear cart after successful order
                await fetch('/api/cart/clear', {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                updateCartCounter();
                window.location.href = 'index.html'; // Redirect to home or order confirmation page
            } else {
                alert(data.message || 'Failed to place order.');
            }
        } catch (error) {
            console.error('Error placing order:', error);
            alert('An error occurred while placing your order. Please try again.');
        }
    });
}

// Checkout Form Submission
if (document.getElementById('checkout-form')) {
    document.getElementById('checkout-form').addEventListener('submit', async function(event) {
        event.preventDefault();

        const token = localStorage.getItem('jwtToken');
        if (!token) {
            alert('You must be logged in to place an order.');
            window.location.href = 'login.html?redirect=checkout';
            return;
        }

        const cart = await getCart();
        if (cart.length === 0) {
            alert('Your cart is empty. Please add items before checking out.');
            return;
        }

        const name = document.getElementById('name').value;
        const address = document.getElementById('address').value;
        const city = document.getElementById('city').value;
        const zip = document.getElementById('zip').value;
        const cardNumber = document.getElementById('card-number').value;
        const expiryDate = document.getElementById('expiry-date').value;
        const cvv = document.getElementById('cvv').value;

        const orderDetails = {
            shippingInfo: { name, address, city, zip },
            paymentInfo: { cardNumber, expiryDate, cvv },
            items: cart,
            totalAmount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            orderDate: new Date().toISOString()
        };

        try {
            const response = await fetch('/api/place-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderDetails)
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                // Clear cart after successful order
                await fetch('/api/cart/clear', {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                updateCartCounter();
                window.location.href = 'index.html'; // Redirect to home or order confirmation page
            } else {
                alert(data.message || 'Failed to place order.');
            }
        } catch (error) {
            console.error('Error placing order:', error);
            alert('An error occurred while placing your order. Please try again.');
        }
    });
}


function setupAccountDropdown() {
    const token = localStorage.getItem('jwtToken');
    const isAdmin = localStorage.getItem('isAdmin') === 'true'; // Retrieve isAdmin flag
    const loggedOutDropdown = document.getElementById('account-dropdown-logged-out');
    const loggedInDropdown = document.getElementById('account-dropdown-logged-in');
    const logoutLink = document.getElementById('logout-link');
    const adminDashboardLink = document.getElementById('admin-dashboard-link');

    if (token) {
        if (loggedOutDropdown) loggedOutDropdown.style.display = 'none';
        if (loggedInDropdown) loggedInDropdown.style.display = 'inline-block';

        if (adminDashboardLink) {
            if (isAdmin) {
                adminDashboardLink.style.display = 'list-item';
            } else {
                adminDashboardLink.style.display = 'none';
            }
        }
    } else {
        if (loggedOutDropdown) loggedOutDropdown.style.display = 'inline-block';
        if (loggedInDropdown) loggedInDropdown.style.display = 'none';
        if (adminDashboardLink) adminDashboardLink.style.display = 'none';
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

// Function to handle scroll animations
function handleScrollAnimations() {
    const sections = document.querySelectorAll('.section-p1, .section-m1');
    const triggerBottom = window.innerHeight / 5 * 4;

    sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        if (sectionTop < triggerBottom) {
            section.classList.add('visible');
        } else {
            section.classList.remove('visible');
        }
    });
}

// Call on load and resize
document.addEventListener('DOMContentLoaded', () => {
    applyMobileClass();
    handleScrollAnimations(); // Initial check
});
window.addEventListener('resize', applyMobileClass);
window.addEventListener('scroll', handleScrollAnimations);


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

async function loadBlogPosts(searchTerm = '') {
    console.log('Fetching blog posts...');
    try {
        let url = '/api/blog';
        if (searchTerm) {
            url += `?search=${searchTerm}`;
        }
        const response = await fetch(url);
        const posts = await response.json();
        console.log('Blog posts data parsed:', posts);

        const blogContainer = document.getElementById('blog');
        if (blogContainer) {
            blogContainer.innerHTML = posts.map(post => createBlogPostHtml(post)).join('');
        }
    } catch (error) {
        console.error('Error loading blog posts:', error);
    }
}

function createBlogPostHtml(post) {
    return `
        <article class="blog-box">
            <div class="blog-img">
                <img src="${post.image}" alt="${post.title}">
            </div>
            <div class="blog-detail">
                <h4>${post.title}</h4>
                <p>${post.content}</p>
                <a href="#">CONTINUE READING</a>
            </div>
            <h1>${post.date}</h1>
        </article>
    `;
}

async function loadOrderHistory() {
    console.log('Fetching order history...');
    const orderHistoryTableBody = document.querySelector('#order-history-table tbody');
    const noOrdersMessage = document.getElementById('no-orders');
    const token = localStorage.getItem('jwtToken');

    if (!token) {
        alert('You must be logged in to view your order history.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('/api/orders/history', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const orders = await response.json();
            if (orders.length === 0) {
                orderHistoryTableBody.innerHTML = '';
                noOrdersMessage.style.display = 'block';
            } else {
                noOrdersMessage.style.display = 'none';
                orderHistoryTableBody.innerHTML = orders.map(order => {
                    const orderDate = new Date(order.orderDate).toLocaleDateString();
                    const totalAmount = order.totalAmount.toFixed(2);
                    return `
                        <tr>
                            <td>${order.id}</td>
                            <td>${orderDate}</td>
                            <td>${totalAmount}</td>
                            <td>${order.status}</td>
                            <td><button class="normal view-order-details" data-order='${JSON.stringify(order)}'>View Details</button></td>
                        </tr>
                    `;
                }).join('');

                document.querySelectorAll('.view-order-details').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const order = JSON.parse(e.target.dataset.order);
                        let detailsHtml = `
                            <p><strong>Order ID:</strong> ${order.id}</p>
                            <p><strong>Date:</strong> ${new Date(order.orderDate).toLocaleDateString()}</p>
                            <p><strong>Total:</strong> ${order.totalAmount.toFixed(2)}</p>
                            <p><strong>Status:</strong> ${order.status}</p>
                            <h4>Shipping Information:</h4>
                            <p>Name: ${order.shippingInfo.name}</p>
                            <p>Address: ${order.shippingInfo.address}, ${order.shippingInfo.city}, ${order.shippingInfo.zip}</p>
                            <h4>Items:</h4>
                            <ul>
                        `;
                        order.items.forEach(item => {
                            detailsHtml += `<li>${item.name} (x${item.quantity}) - ${(item.price * item.quantity).toFixed(2)}</li>`;
                        });
                        detailsHtml += `</ul>`;
                        alert(detailsHtml);
                    });
                });
            }
        } else {
            alert('Failed to fetch order history.');
            orderHistoryTableBody.innerHTML = '';
            noOrdersMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading order history:', error);
        alert('An error occurred while loading your order history.');
        orderHistoryTableBody.innerHTML = '';
        noOrdersMessage.style.display = 'block';
    }
}

async function toggleWishlist(productId) {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        showNotification('Please log in to manage your wishlist.');
        return;
    }

    try {
        const response = await fetch('/api/wishlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ productId })
        });

        const data = await response.json();
        if (response.ok) {
            showNotification(data.message);
            // Optionally update the heart icon visually
            const heartIcon = document.querySelector(`.add-to-wishlist[data-id="${productId}"] .fa-heart`);
            if (heartIcon) {
                if (data.inWishlist) {
                    heartIcon.classList.remove('far');
                    heartIcon.classList.add('fas');
                } else {
                    heartIcon.classList.remove('fas');
                    heartIcon.classList.add('far');
                }
            }
        } else {
            showNotification(data.message || 'Failed to update wishlist.');
        }
    } catch (error) {
        console.error('Error updating wishlist:', error);
        showNotification('An error occurred while updating your wishlist.');
    }
}

async function loadWishlistPage() {
    const wishlistProductsContainer = document.getElementById('wishlist-products-container');
    const noWishlistItemsMessage = document.getElementById('no-wishlist-items');
    const token = localStorage.getItem('jwtToken');

    if (!token) {
        alert('You must be logged in to view your wishlist.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('/api/wishlist', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const wishlistProductIds = await response.json();

            if (wishlistProductIds.length === 0) {
                wishlistProductsContainer.innerHTML = '';
                noWishlistItemsMessage.style.display = 'block';
            } else {
                noWishlistItemsMessage.style.display = 'none';
                // Fetch full product details for each item in the wishlist
                const productPromises = wishlistProductIds.map(productId =>
                    fetch(`/api/products/${productId}`).then(res => res.json())
                );
                const products = await Promise.all(productPromises);

                wishlistProductsContainer.innerHTML = products.map(product => `
                    <div class="pro">
                        <img src="${product.image}" alt="${product.name}">
                        <div class="des">
                            <span>${product.category}</span>
                            <h5>${product.name}</h5>
                            <div class="star">${'<i class="fas fa-star"></i>'.repeat(product.stars)}</div>
                            <h4>${product.price.toFixed(2)}</h4>
                        </div>
                        <a href="#" class="add-to-cart" data-id="${product.id}" aria-label="Add ${product.name} to cart">
                            <i class="fas fa-shopping-cart cart"></i>
                        </a>
                        <a href="#" class="remove-from-wishlist" data-id="${product.id}" aria-label="Remove ${product.name} from wishlist">
                            <i class="fas fa-heart"></i>
                        </a>
                    </div>
                `).join('');

                document.querySelectorAll('.remove-from-wishlist').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const productId = e.target.dataset.id;
                        await toggleWishlist(productId); // Use toggle to remove
                        loadWishlistPage(); // Reload wishlist after removal
                    });
                });

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
            }
        } else {
            alert('Failed to fetch wishlist.');
            wishlistProductsContainer.innerHTML = '';
            noWishlistItemsMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading wishlist:', error);
        alert('An error occurred while loading your wishlist.');
        wishlistProductsContainer.innerHTML = '';
        noWishlistItemsMessage.style.display = 'block';
    }
}

async function toggleWishlist(productId) {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        showNotification('Please log in to manage your wishlist.');
        return;
    }

    try {
        const response = await fetch('/api/wishlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ productId })
        });

        const data = await response.json();
        if (response.ok) {
            showNotification(data.message);
            // Optionally update the heart icon visually
            const heartIcon = document.querySelector(`.add-to-wishlist[data-id="${productId}"] .fa-heart`);
            if (heartIcon) {
                if (data.inWishlist) {
                    heartIcon.classList.remove('far');
                    heartIcon.classList.add('fas');
                } else {
                    heartIcon.classList.remove('fas');
                    heartIcon.classList.add('far');
                }
            }
        } else {
            showNotification(data.message || 'Failed to update wishlist.');
        }
    } catch (error) {
        console.error('Error updating wishlist:', error);
        showNotification('An error occurred while updating your wishlist.');
    }
}

async function loadWishlistPage() {
    const wishlistProductsContainer = document.getElementById('wishlist-products-container');
    const noWishlistItemsMessage = document.getElementById('no-wishlist-items');
    const token = localStorage.getItem('jwtToken');

    if (!token) {
        alert('You must be logged in to view your wishlist.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('/api/wishlist', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const wishlistProductIds = await response.json();

            if (wishlistProductIds.length === 0) {
                wishlistProductsContainer.innerHTML = '';
                noWishlistItemsMessage.style.display = 'block';
            } else {
                noWishlistItemsMessage.style.display = 'none';
                // Fetch full product details for each item in the wishlist
                const productPromises = wishlistProductIds.map(productId =>
                    fetch(`/api/products/${productId}`).then(res => res.json())
                );
                const products = await Promise.all(productPromises);

                wishlistProductsContainer.innerHTML = products.map(product => `
                    <div class="pro">
                        <img src="${product.image}" alt="${product.name}">
                        <div class="des">
                            <span>${product.category}</span>
                            <h5>${product.name}</h5>
                            <div class="star">${'<i class="fas fa-star"></i>'.repeat(product.stars)}</div>
                            <h4>${product.price.toFixed(2)}</h4>
                        </div>
                        <a href="#" class="add-to-cart" data-id="${product.id}" aria-label="Add ${product.name} to cart">
                            <i class="fas fa-shopping-cart cart"></i>
                        </a>
                        <a href="#" class="remove-from-wishlist" data-id="${product.id}" aria-label="Remove ${product.name} from wishlist">
                            <i class="fas fa-heart"></i>
                        </a>
                    </div>
                `).join('');

                document.querySelectorAll('.remove-from-wishlist').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const productId = e.target.dataset.id;
                        await toggleWishlist(productId); // Use toggle to remove
                        loadWishlistPage(); // Reload wishlist after removal
                    });
                });

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
            }
        } else {
            alert('Failed to fetch wishlist.');
            wishlistProductsContainer.innerHTML = '';
            noWishlistItemsMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading wishlist:', error);
        alert('An error occurred while loading your wishlist.');
        wishlistProductsContainer.innerHTML = '';
        noWishlistItemsMessage.style.display = 'block';
    }
}