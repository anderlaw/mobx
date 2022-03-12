"use strict"

const niceErrors = {
    0: `Invalid value for configuration 'enforceActions', expected 'never', 'always' or 'observed'`,
    1(annotationType, key) {
        return `Cannot apply '${annotationType}' to '${key.toString()}': Field not found.`
    },
    /*
    2(prop) {
        return `invalid decorator for '${prop.toString()}'`
    },
    3(prop) {
        return `Cannot decorate '${prop.toString()}': action can only be used on properties with a function value.`
    },
    4(prop) {
        return `Cannot decorate '${prop.toString()}': computed can only be used on getter properties.`
    },
    */
    5: "'keys()' can only be used on observable objects, arrays, sets and maps",
    6: "'values()' can only be used on observable objects, arrays, sets and maps",
    7: "'entries()' can only be used on observable objects, arrays and maps",
    8: "'set()' can only be used on observable objects, arrays and maps",
    9: "'remove()' can only be used on observable objects, arrays and maps",
    10: "'has()' can only be used on observable objects, arrays and maps",
    11: "'get()' can only be used on observable objects, arrays and maps",
    12: `Invalid annotation`,
    13: `Dynamic observable objects cannot be frozen`,
    14: "Intercept handlers should return nothing or a change object",
    15: `Observable arrays cannot be frozen`,
    16: `Modification exception: the internal structure of an observable array was changed.`,
    17(index, length) {
        return `[mobx.array] Index out of bounds, ${index} is larger than ${length}`
    },
    18: "mobx.map requires Map polyfill for the current browser. Check babel-polyfill or core-js/es6/map.js",
    19(other) {
        return "Cannot initialize from classes that inherit from Map: " + other.constructor.name
    },
    20(other) {
        return "Cannot initialize map from " + other
    },
    21(dataStructure) {
        return `Cannot convert to map from '${dataStructure}'`
    },
    22: "mobx.set requires Set polyfill for the current browser. Check babel-polyfill or core-js/es6/set.js",
    23: "It is not possible to get index atoms from arrays",
    24(thing) {
        return "Cannot obtain administration from " + thing
    },
    25(property, name) {
        return `the entry '${property}' does not exist in the observable map '${name}'`
    },
    26: "please specify a property",
    27(property, name) {
        return `no observable property '${property.toString()}' found on the observable object '${name}'`
    },
    28(thing) {
        return "Cannot obtain atom from " + thing
    },
    29: "Expecting some object",
    30: "invalid action stack. did you forget to finish an action?",
    31: "missing option for computed: get",
    32(name, derivation) {
        return `Cycle detected in computation ${name}: ${derivation}`
    },
    33(name) {
        return `The setter of computed value '${name}' is trying to update itself. Did you intend to update an _observable_ value, instead of the computed property?`
    },
    34(name) {
        return `[ComputedValue '${name}'] It is not possible to assign a new value to a computed value.`
    },
    35: "There are multiple, different versions of MobX active. Make sure MobX is loaded only once or use `configure({ isolateGlobalState: true })`",
    36: "isolateGlobalState should be called before MobX is running any reactions",
    37(method) {
        return `[mobx] \`observableArray.${method}()\` mutates the array in-place, which is not allowed inside a derivation. Use \`array.slice().${method}()\` instead`
    },
    38: "'ownKeys()' can only be used on observable objects",
    39: "'defineProperty()' can only be used on observable objects"
} // const assertions --> no literal types in that expression should be widened
//env divided  错误对象 仅在开发环境
const errors = __DEV__ ? niceErrors : {}
//函数可以throw自定义文字描述的异常，也可以throw Mobx内建的异常
function die(error, ...args) {
    if (__DEV__) {
        let e = typeof error === "string" ? error : errors[error]
        if (typeof e === "function") e = e.apply(null, args)
        throw new Error(`[MobX] ${e}`)
    }
    //生产异常
    throw new Error(
        typeof error === "number"
            ? `[MobX] minified error nr: ${error}${
                  args.length ? " " + args.map(String).join(",") : ""
              }. Find the full error at: https://github.com/mobxjs/mobx/blob/main/packages/mobx/src/errors.ts`
            : `[MobX] ${error}`
    )
}

const mockGlobal = {}
//条件判断返回全局对象
function getGlobal() {
    if (typeof globalThis !== "undefined") {
        return globalThis
    }
    if (typeof window !== "undefined") {
        return window
    }
    if (typeof global !== "undefined") {
        return global
    }
    if (typeof self !== "undefined") {
        return self
    }
    return mockGlobal
}

// We shorten anything used > 5 times
const assign = Object.assign
const getDescriptor = Object.getOwnPropertyDescriptor
const defineProperty = Object.defineProperty
const objectPrototype = Object.prototype
const EMPTY_ARRAY = []
Object.freeze(EMPTY_ARRAY)
const EMPTY_OBJECT = {}
Object.freeze(EMPTY_OBJECT)
const hasProxy = typeof Proxy !== "undefined"
const plainObjectString = Object.toString()
function assertProxies() {
    if (!hasProxy) {
        die(
            __DEV__
                ? "`Proxy` objects are not available in the current environment. Please configure MobX to enable a fallback implementation.`"
                : "Proxy not available"
        )
    }
}
function warnAboutProxyRequirement(msg) {
    if (__DEV__ && globalState.verifyProxies) {
        die(
            "MobX is currently configured to be able to run in ES5 mode, but in ES5 MobX won't be able to " +
                msg
        )
    }
}
function getNextId() {
    return ++globalState.mobxGuid
}
/**
 * Makes sure that the provided function is invoked at most once.
 */
function once(func) {
    let invoked = false
    return function () {
        if (invoked) return
        invoked = true
        return func.apply(this, arguments)
    }
}
const noop = () => {}
function isFunction(fn) {
    return typeof fn === "function"
}
function isStringish(value) {
    const t = typeof value
    switch (t) {
        case "string":
        case "symbol":
        case "number":
            return true
    }
    return false
}
function isObject(value) {
    return value !== null && typeof value === "object"
}
function isPlainObject(value) {
    var _a
    if (!isObject(value)) return false
    const proto = Object.getPrototypeOf(value)
    if (proto == null) return true
    return (
        ((_a = proto.constructor) === null || _a === void 0 ? void 0 : _a.toString()) ===
        plainObjectString
    )
}
// https://stackoverflow.com/a/37865170
function isGenerator(obj) {
    const constructor = obj === null || obj === void 0 ? void 0 : obj.constructor
    if (!constructor) return false
    if ("GeneratorFunction" === constructor.name || "GeneratorFunction" === constructor.displayName)
        return true
    return false
}
function addHiddenProp(object, propName, value) {
    defineProperty(object, propName, {
        enumerable: false,
        writable: true,
        configurable: true,
        value
    })
}
function addHiddenFinalProp(object, propName, value) {
    defineProperty(object, propName, {
        enumerable: false,
        writable: false,
        configurable: true,
        value
    })
}
function createInstanceofPredicate(name, theClass) {
    const propName = "isMobX" + name
    theClass.prototype[propName] = true
    return function (x) {
        return isObject(x) && x[propName] === true
    }
}
function isES6Map(thing) {
    return thing instanceof Map
}
function isES6Set(thing) {
    return thing instanceof Set
}
const hasGetOwnPropertySymbols = typeof Object.getOwnPropertySymbols !== "undefined"
/**
 * Returns the following: own enumerable keys and symbols.
 */
function getPlainObjectKeys(object) {
    const keys = Object.keys(object)
    // Not supported in IE, so there are not going to be symbol props anyway...
    if (!hasGetOwnPropertySymbols) return keys
    const symbols = Object.getOwnPropertySymbols(object)
    if (!symbols.length) return keys
    return [...keys, ...symbols.filter(s => objectPrototype.propertyIsEnumerable.call(object, s))]
}
// From Immer utils
// Returns all own keys, including non-enumerable and symbolic
const ownKeys =
    typeof Reflect !== "undefined" && Reflect.ownKeys
        ? Reflect.ownKeys
        : hasGetOwnPropertySymbols
        ? obj => Object.getOwnPropertyNames(obj).concat(Object.getOwnPropertySymbols(obj))
        : /* istanbul ignore next */ Object.getOwnPropertyNames
function stringifyKey(key) {
    if (typeof key === "string") return key
    if (typeof key === "symbol") return key.toString()
    return new String(key).toString()
}
function toPrimitive(value) {
    return value === null ? null : typeof value === "object" ? "" + value : value
}
function hasProp(target, prop) {
    return objectPrototype.hasOwnProperty.call(target, prop)
}
// From Immer utils
const getOwnPropertyDescriptors =
    Object.getOwnPropertyDescriptors ||
    function getOwnPropertyDescriptors(target) {
        // Polyfill needed for Hermes and IE, see https://github.com/facebook/hermes/issues/274
        const res = {}
        // Note: without polyfill for ownKeys, symbols won't be picked up
        ownKeys(target).forEach(key => {
            res[key] = getDescriptor(target, key)
        })
        return res
    }

const storedAnnotationsSymbol = Symbol("mobx-stored-annotations")
/**
 * Creates a function that acts as
 * - decorator
 * - annotation object
 */
function createDecoratorAnnotation(annotation) {
    function decorator(target, property) {
        storeAnnotation(target, property, annotation)
    }
    return Object.assign(decorator, annotation)
}
/**
 * Stores annotation to prototype,
 * so it can be inspected later by `makeObservable` called from constructor
 */
function storeAnnotation(prototype, key, annotation) {
    if (!hasProp(prototype, storedAnnotationsSymbol)) {
        addHiddenProp(
            prototype,
            storedAnnotationsSymbol,
            Object.assign({}, prototype[storedAnnotationsSymbol])
        )
    }
    // @override must override something
    if (__DEV__ && isOverride(annotation) && !hasProp(prototype[storedAnnotationsSymbol], key)) {
        const fieldName = `${prototype.constructor.name}.prototype.${key.toString()}`
        die(
            `'${fieldName}' is decorated with 'override', ` +
                `but no such decorated member was found on prototype.`
        )
    }
    // Cannot re-decorate
    assertNotDecorated(prototype, annotation, key)
    // Ignore override
    if (!isOverride(annotation)) {
        prototype[storedAnnotationsSymbol][key] = annotation
    }
}
function assertNotDecorated(prototype, annotation, key) {
    if (__DEV__ && !isOverride(annotation) && hasProp(prototype[storedAnnotationsSymbol], key)) {
        const fieldName = `${prototype.constructor.name}.prototype.${key.toString()}`
        const currentAnnotationType = prototype[storedAnnotationsSymbol][key].annotationType_
        const requestedAnnotationType = annotation.annotationType_
        die(
            `Cannot apply '@${requestedAnnotationType}' to '${fieldName}':` +
                `\nThe field is already decorated with '@${currentAnnotationType}'.` +
                `\nRe-decorating fields is not allowed.` +
                `\nUse '@override' decorator for methods overriden by subclass.`
        )
    }
}
/**
 * Collects annotations from prototypes and stores them on target (instance)
 */
function collectStoredAnnotations(target) {
    if (!hasProp(target, storedAnnotationsSymbol)) {
        if (__DEV__ && !target[storedAnnotationsSymbol]) {
            die(
                `No annotations were passed to makeObservable, but no decorated members have been found either`
            )
        }
        // We need a copy as we will remove annotation from the list once it's applied.
        addHiddenProp(
            target,
            storedAnnotationsSymbol,
            Object.assign({}, target[storedAnnotationsSymbol])
        )
    }
    return target[storedAnnotationsSymbol]
}

