
// now to parse the madness

// we need to use the file functions common to the API
// (these come from Electron back end for desktop, and directly implemented in {N}, accessible from App-Core Wrapper)
import {AppCore} from '../app-core/AppCore'
import {IndicatorItem, MenuItem, ToolItem} from "./MenuApi";
import {check} from '../app-core/EnvCheck'

let appmenu:MenuItem[] = []
let appTools:ToolItem[] = []
let appIndicators: IndicatorItem[] = []

let curMenu:any
let smstack:any[] = []

// async
function readMenuDef(app:AppCore, menuPath?:string) {
    return app.Api.fileExists(menuPath).then((exists:boolean) => {
        if(exists) {
            return app.Api.readFileText(menuPath).then((defText:string) => {
                return processMenuDef(app, defText)
            }).catch((e:Error) => {
                console.error('unable to read menu', e.message)
            })
        } else {
            if(!menuPath) console.warn('TODO: need a default menu solution')
            else console.error('No menu file ', menuPath)
        }
    })
}

let processing = ''
let resourcePath = ''
let menuName = ''
let toolbarName = ''
let indicatorName = ''

function processMenuDef(app:AppCore, defText:string|undefined) {
    const lines = defText ? defText.split('\n') : []
    // console.log('processing menu def', lines.length+' lines')
    lines.forEach(ln =>  {
        processDefinition(app, ln)
        if(menuName) {
            processMenuLine(ln)
        }
        else if(toolbarName) {
            processToolLine(ln)
        }
        else if(indicatorName) {
            processIndicatorLine(ln)
        }
    })
    commuteToModel(app) // pick up last one
}

function processDefinition(app:AppCore, line:string) {
    const tag = "DEFINE"
    const rptag = "RESOURCE PATH"
    const mntag = "MENU"
    const tbtag = "TOOLBAR"
    const intag = "INDICATORS"
    if(line.indexOf(tag) === 0) {
        // at this point we have parsed into a computable set of object maps we can translate into our model
        commuteToModel(app)
        menuName = toolbarName = indicatorName = resourcePath = ''
        let proc = line.substring(tag.length+1)
        if(proc.indexOf(rptag) !== -1) {
            let qi = proc.indexOf('"')+1
            if(qi) {
                let qe = proc.indexOf('"', qi)
                resourcePath = proc.substring(qi, qe)       // FYI -- not used. resources are all in assets
            }
        } else if(proc.indexOf(mntag) !== -1) {
            menuName = 'main'   // Updated in Dec. include or not, only one id = 'main'
            // let qi = proc.indexOf('"')+1
            // if(qi) {
            //     let qe = proc.indexOf('"', qi)
            //     menuName = proc.substring(qi, qe)
            // }
        } else if(proc.indexOf(tbtag) !== -1) {
            let qi = proc.indexOf('"')+1
            if(qi) {
                let qe = proc.indexOf('"', qi)
                toolbarName = proc.substring(qi, qe)
                appTools = []
            }
        } else if(proc.indexOf(intag) !== -1) {
            let qi = proc.indexOf('"')+1
            if(qi) {
                let qe = proc.indexOf('"', qi)
                indicatorName = proc.substring(qi, qe)
                appIndicators = []
            }
        }

    }
}

