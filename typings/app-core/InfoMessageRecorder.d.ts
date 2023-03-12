export declare class InfoMessageRecorder {
    private recorded;
    private maxRecords;
    private subscribers;
    /**
     * Records entry, maintaining max size as needed.
     * @param im
     * @private
     */
    private record;
    /**
     * Notifies subscribers on a change.  Passes entire array as the argument.
     * @private
     */
    private notify;
    /**
     * Subscribe to a notification when the array changes
     * @param callback -- callback is passed the entire InfoMessage array on a change
     * @returns {number} -- and id that may be used to unsubscribe
     */
    subscribe(callback: any): number;
    /**
     * Unsubscribes from further notifications.
     * @param subscribeId -- the number returned by subscribe.
     */
    unsubscribe(subscribeId: string): void;
    /**
     * Records a message
     * @param subject
     * @param message
     */
    write(subject: string, message: string): void;
    /**
     * Records a message referring to an object.
     * @param refObj
     * @param subject
     * @param message
     */
    writeFor(refObj: object, subject: string, message: string): void;
}
export declare function getInfoMessageRecorder(): InfoMessageRecorder;
