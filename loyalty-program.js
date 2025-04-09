/**
 * Loyalty Program JavaScript
 */

// DOM Elements
const loyaltyCard = document.querySelector('.loyalty-card');
const userTierElement = document.querySelector('.user-tier');
const tierBadgeIcon = document.querySelector('.tier-badge i');
const pointsValueElement = document.querySelector('.points-value');
const nextTierElement = document.querySelector('.next-tier-info');
const progressBarElement = document.querySelector('.progress-bar');
const progressPercentageElement = document.querySelector('.progress-percentage');
const purchaseCountElement = document.querySelector('.purchase-count');
const totalSpentElement = document.querySelector('.total-spent');
const totalPointsEarnedElement = document.querySelector('.total-points-earned');
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const availableRewardsList = document.querySelector('.rewards-list');
const noRewardsMessage = document.querySelector('.no-rewards-message');
const redeemOptionsContainer = document.querySelector('.redeem-options');
const historyLimitSelect = document.getElementById('history-limit');
const transactionHistoryBody = document.querySelector('.history-table tbody');
const noHistoryMessage = document.querySelector('.no-history-message');
const referralCodeElement = document.querySelector('.referral-code');
const referralLinkElement = document.querySelector('.referral-link');
const copyButtons = document.querySelectorAll('.copy-button');
const referralCountElement = document.querySelector('.referral-count');
const referralPointsElement = document.querySelector('.referral-points');
const tierCardsContainer = document.querySelector('.tier-cards-container');

// State
let loyaltyData = null;
let currentPoints = 0;
let allTiers = [];
let userRewards = [];
let pointsHistory = [];

/**
 * Initialize the loyalty program page
 */
const initLoyaltyProgram = async () => {
  // Check if user is logged in
  if (!isLoggedIn()) {
    window.location.href = 'login.html?redirect=loyalty-program.html';
    return;
  }

  // Show loading
  showLoadingSpinner();

  try {
    // Fetch loyalty profile data
    await fetchLoyaltyProfile();

    // Fetch loyalty tiers
    await fetchLoyaltyTiers();

    // Initialize tabs
    initTabs();

    // Fetch initial transaction history
    await fetchTransactionHistory();

    // Fetch referral code
    await fetchReferralCode();

    // Add event listeners
    addEventListeners();

  } catch (error) {
    console.error('Error initializing loyalty program:', error);
    showToast('Error loading loyalty program data. Please try again later.', 'error');
  } finally {
    // Hide loading
    hideLoadingSpinner();
  }
};

/**
 * Fetch user's loyalty profile
 */
