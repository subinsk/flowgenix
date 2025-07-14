import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

export function formatTimestamp(timestamp: Date | string) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

// Type for workflow node
export interface WorkflowValidationNode {
  type: string;
  data?: {
    type?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export function validateWorkflow(nodes: WorkflowValidationNode[]) {
  // Basic workflow validation
  if (nodes.length === 0) {
    return {
      isValid: false,
      error: "Workflow must have at least one component",
    };
  }

  const hasInput = nodes.some(
    (node) => node.type === "input" || node.data?.type === "user-query"
  );
  if (!hasInput) {
    return { isValid: false, error: "Workflow must have a user input component" };
  }

  const hasOutput = nodes.some((node) => node.data?.type === "output");
  if (!hasOutput) {
    return { isValid: false, error: "Workflow must have an output component" };
  }

  return { isValid: true, error: null };
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
