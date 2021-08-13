
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
        if (this.stdComp.component && this.stdComp.component.ios) return true
        return false
    }

    /**
     * Checks for an Android implementation
     * @returns true if we're running on an Android device
     */
    get isAndroid(): boolean {
        if (this.stdComp.component && this.stdComp.component.android) return true
        return false
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
     * @returns {any} the Element or View found, or undefined if none found
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
     * @returns {any[]} an array of the Elements or Views found, or undefined if none found
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
        if(this.isMobile) {
            const childFinder = (parent:any) => {
                if(parent.eachChildView) {
                    parent.eachChildView((child: any) => {
                        if (child.tag === tag) found.push(child)
                        if (child.eachChildView) childFinder(child)
                    })
                }
            }
            childFinder(this.stdComp)
        }
        return found
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
     * @param {string} pseudoEventTag  the type of event to trap
     * @param {any} func the callback function called when the qualified event occurs
     *
     */
    listenFor(pseudoEventTag:string, func:(ed:any)=>{}) {
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
                    this.stdComp.on(action, (ev:any) => {
                        console.log('mobile handler for '+action+' triggered')
                    })
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
                    this.stdComp.on(action, (ev: any) => {
                        console.log('mobile handler for ' + action + ' triggered')
                    })
                } else if(handler) {
                    handler(this.stdComp, h.mode, func)
                }
            }
        }
    }

    /**
     * Gets the dimensions of a subcomponent ('element')
     *
     * @param {any} element  the Element or View to be measured
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
const sessionDataMap:any = {}
function getSessionData(comp:any) {
    if(!sessionDataMap[comp]) {
        sessionDataMap[comp] = {}
    }
    return sessionDataMap[comp]
}
function handleSwipe(comp:any, mode:string, cb:any) {
    comp.on('mousemove', (ev:MouseEvent) => {
        if(ev.buttons) {
            const threshold = 50
            let mx = ev.movementX
            let my = ev.movementY
            if(mode === 'left' && mx < -threshold) {
                // todo: need a canonical form of callback
                cb() // yes, we did a swipe
            } else if(mode === 'right' && mx > threshold) {
                cb() // yes, we did a swipe
            } else if(mode === 'up' && my < -threshold) {
                cb() // yes, we did a swipe
            } else if(mode === 'down' && my > threshold) {
                cb() // yes, we did a swipe
            }
        }
    })
}
function handleLongPress(comp:any, mode:string, cb:any) {
    let session:any = getSessionData(comp)
    const longPressInterval = 750
    comp.on('mousedown', (ev:MouseEvent) => {
        clearTimeout(session.timerId)
        session.timerId = setTimeout(() => {
            cb(); // yes, a long press occurred
        }, longPressInterval)
    })
    comp.on('mouseout', () => {
        clearTimeout(session.timerId)
    })
    comp.on('mouseup', () => {
        clearTimeout(session.timerId)
    })
}
function handlePan(comp:any, mode:string, cb:any) {
    let session:any = getSessionData(comp)
    comp.on('mousedown', (ev:MouseEvent) => {
        session.active = true
        session.startx = ev.screenX
        session.starty = ev.screenY
    })
    comp.on('mouseup', (ev:MouseEvent) => {
        session.active = false
    })
    comp.on('mousemove', (ev:MouseEvent) => {
        if(ev.buttons && session.active) {
            let mx = ev.movementX
            let my = ev.movementY
            let tmx = ev.screenX - session.startx
            let tmy = ev.screenY - session.starty
            let ed = {action:'pan', mx, my, tmx, tmy}
            cb(ed) // todo: canonical return
        } else {
            session.active = false
        }
    })
}
function handleRotation(comp:any, mode:string, cb:any) {
    let session:any = getSessionData(comp)
    comp.on('mousedown', (ev:MouseEvent) => {
        if(ev.ctrlKey || ev.metaKey) {
            session.active = true
            session.startx = ev.screenX
            session.starty = ev.screenY
        }
    })
    comp.on('mouseup', (ev:MouseEvent) => {
        session.active = false
    })
    comp.on('mousemove', (ev:MouseEvent) => {
        if(ev.buttons && session.active) {
            if(ev.ctrlKey || ev.metaKey) {
                let x = ev.screenX
                let y = ev.screenY
                // compute the angle between startx,y and x,y
                let angle = 0;
                let ed = {action: 'rotate', angle}
                cb(ed) // todo: canonical return
            }
        } else {
            session.active = false
        }
    })
}
function handlePinch(comp:any, mode:string, cb:any) {
    let session:any = getSessionData(comp)
    const dist = (x1:number,y1:number, x2:number,y2:number) => {
        return Math.sqrt(Math.pow((x2-x1),2)+Math.pow((y2-y1),2));
    }
    comp.on('mousedown', (ev:MouseEvent) => {
        if(ev.altKey) {
            session.active = true
            // get center of component
            let r = comp.getBoundingClientRect()
            session.cx = r.left + r.width/2;
            session.cy = r.top + r.height/2;
            // compute starting distance
            session.startDist = dist(session.cx, session.cy, ev.clientX, ev.clientY)
        }
    })
    comp.on('mouseup', (ev:MouseEvent) => {
        session.active = false
    })
    comp.on('mousemove', (ev:MouseEvent) => {
        if(ev.buttons && session.active) {
            if(ev.altKey) {
                let x = ev.clientX
                let y = ev.clientY
                // compute distance to center
                let newDist = dist(session.cx, session.cy, x, y)
                // scale is ratio of this distance to original distance
                let scale = newDist / session.startDist
                let ed = {action: 'pinch', scale}
                cb(ed) // todo: canonical return
            }
        } else {
            session.active = false
        }
    })
}
