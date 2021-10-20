
import {check,setEnvironment} from './EnvCheck'
import Log from './Log'

import {AppModel} from "./AppModel";

import {setupMenu} from "../application/MenuDef"
import {MenuApi} from "../application/MenuApi";

import {PathUtils, getRemoteSetters} from '../application/PathUtils'

import {StringParser} from '../general/StringParser'
import {ToolExtension} from "../extension/ToolExtension";

import {ResizeSensor} from "css-element-queries";

import {EventData} from "./EventData";

import * as BEF from "./ BackExtensionsFront";
import {ComNormal} from "./ComNormal";

import * as testOps from "../test-actions/TestOps"

const gwindow:any = typeof window !== 'undefined' ? window : {}
let mainApi = check.mobile ? null : gwindow.api;

const mobileInjections:any = {}
export function setMobileInjections(mbi:any) {
    mobileInjections.nscore = mbi.nscore
    mobileInjections.nsapplication = mbi.nsapplication
    mainApi = mobileInjections.mainApi = mbi.mainApi
    callExtensionApi = mbi.callExtensionApi

    console.log("<><><><><><><><>")
    console.log("%%%%%%%%%%%%%%%%")
    console.log('mobile injections')
    Object.getOwnPropertyNames(mobileInjections).forEach(p => {
        console.log('  '+p+': '+ typeof mobileInjections[p])
    })
    console.log("%%%%%%%%%%%%%%%%")
    console.log("<><><><><><><><>")
}

let Imr:any;
let callExtensionApi:any;

if(!check.mobile) {
    Imr = require('./InfoMessageRecorder')
    callExtensionApi = BEF.callExtensionApi
}

let riot, ComBinder
let getInfoMessageRecorder, InfoMessageRecorder
if(!check.mobile) {
    try {
        getInfoMessageRecorder = Imr.getInfoMessageRecorder;
        InfoMessageRecorder = Imr.InfoMessageRecorder
        riot = require('riot')
        ComBinder = require('./ComBinder').ComBinder
    } catch(e:any) {}
}

// tool Extensions are mapped into this
const extensionTypes = {
}

let imrSingleton:any
if(getInfoMessageRecorder) {
    imrSingleton = getInfoMessageRecorder()
}

function writeMessage(subject:string, message:string) {
    imrSingleton.write(subject, message)
}

export class HistoryRecord {
    public pageId: string = ''
    public context: object|undefined
}

// Singleton (used only by mobile side)
let theApp:any;
let theFrame:any;
export function setTheApp(app:any, frame?:any) {
    theApp = app;
    theFrame = frame
    // console.log('$$$$$$$$$$$ app and frame set', theApp, theFrame)
}
export function getTheApp() {
    // console.log('$$$$$$$$$$$ get app and frame', theApp, theFrame)
    return theApp
}

let componentGateCleared:boolean
let keyListenerBind:any
let reservedContext:any // mobile only, used for hand off of context between split load

/**
 *  Core object of the application.  Contains the app model and gateway functions for actions, which are
 *  mostly handled by action modules.
 */
export class AppCore {
     appModel:AppModel = new AppModel()
     rootPath:string = ''
     menuApi:MenuApi;
     activeMenu:any
     currentActivity:any = null
     history:HistoryRecord[] = []
     _pathUtils: PathUtils|undefined
     menuHandlers:any = {}
     pageMount:any // used only with riot
    // the gate items below are used only in the mobile version
     componentGate:Promise<void>
     modelGate:Promise<void>
     componentGateResolver:any
     modelGateResolver:any
     pageUpdates:any = {}
     runTest:boolean = false
     testDisposition:string = ''

    constructor() {
        this.menuApi = new MenuApi(this)
        this.modelGate = new Promise(resolve => {
            this.modelGateResolver = resolve
        })
        this.componentGate = new Promise(resolve => {
            this.componentGateResolver = resolve
        })
    }

