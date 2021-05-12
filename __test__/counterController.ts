import { StateController } from "../src/stateController";

interface CounterState {
  count: number;
  loading?: boolean;
}

export class CounterController extends StateController<CounterState> {
  constructor() {
    super({ count: 0, loading: false });
  }

  increment() {
    this.emit({ count: this.state.count + 1 });
  }

  decrement() {
    this.emit({ count: this.state.count - 1 });
  }

  async asyncInc() {
    this.emit({ loading: true });
    await this.delay(10);
    this.emit({ count: this.state.count + 1, loading: false });
  }

  delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
