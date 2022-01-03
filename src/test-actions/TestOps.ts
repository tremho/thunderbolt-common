import {AppCore} from "../app-core/AppCore";
import { EventData } from "../app-core/EventData";
import {timeoutBox} from "../../../thunderbolt-desktop/src/API/DialogAPI";

let app:AppCore

let componentMap:any = {}

/**
 * Called on app start by app-core to establish our app context
 * @param appIn
 */
export function initModule(appIn:AppCore) {
    app = appIn
    componentMap = {}
}

/**
 * Reads the value in the app model at the given model path
 * @param modelPath
 */
export function readModelValue(modelPath:string) {
    let rt = app.model.getAtPath(modelPath)
    // console.log('>> model as read', rt)
    return rt
}

/**
 * Sets a value in the model at the given model path
 * @param modelPath
 * @param value
 */
export async function setModelValue(modelPath:string, value:any) {
    app.model.setAtPath(modelPath, value)
}

/**
 * Selects a component on the page via a selector and assigns it to a name we can reference later
 *
 * @param name Name to assign to the component
 * @param tagName tag name of the component (e.g. simple-label)
 * @param [prop] optional name of a property to check on this component
 * @param [propValue] optional if prop given, this is the value to match
 *
 * @return true if was component was found and assigned to name
 */
export async function assignComponent(name:string, tagName:string, prop?:string, propValue?:string) {
    const comp = app.findComponent(tagName, prop, propValue)
    componentMap[name] = comp

    return comp ? true : false
}

/**
 * Reads the value of a property of the named component
 *
 * @param componentName
 * @param propName
 */
export async function readComponentProperty(componentName:string, propName:string) {

    const comp = componentMap[componentName]
    // console.log('>> TestOp: readComponentProperty ', componentName, propName, comp)
    const resp = comp && comp.com.getComponentAttribute(comp, propName)
    // console.log('returning', resp)
    return resp
}

/**
 * Sets the  property of a named component to the given value
 *
 * @param componentName
 * @param propName
 * @param propValue
 */
export async function setComponentProperty(componentName:string, propName:string, propValue:string) {
    const comp = componentMap[componentName]
    if(comp) {
        // TODO: Create setComponentAttribute in ComCommon
        // comp.com.setComponentAttribute(comp, propName, propValue)
    }

}

/**
 * Triggers the named action on the named component.
 * this effectively simulates an event call to the function named in the 'action' property
 * @param componentName Assigned component name
 * @param [action] optional action property name, defaults to 'action'
 *
 * @Returns true if action function was called
 */
export async function triggerAction(componentName:string, action:string) {
    action = 'action' // TODO: sanity force
    // console.log('> triggerAction', componentName, action)
    const comp = componentMap[componentName]
    if (comp) {
        const fname = comp.com.getComponentAttribute(comp, action)
        if(fname) {
            // console.log('  fname', fname)
            const ev: EventData = new EventData()

            // TODO: Problem -- ev.app must be set, but this is a circular object that can't pass, so is sourceComponent.
            // My planned solution: use keywords for '$$APP$$', etc and swap these in callFunction pconv.

            ev.app = "$$APP$$"
            ev.sourceComponent = '$$TESTCOMP$$ '+componentName
            ev.tag = action
            ev.eventType = 'test'
            // console.log(' constructed event', ev)
            const strev = JSON.stringify(ev)

            callPageFunction(fname, [strev])
            return true
        } else {
            console.warn(`action ${action} does not resolve to a function name`)
        }
    } else {
        console.warn(`component ${componentName} not assigned`)
    }
    return false
}

/**
 * Navigate to the given page, optionally passing a context object
 * @param pageName
 * @param context
 */
export async function goToPage(pageName:string, context?:any) {
    app.navigateToPage(pageName, context)
}

/**
 * Call a function of a given name on the current page, passing optional parameters
 * @param funcName  Name of exported function found on current page logic
 * @param [parameters]  Array of optional parameters to pass (objects and arrays must be serialized JSON)
 *
 * TODO: Convert keyword objects (
 *
 */
