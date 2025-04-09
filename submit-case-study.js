/**
 * Case Study Submission Form - JavaScript
 * Handles form navigation, validation, and preview functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize form navigation
    initFormNavigation();

    // Initialize character counters
    initCharCounters();

    // Initialize premium toggle
    initPremiumToggle();

    // Initialize verification type toggle
    initVerificationToggle();

    // Initialize timeline builder
    initTimelineBuilder();

    // Initialize metrics builder
    initMetricsBuilder();

    // Initialize file uploads
    initFileUploads();

    // Initialize publishing options
    initPublishingOptions();

    // Initialize form validation
    initFormValidation();

    // Initialize preview generation
    initPreviewGeneration();
});

/**
 * Initialize multi-step form navigation
 */
function initFormNavigation() {
    // Next buttons
    document.getElementById('next-step-1').addEventListener('click', () => {
        if (validateStep(1)) goToStep(2);
    });

    document.getElementById('next-step-2').addEventListener('click', () => {
        if (validateStep(2)) goToStep(3);
    });

    document.getElementById('next-step-3').addEventListener('click', () => {
        if (validateStep(3)) goToStep(4);
    });

    document.getElementById('next-step-4').addEventListener('click', () => {
        if (validateStep(4)) {
            goToStep(5);
            generatePreview();
        }
    });

    // Previous buttons
    document.getElementById('prev-step-2').addEventListener('click', () => goToStep(1));
    document.getElementById('prev-step-3').addEventListener('click', () => goToStep(2));
    document.getElementById('prev-step-4').addEventListener('click', () => goToStep(3));
    document.getElementById('prev-step-5').addEventListener('click', () => goToStep(4));

    // Save draft buttons
    document.querySelectorAll('[id^="save-draft-"]').forEach(button => {
        button.addEventListener('click', saveDraft);
    });
}

/**
 * Navigate to a specific form step
 * @param {number} stepNumber - The step number to navigate to (1-5)
 */
function goToStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });

    // Show the target step
    document.querySelector(`.form-step[data-step="${stepNumber}"]`).classList.add('active');

    // Update progress indicators
    document.querySelectorAll('.progress-step').forEach(step => {
        const stepNum = parseInt(step.getAttribute('data-step'));

        // Remove all statuses
        step.classList.remove('active', 'completed');

        // Set appropriate status
        if (stepNum === stepNumber) {
            step.classList.add('active');
        } else if (stepNum < stepNumber) {
            step.classList.add('completed');
        }
    });

    // Scroll to top of form
    document.querySelector('.case-study-form').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Validate the current form step
 * @param {number} stepNumber - The step number to validate
 * @returns {boolean} Whether the step is valid
 */
function validateStep(stepNumber) {
    const currentStep = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
    const requiredFields = currentStep.querySelectorAll('[required]');
    let isValid = true;

    // Check each required field
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('invalid');

            // Add error message if not already present
            if (!field.nextElementSibling || !field.nextElementSibling.classList.contains('error-message')) {
                const errorMessage = document.createElement('div');
                errorMessage.className = 'error-message';
                errorMessage.textContent = 'This field is required';
                field.parentNode.insertBefore(errorMessage, field.nextSibling);
            }
        } else {
            field.classList.remove('invalid');

            // Remove error message if present
            if (field.nextElementSibling && field.nextElementSibling.classList.contains('error-message')) {
                field.parentNode.removeChild(field.nextElementSibling);
            }
        }
    });

    // Additional step-specific validation
    switch (stepNumber) {
        case 1:
            // Validate title length (min 10 characters)
            const titleField = document.getElementById('case-study-title');
            if (titleField.value.trim().length < 10) {
                titleField.classList.add('invalid');
                showFieldError(titleField, 'Title should be at least 10 characters');
                isValid = false;
            }
            break;

        case 3:
            // Validate metrics (at least 2 filled out)
            const metricValues = document.querySelectorAll('.metric-value');
            const metricLabels = document.querySelectorAll('.metric-label');
            let filledMetrics = 0;

            for (let i = 0; i < metricValues.length; i++) {
                if (metricValues[i].value.trim() && metricLabels[i].value.trim()) {
                    filledMetrics++;
                }
            }

            if (filledMetrics < 2) {
                isValid = false;
                showError('Please add at least 2 key metrics to demonstrate your results');
            }

            // Validate verification content based on selected type
            const verificationType = document.querySelector('input[name="verification-type"]:checked').value;

            if (verificationType === 'testimonial' && !document.getElementById('testimonial-text').value.trim()) {
                document.getElementById('testimonial-text').classList.add('invalid');
                showFieldError(document.getElementById('testimonial-text'), 'Testimonial text is required');
                isValid = false;
            } else if (verificationType === 'email' && !document.getElementById('verification-email-address').value.trim()) {
                document.getElementById('verification-email-address').classList.add('invalid');
                showFieldError(document.getElementById('verification-email-address'), 'Client email address is required');
                isValid = false;
            }
            break;

        case 4:
            // Validate that featured image is selected
            const featuredImageInput = document.getElementById('featured-image-upload');
            if (featuredImageInput.files.length === 0) {
                isValid = false;
                showError('Please upload a featured image for your case study');
            }
            break;
    }

    return isValid;
}

