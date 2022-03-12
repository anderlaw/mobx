import { die } from "../internal"
export function createComputedAnnotation(name, options) {
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
    assertComputedDescriptor(adm, this, key, descriptor)
    return adm.defineComputedProperty_(
        key,
        Object.assign(Object.assign({}, this.options_), {
            get: descriptor.get,
            set: descriptor.set
        }),
        proxyTrap
    )
}
function assertComputedDescriptor(adm, { annotationType_ }, key, { get }) {
    if (__DEV__ && !get) {
        die(
            `Cannot apply '${annotationType_}' to '${adm.name_}.${key.toString()}':` +
                `\n'${annotationType_}' can only be used on getter(+setter) properties.`
        )
    }
}
//# sourceMappingURL=computedannotation.js.map
