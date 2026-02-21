// oxlint-disable-next-line unicorn/no-abusive-eslint-disable
// oxlint-disable-next-line import/no-default-export import/no-anonymous-default-export
export default {
  // oxlint-disable-next-line require-await
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
