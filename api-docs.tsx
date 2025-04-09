import React from 'react';
import { GetStaticProps, InferGetStaticPropsType } from 'next';
import { createSwaggerSpec } from 'next-swagger-doc';
import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// Dynamically import SwaggerUI to prevent SSR issues
const SwaggerUI = dynamic<{
  spec: Record<string, any>;
}>(import('swagger-ui-react').then((mod) => mod.default), { ssr: false });

function ApiDocs({ spec }: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <div className="swagger-container">
      <header className="swagger-header">
        <div className="container">
          <h1>Instructor Chat System API Documentation</h1>
          <p>
            This documentation provides details about all available API endpoints
            for the Instructor Chat System. Use these endpoints to interact with
            the platform programmatically.
          </p>
        </div>
      </header>

      <div className="swagger-ui-container">
        <SwaggerUI spec={spec} />
      </div>

      <style jsx global>{`
        .swagger-container {
          width: 100%;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .swagger-header {
          background-color: #2c3e50;
          color: white;
          padding: 2rem 0;
          margin-bottom: 1rem;
        }

        .swagger-header .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .swagger-header h1 {
          margin-top: 0;
          margin-bottom: 1rem;
          font-size: 2rem;
        }

        .swagger-header p {
          margin: 0;
          font-size: 1.1rem;
          opacity: 0.8;
        }

        .swagger-ui-container {
          flex: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        /* Override some Swagger UI styles */
        .swagger-ui .topbar {
          display: none;
        }

        .swagger-ui .info {
          margin: 25px 0;
        }

        .swagger-ui .opblock-tag {
          font-size: 20px;
          margin: 10px 0;
        }
      `}</style>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  // Import yaml directly from public folder for client-side rendering
  const spec = createSwaggerSpec({
    apiFolder: 'pages/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Instructor Chat System API',
        version: '1.0.0',
      },
    },
  });

  return {
    props: {
      spec,
    },
  };
};

export default ApiDocs;
