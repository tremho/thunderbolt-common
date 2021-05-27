// import {ipcRenderer} from 'electron'

// import {check} from "./EnvCheck";

let extAccess:any

let nextId = 1

class Responder {
    id: number
    promise:Promise<any>
    resolve:any
    reject: any

    constructor() {
        this.id = nextId++
        extAccess = (window as any).extAccess
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
            extAccess.addResponder(this.id, this)
        })
    }
    respond(value:any) {
        extAccess.removeResponder(this.id)
        this.resolve(value)
    }
    error(e:Error) {
        extAccess.removeResponder(this.id)
        // console.error(e.stack)
        this.reject(e)
    }
}

// TODO: Debug by breaking here and in preload response handler
// and check extResponders and what to do about it.

export function callExtensionApi(moduleName:string, functionName:string, args:any[]) {

    const ipcRenderer = /* check.mobile ? null :*/ (window as any).ipcRenderer;


    const responder = new Responder()
    const id = responder.id
    // console.log('calling extApi', moduleName, functionName, id, args)
    ipcRenderer.send('extApi', {moduleName, functionName, id, args})
    return responder.promise
}

