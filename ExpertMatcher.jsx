import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { LANGUAGES } from '../i18n/TranslationService';
import './ExpertMatcher.css';

/**
 * Sample expert data
 * In a real application, this would come from an API
 */
const SAMPLE_EXPERTS = [
  {
    id: 1,
    name: 'Anna Smith',
    expertise: ['Data Analysis', 'Resource Management'],
    languages: ['en', 'fr', 'es'],
    rating: 4.9,
    reviews: 127,
    profilePic: '👩‍💼',
    available: true
  },
  {
    id: 2,
    name: 'Mohammed Al-Farsi',
    expertise: ['API Integration', 'Technical Documentation'],
    languages: ['en', 'ar'],
    rating: 4.8,
    reviews: 93,
    profilePic: '👨‍💻',
    available: true
  },
  {
    id: 3,
    name: 'Yuki Tanaka',
    expertise: ['Digital Asset Management', 'Metadata'],
    languages: ['en', 'ja'],
    rating: 4.7,
    reviews: 85,
    profilePic: '👩‍🔧',
    available: false
  },
  {
    id: 4,
    name: 'Pierre Dubois',
    expertise: ['Content Strategy', 'Resource Organization'],
    languages: ['en', 'fr'],
    rating: 4.9,
    reviews: 152,
    profilePic: '👨‍🏫',
    available: true
  },
  {
    id: 5,
    name: 'Elena Rodriguez',
    expertise: ['Documentation', 'API Design'],
    languages: ['en', 'es'],
    rating: 4.8,
    reviews: 110,
    profilePic: '👩‍💻',
    available: true
  },
  {
    id: 6,
    name: 'Hans Weber',
    expertise: ['Resource Tagging', 'Digital Library'],
    languages: ['en', 'de'],
    rating: 4.6,
    reviews: 78,
    profilePic: '👨‍🔬',
    available: true
  },
  {
    id: 7,
    name: 'Li Wei',
    expertise: ['Data Organization', 'Content Management'],
    languages: ['en', 'zh'],
    rating: 4.9,
    reviews: 136,
    profilePic: '👨‍💼',
    available: true
  },
  {
    id: 8,
    name: 'Sasha Petrov',
    expertise: ['Technical Writing', 'Documentation'],
    languages: ['en', 'ru'],
    rating: 4.7,
    reviews: 91,
    profilePic: '👨‍🎓',
    available: false
  },
  {
    id: 9,
    name: 'Jan de Vries',
    expertise: ['Resource Organization', 'Digital Assets'],
    languages: ['en', 'nl'],
    rating: 4.8,
    reviews: 103,
    profilePic: '👨‍🚀',
    available: true
  }
];

/**
 * ExpertMatcher Component
 *
 * Displays experts who can speak the user's preferred language
 * and allows filtering based on expertise and availability.
 */
