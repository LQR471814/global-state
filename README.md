## global state

> a tiny, framework-agnostic, immutable, global state based on the flux architecture.

### creating a store

```typescript
//state.ts
import { store } from "../src/index"

type Post = {
    author: string
    content: string
}

type State = {
    authenticated: boolean
    username: string
    posts: Post[]
}

const initial: State = {
    authenticated: false,
    username: "",
    posts: [],
}

export const state = store(initial, {
    authenticate: (state) => {
        // direct mutations are made immutable with immer
        state.authenticated = true
    },
    newPost: (state, post: Post) => {
        state.posts.push(post)
    },
})
```

### mutating state

```typescript
//app.ts
import { state } from "./state"

// ...

state.actions.newPost({
    author: "author's name",
    content: "some content",
})
```

### subscribing to and devolving state

```typescript
//app.ts
const unsubscribe = state.subscribe(s => {
    console.log(s)
})

const authenticated = state.select(s => s.authenticated, {})
authenticated.subscribe(isAuthenticated => {
    console.log(isAuthenticated)
})
state.actions.authenticate()
unsubscribe()
```

the selected state will only call the callback passed to `.subscribe()` when the value the callback passed to `.select()` changes (this works efficiently for objects as well because of immutability).

however, it can be said that managing this selected state becomes cumbersome. so driver packages were written to encapsulate the logic for different frameworks.

| framework | driver package |
| --- | --- |
| Svelte | works directly with `@global-store/core` |
| React | `useReadable(state.select(s => ...))` from `@global-store/react-driver` |

if you are unable to find an existing driver package for your framework it is easy to write one based on the `Readable` interface exported from `@global-store/core`.
