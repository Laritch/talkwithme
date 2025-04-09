import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { geographicMatchingExperiment } from '../../utils/ml/abTesting';
import { eventTracker } from '../../utils/analytics';
import { enhancedExpertMatching } from '../../utils/ml/nlpMatcher';

/**
 * Geographic Expert Matcher Component
 *
 * This component handles matching clients with experts based on:
 * - Geographic proximity
 * - Language compatibility
 * - Expertise relevance
 *
 * It integrates with A/B testing to experiment with different geographic
 * matching strategies.
 */
const GeoExpertMatcher = ({
  clientId,
  clientQuery,
  clientLanguages = ['en'],
  clientExpertiseNeeds = [],
  clientLocation = null,
  onMatchesFound
}) => {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [geoConfig, setGeoConfig] = useState(null);
  const [locationStatus, setLocationStatus] = useState('detecting');
  const [userLocation, setUserLocation] = useState(clientLocation || {
    latitude: null,
    longitude: null,
    region: null,
    city: null
  });

  const userId = useSelector(state => state.user?.id || clientId || 'anonymous-user');

  // Active experiment ID - in a real implementation, this might come from config
  const experimentId = 'geo_matching_1';

  useEffect(() => {
    // If client location is provided, use it directly
    if (clientLocation) {
      setUserLocation(clientLocation);
      setLocationStatus('detected');
      fetchExperts(clientLocation);
    } else {
      // Otherwise try to detect location
      detectUserLocation();
    }
  }, [clientId, clientLanguages, clientExpertiseNeeds, clientQuery, clientLocation]);

  // Detect user location
  const detectUserLocation = async () => {
    setLocationStatus('detecting');

    try {
      // First try to use browser geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const coords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };

            // Reverse geocode to get region and city
            const locationInfo = await reverseGeocode(coords.latitude, coords.longitude);

            const detectedLocation = {
              ...coords,
              ...locationInfo
            };

            setUserLocation(detectedLocation);
            setLocationStatus('detected');
            fetchExperts(detectedLocation);
          },
          async (error) => {
            console.warn('Geolocation error:', error);
            // Fall back to IP-based geolocation
            await fallbackLocationDetection();
          }
        );
      } else {
        // Geolocation not available, use fallback
        await fallbackLocationDetection();
      }
    } catch (error) {
      console.error('Location detection error:', error);
      setLocationStatus('error');
      // Continue with null location
      fetchExperts(null);
    }
  };

  // Fallback to IP-based location detection (simulated for this demo)
  const fallbackLocationDetection = async () => {
    try {
      // In a real app, this would make an API call to an IP geolocation service
      // For this demo, we'll use a simulated response
      const simulatedLocation = {
        latitude: 40.7128, // New York City coordinates
        longitude: -74.0060,
        region: 'US',
        city: 'New York'
      };

      setUserLocation(simulatedLocation);
      setLocationStatus('fallback');
      fetchExperts(simulatedLocation);
    } catch (error) {
      console.error('Fallback location detection error:', error);
      setLocationStatus('error');
      // Continue with null location
      fetchExperts(null);
    }
  };

  // Simulate reverse geocoding (in a real app, this would use a geocoding API)
  const reverseGeocode = async (latitude, longitude) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Basic simulation based on lat/long ranges (very simplified)
    let region, city;

    // US locations
    if (latitude > 24 && latitude < 50 && longitude > -125 && longitude < -66) {
      region = 'US';

      // East Coast
      if (longitude > -85) {
        if (latitude > 40) city = 'New York';
        else city = 'Miami';
      }
      // West Coast
      else if (longitude < -110) {
        if (latitude > 37) city = 'San Francisco';
        else city = 'Los Angeles';
      }
      // Central
      else {
        if (latitude > 40) city = 'Chicago';
        else city = 'Dallas';
      }
    }
    // European locations
    else if (latitude > 35 && latitude < 60 && longitude > -10 && longitude < 30) {
      region = 'EU';

      // Western Europe
      if (longitude < 10) {
        if (latitude > 48) city = 'London';
        else city = 'Paris';
      }
      // Eastern Europe
      else {
        if (latitude > 50) city = 'Berlin';
        else city = 'Rome';
      }
    }
    // Default location if can't determine
    else {
      region = 'Other';
      city = 'Unknown';
    }

    return { region, city };
  };

  // Fetch and match experts
  const fetchExperts = async (locationData) => {
    setLoading(true);

    try {
      // Get geo matching configuration from A/B testing framework
      const geoMatchingConfig = geographicMatchingExperiment.getGeoMatchingConfig(
        experimentId,
        userId,
        locationData
      );

      setGeoConfig(geoMatchingConfig);

      // Fetch experts (in a real app, this would be an API call)
      const experts = await mockFetchExperts();

      // First do basic matching using NLP
      const nlpMatchedExperts = enhancedExpertMatching(
        clientQuery,
        experts,
        { useDomainKnowledge: true }
      );

      // Then apply geographic boosting
      const geoMatchedExperts = locationData ?
        geographicMatchingExperiment.applyGeographicBoosting(
          nlpMatchedExperts,
          geoMatchingConfig,
          locationData
        ) : nlpMatchedExperts;

      // Sort by match score
      const sortedExperts = geoMatchedExperts.sort((a, b) => b.matchScore - a.matchScore);

      // Set the matches and pass them to parent
      setMatches(sortedExperts);
      if (onMatchesFound) {
        onMatchesFound(sortedExperts);
      }

      // Track the results view for the experiment
      if (locationData) {
        geographicMatchingExperiment.trackResultsView(
          experimentId,
          userId,
          locationData,
          {
            expertsShown: sortedExperts.length,
            localExpertsShown: sortedExperts.filter(e =>
              e.location?.region === locationData.region
            ).length,
            query: clientQuery,
            languages: clientLanguages,
            expertise_needs: clientExpertiseNeeds
          }
        );
      }
    } catch (error) {
      console.error('Error fetching expert matches:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle when a user selects an expert
   */
  const handleExpertSelect = (expert, position) => {
    if (geoConfig && geoConfig._experimentId) {
      geographicMatchingExperiment.trackExpertSelection(
        geoConfig._experimentId,
        userId,
        expert.id,
        {
          position,
          isLocalExpert: expert.location?.region === userLocation?.region,
          distanceKm: expert.distanceKm,
          matchScore: expert.matchScore,
          geoBoostApplied: expert.geoBoostApplied
        }
      );
    }

    // In a real implementation, you would navigate to the expert's profile or initiate a chat
    console.log(`Selected expert: ${expert.name}`);
  };

  /**
   * Track when a session with an expert is booked
   */
  const trackSessionBooked = (expert, bookingData) => {
    if (geoConfig && geoConfig._experimentId) {
      geographicMatchingExperiment.trackSessionBooked(
        geoConfig._experimentId,
        userId,
        expert.id,
        {
          isLocalExpert: expert.location?.region === userLocation?.region,
          bookingType: bookingData.type,
          sessionDate: bookingData.date,
          sessionDuration: bookingData.duration,
          price: bookingData.price
        }
      );
    }
  };

  // Format distance for display
  const formatDistance = (distanceKm) => {
    if (distanceKm === undefined || distanceKm === null) return 'Unknown distance';
    if (distanceKm === Infinity) return 'Distance unavailable';

    if (distanceKm < 1) {
      return 'Less than 1 km';
    } else if (distanceKm < 100) {
      return `${Math.round(distanceKm)} km`;
    } else {
      return `${Math.round(distanceKm / 10) * 10} km`;
    }
  };

  // Mock function to simulate fetching experts from an API
  const mockFetchExperts = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock experts data with location information
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
        imageUrl: '/assets/experts/jane-smith.jpg',
        location: {
          region: 'US',
          city: 'New York',
          latitude: 40.7128,
          longitude: -74.0060
        }
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
        imageUrl: '/assets/experts/michael-chen.jpg',
        location: {
          region: 'US',
          city: 'San Francisco',
          latitude: 37.7749,
          longitude: -122.4194
        }
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
        imageUrl: '/assets/experts/sarah-johnson.jpg',
        location: {
          region: 'US',
          city: 'Chicago',
          latitude: 41.8781,
          longitude: -87.6298
        }
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
        imageUrl: '/assets/experts/ahmed-hassan.jpg',
        location: {
          region: 'EU',
          city: 'London',
          latitude: 51.5074,
          longitude: -0.1278
        }
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
        imageUrl: '/assets/experts/maria-garcia.jpg',
        location: {
          region: 'EU',
          city: 'Barcelona',
          latitude: 41.3851,
          longitude: 2.1734
        }
      },
      {
        id: 'exp-6',
        name: 'John Miller',
        title: 'Regulatory Affairs Consultant',
        languages: ['en', 'de'],
        expertiseAreas: ['Regulatory Compliance', 'Corporate Governance', 'Risk Management'],
        rating: 4.7,
        reviewCount: 86,
        avgResponseMinutes: 10,
        availability: 'Available now',
        imageUrl: '/assets/experts/john-miller.jpg',
        location: {
          region: 'EU',
          city: 'Berlin',
          latitude: 52.5200,
          longitude: 13.4050
        }
      }
    ];
  };

  // Render loading state or matches
  return (
    <div className="geo-expert-matcher">
      {/* Location status indicator */}
      <div className="location-status mb-4">
        {locationStatus === 'detecting' && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
            <div className="flex items-center">
              <div className="mr-2 animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
              <p className="text-blue-700 text-sm">Detecting your location for better expert matches...</p>
            </div>
          </div>
        )}
        {locationStatus === 'detected' && userLocation && (
          <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
            <p className="text-green-700 text-sm">
              <span className="font-medium">Location detected:</span> {userLocation.city}, {userLocation.region}
            </p>
          </div>
        )}
        {locationStatus === 'fallback' && userLocation && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
            <p className="text-yellow-700 text-sm">
              <span className="font-medium">Approximate location:</span> {userLocation.city}, {userLocation.region}
            </p>
          </div>
        )}
        {locationStatus === 'error' && (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded">
            <p className="text-orange-700 text-sm">
              Could not detect your location. Showing experts from all regions.
            </p>
          </div>
        )}
      </div>

      {/* Experiment variation display */}
      {geoConfig && geoConfig._variation && (
        <div className="experiment-info text-xs text-gray-400 mb-3">
          <p>Matching strategy: {geoConfig.strategy} (Variation: {geoConfig._variation})</p>
          {geoConfig.prioritizeLocal && <p>Local expert boost: {geoConfig.localBoostFactor * 100}%</p>}
        </div>
      )}

      {/* Expert matches */}
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

                      {/* Language badges */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {expert.languages.map(lang => (
                          <span
                            key={lang}
                            className={`px-2 py-0.5 text-xs rounded-full ${clientLanguages.includes(lang)
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'}`}
                          >
                            {lang.toUpperCase()}
                          </span>
                        ))}
                      </div>

                      {/* Location and availability */}
                      <div className="mt-2 text-sm">
                        <span className={`font-medium ${expert.availability.includes('now') ? 'text-green-600' : 'text-orange-600'}`}>
                          {expert.availability}
                        </span>
                        <span className="text-gray-400 mx-1">·</span>
                        <span className="text-gray-600">
                          {expert.location ? `${expert.location.city}, ${expert.location.region}` : 'Location unknown'}
                        </span>

                        {/* Show distance if available */}
                        {userLocation && userLocation.latitude && expert.distanceKm && (
                          <>
                            <span className="text-gray-400 mx-1">·</span>
                            <span className="text-gray-600">{formatDistance(expert.distanceKm)}</span>
                          </>
                        )}
                      </div>

                      {/* Expertise highlights */}
                      {expert.matchDetails?.matchedKeywords && expert.matchDetails.matchedKeywords.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">Expertise: </span>
                          <span className="text-xs text-gray-700">
                            {expert.matchDetails.matchedKeywords.slice(0, 3).join(', ')}
                            {expert.matchDetails.matchedKeywords.length > 3 ? '...' : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0 ml-4 text-right">
                      <div className="text-sm font-semibold text-blue-600 mb-2">
                        {Math.round(expert.matchScore * 100)}% match
                      </div>

                      {/* Show if this is a local expert */}
                      {userLocation && expert.location && userLocation.region === expert.location.region && (
                        <div className="text-xs text-green-600 mb-2">
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                          Local Expert
                        </div>
                      )}

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

export default GeoExpertMatcher;
