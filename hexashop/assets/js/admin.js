document.addEventListener('DOMContentLoaded', function() {
    // Function to decode JWT token
    function parseJwt (token) {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
            return null;
        }
    }

    // Check if user is authenticated and is admin
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const decodedToken = parseJwt(token);
    if (!decodedToken || !decodedToken.isAdmin) {
        window.location.href = 'login.html';
        return;
    }
    const productTableBody = document.querySelector('#product-table tbody');
    const userTableBody = document.querySelector('#user-table tbody');
    const blogTableBody = document.querySelector('#blog-table tbody');
    const orderTableBody = document.querySelector('#order-table tbody');
    const addProductBtn = document.getElementById('add-product-btn');
    const addBlogPostBtn = document.getElementById('add-blog-post-btn');
    const totalProductsElem = document.getElementById('total-products');
    const totalUsersElem = document.getElementById('total-users');
    const totalOrdersElem = document.getElementById('total-orders');
    const productSearch = document.getElementById('product-search');
    const userSearch = document.getElementById('user-search');
    const blogSearch = document.getElementById('blog-search');

    let allProducts = [];
    let allUsers = [];
    let allBlogPosts = [];
    let allOrders = [];

    // Modal Elements
    const productModal = document.getElementById('product-modal');
    const closeModalBtn = productModal.querySelector('.close-btn');
    const modalTitle = document.getElementById('modal-title');
    const productForm = document.getElementById('product-form');
    const productIdInput = document.getElementById('product-id');
    const productNameInput = document.getElementById('product-name');
    const productCategoryInput = document.getElementById('product-category');
    const productPriceInput = document.getElementById('product-price');
    const productImageInput = document.getElementById('product-image');
    const productStarsInput = document.getElementById('product-stars');
    const productDescriptionInput = document.getElementById('product-description');

    // Blog Post Modal Elements
    const blogPostModal = document.getElementById('blog-post-modal');
    const closeBlogPostModalBtn = blogPostModal.querySelector('.close-btn');
    const blogModalTitle = document.getElementById('blog-modal-title');
    const blogPostForm = document.getElementById('blog-post-form');
    const blogPostIdInput = document.getElementById('blog-post-id');
    const blogPostTitleInput = document.getElementById('blog-post-title');
    const blogPostAuthorInput = document.getElementById('blog-post-author');
    const blogPostDateInput = document.getElementById('blog-post-date');
    const blogPostImageInput = document.getElementById('blog-post-image');
    const blogPostContentInput = document.getElementById('blog-post-content');

    // Open Modal Function
    function openProductModal(product = null) {
        productModal.style.display = 'block';
        if (product) {
            modalTitle.textContent = 'Edit Product';
            productIdInput.value = product.id;
            productNameInput.value = product.name;
            productCategoryInput.value = product.category;
            productPriceInput.value = product.price;
            productImageInput.value = product.image;
            productStarsInput.value = product.stars;
            productDescriptionInput.value = product.description;
        } else {
            modalTitle.textContent = 'Add Product';
            productForm.reset();
            productIdInput.value = '';
        }
    }

    // Close Modal Function
    function closeProductModal() {
        productModal.style.display = 'none';
    }

    // Open Blog Post Modal Function
    function openBlogPostModal(post = null) {
        blogPostModal.style.display = 'block';
        if (post) {
            blogModalTitle.textContent = 'Edit Blog Post';
            blogPostIdInput.value = post.id;
            blogPostTitleInput.value = post.title;
            blogPostAuthorInput.value = post.author;
            blogPostDateInput.value = post.date;
            blogPostImageInput.value = post.image;
            blogPostContentInput.value = post.content;
        } else {
            blogModalTitle.textContent = 'Add Blog Post';
            blogPostForm.reset();
            blogPostIdInput.value = '';
        }
    }

    // Close Blog Post Modal Function
    function closeBlogPostModal() {
        blogPostModal.style.display = 'none';
    }

    // Event Listeners for Modal
    closeModalBtn.addEventListener('click', closeProductModal);
    window.addEventListener('click', (event) => {
        if (event.target == productModal) {
            closeProductModal();
        }
    });

    // Event Listeners for Blog Post Modal
    closeBlogPostModalBtn.addEventListener('click', closeBlogPostModal);
    window.addEventListener('click', (event) => {
        if (event.target == blogPostModal) {
            closeBlogPostModal();
        }
    });

    // Add Product Button Event Listener
    addProductBtn.addEventListener('click', () => openProductModal());

    // Add Blog Post Button Event Listener
    addBlogPostBtn.addEventListener('click', () => openBlogPostModal());

    // Product Form Submission
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = productIdInput.value;
        const name = productNameInput.value;
        const category = productCategoryInput.value;
        const price = parseFloat(productPriceInput.value);
        const image = productImageInput.value;
        const stars = parseInt(productStarsInput.value);
        const description = productDescriptionInput.value;

        if (stars < 1 || stars > 5) {
            alert('Stars must be between 1 and 5.');
            return;
        }

        const productData = { name, category, price, image, stars, description };
        const token = localStorage.getItem('jwtToken');

        try {
            let response;
            if (id) { // Edit existing product
                response = await fetch(`/api/products/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(productData)
                });
            } else { // Add new product
                response = await fetch('/api/products', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(productData)
                });
            }

            if (response.ok) {
                alert(`Product ${id ? 'updated' : 'added'} successfully!`);
                closeProductModal();
                fetchProducts();
                fetchMetrics();
            } else {
                const errorData = await response.json();
                alert(`Failed to ${id ? 'update' : 'add'} product: ${errorData.message}`);
            }
        } catch (error) {
            console.error(`Error ${id ? 'updating' : 'adding'} product:`, error);
            alert(`An error occurred while ${id ? 'updating' : 'adding'} the product.`);
        }
    });

    // Blog Post Form Submission
    blogPostForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = blogPostIdInput.value;
        const title = blogPostTitleInput.value;
        const author = blogPostAuthorInput.value;
        const date = blogPostDateInput.value;
        const image = blogPostImageInput.value;
        const content = blogPostContentInput.value;

        const blogPostData = { title, author, date, image, content };
        const token = localStorage.getItem('jwtToken');

        try {
            let response;
            if (id) { // Edit existing blog post
                response = await fetch(`/api/blogs/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(blogPostData)
                });
            } else { // Add new blog post
                response = await fetch('/api/blogs', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(blogPostData)
                });
            }

            if (response.ok) {
                alert(`Blog post ${id ? 'updated' : 'added'} successfully!`);
                closeBlogPostModal();
                fetchBlogPosts();
            } else {
                const errorData = await response.json();
                alert(`Failed to ${id ? 'update' : 'add'} blog post: ${errorData.message}`);
            }
        } catch (error) {
            console.error(`Error ${id ? 'updating' : 'adding'} blog post:`, error);
            alert(`An error occurred while ${id ? 'updating' : 'adding'} the blog post.`);
        }
    });

    // Function to fetch and display products
    async function fetchProducts() {
        try {
            const response = await fetch('/api/products');
            allProducts = await response.json();
            renderProducts(allProducts);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    }

    // Function to render products
    function renderProducts(products) {
        productTableBody.innerHTML = '';
        products.forEach(product => {
            const row = `
                <tr>
                    <td>${product.id}</td>
                    <td><img src="${product.image}" alt="${product.name}"></td>
                    <td>${product.name}</td>
                    <td>${product.category}</td>
                    <td>$${product.price.toFixed(2)}</td>
                    <td>${product.stars}</td>
                    <td>${product.description}</td>
                    <td>
                        <button class="normal edit-product-btn" data-id="${product.id}">Edit</button>
                        <button class="normal delete-product-btn" data-id="${product.id}">Delete</button>
                    </td>
                </tr>
            `;
            productTableBody.innerHTML += row;
        });
        attachProductEventListeners();
    }

    // Function to fetch and display users
    async function fetchUsers() {
        try {
            const token = localStorage.getItem('jwtToken');
            const response = await fetch('/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            allUsers = await response.json();
            renderUsers(allUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    }

    // Function to render users
    function renderUsers(users) {
        userTableBody.innerHTML = '';
        users.forEach(user => {
            const row = `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>
                        <button class="normal delete-user-btn" data-id="${user.id}">Delete</button>
                    </td>
                </tr>
            `;
            userTableBody.innerHTML += row;
        });
        attachUserEventListeners();
    }

    // Function to fetch and display blog posts
    async function fetchBlogPosts() {
        try {
            const response = await fetch('/api/blogs');
            allBlogPosts = await response.json();
            renderBlogPosts(allBlogPosts);
        } catch (error) {
            console.error('Error fetching blog posts:', error);
        }
    }

    // Function to fetch and display orders
    async function fetchOrders() {
        try {
            const token = localStorage.getItem('jwtToken');
            const response = await fetch('/api/orders', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                allOrders = await response.json();
                renderOrders(allOrders);
            } else {
                console.error('Failed to fetch orders:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    }

    // Function to render orders
    function renderOrders(orders) {
        orderTableBody.innerHTML = '';
        orders.forEach(order => {
            const itemsList = order.items.map(item => `${item.name} (x${item.quantity})`).join(', ');
            const totalAmount = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
            const row = `
                <tr>
                    <td>${order.userId}</td>
                    <td>${order.userId}</td>
                    <td>${itemsList}</td>
                    <td>${totalAmount}</td>
                    <td>${order.status || 'Pending'}</td>
                    <td>
                        <button class="normal update-order-status-btn" data-id="${order.userId}">Update Status</button>
                    </td>
                </tr>
            `;
            orderTableBody.innerHTML += row;
        });
        attachOrderEventListeners();
    }

    // Function to render blog posts
    function renderBlogPosts(posts) {
        blogTableBody.innerHTML = '';
        posts.forEach(post => {
            const row = `
                <tr>
                    <td>${post.id}</td>
                    <td><img src="${post.image}" alt="${post.title}"></td>
                    <td>${post.title}</td>
                    <td>${post.author}</td>
                    <td>${post.date}</td>
                    <td>${post.content.substring(0, 100)}...</td>
                    <td>
                        <button class="normal edit-blog-btn" data-id="${post.id}">Edit</button>
                        <button class="normal delete-blog-btn" data-id="${post.id}">Delete</button>
                    </td>
                </tr>
            `;
            blogTableBody.innerHTML += row;
        });
        attachBlogEventListeners();
    }

    // Function to fetch and display dashboard metrics
    async function fetchMetrics() {
        try {
            const productsResponse = await fetch('/api/products');
            const products = await productsResponse.json();
            totalProductsElem.textContent = products.length;

            const token = localStorage.getItem('jwtToken');
            const usersResponse = await fetch('/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const users = await usersResponse.json();
            totalUsersElem.textContent = users.length;

            // Assuming an endpoint to get all orders exists
            const ordersResponse = await fetch('/api/orders', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (ordersResponse.ok) {
                const orders = await ordersResponse.json();
                totalOrdersElem.textContent = orders.length;
            } else {
                totalOrdersElem.textContent = 'N/A';
            }
        } catch (error) {
            console.error('Error fetching metrics:', error);
        }
    }

    // Event Listeners for Products (modified to open modal for edit)
    function attachProductEventListeners() {
        document.querySelectorAll('.edit-product-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const productId = e.target.dataset.id;
                try {
                    const response = await fetch(`/api/products/${productId}`);
                    const product = await response.json();
                    openProductModal(product);
                } catch (error) {
                    console.error('Error fetching product for edit:', error);
                    alert('An error occurred while fetching product details.');
                }
            });
        });

        document.querySelectorAll('.delete-product-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const productId = e.target.dataset.id;
                if (confirm(`Are you sure you want to delete product ${productId}?`)) {
                    try {
                        const token = localStorage.getItem('jwtToken');
                        const response = await fetch(`/api/products/${productId}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        if (response.ok) {
                            alert('Product deleted successfully!');
                            fetchProducts(); // Refresh the list
                            fetchMetrics();
                        } else {
                            const errorData = await response.json();
                            alert(`Failed to delete product: ${errorData.message}`);
                        }
                    } catch (error) {
                        console.error('Error deleting product:', error);
                        alert('An error occurred while deleting the product.');
                    }
                }
            });
        });
    }

    // Event Listeners for Users
    function attachUserEventListeners() {
        document.querySelectorAll('.delete-user-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const userId = e.target.dataset.id;
                if (confirm(`Are you sure you want to delete user ${userId}?`)) {
                    try {
                        const token = localStorage.getItem('jwtToken');
                        const response = await fetch(`/api/users/${userId}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        if (response.ok) {
                            alert('User deleted successfully!');
                            fetchUsers(); // Refresh the list
                            fetchMetrics();
                        } else {
                            const errorData = await response.json();
                            alert(`Failed to delete user: ${errorData.message}`);
                        }
                    } catch (error) {
                        console.error('Error deleting user:', error);
                        alert('An error occurred while deleting the user.');
                    }
                }
            });
        });
    }

    // Event Listeners for Blog Posts
    function attachBlogEventListeners() {
        document.querySelectorAll('.edit-blog-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const postId = e.target.dataset.id;
                try {
                    const response = await fetch(`/api/blogs/${postId}`);
                    const post = await response.json();
                    openBlogPostModal(post);
                } catch (error) {
                    console.error('Error fetching blog post for edit:', error);
                    alert('An error occurred while fetching blog post details.');
                }
            });
        });

        document.querySelectorAll('.delete-blog-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const postId = e.target.dataset.id;
                if (confirm(`Are you sure you want to delete blog post ${postId}?`)) {
                    try {
                        const token = localStorage.getItem('jwtToken');
                        const response = await fetch(`/api/blogs/${postId}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        if (response.ok) {
                            alert('Blog post deleted successfully!');
                            fetchBlogPosts(); // Refresh the list
                        } else {
                            const errorData = await response.json();
                            alert(`Failed to delete blog post: ${errorData.message}`);
                        }
                    } catch (error) {
                        console.error('Error deleting blog post:', error);
                        alert('An error occurred while deleting the blog post.');
                    }
                }
            });
        });
    }

    // Event Listeners for Orders
    function attachOrderEventListeners() {
        document.querySelectorAll('.update-order-status-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const orderId = e.target.dataset.id;
                const newStatus = prompt('Enter new order status (e.g., Pending, Shipped, Delivered):');
                if (newStatus) {
                    try {
                        const token = localStorage.getItem('jwtToken');
                        const response = await fetch(`/api/orders/${orderId}/status`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ status: newStatus })
                        });
                        if (response.ok) {
                            alert('Order status updated successfully!');
                            fetchOrders();
                        } else {
                            const errorData = await response.json();
                            alert(`Failed to update order status: ${errorData.message}`);
                        }
                    } catch (error) {
                        console.error('Error updating order status:', error);
                        alert('An error occurred while updating the order status.');
                    }
                }
            });
        });
    }

    // Initial data load
    fetchMetrics();
    fetchProducts();
    fetchUsers();
    fetchBlogPosts();
    fetchOrders();

    // Search and Filter Event Listeners
    productSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredProducts = allProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );
        renderProducts(filteredProducts);
    });

    userSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredUsers = allUsers.filter(user =>
            user.name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm)
        );
        renderUsers(filteredUsers);
    });

    blogSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredBlogPosts = allBlogPosts.filter(post =>
            post.title.toLowerCase().includes(searchTerm) ||
            post.author.toLowerCase().includes(searchTerm) ||
            post.content.toLowerCase().includes(searchTerm)
        );
        renderBlogPosts(filteredBlogPosts);
    });
});