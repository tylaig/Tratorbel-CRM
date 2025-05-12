import { Switch, Route } from "wouter";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/not-found";
import Sales from "@/pages/Sales";
import Losses from "@/pages/Losses";
import Historical from "@/pages/Historical";

function App() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/sales" component={Sales} />
      <Route path="/losses" component={Losses} />
      <Route path="/historical" component={Historical} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
