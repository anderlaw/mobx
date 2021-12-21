import { globalState, die } from "../internal"

// We shorten anything used > 5 times
export const assign = Object.assign
export const getDescriptor = Object.getOwnPropertyDescriptor
export const defineProperty = Object.defineProperty
export const objectPrototype = Object.prototype

//空对象、数组（冻结）
export const EMPTY_ARRAY = []
Object.freeze(EMPTY_ARRAY)

export const EMPTY_OBJECT = {}
Object.freeze(EMPTY_OBJECT)

//Lambda接口：name和匿名函数
export interface Lambda {
    //函数签名写法
    (): void
    name?: string
}

const hasProxy = typeof Proxy !== "undefined"
const plainObjectString = Object.toString()

export function assertProxies() {
    if (!hasProxy) {
        die(
            __DEV__
                ? "`Proxy` objects are not available in the current environment. Please configure MobX to enable a fallback implementation.`"
                : "Proxy not available"
        )
    }
}

/**
 * 根据`配置的代理检查`直接抛出异常
 * 不负责异常的判定
 */
export function warnAboutProxyRequirement(msg: string) {
    if (__DEV__ && globalState.verifyProxies) {
        die(
            "MobX is currently configured to be able to run in ES5 mode, but in ES5 MobX won't be able to " +
                msg
        )
    }
}

export function getNextId() {
    return ++globalState.mobxGuid
}

/**
 * Makes sure that the provided function is invoked at most once.
 */
export function once(func: Lambda): Lambda {
    let invoked = false
    return function () {
        if (invoked) return
        invoked = true
        return (func as any).apply(this, arguments)
    }
}

export const noop = () => {}

export function isFunction(fn: any): fn is Function {
    return typeof fn === "function"
}

export function isString(value: any): value is string {
    return typeof value === "string"
}

/**
 * 是否是字符化的？
 * 1。字符串
 * 2。数字
 * 3。符号
 * 都是字符化的
 */
export function isStringish(value: any): value is string | number | symbol {
    const t = typeof value
    switch (t) {
        case "string":
        case "symbol":
        case "number":
            return true
    }
    return false
}

export function isObject(value: any): value is Object {
    return value !== null && typeof value === "object"
}

/**
 * 是否是纯对象：
 * 1。原型为空
 * 2。原型是Object的实例。
 */
export function isPlainObject(value) {
    if (!isObject(value)) return false
    const proto = Object.getPrototypeOf(value)
    if (proto == null) return true
    return proto.constructor?.toString() === plainObjectString
}

//检测一个对象是否是构造函数：generator
// https://stackoverflow.com/a/37865170
export function isGenerator(obj: any): boolean {
    const constructor = obj?.constructor
    if (!constructor) return false
    if ("GeneratorFunction" === constructor.name || "GeneratorFunction" === constructor.displayName)
        return true
    return false
}

/**
 * 添加无法枚举的属性
 * 利用Object.defineProperty（隐形）
 */
export function addHiddenProp(object: any, propName: PropertyKey, value: any) {
    defineProperty(object, propName, {
        enumerable: false,
        writable: true,
        configurable: true,
        value
    })
}

/**
 * 添加无法枚举、无法修改（静态）的属性
 * 利用Object.defineProperty
 */
export function addHiddenFinalProp(object: any, propName: PropertyKey, value: any) {
    defineProperty(object, propName, {
        enumerable: false,
        writable: false,
        configurable: true,
        value
    })
}

/**
 * 创建instanceof推断
 * 没有直接通过 instanceof
 * 而是通过标记原型属性，再判断对象是否可以访问原型上的标记属性：yes表示对象是实例，否则不是
 */
export function createInstanceofPredicate<T>(
    name: string,
    //构造签名
    theClass: new (...args: any[]) => T
): (x: any) => x is T {
    const propName = "isMobX" + name
    theClass.prototype[propName] = true
    return function (x) {
        return isObject(x) && x[propName] === true
    } as any
}

export function isES6Map(thing): boolean {
    return thing instanceof Map
}

export function isES6Set(thing): thing is Set<any> {
    return thing instanceof Set
}

//记录
const hasGetOwnPropertySymbols = typeof Object.getOwnPropertySymbols !== "undefined"

/**
 * 返回普通对象所有的key，只含可枚举的部分
 * Returns the following: own enumerable keys and symbols.
 * Object.keys返回 给定对象的自身可枚举属性组成的数组(不含Symbol属性)
 */
export function getPlainObjectKeys(object) {
    const keys = Object.keys(object)
    // Not supported in IE, so there are not going to be symbol props anyway...
    if (!hasGetOwnPropertySymbols) return keys
    const symbols = Object.getOwnPropertySymbols(object)
    if (!symbols.length) return keys
    //只取那些可被枚举的属性
    return [...keys, ...symbols.filter(s => objectPrototype.propertyIsEnumerable.call(object, s))]
}

/**
 * 返回对象自身所有的属性，包含不可枚举的部分以及符号
 * 1。Object.getOwnPropertyNames:返回自身属性名数组（含不可枚举属性，不含Symbol属性）。
 * 2。Object.getOwnPropertySymbols:返回自身符号属性名数组（含不可枚举属性）
 */
export const ownKeys: (target: any) => PropertyKey[] =
    typeof Reflect !== "undefined" && Reflect.ownKeys
        ? Reflect.ownKeys
        : hasGetOwnPropertySymbols
        ? obj => Object.getOwnPropertyNames(obj).concat(Object.getOwnPropertySymbols(obj) as any)
        : /* istanbul ignore next */ Object.getOwnPropertyNames

//对字符串和符号类型的直接返回或者调用toString
export function stringifyKey(key: any): string {
    if (typeof key === "string") return key
    if (typeof key === "symbol") return key.toString()
    return new String(key).toString()
}

//借助 null+typeof 来将数据转换为原始类型
export function toPrimitive(value) {
    return value === null ? null : typeof value === "object" ? "" + value : value
}

/**
 * 判断对象自身是否拥有某个属性
 */
export function hasProp(target: Object, prop: PropertyKey): boolean {
    return objectPrototype.hasOwnProperty.call(target, prop)
}

//***IE9 支持 Object.getOwnPropertyDescriptor,IE全系不支持Object.getOwnPropertyDescriptors
// From Immer utils
export const getOwnPropertyDescriptors =
    Object.getOwnPropertyDescriptors ||
    function getOwnPropertyDescriptors(target: any) {
        // Polyfill needed for Hermes and IE, see https://github.com/facebook/hermes/issues/274
        const res: any = {}
        // Note: without polyfill for ownKeys, symbols won't be picked up
        ownKeys(target).forEach(key => {
            res[key] = getDescriptor(target, key)
        })
        return res
    }
