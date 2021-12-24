
import {AppModel} from "../app-core/AppModel";
import {AppCore} from "../app-core/AppCore";

/*
- addMenu       // to page; add means append or insert
- addSubmenu    // to menu by id, returns submenu id
- removeMenu    // by id
- removeSubmenu // by id
- addMenuItem  // add means append or insert
- deleteMenuItem // by id
- clearMenu
- changeMenuItem // by id

binding example

<bind="menu-pageid-FILE">
    <item label={bound.FILE_SAVE.label}/>

*/

/**
 * Structure of a Menu Item
 */
export class MenuItem {
    /** The displayed label for the item */
    public label:string = ''
    /** The identifier of the item */
    public id:string = ''
    /** parsed and used for adopting common desktop behaviors (per Electron) */
    public role?:string
    /** undefined for normal, or one of "submenu", "separator", "checkbox", or "radio" */
    public type?:string
    /** used to apply to different platforms */
    public targetCode?:string
    /** true if menu listing should be shown as disabled; no action */
    public disabled?:boolean
    /** true if box or radio type is in checked state */
    public checked?:boolean
    /** sublabel (set by modifier, no effect on mac) */
    public sublabel?:string
    /** tooltip (set by modifier, mac only) */
    public tooltip?:string
    /** icon path (set by modifier) */
    public icon?:string
    /** width and height of icon as an array (1 or 2 elements) */
    public iconSize?:number[]
    /** accelerator to apply */
    public accelerator?:string
    /** found only in incoming submenus in parsing and setup */
    public children?: MenuItem[]
}

/**
 * Structure of an Indicator Item
 * Also common to ToolItem
 */
export class IndicatorItem {
    /** Identifier */
    public id:string = ''
    /** optional label, appears over icon */
    public label?:string
    /** current state.  will be echoed to data-state markup property also. */
    public state:string = ''
    /** optional css classname to apply to container */
    public className?:string
    /** optional name of implementation object to be made by factory */
    public type?:string
    /** optional tooltip string appears on hover (desktop only) */
    public tooltip?:string
    /** a map with states as keys to icon strings */
    public icons?: {}
}

/**
 * Structure of a Tool Item
 * extends Indicator Item properties by adding an optional accelerator
 */
export class ToolItem extends IndicatorItem{
    /** accelerator to apply */
    public accelerator?:string
}

/**
 * The Menu API defines all common menu operations.
 */
export class MenuApi {
    private app:AppCore
    private model:AppModel

    constructor(app:AppCore) {
        this.app = app
        this.model = app.model
    }

    /**
     * Add or insert an item to a menu list
     * item may be a submenu with children
     * Will create the menu if it does not already exist
     *
     * @param {string} menuPath 'path' of menu, where menu identifiers are separated by '-' to form a hierarchical positional description
     * @param {MenuItem }item entry
     * @param {number} [position] insert position, appends if undefined.
     */
    addMenuItem(menuPath:string, item:MenuItem, position?:number) {

        let topItem = this.model.getAtPath('menu.main')
        if(!topItem) {
            topItem = new MenuItem()
            topItem.label = topItem.id = 'main'
            topItem.children = []
            this.model.setAtPath('menu.main', topItem, true)
        }
        const parentItem = this.getSubmenuFromPath(menuPath)
        const curMenu = parentItem.children

        let kidclone = item.children && item.children.slice() // copy

        if(this.limitTarget(item, "App")) {

            this.limitChildren(item, "App")

            if(position === undefined) {
                curMenu.push(item)
            } else {
                curMenu.splice(position, 0, item)
            }
            if(parentItem) parentItem.children = curMenu
        }
        if(this.limitTarget(item, "Desktop")) {
            item.children = kidclone
            this.limitChildren(item, "Desktop")
            this.app.ExtMenuApi && this.app.ExtMenuApi.addMenuItem(menuPath, item, position)
        }

        // update the full model
        this.model.setAtPath('menu.main', topItem, true)
    }

    /**
     * Used internally when needing to find the parent list for a menu item to add, remove, replace.
     * @param {string} menuPath 'path' of menu, where menu identifiers are separated by '-' to form a hierarchical positional description
     */
    private getSubmenuFromPath(menuPath:string) {
        let topItem = this.model.getAtPath('menu.main')
        if(!topItem) {
            throw Error('MENU NOT FOUND')
        }
        const parts = menuPath.split('-');
        if(!topItem.children) topItem.children = []
        let curMenu = topItem.children
        let parentItem = topItem;
        let pid = 'main'
        for(let i=0; i<parts.length; i++) {
            pid = parts[i]
            for (let c = 0; c < curMenu.length; c++) {
                let cmitem = curMenu[c]
                if (cmitem.id === pid) {
                    parentItem = cmitem;
                    curMenu = cmitem.children
                    break;
                }
            }
        }
        return parentItem
    }

