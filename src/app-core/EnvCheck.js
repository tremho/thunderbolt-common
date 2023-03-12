"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setEnvironment = exports.check = void 0;
let nsplatform;
let nsdevice;
let nsscreen;
// default / placeholder
let environment = {
    runtime: {
        framework: {},
        platform: {
            name: 'unknown'
        }
    }
};
try {
    nsplatform = require('@nativescript/core/platform');
    nsdevice = nsplatform.device;
    nsscreen = require('@nativescript/core').Screen;
}
catch (e) {
}
// console.log(`\n-----------> Environment Recognize <-----------\n`)
// console.log('nsplatform ', nsplatform)
// global is named in {N} and in Node...
if (typeof global === 'object') {
    // console.log('----> Detected global object <-----')
    const lookGlobal = global;
    // console.log('----> Detected global object <-----',   lookGlobal)
    if ((typeof lookGlobal.android === 'object' || typeof lookGlobal.ios === 'object')
        // || (nsplatform.isAndroid || nsplatform.isIos)
        || (typeof nsplatform === 'object') // not the best option, but since the other 'sure things' seem to fail...
    ) {
        if (!lookGlobal.__snapshot)
            console.log('{N} detected, version ' + lookGlobal.__runtimeVersion);
        environment.runtime.framework.nativeScript = lookGlobal.__runtimeVersion;
        environment.runtime.platform = {
            name: nsplatform ? nsplatform.device.os.toLowerCase() : 'nativescript',
            version: nsplatform ? nsplatform.device.osVersion : environment.runtime.framework.nativeScript,
            deviceType: nsplatform && nsplatform.device.deviceType,
            model: nsplatform && nsplatform.device.model,
            language: nsplatform && nsplatform.device.language,
            manufacturer: nsplatform && nsplatform.device.manufacturer,
            region: nsplatform && nsplatform.device.region,
            apiVersion: nsplatform && nsplatform.device.sdkVersion
            // app will crash if we try to get uuid here. not sure why.
            // uuid: nsplatform && nsplatform.device.uuid // will be different on each re-install. (at least for ios)
        };
    }
    else {
        if (typeof global.process === 'object') {
            environment.runtime.platform = {
                name: global.process.platform,
                // version: global.process.versions[environment.runtime.platform.name],
                deviceType: 'computer'
                // model: '',
                // language: '',
                // region: '',
                // apiVersion: 0,
                // uuid:
            };
            console.log('NODE detected on a ' + environment.runtime.platform.name + ' system');
        }
    }
    // } else {
    //     console.log('----> No Detection of global object <-----')
}
class Check {
    get riot() {
        return (environment && environment.runtime.framework.riot) !== undefined;
    }
    get mobile() {
        let rt = false;
        if (environment) {
            rt = environment.runtime.framework.nativeScript !== undefined;
            if (!rt) {
                rt = environment.runtime.platform.name === 'NativeScript';
            }
        }
        return rt;
    }
}
exports.check = new Check();
function setEnvironment(env) {
    environment = env;
}
exports.setEnvironment = setEnvironment;
