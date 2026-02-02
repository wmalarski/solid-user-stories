// oxlint-disable-next-line unicorn/no-abusive-eslint-disable
// oxlint-disable-next-line import/no-default-export import/no-anonymous-default-export
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api")) {
      return new Response(`Running in ${navigator.userAgent} ${url.pathname}!`);
    }

    if (url.pathname.startsWith("/do")) {
      const stub = env.SYNC_DURABLE_OBJECT.getByName(new URL(request.url).pathname);
      const greeting = await stub.sayHello();
      return new Response(greeting);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

export { SyncDurableObject } from "./sync-durable-object";
