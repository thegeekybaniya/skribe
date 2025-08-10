/**
 * @fileoverview WordService for managing drawing words and guess validation
 * 
 * This service handles all word-related operations including:
 * - Providing random words for drawing prompts
 * - Managing word difficulty levels and categories
 * - Validating player guesses against the current word
 * - Maintaining word lists and preventing repetition
 * 
 * Requirements covered: 3.1, 3.2, 3.3, 3.4, 3.5, 4.2
 */

import { EventEmitter } from 'events';

/**
 * Interface for word categories and difficulty levels
 */
interface WordCategory {
    name: string;
    words: string[];
    difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * Interface for word selection options
 */
interface WordSelectionOptions {
    difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
    category?: string;
    excludeWords?: string[];
}

/**
 * WordService manages the word database and selection logic
 * Provides words for drawing rounds and validates guesses
 * Extends EventEmitter to notify other services of word-related events
 */
export class WordService extends EventEmitter {
    // Word database organized by categories and difficulty
    private readonly wordCategories: WordCategory[] = [
        {
            name: 'animals',
            difficulty: 'easy',
            words: [
                'cat', 'dog', 'bird', 'fish', 'cow', 'pig', 'horse', 'sheep',
                'chicken', 'duck', 'rabbit', 'mouse', 'elephant', 'lion', 'tiger',
                'bear', 'monkey', 'giraffe', 'zebra', 'penguin', 'owl', 'frog'
            ]
        },
        {
            name: 'food',
            difficulty: 'easy',
            words: [
                'apple', 'banana', 'orange', 'pizza', 'burger', 'cake', 'bread',
                'cheese', 'milk', 'egg', 'chicken', 'fish', 'rice', 'pasta',
                'sandwich', 'cookie', 'ice cream', 'chocolate', 'coffee', 'tea'
            ]
        },
        {
            name: 'objects',
            difficulty: 'medium',
            words: [
                'chair', 'table', 'book', 'phone', 'computer', 'car', 'house',
                'tree', 'flower', 'sun', 'moon', 'star', 'clock', 'lamp',
                'window', 'door', 'key', 'umbrella', 'glasses', 'hat'
            ]
        },
        {
            name: 'actions',
            difficulty: 'medium',
            words: [
                'running', 'jumping', 'swimming', 'dancing', 'singing', 'reading',
                'writing', 'cooking', 'sleeping', 'walking', 'flying', 'driving',
                'painting', 'drawing', 'laughing', 'crying', 'thinking', 'playing'
            ]
        },
        {
            name: 'abstract',
            difficulty: 'hard',
            words: [
                'happiness', 'sadness', 'anger', 'fear', 'love', 'friendship',
                'freedom', 'justice', 'peace', 'war', 'time', 'space',
                'memory', 'dream', 'hope', 'faith', 'courage', 'wisdom'
            ]
        },
        {
            name: 'complex',
            difficulty: 'hard',
            words: [
                'microscope', 'telescope', 'calculator', 'refrigerator', 'helicopter',
                'submarine', 'skyscraper', 'volcano', 'earthquake', 'rainbow',
                'butterfly', 'dragonfly', 'octopus', 'jellyfish', 'dinosaur'
            ]
        }
    ];

    // Track recently used words to avoid repetition
    private recentlyUsedWords: Map<string, Set<string>> = new Map(); // roomId -> Set of words
    private readonly MAX_RECENT_WORDS = 20; // Maximum words to remember per room

    constructor() {
        super();
    }

    /**
     * Gets a random word for a drawing round
     * @param roomId - ID of the room requesting the word
     * @param options - Word selection options (difficulty, category, etc.)
     * @returns A random word for drawing
     */
    getRandomWord(roomId: string, options: WordSelectionOptions = {}): string {
        const { difficulty = 'mixed', category, excludeWords = [] } = options;

        // Get available word categories based on difficulty
        let availableCategories = this.wordCategories;
        
        if (difficulty !== 'mixed') {
            availableCategories = this.wordCategories.filter(cat => cat.difficulty === difficulty);
        }

        if (category) {
            availableCategories = availableCategories.filter(cat => cat.name === category);
        }

        // Collect all available words
        const allWords: string[] = [];
        for (const cat of availableCategories) {
            allWords.push(...cat.words);
        }

        // Get recently used words for this room
        const recentWords = this.recentlyUsedWords.get(roomId) || new Set();

        // Filter out recently used words and excluded words
        const availableWords = allWords.filter(word => 
            !recentWords.has(word.toLowerCase()) && 
            !excludeWords.map(w => w.toLowerCase()).includes(word.toLowerCase())
        );

        // If no words available after filtering, reset recent words and try again
        if (availableWords.length === 0) {
            this.recentlyUsedWords.delete(roomId);
            return this.getRandomWord(roomId, options);
        }

        // Select a random word
        const selectedWord = availableWords[Math.floor(Math.random() * availableWords.length)];

        // Add to recently used words
        this.addToRecentWords(roomId, selectedWord);

        // Emit event for tracking/analytics
        this.emit('wordSelected', roomId, selectedWord, options);

        return selectedWord;
    }

