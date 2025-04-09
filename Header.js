import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { toggleSidebar, setSearchQuery } from '../../store/slices/uiSlice';

const Header = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { logout, isAuthenticated } = useAuth();
  const user = useSelector(state => state.user.profile);
  const sidebarOpen = useSelector(state => state.ui.sidebarOpen);
  const cartItems = useSelector(state => state.cart.items);
  const isInstructor = useSelector(state => state.user.isInstructor);

  const [searchValue, setSearchValue] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  // Handle scrolling effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      dispatch(setSearchQuery(searchValue));
      router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  // Toggle sidebar
  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    router.push('/');
  };

  // Categories for dropdown
  const categories = [
    'Development',
    'Business',
    'Finance & Accounting',
    'IT & Software',
    'Office Productivity',
    'Personal Development',
    'Design',
    'Marketing',
    'Health & Fitness',
    'Music',
    'Teaching & Academics'
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 ${isScrolled ? 'shadow-md' : ''} transition-shadow duration-300`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left Section: Logo and Mobile Menu Button */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center ml-2 md:ml-0">
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">EduPlatform</span>
            </Link>

            {/* Categories dropdown - Desktop */}
            <div className="relative ml-6 hidden md:block">
              <button
                className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                onClick={() => setCategoriesOpen(!categoriesOpen)}
              >
                Categories
                <svg className={`w-4 h-4 ml-1 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Categories Dropdown Menu */}
              {categoriesOpen && (
                <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    {categories.map((category) => (
                      <Link
                        key={category}
                        href={`/categories/${category.toLowerCase().replace(/&|\s+/g, '-')}`}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        role="menuitem"
                        onClick={() => setCategoriesOpen(false)}
                      >
                        {category}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center Section: Search Bar */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for anything"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
                <button
                  type="submit"
                  className="absolute right-0 top-0 h-full px-4 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>
          </div>

          {/* Right Section: User Navigation */}
          <div className="flex items-center space-x-4">
            {/* Mobile Search Icon */}
            <button
              className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => router.push('/search')}
              aria-label="Search"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Teach Link - For all users */}
            <Link
              href="/teach"
              className="hidden md:block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            >
              Teach
            </Link>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="hidden md:flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>

            {/* Shopping Cart */}
            <Link
              href="/cart"
              className="relative text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </Link>

            {/* Conditional User Menu or Login/Signup */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  className="flex items-center space-x-1 focus:outline-none"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <img
                    src={user?.avatar || "https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff"}
                    alt="User"
                    className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600"
                  />
                  <span className="hidden md:block text-sm text-gray-700 dark:text-gray-300">{user?.name || 'User'}</span>
                </button>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      <Link
                        href="/my-learning"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        My Learning
                      </Link>

                      {isInstructor && (
                        <Link
                          href="/instructor/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Instructor Dashboard
                        </Link>
                      )}

                      <Link
                        href="/account/settings"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Settings
                      </Link>

                      <button
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        role="menuitem"
                        onClick={handleLogout}
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="hidden md:block bg-blue-600 hover:bg-blue-700 text-white py-1 px-4 rounded-md transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Toggle Sidebar Button (visible on larger screens) */}
            <button
              className="hidden lg:block p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={handleToggleSidebar}
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M4 6h16M4 12h16M4 18h16" : "M4 6h16M4 12h8M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div className={`md:hidden bg-white dark:bg-gray-900 shadow-md ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="p-4 space-y-4">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for anything"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-full px-4 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* Categories Dropdown */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
            <button
              className="flex items-center justify-between w-full text-gray-700 dark:text-gray-300 font-medium"
              onClick={() => setCategoriesOpen(!categoriesOpen)}
            >
              Categories
              <svg className={`w-4 h-4 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {categoriesOpen && (
              <div className="mt-2 ml-4 space-y-2">
                {categories.map((category) => (
                  <Link
                    key={category}
                    href={`/categories/${category.toLowerCase().replace(/&|\s+/g, '-')}`}
                    className="block py-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => {
                      setCategoriesOpen(false);
                      setMobileMenuOpen(false);
                    }}
                  >
                    {category}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Navigation Links */}
          <nav className="space-y-3">
            <Link
              href="/my-learning"
              className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              My Learning
            </Link>
            <Link
              href="/wishlist"
              className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              Wishlist
            </Link>
            <Link
              href="/teach"
              className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              Teach on EduPlatform
            </Link>

            {isInstructor && (
              <Link
                href="/instructor/dashboard"
                className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                Instructor Dashboard
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
