import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  CloudArrowUpIcon,
  LinkIcon,
  FolderIcon,
  DocumentIcon,
  DocumentTextIcon,
  PresentationChartBarIcon,
  VideoCameraIcon,
  TableCellsIcon,
  PhotoIcon,
  ArrowPathIcon,
  QuestionMarkCircleIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { useTranslation } from './i18n';

// Platform icons and colors
const platformConfig = {
  sharepoint: {
    name: 'Microsoft SharePoint',
    icon: <img src="https://same-assets.com/logo/sharepoint_logo.svg" alt="SharePoint" className="h-6 w-6" />,
    color: 'bg-blue-600',
    textColor: 'text-blue-600',
    lightColor: 'bg-blue-50'
  },
  googledrive: {
    name: 'Google Drive',
    icon: <img src="https://same-assets.com/logo/google_drive_logo.svg" alt="Google Drive" className="h-6 w-6" />,
    color: 'bg-green-600',
    textColor: 'text-green-600',
    lightColor: 'bg-green-50'
  },
  onedrive: {
    name: 'OneDrive',
    icon: <img src="https://same-assets.com/logo/onedrive_logo.svg" alt="OneDrive" className="h-6 w-6" />,
    color: 'bg-blue-500',
    textColor: 'text-blue-500',
    lightColor: 'bg-blue-50'
  },
  dropbox: {
    name: 'Dropbox',
    icon: <img src="https://same-assets.com/logo/dropbox_logo.svg" alt="Dropbox" className="h-6 w-6" />,
    color: 'bg-blue-400',
    textColor: 'text-blue-400',
    lightColor: 'bg-blue-50'
  }
};

// Mock API function for connecting to external services
const connectToService = async (service) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, service });
    }, 2000);
  });
};

// Mock API function for fetching documents from a service
const fetchDocuments = async (service, query = '') => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate searching/filtering if a query is provided
      let documents = [
        {
          id: `${service}-doc1`,
          name: 'Marketing Strategy 2023.pptx',
          type: 'presentation',
          size: '4.2 MB',
          lastModified: '2023-04-15T10:30:00Z',
          owner: 'Sarah Johnson',
          url: 'https://example.com/doc1'
        },
        {
          id: `${service}-doc2`,
          name: 'Q2 Financial Report.xlsx',
          type: 'spreadsheet',
          size: '1.8 MB',
          lastModified: '2023-04-10T14:20:00Z',
          owner: 'Michael Chen',
          url: 'https://example.com/doc2'
        },
        {
          id: `${service}-doc3`,
          name: 'Product Launch Plan.docx',
          type: 'document',
          size: '950 KB',
          lastModified: '2023-04-05T09:15:00Z',
          owner: 'Jessica Williams',
          url: 'https://example.com/doc3'
        },
        {
          id: `${service}-doc4`,
          name: 'Company Handbook.pdf',
          type: 'pdf',
          size: '3.5 MB',
          lastModified: '2023-03-28T11:45:00Z',
          owner: 'David Kim',
          url: 'https://example.com/doc4'
        },
        {
          id: `${service}-doc5`,
          name: 'Sales Training Video.mp4',
          type: 'video',
          size: '28.6 MB',
          lastModified: '2023-03-20T15:10:00Z',
          owner: 'Amanda Rodriguez',
          url: 'https://example.com/doc5'
        }
      ];

      if (query) {
        const lowerQuery = query.toLowerCase();
        documents = documents.filter(doc =>
          doc.name.toLowerCase().includes(lowerQuery) ||
          doc.owner.toLowerCase().includes(lowerQuery) ||
          doc.type.toLowerCase().includes(lowerQuery)
        );
      }

      resolve(documents);
    }, 1500);
  });
};

// Mock API function for importing a document
const importDocument = async (document, targetCollection) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate importing and converting to library resource
      const importedResource = {
        id: `imported-${document.id}`,
        title: document.name.split('.')[0],
        type: document.type === 'presentation' ? 'presentation' :
              document.type === 'spreadsheet' ? 'spreadsheet' :
              document.type === 'document' ? 'article' :
              document.type === 'pdf' ? 'ebook' :
              document.type === 'video' ? 'video' : 'article',
        url: document.url,
        accessLevel: 'all',
        description: `Imported from ${document.owner}'s ${platformConfig[targetCollection]?.name || targetCollection} account.`,
        tags: [],
        createdAt: new Date().toISOString(),
        importedFrom: targetCollection,
        originalOwner: document.owner
      };

      resolve({ success: true, resource: importedResource });
    }, 2000);
  });
};

