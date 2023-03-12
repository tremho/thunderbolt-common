"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModel = exports.ModelPathError = void 0;
/**
 * Map of all active bindings, both up and down
 */
const bindings = {
    up: {},
    down: {}
};
/**
 * THe Binding Object holds the necessary properties to that the binding code
 * uses to commute values between the model and the components.
 */
class Binding {
    constructor(component, model, direction, section, prop, changeFn) {
        this.component = component;
        this.model = model;
        this.direction = direction;
        this.section = section;
        this.prop = prop;
        this.onChange = changeFn;
    }
    /**
     * Downward update to model.
     * Not really used.
     * @param prop
     * @param value
     */
    update(prop, value) {
        // @ts-ignore
        this.model[this.section][prop] = value;
    }
}
class KModelPathError extends Error {
    constructor(message) {
        super(message);
    }
}
/**
 * Extends Error to define a bad access path to the model was encountered
 *
 * @param message
 * @constructor
 */
function ModelPathError(message) {
    return new KModelPathError(message);
}
exports.ModelPathError = ModelPathError;
// private implementation for the `bind` method of AppModel.  See docs there.
function bind(component, model, section, prop, onChange, type) {
    if (type !== 'write') {
        // anything model announces to UI
        // this is one-to-many so we need an array
        // @ts-ignore
        if (!bindings.up[section])
            bindings.up[section] = [];
        // @ts-ignore
        bindings.up[section].push(new Binding(component, model, 'up', section, prop, onChange));
    }
    if (type !== 'read') {
        // anything UI announces to Model
        // this is many-to-one so, one will do.
        // @ts-ignore
        if (!bindings.down[section]) {
            // @ts-ignore
            bindings.down[section] = new Binding(component, model, 'down', section, prop, onChange);
        }
    }
}
// broadcast to component layer
function announce(section, prop, value, old) {
    // find bindings for section name, prop
    // if(section === 'environment' && prop == 'screen') {
    // console.log('bind onChange for environment.screen')
    // }
    // @ts-ignore
    const bnds = bindings.up[section];
    if (bnds)
        bnds.forEach((bnd) => {
            // communicate value to ui layer
            bnd.onChange(bnd.component, prop, value, old);
        });
}
// to model (downward from component)
// not really used.  Basically equivalent to setAtPath.
function toModel(section, prop, value) {
    // find the downward binding for section name, prop
    // @ts-ignore
    const bnd = bindings.down[section];
    bnd.update(prop, value);
}
// Create a JS Proxy object to handle our section
function proxySection(name, props) {
    const proxy = new Proxy(props, {
        get: function (obj, prop, receiver) {
            // @ts-ignore
            return obj[prop];
        },
        set: function (obj, prop, value, receiver) {
            // @ts-ignore
            let old = obj[prop];
            // @ts-ignore
            obj[prop] = value;
            announce(name, prop, value, old);
            return true;
        }
    });
    return proxy;
}
/**
 * The AppModel object holds the realized Application model sections and provides
 * methods for creating, accessing, and binding to these values.
 */
class AppModel {
    constructor() {
        this.model = {};
    }
    /**
     * Creates a new section in the model.
     * Initial properties for this section are supplied by the `props` parameter.
     * Additional properties may be set to this section using the `setAtPath` method, with `force` = true.
     *
     * @param {string} name Name for the new section
     * @param {object} props Initial values to apply to this section.
     */
    addSection(name, props) {
        // @ts-ignore
        this.model[name] = proxySection(name, props);
    }
    /**
     * The `bind` method is called from the component layer.
     * The 'type' may be 'read' (upward from model to component) or
     * 'write' (downward from component to model) or the default, ('readwrite') which registers in both directions.
     *
     * THe onChange function takes the form: `(comp:any, prop:string, value:any, oldValue:any):void`
     *
     * @param {*} component The component to bind to
     * @param {string} section Section name where this binding is recorded
     * @param {string} prop Property in the section to bind to
     * @param {function} onChange Function to call on update of this value.
     * @param {string} [type] 'read', 'write', or 'readwrite' as the default.
     */
    bind(component, section, prop, onChange, type) {
        bind(component, this.model, section, prop, onChange, type);
        // const value = this.getAtPath(section+'.'+prop)
        // announce(section, prop, value)
    }
    /**
     * Return proxy section at the given path
     *
     * @param {string} path The path to extract the section from
     * @return {Section} The section named
     *
     * @throws {ModelPathError} if the section path does not exist
     * @private
     */
    accessSection(path) {
        let parts = path.split('.');
        let obj = this.model;
        let i = 0;
        if (parts[0] === 'root')
            i++;
        while (i < parts.length - 1) {
            // @ts-ignore
            if (typeof obj[parts[i]] === 'object') {
                // @ts-ignore
                obj = obj[parts[i++]];
            }
            else {
                throw ModelPathError(`Invalid model path ${path} at "${parts[i]}"`);
                // console.error(`Invalid model path at ${parts.slice(0, i).join('.')}`);
                // break;
            }
        }
        return obj;
    }
    /**
     * Return the value stored in the model at the given section.property path
     * @param {string} path The section.property name location of the value to retrieve
     * @return {any} the value at that location
     *
     * @throws {ModelPathError} if the section path does not exist
     */
    getAtPath(path) {
        const propObj = this.accessSection(path);
        const prop = path.substring(path.lastIndexOf('.') + 1);
        // @ts-ignore
        return propObj[prop];
    }
    /**
     * Sets the value in the model at the given path and communicates the change to any of its bound components.
     *
     * @param {string} path dot-form path of section and property of the model value to retrieve ('sect.prop')
     * @param {any} value Value to set at this path location
     * @param {boolean} [force] optional. If true, forces the value to be set even if the types do not match, or if
     * the property for this section previously did not exist. Necessary if setting a new property on a section
     * (note the section must exist first)
     *
     * @throws {ModelPathError} if the section path does not exist
     * @throws {TypeError} if `force` is not true, and new value changes the type, or if the property does not exist.
     */
    setAtPath(path, value, force, noAnnounce = false) {
        const propObj = this.accessSection(path);
        const prop = path.substring(path.lastIndexOf('.') + 1);
        if (!force) {
            // @ts-ignore
            if (value !== undefined && propObj[prop] !== undefined) { // allow set to undefined value, or clearing of any value
                // @ts-ignore
                if (typeof propObj[prop] !== typeof value) {
                    // @ts-ignore
                    const e = TypeError(`Attempt to set model property ${path} to ${typeof value} ${value} when existing type is ${typeof propObj[prop]}`);
                    throw e;
                }
            }
        }
        if (noAnnounce) {
            Object.defineProperty(propObj, prop, { value, writable: true });
        }
        else {
            // @ts-ignore
            propObj[prop] = value;
        }
    }
}
exports.AppModel = AppModel;
// Create ComBinder class  and import into Common
// in the end, AppCore, AppModel and ComBinder will import to NativeScript and get adapted there
