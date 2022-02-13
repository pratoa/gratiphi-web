import { BrowserRouter, Route, Switch } from "react-router-dom";
import Home from "./components/home/Home";
import Donate from "./components/donate/Donate";
import "./App.css";
import ThankYou from "./components/thankYou/ThankYou";

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/donate/:userId/:doneeId" component={Donate} />
        <Route path="/thank-you" component={ThankYou} />
      </Switch>
    </BrowserRouter>
  );
}

export default App;
