import Webinar from '../models/webinarModel.js';
import User from '../models/userModel.js';
import ApiError from '../utils/errorHandler.js';
import logger from '../utils/logger.js';

/**
 * Advanced Webinar Analytics Controller
 * Provides detailed metrics and insights for webinars
 */

/**
 * @desc    Get comprehensive analytics for a webinar
 * @route   GET /api/webinars/analytics/:id
 * @access  Private (Host only)
 */
export const getWebinarAnalytics = async (req, res, next) => {
  try {
    const webinarId = req.params.id;
    const userId = req.user.id;

    const webinar = await Webinar.findById(webinarId)
      .populate('registeredAttendees.user', 'name email profilePicture')
      .populate('host', 'name email');

    if (!webinar) {
      return next(new ApiError('Webinar not found', 404));
    }

    // Check if user is the host
    if (webinar.host._id.toString() !== userId) {
      return next(new ApiError('Only the host can view detailed analytics', 403));
    }

    // Build comprehensive analytics object
    const analytics = {
      overview: getOverviewMetrics(webinar),
      attendance: getAttendanceMetrics(webinar),
      engagement: getEngagementMetrics(webinar),
      questions: getQuestionMetrics(webinar),
      polls: getPollMetrics(webinar),
      feedback: getFeedbackMetrics(webinar),
      timeline: getTimelineData(webinar)
    };

    return res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error(`Error fetching webinar analytics: ${error}`);
    return next(new ApiError(error.message, 500));
  }
};

/**
 * @desc    Get engagement heatmap data for a webinar
 * @route   GET /api/webinars/analytics/:id/heatmap
 * @access  Private (Host only)
 */
export const getEngagementHeatmap = async (req, res, next) => {
  try {
    const webinarId = req.params.id;
    const userId = req.user.id;

    const webinar = await Webinar.findById(webinarId);

    if (!webinar) {
      return next(new ApiError('Webinar not found', 404));
    }

    // Check if user is the host
    if (webinar.host.toString() !== userId) {
      return next(new ApiError('Only the host can view engagement heatmap', 403));
    }

    // Generate heatmap data based on user activity
    // This requires detailed tracking of user activity over time
    const heatmapData = generateHeatmapData(webinar);

    return res.status(200).json({
      success: true,
      data: heatmapData
    });
  } catch (error) {
    logger.error(`Error fetching engagement heatmap: ${error}`);
    return next(new ApiError(error.message, 500));
  }
};

/**
 * @desc    Get comparative analytics across multiple webinars
 * @route   GET /api/webinars/analytics/compare
 * @access  Private (Host only)
 */
export const getComparativeAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { webinarIds } = req.query;

    if (!webinarIds || !Array.isArray(webinarIds) || webinarIds.length < 2) {
      return next(new ApiError('At least two webinar IDs are required for comparison', 400));
    }

    // Fetch all requested webinars
    const webinars = await Webinar.find({
      _id: { $in: webinarIds },
      host: userId
    });

    if (webinars.length < 2) {
      return next(new ApiError('At least two valid webinars are required for comparison', 400));
    }

    // Generate comparative analytics
    const comparativeData = generateComparativeAnalytics(webinars);

    return res.status(200).json({
      success: true,
      data: comparativeData
    });
  } catch (error) {
    logger.error(`Error fetching comparative analytics: ${error}`);
    return next(new ApiError(error.message, 500));
  }
};

/**
 * @desc    Get audience demographic data for a webinar
 * @route   GET /api/webinars/analytics/:id/demographics
 * @access  Private (Host only)
 */
export const getAudienceDemographics = async (req, res, next) => {
  try {
    const webinarId = req.params.id;
    const userId = req.user.id;

    const webinar = await Webinar.findById(webinarId)
      .populate('registeredAttendees.user', 'name email country timezone language');

    if (!webinar) {
      return next(new ApiError('Webinar not found', 404));
    }

    // Check if user is the host
    if (webinar.host.toString() !== userId) {
      return next(new ApiError('Only the host can view audience demographics', 403));
    }

    // Generate demographic data
    const demographics = generateDemographicData(webinar);

    return res.status(200).json({
      success: true,
      data: demographics
    });
  } catch (error) {
    logger.error(`Error fetching audience demographics: ${error}`);
    return next(new ApiError(error.message, 500));
  }
};

/**
 * HELPER FUNCTIONS FOR ANALYTICS GENERATION
 */

/**
 * Generate overview metrics for a webinar
 * @param {Object} webinar - Webinar document
 * @returns {Object} Overview metrics
 */
