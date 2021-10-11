
import {check} from './EnvCheck'

import {ComBinder} from './ComBinder'
import {AppCore, getTheApp} from "./AppCore";
import {AppModel} from "./AppModel";

let View = class {}
let Observable = class {}
let Color = class {
    constructor(arg:string) {}
}

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
        Color = require('@nativescript/core').Color
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
        arg.b = this.evalBinding.bind(this)
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
        // console.warn('evalBinding', name)
        const segs = name.split('.')
        //@ts-ignore
        const comp = this.riot || this.rootComponent || this
        let v = comp.bound || {} // per component
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
        const ocomp = comp
        if(check.riot) {
            tag = (tag && tag.toUpperCase())
            while (comp) {
                comp = comp.root.parentElement && this.getComponent(comp.root.parentElement)
                if(!comp) return null
                if (!tag || comp.root.tagName === tag) {
                    // This looks like a hack, but it's actually needed because
                    // we can have an out-of scope and unmounted cond-sect that is not attached to a parent
                    // any longer, so it's dom may be invalid.  This finds such cases and declares "that's all folks" instead.
                    if(ocomp.root.tagName === 'COND-SECT') {
                        const pel = comp.root
                        const kids = pel.children
                        let found = false;
                        for (let i = 0; i < kids.length; i++) {
                            if (kids[i] === ocomp.root) {
                                found = true;
                                break;  // parent is valid
                            }
                        }
                        if (!found) {
                            // console.warn('Incorrect parentage')
                            return null // no parent, stop any further searching.
                        }
                    }
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

    getPageComponent() {
        // @ts-ignore
        let comp = this.riot
        if(!comp) return; // just riot for now
        let par = this.getComponentParent(comp)
        while(par) {
            let taglc = par.root.tagName.toLowerCase()
            if(taglc.substring(taglc.length-5) === '-page') {
                return par
            }
            par = this.getComponentParent(par)
        }
        return null;
    }

    /**
     * returns the component that is the child of the given component of the given tag,
     * optionally the given ordinal occurrence.
     *
     * Not for mobile.  See also ComNormal elementFind
     *
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
            let attVal = (view && view.get(attName)) || ''
            if(typeof attVal === 'object') attVal = attVal.value
            return ''+attVal
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
    setCommonProps(el:HTMLElement, props:any, defaults?:any) {
        if(check.mobile) {
            throw Error('Not Implemented: ComCommon.setCommonProps')
        }

        let classes = (props.className || props.classname || props.class || '').split(' ')
        classes.forEach((c:string) => {
            if(c) el.classList.add(c)
        })

        // Check for special handling for alignment (via flex)
        const comp = this.getComponent(el)
        let container = this.getComponentParent(comp)
        const taglc = container.root.tagName.toLowerCase()
        let flexChild = (taglc === 'stack-layout' || taglc === 'flex-layout')
        let stretchHeight, stretchWidth
        if(flexChild) {
            if(this.getComponentAttribute(container, 'orientation') === 'horizontal') {
                stretchHeight = this.getComponentAttribute(container, 'height')
            }
            if(this.getComponentAttribute(container, 'orientation') === 'vertical') {
                stretchWidth = this.getComponentAttribute(container, 'width')
            }
        }

        if(!defaults) defaults = {}
        let id:any = (props.id || defaults.id)
        let position = (props.position || defaults.position)
        let padding:any = (props.padding || defaults.padding)
        let margin:any = (props.margin || defaults.margin)
        let paddingTop:any = (props.paddingtop || props.paddingTop || defaults.paddingTop)
        let paddingRight:any = (props.paddingright || props.paddingRight || defaults.paddingRight)
        let paddingBottom:any = (props.paddingbottom || props.paddingBottom || defaults.paddingBottom)
        let paddingLeft:any = (props.paddingleft || props.paddingLeft || defaults.paddingLeft)
        let marginTop:any = (props.margintop ||props.marginTop || defaults.marginTop)
        let marginRight:any = (props.marginright || props.marginRight || defaults.marginRight)
        let marginBottom:any = (props.marginbottom || props.marginBottom || defaults.marginBottom)
        let marginLeft:any = (props.marginleft || props.marginLeft || defaults.marginLeft)
        let width:any = (props.width || defaults.width)
        let height:any = (props.height || defaults.height)
        if(''+Number(width) === width) width = Number(width)
        if(''+Number(height) === height) height = Number(height)
        if(''+Number(padding) === padding) padding = Number(padding)
        if(''+Number(paddingTop) === paddingTop) paddingTop = Number(paddingTop)
        if(''+Number(paddingRight) === paddingRight) paddingRight = Number(paddingRight)
        if(''+Number(paddingBottom) === paddingBottom) paddingBottom = Number(paddingBottom)
        if(''+Number(paddingLeft) === paddingLeft) paddingLeft = Number(paddingLeft)
        if(''+Number(margin) === margin) margin = Number(margin)
        if(''+Number(marginTop) === marginTop) marginTop = Number(marginTop)
        if(''+Number(marginRight) === marginRight) marginRight = Number(marginRight)
        if(''+Number(marginBottom) === marginBottom) marginBottom = Number(marginBottom)
        if(''+Number(marginLeft) === marginLeft) marginLeft = Number(marginLeft)
        
        if(typeof padding === 'number') padding = padding + 'px'
        if(typeof paddingTop === 'number') paddingTop = paddingTop + 'px'
        if(typeof paddingRight === 'number') paddingRight = paddingRight + 'px'
        if(typeof paddingBottom === 'number') paddingBottom = paddingBottom + 'px'
        if(typeof paddingLeft === 'number') paddingLeft = paddingLeft + 'px'

        if(typeof margin === 'number') margin = margin + 'px'
        if(typeof marginTop === 'number') marginTop = marginTop + 'px'
        if(typeof marginRight === 'number') marginRight = marginRight + 'px'
        if(typeof marginBottom === 'number') marginBottom = marginBottom + 'px'
        if(typeof marginLeft === 'number') marginLeft = marginLeft + 'px'

        if(typeof width === 'number') width = width + 'px'
        if(typeof height === 'number') height = height + 'px'
        if(id) el.id = id;

        let align:any = (props.align || props.alignment|| props.alignself || props.alignSelf)
        let hAlign:any = (props.hAlign || props.halign || props.horizontalAlignment || props.horizontalalignment)
        let vAlign:any = (props.vAlign || props.valign || props.verticalAlignment || props.verticalalignment)
        let textAlign:any = (props.textAlign || props.textalign)

        if(align) {
            let ap = alignSplit(align, stretchWidth, stretchHeight)
            hAlign = ap.hAlign
            vAlign = ap.vAlign
        }
        if(vAlign === 'stretch' && stretchHeight) {
            el.style.height = stretchHeight
        }
        if(hAlign === 'stretch' && stretchWidth) {
            el.style.width = stretchWidth
        }

        // userSelect property in component will set ('all', 'text', 'inherit', etc)  otherwise, we default to none.
        el.style.userSelect = comp.userSelect || 'none'

        if(el.parentElement) {

            // simple-label and other components that have a containing div we can muddle will set isAlignable
            if(comp.isAlignable && vAlign) {
                let t = vAlign === 'middle' ? 50 : vAlign === 'bottom' ? 100 : 0
                // let l = hAlign === 'center' ? 50 : hAlign === 'right' ? 100 : 0
                if(el.parentElement.parentElement) {
                    el.parentElement.parentElement.style.position = 'relative' // set the outer container relative
                    el.parentElement.style.position = 'absolute'    // so we have absolute reference with inner container
                    el.parentElement.style.top = t + '%'            // do the transform trick for v-align
                    // el.parentElement.style.left = l + '%'        // horizontal is handled by flex container alignSelf
                    el.parentElement.style.transform = `translateY(-${t}%)`
                }
            }
            if(flexChild) {
                if (el.parentElement.tagName.toLowerCase() !== 'flex-layout') {
                    let flexAlign = (props.alignself || props.alignSelf || "flex-start")
                    if(hAlign === 'left') flexAlign = 'flex-start'
                    if(hAlign === 'center') flexAlign = 'center'
                    if(hAlign === 'right') flexAlign = 'flex-end'
                    el.parentElement.style.alignSelf = flexAlign
                }
                el.parentElement.style.width = width;
                el.parentElement.style.height = height;

                let order = props.order
                let flexGrow = props.flexgrow || props.flexGrow || props.grow
                let flexShrink = props.flexshrink || props.flexShrink || props.shrink
                // flex, basis will not be supported unless I find it in {N}
                if (order) el.parentElement.style.order = order
                if (flexGrow) el.parentElement.style.flexGrow = flexGrow
                if (flexShrink) el.parentElement.style.flexShrink = flexShrink
            } else {
                el.style.width = width
                el.style.height = height
            }
        }
        el.style.textAlign = textAlign
        el.style.padding = padding
        el.style.paddingTop = paddingTop
        el.style.paddingRight = paddingRight
        el.style.paddingBottom = paddingBottom
        el.style.paddingLeft = paddingLeft
        el.style.margin = margin
        el.style.marginTop = marginTop
        el.style.marginRight = marginRight
        el.style.marginBottom = marginBottom
        el.style.marginLeft = marginLeft

        let row = Number(props.gridRowStart || props.gridrowstart) || (Number(props.row) +1)
        let col = Number(props.gridColumnStart || props.gridcolumnstart) || (Number(props.col) +1)
        let colend = Number(props.gridColumnEnd || props.gridcolumnend) || col
        let rowend = Number(props.gridRowEnd || props.gridrowend) || row
        let rowRel = 0, colRel = 0
        let rowSpan = ((props.rowSpan || props.rowspan) && Number(props.rowspan || props.rowSpan ||'0') +1) || (rowend-row)+1
        let colSpan = ((props.colSpan || props.colspan) && Number(props.colspan || props.rowSpan ||'0') +1) || (colend-col)+1
        if(rowSpan < 1) rowSpan = 1;
        if(colSpan < 1) colSpan = 1;
        if(col < 1) col = 1;
        if(row < 1) row = 1;  // negative references not supported
        let gridArea = props.gridArea || props.gridarea
        if(gridArea) {
            let rs = (props.row || '').trim()
            let cs = (props.col || '').trim()
            rowRel = Number(rs)
            colRel = Number(cs)
            // {N} won't allow negative offsets here, so we will normalize to that restriction here too
            if(!isFinite(rowRel) || rowRel < 0) rowRel = 0
            if(!isFinite(colRel) || colRel < 0) colRel = 0
        }

        const areaToNumber = (type:string, a:number|string):number => {
            if(isFinite(Number(a))) return Number(a)
            let areas = container.root.getAttribute('gridTemplateAreas') || container.root.getAttribute('areas') || ''
            let grid:string[] = areas.split('/')
            let r, c
            for (r=0; r<grid.length; r++) {
                let cols = grid[r].split(' ')
                for(c =0; c < cols.length; c++) {
                    if (cols[c] === a) {
                        if(type === 'row') return r +1
                        return c +1
                    }
                }
            }
            return Number.NaN
        }

        if(el.parentElement) {
            if(position) {
                el.parentElement.style.position = position
            }
            if(gridArea) {
                el.parentElement.style.gridArea = gridArea
                // pick up what was auto-set by setting grid area
                col = areaToNumber('col', el.parentElement.style.gridColumnStart)
                colSpan = areaToNumber('col', el.parentElement.style.gridColumnEnd) - col +1
                row = areaToNumber('row', el.parentElement.style.gridRowStart)
                rowSpan = areaToNumber('row', el.parentElement.style.gridRowEnd) - row +1

            }
            if (isFinite(col)) {
                el.parentElement.style.gridColumnStart = '' + (col + colRel)
                el.parentElement.style.gridColumnEnd = '' + (col + colRel + colSpan)
            }
            if (isFinite(row)) {
                el.parentElement.style.gridRowStart = '' + (row + rowRel)
                el.parentElement.style.gridRowEnd = '' + (row + rowRel + rowSpan)
            }
        }

        el.style.color = props.color || defaults.color || undefined
        el.style.backgroundColor = props.backgroundColor  || props.backgroundcolor || defaults.backgroundColor || ''

        let bg = backgroundSettings(props.background || props.backgroundSettings || props.backgroundsettings || '', true)
        if(bg.attachment) el.style.backgroundAttachment = bg.attachment
        if(bg.clip) el.style.backgroundClip = bg.clip
        if(bg.color) el.style.backgroundColor =  bg.color
        if(bg.image) el.style.backgroundImage = bg.image
        if(bg.origin) el.style.backgroundOrigin = bg.origin
        if(bg.repeat) el.style.backgroundRepeat = bg.repeat
        if(bg.position) el.style.backgroundPosition = bg.position
        if(bg.size) el.style.backgroundSize = bg.size

        let bgi = baseFromAssets(props.backgroundImage || props.backgroundimage)
        if(bgi) el.style.backgroundImage = bgi
        let bga = props.backgroundAttachment || props.backgroundAttachment
        if(bga) el.style.backgroundAttachment = bga
        let bgc = props.backgroundClip || props.backgroundClip
        if(bgc) el.style.backgroundClip = bgc
        let bgo = props.backgroundOrigin || props.backgroundOrigin
        if(bgo) el.style.backgroundOrigin = bgo
        let bgr = props.backgroundRepeat || props.backgroundRepeat
        if(bgr) el.style.backgroundRepeat = bgr
        let bgp = props.backgroundPosition || props.backgroundPosition
        if(bgp) el.style.backgroundPosition = bgp
        let bgs = props.backgroundSize || props.backgroundSize
        if(bgs) el.style.backgroundSize = bgs


        let fontParts = fontSplit(props.font || '')
        let lineHeight = props.lineHeight || props.lineHeight || fontParts.lineHeight || ''
        let fontSize = props.fontSize || props.fontsize || fontParts.size || ''
        let fsSplit = fontSize.split('/')
        if(fsSplit[1]) lineHeight = fsSplit[1]
        fontSize = fsSplit[0]
        let fontName = (props.fontName || props.fontname || fontParts.name || '').toLowerCase()
        let fontStyle = props.fontStyle || props.fontstyle || fontParts.style || ''
        let fontWeight = props.fontWeight || props.fontweight || fontParts.weight || ''

        if(fontName) {
            el.classList.forEach((cname:string)=> {
                if(cname.charAt(0) == 'f' && cname.charAt(1) === '-') {
                        el.classList.remove(cname)
                }
            })
            el.classList.add('f-'+fontName)
        }
        if(fontSize) el.style.fontSize = fontSize
        if(lineHeight) el.style.lineHeight = lineHeight
        if(fontWeight) el.style.fontWeight = fontWeight
        if(fontStyle) el.style.fontStyle = fontStyle

        let bp = borderSplit(props.border)
        if(props.border) el.style.border = props.border
        let borderStyle = props.borderStyle || props.borderstyle || bp.style
        let borderColor = props.borderColor || props.bordercolor || bp.color
        let borderWidth = props.borderWidth || props.borderwidth || bp.width
        if(borderStyle) el.style.borderStyle = borderStyle
        if(borderColor) el.style.borderColor = borderColor
        if(borderWidth) el.style.borderWidth = borderWidth

    }

    setCommonPropsMobile(component:any, defaults:any) {

        // console.log('setCommonPropsMobile', component)

        // Check for the container we are in
        let container = this.getComponentParent(component)
        let orientation = this.getComponentAttribute(container, 'orientation')
        let isHorizontal =  (orientation === 'horizontal')

        // console.log('container', container)
        // console.log('container name', container.constructor.name)
        // console.log('component text', component.get('text'))
        // console.log('orientation', orientation)
        // console.log('isHorizontal', isHorizontal)


        if(!defaults) defaults = {}
        let id:any = (this.getComponentAttribute(component, 'id') || defaults.id)
        let padding:any = (this.getComponentAttribute(component, 'padding') || defaults.padding)
        let margin:any = (this.getComponentAttribute(component, 'margin') || defaults.margin)
        let paddingTop:any = (this.getComponentAttribute(component, 'paddingTop') || defaults.paddingTop)
        let paddingRight:any = (this.getComponentAttribute(component, 'paddingRight') || defaults.paddingRight)
        let paddingBottom:any = (this.getComponentAttribute(component, 'paddingBottom') || defaults.paddingBottom)
        let paddingLeft:any = (this.getComponentAttribute(component, 'paddingLeft') || defaults.paddingLeft)
        let marginTop:any = (this.getComponentAttribute(component, 'marginTop') || defaults.marginTop)
        let marginRight:any = (this.getComponentAttribute(component, 'marginRight') || defaults.marginRight)
        let marginBottom:any = (this.getComponentAttribute(component, 'marginBottom') || defaults.marginBottom)
        let marginLeft:any = (this.getComponentAttribute(component, 'marginLeft') || defaults.marginLeft)
        let width:any = (this.getComponentAttribute(component, 'width') || defaults.width)
        let height:any = (this.getComponentAttribute(component, 'height') || defaults.height)
        let align:any = (this.getComponentAttribute(component, 'alignment') 
            || this.getComponentAttribute(component, 'align')
            // || this.getComponentAttribute(component, 'alignSelf')
            || this.getComponentAttribute(component, 'horizontalAlignment')
            || this.getComponentAttribute(component, 'verticalAlignment'))
        if(''+Number(width) === width) width = Number(width)
        if(''+Number(height) === height) height = Number(height)
        if(''+Number(padding) === padding) padding = Number(padding)
        if(''+Number(paddingTop) === paddingTop) paddingTop = Number(paddingTop)
        if(''+Number(paddingRight) === paddingRight) paddingRight = Number(paddingRight)
        if(''+Number(paddingBottom) === paddingBottom) paddingBottom = Number(paddingBottom)
        if(''+Number(paddingLeft) === paddingLeft) paddingLeft = Number(paddingLeft)
        if(''+Number(margin) === margin) margin = Number(margin)
        if(''+Number(marginTop) === marginTop) marginTop = Number(marginTop)
        if(''+Number(marginRight) === marginRight) marginRight = Number(marginRight)
        if(''+Number(marginBottom) === marginBottom) marginBottom = Number(marginBottom)
        if(''+Number(marginLeft) === marginLeft) marginLeft = Number(marginLeft)

        component.set('width', width)
        component.set('height', height)

        // console.log('setting padding')
        component.set('padding', padding)
        component.set('paddingTop', paddingTop)
        component.set('paddingRight', paddingRight)
        component.set('paddingBottom', paddingBottom)
        component.set('paddingLeft', paddingLeft)
        // console.log('setting margin')
        component.set('margin', margin)
        component.set('marginTop', marginTop)
        component.set('marginRight', marginRight)
        component.set('marginBottom', marginBottom)
        component.set('marginLeft', marginLeft)

        // let align = component.get('align')
        let textAlign = component.get('textAlign')
        // console.log(`align=${align}, textAlign=${textAlign}`)
        let stetchWidth:string = '', stretchHeight:string = ''
        if(isHorizontal) stretchHeight = container.get('height')
        else             stetchWidth = container.get('width')
        let ap = alignSplit(align, stetchWidth, stretchHeight)
        let hAlign = ap.hAlign
        let vAlign = ap.vAlign
        // console.log(`hAlign=${hAlign}, vAlign=${vAlign}`)
        component.set('horizontalAlignment', hAlign)
        let inner = component.textComponent
        if(inner) inner.textAlign = inner.horizontalAlignment = textAlign
        component.set('textAlign', textAlign)
        container.verticalAlignment = vAlign

        let color = component.get('color') || defaults.color
        let background = component.get('background') || defaults.background
        let backgroundColor = component.get('backgroundColor') || defaults.backgroundColor
        if(color === 'undefined') color = undefined
        while(background.indexOf('undefined') !== -1) {
            background = background.replace('undefined', '')
        }
        background = background.trim()
        if(backgroundColor === 'undefined') backgroundColor = undefined
        if(color || background || backgroundColor) {
            if (color) {
                // console.log('setting color to '+color)
                component.set('color', new Color(color))
            }
            if (background) {
                // console.log('setting background to '+background)
                component.set('background', background)
            }
            if (backgroundColor) {
                // console.log('setting backgroundColor to '+backgroundColor)
                component.set('backgroundColor', new Color(backgroundColor))
            }
        }

        let bg = backgroundSettings(component.get('backgroundSettings'), false)
        if(bg.attachment) component.set('backgroundAttachment', bg.attachment)
        if(bg.clip) component.set('backgroundClip', bg.clip)
        if(bg.color) component.set('backgroundColor', bg.color)
        if(bg.image) component.set('backgroundImage', bg.image)
        if(bg.origin) component.set('backgroundOrigin', bg.origin)
        if(bg.repeat) component.set('backgroundRepeat', bg.repeat)
        if(bg.position) component.set('backgroundPosition', bg.position)
        if(bg.size) component.set('backgroundSize', bg.size)

        let bgi = baseFromAssets(component.get('backgroundImage'))
        if(bgi) component.set('backgroundImage',bgi)

        let fontParts = fontSplit(this.getComponentAttribute(component, 'font') || defaults.font || '')
        let lineHeight = (this.getComponentAttribute(component, 'lineHeight') || defaults.lineHeight || fontParts.lineHeight || '')
        let fontSize = (this.getComponentAttribute(component, 'fontSize') || defaults.fontSize || fontParts.size || '')
        let fsSplit = fontSize.split('/')
        if(fsSplit[1]) lineHeight = fsSplit[1]
        fontSize = fsSplit[0]
        let fontWeight = (this.getComponentAttribute(component, 'fontWeight') || defaults.fontWeight || fontParts.weight || '')
        let fontStyle = (this.getComponentAttribute(component, 'fontStyle') || defaults.fontStyle || fontParts.style || '')
        let fontName = (this.getComponentAttribute(component, 'fontName') || defaults.fontName || fontParts.name || '').toLowerCase()
        if(fontName) {
            let classes = (component.get('className') || '').split(' ')
            for(let i=0; i< classes.length; i++) {
                let cname = classes[i]
                if(cname.charAt(0) === 'f' && cname.charAt(1) === '-') {
                    classes = classes.splice(i, 1)
                    break;
                }
            }
            classes.push('f-'+fontName)
            component.set('className', classes.join(' '))
        }
        if(fontSize) component.set('fontSize', fontSize)
        if(lineHeight) component.set('lineHeight', lineHeight)
        if(fontWeight) component.set('fontWeight', fontWeight)
        if(fontStyle) component.set('fontStyle', fontStyle)


        let position = (this.getComponentAttribute(component, 'position') || defaults.position || '')
        if(position) {
            container.set('position', position)
        }

        let gridArea = (this.getComponentAttribute(component, 'gridArea') || defaults.gridArea || '')
        if(gridArea) {
            if (container.findGridArea) {
                let relRow = 0, relCol = 0
                let rs = ''+component.get('row')
                relRow = Number(rs)
                let cs = ''+component.get('col')
                relCol = Number(cs)

                if(!isFinite(relRow)) relRow = 0;
                if(!isFinite(relCol)) relCol = 0;

                let areaInfo = container.findGridArea(gridArea)
                let col = areaInfo.firstColumn + relCol
                let row = areaInfo.firstRow + relRow
                let colSpan = areaInfo.lastColumn - col
                let rowSpan = areaInfo.lastRow - row
                if(isFinite(col)) component.set('col', col)
                if(isFinite(row)) component.set('row', row)
                if(colSpan) component.set('colSpan', colSpan)
                if(rowSpan) component.set('rowSpan', rowSpan)
            } else {
                console.error('--- Looking for grid area but container is not a grid', container)
            }
        } else {
            let gcs = (this.getComponentAttribute(component, 'gridColumnStart') || defaults.gridColumnStart || '')
            if(gcs) {
                let v = Number(gcs)
                if(isFinite(v)) component.set('col', v-1)
            }
            let gce = (this.getComponentAttribute(component, 'gridColumnEnd') || defaults.gridColumnEnd || '')
            if(gce) {
                let v = Number(gce)
                if (isFinite(v)) {
                    let sp = v - Number(component.get('col'))
                    if (sp < 1) sp = 1
                    component.set('colSpan', sp)
                }
            }
            let grs = (this.getComponentAttribute(component, 'gridRowStart') || defaults.gridRowStart || '')
            if(grs) {
                let v = Number(grs)
                if(isFinite(v)) component.set('row', v-1)
            }
            let gre = (this.getComponentAttribute(component, 'gridRowEnd') || defaults.gridRowEnd || '')
            if(gre) {
                let v = Number(gre)
                if (isFinite(v)) {
                    let sp = v - Number(component.get('row'))
                    if (sp < 1) sp = 1
                    component.set('rowSpan', sp)
                }
            }
        }

        let border = (this.getComponentAttribute(component, 'border') || defaults.border || '')
        let bp = borderSplit(border)
        let borderStyle = (this.getComponentAttribute(component, 'borderStyle') || defaults.borderStyle || bp.style)
        let borderColor = (this.getComponentAttribute(component, 'borderColor') || defaults.borderColor || bp.color)
        if(borderColor === 'undefined') borderColor = undefined
        let borderWidth = (this.getComponentAttribute(component, 'borderWidth') || defaults.borderWidth || bp.width)
        if(border) component.set('border', border)
        if(borderStyle) component.set('borderStyle', borderStyle)
        if(borderColor) component.set('borderColor', borderColor)
        if(borderWidth) component.set('borderWidth', borderWidth)


        // console.log("==========")
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

    bindComponent2(props:string[]) {
        // @ts-ignore
        let component = this.riot || this.rootComponent
        // enumerate the props
        for(let p of Object.getOwnPropertyNames(props))  {
            let d
            // @ts-ignore
            let po = props[p]
            let tcomp:any
            if(typeof po === 'object') {
                d = (po.value || '')
                p = po.locprop
                tcomp = po.component
            } else d = (po || '')
            d = d.replace(/@@/g, '$%AT%$')
            // let isBound = (p === 'bind') || (d.indexOf('$') !==-1)
            let {directive, value} = this.evaluateBindExpression(d)
            value = value.replace(/\$%AT%\$/g, '@')
            if(p === 'bind') directive = d
            component.state[p] = value
            if(component.update) component.update()
            else {
                console.log('setting initial', p, value)
                tcomp.set(p, value)
            }
            if(directive) {
                let {section, prop, alias, updateAlways} = this.comBinder.deconstructBindStatement(directive)
                if(directive.charAt(0) === ':') {
                    section = 'page-data'
                    let navinfo = this.model.getAtPath('page.navInfo')
                    prop = navinfo.pageId + '-page'
                    alias = p
                }
                let mpath = section+'.'+prop
                let locprop = alias || p
                let {value} = this.evaluateBindExpression(directive)
                component.state[locprop] = value || ''
                if(!component.btrack) component.btrack = {}
                component.btrack[prop] = true
                if(component.bindingContext) {
                    const bopts = {
                        sourceProperty: p,
                        targetProperty: locprop
                    }
                    tcomp.bind(bopts, component.state)
                }
                this.model.bind(component, section, prop, (comp:any, prop:string, inValue:any) => {
                    if(comp.btrack && comp.btrack[prop]) {
                        let po = comp.props[p]
                        if(typeof po === 'object') {
                            d = (po.value || '')
                            p = po.locprop
                            tcomp = po.component
                        } else d = (po || '')

                        let {directive, value} = this.evaluateBindExpression(d)
                        if(!directive) value = inValue
                        component.state[locprop] = value || ''
                        if(component.update) component.update()
                    }
                })
            }
        }
    }

    evaluateBindExpression(expr:string): {directive:string, value:string } {
        let value:string = ''
        let n:number
        let ls = 0;
        let le = expr.length
        let directive = ''
        while((n = expr.indexOf('@', ls)) !== -1) {
            le = n
            let xn = expr.indexOf(' ', n)
            if (xn == -1) xn = expr.length
            let d = expr.substring(n, xn)
            let lit = expr.substring(ls, le)
            let v = ''
            if (d.charAt(1) === ':') {
                // @: is page data
                let pd = d.substring(2)
                v = this.app.getFromCurrentPageData(pd)
                directive = d.substring(1)
            } else {
                directive = d.substring(1)
                try {
                    v = this.app.model.getAtPath(directive)
                } catch(e) {
                    v = '"?'+d+'?"'
                }
            }
            value += lit + v
            ls = xn
        }
        value += expr.substring(ls)
        return {directive, value}
    }

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
                try {
                    component.bound.data = this.model.getAtPath('page-data.' + taglc)
                } catch(e) {
                    // okay to not have bound data
                }
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
            const name = alias || prop;
            let startValue
            try {
                startValue = (check.mobile && component.get(name)) || this.model.getAtPath(section + '.' + prop)
            } catch(e) {
            }
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
                    // hook in custom component lifecycle on update for mobile
                    if(component.preStdOnBeforeUpdate) {
                        component.preStdOnBeforeUpdate()
                    }
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
            // console.log('applying local bind', view, name, viewProp)
            view.bindingContext = component.bound
            view.bind({sourceProperty: name, targetProperty: viewProp})
        }

    }

}

export function newCommon(component:any) {
    return new ComCommon(component)
}

class AlignParts {
    public hAlign:string = ''
    public vAlign:string = ''
}
function alignSplit(align:string, stretchWidth:string|undefined, stretchHeight:string|undefined):AlignParts {
    let ap = new AlignParts()
    if (align) {
        let parts = align.split(/, ?| /)
        for (let i = 0; i < parts.length; i++) {
            let p = parts[i].trim()
            if (p.charAt(p.length - 1) === ',') p = p.substring(0, p.length - 1)
            switch (p.toLowerCase()) {
                case 'top':
                case 'middle':
                case 'bottom':
                    ap.vAlign = p
                    break
                case 'left':
                case 'right':
                case 'center':
                    ap.hAlign = p
                    break
                case 'stretch':
                    if (stretchHeight) ap.vAlign = p
                    if (stretchWidth) ap.hAlign = p
                    break
            }
        }
    }
    return ap
}

class BackgroundSettings {
    public attachment:string = ''
    public image:string = ''
    public clip:string = ''
    public color:string = ''
    public origin: string = ''
    public position: string = ''
    public repeat:string = ''
    public size:string = ''
}
function backgroundSettings(settings:string, baseImage:boolean):BackgroundSettings {
    let bgOut = new BackgroundSettings()
    if(settings) {
        // console.log('backgroundSettings is ', settings)
        // attachment, image, clip, color, origin, position, repeat, size
        let bgAttachment, bgImage, bgClip, bgColor, bgOrigin, bgPosition, bgRepeat, bgSize
        const isUrl = (str: string) => {
            // a superficial test
            return (str.indexOf('url') === 0 || str.indexOf('://') !== -1)
        }
        const isAttachment = (str: string) => {
            return (str === 'scroll' || str === 'fixed' || str === 'local')
        }
        const isBox = (str: string) => {
            return (str === 'border-box' || str === 'padding-box' || str === 'content-box' || str === 'text'
                || str === 'inherit' || str === 'initial' || str === 'unset')
        }
        const isPosition = (str: string) => {
            return (str === 'left' || str === 'right' || str === 'top' || str === 'center' || str === 'bottom' || str.indexOf('%')!==-1 || str.indexOf('/')!==-1)
        }
        const isSize = (str:string) => {
            return (str === 'cover' || str=='contain')
        }
        const isRepeat = (str: string) => {
            return (str === 'repeat'
                || str === 'repeat-x' || str === 'repeat-y'
                || str === 'no-repeat'
                || str === 'space'
                || str === 'round')
        }
        let bparts = settings.split(' ')
        bgRepeat = ''
        bgPosition = ''
        for (let i = 0; i < bparts.length; i++) {
            let bp = bparts[i]
            if (isUrl(bp)) {
                bgImage = bp
            } else if (isAttachment(bp)) {
                bgAttachment = bp
            } else if (isPosition(bp)) {
                let ps = bp.split('/')
                if (bgPosition) bgPosition += ' '
                bgPosition += ps[0]
                if (ps[1]) bgSize = ps[1]
            } else if(isSize(bp)) {
                bgSize = bp
            } else if (isRepeat(bp)) {
                if (bgRepeat) bgRepeat += ' '
                bgRepeat += bp;
            } else if (isBox(bp)) {
                if (!bgOrigin) {
                    bgOrigin = bp
                } else {
                    bgClip = bp
                }
            } else {
                bgColor = bp
            }
        }
        if(bgAttachment) {
            // console.log('background-attachment', bgAttachment)
            bgOut.attachment = bgAttachment
        }
        if(bgImage) {
            if(baseImage) bgImage = baseFromAssets(bgImage) // will convert with background-image handler below
            // console.log('background-image', bgImage)
            bgOut.image = bgImage
        }
        if(bgClip) {
            // console.log('background-clip', bgClip)
            bgOut.clip = bgClip
        }
        if(bgColor) {
            // console.log('background-color', bgColor)
            bgOut.color = bgColor
        }
        if(bgOrigin) {
            // console.log('background-origin', bgOrigin)
            bgOut.origin = bgOrigin
        }
        if(bgPosition) {
            // console.log('background-position', bgPosition)
            bgOut.position = bgPosition
        }
        if(bgSize) {
            // console.log('background-size', bgSize)
            bgOut.size = bgSize
        }
        if(bgRepeat) {
            // console.log('background-repeat', bgRepeat)
            bgOut.repeat = bgRepeat
        }
    }
    return bgOut
}

class FontParts {
    name:string = ''
    style:string = ''
    weight:string = ''
    size:string = ''
    lineHeight:string = ''
}
function fontSplit(shorthand = '') {

    const out = new FontParts()
    const isStyle = (fp: string) => {
        return (fp === 'normal' || fp === 'italic' || fp === 'oblique')
    }
    const isStyleAngle = (fp: string) => {
        return (fp.indexOf('deg') !== -1 || fp.indexOf('rad') !== -1 || fp.indexOf('turn') !== -1)
    }
    const isWeight = (fp: string) => {
        let n = Number(fp)
        if (isFinite(n) && n >= 1 && n <= 1000) return true
        return (fp === 'normal' || fp === 'bold' || fp === 'bolder' || fp === 'lighter')
    }
    const isSize = (fp: string) => {
        if (fp === 'xx-small' || fp === 'x-small') return true
        if (fp === 'small' || fp === 'medium' || fp === 'large') return true
        if (fp === 'xxx-large' || fp === 'xx-large' || fp === 'x-large') return true
        if (fp === 'larger' || fp === 'smaller') return true
        if (fp.indexOf('/') !== -1) return true; // because it contains line height
        let i = -1
        let leadDig = false
        while (++i < fp.length) {
            if (fp.charAt(i) >= '0' && fp.charAt(i) <= '9') {
                leadDig = true
                break;
            }
        }
        return leadDig
    }

    if (shorthand) {
        let parts = shorthand.split(' ')

        for (let i = 0; i < parts.length; i++) {
            let fp = parts[i]
            if (isStyle(fp)) {
                out.style = fp
            }
            if (out.style && isStyleAngle(fp)) {
                out.style += ' ' + fp
            } else if (isWeight(fp)) {
                out.weight = fp
            } else if (isSize(fp)) {
                let sp = fp.split('/')
                out.size = sp[0]
                out.lineHeight = sp[1]
            } else { // font name
                out.name = fp
            }
        }
    }
    return out;
}

class BorderParts {
    style:string = ''
    width:string = ''
    color:string = ''
}
function borderSplit(border = '') {
    const out = new BorderParts()

    const isStyle = (bp:string) => {
        return(bp ==='none'
            || bp === 'hidden'
            || bp === 'dotted'
            || bp === 'dashed'
            || bp === 'solid'
            || bp === 'groove'
            || bp === 'ridge'
            || bp === 'inset'
            || bp === 'outset'
        )
    }
    const isWidth = (bp:string) => {
        if(bp === 'thin' || bp === 'medium' || bp === 'thick') return true
        let i = -1
        let leadDig = false
        while (++i < bp.length) {
            if (bp.charAt(i) >= '0' && bp.charAt(i) <= '9') {
                leadDig = true
                break;
            }
        }
        return leadDig
    }

    if(border) {
        const parts = border.split(' ')
        for (let i = 0; i < parts.length; i++) {
            let bp = parts[i]
            if(isStyle(bp)) {
                if(out.style) out.style += ' '
                out.style += bp
            }
            else if(isWidth(bp)) {
                out.width = bp
            }
            else { // is Color
                out.color = bp
            }
        }
    }
    return out
}

function baseFromAssets(url = '') {

    let isURL = (url.substring(0,3) === 'url')
    let op = 0
    let cl = url.length;
    if(isURL) {
        op = url.indexOf('(')+1
        cl = url.lastIndexOf(')')
    }
    let p = url.substring(op, cl)
    if(p.charAt(0) === p.charAt(p.length-1) && p.charAt(0) === '"' || p.charAt(0) === "'") p = p.substring(1, p.length-1)
    if(p) {
        if(p.indexOf('://') === -1) { // no protocol
            p = 'assets/' + p
            let pfx = (check.mobile) ? '~/' : './'
            p = pfx + p
        }
        if(isURL) p = 'url("'+p+'")'
    }
    return p;
}
