import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="container">
      <Head>
        <title>Instructor Chat System</title>
        <meta name="description" content="Advanced chat system with PWA support, notifications, PDF export, and analytics" />
      </Head>

      <header className="flex justify-between items-center mt-4 mb-4">
        <div className="flex items-center gap-2">
          <Image
            src="/icons/icon-192x192.png"
            alt="Logo"
            width={40}
            height={40}
            priority
          />
          <h1>Instructor Chat System</h1>
        </div>
        <nav>
          <ul className="flex gap-4">
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/chat">Chat</Link>
            </li>
            <li>
              <Link href="/analytics">Analytics</Link>
            </li>
          </ul>
        </nav>
      </header>

      <main>
        <section className="text-center mt-4 mb-4">
          <h2>Welcome to the Instructor Chat System</h2>
          <p className="mt-4">
            A powerful communication platform designed for instructors and students with advanced features.
          </p>
        </section>

        <section className="mt-4 mb-4">
          <h3>Key Features</h3>
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex gap-4 items-center">
              <div>
                <h4>PWA Support with Offline Mode</h4>
                <p>Continue using the app even when offline, with seamless synchronization when connection is restored.</p>
              </div>
            </div>

            <div className="flex gap-4 items-center">
              <div>
                <h4>Real-time Notifications</h4>
                <p>Stay updated with push notifications for new messages and important events.</p>
              </div>
            </div>

            <div className="flex gap-4 items-center">
              <div>
                <h4>PDF Export for Chat Transcripts</h4>
                <p>Export and share chat conversations as professionally formatted PDFs.</p>
              </div>
            </div>

            <div className="flex gap-4 items-center">
              <div>
                <h4>Analytics Dashboard</h4>
                <p>Gain insights into communication patterns and student engagement with comprehensive analytics.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="text-center mt-4 mb-4">
          <Link href="/chat">
            <button className="button">
              Start Chatting
            </button>
          </Link>
        </section>
      </main>

      <footer className="text-center mt-4 mb-4">
        <p>© 2025 Instructor Chat System. All rights reserved.</p>
      </footer>

      <style jsx>{`
        .container {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        header {
          padding: 1rem 0;
          border-bottom: 1px solid var(--border);
        }

        nav ul {
          list-style: none;
        }

        h1 {
          font-size: 1.5rem;
          font-weight: 600;
        }

        h2 {
          font-size: 2rem;
          font-weight: 700;
        }

        h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        h4 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        p {
          color: var(--text-secondary);
          line-height: 1.5;
        }

        section {
          margin: 2rem 0;
        }

        .button {
          background-color: var(--primary);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 0.375rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .button:hover {
          background-color: var(--primary-dark);
        }

        footer {
          padding: 2rem 0;
          border-top: 1px solid var(--border);
        }
      `}</style>
    </div>
  );
}
