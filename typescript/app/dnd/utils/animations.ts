// Helper function to apply CSS class animation with restart capability
export function applyAnimationClass(
  element: HTMLDivElement | null,
  shouldTrigger: boolean,
  trigger: number,
  className: string,
  duration: number,
  onComplete: () => void
): (() => void) | void {
  if (!shouldTrigger || trigger <= 0 || !element) return;
  
  // Force reflow to restart animation
  element.classList.remove(className);
  let timer: NodeJS.Timeout;
  
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (element) {
        element.classList.add(className);
        timer = setTimeout(() => {
          element.classList.remove(className);
          onComplete();
        }, duration);
      }
    });
  });
  
  return () => {
    if (timer) clearTimeout(timer);
  };
}

