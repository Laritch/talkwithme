/**
 * Product Detail JavaScript
 * This file handles product detail page functionality with authentication enforcement
 */

// Initialize the product detail page
function initProductDetail() {
    // Check if user is logged in using our auth system
    if (!isLoggedIn()) {
        // Redirect to login with return URL
        window.location.href = '/login.html?redirect=product-detail.html' + window.location.search;
        return;
    }

    // Get user data
    const userData = getCurrentUser();
    console.log('Product detail page initialized for user:', userData.username);

    // Update UI with user data
    updateProductDetailUI(userData);

    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        console.error('No product ID found in URL');
        showErrorMessage('Product not found');
        return;
    }

    // Load product details
    loadProductDetails(productId);

    // Setup event listeners
    setupEventListeners(productId);
}

/**
 * Update the product detail UI with user data
 * @param {Object} userData - User data from getCurrentUser()
 */
function updateProductDetailUI(userData) {
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
 * Load product details
 * @param {string} productId - Product ID
 */
function loadProductDetails(productId) {
    // For demo purposes, we'll create mock data
    // In a real app, this would be an API call

    // Show loading state
    const productContainer = document.querySelector('.product-detail-container');
    if (productContainer) {
        productContainer.innerHTML = '<div class="loading">Loading product details...</div>';
    }

    // Create mock product data based on ID
    let product;

    switch(productId) {
        case 'prod1':
            product = {
                id: 'prod1',
                name: 'Expert Consultation',
                price: 99.99,
                image: '/uploads/default-avatar.png',
                category: 'consulting',
                description: 'One-on-one consultation with industry experts to solve your specific problems.',
                longDescription: 'Our expert consultation service connects you with industry-leading professionals who have deep expertise in solving complex problems. During your session, you\'ll receive personalized advice and strategies tailored to your specific challenges. Each consultation includes a detailed follow-up report with actionable recommendations and resources.',
                expert: {
                    name: 'Dr. Jane Smith',
                    title: 'Senior Consultant',
                    image: '/uploads/default-avatar.png',
                    bio: 'Dr. Smith has over 15 years of experience in the industry and has helped hundreds of clients overcome their challenges.'
                },
                reviews: [
                    {
                        user: 'Michael P.',
                        rating: 5,
                        comment: 'Excellent consultation! Dr. Smith provided valuable insights that helped us solve our longstanding issues.'
                    },
                    {
                        user: 'Sarah K.',
                        rating: 4,
                        comment: 'Very helpful session with practical advice I could implement immediately.'
                    }
                ]
            };
            break;
        case 'prod2':
            product = {
                id: 'prod2',
                name: 'Technology Assessment',
                price: 149.99,
                image: '/uploads/default-avatar.png',
                category: 'assessment',
                description: 'Comprehensive assessment of your technology stack with detailed recommendations.',
                longDescription: 'Our technology assessment service provides a thorough analysis of your current technology infrastructure, identifying strengths, weaknesses, and opportunities for improvement. Our team of experts will evaluate your systems, software, and processes to deliver a comprehensive report with actionable recommendations.',
                expert: {
                    name: 'Alex Johnson',
                    title: 'Technology Strategist',
                    image: '/uploads/default-avatar.png',
                    bio: 'Alex has helped dozens of companies modernize their technology stacks and achieve significant improvements in efficiency and reliability.'
                },
                reviews: [
                    {
                        user: 'Tech Solutions Inc.',
                        rating: 5,
                        comment: 'The assessment identified several critical issues we weren\'t aware of and provided clear steps to address them.'
                    },
                    {
                        user: 'David M.',
                        rating: 5,
                        comment: 'Excellent service! The recommendations have already resulted in a 30% improvement in our system performance.'
                    }
                ]
            };
            break;
        case 'prod3':
            product = {
                id: 'prod3',
                name: 'Strategy Workshop',
                price: 299.99,
                image: '/uploads/default-avatar.png',
                category: 'workshop',
                description: 'Interactive strategy workshop to define your business roadmap.',
                longDescription: 'Our strategy workshop brings together key stakeholders from your organization to develop a clear, actionable business roadmap. Through a series of structured exercises and discussions, we\'ll help you clarify your goals, identify opportunities, and create a strategic plan to achieve success.',
                expert: {
                    name: 'Robert Chen',
                    title: 'Strategic Planning Facilitator',
                    image: '/uploads/default-avatar.png',
                    bio: 'Robert specializes in helping organizations align their vision, strategy, and execution. He has facilitated workshops for over 100 companies ranging from startups to Fortune 500 corporations.'
                },
                reviews: [
                    {
                        user: 'Global Innovations',
                        rating: 5,
                        comment: 'Robert's workshop was transformative for our executive team. We now have a unified vision and clear path forward.'
                    },
                    {
                        user: 'Jennifer L.',
                        rating: 4,
                        comment: 'Well-structured workshop that helped us break through longstanding strategic roadblocks.'
                    }
                ]
            };
            break;
        default:
            // Show error if product doesn't exist
            showErrorMessage('Product not found');
            return;
    }

    // Render product details
    renderProductDetails(product);
}

/**
 * Render product details
 * @param {Object} product - Product data
 */
function renderProductDetails(product) {
    const productContainer = document.querySelector('.product-detail-container');
    if (!productContainer) return;

    // Calculate average rating
    const avgRating = product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length;
    const roundedRating = Math.round(avgRating * 10) / 10;

    // Create star rating HTML
    const starRating = createStarRating(roundedRating);

    // Render product details
    productContainer.innerHTML = `
        <div class="product-detail-header">
            <div class="product-image-container">
                <img src="${product.image}" alt="${product.name}" class="product-detail-image">
            </div>
            <div class="product-info-container">
                <div class="product-category">${product.category}</div>
                <h1 class="product-title">${product.name}</h1>
                <div class="product-rating">
                    ${starRating}
                    <span class="rating-count">(${product.reviews.length} reviews)</span>
                </div>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <div class="product-description">
                    ${product.longDescription}
                </div>
                <div class="product-actions">
                    <button class="add-to-cart-btn" data-product-id="${product.id}">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                    <button class="save-for-later-btn" data-product-id="${product.id}">
                        <i class="fas fa-bookmark"></i> Save for Later
                    </button>
                </div>
            </div>
        </div>

        <div class="product-detail-tabs">
            <div class="tab-buttons">
                <button class="tab-button active" data-tab="expert">Expert</button>
                <button class="tab-button" data-tab="reviews">Reviews</button>
                <button class="tab-button" data-tab="related">Related Products</button>
            </div>
            <div class="tab-content">
                <div class="tab-panel active" id="expert-panel">
                    <div class="expert-profile">
                        <div class="expert-image-container">
                            <img src="${product.expert.image}" alt="${product.expert.name}" class="expert-image">
                        </div>
                        <div class="expert-info">
                            <h3 class="expert-name">${product.expert.name}</h3>
                            <div class="expert-title">${product.expert.title}</div>
                            <p class="expert-bio">${product.expert.bio}</p>
                            <button class="contact-expert-btn" data-expert-id="${product.expert.name.toLowerCase().replace(/\s+/g, '-')}">
                                <i class="fas fa-comment"></i> Contact Expert
                            </button>
                        </div>
                    </div>
                </div>
                <div class="tab-panel" id="reviews-panel">
                    <div class="reviews-container">
                        <div class="reviews-summary">
                            <div class="average-rating">
                                <div class="rating-number">${roundedRating.toFixed(1)}</div>
                                <div class="rating-stars">${starRating}</div>
                                <div class="rating-count">${product.reviews.length} reviews</div>
                            </div>
                        </div>
                        <div class="reviews-list">
                            ${product.reviews.map(review => `
                                <div class="review-item">
                                    <div class="review-header">
                                        <div class="reviewer-name">${review.user}</div>
                                        <div class="review-rating">${createStarRating(review.rating)}</div>
                                    </div>
                                    <div class="review-content">${review.comment}</div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="write-review">
                            <button class="write-review-btn">
                                <i class="fas fa-pen"></i> Write a Review
                            </button>
                        </div>
                    </div>
                </div>
                <div class="tab-panel" id="related-panel">
                    <div class="related-products">
                        <p>Related products will appear here.</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Setup tab switching
    setupTabs();
}

/**
 * Create star rating HTML
 * @param {number} rating - Rating value (0-5)
 * @returns {string} Star rating HTML
 */
function createStarRating(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    let starsHTML = '';

    // Full stars
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }

    // Half star
    if (halfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }

    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }

    return starsHTML;
}

