
import {environment, check} from './EnvCheck'

import {ComBinder} from './ComBinder'
import {AppCore, getTheApp} from "./AppCore";
import {AppModel} from "./AppModel";

let View = class {}
let Observable = class {}

export type LocalBind = [any, string, string]

let NotCommon
if(check.mobile) {
    NotCommon = class {
        protected readonly rootComponent:any // View
        constructor(arg:any) {
            this.rootComponent = arg;
        }
    }
    try {
        View = require('@nativescript/core').View
        Observable = require('@nativescript/core').Observable
    } catch(e) {}
} else {
    NotCommon = class {
        protected readonly riot:any
        constructor(arg:any) {
            this.riot = arg;
        }
    }
}

export class ComCommon extends NotCommon{
    private readonly fits:string[]
    private fitNum:number
    private comBinder:ComBinder
    private readonly _app:AppCore
    private readonly _model:AppModel
    private bound:object|undefined

    constructor(arg:any)
    {
        super(arg)
        arg.b = this.evalBinding
        this.fits = []
        this.fitNum = 0;
        this._app = this.getApp()
        this._model = this._app.model;
        this.comBinder = new ComBinder(this.model)
    }

    get app():AppCore {
        return this.getApp()
    }

    get model():AppModel {
        return this._model;
    }

    // -------------------------------------------------------------------------------------------------------
    /**
     * return the instance of the Presentation class that has been exposed as a property in the app root
     * (in other words, the app of the Page)
     * @returns {AppCore}
     */
    getApp():AppCore
    {
        if(check.mobile) {
            return getTheApp()
        } else if(check.riot) {
            const boundTag: HTMLElement|null = document.body.querySelector('[is="app"]')
            if (!boundTag) {
                throw Error('riot app not bound to page')
            }
            const rootComp = this.getComponent(boundTag)
            return rootComp.props.app;
        } else {
            throw Error('Invalid configuration: Not Mobile and not Riot')
        }
    }

    getCombinder(): ComBinder {
        return this.comBinder
    }

    /**
     * Call to wait for model to be ready before binding
     */
    public waitForModel() {
        return this.getApp().waitForModel()
    }

    /**
     * Call to announce the component is created and bound to model
     */
    public componentIsReady() {
        return this.getApp().componentIsReady()
    }

    public addProperty(name:string, value:any) {
        try {
            // @ts-ignore
            if(this.riot) {
                // @ts-ignore
                let props = Object.assign({}, this.riot.props || {})
                Object.defineProperty(props, name, {value})
                // @ts-ignore
                Object.defineProperty(this.riot, "props", {value: props})
            } else {
                // @ts-ignore
                this.rootComponent.set(name, value)
            }
        } catch(e) {
            console.error(e)
        }
    }

    public evalBinding(name:string) {
        const segs = name.split('.')
        let v = this.bound || {}
        let seg
        while(seg = segs.shift()) {
            // @ts-ignore
            v = v[seg]
            if(typeof v !== 'object') break
        }
        return v
    }
    /**
     * gets the Riot Component instance that the given DOM element belongs to
     *
     * @param {HTMLElement} el
     * @returns Riot component
     */
    getComponent(arg:any):any {
        if(check.mobile) return arg; // returns ourselves: TODO: a more refined version would look at parents to find something from ComponentBase

        let el = (arg as HTMLElement|null)
        // @ts-ignore
        if(!el) el = this.riot.root
        try {
            let syms;
            do {
                if(el) {
                    syms = Object.getOwnPropertySymbols(el)
                    if (syms.length === 0) {
                        el = el.parentElement
                    }
                } else {
                    return null;
                }
            } while (syms && syms.length === 0)

            // @ts-ignore
            return el[syms[0]]
        } catch(e) {
            console.warn(e)
            return null;
        }
    }

    /**
     * Returns the component that is the optionally named ancestor of the given component
     * @param {*} comp - component that is child of parent sought
     * @param {string} [tag]  - optional tag to find in ancestry tree, or immediate parent if not given.
     * @returns {*} riot-component
     */
    getComponentParent(comp:any, tag?:string):any {
        if(!comp) return null;
        if(check.riot) {
            tag = (tag && tag.toUpperCase())
            while (comp) {
                comp = this.getComponent(comp.root.parentElement)
                if (!tag || comp.root.tagName === tag) {
                    return comp;
                }
            }
        } else {
            if(check.mobile) {
                // @ts-ignore
                if(!comp) comp = this.rootComponent
                const view = (comp as any) // View
                return (view && view.parent)
            }
        }
        return null; // not found.
    }

    /**
     * returns the component that is the child of the given component of the given tag,
     * optionally the given ordinal occurrence.
     * @param {*} comp - component that has the child we seek
     * @param {string} tag - tag name of child, or other selector string (e.g. '#child-id')
     * @param ordinal - optional  ordinal (starting with 1) to choose if there are multiple children with this tag
     * @returns {*} riot-component
     */
    getComponentChild(comp:any, tag:string = '', ordinal:number = 1) {
        if(check.mobile) {
            throw Error('Not Implemented: ComCommon.getComponentChild')
        }
        const results = comp.$$(tag)
        const pick = ordinal - 1
        return this.getComponent(results[pick])
    }

