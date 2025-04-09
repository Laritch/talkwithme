/**
 * Admin Payouts Interface
 * Manages the Expert Payout Management Interface for the Admin Dashboard
 * - Payout Scheduling
 * - Payout Processing
 * - Batch Upload Management
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initPayoutFilters();
    initPayoutTable();
    initBatchUpload();
    initPayoutSchedule();
    initDateRangePicker();
    initNotifications();
    initModals();
});

/**
 * Initialize Payout Filters
 */
function initPayoutFilters() {
    // Apply Filters Button
    document.getElementById('apply-payout-filters').addEventListener('click', function() {
        applyPayoutFilters();
    });

    // Reset Filters Button
    document.getElementById('reset-payout-filters').addEventListener('click', function() {
        resetPayoutFilters();
    });

    // Search Button
    document.getElementById('payout-search-btn').addEventListener('click', function() {
        applyPayoutFilters();
    });

    // Export Payouts Button
    document.getElementById('export-payouts-btn').addEventListener('click', function() {
        exportPayouts();
    });
}

/**
 * Apply payout filters
 */
function applyPayoutFilters() {
    const status = document.getElementById('payout-status').value;
    const method = document.getElementById('payout-method').value;
    const minAmount = document.getElementById('min-payout-amount').value;
    const maxAmount = document.getElementById('max-payout-amount').value;
    const searchTerm = document.getElementById('payout-search').value;
    const dateRange = $('#payout-date-range').val();

    console.log('Applying payout filters:', {
        status,
        method,
        minAmount,
        maxAmount,
        searchTerm,
        dateRange
    });

    // In a real app, this would fetch filtered data from the server
    // For demo, just show a notification
    showNotification('Filters applied', 'Payout filters have been updated');
}

/**
 * Reset payout filters
 */
function resetPayoutFilters() {
    document.getElementById('payout-status').value = 'all';
    document.getElementById('payout-method').value = 'all';
    document.getElementById('min-payout-amount').value = '';
    document.getElementById('max-payout-amount').value = '';
    document.getElementById('payout-search').value = '';

    // Reset date range to last 30 days
    $('#payout-date-range').data('daterangepicker').setStartDate(moment().subtract(29, 'days'));
    $('#payout-date-range').data('daterangepicker').setEndDate(moment());

    // In a real app, this would reset to default data
    showNotification('Filters reset', 'Payout filters have been reset to defaults');
}

/**
 * Export payouts to CSV/Excel
 */
function exportPayouts() {
    // In a real app, this would generate a file for download
    showNotification('Export started', 'Your payout export is being prepared');

    // Simulate download delay
    setTimeout(() => {
        showNotification('Export ready', 'Your payout export is ready for download', 'success');
    }, 2000);
}

/**
 * Initialize Date Range Picker
 */
function initDateRangePicker() {
    $('#payout-date-range').daterangepicker({
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
        // In a real app, this would refresh payout data
        console.log(`Date range selected: ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}`);
    });
}

/**
 * Initialize Payout Table
 */
function initPayoutTable() {
    // Select All Checkbox
    const selectAllCheckbox = document.getElementById('select-all-payouts');
    const payoutCheckboxes = document.querySelectorAll('.payout-checkbox');

    selectAllCheckbox.addEventListener('change', function() {
        payoutCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });

        // Update the bulk process button state
        updateBulkProcessButton();
    });

    // Individual checkboxes affect select all status
    payoutCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const allChecked = Array.from(payoutCheckboxes).every(c => c.checked);
            const someChecked = Array.from(payoutCheckboxes).some(c => c.checked);

            selectAllCheckbox.checked = allChecked;
            selectAllCheckbox.indeterminate = someChecked && !allChecked;

            // Update the bulk process button state
            updateBulkProcessButton();
        });
    });

    // View details buttons
    document.querySelectorAll('.view-payout').forEach(button => {
        button.addEventListener('click', function() {
            const payoutId = this.dataset.id;
            openPayoutDetails(payoutId);
        });
    });

    // Process payout buttons
    document.querySelectorAll('.process-payout').forEach(button => {
        button.addEventListener('click', function() {
            const payoutId = this.dataset.id;
            processPayout(payoutId);
        });
    });

    // Retry payout buttons
    document.querySelectorAll('.retry-payout').forEach(button => {
        button.addEventListener('click', function() {
            const payoutId = this.dataset.id;
            retryPayout(payoutId);
        });
    });

    // Bulk process button
    document.getElementById('bulk-process-btn').addEventListener('click', function() {
        processBulkPayouts();
    });
}

