import { BehaviorSubject, Observable, Subscription, merge } from "rxjs";
import { map, distinctUntilChanged } from "rxjs/operators";

import { Action } from "./action";
import { Actions } from "./actions";

const _dispatcher = new BehaviorSubject<Action>({ type: "@INIT" });
const _action$ = new Actions(_dispatcher);

export abstract class StateController<S> {
  private _store: BehaviorSubject<S>;
  private _sub: Subscription;
  private _effSub?: Subscription;

  constructor(initialState: S) {
    this._store = new BehaviorSubject<S>(initialState);

    this._sub = _dispatcher.subscribe((action) => {
      this.onAction(action);
    });

    setTimeout(() => {
      this.onInit();
    }, 0);
  }
  onAction(action: Action) {}
  onInit() {}

  select<T = any>(mapFn: (state: S) => any): Observable<T> {
    let mapped$;
    if (typeof mapFn === "function") {
      mapped$ = this._store.pipe(map((source: any) => mapFn(source)));
    } else {
      throw new TypeError(
        `Unexpected type '${typeof mapFn}' in select operator,` +
          ` expected 'string' or 'function'`
      );
    }
    return mapped$.pipe(distinctUntilChanged());
  }

  get stream$(): Observable<S> {
    return this._store.pipe(distinctUntilChanged());
  }

  get action$(): Actions {
    return _action$;
  }

  get state() {
    return this._store.value;
  }

  dispatch(actionName: string | Action | symbol, payload?: any): void {
    if (typeof actionName === "object") {
      _dispatcher.next(actionName);
      return;
    }
    _dispatcher.next({ type: actionName, payload });
  }
  /**
   * This fuction merge the input state param with the current store state
   * @param state You might pass partial state.
   *
   */
  emit(state: any) {
    if (isPlainObj(state)) {
      this._store.next(Object.assign({}, this.state, state));
      return;
    }
    this._store.next(state);
  }

  importState(state: S) {
    this._store.next(state);
  }

  registerEffects(...streams: Observable<Action>[]): void {
    this._effSub?.unsubscribe();
    this._effSub = merge(...streams).subscribe((action: Action) =>
      this.dispatch(action)
    );
  }

  dispose(): void {
    this._sub.unsubscribe();
    this._effSub?.unsubscribe();
  }
}
function isPlainObj(o: any) {
  return !!o && typeof o == "object" && o.constructor == Object;
}
