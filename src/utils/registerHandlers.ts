import { BaseHandler } from "@src/sockets/handlers/base.handler";
import { mapHandlers } from "./mapHandlers";

export function registerHandlers(handlerClasses: (new () => BaseHandler)[]) {
  const handlers: Record<string, Record<string, Function>> = {};

  for (const HandlerClass of handlerClasses) {
    const className = HandlerClass.name.replace(/Handler$/, "");
    const namespace = className.charAt(0).toLowerCase() + className.slice(1);

    const instance = new HandlerClass();
    handlers[namespace] = mapHandlers(instance);
  }

  return handlers;
}
