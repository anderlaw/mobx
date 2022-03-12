import { die, getGlobal } from "../internal"
/**
 * These values will persist if global state is reset
 */
const persistentKeys = [
    "mobxGuid",
    "spyListeners",
    "enforceActions",
    "computedRequiresReaction",
    "reactionRequiresObservable",
    "observableRequiresReaction",
    "allowStateReads",
    "disableErrorBoundaries",
    "runId",
    "UNCHANGED",
    "useProxies"
]
export class MobXGlobals {
    constructor() {
        /**
         * MobXGlobals version.
         * MobX compatiblity with other versions loaded in memory as long as this version matches.
         * It indicates that the global state still stores similar information
         *
         * N.B: this version is unrelated to the package version of MobX, and is only the version of the
         * internal state storage of MobX, and can be the same across many different package versions
         */
        Object.defineProperty(this, "version", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 6
        })
        /**
         * globally unique token to signal unchanged
         */
        Object.defineProperty(this, "UNCHANGED", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        })
        /**
         * Currently running derivation
         */
        Object.defineProperty(this, "trackingDerivation", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        })
        /**
         * Currently running reaction. This determines if we currently have a reactive context.
         * (Tracking derivation is also set for temporal tracking of computed values inside actions,
         * but trackingReaction can only be set by a form of Reaction)
         */
        Object.defineProperty(this, "trackingContext", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        })
        /**
         * Each time a derivation is tracked, it is assigned a unique run-id
         */
        Object.defineProperty(this, "runId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        })
        /**
         * 'guid' for general purpose. Will be persisted amongst resets.
         */
        Object.defineProperty(this, "mobxGuid", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        })
        /**
         * Are we in a batch block? (and how many of them)
         */
        Object.defineProperty(this, "inBatch", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        })
        /**
         * Observables that don't have observers anymore, and are about to be
         * suspended, unless somebody else accesses it in the same batch
         *
         * @type {IObservable[]}
         */
        Object.defineProperty(this, "pendingUnobservations", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        })
        /**
         * List of scheduled, not yet executed, reactions.
         */
        Object.defineProperty(this, "pendingReactions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        })
        /**
         * Are we currently processing reactions?
         */
        Object.defineProperty(this, "isRunningReactions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        })
        /**
         * Is it allowed to change observables at this point?
         * In general, MobX doesn't allow that when running computations and React.render.
         * To ensure that those functions stay pure.
         */
        Object.defineProperty(this, "allowStateChanges", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        })
        /**
         * Is it allowed to read observables at this point?
         * Used to hold the state needed for `observableRequiresReaction`
         */
        Object.defineProperty(this, "allowStateReads", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        })
        /**
         * If strict mode is enabled, state changes are by default not allowed
         */
        Object.defineProperty(this, "enforceActions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        })
        /**
         * Spy callbacks
         */
        Object.defineProperty(this, "spyListeners", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        })
        /**
         * Globally attached error handlers that react specifically to errors in reactions
         */
        Object.defineProperty(this, "globalReactionErrorHandlers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        })
        /**
         * Warn if computed values are accessed outside a reactive context
         */
        Object.defineProperty(this, "computedRequiresReaction", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        })
        /**
         * (Experimental)
         * Warn if you try to create to derivation / reactive context without accessing any observable.
         */
        Object.defineProperty(this, "reactionRequiresObservable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        })
        /**
         * (Experimental)
         * Warn if observables are accessed outside a reactive context
         */
        Object.defineProperty(this, "observableRequiresReaction", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        })
        /*
         * Don't catch and rethrow exceptions. This is useful for inspecting the state of
         * the stack when an exception occurs while debugging.
         */
        Object.defineProperty(this, "disableErrorBoundaries", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        })
        /*
         * If true, we are already handling an exception in an action. Any errors in reactions should be suppressed, as
         * they are not the cause, see: https://github.com/mobxjs/mobx/issues/1836
         */
        Object.defineProperty(this, "suppressReactionErrors", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        })
        Object.defineProperty(this, "useProxies", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        })
        /*
         * print warnings about code that would fail if proxies weren't available
         */
        Object.defineProperty(this, "verifyProxies", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        })
        /**
         * False forces all object's descriptors to
         * writable: true
         * configurable: true
         */
        Object.defineProperty(this, "safeDescriptors", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        })
    }
}
let canMergeGlobalState = true
let isolateCalled = false
export let globalState = (function () {
    let global = getGlobal()
    if (global.__mobxInstanceCount > 0 && !global.__mobxGlobals) canMergeGlobalState = false
    if (global.__mobxGlobals && global.__mobxGlobals.version !== new MobXGlobals().version)
        canMergeGlobalState = false
    if (!canMergeGlobalState) {
        // Because this is a IIFE we need to let isolateCalled a chance to change
        // so we run it after the event loop completed at least 1 iteration
        setTimeout(() => {
            if (!isolateCalled) {
                die(35)
            }
        }, 1)
        return new MobXGlobals()
    } else if (global.__mobxGlobals) {
        global.__mobxInstanceCount += 1
        if (!global.__mobxGlobals.UNCHANGED) global.__mobxGlobals.UNCHANGED = {} // make merge backward compatible
        return global.__mobxGlobals
    } else {
        global.__mobxInstanceCount = 1
        return (global.__mobxGlobals = new MobXGlobals())
    }
})()
export function isolateGlobalState() {
    if (
        globalState.pendingReactions.length ||
        globalState.inBatch ||
        globalState.isRunningReactions
    )
        die(36)
    isolateCalled = true
    if (canMergeGlobalState) {
        let global = getGlobal()
        if (--global.__mobxInstanceCount === 0) global.__mobxGlobals = undefined
        globalState = new MobXGlobals()
    }
}
export function getGlobalState() {
    return globalState
}
/**
 * For testing purposes only; this will break the internal state of existing observables,
 * but can be used to get back at a stable state after throwing errors
 */
export function resetGlobalState() {
    const defaultGlobals = new MobXGlobals()
    for (let key in defaultGlobals)
        if (persistentKeys.indexOf(key) === -1) globalState[key] = defaultGlobals[key]
    globalState.allowStateChanges = !globalState.enforceActions
}
//# sourceMappingURL=globalstate.js.map
