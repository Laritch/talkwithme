/**
 * Admin Region Fees JavaScript
 *
 * Manages the admin interface for configuring region-specific fee structures,
 * including the creation, editing, and deletion of fee configurations.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM elements - Basic
  const regionFeesTableBody = document.getElementById('region-fees-table-body');
  const feeModal = document.getElementById('fee-modal');
  const feeForm = document.getElementById('region-fee-form');
  const addFeeButton = document.getElementById('add-fee-button');
  const deleteFeeButton = document.getElementById('delete-fee-button');
  const saveFeeButton = document.getElementById('save-fee-button'); // New saveFeeButton variable
  const messageContainer = document.getElementById('message-container');
  const loader = document.getElementById('loader');
  const regionSearch = document.getElementById('region-search');

  // DOM elements - Calculator
  const calculationSection = document.getElementById('calculation-section');
  const testCalculationForm = document.getElementById('test-calculation-form');
  const calculationResults = document.getElementById('calculation-results');
  const closeCalculatorBtn = document.getElementById('close-calculator');
  const testCalculationButton = document.getElementById('test-calculation-button'); // Added testCalculationButton variable
  const volumeSimulator = document.getElementById('volume-simulator');
  const volumeValue = document.getElementById('volume-value');
  const calcPeriod = document.getElementById('calc-period');
  const calcPaymentMethod = document.getElementById('calc-payment-method');

  // DOM elements - Import/Export
  const exportFeesButton = document.getElementById('export-fees-button');
  const importFeesButton = document.getElementById('import-fees-button');
  const importModal = document.getElementById('import-modal');
  const importForm = document.getElementById('import-form');
  const importFile = document.getElementById('import-file');
  const importPreview = document.getElementById('import-preview');
  const importPreviewBody = document.getElementById('import-preview-body');
  const importSubmitBtn = document.getElementById('import-submit-btn');
  const replaceExisting = document.getElementById('replace-existing');

  // DOM elements - Charts
  const commissionChart = document.getElementById('commission-chart');
  const initialfeeChart = document.getElementById('initialfee-chart');
  const revenueChart = document.getElementById('revenue-chart');
  const toggleSectionBtns = document.querySelectorAll('.toggle-section');

  // DOM elements - History Visualization
  const historyChartMetric = document.getElementById('history-chart-metric');
  const historyChartView = document.getElementById('history-chart-view');
  const historyTrendChart = document.getElementById('history-trend-chart');
  const compareDateFrom = document.getElementById('compare-date-from');
  const compareDateTo = document.getElementById('compare-date-to');
  const generateComparisonBtn = document.getElementById('generate-comparison');
  const structureComparisonContainer = document.getElementById('structure-comparison-container');
  const impactAnalysisContainer = document.getElementById('impact-analysis-container');

  // DOM elements - Optimization Wizard
  const startWizardBtn = document.getElementById('start-wizard-btn');
  const optimizationWizard = document.getElementById('optimization-wizard');
  const wizardSteps = document.querySelectorAll('.wizard-step');
  const wizardStepContents = document.querySelectorAll('.wizard-step-content');
  const wizardProgressBar = document.getElementById('wizard-progress-bar');
  const wizardPrevBtn = document.getElementById('wizard-prev-btn');
  const wizardNextBtn = document.getElementById('wizard-next-btn');
  const wizardConfirmChanges = document.getElementById('wizard-confirm-changes');
  const applyWizardChangesBtn = document.getElementById('apply-wizard-changes');
  const exportWizardReportBtn = document.getElementById('export-wizard-report');
  const runSimulationBtn = document.getElementById('run-simulation-btn');
  const simulationCommission = document.getElementById('sim-commission');
  const simulationCommissionValue = document.getElementById('sim-commission-value');
  const simulationInitialFee = document.getElementById('sim-initial-fee');
  const simulationInitialFeeValue = document.getElementById('sim-initial-fee-value');
  const simulationFixedFee = document.getElementById('sim-fixed-fee');
  const simulationFixedFeeValue = document.getElementById('sim-fixed-fee-value');
  const simulationResults = document.getElementById('simulation-results');
  const simulationImpact = document.getElementById('simulation-impact');
  const goalPriority = document.getElementById('goal-priority');
  const wizardRecommendation = document.getElementById('wizard-recommendation');
  const wizardImpact = document.getElementById('wizard-impact');

  // DOM elements - Notification System
  const notificationList = document.getElementById('notification-list');
  const notificationCount = document.getElementById('notification-count');
  const markAllReadBtn = document.getElementById('mark-all-read-btn');
  const notificationSoundToggle = document.getElementById('notification-sound-toggle');
  const emptyNotificationMessage = document.getElementById('empty-notification-message');

  // Notification System
  let notifications = [];
  let notificationSound = new Audio('admin/sounds/notification.mp3');

  // Function to add a new notification
  function addNotification(title, message, type = 'info', actionable = false) {
    const now = new Date();
    const id = 'notification-' + now.getTime();

    const notification = {
      id: id,
      title: title,
      message: message,
      type: type, // 'info', 'warning', 'danger', 'success'
      timestamp: now,
      read: false,
      actionable: actionable
    };

    notifications.unshift(notification);
    updateNotificationUI();

    // Play sound if enabled
    if (notificationSoundToggle && notificationSoundToggle.checked) {
      try {
        notificationSound.play();
      } catch (e) {
        console.warn('Could not play notification sound:', e);
      }
    }

    // Return notification ID so it can be referenced later
    return id;
  }

  // Function to mark a notification as read
  function markNotificationAsRead(id) {
    const notification = notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      updateNotificationUI();
    }
  }

  // Function to mark all notifications as read
  function markAllNotificationsAsRead() {
    notifications.forEach(notification => {
      notification.read = true;
    });
    updateNotificationUI();
  }

  // Function to update the notification UI
  function updateNotificationUI() {
    if (!notificationList || !notificationCount || !markAllReadBtn || !emptyNotificationMessage) {
      return;
    }

    // Clear current notifications
    notificationList.innerHTML = '';

    // Count unread notifications
    const unreadCount = notifications.filter(n => !n.read).length;

    // Update badge
    notificationCount.textContent = unreadCount;
    notificationCount.style.display = unreadCount > 0 ? 'inline-block' : 'none';

    // Enable/disable mark all read button
    markAllReadBtn.disabled = unreadCount === 0;

    // Show empty message if no notifications
    if (notifications.length === 0) {
      emptyNotificationMessage.style.display = 'block';
      return;
    } else {
      emptyNotificationMessage.style.display = 'none';
    }

    // Add notification items
    notifications.forEach(notification => {
      const item = document.createElement('div');
      item.className = `list-group-item notification-item ${notification.read ? '' : 'unread'} ${notification.type}`;
      item.dataset.id = notification.id;

      const timeAgo = getTimeAgo(notification.timestamp);

      let actionButton = '';
      if (notification.actionable) {
        actionButton = `
          <div class="notification-actions">
            <button class="btn btn-sm btn-outline-primary notification-action-btn" data-id="${notification.id}">
              View Details
            </button>
          </div>
        `;
      }

      item.innerHTML = `
        <div class="notification-header">
          <h6 class="notification-title">${notification.title}</h6>
          <span class="notification-time">${timeAgo}</span>
        </div>
        <p class="notification-content">${notification.message}</p>
        ${actionButton}
      `;

      // Add to list
      notificationList.appendChild(item);

      // Add click event to mark as read
      item.addEventListener('click', function() {
        if (!notification.read) {
          markNotificationAsRead(notification.id);
        }
      });
    });

    // Add event listeners to action buttons
    document.querySelectorAll('.notification-action-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent parent click event
        const notificationId = this.dataset.id;
        const notification = notifications.find(n => n.id === notificationId);

        if (notification) {
          // Handle action based on notification type
          if (notification.type === 'threshold') {
            // Navigate to recommendations tab
            document.getElementById('recommendations-tab').click();
          } else if (notification.type === 'update') {
            // Navigate to history tab
            document.getElementById('history-tab').click();
          }

          markNotificationAsRead(notificationId);
        }
      });
    });
  }

  // Get time ago string (e.g. "2 hours ago")
  function getTimeAgo(timestamp) {
    const now = new Date();
    const diff = Math.floor((now - timestamp) / 1000); // Difference in seconds

    if (diff < 60) {
      return 'Just now';
    } else if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diff / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }

  // Event listener for mark all read button
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', markAllNotificationsAsRead);
  }

  // Add sample notifications
  setTimeout(() => {
    addNotification(
      'Revenue Threshold Alert',
      'North America region has crossed the 10% revenue growth threshold.',
      'warning',
      true
    );

    setTimeout(() => {
      addNotification(
        'Fee Structure Updated',
        'Europe region fee structure was updated by admin@example.com',
        'info',
        true
      );

      setTimeout(() => {
        addNotification(
          'New Recommendation Available',
          'We have a new fee structure recommendation for Asia Pacific region.',
          'success',
          true
        );
      }, 5000);
    }, 10000);
  }, 3000);

  // Fee Optimization Wizard Initialization
  let currentWizardStep = 1;
  const totalWizardSteps = 4;

  // Initialize the wizard when the start button is clicked
  if (startWizardBtn) {
    startWizardBtn.addEventListener('click', function() {
      if (optimizationWizard) {
        currentWizardStep = 1;
        showWizardStep(currentWizardStep);
        optimizationWizard.classList.remove('d-none');
      }
    });
  }

  // Navigate between wizard steps
  if (wizardNextBtn) {
    wizardNextBtn.addEventListener('click', function() {
      if (currentWizardStep < totalWizardSteps) {
        currentWizardStep++;
        showWizardStep(currentWizardStep);
      }
    });
  }

  if (wizardPrevBtn) {
    wizardPrevBtn.addEventListener('click', function() {
      if (currentWizardStep > 1) {
        currentWizardStep--;
        showWizardStep(currentWizardStep);
      }
    });
  }

  // Display the current wizard step and update progress
  function showWizardStep(step) {
    // Update progress bar
    if (wizardProgressBar) {
      const progressPercentage = ((step - 1) / (totalWizardSteps - 1)) * 100;
      wizardProgressBar.style.width = `${progressPercentage}%`;
      wizardProgressBar.setAttribute('aria-valuenow', progressPercentage);
      wizardProgressBar.textContent = `${Math.round(progressPercentage)}%`;
    }

    // Update step indicators
    if (wizardSteps) {
      wizardSteps.forEach(stepEl => {
        const stepNumber = parseInt(stepEl.dataset.step);
        stepEl.classList.remove('active', 'completed');

        if (stepNumber === step) {
          stepEl.classList.add('active');
        } else if (stepNumber < step) {
          stepEl.classList.add('completed');
        }
      });
    }

    // Show current step content, hide others
    if (wizardStepContents) {
      wizardStepContents.forEach((content, index) => {
        if (index + 1 === step) {
          content.classList.remove('d-none');
        } else {
          content.classList.add('d-none');
        }
      });
    }

    // Update buttons
    if (wizardPrevBtn) {
      wizardPrevBtn.disabled = step === 1;
    }

    if (wizardNextBtn) {
      if (step === totalWizardSteps) {
        wizardNextBtn.style.display = 'none';
      } else {
        wizardNextBtn.style.display = 'block';
        wizardNextBtn.disabled = false;
      }
    }
  }

  // Simulation range slider updates
  if (simulationCommission && simulationCommissionValue) {
    simulationCommission.addEventListener('input', function() {
      simulationCommissionValue.textContent = `${this.value}%`;
    });
  }

  if (simulationInitialFee && simulationInitialFeeValue) {
    simulationInitialFee.addEventListener('input', function() {
      simulationInitialFeeValue.textContent = `$${this.value}`;
    });
  }

  if (simulationFixedFee && simulationFixedFeeValue) {
    simulationFixedFee.addEventListener('input', function() {
      simulationFixedFeeValue.textContent = `$${this.value}`;
    });
  }

  // Run simulation
  if (runSimulationBtn) {
    runSimulationBtn.addEventListener('click', function(e) {
      e.preventDefault();

      // Simple simulation result display
      if (simulationResults) {
        simulationResults.innerHTML = `
          <div class="simulation-metric">
            <span class="simulation-metric-label">Estimated Monthly Revenue:</span>
            <span class="simulation-metric-value">$75,000</span>
          </div>
          <div class="simulation-metric">
            <span class="simulation-metric-label">Expert Growth Forecast:</span>
            <span class="simulation-metric-value">Moderate increase</span>
          </div>
          <div class="simulation-metric">
            <span class="simulation-metric-label">Competitive Position:</span>
            <span class="simulation-metric-value">Slightly below market</span>
          </div>
        `;
      }

      // Impact display
      if (simulationImpact) {
        simulationImpact.innerHTML = `
          <div class="simulation-impact-item positive">
            <i class="fas fa-chart-line"></i> Revenue projected to increase by 12.5%
          </div>
          <div class="simulation-impact-item positive">
            <i class="fas fa-users"></i> Expert sign-ups likely to increase
          </div>
          <div class="simulation-impact-item negative">
            <i class="fas fa-balance-scale"></i> Fee structure below industry average
          </div>
        `;
      }
    });
  }

  // Enable apply button when changes are confirmed
  if (wizardConfirmChanges && applyWizardChangesBtn) {
    wizardConfirmChanges.addEventListener('change', function() {
      applyWizardChangesBtn.disabled = !this.checked;
    });
  }

  // Apply wizard changes
  if (applyWizardChangesBtn) {
    applyWizardChangesBtn.addEventListener('click', function() {
      alert('Fee structure changes have been applied successfully!');
      if (optimizationWizard) {
        optimizationWizard.classList.add('d-none');
      }
    });
  }

  // Export wizard report
  if (exportWizardReportBtn) {
    exportWizardReportBtn.addEventListener('click', function() {
      alert('Report export functionality would be triggered here.');
    });
  }

  // PDF Report Generation
  // Event listener for the report generator toggle
  if (toggleReportGeneratorBtn && reportGeneratorBody) {
    toggleReportGeneratorBtn.addEventListener('click', function() {
      reportGeneratorBody.classList.toggle('d-none');
      const icon = this.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-chevron-down');
        icon.classList.toggle('fa-chevron-up');
      }
    });
  }

  // Toggle selected regions in report
  if (reportAllRegions && reportSelectedRegions && reportRegionSelect) {
    reportAllRegions.addEventListener('change', function() {
      if (this.checked) {
        reportRegionSelect.disabled = true;
      }
    });

    reportSelectedRegions.addEventListener('change', function() {
      if (this.checked) {
        reportRegionSelect.disabled = false;
      }
    });
  }

  // Preview report
  if (previewReportBtn) {
    previewReportBtn.addEventListener('click', function() {
      $('#report-preview-modal').modal('show');

      // Generate and display report preview
      generateReportPreview();
    });
  }

  // Generate PDF report
  if (generateReportBtn) {
    generateReportBtn.addEventListener('click', function() {
      // In a real implementation, this would generate the PDF using a library like jsPDF
      // For this demo, we'll just show an alert
      alert('Generating PDF report... In a real implementation, this would create and download a PDF.');
    });
  }

  // Download report from preview
  if (downloadPreviewReportBtn) {
    downloadPreviewReportBtn.addEventListener('click', function() {
      alert('Downloading PDF report... In a real implementation, this would create and download a PDF.');
    });
  }

  // Function to generate report preview
  function generateReportPreview() {
    if (!reportPreviewContainer) return;

    const reportTitle = document.getElementById('report-title')?.value || 'Region Fee Structure Report';
    const includeCharts = document.getElementById('report-include-charts')?.checked || false;
    const includeToc = document.getElementById('report-include-toc')?.checked || false;
    const includeSummary = document.getElementById('report-include-summary')?.checked || false;

    // Create basic report structure
    let reportContent = `
      <div class="report-preview-header">
        <div class="report-preview-title">${reportTitle}</div>
        <div class="report-preview-subtitle">Generated on ${new Date().toLocaleDateString()}</div>
      </div>
    `;

    // Add table of contents if selected
    if (includeToc) {
      reportContent += `
        <div class="report-preview-section">
          <div class="report-preview-section-title">Table of Contents</div>
          <ol>
            ${includeSummary ? '<li>Executive Summary</li>' : ''}
            <li>Fee Metrics</li>
            <li>Regional Comparison</li>
            ${document.getElementById('report-include-trends')?.checked ? '<li>Historical Trends</li>' : ''}
            ${document.getElementById('report-include-projections')?.checked ? '<li>Revenue Projections</li>' : ''}
            ${document.getElementById('report-include-recommendations')?.checked ? '<li>Recommendations</li>' : ''}
          </ol>
        </div>
      `;
    }

    // Add executive summary if selected
    if (includeSummary) {
      reportContent += `
        <div class="report-preview-section">
          <div class="report-preview-section-title">Executive Summary</div>
          <p>This report provides a comprehensive analysis of fee structures across different regions, highlighting key metrics, regional comparisons, and revenue projections based on current fee configurations.</p>
          <p>The platform currently manages <strong>5 active regions</strong> with varying fee structures. Overall platform revenue from commissions is estimated at <strong>$157,500</strong> per month based on current transaction volumes.</p>
        </div>
      `;
    }

    // Add fee metrics section
    reportContent += `
      <div class="report-preview-section">
        <div class="report-preview-section-title">Fee Metrics</div>
        <table class="report-preview-table">
          <thead>
            <tr>
              <th>Region</th>
              <th>Currency</th>
              <th>Initial Fee</th>
              <th>Commission</th>
              <th>Fixed Fee</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>North America</td>
              <td>USD</td>
              <td>$100</td>
              <td>15%</td>
              <td>$2.00</td>
            </tr>
            <tr>
              <td>Europe</td>
              <td>EUR</td>
              <td>€120</td>
              <td>18%</td>
              <td>€2.50</td>
            </tr>
            <tr>
              <td>Asia Pacific</td>
              <td>USD</td>
              <td>$80</td>
              <td>12%</td>
              <td>$1.00</td>
            </tr>
            <tr>
              <td>Latin America</td>
              <td>USD</td>
              <td>$90</td>
              <td>16%</td>
              <td>$1.50</td>
            </tr>
            <tr>
              <td>Middle East</td>
              <td>USD</td>
              <td>$150</td>
              <td>20%</td>
              <td>$3.00</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    // Add regional comparison section
    reportContent += `
      <div class="report-preview-section">
        <div class="report-preview-section-title">Regional Comparison</div>
        <p>The following chart provides a visual comparison of commission rates across regions:</p>
        ${includeCharts ? '<div class="text-center"><img src="https://via.placeholder.com/600x300?text=Commission+Rate+Comparison+Chart" alt="Commission Rate Comparison Chart" class="img-fluid mb-3"></div>' :
        '<p class="text-center text-muted">[Chart placeholder - Charts are disabled in this preview]</p>'}

        <p>The following chart provides a visual comparison of initial fees across regions:</p>
        ${includeCharts ? '<div class="text-center"><img src="https://via.placeholder.com/600x300?text=Initial+Fee+Comparison+Chart" alt="Initial Fee Comparison Chart" class="img-fluid mb-3"></div>' :
        '<p class="text-center text-muted">[Chart placeholder - Charts are disabled in this preview]</p>'}
      </div>
    `;

    // Add additional sections based on selections
    if (document.getElementById('report-include-trends')?.checked) {
      reportContent += `
        <div class="report-preview-section">
          <div class="report-preview-section-title">Historical Trends</div>
          <p>The following chart shows the changes in commission rates over the past 6 months:</p>
          ${includeCharts ? '<div class="text-center"><img src="https://via.placeholder.com/600x300?text=Historical+Trends+Chart" alt="Historical Trends Chart" class="img-fluid mb-3"></div>' :
          '<p class="text-center text-muted">[Chart placeholder - Charts are disabled in this preview]</p>'}
          <p>Key observations:</p>
          <ul>
            <li>North America has shown a gradual increase in commission rates, rising from 15% to 17.5%.</li>
            <li>Europe has maintained stable commission rates at 18%.</li>
            <li>Asia Pacific has increased commission rates from 12% to 14% to better align with other regions.</li>
          </ul>
        </div>
      `;
    }

    // Add footer
    reportContent += `
      <div class="text-center mt-4">
        <p class="text-muted">Preview truncated for demonstration. Full report will include all selected sections.</p>
        <p class="text-muted small">Generated by Admin Region Fee Management System</p>
      </div>
    `;

    // Add content to preview container
    reportPreviewContainer.innerHTML = reportContent;
  }

  // Batch Processing Feature
  const batchUpdateTypes = {
    fixed: document.getElementById('batch-update-fixed'),
    percentage: document.getElementById('batch-update-percentage'),
    amount: document.getElementById('batch-update-amount')
  };

  const batchUpdateParams = {
    commission: {
      checkbox: document.getElementById('batch-update-commission'),
      params: document.getElementById('batch-commission-params'),
      value: document.getElementById('batch-commission-value'),
      operator: document.getElementById('batch-commission-operator')
    },
    initialFee: {
      checkbox: document.getElementById('batch-update-initial-fee'),
      params: document.getElementById('batch-initial-fee-params'),
      value: document.getElementById('batch-initial-fee-value'),
      operator: document.getElementById('batch-initial-fee-operator')
    },
    fixedFee: {
      checkbox: document.getElementById('batch-update-fixed-fee'),
      params: document.getElementById('batch-fixed-fee-params'),
      value: document.getElementById('batch-fixed-fee-value'),
      operator: document.getElementById('batch-fixed-fee-operator')
    },
    minPayout: {
      checkbox: document.getElementById('batch-update-min-payout'),
      params: document.getElementById('batch-min-payout-params'),
      value: document.getElementById('batch-min-payout-value'),
      operator: document.getElementById('batch-min-payout-operator')
    }
  };

  // Sample region data for demo
  const sampleRegions = [
    { id: 1, region: 'North America', currency: 'USD', commission: 15, initialFee: 100, fixedFee: 2, minPayout: 50 },
    { id: 2, region: 'Europe', currency: 'EUR', commission: 18, initialFee: 120, fixedFee: 2.5, minPayout: 60 },
    { id: 3, region: 'Asia Pacific', currency: 'USD', commission: 12, initialFee: 80, fixedFee: 1, minPayout: 30 },
    { id: 4, region: 'Latin America', currency: 'USD', commission: 16, initialFee: 90, fixedFee: 1.5, minPayout: 40 },
    { id: 5, region: 'Middle East', currency: 'USD', commission: 20, initialFee: 150, fixedFee: 3, minPayout: 70 }
  ];

  let selectedRegions = [];

  // Initialize batch processing functionality
  function initBatchProcessing() {
    // Set up event listeners for checkboxes and filters
    const batchSelectAll = document.getElementById('batch-select-all');
    if (batchSelectAll) {
      batchSelectAll.addEventListener('change', function() {
        selectedRegions = this.checked ? [...sampleRegions] : [];
        updateRegionSelectionUI();
      });
    }

    // Filter criteria change
    const batchFilterCriteria = document.getElementById('batch-filter-criteria');
    const batchFilterParams = document.getElementById('batch-filter-params');
    if (batchFilterCriteria && batchFilterParams) {
      batchFilterCriteria.addEventListener('change', function() {
        batchFilterParams.classList.toggle('d-none', !this.value);
      });
    }

    // Apply filter button
    const batchApplyFilter = document.getElementById('batch-apply-filter');
    if (batchApplyFilter) {
      batchApplyFilter.addEventListener('click', applyRegionFilter);
    }

    // Update parameter visibility when checkboxes change
    Object.values(batchUpdateParams).forEach(param => {
      if (param.checkbox && param.params) {
        param.checkbox.addEventListener('change', function() {
          param.params.classList.toggle('d-none', !this.checked);
        });
      }
    });

    // Update operator visibility based on update type
    Object.entries(batchUpdateTypes).forEach(([type, element]) => {
      if (element) {
        element.addEventListener('change', updateBatchOperators);
      }
    });

    // Preview button
    const batchPreviewBtn = document.getElementById('batch-preview-btn');
    if (batchPreviewBtn) {
      batchPreviewBtn.addEventListener('click', generateBatchPreview);
    }

    // Confirm changes checkbox
    const batchConfirmChanges = document.getElementById('batch-confirm-changes');
    const batchApplyBtn = document.getElementById('batch-apply-btn');
    if (batchConfirmChanges && batchApplyBtn) {
      batchConfirmChanges.addEventListener('change', function() {
        batchApplyBtn.disabled = !this.checked;
      });
    }

    // Apply changes button
    if (batchApplyBtn) {
      batchApplyBtn.addEventListener('click', function(e) {
        e.preventDefault();
        applyBatchChanges();
      });
    }

    // Download batch report button
    const downloadBatchReport = document.getElementById('download-batch-report');
    if (downloadBatchReport) {
      downloadBatchReport.addEventListener('click', function() {
        alert('Downloading batch update report... In a real implementation, this would generate and download a PDF report.');
      });
    }
  }

  // Apply region filter
  function applyRegionFilter() {
    const criteria = document.getElementById('batch-filter-criteria')?.value;
    if (!criteria) return;

    const operator = document.getElementById('batch-filter-operator')?.value;
    const filterValue = document.getElementById('batch-filter-value')?.value;

    if (!operator || !filterValue) {
      alert('Please enter a filter value and select an operator.');
      return;
    }

    // Filter regions based on criteria, operator, and value
    selectedRegions = sampleRegions.filter(region => {
      const regionValue = region[criteria];
      const numericFilterValue = parseFloat(filterValue);

      switch (operator) {
        case 'equals':
          if (criteria === 'currency') {
            return region.currency.toUpperCase() === filterValue.toUpperCase();
          } else {
            return regionValue == numericFilterValue;
          }
        case 'greater':
          return regionValue > numericFilterValue;
        case 'less':
          return regionValue < numericFilterValue;
        default:
          return true;
      }
    });

    updateRegionSelectionUI();
  }

  // Update region selection UI
  function updateRegionSelectionUI() {
    const regionList = document.getElementById('batch-region-list');
    if (!regionList) return;

    if (selectedRegions.length === 0) {
      regionList.innerHTML = `
        <div class="text-center text-muted py-4">
          <i class="fas fa-filter mb-2"></i>
          <p class="mb-0">No regions match the selected criteria</p>
        </div>
      `;
      return;
    }

    let html = '';
    selectedRegions.forEach(region => {
      html += `
        <div class="custom-control custom-checkbox mb-2">
          <input type="checkbox" class="custom-control-input" id="region-${region.id}" checked>
          <label class="custom-control-label" for="region-${region.id}">
            ${region.region} (${region.currency}) - Commission: ${region.commission}%, Initial Fee: ${region.currency} ${region.initialFee}
          </label>
        </div>
      `;
    });

    regionList.innerHTML = html;

    // Add event listeners to individual region checkboxes
    selectedRegions.forEach(region => {
      const checkbox = document.getElementById(`region-${region.id}`);
      if (checkbox) {
        checkbox.addEventListener('change', function() {
          if (!this.checked) {
            selectedRegions = selectedRegions.filter(r => r.id !== region.id);
            updateRegionSelectionUI();
          }
        });
      }
    });
  }

  // Update operator visibility based on update type
  function updateBatchOperators() {
    const updateType = document.querySelector('input[name="batch-update-type"]:checked')?.id;
    const showOperators = updateType === 'batch-update-percentage' || updateType === 'batch-update-amount';

    const operatorElements = document.querySelectorAll('.batch-operator-prepend');
    operatorElements.forEach(element => {
      element.classList.toggle('d-none', !showOperators);
    });
  }

  // Calculate the new value based on update type and old value
  function calculateNewValue(oldValue, paramValue, updateType, operator) {
    const value = parseFloat(paramValue);

    switch (updateType) {
      case 'fixed':
        return value;
      case 'percentage':
        const percentChange = (operator === 'increase' ? 1 : -1) * (value / 100);
        return oldValue * (1 + percentChange);
      case 'amount':
        return oldValue + ((operator === 'increase' ? 1 : -1) * value);
      default:
        return oldValue;
    }
  }

  // Generate batch preview
  function generateBatchPreview() {
    if (selectedRegions.length === 0) {
      alert('Please select at least one region to update.');
      return;
    }

    // Check that at least one parameter is selected for update
    const hasSelectedParam = Object.values(batchUpdateParams).some(param => param.checkbox?.checked);
    if (!hasSelectedParam) {
      alert('Please select at least one fee parameter to update.');
      return;
    }

    const batchPreviewContent = document.getElementById('batch-preview-content');
    if (!batchPreviewContent) return;

    // Get current update type
    const updateTypeElement = document.querySelector('input[name="batch-update-type"]:checked');
    const updateType = updateTypeElement ? updateTypeElement.id.replace('batch-update-', '') : 'fixed';

    // Generate preview
    let previewHTML = `
      <div class="alert alert-warning mb-3">
        <i class="fas fa-exclamation-triangle mr-2"></i> The following changes will be applied to ${selectedRegions.length} region(s). Please review carefully.
      </div>
      <div class="table-responsive">
        <table class="table table-bordered table-sm">
          <thead class="thead-light">
            <tr>
              <th>Region</th>
              <th>Field</th>
              <th>Current Value</th>
              <th>New Value</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
    `;

    // Generate preview rows
    selectedRegions.forEach(region => {
      let hasChanges = false;
      let regionRows = '';

      // Commission rate changes
      if (batchUpdateParams.commission.checkbox?.checked && batchUpdateParams.commission.value?.value) {
        const oldValue = region.commission;
        const operator = batchUpdateParams.commission.operator?.value || 'increase';
        const newValue = calculateNewValue(oldValue, batchUpdateParams.commission.value.value, updateType, operator);
        const change = newValue - oldValue;
        const changeClass = change > 0 ? 'text-success' : change < 0 ? 'text-danger' : 'text-muted';

        regionRows += `
          <tr>
            <td>${hasChanges ? '' : region.region}</td>
            <td>Commission Rate</td>
            <td>${oldValue}%</td>
            <td>${newValue.toFixed(1)}%</td>
            <td class="${changeClass}">${change > 0 ? '+' : ''}${change.toFixed(1)}%</td>
          </tr>
        `;

        hasChanges = true;
      }

      // Initial fee changes
      if (batchUpdateParams.initialFee.checkbox?.checked && batchUpdateParams.initialFee.value?.value) {
        const oldValue = region.initialFee;
        const operator = batchUpdateParams.initialFee.operator?.value || 'increase';
        const newValue = calculateNewValue(oldValue, batchUpdateParams.initialFee.value.value, updateType, operator);
        const change = newValue - oldValue;
        const changeClass = change > 0 ? 'text-success' : change < 0 ? 'text-danger' : 'text-muted';

        regionRows += `
          <tr>
            <td>${hasChanges ? '' : region.region}</td>
            <td>Initial Fee</td>
            <td>${region.currency} ${oldValue}</td>
            <td>${region.currency} ${newValue.toFixed(2)}</td>
            <td class="${changeClass}">${change > 0 ? '+' : ''}${region.currency} ${change.toFixed(2)}</td>
          </tr>
        `;

        hasChanges = true;
      }

      // Fixed fee changes
      if (batchUpdateParams.fixedFee.checkbox?.checked && batchUpdateParams.fixedFee.value?.value) {
        const oldValue = region.fixedFee;
        const operator = batchUpdateParams.fixedFee.operator?.value || 'increase';
        const newValue = calculateNewValue(oldValue, batchUpdateParams.fixedFee.value.value, updateType, operator);
        const change = newValue - oldValue;
        const changeClass = change > 0 ? 'text-success' : change < 0 ? 'text-danger' : 'text-muted';

        regionRows += `
          <tr>
            <td>${hasChanges ? '' : region.region}</td>
            <td>Fixed Fee</td>
            <td>${region.currency} ${oldValue}</td>
            <td>${region.currency} ${newValue.toFixed(2)}</td>
            <td class="${changeClass}">${change > 0 ? '+' : ''}${region.currency} ${change.toFixed(2)}</td>
          </tr>
        `;

        hasChanges = true;
      }

      // Min payout changes
      if (batchUpdateParams.minPayout.checkbox?.checked && batchUpdateParams.minPayout.value?.value) {
        const oldValue = region.minPayout;
        const operator = batchUpdateParams.minPayout.operator?.value || 'increase';
        const newValue = calculateNewValue(oldValue, batchUpdateParams.minPayout.value.value, updateType, operator);
        const change = newValue - oldValue;
        const changeClass = change > 0 ? 'text-success' : change < 0 ? 'text-danger' : 'text-muted';

        regionRows += `
          <tr>
            <td>${hasChanges ? '' : region.region}</td>
            <td>Minimum Payout</td>
            <td>${region.currency} ${oldValue}</td>
            <td>${region.currency} ${newValue.toFixed(2)}</td>
            <td class="${changeClass}">${change > 0 ? '+' : ''}${region.currency} ${change.toFixed(2)}</td>
          </tr>
        `;

        hasChanges = true;
      }

      previewHTML += regionRows;
    });

    previewHTML += `
          </tbody>
        </table>
      </div>
    `;

    batchPreviewContent.innerHTML = previewHTML;
  }

  // Apply batch changes
  function applyBatchChanges() {
    // In a real implementation, this would send the changes to the API
    addNotification(
      'Batch Update Complete',
      `Successfully updated ${selectedRegions.length} regions.`,
      'success',
      true
    );

    // Reset the form
    document.getElementById('batch-processing-form')?.reset();
    selectedRegions = [];
    updateRegionSelectionUI();

    // Update the batch history table with the new entry
    const batchHistoryTable = document.getElementById('batch-history-table');
    if (batchHistoryTable) {
      const now = new Date();
      const dateString = now.toLocaleString();

      // Get the update type
      let actionType = '';
      if (batchUpdateParams.commission.checkbox?.checked) actionType = 'Commission Rate Update';
      else if (batchUpdateParams.initialFee.checkbox?.checked) actionType = 'Initial Fee Update';
      else if (batchUpdateParams.fixedFee.checkbox?.checked) actionType = 'Fixed Fee Update';
      else if (batchUpdateParams.minPayout.checkbox?.checked) actionType = 'Min Payout Update';

      const newRow = document.createElement('tr');
      newRow.innerHTML = `
        <td>${dateString}</td>
        <td>current_user@example.com</td>
        <td>${actionType}</td>
        <td>${selectedRegions.length} regions</td>
        <td><button class="btn btn-sm btn-info" data-toggle="modal" data-target="#batch-details-modal"><i class="fas fa-info-circle"></i> View</button></td>
      `;

      batchHistoryTable.insertBefore(newRow, batchHistoryTable.firstChild);
    }
  }

  // Initialize batch processing on page load
  initBatchProcessing();

});
