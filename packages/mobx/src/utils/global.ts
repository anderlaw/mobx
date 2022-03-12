//declare some global const here instead of `global.d.ts`
declare const window: any
declare const self: any

const mockGlobal = {}

//条件判断返回全局对象
export function getGlobal() {
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
