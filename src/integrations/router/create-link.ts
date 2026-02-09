export interface NavigationPaths {
  "/board/:boardId": {
    params: { boardId: string };
    search: never;
  };
  "/invite": {
    params: never;
    search: never;
  };
  "/": {
    params: never;
    search: never;
  };
  "/404": {
    params: never;
    search: never;
  };
}

type PathNeverCond<Type> = [Type] extends [never] ? unknown : { params: Type };
type SearchNeverCond<Type> = [Type] extends [never] ? unknown : { search: Type };

export const createLink = <Key extends keyof NavigationPaths>(
  path: Key,
  options: PathNeverCond<NavigationPaths[Key]["params"]> &
    SearchNeverCond<NavigationPaths[Key]["search"]>,
) => {
  const unsafeOptions = options as unknown as {
    params?: Record<string, unknown>;
    search?: Record<string, unknown>;
  };
  const searchParams = buildSearchParams(unsafeOptions.search);
  const resolvedPath = Object.entries(unsafeOptions.params ?? {}).reduce(
    (previous, [key, value]) => previous.replace(`:${key}`, `${value}`),
    String(path),
  );

  return searchParams.size === 0 ? resolvedPath : `${resolvedPath}?${searchParams}`;
};

export const buildSearchParams = (query?: Record<string, unknown>): URLSearchParams => {
  const entries = Object.entries(query ?? {});
  const pairs = entries.flatMap(([key, value]) =>
    value !== undefined && value !== null ? [[key, `${value}`]] : [],
  );
  return new URLSearchParams(pairs);
};
