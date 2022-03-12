import { deepEqual } from "../internal"
function identityComparer(a, b) {
    return a === b
}
function structuralComparer(a, b) {
    return deepEqual(a, b)
}
function shallowComparer(a, b) {
    return deepEqual(a, b, 1)
}
function defaultComparer(a, b) {
    if (Object.is) return Object.is(a, b)
    return a === b ? a !== 0 || 1 / a === 1 / b : a !== a && b !== b
}
export const comparer = {
    identity: identityComparer,
    structural: structuralComparer,
    default: defaultComparer,
    shallow: shallowComparer
}
//# sourceMappingURL=comparer.js.map
