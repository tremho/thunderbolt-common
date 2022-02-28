import {ComCommon} from "./typings/app-core/ComCommon";

declare module "@tremho/jove-common" {

    class PathParts {
        root: string;
        dir: string;
        base: string;
        name: string;
        ext: string;
    }
    function setPlatform(plat: string): void;
    function setCurrentWorkingDirectory(cwd: string): void;
    function setHomeDirectory(userDir: string): void;
    function setAssetsDirectory(path: string): void;
    function setAppDataDirectory(path: string): void;
    function setDocumentsDirectory(path: string): void;
    function setDownloadsDirectory(path: string): void;
    function setDesktopDirectory(path: string): void;
    function getRemoteSetters(): {
        setPlatform: typeof setPlatform;
        setCurrentWorkingDirectory: typeof setCurrentWorkingDirectory;
        setHomeDirectory: typeof setHomeDirectory;
        setAssetsDirectory: typeof setAssetsDirectory;
        setAppDataDirectory: typeof setAppDataDirectory;
        setDocumentsDirectory: typeof setDocumentsDirectory;
        setDownloadsDirectory: typeof setDownloadsDirectory;
        setDesktopDirectory: typeof setDesktopDirectory;
    };
    class PathUtils {
        /**
         * Gets the posix version of this API, regardless of the recognized platform
         */
        get posix(): any;
        /**
         * Gets the windows version of this API, regardless of the recognized platform
         */
        get win32(): any;
        /**
         * Returns the path delimiter (as in what separates paths in the path environment variable)
         */
        get delimiter(): string;
        /**
         * Returns the path folder separator (e.g. '/' or '\')
         */
        get sep(): string;
        /**
         * Returns which platform we are under
         */
        get platform(): string;
        /**
         * returns the user's home directory
         */
        get home(): string;
        /**
         * returns the working directory of the executable
         */
        get cwd(): string;
        /**
         * returns the directory of the assets folder
         * may be undefined if not found in expected location
         */
        get assetsPath(): string;
        /**
         * returns the directory of the application files
         * may be undefined for Linux, or if not found in expected location
         */
        get appDataPath(): string;
        /**
         * returns the directory reserved  for user documents
         * may be undefined for Linux, or if not found in expected location
         */
        get documentsPath(): string;
        /**
         * returns the directory reserved  for user downloads
         * may be undefined for Linux, or if not found in expected location
         */
        get downloadsPath(): string;
        /**
         * returns the directory reserved  for system desktop
         * may be undefined for Linux, or if not found in expected location
         */
        get desktopPath(): string;
        /**
         * Returns the directory of the current path (i.e. no basename)
         * @param path
         */
        dirname(path: string): string;
        /**
         * Returns the basename of the file referenced in this path (i.e. filename w/o extension)
         * @param path
         */
        basename(path: string): string;
        /**
         * Returns the extension of the file referenced in this path
         * @param path
         */
        extension(path: string): string;
        /**
         * Formats a path from a structured set of properties
         * @param {PathParts} parts
         */
        format(parts: PathParts): string;
        /**
         * Deconstructs a path into a structured set of properties
         * @param path
         */
        parse(path: string): PathParts;
        isAbsolute(path: string): boolean;
        /**
         * Joins path segments with appropriate separator
         * @param paths
         */
        join(...paths: string[]): string;
        /**
         * Normalize a path to remove redundancies
         * @param path
         */
        normalize(path: string): string;
        /**
         * Construct a relative path from a larger path to subset base
         * @param from
         * @param to
         */
        relative(from: string, to: string): string;
        /**
         * Resolve a relative or absolute path into a fully qualified absolute path
         * @param paths
         */
        resolve(...paths: string[]): string;
    }


    export type FrameworkFrontContext = any // treat as any here. But in reality it will be AppCore from the front process

    /** Callback for __appStart__ lifecycle */
    export type BackAppStartCallback = (context:FrameworkBackContext) => void
    /** Callback for __appExit__ lifecycle */
    export type BackAppExitCallback = (context:FrameworkBackContext) => void

    /** Callback for __appStart__ lifecycle */
    export type FrontAppStartCallback = (context:FrameworkFrontContext) => Promise<void>
    /** Callback for __appExit__ lifecycle */
    export type FrontAppExitCallback = (context:FrameworkFrontContext) => Promise<void>

    /** Callback for __pageBegin__ lifecycle */
    export type PageBeginCallback = (context:FrameworkFrontContext, userData:any) => Promise<void>

    /** Callback for __pageDone__ lifecycle */
    export type PageDoneCallback = (context:FrameworkFrontContext, userData:any) => Promise<void>