    /**
     * Returns true if item is targeted for this platform
     * @param {MenuItem} item The item
     * @param {string} dest names destination menu type: either 'App' or 'Desktop'
     */
    limitTarget(item:MenuItem, dest:string) {

        const environment = this.model.getAtPath('environment')

        const target = item.targetCode || ''
        // limit to the target
        let isAppBar = (target.indexOf('A') !== -1) // specifically app bar only
        let isMenuBar = !isAppBar && (target.indexOf('D') !== -1) // goes to the menu bar, not the app menu
        if(isMenuBar && dest === 'App') return false
        if(isAppBar && dest === 'Desktop') return false
        if(!isAppBar && !isMenuBar) {
            isAppBar = isMenuBar = true; // mutually exclusive.  Neither targeted means put to both.
        }
        let included = true
        for(let n=0; n<target.length; n++) {
            let tc = target.charAt(n)
            included = false
            if(!tc.match(/[mwuai]/)) {
                included = true; // if it's none of these, all are good
            } else {
                if (tc === 'm') {
                    included = environment.runtime.platform.name === 'darwin'
                    break;
                }
                if (tc === 'w') {
                    included = environment.runtime.platform.name === 'win32'
                    break;
                }
                if (tc === 'u') {
                    included = environment.runtime.platform.name === 'linux'
                    break;
                }
                if (tc === 'a') {
                    included = environment.runtime.platform.name === 'android'
                    break;
                }
                if (tc === 'i') {
                    included = environment.runtime.platform.name === 'ios'
                    break;
                }
            }
        }
        return dest === 'Desktop' ? isMenuBar && included : isAppBar && included
    }

    /**
     * Used as part of platform differentiation during menu construction
     * @param {MenuItem} item
     * @param {string} dest
     * @private
     */
    private limitChildren(item:MenuItem, dest:string) {
        const children = item.children || []
        let dirty = true;
        while(dirty) {
            dirty = false;
            for (let i = 0; i < children.length; i++) {
                const child = children[i]
                if (!this.limitTarget(child, dest)) {
                    children.splice(i, 1)
                    dirty = true
                    break;
                }
            }
        }
    }
    /**
     * Remove an item from a menu list
     *
     * @param {string} menuPath 'menu path' identifying submenu location
     * @param {string} itemId   Identifier of the item to remove
     */
    deleteMenuItem(menuPath:string, itemId:string) {
        let topModel = this.model.getAtPath('menu.main')
        if(!topModel) {
            throw Error('MENU NOT FOUND')
        }

        const parentItem = this.getSubmenuFromPath(menuPath)
        const children = parentItem.children || []
        for(let i=0; i<children.length; i++) {
            if(children[i].id === itemId) {
                children.splice(i,1)
                break;
            }
        }
        parentItem.children = children

        // update the full model
        this.model.setAtPath('menu.main', topModel, true)

        this.app.ExtMenuApi && this.app.ExtMenuApi && this.app.ExtMenuApi.deleteMenuItem(menuPath, itemId)

    }

    /**
     * Replace an item in the menu list
     *
     * @param {string} menuPath 'menu path' identifying submenu location
     * @param {string} itemId   Identifier of item to replace
     * @param {MenuItem} updatedItem    New Item to replace with
     */
    changeMenuItem(menuPath:string, itemId:string, updatedItem:MenuItem) {
        let topModel = this.model.getAtPath('menu.main')
        if(!topModel) {
            throw Error('MENU NOT FOUND')
        }

        const parentItem = this.getSubmenuFromPath(menuPath)
        const children = parentItem.children || []
        for(let i=0; i<children.length; i++) {
            if(children[i].id === itemId) {
                children.splice(i,1, updatedItem)
                break;
            }
        }
        parentItem.children = children

        // update the full model
        this.model.setAtPath('menu.main', topModel, true)

        this.app.ExtMenuApi && this.app.ExtMenuApi.changeMenuItem(menuPath, itemId, updatedItem)

    }

