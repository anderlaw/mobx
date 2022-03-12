import {
    ComputedValue,
    IDerivationState_,
    TraceMode,
    getDependencyTree,
    globalState,
    runReactions,
    checkIfStateReadsAreAllowed
} from "../internal"
export function hasObservers(observable) {
    return observable.observers_ && observable.observers_.size > 0
}
export function getObservers(observable) {
    return observable.observers_
}
// function invariantObservers(observable: IObservable) {
//     const list = observable.observers
//     const map = observable.observersIndexes
//     const l = list.length
//     for (let i = 0; i < l; i++) {
//         const id = list[i].__mapid
//         if (i) {
//             invariant(map[id] === i, "INTERNAL ERROR maps derivation.__mapid to index in list") // for performance
//         } else {
//             invariant(!(id in map), "INTERNAL ERROR observer on index 0 shouldn't be held in map.") // for performance
//         }
//     }
//     invariant(
//         list.length === 0 || Object.keys(map).length === list.length - 1,
//         "INTERNAL ERROR there is no junk in map"
//     )
// }
export function addObserver(observable, node) {
    // invariant(node.dependenciesState !== -1, "INTERNAL ERROR, can add only dependenciesState !== -1");
    // invariant(observable._observers.indexOf(node) === -1, "INTERNAL ERROR add already added node");
    // invariantObservers(observable);
    observable.observers_.add(node)
    //取最低的
    if (observable.lowestObserverState_ > node.dependenciesState_)
        observable.lowestObserverState_ = node.dependenciesState_
    // invariantObservers(observable);
    // invariant(observable._observers.indexOf(node) !== -1, "INTERNAL ERROR didn't add node");
}
export function removeObserver(observable, node) {
    // invariant(globalState.inBatch > 0, "INTERNAL ERROR, remove should be called only inside batch");
    // invariant(observable._observers.indexOf(node) !== -1, "INTERNAL ERROR remove already removed node");
    // invariantObservers(observable);
    observable.observers_.delete(node)
    //当可观察对象的观察者为空时，队列处理观察解除（UnObservation）
    if (observable.observers_.size === 0) {
        // deleting last observer
        queueForUnobservation(observable)
    }
    // invariantObservers(observable);
    // invariant(observable._observers.indexOf(node) === -1, "INTERNAL ERROR remove already removed node2");
}
export function queueForUnobservation(observable) {
    if (observable.isPendingUnobservation_ === false) {
        // invariant(observable._observers.length === 0, "INTERNAL ERROR, should only queue for unobservation unobserved observables");
        observable.isPendingUnobservation_ = true
        globalState.pendingUnobservations.push(observable)
    }
}
/**
 * Batch starts a transaction, at least for purposes of memoizing ComputedValues when nothing else does.
 * During a batch `onBecomeUnobserved` will be called at most once per observable.
 * Avoids unnecessary recalculations.
 */
export function startBatch() {
    globalState.inBatch++
}
/**
 * 结束事物：
 * 1. 运行 global中的pendingReactions
 * 2. 重置global中的pendingUnobservations的属性状态：isPendingUnobservation_、isBeingObserved_,触发onBUO
 */
export function endBatch() {
    if (--globalState.inBatch === 0) {
        //取出所有global.pendingReactions 并执行每个项目中的`runReaction_`
        runReactions()
        // the batch is actually about to finish, all unobserving should happen here.
        const list = globalState.pendingUnobservations
        for (let i = 0; i < list.length; i++) {
            const observable = list[i]
            observable.isPendingUnobservation_ = false
            //仅当观察者列表为空时
            if (observable.observers_.size === 0) {
                if (observable.isBeingObserved_) {
                    // if this observable had reactive observers, trigger the hooks
                    observable.isBeingObserved_ = false
                    //触发`变为不可观察对象`钩子
                    observable.onBUO()
                }
                if (observable instanceof ComputedValue) {
                    // computed values are automatically teared down when the last observer leaves
                    // this process happens recursively, this computed might be the last observabe of another, etc..
                    observable.suspend_()
                }
            }
        }
        globalState.pendingUnobservations = []
    }
}
/**
 * 报告（收集）：
 * 1. 观察者收集observable，记录观察者的runId到observable上
 * 2. 累加观察者的 unboundDepsCount、添加observable到 观察者的newObserving_列表里
 * 3. 触发observable的 onBO钩子
 */
