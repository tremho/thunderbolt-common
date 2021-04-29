export function flatten(obj:object) {
    const flatObj = {}
    Object.getOwnPropertyNames(obj).forEach(prop => {
        // @ts-ignore
        let value = obj[prop]
        if( typeof value === 'object') {
            if(!Array.isArray(value)) {
                value = flatten(value)
            }
        }
        // @ts-ignore
        flatObj[prop] = value
    })
    return flatObj
}