    class HistoryRecord {
        pageId: string;
        context: object | undefined;
    }
    class StringParser {
        private parseString;
        private parsePos;
        /**
         * Constructs a StringParser object, setting up a string to be parsed
         *
         * @param parseString
         */
        constructor(parseString: string);
        /**
         * Moves just behind the match occurrence, looking forward
         *
         * @param match
         */
        aheadTo(match: string): void;
        /**
         * Moves just forward of the match occurrence, looking forward
         * @param match
         */
        aheadPast(match: string): void;
        /**
         * Moves just forward the match occurrence, looking backward.
         * @param match
         */
        backTo(match: string): void;
        /**
         * Moves to the start of the match occurrence, looking backward.
         * @param match
         */
        backBefore(match: string): void;
        /**
         * Reads the word next in the parse string.
         * "Word" is terminated by the occurrence of one of the given delimiters.
         *
         * @param delimiters
         */
        readNext(delimiters?: string[]): string;
        /**
         * Reads the word prior to the current position.
         * "Word" is terminated by the occurrence of one of the given delimiters.
         *
         * @param delimiters
         */
        readPrevious(delimiters?: string[]): string;
        /**
         * advances past any interceding whitespace at current position.
         */
        skipWhitespace(): void;
        /**
         * Returns the remaining part of the string ahead of parse position
         */
        getRemaining(): string;
        /**
         * Moves the current parse position the given amount
         * @param charCount
         */
        advancePosition(charCount: number): void;
        /**
         * Returns the current parse position
         */
        get parsePosition(): number;
    }

    class CompInfo {
        info: any;
        component: any;
    }
    class ToolExtension {
        /**
         * When component is first mounted into layout, not yet rendered.
         * @param component
         */
        onSetToPage(compInfo: CompInfo): void;
        /**
         * When there has been a change in state
         * @param component
         * @param state
         */
        onStateChange(compInfo: CompInfo, state: string | undefined): void;
        /**
         * When the component has been pressed
         * (mousedown, or touch event)
         * @param component
         * @return {boolean} return true to prevent propagation / click handling
         */
        onPress(compInfo: CompInfo): void;
        /**
         * WHen the component has been released
         * (mouseup or touch release)
         * @param component
         */
        onRelease(compInfo: CompInfo): void;
    }
    class MenuItem {
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
    class IndicatorItem {
        id: string;
        label?: string;
        state: string;
        className?: string;
        type?: string;
        tooltip?: string;
        icons?: {};
    }
    class ToolItem extends IndicatorItem {
        accelerator?: string;
    }
    class MenuApi {
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
        getMenuItem(itemId:string):MenuItem|undefined
        /**
         * Clear the menu of all its items
         *
         * @param menuId
         */
        clearMenu(menuId: string): void;
        addToolbarItems(name: string, items: ToolItem[]): void;
        addIndicatorItems(name: string, items: IndicatorItem[]): void;
    }
    class KModelPathError extends Error {
        constructor(message: string);
    }
    /**
     * Extends Error to define a bad access path to the model was encountered
     *
     * @param message
     * @constructor
     */
    function ModelPathError(message: string): KModelPathError;
    class EventData {
        app: any;
        sourceComponent: any;
        eventType: string | undefined;
        public eventName: string | undefined;
        tag: string | undefined;
        value?: any;
        platEvent: any;
    }
    class MenuEvent {
        id : string
        app : AppCore
    }
    class Bounds {
        x: number;
        y: number;
        width: number;
        height: number;
        get left(): number;
        get top(): number;
        get right(): number;
        get bottom(): number;
        get cx(): number;
        get cy(): number;
    }
    class ComNormal {
        stdComp: any;
        /**
         * Create the API implementation handler with reference to the Component that owns it
         * @param stdComp
         */
        constructor(stdComp: any);
        /**
         * Checks for an iOS implementation
         * @returns true if we're running on an iOS device
         */
        get isIOS(): boolean;
        /**
         * Checks for an Android implementation
         * @returns true if we're running on an Android device
         */
        get isAndroid(): boolean;
        /**
         * Checks for a mobile implementation
         * @returns true if running under Nativescript on an Android or iOS device
         */
        get isMobile(): boolean;
        /**
         * Finds the first child component (aka 'element') of the given tag within the scope of this component
         * @param {string} tag Tag name to find (e.g. 'div')
         * @returns {*} the Element or View found, or undefined if none found
         */
        elementFind(tag: string): any;
        /**
         * Returns an array of all child components, possibly nested, of teh given tag found within the scope of this component
         * @param {string} tag Tag name to find (e.g. 'div')
         * @returns {*[]} an array of the Elements or Views found, or undefined if none found
         */
        elementFindAll(tag: string): any[];
        private mobileFind;
        /**
         * Get a value of a property set in the component markup
         * @param propName
         */
        getProp(propName: string): any;
        registerHandler(comp: any, action: string, func: any): void;
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
        listenToFor(el: any, pseudoEventTag: string, func: (ed: any) => {}): void;
        /**
         * Gets the dimensions of a subcomponent ('element')
         *
         * @param {*} element  the Element or View to be measured
         * @returns {Bounds} {x, y, width, height, left, top, right, bottom, cx, cy} where the first 4 properties are
         * r/w and the others read-only. cx/cy refer to element center.
         */
        getElementBounds(element: any): Bounds;
        /**
         * Set a style property to the given value and units
         * This should replace statements like `el.style.width = '12px'` with `setStyleProp(el, 'width', 12, 'px'
         * Can also set non-numeric props, like `setStyle(bgEl, 'backgroundSize', 'contain')`
         *
         * @param {*}  el Element or View to set prop for
         * @param {string} prop Name of property to set
         * @param {number|string} value Value to set for this property
         * @param {string} unit CSS unit type (e.g. px, %, em, in, etc)
         */
        setStyleProp(el: any, prop: string, value: number | string, unit?: string): void;
        addClass(className: string | string[]): void;
        removeClass(className: string | string[]): void;
    }

