declare class KModelPathError extends Error {
    constructor(message: string);
}
/**
 * Extends Error to define a bad access path to the model was encountered
 *
 * @param message
 * @constructor
 */
export declare function ModelPathError(message: string): KModelPathError;
/**
 * The AppModel object holds the realized Application model sections and provides
 * methods for creating, accessing, and binding to these values.
 */
export declare class AppModel {
    private model;
    /**
     * Creates a new section in the model.
     * Initial properties for this section are supplied by the `props` parameter.
     * Additional properties may be set to this section using the `setAtPath` method, with `force` = true.
     *
     * @param {string} name Name for the new section
     * @param {object} props Initial values to apply to this section.
     */
    addSection(name: string, props: object): void;
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
    bind(component: any, section: string, prop: string, onChange: any, type?: string): void;
    /**
     * Return proxy section at the given path
     *
     * @param {string} path The path to extract the section from
     * @return {Section} The section named
     *
     * @throws {ModelPathError} if the section path does not exist
     * @private
     */
    private accessSection;
    /**
     * Return the value stored in the model at the given section.property path
     * @param {string} path The section.property name location of the value to retrieve
     * @return {any} the value at that location
     *
     * @throws {ModelPathError} if the section path does not exist
     */
    getAtPath(path: string): any;
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
    setAtPath(path: string, value: any, force?: boolean, noAnnounce?: boolean): void;
}
export {};
