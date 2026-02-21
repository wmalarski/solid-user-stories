import type {
  BranchDefinition,
  CoValueClassOrSchema,
  InstanceOfSchema,
  ResolveQuery,
  ResolveQueryStrict,
  SchemaResolveQuery,
} from "jazz-tools";
import { createResource, type Accessor } from "solid-js";

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
  key?: string;
}>;

export const createJazzResource = <
  S extends CoValueClassOrSchema,
  // @ts-expect-error we can't statically enforce the schema's resolve query is a valid resolve query, but in practice it is
  R extends ResolveQuery<S> = SchemaResolveQuery<S>,
>(
  args: CreateJazzResourceArgs<S, R>,
) => {
  return createResource<
    InstanceOfSchema<S>,
    ReturnType<CreateJazzResourceArgs<S, R>>
    // oxlint-disable-next-line typescript/no-explicit-any
  >(args, async (resolvedArgs: any) => {
    // oxlint-disable-next-line unicorn/no-abusive-eslint-disable
    // oxlint-disable-next-line typescript/no-unsafe-assignment typescript/no-unsafe-call typescript/no-unsafe-member-access
    const root = await resolvedArgs.schema.load(resolvedArgs.id, resolvedArgs.options);
    // oxlint-disable-next-line unicorn/no-abusive-eslint-disable
    // oxlint-disable-next-line typescript/no-unsafe-return typescript/no-unsafe-member-access
    return root.$isLoaded ? root : null;
  });
};