const $mobx = Symbol("mobx administration")
class Atom {
    /**
     * Create a new atom. For debugging purposes it is recommended to give it a name.
     * The onBecomeObserved and onBecomeUnobserved callbacks can be used for resource management.
     */
    constructor(name_ = __DEV__ ? "Atom@" + getNextId() : "Atom") {
        Object.defineProperty(this, "name_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: name_
        })
        Object.defineProperty(this, "isPendingUnobservation_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        }) // for effective unobserving. BaseAtom has true, for extra optimization, so its onBecomeUnobserved never gets called, because it's not needed
        Object.defineProperty(this, "isBeingObserved_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        })
        Object.defineProperty(this, "observers_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Set()
        })
        Object.defineProperty(this, "diffValue_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        })
        Object.defineProperty(this, "lastAccessedBy_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        })
        Object.defineProperty(this, "lowestObserverState_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: IDerivationState_.NOT_TRACKING_
        })
        // onBecomeObservedListeners
        Object.defineProperty(this, "onBOL", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        // onBecomeUnobservedListeners
        Object.defineProperty(this, "onBUOL", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
    }
    onBO() {
        if (this.onBOL) {
            this.onBOL.forEach(listener => listener())
        }
    }
    onBUO() {
        if (this.onBUOL) {
            this.onBUOL.forEach(listener => listener())
        }
    }
    /**
     * Invoke this method to notify mobx that your atom has been used somehow.
     * Returns true if there is currently a reactive context.
     */
    reportObserved() {
        return reportObserved(this)
    }
    /**
     * Invoke this method _after_ this method has changed to signal mobx that all its observers should invalidate.
     */
    reportChanged() {
        startBatch()
        propagateChanged(this)
        endBatch()
    }
    toString() {
        return this.name_
    }
}
const isAtom = createInstanceofPredicate("Atom", Atom)
function createAtom(name, onBecomeObservedHandler = noop, onBecomeUnobservedHandler = noop) {
    const atom = new Atom(name)
    // default `noop` listener will not initialize the hook Set
    if (onBecomeObservedHandler !== noop) {
        onBecomeObserved(atom, onBecomeObservedHandler)
    }
    if (onBecomeUnobservedHandler !== noop) {
        onBecomeUnobserved(atom, onBecomeUnobservedHandler)
    }
    return atom
}

function identityComparer(a, b) {
    return a === b
}
function structuralComparer(a, b) {
    return deepEqual(a, b)
}
function shallowComparer(a, b) {
    return deepEqual(a, b, 1)
}
function defaultComparer(a, b) {
    if (Object.is) return Object.is(a, b)
    return a === b ? a !== 0 || 1 / a === 1 / b : a !== a && b !== b
}
const comparer = {
    identity: identityComparer,
    structural: structuralComparer,
    default: defaultComparer,
    shallow: shallowComparer
}

function deepEnhancer(v, _, name) {
    // it is an observable already, done
    if (isObservable(v)) return v
    // something that can be converted and mutated?
    if (Array.isArray(v)) return observable.array(v, { name })
    if (isPlainObject(v)) return observable.object(v, undefined, { name })
    if (isES6Map(v)) return observable.map(v, { name })
    if (isES6Set(v)) return observable.set(v, { name })
    if (typeof v === "function" && !isAction(v) && !isFlow(v)) {
        if (isGenerator(v)) {
            return flow(v)
        } else {
            return autoAction(name, v)
        }
    }
    return v
}
function shallowEnhancer(v, _, name) {
    if (v === undefined || v === null) return v
    if (isObservableObject(v) || isObservableArray(v) || isObservableMap(v) || isObservableSet(v))
        return v
    if (Array.isArray(v)) return observable.array(v, { name, deep: false })
    if (isPlainObject(v)) return observable.object(v, undefined, { name, deep: false })
    if (isES6Map(v)) return observable.map(v, { name, deep: false })
    if (isES6Set(v)) return observable.set(v, { name, deep: false })
    if (__DEV__)
        die(
            "The shallow modifier / decorator can only used in combination with arrays, objects, maps and sets"
        )
}
function referenceEnhancer(newValue) {
    // never turn into an observable
    return newValue
}
function refStructEnhancer(v, oldValue) {
    if (__DEV__ && isObservable(v))
        die(`observable.struct should not be used with observable values`)
    if (deepEqual(v, oldValue)) return oldValue
    return v
}

const OVERRIDE = "override"
createDecoratorAnnotation({
    annotationType_: OVERRIDE,
    make_: make_$5,
    extend_: extend_$5
})
function isOverride(annotation) {
    return annotation.annotationType_ === OVERRIDE
}
function make_$5(adm, key) {
    // Must not be plain object
    if (__DEV__ && adm.isPlainObject_) {
        die(
            `Cannot apply '${this.annotationType_}' to '${adm.name_}.${key.toString()}':` +
                `\n'${this.annotationType_}' cannot be used on plain objects.`
        )
    }
    // Must override something
    if (__DEV__ && !hasProp(adm.appliedAnnotations_, key)) {
        die(
            `'${adm.name_}.${key.toString()}' is annotated with '${this.annotationType_}', ` +
                `but no such annotated member was found on prototype.`
        )
    }
    return 0 /* Cancel */
}
function extend_$5(adm, key, descriptor, proxyTrap) {
    die(`'${this.annotationType_}' can only be used with 'makeObservable'`)
}

function createActionAnnotation(name, options) {
    return {
        annotationType_: name,
        options_: options,
        make_: make_$4,
        extend_: extend_$4
    }
}
function make_$4(adm, key, descriptor, source) {
    var _a
    // bound
    if ((_a = this.options_) === null || _a === void 0 ? void 0 : _a.bound) {
        return this.extend_(adm, key, descriptor, false) === null ? 0 /* Cancel */ : 1 /* Break */
    }
    // own
    if (source === adm.target_) {
        return this.extend_(adm, key, descriptor, false) === null
            ? 0 /* Cancel */
            : 2 /* Continue */
    }
    // prototype
    if (isAction(descriptor.value)) {
        // A prototype could have been annotated already by other constructor,
        // rest of the proto chain must be annotated already
        return 1 /* Break */
    }
    const actionDescriptor = createActionDescriptor(adm, this, key, descriptor, false)
    defineProperty(source, key, actionDescriptor)
    return 2 /* Continue */
}
function extend_$4(adm, key, descriptor, proxyTrap) {
    const actionDescriptor = createActionDescriptor(adm, this, key, descriptor)
    return adm.defineProperty_(key, actionDescriptor, proxyTrap)
}
function assertActionDescriptor(adm, { annotationType_ }, key, { value }) {
    if (__DEV__ && !isFunction(value)) {
        die(
            `Cannot apply '${annotationType_}' to '${adm.name_}.${key.toString()}':` +
                `\n'${annotationType_}' can only be used on properties with a function value.`
        )
    }
}
function createActionDescriptor(
    adm,
    annotation,
    key,
    descriptor,
    // provides ability to disable safeDescriptors for prototypes
    safeDescriptors = globalState.safeDescriptors
) {
    var _a, _b, _c, _d, _e, _f, _g, _h
    assertActionDescriptor(adm, annotation, key, descriptor)
    let { value } = descriptor
    if ((_a = annotation.options_) === null || _a === void 0 ? void 0 : _a.bound) {
        value = value.bind((_b = adm.proxy_) !== null && _b !== void 0 ? _b : adm.target_)
    }
    return {
        value: createAction(
            (_d = (_c = annotation.options_) === null || _c === void 0 ? void 0 : _c.name) !==
                null && _d !== void 0
                ? _d
                : key.toString(),
            value,
            (_f = (_e = annotation.options_) === null || _e === void 0 ? void 0 : _e.autoAction) !==
                null && _f !== void 0
                ? _f
                : false,
            // https://github.com/mobxjs/mobx/discussions/3140
            ((_g = annotation.options_) === null || _g === void 0 ? void 0 : _g.bound)
                ? (_h = adm.proxy_) !== null && _h !== void 0
                    ? _h
                    : adm.target_
                : undefined
        ),
        // Non-configurable for classes
        // prevents accidental field redefinition in subclass
        configurable: safeDescriptors ? adm.isPlainObject_ : true,
        // https://github.com/mobxjs/mobx/pull/2641#issuecomment-737292058
        enumerable: false,
        // Non-obsevable, therefore non-writable
        // Also prevents rewriting in subclass constructor
        writable: safeDescriptors ? false : true
    }
}

function createFlowAnnotation(name, options) {
    return {
        annotationType_: name,
        options_: options,
        make_: make_$3,
        extend_: extend_$3
    }
}
function make_$3(adm, key, descriptor, source) {
    var _a
    // own
    if (source === adm.target_) {
        return this.extend_(adm, key, descriptor, false) === null
            ? 0 /* Cancel */
            : 2 /* Continue */
    }
    // prototype
    // bound - must annotate protos to support super.flow()
    if (
        ((_a = this.options_) === null || _a === void 0 ? void 0 : _a.bound) &&
        !isFlow(adm.target_[key])
    ) {
        if (this.extend_(adm, key, descriptor, false) === null) return 0 /* Cancel */
    }
    if (isFlow(descriptor.value)) {
        // A prototype could have been annotated already by other constructor,
        // rest of the proto chain must be annotated already
        return 1 /* Break */
    }
    const flowDescriptor = createFlowDescriptor(adm, this, key, descriptor, false, false)
    defineProperty(source, key, flowDescriptor)
    return 2 /* Continue */
}
function extend_$3(adm, key, descriptor, proxyTrap) {
    var _a
    const flowDescriptor = createFlowDescriptor(
        adm,
        this,
        key,
        descriptor,
        (_a = this.options_) === null || _a === void 0 ? void 0 : _a.bound
    )
    return adm.defineProperty_(key, flowDescriptor, proxyTrap)
}
function assertFlowDescriptor(adm, { annotationType_ }, key, { value }) {
    if (__DEV__ && !isFunction(value)) {
        die(
            `Cannot apply '${annotationType_}' to '${adm.name_}.${key.toString()}':` +
                `\n'${annotationType_}' can only be used on properties with a generator function value.`
        )
    }
}
function createFlowDescriptor(
    adm,
    annotation,
    key,
    descriptor,
    bound,
    // provides ability to disable safeDescriptors for prototypes
    safeDescriptors = globalState.safeDescriptors
) {
    var _a
    assertFlowDescriptor(adm, annotation, key, descriptor)
    let { value } = descriptor
    if (bound) {
        value = value.bind((_a = adm.proxy_) !== null && _a !== void 0 ? _a : adm.target_)
    }
    return {
        value: flow(value),
        // Non-configurable for classes
        // prevents accidental field redefinition in subclass
        configurable: safeDescriptors ? adm.isPlainObject_ : true,
        // https://github.com/mobxjs/mobx/pull/2641#issuecomment-737292058
        enumerable: false,
        // Non-obsevable, therefore non-writable
        // Also prevents rewriting in subclass constructor
        writable: safeDescriptors ? false : true
    }
}

function createComputedAnnotation(name, options) {
    return {
        annotationType_: name,
        options_: options,
        make_: make_$2,
        extend_: extend_$2
    }
}
function make_$2(adm, key, descriptor) {
    return this.extend_(adm, key, descriptor, false) === null ? 0 /* Cancel */ : 1 /* Break */
}
function extend_$2(adm, key, descriptor, proxyTrap) {
    assertComputedDescriptor(adm, this, key, descriptor)
    return adm.defineComputedProperty_(
        key,
        Object.assign(Object.assign({}, this.options_), {
            get: descriptor.get,
            set: descriptor.set
        }),
        proxyTrap
    )
}
function assertComputedDescriptor(adm, { annotationType_ }, key, { get }) {
    if (__DEV__ && !get) {
        die(
            `Cannot apply '${annotationType_}' to '${adm.name_}.${key.toString()}':` +
                `\n'${annotationType_}' can only be used on getter(+setter) properties.`
        )
    }
}

function createObservableAnnotation(name, options) {
    return {
        annotationType_: name,
        options_: options,
        make_: make_$1,
        extend_: extend_$1
    }
}
function make_$1(adm, key, descriptor) {
    return this.extend_(adm, key, descriptor, false) === null ? 0 /* Cancel */ : 1 /* Break */
}
function extend_$1(adm, key, descriptor, proxyTrap) {
    var _a, _b
    assertObservableDescriptor(adm, this, key, descriptor)
    return adm.defineObservableProperty_(
        key,
        descriptor.value,
        (_b = (_a = this.options_) === null || _a === void 0 ? void 0 : _a.enhancer) !== null &&
            _b !== void 0
            ? _b
            : deepEnhancer,
        proxyTrap
    )
}
function assertObservableDescriptor(adm, { annotationType_ }, key, descriptor) {
    if (__DEV__ && !("value" in descriptor)) {
        die(
            `Cannot apply '${annotationType_}' to '${adm.name_}.${key.toString()}':` +
                `\n'${annotationType_}' cannot be used on getter/setter properties`
        )
    }
}

const AUTO = "true"
const autoAnnotation = createAutoAnnotation()
function createAutoAnnotation(options) {
    return {
        annotationType_: AUTO,
        options_: options,
        make_,
        extend_
    }
}
function make_(adm, key, descriptor, source) {
    var _a, _b, _c, _d, _e
    // getter -> computed
    if (descriptor.get) {
        return computed.make_(adm, key, descriptor, source)
    }
    // lone setter -> action setter
    if (descriptor.set) {
        // TODO make action applicable to setter and delegate to action.make_
        const set = createAction(key.toString(), descriptor.set)
        // own
        if (source === adm.target_) {
            return adm.defineProperty_(key, {
                configurable: globalState.safeDescriptors ? adm.isPlainObject_ : true,
                set
            }) === null
                ? 0 /* Cancel */
                : 2 /* Continue */
        }
        // proto
        defineProperty(source, key, {
            configurable: true,
            set
        })
        return 2 /* Continue */
    }
    // function on proto -> autoAction/flow
    if (source !== adm.target_ && typeof descriptor.value === "function") {
        if (isGenerator(descriptor.value)) {
            const flowAnnotation = (
                (_a = this.options_) === null || _a === void 0 ? void 0 : _a.autoBind
            )
                ? flow.bound
                : flow
            return flowAnnotation.make_(adm, key, descriptor, source)
        }
        const actionAnnotation = (
            (_b = this.options_) === null || _b === void 0 ? void 0 : _b.autoBind
        )
            ? autoAction.bound
            : autoAction
        return actionAnnotation.make_(adm, key, descriptor, source)
    }
    // other -> observable
    // Copy props from proto as well, see test:
    // "decorate should work with Object.create"
    let observableAnnotation =
        ((_c = this.options_) === null || _c === void 0 ? void 0 : _c.deep) === false
            ? observable.ref
            : observable
    // if function respect autoBind option
    if (
        typeof descriptor.value === "function" &&
        ((_d = this.options_) === null || _d === void 0 ? void 0 : _d.autoBind)
    ) {
        descriptor.value = descriptor.value.bind(
            (_e = adm.proxy_) !== null && _e !== void 0 ? _e : adm.target_
        )
    }
    return observableAnnotation.make_(adm, key, descriptor, source)
}
function extend_(adm, key, descriptor, proxyTrap) {
    var _a, _b, _c
    // getter -> computed
    if (descriptor.get) {
        return computed.extend_(adm, key, descriptor, proxyTrap)
    }
    // lone setter -> action setter
    if (descriptor.set) {
        // TODO make action applicable to setter and delegate to action.extend_
        return adm.defineProperty_(
            key,
            {
                configurable: globalState.safeDescriptors ? adm.isPlainObject_ : true,
                set: createAction(key.toString(), descriptor.set)
            },
            proxyTrap
        )
    }
    // other -> observable
    // if function respect autoBind option
    if (
        typeof descriptor.value === "function" &&
        ((_a = this.options_) === null || _a === void 0 ? void 0 : _a.autoBind)
    ) {
        descriptor.value = descriptor.value.bind(
            (_b = adm.proxy_) !== null && _b !== void 0 ? _b : adm.target_
        )
    }
    let observableAnnotation =
        ((_c = this.options_) === null || _c === void 0 ? void 0 : _c.deep) === false
            ? observable.ref
            : observable
    return observableAnnotation.extend_(adm, key, descriptor, proxyTrap)
}

const OBSERVABLE = "observable"
const OBSERVABLE_REF = "observable.ref"
const OBSERVABLE_SHALLOW = "observable.shallow"
const OBSERVABLE_STRUCT = "observable.struct"
// Predefined bags of create observable options, to avoid allocating temporarily option objects
// in the majority of cases
const defaultCreateObservableOptions = {
    deep: true,
    name: undefined,
    defaultDecorator: undefined,
    proxy: true
}
Object.freeze(defaultCreateObservableOptions)
function asCreateObservableOptions(thing) {
    return thing || defaultCreateObservableOptions
}
const observableAnnotation = createObservableAnnotation(OBSERVABLE)
const observableRefAnnotation = createObservableAnnotation(OBSERVABLE_REF, {
    enhancer: referenceEnhancer
})
const observableShallowAnnotation = createObservableAnnotation(OBSERVABLE_SHALLOW, {
    enhancer: shallowEnhancer
})
const observableStructAnnotation = createObservableAnnotation(OBSERVABLE_STRUCT, {
    enhancer: refStructEnhancer
})
const observableDecoratorAnnotation = createDecoratorAnnotation(observableAnnotation)
function getEnhancerFromOptions(options) {
    return options.deep === true
        ? deepEnhancer
        : options.deep === false
        ? referenceEnhancer
        : getEnhancerFromAnnotation(options.defaultDecorator)
}
function getAnnotationFromOptions(options) {
    var _a
    return options
        ? (_a = options.defaultDecorator) !== null && _a !== void 0
            ? _a
            : createAutoAnnotation(options)
        : undefined
}
function getEnhancerFromAnnotation(annotation) {
    var _a, _b
    return !annotation
        ? deepEnhancer
        : (_b = (_a = annotation.options_) === null || _a === void 0 ? void 0 : _a.enhancer) !==
              null && _b !== void 0
        ? _b
        : deepEnhancer
}
/**
 * Turns an object, array or function into a reactive structure.
 * @param v the value which should become observable.
 */
function createObservable(v, arg2, arg3) {
    // @observable someProp;
    if (isStringish(arg2)) {
        storeAnnotation(v, arg2, observableAnnotation)
        return
    }
    // already observable - ignore
    if (isObservable(v)) return v
    // plain object
    if (isPlainObject(v)) return observable.object(v, arg2, arg3)
    // Array
    if (Array.isArray(v)) return observable.array(v, arg2)
    // Map
    if (isES6Map(v)) return observable.map(v, arg2)
    // Set
    if (isES6Set(v)) return observable.set(v, arg2)
    // other object - ignore
    if (typeof v === "object" && v !== null) return v
    // anything else
    return observable.box(v, arg2)
}
Object.assign(createObservable, observableDecoratorAnnotation)
const observableFactories = {
    box(value, options) {
        const o = asCreateObservableOptions(options)
        return new ObservableValue(value, getEnhancerFromOptions(o), o.name, true, o.equals)
    },
    array(initialValues, options) {
        const o = asCreateObservableOptions(options)
        return (globalState.useProxies === false || o.proxy === false
            ? createLegacyArray
            : createObservableArray)(initialValues, getEnhancerFromOptions(o), o.name)
    },
    map(initialValues, options) {
        const o = asCreateObservableOptions(options)
        return new ObservableMap(initialValues, getEnhancerFromOptions(o), o.name)
    },
    set(initialValues, options) {
        const o = asCreateObservableOptions(options)
        return new ObservableSet(initialValues, getEnhancerFromOptions(o), o.name)
    },
    object(props, decorators, options) {
        return extendObservable(
            globalState.useProxies === false ||
                (options === null || options === void 0 ? void 0 : options.proxy) === false
                ? asObservableObject({}, options)
                : asDynamicObservableObject({}, options),
            props,
            decorators
        )
    },
    ref: createDecoratorAnnotation(observableRefAnnotation),
    shallow: createDecoratorAnnotation(observableShallowAnnotation),
    deep: observableDecoratorAnnotation,
    struct: createDecoratorAnnotation(observableStructAnnotation)
}
// eslint-disable-next-line
var observable = assign(createObservable, observableFactories)

const COMPUTED = "computed"
const COMPUTED_STRUCT = "computed.struct"
const computedAnnotation = createComputedAnnotation(COMPUTED)
const computedStructAnnotation = createComputedAnnotation(COMPUTED_STRUCT, {
    equals: comparer.structural
})
/**
 * Decorator for class properties: @computed get value() { return expr; }.
 * For legacy purposes also invokable as ES5 observable created: `computed(() => expr)`;
 */
const computed = function computed(arg1, arg2) {
    if (isStringish(arg2)) {
        // @computed
        return storeAnnotation(arg1, arg2, computedAnnotation)
    }
    if (isPlainObject(arg1)) {
        // @computed({ options })
        return createDecoratorAnnotation(createComputedAnnotation(COMPUTED, arg1))
    }
    // computed(expr, options?)
    if (__DEV__) {
        if (!isFunction(arg1)) die("First argument to `computed` should be an expression.")
        if (isFunction(arg2))
            die(
                "A setter as second argument is no longer supported, use `{ set: fn }` option instead"
            )
    }
    const opts = isPlainObject(arg2) ? arg2 : {}
    opts.get = arg1
    opts.name || (opts.name = arg1.name || "") /* for generated name */
    return new ComputedValue(opts)
}
Object.assign(computed, computedAnnotation)
computed.struct = createDecoratorAnnotation(computedStructAnnotation)

var _a$2, _b
// we don't use globalState for these in order to avoid possible issues with multiple
// mobx versions
let currentActionId = 0
let nextActionId = 1
const isFunctionNameConfigurable =
    (_b =
        (_a$2 = getDescriptor(() => {}, "name")) === null || _a$2 === void 0
            ? void 0
            : _a$2.configurable) !== null && _b !== void 0
        ? _b
        : false
// we can safely recycle this object
const tmpNameDescriptor = {
    value: "action",
    configurable: true,
    writable: false,
    enumerable: false
}
function createAction(actionName, fn, autoAction = false, ref) {
    if (__DEV__) {
        if (!isFunction(fn)) die("`action` can only be invoked on functions")
        if (typeof actionName !== "string" || !actionName)
            die(`actions should have valid names, got: '${actionName}'`)
    }
    function res() {
        return executeAction(actionName, autoAction, fn, ref || this, arguments)
    }
    res.isMobxAction = true
    if (isFunctionNameConfigurable) {
        tmpNameDescriptor.value = actionName
        Object.defineProperty(res, "name", tmpNameDescriptor)
    }
    return res
}
function executeAction(actionName, canRunAsDerivation, fn, scope, args) {
    const runInfo = _startAction(actionName, canRunAsDerivation, scope, args)
    try {
        return fn.apply(scope, args)
    } catch (err) {
        runInfo.error_ = err
        throw err
    } finally {
        _endAction(runInfo)
    }
}
function _startAction(
    actionName,
    canRunAsDerivation, // true for autoAction
    scope,
    args
) {
    const notifySpy_ = __DEV__ && isSpyEnabled() && !!actionName
    let startTime_ = 0
    if (__DEV__ && notifySpy_) {
        startTime_ = Date.now()
        const flattenedArgs = args ? Array.from(args) : EMPTY_ARRAY
        spyReportStart({
            type: ACTION,
            name: actionName,
            object: scope,
            arguments: flattenedArgs
        })
    }
    const prevDerivation_ = globalState.trackingDerivation
    const runAsAction = !canRunAsDerivation || !prevDerivation_
    startBatch()
    let prevAllowStateChanges_ = globalState.allowStateChanges // by default preserve previous allow
    if (runAsAction) {
        untrackedStart()
        prevAllowStateChanges_ = allowStateChangesStart(true)
    }
    const prevAllowStateReads_ = allowStateReadsStart(true)
    const runInfo = {
        runAsAction_: runAsAction,
        prevDerivation_,
        prevAllowStateChanges_,
        prevAllowStateReads_,
        notifySpy_,
        startTime_,
        actionId_: nextActionId++,
        parentActionId_: currentActionId
    }
    currentActionId = runInfo.actionId_
    return runInfo
}
function _endAction(runInfo) {
    if (currentActionId !== runInfo.actionId_) {
        die(30)
    }
    currentActionId = runInfo.parentActionId_
    if (runInfo.error_ !== undefined) {
        globalState.suppressReactionErrors = true
    }
    allowStateChangesEnd(runInfo.prevAllowStateChanges_)
    allowStateReadsEnd(runInfo.prevAllowStateReads_)
    endBatch()
    if (runInfo.runAsAction_) untrackedEnd(runInfo.prevDerivation_)
    if (__DEV__ && runInfo.notifySpy_) {
        spyReportEnd({ time: Date.now() - runInfo.startTime_ })
    }
    globalState.suppressReactionErrors = false
}
function allowStateChangesStart(allowStateChanges) {
    const prev = globalState.allowStateChanges
    globalState.allowStateChanges = allowStateChanges
    return prev
}
function allowStateChangesEnd(prev) {
    globalState.allowStateChanges = prev
}

const CREATE = "create"
class ObservableValue extends Atom {
    constructor(
        value,
        enhancer,
        name_ = __DEV__ ? "ObservableValue@" + getNextId() : "ObservableValue",
        notifySpy = true,
        equals = comparer.default
    ) {
        super(name_)
        Object.defineProperty(this, "enhancer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: enhancer
        })
        Object.defineProperty(this, "name_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: name_
        })
        Object.defineProperty(this, "equals", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: equals
        })
        Object.defineProperty(this, "hasUnreportedChange_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        })
        Object.defineProperty(this, "interceptors_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "changeListeners_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "value_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "dehancer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        this.value_ = enhancer(value, undefined, name_)
        if (__DEV__ && notifySpy && isSpyEnabled()) {
            // only notify spy if this is a stand-alone observable
            spyReport({
                type: CREATE,
                object: this,
                observableKind: "value",
                debugObjectName: this.name_,
                newValue: "" + this.value_
            })
        }
    }
    dehanceValue(value) {
        if (this.dehancer !== undefined) return this.dehancer(value)
        return value
    }
    set(newValue) {
        const oldValue = this.value_
        newValue = this.prepareNewValue_(newValue)
        if (newValue !== globalState.UNCHANGED) {
            const notifySpy = isSpyEnabled()
            if (__DEV__ && notifySpy) {
                spyReportStart({
                    type: UPDATE,
                    object: this,
                    observableKind: "value",
                    debugObjectName: this.name_,
                    newValue,
                    oldValue
                })
            }
            this.setNewValue_(newValue)
            if (__DEV__ && notifySpy) spyReportEnd()
        }
    }
    prepareNewValue_(newValue) {
        checkIfStateModificationsAreAllowed(this)
        if (hasInterceptors(this)) {
            const change = interceptChange(this, {
                object: this,
                type: UPDATE,
                newValue
            })
            if (!change) return globalState.UNCHANGED
            newValue = change.newValue
        }
        // apply modifier
        newValue = this.enhancer(newValue, this.value_, this.name_)
        return this.equals(this.value_, newValue) ? globalState.UNCHANGED : newValue
    }
    setNewValue_(newValue) {
        const oldValue = this.value_
        this.value_ = newValue
        this.reportChanged()
        if (hasListeners(this)) {
            notifyListeners(this, {
                type: UPDATE,
                object: this,
                newValue,
                oldValue
            })
        }
    }
    get() {
        this.reportObserved()
        return this.dehanceValue(this.value_)
    }
    intercept_(handler) {
        return registerInterceptor(this, handler)
    }
    observe_(listener, fireImmediately) {
        if (fireImmediately)
            listener({
                observableKind: "value",
                debugObjectName: this.name_,
                object: this,
                type: UPDATE,
                newValue: this.value_,
                oldValue: undefined
            })
        return registerListener(this, listener)
    }
    raw() {
        // used by MST ot get undehanced value
        return this.value_
    }
    toJSON() {
        return this.get()
    }
    toString() {
        return `${this.name_}[${this.value_}]`
    }
    valueOf() {
        return toPrimitive(this.get())
    }
    [Symbol.toPrimitive]() {
        return this.valueOf()
    }
}
createInstanceofPredicate("ObservableValue", ObservableValue)

/**
 * A node in the state dependency root that observes other nodes, and can be observed itself.
 *
 * ComputedValue will remember the result of the computation for the duration of the batch, or
 * while being observed.
 *
 * During this time it will recompute only when one of its direct dependencies changed,
 * but only when it is being accessed with `ComputedValue.get()`.
 *
 * Implementation description:
 * 1. First time it's being accessed it will compute and remember result
 *    give back remembered result until 2. happens
 * 2. First time any deep dependency change, propagate POSSIBLY_STALE to all observers, wait for 3.
 * 3. When it's being accessed, recompute if any shallow dependency changed.
 *    if result changed: propagate STALE to all observers, that were POSSIBLY_STALE from the last step.
 *    go to step 2. either way
 *
 * If at any point it's outside batch and it isn't observed: reset everything and go to 1.
 */
class ComputedValue {
    /**
     * Create a new computed value based on a function expression.
     *
     * The `name` property is for debug purposes only.
     *
     * The `equals` property specifies the comparer function to use to determine if a newly produced
     * value differs from the previous value. Two comparers are provided in the library; `defaultComparer`
     * compares based on identity comparison (===), and `structuralComparer` deeply compares the structure.
     * Structural comparison can be convenient if you always produce a new aggregated object and
     * don't want to notify observers if it is structurally the same.
     * This is useful for working with vectors, mouse coordinates etc.
     */
    constructor(options) {
        Object.defineProperty(this, "dependenciesState_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: IDerivationState_.NOT_TRACKING_
        })
        Object.defineProperty(this, "observing_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        }) // nodes we are looking at. Our value depends on these nodes
        Object.defineProperty(this, "newObserving_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        }) // during tracking it's an array with new observed observers
        Object.defineProperty(this, "isBeingObserved_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        })
        Object.defineProperty(this, "isPendingUnobservation_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        })
        Object.defineProperty(this, "observers_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Set()
        })
        Object.defineProperty(this, "diffValue_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        })
        Object.defineProperty(this, "runId_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        })
        Object.defineProperty(this, "lastAccessedBy_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        })
        Object.defineProperty(this, "lowestObserverState_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: IDerivationState_.UP_TO_DATE_
        })
        Object.defineProperty(this, "unboundDepsCount_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        })
        Object.defineProperty(this, "value_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new CaughtException(null)
        })
        Object.defineProperty(this, "name_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "triggeredBy_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "isComputing_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        }) // to check for cycles
        Object.defineProperty(this, "isRunningSetter_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        })
        Object.defineProperty(this, "derivation", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }) // N.B: unminified as it is used by MST
        Object.defineProperty(this, "setter_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "isTracing_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: TraceMode.NONE
        })
        Object.defineProperty(this, "scope_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "equals_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "requiresReaction_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "keepAlive_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "onBOL", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "onBUOL", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        if (!options.get) die(31)
        this.derivation = options.get
        this.name_ = options.name || (__DEV__ ? "ComputedValue@" + getNextId() : "ComputedValue")
        if (options.set) {
            this.setter_ = createAction(
                __DEV__ ? this.name_ + "-setter" : "ComputedValue-setter",
                options.set
            )
        }
        this.equals_ =
            options.equals ||
            (options.compareStructural || options.struct ? comparer.structural : comparer.default)
        this.scope_ = options.context
        this.requiresReaction_ = !!options.requiresReaction
        this.keepAlive_ = !!options.keepAlive
    }
    onBecomeStale_() {
        propagateMaybeChanged(this)
    }
    onBO() {
        if (this.onBOL) {
            this.onBOL.forEach(listener => listener())
        }
    }
    onBUO() {
        if (this.onBUOL) {
            this.onBUOL.forEach(listener => listener())
        }
    }
    /**
     * Returns the current value of this computed value.
     * Will evaluate its computation first if needed.
     */
    get() {
        if (this.isComputing_) die(32, this.name_, this.derivation)
        if (
            globalState.inBatch === 0 &&
            // !globalState.trackingDerivatpion &&
            this.observers_.size === 0 &&
            !this.keepAlive_
        ) {
            if (shouldCompute(this)) {
                this.warnAboutUntrackedRead_()
                startBatch() // See perf test 'computed memoization'
                this.value_ = this.computeValue_(false)
                endBatch()
            }
        } else {
            reportObserved(this)
            if (shouldCompute(this)) {
                let prevTrackingContext = globalState.trackingContext
                if (this.keepAlive_ && !prevTrackingContext) globalState.trackingContext = this
                if (this.trackAndCompute()) propagateChangeConfirmed(this)
                globalState.trackingContext = prevTrackingContext
            }
        }
        const result = this.value_
        if (isCaughtException(result)) throw result.cause
        return result
    }
    set(value) {
        if (this.setter_) {
            if (this.isRunningSetter_) die(33, this.name_)
            this.isRunningSetter_ = true
            try {
                this.setter_.call(this.scope_, value)
            } finally {
                this.isRunningSetter_ = false
            }
        } else die(34, this.name_)
    }
    trackAndCompute() {
        // N.B: unminified as it is used by MST
        const oldValue = this.value_
        const wasSuspended =
            /* see #1208 */ this.dependenciesState_ === IDerivationState_.NOT_TRACKING_
        const newValue = this.computeValue_(true)
        const changed =
            wasSuspended ||
            isCaughtException(oldValue) ||
            isCaughtException(newValue) ||
            !this.equals_(oldValue, newValue)
        if (changed) {
            this.value_ = newValue
            if (__DEV__ && isSpyEnabled()) {
                spyReport({
                    observableKind: "computed",
                    debugObjectName: this.name_,
                    object: this.scope_,
                    type: "update",
                    oldValue,
                    newValue
                })
            }
        }
        return changed
    }
    computeValue_(track) {
        this.isComputing_ = true
        // don't allow state changes during computation
        const prev = allowStateChangesStart(false)
        let res
        if (track) {
            res = trackDerivedFunction(this, this.derivation, this.scope_)
        } else {
            if (globalState.disableErrorBoundaries === true) {
                res = this.derivation.call(this.scope_)
            } else {
                try {
                    res = this.derivation.call(this.scope_)
                } catch (e) {
                    res = new CaughtException(e)
                }
            }
        }
        allowStateChangesEnd(prev)
        this.isComputing_ = false
        return res
    }
    suspend_() {
        if (!this.keepAlive_) {
            clearObserving(this)
            this.value_ = undefined // don't hold on to computed value!
            if (__DEV__ && this.isTracing_ !== TraceMode.NONE) {
                console.log(
                    `[mobx.trace] Computed value '${this.name_}' was suspended and it will recompute on the next access.`
                )
            }
        }
    }
    observe_(listener, fireImmediately) {
        let firstTime = true
        let prevValue = undefined
        return autorun(() => {
            // TODO: why is this in a different place than the spyReport() function? in all other observables it's called in the same place
            let newValue = this.get()
            if (!firstTime || fireImmediately) {
                const prevU = untrackedStart()
                listener({
                    observableKind: "computed",
                    debugObjectName: this.name_,
                    type: UPDATE,
                    object: this,
                    newValue,
                    oldValue: prevValue
                })
                untrackedEnd(prevU)
            }
            firstTime = false
            prevValue = newValue
        })
    }
    warnAboutUntrackedRead_() {
        if (!__DEV__) return
        if (this.isTracing_ !== TraceMode.NONE) {
            console.log(
                `[mobx.trace] Computed value '${this.name_}' is being read outside a reactive context. Doing a full recompute.`
            )
        }
        if (globalState.computedRequiresReaction || this.requiresReaction_) {
            console.warn(
                `[mobx] Computed value '${this.name_}' is being read outside a reactive context. Doing a full recompute.`
            )
        }
    }
    toString() {
        return `${this.name_}[${this.derivation.toString()}]`
    }
    valueOf() {
        return toPrimitive(this.get())
    }
    [Symbol.toPrimitive]() {
        return this.valueOf()
    }
}
const isComputedValue = createInstanceofPredicate("ComputedValue", ComputedValue)

var IDerivationState_
;(function (IDerivationState_) {
    // before being run or (outside batch and not being observed)
    // at this point derivation is not holding any data about dependency tree
    IDerivationState_[(IDerivationState_["NOT_TRACKING_"] = -1)] = "NOT_TRACKING_"
    // no shallow dependency changed since last computation
    // won't recalculate derivation
    // this is what makes mobx fast
    IDerivationState_[(IDerivationState_["UP_TO_DATE_"] = 0)] = "UP_TO_DATE_"
    // some deep dependency changed, but don't know if shallow dependency changed
    // will require to check first if UP_TO_DATE or POSSIBLY_STALE
    // currently only ComputedValue will propagate POSSIBLY_STALE
    //
    // having this state is second big optimization:
    // don't have to recompute on every dependency change, but only when it's needed
    IDerivationState_[(IDerivationState_["POSSIBLY_STALE_"] = 1)] = "POSSIBLY_STALE_"
    // A shallow dependency has changed since last computation and the derivation
    // will need to recompute when it's needed next.
    IDerivationState_[(IDerivationState_["STALE_"] = 2)] = "STALE_"
})(IDerivationState_ || (IDerivationState_ = {}))
var TraceMode
;(function (TraceMode) {
    TraceMode[(TraceMode["NONE"] = 0)] = "NONE"
    TraceMode[(TraceMode["LOG"] = 1)] = "LOG"
    TraceMode[(TraceMode["BREAK"] = 2)] = "BREAK"
})(TraceMode || (TraceMode = {}))
class CaughtException {
    constructor(cause) {
        Object.defineProperty(this, "cause", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: cause
        })
        // Empty
    }
}
function isCaughtException(e) {
    return e instanceof CaughtException
}
/**
 * Finds out whether any dependency of the derivation has actually changed.
 * If dependenciesState is 1 then it will recalculate dependencies,
 * if any dependency changed it will propagate it by changing dependenciesState to 2.
 *
 * By iterating over the dependencies in the same order that they were reported and
 * stopping on the first change, all the recalculations are only called for ComputedValues
 * that will be tracked by derivation. That is because we assume that if the first x
 * dependencies of the derivation doesn't change then the derivation should run the same way
 * up until accessing x-th dependency.
 */
function shouldCompute(derivation) {
    switch (derivation.dependenciesState_) {
        case IDerivationState_.UP_TO_DATE_:
            return false
        case IDerivationState_.NOT_TRACKING_:
        case IDerivationState_.STALE_:
            return true
        case IDerivationState_.POSSIBLY_STALE_: {
            // state propagation can occur outside of action/reactive context #2195
            const prevAllowStateReads = allowStateReadsStart(true)
            const prevUntracked = untrackedStart() // no need for those computeds to be reported, they will be picked up in trackDerivedFunction.
            const obs = derivation.observing_,
                l = obs.length
            for (let i = 0; i < l; i++) {
                const obj = obs[i]
                if (isComputedValue(obj)) {
                    if (globalState.disableErrorBoundaries) {
                        obj.get()
                    } else {
                        try {
                            obj.get()
                        } catch (e) {
                            // we are not interested in the value *or* exception at this moment, but if there is one, notify all
                            untrackedEnd(prevUntracked)
                            allowStateReadsEnd(prevAllowStateReads)
                            return true
                        }
                    }
                    // if ComputedValue `obj` actually changed it will be computed and propagated to its observers.
                    // and `derivation` is an observer of `obj`
                    // invariantShouldCompute(derivation)
                    if (derivation.dependenciesState_ === IDerivationState_.STALE_) {
                        untrackedEnd(prevUntracked)
                        allowStateReadsEnd(prevAllowStateReads)
                        return true
                    }
                }
            }
            changeDependenciesStateTo0(derivation)
            untrackedEnd(prevUntracked)
            allowStateReadsEnd(prevAllowStateReads)
            return false
        }
    }
}
function checkIfStateModificationsAreAllowed(atom) {
    if (!__DEV__) {
        return
    }
    const hasObservers = atom.observers_.size > 0
    // Should not be possible to change observed state outside strict mode, except during initialization, see #563
    if (!globalState.allowStateChanges && (hasObservers || globalState.enforceActions === "always"))
        console.warn(
            "[MobX] " +
                (globalState.enforceActions
                    ? "Since strict-mode is enabled, changing (observed) observable values without using an action is not allowed. Tried to modify: "
                    : "Side effects like changing state are not allowed at this point. Are you trying to modify state from, for example, a computed value or the render function of a React component? You can wrap side effects in 'runInAction' (or decorate functions with 'action') if needed. Tried to modify: ") +
                atom.name_
        )
}
function checkIfStateReadsAreAllowed(observable) {
    if (__DEV__ && !globalState.allowStateReads && globalState.observableRequiresReaction) {
        console.warn(
            `[mobx] Observable '${observable.name_}' being read outside a reactive context.`
        )
    }
}
/**
 * Executes the provided function `f` and tracks which observables are being accessed.
 * The tracking information is stored on the `derivation` object and the derivation is registered
 * as observer of any of the accessed observables.
 */
function trackDerivedFunction(derivation, f, context) {
    const prevAllowStateReads = allowStateReadsStart(true)
    // pre allocate array allocation + room for variation in deps
    // array will be trimmed by bindDependencies
    changeDependenciesStateTo0(derivation)
    derivation.newObserving_ = new Array(derivation.observing_.length + 100)
    derivation.unboundDepsCount_ = 0
    derivation.runId_ = ++globalState.runId
    const prevTracking = globalState.trackingDerivation
    globalState.trackingDerivation = derivation
    globalState.inBatch++
    let result
    if (globalState.disableErrorBoundaries === true) {
        result = f.call(context)
    } else {
        try {
            result = f.call(context)
        } catch (e) {
            result = new CaughtException(e)
        }
    }
    globalState.inBatch--
    globalState.trackingDerivation = prevTracking
    bindDependencies(derivation)
    warnAboutDerivationWithoutDependencies(derivation)
    allowStateReadsEnd(prevAllowStateReads)
    return result
}
function warnAboutDerivationWithoutDependencies(derivation) {
    if (!__DEV__) return
    if (derivation.observing_.length !== 0) return
    if (globalState.reactionRequiresObservable || derivation.requiresObservable_) {
        console.warn(
            `[mobx] Derivation '${derivation.name_}' is created/updated without reading any observable value.`
        )
    }
}
/**
 * diffs newObserving with observing.
 * update observing to be newObserving with unique observables
 * notify observers that become observed/unobserved
 */
function bindDependencies(derivation) {
    // invariant(derivation.dependenciesState !== IDerivationState.NOT_TRACKING, "INTERNAL ERROR bindDependencies expects derivation.dependenciesState !== -1");
    const prevObserving = derivation.observing_
    const observing = (derivation.observing_ = derivation.newObserving_)
    let lowestNewObservingDerivationState = IDerivationState_.UP_TO_DATE_
    // Go through all new observables and check diffValue: (this list can contain duplicates):
    //   0: first occurrence, change to 1 and keep it
    //   1: extra occurrence, drop it
    let i0 = 0,
        l = derivation.unboundDepsCount_
    for (let i = 0; i < l; i++) {
        const dep = observing[i]
        if (dep.diffValue_ === 0) {
            dep.diffValue_ = 1
            if (i0 !== i) observing[i0] = dep
            i0++
        }
        // Upcast is 'safe' here, because if dep is IObservable, `dependenciesState` will be undefined,
        // not hitting the condition
        if (dep.dependenciesState_ > lowestNewObservingDerivationState) {
            lowestNewObservingDerivationState = dep.dependenciesState_
        }
    }
    observing.length = i0
    derivation.newObserving_ = null // newObserving shouldn't be needed outside tracking (statement moved down to work around FF bug, see #614)
    // Go through all old observables and check diffValue: (it is unique after last bindDependencies)
    //   0: it's not in new observables, unobserve it
    //   1: it keeps being observed, don't want to notify it. change to 0
    l = prevObserving.length
    while (l--) {
        const dep = prevObserving[l]
        if (dep.diffValue_ === 0) {
            removeObserver(dep, derivation)
        }
        dep.diffValue_ = 0
    }
    // Go through all new observables and check diffValue: (now it should be unique)
    //   0: it was set to 0 in last loop. don't need to do anything.
    //   1: it wasn't observed, let's observe it. set back to 0
    while (i0--) {
        const dep = observing[i0]
        if (dep.diffValue_ === 1) {
            dep.diffValue_ = 0
            addObserver(dep, derivation)
        }
    }
    // Some new observed derivations may become stale during this derivation computation
    // so they have had no chance to propagate staleness (#916)
    if (lowestNewObservingDerivationState !== IDerivationState_.UP_TO_DATE_) {
        derivation.dependenciesState_ = lowestNewObservingDerivationState
        derivation.onBecomeStale_()
    }
}
//清除观察者的 `observing_`列表，并对列表里的observable依次执行移除观察者行为：
//removeObserver(observable,observer)
function clearObserving(derivation) {
    // invariant(globalState.inBatch > 0, "INTERNAL ERROR clearObserving should be called only inside batch");
    const obs = derivation.observing_
    derivation.observing_ = []
    let i = obs.length
    while (i--) removeObserver(obs[i], derivation)
    derivation.dependenciesState_ = IDerivationState_.NOT_TRACKING_
}
function untracked(action) {
    const prev = untrackedStart()
    try {
        return action()
    } finally {
        untrackedEnd(prev)
    }
}
function untrackedStart() {
    const prev = globalState.trackingDerivation
    globalState.trackingDerivation = null
    return prev
}
function untrackedEnd(prev) {
    globalState.trackingDerivation = prev
}
function allowStateReadsStart(allowStateReads) {
    const prev = globalState.allowStateReads
    globalState.allowStateReads = allowStateReads
    return prev
}
function allowStateReadsEnd(prev) {
    globalState.allowStateReads = prev
}
/**
 * needed to keep `lowestObserverState` correct. when changing from (2 or 1) to 0
 *
 */
function changeDependenciesStateTo0(derivation) {
    if (derivation.dependenciesState_ === IDerivationState_.UP_TO_DATE_) return
    derivation.dependenciesState_ = IDerivationState_.UP_TO_DATE_
    const obs = derivation.observing_
    let i = obs.length
    while (i--) obs[i].lowestObserverState_ = IDerivationState_.UP_TO_DATE_
}

class MobXGlobals {
    constructor() {
        /**
         * MobXGlobals version.
         * MobX compatiblity with other versions loaded in memory as long as this version matches.
         * It indicates that the global state still stores similar information
         *
         * N.B: this version is unrelated to the package version of MobX, and is only the version of the
         * internal state storage of MobX, and can be the same across many different package versions
         */
        Object.defineProperty(this, "version", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 6
        })
        /**
         * globally unique token to signal unchanged
         */
        Object.defineProperty(this, "UNCHANGED", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        })
        /**
         * Currently running derivation
         */
        Object.defineProperty(this, "trackingDerivation", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        })
        /**
         * Currently running reaction. This determines if we currently have a reactive context.
         * (Tracking derivation is also set for temporal tracking of computed values inside actions,
         * but trackingReaction can only be set by a form of Reaction)
         */
        Object.defineProperty(this, "trackingContext", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        })
        /**
         * Each time a derivation is tracked, it is assigned a unique run-id
         */
        Object.defineProperty(this, "runId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        })
        /**
         * 'guid' for general purpose. Will be persisted amongst resets.
         */
        Object.defineProperty(this, "mobxGuid", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        })
        /**
         * Are we in a batch block? (and how many of them)
         */
        Object.defineProperty(this, "inBatch", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        })
        /**
         * Observables that don't have observers anymore, and are about to be
         * suspended, unless somebody else accesses it in the same batch
         *
         * @type {IObservable[]}
         */
        Object.defineProperty(this, "pendingUnobservations", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        })
        /**
         * List of scheduled, not yet executed, reactions.
         */
        Object.defineProperty(this, "pendingReactions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        })
        /**
         * Are we currently processing reactions?
         */
        Object.defineProperty(this, "isRunningReactions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        })
        /**
         * Is it allowed to change observables at this point?
         * In general, MobX doesn't allow that when running computations and React.render.
         * To ensure that those functions stay pure.
         */
        Object.defineProperty(this, "allowStateChanges", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        })
        /**
         * Is it allowed to read observables at this point?
         * Used to hold the state needed for `observableRequiresReaction`
         */
        Object.defineProperty(this, "allowStateReads", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        })
        /**
         * If strict mode is enabled, state changes are by default not allowed
         */
        Object.defineProperty(this, "enforceActions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        })
        /**
         * Spy callbacks
         */
        Object.defineProperty(this, "spyListeners", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        })
        /**
         * Globally attached error handlers that react specifically to errors in reactions
         */
        Object.defineProperty(this, "globalReactionErrorHandlers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        })
        /**
         * Warn if computed values are accessed outside a reactive context
         */
        Object.defineProperty(this, "computedRequiresReaction", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        })
        /**
         * (Experimental)
         * Warn if you try to create to derivation / reactive context without accessing any observable.
         */
        Object.defineProperty(this, "reactionRequiresObservable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        })
        /**
         * (Experimental)
         * Warn if observables are accessed outside a reactive context
         */
        Object.defineProperty(this, "observableRequiresReaction", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        })
        /*
         * Don't catch and rethrow exceptions. This is useful for inspecting the state of
         * the stack when an exception occurs while debugging.
         */
        Object.defineProperty(this, "disableErrorBoundaries", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        })
        /*
         * If true, we are already handling an exception in an action. Any errors in reactions should be suppressed, as
         * they are not the cause, see: https://github.com/mobxjs/mobx/issues/1836
         */
        Object.defineProperty(this, "suppressReactionErrors", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        })
        Object.defineProperty(this, "useProxies", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        })
        /*
         * print warnings about code that would fail if proxies weren't available
         */
        Object.defineProperty(this, "verifyProxies", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        })
        /**
         * False forces all object's descriptors to
         * writable: true
         * configurable: true
         */
        Object.defineProperty(this, "safeDescriptors", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        })
    }
}
let canMergeGlobalState = true
let globalState = (function () {
    let global = getGlobal()
    if (global.__mobxInstanceCount > 0 && !global.__mobxGlobals) canMergeGlobalState = false
    if (global.__mobxGlobals && global.__mobxGlobals.version !== new MobXGlobals().version)
        canMergeGlobalState = false
    if (!canMergeGlobalState) {
        // Because this is a IIFE we need to let isolateCalled a chance to change
        // so we run it after the event loop completed at least 1 iteration
        setTimeout(() => {
            {
                die(35)
            }
        }, 1)
        return new MobXGlobals()
    } else if (global.__mobxGlobals) {
        global.__mobxInstanceCount += 1
        if (!global.__mobxGlobals.UNCHANGED) global.__mobxGlobals.UNCHANGED = {} // make merge backward compatible
        return global.__mobxGlobals
    } else {
        global.__mobxInstanceCount = 1
        return (global.__mobxGlobals = new MobXGlobals())
    }
})()

