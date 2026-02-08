// oxlint-disable-next-line unicorn/no-abusive-eslint-disable
// oxlint-disable-next-line import/no-default-export import/no-anonymous-default-export
export default {
  fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
