/**
 * Forum Recommendation Service
 *
 * This service uses AI techniques to recommend forums and topics to users
 * based on their interests, behavior, and engagement patterns.
 */

const fs = require('fs');
const path = require('path');
const db = require('../db');

// Constants
const SIMILARITY_THRESHOLD = 0.5;
const MAX_RECOMMENDATIONS = 5;
const RECENCY_WEIGHT = 0.3;
const EXPLICIT_INTEREST_WEIGHT = 0.5;
const IMPLICIT_INTEREST_WEIGHT = 0.3;
const BEHAVIORAL_WEIGHT = 0.4;
const USER_INTEREST_DECAY = 0.8; // Interests decay over time

// Paths to data files
const USER_INTERESTS_FILE = path.join(__dirname, '../data/user_interests.json');
const FORUM_VECTORS_FILE = path.join(__dirname, '../data/forum_vectors.json');

/**
 * Load user interests and forum vectors from files
 * @returns {Object} Object with userInterests and forumVectors
 */
function loadRecommendationData() {
  try {
    const userInterestsData = fs.existsSync(USER_INTERESTS_FILE)
      ? JSON.parse(fs.readFileSync(USER_INTERESTS_FILE, 'utf8'))
      : {};

    const forumVectorsData = fs.existsSync(FORUM_VECTORS_FILE)
      ? JSON.parse(fs.readFileSync(FORUM_VECTORS_FILE, 'utf8'))
      : { forums: {}, topics: {}, keywordCategories: {}, vectorDimensions: [] };

    return { userInterests: userInterestsData, forumVectors: forumVectorsData };
  } catch (error) {
    console.error('Error loading recommendation data:', error);
    return { userInterests: {}, forumVectors: { forums: {}, topics: {}, keywordCategories: {}, vectorDimensions: [] } };
  }
}

/**
 * Save user interests to file
 * @param {Object} userInterests - The user interests to save
 * @returns {boolean} Success or failure
 */
function saveUserInterests(userInterests) {
  try {
    fs.writeFileSync(USER_INTERESTS_FILE, JSON.stringify(userInterests, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving user interests:', error);
    return false;
  }
}

/**
 * Calculate cosine similarity between two vectors
 * @param {Array} vector1 - First vector
 * @param {Array} vector2 - Second vector
 * @returns {number} Similarity score between 0 and 1
 */
function calculateCosineSimilarity(vector1, vector2) {
  if (!vector1 || !vector2 || vector1.length !== vector2.length) {
    return 0;
  }

  // Calculate dot product
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (let i = 0; i < vector1.length; i++) {
    dotProduct += vector1[i] * vector2[i];
    magnitude1 += vector1[i] * vector1[i];
    magnitude2 += vector2[i] * vector2[i];
  }

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Extract keywords from text
 * @param {string} text - Text to extract keywords from
 * @param {Object} keywordCategories - Keyword categories for matching
 * @returns {Object} Extracted keywords grouped by category
 */
function extractKeywords(text, keywordCategories) {
  if (!text || !keywordCategories) {
    return {};
  }

  const result = {};
  const lowerText = text.toLowerCase();

  // Check each category
  Object.keys(keywordCategories).forEach(category => {
    const keywords = keywordCategories[category];
    const matches = [];

    // Check each keyword in the category
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword.toLowerCase())) {
        matches.push(keyword);
      }
    });

    if (matches.length > 0) {
      result[category] = matches;
    }
  });

  return result;
}

/**
 * Create a user interest vector from various user data
 * @param {Object} userInterest - User interest data
 * @param {Object} forumVectors - Forum vector data
 * @returns {Array} User interest vector
 */
