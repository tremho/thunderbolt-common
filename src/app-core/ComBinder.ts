
// here we want to put the binding code

import {AppModel} from "./AppModel";

/**
 * Portable handling for bindings to the component layer.
 */
export class ComBinder {

    private model: AppModel;

    /**
     * Construct ComBinder instance by passing the appModel
     * @param {AppModel} model The app model to bind to
     *
     * @example
     *      let cb = new ComBinder(appCore.model)
     */
    constructor(model:AppModel) {
        this.model = model
    }
    /**
     * Breaks a statement down into `section`, `prop` and the optional `alias` and `updateAlways`
     * and returns as an object with these properties.
     * @param {string} stmt the binding statement
     * @return {object} statement parts deconstructed.
     */
    deconstructBindStatement(stmt:string = '') {
        const parts = stmt.split(' as ')
        let path = parts[0]
        const updateAlways = (path.charAt(0) === '!')
        if(updateAlways) {
            path = path.substring(1); // skip the !
        }
        const alias = parts[1]
        const ldi = path.lastIndexOf('.')
        const prop = path.substring(ldi+1)
        const section = path.substring(0, ldi)

        return {section, prop, alias, updateAlways}
    }

    /**
     * Process a comma-separated list of binding directives, binding as specified
     * to the local bind set, and calling component update to reflect this initial value
     *
     * @param {string} directive the comma-delimited binding directive string
     * @param {function} bindFunction function that sets a local property with a value (name, value, updateAlways)
     */
    applyComponentBindings(component:any, directive:string, bindFunction:any) {
        const stmts = directive.split(',')
        for(let i=0; i<stmts.length; i++) {
            let {section, prop, alias, updateAlways} = this.deconstructBindStatement(stmts[i])
            let mpath = section+'.'+prop
            let locprop = alias || prop
            let v
            try {
                v = this.model.getAtPath(mpath)
            }
            catch(e) {}
            component.bound[locprop] = v
            if(!component.btrack) component.btrack = {}
            component.btrack[prop] = true
            this.model.bind(component, section, prop, (comp:any, prop:string, value:any) => {
                if(prop.substring(prop.length-5) === '-page' || (comp.btrack && comp.btrack[prop])) {
                    bindFunction(comp, locprop, value, updateAlways)
                }
            })
        }
    }


}