/**
 * Show error message beneath a specific field
 * @param {HTMLElement} field - The field to show error for
 * @param {string} message - The error message
 */
function showFieldError(field, message) {
    // Remove existing error message
    if (field.nextElementSibling && field.nextElementSibling.classList.contains('error-message')) {
        field.parentNode.removeChild(field.nextElementSibling);
    }

    // Add new error message
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.textContent = message;
    field.parentNode.insertBefore(errorMessage, field.nextSibling);
}

/**
 * Show a general error message on the form
 * @param {string} message - The error message to display
 */
function showError(message) {
    // Create error notification
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;

    // Add to form and remove after 5 seconds
    document.querySelector('.case-study-form').appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.querySelector('.case-study-form').removeChild(notification);
        }, 300);
    }, 5000);
}

/**
 * Initialize character counters for text fields
 */
function initCharCounters() {
    const titleField = document.getElementById('case-study-title');
    const titleCount = document.getElementById('title-char-count');

    titleField.addEventListener('input', () => {
        const count = titleField.value.length;
        titleCount.textContent = count;

        if (count > 70) {
            titleCount.classList.add('warning');
        } else {
            titleCount.classList.remove('warning');
        }
    });

    const summaryField = document.getElementById('case-study-summary');
    const summaryCount = document.getElementById('summary-char-count');

    summaryField.addEventListener('input', () => {
        const count = summaryField.value.length;
        summaryCount.textContent = count;

        if (count > 180) {
            summaryCount.classList.add('warning');
        } else {
            summaryCount.classList.remove('warning');
        }
    });
}

/**
 * Initialize premium toggle functionality
 */
function initPremiumToggle() {
    const premiumToggle = document.getElementById('premium-toggle');
    const premiumFeatures = document.querySelector('.premium-features');

    premiumToggle.addEventListener('change', () => {
        if (premiumToggle.checked) {
            premiumFeatures.style.display = 'block';
        } else {
            premiumFeatures.style.display = 'none';
        }
    });
}

/**
 * Initialize verification method toggle
 */
function initVerificationToggle() {
    const verificationOptions = document.querySelectorAll('input[name="verification-type"]');
    const testimonialContent = document.getElementById('testimonial-content');
    const emailContent = document.getElementById('email-content');
    const documentContent = document.getElementById('document-content');

    verificationOptions.forEach(option => {
        option.addEventListener('change', () => {
            // Hide all content sections
            testimonialContent.style.display = 'none';
            emailContent.style.display = 'none';
            documentContent.style.display = 'none';

            // Show selected content section
            const selectedOption = document.querySelector('input[name="verification-type"]:checked').value;

            if (selectedOption === 'testimonial') {
                testimonialContent.style.display = 'block';
            } else if (selectedOption === 'email') {
                emailContent.style.display = 'block';
            } else if (selectedOption === 'document') {
                documentContent.style.display = 'block';
            }
        });
    });
}

/**
 * Initialize timeline builder functionality
 */
function initTimelineBuilder() {
    const timelineContainer = document.querySelector('.timeline-builder');
    const addTimelineBtn = document.getElementById('add-timeline-entry');
    let timelineEntryIndex = 1; // Start from 1 since we already have entry 0

    addTimelineBtn.addEventListener('click', () => {
        const newEntry = document.createElement('div');
        newEntry.className = 'timeline-entry';
        newEntry.innerHTML = `
            <div class="form-row">
                <div class="form-group two-thirds">
                    <input type="text" name="timeline[${timelineEntryIndex}][title]" placeholder="Timeline Phase Title" class="timeline-title">
                </div>
                <div class="form-group one-third">
                    <select name="timeline[${timelineEntryIndex}][week]" class="timeline-week">
                        <option value="week1">Week 1</option>
                        <option value="week2">Week 2</option>
                        <option value="week3">Week 3</option>
                        <option value="week4">Week 4</option>
                        <option value="month2">Month 2</option>
                        <option value="month3">Month 3+</option>
                    </select>
                </div>
            </div>
            <textarea name="timeline[${timelineEntryIndex}][description]" placeholder="Describe what happened during this phase" class="timeline-description"></textarea>
            <button type="button" class="btn btn-outline btn-sm remove-timeline" style="margin-top: 10px;">
                <i class="fas fa-trash"></i> Remove Entry
            </button>
        `;

        // Insert before the "Add Timeline Entry" button
        timelineContainer.insertBefore(newEntry, addTimelineBtn);

        // Add event listener to the remove button
        newEntry.querySelector('.remove-timeline').addEventListener('click', function() {
            timelineContainer.removeChild(newEntry);
        });

        timelineEntryIndex++;
    });
}

