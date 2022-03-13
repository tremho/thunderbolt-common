
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

let self:ComNormal;

class Bounds {
    x:number = 0
    y:number = 0
    width:number = 0
    height:number = 0

    get left() { return this.x }
    get top () { return this.y }
    get right() { return this.x + this.width }
    get bottom() { return this.y + this.height }
    get cx() { return this.x + this.width/2 }
    get cy() { return this.y + this.height/2 }
}

import {EventData} from "./EventData";

const sessionDataMap:any = {}
function getSessionData(comp:any) {
    if(!sessionDataMap[comp]) {
        sessionDataMap[comp] = {}
    }
    return sessionDataMap[comp]
}


export class ComNormal {
    stdComp:any
    public util:any = null

    /**
     * Create the API implementation handler with reference to the Component that owns it
     * @param stdComp
     */
    constructor(stdComp:any) {
        this.stdComp = stdComp
        self = this;
    }


    /**
     * Checks for an iOS implementation
     * @returns true if we're running on an iOS device
     */
    get isIOS(): boolean {
        return ((this.util?.ios) || (this.stdComp.component && this.stdComp.component.ios))
    }

    /**
     * Checks for an Android implementation
     * @returns true if we're running on an Android device
     */
    get isAndroid(): boolean {
        return ((this.util?.android) || (this.stdComp.component && this.stdComp.component.android))
    }

    /**
     * Checks for a mobile implementation
     * @returns true if running under Nativescript on an Android or iOS device
     */
    get isMobile(): boolean {
        return this.isAndroid || this.isIOS
    }

    /**
     * Returns true if this comNormal object is part of a mobile ComponentBase that was constructed
     * as a utility class for helping non-ComponentBase controls. (see ComponentBase constructor and stack-layout component)
     */
    get isUtil(): boolean {
        return !!this.util
    }

    /**
     * Finds the first child component (aka 'element') of the given tag within the scope of this component
     * @param {string} tag Tag name to find (e.g. 'div')
     * @returns {*} the Element or View found, or undefined if none found
     */
    elementFind(tag:string):any {
        if(this.isMobile) {
            return this.mobileFind(tag)[0]
        } else {
            return this.stdComp.$(tag)
        }
    }

    /**
     * Returns an array of all child components, possibly nested, of teh given tag found within the scope of this component
     * @param {string} tag Tag name to find (e.g. 'div')
     * @returns {*[]} an array of the Elements or Views found, or undefined if none found
     */
    elementFindAll(tag:string):any[] {
        if(this.isMobile) {
            return this.mobileFind(tag)
        } else {
            return this.stdComp.$$(tag)
        }
    }

    // Local function for mobile to find children
    private mobileFind(tag:string):any[] {
        const found:any[] = []
        const parts = tag.split('.')
        let name = pascalCase(parts[0]) // to match primary class name as assigned by ComponentBase
        const className = parts[1]
        if(this.isMobile) {
            const childFinder = (parent:any) => {
                let count = (parent.getChildrenCount && parent.getChildrenCount()) || 0
                for(let i=0; i<count; i++) {
                    const child = parent.getChildAt(i)
                    const kname = child.className
                    let hit = (kname === name) // pascal case compare
                    if(name) {
                        name = name.toLowerCase() // we'll do ci compares now
                        let tn = (child.tagName || '').toLowerCase()
                        hit = hit || (tn === name)
                        hit = hit || !!(kname && kname.toLowerCase().indexOf(name) === 0)
                    }
                    hit = hit || !!(kname && className && kname.indexOf(className) !== -1)
                    if(hit) {
                        // console.log('found ', child)
                        found.push(child)
                    }
                    if (child.getChildrenCount && child.getChildrenCount()) childFinder(child)
                }
            }
            // console.log('for reference, component is ', this.stdComp.component)
            // console.log('starting find at ', this.stdComp)
            childFinder(this.stdComp)
        }
        return found
    }

