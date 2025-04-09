/**
 * Payment Analytics Dashboard
 *
 * Handles analytics data visualization and dispute management
 * for the admin dashboard.
 */

// Initialize the dashboard when document is ready
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is authenticated and has admin privileges
  checkAdminAuth();

  // Initialize date range picker
  initDateRangePicker();

  // Fetch and display analytics data
  fetchAnalyticsData();

  // Initialize charts
  initCharts();

  // Load disputes table
  loadDisputes();

  // Set up event listeners
  setupEventListeners();
});

/**
 * Check if user is authenticated and has admin privileges
 */
function checkAdminAuth() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  if (!token) {
    window.location.href = '/admin/login.html?redirect=' + encodeURIComponent(window.location.pathname);
    return;
  }

  // Update admin name
  const adminName = document.getElementById('admin-name');
  if (adminName) {
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    adminName.textContent = user.name || 'Admin User';
  }
}

/**
 * Initialize date range picker
 */
function initDateRangePicker() {
  const dateRangeInput = document.getElementById('date-range');

  if (dateRangeInput) {
    // Set default date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    $(dateRangeInput).daterangepicker({
      startDate: startDate,
      endDate: endDate,
      ranges: {
        'Today': [moment(), moment()],
        'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
        'Last 7 Days': [moment().subtract(6, 'days'), moment()],
        'Last 30 Days': [moment().subtract(29, 'days'), moment()],
        'This Month': [moment().startOf('month'), moment().endOf('month')],
        'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
      }
    }, function(start, end) {
      // When date range changes, reload data
      fetchAnalyticsData({
        startDate: start.format('YYYY-MM-DD'),
        endDate: end.format('YYYY-MM-DD')
      });
    });
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Export data button
  const exportButton = document.getElementById('export-data');
  if (exportButton) {
    exportButton.addEventListener('click', exportAnalyticsData);
  }

  // Timeframe buttons for revenue chart
  const timeframeButtons = document.querySelectorAll('.timeframe-btn');
  timeframeButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Update active button
      timeframeButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');

      // Update chart with new timeframe
      updateRevenueChart(this.dataset.timeframe);
    });
  });

  // Refresh disputes button
  const refreshDisputesButton = document.getElementById('refresh-disputes');
  if (refreshDisputesButton) {
    refreshDisputesButton.addEventListener('click', loadDisputes);
  }

  // Dispute filter
  const disputeFilter = document.getElementById('dispute-filter');
  if (disputeFilter) {
    disputeFilter.addEventListener('change', function() {
      loadDisputes({ status: this.value });
    });
  }

  // Pagination buttons
  const prevPageButton = document.getElementById('prev-page');
  const nextPageButton = document.getElementById('next-page');

  if (prevPageButton) {
    prevPageButton.addEventListener('click', function() {
      if (!this.disabled) {
        const currentPage = parseInt(document.getElementById('current-page').textContent);
        loadDisputes({ page: currentPage - 1 });
      }
    });
  }

  if (nextPageButton) {
    nextPageButton.addEventListener('click', function() {
      const currentPage = parseInt(document.getElementById('current-page').textContent);
      const totalPages = parseInt(document.getElementById('total-pages').textContent);

      if (currentPage < totalPages) {
        loadDisputes({ page: currentPage + 1 });
      }
    });
  }

  // Modal event listeners
  const modal = document.getElementById('dispute-modal');
  const closeButtons = document.querySelectorAll('.modal-close, .modal-close-btn');

  closeButtons.forEach(button => {
    button.addEventListener('click', function() {
      modal.style.display = 'none';
    });
  });

  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });

  // Resolve dispute button
  const resolveDisputeButton = document.getElementById('resolve-dispute-btn');
  if (resolveDisputeButton) {
    resolveDisputeButton.addEventListener('click', resolveDispute);
  }
}

/**
 * Fetch analytics data from API
 * @param {Object} options - Filter options
 */
