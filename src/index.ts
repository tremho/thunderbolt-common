
/*
    Jove Framework
    Main Source file
    Defines all exports of the framework API for use by adopting apps.
*/

// console.log("%%%%%%%%%%%%%%%%%%%%% top of index.js (common) %%%%%%%%%%%%%%%%%%%%%")

let electronApp:any, BrowserWindow:any, preloadPath:string, AppGateway:any, ipcMain:any
let makeWindowStatePersist:any
let nscore:any, nativescriptApp:any, registerExtensionModule:any
let startupTasks:any

let frameworkContext:any

// bridged in injection for mobile
let comCommon = require('./app-core/ComCommon')
import {getTheApp, setMobileInjections} from "./app-core/AppCore";

// console.log("%%%%%%%%%%% past basic discovery %%%%%%%%%%%%%%%")
// console.log("isNS = "+isNS)

function injectDependencies(injected:any) {
        electronApp = injected.electronApp
        BrowserWindow = injected.BrowserWindow
        preloadPath = injected.preloadPath
        AppGateway = injected.AppGateway
        ipcMain = injected.ipcMain
        nscore = injected.nscore
        nativescriptApp = injected.nativescriptApp
        registerExtensionModule = injected.registerExtensionModule
        makeWindowStatePersist = injected.makeWindowStatePersist
        startupTasks = injected.startupTasks

        const ComponentBase = injected.ComponentBase
        if(ComponentBase) {
            ComponentBase.bridgeAppGetter(getTheApp, comCommon)

        }

        // console.log('%%%%%% injection happens %%%%%%%%')
        // console.log('index injections')
        // Object.getOwnPropertyNames(injected).forEach(p => {
        //     console.log('  '+p+': '+ typeof injected[p])
        // })
        // console.log("%%%%%%%%%%%%%%%%")

}

/**
 * defines the Framework access object passed to the __appStart__ lifecycle callback for the back process
 */
export class FrameworkBackContext {
    public electronWindow:any
    public electronApp: any
    public nativescriptApp:any
    public backApp: TBBackApp
    public title:string = 'jove-app'
    public appName:string = 'jove-app'
    // public frontApp: TBFrontApp | undefined
    public windowKeeper: any
    passedEnvironment:any = {}
    startupPromises:Promise<unknown>[] = []


    constructor(backApp: TBBackApp) {
        this.electronApp = electronApp
        this.nativescriptApp = nativescriptApp
        this.backApp = backApp

        // console.log('Framework back app constructor')

        this.beginStartup()

        // console.log(">> waiting on startup Promises")
        Promise.all(this.startupPromises).then(() => {
            // console.log(">> Startup Promises resolve")
            try {
                const {appName, title} = startupTasks.passEnvironmentAndGetTitles()
                this.appName = appName
                this.title = title
            } catch(e) {
                console.error('Error passing environment ', e)
            }
            try {
                this.backApp && this.backApp.appStart(this)
                if (electronApp) this.createWindow()
                if (nativescriptApp) {
                    nativescriptAppEvents()
                    nativescriptApp.run({moduleName: 'app-root'})
                }

            } catch(e) {
                console.error('Startup Error in final run handoff', e)
            }
        })
    }

    beginStartup() {
        try {
            // console.log(">> in common beginStartup()")
            this.startupPromises.push(Promise.resolve(startupTasks.readBuildEnvironment()))
            if (electronApp) {
                // console.log('electron app. Pushing whenReady')
                this.startupPromises.push(electronApp.whenReady)
                // console.log('adding electron state event listeners')
                electronApp.on('activate', () => {
                    // console.log('Framework back app Activated')
                    // On macOS it's common to re-create a window in the app when the
                    // dock icon is clicked and there are no other windows open.
                    if (BrowserWindow.getAllWindows().length === 0) this.createWindow()
                })
                // Quit when all windows are closed, except on macOS. There, it's common
                // for applications and their menu bar to stay active until the user quits
                // explicitly with Cmd + Q.
                electronApp.on('window-all-closed', () => {
                    if (process.platform !== 'darwin') {
                        console.warn('TODO: call appExit from here')
                        // TODO: Check Electron docs for an explicit quit event and trap there instead
                        Promise.resolve(this.backApp.appExit(this)).then(() => {
                            electronApp.quit()
                        })
                    }
                })
            }
        } catch(e) {
            console.error('Error in beginStartup', e)
        }
    }

    createWindow (): void {
        if(this.electronApp) {
            this.windowKeeper = makeWindowStatePersist(this.appName)
            // console.log('window keeper before restore', this.windowKeeper)
            this.windowKeeper.restore().then(() => {
                // console.log('window keeper after restore', this.windowKeeper)
                // Create the browser window.
                const mainWindow = new BrowserWindow({
                    width: this.windowKeeper.width || (this.backApp.options && this.backApp.options.width) || 800,
                    height: this.windowKeeper.height || (this.backApp.options && this.backApp.options.height) || 600,
                    x: this.windowKeeper.x || (this.backApp.options && this.backApp.options.startX) || 0,
                    y: this.windowKeeper.y || (this.backApp.options && this.backApp.options.startY) || 0,
                    icon: __dirname + '/assets/icon.png',
                    title: this.title,
                    webPreferences: {
                        nodeIntegration: false, // we handle all the node stuff back-side
                        contextIsolation: true, // gateway through window.api
                        enableRemoteModule: false,
                        preload: preloadPath
                    }
                })
                // console.log('window keeper before track', this.windowKeeper)
                this.windowKeeper.track(mainWindow)
                // console.log('window keeper after track', this.windowKeeper)

                // send window events via ipc
                mainWindow.on('resize', (e: any) => {
                    const size = mainWindow.getSize()
                    // console.log('electron sees resize ', size)
                    AppGateway.sendMessage('EV', {subject: 'resize', data: size})
                })

                // and load the index.html of the app.
                mainWindow.loadFile('./front/index.html')

                // TODO: Make subject to options
                mainWindow.fullScreen = (this.backApp.options && this.backApp.options.fullScreen) || false
                // Open the DevTools.
                if ((this.backApp.options && this.backApp.options.devTools)) {
                    mainWindow.webContents.openDevTools()
                }

                this.electronWindow = mainWindow
            })
        }
    }

