/**
 * Admin Tax Document Management
 * This script handles all tax document management functionality for the admin dashboard
 * including form generation, filtering, status updates, and modal interactions.
 */

// Import the notification services
import { AdminNotificationService } from './services/admin-notification-service.js';
import { AdminNotificationHandler } from './services/admin-notification-handler.js';
import { MLComplianceService } from './services/ml-compliance-service.js';
import { showRiskExpertDetails } from './expert-risk-analysis.js';
import { initScenarioModeling } from './scenario-modeler.js';

document.addEventListener('DOMContentLoaded', function() {
    // Initialize notification service
    const notificationService = new AdminNotificationService();
    const notificationHandler = new AdminNotificationHandler(notificationService);
    notificationHandler.initNotifications();

    // Initialize tax document functionality
    initTaxDocumentManagement();
});

/**
 * Initialize all tax document management functionality
 */
function initTaxDocumentManagement() {
    // Initialize UI elements
    initUIElements();

    // Initialize tax document filters
    initTaxDocumentFilters();

    // Initialize modals
    initModals();

    // Initialize bulk actions
    initBulkActions();

    // Initialize toggle switches
    initToggleSwitches();

    // Initialize template tabs
    initTemplateTabs();

    // Initialize charts
    initCharts();

    // Initialize year comparison
    initYearComparison();

    // Initialize batch export
    initBatchExport();

    // Initialize permissions management
    initPermissionsManagement();

    // Initialize AI-powered compliance forecasting
    initComplianceForecasting();

    // Initialize expert risk drill-down
    initExpertRiskDrillDown();

    // Load tax documents data
    loadTaxDocuments();
}

/**
 * Initialize permissions management functionality
 */
function initPermissionsManagement() {
    // Event listeners for permission checkboxes
    const permissionCheckboxes = document.querySelectorAll('.permission-checkbox');
    permissionCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            // Log permission change (in a real system, this would update the database)
            console.log(`Permission ${this.id} ${this.checked ? 'granted' : 'revoked'}`);
        });
    });

    // Event listener for "Add User Override" button
    const addUserPermissionBtn = document.getElementById('add-user-permission-btn');
    if (addUserPermissionBtn) {
        addUserPermissionBtn.addEventListener('click', function() {
            // In a real system, this would open a user search modal
            alert('In a production environment, this would open a user search modal to select a user.');
        });
    }

    // Event listeners for edit permission buttons
    const editPermissionButtons = document.querySelectorAll('.edit-permission');
    editPermissionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const userItem = this.closest('.user-permission-item');
            const userName = userItem.querySelector('.user-name').textContent;
            const userEmail = userItem.querySelector('.user-email').textContent;
            const userAvatar = userItem.querySelector('.avatar-sm').getAttribute('src');

            openPermissionModal(userName, userEmail, userAvatar);
        });
    });

    // Event listeners for remove permission buttons
    const removePermissionButtons = document.querySelectorAll('.remove-permission');
    removePermissionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const userItem = this.closest('.user-permission-item');
            const userName = userItem.querySelector('.user-name').textContent;

            // Confirm before removing
            if (confirm(`Remove custom permissions for ${userName}?`)) {
                userItem.remove();

                // Show notification
                const notificationService = new AdminNotificationService();
                notificationService.addNotification({
                    id: `remove-permission-${Date.now()}`,
                    type: 'success',
                    title: 'Permissions Removed',
                    message: `Custom permissions for ${userName} have been removed.`,
                    time: new Date(),
                    read: false
                });
            }
        });
    });

    // Event listener for cancel permission button
    const cancelPermissionBtn = document.getElementById('cancel-permission-btn');
    if (cancelPermissionBtn) {
        cancelPermissionBtn.addEventListener('click', function() {
            closePermissionModal();
        });
    }

    // Event listener for save permission button
    const savePermissionBtn = document.getElementById('save-permission-btn');
    if (savePermissionBtn) {
        savePermissionBtn.addEventListener('click', function() {
            saveUserPermissions();
        });
    }
}

/**
 * Open permission modal for a user
 * @param {string} userName - User's name
 * @param {string} userEmail - User's email
 * @param {string} userAvatar - URL to user's avatar
 */
function openPermissionModal(userName, userEmail, userAvatar) {
    // Set user information in the modal
    document.getElementById('permission-user-name').textContent = userName;
    document.getElementById('permission-user-email').textContent = userEmail;
    document.getElementById('permission-user-avatar').setAttribute('src', userAvatar);

    // Get current permissions from the user item (in a real system, this would come from the database)
    const permissionTags = document.querySelectorAll('.user-permission-access .permission-tag');
    const currentPermissions = Array.from(permissionTags).map(tag => tag.textContent);

    // Set checkboxes based on current permissions
    document.getElementById('permission-view').checked = currentPermissions.includes('View');
    document.getElementById('permission-download').checked = currentPermissions.includes('Download');
    document.getElementById('permission-generate').checked = currentPermissions.includes('Generate');
    document.getElementById('permission-send').checked = currentPermissions.includes('Send');
    document.getElementById('permission-edit').checked = currentPermissions.includes('Edit');

    // Open the modal
    const modal = document.getElementById('user-permission-modal');
    modal.style.display = 'block';
}

/**
 * Close permission modal
 */
function closePermissionModal() {
    const modal = document.getElementById('user-permission-modal');
    modal.style.display = 'none';
}

/**
 * Save user permissions
 */
function saveUserPermissions() {
    // Get user information from the modal
    const userName = document.getElementById('permission-user-name').textContent;
    const userEmail = document.getElementById('permission-user-email').textContent;
    const userAvatar = document.getElementById('permission-user-avatar').getAttribute('src');

    // Get selected permissions
    const permissions = [];
    if (document.getElementById('permission-view').checked) permissions.push('View');
    if (document.getElementById('permission-download').checked) permissions.push('Download');
    if (document.getElementById('permission-generate').checked) permissions.push('Generate');
    if (document.getElementById('permission-send').checked) permissions.push('Send');
    if (document.getElementById('permission-edit').checked) permissions.push('Edit');

    // Log permissions (in a real system, this would update the database)
    console.log(`Saving permissions for ${userName}:`, permissions);

    // In a real system, this would update the user's permissions in the UI
    // For demo purposes, just show a notification
    const notificationService = new AdminNotificationService();
    notificationService.addNotification({
        id: `save-permission-${Date.now()}`,
        type: 'success',
        title: 'Permissions Updated',
        message: `Permissions for ${userName} have been updated.`,
        time: new Date(),
        read: false
    });

    // Close the modal
    closePermissionModal();
}

/**
 * Initialize template tabs functionality
 */
function initTemplateTabs() {
    const templateTabs = document.querySelectorAll('.template-tab');
    if (templateTabs.length === 0) return;

    templateTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs and contents
            document.querySelectorAll('.template-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.template-content').forEach(c => c.classList.remove('active'));

            // Add active class to clicked tab
            this.classList.add('active');

            // Get template type
            const templateType = this.getAttribute('data-template');

            // Show corresponding content
            const contentId = `${templateType}-templates`;
            const content = document.getElementById(contentId);
            if (content) {
                content.classList.add('active');
            }
        });
    });
}

/**
 * Initialize charts for tax document compliance
 */
function initCharts() {
    // Form type compliance chart
    initFormTypeComplianceChart();

    // Time-based compliance chart
    initTimeComplianceChart();

    // Country compliance chart
    initCountryComplianceChart();

    // Delivery success chart
    initDeliverySuccessChart();

    // Add event listener for period selector
    const periodSelector = document.getElementById('compliance-period');
    if (periodSelector) {
        periodSelector.addEventListener('change', function() {
            // Refresh all charts with new period
            initFormTypeComplianceChart();
            initTimeComplianceChart();
            initCountryComplianceChart();
            initDeliverySuccessChart();
        });
    }
}