const fetchLoyaltyProfile = async () => {
  try {
    const response = await fetch('/api/loyalty/profile', {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch loyalty profile');
    }

    loyaltyData = await response.json();
    updateLoyaltyUI(loyaltyData);

    // Fetch rewards if any
    if (loyaltyData.loyalty.rewardsCount > 0) {
      await fetchUserRewards();
    } else {
      renderNoRewards();
    }

    // Update redeem options
    renderRedeemOptions(loyaltyData.upcomingRewards);

    return loyaltyData;
  } catch (error) {
    console.error('Error fetching loyalty profile:', error);
    showToast('Error fetching loyalty profile. Please try again later.', 'error');
  }
};

/**
 * Update UI with loyalty data
 */
const updateLoyaltyUI = (data) => {
  const { currentTier, nextTier, loyalty, progress } = data;

  // Update loyalty card
  userTierElement.textContent = currentTier.name;
  pointsValueElement.textContent = loyalty.points.toLocaleString();

  // Set tier badge icon
  tierBadgeIcon.className = `fas fa-${currentTier.icon}`;

  // Update loyalty card theme based on tier
  loyaltyCard.querySelector('.loyalty-card-header').className =
    `loyalty-card-header ${currentTier.name.toLowerCase()}-theme`;

  // Update progress bar
  if (nextTier) {
    nextTierElement.innerHTML = `${nextTier.name} <span class="points-to-next">${progress.pointsToNextTier.toLocaleString()} points needed</span>`;
    progressBarElement.style.width = `${progress.progressToNextTier}%`;
    progressPercentageElement.textContent = `${progress.progressToNextTier}%`;
  } else {
    nextTierElement.innerHTML = `<span>Highest tier reached!</span>`;
    progressBarElement.style.width = '100%';
    progressPercentageElement.textContent = '100%';
  }

  // Update stats
  purchaseCountElement.textContent = loyalty.purchaseCount;
  totalSpentElement.textContent = `$${loyalty.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  totalPointsEarnedElement.textContent = loyalty.totalPointsEarned.toLocaleString();

  // Update current points
  currentPoints = loyalty.points;
};

/**
 * Fetch all loyalty tiers
 */
const fetchLoyaltyTiers = async () => {
  try {
    const response = await fetch('/api/loyalty/tiers');

    if (!response.ok) {
      throw new Error('Failed to fetch loyalty tiers');
    }

    allTiers = await response.json();
    renderTierCards(allTiers);

    return allTiers;
  } catch (error) {
    console.error('Error fetching loyalty tiers:', error);
    showToast('Error fetching loyalty tiers. Please try again later.', 'error');
  }
};

/**
 * Render tier cards
 */
const renderTierCards = (tiers) => {
  if (!tiers || !tiers.length) return;

  tierCardsContainer.innerHTML = '';

  tiers.forEach(tier => {
    const isCurrentTier = loyaltyData.currentTier._id === tier._id;

    const tierCard = document.createElement('div');
    tierCard.className = 'tier-card';

    tierCard.innerHTML = `
      <div class="tier-card-header ${tier.name.toLowerCase()}-theme">
        ${isCurrentTier ? '<span class="current-tier-badge">Current</span>' : ''}
        <div class="tier-card-icon">
          <i class="fas fa-${tier.icon}"></i>
        </div>
        <h3 class="tier-name">${tier.name}</h3>
        <div class="min-points">${tier.minPoints.toLocaleString()} points</div>
      </div>
      <div class="tier-card-body">
        <ul>
          <li>
            <i class="fas ${tier.discountPercentage > 0 ? 'fa-check' : 'fa-times'}"></i>
            ${tier.discountPercentage > 0 ? `${tier.discountPercentage}% Discount` : 'No Tier Discount'}
          </li>
          <li>
            <i class="fas ${tier.freeShipping ? 'fa-check' : 'fa-times'}"></i>
            ${tier.freeShipping ? 'Free Shipping' : 'Standard Shipping'}
          </li>
          <li>
            <i class="fas fa-check"></i>
            ${tier.birthdayBonus} Points Birthday Bonus
          </li>
          <li>
            <i class="fas fa-check"></i>
            ${tier.extraPoints > 1 ? `${tier.extraPoints}x` : '1x'} Points Multiplier
          </li>
        </ul>
        <div class="tier-description">
          ${tier.description}
        </div>
      </div>
    `;

    tierCardsContainer.appendChild(tierCard);
  });
};

/**
 * Initialize tab functionality
 */
const initTabs = () => {
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');

      // Remove active class from all tabs
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Add active class to clicked tab
      button.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Add click event for tab-target buttons
  document.querySelectorAll('[data-tab-target]').forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab-target');

      // Find and click the corresponding tab button
      const tabButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
      if (tabButton) {
        tabButton.click();
      }
    });
  });
};

/**
 * Fetch user's available rewards
 */
const fetchUserRewards = async () => {
  try {
    const response = await fetch('/api/loyalty/rewards', {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch rewards');
    }

    userRewards = await response.json();
    renderUserRewards(userRewards);

    return userRewards;
  } catch (error) {
    console.error('Error fetching rewards:', error);
    showToast('Error fetching rewards. Please try again later.', 'error');
  }
};

/**
 * Render user's rewards
 */
const renderUserRewards = (rewards) => {
  if (!rewards || !rewards.length) {
    renderNoRewards();
    return;
  }

  noRewardsMessage.classList.add('hidden');
  availableRewardsList.innerHTML = '';

  rewards.forEach(reward => {
    const rewardCard = document.createElement('div');
    rewardCard.className = 'reward-card';

    // Format expiry date
    const expiryDate = new Date(reward.expiry);
    const formattedExpiry = expiryDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    let rewardTitle = '';
    if (reward.type === 'discount') {
      rewardTitle = `${reward.value}% Discount`;
    } else if (reward.type === 'freeShipping') {
      rewardTitle = 'Free Shipping';
    } else if (reward.type === 'freeProduct') {
      rewardTitle = 'Free Product';
    } else if (reward.type === 'birthdayBonus') {
      rewardTitle = 'Birthday Bonus';
    }

    rewardCard.innerHTML = `
      <span class="reward-type">${reward.type.toUpperCase()}</span>
      <div class="reward-value">${rewardTitle}</div>
      <div class="reward-code">${reward.code}</div>
      <div class="reward-expiry">Expires on ${formattedExpiry}</div>
      <button class="use-reward-btn" data-reward-code="${reward.code}">
        Use Reward at Checkout
      </button>
    `;

    availableRewardsList.appendChild(rewardCard);
  });

  // Add event listeners to use reward buttons
  document.querySelectorAll('.use-reward-btn').forEach(button => {
    button.addEventListener('click', () => {
      const rewardCode = button.getAttribute('data-reward-code');
      // Redirect to cart with reward code
      window.location.href = `cart.html?reward=${rewardCode}`;
    });
  });
};

/**
 * Render no rewards message
 */
const renderNoRewards = () => {
  availableRewardsList.innerHTML = '';
  noRewardsMessage.classList.remove('hidden');
};

/**
 * Render redeem options
 */
const renderRedeemOptions = (upcomingRewards) => {
  redeemOptionsContainer.innerHTML = '';

  // Define standard redeem options
  const redeemOptions = [
    {
      type: 'discount5',
      title: '5% Discount',
      description: 'Get a 5% discount on your next purchase',
      cost: 500,
      icon: 'percent'
    },
    {
      type: 'discount10',
      title: '10% Discount',
      description: 'Get a 10% discount on your next purchase',
      cost: 1000,
      icon: 'percent'
    },
    {
      type: 'freeShipping',
      title: 'Free Shipping',
      description: 'Get free shipping on your next order',
      cost: 1500,
      icon: 'truck'
    },
    {
      type: 'discount15',
      title: '15% Discount',
      description: 'Get a 15% discount on your next purchase',
      cost: 3000,
      icon: 'percent'
    },
    {
      type: 'discount20',
      title: '20% Discount',
      description: 'Get a 20% discount on your next purchase',
      cost: 5000,
      icon: 'percent'
    }
  ];

  redeemOptions.forEach(option => {
    const canAfford = currentPoints >= option.cost;

    const optionCard = document.createElement('div');
    optionCard.className = 'redeem-option-card';

    optionCard.innerHTML = `
      <div class="redeem-icon">
        <i class="fas fa-${option.icon}"></i>
      </div>
      <h3 class="redeem-title">${option.title}</h3>
      <p class="redeem-description">${option.description}</p>
      <div class="redeem-cost">${option.cost.toLocaleString()} points</div>
      <button class="redeem-button" data-reward-type="${option.type}" data-reward-cost="${option.cost}" ${!canAfford ? 'disabled' : ''}>
        ${canAfford ? 'Redeem' : 'Not Enough Points'}
      </button>
    `;

    redeemOptionsContainer.appendChild(optionCard);
  });

  // Add event listeners to redeem buttons
  document.querySelectorAll('.redeem-button').forEach(button => {
    if (!button.disabled) {
      button.addEventListener('click', async () => {
        const rewardType = button.getAttribute('data-reward-type');
        const pointsCost = parseInt(button.getAttribute('data-reward-cost'));

        await redeemPoints(rewardType, pointsCost);
      });
    }
  });
};

/**
 * Redeem points for a reward
 */
const redeemPoints = async (rewardType, pointsCost) => {
  if (currentPoints < pointsCost) {
    showToast('Not enough points to redeem this reward', 'error');
    return;
  }

  try {
    showLoadingSpinner();

    const response = await fetch('/api/loyalty/redeem-points', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        rewardType,
        pointsCost
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to redeem points');
    }

    const result = await response.json();

    // Update points
    currentPoints = result.remainingPoints;
    pointsValueElement.textContent = currentPoints.toLocaleString();

    // Show success message
    showToast(`Successfully redeemed ${pointsCost} points for ${result.reward.type}!`, 'success');

    // Refresh rewards
    await fetchUserRewards();

    // Refresh transaction history if that tab is active
    if (document.getElementById('points-history').classList.contains('active')) {
      await fetchTransactionHistory(historyLimitSelect.value);
    }

    // Update redeem options based on new points balance
    renderRedeemOptions();

  } catch (error) {
    console.error('Error redeeming points:', error);
    showToast(`Error: ${error.message}`, 'error');
  } finally {
    hideLoadingSpinner();
  }
};

/**
 * Fetch transaction history
 */
const fetchTransactionHistory = async (limit = 20) => {
  try {
    const response = await fetch(`/api/loyalty/history?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch transaction history');
    }

    pointsHistory = await response.json();
    renderTransactionHistory(pointsHistory);

    return pointsHistory;
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    showToast('Error fetching transaction history. Please try again later.', 'error');
  }
};

