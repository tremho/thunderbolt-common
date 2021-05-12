
class CompInfo {
    info: any
    component:any
}

export class ToolExtension {

    /**
     * When component is first mounted into layout, not yet rendered.
     * @param component
     */
    onSetToPage(compInfo:CompInfo) {
        // console.log('onSetToPage', component)
    }

    /**
     * When there has been a change in state
     * @param component
     * @param state
     */
    onStateChange(compInfo:CompInfo, state:string|undefined) {
        // console.log('onStateChange', component, state)

    }

    /**
     * When the component has been pressed
     * (mousedown, or touch event)
     * @param component
     * @return {boolean} return true to prevent propagation / click handling
     */
    onPress(compInfo:CompInfo) {
        // console.log('onPress', component)
    }

    /**
     * WHen the component has been released
     * (mouseup or touch release)
     * @param component
     */
    onRelease(compInfo:CompInfo) {
        // console.log('onRelease', component)

    }

}