import { ajwahTest } from "ajwah-test";
import { MonoStore, createStore } from "../src";
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

  it("action hanler where", async () => {
    await ajwahTest({
      build: () => store.action$.where((action) => action === "awesome"),
      act: () => {
        store.dispatch("awesome");
      },

      verify: (states) => {
        expect(states[0]).toEqual("awesome");
      },
    });
  });
  it("dispose", async () => {
    await ajwahTest({
      build: () => store.select((state) => state.counter),
      act: () => {
        store.dispose();
        store.dispatch(increment());
      },

      verify: (states) => {
        expect(states.length).toBe(1);
        expect(states[0]).toEqual({ count: 0, loading: false });
      },
    });
  });
});