/**
 * Update bulk process button state
 */
function updateBulkProcessButton() {
    const bulkProcessBtn = document.getElementById('bulk-process-btn');
    const selectedPayouts = Array.from(document.querySelectorAll('.payout-checkbox:checked'));

    // Only enable the button if there are selected payouts
    bulkProcessBtn.disabled = selectedPayouts.length === 0;
}

/**
 * Process a single payout
 */
function processPayout(payoutId) {
    console.log(`Processing payout: ${payoutId}`);

    // In a real app, this would call an API to process the payout
    // Simulate processing
    showNotification('Processing', `Payout ${payoutId} is being processed...`);

    // Simulate completion after delay
    setTimeout(() => {
        // Update the status in the UI
        const row = document.querySelector(`.payout-checkbox[data-id="${payoutId}"]`).closest('tr');
        const statusCell = row.querySelector('td:nth-child(7)');
        statusCell.innerHTML = '<span class="status-badge completed">Completed</span>';

        // Update actions cell
        const actionsCell = row.querySelector('td:nth-child(9)');
        actionsCell.innerHTML = `
            <div class="table-actions">
                <button class="btn-icon view-payout" title="View Details" data-id="${payoutId}"><i class="fas fa-eye"></i></button>
                <button class="btn-icon download-receipt" title="Download Receipt" data-id="${payoutId}"><i class="fas fa-file-download"></i></button>
                <div class="action-dropdown">
                    <button class="btn-icon" title="More Actions"><i class="fas fa-ellipsis-v"></i></button>
                    <div class="dropdown-menu">
                        <a href="#" class="dropdown-item download-statement" data-id="${payoutId}">Download Statement</a>
                        <a href="#" class="dropdown-item contact-expert" data-id="${payoutId}">Contact Expert</a>
                    </div>
                </div>
            </div>
        `;

        // Add event listener to the new view button
        const newViewButton = actionsCell.querySelector('.view-payout');
        newViewButton.addEventListener('click', function() {
            openPayoutDetails(payoutId);
        });

        // Add event listener to the new download receipt button
        const newDownloadButton = actionsCell.querySelector('.download-receipt');
        newDownloadButton.addEventListener('click', function() {
            downloadReceipt(payoutId);
        });

        // Show success notification
        showNotification('Complete', `Payout ${payoutId} has been processed successfully`, 'success');
    }, 2000);
}

/**
 * Retry a failed payout
 */
function retryPayout(payoutId) {
    console.log(`Retrying payout: ${payoutId}`);

    // In a real app, this would call an API to retry the payout
    // Simulate retrying
    showNotification('Retrying', `Payout ${payoutId} is being retried...`);

    // Simulate processing after delay
    setTimeout(() => {
        // Update the status in the UI to processing
        const row = document.querySelector(`.payout-checkbox[data-id="${payoutId}"]`).closest('tr');
        const statusCell = row.querySelector('td:nth-child(7)');
        statusCell.innerHTML = '<span class="status-badge processing">Processing</span>';

        // Update actions cell
        const actionsCell = row.querySelector('td:nth-child(9)');
        actionsCell.innerHTML = `
            <div class="table-actions">
                <button class="btn-icon view-payout" title="View Details" data-id="${payoutId}"><i class="fas fa-eye"></i></button>
                <div class="action-dropdown">
                    <button class="btn-icon" title="More Actions"><i class="fas fa-ellipsis-v"></i></button>
                    <div class="dropdown-menu">
                        <a href="#" class="dropdown-item check-status" data-id="${payoutId}">Check Status</a>
                        <a href="#" class="dropdown-item download-statement" data-id="${payoutId}">Download Statement</a>
                        <a href="#" class="dropdown-item contact-expert" data-id="${payoutId}">Contact Expert</a>
                    </div>
                </div>
            </div>
        `;

        // Add event listener to the new view button
        const newViewButton = actionsCell.querySelector('.view-payout');
        newViewButton.addEventListener('click', function() {
            openPayoutDetails(payoutId);
        });

        // Show success notification
        showNotification('Processing', `Payout ${payoutId} is now being processed`, 'success');
    }, 2000);
}

/**
 * Process all selected payouts
 */
