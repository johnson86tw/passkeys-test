class ChallengeStore {
	private store: { [userId: string]: string } = {}

	// Add or update a challenge for a user
	addChallenge(userId: string, challenge: string) {
		this.store[userId] = challenge
	}

	// Retrieve a challenge for a user
	getChallenge(userId: string): string | undefined {
		return this.store[userId]
	}

	// Remove a challenge for a user (optional)
	removeChallenge(userId: string): void {
		delete this.store[userId]
	}

	// Check if a challenge exists for a user (optional)
	hasChallenge(userId: string): boolean {
		return this.store.hasOwnProperty(userId)
	}

	// Clear all challenges (optional)
	clearStore(): void {
		this.store = {}
	}
}

export const registerChallengeStore = new ChallengeStore()
export const loginChallengeStore = new ChallengeStore()
