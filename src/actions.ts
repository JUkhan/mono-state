import { BehaviorSubject } from "rxjs";
import { filter, map } from "rxjs/operators";
import { Action } from "./action";

export class Actions {
  constructor(private _dispatcher: BehaviorSubject<Action>) {}

  isA<T extends Action>(actionOf: new () => T) {
    return this._dispatcher.pipe(
      filter((action) => action instanceof actionOf),
      map((action) => action as T)
    );
  }

  where(predicate: (action: Action) => boolean) {
    return this._dispatcher.pipe(filter(predicate));
  }
}
