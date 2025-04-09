/**
 * Case Study Detail - Interactive functionality
 * Handles loading case study details based on URL parameters
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get case study ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const caseStudyId = urlParams.get('id');

    if (!caseStudyId) {
        // Handle missing ID parameter
        showErrorMessage('Case study not found. Please try again.');
        return;
    }

    // Load case study details
    loadCaseStudy(caseStudyId);

    // Initialize other functionality
    initBookingButtons();
    initShareButtons();
});

/**
 * Load case study details based on ID
 * @param {string|number} id - The case study ID to load
 */
function loadCaseStudy(id) {
    // In a real application, this would make an API call
    // For demo purposes, we'll use static data
    const caseStudyData = getCaseStudyById(id);

    if (!caseStudyData) {
        showErrorMessage('Case study not found. Please try again.');
        return;
    }

    // Render the case study content
    renderCaseStudy(caseStudyData);

    // Load related case studies
    loadRelatedCaseStudies(caseStudyData.category);
}

/**
 * Render the case study content
 * @param {Object} caseStudy - The case study data object
 */
function renderCaseStudy(caseStudy) {
    const container = document.getElementById('case-study-container');

    // Remove loading spinner
    container.innerHTML = '';

    // Create case study HTML content
    const caseStudyHTML = `
        <div class="case-study-header">
            <div class="breadcrumbs">
                <a href="index.html">Home</a>
                <span>/</span>
                <a href="expert-case-studies.html">Case Studies</a>
                <span>/</span>
                <a href="expert-case-studies.html?category=${caseStudy.category}">${caseStudy.categoryName}</a>
            </div>

            <h1 class="case-study-title">${caseStudy.title}</h1>

            <div class="case-study-meta">
                <div class="case-study-category">${caseStudy.categoryName}</div>
                <div class="case-study-date">Published: ${caseStudy.publishDate}</div>
                ${caseStudy.isPremium ?
                    `<div class="premium-badge"><i class="fas fa-crown"></i> Premium Case Study</div>` : ''}
            </div>

            <div class="case-study-expert">
                <img src="${caseStudy.expertImage}" alt="${caseStudy.expertName}" class="expert-avatar-large">
                <div class="expert-info-detail">
                    <h3 class="expert-name-large">${caseStudy.expertName}</h3>
                    <p class="expert-title-large">${caseStudy.expertTitle}</p>
                    <p class="expert-bio">${caseStudy.expertBio}</p>
                    <a href="expert-profile.html?id=${caseStudy.expertId}" class="view-profile-link">
                        View Expert Profile <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        </div>

        <div class="case-study-content">
            <img src="${caseStudy.featuredImage}" alt="${caseStudy.title}" class="case-study-featured-image">

            <div class="case-study-text">
                ${caseStudy.content}
            </div>
        </div>

        <div class="case-study-results">
            <h2 class="results-heading">Results Achieved</h2>
            <div class="results-grid">
                ${generateResultsHTML(caseStudy.results)}
            </div>
        </div>

        ${caseStudy.timeline ? `
        <div class="case-study-timeline">
            <h2 class="timeline-heading">Project Timeline</h2>
            <div class="timeline">
                ${generateTimelineHTML(caseStudy.timeline)}
            </div>
        </div>
        ` : ''}

        ${caseStudy.testimonial ? `
        <div class="client-testimonial">
            <h2 class="testimonial-heading">Client Testimonial</h2>
            <div class="testimonial-content">${caseStudy.testimonial.content}</div>
            <div class="testimonial-author">
                <img src="${caseStudy.testimonial.authorImage}" alt="${caseStudy.testimonial.authorName}" class="author-avatar">
                <div class="author-info">
                    <h4>${caseStudy.testimonial.authorName}</h4>
                    <p>${caseStudy.testimonial.authorTitle}</p>
                </div>
            </div>
        </div>
        ` : ''}

        <div class="share-buttons">
            <a href="#" class="share-button share-facebook" aria-label="Share on Facebook">
                <i class="fab fa-facebook-f"></i>
            </a>
            <a href="#" class="share-button share-twitter" aria-label="Share on Twitter">
                <i class="fab fa-twitter"></i>
            </a>
            <a href="#" class="share-button share-linkedin" aria-label="Share on LinkedIn">
                <i class="fab fa-linkedin-in"></i>
            </a>
            <a href="#" class="share-button share-email" aria-label="Share via Email">
                <i class="fas fa-envelope"></i>
            </a>
        </div>
    `;

    container.innerHTML = caseStudyHTML;

    // Set page title
    document.title = `${caseStudy.title} | Expert Marketplace`;

    // Update expert CTA buttons with expert ID
    updateExpertCTAButtons(caseStudy.expertId, caseStudy.expertName);
}

