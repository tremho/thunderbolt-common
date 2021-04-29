/*
Records log-style messages into an array that can be displayed by UI
- sends events on update
- has adjustable max-lines and will trim off top to make room at bottom
- We may have more than one of these for different purposes.
 */

class InfoMessage {
    public timestamp:number = Date.now(); // ms timestamp
    public subject: string = ''; // message subject or title
    public message:string = '';  // the message body
    public refObj?:any;      // object referred to, if any
}

export class InfoMessageRecorder {
    private recorded:InfoMessage[] = []
    private maxRecords:number = 5000;
    private subscribers:any[] = []

    /**
     * Records entry, maintaining max size as needed.
     * @param im
     * @private
     */
    private record(im:InfoMessage) {
        // console.log('recording IM', im)
        while (this.recorded.length >= this.maxRecords) {
            this.recorded.shift()
        }
        this.recorded.push(im)
        this.notify()
    }

    /**
     * Notifies subscribers on a change.  Passes entire array as the argument.
     * @private
     */
    private notify() {
        // console.log('notifying '+this.subscribers.length+' subscribers')
        this.subscribers.forEach(cb => {
            if(cb) {
                // console.log('calling subscriber...')
                cb(this.recorded)
            }
        })
    }

    /**
     * Subscribe to a notification when the array changes
     * @param callback -- callback is passed the entire InfoMessage array on a change
     * @returns {number} -- and id that may be used to unsubscribe
     */
    public subscribe(callback:any) : number {
        const trimmed:string[] = []
        this.subscribers.forEach((s:string) => {
            if(s) trimmed.push(s);
        })
        this.subscribers = trimmed;
        this.subscribers.push(callback)
        return this.subscribers.length -1
    }

    /**
     * Unsubscribes from further notifications.
     * @param subscribeId -- the number returned by subscribe.
     */
    public unsubscribe(subscribeId:string) {
        // @ts-ignore
        this.subscribers[subscribeId] = null;
    }

    /**
     * Records a message
     * @param subject
     * @param message
     */
    public write(subject:string, message:string) {
        const im = new InfoMessage()
        im.subject = subject;
        im.message = message;
        this.record(im)
    }

    /**
     * Records a message referring to an object.
     * @param refObj
     * @param subject
     * @param message
     */
    public writeFor(refObj:object, subject:string, message:string) {
        const im = new InfoMessage()
        im.subject = subject;
        im.message = message;
        im.refObj = refObj;
        this.record(im)
    }
}

// export thie as a singleton with access in AppGateway via API

let imrSingleton:InfoMessageRecorder|null = null;

export function getInfoMessageRecorder() {
    if(!imrSingleton) {
        imrSingleton = new InfoMessageRecorder()
    }
    return imrSingleton;
}