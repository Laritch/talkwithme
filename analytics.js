/**
 * Expert Analytics Dashboard
 * Handles data visualization and analytics interactions
 */

import expertAPI from './api/expertProfileAPI.js';

document.addEventListener('DOMContentLoaded', () => {
    initTimeframeSelector();
    initTabs();
    initCharts();
    initTooltips();
});

/**
 * Initialize timeframe selector
 */
function initTimeframeSelector() {
    const timeframeButtons = document.querySelectorAll('.timeframe-btn');

    timeframeButtons.forEach(button => {
        button.addEventListener('click', async () => {
            // Update active button
            timeframeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Get selected timeframe
            const timeframe = button.dataset.timeframe;

            // Show loading state
            document.querySelectorAll('.summary-card .card-value').forEach(value => {
                value.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            });

            try {
                // Fetch analytics data for selected timeframe
                const analyticsData = await expertAPI.getAnalytics(timeframe);

                // Update summary cards
                updateSummaryCards(analyticsData);

                // Update charts
                updateCharts(analyticsData);

                // Update content performance tables
                updateContentPerformance(analyticsData);

            } catch (error) {
                console.error('Error loading analytics:', error);
                showNotification('Failed to load analytics data. Please try again.', 'error');
            }
        });
    });

    // Refresh button
    const refreshButton = document.querySelector('.analytics-actions .btn:nth-child(2)');
    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            // Get current active timeframe
            const activeTimeframe = document.querySelector('.timeframe-btn.active');
            if (activeTimeframe) {
                // Trigger click to refresh data
                activeTimeframe.click();
            }
        });
    }

    // Export data button
    const exportButton = document.querySelector('.analytics-actions .btn:first-child');
    if (exportButton) {
        exportButton.addEventListener('click', async () => {
            try {
                // Get current timeframe
                const activeTimeframe = document.querySelector('.timeframe-btn.active');
                const timeframe = activeTimeframe ? activeTimeframe.dataset.timeframe : 'month';

                // Show loading state
                exportButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';
                exportButton.disabled = true;

                // In a real implementation, we would call an API endpoint to generate and download the export
                // For demo, we'll just simulate a delay
                setTimeout(() => {
                    // Reset button state
                    exportButton.innerHTML = '<i class="fas fa-download"></i> Export Data';
                    exportButton.disabled = false;

                    // Show success message
                    showNotification('Analytics data exported successfully.', 'success');
                }, 1500);

            } catch (error) {
                console.error('Error exporting data:', error);
                showNotification('Failed to export data. Please try again.', 'error');

                // Reset button state
                exportButton.innerHTML = '<i class="fas fa-download"></i> Export Data';
                exportButton.disabled = false;
            }
        });
    }
}

/**
 * Initialize tab functionality
 */
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;

            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Show selected tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabName}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });
}

/**
 * Initialize charts
 */
