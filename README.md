## global state

> a <200 line, fully-typed, framework-agnostic, immutable, global state focused on simplicity and scalability.

### documentation & examples

- documentation can be found [here](docs/docs.md)
- a full example can be found [here](example/src)

```typescript
import { store } from "@global-state/core"

const state = store({
    authenticated: false,
    name: "",
}, {
    changeName: (s, newName) => {
        s.name = newName
    }
})
const unsubscribe = state.subscribe(value => console.log(value))
state.actions.changeName("to a new value")

/*
{ authenticated: false, name: "" }
{ authenticated: false, name: "to a new value" }
*/
```

### drivers

it can be said that managing subscriptions to state becomes cumbersome. so driver packages were written to encapsulate the logic of managing state subscriptions for different frameworks.

| framework | driver package |
| --- | --- |
| Svelte | works directly with `@global-store/core`, this package's store implements a svelte `Writable` |
| React | `useReadable(state.select(s => ...))` from `@global-store/react-driver` |

if you are unable to find an existing driver package for your framework it is easy to write one based on the `Readable` interface exported from `@global-store/core`.
