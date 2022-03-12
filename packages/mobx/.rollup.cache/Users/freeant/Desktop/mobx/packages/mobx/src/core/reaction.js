import {
    $mobx,
    IDerivationState_,
    TraceMode,
    clearObserving,
    createInstanceofPredicate,
    endBatch,
    getNextId,
    globalState,
    isCaughtException,
    isSpyEnabled,
    shouldCompute,
    spyReport,
    spyReportEnd,
    spyReportStart,
    startBatch,
    trace,
    trackDerivedFunction
} from "../internal"
export class Reaction {
    constructor(
        name_ = __DEV__ ? "Reaction@" + getNextId() : "Reaction",
        onInvalidate_,
        errorHandler_,
        requiresObservable_ = false
    ) {
        Object.defineProperty(this, "name_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: name_
        })
        Object.defineProperty(this, "onInvalidate_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: onInvalidate_
        })
        Object.defineProperty(this, "errorHandler_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: errorHandler_
        })
        Object.defineProperty(this, "requiresObservable_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: requiresObservable_
        })
        Object.defineProperty(this, "observing_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        }) // nodes we are looking at. Our value depends on these nodes
        Object.defineProperty(this, "newObserving_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        })
        Object.defineProperty(this, "dependenciesState_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: IDerivationState_.NOT_TRACKING_
        })
        Object.defineProperty(this, "diffValue_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        })
        Object.defineProperty(this, "runId_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        })
        Object.defineProperty(this, "unboundDepsCount_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        })
        //处置、安排的状态
        Object.defineProperty(this, "isDisposed_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        })
        Object.defineProperty(this, "isScheduled_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        })
        //跟踪、运行、
        Object.defineProperty(this, "isTrackPending_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        })
        Object.defineProperty(this, "isRunning_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        })
        Object.defineProperty(this, "isTracing_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: TraceMode.NONE
        })
    }
    onBecomeStale_() {
        this.schedule_()
    }
    schedule_() {
        if (!this.isScheduled_) {
            this.isScheduled_ = true
            globalState.pendingReactions.push(this)
            //统一了运行的方法：runReactions 而不是单独调用`runReaction_`
            runReactions()
        }
    }
    isScheduled() {
        return this.isScheduled_
    }
    /**
     * internal, use schedule() if you intend to kick off a reaction
     */
    runReaction_() {
        if (!this.isDisposed_) {
            startBatch()
            //还原isScheduled_ 属性
            this.isScheduled_ = false
            const prev = globalState.trackingContext
            globalState.trackingContext = this
            if (shouldCompute(this)) {
                this.isTrackPending_ = true
                try {
                    this.onInvalidate_()
                    if (__DEV__ && this.isTrackPending_ && isSpyEnabled()) {
                        // onInvalidate didn't trigger track right away..
                        spyReport({
                            name: this.name_,
                            type: "scheduled-reaction"
                        })
                    }
                } catch (e) {
                    this.reportExceptionInDerivation_(e)
                }
            }
            globalState.trackingContext = prev
            endBatch()
        }
    }
    track(fn) {
        if (this.isDisposed_) {
            return
            // console.warn("Reaction already disposed") // Note: Not a warning / error in mobx 4 either
        }
        startBatch()
        const notify = isSpyEnabled()
        let startTime
        if (__DEV__ && notify) {
            startTime = Date.now()
            spyReportStart({
                name: this.name_,
                type: "reaction"
            })
        }
        //记录运行
        this.isRunning_ = true
        const prevReaction = globalState.trackingContext // reactions could create reactions...
        globalState.trackingContext = this
        const result = trackDerivedFunction(this, fn, undefined)
        globalState.trackingContext = prevReaction
        this.isRunning_ = false
        this.isTrackPending_ = false
        if (this.isDisposed_) {
            // disposed during last run. Clean up everything that was bound after the dispose call.
            clearObserving(this)
        }
        if (isCaughtException(result)) this.reportExceptionInDerivation_(result.cause)
        if (__DEV__ && notify) {
            spyReportEnd({
                time: Date.now() - startTime
            })
        }
        endBatch()
    }
    reportExceptionInDerivation_(error) {
        if (this.errorHandler_) {
            this.errorHandler_(error, this)
            return
        }
        if (globalState.disableErrorBoundaries) throw error
        const message = __DEV__
            ? `[mobx] Encountered an uncaught exception that was thrown by a reaction or observer component, in: '${this}'`
            : `[mobx] uncaught error in '${this}'`
        if (!globalState.suppressReactionErrors) {
            console.error(message, error);
            /** If debugging brought you here, please, read the above message :-). Tnx! */
        }
        else if (__DEV__)
            console.warn(`[mobx] (error in reaction '${this.name_}' suppressed, fix error of causing action below)`); // prettier-ignore
        if (__DEV__ && isSpyEnabled()) {
            spyReport({
                type: "error",
                name: this.name_,
                message,
                error: "" + error
            })
        }
        globalState.globalReactionErrorHandlers.forEach(f => f(error, this))
    }
    dispose() {
        if (!this.isDisposed_) {
            this.isDisposed_ = true
            if (!this.isRunning_) {
                // if disposed while running, clean up later. Maybe not optimal, but rare case
                startBatch()
                clearObserving(this)
                endBatch()
            }
        }
    }
    //用bind包装一层，加上类型后和`$mobx`属性后返回
    getDisposer_() {
        const r = this.dispose.bind(this)
        r[$mobx] = this
        return r
    }
    //拿到名字信息
    toString() {
        return `Reaction[${this.name_}]`
    }
    trace(enterBreakPoint = false) {
        trace(this, enterBreakPoint)
    }
}
export function onReactionError(handler) {
    globalState.globalReactionErrorHandlers.push(handler)
    return () => {
        const idx = globalState.globalReactionErrorHandlers.indexOf(handler)
        if (idx >= 0) globalState.globalReactionErrorHandlers.splice(idx, 1)
    }
}
/**
 * Magic number alert!
 * Defines within how many times a reaction is allowed to re-trigger itself
 * until it is assumed that this is gonna be a never ending loop...
 */
const MAX_REACTION_ITERATIONS = 100
let reactionScheduler = f => f()
export function runReactions() {
    // Trampolining, if runReactions are already running, new reactions will be picked up
    if (globalState.inBatch > 0 || globalState.isRunningReactions) return
    reactionScheduler(runReactionsHelper)
}
//运行 reaction的帮助函数
function runReactionsHelper() {
    //记录运行状态
    globalState.isRunningReactions = true
    const allReactions = globalState.pendingReactions
    let iterations = 0
    // While running reactions, new reactions might be triggered.
    // Hence we work with two variables and check whether
    // we converge to no remaining reactions after a while.
    while (allReactions.length > 0) {
        //设定最大的迭代数量：100
        if (++iterations === MAX_REACTION_ITERATIONS) {
            console.error(
                __DEV__
                    ? `Reaction doesn't converge to a stable state after ${MAX_REACTION_ITERATIONS} iterations.` +
                          ` Probably there is a cycle in the reactive function: ${allReactions[0]}`
                    : `[mobx] cycle in reaction: ${allReactions[0]}`
            )
            allReactions.splice(0) // clear reactions
        }
        //取出所有的 reactions，分别迭代并执行它们
        let remainingReactions = allReactions.splice(0)
        for (let i = 0, l = remainingReactions.length; i < l; i++)
            remainingReactions[i].runReaction_()
    }
    globalState.isRunningReactions = false
}
export const isReaction = createInstanceofPredicate("Reaction", Reaction)
export function setReactionScheduler(fn) {
    const baseScheduler = reactionScheduler
    reactionScheduler = f => fn(() => baseScheduler(f))
}
//# sourceMappingURL=reaction.js.map
