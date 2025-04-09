/**
 * Pricing Optimization Algorithm
 * Analyzes market data and expert performance to recommend optimal pricing
 */

class PricingOptimizer {
  constructor() {
    this.marketData = {}; // Market price data by category
    this.expertData = {}; // Expert performance data
    this.elasticityModel = {}; // Price elasticity by category
    this.confidenceThreshold = 0.7; // Minimum confidence to make recommendation
  }

  /**
   * Initialize with market and expert data
   * @param {Object} data - Contains market and expert data
   */
  initialize(data) {
    if (data.market) this.marketData = data.market;
    if (data.experts) this.expertData = data.experts;
    this.calculateElasticityModels();
    console.log("Pricing optimizer initialized with data for",
      Object.keys(this.marketData).length, "categories and",
      Object.keys(this.expertData).length, "experts");
  }

  /**
   * Calculate price elasticity models from historical data
   * Price elasticity = % change in demand / % change in price
   */
  calculateElasticityModels() {
    Object.keys(this.marketData).forEach(category => {
      const categoryData = this.marketData[category];
      this.elasticityModel[category] = {};

      // For each consultation duration, calculate elasticity
      Object.keys(categoryData.durations).forEach(duration => {
        const durationData = categoryData.durations[duration];

        // Calculate elasticity if we have price variation data
        if (durationData.pricePoints && durationData.pricePoints.length > 1) {
          // Sort by price
          durationData.pricePoints.sort((a, b) => a.price - b.price);

          // Calculate elasticity between adjacent price points
          const elasticities = [];
          for (let i = 1; i < durationData.pricePoints.length; i++) {
            const lowerPoint = durationData.pricePoints[i-1];
            const higherPoint = durationData.pricePoints[i];

            const priceDiff = (higherPoint.price - lowerPoint.price) / lowerPoint.price;
            const bookingDiff = (lowerPoint.bookingRate - higherPoint.bookingRate) / lowerPoint.bookingRate;

            if (priceDiff > 0) {
              elasticities.push(bookingDiff / priceDiff);
            }
          }

          // Use average elasticity
          if (elasticities.length > 0) {
            this.elasticityModel[category][duration] =
              elasticities.reduce((sum, e) => sum + e, 0) / elasticities.length;
          } else {
            // Default elasticity if calculation not possible
            this.elasticityModel[category][duration] = 1.0; // Unit elasticity as default
          }
        } else {
          // Use category default if no specific data
          this.elasticityModel[category][duration] =
            categoryData.defaultElasticity || 1.0;
        }
      });
    });

    console.log("Elasticity models calculated:", this.elasticityModel);
  }

  /**
   * Generate pricing recommendations for an expert
   * @param {string} expertId - Expert ID
   * @returns {Array} Array of pricing recommendations
   */
  generateRecommendations(expertId) {
    const expert = this.expertData[expertId];
    if (!expert) {
      console.error(`No data for expert: ${expertId}`);
      return [];
    }

    const recommendations = [];
    const category = expert.category;
    const categoryMarket = this.marketData[category];

    if (!categoryMarket) {
      console.error(`No market data for category: ${category}`);
      return [];
    }

    // Analyze each consultation type the expert offers
    Object.keys(expert.consultationTypes).forEach(duration => {
      const consultationType = expert.consultationTypes[duration];
      const currentPrice = consultationType.price;

      // Skip if not enough booking data
      if (consultationType.totalSessions < 10) {
        return;
      }

      // Get market data for this duration
      const durationMarket = categoryMarket.durations[duration];
      if (!durationMarket) {
        return; // Skip if no market data for this duration
      }

      // Calculate potential optimal price
      const recommendation = this.calculateOptimalPrice(
        expert,
        category,
        duration,
        currentPrice,
        durationMarket
      );

      if (recommendation) {
        recommendations.push(recommendation);
      }
    });

    return recommendations;
  }

