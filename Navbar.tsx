'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/authContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-zinc-900 text-white px-4 py-3 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold">
            SecurePay
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/" className="hover:text-zinc-300 transition-colors">
            Home
          </Link>
          <Link href="/payment" className="hover:text-zinc-300 transition-colors">
            Payment
          </Link>
          <Link href="/about" className="hover:text-zinc-300 transition-colors">
            About
          </Link>
          {isAuthenticated ? (
            <>
              <Link href="/account" className="hover:text-zinc-300 transition-colors">
                My Account
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md font-medium"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={toggleMenu}
            className="focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-zinc-800 mt-2 py-2 rounded-md">
          <div className="flex flex-col space-y-3 px-4">
            <Link
              href="/"
              className="hover:text-zinc-300 transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/payment"
              className="hover:text-zinc-300 transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Payment
            </Link>
            <Link
              href="/about"
              className="hover:text-zinc-300 transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  href="/account"
                  className="hover:text-zinc-300 transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Account
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md font-medium text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md font-medium inline-block"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
