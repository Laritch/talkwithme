import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './i18n/LanguageContext';
import LanguageSelector from './components/language/LanguageSelector';
import ResourceCard from './components/ResourceCard';
import GlossaryManager from './components/GlossaryManager';
import TranslationEditor from './components/TranslationEditor';
import TranslationAnalytics from './components/TranslationAnalytics';
import LanguageWelcome from './components/LanguageWelcome';
import ExpertMatcher from './components/ExpertMatcher';
import ExpertChat from './components/ExpertChat';
import ExpertScheduler from './components/ExpertScheduler';
import FeedbackSystem from './components/FeedbackSystem';
import ErrorDiagnostic from './components/ErrorDiagnostic'; // Import the ErrorDiagnostic component
import TranslationTest from './TranslationTest'; // Import the TranslationTest component
import AdminAnalytics from './components/AdminAnalytics'; // Import AdminAnalytics component
import AdminDashboard from './components/AdminDashboard'; // Import AdminDashboard component
import DocumentTranslation from './components/DocumentTranslation'; // Import DocumentTranslation component
import OfflineIndicator from './components/OfflineIndicator'; // Import the OfflineIndicator component
import { initializeNotifications, requestNotificationPermission } from './notifications/NotificationManager';
import './App.css';
import './styles/responsive.css'; // Import responsive CSS

/**
 * Sample resource data (in English)
 * In a real application, this would come from an API or database
 */
const sampleResources = [
  {
    id: 1,
    title: 'Introduction to Resource Management',
    description: 'A comprehensive guide to managing digital resources efficiently. Learn the basics of resource categorization, tagging, and organization.',
    type: 'Article',
    category: 'Management',
    author: 'John Smith',
    date: '2023-05-15',
    tags: ['beginner', 'management', 'organization'],
    featured: true
  },
  {
    id: 2,
    title: 'Advanced Data Analysis Techniques',
    description: 'Explore sophisticated methods for analyzing resource usage patterns. This guide covers statistical analysis, trend identification, and predictive modeling.',
    type: 'Guide',
    category: 'Analysis',
    author: 'Maria Rodriguez',
    date: '2023-08-22',
    tags: ['advanced', 'analysis', 'data']
  },
  {
    id: 3,
    title: 'Resource Library API Documentation',
    description: 'Technical documentation for integrating with the Resource Library API. Includes authentication methods, endpoints, and example requests.',
    type: 'Documentation',
    category: 'Technical',
    author: 'Tech Team',
    date: '2023-10-05',
    tags: ['api', 'technical', 'integration']
  },
  {
    id: 4,
    title: 'Digital Asset Management Best Practices',
    description: 'Learn how to effectively organize and manage your digital assets. This guide provides practical tips and industry standards.',
    type: 'Article',
    category: 'Management',
    author: 'Sarah Johnson',
    date: '2023-06-10',
    tags: ['digital assets', 'management', 'best practices']
  },
  {
    id: 5,
    title: 'Content Strategy for Global Markets',
    description: 'Develop effective content strategies for international audiences. This guide focuses on localization, cultural considerations, and engagement metrics.',
    type: 'Guide',
    category: 'Strategy',
    author: 'David Chen',
    date: '2023-07-28',
    tags: ['global', 'content strategy', 'localization'],
    featured: true
  },
  {
    id: 6,
    title: 'Metadata Standards and Implementation',
    description: 'A comprehensive overview of metadata standards and how to implement them in your resource management system.',
    type: 'Documentation',
    category: 'Technical',
    author: 'Alex Patel',
    date: '2023-09-12',
    tags: ['metadata', 'standards', 'technical']
  }
];

// Resource categories
const resourceCategories = [
  { id: 'all', name: 'All Categories' },
  { id: 'management', name: 'Management' },
  { id: 'analysis', name: 'Analysis' },
  { id: 'technical', name: 'Technical' },
  { id: 'strategy', name: 'Strategy' }
];

// Resource types
const resourceTypes = [
  { id: 'all', name: 'All Types' },
  { id: 'article', name: 'Articles' },
  { id: 'guide', name: 'Guides' },
  { id: 'documentation', name: 'Documentation' }
];

