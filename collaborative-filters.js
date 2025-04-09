/**
 * Collaborative Filters - Expert Chat System
 *
 * This module implements collaborative video filters with voting mechanism
 * allowing meeting participants to democratically choose which filters to apply.
 */

class CollaborativeFilters {
    constructor() {
        this.availableFilters = [
            {
                id: 'blur-background',
                name: 'Blur Background',
                description: 'Blurs the background while keeping the subject in focus',
                strength: 0.5,
                votes: 0,
                voters: [],
                active: false,
                cssFilter: '',
                apply: (video, strength) => {
                    // In a real implementation, this would use WebRTC and computer vision
                    console.log(`Applying blur background filter with strength ${strength}`);
                    return {
                        success: true,
                        message: 'Blur background filter applied'
                    };
                }
            },
            {
                id: 'brightness',
                name: 'Brightness',
                description: 'Adjusts the brightness of the video',
                strength: 0.2,
                votes: 0,
                voters: [],
                active: false,
                cssFilter: 'brightness(1.2)',
                apply: (video, strength) => {
                    if (!video) return { success: false, message: 'No video element provided' };
                    const value = 1 + strength;
                    video.style.filter = `brightness(${value})`;
                    return {
                        success: true,
                        message: `Brightness filter applied (${value})`
                    };
                }
            },
            {
                id: 'contrast',
                name: 'Contrast',
                description: 'Adjusts the contrast of the video',
                strength: 0.3,
                votes: 0,
                voters: [],
                active: false,
                cssFilter: 'contrast(1.3)',
                apply: (video, strength) => {
                    if (!video) return { success: false, message: 'No video element provided' };
                    const value = 1 + strength;
                    video.style.filter = `contrast(${value})`;
                    return {
                        success: true,
                        message: `Contrast filter applied (${value})`
                    };
                }
            },
            {
                id: 'sepia',
                name: 'Sepia',
                description: 'Applies a sepia tone to the video',
                strength: 0.7,
                votes: 0,
                voters: [],
                active: false,
                cssFilter: 'sepia(0.7)',
                apply: (video, strength) => {
                    if (!video) return { success: false, message: 'No video element provided' };
                    video.style.filter = `sepia(${strength})`;
                    return {
                        success: true,
                        message: `Sepia filter applied (${strength})`
                    };
                }
            },
            {
                id: 'face-mesh',
                name: 'Face Mesh',
                description: 'Applies a face mesh overlay',
                strength: 1.0,
                votes: 0,
                voters: [],
                active: false,
                cssFilter: '',
                apply: (video, strength) => {
                    // In a real implementation, this would use WebRTC and face detection
                    console.log(`Applying face mesh filter with strength ${strength}`);
                    return {
                        success: true,
                        message: 'Face mesh filter applied'
                    };
                }
            },
            {
                id: 'pixelate',
                name: 'Pixelate',
                description: 'Pixelates the video',
                strength: 0.5,
                votes: 0,
                voters: [],
                active: false,
                cssFilter: '',
                apply: (video, strength) => {
                    // This would use canvas in a real implementation
                    console.log(`Applying pixelate filter with strength ${strength}`);
                    return {
                        success: true,
                        message: 'Pixelate filter applied'
                    };
                }
            }
        ];

        this.participants = [];
        this.activeFilter = null;
        this.votingEnabled = false;
        this.voteThreshold = 0.5; // Percentage of participants needed to apply a filter
        this.syncEnabled = true;

        // Event callbacks
        this.onFilterChanged = null;
        this.onVoteUpdated = null;
    }

    // Initialize the collaborative filters system
    init(options = {}) {
        this.votingEnabled = options.votingEnabled ?? true;
        this.syncEnabled = options.syncEnabled ?? true;
        this.voteThreshold = options.voteThreshold ?? 0.5;

        if (options.participants) {
            this.participants = [...options.participants];
        }

        if (options.onFilterChanged && typeof options.onFilterChanged === 'function') {
            this.onFilterChanged = options.onFilterChanged;
        }

        if (options.onVoteUpdated && typeof options.onVoteUpdated === 'function') {
            this.onVoteUpdated = options.onVoteUpdated;
        }

        console.log('Collaborative filters initialized', {
            votingEnabled: this.votingEnabled,
            syncEnabled: this.syncEnabled,
            participants: this.participants.length,
            filters: this.availableFilters.length
        });

        return this;
    }

    // Add a participant to the session
    addParticipant(participant) {
        if (!participant.id) {
            console.error('Participant must have an ID');
            return false;
        }

        if (this.participants.find(p => p.id === participant.id)) {
            console.warn(`Participant ${participant.id} already exists`);
            return false;
        }

        this.participants.push(participant);

        // If there's an active filter, apply it to the new participant
        if (this.activeFilter && participant.videoElement) {
            const filter = this.availableFilters.find(f => f.id === this.activeFilter);
            if (filter) {
                filter.apply(participant.videoElement, filter.strength);
            }
        }

        return true;
    }

