import { useState } from "react";
import { AuthTabs } from "./AuthTabs";
import { CheckEmailInterstitial } from "./CheckEmailInterstitial";
import { Card } from "../ui/card";

export function AuthenticationSection() {
  const [showCheckEmail, setShowCheckEmail] = useState(false);

  const handleSignUpSuccess = () => {
    setShowCheckEmail(true);
  };

  const handleBackToSignIn = () => {
    setShowCheckEmail(false);
  };

  if (showCheckEmail) {
    return (
      <Card className="w-full max-w-md mx-auto p-6">
        <CheckEmailInterstitial onBackToSignIn={handleBackToSignIn} />
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto p-6">
      <AuthTabs onSignUpSuccess={handleSignUpSuccess} />
    </Card>
  );
}
