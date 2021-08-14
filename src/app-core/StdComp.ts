import {newCommon, ComCommon} from './ComCommon'
import {ComNormal} from './ComNormal'
export default {
    tagName: '',
    bound: {},
    cm: ({} as ComCommon),
    com: ({} as ComCommon),
    comNormal: ({} as ComNormal),
    onBeforeMount(props:any, state:any) {
        // @ts-ignore
        if(this.preStdOnBeforeMount) this.preStdOnBeforeMount(props, state)
        this.bound = new Object()
        this.comNormal = new ComNormal(this)
        // @ts-ignore
        this.tagName = this.root.tagName.toLowerCase()
        // @ts-ignore
        this.cm = this.com = newCommon(this) // this.cm and this.com are the same
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
        this.cm.setCommonProps(div, props, this.tagDefaults)
        this.cm.bindComponent()
        // @ts-ignore
        if(this.postStdOnMounted) this.postStdOnMounted(props, state)
        },
    onBeforeUpdate(props:any, state:any) {
        // @ts-ignore
        if(this.preStdOnBeforeUpdate) this.preStdOnBeforeUpdate(props, state)
        const page = this.cm.getPageComponent()
        const isReset = page && page.isReset()
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
    },
    // ComNormal implementation
    get isIOS(): boolean { return this.comNormal.isIOS },
    get isAndroid(): boolean { return this.comNormal.isAndroid },
    get isMobile(): boolean { return this.comNormal.isMobile },
    elementFind(tag:string):any { return this.comNormal.elementFind(tag) },
    elementFindAll(tag:string):any[] { return this.comNormal.elementFindAll(tag) },
    listenToFor(el:any, pseudoEventTag:string, func:(ed:any)=>{}) { return this.comNormal.listenToFor(el, pseudoEventTag, func) },
    getElementBounds(element:any):any { return this.comNormal.getElementBounds(element) }

}
