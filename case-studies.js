/**
 * Case Studies - Interactive features
 * Handles category filtering, search, and dynamic loading of case studies
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    initCategoryTabs();
    initCaseStudySearch();
    initLoadMoreButton();
    initFilterDropdown();
});

/**
 * Initialize category tab functionality
 */
function initCategoryTabs() {
    const categoryTabs = document.querySelectorAll('.category-tab');
    const caseStudiesList = document.querySelector('.case-studies-list');

    if (!categoryTabs.length || !caseStudiesList) return;

    // Generate initial case studies list
    generateCaseStudiesList('all');

    // Add click handlers to category tabs
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            categoryTabs.forEach(t => t.classList.remove('active'));

            // Add active class to clicked tab
            this.classList.add('active');

            // Get category value from data attribute
            const category = this.getAttribute('data-category');

            // Generate case studies list for selected category
            generateCaseStudiesList(category);
        });
    });
}

/**
 * Generate case studies list for the selected category
 * @param {string} category - The category to filter case studies by
 */
function generateCaseStudiesList(category) {
    const caseStudiesList = document.querySelector('.case-studies-list');

    // In a real application, this would be fetched from an API
    // For demo purposes, we'll use static data
    const caseStudiesData = getCaseStudiesData();

    // Filter case studies by category if not 'all'
    const filteredCaseStudies = category === 'all'
        ? caseStudiesData
        : caseStudiesData.filter(study => study.category === category);

    // Clear existing list
    caseStudiesList.innerHTML = '';

    if (filteredCaseStudies.length === 0) {
        caseStudiesList.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>No case studies found for this category.</p>
            </div>
        `;
        return;
    }

    // Generate HTML for each case study
    filteredCaseStudies.forEach(study => {
        const caseStudyItem = document.createElement('div');
        caseStudyItem.className = 'case-study-list-item';

        // Premium badge for premium case studies
        const premiumBadge = study.isPremium
            ? `<span class="premium-tag"><i class="fas fa-crown"></i> Premium</span>`
            : '';

        caseStudyItem.innerHTML = `
            <div class="case-study-list-image">
                <img src="${study.image}" alt="${study.title}">
                <span class="category-tag">${study.categoryName}</span>
                ${premiumBadge}
            </div>
            <div class="case-study-list-content">
                <h3>${study.title}</h3>
                <div class="expert-info">
                    <img src="${study.expertImage}" alt="${study.expertName}" class="expert-avatar">
                    <div>
                        <p class="expert-name">${study.expertName}</p>
                        <p class="expert-title">${study.expertTitle}</p>
                    </div>
                </div>
                <p class="case-study-summary">${study.summary}</p>
                <div class="case-study-stats">
                    ${generateStatsHTML(study.stats)}
                </div>
                <a href="case-study-detail.html?id=${study.id}" class="btn btn-outline">View Full Case Study</a>
            </div>
        `;

        caseStudiesList.appendChild(caseStudyItem);
    });
}

/**
 * Generate HTML for case study stats
 * @param {Array} stats - Array of stat objects
 * @returns {string} HTML for stats
 */
function generateStatsHTML(stats) {
    return stats.map(stat => `
        <div class="stat">
            <span class="stat-value">${stat.value}</span>
            <span class="stat-label">${stat.label}</span>
        </div>
    `).join('');
}

/**
 * Initialize search functionality
 */
function initCaseStudySearch() {
    const searchInput = document.querySelector('.search-box input');
    const searchButton = document.querySelector('.search-button');

    if (!searchInput || !searchButton) return;

    // Search on button click
    searchButton.addEventListener('click', () => {
        performSearch(searchInput.value);
    });

    // Search on Enter key
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            performSearch(searchInput.value);
        }
    });
}

/**
 * Perform search across case studies
 * @param {string} query - Search query
 */
function performSearch(query) {
    const caseStudiesList = document.querySelector('.case-studies-list');
    const categoryTabs = document.querySelectorAll('.category-tab');

    // Reset category tabs to 'all'
    categoryTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-category') === 'all') {
            tab.classList.add('active');
        }
    });

    if (!query.trim()) {
        // If search is empty, show all case studies
        generateCaseStudiesList('all');
        return;
    }

    // Get all case studies
    const caseStudiesData = getCaseStudiesData();

    // Filter based on search query (case insensitive)
    const searchLower = query.toLowerCase();
    const filteredCaseStudies = caseStudiesData.filter(study => {
        return (
            study.title.toLowerCase().includes(searchLower) ||
            study.summary.toLowerCase().includes(searchLower) ||
            study.expertName.toLowerCase().includes(searchLower) ||
            study.categoryName.toLowerCase().includes(searchLower)
        );
    });

    // Clear existing list
    caseStudiesList.innerHTML = '';

    if (filteredCaseStudies.length === 0) {
        caseStudiesList.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>No case studies found matching "${query}"</p>
                <button class="btn btn-outline reset-search">Reset Search</button>
            </div>
        `;

        // Add event listener to reset button
        const resetButton = caseStudiesList.querySelector('.reset-search');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                searchInput.value = '';
                generateCaseStudiesList('all');
            });
        }

        return;
    }

    // Generate HTML for each matching case study
    filteredCaseStudies.forEach(study => {
        const caseStudyItem = document.createElement('div');
        caseStudyItem.className = 'case-study-list-item';

        // Premium badge for premium case studies
        const premiumBadge = study.isPremium
            ? `<span class="premium-tag"><i class="fas fa-crown"></i> Premium</span>`
            : '';

        caseStudyItem.innerHTML = `
            <div class="case-study-list-image">
                <img src="${study.image}" alt="${study.title}">
                <span class="category-tag">${study.categoryName}</span>
                ${premiumBadge}
            </div>
            <div class="case-study-list-content">
                <h3>${study.title}</h3>
                <div class="expert-info">
                    <img src="${study.expertImage}" alt="${study.expertName}" class="expert-avatar">
                    <div>
                        <p class="expert-name">${study.expertName}</p>
                        <p class="expert-title">${study.expertTitle}</p>
                    </div>
                </div>
                <p class="case-study-summary">${study.summary}</p>
                <div class="case-study-stats">
                    ${generateStatsHTML(study.stats)}
                </div>
                <a href="case-study-detail.html?id=${study.id}" class="btn btn-outline">View Full Case Study</a>
            </div>
        `;

        caseStudiesList.appendChild(caseStudyItem);
    });
}

