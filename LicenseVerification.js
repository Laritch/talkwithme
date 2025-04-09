import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setLicenseVerification } from '../../store/slices/complianceSlice';

const LicenseVerification = ({ professionalId, requiredCredentialTypes = [] }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [licenseDetails, setLicenseDetails] = useState([]);

  const dispatch = useDispatch();
  const { userRegion } = useSelector(state => state.compliance);

  useEffect(() => {
    // Only verify if we have a professional ID and know user region
    if (professionalId && userRegion) {
      verifyLicense();
    }
  }, [professionalId, userRegion]);

  const verifyLicense = async () => {
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, this would call an API
      // For now, we'll mock the verification process
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call

      // Mock license verification result
      // In a real app, replace this with API call:
      // const response = await fetch('/api/verify-license', {
      //   method: 'POST',
      //   body: JSON.stringify({ professionalId, region: userRegion })
      // });

      // Mock data - would come from API in real implementation
      const mockLicenseData = getMockLicenseData(professionalId, userRegion);
      const { verified, licenses, message } = mockLicenseData;

      // Update component state
      setLicenseDetails(licenses);
      setVerificationStatus(verified ? 'verified' : 'failed');

      // Update redux store
      dispatch(setLicenseVerification({
        verified,
        licenses,
        verificationDate: new Date().toISOString()
      }));

    } catch (err) {
      setError('License verification failed. Please try again later.');
      setVerificationStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // Different UI states based on verification status
  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
          <p>Verifying professional credentials...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4">
        <h3 className="text-red-800 font-medium">Verification Error</h3>
        <p className="text-red-700">{error}</p>
        <button
          onClick={verifyLicense}
          className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (verificationStatus === 'verified') {
    return (
      <div className="bg-green-50 border border-green-200 rounded p-4">
        <div className="flex items-center">
          <svg className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <h3 className="text-green-800 font-medium">Credentials Verified</h3>
        </div>

        <div className="mt-3 pl-7">
          {licenseDetails.map((license, index) => (
            <div key={index} className="text-sm text-green-700 mb-1">
              <span className="font-medium">{license.type}:</span> {license.licenseNumber}
              {license.expiryDate && ` (Valid until ${new Date(license.expiryDate).toLocaleDateString()})`}
              {license.jurisdiction && ` - ${license.jurisdiction}`}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (verificationStatus === 'failed') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
        <h3 className="text-yellow-800 font-medium">Credential Verification Failed</h3>
        <p className="text-yellow-700 mt-1">
          This professional may not be licensed to practice in your region ({userRegion}).
          Please choose another professional or contact customer support.
        </p>
      </div>
    );
  }

  return null;
};

// Helper function to get mock license data - replace with API call in production
function getMockLicenseData(professionalId, region) {
  // Mock database of professional licenses
  const mockLicenseDb = {
    'prof-123': {
      name: 'Dr. John Smith',
      licenses: [
        {
          type: 'Medical License',
          licenseNumber: 'MD-12345',
          jurisdiction: 'US-CA',
          expiryDate: '2025-12-31'
        },
        {
          type: 'Board Certification',
          licenseNumber: 'ABIM-98765',
          jurisdiction: 'US',
          expiryDate: '2027-06-30'
        }
      ],
      // Regions where this professional is allowed to practice
      allowedRegions: ['US', 'CA']
    },
    'prof-456': {
      name: 'Dr. Emily Johnson',
      licenses: [
        {
          type: 'Medical License',
          licenseNumber: 'GMC-78901',
          jurisdiction: 'UK',
          expiryDate: '2026-04-15'
        }
      ],
      allowedRegions: ['UK', 'EU']
    },
    'prof-789': {
      name: 'Counselor Maria Garcia',
      licenses: [
        {
          type: 'Psychology License',
          licenseNumber: 'PSY-45678',
          jurisdiction: 'US-NY',
          expiryDate: '2024-09-22'
        }
      ],
      allowedRegions: ['US']
    }
  };

  // Check if professional exists in our mock database
  if (!mockLicenseDb[professionalId]) {
    return {
      verified: false,
      licenses: [],
      message: 'Professional not found'
    };
  }

  const professional = mockLicenseDb[professionalId];

  // Check if professional is licensed in user's region
  const isRegionAllowed = professional.allowedRegions.includes(region);

  return {
    verified: isRegionAllowed,
    licenses: isRegionAllowed ? professional.licenses : [],
    message: isRegionAllowed ?
      'Professional is licensed in your region' :
      'Professional is not licensed to practice in your region'
  };
}

export default LicenseVerification;