/**
 * Initialize form type compliance chart
 */
function initFormTypeComplianceChart() {
    const ctx = document.getElementById('formTypeComplianceChart');
    if (!ctx) return;

    // Sample data - in real application, this would come from an API
    const data = {
        labels: ['1099-NEC', '1099-MISC', 'W-8BEN', 'W-9'],
        datasets: [
            {
                label: 'Complete',
                data: [120, 42, 35, 48],
                backgroundColor: '#4a6cf7'
            },
            {
                label: 'Pending',
                data: [12, 8, 5, 2],
                backgroundColor: '#f7c32e'
            },
            {
                label: 'Missing Info',
                data: [5, 3, 4, 1],
                backgroundColor: '#dc3545'
            }
        ]
    };

    // Clear any existing chart
    if (window.formTypeChart) {
        window.formTypeChart.destroy();
    }

    // Create new chart
    window.formTypeChart = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
}

/**
 * Initialize time-based compliance chart
 */
function initTimeComplianceChart() {
    const ctx = document.getElementById('timeComplianceChart');
    if (!ctx) return;

    // Sample data - in real application, this would come from an API
    const data = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
                label: 'Compliance Rate (%)',
                data: [82, 85, 87, 89, 90, 91, 92, 93, 94, 94, 95, 95],
                borderColor: '#4a6cf7',
                backgroundColor: 'rgba(74, 108, 247, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    // Clear any existing chart
    if (window.timeComplianceChart) {
        window.timeComplianceChart.destroy();
    }

    // Create new chart
    window.timeComplianceChart = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 80,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.raw + '%';
                        }
                    }
                }
            }
        }
    });
}

/**
 * Initialize country compliance chart
 */
function initCountryComplianceChart() {
    const ctx = document.getElementById('countryComplianceChart');
    if (!ctx) return;

    // Sample data - in real application, this would come from an API
    const data = {
        labels: ['United States', 'Canada', 'United Kingdom', 'Australia', 'Other'],
        datasets: [
            {
                data: [95, 92, 88, 90, 82],
                backgroundColor: ['#4a6cf7', '#38b249', '#f7c32e', '#17a2b8', '#6c757d'],
                hoverOffset: 4
            }
        ]
    };

    // Clear any existing chart
    if (window.countryComplianceChart) {
        window.countryComplianceChart.destroy();
    }

    // Create new chart
    window.countryComplianceChart = new Chart(ctx, {
        type: 'pie',
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
                            return context.label + ': ' + context.raw + '%';
                        }
                    }
                }
            }
        }
    });
}

/**
 * Initialize delivery success chart
 */
function initDeliverySuccessChart() {
    const ctx = document.getElementById('deliverySuccessChart');
    if (!ctx) return;

    // Sample data - in real application, this would come from an API
    const data = {
        labels: ['Delivered', 'Opened', 'Downloaded', 'Issues'],
        datasets: [
            {
                data: [226, 215, 198, 8],
                backgroundColor: ['#38b249', '#4a6cf7', '#f7c32e', '#dc3545'],
                borderWidth: 0
            }
        ]
    };

    // Clear any existing chart
    if (window.deliverySuccessChart) {
        window.deliverySuccessChart.destroy();
    }

    // Create new chart
    window.deliverySuccessChart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

/**
 * Initialize year comparison functionality
 */
function initYearComparison() {
    // Initialize year comparison chart
    initYearComparisonChart();

    // Add event listeners for year selectors
    const baseYearSelector = document.getElementById('base-year');
    if (baseYearSelector) {
        baseYearSelector.addEventListener('change', function() {
            initYearComparisonChart();
            updateComparisonMetrics();
        });
    }

    const compareYearsSelector = document.getElementById('compare-years');
    if (compareYearsSelector) {
        compareYearsSelector.addEventListener('change', function() {
            initYearComparisonChart();
            updateComparisonMetrics();
        });
    }

    // Add event listener for the export comparison button
    const exportComparisonBtn = document.getElementById('export-comparison-btn');
    if (exportComparisonBtn) {
        exportComparisonBtn.addEventListener('click', function() {
            exportComparisonReport();
        });
    }

    // Initialize comparison metrics
    updateComparisonMetrics();
}

/**
 * Initialize year comparison chart
 */
function initYearComparisonChart() {
    const ctx = document.getElementById('yearComparisonChart');
    if (!ctx) return;

    // Get selected years
    const baseYear = document.getElementById('base-year').value;
    const compareYears = Array.from(document.getElementById('compare-years').selectedOptions).map(option => option.value);

    // Generate colors for each year
    const colors = ['#4a6cf7', '#38b249', '#f7c32e', '#17a2b8', '#dc3545'];

    // Sample data - in real application, this would come from an API
    const labels = ['1099-NEC', '1099-MISC', 'W-8BEN', 'W-9', 'Total'];

    const datasets = [
        {
            label: baseYear,
            data: [120, 45, 40, 50, 255],
            backgroundColor: colors[0],
            borderColor: colors[0],
            borderWidth: 2,
            fill: false
        }
    ];

    // Sample data for comparison years
    const yearData = {
        '2022': [105, 40, 35, 45, 225],
        '2021': [90, 35, 30, 40, 195],
        '2020': [75, 30, 25, 35, 165]
    };

    // Add datasets for each comparison year
    compareYears.forEach((year, index) => {
        datasets.push({
            label: year,
            data: yearData[year] || generateRandomData(5),
            backgroundColor: colors[index + 1] || getRandomColor(),
            borderColor: colors[index + 1] || getRandomColor(),
            borderWidth: 2,
            fill: false
        });
    });

    // Clear any existing chart
    if (window.yearComparisonChart) {
        window.yearComparisonChart.destroy();
    }

    // Create new chart
    window.yearComparisonChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label;
                        },
                        label: function(context) {
                            return context.dataset.label + ': ' + context.raw + ' forms';
                        }
                    }
                }
            }
        }
    });
}

/**
 * Update comparison metrics
 */
function updateComparisonMetrics() {
    // Sample data - in real application, this would come from an API
    const baseYear = document.getElementById('base-year').value;
    const compareYear = document.getElementById('compare-years').selectedOptions[0]?.value || '2022';

    // Update metrics with some sample calculations
    const metrics = [
        {
            id: 'total-forms',
            baseValue: 258,
            compareValue: 230,
            format: (val) => val,
            label: (diff) => `${Math.abs(diff)}% ${diff > 0 ? 'more' : 'less'} than previous year`
        },
        {
            id: 'processing-time',
            baseValue: 3.2,
            compareValue: 3.8,
            format: (val) => `${val} days`,
            label: (diff) => `${Math.abs(diff)}% ${diff < 0 ? 'faster' : 'slower'} than previous year`
        },
        {
            id: 'compliance-rate',
            baseValue: 95,
            compareValue: 90,
            format: (val) => `${val}%`,
            label: (diff) => `${Math.abs(diff)}% ${diff > 0 ? 'better' : 'worse'} than previous year`
        },
        {
            id: 'form-corrections',
            baseValue: 22,
            compareValue: 18,
            format: (val) => val,
            label: (diff) => `${Math.abs(Math.round(diff / compareValue * 100))}% ${diff > 0 ? 'more' : 'fewer'} than previous year`
        }
    ];

    // Get all metric elements
    const metricElements = document.querySelectorAll('.comparison-metrics .comparison-metric');

    // Update each metric
    metricElements.forEach((element, index) => {
        if (index < metrics.length) {
            const metric = metrics[index];
            const valueElement = element.querySelector('.comparison-value');
            const changeElement = element.querySelector('.comparison-change');

            if (valueElement) {
                valueElement.textContent = metric.format(metric.baseValue);
            }

            if (changeElement) {
                const diff = ((metric.baseValue - metric.compareValue) / metric.compareValue) * 100;
                const isPositive = (metric.id === 'processing-time' || metric.id === 'form-corrections') ? diff < 0 : diff > 0;

                changeElement.innerHTML = `<i class="fas fa-arrow-${isPositive ? 'up' : 'down'}"></i> ${metric.label(diff)}`;
                changeElement.classList.remove('positive', 'negative');
                changeElement.classList.add(isPositive ? 'positive' : 'negative');
            }
        }
    });
}

