import { Writable, writable } from "@global-state/core"

export function persistent<T>(key: string, initial: T): Writable<T> {
    const value = writable(initial)

    const read = (encoded: string) => {
        try {
            const parsed = JSON.parse(encoded)
            value.update(() => parsed)
        } catch (err) {
            console.warn(
                `could not parse the value corresponding to "${key}"\n`,
                `it had a value of ${encoded}\n`,
                `the error was ${err}`,
            )
            value.update(() => initial)
        }
    }

    value.subscribe(s => {
        localStorage.setItem(key, JSON.stringify(s))
    })

    const loaded = localStorage.getItem(key)
    if (loaded !== null) {
        read(loaded)
    }

    const listener = (e: StorageEvent) => {
        if (e.key !== key || e.newValue === null) {
            return
        }
        read(e.newValue)
    }
    window.addEventListener("storage", listener)

    return value
}

export function mediaQuery<T>(query: string, initial: T, transform: (value: T, matched: boolean) => T): Writable<T> {
    const value = writable(initial)

    const match = window.matchMedia(query)
    value.update(v => transform(v, match.matches))
    match.addEventListener("change", ({ matches }) => {
        value.update(v => transform(v, matches))
    })

    return value
}

export function theme<T>(initial: T, transform: (value: T, prefers: "light" | "dark") => T): Writable<T> {
    return mediaQuery(
        "(prefers-color-scheme: light)", initial,
        (value, matched) => {
            return transform(value, matched ? "light" : "dark")
        },
    )
}
