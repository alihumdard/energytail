let isOpen = false;
const listeners = new Set<() => void>();

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getOpen() {
  return isOpen;
}

export function setOpen(v: boolean) {
  isOpen = v;
  listeners.forEach((l) => l());
}