    private async checkForTest() {
         console.log('>> checking for test indication file')
        if(mainApi) {
            console.log('looking for ~dotest file ')
            this.runTest = await mainApi.fileExists('~dotest')
            if(this.runTest) {
                this.connectTestMethods()
                this.testDisposition = await mainApi.readFileText('~dotest')
                console.log('test disposition read as ', this.testDisposition)
            }
        }
        console.log('test will '+ (this.runTest ? 'be run':' not be run' ))
        return this.runTest
    }
    /**
     * get the model used for binding to the UI.
     */
    public get model() {
        return this.appModel
    }
    public get MenuApi() {
        return this.menuApi
    }
    public get Api() {
        return mainApi
    }

    public get ExtMenuApi() {
        return (mainApi && typeof mainApi.addMenuItem === 'function') ? mainApi : null
    }

    public isMobile():boolean {
        return check.mobile
    }

    // Used by mobile
    // alternative access as a static on AppCore rather than having to export / import
    public static getTheApp() {
        return getTheApp()
    }
    // Used by mobile
    // alternative access as a static on AppCore rather than having to export / import
    public static setTheApp(app:any, frame:any) {
        return setTheApp(app, frame)
    }

    public waitForModel():Promise<unknown> {
        // console.log('waiting for model')
        return this.modelGate.then(() => {
            // console.log('model gate cleared')
        })
    }
    public componentIsReady() {
        // console.log('waiting for component')
        this.componentGateResolver()
        // console.log('component gate cleared')
        componentGateCleared = true
    }
    public waitReady():Promise<unknown> {
        // console.log('waiting for ready (both)...')
        if(componentGateCleared) return this.modelGate
        return Promise.all([this.componentGate, this.modelGate])
    }

