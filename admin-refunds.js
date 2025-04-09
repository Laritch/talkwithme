/**
 * Admin Refunds Interface
 * Manages the Refund Management Interface for the Admin Dashboard
 * - Refund Request Management
 * - Refund Analytics
 * - Refund Policy Management
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initRefundCharts();
    initRefundFilters();
    initRefundTable();
    initRefundPolicyManagement();
    initDateRangePicker();
    initNotifications();
    initModals();
});

/**
 * Initialize Refund Charts
 */
function initRefundCharts() {
    // Refund Trends Chart
    const trendsCtx = document.getElementById('refundTrendsChart').getContext('2d');
    const refundTrendsChart = new Chart(trendsCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Refund Amount',
                data: [4500, 5200, 6100, 6245, 5850, 6300, 7200, 6800, 7500, 7000, 6500, 7200],
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }, {
                label: 'Refund Count',
                data: [32, 38, 45, 42, 36, 40, 48, 44, 50, 47, 42, 46],
                borderColor: '#ffc107',
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                yAxisID: 'y1'
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
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.datasetIndex === 0) {
                                label += '$' + context.raw.toLocaleString();
                            } else {
                                label += context.raw;
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Amount ($)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Count'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });

    // Refund Period Select Event Listener
    document.getElementById('refundPeriodSelect').addEventListener('change', function(e) {
        const period = e.target.value;
        // In a real app, this would fetch new data
        updateRefundTrendsChart(refundTrendsChart, period);
    });

    // Refund Reasons Chart
    const reasonsCtx = document.getElementById('refundReasonsChart').getContext('2d');
    const refundReasonsChart = new Chart(reasonsCtx, {
        type: 'doughnut',
        data: {
            labels: ['Expert Unavailable', 'Quality Issues', 'Not As Described', 'Service Issue', 'Changed Mind', 'Duplicate Payment', 'Other'],
            datasets: [{
                data: [25, 30, 15, 10, 8, 7, 5],
                backgroundColor: [
                    '#007bff',
                    '#dc3545',
                    '#ffc107',
                    '#28a745',
                    '#17a2b8',
                    '#6c757d',
                    '#6610f2'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12,
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            let value = context.raw;
                            let sum = context.dataset.data.reduce((a, b) => a + b, 0);
                            let percentage = Math.round((value / sum) * 100);
                            return label + ': ' + percentage + '%';
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });

    // Refund Categories Chart
    const categoriesCtx = document.getElementById('refundCategoriesChart').getContext('2d');
    const refundCategoriesChart = new Chart(categoriesCtx, {
        type: 'bar',
        data: {
            labels: ['Business Strategy', 'Marketing', 'Financial Planning', 'Legal', 'Technical', 'Creative'],
            datasets: [{
                label: 'Refund Count',
                data: [18, 14, 12, 9, 7, 5],
                backgroundColor: '#17a2b8',
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
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Refunds'
                    }
                }
            }
        }
    });
}

/**
 * Update refund trends chart based on selected period
 */
function updateRefundTrendsChart(chart, period) {
    // Sample data for different periods
    const data = {
        weekly: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
            amounts: [1450, 980, 1230, 1680, 1520, 1350, 1720, 1890],
            counts: [12, 7, 9, 14, 11, 10, 13, 15]
        },
        monthly: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            amounts: [4500, 5200, 6100, 6245, 5850, 6300, 7200, 6800, 7500, 7000, 6500, 7200],
            counts: [32, 38, 45, 42, 36, 40, 48, 44, 50, 47, 42, 46]
        },
        quarterly: {
            labels: ['Q1 2022', 'Q2 2022', 'Q3 2022', 'Q4 2022', 'Q1 2023', 'Q2 2023'],
            amounts: [15800, 18395, 20800, 19700, 22000, 25000],
            counts: [115, 130, 142, 133, 150, 168]
        }
    };

    // Update chart data
    chart.data.labels = data[period].labels;
    chart.data.datasets[0].data = data[period].amounts;
    chart.data.datasets[1].data = data[period].counts;
    chart.update();
}

/**
 * Initialize Refund Filters
 */
function initRefundFilters() {
    // Apply Filters Button
    document.getElementById('apply-refund-filters').addEventListener('click', function() {
        applyRefundFilters();
    });

    // Reset Filters Button
    document.getElementById('reset-refund-filters').addEventListener('click', function() {
        resetRefundFilters();
    });

    // Search Button
    document.getElementById('refund-search-btn').addEventListener('click', function() {
        applyRefundFilters();
    });

    // Export Refunds Button
    document.getElementById('export-refunds-btn').addEventListener('click', function() {
        exportRefunds();
    });

    // Bulk Action Buttons
    document.getElementById('approve-selected-btn').addEventListener('click', function() {
        approveSelectedRefunds();
    });

    document.getElementById('reject-selected-btn').addEventListener('click', function() {
        rejectSelectedRefunds();
    });
}

/**
 * Apply refund filters
 */
function applyRefundFilters() {
    const status = document.getElementById('refund-status').value;
    const reason = document.getElementById('refund-reason').value;
    const minAmount = document.getElementById('min-refund-amount').value;
    const maxAmount = document.getElementById('max-refund-amount').value;
    const searchTerm = document.getElementById('refund-search').value;
    const dateRange = $('#refund-date-range').val();

    console.log('Applying refund filters:', {
        status,
        reason,
        minAmount,
        maxAmount,
        searchTerm,
        dateRange
    });

    // In a real app, this would fetch filtered data from the server
    // For demo, just show a notification
    showNotification('Filters applied', 'Refund filters have been updated');
}

/**
 * Reset refund filters
 */
function resetRefundFilters() {
    document.getElementById('refund-status').value = 'pending';
    document.getElementById('refund-reason').value = 'all';
    document.getElementById('min-refund-amount').value = '';
    document.getElementById('max-refund-amount').value = '';
    document.getElementById('refund-search').value = '';

    // Reset date range to last 30 days
    $('#refund-date-range').data('daterangepicker').setStartDate(moment().subtract(29, 'days'));
    $('#refund-date-range').data('daterangepicker').setEndDate(moment());

    // In a real app, this would reset to default data
    showNotification('Filters reset', 'Refund filters have been reset to defaults');
}

/**
 * Export refunds to CSV/Excel
 */
function exportRefunds() {
    // In a real app, this would generate a file for download
    showNotification('Export started', 'Your refund export is being prepared');

    // Simulate download delay
    setTimeout(() => {
        showNotification('Export ready', 'Your refund export is ready for download', 'success');
    }, 2000);
}

/**
 * Initialize Date Range Picker
 */
function initDateRangePicker() {
    $('#refund-date-range').daterangepicker({
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
        // In a real app, this would refresh refund data
        console.log(`Date range selected: ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}`);
    });
}

/**
 * Initialize Refund Table
 */
function initRefundTable() {
    // Select All Checkbox
    const selectAllCheckbox = document.getElementById('select-all-refunds');
    const refundCheckboxes = document.querySelectorAll('.refund-checkbox');

    selectAllCheckbox.addEventListener('change', function() {
        refundCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });

        // Update the bulk action buttons state
        updateBulkActionButtons();
    });

    // Individual checkboxes affect select all status
    refundCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const allChecked = Array.from(refundCheckboxes).every(c => c.checked);
            const someChecked = Array.from(refundCheckboxes).some(c => c.checked);

            selectAllCheckbox.checked = allChecked;
            selectAllCheckbox.indeterminate = someChecked && !allChecked;

            // Update the bulk action buttons state
            updateBulkActionButtons();
        });
    });

    // View details buttons
    document.querySelectorAll('.view-refund').forEach(button => {
        button.addEventListener('click', function() {
            const refundId = this.dataset.id;
            openRefundDetails(refundId);
        });
    });

    // Approve refund buttons
    document.querySelectorAll('.approve-refund').forEach(button => {
        button.addEventListener('click', function() {
            const refundId = this.dataset.id;
            approveRefund(refundId);
        });
    });

    // Reject refund buttons
    document.querySelectorAll('.reject-refund').forEach(button => {
        button.addEventListener('click', function() {
            const refundId = this.dataset.id;
            rejectRefund(refundId);
        });
    });
}

