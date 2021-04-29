
import {TextEncoder, TextDecoder} from "util";
import * as base64 from 'base-64'

export function arrayBufferToString(buf:ArrayBuffer):string {
    const td = new TextDecoder()
    const bstr = td.decode(buf)
    return bstr
}
export function stringToArrayBuffer(str:string):ArrayBuffer {
    const te = new TextEncoder()
    const bytes = te.encode(str)
    return bytes.buffer

}

export function stringToBase64(str:string):string {
    try {
        return base64.encode(str)
    } catch(e) {
        throw e
    }
}

export function base64ToString(b64:string):string {
    try {
        return base64.decode(b64)
    } catch(e) {
        throw e
    }
}
