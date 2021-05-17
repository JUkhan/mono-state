import { BehaviorSubject, Observable, Subscription, merge } from "rxjs";
import { map, distinctUntilChanged } from "rxjs/operators";

import { Action } from "./action";
import { Actions } from "./actions";

const _dispatcher = new BehaviorSubject<Action>({ type: "@INIT" });
const _action$ = new Actions(_dispatcher);

/**[StateController] is a base class
 *
 *To develop a powerful concrete state controller class.
 *
 *So that you can manage your application's state easy and comportable way.
 *Spliting chunk of them as the controllers and having communication among them.
 *
 *```ts
 *class CounterState extends StateController<number>{
 *
 *    CounterState(){
 *       super(0);
 *    }
 *
 *    increment(){
 *       emit(state + 1);
 *    }
 *
 *    decrement(){
 *       emit(state - 1);
 *    }
 *
 *}
 *```
 */
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
  /**
   * This function is fired whenever action dispatched from the controllers.
   */
  onAction(action: Action) {}

  /**
   * This function is fired after instantiating the controller.
   */
  onInit() {}
  /**
   *Return the part of the current state of the controller as a Observable<S>.
   */
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

  /**
   * Return the current state of the controller as a Observable<S>.
   */

  get stream$(): Observable<S> {
    return this._store.pipe(distinctUntilChanged());
  }

  /**
   * Return a [Acctions] instance.
   *
   *So that you can filter the actions those are dispatches throughout
   *the application. And also making effect/s on it.
   */
  get action$(): Actions {
    return _action$;
  }

  /**
   * Return the current state of the controller.
   */
  get state() {
    return this._store.value;
  }

  /**Dispatching an action is just like firing an event.
   *
   *Whenever the acction is dispatched it notifies all the controllers
   *those who override the [onAction(action Action)] method and also
   *notifes all the effects - registered throughout the controllers.
   *
   * A powerful way to communicate among the controllers.
   */
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
  /**
   * [streams] pass one or more effects.
   *
   *This function registers the effect/s and also
   *un-registers previous effeccts (if found any).
   *
   * Here is an example of a search effect:
   *
   * This effect start working when SearchInputAction is dispatched
   * then wait 320 mills to receive subsequent actions(SearchInputAction) -
   * when reach out time limit it sends a request to server and then dispatches
   * [SearchResultAction] when server response come back. Now any controller can
   * receive SearchResultAction who override [onAction] method.
   *
   * ```ts
   * registerEffects(
   *   action$.whereType('SearchInput')
   *   .debounceTime(320)
   *   .switchMap((action) => pullData(action.payload))
   *   .map(res => ({type:'SearchResult', payload:res})),
   * );
   * ```
   */
  registerEffects(...streams: Observable<Action>[]): void {
    this._effSub?.unsubscribe();
    this._effSub = merge(...streams).subscribe((action: Action) =>
      this.dispatch(action)
    );
  }

  /**This is a clean up funcction. */
  dispose(): void {
    this._sub.unsubscribe();
    this._effSub?.unsubscribe();
  }
}
function isPlainObj(o: any) {
  return o ? typeof o == "object" && o.constructor == Object : false;
}
