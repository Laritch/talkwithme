/**
 * Scenario Modeler Module
 * This module provides functions for creating and running "what-if" scenarios
 * to test different tax compliance strategies
 */

import { AdminNotificationService } from './services/admin-notification-service.js';

/**
 * Initialize the scenario modeling UI
 * @param {Element} container - Container element where the UI should be created
 */
export function initScenarioModeling(container) {
    if (!container) return;

    // Check if ML service is available
    if (!window.mlComplianceService) {
        showNotification('ML service not available for scenario modeling', 'error');
        return;
    }

    console.log('Initializing scenario modeling UI');

    // Create the scenario modeling container
    const scenarioContainer = document.createElement('div');
    scenarioContainer.id = 'scenario-container';
    scenarioContainer.className = 'scenario-container';

    // Add the title section
    const titleSection = document.createElement('div');
    titleSection.className = 'scenario-title';
    titleSection.innerHTML = `
        <h3>Compliance Strategy Modeling</h3>
        <button id="toggle-scenario-builder" class="btn btn-primary">
            <i class="fas fa-plus"></i> New Scenario
        </button>
    `;

    // Create the builder section (initially hidden)
    const builderSection = document.createElement('div');
    builderSection.className = 'scenario-builder';
    builderSection.style.display = 'none';
    builderSection.innerHTML = `
        <h4>Create "What-If" Scenario</h4>
        <div class="scenario-controls">
            <div class="scenario-control-group">
                <label for="scenario-name">Scenario Name</label>
                <input type="text" id="scenario-name" class="form-control" placeholder="Strategy 1">
            </div>

            <div class="scenario-control-group">
                <label for="scenario-timing">Implementation Timeline</label>
                <select id="scenario-timing" class="form-control">
                    <option value="immediate">Immediate (1 month)</option>
                    <option value="next_month" selected>Short-term (3 months)</option>
                    <option value="next_quarter">Medium-term (6 months)</option>
                </select>
            </div>
        </div>

        <h4>Select Intervention Strategies</h4>
        <div class="intervention-options">
            <div class="checkbox-container">
                <input type="checkbox" id="increased_reminders" value="increased_reminders" checked>
                <label for="increased_reminders">Increased Reminder Frequency</label>
            </div>
            <div class="checkbox-container">
                <input type="checkbox" id="form_simplification" value="form_simplification">
                <label for="form_simplification">Form Simplification</label>
            </div>
            <div class="checkbox-container">
                <input type="checkbox" id="automated_followups" value="automated_followups">
                <label for="automated_followups">Automated Follow-ups</label>
            </div>
            <div class="checkbox-container">
                <input type="checkbox" id="expert_incentives" value="expert_incentives">
                <label for="expert_incentives">Expert Incentives</label>
            </div>
        </div>

        <div class="scenario-actions">
            <button id="run-scenario" class="btn btn-primary">
                <i class="fas fa-play"></i> Run Scenario
            </button>
            <button id="cancel-scenario" class="btn btn-outline">
                <i class="fas fa-times"></i> Cancel
            </button>
        </div>
    `;

    // Create the results section (initially empty)
    const resultsSection = document.createElement('div');
    resultsSection.id = 'scenario-results';
    resultsSection.className = 'scenario-results-container';

    // Add the saved scenarios section
    const savedSection = document.createElement('div');
    savedSection.className = 'saved-scenarios';
    savedSection.innerHTML = `
        <h4>Saved Scenarios</h4>
        <div id="saved-scenarios-list" class="saved-scenarios-list">
            <div class="empty-scenarios">
                <i class="fas fa-lightbulb"></i>
                <p>Run your first scenario to see results here</p>
            </div>
        </div>
    `;

    // Assemble the container
    scenarioContainer.appendChild(titleSection);
    scenarioContainer.appendChild(builderSection);
    scenarioContainer.appendChild(resultsSection);
    scenarioContainer.appendChild(savedSection);
    container.appendChild(scenarioContainer);

    // Add event listeners
    document.getElementById('toggle-scenario-builder').addEventListener('click', function() {
        toggleScenarioBuilder(builderSection);
    });

    document.getElementById('run-scenario').addEventListener('click', function() {
        runScenario(resultsSection);
    });

    document.getElementById('cancel-scenario').addEventListener('click', function() {
        builderSection.style.display = 'none';
    });
}