    // Remove a participant from the session
    removeParticipant(participantId) {
        const index = this.participants.findIndex(p => p.id === participantId);
        if (index === -1) {
            console.warn(`Participant ${participantId} not found`);
            return false;
        }

        // Remove participant's votes
        this.availableFilters.forEach(filter => {
            const voterIndex = filter.voters.indexOf(participantId);
            if (voterIndex !== -1) {
                filter.voters.splice(voterIndex, 1);
                filter.votes--;
            }
        });

        this.participants.splice(index, 1);

        // Recalculate votes
        this._updateVotes();

        return true;
    }

    // Vote for a filter
    vote(participantId, filterId) {
        const participant = this.participants.find(p => p.id === participantId);
        if (!participant) {
            console.error(`Participant ${participantId} not found`);
            return false;
        }

        const filter = this.availableFilters.find(f => f.id === filterId);
        if (!filter) {
            console.error(`Filter ${filterId} not found`);
            return false;
        }

        // Check if participant already voted for this filter
        if (filter.voters.includes(participantId)) {
            console.warn(`Participant ${participantId} already voted for ${filterId}`);
            return false;
        }

        // Remove previous votes by this participant
        this.availableFilters.forEach(f => {
            const voterIndex = f.voters.indexOf(participantId);
            if (voterIndex !== -1) {
                f.voters.splice(voterIndex, 1);
                f.votes--;
            }
        });

        // Add new vote
        filter.voters.push(participantId);
        filter.votes++;

        // Update votes and check if this filter should become active
        this._updateVotes();

        return true;
    }

    // Update vote counts and check if a filter should be activated
    _updateVotes() {
        if (!this.votingEnabled || this.participants.length === 0) {
            return;
        }

        let highestVotes = 0;
        let topFilter = null;

        this.availableFilters.forEach(filter => {
            // Calculate percentage of votes
            filter.votePercentage = this.participants.length > 0
                ? filter.votes / this.participants.length
                : 0;

            // Track the filter with the most votes
            if (filter.votes > highestVotes) {
                highestVotes = filter.votes;
                topFilter = filter;
            }

            // Notify about vote updates
            if (this.onVoteUpdated) {
                this.onVoteUpdated(filter);
            }
        });

        // Check if the top filter has enough votes to be applied
        if (topFilter && topFilter.votePercentage >= this.voteThreshold) {
            this.applyFilter(topFilter.id);
        } else if (this.activeFilter && (!topFilter || topFilter.votePercentage < this.voteThreshold)) {
            // Remove active filter if it no longer has enough votes
            this.removeAllFilters();
        }
    }

    // Apply a specific filter
    applyFilter(filterId) {
        const filter = this.availableFilters.find(f => f.id === filterId);
        if (!filter) {
            console.error(`Filter ${filterId} not found`);
            return false;
        }

        // Reset current active filter
        if (this.activeFilter && this.activeFilter !== filterId) {
            const currentFilter = this.availableFilters.find(f => f.id === this.activeFilter);
            if (currentFilter) {
                currentFilter.active = false;
            }
        }

        // Set new filter as active
        filter.active = true;
        this.activeFilter = filterId;

        // Apply to all participants
        this.participants.forEach(participant => {
            if (participant.videoElement) {
                filter.apply(participant.videoElement, filter.strength);
            }
        });

        // Notify about filter change
        if (this.onFilterChanged) {
            this.onFilterChanged(filter);
        }

        return true;
    }

    // Remove all filters
    removeAllFilters() {
        this.activeFilter = null;

        // Set all filters as inactive
        this.availableFilters.forEach(filter => {
            filter.active = false;
        });

        // Remove filters from all participants
        this.participants.forEach(participant => {
            if (participant.videoElement) {
                participant.videoElement.style.filter = '';
            }
        });

        // Notify about filter change
        if (this.onFilterChanged) {
            this.onFilterChanged(null);
        }

        return true;
    }

    // Adjust the strength of the active filter
    adjustFilterStrength(filterId, strength) {
        const filter = this.availableFilters.find(f => f.id === filterId);
        if (!filter) {
            console.error(`Filter ${filterId} not found`);
            return false;
        }

        filter.strength = Math.max(0, Math.min(1, strength));

        // If this is the active filter, apply the change immediately
        if (this.activeFilter === filterId) {
            this.participants.forEach(participant => {
                if (participant.videoElement) {
                    filter.apply(participant.videoElement, filter.strength);
                }
            });

            // Notify about filter change
            if (this.onFilterChanged) {
                this.onFilterChanged(filter);
            }
        }

        return true;
    }

    // Enable or disable the voting mechanism
    setVotingEnabled(enabled) {
        this.votingEnabled = !!enabled;
        return this.votingEnabled;
    }

    // Enable or disable filter synchronization across participants
    setSyncEnabled(enabled) {
        this.syncEnabled = !!enabled;
        return this.syncEnabled;
    }

    // Get a list of all available filters
    getFilters() {
        return [...this.availableFilters];
    }

    // Get the active filter
    getActiveFilter() {
        return this.activeFilter
            ? this.availableFilters.find(f => f.id === this.activeFilter)
            : null;
    }

    // Get a specific filter by ID
    getFilter(filterId) {
        return this.availableFilters.find(f => f.id === filterId);
    }

    // Get all participants
    getParticipants() {
        return [...this.participants];
    }
}

// Export the class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CollaborativeFilters };
} else {
    window.CollaborativeFilters = CollaborativeFilters;
}
