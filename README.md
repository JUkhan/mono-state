# mono-state

State Management Lib - reactive and less boilerplate

- version 0.3.0, 0.4.\*, 0.5.\* are same but having variant in coding style

`Angular` [counter](https://stackblitz.com/edit/angular-ms-todo?file=src/app/app.component.ts) | [todos](https://stackblitz.com/edit/angular-ms-todo?file=src/app/app.component.ts)

`React` [counter](https://stackblitz.com/edit/react-mono-state?file=index.tsx) | [todos](https://stackblitz.com/edit/react-todo-mono?file=index.tsx)

### counterState v0.5.\*

```tsx
export const counterState: RegisterState<Counter> = {
  stateName: "counter",
  initialState: { loading: false, count: 0 },
  async mapActionToState(state, action, emit) {
    if (action instanceof Inctrment)
      emit({ count: state.count + 1, loading: false });
    else if (action instanceof Decrement)
      emit({ count: state.count - 1, loading: false });
    else if (action instanceof AsyncInc) {
      emit({ count: state.count, loading: true });
      await delay();
      emit((cstate) => ({ count: cstate.count + 1, loading: false }));
    }
  },
};
```

### counterState v0.4.\*

```tsx
export const counterState: RegisterState<Counter> = {
  stateName: "counter",
  initialState: { loading: false, count: 0 },
  mapActionToState(actions, emit) {
    return [
      actions
        .isA(Inctrment)
        .pipe(
          map((action) =>
            emit(({ count }) => ({ loading: false, count: count + 1 }))
          )
        ),
      actions
        .isA(Decrement)
        .pipe(
          map((action) =>
            emit(({ count }) => ({ loading: false, count: count - 1 }))
          )
        ),
      actions.isA(AsyncInc).pipe(
        tap((action) => emit(({ count }) => ({ loading: true, count }))),
        delay(),
        map((action) =>
          emit(({ count }) => ({ loading: false, count: count + 1 }))
        )
      ),
    ];
  },
};
```

### counterState v0.3.0

```tsx
export const counterState: RegisterState<Counter> = {
  stateName: "counter",
  initialState: { loading: false, count: 0 },
  mapActionToState(emit) {
    return {
      inc(state) {
        emit({ loading: false, count: state.count + 1 });
      },
      dec(state) {
        emit({ loading: false, count: state.count - 1 });
      },
      async asyncInc(state) {
        emit({ loading: true, count: state.count });
        await delay();
        emit((c_state) => ({ loading: false, count: c_state.count + 1 }));
      },
    };
  },
};
```

### Consuming

```ts
import { createStore } from "mono-state";
import { counterState, increment, decrement, asyncInc } from "./counterState";

const store = createStore([counterState]);

store.select((state) => state).subscribe(console.log);

store.dispatch(increment());
store.dispatch(decrement());
store.dispatch(asyncInc());
```

### Testing

```ts
import { ajwahTest } from "ajwah-test";
import { MonoStore, createStore } from "mono-state";
import {
  Counter,
  counterState,
  increment,
  decrement,
  asyncInc,
} from "./counterState";

describe("Counter State: ", () => {
  let store: MonoStore<{ counter: Counter }>;
  beforeEach(() => {
    store = createStore([counterState]);
  });
  afterEach(() => {
    store.dispose();
  });

  it("initial state", async () => {
    await ajwahTest({
      build: () => store.select((state) => state.counter),
      verify: (states) => {
        expect(states[0]).toEqual({ count: 0, loading: false });
      },
    });
  });

  it("increment", async () => {
    await ajwahTest({
      build: () => store.select((state) => state.counter),
      act: () => {
        store.dispatch(increment());
      },
      skip: 1,
      verify: (states) => {
        expect(states[0]).toEqual({ count: 1, loading: false });
      },
    });
  });

  it("decrement", async () => {
    await ajwahTest({
      build: () => store.select((state) => state.counter),
      act: () => {
        store.dispatch(decrement());
      },
      skip: 1,
      verify: (states) => {
        expect(states[0]).toEqual({ count: -1, loading: false });
      },
    });
  });

  it("async increment", async () => {
    await ajwahTest({
      build: () => store.select((state) => state.counter),
      act: () => {
        store.dispatch(asyncInc());
      },
      skip: 1,
      wait: 10,
      verify: (states) => {
        expect(states[0]).toEqual({ count: 0, loading: true });
        expect(states[1]).toEqual({ count: 1, loading: false });
      },
    });
  });
});
```
