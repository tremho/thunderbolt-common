/**
 * String Parser is a helper for stepwise tokenized string reading.
 */
export declare class StringParser {
    private parseString;
    private parsePos;
    /**
     * Constructs a StringParser object, setting up a string to be parsed
     *
     * @param parseString
     */
    constructor(parseString: string);
    /**
     * Moves just behind the match occurrence, looking forward
     *
     * @param match
     */
    aheadTo(match: string): void;
    /**
     * Moves just forward of the match occurrence, looking forward
     * @param match
     */
    aheadPast(match: string): void;
    /**
     * Moves just forward the match occurrence, looking backward.
     * @param match
     */
    backTo(match: string): void;
    /**
     * Moves to the start of the match occurrence, looking backward.
     * @param match
     */
    backBefore(match: string): void;
    /**
     * Reads the word next in the parse string.
     * "Word" is terminated by the occurrence of one of the given delimiters.
     *
     * @param delimiters
     */
    readNext(delimiters?: string[]): string;
    /**
     * Reads the word prior to the current position.
     * "Word" is terminated by the occurrence of one of the given delimiters.
     *
     * @param delimiters
     */
    readPrevious(delimiters?: string[]): string;
    /**
     * advances past any interceding whitespace at current position.
     */
    skipWhitespace(): void;
    /**
     * Returns the remaining part of the string ahead of parse position
     */
    getRemaining(): string;
    /**
     * Moves the current parse position the given amount
     * @param charCount
     */
    advancePosition(charCount: number): void;
    /**
     * Returns the current parse position
     */
    get parsePosition(): number;
}