/**
 * Export comparison report
 */
function exportComparisonReport() {
    // This would normally call an API to generate a report
    console.log('Exporting comparison report...');

    // Show notification
    const notificationService = new AdminNotificationService();
    notificationService.addNotification({
        id: 'export-comparison',
        type: 'success',
        title: 'Report Exported',
        message: 'Multi-year comparison report has been exported successfully.',
        time: new Date(),
        read: false
    });
}

/**
 * Generate random data for chart (helper function)
 * @param {number} count - Number of data points to generate
 * @returns {Array} - Array of random numbers
 */
function generateRandomData(count) {
    return Array.from({ length: count }, () => Math.floor(Math.random() * 100) + 50);
}

/**
 * Get random color (helper function)
 * @returns {string} - Random color in hex format
 */
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

/**
 * Initialize batch export functionality
 */
function initBatchExport() {
    // Get batch export button
    const batchExportBtn = document.getElementById('batch-export-btn');
    if (batchExportBtn) {
        batchExportBtn.addEventListener('click', function() {
            openBatchExportModal();
        });
    }

    // Get export documents button
    const exportDocumentsBtn = document.getElementById('export-documents-btn');
    if (exportDocumentsBtn) {
        exportDocumentsBtn.addEventListener('click', function() {
            exportTaxDocumentsBatch();
        });
    }

    // Get close export modal button
    const closeExportModalBtn = document.getElementById('close-export-modal-btn');
    if (closeExportModalBtn) {
        closeExportModalBtn.addEventListener('click', function() {
            closeBatchExportModal();
        });
    }

    // Add event listeners to export options
    const exportOptions = document.querySelectorAll('.export-option');
    exportOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all options
            document.querySelectorAll('.export-option').forEach(opt => opt.classList.remove('active'));

            // Add active class to clicked option
            this.classList.add('active');
        });
    });

    // Set first option as active by default
    if (exportOptions.length > 0) {
        exportOptions[0].classList.add('active');
    }
}

/**
 * Open batch export modal
 */
function openBatchExportModal() {
    const modal = document.getElementById('batch-export-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

/**
 * Close batch export modal
 */
function closeBatchExportModal() {
    const modal = document.getElementById('batch-export-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Export tax documents in batch
 */
function exportTaxDocumentsBatch() {
    // Get active export option
    const activeOption = document.querySelector('.export-option.active');
    if (!activeOption) return;

    // Get export type
    const exportType = activeOption.getAttribute('data-export-type');

    // Get selected format
    const formatRadios = document.querySelectorAll('input[name="export-format"]');
    let selectedFormat = 'pdf';
    formatRadios.forEach(radio => {
        if (radio.checked) {
            selectedFormat = radio.value;
        }
    });

    // Prepare export parameters based on type
    let exportParams = {
        format: selectedFormat
    };

    switch (exportType) {
        case 'all':
            exportParams.year = document.getElementById('export-year-all').value;
            exportParams.type = 'all';
            break;
        case 'by-form':
            exportParams.year = document.getElementById('export-year-form').value;
            exportParams.formType = document.getElementById('export-form-type').value;
            exportParams.type = 'by-form';
            break;
        case 'by-country':
            exportParams.year = document.getElementById('export-year-country').value;
            exportParams.country = document.getElementById('export-country').value;
            exportParams.type = 'by-country';
            break;
        case 'by-status':
            exportParams.year = document.getElementById('export-year-status').value;
            exportParams.status = document.getElementById('export-status').value;
            exportParams.type = 'by-status';
            break;
    }

    // For demo purposes, log the export parameters
    console.log('Exporting tax documents with parameters:', exportParams);

    // Show notification
    const notificationService = new AdminNotificationService();

    // Customize the notification based on the export type
    let title, message;

    switch (exportType) {
        case 'all':
            title = `${exportParams.year} Tax Documents Exported`;
            message = `All tax documents for ${exportParams.year} have been exported as ${formatToString(selectedFormat)}.`;
            break;
        case 'by-form':
            title = `${exportParams.formType} Forms Exported`;
            message = `${exportParams.formType} forms for ${exportParams.year} have been exported as ${formatToString(selectedFormat)}.`;
            break;
        case 'by-country':
            title = `${getCountryName(exportParams.country)} Tax Documents Exported`;
            message = `Tax documents for experts in ${getCountryName(exportParams.country)} for ${exportParams.year} have been exported as ${formatToString(selectedFormat)}.`;
            break;
        case 'by-status':
            title = `${getStatusName(exportParams.status)} Tax Documents Exported`;
            message = `Tax documents with status "${getStatusName(exportParams.status)}" for ${exportParams.year} have been exported as ${formatToString(selectedFormat)}.`;
            break;
        default:
            title = 'Tax Documents Exported';
            message = 'Tax documents have been exported successfully.';
    }

    notificationService.addNotification({
        id: `batch-export-${Date.now()}`,
        type: 'success',
        title: title,
        message: message,
        time: new Date(),
        read: false
    });

    // Close the modal
    closeBatchExportModal();
}

/**
 * Format type to string (helper function)
 * @param {string} format - Format type (pdf, csv, both)
 * @returns {string} - Formatted string
 */
function formatToString(format) {
    switch (format) {
        case 'pdf':
            return 'PDF Documents';
        case 'csv':
            return 'CSV Summary';
        case 'both':
            return 'PDF Documents and CSV Summary';
        default:
            return format;
    }
}

/**
 * Get country name from code (helper function)
 * @param {string} countryCode - Country code
 * @returns {string} - Country name
 */
function getCountryName(countryCode) {
    const countries = {
        'US': 'United States',
        'CA': 'Canada',
        'GB': 'United Kingdom',
        'AU': 'Australia',
        'other': 'Other Countries'
    };

    return countries[countryCode] || countryCode;
}

/**
 * Get status name from code (helper function)
 * @param {string} statusCode - Status code
 * @returns {string} - Status name
 */
function getStatusName(statusCode) {
    const statuses = {
        'generated': 'Generated',
        'sent': 'Sent',
        'pending': 'Pending Generation',
        'missing-info': 'Missing Information'
    };

    return statuses[statusCode] || statusCode;
}

/**
 * Initialize UI element event listeners
 */
function initUIElements() {
    // Tax year selector
    const taxYearSelector = document.getElementById('tax-year');
    if (taxYearSelector) {
        taxYearSelector.addEventListener('change', function() {
            loadTaxDocuments();
        });
    }

    // Generate all button
    const generateAllBtn = document.getElementById('generate-all-btn');
    if (generateAllBtn) {
        generateAllBtn.addEventListener('click', function() {
            generateAllTaxForms();
        });
    }

    // Send all button
    const sendAllBtn = document.getElementById('send-all-btn');
    if (sendAllBtn) {
        sendAllBtn.addEventListener('click', function() {
            sendAllTaxForms();
        });
    }

    // Export tax data button
    const exportTaxDataBtn = document.getElementById('export-tax-data-btn');
    if (exportTaxDataBtn) {
        exportTaxDataBtn.addEventListener('click', function() {
            exportTaxData();
        });
    }

    // Save tax settings button
    const saveTaxSettingsBtn = document.getElementById('save-tax-settings-btn');
    if (saveTaxSettingsBtn) {
        saveTaxSettingsBtn.addEventListener('click', function() {
            saveTaxSettings();
        });
    }

    // Table action buttons
    initTableActionButtons();
}

/**
 * Initialize tax document filters
 */
function initTaxDocumentFilters() {
    // Apply filters button
    const applyFiltersBtn = document.getElementById('apply-tax-form-filters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function() {
            applyTaxFormFilters();
        });
    }

    // Reset filters button
    const resetFiltersBtn = document.getElementById('reset-tax-form-filters');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', function() {
            resetTaxFormFilters();
        });
    }

    // Search button
    const searchBtn = document.getElementById('tax-form-search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            applyTaxFormFilters();
        });
    }

    // Search input (search on enter press)
    const searchInput = document.getElementById('tax-form-search');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                applyTaxFormFilters();
            }
        });
    }
}

