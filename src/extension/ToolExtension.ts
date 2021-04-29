
export class ToolExtension {

    /**
     * When component is first mounted into layout, not yet rendered.
     * @param component
     */
    onSetToPage(component:any) {
        // console.log('onSetToPage', component)
    }

    /**
     * When there has been a change in state
     * @param component
     * @param state
     */
    onStateChange(component:any, state:object|null|undefined) {
        // console.log('onStateChange', component, state)

    }

    /**
     * When the component has been pressed
     * (mousedown, or touch event)
     * @param component
     * @return {boolean} return true to prevent propagation / click handling
     */
    onPress(component:any) {
        // console.log('onPress', component)
    }

    /**
     * WHen the component has been released
     * (mouseup or touch release)
     * @param component
     */
    onRelease(component:any) {
        // console.log('onRelease', component)

    }

}