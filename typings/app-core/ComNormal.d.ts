declare class Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
    get left(): number;
    get top(): number;
    get right(): number;
    get bottom(): number;
    get cx(): number;
    get cy(): number;
}
export declare class ComNormal {
    stdComp: any;
    /**
     * Create the API implementation handler with reference to the Component that owns it
     * @param stdComp
     */
    constructor(stdComp: any);
    /**
     * Checks for an iOS implementation
     * @returns true if we're running on an iOS device
     */
    get isIOS(): boolean;
    /**
     * Checks for an Android implementation
     * @returns true if we're running on an Android device
     */
    get isAndroid(): boolean;
    /**
     * Checks for a mobile implementation
     * @returns true if running under Nativescript on an Android or iOS device
     */
    get isMobile(): boolean;
    /**
     * Finds the first child component (aka 'element') of the given tag within the scope of this component
     * @param {string} tag Tag name to find (e.g. 'div')
     * @returns {*} the Element or View found, or undefined if none found
     */
    elementFind(tag: string): any;
    /**
     * Returns an array of all child components, possibly nested, of teh given tag found within the scope of this component
     * @param {string} tag Tag name to find (e.g. 'div')
     * @returns {*[]} an array of the Elements or Views found, or undefined if none found
     */
    elementFindAll(tag: string): any[];
    private mobileFind;
    /**
     * Get a value of a property set in the component markup
     * @param propName
     */
    getProp(propName: string): any;
    registerHandler(comp: any, purpose:string, action: string, func: any): void;
    /**
     * Cross-platform event binder
     *
     * use 'pseudoEventTag' strings to denote similar listener types for each platform
     * In some cases, a gesture handler is invoked before returning the higher-level result
     * pseudoEventTags are:
     *  - down
     *  - up
     *  - press
     *  - dblpress
     *  - longpress
     *  - swipeleft
     *  - swiperight
     *  - swipeup
     *  - swipedown
     *  - pan
     *  - rotate
     *  - pinch
     *
     *  Note that 'native' strings are aliased to be equivalent to the cross-platform versions, so
     *  specifying 'click' is the same as saying 'press'.  The aliases are not recommended. Use the pseudo strings
     *  instead.
     *
     * @param {*} el the Element or View to attach listener to
     * @param {string} pseudoEventTag  the type of event to trap
     * @param {*} func the callback function called when the qualified event occurs
     *
     */
    listenToFor(el: any, pseudoEventTag: string, func: (ed: any) => {}): void;
    /**
     * Gets the dimensions of a subcomponent ('element')
     *
     * @param {*} element  the Element or View to be measured
     * @returns {Bounds} {x, y, width, height, left, top, right, bottom, cx, cy} where the first 4 properties are
     * r/w and the others read-only. cx/cy refer to element center.
     */
    getElementBounds(element: any): Bounds;
    /**
     * Set a style property to the given value and units
     * This should replace statements like `el.style.width = '12px'` with `setStyleProp(el, 'width', 12, 'px'
     * Can also set non-numeric props, like `setStyle(bgEl, 'backgroundSize', 'contain')`
     *
     * @param {*}  el Element or View to set prop for
     * @param {string} prop Name of property to set
     * @param {number|string} value Value to set for this property
     * @param {string} unit CSS unit type (e.g. px, %, em, in, etc)
     */
    setStyleProp(el: any, prop: string, value: number | string, unit?: string): void;
    addClass(className: string | string[]): void;
    removeClass(className: string | string[]): void;
}
export {};
