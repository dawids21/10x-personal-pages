import { useState } from "react";
import type { ValidationErrorDetail } from "@/types";
import { isErrorResponse, getValidationErrors } from "@/components/dashboard/dashboard.types";
import { useToast } from "@/components/dashboard/hooks/useToast";

export function useFileUpload(
  apiCall: (data: string) => Promise<Response>,
  successMessage: string,
  errorMessage?: string
) {
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrorDetail[] | null>(null);
  const { showSuccess, showError } = useToast();

  const upload = async (fileContent: string) => {
    try {
      setIsUploading(true);
      setErrors(null);

      const response = await apiCall(fileContent);

      if (response.status === 400) {
        const errorData = await response.json();
        if (isErrorResponse(errorData) && errorData.error.code === "INVALID_YAML") {
          setErrors(getValidationErrors(errorData));
        }
        return;
      }

      if (!response.ok) {
        showError(errorMessage || "Failed to upload. Please try again.");
        return;
      }

      showSuccess(successMessage);
    } catch (err) {
      showError(errorMessage || "Failed to upload. Please try again.");
      //eslint-disable-next-line no-console
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const clearErrors = () => setErrors(null);

  return { upload, isUploading, errors, clearErrors };
}
