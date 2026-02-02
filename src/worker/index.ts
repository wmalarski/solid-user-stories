// oxlint-disable-next-line unicorn/no-abusive-eslint-disable
// oxlint-disable-next-line import/no-default-export import/no-anonymous-default-export
export default {
  fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    console.log("[url.pathname]", url.pathname);

    if (url.pathname.startsWith("/api")) {
      return new Response(`Running in ${navigator.userAgent} ${url.pathname}!`);
    }

    return env.ASSETS.fetch(request);
  },
};
