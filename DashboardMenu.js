import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

// Feature icons
import {
  CalendarIcon,
  VideoCameraIcon,
  ChatIcon,
  PencilAltIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ShoppingCartIcon,
  BadgeCheckIcon,
  MailIcon,
  BookOpenIcon,
  ChartBarIcon,
  CogIcon
} from '@heroicons/react/outline';

/**
 * Shared dashboard menu for both experts and clients
 * Provides access to all platform features based on user role
 */
const DashboardMenu = ({ variant = 'sidebar' }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [expanded, setExpanded] = useState({});

  // For mobile view
  const [menuOpen, setMenuOpen] = useState(false);

  // Determine if user is an expert or client
  const isExpert = user?.role === 'expert';
  const baseRoute = isExpert ? '/expert' : '/client';

  // Helper function to check if a menu item is active
  const isActive = (path) => {
    return router.pathname.startsWith(path);
  };

  // Toggle expand/collapse for submenu
  const toggleExpand = (key) => {
    setExpanded(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Feature access based on role
  const canAccessFeature = (feature) => {
    // Features available to both roles
    const sharedFeatures = [
      'sessions', 'chat', 'messages', 'payments', 'resources'
    ];

    // Expert-only features
    const expertFeatures = [
      'webinars_create', 'analytics', 'ecommerce_manage', 'loyalty_manage'
    ];

    // Client-only features
    const clientFeatures = [
      'ecommerce_browse', 'loyalty_view'
    ];

    if (sharedFeatures.includes(feature)) return true;
    if (isExpert && expertFeatures.includes(feature)) return true;
    if (!isExpert && clientFeatures.includes(feature)) return true;

    return false;
  };

  // Common link styling
  const linkClass = (isActiveLink) => `
    flex items-center px-4 py-2 text-sm font-medium rounded-md
    ${isActiveLink
      ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}
  `;

  // Category title styling
  const categoryClass = `
    px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider
    dark:text-gray-400
  `;

  // Menu items shared by both roles with conditional display
  const menuItems = [
    // Sessions and Appointments
    {
      category: 'Core Features',
      items: [
        {
          name: isExpert ? 'My Sessions' : 'My Sessions',
          href: `${baseRoute}/sessions`,
          icon: CalendarIcon,
          feature: 'sessions'
        },
        {
          name: isExpert ? 'Host Webinars' : 'Join Webinars',
          href: `${baseRoute}/webinars`,
          icon: VideoCameraIcon,
          feature: isExpert ? 'webinars_create' : 'sessions'
        },
        {
          name: 'Live Sessions',
          href: `${baseRoute}/live-sessions`,
          icon: VideoCameraIcon,
          feature: 'sessions',
          badge: isExpert ? 'Host' : 'Join'
        }
      ]
    },

    // Communication
    {
      category: 'Communication',
      items: [
        {
          name: 'Chat',
          href: `${baseRoute}/chat`,
          icon: ChatIcon,
          feature: 'chat'
        },
        {
          name: 'Whiteboard',
          href: `${baseRoute}/whiteboard`,
          icon: PencilAltIcon,
          feature: 'sessions'
        },
        {
          name: 'Messages',
          href: `${baseRoute}/messages`,
          icon: MailIcon,
          feature: 'messages'
        }
      ]
    },

    // Learning & Content
    {
      category: 'Learning & Content',
      items: [
        {
          name: isExpert ? 'My Programs' : 'My Programs',
          href: `${baseRoute}/programs`,
          icon: BookOpenIcon,
          feature: 'resources'
        },
        {
          name: 'Resources & Tutorials',
          href: `${baseRoute}/resources`,
          icon: DocumentTextIcon,
          feature: 'resources'
        },
        ...(isExpert ? [{
          name: 'Analytics',
          href: '/expert/analytics',
          icon: ChartBarIcon,
          feature: 'analytics'
        }] : [])
      ]
    },

    // Commerce & Payments
    {
      category: 'Commerce & Rewards',
      items: [
        {
          name: 'Payments',
          href: `${baseRoute}/payments`,
          icon: CreditCardIcon,
          feature: 'payments'
        },
        {
          name: isExpert ? 'My Store' : 'Marketplace',
          href: `${baseRoute}/ecommerce`,
          icon: ShoppingCartIcon,
          feature: isExpert ? 'ecommerce_manage' : 'ecommerce_browse'
        },
        {
          name: isExpert ? 'Loyalty Program Management' : 'My Rewards',
          href: `${baseRoute}/loyalty`,
          icon: BadgeCheckIcon,
          feature: isExpert ? 'loyalty_manage' : 'loyalty_view'
        }
      ]
    },

    // Settings
    {
      category: 'Settings',
      items: [
        {
          name: 'Account Settings',
          href: `${baseRoute}/settings`,
          icon: CogIcon,
          feature: 'sessions'
        }
      ]
    }
  ];

  // Generate sidebar navigation
  const renderSidebar = () => (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex-shrink-0 px-4 flex items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isExpert ? 'Expert Dashboard' : 'Client Dashboard'}
          </h2>
        </div>

        <nav className="mt-5 flex-1 px-2 space-y-1">
          {menuItems.map((section, idx) => (
            <div key={idx} className="pb-2">
              <h3 className={categoryClass}>
                {section.category}
              </h3>

              <div className="space-y-1 mt-1">
                {section.items.filter(item => canAccessFeature(item.feature)).map((item, itemIdx) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={itemIdx}
                      href={item.href}
                      className={linkClass(active)}
                    >
                      <Icon className="mr-3 flex-shrink-0 h-5 w-5" aria-hidden="true" />
                      <span className="truncate">{item.name}</span>

                      {item.badge && (
                        <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );

  // Generate horizontal navigation (for mobile/alternative view)
  const renderHorizontal = () => (
    <div className="bg-white dark:bg-gray-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {isExpert ? 'Expert Dashboard' : 'Client Dashboard'}
              </h2>
            </div>

            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {/* Show only top-level items in horizontal nav */}
              {menuItems.slice(0, 2).flatMap(section =>
                section.items
                  .filter(item => canAccessFeature(item.feature))
                  .slice(0, 3) // Limit to first 3 items
                  .map((item, idx) => {
                    const active = isActive(item.href);

                    return (
                      <Link
                        key={idx}
                        href={item.href}
                        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                          active
                            ? 'border-blue-500 text-gray-900 dark:text-white'
                            : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        {item.name}
                      </Link>
                    );
                  })
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${menuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${menuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, toggle classes based on menu state */}
      <div className={`${menuOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          {menuItems.flatMap(section =>
            section.items
              .filter(item => canAccessFeature(item.feature))
              .map((item, idx) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={idx}
                    href={item.href}
                    className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                      active
                        ? 'border-blue-500 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })
          )}
        </div>
      </div>
    </div>
  );

  // Render based on variant prop
  return variant === 'sidebar' ? renderSidebar() : renderHorizontal();
};

export default DashboardMenu;
