
/*
    Thunderbolt Framework
    Main Source file
    Defines all exports of the framework API for use by adopting apps.
*/

let app:any, BrowserWindow:any, preloadPath:string, AppGateway:any, ipcMain:any

export function injectDesktopDependencies(injected:any) {
        app = injected.electronApp
        BrowserWindow = injected.BrowserWindow
        preloadPath = injected.preloadPath
        AppGateway = injected.AppGateway
        ipcMain = injected.ipcMain
}

/**
 * defines the Framework access object passed to the __appStart__ lifecycle callback for the back process
 */
export class FrameworkBackContext {
    private contextId:number
    public electronWindow:any
    public electronApp: any
    public backApp: TBBackApp

    constructor(backApp: TBBackApp) {

        this.contextId = nextContextId++
        this.electronApp = app
        this.backApp = backApp


        // This method will be called when Electron has finished
        // initialization and is ready to create browser windows.
        // Some APIs can only be used after this event occurs.
        app.whenReady().then(() => {
            this.backApp.appStart(this).then(() => {
                this.createWindow()
            })

            app.on('activate', () => {
                // On macOS it's common to re-create a window in the app when the
                // dock icon is clicked and there are no other windows open.
                if (BrowserWindow.getAllWindows().length === 0) this.createWindow()
            })
        })

        // Quit when all windows are closed, except on macOS. There, it's common
        // for applications and their menu bar to stay active until the user quits
        // explicitly with Cmd + Q.
        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                console.warn('TODO: call appExit from here')
                // TODO: Check Electron docs for an explicit quit event and trap there instead
                // Promise.resolve(this.registeredApp.appExit(this)).then(() => {
                //     app.quit()
                // })
            }
        })
    }

    createWindow (): void {
        // Create the browser window.
        const mainWindow:any = new BrowserWindow({
            width: 800,
            height: 600,
            webPreferences: {
                nodeIntegration: false, // we handle all the node stuff back-side
                contextIsolation: true, // gateway through window.api
                enableRemoteModule: false,
                preload: preloadPath
            }
        })

        // send eindow events via ipc
        mainWindow.on('resize', (e:any) => {
            const size = mainWindow.getSize()
            // console.log('electron sees resize ', size)
            AppGateway.sendMessage('EV', {subject: 'resize', data: size})

        })

        // and load the index.html of the app.
        mainWindow.loadFile('./front/index.html')

        mainWindow.fullScreen = true;
        // Open the DevTools.
        mainWindow.webContents.openDevTools()

        this.electronWindow = mainWindow
    }

    // registerExtensionModule(name, module) {
    //     registerExtensionModule(name, module)
    // }

}

/**
 * The framework front context is an AppCore instance
 */
type FrameworkFrontContext = any // treat as any here. But in reality it will be AppCore from the front process

/** Callback for __appStart__ lifecycle */
export type BackAppStartCallback = (context:FrameworkBackContext) => Promise<void>
/** Callback for __appExit__ lifecycle */
export type BackAppExitCallback = (context:FrameworkBackContext) => Promise<void>

/** Callback for __appStart__ lifecycle */
export type FrontAppStartCallback = (context:FrameworkFrontContext) => Promise<void>
/** Callback for __appExit__ lifecycle */
export type FrontAppExitCallback = (context:FrameworkFrontContext) => Promise<void>

/** Callback for __pageBegin__ lifecycle */
export type PageBeginCallback = (context:FrameworkFrontContext, userData:any) => Promise<void>

/** Callback for __pageDone__ lifecycle */
export type PageDoneCallback = (context:FrameworkFrontContext, userData:any) => Promise<void>

// Used by the framework to keep potentially multiple execution contexts separate.
// No use case yet envisioned for multiple instances, but these things have a way of
// coming up later, so let's build it in at the very start.
// Although, I'm not sure the Electron context lends itself to multiple instances, not to mention NativeScript, so
// this is probably moot anyway.
const registeredInstances = {} // map indexed by contextId
let nextContextId = 0 // index into instances

/**
 * Signature for a Thunderbolt app registration, back (main) process
 */
export interface TBBackApp {
    appStart: BackAppStartCallback,
    appExit: BackAppExitCallback
}
/**
 * Signature for a Thunderbolt app registration, front (render) process
 */
export interface TBFrontApp {
    appStart: FrontAppStartCallback,
    appExit: FrontAppExitCallback
}

/**
 * Signature for a Thunderbolt page
 */
export interface TBPage {
    pageBegin: PageBeginCallback,
    pageDone: PageDoneCallback
}

/**
 * A Thunderbolt app main startup code calls here to establish the
 * functional app core of the application.  The app core instance passed
 * must satisfy the interface requirements for {@link: TBApp}
 *
 * @param {TBApp} app
 */
export function registerApp(backApp:TBBackApp) : void {

    new AppGateway(ipcMain)

    console.log('Launching Electron App\n')

    const frameworkContext = new FrameworkBackContext(backApp)
}

export const Log = {
    debug(...a:any) {console.log(...a)},
    log(...a:any) {console.log(...a)},
    info(...a:any) {console.log(...a)},
    warn(...a:any) {console.warn(...a)},
    error(...a:any) {console.error(...a)},
    exception(...a:any) {console.error(...a)}
}

import {AppCore} from './app-core/AppCore'
import {MenuItem, MenuApi} from "./application/MenuApi";
import {setupMenu} from "./application/MenuDef";
import {PathUtils} from "./application/PathUtils";

export {AppCore as AppCore}
export {MenuItem as MenuItem}
export {MenuApi as MenuApi}
export {setupMenu as setupMenu}
export {PathUtils as PathUtils}