/**
 * Render transaction history
 */
const renderTransactionHistory = (transactions) => {
  if (!transactions || !transactions.length) {
    transactionHistoryBody.innerHTML = '';
    noHistoryMessage.classList.remove('hidden');
    return;
  }

  noHistoryMessage.classList.add('hidden');
  transactionHistoryBody.innerHTML = '';

  transactions.forEach(transaction => {
    const row = document.createElement('tr');

    // Format date
    const date = new Date(transaction.createdAt);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Determine point class based on type
    let pointsClass = '';
    let pointsPrefix = '';

    if (transaction.type === 'earn') {
      pointsClass = 'points-earned';
      pointsPrefix = '+';
    } else if (transaction.type === 'spend') {
      pointsClass = 'points-spent';
      pointsPrefix = '-';
    }

    row.innerHTML = `
      <td>${formattedDate}</td>
      <td>${transaction.reason}</td>
      <td class="${pointsClass}">${pointsPrefix}${transaction.points}</td>
      <td>${transaction.balance}</td>
    `;

    transactionHistoryBody.appendChild(row);
  });
};

/**
 * Fetch referral code
 */
const fetchReferralCode = async () => {
  try {
    const response = await fetch('/api/loyalty/referral-code', {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch referral code');
    }

    const data = await response.json();
    updateReferralUI(data.referralCode);

    return data.referralCode;
  } catch (error) {
    console.error('Error fetching referral code:', error);
    showToast('Error fetching referral code. Please try again later.', 'error');
  }
};

/**
 * Update referral UI
 */
const updateReferralUI = (referralCode) => {
  // Set referral code
  referralCodeElement.textContent = referralCode;

  // Set referral link
  const referralLink = `${window.location.origin}/register.html?ref=${referralCode}`;
  referralLinkElement.textContent = referralLink;

  // Set referral stats if available
  if (loyaltyData && loyaltyData.loyalty) {
    referralCountElement.textContent = loyaltyData.loyalty.referralCount || 0;
    // Assuming 500 points per referral
    referralPointsElement.textContent = (loyaltyData.loyalty.referralCount * 500).toLocaleString() || 0;
  }
};

/**
 * Add event listeners
 */
const addEventListeners = () => {
  // History limit change
  historyLimitSelect.addEventListener('change', () => {
    fetchTransactionHistory(historyLimitSelect.value);
  });

  // Copy buttons
  copyButtons.forEach(button => {
    button.addEventListener('click', () => {
      const textToCopy = button.previousElementSibling.textContent;

      // Copy to clipboard
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          // Show success toast
          showToast('Copied to clipboard!', 'success');

          // Temporarily change button icon to indicate success
          const originalIcon = button.innerHTML;
          button.innerHTML = '<i class="fas fa-check"></i>';

          setTimeout(() => {
            button.innerHTML = originalIcon;
          }, 2000);
        })
        .catch(err => {
          console.error('Could not copy text: ', err);
          showToast('Failed to copy to clipboard', 'error');
        });
    });
  });
};

/**
 * Show loading spinner
 */
const showLoadingSpinner = () => {
  document.querySelector('.loading-spinner').classList.remove('hidden');
};

/**
 * Hide loading spinner
 */
const hideLoadingSpinner = () => {
  document.querySelector('.loading-spinner').classList.add('hidden');
};

/**
 * Show toast notification
 */
const showToast = (message, type = 'info') => {
  const toastContainer = document.querySelector('.toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  toast.innerHTML = `
    <div class="toast-icon">
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
    </div>
    <div class="toast-content">${message}</div>
    <button class="toast-close"><i class="fas fa-times"></i></button>
  `;

  toastContainer.appendChild(toast);

  // Add close button event
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.remove();
  });

  // Auto-remove after 5 seconds
  setTimeout(() => {
    toast.classList.add('toast-fadeout');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 5000);
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', initLoyaltyProgram);
