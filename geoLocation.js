/**
 * Utility functions for geo-location detection and regulatory compliance determination
 * These functions handle IP-based location detection and mapping to applicable regulations
 */

// Cache the detected region to avoid making repeated API calls
let cachedRegion = null;
let cacheExpiry = null;

// Configuration for geolocation services with environment variable support
const GEO_CONFIG = {
  // Primary service: ipapi.co - free tier with rate limits
  PRIMARY_SERVICE: {
    url: 'https://ipapi.co/json/',
    ipSpecificUrl: (ip) => `https://ipapi.co/${ip}/json/`,
    responseMapping: (data) => data.country_code,
    rateLimit: '1000 requests per day',
    requiresKey: false
  },
  // Fallback service: ipgeolocation.io - requires API key
  FALLBACK_SERVICE: {
    // Uses environment variable for API key
    url: `https://api.ipgeolocation.io/ipgeo?apiKey=${process.env.NEXT_PUBLIC_GEOLOCATION_API_KEY || 'YOUR_API_KEY_HERE'}`,
    ipSpecificUrl: (ip) => `https://api.ipgeolocation.io/ipgeo?apiKey=${process.env.NEXT_PUBLIC_GEOLOCATION_API_KEY || 'YOUR_API_KEY_HERE'}&ip=${ip}`,
    responseMapping: (data) => data.country_code2,
    rateLimit: 'Depends on plan',
    requiresKey: true
  },
  // Additional fallback service using ipinfo.io
  TERTIARY_SERVICE: {
    url: `https://ipinfo.io/json?token=${process.env.NEXT_PUBLIC_IPINFO_TOKEN || 'YOUR_IPINFO_TOKEN_HERE'}`,
    ipSpecificUrl: (ip) => `https://ipinfo.io/${ip}/json?token=${process.env.NEXT_PUBLIC_IPINFO_TOKEN || 'YOUR_IPINFO_TOKEN_HERE'}`,
    responseMapping: (data) => data.country,
    rateLimit: '50,000 requests per month on free tier',
    requiresKey: true
  }
};

/**
 * Logs geolocation operations with timestamps
 * @param {string} message - Log message
 * @param {string} level - Log level (info, warn, error)
 */
const geoLog = (message, level = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = `[GeoLocation ${timestamp}]`;

  switch(level) {
    case 'error':
      console.error(`${prefix} ERROR: ${message}`);
      break;
    case 'warn':
      console.warn(`${prefix} WARNING: ${message}`);
      break;
    default:
      console.log(`${prefix} INFO: ${message}`);
  }

  // In a production environment, you might want to send these logs to a monitoring service
};

/**
 * Detects the user's region based on their IP address
 * Uses ipapi.co for geolocation - free tier allows 1000 requests per day
 * @returns {Promise<string>} ISO country code of the user
 */
export const detectUserRegion = async () => {
  // Return cached region if available and not expired (1 hour cache)
  const now = new Date();
  if (cachedRegion && cacheExpiry && cacheExpiry > now) {
    geoLog(`Using cached region: ${cachedRegion} (expires at ${cacheExpiry.toISOString()})`);
    return cachedRegion;
  }

  // Try each geolocation service in sequence until one succeeds
  for (const [serviceName, service] of Object.entries(GEO_CONFIG)) {
    try {
      geoLog(`Attempting ${serviceName} geolocation service...`);

      // Skip services that require API keys if they're not configured
      if (service.requiresKey && service.url.includes('YOUR_API_KEY_HERE')) {
        geoLog(`Skipping ${serviceName} - API key not configured`, 'warn');
        continue;
      }

      const response = await fetch(service.url, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store' // Ensure fresh response
      });

      if (!response.ok) {
        throw new Error(`${serviceName} geolocation API error: ${response.status}`);
      }

      const data = await response.json();

      // Extract country code using the service-specific mapping function
      const countryCode = service.responseMapping(data);

      if (!countryCode) {
        throw new Error(`Country code not found in ${serviceName} API response`);
      }

      // Log successful detection
      geoLog(`Successfully detected region ${countryCode} using ${serviceName}`);

      // Store in cache for 1 hour
      cachedRegion = countryCode;
      cacheExpiry = new Date(now.getTime() + 60 * 60 * 1000);

      return countryCode;
    } catch (error) {
      geoLog(`Error with ${serviceName} geolocation service: ${error.message}`, 'error');
      // Continue to next service
    }
  }

  // If all services fail, default to EU for highest compliance standards
  geoLog('All geolocation services failed. Defaulting to EU region.', 'warn');
  return 'EU';
};

