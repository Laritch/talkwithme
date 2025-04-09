import { NextResponse } from 'next/server';
import { detectUserRegion, detectRegionFromIP, getRegionalRequirements } from '../utils/geoLocation';

/**
 * Middleware that detects user's region and applies appropriate compliance rules
 * This runs on every page request before the page is rendered
 */
export async function middleware(request) {
  // Get the incoming response
  const response = NextResponse.next();

  // Check if we already have region information in cookies
  const regionCookie = request.cookies.get('user-region');

  if (!regionCookie) {
    // Get client IP address from request headers
    // Note: In some hosting environments, you may need to use a different header like x-forwarded-for
    const clientIp = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    '127.0.0.1';  // Fallback for local development

    // Detect region based on IP address
    let region;
    try {
      console.log(`Detecting region for IP: ${clientIp}`);
      region = await detectRegionFromIP(clientIp);
      console.log(`Detected region: ${region}`);
    } catch (error) {
      console.error('Error in middleware region detection:', error);
      region = 'EU'; // Default to EU for maximum compliance
    }

    // Set region in cookie for future requests
    response.cookies.set('user-region', region, {
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    // Get compliance requirements for this region
    const requirements = await getRegionalRequirements();

    // Set compliance requirements in cookie
    response.cookies.set('compliance-req', JSON.stringify(requirements), {
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
  }

  // Block access to protected content based on region if needed
  const path = request.nextUrl.pathname;
  const region = regionCookie?.value || await detectUserRegion();

  // Check if accessing healthcare content from a region where provider isn't licensed
  if (path.startsWith('/consultations/healthcare/')) {
    const providerId = path.split('/').pop();

    if (!isProviderLicensedInRegion(providerId, region)) {
      // Redirect to region-restricted page
      return NextResponse.redirect(new URL('/region-restricted', request.url));
    }
  }

  // Check for age restrictions on specific content
  if (path.includes('/age-restricted/')) {
    const userAgeVerified = request.cookies.get('age-verified');

    if (!userAgeVerified) {
      // Redirect to age verification page
      return NextResponse.redirect(new URL('/age-verification?redirect=' + encodeURIComponent(path), request.url));
    }
  }

  // Check for professional credential requirements for certain path types
  if (path.includes('/legal-consultation/')) {
    // For legal consultations, extract expertise area from path
    const expertiseArea = extractExpertiseFromPath(path);

    // Check if the region has specific legal credential requirements for this expertise
    const { isValid, redirectPath } = validateProfessionalCredentialsForRegion('legal', region, expertiseArea);

    if (!isValid) {
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  }

  // Financial consultation credential checks
  if (path.includes('/financial-consultation/')) {
    const expertiseArea = extractExpertiseFromPath(path);
    const { isValid, redirectPath } = validateProfessionalCredentialsForRegion('financial', region, expertiseArea);

    if (!isValid) {
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  }

  // Medical consultation credential checks
  if (path.includes('/medical-consultation/')) {
    const expertiseArea = extractExpertiseFromPath(path);
    const { isValid, redirectPath } = validateProfessionalCredentialsForRegion('medical', region, expertiseArea);

    if (!isValid) {
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  }

  // Add region info to headers for server components
  response.headers.set('x-user-region', region);

  return response;
}

/**
 * Helper function to extract expertise area from URL path
 */
function extractExpertiseFromPath(path) {
  // Example paths:
  // /legal-consultation/corporate-law/provider-123
  // /financial-consultation/investment/provider-456

  const segments = path.split('/').filter(Boolean);

  // If the path has at least 3 segments, the expertise is the second segment
  if (segments.length >= 3) {
    return segments[1];
  }

  return 'general';
}

/**
 * Helper function to check if a healthcare provider is licensed in user's region
 * This would connect to your license verification system
 */
function isProviderLicensedInRegion(providerId, region) {
  // This is a mock implementation - Replace with actual database lookup
  const mockLicenseDatabase = {
    'provider-123': ['US', 'CA', 'UK'],
    'provider-456': ['US', 'AU'],
    'provider-789': ['EU', 'DE', 'FR']
  };

  return mockLicenseDatabase[providerId]?.includes(region) || false;
}

/**
 * Helper function to check if professional credentials meet region requirements
 * @param {string} professionalType - Type of professional (legal, medical, financial)
 * @param {string} region - ISO country code
 * @param {string} expertiseArea - Specific area of expertise
 * @returns {Object} - Validation result and redirect path if invalid
 */
function validateProfessionalCredentialsForRegion(professionalType, region, expertiseArea = 'general') {
  // Define region-specific regulatory requirements by professional type and expertise area
  const regulatoryRequirements = {
    'legal': {
      // United States legal requirements
      'US': {
        'general': {
          description: 'Legal practitioners must be licensed by the state bar association where they practice',
          regulatoryBody: 'State Bar Associations',
          requiredCredentials: ['State Bar License'],
          restrictionsApply: true
        },
        'corporate-law': {
          description: 'Corporate law advice may involve SEC regulations and federal securities laws',
          regulatoryBody: 'State Bar Associations, SEC for securities matters',
          requiredCredentials: ['State Bar License', 'Securities Law Certification (recommended)'],
          restrictionsApply: true
        },
        'immigration': {
          description: 'Immigration law practitioners often need special certification',
          regulatoryBody: 'State Bar Association, Board of Immigration Appeals',
          requiredCredentials: ['State Bar License', 'BIA Accreditation (for non-attorneys)'],
          restrictionsApply: true
        },
        'intellectual-property': {
          description: 'Patent attorneys require special registration with USPTO',
          regulatoryBody: 'State Bar Association, USPTO for patent matters',
          requiredCredentials: ['State Bar License', 'USPTO Registration (for patent work)'],
          restrictionsApply: true
        }
      },
      // United Kingdom legal requirements
      'UK': {
        'general': {
          description: 'Legal practitioners must be regulated by the SRA, BSB, or CILEx',
          regulatoryBody: 'Solicitors Regulation Authority, Bar Standards Board, or CILEx Regulation',
          requiredCredentials: ['Practicing Certificate'],
          restrictionsApply: true
        },
        'immigration': {
          description: 'Immigration advisers must be registered with OISC unless already regulated as a lawyer',
          regulatoryBody: 'Office of the Immigration Services Commissioner',
          requiredCredentials: ['OISC Registration or Legal Practicing Certificate'],
          restrictionsApply: true
        }
      },
      // Germany legal requirements
      'DE': {
        'general': {
          description: 'Legal practice requires admission to the German Bar (Rechtsanwaltskammer)',
          regulatoryBody: 'Rechtsanwaltskammer (Bar Association)',
          requiredCredentials: ['Bar Admission (Zulassung zur Rechtsanwaltschaft)'],
          restrictionsApply: true
        }
      },
      // European Union generally
      'EU': {
        'general': {
          description: 'Cross-border practice within EU may be possible under the Establishment Directive',
          regulatoryBody: 'National Bar Associations',
          requiredCredentials: ['Home country qualification plus registration with host country bar'],
          restrictionsApply: true
        }
      }
    },

    'financial': {
      // United States financial requirements
      'US': {
        'general': {
          description: 'Financial advisors typically need to be registered with SEC or state securities authorities',
          regulatoryBody: 'SEC, FINRA, State Securities Regulators',
          requiredCredentials: ['Series 65 or 66 License', 'RIA Registration'],
          restrictionsApply: true
        },
        'investment': {
          description: 'Investment advisors managing over $110 million must register with SEC',
          regulatoryBody: 'SEC, FINRA',
          requiredCredentials: ['Series 65/66/7', 'RIA Registration'],
          restrictionsApply: true
        },
        'insurance': {
          description: 'Insurance advice requires state insurance licenses',
          regulatoryBody: 'State Insurance Commissioners',
          requiredCredentials: ['State Insurance License'],
          restrictionsApply: true
        }
      },
      // United Kingdom financial requirements
      'UK': {
        'general': {
          description: 'Financial advisors must be authorized by the Financial Conduct Authority',
          regulatoryBody: 'Financial Conduct Authority (FCA)',
          requiredCredentials: ['FCA Authorization'],
          restrictionsApply: true
        },
        'investment': {
          description: 'Investment advisors need relevant qualifications approved by FCA',
          regulatoryBody: 'Financial Conduct Authority (FCA)',
          requiredCredentials: ['Level 4 Certificate in Investment Management', 'FCA Authorization'],
          restrictionsApply: true
        },
        'mortgage': {
          description: 'Mortgage advisors require specific FCA permissions',
          regulatoryBody: 'Financial Conduct Authority (FCA)',
          requiredCredentials: ['CeMAP or equivalent', 'FCA Authorization'],
          restrictionsApply: true
        }
      },
      // Australia financial requirements
      'AU': {
        'general': {
          description: 'Financial advisors must hold an Australian Financial Services License or be an authorized representative',
          regulatoryBody: 'Australian Securities and Investments Commission (ASIC)',
          requiredCredentials: ['AFSL or Authorized Representative Status', 'Bachelor Degree in relevant field'],
          restrictionsApply: true
        }
      }
    },

    'medical': {
      // United States healthcare requirements
      'US': {
        'general': {
          description: 'Healthcare providers must be licensed in the state where the patient is located',
          regulatoryBody: 'State Medical Boards',
          requiredCredentials: ['State Medical License'],
          restrictionsApply: true
        },
        'psychiatry': {
          description: 'Psychiatrists must be licensed by state medical boards and may need DEA registration',
          regulatoryBody: 'State Medical Boards, DEA for prescribing',
          requiredCredentials: ['State Medical License', 'Board Certification in Psychiatry'],
          restrictionsApply: true
        },
        'telemedicine': {
          description: 'Providers must be licensed in patient\'s state; some states have interstate compacts',
          regulatoryBody: 'State Medical Boards',
          requiredCredentials: ['State Medical License or Interstate Compact Membership'],
          restrictionsApply: true
        }
      },
      // United Kingdom healthcare requirements
      'UK': {
        'general': {
          description: 'Healthcare professionals must be registered with the appropriate regulatory body',
          regulatoryBody: 'General Medical Council, Nursing & Midwifery Council, etc.',
          requiredCredentials: ['GMC Registration', 'License to Practice'],
          restrictionsApply: true
        }
      },
      // Australia healthcare requirements
      'AU': {
        'general': {
          description: 'Healthcare practitioners must be registered with AHPRA',
          regulatoryBody: 'Australian Health Practitioner Regulation Agency (AHPRA)',
          requiredCredentials: ['AHPRA Registration'],
          restrictionsApply: true
        }
      }
    }
  };

  // Default response if no specific requirements
  const defaultResponse = {
    isValid: true,
    redirectPath: null
  };

  // Get region-specific requirements for this professional type
  const regionReqs = regulatoryRequirements[professionalType]?.[region];
  if (!regionReqs) {
    return defaultResponse;
  }

  // Get expertise-specific requirements, or fall back to general
  const expertiseReqs = regionReqs[expertiseArea] || regionReqs['general'];
  if (!expertiseReqs || !expertiseReqs.restrictionsApply) {
    return defaultResponse;
  }

  // In a real application, we would check against a database of verified professionals
  // For now, we'll return invalid for certain combinations to demonstrate the concept

  // Simulate certain restrictions for specific combinations
  // This would be replaced by actual credential verification
  const simulatedRestrictions = [
    { type: 'legal', region: 'US', expertise: 'immigration' },
    { type: 'financial', region: 'UK', expertise: 'investment' },
    { type: 'medical', region: 'US', expertise: 'telemedicine' }
  ];

  const isRestricted = simulatedRestrictions.some(r =>
    r.type === professionalType &&
    r.region === region &&
    (r.expertise === expertiseArea || r.expertise === 'general')
  );

  if (isRestricted) {
    return {
      isValid: false,
      redirectPath: `/credential-requirements?type=${professionalType}&region=${region}&expertise=${expertiseArea}`
    };
  }

  return defaultResponse;
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    // Run on all paths except static files, API routes, and _next paths
    '/((?!_next/static|_next/image|favicon.ico|api/).*)'
  ],
};
