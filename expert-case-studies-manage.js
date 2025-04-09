/**
 * Expert Case Studies Management - JavaScript
 * Handle case studies dashboard functionality and analytics
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check for success message from URL params
    checkForSubmissionSuccess();

    // Initialize search and filtering
    initSearchAndFilters();

    // Initialize action buttons
    initActionButtons();

    // Initialize analytics chart
    initViewsChart();
});

/**
 * Check if there's a success message in URL
 */
function checkForSubmissionSuccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const submitted = urlParams.get('submitted');

    if (submitted === 'true') {
        const successAlert = document.getElementById('submission-success');
        if (successAlert) {
            successAlert.style.display = 'flex';

            // Add event listener to close button
            const closeButton = successAlert.querySelector('.close-alert');
            if (closeButton) {
                closeButton.addEventListener('click', function() {
                    successAlert.style.display = 'none';
                });
            }

            // Auto-hide after 10 seconds
            setTimeout(function() {
                successAlert.style.display = 'none';
            }, 10000);

            // Remove the URL parameter
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        }
    }
}

/**
 * Initialize search and filtering
 */
function initSearchAndFilters() {
    const searchInput = document.getElementById('search-case-studies');
    const statusFilter = document.getElementById('status-filter');
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');

    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                filterCaseStudies();
            }
        });

        const searchButton = searchInput.nextElementSibling;
        if (searchButton) {
            searchButton.addEventListener('click', filterCaseStudies);
        }
    }

    // Filter change events
    if (statusFilter) {
        statusFilter.addEventListener('change', filterCaseStudies);
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterCaseStudies);
    }

    if (sortFilter) {
        sortFilter.addEventListener('change', sortCaseStudies);
    }
}

/**
 * Filter case studies based on search and filter inputs
 */
function filterCaseStudies() {
    const searchInput = document.getElementById('search-case-studies').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    const categoryFilter = document.getElementById('category-filter').value;

    const rows = document.querySelectorAll('.case-studies-table tbody tr');

    rows.forEach(row => {
        let showRow = true;

        // Check search term
        if (searchInput) {
            const title = row.querySelector('.case-info h4').textContent.toLowerCase();
            const client = row.querySelector('.case-client').textContent.toLowerCase();

            if (!title.includes(searchInput) && !client.includes(searchInput)) {
                showRow = false;
            }
        }

        // Check status filter
        if (statusFilter !== 'all') {
            const status = row.querySelector('.status-badge').textContent.toLowerCase();
            if (!status.includes(statusFilter.toLowerCase())) {
                showRow = false;
            }
        }

        // Check category filter
        if (categoryFilter !== 'all') {
            const categoryBadge = row.querySelector('.category-badge');
            if (categoryBadge && !categoryBadge.classList.contains(categoryFilter)) {
                showRow = false;
            }
        }

        // Show or hide row
        row.style.display = showRow ? '' : 'none';
    });

    // Update counts
    updateFilterCounts();
}

/**
 * Sort case studies based on selected sort option
 */
function sortCaseStudies() {
    const sortOption = document.getElementById('sort-filter').value;
    const tbody = document.querySelector('.case-studies-table tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    rows.sort((a, b) => {
        switch (sortOption) {
            case 'date-desc':
                return compareDates(b, a); // Newest first
            case 'date-asc':
                return compareDates(a, b); // Oldest first
            case 'views-desc':
                return compareViews(b, a); // Most views
            case 'conversion-desc':
                return compareConversion(b, a); // Highest conversion
            default:
                return 0;
        }
    });

    // Reattach sorted rows
    rows.forEach(row => tbody.appendChild(row));
}

/**
 * Compare dates for sorting
 */
function compareDates(rowA, rowB) {
    const dateA = rowA.querySelector('.case-date') ? rowA.querySelector('.case-date').textContent : '';
    const dateB = rowB.querySelector('.case-date') ? rowB.querySelector('.case-date').textContent : '';

    // Extract dates from text
    const extractDate = dateText => {
        const match = dateText.match(/\w+ \d+, \d{4}/);
        return match ? new Date(match[0]) : new Date(0);
    };

    return extractDate(dateA) - extractDate(dateB);
}

/**
 * Compare views for sorting
 */
function compareViews(rowA, rowB) {
    const getViews = row => {
        const viewsElement = row.querySelector('.case-stats .stat-item:first-child');
        if (!viewsElement) return 0;

        const viewsText = viewsElement.textContent;
        const match = viewsText.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    };

    return getViews(rowA) - getViews(rowB);
}

/**
 * Compare conversion rates for sorting
 */
function compareConversion(rowA, rowB) {
    const getConversion = row => {
        const conversionElement = row.querySelector('.case-stats .stat-item:nth-child(3)');
        if (!conversionElement) return 0;

        const conversionText = conversionElement.textContent;
        const match = conversionText.match(/(\d+(\.\d+)?)/);
        return match ? parseFloat(match[1]) : 0;
    };

    return getConversion(rowA) - getConversion(rowB);
}