function createUserInterestVector(userInterest, forumVectors) {
  // Initialize vector with zeros
  const vector = Array(forumVectors.vectorDimensions.length).fill(0);

  // Process explicit interests
  if (userInterest.explicitInterests && userInterest.explicitInterests.length > 0) {
    userInterest.explicitInterests.forEach(interest => {
      const keywords = extractKeywords(interest, forumVectors.keywordCategories);

      Object.keys(keywords).forEach(category => {
        const dimensionIndex = forumVectors.vectorDimensions.indexOf(category);
        if (dimensionIndex >= 0) {
          vector[dimensionIndex] += EXPLICIT_INTEREST_WEIGHT * (keywords[category].length / forumVectors.keywordCategories[category].length);
        }
      });
    });
  }

  // Process implicit interests
  if (userInterest.implicitInterests && userInterest.implicitInterests.length > 0) {
    userInterest.implicitInterests.forEach(interest => {
      const keywords = extractKeywords(interest, forumVectors.keywordCategories);

      Object.keys(keywords).forEach(category => {
        const dimensionIndex = forumVectors.vectorDimensions.indexOf(category);
        if (dimensionIndex >= 0) {
          vector[dimensionIndex] += IMPLICIT_INTEREST_WEIGHT * (keywords[category].length / forumVectors.keywordCategories[category].length);
        }
      });
    });
  }

  // Process view history
  if (userInterest.viewHistory && userInterest.viewHistory.length > 0) {
    // Sort by recency
    const sortedHistory = [...userInterest.viewHistory].sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    // Process top 5 most recent views with decay
    sortedHistory.slice(0, 5).forEach((view, index) => {
      const forum = forumVectors.forums[view.forumId];
      const topic = forumVectors.topics[view.topicId];

      if (forum && forum.topicVector) {
        // Apply recency decay
        const recencyFactor = Math.pow(USER_INTEREST_DECAY, index);

        // Add weighted forum vector
        forum.topicVector.forEach((value, i) => {
          vector[i] += BEHAVIORAL_WEIGHT * value * recencyFactor * (view.duration / 300); // Normalize by 5 minutes
        });
      }

      if (topic && topic.topicVector) {
        // Apply recency decay
        const recencyFactor = Math.pow(USER_INTEREST_DECAY, index);

        // Add weighted topic vector
        topic.topicVector.forEach((value, i) => {
          vector[i] += BEHAVIORAL_WEIGHT * value * recencyFactor;
        });
      }
    });
  }

  // Process search history
  if (userInterest.searchHistory && userInterest.searchHistory.length > 0) {
    // Sort by recency
    const sortedSearches = [...userInterest.searchHistory].sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    // Process top 3 most recent searches with decay
    sortedSearches.slice(0, 3).forEach((search, index) => {
      const keywords = extractKeywords(search.query, forumVectors.keywordCategories);

      // Apply recency decay
      const recencyFactor = Math.pow(USER_INTEREST_DECAY, index);

      Object.keys(keywords).forEach(category => {
        const dimensionIndex = forumVectors.vectorDimensions.indexOf(category);
        if (dimensionIndex >= 0) {
          vector[dimensionIndex] += BEHAVIORAL_WEIGHT * recencyFactor * (keywords[category].length / forumVectors.keywordCategories[category].length);
        }
      });
    });
  }

  // Normalize vector
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    return vector.map(val => val / magnitude);
  }

  return vector;
}

/**
 * Calculate forum scores for a user
 * @param {string} userId - User ID
 * @returns {Array} Scored forums
 */
