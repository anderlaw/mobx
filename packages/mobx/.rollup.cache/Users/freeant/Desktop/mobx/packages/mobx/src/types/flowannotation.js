import { defineProperty, die, flow, isFlow, isFunction, globalState } from "../internal"
export function createFlowAnnotation(name, options) {
    return {
        annotationType_: name,
        options_: options,
        make_,
        extend_
    }
}
function make_(adm, key, descriptor, source) {
    var _a
    // own
    if (source === adm.target_) {
        return this.extend_(adm, key, descriptor, false) === null
            ? 0 /* Cancel */
            : 2 /* Continue */
    }
    // prototype
    // bound - must annotate protos to support super.flow()
    if (
        ((_a = this.options_) === null || _a === void 0 ? void 0 : _a.bound) &&
        !isFlow(adm.target_[key])
    ) {
        if (this.extend_(adm, key, descriptor, false) === null) return 0 /* Cancel */
    }
    if (isFlow(descriptor.value)) {
        // A prototype could have been annotated already by other constructor,
        // rest of the proto chain must be annotated already
        return 1 /* Break */
    }
    const flowDescriptor = createFlowDescriptor(adm, this, key, descriptor, false, false)
    defineProperty(source, key, flowDescriptor)
    return 2 /* Continue */
}
function extend_(adm, key, descriptor, proxyTrap) {
    var _a
    const flowDescriptor = createFlowDescriptor(
        adm,
        this,
        key,
        descriptor,
        (_a = this.options_) === null || _a === void 0 ? void 0 : _a.bound
    )
    return adm.defineProperty_(key, flowDescriptor, proxyTrap)
}
function assertFlowDescriptor(adm, { annotationType_ }, key, { value }) {
    if (__DEV__ && !isFunction(value)) {
        die(
            `Cannot apply '${annotationType_}' to '${adm.name_}.${key.toString()}':` +
                `\n'${annotationType_}' can only be used on properties with a generator function value.`
        )
    }
}
function createFlowDescriptor(
    adm,
    annotation,
    key,
    descriptor,
    bound,
    // provides ability to disable safeDescriptors for prototypes
    safeDescriptors = globalState.safeDescriptors
) {
    var _a
    assertFlowDescriptor(adm, annotation, key, descriptor)
    let { value } = descriptor
    if (bound) {
        value = value.bind((_a = adm.proxy_) !== null && _a !== void 0 ? _a : adm.target_)
    }
    return {
        value: flow(value),
        // Non-configurable for classes
        // prevents accidental field redefinition in subclass
        configurable: safeDescriptors ? adm.isPlainObject_ : true,
        // https://github.com/mobxjs/mobx/pull/2641#issuecomment-737292058
        enumerable: false,
        // Non-obsevable, therefore non-writable
        // Also prevents rewriting in subclass constructor
        writable: safeDescriptors ? false : true
    }
}
//# sourceMappingURL=flowannotation.js.map