/**
 * Generate HTML for results section
 * @param {Array} results - Array of result objects
 * @returns {string} HTML for results
 */
function generateResultsHTML(results) {
    return results.map(result => `
        <div class="result-item">
            <div class="result-value">${result.value}</div>
            <div class="result-label">${result.label}</div>
        </div>
    `).join('');
}

/**
 * Generate HTML for timeline section
 * @param {Array} timeline - Array of timeline objects
 * @returns {string} HTML for timeline
 */
function generateTimelineHTML(timeline) {
    return timeline.map(item => `
        <div class="timeline-item">
            <div class="timeline-date"></div>
            <div class="timeline-content">
                <h3 class="timeline-title">${item.title}</h3>
                <p class="timeline-text">${item.description}</p>
            </div>
        </div>
    `).join('');
}

/**
 * Load related case studies based on category
 * @param {string} category - Category to find related case studies
 */
function loadRelatedCaseStudies(category) {
    const relatedContainer = document.getElementById('related-case-studies');
    if (!relatedContainer) return;

    // In a real application, this would make an API call
    // For demo purposes, we'll use static data
    const allCaseStudies = getCaseStudiesData();

    // Filter by category and limit to 3
    const relatedStudies = allCaseStudies
        .filter(study => study.category === category)
        .slice(0, 3);

    if (relatedStudies.length === 0) {
        relatedContainer.innerHTML = '<p class="no-related">No related case studies found.</p>';
        return;
    }

    // Generate HTML for each related case study
    relatedStudies.forEach(study => {
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
                    ${study.stats.map(stat => `
                        <div class="stat">
                            <span class="stat-value">${stat.value}</span>
                            <span class="stat-label">${stat.label}</span>
                        </div>
                    `).join('')}
                </div>
                <a href="case-study-detail.html?id=${study.id}" class="btn btn-outline full-width">View Full Case Study</a>
            </div>
        `;

        relatedContainer.appendChild(caseStudyCard);
    });
}

/**
 * Update expert CTA buttons with expert ID and name
 * @param {string|number} expertId - The expert ID
 * @param {string} expertName - The expert name
 */
function updateExpertCTAButtons(expertId, expertName) {
    const bookButton = document.getElementById('book-expert-btn');
    const messageButton = document.getElementById('message-expert-btn');

    if (bookButton) {
        bookButton.href = `expert-booking.html?expert=${expertId}`;
        bookButton.setAttribute('data-expert-name', expertName);
    }

    if (messageButton) {
        messageButton.href = `expert-messaging.html?expert=${expertId}`;
        messageButton.setAttribute('data-expert-name', expertName);
    }
}

/**
 * Initialize booking buttons functionality
 */
function initBookingButtons() {
    const bookButton = document.getElementById('book-expert-btn');
    const messageButton = document.getElementById('message-expert-btn');

    if (bookButton) {
        bookButton.addEventListener('click', function(e) {
            // In a real application, this would navigate to the booking page
            // For demo purposes, we'll just show a message
            const expertName = this.getAttribute('data-expert-name');
            if (!expertName) return;

            e.preventDefault();
            alert(`Booking a session with ${expertName}. In a real application, this would take you to the booking page.`);
        });
    }

    if (messageButton) {
        messageButton.addEventListener('click', function(e) {
            // In a real application, this would navigate to the messaging page
            // For demo purposes, we'll just show a message
            const expertName = this.getAttribute('data-expert-name');
            if (!expertName) return;

            e.preventDefault();
            alert(`Sending a message to ${expertName}. In a real application, this would take you to the messaging interface.`);
        });
    }
}

/**
 * Initialize share buttons functionality
 */
function initShareButtons() {
    const shareButtons = document.querySelectorAll('.share-button');

    shareButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();

            // In a real application, this would open share dialogs
            // For demo purposes, we'll just show a message
            alert('Sharing functionality would be implemented here. In a real application, this would share the case study on the selected platform.');
        });
    });
}

/**
 * Show an error message in the container
 * @param {string} message - The error message to display
 */
function showErrorMessage(message) {
    const container = document.getElementById('case-study-container');

    container.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
            <a href="expert-case-studies.html" class="btn btn-primary">Return to Case Studies</a>
        </div>
    `;
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
            expertId: 'james-wilson',
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
            expertId: 'sarah-johnson',
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
            expertId: 'david-chen',
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
            expertId: 'michael-roberts',
            isPremium: true,
            stats: [
                { value: '$2.5M', label: 'New Investment' },
                { value: '68%', label: 'Debt Reduction' },
                { value: '18', label: 'Months to Profitability' }
            ]
        }
    ];
}

