"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringParser = void 0;
const whitespace = [' ', '\t', '\r\n', '\n', '\r'];
/**
 * String Parser is a helper for stepwise tokenized string reading.
 */
class StringParser {
    /**
     * Constructs a StringParser object, setting up a string to be parsed
     *
     * @param parseString
     */
    constructor(parseString) {
        this.parseString = parseString;
        this.parsePos = 0;
    }
    /**
     * Moves just behind the match occurrence, looking forward
     *
     * @param match
     */
    aheadTo(match) {
        this.parsePos = this.parseString.indexOf(match, this.parsePos);
    }
    /**
     * Moves just forward of the match occurrence, looking forward
     * @param match
     */
    aheadPast(match) {
        this.parsePos = this.parseString.indexOf(match, this.parsePos) + match.length;
    }
    /**
     * Moves just forward the match occurrence, looking backward.
     * @param match
     */
    backTo(match) {
        this.backBefore(match);
        this.parsePos += match.length;
    }
    /**
     * Moves to the start of the match occurrence, looking backward.
     * @param match
     */
    backBefore(match) {
        this.parsePos = this.parseString.lastIndexOf(match, this.parsePos);
    }
    /**
     * Reads the word next in the parse string.
     * "Word" is terminated by the occurrence of one of the given delimiters.
     *
     * @param delimiters
     */
    readNext(delimiters) {
        if (!delimiters)
            delimiters = whitespace;
        let index = -1;
        let ds = delimiters.slice(0); // make copy
        while (index === -1) {
            const d = ds.shift();
            if (!d)
                break;
            index = this.parseString.indexOf(d, this.parsePos);
        }
        if (index === -1)
            index = undefined;
        const word = this.parseString.substring(this.parsePos, index);
        this.parsePos = index ? index + 1 : this.parseString.length;
        this.skipWhitespace();
        return word;
    }
    /**
     * Reads the word prior to the current position.
     * "Word" is terminated by the occurrence of one of the given delimiters.
     *
     * @param delimiters
     */
    readPrevious(delimiters) {
        if (!delimiters)
            delimiters = whitespace;
        let index = -1;
        let ds = delimiters.slice(); // make copy
        while (index === -1) {
            const d = ds.shift();
            if (!d)
                break;
            index = this.parseString.lastIndexOf(d, this.parsePos);
        }
        if (index === -1)
            index = 0;
        const word = this.parseString.substring(index, this.parsePos);
        return word;
    }
    /**
     * advances past any interceding whitespace at current position.
     */
    skipWhitespace() {
        while (whitespace.indexOf(this.parseString.charAt(this.parsePos)) !== -1) {
            this.parsePos++;
        }
    }
    /**
     * Returns the remaining part of the string ahead of parse position
     */
    getRemaining() {
        return this.parseString.substring(this.parsePos + 1);
    }
    /**
     * Moves the current parse position the given amount
     * @param charCount
     */
    advancePosition(charCount) {
        this.parsePos += charCount;
    }
    /**
     * Returns the current parse position
     */
    get parsePosition() { return this.parsePos; }
}
exports.StringParser = StringParser;
