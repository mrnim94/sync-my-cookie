// Runtime accessibility patch for antd v3 / rc-dialog Modal sentinels.
//
// Background:
//   antd v3 wraps every Modal with rc-dialog. rc-dialog implements its
//   focus-trap by injecting two sentinel divs in the dialog root:
//
//     <div tabindex="0" aria-hidden="true"
//          style="width:0;height:0;overflow:hidden;outline:none"></div>
//     ... dialog content ...
//     <div tabindex="0" aria-hidden="true"
//          style="width:0;height:0;overflow:hidden;outline:none"></div>
//
//   When the user tabs into one of these sentinels Chromium 124+ logs:
//     "Blocked aria-hidden on an element because its descendant retained
//      focus."
//   because the sentinel is itself focusable (tabindex=0) but is hidden
//   from a11y via aria-hidden, which is invalid per WAI-ARIA.
//
//   The fix recommended by Chrome is to use the `inert` attribute
//   instead, which keeps the element non-focusable AND hides it from
//   assistive tech without violating aria semantics.
//
//   We can't easily upgrade antd v3 / rc-dialog from this codebase, so
//   we patch the offending DOM at runtime: every time rc-dialog injects
//   a sentinel we strip its aria-hidden attribute. Because the sentinel
//   never has any visible content, removing aria-hidden has no visual
//   or behavioral effect (it just stops the warning).
//
// Usage:
//   import { installAriaSentinelFix } from './utils/aria-sentinel-fix';
//   installAriaSentinelFix();
//
//   Safe to call multiple times; only installs the observer once per
//   document.

const SENTINEL_SELECTOR =
  'div[tabindex="0"][aria-hidden="true"]' +
  '[style*="width: 0"][style*="height: 0"]';

let installed = false;

function isRcDialogSentinel(el: Element): el is HTMLDivElement {
  if (!(el instanceof HTMLDivElement)) {
    return false;
  }
  if (el.getAttribute('tabindex') !== '0') {
    return false;
  }
  if (el.getAttribute('aria-hidden') !== 'true') {
    return false;
  }
  // rc-dialog sentinels are zero-sized, transparent, no children.
  if (el.childNodes.length !== 0) {
    return false;
  }
  const styleAttr = el.getAttribute('style') || '';
  return (
    styleAttr.indexOf('width: 0') !== -1 &&
    styleAttr.indexOf('height: 0') !== -1
  );
}

function patchSentinel(el: HTMLDivElement) {
  // Removing aria-hidden is enough to silence the Chromium warning. The
  // sentinel keeps tabindex=0 so the rc-dialog focus-trap still works.
  el.removeAttribute('aria-hidden');
}

function patchExisting(root: ParentNode) {
  const candidates = root.querySelectorAll<HTMLDivElement>(SENTINEL_SELECTOR);
  candidates.forEach((el) => {
    if (isRcDialogSentinel(el)) {
      patchSentinel(el);
    }
  });
}

function visitNode(node: Node) {
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return;
  }
  const el = node as Element;
  if (isRcDialogSentinel(el)) {
    patchSentinel(el as HTMLDivElement);
  }
  // rc-dialog mounts the sentinel inside a portal; descendants may
  // include sentinels too (e.g. confirm + nested modal).
  if (el instanceof HTMLElement) {
    patchExisting(el);
  }
}

export function installAriaSentinelFix(): void {
  if (installed) {
    return;
  }
  if (typeof document === 'undefined' || !document.body) {
    // Defer until the body is available (extension popups always have
    // it before scripts run, but be safe).
    document.addEventListener('DOMContentLoaded', installAriaSentinelFix, {
      once: true,
    });
    return;
  }
  installed = true;

  // Patch anything already present (rare, but cheap).
  patchExisting(document);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(visitNode);
      } else if (
        mutation.type === 'attributes' &&
        mutation.attributeName === 'aria-hidden' &&
        mutation.target.nodeType === Node.ELEMENT_NODE
      ) {
        const el = mutation.target as Element;
        if (isRcDialogSentinel(el)) {
          patchSentinel(el as HTMLDivElement);
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-hidden'],
  });
}
