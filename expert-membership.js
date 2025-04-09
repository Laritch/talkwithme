/**
 * Expert Membership Management for Service Marketplace
 * This file handles the tiered membership features and commission calculations
 */

// Constants for membership tiers
const MEMBERSHIP_TIERS = {
    basic: {
        name: 'Basic Tier',
        price: 0,
        commissionRate: 0.18,
        features: [
            'Standard search placement',
            'Basic profile customization',
            'Limited analytics dashboard',
            'Secure payment processing',
            'Client messaging system'
        ]
    },
    premium: {
        name: 'Premium Tier',
        price: 89,
        commissionRate: 0.12,
        features: [
            'Priority search placement',
            'Enhanced profile with portfolio',
            'Comprehensive analytics',
            'Secure payment processing',
            'Client messaging system',
            'Special promotions & discounts',
            'Client retention tools'
        ]
    },
    elite: {
        name: 'Elite Tier',
        price: 179,
        commissionRate: 0.08,
        features: [
            'Featured expert status',
            'Verified Expert badge',
            'Premium analytics with insights',
            'Secure payment processing',
            'Client messaging system',
            'Special promotions & discounts',
            'Early access to new features',
            'Dedicated support line'
        ]
    }
};

// Client loyalty tiers
const LOYALTY_TIERS = [
    { threshold: 0, commissionReduction: 0 },
    { threshold: 10, commissionReduction: 0.02 },
    { threshold: 25, commissionReduction: 0.04 },
    { threshold: 50, commissionReduction: 0.05 }
];

// State management for the membership page
const membershipState = {
    expertData: null,
    currentTier: 'basic',
    clients: [],
    calculatorValues: {
        tier: 'basic',
        monthlyRevenue: 5000,
        transactionCount: 20
    }
};

// Initialize the membership page
function initMembershipPage() {
    // Get expert data from localStorage
    const expertData = JSON.parse(localStorage.getItem('expertData') || '{}');
    if (!expertData.token) {
        // Redirect to login if not logged in
        window.location.href = '/expert-login.html';
        return;
    }

    // Store expert data
    membershipState.expertData = expertData;
    membershipState.currentTier = expertData.membershipTier || 'basic';

    // Set up the page
    setupCurrentMembershipInfo();
    setupCalculator();
    setupEventListeners();

    // Mock client data for loyalty display
    generateMockClients();
}

// Set up the current membership information
function setupCurrentMembershipInfo() {
    const tier = MEMBERSHIP_TIERS[membershipState.currentTier];
    const infoEl = document.getElementById('current-membership-info');

    // Get today's date and format it
    const today = new Date();
    const renewalDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 8);
    const formattedDate = renewalDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const html = `
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;">
            <div>
                <h3 style="margin-top: 0; color: #3498db;">${tier.name}</h3>
                <p>Your current commission rate: <strong>${tier.commissionRate * 100}%</strong></p>
                <p>Membership renewed on: <strong>${formattedDate}</strong></p>
            </div>
            <div>
                ${membershipState.currentTier === 'elite' ?
                    '<button class="btn" disabled>Highest Tier</button>' :
                    '<button class="btn btn-success" id="upgrade-btn">Upgrade Membership</button>'}
            </div>
        </div>
    `;

    infoEl.innerHTML = html;

    // Highlight current tier in the tiers comparison section
    document.querySelectorAll('.pricing-tier').forEach((tierEl, index) => {
        const tierCtaBtn = tierEl.querySelector('.tier-cta .btn');

        if (index === Object.keys(MEMBERSHIP_TIERS).indexOf(membershipState.currentTier)) {
            tierCtaBtn.classList.add('btn-outline');
            tierCtaBtn.textContent = 'Current Plan';
            tierCtaBtn.disabled = true;
        }
    });
}

