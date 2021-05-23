import {newCommon} from './ComCommon'
let cm:any;
export default {
    onBeforeMount(props:any, state:any) {
      // @ts-ignore
      this.bound = new Object()
      // @ts-ignore
      cm = this.cm = newCommon(this) // this.cm available for control-specific extensions
        // @ts-ignore
      this.bound.text = props.text || this.root.tagName
      state.action = props.action
        // console.log(this.root.tagName, 'onBeforeMount', props, state, this.bound)
    },
    onMounted(props:any, state:any) {
      // console.log(this.root.tagName, 'onMounted', props, state, this.bound)
      // @ts-ignore
      let div = this.$(this.innerTag || 'div')
        // @ts-ignore
      cm.setCommonProps(div, props, this.tagDefaults)
      cm.bindComponent()
    },
    onBeforeUpdate(props:any, state:any) {
      const page = cm.getPageComponent()
      const isReset = page && page.isReset()
      // @ts-ignore
      this.bound.text = isReset ? props.text : this.bound.text || props.text
      // console.log(this.root.tagName, 'onBeforeUpdate', props, state, this.bound)
    },
    onUpdated(props:any, state:any) {
      // console.log(this.root.tagName, 'onUpdated', props, state, this.bound)
    },
    onBeforeUnmount(props:any, state:any) {
      // console.log(this.root.tagName, 'onBeforeUnmount', props, state, this.bound)
      // @ts-ignore
      this.bound = {}
    },
    onUnmounted(props:any, state:any) {
      // console.log(this.root.tagName, 'onUnmounted', props, state, this.bound)
    }
}
