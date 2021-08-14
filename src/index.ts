
/*
    Jove Framework
    Main Source file
    Defines all exports of the framework API for use by adopting apps.
*/

// console.log("%%%%%%%%%%%%%%%%%%%%% top of index.js (common) %%%%%%%%%%%%%%%%%%%%%")

let electronApp:any, BrowserWindow:any, preloadPath:string, AppGateway:any, ipcMain:any
let makeWindowStatePersist:any
let nscore:any, nativescriptApp:any, registerExtensionModule:any

// This is used here to read under node, using the desktop injection references
// since we can't include any node stuff here (even if we don't use it) when in Nativescript
const localNodeFileApi:any = {

    fileExists(file:string):Promise<boolean> {
        const fs = nodeParts.fs
        let exists = false
        if(fs) {
            exists =  fs.existsSync(file)
        }
        return Promise.resolve(exists)
    },
    readFileText(file:string):Promise<string> {
        const fs = nodeParts.fs
        let text
        if(fs) {
            text =  fs.readFileSync(file).toString()
        }
        return Promise.resolve(text)
    }
}

let isNS = false
let fileApi:any
let nsfs:any
// console.log('wiring for mobile app handoff')
try {
    // console.log('getting ComponentBase...')
    let {ComponentBase, mainApi} = require('@tremho/jove-mobile')
    // console.log('getting comCommon...')
    let comCommon = require('./app-core/ComCommon')
    // console.log('getting AppCore...')
    let {AppCore} = require('./app-core/AppCore')
    // console.log('bridging App Getter...')
    ComponentBase.bridgeAppGetter(AppCore.getTheApp, comCommon)
    nsfs = require('@nativescript/core/file-system')
    isNS = true
    fileApi = mainApi
} catch(e) {
    const isBrowser=new Function("try {return this===window;}catch(e){ return false;}");
    if(!isBrowser()) {
        console.error('app handoff fails because', e.message)
    }

    fileApi = localNodeFileApi
}

let nodeParts:any
let frameworkContext:any

// console.log("%%%%%%%%%%% past basic discovery %%%%%%%%%%%%%%%")
// console.log("isNS = "+isNS)

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
        nodeParts = injected.nodeParts

        console.log('%%%%%% injection happens %%%%%%%%')
        console.log("nodeParts",nodeParts)
}

/**
 * defines the Framework access object passed to the __appStart__ lifecycle callback for the back process
 */
export class FrameworkBackContext {
    public electronWindow:any
    public electronApp: any
    public nativescriptApp:any
    public backApp: TBBackApp
    public title:string
    // public frontApp: TBFrontApp | undefined
    public windowKeeper: any
    passedEnvironment:any = {}


    constructor(backApp: TBBackApp) {
        this.electronApp = electronApp
        this.nativescriptApp = nativescriptApp
        this.backApp = backApp
        this.title = ''

        console.log('Framework back app constructor')

        this.gatherEnvInfo()
    }