function processMenuLine(line:string) {
    line = line.trim()
    let target = ''
    let id = ''
    let label = ''
    let role = ''
    // check for comment
    let mi = line.indexOf('//')
    if(mi !== -1) {
        line = line.substring(0, mi).trim()
    }
    // check for @
    let ti = line.indexOf('@')
    // check for #
    let hi = line.indexOf('#')
    // check for >>
    let sm = line.indexOf('>>')
    let es = line.indexOf('<<')
    // check for :
    let ci = line.indexOf(':')
    // check for ,
    let li = line.indexOf(',')
    // check for !
    let bi = line.indexOf('!')
    let di = line.indexOf('<')
    let ai = line.indexOf('[')

    if(ti !== -1) {
        if(di === -1 || ti < di) {
            let ni
            if (!ni && hi !== -1) ni = hi
            if (!ni && ci !== -1) ni = ci
            if (!ni && li !== -1) ni = li
            if (!ni && bi !== -1) ni = bi
            target = line.substring(ti + 1, ni)
        }
    }
    if(hi !== -1) {
        let xi = ci
        if(xi == -1) xi = li
        if(xi == -1) xi = bi
        if(xi === -1) xi = line.length;
        id = line.substring(hi+1,xi)
    }
    if(sm !== -1) {
        let xi = bi
        if(xi === -1) xi = line.length;
        id = line.substring(sm+2,xi)
    }

    if( li === -1) li = bi
    if( li === -1) li = line.length;
    if(ci !==-1) role = line.substring(ci+1,li)
    let le = 0
    if(di !== -1) le = di
    if(!le && ai !== -1) le = ai
    if(!le) le = line.length
    label = line.substring(li+1, le).trim()

    let mods:string[] = []
    if(di !== -1) {
        let edi = line.indexOf('>', di)
        if(edi !== -1)  {
            mods = line.substring(di+1, edi).split(',')
        }
    }
    let accs:string[] = []
    if(ai !== -1) {
        let eai = line.indexOf(']', ai)
        if(eai !== -1)  {
            accs = line.substring(ai+1, eai).split(',')
        }
    }


    if(bi !== -1 && sm === -1) {
        // this is a menubar label definition
        let mi = new MenuItem()
        mi.label = label
        mi.id = id
        mi.role = role
        mi.accelerator = accs[0]
        mi.targetCode = target
        applyMods(mi, mods)
        curMenu = mi.children = [] // start a new menu
        appmenu.push(mi)
        return;  // we're done for now
    }

    // id, target, label, role


    if(id || es !== -1) {
        if(id == '--') {
            // separator
            // (unique key and type identifier in either key or value)
            // label = id; // --
            // id = '$SEP-'+nextSMID++ // shared with submenu id counts
            role = 'separator'
        }
        // process normal line
        let mi = new MenuItem()
        mi.label = label;
        mi.role = role;
        mi.accelerator = accs[0]
        mi.id = id;
        mi.targetCode = target
        applyMods(mi, mods)
        if (es !== -1) {
            // pop to previous submenu level
            curMenu = smstack.pop()
        } else {
            curMenu.push(mi)
        }
        if (sm !== -1) {
            //create a new submenu
            smstack.push(curMenu)
            curMenu = mi.children = []
        }
    }

}
function applyMods(item:MenuItem, mods:string[]) {
    mods.forEach(m => {
        m = m.toLowerCase()
        if(m === 'disabled') {
            item.disabled = true
        }
        if(m === 'checked') {
            item.type = 'checkbox'
            item.checked = true
        }
        if(m === 'enabled') {
            item.disabled = false
        }
        if(m === 'unchecked') {
            item.type = 'checkbox'
            item.checked = false
        }
        if(m.indexOf('icon') === 0) {
            let e = m.indexOf('=')
            let spec = m.substring(e+1).trim()
            let at = spec.indexOf('@')
            if(at === -1) at = spec.length
            item.icon = spec.substring(0, at)
            let atSpec = spec.substring(at+1)
            let wh = atSpec.split('x')
            if(wh[0]) {
                item.iconSize = [Number([wh[0]])]
                if(wh[1]) {
                    item.iconSize.push(Number(wh[1]))
                }
            }
        }

        // sublabel has no effect on mac
        if(m.indexOf('sublabel') === 0) {
            let e = m.indexOf('=')
            item.sublabel = m.substring(e+1).trim()
        }
        if(m.indexOf('tooltip') === 0) {
            let e = m.indexOf('=')
            item.tooltip = m.substring(e+1).trim()
        }
    })
}


/* Take the parsed intermediate objects and translate them into our model format */

function commuteToModel(app:AppCore) {

    const model = app.model;
    if(menuName) {
        // console.log('commuting menu to model')
        for (let i = 0; i < appmenu.length; i++) {
            app.MenuApi.addMenuItem('main', appmenu[i])
        }
    }
    if(toolbarName) {
        // console.log('commuting toolbar to model')
        app.MenuApi.addToolbarItems(toolbarName, appTools)
    }
    if(indicatorName) {
        // console.log('commuting indicators to model')
        app.MenuApi.addIndicatorItems(indicatorName, appIndicators)
    }
}

function processToolLine(line:string) {
    line = line.trim()
    // console.log('tool line', line)
    let target = ''
    let id = ''
    let label = ''
    // check for comment
    let mi = line.indexOf('//')
    if(mi !== -1) {
        line = line.substring(0, mi).trim()
    }
    // check for @
    let ti = line.indexOf('@')
    // check for #
    let hi = line.indexOf('#')
    // check for ,
    let li = line.indexOf(',')
    // check for !
    let bi = line.indexOf('!')
    // check for mods
    let di = line.indexOf('<')
    // check for accelerators
    let ai = line.indexOf('[')

    if(ti !== -1) {
        if (di === -1 || ti < di) {
            let ni
            if (!ni && hi !== -1) ni = hi
            if (!ni && li !== -1) ni = li
            if (!ni && bi !== -1) ni = bi
            target = line.substring(ti + 1, ni)
        }
    }
    if(hi !== -1) {
        let xi = li
        if(xi == -1) xi = bi
        if(xi === -1) xi = line.length;
        id = line.substring(hi+1,xi)
    }

    if( li === -1) li = bi
    if( li === -1) li = line.length;
    let le = 0
    if(di !== -1) le = di
    if(!le && ai !== -1) le = ai
    if(!le) le = line.length
    label = line.substring(li+1, le).trim()

    let mods:string[] = []
    if(di !== -1) {
        let edi = line.indexOf('>', di)
        if(edi !== -1)  {
            mods = line.substring(di+1, edi).split(',')
        } else {
            console.error('Missing closing > in tool declaration '+ id)
        }
    }
    let accs:string[] = []
    if(ai !== -1) {
        let eai = line.indexOf(']', ai)
        if(eai !== -1)  {
            accs = line.substring(ai+1, eai).split(',')
        }
    }

    // target filter
    if( id ) {
        let item = new ToolItem()
        item.label = label;
        item.id = id;
        mods.forEach(m => {
            m = m.trim()
            if (m === 'disabled') {
                item.state = 'disabled'
            }
            if (m === 'enabled') {
                item.state = ''
            }
            if (m.indexOf('state') === 0) {
                let b = m.indexOf('=')
                if (b !== -1) {
                    item.state = m.substring(b + 1).trim()
                }
            }
            if (m.indexOf('icon') === 0) {
                let c = m.indexOf(':')
                let e = m.indexOf('=')
                if (e === -1) e = m.length
                let state = 'default'
                if (c !== -1) {
                    state = m.substring(c + 1, e)
                }
                if (!item.icons) item.icons = {}
                // @ts-ignore
                item.icons[state] = m.substring(e + 1).trim()
            }
            if (m.indexOf('tooltip') === 0) {
                let b = m.indexOf('=')
                if (b !== -1) {
                    item.tooltip = m.substring(b + 1).trim()
                }
            }
            if (m.indexOf('class') === 0) {
                let b = m.indexOf('=')
                if (b !== -1) {
                    item.className = m.substring(b + 1).trim()
                }
            }
            if (m.indexOf('type') === 0) {
                let b = m.indexOf('=')
                if (b !== -1) {
                    item.type = m.substring(b + 1).trim()
                }
            }
        })
        item.accelerator = accs[0]
        // console.log('adding tool item ', item)
        appTools.push(item)
    }
}

