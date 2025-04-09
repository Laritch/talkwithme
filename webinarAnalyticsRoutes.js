import express from 'express';
import {
  getWebinarAnalytics,
  getEngagementHeatmap,
  getComparativeAnalytics,
  getAudienceDemographics
} from '../controllers/webinarAnalyticsController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// All analytics routes require authentication
router.use(authMiddleware);

// Detailed analytics for a specific webinar
router.get('/:id', getWebinarAnalytics);

// Engagement heatmap for a specific webinar
router.get('/:id/heatmap', getEngagementHeatmap);

// Audience demographics for a specific webinar
router.get('/:id/demographics', getAudienceDemographics);

// Comparative analytics across multiple webinars
router.get('/compare', getComparativeAnalytics);

export default router;
