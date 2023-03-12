"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppCore = exports.getTheApp = exports.setTheApp = exports.HistoryRecord = exports.setMobileInjections = void 0;
const EnvCheck_1 = require("./EnvCheck");
const Log_1 = require("./Log");
const AppModel_1 = require("./AppModel");
const MenuDef_1 = require("../application/MenuDef");
const MenuApi_1 = require("../application/MenuApi");
const PathUtils_1 = require("../application/PathUtils");
const StringParser_1 = require("../general/StringParser");
const css_element_queries_1 = require("css-element-queries");
const EventData_1 = require("./EventData");
const BEF = require("./ BackExtensionsFront");
const ComNormal_1 = require("./ComNormal");
const testOps = require("../test-actions/TestOps");
const gwindow = typeof window !== 'undefined' ? window : {};
let mainApi = EnvCheck_1.check.mobile ? null : gwindow.api;
const mobileInjections = {};
function setMobileInjections(mbi) {
    mobileInjections.nscore = mbi.nscore;
    mobileInjections.nsapplication = mbi.nsapplication;
    mainApi = mobileInjections.mainApi = mbi.mainApi;
    callExtensionApi = mbi.callExtensionApi;
    mobileInjections.setCallTestRequest = mbi.setCallTestRequest;
    // console.log("<><><><><><><><>")
    // console.log("%%%%%%%%%%%%%%%%")
    // console.log('mobile injections')
    // Object.getOwnPropertyNames(mobileInjections).forEach(p => {
    //     console.log('  '+p+': '+ typeof mobileInjections[p])
    // })
    // console.log("%%%%%%%%%%%%%%%%")
    // console.log("<><><><><><><><>")
}
exports.setMobileInjections = setMobileInjections;
let Imr;
let callExtensionApi;
if (!EnvCheck_1.check.mobile) {
    Imr = require('./InfoMessageRecorder');
    callExtensionApi = BEF.callExtensionApi;
}
let riot, ComBinder;
let getInfoMessageRecorder, InfoMessageRecorder;
if (!EnvCheck_1.check.mobile) {
    try {
        getInfoMessageRecorder = Imr.getInfoMessageRecorder;
        InfoMessageRecorder = Imr.InfoMessageRecorder;
        riot = require('riot');
        ComBinder = require('./ComBinder').ComBinder;
    }
    catch (e) { }
}
// tool Extensions are mapped into this
const extensionTypes = {};
let imrSingleton;
if (getInfoMessageRecorder) {
    imrSingleton = getInfoMessageRecorder();
}
function writeMessage(subject, message) {
    imrSingleton.write(subject, message);
}
class HistoryRecord {
    constructor() {
        this.pageId = '';
    }
}
exports.HistoryRecord = HistoryRecord;
// Singleton (used only by mobile side)
let theApp;
let theFrame;
function setTheApp(app, frame) {
    theApp = app;
    theFrame = frame;
    // console.log('$$$$$$$$$$$ app and frame set', theApp, theFrame)
}
exports.setTheApp = setTheApp;
function getTheApp() {
    // console.log('$$$$$$$$$$$ get app and frame', theApp, theFrame)
    return theApp;
}
exports.getTheApp = getTheApp;
let componentGateCleared;
let keyListenerBind;
let reservedContext; // mobile only, used for hand off of context between split load
/**
 *  Core object of the application.  Contains the app model and gateway functions for actions, which are
 *  mostly handled by action modules.
 */
