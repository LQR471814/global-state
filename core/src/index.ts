import { Readable, Subscriber, Unsubscriber, Writable, writable } from "./store"

import { produce } from "immer"

export { Readable, Writable }

type WithoutFirst<T> = T extends (arg0: any, ...rest: infer R) => any ? R : never
export type Updater<S> = (s: S, ...parameters: any) => void
export type Updaters<S> = {
    [key: string]: Updater<S>
}
export type Reflector<S, T> = (s: S, value: T) => void

export type Store<S, R extends Updaters<S> | undefined> = {
    select: <T, RE extends (Reflector<S, T> | undefined), TR extends (Updaters<T> | undefined)>(
        selector: (s: S) => T,
        ...args: RE extends undefined ? [
            reflect: Reflector<S, T>,
            reducers: TR,
        ] : []
    ) => Store<T, TR>,
    subscribe: (subscriber: Subscriber<S>) => Unsubscriber,
    update: (updater: (s: S) => S) => void
} & (R extends Updaters<S> ? {
    actions: {
        [key in keyof R]: (
            ...parameters: WithoutFirst<R[key]>
        ) => ReturnType<R[key]>
    },
} : {})

export function store<S, R extends Updaters<S> | undefined>(
    initialState: S, ...args: R extends Updaters<S> ? [reducers: R] : []
): Store<S, R> {
    const [reducers] = args

    const state = writable<S>(initialState)
    let currentState: S
    state.subscribe(value => currentState = value)

    const s: Store<S, R> = {
        subscribe: state.subscribe,
        select: (selector, ...args) => {
            const [reflect, reducers] = args

            const derived = store(
                selector(currentState),
                ...(reducers !== undefined ? [reducers] : []),
            )
            if (reflect !== undefined) {
                derived.subscribe(value => {
                    state.set(produce(
                        currentState,
                        // potentially confusing syntax, this returns s
                        (s: S) => (reflect(s, value), s)
                    ))
                })
            }
            state.subscribe(s => derived.update(_ => selector(s)))
            return derived
        },
        update: (updater: (s: S) => S) => {
            state.set(produce(
                currentState,
                updater,
            ))
        },
        // ...(reducers !== undefined ? {
        //     actions: {},
        // } : {})
    }

    const actions: any = {}
    if (reducers !== undefined) {
        for (const k in reducers) {
            actions[k] = (...args: any) => {
                state.set(produce(
                    currentState,
                    (s: S) => reducers[k](s, ...args)
                ))
            }
        }
    }

    return s
}