function calculateForumScores(userId) {
  // Load data
  const { userInterests, forumVectors } = loadRecommendationData();
  const userInterest = userInterests[userId];

  if (!userInterest) {
    return [];
  }

  // Get all forums
  const forums = db.forums.getAll();

  // Create user interest vector
  const userVector = createUserInterestVector(userInterest, forumVectors);

  // Calculate scores for each forum
  const scoredForums = forums.map(forum => {
    const forumVector = forumVectors.forums[forum.id]?.topicVector || Array(userVector.length).fill(0);

    // Calculate similarity
    const similarity = calculateCosineSimilarity(userVector, forumVector);

    // Calculate engagement score
    let engagementScore = 0;
    if (userInterest.postingActivity && userInterest.postingActivity[forum.id]) {
      engagementScore += userInterest.postingActivity[forum.id] * 0.2;
    }

    if (userInterest.clickThroughRates && userInterest.clickThroughRates[forum.id]) {
      engagementScore += userInterest.clickThroughRates[forum.id] * 0.3;
    }

    const forumData = forumVectors.forums[forum.id];
    const conversionBoost = forumData?.conversionRate || 0;

    // Calculate total score
    const score = similarity * 0.6 + engagementScore * 0.3 + conversionBoost * 0.1;

    return {
      forum,
      score,
      similarity,
      engagementScore,
      conversionBoost
    };
  });

  // Sort by score
  return scoredForums.sort((a, b) => b.score - a.score);
}

/**
 * Calculate topic scores for a user within a specific forum
 * @param {string} userId - User ID
 * @param {string} forumId - Forum ID
 * @returns {Array} Scored topics
 */
function calculateTopicScores(userId, forumId) {
  // Load data
  const { userInterests, forumVectors } = loadRecommendationData();
  const userInterest = userInterests[userId];

  if (!userInterest) {
    return [];
  }

  // Get topics for this forum
  const topics = db.topics.findByForumId(forumId);

  // Create user interest vector
  const userVector = createUserInterestVector(userInterest, forumVectors);

  // Calculate scores for each topic
  const scoredTopics = topics.map(topic => {
    const topicVector = forumVectors.topics[topic.id]?.topicVector || Array(userVector.length).fill(0);

    // Calculate similarity
    const similarity = calculateCosineSimilarity(userVector, topicVector);

    // Check view history
    const viewed = userInterest.viewHistory?.some(view => view.topicId === topic.id) || false;

    // Calculate purchase intent boost
    const purchaseIntent = forumVectors.topics[topic.id]?.purchaseIntent || 0;

    // Calculate score
    const score = similarity * 0.7 + (viewed ? 0.1 : 0.2) + purchaseIntent * 0.2;

    return {
      topic,
      score,
      similarity,
      viewed,
      purchaseIntent
    };
  });

  // Sort by score
  return scoredTopics.sort((a, b) => b.score - a.score);
}

/**
 * Get personalized forum recommendations for a user
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of recommendations
 * @returns {Array} Recommended forums
 */
function getForumRecommendations(userId, limit = MAX_RECOMMENDATIONS) {
  const scoredForums = calculateForumScores(userId);

  // Return top N recommendations
  return scoredForums
    .slice(0, limit)
    .map(item => ({
      id: item.forum.id,
      title: item.forum.title,
      description: item.forum.description,
      score: item.score,
      recommendationReason: generateRecommendationReason(userId, item)
    }));
}

/**
 * Get personalized topic recommendations for a user within a forum
 * @param {string} userId - User ID
 * @param {string} forumId - Forum ID
 * @param {number} limit - Maximum number of recommendations
 * @returns {Array} Recommended topics
 */
function getTopicRecommendations(userId, forumId, limit = MAX_RECOMMENDATIONS) {
  const scoredTopics = calculateTopicScores(userId, forumId);

  // Return top N recommendations
  return scoredTopics
    .slice(0, limit)
    .map(item => ({
      id: item.topic.id,
      title: item.topic.title,
      score: item.score,
      recommendationReason: generateTopicRecommendationReason(userId, item)
    }));
}

/**
 * Generate a personalized reason for recommending a forum
 * @param {string} userId - User ID
 * @param {Object} scoredForum - Scored forum with metadata
 * @returns {string} Recommendation reason
 */
