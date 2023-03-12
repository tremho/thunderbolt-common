declare class CompInfo {
    info: any;
    component: any;
}
export declare class ToolExtension {
    /**
     * When component is first mounted into layout, not yet rendered.
     * @param component
     */
    onSetToPage(compInfo: CompInfo): void;
    /**
     * When there has been a change in state
     * @param component
     * @param state
     */
    onStateChange(compInfo: CompInfo, state: string | undefined): void;
    /**
     * When the component has been pressed
     * (mousedown, or touch event)
     * @param component
     * @return {boolean} return true to prevent propagation / click handling
     */
    onPress(compInfo: CompInfo): void;
    /**
     * WHen the component has been released
     * (mouseup or touch release)
     * @param component
     */
    onRelease(compInfo: CompInfo): void;
}
export {};
