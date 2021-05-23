import { BehaviorSubject, Observable, Subscription, merge, from } from "rxjs";
import { map, distinctUntilChanged, mergeMap } from "rxjs/operators";

import { Action } from "./action";
import { Actions } from "./actions";

const _dispatcher = new BehaviorSubject<Action>({ type: "@INIT" });
const _action$ = new Actions(_dispatcher);

/**
 *Every `StateController` has the following features:
 *- Dispatching actions
 *- Filtering actions
 *- Adding effeccts
 *- Communications among controllers
 *- RxDart full features
 *
 *Every `StateController` requires an initial state which will be the state of the `StateController` before `emit` has been called.
 *
 *The current state of a `StateController` can be accessed via the `state` getter.
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
   * This function is fired whenever action dispatches from any of the controllers.
   * Note: if you override this method and have call to `remoteState/remoreController` on this instance, don't forget to cal `super.onAction(actio`
   */
  onAction(action: Action) {
    if (
      action instanceof RemoteControllerAction &&
      this instanceof action.payload
    ) {
      action.type(this);
    }
  }

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
   * Return the `Acction` instance.
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
   *those who override the `onAction(action Action)` method and also
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
   *This function registers the effect/s and also
   *un-registers previous effeccts (if found any).
   *
   * `streams` pass one or more effects.
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

  private remoteData<S extends StateController<any>>(
    controllerType: new () => S
  ): Promise<S> {
    return new Promise<S>((resolver) => {
      this.dispatch(new RemoteControllerAction(resolver, controllerType));
    });
  }

  /**
   *Using this function you can get state of any active controlller.
   * @param controllerType should be a sub type of StateController class.
   * @returns A promise of the state of the given type.
   *
   *```ts
   *const category = await remoteState<SearchCategory>(SearchCategoryController);
   *```
   *
   */
  remoteState<S, T extends StateController<any> = any>(
    controllerType: new () => T
  ): Promise<S> {
    return this.remoteData<T>(controllerType).then((ctrl) => ctrl.state);
  }

  /**
   *Using this function you can get reference of any active controlller.
   * @param controllerType should be a sub type of StateController class.
   * @returns A Observable&lt;Controller> of the given type.
   *`Example`
   *
   *This example returns todo list filtered by searchCategory.
   *We need `SearchCategoryController` stream combining with `TodoContrroller's` stream:
   *```ts
   * const ctrlStream$ =remoteController<SearchCategoryController>();
   *```
   */
  remoteController<S extends StateController<any>>(
    controllerType: new () => S
  ): Observable<S> {
    return from(this.remoteData<S>(controllerType));
  }

  /**
   *Using this function you can get `stream$` of any active controlller.
   *
   * @param controllerType should be a sub type of StateController class.
   * @returns A Observable&lt;S> of the given type.
   *
   *`Example`
   *
   *
   *```ts
   * const searchCategoryStream$ = remoteStream<SearchCategory>(SearchCategoryController);
   *```
   */
  remoteStream<S, T extends StateController<any> = any>(
    controllerType: new () => T
  ): Observable<S> {
    return this.remoteController<T>(controllerType).pipe(
      mergeMap((ctrl) => ctrl.stream$)
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
class RemoteControllerAction implements Action {
  constructor(public type: (state: any) => void, public payload: any) {}
}
