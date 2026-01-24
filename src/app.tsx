import { MetaProvider } from "@solidjs/meta";
import { Route, Router } from "@solidjs/router";
import { ErrorBoundary, Suspense, type Component } from "solid-js";
import { I18nContextProvider } from "./integrations/i18n";
import { Head } from "./integrations/meta/head";
import { ErrorFallback } from "./integrations/router/error-fallback";
import { ThemeProvider } from "./integrations/theme/theme-context";
import { HomeRoute } from "./modules/home/home-route";
import { VisualRoute } from "./modules/visual/components/visual-route";

export const App: Component = () => (
  <>
    <Router
      root={(props) => (
        <ThemeProvider>
          <I18nContextProvider>
            <MetaProvider>
              <Head />
              <ErrorBoundary fallback={ErrorFallback}>
                <Suspense>{props.children}</Suspense>
              </ErrorBoundary>
            </MetaProvider>
          </I18nContextProvider>
        </ThemeProvider>
      )}
    >
      <Route path="/" component={HomeRoute} />
      <Route path="/board/:boardId" component={VisualRoute} />
    </Router>
  </>
);
