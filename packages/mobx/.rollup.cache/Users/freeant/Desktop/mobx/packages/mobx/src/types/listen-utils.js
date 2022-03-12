import { once, untrackedEnd, untrackedStart } from "../internal"
export function hasListeners(listenable) {
    return listenable.changeListeners_ !== undefined && listenable.changeListeners_.length > 0
}
export function registerListener(listenable, handler) {
    const listeners = listenable.changeListeners_ || (listenable.changeListeners_ = [])
    listeners.push(handler)
    return once(() => {
        const idx = listeners.indexOf(handler)
        if (idx !== -1) listeners.splice(idx, 1)
    })
}
export function notifyListeners(listenable, change) {
    const prevU = untrackedStart()
    let listeners = listenable.changeListeners_
    if (!listeners) return
    listeners = listeners.slice()
    for (let i = 0, l = listeners.length; i < l; i++) {
        listeners[i](change)
    }
    untrackedEnd(prevU)
}
//# sourceMappingURL=listen-utils.js.map