/**
 * Load tax documents based on filters
 */
function loadTaxDocuments() {
    // This would normally be an API call to get tax documents
    console.log('Loading tax documents...');

    // For demo purposes, we'll leave the existing sample data
}

/**
 * Apply tax form filters
 */
function applyTaxFormFilters() {
    const formType = document.getElementById('tax-form-type').value;
    const formStatus = document.getElementById('tax-form-status').value;
    const formCountry = document.getElementById('tax-form-country').value;
    const searchTerm = document.getElementById('tax-form-search').value;

    // For demo purposes, just reload the tax documents
    loadTaxDocuments();

    // Show notification
    const notificationService = new AdminNotificationService();
    notificationService.addNotification({
        id: 'filter-applied',
        type: 'info',
        title: 'Filters Applied',
        message: 'Tax document list filtered successfully.',
        time: new Date(),
        read: false
    });
}

/**
 * Reset tax form filters
 */
function resetTaxFormFilters() {
    // Reset form type
    document.getElementById('tax-form-type').value = 'all';

    // Reset form status
    document.getElementById('tax-form-status').value = 'all';

    // Reset form country
    document.getElementById('tax-form-country').value = 'all';

    // Reset search term
    document.getElementById('tax-form-search').value = '';

    // Reload tax documents
    loadTaxDocuments();
}

/**
 * Initialize modals
 */
function initModals() {
    // Get modal elements
    const taxFormDetailModal = document.getElementById('tax-form-detail-modal');
    const requestInfoModal = document.getElementById('request-info-modal');
    const batchExportModal = document.getElementById('batch-export-modal');

    // Close buttons
    const closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            closeAllModals();
        });
    });

    // Close tax form modal button
    const closeTaxFormModalBtn = document.getElementById('close-tax-form-modal-btn');
    if (closeTaxFormModalBtn) {
        closeTaxFormModalBtn.addEventListener('click', function() {
            closeTaxFormModal();
        });
    }

    // Send tax form button in modal
    const sendTaxFormBtn = document.getElementById('send-tax-form-btn');
    if (sendTaxFormBtn) {
        sendTaxFormBtn.addEventListener('click', function() {
            sendTaxFormFromModal();
        });
    }

    // Download tax form button in modal
    const downloadTaxFormBtn = document.getElementById('download-tax-form-btn');
    if (downloadTaxFormBtn) {
        downloadTaxFormBtn.addEventListener('click', function() {
            downloadTaxFormFromModal();
        });
    }

    // Cancel request button
    const cancelRequestBtn = document.getElementById('cancel-request-btn');
    if (cancelRequestBtn) {
        cancelRequestBtn.addEventListener('click', function() {
            closeRequestInfoModal();
        });
    }

    // Send request button
    const sendRequestBtn = document.getElementById('send-request-btn');
    if (sendRequestBtn) {
        sendRequestBtn.addEventListener('click', function() {
            sendTaxInfoRequest();
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === taxFormDetailModal) {
            closeTaxFormModal();
        } else if (event.target === requestInfoModal) {
            closeRequestInfoModal();
        } else if (event.target === batchExportModal) {
            closeBatchExportModal();
        }
    });
}

/**
 * Initialize bulk actions
 */
function initBulkActions() {
    // Select all checkbox
    const selectAllCheckbox = document.getElementById('select-all-tax-forms');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const isChecked = this.checked;
            const checkboxes = document.querySelectorAll('.tax-form-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = isChecked;
            });
        });
    }
}

/**
 * Initialize toggle switches
 */
function initToggleSwitches() {
    const toggleSwitches = document.querySelectorAll('.toggle-input');
    toggleSwitches.forEach(toggle => {
        toggle.addEventListener('change', function() {
            // Update visual state
            const toggleLabel = this.nextElementSibling;

            // If this is the auto-generate switch, show/hide generation date
            if (this.id === 'auto-generate') {
                const generationDateGroup = document.querySelector('[for="generation-date"]').parentElement;
                if (this.checked) {
                    generationDateGroup.style.display = 'block';
                } else {
                    generationDateGroup.style.display = 'none';
                }
            }
        });
    });
}

/**
 * Initialize table action buttons
 */
function initTableActionButtons() {
    // Add event listeners to table action buttons
    document.addEventListener('click', function(event) {
        // View tax form
        if (event.target.closest('.view-tax-form')) {
            const button = event.target.closest('.view-tax-form');
            const taxFormId = button.getAttribute('data-id');
            viewTaxForm(taxFormId);
        }

        // Download tax form
        if (event.target.closest('.download-tax-form')) {
            const button = event.target.closest('.download-tax-form');
            const taxFormId = button.getAttribute('data-id');
            downloadTaxForm(taxFormId);
        }

        // Send tax form
        if (event.target.closest('.send-tax-form') || event.target.closest('.resend-tax-form')) {
            const button = event.target.closest('.send-tax-form') || event.target.closest('.resend-tax-form');
            const taxFormId = button.getAttribute('data-id');
            sendTaxForm(taxFormId);
        }

        // Request information
        if (event.target.closest('.request-info')) {
            const button = event.target.closest('.request-info');
            const taxFormId = button.getAttribute('data-id');
            openRequestInfoModal(taxFormId);
        }

        // Edit tax information
        if (event.target.closest('.edit-tax-info')) {
            const button = event.target.closest('.edit-tax-info');
            const taxFormId = button.getAttribute('data-id');
            editTaxInfo(taxFormId);
        }

        // Generate tax form
        if (event.target.closest('.generate-tax-form')) {
            const button = event.target.closest('.generate-tax-form');
            const taxFormId = button.getAttribute('data-id');
            generateTaxForm(taxFormId);
        }
    });
}

/**
 * Close all modals
 */
function closeAllModals() {
    closeTaxFormModal();
    closeRequestInfoModal();
    closeBatchExportModal();
}

/**
 * Close tax form modal
 */
function closeTaxFormModal() {
    const modal = document.getElementById('tax-form-detail-modal');
    modal.style.display = 'none';
}

/**
 * Update tax statistics
 */
function updateTaxStats() {
    // For demo purposes, update with random increments
    const totalTaxForms = document.getElementById('totalTaxForms');
    const formsGenerated = document.getElementById('formsGenerated');
    const missingInfo = document.getElementById('missingInfo');
    const sentToExperts = document.getElementById('sentToExperts');

    // Increment counters (for demo only)
    if (totalTaxForms) totalTaxForms.textContent = (parseInt(totalTaxForms.textContent) + 1).toString();
    if (formsGenerated) formsGenerated.textContent = (parseInt(formsGenerated.textContent) + 1).toString();
    if (sentToExperts) sentToExperts.textContent = (parseInt(sentToExperts.textContent) + 1).toString();

    // Calculate percentages
    const generationRate = Math.round((parseInt(formsGenerated.textContent) / parseInt(totalTaxForms.textContent)) * 100);
    const deliveryRate = Math.round((parseInt(sentToExperts.textContent) / parseInt(formsGenerated.textContent)) * 100);

    // Update percentage displays
    const generationRateElement = formsGenerated.parentElement.querySelector('.stat-change');
    generationRateElement.innerHTML = `<i class="fas fa-arrow-up"></i> ${generationRate}% completion rate`;

    const deliveryRateElement = sentToExperts.parentElement.querySelector('.stat-change');
    deliveryRateElement.innerHTML = `<i class="fas fa-arrow-up"></i> ${deliveryRate}% delivery rate`;
}