async function fetchAnalyticsData(options = {}) {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (!token) {
      return;
    }

    // Build query parameters
    const queryParams = new URLSearchParams();

    if (options.startDate) {
      queryParams.append('startDate', options.startDate);
    }

    if (options.endDate) {
      queryParams.append('endDate', options.endDate);
    }

    // Fetch data from API
    const response = await fetch(`/api/admin/analytics/payments?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch analytics data');
    }

    const data = await response.json();

    // Update analytics cards
    updateAnalyticsCards(data);

    // Update charts
    updateCharts(data);

    return data;
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    showError('Failed to fetch analytics data. Please try again later.');
  }
}

/**
 * Update analytics cards with data
 * @param {Object} data - Analytics data
 */
function updateAnalyticsCards(data) {
  // Update total revenue
  const totalRevenueElement = document.getElementById('total-revenue');
  if (totalRevenueElement && data.revenue) {
    totalRevenueElement.textContent = formatCurrency(data.revenue.total);
  }

  // Update revenue change percentage
  const revenueChangeElement = document.getElementById('revenue-change');
  if (revenueChangeElement && data.revenue) {
    const changeClass = data.revenue.change >= 0 ? 'positive' : 'negative';
    revenueChangeElement.textContent = `${Math.abs(data.revenue.change)}%`;
    revenueChangeElement.parentElement.className = `analytics-card-change ${changeClass}`;
    revenueChangeElement.parentElement.querySelector('i').className =
      data.revenue.change >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
  }

  // Update total transactions
  const totalTransactionsElement = document.getElementById('total-transactions');
  if (totalTransactionsElement && data.transactions) {
    totalTransactionsElement.textContent = data.transactions.total.toLocaleString();
  }

  // Update transactions change percentage
  const transactionsChangeElement = document.getElementById('transactions-change');
  if (transactionsChangeElement && data.transactions) {
    const changeClass = data.transactions.change >= 0 ? 'positive' : 'negative';
    transactionsChangeElement.textContent = `${Math.abs(data.transactions.change)}%`;
    transactionsChangeElement.parentElement.className = `analytics-card-change ${changeClass}`;
    transactionsChangeElement.parentElement.querySelector('i').className =
      data.transactions.change >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
  }

  // Update average order value
  const avgOrderValueElement = document.getElementById('avg-order-value');
  if (avgOrderValueElement && data.averageOrderValue) {
    avgOrderValueElement.textContent = formatCurrency(data.averageOrderValue.value);
  }

  // Update average order change percentage
  const avgOrderChangeElement = document.getElementById('avg-order-change');
  if (avgOrderChangeElement && data.averageOrderValue) {
    const changeClass = data.averageOrderValue.change >= 0 ? 'positive' : 'negative';
    avgOrderChangeElement.textContent = `${Math.abs(data.averageOrderValue.change)}%`;
    avgOrderChangeElement.parentElement.className = `analytics-card-change ${changeClass}`;
    avgOrderChangeElement.parentElement.querySelector('i').className =
      data.averageOrderValue.change >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
  }

  // Update open disputes
  const openDisputesElement = document.getElementById('open-disputes');
  if (openDisputesElement && data.disputes) {
    openDisputesElement.textContent = data.disputes.open.toLocaleString();
  }

  // Update disputes change percentage
  const disputesChangeElement = document.getElementById('disputes-change');
  if (disputesChangeElement && data.disputes) {
    // For disputes, negative change is positive (fewer disputes is better)
    const changeClass = data.disputes.change < 0 ? 'positive' : 'negative';
    disputesChangeElement.textContent = `${Math.abs(data.disputes.change)}%`;
    disputesChangeElement.parentElement.className = `analytics-card-change ${changeClass}`;
    disputesChangeElement.parentElement.querySelector('i').className =
      data.disputes.change < 0 ? 'fas fa-arrow-down' : 'fas fa-arrow-up';
  }
}

// Charts variables
let revenueChart, paymentMethodsChart, transactionStatusChart, revenueTypeChart;

/**
 * Initialize all charts
 */
function initCharts() {
  // Revenue over time chart
  const revenueChartCtx = document.getElementById('revenue-chart')?.getContext('2d');
  if (revenueChartCtx) {
    revenueChart = new Chart(revenueChartCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Revenue',
          data: [],
          borderColor: '#4a6cf7',
          backgroundColor: 'rgba(74, 108, 247, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return '$' + context.raw.toLocaleString();
              }
            }
          }
        }
      }
    });
  }

  // Payment methods chart
  const paymentMethodsChartCtx = document.getElementById('payment-methods-chart')?.getContext('2d');
  if (paymentMethodsChartCtx) {
    paymentMethodsChart = new Chart(paymentMethodsChartCtx, {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [
            '#4a6cf7',
            '#38b2ac',
            '#ed8936',
            '#805ad5',
            '#e53e3e'
          ],
          borderWidth: 0
        }]
      },
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
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: $${value.toLocaleString()} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  // Transaction status chart
  const transactionStatusChartCtx = document.getElementById('transaction-status-chart')?.getContext('2d');
  if (transactionStatusChartCtx) {
    transactionStatusChart = new Chart(transactionStatusChartCtx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Transactions',
          data: [],
          backgroundColor: [
            '#4a6cf7',
            '#38b2ac',
            '#ed8936',
            '#e53e3e',
            '#805ad5'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }

  // Revenue by type chart
  const revenueTypeChartCtx = document.getElementById('revenue-type-chart')?.getContext('2d');
  if (revenueTypeChartCtx) {
    revenueTypeChart = new Chart(revenueTypeChartCtx, {
      type: 'pie',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [
            '#4a6cf7',
            '#38b2ac',
            '#ed8936',
            '#805ad5'
          ],
          borderWidth: 0
        }]
      },
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
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: $${value.toLocaleString()} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }
}

/**
 * Update charts with new data
 * @param {Object} data - Analytics data
 */
function updateCharts(data) {
  // Update revenue over time chart
  if (revenueChart && data.revenueOverTime) {
    revenueChart.data.labels = data.revenueOverTime.map(item => item.date);
    revenueChart.data.datasets[0].data = data.revenueOverTime.map(item => item.amount);
    revenueChart.update();
  }

  // Update payment methods chart
  if (paymentMethodsChart && data.paymentMethods) {
    paymentMethodsChart.data.labels = data.paymentMethods.map(item => item.method);
    paymentMethodsChart.data.datasets[0].data = data.paymentMethods.map(item => item.amount);
    paymentMethodsChart.update();
  }

  // Update transaction status chart
  if (transactionStatusChart && data.transactionStatus) {
    transactionStatusChart.data.labels = data.transactionStatus.map(item => item.status);
    transactionStatusChart.data.datasets[0].data = data.transactionStatus.map(item => item.count);
    transactionStatusChart.update();
  }

  // Update revenue by type chart
  if (revenueTypeChart && data.revenueByType) {
    revenueTypeChart.data.labels = data.revenueByType.map(item => item.type);
    revenueTypeChart.data.datasets[0].data = data.revenueByType.map(item => item.amount);
    revenueTypeChart.update();
  }
}

/**
 * Update revenue chart based on timeframe
 * @param {string} timeframe - Selected timeframe
 */
async function updateRevenueChart(timeframe) {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (!token) {
      return;
    }

    // Fetch revenue data for selected timeframe
    const response = await fetch(`/api/admin/analytics/revenue?timeframe=${timeframe}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch revenue data');
    }

    const data = await response.json();

    // Update revenue chart
    if (revenueChart && data.revenueOverTime) {
      revenueChart.data.labels = data.revenueOverTime.map(item => item.date);
      revenueChart.data.datasets[0].data = data.revenueOverTime.map(item => item.amount);
      revenueChart.update();
    }
  } catch (error) {
    console.error('Error updating revenue chart:', error);
    showError('Failed to update revenue chart. Please try again later.');
  }
}

