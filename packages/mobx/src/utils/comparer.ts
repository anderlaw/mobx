import { deepEqual } from "../internal"

//相等比较接口
export interface IEqualsComparer<T> {
    (a: T, b: T): boolean
}
//地址比较
function identityComparer(a: any, b: any): boolean {
    return a === b
}
//结构比较
function structuralComparer(a: any, b: any): boolean {
    return deepEqual(a, b)
}
//浅比较
function shallowComparer(a: any, b: any): boolean {
    return deepEqual(a, b, 1)
}

//defaultComparer(NaN,NaN) ==> true
function defaultComparer(a: any, b: any): boolean {
    //借助Object.is来比较
    if (Object.is) return Object.is(a, b)

    /**
     * 1。0 === -0
     * 2。NaN !== NaN
     */
    return a === b ? a !== 0 || 1 / a === 1 / b : a !== a && b !== b
}

export const comparer = {
    identity: identityComparer,
    structural: structuralComparer,
    default: defaultComparer,
    shallow: shallowComparer
}
