/**
 * Downloads a file from the given URL using a simple anchor tag approach.
 * This method avoids blob/createObjectURL which can cause browser download inhibitors.
 *
 * @param url - The API endpoint URL to download from
 * @param filename - The desired filename for the downloaded file
 * @param showError - Toast function to display error messages
 */
export async function downloadFile(url: string, filename: string, showError: (message: string) => void): Promise<void> {
  try {
    // Validate endpoint with HEAD request
    const response = await fetch(url, { method: "HEAD" });

    if (!response.ok) {
      if (response.status === 401) {
        // Authentication error - redirect to login
        window.location.href = "/";
        return;
      }

      if (response.status === 404) {
        showError("No data available to download. Please upload content first.");
        return;
      }

      // Try to get error message from a GET request
      const errorResponse = await fetch(url);
      const errorData = await errorResponse.json().catch(() => ({
        error: { message: "Failed to download file" },
      }));
      const message = errorData.error?.message || "Failed to download file";
      showError(message);
      return;
    }

    // Download via simple anchor tag
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    //eslint-disable-next-line no-console
    console.error("Error downloading file:", error);
    showError(error instanceof Error ? error.message : "Failed to download file. Please try again.");
  }
}
