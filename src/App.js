import { BrowserRouter, Route, Switch } from "react-router-dom";
import Home from "./components/home/Home";
import Donate from "./components/donate/Donate";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/donate/:userId/:doneeId" component={Donate} />
      </Switch>
    </BrowserRouter>
  );
}

export default App;
