import React, { createContext, useState, useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  getBestLanguageMatch,
  getAvailableLanguagesForUI,
  isRTLLanguage,
  formatDate
} from '../../utils/languageDetection';

// Mock translation strings in different languages
// In a real app, these would be loaded from separate files or an API
const translations = {
  'en': {
    welcome: 'Welcome to ExpertConnect',
    consultations: 'Consultations',
    compliance: 'Compliance',
    experts: 'Experts',
    schedule: 'Schedule a Consultation',
    login: 'Login',
    signup: 'Sign Up',
    languageSelector: 'Select Language',
    darkMode: 'Dark Mode',
    settings: 'Settings',
    profile: 'Profile',
    logout: 'Logout',
    searchPlaceholder: 'Search for experts...',
    // Compliance specific terms
    gdprCompliance: 'GDPR Compliance',
    hipaaCompliance: 'HIPAA Compliance',
    licenseVerification: 'License Verification',
    disclaimers: 'Regional Disclaimers',
    dataSubjectRights: 'Data Subject Rights',
    cookieSettings: 'Cookie Settings',
    // Time zone related
    timeZone: 'Time Zone',
    currentTime: 'Current Time',
    expertTime: 'Expert Time',
    scheduleAppointment: 'Schedule Appointment',
    availableSlots: 'Available Time Slots',
    businessHours: 'Business Hours',
    midnightWarning: 'This session crosses midnight in your time zone',
    dateSelectPrompt: 'Select a date',
    // Form elements
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    submit: 'Submit',
    cancel: 'Cancel',
    required: 'Required',
    optional: 'Optional',
    saveChanges: 'Save Changes',
    // Legal text
    termsOfService: 'Terms of Service',
    privacyPolicy: 'Privacy Policy',
    cookiePolicy: 'Cookie Policy',
    acceptTerms: 'I accept the Terms of Service and Privacy Policy',
    // Error messages
    errorOccurred: 'An error occurred',
    tryAgain: 'Please try again',
    sessionExpired: 'Your session has expired',
    // Success messages
    bookingConfirmed: 'Your booking has been confirmed',
    settingsSaved: 'Settings saved successfully'
  },
  'es': {
    welcome: 'Bienvenido a ExpertConnect',
    consultations: 'Consultas',
    compliance: 'Cumplimiento',
    experts: 'Expertos',
    schedule: 'Agendar una Consulta',
    login: 'Iniciar Sesión',
    signup: 'Registrarse',
    languageSelector: 'Seleccionar Idioma',
    darkMode: 'Modo Oscuro',
    settings: 'Configuración',
    profile: 'Perfil',
    logout: 'Cerrar Sesión',
    searchPlaceholder: 'Buscar expertos...',
    // Compliance specific terms
    gdprCompliance: 'Cumplimiento del RGPD',
    hipaaCompliance: 'Cumplimiento de HIPAA',
    licenseVerification: 'Verificación de Licencias',
    disclaimers: 'Avisos Regionales',
    dataSubjectRights: 'Derechos del Interesado',
    cookieSettings: 'Configuración de Cookies',
    // Time zone related
    timeZone: 'Zona Horaria',
    currentTime: 'Hora Actual',
    expertTime: 'Hora del Experto',
    scheduleAppointment: 'Agendar Cita',
    availableSlots: 'Horarios Disponibles',
    businessHours: 'Horario Laboral',
    midnightWarning: 'Esta sesión cruza la medianoche en tu zona horaria',
    dateSelectPrompt: 'Selecciona una fecha',
    // Form elements
    name: 'Nombre',
    email: 'Correo Electrónico',
    phone: 'Teléfono',
    submit: 'Enviar',
    cancel: 'Cancelar',
    required: 'Obligatorio',
    optional: 'Opcional',
    saveChanges: 'Guardar Cambios',
    // Legal text
    termsOfService: 'Términos de Servicio',
    privacyPolicy: 'Política de Privacidad',
    cookiePolicy: 'Política de Cookies',
    acceptTerms: 'Acepto los Términos de Servicio y la Política de Privacidad',
    // Error messages
    errorOccurred: 'Ha ocurrido un error',
    tryAgain: 'Por favor, inténtalo de nuevo',
    sessionExpired: 'Tu sesión ha expirado',
    // Success messages
    bookingConfirmed: 'Tu reserva ha sido confirmada',
    settingsSaved: 'Configuración guardada exitosamente'
  },
  'fr': {
    welcome: 'Bienvenue sur ExpertConnect',
    consultations: 'Consultations',
    compliance: 'Conformité',
    experts: 'Experts',
    schedule: 'Planifier une Consultation',
    login: 'Connexion',
    signup: 'S\'inscrire',
    languageSelector: 'Sélectionner la Langue',
    darkMode: 'Mode Sombre',
    settings: 'Paramètres',
    profile: 'Profil',
    logout: 'Déconnexion',
    searchPlaceholder: 'Rechercher des experts...',
    // Compliance specific terms
    gdprCompliance: 'Conformité au RGPD',
    hipaaCompliance: 'Conformité HIPAA',
    licenseVerification: 'Vérification de Licence',
    disclaimers: 'Avis Régionaux',
    dataSubjectRights: 'Droits de la Personne Concernée',
    cookieSettings: 'Paramètres des Cookies',
    // Time zone related
    timeZone: 'Fuseau Horaire',
    currentTime: 'Heure Actuelle',
    expertTime: 'Heure de l\'Expert',
    scheduleAppointment: 'Planifier un Rendez-vous',
    availableSlots: 'Créneaux Disponibles',
    businessHours: 'Heures d\'Ouverture',
    midnightWarning: 'Cette session passe minuit dans votre fuseau horaire',
    dateSelectPrompt: 'Sélectionnez une date',
    // Form elements
    name: 'Nom',
    email: 'Email',
    phone: 'Téléphone',
    submit: 'Soumettre',
    cancel: 'Annuler',
    required: 'Obligatoire',
    optional: 'Facultatif',
    saveChanges: 'Enregistrer les Modifications',
    // Legal text
    termsOfService: 'Conditions d\'Utilisation',
    privacyPolicy: 'Politique de Confidentialité',
    cookiePolicy: 'Politique des Cookies',
    acceptTerms: 'J\'accepte les Conditions d\'Utilisation et la Politique de Confidentialité',
    // Error messages
    errorOccurred: 'Une erreur s\'est produite',
    tryAgain: 'Veuillez réessayer',
    sessionExpired: 'Votre session a expiré',
    // Success messages
    bookingConfirmed: 'Votre réservation a été confirmée',
    settingsSaved: 'Paramètres enregistrés avec succès'
  },
  'de': {
    welcome: 'Willkommen bei ExpertConnect',
    consultations: 'Beratungen',
    compliance: 'Compliance',
    experts: 'Experten',
    schedule: 'Beratung planen',
    login: 'Anmelden',
    signup: 'Registrieren',
    languageSelector: 'Sprache wählen',
    darkMode: 'Dunkelmodus',
    settings: 'Einstellungen',
    profile: 'Profil',
    logout: 'Abmelden',
    searchPlaceholder: 'Experten suchen...',
    // Compliance specific terms
    gdprCompliance: 'DSGVO-Konformität',
    hipaaCompliance: 'HIPAA-Konformität',
    licenseVerification: 'Lizenzprüfung',
    disclaimers: 'Regionale Hinweise',
    dataSubjectRights: 'Rechte der betroffenen Person',
    cookieSettings: 'Cookie-Einstellungen',
    // Time zone related
    timeZone: 'Zeitzone',
    currentTime: 'Aktuelle Zeit',
    expertTime: 'Expertenzeit',
    scheduleAppointment: 'Termin vereinbaren',
    availableSlots: 'Verfügbare Termine',
    businessHours: 'Geschäftszeiten',
    midnightWarning: 'Diese Sitzung überschreitet Mitternacht in Ihrer Zeitzone',
    dateSelectPrompt: 'Datum auswählen',
    // Form elements
    name: 'Name',
    email: 'E-Mail',
    phone: 'Telefon',
    submit: 'Absenden',
    cancel: 'Abbrechen',
    required: 'Erforderlich',
    optional: 'Optional',
    saveChanges: 'Änderungen speichern',
    // Legal text
    termsOfService: 'Nutzungsbedingungen',
    privacyPolicy: 'Datenschutzrichtlinie',
    cookiePolicy: 'Cookie-Richtlinie',
    acceptTerms: 'Ich akzeptiere die Nutzungsbedingungen und die Datenschutzrichtlinie',
    // Error messages
    errorOccurred: 'Ein Fehler ist aufgetreten',
    tryAgain: 'Bitte versuchen Sie es erneut',
    sessionExpired: 'Ihre Sitzung ist abgelaufen',
    // Success messages
    bookingConfirmed: 'Ihre Buchung wurde bestätigt',
    settingsSaved: 'Einstellungen erfolgreich gespeichert'
  }
};

