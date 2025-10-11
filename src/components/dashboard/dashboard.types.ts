import type { PageDto, ProjectDto, ProjectCreateResponseDto, ValidationErrorDetail, ErrorResponse } from "@/types";

/**
 * Component Props Interfaces
 */

export interface AdminDashboardProps {
  initialPage: PageDto;
  baseUrl: string;
}

export interface PageSettingsCardProps {
  page: PageDto;
  baseUrl: string;
}

export interface ProjectListItemProps {
  project: ProjectDto;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onReorderUp: () => void;
  onReorderDown: () => void;
  onUpdate: (updatedProject: ProjectDto) => void;
  onDelete: (projectId: string) => void;
}

export interface CreateProjectModalProps {
  isOpen: boolean;
  maxDisplayOrder: number;
  onClose: () => void;
  onCreate: (newProject: ProjectCreateResponseDto) => void;
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface FileUploadButtonProps {
  onUpload: (fileContent: string) => Promise<void>;
  accept?: string;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export interface ErrorListProps {
  errors: ValidationErrorDetail[];
  onClear?: () => void;
}

export interface InlineEditTextProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  "aria-label"?: string;
}

export interface ReorderControlsProps {
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  itemLabel: string;
}

/**
 * API Response Helpers
 */

// Helper type for checking error responses
export function isErrorResponse(data: unknown): data is ErrorResponse {
  return data !== null && typeof data === "object" && "error" in data;
}

// Helper type for extracting validation errors
export function getValidationErrors(response: ErrorResponse): ValidationErrorDetail[] {
  return response.error.details || [];
}