    public setupUIElements(appFront:any) {
        console.log('>>> setupUIElements >>>')

        this.checkForTest()

        // set the infomessage log handling
        if(!check.mobile) {
            console.log('not mobile, clearing component gate')
            this.componentIsReady() // not used in riot, so clear the gate

            mainApi.messageInit().then(() => {
                console.log('messages wired')
                this.model.addSection('infoMessage', {messages: []})
                mainApi.addMessageListener('IM', (data:any) => {
                    writeMessage(data.subject, data.message)
                })
                mainApi.addMessageListener('EV', (data:any) => {
                    console.log('event info incoming:', data)
                    let evName = data.subject;
                    let evData = data.data;
                    if (evName === 'resize') {
                        const env = this.model.getAtPath('environment')
                        if (!env.screen) env.screen = {}
                        env.screen.width = evData[0]
                        env.screen.height = evData[1]
                        const window = {width:0, height:0}
                        if(check.riot) {
                          const bodSize = document.body.getBoundingClientRect()
                          window.width = bodSize.width
                          window.height = bodSize.height
                        }
                        this.model.setAtPath('environment.screen', env.screen)
                    }
                    if(evName === 'envInfo') {
                        try {
                            let env = this.model.getAtPath('environment')
                            // @ts-ignore
                            env = mergeEnvironmentData(env, data, this._riotVersion)
                            this.model.setAtPath('environment', env)
                            console.log('===================')
                            console.log('environment', env)
                            console.log('===================')
                            setEnvironment(env) // for check
                            this.setPlatformClass(env)
                            this.setPathUtilInfo(env).then(() => {
                                console.log('Setting up models annd menus')
                                // Set up app models and menus
                                this.model.addSection('menu', {})
                                if (appFront && appFront.appStart) { // appStart in tbFrontApp will likely create its own menu
                                    console.log('Starting app')
                                    Promise.resolve(appFront.appStart(this)).then(() => {
                                        console.log("Clearing model gate")
                                        this.modelGateResolver()
                                    })
                                } else {
                                    // no front app, or no appStart, so we are just vanilla default
                                    console.log("Clearing model gate with no app")
                                    this.modelGateResolver()
                                }
                            })
                        } catch(e:any) {
                            console.error('problem processing envInfo EV message', e)
                            throw(e)
                        }
                    }
                    if(evName === 'menuAction') {
                        this.onMenuAction({id:evData})
                    }

                })
                imrSingleton.subscribe((msgArray:string[]) => {
                    this.model.setAtPath('infoMessage.messages', msgArray)
                })
            })
        } else {
            if(!mainApi) {
                console.log('setting mobile mainApi from injections')
                mainApi = mobileInjections.mainApi
            }
        }


        console.log('SetUIElements past first check. now adding page section to model')

        this.model.addSection('page', {navInfo: {pageId: '', context: {}}})

        // Set environment items
        console.log('... now adding environment section to model')
        // this will allow us to do platform branching and so on
        this.model.addSection('environment', {}) // start empty; will get filled in on message.

        // console.log('testing nsapplication', nsapplication)
        let nsapplication = mobileInjections.nsapplication
        if(nsapplication) { // i.e. if mobile
            const res = nsapplication.getResources()
            const env = res && res.passedEnvironment
            // console.log('env', env)
            // console.log('was passed by ', res)

            this.model.setAtPath('environment', env)
            console.log('===================')
            console.log('environment', env)
            console.log('===================')
            setEnvironment(env) // for check
            // this.setPlatformClass(env) // not needed for mobile

            // set up native back button listener
            if(nsapplication.android) {
                nsapplication.android.on("activityBackPressed", (data:any) => {
                    console.log('Android back button pressed')
                    data.cancel = true // prevent further action
                    this.navigateBack()
                })
            }

            this.setPathUtilInfo(env).then(() => {
                console.log('Setting up models annd menus')
                // Set up app models and menus
                this.model.addSection('menu', {})
                if (appFront && appFront.appStart) { // appStart in tbFrontApp will likely create its own menu
                    console.log('Starting app')
                    Promise.resolve(appFront.appStart(this)).then(() => {
                        console.log("Clearing model gate")
                        this.modelGateResolver()
                    })
                } else {
                    // no front app, or no appStart, so we are just vanilla default
                    console.log("Clearing model gate with no app")
                    this.modelGateResolver()
                }
            })
        } else {
            // only for Electron
            // request a new emit of the environment on refresh
            console.log('##### Requesting environment on restart ---------!!!')
            this.Api.requestEnvironment();
            console.log('##### Setting up resize checker -----------')
            const window = {width:0, height:0}
            // let resizeInterval = setInterval(() => {
            let resizeChecker = new ResizeSensor(document.body, () =>{
                const bodSize = document.body.getBoundingClientRect()
                if (window.width != bodSize.width || window.height !== bodSize.height) {
                    window.width = bodSize.width
                    window.height = bodSize.height
                    // console.log('see a body resize event', window)
                    this.model.setAtPath('environment.window', window, true)
                }
            })
        }

        return this.waitReady()

    }
    setPlatformClass(env:any) {
        if(check.mobile) {
            // ns already sets .ns-phone and .ns-tablet, plus .ns-portrait/.ns-landscape
            // as well as .ns-ios and .ns-android,
            // so I don't think there's much more needed
            // and if there is, we should do it when we set the frame
        } else {
            let platClass
            if(env.runtime.platform.name === 'darwin') {
                platClass = 'macos'
            } else if(env.runtime.platform.name === 'win32') {
                platClass = 'windows'
            } else {
                platClass = 'linux'
            }
            console.log('setting platClass to '+platClass)
            document.body.classList.add(platClass)
        }
    }