    /**
     * The AppModel object holds the realized Application model sections and provides
     * methods for creating, accessing, and binding to these values.
     */
    class AppModel {
        private model;
        /**
         * Creates a new section in the model.
         * Initial properties for this section are supplied by the `props` parameter.
         * Additional properties may be set to this section using the `setAtPath` method, with `force` = true.
         *
         * @param {string} name Name for the new section
         * @param {object} props Initial values to apply to this section.
         */
        addSection(name: string, props: object): void;
        /**
         * The `bind` method is called from the component layer.
         * The 'type' may be 'read' (upward from model to component) or
         * 'write' (downward from component to model) or the default, ('readwrite') which registers in both directions.
         *
         * THe onChange function takes the form: `(comp:any, prop:string, value:any, oldValue:any):void`
         *
         * @param {*} component The component to bind to
         * @param {string} section Section name where this binding is recorded
         * @param {string} prop Property in the section to bind to
         * @param {function} onChange Function to call on update of this value.
         * @param {string} [type] 'read', 'write', or 'readwrite' as the default.
         */
        bind(component: any, section: string, prop: string, onChange: any, type?: string): void;
        /**
         * Return proxy section at the given path
         *
         * @param {string} path The path to extract the section from
         * @return {Section} The section named
         *
         * @throws {ModelPathError} if the section path does not exist
         * @private
         */
        private accessSection;
        /**
         * Return the value stored in the model at the given section.property path
         * @param {string} path The section.property name location of the value to retrieve
         * @return {any} the value at that location
         *
         * @throws {ModelPathError} if the section path does not exist
         */
        getAtPath(path: string): any;
        /**
         * Sets the value in the model at the given path and communicates the change to any of its bound components.
         *
         * @param {string} path dot-form path of section and property of the model value to retrieve ('sect.prop')
         * @param {any} value Value to set at this path location
         * @param {boolean} [force] optional. If true, forces the value to be set even if the types do not match, or if
         * the property for this section previously did not exist. Necessary if setting a new property on a section
         * (note the section must exist first)
         *
         * @throws {ModelPathError} if the section path does not exist
         * @throws {TypeError} if `force` is not true, and new value changes the type, or if the property does not exist.
         */
        setAtPath(path: string, value: any, force?: boolean, noAnnounce?: boolean): void;

        /**
         * Forces an update for a component bound to this model path without changing the value
         * @param {string} path dot-form path of section and property of the model value to retrieve ('sect.prop')
         */
        forceUpdate(path:string)
    }

    class FrameworkBackContext {
        electronWindow: any;
        electronApp: any;
        nativescriptApp: any;
        backApp: TBBackApp;
        title: string;
        appName: string;
        windowKeeper: any;
        passedEnvironment: any;
        startupPromises: Promise<unknown>[];
        constructor(backApp: TBBackApp);
        beginStartup(): void;
        createWindow(): void;
        /**
         * Register an extension that is run on the back-side
         * @param name
         * @param module
         */
        registerExtensionModule(name: string, module: any): void;
    }
    interface TBBackApp {
        appStart: BackAppStartCallback;
        appExit: BackAppExitCallback;
        options?: any;
    }
    interface TBFrontApp {
        appStart: FrontAppStartCallback;
        appExit: FrontAppExitCallback;
        passEnvironment(env: any): void;
        getPassedEnvironment(): any;
    }
    interface TBPage {
        pageBegin: PageBeginCallback;
        pageDone: PageDoneCallback;
    }
    function registerApp(targetPlatform:object, backApp:TBBackApp) : void

    class AppCore {
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
        constructor();
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
        onMenuAction(props: MenuEvent): Promise<any>;
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
    }
    class StdComp {
        tagName: string;
        bound: {};
        cm: ComCommon;
        com: ComCommon;
        comNormal: ComNormal;
        onBeforeMount(props: any, state: any): void;
        onMounted(props: any, state: any): void;
        onBeforeUpdate(props: any, state: any): void;
        onUpdated(props: any, state: any): void;
        onBeforeUnmount(props: any, state: any): void;
        onUnmounted(props: any, state: any): void;
        readonly isIOS: boolean;
        readonly isAndroid: boolean;
        readonly isMobile: boolean;
        getProp(propName: string): any;
        elementFind(tag: string): any;
        elementFindAll(tag: string): any[];
        listenToFor(el: any, pseudoEventTag: string, func: (ed: any) => {}): void;
        getElementBounds(element: any): any;
        setStyleProp(el: any, prop: string, value: number | string, unit?: string | undefined): void;
    }
}

declare module "add-resize-listener"
