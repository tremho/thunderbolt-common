import { AppModel } from "./AppModel";
/**
 * Portable handling for bindings to the component layer.
 */
export declare class ComBinder {
    private model;
    /**
     * Construct ComBinder instance by passing the appModel
     * @param {AppModel} model The app model to bind to
     *
     * @example
     *      let cb = new ComBinder(appCore.model)
     */
    constructor(model: AppModel);
    /**
     * Breaks a statement down into `section`, `prop` and the optional `alias` and `updateAlways`
     * and returns as an object with these properties.
     * @param {string} stmt the binding statement
     * @return {object} statement parts deconstructed.
     */
    deconstructBindStatement(stmt: string): {
        section: string;
        prop: string;
        alias: string;
        updateAlways: boolean;
    };
    /**
     * Process a comma-separated list of binding directives, binding as specified
     * to the local bind set, and calling component update to reflect this initial value
     *
     * @param {string} directive the comma-delimited binding directive string
     * @param {function} bindFunction function that sets a local property with a value (name, value, updateAlways)
     */
    applyComponentBindings(component: any, directive: string, bindFunction: any): void;
}