/**
 * Update bulk action buttons state
 */
function updateBulkActionButtons() {
    const approveSelectedBtn = document.getElementById('approve-selected-btn');
    const rejectSelectedBtn = document.getElementById('reject-selected-btn');
    const selectedRefunds = Array.from(document.querySelectorAll('.refund-checkbox:checked'));

    // Only enable the buttons if there are selected refunds
    approveSelectedBtn.disabled = selectedRefunds.length === 0;
    rejectSelectedBtn.disabled = selectedRefunds.length === 0;
}

/**
 * Approve a single refund
 */
function approveRefund(refundId) {
    console.log(`Approving refund: ${refundId}`);

    // In a real app, this would call an API to approve the refund
    // Simulate processing
    showNotification('Processing', `Refund ${refundId} is being approved...`);

    // Simulate completion after delay
    setTimeout(() => {
        // Update the status in the UI
        const row = document.querySelector(`.refund-checkbox[data-id="${refundId}"]`).closest('tr');
        const statusCell = row.querySelector('td:nth-child(9)');
        statusCell.innerHTML = '<span class="status-badge approved">Approved</span>';

        // Update actions cell
        const actionsCell = row.querySelector('td:nth-child(10)');
        actionsCell.innerHTML = `
            <div class="table-actions">
                <button class="btn-icon view-refund" title="View Details" data-id="${refundId}"><i class="fas fa-eye"></i></button>
            </div>
        `;

        // Add event listener to the new view button
        const newViewButton = actionsCell.querySelector('.view-refund');
        newViewButton.addEventListener('click', function() {
            openRefundDetails(refundId);
        });

        // Show success notification
        showNotification('Approved', `Refund ${refundId} has been approved`, 'success');

        // Update refund metrics
        updateRefundMetrics();
    }, 1500);
}

