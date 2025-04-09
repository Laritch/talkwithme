import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setHipaaConsent } from '../../store/slices/complianceSlice';

const HIPAAConsentForm = ({ consultationType, providerId, onComplete }) => {
  const dispatch = useDispatch();
  const { hipaaConsent, userRegion } = useSelector(state => state.compliance);
  const [formData, setFormData] = useState({
    fullName: '',
    acknowledgeDisclosure: false,
    authorizeSharing: false,
    acknowledgeRights: false,
    acknowledgeRevocation: false,
    electronicSignature: false,
  });

  // Check if this form should be shown based on region (US only)
  if (userRegion !== 'US') {
    return null;
  }

  // Check if consent is already given for this consultation
  const isConsentGiven = hipaaConsent &&
    hipaaConsent.consultationType === consultationType &&
    hipaaConsent.providerId === providerId;

  if (isConsentGiven) {
    return (
      <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
        <h3 className="text-green-800 font-medium">HIPAA Authorization Confirmed</h3>
        <p className="text-green-700 text-sm mt-1">
          You have already provided HIPAA authorization for this consultation.
        </p>
        <button
          onClick={onComplete}
          className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Continue to Consultation
        </button>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, checked, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Record HIPAA consent in Redux store
    dispatch(setHipaaConsent({
      consultationType,
      providerId,
      consentDetails: formData,
      timestamp: new Date().toISOString()
    }));

    // Call onComplete callback to proceed
    if (onComplete) {
      onComplete();
    }
  };

  const canSubmit = formData.fullName &&
    formData.acknowledgeDisclosure &&
    formData.authorizeSharing &&
    formData.acknowledgeRights &&
    formData.acknowledgeRevocation &&
    formData.electronicSignature;

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        HIPAA Authorization for Protected Health Information
      </h2>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <p className="text-blue-700">
          This authorization is required by the Health Insurance Portability and Accountability Act (HIPAA)
          to protect the privacy of your health information.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Full Legal Name
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-start">
            <input
              type="checkbox"
              name="acknowledgeDisclosure"
              checked={formData.acknowledgeDisclosure}
              onChange={handleInputChange}
              className="mt-1 mr-3"
              required
            />
            <label className="text-gray-700">
              I acknowledge that my protected health information (PHI) may be disclosed during this consultation
              and consent to the use of this information for healthcare purposes.
            </label>
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              name="authorizeSharing"
              checked={formData.authorizeSharing}
              onChange={handleInputChange}
              className="mt-1 mr-3"
              required
            />
            <label className="text-gray-700">
              I authorize the sharing of my PHI between healthcare providers involved in my consultation
              for the purpose of providing care and treatment.
            </label>
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              name="acknowledgeRights"
              checked={formData.acknowledgeRights}
              onChange={handleInputChange}
              className="mt-1 mr-3"
              required
            />
            <label className="text-gray-700">
              I understand that I have the right to access, amend, and receive a copy of my PHI,
              and that I can request an accounting of disclosures of my PHI.
            </label>
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              name="acknowledgeRevocation"
              checked={formData.acknowledgeRevocation}
              onChange={handleInputChange}
              className="mt-1 mr-3"
              required
            />
            <label className="text-gray-700">
              I understand that I may revoke this authorization at any time by submitting a written request,
              except to the extent that action has already been taken based on this authorization.
            </label>
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              name="electronicSignature"
              checked={formData.electronicSignature}
              onChange={handleInputChange}
              className="mt-1 mr-3"
              required
            />
            <label className="text-gray-700">
              I agree that my electronic signature on this form is legally binding, equivalent to my handwritten signature.
            </label>
          </div>
        </div>

        <div className="border-t pt-6">
          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full py-3 px-4 rounded-md text-white font-medium ${
              canSubmit ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            I Consent & Authorize
          </button>

          <p className="text-sm text-gray-500 mt-4">
            This authorization is effective until one year from the date of signature unless revoked earlier.
            A copy of this authorization will be provided to you upon request.
          </p>
        </div>
      </form>
    </div>
  );
};

export default HIPAAConsentForm;
