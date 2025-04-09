'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Mock security alerts for demonstration
interface SecurityAlert {
  id: string;
  timestamp: string;
  type: 'fraud' | 'attack' | 'suspicious' | 'vulnerability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ipAddress: string;
  location?: string;
  paymentMethod?: string;
  transactionId?: string;
  status: 'new' | 'investigating' | 'resolved' | 'false-positive';
}

// Mock data for security alerts related to potential attacks
const MOCK_SECURITY_ALERTS: SecurityAlert[] = [
  {
    id: 'alert-001',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    type: 'attack',
    severity: 'high',
    description: 'Multiple failed payment attempts with different credit cards from same IP address',
    ipAddress: '45.227.xx.xx',
    location: 'Unknown (VPN detected)',
    paymentMethod: 'credit-card',
    transactionId: 'tx-9876543',
    status: 'new'
  },
  {
    id: 'alert-002',
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    type: 'suspicious',
    severity: 'medium',
    description: 'Unusual payment pattern: Multiple small transactions followed by large transaction',
    ipAddress: '196.201.xx.xx',
    location: 'Kenya',
    paymentMethod: 'mpesa',
    transactionId: 'tx-8765432',
    status: 'investigating'
  },
  {
    id: 'alert-003',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    type: 'fraud',
    severity: 'critical',
    description: 'Payment attempt with known compromised card',
    ipAddress: '103.59.xx.xx',
    location: 'China',
    paymentMethod: 'credit-card',
    transactionId: 'tx-7654321',
    status: 'investigating'
  },
  {
    id: 'alert-004',
    timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
    type: 'vulnerability',
    severity: 'medium',
    description: 'Attempted SQL injection in payment form',
    ipAddress: '91.108.xx.xx',
    location: 'Russia',
    status: 'resolved'
  },
  {
    id: 'alert-005',
    timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),
    type: 'attack',
    severity: 'high',
    description: 'Brute force API rate limit exceeded for payment endpoint',
    ipAddress: '185.220.xx.xx',
    location: 'Tor Exit Node',
    status: 'resolved'
  },
];