export function reportObserved(observable) {
    checkIfStateReadsAreAllowed(observable)
    //取出 当前正在追踪的derivation(观察者)
    const derivation = globalState.trackingDerivation
    if (derivation !== null) {
        /**
         * Simple optimization, give each derivation run an unique id (runId)
         * Check if last time this observable was accessed the same runId is used
         * if this is the case, the relation is already known
         */
        if (derivation.runId_ !== observable.lastAccessedBy_) {
            observable.lastAccessedBy_ = derivation.runId_
            // Tried storing newObserving, or observing, or both as Set, but performance didn't come close...
            //把observable添加到 derivation的newObserving数组里（累加unboundDepsCount_属性）
            derivation.newObserving_[derivation.unboundDepsCount_++] = observable
            if (!observable.isBeingObserved_ && globalState.trackingContext) {
                observable.isBeingObserved_ = true
                observable.onBO()
            }
        }
        return true
    } else if (observable.observers_.size === 0 && globalState.inBatch > 0) {
        queueForUnobservation(observable)
    }
    return false
}
// function invariantLOS(observable: IObservable, msg: string) {
//     // it's expensive so better not run it in produciton. but temporarily helpful for testing
//     const min = getObservers(observable).reduce((a, b) => Math.min(a, b.dependenciesState), 2)
//     if (min >= observable.lowestObserverState) return // <- the only assumption about `lowestObserverState`
//     throw new Error(
//         "lowestObserverState is wrong for " +
//             msg +
//             " because " +
//             min +
//             " < " +
//             observable.lowestObserverState
//     )
// }
/**
 * NOTE: current propagation mechanism will in case of self reruning autoruns behave unexpectedly
 * It will propagate changes to observers from previous run
 * It's hard or maybe impossible (with reasonable perf) to get it right with current approach
 * Hopefully self reruning autoruns aren't a feature people should depend on
 * Also most basic use cases should be ok
 */
/**
 * 传播变化：observable变更触发 观察者执行
 * 1. 防抖
 * 2. 只有d.dependenciesState_ 为 up_to_date的才触发 d.onBecomeStale_()
 * 3. 统一将d.dependenciesState_ 改为 _stale
 * 猜测，这里是防抖处理，一定有个地方会重置d.dependenciesState_ 的。
 */
// Called by Atom when its value changes
//修改两个地方： lowestObserverState_、 observers_ 每一项的dependenciesState_ 为 stale
export function propagateChanged(observable) {
    // invariantLOS(observable, "changed start");
    //这里的lowestObserverState_ 是个开关，防止重复执行
    if (observable.lowestObserverState_ === IDerivationState_.STALE_) return
    observable.lowestObserverState_ = IDerivationState_.STALE_
    // Ideally we use for..of here, but the downcompiled version is really slow...
    observable.observers_.forEach(d => {
        //将STALE_同步到 观察者的dependenciesState_
        if (d.dependenciesState_ === IDerivationState_.UP_TO_DATE_) {
            if (__DEV__ && d.isTracing_ !== TraceMode.NONE) {
                logTraceInfo(d, observable)
            }
            d.onBecomeStale_()
        }
        d.dependenciesState_ = IDerivationState_.STALE_
    })
    // invariantLOS(observable, "changed end");
}
// Called by ComputedValue when it recalculate and its value changed
export function propagateChangeConfirmed(observable) {
    // invariantLOS(observable, "confirmed start");
    if (observable.lowestObserverState_ === IDerivationState_.STALE_) return
    observable.lowestObserverState_ = IDerivationState_.STALE_
    observable.observers_.forEach(d => {
        if (d.dependenciesState_ === IDerivationState_.POSSIBLY_STALE_) {
            d.dependenciesState_ = IDerivationState_.STALE_
            if (__DEV__ && d.isTracing_ !== TraceMode.NONE) {
                logTraceInfo(d, observable)
            }
        } else if (
            d.dependenciesState_ === IDerivationState_.UP_TO_DATE_ // this happens during computing of `d`, just keep lowestObserverState up to date.
        ) {
            observable.lowestObserverState_ = IDerivationState_.UP_TO_DATE_
        }
    })
    // invariantLOS(observable, "confirmed end");
}
// Used by computed when its dependency changed, but we don't wan't to immediately recompute.
export function propagateMaybeChanged(observable) {
    // invariantLOS(observable, "maybe start");
    if (observable.lowestObserverState_ !== IDerivationState_.UP_TO_DATE_) return
    observable.lowestObserverState_ = IDerivationState_.POSSIBLY_STALE_
    observable.observers_.forEach(d => {
        if (d.dependenciesState_ === IDerivationState_.UP_TO_DATE_) {
            d.dependenciesState_ = IDerivationState_.POSSIBLY_STALE_
            d.onBecomeStale_()
        }
    })
    // invariantLOS(observable, "maybe end");
}
function logTraceInfo(derivation, observable) {
    console.log(
        `[mobx.trace] '${derivation.name_}' is invalidated due to a change in: '${observable.name_}'`
    )
    if (derivation.isTracing_ === TraceMode.BREAK) {
        const lines = []
        printDepTree(getDependencyTree(derivation), lines, 1)
        // prettier-ignore
        new Function(`debugger;
/*
Tracing '${derivation.name_}'

You are entering this break point because derivation '${derivation.name_}' is being traced and '${observable.name_}' is now forcing it to update.
Just follow the stacktrace you should now see in the devtools to see precisely what piece of your code is causing this update
The stackframe you are looking for is at least ~6-8 stack-frames up.

${derivation instanceof ComputedValue ? derivation.derivation.toString().replace(/[*]\//g, "/") : ""}

The dependencies for this derivation are:

${lines.join("\n")}
*/
    `)();
    }
}
function printDepTree(tree, lines, depth) {
    if (lines.length >= 1000) {
        lines.push("(and many more)")
        return
    }
    lines.push(`${"\t".repeat(depth - 1)}${tree.name}`)
    if (tree.dependencies) tree.dependencies.forEach(child => printDepTree(child, lines, depth + 1))
}
//# sourceMappingURL=observable.js.map
