const express = require('express');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Helper function to read JSON files
async function readJsonFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    // File does not exist, return empty array
                    return resolve([]);
                }
                return reject(err);
            }
            resolve(JSON.parse(data));
        });
    });
}

// Helper function to write JSON files
async function writeJsonFile(filePath, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8', (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
}
const JWT_SECRET = 'your_jwt_secret_key'; // Use a strong, unique key in production

// Middleware to authenticate token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401); // No token

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Invalid token
        req.user = user;
        next();
    });
}

// Middleware to authenticate admin token
function authenticateAdminToken(req, res, next) {
    authenticateToken(req, res, () => {
        if (req.user && req.user.isAdmin) {
            next();
        } else {
            res.status(403).json({ message: 'Access denied: Admins only.' });
        }
    });
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'hexashop')));

const blogsFilePath = path.join(__dirname, 'hexashop', 'json', 'blog.json');

// Get all blog posts
app.get('/api/blogs', async (req, res) => {
    try {
        const blogs = await readJsonFile(blogsFilePath);
        res.json(blogs);
    } catch (error) {
        console.error('Error reading blog data:', error);
        res.status(500).json({ message: 'Error reading blog data.' });
    }
});

// Add a new blog post
app.post('/api/blogs', async (req, res) => {
    try {
        const blogs = await readJsonFile(blogsFilePath);
        const newBlog = { id: blogs.length > 0 ? Math.max(...blogs.map(b => b.id)) + 1 : 1, ...req.body };
        blogs.push(newBlog);
        await writeJsonFile(blogsFilePath, blogs);
        res.status(201).json(newBlog);
    } catch (error) {
        console.error('Error writing blog data:', error);
        res.status(500).json({ message: 'Error writing blog data.' });
    }
});

// Update a blog post
app.put('/api/blogs/:id', async (req, res) => {
    try {
        let blogs = await readJsonFile(blogsFilePath);
        const blogId = parseInt(req.params.id);
        const blogIndex = blogs.findIndex(b => b.id === blogId);

        if (blogIndex === -1) {
            return res.status(404).json({ message: 'Blog post not found.' });
        }

        blogs[blogIndex] = { ...blogs[blogIndex], ...req.body, id: blogId };

        await writeJsonFile(blogsFilePath, blogs);
        res.json(blogs[blogIndex]);
    } catch (error) {
        console.error('Error writing blog data:', error);
        res.status(500).json({ message: 'Error writing blog data.' });
    }
});

// Delete a blog post
app.delete('/api/blogs/:id', async (req, res) => {
    try {
        let blogs = await readJsonFile(blogsFilePath);
        const blogId = parseInt(req.params.id);
        const initialLength = blogs.length;
        blogs = blogs.filter(b => b.id !== blogId);

        if (blogs.length === initialLength) {
            return res.status(404).json({ message: 'Blog post not found.' });
        }

        await writeJsonFile(blogsFilePath, blogs);
        res.status(204).send(); // No content
    } catch (error) {
        console.error('Error deleting blog post:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Route for admin.html with authentication
app.get('/admin.html', authenticateAdminToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'hexashop', 'admin.html'));
});

// Basic route for the home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'hexashop', 'index.html'));
});

