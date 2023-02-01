//somewhere in your UI
import { state } from "./state"

// ...

// * subscribing to state
const unsubscribe = state.subscribe(s => {
    console.log(s)
})

// * devolving state
const authenticated = state.select(s => s.authenticated, {
    authenticate: () => true,
})
authenticated.subscribe(isAuthenticated => {
    console.log(isAuthenticated)
})

// * mutating state
authenticated.actions.authenticate()
state.actions.newPost({
    author: "author's name",
    content: "some content",
})
