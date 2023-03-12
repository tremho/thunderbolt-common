"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import {loadLoggerConfig, setLoggerConfig, getLogger} from 'gen-logger'
const logConfig = {
    "categories": [
        {
            "name": "Page",
            "description": "Events in app pages"
        },
        {
            "name": "Foobar",
            "description": "just another category"
        }
    ],
    "colorSchemes": [
        {
            "name": "Standard",
            "default": {
                "background": "",
                "browserLineStyle": "color: brown; font-size: 1.2em",
                "time": "#C00",
                "message": "#008",
                "func": "#08A",
                "file": "#888",
                "line": "#000",
                "groupStyle": "color: #FFF, background: #00F; font-size: 1.5em; font-style: italic; font-weight: bold",
                "startGroup": ["#FFF", "#00F"],
                "endGroup": ["#555", "#ACA"],
                "debug": {
                    "browserLineStyle": "color: #088; font-size: 1.2em",
                    "level": "#AA0",
                    "message": "#088",
                    "stack": false,
                    "stackColor": 0
                },
                "log": {
                    "browserLineStyle": "color: #444; font-size: 1.2em",
                    "level": "#884",
                    "message": "#444",
                    "stack": false,
                    "stackColor": 0
                },
                "info": {
                    "browserLineStyle": "color: #004; font-size: 1.2em",
                    "level": "#0CC",
                    "message": "#004",
                    "stack": false,
                    "stackColor": 0
                },
                "warn": {
                    "browserLineStyle": "color: black; background: #CC0; font-size: 1.2em",
                    "level": ["#FFF", "#CC0"],
                    "message": "#880",
                    "stack": false,
                    "stackColor": 0
                },
                "error": {
                    "browserLineStyle": "color: white; background: red; font-size: 1.2em",
                    "level": ["#FFF", "#D00"],
                    "message": "#C00",
                    "stack": true,
                    "stackColor": "#888"
                },
                "exception": {
                    "browserLineStyle": "color: orange; font-size: 1.2em",
                    "level": [16, 214],
                    "message": "#F40",
                    "stack": true,
                    "stackColor": "#448"
                },
                "fatal": {
                    "browserLineStyle": "color:red; border: 1px solid #555; font-size: 1.2em",
                    "level": ["#FFF", "#000"],
                    "message": "#D04",
                    "stack": true,
                    "stackColor": "#844"
                }
            }
        }
    ],
    "writers": [
        {
            "name": "Console",
            "type": "Console",
            "consoleType": "browser",
            "excludeCategories": [],
            "excludeLevels": [],
            "display": {
                "order": ["time", "function", "source", "category", "level", "message"],
                "supportsColor": true,
                "browserLineStyle": "color: brown; font-size: 1.2em"
            },
            "colors": {
                "inherits": "Standard"
            }
        }
    ],
    "loggers": [
        {
            "name": "Main",
            "writers": ["Console"]
        }
    ]
};
// Can't do this
// loadLoggerConfig('/Users/sohmert/tbd/gen-logger/testConfig.json')
// but can do this
// logConfig is parsed JSON from import.
// setLoggerConfig(logConfig)
// const Log = getLogger('Main')
const Log = {
    debug(...a) { return console.log(...a); },
    log(...a) { return console.log(...a); },
    info(...a) { return console.log(...a); },
    warn(...a) { return console.warn(...a); },
    error(...a) { return console.error(...a); },
    exception(...a) { return console.error(...a); }
};
exports.default = Log;
