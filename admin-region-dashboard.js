/**
 * Admin Region Dashboard JavaScript
 *
 * Implements advanced features for the region fee management dashboard:
 * - KPI metrics and performance tracking
 * - Currency conversion for fee comparison
 * - Historical change tracking
 * - Fee structure recommendations
 */

document.addEventListener('DOMContentLoaded', () => {
  // API endpoints
  const API_URL = '/api/admin/region-fees';

  // State
  let regionFees = [];
  let selectedRegionId = null;
  let dashboardCharts = {};

  // DOM elements - Dashboard
  const kpiTotalRegions = document.getElementById('kpi-total-regions');
  const kpiTotalRevenue = document.getElementById('kpi-total-revenue');
  const kpiAvgCommission = document.getElementById('kpi-avg-commission');
  const kpiTransactionVolume = document.getElementById('kpi-transaction-volume');
  const metricsTableBody = document.getElementById('metrics-table-body');
  const refreshMetricsBtn = document.getElementById('refresh-metrics');

  // DOM elements - Comparison Tool
  const comparisonForm = document.getElementById('currency-comparison-form');
  const comparisonRegionsSelect = document.getElementById('comparison-regions');
  const comparisonBaseCurrency = document.getElementById('comparison-base-currency');
  const comparisonResults = document.getElementById('comparison-results');

  // DOM elements - Recommendations
  const recommendationRegionSelect = document.getElementById('recommendation-region-select');
  const recommendationPlaceholder = document.getElementById('recommendation-placeholder');
  const recommendationContent = document.getElementById('recommendation-content');
  const recommendationAlert = document.getElementById('recommendation-alert');
  const applyRecommendationsBtn = document.getElementById('apply-recommendations');

  // DOM elements - History
  const historyRegionSelect = document.getElementById('history-region-select');
  const historyPlaceholder = document.getElementById('history-placeholder');
  const historyContent = document.getElementById('history-content');
  const historyStartDate = document.getElementById('history-start-date');
  const historyEndDate = document.getElementById('history-end-date');
  const applyDateFilterBtn = document.getElementById('apply-date-filter');
  const historyTimeline = document.getElementById('history-timeline');

  // Check if elements exist (some may not be loaded yet)
  const elementsLoaded =
    kpiTotalRegions &&
    comparisonForm &&
    recommendationRegionSelect &&
    historyRegionSelect;

  // Only initialize if elements are loaded
  if (elementsLoaded) {
    // Initialize the dashboard
    init();
  }

  /**
   * Initialize the dashboard
   */
  function init() {
    // Load region fees data
    loadRegionFees();

    // Setup event listeners
    setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  function setupEventListeners() {
    // Dashboard - Refresh metrics button
    if (refreshMetricsBtn) {
      refreshMetricsBtn.addEventListener('click', refreshAllMetrics);
    }

    // Currency Comparison Tool
    if (comparisonForm) {
      comparisonForm.addEventListener('submit', handleComparisonSubmit);
    }

    // Recommendations
    if (recommendationRegionSelect) {
      recommendationRegionSelect.addEventListener('change', loadRecommendations);
    }

    if (applyRecommendationsBtn) {
      applyRecommendationsBtn.addEventListener('click', applyRecommendations);
    }

    // History
    if (historyRegionSelect) {
      historyRegionSelect.addEventListener('change', loadHistory);
    }

    if (applyDateFilterBtn) {
      applyDateFilterBtn.addEventListener('click', applyHistoryDateFilter);
    }
  }

  /**
   * Load all region fees from the API
   */
  async function loadRegionFees() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch region fees');
      }

      regionFees = await response.json();

      // Update UI with the loaded data
      updateDashboardUI();
      populateRegionSelects();
    } catch (error) {
      console.error('Error loading region fees:', error);
      showMessage('error', `Error loading region fees: ${error.message}`);
    }
  }

  /**
   * Update dashboard UI with data
   */
  function updateDashboardUI() {
    updateKPIs();
    loadDashboardCharts();
    updateMetricsTable();
  }

  /**
   * Populate region select dropdowns
   */
  function populateRegionSelects() {
    // Helper function to populate a select element
    const populateSelect = (selectElement, includeEmptyOption = true) => {
      if (!selectElement) return;

      // Clear existing options
      selectElement.innerHTML = '';

      // Add empty option if requested
      if (includeEmptyOption) {
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'Select a region...';
        selectElement.appendChild(emptyOption);
      }

      // Add region options
      regionFees.forEach(fee => {
        const option = document.createElement('option');
        option.value = fee._id;
        option.textContent = `${fee.displayName} (${fee.region})`;
        selectElement.appendChild(option);
      });
    };

    // Populate all region selects
    populateSelect(comparisonRegionsSelect, false); // No empty option for multi-select
    populateSelect(recommendationRegionSelect);
    populateSelect(historyRegionSelect);
  }

  // Display a message (reusing the existing function from admin-region-fees.js)
  function showMessage(type, message) {
    const messageContainer = document.getElementById('message-container');
    if (!messageContainer) return;

    const alertClass = type === 'success' ? 'alert-success' :
                      type === 'error' ? 'alert-danger' :
                      type === 'warning' ? 'alert-warning' : 'alert-info';

    const alertIcon = type === 'success' ? 'fa-check-circle' :
                    type === 'error' ? 'fa-exclamation-circle' :
                    type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';

    messageContainer.innerHTML = `
      <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
        <i class="fas ${alertIcon} mr-2"></i> ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    `;

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      const alert = messageContainer.querySelector('.alert');
      if (alert) {
        $(alert).alert('close');
      }
    }, 5000);
  }

  // Format currency (reusing from admin-region-fees.js)
  function formatCurrency(value, currency, digits = 2) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(value);
  }

  /**
   * Update KPI indicators
   */
  function updateKPIs() {
    if (!kpiTotalRegions) return;

    // Total number of regions
    kpiTotalRegions.textContent = regionFees.length;

    // Calculate totals from metrics
    let totalRevenue = 0;
    let totalTransactions = 0;
    let totalCommissionSum = 0;
    let regionsWithMetrics = 0;

    regionFees.forEach(fee => {
      const metrics = fee.performanceMetrics || {};
      if (metrics.revenueLastMonth) {
        totalRevenue += metrics.revenueLastMonth;
        regionsWithMetrics++;
      }
      if (metrics.transactionVolume) {
        totalTransactions += metrics.transactionVolume;
      }
      if (metrics.effectiveCommissionRate) {
        totalCommissionSum += metrics.effectiveCommissionRate;
      }
    });

    // Update KPI displays
    kpiTotalRevenue.textContent = formatCurrency(totalRevenue, 'USD', 0);
    kpiTransactionVolume.textContent = totalTransactions.toLocaleString();

    // Calculate average commission across regions
    const avgCommission = regionsWithMetrics > 0
      ? (totalCommissionSum / regionsWithMetrics).toFixed(2)
      : "0.00";
    kpiAvgCommission.textContent = avgCommission + "%";
  }

  /**
   * Load dashboard charts
   */
  function loadDashboardCharts() {
    createRevenueByRegionChart();
    createCommissionDistributionChart();
  }

  /**
   * Create revenue by region chart
   */
  function createRevenueByRegionChart() {
    const canvas = document.getElementById('regionRevenueChart');
    if (!canvas) return;

    // Prepare data
    const regionsWithRevenue = regionFees
      .filter(fee => (fee.performanceMetrics?.revenueLastMonth || 0) > 0)
      .sort((a, b) =>
        (b.performanceMetrics?.revenueLastMonth || 0) -
        (a.performanceMetrics?.revenueLastMonth || 0)
      )
      .slice(0, 10); // Top 10 regions by revenue

    const labels = regionsWithRevenue.map(fee => fee.displayName);
    const revenueData = regionsWithRevenue.map(fee => fee.performanceMetrics?.revenueLastMonth || 0);
    const currencies = regionsWithRevenue.map(fee => fee.currency);

    // Destroy previous chart if it exists
    if (dashboardCharts.revenue) {
      dashboardCharts.revenue.destroy();
    }

    // Create the chart
    const ctx = canvas.getContext('2d');
    dashboardCharts.revenue = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Revenue (Last 30 Days)',
          data: revenueData,
          backgroundColor: 'rgba(78, 115, 223, 0.7)',
          borderColor: 'rgba(78, 115, 223, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true,
              callback: function(value) {
                return formatCurrency(value, 'USD', 0);
              }
            }
          }]
        },
        tooltips: {
          callbacks: {
            label: function(tooltipItem, data) {
              const index = tooltipItem.index;
              const currency = currencies[index];
              return `Revenue: ${formatCurrency(tooltipItem.yLabel, currency)}`;
            }
          }
        }
      }
    });
  }

  /**
   * Create commission distribution chart
   */
  function createCommissionDistributionChart() {
    const canvas = document.getElementById('commissionDistributionChart');
    if (!canvas) return;

    // Group regions by commission rate ranges
    const commissionRanges = {
      'Under 10%': 0,
      '10-15%': 0,
      '15-20%': 0,
      '20-25%': 0,
      'Over 25%': 0
    };

    regionFees.forEach(fee => {
      const commissionRate = fee.baseCommissionPercentage;

      if (commissionRate < 10) {
        commissionRanges['Under 10%']++;
      } else if (commissionRate < 15) {
        commissionRanges['10-15%']++;
      } else if (commissionRate < 20) {
        commissionRanges['15-20%']++;
      } else if (commissionRate < 25) {
        commissionRanges['20-25%']++;
      } else {
        commissionRanges['Over 25%']++;
      }
    });

    // Prepare data for chart
    const labels = Object.keys(commissionRanges);
    const data = Object.values(commissionRanges);
    const backgroundColor = [
      'rgba(78, 115, 223, 0.7)',
      'rgba(28, 200, 138, 0.7)',
      'rgba(54, 185, 204, 0.7)',
      'rgba(246, 194, 62, 0.7)',
      'rgba(231, 74, 59, 0.7)'
    ];

    // Destroy previous chart if it exists
    if (dashboardCharts.commission) {
      dashboardCharts.commission.destroy();
    }

    // Create the chart
    const ctx = canvas.getContext('2d');
    dashboardCharts.commission = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColor,
          hoverBackgroundColor: backgroundColor.map(color => color.replace('0.7', '0.9')),
          hoverBorderColor: 'rgba(234, 236, 244, 1)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        tooltips: {
          callbacks: {
            label: function(tooltipItem, data) {
              const dataset = data.datasets[tooltipItem.datasetIndex];
              const value = dataset.data[tooltipItem.index];
              const label = data.labels[tooltipItem.index];
              const total = dataset.data.reduce((acc, val) => acc + val, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} regions (${percentage}%)`;
            }
          }
        },
        legend: {
          position: 'bottom'
        },
        cutoutPercentage: 70
      }
    });
  }

  /**
   * Update metrics table
   */
  function updateMetricsTable() {
    if (!metricsTableBody) return;

    // Clear current table
    metricsTableBody.innerHTML = '';

    // Sort regions by revenue
    const sortedRegions = [...regionFees].sort((a, b) =>
      (b.performanceMetrics?.revenueLastMonth || 0) - (a.performanceMetrics?.revenueLastMonth || 0)
    );

    // Populate table
    sortedRegions.forEach(fee => {
      const metrics = fee.performanceMetrics || {};
      const row = document.createElement('tr');

      row.innerHTML = `
        <td>${fee.displayName}</td>
        <td>${metrics.expertCount || 0}</td>
        <td>${metrics.transactionVolume || 0}</td>
        <td>${formatCurrency(metrics.revenueLastMonth || 0, fee.currency)}</td>
        <td>${formatCurrency(metrics.avgTransactionSize || 0, fee.currency)}</td>
        <td>${metrics.effectiveCommissionRate?.toFixed(2) || fee.baseCommissionPercentage}%</td>
        <td>
          <button class="btn btn-sm btn-primary refresh-region-metrics" data-region="${fee.region}">
            <i class="fas fa-sync-alt"></i>
          </button>
          <button class="btn btn-sm btn-info view-recommendations" data-id="${fee._id}">
            <i class="fas fa-lightbulb"></i>
          </button>
        </td>
      `;

      // Add event listeners to buttons
      row.querySelector('.refresh-region-metrics').addEventListener('click', () => refreshRegionMetrics(fee.region));
      row.querySelector('.view-recommendations').addEventListener('click', () => viewRecommendations(fee._id));

      metricsTableBody.appendChild(row);
    });
  }

  /**
   * Refresh metrics for all regions
   */
  async function refreshAllMetrics() {
    try {
      showMessage('info', 'Refreshing metrics for all regions. This may take a moment...');

      // For each region, update metrics
      const updatePromises = regionFees.map(fee => refreshRegionMetrics(fee.region, false));

      // Wait for all updates to complete
      await Promise.all(updatePromises);

      // Reload all region data to get updated metrics
      await loadRegionFees();

      showMessage('success', 'All region metrics have been refreshed');
    } catch (error) {
      console.error('Error refreshing metrics:', error);
      showMessage('error', `Error refreshing metrics: ${error.message}`);
    }
  }

  /**
   * Refresh metrics for a specific region
   * @param {string} region - Region code
   * @param {boolean} showNotifications - Whether to show notifications
   * @returns {Promise} Result of the metrics update
   */
  async function refreshRegionMetrics(region, showNotifications = true) {
    try {
      if (showNotifications) {
        showMessage('info', `Refreshing metrics for ${region}...`);
      }

      const response = await fetch(`${API_URL}/${region}/metrics`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to refresh metrics');
      }

      const updatedMetrics = await response.json();

      if (showNotifications) {
        showMessage('success', `Metrics for ${region} have been refreshed`);
        // Reload all region data to show the updated metrics
        await loadRegionFees();
      }

      return updatedMetrics;
    } catch (error) {
      console.error(`Error refreshing metrics for ${region}:`, error);
      if (showNotifications) {
        showMessage('error', `Error refreshing metrics for ${region}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Navigate to recommendations tab for a specific region
   * @param {string} id - Region fee configuration ID
   */
  function viewRecommendations(id) {
    // Set the selected region in the recommendations tab
    if (recommendationRegionSelect) {
      recommendationRegionSelect.value = id;

      // Trigger the change event to load recommendations
      recommendationRegionSelect.dispatchEvent(new Event('change'));

      // Switch to the recommendations tab
      const recommendationsTab = document.getElementById('recommendations-tab');
      if (recommendationsTab) {
        recommendationsTab.click();
      }
    }
  }

  /**
   * Handle currency comparison form submission
   * @param {Event} event - Form submission event
   */
  async function handleComparisonSubmit(event) {
    event.preventDefault();

    // Get selected regions
    const selectedRegions = Array.from(comparisonRegionsSelect.selectedOptions).map(option => option.value);
    const baseCurrency = comparisonBaseCurrency.value;

    if (selectedRegions.length === 0) {
      showMessage('warning', 'Please select at least one region to compare');
      return;
    }

    try {
      showMessage('info', 'Loading comparison data...');

      // Get the region codes (not IDs) for the selected regions
      const regionCodes = selectedRegions.map(id => {
        const region = regionFees.find(fee => fee._id === id);
        return region ? region.region : null;
      }).filter(Boolean);

      // Call the API to compare regions
      const response = await fetch(`${API_URL}/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          regions: regionCodes,
          baseCurrency
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to compare regions');
      }

      const comparisonData = await response.json();

      // Display the comparison results
      displayComparisonResults(comparisonData);

      showMessage('success', 'Region comparison completed');
    } catch (error) {
      console.error('Error comparing regions:', error);
      showMessage('error', `Error comparing regions: ${error.message}`);
    }
  }

  /**
   * Display comparison results
   * @param {Object} data - Comparison data
   */
  function displayComparisonResults(data) {
    if (!comparisonResults) return;

    // Show results container
    comparisonResults.style.display = 'block';

    // Populate fee comparison table
    const feeComparisonBody = document.getElementById('fee-comparison-body');
    if (feeComparisonBody) {
      feeComparisonBody.innerHTML = '';

      data.regions.forEach(region => {
        const row = document.createElement('tr');

        row.innerHTML = `
          <td>${region.displayName} (${region.region})</td>
          <td>${formatCurrency(region.feeStructure.initialFee.converted.value, data.baseCurrency)}</td>
          <td>${region.feeStructure.baseCommissionPercentage}%</td>
          <td>${formatCurrency(region.feeStructure.transactionFee.converted.value, data.baseCurrency)}</td>
          <td>${region.feeStructure.effectiveCommissionRate.toFixed(2)}%</td>
        `;

        feeComparisonBody.appendChild(row);
      });
    }

    // Populate metrics comparison table
    const metricsComparisonBody = document.getElementById('metrics-comparison-body');
    if (metricsComparisonBody) {
      metricsComparisonBody.innerHTML = '';

      data.regions.forEach(region => {
        const row = document.createElement('tr');

        row.innerHTML = `
          <td>${region.displayName} (${region.region})</td>
          <td>${region.metrics.expertCount.toLocaleString()}</td>
          <td>${region.metrics.transactionVolume.toLocaleString()}</td>
          <td>${formatCurrency(region.metrics.revenueLastMonth.converted.value, data.baseCurrency)}</td>
          <td>${formatCurrency(region.metrics.avgRevenuePerExpert.converted.value, data.baseCurrency)}</td>
          <td>${formatCurrency(region.metrics.avgTransactionSize.converted.value, data.baseCurrency)}</td>
        `;

        metricsComparisonBody.appendChild(row);
      });
    }

    // Create comparison charts
    createComparisonCharts(data);
  }

  /**
   * Create comparison charts
   * @param {Object} data - Comparison data
   */
  function createComparisonCharts(data) {
    // Commission rate comparison chart
    const commissionChartCanvas = document.getElementById('comparison-commission-chart');
    if (commissionChartCanvas) {
      const labels = data.regions.map(region => region.displayName);
      const commissionRates = data.regions.map(region => region.feeStructure.baseCommissionPercentage);
      const effectiveRates = data.regions.map(region => region.feeStructure.effectiveCommissionRate);

      // Destroy previous chart if it exists
      if (dashboardCharts.comparisonCommission) {
        dashboardCharts.comparisonCommission.destroy();
      }

      // Create the chart
      const ctx = commissionChartCanvas.getContext('2d');
      dashboardCharts.comparisonCommission = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Base Commission Rate',
              data: commissionRates,
              backgroundColor: 'rgba(78, 115, 223, 0.7)',
              borderColor: 'rgba(78, 115, 223, 1)',
              borderWidth: 1
            },
            {
              label: 'Effective Commission Rate',
              data: effectiveRates,
              backgroundColor: 'rgba(28, 200, 138, 0.7)',
              borderColor: 'rgba(28, 200, 138, 1)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            yAxes: [{
              ticks: {
                beginAtZero: true,
                callback: function(value) {
                  return value + '%';
                }
              },
              scaleLabel: {
                display: true,
                labelString: 'Commission Rate (%)'
              }
            }]
          },
          tooltips: {
            callbacks: {
              label: function(tooltipItem, data) {
                return `${data.datasets[tooltipItem.datasetIndex].label}: ${tooltipItem.yLabel.toFixed(2)}%`;
              }
            }
          }
        }
      });
    }

    // Revenue comparison chart
    const revenueChartCanvas = document.getElementById('comparison-revenue-chart');
    if (revenueChartCanvas) {
      const labels = data.regions.map(region => region.displayName);
      const revenueData = data.regions.map(region => region.metrics.revenueLastMonth.converted.value);

      // Destroy previous chart if it exists
      if (dashboardCharts.comparisonRevenue) {
        dashboardCharts.comparisonRevenue.destroy();
      }

      // Create the chart
      const ctx = revenueChartCanvas.getContext('2d');
      dashboardCharts.comparisonRevenue = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: `Revenue (${data.baseCurrency})`,
            data: revenueData,
            backgroundColor: 'rgba(246, 194, 62, 0.7)',
            borderColor: 'rgba(246, 194, 62, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            yAxes: [{
              ticks: {
                beginAtZero: true,
                callback: function(value) {
                  return formatCurrency(value, data.baseCurrency, 0);
                }
              },
              scaleLabel: {
                display: true,
                labelString: `Revenue (${data.baseCurrency})`
              }
            }]
          },
          tooltips: {
            callbacks: {
              label: function(tooltipItem, data) {
                return `${data.datasets[tooltipItem.datasetIndex].label}: ${formatCurrency(tooltipItem.yLabel, data.baseCurrency)}`;
              }
            }
          }
        }
      });
    }
  }

  /**
   * Load recommendations for a selected region
   */
  async function loadRecommendations() {
    if (!recommendationRegionSelect) return;

    const regionId = recommendationRegionSelect.value;

    if (!regionId) {
      // Hide recommendation content if no region selected
      if (recommendationPlaceholder) recommendationPlaceholder.style.display = 'block';
      if (recommendationContent) recommendationContent.style.display = 'none';
      return;
    }

    try {
      // Find the region object
      const selectedFeeConfig = regionFees.find(fee => fee._id === regionId);
      if (!selectedFeeConfig) {
        throw new Error('Selected region not found');
      }

      showMessage('info', `Loading recommendations for ${selectedFeeConfig.displayName}...`);

      // Call the API to get recommendations
      const response = await fetch(`${API_URL}/${selectedFeeConfig.region}/recommendations`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load recommendations');
      }

      const recommendations = await response.json();

      // Display the recommendations
      displayRecommendations(recommendations, selectedFeeConfig);

      showMessage('success', `Recommendations loaded for ${selectedFeeConfig.displayName}`);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      showMessage('error', `Error loading recommendations: ${error.message}`);
    }
  }

  /**
   * Display recommendations in the UI
   * @param {Object} recommendations - Recommendations data
   * @param {Object} feeConfig - The fee configuration
   */
  function displayRecommendations(recommendations, feeConfig) {
    if (!recommendationContent || !recommendationPlaceholder) return;

    // Show content and hide placeholder
    recommendationPlaceholder.style.display = 'none';
    recommendationContent.style.display = 'block';

    // Set recommendation message
    if (recommendationAlert) {
      if (recommendations.message.includes('optimal')) {
        recommendationAlert.className = 'alert alert-success';
        recommendationAlert.innerHTML = `<i class="fas fa-check-circle mr-2"></i> ${recommendations.message}`;
      } else if (recommendations.message.includes('Insufficient')) {
        recommendationAlert.className = 'alert alert-warning';
        recommendationAlert.innerHTML = `<i class="fas fa-exclamation-triangle mr-2"></i> ${recommendations.message}`;
      } else {
        recommendationAlert.className = 'alert alert-info';
        recommendationAlert.innerHTML = `<i class="fas fa-info-circle mr-2"></i> ${recommendations.message}`;
      }
    }

    // Update current structure table
    document.getElementById('current-commission').textContent = `${recommendations.currentFeeStructure.baseCommissionPercentage}%`;
    document.getElementById('current-transaction-fee').textContent =
      formatCurrency(recommendations.currentFeeStructure.transactionFee, feeConfig.currency);
    document.getElementById('current-initial-fee').textContent =
      formatCurrency(recommendations.currentFeeStructure.initialFee, feeConfig.currency);
    document.getElementById('current-revenue').textContent =
      formatCurrency(recommendations.currentFeeStructure.estimatedMonthlyRevenue, feeConfig.currency);

    // Update recommended structure table if available
    if (recommendations.recommendedChanges) {
      document.getElementById('recommended-commission').textContent =
        `${recommendations.recommendedChanges.baseCommissionPercentage}%`;
      document.getElementById('recommended-transaction-fee').textContent =
        formatCurrency(recommendations.recommendedChanges.transactionFee, feeConfig.currency);

      const increaseAmount = recommendations.recommendedChanges.potentialRevenueIncrease;
      const increasePercentage = recommendations.recommendedChanges.percentageIncrease;

      document.getElementById('potential-increase').textContent =
        `${formatCurrency(increaseAmount, feeConfig.currency)} (${increasePercentage.toFixed(1)}%)`;

      // Show the apply button
      if (applyRecommendationsBtn) {
        // Store the recommended changes for later use
        applyRecommendationsBtn.dataset.id = feeConfig._id;
        applyRecommendationsBtn.dataset.commission = recommendations.recommendedChanges.baseCommissionPercentage;
        applyRecommendationsBtn.dataset.transactionFee = recommendations.recommendedChanges.transactionFee;

        applyRecommendationsBtn.disabled = false;
      }
    } else {
      // No recommendations available
      document.getElementById('recommended-commission').textContent = '-';
      document.getElementById('recommended-transaction-fee').textContent = '-';
      document.getElementById('potential-increase').textContent = '-';

      if (applyRecommendationsBtn) {
        applyRecommendationsBtn.disabled = true;
      }
    }

    // Create revenue simulation chart
    createRevenueSimulationChart(recommendations, feeConfig);

    // Populate benchmark table
    populateBenchmarkTable(recommendations, feeConfig);
  }

  /**
   * Create revenue simulation chart
   * @param {Object} recommendations - Recommendations data
   * @param {Object} feeConfig - The fee configuration
   */
  function createRevenueSimulationChart(recommendations, feeConfig) {
    const canvas = document.getElementById('revenue-simulation-chart');
    if (!canvas) return;

    // Only show simulation if we have data
    if (!recommendations.simulations || recommendations.simulations.length === 0) {
      canvas.parentElement.innerHTML = `<div class="text-center p-4 text-muted">
        <i class="fas fa-chart-line fa-3x mb-3"></i>
        <p>Insufficient data for revenue simulation</p>
      </div>`;
      return;
    }

    // Prepare data for chart
    const labels = recommendations.simulations.map(sim => `${sim.commissionRate}%`);
    const currentRate = recommendations.currentFeeStructure.baseCommissionPercentage;
    const recommendedRate = recommendations.recommendedChanges?.baseCommissionPercentage || currentRate;

    const revenueData = recommendations.simulations.map(sim => sim.estimatedRevenue);
    const volumeData = recommendations.simulations.map(sim => sim.estimatedVolume);

    // Destroy previous chart if it exists
    if (dashboardCharts.revenueSimulation) {
      dashboardCharts.revenueSimulation.destroy();
    }

    // Create the chart
    const ctx = canvas.getContext('2d');
    dashboardCharts.revenueSimulation = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Estimated Revenue',
            data: revenueData,
            backgroundColor: 'rgba(78, 115, 223, 0.05)',
            borderColor: 'rgba(78, 115, 223, 1)',
            pointBackgroundColor: 'rgba(78, 115, 223, 1)',
            pointBorderColor: '#fff',
            pointRadius: 4,
            pointHoverRadius: 6,
            pointHitRadius: 10,
            tension: 0.1,
            fill: true
          },
          {
            label: 'Transaction Volume',
            data: volumeData,
            backgroundColor: 'transparent',
            borderColor: 'rgba(28, 200, 138, 0.8)',
            pointBackgroundColor: 'rgba(28, 200, 138, 1)',
            pointBorderColor: '#fff',
            pointRadius: 4,
            pointHoverRadius: 6,
            pointHitRadius: 10,
            tension: 0.1,
            yAxisID: 'y-axis-2'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          xAxes: [{
            gridLines: {
              display: true,
              drawBorder: true
            },
            ticks: {
              maxTicksLimit: 10
            }
          }],
          yAxes: [
            {
              id: 'y-axis-1',
              type: 'linear',
              position: 'left',
              ticks: {
                beginAtZero: true,
                callback: function(value) {
                  return formatCurrency(value, feeConfig.currency, 0);
                }
              },
              gridLines: {
                color: "rgb(234, 236, 244)",
                zeroLineColor: "rgb(234, 236, 244)",
                drawBorder: false,
                borderDash: [2],
                zeroLineBorderDash: [2]
              },
              scaleLabel: {
                display: true,
                labelString: `Estimated Revenue (${feeConfig.currency})`
              }
            },
            {
              id: 'y-axis-2',
              type: 'linear',
              position: 'right',
              ticks: {
                beginAtZero: true,
                callback: function(value) {
                  return Math.round(value);
                }
              },
              gridLines: {
                drawBorder: false,
                display: false
              },
              scaleLabel: {
                display: true,
                labelString: 'Transaction Volume'
              }
            }
          ]
        },
        annotation: {
          annotations: [
            {
              type: 'line',
              mode: 'vertical',
              scaleID: 'x-axis-0',
              value: labels.findIndex(l => parseFloat(l) === currentRate),
              borderColor: 'rgba(255, 99, 132, 0.7)',
              borderWidth: 2,
              label: {
                enabled: true,
                content: 'Current',
                position: 'top'
              }
            },
            {
              type: 'line',
              mode: 'vertical',
              scaleID: 'x-axis-0',
              value: labels.findIndex(l => parseFloat(l) === recommendedRate),
              borderColor: 'rgba(75, 192, 192, 0.7)',
              borderWidth: 2,
              label: {
                enabled: true,
                content: 'Recommended',
                position: 'bottom'
              }
            }
          ]
        },
        tooltips: {
          callbacks: {
            label: function(tooltipItem, data) {
              if (tooltipItem.datasetIndex === 0) {
                return `Revenue: ${formatCurrency(tooltipItem.yLabel, feeConfig.currency)}`;
              } else {
                return `Volume: ${Math.round(tooltipItem.yLabel)} transactions`;
              }
            }
          }
        }
      }
    });
  }

  /**
   * Populate benchmark table
   * @param {Object} recommendations - Recommendations data
   * @param {Object} feeConfig - The fee configuration
   */
  function populateBenchmarkTable(recommendations, feeConfig) {
    const benchmarkTableBody = document.getElementById('benchmark-table-body');
    if (!benchmarkTableBody) return;

    benchmarkTableBody.innerHTML = '';

    // Check if we have benchmark data
    if (!recommendations.benchmarkData || !recommendations.benchmarkData.similarRegions ||
        recommendations.benchmarkData.similarRegions.length === 0) {
      benchmarkTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted">
            No similar regions found for benchmarking
          </td>
        </tr>
      `;
      return;
    }

    // Add average row
    const avgRow = document.createElement('tr');
    avgRow.className = 'table-info';
    avgRow.innerHTML = `
      <td><strong>Average</strong></td>
      <td><strong>${recommendations.benchmarkData.averageCommissionRate.toFixed(2)}%</strong></td>
      <td><strong>${formatCurrency(recommendations.benchmarkData.averageTransactionFee, feeConfig.currency)}</strong></td>
      <td>-</td>
      <td>-</td>
    `;
    benchmarkTableBody.appendChild(avgRow);

    // Add region rows
    recommendations.benchmarkData.similarRegions.forEach(region => {
      const row = document.createElement('tr');

      row.innerHTML = `
        <td>${region.displayName}</td>
        <td>${region.baseCommissionPercentage}%</td>
        <td>${formatCurrency(region.transactionFee, region.currency)}</td>
        <td>${region.effectiveCommissionRate.toFixed(2)}%</td>
        <td>${formatCurrency(region.revenueLastMonth, region.currency)}</td>
      `;

      benchmarkTableBody.appendChild(row);
    });
  }

  /**
   * Apply recommended fee structure
   */
  async function applyRecommendations() {
    if (!applyRecommendationsBtn || applyRecommendationsBtn.disabled) return;

    const id = applyRecommendationsBtn.dataset.id;
    const recommendedCommission = parseFloat(applyRecommendationsBtn.dataset.commission);
    const recommendedTransactionFee = parseFloat(applyRecommendationsBtn.dataset.transactionFee);

    if (!id || isNaN(recommendedCommission)) {
      showMessage('error', 'Invalid recommendation data');
      return;
    }

    try {
      // Find the region
      const feeConfig = regionFees.find(fee => fee._id === id);
      if (!feeConfig) {
        throw new Error('Fee configuration not found');
      }

      showMessage('info', `Applying recommendations to ${feeConfig.displayName}...`);

      // Prepare update data
      const updateData = {
        baseCommissionPercentage: recommendedCommission,
        transactionFee: recommendedTransactionFee,
        notes: 'Applied automated fee structure recommendation'
      };

      // Call API to update the fee structure
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to apply recommendations');
      }

      // Reload all region data
      await loadRegionFees();

      // Reload recommendations
      loadRecommendations();

      showMessage('success', `Recommendations applied to ${feeConfig.displayName}`);
    } catch (error) {
      console.error('Error applying recommendations:', error);
      showMessage('error', `Error applying recommendations: ${error.message}`);
    }
  }

  // ... existing code ...

  /**
   * Load history for a selected region
   */
  async function loadHistory() {
    if (!historyRegionSelect) return;

    const regionId = historyRegionSelect.value;

    if (!regionId) {
      // Hide history content if no region selected
      if (historyPlaceholder) historyPlaceholder.style.display = 'block';
      if (historyContent) historyContent.style.display = 'none';
      return;
    }

    try {
      // Find the region object
      const selectedFeeConfig = regionFees.find(fee => fee._id === regionId);
      if (!selectedFeeConfig) {
        throw new Error('Selected region not found');
      }

      showMessage('info', `Loading history for ${selectedFeeConfig.displayName}...`);

      // Call the API to get history
      const response = await fetch(`${API_URL}/${regionId}/history`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load history');
      }

      const history = await response.json();

      // Display the history
      displayHistory(history, selectedFeeConfig);

      showMessage('success', `History loaded for ${selectedFeeConfig.displayName}`);
    } catch (error) {
      console.error('Error loading history:', error);
      showMessage('error', `Error loading history: ${error.message}`);
    }
  }

  /**
   * Apply date filter to history
   */
  function applyHistoryDateFilter() {
    if (!historyRegionSelect || !historyRegionSelect.value) {
      showMessage('warning', 'Please select a region first');
      return;
    }

    // Reload history with date filter
    loadHistoryWithDateFilter();
  }

  /**
   * Load history with date filter
   */
  async function loadHistoryWithDateFilter() {
    if (!historyRegionSelect) return;

    const regionId = historyRegionSelect.value;

    if (!regionId) {
      return;
    }

    try {
      // Find the region object
      const selectedFeeConfig = regionFees.find(fee => fee._id === regionId);
      if (!selectedFeeConfig) {
        throw new Error('Selected region not found');
      }

      showMessage('info', `Loading filtered history for ${selectedFeeConfig.displayName}...`);

      // Get date filter values
      const startDate = historyStartDate.value;
      const endDate = historyEndDate.value;

      // Build query parameters
      let url = `${API_URL}/${regionId}/history`;
      const params = new URLSearchParams();

      if (startDate) {
        params.append('startDate', startDate);
      }

      if (endDate) {
        params.append('endDate', endDate);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      // Call the API to get history
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load history');
      }

      const history = await response.json();

      // Display the history
      displayHistory(history, selectedFeeConfig);

      showMessage('success', `Filtered history loaded for ${selectedFeeConfig.displayName}`);
    } catch (error) {
      console.error('Error loading filtered history:', error);
      showMessage('error', `Error loading filtered history: ${error.message}`);
    }
  }

  /**
   * Display history in the UI
   * @param {Array} history - History entries
   * @param {Object} feeConfig - The fee configuration
   */
  function displayHistory(history, feeConfig) {
    if (!historyContent || !historyPlaceholder || !historyTimeline) return;

    // Show content and hide placeholder
    historyPlaceholder.style.display = 'none';
    historyContent.style.display = 'block';

    // Clear timeline
    historyTimeline.innerHTML = '';

    // Check if we have history entries
    if (!history || history.length === 0) {
      historyTimeline.innerHTML = `
        <div class="text-center p-5 text-muted">
          <i class="fas fa-history fa-3x mb-3"></i>
          <h5>No history found for this region</h5>
          <p>Any changes made to this fee configuration will be recorded here.</p>
        </div>
      `;
      return;
    }

    // Add timeline entries
    history.forEach((entry, index) => {
      const isCreation = !entry.previousValues || Object.keys(entry.previousValues).length === 0;
      const date = new Date(entry.timestamp);

      // Create timeline item
      const timelineItem = document.createElement('div');
      timelineItem.className = `timeline-item ${index % 2 === 0 ? 'left' : 'right'}`;

      // Determine icon based on entry type
      let icon = 'fa-edit';
      let iconBg = 'bg-primary';

      if (isCreation) {
        icon = 'fa-plus';
        iconBg = 'bg-success';
      } else if (entry.notes && entry.notes.includes('recommendation')) {
        icon = 'fa-lightbulb';
        iconBg = 'bg-warning';
      }

      // Create content
      timelineItem.innerHTML = `
        <div class="timeline-badge ${iconBg}"><i class="fas ${icon}"></i></div>
        <div class="timeline-panel">
          <div class="timeline-heading">
            <h6 class="timeline-title">
              ${isCreation ? 'Initial Configuration Created' : 'Configuration Updated'}
            </h6>
            <p>
              <small class="text-muted">
                <i class="fas fa-clock"></i> ${formatDate(date)}
              </small>
              ${entry.userName ? `
              <small class="text-muted ml-2">
                <i class="fas fa-user"></i> ${entry.userName}
              </small>` : ''}
            </p>
          </div>
          <div class="timeline-body">
            ${entry.notes ? `<p class="mb-2">${entry.notes}</p>` : ''}
            <div class="changes-table">
              ${generateChangesTable(entry, feeConfig)}
            </div>
          </div>
        </div>
      `;

      historyTimeline.appendChild(timelineItem);
    });

    // Add timeline styles if not already present
    addTimelineStyles();
  }

  /**
   * Generate changes table for a history entry
   * @param {Object} entry - History entry
   * @param {Object} feeConfig - The fee configuration
   * @returns {string} HTML for changes table
   */
  function generateChangesTable(entry, feeConfig) {
    // For initial creation
    if (!entry.previousValues || Object.keys(entry.previousValues).length === 0) {
      // Display initial values
      const initialValues = entry.newValues;

      // Just show key initial values
      let html = `
        <table class="table table-sm table-bordered">
          <thead>
            <tr>
              <th>Setting</th>
              <th>Initial Value</th>
            </tr>
          </thead>
          <tbody>
      `;

      if (initialValues.baseCommissionPercentage !== undefined) {
        html += `
          <tr>
            <td>Base Commission</td>
            <td>${initialValues.baseCommissionPercentage}%</td>
          </tr>
        `;
      }

      if (initialValues.transactionFee !== undefined) {
        html += `
          <tr>
            <td>Transaction Fee</td>
            <td>${formatCurrency(initialValues.transactionFee, feeConfig.currency)}</td>
          </tr>
        `;
      }

      if (initialValues.initialFee !== undefined) {
        html += `
          <tr>
            <td>Initial Fee</td>
            <td>${formatCurrency(initialValues.initialFee, feeConfig.currency)}</td>
          </tr>
        `;
      }

      html += `
          </tbody>
        </table>
      `;

      return html;
    }

    // For updates
    const changes = [];

    Object.keys(entry.newValues).forEach(key => {
      const oldValue = entry.previousValues[key];
      const newValue = entry.newValues[key];

      // Skip if unchanged or complex objects that are hard to display
      if (JSON.stringify(oldValue) === JSON.stringify(newValue) ||
          (typeof oldValue === 'object' && oldValue !== null) ||
          (typeof newValue === 'object' && newValue !== null)) {
        return;
      }

      // Format the values based on the field
      let formattedOldValue = oldValue;
      let formattedNewValue = newValue;

      if (key === 'baseCommissionPercentage') {
        formattedOldValue = `${oldValue}%`;
        formattedNewValue = `${newValue}%`;
      } else if (key === 'transactionFee' || key === 'initialFee') {
        formattedOldValue = formatCurrency(oldValue, feeConfig.currency);
        formattedNewValue = formatCurrency(newValue, feeConfig.currency);
      } else if (typeof oldValue === 'boolean') {
        formattedOldValue = oldValue ? 'Yes' : 'No';
        formattedNewValue = newValue ? 'Yes' : 'No';
      }

      // Map field names to display names
      const fieldDisplayNames = {
        baseCommissionPercentage: 'Base Commission',
        transactionFee: 'Transaction Fee',
        initialFee: 'Initial Fee',
        useCommissionTiers: 'Use Commission Tiers',
        useSubscription: 'Use Subscription',
        initialFeeWaivable: 'Initial Fee Waivable',
        minPayoutAmount: 'Min Payout Amount'
      };

      const displayName = fieldDisplayNames[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

      changes.push({
        field: displayName,
        oldValue: formattedOldValue,
        newValue: formattedNewValue
      });
    });

    if (changes.length === 0) {
      return '<p class="text-muted">No significant changes detected</p>';
    }

    let html = `
      <table class="table table-sm table-bordered">
        <thead>
          <tr>
            <th>Setting</th>
            <th>Old Value</th>
            <th>New Value</th>
          </tr>
        </thead>
        <tbody>
    `;

    changes.forEach(change => {
      html += `
        <tr>
          <td>${change.field}</td>
          <td>${change.oldValue}</td>
          <td>${change.newValue}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    return html;
  }

  /**
   * Format date for display
   * @param {Date} date - The date to format
   * @returns {string} Formatted date string
   */
  function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  /**
   * Add timeline styles to the page
   */
  function addTimelineStyles() {
    // Check if styles already exist
    if (document.getElementById('timeline-styles')) {
      return;
    }

    // Create style element
    const style = document.createElement('style');
    style.id = 'timeline-styles';
    style.textContent = `
      .timeline {
        position: relative;
        padding: 20px 0;
        list-style: none;
        max-width: 1200px;
        margin: 0 auto;
      }

      .timeline:before {
        content: " ";
        position: absolute;
        top: 0;
        bottom: 0;
        left: 50%;
        width: 3px;
        margin-left: -1.5px;
        background-color: #e9ecef;
      }

      .timeline-item {
        position: relative;
        margin-bottom: 50px;
        width: 100%;
        clear: both;
      }

      .timeline-item:after {
        content: "";
        display: table;
        clear: both;
      }

      .timeline-item .timeline-panel {
        width: 45%;
        float: left;
        border: 1px solid #d4d4d4;
        border-radius: 4px;
        padding: 20px;
        position: relative;
        box-shadow: 0 1px 6px rgba(0, 0, 0, 0.175);
        background-color: #fff;
      }

      .timeline-item.left .timeline-panel {
        float: right;
      }

      .timeline-item.right .timeline-panel {
        float: left;
      }

      .timeline-item .timeline-panel:before {
        position: absolute;
        top: 26px;
        right: -15px;
        display: inline-block;
        border-top: 15px solid transparent;
        border-left: 15px solid #ccc;
        border-right: 0 solid #ccc;
        border-bottom: 15px solid transparent;
        content: " ";
      }

      .timeline-item .timeline-panel:after {
        position: absolute;
        top: 27px;
        right: -14px;
        display: inline-block;
        border-top: 14px solid transparent;
        border-left: 14px solid #fff;
        border-right: 0 solid #fff;
        border-bottom: 14px solid transparent;
        content: " ";
      }

      .timeline-item.right .timeline-panel:before {
        border-left-width: 0;
        border-right-width: 15px;
        left: -15px;
        right: auto;
      }

      .timeline-item.right .timeline-panel:after {
        border-left-width: 0;
        border-right-width: 14px;
        left: -14px;
        right: auto;
      }

      .timeline-item .timeline-badge {
        width: 50px;
        height: 50px;
        line-height: 50px;
        font-size: 1.4em;
        text-align: center;
        position: absolute;
        top: 16px;
        left: 50%;
        margin-left: -25px;
        background-color: #999999;
        z-index: 100;
        border-radius: 50%;
        color: #fff;
      }

      .timeline-badge.bg-primary {
        background-color: #4e73df !important;
      }

      .timeline-badge.bg-success {
        background-color: #1cc88a !important;
      }

      .timeline-badge.bg-warning {
        background-color: #f6c23e !important;
      }

      .timeline-badge.bg-danger {
        background-color: #e74a3b !important;
      }

      .timeline-badge.bg-info {
        background-color: #36b9cc !important;
      }

      .timeline-title {
        margin-top: 0;
        color: inherit;
      }

      .timeline-body > p,
      .timeline-body > ul {
        margin-bottom: 0;
      }

      .timeline-body > p + p {
        margin-top: 5px;
      }

      .changes-table {
        margin-top: 10px;
      }

      .changes-table table {
        margin-bottom: 0;
      }

      @media (max-width: 767px) {
        .timeline:before {
          left: 40px;
        }

        .timeline-item .timeline-panel {
          width: calc(100% - 90px);
          width: -moz-calc(100% - 90px);
          width: -webkit-calc(100% - 90px);
          float: right;
        }

        .timeline-item .timeline-badge {
          left: 15px;
          margin-left: 0;
          top: 16px;
        }

        .timeline-item.left .timeline-panel,
        .timeline-item.right .timeline-panel {
          float: right;
        }

        .timeline-item.left .timeline-panel:before,
        .timeline-item.right .timeline-panel:before {
          border-left-width: 0;
          border-right-width: 15px;
          left: -15px;
          right: auto;
        }

        .timeline-item.left .timeline-panel:after,
        .timeline-item.right .timeline-panel:after {
          border-left-width: 0;
          border-right-width: 14px;
          left: -14px;
          right: auto;
        }
      }
    `;

    // Add to document head
    document.head.appendChild(style);
  }
});