/**
 * Reject a single refund
 */
function rejectRefund(refundId) {
    console.log(`Rejecting refund: ${refundId}`);

    // In a real app, this would call an API to reject the refund
    // For demo, we'll open a modal to enter a rejection reason
    openRejectRefundModal(refundId);
}

/**
 * Open reject refund modal
 */
function openRejectRefundModal(refundId) {
    // Get the refund detail modal and repurpose it
    const modal = document.getElementById('refund-detail-modal');
    const container = document.getElementById('refund-detail-container');
    const actionBtn = document.getElementById('reject-refund-btn');
    const approveBtn = document.getElementById('approve-refund-btn');
    const modalTitle = modal.querySelector('.modal-header h2');

    // Set title
    modalTitle.textContent = 'Reject Refund Request';

    // Set content
    container.innerHTML = `
        <div class="form-group">
            <label for="rejection-reason">Rejection Reason</label>
            <select id="rejection-reason" class="form-control">
                <option value="">Select a reason...</option>
                <option value="outside_policy">Outside Refund Policy Window</option>
                <option value="insufficient_evidence">Insufficient Evidence</option>
                <option value="terms_violation">Violation of Terms of Service</option>
                <option value="service_delivered">Service Was Delivered as Described</option>
                <option value="previous_refund">Previous Refund Already Issued</option>
                <option value="other">Other</option>
            </select>
        </div>
        <div class="form-group">
            <label for="rejection-notes">Notes (will be shared with client)</label>
            <textarea id="rejection-notes" class="form-control" rows="4" placeholder="Provide additional details about the rejection reason..."></textarea>
        </div>
    `;

    // Hide approve button, show reject button
    approveBtn.style.display = 'none';
    actionBtn.style.display = 'block';

    // Set up reject button
    actionBtn.textContent = 'Confirm Rejection';
    actionBtn.onclick = function() {
        const reason = document.getElementById('rejection-reason').value;
        const notes = document.getElementById('rejection-notes').value;

        if (!reason) {
            showNotification('Error', 'Please select a rejection reason', 'error');
            return;
        }

        // Close the modal
        modal.style.display = 'none';

        // Process the rejection
        processRefundRejection(refundId, reason, notes);
    };

    // Show the modal
    modal.style.display = 'block';
}

/**
 * Process refund rejection
 */