// Set up the calculator
function setupCalculator() {
    const tierSelect = document.getElementById('membership-tier');
    const revenueInput = document.getElementById('monthly-revenue');
    const transactionInput = document.getElementById('transaction-count');

    // Set initial values
    tierSelect.value = membershipState.calculatorValues.tier;
    revenueInput.value = membershipState.calculatorValues.monthlyRevenue;
    transactionInput.value = membershipState.calculatorValues.transactionCount;

    // Calculate initial values
    updateCalculatorResults();
}

// Update calculator results based on inputs
function updateCalculatorResults() {
    const { tier, monthlyRevenue, transactionCount } = membershipState.calculatorValues;
    const tierData = MEMBERSHIP_TIERS[tier];

    // Calculate values
    const grossRevenue = monthlyRevenue;
    const platformCommission = grossRevenue * tierData.commissionRate;
    const membershipFee = tierData.price;
    const totalFees = platformCommission + membershipFee;
    const expertReceives = grossRevenue - platformCommission - membershipFee;

    // Update the UI
    document.getElementById('gross-revenue').textContent = formatCurrency(grossRevenue);
    document.getElementById('platform-commission').textContent = formatCurrency(platformCommission);
    document.getElementById('membership-fee').textContent = formatCurrency(membershipFee);
    document.getElementById('total-fees').textContent = formatCurrency(totalFees);
    document.getElementById('expert-receives').textContent = formatCurrency(expertReceives);
}

// Generate mock client data for loyalty display
function generateMockClients() {
    // Mock data is already in the HTML, but we could generate it dynamically here
    // This function is a placeholder for real client data integration
}

// Set up event listeners
function setupEventListeners() {
    // Upgrade button
    const upgradeBtn = document.getElementById('upgrade-btn');
    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', function() {
            // Smooth scroll to membership tiers section
            const tiersSection = document.querySelector('.pricing-container');
            tiersSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Tier upgrade buttons
    document.querySelectorAll('.pricing-tier .tier-cta .btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', function() {
            const tierEl = this.closest('.pricing-tier');
            const tierIndex = Array.from(document.querySelectorAll('.pricing-tier')).indexOf(tierEl);
            const tierKey = Object.keys(MEMBERSHIP_TIERS)[tierIndex];

            if (tierKey === membershipState.currentTier) return;

            // Show confirmation dialog
            if (confirm(`Are you sure you want to upgrade to ${MEMBERSHIP_TIERS[tierKey].name}?`)) {
                upgradeMembership(tierKey);
            }
        });
    });

    // Calculator inputs
    document.getElementById('membership-tier').addEventListener('change', function() {
        membershipState.calculatorValues.tier = this.value;
        updateCalculatorResults();
    });

    document.getElementById('monthly-revenue').addEventListener('input', function() {
        membershipState.calculatorValues.monthlyRevenue = parseFloat(this.value) || 0;
        updateCalculatorResults();
    });

    document.getElementById('transaction-count').addEventListener('input', function() {
        membershipState.calculatorValues.transactionCount = parseInt(this.value) || 0;
        updateCalculatorResults();
    });
}

// Upgrade membership tier
function upgradeMembership(newTier) {
    // In a real app, this would make an API call

    // Update local state
    membershipState.currentTier = newTier;

    // Update expert data in localStorage
    const expertData = membershipState.expertData;
    expertData.membershipTier = newTier;
    localStorage.setItem('expertData', JSON.stringify(expertData));

    // Update UI
    setupCurrentMembershipInfo();

    // Show success message
    showNotification(`Congratulations! You've upgraded to ${MEMBERSHIP_TIERS[newTier].name}`, 'success');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = type === 'success' ? '#2ecc71' : '#3498db';
    notification.style.color = 'white';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '5px';
    notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    notification.style.zIndex = '1000';
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    notification.style.transition = 'opacity 0.3s, transform 0.3s';

    // Set icon based on type
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';

    notification.innerHTML = `
        <i class="fas ${icon}" style="margin-right: 10px;"></i>
        ${message}
    `;

    // Add to document
    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);

    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Format currency
function formatCurrency(amount) {
    return '$' + amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', initMembershipPage);
