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
//# sourceMappingURL=global.js.map
