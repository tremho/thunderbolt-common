import {newCommon} from './ComCommon'
let cm:any;
export default {
    onBeforeMount(props:any, state:any) {
        // @ts-ignore
        if(this.preStdOnBeforeMount) this.preStdOnBeforeMount(props, state)
      // @ts-ignore
      this.bound = new Object()
      // @ts-ignore
      cm = this.cm = newCommon(this) // this.cm available for control-specific extensions
        // @ts-ignore
        Object.getOwnPropertyNames(props).forEach(p => {
            // @ts-ignore
            this.bound[p] = props[p]
        })
        // @ts-ignore
      this.bound.text = props.text || this.root.tagName
      state.action = props.action
        // console.log(this.root.tagName, 'onBeforeMount', props, state, this.bound)
        // @ts-ignore
        if(this.postStdOnBeforeMount) this.postStdOnBeforeMount(props, state)
    },
    onMounted(props:any, state:any) {
        // @ts-ignore
        if(this.preStdOnMounted) this.preStdOnMounted(props, state)
      // console.log(this.root.tagName, 'onMounted', props, state, this.bound)
      // @ts-ignore
      let div = this.$(this.innerTag || 'div')
        // @ts-ignore
      if(!div) div = this.root.firstChild
        // @ts-ignore
      cm.setCommonProps(div, props, this.tagDefaults)
      cm.bindComponent()
        // @ts-ignore
        if(this.postStdOnMounted) this.postStdOnMounted(props, state)
    },
    onBeforeUpdate(props:any, state:any) {
        // @ts-ignore
        if(this.preStdOnBeforeUpdate) this.preStdOnBeforeUpdate(props, state)
      const page = cm.getPageComponent()
      const isReset = page && page.isReset()
      // @ts-ignore
      if(isReset) {
          Object.getOwnPropertyNames(props).forEach(p => {
              // @ts-ignore
              this.bound[p] = props[p]
          })
      }
      // console.log(this.root.tagName, 'onBeforeUpdate', props, state, this.bound)
        // @ts-ignore
        if(this.postStdOnBeforeUpdate) this.postStdOnBeforeUpdate(props, state)
    },
    onUpdated(props:any, state:any) {
        // @ts-ignore
        if(this.preStdOnUpdated) this.preStdOnUpdated(props, state)
      // console.log(this.root.tagName, 'onUpdated', props, state, this.bound)
        // @ts-ignore
        if(this.postStdOnUpdated) this.postStdOnUpdated(props, state)
    },
    onBeforeUnmount(props:any, state:any) {
        // @ts-ignore
        if(this.preStdOnBeforeUnmount) this.preStdOnBeforeUnmount(props, state)
      // console.log(this.root.tagName, 'onBeforeUnmount', props, state, this.bound)
      // @ts-ignore
      this.bound = {}
        // @ts-ignore
        if(this.postStdOnBeforeUnmount) this.postStdOnBeforeUnmount(props, state)
    },
    onUnmounted(props:any, state:any) {
        // @ts-ignore
        if(this.preStdOnUnmounted) this.preStdOnUnmounted(props, state)
      // console.log(this.root.tagName, 'onUnmounted', props, state, this.bound)
        // @ts-ignore
        if(this.postStdOnUnmounted) this.postStdOnUnmounted(props, state)
    }
}
