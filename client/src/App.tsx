import { Switch, Route } from "wouter";
import Dashboard from "@/pages/Dashboard";
import Reports from "@/pages/Reports";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/reports" component={Reports} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