// User Registration
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    const usersFilePath = path.join(__dirname, 'hexashop', 'json', 'users.json');

    try {
        const users = await readJsonFile(usersFilePath);

        // Check if user already exists
        if (users.find(user => user.email === email)) {
            return res.status(400).json({ message: 'User with that email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { id: Date.now().toString(), name, email, password: hashedPassword };
        users.push(newUser);
        await writeJsonFile(usersFilePath, users);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Unified Login for Users and Admins
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);
    console.log('Password received:', password);

    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    const usersFilePath = path.join(__dirname, 'hexashop', 'json', 'users.json');
    const adminsFilePath = path.join(__dirname, 'hexashop', 'json', 'admins.json');

    try {
        const users = await readJsonFile(usersFilePath);
        const admins = await readJsonFile(adminsFilePath);

        // Try to find in users
        const user = users.find(u => u.email === email);
        if (user) {
            console.log('User found:', user.email);
            const isMatch = await bcrypt.compare(password, user.password);
            console.log('User password match:', isMatch);
            if (isMatch) {
                const token = jwt.sign({ id: user.id, email: user.email, isAdmin: false }, JWT_SECRET, { expiresIn: '1h' });
                return res.json({ token, message: 'Logged in successfully', isAdmin: false });
            }
        }

        // If not a user, try to find in admins
        const admin = admins.find(a => a.email === email);
        if (admin) {
            console.log('Admin found:', admin.email);
            const isMatch = await bcrypt.compare(password, admin.password);
            console.log('Admin password match:', isMatch);
            if (isMatch) {
                const token = jwt.sign({ id: admin.id, email: admin.email, isAdmin: true }, JWT_SECRET, { expiresIn: '1h' });
                return res.json({ token, message: 'Admin logged in successfully', isAdmin: true });
            }
        }

        // If neither user nor admin, or password mismatch
        console.log('Invalid credentials for:', email);
        return res.status(400).json({ message: 'Invalid credentials' });

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// API route to get all products
app.get('/api/products', async (req, res) => {
    const productsFilePath = path.join(__dirname, 'hexashop', 'json', 'products.json');
    const { category, search } = req.query;

    try {
        let products = await readJsonFile(productsFilePath);

        if (category) {
            products = products.filter(product => product.category.toLowerCase() === category.toLowerCase());
        }

        if (search) {
            const searchTerm = search.toLowerCase();
            products = products.filter(product => 
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm)
            );
        }

        res.json(products);
    } catch (error) {
        console.error('Error reading products.json:', error);
        res.status(500).json({ message: 'Error reading product data.' });
    }
});

// API route to get a single product by ID
app.get('/api/products/:id', async (req, res) => {
    const productsFilePath = path.join(__dirname, 'hexashop', 'json', 'products.json');
    try {
        const products = await readJsonFile(productsFilePath);
        const product = products.find(p => p.id === req.params.id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error('Error reading product:', error);
        res.status(500).json({ message: 'Error reading product data.' });
    }
});

// API route to add a new product (Admin only)
app.post('/api/products', authenticateAdminToken, async (req, res) => {
    const productsFilePath = path.join(__dirname, 'hexashop', 'json', 'products.json');
    const { name, category, price, image, stars, description } = req.body;

    if (!name || !category || !price || !image || !stars || !description) {
        return res.status(400).json({ message: 'Please provide all product details.' });
    }

    try {
        const products = await readJsonFile(productsFilePath);
        const newProduct = { id: Date.now().toString(), name, category, price, image, stars, description };
        products.push(newProduct);
        await writeJsonFile(productsFilePath, products);
        res.status(201).json({ message: 'Product added successfully', product: newProduct });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// API route to update a product (Admin only)
app.put('/api/products/:id', authenticateAdminToken, async (req, res) => {
    const productsFilePath = path.join(__dirname, 'hexashop', 'json', 'products.json');
    const productId = req.params.id;
    const updatedProductData = req.body;

    try {
        let products = await readJsonFile(productsFilePath);
        const productIndex = products.findIndex(p => p.id === productId);

        if (productIndex === -1) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Validate incoming data (optional, but good practice)
        const { name, category, price, image, stars, description } = updatedProductData;
        if (!name || !category || !price || !image || !stars || !description) {
            return res.status(400).json({ message: 'Please provide all product details for update.' });
        }

        products[productIndex] = { ...products[productIndex], ...updatedProductData };
        await writeJsonFile(productsFilePath, products);
        res.json({ message: 'Product updated successfully', product: products[productIndex] });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// API route to delete a product (Admin only)
app.delete('/api/products/:id', authenticateAdminToken, async (req, res) => {
    const productsFilePath = path.join(__dirname, 'hexashop', 'json', 'products.json');
    const productId = req.params.id;

    try {
        let products = await readJsonFile(productsFilePath);
        const initialLength = products.length;
        products = products.filter(p => p.id !== productId);

        if (products.length === initialLength) {
            return res.status(404).json({ message: 'Product not found' });
        }

        await writeJsonFile(productsFilePath, products);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// API route to get all blog posts
app.get('/api/blog', async (req, res) => {
    const blogFilePath = path.join(__dirname, 'hexashop', 'json', 'blog.json');
    try {
        const blogPosts = await readJsonFile(blogFilePath);
        res.json(blogPosts);
    } catch (error) {
        console.error('Error reading blog.json:', error);
        res.status(500).json({ message: 'Error reading blog data.' });
    }
});

// API route to add a new blog post (Admin only)
app.post('/api/blog', authenticateAdminToken, async (req, res) => {
    const blogFilePath = path.join(__dirname, 'hexashop', 'json', 'blog.json');
    const { title, author, date, image, content } = req.body;

    if (!title || !author || !date || !image || !content) {
        return res.status(400).json({ message: 'Please provide all blog post details.' });
    }

    try {
        const blogPosts = await readJsonFile(blogFilePath);
        const newPost = { id: Date.now().toString(), title, author, date, image, content };
        blogPosts.push(newPost);
        await writeJsonFile(blogFilePath, blogPosts);
        res.status(201).json({ message: 'Blog post added successfully', post: newPost });
    } catch (error) {
        console.error('Error adding blog post:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// API route to update a blog post (Admin only)
app.put('/api/blog/:id', authenticateAdminToken, async (req, res) => {
    const blogFilePath = path.join(__dirname, 'hexashop', 'json', 'blog.json');
    const postId = req.params.id;
    const updatedPostData = req.body;

    try {
        let blogPosts = await readJsonFile(blogFilePath);
        const postIndex = blogPosts.findIndex(p => p.id === postId);

        if (postIndex === -1) {
            return res.status(404).json({ message: 'Blog post not found' });
        }

        const { title, author, date, image, content } = updatedPostData;
        if (!title || !author || !date || !image || !content) {
            return res.status(400).json({ message: 'Please provide all blog post details for update.' });
        }

        blogPosts[postIndex] = { ...blogPosts[postIndex], ...updatedPostData };
        await writeJsonFile(blogFilePath, blogPosts);
        res.json({ message: 'Blog post updated successfully', post: blogPosts[postIndex] });
    } catch (error) {
        console.error('Error updating blog post:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// API route to delete a blog post (Admin only)
app.delete('/api/blog/:id', authenticateAdminToken, async (req, res) => {
    const blogFilePath = path.join(__dirname, 'hexashop', 'json', 'blog.json');
    const postId = req.params.id;

    try {
        let blogPosts = await readJsonFile(blogFilePath);
        const initialLength = blogPosts.length;
        blogPosts = blogPosts.filter(p => p.id !== postId);

        if (blogPosts.length === initialLength) {
            return res.status(404).json({ message: 'Blog post not found' });
        }

        await writeJsonFile(blogFilePath, blogPosts);
        res.json({ message: 'Blog post deleted successfully' });
    } catch (error) {
        console.error('Error deleting blog post:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Cart API routes
const cartsFilePath = path.join(__dirname, 'hexashop', 'json', 'cart.json');

// Get user's cart
app.get('/api/cart', authenticateToken, async (req, res) => {
    try {
        const carts = await readJsonFile(cartsFilePath);
        const userCart = carts.find(cart => cart.userId === req.user.id) || { userId: req.user.id, items: [] };
        res.json(userCart.items);
    } catch (error) {
        console.error('Error getting cart:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add item to cart or update quantity
app.post('/api/cart', authenticateToken, async (req, res) => {
    const { productId, name, price, image, quantity, size } = req.body;

    if (!productId || !name || !price || !image || !quantity || !size) {
        return res.status(400).json({ message: 'Missing cart item details' });
    }

    try {
        let carts = await readJsonFile(cartsFilePath);
        let userCart = carts.find(cart => cart.userId === req.user.id);

        if (!userCart) {
            userCart = { userId: req.user.id, items: [] };
            carts.push(userCart);
        }

        const existingItemIndex = userCart.items.findIndex(item => item.productId === productId && item.size === size);

        if (existingItemIndex > -1) {
            userCart.items[existingItemIndex].quantity += quantity;
        } else {
            userCart.items.push({ productId, name, price, image, quantity, size });
        }

        await writeJsonFile(cartsFilePath, carts);
        res.status(200).json({ message: 'Item added to cart successfully', cart: userCart.items });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update item quantity in cart
app.put('/api/cart/:productId', authenticateToken, async (req, res) => {
    const { productId } = req.params;
    const { quantity, size } = req.body;

    if (quantity === undefined || !size) {
        return res.status(400).json({ message: 'Missing quantity or size for cart update' });
    }

    try {
        let carts = await readJsonFile(cartsFilePath);
        let userCart = carts.find(cart => cart.userId === req.user.id);

        if (!userCart) {
            return res.status(404).json({ message: 'Cart not found for user' });
        }

        const itemIndex = userCart.items.findIndex(item => item.productId === productId && item.size === size);

        if (itemIndex > -1) {
            if (quantity <= 0) {
                userCart.items.splice(itemIndex, 1); // Remove item if quantity is 0 or less
            } else {
                userCart.items[itemIndex].quantity = quantity;
            }
            await writeJsonFile(cartsFilePath, carts);
            res.status(200).json({ message: 'Cart updated successfully', cart: userCart.items });
        } else {
            res.status(404).json({ message: 'Item not found in cart' });
        }
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Remove item from cart
app.delete('/api/cart/:productId', authenticateToken, async (req, res) => {
    const { productId } = req.params;
    const { size } = req.body || {}; // Safely destructure size

    if (!size) {
        return res.status(400).json({ message: 'Missing size for cart item deletion' });
    }

    try {
        let carts = await readJsonFile(cartsFilePath);
        let userCart = carts.find(cart => cart.userId === req.user.id);

        if (!userCart) {
            return res.status(404).json({ message: 'Cart not found for user' });
        }

        const initialLength = userCart.items.length;
        userCart.items = userCart.items.filter(item => !(item.productId === productId && item.size === size));

        if (userCart.items.length === initialLength) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        await writeJsonFile(cartsFilePath, carts);
        res.status(200).json({ message: 'Item removed from cart successfully', cart: userCart.items });
    } catch (error) {
        console.error('Error removing cart item:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// API route to get all users (Admin only)
app.get('/api/users', authenticateAdminToken, async (req, res) => {
    const usersFilePath = path.join(__dirname, 'hexashop', 'json', 'users.json');
    try {
        const users = await readJsonFile(usersFilePath);
        // Exclude passwords from the response
        const usersWithoutPasswords = users.map(({ password, ...rest }) => rest);
        res.json(usersWithoutPasswords);
    } catch (error) {
        console.error('Error reading users.json:', error);
        res.status(500).json({ message: 'Error reading user data.' });
    }
});

// API route to get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
    const usersFilePath = path.join(__dirname, 'hexashop', 'json', 'users.json');
    try {
        const users = await readJsonFile(usersFilePath);
        const user = users.find(u => u.id === req.user.id);
        if (user) {
            const { password, ...userWithoutPassword } = user;
            res.json(userWithoutPassword);
        } else {
            res.status(404).json({ message: 'User not found.' });
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// API route to update user profile
app.put('/api/profile', authenticateToken, async (req, res) => {
    const usersFilePath = path.join(__dirname, 'hexashop', 'json', 'users.json');
    const { name, email, oldPassword, newPassword } = req.body;

    try {
        let users = await readJsonFile(usersFilePath);
        const userIndex = users.findIndex(u => u.id === req.user.id);

        if (userIndex === -1) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const user = users[userIndex];

        // Update name and email
        if (name) user.name = name;
        if (email) user.email = email;

        // Update password if newPassword is provided
        if (newPassword) {
            user.password = await bcrypt.hash(newPassword, 10);
        }

        users[userIndex] = user;
        await writeJsonFile(usersFilePath, users);

        const { password, ...userWithoutPassword } = user;
        res.json({ message: 'Profile updated successfully.', user: userWithoutPassword });

    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// API route to place an order
app.post('/api/place-order', authenticateToken, async (req, res) => {
    const ordersFilePath = path.join(__dirname, 'hexashop', 'json', 'orders.json');
    const cartsFilePath = path.join(__dirname, 'hexashop', 'json', 'cart.json');
    const { shippingInfo, paymentInfo, items, totalAmount, orderDate } = req.body;

    if (!shippingInfo || !paymentInfo || !items || !totalAmount || !orderDate) {
        return res.status(400).json({ message: 'Missing order details.' });
    }

    try {
        const orders = await readJsonFile(ordersFilePath);
        const newOrder = { 
            id: Date.now().toString(), 
            userId: req.user.id, 
            shippingInfo, 
            paymentInfo, 
            items, 
            totalAmount, 
            orderDate, 
            status: 'Pending' 
        };
        orders.push(newOrder);
        await writeJsonFile(ordersFilePath, orders);

        // Clear the user's cart after placing the order
        let carts = await readJsonFile(cartsFilePath);
        carts = carts.filter(cart => cart.userId !== req.user.id);
        await writeJsonFile(cartsFilePath, carts);

        res.status(201).json({ message: 'Order placed successfully!', order: newOrder });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// API route to clear user's cart
app.delete('/api/cart/clear', authenticateToken, async (req, res) => {
    const cartsFilePath = path.join(__dirname, 'hexashop', 'json', 'cart.json');
    try {
        let carts = await readJsonFile(cartsFilePath);
        carts = carts.filter(cart => cart.userId !== req.user.id);
        await writeJsonFile(cartsFilePath, carts);
        res.status(200).json({ message: 'Cart cleared successfully!' });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// API route to get all orders (Admin only)
app.get('/api/orders', authenticateAdminToken, async (req, res) => {
    const ordersFilePath = path.join(__dirname, 'hexashop', 'json', 'orders.json');
    try {
        const orders = await readJsonFile(ordersFilePath);
        res.json(orders);
    } catch (error) {
        console.error('Error reading orders.json:', error);
        res.status(500).json({ message: 'Error reading order data.' });
    }
});

// API route to get user's order history
app.get('/api/orders/history', authenticateToken, async (req, res) => {
    const ordersFilePath = path.join(__dirname, 'hexashop', 'json', 'orders.json');
    try {
        const allOrders = await readJsonFile(ordersFilePath);
        const userOrders = allOrders.filter(order => order.userId === req.user.id);
        res.json(userOrders);
    } catch (error) {
        console.error('Error fetching user order history:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// API route to delete a user (Admin only)
app.delete('/api/users/:id', authenticateAdminToken, async (req, res) => {
    const usersFilePath = path.join(__dirname, 'hexashop', 'json', 'users.json');
    const userId = req.params.id;

    try {
        let users = await readJsonFile(usersFilePath);
        const initialLength = users.length;
        users = users.filter(user => user.id !== userId);

        if (users.length === initialLength) {
            return res.status(404).json({ message: 'User not found' });
        }

        await writeJsonFile(usersFilePath, users);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// API route to update order status (Admin only)
app.put('/api/orders/:id/status', authenticateAdminToken, async (req, res) => {
    const ordersFilePath = path.join(__dirname, 'hexashop', 'json', 'orders.json');
    const orderId = req.params.id;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: 'Status is required.' });
    }

    try {
        let orders = await readJsonFile(ordersFilePath);
        const orderIndex = orders.findIndex(order => order.id === orderId);

        if (orderIndex === -1) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        orders[orderIndex].status = status;
        await writeJsonFile(ordersFilePath, orders);
        res.json({ message: 'Order status updated successfully.', order: orders[orderIndex] });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// API route to get reviews for a product
app.get('/api/products/:productId/reviews', async (req, res) => {
    const reviewsFilePath = path.join(__dirname, 'hexashop', 'json', 'reviews.json');
    const productId = req.params.productId;
    try {
        const reviews = await readJsonFile(reviewsFilePath);
        const productReviews = reviews.filter(review => review.productId === productId);
        res.json(productReviews);
    } catch (error) {
        console.error('Error reading reviews.json:', error);
        res.status(500).json({ message: 'Error reading reviews data.' });
    }
});

// API route to submit a review for a product
app.post('/api/products/:productId/reviews', authenticateToken, async (req, res) => {
    const reviewsFilePath = path.join(__dirname, 'hexashop', 'json', 'reviews.json');
    const productId = req.params.productId;
    const { rating, comment } = req.body;

    if (!rating || !comment) {
        return res.status(400).json({ message: 'Rating and comment are required.' });
    }

    try {
        const reviews = await readJsonFile(reviewsFilePath);
        const newReview = {
            id: Date.now().toString(),
            productId,
            userId: req.user.id,
            userName: req.user.name, // Assuming user name is available in token
            rating: parseInt(rating),
            comment,
            date: new Date().toISOString()
        };
        reviews.push(newReview);
        await writeJsonFile(reviewsFilePath, reviews);
        res.status(201).json({ message: 'Review submitted successfully!', review: newReview });
    } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Wishlist API routes
const wishlistsFilePath = path.join(__dirname, 'hexashop', 'json', 'wishlist.json');

// Get user's wishlist
app.get('/api/wishlist', authenticateToken, async (req, res) => {
    try {
        const wishlists = await readJsonFile(wishlistsFilePath);
        const userWishlist = wishlists.find(list => list.userId === req.user.id) || { userId: req.user.id, items: [] };
        res.json(userWishlist.items);
    } catch (error) {
        console.error('Error getting wishlist:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add or remove item from wishlist
app.post('/api/wishlist', authenticateToken, async (req, res) => {
    const { productId } = req.body;

    if (!productId) {
        return res.status(400).json({ message: 'Product ID is required.' });
    }

    try {
        let wishlists = await readJsonFile(wishlistsFilePath);
        let userWishlist = wishlists.find(list => list.userId === req.user.id);

        if (!userWishlist) {
            userWishlist = { userId: req.user.id, items: [] };
            wishlists.push(userWishlist);
        }

        const itemIndex = userWishlist.items.indexOf(productId);

        if (itemIndex > -1) {
            userWishlist.items.splice(itemIndex, 1); // Remove if already in wishlist
            await writeJsonFile(wishlistsFilePath, wishlists);
            res.status(200).json({ message: 'Product removed from wishlist.', inWishlist: false });
        } else {
            userWishlist.items.push(productId); // Add if not in wishlist
            await writeJsonFile(wishlistsFilePath, wishlists);
            res.status(200).json({ message: 'Product added to wishlist.', inWishlist: true });
        }
    } catch (error) {
        console.error('Error updating wishlist:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
