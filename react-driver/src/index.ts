import { useEffect, useState } from "react"

import { Readable } from "@global-state/core";

export function useReadable<T>(readable: Readable<T>): T {
    const [value, setValue] = useState<T>()
    const unsubscribe = readable.subscribe((value: T) => setValue(value))
    useEffect(() => unsubscribe)
    return value!
}
