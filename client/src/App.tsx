import { Switch, Route } from "wouter";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/not-found";
import Sales from "@/pages/Sales";
import Losses from "@/pages/Losses";
import Historical from "@/pages/Historical";
import Heatmap from "@/pages/Heatmap";

function App() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/sales" component={Sales} />
      <Route path="/losses" component={Losses} />
      <Route path="/historical" component={Historical} />
      <Route path="/heatmap" component={Heatmap} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
