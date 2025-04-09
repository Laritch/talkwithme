/**
 * Auth Middleware
 * Provides functions to protect routes and elements based on user roles
 */

import auth0Service from '../services/auth0-service.js';

/**
 * Protect a route based on required roles
 * @param {Array|string} requiredRoles - Required roles to access the route
 * @param {string} redirectUrl - URL to redirect if unauthorized (default: /login.html)
 */
export function protectRoute(requiredRoles = [], redirectUrl = '/login.html') {
    // Check if user is authenticated
    if (!auth0Service.isAuthenticated()) {
        // Save current path for redirect after login
        localStorage.setItem('originalPath', window.location.pathname);
        window.location.href = redirectUrl;
        return;
    }

    // If no required roles, allow access
    if (!requiredRoles || (Array.isArray(requiredRoles) && requiredRoles.length === 0)) {
        return;
    }

    // Check if user has required roles
    if (!auth0Service.canAccess(requiredRoles)) {
        // Redirect to unauthorized page or dashboard
        window.location.href = '/unauthorized.html';
    }
}

/**
 * Check if element should be visible based on user roles
 * @param {Element} element - DOM element to check
 * @param {string} attribute - Attribute containing required roles (default: data-required-roles)
 */
export function checkElementVisibility(element, attribute = 'data-required-roles') {
    // Get required roles from attribute
    const requiredRolesAttr = element.getAttribute(attribute);
    if (!requiredRolesAttr) {
        return true; // No roles required, element is visible
    }

    // Parse roles from attribute
    const requiredRoles = requiredRolesAttr.split(',').map(role => role.trim());

    // Check if user has required roles
    return auth0Service.canAccess(requiredRoles);
}

/**
 * Apply element visibility based on user roles for all elements with the specified attribute
 * @param {string} attribute - Attribute containing required roles (default: data-required-roles)
 */
export function applyElementVisibility(attribute = 'data-required-roles') {
    // Get all elements with required roles attribute
    const elements = document.querySelectorAll(`[${attribute}]`);

    // Check visibility for each element
    elements.forEach(element => {
        const isVisible = checkElementVisibility(element, attribute);
        element.style.display = isVisible ? '' : 'none';
    });
}

/**
 * Initialize authorization checking on page load
 */
export function initAuthorization() {
    // Check if current route needs protection
    const routeProtection = document.body.getAttribute('data-protect-route');
    if (routeProtection) {
        const requiredRoles = routeProtection.split(',').map(role => role.trim());
        protectRoute(requiredRoles);
    }

    // Apply element visibility
    applyElementVisibility();

    // Update UI based on authentication state
    updateAuthUI();
}

/**
 * Update UI elements based on authentication state
 */
export function updateAuthUI() {
    const isAuthenticated = auth0Service.isAuthenticated();
    const userProfile = auth0Service.getUserProfile();

    // Get user menu elements
    const loginButtons = document.querySelectorAll('.btn-login-action');
    const logoutButtons = document.querySelectorAll('.btn-logout-action');
    const userMenus = document.querySelectorAll('.user-menu');
    const userNames = document.querySelectorAll('.user-name');
    const userAvatars = document.querySelectorAll('.user-avatar');

    // Update login/logout buttons
    if (loginButtons) {
        loginButtons.forEach(button => {
            button.style.display = isAuthenticated ? 'none' : '';
        });
    }

    if (logoutButtons) {
        logoutButtons.forEach(button => {
            button.style.display = isAuthenticated ? '' : 'none';

            // Add logout event listener if needed
            if (!button.dataset.hasLogoutListener) {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    auth0Service.logout();
                });
                button.dataset.hasLogoutListener = 'true';
            }
        });
    }

    // Update user menus
    if (userMenus) {
        userMenus.forEach(menu => {
            menu.style.display = isAuthenticated ? '' : 'none';
        });
    }

    // Update user names
    if (userNames && userProfile) {
        const displayName = userProfile.name || userProfile.email || 'User';
        userNames.forEach(element => {
            element.textContent = displayName;
        });
    }

    // Update user avatars
    if (userAvatars && userProfile) {
        const avatarUrl = userProfile.picture || '/uploads/default-avatar.png';
        userAvatars.forEach(avatar => {
            if (avatar.tagName === 'IMG') {
                avatar.src = avatarUrl;
                avatar.alt = userProfile.name || 'User';
            } else {
                avatar.style.backgroundImage = `url(${avatarUrl})`;
            }
        });
    }
}

// Listen for auth events
window.addEventListener('auth0:authenticated', () => {
    updateAuthUI();
});

window.addEventListener('auth0:logout', () => {
    updateAuthUI();
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', initAuthorization);

export default {
    protectRoute,
    checkElementVisibility,
    applyElementVisibility,
    initAuthorization,
    updateAuthUI
};