// function invariantObservers(observable: IObservable) {
//     const list = observable.observers
//     const map = observable.observersIndexes
//     const l = list.length
//     for (let i = 0; i < l; i++) {
//         const id = list[i].__mapid
//         if (i) {
//             invariant(map[id] === i, "INTERNAL ERROR maps derivation.__mapid to index in list") // for performance
//         } else {
//             invariant(!(id in map), "INTERNAL ERROR observer on index 0 shouldn't be held in map.") // for performance
//         }
//     }
//     invariant(
//         list.length === 0 || Object.keys(map).length === list.length - 1,
//         "INTERNAL ERROR there is no junk in map"
//     )
// }
function addObserver(observable, node) {
    // invariant(node.dependenciesState !== -1, "INTERNAL ERROR, can add only dependenciesState !== -1");
    // invariant(observable._observers.indexOf(node) === -1, "INTERNAL ERROR add already added node");
    // invariantObservers(observable);
    observable.observers_.add(node)
    //取最低的
    if (observable.lowestObserverState_ > node.dependenciesState_)
        observable.lowestObserverState_ = node.dependenciesState_
    // invariantObservers(observable);
    // invariant(observable._observers.indexOf(node) !== -1, "INTERNAL ERROR didn't add node");
}
function removeObserver(observable, node) {
    // invariant(globalState.inBatch > 0, "INTERNAL ERROR, remove should be called only inside batch");
    // invariant(observable._observers.indexOf(node) !== -1, "INTERNAL ERROR remove already removed node");
    // invariantObservers(observable);
    observable.observers_.delete(node)
    //当可观察对象的观察者为空时，队列处理观察解除（UnObservation）
    if (observable.observers_.size === 0) {
        // deleting last observer
        queueForUnobservation(observable)
    }
    // invariantObservers(observable);
    // invariant(observable._observers.indexOf(node) === -1, "INTERNAL ERROR remove already removed node2");
}
function queueForUnobservation(observable) {
    if (observable.isPendingUnobservation_ === false) {
        // invariant(observable._observers.length === 0, "INTERNAL ERROR, should only queue for unobservation unobserved observables");
        observable.isPendingUnobservation_ = true
        globalState.pendingUnobservations.push(observable)
    }
}
/**
 * Batch starts a transaction, at least for purposes of memoizing ComputedValues when nothing else does.
 * During a batch `onBecomeUnobserved` will be called at most once per observable.
 * Avoids unnecessary recalculations.
 */
