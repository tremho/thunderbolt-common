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
exports.tree = exports.callPageFunction = exports.goToPage = exports.triggerAction = exports.setComponentProperty = exports.readComponentProperty = exports.assignComponent = exports.setModelValue = exports.readModelValue = exports.initModule = void 0;
const EventData_1 = require("../app-core/EventData");
let app;
let componentMap = {};
/**
 * Called on app start by app-core to establish our app context
 * @param appIn
 */
function initModule(appIn) {
    app = appIn;
    componentMap = {};
}
exports.initModule = initModule;
/**
 * Reads the value in the app model at the given model path
 * @param modelPath
 */
function readModelValue(modelPath) {
    return app.model.getAtPath(modelPath);
}
exports.readModelValue = readModelValue;
/**
 * Sets a value in the model at the given model path
 * @param modelPath
 * @param value
 */
function setModelValue(modelPath, value) {
    return __awaiter(this, void 0, void 0, function* () {
        app.model.setAtPath(modelPath, value);
    });
}
exports.setModelValue = setModelValue;
/**
 * Selects a component on the page via a selector and assigns it to a name we can reference later
 *
 * @param name Name to assign to the component
 * @param tagName tag name of the component (e.g. simple-label)
 * @param [prop] optional name of a property to check on this component
 * @param [propValue] optional if prop given, this is the value to match
 *
 * @return true if was component was found and assigned to name
 */
function assignComponent(name, tagName, prop, propValue) {
    return __awaiter(this, void 0, void 0, function* () {
        const comp = app.findComponent(tagName, prop, propValue);
        componentMap[name] = comp;
        return comp ? true : false;
    });
}
exports.assignComponent = assignComponent;
/**
 * Reads the value of a property of the named component
 *
 * @param componentName
 * @param propName
 */
function readComponentProperty(componentName, propName) {
    return __awaiter(this, void 0, void 0, function* () {
        const comp = componentMap[componentName];
        // console.log('>> TestOp: readComponentProperty ', componentName, propName, comp)
        const resp = comp && comp.com.getComponentAttribute(comp, propName);
        // console.log('returning', resp)
        return resp;
    });
}
exports.readComponentProperty = readComponentProperty;
/**
 * Sets the  property of a named component to the given value
 *
 * @param componentName
 * @param propName
 * @param propValue
 */
function setComponentProperty(componentName, propName, propValue) {
    return __awaiter(this, void 0, void 0, function* () {
        const comp = componentMap[componentName];
        if (comp) {
            // TODO: Create setComponentAttribute in ComCommon
            // comp.com.setComponentAttribute(comp, propName, propValue)
        }
    });
}
exports.setComponentProperty = setComponentProperty;
/**
 * Triggers the named action on the named component.
 * this effectively simulates an event call to the function named in the 'action' property
 * @param componentName Assigned component name
 * @param [action] optional action property name, defaults to 'action'
 *
 * @Returns true if action function was called
 */
function triggerAction(componentName, action) {
    return __awaiter(this, void 0, void 0, function* () {
        action = 'action'; // TODO: sanity force
        // console.log('> triggerAction', componentName, action)
        const comp = componentMap[componentName];
        if (comp) {
            const fname = comp.com.getComponentAttribute(comp, action);
            if (fname) {
                // console.log('  fname', fname)
                const ev = new EventData_1.EventData();
                // TODO: Problem -- ev.app must be set, but this is a circular object that can't pass, so is sourceComponent.
                // My planned solution: use keywords for '$$APP$$', etc and swap these in callFunction pconv.
                ev.app = "$$APP$$";
                ev.sourceComponent = '$$TESTCOMP$$ ' + componentName;
                ev.tag = action;
                ev.eventType = 'test';
                // console.log(' constructed event', ev)
                const strev = JSON.stringify(ev);
                callPageFunction(fname, [strev]);
                return true;
            }
            else {
                console.warn(`action ${action} does not resolve to a function name`);
            }
        }
        else {
            console.warn(`component ${componentName} not assigned`);
        }
        return false;
    });
}
exports.triggerAction = triggerAction;
/**
 * Navigate to the given page, optionally passing a context object
 * @param pageName
 * @param context
 */
function goToPage(pageName, context) {
    return __awaiter(this, void 0, void 0, function* () {
        app.navigateToPage(pageName, context);
    });
}
exports.goToPage = goToPage;
/**
 * Call a function of a given name on the current page, passing optional parameters
 * @param funcName  Name of exported function found on current page logic
 * @param [parameters]  Array of optional parameters to pass (objects and arrays must be serialized JSON)
 *
 * TODO: Convert keyword objects (
 *
 */
function callPageFunction(funcName, parameters = []) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log('callPageFunction', funcName, parameters)
        const pconv = [];
        for (let p of parameters) {
            if (typeof p === 'string' && (p.charAt(0) === '{' || p.charAt(0) === '[')) {
                const obj = JSON.parse(p);
                for (let p of Object.getOwnPropertyNames(obj)) {
                    let v = obj[p];
                    if (v.charAt(0) === '$') {
                        let n = v.lastIndexOf('$');
                        let k = v.substring(0, n + 1);
                        if (k === '$$APP$$') {
                            obj[p] = app;
                        }
                        else if (k === '$$TESTCOMP$$') {
                            let cname = p.substring(n + 1);
                            obj[p] = componentMap[cname];
                        }
                    }
                }
                pconv.push(obj);
            }
            else {
                if (p.charAt(0) === '$') {
                    let n = p.lastIndexOf('$');
                    let k = p.substring(0, n + 1);
                    if (k === '$$APP$$$') {
                        pconv.push(app);
                    }
                    else if (k === '$$TESTCOMP$$') {
                        let cname = p.substring(n + 1);
                        pconv.push(componentMap[cname]);
                    }
                }
                else {
                    pconv.push(p);
                }
            }
        }
        const activity = app.currentActivity;
        if (activity) {
            if (typeof activity[funcName] === 'function') {
                // console.log('calling ', funcName, pconv)
                return activity[funcName](...pconv);
            }
        }
        else {
            console.warn('no activity found');
        }
    });
}
exports.callPageFunction = callPageFunction;
// perform a menu action
// perform a tool action
//
// take + record screenshot
function compView(el) {
    let comp = {};
    comp.automationText = el.getAttribute('automationText') || '';
    comp.className = el.className;
    comp.tagName = el.tagName;
    comp.text = el.getAttribute('text') || '';
    let bounds = el.getBoundingClientRect();
    comp.bounds = {
        top: bounds.top,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height,
        z: Number(el.style.zIndex || 0) || 1
    };
    // console.log('compview ', comp, el)
    comp.children = [];
    let ch = el.firstElementChild;
    while (ch) {
        comp.children.push(compView(ch));
        ch = ch.nextElementSibling;
    }
    return comp;
}
function tree() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        console.log('in Desktop tree iterator');
        let tree = {};
        let win;
        if (typeof window !== undefined)
            win = window;
        console.log('we have a window? ', !!win && !!win.document);
        let page;
        if (win) {
            const boundTag = win.document.body.querySelector('[is="app"]');
            console.log('boundTag', boundTag);
            if (boundTag) {
                page = (_a = boundTag.firstChild) === null || _a === void 0 ? void 0 : _a.firstChild;
                console.log('page', page);
                // this is the current page.  we may need to iterate siblings to find visible, but I think this is the only one
                // we will find realized to the DOM
                tree.pageId = page.tagName;
                tree.content = compView(page);
            }
        }
        console.log('tree', tree);
        return tree;
    });
}
exports.tree = tree;
