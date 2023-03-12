import { AppCore } from "../app-core/AppCore";
export declare class MenuItem {
    label: string;
    id: string;
    role?: string;
    type?: string;
    targetCode?: string;
    disabled?: boolean;
    checked?: boolean;
    sublabel?: string;
    tooltip?: string;
    icon?: string;
    iconSize?: number[];
    accelerator?: string;
    children?: MenuItem[];
}
export declare class IndicatorItem {
    id: string;
    label?: string;
    state: string;
    className?: string;
    type?: string;
    tooltip?: string;
    icons?: {};
}
export declare class ToolItem extends IndicatorItem {
    accelerator?: string;
}
export declare class MenuApi {
    private app;
    private model;
    constructor(app: AppCore);
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
    addMenuItem(menuId: string, item: MenuItem, position?: number): void;
    getSubmenuFromId(menuId: string): any;
    /**
     * Returns true if item is targeted for this platform
     * @param item The item
     * @param dest names destination menu type: either 'App' or 'Desktop'
     */
    limitTarget(item: MenuItem, dest: string): boolean;
    limitChildren(item: MenuItem, dest: string): void;
    /**
     * Remove an item from a menu list
     *
     * @param menuId
     * @param itemId
     */
    deleteMenuItem(menuId: string, itemId: string): void;
    /**
     * Replace an item in the menu list
     *
     * @param menuId
     * @param itemId
     * @param updatedItem
     */
    changeMenuItem(menuId: string, itemId: string, updatedItem: MenuItem): void;
    enableMenuItem(menuId: string, itemId: string, enabled: boolean): void;
    checkMenuItem(menuId: string, itemId: string, checked: boolean): void;
    /**
     * Clear the menu of all its items
     *
     * @param menuId
     */
    clearMenu(menuId: string): void;
    addToolbarItems(name: string, items: ToolItem[]): void;
    addIndicatorItems(name: string, items: IndicatorItem[]): void;
}