const ExpertMatcher = () => {
  const { currentLanguage } = useLanguage();
  const [experts, setExperts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [preferredLanguage, setPreferredLanguage] = useState(currentLanguage);
  const [showAllExperts, setShowAllExperts] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(true);
  const [expertiseFilter, setExpertiseFilter] = useState('');

  // Load experts on component mount
  useEffect(() => {
    // Simulate API call delay
    setIsLoading(true);

    setTimeout(() => {
      // Get preferred language from localStorage (set in LanguageWelcome)
      const storedPreferredLang = localStorage.getItem('preferredExpertLanguage');

      if (storedPreferredLang && LANGUAGES[storedPreferredLang]) {
        setPreferredLanguage(storedPreferredLang);
      } else {
        setPreferredLanguage(currentLanguage);
      }

      setIsLoading(false);
    }, 1000);
  }, [currentLanguage]);

  // Filter experts based on language and other filters
  useEffect(() => {
    let filteredExperts = [...SAMPLE_EXPERTS];

    // Filter by language preference if not showing all experts
    if (!showAllExperts && preferredLanguage !== 'en') {
      filteredExperts = filteredExperts.filter(expert =>
        expert.languages.includes(preferredLanguage)
      );
    }

    // Filter by availability if needed
    if (availableOnly) {
      filteredExperts = filteredExperts.filter(expert => expert.available);
    }

    // Filter by expertise if filter is set
    if (expertiseFilter) {
      const filter = expertiseFilter.toLowerCase();
      filteredExperts = filteredExperts.filter(expert =>
        expert.expertise.some(e => e.toLowerCase().includes(filter))
      );
    }

    // Sort by preferred language speakers first, then by rating
    filteredExperts.sort((a, b) => {
      // If one speaks the preferred language and the other doesn't
      const aHasPreferredLang = a.languages.includes(preferredLanguage);
      const bHasPreferredLang = b.languages.includes(preferredLanguage);

      if (aHasPreferredLang && !bHasPreferredLang) return -1;
      if (!aHasPreferredLang && bHasPreferredLang) return 1;

      // If both or neither speak the preferred language, sort by rating
      return b.rating - a.rating;
    });

    setExperts(filteredExperts);
  }, [preferredLanguage, showAllExperts, availableOnly, expertiseFilter]);

  // Toggle showing all experts vs. language-specific ones
  const toggleShowAllExperts = () => {
    setShowAllExperts(!showAllExperts);
  };

  // Toggle availability filter
  const toggleAvailableOnly = () => {
    setAvailableOnly(!availableOnly);
  };

  // Handle expertise filter change
  const handleExpertiseFilterChange = (e) => {
    setExpertiseFilter(e.target.value);
  };

  // Handle selecting a different language preference
  const handleLanguageChange = (e) => {
    const langCode = e.target.value;
    setPreferredLanguage(langCode);
    localStorage.setItem('preferredExpertLanguage', langCode);
  };

  // Render star ratings
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`full-${i}`} className="star full">★</span>);
    }

    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">★</span>);
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star empty">★</span>);
    }

    return stars;
  };

  if (isLoading) {
    return (
      <div className="expert-matcher loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Finding experts who speak your language...</div>
      </div>
    );
  }

  return (
    <div className="expert-matcher">
      <div className="expert-matcher-banner">
        <div className="banner-icon">🌎</div>
        <div className="banner-text">
          <h2 className="expert-matcher-title">Expert Matching</h2>
          <p className="expert-matcher-description">
            Connect with experts who speak your language for personalized assistance.
          </p>
        </div>
      </div>

      <div className="expert-matcher-filters">
        <div className="language-preference-section">
          <h3 className="section-title">Your Language Preference</h3>
          <div className="filter-group language-filter-group">
            <label htmlFor="language-filter">Preferred Language:</label>
            <select
              id="language-filter"
              value={preferredLanguage}
              onChange={handleLanguageChange}
              className="filter-select"
            >
              {Object.entries(LANGUAGES).map(([code, lang]) => (
                <option key={code} value={code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="language-preference-toggle">
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={!showAllExperts}
                onChange={toggleShowAllExperts}
              />
              <span className="checkbox-label">Show only experts who speak {LANGUAGES[preferredLanguage]?.name}</span>
            </label>
          </div>
        </div>

        <div className="expertise-filter-section">
          <h3 className="section-title">Filter By Expertise</h3>
          <div className="filter-group">
            <label htmlFor="expertise-filter">Area of Expertise:</label>
            <input
              type="text"
              id="expertise-filter"
              value={expertiseFilter}
              onChange={handleExpertiseFilterChange}
              placeholder="Filter by expertise..."
              className="filter-input"
            />
          </div>

          <div className="availability-toggle">
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={toggleAvailableOnly}
              />
              <span className="checkbox-label">Available now</span>
            </label>
          </div>
        </div>
      </div>

      <div className="experts-list">
        {experts.length > 0 ? (
          experts.map(expert => (
            <div key={expert.id} className={`expert-card ${!expert.available ? 'unavailable' : ''}`}>
              <div className="expert-profile-pic">{expert.profilePic}</div>
              <div className="expert-info">
                <h3 className="expert-name">{expert.name}</h3>
                <div className="expert-languages">
                  {expert.languages.map(langCode => (
                    <span
                      key={langCode}
                      className={`expert-language ${langCode === preferredLanguage ? 'preferred' : ''}`}
                      title={LANGUAGES[langCode]?.name}
                    >
                      {LANGUAGES[langCode]?.flag}
                    </span>
                  ))}
                </div>
                <div className="expert-expertise">
                  {expert.expertise.map((item, index) => (
                    <span key={index} className="expertise-tag">{item}</span>
                  ))}
                </div>
                <div className="expert-rating">
                  <div className="rating-stars">
                    {renderStars(expert.rating)}
                  </div>
                  <span className="rating-count">({expert.reviews})</span>
                </div>
              </div>
              <div className="expert-actions">
                <div className={`expert-status ${expert.available ? 'available' : 'unavailable'}`}>
                  {expert.available ? 'Available Now' : 'Currently Busy'}
                </div>
                <button
                  className="connect-btn"
                  disabled={!expert.available}
                >
                  Connect
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-experts-message">
            <p>No experts found matching your criteria.</p>
            <p>Try adjusting your filters or changing your language preference.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpertMatcher;