// CSS for tax form preview
const style = document.createElement('style');
style.textContent = `
    .tax-form-preview {
        border: 1px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
        font-family: Arial, sans-serif;
    }

    .tax-form-header {
        background-color: #f8f9fa;
        padding: 15px;
        border-bottom: 1px solid #ddd;
    }

    .tax-form-header h3 {
        margin: 0 0 5px 0;
        color: #333;
    }

    .tax-form-header p {
        margin: 0;
        color: #6c757d;
    }

    .tax-form-content {
        padding: 15px;
    }

    .tax-form-section {
        margin-bottom: 20px;
    }

    .tax-form-section:last-child {
        margin-bottom: 0;
    }

    .tax-form-section h4 {
        margin: 0 0 10px 0;
        padding-bottom: 5px;
        border-bottom: 1px solid #eee;
        color: #495057;
    }

    .tax-form-section p {
        margin: 5px 0;
        font-size: 14px;
    }

    .tax-form-footer {
        background-color: #fff8e1;
        padding: 10px 15px;
        border-top: 1px solid #ffe082;
    }

    .tax-form-footer p {
        margin: 0;
        font-size: 14px;
        color: #856404;
    }
`;
document.head.appendChild(style);

/**
 * Generate all tax forms
 */
function generateAllTaxForms() {
    // This would be an API call to generate all tax forms
    console.log('Generating all tax forms...');

    // Show notification
    const notificationService = new AdminNotificationService();
    notificationService.addNotification({
        id: 'generate-all',
        type: 'success',
        title: 'Tax Forms Generated',
        message: 'All tax forms have been successfully generated.',
        time: new Date(),
        read: false
    });

    // Update UI stats
    updateTaxStats();
}

/**
 * Send all tax forms
 */
function sendAllTaxForms() {
    // This would be an API call to send all tax forms
    console.log('Sending all tax forms...');

    // Show notification
    const notificationService = new AdminNotificationService();
    notificationService.addNotification({
        id: 'send-all',
        type: 'success',
        title: 'Tax Forms Sent',
        message: 'All tax forms have been sent to experts.',
        time: new Date(),
        read: false
    });

    // Update UI stats
    updateTaxStats();
}

/**
 * Export tax data
 */
function exportTaxData() {
    // This would be an API call to export tax data
    console.log('Exporting tax data...');

    // Show notification
    const notificationService = new AdminNotificationService();
    notificationService.addNotification({
        id: 'export-data',
        type: 'success',
        title: 'Tax Data Exported',
        message: 'Tax data has been exported successfully.',
        time: new Date(),
        read: false
    });
}

/**
 * Save tax settings
 */
function saveTaxSettings() {
    // This would be an API call to save tax settings
    console.log('Saving tax settings...');

    // Get setting values
    const autoGenerate = document.getElementById('auto-generate').checked;
    const generationDate = document.getElementById('generation-date').value;
    const minimumThreshold = document.getElementById('minimum-threshold').value;
    const reminderFrequency = document.getElementById('reminder-frequency').value;
    const companyName = document.getElementById('company-name').value;
    const companyAddress = document.getElementById('company-address').value;
    const companyEIN = document.getElementById('company-ein').value;
    const companyPhone = document.getElementById('company-phone').value;

    // Get active template tab
    const activeTab = document.querySelector('.template-tab.active');
    const activeTemplateType = activeTab.getAttribute('data-template');

    // For demo purposes, log the values
    console.log({
        autoGenerate,
        generationDate,
        minimumThreshold,
        reminderFrequency,
        companyName,
        companyAddress,
        companyEIN,
        companyPhone,
        activeTemplateType
    });

    // Show notification
    const notificationService = new AdminNotificationService();
    notificationService.addNotification({
        id: 'save-settings',
        type: 'success',
        title: 'Tax Settings Saved',
        message: 'Tax settings have been saved successfully.',
        time: new Date(),
        read: false
    });
}

/**
 * View tax form
 * @param {string} taxFormId - The ID of the tax form to view
 */
function viewTaxForm(taxFormId) {
    console.log(`Viewing tax form: ${taxFormId}`);

    // Open the modal
    const modal = document.getElementById('tax-form-detail-modal');
    modal.style.display = 'block';

    // For demo purposes, populate with sample data
    const detailContainer = document.getElementById('tax-form-detail-container');
    if (detailContainer) {
        // Get the row for this tax form ID
        const taxFormRow = document.querySelector(`.tax-form-checkbox[data-id="${taxFormId}"]`).closest('tr');
        const expertName = taxFormRow.querySelector('.user-info div div:first-child').textContent.trim();
        const formType = taxFormRow.cells[2].textContent.trim();
        const taxYear = taxFormRow.cells[3].textContent.trim();
        const amount = taxFormRow.cells[4].textContent.trim();

        // Populate the modal
        detailContainer.innerHTML = `
            <div class="tax-form-preview" data-id="${taxFormId}">
                <div class="tax-form-header">
                    <h3>${formType} Tax Form - ${taxYear}</h3>
                    <p>Generated for: ${expertName}</p>
                </div>
                <div class="tax-form-content">
                    <div class="tax-form-section">
                        <h4>Payer Information</h4>
                        <p><strong>Company Name:</strong> Expert Marketplace Inc.</p>
                        <p><strong>Address:</strong> 123 Main Street, Suite 400, San Francisco, CA 94105</p>
                        <p><strong>EIN:</strong> 12-3456789</p>
                        <p><strong>Phone:</strong> (415) 555-1234</p>
                    </div>
                    <div class="tax-form-section">
                        <h4>Recipient Information</h4>
                        <p><strong>Name:</strong> ${expertName}</p>
                        <p><strong>Email:</strong> ${taxFormRow.querySelector('.user-email').textContent.trim()}</p>
                        <p><strong>TIN:</strong> XXX-XX-5678 (redacted)</p>
                        <p><strong>Address:</strong> 456 Expert Street, Boston, MA 02108</p>
                    </div>
                    <div class="tax-form-section">
                        <h4>Payment Information</h4>
                        <p><strong>Total Payments:</strong> ${amount}</p>
                        <p><strong>Tax Year:</strong> ${taxYear}</p>
                        <p><strong>Form Type:</strong> ${formType}</p>
                    </div>
                </div>
                <div class="tax-form-footer">
                    <p><strong>Notice:</strong> This is a preview of the tax form. Download the official PDF for filing purposes.</p>
                </div>
            </div>
        `;
    }
}

/**
 * Download tax form
 * @param {string} taxFormId - The ID of the tax form to download
 */
function downloadTaxForm(taxFormId) {
    console.log(`Downloading tax form: ${taxFormId}`);

    // Show notification
    const notificationService = new AdminNotificationService();
    notificationService.addNotification({
        id: `download-${taxFormId}`,
        type: 'success',
        title: 'Tax Form Downloaded',
        message: `Tax form ${taxFormId} has been downloaded.`,
        time: new Date(),
        read: false
    });
}

/**
 * Download tax form from modal
 */
function downloadTaxFormFromModal() {
    // Get the tax form ID from the modal
    const taxFormId = document.querySelector('.tax-form-preview').getAttribute('data-id') || 'unknown';

    // Download the tax form
    downloadTaxForm(taxFormId);

    // Close the modal
    closeTaxFormModal();
}

/**
 * Send tax form
 * @param {string} taxFormId - The ID of the tax form to send
 */