function initCharts() {
    // Sample data - in a real app, this would come from the API
    const sampleData = {
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        sessions: [18, 22, 25, 32, 38, 42, 48, 52, 45, 48, 58, 62],
        revenue: [3600, 4400, 5000, 6400, 7600, 8400, 9600, 10400, 9000, 9600, 11600, 12400]
    };

    // Initialize revenue chart (line chart)
    const revenueChartCtx = document.getElementById('revenueChart')?.getContext('2d');
    if (revenueChartCtx) {
        window.revenueChart = new Chart(revenueChartCtx, {
            type: 'line',
            data: {
                labels: sampleData.months,
                datasets: [
                    {
                        label: 'Sessions',
                        data: sampleData.sessions,
                        borderColor: '#4285F4',
                        backgroundColor: 'rgba(66, 133, 244, 0.1)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true,
                        yAxisID: 'y-sessions'
                    },
                    {
                        label: 'Revenue',
                        data: sampleData.revenue,
                        borderColor: '#34a853',
                        backgroundColor: 'rgba(52, 168, 83, 0.1)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true,
                        yAxisID: 'y-revenue'
                    }
                ]
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
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.datasetIndex === 1) {
                                    label += '$' + context.parsed.y.toLocaleString();
                                } else {
                                    label += context.parsed.y;
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    'y-sessions': {
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Sessions'
                        },
                        beginAtZero: true,
                        grid: {
                            display: true,
                            drawBorder: false
                        }
                    },
                    'y-revenue': {
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Revenue ($)'
                        },
                        beginAtZero: true,
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Initialize booking sources chart (pie chart)
    const sourcesChartCtx = document.getElementById('sourcesChart')?.getContext('2d');
    if (sourcesChartCtx) {
        window.sourcesChart = new Chart(sourcesChartCtx, {
            type: 'doughnut',
            data: {
                labels: ['Direct Profile', 'Featured Posts', 'Live Q&A', 'Search Results', 'Referrals'],
                datasets: [{
                    data: [45, 25, 15, 10, 5],
                    backgroundColor: [
                        '#4285F4', // blue
                        '#34a853', // green
                        '#fbbc05', // yellow
                        '#ea4335', // red
                        '#9c27b0'  // purple
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
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
                                const value = context.parsed || 0;
                                return `${label}: ${value}%`;
                            }
                        }
                    }
                },
                cutout: '70%',
                animation: {
                    animateScale: true
                }
            }
        });
    }

    // Initialize client retention chart (bar chart)
    const retentionChartCtx = document.getElementById('retentionChart')?.getContext('2d');
    if (retentionChartCtx) {
        window.retentionChart = new Chart(retentionChartCtx, {
            type: 'bar',
            data: {
                labels: ['1 Session', '2-3 Sessions', '4-5 Sessions', '6+ Sessions'],
                datasets: [{
                    label: 'Clients',
                    data: [35, 25, 18, 22],
                    backgroundColor: [
                        'rgba(66, 133, 244, 0.7)',
                        'rgba(66, 133, 244, 0.8)',
                        'rgba(66, 133, 244, 0.9)',
                        'rgba(66, 133, 244, 1)'
                    ],
                    borderWidth: 0,
                    borderRadius: 5
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
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y || 0;
                                return `${value}% of clients`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 40,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            borderDash: [3, 3]
                        }
                    }
                }
            }
        });
    }
}

/**
 * Update summary cards with new data
 * @param {Object} data - Analytics data
 */
function updateSummaryCards(data) {
    // In a real implementation, this data would come from the API
    // For demo, we'll just update with sample data

    // Sample data
    const summaryData = {
        totalSessions: { value: '128', change: 14, direction: 'up' },
        totalRevenue: { value: '$12,480', change: 8, direction: 'up' },
        averageRating: { value: '4.9/5', change: 0, direction: 'neutral' },
        profileViews: { value: '3,245', change: 23, direction: 'up' }
    };

    // Update summary cards
    const summaryCards = document.querySelectorAll('.summary-card');

    if (summaryCards.length >= 4) {
        // Total Sessions
        updateCardValue(summaryCards[0], summaryData.totalSessions);

        // Total Revenue
        updateCardValue(summaryCards[1], summaryData.totalRevenue);

        // Average Rating
        updateCardValue(summaryCards[2], summaryData.averageRating);

        // Profile Views
        updateCardValue(summaryCards[3], summaryData.profileViews);
    }
}

/**
 * Update a summary card with new data
 * @param {HTMLElement} card - The card element
 * @param {Object} data - Card data
 */
function updateCardValue(card, data) {
    const valueEl = card.querySelector('.card-value');
    const changeEl = card.querySelector('.card-change');

    if (valueEl) {
        valueEl.textContent = data.value;
    }

    if (changeEl) {
        changeEl.className = `card-change ${data.direction}`;
        const iconClass = data.direction === 'up' ? 'fa-arrow-up' :
                         data.direction === 'down' ? 'fa-arrow-down' : 'fa-minus';

        changeEl.innerHTML = `<i class="fas ${iconClass}"></i> ${data.change}% from previous period`;
    }
}

/**
 * Update charts with new data
 * @param {Object} data - Analytics data
 */
function updateCharts(data) {
    // In a real implementation, we would update charts with data from API
    // For demo purposes, we'll simulate chart updates

    // Simulate updated data for revenue chart
    if (window.revenueChart) {
        // Get current active timeframe for conditional logic
        const activeTimeframe = document.querySelector('.timeframe-btn.active')?.dataset.timeframe;

        // Different data based on timeframe
        let labels, sessions, revenue;

        switch (activeTimeframe) {
            case 'week':
                labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                sessions = [4, 7, 5, 8, 6, 3, 5];
                revenue = [800, 1400, 1000, 1600, 1200, 600, 1000];
                break;
            case 'quarter':
                labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6',
                          'Week 7', 'Week 8', 'Week 9', 'Week 10', 'Week 11', 'Week 12'];
                sessions = [12, 14, 16, 18, 15, 17, 20, 22, 19, 21, 24, 26];
                revenue = [2400, 2800, 3200, 3600, 3000, 3400, 4000, 4400, 3800, 4200, 4800, 5200];
                break;
            case 'year':
                labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                sessions = [18, 22, 25, 32, 38, 42, 48, 52, 45, 48, 58, 62];
                revenue = [3600, 4400, 5000, 6400, 7600, 8400, 9600, 10400, 9000, 9600, 11600, 12400];
                break;
            case 'all':
                labels = ['2019', '2020', '2021', '2022', '2023'];
                sessions = [120, 240, 380, 520, 640];
                revenue = [24000, 48000, 76000, 104000, 128000];
                break;
            default: // month
                labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
                sessions = [8, 12, 15, 10];
                revenue = [1600, 2400, 3000, 2000];
        }

        // Update chart data
        window.revenueChart.data.labels = labels;
        window.revenueChart.data.datasets[0].data = sessions;
        window.revenueChart.data.datasets[1].data = revenue;

        // Update chart
        window.revenueChart.update();
    }

    // Update sources chart (simulated)
    if (window.sourcesChart) {
        // For demo, we'll just keep the same data
        window.sourcesChart.update();
    }

    // Update retention chart (simulated)
    if (window.retentionChart) {
        // For demo, we'll just keep the same data
        window.retentionChart.update();
    }
}