function processBulkPayouts() {
    const selectedPayouts = Array.from(document.querySelectorAll('.payout-checkbox:checked'))
        .map(checkbox => checkbox.dataset.id);

    if (selectedPayouts.length === 0) {
        return;
    }

    console.log(`Processing bulk payouts: ${selectedPayouts.join(', ')}`);

    // In a real app, this would call an API to process all selected payouts
    // Simulate processing
    showNotification('Processing', `Processing ${selectedPayouts.length} payouts...`);

    // Simulate completion after delay
    setTimeout(() => {
        // Update all selected payouts
        selectedPayouts.forEach(payoutId => {
            processPayout(payoutId);
        });

        // Show success notification
        showNotification('Complete', `${selectedPayouts.length} payouts have been processed`, 'success');
    }, 2000);
}

/**
 * Download payout receipt
 */
function downloadReceipt(payoutId) {
    console.log(`Downloading receipt for payout: ${payoutId}`);
    showNotification('Download started', 'Your receipt is being prepared for download');

    // Simulate download delay
    setTimeout(() => {
        showNotification('Download ready', 'Your receipt is ready for download', 'success');
    }, 1500);
}

/**
 * Open payout details modal
 */
function openPayoutDetails(payoutId) {
    // Get the modal
    const modal = document.getElementById('payout-detail-modal');
    const container = document.getElementById('payout-detail-container');
    const actionBtn = document.getElementById('payout-action-btn');

    // In a real app, we would fetch payout details from API
    // For demo, generate mockup data
    const payout = getMockPayout(payoutId);

    // Populate modal content
    container.innerHTML = generatePayoutDetailsHTML(payout);

    // Set appropriate action button text based on payout status
    if (payout.status === 'pending') {
        actionBtn.textContent = 'Process Payout';
        actionBtn.style.display = 'block';
        actionBtn.onclick = function() {
            modal.style.display = 'none';
            processPayout(payoutId);
        };
    } else if (payout.status === 'failed') {
        actionBtn.textContent = 'Retry Payout';
        actionBtn.style.display = 'block';
        actionBtn.onclick = function() {
            modal.style.display = 'none';
            retryPayout(payoutId);
        };
    } else if (payout.status === 'processing') {
        actionBtn.textContent = 'Check Status';
        actionBtn.style.display = 'block';
        actionBtn.onclick = function() {
            showNotification('Status check', 'Checking payout status...', 'info');
            setTimeout(() => {
                showNotification('Status update', 'Payout is still processing', 'info');
            }, 1500);
        };
    } else {
        actionBtn.style.display = 'none';
    }

    // Show the modal
    modal.style.display = 'block';
}

/**
 * Get mock payout data
 */
