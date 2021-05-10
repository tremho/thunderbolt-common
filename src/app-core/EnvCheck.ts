
let environment:any;
let nsplatform;
try {
    environment = require('Generated/BuildEnvironment.json')
} catch(e) {
    console.error('Unable to read BuildEnvironment')
    environment = {
        framework: {
            riot: 'default'
        },
        platform: {
        }
    }
}
try {
    nsplatform = require('@nativescript/core/platform')
} catch(e) {
}

// console.log(`\n-----------> Environment Recognize <-----------\n`)
// console.log('nsplatform ', typeof nsplatform)

// global is named in {N} and in Node...
if (typeof global === 'object') {
    // console.log('----> Detected global object <-----')
    const lookGlobal:any = global;
    // console.log('----> Detected global object <-----', lookGlobal)
    if (
        (typeof lookGlobal.android === 'object' || typeof lookGlobal.ios === 'object')
        || (lookGlobal.isAndroid || lookGlobal.isIos)
        || (typeof nsplatform === 'object') // not the best option, but since the other 'sure things' seem to fail...
       ) {
        if(!lookGlobal.__snapshot) console.log('{N} detected, version ' + lookGlobal.__runtimeVersion)
        environment.framework.nativeScript = lookGlobal.__runtimeVersion
        delete environment.framework.riot
        environment.platform = {
            name: nsplatform ? nsplatform.device.os.toLowerCase() : 'nativescript',
            version: nsplatform ? nsplatform.device.osVersion : environment.framework.nativeScript
        }

    } else {
        if (typeof global.process === 'object') {
            environment.platform.name = global.process.platform
            environment.platform.version = global.process.versions[environment.platform.name]
            console.log('NODE detected on a ' + environment.platform.name + ' system, version '+ environment.platform.version)
        }
    }
// } else {
//     console.log('----> No Detection of global object <-----')
}
// console.log('================================\n')

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