function processRefundRejection(refundId, reason, notes) {
    console.log(`Processing refund rejection: ${refundId}`, { reason, notes });

    // In a real app, this would call an API to reject the refund
    // Simulate processing
    showNotification('Processing', `Refund ${refundId} is being rejected...`);

    // Simulate completion after delay
    setTimeout(() => {
        // Update the status in the UI
        const row = document.querySelector(`.refund-checkbox[data-id="${refundId}"]`).closest('tr');
        const statusCell = row.querySelector('td:nth-child(9)');
        statusCell.innerHTML = '<span class="status-badge rejected">Rejected</span>';

        // Update actions cell
        const actionsCell = row.querySelector('td:nth-child(10)');
        actionsCell.innerHTML = `
            <div class="table-actions">
                <button class="btn-icon view-refund" title="View Details" data-id="${refundId}"><i class="fas fa-eye"></i></button>
            </div>
        `;

        // Add event listener to the new view button
        const newViewButton = actionsCell.querySelector('.view-refund');
        newViewButton.addEventListener('click', function() {
            openRefundDetails(refundId);
        });

        // Show success notification
        showNotification('Rejected', `Refund ${refundId} has been rejected`, 'success');

        // Update refund metrics
        updateRefundMetrics();
    }, 1500);
}

/**
 * Approve selected refunds
 */
function approveSelectedRefunds() {
    const selectedRefunds = Array.from(document.querySelectorAll('.refund-checkbox:checked'))
        .map(checkbox => checkbox.dataset.id);

    if (selectedRefunds.length === 0) {
        return;
    }

    console.log(`Approving ${selectedRefunds.length} refunds: ${selectedRefunds.join(', ')}`);

    // In a real app, this would call an API to process all selected refunds
    // Simulate processing
    showNotification('Processing', `Approving ${selectedRefunds.length} refunds...`);

    // Simulate completion after delay
    setTimeout(() => {
        // Update each selected refund
        selectedRefunds.forEach(refundId => {
            approveRefund(refundId);
        });

        // Show success notification
        showNotification('Complete', `${selectedRefunds.length} refunds have been approved`, 'success');
    }, 2000);
}

/**
 * Reject selected refunds
 */
function rejectSelectedRefunds() {
    const selectedRefunds = Array.from(document.querySelectorAll('.refund-checkbox:checked'))
        .map(checkbox => checkbox.dataset.id);

    if (selectedRefunds.length === 0) {
        return;
    }

    // For bulk rejection, we'll use a standard reason
    const reason = 'outside_policy';
    const notes = 'This refund request does not meet our refund policy requirements.';

    console.log(`Rejecting ${selectedRefunds.length} refunds: ${selectedRefunds.join(', ')}`);

    // In a real app, this would call an API to process all selected refunds
    // Simulate processing
    showNotification('Processing', `Rejecting ${selectedRefunds.length} refunds...`);

    // Simulate completion after delay
    setTimeout(() => {
        // Update each selected refund
        selectedRefunds.forEach(refundId => {
            processRefundRejection(refundId, reason, notes);
        });

        // Show success notification
        showNotification('Complete', `${selectedRefunds.length} refunds have been rejected`, 'success');
    }, 2000);
}

/**
 * Open refund details
 */
function openRefundDetails(refundId) {
    // Get the modal
    const modal = document.getElementById('refund-detail-modal');
    const container = document.getElementById('refund-detail-container');
    const rejectBtn = document.getElementById('reject-refund-btn');
    const approveBtn = document.getElementById('approve-refund-btn');
    const modalTitle = modal.querySelector('.modal-header h2');

    // Set default title
    modalTitle.textContent = 'Refund Request Details';

    // In a real app, we would fetch refund details from API
    // For demo, generate mockup data
    const refund = getMockRefund(refundId);

    // Populate modal content
    container.innerHTML = generateRefundDetailsHTML(refund);

    // Set appropriate action button visibility based on refund status
    if (refund.status === 'pending') {
        approveBtn.style.display = 'block';
        rejectBtn.style.display = 'block';

        approveBtn.onclick = function() {
            modal.style.display = 'none';
            approveRefund(refundId);
        };

        rejectBtn.onclick = function() {
            modal.style.display = 'none';
            rejectRefund(refundId);
        };
    } else {
        approveBtn.style.display = 'none';
        rejectBtn.style.display = 'none';
    }

    // Show the modal
    modal.style.display = 'block';
}

/**
 * Get mock refund data
 */
