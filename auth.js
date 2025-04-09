/**
 * Authentication functions for the Enhanced Chat System
 */

// Handle login form submission
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const loginBtn = document.querySelector('button[type="submit"]');
  const errorMsg = document.getElementById('login-error');

  // Basic validation
  if (!email || !password) {
    errorMsg.textContent = 'Email and password are required';
    errorMsg.style.display = 'block';
    return;
  }

  try {
    // Show loading state
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

    // For demo purposes, allow any login with admin access
    if (process.env.NODE_ENV === 'development' || true) { // Always use demo mode
      // Check for admin login from README
      const isAdmin = email === 'admin@chat.com' && password === 'admin123';

      const demoUserData = {
        _id: '12345',
        username: isAdmin ? 'admin' : email.split('@')[0],
        email: email,
        isAdmin: isAdmin,
        status: 'online',
        profilePicture: '/uploads/default-avatar.png',
        token: 'demo-token-123456789',
        role: isAdmin ? 'admin' : 'client',
        lastLogin: new Date().toISOString()
      };

      // Store user data in localStorage
      localStorage.setItem('userData', JSON.stringify(demoUserData));

      // Get redirect URL from query parameter if available
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get('redirect') || (isAdmin ? 'admin-dashboard.html' : 'client-dashboard.html');

      // Redirect to appropriate page
      window.location.href = redirectUrl;
      return;
    }

    // In production, this would actually validate credentials with the server
    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // Store user data in localStorage
    localStorage.setItem('userData', JSON.stringify(data));

    // Get redirect URL from query parameter if available
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect') || (data.isAdmin ? 'admin-dashboard.html' : 'client-dashboard.html');

    // Redirect to appropriate page
    window.location.href = redirectUrl;

  } catch (error) {
    console.error('Login error:', error);
    errorMsg.textContent = error.message || 'Invalid email or password';
    errorMsg.style.display = 'block';

    // Reset button
    loginBtn.disabled = false;
    loginBtn.textContent = 'Login';
  }
}

// Check if user is logged in
function checkAuth() {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  // List of pages that don't require authentication
  const publicPages = ['login.html', 'reset-password.html', 'index.html'];

  // For demo purposes, consider the user logged in if they've used the demo login
  const isLoggedIn = userData.token === 'demo-token-123456789';

  // If user is logged in and tries to access login page, redirect them to appropriate dashboard
  if (isLoggedIn && publicPages.includes(currentPage)) {
    if (currentPage === 'login.html') {
      window.location.href = userData.isAdmin ? 'admin-dashboard.html' : 'client-dashboard.html';
    }
    return true;
  }

  // If user is not logged in and tries to access a protected page
  if (!isLoggedIn && !publicPages.includes(currentPage)) {
    // Redirect to login page with the current page as redirect parameter
    window.location.href = `login.html?redirect=${currentPage}`;
    return false;
  }

  return isLoggedIn;
}

// Check if user is logged in and return boolean
function isLoggedIn() {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  return userData.token === 'demo-token-123456789';
}

// Get current user data
function getCurrentUser() {
  return JSON.parse(localStorage.getItem('userData') || '{}');
}

// Logout function
function logout() {
  localStorage.removeItem('userData');
  window.location.href = '/login.html';
}

// Initialize auth checking when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check authentication status
  checkAuth();

  // Add event listener to login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Add event listener to logout buttons
  const logoutButtons = document.querySelectorAll('.logout-btn');
  logoutButtons.forEach(btn => {
    btn.addEventListener('click', logout);
  });

  // Update UI based on login status
  updateAuthUI();
});

// Update UI elements based on authentication status
function updateAuthUI() {
  const isUserLoggedIn = isLoggedIn();
  const userData = getCurrentUser();

  // Update login/profile links
  const loginLink = document.querySelector('.login-link');
  const profileLink = document.querySelector('.profile-link');

  if (loginLink && profileLink) {
    if (isUserLoggedIn) {
      loginLink.classList.add('hidden');
      profileLink.classList.remove('hidden');

      // Update profile information
      const usernameElement = profileLink.querySelector('.username');
      const profileImage = profileLink.querySelector('.nav-profile-image');

      if (usernameElement) {
        usernameElement.textContent = userData.username || 'User';
      }

      if (profileImage && userData.profilePicture) {
        profileImage.src = userData.profilePicture;
      }
    } else {
      loginLink.classList.remove('hidden');
      profileLink.classList.add('hidden');
    }
  }

  // Update cart count if cart exists in localStorage
  const cartCountElement = document.querySelector('.cart-count');
  if (cartCountElement) {
    const cartData = JSON.parse(localStorage.getItem('cartData') || '{"items":[]}');
    cartCountElement.textContent = cartData.items.length;
  }
}
