import {AppCore} from "../app-core/AppCore";

// All functions receive AppCore as the "this" when called from AppCore (connectTestMethods / callTestRequest)

export function readModelValue(modelPath:string) {
    console.log('readModelValue @', modelPath)
    // @ts-ignore
    const app:AppCore = this
    return app.model.getAtPath(modelPath)
}