    setPathUtilInfo(env:any) {
        if(mainApi) {
            if(!this.Path.cwd) {
                let appName = 'jove-app'
                try {
                    appName = env.build.app.name
                } catch(e:any) {
                }
                console.log('getting paths for app', appName)
                return mainApi.getUserAndPathInfo(appName).then((info: any) => {
                    console.log(info)
                    const pathSetters = getRemoteSetters()
                    pathSetters.setCurrentWorkingDirectory(info.cwd)
                    pathSetters.setAssetsDirectory(info.assets)
                    pathSetters.setHomeDirectory(info.home)
                    console.log('sending appDataPath', info.appData)
                    pathSetters.setAppDataDirectory(info.appData)
                    console.log('sending documentsPath', info.documents)
                    pathSetters.setDocumentsDirectory(info.documents)
                    console.log('sending downloadsPath', info.downloads)
                    pathSetters.setDownloadsDirectory(info.downloads)
                    console.log('sending desktopPath', info.desktop)
                    pathSetters.setDesktopDirectory(info.desktop)
                    const plat = env.runtime.platform.name === 'win32' ? 'win32' : 'posix'
                    pathSetters.setPlatform(plat)
                })
            }
        }
        return Promise.resolve()
    }


    setupMenu(menuPath:string) {
        console.log('%%%%%%%%%%%%%%%%%% setupMenu has been called')
        let pathUtils = this.Path
        if(mainApi) {
            // in case our paths aren't set up yet in pathUtils, default to expectation
            let assetPath = pathUtils.join(pathUtils.assetsPath || 'front/assets', menuPath)
            console.log('>> will set menu from ', assetPath)
            return Promise.resolve(setupMenu(this, assetPath))
        }
        console.error('no menu loaded -- api unavailable')
        return Promise.resolve() // no menu loaded
    }

    public setActiveMenu(menuComp:any) {
        this.activeMenu = menuComp
    }

    public onMenuAction(props:any) {

        const menuEvent = {
            id: props.id,
            app: this
        }

        if(this.activeMenu) {
            this.activeMenu.update({open:false})
        }



        // dispatch to current page activity.  include app instance in props
        let handled = false
        if(this.currentActivity) {
            if(typeof this.currentActivity.onMenuAction === 'function') {
                handled = this.currentActivity.onMenuAction(menuEvent)
            }
        }
        // now call any app registered menu handlers (not page bound)
        if(!handled) {
            const handler = this.menuHandlers[props.id]
            if (handler) {
                handled = handler(menuEvent)
            }
        }
        // default action for about if not trappedƒ
        if(!handled) {
            if(props.id === 'APP_ABOUT') {
                return this.defaultAboutBox()
            }
        }
    }

    public defaultAboutBox() {
        console.log('Default about box')

        const env = this.model.getAtPath('environment')
        const appInfo = env.build.app

        const buildDate = new Date(appInfo.buildTime).toLocaleDateString() // TODO use Formatter
        const options = {
            title: `About ${appInfo.displayName}`,
            message: `${appInfo.displayName}\nVersion ${appInfo.version}\n\n${appInfo.description}\n`,
            detail: `created by ${appInfo.author}\n${buildDate}\n\n${appInfo.copyright}\n`,
            buttons: ['O&kay']
        }
        return this.messageBox(options)
    }

    public onToolAction(props:any) {

        const menuEvent = {
            id: props.id,
            app: this
        }
        // dispatch to current activity.  include app instance in props
        if(this.currentActivity) {
            if(typeof this.currentActivity.onToolAction === 'function') {
                this.currentActivity.onToolAction(menuEvent)
            }
        }
        const handler = this.menuHandlers[props.id]
        if(handler) {
            handler(menuEvent)
        }
    }

    public callPageAction(name:string, ev:Event) {
        let comEvent = {
            nativeEvent: ev,
            target: ev.target,
            type: ev.type
        }
        if(this.currentActivity) {
            if(typeof this.currentActivity[name] === 'function') {
                this.currentActivity[name](comEvent)
            }

        }
    }

    /**
     * Register a global-scope handler for a menu or a tool action
     * or pass null instead of the handler function to clear it
     * @param menuId  menu action identifier
     * @param handler function to handle menu event
     */
    registerMenuHandler(menuId:string, handler:any) {
        if(handler) this.menuHandlers[menuId] = handler
        else delete this.menuHandlers[menuId]
    }


