import { StateController } from "./stateController";

const _container: { [key: string]: any } = {};
const get_id = (() => {
  let _id = 1;
  return () => _id++;
})();
export function PutOrGet<T extends StateController<any>>(
  controllerType: new () => T
): T {
  const fn = controllerType as any;
  if (!fn.key) {
    const obj: any = new controllerType();
    fn.key = get_id();
    _container[fn.key] = obj;
    return obj;
  }

  if (!_container[fn.key]) {
    _container[fn.key] = new controllerType();
  }
  return _container[fn.key];
}

export function RemoveState<T extends StateController<any>>(
  controllerType: new () => T
): boolean {
  const fn = controllerType as any;
  if (_container[fn.key]) {
    if (_container[fn.key].dispose) _container[fn.key].dispose();
    delete _container[fn.key];
    return true;
  }
  return false;
}
