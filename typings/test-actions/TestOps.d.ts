import { AppCore } from "../app-core/AppCore";
/**
 * Called on app start by app-core to establish our app context
 * @param appIn
 */
export declare function initModule(appIn: AppCore): void;
/**
 * Reads the value in the app model at the given model path
 * @param modelPath
 */
export declare function readModelValue(modelPath: string): any;
/**
 * Sets a value in the model at the given model path
 * @param modelPath
 * @param value
 */
export declare function setModelValue(modelPath: string, value: any): Promise<void>;
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
export declare function assignComponent(name: string, tagName: string, prop?: string, propValue?: string): Promise<boolean>;
/**
 * Reads the value of a property of the named component
 *
 * @param componentName
 * @param propName
 */
export declare function readComponentProperty(componentName: string, propName: string): Promise<any>;
/**
 * Sets the  property of a named component to the given value
 *
 * @param componentName
 * @param propName
 * @param propValue
 */
export declare function setComponentProperty(componentName: string, propName: string, propValue: string): Promise<void>;
/**
 * Triggers the named action on the named component.
 * this effectively simulates an event call to the function named in the 'action' property
 * @param componentName Assigned component name
 * @param [action] optional action property name, defaults to 'action'
 *
 * @Returns true if action function was called
 */
export declare function triggerAction(componentName: string, action: string): Promise<boolean>;
/**
 * Navigate to the given page, optionally passing a context object
 * @param pageName
 * @param context
 */
export declare function goToPage(pageName: string, context?: any): Promise<void>;
/**
 * Call a function of a given name on the current page, passing optional parameters
 * @param funcName  Name of exported function found on current page logic
 * @param [parameters]  Array of optional parameters to pass (objects and arrays must be serialized JSON)
 *
 * TODO: Convert keyword objects (
 *
 */
export declare function callPageFunction(funcName: string, parameters?: string[]): Promise<any>;
export declare function tree(): Promise<any>;