    // TODO: make part of a more defined util section
    public makeStringParser(string:string) {
        return StringParser && new StringParser(string)
    }


    private keyListener(event:KeyboardEvent) {
        // console.log('key event seen '+event.key)
        if(event.isComposing || event.code === "229") {
            return;
        }
        if(event.key === "Backspace" || event.key === "Delete") {
            event.stopPropagation()
            event.preventDefault()
            this.navigateBack()
        }
    }

    private attachPageKeyListener() {
        if(!keyListenerBind) {
            keyListenerBind = this.keyListener.bind(this)
        }
        document.addEventListener('keydown', keyListenerBind)
    }
    private removePageKeyListener() {
        document.removeEventListener('keydown', keyListenerBind)
    }

    /**
     * Replaces the currently mounted page markup with the markup of the named page
     * and starts the associated activity.
     *
     * @param {string} pageId
     * @param {object} [context]
     */
    public navigateToPage(pageId:string, context?:object, skipHistory?:boolean) {

        if(!pageId) return;

        if(pageId.substring(pageId.length-5) === '-page') {
            pageId = pageId.substring(0, pageId.length-5)
        }

        if(pageId === 'main' && this.runTest ) {
            setTimeout(() => {
                mainApi.startTest().then(() => {
                    this.runTest = false
                    console.log('>>>>>>>>>>>>>>>>>> TEST COMPLETED <<<<<<<<<<<<<<<<<<<<')
                    if (this.testDisposition === 'exit') {
                        // mainApi.appExit(0)
                        console.log('not exiting right now')
                    } else {
                        this.navigateToPage(pageId, context, skipHistory)
                    }
                })
            }, 1000); // delay start of test so we can get a debugger on this.
        }

        console.log('continuing with navigate to page')
        // set the page in the model.  For Riot, this forces the page to change on update
        // for mobile, we need to do that through native navigation, but we still want the model to be the same
        console.log('$$$$$$$$$$ navigate to page ' + pageId)
        const navInfo = this.model.getAtPath('page.navInfo')
        let prevPageId = navInfo.pageId
        let prevContext = navInfo.context
        navInfo.timestamp = Date.now()
        navInfo.pageId = pageId
        navInfo.context = context || {}
        // this switches the page at this point, or at least updates it
        this.model.setAtPath('page.navInfo', navInfo)
        if (prevPageId === pageId && prevContext === context) skipHistory = true;
        // note that this isn't used on the mobile side, but we record it anyway.
        // this may be useful later if we have any history-related functionality in common.
        if (!skipHistory) {
            this.history.push({
                pageId: prevPageId,
                context: prevContext
            })
        }

        if (check.mobile) {
            let pageref = '~/pages/' + pageId + '-page'

            // console.log('>>>>> mobile pageref', pageref)

            const navigationEntry = {
                moduleName: pageref,
                backstackVisible: !skipHistory
            };
            // console.log('>>> the frame', theFrame)
            // console.log('>>> navigation Entry', navigationEntry)

            reservedContext = context // pass via this variable
            theFrame && theFrame.navigate(navigationEntry)

            // apparently, we can pass a function instead of a navigationEntry to construct a Page
            // which might be something to look at later if we want to work from our own common page definition
            // instead of writing out {N} syntax files.
            // Function needs to build full page including the layout stack and any event handlers.
            // not sure what effect this has on back history, since there's nothing passed for that.

            console.log('------------------')
            console.log(' -- Looking at Frame classes')
            console.log('className', theFrame.className)
            console.log('cssClasses', theFrame.cssClasses)
            console.log('------------------')


        } else {
            const pageComponent = findPageComponent(pageId)
            if (!pageComponent) {
                throw Error('No page component for ' + pageId)
            }
            console.log('------------------')
            console.log(' -- Looking at body classes')
            console.log('className', document.body.className)
            console.log('classList', document.body.classList)
            console.log('------------------')

            const activity = pageComponent.activity;
            if (!activity) {
                throw Error('No exported activity for ' + pageId)
            }
            activity.context = context;
            // console.log('$$$$ Starting page', pageId, context)
            this.startPageLogic(pageId, activity, context)

        }
    }

