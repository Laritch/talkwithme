/**
 * Expert Risk Analysis Module
 * This module provides functions for analyzing at-risk experts based on ML predictions
 */

import { AdminNotificationService } from './services/admin-notification-service.js';

/**
 * Show detailed information about at-risk experts
 */
export function showRiskExpertDetails() {
    console.log('Showing risk expert details');

    // Check if ML service is available
    if (!window.mlComplianceService) {
        showActionFeedback('ML service not available', 'error');
        return;
    }

    // Get forecasted period
    const forecastPeriod = document.getElementById('forecast-period')?.value || '6months';

    // Check if we already have a risk details section
    let riskDetailsSection = document.getElementById('risk-details-section');
    if (riskDetailsSection) {
        // Update existing section
        updateRiskExpertList(riskDetailsSection, forecastPeriod);
        return;
    }

    // Create risk details section
    riskDetailsSection = document.createElement('div');
    riskDetailsSection.id = 'risk-details-section';
    riskDetailsSection.className = 'dashboard-section';

    // Create the HTML structure
    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `
        <h2>At-Risk Expert Analysis</h2>
        <div class="section-actions">
            <button id="contact-all-experts" class="btn btn-primary">
                <i class="fas fa-envelope"></i> Contact All
            </button>
            <button id="export-risk-data" class="btn btn-secondary">
                <i class="fas fa-file-export"></i> Export
            </button>
            <button id="close-risk-details" class="btn btn-outline">
                <i class="fas fa-times"></i> Close
            </button>
        </div>
    `;

    const container = document.createElement('div');
    container.className = 'risk-details-container';

    const summary = document.createElement('div');
    summary.className = 'risk-summary';
    summary.innerHTML = `
        <div class="risk-summary-metric">
            <div class="risk-summary-value">--</div>
            <div class="risk-summary-label">Average Risk Score</div>
        </div>
        <div class="risk-summary-metric">
            <div class="risk-summary-value">--</div>
            <div class="risk-summary-label">Est. Revenue Impact</div>
        </div>
        <div class="risk-summary-metric">
            <div class="risk-summary-value">--</div>
            <div class="risk-summary-label">Most Common Risk Factor</div>
        </div>
    `;

    const expertList = document.createElement('div');
    expertList.className = 'risk-expert-list';
    expertList.id = 'risk-expert-list';
    expertList.innerHTML = `
        <div class="loading-indicator">
            <i class="fas fa-circle-notch fa-spin"></i> Loading expert data...
        </div>
    `;

    // Assemble the section
    container.appendChild(summary);
    container.appendChild(expertList);
    riskDetailsSection.appendChild(header);
    riskDetailsSection.appendChild(container);

    // Add section to the page after the forecast section
    const forecastSection = document.querySelector('.forecast-container').closest('.dashboard-section');
    forecastSection.parentNode.insertBefore(riskDetailsSection, forecastSection.nextSibling);

    // Add event listeners
    document.getElementById('close-risk-details').addEventListener('click', function() {
        riskDetailsSection.remove();
    });

    document.getElementById('contact-all-experts').addEventListener('click', function() {
        contactAllRiskExperts();
    });

    document.getElementById('export-risk-data').addEventListener('click', function() {
        exportRiskExpertData();
    });

    // Load expert data
    updateRiskExpertList(riskDetailsSection, forecastPeriod);
}

/**
 * Update the list of at-risk experts
 * @param {HTMLElement} riskDetailsSection - The risk details section container
 * @param {string} forecastPeriod - The forecast period
 */
