import { BaseHandler } from "../sockets/handlers/base.handler";

export function mapHandlers<T extends BaseHandler>(
  instance: T,
): Record<string, any> {
  const proto = Object.getPrototypeOf(instance);
  const methodNames = Object.getOwnPropertyNames(proto).filter(
    (m) => m !== "constructor" && typeof (instance as any)[m] === "function",
  );

  const mapped: Record<string, any> = {};
  for (const name of methodNames) {
    mapped[name] = (instance as any)[name].bind(instance);
  }

  return mapped;
}
