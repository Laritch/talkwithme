/**
 * Consultation Duration Optimizer
 * Analyzes client needs and expert efficiency to recommend optimal session durations
 */

class DurationOptimizer {
  constructor() {
    this.marketData = {}; // Market data by category
    this.expertData = {}; // Expert performance data
    this.confidenceThreshold = 0.7; // Minimum confidence for recommendations
  }

  /**
   * Initialize with market and expert data
   * @param {Object} data - Contains market and expert data
   */
  initialize(data) {
    if (data.market) this.marketData = data.market;
    if (data.experts) this.expertData = data.experts;
    console.log("Duration optimizer initialized with data for",
      Object.keys(this.marketData).length, "categories and",
      Object.keys(this.expertData).length, "experts");
  }

  /**
   * Generate duration recommendations for an expert
   * @param {string} expertId - Expert ID
   * @returns {Array} Array of duration recommendations
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

    // Get current durations offered by the expert
    const expertDurations = Object.keys(expert.consultationTypes).map(d => parseInt(d));

    // Analyze missing standard durations
    recommendations.push(...this.recommendMissingDurations(expert, expertDurations, categoryMarket));

    // Analyze optimizations for existing durations
    recommendations.push(...this.recommendDurationOptimizations(expert, expertDurations, categoryMarket));

    return recommendations;
  }

  /**
   * Recommend missing standard durations
   * @param {Object} expert - Expert data
   * @param {Array} expertDurations - Array of durations offered by expert
   * @param {Object} categoryMarket - Market data for the expert's category
   * @returns {Array} - Duration recommendations
   */
  recommendMissingDurations(expert, expertDurations, categoryMarket) {
    const recommendations = [];
    const standardDurations = [15, 30, 45, 60, 90];

    // Analyze each standard duration the expert doesn't offer
    standardDurations.forEach(duration => {
      if (!expertDurations.includes(duration)) {
        // Skip if market data doesn't exist for this duration
        const durationMarket = categoryMarket.durations[duration.toString()];
        if (!durationMarket) return;

        // Only recommend if this duration has significant market popularity
        if (durationMarket.popularity < 0.2) return;

        // Calculate confidence based on market data and gaps in expert's offerings
        let confidence = 0.5; // Base confidence
        const reasons = [];

        // Factor 1: Market popularity
        if (durationMarket.popularity > 0.6) {
          confidence += 0.2;
          reasons.push(`High market demand (${Math.round(durationMarket.popularity*100)}% popularity)`);
        } else if (durationMarket.popularity > 0.4) {
          confidence += 0.15;
          reasons.push(`Medium market demand (${Math.round(durationMarket.popularity*100)}% popularity)`);
        } else {
          confidence += 0.05;
          reasons.push(`Some market demand (${Math.round(durationMarket.popularity*100)}% popularity)`);
        }

        // Factor 2: Gap analysis
        // Sort durations to find neighboring ones
        expertDurations.sort((a, b) => a - b);
        const lowerDuration = expertDurations.find(d => d < duration);
        const higherDuration = expertDurations.find(d => d > duration);

        if (lowerDuration && higherDuration) {
          // This duration fills a gap between existing durations
          const gapSize = higherDuration - lowerDuration;
          if (gapSize > 30) {
            confidence += 0.2;
            reasons.push(`Fills large gap between ${lowerDuration} and ${higherDuration} minute options`);
          } else {
            confidence += 0.1;
            reasons.push(`Fills gap between ${lowerDuration} and ${higherDuration} minute options`);
          }
        } else if (!lowerDuration && higherDuration) {
          // This would be the shortest duration offered
          if (duration < 30 && higherDuration >= 45) {
            confidence += 0.15;
            reasons.push(`Provides quick consultation option (shortest currently ${higherDuration} minutes)`);
          } else {
            confidence += 0.05;
            reasons.push(`Adds shorter duration option`);
          }
        } else if (lowerDuration && !higherDuration) {
          // This would be the longest duration offered
          if (duration >= 60 && lowerDuration <= 30) {
            confidence += 0.15;
            reasons.push(`Provides in-depth consultation option (longest currently ${lowerDuration} minutes)`);
          } else {
            confidence += 0.05;
            reasons.push(`Adds longer duration option`);
          }
        }

        // Factor 3: Category-specific duration relevance
        switch(expert.category) {
          case 'Nutrition':
            if (duration === 45) {
              confidence += 0.1;
              reasons.push('45-minute consultations ideal for nutrition assessments');
            } else if (duration === 15) {
              confidence += 0.1;
              reasons.push('Quick check-ins beneficial for nutrition clients');
            }
            break;
          case 'Legal':
            if (duration === 30) {
              confidence += 0.1;
              reasons.push('30-minute consultations popular for initial legal advice');
            } else if (duration === 60) {
              confidence += 0.1;
              reasons.push('Hour-long sessions standard for comprehensive legal consultations');
            }
            break;
          case 'Financial':
            if (duration === 60) {
              confidence += 0.1;
              reasons.push('Hour-long sessions optimal for financial planning');
            }
            break;
          case 'Medical':
            if (duration === 15) {
              confidence += 0.1;
              reasons.push('Quick follow-ups valuable for medical consultations');
            } else if (duration === 45) {
              confidence += 0.1;
              reasons.push('45-minute sessions ideal for medical assessments');
            }
            break;
          case 'Technical':
            if (duration === 15) {
              confidence += 0.1;
              reasons.push('Quick troubleshooting sessions valuable for technical support');
            } else if (duration === 90) {
              confidence += 0.1;
              reasons.push('Extended sessions beneficial for complex technical problems');
            }
            break;
        }

        // Calculate optimal price for this duration
        const recommendedPrice = this.calculateOptimalPrice(expert, expertDurations, duration, categoryMarket);

        // Calculate potential revenue impact
        const potentialImpact = this.estimateRevenueImpact(expert, duration, recommendedPrice, durationMarket);

        // Only recommend if confidence threshold is met
        if (confidence >= this.confidenceThreshold) {
          recommendations.push({
            type: 'new-duration',
            expertId: expert.id,
            category: expert.category,
            duration: duration,
            recommendedPrice: recommendedPrice,
            confidence: parseFloat(confidence.toFixed(2)),
            impact: potentialImpact,
            reasoning: reasons,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    return recommendations;
  }

  /**
   * Recommend optimizations for existing durations
   * @param {Object} expert - Expert data
   * @param {Array} expertDurations - Array of durations offered by expert
   * @param {Object} categoryMarket - Market data for the expert's category
   * @returns {Array} - Duration optimization recommendations
   */
  recommendDurationOptimizations(expert, expertDurations, categoryMarket) {
    const recommendations = [];

    // Analyze each duration the expert currently offers
    expertDurations.forEach(duration => {
      const durationStr = duration.toString();
      const consultationType = expert.consultationTypes[durationStr];

      // Skip if not enough booking data
      if (consultationType.totalSessions < 10) {
        return;
      }

      const marketData = categoryMarket.durations[durationStr];
      if (!marketData) return;

      // Check if the duration's booking rate is significantly low
      const bookingRate = consultationType.bookedSessions / consultationType.totalSessions;
      const marketDurationPopularity = marketData.popularity;

      // Only recommend changes for underperforming durations
      if (bookingRate > 0.5) return;

      // Check if the market indicates this duration is popular
      if (marketDurationPopularity > 0.4 && bookingRate < 0.4) {
        // This is a popular duration but has low bookings - might be a pricing issue
        const currentPrice = consultationType.price;
        const marketAvgPrice = marketData.avgPrice;

        // Check if price is significantly different from market average
        const priceDiff = (currentPrice - marketAvgPrice) / marketAvgPrice;

        if (Math.abs(priceDiff) > 0.15) {
          // Price difference might be the issue
          const confidence = 0.8;
          const reasons = [];

          if (priceDiff > 0) {
            reasons.push(`Current price (${currentPrice}) is ${Math.round(priceDiff*100)}% above market average`);
            reasons.push(`Lower price could increase booking rate for ${duration}-minute consultations`);
          } else {
            reasons.push(`Current price (${currentPrice}) is ${Math.round(Math.abs(priceDiff)*100)}% below market average`);
            reasons.push(`Price might be too low, suggesting lower perceived value`);
          }

          recommendations.push({
            type: 'duration-pricing',
            expertId: expert.id,
            category: expert.category,
            duration: duration,
            currentPrice: currentPrice,
            recommendedPrice: marketAvgPrice,
            confidence: confidence,
            impact: {
              bookingRate: `+${Math.round((0.6 - bookingRate) * 100)}%`,
              revenue: Math.round(consultationType.totalSessions * 0.6 * marketAvgPrice -
                                  consultationType.bookedSessions * currentPrice)
            },
            reasoning: reasons,
            timestamp: new Date().toISOString()
          });
        } else {
          // Might be a description or positioning issue
          recommendations.push({
            type: 'duration-description',
            expertId: expert.id,
            category: expert.category,
            duration: duration,
            confidence: 0.75,
            reasoning: [
              `Low booking rate (${Math.round(bookingRate*100)}%) despite market demand`,
              `Consider improving the description for ${duration}-minute consultations`,
              `Highlight the value clients receive in this timeframe`
            ],
            timestamp: new Date().toISOString()
          });
        }
      } else if (marketDurationPopularity < 0.2 && bookingRate < 0.3) {
        // This duration has low popularity and low bookings - consider replacing
        // Find the most popular duration in this category
        const marketDurations = Object.keys(categoryMarket.durations).map(d => parseInt(d));
        let mostPopularDuration = 30; // Default fallback
        let highestPopularity = 0;

        marketDurations.forEach(d => {
          const popData = categoryMarket.durations[d.toString()];
          if (popData && popData.popularity > highestPopularity && !expertDurations.includes(d)) {
            highestPopularity = popData.popularity;
            mostPopularDuration = d;
          }
        });

        if (highestPopularity > 0.4) {
          // Recommend replacing this duration with the more popular one
          recommendations.push({
            type: 'replace-duration',
            expertId: expert.id,
            category: expert.category,
            currentDuration: duration,
            recommendedDuration: mostPopularDuration,
            confidence: 0.8,
            reasoning: [
              `Current ${duration}-minute option has low booking rate (${Math.round(bookingRate*100)}%)`,
              `${mostPopularDuration}-minute consultations have ${Math.round(highestPopularity*100)}% popularity in this category`,
              `Consider replacing or supplementing with this duration`
            ],
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    return recommendations;
  }

  /**
   * Calculate optimal price for a new duration
   * @param {Object} expert - Expert data
   * @param {Array} expertDurations - Expert's current durations
   * @param {number} newDuration - New duration to price
   * @param {Object} categoryMarket - Market data for this category
   * @returns {number} - Recommended price
   */
  calculateOptimalPrice(expert, expertDurations, newDuration, categoryMarket) {
    // Get market average price for this duration
    const marketPrice = categoryMarket.durations[newDuration.toString()]?.avgPrice;

    // Calculate price based on expert's existing durations
    let calculatedPrice = 0;

    // Sort durations
    expertDurations.sort((a, b) => a - b);

    // Find neighboring durations
    const lowerDuration = expertDurations.find(d => d < newDuration);
    const higherDuration = expertDurations.find(d => d > newDuration);

    if (lowerDuration && higherDuration) {
      // Interpolate between lower and higher duration prices
      const lowerPrice = expert.consultationTypes[lowerDuration.toString()].price;
      const higherPrice = expert.consultationTypes[higherDuration.toString()].price;

      const durationRatio = (newDuration - lowerDuration) / (higherDuration - lowerDuration);
      calculatedPrice = lowerPrice + (higherPrice - lowerPrice) * durationRatio;
    } else if (lowerDuration) {
      // Extrapolate from lower duration
      const lowerPrice = expert.consultationTypes[lowerDuration.toString()].price;
      calculatedPrice = lowerPrice * (newDuration / lowerDuration) * 0.9; // Apply slight discount for longer durations
    } else if (higherDuration) {
      // Extrapolate from higher duration
      const higherPrice = expert.consultationTypes[higherDuration.toString()].price;
      calculatedPrice = higherPrice * (newDuration / higherDuration) * 1.1; // Apply premium for shorter durations
    }

    // If we couldn't calculate from expert's durations, use market price
    if (calculatedPrice === 0 && marketPrice) {
      calculatedPrice = marketPrice;
    } else if (calculatedPrice === 0) {
      // Use category-based pricing as fallback
      let basePriceRate;
      switch(expert.category) {
        case 'Legal': basePriceRate = 3.2; break;
        case 'Financial': basePriceRate = 2.7; break;
        case 'Medical': basePriceRate = 3.0; break;
        case 'Technical': basePriceRate = 2.3; break;
        case 'Nutrition': default: basePriceRate = 1.9; break;
      }
      calculatedPrice = basePriceRate * newDuration;
    }

    // Adjust based on expert's rating compared to category average
    if (marketPrice) {
      const expertRating = expert.performanceMetrics.rating;
      const categoryAvgRating = categoryMarket.durations[newDuration.toString()]?.avgRating || 4.0;

      if (expertRating > categoryAvgRating) {
        // Apply premium for higher-rated experts
        const ratingDiff = expertRating - categoryAvgRating;
        calculatedPrice *= (1 + (ratingDiff / 5) * 0.2); // Up to 20% premium for 5-star experts
      } else if (expertRating < categoryAvgRating) {
        // Apply discount for lower-rated experts
        const ratingDiff = categoryAvgRating - expertRating;
        calculatedPrice *= (1 - (ratingDiff / 5) * 0.15); // Up to 15% discount for lower ratings
      }
    }

    // Round to nearest $5
    return Math.round(calculatedPrice / 5) * 5;
  }

  /**
   * Estimate revenue impact of adding a new duration
   * @param {Object} expert - Expert data
   * @param {number} newDuration - New duration to add
   * @param {number} recommendedPrice - Recommended price
   * @param {Object} durationMarket - Market data for this duration
   * @returns {Object} - Revenue impact estimation
   */
  estimateRevenueImpact(expert, newDuration, recommendedPrice, durationMarket) {
    // Calculate average sessions per month across all durations
    let totalSessions = 0;
    let totalDurations = 0;

    Object.keys(expert.consultationTypes).forEach(duration => {
      totalSessions += expert.consultationTypes[duration].totalSessions;
      totalDurations++;
    });

    const avgSessionsPerMonth = totalDurations > 0 ?
      totalSessions / totalDurations / 3 : 20; // Assume 3 months of data, default to 20 if no data

    // Estimate booking rate based on market popularity and expert rating
    const marketPopularity = durationMarket.popularity;
    const expertRating = expert.performanceMetrics.rating;
    const categoryAvgRating = durationMarket.avgRating || 4.0;

    let estimatedBookingRate = marketPopularity * 0.8; // Base on market popularity

    // Adjust for expert rating
    if (expertRating > categoryAvgRating) {
      estimatedBookingRate += 0.1; // Higher booking rate for better experts
    } else if (expertRating < categoryAvgRating) {
      estimatedBookingRate -= 0.1; // Lower booking rate for lower-rated experts
    }

    // Clamp to reasonable range
    estimatedBookingRate = Math.max(0.2, Math.min(0.9, estimatedBookingRate));

    // Calculate estimated monthly revenue
    const estimatedMonthlyBookings = avgSessionsPerMonth * estimatedBookingRate;
    const estimatedMonthlyRevenue = estimatedMonthlyBookings * recommendedPrice;

    return {
      bookingsPerMonth: Math.round(estimatedMonthlyBookings),
      revenuePerMonth: Math.round(estimatedMonthlyRevenue),
      estimatedBookingRate: `${Math.round(estimatedBookingRate * 100)}%`
    };
  }

  /**
   * Generate mock market data for testing
   * @returns {Object} Mock market data
   */
  static generateMockMarketData() {
    const categories = ['Nutrition', 'Legal', 'Financial', 'Medical', 'Technical'];
    const durations = [15, 30, 45, 60, 90];

    const marketData = {};

    categories.forEach(category => {
      marketData[category] = {
        durations: {}
      };

      // Set data for each duration with varying popularity by category
      durations.forEach(duration => {
        // Define popularity patterns based on category
        let popularityBase = 0.4; // Default middle popularity

        // Make certain durations more popular based on category
        switch(category) {
          case 'Nutrition':
            if (duration === 45) popularityBase = 0.7;
            if (duration === 15) popularityBase = 0.6;
            if (duration === 90) popularityBase = 0.2;
            break;
          case 'Legal':
            if (duration === 60) popularityBase = 0.75;
            if (duration === 30) popularityBase = 0.6;
            if (duration === 15) popularityBase = 0.2;
            break;
          case 'Financial':
            if (duration === 60) popularityBase = 0.8;
            if (duration === 90) popularityBase = 0.5;
            if (duration === 15) popularityBase = 0.1;
            break;
          case 'Medical':
            if (duration === 30) popularityBase = 0.7;
            if (duration === 45) popularityBase = 0.6;
            if (duration === 15) popularityBase = 0.5;
            break;
          case 'Technical':
            if (duration === 30) popularityBase = 0.65;
            if (duration === 60) popularityBase = 0.5;
            if (duration === 15) popularityBase = 0.6;
            break;
        }

        // Add some randomness to popularity
        const popularity = Math.max(0.1, Math.min(0.9,
          popularityBase + (Math.random() * 0.2 - 0.1)
        ));

        // Base price depends on category and duration
        let basePriceRate;
        switch(category) {
          case 'Legal': basePriceRate = 3.0; break;
          case 'Financial': basePriceRate = 2.5; break;
          case 'Medical': basePriceRate = 2.8; break;
          case 'Technical': basePriceRate = 2.2; break;
          case 'Nutrition': default: basePriceRate = 1.8; break;
        }

        const avgPrice = Math.round((basePriceRate * duration) / 5) * 5; // Round to nearest $5

        marketData[category].durations[duration] = {
          avgPrice,
          avgRating: 3.8 + Math.random() * 0.7, // 3.8 to 4.5
          popularity: parseFloat(popularity.toFixed(2))
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

      // Create consultation types - deliberately missing some standard durations
      const consultationTypes = {};

      // Each expert has different durations available - intentionally suboptimal
      let durations;
      switch(i % 5) {
        case 0: durations = ['30', '60']; break; // Missing short and long options
        case 1: durations = ['15', '60']; break; // Missing middle duration
        case 2: durations = ['30', '90']; break; // Big gap
        case 3: durations = ['15', '30', '60']; break; // Fairly complete
        case 4: durations = ['60']; break; // Only one option
      }

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

        // Add some price variation
        const priceVariation = 0.9 + (Math.random() * 0.4); // 0.9 to 1.3 multiplier
        const price = Math.round((basePriceRate * durationNum * priceVariation) / 5) * 5;

        // Generate booking metrics - some intentionally low for recommendation triggers
        const totalSessions = 20 + Math.floor(Math.random() * 80);
        let bookingRate;

        // Make some durations underperform for recommendation opportunities
        if ((category === 'Nutrition' && durationNum === 30) ||
            (category === 'Legal' && durationNum === 15) ||
            (category === 'Financial' && durationNum === 30)) {
          bookingRate = 0.2 + Math.random() * 0.2; // Low booking rate (20-40%)
        } else {
          bookingRate = 0.5 + Math.random() * 0.4; // Normal booking rate (50-90%)
        }

        const bookedSessions = Math.floor(totalSessions * bookingRate);

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
  module.exports = DurationOptimizer;
} else {
  // Browser environment
  window.DurationOptimizer = DurationOptimizer;
}

// If running directly in browser, create demo
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    // Create optimizer instance
    const optimizer = new DurationOptimizer();

    // Generate mock data
    const marketData = DurationOptimizer.generateMockMarketData();
    const expertData = DurationOptimizer.generateMockExpertData(5);

    // Initialize optimizer
    optimizer.initialize({
      market: marketData,
      experts: expertData
    });

    // Generate recommendations for each expert
    Object.keys(expertData).forEach(expertId => {
      const recommendations = optimizer.generateRecommendations(expertId);
      console.log(`Generated ${recommendations.length} duration recommendations for ${expertId}:`, recommendations);
    });

    // Make optimizer globally available
    window.durationOptimizer = optimizer;
  });
}