/**
 * Setup tab switching
 */
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and panels
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));

            // Add active class to clicked button
            button.classList.add('active');

            // Show corresponding panel
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`${tabId}-panel`).classList.add('active');
        });
    });
}

/**
 * Setup event listeners
 * @param {string} productId - Product ID
 */
function setupEventListeners(productId) {
    // We'll set these up after the product is loaded
    document.addEventListener('click', (e) => {
        // Add to cart button
        if (e.target.closest('.add-to-cart-btn')) {
            e.preventDefault();
            addToCart(productId);
        }

        // Save for later button
        if (e.target.closest('.save-for-later-btn')) {
            e.preventDefault();
            saveForLater(productId);
        }

        // Contact expert button
        if (e.target.closest('.contact-expert-btn')) {
            e.preventDefault();
            const expertId = e.target.closest('.contact-expert-btn').getAttribute('data-expert-id');
            contactExpert(expertId);
        }

        // Write review button
        if (e.target.closest('.write-review-btn')) {
            e.preventDefault();
            showReviewForm(productId);
        }
    });
}

/**
 * Add product to cart
 * @param {string} productId - Product ID
 */
function addToCart(productId) {
    // In a real app, this would interact with a cart API
    console.log('Adding product to cart:', productId);

    // Show success notification
    showToast('Product added to cart!', 'success');

    // Update cart count
    updateCartCount(1);
}

