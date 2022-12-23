// * shamelessly copied from "svelte/types/runtime/store/index" to make this project framework agnostic

type Subscriber<T> = (value: T) => void
type Unsubscriber = () => void
type Updater<T> = (value: T) => T

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
        set(newValue) {
            value = newValue
            update()
        },
        subscribe(subscriber) {
            subscribers.add(subscriber)
            subscriber(value)
            return () => {
                subscribers.delete(subscriber)
            }
        },
        update(updater) {
            value = updater(value)
            update()
        },
    }
}