    /**
     * Validates if a guess matches the target word
     * @param guess - The player's guess
     * @param targetWord - The word being drawn
     * @param options - Validation options (case sensitivity, partial matching, etc.)
     * @returns Whether the guess is correct
     */
    validateGuess(
        guess: string, 
        targetWord: string, 
        options: { caseSensitive?: boolean; allowPartial?: boolean } = {}
    ): boolean {
        const { caseSensitive = false, allowPartial = false } = options;

        // Clean up the inputs
        const cleanGuess = guess.trim();
        const cleanTarget = targetWord.trim();

        if (!cleanGuess || !cleanTarget) {
            return false;
        }

        // Apply case sensitivity
        const normalizedGuess = caseSensitive ? cleanGuess : cleanGuess.toLowerCase();
        const normalizedTarget = caseSensitive ? cleanTarget : cleanTarget.toLowerCase();

        // Exact match
        if (normalizedGuess === normalizedTarget) {
            return true;
        }

        // Partial matching (if enabled)
        if (allowPartial) {
            // Check if guess is a significant portion of the target word
            const minLength = Math.min(3, Math.floor(normalizedTarget.length * 0.6));
            if (normalizedGuess.length >= minLength && normalizedTarget.includes(normalizedGuess)) {
                return true;
            }
        }

        // Check for common variations (plurals, verb forms, etc.)
        return this.checkWordVariations(normalizedGuess, normalizedTarget);
    }

    /**
     * Gets word hints for players (e.g., word length, category)
     * @param word - The target word
     * @param hintLevel - Level of hint to provide (1-3)
     * @returns Hint information
     */
    getWordHint(word: string, hintLevel = 1): { length: number; category?: string; pattern?: string } {
        const hint: { length: number; category?: string; pattern?: string } = {
            length: word.length
        };

        // Level 1: Just word length (always provided)
        if (hintLevel >= 1) {
            hint.length = word.length;
        }

        // Level 2: Add category
        if (hintLevel >= 2) {
            const category = this.findWordCategory(word);
            if (category) {
                hint.category = category.name;
            }
        }

        // Level 3: Add partial pattern (show some letters)
        if (hintLevel >= 3) {
            hint.pattern = this.generateWordPattern(word);
        }

        return hint;
    }

    /**
     * Gets all available word categories
     * @returns Array of category information
     */
    getCategories(): { name: string; difficulty: string; wordCount: number }[] {
        return this.wordCategories.map(cat => ({
            name: cat.name,
            difficulty: cat.difficulty,
            wordCount: cat.words.length
        }));
    }

    /**
     * Gets words from a specific category
     * @param categoryName - Name of the category
     * @returns Array of words in the category
     */
    getCategoryWords(categoryName: string): string[] {
        const category = this.wordCategories.find(cat => cat.name === categoryName);
        return category ? [...category.words] : [];
    }

    /**
     * Adds custom words to a category (for future extensibility)
     * @param categoryName - Name of the category
     * @param words - Array of words to add
     * @param difficulty - Difficulty level for the words
     */
    addWordsToCategory(categoryName: string, words: string[], difficulty: 'easy' | 'medium' | 'hard'): void {
        let category = this.wordCategories.find(cat => cat.name === categoryName);
        
        if (!category) {
            // Create new category if it doesn't exist
            category = {
                name: categoryName,
                words: [],
                difficulty: difficulty
            };
            this.wordCategories.push(category);
        }

        // Add new words (avoid duplicates)
        for (const word of words) {
            const normalizedWord = word.toLowerCase().trim();
            if (!category.words.map(w => w.toLowerCase()).includes(normalizedWord)) {
                category.words.push(normalizedWord);
            }
        }

        this.emit('wordsAdded', categoryName, words);
    }

    /**
     * Clears recently used words for a room (useful when room is deleted)
     * @param roomId - ID of the room
     */
    clearRecentWords(roomId: string): void {
        this.recentlyUsedWords.delete(roomId);
    }

