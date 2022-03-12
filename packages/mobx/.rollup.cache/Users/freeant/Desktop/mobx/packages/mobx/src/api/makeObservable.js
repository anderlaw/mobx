import {
    $mobx,
    asObservableObject,
    endBatch,
    startBatch,
    collectStoredAnnotations,
    isPlainObject,
    isObservableObject,
    die,
    ownKeys,
    extendObservable,
    addHiddenProp,
    storedAnnotationsSymbol
} from "../internal"
export function makeObservable(target, annotations, options) {
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
// proto[keysSymbol] = new Set<PropertyKey>()
const keysSymbol = Symbol("mobx-keys")
export function makeAutoObservable(target, overrides, options) {
    if (__DEV__) {
        if (!isPlainObject(target) && !isPlainObject(Object.getPrototypeOf(target)))
            die(`'makeAutoObservable' can only be used for classes that don't have a superclass`)
        if (isObservableObject(target))
            die(`makeAutoObservable can only be used on objects not already made observable`)
    }
    // Optimization: avoid visiting protos
    // Assumes that annotation.make_/.extend_ works the same for plain objects
    if (isPlainObject(target)) {
        return extendObservable(target, target, overrides, options)
    }
    const adm = asObservableObject(target, options)[$mobx]
    // Optimization: cache keys on proto
    // Assumes makeAutoObservable can be called only once per object and can't be used in subclass
    if (!target[keysSymbol]) {
        const proto = Object.getPrototypeOf(target)
        const keys = new Set([...ownKeys(target), ...ownKeys(proto)])
        keys.delete("constructor")
        keys.delete($mobx)
        addHiddenProp(proto, keysSymbol, keys)
    }
    startBatch()
    try {
        target[keysSymbol].forEach(key =>
            adm.make_(
                key,
                // must pass "undefined" for { key: undefined }
                !overrides ? true : key in overrides ? overrides[key] : true
            )
        )
    } finally {
        endBatch()
    }
    return target
}
//# sourceMappingURL=makeObservable.js.map
