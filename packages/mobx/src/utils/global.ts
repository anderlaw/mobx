declare const window: any
declare const self: any

const mockGlobal = {}

/**
 * window只在有窗口的文档里存在，webworker是不存在的
 * 1。正常文档：this，globalThis,window,
 * 2. webworker: this, globalThis,self
 * 3. Node: this, global
 */
//this可以在document、webworker、node访问，但在严格模式下禁用
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