    /**
     * Called by mobile page-launch wrapper (onLoaded) to set up bindings
     * This does basically what the navigateToPage code does in the second part for desktop
     */
    setPageBindings(pageId:string, activity:any, pageMethods:object) {

        const bindMe:any = {pageMethods}
        bindMe.navInfo = {
            pageId,
            context: reservedContext
        }
        // console.log('set page bindings to ', bindMe)
        return bindMe
    }
    /**
     * Called by mobile page-launch wrapper (onNavigatedTo) to invoke the page logic (activity)
     * This does basically what the navigateToPage code does in the second part for desktop
     */
    launchActivity(pageId:string, activity:any) {
        this.startPageLogic(pageId, activity, reservedContext)
        reservedContext = null
    }

    /**
     * reload the current page.
     * May be necessary on orientation change
     */
    reloadCurrentPage() {
        let navinfo = this.model.getAtPath('page.navInfo')
        this.navigateToPage(navinfo.pageId, navinfo.context, true)
    }

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
    public setPageData(pageName:string, item:object | string, value?:any) {
        // console.log('(in setPageData)')
        let fullPageName, pageId
        if(pageName.substring(pageName.length -5) === '-page') {
            fullPageName = pageName
            pageId = pageName.substring(0, pageName.length - 5)
        } else {
            pageId = pageName
            fullPageName = pageName + '-page'
        }

        let data:any = {}
        // @ts-ignore
        if(!this.model['page-data']) {
            let sdata:any = {}
            sdata[fullPageName] = {}
            this.model.addSection('page-data', sdata)
        }
        try {
            // console.log('...spd trace 1')
            data = this.model.getAtPath('page-data.' + fullPageName) || {}
        } catch(e:any) {
            data = {}
        }
        // console.log('...spd trace 2')
        if(typeof item === 'object') {
            // console.log('...spd trace 3')
            this.model.setAtPath('page-data.'+fullPageName, item, true)
        } else {
            // console.log('...spd trace 4')
            data[item] = value
            this.model.setAtPath('page-data.'+fullPageName, data, true)
        }

        // console.log('...spd trace 5')
        let curActivityId = this.currentActivity && this.currentActivity.activityId

        // if(!check.mobile) {
        //     const pageComp = curActivityId && findPageComponent(curActivityId)
        //     if (pageComp && pageComp.comBinder) {
        //         // console.log('...binding...')
        //         pageComp.comBinder.applyComponentBindings(pageComp, 'page-data.' + fullPageName, (component: any, name: string, value: any, updateAlways: boolean) => {
        //             // Handle the update to the component itself
        //             // console.log('updating page')
        //             if (check.riot) {
        //                 // console.log('...')
        //                 try {
        //                     component.bound.data = value
        //                     component.update()
        //                 } catch (e:any) {
        //                 }
        //             } else {
        //                 component.bound.set(name, value)
        //             }
        //         })
        //         pageComp.reset()
        //     }
        // }

    }

    public updatePage(pageName:string) {
        // console.log('doing mobile update of page data')
        const data = this.getPageData(pageName)
        this.model.setAtPath('page-data.' + pageName, data, true, false)

        // This seems to work in terms of forcing the update, but of course, since the page updates itself when it loads
        // we end up in an infinite loop
        // so we need to see if this page has already been updated recently, and not do it a second time
        if(!this.pageUpdates) {
            this.pageUpdates = {}
        }
        let now = Date.now()
        if(this.pageUpdates[pageName] && now - this.pageUpdates[pageName] < 1000) {
            return
        }
        this.pageUpdates[pageName] = now
        this.reloadCurrentPage()
    }