/**
 * Server-side function to detect region from IP address
 * This is used in the middleware and should be run server-side
 * @param {string} ipAddress - The IP address to check
 * @returns {Promise<string>} ISO country code
 */
export const detectRegionFromIP = async (ipAddress) => {
  // Validate IP address format
  if (!ipAddress || ipAddress === '127.0.0.1' || ipAddress === 'localhost') {
    geoLog(`Local development IP detected: ${ipAddress}. Using default region.`, 'info');
    return process.env.DEFAULT_REGION || 'US'; // Default for development
  }

  // Try each geolocation service in sequence until one succeeds
  for (const [serviceName, service] of Object.entries(GEO_CONFIG)) {
    try {
      geoLog(`Detecting region for IP ${ipAddress} using ${serviceName}`);

      // Skip services that require API keys if they're not configured
      if (service.requiresKey &&
          (service.ipSpecificUrl(ipAddress).includes('YOUR_API_KEY_HERE') ||
           service.ipSpecificUrl(ipAddress).includes('YOUR_IPINFO_TOKEN_HERE'))) {
        geoLog(`Skipping ${serviceName} - API key not configured`, 'warn');
        continue;
      }

      const response = await fetch(service.ipSpecificUrl(ipAddress), {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store' // Ensure fresh response
      });

      if (!response.ok) {
        throw new Error(`${serviceName} geolocation API error for IP ${ipAddress}: ${response.status}`);
      }

      const data = await response.json();
      const countryCode = service.responseMapping(data);

      if (!countryCode) {
        throw new Error(`Country code not found in ${serviceName} API response`);
      }

      // Log successful detection
      geoLog(`Successfully detected region ${countryCode} for IP ${ipAddress} using ${serviceName}`);
      return countryCode;
    } catch (error) {
      geoLog(`Error with ${serviceName} for IP ${ipAddress}: ${error.message}`, 'error');
      // Continue to next service
    }
  }

  // If all services fail, default to EU for highest compliance standards
  geoLog(`Failed to detect region for IP ${ipAddress}. Defaulting to EU.`, 'warn');
  return 'EU';
};

/**
 * Checks if GDPR is applicable based on user's region
 * @returns {Promise<boolean>}
 */
export const isGDPRApplicable = async () => {
  const region = await detectUserRegion();

  // EU countries, EEA countries, and UK
  const gdprRegions = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'UK',
    // EEA non-EU
    'IS', 'LI', 'NO',
    // Generic EU marker
    'EU'
  ];

  return gdprRegions.includes(region);
};

/**
 * Checks if HIPAA is applicable based on user's region and context
 * @param {string} consultationType - Type of consultation
 * @returns {Promise<boolean>}
 */
export const isHIPAAApplicable = async (consultationType) => {
  const region = await detectUserRegion();

  // HIPAA is only applicable in the US and only for healthcare-related consultations
  const healthcareTypes = ['healthcare', 'medical', 'therapy', 'psychology', 'psychiatry', 'telemedicine'];
  return region === 'US' && healthcareTypes.includes(consultationType.toLowerCase());
};

/**
 * Gets comprehensive regional compliance requirements
 * @returns {Promise<Object>} Object containing all applicable compliance requirements
 */
