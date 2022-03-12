import { action, autorun, makeObservable, observable } from "./mobx"

class Count {
    name = "Hello"
    value = 0
    constructor() {
        makeObservable(this, {
            value: observable,
            increment: action
        })
        debugger
        autorun(a => console.log(a, this.value))
    }
    increment() {
        this.value++
    }
}
const count = new Count()

declare let document
document.querySelector("button").onclick = () => {
    count.increment()
}
