/**
 * Auth0 Authentication Service
 * This service handles user authentication using Auth0 for all user types
 * (admins, experts, clients, and other roles)
 */

class Auth0Service {
    constructor() {
        // Auth0 configuration
        this.domain = 'your-auth0-domain.auth0.com'; // Replace with your Auth0 domain
        this.clientId = 'your-client-id'; // Replace with your Auth0 client ID
        this.audience = 'https://api.expertplatform.com'; // API identifier (if applicable)
        this.redirectUri = window.location.origin + '/callback.html';
        this.logoutRedirectUri = window.location.origin;
        this.scope = 'openid profile email';

        // User role constants
        this.ROLES = {
            ADMIN: 'admin',
            EXPERT: 'expert',
            CLIENT: 'client',
            MANAGER: 'manager',
            SUPPORT: 'support'
        };

        // Dashboard paths by role
        this.DASHBOARDS = {
            [this.ROLES.ADMIN]: '/admin-dashboard.html',
            [this.ROLES.EXPERT]: '/expert-dashboard.html',
            [this.ROLES.CLIENT]: '/client-dashboard.html',
            [this.ROLES.MANAGER]: '/manager-dashboard.html',
            [this.ROLES.SUPPORT]: '/support-dashboard.html'
        };

        // Default dashboard (fallback)
        this.DEFAULT_DASHBOARD = '/dashboard.html';

        // User session
        this.accessToken = null;
        this.idToken = null;
        this.expiresAt = null;
        this.userProfile = null;
        this.userRoles = [];

        // Initialize Auth0 client when the script loads
        this.initAuth0();
    }

    /**
     * Initialize Auth0 client library
     */
    async initAuth0() {
        // Load Auth0 client library dynamically
        if (!window.auth0) {
            await this.loadAuth0Script();
        }

        // Create Auth0 client
        this.auth0Client = new window.auth0.WebAuth({
            domain: this.domain,
            clientID: this.clientId,
            audience: this.audience,
            redirectUri: this.redirectUri,
            responseType: 'token id_token',
            scope: this.scope
        });

        // Try to restore session on page load
        this.restoreSession();
    }

    /**
     * Load Auth0 client library dynamically
     */
    loadAuth0Script() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.auth0.com/js/auth0/9.19.0/auth0.min.js';
            script.async = true;

            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Auth0 SDK'));

