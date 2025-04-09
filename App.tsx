import { useState } from 'react';
import Whiteboard from './components/Whiteboard';
import ToolBar from './components/ToolBar';
import ModerationPanel from './components/ModerationPanel';

function App() {
  const [showModerationPanel, setShowModerationPanel] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Whiteboard with Content Moderation</h1>
          <button
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md flex items-center space-x-2"
            onClick={() => setShowModerationPanel(!showModerationPanel)}
          >
            <span>Moderation Controls</span>
            {showModerationPanel ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M14.293 5.293a1 1 0 00-1.414 0L10 8.586 6.707 5.293a1 1 0 00-1.414 1.414L8.586 10l-3.293 3.293a1 1 0 101.414 1.414L10 11.414l3.293 3.293a1 1 0 001.414-1.414L11.414 10l3.293-3.293a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-grow">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <ToolBar />
              <Whiteboard width={800} height={600} />
            </div>

            <div className="mt-4 bg-yellow-50 border border-yellow-300 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-yellow-800 mb-2">Content Moderation Demo</h2>
              <p className="text-yellow-700 text-sm mb-2">
                This whiteboard features automatic content moderation. Try adding some inappropriate text
                or drawing shapes, and see how the moderation system handles them.
              </p>
              <p className="text-yellow-700 text-sm mb-2">
                Content will be automatically flagged, and you can manage moderations from the Moderation
                Controls panel. Every element has a moderation status, and the system can be configured
                to suit different needs.
              </p>
              <p className="text-yellow-700 text-sm">
                For demo purposes, try adding text containing "profanity", "offensive", or "inappropriate"
                to see the system in action.
              </p>
            </div>
          </div>

          {showModerationPanel && (
            <div className="w-full md:w-96">
              <ModerationPanel />
            </div>
          )}
        </div>
      </main>

      <footer className="bg-gray-800 text-white p-4 mt-8">
        <div className="container mx-auto text-center text-sm">
          <p>Whiteboard Moderation System Demo</p>
          <p className="mt-1 text-gray-400">
            Built with React, TypeScript, and TailwindCSS
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
