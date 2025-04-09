/**
 * Client Verification - JavaScript
 * Handle verification interactions for case study results and testimonials
 */

document.addEventListener('DOMContentLoaded', function() {
    // Parse verification token from URL if present
    parseVerificationToken();

    // Initialize verification buttons
    initVerificationButtons();

    // Initialize dispute form
    initDisputeForm();

    // Initialize custom testimonial form
    initCustomTestimonial();

    // Initialize verify all button
    initVerifyAllButton();
});

/**
 * Parse verification token from URL
 * In a real application, this would validate the token with the server
 */
function parseVerificationToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        // In a real application, redirect to an error page if no token is present
        console.log('No verification token found in URL');
    } else {
        // Validate token with server in a real application
        console.log('Verification token found:', token);

        // For demo purposes, we'll assume the token is valid
        // In a real application, this would make an API call to validate the token
    }
}

/**
 * Initialize verification buttons for individual results
 */
function initVerificationButtons() {
    // Verify buttons
    const verifyButtons = document.querySelectorAll('.verify-button');
    verifyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const resultId = this.getAttribute('data-result');

            // Find the result item or testimonial content
            let targetElement;
            if (resultId === 'testimonial') {
                targetElement = document.querySelector('.testimonial-content');
            } else {
                targetElement = this.closest('.result-item');
            }

            if (targetElement) {
                // Mark as verified
                targetElement.classList.add('verified');

                // In a real application, this would make an API call to verify the result
                sendVerification(resultId, 'verified');

                // Check if all items are now verified
                checkAllVerified();
            }
        });
    });

    // Dispute buttons
    const disputeButtons = document.querySelectorAll('.dispute-button');
    disputeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const resultId = this.getAttribute('data-result');

            // Show dispute form
            const disputeForm = document.getElementById('dispute-form');
            if (disputeForm) {
                disputeForm.style.display = 'block';

                // Set the disputed item
                const disputeItemInput = document.getElementById('dispute-item');
                let itemName = '';

                if (resultId === 'testimonial') {
                    itemName = 'Testimonial';
                } else {
                    const resultItem = this.closest('.result-item');
                    const resultValue = resultItem.querySelector('.result-value').textContent;
                    const resultLabel = resultItem.querySelector('.result-label').textContent;
                    itemName = `${resultLabel} (${resultValue})`;
                }

                if (disputeItemInput) {
                    disputeItemInput.value = itemName;
                }

                // Store the result ID for submission
                disputeForm.setAttribute('data-result-id', resultId);

                // Scroll to the dispute form
                disputeForm.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

/**
 * Initialize dispute form functionality
 */
function initDisputeForm() {
    const disputeForm = document.getElementById('dispute-form');
    const submitDisputeButton = document.getElementById('submit-dispute');
    const cancelDisputeButton = document.getElementById('cancel-dispute');

    if (submitDisputeButton) {
        submitDisputeButton.addEventListener('click', function() {
            const resultId = disputeForm.getAttribute('data-result-id');
            const reason = document.getElementById('dispute-reason').value;
            const comments = document.getElementById('dispute-comments').value;

            // Validate inputs
            if (!reason) {
                alert('Please select a reason for your dispute.');
                return;
            }

            // Find the result item or testimonial content
            let targetElement;
            if (resultId === 'testimonial') {
                targetElement = document.querySelector('.testimonial-content');
            } else {
                // Find the result item with the matching data-result attribute
                const resultButton = document.querySelector(`.dispute-button[data-result="${resultId}"]`);
                targetElement = resultButton ? resultButton.closest('.result-item') : null;
            }

            if (targetElement) {
                // Mark as disputed
                targetElement.classList.add('disputed');

                // In a real application, this would make an API call to submit the dispute
                sendVerification(resultId, 'disputed', { reason, comments });

                // Hide the dispute form
                disputeForm.style.display = 'none';

                // Reset the form
                document.getElementById('dispute-reason').value = '';
                document.getElementById('dispute-comments').value = '';

                // Check if all items are now verified or disputed
                checkAllVerified();
            }
        });
    }

    if (cancelDisputeButton) {
        cancelDisputeButton.addEventListener('click', function() {
            // Hide the dispute form
            disputeForm.style.display = 'none';

            // Reset the form
            document.getElementById('dispute-reason').value = '';
            document.getElementById('dispute-comments').value = '';
        });
    }
}

/**
 * Initialize custom testimonial functionality
 */
function initCustomTestimonial() {
    const provideTestimonialButton = document.getElementById('provide-testimonial');
    const customTestimonialSection = document.querySelector('.custom-testimonial');
    const submitCustomTestimonialButton = document.getElementById('submit-custom-testimonial');

    if (provideTestimonialButton && customTestimonialSection) {
        provideTestimonialButton.addEventListener('click', function() {
            // Show custom testimonial section
            customTestimonialSection.style.display = 'block';

            // Scroll to the section
            customTestimonialSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    if (submitCustomTestimonialButton) {
        submitCustomTestimonialButton.addEventListener('click', function() {
            const customTestimonial = document.getElementById('custom-testimonial').value;

            if (!customTestimonial.trim()) {
                alert('Please enter your testimonial before submitting.');
                return;
            }

            // In a real application, this would make an API call to submit the custom testimonial
            sendCustomTestimonial(customTestimonial);

            // Mark the original testimonial as disputed or replaced
            const testimonialContent = document.querySelector('.testimonial-content');
            if (testimonialContent) {
                testimonialContent.classList.add('disputed');
            }

            // Hide the custom testimonial section
            customTestimonialSection.style.display = 'none';

            // Show success message
            alert('Thank you for providing your testimonial. It has been submitted successfully.');

            // Check if all items are now verified or disputed
            checkAllVerified();
        });
    }
}

/**
 * Initialize verify all button
 */
function initVerifyAllButton() {
    const verifyAllButton = document.getElementById('verify-all');

    if (verifyAllButton) {
        verifyAllButton.addEventListener('click', function() {
            // Verify all results
            const resultItems = document.querySelectorAll('.result-item:not(.verified):not(.disputed)');
            resultItems.forEach(item => {
                item.classList.add('verified');
            });

            // Verify testimonial if not already verified or disputed
            const testimonialContent = document.querySelector('.testimonial-content:not(.verified):not(.disputed)');
            if (testimonialContent) {
                testimonialContent.classList.add('verified');
            }

            // In a real application, this would make an API call to verify all results
            sendVerificationAll();

            // Show verification complete
            showVerificationComplete();
        });
    }
}

/**
 * Check if all items are verified or disputed
 */
function checkAllVerified() {
    const unverifiedItems = document.querySelectorAll('.result-item:not(.verified):not(.disputed), .testimonial-content:not(.verified):not(.disputed)');

    if (unverifiedItems.length === 0) {
        // All items are verified or disputed
        showVerificationComplete();
    }
}

/**
 * Show verification complete message
 */
function showVerificationComplete() {
    const verificationComplete = document.querySelector('.verification-complete');
    const verificationSections = document.querySelector('.verification-sections');
    const verificationActions = document.querySelector('.verification-actions');

    if (verificationComplete && verificationSections && verificationActions) {
        // Hide sections and actions
        verificationSections.style.display = 'none';
        verificationActions.style.display = 'none';

        // Show completion message
        verificationComplete.style.display = 'block';

        // Scroll to the completion message
        verificationComplete.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Send verification to server
 * @param {string} resultId - ID of the result being verified
 * @param {string} status - 'verified' or 'disputed'
 * @param {Object} [details] - Additional details for disputes
 */
function sendVerification(resultId, status, details = {}) {
    // In a real application, this would make an API call to verify the result
    console.log(`Sending ${status} for ${resultId}:`, details);

    // Example API call structure (not actually executed in this demo)
    const data = {
        resultId,
        status,
        ...details,
        token: new URLSearchParams(window.location.search).get('token')
    };

    // Simulating server response
    console.log('Server received verification:', data);
}

/**
 * Send custom testimonial to server
 * @param {string} testimonial - The custom testimonial text
 */
function sendCustomTestimonial(testimonial) {
    // In a real application, this would make an API call to submit the custom testimonial
    console.log('Sending custom testimonial:', testimonial);

    // Example API call structure (not actually executed in this demo)
    const data = {
        testimonial,
        token: new URLSearchParams(window.location.search).get('token')
    };

    // Simulating server response
    console.log('Server received custom testimonial:', data);
}

/**
 * Send verify all to server
 */
function sendVerificationAll() {
    // In a real application, this would make an API call to verify all results
    console.log('Sending verify all');

    // Example API call structure (not actually executed in this demo)
    const data = {
        verifyAll: true,
        token: new URLSearchParams(window.location.search).get('token')
    };

    // Simulating server response
    console.log('Server received verify all:', data);
}
