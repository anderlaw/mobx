import {
    EMPTY_OBJECT,
    Reaction,
    action,
    comparer,
    getNextId,
    isAction,
    isFunction,
    isPlainObject,
    die,
    allowStateChanges
} from "../internal"
/**
 * Creates a named reactive view and keeps it alive, so that the view is always
 * updated if one of the dependencies changes, even when the view is not further used by something else.
 * @param view The reactive view
 * @returns disposer function, which can be used to stop the view from being updated in the future.
 */
export function autorun(view, opts = EMPTY_OBJECT) {
    var _a
    if (__DEV__) {
        if (!isFunction(view)) die("Autorun expects a function as first argument")
        if (isAction(view)) die("Autorun does not accept actions since actions are untrackable")
    }
    const name =
        (_a = opts === null || opts === void 0 ? void 0 : opts.name) !== null && _a !== void 0
            ? _a
            : __DEV__
            ? view.name || "Autorun@" + getNextId()
            : "Autorun"
    const runSync = !opts.scheduler && !opts.delay
    let reaction
    if (runSync) {
        // normal autorun
        reaction = new Reaction(
            name,
            function () {
                this.track(reactionRunner)
            },
            opts.onError,
            opts.requiresObservable
        )
    } else {
        const scheduler = createSchedulerFromOptions(opts)
        // debounced autorun
        let isScheduled = false
        reaction = new Reaction(
            name,
            () => {
                if (!isScheduled) {
                    isScheduled = true
                    scheduler(() => {
                        isScheduled = false
                        if (!reaction.isDisposed_) reaction.track(reactionRunner)
                    })
                }
            },
            opts.onError,
            opts.requiresObservable
        )
    }
    function reactionRunner() {
        view(reaction)
    }
    reaction.schedule_()
    return reaction.getDisposer_()
}
const run = f => f()
function createSchedulerFromOptions(opts) {
    return opts.scheduler ? opts.scheduler : opts.delay ? f => setTimeout(f, opts.delay) : run
}
export function reaction(expression, effect, opts = EMPTY_OBJECT) {
    var _a
    if (__DEV__) {
        if (!isFunction(expression) || !isFunction(effect))
            die("First and second argument to reaction should be functions")
        if (!isPlainObject(opts)) die("Third argument of reactions should be an object")
    }
    const name =
        (_a = opts.name) !== null && _a !== void 0
            ? _a
            : __DEV__
            ? "Reaction@" + getNextId()
            : "Reaction"
    const effectAction = action(
        name,
        opts.onError ? wrapErrorHandler(opts.onError, effect) : effect
    )
    const runSync = !opts.scheduler && !opts.delay
    const scheduler = createSchedulerFromOptions(opts)
    let firstTime = true
    let isScheduled = false
    let value
    let oldValue
    const equals = opts.compareStructural ? comparer.structural : opts.equals || comparer.default
    const r = new Reaction(
        name,
        () => {
            if (firstTime || runSync) {
                reactionRunner()
            } else if (!isScheduled) {
                isScheduled = true
                scheduler(reactionRunner)
            }
        },
        opts.onError,
        opts.requiresObservable
    )
    function reactionRunner() {
        isScheduled = false
        if (r.isDisposed_) return
        let changed = false
        r.track(() => {
            const nextValue = allowStateChanges(false, () => expression(r))
            changed = firstTime || !equals(value, nextValue)
            oldValue = value
            value = nextValue
        })
        if (firstTime && opts.fireImmediately) effectAction(value, oldValue, r)
        else if (!firstTime && changed) effectAction(value, oldValue, r)
        firstTime = false
    }
    r.schedule_()
    return r.getDisposer_()
}
function wrapErrorHandler(errorHandler, baseFn) {
    return function () {
        try {
            return baseFn.apply(this, arguments)
        } catch (e) {
            errorHandler.call(this, e)
        }
    }
}
//# sourceMappingURL=autorun.js.map