function getOverviewMetrics(webinar) {
  const registeredCount = webinar.registeredAttendees.length;
  const attendedCount = webinar.registeredAttendees.filter(a => a.attended).length;

  return {
    title: webinar.title,
    host: webinar.host.name,
    status: webinar.status,
    startTime: webinar.startTime,
    endTime: webinar.endTime,
    duration: webinar.duration,
    category: webinar.category,
    registrations: {
      total: registeredCount,
      capacity: webinar.capacity,
      fillRate: registeredCount > 0 ? Math.round((registeredCount / webinar.capacity) * 100) : 0
    },
    attendance: {
      total: attendedCount,
      rate: registeredCount > 0 ? Math.round((attendedCount / registeredCount) * 100) : 0
    },
    engagement: {
      questionCount: webinar.questions.length,
      pollCount: webinar.polls.length,
      pollResponseRate: getPollResponseRate(webinar),
      satisfactionScore: webinar.analytics.satisfactionScore || 0
    }
  };
}

/**
 * Generate attendance metrics for a webinar
 * @param {Object} webinar - Webinar document
 * @returns {Object} Attendance metrics
 */
function getAttendanceMetrics(webinar) {
  const attendees = webinar.registeredAttendees.filter(a => a.attended);

  // Calculate join/leave distribution (when people joined/left)
  const joinDistribution = {};
  const leaveDistribution = {};

  attendees.forEach(attendee => {
    if (attendee.joinedAt) {
      const joinHour = new Date(attendee.joinedAt).getHours();
      joinDistribution[joinHour] = (joinDistribution[joinHour] || 0) + 1;
    }

    if (attendee.leftAt) {
      const leaveHour = new Date(attendee.leftAt).getHours();
      leaveDistribution[leaveHour] = (leaveDistribution[leaveHour] || 0) + 1;
    }
  });

  // Calculate average time spent
  let totalMinutes = 0;
  let attendeesWithDuration = 0;

  attendees.forEach(attendee => {
    if (attendee.joinedAt && attendee.leftAt) {
      const durationMs = attendee.leftAt - attendee.joinedAt;
      const durationMinutes = Math.round(durationMs / 60000);
      totalMinutes += durationMinutes;
      attendeesWithDuration++;
    }
  });

  const averageTimeSpent = attendeesWithDuration > 0 ? Math.round(totalMinutes / attendeesWithDuration) : 0;

  // Calculate retention rate (% who stayed for at least 80% of the webinar)
  let retentionCount = 0;

  if (webinar.duration) {
    const minRetentionTime = webinar.duration * 0.8; // 80% of total duration

    attendees.forEach(attendee => {
      if (attendee.joinedAt && attendee.leftAt) {
        const durationMs = attendee.leftAt - attendee.joinedAt;
        const durationMinutes = Math.round(durationMs / 60000);

        if (durationMinutes >= minRetentionTime) {
          retentionCount++;
        }
      }
    });
  }

  const retentionRate = attendees.length > 0 ? Math.round((retentionCount / attendees.length) * 100) : 0;

  return {
    total: attendees.length,
    averageTimeSpentMinutes: averageTimeSpent,
    retentionRate,
    maxConcurrentViewers: webinar.analytics.maxConcurrentViewers || 0,
    joinDistribution,
    leaveDistribution,
    attendeesList: attendees.map(a => ({
      name: a.name,
      email: a.email,
      joinedAt: a.joinedAt,
      leftAt: a.leftAt,
      duration: a.joinedAt && a.leftAt ? Math.round((a.leftAt - a.joinedAt) / 60000) : null
    }))
  };
}

/**
 * Generate engagement metrics for a webinar
 * @param {Object} webinar - Webinar document
 * @returns {Object} Engagement metrics
 */
