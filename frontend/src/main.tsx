import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter } from "react-router-dom";
import { dark } from "@clerk/themes";
import App from "./App.tsx";
import "./styles/globals.css";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error("Missing Clerk Publishable Key");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={clerkPubKey}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#8b5cf6",
          colorBackground: "#0a0a0f",
          colorInputBackground: "rgba(255, 255, 255, 0.05)",
          colorInputText: "#e2e8f0",
          colorText: "#e2e8f0",
          colorTextSecondary: "#94a3b8",
          colorDanger: "#ef4444",
          borderRadius: "10px",
        },
        elements: {
          formButtonPrimary: {
            backgroundColor: "#8b5cf6",
            "&:hover": {
              backgroundColor: "#a78bfa",
            },
          },
          card: {
            backgroundColor: "#111117",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow:
              "0 4px 16px -2px rgba(0, 0, 0, 0.3), 0 2px 8px -2px rgba(139, 92, 246, 0.1)",
          },
          headerTitle: {
            color: "#e2e8f0",
          },
          headerSubtitle: {
            color: "#94a3b8",
          },
          socialButtonsBlockButton: {
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            color: "#e2e8f0",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              borderColor: "#8b5cf6",
            },
          },
          dividerLine: {
            backgroundColor: "rgba(255, 255, 255, 0.08)",
          },
          dividerText: {
            color: "#64748b",
          },
          formFieldLabel: {
            color: "#e2e8f0",
          },
          formFieldInput: {
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            color: "#e2e8f0",
            "&:focus": {
              borderColor: "#8b5cf6",
              boxShadow: "0 0 0 3px rgba(139, 92, 246, 0.1)",
            },
          },
          footerActionLink: {
            color: "#8b5cf6",
            "&:hover": {
              color: "#a78bfa",
            },
          },
          identityPreviewText: {
            color: "#e2e8f0",
          },
          identityPreviewEditButton: {
            color: "#8b5cf6",
          },
          userButtonPopoverCard: {
            backgroundColor: "#111117",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 4px 16px -2px rgba(0, 0, 0, 0.3)",
          },
          userButtonPopoverActionButton: {
            color: "#e2e8f0",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.05)",
            },
          },
          userButtonPopoverActionButtonText: {
            color: "#e2e8f0",
          },
          userButtonPopoverFooter: {
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          },
        },
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>,
);
