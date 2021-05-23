import { ajwahTest } from "ajwah-test";
import {
  CounterController,
  RemoteController,
  CounterController2,
} from "./counterController";
import { Get, RemoveController } from "../src/provider";
import { mergeMap } from "rxjs/operators";

describe("Controller: ", () => {
  new RemoteController();
  let controller: CounterController;
  beforeEach(() => {
    controller = Get(CounterController);
  });
  afterEach(() => {
    RemoveController(CounterController);
  });

  it("initial state", async () => {
    await ajwahTest({
      build: () => controller.stream$,
      verify: (states) => {
        expect(states[0]).toEqual({ count: 0, loading: false });
      },
    });
  });
  it("increment", async () => {
    await ajwahTest({
      build: () => controller.stream$,
      act: () => {
        controller.increment();
      },
      skip: 1,
      verify: (states) => {
        expect(states[0]).toEqual({ count: 1, loading: false });
      },
    });
  });

  it("decrement", async () => {
    await ajwahTest({
      build: () => controller.stream$,
      act: () => {
        controller.decrement();
      },
      skip: 1,
      verify: (states) => {
        expect(states[0]).toEqual({ count: -1, loading: false });
      },
    });
  });

  it("async increment", async () => {
    await ajwahTest({
      build: () => controller.stream$,
      act: () => {
        controller.asyncInc();
      },
      skip: 1,
      wait: 10,
      verify: (states) => {
        expect(states[0]).toEqual({ count: 0, loading: true });
        expect(states[1]).toEqual({ count: 1, loading: false });
      },
    });
  });
  it("select", async () => {
    await ajwahTest({
      build: () => controller.select((state) => state.count),
      act: () => {
        controller.increment();
      },
      skip: 1,
      verify: (states) => {
        expect(states[0]).toEqual(1);
      },
    });
  });
  it("import state", async () => {
    await ajwahTest({
      build: () => controller.stream$,
      act: () => {
        controller.importState({ count: 101, loading: false });
      },
      skip: 1,
      verify: (states) => {
        expect(states[0]).toEqual({ count: 101, loading: false });
      },
    });
  });
  it("action hanler whereType", async () => {
    await ajwahTest({
      build: () => controller.action$.whereType("awesome"),
      act: () => {
        controller.dispatch("awesome");
      },

      verify: (states) => {
        expect(states[0]).toEqual({ type: "awesome" });
      },
    });
  });
  it("action hanler whereTypes", async () => {
    await ajwahTest({
      build: () => controller.action$.whereTypes("awesomeX", "awesome"),
      act: () => {
        controller.dispatch("awesome");
      },

      verify: (states) => {
        expect(states[0]).toEqual({ type: "awesome" });
      },
    });
  });
  it("action hanler where", async () => {
    await ajwahTest({
      build: () =>
        controller.action$.where((action) => action.type === "awesome"),
      act: () => {
        controller.dispatch("awesome");
      },

      verify: (states) => {
        expect(states[0]).toEqual({ type: "awesome" });
      },
    });
  });
  it("dispose", async () => {
    await ajwahTest({
      build: () => controller.stream$,
      act: () => {
        controller.dispose();
        controller.dispatch("inc");
      },

      verify: (states) => {
        expect(states.length).toBe(1);
        expect(states[0]).toEqual({ count: 0, loading: false });
      },
    });
  });
  it("remote state", async () => {
    const state = await controller.remoteState<string>(RemoteController);
    expect(state).toBe("remote-controller");
  });
  it("remote controller", async () => {
    await ajwahTest({
      build: () =>
        controller
          .remoteController(RemoteController)
          .pipe(mergeMap((con) => con.stream$)),
      verify: (states) => {
        expect(states[0]).toBe("remote-controller");
      },
    });
  });

  it("remote stream", async () => {
    await ajwahTest({
      build: () => controller.remoteStream<string>(RemoteController),
      verify: (states) => {
        expect(states[0]).toBe("remote-controller");
      },
    });
  });
});

describe("Counter controller2: ", () => {
  let controller: CounterController2;
  beforeEach(() => {
    controller = Get(CounterController2);
  });
  afterEach(() => {
    RemoveController(CounterController2);
  });

  it("initial state", async () => {
    await ajwahTest({
      build: () => controller.stream$,
      verify: (states) => {
        expect(states[0]).toEqual(0);
      },
    });
  });
  it("increment", async () => {
    await ajwahTest({
      build: () => controller.stream$,
      act: () => {
        controller.inc();
      },
      skip: 1,
      verify: (states) => {
        expect(states[0]).toEqual(1);
      },
    });
  });

  it("decrement", async () => {
    await ajwahTest({
      build: () => controller.stream$,
      act: () => {
        controller.dec();
      },
      skip: 1,
      verify: (states) => {
        expect(states[0]).toEqual(-1);
      },
    });
  });

  it("async increment", async () => {
    await ajwahTest({
      build: () => controller.stream$,
      act: () => {
        controller.asyncInc();
      },
      skip: 1,
      wait: 10,
      verify: (states) => {
        expect(states[0]).toEqual(1);
      },
    });
  });

  it("async increment", async () => {
    await ajwahTest({
      build: () => controller.count$,
      act: () => {
        controller.asyncInc();
      },

      skip: 2,
      wait: 10,
      verify: (states) => {
        expect(states[0]).toEqual("loading...");
        expect(states[1]).toEqual("1");
      },
    });
  });
});