function getEngagementMetrics(webinar) {
  const attendeeCount = webinar.registeredAttendees.filter(a => a.attended).length;

  // Calculate engagement score based on various factors
  let engagementScore = 0;

  if (attendeeCount > 0) {
    // Questions engagement (weight: 30%)
    const questionsPerAttendee = webinar.questions.length / attendeeCount;
    const questionScore = Math.min(questionsPerAttendee * 10, 30);

    // Polls engagement (weight: 30%)
    const pollResponseRate = getPollResponseRate(webinar);
    const pollScore = pollResponseRate * 0.3;

    // Chat activity (weight: 20%)
    // This would require tracking chat messages which isn't in the model currently
    const chatScore = 0; // Placeholder

    // Time spent (weight: 20%)
    const averageAttendanceRate = getAverageAttendanceRate(webinar);
    const timeScore = averageAttendanceRate * 0.2;

    engagementScore = Math.round(questionScore + pollScore + chatScore + timeScore);
  }

  return {
    score: engagementScore,
    questionActivity: {
      total: webinar.questions.length,
      answered: webinar.questions.filter(q => q.isAnswered).length,
      perAttendee: attendeeCount > 0 ? (webinar.questions.length / attendeeCount).toFixed(2) : 0
    },
    pollActivity: {
      total: webinar.polls.length,
      responseRate: getPollResponseRate(webinar)
    },
    feedbackSubmission: {
      rate: getFeedbackSubmissionRate(webinar)
    }
  };
}

/**
 * Generate question metrics for a webinar
 * @param {Object} webinar - Webinar document
 * @returns {Object} Question metrics
 */
function getQuestionMetrics(webinar) {
  // Organize questions by timing
  const questionsByTime = {};

  webinar.questions.forEach(question => {
    const askedAt = new Date(question.askedAt);
    const webinarStartTime = new Date(webinar.startTime);

    // Calculate minutes from webinar start
    const minutesFromStart = Math.round((askedAt - webinarStartTime) / 60000);

    // Group by 5-minute intervals
    const timeKey = Math.floor(minutesFromStart / 5) * 5;
    questionsByTime[timeKey] = (questionsByTime[timeKey] || 0) + 1;
  });

  // Top question keywords (simple implementation)
  const keywords = {};

  webinar.questions.forEach(question => {
    const words = question.question.toLowerCase().split(/\W+/).filter(w => w.length > 3);

    words.forEach(word => {
      keywords[word] = (keywords[word] || 0) + 1;
    });
  });

  // Sort keywords by frequency
  const topKeywords = Object.entries(keywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  return {
    total: webinar.questions.length,
    answered: webinar.questions.filter(q => q.isAnswered).length,
    answerRate: webinar.questions.length > 0
      ? Math.round((webinar.questions.filter(q => q.isAnswered).length / webinar.questions.length) * 100)
      : 0,
    questionsByTime,
    topKeywords,
    questionsList: webinar.questions.map(q => ({
      question: q.question,
      askedAt: q.askedAt,
      isAnswered: q.isAnswered,
      answeredAt: q.answeredAt,
      upvotes: q.upvotes
    }))
  };
}

/**
 * Generate poll metrics for a webinar
 * @param {Object} webinar - Webinar document
 * @returns {Object} Poll metrics
 */
function getPollMetrics(webinar) {
  const polls = webinar.polls.map(poll => {
    const totalResponses = poll.responses.length;
    const responseRate = webinar.registeredAttendees.filter(a => a.attended).length > 0
      ? (totalResponses / webinar.registeredAttendees.filter(a => a.attended).length) * 100
      : 0;

    // Process options and results
    const options = poll.options.map(option => ({
      text: option.text,
      count: option.count,
      percentage: totalResponses > 0 ? Math.round((option.count / totalResponses) * 100) : 0
    }));

    return {
      question: poll.question,
      createdAt: poll.createdAt,
      endedAt: poll.endedAt,
      isActive: poll.isActive,
      totalResponses,
      responseRate: Math.round(responseRate),
      options
    };
  });

  return {
    total: webinar.polls.length,
    averageResponseRate: getPollResponseRate(webinar),
    polls
  };
}

/**
 * Generate feedback metrics for a webinar
 * @param {Object} webinar - Webinar document
 * @returns {Object} Feedback metrics
 */
function getFeedbackMetrics(webinar) {
  const attendees = webinar.registeredAttendees.filter(a => a.attended);
  const feedbackSubmissions = attendees.filter(a => a.feedback && a.feedback.rating);

  // Rating distribution
  const ratingDistribution = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0
  };

  feedbackSubmissions.forEach(attendee => {
    if (attendee.feedback && attendee.feedback.rating) {
      ratingDistribution[attendee.feedback.rating] = (ratingDistribution[attendee.feedback.rating] || 0) + 1;
    }
  });

  // Feedback comments
  const comments = feedbackSubmissions
    .filter(a => a.feedback && a.feedback.comment)
    .map(a => ({
      name: a.name,
      rating: a.feedback.rating,
      comment: a.feedback.comment,
      submittedAt: a.feedback.submittedAt
    }));

  return {
    submissionCount: feedbackSubmissions.length,
    submissionRate: attendees.length > 0 ? Math.round((feedbackSubmissions.length / attendees.length) * 100) : 0,
    averageRating: feedbackSubmissions.length > 0
      ? (feedbackSubmissions.reduce((sum, a) => sum + a.feedback.rating, 0) / feedbackSubmissions.length).toFixed(1)
      : 0,
    ratingDistribution,
    comments
  };
}

