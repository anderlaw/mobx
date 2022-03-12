import { action, autorun, makeObservable, observable } from "./mobx"
class Count {
    constructor() {
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "Hello"
        })
        Object.defineProperty(this, "value", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        })
        makeObservable(this, {
            value: observable,
            increment: action
        })
        autorun(a => console.log(a, this.value))
    }
    increment() {
        this.value++
    }
}
const count = new Count()
document.querySelector("button").onclick = () => {
    count.increment()
}
//# sourceMappingURL=learn-entry.js.map
