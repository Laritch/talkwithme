import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setCookieConsent } from '../../store/slices/complianceSlice';

const GDPRConsentBanner = () => {
  const [visible, setVisible] = useState(false);
  const dispatch = useDispatch();
  const { cookieConsent, userRegion } = useSelector(state => state.compliance);

  useEffect(() => {
    // Check if user is in EU region and hasn't provided consent yet
    const checkRegionAndConsent = () => {
      const isEURegion = ['EU', 'UK', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'DK', 'FI', 'GR', 'IE', 'LU', 'PT', 'SE'].includes(userRegion);

      if (isEURegion && !cookieConsent) {
        setVisible(true);
      }
    };

    if (userRegion) {
      checkRegionAndConsent();
    }
  }, [cookieConsent, userRegion]);

  const handleAcceptAll = () => {
    dispatch(setCookieConsent({
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
      consentVersion: '1.0'
    }));
    setVisible(false);
  };

  const handleAcceptNecessary = () => {
    dispatch(setCookieConsent({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
      consentVersion: '1.0'
    }));
    setVisible(false);
  };

  const handleOpenPreferences = () => {
    // This would open a modal with detailed cookie preferences
    // For now we'll just simulate it
    alert('Cookie preferences would open here');
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg z-50 p-4 border-t-2 border-blue-500">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div className="pr-4 mb-4 md:mb-0">
            <h3 className="text-lg font-semibold">Your Privacy Choices</h3>
            <p className="text-sm text-gray-600 mt-1">
              We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
              Read our <a href="/privacy-policy" className="text-blue-600 underline">Privacy Policy</a> for more information.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleAcceptNecessary}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
            >
              Necessary Only
            </button>
            <button
              onClick={handleOpenPreferences}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
            >
              Customize
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GDPRConsentBanner;
