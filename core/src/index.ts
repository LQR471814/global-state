import { Readable, Subscriber, Unsubscriber, Writable, get, writable, sync } from "./store.js"
export { Readable, Subscriber, Unsubscriber, Writable, get, writable, sync }

type WithoutFirst<T> = T extends (arg0: any, ...rest: infer R) => any ? R : never
export type Updater<S> = (s: S, ...parameters: any) => void
export type Updaters<S> = {
    [key: string]: Updater<S>
}
export type Reflector<S, T> = (s: S, value: T) => S | void

type MutableArgOpt<S, T> = [reflect: Reflector<S, T>, actions: Updaters<T>] | [reflect: Reflector<S, T>]

export type DevolvedStore<S, T, A extends MutableArgOpt<S, T> | []> =
    Store<T, A[1], A extends MutableArgOpt<S, T> ? false : true> & {
        detach: () => void
    }

export type StoreType<T> = T extends Store<infer S> ? S : never

export type Store<S, R extends Updaters<S> | undefined = undefined, Readonly extends boolean = false> = {
    select: <T, A extends MutableArgOpt<S, T> | []>(
        selector: (s: S) => T, ...args: A
    ) => DevolvedStore<S, T, A>,
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

    const select = <T, A extends MutableArgOpt<S, T> | []>(
        selector: (s: S) => T, ...args: A
    ): DevolvedStore<S, T, A> => {
        const [reflect, reducers] = args

        const derived = store<T, [Updaters<T>]>(
            selector(currentState),
            reducers ?? {},
        )

        const unsubscribers: (() => void)[] = []

        if (reflect !== undefined) {
            unsubscribers.push(derived.subscribe(value => {
                state.update((s) => (reflect(s, value), s))
            }))
        }
        unsubscribers.push(state.subscribe(
            s => derived.update(_ => selector(s))
        ))

        return {
            select: derived.select,
            subscribe: derived.subscribe,
            detach: () => {
                for (const s of unsubscribers) {
                    s()
                }
            },
            ...(reflect !== undefined ? {
                update: derived.update,
            } : {}),
            ...(reducers !== undefined ? {
                actions: derived.actions,
            } : {}),
        } as unknown as DevolvedStore<S, T, A>
    }

    const [arg] = args

    return {
        subscribe: state.subscribe,
        select: select,
        ...(typeof arg === "object" || !arg ? {
            update: (updater: (s: S) => S | void) => {
                state.update(updater)
            },
        } : {}),
        ...(typeof arg === "object" ? {
            actions: (() => {
                const actions: any = {}
                for (const k in arg) {
                    actions[k] = (...args: any) => {
                        state.update((s) => arg[k](s, ...args))
                    }
                }
                return actions
            })()
        } : {})
    } as StoreReturns<S, Args>
}
