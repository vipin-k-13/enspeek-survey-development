import "./App.css";
import Chat_window from "./components/Chat-window/Chat_window";
import { BrowserRouter } from "react-router";

function App() {

  return (
    <BrowserRouter>
      <Chat_window />
    </BrowserRouter>
  );
}

export default App;