class AppCore {
    constructor() {
        this.appModel = new AppModel_1.AppModel();
        this.rootPath = '';
        this.currentActivity = null;
        this.history = [];
        this.menuHandlers = {};
        this.pageUpdates = {};
        this.runTest = false;
        this.testDisposition = '';
        this.menuApi = new MenuApi_1.MenuApi(this);
        this.modelGate = new Promise(resolve => {
            this.modelGateResolver = resolve;
        });
        this.componentGate = new Promise(resolve => {
            this.componentGateResolver = resolve;
        });
    }
    checkForTest() {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log('>> checking for test indication file')
            if (mainApi) {
                // console.log('looking for ~dotest file ')
                this.runTest = yield mainApi.fileExists('~dotest');
                if (this.runTest) {
                    this.connectTestMethods();
                    this.testDisposition = yield mainApi.readFileText('~dotest');
                    // console.log('test disposition read as ', this.testDisposition)
                }
            }
            // console.log('test will '+ (this.runTest ? 'be run':' not be run' ))
            return this.runTest;
        });
    }
    /**
     * get the model used for binding to the UI.
     */
    get model() {
        return this.appModel;
    }
    get MenuApi() {
        return this.menuApi;
    }
    get Api() {
        return mainApi;
    }
    get ExtMenuApi() {
        return (mainApi && typeof mainApi.addMenuItem === 'function') ? mainApi : null;
    }
    isMobile() {
        return EnvCheck_1.check.mobile;
    }
    // Used by mobile
    // alternative access as a static on AppCore rather than having to export / import
    static getTheApp() {
        return getTheApp();
    }
    // Used by mobile
    // alternative access as a static on AppCore rather than having to export / import
    static setTheApp(app, frame) {
        return setTheApp(app, frame);
    }
    waitForModel() {
        // console.log('waiting for model')
        return this.modelGate.then(() => {
            // console.log('model gate cleared')
        });
    }
    componentIsReady() {
        // console.log('waiting for component')
        this.componentGateResolver();
        // console.log('component gate cleared')
        componentGateCleared = true;
    }
    waitReady() {
        // console.log('waiting for ready (both)...')
        if (componentGateCleared)
            return this.modelGate;
        return Promise.all([this.componentGate, this.modelGate]);
    }
    setupUIElements(appFront) {
        // console.log('>>> setupUIElements >>>')
        this.checkForTest();
        // set the infomessage log handling
        if (!EnvCheck_1.check.mobile) {
            // console.log('not mobile, clearing component gate')
            this.componentIsReady(); // not used in riot, so clear the gate
            mainApi.messageInit().then(() => {
                // console.log('messages wired')
                this.model.addSection('infoMessage', { messages: [] });
                mainApi.addMessageListener('IM', (data) => {
                    writeMessage(data.subject, data.message);
                });
                mainApi.addMessageListener('EV', (data) => {
                    // console.log('event info incoming:', data)
                    let evName = data.subject;
                    let evData = data.data;
                    if (evName === 'resize') {
                        const env = this.model.getAtPath('environment');
                        if (!env.screen)
                            env.screen = {};
                        env.screen.width = evData[0];
                        env.screen.height = evData[1];
                        const window = { width: 0, height: 0 };
                        if (EnvCheck_1.check.riot) {
                            const bodSize = document.body.getBoundingClientRect();
                            window.width = bodSize.width;
                            window.height = bodSize.height;
                        }
                        this.model.setAtPath('environment.screen', env.screen);
                    }
                    if (evName === 'envInfo') {
                        try {
                            let env = this.model.getAtPath('environment');
                            // @ts-ignore
                            env = mergeEnvironmentData(env, data, this._riotVersion);
                            this.model.setAtPath('environment', env);
                            console.log('===================');
                            console.log('environment', env);
                            console.log('===================');
                            (0, EnvCheck_1.setEnvironment)(env); // for check
                            this.setPlatformClass(env);
                            this.setPathUtilInfo(env).then(() => {
                                // console.log('Setting up models annd menus')
                                // Set up app models and menus
                                this.model.addSection('menu', {});
                                if (appFront && appFront.appStart) { // appStart in tbFrontApp will likely create its own menu
                                    // console.log('Starting app')
                                    Promise.resolve(appFront.appStart(this)).then(() => {
                                        // console.log("Clearing model gate")
                                        this.modelGateResolver();
                                    });
                                }
                                else {
                                    // no front app, or no appStart, so we are just vanilla default
                                    // console.log("Clearing model gate with no app")
                                    this.modelGateResolver();
                                }
                            });
                        }
                        catch (e) {
                            console.error('problem processing envInfo EV message', e);
                            throw (e);
                        }
                    }
                    if (evName === 'menuAction') {
                        this.onMenuAction({ id: evData });
                    }
                });
                imrSingleton.subscribe((msgArray) => {
                    this.model.setAtPath('infoMessage.messages', msgArray);
                });
            });
        }
        else {
            if (!mainApi) {
                // console.log('setting mobile mainApi from injections')
                mainApi = mobileInjections.mainApi;
            }
        }
        // console.log('SetUIElements past first check. now adding page section to model')
        this.model.addSection('page', { navInfo: { pageId: '', context: {} } });
        // Set environment items
        // console.log('... now adding environment section to model')
        // this will allow us to do platform branching and so on
        this.model.addSection('environment', {}); // start empty; will get filled in on message.
        // console.log('testing nsapplication', nsapplication)
        let nsapplication = mobileInjections.nsapplication;
        if (nsapplication) { // i.e. if mobile
            const res = nsapplication.getResources();
            const env = res && res.passedEnvironment;
            // console.log('env', env)
            // console.log('was passed by ', res)
            this.model.setAtPath('environment', env);
            // too verbose for mobile to spew onto console
            // console.log('===================')
            // console.log('environment', env)
            // console.log('===================')
            (0, EnvCheck_1.setEnvironment)(env); // for check
            // this.setPlatformClass(env) // not needed for mobile
            // set up native back button listener
            if (nsapplication.android) {
                nsapplication.android.on("activityBackPressed", (data) => {
                    console.log('Android back button pressed');
                    data.cancel = true; // prevent further action
                    this.navigateBack();
                });
            }
            this.setPathUtilInfo(env).then(() => {
                // console.log('Setting up models annd menus')
                // Set up app models and menus
                this.model.addSection('menu', {});
                if (appFront && appFront.appStart) { // appStart in tbFrontApp will likely create its own menu
                    // console.log('Starting app')
                    Promise.resolve(appFront.appStart(this)).then(() => {
                        // console.log("Clearing model gate")
                        this.modelGateResolver();
                    });
                }
                else {
                    // no front app, or no appStart, so we are just vanilla default
                    // console.log("Clearing model gate with no app")
                    this.modelGateResolver();
                }
            });
        }
        else {
            // only for Electron
            // request a new emit of the environment on refresh
            // console.log('##### Requesting environment on restart ---------!!!')
            this.Api.requestEnvironment();
            // console.log('##### Setting up resize checker -----------')
            const window = { width: 0, height: 0 };
            // let resizeInterval = setInterval(() => {
            let resizeChecker = new css_element_queries_1.ResizeSensor(document.body, () => {
                const bodSize = document.body.getBoundingClientRect();
                if (window.width != bodSize.width || window.height !== bodSize.height) {
                    window.width = bodSize.width;
                    window.height = bodSize.height;
                    // console.log('see a body resize event', window)
                    this.model.setAtPath('environment.window', window, true);
                }
            });
        }
        return this.waitReady();
    }
    setPlatformClass(env) {
        if (EnvCheck_1.check.mobile) {
            // ns already sets .ns-phone and .ns-tablet, plus .ns-portrait/.ns-landscape
            // as well as .ns-ios and .ns-android,
            // so I don't think there's much more needed
            // and if there is, we should do it when we set the frame
        }
        else {
            let platClass;
            if (env.runtime.platform.name === 'darwin') {
                platClass = 'macos';
            }
            else if (env.runtime.platform.name === 'win32') {
                platClass = 'windows';
            }
            else {
                platClass = 'linux';
            }
            // console.log('setting platClass to '+platClass)
            document.body.classList.add(platClass);
        }
    }
    setPathUtilInfo(env) {
        if (mainApi) {
            if (!this.Path.cwd) {
                let appName = 'jove-app';
                try {
                    appName = env.build.app.name;
                }
                catch (e) {
                }
                // console.log('getting paths for app', appName)
                return mainApi.getUserAndPathInfo(appName).then((info) => {
                    // console.log(info)
                    const pathSetters = (0, PathUtils_1.getRemoteSetters)();
                    pathSetters.setCurrentWorkingDirectory(info.cwd);
                    pathSetters.setAssetsDirectory(info.assets);
                    pathSetters.setHomeDirectory(info.home);
                    // console.log('sending appDataPath', info.appData)
                    pathSetters.setAppDataDirectory(info.appData);
                    // console.log('sending documentsPath', info.documents)
                    pathSetters.setDocumentsDirectory(info.documents);
                    // console.log('sending downloadsPath', info.downloads)
                    pathSetters.setDownloadsDirectory(info.downloads);
                    // console.log('sending desktopPath', info.desktop)
                    pathSetters.setDesktopDirectory(info.desktop);
                    const plat = env.runtime.platform.name === 'win32' ? 'win32' : 'posix';
                    pathSetters.setPlatform(plat);
                });
            }
        }
        return Promise.resolve();
    }
    setupMenu(menuPath) {
        // console.log('%%%%%%%%%%%%%%%%%% setupMenu has been called')
        let pathUtils = this.Path;
        if (mainApi) {
            // in case our paths aren't set up yet in pathUtils, default to expectation
            let assetPath = pathUtils.join(pathUtils.assetsPath || 'front/assets', menuPath);
            // console.log('>> will set menu from ', assetPath)
            return Promise.resolve((0, MenuDef_1.setupMenu)(this, assetPath));
        }
        // console.error('no menu loaded -- api unavailable')
        return Promise.resolve(); // no menu loaded
    }
    setActiveMenu(menuComp) {
        this.activeMenu = menuComp;
    }
    onMenuAction(props) {
        const menuEvent = {
            id: props.id,
            app: this
        };
        if (this.activeMenu) {
            this.activeMenu.update({ open: false });
        }
        // dispatch to current page activity.  include app instance in props
        let handled = false;
        if (this.currentActivity) {
            if (typeof this.currentActivity.onMenuAction === 'function') {
                handled = this.currentActivity.onMenuAction(menuEvent);
            }
        }
        // now call any app registered menu handlers (not page bound)
        if (!handled) {
            const handler = this.menuHandlers[props.id];
            if (handler) {
                handled = handler(menuEvent);
            }
        }
        // default action for about if not trappedƒ
        if (!handled) {
            if (props.id === 'APP_ABOUT') {
                return this.defaultAboutBox();
            }
        }
    }
    defaultAboutBox() {
        console.log('Default about box');
        const env = this.model.getAtPath('environment');
        const appInfo = env.build.app;
        const buildDate = new Date(appInfo.buildTime).toLocaleDateString(); // TODO use Formatter
        const options = {
            title: `About ${appInfo.displayName}`,
            message: `${appInfo.displayName}\nVersion ${appInfo.version}\n\n${appInfo.description}\n`,
            detail: `created by ${appInfo.author}\n${buildDate}\n\n${appInfo.copyright}\n`,
            buttons: ['O&kay']
        };
        return this.messageBox(options);
    }
    onToolAction(props) {
        const menuEvent = {
            id: props.id,
            app: this
        };
        // dispatch to current activity.  include app instance in props
        if (this.currentActivity) {
            if (typeof this.currentActivity.onToolAction === 'function') {
                this.currentActivity.onToolAction(menuEvent);
            }
        }
        const handler = this.menuHandlers[props.id];
        if (handler) {
            handler(menuEvent);
        }
    }
    callPageAction(name, ev) {
        let comEvent = {
            nativeEvent: ev,
            target: ev.target,
            type: ev.type
        };
        if (this.currentActivity) {
            if (typeof this.currentActivity[name] === 'function') {
                this.currentActivity[name](comEvent);
            }
        }
    }
    /**
     * Register a global-scope handler for a menu or a tool action
     * or pass null instead of the handler function to clear it
     * @param menuId  menu action identifier
     * @param handler function to handle menu event
     */
    registerMenuHandler(menuId, handler) {
        if (handler)
            this.menuHandlers[menuId] = handler;
        else
            delete this.menuHandlers[menuId];
    }
    // TODO: make part of a more defined util section
    makeStringParser(string) {
        return StringParser_1.StringParser && new StringParser_1.StringParser(string);
    }
    keyListener(event) {
        // console.log('key event seen '+event.key)
        if (event.isComposing || event.code === "229") {
            return;
        }
        if (event.key === "Backspace" || event.key === "Delete") {
            event.stopPropagation();
            event.preventDefault();
            this.navigateBack();
        }
    }
    attachPageKeyListener() {
        if (!keyListenerBind) {
            keyListenerBind = this.keyListener.bind(this);
        }
        document.addEventListener('keydown', keyListenerBind);
    }
    removePageKeyListener() {
        document.removeEventListener('keydown', keyListenerBind);
    }
    /**
     * Replaces the currently mounted page markup with the markup of the named page
     * and starts the associated activity.
     *
     * @param {string} pageId
     * @param {object} [context]
     */
    navigateToPage(pageId, context, skipHistory) {
        if (!pageId)
            return;
        if (pageId.substring(pageId.length - 5) === '-page') {
            pageId = pageId.substring(0, pageId.length - 5);
        }
        if (pageId === 'main' && this.runTest) {
            if (!EnvCheck_1.check.mobile) {
                if (this.testDisposition.indexOf('debug') !== -1) {
                    mainApi.openDevTools();
                }
            }
            let host;
            let hi = this.testDisposition.indexOf('host=');
            if (hi !== -1) {
                host = this.testDisposition.substring(hi + 5).trim();
            }
            setTimeout(() => {
                console.log("RUNNING TESTS");
                mainApi.startTest(host).then(() => {
                    this.runTest = false;
                    console.log('>>>>>>>>>>>>>>>>>> TEST COMPLETED <<<<<<<<<<<<<<<<<<<<');
                    if (this.testDisposition.indexOf('exit') !== -1) {
                        console.log('exiting');
                        mainApi.appExit(0);
                    }
                    else if (this.testDisposition.substring(0, 3) === 'run') {
                        const pi = this.testDisposition.substring(4).trim();
                        if (pi) {
                            pageId = pi;
                            context = undefined;
                            skipHistory = undefined;
                        }
                        this.navigateToPage(pageId, context, skipHistory);
                    }
                });
            }, 100);
        }
        // console.log('continuing with navigate to page')
        // set the page in the model.  For Riot, this forces the page to change on update
        // for mobile, we need to do that through native navigation, but we still want the model to be the same
        // console.log('$$$$$$$$$$ navigate to page ' + pageId)
        const navInfo = this.model.getAtPath('page.navInfo');
        let prevPageId = navInfo.pageId;
        let prevContext = navInfo.context;
        navInfo.timestamp = Date.now();
        navInfo.pageId = pageId;
        navInfo.context = context || {};
        // this switches the page at this point, or at least updates it
        this.model.setAtPath('page.navInfo', navInfo);
        if (prevPageId === pageId && prevContext === context)
            skipHistory = true;
        // note that this isn't used on the mobile side, but we record it anyway.
        // this may be useful later if we have any history-related functionality in common.
        if (!skipHistory) {
            this.history.push({
                pageId: prevPageId,
                context: prevContext
            });
        }
        if (EnvCheck_1.check.mobile) {
            let pageref = '~/pages/' + pageId + '-page';
            // console.log('>>>>> mobile pageref', pageref)
            const navigationEntry = {
                moduleName: pageref,
                backstackVisible: !skipHistory
            };
            // console.log('>>> the frame', theFrame)
            // console.log('>>> navigation Entry', navigationEntry)
            reservedContext = context; // pass via this variable
            theFrame && theFrame.navigate(navigationEntry);
            // apparently, we can pass a function instead of a navigationEntry to construct a Page
            // which might be something to look at later if we want to work from our own common page definition
            // instead of writing out {N} syntax files.
            // Function needs to build full page including the layout stack and any event handlers.
            // not sure what effect this has on back history, since there's nothing passed for that.
            // console.log('------------------')
            // console.log(' -- Looking at Frame classes')
            // console.log('className', theFrame.className)
            // console.log('cssClasses', theFrame.cssClasses)
            // console.log('------------------')
        }
        else {
            const pageComponent = findPageComponent(pageId);
            if (!pageComponent) {
                throw Error('No page component for ' + pageId);
            }
            // console.log('------------------')
            // console.log(' -- Looking at body classes')
            // console.log('className', document.body.className)
            // console.log('classList', document.body.classList)
            // console.log('------------------')
            const activity = pageComponent.activity;
            if (!activity) {
                throw Error('No exported activity for ' + pageId);
            }
            activity.context = context;
            // console.log('$$$$ Starting page', pageId, context)
            this.startPageLogic(pageId, activity, context);
        }
    }
    /**
     * Called by mobile page-launch wrapper (onLoaded) to set up bindings
     * This does basically what the navigateToPage code does in the second part for desktop
     */
    setPageBindings(pageId, activity, pageMethods) {
        const bindMe = { pageMethods };
        bindMe.navInfo = {
            pageId,
            context: reservedContext
        };
        // console.log('set page bindings to ', bindMe)
        return bindMe;
    }
    /**
     * Called by mobile page-launch wrapper (onNavigatedTo) to invoke the page logic (activity)
     * This does basically what the navigateToPage code does in the second part for desktop
     */
    launchActivity(pageId, activity) {
        this.startPageLogic(pageId, activity, reservedContext);
        reservedContext = null;
    }
    /**
     * reload the current page.
     * May be necessary on orientation change
     */
    reloadCurrentPage() {
        let navinfo = this.model.getAtPath('page.navInfo');
        this.navigateToPage(navinfo.pageId, navinfo.context, true);
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
    setPageData(pageName, item, value) {
        // console.log('(in setPageData)')
        let fullPageName, pageId;
        if (pageName.substring(pageName.length - 5) === '-page') {
            fullPageName = pageName;
            pageId = pageName.substring(0, pageName.length - 5);
        }
        else {
            pageId = pageName;
            fullPageName = pageName + '-page';
        }
        let data = {};
        // @ts-ignore
        if (!this.model['page-data']) {
            let sdata = {};
            sdata[fullPageName] = {};
            this.model.addSection('page-data', sdata);
        }
        try {
            // console.log('...spd trace 1')
            data = this.model.getAtPath('page-data.' + fullPageName) || {};
        }
        catch (e) {
            data = {};
        }
        // console.log('...spd trace 2')
        if (typeof item === 'object') {
            // console.log('...spd trace 3')
            this.model.setAtPath('page-data.' + fullPageName, item, true);
        }
        else {
            // console.log('...spd trace 4')
            data[item] = value;
            this.model.setAtPath('page-data.' + fullPageName, data, true);
        }
        // console.log('...spd trace 5')
        let curActivityId = this.currentActivity && this.currentActivity.activityId;
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
    updatePage(pageName) {
        // console.log('doing mobile update of page data')
        const data = this.getPageData(pageName);
        this.model.setAtPath('page-data.' + pageName, data, true, false);
        // This seems to work in terms of forcing the update, but of course, since the page updates itself when it loads
        // we end up in an infinite loop
        // so we need to see if this page has already been updated recently, and not do it a second time
        if (!this.pageUpdates) {
            this.pageUpdates = {};
        }
        let now = Date.now();
        if (this.pageUpdates[pageName] && now - this.pageUpdates[pageName] < 1000) {
            return;
        }
        this.pageUpdates[pageName] = now;
        this.reloadCurrentPage();
    }
    /**
     * Returns the data object for the named page, if one exists
     * @param pageName
     */
    getPageData(pageName) {
        if (pageName.substring(pageName.length - 5) !== '-page')
            pageName += '-page';
        try {
            return this.model.getAtPath('page-data.' + pageName);
        }
        catch (e) {
            console.warn('no page data for ' + pageName);
            return {};
        }
    }
    getFromCurrentPageData(accPath) {
        let navinfo = this.model.getAtPath('page.navInfo');
        let pageData = this.getPageData(navinfo.pageId);
        let v = pageData;
        const parts = accPath.split('.');
        for (let p of parts) {
            v = v[p] || '';
        }
        return v;
    }
    /**
     * Called by mobile side to start the first activity only ('main')
     *
     * @param activity
     * @param context
     */
    startPageLogic(id, activity, context) {
        activity.activityId = id;
        activity.context = context;
        // console.log('>>>>>>>>>>>> setting activity', activity)
        this.currentActivity = activity;
        // console.log('About to start activity ', this.currentActivity)
        if (!EnvCheck_1.check.mobile) {
            activity.onBeforeUpdate = (props, state) => {
                console.log('Announcement that the page will update', this, activity, props, state);
            };
            this.attachPageKeyListener();
        }
        activity.pageStart(this, context);
    }
    navigateBack() {
        let popBack = this.history.pop();
        if (popBack) {
            // console.log(popBack)
            this.navigateToPage(popBack.pageId, popBack.context, true);
        }
    }
    findComponent(tagName, prop, propValue) {
        let comp = null;
        if (EnvCheck_1.check.riot) {
            // find it using the DOM
            let selector = tagName;
            if (prop) {
                selector += `[${prop}`;
                if (propValue)
                    selector += `=${propValue}`;
                selector += ']';
            }
            const el = document.body.querySelector(selector);
            comp = this.getComponent(el);
        }
        else {
            // for nativescript:
            const top = theFrame.currentPage.content;
            top.component = top; // make it look like a StdComp
            const comNormal = new ComNormal_1.ComNormal(top);
            const candidates = comNormal.elementFindAll(tagName);
            for (let cand of candidates) {
                if (!prop || cand.get(prop) === propValue) {
                    comp = cand;
                    break;
                }
            }
        }
        return comp;
    }
    /**
     * Dispatch an event to the current activity by name
     *
     * @param name
     * @param domEvent
     */
    callEventHandler(tag, platEvent, value) {
        const act = this.currentActivity;
        let ed;
        // platEvent might be a Dom Event or it could be EventData
        if (platEvent.target) { // looks like Dom event
            ed = new EventData_1.EventData();
            ed.app = this;
            if (platEvent) {
                ed.platEvent = platEvent;
                ed.sourceComponent = this.getComponent(platEvent.target);
                ed.eventType = platEvent.type;
            }
        }
        else {
            ed = platEvent;
        }
        let name;
        if (EnvCheck_1.check.mobile) {
            name = (ed.sourceComponent && ed.sourceComponent.get(tag)) || 'onAnonymousEvent';
        }
        else {
            name = (ed.sourceComponent && ed.sourceComponent.state[tag]) || 'onAnonymousEvent';
        }
        ed.tag = tag;
        ed.value = value;
        if (act && typeof act[name] === 'function') {
            act[name](ed);
        }
        else {
            if (name !== 'onAnonymousEvent') {
                if (act)
                    console.error(`${name} is not a function exposed on current activity ${act.activityId}`);
            }
        }
    }
    // same as the one in ComCommon, but duplicated here for use with eventData
    getComponent(el) {
        try {
            let syms;
            do {
                if (el) {
                    syms = Object.getOwnPropertySymbols(el);
                    if (syms.length === 0) {
                        el = el.parentElement;
                    }
                }
                else {
                    return null;
                }
            } while (syms && syms.length === 0);
            // @ts-ignore
            return el[syms[0]];
        }
        catch (e) {
            Log_1.default.warn(e.message || e);
            return null;
        }
    }
    // ------- access to PathUtils
    get Path() {
        if (!this._pathUtils) {
            this._pathUtils = new PathUtils_1.PathUtils();
        }
        return this._pathUtils;
    }
    // ------- Extension for indicators / tools
    createExtensionType(name) {
        // @ts-ignore
        const EType = extensionTypes[name];
        if (EType) {
            return new EType();
        }
    }
    // extensions
    callExtension(moduleName, functionName, ...args) {
        return callExtensionApi(moduleName, functionName, args);
    }
    getToolState(toolId) {
        return this.model.getAtPath('toolbar-' + toolId + ".state") || 'default';
    }
    setToolState(toolId, state) {
        this.model.setAtPath('toolbar-' + toolId + '.state', state || 'default');
    }
    getIndicatorState(indId) {
        return this.model.getAtPath('indicator-' + indId + ".state") || 'default';
    }
    setIndicatorState(indId, state) {
        this.model.setAtPath('indicator-' + indId + '.state', state || 'default');
    }
    registerToolExtension(name, extension) {
        // @ts-ignore
        extensionTypes[name] = extension;
    }
    messageBox(options) {
        return Promise.resolve(mainApi && mainApi.openDialog(options));
    }
    connectTestMethods() {
        const callTestRequest = (request, params) => {
            // console.log('callTestRequest', request, params)
            const ops = testOps;
            const fn = ops[request];
            const resp = fn && fn.apply(this, params);
            // console.log('callTestRequest in app-core returns ', resp)
            return resp;
        };
        if (gwindow) {
            testOps.initModule(this);
            gwindow.callTestRequest = callTestRequest;
            // console.log('connected callTestRequest to window at ', gwindow.callTestRequest)
        }
        // console.log('mobileInjections.setCallTestRequest is ',mobileInjections?.setCallTestRequest)
        if (mobileInjections === null || mobileInjections === void 0 ? void 0 : mobileInjections.setCallTestRequest) {
            // console.log('connecting callTestRequest via mobile injections', mobileInjections.setCallTestRequest)
            mobileInjections.setCallTestRequest(callTestRequest);
            // console.log('connected callTestRequest to window at ', gwindow.callTestRequest)
        }
    }
}
exports.AppCore = AppCore;
// as it is from ComCommon
function getComponent(el) {
    try {
        let syms;
        do {
            if (el) {
                syms = Object.getOwnPropertySymbols(el);
                if (syms.length === 0) {
                    el = el.parentElement;
                }
            }
            else {
                return null;
            }
        } while (syms && syms.length === 0);
        // @ts-ignore
        return el[syms[0]];
    }
    catch (e) {
        console.warn(e.message || e);
        return null;
    }
}
function findPageComponent(pageId) {
    const tag = pageId + '-page';
    // console.log('finding page with tag',tag)
    const el = document.getElementById('root');
    const appComp = getComponent(el);
    const pageCompEl = appComp.$$(tag)[0];
    const pageComp = getComponent(pageCompEl);
    // console.log('found page', pageComp)
    return pageComp;
}
function mergeEnvironmentData(env, data, riotVersion) {
    // debug
    // console.log('-------env merge')
    // console.log('env, data ', env, data)
    // console.log('riot version ', riotVersion)
    try {
        // merges the sometimes differently formatted environment info from
        // build and startup with initial stuff from EnvCheck load to create
        // the canonical Environment data.
        data = data.data || data;
        let build = data.build;
        // console.log('build isolated', build)
        let rfw = Object.assign({}, env.runtime && env.runtime.framework, data.runtime && data.runtime.framework);
        // console.log('runtime.framework, isolated', rfw)
        let platform = data.runtime && data.runtime.platform;
        if (!platform)
            platform = env.runtime && env.runtime.platform;
        if (!platform)
            platform = env.platform || {};
        // console.log('runtime platform, isolated', platform)
        if (riotVersion)
            rfw.riot = riotVersion;
        rfw.nativeScript = build.platform.nativeScript;
        let out = {
            build,
            runtime: {
                framework: rfw,
                platform: platform
            }
        };
        delete out.runtime.window;
        out.window = env.window;
        return out;
    }
    catch (e) {
        console.error(e);
    }
}
