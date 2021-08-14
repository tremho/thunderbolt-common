
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

    /**
     * Create the API implementation handler with reference to the Component that owns it
     * @param stdComp
     */
    constructor(stdComp:any) {
        this.stdComp = stdComp
    }


    /**
     * Checks for an iOS implementation
     * @returns true if we're running on an iOS device
     */
    get isIOS(): boolean {
        return (this.stdComp.component && this.stdComp.component.ios)
    }

    /**
     * Checks for an Android implementation
     * @returns true if we're running on an Android device
     */
    get isAndroid(): boolean {
        return (this.stdComp.component && this.stdComp.component.android)
    }

    /**
     * Checks for a mobile implementation
     * @returns true if running under Nativescript on an Android or iOS device
     */
    get isMobile(): boolean {
        return this.isAndroid || this.isIOS
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
        const name = parts[0]
        const className = parts[1]
        if(this.isMobile) {
            const childFinder = (parent:any) => {
                let count = (parent.getChildrenCount && parent.getChildrenCount()) || 0
                for(let i=0; i<count; i++) {
                    const child = parent.getChildAt(i)
                    console.log('child', child)
                    const kname = child.className
                    let hit = false
                    hit = hit || (child.tagName === name)
                    hit = hit || !!(kname && kname.indexOf(name) === 0)
                    hit = hit || !!(kname && className && kname.indexOf(className) > 0)
                    if(hit) {
                        found.push(child)
                    }
                    if (child.getChildrenCount && child.getChildrenCount()) childFinder(child)
                }
            }
            childFinder(this.stdComp)
        }
        return found
    }

    // use to attach only one listener per event type per component, since we can't remove them
    registerHandler(comp:any, action:string, func:any) {
        const session = getSessionData(comp)
        if(session[action] !== func) {
            session[action] = func
            if(this.isMobile) {
                comp.on(action, func)
            } else {
                comp.addEventListener(action, func)
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
    listenToFor(el:any, pseudoEventTag:string, func:(ed:any)=>{}) {
        if(this.isMobile) {
            const mappedEvents = {
                'down': {action: 'touch', mode: 'down'},
                'mousedown': {aka: 'down'},
                'up': {action: 'touch', mode: 'up'},
                'mouseup': {aka: 'up'},
                'press': {action:'tap'},
                'tap': {aka:'press'},
                'click': {aka: 'press'},
                'dblpress' : {action: 'double tap'},
                'dblclick' : {aka: 'dblpress'},
                'dbltap' : {aka: 'dblpress'},
                'swipeleft' : {action: 'swipe', mode: 'left'},
                'swiperight' : {action: 'swipe', mode: 'right'},
                'swipeup' : {action: 'swipe', mode: 'up'},
                'swipedown' : {action: 'swipe', mode: 'down'},
                'longpress' : {action: 'longpress'},
                'pan' : {action: 'pan'},
                'drag': {aka: 'pan'},
                'rotation': {action: 'rotation'},
                'rotate': {aka: 'rotation'},
                'pinch' : {action: 'pinch'}
            }
            // @ts-ignore
            let h = mappedEvents[pseudoEventTag]
            if(h) {
                // @ts-ignore
                if(h.aka) h = mappedEvents[h.aka]
                let {action} = h
                if(action) {
                    const lhndlr = (ev:any) => {
                        console.log('mobile handler for '+action+' triggered')
                    }
                    this.registerHandler(el, action, lhndlr)
                }
            }

        } else {
            const mappedEvents = {
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
                    const lhndlr = (ev:any) => {
                        console.log('dom handler for ' + action + ' triggered')
                    }
                    this.registerHandler(el, action, lhndlr)

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
}

// -- DOM event gesture handling
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
            if(mode === 'left' && mx < -threshold) {
                // todo: need a canonical form of callback
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
    cn.registerHandler(comp,'mousemove', hdlMove)
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
    cn.registerHandler(comp, 'mousedown', hdlDown)
    cn.registerHandler(comp,'mouseup', hdlUp)
    cn.registerHandler(comp,'mouseout', hdlUp)

}
function handlePan(comp:any, mode:string, cb:any, cn:ComNormal) {
    let session:any = getSessionData(comp)
    const hdlDown = (ev:MouseEvent) => {
        session.active = true
        session.startx = ev.screenX
        session.starty = ev.screenY
    }
    const hdlUp =  () => {
        session.active = false
    }
    const hdlMove = (ev:MouseEvent) => {
        if (session.active) {
            if (ev.buttons) {
                let mx = ev.movementX
                let my = ev.movementY
                let tmx = ev.screenX - session.startx
                let tmy = ev.screenY - session.starty
                let clientX = ev.clientX
                let clientY = ev.clientY
                let ed = new EventData()
                ed.app = cn.stdComp.cm.getApp()
                ed.sourceComponent = cn.stdComp.cm.getComponent(comp)
                ed.tag = 'action'
                ed.eventType = 'pan'
                ed.platEvent = ev
                ed.value = {mx, my, tmx, tmy, clientX, clientY}
                cb(ed)
            } else {
                session.active = session.started = false
            }
        }
    }
    cn.registerHandler(comp, 'mousedown', hdlDown)
    cn.registerHandler(comp, 'mouseup', hdlUp)
    cn.registerHandler(comp, 'mousemove', hdlMove)
}
function handleRotation(comp:any, mode:string, cb:any, cn:ComNormal) {
    let session:any = getSessionData(comp)
    const hdlDown = (ev:MouseEvent) => {
        if(ev.ctrlKey || ev.metaKey) {
            session.active = true
            session.startx = ev.screenX
            session.starty = ev.screenY
        }
    }
    const hdlUp =  () => {
        session.active = false
    }
    const hdlMove = (ev:MouseEvent) => {
        if(ev.buttons && session.active) {
            if(ev.ctrlKey || ev.metaKey) {
                let x = ev.screenX
                let y = ev.screenY
                // compute the angle between startx,y and x,y
                let angle = 0;
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
    cn.registerHandler(comp, 'mousedown', hdlDown)
    cn.registerHandler(comp, 'mouseup', hdlUp)
    cn.registerHandler(comp, 'mousemove', hdlMove)
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
    cn.registerHandler(comp, 'mousedown', hdlDown)
    cn.registerHandler(comp, 'mouseup', hdlUp)
    cn.registerHandler(comp, 'mousemove', hdlMove)
}