function getMockPayout(payoutId) {
    // Mock payouts for demo
    const payouts = {
        'pyt_12345': {
            id: 'pyt_12345',
            period: 'March 1 - March 31, 2023',
            expert: {
                name: 'James Wilson',
                email: 'jwilson@example.com',
                image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a'
            },
            amount: 1250.00,
            fees: 0,
            netAmount: 1250.00,
            status: 'pending',
            scheduleDate: 'April 15, 2023',
            paymentMethod: 'Bank Transfer',
            accountDetails: 'Bank of America ****4567',
            currency: 'USD',
            sessions: 8,
            earnings: [
                { type: 'Session fees', amount: 1000.00 },
                { type: 'Tips', amount: 200.00 },
                { type: 'Bonuses', amount: 50.00 }
            ],
            notes: 'Regular monthly payout'
        },
        'pyt_12346': {
            id: 'pyt_12346',
            period: 'March 1 - March 31, 2023',
            expert: {
                name: 'Emily Davis',
                email: 'emily.davis@example.com',
                image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330'
            },
            amount: 2340.00,
            fees: 0,
            netAmount: 2340.00,
            status: 'completed',
            scheduleDate: 'April 1, 2023',
            completionDate: 'April 1, 2023',
            paymentMethod: 'PayPal',
            accountDetails: 'emily.davis@example.com',
            currency: 'USD',
            sessions: 12,
            earnings: [
                { type: 'Session fees', amount: 1800.00 },
                { type: 'Tips', amount: 340.00 },
                { type: 'Bonuses', amount: 200.00 }
            ],
            transactionId: 'pp_98765432',
            notes: 'Top performer bonus included'
        },
        'pyt_12347': {
            id: 'pyt_12347',
            period: 'March 1 - March 31, 2023',
            expert: {
                name: 'Michael Brown',
                email: 'mbrown@example.com',
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d'
            },
            amount: 950.00,
            fees: 0,
            netAmount: 950.00,
            status: 'failed',
            scheduleDate: 'April 1, 2023',
            failureDate: 'April 1, 2023',
            paymentMethod: 'Wise',
            accountDetails: 'mbrown@example.com',
            currency: 'USD',
            sessions: 6,
            earnings: [
                { type: 'Session fees', amount: 900.00 },
                { type: 'Tips', amount: 50.00 }
            ],
            errorMessage: 'Invalid recipient account details',
            notes: 'Need to contact expert to update banking information'
        },
        'pyt_12348': {
            id: 'pyt_12348',
            period: 'March 1 - March 31, 2023',
            expert: {
                name: 'Robert Chen',
                email: 'rchen@example.com',
                image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d'
            },
            amount: 1750.00,
            fees: 0,
            netAmount: 1750.00,
            status: 'processing',
            scheduleDate: 'April 1, 2023',
            processStartDate: 'April 1, 2023',
            paymentMethod: 'Cryptocurrency',
            accountDetails: 'BTC: 3FZbgi29cpjq2GjdwV8eyHuJJnkLtktktZc5',
            currency: 'USD',
            sessions: 9,
            earnings: [
                { type: 'Session fees', amount: 1350.00 },
                { type: 'Tips', amount: 300.00 },
                { type: 'Bonuses', amount: 100.00 }
            ],
            notes: 'Crypto processing may take 24-48 hours'
        }
    };

    return payouts[payoutId] || {
        id: payoutId,
        period: 'Unknown period',
        expert: { name: 'Unknown expert', email: 'unknown', image: 'default-avatar.png' },
        amount: 0,
        fees: 0,
        netAmount: 0,
        status: 'unknown',
        paymentMethod: 'Unknown method',
        notes: 'No details available'
    };
}

/**
 * Generate payout details HTML
 */
function generatePayoutDetailsHTML(payout) {
    // Calculate earnings total
    const earningsTotal = payout.earnings ? payout.earnings.reduce((total, earning) => total + earning.amount, 0) : 0;

    let statusHTML = '';
    if (payout.status === 'pending') {
        statusHTML = `<span class="status-badge pending">Pending</span>`;
    } else if (payout.status === 'processing') {
        statusHTML = `<span class="status-badge processing">Processing</span>`;
    } else if (payout.status === 'completed') {
        statusHTML = `<span class="status-badge completed">Completed</span>`;
    } else if (payout.status === 'failed') {
        statusHTML = `<span class="status-badge failed">Failed</span>`;
    }

    return `
        <div class="payout-detail">
            <div class="detail-row">
                <div class="detail-label">Payout ID:</div>
                <div class="detail-value">${payout.id}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Expert:</div>
                <div class="detail-value">
                    <div class="user-info">
                        <img src="${payout.expert.image}" alt="${payout.expert.name}" class="avatar-sm">
                        <div>
                            <div>${payout.expert.name}</div>
                            <div class="user-email">${payout.expert.email}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Period:</div>
                <div class="detail-value">${payout.period}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Amount:</div>
                <div class="detail-value amount positive">$${payout.amount.toFixed(2)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Fees:</div>
                <div class="detail-value">$${payout.fees.toFixed(2)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Net Amount:</div>
                <div class="detail-value amount positive">$${payout.netAmount.toFixed(2)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Status:</div>
                <div class="detail-value">${statusHTML}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Schedule Date:</div>
                <div class="detail-value">${payout.scheduleDate}</div>
            </div>
            ${payout.completionDate ? `
                <div class="detail-row">
                    <div class="detail-label">Completion Date:</div>
                    <div class="detail-value">${payout.completionDate}</div>
                </div>
            ` : ''}
            ${payout.failureDate ? `
                <div class="detail-row">
                    <div class="detail-label">Failure Date:</div>
                    <div class="detail-value">${payout.failureDate}</div>
                </div>
            ` : ''}
            ${payout.processStartDate ? `
                <div class="detail-row">
                    <div class="detail-label">Process Start Date:</div>
                    <div class="detail-value">${payout.processStartDate}</div>
                </div>
            ` : ''}
            <div class="detail-row">
                <div class="detail-label">Payment Method:</div>
                <div class="detail-value">${payout.paymentMethod}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Account Details:</div>
                <div class="detail-value">${payout.accountDetails || 'N/A'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Currency:</div>
                <div class="detail-value">${payout.currency}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Sessions:</div>
                <div class="detail-value">${payout.sessions || 'N/A'}</div>
            </div>
            ${payout.earnings ? `
                <div class="detail-row">
                    <div class="detail-label">Earnings Breakdown:</div>
                    <div class="detail-value">
                        <ul class="earnings-list">
                            ${payout.earnings.map(earning => `
                                <li>
                                    <span class="earning-type">${earning.type}:</span>
                                    <span class="earning-amount">$${earning.amount.toFixed(2)}</span>
                                </li>
                            `).join('')}
                            <li class="earnings-total">
                                <span class="earning-type">Total:</span>
                                <span class="earning-amount">$${earningsTotal.toFixed(2)}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            ` : ''}
            ${payout.transactionId ? `
                <div class="detail-row">
                    <div class="detail-label">Transaction ID:</div>
                    <div class="detail-value">${payout.transactionId}</div>
                </div>
            ` : ''}
            ${payout.errorMessage ? `
                <div class="detail-row">
                    <div class="detail-label">Error:</div>
                    <div class="detail-value error-message">${payout.errorMessage}</div>
                </div>
            ` : ''}
            <div class="detail-row">
                <div class="detail-label">Notes:</div>
                <div class="detail-value">${payout.notes || 'No notes'}</div>
            </div>
        </div>
    `;
}

