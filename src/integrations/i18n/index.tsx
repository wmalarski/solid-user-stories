import { flatten, resolveTemplate, translator } from "@solid-primitives/i18n";
import {
  type Accessor,
  type Component,
  createContext,
  createMemo,
  createSignal,
  type ParentProps,
  useContext,
} from "solid-js";

const enDict = {
  board: {
    axis: {
      confirmDelete: "Confirm delete task",
      insertAxis: "Add axis",
      name: "Name",
    },
    tasks: {
      confirmDelete: "Confirm delete task",
      description: "Description",
      estimate: "Estimation",
      insertTask: "Add task",
      link: "Link",
      title: "Title",
    },
    zoom: {
      reset: "Reset zoom",
      zoomIn: "Zoom in",
      zoomOut: "Zoom out",
    },
  },
  common: {
    cancel: "Cancel",
    clear: "Clear",
    closeDialog: "Close",
    delete: "Delete",
    edit: "Edit",
    openMenu: "Open Menu",
    save: "Save",
    update: "Update",
  },
  error: {
    description: "Something went wrong: {{message}}",
    home: "Home",
    reload: "Reload",
    title: "Error",
  },
  info: {
    madeBy: "Made by wmalarski",
    title: "Solid User Stories",
  },
  notFound: {
    title: "Not Found",
  },
  seo: {
    description:
      "Solid User Stories app is a non-trivial local first demo application built using Solid Start.",
    title: "Solid User Stories",
  },
};

export type Locale = "en";

const dictionaries = { en: enDict };

type Accessed<T> = T extends Accessor<infer A> ? A : never;

export const createI18nValue = () => {
  const [locale, setLocale] = createSignal<Locale>("en");

  const translate = createMemo(() => {
    const dict = flatten(dictionaries[locale()]);
    return translator(() => dict, resolveTemplate);
  });

  const t: Accessed<typeof translate> = (path, ...args) => {
    return translate()(path, ...args);
  };

  return { locale, setLocale, t };
};

type I18nContextValue = ReturnType<typeof createI18nValue>;

export const I18nContext = createContext<I18nContextValue>({
  locale: () => "en" as const,
  setLocale: () => {},
  t: () => {
    throw new Error("Not implemented");
  },
});

export const I18nContextProvider: Component<ParentProps> = (props) => {
  const value = createI18nValue();

  return <I18nContext.Provider value={value}>{props.children}</I18nContext.Provider>;
};

export const useI18n = () => {
  return useContext(I18nContext);
};
