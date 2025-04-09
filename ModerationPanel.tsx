import { useState } from 'react';
import useWhiteboardModeration from '../hooks/useWhiteboardModeration';
import { ModerationReason, ModerationStatus } from '../types';

const ModerationPanel = () => {
  const {
    moderationConfig,
    flaggedElements,
    pendingElements,
    rejectedElements,
    moderationStats,
    toggleModeration,
    toggleAutoModeration,
    updateSensitivity,
    moderateAllPending,
    approveElement,
    rejectElement,
    addToBlocklist,
    addToAllowlist,
  } = useWhiteboardModeration();

  const [blocklistInput, setBlocklistInput] = useState('');
  const [allowlistInput, setAllowlistInput] = useState('');
  const [activeTab, setActiveTab] = useState<'settings' | 'review'>('settings');

  const handleAddBlocklist = () => {
    if (blocklistInput.trim()) {
      const terms = blocklistInput.trim().split(',').map(term => term.trim());
      addToBlocklist(terms);
      setBlocklistInput('');
    }
  };

  const handleAddAllowlist = () => {
    if (allowlistInput.trim()) {
      const terms = allowlistInput.trim().split(',').map(term => term.trim());
      addToAllowlist(terms);
      setAllowlistInput('');
    }
  };

  const handleModeratePending = async () => {
    if (pendingElements.length > 0) {
      await moderateAllPending();
    }
  };

  const getReasonText = (reason?: ModerationReason) => {
    switch (reason) {
      case ModerationReason.ProfaneLanguage:
        return 'Profane Language';
      case ModerationReason.OffensiveContent:
        return 'Offensive Content';
      case ModerationReason.UnwantedSymbols:
        return 'Unwanted Symbols';
      case ModerationReason.Other:
        return 'Other Issue';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 w-full max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Content Moderation</h2>
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 rounded-md ${
              activeTab === 'settings' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
          <button
            className={`px-3 py-1 rounded-md ${
              activeTab === 'review' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
            onClick={() => setActiveTab('review')}
          >
            Review
            {flaggedElements.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center bg-red-500 text-white rounded-full h-5 w-5 text-xs">
                {flaggedElements.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex justify-between bg-gray-100 rounded-md p-2 mb-4 text-sm">
        <div className="text-center">
          <div className="font-bold">{moderationStats.total}</div>
          <div className="text-xs">Total</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-green-600">{moderationStats.approved}</div>
          <div className="text-xs">Approved</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-yellow-600">{moderationStats.pending}</div>
          <div className="text-xs">Pending</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-orange-600">{moderationStats.flagged}</div>
          <div className="text-xs">Flagged</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-red-600">{moderationStats.rejected}</div>
          <div className="text-xs">Rejected</div>
        </div>
      </div>

      {activeTab === 'settings' ? (
        <>
          {/* Settings Tab */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="font-medium">Enable Moderation</label>
              <div className="relative inline-block w-10 align-middle select-none">
                <input
                  type="checkbox"
                  name="enable-moderation"
                  id="enable-moderation"
                  className="sr-only"
                  checked={moderationConfig.enabled}
                  onChange={(e) => toggleModeration(e.target.checked)}
                />
                <label
                  htmlFor="enable-moderation"
                  className={`block h-6 overflow-hidden rounded-full cursor-pointer ${
                    moderationConfig.enabled ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${
                      moderationConfig.enabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  ></span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="font-medium">Auto-Moderate</label>
              <div className="relative inline-block w-10 align-middle select-none">
                <input
                  type="checkbox"
                  name="auto-moderate"
                  id="auto-moderate"
                  className="sr-only"
                  checked={moderationConfig.autoModerate}
                  onChange={(e) => toggleAutoModeration(e.target.checked)}
                />
                <label
                  htmlFor="auto-moderate"
                  className={`block h-6 overflow-hidden rounded-full cursor-pointer ${
                    moderationConfig.autoModerate ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${
                      moderationConfig.autoModerate ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  ></span>
                </label>
              </div>
            </div>

            <div>
              <label className="font-medium">Sensitivity</label>
              <div className="flex items-center mt-1">
                <span className="text-sm mr-2">Low</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={moderationConfig.sensitivity}
                  onChange={(e) => updateSensitivity(Number(e.target.value))}
                  className="w-full"
                />
                <span className="text-sm ml-2">High</span>
              </div>
              <div className="text-center text-sm text-gray-500 mt-1">
                {moderationConfig.sensitivity}%
              </div>
            </div>

            <div>
              <label className="font-medium">Block List</label>
              <div className="mt-1 flex">
                <input
                  type="text"
                  value={blocklistInput}
                  onChange={(e) => setBlocklistInput(e.target.value)}
                  placeholder="Add comma-separated terms"
                  className="flex-1 px-2 py-1 border rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddBlocklist}
                  className="bg-blue-500 text-white px-3 py-1 rounded-r-md"
                >
                  Add
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Terms currently blocked: {moderationConfig.customBlocklist?.length || 0}
              </div>
            </div>

            <div>
              <label className="font-medium">Allow List</label>
              <div className="mt-1 flex">
                <input
                  type="text"
                  value={allowlistInput}
                  onChange={(e) => setAllowlistInput(e.target.value)}
                  placeholder="Add comma-separated terms"
                  className="flex-1 px-2 py-1 border rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddAllowlist}
                  className="bg-blue-500 text-white px-3 py-1 rounded-r-md"
                >
                  Add
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Terms currently allowed: {moderationConfig.customAllowlist?.length || 0}
              </div>
            </div>

            {pendingElements.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={handleModeratePending}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md"
                >
                  Moderate {pendingElements.length} Pending Elements
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Review Tab */}
          <div>
            <h3 className="font-bold mb-2">Elements Requiring Review</h3>

            {flaggedElements.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No content requires moderation review.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {flaggedElements.map((element) => (
                  <div key={element.id} className="border rounded-md p-3 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                            element.moderationStatus === ModerationStatus.Flagged
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {element.moderationStatus}
                        </span>
                        <span className="ml-2 text-sm">
                          {element.moderationReason && getReasonText(element.moderationReason)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(element.updatedAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="mb-2">
                      <div className="text-sm font-medium">Type: {element.type}</div>
                      {element.type === 'text' && (
                        <p className="text-sm bg-white p-2 rounded border mt-1">
                          {element.text || '<empty text>'}
                        </p>
                      )}
                      {element.type !== 'text' && (
                        <p className="text-sm text-gray-600 italic">
                          {element.type} shape at ({element.x}, {element.y})
                        </p>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => approveElement(element.id)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded-md text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectElement(element.id)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ModerationPanel;
