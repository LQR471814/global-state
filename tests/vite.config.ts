/// <reference types="vitest" />

import { defineConfig } from "vite"

export default defineConfig({
    test: {
        coverage: {
            provider: "c8",
            allowExternal: true
        },
        globals: true,
    }
})