function sendTaxForm(taxFormId) {
    console.log(`Sending tax form: ${taxFormId}`);

    // This would be an API call to send the tax form

    // Update the UI
    const taxFormRow = document.querySelector(`.tax-form-checkbox[data-id="${taxFormId}"]`).closest('tr');
    const statusCell = taxFormRow.cells[6];
    statusCell.innerHTML = '<span class="status-badge sent">Sent</span>';

    // Update buttons
    const actionsCell = taxFormRow.cells[8];
    actionsCell.querySelector('.table-actions').innerHTML = `
        <button class="btn-icon view-tax-form" title="View Form" data-id="${taxFormId}"><i class="fas fa-eye"></i></button>
        <button class="btn-icon download-tax-form" title="Download Form" data-id="${taxFormId}"><i class="fas fa-file-download"></i></button>
        <button class="btn-icon resend-tax-form" title="Resend to Expert" data-id="${taxFormId}"><i class="fas fa-paper-plane"></i></button>
    `;

    // Show notification
    const notificationService = new AdminNotificationService();
    notificationService.addNotification({
        id: `send-${taxFormId}`,
        type: 'success',
        title: 'Tax Form Sent',
        message: `Tax form has been sent to the expert.`,
        time: new Date(),
        read: false
    });

    // Update statistics
    updateTaxStats();
}

/**
 * Send tax form from modal
 */
function sendTaxFormFromModal() {
    // Get the tax form ID from the modal
    const taxFormId = document.querySelector('.tax-form-preview').getAttribute('data-id') || 'unknown';

    // Send the tax form
    sendTaxForm(taxFormId);

    // Close the modal
    closeTaxFormModal();
}

/**
 * Open request info modal
 * @param {string} taxFormId - The ID of the tax form to request info for
 */
function openRequestInfoModal(taxFormId) {
    console.log(`Opening request info modal for tax form: ${taxFormId}`);

    // Open the modal
    const modal = document.getElementById('request-info-modal');
    modal.style.display = 'block';

    // Store the tax form ID in the modal
    modal.setAttribute('data-tax-form-id', taxFormId);
}

/**
 * Close request info modal
 */