// Current disputes page state
let currentPage = 1;
let totalPages = 1;
let currentDisputes = [];

/**
 * Load disputes table
 * @param {Object} options - Filter options
 */
async function loadDisputes(options = {}) {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (!token) {
      return;
    }

    // Build query parameters
    const queryParams = new URLSearchParams();

    if (options.status && options.status !== 'all') {
      queryParams.append('status', options.status);
    }

    const page = options.page || 1;
    queryParams.append('page', page);
    queryParams.append('limit', 10);

    // Fetch disputes from API
    const response = await fetch(`/api/admin/disputes?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch disputes');
    }

    const data = await response.json();

    // Update disputes table
    renderDisputesTable(data.disputes);

    // Update pagination
    currentPage = page;
    totalPages = data.totalPages || 1;

    document.getElementById('current-page').textContent = currentPage;
    document.getElementById('total-pages').textContent = totalPages;

    document.getElementById('prev-page').disabled = currentPage <= 1;
    document.getElementById('next-page').disabled = currentPage >= totalPages;

    // Save current disputes for modal
    currentDisputes = data.disputes;
  } catch (error) {
    console.error('Error loading disputes:', error);
    showError('Failed to load disputes. Please try again later.');
  }
}

/**
 * Render disputes table
 * @param {Array} disputes - Disputes data
 */
function renderDisputesTable(disputes) {
  const tableBody = document.getElementById('disputes-table-body');

  if (!tableBody) {
    return;
  }

  if (!disputes || disputes.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="no-results">No disputes found</td>
      </tr>
    `;
    return;
  }

  let html = '';

  disputes.forEach(dispute => {
    html += `
      <tr>
        <td>${dispute.id}</td>
        <td>${dispute.customerName}</td>
        <td>${dispute.orderId}</td>
        <td>${formatCurrency(dispute.amount)}</td>
        <td>${dispute.reason}</td>
        <td>${formatDate(dispute.createdAt)}</td>
        <td><span class="status-badge ${dispute.status}">${dispute.status}</span></td>
        <td>
          <button class="btn btn-sm ${dispute.status === 'pending' ? 'btn-primary' : 'btn-secondary'}"
            onclick="openDisputeModal('${dispute.id}')"
            ${dispute.status !== 'pending' ? 'disabled' : ''}>
            ${dispute.status === 'pending' ? 'Resolve' : 'View'}
          </button>
        </td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;
}

/**
 * Open dispute resolution modal
 * @param {string} disputeId - Dispute ID
 */
function openDisputeModal(disputeId) {
  const dispute = currentDisputes.find(d => d.id === disputeId);

  if (!dispute) {
    return;
  }

  // Populate modal with dispute details
  document.getElementById('modal-dispute-id').textContent = dispute.id;
  document.getElementById('modal-order-id').textContent = dispute.orderId;
  document.getElementById('modal-customer').textContent = dispute.customerName;
  document.getElementById('modal-amount').textContent = formatCurrency(dispute.amount);
  document.getElementById('modal-reason').textContent = dispute.reason;
  document.getElementById('modal-created').textContent = formatDate(dispute.createdAt);
  document.getElementById('modal-evidence').textContent = dispute.evidence || 'No evidence provided';

  // Reset form
  document.getElementById('resolution-decision').value = '';
  document.getElementById('resolution-notes').value = '';

  // Disable resolve button if dispute is not pending
  const resolveButton = document.getElementById('resolve-dispute-btn');
  if (resolveButton) {
    resolveButton.disabled = dispute.status !== 'pending';
  }

  // Show modal
  document.getElementById('dispute-modal').style.display = 'block';
}

/**
 * Resolve a dispute
 */
async function resolveDispute() {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (!token) {
      return;
    }

    const disputeId = document.getElementById('modal-dispute-id').textContent;
    const orderId = document.getElementById('modal-order-id').textContent;
    const resolution = document.getElementById('resolution-decision').value;
    const notes = document.getElementById('resolution-notes').value;

    if (!resolution) {
      showError('Please select a resolution decision.');
      return;
    }

    // Disable resolve button
    const resolveButton = document.getElementById('resolve-dispute-btn');
    if (resolveButton) {
      resolveButton.disabled = true;
      resolveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    }

    // Send resolution to API
    const response = await fetch(`/api/admin/disputes/${orderId}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        resolution,
        notes
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to resolve dispute');
    }

    // Close modal
    document.getElementById('dispute-modal').style.display = 'none';

    // Show success message
    showSuccess('Dispute resolved successfully.');

    // Reload disputes
    loadDisputes({ page: currentPage });
  } catch (error) {
    console.error('Error resolving dispute:', error);
    showError(error.message || 'Failed to resolve dispute. Please try again later.');

    // Re-enable resolve button
    const resolveButton = document.getElementById('resolve-dispute-btn');
    if (resolveButton) {
      resolveButton.disabled = false;
      resolveButton.textContent = 'Resolve Dispute';
    }
  }
}

