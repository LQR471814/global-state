import { Readable, Subscriber, Unsubscriber, Writable, writable } from "./store"

import { produce } from "immer"

export { Readable, Writable }

type WithoutFirst<T> = T extends (arg0: any, ...rest: infer R) => any ? R : never
export type Updater<S> = (s: S, ...parameters: any) => void
export type Updaters<S> = {
    [key: string]: Updater<S>
} | undefined
export type Store<S, R extends Updaters<S>> = {
    select: <T, TR extends Updaters<T>>(
        selector: (s: S) => T, reducers: TR
    ) => Store<T, TR>,
    actions: R extends object ? {
        [key in keyof R]: (
            ...parameters: WithoutFirst<R[key]>
        ) => ReturnType<R[key]>
    } : never,
    subscribe: (subscriber: Subscriber<S>) => Unsubscriber,
}

export function store<S, R extends Updaters<S>>(
    initialState: S, reducers: R,
): Store<S, R> {
    const state = writable(initialState)
    let currentState: S
    state.subscribe(value => currentState = value)

    const select: Store<S, R>["select"] = <T, TR extends Updaters<T>>(
        selector: (s: S) => T, reducers: TR
    ): Store<T, TR> => store<T, TR>(selector(currentState), reducers)

    const actions: any = {}
    for (const k in reducers) {
        actions[k] = (...args: any) => {
            state.set(produce(
                currentState,
                (s: S) => reducers[k](s, ...args)
            ))
        }
    }

    return {
        subscribe: state.subscribe,
        select, actions
    }
}
