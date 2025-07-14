export interface AnimationVariants {
  initial: Record<string, string | number | boolean>;
  animate: Record<string, string | number | boolean>;
  exit?: Record<string, string | number | boolean>;
  transition?: Record<string, string | number | boolean>;
}

export interface AnimationProps {
  variants?: AnimationVariants;
  initial?: string | Record<string, string | number | boolean>;
  animate?: string | Record<string, string | number | boolean>;
  exit?: string | Record<string, string | number | boolean>;
  transition?: Record<string, string | number | boolean>;
  delay?: number;
  duration?: number;
}
