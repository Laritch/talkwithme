/**
 * Payment Processor Analytics Dashboard
 *
 * Provides visualization and analysis of payment processor performance
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize UI components
  initDateRangePicker();
  initEventListeners();

  // Load data and initialize charts
  loadDashboardData();
});

/**
 * Initialize date range picker
 */
function initDateRangePicker() {
  const dateRangeInput = document.getElementById('date-range');
  if (dateRangeInput) {
    flatpickr(dateRangeInput, {
      mode: 'range',
      dateFormat: 'Y-m-d',
      maxDate: 'today',
      defaultDate: [
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        new Date()
      ],
      onChange: function(selectedDates) {
        if (selectedDates.length === 2) {
          loadDashboardData(selectedDates[0], selectedDates[1]);
        }
      }
    });
  }
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
  // Refresh data button
  const refreshButton = document.getElementById('refresh-data');
  if (refreshButton) {
    refreshButton.addEventListener('click', function() {
      loadDashboardData();
    });
  }

  // Export data button
  const exportButton = document.getElementById('export-data');
  if (exportButton) {
    exportButton.addEventListener('click', function() {
      exportAnalyticsData();
    });
  }

  // Volume view type selector
  const volumeViewSelect = document.getElementById('volume-view-type');
  if (volumeViewSelect) {
    volumeViewSelect.addEventListener('change', function() {
      updateProcessorVolumeChart(this.value);
    });
  }

  // Success rate view toggles
  const chartViewToggles = document.querySelectorAll('.chart-view-toggle');
  chartViewToggles.forEach(toggle => {
    toggle.addEventListener('click', function() {
      chartViewToggles.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      updateSuccessRateChart(this.dataset.view);
    });
  });

  // Region filter
  const regionFilter = document.getElementById('region-filter');
  if (regionFilter) {
    regionFilter.addEventListener('change', function() {
      updateRegionalDistributionChart(this.value);
    });
  }

  // Processor filter
  const processorFilter = document.getElementById('processor-filter');
  if (processorFilter) {
    processorFilter.addEventListener('change', function() {
      updatePaymentMethodsChart(this.value);
    });
  }

  // Error data export
  const downloadErrorButton = document.getElementById('download-error-data');
  if (downloadErrorButton) {
    downloadErrorButton.addEventListener('click', function() {
      exportErrorData();
    });
  }

  // Add processor comparison
  const addProcessorButton = document.getElementById('add-processor');
  if (addProcessorButton) {
    addProcessorButton.addEventListener('click', function() {
      showAddProcessorModal();
    });
  }
}

/**
 * Load dashboard data
 * @param {Date} startDate - Start date for data range
 * @param {Date} endDate - End date for data range
 */