function closeRequestInfoModal() {
    const modal = document.getElementById('request-info-modal');
    modal.style.display = 'none';

    // Clear form data
    document.getElementById('custom-message').value = '';

    // Reset checkboxes
    const checkboxes = document.querySelectorAll('[name="missing-fields"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
}

/**
 * Send tax info request
 */
function sendTaxInfoRequest() {
    // Get the tax form ID from the modal
    const modal = document.getElementById('request-info-modal');
    const taxFormId = modal.getAttribute('data-tax-form-id');

    // Get selected missing fields
    const selectedFields = [];
    const checkboxes = document.querySelectorAll('[name="missing-fields"]:checked');
    checkboxes.forEach(checkbox => {
        selectedFields.push(checkbox.value);
    });

    // Get custom message
    const customMessage = document.getElementById('custom-message').value;

    // For demo purposes, log the data
    console.log({
        taxFormId,
        selectedFields,
        customMessage
    });

    // Show notification
    const notificationService = new AdminNotificationService();
    notificationService.addNotification({
        id: `request-${taxFormId}`,
        type: 'success',
        title: 'Information Request Sent',
        message: 'Tax information request has been sent to the expert.',
        time: new Date(),
        read: false
    });

    // Close the modal
    closeRequestInfoModal();
}

/**
 * Edit tax info
 * @param {string} taxFormId - The ID of the tax form to edit
 */
function editTaxInfo(taxFormId) {
    console.log(`Editing tax info for tax form: ${taxFormId}`);

    // This would normally open a form to edit tax information
    alert('Tax information editing form would open here.');
}

/**
 * Generate tax form
 * @param {string} taxFormId - The ID of the tax form to generate
 */
function generateTaxForm(taxFormId) {
    console.log(`Generating tax form: ${taxFormId}`);

    // This would be an API call to generate the tax form

    // Update the UI
    const taxFormRow = document.querySelector(`.tax-form-checkbox[data-id="${taxFormId}"]`).closest('tr');
    const statusCell = taxFormRow.cells[6];
    statusCell.innerHTML = '<span class="status-badge generated">Generated</span>';

    // Update generated date
    const dateCell = taxFormRow.cells[7];
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    dateCell.textContent = formattedDate;

    // Update buttons
    const actionsCell = taxFormRow.cells[8];
    actionsCell.querySelector('.table-actions').innerHTML = `
        <button class="btn-icon view-tax-form" title="View Form" data-id="${taxFormId}"><i class="fas fa-eye"></i></button>
        <button class="btn-icon download-tax-form" title="Download Form" data-id="${taxFormId}"><i class="fas fa-file-download"></i></button>
        <button class="btn-icon send-tax-form" title="Send to Expert" data-id="${taxFormId}"><i class="fas fa-paper-plane"></i></button>
    `;

    // Show notification
    const notificationService = new AdminNotificationService();
    notificationService.addNotification({
        id: `generate-${taxFormId}`,
        type: 'success',
        title: 'Tax Form Generated',
        message: `Tax form has been generated successfully.`,
        time: new Date(),
        read: false
    });

    // Update statistics
    updateTaxStats();
}

/**
 * Initialize AI-powered tax compliance forecasting
 */
function initComplianceForecasting() {
    console.log('Initializing AI-powered compliance forecasting...');

    // Initialize ML service for real-time predictions
    const mlService = new MLComplianceService();
    window.mlComplianceService = mlService;

    // Add forecasting chart initialization
    initForecastChart();

    // Add event listeners for forecast controls
    const updateForecastBtn = document.getElementById('update-forecast-btn');
    if (updateForecastBtn) {
        updateForecastBtn.addEventListener('click', function() {
            updateForecast();
        });
    }

    const forecastPeriodSelect = document.getElementById('forecast-period');
    if (forecastPeriodSelect) {
        forecastPeriodSelect.addEventListener('change', function() {
            updateForecast(this.value);
        });
    }

    const exportForecastBtn = document.getElementById('export-forecast-btn');
    if (exportForecastBtn) {
        exportForecastBtn.addEventListener('click', function() {
            exportForecastReport();
        });
    }

    // Initialize with default forecast
    setTimeout(() => {
        runInitialForecast();
    }, 1000);
}

/**
 * Update forecast with new data based on selected period
 * @param {string} period - Selected forecast period ('quarter', '6months', 'year')
 */
function updateForecast(period) {
    console.log(`Updating forecast for period: ${period}`);

    // Show loading state
    const forecastContainer = document.querySelector('.forecast-container');
    if (forecastContainer) {
        forecastContainer.style.opacity = '0.7';
        forecastContainer.style.pointerEvents = 'none';
    }

    // Show notification about AI processing
    const notificationService = new AdminNotificationService();
    notificationService.addNotification({
        id: 'ai-processing',
        type: 'info',
        title: 'AI Model Processing',
        message: 'The compliance prediction model is analyzing patterns in expert data...',
        time: new Date(),
        read: false
    });

    // Use ML service to get real predictions instead of simulated data
    if (window.mlComplianceService) {
        window.mlComplianceService.getPredictions(period).then(predictionData => {
            // Update chart with ML prediction data
            updateForecastChartWithMLData(predictionData, period);

            // Update metrics with ML prediction data
            updateForecastMetricsWithMLData(predictionData);

            // Update recommendations based on ML insights
            updateRecommendationsWithMLData(predictionData);

            // Restore container
            if (forecastContainer) {
                forecastContainer.style.opacity = '1';
                forecastContainer.style.pointerEvents = 'auto';
            }

            // Show completion notification
            notificationService.addNotification({
                id: 'forecast-updated',
                type: 'success',
                title: 'Forecast Updated',
                message: 'AI compliance prediction model has generated new forecasts using real-time ML data.',
                time: new Date(),
                read: false
            });
        }).catch(error => {
            console.error("ML prediction error:", error);
            // Fallback to simulated data if ML service fails
            simulateForecastUpdate(period, forecastContainer, notificationService);
        });
    } else {
        // Fallback to simulated data if ML service is not available
        simulateForecastUpdate(period, forecastContainer, notificationService);
    }
}

/**
 * Fallback to simulated data when ML service is unavailable
 * @param {string} period - Selected forecast period
 * @param {HTMLElement} forecastContainer - Container element
 * @param {AdminNotificationService} notificationService - Notification service
 */
function simulateForecastUpdate(period, forecastContainer, notificationService) {
    // Simulate AI model processing delay
    setTimeout(() => {
        // Update chart with new forecast data
        updateForecastChart(period);

        // Update metrics with new forecast data
        updateForecastMetrics(period);

        // Update recommendations based on new forecast
        updateRecommendations(period);

        // Restore container
        if (forecastContainer) {
            forecastContainer.style.opacity = '1';
            forecastContainer.style.pointerEvents = 'auto';
        }

        // Show completion notification
        notificationService.addNotification({
            id: 'forecast-updated',
            type: 'success',
            title: 'Forecast Updated',
            message: 'AI compliance prediction model has generated new forecasts using simulated data.',
            time: new Date(),
            read: false
        });
    }, 2000);
}

/**
 * Update forecast chart with ML data
 * @param {Object} mlData - Data from ML prediction service
 * @param {string} period - Selected forecast period
 */
function updateForecastChartWithMLData(mlData, period) {
    if (!window.forecastChart) return;

    const chart = window.forecastChart;

    // Update chart data with ML predictions
    chart.data.labels = mlData.timeLabels;
    chart.data.datasets[1].data = mlData.predictions;
    chart.data.datasets[2].data = mlData.lowerBound;
    chart.data.datasets[3].data = mlData.upperBound;

    // Always keep the first point of actual data
    const actualData = new Array(mlData.timeLabels.length).fill(null);
    actualData[0] = mlData.currentCompliance;
    chart.data.datasets[0].data = actualData;

    chart.update();
}

/**
 * Update forecast metrics with ML data
 * @param {Object} mlData - Data from ML prediction service
 */
function updateForecastMetricsWithMLData(mlData) {
    // Update metrics in UI with ML data
    const metricElements = document.querySelectorAll('.forecast-metric-value');
    if (metricElements.length >= 4) {
        // Current compliance
        metricElements[0].textContent = `${mlData.currentCompliance}%`;

        // Projected compliance
        metricElements[1].textContent = `${mlData.projectedCompliance}%`;

        // At-risk experts
        metricElements[2].textContent = mlData.atRiskExperts;
        metricElements[2].classList.add('clickable');
        metricElements[2].setAttribute('title', 'Click to view at-risk experts');
        metricElements[2].addEventListener('click', function() {
            showRiskExpertDetails();
        });

        // Revenue impact
        metricElements[3].textContent = mlData.revenueImpact;
    }
}

/**
 * Update recommendations with ML data
 * @param {Object} mlData - Data from ML prediction service
 */
function updateRecommendationsWithMLData(mlData) {
    // Update recommendations in UI with ML-generated insights
    const recommendationsContainer = document.querySelector('.forecast-recommendations');
    if (recommendationsContainer) {
        // Keep the heading
        const heading = recommendationsContainer.querySelector('h4');
        let headingHTML = '<h4>ML-Generated Recommendations</h4>';
        if (heading) {
            headingHTML = heading.outerHTML;
        }

        // Add container for actions button
        headingHTML += `
            <div class="recommendations-header-actions">
                <button id="execute-all-actions" class="btn btn-sm btn-primary">
                    <i class="fas fa-play"></i> Execute All Actions
                </button>
            </div>
        `;

        // Clear existing recommendations
        recommendationsContainer.innerHTML = headingHTML;

        // Action ID mapping (in a real system this would be more dynamic)
        const actionMapping = {
            'Increase frequency of reminders': 'reminder_high_risk',
            'Simplify tax information': 'form_simplify',
            'Schedule additional reminder campaigns': 'campaign_yearend',
            'Implement peer comparison': 'incentive_compliance'
        };

        // Add new ML-generated recommendations with action buttons
        mlData.recommendations.forEach(rec => {
            // Determine if this recommendation has an automated action
            let actionId = null;
            for (const [key, value] of Object.entries(actionMapping)) {
                if (rec.text.includes(key)) {
                    actionId = value;
                    break;
                }
            }

            const recItem = document.createElement('div');
            recItem.className = 'recommendation-item';

            let actionButton = '';
            if (actionId) {
                actionButton = `
                    <button class="btn-icon execute-recommendation" data-action="${actionId}" title="Execute this action">
                        <i class="fas fa-play"></i>
                    </button>
                `;
            }

            recItem.innerHTML = `
                <div class="recommendation-icon">
                    <i class="fas fa-${rec.icon}"></i>
                </div>
                <div class="recommendation-text">
                    ${rec.text}
                </div>
                <div class="recommendation-actions">
                    ${actionButton}
                </div>
            `;
            recommendationsContainer.appendChild(recItem);
        });

        // Initialize action buttons
        initAutomatedActions();
    }
}

/**
 * Export forecast report
 */
function exportForecastReport() {
    // This would normally generate a report based on the current forecast
    console.log('Exporting forecast report...');

    // Show notification
    const notificationService = new AdminNotificationService();
    notificationService.addNotification({
        id: 'export-forecast',
        type: 'success',
        title: 'Forecast Report Exported',
        message: 'AI-powered tax compliance forecast report has been exported successfully.',
        time: new Date(),
        read: false
    });
}

/**
 * Run initial forecast when the page loads
 */
function runInitialForecast() {
    const forecastPeriodSelect = document.getElementById('forecast-period');
    const initialPeriod = forecastPeriodSelect ? forecastPeriodSelect.value : '6months';
    updateForecast(initialPeriod);
}

/**
 * Initialize action automation for recommendations
 */
function initAutomatedActions() {
    const actionButtons = document.querySelectorAll('.execute-recommendation');

    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const actionId = this.getAttribute('data-action');
            executeAutomatedAction(actionId);
        });
    });

    // Add event listener for the "Execute All" button
    const executeAllBtn = document.getElementById('execute-all-actions');
    if (executeAllBtn) {
        executeAllBtn.addEventListener('click', function() {
            executeAllRecommendedActions();
        });
    }
}

/**
 * Execute all recommended actions automatically
 */
function executeAllRecommendedActions() {
    const actionButtons = document.querySelectorAll('.execute-recommendation:not(.executed)');
    let completedCount = 0;
    let totalActions = actionButtons.length;

    // No actions to execute
    if (totalActions === 0) {
        showActionFeedback('No actions to execute', 'info');
        return;
    }

    // Show execution in progress notification
    const notificationService = new AdminNotificationService();
    notificationService.addNotification({
        id: 'actions-executing',
        type: 'info',
        title: 'Executing Actions',
        message: `Executing ${totalActions} recommended actions...`,
        time: new Date(),
        read: false
    });

    // Process each action with a delay to simulate processing
    actionButtons.forEach((button, index) => {
        setTimeout(() => {
            const actionId = button.getAttribute('data-action');
            const success = executeAutomatedAction(actionId);

            if (success) {
                completedCount++;
            }

            // When all actions are processed, show completion notification
            if (index === totalActions - 1) {
                setTimeout(() => {
                    notificationService.addNotification({
                        id: 'actions-complete',
                        type: 'success',
                        title: 'Actions Completed',
                        message: `Successfully executed ${completedCount} of ${totalActions} recommended actions.`,
                        time: new Date(),
                        read: false
                    });

                    // Update compliance forecast to reflect the impact of actions
                    updateForecast(document.getElementById('forecast-period').value);
                }, 1000);
            }
        }, index * 800); // Stagger execution for visual feedback
    });
}