export async function callPageFunction(funcName:string, parameters:string[] = []) {
    // console.log('callPageFunction', funcName, parameters)
    const pconv:any = []
    for(let p of parameters) {
        if(typeof p === 'string' && (p.charAt(0) === '{' || p.charAt(0) === '[') ) {
            const obj = JSON.parse(p)
            for(let p of Object.getOwnPropertyNames(obj)) {
                let v = obj[p]
                if(v.charAt(0) === '$') {
                    let n = v.lastIndexOf('$')
                    let k = v.substring(0, n + 1)
                    if (k === '$$APP$$') {
                        obj[p] = app
                    } else if (k === '$$TESTCOMP$$') {
                        let cname = p.substring(n + 1)
                        obj[p] = componentMap[cname]
                    }
                }
            }
            pconv.push(obj)
        } else {
            if(p.charAt(0) === '$') {
                let n = p.lastIndexOf('$')
                let k = p.substring(0, n+1)
                if(k === '$$APP$$$') {
                    pconv.push(app)
                } else if(k === '$$TESTCOMP$$') {
                    let cname = p.substring(n+1)
                    pconv.push(componentMap[cname])
                }
            } else {
                pconv.push(p)
            }
        }
    }
    const activity = app.currentActivity
    if(activity) {
        if(typeof activity[funcName] === 'function') {
            // console.log('calling ', funcName, pconv)
            return activity[funcName](...pconv)
        }
    } else {
        console.warn('no activity found')
    }
}

export async function askAHuman(prompt:string, choices:string = 'Okay') {
    console.log('>>>> askAHuman', prompt, choices)
    const ca = choices.split(',')
    prompt= prompt.trim().replace(/%plus%/g, '+').replace(/\+/g, ' ')

    const options = {
        title: `Test Action`,
        message: `${prompt}\n`,
        detail: `follow the instructions and respond\n`,
        buttons: ca
    }
    console.log('>>>> askAHuman options', options)
    let resp = await app.timeoutBox(options)
    let rstr = ca[resp as number]
    console.log('>>>> resp', resp, rstr)
    console.log('askAHuman returns', rstr)
    return rstr
}


// perform a menu action
// perform a tool action
//
// take + record screenshot

function compView(el:HTMLElement) {
    let comp:any = {}

    try {

        if(el.getAttribute) {
            comp.automationText = el.getAttribute('automationText') || ''
            comp.textProp = el.getAttribute('text') || ''
        }
        let t:Node = findTextNode(el)
        if(t) comp.textDisp = t.nodeValue
        comp.className = el.className
        comp.tagName = el.tagName
        let bounds = el.getBoundingClientRect()
        comp.bounds = {
            top: bounds.top,
            left: bounds.left,
            width: bounds.width,
            height: bounds.height,
            z: Number(el.style.zIndex || 0) || 1
        }
    } catch(e) {
        console.error(e)
    }

    comp.children = []
    let ch:Element|null = el.firstElementChild
    while(ch) {
        comp.children.push(compView(ch as HTMLElement))
        ch = ch.nextElementSibling
    }
    return comp
}

function findTextNode(el:HTMLElement) {
    let c = el.firstChild
    while(c) {
        if(c.nodeType === Node.TEXT_NODE) {
            return c
        }
        let d:any = findTextNode(c as HTMLElement)
        if(d) return d;
        c = c.nextSibling
    }
}


export async function tree(componentName:string) {
    // console.log('in Desktop tree iterator with name', componentName)
    let tree:any = {}

    let comp:any;
    if(componentName) {
        comp = componentMap[componentName]
        // console.log('looking for component', componentName, 'found', comp)
        comp = comp?.root
    }

    let win:Window|undefined;
    if(typeof window !== undefined) win = window
    // console.log('we have a window? ', !!win && !!win.document)
    let page:any;
    if(win) {
        const boundTag: HTMLElement|null = win.document.body.querySelector('[is="app"]')
        // console.log('boundTag', boundTag)
        if(boundTag) {
            page = boundTag.firstElementChild?.firstElementChild
            // console.log('page', page)
            // this is the current page.  we may need to iterate siblings to find visible, but I think this is the only one
            // we will find realized to the DOM
            tree.pageId = page.tagName
            if(comp) tree.compId = comp.tagName
            else comp = page;

            tree.content = compView(comp)
        }
    }
    console.log('tree', tree)
    return tree
}