function generateRecommendationReason(userId, scoredForum) {
  const { userInterests, forumVectors } = loadRecommendationData();
  const userInterest = userInterests[userId];
  const forumData = forumVectors.forums[scoredForum.forum.id];

  if (!userInterest || !forumData) {
    return "This forum might interest you.";
  }

  // Choose from a variety of personalized reasons
  const reasons = [];

  // Check explicit interests match
  const matchingExplicitInterests = userInterest.explicitInterests?.filter(interest =>
    forumData.keywords.some(keyword => interest.toLowerCase().includes(keyword.toLowerCase()))
  ) || [];

  if (matchingExplicitInterests.length > 0) {
    reasons.push(`Matches your interest in ${matchingExplicitInterests[0]}.`);
  }

  // Check view history
  const hasViewed = userInterest.viewHistory?.some(view => view.forumId === scoredForum.forum.id) || false;
  if (hasViewed) {
    reasons.push("Based on your previous engagement with this topic.");
  }

  // Check for audience segment match
  const userRoleOrProfession = userInterest.explicitInterests?.find(interest =>
    interest.toLowerCase().includes("professional") ||
    interest.toLowerCase().includes("manager") ||
    interest.toLowerCase().includes("parent") ||
    interest.toLowerCase().includes("student") ||
    interest.toLowerCase().includes("worker")
  );

  if (userRoleOrProfession && forumData.audienceSegments.some(segment =>
    userRoleOrProfession.toLowerCase().includes(segment.toLowerCase().replace('-', ' '))
  )) {
    reasons.push(`Popular among ${userRoleOrProfession}s like you.`);
  }

  // Check for pain points
  const matchingPainPoints = forumData.commonPainPoints.filter(painPoint =>
    userInterest.searchHistory?.some(search => search.query.toLowerCase().includes(painPoint.toLowerCase())) ||
    userInterest.explicitInterests?.some(interest => interest.toLowerCase().includes(painPoint.toLowerCase()))
  );

  if (matchingPainPoints.length > 0) {
    reasons.push(`Addresses ${matchingPainPoints[0]} challenges.`);
  }

  // If high conversion rate
  if (forumData.conversionRate > 0.3) {
    reasons.push("Many users find valuable insights in this discussion.");
  }

  // If we have expert affiliation
  if (forumData.affiliatedExperts?.includes(userId)) {
    reasons.push("You're recognized as an expert in this area.");
  } else if (forumData.affiliatedExperts?.length > 0) {
    const expertUsers = forumData.affiliatedExperts.map(id => db.users.getById(id)).filter(Boolean);
    if (expertUsers.length > 0) {
      reasons.push(`Features insights from expert ${expertUsers[0].name}.`);
    }
  }

  // If no specific reasons, use a generic one
  if (reasons.length === 0) {
    reasons.push("This forum aligns with your interests.");
  }

  // Return a single reason (randomly selected if multiple)
  return reasons[Math.floor(Math.random() * reasons.length)];
}

/**
 * Generate a personalized reason for recommending a topic
 * @param {string} userId - User ID
 * @param {Object} scoredTopic - Scored topic with metadata
 * @returns {string} Recommendation reason
 */
function generateTopicRecommendationReason(userId, scoredTopic) {
  const { userInterests, forumVectors } = loadRecommendationData();
  const userInterest = userInterests[userId];
  const topicData = forumVectors.topics[scoredTopic.topic.id];

  if (!userInterest || !topicData) {
    return "This topic might interest you.";
  }

  // Choose from a variety of personalized reasons
  const reasons = [];

  // Check keyword match
  const matchingKeywords = topicData.keywords.filter(keyword =>
    userInterest.searchHistory?.some(search => search.query.toLowerCase().includes(keyword.toLowerCase())) ||
    userInterest.explicitInterests?.some(interest => interest.toLowerCase().includes(keyword.toLowerCase()))
  );

  if (matchingKeywords.length > 0) {
    reasons.push(`Related to your interest in ${matchingKeywords[0]}.`);
  }

  // Check for audience appeal
  Object.entries(topicData.audienceAppeal || {}).forEach(([audience, score]) => {
    if (score > 0.7 && audience.toLowerCase().replace('-', ' ').includes(
      userInterest.explicitInterests?.join(' ').toLowerCase() || ''
    )) {
      reasons.push(`Highly relevant for ${audience.replace('-', ' ')}.`);
    }
  });

  // Check for associated services match
  const interestedInServices = userInterest.explicitInterests?.some(interest =>
    topicData.associatedServices?.some(service =>
      service.toLowerCase().includes(interest.toLowerCase())
    )
  ) || false;

  if (interestedInServices) {
    reasons.push("Discusses services you've shown interest in.");
  }

  // Check if not viewed yet but highly recommended
  if (!scoredTopic.viewed && scoredTopic.score > 0.7) {
    reasons.push("New topic you might find valuable.");
  }

  // If high purchase intent
  if (scoredTopic.purchaseIntent > 0.65) {
    reasons.push("Many users found actionable advice in this discussion.");
  }

  // If no specific reasons, use a generic one
  if (reasons.length === 0) {
    reasons.push("This topic matches your browsing patterns.");
  }

  // Return a single reason (randomly selected if multiple)
  return reasons[Math.floor(Math.random() * reasons.length)];
}

