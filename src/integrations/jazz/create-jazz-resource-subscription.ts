import type {
  BranchDefinition,
  CoValueClassOrSchema,
  ResolveQuery,
  ResolveQueryStrict,
  SchemaResolveQuery,
} from "jazz-tools";
import { createEffect, createMemo, onCleanup, type Accessor } from "solid-js";
import { createJazzResource } from "./create-jazz-resource";

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

export const createJazzResourceSubscription = <
  S extends CoValueClassOrSchema,
  // @ts-expect-error we can't statically enforce the schema's resolve query is a valid resolve query, but in practice it is
  R extends ResolveQuery<S> = SchemaResolveQuery<S>,
>(
  args: CreateJazzResourceArgs<S, R>,
) => {
  const [boards, { mutate }] = createJazzResource(args);
  const id = createMemo(() => args().id);
  // oxlint-disable-next-line typescript/no-explicit-any
  const shema = createMemo((): any => args().schema);
  createEffect(() => onCleanup(shema().subscribe(id(), mutate)));
  return boards;
};
