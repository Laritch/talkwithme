/**
 * Expert Profile API Service
 * Handles all backend API calls for expert profiles, videos, posts, and analytics
 */

class ExpertProfileAPI {
    constructor() {
        this.baseURL = process.env.NODE_ENV === 'production'
            ? 'https://api.expertmarketplace.com/v1'
            : 'http://localhost:3000/api';
        this.endpoints = {
            profile: '/experts/profile',
            videos: '/experts/videos',
            posts: '/experts/posts',
            sessions: '/experts/sessions',
            analytics: '/experts/analytics',
            badges: '/experts/badges',
            verification: '/experts/verification',
            reviews: '/experts/reviews',
            featured: '/experts/featured',
            search: '/experts/search',
            categories: '/categories',
            promotions: '/experts/promotions',
            bookings: '/bookings',
            payments: '/payments',
            notifications: '/notifications'
        };
    }

    /**
     * Get the authentication headers for API calls
     * @returns {Object} Headers object with auth token
     */
    getAuthHeaders() {
        const token = localStorage.getItem('expert_token');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }

    /**
     * Make an API request with proper error handling
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} Response data
     */
    async makeRequest(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            const headers = this.getAuthHeaders();

            const response = await fetch(url, {
                headers,
                ...options
            });

            // Handle expired tokens
            if (response.status === 401) {
                // Token expired, refresh or redirect to login
                localStorage.removeItem('expert_token');
                window.location.href = '/login.html?session_expired=true';
                return null;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'An error occurred with the API request');
            }