/**
 * Get detailed case study by ID
 * @param {string|number} id - The case study ID to find
 * @returns {Object|null} The case study object or null if not found
 */
function getCaseStudyById(id) {
    // Convert ID to number if it's a string
    const numId = parseInt(id, 10);

    // Case study details
    const caseStudyDetails = {
        1: {
            id: 1,
            title: 'How We Increased Revenue by 250% in 6 Months',
            category: 'business',
            categoryName: 'Business Strategy',
            publishDate: 'June 15, 2024',
            expertName: 'James Wilson',
            expertTitle: 'Business Growth Strategist',
            expertImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a',
            expertId: 'james-wilson',
            expertBio: 'James Wilson is a business growth strategist with over 15 years of experience helping SaaS companies scale their operations and revenue. He specializes in optimizing sales processes and customer retention strategies.',
            isPremium: true,
            featuredImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40',
            content: `
                <p>When ABC Software approached us, they were facing significant challenges. Their customer acquisition costs were high, retention rates were dropping, and revenue had plateaued. The 5-year-old SaaS company had a solid product but was struggling to grow in an increasingly competitive market.</p>

                <h2>The Challenge</h2>
                <p>The company was experiencing several critical issues that needed immediate attention:</p>
                <ul>
                    <li>Customer churn rate had reached 15% monthly, significantly above industry standards</li>
                    <li>Customer acquisition costs had risen by 75% in the previous year</li>
                    <li>The sales team was struggling with low conversion rates</li>
                    <li>Pricing strategy was not optimized for different customer segments</li>
                    <li>Lack of clear product differentiation in marketing materials</li>
                </ul>

                <h2>Our Approach</h2>
                <p>We began with a comprehensive audit of the company's operations, focusing on customer feedback, sales processes, and pricing structure. Based on our findings, we developed a six-month transformation plan that addressed each of the key problems.</p>

                <h3>1. Customer Retention Overhaul</h3>
                <p>We implemented a proactive customer success program that identified at-risk customers before they churned. This included:</p>
                <ul>
                    <li>Developing an early warning system based on usage patterns</li>
                    <li>Creating a tiered customer success approach that prioritized high-value accounts</li>
                    <li>Implementing regular check-ins and quarterly business reviews for all customers</li>
                </ul>

                <h3>2. Sales Process Optimization</h3>
                <p>We completely redesigned the sales methodology, focusing on value-based selling rather than feature comparisons. Key improvements included:</p>
                <ul>
                    <li>Developing detailed ideal customer profiles to better target prospects</li>
                    <li>Creating industry-specific case studies and ROI calculators</li>
                    <li>Implementing a consultative sales training program for the entire team</li>
                    <li>Introducing a new lead scoring system to prioritize high-potential opportunities</li>
                </ul>

                <div class="quote-block">
                    "James and his team completely transformed our approach to sales. We went from selling features to selling outcomes, and the difference in customer response was immediate and dramatic."
                    <span class="quote-source">— Sarah Lee, VP of Sales, ABC Software</span>
                </div>

                <h3>3. Value-Based Pricing Strategy</h3>
                <p>We conducted extensive market research and value analysis to develop a new pricing strategy that better aligned with the value delivered to customers. Changes included:</p>
                <ul>
                    <li>Moving from a one-size-fits-all pricing model to tiered plans targeted at different customer segments</li>
                    <li>Introducing annual contracts with incentives, improving cash flow and reducing churn</li>
                    <li>Adding high-value service components to enterprise plans, increasing average contract value</li>
                </ul>

                <h3>4. Differentiated Positioning</h3>
                <p>We worked with the marketing team to clarify and strengthen the company's market positioning:</p>
                <ul>
                    <li>Developed a clear value proposition that highlighted unique strengths</li>
                    <li>Created new messaging frameworks for different customer segments</li>
                    <li>Redesigned the website and sales materials to emphasize customer outcomes</li>
                </ul>
            `,
            results: [
                { value: '250%', label: 'Revenue Growth' },
                { value: '-80%', label: 'Customer Churn Reduction' },
                { value: '135%', label: 'Higher Conversion Rate' },
                { value: '$4.2M', label: 'New ARR Added' }
            ],
            timeline: [
                { title: 'Initial Assessment', description: 'Comprehensive audit of operations, customer feedback, and market positioning.' },
                { title: 'Strategy Development', description: 'Created detailed transformation roadmap with measurable milestones.' },
                { title: 'Customer Success Program Launch', description: 'Implemented new retention strategies and early warning systems.' },
                { title: 'Sales Methodology Redesign', description: 'Trained team on new consultative selling approach with industry-specific materials.' },
                { title: 'New Pricing Structure', description: 'Launched tiered pricing model aligned with customer segments and value delivered.' },
                { title: 'Positioning Refinement', description: 'Rolled out new messaging and market positioning across all channels.' }
            ],
            testimonial: {
                content: "Working with James and his team was transformational for our business. Beyond the impressive numbers, they helped us build sustainable systems and processes that continue to drive growth long after the engagement ended. Their strategic insights and practical approach made all the difference.",
                authorName: "Robert Chen",
                authorTitle: "CEO, ABC Software",
                authorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d"
            }
        },
        2: {
            id: 2,
            title: 'Scaling Social Media Presence for a Local Business',
            category: 'marketing',
            categoryName: 'Digital Marketing',
            publishDate: 'May 22, 2024',
            expertName: 'Sarah Johnson',
            expertTitle: 'Digital Marketing Specialist',
            expertImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
            expertId: 'sarah-johnson',
            expertBio: 'Sarah Johnson specializes in digital marketing strategies for small and medium businesses. With a background in both traditional and digital marketing, she helps local businesses build their online presence and drive real-world results.',
            isPremium: false,
            featuredImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
            content: `
                <p>Bella's Bistro, a family-owned Italian restaurant located in a competitive urban area, was struggling to build awareness and attract new customers. Despite having excellent food and service, they were being overshadowed by larger chain restaurants with bigger marketing budgets.</p>

                <h2>The Challenge</h2>
                <p>The restaurant faced several key challenges:</p>
                <ul>
                    <li>Limited visibility in a saturated restaurant market</li>
                    <li>Small marketing budget compared to competitors</li>
                    <li>No cohesive social media strategy or consistent posting schedule</li>
                    <li>Minimal online presence beyond a basic website</li>
                    <li>Difficulty attracting weekday dinner customers</li>
                </ul>

                <h2>Our Strategy</h2>
                <p>After a thorough analysis of the restaurant's strengths and the local market, we developed a targeted social media and local SEO strategy that would maximize impact with minimal budget.</p>

                <h3>1. Platform-Specific Content Strategy</h3>
                <p>Rather than trying to be everywhere, we focused on two platforms that our research showed were most used by the target demographic:</p>
                <ul>
                    <li>Instagram: Showcasing beautiful food photography and behind-the-scenes content</li>
                    <li>Facebook: Community engagement, events, and special promotions</li>
                </ul>

                <h3>2. Local Influencer Partnerships</h3>
                <p>We identified and partnered with local food bloggers and micro-influencers who had engaged followers in the area:</p>
                <ul>
                    <li>Hosted an exclusive tasting event for 5 local influencers</li>
                    <li>Created a special "Influencer's Choice" menu item that rotated monthly</li>
                    <li>Developed an affiliate program that tracked reservations through unique links</li>
                </ul>

                <div class="quote-block">
                    "Sarah's approach to influencer partnerships was genius. It felt authentic and created real connections with food lovers in our community, not just empty promotion."
                    <span class="quote-source">— Isabella Romano, Owner, Bella's Bistro</span>
                </div>

                <h3>3. User-Generated Content Campaign</h3>
                <p>We launched a hashtag campaign that encouraged diners to share their experience:</p>
                <ul>
                    <li>Created Instagram-worthy presentation for signature dishes</li>
                    <li>Added table cards promoting the hashtag #BellasMoments</li>
                    <li>Offered monthly prize drawings for customers who shared photos</li>
                    <li>Featured customer photos on the restaurant's accounts (with permission)</li>
                </ul>

                <h3>4. Strategic Local SEO</h3>
                <p>We optimized the restaurant's online presence for local search:</p>
                <ul>
                    <li>Claimed and optimized Google Business Profile with weekly updates</li>
                    <li>Developed a review generation strategy that increased positive reviews</li>
                    <li>Created locally relevant content on the website blog</li>
                    <li>Built local backlinks through community partnerships</li>
                </ul>
            `,
            results: [
                { value: '10x', label: 'Social Engagement' },
                { value: '45%', label: 'Foot Traffic Increase' },
                { value: '68%', label: 'More Weekday Reservations' },
                { value: '3', label: 'Months to ROI' }
            ],
            timeline: [
                { title: 'Digital Audit & Strategy', description: 'Complete analysis of existing online presence and competitive landscape.' },
                { title: 'Content Development', description: 'Professional photography session and content calendar creation.' },
                { title: 'Influencer Event', description: 'Exclusive tasting event for local food influencers and bloggers.' },
                { title: 'Campaign Launch', description: 'Rolled out new content strategy and user-generated content campaign.' },
                { title: 'Local SEO Implementation', description: 'Optimized online listings and began review generation strategy.' },
                { title: 'Performance Optimization', description: 'Analyzed results and refined targeting based on engagement data.' }
            ],
            testimonial: {
                content: "Working with Sarah completely transformed our business. Before, we were practically invisible online. Now, we have people coming in specifically mentioning they found us on Instagram or through a food blogger's recommendation. Our weekday reservations have gone up dramatically, and we're seeing a whole new demographic of customers.",
                authorName: "Isabella Romano",
                authorTitle: "Owner, Bella's Bistro",
                authorImage: "https://images.unsplash.com/photo-1534751516642-a1af1ef26a56"
            }
        }
    };

    // Return case study if exists, otherwise null
    return caseStudyDetails[numId] || null;
}
