/**
 * AI Message Analyzer Service
 *
 * This service analyzes messages for potential policy violations and suspicious content,
 * automatically flagging messages that may require admin review.
 */

// Configuration for content analysis
const ANALYSIS_CONFIG = {
    // Words and phrases that might indicate policy violations (simplified for demo)
    suspiciousTerms: [
        // Personal information solicitation
        "social security", "passport", "credit card", "bank account", "password",
        // External contact attempts
        "whatsapp", "telegram", "signal", "meet outside", "personal email",
        // Harassment indicators
        "idiot", "stupid", "hate you", "loser", "incompetent",
        // Scam indicators
        "guarantee results", "100% success", "secret method", "offshore", "untraceable",
        // Inappropriate solicitation
        "dating", "meet up", "personal relationship", "dinner together", "personal contact"
    ],

    // Categories of policy violations to check
    violationCategories: {
        PERSONAL_INFO: 'personal_info_solicitation',
        EXTERNAL_CONTACT: 'external_contact_attempt',
        HARASSMENT: 'harassment_or_abuse',
        SCAM: 'potential_scam',
        INAPPROPRIATE: 'inappropriate_solicitation',
        SPAM: 'spam_content'
    },

    // Severity levels for different violations
    severityLevels: {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        CRITICAL: 'critical'
    },

    // Confidence threshold for automated flagging (0-1)
    flaggingThreshold: 0.7,

    // Whether to use external AI API for more advanced analysis
    useExternalAI: false,

    // Minimum message length to analyze
    minimumMessageLength: 5
};

/**
 * Analyzes a message for potentially suspicious content
 * @param {Object} message - The message object to analyze
 * @param {string} message.content - The text content of the message
 * @param {string} message.senderId - ID of the message sender
 * @param {string} message.senderType - Type of sender (expert/client)
 * @param {string} message.conversationId - ID of the conversation
 * @returns {Object} Analysis results with potential violations
 */
function analyzeMessage(message) {
    // Skip analysis for very short messages
    if (message.content.length < ANALYSIS_CONFIG.minimumMessageLength) {
        return {
            analyzed: false,
            reason: 'Message too short for analysis',
            violations: [],
            flagged: false
        };
    }

    // For demo purposes, we'll implement a simple keyword/pattern-based analysis
    // In a production system, this would likely call an external NLP/AI service

    const normalizedContent = message.content.toLowerCase();
    const violations = [];
    let highestSeverity = null;

    // Check for suspicious terms in each category
    checkPersonalInfoSolicitation(normalizedContent, violations);
    checkExternalContactAttempt(normalizedContent, violations);
    checkHarassmentIndicators(normalizedContent, violations);
    checkScamIndicators(normalizedContent, violations);
    checkInappropriateSolicitation(normalizedContent, violations);
    checkSpamPatterns(normalizedContent, violations);

    // Determine highest severity level from violations
    violations.forEach(violation => {
        if (!highestSeverity || getSeverityRank(violation.severity) > getSeverityRank(highestSeverity)) {
            highestSeverity = violation.severity;
        }
    });

    // Calculate overall confidence score (for demo, based on number of violations and severity)
    const confidenceScore = calculateConfidenceScore(violations);

    // Determine if message should be auto-flagged
    const shouldFlag = confidenceScore >= ANALYSIS_CONFIG.flaggingThreshold;

    return {
        analyzed: true,
        violations: violations,
        confidenceScore: confidenceScore,
        highestSeverity: highestSeverity,
        flagged: shouldFlag,
        flagReason: shouldFlag ? generateFlagReason(violations) : null,
        timestamp: new Date().toISOString()
    };
}

/**
 * Checks for personal information solicitation
 */
function checkPersonalInfoSolicitation(content, violations) {
    const personalInfoTerms = [
        "social security", "ssn", "passport", "credit card", "bank account",
        "password", "id number", "account number", "routing number", "identification"
    ];

    const personalInfoPatterns = [
        /send .*(?:photo|picture|id|documentation|passport)/i,
        /share .*(?:account|login|password)/i,
        /need .*(?:personal|private|financial|bank) information/i
    ];

    if (matchesAnyTerm(content, personalInfoTerms) || matchesAnyPattern(content, personalInfoPatterns)) {
        violations.push({
            category: ANALYSIS_CONFIG.violationCategories.PERSONAL_INFO,
            severity: ANALYSIS_CONFIG.severityLevels.HIGH,
            details: 'Potential personal information solicitation detected'
        });
    }
}

/**
 * Checks for attempts to move conversation outside the platform
 */
