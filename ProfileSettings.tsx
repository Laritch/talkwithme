import React, { useState } from 'react';
import { useSession } from 'next-auth/react';

interface ProfileSettingsProps {
  className?: string;
  onUpdate?: (profile: any) => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  className = '',
  onUpdate,
}) => {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    bio: 'I am a dedicated instructor/student passionate about learning.',
    notificationPreferences: {
      email: true,
      push: true,
      inApp: true,
    },
    theme: 'light',
    language: 'en',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setProfileData(prev => ({
        ...prev,
        notificationPreferences: {
          ...prev.notificationPreferences,
          [name.replace('notification_', '')]: checked
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      // In a real app, this would be an API call to update the profile
      // For demo, we'll just simulate a delay and success
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Call the onUpdate callback with the new profile data
      onUpdate?.(profileData);

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error('Profile update error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!session?.user) {
    return (
      <div className={`bg-white shadow rounded-lg p-4 ${className}`}>
        <p className="text-center text-gray-500">Please sign in to manage your profile</p>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Profile Settings
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Manage your personal information and preferences
        </p>
      </div>

      {!isEditing ? (
        // Profile View Mode
        <div className="p-4 sm:p-6">
          {success && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-start mb-6">
            <div className="flex-shrink-0">
              <img
                src={session.user.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(session.user.name || 'User')}
                alt={session.user.name || 'User'}
                className="h-16 w-16 rounded-full"
              />
            </div>
            <div className="ml-4">
              <h4 className="text-xl font-semibold">{profileData.name}</h4>
              <p className="text-gray-600">{profileData.email}</p>
              <p className="text-sm text-gray-500 mt-1 capitalize">{session.user.role}</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <h5 className="text-sm font-medium text-gray-500">Bio</h5>
                <p className="mt-1 text-sm text-gray-900">{profileData.bio}</p>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-500">Notification Preferences</h5>
                <ul className="mt-1 text-sm text-gray-900">
                  <li className="flex items-center">
                    <svg className={`h-4 w-4 ${profileData.notificationPreferences.email ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d={profileData.notificationPreferences.email
                        ? "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        : "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"}
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="ml-2">Email: {profileData.notificationPreferences.email ? 'Enabled' : 'Disabled'}</span>
                  </li>
                  <li className="flex items-center mt-1">
                    <svg className={`h-4 w-4 ${profileData.notificationPreferences.push ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d={profileData.notificationPreferences.push
                        ? "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        : "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"}
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="ml-2">Push: {profileData.notificationPreferences.push ? 'Enabled' : 'Disabled'}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-500">Theme</h5>
                <p className="mt-1 text-sm text-gray-900 capitalize">{profileData.theme}</p>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-500">Language</h5>
                <p className="mt-1 text-sm text-gray-900">
                  {profileData.language === 'en' ? 'English' :
                   profileData.language === 'es' ? 'Spanish' :
                   profileData.language === 'fr' ? 'French' :
                   profileData.language}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Edit Profile
            </button>
          </div>
        </div>
      ) : (
        // Profile Edit Mode
        <div className="p-4 sm:p-6">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <img
                    src={session.user.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(session.user.name || 'User')}
                    alt={session.user.name || 'User'}
                    className="h-16 w-16 rounded-full"
                  />
                </div>
                <div className="ml-4">
                  <div className="text-sm text-gray-500">Profile photo can be changed in account settings</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={profileData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={profileData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    disabled
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed here</p>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={3}
                    value={profileData.bio}
                    onChange={handleChange}
                    className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
                    Theme
                  </label>
                  <select
                    id="theme"
                    name="theme"
                    value={profileData.theme}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                    Language
                  </label>
                  <select
                    id="language"
                    name="language"
                    value={profileData.language}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <fieldset>
                    <legend className="text-sm font-medium text-gray-700">
                      Notification Preferences
                    </legend>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center">
                        <input
                          id="notification_email"
                          name="notification_email"
                          type="checkbox"
                          checked={profileData.notificationPreferences.email}
                          onChange={handleChange}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="notification_email" className="ml-2 block text-sm text-gray-700">
                          Email Notifications
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="notification_push"
                          name="notification_push"
                          type="checkbox"
                          checked={profileData.notificationPreferences.push}
                          onChange={handleChange}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="notification_push" className="ml-2 block text-sm text-gray-700">
                          Push Notifications
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="notification_inApp"
                          name="notification_inApp"
                          type="checkbox"
                          checked={profileData.notificationPreferences.inApp}
                          onChange={handleChange}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="notification_inApp" className="ml-2 block text-sm text-gray-700">
                          In-App Notifications
                        </label>
                      </div>
                    </div>
                  </fieldset>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;
