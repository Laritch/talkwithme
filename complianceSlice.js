import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // User region and applicable regulations
  userRegion: null,
  appliedRegulations: [],

  // GDPR related state
  cookieConsent: null,
  dataSubjectRequests: [],
  consentLogs: [],

  // HIPAA related state
  hipaaConsent: null,
  dataEncryptionEnabled: true,

  // Licensing related state
  professionalLicenses: [],
  verifiedCredentials: false,

  // Compliance documentation
  acceptedPolicies: {},
  policyVersions: {
    privacyPolicy: '1.0.0',
    termsOfService: '1.0.0',
    cookiePolicy: '1.0.0',
    dataProcessingAgreement: '1.0.0'
  }
};

export const complianceSlice = createSlice({
  name: 'compliance',
  initialState,
  reducers: {
    setUserRegion: (state, action) => {
      state.userRegion = action.payload;

      // Apply appropriate regulations based on region
      state.appliedRegulations = determineApplicableRegulations(action.payload);
    },

    setCookieConsent: (state, action) => {
      state.cookieConsent = action.payload;

      // Add to consent logs
      state.consentLogs.push({
        type: 'cookie',
        data: action.payload,
        timestamp: new Date().toISOString()
      });
    },

    setHipaaConsent: (state, action) => {
      state.hipaaConsent = action.payload;

      // Add to consent logs
      state.consentLogs.push({
        type: 'hipaa',
        data: action.payload,
        timestamp: new Date().toISOString()
      });
    },

    addDataSubjectRequest: (state, action) => {
      state.dataSubjectRequests.push({
        ...action.payload,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
    },

    updateDataSubjectRequest: (state, action) => {
      const { id, status, resolution } = action.payload;
      const index = state.dataSubjectRequests.findIndex(req => req.id === id);

      if (index !== -1) {
        state.dataSubjectRequests[index] = {
          ...state.dataSubjectRequests[index],
          status,
          resolution,
          updatedAt: new Date().toISOString()
        };
      }
    },

    setLicenseVerification: (state, action) => {
      state.professionalLicenses = action.payload.licenses;
      state.verifiedCredentials = action.payload.verified;

      // Add license verification to logs
      state.consentLogs.push({
        type: 'license_verification',
        data: {
          verified: action.payload.verified,
          timestamp: action.payload.verificationDate
        }
      });
    },

    acceptPolicy: (state, action) => {
      const { policyType, version, timestamp } = action.payload;
      state.acceptedPolicies[policyType] = { version, acceptedAt: timestamp };

      // Also log this consent
      state.consentLogs.push({
        type: 'policy_acceptance',
        data: action.payload,
        timestamp
      });
    },

    toggleDataEncryption: (state, action) => {
      state.dataEncryptionEnabled = action.payload;
    }
  }
});

// Helper function to determine which regulations apply based on region
function determineApplicableRegulations(region) {
  const regulations = [];

  // EU regions - apply GDPR
  const euRegions = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'UK',
    'EU' // Generic EU marker
  ];

  if (euRegions.includes(region)) {
    regulations.push('GDPR');
  }

  // US - HIPAA (conditional) and CCPA (California)
  if (region === 'US') {
    regulations.push('CCPA');
    // HIPAA will be conditionally added based on consultation type
  }

  // California specifically
  if (region === 'US-CA') {
    regulations.push('CCPA');
  }

  // Canada - PIPEDA
  if (region === 'CA') {
    regulations.push('PIPEDA');
  }

  // Australia - Privacy Act
  if (region === 'AU') {
    regulations.push('AustraliaPrivacyAct');
  }

  // Brazil - LGPD
  if (region === 'BR') {
    regulations.push('LGPD');
  }

  // South Korea - PIPA
  if (region === 'KR') {
    regulations.push('PIPA');
  }

  // Japan - APPI
  if (region === 'JP') {
    regulations.push('APPI');
  }

  // Add more region-specific regulations as needed

  return regulations;
}

export const {
  setUserRegion,
  setCookieConsent,
  setHipaaConsent,
  addDataSubjectRequest,
  updateDataSubjectRequest,
  setLicenseVerification,
  acceptPolicy,
  toggleDataEncryption
} = complianceSlice.actions;

export default complianceSlice.reducer;
