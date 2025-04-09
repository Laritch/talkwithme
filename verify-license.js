/**
 * API endpoint for verifying professional credentials/licenses by region
 * Ensures professionals are licensed to practice in the user's jurisdiction
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { professionalId, region, requiredCredentialTypes = [] } = req.body;

    if (!professionalId || !region) {
      return res.status(400).json({
        message: 'Missing required parameters: professionalId and region are required'
      });
    }

    // In a real implementation, this would query a database or external verification service
    // For demo purposes, we'll use mock data
    const verificationResult = await verifyProfessionalLicense(
      professionalId,
      region,
      requiredCredentialTypes
    );

    return res.status(200).json(verificationResult);

  } catch (error) {
    console.error('Error verifying license:', error);
    return res.status(500).json({
      message: 'Failed to verify license',
      verified: false,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Mock function to verify professional licenses
 * In a real implementation, this would connect to:
 * 1. Internal database of verified professionals
 * 2. API connections to licensing bodies
 * 3. Third-party verification services
 */
async function verifyProfessionalLicense(professionalId, region, requiredTypes) {
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock license database - replace with real database in production
  const mockLicenseDb = {
    'prof-123': {
      name: 'Dr. John Smith',
      licenses: [
        {
          type: 'Medical License',
          licenseNumber: 'MD-12345',
          jurisdiction: 'US-CA',
          expiryDate: '2025-12-31',
          verificationUrl: 'https://example.com/verify/MD-12345'
        },
        {
          type: 'Board Certification',
          licenseNumber: 'ABIM-98765',
          jurisdiction: 'US',
          expiryDate: '2027-06-30',
          verificationUrl: 'https://example.com/verify/ABIM-98765'
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
          expiryDate: '2026-04-15',
          verificationUrl: 'https://example.com/verify/GMC-78901'
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
          expiryDate: '2024-09-22',
          verificationUrl: 'https://example.com/verify/PSY-45678'
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
      message: 'Professional not found in our system'
    };
  }

  const professional = mockLicenseDb[professionalId];

  // Check if professional is licensed in user's region
  const isRegionAllowed = professional.allowedRegions.includes(region);

  // Check if required credential types are present (if specified)
  let hasRequiredCredentials = true;
  if (requiredTypes.length > 0) {
    const professionalCredentialTypes = professional.licenses.map(license => license.type);
    hasRequiredCredentials = requiredTypes.every(type =>
      professionalCredentialTypes.includes(type)
    );
  }

  // Check if any licenses are expired
  const today = new Date();
  const hasExpiredLicenses = professional.licenses.some(license =>
    new Date(license.expiryDate) < today
  );

  // Return verification result
  return {
    verified: isRegionAllowed && hasRequiredCredentials && !hasExpiredLicenses,
    licenses: isRegionAllowed ? professional.licenses : [],
    name: professional.name,
    message: getVerificationMessage(isRegionAllowed, hasRequiredCredentials, hasExpiredLicenses)
  };
}

/**
 * Generate appropriate message based on verification results
 */
function getVerificationMessage(isRegionAllowed, hasRequiredCredentials, hasExpiredLicenses) {
  if (!isRegionAllowed) {
    return 'Professional is not licensed to practice in your region';
  }

  if (!hasRequiredCredentials) {
    return 'Professional does not have all required credentials for this consultation type';
  }

  if (hasExpiredLicenses) {
    return 'One or more of the professional\'s licenses has expired';
  }

  return 'Professional is licensed to practice in your region';
}
