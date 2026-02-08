import type {
  BranchDefinition,
  CoValueClassOrSchema,
  InstanceOfSchema,
  ResolveQuery,
  ResolveQueryStrict,
  SchemaResolveQuery,
} from "jazz-tools";
import {
  createEffect,
  createMemo,
  createResource,
  onCleanup,
  type Accessor,
  type Resource,
} from "solid-js";

type CreateJazzResourceArgs<
  S extends CoValueClassOrSchema,
  // @ts-expect-error we can't statically enforce the schema's resolve query is a valid resolve query, but in practice it is
  R extends ResolveQuery<S> = SchemaResolveQuery<S>,
> = Accessor<{
  schema: S;
  id: string;
  options?: {
    resolve?: ResolveQueryStrict<S, R>;
    unstable_branch?: BranchDefinition;
  };
  source?: string;
}>;

export const createJazzResource = <
  S extends CoValueClassOrSchema,
  // @ts-expect-error we can't statically enforce the schema's resolve query is a valid resolve query, but in practice it is
  R extends ResolveQuery<S> = SchemaResolveQuery<S>,
>(
  args: CreateJazzResourceArgs<S, R>,
) => {
  // oxlint-disable-next-line typescript/no-explicit-any
  const usafeArgs = createMemo(() => args() as any);
  const [boards, { mutate }] = createResource(args, async (args) => {
    const root = await usafeArgs().schema.load(args.id, args.options);
    return root.$isLoaded ? root : null;
  });
  const id = createMemo(() => args().id);
  createEffect(() =>
    onCleanup(
      // oxlint-disable-next-line typescript/no-explicit-any
      usafeArgs().schema.subscribe(id(), (args: any, ...rest) => {
        console.log("[args]", JSON.stringify({ args, rest }, null, 2));
        mutate(args);
      }),
    ),
  );
  return boards as Resource<InstanceOfSchema<S>>;
};
