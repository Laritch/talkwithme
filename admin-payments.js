/**
 * Admin Payments Interface
 * Manages the Financial Management Interface for the Admin Dashboard
 * - Revenue Analytics Charts
 * - Transaction Management
 * - Payment Gateway Monitoring
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initCharts();
    initDateRangePicker();
    initTransactionFilters();
    initTransactionTable();
    initPaymentGatewayMonitoring();
    initNotifications();
});

/**
 * Initialize Chart.js Charts
 */
function initCharts() {
    // Revenue Trends Chart
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    const revenueChart = new Chart(revenueCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Revenue',
                data: [12500, 15000, 18200, 20100, 22500, 25000, 28000, 27000, 30000, 32000, 30500, 33000],
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }, {
                label: 'Expenses',
                data: [10000, 12500, 14000, 16000, 17500, 19000, 21000, 20000, 22500, 24000, 23000, 25000],
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });

    // Revenue Period Select Event Listener
    document.getElementById('revenuePeriodSelect').addEventListener('change', function(e) {
        const period = e.target.value;
        // In a real app, this would fetch new data
        updateRevenueChart(revenueChart, period);
    });

    // Payment Methods Chart
    const paymentMethodsCtx = document.getElementById('paymentMethodsChart').getContext('2d');
    const paymentMethodsChart = new Chart(paymentMethodsCtx, {
        type: 'doughnut',
        data: {
            labels: ['Credit Card', 'PayPal', 'Bank Transfer', 'Crypto', 'Other'],
            datasets: [{
                data: [65, 20, 10, 3, 2],
                backgroundColor: [
                    '#007bff',
                    '#28a745',
                    '#ffc107',
                    '#17a2b8',
                    '#6c757d'
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
                }
            },
            cutout: '70%'
        }
    });

    // Refund Reasons Chart
    const refundReasonsCtx = document.getElementById('refundReasonsChart').getContext('2d');
    const refundReasonsChart = new Chart(refundReasonsCtx, {
        type: 'bar',
        data: {
            labels: ['Service Issue', 'Changed Mind', 'Duplicate', 'Expert Unavailable', 'Other'],
            datasets: [{
                label: 'Refund Reasons',
                data: [35, 25, 15, 15, 10],
                backgroundColor: '#dc3545',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

/**
 * Update the revenue chart based on selected period
 */
function updateRevenueChart(chart, period) {
    // Sample data for different periods
    const data = {
        daily: {
            labels: Array.from({length: 30}, (_, i) => `Day ${i+1}`),
            revenue: Array.from({length: 30}, () => Math.floor(Math.random() * 5000) + 1000),
            expenses: Array.from({length: 30}, () => Math.floor(Math.random() * 3000) + 500)
        },
        weekly: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10', 'Week 11', 'Week 12'],
            revenue: [12000, 15000, 14500, 18000, 17000, 19500, 22000, 20500, 25000, 28000, 27000, 30000],
            expenses: [9000, 11000, 10500, 14000, 13000, 15000, 17000, 16000, 19000, 21000, 20000, 23000]
        },
        monthly: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            revenue: [12500, 15000, 18200, 20100, 22500, 25000, 28000, 27000, 30000, 32000, 30500, 33000],
            expenses: [10000, 12500, 14000, 16000, 17500, 19000, 21000, 20000, 22500, 24000, 23000, 25000]
        }
    };

    // Update chart data
    chart.data.labels = data[period].labels;
    chart.data.datasets[0].data = data[period].revenue;
    chart.data.datasets[1].data = data[period].expenses;
    chart.update();
}

/**
 * Initialize DateRangePicker
 */
function initDateRangePicker() {
    $('#transaction-date-range').daterangepicker({
        opens: 'left',
        startDate: moment().subtract(29, 'days'),
        endDate: moment(),
        ranges: {
           'Today': [moment(), moment()],
           'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
           'Last 7 Days': [moment().subtract(6, 'days'), moment()],
           'Last 30 Days': [moment().subtract(29, 'days'), moment()],
           'This Month': [moment().startOf('month'), moment().endOf('month')],
           'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        }
    }, function(start, end, label) {
        // In a real app, this would refresh transaction data
        console.log(`Date range selected: ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}`);
    });
}

/**
 * Initialize Transaction Filters
 */
function initTransactionFilters() {
    // Apply Filters Button
    document.getElementById('apply-filters').addEventListener('click', function() {
        applyTransactionFilters();
    });

    // Reset Filters Button
    document.getElementById('reset-filters').addEventListener('click', function() {
        resetTransactionFilters();
    });

    // Search Button
    document.getElementById('search-btn').addEventListener('click', function() {
        applyTransactionFilters();
    });

    // Export Transactions Button
    document.getElementById('export-transactions-btn').addEventListener('click', function() {
        exportTransactions();
    });
}

/**
 * Apply transaction filters
 */
function applyTransactionFilters() {
    const type = document.getElementById('transaction-type').value;
    const status = document.getElementById('transaction-status').value;
    const minAmount = document.getElementById('min-amount').value;
    const maxAmount = document.getElementById('max-amount').value;
    const searchTerm = document.getElementById('transaction-search').value;
    const dateRange = $('#transaction-date-range').val();

    console.log('Applying filters:', {
        type,
        status,
        minAmount,
        maxAmount,
        searchTerm,
        dateRange
    });

    // In a real app, this would fetch filtered data from the server
    // For demo, just show a notification
    showNotification('Filters applied', 'Transaction filters have been updated');
}

/**
 * Reset transaction filters
 */
function resetTransactionFilters() {
    document.getElementById('transaction-type').value = 'all';
    document.getElementById('transaction-status').value = 'all';
    document.getElementById('min-amount').value = '';
    document.getElementById('max-amount').value = '';
    document.getElementById('transaction-search').value = '';

    // Reset date range to last 30 days
    $('#transaction-date-range').data('daterangepicker').setStartDate(moment().subtract(29, 'days'));
    $('#transaction-date-range').data('daterangepicker').setEndDate(moment());

    // In a real app, this would reset to default data
    showNotification('Filters reset', 'Transaction filters have been reset to defaults');
}

/**
 * Export transactions to CSV/Excel
 */
function exportTransactions() {
    // In a real app, this would generate a file for download
    showNotification('Export started', 'Your transaction export is being prepared');

    // Simulate download delay
    setTimeout(() => {
        showNotification('Export ready', 'Your transaction export is ready for download', 'success');
    }, 2000);
}

/**
 * Initialize Transaction Table
 */
function initTransactionTable() {
    // Select All Checkbox
    const selectAllCheckbox = document.getElementById('select-all-transactions');
    const transactionCheckboxes = document.querySelectorAll('.transaction-checkbox');

    selectAllCheckbox.addEventListener('change', function() {
        transactionCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
    });

    // Individual checkboxes affect select all status
    transactionCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const allChecked = Array.from(transactionCheckboxes).every(c => c.checked);
            const someChecked = Array.from(transactionCheckboxes).some(c => c.checked);

            selectAllCheckbox.checked = allChecked;
            selectAllCheckbox.indeterminate = someChecked && !allChecked;
        });
    });

    // View details buttons
    document.querySelectorAll('.table-actions .fa-eye').forEach(button => {
        button.parentElement.addEventListener('click', function() {
            // Get the transaction ID from the row
            const row = this.closest('tr');
            const transactionId = row.querySelector('.transaction-checkbox').dataset.id;
            openTransactionDetails(transactionId);
        });
    });
}

/**
 * Open transaction details modal
 */
function openTransactionDetails(transactionId) {
    // Get the modal
    const modal = document.getElementById('transaction-detail-modal');
    const container = document.getElementById('transaction-detail-container');
    const actionBtn = document.getElementById('transaction-action-btn');

    // In a real app, we would fetch transaction details from API
    // For demo, generate mockup data
    const transaction = getMockTransaction(transactionId);

    // Populate modal content
    container.innerHTML = generateTransactionDetailsHTML(transaction);

    // Set appropriate action button text based on transaction type
    if (transaction.type === 'payment') {
        actionBtn.textContent = 'Process Refund';
    } else if (transaction.type === 'refund') {
        actionBtn.textContent = 'View Original Payment';
    } else if (transaction.type === 'payout') {
        actionBtn.textContent = transaction.status === 'pending' ? 'Process Now' : 'Issue Receipt';
    }

    // Show the modal
    modal.style.display = 'block';

    // Close button functionality
    const closeBtn = modal.querySelector('.modal-close');
    const closeModalBtn = document.getElementById('close-modal-btn');

    closeBtn.onclick = function() {
        modal.style.display = 'none';
    };

    closeModalBtn.onclick = function() {
        modal.style.display = 'none';
    };

    // Close modal when clicking outside content
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

/**
 * Get mock transaction data
 */
function getMockTransaction(transactionId) {
    // Mock transactions for demo
    const transactions = {
        'txn_12345': {
            id: 'txn_12345',
            date: 'April 2, 2023 14:30:15',
            type: 'payment',
            user: {
                name: 'Emily Davis',
                email: 'emily.davis@example.com',
                image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330'
            },
            description: 'Business Strategy Consultation',
            amount: 350.00,
            fee: 10.50,
            net: 339.50,
            status: 'completed',
            paymentMethod: 'Visa ending in 4242',
            notes: 'Customer requested detailed receipt for tax purposes'
        },
        'txn_12346': {
            id: 'txn_12346',
            date: 'April 2, 2023 15:45:22',
            type: 'refund',
            user: {
                name: 'Michael Brown',
                email: 'mbrown@example.com',
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d'
            },
            description: 'Refund: Marketing Consultation',
            amount: 200.00,
            fee: -6.00,
            net: -194.00,
            status: 'completed',
            paymentMethod: 'Original: Mastercard ending in 5555',
            notes: 'Customer was unavailable for scheduled session',
            originalTransaction: 'txn_12300'
        },
        'txn_12347': {
            id: 'txn_12347',
            date: 'April 3, 2023 09:15:37',
            type: 'payout',
            user: {
                name: 'James Wilson',
                email: 'jwilson@example.com',
                image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a'
            },
            description: 'Expert Payout - March 2023',
            amount: 1250.00,
            fee: 0,
            net: 1250.00,
            status: 'pending',
            paymentMethod: 'Bank account ending in 7890',
            notes: 'Scheduled payout for monthly expert earnings'
        },
        'txn_12348': {
            id: 'txn_12348',
            date: 'April 3, 2023 10:22:05',
            type: 'payment',
            user: {
                name: 'Robert Chen',
                email: 'rchen@example.com',
                image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d'
            },
            description: 'Financial Planning Session',
            amount: 425.00,
            fee: 12.75,
            net: 412.25,
            status: 'failed',
            paymentMethod: 'Visa ending in 1234',
            notes: 'Payment failed due to insufficient funds'
        }
    };

    return transactions[transactionId] || {
        id: transactionId,
        date: 'Unknown date',
        type: 'unknown',
        user: { name: 'Unknown user', email: 'unknown', image: 'default-avatar.png' },
        description: 'Unknown transaction',
        amount: 0,
        fee: 0,
        net: 0,
        status: 'unknown',
        paymentMethod: 'Unknown method',
        notes: 'No details available'
    };
}

/**
 * Generate transaction details HTML
 */
function generateTransactionDetailsHTML(transaction) {
    return `
        <div class="transaction-detail">
            <div class="detail-row">
                <div class="detail-label">Transaction ID:</div>
                <div class="detail-value">${transaction.id}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Date & Time:</div>
                <div class="detail-value">${transaction.date}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Type:</div>
                <div class="detail-value">
                    <span class="badge ${transaction.type}">${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</span>
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-label">User:</div>
                <div class="detail-value">
                    <div class="user-info">
                        <img src="${transaction.user.image}" alt="${transaction.user.name}" class="avatar-sm">
                        <div>
                            <div>${transaction.user.name}</div>
                            <div class="user-email">${transaction.user.email}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Description:</div>
                <div class="detail-value">${transaction.description}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Amount:</div>
                <div class="detail-value amount ${transaction.type === 'payment' ? 'positive' : 'negative'}">
                    ${transaction.type === 'payment' ? '+' : '-'}$${Math.abs(transaction.amount).toFixed(2)}
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Fee:</div>
                <div class="detail-value">$${Math.abs(transaction.fee).toFixed(2)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Net Amount:</div>
                <div class="detail-value amount ${transaction.net >= 0 ? 'positive' : 'negative'}">
                    ${transaction.net >= 0 ? '+' : '-'}$${Math.abs(transaction.net).toFixed(2)}
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Status:</div>
                <div class="detail-value">
                    <span class="status-badge ${transaction.status}">${transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}</span>
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Payment Method:</div>
                <div class="detail-value">${transaction.paymentMethod}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Notes:</div>
                <div class="detail-value">${transaction.notes}</div>
            </div>
            ${transaction.originalTransaction ? `
                <div class="detail-row">
                    <div class="detail-label">Original Transaction:</div>
                    <div class="detail-value"><a href="#" onclick="openTransactionDetails('${transaction.originalTransaction}'); return false;">${transaction.originalTransaction}</a></div>
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Initialize Payment Gateway Monitoring
 */
function initPaymentGatewayMonitoring() {
    const refreshBtn = document.getElementById('refresh-status-btn');

    refreshBtn.addEventListener('click', function() {
        refreshGatewayStatus();
    });
}

/**
 * Refresh gateway status data
 */
function refreshGatewayStatus() {
    // Add loading indicator to button
    const refreshBtn = document.getElementById('refresh-status-btn');
    const originalContent = refreshBtn.innerHTML;
    refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
    refreshBtn.disabled = true;

    // In a real app, this would fetch from an API
    // Simulate API delay
    setTimeout(() => {
        refreshBtn.innerHTML = originalContent;
        refreshBtn.disabled = false;
        showNotification('Status refreshed', 'Payment gateway statuses have been updated');

        // Simulate a random issue for demo purposes
        const gateways = document.querySelectorAll('.gateway-card');
        const randomGateway = gateways[Math.floor(Math.random() * gateways.length)];

        if (Math.random() > 0.7) {
            // 30% chance to show an issue
            const statusIndicator = randomGateway.querySelector('.status-indicator');
            const previousClass = statusIndicator.className.split(' ')[1];

            statusIndicator.classList.remove(previousClass);
            statusIndicator.classList.add('partial');
            statusIndicator.textContent = 'Partial Outage';

            // Add alert if it doesn't exist
            if (!randomGateway.querySelector('.gateway-alert')) {
                const alert = document.createElement('div');
                alert.className = 'gateway-alert';
                alert.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>Minor issues detected. Monitoring.</span>';
                randomGateway.appendChild(alert);

                showNotification('Gateway issue detected', `${randomGateway.querySelector('h3').textContent} is experiencing issues`, 'warning');
            }
        }
    }, 1500);
}

/**
 * Initialize Notifications
 */
function initNotifications() {
    // Set up notifications
    document.getElementById('notification-bell').addEventListener('click', function() {
        const panel = document.getElementById('notification-panel');
        panel.classList.toggle('show');
    });

    // Close panel when clicking outside
    document.addEventListener('click', function(event) {
        const bell = document.getElementById('notification-bell');
        const panel = document.getElementById('notification-panel');

        if (!bell.contains(event.target) && !panel.contains(event.target)) {
            panel.classList.remove('show');
        }
    });
}

/**
 * Show notification in the notification panel
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type (info, success, warning, error)
 */
function showNotification(title, message, type = 'info') {
    // Get notification list
    const notificationList = document.getElementById('notification-list');
    const emptyNotification = notificationList.querySelector('.empty-notifications');

    // Remove empty notification if it exists
    if (emptyNotification) {
        emptyNotification.remove();
    }

    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification-item ${type}`;

    // Add timestamp
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Set notification content
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas ${type === 'success' ? 'fa-check-circle' :
                         type === 'warning' ? 'fa-exclamation-triangle' :
                         type === 'error' ? 'fa-times-circle' :
                         'fa-info-circle'}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-header">
                <h4>${title}</h4>
                <span class="notification-time">${timestamp}</span>
            </div>
            <p>${message}</p>
        </div>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;

    // Add notification to list
    notificationList.prepend(notification);

    // Update counter
    const counter = document.getElementById('notification-counter');
    counter.textContent = parseInt(counter.textContent) + 1;
    counter.style.display = 'flex';

    // Add close button functionality
    notification.querySelector('.notification-close').addEventListener('click', function(e) {
        e.stopPropagation();
        notification.remove();

        // Update counter
        counter.textContent = parseInt(counter.textContent) - 1;

        // Hide counter if no notifications
        if (parseInt(counter.textContent) === 0) {
            counter.style.display = 'none';

            // Add empty notification
            notificationList.innerHTML = `
                <div class="empty-notifications">
                    <i class="fas fa-check-circle"></i>
                    <p>No new notifications</p>
                </div>
            `;
        }
    });

    // Highlight notification bell
    const bell = document.getElementById('notification-bell');
    bell.classList.add('active');

    // Remove highlight after 3 seconds
    setTimeout(() => {
        bell.classList.remove('active');
    }, 3000);
}
