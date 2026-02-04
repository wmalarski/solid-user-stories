import { type Component, type ParentProps, createContext, useContext } from "solid-js";
import {
  boardsCollection,
  edgeCollection,
  gamesCollection,
  sectionCollection,
  taskCollection,
} from "./collections";

const createTanstackDbContext = () => {
  return { boardsCollection, edgeCollection, gamesCollection, sectionCollection, taskCollection };
};

const TanstackDbContext = createContext<ReturnType<typeof createTanstackDbContext> | null>(null);

export const useTanstackDbContext = () => {
  const context = useContext(TanstackDbContext);
  if (!context) {
    throw new Error("TanstackDbContext not defined");
  }
  return context;
};

export const TanstackDbProvider: Component<ParentProps> = (props) => {
  const value = createTanstackDbContext();

  return <TanstackDbContext.Provider value={value}>{props.children}</TanstackDbContext.Provider>;
};
