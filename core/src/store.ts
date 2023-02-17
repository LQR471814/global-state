import { produce } from "immer"

export type Subscriber<T> = (value: T) => void
export type Unsubscriber = () => void
export type Updater<T> = (value: T) => T | void

/** Readable interface for subscribing. */
export interface Readable<T> {
    subscribe(subscriber: Subscriber<T>): Unsubscriber;
}

/** Writable interface for both updating and subscribing. */
export interface Writable<T> extends Readable<T> {
    update(updater: Updater<T>): void;
}

export function writable<T>(initial: T): Writable<T> {
    let value: T = initial
    const subscribers = new Set<Subscriber<T>>()
    const update = () => {
        for (const s of subscribers) {
            s(value)
        }
    }
    return {
        subscribe(subscriber) {
            subscribers.add(subscriber)
            subscriber(value)
            return () => {
                subscribers.delete(subscriber)
            }
        },
        update(updater) {
            const newValue = produce(value, updater)
            if (newValue === value) {
                return
            }
            value = newValue
            update()
        },
    }
}

export function get<T>(readable: Readable<T>): T {
    let result: T
    const unsubscribe = readable.subscribe(value => {
        result = value
    })
    unsubscribe()
    return result!
}

export function sync<T>(
    ...writables: (Writable<T> | [Writable<T>, number])[]
): () => void {
    const subscriptions: (() => void)[] = []

    const iterate = (callback: (writable: Writable<T>, weight: number) => void) => {
        for (const w of writables) {
            if (Array.isArray(w)) {
                callback(w[0], w[1])
                continue
            }
            callback(w, 0)
        }
    }

    iterate((source, sourcePriority) => {
        iterate((incoming, incomingPriority) => {
            if (incoming === source) {
                return
            }
            if (incomingPriority >= sourcePriority) {
                subscriptions.push(incoming.subscribe(value => {
                    source.update(() => value)
                }))
            }
        })
    })

    return () => {
        for (const unsubscribe of subscriptions) {
            unsubscribe()
        }
    }
}
