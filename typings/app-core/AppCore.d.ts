import { AppModel } from "./AppModel";
import { MenuApi } from "../application/MenuApi";
import { PathUtils } from '../application/PathUtils';
import { StringParser } from '../general/StringParser';
import { ToolExtension } from "../extension/ToolExtension";
export declare function setMobileInjections(mbi: any): void;
export declare class HistoryRecord {
    pageId: string;
    context: object | undefined;
}
export declare function setTheApp(app: any, frame?: any): void;
export declare function getTheApp(): any;
/**
 *  Core object of the application.  Contains the app model and gateway functions for actions, which are
 *  mostly handled by action modules.
 */
export declare class AppCore {
    appModel: AppModel;
    rootPath: string;
    menuApi: MenuApi;
    activeMenu: any;
    currentActivity: any;
    history: HistoryRecord[];
    _pathUtils: PathUtils | undefined;
    menuHandlers: any;
    pageMount: any;
    componentGate: Promise<void>;
    modelGate: Promise<void>;
    componentGateResolver: any;
    modelGateResolver: any;
    pageUpdates: any;
    runTest: boolean;
    testDisposition: string;
    constructor();
    private checkForTest;
    /**
     * get the model used for binding to the UI.
     */
    get model(): AppModel;
    get MenuApi(): MenuApi;
    get Api(): any;
    get ExtMenuApi(): any;
    isMobile(): boolean;
    static getTheApp(): any;
    static setTheApp(app: any, frame: any): void;
    waitForModel(): Promise<unknown>;
    componentIsReady(): void;
    waitReady(): Promise<unknown>;
    setupUIElements(appFront: any): Promise<unknown>;
    setPlatformClass(env: any): void;
    setPathUtilInfo(env: any): any;
    setupMenu(menuPath: string): Promise<any>;
    setActiveMenu(menuComp: any): void;
    onMenuAction(props: any): Promise<any>;
    defaultAboutBox(): Promise<any>;
    onToolAction(props: any): void;
    callPageAction(name: string, ev: Event): void;
    /**
     * Register a global-scope handler for a menu or a tool action
     * or pass null instead of the handler function to clear it
     * @param menuId  menu action identifier
     * @param handler function to handle menu event
     */
    registerMenuHandler(menuId: string, handler: any): void;
    makeStringParser(string: string): StringParser;
    private keyListener;
    private attachPageKeyListener;
    private removePageKeyListener;
    /**
     * Replaces the currently mounted page markup with the markup of the named page
     * and starts the associated activity.
     *
     * @param {string} pageId
     * @param {object} [context]
     */
    navigateToPage(pageId: string, context?: object, skipHistory?: boolean): void;
    /**
     * Called by mobile page-launch wrapper (onLoaded) to set up bindings
     * This does basically what the navigateToPage code does in the second part for desktop
     */
    setPageBindings(pageId: string, activity: any, pageMethods: object): any;
    /**
     * Called by mobile page-launch wrapper (onNavigatedTo) to invoke the page logic (activity)
     * This does basically what the navigateToPage code does in the second part for desktop
     */
    launchActivity(pageId: string, activity: any): void;
    /**
     * reload the current page.
     * May be necessary on orientation change
     */
    reloadCurrentPage(): void;
    /**
     * Sets the data for a page
     * accessed via `bound.data` in page markup
     * There are two forms for this.
     * 1: Call with a single object argument following the page name to set all the properties of the 'data' object.
     * 2: Call with the property name, value to set an individual property of the page data object
     *
     * @param pageName - may pass with or without the '-page' suffix
     * @param item
     * @param value
     */
    setPageData(pageName: string, item: object | string, value?: any): void;
    updatePage(pageName: string): void;
    /**
     * Returns the data object for the named page, if one exists
     * @param pageName
     */
    getPageData(pageName: string): any;
    getFromCurrentPageData(accPath: string): any;
    /**
     * Called by mobile side to start the first activity only ('main')
     *
     * @param activity
     * @param context
     */
    startPageLogic(id: string, activity: any, context?: object): void;
    navigateBack(): void;
    findComponent(tagName: string, prop?: string, propValue?: string): any;
    /**
     * Dispatch an event to the current activity by name
     *
     * @param name
     * @param domEvent
     */
    callEventHandler(tag: string, platEvent: any, value?: any): void;
    private getComponent;
    get Path(): PathUtils;
    createExtensionType(name: string): any;
    callExtension(moduleName: string, functionName: string, ...args: any[]): any;
    getToolState(toolId: string): string;
    setToolState(toolId: string, state: string): void;
    toggleToolState(toolId:string, state:string, stateOthers:string): void;
    getIndicatorState(indId: string): string;
    setIndicatorState(indId: string, state: string): void;
    registerToolExtension(name: string, extension: ToolExtension): void;
    messageBox(options: any): Promise<any>;
    connectTestMethods(): void;
}
