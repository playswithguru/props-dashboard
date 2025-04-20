import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";

const root = createRoot(document.getElementById("root"));
root.render(
  <GoogleOAuthProvider clientId="400878472680-m23ccjb7eluoh14smcfk3k158ot10oj5.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);