    /**
     * Returns the data object for the named page, if one exists
     * @param pageName
     */
    public getPageData(pageName:string) {
        if(pageName.substring(pageName.length-5) !== '-page') pageName += '-page'
        try {
            return this.model.getAtPath('page-data.' + pageName)
        } catch(e:any) {
            console.warn('no page data for '+pageName)
            return {}
        }
    }

    public getFromCurrentPageData(accPath:string) {
        let navinfo = this.model.getAtPath('page.navInfo')
        let pageData = this.getPageData(navinfo.pageId)
        let v:any = pageData
        const parts = accPath.split('.')
        for(let p of parts) {
            v = v[p] || ''
        }
        return v
    }


    /**
     * Called by mobile side to start the first activity only ('main')
     *
     * @param activity
     * @param context
     */
    public startPageLogic(id:string, activity:any, context?:object) {
        activity.activityId = id;
        activity.context = context;
        // console.log('>>>>>>>>>>>> setting activity', activity)
        this.currentActivity = activity;
        // console.log('About to start activity ', this.currentActivity)

        if(!check.mobile) {

            activity.onBeforeUpdate = (props:any, state:any) => {

                console.log('Announcement that the page will update', this, activity, props, state)

            }

            this.attachPageKeyListener()
        }

        activity.pageStart(this, context)
    }

    public navigateBack() {
        let popBack = this.history.pop()
        if(popBack) {
            // console.log(popBack)
            this.navigateToPage(popBack.pageId, popBack.context, true)
        }
    }

    public findComponent(tagName:string, prop?:string, propValue?:string):any {

        let comp:any = null
        if(check.riot) {
            // find it using the DOM
            let selector = tagName
            if(prop) {
                selector += `[${prop}`
                if(propValue) selector += `=${propValue}`
                selector += ']'
            }
            const el:HTMLElement|null = document.body.querySelector(selector)
            comp = this.getComponent(el)
        } else {
            // for nativescript:
            const top = theFrame.currentPage.content;
            top.component = top // make it look like a StdComp
            const comNormal = new ComNormal(top)
            const candidates = comNormal.elementFindAll(tagName)
            for(let cand of candidates) {
                if(!prop || cand.get(prop) === propValue) {
                    comp = cand
                    break
                }
            }
        }
        return comp
    }

    /**
     * Dispatch an event to the current activity by name
     *
     * @param name
     * @param domEvent
     */
    public callEventHandler(tag:string, platEvent:any, value?:any) {
        const act = this.currentActivity;
        let ed
        // platEvent might be a Dom Event or it could be EventData
        if(platEvent.target) { // looks like Dom event
            ed = new EventData()
            ed.app = this
            if (platEvent) {
                ed.platEvent = platEvent
                ed.sourceComponent = this.getComponent(platEvent.target as HTMLElement)
                ed.eventType = (platEvent as Event).type
            }
        } else {
            ed = (platEvent as EventData)
        }
        let name:string
        if(check.mobile) {
            name = (ed.sourceComponent && ed.sourceComponent.get(tag)) || 'onAnonymousEvent'
        } else {
            name = (ed.sourceComponent && ed.sourceComponent.state[tag]) || 'onAnonymousEvent'
        }
        ed.tag = tag
        ed.value = value
        if(act && typeof act[name] === 'function') {
            act[name](ed)
        } else {
            if(name !== 'onAnonymousEvent') {
                if(act) console.error(`${name} is not a function exposed on current activity ${act.activityId}`)
            }
        }
    }