  /**
   * Calculate optimal price for a consultation type
   * @param {Object} expert - Expert data
   * @param {string} category - Expert category
   * @param {string} duration - Consultation duration
   * @param {number} currentPrice - Current price
   * @param {Object} marketData - Market data for this duration
   * @returns {Object|null} Recommendation object or null if no recommendation
   */
  calculateOptimalPrice(expert, category, duration, currentPrice, marketData) {
    // Get expert's performance metrics
    const consultationType = expert.consultationTypes[duration];
    const bookingRate = consultationType.bookedSessions / consultationType.totalSessions;
    const expertRating = expert.performanceMetrics.rating;

    // Get market data
    const avgPrice = marketData.avgPrice;
    const avgRating = marketData.avgRating;
    const elasticity = this.elasticityModel[category][duration];

    // Start with market average as baseline
    let optimalPrice = avgPrice;
    let confidence = 0.5; // Start with medium confidence
    const reasons = [];

    // Factor 1: Adjust based on expert rating compared to market average
    if (expertRating > avgRating) {
      // Expert can charge premium based on rating difference
      const ratingDifference = expertRating - avgRating;
      const ratingPremiumFactor = 1 + (ratingDifference / avgRating) * 0.5;
      optimalPrice *= ratingPremiumFactor;

      const premiumPercent = Math.round((ratingPremiumFactor - 1) * 100);
      reasons.push(`Rating is ${ratingDifference.toFixed(1)} stars above average (${premiumPercent}% premium)`);
      confidence += 0.1;
    } else if (expertRating < avgRating) {
      // Expert may need to discount based on rating difference
      const ratingDifference = avgRating - expertRating;
      const ratingDiscountFactor = 1 - (ratingDifference / avgRating) * 0.3;
      optimalPrice *= ratingDiscountFactor;

      const discountPercent = Math.round((1 - ratingDiscountFactor) * 100);
      reasons.push(`Rating is ${ratingDifference.toFixed(1)} stars below average (${discountPercent}% discount)`);
      confidence += 0.05;
    } else {
      reasons.push('Rating is at market average');
    }

    // Factor 2: Adjust for current booking rate
    if (bookingRate > 0.85) {
      // High demand - could increase price
      optimalPrice *= 1.1;
      reasons.push(`High demand (${Math.round(bookingRate * 100)}% booking rate)`);
      confidence += 0.15;
    } else if (bookingRate < 0.4) {
      // Low demand - may need to decrease price
      optimalPrice *= 0.9;
      reasons.push(`Low demand (${Math.round(bookingRate * 100)}% booking rate)`);
      confidence += 0.1;
    } else {
      reasons.push(`Moderate demand (${Math.round(bookingRate * 100)}% booking rate)`);
    }

    // Factor 3: Adjust if current price is far from optimal
    const currentPriceDifference = Math.abs(currentPrice - optimalPrice) / currentPrice;

    if (currentPriceDifference > 0.2) {
      // Large gap between current and optimal
      confidence += 0.1;
      if (currentPrice < optimalPrice) {
        reasons.push(`Current price is significantly below optimal (${Math.round(currentPriceDifference * 100)}% difference)`);
      } else {
        reasons.push(`Current price is significantly above optimal (${Math.round(currentPriceDifference * 100)}% difference)`);
      }
    }

    // Calculate revenue impact (accounting for elasticity)
    const priceDiff = (optimalPrice - currentPrice) / currentPrice;
    const expectedBookingChange = -elasticity * priceDiff;
    const newBookingRate = bookingRate * (1 + expectedBookingChange);

    // Calculate current and projected revenue
    const sessionsPerMonth = consultationType.totalSessions / 3; // Assuming 3 months of data
    const currentRevenue = sessionsPerMonth * bookingRate * currentPrice;
    const projectedRevenue = sessionsPerMonth * newBookingRate * optimalPrice;
    const revenueImpact = projectedRevenue - currentRevenue;

    // Round optimal price to nearest appropriate value (e.g., $5)
    optimalPrice = Math.round(optimalPrice / 5) * 5;

    // Only recommend if the price change is significant and confidence is sufficient
    if (Math.abs(optimalPrice - currentPrice) >= 5 && confidence >= this.confidenceThreshold) {
      return {
        type: 'pricing',
        expertId: expert.id,
        category,
        duration,
        currentPrice,
        recommendedPrice: optimalPrice,
        confidence: parseFloat(confidence.toFixed(2)),
        impact: {
          revenue: Math.round(revenueImpact),
          bookings: Math.round(sessionsPerMonth * (newBookingRate - bookingRate))
        },
        reasoning: reasons,
        timestamp: new Date().toISOString()
      };
    }

    return null;
  }

