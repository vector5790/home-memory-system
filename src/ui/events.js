export function bindAppEvents({ document, window, handlers }) {
  document.addEventListener("click", handlers.onClick);
  document.addEventListener("input", handlers.onInput);
  document.addEventListener("change", handlers.onChange);
  document.addEventListener("pointerdown", handlers.onPointerDown);
  document.addEventListener("pointermove", handlers.onPointerMove);
  document.addEventListener("pointerup", handlers.onPointerUp);
  document.addEventListener("pointercancel", handlers.onPointerCancel);
  document.addEventListener("keydown", handlers.onKeyDown);
  window.addEventListener("resize", handlers.onResize);
  window.addEventListener("beforeunload", handlers.onBeforeUnload);
}
