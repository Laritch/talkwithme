import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTimeZone } from '../booking/TimeZoneSynchronizer';
import { useNotifications } from '../notifications';

/**
 * RegionalLicenseVerifier component
 * Verifies professional licenses across different regions with time zone awareness
 * @param {Object} props
 * @param {string} props.expertId - ID of the expert
 * @param {string} props.expertSpecialization - Specialization of the expert
 * @param {string} props.expertTimeZone - Time zone of the expert
 * @param {Function} props.onVerificationComplete - Callback when verification is complete
 */
const RegionalLicenseVerifier = ({
  expertId,
  expertSpecialization,
  expertTimeZone,
  onVerificationComplete
}) => {
  const { userRegion } = useSelector(state => state.compliance);
  const { clientTimeZone, convertToClientTime, formatInClientTimeZone } = useTimeZone();
  const { notifyLicenseExpiry } = useNotifications();

  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [licenseDetails, setLicenseDetails] = useState(null);
  const [crossRegionRestrictions, setCrossRegionRestrictions] = useState([]);
  const [timeZoneRestrictions, setTimeZoneRestrictions] = useState([]);

  // Check if a license is near expiration and send notification if needed
  const checkLicenseExpiration = (licenseData) => {
    if (licenseData && licenseData.expirationDate) {
      const expirationDate = new Date(licenseData.expirationDate);
      const currentDate = new Date();

      // Calculate days until expiration
      const differenceInTime = expirationDate.getTime() - currentDate.getTime();
      const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));

      // If license expires in 90 days or less, send notification
      if (differenceInDays <= 90 && differenceInDays > 0) {
        notifyLicenseExpiry(
          `License Expiring in ${differenceInDays} Days`,
          `The professional license for ${expertSpecialization} specialist will expire on ${formatInClientTimeZone(licenseData.expirationDate, 'LLL dd, yyyy')}. Please ensure timely renewal to maintain compliance.`,
          {
            priority: differenceInDays <= 30 ? 'high' : 'medium',
            region: licenseData.jurisdiction,
            actionRequired: true,
            link: '/compliance/licensing'
          }
        );
      }

      // If license is already expired, send critical notification
      if (differenceInDays <= 0) {
        notifyLicenseExpiry(
          'License Expired',
          `The professional license for ${expertSpecialization} specialist has expired on ${formatInClientTimeZone(licenseData.expirationDate, 'LLL dd, yyyy')}. Immediate action is required to maintain compliance.`,
          {
            priority: 'critical',
            region: licenseData.jurisdiction,
            actionRequired: true,
            link: '/compliance/licensing'
          }
        );
      }
    }
  };

  // Simulate license verification with an API call
  useEffect(() => {
    const verifyLicense = async () => {
      setVerificationStatus('verifying');

      // In a real implementation, this would be an API call
      setTimeout(() => {
        const licenseData = getMockLicenseData(expertId, expertSpecialization, userRegion);
        setLicenseDetails(licenseData);

        if (licenseData.status === 'verified') {
          // Check for cross-region restrictions
          const restrictions = getRegionalRestrictions(expertSpecialization, userRegion, expertTimeZone);
          setCrossRegionRestrictions(restrictions);

          // Check for time zone related restrictions
          const tzRestrictions = getTimeZoneRestrictions(expertSpecialization, userRegion, expertTimeZone, clientTimeZone);
          setTimeZoneRestrictions(tzRestrictions);

          setVerificationStatus(restrictions.length > 0 || tzRestrictions.length > 0 ? 'restricted' : 'verified');

          // Check license expiration and send notification if needed
          checkLicenseExpiration(licenseData);
        } else {
          setVerificationStatus('failed');
        }

        // Callback with verification results
        if (onVerificationComplete) {
          onVerificationComplete({
            status: licenseData.status,
            restrictions: [...restrictions, ...tzRestrictions],
            licenseDetails: licenseData
          });
        }
      }, 1500);
    };

    if (expertId && userRegion) {
      verifyLicense();
    }
  }, [expertId, expertSpecialization, userRegion, expertTimeZone, clientTimeZone, onVerificationComplete, notifyLicenseExpiry]);

  // Generate a status badge based on verification status
  const renderStatusBadge = () => {
    switch (verificationStatus) {
      case 'pending':
      case 'verifying':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-blue-400" fill="currentColor" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3" />
            </svg>
            Verifying...
          </span>
        );
      case 'verified':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3" />
            </svg>
            Verified
          </span>
        );
      case 'restricted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-yellow-400" fill="currentColor" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3" />
            </svg>
            Verified with Restrictions
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-red-400" fill="currentColor" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3" />
            </svg>
            Not Verified
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Professional License Verification</h2>
          {renderStatusBadge()}
        </div>

        {/* Loading state */}
        {(verificationStatus === 'pending' || verificationStatus === 'verifying') && (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Verifying professional licensure for {userRegion || 'your region'}...</span>
          </div>
        )}

        {/* License details */}
        {licenseDetails && (
          <div className="border rounded-md border-gray-200 p-4 mb-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium text-gray-500">License Number</h3>
                <p className="mt-1 text-sm text-gray-900">{licenseDetails.licenseNumber}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Jurisdiction</h3>
                <p className="mt-1 text-sm text-gray-900">{licenseDetails.jurisdiction}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Issued Date</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {formatInClientTimeZone(licenseDetails.issuedDate, 'LLL dd, yyyy')}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Expiration Date</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {formatInClientTimeZone(licenseDetails.expirationDate, 'LLL dd, yyyy')}
                </p>
              </div>
              <div className="sm:col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Specialties</h3>
                <div className="mt-1 flex flex-wrap gap-1">
                  {licenseDetails.specialties.map(specialty => (
                    <span key={specialty} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-gray-100 text-gray-800">
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cross-region restrictions */}
        {crossRegionRestrictions.length > 0 && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Cross-Region Practice Restrictions</h3>
            <div className="rounded-md bg-yellow-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Important Notice about Regional Restrictions</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc pl-5 space-y-1">
                      {crossRegionRestrictions.map((restriction, index) => (
                        <li key={index}>{restriction}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Time zone restrictions */}
        {timeZoneRestrictions.length > 0 && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Time Zone Related Restrictions</h3>
            <div className="rounded-md bg-blue-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Time Zone Considerations</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc pl-5 space-y-1">
                      {timeZoneRestrictions.map((restriction, index) => (
                        <li key={index}>{restriction}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Failed verification message */}
        {verificationStatus === 'failed' && (
          <div className="rounded-md bg-red-50 p-4 mt-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">License Verification Failed</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    We were unable to verify this professional's license for your region ({userRegion}).
                    This may be due to:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>The professional is not licensed to practice in your jurisdiction</li>
                    <li>License information is not available in our verification system</li>
                    <li>The license may have expired or been revoked</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Mock data functions - in a real implementation, these would be API calls
const getMockLicenseData = (expertId, specialization, userRegion) => {
  // Sample license data for Healthcare professionals
  if (specialization === 'Healthcare') {
    const isEU = ['EU', 'DE', 'FR', 'ES', 'IT', 'NL'].includes(userRegion);
    const isNorthAmerica = ['US', 'CA'].includes(userRegion);

    if (isEU) {
      return {
        status: 'verified',
        licenseNumber: 'EU' + Math.floor(Math.random() * 1000000),
        jurisdiction: 'European Union',
        issuedDate: '2019-05-15',
        expirationDate: '2025-05-15',
        specialties: ['Cardiology', 'Internal Medicine'],
        restrictedActivities: []
      };
    } else if (isNorthAmerica) {
      return {
        status: 'verified',
        licenseNumber: userRegion + Math.floor(Math.random() * 1000000),
        jurisdiction: userRegion === 'US' ? 'United States (National)' : 'Canada',
        issuedDate: '2018-03-10',
        expirationDate: '2024-03-10',
        specialties: ['Cardiology', 'Internal Medicine'],
        restrictedActivities: ['Prescribing Controlled Substances']
      };
    } else if (userRegion === 'AU') {
      return {
        status: 'verified',
        licenseNumber: 'AU' + Math.floor(Math.random() * 1000000),
        jurisdiction: 'Australia',
        issuedDate: '2020-01-22',
        expirationDate: '2025-01-22',
        specialties: ['Cardiology'],
        restrictedActivities: []
      };
    } else {
      // Verification failed for other regions
      return {
        status: 'failed',
        message: 'No license data available for ' + (userRegion || 'Unknown Region')
      };
    }
  }

  // Sample license data for Legal professionals
  if (specialization === 'Legal') {
    if (userRegion === 'US') {
      return {
        status: 'verified',
        licenseNumber: 'BAR' + Math.floor(Math.random() * 1000000),
        jurisdiction: 'United States (Federal)',
        issuedDate: '2017-06-20',
        expirationDate: '2024-06-20',
        specialties: ['Immigration Law', 'Corporate Law'],
        restrictedActivities: []
      };
    } else if (userRegion === 'ES') {
      return {
        status: 'verified',
        licenseNumber: 'ES' + Math.floor(Math.random() * 1000000),
        jurisdiction: 'Spain',
        issuedDate: '2015-09-15',
        expirationDate: '2025-09-15',
        specialties: ['Immigration Law', 'EU Law'],
        restrictedActivities: []
      };
    } else {
      // Restricted license for other regions
      return {
        status: 'verified',
        licenseNumber: 'INTL' + Math.floor(Math.random() * 1000000),
        jurisdiction: 'International',
        issuedDate: '2018-11-05',
        expirationDate: '2023-11-05',
        specialties: ['International Law'],
        restrictedActivities: ['Local Court Representation']
      };
    }
  }

  // Sample license data for Financial professionals
  if (specialization === 'Financial') {
    return {
      status: 'verified',
      licenseNumber: 'FIN' + Math.floor(Math.random() * 1000000),
      jurisdiction: 'International',
      issuedDate: '2019-08-12',
      expirationDate: '2024-08-12',
      specialties: ['International Tax Planning', 'Financial Advisory'],
      restrictedActivities: []
    };
  }

  // Sample license data for Technical professionals (typically don't require licensing)
  if (specialization === 'Technical') {
    return {
      status: 'verified',
      licenseNumber: 'N/A',
      jurisdiction: 'Global',
      issuedDate: '2020-01-01',
      expirationDate: '2030-01-01',
      specialties: ['Software Architecture', 'System Design'],
      restrictedActivities: []
    };
  }

  // Default fallback
  return {
    status: 'verified',
    licenseNumber: 'GENERIC' + Math.floor(Math.random() * 1000000),
    jurisdiction: 'Global',
    issuedDate: '2020-01-01',
    expirationDate: '2025-01-01',
    specialties: [specialization],
    restrictedActivities: []
  };
};

// Get region-specific restrictions for a professional
const getRegionalRestrictions = (specialization, userRegion, expertTimeZone) => {
  const restrictions = [];

  // Extract expert's region from time zone
  const expertRegion = getRegionFromTimeZone(expertTimeZone);

  // Healthcare restrictions
  if (specialization === 'Healthcare') {
    // EU to US restrictions for healthcare
    if (expertRegion === 'EU' && userRegion === 'US') {
      restrictions.push('This healthcare professional is licensed in the EU and may not prescribe medication to US patients.');
      restrictions.push('Medical advice is provided for informational purposes only and does not constitute US medical practice.');
    }

    // US to EU restrictions for healthcare
    if (expertRegion === 'US' && ['EU', 'DE', 'FR', 'UK'].includes(userRegion)) {
      restrictions.push('This healthcare professional is licensed in the US and must follow EU GDPR regulations for this consultation.');
      restrictions.push('Medical advice is provided for informational purposes only and does not constitute EU medical practice.');
    }

    // Any region to Australia for healthcare
    if (userRegion === 'AU' && expertRegion !== 'AU') {
      restrictions.push('This healthcare professional is not registered with the Australian Health Practitioner Regulation Agency.');
    }
  }

  // Legal restrictions
  if (specialization === 'Legal') {
    // Cross-jurisdictional limitation for legal advice
    if (expertRegion !== userRegion) {
      restrictions.push(`This legal professional is primarily licensed in ${expertRegion} and not admitted to practice law in ${userRegion}.`);
      restrictions.push('Any legal advice is provided for informational purposes only and should not be considered legal representation.');
    }

    // US-specific law practice restrictions
    if (expertRegion === 'US' && userRegion !== 'US') {
      restrictions.push('This attorney is licensed in the US and may only provide information about US law, not your local laws.');
    }

    // EU-specific restrictions
    if (expertRegion === 'EU' && !['EU', 'DE', 'FR', 'ES', 'IT', 'NL'].includes(userRegion)) {
      restrictions.push('This legal professional practices EU law and may not be familiar with the specific regulations in your region.');
    }
  }

  // Financial advisory restrictions
  if (specialization === 'Financial') {
    if (expertRegion !== userRegion) {
      restrictions.push(`This financial advisor primarily operates in ${expertRegion} and may not be registered to provide financial advice in ${userRegion}.`);
      restrictions.push('Advice is provided for informational purposes only and should be verified with a local advisor familiar with your regional regulations.');
    }
  }

  return restrictions;
};

// Get time zone related restrictions
const getTimeZoneRestrictions = (specialization, userRegion, expertTimeZone, clientTimeZone) => {
  const restrictions = [];

  // Calculate approximate time difference (full hours only for simplicity)
  const timeDiff = getApproximateTimeDifference(expertTimeZone, clientTimeZone);

  // Time zone warnings for significant time differences
  if (Math.abs(timeDiff) >= 6) {
    restrictions.push(`There is a significant time difference (about ${Math.abs(timeDiff)} hours) between you and the expert, which may affect scheduling.`);
  }

  // Healthcare specific time restrictions
  if (specialization === 'Healthcare') {
    // For healthcare, warn about emergency services
    if (Math.abs(timeDiff) >= 4) {
      restrictions.push('Due to time zone differences, this professional may not be available for immediate emergency consultations during your daytime hours.');
    }

    // For healthcare in US, mention after-hours restrictions
    if (userRegion === 'US' && expertTimeZone !== 'America/New_York' && expertTimeZone !== 'America/Chicago' && expertTimeZone !== 'America/Denver' && expertTimeZone !== 'America/Los_Angeles') {
      restrictions.push('This healthcare professional operates outside of standard US time zones and may not be able to coordinate with US pharmacies or healthcare facilities during standard business hours.');
    }
  }

  // Legal specific time restrictions
  if (specialization === 'Legal') {
    // For legal, warn about court hearing coordination
    if (Math.abs(timeDiff) >= 5) {
      restrictions.push('Due to time zone differences, coordinating with court schedules or legal proceedings in your jurisdiction may be challenging.');
    }
  }

  return restrictions;
};

// Helper function to get region from time zone
const getRegionFromTimeZone = (timeZone) => {
  if (timeZone.includes('America')) return 'US';
  if (timeZone.includes('Europe')) return 'EU';
  if (timeZone.includes('Asia/Kolkata')) return 'IN';
  if (timeZone.includes('Australia')) return 'AU';
  if (timeZone.includes('Asia/Tokyo')) return 'JP';
  return 'Unknown';
};

// Helper function to get approximate time difference (simplified for demo)
const getApproximateTimeDifference = (zone1, zone2) => {
  // This is a simplified version; in a real implementation, we would use proper time zone libraries
  const timeZoneMap = {
    'America/New_York': -5,
    'America/Chicago': -6,
    'America/Denver': -7,
    'America/Los_Angeles': -8,
    'Europe/London': 0,
    'Europe/Paris': 1,
    'Europe/Berlin': 1,
    'Europe/Madrid': 1,
    'Europe/Rome': 1,
    'Europe/Stockholm': 1,
    'Asia/Kolkata': 5.5,
    'Asia/Tokyo': 9,
    'Australia/Sydney': 10
  };

  // Default to UTC if time zone not found
  const zone1Offset = timeZoneMap[zone1] || 0;
  const zone2Offset = timeZoneMap[zone2] || 0;

  return zone1Offset - zone2Offset;
};

export default RegionalLicenseVerifier;
