
import Log from './Log'
/**
 * Map of all active bindings, both up and down
 */
const bindings = {
    up: {

    },
    down: {

    }
}

/**
 * THe Binding Object holds the necessary properties to that the binding code
 * uses to commute values between the model and the components.
 */
class Binding {

    private component:any;
    private model:object;
    private direction:string;
    private section:string;
    private prop: string;
    public onChange:any

    constructor(component:any, model:object, direction:string, section:string, prop:string, changeFn:any) {
        this.component = component
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
    public update(prop:string, value:any) {
        // @ts-ignore
        this.model[this.section][prop] = value;
    }

}

/**
 * Extends Error to define a bad access path to the model was encountered
 *
 * @param message
 * @constructor
 */
export function ModelPathError (message:string) {
    class ModelPathError extends Error {
        constructor(message:string) {
            super(message);
        }
    }
    return new ModelPathError(message)
}

// private implementation for the `bind` method of AppModel.  See docs there.
function bind(component:any, model:object, section:string, prop:string, onChange:any, type?:string,) {
    if(type !== 'write') {
        // anything model announces to UI
        // this is one-to-many so we need an array
        // @ts-ignore
        if(!bindings.up[section]) bindings.up[section] = []
        // @ts-ignore
        bindings.up[section].push(new Binding(component, model,'up', section, prop, onChange))
    }
    if(type !== 'read') {
        // anything UI announces to Model
        // this is many-to-one so, one will do.
        // @ts-ignore
        if(!bindings.down[section]) {
            // @ts-ignore
            bindings.down[section] = new Binding(component, model,'down', section, prop, onChange)
        }
    }
}

// broadcast to component layer
function announce(section:string, prop:string, value:any, old?:any) {
    // find bindings for section name, prop
    // @ts-ignore
    const bnds = bindings.up[section]
    if(bnds) bnds.forEach((bnd:any) => {
        // communicate value to ui layer
        bnd.onChange(bnd.component, prop, value, old)
    })
}

// to model (downward from component)
// not really used.  Basically equivalent to setAtPath.
function toModel(section:string, prop:string, value:any) {
    // find the downward binding for section name, prop
    // @ts-ignore
    const bnd = bindings.down[section]
    bnd.update(prop, value)
}

// Create a JS Proxy object to handle our section
function proxySection(name:string, props:object) {
    const proxy = new Proxy(props, {
        get: function (obj, prop, receiver) {
            // @ts-ignore
            return obj[prop]
        },
        set: function (obj, prop, value, receiver): boolean {
            // @ts-ignore
            let old = obj[prop];
            // @ts-ignore
            obj[prop] = value;
            announce(name, prop as string, value, old)
            return true;
        }
    })
    return proxy;
}

/**
 * The AppModel object holds the realized Application model sections and provides
 * methods for creating, accessing, and binding to these values.
 */
export class AppModel {

    private model:object = {
    }

    /**
     * Creates a new section in the model.
     * Initial properties for this section are supplied by the `props` parameter.
     * Additional properties may be set to this section using the `setAtPath` method, with `force` = true.
     *
     * @param {string} name Name for the new section
     * @param {object} props Initial values to apply to this section.
     */
    public addSection(name:string, props:object) {
        // @ts-ignore
        this.model[name] = proxySection(name, props)
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
    public bind( component:any, section:string, prop:string, onChange:any, type?:string) {
        bind(component, this.model, section, prop, onChange, type)

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
    private accessSection(path:string) {
        let parts = path.split('.')
        let obj = this.model;
        let i = 0;
        if(parts[0] === 'root') i++;
        while(i < parts.length-1) {
            // @ts-ignore
            if(typeof obj[parts[i]]=== 'object') {
                // @ts-ignore
                obj = obj[parts[i++]]
            } else {
                throw ModelPathError(`Invalid model path ${path} at "${parts[i]}"`)
                // console.error(`Invalid model path at ${parts.slice(0, i).join('.')}`);
                // break;
            }
        }
        return obj
    }

    /**
     * Return the value stored in the model at the given section.property path
     * @param {string} path The section.property name location of the value to retrieve
     * @return {any} the value at that location
     *
     * @throws {ModelPathError} if the section path does not exist
     */
    getAtPath(path:string):any {
        const propObj = this.accessSection(path)
        const prop = path.substring(path.lastIndexOf('.')+1)
        // @ts-ignore
        return propObj[prop]
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
    setAtPath(path:string, value:any, force?:boolean) {
        const propObj = this.accessSection(path)
        const prop = path.substring(path.lastIndexOf('.')+1)
        if(!force) {
            // @ts-ignore
            if(typeof propObj[prop] !== typeof value) {
                // @ts-ignore
                const e = TypeError(`Attempt to set model property ${path} to ${typeof value} ${value} when existing type is ${typeof propObj[prop]}`)
                throw e
            }
        }
        // @ts-ignore
        propObj[prop] = value;
    }
}

// Create ComBinder class  and import into Common

// in the end, AppCore, AppModel and ComBinder will import to NativeScript and get adapted there