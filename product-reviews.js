// Product Reviews Module
const ProductReviews = (function() {
  // Private variables
  let productId = null;
  let reviewsContainer = null;
  let reviewForm = null;
  let currentUserReview = null;

  // Initialize the reviews module
  const init = function(options) {
    productId = options.productId;
    reviewsContainer = document.getElementById(options.reviewsContainerId);
    reviewForm = document.getElementById(options.reviewFormId);

    if (!productId || !reviewsContainer) {
      console.error('Product Reviews: Missing required parameters');
      return;
    }

    // Load reviews
    loadReviews();

    // Set up form submission if a form is provided
    if (reviewForm) {
      reviewForm.addEventListener('submit', handleReviewSubmit);

      // Set up star rating
      const ratingInputs = reviewForm.querySelectorAll('input[name="rating"]');
      ratingInputs.forEach(input => {
        input.addEventListener('change', function() {
          document.querySelectorAll('.star-rating label').forEach(label => {
            label.classList.remove('selected');
          });

          for (let i = 1; i <= this.value; i++) {
            document.querySelector(`.star-rating label[for="star${i}"]`).classList.add('selected');
          }
        });
      });
    }
  };

  // Load product reviews
  const loadReviews = async function() {
    try {
      reviewsContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading reviews...</div>';

      const response = await fetch(`/api/reviews/product/${productId}`);

      if (!response.ok) {
        throw new Error('Failed to load reviews');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to load reviews');
      }

      // Check if user is logged in
      const token = localStorage.getItem('token');
      const user = token ? JSON.parse(atob(token.split('.')[1])) : null;

      // Render reviews
      renderReviews(data.reviews, user ? user.id : null);

      // Update average rating display if it exists
      const avgRatingElement = document.getElementById('averageRating');
      if (avgRatingElement) {
        avgRatingElement.textContent = data.rating.average.toFixed(1);
      }

      const reviewCountElement = document.getElementById('reviewCount');
      if (reviewCountElement) {
        reviewCountElement.textContent = data.rating.count;
      }

      // If user has already reviewed, show their review in the form
      if (user && reviewForm) {
        const userReview = data.reviews.find(review => review.userId === user.id);
        if (userReview) {
          currentUserReview = userReview;
          populateReviewForm(userReview);
        }
      }

    } catch (error) {
      console.error('Error loading reviews:', error);
      reviewsContainer.innerHTML = '<div class="error">Failed to load reviews. Please try again later.</div>';
    }
  };

  // Render reviews in the container
  const renderReviews = function(reviews, currentUserId) {
    if (!reviews || reviews.length === 0) {
      reviewsContainer.innerHTML = '<div class="no-reviews">No reviews yet. Be the first to leave a review!</div>';
      return;
    }

    // Sort reviews - newest first
    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const reviewsHTML = reviews.map(review => {
      const date = new Date(review.createdAt).toLocaleDateString();
      const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
      const isCurrentUserReview = currentUserId && review.userId === currentUserId;

      return `
        <div class="review-item ${isCurrentUserReview ? 'user-review' : ''}">
          <div class="review-header">
            <div class="reviewer-info">
              <div class="reviewer-name">${review.name || 'User'}</div>
              <div class="review-date">${date}</div>
            </div>
            <div class="review-rating">${stars}</div>
          </div>
          <div class="review-content">${review.review || 'No written review provided.'}</div>
          ${isCurrentUserReview ? `
            <div class="review-actions">
              <button class="edit-review-btn" data-review-id="${review._id}">Edit</button>
              <button class="delete-review-btn" data-review-id="${review._id}">Delete</button>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    reviewsContainer.innerHTML = reviewsHTML;

    // Add event listeners for edit and delete buttons
    const editButtons = reviewsContainer.querySelectorAll('.edit-review-btn');
    const deleteButtons = reviewsContainer.querySelectorAll('.delete-review-btn');

    editButtons.forEach(button => {
      button.addEventListener('click', function() {
        const reviewId = this.dataset.reviewId;

        // Review should already be in the form if this is the current user's review
        if (currentUserReview && currentUserReview._id === reviewId) {
          // Scroll to the form
          reviewForm.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    deleteButtons.forEach(button => {
      button.addEventListener('click', async function() {
        if (!confirm('Are you sure you want to delete your review?')) {
          return;
        }

        const reviewId = this.dataset.reviewId;
        await deleteReview(reviewId);
      });
    });
  };

  // Populate the review form with existing review data
  const populateReviewForm = function(review) {
    // Set rating
    const ratingInput = reviewForm.querySelector(`input[name="rating"][value="${review.rating}"]`);
    if (ratingInput) {
      ratingInput.checked = true;

      // Update star styling
      document.querySelectorAll('.star-rating label').forEach(label => {
        label.classList.remove('selected');
      });

      for (let i = 1; i <= review.rating; i++) {
        const label = document.querySelector(`.star-rating label[for="star${i}"]`);
        if (label) {
          label.classList.add('selected');
        }
      }
    }

    // Set review text
    const reviewTextarea = reviewForm.querySelector('textarea[name="review"]');
    if (reviewTextarea) {
      reviewTextarea.value = review.review || '';
    }

    // Update form submit button
    const submitButton = reviewForm.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.textContent = 'Update Review';
    }

    // Add hidden input for review ID
    let reviewIdInput = reviewForm.querySelector('input[name="reviewId"]');
    if (!reviewIdInput) {
      reviewIdInput = document.createElement('input');
      reviewIdInput.type = 'hidden';
      reviewIdInput.name = 'reviewId';
      reviewForm.appendChild(reviewIdInput);
    }

    reviewIdInput.value = review._id;
  };

  // Handle review form submission
  const handleReviewSubmit = async function(event) {
    event.preventDefault();

    const submitButton = reviewForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to leave a review');
        window.location.href = '/login.html';
        return;
      }

      const formData = new FormData(reviewForm);
      const rating = formData.get('rating');
      const review = formData.get('review');
      const reviewId = formData.get('reviewId');

      if (!rating) {
        throw new Error('Please select a rating');
      }

      // Determine if this is a new review or an update
      if (reviewId) {
        // Update existing review
        await updateReview(reviewId, {
          productId,
          rating,
          review
        });
      } else {
        // Create new review
        await createReview({
          productId,
          rating,
          review
        });
      }

      // Reload reviews
      await loadReviews();

      // Reset form if it was a new review
      if (!reviewId) {
        reviewForm.reset();
      }

    } catch (error) {
      alert(error.message || 'Failed to submit review. Please try again.');
      console.error('Error submitting review:', error);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  };

  // Create a new review
  const createReview = async function(reviewData) {
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(reviewData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create review');
    }

    return await response.json();
  };

  // Update an existing review
  const updateReview = async function(reviewId, reviewData) {
    const response = await fetch(`/api/reviews/${reviewId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(reviewData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update review');
    }

    return await response.json();
  };

  // Delete a review
  const deleteReview = async function(reviewId) {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ productId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete review');
      }

      // Reload reviews
      await loadReviews();

      // Reset form
      if (reviewForm) {
        reviewForm.reset();
        const submitButton = reviewForm.querySelector('button[type="submit"]');
        if (submitButton) {
          submitButton.textContent = 'Submit Review';
        }

        // Remove review ID input
        const reviewIdInput = reviewForm.querySelector('input[name="reviewId"]');
        if (reviewIdInput) {
          reviewIdInput.remove();
        }

        // Reset star rating
        document.querySelectorAll('.star-rating label').forEach(label => {
          label.classList.remove('selected');
        });
      }

      currentUserReview = null;

    } catch (error) {
      alert(error.message || 'Failed to delete review. Please try again.');
      console.error('Error deleting review:', error);
    }
  };

  // Public API
  return {
    init: init,
    loadReviews: loadReviews
  };
})();

// Export the module
window.ProductReviews = ProductReviews;