function startBatch() {
    globalState.inBatch++
}
/**
 * 结束事物：
 * 1. 运行 global中的pendingReactions
 * 2. 重置global中的pendingUnobservations的属性状态：isPendingUnobservation_、isBeingObserved_,触发onBUO
 */
function endBatch() {
    if (--globalState.inBatch === 0) {
        //取出所有global.pendingReactions 并执行每个项目中的`runReaction_`
        runReactions()
        // the batch is actually about to finish, all unobserving should happen here.
        const list = globalState.pendingUnobservations
        for (let i = 0; i < list.length; i++) {
            const observable = list[i]
            observable.isPendingUnobservation_ = false
            //仅当观察者列表为空时
            if (observable.observers_.size === 0) {
                if (observable.isBeingObserved_) {
                    // if this observable had reactive observers, trigger the hooks
                    observable.isBeingObserved_ = false
                    //触发`变为不可观察对象`钩子
                    observable.onBUO()
                }
                if (observable instanceof ComputedValue) {
                    // computed values are automatically teared down when the last observer leaves
                    // this process happens recursively, this computed might be the last observabe of another, etc..
                    observable.suspend_()
                }
            }
        }
        globalState.pendingUnobservations = []
    }
}
/**
 * 报告（收集）：
 * 1. 观察者收集observable，记录观察者的runId到observable上
 * 2. 累加观察者的 unboundDepsCount、添加observable到 观察者的newObserving_列表里
 * 3. 触发observable的 onBO钩子
 */
function reportObserved(observable) {
    checkIfStateReadsAreAllowed(observable)
    //取出 当前正在追踪的derivation(观察者)
    const derivation = globalState.trackingDerivation
    if (derivation !== null) {
        /**
         * Simple optimization, give each derivation run an unique id (runId)
         * Check if last time this observable was accessed the same runId is used
         * if this is the case, the relation is already known
         */
        if (derivation.runId_ !== observable.lastAccessedBy_) {
            observable.lastAccessedBy_ = derivation.runId_
            // Tried storing newObserving, or observing, or both as Set, but performance didn't come close...
            //把observable添加到 derivation的newObserving数组里（累加unboundDepsCount_属性）
            derivation.newObserving_[derivation.unboundDepsCount_++] = observable
            if (!observable.isBeingObserved_ && globalState.trackingContext) {
                observable.isBeingObserved_ = true
                observable.onBO()
            }
        }
        return true
    } else if (observable.observers_.size === 0 && globalState.inBatch > 0) {
        queueForUnobservation(observable)
    }
    return false
}
// function invariantLOS(observable: IObservable, msg: string) {
//     // it's expensive so better not run it in produciton. but temporarily helpful for testing
//     const min = getObservers(observable).reduce((a, b) => Math.min(a, b.dependenciesState), 2)
//     if (min >= observable.lowestObserverState) return // <- the only assumption about `lowestObserverState`
//     throw new Error(
//         "lowestObserverState is wrong for " +
//             msg +
//             " because " +
//             min +
//             " < " +
//             observable.lowestObserverState
//     )
// }
/**
 * NOTE: current propagation mechanism will in case of self reruning autoruns behave unexpectedly
 * It will propagate changes to observers from previous run
 * It's hard or maybe impossible (with reasonable perf) to get it right with current approach
 * Hopefully self reruning autoruns aren't a feature people should depend on
 * Also most basic use cases should be ok
 */
/**
 * 传播变化：observable变更触发 观察者执行
 * 1. 防抖
 * 2. 只有d.dependenciesState_ 为 up_to_date的才触发 d.onBecomeStale_()
 * 3. 统一将d.dependenciesState_ 改为 _stale
 * 猜测，这里是防抖处理，一定有个地方会重置d.dependenciesState_ 的。
 */
// Called by Atom when its value changes
//修改两个地方： lowestObserverState_、 observers_ 每一项的dependenciesState_ 为 stale
function propagateChanged(observable) {
    // invariantLOS(observable, "changed start");
    //这里的lowestObserverState_ 是个开关，防止重复执行
    if (observable.lowestObserverState_ === IDerivationState_.STALE_) return
    observable.lowestObserverState_ = IDerivationState_.STALE_
    // Ideally we use for..of here, but the downcompiled version is really slow...
    observable.observers_.forEach(d => {
        //将STALE_同步到 观察者的dependenciesState_
        if (d.dependenciesState_ === IDerivationState_.UP_TO_DATE_) {
            if (__DEV__ && d.isTracing_ !== TraceMode.NONE) {
                logTraceInfo(d, observable)
            }
            d.onBecomeStale_()
        }
        d.dependenciesState_ = IDerivationState_.STALE_
    })
    // invariantLOS(observable, "changed end");
}
// Called by ComputedValue when it recalculate and its value changed
function propagateChangeConfirmed(observable) {
    // invariantLOS(observable, "confirmed start");
    if (observable.lowestObserverState_ === IDerivationState_.STALE_) return
    observable.lowestObserverState_ = IDerivationState_.STALE_
    observable.observers_.forEach(d => {
        if (d.dependenciesState_ === IDerivationState_.POSSIBLY_STALE_) {
            d.dependenciesState_ = IDerivationState_.STALE_
            if (__DEV__ && d.isTracing_ !== TraceMode.NONE) {
                logTraceInfo(d, observable)
            }
        } else if (
            d.dependenciesState_ === IDerivationState_.UP_TO_DATE_ // this happens during computing of `d`, just keep lowestObserverState up to date.
        ) {
            observable.lowestObserverState_ = IDerivationState_.UP_TO_DATE_
        }
    })
    // invariantLOS(observable, "confirmed end");
}
// Used by computed when its dependency changed, but we don't wan't to immediately recompute.
function propagateMaybeChanged(observable) {
    // invariantLOS(observable, "maybe start");
    if (observable.lowestObserverState_ !== IDerivationState_.UP_TO_DATE_) return
    observable.lowestObserverState_ = IDerivationState_.POSSIBLY_STALE_
    observable.observers_.forEach(d => {
        if (d.dependenciesState_ === IDerivationState_.UP_TO_DATE_) {
            d.dependenciesState_ = IDerivationState_.POSSIBLY_STALE_
            d.onBecomeStale_()
        }
    })
    // invariantLOS(observable, "maybe end");
}
function logTraceInfo(derivation, observable) {
    console.log(
        `[mobx.trace] '${derivation.name_}' is invalidated due to a change in: '${observable.name_}'`
    )
    if (derivation.isTracing_ === TraceMode.BREAK) {
        const lines = []
        printDepTree(getDependencyTree(derivation), lines, 1)
        // prettier-ignore
        new Function(`debugger;
/*
Tracing '${derivation.name_}'

You are entering this break point because derivation '${derivation.name_}' is being traced and '${observable.name_}' is now forcing it to update.
Just follow the stacktrace you should now see in the devtools to see precisely what piece of your code is causing this update
The stackframe you are looking for is at least ~6-8 stack-frames up.

${derivation instanceof ComputedValue ? derivation.derivation.toString().replace(/[*]\//g, "/") : ""}

The dependencies for this derivation are:

${lines.join("\n")}
*/
    `)();
    }
}
function printDepTree(tree, lines, depth) {
    if (lines.length >= 1000) {
        lines.push("(and many more)")
        return
    }
    lines.push(`${"\t".repeat(depth - 1)}${tree.name}`)
    if (tree.dependencies) tree.dependencies.forEach(child => printDepTree(child, lines, depth + 1))
}

