/**
 * Given an object, return a new object with all entries with `undefined` values
 * removed.
 */
export function stripUndefined<
  T extends object,
  R = { [key in keyof T]: Exclude<T[keyof T], undefined> },
>(obj: T): R {
  return Object.fromEntries(
    Object.entries(obj).filter((entry) => entry[1] !== undefined),
  ) as R
}

/**
 * Given two objects, return a new object with all entries from both objects,
 * skipping any entries with `undefined` values.
 */
export function merged<T1 extends object, T2 extends object | undefined>(
  obj1: T1,
  obj2?: T2,
): T1 & T2 {
  return {
    ...stripUndefined(obj1),
    ...stripUndefined(obj2 ?? {}),
  }
}