/**
 * Save product for later
 * @param {string} productId - Product ID
 */
function saveForLater(productId) {
    // In a real app, this would interact with a saved items API
    console.log('Saving product for later:', productId);

    // Show success notification
    showToast('Product saved for later!', 'success');

    // Update button state
    const saveButton = document.querySelector('.save-for-later-btn');
    if (saveButton) {
        saveButton.innerHTML = '<i class="fas fa-bookmark"></i> Saved';
        saveButton.classList.add('saved');
    }
}

/**
 * Contact expert
 * @param {string} expertId - Expert ID
 */
function contactExpert(expertId) {
    // In a real app, this would open a contact form or chat window
    console.log('Contacting expert:', expertId);

    // For demo, redirect to chat page
    window.location.href = `chat.html?expert=${expertId}`;
}

/**
 * Show review form
 * @param {string} productId - Product ID
 */
function showReviewForm(productId) {
    // In a real app, this would display a review form
    console.log('Showing review form for product:', productId);

    // For demo, show toast
    showToast('Review form functionality coming soon!', 'info');
}

/**
 * Update cart count in header
 * @param {number} increment - Amount to increment by
 */
function updateCartCount(increment = 0) {
    const cartCountElement = document.querySelector('.cart-count');
    if (!cartCountElement) return;

    // Get current cart data from localStorage
    const cartData = JSON.parse(localStorage.getItem('cartData') || '{"items":[]}');

    // Add increment
    if (increment > 0) {
        // In a real app, we would add the specific product
        cartData.items.push({ id: 'demo-item' });
        localStorage.setItem('cartData', JSON.stringify(cartData));
    }

    // Update cart count display
    cartCountElement.textContent = cartData.items.length;
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showErrorMessage(message) {
    const productContainer = document.querySelector('.product-detail-container');
    if (productContainer) {
        productContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
                <a href="store.html" class="return-link">Return to Store</a>
            </div>
        `;
    }
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

// Initialize product detail page when the DOM is loaded
document.addEventListener('DOMContentLoaded', initProductDetail);
