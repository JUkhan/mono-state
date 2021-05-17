import { StateController } from "./stateController";

const _container: Map<number, any> = new Map();
const get_id = (() => {
  let _id = 1;
  return () => _id++;
})();
export function Get<T extends StateController<any>>(
  controllerType: new () => T
): T {
  const fn = controllerType as any;
  if (!fn._$key) {
    fn._$key = `${new Date().getTime()}${get_id()}`;
  }

  if (!_container.has(fn._$key)) {
    _container.set(fn._$key, new controllerType());
  }
  return _container.get(fn._$key);
}

export function RemoveController<T extends StateController<any>>(
  controllerType: new () => T
): boolean {
  const fn = controllerType as any;

  if (_container.has(fn._$key)) {
    if (_container.get(fn._$key).dispose) _container.get(fn._$key).dispose();
    _container.delete(fn._$key);
    fn._$key = undefined;
    return true;
  }
  return false;
}