/**
 * Initialize metrics builder functionality
 */
function initMetricsBuilder() {
    const metricsContainer = document.querySelector('.metrics-container');
    const addMetricBtn = document.getElementById('add-metric');
    let metricIndex = 2; // Start from 2 since we already have metrics 0 and 1

    addMetricBtn.addEventListener('click', () => {
        // Only allow up to 4 metrics total
        if (metricIndex >= 4) {
            showError('You can add a maximum of 4 key metrics');
            return;
        }

        const newMetric = document.createElement('div');
        newMetric.className = 'metric-entry';
        newMetric.innerHTML = `
            <div class="form-row">
                <div class="form-group half">
                    <input type="text" name="metrics[${metricIndex}][value]" placeholder="Value (e.g., 35%)" class="metric-value">
                </div>
                <div class="form-group half">
                    <input type="text" name="metrics[${metricIndex}][label]" placeholder="Label (e.g., Efficiency Gain)" class="metric-label">
                </div>
            </div>
        `;

        metricsContainer.appendChild(newMetric);
        metricIndex++;

        // Disable the "Add Another Metric" button if we've reached the max
        if (metricIndex >= 4) {
            addMetricBtn.disabled = true;
        }
    });
}

/**
 * Initialize file upload handlers
 */
function initFileUploads() {
    // Featured Image Upload
    const featuredImageInput = document.getElementById('featured-image-upload');
    const featuredImagePreview = document.getElementById('featured-image-preview');

    featuredImageInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();

            reader.onload = function(e) {
                featuredImagePreview.innerHTML = `<img src="${e.target.result}" alt="Featured Image Preview">`;
            };

            reader.readAsDataURL(this.files[0]);
        }
    });

    // Additional Images Upload
    const additionalImagesInput = document.getElementById('additional-images-upload');
    const additionalImagesContainer = document.getElementById('additional-images-container');

    additionalImagesInput.addEventListener('change', function() {
        if (this.files) {
            // Limit to 5 additional images
            const maxFiles = 5;
            const totalExistingImages = additionalImagesContainer.querySelectorAll('.additional-image-preview').length;
            const maxNewImages = Math.max(0, maxFiles - totalExistingImages);

            if (this.files.length > maxNewImages) {
                showError(`You can only upload a maximum of ${maxFiles} additional images.`);
            }

            // Process each file
            for (let i = 0; i < Math.min(this.files.length, maxNewImages); i++) {
                const file = this.files[i];
                const reader = new FileReader();

                reader.onload = function(e) {
                    const imagePreview = document.createElement('div');
                    imagePreview.className = 'additional-image-preview';
                    imagePreview.innerHTML = `
                        <img src="${e.target.result}" alt="Additional Image">
                        <div class="remove-image"><i class="fas fa-times"></i></div>
                    `;

                    additionalImagesContainer.appendChild(imagePreview);

                    // Add event listener to remove button
                    imagePreview.querySelector('.remove-image').addEventListener('click', function() {
                        additionalImagesContainer.removeChild(imagePreview);
                    });
                };

                reader.readAsDataURL(file);
            }
        }
    });

    // Supporting Document Upload
    const documentInput = document.getElementById('document-upload');
    const documentList = document.getElementById('document-list');

    documentInput.addEventListener('change', function() {
        if (this.files.length) {
            // Display file names
            const fileNames = Array.from(this.files).map(file => file.name).join(', ');
            documentList.textContent = fileNames;
        } else {
            documentList.textContent = 'No files chosen';
        }
    });

    // Verification Document Upload
    const verificationDocumentInput = document.getElementById('verification-document-upload');
    const verificationDocumentFileName = verificationDocumentInput.nextElementSibling.nextElementSibling;

    verificationDocumentInput.addEventListener('change', function() {
        if (this.files.length) {
            verificationDocumentFileName.textContent = this.files[0].name;
        } else {
            verificationDocumentFileName.textContent = 'No file chosen';
        }
    });
}

/**
 * Initialize publishing options
 */