  /**
   * Generate mock market data for testing
   * @returns {Object} Mock market data
   */
  static generateMockMarketData() {
    const categories = ['Nutrition', 'Legal', 'Financial', 'Medical', 'Technical'];
    const durations = ['15', '30', '45', '60', '90'];

    const marketData = {};

    categories.forEach(category => {
      // Set category defaults
      marketData[category] = {
        defaultElasticity: 0.7 + Math.random() * 0.6, // 0.7 to 1.3
        durations: {}
      };

      // Set data for each duration
      durations.forEach(duration => {
        // Base price depends on category and duration
        let basePriceRate;
        switch(category) {
          case 'Legal': basePriceRate = 3.0; break;
          case 'Financial': basePriceRate = 2.5; break;
          case 'Medical': basePriceRate = 2.8; break;
          case 'Technical': basePriceRate = 2.2; break;
          case 'Nutrition': default: basePriceRate = 1.8; break;
        }

        const durationNum = parseInt(duration);
        const avgPrice = Math.round((basePriceRate * durationNum) / 5) * 5; // Round to nearest $5

        // Create price points data (for elasticity calculation)
        const pricePoints = [];
        const priceVariations = [-0.2, -0.1, 0, 0.1, 0.2]; // -20% to +20%

        priceVariations.forEach(variation => {
          const price = Math.round(avgPrice * (1 + variation));
          const baseBookingRate = 0.6 + Math.random() * 0.3; // 0.6 to 0.9 base rate

          // Higher prices generally have lower booking rates
          // Uses a simple elasticity model for mock data
          const mockElasticity = 0.7 + Math.random() * 0.6;
          const bookingRate = baseBookingRate * (1 - variation * mockElasticity);

          pricePoints.push({
            price,
            bookingRate: parseFloat(bookingRate.toFixed(2))
          });
        });

        marketData[category].durations[duration] = {
          avgPrice,
          avgRating: 3.8 + Math.random() * 0.7, // 3.8 to 4.5
          pricePoints,
          popularity: parseFloat((0.2 + Math.random() * 0.6).toFixed(2)) // 0.2 to 0.8
        };
      });
    });

    return marketData;
  }

  /**
   * Generate mock expert data for testing
   * @param {number} count - Number of experts to generate
   * @returns {Object} Mock expert data keyed by expert ID
   */
  static generateMockExpertData(count = 5) {
    const categories = ['Nutrition', 'Legal', 'Financial', 'Medical', 'Technical'];
    const expertData = {};

    for (let i = 0; i < count; i++) {
      const expertId = `exp${i + 1}`;
      const category = categories[i % categories.length];

      // Create consultation types
      const consultationTypes = {};

      // Each expert has different durations available
      const durations = ['30', '60'];
      if (i % 2 === 0) durations.push('15');
      if (i % 3 === 0) durations.push('45');
      if (i === 2) durations.push('90');

      durations.forEach(duration => {
        const durationNum = parseInt(duration);

        // Base price varies by category and duration
        let basePriceRate;
        switch(category) {
          case 'Legal': basePriceRate = 3.2; break;
          case 'Financial': basePriceRate = 2.7; break;
          case 'Medical': basePriceRate = 3.0; break;
          case 'Technical': basePriceRate = 2.3; break;
          case 'Nutrition': default: basePriceRate = 1.9; break;
        }

        // Add some expert-specific variation
        basePriceRate *= (0.9 + (i * 0.05));

        const price = Math.round((basePriceRate * durationNum) / 5) * 5; // Round to nearest $5

        // Generate booking metrics
        const totalSessions = 20 + Math.floor(Math.random() * 80);
        const bookedSessions = Math.floor(totalSessions * (0.3 + Math.random() * 0.6));

        consultationTypes[duration] = {
          price,
          totalSessions,
          bookedSessions,
          completionRate: 0.8 + Math.random() * 0.2 // 0.8 to 1.0
        };
      });

      // Generate performance metrics
      const performanceMetrics = {
        rating: 3.5 + Math.random() * 1.5, // 3.5 to 5.0
        retentionRate: 0.4 + Math.random() * 0.5, // 0.4 to 0.9
        responseTime: 1 + Math.random() * 5, // 1 to 6 hours
        completionRate: 0.85 + Math.random() * 0.15 // 0.85 to 1.0
      };

      expertData[expertId] = {
        id: expertId,
        category,
        consultationTypes,
        performanceMetrics
      };
    }

    return expertData;
  }
}

// Example usage
if (typeof module !== 'undefined') {
  module.exports = PricingOptimizer;
} else {
  // Browser environment
  window.PricingOptimizer = PricingOptimizer;
}

// If running directly in browser, create demo
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    // Create optimizer instance
    const optimizer = new PricingOptimizer();

    // Generate mock data
    const marketData = PricingOptimizer.generateMockMarketData();
    const expertData = PricingOptimizer.generateMockExpertData(5);

    // Initialize optimizer
    optimizer.initialize({
      market: marketData,
      experts: expertData
    });

    // Generate recommendations for each expert
    Object.keys(expertData).forEach(expertId => {
      const recommendations = optimizer.generateRecommendations(expertId);
      console.log(`Generated ${recommendations.length} pricing recommendations for ${expertId}:`, recommendations);
    });

    // Make optimizer globally available
    window.pricingOptimizer = optimizer;
  });
}
