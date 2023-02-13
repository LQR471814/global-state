import { get, sync, writable, Writable } from "@global-state/core/src/store.js"

describe("writable store", () => {
    const initialObj = {
        test: "values",
        nest: { nest: { nest: {} } }
    }
    const obj = writable(initialObj)
    const primitive = writable(0)

    const testWritable = <T>(
        store: Writable<T>,
        update: (value: T) => T,
        mutate: (value: T) => void,
    ) => {
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
            store.update(update)
            expect(currentState).not.toEqual(lastState)
        })

        it("should change value when mutating using update()", () => {
            lastState = currentState
            store.update(mutate)
            expect(currentState).not.toEqual(lastState)
        })

        it("should unsubscribe and not change value", () => {
            lastState = currentState
            unsubscribe()
            store.set(update(currentState!))
            expect(lastState).toEqual(currentState)
        })

        it("should not update when assigned the same value", () => {
            const mutationsBefore = mutations
            store.set(currentState!)
            expect(mutationsBefore).toEqual(mutations)
        })
    }

    describe(
        "works with primitive values",
        () => testWritable<number>(
            primitive,
            value => value + 1,
            value => value + 1,
        ),
    )

    describe(
        "works with object values",
        () => testWritable<typeof initialObj>(
            obj,
            () => {
                return {
                    test: (Math.random() + 1).toString(36).substring(7),
                    nest: { nest: { nest: {} } }
                }
            },
            (value) => {
                value.test = (Math.random() + 1).toString(36).substring(7)
            }
        ),
    )
})

test("get function", () => {
    const primitive = writable(17)
    expect(get(primitive)).toEqual(17)
    primitive.set(57)
    expect(get(primitive)).toEqual(57)
    expect(get(primitive)).toEqual(57)
})

test("sync writables one way", () => {
    const state = writable(0)
    const counter = {
        mutations: 0,
        subscribe: () => () => { },
        set() {
            this.mutations++
        },
        update() {
            this.mutations++
        }
    }

    const unsubscribe = sync(state, counter)

    expect(counter.mutations).toEqual(1)

    state.set(10)
    expect(counter.mutations).toEqual(2)

    state.update(() => 15)
    expect(counter.mutations).toEqual(3)

    unsubscribe()
    state.set(20)
    expect(counter.mutations).toEqual(3)
})

test("sync writables two ways", () => {
    const s1 = writable(0)
    const s2 = writable(1)

    let s1Mutations = 0
    let s2Mutations = 0

    s1.subscribe(() => s1Mutations++)
    s2.subscribe(() => s2Mutations++)

    const unsubscribe = sync(s1, s2)

    expect(get(s1)).toEqual(get(s2))

    s1.set(4)
    expect(get(s1)).toEqual(get(s2))

    s1.update(() => 5)
    expect(get(s1)).toEqual(get(s2))

    s2.set(2)
    expect(get(s1)).toEqual(get(s2))

    s2.update(() => 7)
    expect(get(s1)).toEqual(get(s2))

    unsubscribe()

    // s2Mutations should be 1 more than s1Mutations
    // because s2 is mutated once implicitly from the
    // initial value of s1
    expect(s1Mutations).toEqual(s2Mutations+1)

    s1.set(6)
    expect(get(s1)).not.toEqual(get(s2))
})
