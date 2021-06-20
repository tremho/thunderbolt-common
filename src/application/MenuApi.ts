
import {AppModel} from "../app-core/AppModel";
import {environment} from "../app-core/EnvCheck";
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
export class MenuItem {
    public label:string = ''
    public id:string = ''
    public role?:string // parsed and used for desktop (per Electron)
    public type?:string // submenu, separator, checkbox, radio; set to model
    public targetCode?:string // used to apply to different platforms
    public disabled?:boolean // true if menu listing should be shown as disabled; no action
    public checked?:boolean // true if box or radio type is in checked state
    public sublabel?:string // sublabel (set by mod, no effect on mac)
    public tooltip?:string // tooltip (set by mod)
    public icon?:string // icon path (set by mod)
    public iconSize?:number[]  // width and height of icon as an array (1 or 2 elements)
    public accelerator?:string // accelerator to apply
    public children?: MenuItem[] // found only in incoming submenus in parsing and setup
}

export class IndicatorItem {
    public id:string = ''       // identifier
    public label?:string    // optional label, appears over icon
    public state:string = ''    // current state.  will be echoed to data-state also.
    public className?:string    // optional css classname to apply to container
    public type?:string     // optional name of implementation object to be made by factory
    public tooltip?:string  // optional tooltip string appears on hover (desktop only)
    public icons?: {} // a map with states as keys to icon strings
}
export class ToolItem extends IndicatorItem{
    public accelerator?:string // accelerator to apply
}

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
     * @param {string} menuId Identifier of menu
     * @param {MenuItem }item entry
     * @param {number} [position] insert position, appends if undefined.
     * @param {number} [recurseChild] leave undefined; used in recursion
     */
    addMenuItem(menuId:string, item:MenuItem, position?:number) {

        let n = menuId.indexOf('-')
        if(n === -1) n = menuId.length
        let menuName = menuId.substring(0, n)
        let topItem = this.model.getAtPath('menu.'+menuName)
        if(!topItem) {
            topItem = new MenuItem()
            topItem.label = topItem.id = menuName
            topItem.children = []
            this.model.setAtPath('menu.'+menuName, topItem, true)
        }
        const parentItem = this.getSubmenuFromId(menuId)
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
            this.app.ExtMenuApi && this.app.ExtMenuApi.addMenuItem(menuId, item, position)
        }

        // update the full model
        this.model.setAtPath('menu.'+menuName, topItem, true)
    }

    getSubmenuFromId(menuId:string) {
        let n = menuId.indexOf('-')
        if(n === -1) n = menuId.length
        let menuName = menuId.substring(0, n)
        let topItem = this.model.getAtPath('menu.'+menuName)
        if(!topItem) {
            console.error('menuId may not be complete ', menuId)
            throw Error('MENU NOT FOUND: '+menuName)
        }
        const parts = menuId.split('-');
        if(!topItem.children) topItem.children = []
        let curMenu = topItem.children
        let parentItem = topItem;
        let pid = menuName
        for(let i=1; i<parts.length; i++) {
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
     * @param item The item
     * @param dest names destination menu type: either 'App' or 'Desktop'
     */
    limitTarget(item:MenuItem, dest:string) {
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
            }
            if(tc === 'm') {
                included = environment.platform.name === 'darwin'
                break;
            }
            if(tc === 'w') {
                included = environment.platform.name === 'win32'
                break;
            }
            if(tc === 'u') {
                included = environment.platform.name === 'linux'
                break;
            }
            if(tc === 'a') {
                included = environment.platform.name === 'android'
                break;
            }
            if(tc === 'i') {
                included =  environment.platform.name === 'ios'
                break;
            }
        }
        return dest === 'Desktop' ? isMenuBar && included : isAppBar && included
    }
    limitChildren(item:MenuItem, dest:string) {
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
     * @param menuId
     * @param itemId
     */
    deleteMenuItem(menuId:string, itemId:string) {
        let n = menuId.indexOf('-')
        if(n === -1) n = menuId.length
        let menuName = menuId.substring(0, n)
        let topModel = this.model.getAtPath('menu.'+menuName)
        if(!topModel) {
            console.error('menuId may not be complete ', menuId)
            throw Error('MENU NOT FOUND: '+menuName)
        }

        const parentItem = this.getSubmenuFromId(menuId)
        const children = parentItem.children || []
        for(let i=0; i<children.length; i++) {
            if(children[i].id === itemId) {
                children.splice(i,1)
                break;
            }
        }
        parentItem.children = children

        // update the full model
        this.model.setAtPath('menu.'+menuName, topModel, true)

        this.app.ExtMenuApi && this.app.ExtMenuApi && this.app.ExtMenuApi.deleteMenuItem(menuId, itemId)

    }

    /**
     * Replace an item in the menu list
     *
     * @param menuId
     * @param itemId
     * @param updatedItem
     */
    changeMenuItem(menuId:string, itemId:string, updatedItem:MenuItem) {
        let n = menuId.indexOf('-')
        if(n === -1) n = menuId.length
        let menuName = menuId.substring(0, n)
        let topModel = this.model.getAtPath('menu.'+menuName)
        if(!topModel) {
            console.error('menuId may not be complete ', menuId)
            throw Error('MENU NOT FOUND: '+menuName)
        }

        const parentItem = this.getSubmenuFromId(menuId)
        const children = parentItem.children || []
        for(let i=0; i<children.length; i++) {
            if(children[i].id === itemId) {
                children.splice(i,1, updatedItem)
                break;
            }
        }
        parentItem.children = children

        // update the full model
        this.model.setAtPath('menu.'+menuName, topModel, true)

        this.app.ExtMenuApi && this.app.ExtMenuApi.changeMenuItem(menuId, itemId, updatedItem)

    }

    enableMenuItem(menuId:string, itemId:string, enabled: boolean) {
        let n = menuId.indexOf('-')
        if(n === -1) n = menuId.length
        let menuName = menuId.substring(0, n)
        let topModel = this.model.getAtPath('menu.'+menuName)
        if(!topModel) {
            console.error('menuId may not be complete ', menuId)
            throw Error('MENU NOT FOUND: '+menuName)
        }

        const parentItem = this.getSubmenuFromId(menuId)
        const children = parentItem.children || []
        for(let i=0; i<children.length; i++) {
            if(children[i].id === itemId) {
                children[i].disabled = !enabled
                break;
            }
        }
        parentItem.children = children

        // update the full model
        this.model.setAtPath('menu.'+menuName, topModel, true)

        this.app.ExtMenuApi && this.app.ExtMenuApi.enableMenuItem(menuId, itemId, enabled)
    }

    checkMenuItem(menuId:string, itemId:string, checked: boolean) {
        let n = menuId.indexOf('-')
        if(n === -1) n = menuId.length
        let menuName = menuId.substring(0, n)
        let topModel = this.model.getAtPath('menu.'+menuName)
        if(!topModel) {
            console.error('menuId may not be complete ', menuId)
            throw Error('MENU NOT FOUND: '+menuName)
        }

        const parentItem = this.getSubmenuFromId(menuId)
        const children = parentItem.children || []
        for(let i=0; i<children.length; i++) {
            if(children[i].id === itemId) {
                if(children[i].type === 'checkbox') {
                    children[i].checked = checked
                } else {
                    console.error('menu item ${menuId},${itemId} is not a checkbox')
                    throw Error('INCORRECT MENU TYPE '+children[i].type)
                }
                break;
            }
        }
        parentItem.children = children

        // update the full model
        this.model.setAtPath('menu.'+menuName, topModel, true)

        this.app.ExtMenuApi && this.app.ExtMenuApi.checkMenuItem(menuId, itemId, checked)
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

        const parentItem = this.getSubmenuFromId(menuId)
        parentItem.children = []

        // update the full model
        this.model.setAtPath('menu.'+menuName, topModel, true)

        this.app.ExtMenuApi && this.app.ExtMenuApi.clearMenu(menuId)
    }

    addToolbarItems(name:string, items:ToolItem[]) {
        try {
            this.app.model.setAtPath('toolbar.' + name, items)
        } catch(e) {
            const props = {}
            // @ts-ignore
            props[name] = items
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
                this.app.model.addSection('toolbar-'+tool.id,  props)
            })
        } catch(e) {
            console.error(e)
        }
    }

    addIndicatorItems(name:string, items:IndicatorItem[]) {
        try {
            this.app.model.setAtPath('indicators.' + name, items)
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