            document.head.appendChild(script);
        });
    }

    /**
     * Restore user session from local storage
     */
    restoreSession() {
        // Check for tokens in URL hash after redirect from Auth0
        if (window.location.hash && window.location.hash.includes('access_token')) {
            this.handleAuthentication();
            return;
        }

        // Otherwise, try to load from localStorage
        this.accessToken = localStorage.getItem('accessToken');
        this.idToken = localStorage.getItem('idToken');
        this.expiresAt = parseInt(localStorage.getItem('expiresAt') || '0', 10);

        // Check if the token is still valid
        if (this.isAuthenticated()) {
            // Load user profile
            const userProfile = localStorage.getItem('userProfile');
            if (userProfile) {
                this.userProfile = JSON.parse(userProfile);
                this.extractUserRoles();
            }

            // Dispatch authenticated event
            this.dispatchAuthEvent('authenticated', {
                isAuthenticated: true,
                userProfile: this.userProfile,
                userRoles: this.userRoles
            });
        } else {
            // Clear invalid session
            this.clearSession();
        }
    }

    /**
     * Extract user roles from profile
     */
    extractUserRoles() {
        // Check both standard and custom namespaced locations for roles
        // This depends on how your Auth0 is configured
        if (!this.userProfile) return;

        // Try to get roles from namespace (Auth0 Rules/Actions recommended approach)
        const roleClaim = this.userProfile[`https://expertplatform.com/roles`];
        if (roleClaim && Array.isArray(roleClaim)) {
            this.userRoles = roleClaim;
        }
        // Fallback to app_metadata if roles are stored there
        else if (
            this.userProfile.app_metadata &&
            this.userProfile.app_metadata.roles &&
            Array.isArray(this.userProfile.app_metadata.roles)
        ) {
            this.userRoles = this.userProfile.app_metadata.roles;
        }
        // Default role based on user_metadata if no roles found
        else if (this.userProfile.user_metadata && this.userProfile.user_metadata.account_type) {
            const accountType = this.userProfile.user_metadata.account_type.toLowerCase();
            if (Object.values(this.ROLES).includes(accountType)) {
                this.userRoles = [accountType];
            }
        }
        // If still no roles are found, default to lowest privilege role
        else {
            this.userRoles = [this.ROLES.CLIENT];
        }
    }

    /**
     * Handle authentication response after Auth0 redirect
     */
    handleAuthentication() {
        this.auth0Client.parseHash((err, authResult) => {
            if (err) {
                console.error('Authentication error:', err);
                this.dispatchAuthEvent('authentication_error', { error: err });
                return;
            }

            if (authResult && authResult.accessToken && authResult.idToken) {
                this.setSession(authResult);

                // Remove the hash fragment
                window.location.hash = '';

                // Get the original path or use the default dashboard path
                const originalPath = localStorage.getItem('originalPath');
                localStorage.removeItem('originalPath');

                // If user was trying to access a specific page, redirect there
                // otherwise, redirect to role-specific dashboard
                if (originalPath && originalPath !== '/' && originalPath !== '/login.html' && originalPath !== '/signup.html') {
                    if (window.history.pushState) {
                        window.history.pushState({}, document.title, window.location.pathname);
                        window.location.href = originalPath;
                    } else {
                        window.location.href = originalPath;
                    }
                } else {
                    // Redirect to appropriate dashboard based on user role
                    // This will happen after the profile is loaded
                }
            }
        });
    }

    /**
     * Save authentication data and user profile
     * @param {Object} authResult - Auth0 authentication result
     */
    setSession(authResult) {
        // Calculate expires time
        const expiresAt = (authResult.expiresIn * 1000) + Date.now();

        // Save tokens
        this.accessToken = authResult.accessToken;
        this.idToken = authResult.idToken;
        this.expiresAt = expiresAt;

        // Save to localStorage
        localStorage.setItem('accessToken', this.accessToken);
        localStorage.setItem('idToken', this.idToken);
        localStorage.setItem('expiresAt', this.expiresAt.toString());

        // Get user profile
        this.getUserInfo(authResult.accessToken);
    }

    /**
     * Get user profile information
     * @param {string} accessToken - Access token
     */
    getUserInfo(accessToken) {
        this.auth0Client.client.userInfo(accessToken, (err, profile) => {
            if (err) {
                console.error('Error getting user profile:', err);
                return;
            }

            this.userProfile = profile;

            // Extract user roles
            this.extractUserRoles();

            // Save user profile to localStorage
            localStorage.setItem('userProfile', JSON.stringify(profile));

            // Dispatch authenticated event
            this.dispatchAuthEvent('authenticated', {
                isAuthenticated: true,
                userProfile: profile,
                userRoles: this.userRoles
            });

            // Redirect to appropriate dashboard based on user role if on callback page
            if (window.location.pathname === '/callback.html') {
                this.redirectToDashboard();
            }
        });
    }

    /**
     * Redirect user to appropriate dashboard based on role
     */
    redirectToDashboard() {
        let targetDashboard = this.DEFAULT_DASHBOARD;

        // Find the highest privilege role
        // Priority: admin > manager > expert > client
        if (this.hasRole(this.ROLES.ADMIN)) {
            targetDashboard = this.DASHBOARDS[this.ROLES.ADMIN];
        } else if (this.hasRole(this.ROLES.MANAGER)) {
            targetDashboard = this.DASHBOARDS[this.ROLES.MANAGER];
        } else if (this.hasRole(this.ROLES.EXPERT)) {
            targetDashboard = this.DASHBOARDS[this.ROLES.EXPERT];
        } else if (this.hasRole(this.ROLES.CLIENT)) {
            targetDashboard = this.DASHBOARDS[this.ROLES.CLIENT];
        } else if (this.hasRole(this.ROLES.SUPPORT)) {
            targetDashboard = this.DASHBOARDS[this.ROLES.SUPPORT];
        }

        // Redirect to the dashboard
        window.location.href = targetDashboard;
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} Authentication status
     */
    isAuthenticated() {
        // Check token expiration
        return this.accessToken && this.idToken && Date.now() < this.expiresAt;
    }

    /**
     * Login with Auth0
     * @param {Object} options - Login options (optional)
     */
    login(options = {}) {
        // Save current path to redirect back after login
        localStorage.setItem('originalPath', window.location.pathname);

        // Start Auth0 login flow
        this.auth0Client.authorize(options);
    }

    /**
     * Login with username and password
     * @param {string} username - User email
     * @param {string} password - User password
     * @returns {Promise} Login promise
     */
    loginWithCredentials(username, password) {
        return new Promise((resolve, reject) => {
            this.auth0Client.login({
                realm: 'Username-Password-Authentication', // Auth0 default database connection
                username,
                password
            }, (err, authResult) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(authResult);
            });
        });
    }

    /**
     * Sign up a new user
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {Object} metadata - Additional user metadata
     * @param {string} role - User role (client, expert, etc.)
     * @returns {Promise} Signup promise
     */
    signup(email, password, metadata = {}, role = this.ROLES.CLIENT) {
        // Add role to metadata if not provided
        if (!metadata.account_type) {
            metadata.account_type = role;
        }

        return new Promise((resolve, reject) => {
            this.auth0Client.signup({
                email,
                password,
                connection: 'Username-Password-Authentication', // Auth0 default database connection
                user_metadata: metadata
            }, (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }

                // If auto-login after signup
                if (result.autoLogin === false) {
                    resolve(result);
                } else {
                    // Try to login with the new credentials
                    this.loginWithCredentials(email, password)
                        .then(resolve)
                        .catch(reject);
                }
            });
        });
    }

    /**
     * Reset password - send password reset email
     * @param {string} email - User email
     * @returns {Promise} Reset password promise
     */
    resetPassword(email) {
        return new Promise((resolve, reject) => {
            this.auth0Client.changePassword({
                email: email,
                connection: 'Username-Password-Authentication' // Auth0 default database connection
            }, (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(result);
            });
        });
    }

    /**
     * Log out user
     * @param {string} redirectUri - Optional redirect URI after logout
     */
    logout(redirectUri = null) {
        // Clear session data
        this.clearSession();

        // Use provided redirectUri or default
        const returnTo = redirectUri || this.logoutRedirectUri;

        // Redirect to Auth0 logout endpoint to completely log out
        window.location.href = `https://${this.domain}/v2/logout?client_id=${this.clientId}&returnTo=${encodeURIComponent(returnTo)}`;
    }

    /**
     * Clear user session data
     */
    clearSession() {
        // Clear tokens
        this.accessToken = null;
        this.idToken = null;
        this.expiresAt = null;
        this.userProfile = null;
        this.userRoles = [];

        // Clear localStorage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('idToken');
        localStorage.removeItem('expiresAt');
        localStorage.removeItem('userProfile');

        // Dispatch logout event
        this.dispatchAuthEvent('logout', { isAuthenticated: false });
    }

    /**
     * Get access token for API requests
     * @returns {string} Access token
     */
    getAccessToken() {
        if (!this.isAuthenticated()) {
            return null;
        }

        return this.accessToken;
    }

    /**
     * Get ID token for authentication
     * @returns {string} ID token
     */
    getIdToken() {
        if (!this.isAuthenticated()) {
            return null;
        }

        return this.idToken;
    }

    /**
     * Get user profile
     * @returns {Object} User profile
     */
    getUserProfile() {
        return this.userProfile;
    }

    /**
     * Get user roles
     * @returns {Array} User roles
     */
    getUserRoles() {
        return this.userRoles;
    }

    /**
     * Check if user has a specific role
     * @param {string} role - Role to check
     * @returns {boolean} Has role
     */
    hasRole(role) {
        return this.userRoles.includes(role);
    }

    /**
     * Check if user has any of the specified roles
     * @param {Array} roles - Roles to check
     * @returns {boolean} Has any of the roles
     */
    hasAnyRole(roles) {
        return this.userRoles.some(role => roles.includes(role));
    }

    /**
     * Check if user has all of the specified roles
     * @param {Array} roles - Roles to check
     * @returns {boolean} Has all of the roles
     */
    hasAllRoles(roles) {
        return roles.every(role => this.userRoles.includes(role));
    }

    /**
     * Check if user can access a resource based on required roles
     * @param {Array|string} requiredRoles - Required roles for access
     * @returns {boolean} Can access
     */
    canAccess(requiredRoles) {
        // If no required roles, allow access
        if (!requiredRoles || (Array.isArray(requiredRoles) && requiredRoles.length === 0)) {
            return true;
        }

        // Convert string to array if needed
        const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

        // Admin has access to everything
        if (this.hasRole(this.ROLES.ADMIN)) {
            return true;
        }

        // Check if user has any of the required roles
        return this.hasAnyRole(roles);
    }

    /**
     * Dispatch authentication event
     * @param {string} eventName - Event name
     * @param {Object} data - Event data
     */
    dispatchAuthEvent(eventName, data) {
        const event = new CustomEvent(`auth0:${eventName}`, { detail: data });
        window.dispatchEvent(event);
    }
}

// Create singleton instance
const auth0Service = new Auth0Service();

export default auth0Service;
