import { get, writable } from "@global-state/core/src/store.js"

import { Writable } from "@global-state/core"

describe("writable store", () => {
    const obj = writable({
        test: "values",
        nest: { nest: { nest: {} } }
    })
    const primitive = writable(0)

    const testWritable = <T>(store: Writable<T>, update: (value: T) => T) => {
        let unsubscribe: () => void
        let lastState: T | undefined
        let currentState: T | undefined
        let mutations = 0

        it("should get a value instantly on subscription", () => {
            unsubscribe = store.subscribe(value => {
                currentState = value
                mutations++
            })
            expect(typeof currentState).not.toEqual("undefined")
        })

        it("should change value using set()", () => {
            lastState = currentState
            store.set(update(currentState!))
            expect(currentState).not.toEqual(lastState)
        })

        it("should change value using update()", () => {
            lastState = currentState
            store.update(_ => update(currentState!))
            expect(currentState).not.toEqual(lastState)
        })

        it("should unsubscribe and not change value", () => {
            lastState = currentState
            unsubscribe()
            store.set(update(currentState!))
            expect(lastState).toEqual(currentState)
        })

        it("should not update when assigned the same value", () => {
            let mutationsBefore = mutations
            store.set(currentState!)
            let mutationsAfter = mutations
            expect(mutationsBefore).toEqual(mutationsAfter)
        })
    }

    describe(
        "works with primitive values",
        () => testWritable(primitive, value => value + 1),
    )

    describe(
        "works with object values",
        () => testWritable(obj, value => {
            return {
                test: (Math.random() + 1).toString(36).substring(7),
                nest: { nest: { nest: {} } }
            }
        }),
    )
})

test("get function", () => {
    const primitive = writable(17)
    expect(get(primitive)).toEqual(17)
    primitive.set(57)
    expect(get(primitive)).toEqual(57)
    expect(get(primitive)).toEqual(57)
})