function checkExternalContactAttempt(content, violations) {
    const externalContactTerms = [
        "whatsapp", "telegram", "signal", "email me", "call me", "text me",
        "meet outside", "personal email", "phone number", "my cell", "direct message"
    ];

    const externalContactPatterns = [
        /(?:contact|reach|email|text|call|message) me (?:at|on|via|through|with)/i,
        /(?:here is|my|use|this is) (?:my|the) (?:email|phone|contact|whatsapp|telegram)/i,
        /let(?:'|')?s (?:talk|chat|meet|connect) (?:off|outside)/i,
        /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/ // Email pattern
    ];

    if (matchesAnyTerm(content, externalContactTerms) || matchesAnyPattern(content, externalContactPatterns)) {
        violations.push({
            category: ANALYSIS_CONFIG.violationCategories.EXTERNAL_CONTACT,
            severity: ANALYSIS_CONFIG.severityLevels.MEDIUM,
            details: 'Potential attempt to take communication outside the platform'
        });
    }
}

/**
 * Checks for harassment or abusive language
 */
function checkHarassmentIndicators(content, violations) {
    const harassmentTerms = [
        "idiot", "stupid", "hate you", "loser", "incompetent", "moron", "useless",
        "pathetic", "worthless", "wasting my time", "terrible"
    ];

    // More complex patterns of harassment
    const harassmentPatterns = [
        /you (?:are|seem|sound|look) (?:stupid|dumb|incompetent|useless)/i,
        /(?:hate|despise) (?:you|your|working with you)/i,
        /(?:worst|terrible|horrible) (?:expert|service|advice|consultant)/i
    ];

    if (matchesAnyTerm(content, harassmentTerms) || matchesAnyPattern(content, harassmentPatterns)) {
        violations.push({
            category: ANALYSIS_CONFIG.violationCategories.HARASSMENT,
            severity: ANALYSIS_CONFIG.severityLevels.HIGH,
            details: 'Potential harassment or abusive language detected'
        });
    }
}

/**
 * Checks for potential scam indicators
 */
function checkScamIndicators(content, violations) {
    const scamTerms = [
        "guarantee results", "100% success", "secret method", "offshore", "untraceable",
        "investment opportunity", "double your money", "risk-free", "hidden technique",
        "loophole", "quick rich", "tax-free", "bypass regulations"
    ];

    const scamPatterns = [
        /(?:guarantee|assured|certain|definite) (?:results|success|outcome|profit)/i,
        /(?:secret|special|unknown|exclusive) (?:method|technique|strategy|approach)/i,
        /(?:avoid|evade|bypass|circumvent) (?:tax|regulation|law|oversight|authorities)/i
    ];

    if (matchesAnyTerm(content, scamTerms) || matchesAnyPattern(content, scamPatterns)) {
        violations.push({
            category: ANALYSIS_CONFIG.violationCategories.SCAM,
            severity: ANALYSIS_CONFIG.severityLevels.HIGH,
            details: 'Potential scam or fraudulent content detected'
        });
    }
}

/**
 * Checks for inappropriate solicitation
 */
function checkInappropriateSolicitation(content, violations) {
    const inappropriateTerms = [
        "dating", "meet up", "personal relationship", "dinner together", "personal contact",
        "romantic", "date", "relationship", "private meeting", "non-professional"
    ];

    const inappropriatePatterns = [
        /(?:meet|see) (?:you|each other) (?:in person|privately|outside)/i,
        /(?:interested in|looking for) (?:a|more than|beyond) (?:date|relationship|friendship)/i,
        /(?:personal|private|intimate) (?:relationship|connection|meeting)/i
    ];

    if (matchesAnyTerm(content, inappropriateTerms) || matchesAnyPattern(content, inappropriatePatterns)) {
        violations.push({
            category: ANALYSIS_CONFIG.violationCategories.INAPPROPRIATE,
            severity: ANALYSIS_CONFIG.severityLevels.MEDIUM,
            details: 'Potential inappropriate relationship solicitation'
        });
    }
}

/**
 * Checks for spam patterns
 */