async function loadDashboardData(startDate, endDate) {
  try {
    // Show loading states
    showLoadingState();

    // Format dates for API
    const formattedStartDate = startDate ? formatDateForAPI(startDate) : formatDateForAPI(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const formattedEndDate = endDate ? formatDateForAPI(endDate) : formatDateForAPI(new Date());

    // Fetch data from API
    const response = await fetch(`/api/admin/payment-analytics?startDate=${formattedStartDate}&endDate=${formattedEndDate}`);

    if (!response.ok) {
      throw new Error('Failed to fetch analytics data');
    }

    const data = await response.json();

    // Process and display data
    processAnalyticsData(data);
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    showErrorState(error.message);

    // Load mock data for development
    loadMockData();
  }
}

/**
 * Process analytics data and update UI
 * @param {Object} data - Analytics data from API
 */
function processAnalyticsData(data) {
  // Update metrics cards
  updateMetricsCards(data.summary);

  // Initialize charts
  initializeCharts(data);

  // Update error table
  updateErrorTable(data.errors);

  // Hide loading state
  hideLoadingState();
}

/**
 * Update metrics cards with data
 * @param {Object} summary - Summary metrics data
 */
function updateMetricsCards(summary) {
  // Total Transactions
  updateMetricCard('total-transactions', summary.totalTransactions, summary.totalTransactionsChange);

  // Transaction Volume
  updateMetricCard('transaction-volume', formatCurrency(summary.transactionVolume), summary.transactionVolumeChange);

  // Success Rate
  updateMetricCard('success-rate', formatPercentage(summary.successRate), summary.successRateChange);

  // Average Transaction
  updateMetricCard('avg-transaction', formatCurrency(summary.avgTransaction), summary.avgTransactionChange);
}

/**
 * Update a single metric card
 * @param {string} cardId - ID of the metric card
 * @param {string|number} value - Value to display
 * @param {number} changePercent - Percentage change
 */
function updateMetricCard(cardId, value, changePercent) {
  const card = document.getElementById(cardId);
  if (!card) return;

  const valueElement = card.querySelector('.metric-value');
  const changeElement = card.querySelector('.metric-change');
  const changeValueElement = changeElement.querySelector('span');
  const changeIconElement = changeElement.querySelector('i');

  valueElement.textContent = value;
  changeValueElement.textContent = `${Math.abs(changePercent).toFixed(1)}%`;

  if (changePercent > 0) {
    changeElement.className = 'metric-change positive';
    changeIconElement.className = 'fas fa-arrow-up';
  } else if (changePercent < 0) {
    changeElement.className = 'metric-change negative';
    changeIconElement.className = 'fas fa-arrow-down';
  } else {
    changeElement.className = 'metric-change neutral';
    changeIconElement.className = 'fas fa-minus';
  }
}

/**
 * Initialize all charts
 * @param {Object} data - Analytics data
 */
function initializeCharts(data) {
  // Initialize Transaction Volume Chart
  initProcessorVolumeChart(data.processorVolume);

  // Initialize Success Rate Chart
  initSuccessRateChart(data.successRates);

  // Initialize Regional Distribution Chart
  initRegionalDistributionChart(data.regionalDistribution);

  // Initialize Payment Methods Chart
  initPaymentMethodsChart(data.paymentMethods);
}

/**
 * Initialize processor volume chart
 * @param {Object} data - Processor volume data
 */
function initProcessorVolumeChart(data) {
  const ctx = document.getElementById('processor-volume-chart').getContext('2d');

  // Store data for later use
  window.processorVolumeData = data;

  window.processorVolumeChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Transaction Count',
        data: data.countData,
        backgroundColor: [
          '#4a6cf7',
          '#38b2ac',
          '#6b46c1',
          '#38a169',
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
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.raw.toLocaleString();
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return value.toLocaleString();
            }
          }
        }
      }
    }
  });
}

/**
 * Update processor volume chart
 * @param {string} viewType - View type (count or amount)
 */
function updateProcessorVolumeChart(viewType) {
  if (!window.processorVolumeChart || !window.processorVolumeData) return;

  const data = window.processorVolumeData;
  const chart = window.processorVolumeChart;

  chart.data.datasets[0].label = viewType === 'amount' ? 'Transaction Amount' : 'Transaction Count';
  chart.data.datasets[0].data = viewType === 'amount' ? data.amountData : data.countData;

  // Update y-axis formatting
  chart.options.scales.y.ticks.callback = function(value) {
    if (viewType === 'amount') {
      return '$' + value.toLocaleString();
    }
    return value.toLocaleString();
  };

  chart.update();
}

/**
 * Initialize success rate chart
 * @param {Object} data - Success rate data
 */
function initSuccessRateChart(data) {
  const ctx = document.getElementById('success-rate-chart').getContext('2d');

  // Store data for later use
  window.successRateData = data;

  window.successRateChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Success Rate (%)',
        data: data.percentageData,
        backgroundColor: [
          '#4a6cf7',
          '#38b2ac',
          '#6b46c1',
          '#38a169',
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
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.raw.toFixed(1) + '%';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          }
        }
      }
    }
  });
}

/**
 * Update success rate chart
 * @param {string} viewType - View type (percentage or absolute)
 */
