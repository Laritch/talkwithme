/**
 * Admin Dashboard Main JavaScript
 *
 * This file handles the functionality of the admin dashboard including:
 * - Chart rendering
 * - Data loading & processing
 * - Filter controls
 * - Notification integration
 * - Interactive UI elements
 */

import { AdminNotificationHandler } from './services/admin-notification-handler.js';

// Dashboard state
const dashboardState = {
    // Date filters
    dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: new Date(),
        display: 'last30days'
    },
    // Chart instances
    charts: {
        revenue: null,
        userAcquisition: null,
        category: null
    },
    // Data caches
    data: {
        stats: null,
        experts: null,
        clients: null,
        bookings: null,
        activities: null
    },
    // UI state
    ui: {
        expertMetricSort: 'revenue', // 'revenue', 'bookings', 'rating'
        revenuePeriod: 'monthly', // 'daily', 'weekly', 'monthly'
        isLoading: false
    }
};

/**
 * Initialize the dashboard when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    initNotifications();
    initDateRangePicker();
    initEventListeners();
    loadDashboardData();
});

/**
 * Initialize the notification system
 */
function initNotifications() {
    AdminNotificationHandler.initNotificationHandler();
}

/**
 * Set up the date range picker
 */
function initDateRangePicker() {
    // Use jQuery DateRangePicker (included in HTML)
    $('#dateRangeBtn').daterangepicker({
        startDate: dashboardState.dateRange.start,
        endDate: dashboardState.dateRange.end,
        ranges: {
            'Today': [moment(), moment()],
            'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
            'Last 7 Days': [moment().subtract(6, 'days'), moment()],
            'Last 30 Days': [moment().subtract(29, 'days'), moment()],
            'This Month': [moment().startOf('month'), moment().endOf('month')],
            'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        }
    }, function(start, end, label) {
        // Update state
        dashboardState.dateRange.start = start.toDate();
        dashboardState.dateRange.end = end.toDate();
        dashboardState.dateRange.display = label;

        // Update UI
        document.getElementById('dateRangeText').textContent = label;

        // Reload data with new date range
        loadDashboardData();
    });
}

/**
 * Initialize event listeners for interactive elements
 */
function initEventListeners() {
    // Refresh data button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadDashboardData);
    }

    // Export dashboard button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportDashboard);
    }

    // Revenue period select
    const revenuePeriodSelect = document.getElementById('revenuePeriodSelect');
    if (revenuePeriodSelect) {
        revenuePeriodSelect.addEventListener('change', (e) => {
            dashboardState.ui.revenuePeriod = e.target.value;
            updateRevenueChart();
        });
    }

    // Expert metric select
    const expertMetricSelect = document.getElementById('expertMetricSelect');
    if (expertMetricSelect) {
        expertMetricSelect.addEventListener('change', (e) => {
            dashboardState.ui.expertMetricSort = e.target.value;
            sortExpertTable();
        });
    }
}

/**
 * Load dashboard data from API (mocked for demonstration)
 */
function loadDashboardData() {
    setLoading(true);

    // In a real application, this would make API calls to fetch the data
    // For demonstration, we'll use timeout to simulate API calls

    setTimeout(() => {
        // Generate mock data
        const mockData = generateMockData();

        // Update state with mock data
        dashboardState.data = mockData;

        // Update UI with the data
        updateDashboardUI();

        setLoading(false);
    }, 1000);
}

/**
 * Set loading state for the dashboard
 */
function setLoading(isLoading) {
    dashboardState.ui.isLoading = isLoading;

    // Update loading UI elements
    // In a real application, you would show/hide loading indicators
}

/**
 * Update the dashboard UI with the loaded data
 */
function updateDashboardUI() {
    // Update stat cards
    updateStatCards();

    // Initialize or update charts
    initializeCharts();

    // Update activity feed
    updateActivityFeed();

    // Update experts table
    updateExpertsTable();

    // Update system health metrics (simulated)
    // In a real application, this would use real-time data
}

/**
 * Update the stat cards with the latest data
 */
