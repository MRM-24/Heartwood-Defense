import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { installBackKeys } from "./game/backstack";
import { dropBootSplash, registerServiceWorker } from "./game/pwa";
import { installUiSounds } from "./game/uiSound";

// One global click language for every button in the app, and one Escape/back
// handler that unwinds whatever surface is open. Both are delegated, so they
// cost nothing per-component.
installUiSounds();
installBackKeys();
registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// The inline splash in index.html covers the first paint (and the font swap):
// fade it out once React has committed, then take it out of the tree.
requestAnimationFrame(() => requestAnimationFrame(dropBootSplash));
