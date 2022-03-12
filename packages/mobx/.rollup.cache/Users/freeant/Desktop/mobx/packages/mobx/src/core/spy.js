import { globalState, once } from "../internal"
export function isSpyEnabled() {
    return __DEV__ && !!globalState.spyListeners.length
}
export function spyReport(event) {
    if (!__DEV__) return // dead code elimination can do the rest
    if (!globalState.spyListeners.length) return
    const listeners = globalState.spyListeners
    for (let i = 0, l = listeners.length; i < l; i++) listeners[i](event)
}
export function spyReportStart(event) {
    if (!__DEV__) return
    const change = Object.assign(Object.assign({}, event), { spyReportStart: true })
    spyReport(change)
}
const END_EVENT = { type: "report-end", spyReportEnd: true }
export function spyReportEnd(change) {
    if (!__DEV__) return
    if (change)
        spyReport(
            Object.assign(Object.assign({}, change), { type: "report-end", spyReportEnd: true })
        )
    else spyReport(END_EVENT)
}
export function spy(listener) {
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
//# sourceMappingURL=spy.js.map