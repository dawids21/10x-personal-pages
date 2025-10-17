import type { ErrorListProps } from "@/components/dashboard/dashboard.types";

export function ErrorList({ errors, onClear }: ErrorListProps) {
  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-md border border-destructive/50 bg-destructive/10 p-4"
      data-testid="validation-errors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h3 className="mb-2 text-sm font-medium text-destructive">Please fix the following errors:</h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-destructive/90">
            {errors.map((error, index) => (
              <li key={index}>
                <span className="font-medium">{error.field}:</span> {error.issue}
              </li>
            ))}
          </ul>
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="flex h-6 w-6 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/20"
            aria-label="Clear errors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
