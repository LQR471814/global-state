// * a blatant ripoff of svelte stores
// * a custom implementation of writable() is added here
// * for the library to remain framework agnostic

export type Subscriber<T> = (value: T) => void
export type Unsubscriber = () => void
export type Updater<T> = (value: T) => T

/** Readable interface for subscribing. */
export interface Readable<T> {
    subscribe(subscriber: Subscriber<T>): Unsubscriber;
}

/** Writable interface for both updating and subscribing. */
export interface Writable<T> extends Readable<T> {
    set(value: T): void;
    update(updater: Updater<T>): void;
}

export function writable<T>(initial: T): Writable<T> {
    let value = initial
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
        set(newValue) {
            if (newValue === value) {
                return
            }
            value = newValue
            update()
        },
        update(updater) {
            const newValue = updater(value)
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
