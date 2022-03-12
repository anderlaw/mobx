import { isFunction } from "../internal"
export function isAnnotation(thing) {
    return (
        // Can be function
        thing instanceof Object &&
        typeof thing.annotationType_ === "string" &&
        isFunction(thing.make_) &&
        isFunction(thing.extend_)
    )
}
export function isAnnotationMapEntry(thing) {
    return typeof thing === "boolean" || isAnnotation(thing)
}
//# sourceMappingURL=annotation.js.map
