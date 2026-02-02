// oxlint-disable-next-line unicorn/no-abusive-eslint-disable
// oxlint-disable-next-line import/no-default-export import/no-anonymous-default-export
export default {
  fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api")) {
      return new Response(`Running in ${navigator.userAgent} ${url.pathname}!`);
    }

    if (url.pathname.startsWith("/websocket")) {
      const upgradeHeader = request.headers.get("Upgrade");
      if (!upgradeHeader || upgradeHeader !== "websocket") {
        return new Response("Worker expected Upgrade: websocket", {
          status: 426,
        });
      }

      if (request.method !== "GET") {
        return new Response("Worker expected GET method", {
          status: 400,
        });
      }

      const name = url.pathname.split("/").at(-1) ?? "default";
      const stub = env.SYNC_DURABLE_OBJECT.getByName(name);

      return stub.fetch(request);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

export { SyncDurableObject } from "./sync-durable-object";
