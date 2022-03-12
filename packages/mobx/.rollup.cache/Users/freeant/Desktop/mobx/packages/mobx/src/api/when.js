import { $mobx, autorun, createAction, getNextId, die, allowStateChanges } from "../internal"
export function when(predicate, arg1, arg2) {
    if (arguments.length === 1 || (arg1 && typeof arg1 === "object"))
        return whenPromise(predicate, arg1)
    return _when(predicate, arg1, arg2 || {})
}
function _when(predicate, effect, opts) {
    let timeoutHandle
    if (typeof opts.timeout === "number") {
        const error = new Error("WHEN_TIMEOUT")
        timeoutHandle = setTimeout(() => {
            if (!disposer[$mobx].isDisposed_) {
                disposer()
                if (opts.onError) opts.onError(error)
                else throw error
            }
        }, opts.timeout)
    }
    opts.name = __DEV__ ? opts.name || "When@" + getNextId() : "When"
    const effectAction = createAction(__DEV__ ? opts.name + "-effect" : "When-effect", effect)
    // eslint-disable-next-line
    var disposer = autorun(r => {
        // predicate should not change state
        let cond = allowStateChanges(false, predicate)
        if (cond) {
            r.dispose()
            if (timeoutHandle) clearTimeout(timeoutHandle)
            effectAction()
        }
    }, opts)
    return disposer
}
function whenPromise(predicate, opts) {
    if (__DEV__ && opts && opts.onError)
        return die(`the options 'onError' and 'promise' cannot be combined`)
    let cancel
    const res = new Promise((resolve, reject) => {
        let disposer = _when(
            predicate,
            resolve,
            Object.assign(Object.assign({}, opts), { onError: reject })
        )
        cancel = () => {
            disposer()
            reject(new Error("WHEN_CANCELLED"))
        }
    })
    res.cancel = cancel
    return res
}
//# sourceMappingURL=when.js.map
