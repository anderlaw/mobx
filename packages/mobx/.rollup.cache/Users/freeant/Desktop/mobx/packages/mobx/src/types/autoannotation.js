import {
    observable,
    defineProperty,
    createAction,
    globalState,
    flow,
    computed,
    autoAction,
    isGenerator
} from "../internal"
const AUTO = "true"
export const autoAnnotation = createAutoAnnotation()
export function createAutoAnnotation(options) {
    return {
        annotationType_: AUTO,
        options_: options,
        make_,
        extend_
    }
}
function make_(adm, key, descriptor, source) {
    var _a, _b, _c, _d, _e
    // getter -> computed
    if (descriptor.get) {
        return computed.make_(adm, key, descriptor, source)
    }
    // lone setter -> action setter
    if (descriptor.set) {
        // TODO make action applicable to setter and delegate to action.make_
        const set = createAction(key.toString(), descriptor.set)
        // own
        if (source === adm.target_) {
            return adm.defineProperty_(key, {
                configurable: globalState.safeDescriptors ? adm.isPlainObject_ : true,
                set
            }) === null
                ? 0 /* Cancel */
                : 2 /* Continue */
        }
        // proto
        defineProperty(source, key, {
            configurable: true,
            set
        })
        return 2 /* Continue */
    }
    // function on proto -> autoAction/flow
    if (source !== adm.target_ && typeof descriptor.value === "function") {
        if (isGenerator(descriptor.value)) {
            const flowAnnotation = (
                (_a = this.options_) === null || _a === void 0 ? void 0 : _a.autoBind
            )
                ? flow.bound
                : flow
            return flowAnnotation.make_(adm, key, descriptor, source)
        }
        const actionAnnotation = (
            (_b = this.options_) === null || _b === void 0 ? void 0 : _b.autoBind
        )
            ? autoAction.bound
            : autoAction
        return actionAnnotation.make_(adm, key, descriptor, source)
    }
    // other -> observable
    // Copy props from proto as well, see test:
    // "decorate should work with Object.create"
    let observableAnnotation =
        ((_c = this.options_) === null || _c === void 0 ? void 0 : _c.deep) === false
            ? observable.ref
            : observable
    // if function respect autoBind option
    if (
        typeof descriptor.value === "function" &&
        ((_d = this.options_) === null || _d === void 0 ? void 0 : _d.autoBind)
    ) {
        descriptor.value = descriptor.value.bind(
            (_e = adm.proxy_) !== null && _e !== void 0 ? _e : adm.target_
        )
    }
    return observableAnnotation.make_(adm, key, descriptor, source)
}
function extend_(adm, key, descriptor, proxyTrap) {
    var _a, _b, _c
    // getter -> computed
    if (descriptor.get) {
        return computed.extend_(adm, key, descriptor, proxyTrap)
    }
    // lone setter -> action setter
    if (descriptor.set) {
        // TODO make action applicable to setter and delegate to action.extend_
        return adm.defineProperty_(
            key,
            {
                configurable: globalState.safeDescriptors ? adm.isPlainObject_ : true,
                set: createAction(key.toString(), descriptor.set)
            },
            proxyTrap
        )
    }
    // other -> observable
    // if function respect autoBind option
    if (
        typeof descriptor.value === "function" &&
        ((_a = this.options_) === null || _a === void 0 ? void 0 : _a.autoBind)
    ) {
        descriptor.value = descriptor.value.bind(
            (_b = adm.proxy_) !== null && _b !== void 0 ? _b : adm.target_
        )
    }
    let observableAnnotation =
        ((_c = this.options_) === null || _c === void 0 ? void 0 : _c.deep) === false
            ? observable.ref
            : observable
    return observableAnnotation.extend_(adm, key, descriptor, proxyTrap)
}
//# sourceMappingURL=autoannotation.js.map
