import { BaseHandler } from "../sockets/handlers/base.handler";

export function mapHandlers<T extends BaseHandler>(
  instance: T,
): Record<string, any> {
  const mapped: Record<string, any> = {};

  const protoMethods = new Set<string>();
  let proto = Object.getPrototypeOf(instance);
  while (proto && proto !== Object.prototype) {
    Object.getOwnPropertyNames(proto).forEach((name) => {
      if (name === "constructor") return;
      const desc = Object.getOwnPropertyDescriptor(proto, name);
      if (desc && typeof desc.value === "function") {
        protoMethods.add(name);
      }
    });
    proto = Object.getPrototypeOf(proto);
  }

  const ownMethodNames = Object.getOwnPropertyNames(instance).filter((name) => {
    try {
      const val = (instance as any)[name];
      return typeof val === "function";
    } catch {
      return false;
    }
  });

  const allNames = Array.from(new Set([...protoMethods, ...ownMethodNames]));

  for (const name of allNames) {
    const fn = (instance as any)[name];
    if (typeof fn !== "function") continue;
    const isOwn = ownMethodNames.includes(name);
    mapped[name] = isOwn ? fn : fn.bind(instance);
  }

  return mapped;
}
