//somewhere in your UI
import { state } from "./state.js"

// ...

// * subscribing to state
const unsubscribe = state.subscribe(s => {
    console.log(s)
})

// * devolving state
const authenticated = state.select(
    s => s.authenticated,
    (s, v) => {
        s.authenticated = v
    },
    {
        authenticate: () => true
    },
)
authenticated.subscribe(isAuthenticated => {
    console.log("[authenticated]", isAuthenticated)
})

// * mutating state
authenticated.actions.authenticate()
state.actions.newPost({
    author: "author's name",
    content: "some content",
})
