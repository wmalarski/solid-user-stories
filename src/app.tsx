import { MetaProvider } from "@solidjs/meta";
import { Route, Router } from "@solidjs/router";
import { ErrorBoundary, Suspense, type Component } from "solid-js";
import { I18nContextProvider } from "./integrations/i18n";
import { Head } from "./integrations/meta/head";
import { ErrorFallback } from "./integrations/router/error-fallback";
import { BoardRoute } from "./modules/board/board-route";
import { HomeRoute } from "./modules/home/home-route";
import { VisualPanel } from "./modules/visual/components/visual-panel";

export const App: Component = () => (
  <>
    <Router
      root={(props) => (
        <I18nContextProvider>
          <MetaProvider>
            <Head />
            <ErrorBoundary fallback={ErrorFallback}>
              <Suspense>{props.children}</Suspense>
            </ErrorBoundary>
          </MetaProvider>
        </I18nContextProvider>
      )}
    >
      <Route path="/" component={HomeRoute} />
      <Route path="/board/:boardId" component={BoardRoute} />
      <Route path="/panel/:boardId" component={VisualPanel} />
    </Router>
  </>
);