/**
 * Update counts based on filtered rows
 */
function updateFilterCounts() {
    const visibleRows = document.querySelectorAll('.case-studies-table tbody tr:not([style*="none"])');
    const totalCountElement = document.querySelector('.dashboard-header .dashboard-subtitle');

    if (totalCountElement) {
        const totalRows = document.querySelectorAll('.case-studies-table tbody tr').length;
        const visibleCount = visibleRows.length;

        if (visibleCount < totalRows) {
            totalCountElement.textContent = `Showing ${visibleCount} of ${totalRows} case studies`;
        } else {
            totalCountElement.textContent = `Manage your success stories and case studies`;
        }
    }
}

/**
 * Initialize action buttons
 */
function initActionButtons() {
    // Delete buttons
    const deleteButtons = document.querySelectorAll('.btn-delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const caseTitle = row.querySelector('.case-info h4').textContent;

            if (confirm(`Are you sure you want to delete "${caseTitle}"? This action cannot be undone.`)) {
                // In a real application, this would make an API call to delete the case study

                // For demo, we'll just remove the row with animation
                row.style.opacity = '0';
                setTimeout(() => {
                    row.style.height = '0';
                    row.style.padding = '0';
                    row.style.overflow = 'hidden';

                    setTimeout(() => {
                        row.remove();
                        updateAnalytics();
                    }, 300);
                }, 300);
            }
        });
    });

    // Publish now buttons
    const publishNowButtons = document.querySelectorAll('.btn-publish-now');
    publishNowButtons.forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const caseTitle = row.querySelector('.case-info h4').textContent;

            if (confirm(`Publish "${caseTitle}" immediately? It was scheduled for later publication.`)) {
                // In a real application, this would make an API call

                // For demo, update status badge
                const statusBadge = row.querySelector('.status-badge');
                if (statusBadge) {
                    statusBadge.textContent = 'Published';
                    statusBadge.classList.remove('scheduled');
                    statusBadge.classList.add('published');

                    // Update date
                    const dateElement = row.querySelector('.case-date');
                    if (dateElement) {
                        const now = new Date();
                        const options = { year: 'numeric', month: 'long', day: 'numeric' };
                        dateElement.textContent = `Published: ${now.toLocaleDateString('en-US', options)}`;
                    }

                    // Remove publish now button
                    this.remove();

                    // Show success message
                    const message = document.createElement('div');
                    message.className = 'alert-success';
                    message.innerHTML = `
                        <i class="fas fa-check-circle"></i>
                        <div>
                            <h4>Case Study Published</h4>
                            <p>"${caseTitle}" has been published successfully.</p>
                        </div>
                        <button class="close-alert"><i class="fas fa-times"></i></button>
                    `;

                    // Add to page
                    const header = document.querySelector('.dashboard-header');
                    document.querySelector('.dashboard-main').insertBefore(message, header.nextSibling);

                    // Add event listener to close button
                    message.querySelector('.close-alert').addEventListener('click', function() {
                        message.remove();
                    });

                    // Auto-hide after 5 seconds
                    setTimeout(function() {
                        message.style.opacity = '0';
                        setTimeout(function() {
                            message.remove();
                        }, 300);
                    }, 5000);
                }
            }
        });
    });
}

/**
 * Initialize views chart
 */
function initViewsChart() {
    const ctx = document.getElementById('viewsChart');
    if (!ctx) return;

    // Generate some random data for the last 30 days
    const labels = Array.from({length: 30}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
    });

    // Simulated data with trend
    const baseData = [15, 18, 12, 14, 10, 15, 20, 25, 22, 28, 30, 25, 35, 30, 28, 40, 35, 42, 38, 45, 50, 48, 55, 60, 58, 65, 70, 68, 75, 80];

    // Create random variations around base data
    const viewsData = baseData.map(value => {
        const variation = Math.floor(Math.random() * 10) - 5; // Random variation between -5 and 4
        return Math.max(0, value + variation); // Ensure no negative values
    });

    // Create Chart.js instance
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Views',
                data: viewsData,
                borderColor: '#2a41e8',
                backgroundColor: 'rgba(42, 65, 232, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
                pointHitRadius: 10,
                pointBackgroundColor: '#2a41e8'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: '#fff',
                    titleColor: '#333',
                    bodyColor: '#555',
                    borderColor: '#e0e0e0',
                    borderWidth: 1,
                    titleFont: {
                        weight: 'bold'
                    },
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            return `Views: ${context.raw}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        display: false
                    }
                }
            }
        }
    });
}

/**
 * Update analytics after changes
 */
function updateAnalytics() {
    // This would make API calls to update statistics in a real application
    // For demo, we'll just update the counts directly
    const totalCaseStudies = document.querySelectorAll('.case-studies-table tbody tr').length;
    const totalCaseStudiesElement = document.querySelector('.stats-cards .stat-card:first-child .stat-content h3');

    if (totalCaseStudiesElement) {
        totalCaseStudiesElement.textContent = totalCaseStudies;
    }
}
