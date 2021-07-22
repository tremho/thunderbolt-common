declare module "thunderbolt-common" {
    interface TBBackApp {}
    class FrameworkBackContext {
        registerExtensionModule(name:string, module:any)
    }
    function registerApp(targetPlatform:object, backApp:TBBackApp) : void
    class ToolExtension {}
    class AppCore {
        static getTheApp():any;
        static setTheApp(app:any, frame?:any);
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

}

declare module "add-resize-listener"
