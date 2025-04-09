/**
 * Admin Analytics Dashboard
 * This script handles the analytics dashboard functionality including chart rendering
 * and data visualization for the admin message monitoring system.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard components
    initializeDateFilter();
    initializeCharts();
    initializeExportButtons();
    initializeFullscreenButtons();
});

/**
 * Initialize date range filter
 */
function initializeDateFilter() {
    const dateRangeSelect = document.getElementById('date-range');
    const customDateRange = document.querySelector('.custom-date-range');
    const dateFromInput = document.getElementById('date-from');
    const dateToInput = document.getElementById('date-to');
    const applyButton = document.getElementById('apply-date-range');

    if (!dateRangeSelect) return;

    // Set default dates for date inputs (today and 30 days ago)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    dateFromInput.valueAsDate = thirtyDaysAgo;
    dateToInput.valueAsDate = today;

    // Toggle custom date range visibility
    dateRangeSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            customDateRange.style.display = 'flex';
        } else {
            customDateRange.style.display = 'none';
        }
    });

    // Apply date filter
    applyButton.addEventListener('click', function() {
        let startDate, endDate;
        const selectedRange = dateRangeSelect.value;

        if (selectedRange === 'custom') {
            startDate = dateFromInput.valueAsDate;
            endDate = dateToInput.valueAsDate;
        } else {
            // Calculate date range based on selection
            endDate = new Date();
            startDate = new Date();

            switch (selectedRange) {
                case '7days':
                    startDate.setDate(endDate.getDate() - 7);
                    break;
                case '30days':
                    startDate.setDate(endDate.getDate() - 30);
                    break;
                case '90days':
                    startDate.setDate(endDate.getDate() - 90);
                    break;
                case 'year':
                    startDate.setDate(endDate.getDate() - 365);
                    break;
            }
        }

        // Format dates for display
        const formattedStart = startDate.toLocaleDateString();
        const formattedEnd = endDate.toLocaleDateString();

        // Update charts with new date range
        updateChartsWithDateRange(startDate, endDate);
        alert(`Filtering data from ${formattedStart} to ${formattedEnd}`);
    });
}

/**
 * Initialize charts
 */
function initializeCharts() {
    renderMessageVolumeChart();
    renderFlaggedCategoryChart();
    renderResponseTimeChart();
    renderAIAccuracyChart();
    renderReportCategoryChart();
    renderReportStatusChart();
    renderReportTrendChart();
}

/**
 * Render message volume trend chart
 */
function renderMessageVolumeChart() {
    const ctx = document.getElementById('message-volume-chart');
    if (!ctx) return;

    // Sample data - in a real app, this would come from an API
    const dates = getLast30Days();
    const totalMessages = generateRandomData(dates.length, 1200, 2000);
    const flaggedMessages = generateRandomData(dates.length, 5, 25);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Total Messages',
                    data: totalMessages,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Flagged Messages',
                    data: flaggedMessages,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Messages'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += context.parsed.y.toLocaleString();
                            return label;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Render flagged messages by category chart
 */
function renderFlaggedCategoryChart() {
    const ctx = document.getElementById('flagged-category-chart');
    if (!ctx) return;

    // Sample data - in a real app, this would come from an API
    const data = {
        labels: [
            'External Contact Attempt',
            'Harassment',
            'Personal Info Request',
            'Spam',
            'Inappropriate Content',
            'Scam Attempt'
        ],
        datasets: [{
            data: [42, 68, 35, 56, 30, 24],
            backgroundColor: [
                '#6366f1',
                '#f43f5e',
                '#10b981',
                '#f59e0b',
                '#8b5cf6',
                '#ef4444'
            ],
            hoverOffset: 4
        }]
    };

    new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Render response time performance chart
 */
function renderResponseTimeChart() {
    const ctx = document.getElementById('response-time-chart');
    if (!ctx) return;

    // Sample data - in a real app, this would come from an API
    const dates = getLast30Days();
    const responseTimeData = generateTrendingData(dates.length, 120, 90, -1); // Decreasing trend (improving)

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Avg. Response Time (minutes)',
                data: responseTimeData,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Minutes'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                },
                annotation: {
                    annotations: {
                        line1: {
                            type: 'line',
                            yMin: 60,
                            yMax: 60,
                            borderColor: 'rgb(255, 99, 132)',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            label: {
                                content: 'Target (60 min)',
                                display: true
                            }
                        }
                    }
                }
            }
        }
    });
}

/**
 * Render AI detection accuracy chart
 */
function renderAIAccuracyChart() {
    const ctx = document.getElementById('ai-accuracy-chart');
    if (!ctx) return;

    // Sample data - in a real app, this would come from an API
    const dates = getLast12Weeks();

    // Generate trending data with improvement
    const truePositiveRate = generateTrendingData(dates.length, 78, 92, 1); // Increasing trend
    const falsePositiveRate = generateTrendingData(dates.length, 22, 8, -1); // Decreasing trend

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'True Positive Rate',
                    data: truePositiveRate,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'False Positive Rate',
                    data: falsePositiveRate,
                    borderColor: '#f43f5e',
                    backgroundColor: 'rgba(244, 63, 94, 0.1)',
                    tension: 0.3,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Percentage (%)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Week'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

/**
 * Render report category chart
 */
function renderReportCategoryChart() {
    const ctx = document.getElementById('report-category-chart');
    if (!ctx) return;

    // Sample data - in a real app, this would come from an API
    const data = {
        labels: [
            'Harassment',
            'Inappropriate Content',
            'External Contact',
            'Fraud',
            'Fake Credentials',
            'Other'
        ],
        datasets: [{
            data: [42, 35, 28, 18, 15, 14],
            backgroundColor: [
                '#f43f5e',
                '#8b5cf6',
                '#6366f1',
                '#ef4444',
                '#f59e0b',
                '#64748b'
            ],
            hoverOffset: 4
        }]
    };

    new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    display: true
                }
            }
        }
    });
}

