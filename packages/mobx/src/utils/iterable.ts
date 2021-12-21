/**
 * 给迭代器对象添加Symbol.iterator属性，使之成为可迭代的迭代器
 * IterableIterator：遵循可迭代协议的：有一个`Symbol.iterator`属性
 * Iterator:遵循迭代器协议
 * @param iterator
 */
export function makeIterable<T>(iterator: Iterator<T>): IterableIterator<T> {
    iterator[Symbol.iterator] = getSelf
    return iterator as any
}

function getSelf() {
    return this
}