/**
 * Export analytics data
 */
async function exportAnalyticsData() {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (!token) {
      return;
    }

    // Get date range
    const dateRangeInput = document.getElementById('date-range');
    const dates = $(dateRangeInput).data('daterangepicker');

    const queryParams = new URLSearchParams();
    queryParams.append('startDate', dates.startDate.format('YYYY-MM-DD'));
    queryParams.append('endDate', dates.endDate.format('YYYY-MM-DD'));
    queryParams.append('format', 'csv');

    // Fetch data for export
    const response = await fetch(`/api/admin/analytics/export?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to export data');
    }

    // Create download link
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `payment-analytics-${dates.startDate.format('YYYY-MM-DD')}-to-${dates.endDate.format('YYYY-MM-DD')}.csv`;

    // Trigger download
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    showSuccess('Analytics data exported successfully.');
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    showError('Failed to export analytics data. Please try again later.');
  }
}

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency string
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

/**
 * Format date
 * @param {string} dateString - Date string
 * @returns {string} - Formatted date string
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  // Create toast notification
  const toast = document.createElement('div');
  toast.className = 'toast toast-error';
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas fa-exclamation-circle"></i>
      <span>${message}</span>
    </div>
    <button class="toast-close">&times;</button>
  `;

  document.body.appendChild(toast);

  // Show toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);

  // Auto-hide toast after 5 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 5000);

  // Close button
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  });
}

/**
 * Show success message
 * @param {string} message - Success message
 */
function showSuccess(message) {
  // Create toast notification
  const toast = document.createElement('div');
  toast.className = 'toast toast-success';
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas fa-check-circle"></i>
      <span>${message}</span>
    </div>
    <button class="toast-close">&times;</button>
  `;

  document.body.appendChild(toast);

  // Show toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);

  // Auto-hide toast after 5 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 5000);

  // Close button
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  });
}

// Expose functions for use in HTML
window.openDisputeModal = openDisputeModal;
