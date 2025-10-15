interface CheckEmailInterstitialProps {
  onBackToSignIn: () => void;
}

export function CheckEmailInterstitial({ onBackToSignIn }: CheckEmailInterstitialProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
        <svg
          className="h-8 w-8 text-green-600 dark:text-green-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Check your email</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md">
          We sent a verification link to your email address. Click the link to complete your registration.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Didn&apos;t receive the email? Check your spam folder.
        </p>
      </div>

      <button
        type="button"
        onClick={onBackToSignIn}
        className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        Back to Sign In
      </button>
    </div>
  );
}
