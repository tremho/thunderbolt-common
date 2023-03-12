import { ComBinder } from './ComBinder';
import { AppCore } from "./AppCore";
import { AppModel } from "./AppModel";
export declare type LocalBind = [any, string, string];
declare let NotCommon: any;
export declare class ComCommon extends NotCommon {
    private readonly fits;
    private fitNum;
    private comBinder;
    private readonly _app;
    private readonly _model;
    private bound;
    constructor(arg: any);
    get app(): AppCore;
    get model(): AppModel;
    /**
     * return the instance of the Presentation class that has been exposed as a property in the app root
     * (in other words, the app of the Page)
     * @returns {AppCore}
     */
    getApp(): AppCore;
    getCombinder(): ComBinder;
    /**
     * Call to wait for model to be ready before binding
     */
    waitForModel(): Promise<unknown>;
    /**
     * Call to announce the component is created and bound to model
     */
    componentIsReady(): void;
    addProperty(name: string, value: any): void;
    evalBinding(name: string): any;
    /**
     * gets the Riot Component instance that the given DOM element belongs to
     *
     * @param {HTMLElement} el
     * @returns Riot component
     */
    getComponent(arg: any): any;
    /**
     * Returns the component that is the optionally named ancestor of the given component
     * @param {*} comp - component that is child of parent sought
     * @param {string} [tag]  - optional tag to find in ancestry tree, or immediate parent if not given.
     * @returns {*} riot-component
     */
    getComponentParent(comp: any, tag?: string): any;
    getPageComponent(): any;
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
    getComponentChild(comp: any, tag?: string, ordinal?: number): any;
    /**
     * Find the child component that owns the given element
     * @param {*} containingComp - component that we are searching within
     * @param {HTMLElement} element - element we are searching for
     * @returns {number} the index of the child in the parent, or -1 if not found
     */
    findChildIndexWithElement(containingComp: any, element: HTMLElement): number;
    /**
     * return the DOM element of the <div> container that all of our Riot components consist of
     * as their container.
     * @param {*} [riot] // if not passed, uses the one that created this class
     * @returns {HTMLElement}
     */
    getContainer(riot?: any): HTMLElement;
    /**
     * Returns the value of an attribute in the component markup.
     * @param component
     * @param attName
     * @return {*|string}
     */
    getComponentAttribute(component: any, attName: string): string;
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
    parseFits(props: {
        fit: string;
        orientation: string;
    }): void;
    /**
     * Applies the sizes parsed in 'fits' to the container children
     * @param {boolean} isHorizontal
     */
    applyFits(isHorizontal: boolean): void;
    /** picks the next parsed fit value, or the last one if list was exhausted */
    nextFit(): string;
    /**
     * commute from markup common values like width, height, and background, backgroundColor
     *
     * @param {HTMLElement} el Element to set props on
     * @param {object} props properties with values to set
     * @param {object} defaults defaults to use if props not specified
     */
    setCommonProps(el: HTMLElement, props: any, defaults?: any): void;
    setCommonPropsMobile(component: any, defaults: any): void;
    /**
     * Applies a 'style' line of css values to the given container element
     *
     * @param div
     * @param styleText
     */
    applyContainerStyles(div: HTMLElement, styleText: string): void;
    /**
     * Set up the binding for this component
     * Inherit bindings of parent scope(s) and append/modify locally.
     */
    bindComponent(): void;
    getComBinder(): ComBinder;
    /**
     * Used by mobile side ComponentBase to bind to inner views
     * @param localBinds Array of view/name/prop values (in an array) that bind the prop of the view to the local name
     */
    setLocalBinds(localBinds: LocalBind[]): void;
}
export declare function newCommon(component: any): ComCommon;
export {};
