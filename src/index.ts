
/*
    Jove Framework
    Main Source file
    Defines all exports of the framework API for use by adopting apps.
*/

import path from "path";

let electronApp:any, BrowserWindow:any, preloadPath:string, AppGateway:any, ipcMain:any
let makeWindowStatePersist:any
let nscore:any, nativescriptApp:any, registerExtensionModule:any


// console.log('wiring for mobile app handoff')
try {
    // console.log('getting ComponentBase...')
    let {ComponentBase} = require('@tremho/jove-mobile')
    // console.log('getting comCommon...')
    let comCommon = require('./app-core/ComCommon')
    // console.log('getting AppCore...')
    let {AppCore} = require('./app-core/AppCore')
    // console.log('bridging App Getter...')
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
        registerExtensionModule = injected.registerExtensionModule
        makeWindowStatePersist = injected.makeWindowStatePersist

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
    public windowKeeper: any


    constructor(backApp: TBBackApp) {

        this.electronApp = electronApp
        this.nativescriptApp = nativescriptApp
        this.backApp = backApp

        console.log('Framework back app constructor')

        // make our window keeper
        const name = (this.backApp.options && this.backApp.options.name) || 'jove-app'
        this.windowKeeper = makeWindowStatePersist(name)
        // console.log('window keeper created', this.windowKeeper)


        // This method will be called when Electron has finished
        // initialization and is ready to create browser windows.
        // Some APIs can only be used after this event occurs.
        if(electronApp) {
            console.log('Framework back app has electronApp')
            electronApp.whenReady().then(() => {
                console.log('Framework back app when Ready', this.backApp)
                this.backApp.appStart(this).then(() => {
                    this.createWindow()
                })

                electronApp.on('activate', () => {
                    console.log('Framework back app Activated')
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
            // console.log('window keeper before restore', this.windowKeeper)
            this.windowKeeper.restore().then(() => {
                // console.log('window keeper after restore', this.windowKeeper)
                // Create the browser window.
                const mainWindow = new BrowserWindow({
                    width: this.windowKeeper.width || (this.backApp.options && this.backApp.options.width) || 800,
                    height: this.windowKeeper.height || (this.backApp.options && this.backApp.options.height) || 600,
                    x: this.windowKeeper.x || (this.backApp.options && this.backApp.options.startX) || 0,
                    y: this.windowKeeper.y || (this.backApp.options && this.backApp.options.startY) || 0,
                    icon: path.join(__dirname, 'assets/icons/png/64x64.png'),
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
        } else {
            throw(Error('not expected to call createWindow from nativescript implementation'))
        }
    }

    setFrontApp(frontApp:TBFrontApp) {
        this.frontApp = frontApp
    }

    registerExtensionModule(name:string, module:any) {
        // console.log('TODO: registerExtensionModule(name, module)', registerExtensionModule)
        registerExtensionModule(name, module)
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
 * Signature for a Jove app registration, back (main) process
 */
export interface TBBackApp {
    appStart: BackAppStartCallback,
    appExit: BackAppExitCallback
    options:any
}
/**
 * Signature for a Jove app registration, front (render) process
 */
export interface TBFrontApp {
    appStart: FrontAppStartCallback,
    appExit: FrontAppExitCallback
}

/**
 * Signature for a Jove page
 */
export interface TBPage {
    pageBegin: PageBeginCallback,
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

import {AppCore, EventData} from './app-core/AppCore'
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
export {EventData as EventData}
