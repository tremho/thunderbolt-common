
import {newCommon} from './ComCommon'
let cm:any;

export default {
    onBeforeMount(props:object|null, state:object|null|undefined) {
        // @ts-ignore
        console.log(this.root.tagName, 'onBeforeMount', props, state)
        // const addBind = Object.assign({bind: 'navigation.context'}, props)
        // Object.defineProperty(this,'props', {
        //     value: addBind
        // })
        cm = newCommon(this)
        // @ts-ignore
        this.comBinder = cm.getComBinder()
        this.reset()
        // @ts-ignore
        this._isReset = false;
    },
    onMounted(props:object|null, state:object|null|undefined) {
        // @ts-ignore
        console.log(this.root.tagName, 'onMounted', props, state)
    },
    onBeforeUpdate(props:object|null, state:object|null|undefined) {
        // @ts-ignore
        console.log(this.root.tagName, 'onBeforeUpdate', props, state)
        // @ts-ignore
        this.bound.data = cm.getApp().getPageData(this.root.tagName.toLowerCase())
        // let ord = 0
        // let c:any;
        // while((c = cm.getComponentChild(this,'', ++ord))) {
        //     c.update()
        // }
    },
    onUpdated(props:object|null, state:object|null|undefined) {
        // @ts-ignore
        console.log(this.root.tagName, 'onUpdated', props, state, this.bound.data)
        // @ts-ignore
        this._isReset = false;
    },
    onBeforeUnmount(props:object|null, state:object|null|undefined) {
        // @ts-ignore
        console.log(this.root.tagName, 'onBeforeUnmount', props, state)
    },
    onUnmounted(props:object|null, state:object|null|undefined) {
        // @ts-ignore
        console.log(this.root.tagName, 'onUnmounted', props, state)
    },
    reset() {
        // @ts-ignore
        console.warn('>>>> Component reset '+this.root.tagName)
        // @ts-ignore
        this._isReset = true;
        // @ts-ignore
        this.bound = new Object()
        cm.bindComponent()
    },
    isReset():boolean {
        // @ts-ignore
        return this._isReset;
    }

}

