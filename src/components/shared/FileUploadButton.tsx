import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { FileUploadButtonProps } from "@/components/dashboard/dashboard.types";

export function FileUploadButton({
  onUpload,
  accept = ".yaml,.yml",
  disabled = false,
  children,
  className,
}: FileUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const content = await readFileAsText(file);
      await onUpload(content);
    } catch (error) {
      //eslint-disable-next-line no-console
      console.error("File upload error:", error);
      throw error;
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be uploaded again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Could not read file. Please try again."));
      reader.readAsText(file);
    });
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
      <Button type="button" onClick={handleButtonClick} disabled={disabled || isUploading} className={className}>
        {isUploading ? (
          <>
            <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Uploading...
          </>
        ) : (
          children
        )}
      </Button>
    </>
  );
}