function getMockRefund(refundId) {
    // Mock refunds for demo
    const refunds = {
        'ref_12345': {
            id: 'ref_12345',
            date: 'April 1, 2023 14:30:15',
            client: {
                name: 'Emily Davis',
                email: 'emily.davis@example.com',
                image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330'
            },
            service: 'Business Strategy Consultation',
            expert: {
                name: 'James Wilson',
                email: 'jwilson@example.com',
                image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a'
            },
            amount: 350.00,
            reason: 'Expert Unavailable',
            status: 'pending',
            originalTransaction: 'txn_87654',
            originalDate: 'March 30, 2023',
            requestDetails: 'The expert didn\'t show up for our scheduled session. I waited for 30 minutes but there was no communication.',
            attachments: [
                { name: 'chat_transcript.pdf', type: 'application/pdf', size: '256 KB' },
                { name: 'booking_confirmation.png', type: 'image/png', size: '124 KB' }
            ],
            timeline: [
                { timestamp: 'Apr 1, 2023 14:30', event: 'Refund requested by client', actor: 'Emily Davis' },
                { timestamp: 'Apr 1, 2023 15:45', event: 'System notification sent to expert', actor: 'System' }
            ],
            communication: [
                {
                    sender: 'Emily Davis',
                    time: 'Apr 1, 2023 14:30',
                    message: 'I\'m requesting a refund because the expert didn\'t show up for our scheduled session. I waited for 30 minutes but there was no communication.'
                },
                {
                    sender: 'James Wilson',
                    time: 'Apr 1, 2023 16:15',
                    message: 'I sincerely apologize for missing our session. I had a personal emergency and was unable to access my computer. I completely understand the refund request.'
                }
            ]
        },
        'ref_12346': {
            id: 'ref_12346',
            date: 'March 29, 2023 15:45:22',
            client: {
                name: 'Michael Brown',
                email: 'mbrown@example.com',
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d'
            },
            service: 'Marketing Consultation',
            expert: {
                name: 'Sarah Johnson',
                email: 'sjohnson@example.com',
                image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2'
            },
            amount: 200.00,
            reason: 'Quality Issues',
            status: 'pending',
            urgency: true,
            originalTransaction: 'txn_87655',
            originalDate: 'March 25, 2023',
            requestDetails: 'The consultation was very generic and didn\'t address my specific needs. The advice given was something I could have found with a simple Google search.',
            attachments: [
                { name: 'session_notes.docx', type: 'application/msword', size: '45 KB' }
            ],
            timeline: [
                { timestamp: 'Mar 25, 2023 11:30', event: 'Service delivered', actor: 'Sarah Johnson' },
                { timestamp: 'Mar 29, 2023 15:45', event: 'Refund requested by client', actor: 'Michael Brown' },
                { timestamp: 'Mar 29, 2023 16:00', event: 'System notification sent to expert', actor: 'System' },
                { timestamp: 'Mar 30, 2023 09:15', event: 'Expert disputed refund request', actor: 'Sarah Johnson' }
            ],
            communication: [
                {
                    sender: 'Michael Brown',
                    time: 'Mar 29, 2023 15:45',
                    message: 'I\'m requesting a refund because the consultation was very generic and didn\'t address my specific needs. The advice given was something I could have found with a simple Google search.'
                },
                {
                    sender: 'Sarah Johnson',
                    time: 'Mar 30, 2023 09:15',
                    message: 'I disagree with this assessment. I provided customized marketing strategies based on the information provided. The client didn\'t share many details about their business during our session despite my questions.'
                },
                {
                    sender: 'Support Team',
                    time: 'Mar 30, 2023 10:30',
                    message: 'We\'re reviewing this case and will follow up with both parties. Please provide any additional information that might help us make a fair decision.'
                }
            ]
        }
    };

    // Add other mock refunds
    refunds['ref_12347'] = {
        id: 'ref_12347',
        date: 'April 2, 2023 10:15:37',
        client: {
            name: 'Robert Chen',
            email: 'rchen@example.com',
            image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e'
        },
        service: 'Financial Planning Session',
        expert: {
            name: 'Jessica Taylor',
            email: 'jtaylor@example.com',
            image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956'
        },
        amount: 425.00,
        reason: 'Not As Described',
        status: 'pending',
        originalTransaction: 'txn_87656',
        originalDate: 'April 1, 2023',
        requestDetails: 'The session was advertised as a comprehensive financial planning session, but it only covered investment strategies and didn\'t address retirement planning or tax strategies as promised.',
        timeline: [
            { timestamp: 'Apr 1, 2023 13:00', event: 'Service delivered', actor: 'Jessica Taylor' },
            { timestamp: 'Apr 2, 2023 10:15', event: 'Refund requested by client', actor: 'Robert Chen' },
            { timestamp: 'Apr 2, 2023 10:30', event: 'System notification sent to expert', actor: 'System' }
        ],
        communication: [
            {
                sender: 'Robert Chen',
                time: 'Apr 2, 2023 10:15',
                message: 'The session was advertised as a comprehensive financial planning session, but it only covered investment strategies and didn\'t address retirement planning or tax strategies as promised.'
            }
        ]
    };

    refunds['ref_12348'] = {
        id: 'ref_12348',
        date: 'March 28, 2023 09:20:45',
        client: {
            name: 'David Smith',
            email: 'dsmith@example.com',
            image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d'
        },
        service: 'Legal Consultation',
        expert: {
            name: 'Thomas Wright',
            email: 'twright@example.com',
            image: 'https://images.unsplash.com/photo-1629425733761-caae3b5f2e50'
        },
        amount: 550.00,
        reason: 'Duplicate Payment',
        status: 'pending',
        urgency: true,
        originalTransaction: 'txn_87657',
        originalDate: 'March 27, 2023',
        requestDetails: 'I was charged twice for the same session. I have two identical charges on my credit card statement.',
        attachments: [
            { name: 'credit_card_statement.pdf', type: 'application/pdf', size: '320 KB' }
        ],
        timeline: [
            { timestamp: 'Mar 27, 2023 14:00', event: 'First payment processed', actor: 'System' },
            { timestamp: 'Mar 27, 2023 14:01', event: 'Duplicate payment processed', actor: 'System' },
            { timestamp: 'Mar 27, 2023 15:30', event: 'Service delivered', actor: 'Thomas Wright' },
            { timestamp: 'Mar 28, 2023 09:20', event: 'Refund requested by client', actor: 'David Smith' }
        ],
        communication: [
            {
                sender: 'David Smith',
                time: 'Mar 28, 2023 09:20',
                message: 'I was charged twice for the same session. I have attached my credit card statement showing the duplicate charges.'
            },
            {
                sender: 'Support Team',
                time: 'Mar 28, 2023 10:05',
                message: 'We're investigating this issue and will process a refund for the duplicate charge as soon as possible.'
            }
        ]
    };

    return refunds[refundId] || {
        id: refundId,
        date: 'Unknown date',
        client: { name: 'Unknown client', email: 'unknown', image: 'default-avatar.png' },
        service: 'Unknown service',
        expert: { name: 'Unknown expert', email: 'unknown', image: 'default-avatar.png' },
        amount: 0,
        reason: 'Unknown reason',
        status: 'unknown',
        requestDetails: 'No details available'
    };
}

