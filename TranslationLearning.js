/**
 * TranslationLearning.js
 *
 * This module implements a simple machine learning system that learns from
 * user corrections to improve future translations.
 */

// Get feature flag from environment
const ENABLE_LEARNING = process.env.REACT_APP_ENABLE_TRANSLATION_LEARNING !== 'false';
const MAX_SAMPLES = parseInt(process.env.REACT_APP_MAX_LEARNING_SAMPLES || '5000', 10);

// Storage for our learning model
let learningModel = null;

/**
 * Initialize the learning system
 * @returns {boolean} - Whether initialization was successful
 */
export function initTranslationLearning() {
  if (!ENABLE_LEARNING) {
    console.log('Translation learning is disabled');
    return false;
  }

  try {
    loadModel();
    return true;
  } catch (error) {
    console.error('Failed to initialize translation learning:', error);
    return false;
  }
}

/**
 * Load the learning model from localStorage
 */
function loadModel() {
  try {
    // Load from localStorage
    const savedModel = localStorage.getItem('translation_learning_model');

    if (savedModel) {
      learningModel = JSON.parse(savedModel);
      console.log(`Loaded learning model with ${countSamples()} samples`);
    } else {
      // Create a new model
      createNewModel();
    }
  } catch (error) {
    console.error('Failed to load learning model, creating new one:', error);
    createNewModel();
  }
}

/**
 * Create a new learning model
 */
function createNewModel() {
  learningModel = {
    version: 1,
    samples: {},
    statistics: {
      totalSamples: 0,
      languagePairs: {},
      lastUpdated: Date.now()
    }
  };

  // Save the model
  saveModel();
  console.log('Created new learning model');
}

/**
 * Save the learning model to localStorage
 */
function saveModel() {
  try {
    localStorage.setItem('translation_learning_model', JSON.stringify(learningModel));
  } catch (error) {
    console.error('Failed to save learning model:', error);

    // If it's a quota error, try to trim the model
    if (error.name === 'QuotaExceededError') {
      console.log('Quota exceeded, trimming learning model');
      trimModel();

      // Try again
      try {
        localStorage.setItem('translation_learning_model', JSON.stringify(learningModel));
      } catch (innerError) {
        console.error('Still failed to save model after trimming:', innerError);
      }
    }
  }
}

/**
 * Trim the model by removing the oldest samples
 */
function trimModel() {
  if (!learningModel || !learningModel.samples) return;

  const allSamples = [];

  // Collect all samples with their language pair and timestamp
  Object.entries(learningModel.samples).forEach(([langPair, entries]) => {
    Object.entries(entries).forEach(([text, sample]) => {
      allSamples.push({
        langPair,
        text,
        timestamp: sample.timestamp
      });
    });
  });

  // Sort by timestamp, oldest first
  allSamples.sort((a, b) => a.timestamp - b.timestamp);

  // Keep only the newest half
  const toKeep = Math.floor(allSamples.length / 2);
  const toRemove = allSamples.length - toKeep;

  console.log(`Trimming model: removing ${toRemove} samples, keeping ${toKeep}`);

  // Remove the oldest samples
  for (let i = 0; i < toRemove; i++) {
    const sample = allSamples[i];
    delete learningModel.samples[sample.langPair][sample.text];
  }

  // Update statistics
  updateStatistics();
}

/**
 * Get the number of samples in the model
 * @returns {number} - Number of samples
 */
function countSamples() {
  if (!learningModel || !learningModel.samples) return 0;

  let count = 0;
  Object.values(learningModel.samples).forEach(entries => {
    count += Object.keys(entries).length;
  });

  return count;
}

/**
 * Update model statistics
 */
function updateStatistics() {
  if (!learningModel) return;

  const stats = {
    totalSamples: 0,
    languagePairs: {},
    lastUpdated: Date.now()
  };

  // Count samples for each language pair
  Object.entries(learningModel.samples).forEach(([langPair, entries]) => {
    const count = Object.keys(entries).length;
    stats.totalSamples += count;
    stats.languagePairs[langPair] = count;
  });

  learningModel.statistics = stats;
}

/**
 * Add a correction to the learning model
 * @param {string} originalText - The original text that was translated
 * @param {string} machineTranslation - The machine translation
 * @param {string} userCorrection - The user's corrected translation
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @returns {boolean} - Whether the correction was added successfully
 */
