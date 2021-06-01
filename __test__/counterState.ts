import { RegisterState, Action } from "../src";

export interface Counter {
  count: number;
  loading: boolean;
}
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
function delay(ms: number = 10) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export class Inctrment extends Action {}
export class Decrement extends Action {}
export class AsyncInc extends Action {}

export const increment = () => new Inctrment();
export const decrement = () => new Decrement();
export const asyncInc = () => new AsyncInc();