export default function SecurityMonitor() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);

  // Load alerts on component mount
  useEffect(() => {
    // In a real app, this would fetch from an API
    setAlerts(MOCK_SECURITY_ALERTS);
  }, []);

  // Apply filters to alerts
  const filteredAlerts = alerts.filter(alert => {
    const typeMatch = filterType === 'all' || alert.type === filterType;
    const severityMatch = filterSeverity === 'all' || alert.severity === filterSeverity;
    return typeMatch && severityMatch;
  });

  // Handle alert status update
  const updateAlertStatus = (alertId: string, newStatus: SecurityAlert['status']) => {
    setAlerts(alerts.map(alert =>
      alert.id === alertId ? { ...alert, status: newStatus } : alert
    ));

    if (selectedAlert?.id === alertId) {
      setSelectedAlert({ ...selectedAlert, status: newStatus });
    }
  };

  // Get color for severity badge
  const getSeverityColor = (severity: SecurityAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get color for alert type badge
  const getTypeColor = (type: SecurityAlert['type']) => {
    switch (type) {
      case 'attack': return 'bg-purple-100 text-purple-800';
      case 'fraud': return 'bg-red-100 text-red-800';
      case 'suspicious': return 'bg-yellow-100 text-yellow-800';
      case 'vulnerability': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Filters and Alert List */}
      <div className="lg:col-span-1">
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 mb-4">
          <h2 className="text-lg font-medium mb-3">Filter Alerts</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alert Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Types</option>
              <option value="attack">Attack</option>
              <option value="fraud">Fraud</option>
              <option value="suspicious">Suspicious Activity</option>
              <option value="vulnerability">Vulnerability</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Severity
            </label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Security Alerts List */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <h2 className="p-4 border-b border-gray-200 font-medium">
            Security Alerts ({filteredAlerts.length})
          </h2>

          <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
            {filteredAlerts.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No alerts match your filters
              </div>
            ) : (
              filteredAlerts.map(alert => (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${
                    selectedAlert?.id === alert.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      alert.status === 'new' ? 'bg-red-100 text-red-800' :
                      alert.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                      alert.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {alert.status}
                    </span>
                  </div>

                  <h3 className="font-medium mb-1 line-clamp-2">{alert.description}</h3>

                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    <span>{alert.type}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Alert Details */}
      <div className="lg:col-span-2">
        {selectedAlert ? (
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-medium">Alert Details</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(selectedAlert.type)}`}>
                {selectedAlert.type}
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">{selectedAlert.description}</h3>
              <p className="text-gray-600 mb-4">
                Detected at {new Date(selectedAlert.timestamp).toLocaleString()}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="block text-sm font-medium text-gray-700">Severity</span>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(selectedAlert.severity)}`}>
                    {selectedAlert.severity}
                  </span>
                </div>

                <div>
                  <span className="block text-sm font-medium text-gray-700">Status</span>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                    selectedAlert.status === 'new' ? 'bg-red-100 text-red-800' :
                    selectedAlert.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                    selectedAlert.status === 'resolved' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedAlert.status}
                  </span>
                </div>

                <div>
                  <span className="block text-sm font-medium text-gray-700">IP Address</span>
                  <span className="text-gray-900">{selectedAlert.ipAddress}</span>
                </div>

                <div>
                  <span className="block text-sm font-medium text-gray-700">Location</span>
                  <span className="text-gray-900">{selectedAlert.location || 'Unknown'}</span>
                </div>

                {selectedAlert.paymentMethod && (
                  <div>
                    <span className="block text-sm font-medium text-gray-700">Payment Method</span>
                    <span className="text-gray-900">{selectedAlert.paymentMethod}</span>
                  </div>
                )}

                {selectedAlert.transactionId && (
                  <div>
                    <span className="block text-sm font-medium text-gray-700">Transaction ID</span>
                    <span className="text-gray-900">{selectedAlert.transactionId}</span>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
                <h4 className="font-medium mb-2">Recommended Actions</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                  {selectedAlert.type === 'attack' && (
                    <>
                      <li>Block the IP address temporarily</li>
                      <li>Review all recent transactions from this IP</li>
                      <li>Check for patterns across multiple accounts</li>
                    </>
                  )}

                  {selectedAlert.type === 'fraud' && (
                    <>
                      <li>Flag the transaction for manual review</li>
                      <li>Contact card issuer to verify authenticity</li>
                      <li>Add card number to monitoring list</li>
                    </>
                  )}

                  {selectedAlert.type === 'suspicious' && (
                    <>
                      <li>Review transaction history for this account</li>
                      <li>Verify identity through additional verification</li>
                      <li>Monitor future transactions from this user</li>
                    </>
                  )}

                  {selectedAlert.type === 'vulnerability' && (
                    <>
                      <li>Review server logs for additional exploit attempts</li>
                      <li>Verify input validation is working properly</li>
                      <li>Update security rules to block similar attempts</li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => updateAlertStatus(selectedAlert.id, 'investigating')}
                disabled={selectedAlert.status === 'investigating' || selectedAlert.status === 'resolved'}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md font-medium hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Investigate
              </button>

              <button
                onClick={() => updateAlertStatus(selectedAlert.id, 'resolved')}
                disabled={selectedAlert.status === 'resolved'}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-md font-medium hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mark as Resolved
              </button>

              <button
                onClick={() => updateAlertStatus(selectedAlert.id, 'false-positive')}
                disabled={selectedAlert.status === 'false-positive'}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                False Positive
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 text-center">
            <div className="text-gray-400 text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-medium mb-2">Select an alert to view details</h3>
            <p className="text-gray-600 mb-4">
              Click on any security alert from the list to see detailed information and take action.
            </p>
            <Link href="/payment" className="text-blue-600 hover:text-blue-800">
              Go to Payment System
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