export function addCorrection(originalText, machineTranslation, userCorrection, sourceLang, targetLang) {
  if (!ENABLE_LEARNING) return false;
  if (!learningModel) loadModel();
  if (!learningModel) return false;

  // Skip if the correction is the same as the machine translation
  if (machineTranslation === userCorrection) {
    return false;
  }

  // Create the language pair key
  const langPair = `${sourceLang}:${targetLang}`;

  // Initialize this language pair if it doesn't exist
  if (!learningModel.samples[langPair]) {
    learningModel.samples[langPair] = {};
  }

  // Check if we're at the limit for this language pair
  const currentCount = Object.keys(learningModel.samples[langPair]).length;
  if (currentCount >= MAX_SAMPLES) {
    // Remove the oldest sample for this language pair
    removeOldestSample(langPair);
  }

  // Add the correction
  learningModel.samples[langPair][originalText] = {
    original: machineTranslation,
    corrected: userCorrection,
    timestamp: Date.now(),
    useCount: 0
  };

  // Update statistics and save
  updateStatistics();
  saveModel();

  return true;
}

/**
 * Remove the oldest sample for a language pair
 * @param {string} langPair - Language pair key (e.g., 'en:fr')
 */
function removeOldestSample(langPair) {
  if (!learningModel.samples[langPair]) return;

  let oldestKey = null;
  let oldestTimestamp = Infinity;

  // Find the oldest sample
  Object.entries(learningModel.samples[langPair]).forEach(([key, sample]) => {
    if (sample.timestamp < oldestTimestamp) {
      oldestTimestamp = sample.timestamp;
      oldestKey = key;
    }
  });

  // Remove it
  if (oldestKey) {
    delete learningModel.samples[langPair][oldestKey];
  }
}

/**
 * Get a learned translation for a text
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @returns {string|null} - Learned translation or null if not found
 */
export function getLearnedTranslation(text, sourceLang, targetLang) {
  if (!ENABLE_LEARNING || !learningModel) return null;

  // Create the language pair key
  const langPair = `${sourceLang}:${targetLang}`;

  // Check if we have a learned translation for this text
  if (learningModel.samples[langPair] && learningModel.samples[langPair][text]) {
    const sample = learningModel.samples[langPair][text];

    // Increment use count
    sample.useCount += 1;
    saveModel();

    // Return the corrected translation
    return sample.corrected;
  }

  // Try to find a partial match for longer texts
  if (text.length > 10) {
    // This is a simple implementation - in a real ML system, we would use
    // word embeddings, n-grams, or other NLP techniques

    // For now, check if any of our samples is contained within the text
    if (learningModel.samples[langPair]) {
      // Sort by length descending to prefer longer matches
      const keys = Object.keys(learningModel.samples[langPair])
        .filter(key => key.length > 5) // Only consider substantial keys
        .sort((a, b) => b.length - a.length);

      for (const key of keys) {
        if (text.includes(key)) {
          // Found a partial match
          const sample = learningModel.samples[langPair][key];

          // Replace the matching part in the text
          const newText = text.replace(key, sample.corrected);

          // Only return if it actually changed something
          if (newText !== text) {
            // Increment use count
            sample.useCount += 1;
            saveModel();

            return newText;
          }
        }
      }
    }
  }

  return null;
}

/**
 * Get statistics about the learning model
 * @returns {Object} - Statistics object
 */
export function getLearningStatistics() {
  if (!ENABLE_LEARNING || !learningModel) {
    return {
      enabled: false,
      totalSamples: 0,
      languagePairs: {}
    };
  }

  return {
    enabled: true,
    totalSamples: learningModel.statistics.totalSamples,
    languagePairs: { ...learningModel.statistics.languagePairs },
    lastUpdated: learningModel.statistics.lastUpdated
  };
}

/**
 * Clear all learned samples
 * @returns {boolean} - Whether the operation was successful
 */
export function clearLearningData() {
  if (!ENABLE_LEARNING) return false;

  createNewModel();
  return true;
}

/**
 * Export the learning data as JSON
 * @returns {string|null} - JSON string or null if error
 */
export function exportLearningData() {
  if (!ENABLE_LEARNING || !learningModel) return null;

  try {
    return JSON.stringify(learningModel);
  } catch (error) {
    console.error('Failed to export learning data:', error);
    return null;
  }
}

/**
 * Import learning data from JSON
 * @param {string} jsonData - JSON string with learning data
 * @returns {boolean} - Whether the import was successful
 */
export function importLearningData(jsonData) {
  if (!ENABLE_LEARNING) return false;

  try {
    const data = JSON.parse(jsonData);

    // Basic validation
    if (!data.version || !data.samples || !data.statistics) {
      throw new Error('Invalid learning data format');
    }

    learningModel = data;
    saveModel();

    return true;
  } catch (error) {
    console.error('Failed to import learning data:', error);
    return false;
  }
}