function updateSuccessRateChart(viewType) {
  if (!window.successRateChart || !window.successRateData) return;

  const data = window.successRateData;
  const chart = window.successRateChart;

  chart.data.datasets[0].label = viewType === 'percentage' ? 'Success Rate (%)' : 'Success Count';
  chart.data.datasets[0].data = viewType === 'percentage' ? data.percentageData : data.absoluteData;

  // Update y-axis
  if (viewType === 'percentage') {
    chart.options.scales.y.max = 100;
    chart.options.scales.y.ticks.callback = function(value) {
      return value + '%';
    };
    chart.options.plugins.tooltip.callbacks.label = function(context) {
      return context.raw.toFixed(1) + '%';
    };
  } else {
    chart.options.scales.y.max = undefined;
    chart.options.scales.y.ticks.callback = function(value) {
      return value.toLocaleString();
    };
    chart.options.plugins.tooltip.callbacks.label = function(context) {
      return context.raw.toLocaleString();
    };
  }

  chart.update();
}

/**
 * Initialize regional distribution chart
 * @param {Object} data - Regional distribution data
 */
function initRegionalDistributionChart(data) {
  const ctx = document.getElementById('regional-distribution-chart').getContext('2d');

  // Store data for later use
  window.regionalData = data;

  window.regionalChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.all.labels,
      datasets: [{
        data: data.all.values,
        backgroundColor: [
          '#4a6cf7',
          '#38b2ac',
          '#6b46c1',
          '#38a169',
          '#e53e3e'
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
          position: 'right',
          labels: {
            boxWidth: 15,
            padding: 15
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${context.label}: ${percentage}% (${value.toLocaleString()})`;
            }
          }
        }
      }
    }
  });
}

/**
 * Update regional distribution chart
 * @param {string} region - Region to filter by
 */
function updateRegionalDistributionChart(region) {
  if (!window.regionalChart || !window.regionalData) return;

  const data = window.regionalData;
  const chart = window.regionalChart;

  if (data[region]) {
    chart.data.labels = data[region].labels;
    chart.data.datasets[0].data = data[region].values;
    chart.update();
  }
}

/**
 * Initialize payment methods chart
 * @param {Object} data - Payment methods data
 */
function initPaymentMethodsChart(data) {
  const ctx = document.getElementById('payment-methods-chart').getContext('2d');

  // Store data for later use
  window.paymentMethodsData = data;

  window.paymentMethodsChart = new Chart(ctx, {
    type: 'polarArea',
    data: {
      labels: data.all.labels,
      datasets: [{
        data: data.all.values,
        backgroundColor: [
          'rgba(74, 108, 247, 0.7)',
          'rgba(56, 178, 172, 0.7)',
          'rgba(107, 70, 193, 0.7)',
          'rgba(56, 161, 105, 0.7)',
          'rgba(229, 62, 62, 0.7)'
        ],
        borderWidth: 1,
        borderColor: [
          '#4a6cf7',
          '#38b2ac',
          '#6b46c1',
          '#38a169',
          '#e53e3e'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 15,
            padding: 10
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${context.label}: ${percentage}% (${value.toLocaleString()})`;
            }
          }
        }
      },
      scales: {
        r: {
          ticks: {
            display: false
          }
        }
      }
    }
  });
}

/**
 * Update payment methods chart
 * @param {string} processor - Processor to filter by
 */
function updatePaymentMethodsChart(processor) {
  if (!window.paymentMethodsChart || !window.paymentMethodsData) return;

  const data = window.paymentMethodsData;
  const chart = window.paymentMethodsChart;

  if (data[processor]) {
    chart.data.labels = data[processor].labels;
    chart.data.datasets[0].data = data[processor].values;
    chart.update();
  }
}

/**
 * Update error table with data
 * @param {Array} errors - Error data
 */
