/**
 * Expert Store JavaScript
 * This file handles the store functionality, with authentication enforcement
 */

// Initialize the store
function initStore() {
    // Check if user is logged in using our auth system
    if (!isLoggedIn()) {
        // Redirect to login with return URL
        window.location.href = '/login.html?redirect=store.html';
        return;
    }

    // Get user data
    const userData = getCurrentUser();
    console.log('Store initialized for user:', userData.username);

    // Update UI with user data
    updateStoreUI(userData);

    // Load products
    loadProducts();

    // Setup event listeners
    setupEventListeners();
}

/**
 * Update the store UI with user data
 * @param {Object} userData - User data from getCurrentUser()
 */
function updateStoreUI(userData) {
    // Update username in navigation
    const usernameElement = document.querySelector('.username');
    if (usernameElement) {
        usernameElement.textContent = userData.username;
    }

    // Update profile image if available
    const profileImage = document.querySelector('.nav-profile-image');
    if (profileImage && userData.profilePicture) {
        profileImage.src = userData.profilePicture;
    }
}

/**
 * Load products from mock data
 * In a real app, this would fetch from the server
 */
function loadProducts() {
    const productsContainer = document.querySelector('.products-grid');
    if (!productsContainer) return;

    // Clear any existing products
    productsContainer.innerHTML = '';

    // Mock products data
    const products = [
        {
            id: 'prod1',
            name: 'Expert Consultation',
            price: 99.99,
            image: '/uploads/default-avatar.png',
            category: 'consulting',
            description: 'One-on-one consultation with industry experts to solve your specific problems.'
        },
        {
            id: 'prod2',
            name: 'Technology Assessment',
            price: 149.99,
            image: '/uploads/default-avatar.png',
            category: 'assessment',
            description: 'Comprehensive assessment of your technology stack with detailed recommendations.'
        },
        {
            id: 'prod3',
            name: 'Strategy Workshop',
            price: 299.99,
            image: '/uploads/default-avatar.png',
            category: 'workshop',
            description: 'Interactive strategy workshop to define your business roadmap.'
        }
    ];

    // Add products to the container
    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product-card';
        productElement.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-details">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <div class="product-actions">
                    <button class="add-to-cart-btn" data-product-id="${product.id}">
                        Add to Cart
                    </button>
                    <button class="view-details-btn" data-product-id="${product.id}">
                        View Details
                    </button>
                </div>
            </div>
        `;

        productsContainer.appendChild(productElement);
    });

    // Add event listeners to buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-product-id');
            addToCart(productId);
        });
    });

    document.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-product-id');
            viewProductDetails(productId);
        });
    });
}

/**
 * Add a product to cart
 * @param {string} productId - Product ID
 */
function addToCart(productId) {
    // In a real app, this would interact with a cart API
    // For this demo, we'll just show a toast notification
    console.log('Adding product to cart:', productId);

    // Show toast notification
    showToast('Product added to cart!', 'success');

    // Update cart count in the header
    updateCartCount(1);
}

/**
 * View product details
 * @param {string} productId - Product ID
 */
function viewProductDetails(productId) {
    // In a real app, this would navigate to a product details page
    // For this demo, we'll just log and redirect
    console.log('Viewing product details:', productId);
    window.location.href = `product-detail.html?id=${productId}`;
}

/**
 * Update cart count in header
 * @param {number} increment - Amount to increment by
 */
function updateCartCount(increment = 0) {
    const cartCountElement = document.querySelector('.cart-count');
    if (!cartCountElement) return;

    // Get current cart data from localStorage or create new empty cart
    const cartData = JSON.parse(localStorage.getItem('cartData') || '{"items":[]}');

    // Add increment
    if (increment > 0) {
        // In a real app, we would add the specific product
        // For this demo, we'll just increment the count
        cartData.items.push({ id: 'demo-item' });
        localStorage.setItem('cartData', JSON.stringify(cartData));
    }

    // Update cart count display
    cartCountElement.textContent = cartData.items.length;
}

/**
 * Setup event listeners for the store
 */
function setupEventListeners() {
    // Category filters
    const categoryFilters = document.querySelectorAll('.category-filter');
    if (categoryFilters) {
        categoryFilters.forEach(filter => {
            filter.addEventListener('click', function() {
                const category = this.getAttribute('data-category');
                filterProducts(category);

                // Update active state
                categoryFilters.forEach(f => f.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }
}

/**
 * Filter products by category
 * @param {string} category - Category to filter by
 */
function filterProducts(category) {
    console.log('Filtering products by category:', category);
    // In a real app, this would filter the products displayed
    // For this demo, we'll just log the action

    showToast(`Filtered by ${category}`, 'info');
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type (success, error, warning, info)
 */
function showToast(message, type = 'info') {
    // Check if toast container exists, create if not
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Set toast content
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        </div>
        <div class="toast-content">${message}</div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;

    // Add to container
    toastContainer.appendChild(toast);

    // Add click event to close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.add('toast-fadeout');
        setTimeout(() => {
            toast.remove();
        }, 300);
    });

    // Auto-remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('toast-fadeout');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
}

// Initialize store when the DOM is loaded
document.addEventListener('DOMContentLoaded', initStore);