/**
 * Toggle the scenario builder visibility
 * @param {Element} builderSection - The scenario builder section
 */
function toggleScenarioBuilder(builderSection) {
    if (builderSection.style.display === 'none') {
        builderSection.style.display = 'block';
    } else {
        builderSection.style.display = 'none';
    }
}

/**
 * Run a compliance scenario based on the selected options
 * @param {Element} resultsSection - The section where results should be displayed
 */
function runScenario(resultsSection) {
    // Get scenario parameters from form
    const scenarioName = document.getElementById('scenario-name').value || 'Unnamed Scenario';
    const timing = document.getElementById('scenario-timing').value;

    // Get selected interventions
    const interventions = [];
    document.querySelectorAll('.intervention-options input[type="checkbox"]:checked').forEach(checkbox => {
        interventions.push(checkbox.value);
    });

    // Validate inputs
    if (interventions.length === 0) {
        showNotification('Please select at least one intervention strategy', 'error');
        return;
    }

    console.log(`Running scenario: ${scenarioName}`);
    showNotification('Running compliance scenario...', 'info');

    // Get expert count
    const expertCount = 258; // In a real app, this would be from actual data

    // Create scenario parameters
    const scenarioParams = {
        name: scenarioName,
        timing: timing,
        interventions: interventions,
        expertCount: expertCount
    };

    // Run the scenario with the ML service
    window.mlComplianceService.runScenario(scenarioParams).then(results => {
        // Display the results
        displayScenarioResults(results, resultsSection);

        // Hide the builder
        document.querySelector('.scenario-builder').style.display = 'none';

        // Show success notification
        showNotification('Scenario analysis complete', 'success');

        // Save the scenario
        saveScenario(results);
    }).catch(error => {
        console.error('Error running scenario:', error);
        showNotification('Error running scenario modeling', 'error');
    });
}

/**
 * Display the results of a scenario run
 * @param {Object} results - The scenario results from the ML service
 * @param {Element} container - The container where results should be displayed
 */
function displayScenarioResults(results, container) {
    // Create results display
    container.innerHTML = '';

    // Setup results structure
    const resultsContent = document.createElement('div');
    resultsContent.className = 'scenario-results';

    // Add chart
    const chartSection = document.createElement('div');
    chartSection.className = 'scenario-chart-section';
    chartSection.innerHTML = `
        <h4>${results.scenarioName}</h4>
        <div class="scenario-chart">
            <canvas id="scenarioChart"></canvas>
        </div>
    `;

    // Add metrics
    const metricsSection = document.createElement('div');
    metricsSection.className = 'scenario-metrics';
    metricsSection.innerHTML = `
        <div class="scenario-metric">
            <div class="scenario-metric-label">Baseline Compliance</div>
            <div class="scenario-metric-value">${results.baselineCompliance}%</div>
        </div>
        <div class="scenario-metric">
            <div class="scenario-metric-label">Projected Compliance</div>
            <div class="scenario-metric-value">${results.projectedCompliance.toFixed(1)}%</div>
        </div>
        <div class="scenario-metric">
            <div class="scenario-metric-label">Improvement</div>
            <div class="scenario-metric-value">+${results.improvementPercent.toFixed(1)}%</div>
        </div>
        <div class="scenario-metric">
            <div class="scenario-metric-label">Est. Revenue Impact</div>
            <div class="scenario-metric-value">${results.revenueImpact}</div>
        </div>
        <div class="scenario-metric">
            <div class="scenario-metric-label">Time to Implement</div>
            <div class="scenario-metric-value">${results.timeToImplement}</div>
        </div>
        <div class="scenario-metric">
            <div class="scenario-metric-label">Confidence Score</div>
            <div class="scenario-metric-value">${(results.confidenceScore * 100).toFixed(0)}%</div>
        </div>
    `;

    // Add recommendations
    const recommendationsSection = document.createElement('div');
    recommendationsSection.className = 'scenario-recommendations';

    let recommendationsHtml = '<h4>AI Recommendations</h4>';
    results.recommendations.forEach(rec => {
        recommendationsHtml += `
            <div class="scenario-recommendation ${rec.priority.toLowerCase()}">
                <div class="recommendation-priority">${rec.priority}</div>
                <div class="recommendation-text">${rec.text}</div>
            </div>
        `;
    });

    recommendationsSection.innerHTML = recommendationsHtml;

    // Assemble results
    resultsContent.appendChild(chartSection);
    resultsContent.appendChild(metricsSection);
    container.appendChild(resultsContent);
    container.appendChild(recommendationsSection);

    // Initialize chart
    setTimeout(() => {
        initScenarioChart(results.projectionGraph);
    }, 100);
}