/**
 * Initialize load more button functionality
 */
function initLoadMoreButton() {
    const loadMoreButton = document.querySelector('.view-more-container .btn');

    if (!loadMoreButton) return;

    loadMoreButton.addEventListener('click', function() {
        // In a real application, this would load more case studies from an API
        // For demo purposes, we'll just show a message
        this.innerHTML = '<i class="fas fa-check"></i> All Case Studies Loaded';
        this.disabled = true;

        // Add some more case studies for demo
        const caseStudiesGrid = document.querySelector('.case-studies-grid');
        if (caseStudiesGrid) {
            // Add a couple more case studies for demo
            const moreStudies = getMoreCaseStudies();
            moreStudies.forEach(study => {
                const caseStudyCard = document.createElement('div');
                caseStudyCard.className = 'case-study-card';
                if (study.isPremium) {
                    caseStudyCard.classList.add('premium');
                }

                const premiumBadge = study.isPremium
                    ? `<span class="premium-tag"><i class="fas fa-crown"></i> Premium</span>`
                    : '';

                caseStudyCard.innerHTML = `
                    <div class="case-study-image">
                        <img src="${study.image}" alt="${study.title}">
                        <span class="category-tag">${study.categoryName}</span>
                        ${premiumBadge}
                    </div>
                    <div class="case-study-content">
                        <h3>${study.title}</h3>
                        <div class="expert-info">
                            <img src="${study.expertImage}" alt="${study.expertName}" class="expert-avatar">
                            <div>
                                <p class="expert-name">${study.expertName}</p>
                                <p class="expert-title">${study.expertTitle}</p>
                            </div>
                        </div>
                        <p class="case-study-summary">${study.summary}</p>
                        <div class="case-study-stats">
                            ${generateStatsHTML(study.stats)}
                        </div>
                        <a href="case-study-detail.html?id=${study.id}" class="btn btn-outline full-width">View Full Case Study</a>
                    </div>
                `;

                caseStudiesGrid.appendChild(caseStudyCard);
            });
        }
    });
}

/**
 * Initialize filter dropdown functionality
 */
function initFilterDropdown() {
    const applyFiltersButton = document.querySelector('.apply-filters');

    if (!applyFiltersButton) return;

    applyFiltersButton.addEventListener('click', function() {
        // In a real application, this would apply selected filters
        // For demo purposes, we'll just close the dropdown
        this.closest('.filter-dropdown').style.display = 'none';

        // Show a notification
        showNotification('Filters applied successfully!');
    });
}

/**
 * Show a temporary notification
 * @param {string} message - Notification message
 */
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    // Add to document
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

/**
 * Get mock case studies data
 * In a real application, this would come from an API
 */