/**
 * Generate refund details HTML
 */
function generateRefundDetailsHTML(refund) {
    const urgencyBadge = refund.urgency ? '<span class="status-badge urgent">Urgent <i class="fas fa-exclamation-circle"></i></span>' : '';

    let html = `
        <div class="refund-detail">
            <div class="detail-row">
                <div class="detail-label">Request ID:</div>
                <div class="detail-value">${refund.id} ${urgencyBadge}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Date Requested:</div>
                <div class="detail-value">${refund.date}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Client:</div>
                <div class="detail-value">
                    <div class="user-info">
                        <img src="${refund.client.image}" alt="${refund.client.name}" class="avatar-sm">
                        <div>
                            <div>${refund.client.name}</div>
                            <div class="user-email">${refund.client.email}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Expert:</div>
                <div class="detail-value">
                    <div class="user-info">
                        <img src="${refund.expert.image}" alt="${refund.expert.name}" class="avatar-sm">
                        <div>
                            <div>${refund.expert.name}</div>
                            <div class="user-email">${refund.expert.email}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Service:</div>
                <div class="detail-value">${refund.service}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Original Transaction:</div>
                <div class="detail-value">${refund.originalTransaction || 'N/A'} (${refund.originalDate || 'Unknown date'})</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Amount:</div>
                <div class="detail-value amount">${typeof refund.amount === 'number' ? '$' + refund.amount.toFixed(2) : refund.amount}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Reason:</div>
                <div class="detail-value">${refund.reason}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Status:</div>
                <div class="detail-value">
                    <span class="status-badge ${refund.status}">${refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}</span>
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Request Details:</div>
                <div class="detail-value">${refund.requestDetails}</div>
            </div>`;

    // Add attachments if available
    if (refund.attachments && refund.attachments.length > 0) {
        html += `
            <div class="detail-row">
                <div class="detail-label">Attachments:</div>
                <div class="detail-value">
                    <div class="refund-attachments">`;

        refund.attachments.forEach(attachment => {
            let icon = 'fa-file';
            if (attachment.type.includes('pdf')) icon = 'fa-file-pdf';
            else if (attachment.type.includes('image')) icon = 'fa-file-image';
            else if (attachment.type.includes('word')) icon = 'fa-file-word';

            html += `
                <div class="attachment-item">
                    <i class="fas ${icon}"></i>
                    ${attachment.name} (${attachment.size})
                </div>`;
        });

        html += `
                    </div>
                </div>
            </div>`;
    }

    // Add timeline if available
    if (refund.timeline && refund.timeline.length > 0) {
        html += `
            <div class="detail-row">
                <div class="detail-label">Timeline:</div>
                <div class="detail-value">
                    <ul class="timeline-list">`;

        refund.timeline.forEach(event => {
            html += `
                <li>
                    <span class="timeline-time">${event.timestamp}</span> -
                    <span class="timeline-event">${event.event}</span>
                    <span class="timeline-actor">(${event.actor})</span>
                </li>`;
        });

        html += `
                    </ul>
                </div>
            </div>`;
    }

    // Add communication thread if available
    if (refund.communication && refund.communication.length > 0) {
        html += `
            <div class="detail-row">
                <div class="detail-label">Communication:</div>
                <div class="detail-value">
                    <div class="communication-thread">`;

        refund.communication.forEach(message => {
            html += `
                <div class="message">
                    <div class="message-header">
                        <span class="message-sender">${message.sender}</span>
                        <span class="message-time">${message.time}</span>
                    </div>
                    <div class="message-text">${message.message}</div>
                </div>`;
        });

        html += `
                    </div>
                </div>
            </div>`;
    }

    html += `</div>`;

    return html;
}

