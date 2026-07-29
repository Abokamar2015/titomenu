import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "sonner";
import MenuPage from "@/pages/MenuPage";
import AdminPage from "@/pages/AdminPage";
import PrintMenuPage from "@/pages/PrintMenuPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={MenuPage} />
      <Route path="/menu" component={MenuPage} />
      <Route path="/r/:slug" component={MenuPage} />
      <Route path="/r/:slug/print" component={PrintMenuPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/print" component={PrintMenuPage} />
      <Route>
        <div className="min-h-screen flex items-center justify-center bg-[#111] text-white">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">404</h1>
            <a href="/" className="text-[#E8622A] underline">العودة للمينيو</a>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster richColors position="top-center" />
    </>
  );
}

export default App;