    /**
     * Find the child component that owns the given element
     * @param {*} containingComp - component that we are searching within
     * @param {HTMLElement} element - element we are searching for
     * @returns {number} the index of the child in the parent, or -1 if not found
     */
    findChildIndexWithElement(containingComp:any, element:HTMLElement):number {
        if(check.mobile) {
            throw Error('Not Implemented: ComCommon.findChildIndexWithElement')
        }
        let p = containingComp.root
        while(p.firstElementChild.tagName === 'DIV') {
            p = p.firstElementChild;
        }
        let children = p.children
        let index = -1;
        for (let i=0; i<children.length; i++) {
            if(children[i] === element) {
                index = i
                break;
            }
        }
        return index

    }


    /**
     * return the DOM element of the <div> container that all of our Riot components consist of
     * as their container.
     * @param {*} [riot] // if not passed, uses the one that created this class
     * @returns {HTMLElement}
     */
    getContainer(riot?:any):HTMLElement
    {
        if(check.mobile) {
            throw Error('Not Implemented: ComCommon.getContainer')
        }
        // @ts-ignore
        if(!riot) riot = this.riot;
        return riot.root.firstElementChild
    }

    /**
     * Returns the value of an attribute in the component markup.
     * @param component
     * @param attName
     * @return {*|string}
     */
    getComponentAttribute(component:any, attName:string):string {
        if(check.riot) {
            // prefer the 'div' attribute, but use the root if nothing in the div
            let el = this.getContainer(component)
            if(!el) el = component.root
            let value =  el && el.getAttribute(attName)
            if(value) return value;
            return component.props && component.props[attName]
        } else {
            // @ts-ignore
            if(!component) component = this.rootComponent
            const view = (component as any) // view
            let attVal = view && view.get(attName)
            if(typeof attVal !== 'string') return ''
            return attVal
        }
    }

    // -------------------------------------------------------------------------------------------------------

    /**
     * parses the *'fit' property* into width/height sizes and applies them
     * (the *'orientation' property* (horizontal/vertical) determines whether the values are applied to children width
     * or height.
     *
     * `fit` is a series of expressions (separated by spaces) describing the sizing to apply to
     * the children, in order.  If there are more children than expressions, the last expression used is used for all
     * subsequent children.
     * Format is <n><unit> where <n> is number and <unit> is the CSS unit to apply.
     * example expressions:  100px  30%  12em
     *
     *
     * #### Special unit values:
     *
     * - "*" == one fractional amount (number of children divided evenly)
     * - "**" == use natural size of child element (equivalent to "100%")
     *
     * example: `"* 2* 3* *"` in a 5 item list
     *
     * would translate to the equivalent of (20% 40% 60% 20% 20%) among the 5 items (although computed px values rather
     * than % notation is applied)
     *
     * @param {object} props the Riot props object that holds the component properties
     */
    parseFits(props:{fit:string, orientation:string})
    {
        if(!props || !props.fit) return;
        let keepGoing = true;

        const app = this.getApp()
        const sp = app.makeStringParser(props.fit)

        while (keepGoing) {
            try {
                const exp = sp.readNext()
                let unit, val;
                if (exp.substring(exp.length - 2) === "()") {
                    // a function callback named
                    this.fits.push(exp)
                } else {
                    if (exp === '*' || exp === '**') {
                        unit = exp;
                        val = 1;
                    } else {
                        const re = /[\d.]+/
                        // @ts-ignore
                        const match = re.exec(exp)[0]
                        unit = exp.substring(match.length)
                        val = Number.parseFloat(match)
                    }
                    let numKids = this.getContainer().children.length;
                    let cdim = this.getContainer().getBoundingClientRect()
                    const fullSize = props.orientation === 'horizontal' ? cdim.width : cdim.height;
                    let even = fullSize / numKids;
                    let size;
                    if (unit === '**') {
                        size = 100
                        unit = "%";
                    } else if (unit === '*') {
                        size = val * even
                        unit = 'px'
                    } else {
                        size = val;
                    }
                    this.fits.push(`${size}${unit}`)
                }
                keepGoing = sp.getRemaining().length > 0
            } catch (e) {
                console.error(e);
                keepGoing = false;
            }
        }
        // console.log('fits', this.fits)
        this.applyFits(props.orientation === 'horizontal')
    }
    /**
     * Applies the sizes parsed in 'fits' to the container children
     * @param {boolean} isHorizontal
     */
    applyFits(isHorizontal:boolean)  {
        if(check.mobile) {
            throw Error('Not Implemented: ComCommon.applyFits')
        }
        const children = this.getContainer().children
        for (let i = 0; i < children.length; i++) {
            const child:HTMLElement = (children[i] as HTMLElement)
            child.style.display = isHorizontal ? 'inline-block' : 'inline'
            child.style.verticalAlign = 'top'
            const innerChild:HTMLElement = (child.firstElementChild as HTMLElement)
            const fitSize = this.nextFit()
            if (isHorizontal) {
                innerChild.style.width = fitSize;
            } else innerChild.style.height = fitSize;
        }
    }