/**
 * Execute a specific automated action
 * @param {string} actionId - ID of the action to execute
 * @returns {boolean} Success status
 */
function executeAutomatedAction(actionId) {
    console.log(`Executing automated action: ${actionId}`);

    // Find the action button
    const actionButton = document.querySelector(`.execute-recommendation[data-action="${actionId}"]`);
    if (!actionButton) return false;

    // Get the action container to update UI
    const actionContainer = actionButton.closest('.recommendation-item');
    if (!actionContainer) return false;

    // Get the action type
    const actionType = actionId.split('_')[0];
    let success = false;

    try {
        // Process based on action type
        switch(actionType) {
            case 'reminder':
                success = sendAutomatedReminders(actionId);
                break;
            case 'form':
                success = simplifyTaxForm(actionId);
                break;
            case 'campaign':
                success = scheduleReminderCampaign(actionId);
                break;
            case 'incentive':
                success = implementExpertIncentives(actionId);
                break;
            default:
                console.warn(`Unknown action type: ${actionType}`);
                return false;
        }

        // Update UI to reflect action status
        if (success) {
            // Mark as executed in UI
            actionButton.classList.add('executed');
            actionButton.innerHTML = '<i class="fas fa-check"></i>';
            actionButton.setAttribute('title', 'Action Executed');

            // Add executed status to the recommendation
            if (actionContainer) {
                actionContainer.classList.add('executed-action');

                // Add execution timestamp
                const timestamp = document.createElement('div');
                timestamp.className = 'execution-timestamp';
                timestamp.innerHTML = `<i class="fas fa-clock"></i> Executed ${new Date().toLocaleTimeString()}`;
                actionContainer.appendChild(timestamp);
            }

            // Show success feedback
            showActionFeedback(`Successfully executed: ${getActionDescription(actionId)}`, 'success');
        } else {
            // Show error feedback
            showActionFeedback(`Failed to execute: ${getActionDescription(actionId)}`, 'error');
        }

        return success;

    } catch (error) {
        console.error(`Error executing action ${actionId}:`, error);
        showActionFeedback(`Error executing action: ${error.message}`, 'error');
        return false;
    }
}

/**
 * Get human-readable description for an action
 * @param {string} actionId - ID of the action
 * @returns {string} Action description
 */
function getActionDescription(actionId) {
    const actionMap = {
        'reminder_high_risk': 'Send reminders to high-risk experts',
        'form_simplify': 'Simplify tax information collection form',
        'campaign_yearend': 'Schedule year-end reminder campaign',
        'incentive_compliance': 'Implement expert compliance incentives'
    };

    return actionMap[actionId] || actionId;
}

/**
 * Show feedback about action execution
 * @param {string} message - Feedback message
 * @param {string} type - Feedback type (success, error, info)
 */
function showActionFeedback(message, type = 'info') {
    const feedbackContainer = document.querySelector('.action-feedback');

    if (!feedbackContainer) {
        // Create feedback container if it doesn't exist
        const container = document.createElement('div');
        container.className = `action-feedback ${type}`;
        container.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}`;

        // Add to forecast container
        const forecastContainer = document.querySelector('.forecast-container');
        if (forecastContainer) {
            forecastContainer.appendChild(container);

            // Auto remove after 5 seconds
            setTimeout(() => {
                container.remove();
            }, 5000);
        }
    } else {
        // Update existing feedback
        feedbackContainer.className = `action-feedback ${type}`;
        feedbackContainer.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}`;

        // Reset auto-remove timer
        clearTimeout(feedbackContainer.dataset.timer);
        feedbackContainer.dataset.timer = setTimeout(() => {
            feedbackContainer.remove();
        }, 5000);
    }
}

/**
 * Send automated reminders to high-risk experts
 * @param {string} actionId - Action identifier
 * @returns {boolean} Success status
 */
function sendAutomatedReminders(actionId) {
    // In a production environment, this would integrate with email/notification systems

    // Get at-risk experts from ML service
    if (!window.mlComplianceService) return false;

    // Simulate sending reminders to experts
    return new Promise(resolve => {
        window.mlComplianceService.getAtRiskExperts().then(experts => {
            console.log(`Sending reminders to ${experts.length} high-risk experts:`, experts);

            // Simulate API call to email service
            setTimeout(() => {
                resolve(true);

                // Add notification about sent reminders
                const notificationService = new AdminNotificationService();
                notificationService.addNotification({
                    id: 'reminders-sent',
                    type: 'success',
                    title: 'Reminders Sent',
                    message: `Tax compliance reminders sent to ${experts.length} high-risk experts.`,
                    time: new Date(),
                    read: false
                });
            }, 1200);
        }).catch(error => {
            console.error('Error getting at-risk experts:', error);
            resolve(false);
        });
    });
}

/**
 * Simplify tax form collection process
 * @param {string} actionId - Action identifier
 * @returns {boolean} Success status
 */
function simplifyTaxForm(actionId) {
    // In a production environment, this would update form templates

    // Simulate updating form templates
    return new Promise(resolve => {
        setTimeout(() => {
            console.log('Tax form simplification process initiated');
            resolve(true);

            // Add notification about form updates
            const notificationService = new AdminNotificationService();
            notificationService.addNotification({
                id: 'form-simplified',
                type: 'success',
                title: 'Forms Simplified',
                message: 'Tax information collection forms have been simplified. New template active.',
                time: new Date(),
                read: false
            });
        }, 1500);
    });
}

/**
 * Schedule reminder campaign for end of year
 * @param {string} actionId - Action identifier
 * @returns {boolean} Success status
 */
function scheduleReminderCampaign(actionId) {
    // In a production environment, this would create scheduled campaigns

    // Simulate scheduling a campaign
    return new Promise(resolve => {
        setTimeout(() => {
            console.log('Year-end reminder campaign scheduled');
            resolve(true);

            // Add notification about scheduled campaign
            const notificationService = new AdminNotificationService();
            notificationService.addNotification({
                id: 'campaign-scheduled',
                type: 'success',
                title: 'Campaign Scheduled',
                message: 'Year-end tax document reminder campaign has been scheduled for December 1st.',
                time: new Date(),
                read: false
            });
        }, 1000);
    });
}

/**
 * Implement expert incentives for compliance
 * @param {string} actionId - Action identifier
 * @returns {boolean} Success status
 */
function implementExpertIncentives(actionId) {
    // In a production environment, this would update incentive programs

    // Simulate implementing incentives
    return new Promise(resolve => {
        setTimeout(() => {
            console.log('Expert compliance incentives implemented');
            resolve(true);

            // Add notification about incentive program
            const notificationService = new AdminNotificationService();
            notificationService.addNotification({
                id: 'incentives-implemented',
                type: 'success',
                title: 'Incentives Implemented',
                message: 'Expert compliance incentive program has been activated.',
                time: new Date(),
                read: false
            });
        }, 1800);
    });
}

/**
 * Initialize expert risk drill-down functionality
 */
function initExpertRiskDrillDown() {
    // Add event listener for the "View At-Risk Experts" button
    const viewRiskExpertsBtn = document.getElementById('view-risk-experts');
    if (viewRiskExpertsBtn) {
        viewRiskExpertsBtn.addEventListener('click', function() {
            showRiskExpertDetails();
        });
    }

    // Add expert risk count click handler
    const atRiskExpertsValue = document.querySelector('.forecast-metric:nth-child(3) .forecast-metric-value');
    if (atRiskExpertsValue) {
        atRiskExpertsValue.classList.add('clickable');
        atRiskExpertsValue.setAttribute('title', 'Click to view at-risk experts');
        atRiskExpertsValue.addEventListener('click', function() {
            showRiskExpertDetails();
        });
    }
}