/**
 * Update content performance tables
 * @param {Object} data - Analytics data
 */
function updateContentPerformance(data) {
    // In a real implementation, we would update tables with data from API
    // For demo purposes, we'll leave tables as is
}

/**
 * Initialize tooltips
 */
function initTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');

    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            const tooltipText = element.dataset.tooltip;

            // Create tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = tooltipText;

            // Position tooltip
            const rect = element.getBoundingClientRect();
            tooltip.style.left = rect.left + (rect.width / 2) + 'px';
            tooltip.style.top = rect.top - 10 + 'px';

            // Add to document
            document.body.appendChild(tooltip);

            // Show tooltip with animation
            setTimeout(() => {
                tooltip.classList.add('show');
            }, 10);

            // Store tooltip reference
            element.tooltip = tooltip;
        });

        element.addEventListener('mouseleave', () => {
            // Hide and remove tooltip
            if (element.tooltip) {
                element.tooltip.classList.remove('show');
                setTimeout(() => {
                    if (element.tooltip) {
                        element.tooltip.remove();
                        element.tooltip = null;
                    }
                }, 300);
            }
        });
    });
}

/**
 * Show a notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info)
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        </div>
        <div class="notification-message">${message}</div>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;

    // Add to document
    document.body.appendChild(notification);

    // Show with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Remove after timeout
    const timeout = setTimeout(() => {
        removeNotification(notification);
    }, 5000);

    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        clearTimeout(timeout);
        removeNotification(notification);
    });
}

/**
 * Remove a notification with animation
 * @param {HTMLElement} notification - Notification element
 */
function removeNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
        notification.remove();
    }, 300);
}
