import { Route, Router } from "@solidjs/router";
import { ErrorBoundary, lazy, Suspense, type Component } from "solid-js";
import { I18nContextProvider } from "./integrations/i18n";
import { JazzProvider } from "./integrations/jazz/provider";
import { ErrorFallback } from "./integrations/router/error-fallback";
import { ThemeProvider } from "./integrations/theme/theme-context";
import { HomeRoute } from "./modules/home/home-route";
import { InviteRoute } from "./modules/invite/invite-route";

const VisualRoute = lazy(() =>
  // oxlint-disable-next-line promise/prefer-await-to-then
  import("./modules/visual/components/visual-route").then((module) => ({
    default: module.VisualRoute,
  })),
);

export const App: Component = () => (
  <Router
    root={(props) => (
      <JazzProvider>
        <ThemeProvider>
          <I18nContextProvider>
            <ErrorBoundary fallback={ErrorFallback}>
              <Suspense>{props.children}</Suspense>
            </ErrorBoundary>
          </I18nContextProvider>
        </ThemeProvider>
      </JazzProvider>
    )}
  >
    <Route path="/" component={HomeRoute} />
    <Route path="/invite" component={InviteRoute} />
    <Route path="/board/:boardId" component={VisualRoute} />
  </Router>
);
