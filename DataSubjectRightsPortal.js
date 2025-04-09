import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addDataSubjectRequest } from '../../store/slices/complianceSlice';

const DataSubjectRightsPortal = () => {
  const dispatch = useDispatch();
  const { userRegion, dataSubjectRequests } = useSelector(state => state.compliance);
  const [showGDPROptions, setShowGDPROptions] = useState(false);
  const [requestType, setRequestType] = useState('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [previousRequests, setPreviousRequests] = useState([]);

  // Check if user is in a GDPR region
  useEffect(() => {
    const gdprRegions = [
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'UK', 'GB',
      'EU' // Generic EU marker
    ];

    setShowGDPROptions(gdprRegions.includes(userRegion));

    // Filter requests that belong to the current user
    if (dataSubjectRequests && dataSubjectRequests.length > 0) {
      setPreviousRequests(dataSubjectRequests);
    }
  }, [userRegion, dataSubjectRequests]);

  if (!showGDPROptions) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    // Create a unique ID for this request
    const requestId = 'req-' + Date.now();

    // Dispatch the action to add this request
    dispatch(addDataSubjectRequest({
      id: requestId,
      type: requestType,
      details,
      createdAt: new Date().toISOString()
    }));

    // Reset form and show success message
    setRequestType('');
    setDetails('');
    setSubmitted(true);

    // Hide success message after 5 seconds
    setTimeout(() => {
      setSubmitted(false);
    }, 5000);
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Pending</span>;
      case 'processing':
        return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Processing</span>;
      case 'completed':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Completed</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Rejected</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">{status}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-6 py-4 bg-blue-600 text-white">
        <h2 className="text-xl font-bold">Data Subject Rights Portal</h2>
        <p className="text-blue-100 mt-1">Exercise your rights under GDPR</p>
      </div>

      {submitted && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 m-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                Your request has been submitted successfully. We will process it as soon as possible.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Submit a New Request</h3>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="requestType">
                  Request Type
                </label>
                <select
                  id="requestType"
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a request type</option>
                  <option value="access">Right to Access (Get a copy of your data)</option>
                  <option value="rectification">Right to Rectification (Correct your data)</option>
                  <option value="erasure">Right to Erasure (Delete your data)</option>
                  <option value="restriction">Right to Restrict Processing</option>
                  <option value="portability">Right to Data Portability</option>
                  <option value="objection">Right to Object to Processing</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="details">
                  Additional Details
                </label>
                <textarea
                  id="details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Please provide any additional details about your request..."
                ></textarea>
              </div>

              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <p className="text-sm text-gray-600">
                  We will process your request within 30 days as required by GDPR.
                  You may be asked to verify your identity before we can proceed with your request.
                </p>
              </div>

              <button
                type="submit"
                disabled={!requestType}
                className={`px-4 py-2 rounded-md ${
                  requestType
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Submit Request
              </button>
            </form>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Your Rights</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <strong>Right to Access</strong>: You can request a copy of your personal data.
              </li>
              <li>
                <strong>Right to Rectification</strong>: You can have inaccurate data corrected.
              </li>
              <li>
                <strong>Right to Erasure</strong>: You can request deletion of your data.
              </li>
              <li>
                <strong>Right to Restrict Processing</strong>: You can limit how we use your data.
              </li>
              <li>
                <strong>Right to Data Portability</strong>: You can request your data in a reusable format.
              </li>
              <li>
                <strong>Right to Object</strong>: You can object to certain types of processing.
              </li>
            </ul>
          </div>
        </div>

        {previousRequests.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Previous Requests</h3>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {previousRequests.map((request) => (
                  <li key={request.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        {getRequestTypeLabel(request.type)}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        {getStatusBadge(request.status)}
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {request.details && request.details.substring(0, 100)}
                          {request.details && request.details.length > 100 ? '...' : ''}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          Submitted on {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to get readable labels for request types
function getRequestTypeLabel(type) {
  const labels = {
    'access': 'Right to Access',
    'rectification': 'Right to Rectification',
    'erasure': 'Right to Erasure',
    'restriction': 'Right to Restrict Processing',
    'portability': 'Right to Data Portability',
    'objection': 'Right to Object to Processing'
  };

  return labels[type] || type;
}

export default DataSubjectRightsPortal;