class Reaction {
    constructor(
        name_ = __DEV__ ? "Reaction@" + getNextId() : "Reaction",
        onInvalidate_,
        errorHandler_,
        requiresObservable_ = false
    ) {
        Object.defineProperty(this, "name_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: name_
        })
        Object.defineProperty(this, "onInvalidate_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: onInvalidate_
        })
        Object.defineProperty(this, "errorHandler_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: errorHandler_
        })
        Object.defineProperty(this, "requiresObservable_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: requiresObservable_
        })
        Object.defineProperty(this, "observing_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        }) // nodes we are looking at. Our value depends on these nodes
        Object.defineProperty(this, "newObserving_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        })
        Object.defineProperty(this, "dependenciesState_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: IDerivationState_.NOT_TRACKING_
        })
        Object.defineProperty(this, "diffValue_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        })
        Object.defineProperty(this, "runId_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        })
        Object.defineProperty(this, "unboundDepsCount_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        })
        //处置、安排的状态
        Object.defineProperty(this, "isDisposed_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        })
        Object.defineProperty(this, "isScheduled_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        })
        //跟踪、运行、
        Object.defineProperty(this, "isTrackPending_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        })
        Object.defineProperty(this, "isRunning_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        })
        Object.defineProperty(this, "isTracing_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: TraceMode.NONE
        })
    }
    onBecomeStale_() {
        this.schedule_()
    }
    schedule_() {
        if (!this.isScheduled_) {
            this.isScheduled_ = true
            globalState.pendingReactions.push(this)
            //统一了运行的方法：runReactions 而不是单独调用`runReaction_`
            runReactions()
        }
    }
    isScheduled() {
        return this.isScheduled_
    }
    /**
     * internal, use schedule() if you intend to kick off a reaction
     */
    runReaction_() {
        if (!this.isDisposed_) {
            startBatch()
            //还原isScheduled_ 属性
            this.isScheduled_ = false
            const prev = globalState.trackingContext
            globalState.trackingContext = this
            if (shouldCompute(this)) {
                this.isTrackPending_ = true
                try {
                    this.onInvalidate_()
                    if (__DEV__ && this.isTrackPending_ && isSpyEnabled()) {
                        // onInvalidate didn't trigger track right away..
                        spyReport({
                            name: this.name_,
                            type: "scheduled-reaction"
                        })
                    }
                } catch (e) {
                    this.reportExceptionInDerivation_(e)
                }
            }
            globalState.trackingContext = prev
            endBatch()
        }
    }
    track(fn) {
        if (this.isDisposed_) {
            return
            // console.warn("Reaction already disposed") // Note: Not a warning / error in mobx 4 either
        }
        startBatch()
        const notify = isSpyEnabled()
        let startTime
        if (__DEV__ && notify) {
            startTime = Date.now()
            spyReportStart({
                name: this.name_,
                type: "reaction"
            })
        }
        //记录运行
        this.isRunning_ = true
        const prevReaction = globalState.trackingContext // reactions could create reactions...
        globalState.trackingContext = this
        const result = trackDerivedFunction(this, fn, undefined)
        globalState.trackingContext = prevReaction
        this.isRunning_ = false
        this.isTrackPending_ = false
        if (this.isDisposed_) {
            // disposed during last run. Clean up everything that was bound after the dispose call.
            clearObserving(this)
        }
        if (isCaughtException(result)) this.reportExceptionInDerivation_(result.cause)
        if (__DEV__ && notify) {
            spyReportEnd({
                time: Date.now() - startTime
            })
        }
        endBatch()
    }
    reportExceptionInDerivation_(error) {
        if (this.errorHandler_) {
            this.errorHandler_(error, this)
            return
        }
        if (globalState.disableErrorBoundaries) throw error
        const message = __DEV__
            ? `[mobx] Encountered an uncaught exception that was thrown by a reaction or observer component, in: '${this}'`
            : `[mobx] uncaught error in '${this}'`
        if (!globalState.suppressReactionErrors) {
            console.error(message, error);
            /** If debugging brought you here, please, read the above message :-). Tnx! */
        }
        else if (__DEV__)
            console.warn(`[mobx] (error in reaction '${this.name_}' suppressed, fix error of causing action below)`); // prettier-ignore
        if (__DEV__ && isSpyEnabled()) {
            spyReport({
                type: "error",
                name: this.name_,
                message,
                error: "" + error
            })
        }
        globalState.globalReactionErrorHandlers.forEach(f => f(error, this))
    }
    dispose() {
        if (!this.isDisposed_) {
            this.isDisposed_ = true
            if (!this.isRunning_) {
                // if disposed while running, clean up later. Maybe not optimal, but rare case
                startBatch()
                clearObserving(this)
                endBatch()
            }
        }
    }
    //用bind包装一层，加上类型后和`$mobx`属性后返回
    getDisposer_() {
        const r = this.dispose.bind(this)
        r[$mobx] = this
        return r
    }
    //拿到名字信息
    toString() {
        return `Reaction[${this.name_}]`
    }
    trace(enterBreakPoint = false) {
        trace(this, enterBreakPoint)
    }
}
/**
 * Magic number alert!
 * Defines within how many times a reaction is allowed to re-trigger itself
 * until it is assumed that this is gonna be a never ending loop...
 */
const MAX_REACTION_ITERATIONS = 100
let reactionScheduler = f => f()
function runReactions() {
    // Trampolining, if runReactions are already running, new reactions will be picked up
    if (globalState.inBatch > 0 || globalState.isRunningReactions) return
    reactionScheduler(runReactionsHelper)
}
//运行 reaction的帮助函数
function runReactionsHelper() {
    //记录运行状态
    globalState.isRunningReactions = true
    const allReactions = globalState.pendingReactions
    let iterations = 0
    // While running reactions, new reactions might be triggered.
    // Hence we work with two variables and check whether
    // we converge to no remaining reactions after a while.
    while (allReactions.length > 0) {
        //设定最大的迭代数量：100
        if (++iterations === MAX_REACTION_ITERATIONS) {
            console.error(
                __DEV__
                    ? `Reaction doesn't converge to a stable state after ${MAX_REACTION_ITERATIONS} iterations.` +
                          ` Probably there is a cycle in the reactive function: ${allReactions[0]}`
                    : `[mobx] cycle in reaction: ${allReactions[0]}`
            )
            allReactions.splice(0) // clear reactions
        }
        //取出所有的 reactions，分别迭代并执行它们
        let remainingReactions = allReactions.splice(0)
        for (let i = 0, l = remainingReactions.length; i < l; i++)
            remainingReactions[i].runReaction_()
    }
    globalState.isRunningReactions = false
}
const isReaction = createInstanceofPredicate("Reaction", Reaction)

function isSpyEnabled() {
    return __DEV__ && !!globalState.spyListeners.length
}
function spyReport(event) {
    if (!__DEV__) return // dead code elimination can do the rest
    if (!globalState.spyListeners.length) return
    const listeners = globalState.spyListeners
    for (let i = 0, l = listeners.length; i < l; i++) listeners[i](event)
}
function spyReportStart(event) {
    if (!__DEV__) return
    const change = Object.assign(Object.assign({}, event), { spyReportStart: true })
    spyReport(change)
}
const END_EVENT = { type: "report-end", spyReportEnd: true }
function spyReportEnd(change) {
    if (!__DEV__) return
    if (change)
        spyReport(
            Object.assign(Object.assign({}, change), { type: "report-end", spyReportEnd: true })
        )
    else spyReport(END_EVENT)
}
function spy(listener) {
    if (!__DEV__) {
        console.warn(`[mobx.spy] Is a no-op in production builds`)
        return function () {}
    } else {
        //推入监听器 global.spyListeners.push(listener)
        globalState.spyListeners.push(listener)
        //return unbind method: make sure will only filter at most once
        return once(() => {
            globalState.spyListeners = globalState.spyListeners.filter(l => l !== listener)
        })
    }
}

const ACTION = "action"
const ACTION_BOUND = "action.bound"
const AUTOACTION = "autoAction"
const AUTOACTION_BOUND = "autoAction.bound"
const DEFAULT_ACTION_NAME = "<unnamed action>"
const actionAnnotation = createActionAnnotation(ACTION)
const actionBoundAnnotation = createActionAnnotation(ACTION_BOUND, {
    bound: true
})
const autoActionAnnotation = createActionAnnotation(AUTOACTION, {
    autoAction: true
})
const autoActionBoundAnnotation = createActionAnnotation(AUTOACTION_BOUND, {
    autoAction: true,
    bound: true
})
function createActionFactory(autoAction) {
    const res = function action(arg1, arg2) {
        // action(fn() {})
        if (isFunction(arg1))
            return createAction(arg1.name || DEFAULT_ACTION_NAME, arg1, autoAction)
        // action("name", fn() {})
        if (isFunction(arg2)) return createAction(arg1, arg2, autoAction)
        // @action
        if (isStringish(arg2)) {
            return storeAnnotation(arg1, arg2, autoAction ? autoActionAnnotation : actionAnnotation)
        }
        // action("name") & @action("name")
        if (isStringish(arg1)) {
            return createDecoratorAnnotation(
                createActionAnnotation(autoAction ? AUTOACTION : ACTION, {
                    name: arg1,
                    autoAction
                })
            )
        }
        if (__DEV__) die("Invalid arguments for `action`")
    }
    return res
}
const action = createActionFactory(false)
Object.assign(action, actionAnnotation)
const autoAction = createActionFactory(true)
Object.assign(autoAction, autoActionAnnotation)
action.bound = createDecoratorAnnotation(actionBoundAnnotation)
autoAction.bound = createDecoratorAnnotation(autoActionBoundAnnotation)
function isAction(thing) {
    return isFunction(thing) && thing.isMobxAction === true
}

/**
 * Creates a named reactive view and keeps it alive, so that the view is always
 * updated if one of the dependencies changes, even when the view is not further used by something else.
 * @param view The reactive view
 * @returns disposer function, which can be used to stop the view from being updated in the future.
 */
function autorun(view, opts = EMPTY_OBJECT) {
    var _a
    if (__DEV__) {
        if (!isFunction(view)) die("Autorun expects a function as first argument")
        if (isAction(view)) die("Autorun does not accept actions since actions are untrackable")
    }
    const name =
        (_a = opts === null || opts === void 0 ? void 0 : opts.name) !== null && _a !== void 0
            ? _a
            : __DEV__
            ? view.name || "Autorun@" + getNextId()
            : "Autorun"
    const runSync = !opts.scheduler && !opts.delay
    let reaction
    if (runSync) {
        // normal autorun
        reaction = new Reaction(
            name,
            function () {
                this.track(reactionRunner)
            },
            opts.onError,
            opts.requiresObservable
        )
    } else {
        const scheduler = createSchedulerFromOptions(opts)
        // debounced autorun
        let isScheduled = false
        reaction = new Reaction(
            name,
            () => {
                if (!isScheduled) {
                    isScheduled = true
                    scheduler(() => {
                        isScheduled = false
                        if (!reaction.isDisposed_) reaction.track(reactionRunner)
                    })
                }
            },
            opts.onError,
            opts.requiresObservable
        )
    }
    function reactionRunner() {
        view(reaction)
    }
    reaction.schedule_()
    return reaction.getDisposer_()
}
const run = f => f()
function createSchedulerFromOptions(opts) {
    return opts.scheduler ? opts.scheduler : opts.delay ? f => setTimeout(f, opts.delay) : run
}

const ON_BECOME_OBSERVED = "onBO"
const ON_BECOME_UNOBSERVED = "onBUO"
function onBecomeObserved(thing, arg2, arg3) {
    return interceptHook(ON_BECOME_OBSERVED, thing, arg2, arg3)
}
function onBecomeUnobserved(thing, arg2, arg3) {
    return interceptHook(ON_BECOME_UNOBSERVED, thing, arg2, arg3)
}
function interceptHook(hook, thing, arg2, arg3) {
    const atom = typeof arg3 === "function" ? getAtom(thing, arg2) : getAtom(thing)
    const cb = isFunction(arg3) ? arg3 : arg2
    const listenersKey = `${hook}L`
    if (atom[listenersKey]) {
        atom[listenersKey].add(cb)
    } else {
        atom[listenersKey] = new Set([cb])
    }
    return function () {
        const hookListeners = atom[listenersKey]
        if (hookListeners) {
            hookListeners.delete(cb)
            if (hookListeners.size === 0) {
                delete atom[listenersKey]
            }
        }
    }
}

function extendObservable(target, properties, annotations, options) {
    if (__DEV__) {
        if (arguments.length > 4) die("'extendObservable' expected 2-4 arguments")
        if (typeof target !== "object")
            die("'extendObservable' expects an object as first argument")
        if (isObservableMap(target))
            die("'extendObservable' should not be used on maps, use map.merge instead")
        if (!isPlainObject(properties))
            die(`'extendObservable' only accepts plain objects as second argument`)
        if (isObservable(properties) || isObservable(annotations))
            die(`Extending an object with another observable (object) is not supported`)
    }
    // Pull descriptors first, so we don't have to deal with props added by administration ($mobx)
    const descriptors = getOwnPropertyDescriptors(properties)
    const adm = asObservableObject(target, options)[$mobx]
    startBatch()
    try {
        ownKeys(descriptors).forEach(key => {
            adm.extend_(
                key,
                descriptors[key],
                // must pass "undefined" for { key: undefined }
                !annotations ? true : key in annotations ? annotations[key] : true
            )
        })
    } finally {
        endBatch()
    }
    return target
}

function getDependencyTree(thing, property) {
    return nodeToDependencyTree(getAtom(thing, property))
}
function nodeToDependencyTree(node) {
    const result = {
        name: node.name_
    }
    if (node.observing_ && node.observing_.length > 0)
        result.dependencies = unique(node.observing_).map(nodeToDependencyTree)
    return result
}
function unique(list) {
    return Array.from(new Set(list))
}

let generatorId = 0
function FlowCancellationError() {
    this.message = "FLOW_CANCELLED"
}
FlowCancellationError.prototype = Object.create(Error.prototype)
const flowAnnotation = createFlowAnnotation("flow")
const flowBoundAnnotation = createFlowAnnotation("flow.bound", { bound: true })
const flow = Object.assign(function flow(arg1, arg2) {
    // @flow
    if (isStringish(arg2)) {
        return storeAnnotation(arg1, arg2, flowAnnotation)
    }
    // flow(fn)
    if (__DEV__ && arguments.length !== 1)
        die(`Flow expects single argument with generator function`)
    const generator = arg1
    const name = generator.name || "<unnamed flow>"
    // Implementation based on https://github.com/tj/co/blob/master/index.js
    const res = function () {
        const ctx = this
        const args = arguments
        const runId = ++generatorId
        const gen = action(`${name} - runid: ${runId} - init`, generator).apply(ctx, args)
        let rejector
        let pendingPromise = undefined
        const promise = new Promise(function (resolve, reject) {
            let stepId = 0
            rejector = reject
            function onFulfilled(res) {
                pendingPromise = undefined
                let ret
                try {
                    ret = action(`${name} - runid: ${runId} - yield ${stepId++}`, gen.next).call(
                        gen,
                        res
                    )
                } catch (e) {
                    return reject(e)
                }
                next(ret)
            }
            function onRejected(err) {
                pendingPromise = undefined
                let ret
                try {
                    ret = action(`${name} - runid: ${runId} - yield ${stepId++}`, gen.throw).call(
                        gen,
                        err
                    )
                } catch (e) {
                    return reject(e)
                }
                next(ret)
            }
            function next(ret) {
                if (isFunction(ret === null || ret === void 0 ? void 0 : ret.then)) {
                    // an async iterator
                    ret.then(next, reject)
                    return
                }
                if (ret.done) return resolve(ret.value)
                pendingPromise = Promise.resolve(ret.value)
                return pendingPromise.then(onFulfilled, onRejected)
            }
            onFulfilled(undefined) // kick off the process
        })
        promise.cancel = action(`${name} - runid: ${runId} - cancel`, function () {
            try {
                if (pendingPromise) cancelPromise(pendingPromise)
                // Finally block can return (or yield) stuff..
                const res = gen.return(undefined)
                // eat anything that promise would do, it's cancelled!
                const yieldedPromise = Promise.resolve(res.value)
                yieldedPromise.then(noop, noop)
                cancelPromise(yieldedPromise) // maybe it can be cancelled :)
                // reject our original promise
                rejector(new FlowCancellationError())
            } catch (e) {
                rejector(e) // there could be a throwing finally block
            }
        })
        return promise
    }
    res.isMobXFlow = true
    return res
}, flowAnnotation)
flow.bound = createDecoratorAnnotation(flowBoundAnnotation)
function cancelPromise(promise) {
    if (isFunction(promise.cancel)) promise.cancel()
}
function isFlow(fn) {
    return (fn === null || fn === void 0 ? void 0 : fn.isMobXFlow) === true
}

function _isObservable(value, property) {
    if (!value) return false
    if (property !== undefined) {
        if (__DEV__ && (isObservableMap(value) || isObservableArray(value)))
            return die(
                "isObservable(object, propertyName) is not supported for arrays and maps. Use map.has or array.length instead."
            )
        if (isObservableObject(value)) {
            return value[$mobx].values_.has(property)
        }
        return false
    }
    // For first check, see #701
    return (
        isObservableObject(value) ||
        !!value[$mobx] ||
        isAtom(value) ||
        isReaction(value) ||
        isComputedValue(value)
    )
}
function isObservable(value) {
    if (__DEV__ && arguments.length !== 1)
        die(
            `isObservable expects only 1 argument. Use isObservableProp to inspect the observability of a property`
        )
    return _isObservable(value)
}

function trace(...args) {
    if (!__DEV__) die(`trace() is not available in production builds`)
    let enterBreakPoint = false
    if (typeof args[args.length - 1] === "boolean") enterBreakPoint = args.pop()
    const derivation = getAtomFromArgs(args)
    if (!derivation) {
        return die(
            `'trace(break?)' can only be used inside a tracked computed value or a Reaction. Consider passing in the computed value or reaction explicitly`
        )
    }
    if (derivation.isTracing_ === TraceMode.NONE) {
        console.log(`[mobx.trace] '${derivation.name_}' tracing enabled`)
    }
    derivation.isTracing_ = enterBreakPoint ? TraceMode.BREAK : TraceMode.LOG
}
function getAtomFromArgs(args) {
    switch (args.length) {
        case 0:
            return globalState.trackingDerivation
        case 1:
            return getAtom(args[0])
        case 2:
            return getAtom(args[0], args[1])
    }
}

/**
 * During a transaction no views are updated until the end of the transaction.
 * The transaction will be run synchronously nonetheless.
 *
 * @param action a function that updates some reactive state
 * @returns any value that was returned by the 'action' parameter.
 */
function transaction(action, thisArg = undefined) {
    startBatch()
    try {
        return action.apply(thisArg)
    } finally {
        endBatch()
    }
}

function getAdm(target) {
    return target[$mobx]
}
// Optimization: we don't need the intermediate objects and could have a completely custom administration for DynamicObjects,
// and skip either the internal values map, or the base object with its property descriptors!
const objectProxyTraps = {
    has(target, name) {
        if (__DEV__ && globalState.trackingDerivation)
            warnAboutProxyRequirement(
                "detect new properties using the 'in' operator. Use 'has' from 'mobx' instead."
            )
        return getAdm(target).has_(name)
    },
    get(target, name) {
        return getAdm(target).get_(name)
    },
    set(target, name, value) {
        var _a
        if (!isStringish(name)) return false
        if (__DEV__ && !getAdm(target).values_.has(name)) {
            warnAboutProxyRequirement(
                "add a new observable property through direct assignment. Use 'set' from 'mobx' instead."
            )
        }
        // null (intercepted) -> true (success)
        return (_a = getAdm(target).set_(name, value, true)) !== null && _a !== void 0 ? _a : true
    },
    deleteProperty(target, name) {
        var _a
        if (__DEV__) {
            warnAboutProxyRequirement(
                "delete properties from an observable object. Use 'remove' from 'mobx' instead."
            )
        }
        if (!isStringish(name)) return false
        // null (intercepted) -> true (success)
        return (_a = getAdm(target).delete_(name, true)) !== null && _a !== void 0 ? _a : true
    },
    defineProperty(target, name, descriptor) {
        var _a
        if (__DEV__) {
            warnAboutProxyRequirement(
                "define property on an observable object. Use 'defineProperty' from 'mobx' instead."
            )
        }
        // null (intercepted) -> true (success)
        return (_a = getAdm(target).defineProperty_(name, descriptor)) !== null && _a !== void 0
            ? _a
            : true
    },
    ownKeys(target) {
        if (__DEV__ && globalState.trackingDerivation)
            warnAboutProxyRequirement(
                "iterate keys to detect added / removed properties. Use 'keys' from 'mobx' instead."
            )
        return getAdm(target).ownKeys_()
    },
    preventExtensions(target) {
        die(13)
    }
}
function asDynamicObservableObject(target, options) {
    var _a
    var _b
    assertProxies()
    target = asObservableObject(target, options)
    return (_a = (_b = target[$mobx]).proxy_) !== null && _a !== void 0
        ? _a
        : (_b.proxy_ = new Proxy(target, objectProxyTraps))
}

function hasInterceptors(interceptable) {
    return interceptable.interceptors_ !== undefined && interceptable.interceptors_.length > 0
}
function registerInterceptor(interceptable, handler) {
    const interceptors = interceptable.interceptors_ || (interceptable.interceptors_ = [])
    interceptors.push(handler)
    return once(() => {
        const idx = interceptors.indexOf(handler)
        if (idx !== -1) interceptors.splice(idx, 1)
    })
}
function interceptChange(interceptable, change) {
    const prevU = untrackedStart()
    try {
        // Interceptor can modify the array, copy it to avoid concurrent modification, see #1950
        const interceptors = [...(interceptable.interceptors_ || [])]
        for (let i = 0, l = interceptors.length; i < l; i++) {
            change = interceptors[i](change)
            if (change && !change.type) die(14)
            if (!change) break
        }
        return change
    } finally {
        untrackedEnd(prevU)
    }
}

function hasListeners(listenable) {
    return listenable.changeListeners_ !== undefined && listenable.changeListeners_.length > 0
}
function registerListener(listenable, handler) {
    const listeners = listenable.changeListeners_ || (listenable.changeListeners_ = [])
    listeners.push(handler)
    return once(() => {
        const idx = listeners.indexOf(handler)
        if (idx !== -1) listeners.splice(idx, 1)
    })
}
function notifyListeners(listenable, change) {
    const prevU = untrackedStart()
    let listeners = listenable.changeListeners_
    if (!listeners) return
    listeners = listeners.slice()
    for (let i = 0, l = listeners.length; i < l; i++) {
        listeners[i](change)
    }
    untrackedEnd(prevU)
}

function makeObservable(target, annotations, options) {
    const adm = asObservableObject(target, options)[$mobx]
    startBatch()
    try {
        if (__DEV__ && annotations && target[storedAnnotationsSymbol]) {
            die(
                `makeObservable second arg must be nullish when using decorators. Mixing @decorator syntax with annotations is not supported.`
            )
        }
        // Default to decorators
        annotations !== null && annotations !== void 0
            ? annotations
            : (annotations = collectStoredAnnotations(target))
        // Annotate
        ownKeys(annotations).forEach(key => adm.make_(key, annotations[key]))
    } finally {
        endBatch()
    }
    return target
}

const SPLICE = "splice"
const UPDATE = "update"
const MAX_SPLICE_SIZE = 10000 // See e.g. https://github.com/mobxjs/mobx/issues/859
const arrayTraps = {
    get(target, name) {
        const adm = target[$mobx]
        if (name === $mobx) return adm
        if (name === "length") return adm.getArrayLength_()
        if (typeof name === "string" && !isNaN(name)) {
            return adm.get_(parseInt(name))
        }
        if (hasProp(arrayExtensions, name)) {
            return arrayExtensions[name]
        }
        return target[name]
    },
    set(target, name, value) {
        const adm = target[$mobx]
        if (name === "length") {
            adm.setArrayLength_(value)
        }
        if (typeof name === "symbol" || isNaN(name)) {
            target[name] = value
        } else {
            // numeric string
            adm.set_(parseInt(name), value)
        }
        return true
    },
    preventExtensions() {
        die(15)
    }
}
class ObservableArrayAdministration {
    constructor(
        name = __DEV__ ? "ObservableArray@" + getNextId() : "ObservableArray",
        enhancer,
        owned_,
        legacyMode_
    ) {
        Object.defineProperty(this, "owned_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: owned_
        })
        Object.defineProperty(this, "legacyMode_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: legacyMode_
        })
        Object.defineProperty(this, "atom_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "values_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        }) // this is the prop that gets proxied, so can't replace it!
        Object.defineProperty(this, "interceptors_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "changeListeners_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "enhancer_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "dehancer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "proxy_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "lastKnownLength_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        })
        this.atom_ = new Atom(name)
        this.enhancer_ = (newV, oldV) =>
            enhancer(newV, oldV, __DEV__ ? name + "[..]" : "ObservableArray[..]")
    }
    dehanceValue_(value) {
        if (this.dehancer !== undefined) return this.dehancer(value)
        return value
    }
    dehanceValues_(values) {
        if (this.dehancer !== undefined && values.length > 0) return values.map(this.dehancer)
        return values
    }
    intercept_(handler) {
        return registerInterceptor(this, handler)
    }
    observe_(listener, fireImmediately = false) {
        if (fireImmediately) {
            listener({
                observableKind: "array",
                object: this.proxy_,
                debugObjectName: this.atom_.name_,
                type: "splice",
                index: 0,
                added: this.values_.slice(),
                addedCount: this.values_.length,
                removed: [],
                removedCount: 0
            })
        }
        return registerListener(this, listener)
    }
    getArrayLength_() {
        this.atom_.reportObserved()
        return this.values_.length
    }
    setArrayLength_(newLength) {
        if (typeof newLength !== "number" || isNaN(newLength) || newLength < 0)
            die("Out of range: " + newLength)
        let currentLength = this.values_.length
        if (newLength === currentLength) return
        else if (newLength > currentLength) {
            const newItems = new Array(newLength - currentLength)
            for (let i = 0; i < newLength - currentLength; i++) newItems[i] = undefined // No Array.fill everywhere...
            this.spliceWithArray_(currentLength, 0, newItems)
        } else this.spliceWithArray_(newLength, currentLength - newLength)
    }
    updateArrayLength_(oldLength, delta) {
        if (oldLength !== this.lastKnownLength_) die(16)
        this.lastKnownLength_ += delta
        if (this.legacyMode_ && delta > 0) reserveArrayBuffer(oldLength + delta + 1)
    }
    spliceWithArray_(index, deleteCount, newItems) {
        checkIfStateModificationsAreAllowed(this.atom_)
        const length = this.values_.length
        if (index === undefined) index = 0
        else if (index > length) index = length
        else if (index < 0) index = Math.max(0, length + index)
        if (arguments.length === 1) deleteCount = length - index
        else if (deleteCount === undefined || deleteCount === null) deleteCount = 0
        else deleteCount = Math.max(0, Math.min(deleteCount, length - index))
        if (newItems === undefined) newItems = EMPTY_ARRAY
        if (hasInterceptors(this)) {
            const change = interceptChange(this, {
                object: this.proxy_,
                type: SPLICE,
                index,
                removedCount: deleteCount,
                added: newItems
            })
            if (!change) return EMPTY_ARRAY
            deleteCount = change.removedCount
            newItems = change.added
        }
        newItems =
            newItems.length === 0 ? newItems : newItems.map(v => this.enhancer_(v, undefined))
        if (this.legacyMode_ || __DEV__) {
            const lengthDelta = newItems.length - deleteCount
            this.updateArrayLength_(length, lengthDelta) // checks if internal array wasn't modified
        }
        const res = this.spliceItemsIntoValues_(index, deleteCount, newItems)
        if (deleteCount !== 0 || newItems.length !== 0)
            this.notifyArraySplice_(index, newItems, res)
        return this.dehanceValues_(res)
    }
    spliceItemsIntoValues_(index, deleteCount, newItems) {
        if (newItems.length < MAX_SPLICE_SIZE) {
            return this.values_.splice(index, deleteCount, ...newItems)
        } else {
            // The items removed by the splice
            const res = this.values_.slice(index, index + deleteCount)
            // The items that that should remain at the end of the array
            let oldItems = this.values_.slice(index + deleteCount)
            // New length is the previous length + addition count - deletion count
            this.values_.length += newItems.length - deleteCount
            for (let i = 0; i < newItems.length; i++) this.values_[index + i] = newItems[i]
            for (let i = 0; i < oldItems.length; i++)
                this.values_[index + newItems.length + i] = oldItems[i]
            return res
        }
    }
    notifyArrayChildUpdate_(index, newValue, oldValue) {
        const notifySpy = !this.owned_ && isSpyEnabled()
        const notify = hasListeners(this)
        const change =
            notify || notifySpy
                ? {
                      observableKind: "array",
                      object: this.proxy_,
                      type: UPDATE,
                      debugObjectName: this.atom_.name_,
                      index,
                      newValue,
                      oldValue
                  }
                : null
        // The reason why this is on right hand side here (and not above), is this way the uglifier will drop it, but it won't
        // cause any runtime overhead in development mode without NODE_ENV set, unless spying is enabled
        if (__DEV__ && notifySpy) spyReportStart(change)
        this.atom_.reportChanged()
        if (notify) notifyListeners(this, change)
        if (__DEV__ && notifySpy) spyReportEnd()
    }
    notifyArraySplice_(index, added, removed) {
        const notifySpy = !this.owned_ && isSpyEnabled()
        const notify = hasListeners(this)
        const change =
            notify || notifySpy
                ? {
                      observableKind: "array",
                      object: this.proxy_,
                      debugObjectName: this.atom_.name_,
                      type: SPLICE,
                      index,
                      removed,
                      added,
                      removedCount: removed.length,
                      addedCount: added.length
                  }
                : null
        if (__DEV__ && notifySpy) spyReportStart(change)
        this.atom_.reportChanged()
        // conform: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/observe
        if (notify) notifyListeners(this, change)
        if (__DEV__ && notifySpy) spyReportEnd()
    }
    get_(index) {
        if (index < this.values_.length) {
            this.atom_.reportObserved()
            return this.dehanceValue_(this.values_[index])
        }
        console.warn(
            __DEV__
                ? `[mobx] Out of bounds read: ${index}`
                : `[mobx.array] Attempt to read an array index (${index}) that is out of bounds (${this.values_.length}). Please check length first. Out of bound indices will not be tracked by MobX`
        )
    }
    set_(index, newValue) {
        const values = this.values_
        if (index < values.length) {
            // update at index in range
            checkIfStateModificationsAreAllowed(this.atom_)
            const oldValue = values[index]
            if (hasInterceptors(this)) {
                const change = interceptChange(this, {
                    type: UPDATE,
                    object: this.proxy_,
                    index,
                    newValue
                })
                if (!change) return
                newValue = change.newValue
            }
            newValue = this.enhancer_(newValue, oldValue)
            const changed = newValue !== oldValue
            if (changed) {
                values[index] = newValue
                this.notifyArrayChildUpdate_(index, newValue, oldValue)
            }
        } else if (index === values.length) {
            // add a new item
            this.spliceWithArray_(index, 0, [newValue])
        } else {
            // out of bounds
            die(17, index, values.length)
        }
    }
}
function createObservableArray(
    initialValues,
    enhancer,
    name = __DEV__ ? "ObservableArray@" + getNextId() : "ObservableArray",
    owned = false
) {
    assertProxies()
    const adm = new ObservableArrayAdministration(name, enhancer, owned, false)
    addHiddenFinalProp(adm.values_, $mobx, adm)
    const proxy = new Proxy(adm.values_, arrayTraps)
    adm.proxy_ = proxy
    if (initialValues && initialValues.length) {
        const prev = allowStateChangesStart(true)
        adm.spliceWithArray_(0, 0, initialValues)
        allowStateChangesEnd(prev)
    }
    return proxy
}
// eslint-disable-next-line
var arrayExtensions = {
    clear() {
        return this.splice(0)
    },
    replace(newItems) {
        const adm = this[$mobx]
        return adm.spliceWithArray_(0, adm.values_.length, newItems)
    },
    // Used by JSON.stringify
    toJSON() {
        return this.slice()
    },
    /*
     * functions that do alter the internal structure of the array, (based on lib.es6.d.ts)
     * since these functions alter the inner structure of the array, the have side effects.
     * Because the have side effects, they should not be used in computed function,
     * and for that reason the do not call dependencyState.notifyObserved
     */
    splice(index, deleteCount, ...newItems) {
        const adm = this[$mobx]
        switch (arguments.length) {
            case 0:
                return []
            case 1:
                return adm.spliceWithArray_(index)
            case 2:
                return adm.spliceWithArray_(index, deleteCount)
        }
        return adm.spliceWithArray_(index, deleteCount, newItems)
    },
    spliceWithArray(index, deleteCount, newItems) {
        return this[$mobx].spliceWithArray_(index, deleteCount, newItems)
    },
    push(...items) {
        const adm = this[$mobx]
        adm.spliceWithArray_(adm.values_.length, 0, items)
        return adm.values_.length
    },
    pop() {
        return this.splice(Math.max(this[$mobx].values_.length - 1, 0), 1)[0]
    },
    shift() {
        return this.splice(0, 1)[0]
    },
    unshift(...items) {
        const adm = this[$mobx]
        adm.spliceWithArray_(0, 0, items)
        return adm.values_.length
    },
    reverse() {
        // reverse by default mutates in place before returning the result
        // which makes it both a 'derivation' and a 'mutation'.
        if (globalState.trackingDerivation) {
            die(37, "reverse")
        }
        this.replace(this.slice().reverse())
        return this
    },
    sort() {
        // sort by default mutates in place before returning the result
        // which goes against all good practices. Let's not change the array in place!
        if (globalState.trackingDerivation) {
            die(37, "sort")
        }
        const copy = this.slice()
        copy.sort.apply(copy, arguments)
        this.replace(copy)
        return this
    },
    remove(value) {
        const adm = this[$mobx]
        const idx = adm.dehanceValues_(adm.values_).indexOf(value)
        if (idx > -1) {
            this.splice(idx, 1)
            return true
        }
        return false
    }
}
/**
 * Wrap function from prototype
 * Without this, everything works as well, but this works
 * faster as everything works on unproxied values
 */
addArrayExtension("concat", simpleFunc)
addArrayExtension("flat", simpleFunc)
addArrayExtension("includes", simpleFunc)
addArrayExtension("indexOf", simpleFunc)
addArrayExtension("join", simpleFunc)
addArrayExtension("lastIndexOf", simpleFunc)
addArrayExtension("slice", simpleFunc)
addArrayExtension("toString", simpleFunc)
addArrayExtension("toLocaleString", simpleFunc)
// map
addArrayExtension("every", mapLikeFunc)
addArrayExtension("filter", mapLikeFunc)
addArrayExtension("find", mapLikeFunc)
addArrayExtension("findIndex", mapLikeFunc)
addArrayExtension("flatMap", mapLikeFunc)
addArrayExtension("forEach", mapLikeFunc)
addArrayExtension("map", mapLikeFunc)
addArrayExtension("some", mapLikeFunc)
// reduce
addArrayExtension("reduce", reduceLikeFunc)
addArrayExtension("reduceRight", reduceLikeFunc)
function addArrayExtension(funcName, funcFactory) {
    if (typeof Array.prototype[funcName] === "function") {
        arrayExtensions[funcName] = funcFactory(funcName)
    }
}
// Report and delegate to dehanced array
function simpleFunc(funcName) {
    return function () {
        const adm = this[$mobx]
        adm.atom_.reportObserved()
        const dehancedValues = adm.dehanceValues_(adm.values_)
        return dehancedValues[funcName].apply(dehancedValues, arguments)
    }
}
// Make sure callbacks recieve correct array arg #2326
function mapLikeFunc(funcName) {
    return function (callback, thisArg) {
        const adm = this[$mobx]
        adm.atom_.reportObserved()
        const dehancedValues = adm.dehanceValues_(adm.values_)
        return dehancedValues[funcName]((element, index) => {
            return callback.call(thisArg, element, index, this)
        })
    }
}
// Make sure callbacks recieve correct array arg #2326
function reduceLikeFunc(funcName) {
    return function () {
        const adm = this[$mobx]
        adm.atom_.reportObserved()
        const dehancedValues = adm.dehanceValues_(adm.values_)
        // #2432 - reduce behavior depends on arguments.length
        const callback = arguments[0]
        arguments[0] = (accumulator, currentValue, index) => {
            return callback(accumulator, currentValue, index, this)
        }
        return dehancedValues[funcName].apply(dehancedValues, arguments)
    }
}
const isObservableArrayAdministration = createInstanceofPredicate(
    "ObservableArrayAdministration",
    ObservableArrayAdministration
)
function isObservableArray(thing) {
    return isObject(thing) && isObservableArrayAdministration(thing[$mobx])
}

var _a$1
const ObservableMapMarker = {}
const ADD = "add"
const DELETE = "delete"
// just extend Map? See also https://gist.github.com/nestharus/13b4d74f2ef4a2f4357dbd3fc23c1e54
// But: https://github.com/mobxjs/mobx/issues/1556
class ObservableMap {
    constructor(
        initialData,
        enhancer_ = deepEnhancer,
        name_ = __DEV__ ? "ObservableMap@" + getNextId() : "ObservableMap"
    ) {
        Object.defineProperty(this, "enhancer_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: enhancer_
        })
        Object.defineProperty(this, "name_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: name_
        })
        Object.defineProperty(this, _a$1, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ObservableMapMarker
        })
        Object.defineProperty(this, "data_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "hasMap_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }) // hasMap, not hashMap >-).
        Object.defineProperty(this, "keysAtom_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "interceptors_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "changeListeners_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "dehancer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        if (!isFunction(Map)) {
            die(18)
        }
        this.keysAtom_ = createAtom(__DEV__ ? `${this.name_}.keys()` : "ObservableMap.keys()")
        this.data_ = new Map()
        this.hasMap_ = new Map()
        this.merge(initialData)
    }
    has_(key) {
        return this.data_.has(key)
    }
    has(key) {
        if (!globalState.trackingDerivation) return this.has_(key)
        let entry = this.hasMap_.get(key)
        if (!entry) {
            const newEntry = (entry = new ObservableValue(
                this.has_(key),
                referenceEnhancer,
                __DEV__ ? `${this.name_}.${stringifyKey(key)}?` : "ObservableMap.key?",
                false
            ))
            this.hasMap_.set(key, newEntry)
            onBecomeUnobserved(newEntry, () => this.hasMap_.delete(key))
        }
        return entry.get()
    }
    set(key, value) {
        const hasKey = this.has_(key)
        if (hasInterceptors(this)) {
            const change = interceptChange(this, {
                type: hasKey ? UPDATE : ADD,
                object: this,
                newValue: value,
                name: key
            })
            if (!change) return this
            value = change.newValue
        }
        if (hasKey) {
            this.updateValue_(key, value)
        } else {
            this.addValue_(key, value)
        }
        return this
    }
    delete(key) {
        checkIfStateModificationsAreAllowed(this.keysAtom_)
        if (hasInterceptors(this)) {
            const change = interceptChange(this, {
                type: DELETE,
                object: this,
                name: key
            })
            if (!change) return false
        }
        if (this.has_(key)) {
            const notifySpy = isSpyEnabled()
            const notify = hasListeners(this)
            const change =
                notify || notifySpy
                    ? {
                          observableKind: "map",
                          debugObjectName: this.name_,
                          type: DELETE,
                          object: this,
                          oldValue: this.data_.get(key).value_,
                          name: key
                      }
                    : null
            if (__DEV__ && notifySpy) spyReportStart(change)
            transaction(() => {
                var _b
                this.keysAtom_.reportChanged()
                ;(_b = this.hasMap_.get(key)) === null || _b === void 0
                    ? void 0
                    : _b.setNewValue_(false)
                const observable = this.data_.get(key)
                observable.setNewValue_(undefined)
                this.data_.delete(key)
            })
            if (notify) notifyListeners(this, change)
            if (__DEV__ && notifySpy) spyReportEnd()
            return true
        }
        return false
    }
    updateValue_(key, newValue) {
        const observable = this.data_.get(key)
        newValue = observable.prepareNewValue_(newValue)
        if (newValue !== globalState.UNCHANGED) {
            const notifySpy = isSpyEnabled()
            const notify = hasListeners(this)
            const change =
                notify || notifySpy
                    ? {
                          observableKind: "map",
                          debugObjectName: this.name_,
                          type: UPDATE,
                          object: this,
                          oldValue: observable.value_,
                          name: key,
                          newValue
                      }
                    : null
            if (__DEV__ && notifySpy) spyReportStart(change)
            observable.setNewValue_(newValue)
            if (notify) notifyListeners(this, change)
            if (__DEV__ && notifySpy) spyReportEnd()
        }
    }
    addValue_(key, newValue) {
        checkIfStateModificationsAreAllowed(this.keysAtom_)
        transaction(() => {
            var _b
            const observable = new ObservableValue(
                newValue,
                this.enhancer_,
                __DEV__ ? `${this.name_}.${stringifyKey(key)}` : "ObservableMap.key",
                false
            )
            this.data_.set(key, observable)
            newValue = observable.value_ // value might have been changed
            ;(_b = this.hasMap_.get(key)) === null || _b === void 0 ? void 0 : _b.setNewValue_(true)
            this.keysAtom_.reportChanged()
        })
        const notifySpy = isSpyEnabled()
        const notify = hasListeners(this)
        const change =
            notify || notifySpy
                ? {
                      observableKind: "map",
                      debugObjectName: this.name_,
                      type: ADD,
                      object: this,
                      name: key,
                      newValue
                  }
                : null
        if (__DEV__ && notifySpy) spyReportStart(change)
        if (notify) notifyListeners(this, change)
        if (__DEV__ && notifySpy) spyReportEnd()
    }
    get(key) {
        if (this.has(key)) return this.dehanceValue_(this.data_.get(key).get())
        return this.dehanceValue_(undefined)
    }
    dehanceValue_(value) {
        if (this.dehancer !== undefined) {
            return this.dehancer(value)
        }
        return value
    }
    keys() {
        this.keysAtom_.reportObserved()
        return this.data_.keys()
    }
    values() {
        const self = this
        const keys = this.keys()
        return makeIterable({
            next() {
                const { done, value } = keys.next()
                return {
                    done,
                    value: done ? undefined : self.get(value)
                }
            }
        })
    }
    entries() {
        const self = this
        const keys = this.keys()
        return makeIterable({
            next() {
                const { done, value } = keys.next()
                return {
                    done,
                    value: done ? undefined : [value, self.get(value)]
                }
            }
        })
    }
    [((_a$1 = $mobx), Symbol.iterator)]() {
        return this.entries()
    }
    forEach(callback, thisArg) {
        for (const [key, value] of this) callback.call(thisArg, value, key, this)
    }
    /** Merge another object into this object, returns this. */
    merge(other) {
        if (isObservableMap(other)) {
            other = new Map(other)
        }
        transaction(() => {
            if (isPlainObject(other))
                getPlainObjectKeys(other).forEach(key => this.set(key, other[key]))
            else if (Array.isArray(other)) other.forEach(([key, value]) => this.set(key, value))
            else if (isES6Map(other)) {
                if (other.constructor !== Map) die(19, other)
                other.forEach((value, key) => this.set(key, value))
            } else if (other !== null && other !== undefined) die(20, other)
        })
        return this
    }
    clear() {
        transaction(() => {
            untracked(() => {
                for (const key of this.keys()) this.delete(key)
            })
        })
    }
    replace(values) {
        // Implementation requirements:
        // - respect ordering of replacement map
        // - allow interceptors to run and potentially prevent individual operations
        // - don't recreate observables that already exist in original map (so we don't destroy existing subscriptions)
        // - don't _keysAtom.reportChanged if the keys of resulting map are indentical (order matters!)
        // - note that result map may differ from replacement map due to the interceptors
        transaction(() => {
            // Convert to map so we can do quick key lookups
            const replacementMap = convertToMap(values)
            const orderedData = new Map()
            // Used for optimization
            let keysReportChangedCalled = false
            // Delete keys that don't exist in replacement map
            // if the key deletion is prevented by interceptor
            // add entry at the beginning of the result map
            for (const key of this.data_.keys()) {
                // Concurrently iterating/deleting keys
                // iterator should handle this correctly
                if (!replacementMap.has(key)) {
                    const deleted = this.delete(key)
                    // Was the key removed?
                    if (deleted) {
                        // _keysAtom.reportChanged() was already called
                        keysReportChangedCalled = true
                    } else {
                        // Delete prevented by interceptor
                        const value = this.data_.get(key)
                        orderedData.set(key, value)
                    }
                }
            }
            // Merge entries
            for (const [key, value] of replacementMap.entries()) {
                // We will want to know whether a new key is added
                const keyExisted = this.data_.has(key)
                // Add or update value
                this.set(key, value)
                // The addition could have been prevent by interceptor
                if (this.data_.has(key)) {
                    // The update could have been prevented by interceptor
                    // and also we want to preserve existing values
                    // so use value from _data map (instead of replacement map)
                    const value = this.data_.get(key)
                    orderedData.set(key, value)
                    // Was a new key added?
                    if (!keyExisted) {
                        // _keysAtom.reportChanged() was already called
                        keysReportChangedCalled = true
                    }
                }
            }
            // Check for possible key order change
            if (!keysReportChangedCalled) {
                if (this.data_.size !== orderedData.size) {
                    // If size differs, keys are definitely modified
                    this.keysAtom_.reportChanged()
                } else {
                    const iter1 = this.data_.keys()
                    const iter2 = orderedData.keys()
                    let next1 = iter1.next()
                    let next2 = iter2.next()
                    while (!next1.done) {
                        if (next1.value !== next2.value) {
                            this.keysAtom_.reportChanged()
                            break
                        }
                        next1 = iter1.next()
                        next2 = iter2.next()
                    }
                }
            }
            // Use correctly ordered map
            this.data_ = orderedData
        })
        return this
    }
    get size() {
        this.keysAtom_.reportObserved()
        return this.data_.size
    }
    toString() {
        return "[object ObservableMap]"
    }
    toJSON() {
        return Array.from(this)
    }
    get [Symbol.toStringTag]() {
        return "Map"
    }
    /**
     * Observes this object. Triggers for the events 'add', 'update' and 'delete'.
     * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/observe
     * for callback details
     */
    observe_(listener, fireImmediately) {
        if (__DEV__ && fireImmediately === true)
            die("`observe` doesn't support fireImmediately=true in combination with maps.")
        return registerListener(this, listener)
    }
    intercept_(handler) {
        return registerInterceptor(this, handler)
    }
}
// eslint-disable-next-line
var isObservableMap = createInstanceofPredicate("ObservableMap", ObservableMap)
function convertToMap(dataStructure) {
    if (isES6Map(dataStructure) || isObservableMap(dataStructure)) {
        return dataStructure
    } else if (Array.isArray(dataStructure)) {
        return new Map(dataStructure)
    } else if (isPlainObject(dataStructure)) {
        const map = new Map()
        for (const key in dataStructure) {
            map.set(key, dataStructure[key])
        }
        return map
    } else {
        return die(21, dataStructure)
    }
}