/**
 * Track user forum interaction and update their interests
 * @param {string} userId - User ID
 * @param {string} forumId - Forum ID
 * @param {string} topicId - Topic ID (optional)
 * @param {string} interactionType - Type of interaction (view, search, click, post)
 * @param {Object} data - Additional interaction data
 * @returns {boolean} Success or failure
 */
function trackUserInteraction(userId, forumId, topicId, interactionType, data = {}) {
  // Load user interests
  const { userInterests } = loadRecommendationData();

  // Initialize user interest if not exists
  if (!userInterests[userId]) {
    userInterests[userId] = {
      userId,
      explicitInterests: [],
      implicitInterests: [],
      viewHistory: [],
      searchHistory: [],
      topicCreationHistory: [],
      postingActivity: {},
      clickThroughRates: {},
      recommendationFeedback: [],
      lastUpdated: new Date().toISOString()
    };
  }

  const userInterest = userInterests[userId];

  // Update based on interaction type
  switch (interactionType) {
    case 'view':
      userInterest.viewHistory = userInterest.viewHistory || [];
      userInterest.viewHistory.push({
        forumId,
        topicId,
        timestamp: new Date().toISOString(),
        duration: data.duration || 0
      });

      // Limit history size
      if (userInterest.viewHistory.length > 50) {
        userInterest.viewHistory = userInterest.viewHistory.slice(-50);
      }
      break;

    case 'search':
      userInterest.searchHistory = userInterest.searchHistory || [];
      userInterest.searchHistory.push({
        query: data.query || '',
        timestamp: new Date().toISOString()
      });

      // Limit history size
      if (userInterest.searchHistory.length > 20) {
        userInterest.searchHistory = userInterest.searchHistory.slice(-20);
      }

      // Extract keywords from search and update implicit interests
      const { keywordCategories } = loadRecommendationData().forumVectors;
      const extractedKeywords = Object.values(extractKeywords(data.query || '', keywordCategories)).flat();

      if (extractedKeywords.length > 0) {
        userInterest.implicitInterests = userInterest.implicitInterests || [];
        extractedKeywords.forEach(keyword => {
          if (!userInterest.implicitInterests.includes(keyword)) {
            userInterest.implicitInterests.push(keyword);
          }
        });
      }
      break;

    case 'click':
      userInterest.clickThroughRates = userInterest.clickThroughRates || {};

      // Calculate click-through rate
      const viewCount = userInterest.viewHistory?.filter(view => view.forumId === forumId).length || 0;
      const currentClicks = (userInterest.clickThroughRates[forumId] || 0) * viewCount;
      const newClicks = currentClicks + 1;
      const newRate = viewCount > 0 ? newClicks / viewCount : 0;

      userInterest.clickThroughRates[forumId] = newRate;
      break;

    case 'post':
      userInterest.postingActivity = userInterest.postingActivity || {};
      userInterest.postingActivity[forumId] = (userInterest.postingActivity[forumId] || 0) + 1;

      // If this is a new topic creation
      if (data.isNewTopic && topicId) {
        userInterest.topicCreationHistory = userInterest.topicCreationHistory || [];
        userInterest.topicCreationHistory.push(topicId);
      }
      break;

    case 'explicit_interest':
      userInterest.explicitInterests = userInterest.explicitInterests || [];

      // Add new interest if not already present
      if (data.interest && !userInterest.explicitInterests.includes(data.interest)) {
        userInterest.explicitInterests.push(data.interest);
      }
      break;

    case 'recommendation_feedback':
      userInterest.recommendationFeedback = userInterest.recommendationFeedback || [];

      if (data.recommendationId && data.forumId && data.rating) {
        userInterest.recommendationFeedback.push({
          recommendationId: data.recommendationId,
          forumId: data.forumId,
          rating: data.rating,
          timestamp: new Date().toISOString()
        });
      }
      break;
  }

  // Update timestamp
  userInterest.lastUpdated = new Date().toISOString();

  // Save user interests
  return saveUserInterests(userInterests);
}

