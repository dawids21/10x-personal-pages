import { Button } from "@/components/ui/button";
import type { ReorderControlsProps } from "@/components/dashboard/dashboard.types";

export function ReorderControls({ canMoveUp, canMoveDown, onMoveUp, onMoveDown, itemLabel }: ReorderControlsProps) {
  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onMoveUp}
        disabled={!canMoveUp}
        aria-label={`Move ${itemLabel} up`}
        className="h-6 w-6 p-0"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onMoveDown}
        disabled={!canMoveDown}
        aria-label={`Move ${itemLabel} down`}
        className="h-6 w-6 p-0"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>
    </div>
  );
}