const ExternalIntegrations = ({ onClose, onImportSuccess }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('sharepoint');
  const [connectedServices, setConnectedServices] = useState([]);
  const [connecting, setConnecting] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importedResources, setImportedResources] = useState([]);
  const [error, setError] = useState(null);

  // Load documents for the active tab
  useEffect(() => {
    const loadDocuments = async () => {
      if (!connectedServices.includes(activeTab)) return;

      setLoading(true);
      setError(null);

      try {
        const results = await fetchDocuments(activeTab, searchQuery);
        setDocuments(results);
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Failed to load documents. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, [activeTab, connectedServices, searchQuery]);

  // Connect to external service
  const handleConnect = async (service) => {
    setConnecting(true);
    setError(null);

    try {
      const result = await connectToService(service);
      if (result.success) {
        setConnectedServices([...connectedServices, service]);
      }
    } catch (err) {
      console.error('Error connecting to service:', err);
      setError(`Failed to connect to ${platformConfig[service]?.name || service}.`);
    } finally {
      setConnecting(false);
    }
  };

  // Handle document selection toggle
  const handleSelectDocument = (doc) => {
    if (selectedDocuments.find(d => d.id === doc.id)) {
      setSelectedDocuments(selectedDocuments.filter(d => d.id !== doc.id));
    } else {
      setSelectedDocuments([...selectedDocuments, doc]);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    // Search is triggered by the useEffect when searchQuery changes
  };

  // Import selected documents
  const handleImport = async () => {
    if (selectedDocuments.length === 0) return;

    setImporting(true);
    setError(null);
    setImportedResources([]);

    try {
      const importedDocs = [];

      for (const doc of selectedDocuments) {
        const result = await importDocument(doc, activeTab);
        if (result.success) {
          importedDocs.push(result.resource);
        }
      }

      setImportedResources(importedDocs);
      setImportSuccess(true);

      if (onImportSuccess) {
        onImportSuccess(importedDocs);
      }
    } catch (err) {
      console.error('Error importing documents:', err);
      setError('Failed to import one or more documents. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  // Get icon for document type
  const getDocumentIcon = (type) => {
    switch (type) {
      case 'document':
        return <DocumentIcon className="h-5 w-5 text-blue-500" />;
      case 'presentation':
        return <PresentationChartBarIcon className="h-5 w-5 text-amber-500" />;
      case 'spreadsheet':
        return <TableCellsIcon className="h-5 w-5 text-green-500" />;
      case 'pdf':
        return <DocumentTextIcon className="h-5 w-5 text-red-500" />;
      case 'video':
        return <VideoCameraIcon className="h-5 w-5 text-indigo-500" />;
      case 'image':
        return <PhotoIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <DocumentIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <CloudArrowUpIcon className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">External Integrations</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="px-6 flex -mb-px overflow-x-auto">
            {Object.keys(platformConfig).map((platform) => (
              <button
                key={platform}
                className={`py-4 px-6 border-b-2 font-medium text-sm whitespace-nowrap flex items-center ${
                  activeTab === platform
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab(platform)}
              >
                <span className="mr-2">{platformConfig[platform].icon}</span>
                {platformConfig[platform].name}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Connection Status */}
          {!connectedServices.includes(activeTab) ? (
            <div className="text-center py-12">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
                <LinkIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Connect to {platformConfig[activeTab].name}</h3>
              <p className="mt-2 text-sm text-gray-500">
                Connect your account to import documents directly into the library.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => handleConnect(activeTab)}
                  disabled={connecting}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 ${
                    connecting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  {connecting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connecting...
                    </>
                  ) : (
                    <>
                      Connect to {platformConfig[activeTab].name}
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : importSuccess ? (
            <div className="text-center py-12">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <CheckIcon className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Import Successful</h3>
              <p className="mt-2 text-sm text-gray-500">
                {importedResources.length} {importedResources.length === 1 ? 'document' : 'documents'} imported successfully.
              </p>
              <div className="mt-6 flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setImportSuccess(false);
                    setSelectedDocuments([]);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Import More Documents
                </button>
                <button
                  onClick={onClose}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Search and import */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
                <form onSubmit={handleSearch} className="relative flex-grow max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder={`Search ${platformConfig[activeTab].name}...`}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>

                <button
                  onClick={handleImport}
                  disabled={selectedDocuments.length === 0 || importing}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 ${
                    selectedDocuments.length === 0 || importing ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  {importing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Importing...
                    </>
                  ) : (
                    <>
                      Import Selected ({selectedDocuments.length})
                    </>
                  )}
                </button>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents list */}
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12 border border-gray-200 rounded-lg">
                  <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No documents found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchQuery ? 'Try a different search term.' : 'Upload documents to your account to see them here.'}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200">
                  <ul className="divide-y divide-gray-200">
                    {documents.map(doc => (
                      <li
                        key={doc.id}
                        className={`py-4 px-6 flex items-center hover:bg-gray-50 cursor-pointer ${
                          selectedDocuments.find(d => d.id === doc.id) ? 'bg-indigo-50' : ''
                        }`}
                        onClick={() => handleSelectDocument(doc)}
                      >
                        <div className="min-w-0 flex-1 flex items-center">
                          <div className="flex-shrink-0 p-2 rounded-md bg-gray-100">
                            {getDocumentIcon(doc.type)}
                          </div>
                          <div className="min-w-0 flex-1 px-4">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-indigo-600 truncate">{doc.name}</p>
                              <div className="ml-2 flex-shrink-0 flex">
                                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                  {doc.size}
                                </p>
                              </div>
                            </div>
                            <div className="mt-1 flex items-center text-xs text-gray-500">
                              <p>
                                {doc.owner} • {formatDate(doc.lastModified)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="ml-4 flex-shrink-0">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            checked={!!selectedDocuments.find(d => d.id === doc.id)}
                            onChange={() => {}} // Handled by the li click
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExternalIntegrations;
