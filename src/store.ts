import { BehaviorSubject, Observable, Subscription, merge } from "rxjs";
import { distinctUntilChanged, map } from "rxjs/operators";

import { Action } from "./action";
import { Actions } from "./actions";

export interface RegisterState<M = any, S = any> {
  stateName: string;
  initialState: M;
  mapActionToState: (
    action$: Actions,
    emit: (state: M | ((state: M) => M)) => M,
    select: () => S,
    dispatch: (action: string | symbol | Action) => void
  ) => Observable<any>[];
}

export class MonoStore<S = any> {
  private _store: BehaviorSubject<any>;
  private _stateSubscriptions: Map<String, Subscription>;
  private _dispatcher = new BehaviorSubject<Action>({ type: "@INIT" });
  constructor(states: RegisterState[] = []) {
    this._store = new BehaviorSubject<any>({});
    this._stateSubscriptions = new Map<String, Subscription>();
    states.forEach((s) => {
      this.registerState(s);
    });
  }
  public action$ = new Actions(this._dispatcher);

  get dispatcher$() {
    return this._dispatcher.asObservable();
  }

  registerState<M>({
    stateName,
    initialState,
    mapActionToState,
  }: RegisterState<M>): void {
    if (this._store.value[stateName]) {
      return;
    }

    this._store.next(
      Object.assign({}, this._store.value, { [stateName]: initialState })
    );

    const emitState = (state: any) => {
      if (typeof state === "function") {
        state = state(this._store.value[stateName]) as any;
      }
      if (this._store.value[stateName] !== state) {
        this._store.next(
          Object.assign({}, this._store.value, { [stateName]: state })
        );
      }
      return state;
    };
    const reducerActions = mapActionToState(
      this.action$,
      emitState,
      () => this._store.value,
      this.dispatch
    );
    this._stateSubscriptions.set(
      stateName,
      merge(...reducerActions).subscribe()
    );
    this.dispatch(`@registerState(${stateName})`);
  }
  unregisterState(stateName: string) {
    if (this._store.value[stateName]) {
      this._stateSubscriptions.get(stateName)?.unsubscribe();
      this._stateSubscriptions.delete(stateName);
      const state: any = this.getState();
      delete state[stateName];
      setTimeout(() => {
        this.dispatch(`@unregisterState(${stateName})`);
        this._store.next(Object.assign({}, state));
      }, 0);
    }
  }

  dispatch = (action: string | symbol | Action) => {
    this._dispatcher.next(action);
  };
  getState(): S {
    return this._store.value;
  }
  select<T = any>(mapFn: (state: S) => T): Observable<T> {
    let mapped$;
    if (typeof mapFn === "function") {
      mapped$ = this._store.pipe(map((source: any) => mapFn(source)));
    } else {
      throw new TypeError(
        `Unexpected type '${typeof mapFn}' in select operator,` +
          ` expected 'function'`
      );
    }
    return mapped$.pipe(distinctUntilChanged());
  }
  importState(stateName: string, state: any) {
    let s_state = this._store.value;
    if (s_state[stateName]) {
      s_state = Object.assign({}, s_state);
      s_state[stateName] = state;
      this._store.next(s_state);
      this.dispatch(`@importState(${stateName})`);
    }
  }
  dispose(): void {
    this._stateSubscriptions.forEach((value, key) => {
      value.unsubscribe();
    });
    this._stateSubscriptions.clear();
  }
}
export function createStore(states: RegisterState[] = []) {
  return new MonoStore(states);
}