    gatherEnvInfo() {

        console.log('$$$$$$$$$ Gathering Environment Info $$$$$$$$$$$$')
        readBuildEnvironment().then((buildEnv:any) => {

            console.log('$$$$$$$$$$$$$ Back from readBuildEnviroment ', buildEnv)

            let platName = isNS ? 'NativeScript' : process.platform // nativeScript or win32, or darwin, or linux
            let platVersion = isNS ? buildEnv.platform.nativeScript || '' : nodeParts.os.version() // version of the operating system, or built NS version
            let platType = 'Computer' // if not NS, otherwise Phone or Tablet (or Mobile device if NS doesn't tell us)
            let platMan
            let platHost
            let platHostVersion

            if(isNS && nscore) {
                const device = nscore.Device
                platType = device.type || 'Mobile device'
                platHost = device.os
                platMan = device.manufacturer
                platHostVersion = device.osVersion
            }

            // console.log('platName and version (hacked)', platName, platVersion)

            const env = {
                build: buildEnv,
                runtime: {
                    framework: {
                        // nativeScript: 8.0.2  --> filled in here, below
                        // riot: 5.1.4 --> filled in next phase
                    },
                    platform: {
                        type: platType,
                        name: platName, // darwin, win32, etc (or NativeScript)
                        version: platVersion, // version of os (not defined for NS)
                        host: platHost, // host OS (if nativescript)
                        hostVersion: platHostVersion, // (if nativescript)
                        manufacturer: platMan // (if nativescript)
                    }
                }
            }
            // console.log('filling in env')
            if(isNS) {
                // @ts-ignore
                env.runtime.framework.nativeScript = env.build.framework.nativeScript
            } else {
                // @ts-ignore
                env.runtime.framework.node = process.versions.node
                // @ts-ignore
                env.runtime.framework.electron = process.versions.electron
            }

            // console.log('... env', env)
            // @ts-ignore
            let appName = (env.build.app && env.build.app.name) || 'jove-app'
            this.title = env.build.app.displayName || appName
            // console.log('... appName', appName)

            this.passedEnvironment = env;
            // console.log('passed Environment=', env)

            // make our window keeper
            if(!isNS) {
                this.windowKeeper = makeWindowStatePersist(appName)
                // console.log('window keeper created', this.windowKeeper)
            }

            // This method will be called when Electron has finished
            // initialization and is ready to create browser windows.
            // Some APIs can only be used after this event occurs.
            if(electronApp) {
                console.log('Framework back app has electronApp')
                electronApp.whenReady().then(() => {
                    console.log('Framework back app when Ready', this.backApp)
                    let p = Promise.resolve()
                    try {
                        p = this.backApp.appStart(this)
                    }
                    catch(e) {
                        console.log(e)
                    }
                    p.then(() => {
                        this.createWindow()

                        setTimeout(()=> {
                            // console.log('sending EV:envInfo message for env', JSON.stringify(this.passedEnvironment, null, 2))
                            AppGateway.sendMessage('EV', {subject:'envInfo', data:this.passedEnvironment})
                        }, 100)
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
                console.log('starting nativescript')
                this.backApp.appStart(this).then(() => {
                    // Potential TODO:
                    // this.nativescriptApp.on("orientationChanged", (arg:any) => {
                    //     console.log('application orientation changed', arg)
                    // })

                    // don't send build environment via EV
                    // console.log('passing environment through application resources for Nativescript')
                    this.nativescriptApp.setResources({passedEnvironment:this.passedEnvironment})

                    this.nativescriptApp.run({moduleName: 'app-root'})
                })

            }
        })
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
                    icon: __dirname + '/assets/icons/png/64x64.png',
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
        } else {
            throw(Error('not expected to call createWindow from nativescript implementation'))
        }
    }

    /* THIS NEVER HAPPENS
    setFrontApp(frontApp:TBFrontApp) {
        this.frontApp = frontApp
        this.frontApp.passEnvironment(this.passedEnvironment) // chain gets continued in appMain (Desktop/buildPack)
    }
     */

    registerExtensionModule(name:string, module:any) {
        // console.log('TODO: registerExtensionModule(name, module)', registerExtensionModule)
        registerExtensionModule(name, module)
    }
}

/**
 * Determines our launch path and sets the current working directory there
 * It then reads the expected to find BuildEnvironment.json file and returns this data
 */
function readBuildEnvironment() {
    let be = {}

    console.log('>>$$$$ in readBuildEnvironment ')
    if(isNS) console.log(">>>$$$$ Nativescript detected")
    else console.log(">>>$$$$ NOT running under Nativescript")

    // determine our launchDir based on this path
    if(!isNS && nodeParts) { // don't go through this for ns
        console.log('>>>> Doing node stuff')
        const {fs, os, path} = nodeParts
        let scriptPath = __dirname
        // find ourselves in this path
        let n = scriptPath.indexOf('/node_modules/@tremho/jove-common')
        let launchDir;
        if (n !== -1) {
            launchDir = scriptPath.substring(0, n)
        }
        // read BuildEnvironment.json from launchDir
        if (!launchDir) {
            // assume we were launched from the current directory
            launchDir = '.'
        }
        launchDir = path.resolve(launchDir)
        console.log('>>>>>>>>>> LaunchDir determined to be ', launchDir)
        if (launchDir.substring(launchDir.length - 5) === '.asar') {
            launchDir += '.unpacked'
            console.log('>>>>>>>>>> LaunchDir determined to be ', launchDir)

            process.chdir(launchDir) // so we are in sync from now on
            console.log('>>>>>>>>>> reset cwd', process.cwd())
        } else {
            const lookFor = path.join(launchDir, 'resources', 'app.asar.unpacked')
            if (fs.existsSync(lookFor)) {
                // this will be a case on Windows
                launchDir = lookFor
                console.log('>>>>>>>>>> cwd moving to ', launchDir)
                process.chdir(launchDir) // so we are in sync from now on
            } else {
                console.log('>>>>>>>> Not changing cwd', process.cwd())
            }
        }
    }

    if(isNS) {
        console.log('%%%%%%%%%%% More NS sanity investigation %%%%%%%%%%')
        console.log('(-- incidental test of prepublish --)')

        const cwd = nsfs.knownFolders.currentApp().path
        console.log('ns cwd (app) ', cwd)
        fileApi.readFolder(cwd).then((details:any[])=> {
            console.log('contents at app root:')
            for(let i=0; i<details.length; i++) {
                const f = details[i]
                console.log(`${i+1} - ${f.fileName} (${f.size})`)
            }
        })
        console.log('%%%%%%%%%%%%%%%%%%%%%%%%%')
    }


    let beFile ='BuildEnvironment.json'
    let text = ''

    if(isNS) {
        beFile = nsfs.knownFolders.currentApp().path+'/'+beFile
    }

    let p = fileApi.fileExists(beFile).then((exists:boolean)=> {
        console.log(beFile + ' exists? ', exists)
        if(exists) {
            if(nsfs) {
                console.log('reading synchronously using nsfs')
                text = nsfs.File.fromPath(beFile).readTextSync()
                console.log("text=", text)
            } else {
                console.log('going into the deep dark file read ', fileApi.readFileText)
                return fileApi.readFileText(beFile).then((ft: string) => {
                    console.log('successfully read ', ft)
                    text = ft || "{}"
                }).catch((e: Error) => {
                    console.error('Well, that was unexpected', e)
                })
            }
        }
        return Promise.resolve()
    })
    return p.then(() => {
        console.log('>>> Sanity checkpoint #1', text)
        try {
            if(text) {
                be = JSON.parse(text)
            } else {
                console.error(beFile+' Does not exist')
                be = {
                    error:"Unable to locate "+beFile,
                }
            }
        } catch(e) {
            console.error('Unable to read '+beFile, e)
            be = {
                error:"Unable to read "+beFile,
                errMsg: e.message
            }
        }
        console.log('returning build environment data as ', be)
        return be
    })
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

    injectDesktopDependencies(injected) // bring in our target

    if(injected.electronApp) {
        new AppGateway(ipcMain)  // wire up front and back
        console.log('Launching Electron App\n')
    } else {

        console.log('Launching Nativescript App\n')
    }
    frameworkContext = new FrameworkBackContext(backApp) // the constructor takes it away
}
/*
THIS NEVER HAPPENS
export function registerFrontApp(frontApp:TBFrontApp) : void {

    let passedEnvironment = {}
    frontApp.passEnvironment = (env:any)=>{
        passedEnvironment = env
    }
    frontApp.getPassedEnvironment = () => {return passedEnvironment}

    // console.log('front app being registered')
    // frameworkContext.setFrontApp(frontApp)  // THIS NEVER  HAPPENS
}
 */
export const Log = {
    debug(...a:any) {console.log(...a)},
    log(...a:any) {console.log(...a)},
    info(...a:any) {console.log(...a)},
    warn(...a:any) {console.warn(...a)},
    error(...a:any) {console.error(...a)},
    exception(...a:any) {console.error(...a)}
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
