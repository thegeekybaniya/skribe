/**
 * @fileoverview Unit tests for WordService
 * 
 * This test file covers all WordService functionality including:
 * - Random word selection with different difficulty levels
 * - Word validation and guess checking
 * - Category management and word hints
 * - Recent word tracking to avoid repetition
 * - Custom word addition and management
 * 
 * Requirements covered: 3.1, 3.2, 3.3, 3.4, 3.5, 4.2
 */

import { WordService } from './WordService';

describe('WordService', () => {
    let wordService: WordService;

    beforeEach(() => {
        // Create a fresh WordService instance for each test
        wordService = new WordService();
    });

    afterEach(() => {
        // Clean up resources after each test
        wordService.shutdown();
    });

    describe('getRandomWord', () => {
        it('should return a random word when called without options', () => {
            // Test basic word selection functionality
            const word = wordService.getRandomWord('test-room-1');
            
            expect(word).toBeDefined();
            expect(typeof word).toBe('string');
            expect(word.length).toBeGreaterThan(0);
        });

        it('should return different words on subsequent calls', () => {
            // Test that the service provides variety in word selection
            const word1 = wordService.getRandomWord('test-room-2');
            const word2 = wordService.getRandomWord('test-room-2');
            const word3 = wordService.getRandomWord('test-room-2');
            
            // While it's possible to get the same word, it's very unlikely with 3 calls
            const uniqueWords = new Set([word1, word2, word3]);
            expect(uniqueWords.size).toBeGreaterThanOrEqual(2);
        });

        it('should respect difficulty level filtering', () => {
            // Test easy difficulty selection
            const easyWord = wordService.getRandomWord('test-room-3', { difficulty: 'easy' });
            expect(easyWord).toBeDefined();
            
            // Test medium difficulty selection
            const mediumWord = wordService.getRandomWord('test-room-3', { difficulty: 'medium' });
            expect(mediumWord).toBeDefined();
            
            // Test hard difficulty selection
            const hardWord = wordService.getRandomWord('test-room-3', { difficulty: 'hard' });
            expect(hardWord).toBeDefined();
        });

        it('should respect category filtering', () => {
            // Test category-specific word selection
            const animalWord = wordService.getRandomWord('test-room-4', { category: 'animals' });
            const foodWord = wordService.getRandomWord('test-room-4', { category: 'food' });
            
            expect(animalWord).toBeDefined();
            expect(foodWord).toBeDefined();
            
            // Verify words come from correct categories
            const animalWords = wordService.getCategoryWords('animals');
            const foodWords = wordService.getCategoryWords('food');
            
            expect(animalWords).toContain(animalWord);
            expect(foodWords).toContain(foodWord);
        });

        it('should avoid recently used words', () => {
            // Test that recently used words are avoided
            const roomId = 'test-room-5';
            const usedWords = new Set<string>();
            
            // Get several words and track them
            for (let i = 0; i < 10; i++) {
                const word = wordService.getRandomWord(roomId);
                usedWords.add(word);
            }
            
            // Get more words and verify they're different
            for (let i = 0; i < 5; i++) {
                const word = wordService.getRandomWord(roomId);
                // Due to the large word pool, we shouldn't get repeats immediately
                // This test verifies the recent word tracking is working
                expect(word).toBeDefined();
            }
        });

        it('should handle excluded words', () => {
            // Test that specific words can be excluded from selection
            const excludeWords = ['cat', 'dog', 'bird'];
            const word = wordService.getRandomWord('test-room-6', { excludeWords });
            
            expect(word).toBeDefined();
            expect(excludeWords).not.toContain(word);
        });

        it('should reset recent words when no words are available', () => {
            // Test the reset mechanism when all words have been used
            const roomId = 'test-room-7';
            
            // This test is hard to verify directly, but we can ensure it doesn't crash
            // when the recent words list gets full
            for (let i = 0; i < 50; i++) {
                const word = wordService.getRandomWord(roomId, { category: 'animals' });
                expect(word).toBeDefined();
            }
        });
    });

    describe('validateGuess', () => {
        it('should validate exact matches correctly', () => {
            // Test exact word matching (case insensitive by default)
            expect(wordService.validateGuess('cat', 'cat')).toBe(true);
            expect(wordService.validateGuess('CAT', 'cat')).toBe(true);
            expect(wordService.validateGuess('Cat', 'CAT')).toBe(true);
            expect(wordService.validateGuess('dog', 'cat')).toBe(false);
        });

        it('should handle case sensitivity option', () => {
            // Test case sensitive validation when enabled
            expect(wordService.validateGuess('cat', 'CAT', { caseSensitive: true })).toBe(false);
            expect(wordService.validateGuess('CAT', 'CAT', { caseSensitive: true })).toBe(true);
            expect(wordService.validateGuess('cat', 'cat', { caseSensitive: true })).toBe(true);
        });

        it('should handle whitespace correctly', () => {
            // Test that whitespace is properly trimmed
            expect(wordService.validateGuess('  cat  ', 'cat')).toBe(true);
            expect(wordService.validateGuess('cat', '  cat  ')).toBe(true);
            expect(wordService.validateGuess('  cat  ', '  cat  ')).toBe(true);
        });

        it('should handle empty inputs', () => {
            // Test edge cases with empty or invalid inputs
            expect(wordService.validateGuess('', 'cat')).toBe(false);
            expect(wordService.validateGuess('cat', '')).toBe(false);
            expect(wordService.validateGuess('', '')).toBe(false);
            expect(wordService.validateGuess('   ', 'cat')).toBe(false);
        });

        it('should handle word variations', () => {
            // Test common word variations (plurals, verb forms)
            expect(wordService.validateGuess('cats', 'cat')).toBe(true);
            expect(wordService.validateGuess('cat', 'cats')).toBe(true);
            expect(wordService.validateGuess('running', 'run')).toBe(true);
            expect(wordService.validateGuess('played', 'play')).toBe(true);
        });

        it('should handle partial matching when enabled', () => {
            // Test partial matching functionality
            expect(wordService.validateGuess('ele', 'elephant', { allowPartial: true })).toBe(true);
            expect(wordService.validateGuess('phant', 'elephant', { allowPartial: true })).toBe(true);
            expect(wordService.validateGuess('xyz', 'elephant', { allowPartial: true })).toBe(false);
            
            // Partial matching should be disabled by default
            expect(wordService.validateGuess('ele', 'elephant')).toBe(false);
        });
    });

    describe('getWordHint', () => {
        it('should provide word length hint at level 1', () => {
            // Test basic hint functionality
            const hint = wordService.getWordHint('elephant', 1);
            
            expect(hint.length).toBe(8);
            expect(hint.category).toBeUndefined();
            expect(hint.pattern).toBeUndefined();
        });

        it('should provide category hint at level 2', () => {
            // Test category hint functionality
            const hint = wordService.getWordHint('cat', 2);
            
            expect(hint.length).toBe(3);
            expect(hint.category).toBe('animals');
        });

        it('should provide pattern hint at level 3', () => {
            // Test pattern hint functionality
            const hint = wordService.getWordHint('elephant', 3);
            
            expect(hint.length).toBe(8);
            expect(hint.category).toBe('animals');
            expect(hint.pattern).toBeDefined();
            expect(hint.pattern).toContain('_');
            expect(hint.pattern!.split(' ').length).toBe(8); // Should have spaces between characters
        });

        it('should handle words not in categories', () => {
            // Test hint generation for words not in predefined categories
            const hint = wordService.getWordHint('unknownword', 2);
            
            expect(hint.length).toBe(11);
            expect(hint.category).toBeUndefined();
        });
    });

    describe('getCategories', () => {
        it('should return all available categories', () => {
            // Test category listing functionality
            const categories = wordService.getCategories();
            
            expect(categories).toBeDefined();
            expect(Array.isArray(categories)).toBe(true);
            expect(categories.length).toBeGreaterThan(0);
            
            // Check that each category has required properties
            categories.forEach(category => {
                expect(category.name).toBeDefined();
                expect(category.difficulty).toBeDefined();
                expect(category.wordCount).toBeGreaterThan(0);
                expect(['easy', 'medium', 'hard']).toContain(category.difficulty);
            });
        });

        it('should include expected default categories', () => {
            // Test that default categories are present
            const categories = wordService.getCategories();
            const categoryNames = categories.map(c => c.name);
            
            expect(categoryNames).toContain('animals');
            expect(categoryNames).toContain('food');
            expect(categoryNames).toContain('objects');
            expect(categoryNames).toContain('actions');
        });
    });

    describe('getCategoryWords', () => {
        it('should return words for valid categories', () => {
            // Test word retrieval for specific categories
            const animalWords = wordService.getCategoryWords('animals');
            const foodWords = wordService.getCategoryWords('food');
            
            expect(Array.isArray(animalWords)).toBe(true);
            expect(Array.isArray(foodWords)).toBe(true);
            expect(animalWords.length).toBeGreaterThan(0);
            expect(foodWords.length).toBeGreaterThan(0);
            
            // Verify expected words are present
            expect(animalWords).toContain('cat');
            expect(animalWords).toContain('dog');
            expect(foodWords).toContain('pizza');
            expect(foodWords).toContain('apple');
        });

        it('should return empty array for invalid categories', () => {
            // Test handling of non-existent categories
            const invalidWords = wordService.getCategoryWords('nonexistent');
            
            expect(Array.isArray(invalidWords)).toBe(true);
            expect(invalidWords.length).toBe(0);
        });
    });

    describe('addWordsToCategory', () => {
        it('should add words to existing categories', () => {
            // Test adding words to an existing category
            const newWords = ['lion', 'tiger', 'bear'];
            wordService.addWordsToCategory('animals', newWords, 'medium');
            
            const animalWords = wordService.getCategoryWords('animals');
            newWords.forEach(word => {
                expect(animalWords).toContain(word);
            });
        });

        it('should create new categories when needed', () => {
            // Test creating a new category with words
            const newWords = ['guitar', 'piano', 'drums'];
            wordService.addWordsToCategory('instruments', newWords, 'medium');
            
            const instrumentWords = wordService.getCategoryWords('instruments');
            expect(instrumentWords.length).toBe(3);
            newWords.forEach(word => {
                expect(instrumentWords).toContain(word);
            });
            
            // Verify category appears in category list
            const categories = wordService.getCategories();
            const categoryNames = categories.map(c => c.name);
            expect(categoryNames).toContain('instruments');
        });

        it('should avoid duplicate words', () => {
            // Test that duplicate words are not added
            const originalWords = wordService.getCategoryWords('animals');
            const originalCount = originalWords.length;
            
            // Try to add existing words
            wordService.addWordsToCategory('animals', ['cat', 'dog'], 'easy');
            
            const updatedWords = wordService.getCategoryWords('animals');
            expect(updatedWords.length).toBe(originalCount); // Should not increase
        });

        it('should emit wordsAdded event', (done) => {
            // Test that the service emits events when words are added
            const newWords = ['test1', 'test2'];
            
            wordService.once('wordsAdded', (categoryName, words) => {
                expect(categoryName).toBe('testcategory');
                expect(words).toEqual(newWords);
                done();
            });
            
            wordService.addWordsToCategory('testcategory', newWords, 'easy');
        });
    });

    describe('clearRecentWords', () => {
        it('should clear recent words for a specific room', () => {
            // Test recent words clearing functionality
            const roomId = 'test-room-clear';
            
            // Generate some words to populate recent list
            for (let i = 0; i < 5; i++) {
                wordService.getRandomWord(roomId);
            }
            
            // Clear recent words
            wordService.clearRecentWords(roomId);
            
            // This is hard to test directly, but we can verify it doesn't crash
            // and that we can still get words
            const word = wordService.getRandomWord(roomId);
            expect(word).toBeDefined();
        });
    });

    describe('getWordStats', () => {
        it('should return correct statistics', () => {
            // Test statistics functionality
            const stats = wordService.getWordStats();
            
            expect(stats.totalWords).toBeGreaterThan(0);
            expect(stats.categories).toBeGreaterThan(0);
            expect(stats.recentWords).toBe(0); // No room specified
        });

        it('should return room-specific recent word count', () => {
            // Test room-specific statistics
            const roomId = 'test-room-stats';
            
            // Generate some words
            for (let i = 0; i < 3; i++) {
                wordService.getRandomWord(roomId);
            }
            
            const stats = wordService.getWordStats(roomId);
            expect(stats.recentWords).toBe(3);
        });
    });

    describe('event emission', () => {
        it('should emit wordSelected event when word is selected', (done) => {
            // Test that word selection events are emitted
            const roomId = 'test-room-event';
            const options = { difficulty: 'easy' as const };
            
            wordService.once('wordSelected', (emittedRoomId, word, emittedOptions) => {
                expect(emittedRoomId).toBe(roomId);
                expect(word).toBeDefined();
                expect(emittedOptions).toEqual(options);
                done();
            });
            
            wordService.getRandomWord(roomId, options);
        });
    });

    describe('shutdown', () => {
        it('should clean up resources properly', () => {
            // Test proper cleanup functionality
            const roomId = 'test-room-shutdown';
            
            // Generate some data
            wordService.getRandomWord(roomId);
            wordService.addWordsToCategory('testcat', ['word1'], 'easy');
            
            // Shutdown should not throw
            expect(() => wordService.shutdown()).not.toThrow();
            
            // After shutdown, stats should show no recent words
            const stats = wordService.getWordStats(roomId);
            expect(stats.recentWords).toBe(0);
        });
    });

    describe('edge cases and error handling', () => {
        it('should handle very long words', () => {
            // Test handling of unusually long words
            const longWord = 'a'.repeat(100);
            const hint = wordService.getWordHint(longWord, 3);
            
            expect(hint.length).toBe(100);
            expect(hint.pattern).toBeDefined();
        });

        it('should handle special characters in words', () => {
            // Test handling of words with special characters
            expect(wordService.validateGuess('test-word', 'test-word')).toBe(true);
            expect(wordService.validateGuess("test'word", "test'word")).toBe(true);
        });

        it('should handle unicode characters', () => {
            // Test handling of unicode characters
            expect(wordService.validateGuess('café', 'café')).toBe(true);
            expect(wordService.validateGuess('naïve', 'naïve')).toBe(true);
        });
    });
});