function initPublishingOptions() {
    const publishOptions = document.querySelectorAll('input[name="publishOption"]');
    const scheduleDateContainer = document.querySelector('.schedule-date-container');

    publishOptions.forEach(option => {
        option.addEventListener('change', () => {
            if (option.value === 'later') {
                scheduleDateContainer.style.display = 'block';
            } else {
                scheduleDateContainer.style.display = 'none';
            }
        });
    });
}

/**
 * Initialize form validation
 */
function initFormValidation() {
    const form = document.getElementById('case-study-form');

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Check if step 5 is valid (terms agreement)
        const termsCheckbox = document.getElementById('terms-agreement');
        if (!termsCheckbox.checked) {
            showError('You must agree to the terms before submitting your case study');
            return;
        }

        // Submit the form
        submitCaseStudy();
    });
}

/**
 * Generate case study preview
 */
function generatePreview() {
    const previewContainer = document.getElementById('case-study-preview');

    // Gather form data
    const title = document.getElementById('case-study-title').value;
    const summary = document.getElementById('case-study-summary').value;
    const category = document.getElementById('case-study-category').options[document.getElementById('case-study-category').selectedIndex].text;
    const clientName = document.getElementById('client-name').value;
    const resultsOverview = document.getElementById('case-results').value;

    // Get metrics
    const metrics = [];
    document.querySelectorAll('.metric-entry').forEach(entry => {
        const valueField = entry.querySelector('.metric-value');
        const labelField = entry.querySelector('.metric-label');

        if (valueField.value && labelField.value) {
            metrics.push({
                value: valueField.value,
                label: labelField.value
            });
        }
    });

    // Build HTML preview
    const featuredImageSrc = document.querySelector('#featured-image-preview img')?.src || '';

    setTimeout(() => {
        previewContainer.innerHTML = `
            <div class="preview-case-study">
                <h2>${title}</h2>
                <div class="preview-meta">
                    <span class="preview-category">${category}</span>
                    <span class="preview-client">Client: ${clientName}</span>
                </div>
                ${featuredImageSrc ? `<div class="preview-image"><img src="${featuredImageSrc}" alt="${title}"></div>` : ''}
                <div class="preview-summary">
                    <p>${summary}</p>
                </div>
                <div class="preview-results">
                    <h3>Results</h3>
                    <div class="preview-metrics">
                        ${metrics.map(metric => `
                            <div class="preview-metric">
                                <span class="preview-metric-value">${metric.value}</span>
                                <span class="preview-metric-label">${metric.label}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="preview-note">
                    <p>This is a simplified preview. The published case study will include all details and be formatted according to our platform standards.</p>
                </div>
            </div>
        `;
    }, 500);
}

/**
 * Save case study draft
 */
function saveDraft() {
    showSuccessMessage('Your case study draft has been saved');

    // In a real application, this would make an API call to save the draft
    console.log('Draft saved', collectFormData());
}

/**
 * Submit the case study
 */
function submitCaseStudy() {
    // Show loading state
    const submitButton = document.getElementById('submit-case-study');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

    // In a real application, this would submit the form data to an API
    setTimeout(() => {
        // Reset button state
        submitButton.disabled = false;
        submitButton.textContent = originalText;

        // Show success message and redirect
        showSuccessMessage('Your case study has been submitted successfully!');

        // Redirect after a delay
        setTimeout(() => {
            window.location.href = 'expert-case-studies-manage.html?submitted=true';
        }, 2000);
    }, 2000);
}

/**
 * Collect all form data
 * @returns {Object} Form data as an object
 */
function collectFormData() {
    const formData = new FormData(document.getElementById('case-study-form'));
    const data = {};

    for (const [key, value] of formData.entries()) {
        // Handle array notation in field names (e.g., metrics[0][value])
        if (key.includes('[')) {
            const matches = key.match(/([^\[]+)\[([^\]]+)\](?:\[([^\]]+)\])?/);

            if (matches) {
                const mainKey = matches[1];
                const index = matches[2];
                const subKey = matches[3];

                // Initialize arrays/objects if they don't exist
                if (!data[mainKey]) {
                    data[mainKey] = [];
                }

                if (!data[mainKey][index]) {
                    data[mainKey][index] = {};
                }

                if (subKey) {
                    data[mainKey][index][subKey] = value;
                } else {
                    data[mainKey][index] = value;
                }
            }
        } else {
            data[key] = value;
        }
    }

    return data;
}

/**
 * Show success message
 * @param {string} message - The success message to display
 */
function showSuccessMessage(message) {
    // Create success notification
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;

    // Add to form and remove after delay
    document.querySelector('.case-study-form').appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.querySelector('.case-study-form').removeChild(notification);
        }, 300);
    }, 5000);
}
