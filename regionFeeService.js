/**
 * Region Fee Service
 *
 * Service for managing region-specific fee configurations, commission calculations,
 * and fee-related operations.
 */

import RegionFeeConfig from '../models/regionFeeConfigModel.js';
import { normalizeRegion, getCurrencyForRegion, convertCurrency } from '../utils/paymentUtils.js';
import logger from '../utils/logger.js';

/**
 * Get all active region fee configurations
 * @returns {Promise<Array>} List of active fee configurations
 */
export const getAllRegionFees = async () => {
  try {
    return await RegionFeeConfig.find({ isActive: true }).sort({ displayName: 1 });
  } catch (error) {
    logger.error('Error fetching region fees:', error);
    throw error;
  }
};

/**
 * Get fee configuration for a specific region
 * @param {string} region - Region code
 * @returns {Promise<Object>} Fee configuration
 */
export const getRegionFeeConfig = async (region) => {
  try {
    const normalizedRegion = normalizeRegion(region);

    // Try to find exact match first
    let feeConfig = await RegionFeeConfig.findOne({
      region: normalizedRegion,
      isActive: true
    });

    // If no exact match, fall back to default for the currency
    if (!feeConfig) {
      const currency = getCurrencyForRegion(normalizedRegion);
      feeConfig = await RegionFeeConfig.findOne({
        currency,
        isActive: true
      });
    }

    // If still no match, use global default
    if (!feeConfig) {
      feeConfig = await RegionFeeConfig.findOne({
        region: 'global',
        isActive: true
      });
    }

    return feeConfig;
  } catch (error) {
    logger.error(`Error fetching fee config for region ${region}:`, error);
    throw error;
  }
};

/**
 * Create a new region fee configuration
 * @param {Object} feeData - Fee configuration data
 * @param {Object} [userData] - User data for history tracking
 * @returns {Promise<Object>} Created fee configuration
 */
export const createRegionFee = async (feeData, userData = {}) => {
  try {
    // Normalize region code
    const normalizedRegion = normalizeRegion(feeData.region);

    // Check if configuration already exists for this region
    const existingConfig = await RegionFeeConfig.findOne({ region: normalizedRegion });
    if (existingConfig) {
      throw new Error(`Fee configuration already exists for region: ${normalizedRegion}`);
    }

    // Add initial history entry
    const historyEntry = {
      timestamp: new Date(),
      userId: userData.userId,
      userName: userData.userName || 'System',
      previousValues: null,
      newValues: { ...feeData, region: normalizedRegion },
      notes: 'Initial fee configuration creation'
    };

    // Create new configuration with history
    const feeConfig = new RegionFeeConfig({
      ...feeData,
      region: normalizedRegion,
      history: [historyEntry]
    });

    await feeConfig.save();
    return feeConfig;
  } catch (error) {
    logger.error('Error creating region fee configuration:', error);
    throw error;
  }
};

/**
 * Update an existing region fee configuration
 * @param {string} id - Fee configuration ID
 * @param {Object} feeData - Updated fee data
 * @param {Object} [userData] - User data for history tracking
 * @param {string} [notes] - Optional notes about the update
 * @returns {Promise<Object>} Updated fee configuration
 */
