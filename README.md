# mono-state

State Management Lib - reactive and less boilerpllate

`Angular` [counter](https://stackblitz.com/edit/angular-ms-todo?file=src/app/app.component.ts) | [todos](https://stackblitz.com/edit/angular-ms-todo?file=src/app/app.component.ts)

`React` [counter](https://stackblitz.com/edit/react-mono-state?file=index.tsx) | [todos](https://stackblitz.com/edit/react-todo-mono?file=index.tsx)

### counterState

```tsx
import { RegisterState, createStore } from "mono-state";

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
        await delay(1000);
        emit((c_state) => ({ loading: false, count: c_state.count + 1 }));
      },
    };
  },
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const store = createStore([counterState]);
store.select((state) => state).subscribe(console.log);
store.dispatch("inc");
store.dispatch("asyncInc");
```

### Testing

```ts
import { ajwahTest } from "ajwah-test";
import { MonoStore, createStore } from "../src";
import { Counter, counterState } from "./counterState";

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
        store.dispatch("inc");
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
        store.dispatch("dec");
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
        store.dispatch("asyncInc");
      },
      skip: 1,
      wait: 10,
      verify: (states) => {
        expect(states[0]).toEqual({ count: 0, loading: true });
        expect(states[1]).toEqual({ count: 1, loading: false });
      },
    });
  });

  it("import state", async () => {
    await ajwahTest({
      build: () => store.select((state) => state.counter),
      act: () => {
        store.importState("counter", { count: 101, loading: false });
      },
      skip: 1,
      verify: (states) => {
        expect(states[0]).toEqual({ count: 101, loading: false });
      },
    });
  });

  it("unregister state", async () => {
    await ajwahTest({
      build: () => store.select((state) => state.counter),
      act: () => {
        store.unregisterState("counter");
      },
      skip: 1,
      verify: (states) => {
        expect(states[0]).toEqual(undefined);
      },
    });
  });
  it("action hanler whereType", async () => {
    await ajwahTest({
      build: () => store.action$.whereType("awesome"),
      act: () => {
        store.dispatch("awesome");
      },

      verify: (states) => {
        expect(states[0]).toEqual({ type: "awesome" });
      },
    });
  });
  it("action hanler whereTypes", async () => {
    await ajwahTest({
      build: () => store.action$.whereTypes("awesomeX", "awesome"),
      act: () => {
        store.dispatch("awesome");
      },

      verify: (states) => {
        expect(states[0]).toEqual({ type: "awesome" });
      },
    });
  });
  it("action hanler where", async () => {
    await ajwahTest({
      build: () => store.action$.where((action) => action.type === "awesome"),
      act: () => {
        store.dispatch("awesome");
      },

      verify: (states) => {
        expect(states[0]).toEqual({ type: "awesome" });
      },
    });
  });
  it("dispose", async () => {
    await ajwahTest({
      build: () => store.select((state) => state.counter),
      act: () => {
        store.dispose();
        store.dispatch("inc");
      },

      verify: (states) => {
        expect(states.length).toBe(1);
        expect(states[0]).toEqual({ count: 0, loading: false });
      },
    });
  });
});
```