function updateRiskExpertList(riskDetailsSection, forecastPeriod) {
    // Get reference to the expert list
    const expertList = riskDetailsSection.querySelector('#risk-expert-list');
    if (!expertList) return;

    // Show loading state
    expertList.innerHTML = `
        <div class="loading-indicator">
            <i class="fas fa-circle-notch fa-spin"></i> Loading expert data...
        </div>
    `;

    // Get at-risk count from forecast metrics
    const atRiskCount = parseInt(document.querySelector('.forecast-metric:nth-child(3) .forecast-metric-value').textContent) || 8;

    // Get expert data from ML service
    window.mlComplianceService.getAtRiskExperts(atRiskCount).then(experts => {
        // Update summary metrics
        updateRiskSummaryMetrics(riskDetailsSection, experts);

        // Clear loading indicator
        expertList.innerHTML = '';

        // Add experts to the list
        experts.forEach(expert => {
            const riskClass = expert.riskScore > 90 ? 'high' : expert.riskScore > 80 ? 'medium' : 'low';

            const expertItem = document.createElement('div');
            expertItem.className = 'risk-expert-item';
            expertItem.innerHTML = `
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name)}&background=random"
                     alt="${expert.name}" class="risk-expert-avatar">

                <div class="risk-expert-info">
                    <p class="risk-expert-name">${expert.name}</p>
                    <p class="risk-expert-email">${expert.email}</p>
                </div>

                <div class="risk-score">
                    <div class="risk-score-value ${riskClass}">${expert.riskScore}</div>
                    <div class="risk-score-label">Risk</div>
                </div>

                <div class="risk-factor">
                    ${expert.riskFactor}
                </div>

                <div class="risk-actions">
                    <button class="btn-icon contact-expert" title="Contact Expert" data-id="${expert.id}">
                        <i class="fas fa-envelope"></i>
                    </button>
                    <button class="btn-icon view-expert-details" title="View Details" data-id="${expert.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            `;

            expertList.appendChild(expertItem);
        });

        // Add event listeners to action buttons
        expertList.querySelectorAll('.contact-expert').forEach(button => {
            button.addEventListener('click', function() {
                const expertId = this.getAttribute('data-id');
                contactRiskExpert(expertId, experts);
            });
        });

        expertList.querySelectorAll('.view-expert-details').forEach(button => {
            button.addEventListener('click', function() {
                const expertId = this.getAttribute('data-id');
                viewExpertDetails(expertId, experts);
            });
        });

    }).catch(error => {
        console.error('Error fetching expert data:', error);
        expertList.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                Error loading expert data. Please try again.
            </div>
        `;
    });
}

/**
 * Update risk summary metrics
 * @param {HTMLElement} riskDetailsSection - The risk details section container
 * @param {Array} experts - The list of at-risk experts
 */
function updateRiskSummaryMetrics(riskDetailsSection, experts) {
    if (!experts || experts.length === 0) return;

    // Calculate average risk score
    const totalRiskScore = experts.reduce((sum, expert) => sum + expert.riskScore, 0);
    const avgRiskScore = Math.round(totalRiskScore / experts.length);

    // Calculate estimated revenue impact
    const avgRevenuePerExpert = 1900; // This would be from real data in production
    const estimatedImpact = `$${(experts.length * avgRevenuePerExpert).toLocaleString()}`;

    // Find most common risk factor
    const riskFactorCounts = {};
    experts.forEach(expert => {
        riskFactorCounts[expert.riskFactor] = (riskFactorCounts[expert.riskFactor] || 0) + 1;
    });

    let maxCount = 0;
    let mostCommonFactor = '';
    for (const [factor, count] of Object.entries(riskFactorCounts)) {
        if (count > maxCount) {
            maxCount = count;
            mostCommonFactor = factor;
        }
    }

    // Update UI
    const summaryValues = riskDetailsSection.querySelectorAll('.risk-summary-value');
    if (summaryValues.length >= 3) {
        summaryValues[0].textContent = avgRiskScore;
        summaryValues[1].textContent = estimatedImpact;
        summaryValues[2].textContent = mostCommonFactor;
    }
}

/**
 * Contact a specific at-risk expert
 * @param {string} expertId - ID of the expert to contact
 * @param {Array} experts - The list of at-risk experts
 */
export function contactRiskExpert(expertId, experts) {
    const expert = experts.find(e => e.id === expertId);
    if (!expert) return;

    console.log(`Contacting expert: ${expert.name}`);

    // Simulate sending a notification
    const notificationService = new AdminNotificationService();
    notificationService.addNotification({
        id: `contact-expert-${expertId}`,
        type: 'info',
        title: 'Expert Contact',
        message: `Reminder sent to ${expert.name} about incomplete tax documents.`,
        time: new Date(),
        read: false
    });

    // Show success feedback
    showActionFeedback(`Tax reminder sent to ${expert.name}`, 'success');
}

/**
 * View detailed information about an expert
 * @param {string} expertId - ID of the expert to view
 * @param {Array} experts - The list of at-risk experts
 */
function viewExpertDetails(expertId, experts) {
    const expert = experts.find(e => e.id === expertId);
    if (!expert) return;

    console.log(`Viewing expert details: ${expert.name}`);

    // In a real application, this would open a detailed view
    // For this demo, we'll show a notification
    const notificationService = new AdminNotificationService();
    notificationService.addNotification({
        id: `view-expert-${expertId}`,
        type: 'info',
        title: 'Expert Details',
        message: `Viewing detailed compliance history for ${expert.name}.`,
        time: new Date(),
        read: false
    });

    // Show info feedback
    showActionFeedback(`Viewing details for ${expert.name}`, 'info');
}

/**
 * Contact all at-risk experts
 */
export function contactAllRiskExperts() {
    // In a real application, this would send notifications to all experts
    // For this demo, we'll simulate the process

    // Show processing notification
    const notificationService = new AdminNotificationService();
    notificationService.addNotification({
        id: 'contact-all-experts',
        type: 'info',
        title: 'Sending Reminders',
        message: 'Sending tax document reminders to all at-risk experts...',
        time: new Date(),
        read: false
    });

    // Simulate processing delay
    setTimeout(() => {
        // Get at-risk count from forecast metrics
        const atRiskCount = parseInt(document.querySelector('.forecast-metric:nth-child(3) .forecast-metric-value').textContent) || 8;

        // Show completion notification
        notificationService.addNotification({
            id: 'contact-all-complete',
            type: 'success',
            title: 'Reminders Sent',
            message: `Tax document reminders sent to all ${atRiskCount} at-risk experts.`,
            time: new Date(),
            read: false
        });

        // Show success feedback
        showActionFeedback(`Reminders sent to all ${atRiskCount} at-risk experts`, 'success');
    }, 1500);
}

/**
 * Export at-risk expert data
 */
export function exportRiskExpertData() {
    // In a real application, this would generate a report file
    // For this demo, we'll simulate the process

    // Show processing notification
    const notificationService = new AdminNotificationService();
    notificationService.addNotification({
        id: 'export-risk-data',
        type: 'info',
        title: 'Exporting Data',
        message: 'Generating at-risk expert report...',
        time: new Date(),
        read: false
    });

    // Simulate processing delay
    setTimeout(() => {
        // Show completion notification
        notificationService.addNotification({
            id: 'export-risk-complete',
            type: 'success',
            title: 'Export Complete',
            message: 'At-risk expert report has been generated and downloaded.',
            time: new Date(),
            read: false
        });

        // Show success feedback
        showActionFeedback('At-risk expert report exported', 'success');
    }, 1200);
}

/**
 * Show feedback about action execution
 * Reused from admin-tax-management.js
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
