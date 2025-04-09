import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { expertMatchingExperiment } from '../../utils/ml/abTesting';
import { eventTracker } from '../../utils/analytics';

/**
 * Expert Matcher Component
 *
 * This component handles the matching of clients with experts based on:
 * - Language compatibility
 * - Expertise area
 * - Rating and reviews
 * - Availability
 * - Response time
 *
 * It integrates with the A/B testing framework to experiment with different
 * matching algorithms and weighting strategies.
 */
const ExpertMatcher = ({
  clientId,
  clientQuery,
  clientLanguages = ['en'],
  clientExpertiseNeeds = [],
  onMatchesFound
}) => {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [algorithm, setAlgorithm] = useState(null);
  const userId = useSelector(state => state.user?.id || clientId || 'anonymous-user');

  // Active experiment ID - in a real implementation, this might come from config
  const experimentId = 'expert_matching_1';

  useEffect(() => {
    const fetchExperts = async () => {
      setLoading(true);

      try {
        // Get matching algorithm configuration from A/B testing framework
        const algorithmConfig = expertMatchingExperiment.getMatchingAlgorithm(experimentId, userId);
        setAlgorithm(algorithmConfig);

        // Fetch experts (in a real app, this would be an API call)
        // Here we're using mock data
        const experts = await mockFetchExperts();

        // Apply matching algorithm based on the experiment variation
        const matchedExperts = findBestMatches(
          experts,
          {
            languages: clientLanguages,
            expertiseNeeds: clientExpertiseNeeds,
            query: clientQuery
          },
          algorithmConfig
        );

        // Set the matches and pass them to parent
        setMatches(matchedExperts);
        if (onMatchesFound) {
          onMatchesFound(matchedExperts);
        }

        // Track the results view for the experiment
        expertMatchingExperiment.trackResultsView(
          experimentId,
          userId,
          {
            expertsShown: matchedExperts.length,
            query: clientQuery,
            languages: clientLanguages,
            expertise_needs: clientExpertiseNeeds
          }
        );
      } catch (error) {
        console.error('Error fetching expert matches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExperts();
  }, [clientId, clientLanguages, clientExpertiseNeeds, clientQuery, userId]);

  /**
   * Handle when a user selects an expert
   */
  const handleExpertSelect = (expert, position) => {
    // Track the expert selection for the experiment
    if (algorithm && algorithm._experimentId) {
      expertMatchingExperiment.trackExpertSelection(
        algorithm._experimentId,
        userId,
        expert.id,
        {
          position,
          expert_match_score: expert.matchScore,
          expert_languages: expert.languages,
          expert_expertise_areas: expert.expertiseAreas,
          query: clientQuery
        }
      );
    }

    // In a real implementation, you would navigate to the expert's profile or initiate a chat
    console.log(`Selected expert: ${expert.name}`);
  };

  /**
   * Track when a session with an expert is completed successfully
   */
  const trackSuccessfulSession = (expert, sessionData) => {
    if (algorithm && algorithm._experimentId) {
      expertMatchingExperiment.trackSessionSuccess(
        algorithm._experimentId,
        userId,
        expert.id,
        {
          sessionDuration: sessionData.duration,
          sessionRating: sessionData.rating,
          sessionNotes: sessionData.notes,
          issueResolved: sessionData.resolved
        }
      );
    }
  };

  /**
   * Find the best matches based on the algorithm and weights from the experiment
   */
  const findBestMatches = (experts, clientData, algorithmConfig) => {
    const { algorithm, weights } = algorithmConfig;

    // Calculate match scores for each expert
    const scoredExperts = experts.map(expert => {
      // Language match score (0-1)
      const languageMatch = calculateLanguageMatchScore(expert.languages, clientData.languages);

      // Expertise match score (0-1)
      const expertiseMatch = calculateExpertiseMatchScore(
        expert.expertiseAreas,
        clientData.expertiseNeeds,
        clientData.query
      );

      // Rating score (0-1)
      const ratingScore = expert.rating / 5;

      // Response time score (0-1) - lower is better
      const responseTimeScore = 1 - (Math.min(expert.avgResponseMinutes, 60) / 60);

      // Calculate weighted score based on experiment configuration
      let matchScore;

      if (algorithm === 'standard') {
        // Standard algorithm uses simple weighted average
        matchScore = (
          weights.language * languageMatch +
          weights.expertise * expertiseMatch +
          weights.rating * ratingScore +
          weights.response_time * responseTimeScore
        );
      } else if (algorithm === 'enhanced') {
        // Enhanced algorithm prioritizes expertise more for specific queries
        const hasSpecificQuery = clientData.query && clientData.query.length > 10;
        const dynamicExpertiseWeight = hasSpecificQuery ?
          weights.expertise * 1.2 : weights.expertise;

        // Normalize weights
        const totalWeight = weights.language + dynamicExpertiseWeight +
                           weights.rating + weights.response_time;

        matchScore = (
          (weights.language * languageMatch) +
          (dynamicExpertiseWeight * expertiseMatch) +
          (weights.rating * ratingScore) +
          (weights.response_time * responseTimeScore)
        ) / totalWeight;
      } else {
        // Fallback to simple average
        matchScore = (languageMatch + expertiseMatch + ratingScore + responseTimeScore) / 4;
      }

      return {
        ...expert,
        matchScore,
        algorithmUsed: algorithm,
        matchDetails: {
          languageMatch,
          expertiseMatch,
          ratingScore,
          responseTimeScore
        }
      };
    });

    // Sort by match score (descending)
    return scoredExperts.sort((a, b) => b.matchScore - a.matchScore);
  };

  /**
   * Calculate how well the expert's languages match client's language preferences
   */
  const calculateLanguageMatchScore = (expertLanguages, clientLanguages) => {
    if (!expertLanguages || !expertLanguages.length ||
        !clientLanguages || !clientLanguages.length) {
      return 0;
    }

    // Count how many of client's preferred languages the expert speaks
    const matchCount = clientLanguages.filter(lang =>
      expertLanguages.includes(lang)
    ).length;

    // Perfect match if expert speaks all client languages
    if (matchCount === clientLanguages.length) {
      return 1;
    }

    // Partial match
    return matchCount / clientLanguages.length;
  };

  /**
   * Calculate how well the expert's expertise areas match client's needs
   */
  const calculateExpertiseMatchScore = (expertiseAreas, clientNeeds, query = '') => {
    if (!expertiseAreas || !expertiseAreas.length) {
      return 0;
    }

    if (!clientNeeds || !clientNeeds.length) {
      // If no specific needs, check if query keywords match expertise areas
      if (query) {
        const queryWords = query.toLowerCase().split(/\s+/);

        // Check if any query words match expertise areas
        const matchCount = expertiseAreas.filter(area =>
          queryWords.some(word => area.toLowerCase().includes(word))
        ).length;

        return matchCount > 0 ? matchCount / expertiseAreas.length : 0;
      }
      return 0.5; // Neutral score if no specific needs or query
    }

    // Count how many of client's needs match expert's areas
    const matchCount = clientNeeds.filter(need =>
      expertiseAreas.some(area => area.toLowerCase().includes(need.toLowerCase()))
    ).length;

    // Score based on matched needs
    return matchCount / clientNeeds.length;
  };

  // Mock function to simulate fetching experts from an API
  const mockFetchExperts = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock experts data
    return [
      {
        id: 'exp-1',
        name: 'Dr. Jane Smith',
        title: 'Legal Compliance Expert',
        languages: ['en', 'es', 'fr'],
        expertiseAreas: ['GDPR', 'HIPAA', 'Regulatory Compliance', 'Data Privacy'],
        rating: 4.9,
        reviewCount: 128,
        avgResponseMinutes: 5,
        availability: 'Available now',
        imageUrl: '/assets/experts/jane-smith.jpg'
      },
      {
        id: 'exp-2',
        name: 'Michael Chen',
        title: 'International Compliance Specialist',
        languages: ['en', 'zh', 'ja'],
        expertiseAreas: ['International Regulations', 'GDPR', 'APAC Compliance'],
        rating: 4.7,
        reviewCount: 93,
        avgResponseMinutes: 8,
        availability: 'Available in 1 hour',
        imageUrl: '/assets/experts/michael-chen.jpg'
      },
      {
        id: 'exp-3',
        name: 'Sarah Johnson',
        title: 'Healthcare Compliance Advisor',
        languages: ['en'],
        expertiseAreas: ['HIPAA', 'Healthcare Regulations', 'Medical Data Privacy'],
        rating: 4.8,
        reviewCount: 107,
        avgResponseMinutes: 12,
        availability: 'Available now',
        imageUrl: '/assets/experts/sarah-johnson.jpg'
      },
      {
        id: 'exp-4',
        name: 'Ahmed Hassan',
        title: 'Financial Compliance Expert',
        languages: ['en', 'ar', 'fr'],
        expertiseAreas: ['Financial Regulations', 'GDPR', 'Banking Compliance'],
        rating: 4.6,
        reviewCount: 78,
        avgResponseMinutes: 15,
        availability: 'Available tomorrow',
        imageUrl: '/assets/experts/ahmed-hassan.jpg'
      },
      {
        id: 'exp-5',
        name: 'Maria Garcia',
        title: 'Data Protection Specialist',
        languages: ['en', 'es', 'pt'],
        expertiseAreas: ['Data Privacy', 'GDPR', 'CCPA', 'LGPD'],
        rating: 4.9,
        reviewCount: 152,
        avgResponseMinutes: 7,
        availability: 'Available now',
        imageUrl: '/assets/experts/maria-garcia.jpg'
      }
    ];
  };

  // Render loading state or matches
  return (
    <div className="expert-matcher">
      {algorithm && algorithm._variation && (
        <div className="experiment-info text-xs text-gray-400 mb-2">
          Using algorithm: {algorithm.algorithm} (Variation: {algorithm._variation})
        </div>
      )}

      {loading ? (
        <div className="loading-state p-4 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Finding the best experts for you...</p>
        </div>
      ) : (
        <div className="matches-container">
          <h3 className="text-lg font-semibold mb-4">Expert Matches ({matches.length})</h3>

          {matches.length === 0 ? (
            <p className="text-gray-500">No experts found matching your criteria.</p>
          ) : (
            <ul className="space-y-4">
              {matches.map((expert, index) => (
                <li key={expert.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden">
                        {/* Placeholder for expert image */}
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          {expert.imageUrl ? (
                            <img src={expert.imageUrl} alt={expert.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{expert.name.charAt(0)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex-grow">
                      <h4 className="font-semibold">{expert.name}</h4>
                      <p className="text-sm text-gray-600">{expert.title}</p>

                      <div className="mt-2 flex items-center text-sm">
                        <span className="text-yellow-500 mr-1">★</span>
                        <span className="font-medium">{expert.rating}</span>
                        <span className="text-gray-400 mx-1">·</span>
                        <span className="text-gray-600">{expert.reviewCount} reviews</span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1">
                        {expert.languages.map(lang => (
                          <span
                            key={lang}
                            className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {lang.toUpperCase()}
                          </span>
                        ))}
                      </div>

                      <div className="mt-2 text-sm">
                        <span className={`font-medium ${expert.availability.includes('now') ? 'text-green-600' : 'text-orange-600'}`}>
                          {expert.availability}
                        </span>
                        <span className="text-gray-400 mx-1">·</span>
                        <span className="text-gray-600">Responds in ~{expert.avgResponseMinutes} min</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 ml-4 text-right">
                      <div className="text-sm font-semibold text-blue-600 mb-2">
                        {Math.round(expert.matchScore * 100)}% match
                      </div>

                      <button
                        onClick={() => handleExpertSelect(expert, index)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Connect
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpertMatcher;
