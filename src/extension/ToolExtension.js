"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolExtension = void 0;
class CompInfo {
}
class ToolExtension {
    /**
     * When component is first mounted into layout, not yet rendered.
     * @param component
     */
    onSetToPage(compInfo) {
        // console.log('onSetToPage', component)
    }
    /**
     * When there has been a change in state
     * @param component
     * @param state
     */
    onStateChange(compInfo, state) {
        // console.log('onStateChange', component, state)
    }
    /**
     * When the component has been pressed
     * (mousedown, or touch event)
     * @param component
     * @return {boolean} return true to prevent propagation / click handling
     */
    onPress(compInfo) {
        // console.log('onPress', component)
    }
    /**
     * WHen the component has been released
     * (mouseup or touch release)
     * @param component
     */
    onRelease(compInfo) {
        // console.log('onRelease', component)
    }
}
exports.ToolExtension = ToolExtension;
