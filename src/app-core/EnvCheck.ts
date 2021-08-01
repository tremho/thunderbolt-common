

let nsplatform:any;
let nsdevice:any;
let nsscreen:any;

// default / placeholder
let environment:any = {
        framework: {
            riot: 'default'
        },
        platform: {
        }
    }

try {
    nsplatform = require('@nativescript/core/platform')
    nsdevice = nsplatform.device
    nsscreen = require('@nativescript/core').Screen
} catch(e) {
}

// console.log(`\n-----------> Environment Recognize <-----------\n`)
// console.log('nsplatform ', nsplatform)

// global is named in {N} and in Node...
if (typeof global === 'object') {
    // console.log('----> Detected global object <-----')
    const lookGlobal:any = global;
    // console.log('----> Detected global object <-----', lookGlobal)


    if (
        (typeof lookGlobal.android === 'object' || typeof lookGlobal.ios === 'object')
        // || (nsplatform.isAndroid || nsplatform.isIos)
        || (typeof nsplatform === 'object') // not the best option, but since the other 'sure things' seem to fail...
       ) {
        if(!lookGlobal.__snapshot) console.log('{N} detected, version ' + lookGlobal.__runtimeVersion)
        environment.framework.nativeScript = lookGlobal.__runtimeVersion
        delete environment.framework.riot
        environment.platform = {
            name: nsplatform ? nsplatform.device.os.toLowerCase() : 'nativescript',
            version: nsplatform ? nsplatform.device.osVersion : environment.framework.nativeScript,
            deviceType: nsplatform && nsplatform.device.deviceType,
            model: nsplatform && nsplatform.device.model,
            language: nsplatform && nsplatform.device.language,
            manufacturer: nsplatform && nsplatform.device.manufacturer,
            region:nsplatform && nsplatform.device.region,
            apiVersion:nsplatform && nsplatform.device.sdkVersion
            // app will crash if we try to get uuid here. not sure why.
            // uuid: nsplatform && nsplatform.device.uuid // will be different on each re-install. (at least for ios)
        }
    } else {
        if (typeof global.process === 'object') {
            environment.platform = {
                name: global.process.platform,
                version: global.process.versions[environment.platform.name],
                deviceType: 'computer'
                // model: '',
                // language: '',
                // region: '',
                // apiVersion: 0,
                // uuid:
            }
            console.log('NODE detected on a ' + environment.platform.name + ' system, version '+ environment.platform.version)
        }
    }
// } else {
//     console.log('----> No Detection of global object <-----')
}
class Check {
    public get riot() {
        return environment.framework.riot !== undefined;
    }
    public get mobile() {
        return environment.framework.nativeScript !== undefined
    }
}
export const check = new Check()
export {environment as environment}
