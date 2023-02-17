## docs

> a more detailed documentation of the API.

### stores

> this is taken from svelte stores.

the **store** is the main concept of this library, it represents a value that reports when it is changed. it can be subscribed to and updated.

### actions

> this is taken from redux.

actions allow you to define a set of methods for mutating state in a way that's easy to organize and track.

this feature is essentially syntatic sugar since you can just define external methods that take in a store and parameters and call the `update()` function on the store. however it is the preferred way to mutate state as it combines the methods to mutate state with the state itself.

### immutable updates

you do not need to use immutable update syntax within the `update()` methods of `store` or `Writable`. immer will convert your mutations to an immutable object. however do note that [restrictions](https://immerjs.github.io/immer/return) on returning values from the function apply.

### devolving state

> this is taken from svelte's `derived()` stores and redux's `useSelector()`.

devolution: the transfer or delegation of power to a lower level, especially by central government to local or regional administration.

in this context, devolution would refer to the creation of a new store based on a value extracted from another store. this process is also referred to as "selecting".

this new store would only report when the value it's based on changes, and its mutations would be scoped to the value it's based on.

### the store constructor

#### `store(initialState)`

> create a writable store with an initial value.

- `initialState` is the initial value of the state

```typescript
const state = store(0)
const unsubscribe = state.subscribe(value => console.log(value))
state.update(v => v + 1)
unsubscribe()
// 0
// 1
```

#### `store(initialState, actions)`

> create a writable store with actions to modify it.

- `actions` is an object with every key mapping to a function. each function's first argument will be the current value of the state. these functions will be made available under the `actions` key in the constructed store.

```typescript
const state = store(0, {
  add: (s, delta: number) => {
    return s + delta
  }
})
state.subscribe(value => console.log(value))
state.actions.add(2)
// 0
// 2
```

### the select function

#### `store.select(value => extractedValue): store`

> create a readonly store based on a value from another store.

- `value` is the current state of the store.
- `extractedValue` is the value of the new store, it will change when the function passed to `select()` changes value.
- **note:** the store returned does not contains `update()` or `actions()` because a function to write updated values to the original store hasn't been specified.

```typescript
const state = store({
  name: "initial name",
  nested: {
    value: 0,
  }
})

const nestedValue = state.select(s => s.nested.value)
nestedValue.subscribe(s => console.log(s))

state.update(s => {
  s.name = "new name"
})

state.update(s => {
  s.nested.value += 1
}) 
// 1
```

#### `store.select(value => extractedValue, (value, extractedValue) => newValue | void): store`

> create a writable store based on a value from another store.

- `value` is the current state of the store.
- `extractedValue` is the value of the new store.
- `newValue` is the new value of the store.

```typescript
const state = store({
  name: "initial name",
  nested: {
    value: 0,
  }
})

state.subscribe(s => console.log(s.nested.value))

const nestedValue = state.select(
  s => s.nested.value,
  (s, v) => s.nested.value = v,
)

nestedValue.update(() => 5)
// 5
```

#### `store.select(value => extractedValue, (value, extractedValue) => newValue | void, actions): store`

> create a writable store based on a value from another store with actions.

- `actions` is an object containing actions to be added to the new store.

```typescript
const state = store({
  name: "initial name",
  nested: {
    value: 0,
  }
})

state.subscribe(s => console.log(s.nested.value))

const nestedValue = state.select(
  s => s.nested.value,
  (s, v) => s.nested.value = v,
  {
    add: s => s + 1
  }
)

nestedValue.actions.add()
// 1
```

### store methods

#### `store.subscribe(value => void): () => void`

> subscribe to state changes

- `value` is the new state of the store.
- `() => void` can be called to unsubscribe.
- **note:** the callback passed is always called once immediately upon the invocation of `subscribe()` with the value of the store.

```typescript
let name = ""
const unsubscribe = store.subscribe((value) => {
  name = value
})
unsubscribe()
```

#### `store.update(value => newValue | void)`

> update the state

- `value` is the current state of the store.
- `newValue` is the new value of the store.

```typescript
store.update((current) => {
  return current + 1
})
```

#### `store.select(...): ...`

> select a store, see the definition under "store constructors"

#### `store.actions.<actionName>(parameters...)`

> call actions on the store

- `actionName` is the name of the action you defined when constructing the store.
- `parameters...` are the parameters (if any) to be passed to the action.

```typescript
store.actions.setAuthenticated(true)
```

### other functions

#### `interface Readable`

> Readable represents a reactive value, it informs subscribers when it changes.

- `subscribe((value) => void)` calls the passed callback with the current value immediately on invocation and when the value is changed.

#### `interface Writable extends Readable`

> Writable is a Readable that exports methods to change it's value.

- `update((currentValue) => value)` sets the value of the writable with the value returned by the callback, it abides by "immutable updates" rules.

#### `writable(initialValue): value`

> writable is an implementation of `Writable`.

- `initialValue` is the initial value of the writable
- `value` is a value that implements `Writable`

```typescript
const state = writable(0)
state.subscribe(value => {
  console.log(value)
})

state.update(v => v + 1)
// 0
// 1
```

#### `get(writable): value`

> read the current value of a store. this works by subscribing to the store, grabbing a value, then immediately unsubscribing.

- `writable` is a value that implements `Writable`
- `value` is the value of the store

```typescript
const state = writable(0)
get(state) // 0
```

#### `sync(writable | [writable, number]...)`

> syncronize values between stores. a new value from any store will update all the other store's values.

- `writable | [writable, number]...` are any number of writables or tuples.
  - when a tuple is provided, the number indicates the writable's `weight`. stores with lower `weight` cannot update values of writables with higher `weight`.
  - by default, all writables have a weight of `0`.

```typescript
const s1 = writable(0)
const s2 = writable(1)

const unsync = sync(s1, s2)
get(s1) === get(s2) // true

unsync()
```