var _a
const ObservableSetMarker = {}
class ObservableSet {
    constructor(
        initialData,
        enhancer = deepEnhancer,
        name_ = __DEV__ ? "ObservableSet@" + getNextId() : "ObservableSet"
    ) {
        Object.defineProperty(this, "name_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: name_
        })
        Object.defineProperty(this, _a, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ObservableSetMarker
        })
        Object.defineProperty(this, "data_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Set()
        })
        Object.defineProperty(this, "atom_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "changeListeners_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "interceptors_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "dehancer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "enhancer_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        if (!isFunction(Set)) {
            die(22)
        }
        this.atom_ = createAtom(this.name_)
        this.enhancer_ = (newV, oldV) => enhancer(newV, oldV, name_)
        if (initialData) {
            this.replace(initialData)
        }
    }
    dehanceValue_(value) {
        if (this.dehancer !== undefined) {
            return this.dehancer(value)
        }
        return value
    }
    clear() {
        transaction(() => {
            untracked(() => {
                for (const value of this.data_.values()) this.delete(value)
            })
        })
    }
    forEach(callbackFn, thisArg) {
        for (const value of this) {
            callbackFn.call(thisArg, value, value, this)
        }
    }
    get size() {
        this.atom_.reportObserved()
        return this.data_.size
    }
    add(value) {
        checkIfStateModificationsAreAllowed(this.atom_)
        if (hasInterceptors(this)) {
            const change = interceptChange(this, {
                type: ADD,
                object: this,
                newValue: value
            })
            if (!change) return this
            // ideally, value = change.value would be done here, so that values can be
            // changed by interceptor. Same applies for other Set and Map api's.
        }
        if (!this.has(value)) {
            transaction(() => {
                this.data_.add(this.enhancer_(value, undefined))
                this.atom_.reportChanged()
            })
            const notifySpy = __DEV__ && isSpyEnabled()
            const notify = hasListeners(this)
            const change =
                notify || notifySpy
                    ? {
                          observableKind: "set",
                          debugObjectName: this.name_,
                          type: ADD,
                          object: this,
                          newValue: value
                      }
                    : null
            if (notifySpy && __DEV__) spyReportStart(change)
            if (notify) notifyListeners(this, change)
            if (notifySpy && __DEV__) spyReportEnd()
        }
        return this
    }
    delete(value) {
        if (hasInterceptors(this)) {
            const change = interceptChange(this, {
                type: DELETE,
                object: this,
                oldValue: value
            })
            if (!change) return false
        }
        if (this.has(value)) {
            const notifySpy = __DEV__ && isSpyEnabled()
            const notify = hasListeners(this)
            const change =
                notify || notifySpy
                    ? {
                          observableKind: "set",
                          debugObjectName: this.name_,
                          type: DELETE,
                          object: this,
                          oldValue: value
                      }
                    : null
            if (notifySpy && __DEV__) spyReportStart(change)
            transaction(() => {
                this.atom_.reportChanged()
                this.data_.delete(value)
            })
            if (notify) notifyListeners(this, change)
            if (notifySpy && __DEV__) spyReportEnd()
            return true
        }
        return false
    }
    has(value) {
        this.atom_.reportObserved()
        return this.data_.has(this.dehanceValue_(value))
    }
    entries() {
        let nextIndex = 0
        const keys = Array.from(this.keys())
        const values = Array.from(this.values())
        return makeIterable({
            next() {
                const index = nextIndex
                nextIndex += 1
                return index < values.length
                    ? { value: [keys[index], values[index]], done: false }
                    : { done: true }
            }
        })
    }
    keys() {
        return this.values()
    }
    values() {
        this.atom_.reportObserved()
        const self = this
        let nextIndex = 0
        const observableValues = Array.from(this.data_.values())
        return makeIterable({
            next() {
                return nextIndex < observableValues.length
                    ? { value: self.dehanceValue_(observableValues[nextIndex++]), done: false }
                    : { done: true }
            }
        })
    }
    replace(other) {
        if (isObservableSet(other)) {
            other = new Set(other)
        }
        transaction(() => {
            if (Array.isArray(other)) {
                this.clear()
                other.forEach(value => this.add(value))
            } else if (isES6Set(other)) {
                this.clear()
                other.forEach(value => this.add(value))
            } else if (other !== null && other !== undefined) {
                die("Cannot initialize set from " + other)
            }
        })
        return this
    }
    observe_(listener, fireImmediately) {
        // ... 'fireImmediately' could also be true?
        if (__DEV__ && fireImmediately === true)
            die("`observe` doesn't support fireImmediately=true in combination with sets.")
        return registerListener(this, listener)
    }
    intercept_(handler) {
        return registerInterceptor(this, handler)
    }
    toJSON() {
        return Array.from(this)
    }
    toString() {
        return "[object ObservableSet]"
    }
    [((_a = $mobx), Symbol.iterator)]() {
        return this.values()
    }
    get [Symbol.toStringTag]() {
        return "Set"
    }
}
// eslint-disable-next-line
var isObservableSet = createInstanceofPredicate("ObservableSet", ObservableSet)

