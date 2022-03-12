import {
    IDerivationState_,
    createInstanceofPredicate,
    endBatch,
    getNextId,
    noop,
    onBecomeObserved,
    onBecomeUnobserved,
    propagateChanged,
    reportObserved,
    startBatch
} from "../internal"
export const $mobx = Symbol("mobx administration")
export class Atom {
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
export const isAtom = createInstanceofPredicate("Atom", Atom)
export function createAtom(name, onBecomeObservedHandler = noop, onBecomeUnobservedHandler = noop) {
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
//# sourceMappingURL=atom.js.map