function updateStatCards() {
    const { stats } = dashboardState.data;

    // Update total users
    const totalUsersEl = document.getElementById('totalUsers');
    if (totalUsersEl && stats.totalUsers) {
        totalUsersEl.textContent = stats.totalUsers.toLocaleString();
    }

    // Update total revenue
    const totalRevenueEl = document.getElementById('totalRevenue');
    if (totalRevenueEl && stats.totalRevenue) {
        totalRevenueEl.textContent = `$${stats.totalRevenue.toLocaleString()}`;
    }

    // Update active bookings
    const activeBookingsEl = document.getElementById('activeBookings');
    if (activeBookingsEl && stats.activeBookings) {
        activeBookingsEl.textContent = stats.activeBookings.toLocaleString();
    }

    // Update average rating
    const avgRatingEl = document.getElementById('avgRating');
    if (avgRatingEl && stats.avgRating) {
        avgRatingEl.textContent = `${stats.avgRating.toFixed(1)} / 5.0`;
    }
}

/**
 * Initialize or update the charts
 */
function initializeCharts() {
    initRevenueChart();
    initUserAcquisitionChart();
    initCategoryChart();
}

/**
 * Initialize or update the revenue chart
 */
function initRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (dashboardState.charts.revenue) {
        dashboardState.charts.revenue.destroy();
    }

    // Prepare data based on selected period
    const { revenuePeriod } = dashboardState.ui;
    const { revenueData } = dashboardState.data;

    let labels, values;

    switch(revenuePeriod) {
        case 'daily':
            labels = revenueData.daily.labels;
            values = revenueData.daily.values;
            break;
        case 'weekly':
            labels = revenueData.weekly.labels;
            values = revenueData.weekly.values;
            break;
        case 'monthly':
        default:
            labels = revenueData.monthly.labels;
            values = revenueData.monthly.values;
            break;
    }

    // Create new chart
    dashboardState.charts.revenue = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Revenue',
                data: values,
                backgroundColor: 'rgba(74, 108, 247, 0.1)',
                borderColor: '#4a6cf7',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#4a6cf7',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return '$' + context.parsed.y.toLocaleString();
                        }
                    }
                },
                legend: {
                    display: false
                }
            }
        }
    });
}

/**
 * Update the revenue chart with new data
 */
function updateRevenueChart() {
    // If chart doesn't exist, create it
    if (!dashboardState.charts.revenue) {
        initRevenueChart();
        return;
    }

    // Prepare data based on selected period
    const { revenuePeriod } = dashboardState.ui;
    const { revenueData } = dashboardState.data;

    let labels, values;

    switch(revenuePeriod) {
        case 'daily':
            labels = revenueData.daily.labels;
            values = revenueData.daily.values;
            break;
        case 'weekly':
            labels = revenueData.weekly.labels;
            values = revenueData.weekly.values;
            break;
        case 'monthly':
        default:
            labels = revenueData.monthly.labels;
            values = revenueData.monthly.values;
            break;
    }

    // Update chart data
    dashboardState.charts.revenue.data.labels = labels;
    dashboardState.charts.revenue.data.datasets[0].data = values;

    // Update the chart
    dashboardState.charts.revenue.update();
}

/**
 * Initialize the user acquisition chart
 */
function initUserAcquisitionChart() {
    const ctx = document.getElementById('userAcquisitionChart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (dashboardState.charts.userAcquisition) {
        dashboardState.charts.userAcquisition.destroy();
    }

    // Get user acquisition data
    const { userAcquisition } = dashboardState.data;

    // Create new chart
    dashboardState.charts.userAcquisition = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: userAcquisition.labels,
            datasets: [{
                data: userAcquisition.values,
                backgroundColor: [
                    '#4a6cf7', // Organic
                    '#10b981', // Referral
                    '#f59e0b', // Social
                    '#6b7280', // Direct
                    '#3b82f6'  // Other
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });
}

/**
 * Initialize the category distribution chart
 */
function initCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (dashboardState.charts.category) {
        dashboardState.charts.category.destroy();
    }

    // Get category data
    const { categoryDistribution } = dashboardState.data;

    // Create new chart
    dashboardState.charts.category = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categoryDistribution.labels,
            datasets: [{
                label: 'Bookings',
                data: categoryDistribution.values,
                backgroundColor: '#4a6cf7',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            },
            barPercentage: 0.6
        }
    });
}

