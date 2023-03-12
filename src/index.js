"use strict";
/*
    Jove Framework
    Main Source file
    Defines all exports of the framework API for use by adopting apps.
*/
exports.__esModule = true;
exports.ComNormal = exports.EventData = exports.ToolExtension = exports.PathUtils = exports.setupMenu = exports.MenuApi = exports.MenuItem = exports.AppCore = exports.Log = exports.registerApp = exports.FrameworkBackContext = void 0;
var electronApp, BrowserWindow, preloadPath, AppGateway, ipcMain;
var makeWindowStatePersist;
var nscore, nativescriptApp, registerExtensionModule;
var startupTasks;
var frameworkContext;
// console.log("%%%%%%%%%%% past basic discovery %%%%%%%%%%%%%%%")
// console.log("isNS = "+isNS)
function injectDependencies(injected) {
    electronApp = injected.electronApp;
    BrowserWindow = injected.BrowserWindow;
    preloadPath = injected.preloadPath;
    AppGateway = injected.AppGateway;
    ipcMain = injected.ipcMain;
    nscore = injected.nscore;
    nativescriptApp = injected.nativescriptApp;
    registerExtensionModule = injected.registerExtensionModule;
    makeWindowStatePersist = injected.makeWindowStatePersist;
    startupTasks = injected.startupTasks;
    console.log('%%%%%% injection happens %%%%%%%%');
}
/**
 * defines the Framework access object passed to the __appStart__ lifecycle callback for the back process
 */
var FrameworkBackContext = /** @class */ (function () {
    function FrameworkBackContext(backApp) {
        var _this = this;
        this.title = 'jove-app';
        this.appName = 'jove-app';
        this.passedEnvironment = {};
        this.startupPromises = [];
        this.electronApp = electronApp;
        this.nativescriptApp = nativescriptApp;
        this.backApp = backApp;
        console.log('Framework back app constructor');
        console.log('calling beginStartup');
        this.beginStartup();
        console.log('done with begin startup and we have ' + this.startupPromises.length + ' promises to wait on...');
        Promise.all(this.startupPromises).then(function () {
            try {
                var _a = startupTasks.passEnvironmentAndGetTitles(), appName = _a.appName, title = _a.title;
                _this.appName = appName;
                _this.title = title;
            }
            catch (e) {
                console.error('Error passing environment ', e);
            }
            try {
                if (electronApp)
                    _this.createWindow();
                if (nativescriptApp)
                    nativescriptApp.run();
            }
            catch (e) {
                console.error('Startup Error in final run handoff');
            }
        });
    }
    FrameworkBackContext.prototype.beginStartup = function () {
        var _this = this;
        try {
            console.log('about to call readBuildEnvironment');
            var rt = startupTasks.readBuildEnvironment();
            console.log('did so, and return was', rt);
            console.log('pushing as promise and continuing');
            this.startupPromises.push(Promise.resolve(rt));
            if (electronApp) {
                console.log('electron app. Pushing whenReady');
                this.startupPromises.push(electronApp.whenReady);
                console.log('adding electron state event listeners');
                electronApp.on('activate', function () {
                    console.log('Framework back app Activated');
                    // On macOS it's common to re-create a window in the app when the
                    // dock icon is clicked and there are no other windows open.
                    if (BrowserWindow.getAllWindows().length === 0)
                        _this.createWindow();
                });
                // Quit when all windows are closed, except on macOS. There, it's common
                // for applications and their menu bar to stay active until the user quits
                // explicitly with Cmd + Q.
                electronApp.on('window-all-closed', function () {
                    if (process.platform !== 'darwin') {
                        console.warn('TODO: call appExit from here');
                        // TODO: Check Electron docs for an explicit quit event and trap there instead
                        Promise.resolve(_this.backApp.appExit(_this)).then(function () {
                            electronApp.quit();
                        });
                    }
                });
            }
        }
        catch (e) {
            console.error('Error in beginStartup', e);
        }
    };
    FrameworkBackContext.prototype.createWindow = function () {
        var _this = this;
        if (this.electronApp) {
            this.windowKeeper = makeWindowStatePersist(this.appName);
            // console.log('window keeper before restore', this.windowKeeper)
            this.windowKeeper.restore().then(function () {
                // console.log('window keeper after restore', this.windowKeeper)
                // Create the browser window.
                var mainWindow = new BrowserWindow({
                    width: _this.windowKeeper.width || (_this.backApp.options && _this.backApp.options.width) || 800,
                    height: _this.windowKeeper.height || (_this.backApp.options && _this.backApp.options.height) || 600,
                    x: _this.windowKeeper.x || (_this.backApp.options && _this.backApp.options.startX) || 0,
                    y: _this.windowKeeper.y || (_this.backApp.options && _this.backApp.options.startY) || 0,
                    icon: __dirname + '/assets/icons/png/64x64.png',
                    title: _this.title,
                    webPreferences: {
                        nodeIntegration: false,
                        contextIsolation: true,
                        enableRemoteModule: false,
                        preload: preloadPath
                    }
                });
                // console.log('window keeper before track', this.windowKeeper)
                _this.windowKeeper.track(mainWindow);
                // console.log('window keeper after track', this.windowKeeper)
                // send window events via ipc
                mainWindow.on('resize', function (e) {
                    var size = mainWindow.getSize();
                    // console.log('electron sees resize ', size)
                    AppGateway.sendMessage('EV', { subject: 'resize', data: size });
                });
                // and load the index.html of the app.
                mainWindow.loadFile('./front/index.html');
                // TODO: Make subject to options
                mainWindow.fullScreen = (_this.backApp.options && _this.backApp.options.fullScreen) || false;
                // Open the DevTools.
                if ((_this.backApp.options && _this.backApp.options.devTools)) {
                    mainWindow.webContents.openDevTools();
                }
                _this.electronWindow = mainWindow;
            });
        }
    };
    /**
     * Register an extension that is run on the back-side
     * @param name
     * @param module
     */
    FrameworkBackContext.prototype.registerExtensionModule = function (name, module) {
        // console.log('TODO: registerExtensionModule(name, module)', registerExtensionModule)
        registerExtensionModule(name, module);
    };
    return FrameworkBackContext;
}());
exports.FrameworkBackContext = FrameworkBackContext;
/**
 * A Jove app main startup code calls here to establish the
 * functional app core of the application.  The app core instance passed
 * must satisfy the interface requirements for {@link: TBBackApp}
 *
 * @param {TBApp} app
 */
