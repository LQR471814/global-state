## docs

> a more detailed documentation of the API.

### stores

> this is taken from svelte stores.

the **store** is the main concept of this library, it represents a value that reports when it is changed. it can be subscribed to and updated.

### actions

> this is taken from redux.

actions allow you to define a set of methods for mutating state in a way that's easy to organize and track.

this feature is essentially syntatic sugar since you can just define external methods that take in a store and parameters and call the `update()` function on the store. however it is the preferred way to mutate state as it combines the methods to mutate state with the state itself.

### devolving state

> this is taken from svelte's `derived()` stores and redux's `useSelector()`.

devolution: the transfer or delegation of power to a lower level, especially by central government to local or regional administration.

in this context, devolution would refer to the creation of a new store based on a value extracted from another store. this process is also referred to as "selecting".

this new store would only report when the value it's based on changes, and its mutations would be scoped to the value it's based on.

### store methods

#### `store.subscribe(value => void): () => void`

> subscribe to state changes

- `value` is the new state of the store
- `() => void` can be called to unsubscribe
- **note:** the callback passed is always called once immediately upon the invocation of `subscribe()` with the value of the store.

#### `store.update(value => newValue | void)`

> update the state

- `value` is the current state of the store
- `newValue` is the new value of the store

#### `store.select(...): ...`

> select a store, see the definition under "store constructors"

#### `store.actions.<actionName>(parameters...)`

> call actions on the store

- `actionName` is the name of the action you defined when constructing the store.
- `parameters...` are the parameters (if any) to be passed to the action

### the store constructor

**note:** all functions that mutate state can mutate the value passed to them directly. `immer` will do some magic and convert the object into a new immutable value.

#### `store(initialState)`

> create a writable store with an initial value.

- `initialState` is the initial value of the state

#### `store(initialState, actions)`

> create a writable store with actions to modify it.

- `actions` is an object with every key mapping to a function. each function's first argument will be the current value of the state. these functions will be made available under the `actions` key in the constructed store.

### the select function

#### `store.select(value => extractedValue): store`

> create a readonly store based on a value from another store.

- `value` is the current state of the store
- `extractedValue` is the value of the new store, it will change when the function passed to `select()` changes value
- **note:** the store returned does not contains `update()` or `actions()` because a function to write updated values to the original store hasn't been specified.

#### `store.select(value => extractedValue, (value, extractedValue) => newValue | void): store`

> create a writable store based on a value from another store.

- `value` is the current state of the store
- `extractedValue` is the value of the new store
- `newValue` is the new value of the store

#### `store.select(value => extractedValue, (value, extractedValue) => newValue | void, actions): store`

> create a writable store based on a value from another store with actions.

- `actions` is an object containing actions to be added to the new store