/**
 * Update the activity feed with the latest activities
 */
function updateActivityFeed() {
    // This would be implemented with real data in a production environment
    // For now, we'll use the mock data we already have
}

/**
 * Update the experts table with the latest expert data
 */
function updateExpertsTable() {
    const tbody = document.getElementById('topExpertsTableBody');
    if (!tbody) return;

    // Get sorted experts based on current metric
    const sortedExperts = sortExpertsByCurrentMetric();

    // Clear the table
    // tbody.innerHTML = '';

    // We'd populate the table with the sorted experts here
    // For now, we'll keep the existing demo data
}

/**
 * Sort the expert table based on the current metric
 */
function sortExpertTable() {
    // Get sorted experts
    const sortedExperts = sortExpertsByCurrentMetric();

    // Update the table
    updateExpertsTable();
}

/**
 * Sort experts based on the current metric selection
 */
function sortExpertsByCurrentMetric() {
    const { experts } = dashboardState.data;
    const { expertMetricSort } = dashboardState.ui;

    if (!experts) return [];

    // Clone the experts array to avoid modifying the original
    const sortedExperts = [...experts];

    // Sort based on selected metric
    switch (expertMetricSort) {
        case 'revenue':
            sortedExperts.sort((a, b) => b.revenue - a.revenue);
            break;
        case 'bookings':
            sortedExperts.sort((a, b) => b.bookings - a.bookings);
            break;
        case 'rating':
            sortedExperts.sort((a, b) => b.rating - a.rating);
            break;
    }

    return sortedExperts;
}

/**
 * Export dashboard as PDF/CSV (simulated)
 */
function exportDashboard() {
    alert('Dashboard export functionality would be implemented here. In a real application, this would generate a PDF or CSV with the dashboard data.');
}

/**
 * Generate mock data for dashboard demonstration
 */
function generateMockData() {
    return {
        stats: {
            totalUsers: 5243,
            totalRevenue: 128450,
            activeBookings: 342,
            avgRating: 4.8
        },
        revenueData: {
            daily: {
                labels: Array.from({ length: 30 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (30 - i - 1));
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }),
                values: Array.from({ length: 30 }, () => Math.floor(Math.random() * 5000) + 1000)
            },
            weekly: {
                labels: Array.from({ length: 12 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (12 - i - 1) * 7);
                    return `Week ${i + 1}`;
                }),
                values: Array.from({ length: 12 }, () => Math.floor(Math.random() * 20000) + 10000)
            },
            monthly: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                values: Array.from({ length: 12 }, () => Math.floor(Math.random() * 60000) + 40000)
            }
        },
        userAcquisition: {
            labels: ['Organic Search', 'Referral', 'Social Media', 'Direct', 'Other'],
            values: [2145, 1258, 932, 654, 254]
        },
        categoryDistribution: {
            labels: ['Business', 'Technology', 'Marketing', 'Finance', 'Legal', 'Health'],
            values: [430, 380, 340, 280, 210, 190]
        },
        experts: [
            {
                id: 'exp1',
                name: 'James Wilson',
                email: 'james.wilson@example.com',
                avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a',
                category: 'Business Strategy',
                bookings: 42,
                revenue: 12850,
                rating: 4.9,
                status: 'active'
            },
            {
                id: 'exp2',
                name: 'Amanda Rodriguez',
                email: 'amanda.r@example.com',
                avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e',
                category: 'Digital Marketing',
                bookings: 38,
                revenue: 10320,
                rating: 4.8,
                status: 'active'
            },
            {
                id: 'exp3',
                name: 'David Wilson',
                email: 'david.wilson@example.com',
                avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
                category: 'Web Development',
                bookings: 35,
                revenue: 9875,
                rating: 4.7,
                status: 'active'
            },
            {
                id: 'exp4',
                name: 'Sarah Johnson',
                email: 'sarah.j@example.com',
                avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
                category: 'Financial Planning',
                bookings: 32,
                revenue: 9120,
                rating: 4.6,
                status: 'active'
            }
        ]
    };
}
