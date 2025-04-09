import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const RegionalDisclaimer = ({ consultationType = 'general', onAccept }) => {
  const { userRegion } = useSelector(state => state.compliance);
  const [accepted, setAccepted] = useState(false);
  const [disclaimerText, setDisclaimerText] = useState('');
  const [severityLevel, setSeverityLevel] = useState('info'); // info, warning, critical

  useEffect(() => {
    if (userRegion) {
      const { text, severity } = getRegionalDisclaimer(userRegion, consultationType);
      setDisclaimerText(text);
      setSeverityLevel(severity);
    }
  }, [userRegion, consultationType]);

  // Check if already accepted from localStorage
  useEffect(() => {
    const storedAcceptance = localStorage.getItem(`disclaimer-${userRegion}-${consultationType}`);
    if (storedAcceptance) {
      setAccepted(true);
    }
  }, [userRegion, consultationType]);

  const handleAccept = () => {
    // Store acceptance in localStorage
    localStorage.setItem(`disclaimer-${userRegion}-${consultationType}`, new Date().toISOString());
    setAccepted(true);

    if (onAccept) {
      onAccept();
    }
  };

  // If already accepted or no disclaimer for this region, don't show anything
  if (accepted || !disclaimerText) {
    return null;
  }

  // Different styling based on severity
  const severityStyles = {
    info: {
      wrapper: 'bg-blue-50 border-blue-200',
      header: 'text-blue-800',
      text: 'text-blue-700',
      button: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    warning: {
      wrapper: 'bg-yellow-50 border-yellow-200',
      header: 'text-yellow-800',
      text: 'text-yellow-700',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    },
    critical: {
      wrapper: 'bg-red-50 border-red-200',
      header: 'text-red-800',
      text: 'text-red-700',
      button: 'bg-red-600 hover:bg-red-700 text-white'
    }
  };

  const styles = severityStyles[severityLevel];

  return (
    <div className={`border rounded-md p-4 mb-4 ${styles.wrapper}`}>
      <h3 className={`font-medium ${styles.header}`}>
        Important Notice for Your Region
      </h3>
      <div
        className={`mt-2 text-sm ${styles.text}`}
        dangerouslySetInnerHTML={{ __html: disclaimerText }}
      />
      <button
        onClick={handleAccept}
        className={`mt-3 px-4 py-2 rounded text-sm font-medium ${styles.button}`}
      >
        I Understand and Accept
      </button>
    </div>
  );
};

// Helper function to get the appropriate disclaimer based on region and consultation type
function getRegionalDisclaimer(region, consultationType) {
  // Create a mapping of region-specific disclaimers
  const disclaimers = {
    // European Union
    'EU': {
      general: {
        text: 'This platform is compliant with the EU General Data Protection Regulation (GDPR). Your personal data will be processed according to our <a href="/privacy-policy" class="underline">Privacy Policy</a>.',
        severity: 'info'
      },
      healthcare: {
        text: '<strong>Healthcare Disclaimer:</strong> This platform does not provide medical advice. The content and services are for informational purposes only and are not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. In the EU, healthcare consultations may be subject to additional regulations in your specific country.',
        severity: 'warning'
      },
      financial: {
        text: '<strong>Financial Consultation Disclaimer:</strong> Financial consultations provided through this platform are for informational purposes only and do not constitute financial advice under EU regulations. Consultants may not be registered in all EU member states. Under MiFID II regulations, financial advisors must disclose all fees and commissions. Please verify the credentials and regulatory status of financial consultants in your specific EU member state before proceeding.',
        severity: 'warning'
      },
      legal: {
        text: '<strong>Legal Consultation Disclaimer:</strong> Communications do not create an attorney-client relationship. Legal consultants on this platform may not be licensed to practice in all EU jurisdictions. Legal systems vary significantly across EU member states. Please verify the jurisdiction in which the consultant is qualified to practice before proceeding.',
        severity: 'critical'
      },
      technical: {
        text: '<strong>Technical Consultation Disclaimer:</strong> Technical advice provided through this platform is for guidance only. Implementation of technical recommendations is at your own risk. EU certification standards may apply to certain technical fields that consultants must adhere to.',
        severity: 'info'
      },
      educational: {
        text: '<strong>Educational Consultation Disclaimer:</strong> Educational qualifications and systems vary across EU member states. Consultants may have expertise in particular national educational systems. Please verify that the consultant has relevant experience with your specific country\'s educational framework.',
        severity: 'info'
      }
    },

    // United States
    'US': {
      general: {
        text: 'By using this service, you agree to our <a href="/terms" class="underline">Terms of Service</a> and acknowledge our <a href="/privacy-policy" class="underline">Privacy Policy</a>.',
        severity: 'info'
      },
      healthcare: {
        text: '<strong>Important Healthcare Notice:</strong> Communications with consultants through this platform are not protected by doctor-patient privilege unless explicitly covered by our HIPAA compliance procedures. Information shared may not be confidential. Telehealth services may not be available in all states, and healthcare consultants may not be licensed in all 50 states. State medical boards have different requirements for telehealth consultations.',
        severity: 'warning'
      },
      legal: {
        text: '<strong>Legal Consultation Warning:</strong> Communications on this platform do not create an attorney-client relationship. Information provided is not legal advice. Laws vary by state, and some consultants may not be licensed to practice in your jurisdiction. The unauthorized practice of law is a serious offense in many states. Please verify bar admission status in your state before proceeding.',
        severity: 'critical'
      },
      financial: {
        text: '<strong>Financial Advice Disclaimer:</strong> Financial consultations are for informational purposes only and do not constitute investment advice as defined by the SEC. Investment advisors on this platform may be required to be registered with the SEC or state securities authorities. Please verify the registration status of any financial advisor in your state before proceeding.',
        severity: 'warning'
      },
      technical: {
        text: '<strong>Technical Consultation Disclaimer:</strong> Technical advice provided is for guidance only. State and federal regulations may apply to certain technical implementations, particularly in sectors like energy, telecommunications, and construction. Please consult local regulations before implementing any recommendations.',
        severity: 'info'
      },
      educational: {
        text: '<strong>Educational Consultation Disclaimer:</strong> Educational consultants on this platform may have expertise in particular state educational systems or college admissions processes. Education requirements and standards vary by state. Please verify that the consultant has relevant experience with your specific educational context.',
        severity: 'info'
      }
    },

    // United Kingdom
    'UK': {
      general: {
        text: 'This service complies with UK data protection laws including the UK GDPR and Data Protection Act 2018. Your rights are outlined in our <a href="/privacy-policy" class="underline">Privacy Policy</a>.',
        severity: 'info'
      },
      healthcare: {
        text: '<strong>Healthcare Notice (UK):</strong> This service does not replace NHS advice or treatment. Always consult your GP for medical concerns. Healthcare consultants on this platform may not be registered with the General Medical Council (GMC) or other appropriate UK regulatory bodies. Telehealth services are subject to NHS and private healthcare regulations.',
        severity: 'warning'
      },
      legal: {
        text: '<strong>Legal Consultation (UK):</strong> Communications do not establish a solicitor-client relationship. Consultants may be regulated by the Solicitors Regulation Authority (SRA), Bar Standards Board (BSB), or CILEx Regulation in England and Wales, or by equivalent bodies in Scotland and Northern Ireland. Please verify regulatory status before proceeding.',
        severity: 'warning'
      },
      financial: {
        text: '<strong>Financial Advice (UK):</strong> Financial consultants may need to be authorized by the Financial Conduct Authority (FCA). This platform does not provide regulated financial advice unless explicitly stated. Please check the Financial Services Register to verify the regulatory status of any financial consultant.',
        severity: 'warning'
      },
      technical: {
        text: '<strong>Technical Consultation (UK):</strong> Technical advice provided through this platform should be implemented in accordance with UK standards and regulations, including British Standards (BS), Building Regulations, and other applicable frameworks.',
        severity: 'info'
      },
      educational: {
        text: '<strong>Educational Consultation (UK):</strong> Educational consultants should have familiarity with the UK education system including GCSEs, A-Levels, BTECs, Scottish Highers, or university admissions processes as relevant to your inquiry. Education systems differ across England, Wales, Scotland, and Northern Ireland.',
        severity: 'info'
      }
    },

    // Canada
    'CA': {
      general: {
        text: 'This service complies with Canadian privacy laws including PIPEDA and provincial privacy legislation. Your information is protected in accordance with our <a href="/privacy-policy" class="underline">Privacy Policy</a>.',
        severity: 'info'
      },
      healthcare: {
        text: '<strong>Healthcare Consultation (Canada):</strong> This service does not replace advice from provincial healthcare services. Healthcare professionals must be licensed in the specific province or territory where you are located. Telehealth regulations vary by province. Please verify provincial licensing before proceeding.',
        severity: 'warning'
      },
      legal: {
        text: '<strong>Legal Consultation (Canada):</strong> Legal professionals must be members of the provincial or territorial law society where they practice. Legal systems vary between provinces and territories, particularly between common law and civil law jurisdictions (Quebec). Please verify applicable jurisdiction qualifications.',
        severity: 'warning'
      },
      financial: {
        text: '<strong>Financial Advice (Canada):</strong> Financial advisors should be registered with provincial securities regulators or self-regulatory organizations. Investment advice may be regulated differently across provinces. Please verify registration status with your provincial securities commission.',
        severity: 'warning'
      },
      technical: {
        text: '<strong>Technical Consultation (Canada):</strong> Technical advice should comply with Canadian standards and regulations, which may include CSA standards, National Building Code of Canada, or provincial technical requirements.',
        severity: 'info'
      },
      educational: {
        text: '<strong>Educational Consultation (Canada):</strong> Education systems vary by province and territory. Consultants should have specific knowledge of the relevant provincial curriculum and requirements applicable to your situation.',
        severity: 'info'
      }
    },

    // Australia
    'AU': {
      general: {
        text: 'This service complies with the Australian Privacy Principles under the Privacy Act 1988. Your personal information is handled in accordance with our <a href="/privacy-policy" class="underline">Privacy Policy</a>.',
        severity: 'info'
      },
      healthcare: {
        text: '<strong>Healthcare Consultation (Australia):</strong> Healthcare professionals must be registered with the Australian Health Practitioner Regulation Agency (AHPRA). This service does not replace advice from Medicare or your local GP. Telehealth services are subject to Australian regulations.',
        severity: 'warning'
      },
      legal: {
        text: '<strong>Legal Consultation (Australia):</strong> Legal practitioners must hold a current practicing certificate in the relevant Australian state or territory. Legal systems may vary between states and territories. Please confirm jurisdictional qualifications before proceeding.',
        severity: 'warning'
      },
      financial: {
        text: '<strong>Financial Advice (Australia):</strong> Financial advisors must hold an Australian Financial Services License (AFSL) or be an authorized representative of an AFSL holder. Please verify ASIC registration before receiving financial advice.',
        severity: 'warning'
      },
      technical: {
        text: '<strong>Technical Consultation (Australia):</strong> Technical advice should comply with Australian Standards (AS), the National Construction Code, and state-specific regulations where applicable.',
        severity: 'info'
      },
      educational: {
        text: '<strong>Educational Consultation (Australia):</strong> Educational consultants should have knowledge of the Australian education system, including state curriculum differences, ATAR, VET, and tertiary admissions processes relevant to your inquiry.',
        severity: 'info'
      }
    },

    // Default for all other regions
    'default': {
      general: {
        text: 'By using this service, you acknowledge that regulations in your region may differ from those where our consultants are located. Please verify credentials and applicability to your local context.',
        severity: 'warning'
      },
      healthcare: {
        text: '<strong>Healthcare Consultation:</strong> Healthcare regulations vary significantly by country. Please verify that any medical advice received complies with the regulations in your location and that the consultant is licensed to practice in your jurisdiction.',
        severity: 'critical'
      },
      legal: {
        text: '<strong>Legal Consultation:</strong> Legal systems vary significantly by country. Please ensure that any legal consultant you engage is qualified to advise on matters in your jurisdiction.',
        severity: 'critical'
      },
      financial: {
        text: '<strong>Financial Consultation:</strong> Financial regulations differ by country. Please verify that any financial advice received is applicable to your jurisdiction and that the consultant is authorized to provide such advice in your location.',
        severity: 'warning'
      },
      technical: {
        text: '<strong>Technical Consultation:</strong> Technical standards and regulations vary by country. Please ensure any advice received meets local requirements and standards in your jurisdiction.',
        severity: 'warning'
      },
      educational: {
        text: '<strong>Educational Consultation:</strong> Education systems vary significantly by country. Please verify that the consultant has relevant knowledge of the educational system in your location.',
        severity: 'info'
      }
    }
  };

  // Get region-specific disclaimer
  const regionDisclaimers = disclaimers[region] || disclaimers['default'];

  // Get consultation-specific disclaimer for this region
  const disclaimer = regionDisclaimers[consultationType] || regionDisclaimers['general'];

  return disclaimer;
}

export default RegionalDisclaimer;