export const getRegionalRequirements = async () => {
  const region = await detectUserRegion();

  // Default requirements
  const requirements = {
    needsGDPR: false,
    needsHIPAA: false,
    needsCCPA: false,
    needsPIPEDA: false,
    dataResidencyRestrictions: false,
    requiredDisclosures: [],
    minimumAge: 16,
    consentRequirements: 'opt-in', // opt-in, opt-out, explicit
    breachNotificationHours: 72,   // GDPR standard
    localizationRequirements: [],
    retentionLimits: {}
  };

  // Apply specific requirements based on region
  switch(region) {
    case 'US':
      requirements.needsCCPA = true;
      requirements.minimumAge = 13; // COPPA
      requirements.consentRequirements = 'opt-out';
      requirements.breachNotificationHours = 48; // Varies by state
      requirements.retentionLimits = {
        health: '6 years (HIPAA)',
        financial: '7 years (IRS requirements)',
        general: '3 years (recommended)'
      };
      break;

    case 'US-CA': // California specifically
      requirements.needsCCPA = true;
      requirements.minimumAge = 13;
      requirements.consentRequirements = 'opt-out';
      requirements.breachNotificationHours = 48;
      requirements.requiredDisclosures.push('california_privacy_rights');
      requirements.requiredDisclosures.push('do_not_sell');
      requirements.requiredDisclosures.push('ccpa_privacy_policy');
      requirements.retentionLimits = {
        health: '6 years (HIPAA)',
        financial: '7 years (IRS requirements)',
        general: '3 years (recommended)'
      };
      break;

    case 'US-VA': // Virginia specifically
      requirements.needsCDPA = true; // Consumer Data Protection Act
      requirements.minimumAge = 13;
      requirements.consentRequirements = 'opt-out';
      requirements.breachNotificationHours = 48;
      requirements.requiredDisclosures.push('virginia_cdpa_rights');
      requirements.retentionLimits = {
        health: '6 years (HIPAA)',
        financial: '7 years (IRS requirements)',
        general: '3 years (recommended)'
      };
      break;

    case 'CA': // Canada
      requirements.needsPIPEDA = true;
      requirements.minimumAge = 13;
      requirements.consentRequirements = 'opt-in';
      requirements.breachNotificationHours = 72;
      requirements.requiredDisclosures.push('pipeda_privacy_policy');
      requirements.retentionLimits = {
        health: '10 years (recommended)',
        financial: '7 years (tax requirements)',
        general: '3 years (recommended)'
      };
      break;

    case 'DE': // Germany has strict data protection laws
      requirements.needsGDPR = true;
      requirements.dataResidencyRestrictions = true;
      requirements.minimumAge = 16;
      requirements.requiredDisclosures.push('imprint');
      requirements.requiredDisclosures.push('gdpr_privacy_policy');
      requirements.localizationRequirements.push('de');
      requirements.retentionLimits = {
        health: '10 years (medical records)',
        financial: '10 years (accounting documents)',
        general: 'No longer than necessary'
      };
      break;

    case 'FR': // France
      requirements.needsGDPR = true;
      requirements.minimumAge = 15; // France sets 15 as the age
      requirements.localizationRequirements.push('fr');
      requirements.requiredDisclosures.push('gdpr_privacy_policy');
      requirements.retentionLimits = {
        health: '20 years (medical records)',
        financial: '10 years (accounting documents)',
        general: 'No longer than necessary'
      };
      break;

    case 'BR': // Brazil - LGPD
      requirements.needsLGPD = true;
      requirements.minimumAge = 13;
      requirements.consentRequirements = 'explicit';
      requirements.requiredDisclosures.push('lgpd_rights');
      requirements.requiredDisclosures.push('lgpd_privacy_policy');
      requirements.localizationRequirements.push('pt-br');
      requirements.breachNotificationHours = 48;
      requirements.retentionLimits = {
        health: '20 years (recommended)',
        financial: '5 years (tax requirements)',
        general: 'No longer than necessary'
      };
      break;

    case 'AU': // Australia
      requirements.needsAustraliaPrivacyAct = true;
      requirements.minimumAge = 13;
      requirements.consentRequirements = 'express or implied';
      requirements.breachNotificationHours = 72; // 30 days for non-critical
      requirements.requiredDisclosures.push('australia_privacy_policy');
      requirements.retentionLimits = {
        health: '7 years after last entry',
        financial: '7 years (tax requirements)',
        general: 'Reasonable period after use'
      };
      break;

    // Add more country-specific requirements as needed
  }

  // For all EU countries, apply GDPR
  if (await isGDPRApplicable()) {
    requirements.needsGDPR = true;
    requirements.breachNotificationHours = 72; // GDPR requires 72 hours

    // If not already added
    if (!requirements.requiredDisclosures.includes('gdpr_privacy_policy')) {
      requirements.requiredDisclosures.push('gdpr_privacy_policy');
    }

    // Set GDPR retention limits if not already defined
    if (!requirements.retentionLimits.general) {
      requirements.retentionLimits = {
        ...requirements.retentionLimits,
        general: 'No longer than necessary'
      };
    }
  }

  return requirements;
};
