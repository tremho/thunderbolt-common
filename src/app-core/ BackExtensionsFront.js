"use strict";
// import {ipcRenderer} from 'electron'
Object.defineProperty(exports, "__esModule", { value: true });
exports.callExtensionApi = void 0;
// import {check} from "./EnvCheck";
let extAccess;
let nextId = 1;
class Responder {
    constructor() {
        this.id = nextId++;
        extAccess = window.extAccess;
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
            extAccess.addResponder(this.id, this);
        });
    }
    respond(value) {
        extAccess.removeResponder(this.id);
        this.resolve(value);
    }
    error(e) {
        extAccess.removeResponder(this.id);
        // console.error(e.stack)
        this.reject(e);
    }
}
// TODO: Debug by breaking here and in preload response handler
// and check extResponders and what to do about it.
function callExtensionApi(moduleName, functionName, args) {
    const ipcRenderer = /* check.mobile ? null :*/ window.ipcRenderer;
    const responder = new Responder();
    const id = responder.id;
    // console.log('calling extApi', moduleName, functionName, id, args)
    ipcRenderer.send('extApi', { moduleName, functionName, id, args });
    return responder.promise;
}
exports.callExtensionApi = callExtensionApi;