/**
 * Get user segment for personalized content
 * @param {string} userId - User ID
 * @returns {Object} User segment information
 */
function getUserSegment(userId) {
  // Load user interests
  const { userInterests, forumVectors } = loadRecommendationData();
  const userInterest = userInterests[userId];

  if (!userInterest) {
    return {
      segment: 'general',
      interests: [],
      recommendedServices: []
    };
  }

  // Analyze user data to determine segment
  let segment = 'general';
  const interests = [];
  const recommendedServices = [];

  // Add explicit interests
  if (userInterest.explicitInterests && userInterest.explicitInterests.length > 0) {
    interests.push(...userInterest.explicitInterests);
  }

  // Check for professional status
  const isProfessional = interests.some(interest =>
    interest.includes('professional') ||
    interest.includes('manager') ||
    interest.includes('executive')
  );

  // Check for stress indicators
  const hasStressInterest = interests.some(interest =>
    interest.includes('stress') ||
    interest.includes('anxiety') ||
    interest.includes('burnout')
  );

  // Check for mindfulness interest
  const hasMindfulnessInterest = interests.some(interest =>
    interest.includes('mindfulness') ||
    interest.includes('meditation') ||
    interest.includes('wellbeing')
  );

  // Check for work-life balance interest
  const hasWorkLifeInterest = interests.some(interest =>
    interest.includes('balance') ||
    interest.includes('time management') ||
    interest.includes('productivity')
  );

  // Determine segment
  if (isProfessional && hasStressInterest) {
    segment = 'stressed-professional';
    recommendedServices.push('executive coaching', 'stress management workshops');
  } else if (isProfessional && hasWorkLifeInterest) {
    segment = 'busy-professional';
    recommendedServices.push('time management coaching', 'productivity consulting');
  } else if (hasMindfulnessInterest) {
    segment = 'wellness-focused';
    recommendedServices.push('meditation courses', 'mindfulness coaching');
  } else if (hasStressInterest) {
    segment = 'stress-management';
    recommendedServices.push('stress relief workshops', 'anxiety management');
  } else if (hasWorkLifeInterest) {
    segment = 'work-life-balance';
    recommendedServices.push('life coaching', 'work-life balance consulting');
  }

  // Get top forum based on scores
  const topForums = calculateForumScores(userId).slice(0, 2);
  const recommendedForumIds = topForums.map(f => f.forum.id);

  // Get top 2 topics
  const recommendedTopics = [];
  recommendedForumIds.forEach(forumId => {
    const topTopics = calculateTopicScores(userId, forumId).slice(0, 1);
    recommendedTopics.push(...topTopics.map(t => t.topic.id));
  });

  return {
    segment,
    interests: interests.slice(0, 5),
    recommendedServices,
    recommendedForums: recommendedForumIds,
    recommendedTopics
  };
}

module.exports = {
  getForumRecommendations,
  getTopicRecommendations,
  trackUserInteraction,
  getUserSegment
};
