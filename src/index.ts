
/*
    Thunderbolt Framework
    Main Source file
    Defines all exports of the framework API for use by adopting apps.
*/

let electronApp:any, BrowserWindow:any, preloadPath:string, AppGateway:any, ipcMain:any
let nscore:any, nativescriptApp:any


// console.log('wiring for mobile app handoff')
try {
    let {ComponentBase} = require('thunderbolt-mobile')
    let comCommon = require('./app-core/ComCommon')
    let {AppCore} = require('./app-core/AppCore')
    ComponentBase.bridgeAppGetter(AppCore.getTheApp, comCommon)
} catch(e) {
    if(typeof window === 'undefined') {
        console.error('app handoff fails because', e.message)
    }
}

let frameworkContext:any

function injectDesktopDependencies(injected:any) {
        electronApp = injected.electronApp
        BrowserWindow = injected.BrowserWindow
        preloadPath = injected.preloadPath
        AppGateway = injected.AppGateway
        ipcMain = injected.ipcMain
        nscore = injected.nscore
        nativescriptApp = injected.nativescriptApp
}

/**
 * defines the Framework access object passed to the __appStart__ lifecycle callback for the back process
 */
export class FrameworkBackContext {
    public electronWindow:any
    public electronApp: any
    public nativescriptApp:any
    public backApp: TBBackApp
    public frontApp: TBFrontApp | undefined


    constructor(backApp: TBBackApp) {

        this.electronApp = electronApp
        this.nativescriptApp = nativescriptApp
        this.backApp = backApp

        // This method will be called when Electron has finished
        // initialization and is ready to create browser windows.
        // Some APIs can only be used after this event occurs.
        if(electronApp) {
            electronApp.whenReady().then(() => {
                this.backApp.appStart(this).then(() => {
                    this.createWindow()
                })

                electronApp.on('activate', () => {
                    // On macOS it's common to re-create a window in the app when the
                    // dock icon is clicked and there are no other windows open.
                    if (BrowserWindow.getAllWindows().length === 0) this.createWindow()
                })
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
        } else {
            // nativescript
            this.backApp.appStart(this).then(() => {
                // Potential TODO:
                // this.nativescriptApp.on("orientationChanged", (arg:any) => {
                //     console.log('application orientation changed', arg)
                // })

                this.nativescriptApp.run({moduleName: 'app-root'})
            })

        }
    }

    createWindow (): void {
        if(this.electronApp) {
            // Create the browser window.
            const mainWindow: any = new BrowserWindow({
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
            mainWindow.on('resize', (e: any) => {
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
        } else {
            throw(Error('not expected to call createWindow from nativescript implementation'))
        }
    }

    setFrontApp(frontApp:TBFrontApp) {
        this.frontApp = frontApp
    }

    registerExtensionModule(name:string, module:any) {
        console.log('TODO: registerExtensionModule(name, module)')
        // registerExtensionModule(name, module)
    }

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
 * must satisfy the interface requirements for {@link: TBBackApp}
 *
 * @param {TBApp} app
 */
export function registerApp(injected:any, backApp:TBBackApp) : void {

    injectDesktopDependencies(injected) // bring in our target

    if(injected.electronApp) {
        new AppGateway(ipcMain)  // wire up front and back
        console.log('Launching Electron App\n')
    } else {

        console.log('Launching Nativescript App\n')
    }
    frameworkContext = new FrameworkBackContext(backApp) // the constructor takes it away
}
export function registerFrontApp(frontApp:TBFrontApp) : void {
    // console.log('front app being registered')
    frameworkContext.setFrontApp(frontApp)
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
import {ToolExtension} from "./extension/ToolExtension";

export {AppCore as AppCore}
export {MenuItem as MenuItem}
export {MenuApi as MenuApi}
export {setupMenu as setupMenu}
export {PathUtils as PathUtils}
export {ToolExtension as ToolExtension}
