var _a
import {
    $mobx,
    ObservableValue,
    checkIfStateModificationsAreAllowed,
    createAtom,
    createInstanceofPredicate,
    deepEnhancer,
    getNextId,
    getPlainObjectKeys,
    hasInterceptors,
    hasListeners,
    interceptChange,
    isES6Map,
    isPlainObject,
    isSpyEnabled,
    makeIterable,
    notifyListeners,
    referenceEnhancer,
    registerInterceptor,
    registerListener,
    spyReportEnd,
    spyReportStart,
    stringifyKey,
    transaction,
    untracked,
    onBecomeUnobserved,
    globalState,
    die,
    isFunction,
    UPDATE
} from "../internal"
const ObservableMapMarker = {}
export const ADD = "add"
export const DELETE = "delete"
// just extend Map? See also https://gist.github.com/nestharus/13b4d74f2ef4a2f4357dbd3fc23c1e54
// But: https://github.com/mobxjs/mobx/issues/1556
export class ObservableMap {
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
        Object.defineProperty(this, _a, {
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
    [((_a = $mobx), Symbol.iterator)]() {
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
export var isObservableMap = createInstanceofPredicate("ObservableMap", ObservableMap)
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
//# sourceMappingURL=observablemap.js.map