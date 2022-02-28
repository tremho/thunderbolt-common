
export class EventData {
    public app:any // AppCore
    public sourceComponent:any          // the StdComp / ComponentBase component
    public eventType:string|undefined   // native event type (e.g. mousedown)
    public eventName:string|undefined   // pseudo type (e.g. 'down')
    public tag:string|undefined         // associated tag (e.g. 'action')
    public value?:any                   // some events have additional value information
    public platEvent:any                // the full native event object
}
