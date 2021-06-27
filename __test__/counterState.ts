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

export class Inctrment {}
export class Decrement {}
export class AsyncInc {}

export const increment = () => new Inctrment();
export const decrement = () => new Decrement();
export const asyncInc = () => new AsyncInc();
