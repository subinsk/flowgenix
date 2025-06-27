export interface AnimationVariants {
  initial: Record<string, any>;
  animate: Record<string, any>;
  exit?: Record<string, any>;
  transition?: Record<string, any>;
}

export interface AnimationProps {
  variants?: AnimationVariants;
  initial?: string | Record<string, any>;
  animate?: string | Record<string, any>;
  exit?: string | Record<string, any>;
  transition?: Record<string, any>;
  delay?: number;
  duration?: number;
}