    /**
     * Register an extension that is run on the back-side
     * @param name
     * @param module
     */
    registerExtensionModule(name:string, module:any) {
        // console.log('registering: registerExtensionModule(name, module)', registerExtensionModule)
        registerExtensionModule(this, name, module)
    }
}


/**
 * The framework front context is an AppCore instance
 */
type FrameworkFrontContext = any // treat as any here. But in reality it will be AppCore from the front process

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

/**
 * Signature for a Jove app registration, back (main) process
 */
export interface TBBackApp {
    appStart: BackAppStartCallback
    appExit: BackAppExitCallback
    options: any
}
/**
 * Signature for a Jove app registration, front (render) process
 */
export interface TBFrontApp {
    appStart: FrontAppStartCallback
    appExit: FrontAppExitCallback
    passEnvironment(env:any):void
    getPassedEnvironment():any
}

/**
 * Signature for a Jove page
 */
export interface TBPage {
    pageBegin: PageBeginCallback
    pageDone: PageDoneCallback
}

/**
 * A Jove app main startup code calls here to establish the
 * functional app core of the application.  The app core instance passed
 * must satisfy the interface requirements for {@link: TBBackApp}
 *
 * @param {TBApp} app
 */
export function registerApp(injected:any, backApp:TBBackApp) : void {

    // console.log('>>>>> Start of Framework: Register App')

    // console.log('injections incoming:', injected)

    injectDependencies(injected) // bring in our target



    if(injected.electronApp) {
        new AppGateway(ipcMain)  // wire up front and back
        console.log('Launching Electron App\n')
    } else {
        // do injections into app core from mobile
        const mbi:any = {
            nscore: injected.nscore,
            nsapplication: injected.nativescriptApp,
            mainApi: injected.mainApi,
            callExtensionApi: injected.callExtensionApi,
            setCallTestRequest: injected.setCallTestRequest
        }
        // console.log('☞ setting mobile injections from index.js, and setCallTestRequest is ', typeof mbi.setCallTestRequest)
        setMobileInjections(mbi)
        console.log('Starting Nativescript App\n')
    }
    // console.log('Completing launch through FrameworkBackContext constructor')
    frameworkContext = new FrameworkBackContext(backApp) // the constructor takes it away
}

export const Log = {
    debug(...a:any[]) {console.log(...a)},
    log(...a:any[]) {console.log(...a)},
    info(...a:any[]) {console.log(...a)},
    warn(...a:any[]) {console.warn(...a)},
    error(...a:any[]) {console.error(...a)},
    exception(...a:any[]) {console.error(...a)}
}

import {AppCore} from './app-core/AppCore'
import {EventData} from './app-core/EventData'
import {MenuItem, MenuApi} from "./application/MenuApi";
import {setupMenu} from "./application/MenuDef";
import {PathParts, PathUtils} from "./application/PathUtils";
import {ToolExtension} from "./extension/ToolExtension";
import {ComNormal} from "./app-core/ComNormal";

export {AppCore as AppCore}
export {MenuItem as MenuItem}
export {MenuApi as MenuApi}
export {setupMenu as setupMenu}
export {PathUtils as PathUtils}
export {ToolExtension as ToolExtension}
export {EventData as EventData}
export {ComNormal as ComNormal}

function nativescriptAppEvents() {

    // App Launch
    nativescriptApp.on(nativescriptApp.launchEvent, (args: any) => {
        console.log("Root View: ", args.root);
        console.log("The application was launched!");
    })
    // App suspend
    nativescriptApp.on(nativescriptApp.suspendEvent, (args: any) => {
        console.warn("The application was suspended!");
    })
    // App resumed
    nativescriptApp.on(nativescriptApp.resumeEvent, (args: any) => {
        console.warn("The application was resumed!");
    })
    // Exit event
    nativescriptApp.on(nativescriptApp.exitEvent, (args: any) => {
        console.error("The application has exited!");
    })
    // Displayed
    nativescriptApp.on(nativescriptApp.displayedEvent, (args: any) => {
        console.log("The application is displayed!");
    })
    // Low memory even
    nativescriptApp.on(nativescriptApp.lowMemoryEvent, (args: any) => {
        console.warn('Low Memory Event occurs from object', args.object)
    })
    // Orientation Change event
    nativescriptApp.on(nativescriptApp.orientationChangedEvent, (args: any) => {
        console.log("Orientation Change: ", args.newValue);
    })
    // Uncaught Error
    nativescriptApp.on(nativescriptApp.uncaughtErrorEvent, (args: any) => {
        console.error("Uncaught Error Event", args.error)
    })



}
