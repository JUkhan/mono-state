# mono-state

State Management Lib - reactive and less boilerpllate

`Angular` [counter](https://stackblitz.com/edit/angular-ms-todo?file=src/app/app.component.ts) | [todos](https://stackblitz.com/edit/angular-ms-todo?file=src/app/app.component.ts)

`React` [counter](https://stackblitz.com/edit/react-mono-state?file=index.tsx) | [todos](https://stackblitz.com/edit/react-todo-mono?file=index.tsx)

### counterState

```tsx
import { RegisterState, createStore, Action } from "mono-state";

import { map, tap, delay } from "rxjs/operators";
import { RegisterState, Action } from "../src";

export interface Counter {
  count: number;
  loading: boolean;
}
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
        delay(10),
        map((action) =>
          emit(({ count }) => ({ loading: false, count: count + 1 }))
        )
      ),
    ];
  },
};

export class Inctrment extends Action {}
export class Decrement extends Action {}
export class AsyncInc extends Action {}

export const increment = () => new Inctrment();
export const decrement = () => new Decrement();
export const asyncInc = () => new AsyncInc();
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