/**
 * Generate timeline data for a webinar
 * @param {Object} webinar - Webinar document
 * @returns {Object} Timeline data
 */
function getTimelineData(webinar) {
  const startTime = new Date(webinar.startTime);
  const endTime = new Date(webinar.endTime);
  const duration = webinar.duration || Math.round((endTime - startTime) / 60000);

  // Create timeline segments (5-minute intervals)
  const segmentCount = Math.ceil(duration / 5);
  const timeline = [];

  for (let i = 0; i < segmentCount; i++) {
    const segmentStart = new Date(startTime.getTime() + i * 5 * 60000);
    const segmentEnd = new Date(Math.min(segmentStart.getTime() + 5 * 60000, endTime.getTime()));

    timeline.push({
      segment: i,
      timeRange: `${segmentStart.toLocaleTimeString()} - ${segmentEnd.toLocaleTimeString()}`,
      startMinute: i * 5,
      endMinute: Math.min((i + 1) * 5, duration),
      attendance: 0,
      questions: 0,
      pollResponses: 0
    });
  }

  // Populate attendance data
  webinar.registeredAttendees.forEach(attendee => {
    if (attendee.joinedAt && attendee.leftAt) {
      const joinTime = new Date(attendee.joinedAt);
      const leaveTime = new Date(attendee.leftAt);

      // Find which segments this attendee was present for
      for (let i = 0; i < timeline.length; i++) {
        const segmentStart = new Date(startTime.getTime() + i * 5 * 60000);
        const segmentEnd = new Date(Math.min(segmentStart.getTime() + 5 * 60000, endTime.getTime()));

        // Check if attendee was present during this segment
        if (joinTime <= segmentEnd && leaveTime >= segmentStart) {
          timeline[i].attendance++;
        }
      }
    }
  });

  // Populate question data
  webinar.questions.forEach(question => {
    const askedAt = new Date(question.askedAt);

    // Find which segment this question belongs to
    for (let i = 0; i < timeline.length; i++) {
      const segmentStart = new Date(startTime.getTime() + i * 5 * 60000);
      const segmentEnd = new Date(Math.min(segmentStart.getTime() + 5 * 60000, endTime.getTime()));

      if (askedAt >= segmentStart && askedAt < segmentEnd) {
        timeline[i].questions++;
        break;
      }
    }
  });

  // Populate poll response data
  webinar.polls.forEach(poll => {
    poll.responses.forEach(response => {
      const submittedAt = new Date(response.submittedAt);

      // Find which segment this poll response belongs to
      for (let i = 0; i < timeline.length; i++) {
        const segmentStart = new Date(startTime.getTime() + i * 5 * 60000);
        const segmentEnd = new Date(Math.min(segmentStart.getTime() + 5 * 60000, endTime.getTime()));

        if (submittedAt >= segmentStart && submittedAt < segmentEnd) {
          timeline[i].pollResponses++;
          break;
        }
      }
    });
  });

  return timeline;
}

/**
 * Generate heatmap data for a webinar
 * @param {Object} webinar - Webinar document
 * @returns {Object} Heatmap data
 */
function generateHeatmapData(webinar) {
  // This is a placeholder for a more sophisticated engagement heatmap
  // In a real implementation, this would use detailed tracking data

  const startTime = new Date(webinar.startTime);
  const duration = webinar.duration || 60; // minutes

  // Create a timeline with 1-minute intervals
  const heatmap = [];

  for (let minute = 0; minute < duration; minute++) {
    // Calculate a mock engagement score for this minute
    // In a real implementation, this would be based on actual user activity
    const mockEngagement = Math.random() * 100;

    heatmap.push({
      minute,
      time: new Date(startTime.getTime() + minute * 60000).toLocaleTimeString(),
      engagementScore: Math.round(mockEngagement)
    });
  }

  return heatmap;
}

/**
 * Generate comparative analytics for multiple webinars
 * @param {Array} webinars - Array of webinar documents
 * @returns {Object} Comparative analytics
 */
