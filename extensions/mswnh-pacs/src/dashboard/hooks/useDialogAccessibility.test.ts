/// <reference types="jest" />

import { getFocusableElements, trapDialogFocus } from './useDialogAccessibility';

describe('dialog accessibility helpers', () => {
  it('finds enabled interactive controls in document order', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <button id="first">First</button>
      <button disabled>Disabled</button>
      <a id="second" href="#target">Second</a>
      <button aria-hidden="true">Hidden</button>
    `;

    expect(getFocusableElements(container).map(element => element.id)).toEqual(['first', 'second']);
  });

  it('wraps focus from the last control to the first control', () => {
    const container = document.createElement('div');
    container.innerHTML = '<button id="first">First</button><button id="last">Last</button>';
    document.body.appendChild(container);
    const [first, last] = getFocusableElements(container);
    last.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });

    trapDialogFocus(event, container);

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);
    container.remove();
  });

  it('wraps shift-tab focus from the first control to the last control', () => {
    const container = document.createElement('div');
    container.innerHTML = '<button id="first">First</button><button id="last">Last</button>';
    document.body.appendChild(container);
    const [first, last] = getFocusableElements(container);
    first.focus();
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      cancelable: true,
    });

    trapDialogFocus(event, container);

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(last);
    container.remove();
  });
});
