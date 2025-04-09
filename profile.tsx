import React from 'react';
import { GetServerSideProps } from 'next';
import { getSession, useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import ProfileSettings from '../components/ProfileSettings';
import NotificationSettings from '../components/NotificationSettings';

export default function Profile() {
  const { data: session, status } = useSession();
  const loading = status === 'loading';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!session) {
    // This page is protected - redirect to login if not authenticated
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <Head>
          <title>Sign In Required | Instructor Chat System</title>
        </Head>
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <svg className="h-16 w-16 text-yellow-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="mt-4 text-xl font-bold text-gray-900">Authentication Required</h2>
          <p className="mt-2 text-gray-600">
            You need to be signed in to access this page.
          </p>
          <div className="mt-6">
            <Link
              href="/auth/signin?callbackUrl=/profile"
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Profile | Instructor Chat System</title>
      </Head>

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="relative h-8 w-8">
              <Image
                src="/icons/icon-192x192.png"
                alt="Logo"
                fill
                sizes="32px"
                className="object-contain"
              />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Instructor Chat System</h1>
          </div>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link href="/" className="text-gray-600 hover:text-gray-900">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/chat" className="text-gray-600 hover:text-gray-900">
                  Chat
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="text-gray-600 hover:text-gray-900">
                  Analytics
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-primary-600 font-medium">
                  Profile
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Info Summary */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-primary-700 text-white">
              <h3 className="text-lg font-medium">Account Information</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="relative h-20 w-20">
                  <Image
                    src={session.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name || '')}&background=3b82f6&color=fff`}
                    alt={session.user.name || ''}
                    fill
                    sizes="80px"
                    className="rounded-full border-4 border-white shadow object-cover"
                  />
                </div>
                <div className="ml-4">
                  <h2 className="text-2xl font-bold text-gray-900">{session.user.name}</h2>
                  <p className="text-gray-600">{session.user.email}</p>
                  <p className="text-sm text-gray-500 mt-1 capitalize">{session.user.role}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Quick Links</h4>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/chat"
                      className="flex items-center text-primary-600 hover:text-primary-800"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      My Chats
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/analytics"
                      className="flex items-center text-primary-600 hover:text-primary-800"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Analytics
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/auth/signout"
                      className="flex items-center text-red-600 hover:text-red-800"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Main Content Area - spans 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-8">
            <ProfileSettings
              onUpdate={(profile) => console.log('Profile updated:', profile)}
            />

            <NotificationSettings
              onStatusChange={(status) => console.log('Notification status:', status)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  return {
    props: {
      session,
    },
  };
};
