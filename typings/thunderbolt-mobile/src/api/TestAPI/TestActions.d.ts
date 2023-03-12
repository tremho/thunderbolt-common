/**
 * Reads the value in the app model at the given model path
 * @param modelPath
 */
export declare function readModelValue(modelPath: string): Promise<unknown>;
/**
 * Sets a value in the model at the given model path
 * @param modelPath
 * @param value
 */
export declare function setModelValue(modelPath: string, value: any): Promise<unknown>;
/**
 * Selects a component on the page via a selector and assigns it to a name we can reference later
 *
 * @param name Name to assign to the component
 * @param tagName tag name of the component (e.g. simple-label)
 * @param [prop] optional name of a property to check on this component
 * @param [propValue] optional if prop given, this is the value to match
 */
export declare function assignComponent(name: string, tagName: string, prop?: string, propValue?: string): Promise<unknown>;
/**
 * Reads the value of a property of the named component
 *
 * @param componentName
 * @param propName
 */
export declare function readComponentProperty(componentName: string, propName: string): Promise<unknown>;
/**
 * Sets the  property of a named component to the given value
 *
 * @param componentName
 * @param propName
 * @param propValue
 */
export declare function setComponentProperty(componentName: string, propName: string, propValue: string): Promise<unknown>;
/**
 * Triggers the named action on the named component.
 * Actions are psuedo-actions, such as "press" (alias for click or tap)
 * @param componentName
 * @param action
 */
export declare function triggerAction(componentName: string, action: string): Promise<unknown>;
/**
 * Navigate to the given page, optionally passing a context object
 * @param pageName
 * @param context
 */
export declare function goToPage(pageName: string, context?: any): Promise<unknown>;
/**
 * Call a function of a given name on the current page, passing optional parameters
 * @param funcName  Name of exported function found on current page logic
 * @param [parameters]  Array of optional parameters to pass
 */
export declare function callPageFunction(funcName: string, parameters?: string[]): Promise<unknown>;
/**
 * wait for a given number of milliseconds
 * @param delay
 */
export declare function wait(delay: number): Promise<unknown>;
