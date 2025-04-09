/**
 * NLP-Enhanced Expert Matching
 *
 * This module provides natural language processing capabilities to improve
 * the semantic matching between client queries and expert profiles.
 */

// Simple keyword extraction function to identify important terms
export function extractKeywords(text) {
  if (!text || typeof text !== 'string') return [];

  // Remove punctuation and convert to lowercase
  const cleanText = text.toLowerCase().replace(/[^\w\s]/g, '');

  // Split into words
  const words = cleanText.split(/\s+/);

  // Remove stopwords (common words that don't add much meaning)
  const stopwords = [
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
    'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'to', 'at', 'in', 'on', 'with', 'from', 'for', 'by', 'about',
    'as', 'of', 'like', 'so', 'this', 'that', 'these', 'those', 'it',
    'i', 'you', 'he', 'she', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
  ];

  // Filter out stopwords and short words
  const keywords = words.filter(word =>
    word.length > 2 && !stopwords.includes(word)
  );

  // Count keyword frequencies
  const keywordCounts = {};
  keywords.forEach(word => {
    keywordCounts[word] = (keywordCounts[word] || 0) + 1;
  });

  // Sort by frequency and return top keywords
  return Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);
}

// Calculate semantic similarity between two texts using keyword overlap
export function calculateSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;

  const keywords1 = extractKeywords(text1);
  const keywords2 = extractKeywords(text2);

  // No keywords found
  if (keywords1.length === 0 || keywords2.length === 0) return 0;

  // Count matching keywords
  const matches = keywords1.filter(keyword =>
    keywords2.some(k2 => k2.includes(keyword) || keyword.includes(k2))
  );

  // Calculate Jaccard similarity (intersection over union)
  const uniqueKeywords = new Set([...keywords1, ...keywords2]);
  return matches.length / uniqueKeywords.size;
}

// Calculate weighted semantic similarity using keyword importance
export function calculateWeightedSimilarity(query, expertiseText) {
  if (!query || !expertiseText) return 0;

  const queryKeywords = extractKeywords(query);
  if (queryKeywords.length === 0) return 0;

  // Weight keywords by position (earlier keywords are often more important)
  const weightedKeywords = queryKeywords.map((keyword, index) => ({
    term: keyword,
    weight: 1 - (index / (queryKeywords.length * 2)) // Gradually decrease weight
  }));

  // Look for each keyword in the expertise text
  let totalScore = 0;
  let maxPossibleScore = 0;

  weightedKeywords.forEach(({ term, weight }) => {
    maxPossibleScore += weight;

    // Check if the expertise contains this keyword or similar words
    if (expertiseText.toLowerCase().includes(term)) {
      totalScore += weight;
    } else {
      // Look for partial matches (substring)
      const partialMatches = extractKeywords(expertiseText).filter(
        expTerm => expTerm.includes(term) || term.includes(expTerm)
      );

      if (partialMatches.length > 0) {
        // Add partial weight for partial matches
        totalScore += weight * 0.5;
      }
    }
  });

  // Normalize score to 0-1 range
  return maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;
}

// Find expertise areas that semantically match a query
export function findMatchingExpertise(query, expertiseAreas) {
  if (!query || !expertiseAreas || !Array.isArray(expertiseAreas)) {
    return [];
  }

  const queryKeywords = extractKeywords(query);
  if (queryKeywords.length === 0) return [];

  // Calculate similarity score for each expertise area
  const scoredAreas = expertiseAreas.map(area => {
    const similarityScore = calculateWeightedSimilarity(query, area);
    return { area, score: similarityScore };
  });

  // Sort by similarity score and return areas with non-zero scores
  return scoredAreas
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => ({
      expertise: item.area,
      relevanceScore: item.score,
      matchedKeywords: queryKeywords.filter(keyword =>
        item.area.toLowerCase().includes(keyword)
      )
    }));
}

