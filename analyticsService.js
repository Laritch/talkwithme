/**
 * Analytics Service
 * Provides methods for generating analytics data from the database
 */

import User from '../models/userModel.js';
import Message from '../models/messageModel.js';
import Group from '../models/groupModel.js';

/**
 * Get summary statistics
 */
const getSummaryStats = async (days = 30) => {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  // Get total users count
  const totalUsers = await User.countDocuments();

  // Get new users count (users who registered in the specified period)
  const newUsers = await User.countDocuments({
    createdAt: { $gte: dateThreshold }
  });

  // Get active users count (users who have been active in the specified period)
  const activeUsers = await User.countDocuments({
    lastActive: { $gte: dateThreshold }
  });

  // Get total messages count
  const totalMessages = await Message.countDocuments();

  // Get new messages count (messages created in the specified period)
  const newMessages = await Message.countDocuments({
    createdAt: { $gte: dateThreshold }
  });

  return {
    totalUsers,
    newUsers,
    activeUsers,
    totalMessages,
    newMessages
  };
};

/**
 * Get message activity data grouped by time period
 */
const getMessageActivity = async (days = 30) => {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  // Get all messages in the time period
  const messages = await Message.find({
    createdAt: { $gte: dateThreshold }
  }).select('createdAt');

  // Initialize result object with different time groupings
  const result = {
    daily: { timeLabels: [], messageData: [] },
    weekly: { timeLabels: [], messageData: [] },
    monthly: { timeLabels: [], messageData: [] }
  };

  // Process daily data
  const dailyData = {};
  const weeklyData = {};
  const monthlyData = {};

  // Create empty data points for each day in the range
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1) + i);
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
    dailyData[dateString] = 0;

    // Add to time labels (formatted for display)
    const displayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    result.daily.timeLabels.push(displayDate);
  }

  // Create empty data points for each week
  const weeks = Math.ceil(days / 7);
  for (let i = 0; i < weeks; i++) {
    const date = new Date();
    date.setDate(date.getDate() - ((weeks - 1) * 7) + (i * 7));
    const weekString = `Week-${date.toISOString().split('T')[0]}`;
    weeklyData[weekString] = 0;

    // Add to time labels
    const displayDate = `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    result.weekly.timeLabels.push(displayDate);
  }

  // Create empty data points for each month (last 12 months)
  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    const monthString = `${date.getFullYear()}-${date.getMonth() + 1}`;
    monthlyData[monthString] = 0;

    // Add to time labels
    const displayDate = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    result.monthly.timeLabels.push(displayDate);
  }

  // Process each message to count by time period
  messages.forEach(message => {
    const messageDate = new Date(message.createdAt);

    // Daily count
    const dailyKey = messageDate.toISOString().split('T')[0];
    if (dailyData[dailyKey] !== undefined) {
      dailyData[dailyKey]++;
    }

    // Weekly count
    const weekDate = new Date(messageDate);
    weekDate.setDate(weekDate.getDate() - weekDate.getDay()); // Set to start of week (Sunday)
    const weekKey = `Week-${weekDate.toISOString().split('T')[0]}`;
    if (weeklyData[weekKey] !== undefined) {
      weeklyData[weekKey]++;
    }

    // Monthly count
    const monthKey = `${messageDate.getFullYear()}-${messageDate.getMonth() + 1}`;
    if (monthlyData[monthKey] !== undefined) {
      monthlyData[monthKey]++;
    }
  });

  // Convert data objects to arrays for chart consumption
  result.daily.messageData = Object.values(dailyData);
  result.weekly.messageData = Object.values(weeklyData);
  result.monthly.messageData = Object.values(monthlyData);

  return result;
};

/**
 * Get user growth data
 */
const getUserGrowth = async (months = 12) => {
  const result = {
    timeLabels: [],
    userData: []
  };

  // Create data points for each month
  const monthlyData = {};
  for (let i = 0; i < months; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - (months - 1) + i);

    // Format as YYYY-MM
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

    // Add to time labels (formatted for display)
    const displayDate = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    result.timeLabels.push(displayDate);

    // Get all users created before or during this month
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    // Find users created before the end of this month
    const userCount = await User.countDocuments({
      createdAt: { $lte: endOfMonth }
    });

    result.userData.push(userCount);
  }

  return result;
};

/**
 * Get activity by time of day
 */
const getActivityByTime = async (days = 30) => {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  // Time slots (3-hour intervals)
  const timeSlots = [
    '00:00', '03:00', '06:00', '09:00',
    '12:00', '15:00', '18:00', '21:00'
  ];

  // Initialize activity data
  const activityData = Array(timeSlots.length).fill(0);

  // Get all messages in the time period
  const messages = await Message.find({
    createdAt: { $gte: dateThreshold }
  }).select('createdAt');

  // Count messages by time slot
  messages.forEach(message => {
    const hour = new Date(message.createdAt).getHours();
    const slotIndex = Math.floor(hour / 3);
    activityData[slotIndex]++;
  });

  return {
    timeLabels: timeSlots,
    activityData
  };
};

/**
 * Get user engagement metrics
 */
const getUserEngagement = async (days = 30) => {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  // Get all users active in the period
  const users = await User.find({
    lastActive: { $gte: dateThreshold }
  }).select('_id');

  const userIds = users.map(user => user._id);

  // Get message counts per user
  const messageCounts = await Message.aggregate([
    {
      $match: {
        createdAt: { $gte: dateThreshold },
        sender: { $in: userIds }
      }
    },
    {
      $group: {
        _id: '$sender',
        count: { $sum: 1 }
      }
    }
  ]);

  // Categorize users by message count
  const messageCountCategories = {
    '1-5': 0,
    '6-10': 0,
    '11-20': 0,
    '21-50': 0,
    '51+': 0
  };

  messageCounts.forEach(item => {
    if (item.count >= 1 && item.count <= 5) {
      messageCountCategories['1-5']++;
    } else if (item.count >= 6 && item.count <= 10) {
      messageCountCategories['6-10']++;
    } else if (item.count >= 11 && item.count <= 20) {
      messageCountCategories['11-20']++;
    } else if (item.count >= 21 && item.count <= 50) {
      messageCountCategories['21-50']++;
    } else if (item.count > 50) {
      messageCountCategories['51+']++;
    }
  });

  // For retention calculation - users active over time
  const retentionData = [];

  // Day 1 (all users)
  const day1Active = users.length;
  retentionData.push(100); // 100% by definition

  // Day 7
  const day7Threshold = new Date();
  day7Threshold.setDate(day7Threshold.getDate() - 7);
  const day7Active = await User.countDocuments({
    lastActive: { $gte: day7Threshold },
    _id: { $in: userIds }
  });
  const day7Percent = day1Active ? Math.round((day7Active / day1Active) * 100) : 0;
  retentionData.push(day7Percent);

  // Day 14
  const day14Threshold = new Date();
  day14Threshold.setDate(day14Threshold.getDate() - 14);
  const day14Active = await User.countDocuments({
    lastActive: { $gte: day14Threshold },
    _id: { $in: userIds }
  });
  const day14Percent = day1Active ? Math.round((day14Active / day1Active) * 100) : 0;
  retentionData.push(day14Percent);

  // Day 30
  const day30Active = await User.countDocuments({
    lastActive: { $gte: dateThreshold },
    _id: { $in: userIds }
  });
  const day30Percent = day1Active ? Math.round((day30Active / day1Active) * 100) : 0;
  retentionData.push(day30Percent);

  // Day 90
  const day90Threshold = new Date();
  day90Threshold.setDate(day90Threshold.getDate() - 90);
  const day90Active = await User.countDocuments({
    lastActive: { $gte: day90Threshold },
    _id: { $in: userIds }
  });
  const day90Percent = day1Active ? Math.round((day90Active / day1Active) * 100) : 0;
  retentionData.push(day90Percent);

  // Mock session duration data since we don't track actual session duration
  const sessionDurationCategories = {
    '<1': 156,
    '1-5': 289,
    '5-15': 345,
    '15-30': 267,
    '30+': 190
  };

  return {
    messages: {
      label: 'Messages per User',
      labels: Object.keys(messageCountCategories),
      values: Object.values(messageCountCategories)
    },
    session: {
      label: 'Session Duration (minutes)',
      labels: Object.keys(sessionDurationCategories),
      values: Object.values(sessionDurationCategories)
    },
    retention: {
      label: 'Retention Rate (%)',
      labels: ['Day 1', 'Day 7', 'Day 14', 'Day 30', 'Day 90'],
      values: retentionData
    }
  };
};

/**
 * Get content type distribution
 */
const getContentTypes = async (days = 30) => {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  // Get message counts by content type
  const contentTypeStats = await Message.aggregate([
    {
      $match: {
        createdAt: { $gte: dateThreshold }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    }
  ]);

  // Initialize all possible types
  const result = {
    text: 0,
    image: 0,
    file: 0,
    system: 0
  };

  // Fill in actual counts
  contentTypeStats.forEach(item => {
    if (result[item._id] !== undefined) {
      result[item._id] = item.count;
    }
  });

  return result;
};

/**
 * Get user status distribution
 */
const getUserStatus = async () => {
  // Get user counts by status
  const statusStats = await User.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Initialize all possible statuses
  const result = {
    online: 0,
    away: 0,
    busy: 0,
    offline: 0
  };

  // Fill in actual counts
  statusStats.forEach(item => {
    if (result[item._id] !== undefined) {
      result[item._id] = item.count;
    }
  });

  return result;
};

/**
 * Get user device statistics
 */
const getUserDevices = async (days = 30) => {
  // This would normally come from user agent tracking
  // For now, we'll return mock data
  return {
    desktop: 65,
    mobile: 30,
    tablet: 5
  };
};

/**
 * Get average response time statistics
 */
const getResponseTimes = async (days = 30) => {
  // This would require more sophisticated tracking
  // For now, we'll return mock data
  return {
    average: 2.5, // minutes
    peak: 5.2,    // minutes
    offPeak: 1.8  // minutes
  };
};

/**
 * Get complete analytics data
 */
const getAnalyticsData = async (days = 30) => {
  const stats = await getSummaryStats(days);
  const messageActivity = await getMessageActivity(days);
  const userGrowth = await getUserGrowth();
  const activityByTime = await getActivityByTime(days);
  const engagement = await getUserEngagement(days);
  const contentTypes = await getContentTypes(days);
  const userStatus = await getUserStatus();
  const userDevices = await getUserDevices(days);
  const responseTimes = await getResponseTimes(days);

  return {
    stats,
    messageActivity,
    userGrowth,
    activityByTime,
    engagement,
    contentTypes,
    userStatus,
    userDevices,
    responseTimes
  };
};

/**
 * Get expert performance metrics
 */
const getExpertPerformance = async (days = 30) => {
  // In a real application, this would come from a dedicated experts collection
  // For now, we'll return mock data
  return [
    {
      id: 'exp1',
      name: 'Dr. Sarah Johnson',
      category: 'Nutrition',
      consultations: 42,
      rating: 4.8,
      revenue: 3780,
      completionRate: 98,
      responseTime: 0.8 // hours
    },
    {
      id: 'exp2',
      name: 'Thomas Wright, Esq.',
      category: 'Legal',
      consultations: 37,
      rating: 4.7,
      revenue: 5550,
      completionRate: 95,
      responseTime: 1.2
    },
    {
      id: 'exp3',
      name: 'Maria Garcia, CFA',
      category: 'Financial',
      consultations: 51,
      rating: 4.9,
      revenue: 7650,
      completionRate: 99,
      responseTime: 0.5
    },
    {
      id: 'exp4',
      name: 'Dr. James Wilson',
      category: 'Medical',
      consultations: 29,
      rating: 4.6,
      revenue: 4350,
      completionRate: 97,
      responseTime: 0.9
    },
    {
      id: 'exp5',
      name: 'Alex Chen',
      category: 'Technical',
      consultations: 45,
      rating: 4.5,
      revenue: 3375,
      completionRate: 94,
      responseTime: 0.3
    }
  ];
};

/**
 * Get client satisfaction metrics
 */
const getClientSatisfaction = async (days = 30) => {
  // In a real application, this would come from ratings and reviews
  // For now, we'll return mock data
  return {
    overall: 4.7,
    categories: {
      'Consultation Quality': 4.8,
      'Expert Knowledge': 4.9,
      'Response Time': 4.5,
      'Value for Money': 4.6,
      'Platform Experience': 4.7
    },
    reviews: [
      {
        client: 'Jennifer A.',
        rating: 5,
        comment: 'Dr. Johnson provided excellent nutritional guidance that helped me achieve my weight loss goals.',
        date: '2023-03-15',
        category: 'Nutrition'
      },
      {
        client: 'Michael T.',
        rating: 4,
        comment: 'Very helpful legal advice, though I wish the session was a bit longer.',
        date: '2023-03-12',
        category: 'Legal'
      },
      {
        client: 'Robert K.',
        rating: 5,
        comment: 'Maria helped me restructure my investments and I\'ve already seen positive results.',
        date: '2023-03-10',
        category: 'Financial'
      },
      {
        client: 'Sophia L.',
        rating: 4,
        comment: 'The medical consultation was thorough and Dr. Wilson explained everything clearly.',
        date: '2023-03-08',
        category: 'Medical'
      },
      {
        client: 'David P.',
        rating: 5,
        comment: 'Alex quickly identified and solved my technical issues. Highly recommended!',
        date: '2023-03-05',
        category: 'Technical'
      }
    ]
  };
};

/**
 * Get revenue data for marketplace
 */
const getRevenueData = async (months = 12) => {
  const result = {
    total: 0,
    byCategory: {},
    byMonth: {
      labels: [],
      values: []
    }
  };

  // Create data points for each month
  for (let i = 0; i < months; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - (months - 1) + i);

    // Add to time labels (formatted for display)
    const displayDate = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    result.byMonth.labels.push(displayDate);

    // Generate realistic increasing revenue with some variation
    // Start at $10,000 for the earliest month and increase by ~10% each month with some randomness
    const baseValue = 10000 * Math.pow(1.1, i);
    const randomVariation = (Math.random() * 0.2 - 0.1) * baseValue; // +/- 10%
    const monthlyRevenue = Math.round(baseValue + randomVariation);
    result.byMonth.values.push(monthlyRevenue);

    result.total += monthlyRevenue;
  }

  // Revenue by category
  result.byCategory = {
    'Nutrition': Math.round(result.total * 0.25),
    'Legal': Math.round(result.total * 0.30),
    'Financial': Math.round(result.total * 0.20),
    'Medical': Math.round(result.total * 0.15),
    'Technical': Math.round(result.total * 0.10)
  };

  return result;
};

/**
 * Generate revenue forecast
 */
const getRevenueForecast = async (months = 12, forecastMonths = 6) => {
  const historicalData = await getRevenueData(months);

  const result = {
    labels: [...historicalData.byMonth.labels],
    historical: [...historicalData.byMonth.values],
    forecastBase: [],
    forecastOptimistic: [],
    forecastConservative: []
  };

  // Calculate average growth rate from historical data
  const growthRates = [];
  for (let i = 1; i < historicalData.byMonth.values.length; i++) {
    const growthRate = historicalData.byMonth.values[i] / historicalData.byMonth.values[i-1] - 1;
    growthRates.push(growthRate);
  }

  // Average growth rate
  const avgGrowthRate = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;

  // Start forecasting from the last historical value
  let lastValue = historicalData.byMonth.values[historicalData.byMonth.values.length - 1];

  // Generate forecast months
  for (let i = 1; i <= forecastMonths; i++) {
    // Calculate next month's date
    const date = new Date();
    date.setMonth(date.getMonth() + i);
    const displayDate = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    result.labels.push(displayDate);

    // Base forecast (using average growth rate)
    const baseValue = Math.round(lastValue * (1 + avgGrowthRate));
    result.forecastBase.push(baseValue);

    // Optimistic forecast (1.5x growth rate)
    const optimisticValue = Math.round(lastValue * (1 + avgGrowthRate * 1.5));
    result.forecastOptimistic.push(optimisticValue);

    // Conservative forecast (0.5x growth rate)
    const conservativeValue = Math.round(lastValue * (1 + avgGrowthRate * 0.5));
    result.forecastConservative.push(conservativeValue);

    // Update last value for next iteration
    lastValue = baseValue;
  }

  // Add null placeholder values for historical data during forecast period
  for (let i = 0; i < forecastMonths; i++) {
    result.historical.push(null);
  }

  // Add null placeholder values for forecast data during historical period
  const nullArray = Array(months).fill(null);
  result.forecastBase = [...nullArray, ...result.forecastBase];
  result.forecastOptimistic = [...nullArray, ...result.forecastOptimistic];
  result.forecastConservative = [...nullArray, ...result.forecastConservative];

  return result;
};

/**
 * Get consultations by category
 */
const getConsultationsByCategory = async (days = 30) => {
  // In a real application, this would come from a consultations collection
  // For now, we'll return mock data
  return {
    categories: ['Nutrition', 'Legal', 'Financial', 'Medical', 'Technical'],
    values: [125, 97, 112, 86, 65],
    growth: [8.4, 12.5, 15.3, 6.2, 21.7]
  };
};

/**
 * Get engagement data by combining user engagement with marketplace metrics
 */
const getEngagementData = async (days = 30) => {
  // Get base user engagement data
  const userEngagement = await getUserEngagement(days);

  // Rename 'messages' to 'consultations' for service marketplace context
  const result = {
    consultations: {
      label: 'Consultations per Client',
      labels: userEngagement.messages.labels,
      values: userEngagement.messages.values
    },
    session: userEngagement.session,
    retention: userEngagement.retention
  };

  return result;
};

/**
 * Get content type distribution specific to service marketplace
 */
const getContentTypeDistribution = async (days = 30) => {
  // For the marketplace context, we're reframing the content types
  const baseContentTypes = await getContentTypes(days);

  // Reframe content types as consultation types
  return {
    text: baseContentTypes.text, // Text-based consultations
    audio: baseContentTypes.image, // Audio consultations (repurposed from image)
    video: baseContentTypes.file, // Video consultations (repurposed from file)
    inPerson: baseContentTypes.system // In-person meeting arrangements (repurposed from system)
  };
};

/**
 * Get user status distribution with marketplace naming
 */
const getUserStatusDistribution = async () => {
  const userStatus = await getUserStatus();
  return userStatus;
};

/**
 * Get user device distribution
 */
const getUserDeviceDistribution = async (days = 30) => {
  return await getUserDevices(days);
};

// ... existing code ...

export {
  getSummaryStats,
  getMessageActivity,
  getUserGrowth,
  getActivityByTime,
  getEngagementData,
  getContentTypeDistribution,
  getUserStatusDistribution,
  getUserDeviceDistribution,
  getResponseTimes,
  getExpertPerformance,
  getClientSatisfaction,
  getRevenueData,
  getRevenueForecast,
  getConsultationsByCategory,
  getAnalyticsData
};
