import { Readable, Writable, writable } from "./store"

import { produce } from "immer"
export { Readable, Writable }


type WithoutFirst<T> = T extends (arg0: any, ...rest: infer R) => any ? R : never
export type Updater<S extends object> = (s: S, ...parameters: any) => void
export type Updaters<S extends object> = {
    [key: string]: Updater<S>
}
export type Store<S extends object, R extends Updaters<S>> = {
    select: <T>(selector: (s: S) => T) => Readable<T>,
    actions: {
        [key in keyof R]: (
            ...parameters: WithoutFirst<R[key]>
        ) => ReturnType<R[key]>
    }
}

export function store<S extends object, R extends Updaters<S>>(
    initialState: S, reducers: R
): Store<S, R> {
    let currentState = initialState

    const selectors: [(s: S) => any, Writable<any>][] = []
    const select: Store<S, R>["select"] = <T>(selector: (s: S) => T) => {
        const store = writable(selector(currentState))
        selectors.push([selector, store])
        return store
    }

    const updateState = (s: S) => {
        for (const [selector, store] of selectors) {
            const currentValue = selector(s)
            if (currentValue !== selector(currentState)) {
                store.set(currentValue)
            }
        }
        currentState = s
    }

    const actions: any = {}
    for (const k in reducers) {
        actions[k] = (...args: any) => {
            updateState(produce(
                currentState,
                (s: S) => reducers[k](s, ...args)
            ))
        }
    }

    return { select, actions }
}
