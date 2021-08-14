declare module "@tremho/jove-common" {
    interface TBBackApp {}
    class FrameworkBackContext {
        registerExtensionModule(name:string, module:any)
    }
    function registerApp(targetPlatform:object, backApp:TBBackApp) : void
    class ToolExtension {}
    class AppModel {
        public addSection(name:string, props:object)
        public bind( component:any, section:string, prop:string, onChange:any, type?:string)
        public getAtPath(path:string):any
        public setAtPath(path:string, value:any, force?:boolean, noAnnounce?:boolean)
    }
    class AppCore {
        static getTheApp():any;
        static setTheApp(app:any, frame?:any);
        public model:AppModel;
        public findComponent(tagName:string):any;
        public navigateToPage(pageId:string, context?:object, skipHistory?:boolean)
        public callExtension(moduleName:string, functionName:string, ...args:any)
        // more to come as needed
    }
    class EventData {
        public app:AppCore|undefined
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
    }

}

declare module "add-resize-listener"