    /** picks the next parsed fit value, or the last one if list was exhausted */
    nextFit()  {
        return this.fits[this.fitNum++] || this.fits[this.fits.length - 1]
    }

    // -------------------------------------------------------------------------------------------------------

    /**
     * commute from markup common values like width, height, and background, backgroundColor
     *
     * @param {HTMLElement} el Element to set props on
     * @param {object} props properties with values to set
     * @param {object} defaults defaults to use if props not specified
     */
    setCommonProps(el:HTMLElement, props:{width?:string, height?:string, background?:string, backgroundColor?:string}, defaults?:{width?:string, height?:string, background?:string, backgroundColor?:string}) {
        if(check.mobile) {
            throw Error('Not Implemented: ComCommon.setCommonProps')
        }
        if(!defaults) defaults = {
            width: '100%',
            height: '100%'
        }
        let width:any = (props.width || defaults.width)
        let height:any = (props.height || defaults.height)
        if(typeof width === 'number') width = width + 'px'
        if(typeof height === 'number') height = height + 'px'
        el.style.width = width;
        el.style.height = height;
        el.style.background = props.background || defaults.background || ''
        el.style.backgroundColor = props.backgroundColor || defaults.backgroundColor || ''
    }

    /**
     * Applies a 'style' line of css values to the given container element
     *
     * @param div
     * @param styleText
     */
    applyContainerStyles(div:HTMLElement, styleText:string) {
        if(check.mobile) {
            throw Error('Not Implemented: ComCommon.applyContainerStyles')
        }
        if(!div || !div.style || !styleText) return;
        const statements = styleText.split(';')
        statements.forEach(statement => {
            const kv = statement.split(':')
            let key = kv[0].trim().toLowerCase()
            const value = kv[1].trim().toLowerCase()
            const kcp = key.split('-')
            key = kcp[0]+kcp[1].charAt(0).toUpperCase()+kcp[1].substring(1)
            // @ts-ignore
            div.style[key] = value
        })
    }

    // -------------------------------------------------------------------------------------------------------

    /**
     * Set up the binding for this component
     * Inherit bindings of parent scope(s) and append/modify locally.
     */
    bindComponent() {
        let component;
        if (check.mobile) {
            // @ts-ignore
            component = this.rootComponent
            if (!component.bound) {
                component.bound = new Observable()
            }
        } else {
            // @ts-ignore
            component = this.riot
            if(!component.bound) component.bound = {}
        }

        if(!check.mobile) {
            const taglc = component.root.tagName.toLowerCase()
            if (taglc.substring(taglc.length - 5) === '-page') {
                component.bound.data = this.model.getAtPath('page-data.' + taglc)
            }
        }

        let scopeComp = component

        // walk up from here until we lose parentage (page scope)
        // and gather the bind directives
        const directives:string[] = []
        let directiveSet
        while (scopeComp) {
            directiveSet = this.getComponentAttribute(scopeComp, 'bind')
            if(directiveSet) {
                let statements = directiveSet.split(',')
                statements.forEach(statement => {
                    directives.push(statement.trim())
                })
            }
            scopeComp = this.getComponentParent(scopeComp)
        }
        // Now process all the directives that affect us
        for (let i = 0; i < directives.length; i++) {
            let directive = directives[i]
            // create a property in the local observable the markup implementation looks at
            let {section, prop, alias} = this.comBinder.deconstructBindStatement(directive)
            let startValue = (check.mobile && component.get(alias)) || this.model.getAtPath(section + '.' + prop)
            const name = alias || prop;
            if (check.mobile) {
                component.bindingContext = component.bound
                component.bound.set(name, startValue)
            } else {
                component.bound[name] = startValue
            }


            this.comBinder.applyComponentBindings(component, directive, (component:any, name:string, value:any, updateAlways:boolean) => {
                // Handle the update to the component itself
                if(check.riot) {
                    let doUpdate = updateAlways || value != component.bound[name]
                    if (doUpdate) {
                        try {
                            component.bound[name] = value
                            component.update()
                        } catch (e) {}
                    }
                } else {
                    component.bound.set(name, value)
                }
            })
        }
    }

    getComBinder() {
        return this.comBinder
    }

    /**
     * Used by mobile side ComponentBase to bind to inner views
     * @param localBinds Array of view/name/prop values (in an array) that bind the prop of the view to the local name
     */
    setLocalBinds(localBinds:LocalBind[]) {
        if(check.riot) return;
        // @ts-ignore
        const component:any = this.rootComponent
        if (!component.bound) {
            component.bound = new Observable()
        }
        for(let n = 0; n<localBinds.length; n++) {
            const lb:LocalBind = localBinds[n]
            const view = lb[0]
            const name = lb[1]
            const viewProp = lb[2]
            console.log('applying local bind', view, name, viewProp)
            view.bindingContext = component.bound
            view.bind({sourceProperty: name, targetProperty: viewProp})
        }

    }

}

export function newCommon(component:any) {
    return new ComCommon(component)
}
