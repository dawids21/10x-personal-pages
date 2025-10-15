import { useState } from "react";
import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";

export type AuthTab = "signin" | "signup";

interface AuthTabsProps {
  onSignUpSuccess: () => void;
}

export function AuthTabs({ onSignUpSuccess }: AuthTabsProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>("signin");

  return (
    <div className="w-full">
      <div
        role="tablist"
        aria-label="Authentication options"
        className="flex border-b border-gray-200 dark:border-gray-700"
      >
        <button
          role="tab"
          aria-selected={activeTab === "signin"}
          aria-controls="signin-panel"
          id="signin-tab"
          onClick={() => setActiveTab("signin")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
            activeTab === "signin"
              ? "border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          Sign In
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "signup"}
          aria-controls="signup-panel"
          id="signup-tab"
          onClick={() => setActiveTab("signup")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
            activeTab === "signup"
              ? "border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          Sign Up
        </button>
      </div>
      <div className="mt-6">
        {activeTab === "signin" && <SignInForm />}
        {activeTab === "signup" && (
          <SignUpForm onSuccess={onSignUpSuccess} onSwitchToSignIn={() => setActiveTab("signin")} />
        )}
      </div>
    </div>
  );
}
