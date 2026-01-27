import {
  type Component,
  type ParentProps,
  createContext,
  createSignal,
  useContext,
} from "solid-js";

const createExportStateContext = () => {
  const [isExporting, setIsExporting] = createSignal(false);

  return [isExporting, { onIsExportingChage: setIsExporting }] as const;
};

const ExportStateContext = createContext<ReturnType<typeof createExportStateContext> | null>(null);

export const useExportStateContext = () => {
  const context = useContext(ExportStateContext);
  if (!context) {
    throw new Error("ExportStateContext not defined");
  }
  return context;
};

export const ExportStateProvider: Component<ParentProps> = (props) => {
  const value = createExportStateContext();

  return <ExportStateContext.Provider value={value}>{props.children}</ExportStateContext.Provider>;
};
