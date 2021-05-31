## 0.4.0

```ts
import { map, tap, delay } from "rxjs/operators";
import { RegisterState, Action } from "mono-state";

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

## 0.3.0

```ts
import { RegisterState } from "mono-state";

export interface Counter {
  count: number;
  loading: boolean;
}
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
        await delay(10);
        emit((c_state) => ({ loading: false, count: c_state.count + 1 }));
      },
    };
  },
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```
