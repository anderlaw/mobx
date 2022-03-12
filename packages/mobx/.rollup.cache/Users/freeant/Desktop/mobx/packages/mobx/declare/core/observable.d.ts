import { Lambda, IDerivation, IDerivationState_ } from "../internal"
/**
 * 依赖树节点接口
 * 1.要有_name
 * 2.观察列表: observing_
 */
export interface IDepTreeNode {
    name_: string
    observing_?: IObservable[]
}
export interface IObservable extends IDepTreeNode {
    diffValue_: number
    /**
     * Id of the derivation *run* that last accessed this observable.
     * If this id equals the *run* id of the current derivation,
     * the dependency is already established
     */
    lastAccessedBy_: number
    isBeingObserved_: boolean
    lowestObserverState_: IDerivationState_
    isPendingUnobservation_: boolean
    observers_: Set<IDerivation>
    onBUO(): void
    onBO(): void
    onBUOL: Set<Lambda> | undefined
    onBOL: Set<Lambda> | undefined
}
export declare function hasObservers(observable: IObservable): boolean
export declare function getObservers(observable: IObservable): Set<IDerivation>
export declare function addObserver(observable: IObservable, node: IDerivation): void
export declare function removeObserver(observable: IObservable, node: IDerivation): void
export declare function queueForUnobservation(observable: IObservable): void
/**
 * Batch starts a transaction, at least for purposes of memoizing ComputedValues when nothing else does.
 * During a batch `onBecomeUnobserved` will be called at most once per observable.
 * Avoids unnecessary recalculations.
 */
export declare function startBatch(): void
/**
 * 结束事物：
 * 1. 运行 global中的pendingReactions
 * 2. 重置global中的pendingUnobservations的属性状态：isPendingUnobservation_、isBeingObserved_,触发onBUO
 */
export declare function endBatch(): void
/**
 * 报告（收集）：
 * 1. 观察者收集observable，记录观察者的runId到observable上
 * 2. 累加观察者的 unboundDepsCount、添加observable到 观察者的newObserving_列表里
 * 3. 触发observable的 onBO钩子
 */
export declare function reportObserved(observable: IObservable): boolean
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
export declare function propagateChanged(observable: IObservable): void
export declare function propagateChangeConfirmed(observable: IObservable): void
export declare function propagateMaybeChanged(observable: IObservable): void
//# sourceMappingURL=observable.d.ts.map