const descriptorCache = Object.create(null)
const REMOVE = "remove"
class ObservableObjectAdministration {
    constructor(
        target_,
        values_ = new Map(),
        name_,
        // Used anytime annotation is not explicitely provided
        defaultAnnotation_ = autoAnnotation
    ) {
        Object.defineProperty(this, "target_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: target_
        })
        Object.defineProperty(this, "values_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: values_
        })
        Object.defineProperty(this, "name_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: name_
        })
        Object.defineProperty(this, "defaultAnnotation_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: defaultAnnotation_
        })
        Object.defineProperty(this, "keysAtom_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "changeListeners_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "interceptors_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "proxy_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "isPlainObject_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "appliedAnnotations_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "pendingKeys_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        this.keysAtom_ = new Atom(__DEV__ ? `${this.name_}.keys` : "ObservableObject.keys")
        // Optimization: we use this frequently
        this.isPlainObject_ = isPlainObject(this.target_)
        if (__DEV__ && !isAnnotation(this.defaultAnnotation_)) {
            die(`defaultAnnotation must be valid annotation`)
        }
        if (__DEV__) {
            // Prepare structure for tracking which fields were already annotated
            this.appliedAnnotations_ = {}
        }
    }
    getObservablePropValue_(key) {
        return this.values_.get(key).get()
    }
    setObservablePropValue_(key, newValue) {
        const observable = this.values_.get(key)
        if (observable instanceof ComputedValue) {
            observable.set(newValue)
            return true
        }
        // intercept
        if (hasInterceptors(this)) {
            const change = interceptChange(this, {
                type: UPDATE,
                object: this.proxy_ || this.target_,
                name: key,
                newValue
            })
            if (!change) return null
            newValue = change.newValue
        }
        newValue = observable.prepareNewValue_(newValue)
        // notify spy & observers
        if (newValue !== globalState.UNCHANGED) {
            const notify = hasListeners(this)
            const notifySpy = __DEV__ && isSpyEnabled()
            const change =
                notify || notifySpy
                    ? {
                          type: UPDATE,
                          observableKind: "object",
                          debugObjectName: this.name_,
                          object: this.proxy_ || this.target_,
                          oldValue: observable.value_,
                          name: key,
                          newValue
                      }
                    : null
            if (__DEV__ && notifySpy) spyReportStart(change)
            observable.setNewValue_(newValue)
            if (notify) notifyListeners(this, change)
            if (__DEV__ && notifySpy) spyReportEnd()
        }
        return true
    }
    get_(key) {
        if (globalState.trackingDerivation && !hasProp(this.target_, key)) {
            // Key doesn't exist yet, subscribe for it in case it's added later
            this.has_(key)
        }
        return this.target_[key]
    }
    /**
     * @param {PropertyKey} key
     * @param {any} value
     * @param {Annotation|boolean} annotation true - use default annotation, false - copy as is
     * @param {boolean} proxyTrap whether it's called from proxy trap
     * @returns {boolean|null} true on success, false on failure (proxyTrap + non-configurable), null when cancelled by interceptor
     */
    set_(key, value, proxyTrap = false) {
        // Don't use .has(key) - we care about own
        if (hasProp(this.target_, key)) {
            // Existing prop
            if (this.values_.has(key)) {
                // Observable (can be intercepted)
                return this.setObservablePropValue_(key, value)
            } else if (proxyTrap) {
                // Non-observable - proxy
                return Reflect.set(this.target_, key, value)
            } else {
                // Non-observable
                this.target_[key] = value
                return true
            }
        } else {
            // New prop
            return this.extend_(
                key,
                { value, enumerable: true, writable: true, configurable: true },
                this.defaultAnnotation_,
                proxyTrap
            )
        }
    }
    // Trap for "in"
    has_(key) {
        if (!globalState.trackingDerivation) {
            // Skip key subscription outside derivation
            return key in this.target_
        }
        this.pendingKeys_ || (this.pendingKeys_ = new Map())
        let entry = this.pendingKeys_.get(key)
        if (!entry) {
            entry = new ObservableValue(
                key in this.target_,
                referenceEnhancer,
                __DEV__ ? `${this.name_}.${stringifyKey(key)}?` : "ObservableObject.key?",
                false
            )
            this.pendingKeys_.set(key, entry)
        }
        return entry.get()
    }
    /**
     * @param {PropertyKey} key
     * @param {Annotation|boolean} annotation true - use default annotation, false - ignore prop
     */
    make_(key, annotation) {
        var _a
        if (annotation === true) {
            annotation = this.defaultAnnotation_
        }
        if (annotation === false) {
            return
        }
        assertAnnotable(this, annotation, key)
        if (!(key in this.target_)) {
            // Throw on missing key, except for decorators:
            // Decorator annotations are collected from whole prototype chain.
            // When called from super() some props may not exist yet.
            // However we don't have to worry about missing prop,
            // because the decorator must have been applied to something.
            if (
                (_a = this.target_[storedAnnotationsSymbol]) === null || _a === void 0
                    ? void 0
                    : _a[key]
            ) {
                return // will be annotated by subclass constructor
            } else {
                die(1, annotation.annotationType_, `${this.name_}.${key.toString()}`)
            }
        }
        let source = this.target_
        while (source && source !== objectPrototype) {
            const descriptor = getDescriptor(source, key)
            if (descriptor) {
                const outcome = annotation.make_(this, key, descriptor, source)
                if (outcome === 0 /* Cancel */) return
                if (outcome === 1 /* Break */) break
            }
            source = Object.getPrototypeOf(source)
        }
        recordAnnotationApplied(this, annotation, key)
    }
    /**
     * @param {PropertyKey} key
     * @param {PropertyDescriptor} descriptor
     * @param {Annotation|boolean} annotation true - use default annotation, false - copy as is
     * @param {boolean} proxyTrap whether it's called from proxy trap
     * @returns {boolean|null} true on success, false on failure (proxyTrap + non-configurable), null when cancelled by interceptor
     */
    extend_(key, descriptor, annotation, proxyTrap = false) {
        if (annotation === true) {
            annotation = this.defaultAnnotation_
        }
        if (annotation === false) {
            return this.defineProperty_(key, descriptor, proxyTrap)
        }
        assertAnnotable(this, annotation, key)
        const outcome = annotation.extend_(this, key, descriptor, proxyTrap)
        if (outcome) {
            recordAnnotationApplied(this, annotation, key)
        }
        return outcome
    }
    /**
     * @param {PropertyKey} key
     * @param {PropertyDescriptor} descriptor
     * @param {boolean} proxyTrap whether it's called from proxy trap
     * @returns {boolean|null} true on success, false on failure (proxyTrap + non-configurable), null when cancelled by interceptor
     */
    defineProperty_(key, descriptor, proxyTrap = false) {
        try {
            startBatch()
            // Delete
            const deleteOutcome = this.delete_(key)
            if (!deleteOutcome) {
                // Failure or intercepted
                return deleteOutcome
            }
            // ADD interceptor
            if (hasInterceptors(this)) {
                const change = interceptChange(this, {
                    object: this.proxy_ || this.target_,
                    name: key,
                    type: ADD,
                    newValue: descriptor.value
                })
                if (!change) return null
                const { newValue } = change
                if (descriptor.value !== newValue) {
                    descriptor = Object.assign(Object.assign({}, descriptor), { value: newValue })
                }
            }
            // Define
            if (proxyTrap) {
                if (!Reflect.defineProperty(this.target_, key, descriptor)) {
                    return false
                }
            } else {
                defineProperty(this.target_, key, descriptor)
            }
            // Notify
            this.notifyPropertyAddition_(key, descriptor.value)
        } finally {
            endBatch()
        }
        return true
    }
    // If original descriptor becomes relevant, move this to annotation directly
    defineObservableProperty_(key, value, enhancer, proxyTrap = false) {
        try {
            startBatch()
            // Delete
            const deleteOutcome = this.delete_(key)
            if (!deleteOutcome) {
                // Failure or intercepted
                return deleteOutcome
            }
            // ADD interceptor
            if (hasInterceptors(this)) {
                const change = interceptChange(this, {
                    object: this.proxy_ || this.target_,
                    name: key,
                    type: ADD,
                    newValue: value
                })
                if (!change) return null
                value = change.newValue
            }
            const cachedDescriptor = getCachedObservablePropDescriptor(key)
            const descriptor = {
                configurable: globalState.safeDescriptors ? this.isPlainObject_ : true,
                enumerable: true,
                get: cachedDescriptor.get,
                set: cachedDescriptor.set
            }
            // Define
            if (proxyTrap) {
                if (!Reflect.defineProperty(this.target_, key, descriptor)) {
                    return false
                }
            } else {
                defineProperty(this.target_, key, descriptor)
            }
            const observable = new ObservableValue(
                value,
                enhancer,
                __DEV__ ? `${this.name_}.${key.toString()}` : "ObservableObject.key",
                false
            )
            this.values_.set(key, observable)
            // Notify (value possibly changed by ObservableValue)
            this.notifyPropertyAddition_(key, observable.value_)
        } finally {
            endBatch()
        }
        return true
    }
    // If original descriptor becomes relevant, move this to annotation directly
    defineComputedProperty_(key, options, proxyTrap = false) {
        try {
            startBatch()
            // Delete
            const deleteOutcome = this.delete_(key)
            if (!deleteOutcome) {
                // Failure or intercepted
                return deleteOutcome
            }
            // ADD interceptor
            if (hasInterceptors(this)) {
                const change = interceptChange(this, {
                    object: this.proxy_ || this.target_,
                    name: key,
                    type: ADD,
                    newValue: undefined
                })
                if (!change) return null
            }
            options.name ||
                (options.name = __DEV__
                    ? `${this.name_}.${key.toString()}`
                    : "ObservableObject.key")
            options.context = this.proxy_ || this.target_
            const cachedDescriptor = getCachedObservablePropDescriptor(key)
            const descriptor = {
                configurable: globalState.safeDescriptors ? this.isPlainObject_ : true,
                enumerable: false,
                get: cachedDescriptor.get,
                set: cachedDescriptor.set
            }
            // Define
            if (proxyTrap) {
                if (!Reflect.defineProperty(this.target_, key, descriptor)) {
                    return false
                }
            } else {
                defineProperty(this.target_, key, descriptor)
            }
            this.values_.set(key, new ComputedValue(options))
            // Notify
            this.notifyPropertyAddition_(key, undefined)
        } finally {
            endBatch()
        }
        return true
    }
    /**
     * @param {PropertyKey} key
     * @param {PropertyDescriptor} descriptor
     * @param {boolean} proxyTrap whether it's called from proxy trap
     * @returns {boolean|null} true on success, false on failure (proxyTrap + non-configurable), null when cancelled by interceptor
     */
    delete_(key, proxyTrap = false) {
        var _a, _b, _c
        // No such prop
        if (!hasProp(this.target_, key)) {
            return true
        }
        // Intercept
        if (hasInterceptors(this)) {
            const change = interceptChange(this, {
                object: this.proxy_ || this.target_,
                name: key,
                type: REMOVE
            })
            // Cancelled
            if (!change) return null
        }
        // Delete
        try {
            startBatch()
            const notify = hasListeners(this)
            const notifySpy = __DEV__ && isSpyEnabled()
            const observable = this.values_.get(key)
            // Value needed for spies/listeners
            let value = undefined
            // Optimization: don't pull the value unless we will need it
            if (!observable && (notify || notifySpy)) {
                value =
                    (_a = getDescriptor(this.target_, key)) === null || _a === void 0
                        ? void 0
                        : _a.value
            }
            // delete prop (do first, may fail)
            if (proxyTrap) {
                if (!Reflect.deleteProperty(this.target_, key)) {
                    return false
                }
            } else {
                delete this.target_[key]
            }
            // Allow re-annotating this field
            if (__DEV__) {
                delete this.appliedAnnotations_[key]
            }
            // Clear observable
            if (observable) {
                this.values_.delete(key)
                // for computed, value is undefined
                if (observable instanceof ObservableValue) {
                    value = observable.value_
                }
                // Notify: autorun(() => obj[key]), see #1796
                propagateChanged(observable)
            }
            // Notify "keys/entries/values" observers
            this.keysAtom_.reportChanged()
            // Notify "has" observers
            // "in" as it may still exist in proto
            ;(_c = (_b = this.pendingKeys_) === null || _b === void 0 ? void 0 : _b.get(key)) ===
                null || _c === void 0
                ? void 0
                : _c.set(key in this.target_)
            // Notify spies/listeners
            if (notify || notifySpy) {
                const change = {
                    type: REMOVE,
                    observableKind: "object",
                    object: this.proxy_ || this.target_,
                    debugObjectName: this.name_,
                    oldValue: value,
                    name: key
                }
                if (__DEV__ && notifySpy) spyReportStart(change)
                if (notify) notifyListeners(this, change)
                if (__DEV__ && notifySpy) spyReportEnd()
            }
        } finally {
            endBatch()
        }
        return true
    }
    /**
     * Observes this object. Triggers for the events 'add', 'update' and 'delete'.
     * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/observe
     * for callback details
     */
    observe_(callback, fireImmediately) {
        if (__DEV__ && fireImmediately === true)
            die("`observe` doesn't support the fire immediately property for observable objects.")
        return registerListener(this, callback)
    }
    intercept_(handler) {
        return registerInterceptor(this, handler)
    }
    notifyPropertyAddition_(key, value) {
        var _a, _b
        const notify = hasListeners(this)
        const notifySpy = __DEV__ && isSpyEnabled()
        if (notify || notifySpy) {
            const change =
                notify || notifySpy
                    ? {
                          type: ADD,
                          observableKind: "object",
                          debugObjectName: this.name_,
                          object: this.proxy_ || this.target_,
                          name: key,
                          newValue: value
                      }
                    : null
            if (__DEV__ && notifySpy) spyReportStart(change)
            if (notify) notifyListeners(this, change)
            if (__DEV__ && notifySpy) spyReportEnd()
        }
        ;(_b = (_a = this.pendingKeys_) === null || _a === void 0 ? void 0 : _a.get(key)) ===
            null || _b === void 0
            ? void 0
            : _b.set(true)
        // Notify "keys/entries/values" observers
        this.keysAtom_.reportChanged()
    }
    ownKeys_() {
        this.keysAtom_.reportObserved()
        return ownKeys(this.target_)
    }
    keys_() {
        // Returns enumerable && own, but unfortunately keysAtom will report on ANY key change.
        // There is no way to distinguish between Object.keys(object) and Reflect.ownKeys(object) - both are handled by ownKeys trap.
        // We can either over-report in Object.keys(object) or under-report in Reflect.ownKeys(object)
        // We choose to over-report in Object.keys(object), because:
        // - typically it's used with simple data objects
        // - when symbolic/non-enumerable keys are relevant Reflect.ownKeys works as expected
        this.keysAtom_.reportObserved()
        return Object.keys(this.target_)
    }
}
function asObservableObject(target, options) {
    var _a
    if (__DEV__ && options && isObservableObject(target)) {
        die(`Options can't be provided for already observable objects.`)
    }
    if (hasProp(target, $mobx)) {
        if (__DEV__ && !(getAdministration(target) instanceof ObservableObjectAdministration)) {
            die(
                `Cannot convert '${getDebugName(target)}' into observable object:` +
                    `\nThe target is already observable of different type.` +
                    `\nExtending builtins is not supported.`
            )
        }
        return target
    }
    if (__DEV__ && !Object.isExtensible(target))
        die("Cannot make the designated object observable; it is not extensible")
    const name =
        (_a = options === null || options === void 0 ? void 0 : options.name) !== null &&
        _a !== void 0
            ? _a
            : __DEV__
            ? `${
                  isPlainObject(target) ? "ObservableObject" : target.constructor.name
              }@${getNextId()}`
            : "ObservableObject"
    //创建一个可观察对象的管理站并作为 $mobx 添加到target
    const adm = new ObservableObjectAdministration(
        target,
        new Map(),
        String(name),
        getAnnotationFromOptions(options)
    )
    addHiddenProp(target, $mobx, adm)
    return target
}
const isObservableObjectAdministration = createInstanceofPredicate(
    "ObservableObjectAdministration",
    ObservableObjectAdministration
)
function getCachedObservablePropDescriptor(key) {
    return (
        descriptorCache[key] ||
        (descriptorCache[key] = {
            get() {
                return this[$mobx].getObservablePropValue_(key)
            },
            set(value) {
                return this[$mobx].setObservablePropValue_(key, value)
            }
        })
    )
}
function isObservableObject(thing) {
    if (isObject(thing)) {
        return isObservableObjectAdministration(thing[$mobx])
    }
    return false
}
function recordAnnotationApplied(adm, annotation, key) {
    var _a
    if (__DEV__) {
        adm.appliedAnnotations_[key] = annotation
    }
    // Remove applied decorator annotation so we don't try to apply it again in subclass constructor
    ;(_a = adm.target_[storedAnnotationsSymbol]) === null || _a === void 0 ? true : delete _a[key]
}
function assertAnnotable(adm, annotation, key) {
    // Valid annotation
    if (__DEV__ && !isAnnotation(annotation)) {
        die(`Cannot annotate '${adm.name_}.${key.toString()}': Invalid annotation.`)
    }
    /*
    // Configurable, not sealed, not frozen
    // Possibly not needed, just a little better error then the one thrown by engine.
    // Cases where this would be useful the most (subclass field initializer) are not interceptable by this.
    if (__DEV__) {
        const configurable = getDescriptor(adm.target_, key)?.configurable
        const frozen = Object.isFrozen(adm.target_)
        const sealed = Object.isSealed(adm.target_)
        if (!configurable || frozen || sealed) {
            const fieldName = `${adm.name_}.${key.toString()}`
            const requestedAnnotationType = annotation.annotationType_
            let error = `Cannot apply '${requestedAnnotationType}' to '${fieldName}':`
            if (frozen) {
                error += `\nObject is frozen.`
            }
            if (sealed) {
                error += `\nObject is sealed.`
            }
            if (!configurable) {
                error += `\nproperty is not configurable.`
                // Mention only if caused by us to avoid confusion
                if (hasProp(adm.appliedAnnotations!, key)) {
                    error += `\nTo prevent accidental re-definition of a field by a subclass, `
                    error += `all annotated fields of non-plain objects (classes) are not configurable.`
                }
            }
            die(error)
        }
    }
    */
    // Not annotated
    if (__DEV__ && !isOverride(annotation) && hasProp(adm.appliedAnnotations_, key)) {
        const fieldName = `${adm.name_}.${key.toString()}`
        const currentAnnotationType = adm.appliedAnnotations_[key].annotationType_
        const requestedAnnotationType = annotation.annotationType_
        die(
            `Cannot apply '${requestedAnnotationType}' to '${fieldName}':` +
                `\nThe field is already annotated with '${currentAnnotationType}'.` +
                `\nRe-annotating fields is not allowed.` +
                `\nUse 'override' annotation for methods overriden by subclass.`
        )
    }
}

