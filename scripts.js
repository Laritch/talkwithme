/**
 * Expert Profile Platform
 * Main JavaScript file for handling profile interactions and video recording
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all interactive components
    initVideoPlayer();
    initVideoRecorder();
    initBookingActions();
    initShareFunctionality();
    initCarousels();
    initCaseStudiesModules();
});

/**
 * Initialize the expert intro video player
 */
function initVideoPlayer() {
    const videoElement = document.getElementById('intro-video');
    if (!videoElement) return;

    // Add video player controls and event listeners
    videoElement.addEventListener('play', () => {
        console.log('Video started playing');
        // Analytics tracking could be added here
    });

    videoElement.addEventListener('pause', () => {
        console.log('Video paused');
    });

    // Add custom video controls if needed
    const videoContainer = videoElement.closest('.video-container');
    if (videoContainer) {
        // Optional: Add custom video controls
    }
}

/**
 * Initialize video recorder for experts to create their video introductions
 */
function initVideoRecorder() {
    const videoRecorderContainer = document.getElementById('video-recorder-container');
    if (!videoRecorderContainer) return;

    const videoPreview = document.getElementById('video-preview');
    const startRecordingBtn = document.getElementById('start-recording');
    const stopRecordingBtn = document.getElementById('stop-recording');
    const videoCountdown = document.getElementById('video-countdown');
    const videoFilters = document.querySelectorAll('.video-filter');
    const videoQualityOptions = document.querySelectorAll('.video-quality-option');

    let mediaRecorder;
    let recordedChunks = [];
    let stream;
    let countdownInterval;
    let recordingTimeLeft = 60; // 60 seconds max recording time

    // Initialize video quality (default to high)
    let videoQuality = {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 }
    };

    // Handle quality option changes
    if (videoQualityOptions) {
        videoQualityOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Remove active class from all options
                videoQualityOptions.forEach(opt => opt.classList.remove('active'));

                // Add active class to clicked option
                this.classList.add('active');

                // Update video quality based on selected option
                const quality = this.getAttribute('data-quality');

                switch (quality) {
                    case 'low':
                        videoQuality = {
                            width: { ideal: 640 },
                            height: { ideal: 480 },
                            frameRate: { ideal: 15 }
                        };
                        break;
                    case 'medium':
                        videoQuality = {
                            width: { ideal: 1280 },
                            height: { ideal: 720 },
                            frameRate: { ideal: 24 }
                        };
                        break;
                    case 'high':
                    default:
                        videoQuality = {
                            width: { ideal: 1920 },
                            height: { ideal: 1080 },
                            frameRate: { ideal: 30 }
                        };
                        break;
                }

                // Restart the stream with new quality if already active
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                    startCamera();
                }
            });
        });
    }

    // Apply filter effects
    if (videoFilters) {
        videoFilters.forEach(filter => {
            filter.addEventListener('click', function() {
                if (!videoPreview) return;

                // Remove all filter classes
                videoPreview.classList.remove('filter-normal', 'filter-sepia', 'filter-grayscale', 'filter-vintage', 'filter-bright');

                // Add selected filter class
                const filterType = this.getAttribute('data-filter');
                videoPreview.classList.add(`filter-${filterType}`);

                // Update active filter UI
                videoFilters.forEach(f => f.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }

    // Start camera function
    async function startCamera() {
        try {
            // Get media stream with specified quality
            stream = await navigator.mediaDevices.getUserMedia({
                video: videoQuality,
                audio: true
            });

            if (videoPreview) {
                videoPreview.srcObject = stream;
            }

            // Initialize media recorder
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = function(e) {
                if (e.data.size > 0) {
                    recordedChunks.push(e.data);
                }
            };

            mediaRecorder.onstop = function() {
                // Create blob from recorded chunks
                const blob = new Blob(recordedChunks, {
                    type: 'video/webm'
                });

                // Save or preview the recorded video
                saveRecordedVideo(blob);

                // Reset for next recording
                recordedChunks = [];
            };

        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('Could not access camera. Please make sure you have granted permission and no other app is using it.');
        }
    }

    // Start recording function
    function startRecording() {
        if (!mediaRecorder) return;

        // Reset recording time
        recordingTimeLeft = 60;
        updateCountdown();

        // Start recording
        mediaRecorder.start();

        // Show recording indicator and countdown
        if (videoRecorderContainer) {
            videoRecorderContainer.classList.add('recording');
        }

        // Start countdown
        countdownInterval = setInterval(function() {
            recordingTimeLeft--;
            updateCountdown();

            if (recordingTimeLeft <= 0) {
                stopRecording();
            }
        }, 1000);
    }

    // Stop recording function
    function stopRecording() {
        if (!mediaRecorder || mediaRecorder.state === 'inactive') return;

        // Stop media recorder
        mediaRecorder.stop();

        // Clear countdown interval
        clearInterval(countdownInterval);

        // Update UI
        if (videoRecorderContainer) {
            videoRecorderContainer.classList.remove('recording');
            videoRecorderContainer.classList.add('recorded');
        }
    }

    // Update countdown display
    function updateCountdown() {
        if (videoCountdown) {
            const minutes = Math.floor(recordingTimeLeft / 60);
            const seconds = recordingTimeLeft % 60;
            videoCountdown.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }
    }

    // Save recorded video
    function saveRecordedVideo(blob) {
        // Create video URL from blob
        const videoURL = URL.createObjectURL(blob);

        // Display recorded video for preview
        const recordedVideoPreview = document.getElementById('recorded-video-preview');
        if (recordedVideoPreview) {
            recordedVideoPreview.src = videoURL;
            recordedVideoPreview.controls = true;
        }

        // In a production app, you would upload the video to a server here
        console.log('Video recorded and ready for upload');

        // Add fake upload button functionality for demo
        const uploadButton = document.getElementById('upload-recorded-video');
        if (uploadButton) {
            uploadButton.addEventListener('click', function() {
                // Simulate upload process
                this.disabled = true;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

                // Fake upload delay
                setTimeout(() => {
                    this.innerHTML = '<i class="fas fa-check"></i> Uploaded Successfully';

                    // Show success message
                    const successMessage = document.getElementById('video-upload-success');
                    if (successMessage) {
                        successMessage.style.display = 'block';
                    }

                    // In a real app, we would get the URL from the server response
                    const fakeServerUrl = 'https://example.com/expert-videos/your-video-123.mp4';

                    // Update profile with new video URL
                    updateProfileWithVideo(fakeServerUrl);
                }, 3000);
            });
        }
    }

    // Update expert profile with new video URL
    function updateProfileWithVideo(videoUrl) {
        // In a real app, this would send the video URL to the server
        console.log('Updating profile with video URL:', videoUrl);
    }

    // Initialize event listeners
    if (startRecordingBtn) {
        startRecordingBtn.addEventListener('click', startRecording);
    }

    if (stopRecordingBtn) {
        stopRecordingBtn.addEventListener('click', stopRecording);
    }

    // Start camera on page load
    startCamera();
}

/**
 * Initialize booking actions for expert profiles
 */
function initBookingActions() {
    const bookButton = document.querySelector('.profile-actions .btn-primary');
    if (!bookButton) return;

    bookButton.addEventListener('click', function() {
        const expertName = document.getElementById('expert-name')?.textContent || 'this expert';

        // In a real app, this would open the booking modal
        // For demo, we'll just show an alert
        alert(`Booking a session with ${expertName}. In a real application, a booking calendar would open here.`);
    });
}

/**
 * Initialize share functionality for profiles and case studies
 */
function initShareFunctionality() {
    const shareButton = document.querySelector('.profile-actions .btn-outline:nth-child(3)');
    if (!shareButton) return;

    shareButton.addEventListener('click', function() {
        // In a real app, this would open a share modal with social options
        // For demo, we'll just show an alert
        alert('Share functionality would be implemented here. In a real application, social sharing options would appear.');
    });

    // Init share buttons on case studies if present
    const caseStudyShareButtons = document.querySelectorAll('.case-study-share');
    caseStudyShareButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const caseStudyTitle = this.closest('.case-study-card')?.querySelector('h3')?.textContent || 'this case study';
            alert(`Sharing "${caseStudyTitle}". In a real application, social sharing options would appear.`);
        });
    });
}