function updateErrorTable(errors) {
  const tableBody = document.querySelector('#error-table tbody');
  if (!tableBody) return;

  if (!errors || errors.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6" class="empty-data">No error data available</td></tr>';
    return;
  }

  let html = '';

  errors.forEach(error => {
    const trendIcon = error.trend > 0
      ? '<i class="fas fa-arrow-up" style="color: #e53e3e;"></i>'
      : (error.trend < 0
          ? '<i class="fas fa-arrow-down" style="color: #38a169;"></i>'
          : '<i class="fas fa-minus"></i>'
        );

    const trendClass = error.trend > 0 ? 'negative' : (error.trend < 0 ? 'positive' : 'neutral');

    html += `
      <tr>
        <td><span class="processor-badge ${error.processor}">${formatProcessorName(error.processor)}</span></td>
        <td>${error.type}</td>
        <td>${error.count.toLocaleString()}</td>
        <td>${error.rate.toFixed(2)}%</td>
        <td class="${trendClass}">${trendIcon} ${Math.abs(error.trend).toFixed(2)}%</td>
        <td>
          <button class="btn btn-sm btn-icon" data-action="view" data-error-id="${error.id}">
            <i class="fas fa-eye"></i>
          </button>
        </td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;

  // Add event listeners to buttons
  tableBody.querySelectorAll('button[data-action="view"]').forEach(button => {
    button.addEventListener('click', function() {
      const errorId = this.getAttribute('data-error-id');
      viewErrorDetails(errorId);
    });
  });
}

/**
 * Show loading state for dashboard
 */
function showLoadingState() {
  // Add loading state to metrics cards
  document.querySelectorAll('.metric-card .metric-value').forEach(el => {
    el.innerHTML = '<div class="shimmer">--</div>';
  });

  // Add loading overlay to charts
  document.querySelectorAll('.chart-wrapper').forEach(chart => {
    chart.classList.add('loading');
  });

  // Show loading in error table
  const tableBody = document.querySelector('#error-table tbody');
  if (tableBody) {
    tableBody.innerHTML = '<tr><td colspan="6" class="loading-data">Loading error data...</td></tr>';
  }
}

/**
 * Hide loading state for dashboard
 */
function hideLoadingState() {
  // Remove loading classes
  document.querySelectorAll('.loading').forEach(el => {
    el.classList.remove('loading');
  });
}

/**
 * Show error state
 * @param {string} message - Error message
 */
function showErrorState(message) {
  // Show error toast
  showToast(message, 'error');

  // Remove loading classes
  hideLoadingState();
}

/**
 * Show toast notification
 * @param {string} message - Toast message
 * @param {string} type - Toast type (success, error, warning)
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
      <span>${message}</span>
    </div>
    <button class="toast-close">&times;</button>
  `;

  document.body.appendChild(toast);

  // Add close functionality
  toast.querySelector('.toast-close').addEventListener('click', function() {
    document.body.removeChild(toast);
  });

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast);
    }
  }, 5000);
}

/**
 * Format date for API
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date
 */
