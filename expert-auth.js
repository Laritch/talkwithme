/**
 * Expert Authentication for Service Marketplace
 * This file handles login, authentication state, and session management for experts
 */

// Handle login form submission
async function handleExpertLogin(event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const loginBtn = document.querySelector('button[type="submit"]');
  const errorMsg = document.getElementById('login-error');
  const verificationStatus = document.getElementById('verification-status');

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

    // For demo purposes, allow any login with expert access
    if (process.env.NODE_ENV === 'development' || true) { // Always use demo mode for now
      // Show different states based on the email's first letter
      const firstChar = email.charAt(0).toLowerCase();
      let mockExpertData;

      if (firstChar === 'p') {
        // Pending expert
        mockExpertData = createMockExpert(email, 'pending');
        // Show verification status
        verificationStatus.textContent = 'Your account is pending verification. You can log in, but some features will be limited until verified.';
        verificationStatus.style.display = 'block';
        // Store expert data
        localStorage.setItem('expertData', JSON.stringify(mockExpertData));
        // Redirect to expert dashboard after a brief delay
        setTimeout(() => {
          window.location.href = '/expert-dashboard.html';
        }, 2000);
        return;
      } else if (firstChar === 'r') {
        // Rejected expert
        mockExpertData = createMockExpert(email, 'rejected');
        // Show rejection message
        verificationStatus.className = 'verification-status rejected';
        verificationStatus.textContent = 'Your verification was not approved. Please check your dashboard for details.';
        verificationStatus.style.display = 'block';
        // Store expert data
        localStorage.setItem('expertData', JSON.stringify(mockExpertData));
        // Redirect to expert dashboard after a brief delay
        setTimeout(() => {
          window.location.href = '/expert-dashboard.html';
        }, 2000);
        return;
      } else {
        // Verified expert
        mockExpertData = createMockExpert(email, 'verified');
        // Store expert data
        localStorage.setItem('expertData', JSON.stringify(mockExpertData));
        // Redirect to expert dashboard immediately
        window.location.href = '/expert-dashboard.html';
        return;
      }
    }

    // In production, this would actually validate credentials with the server
    const response = await fetch('/api/experts/login', {
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

    // Check verification status
    if (data.verificationStatus === 'pending') {
      verificationStatus.textContent = 'Your account is pending verification. You can log in, but some features will be limited until verified.';
      verificationStatus.style.display = 'block';

      // Store expert data in localStorage
      localStorage.setItem('expertData', JSON.stringify(data));

      // Redirect to expert dashboard after a brief delay
      setTimeout(() => {
        window.location.href = '/expert-dashboard.html';
      }, 2000);
    } else if (data.verificationStatus === 'rejected') {
      verificationStatus.className = 'verification-status rejected';
      verificationStatus.textContent = 'Your verification was not approved. Please check your dashboard for details.';
      verificationStatus.style.display = 'block';

      // Store expert data in localStorage
      localStorage.setItem('expertData', JSON.stringify(data));

      // Redirect to expert dashboard after a brief delay
      setTimeout(() => {
        window.location.href = '/expert-dashboard.html';
      }, 2000);
    } else {
      // Verified expert - store data and redirect immediately
      localStorage.setItem('expertData', JSON.stringify(data));
      window.location.href = '/expert-dashboard.html';
    }

  } catch (error) {
    console.error('Login error:', error);
    errorMsg.textContent = error.message || 'Invalid email or password';
    errorMsg.style.display = 'block';

    // Reset button
    loginBtn.disabled = false;
    loginBtn.textContent = 'Login';
  }
}

// Check if expert is logged in
function checkExpertAuth() {
  const expertData = JSON.parse(localStorage.getItem('expertData') || '{}');
  const currentPage = window.location.pathname.split('/').pop();

  // If expert has token, consider them logged in
  if (expertData.token) {
    // If on login page, redirect to dashboard
    if (currentPage === 'expert-login.html') {
      window.location.href = '/expert-dashboard.html';
    }
    return;
  }

  // If no token, redirect to login if trying to access expert pages
  if (currentPage === 'expert-dashboard.html') {
    window.location.href = '/expert-login.html';
  }
}

// Logout function
function expertLogout() {
  localStorage.removeItem('expertData');
  window.location.href = '/expert-login.html';
}

// Helper function to create a mock expert for demo purposes
function createMockExpert(email, verificationStatus = 'verified') {
  const name = email.split('@')[0].replace(/[^a-zA-Z]/g, ' ');
  const formattedName = name.split(' ')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  // Generate random specialization and category
  const categories = ['Nutrition', 'Legal', 'Financial', 'Medical', 'Technical'];
  const specializations = {
    'Nutrition': ['Diet Planning', 'Sports Nutrition', 'Clinical Nutrition'],
    'Legal': ['Family Law', 'Corporate Law', 'Intellectual Property'],
    'Financial': ['Investment Planning', 'Tax Consultation', 'Retirement Planning'],
    'Medical': ['General Practitioner', 'Dermatology', 'Mental Health'],
    'Technical': ['Web Development', 'Cybersecurity', 'Data Science']
  };

  const category = categories[Math.floor(Math.random() * categories.length)];
  const specializationOptions = specializations[category];
  const specialization = specializationOptions[Math.floor(Math.random() * specializationOptions.length)];

  return {
    _id: 'exp-' + Math.random().toString(36).substr(2, 9),
    name: formattedName,
    email: email,
    profilePicture: '/uploads/default-avatar.png',
    category: category,
    specialization: specialization,
    verificationStatus: verificationStatus,
    verificationNotes: verificationStatus === 'rejected'
      ? 'We could not verify your credentials. Please upload additional documentation or provide more information about your qualifications.'
      : '',
    credentials: {
      degree: 'Advanced Degree',
      institution: 'Example University',
      yearsOfExperience: Math.floor(Math.random() * 15) + 2
    },
    rating: {
      average: (Math.random() * 3 + 2).toFixed(1), // Random between 2.0 and 5.0
      count: Math.floor(Math.random() * 50) + 1
    },
    metrics: {
      totalConsultations: Math.floor(Math.random() * 100),
      totalRevenue: Math.floor(Math.random() * 10000),
      completionRate: (Math.random() * 0.4 + 0.6).toFixed(2), // 60% to 100%
      responseTime: Math.floor(Math.random() * 12) + 1  // 1 to 12 hours
    },
    // Token for auth check
    token: 'expert-demo-token-' + Math.random().toString(36).substr(2, 9)
  };
}

// Initialize expert auth checking when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check authentication status
  checkExpertAuth();

  // Add event listener to login form
  const loginForm = document.getElementById('expert-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleExpertLogin);
  }

  // Add event listener to logout buttons
  const logoutButtons = document.querySelectorAll('.logout-btn');
  logoutButtons.forEach(btn => {
    btn.addEventListener('click', expertLogout);
  });
});