export const updateRegionFee = async (id, feeData, userData = {}, notes = '') => {
  try {
    // If region is being updated, normalize it
    if (feeData.region) {
      feeData.region = normalizeRegion(feeData.region);
    }

    // Set options for history tracking
    const options = {
      new: true,
      userId: userData.userId,
      userName: userData.userName || 'System',
      notes
    };

    const updatedConfig = await RegionFeeConfig.findByIdAndUpdate(
      id,
      feeData,
      options
    );

    if (!updatedConfig) {
      throw new Error(`Fee configuration not found with ID: ${id}`);
    }

    return updatedConfig;
  } catch (error) {
    logger.error(`Error updating region fee configuration ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a region fee configuration
 * @param {string} id - Fee configuration ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteRegionFee = async (id) => {
  try {
    const result = await RegionFeeConfig.findByIdAndDelete(id);

    if (!result) {
      throw new Error(`Fee configuration not found with ID: ${id}`);
    }

    return { success: true, message: 'Fee configuration deleted successfully' };
  } catch (error) {
    logger.error(`Error deleting region fee configuration ${id}:`, error);
    throw error;
  }
};

/**
 * Calculate commission for a transaction in a specific region
 * @param {string} region - Region code
 * @param {number} amount - Transaction amount
 * @param {Object} expertData - Expert data including earnings and subscription
 * @returns {Promise<Object>} Commission details
 */
export const calculateCommission = async (region, amount, expertData = {}) => {
  try {
    const { totalEarnings = 0, subscriptionTier = null } = expertData;

    // Get region fee configuration
    const feeConfig = await getRegionFeeConfig(region);

    if (!feeConfig) {
      throw new Error(`No fee configuration found for region: ${region}`);
    }

    let commissionRate = feeConfig.baseCommissionPercentage;
    let fixedFee = feeConfig.transactionFee || 0;

    // Check if there's an active promotional rate
    if (feeConfig.promotionalRate && feeConfig.promotionalRate.enabled) {
      const now = new Date();
      const startDate = new Date(feeConfig.promotionalRate.startDate);
      const endDate = new Date(feeConfig.promotionalRate.endDate);

      if (now >= startDate && now <= endDate) {
        commissionRate = feeConfig.promotionalRate.baseCommissionPercentage;
      }
    }

    // Check if tiered commission should be used
    if (feeConfig.useCommissionTiers && feeConfig.commissionTiers.length > 0) {
      // Find the highest tier that the expert qualifies for
      const applicableTiers = feeConfig.commissionTiers
        .filter(tier => totalEarnings >= tier.minEarnings)
        .sort((a, b) => b.minEarnings - a.minEarnings);

      if (applicableTiers.length > 0) {
        commissionRate = applicableTiers[0].commissionPercentage;
        fixedFee = applicableTiers[0].fixedFee || fixedFee;
      }
    }

    // Check if subscription affects commission rate
    if (feeConfig.useSubscription && subscriptionTier) {
      const subscription = feeConfig.subscriptionTiers.find(tier => tier.name === subscriptionTier);
      if (subscription && subscription.commissionPercentage !== undefined) {
        commissionRate = subscription.commissionPercentage;
      }
    }

    // Calculate commission
    const percentageCommission = (amount * commissionRate) / 100;
    const totalCommission = percentageCommission + fixedFee;

    // Ensure commission doesn't exceed amount
    const finalCommission = Math.min(totalCommission, amount);

    return {
      amount,
      commissionRate,
      fixedFee,
      percentageCommission,
      totalCommission: finalCommission,
      netAmount: amount - finalCommission,
      currency: feeConfig.currency
    };
  } catch (error) {
    logger.error(`Error calculating commission for region ${region}:`, error);
    throw error;
  }
};

/**
 * Get initial fee for experts in a specific region
 * @param {string} region - Region code
 * @returns {Promise<Object>} Initial fee details
 */
export const getInitialFee = async (region) => {
  try {
    const feeConfig = await getRegionFeeConfig(region);

    if (!feeConfig) {
      throw new Error(`No fee configuration found for region: ${region}`);
    }

    return {
      initialFee: feeConfig.initialFee,
      currency: feeConfig.currency,
      waivable: feeConfig.initialFeeWaivable
    };
  } catch (error) {
    logger.error(`Error getting initial fee for region ${region}:`, error);
    throw error;
  }
};

/**
 * Get historical changes for a specific region fee configuration
 * @param {string} id - Fee configuration ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} History entries
 */
export const getFeeHistory = async (id, options = {}) => {
  try {
    const { limit = 50, skip = 0, startDate, endDate } = options;

    // Prepare query filters for date range
    const query = { _id: id };
    const projection = { history: { $slice: [skip, limit] } };

    if (startDate || endDate) {
      query['history.timestamp'] = {};
      if (startDate) {
        query['history.timestamp'].$gte = new Date(startDate);
      }
      if (endDate) {
        query['history.timestamp'].$lte = new Date(endDate);
      }
    }

    const feeConfig = await RegionFeeConfig.findOne(query, projection);

    if (!feeConfig) {
      throw new Error(`Fee configuration not found with ID: ${id}`);
    }

    // Sort history by date, newest first
    return feeConfig.history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (error) {
    logger.error(`Error getting fee history for ID ${id}:`, error);
    throw error;
  }
};

/**
 * Update performance metrics for a region fee configuration
 * @param {string} region - Region code
 * @returns {Promise<Object>} Updated metrics
 */
export const updatePerformanceMetrics = async (region) => {
  try {
    const normalizedRegion = normalizeRegion(region);

    // Get the fee configuration
    const feeConfig = await RegionFeeConfig.findOne({ region: normalizedRegion });

    if (!feeConfig) {
      throw new Error(`Fee configuration not found for region: ${normalizedRegion}`);
    }

    // Get required models
    const Expert = (await import('../models/expertModel.js')).default;
    const Transaction = (await import('../models/transactionModel.js')).default;

    // Calculate the date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Count experts in the region
    const expertCount = await Expert.countDocuments({ region: normalizedRegion });

    // Get transactions for the last 30 days
    const transactions = await Transaction.find({
      'expertPayment.region': normalizedRegion,
      createdAt: { $gte: thirtyDaysAgo },
      status: 'completed'
    });

    // Calculate metrics
    const transactionVolume = transactions.length;
    const revenueLastMonth = transactions.reduce((sum, tx) => sum + (tx.platformFee?.amount || 0), 0);
    const avgTransactionSize = transactionVolume > 0
      ? transactions.reduce((sum, tx) => sum + tx.amount, 0) / transactionVolume
      : 0;

    // Calculate average revenue per expert
    const avgRevenuePerExpert = expertCount > 0 ? revenueLastMonth / expertCount : 0;

    // Calculate effective commission rate
    const totalTransactionAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const effectiveCommissionRate = totalTransactionAmount > 0
      ? (revenueLastMonth / totalTransactionAmount) * 100
      : feeConfig.baseCommissionPercentage;

    // Update the metrics
    const metrics = {
      expertCount,
      transactionVolume,
      revenueLastMonth,
      avgTransactionSize,
      avgRevenuePerExpert,
      effectiveCommissionRate,
      lastUpdated: new Date()
    };

    // Update the fee configuration
    const updatedConfig = await RegionFeeConfig.findOneAndUpdate(
      { region: normalizedRegion },
      { $set: { performanceMetrics: metrics } },
      { new: true }
    );

    return updatedConfig.performanceMetrics;
  } catch (error) {
    logger.error(`Error updating performance metrics for region ${region}:`, error);
    throw error;
  }
};

/**
 * Get recommended fee structure for a region
 * @param {string} region - Region code
 * @returns {Promise<Object>} Recommended fee structure
 */
export const getRecommendedFeeStructure = async (region) => {
  try {
    const normalizedRegion = normalizeRegion(region);

    // Get the current fee configuration
    const feeConfig = await getRegionFeeConfig(normalizedRegion);

    if (!feeConfig) {
      throw new Error(`Fee configuration not found for region: ${normalizedRegion}`);
    }

    // Get all fee configurations for benchmarking
    const allConfigs = await RegionFeeConfig.find({ isActive: true });

    // Get required models for revenue analysis
    const Transaction = (await import('../models/transactionModel.js')).default;

    // Calculate the date 90 days ago
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Get transactions for the last 90 days for this region
    const transactions = await Transaction.find({
      'expertPayment.region': normalizedRegion,
      createdAt: { $gte: ninetyDaysAgo },
      status: 'completed'
    });

    // Calculate current metrics based on transactions
    const transactionVolume = transactions.length;
    const totalTransactionAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const currentRevenue = transactions.reduce((sum, tx) => sum + (tx.platformFee?.amount || 0), 0);

    // Calculate average transaction metrics
    const avgTransactionSize = transactionVolume > 0 ? totalTransactionAmount / transactionVolume : 0;

    // Only proceed with recommendations if we have enough data
    if (transactionVolume < 10) {
      return {
        message: 'Insufficient transaction data for accurate recommendations',
        currentFeeStructure: {
          baseCommissionPercentage: feeConfig.baseCommissionPercentage,
          transactionFee: feeConfig.transactionFee,
          initialFee: feeConfig.initialFee
        },
        recommendedChanges: null,
        benchmarkData: null
      };
    }

    // Find similar regions by transaction volume and size
    const similarRegions = allConfigs
      .filter(config => config.region !== normalizedRegion)
      .filter(config => {
        const metrics = config.performanceMetrics || {};
        // Filter for regions with similar metrics (within 50% range)
        return (
          metrics.transactionVolume > transactionVolume * 0.5 &&
          metrics.transactionVolume < transactionVolume * 1.5 &&
          metrics.avgTransactionSize > avgTransactionSize * 0.5 &&
          metrics.avgTransactionSize < avgTransactionSize * 1.5
        );
      });

    // Calculate average commission rates from similar regions
    const avgCommissionRate = similarRegions.reduce((sum, config) => sum + config.baseCommissionPercentage, 0) /
      (similarRegions.length || 1);

    const avgTransactionFee = similarRegions.reduce((sum, config) => sum + (config.transactionFee || 0), 0) /
      (similarRegions.length || 1);

    // Analyze price elasticity and optimal fee structure
    // Simulate different fee structures and estimate revenue
    const simulations = [];
    const currentCommissionRate = feeConfig.baseCommissionPercentage;
    const currentFixedFee = feeConfig.transactionFee || 0;

    // Simulate different commission rates
    for (let rate = currentCommissionRate - 5; rate <= currentCommissionRate + 5; rate += 1) {
      if (rate < 1) continue; // Skip negative or zero rates

      // Estimate volume change based on rate difference (simple elasticity model)
      // Assuming 1% decrease in commission leads to 2% increase in volume
      const volumeChangeFactor = 1 + (currentCommissionRate - rate) * 0.02;
      const estimatedVolume = transactionVolume * volumeChangeFactor;

      // Estimate revenue
      const estimatedRevenue = (avgTransactionSize * estimatedVolume * rate / 100) +
        (currentFixedFee * estimatedVolume);

      simulations.push({
        commissionRate: rate,
        fixedFee: currentFixedFee,
        estimatedVolume,
        estimatedRevenue
      });
    }

    // Find the optimal fee structure from simulations
    simulations.sort((a, b) => b.estimatedRevenue - a.estimatedRevenue);
    const optimalStructure = simulations[0];

    // Prepare benchmark data
    const benchmarkData = similarRegions.map(config => ({
      region: config.region,
      displayName: config.displayName,
      baseCommissionPercentage: config.baseCommissionPercentage,
      transactionFee: config.transactionFee || 0,
      effectiveCommissionRate: config.performanceMetrics?.effectiveCommissionRate || config.baseCommissionPercentage,
      revenueLastMonth: config.performanceMetrics?.revenueLastMonth || 0
    }));

    // Prepare recommendations
    const recommendations = {
      message: optimalStructure.commissionRate !== currentCommissionRate
        ? `Adjusting your commission rate to ${optimalStructure.commissionRate}% could potentially increase revenue.`
        : 'Your current commission rate appears to be optimal.',
      currentFeeStructure: {
        baseCommissionPercentage: currentCommissionRate,
        transactionFee: currentFixedFee,
        initialFee: feeConfig.initialFee,
        estimatedMonthlyRevenue: currentRevenue / 3 // Convert 90-day revenue to monthly
      },
      recommendedChanges: {
        baseCommissionPercentage: optimalStructure.commissionRate,
        transactionFee: optimalStructure.fixedFee,
        potentialRevenueIncrease: optimalStructure.estimatedRevenue - (currentRevenue / 3),
        percentageIncrease: ((optimalStructure.estimatedRevenue / (currentRevenue / 3)) - 1) * 100
      },
      benchmarkData: {
        similarRegions: benchmarkData,
        averageCommissionRate: avgCommissionRate,
        averageTransactionFee: avgTransactionFee
      },
      simulations: simulations.slice(0, 5)
    };

    return recommendations;
  } catch (error) {
    logger.error(`Error generating fee recommendations for region ${region}:`, error);
    throw error;
  }
};

/**
 * Compare fee structures across regions with currency conversion
 * @param {Array} regionCodes - Array of region codes to compare
 * @param {string} baseCurrency - Currency to convert all values to
 * @returns {Promise<Object>} Comparison data
 */
export const compareFeeStructures = async (regionCodes, baseCurrency = 'USD') => {
  try {
    // Normalize region codes
    const normalizedRegions = regionCodes.map(region => normalizeRegion(region));

    // Get fee configurations for all specified regions
    const feeConfigs = await Promise.all(
      normalizedRegions.map(region => getRegionFeeConfig(region))
    );

    // Filter out any null configurations
    const validConfigs = feeConfigs.filter(config => config);

    if (validConfigs.length === 0) {
      throw new Error('No valid fee configurations found for the specified regions');
    }

    // Convert all currency values to the base currency
    const comparisonData = await Promise.all(validConfigs.map(async config => {
      // Convert monetary values
      const initialFee = await convertCurrency(
        config.initialFee,
        config.currency,
        baseCurrency
      );

      const transactionFee = await convertCurrency(
        config.transactionFee || 0,
        config.currency,
        baseCurrency
      );

      // Convert revenue metrics
      const metrics = config.performanceMetrics || {};
      const revenueLastMonth = await convertCurrency(
        metrics.revenueLastMonth || 0,
        config.currency,
        baseCurrency
      );

      const avgRevenuePerExpert = await convertCurrency(
        metrics.avgRevenuePerExpert || 0,
        config.currency,
        baseCurrency
      );

      const avgTransactionSize = await convertCurrency(
        metrics.avgTransactionSize || 0,
        config.currency,
        baseCurrency
      );

      return {
        region: config.region,
        displayName: config.displayName,
        originalCurrency: config.currency,
        feeStructure: {
          initialFee: {
            original: { value: config.initialFee, currency: config.currency },
            converted: { value: initialFee, currency: baseCurrency }
          },
          baseCommissionPercentage: config.baseCommissionPercentage,
          transactionFee: {
            original: { value: config.transactionFee || 0, currency: config.currency },
            converted: { value: transactionFee, currency: baseCurrency }
          },
          effectiveCommissionRate: metrics.effectiveCommissionRate || config.baseCommissionPercentage
        },
        metrics: {
          expertCount: metrics.expertCount || 0,
          transactionVolume: metrics.transactionVolume || 0,
          revenueLastMonth: {
            original: { value: metrics.revenueLastMonth || 0, currency: config.currency },
            converted: { value: revenueLastMonth, currency: baseCurrency }
          },
          avgRevenuePerExpert: {
            original: { value: metrics.avgRevenuePerExpert || 0, currency: config.currency },
            converted: { value: avgRevenuePerExpert, currency: baseCurrency }
          },
          avgTransactionSize: {
            original: { value: metrics.avgTransactionSize || 0, currency: config.currency },
            converted: { value: avgTransactionSize, currency: baseCurrency }
          }
        }
      };
    }));

    return {
      baseCurrency,
      regions: comparisonData,
      timestamp: new Date()
    };
  } catch (error) {
    logger.error(`Error comparing fee structures across regions:`, error);
    throw error;
  }
};

export default {
  getAllRegionFees,
  getRegionFeeConfig,
  createRegionFee,
  updateRegionFee,
  deleteRegionFee,
  calculateCommission,
  getInitialFee,
  getFeeHistory,
  updatePerformanceMetrics,
  getRecommendedFeeStructure,
  compareFeeStructures
};
