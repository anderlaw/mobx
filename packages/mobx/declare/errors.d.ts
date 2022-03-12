declare const niceErrors: {
    readonly 0: "Invalid value for configuration 'enforceActions', expected 'never', 'always' or 'observed'"
    readonly 1: (annotationType: any, key: PropertyKey) => string
    readonly 5: "'keys()' can only be used on observable objects, arrays, sets and maps"
    readonly 6: "'values()' can only be used on observable objects, arrays, sets and maps"
    readonly 7: "'entries()' can only be used on observable objects, arrays and maps"
    readonly 8: "'set()' can only be used on observable objects, arrays and maps"
    readonly 9: "'remove()' can only be used on observable objects, arrays and maps"
    readonly 10: "'has()' can only be used on observable objects, arrays and maps"
    readonly 11: "'get()' can only be used on observable objects, arrays and maps"
    readonly 12: "Invalid annotation"
    readonly 13: "Dynamic observable objects cannot be frozen"
    readonly 14: "Intercept handlers should return nothing or a change object"
    readonly 15: "Observable arrays cannot be frozen"
    readonly 16: "Modification exception: the internal structure of an observable array was changed."
    readonly 17: (index: any, length: any) => string
    readonly 18: "mobx.map requires Map polyfill for the current browser. Check babel-polyfill or core-js/es6/map.js"
    readonly 19: (other: any) => string
    readonly 20: (other: any) => string
    readonly 21: (dataStructure: any) => string
    readonly 22: "mobx.set requires Set polyfill for the current browser. Check babel-polyfill or core-js/es6/set.js"
    readonly 23: "It is not possible to get index atoms from arrays"
    readonly 24: (thing: any) => string
    readonly 25: (property: any, name: any) => string
    readonly 26: "please specify a property"
    readonly 27: (property: any, name: any) => string
    readonly 28: (thing: any) => string
    readonly 29: "Expecting some object"
    readonly 30: "invalid action stack. did you forget to finish an action?"
    readonly 31: "missing option for computed: get"
    readonly 32: (name: any, derivation: any) => string
    readonly 33: (name: any) => string
    readonly 34: (name: any) => string
    readonly 35: "There are multiple, different versions of MobX active. Make sure MobX is loaded only once or use `configure({ isolateGlobalState: true })`"
    readonly 36: "isolateGlobalState should be called before MobX is running any reactions"
    readonly 37: (method: any) => string
    readonly 38: "'ownKeys()' can only be used on observable objects"
    readonly 39: "'defineProperty()' can only be used on observable objects"
}
declare const errors: typeof niceErrors
export declare function die(error: string | keyof typeof errors, ...args: any[]): never
export {}
//# sourceMappingURL=errors.d.ts.map