// Create a Context for the language
const LanguageContext = createContext();

// LanguageProvider component
export const LanguageProvider = ({ children }) => {
  const { userRegion } = useSelector(state => state.compliance);
  const [language, setLanguage] = useState('en');
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [isRTL, setIsRTL] = useState(false);

  // Initialize language based on user's region when it changes
  useEffect(() => {
    if (userRegion) {
      const bestMatch = getBestLanguageMatch(userRegion);
      setLanguage(bestMatch);

      // Get available languages for this region
      const langOptions = getAvailableLanguagesForUI(userRegion);
      setAvailableLanguages(langOptions);

      // Check if the selected language is RTL
      setIsRTL(isRTLLanguage(bestMatch));
    }
  }, [userRegion]);

  // Update RTL status when language changes
  useEffect(() => {
    setIsRTL(isRTLLanguage(language));

    // Apply RTL direction to the document body
    if (typeof document !== 'undefined') {
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';

      // Also add a data attribute for easier styling
      document.documentElement.setAttribute('data-direction', isRTL ? 'rtl' : 'ltr');
    }
  }, [language, isRTL]);

  // Change language function
  const changeLanguage = (langCode) => {
    if (translations[langCode]) {
      setLanguage(langCode);

      // Save language preference in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('userLanguage', langCode);
      }
    }
  };

  // Translate function
  const t = (key, replacements = {}) => {
    // Get the translations for the current language, fallback to English
    const langTranslations = translations[language] || translations['en'];

    // Get the translation for the key, or fallback to the key itself
    let translation = langTranslations[key] || translations['en'][key] || key;

    // Replace placeholders with values
    Object.keys(replacements).forEach(placeholder => {
      translation = translation.replace(`{{${placeholder}}}`, replacements[placeholder]);
    });

    return translation;
  };

  // Format date according to the current language/locale
  const formatLocalDate = (date, options = {}) => {
    return formatDate(date, language, options);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        changeLanguage,
        availableLanguages,
        isRTL,
        t,
        formatLocalDate
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the LanguageContext
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
