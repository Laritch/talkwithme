'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth/authContext';
import Navbar from './Navbar';

interface AppWrapperProps {
  children: ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-zinc-50">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="bg-zinc-900 text-white py-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <p className="text-sm">
                  &copy; {new Date().getFullYear()} SecurePay. All rights reserved.
                </p>
              </div>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="text-sm text-zinc-300 hover:text-white transition-colors"
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  className="text-sm text-zinc-300 hover:text-white transition-colors"
                >
                  Terms of Service
                </a>
                <a
                  href="#"
                  className="text-sm text-zinc-300 hover:text-white transition-colors"
                >
                  Security
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
}