    /**
     * Get a value of a property set in the component markup
     * @param propName
     */
    getProp(propName:string) {
        if(this.isMobile) {
            const comp = this.stdComp.component
            return comp.get(propName)
        } else {
            const props = this.stdComp.state || this.stdComp.bound || {} // note reference to 'bound' should be obsolete
            return props[propName]
        }
    }

    // use to attach only one listener per event type/purpose per component, since we can't remove them
    registerHandler(comp:any, purpose:string, action:string, func:any) {
        const session = getSessionData(comp)
        if(session[action] !== func) {
            session[action] = func
            comp.addEventListener(action, func)
        }
    }
    // do this a little different for mobile at this point:
    // send in both the handler and the callback.
    // The handler will process and normalize before calling the callback at the app level
    registerMobileHandler(comp:any, action:string, handler:any, callback:any) {
        const session = getSessionData(comp)
        if(session[action] !== callback) {
            session[action] = callback
            console.log('registering '+action+' handler '+handler.constructor.name ||'(anon)'+' => '+callback.constructor.name || '(anon)')
            comp.on(action, handler)
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
    listenToFor(el:any, pseudoEventTag:string, func:(ed:any)=>{}) {
        if(this.isMobile) {
            const mappedEvents = {
                'touch': {action:'touch'},
                    'up': {aka: 'touch'},
                    'down': {aka: 'touch'},
                    'mouseup': {aka: 'touch'},
                    'mousedown': {aka: 'touch'},

                'press': {action:'tap'},
                    'tap': {aka:'press'},
                    'click': {aka: 'press'},

                'dblpress' : {action: 'doubletap'},
                    'dblclick' : {aka: 'dblpress'},
                    'dbltap' : {aka: 'dblpress'},

                'swipe' : {action: 'swipe'},
                    'swipeleft' : {aka:'swipe'},
                    'swiperight' : {aka:'swipe'},
                    'swipeup' : {aka:'swipe'},
                    'swipedown' : {aka:'swipe'},

                'longpress' : {action: 'longpress'},

                'pan' : {action: 'pan'},
                    'drag': {aka: 'pan'},

                'rotation': {action: 'rotation'},
                    'rotate': {aka: 'rotation'},

                'pinch' : {action: 'pinch'}
            }
            const actionHandlers:any = {
                touch: mobileTouchHandler,
                tap: mobileTapHandler,
                doubletap: mobileDoubleTapHandler,
                longpress: mobileLongPressHandler,
                swipe: mobileSwipeHandler,
                pan: mobilePanHandler,
                rotation: mobileRotationHandler,
                pinch:mobilePinchHandler
            }

            // @ts-ignore
            let h = mappedEvents[pseudoEventTag]
            if(h) {
                // @ts-ignore
                if(h.aka) h = mappedEvents[h.aka]
                let handler = actionHandlers[h.action]
                if(handler) {
                    this.registerMobileHandler(el, h.action, handler, func)
                }
            }

        } else {
            const mappedEvents = {
                'touch' : {handler: handleTouch},
                    'mousedown': {action: 'mousedown'},
                    'down': {aka: 'mousedown'},
                    'mouseup': {action: 'mouseup'},
                    'up': {aka: 'mouseup'},
                'press': {action:'click'},
                    'tap': {aka:'press'},
                    'click': {aka: 'press'},
                'dblpress' : {action: 'dblclick'},
                    'dblclick' : {aka: 'dblpress'},
                    'dbltap' : {aka: 'dblpress'},
                'swipe' : {handler: handleSwipe},
                    'swipeleft' : {handler:handleSwipe, mode: 'left'},
                    'swiperight' : {handler:handleSwipe, mode: 'right'},
                    'swipeup' : {handler:handleSwipe, mode: 'up'},
                    'swipedown' : {handler:handleSwipe, mode: 'down'},
                'longpress' : {handler:handleLongPress},
                'pan' : {handler:handlePan},
                    'drag': {aka: 'pan'},
                'rotation': {handler:handleRotation},
                    'rotate': {aka: 'rotation'},
                'pinch' : {handler:handlePinch}
            }
            // @ts-ignore
            let h = mappedEvents[pseudoEventTag]
            if(h) {
                // @ts-ignore
                if(h.aka) h = mappedEvents[h.aka]
                let {action, handler} = h
                if(action) {
                    // const lhndlr = (ev:any) => {
                    //     // console.log('dom handler for ' + action + ' triggered', ev)
                    // }
                    this.registerHandler(el, pseudoEventTag, action, func)

                } else if(handler) {
                    handler(el, h.mode, func, this)
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
    getElementBounds(element:any) {
        const cbounds = new Bounds()
        if(this.isMobile) {
            const loc = element.getLocationInWindow()
            const size = element.getActualSize()
            cbounds.x = loc.x
            cbounds.y = loc.y
            cbounds.width = size.width
            cbounds.height = size.height
        } else {
            const dbounds = element.getBoundingClientRect()
            cbounds.x = dbounds.x
            cbounds.y = dbounds.y
            cbounds.width = dbounds.width
            cbounds.height = dbounds.height
        }
        return cbounds
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
    setStyleProp(el:any, prop:string, value:number|string, unit?:string) {
        if(this.isMobile) {
            const emSize = 15; // consistent with CLI definition

            // Same translation used at CLI (migrateScss)
            let v = Number(value)
            if (unit === 'px') unit = ''
            else if (unit === 'em' || unit === 'rem') {
                v *= emSize
                unit = ''
            } else if (unit === 'in') {
                v *= 96 // pixels per inch per CSS
                unit = ''
            } else if (unit === 'pt') {
                v *= 96 / 72 // one point is 1/72 inch
                unit = ''
            } else if (unit === 'pc') {
                // pica is 12 points
                v *= 12 * 96 / 72
                unit = ''
            } else if (unit === 'cm') {
                // cm to inch to pixel
                v *= 0.39370079 * 96
                unit = ''
            } else if (unit === 'mm') {
                // mm to inch to pixel
                v *= 0.039370079 * 96
                unit = ''
            }
            if(!unit) unit = ''
            let sv
            if(isFinite(v)) {
                sv = v+unit
            } else {
                sv = value
            }
            el.set(prop, sv)
        } else {
            el.style[prop] = value+(unit || '')
        }
    }

    addClass(className:string|string[]) {
        if(!Array.isArray(className)) {
            className = [className]
        }
        if(this.isMobile) {
            let classes = (this.stdComp.component.get('className') || '').split(' ')
            for(let i=0; i< classes.length; i++) {
                className.push(classes[i])
            }
            classes = []
            for(let name of className) {
                classes.push(name)
            }
            this.stdComp.component.className = classes.join(' ')
        } else {
             const el = this.stdComp.riot.root
            for(let name of className) {
                el.classList.add(name)
            }
        }
    }
    removeClass(className:string|string[]) {
        if(!Array.isArray(className)) {
            className = [className]
        }
        if(this.isMobile) {
            let classes = (this.stdComp.component.get('className') || '').split(' ')
            for(let i=0; i< classes.length; i++) {
                if(className.indexOf(classes[i]) === -1) {
                    className.push(classes[i])
                }
            }
            this.stdComp.component.className = classes.join(' ')
        } else {
            const el = this.stdComp.riot.root
            for(let name of className) {
                el.classList.add(name)
            }
        }
    }
}

// -- DOM event gesture handling
function handleTouch(comp:any, mode:string, cb:any, cn:ComNormal) {
    let session:any = getSessionData(comp)
    const callback = (ev:MouseEvent, mode:string) => {
        const ed = new EventData()
        ed.tag = 'action'
        ed.value = {
            mode,
            clientX: ev.clientX,
            clientY: ev.clientY
        }
        ed.eventType = 'mouse'+mode
        ed.app = cn.stdComp.cm.getApp()
        ed.platEvent = ev
        ed.sourceComponent = cn.stdComp.cm.getComponent(comp)
        cb(ed)
    }
    const hdlDown = (ev:any) => {
        callback(ev, 'down')
    }
    const hdlUp = (ev:any) => {
        callback(ev, 'up')
    }
    cn.registerHandler(comp, 'touch', 'mousedown', hdlDown)
    cn.registerHandler(comp, 'touch', 'mouseup', hdlUp)

}

function handleSwipe(comp:any, mode:string, cb:any, cn:ComNormal) {
    const callback = (ev:any) => {
        const ed = new EventData()
        ed.tag = 'action'
        ed.value = mode
        ed.eventType = 'swipe'
        ed.app = cn.stdComp.cm.getApp()
        ed.platEvent = ev
        ed.sourceComponent = cn.stdComp.cm.getComponent(comp)
        cb(ed)
    }
    const hdlMove = (ev:MouseEvent) => {
        if(ev.buttons) {
            const threshold = 50
            let mx = ev.movementX
            let my = ev.movementY

            if(!mode) {
                if(mx > threshold) mode = 'right'
                else if(mx < -threshold) mode = 'left'
                else if(my > threshold) mode = 'down'
                else if(my < -threshold) mode = 'up'
            }
            if(mode === 'left' && mx < -threshold) {
                callback(ev)
            } else if(mode === 'right' && mx > threshold) {
                callback(ev)
            } else if(mode === 'up' && my < -threshold) {
                callback(ev)
            } else if(mode === 'down' && my > threshold) {
                callback(ev)
            }
        }
    }
    cn.registerHandler(comp,'swipe', 'mousemove', hdlMove)
}
function handleLongPress(comp:any, mode:string, cb:any, cn:ComNormal) {
    let session:any = getSessionData(comp)
    const longPressInterval = 750
    const hdlDown = (ev:MouseEvent) => {
        clearTimeout(session.timerId)
        session.timerId = setTimeout(() => {
            const ed = new EventData()
            ed.tag = 'action'
            ed.value = longPressInterval
            ed.eventType = 'longpress'
            ed.app = cn.stdComp.cm.getApp()
            ed.platEvent = ev
            ed.sourceComponent = cn.stdComp.cm.getComponent(comp)
            cb(ed)
        }, longPressInterval)
    }
    const hdlUp = () => {
        clearTimeout(session.timerId)
    }
    cn.registerHandler(comp, 'longpress', 'mousedown', hdlDown)
    cn.registerHandler(comp, 'longpress', 'mouseup', hdlUp)
    cn.registerHandler(comp, 'longpress', 'mouseout', hdlUp)

}
function handlePan(comp:any, mode:string, cb:any, cn:ComNormal) {
    let session:any = getSessionData(comp)
    const callback = (ev:MouseEvent, type:string) => {
        let ed = new EventData()
        let mx = ev.movementX || 0
        let my = ev.movementY || 0
        session.x += mx;
        session.y += my;
        let tmx = session.x - session.startx
        let tmy = session.y - session.starty
        let clientX = ev.clientX
        let clientY = ev.clientY
        if(type === 'start') {
            tmx = session.x
            tmy = session.y
            session.startx = session.starty = 0;
        }
        else if(mx || my) { // only report actual movement
            ed.app = cn.stdComp.cm.getApp()
            ed.sourceComponent = cn.stdComp.cm.getComponent(comp)
            ed.tag = 'action'
            ed.eventType = 'pan'
            ed.platEvent = ev
            // ed.value = {type, mx, my, tmx, tmy, clientX, clientY}
            // align with mobile version
            ed.value = {
                mx:tmx,
                my:tmy
            }
            cb(ed)
        }
    }
    const hdlDown = (ev:MouseEvent) => {
        session.active = true
        let {offX, offY} = computeDOMOffsets(ev.currentTarget as HTMLElement)
        session.startx = session.x = ev.clientX - offX
        session.starty = session.y = ev.clientY - offY
        callback(ev, 'start');
    }
    const hdlUp =  () => {
        session.active = false
    }
    const hdlMove = (ev:MouseEvent) => {
        if (session.active) {
            if (ev.buttons) {
                callback(ev, 'drag')
            } else {
                session.active = session.started = false
            }
        }
    }
    cn.registerHandler(comp, 'pan', 'mousedown', hdlDown)
    cn.registerHandler(comp, 'pan', 'mouseup', hdlUp)
    cn.registerHandler(comp, 'pan', 'mousemove', hdlMove)
}
function handleRotation(comp:any, mode:string, cb:any, cn:ComNormal) {
    let session:any = getSessionData(comp)
    const hdlDown = (ev:MouseEvent) => {
        if(ev.ctrlKey || ev.metaKey) {
            session.active = true
            session.startx = session.x = ev.clientX
            session.starty = session.y = ev.clientY
        }
    }
    const hdlUp =  () => {
        session.active = false
    }
    const hdlMove = (ev:MouseEvent) => {
        if(ev.buttons && session.active) {
            if(ev.ctrlKey || ev.metaKey) {
                let x = ev.clientX
                let y = ev.clientY
                session.x = x;
                session.y = y;
                // compute the angle between startx,y and x,y
                let angle = Math.atan2(session.y - session.starty, session.x - session.startx);
                let ed = new EventData()
                ed.app = cn.stdComp.cm.getApp()
                ed.sourceComponent = cn.stdComp.cm.getComponent(comp)
                ed.tag = 'action'
                ed.eventType = 'rotate'
                ed.platEvent = ev
                ed.value = angle
                cb(ed)
            }
        } else {
            session.active = false
        }
    }
    cn.registerHandler(comp, 'rotation', 'mousedown', hdlDown)
    cn.registerHandler(comp, 'rotation', 'mouseup', hdlUp)
    cn.registerHandler(comp, 'rotation', 'mousemove', hdlMove)
}
function handlePinch(comp:any, mode:string, cb:any, cn:ComNormal) {
    let session:any = getSessionData(comp)
    const dist = (x1:number,y1:number, x2:number,y2:number) => {
        return Math.sqrt(Math.pow((x2-x1),2)+Math.pow((y2-y1),2));
    }
    const hdlDown = (ev:MouseEvent) => {
        if(ev.altKey) {
            session.active = true
            // get center of component
            let r = comp.getBoundingClientRect()
            session.cx = r.left + r.width/2;
            session.cy = r.top + r.height/2;
            // compute starting distance
            session.startDist = dist(session.cx, session.cy, ev.clientX, ev.clientY)
        }
    }
    const hdlUp =  () => {
        session.active = false
    }
    const hdlMove = (ev:MouseEvent) => {
        if(ev.buttons && session.active) {
            if(ev.altKey) {
                let x = ev.clientX
                let y = ev.clientY
                // compute distance to center
                let newDist = dist(session.cx, session.cy, x, y)
                // scale is ratio of this distance to original distance
                let scale = newDist / session.startDist
                let ed = new EventData()
                ed.app = cn.stdComp.cm.getApp()
                ed.sourceComponent = cn.stdComp.cm.getComponent(comp)
                ed.tag = 'action'
                ed.eventType = 'pinch'
                ed.platEvent = ev
                ed.value = scale
                cb(ed)
            }
        } else {
            session.active = false
        }
    }
    cn.registerHandler(comp, 'pinch', 'mousedown', hdlDown)
    cn.registerHandler(comp, 'pinch', 'mouseup', hdlUp)
    cn.registerHandler(comp, 'pinch', 'mousemove', hdlMove)
}
// -- mobile handler
function mobileHandler(ev:any, cb:any, cn:ComNormal) {
    const ed = new EventData()
    ed.tag = 'action'
    ed.app = cn.stdComp.cm.getApp()
    ed.eventType = (ev.type && ev.type.toString()) || '?type?'
    ed.platEvent = ev
    ed.sourceComponent = ev.view

    // note: consider recoding as a switch statement for better readability..
    // console.log('mobile handler type', ev.type)
    try {
        if (ev.type === 7 /*'touch'*/ || ev.type === 0 /*'tap'*/ || ev.type === 1 /*dtap*/ || ev.type === 6 /*longpress*/) {
            ed.value = {
                clientX: ev.getX(),
                clientY: ev.getY(),
                buttons: 1 // ev.getPointerCount() -- crash
            }
        } else if (ev.type === 4 /*'swipe'*/) {
            ed.value = (ev.direction && ev.direction.toString()) || '?dir?'
        } else if (ev.type === 3 /*'pan'*/) {
            ed.value = {
                mx: ev.deltaX,
                my: ev.deltaY
                // can't do clientX, clientY because we only get the amount of movement since last time.
                // we would need a multi-event handler like the DOM handler has to get clientX,Y and tmx,tmy
                // using a reference point on first touch.
            }

        } else if (ev.type === 5 /*'rotation'*/) {
            ed.value = ev.rotation
        } else if (ev.type === 2 /*'pinch'*/) {
            ed.value = ev.scale
        }
        else {
            return // unrecognized action type ignored
        }
        // callback with the event
        cb(ed)

    } catch(e) {
        console.log(e)
    }

}

// we have to do a multi-event trap to make pan work the way we want
// this is basically the same as the DOM version
// function mobilePanHandler(comp:any, mode:string, cb:any, cn:ComNormal) {
//     let session = getSessionData(comp);
//     const callback = (ev:any, type:string) => {
//         let ed = new EventData();
//         let mx = ev.deltaX - session.x
//         let my = ev.deltaY - session.y
//         let tmx = session.x - session.startx;
//         let tmy = session.y - session.starty;
//         let clientX = session.x
//         let clientY = session.y;
//         if (type === 'start') {
//             mx = 0;
//             my = 0;
//             session.x = clientX = tmx = ev.getX();
//             session.y = clientY = tmy = ev.getY()
//             session.startx = session.starty = 0;
//         }
//         if(mx || my) { // only report movement
//             ed.app = cn.stdComp.cm.getApp();
//             ed.sourceComponent = cn.stdComp.cm.getComponent(comp);
//             ed.tag = 'action';
//             ed.eventType = 'pan';
//             ed.platEvent = ev;
//             ed.value = {type, mx, my, tmx, tmy, clientX, clientY};
//             cb(ed);
//         }
//     };
//     const hdlDown = (ev:any) => {
//         session.active = true;
//         callback(ev, 'start')
//     };
//     const hdlUp = () => {
//         session.active = false;
//     };
//     const hdlTouch = (ev:any) => {
//         if (ev.action === 'down')
//             return hdlDown(ev);
//         else if (ev.action === 'up')
//             return hdlUp();
//         else {
//             session.x = ev.getX();
//             session.y = ev.getY();
//         }
//     };
//     const hdlMove = (ev:any) => {
//         if (session.active) {
//             callback(ev, 'drag')
//         }
//     };
//     cn.registerHandler(comp, 'pan', 'touch', hdlTouch);
//     cn.registerHandler(comp, 'pan', 'pan', hdlMove);
// }

let lastTouchDown:number|undefined

function mobileTouchHandler(ev:any) {
    let comp = ev.view
    let x = ev.getX()
    let y = ev.getY()
    let c = ev.getPointerCount()
    let mode = ev.action
    if(mode === 'down') {
        lastTouchDown = Date.now()
    } else {
        lastTouchDown = undefined
    }
    let session:any = getSessionData(comp);
    let cb = session.touch;
    if(cb && mode !== 'move') {
        let ed = new EventData();
        ed.value = {
            mode,
            clientX: x,
            clientY: y,
            buttons: c
        }
        ed.app = self.stdComp.cm.getApp();
        ed.sourceComponent = self.stdComp.cm.getComponent(comp);
        ed.tag = 'action';
        ed.eventType = 'touch';
        ed.platEvent = ev;
        cb(ed);
    }
}
function mobileTapHandler(ev:any) {
    let comp = ev.view
    let x = ev.getX()
    let y = ev.getY()
    let c = ev.getPointerCount()
    let session:any = getSessionData(comp);
    let cb = session.tap;
    const callback = (ev:any) => {
        let ed = new EventData();
        ed.value = {
            clientX: x,
            clientY: y,
            buttons: c
        }
        ed.app = self.stdComp.cm.getApp();
        ed.sourceComponent = self.stdComp.cm.getComponent(comp);
        ed.tag = 'action';
        ed.eventType = 'press';
        ed.platEvent = ev;
        cb(ed);
    };
    if(cb) callback(ev)
}
function mobileDoubleTapHandler(ev:any) {
    let comp = ev.view
    let session:any = getSessionData(comp);
    let cb = session['doubletap'];
    if(cb) {
        let ed = new EventData();
        ed.app = self.stdComp.cm.getApp();
        ed.sourceComponent = self.stdComp.cm.getComponent(comp);
        ed.tag = 'action';
        ed.eventType = 'dblpress';
        ed.platEvent = ev;
        cb(ed);
    }
}
function mobileLongPressHandler(ev:any) {
    let comp = ev.view
    let session:any = getSessionData(comp)
    let cb = session.longpress
    const longPressInterval = lastTouchDown && (Date.now() - lastTouchDown)
    if(cb) {
        let ed = new EventData();
        ed.value = longPressInterval
        ed.app = self.stdComp.cm.getApp();
        ed.sourceComponent = self.stdComp.cm.getComponent(comp);
        ed.tag = 'action';
        ed.eventType = 'dblpress';
        ed.platEvent = ev;
        cb(ed);
    }

}
function mobileSwipeHandler(ev:any) {
    let comp = ev.view
    let session:any = getSessionData(comp)
    let cb = session.swipe
    if(cb) {
        const ed = new EventData()
        ed.tag = 'action'
        ed.value = (<any>{1:'right', 2:'left', 4:'up', 8:'down'})[ev.direction]
        ed.eventType = 'swipe'
        ed.app = self.stdComp.cm.getApp()
        ed.platEvent = ev
        ed.sourceComponent = self.stdComp.cm.getComponent(comp)
        cb(ed)
    }
}
function mobilePinchHandler(ev:any) {
    let comp = ev.view
    let session:any = getSessionData(comp)
    let cb = session.pinch
    const ed = new EventData()
    ed.tag = 'action'
    ed.value = ev.scale
    ed.eventType = 'pinch'
    ed.app = self.stdComp.cm.getApp()
    ed.platEvent = ev
    ed.sourceComponent = self.stdComp.cm.getComponent(comp)
    if(cb) cb(ed)
}
function mobileRotationHandler(ev:any) {
    let comp = ev.view
    let session:any = getSessionData(comp)
    let cb = session.rotation
    const ed = new EventData()
    ed.tag = 'action'
    ed.value = ev.rotation
    ed.eventType = 'rotation'
    ed.app = self.stdComp.cm.getApp()
    ed.platEvent = ev
    ed.sourceComponent = self.stdComp.cm.getComponent(comp)
    if(cb) cb(ed)
}
function mobilePanHandler(ev:any) {
    let comp = ev.view
    let mx = ev.deltaX
    let my = ev.deltaY
    let session:any = getSessionData(comp)
    let cb = session.pan
    const ed = new EventData()
    ed.tag = 'action'
    ed.value = {mx, my}
    ed.eventType = 'pan'
    ed.app = self.stdComp.cm.getApp()
    ed.platEvent = ev
    ed.sourceComponent = self.stdComp.cm.getComponent(comp)
    if(cb) cb(ed)
}


/**
 * Use to get the anchor point of a DOM element
 * so we can consistently keep values relative
 * @param el
 */
function computeDOMOffsets(el:HTMLElement | null) {
    let offX = 0;
    let offY = 0;
    let curEl:HTMLElement | null = el
    while(curEl) {
        offX += curEl.offsetLeft
        offY += curEl.offsetTop
        curEl = (curEl.offsetParent as HTMLElement)
    }
    return {offX, offY}
}


function pascalCase(name:string) {
    let out = ''
    name.split('-').forEach(p => {
        out += p.charAt(0).toUpperCase()+p.substring(1).toLowerCase()
    })
    return out
}
function camelCase(name:string) {
    let pc = pascalCase(name)
    return pc.charAt(0).toLowerCase()+pc.substring(1)
}
