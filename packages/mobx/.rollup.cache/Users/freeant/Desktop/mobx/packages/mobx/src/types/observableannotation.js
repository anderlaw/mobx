import { deepEnhancer, die } from "../internal"
export function createObservableAnnotation(name, options) {
    return {
        annotationType_: name,
        options_: options,
        make_,
        extend_
    }
}
function make_(adm, key, descriptor) {
    return this.extend_(adm, key, descriptor, false) === null ? 0 /* Cancel */ : 1 /* Break */
}
function extend_(adm, key, descriptor, proxyTrap) {
    var _a, _b
    assertObservableDescriptor(adm, this, key, descriptor)
    return adm.defineObservableProperty_(
        key,
        descriptor.value,
        (_b = (_a = this.options_) === null || _a === void 0 ? void 0 : _a.enhancer) !== null &&
            _b !== void 0
            ? _b
            : deepEnhancer,
        proxyTrap
    )
}
function assertObservableDescriptor(adm, { annotationType_ }, key, descriptor) {
    if (__DEV__ && !("value" in descriptor)) {
        die(
            `Cannot apply '${annotationType_}' to '${adm.name_}.${key.toString()}':` +
                `\n'${annotationType_}' cannot be used on getter/setter properties`
        )
    }
}
//# sourceMappingURL=observableannotation.js.map