    /**
     * Enables or disables a menu item.
     * Disabled items appear grayed out and cannot be selected.
     *
     * @param {string} itemId   The menu identifier to enable/disable
     * @param {boolean} enabled  `true` to enable, `false` to disable.
     */
    enableMenuItem(itemId:string, enabled: boolean) {
        let topModel = this.model.getAtPath('menu.main')
        const mi:MenuItem|undefined = this.getMenuItem(itemId)
        if(mi) mi.disabled = !enabled

        // update the full model
        this.model.setAtPath('menu.main', topModel, true)
        // echo to system menu
        this.app.ExtMenuApi && this.app.ExtMenuApi.enableMenuItem(itemId, enabled)
    }

    /**
     * Sets or unsets the checkmark for a checkbox item
     * Menu Item must be a checkbox type.
     *
     * @param {string} itemId   The menu identifier to check or uncheck.
     * @param {boolean} checked  `true` to check, `false` to uncheck.
     */
    checkMenuItem(itemId:string, checked: boolean) {
        let topModel = this.model.getAtPath('menu.main')
        const mi:MenuItem|undefined = this.getMenuItem(itemId)
        if(mi?.type === 'checkbox') {
            mi.checked = checked
        } else {
            console.error(`menu item ${itemId} is not a checkbox`)
            throw Error('INCORRECT MENU TYPE '+mi?.type)
        }
        // update the full model
        this.model.setAtPath('menu.main', topModel, true)

        this.app.ExtMenuApi && this.app.ExtMenuApi.checkMenuItem(itemId, checked)
    }

    /**
     * Find the item by id and return the MenuItem structure for it
     * @param {string} itemId  The identifier to find
     *
     * @return {MenuItem} found item, or undefined
     */
    getMenuItem(itemId:string):MenuItem|undefined {
        let topModel = this.model.getAtPath('menu.main')
        if(!topModel) {
            throw Error('MENU NOT PRESENT')
        }
        const findItem = (children:MenuItem[]):MenuItem|undefined => {
            for (let ch of children) {
                if (ch.id === itemId) {
                    return ch
                }
                if (ch.children?.length) {
                    let rt: MenuItem | undefined = findItem(ch.children)
                    if (rt) return rt;
                }
            }
        }
        return findItem(topModel.children || [])
    }

    /**
     * Clear the menu of all its items
     *
     * @param menuId
     */
    clearMenu(menuId:string) {
        let n = menuId.indexOf('-')
        if(n === -1) n = menuId.length
        let menuName = menuId.substring(0, n)
        let topModel = this.model.getAtPath('menu.'+menuName)
        if(!topModel) {
            console.error('menuId may not be complete ', menuId)
            throw Error('MENU NOT FOUND: '+menuName)
        }

        const parentItem = this.getSubmenuFromPath(menuId)
        parentItem.children = []

        // update the full model
        this.model.setAtPath('menu.'+menuName, topModel, true)

        this.app.ExtMenuApi && this.app.ExtMenuApi.clearMenu(menuId)
    }

    /**
     * Declares a set of toolbar tools
     *
     * @param {ToolItem[]} items  The toolbar items array
     */
    addToolbarItems(items:ToolItem[]) {
        try {
            this.app.model.setAtPath('toolbar.main', items)
        } catch(e) {
            const props = {}
            // @ts-ignore
            props[name] = items
            // console.log(">> adding toolbar section")
            this.app.model.addSection('toolbar', props)
        }
        try {
            items.forEach(tool => {
                // can theoretically bind to any of these,
                // but only 'state' is bound by the default implementation
                const props = {
                    state: tool.state,
                    label: tool.label,
                    className: tool.className,
                    type:tool.type,
                    tooltip:tool.tooltip
                }
                // console.log(">> adding toolbar section")
                this.app.model.addSection('toolbar-'+tool.id,  props)
            })
        } catch(e) {
            console.error(e)
        }
    }

    /**
     * Declares a set of indicators
     *
     * @param {ToolItem[]} items  The indicator items array
     */
    addIndicatorItems(items:IndicatorItem[]) {
        try {
            this.app.model.setAtPath('indicators.main', items)
        } catch(e) {
            const props = {}
            // @ts-ignore
            props[name] = items
            this.app.model.addSection('indicators', props)
        }
        try {
            items.forEach(indicator => {
                // can theoretically bind to any of these,
                // but only 'state' is bound by the default implementation
                const props = {
                    state: indicator.state,
                    label: indicator.label,
                    className: indicator.className,
                    type:indicator.type,
                    tooltip:indicator.tooltip
                }
                this.app.model.addSection('indicator-'+indicator.id,  props)
            })
        } catch(e) {
            console.error(e)
        }

    }

}

// -------------





