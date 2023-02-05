import { Store, store } from "@global-state/core/src/index.js"

import { Updaters } from "@global-state/core"
import { get } from "@global-state/core/src/store.js"

type TestOptions<S, T> = {
    initial: S
    update: (value: S) => S
    selector: (value: S) => T
    reflect: (state: S, value: T) => S
    actions: Updaters<S>
    derivedActions: Updaters<T>
    derivedUpdate: (value: T) => T
}

type StoreState<S> = Partial<{
    unsubscribe: () => void
    lastState: S
    currentState: S
}>

// true: assert lastState == currentState, false is the opposite
const checkMutations = <S>(
    name: string,
    tests: {
        [key: string]: ((s: StoreState<S>) => boolean | null)
    }
) => {
    describe(name, () => {
        const state: StoreState<S> = {}
        for (const t in tests) {
            it(t, () => {
                state.lastState = state.currentState
                const result = tests[t](state)
                if (result === null) {
                    return
                }
                if (result) {
                    expect(state.currentState).toEqual(state.lastState)
                    return
                }
                expect(state.currentState).not.toEqual(state.lastState)
            })
        }
    })
}

describe("selectable store", () => {
    const testStore = <S, T>(opts: TestOptions<S, T>) => {
        // const log = (v: any) => console.log(v)
        const log = (v: any) => {}

        const s = store(opts.initial)
        s.subscribe(log)

        const baseStore = (s: Store<S>) => ({
            "should get a value instantly on subscription": (state: StoreState<S>) => {
                state.unsubscribe = s.subscribe(value => {
                    state.currentState = value
                })
                return false
            },
            "should change value using update()": (state: StoreState<S>) => {
                s.update(_ => opts.update(state.currentState!))
                return false
            },
            "should unsubscribe and not change value": (state: StoreState<S>) => {
                state.unsubscribe!()
                s.update(_ => opts.update(state.currentState!))
                return true
            }
        })

        checkMutations<S>("direct store mutations", baseStore(s))

        const actionStore = store(opts.initial, opts.actions)
        actionStore.subscribe(log)
        checkMutations<S>("action based mutations", baseStore(actionStore))
        describe("change store using actions", () => {
            let lastState: S | undefined
            let currentState: S | undefined
            for (const k in opts.actions) {
                lastState = currentState
                it(`should ${k}`, () => {
                    actionStore.actions[k]()
                    currentState = get(actionStore)
                    expect(currentState).not.toEqual(lastState)
                })
            }
        })

        const baseDerived = (derived: Store<T, undefined, true>) => ({
            "should get a value instantly on subscription": (state: StoreState<T>) => {
                state.unsubscribe = derived.subscribe(value => {
                    state.currentState = value
                })
                return false
            },
            "should update when parent updates()": (state: StoreState<T>) => {
                s.update(() => opts.update(get(s)))
                state.currentState = get(derived)
                return false
            },
        })

        const derivedReadonly = s.select(opts.selector)
        derivedReadonly.subscribe(log)
        checkMutations<T>("readonly derived store mutations", {
            ...baseDerived(derivedReadonly),
            "should not have update() method": () => {
                expect(derivedReadonly).not.toHaveProperty("update")
                return null
            }
        })

        const derived = s.select(opts.selector, opts.reflect)
        derived.subscribe(log)
        checkMutations<T>("derived store mutations", {
            ...baseDerived(derived),
            "should reflect changes to parent": (state) => {
                state.currentState = opts.derivedUpdate(get(derived))
                derived.update(() => state.currentState!)
                return false
            },
        })

        const derivedActions = s.select(
            opts.selector, opts.reflect,
            opts.derivedActions,
        )
        derivedActions.subscribe(log)
        describe("change derived store using actions", () => {
            let lastState: T | undefined
            let currentState: T | undefined
            for (const k in opts.derivedActions) {
                lastState = currentState
                it(`should ${k}`, () => {
                    derivedActions.actions[k]()
                    currentState = get(derivedActions)
                    expect(currentState).not.toEqual(lastState)
                })
            }
        })
    }

    describe("store with a primitive value", () => testStore({
        initial: 0,
        update: s => s + 1,
        selector: (s) => {
            if (s > 10) {
                return s + 1
            }
            return s - 1
        },
        reflect: (_, value) => {
            return value
        },
        actions: {
            addBy2: (s) => {
                return s + 2
            },
            addBy3: (s) => {
                return s + 3
            }
        },
        derivedActions: {
            subtract: (s) => {
                if (!s) {
                    return 0
                }
                return s - 1
            }
        },
        derivedUpdate: s => s + 1,
    }))
    describe("store with a primitive value", () => testStore({
        initial: {
            what: "string",
            nest: {
                nestedValue: 0
            }
        },
        update: s => ({
            what: Math.random().toString(36).slice(2),
            nest: {
                nestedValue: s.nest.nestedValue + 1
            }
        }),
        selector: s => s.nest.nestedValue,
        reflect: (s, v) => (s.nest.nestedValue = v, s),
        actions: {
            randomizeWhat: (s) => {
                s.what = Math.random().toString(36).slice(2)
            },
        },
        derivedActions: {
            randomizeValue: (s) => {
                return Math.random().toString(36).slice(2)
            }
        },
        derivedUpdate: s => s + 2
    }))
})