/**
 * Initialize the scenario projection chart
 * @param {Object} data - The chart data from the ML service
 */
function initScenarioChart(data) {
    const ctx = document.getElementById('scenarioChart');
    if (!ctx) return;

    // Clear any existing chart
    if (window.scenarioChart) {
        window.scenarioChart.destroy();
    }

    // Create new chart
    window.scenarioChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Baseline',
                    data: data.baseline,
                    borderColor: '#6c757d',
                    backgroundColor: '#6c757d',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 2,
                    fill: false
                },
                {
                    label: 'Projected',
                    data: data.projected,
                    borderColor: '#4a6cf7',
                    backgroundColor: 'rgba(74, 108, 247, 0.1)',
                    borderWidth: 3,
                    pointRadius: 4,
                    tension: 0.3,
                    fill: 'start'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 90,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Compliance Rate (%)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time Period'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.raw || 0;
                            return label + ': ' + value + '%';
                        }
                    }
                },
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

/**
 * Save a scenario to the saved scenarios list
 * @param {Object} results - The scenario results
 */
function saveScenario(results) {
    const savedList = document.getElementById('saved-scenarios-list');

    // Clear empty state if present
    const emptyState = savedList.querySelector('.empty-scenarios');
    if (emptyState) {
        emptyState.remove();
    }

    // Create scenario item
    const scenarioItem = document.createElement('div');
    scenarioItem.className = 'saved-scenario-item';
    scenarioItem.innerHTML = `
        <div class="saved-scenario-header">
            <div class="saved-scenario-name">${results.scenarioName}</div>
            <div class="saved-scenario-metrics">
                <span class="saved-metric">+${results.improvementPercent.toFixed(1)}%</span>
                <span class="saved-metric">${results.revenueImpact}</span>
            </div>
        </div>
        <div class="saved-scenario-interventions">
            ${results.interventions ? results.interventions.join(', ').replace(/_/g, ' ') : ''}
        </div>
    `;

    // Add click event to view the scenario again
    scenarioItem.addEventListener('click', function() {
        const resultsSection = document.getElementById('scenario-results');
        displayScenarioResults(results, resultsSection);
    });

    // Add to list
    savedList.prepend(scenarioItem);
}

/**
 * Show a notification
 * @param {string} message - The notification message
 * @param {string} type - The notification type (success, error, info)
 */
function showNotification(message, type = 'info') {
    const notificationService = new AdminNotificationService();

    notificationService.addNotification({
        id: `scenario-${Date.now()}`,
        type: type,
        title: type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Information',
        message: message,
        time: new Date(),
        read: false
    });
}
