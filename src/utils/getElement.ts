export const getElement = <T extends HTMLElement>(selector: string) => {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Element ${selector} not found`);

  return el;
};