/**
 * Render report status chart
 */
function renderReportStatusChart() {
    const ctx = document.getElementById('report-status-chart');
    if (!ctx) return;

    // Sample data - in a real app, this would come from an API
    const data = {
        labels: ['Resolved', 'Pending', 'Dismissed', 'Escalated'],
        datasets: [{
            data: [87, 42, 23, 0],
            backgroundColor: [
                '#10b981',
                '#f59e0b',
                '#64748b',
                '#ef4444'
            ],
            hoverOffset: 4
        }]
    };

    new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    display: true
                }
            }
        }
    });
}

/**
 * Render report trend chart
 */
function renderReportTrendChart() {
    const ctx = document.getElementById('report-trend-chart');
    if (!ctx) return;

    // Sample data - in a real app, this would come from an API
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const last6Months = Array.from({length: 6}, (_, i) => {
        const monthIndex = (currentMonth - 5 + i) % 12;
        return months[monthIndex >= 0 ? monthIndex : monthIndex + 12];
    });

    const reportData = [8, 12, 15, 22, 35, 42]; // Increasing trend
    const resolvedData = [7, 10, 12, 18, 28, 35]; // Increasing trend

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: last6Months,
            datasets: [
                {
                    label: 'Reports Received',
                    data: reportData,
                    backgroundColor: '#6366f1',
                    borderColor: '#6366f1',
                    borderWidth: 1
                },
                {
                    label: 'Reports Resolved',
                    data: resolvedData,
                    backgroundColor: '#10b981',
                    borderColor: '#10b981',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Reports'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

/**
 * Initialize export buttons
 */
function initializeExportButtons() {
    const exportButtons = document.querySelectorAll('.card-actions .btn-icon[title="Download Data"]');
    const globalExportButton = document.getElementById('export-analytics');

    exportButtons.forEach(button => {
        button.addEventListener('click', function() {
            const cardTitle = this.closest('.card-header').querySelector('h3').textContent;
            alert(`Exporting data for: ${cardTitle}\nIn a real implementation, this would generate a CSV or Excel file.`);
        });
    });

    if (globalExportButton) {
        globalExportButton.addEventListener('click', function() {
            alert('Exporting complete analytics data...\nIn a real implementation, this would generate a comprehensive report file.');
        });
    }
}

/**
 * Initialize fullscreen buttons
 */
function initializeFullscreenButtons() {
    const fullscreenButtons = document.querySelectorAll('.card-actions .btn-icon[title="View Fullscreen"]');

    fullscreenButtons.forEach(button => {
        button.addEventListener('click', function() {
            const card = this.closest('.analytics-card');
            const chartId = card.querySelector('canvas')?.id;

            if (chartId) {
                alert(`Expanding chart: ${chartId} to fullscreen view.\nIn a real implementation, this would open a fullscreen modal.`);
            }
        });
    });
}

/**
 * Update charts with a new date range
 */
function updateChartsWithDateRange(startDate, endDate) {
    // In a real app, this would fetch new data from the API and update all charts
    // For this demo, we'll just log the date range
    console.log(`Updating charts with date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Simulate chart updates by refreshing the page after a brief delay
    setTimeout(() => {
        initializeCharts();
    }, 500);
}

/* Helper Functions */

/**
 * Get an array of the last 30 days as strings (MM/DD format)
 */
function getLast30Days() {
    const result = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        result.push(`${date.getMonth() + 1}/${date.getDate()}`);
    }

    return result;
}

/**
 * Get an array of the last 12 weeks as strings (e.g., "Week 1")
 */
function getLast12Weeks() {
    const result = [];

    for (let i = 12; i >= 0; i--) {
        result.push(`Week ${12 - i}`);
    }

    return result;
}

/**
 * Generate random data points within a specified range
 */
function generateRandomData(count, min, max) {
    return Array.from({length: count}, () => Math.floor(Math.random() * (max - min + 1)) + min);
}

/**
 * Generate trending data with a starting value, ending value, and direction
 */
function generateTrendingData(count, startValue, endValue, direction = 1) {
    const result = [];
    const step = (endValue - startValue) / (count - 1);

    for (let i = 0; i < count; i++) {
        // Add base trend
        const baseValue = startValue + (step * i);

        // Add some random variation
        const randomVariation = ((Math.random() * 10) - 5) * direction;

        // Ensure value is positive and within reasonable bounds
        const value = Math.max(0, baseValue + randomVariation);

        result.push(Math.round(value * 10) / 10); // Round to 1 decimal place
    }

    return result;
}
