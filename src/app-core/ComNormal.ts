
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
                        if(!hit && name.charAt(0) == '#') {
                            hit = (child.id || '').toLowerCase() == name.substring(1).toLowerCase()
                        }
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
        propName = camelCase(propName).toLowerCase()
        if(this.isMobile) {
            const comp = this.stdComp.component
            return comp.get(propName)
        } else {
            const props = this.stdComp.props ?? {}
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
            // console.log('registering '+action+' handler '+handler.constructor.name ||'(anon)'+' => '+callback.constructor.name || '(anon)')
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

                'longpress' : {action: 'longtap'},

                'pan' : {action: 'pan'},
                    'drag': {aka: 'pan'},

                'rotation': {action: 'rotation'},
                    'rotate': {aka: 'rotation'},

                'pinch' : {action: 'pinch'}
            }
            const actionHandlers:any = {
                touch: mobileTouchDiscriminator,
                tap: mobileTouchDiscriminator,
                doubletap: mobileTouchDiscriminator,
                longtap: mobileTouchDiscriminator,
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
            if (el) el.style[prop] = value+(unit || '')
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
            type:mode,
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
            let clientX = ev.clientX
            let clientY = ev.clientY
            ed.value = {
                interval: longPressInterval,
                clientX,
                clientY
            }
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
        ed.sourceComponent = cn.stdComp.cm.getComponent(comp)
        ed.platEvent = ev
        let mx = ev.movementX || 0
        let my = ev.movementY || 0
        session.x += mx;
        session.y += my;
        let tmx = session.x - session.startx
        let tmy = session.y - session.starty
        let clientX = ev.clientX
        let clientY = ev.clientY
        if(type === 'start') {
            session.startx = session.starty = 0;
            ed.value = {
                type,
                clientX,
                clientY
            }
        } else if(type === 'end') {
            ed.value = {
                type,
                clientX,
                clientY
            }
        }
        else if(mx || my) { // only report actual movement
            ed.app = cn.stdComp.cm.getApp()
            ed.tag = 'action'
            ed.eventType = 'pan'
            ed.platEvent = ev
            // ed.value = {type, mx, my, tmx, tmy, clientX, clientY}
            // align with mobile version
            ed.value = {
                type,
                mx:tmx,
                my:tmy,
                dx:mx,      // we now include the delta after all
                dy:my
            }
        }
        cb(ed)
    }
    const hdlDown = (ev:MouseEvent) => {
        session.active = true
        let {offX, offY} = computeDOMOffsets(ev.currentTarget as HTMLElement)
        session.startx = session.x = ev.clientX - offX
        session.starty = session.y = ev.clientY - offY
        callback(ev, 'start');
    }
    const hdlUp =  (ev:MouseEvent) => {
        session.active = false
        callback(ev, 'end')
    }
    const hdlMove = (ev:MouseEvent) => {
        if (session.active) {
            if (ev.buttons) {
                callback(ev, 'change')
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

let lastTouchDown:number|undefined
let touchX:any, touchY:any, touchC:any
let onUpCb:any

/**
 * Touch handler for mobile that will analyze the event and
 * and recast it as touch, press, doublepress, or longpress
 * @param ev
 */
function mobileTouchDiscriminator(ev:any) {
    let comp = ev.view
    let session:any = getSessionData(comp);
    let x = ev.getX ? ev.getX() : session.touchX ?? -4361
    let y = ev.getY ? ev.getY() : session.touchY ?? -4361
    if(comp.android) {
        y += 24
    }
    let mode = ev.action

    let ed = new EventData();
    ed.app = self.stdComp.cm.getApp();
    ed.sourceComponent = self.stdComp.cm.getComponent(comp);
    ed.tag = 'action';
    ed.platEvent = ev;

    // TODO: Make these configurable
    const dblTime = 150
    const longTime = 500

    const emitTouch = (type:string) => {
        ed.eventType = 'touch'
        ed.value = {
            type,
            clientX: x,
            clientY: y,
            buttons: ev.getPointerCount ? ev.getPointerCount() : 1
        }
        const cb = session.touch
        if(cb) cb(ed);
    }
    const emitDown = () => {
        return emitTouch('down')
    }
    const emitUp = () => {
        return emitTouch('up')
    }
    const emitDblPress = () => {
        console.log('- emitting double press-')
        ed.eventType = 'dblpress'
        session.isDouble = false
        let cb = session.doubletap
        if(cb) {
            let x = ev.getX ? ev.getX() : session.touchX
            let y = ev.getY ? ev.getY() : session.touchY
            if(comp.ios && ev.getX) {
                x *= 3
                y *= 3
            }
            ed.value = {
                clientX: x,
                clientY: y
            }
            ed.platEvent = ev;
            cb(ed);
        }
    }
    const emitPress = () => {
        console.log('- emitting press-')
        const cb = session.tap
        session.isDouble = false
        if(cb) {
            ed.eventType = 'press'
            ed.value = {
                clientX: x,
                clientY: y,
                buttons: ev.getPointerCount ? ev.getPointerCount() : 1
            }
            cb(ed);
        }
    }
    const emitLongPress = () => {
        console.log('- emitting long press-')
        session.isDouble = false
        ed.eventType = 'longpress'
        session.startTime = 0;
        ed.value = {
            type: 'up',
            clientX: x,
            clientY: y,
            buttons: ev.getPointerCount ? ev.getPointerCount() : 1
        }
        const cb = session.longtap
        if(cb) cb(ed)

    }

    if(mode === 'down') {
        if(!session.isDouble) {
            session.startTime = Date.now()
            session.touchX = x
            session.touchY = y
            setTimeout(() => {
                if(session.isDouble)  emitPress(); // it was a quick single
            }, dblTime*2)
        }
        emitDown()
        session.downCount++
    }

    if(mode === 'up') {
        emitUp()
        session.upCount++
        const elapsed = Date.now() - (session.startTime ?? dblTime)
        console.log('elapsed', elapsed)
        if(elapsed < dblTime) {
            session.isDouble = true
            return
        }
        if(session.isDouble) {
            session.isDouble = false
            return emitDblPress()
        }
        if (elapsed >= longTime) {
            emitLongPress()
        } else {
            emitPress()
        }
    }
}

function mobileSwipeHandler(ev:any) {
    let comp = ev.view || ev.object
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
    let comp = ev.view || ev.object
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
    let comp = ev.view || ev.object
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
    let comp = ev.view || ev.object
    let mx = ev.deltaX
    let my = ev.deltaY
    if(ev.state === 3 && !mx && !my) return // change with no change is not reported

    if(!ev.getX) {
        if(ev.android?.current?.getX) {
            touchX = ev.android.current.getX();
            touchY = ev.android.current.getY();
        }
    }

    let session:any = getSessionData(comp)
    let cb = session.pan
    const ed = new EventData()
    ed.tag = 'action'
    // @ts-ignore
    let type = { 1:'start', 2:'change', 3:'end'}[ev.state]
    let clientX = ev.getX ? ev.getX() : touchX
    let clientY = ev.getY ? ev.getY() : touchY
    if(type === 'end') {
        clientX = ev.getX? ev.getX() : touchX+mx;  // final position on end
        clientY = ev.getY? ev.getY() : touchY+my;
    }
    // we now include the delta after all
    ed.value = (type === 'change') ? {type, mx:touchX+mx, my:touchY+my, dx:mx, dy:my} : {type, clientX, clientY}
    ed.eventType = 'pan'
    ed.app = self.stdComp.cm.getApp()
    ed.platEvent = ev
    ed.sourceComponent = self.stdComp.cm.getComponent(comp)
    if(cb) cb(ed)
    if(type === 'start') {
        // register a callback for when we get a touch 'up' event
        onUpCb = (clientX:number, clientY:number) => {
            // use this to single pan end
            const ed = new EventData()
            ed.tag = 'action'
            ed.value = {type:'end', clientX, clientY}
            if(cb) cb(ed)
        }
    }

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