function checkSpamPatterns(content, violations) {
    // Check for excessive capitalization
    const uppercaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (content.length > 20 && uppercaseRatio > 0.5) {
        violations.push({
            category: ANALYSIS_CONFIG.violationCategories.SPAM,
            severity: ANALYSIS_CONFIG.severityLevels.LOW,
            details: 'Excessive capitalization (possible spam)'
        });
    }

    // Check for excessive repetition
    const wordCounts = {};
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    words.forEach(word => {
        if (word.length > 3) { // Only count meaningful words
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
    });

    const repeatedWords = Object.keys(wordCounts).filter(word => wordCounts[word] >= 4);
    if (repeatedWords.length > 0 && words.length > 20) {
        violations.push({
            category: ANALYSIS_CONFIG.violationCategories.SPAM,
            severity: ANALYSIS_CONFIG.severityLevels.LOW,
            details: 'Excessive word repetition (possible spam)'
        });
    }

    // Check for URLs - many URLs could indicate spam
    const urlCount = (content.match(/https?:\/\/\S+/g) || []).length;
    if (urlCount >= 3) {
        violations.push({
            category: ANALYSIS_CONFIG.violationCategories.SPAM,
            severity: ANALYSIS_CONFIG.severityLevels.LOW,
            details: 'Multiple URLs detected (possible spam)'
        });
    }
}

/**
 * Utility function to check if content contains any of the specified terms
 */
function matchesAnyTerm(content, terms) {
    return terms.some(term => content.includes(term.toLowerCase()));
}

/**
 * Utility function to check if content matches any of the specified regex patterns
 */
function matchesAnyPattern(content, patterns) {
    return patterns.some(pattern => pattern.test(content));
}

/**
 * Calculate a confidence score based on violations
 */
function calculateConfidenceScore(violations) {
    if (violations.length === 0) return 0;

    // Assign weights to each severity level
    const severityWeights = {
        [ANALYSIS_CONFIG.severityLevels.LOW]: 0.3,
        [ANALYSIS_CONFIG.severityLevels.MEDIUM]: 0.6,
        [ANALYSIS_CONFIG.severityLevels.HIGH]: 0.8,
        [ANALYSIS_CONFIG.severityLevels.CRITICAL]: 1.0
    };

    // Calculate weighted score
    let totalWeight = 0;
    violations.forEach(violation => {
        totalWeight += severityWeights[violation.severity] || 0.5;
    });

    // Normalize score to 0-1 range with a cap
    let score = Math.min(totalWeight / 2, 1);
    return parseFloat(score.toFixed(2));
}

/**
 * Get numeric rank for severity level for comparison
 */
function getSeverityRank(severity) {
    const ranks = {
        [ANALYSIS_CONFIG.severityLevels.LOW]: 1,
        [ANALYSIS_CONFIG.severityLevels.MEDIUM]: 2,
        [ANALYSIS_CONFIG.severityLevels.HIGH]: 3,
        [ANALYSIS_CONFIG.severityLevels.CRITICAL]: 4
    };
    return ranks[severity] || 0;
}

/**
 * Generate a human-readable flag reason based on violations
 */
function generateFlagReason(violations) {
    if (violations.length === 0) return 'Unknown reason';

    // Use the highest severity violation as the primary reason
    let highestViolation = violations[0];
    for (let i = 1; i < violations.length; i++) {
        if (getSeverityRank(violations[i].severity) > getSeverityRank(highestViolation.severity)) {
            highestViolation = violations[i];
        }
    }

    const categoryDescriptions = {
        [ANALYSIS_CONFIG.violationCategories.PERSONAL_INFO]: 'Requesting personal information',
        [ANALYSIS_CONFIG.violationCategories.EXTERNAL_CONTACT]: 'Attempting to communicate outside platform',
        [ANALYSIS_CONFIG.violationCategories.HARASSMENT]: 'Harassment or abusive language',
        [ANALYSIS_CONFIG.violationCategories.SCAM]: 'Potential fraudulent activity',
        [ANALYSIS_CONFIG.violationCategories.INAPPROPRIATE]: 'Inappropriate relationship solicitation',
        [ANALYSIS_CONFIG.violationCategories.SPAM]: 'Spam or promotional content'
    };

    return categoryDescriptions[highestViolation.category] || highestViolation.details;
}

/**
 * Process a new message and determine if it should be flagged
 * This is the main entry point for the analyzer
 */
function processMessage(message) {
    // Perform analysis
    const analysisResult = analyzeMessage(message);

    // If flagged, prepare flag data
    if (analysisResult.flagged) {
        const flagData = {
            messageId: message.id,
            conversationId: message.conversationId,
            senderId: message.senderId,
            senderType: message.senderType,
            flagReason: analysisResult.flagReason,
            severity: analysisResult.highestSeverity,
            confidenceScore: analysisResult.confidenceScore,
            violations: analysisResult.violations,
            content: message.content,
            timestamp: analysisResult.timestamp,
            status: 'pending_review'
        };

        // In a real implementation, this would store the flag to a database
        // and notify administrators
        return {
            flagged: true,
            flagData: flagData
        };
    }

    return {
        flagged: false
    };
}

// Export the analyzer functions
export const AIMessageAnalyzer = {
    processMessage,
    analyzeMessage,
    ANALYSIS_CONFIG
};

// For CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AIMessageAnalyzer };
}