function registerApp(injected, backApp) {
    console.log('>>>>> Start of Framework: Register App');
    console.log('injections incoming:', injected);
    injectDependencies(injected); // bring in our target
    if (injected.electronApp) {
        new AppGateway(ipcMain); // wire up front and back
        console.log('Launching Electron App\n');
    }
    else {
        console.log('Launching Nativescript App\n');
    }
    console.log('Completing launch through FrameworkBackContext constructor');
    frameworkContext = new FrameworkBackContext(backApp); // the constructor takes it away
}
exports.registerApp = registerApp;
exports.Log = {
    debug: function () {
        var a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            a[_i] = arguments[_i];
        }
        console.log.apply(console, a);
    },
    log: function () {
        var a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            a[_i] = arguments[_i];
        }
        console.log.apply(console, a);
    },
    info: function () {
        var a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            a[_i] = arguments[_i];
        }
        console.log.apply(console, a);
    },
    warn: function () {
        var a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            a[_i] = arguments[_i];
        }
        console.warn.apply(console, a);
    },
    error: function () {
        var a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            a[_i] = arguments[_i];
        }
        console.error.apply(console, a);
    },
    exception: function () {
        var a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            a[_i] = arguments[_i];
        }
        console.error.apply(console, a);
    }
};
var AppCore_1 = require("./app-core/AppCore");
exports.AppCore = AppCore_1.AppCore;
var EventData_1 = require("./app-core/EventData");
exports.EventData = EventData_1.EventData;
var MenuApi_1 = require("./application/MenuApi");
exports.MenuItem = MenuApi_1.MenuItem;
exports.MenuApi = MenuApi_1.MenuApi;
var MenuDef_1 = require("./application/MenuDef");
exports.setupMenu = MenuDef_1.setupMenu;
var PathUtils_1 = require("./application/PathUtils");
exports.PathUtils = PathUtils_1.PathUtils;
var ToolExtension_1 = require("./extension/ToolExtension");
exports.ToolExtension = ToolExtension_1.ToolExtension;
var ComNormal_1 = require("./app-core/ComNormal");
exports.ComNormal = ComNormal_1.ComNormal;