/**
 * Initialize carousels for testimonials, case studies, etc.
 */
function initCarousels() {
    const carousels = document.querySelectorAll('.carousel');
    if (!carousels.length) return;

    carousels.forEach(carousel => {
        const container = carousel.querySelector('.carousel-container');
        const prevButton = carousel.querySelector('.carousel-prev');
        const nextButton = carousel.querySelector('.carousel-next');
        const items = carousel.querySelectorAll('.carousel-item');

        if (!container || !items.length) return;

        let currentIndex = 0;
        const itemWidth = items[0].offsetWidth;
        const itemsPerView = Math.floor(container.offsetWidth / itemWidth);
        const maxIndex = Math.max(0, items.length - itemsPerView);

        // Update carousel display
        function updateCarousel() {
            const translateX = -currentIndex * itemWidth;
            container.style.transform = `translateX(${translateX}px)`;

            // Update button states
            if (prevButton) {
                prevButton.disabled = currentIndex === 0;
            }

            if (nextButton) {
                nextButton.disabled = currentIndex >= maxIndex;
            }
        }

        // Initialize carousel
        updateCarousel();

        // Add event listeners to buttons
        if (prevButton) {
            prevButton.addEventListener('click', () => {
                if (currentIndex > 0) {
                    currentIndex--;
                    updateCarousel();
                }
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                if (currentIndex < maxIndex) {
                    currentIndex++;
                    updateCarousel();
                }
            });
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            // Recalculate dimensions and update carousel
            const newItemWidth = items[0].offsetWidth;
            const newItemsPerView = Math.floor(container.offsetWidth / newItemWidth);
            const newMaxIndex = Math.max(0, items.length - newItemsPerView);

            // Adjust currentIndex if needed
            if (currentIndex > newMaxIndex) {
                currentIndex = newMaxIndex;
            }

            // Update carousel with new dimensions
            const translateX = -currentIndex * newItemWidth;
            container.style.transform = `translateX(${translateX}px)`;
        });
    });
}

