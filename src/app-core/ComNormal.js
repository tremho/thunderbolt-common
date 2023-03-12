"use strict";
/*
Normalized element manipulation APIs for components

These apis should be called from same-contract methods on the 'Component' for both riot and NS implementations

    get isIOS(): boolean
    get isAndroid(): boolean
    get isMobile(): boolean
    elementFind(tag:string):any
    elementFindAll(tag:string):any[]
    listenFor(pseudoEventTag:string, func:(ed:any)=>{})
    getElementBounds(element:any)

 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComNormal = void 0;
class Bounds {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
    }
    get left() { return this.x; }
    get top() { return this.y; }
    get right() { return this.x + this.width; }
    get bottom() { return this.y + this.height; }
    get cx() { return this.x + this.width / 2; }
    get cy() { return this.y + this.height / 2; }
}
const EventData_1 = require("./EventData");
const sessionDataMap = {};
function getSessionData(comp) {
    if (!sessionDataMap[comp]) {
        sessionDataMap[comp] = {};
    }
    return sessionDataMap[comp];
}
class ComNormal {
    /**
     * Create the API implementation handler with reference to the Component that owns it
     * @param stdComp
     */
    constructor(stdComp) {
        this.stdComp = stdComp;
    }
    /**
     * Checks for an iOS implementation
     * @returns true if we're running on an iOS device
     */
    get isIOS() {
        return (this.stdComp.component && this.stdComp.component.ios);
    }
    /**
     * Checks for an Android implementation
     * @returns true if we're running on an Android device
     */
    get isAndroid() {
        return (this.stdComp.component && this.stdComp.component.android);
    }
    /**
     * Checks for a mobile implementation
     * @returns true if running under Nativescript on an Android or iOS device
     */
    get isMobile() {
        return this.isAndroid || this.isIOS;
    }
    /**
     * Finds the first child component (aka 'element') of the given tag within the scope of this component
     * @param {string} tag Tag name to find (e.g. 'div')
     * @returns {*} the Element or View found, or undefined if none found
     */
    elementFind(tag) {
        if (this.isMobile) {
            return this.mobileFind(tag)[0];
        }
        else {
            return this.stdComp.$(tag);
        }
    }
    /**
     * Returns an array of all child components, possibly nested, of teh given tag found within the scope of this component
     * @param {string} tag Tag name to find (e.g. 'div')
     * @returns {*[]} an array of the Elements or Views found, or undefined if none found
     */
    elementFindAll(tag) {
        if (this.isMobile) {
            return this.mobileFind(tag);
        }
        else {
            return this.stdComp.$$(tag);
        }
    }
    // Local function for mobile to find children
    mobileFind(tag) {
        const found = [];
        const parts = tag.split('.');
        let name = pascalCase(parts[0]); // to match primary class name as assigned by ComponentBase
        const className = parts[1];
        if (this.isMobile) {
            const childFinder = (parent) => {
                let count = (parent.getChildrenCount && parent.getChildrenCount()) || 0;
                for (let i = 0; i < count; i++) {
                    const child = parent.getChildAt(i);
                    const kname = child.className;
                    let hit = (kname === name); // pascal case compare
                    if (name) {
                        name = name.toLowerCase(); // we'll do ci compares now
                        let tn = (child.tagName || '').toLowerCase();
                        hit = hit || (tn === name);
                        hit = hit || !!(kname && kname.toLowerCase().indexOf(name) === 0);
                    }
                    hit = hit || !!(kname && className && kname.indexOf(className) !== -1);
                    if (hit) {
                        // console.log('found ', child)
                        found.push(child);
                    }
                    if (child.getChildrenCount && child.getChildrenCount())
                        childFinder(child);
                }
            };
            // console.log('for reference, component is ', this.stdComp.component)
            // console.log('starting find at ', this.stdComp)
            childFinder(this.stdComp);
        }
        return found;
    }
    /**
     * Get a value of a property set in the component markup
     * @param propName
     */
    getProp(propName) {
        if (this.isMobile) {
            const comp = this.stdComp.component;
            return comp.get(propName);
        }
        else {
            const props = this.stdComp.bound || {};
            return props[propName];
        }
    }
    // use to attach only one listener per event type per component, since we can't remove them
    registerHandler(comp, action, func) {
        const session = getSessionData(comp);
        if (session[action] !== func) {
            session[action] = func;
            if (this.isMobile) {
                comp.on(action, func);
            }
            else {
                comp.addEventListener(action, func);
            }
        }
    }
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
    listenToFor(el, pseudoEventTag, func) {
        if (this.isMobile) {
            const mappedEvents = {
                'down': { action: 'touch', mode: 'down' },
                'mousedown': { aka: 'down' },
                'up': { action: 'touch', mode: 'up' },
                'mouseup': { aka: 'up' },
                'press': { action: 'tap' },
                'tap': { aka: 'press' },
                'click': { aka: 'press' },
                'dblpress': { action: 'double tap' },
                'dblclick': { aka: 'dblpress' },
                'dbltap': { aka: 'dblpress' },
                'swipeleft': { action: 'swipe', mode: 'left' },
                'swiperight': { action: 'swipe', mode: 'right' },
                'swipeup': { action: 'swipe', mode: 'up' },
                'swipedown': { action: 'swipe', mode: 'down' },
                'longpress': { action: 'longpress' },
                'pan': { handler: mobilePanHandler },
                'drag': { aka: 'pan' },
                'rotation': { action: 'rotation' },
                'rotate': { aka: 'rotation' },
                'pinch': { action: 'pinch' }
            };
            // @ts-ignore
            let h = mappedEvents[pseudoEventTag];
            if (h) {
                // @ts-ignore
                if (h.aka)
                    h = mappedEvents[h.aka];
                let { action, handler } = h;
                if (action) {
                    const lhndlr = (ev) => {
                        // console.log('mobile handler for '+action+' triggered')
                        mobileHandler(ev, func, this);
                    };
                    this.registerHandler(el, action, lhndlr);
                }
                else if (handler) {
                    handler(el, h.mode, func, this);
                }
            }
        }
        else {
            const mappedEvents = {
                'mousedown': { action: 'mousedown' },
                'down': { aka: 'mousedown' },
                'mouseup': { action: 'mouseup' },
                'up': { aka: 'mouseup' },
                'press': { action: 'click' },
                'tap': { aka: 'press' },
                'click': { aka: 'press' },
                'dblpress': { action: 'dblclick' },
                'dblclick': { aka: 'dblpress' },
                'dbltap': { aka: 'dblpress' },
                'swipeleft': { handler: handleSwipe, mode: 'left' },
                'swiperight': { handler: handleSwipe, mode: 'right' },
                'swipeup': { handler: handleSwipe, mode: 'up' },
                'swipedown': { handler: handleSwipe, mode: 'down' },
                'longpress': { handler: handleLongPress },
                'pan': { handler: handlePan },
                'drag': { aka: 'pan' },
                'rotation': { handler: handleRotation },
                'rotate': { aka: 'rotation' },
                'pinch': { handler: handlePinch }
            };
            // @ts-ignore
            let h = mappedEvents[pseudoEventTag];
            if (h) {
                // @ts-ignore
                if (h.aka)
                    h = mappedEvents[h.aka];
                let { action, handler } = h;
                if (action) {
                    // const lhndlr = (ev:any) => {
                    //     // console.log('dom handler for ' + action + ' triggered', ev)
                    // }
                    this.registerHandler(el, action, func);
                }
                else if (handler) {
                    handler(el, h.mode, func, this);
                }
            }
        }
    }
    /**
     * Gets the dimensions of a subcomponent ('element')
     *
     * @param {*} element  the Element or View to be measured
     * @returns {Bounds} {x, y, width, height, left, top, right, bottom, cx, cy} where the first 4 properties are
     * r/w and the others read-only. cx/cy refer to element center.
     */
    getElementBounds(element) {
        const cbounds = new Bounds();
        if (this.isMobile) {
            const loc = element.getLocationInWindow();
            const size = element.getActualSize();
            cbounds.x = loc.x;
            cbounds.y = loc.y;
            cbounds.width = size.width;
            cbounds.height = size.height;
        }
        else {
            const dbounds = element.getBoundingClientRect();
            cbounds.x = dbounds.x;
            cbounds.y = dbounds.y;
            cbounds.width = dbounds.width;
            cbounds.height = dbounds.height;
        }
        return cbounds;
    }
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
    setStyleProp(el, prop, value, unit) {
        if (this.isMobile) {
            const emSize = 15; // consistent with CLI definition
            // Same translation used at CLI (migrateScss)
            let v = Number(value);
            if (unit === 'px')
                unit = '';
            else if (unit === 'em' || unit === 'rem') {
                v *= emSize;
                unit = '';
            }
            else if (unit === 'in') {
                v *= 96; // pixels per inch per CSS
                unit = '';
            }
            else if (unit === 'pt') {
                v *= 96 / 72; // one point is 1/72 inch
                unit = '';
            }
            else if (unit === 'pc') {
                // pica is 12 points
                v *= 12 * 96 / 72;
                unit = '';
            }
            else if (unit === 'cm') {
                // cm to inch to pixel
                v *= 0.39370079 * 96;
                unit = '';
            }
            else if (unit === 'mm') {
                // mm to inch to pixel
                v *= 0.039370079 * 96;
                unit = '';
            }
            if (!unit)
                unit = '';
            let sv;
            if (isFinite(v)) {
                sv = v + unit;
            }
            else {
                sv = value;
            }
            el.set(prop, sv);
        }
        else {
            el.style[prop] = value + (unit || '');
        }
    }
    addClass(className) {
        if (!Array.isArray(className)) {
            className = [className];
        }
        if (this.isMobile) {
            let classes = (this.stdComp.component.get('className') || '').split(' ');
            for (let i = 0; i < classes.length; i++) {
                className.push(classes[i]);
            }
            classes = [];
            for (let name of className) {
                classes.push(name);
            }
            this.stdComp.component.className = classes.join(' ');
        }
        else {
            const el = this.stdComp.riot.root;
            for (let name of className) {
                el.classList.add(name);
            }
        }
    }
    removeClass(className) {
        if (!Array.isArray(className)) {
            className = [className];
        }
        if (this.isMobile) {
            let classes = (this.stdComp.component.get('className') || '').split(' ');
            for (let i = 0; i < classes.length; i++) {
                if (className.indexOf(classes[i]) === -1) {
                    className.push(classes[i]);
                }
            }
            this.stdComp.component.className = classes.join(' ');
        }
        else {
            const el = this.stdComp.riot.root;
            for (let name of className) {
                el.classList.add(name);
            }
        }
    }
}
exports.ComNormal = ComNormal;
// -- DOM event gesture handling
function handleSwipe(comp, mode, cb, cn) {
    const callback = (ev) => {
        const ed = new EventData_1.EventData();
        ed.tag = 'action';
        ed.value = mode;
        ed.eventType = 'swipe';
        ed.app = cn.stdComp.cm.getApp();
        ed.platEvent = ev;
        ed.sourceComponent = cn.stdComp.cm.getComponent(comp);
        cb(ed);
    };
    const hdlMove = (ev) => {
        if (ev.buttons) {
            const threshold = 50;
            let mx = ev.movementX;
            let my = ev.movementY;
            if (mode === 'left' && mx < -threshold) {
                // todo: need a canonical form of callback
                callback(ev);
            }
            else if (mode === 'right' && mx > threshold) {
                callback(ev);
            }
            else if (mode === 'up' && my < -threshold) {
                callback(ev);
            }
            else if (mode === 'down' && my > threshold) {
                callback(ev);
            }
        }
    };
    cn.registerHandler(comp, 'mousemove', hdlMove);
}
function handleLongPress(comp, mode, cb, cn) {
    let session = getSessionData(comp);
    const longPressInterval = 750;
    const hdlDown = (ev) => {
        clearTimeout(session.timerId);
        session.timerId = setTimeout(() => {
            const ed = new EventData_1.EventData();
            ed.tag = 'action';
            ed.value = longPressInterval;
            ed.eventType = 'longpress';
            ed.app = cn.stdComp.cm.getApp();
            ed.platEvent = ev;
            ed.sourceComponent = cn.stdComp.cm.getComponent(comp);
            cb(ed);
        }, longPressInterval);
    };
    const hdlUp = () => {
        clearTimeout(session.timerId);
    };
    cn.registerHandler(comp, 'mousedown', hdlDown);
    cn.registerHandler(comp, 'mouseup', hdlUp);
    cn.registerHandler(comp, 'mouseout', hdlUp);
}
function handlePan(comp, mode, cb, cn) {
    let session = getSessionData(comp);
    const callback = (ev, type) => {
        let ed = new EventData_1.EventData();
        let mx = ev.movementX || 0;
        let my = ev.movementY || 0;
        session.x += mx;
        session.y += my;
        let tmx = session.x - session.startx;
        let tmy = session.y - session.starty;
        let clientX = ev.clientX;
        let clientY = ev.clientY;
        if (type === 'start') {
            tmx = session.x;
            tmy = session.y;
            session.startx = session.starty = 0;
        }
        ed.app = cn.stdComp.cm.getApp();
        ed.sourceComponent = cn.stdComp.cm.getComponent(comp);
        ed.tag = 'action';
        ed.eventType = 'pan';
        ed.platEvent = ev;
        ed.value = { type, mx, my, tmx, tmy, clientX, clientY };
        cb(ed);
    };
    const hdlDown = (ev) => {
        session.active = true;
        let { offX, offY } = computeDOMOffsets(ev.currentTarget);
        session.startx = session.x = ev.clientX - offX;
        session.starty = session.y = ev.clientY - offY;
        callback(ev, 'start');
    };
    const hdlUp = () => {
        session.active = false;
    };
    const hdlMove = (ev) => {
        if (session.active) {
            if (ev.buttons) {
                callback(ev, 'drag');
            }
            else {
                session.active = session.started = false;
            }
        }
    };
    cn.registerHandler(comp, 'mousedown', hdlDown);
    cn.registerHandler(comp, 'mouseup', hdlUp);
    cn.registerHandler(comp, 'mousemove', hdlMove);
}
function handleRotation(comp, mode, cb, cn) {
    let session = getSessionData(comp);
    const hdlDown = (ev) => {
        if (ev.ctrlKey || ev.metaKey) {
            session.active = true;
            session.startx = session.x = ev.clientX;
            session.starty = session.y = ev.clientY;
        }
    };
    const hdlUp = () => {
        session.active = false;
    };
    const hdlMove = (ev) => {
        if (ev.buttons && session.active) {
            if (ev.ctrlKey || ev.metaKey) {
                let x = ev.clientX;
                let y = ev.clientY;
                session.x = x;
                session.y = y;
                // compute the angle between startx,y and x,y
                let angle = 0;
                let ed = new EventData_1.EventData();
                ed.app = cn.stdComp.cm.getApp();
                ed.sourceComponent = cn.stdComp.cm.getComponent(comp);
                ed.tag = 'action';
                ed.eventType = 'rotate';
                ed.platEvent = ev;
                ed.value = angle;
                cb(ed);
            }
        }
        else {
            session.active = false;
        }
    };
    cn.registerHandler(comp, 'mousedown', hdlDown);
    cn.registerHandler(comp, 'mouseup', hdlUp);
    cn.registerHandler(comp, 'mousemove', hdlMove);
}
function handlePinch(comp, mode, cb, cn) {
    let session = getSessionData(comp);
    const dist = (x1, y1, x2, y2) => {
        return Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2));
    };
    const hdlDown = (ev) => {
        if (ev.altKey) {
            session.active = true;
            // get center of component
            let r = comp.getBoundingClientRect();
            session.cx = r.left + r.width / 2;
            session.cy = r.top + r.height / 2;
            // compute starting distance
            session.startDist = dist(session.cx, session.cy, ev.clientX, ev.clientY);
        }
    };
    const hdlUp = () => {
        session.active = false;
    };
    const hdlMove = (ev) => {
        if (ev.buttons && session.active) {
            if (ev.altKey) {
                let x = ev.clientX;
                let y = ev.clientY;
                // compute distance to center
                let newDist = dist(session.cx, session.cy, x, y);
                // scale is ratio of this distance to original distance
                let scale = newDist / session.startDist;
                let ed = new EventData_1.EventData();
                ed.app = cn.stdComp.cm.getApp();
                ed.sourceComponent = cn.stdComp.cm.getComponent(comp);
                ed.tag = 'action';
                ed.eventType = 'pinch';
                ed.platEvent = ev;
                ed.value = scale;
                cb(ed);
            }
        }
        else {
            session.active = false;
        }
    };
    cn.registerHandler(comp, 'mousedown', hdlDown);
    cn.registerHandler(comp, 'mouseup', hdlUp);
    cn.registerHandler(comp, 'mousemove', hdlMove);
}
// -- mobile handler
function mobileHandler(ev, cb, cn) {
    const ed = new EventData_1.EventData();
    ed.tag = 'action';
    ed.app = cn.stdComp.cm.getApp();
    ed.eventType = ev.type.toString();
    ed.platEvent = ev;
    ed.sourceComponent = ev.view;
    // note: consider recoding as a switch statement for better readability.
    try {
        if (ev.type === 7 /*'touch'*/ || ev.type === 0 /*'tap'*/ || ev.type === 1 /*dtap*/ || ev.type === 6 /*longpress*/) {
            ed.value = {
                clientX: ev.getX(),
                clientY: ev.getY(),
                buttons: 1 // ev.getPointerCount() -- crash
            };
        }
        else if (ev.type === 4 /*'swipe'*/) {
            ed.value = ev.direction.toString();
        }
        else if (ev.type === 3 /*'pan'*/) {
            ed.value = {
                mx: ev.deltaX,
                my: ev.deltaY
                // can't do clientX, clientY because we only get the amount of movement since last time.
                // we would need a multi-event handler like the DOM handler has to get clientX,Y and tmx,tmy
                // using a reference point on first touch.
            };
        }
        else if (ev.type === 5 /*'rotation'*/) {
            ed.value = ev.rotation;
        }
        else if (ev.type === 2 /*'pinch'*/) {
            ed.value = ev.scale;
        }
    }
    catch (e) {
        console.log(e);
    }
    cb(ed);
}
// we have to do a multi-event trap to make pan work the way we want
// this is basically the same as the DOM version
function mobilePanHandler(comp, mode, cb, cn) {
    let session = getSessionData(comp);
    const callback = (ev, type) => {
        let ed = new EventData_1.EventData();
        let mx = ev.deltaX - session.x;
        let my = ev.deltaY - session.y;
        let tmx = session.x - session.startx;
        let tmy = session.y - session.starty;
        let clientX = session.x;
        let clientY = session.y;
        if (type === 'start') {
            mx = 0;
            my = 0;
            session.x = clientX = tmx = ev.getX();
            session.y = clientY = tmy = ev.getY();
            session.startx = session.starty = 0;
        }
        ed.app = cn.stdComp.cm.getApp();
        ed.sourceComponent = cn.stdComp.cm.getComponent(comp);
        ed.tag = 'action';
        ed.eventType = 'pan';
        ed.platEvent = ev;
        ed.value = { type, mx, my, tmx, tmy, clientX, clientY };
        cb(ed);
    };
    const hdlDown = (ev) => {
        session.active = true;
        callback(ev, 'start');
    };
    const hdlUp = () => {
        session.active = false;
    };
    const hdlTouch = (ev) => {
        if (ev.action === 'down')
            return hdlDown(ev);
        else if (ev.action === 'up')
            return hdlUp();
        else {
            session.x = ev.getX();
            session.y = ev.getY();
        }
    };
    const hdlMove = (ev) => {
        if (session.active) {
            callback(ev, 'drag');
        }
    };
    cn.registerHandler(comp, 'touch', hdlTouch);
    cn.registerHandler(comp, 'pan', hdlMove);
}
/**
 * Use to get the anchor point of a DOM element
 * so we can consistently keep values relative
 * @param el
 */
function computeDOMOffsets(el) {
    let offX = 0;
    let offY = 0;
    let curEl = el;
    while (curEl) {
        offX += curEl.offsetLeft;
        offY += curEl.offsetTop;
        curEl = curEl.offsetParent;
    }
    return { offX, offY };
}
function pascalCase(name) {
    let out = '';
    name.split('-').forEach(p => {
        out += p.charAt(0).toUpperCase() + p.substring(1).toLowerCase();
    });
    return out;
}
function camelCase(name) {
    let pc = pascalCase(name);
    return pc.charAt(0).toLowerCase() + pc.substring(1);
}