let prevIndLine = ''

function processIndicatorLine(line:string) {
    // console.log('indicator line', line)
    line = line.trim()
    if(prevIndLine) line = prevIndLine + ' '+line
    // console.log('tool line', line)
    let target = ''
    let id = ''
    let label = ''
    // check for comment
    let mi = line.indexOf('//')
    if(mi !== -1) {
        line = line.substring(0, mi).trim()
    }
    // check for @
    let ti = line.indexOf('@')
    // check for #
    let hi = line.indexOf('#')
    // check for ,
    let li = line.indexOf(',')
    // check for !
    let bi = line.indexOf('!')
    // check for mods
    let di = line.indexOf('<')

    if(ti !== -1) {
        if(di === -1 || ti < di) {
            let ni
            if (!ni && hi !== -1) ni = hi
            if (!ni && li !== -1) ni = li
            if (!ni && bi !== -1) ni = bi
            target = line.substring(ti + 1, ni)
        }
    }
    if(hi !== -1) {
        let xi = li
        if(xi == -1) xi = bi
        if(xi === -1) xi = line.length;
        id = line.substring(hi+1,xi)
    }

    if( li === -1) li = bi
    if( li === -1) li = line.length;
    let le = 0
    if(di !== -1) le = di
    if(!le) le = line.length
    label = line.substring(li+1, le).trim()

    let mods:string[] = []
    if(di !== -1) {
        let edi = line.indexOf('>', di)
        if(edi !== -1)  {
            mods = line.substring(di+1, edi).split(',')
        } else {
            prevIndLine = line;
            return
            // console.error('missing closing > in indicator declaration' +id)
        }
    }

    // target filter
    if( id ) {
        let item = new IndicatorItem()
        item.label = label;
        item.id = id;
        mods.forEach(m => {
            m = m.trim()
            if (m === 'disabled') {
                item.state = 'disabled'
            }
            if (m === 'enabled') {
                item.state = ''
            }
            if (m.indexOf('state') === 0) {
                let b = m.indexOf('=')
                if (b !== -1) {
                    item.state = m.substring(b + 1).trim()
                }
            }
            if (m.indexOf('icon') === 0) {
                let c = m.indexOf(':')
                let e = m.indexOf('=')
                if (e === -1) e = m.length
                let state = 'default'
                if (c !== -1) {
                    state = m.substring(c + 1, e)
                }
                if(!item.icons) item.icons = {}
                // @ts-ignore
                item.icons[state] = m.substring(e + 1).trim()
            }
            if (m.indexOf('tooltip') === 0) {
                let b = m.indexOf('=')
                if (b !== -1) {
                    item.tooltip = m.substring(b + 1).trim()
                }
            }
            if (m.indexOf('class') === 0) {
                let b = m.indexOf('=')
                if (b !== -1) {
                    item.className = m.substring(b + 1).trim()
                }
            }
            if (m.indexOf('type') === 0) {
                let b = m.indexOf('=')
                if (b !== -1) {
                    item.type = m.substring(b + 1).trim()
                }
            }
        })
        appIndicators.push(item)
    }
}


// Entry point called from AppCore::setupUIElements
export function setupMenu(app:AppCore, menuData?:string) {
    appmenu = []
    appTools = []
    appIndicators = []
    smstack = []
    if(app.Api && app.Api.resetMenu) {
        // a check to see if we are on desktop
        app.Api.resetMenu()
    }
    return readMenuDef(app, menuData)

}