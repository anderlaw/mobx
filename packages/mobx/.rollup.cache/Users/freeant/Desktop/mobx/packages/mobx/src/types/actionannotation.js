import { createAction, isAction, defineProperty, die, isFunction, globalState } from "../internal"
export function createActionAnnotation(name, options) {
    return {
        annotationType_: name,
        options_: options,
        make_,
        extend_
    }
}
function make_(adm, key, descriptor, source) {
    var _a
    // bound
    if ((_a = this.options_) === null || _a === void 0 ? void 0 : _a.bound) {
        return this.extend_(adm, key, descriptor, false) === null ? 0 /* Cancel */ : 1 /* Break */
    }
    // own
    if (source === adm.target_) {
        return this.extend_(adm, key, descriptor, false) === null
            ? 0 /* Cancel */
            : 2 /* Continue */
    }
    // prototype
    if (isAction(descriptor.value)) {
        // A prototype could have been annotated already by other constructor,
        // rest of the proto chain must be annotated already
        return 1 /* Break */
    }
    const actionDescriptor = createActionDescriptor(adm, this, key, descriptor, false)
    defineProperty(source, key, actionDescriptor)
    return 2 /* Continue */
}
function extend_(adm, key, descriptor, proxyTrap) {
    const actionDescriptor = createActionDescriptor(adm, this, key, descriptor)
    return adm.defineProperty_(key, actionDescriptor, proxyTrap)
}
function assertActionDescriptor(adm, { annotationType_ }, key, { value }) {
    if (__DEV__ && !isFunction(value)) {
        die(
            `Cannot apply '${annotationType_}' to '${adm.name_}.${key.toString()}':` +
                `\n'${annotationType_}' can only be used on properties with a function value.`
        )
    }
}
export function createActionDescriptor(
    adm,
    annotation,
    key,
    descriptor,
    // provides ability to disable safeDescriptors for prototypes
    safeDescriptors = globalState.safeDescriptors
) {
    var _a, _b, _c, _d, _e, _f, _g, _h
    assertActionDescriptor(adm, annotation, key, descriptor)
    let { value } = descriptor
    if ((_a = annotation.options_) === null || _a === void 0 ? void 0 : _a.bound) {
        value = value.bind((_b = adm.proxy_) !== null && _b !== void 0 ? _b : adm.target_)
    }
    return {
        value: createAction(
            (_d = (_c = annotation.options_) === null || _c === void 0 ? void 0 : _c.name) !==
                null && _d !== void 0
                ? _d
                : key.toString(),
            value,
            (_f = (_e = annotation.options_) === null || _e === void 0 ? void 0 : _e.autoAction) !==
                null && _f !== void 0
                ? _f
                : false,
            // https://github.com/mobxjs/mobx/discussions/3140
            ((_g = annotation.options_) === null || _g === void 0 ? void 0 : _g.bound)
                ? (_h = adm.proxy_) !== null && _h !== void 0
                    ? _h
                    : adm.target_
                : undefined
        ),
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
//# sourceMappingURL=actionannotation.js.map