function formatDateForAPI(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Format currency value
 * @param {number} value - Value to format
 * @returns {string} - Formatted currency string
 */
function formatCurrency(value) {
  return '$' + value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Format percentage value
 * @param {number} value - Value to format
 * @returns {string} - Formatted percentage string
 */
function formatPercentage(value) {
  return value.toFixed(1) + '%';
}

/**
 * Format processor name
 * @param {string} processor - Processor code
 * @returns {string} - Formatted processor name
 */
function formatProcessorName(processor) {
  const names = {
    'stripe': 'Stripe',
    'square': 'Square',
    'adyen': 'Adyen',
    'mpesa': 'M-Pesa',
    'razorpay': 'Razorpay'
  };

  return names[processor] || processor;
}

/**
 * Export analytics data
 */
function exportAnalyticsData() {
  // Implement export functionality
  alert('Export functionality will be implemented here');
}

/**
 * Export error data
 */
function exportErrorData() {
  // Implement export functionality
  alert('Export functionality will be implemented here');
}

/**
 * View error details
 * @param {string} errorId - Error ID to view
 */
function viewErrorDetails(errorId) {
  // Implement error details view
  alert(`View details for error ID: ${errorId}`);
}

/**
 * Show add processor modal
 */
function showAddProcessorModal() {
  // Implement add processor modal
  alert('Add processor modal will be implemented here');
}

/**
 * Load mock data for development
 */
function loadMockData() {
  const mockData = {
    summary: {
      totalTransactions: 18427,
      totalTransactionsChange: 12.5,
      transactionVolume: 892450.75,
      transactionVolumeChange: 15.2,
      successRate: 94.7,
      successRateChange: -0.8,
      avgTransaction: 48.43,
      avgTransactionChange: 2.3
    },
    processorVolume: {
      labels: ['Stripe', 'Square', 'Adyen', 'M-Pesa', 'Razorpay'],
      countData: [10245, 3854, 2156, 1482, 690],
      amountData: [512300, 168450, 124890, 34500, 52310.75]
    },
    successRates: {
      labels: ['Stripe', 'Square', 'Adyen', 'M-Pesa', 'Razorpay'],
      percentageData: [95.8, 93.2, 94.5, 98.7, 91.3],
      absoluteData: [9815, 3592, 2037, 1463, 630]
    },
    regionalDistribution: {
      all: {
        labels: ['North America', 'Europe', 'Africa', 'Asia', 'Others'],
        values: [8235, 5146, 2754, 1842, 450]
      },
      us: {
        labels: ['West', 'East', 'Midwest', 'South'],
        values: [3294, 2912, 1046, 983]
      },
      eu: {
        labels: ['Western Europe', 'Eastern Europe', 'Northern Europe', 'Southern Europe'],
        values: [2573, 1029, 926, 618]
      },
      africa: {
        labels: ['East Africa', 'West Africa', 'Southern Africa', 'North Africa'],
        values: [1652, 623, 275, 204]
      },
      asia: {
        labels: ['South Asia', 'East Asia', 'Southeast Asia', 'Others'],
        values: [921, 460, 369, 92]
      },
      others: {
        labels: ['Oceania', 'South America', 'Central America', 'Others'],
        values: [210, 145, 65, 30]
      }
    },
    paymentMethods: {
      all: {
        labels: ['Credit/Debit Card', 'Mobile Payment', 'Bank Transfer', 'Digital Wallet', 'Other'],
        values: [11056, 2948, 2212, 1842, 369]
      },
      stripe: {
        labels: ['Credit Card', 'Debit Card', 'Apple Pay', 'Google Pay', 'ACH'],
        values: [6147, 2561, 921, 410, 206]
      },
      square: {
        labels: ['Credit Card', 'Debit Card', 'Apple Pay', 'Google Pay'],
        values: [2119, 889, 577, 269]
      },
      adyen: {
        labels: ['Credit Card', 'Debit Card', 'SEPA Direct', 'iDEAL', 'Other'],
        values: [948, 754, 237, 142, 75]
      },
      mpesa: {
        labels: ['Mobile Money'],
        values: [1482]
      },
      razorpay: {
        labels: ['Credit Card', 'Debit Card', 'Net Banking', 'UPI', 'Wallet'],
        values: [186, 134, 112, 197, 61]
      }
    },
    errors: [
      {
        id: 'err1',
        processor: 'stripe',
        type: 'Card Declined',
        count: 284,
        rate: 2.77,
        trend: -0.18
      },
      {
        id: 'err2',
        processor: 'square',
        type: 'Payment Authentication Failed',
        count: 153,
        rate: 3.97,
        trend: 0.45
      },
      {
        id: 'err3',
        processor: 'adyen',
        type: 'Insufficient Funds',
        count: 87,
        rate: 4.04,
        trend: 0.12
      },
      {
        id: 'err4',
        processor: 'mpesa',
        type: 'Transaction Timeout',
        count: 11,
        rate: 0.74,
        trend: -0.23
      },
      {
        id: 'err5',
        processor: 'razorpay',
        type: 'Bank Connection Error',
        count: 42,
        rate: 6.09,
        trend: 1.21
      }
    ]
  };

  processAnalyticsData(mockData);
}