    /**
     * Gets statistics about word usage
     * @param roomId - ID of the room (optional)
     * @returns Usage statistics
     */
    getWordStats(roomId?: string): { totalWords: number; recentWords: number; categories: number } {
        const totalWords = this.wordCategories.reduce((sum, cat) => sum + cat.words.length, 0);
        const recentWords = roomId ? (this.recentlyUsedWords.get(roomId)?.size || 0) : 0;
        const categories = this.wordCategories.length;

        return { totalWords, recentWords, categories };
    }

    // Private helper methods

    /**
     * Adds a word to the recently used list for a room
     * @param roomId - ID of the room
     * @param word - Word to add to recent list
     */
    private addToRecentWords(roomId: string, word: string): void {
        let recentWords = this.recentlyUsedWords.get(roomId);
        
        if (!recentWords) {
            recentWords = new Set();
            this.recentlyUsedWords.set(roomId, recentWords);
        }

        recentWords.add(word.toLowerCase());

        // Limit the size of recent words set
        if (recentWords.size > this.MAX_RECENT_WORDS) {
            // Remove oldest words (convert to array, remove first few, convert back)
            const wordsArray = Array.from(recentWords);
            const wordsToRemove = wordsArray.slice(0, wordsArray.length - this.MAX_RECENT_WORDS);
            for (const wordToRemove of wordsToRemove) {
                recentWords.delete(wordToRemove);
            }
        }
    }

    /**
     * Checks for common word variations (plurals, verb forms, etc.)
     * @param guess - The player's guess
     * @param target - The target word
     * @returns Whether the guess matches a variation of the target
     */
    private checkWordVariations(guess: string, target: string): boolean {
        // Check plural forms
        if (target.endsWith('s') && guess === target.slice(0, -1)) {
            return true;
        }
        if (guess.endsWith('s') && target === guess.slice(0, -1)) {
            return true;
        }

        // Check common verb forms
        const verbEndings = ['ing', 'ed', 'er', 'est'];
        for (const ending of verbEndings) {
            if (target.endsWith(ending)) {
                const root = target.slice(0, -ending.length);
                if (guess === root) {
                    return true;
                }
                // Handle doubled consonants (running -> run, played -> play)
                if (ending === 'ing' && root.length > 2 && root[root.length - 1] === root[root.length - 2]) {
                    const singleConsonantRoot = root.slice(0, -1);
                    if (guess === singleConsonantRoot) {
                        return true;
                    }
                }
                if (ending === 'ed' && root.endsWith('y')) {
                    const yToIRoot = root.slice(0, -1) + 'y';
                    if (guess === yToIRoot) {
                        return true;
                    }
                }
            }
            if (guess.endsWith(ending)) {
                const root = guess.slice(0, -ending.length);
                if (target === root) {
                    return true;
                }
                // Handle doubled consonants
                if (ending === 'ing' && root.length > 2 && root[root.length - 1] === root[root.length - 2]) {
                    const singleConsonantRoot = root.slice(0, -1);
                    if (target === singleConsonantRoot) {
                        return true;
                    }
                }
                if (ending === 'ed' && root.endsWith('y')) {
                    const yToIRoot = root.slice(0, -1) + 'y';
                    if (target === yToIRoot) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * Finds which category a word belongs to
     * @param word - The word to find
     * @returns Category information or null if not found
     */
    private findWordCategory(word: string): WordCategory | null {
        const normalizedWord = word.toLowerCase();
        return this.wordCategories.find(cat => 
            cat.words.map(w => w.toLowerCase()).includes(normalizedWord)
        ) || null;
    }

    /**
     * Generates a pattern showing some letters of a word
     * @param word - The word to create a pattern for
     * @returns Pattern string with some letters revealed
     */
    private generateWordPattern(word: string): string {
        const pattern = word.split('');
        const revealCount = Math.max(1, Math.floor(word.length * 0.3)); // Reveal 30% of letters
        
        // Randomly select positions to reveal
        const positions = new Set<number>();
        while (positions.size < revealCount) {
            positions.add(Math.floor(Math.random() * word.length));
        }

        // Replace non-revealed positions with underscores
        for (let i = 0; i < pattern.length; i++) {
            if (!positions.has(i)) {
                pattern[i] = '_';
            }
        }

        return pattern.join(' ');
    }

    /**
     * Cleans up all resources when shutting down
     */
    public shutdown(): void {
        this.recentlyUsedWords.clear();
        this.removeAllListeners();
    }
}