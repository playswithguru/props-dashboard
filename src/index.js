import "./index.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import PropsDashboard from "./PropsDashboard";  // Import your main component

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <GoogleOAuthProvider clientId="400878472680-m23ccjb7eluoh14smcfk3k158ot10oj5.apps.googleusercontent.com">
    <PropsDashboard /> {/* Render the main component inside the provider */}
  </GoogleOAuthProvider>
);