/**
 * Initialize Batch Upload functionality
 */
function initBatchUpload() {
    // Download Template Button
    document.getElementById('download-template-btn').addEventListener('click', function() {
        downloadPayoutTemplate();
    });

    // Upload CSV Button
    const uploadInput = document.getElementById('upload-csv');
    uploadInput.addEventListener('change', function() {
        if (uploadInput.files.length > 0) {
            handleCSVUpload(uploadInput.files[0]);
        }
    });
}

/**
 * Download the payout CSV template
 */
function downloadPayoutTemplate() {
    console.log('Downloading payout template');
    showNotification('Download started', 'Your payout template is being prepared for download');

    // In a real app, this would generate a file for download
    // For demo, create a simple CSV template
    const csvContent = [
        'expert_id,expert_email,period_start,period_end,amount,payment_method,account_details,currency,notes',
        'exp_12345,expert@example.com,2023-03-01,2023-03-31,1250.00,bank_transfer,"Bank of America ****4567",USD,"Regular monthly payout"',
        'exp_67890,another@example.com,2023-03-01,2023-03-31,975.50,paypal,payment@example.com,USD,"Include performance bonus"'
    ].join('\n');

    // Create a temporary anchor element to trigger the download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payout_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Show success notification
    setTimeout(() => {
        showNotification('Download complete', 'Your payout template has been downloaded', 'success');
    }, 1000);
}

/**
 * Handle CSV file upload
 */
function handleCSVUpload(file) {
    console.log(`Handling CSV upload: ${file.name}`);
    showNotification('Upload received', 'Your payout CSV is being processed...');

    // In a real app, this would send the file to the server for processing
    // For demo, simulate processing
    setTimeout(() => {
        showBatchPreviewModal(file);
    }, 1500);
}

/**
 * Show batch preview modal with parsed CSV data
 */