// Domain-specific keyword expansion (for compliance, legal and other expert domains)
export function expandQueryWithDomainKnowledge(query) {
  if (!query) return query;

  // Expert domain synonym mappings
  const domainSynonyms = {
    // Compliance and regulatory terms
    'gdpr': ['data protection', 'privacy law', 'eu regulation', 'data privacy'],
    'hipaa': ['healthcare compliance', 'medical privacy', 'health data', 'patient confidentiality'],
    'data privacy': ['information protection', 'confidentiality', 'data security', 'gdpr'],
    'compliance': ['regulatory', 'adherence', 'conformity', 'regulatory compliance'],

    // Legal terms
    'contract': ['agreement', 'legal document', 'terms', 'legal agreement'],
    'liability': ['legal responsibility', 'obligation', 'legal obligation'],

    // Financial terms
    'tax': ['taxation', 'irs', 'tax compliance', 'tax law'],
    'accounting': ['bookkeeping', 'financial reporting', 'financial records'],

    // Technical terms
    'cybersecurity': ['information security', 'data protection', 'network security', 'it security'],
    'encryption': ['data encryption', 'cryptography', 'secure data'],

    // Healthcare terms
    'medical': ['healthcare', 'clinical', 'health', 'patient care'],
    'patient': ['healthcare consumer', 'medical client']
  };

  // Extract keywords from the query
  const keywords = extractKeywords(query);
  let expandedQuery = query;

  // Add domain-specific synonyms to the query
  keywords.forEach(keyword => {
    const synonyms = domainSynonyms[keyword];
    if (synonyms) {
      // Add 2 random synonyms to avoid making the query too long
      const randomSynonyms = synonyms
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);

      expandedQuery += ` (${randomSynonyms.join(' OR ')})`;
    }
  });

  return expandedQuery;
}

// Entity recognition function to identify key entities in the query
export function extractEntities(text) {
  if (!text) return [];

  // Entity patterns (simplified regex-based approach)
  const entityPatterns = [
    // Industries
    { type: 'industry', pattern: /\b(healthcare|finance|banking|insurance|technology|retail|manufacturing)\b/gi },

    // Regulations
    { type: 'regulation', pattern: /\b(GDPR|HIPAA|CCPA|PCI DSS|FERPA|COPPA|GLBA)\b/gi },

    // Roles
    { type: 'role', pattern: /\b(lawyer|attorney|consultant|advisor|specialist|expert|professional)\b/gi },

    // Skills
    { type: 'skill', pattern: /\b(compliance|privacy|security|analysis|audit|assessment|implementation|training)\b/gi },

    // Locations
    { type: 'location', pattern: /\b(USA|UK|EU|Europe|Asia|global|international|local)\b/gi }
  ];

  const entities = [];

  // Extract entities using patterns
  entityPatterns.forEach(({ type, pattern }) => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        entities.push({
          type,
          value: match.toLowerCase(),
          originalText: match
        });
      });
    }
  });

  return entities;
}

// NLP-enhanced expert matching function
export function enhancedExpertMatching(query, experts, options = {}) {
  if (!query || !experts || !Array.isArray(experts)) {
    return [];
  }

  // Extract entities and keywords from the query
  const queryEntities = extractEntities(query);
  const queryKeywords = extractKeywords(query);

  // Expand query with domain knowledge
  const expandedQuery = options.useDomainKnowledge
    ? expandQueryWithDomainKnowledge(query)
    : query;

  // Score experts based on multiple factors
  return experts.map(expert => {
    // Basic keyword matching for expertise areas
    const expertiseText = expert.expertiseAreas.join(' ');
    const expertiseScore = calculateWeightedSimilarity(expandedQuery, expertiseText);

    // Entity matching
    let entityMatchScore = 0;
    if (queryEntities.length > 0) {
      // Extract entities from expert profile
      const expertEntities = extractEntities(
        `${expert.title} ${expertiseText} ${expert.bio || ''}`
      );

      // Calculate entity match ratio
      const matchingEntities = queryEntities.filter(qEntity =>
        expertEntities.some(eEntity =>
          eEntity.value === qEntity.value && eEntity.type === qEntity.type
        )
      );

      entityMatchScore = queryEntities.length > 0
        ? matchingEntities.length / queryEntities.length
        : 0;
    }

    // Calculate a combined NLP match score (60% expertise, 40% entity matching)
    const nlpMatchScore = (expertiseScore * 0.6) + (entityMatchScore * 0.4);

    return {
      ...expert,
      nlpMatchScore,
      matchDetails: {
        expertiseScore,
        entityMatchScore,
        matchedKeywords: queryKeywords.filter(keyword =>
          expertiseText.toLowerCase().includes(keyword)
        ),
        matchedEntities: queryEntities
          .filter(qEntity =>
            extractEntities(expertiseText).some(eEntity =>
              eEntity.value === qEntity.value && eEntity.type === qEntity.type
            )
          )
          .map(entity => entity.value)
      }
    };
  });
}

export default {
  extractKeywords,
  calculateSimilarity,
  calculateWeightedSimilarity,
  findMatchingExpertise,
  expandQueryWithDomainKnowledge,
  extractEntities,
  enhancedExpertMatching
};