/**
 * Update refund metrics after approvals/rejections
 */
function updateRefundMetrics() {
    // In a real app, this would fetch updated metrics from the server
    // For demo, we'll just simulate changes

    // Get the metrics elements
    const pendingRefundsEl = document.getElementById('pendingRefunds');
    const urgentRefundsEl = document.getElementById('urgentRefunds');
    const processedRefundsEl = document.getElementById('processedRefunds');

    // Update the counts
    let pendingCount = parseInt(pendingRefundsEl.textContent);
    let urgentCount = parseInt(urgentRefundsEl.textContent);
    let processedCount = parseInt(processedRefundsEl.textContent);

    pendingCount = Math.max(0, pendingCount - 1);
    processedCount += 1;

    if (urgentCount > 0) {
        urgentCount = Math.max(0, urgentCount - 1);
        urgentRefundsEl.textContent = urgentCount;
    }

    // Update the UI
    pendingRefundsEl.textContent = pendingCount;
    processedRefundsEl.textContent = processedCount;
}

/**
 * Initialize Refund Policy Management
 */
function initRefundPolicyManagement() {
    // Edit Policy Button
    document.getElementById('edit-policy-btn').addEventListener('click', function() {
        openPolicyEditModal();
    });
}

/**
 * Open policy edit modal
 */
function openPolicyEditModal() {
    // Get the modal
    const modal = document.getElementById('policy-edit-modal');

    // Default inputs are already set in the HTML

    // Set up event listeners
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = document.getElementById('cancel-policy-btn');
    const saveBtn = document.getElementById('save-policy-btn');

    closeBtn.onclick = function() {
        modal.style.display = 'none';
    };

    cancelBtn.onclick = function() {
        modal.style.display = 'none';
    };

    saveBtn.onclick = function() {
        saveRefundPolicy();
    };

    // Show the modal
    modal.style.display = 'block';
}

/**
 * Save refund policy
 */
