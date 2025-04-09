import React from 'react';
import Head from 'next/head';
import styles from '../styles/Offline.module.css';

export default function Offline() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Offline | Instructor Chat System</title>
        <meta name="description" content="You are currently offline" />
        <link rel="icon" href="/icons/icon-192x192.png" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>You are currently offline</h1>

        <div className={styles.icon}>
          <img
            src="/icons/icon-192x192.png"
            alt="Offline"
            width={100}
            height={100}
          />
        </div>

        <p className={styles.description}>
          Please check your internet connection and try again. Some features may be available in offline mode.
        </p>

        <div className={styles.actions}>
          <button
            className={styles.button}
            onClick={() => window.location.href = '/'}
          >
            Try Again
          </button>
        </div>
      </main>
    </div>
  );
}