function showBatchPreviewModal(file) {
    // In a real app, we would parse the CSV file
    // For demo, create a mock preview
    const mockPreview = [
        {
            expert_id: 'exp_12345',
            expert_name: 'James Wilson',
            expert_email: 'jwilson@example.com',
            period: 'Mar 1 - Mar 31, 2023',
            amount: '$1,250.00',
            payment_method: 'Bank Transfer',
            status: 'Ready to process'
        },
        {
            expert_id: 'exp_67890',
            expert_name: 'Emily Davis',
            expert_email: 'emily.davis@example.com',
            period: 'Mar 1 - Mar 31, 2023',
            amount: '$975.50',
            payment_method: 'PayPal',
            status: 'Ready to process'
        },
        {
            expert_id: 'exp_24680',
            expert_name: 'Michael Brown',
            expert_email: 'mbrown@example.com',
            period: 'Mar 1 - Mar 31, 2023',
            amount: '$850.00',
            payment_method: 'Wise',
            status: 'Ready to process'
        }
    ];

    // Create a modal element (since we don't have one in the HTML)
    const modalHtml = `
        <div id="batch-preview-modal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Batch Payout Preview</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="batch-summary">
                        <p>
                            <strong>File:</strong> ${file.name}<br>
                            <strong>Total Records:</strong> ${mockPreview.length}<br>
                            <strong>Total Amount:</strong> $${mockPreview.reduce((total, item) => total + parseFloat(item.amount.replace('$', '').replace(',', '')), 0).toFixed(2)}
                        </p>
                    </div>
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Expert</th>
                                    <th>Email</th>
                                    <th>Period</th>
                                    <th>Amount</th>
                                    <th>Method</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${mockPreview.map(item => `
                                    <tr>
                                        <td>
                                            <div class="user-info-compact">
                                                ${item.expert_name} (${item.expert_id})
                                            </div>
                                        </td>
                                        <td>${item.expert_email}</td>
                                        <td>${item.period}</td>
                                        <td class="amount positive">${item.amount}</td>
                                        <td>${item.payment_method}</td>
                                        <td><span class="status-badge pending">${item.status}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" id="cancel-batch-btn">Cancel</button>
                    <button class="btn btn-primary" id="process-batch-btn">Process Batch</button>
                </div>
            </div>
        </div>
    `;

    // Add the modal to the document
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);

    // Get the modal element
    const modal = document.getElementById('batch-preview-modal');

    // Show the modal
    modal.style.display = 'block';

    // Add event listeners
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = document.getElementById('cancel-batch-btn');
    const processBtn = document.getElementById('process-batch-btn');

    closeBtn.onclick = function() {
        modal.style.display = 'none';
        document.body.removeChild(modalContainer);
    };

    cancelBtn.onclick = function() {
        modal.style.display = 'none';
        document.body.removeChild(modalContainer);
    };

    processBtn.onclick = function() {
        processBatchPayouts();
        modal.style.display = 'none';
        document.body.removeChild(modalContainer);
    };

    // Close when clicking outside
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.removeChild(modalContainer);
        }
    };

    // Show success notification
    showNotification('File processed', 'Your payout CSV has been processed successfully. Review the preview to confirm.', 'success');
}

/**
 * Initialize Payout Schedule functionality
 */
function initPayoutSchedule() {
    // Run Scheduled Payouts Button
    document.getElementById('run-scheduled-payouts-btn').addEventListener('click', function() {
        runScheduledPayouts();
    });

    // Edit Schedule Button
    document.getElementById('edit-schedule-btn').addEventListener('click', function() {
        showScheduleEditModal();
    });
}

/**
 * Run all scheduled payouts
 */
function runScheduledPayouts() {
    console.log('Running scheduled payouts');

    // In a real app, this would call an API to run the scheduled payouts
    // For demo, simulate processing
    showNotification('Processing', 'Running scheduled payouts... This may take a few minutes.');

    // Simulate completion after delay
    setTimeout(() => {
        // Show success notification
        showNotification('Complete', 'Scheduled payouts have been processed successfully', 'success');

        // Update the next payout date
        const nextPayoutDateElement = document.getElementById('next-payout-date');
        const lastPayoutDateElement = document.getElementById('last-payout-date');

        // Update last payout date to today
        const today = new Date();
        const todayFormatted = today.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const timeFormatted = today.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short'
        });

        lastPayoutDateElement.textContent = `${todayFormatted} at ${timeFormatted}`;

        // Update next payout date to 15 days from now (for bi-monthly schedule)
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + 15);
        const nextDateFormatted = nextDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        nextPayoutDateElement.textContent = `${nextDateFormatted} at 12:00 AM UTC`;

        // Refresh the table - in a real app, this would fetch updated data
        // For demo, we'll just update the UI to reflect the run
        document.querySelectorAll('.payout-checkbox').forEach(checkbox => {
            const row = checkbox.closest('tr');
            if (row.querySelector('.status-badge.pending')) {
                // Process this payout
                const payoutId = checkbox.dataset.id;
                processPayout(payoutId);
            }
        });
    }, 3000);
}

/**
 * Show schedule edit modal
 */
function showScheduleEditModal() {
    // Get the modal
    const modal = document.getElementById('schedule-edit-modal');

    // Show the modal
    modal.style.display = 'block';

    // Set up event listeners
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = document.getElementById('cancel-schedule-btn');
    const saveBtn = document.getElementById('save-schedule-btn');

    closeBtn.onclick = function() {
        modal.style.display = 'none';
    };

    cancelBtn.onclick = function() {
        modal.style.display = 'none';
    };

    saveBtn.onclick = function() {
        saveScheduleSettings(modal);
    };

    // Close when clicking outside
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

    // Set up frequency change handler
    const frequencySelect = document.getElementById('schedule-frequency');
    frequencySelect.addEventListener('change', function() {
        updateScheduleDaysOptions(frequencySelect.value);
    });
}

/**
 * Update schedule days options based on selected frequency
 */
function updateScheduleDaysOptions(frequency) {
    const checkboxGroup = document.querySelector('.schedule-dates .checkbox-group');

    // Clear existing options
    checkboxGroup.innerHTML = '';

    if (frequency === 'monthly') {
        checkboxGroup.innerHTML = `
            <label class="checkbox-container">
                <input type="checkbox" id="day-1" checked>
                <span class="checkbox-label">1st of month</span>
            </label>
        `;
    } else if (frequency === 'bi-monthly') {
        checkboxGroup.innerHTML = `
            <label class="checkbox-container">
                <input type="checkbox" id="day-1" checked>
                <span class="checkbox-label">1st of month</span>
            </label>
            <label class="checkbox-container">
                <input type="checkbox" id="day-15" checked>
                <span class="checkbox-label">15th of month</span>
            </label>
        `;
    } else if (frequency === 'weekly') {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        days.forEach(day => {
            const dayId = day.toLowerCase();
            checkboxGroup.innerHTML += `
                <label class="checkbox-container">
                    <input type="checkbox" id="day-${dayId}" ${day === 'Monday' ? 'checked' : ''}>
                    <span class="checkbox-label">${day}</span>
                </label>
            `;
        });
    } else if (frequency === 'custom') {
        // Allow selection of any day of month
        const days = [1, 5, 10, 15, 20, 25, 'Last day'];
        days.forEach(day => {
            const dayId = `day-${day}`.toLowerCase().replace(' ', '-');
            const dayLabel = typeof day === 'number' ? `${day}${getDaySuffix(day)} of month` : day;
            checkboxGroup.innerHTML += `
                <label class="checkbox-container">
                    <input type="checkbox" id="${dayId}">
                    <span class="checkbox-label">${dayLabel}</span>
                </label>
            `;
        });
    }
}

/**
 * Get day suffix (st, nd, rd, th)
 */
function getDaySuffix(day) {
    if (day >= 11 && day <= 13) {
        return 'th';
    }

    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

/**
 * Save schedule settings
 */
function saveScheduleSettings(modal) {
    // Get form values
    const frequency = document.getElementById('schedule-frequency').value;
    const time = document.getElementById('schedule-time').value;
    const minThreshold = document.getElementById('min-payout-threshold').value;

    // Get selected days
    const selectedDays = [];
    document.querySelectorAll('.schedule-dates input[type="checkbox"]:checked').forEach(checkbox => {
        selectedDays.push(checkbox.id.replace('day-', ''));
    });

    console.log('Saving schedule settings:', {
        frequency,
        selectedDays,
        time,
        minThreshold
    });

    // In a real app, this would send the settings to the server
    // For demo, update the UI
    let scheduleText = '';
    if (frequency === 'monthly') {
        scheduleText = 'Monthly (1st of month)';
    } else if (frequency === 'bi-monthly') {
        scheduleText = 'Bi-monthly (1st and 15th)';
    } else if (frequency === 'weekly') {
        const dayNames = selectedDays.map(day => day.charAt(0).toUpperCase() + day.slice(1));
        scheduleText = `Weekly (${dayNames.join(', ')})`;
    } else if (frequency === 'custom') {
        const dayLabels = selectedDays.map(day => {
            if (day === 'last-day') return 'Last day';
            return `${day}${getDaySuffix(parseInt(day))}`;
        });
        scheduleText = `Custom (${dayLabels.join(', ')})`;
    }

    document.getElementById('current-schedule').textContent = scheduleText;

    // Update next payout date based on selected schedule
    updateNextPayoutDate(frequency, selectedDays);

    // Close the modal
    modal.style.display = 'none';

    // Show success notification
    showNotification('Schedule updated', 'Payout schedule has been updated successfully', 'success');
}

/**
 * Update next payout date based on selected schedule
 */
function updateNextPayoutDate(frequency, selectedDays) {
    const nextPayoutDateElement = document.getElementById('next-payout-date');
    const today = new Date();
    let nextDate = new Date(today);

    if (frequency === 'monthly' || frequency === 'bi-monthly') {
        // Monthly or bi-monthly schedule
        if (frequency === 'monthly') {
            // Next 1st of month
            nextDate.setMonth(today.getMonth() + 1);
            nextDate.setDate(1);
        } else {
            // Bi-monthly - either 1st or 15th
            if (today.getDate() < 15) {
                // Next date is 15th of this month
                nextDate.setDate(15);
            } else {
                // Next date is 1st of next month
                nextDate.setMonth(today.getMonth() + 1);
                nextDate.setDate(1);
            }
        }
    } else if (frequency === 'weekly') {
        // Weekly schedule
        const dayIndexMap = { 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5 };
        const selectedDayIndices = selectedDays.map(day => dayIndexMap[day]);
        const currentDayIndex = today.getDay(); // 0 is Sunday, 1 is Monday, etc.

        // Find the next day that's selected
        let daysToAdd = 7;
        for (const dayIndex of selectedDayIndices) {
            const diff = dayIndex - currentDayIndex;
            if (diff > 0 && diff < daysToAdd) {
                daysToAdd = diff;
            }
        }

        // If no day found (all selected days are before today), go to next week
        if (daysToAdd === 7) {
            daysToAdd = 7 + Math.min(...selectedDayIndices) - currentDayIndex;
        }

        nextDate.setDate(today.getDate() + daysToAdd);
    } else if (frequency === 'custom') {
        // Custom schedule - selected days of month
        const currentDay = today.getDate();
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

        // Process selected days as numbers (except "last-day")
        let selectedDayNumbers = selectedDays
            .filter(day => day !== 'last-day')
            .map(day => parseInt(day))
            .sort((a, b) => a - b);

        // Add last day of month if selected
        if (selectedDays.includes('last-day')) {
            selectedDayNumbers.push(lastDayOfMonth);
        }

        // Find the next day that's selected
        let nextDay = null;
        for (const day of selectedDayNumbers) {
            if (day > currentDay) {
                nextDay = day;
                break;
            }
        }

        // If no day found (all selected days are before today), go to next month
        if (nextDay === null) {
            nextDate.setMonth(today.getMonth() + 1);
            nextDate.setDate(selectedDayNumbers[0]);
        } else {
            nextDate.setDate(nextDay);
        }
    }

    // Format the date
    const nextDateFormatted = nextDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    nextPayoutDateElement.textContent = `${nextDateFormatted} at 12:00 AM UTC`;
}

/**
 * Initialize Modal functionality
 */
function initModals() {
    // Payout Detail Modal
    const payoutDetailModal = document.getElementById('payout-detail-modal');
    const closePayoutModalBtn = document.getElementById('close-payout-modal-btn');
    const payoutModalClose = payoutDetailModal.querySelector('.modal-close');

    closePayoutModalBtn.addEventListener('click', function() {
        payoutDetailModal.style.display = 'none';
    });

    payoutModalClose.addEventListener('click', function() {
        payoutDetailModal.style.display = 'none';
    });

    // Schedule Edit Modal
    const scheduleEditModal = document.getElementById('schedule-edit-modal');
    const cancelScheduleBtn = document.getElementById('cancel-schedule-btn');
    const scheduleModalClose = scheduleEditModal.querySelector('.modal-close');

    cancelScheduleBtn.addEventListener('click', function() {
        scheduleEditModal.style.display = 'none';
    });

    scheduleModalClose.addEventListener('click', function() {
        scheduleEditModal.style.display = 'none';
    });

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === payoutDetailModal) {
            payoutDetailModal.style.display = 'none';
        }
        if (event.target === scheduleEditModal) {
            scheduleEditModal.style.display = 'none';
        }
    });
}

/**
 * Initialize Notifications
 */
function initNotifications() {
    // Set up notifications
    const notificationBell = document.getElementById('notification-bell');
    if (notificationBell) {
        notificationBell.addEventListener('click', function() {
            const panel = document.getElementById('notification-panel');
            panel.classList.toggle('show');
        });

        // Close panel when clicking outside
        document.addEventListener('click', function(event) {
            const bell = document.getElementById('notification-bell');
            const panel = document.getElementById('notification-panel');

            if (bell && panel && !bell.contains(event.target) && !panel.contains(event.target)) {
                panel.classList.remove('show');
            }
        });
    }
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
    bell.classList.add('active');

    // Remove highlight after 3 seconds
    setTimeout(() => {
        bell.classList.remove('active');
    }, 3000);
}
