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
}

declare module "add-resize-listener"
