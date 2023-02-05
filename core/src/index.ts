import { Readable, Subscriber, Unsubscriber, Writable, get, writable } from "./store.js"

import { produce } from "immer"

export { Subscriber, Unsubscriber, Readable, Writable, writable, get }

type WithoutFirst<T> = T extends (arg0: any, ...rest: infer R) => any ? R : never
export type Updater<S> = (s: S, ...parameters: any) => void
export type Updaters<S> = {
    [key: string]: Updater<S>
}
export type Reflector<S, T> = (s: S, value: T) => S | void

type MutableArgOpt<S, T> = [reflect: Reflector<S, T>, actions: Updaters<T>] | [reflect: Reflector<S, T>]
export type Store<S, R extends Updaters<S> | undefined = undefined, Readonly extends boolean = false> = {
    select: <T, A extends MutableArgOpt<S, T> | []>(
        selector: (s: S) => T, ...args: A
    ) => Store<T, A[1], A extends MutableArgOpt<S, T> ? false : true>,
    subscribe: (subscriber: Subscriber<S>) => Unsubscriber,
}
    & (Readonly extends false ? R extends Updaters<S> ? {
        actions: {
            [key in keyof R]: (
                ...parameters: WithoutFirst<R[key]>
            ) => ReturnType<R[key]>
        },
    } : {} : {})
    & (Readonly extends false ? {
        update: (updater: (s: S) => S | void) => void
    } : {})

type StoreArgs<S> = [actions: Updaters<S>] | []
type StoreReturns<S, Args extends StoreArgs<S>> = Store<
    S, Args[0] extends Updaters<S> ? Args[0] : undefined,
    Args[0] extends true ? true : false
>
export function store<S, Args extends StoreArgs<S>>(
    initialState: S, ...args: Args
): StoreReturns<S, Args> {
    const state = writable<S>(initialState)
    let currentState: S
    state.subscribe(value => currentState = value)

    type DevolvedStore<T, A extends MutableArgOpt<S, T> | []> =
        Store<T, A[1], A extends MutableArgOpt<S, T> ? false : true>
    const select = <T, A extends MutableArgOpt<S, T> | []>(
        selector: (s: S) => T, ...args: A
    ): DevolvedStore<T, A> => {
        const [reflect, reducers] = args

        const derived = store<T, [Updaters<T>]>(
            selector(currentState),
            reducers ?? {},
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

        return {
            select: derived.select,
            subscribe: derived.subscribe,
            ...(reflect !== undefined ? {
                update: derived.update,
            } : {}),
            ...(reducers !== undefined ? {
                actions: derived.actions,
            } : {})
        } as DevolvedStore<T, A>
    }

    const [arg] = args

    return {
        subscribe: state.subscribe,
        select: select,
        ...(typeof arg === "object" || !arg ? {
            update: (updater: (s: S) => S | void) => {
                state.set(produce(
                    currentState,
                    updater,
                ))
            },
        } : {}),
        ...(typeof arg === "object" ? {
            actions: (() => {
                const actions: any = {}
                for (const k in arg) {
                    actions[k] = (...args: any) => {
                        state.set(produce(
                            currentState,
                            (s: S) => arg[k](s, ...args)
                        ))
                    }
                }
                return actions
            })()
        } : {})
    } as StoreReturns<S, Args>
}
