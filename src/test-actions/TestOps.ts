import {AppCore} from "../app-core/AppCore";

let app:AppCore

export function initModule(appIn:AppCore) {
    app = appIn
}
export function readModelValue(modelPath:string) {
    // console.log('>readModelValue @', modelPath)
    const resp =  app.model.getAtPath(modelPath)
    // console.log('returning ', resp)
    return resp
}