function saveRefundPolicy() {
    // Get the modal
    const modal = document.getElementById('policy-edit-modal');

    // Get form values
    const version = document.getElementById('policy-version').value;
    const timeframe = document.getElementById('refund-timeframe').value;
    const qualityIssuesPercent = document.getElementById('quality-issues-percent').value;
    const expertUnavailablePercent = document.getElementById('expert-unavailable-percent').value;
    const partialCompletionPercent = document.getElementById('partial-completion-percent').value;
    const cancel24hPercent = document.getElementById('cancel-24h-percent').value;
    const cancelLess24hPercent = document.getElementById('cancel-less-24h-percent').value;
    const processingTime = document.getElementById('processing-time').value;
    const notes = document.getElementById('policy-notes').value;

    console.log('Saving refund policy:', {
        version,
        timeframe,
        qualityIssuesPercent,
        expertUnavailablePercent,
        partialCompletionPercent,
        cancel24hPercent,
        cancelLess24hPercent,
        processingTime,
        notes
    });

    // In a real app, this would send the settings to the server
    // For demo, update the UI
    updateRefundPolicyUI({
        version,
        timeframe,
        qualityIssuesPercent,
        expertUnavailablePercent,
        partialCompletionPercent,
        cancel24hPercent,
        cancelLess24hPercent,
        processingTime,
        notes
    });

    // Close the modal
    modal.style.display = 'none';

    // Show success notification
    showNotification('Policy updated', 'Refund policy has been updated successfully', 'success');
}

/**
 * Update refund policy UI
 */
function updateRefundPolicyUI(policy) {
    // Parse date for version update
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Update the policy version
    const policyVersionEl = document.querySelector('.policy-version');
    policyVersionEl.textContent = `Version ${policy.version} - Updated ${formattedDate}`;

    // Update the time frame
    const timeframeEl = document.querySelector('.policy-item:nth-child(1) p');
    timeframeEl.innerHTML = `Clients may request a refund within <strong>${policy.timeframe} days</strong> of the service completion date.`;

    // Update refund amounts
    const refundAmountsEl = document.querySelector('.policy-item:nth-child(2)');
    refundAmountsEl.innerHTML = `
        <h4><i class="fas fa-percent"></i> Refund Amount</h4>
        <p>Full refunds (${policy.qualityIssuesPercent}%) are provided for service quality issues or expert unavailability.</p>
        <p>Partial refunds (${policy.partialCompletionPercent}%) are provided for services partially completed or with minor issues.</p>
        <p>Cancellation refunds vary based on notice provided (${policy.cancel24hPercent}% if >24h, ${policy.cancelLess24hPercent}% if <24h).</p>
    `;

    // Update processing time
    const processingTimeEl = document.querySelector('.policy-item:nth-child(5) p:first-child');
    processingTimeEl.innerHTML = `Refund requests are processed within <strong>${policy.processingTime} business days</strong> of approval.`;

    // Update notes (if applicable)
    if (policy.notes) {
        const refundMethodEl = document.querySelector('.policy-item:nth-child(4) p');
        refundMethodEl.textContent = policy.notes;
    }
}

/**
 * Initialize Modals
 */
function initModals() {
    // Refund Detail Modal
    const refundDetailModal = document.getElementById('refund-detail-modal');
    const closeRefundModalBtn = document.getElementById('close-refund-modal-btn');
    const refundModalClose = refundDetailModal.querySelector('.modal-close');

    closeRefundModalBtn.addEventListener('click', function() {
        refundDetailModal.style.display = 'none';
    });

    refundModalClose.addEventListener('click', function() {
        refundDetailModal.style.display = 'none';
    });

    // Policy Edit Modal
    const policyEditModal = document.getElementById('policy-edit-modal');
    const cancelPolicyBtn = document.getElementById('cancel-policy-btn');
    const policyModalClose = policyEditModal.querySelector('.modal-close');

    cancelPolicyBtn.addEventListener('click', function() {
        policyEditModal.style.display = 'none';
    });

    policyModalClose.addEventListener('click', function() {
        policyEditModal.style.display = 'none';
    });

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === refundDetailModal) {
            refundDetailModal.style.display = 'none';
        }
        if (event.target === policyEditModal) {
            policyEditModal.style.display = 'none';
        }
    });
}

/**
 * Notifications
 */
function showNotification(title, message, type = 'info') {
    // Get notification list
    const notificationList = document.getElementById('notification-list');
    if (!notificationList) return; // Early return if notification system not initialized

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
    if (bell) {
        bell.classList.add('active');

        // Remove highlight after 3 seconds
        setTimeout(() => {
            bell.classList.remove('active');
        }, 3000);
    }
}
