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
    newPost: (state, post: Post) => {
        state.posts.push(post)
    },
})