/**
 * Initialize case studies related modules
 */
function initCaseStudiesModules() {
    // Handle case study tabs in profile if they exist
    const caseStudyTabs = document.querySelectorAll('.case-studies-tabs .tab');
    if (caseStudyTabs.length) {
        caseStudyTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Remove active class from all tabs
                caseStudyTabs.forEach(t => t.classList.remove('active'));

                // Add active class to clicked tab
                this.classList.add('active');

                // Get category to filter
                const category = this.getAttribute('data-category');

                // Filter case studies
                filterCaseStudies(category);
            });
        });
    }

    // Initialize case study cards with hover effects
    const caseStudyCards = document.querySelectorAll('.case-study-card');
    if (caseStudyCards.length) {
        caseStudyCards.forEach(card => {
            // Add hover animations
            card.addEventListener('mouseenter', function() {
                const image = this.querySelector('.case-study-image img');
                if (image) {
                    image.style.transform = 'scale(1.05)';
                }
            });

            card.addEventListener('mouseleave', function() {
                const image = this.querySelector('.case-study-image img');
                if (image) {
                    image.style.transform = 'scale(1)';
                }
            });

            // Add click event to cards
            card.addEventListener('click', function(e) {
                // Don't trigger if clicking on a button or link inside the card
                if (e.target.closest('a, button')) return;

                // Get case study ID and redirect to detail page
                const id = this.getAttribute('data-id');
                if (id) {
                    window.location.href = `case-study-detail.html?id=${id}`;
                }
            });
        });
    }
}

/**
 * Filter case studies by category
 * @param {string} category - Category to filter by, or 'all' for all categories
 */
function filterCaseStudies(category) {
    const caseStudyCards = document.querySelectorAll('.case-study-card');

    if (!caseStudyCards.length) return;

    if (category === 'all') {
        // Show all case studies
        caseStudyCards.forEach(card => {
            card.style.display = 'flex';
        });
    } else {
        // Filter by category
        caseStudyCards.forEach(card => {
            const cardCategory = card.getAttribute('data-category');

            if (cardCategory === category) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }
}