/**
 * Main App Component
 */
function App() {
  const [activeTab, setActiveTab] = useState('translation'); // Set to translation as default
  const [showWelcome, setShowWelcome] = useState(false);
  const [appLoaded, setAppLoaded] = useState(false);
  const [selectedExpertId, setSelectedExpertId] = useState('expert-1');
  const [notificationsInitialized, setNotificationsInitialized] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Resource library state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [filteredResources, setFilteredResources] = useState(sampleResources);
  const [isAdmin, setIsAdmin] = useState(false); // Add state for admin status
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');

  // Check if the user is a first-time visitor and initialize notifications
  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited');

    // Show welcome screen for first-time visitors
    if (!hasVisited) {
      setShowWelcome(true);
    }

    // Initialize browser notifications
    if (!notificationsInitialized) {
      initializeNotifications().then(() => {
        setNotificationsInitialized(true);
      });
    }

    setAppLoaded(true);
  }, [notificationsInitialized]);

  // Check admin status on component mount
  useEffect(() => {
    const admin = localStorage.getItem('isAdmin') === 'true';
    setIsAdmin(admin);
  }, []);

  // Filter resources when search term, category, type, or sort changes
  useEffect(() => {
    let results = [...sampleResources];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(resource =>
        resource.title.toLowerCase().includes(term) ||
        resource.description.toLowerCase().includes(term) ||
        resource.author.toLowerCase().includes(term) ||
        resource.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      results = results.filter(resource =>
        resource.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      results = results.filter(resource =>
        resource.type.toLowerCase() === selectedType.toLowerCase()
      );
    }

    // Sort results
    switch(sortBy) {
      case 'date':
        results.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'title':
        results.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'author':
        results.sort((a, b) => a.author.localeCompare(b.author));
        break;
      default:
        results.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Feature items at top if sorting by date
    if (sortBy === 'date') {
      const featured = results.filter(r => r.featured);
      const nonFeatured = results.filter(r => !r.featured);
      results = [...featured, ...nonFeatured];
    }

    setFilteredResources(results);
  }, [searchTerm, selectedCategory, selectedType, sortBy]);

  // Admin login function
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassword === 'admin123') { // Use a secure authentication system in production
      setIsAdmin(true);
      localStorage.setItem('isAdmin', 'true');
      setShowAdminLogin(false);
      setAdminPassword('');
      setAdminLoginError('');
    } else {
      setAdminLoginError('Invalid administrator password');
    }
  };

  // Admin logout function
  const handleAdminLogout = () => {
    setIsAdmin(false);
    localStorage.setItem('isAdmin', 'false');
    setActiveTab('resources'); // Redirect to a regular tab
  };

  // Handle closing the welcome overlay
  const handleCloseWelcome = () => {
    setShowWelcome(false);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle category selection
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  // Handle type selection
  const handleTypeChange = (e) => {
    setSelectedType(e.target.value);
  };

  // Handle sort selection
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedType('all');
    setSortBy('date');
  };

  // Toggle mobile navigation
  const toggleMobileNav = () => {
    setMobileNavOpen(!mobileNavOpen);
  };

  // Handle navigation tab click (closes mobile nav if open)
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (mobileNavOpen) {
      setMobileNavOpen(false);
    }
  };

  // Request notification permissions (used in settings)
  const handleRequestNotifications = async () => {
    const permission = await requestNotificationPermission();
    return permission;
  };

  // Render the active tab content
  const renderTabContent = () => {
    switch(activeTab) {
      case 'resources':
        return (
          <section className="resources-section">
            <div className="section-header">
              <h1 className="section-title">Resources</h1>
              <p className="section-description">
                Browse and discover valuable resources for your projects
              </p>
            </div>

            {/* Enhanced Resource Library Navigation */}
            <div className="resource-navigation">
              <div className="search-and-filters">
                <div className="search-container">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search resources..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                  {searchTerm && (
                    <button
                      className="clear-search-btn"
                      onClick={() => setSearchTerm('')}
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="filter-options">
                  <div className="filter-group">
                    <label>Type:</label>
                    <select
                      value={selectedType}
                      onChange={handleTypeChange}
                      className="filter-select"
                    >
                      {resourceTypes.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>Sort By:</label>
                    <select
                      value={sortBy}
                      onChange={handleSortChange}
                      className="filter-select"
                    >
                      <option value="date">Newest First</option>
                      <option value="title">Title</option>
                      <option value="author">Author</option>
                    </select>
                  </div>

                  {(searchTerm || selectedCategory !== 'all' || selectedType !== 'all') && (
                    <button
                      className="clear-filters-btn"
                      onClick={clearFilters}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>

              <div className="category-tabs">
                {resourceCategories.map(category => (
                  <button
                    key={category.id}
                    className={`category-tab ${selectedCategory === category.id ? 'active' : ''}`}
                    onClick={() => handleCategoryChange(category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="resources-results-info">
              <span>{filteredResources.length} resources found</span>
            </div>

            <div className="resources-grid">
              {filteredResources.length > 0 ? (
                filteredResources.map(resource => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                  />
                ))
              ) : (
                <div className="no-results">
                  <p>No resources match your search criteria.</p>
                  <button
                    className="clear-filters-btn"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </section>
        );

      case 'glossary':
        return <GlossaryManager />;

      case 'translation':
        return <TranslationEditor />;

      case 'document':
        return <DocumentTranslation />;

      case 'analytics':
        return <TranslationAnalytics isAdmin={isAdmin} />; // Pass isAdmin prop to TranslationAnalytics

      case 'experts':
        return <ExpertMatcher />;

      case 'chat':
        return <ExpertChat expertId={selectedExpertId} />;

      case 'scheduler':
        return <ExpertScheduler expertId={selectedExpertId} />;

      case 'feedback':
        return <FeedbackSystem />;

      case 'translationTest':
        return <TranslationTest />;

      case 'adminAnalytics':
        return <AdminAnalytics isAdmin={isAdmin} />; // Render AdminAnalytics for admin users

      case 'adminDashboard':
        return <AdminDashboard isAdmin={isAdmin} />;

      default:
        return <div>Unknown tab</div>;
    }
  };

  return (
    <LanguageProvider>
      <div className="app">
        {/* Show welcome overlay for first-time visitors */}
        {appLoaded && showWelcome && (
          <LanguageWelcome onClose={handleCloseWelcome} />
        )}

        <header className="app-header">
          <div className="app-header-container">
            <div className="app-logo">Resource Library</div>

            {/* Mobile navigation toggle */}
            <button
              className={`mobile-nav-toggle ${mobileNavOpen ? 'active' : ''}`}
              onClick={toggleMobileNav}
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileNavOpen}
            >
              <span className="toggle-bar"></span>
              <span className="toggle-bar"></span>
              <span className="toggle-bar"></span>
            </button>
          </div>

          <nav className={`app-nav ${mobileNavOpen ? 'mobile-open' : ''}`} aria-label="Main Navigation">
            <ul role="menubar">
              <li role="none">
                <button
                  className={`nav-tab ${activeTab === 'resources' ? 'active' : ''}`}
                  onClick={() => handleTabClick('resources')}
                  role="menuitem"
                  aria-current={activeTab === 'resources' ? 'page' : false}
                >
                  Resources
                </button>
              </li>
              <li role="none">
                <button
                  className={`nav-tab ${activeTab === 'glossary' ? 'active' : ''}`}
                  onClick={() => handleTabClick('glossary')}
                  role="menuitem"
                  aria-current={activeTab === 'glossary' ? 'page' : false}
                >
                  Translation Glossary
                </button>
              </li>
              <li role="none">
                <button
                  className={`nav-tab ${activeTab === 'translation' ? 'active' : ''}`}
                  onClick={() => handleTabClick('translation')}
                  role="menuitem"
                  aria-current={activeTab === 'translation' ? 'page' : false}
                >
                  Translation Editor
                </button>
              </li>
              <li role="none">
                <button
                  className={`nav-tab ${activeTab === 'document' ? 'active' : ''}`}
                  onClick={() => handleTabClick('document')}
                  role="menuitem"
                  aria-current={activeTab === 'document' ? 'page' : false}
                >
                  Document Translation
                </button>
              </li>
              <li role="none">
                <button
                  className={`nav-tab ${activeTab === 'experts' ? 'active' : ''}`}
                  onClick={() => handleTabClick('experts')}
                  role="menuitem"
                  aria-current={activeTab === 'experts' ? 'page' : false}
                >
                  Expert Matching
                </button>
              </li>
              <li role="none">
                <button
                  className={`nav-tab ${activeTab === 'chat' ? 'active' : ''}`}
                  onClick={() => handleTabClick('chat')}
                  role="menuitem"
                  aria-current={activeTab === 'chat' ? 'page' : false}
                >
                  Expert Chat
                </button>
              </li>
              <li role="none">
                <button
                  className={`nav-tab ${activeTab === 'scheduler' ? 'active' : ''}`}
                  onClick={() => handleTabClick('scheduler')}
                  role="menuitem"
                  aria-current={activeTab === 'scheduler' ? 'page' : false}
                >
                  Schedule Meeting
                </button>
              </li>
              <li role="none">
                <button
                  className={`nav-tab ${activeTab === 'feedback' ? 'active' : ''}`}
                  onClick={() => handleTabClick('feedback')}
                  role="menuitem"
                  aria-current={activeTab === 'feedback' ? 'page' : false}
                >
                  Feedback
                </button>
              </li>
              <li role="none">
                <button
                  className={`nav-tab ${activeTab === 'translationTest' ? 'active' : ''}`}
                  onClick={() => handleTabClick('translationTest')}
                  role="menuitem"
                  aria-current={activeTab === 'translationTest' ? 'page' : false}
                >
                  Translation Test
                </button>
              </li>
              {/* Admin Dashboard tab - only visible to admins */}
              {isAdmin && (
                <li role="none">
                  <button
                    className={`nav-tab admin-tab ${activeTab === 'adminDashboard' ? 'active' : ''}`}
                    onClick={() => handleTabClick('adminDashboard')}
                    role="menuitem"
                    aria-current={activeTab === 'adminDashboard' ? 'page' : false}
                  >
                    Admin Dashboard
                  </button>
                </li>
              )}
            </ul>
          </nav>

          <div className={`app-controls ${mobileNavOpen ? 'mobile-open' : ''}`}>
            <LanguageSelector />

            {/* Admin controls - regular users only see the admin login option */}
            {isAdmin ? (
              <button
                className="admin-button admin-logout"
                onClick={handleAdminLogout}
                title="Log out of admin mode"
              >
                Admin Logout
              </button>
            ) : (
              <button
                className="admin-button admin-login"
                onClick={() => setShowAdminLogin(true)}
                title="Log in as administrator"
              >
                Admin Login
              </button>
            )}

            {/* Notification permission button */}
            <button
              className="notification-button"
              onClick={handleRequestNotifications}
              title="Enable notifications"
            >
              🔔
            </button>
          </div>
        </header>

        {/* Admin Login Modal */}
        {showAdminLogin && !isAdmin && (
          <div className="admin-login-modal">
            <div className="admin-login-content">
              <h3>Administrator Login</h3>
              <p>Please enter the administrator password to continue</p>

              {adminLoginError && (
                <div className="admin-login-error">{adminLoginError}</div>
              )}

              <form onSubmit={handleAdminLogin}>
                <div className="form-group">
                  <label htmlFor="adminPassword">Password</label>
                  <input
                    type="password"
                    id="adminPassword"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter admin password"
                  />
                </div>

                <div className="admin-login-actions">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => {
                      setShowAdminLogin(false);
                      setAdminPassword('');
                      setAdminLoginError('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="login-button"
                  >
                    Login
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <main className="app-main">
          {renderTabContent()}
        </main>

        <footer className="app-footer">
          <p>Resource Library &copy; 2025</p>
          <p>
            Multi-language support powered by AI translation
          </p>
        </footer>

        <OfflineIndicator />
      </div>
    </LanguageProvider>
  );
}

export default App;