            return data;
        } catch (error) {
            console.error('API Request Failed:', error);
            throw error;
        }
    }

    /**
     * Get expert profile data
     * @param {string} expertId - Optional expert ID (defaults to logged in expert)
     * @returns {Promise<Object>} Expert profile data
     */
    async getProfile(expertId = null) {
        const endpoint = expertId
            ? `${this.endpoints.profile}/${expertId}`
            : `${this.endpoints.profile}/me`;

        return this.makeRequest(endpoint);
    }

    /**
     * Update expert profile data
     * @param {Object} profileData - New profile data
     * @returns {Promise<Object>} Updated profile
     */
    async updateProfile(profileData) {
        return this.makeRequest(`${this.endpoints.profile}/me`, {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    /**
     * Upload expert video introduction
     * @param {File} videoFile - Video file to upload
     * @param {string} filter - Applied filter
     * @returns {Promise<Object>} Upload result
     */
    async uploadVideo(videoFile, filter = 'none') {
        const formData = new FormData();
        formData.append('video', videoFile);
        formData.append('filter', filter);

        return fetch(`${this.baseURL}${this.endpoints.videos}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': this.getAuthHeaders().Authorization
            },
            body: formData
        }).then(response => {
            if (!response.ok) {
                throw new Error('Video upload failed');
            }
            return response.json();
        });
    }

    /**
     * Create a new expert post
     * @param {Object} postData - Post content and metadata
     * @returns {Promise<Object>} Created post
     */
    async createPost(postData) {
        return this.makeRequest(this.endpoints.posts, {
            method: 'POST',
            body: JSON.stringify(postData)
        });
    }

    /**
     * Get all posts by the expert
     * @param {number} page - Page number
     * @param {number} limit - Results per page
     * @returns {Promise<Object>} Posts with pagination
     */
    async getPosts(page = 1, limit = 10) {
        return this.makeRequest(`${this.endpoints.posts}/me?page=${page}&limit=${limit}`);
    }

    /**
     * Update expert promotion status and tier
     * @param {string} tier - Membership tier (basic, premium, elite)
     * @returns {Promise<Object>} Updated promotion status
     */
    async updatePromotionTier(tier) {
        return this.makeRequest(`${this.endpoints.promotions}/tier`, {
            method: 'PUT',
            body: JSON.stringify({ tier })
        });
    }

    /**
     * Get featured status for expert
     * @returns {Promise<Object>} Featured status
     */
    async getFeaturedStatus() {
        return this.makeRequest(`${this.endpoints.featured}/status`);
    }

    /**
     * Request verification for expert profile
     * @param {Object} verificationData - Documents and credentials
     * @returns {Promise<Object>} Verification request status
     */
    async requestVerification(verificationData) {
        const formData = new FormData();

        // Append documents
        if (verificationData.documents) {
            for (const doc of verificationData.documents) {
                formData.append('documents', doc);
            }
        }

        // Append other verification data
        if (verificationData.credentials) {
            formData.append('credentials', JSON.stringify(verificationData.credentials));
        }

        return fetch(`${this.baseURL}${this.endpoints.verification}/request`, {
            method: 'POST',
            headers: {
                'Authorization': this.getAuthHeaders().Authorization
            },
            body: formData
        }).then(response => {
            if (!response.ok) {
                throw new Error('Verification request failed');
            }
            return response.json();
        });
    }

    /**
     * Get verification status
     * @returns {Promise<Object>} Verification status
     */
    async getVerificationStatus() {
        return this.makeRequest(`${this.endpoints.verification}/status`);
    }

    /**
     * Get all earned badges for the expert
     * @returns {Promise<Array>} List of badges
     */
    async getBadges() {
        return this.makeRequest(this.endpoints.badges);
    }

    /**
     * Claim a new badge
     * @param {string} badgeId - ID of badge to claim
     * @returns {Promise<Object>} Claimed badge
     */
    async claimBadge(badgeId) {
        return this.makeRequest(`${this.endpoints.badges}/claim`, {
            method: 'POST',
            body: JSON.stringify({ badgeId })
        });
    }

    /**
     * Get all client reviews for the expert
     * @param {number} page - Page number
     * @param {number} limit - Results per page
     * @returns {Promise<Object>} Reviews with pagination
     */
    async getReviews(page = 1, limit = 10) {
        return this.makeRequest(`${this.endpoints.reviews}?page=${page}&limit=${limit}`);
    }

    /**
     * Respond to a client review
     * @param {string} reviewId - ID of the review
     * @param {string} response - Expert's response to the review
     * @returns {Promise<Object>} Updated review
     */
    async respondToReview(reviewId, response) {
        return this.makeRequest(`${this.endpoints.reviews}/${reviewId}/respond`, {
            method: 'POST',
            body: JSON.stringify({ response })
        });
    }

    /**
     * Get analytics data for expert performance
     * @param {string} timeframe - Timeframe (week, month, year, all)
     * @returns {Promise<Object>} Analytics data
     */
    async getAnalytics(timeframe = 'month') {
        return this.makeRequest(`${this.endpoints.analytics}?timeframe=${timeframe}`);
    }

    /**
     * Create a new live Q&A session
     * @param {Object} sessionData - Session details
     * @returns {Promise<Object>} Created session
     */
    async createSession(sessionData) {
        return this.makeRequest(this.endpoints.sessions, {
            method: 'POST',
            body: JSON.stringify(sessionData)
        });
    }

    /**
     * Get all upcoming sessions
     * @returns {Promise<Array>} List of upcoming sessions
     */
    async getUpcomingSessions() {
        return this.makeRequest(`${this.endpoints.sessions}/upcoming`);
    }

    /**
     * Get all past sessions
     * @param {number} page - Page number
     * @param {number} limit - Results per page
     * @returns {Promise<Object>} Past sessions with pagination
     */
    async getPastSessions(page = 1, limit = 10) {
        return this.makeRequest(`${this.endpoints.sessions}/past?page=${page}&limit=${limit}`);
    }

    /**
     * Update a session
     * @param {string} sessionId - ID of the session
     * @param {Object} sessionData - New session data
     * @returns {Promise<Object>} Updated session
     */
    async updateSession(sessionId, sessionData) {
        return this.makeRequest(`${this.endpoints.sessions}/${sessionId}`, {
            method: 'PUT',
            body: JSON.stringify(sessionData)
        });
    }

    /**
     * Cancel a session
     * @param {string} sessionId - ID of the session
     * @param {string} reason - Cancellation reason
     * @returns {Promise<Object>} Cancellation result
     */
    async cancelSession(sessionId, reason) {
        return this.makeRequest(`${this.endpoints.sessions}/${sessionId}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
    }

    /**
     * Get all upcoming bookings
     * @returns {Promise<Array>} List of upcoming bookings
     */
    async getUpcomingBookings() {
        return this.makeRequest(`${this.endpoints.bookings}/upcoming`);
    }

    /**
     * Accept a booking
     * @param {string} bookingId - ID of the booking
     * @returns {Promise<Object>} Accepted booking
     */
    async acceptBooking(bookingId) {
        return this.makeRequest(`${this.endpoints.bookings}/${bookingId}/accept`, {
            method: 'POST'
        });
    }

    /**
     * Decline a booking
     * @param {string} bookingId - ID of the booking
     * @param {string} reason - Decline reason
     * @returns {Promise<Object>} Declined booking
     */
    async declineBooking(bookingId, reason) {
        return this.makeRequest(`${this.endpoints.bookings}/${bookingId}/decline`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
    }

    /**
     * Search for experts
     * @param {Object} searchParams - Search parameters
     * @returns {Promise<Object>} Search results with pagination
     */
    async searchExperts(searchParams) {
        const queryString = new URLSearchParams(searchParams).toString();
        return this.makeRequest(`${this.endpoints.search}?${queryString}`);
    }

    /**
     * Get all notifications
     * @param {number} page - Page number
     * @param {number} limit - Results per page
     * @returns {Promise<Object>} Notifications with pagination
     */
    async getNotifications(page = 1, limit = 20) {
        return this.makeRequest(`${this.endpoints.notifications}?page=${page}&limit=${limit}`);
    }

    /**
     * Mark a notification as read
     * @param {string} notificationId - ID of the notification
     * @returns {Promise<Object>} Updated notification
     */
    async markNotificationAsRead(notificationId) {
        return this.makeRequest(`${this.endpoints.notifications}/${notificationId}/read`, {
            method: 'PUT'
        });
    }
}

// Export the API Service
export default new ExpertProfileAPI();