function getCaseStudiesData() {
    return [
        {
            id: 1,
            title: 'How We Increased Revenue by 250% in 6 Months',
            summary: 'A struggling SaaS company came to us with declining revenues and customer churn. We implemented a comprehensive growth strategy that transformed their business in just 6 months.',
            image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40',
            category: 'business',
            categoryName: 'Business Strategy',
            expertName: 'James Wilson',
            expertTitle: 'Business Growth Strategist',
            expertImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a',
            isPremium: true,
            stats: [
                { value: '250%', label: 'Revenue Growth' },
                { value: '-35%', label: 'Customer Churn' },
                { value: '6', label: 'Months' }
            ]
        },
        {
            id: 2,
            title: 'Scaling Social Media Presence for a Local Business',
            summary: 'We helped a local restaurant build their brand and increase foot traffic through strategic social media marketing and local SEO optimization.',
            image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
            category: 'marketing',
            categoryName: 'Digital Marketing',
            expertName: 'Sarah Johnson',
            expertTitle: 'Digital Marketing Specialist',
            expertImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
            isPremium: false,
            stats: [
                { value: '10x', label: 'Social Engagement' },
                { value: '45%', label: 'Foot Traffic' },
                { value: '3', label: 'Months' }
            ]
        },
        {
            id: 3,
            title: 'Optimizing Legacy Code for Modern Performance',
            summary: 'An e-commerce company was struggling with slow load times and technical debt. Our refactoring strategy improved performance while maintaining business continuity.',
            image: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd',
            category: 'technology',
            categoryName: 'Software Development',
            expertName: 'David Chen',
            expertTitle: 'Senior Software Engineer',
            expertImage: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79',
            isPremium: false,
            stats: [
                { value: '85%', label: 'Faster Load Time' },
                { value: '40%', label: 'Code Reduction' },
                { value: '12', label: 'Weeks' }
            ]
        },
        {
            id: 4,
            title: 'Financial Restructuring for a Growing Startup',
            summary: 'We helped a promising startup restructure their finances, secure new investment, and build a sustainable growth model.',
            image: 'https://images.unsplash.com/photo-1444653614773-995cb1ef9efa',
            category: 'finance',
            categoryName: 'Financial Strategy',
            expertName: 'Michael Roberts',
            expertTitle: 'Financial Consultant',
            expertImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
            isPremium: true,
            stats: [
                { value: '$2.5M', label: 'New Investment' },
                { value: '68%', label: 'Debt Reduction' },
                { value: '18', label: 'Months to Profitability' }
            ]
        },
        {
            id: 5,
            title: 'Wellness Program Implementation for Corporate Staff',
            summary: 'We designed and implemented a comprehensive wellness program for a large corporation, resulting in improved employee health metrics and reduced healthcare costs.',
            image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b',
            category: 'health',
            categoryName: 'Health & Wellness',
            expertName: 'Jessica Martinez',
            expertTitle: 'Corporate Wellness Director',
            expertImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
            isPremium: false,
            stats: [
                { value: '32%', label: 'Reduced Sick Days' },
                { value: '15%', label: 'Lowered Healthcare Costs' },
                { value: '89%', label: 'Employee Satisfaction' }
            ]
        }
    ];
}

/**
 * Get additional mock case studies for "Load More" functionality
 */
function getMoreCaseStudies() {
    return [
        {
            id: 6,
            title: 'Building an AI-Powered Customer Service Platform',
            summary: 'We helped an online retailer develop and implement an AI chatbot that reduced customer service response times and increased resolution rates.',
            image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04',
            category: 'technology',
            categoryName: 'AI Development',
            expertName: 'Grace Lee',
            expertTitle: 'AI Solutions Architect',
            expertImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956',
            isPremium: true,
            stats: [
                { value: '78%', label: 'Faster Response Time' },
                { value: '42%', label: 'Cost Reduction' },
                { value: '94%', label: 'Customer Satisfaction' }
            ]
        },
        {
            id: 7,
            title: 'Rebranding Strategy for a Legacy Company',
            summary: 'We developed and executed a complete rebranding strategy for a 50-year-old company looking to modernize their image and appeal to younger customers.',
            image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0',
            category: 'marketing',
            categoryName: 'Brand Strategy',
            expertName: 'Marcus Johnson',
            expertTitle: 'Brand Strategist',
            expertImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
            isPremium: false,
            stats: [
                { value: '57%', label: 'New Customer Acquisition' },
                { value: '163%', label: 'Social Media Growth' },
                { value: '5', label: 'Months to Complete' }
            ]
        }
    ];
}