/**
 * This array buffer contains two lists of properties, so that all arrays
 * can recycle their property definitions, which significantly improves performance of creating
 * properties on the fly.
 */
let OBSERVABLE_ARRAY_BUFFER_SIZE = 0
// Typescript workaround to make sure ObservableArray extends Array
class StubArray {}
function inherit(ctor, proto) {
    if (Object.setPrototypeOf) {
        Object.setPrototypeOf(ctor.prototype, proto)
    } else if (ctor.prototype.__proto__ !== undefined) {
        ctor.prototype.__proto__ = proto
    } else {
        ctor.prototype = proto
    }
}
inherit(StubArray, Array.prototype)
// Weex proto freeze protection was here,
// but it is unclear why the hack is need as MobX never changed the prototype
// anyway, so removed it in V6
class LegacyObservableArray extends StubArray {
    constructor(
        initialValues,
        enhancer,
        name = __DEV__ ? "ObservableArray@" + getNextId() : "ObservableArray",
        owned = false
    ) {
        super()
        const adm = new ObservableArrayAdministration(name, enhancer, owned, true)
        adm.proxy_ = this
        addHiddenFinalProp(this, $mobx, adm)
        if (initialValues && initialValues.length) {
            const prev = allowStateChangesStart(true)
            // @ts-ignore
            this.spliceWithArray(0, 0, initialValues)
            allowStateChangesEnd(prev)
        }
    }
    concat(...arrays) {
        this[$mobx].atom_.reportObserved()
        return Array.prototype.concat.apply(
            this.slice(),
            //@ts-ignore
            arrays.map(a => (isObservableArray(a) ? a.slice() : a))
        )
    }
    get length() {
        return this[$mobx].getArrayLength_()
    }
    set length(newLength) {
        this[$mobx].setArrayLength_(newLength)
    }
    get [Symbol.toStringTag]() {
        return "Array"
    }
    [Symbol.iterator]() {
        const self = this
        let nextIndex = 0
        return makeIterable({
            next() {
                // @ts-ignore
                return nextIndex < self.length
                    ? { value: self[nextIndex++], done: false }
                    : { done: true, value: undefined }
            }
        })
    }
}
Object.entries(arrayExtensions).forEach(([prop, fn]) => {
    if (prop !== "concat") addHiddenProp(LegacyObservableArray.prototype, prop, fn)
})
function createArrayEntryDescriptor(index) {
    return {
        enumerable: false,
        configurable: true,
        get: function () {
            return this[$mobx].get_(index)
        },
        set: function (value) {
            this[$mobx].set_(index, value)
        }
    }
}
function createArrayBufferItem(index) {
    defineProperty(LegacyObservableArray.prototype, "" + index, createArrayEntryDescriptor(index))
}
function reserveArrayBuffer(max) {
    if (max > OBSERVABLE_ARRAY_BUFFER_SIZE) {
        for (let index = OBSERVABLE_ARRAY_BUFFER_SIZE; index < max + 100; index++)
            createArrayBufferItem(index)
        OBSERVABLE_ARRAY_BUFFER_SIZE = max
    }
}
reserveArrayBuffer(1000)
function createLegacyArray(initialValues, enhancer, name) {
    return new LegacyObservableArray(initialValues, enhancer, name)
}

function getAtom(thing, property) {
    if (typeof thing === "object" && thing !== null) {
        if (isObservableArray(thing)) {
            if (property !== undefined) die(23)
            return thing[$mobx].atom_
        }
        if (isObservableSet(thing)) {
            return thing[$mobx]
        }
        if (isObservableMap(thing)) {
            if (property === undefined) return thing.keysAtom_
            const observable = thing.data_.get(property) || thing.hasMap_.get(property)
            if (!observable) die(25, property, getDebugName(thing))
            return observable
        }
        if (property && !thing[$mobx]) thing[property] // See #1072
        if (isObservableObject(thing)) {
            if (!property) return die(26)
            const observable = thing[$mobx].values_.get(property)
            if (!observable) die(27, property, getDebugName(thing))
            return observable
        }
        if (isAtom(thing) || isComputedValue(thing) || isReaction(thing)) {
            return thing
        }
    } else if (isFunction(thing)) {
        if (isReaction(thing[$mobx])) {
            // disposer function
            return thing[$mobx]
        }
    }
    die(28)
}
function getAdministration(thing, property) {
    if (!thing) die(29)
    if (property !== undefined) return getAdministration(getAtom(thing, property))
    if (isAtom(thing) || isComputedValue(thing) || isReaction(thing)) return thing
    if (isObservableMap(thing) || isObservableSet(thing)) return thing
    if (thing[$mobx]) return thing[$mobx]
    die(24, thing)
}
//取出对象（thing）的名字
function getDebugName(thing, property) {
    let named
    if (property !== undefined) {
        named = getAtom(thing, property)
    } else if (isAction(thing)) {
        return thing.name
    } else if (isObservableObject(thing) || isObservableMap(thing) || isObservableSet(thing)) {
        named = getAdministration(thing)
    } else {
        // valid for arrays as well
        named = getAtom(thing)
    }
    return named.name_
}

const toString = objectPrototype.toString
function deepEqual(a, b, depth = -1) {
    return eq(a, b, depth)
}
// Copied from https://github.com/jashkenas/underscore/blob/5c237a7c682fb68fd5378203f0bf22dce1624854/underscore.js#L1186-L1289
// Internal recursive comparison function for `isEqual`.
function eq(a, b, depth, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b
    // `null` or `undefined` only equal to itself (strict comparison).
    if (a == null || b == null) return false
    // `NaN`s are equivalent, but non-reflexive.
    if (a !== a) return b !== b
    // Exhaust primitive checks
    const type = typeof a
    if (!isFunction(type) && type !== "object" && typeof b != "object") return false
    // Compare `[[Class]]` names.
    const className = toString.call(a)
    if (className !== toString.call(b)) return false
    switch (className) {
        // Strings, numbers, regular expressions, dates, and booleans are compared by value.
        case "[object RegExp]":
        // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
        case "[object String]":
            // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
            // equivalent to `new String("5")`.
            return "" + a === "" + b
        case "[object Number]":
            // `NaN`s are equivalent, but non-reflexive.
            // Object(NaN) is equivalent to NaN.
            if (+a !== +a) return +b !== +b
            // An `egal` comparison is performed for other numeric values.
            return +a === 0 ? 1 / +a === 1 / b : +a === +b
        case "[object Date]":
        case "[object Boolean]":
            // Coerce dates and booleans to numeric primitive values. Dates are compared by their
            // millisecond representations. Note that invalid dates with millisecond representations
            // of `NaN` are not equivalent.
            return +a === +b
        case "[object Symbol]":
            return (
                typeof Symbol !== "undefined" && Symbol.valueOf.call(a) === Symbol.valueOf.call(b)
            )
        case "[object Map]":
        case "[object Set]":
            // Maps and Sets are unwrapped to arrays of entry-pairs, adding an incidental level.
            // Hide this extra level by increasing the depth.
            if (depth >= 0) {
                depth++
            }
            break
    }
    // Unwrap any wrapped objects.
    a = unwrap(a)
    b = unwrap(b)
    const areArrays = className === "[object Array]"
    if (!areArrays) {
        if (typeof a != "object" || typeof b != "object") return false
        // Objects with different constructors are not equivalent, but `Object`s or `Array`s
        // from different frames are.
        const aCtor = a.constructor,
            bCtor = b.constructor
        if (
            aCtor !== bCtor &&
            !(
                isFunction(aCtor) &&
                aCtor instanceof aCtor &&
                isFunction(bCtor) &&
                bCtor instanceof bCtor
            ) &&
            "constructor" in a &&
            "constructor" in b
        ) {
            return false
        }
    }
    if (depth === 0) {
        return false
    } else if (depth < 0) {
        depth = -1
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || []
    bStack = bStack || []
    let length = aStack.length
    while (length--) {
        // Linear search. Performance is inversely proportional to the number of
        // unique nested structures.
        if (aStack[length] === a) return bStack[length] === b
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a)
    bStack.push(b)
    // Recursively compare objects and arrays.
    if (areArrays) {
        // Compare array lengths to determine if a deep comparison is necessary.
        length = a.length
        if (length !== b.length) return false
        // Deep compare the contents, ignoring non-numeric properties.
        while (length--) {
            if (!eq(a[length], b[length], depth - 1, aStack, bStack)) return false
        }
    } else {
        // Deep compare objects.
        const keys = Object.keys(a)
        let key
        length = keys.length
        // Ensure that both objects contain the same number of properties before comparing deep equality.
        if (Object.keys(b).length !== length) return false
        while (length--) {
            // Deep compare each member
            key = keys[length]
            if (!(hasProp(b, key) && eq(a[key], b[key], depth - 1, aStack, bStack))) return false
        }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop()
    bStack.pop()
    return true
}
function unwrap(a) {
    if (isObservableArray(a)) return a.slice()
    if (isES6Map(a) || isObservableMap(a)) return Array.from(a.entries())
    if (isES6Set(a) || isObservableSet(a)) return Array.from(a.entries())
    return a
}

function makeIterable(iterator) {
    iterator[Symbol.iterator] = getSelf
    return iterator
}
function getSelf() {
    return this
}

function isAnnotation(thing) {
    return (
        // Can be function
        thing instanceof Object &&
        typeof thing.annotationType_ === "string" &&
        isFunction(thing.make_) &&
        isFunction(thing.extend_)
    )
}

/**
 * (c) Michel Weststrate 2015 - 2020
 * MIT Licensed
 *
 * Welcome to the mobx sources! To get an global overview of how MobX internally works,
 * this is a good place to start:
 * https://medium.com/@mweststrate/becoming-fully-reactive-an-in-depth-explanation-of-mobservable-55995262a254#.xvbh6qd74
 *
 * Source folders:
 * ===============
 *
 * - api/     Most of the public static methods exposed by the module can be found here.
 * - core/    Implementation of the MobX algorithm; atoms, derivations, reactions, dependency trees, optimizations. Cool stuff can be found here.
 * - types/   All the magic that is need to have observable objects, arrays and values is in this folder. Including the modifiers like `asFlat`.
 * - utils/   Utility stuff.
 *
 */
;["Symbol", "Map", "Set"].forEach(m => {
    let g = getGlobal()
    if (typeof g[m] === "undefined") {
        die(`MobX requires global '${m}' to be available or polyfilled`)
    }
})
if (typeof __MOBX_DEVTOOLS_GLOBAL_HOOK__ === "object") {
    // See: https://github.com/andykog/mobx-devtools/
    __MOBX_DEVTOOLS_GLOBAL_HOOK__.injectMobx({
        spy,
        extras: {
            getDebugName
        },
        $mobx
    })
}

class Count {
    constructor() {
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "Hello"
        })
        Object.defineProperty(this, "value", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        })
        makeObservable(this, {
            value: observable,
            increment: action
        })
        debugger
        autorun(a => console.log(a, this.value))
    }
    increment() {
        this.value++
    }
}
const count = new Count()
document.querySelector("button").onclick = () => {
    count.increment()
}
//# sourceMappingURL=bundle.js.map