    // same as the one in ComCommon, but duplicated here for use with eventData
    private getComponent(el:HTMLElement|null):any {
        try {
            let syms;
            do {
                if(el) {
                    syms = Object.getOwnPropertySymbols(el)
                    if (syms.length === 0) {
                        el = el.parentElement
                    }
                } else {
                    return null;
                }
            } while (syms && syms.length === 0)

            // @ts-ignore
            return el[syms[0]]
        } catch(e:any) {
            Log.warn(e.message || e)
            return null;
        }
    }
    // ------- access to PathUtils
    get Path() {
        if(!this._pathUtils) {
            this._pathUtils = new PathUtils()
        }
        return this._pathUtils
    }

    // ------- Extension for indicators / tools
    createExtensionType(name:string) {
        // @ts-ignore
        const EType = extensionTypes[name]
        if(EType) {
            return new EType()
        }
    }

    // extensions
    callExtension(moduleName:string, functionName:string, ...args:any[]) {
        return callExtensionApi(moduleName, functionName, args)
    }

    getToolState(toolId:string):string {
        return this.model.getAtPath('toolbar-'+toolId+".state") || 'default'
    }
    setToolState(toolId:string, state:string) {
        this.model.setAtPath('toolbar-'+toolId+'.state', state || 'default')
    }
    getIndicatorState(indId:string):string {
        return this.model.getAtPath('indicator-'+indId+".state") || 'default'
    }
    setIndicatorState(indId:string, state:string) {
        this.model.setAtPath('indicator-'+indId+'.state', state || 'default')
    }

    registerToolExtension(name:string, extension:ToolExtension) {
        // @ts-ignore
        extensionTypes[name] = extension
    }

    messageBox(options:any) {
        return Promise.resolve(mainApi && mainApi.openDialog(options))
    }


    connectTestMethods() {
        const callTestRequest = (request:string, params:string[]) => {
            console.log('callTestRequest', request, params)
            const ops:any = testOps
            const fn = ops[request]
            return fn && fn.apply(this, params)
        }
        if(gwindow) {
            gwindow.callTestRequest = callTestRequest
            console.log('connected callTestRequest to window at ', gwindow.callTestRequest)
        }



    }

}

// as it is from ComCommon
function getComponent(el:HTMLElement|null) {
    try {
        let syms;
        do {
            if(el) {
                syms = Object.getOwnPropertySymbols(el)
                if (syms.length === 0) {
                    el = el.parentElement
                }
            } else {
                return null;
            }
        } while (syms && syms.length === 0)

        // @ts-ignore
        return el[syms[0]]
    } catch(e:any) {
        console.warn(e.message || e)
        return null;
    }
}
function findPageComponent(pageId:string) {
    const tag = pageId+'-page'
    // console.log('finding page with tag',tag)
    const el = document.getElementById('root')
    const appComp = getComponent(el)
    const pageCompEl = appComp.$$(tag)[0]
    const pageComp = getComponent(pageCompEl)
    // console.log('found page', pageComp)
    return pageComp
}

function mergeEnvironmentData(env:any, data:any, riotVersion?:string) {

    // debug
    console.log('-------env merge')
    console.log('env, data ', env, data)
    console.log('riot version ', riotVersion)

    try {
        // merges the sometimes differently formatted environment info from
        // build and startup with initial stuff from EnvCheck load to create
        // the canonical Environment data.
        data = data.data || data
        let build = data.build
        console.log('build isolated', build)
        let rfw = Object.assign({},
            env.runtime && env.runtime.framework,
            data.runtime && data.runtime.framework)
        console.log('runtime.framework, isolated', rfw)
        let platform = data.runtime && data.runtime.platform
        if(!platform) platform = env.runtime && env.runtime.platform
        if(!platform) platform = env.platform || {}
        console.log('runtime platform, isolated', platform)
        if(riotVersion) rfw.riot = riotVersion
        rfw.nativeScript = build.platform.nativeScript
        let out: any = {
            build,
            runtime: {
                framework: rfw,
                platform: platform
            }
        }
        delete out.runtime.window
        out.window = env.window
        return out
    } catch(e:any) {
        console.error(e)
    }
}