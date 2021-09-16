import {PathUtils} from "./typings";
import {StringParser} from "./typings/general/StringParser";
import {HistoryRecord} from "./typings/app-core/AppCore";


declare module "@tremho/jove-common" {
    interface TBBackApp {}
    class FrameworkBackContext {
        registerExtensionModule(name:string, module:any)
    }
    function registerApp(targetPlatform:object, backApp:TBBackApp) : void
    class ToolExtension {}
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
    }
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
        get MainApi(): any;
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
        getIndicatorState(indId: string): string;
        setIndicatorState(indId: string, state: string): void;
        registerToolExtension(name: string, extension: ToolExtension): void;
        messageBox(options: any): Promise<any>;
    }
    class EventData {
        public app:AppCore
        public sourceComponent:any
        public eventType:string|undefined
        public tag:string|undefined
        public value?:any
        public platEvent:any
    }
    class MenuItem {
        public label:string
        public id:string
        public role?:string // parsed and used for desktop (per Electron)
        public type?:string // submenu, separator, checkbox, radio; set to model
        public targetCode?:string // used to apply to different platforms
        public disabled?:boolean // true if menu listing should be shown as disabled; no action
        public checked?:boolean // true if box or radio type is in checked state
        public sublabel?:string // sublabel (set by mod, no effect on mac)
        public tooltip?:string // tooltip (set by mod)
        public icon?:string // icon path (set by mod)
        public accelerator?:string // accelerator to apply
        public children?: MenuItem[] // found only in incoming submenus in parsing and setup
    }
    class ComNormal {
        constructor(stdComp:any)
        get isIOS(): boolean
        get isAndroid(): boolean
        get isMobile(): boolean
        elementFind(tag:string):any
        elementFindAll(tag:string):any[]
        listenToFor(el:any, pseudoEventTag:string, func:(ed:any)=>{}, remove?:boolean)
        getElementBounds(element:any)
        setStyleProp(el:any, prop:string, value:number|string, unit?:string)
    }

}

declare module "add-resize-listener"
