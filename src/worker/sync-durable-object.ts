import { DurableObject } from "cloudflare:workers";

export class SyncDurableObject extends DurableObject<Env> {
  // oxlint-disable-next-line no-useless-constructor
  constructor(ctx: DurableObjectState, env: Env) {
    // Required, as we're extending the base class.
    super(ctx, env);
  }

  // oxlint-disable-next-line class-methods-use-this
  sayHello(): Promise<string> {
    // oxlint-disable-next-line no-promise-executor-return promise/avoid-new
    return new Promise((resolve) => setTimeout(() => resolve("Hello"), 100));
  }
}