function generateComparativeAnalytics(webinars) {
  const comparison = webinars.map(webinar => {
    const attendeeCount = webinar.registeredAttendees.filter(a => a.attended).length;
    const registeredCount = webinar.registeredAttendees.length;

    return {
      id: webinar._id,
      title: webinar.title,
      date: webinar.startTime,
      metrics: {
        registrations: registeredCount,
        attendees: attendeeCount,
        attendanceRate: registeredCount > 0 ? Math.round((attendeeCount / registeredCount) * 100) : 0,
        averageAttendanceTime: webinar.analytics.averageAttendanceTime || 0,
        questions: webinar.questions.length,
        questionsPerAttendee: attendeeCount > 0 ? (webinar.questions.length / attendeeCount).toFixed(2) : 0,
        pollResponseRate: getPollResponseRate(webinar),
        satisfactionScore: webinar.analytics.satisfactionScore || 0
      }
    };
  });

  return {
    webinars: comparison,
    keyMetrics: [
      { name: 'Registrations', key: 'registrations' },
      { name: 'Attendance Rate %', key: 'attendanceRate' },
      { name: 'Avg. Attendance (min)', key: 'averageAttendanceTime' },
      { name: 'Questions per Attendee', key: 'questionsPerAttendee' },
      { name: 'Poll Response Rate %', key: 'pollResponseRate' },
      { name: 'Satisfaction Score', key: 'satisfactionScore' }
    ]
  };
}

/**
 * Generate demographic data for a webinar audience
 * @param {Object} webinar - Webinar document
 * @returns {Object} Demographic data
 */
function generateDemographicData(webinar) {
  // This is a placeholder that would use real user data in a production environment
  // In this version, we just return simulated data

  return {
    message: 'Demographic data requires additional user profile information',
    simulatedData: {
      countries: [
        { name: 'United States', count: 45 },
        { name: 'India', count: 22 },
        { name: 'United Kingdom', count: 15 },
        { name: 'Canada', count: 12 },
        { name: 'Australia', count: 8 }
      ],
      languages: [
        { name: 'English', count: 80 },
        { name: 'Spanish', count: 12 },
        { name: 'Hindi', count: 10 },
        { name: 'French', count: 5 },
        { name: 'German', count: 3 }
      ],
      timezones: [
        { name: 'UTC-5 (Eastern)', count: 30 },
        { name: 'UTC+1 (Central European)', count: 25 },
        { name: 'UTC+5:30 (India)', count: 20 },
        { name: 'UTC-8 (Pacific)', count: 15 },
        { name: 'UTC+10 (Australia Eastern)', count: 10 }
      ]
    }
  };
}

/**
 * Calculate poll response rate
 * @param {Object} webinar - Webinar document
 * @returns {number} Response rate percentage
 */
function getPollResponseRate(webinar) {
  if (webinar.polls.length === 0 || webinar.registeredAttendees.filter(a => a.attended).length === 0) {
    return 0;
  }

  const totalPossibleResponses = webinar.polls.length * webinar.registeredAttendees.filter(a => a.attended).length;
  const totalResponses = webinar.polls.reduce((sum, poll) => sum + poll.responses.length, 0);

  return Math.round((totalResponses / totalPossibleResponses) * 100);
}

/**
 * Calculate average attendance rate (time attended / total duration)
 * @param {Object} webinar - Webinar document
 * @returns {number} Attendance rate percentage
 */
function getAverageAttendanceRate(webinar) {
  const attendees = webinar.registeredAttendees.filter(a => a.attended);

  if (attendees.length === 0 || !webinar.duration) {
    return 0;
  }

  let totalAttendanceRate = 0;

  attendees.forEach(attendee => {
    if (attendee.joinedAt && attendee.leftAt) {
      const attendanceTime = (attendee.leftAt - attendee.joinedAt) / 60000; // in minutes
      const attendanceRate = Math.min(attendanceTime / webinar.duration, 1); // cap at 100%
      totalAttendanceRate += attendanceRate;
    }
  });

  return Math.round((totalAttendanceRate / attendees.length) * 100);
}

/**
 * Calculate feedback submission rate
 * @param {Object} webinar - Webinar document
 * @returns {number} Feedback submission rate percentage
 */
function getFeedbackSubmissionRate(webinar) {
  const attendees = webinar.registeredAttendees.filter(a => a.attended);

  if (attendees.length === 0) {
    return 0;
  }

  const feedbackCount = attendees.filter(a => a.feedback && a.feedback.rating).length;

  return Math.round((feedbackCount / attendees.length) * 100);
}
