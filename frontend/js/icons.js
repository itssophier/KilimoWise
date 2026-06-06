/* =====================================================================
   KiliMoWise — SVG icon library
   24x24 viewBox, stroke-based, currentColor. Stroke width 1.75.
   Usage: <svg class="icon icon-24"><use href="#i-leaf"/></svg>
   The full sprite is injected into <body> by svgSprite().
   ===================================================================== */

(function () {
  var ICONS = {
    'leaf':        '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2.5c1 1.5.5 7-2 9.5-2.85 2.85-7.5 4-9.5 4"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/>',
    'home':        '<path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    'sparkles':    '<path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z"/><path d="M5 14l.5 1.5L7 16l-1.5.5L5 18l-.5-1.5L3 16l1.5-.5z"/>',
    'wallet':      '<path d="M3 7a2 2 0 0 1 2-2h14v4"/><path d="M3 7v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9h-5a3 3 0 0 0 0 6h5"/><circle cx="17" cy="13" r="1" fill="currentColor"/>',
    'chart':       '<path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-6"/>',
    'user':        '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>',
    'arrow-left':  '<path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/>',
    'arrow-right': '<path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>',
    'check':       '<path d="M4 12l5 5L20 6"/>',
    'close':       '<path d="M6 6l12 12M6 18L18 6"/>',
    'plus':        '<path d="M12 5v14M5 12h14"/>',
    'camera':      '<path d="M3 7h4l2-3h6l2 3h4v12H3z"/><circle cx="12" cy="13" r="4"/>',
    'image':       '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M3 16l5-5 4 4 3-3 6 6"/>',
    'mic':         '<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>',
    'send':        '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
    'refresh':     '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
    'sun':         '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
    'moon':        '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    'globe':       '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    'log-out':     '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
    'trending-up': '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
    'trending-down':'<path d="M3 7l6 6 4-4 8 8"/><path d="M14 17h7v-7"/>',
    'tag':         '<path d="M20 12L12 20l-9-9V3h8z"/><circle cx="7.5" cy="7.5" r="1.5" fill="currentColor"/>',
    'calendar':    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
    'bell':        '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/>',
    'settings':    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    'wifi-off':    '<path d="M1 1l22 22"/><path d="M16.7 13.7a5 5 0 0 0-6.4-.7"/><path d="M5 12.5a10 10 0 0 1 5.5-2.8"/><path d="M19 12.5a10 10 0 0 0-2.8-1.7"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M12 20h.01"/>',
    'cloud-off':   '<path d="M2 2l20 20"/><path d="M5.8 5.8A7 7 0 0 0 9 19h9a5 5 0 0 0 4-8.5"/><path d="M9 5a7 7 0 0 1 10 6"/>',
    'info':        '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01"/><path d="M11 12h1v4h1"/>',
    'warning':     '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    'spark':       '<path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M5 19l4-4M15 9l4-4"/>',
    'shopping':    '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
    'sprout':      '<path d="M7 20h10"/><path d="M12 20V10"/><path d="M12 10C12 6 9 4 6 4c0 4 2 6 6 6z"/><path d="M12 10c0-4 3-6 6-6 0 4-2 6-6 6z"/>',
    'sun-rise':    '<path d="M3 18h18"/><path d="M7 18a5 5 0 0 1 10 0"/><path d="M12 2v6M5 7l1.5 1.5M19 7l-1.5 1.5M9 18v-3M15 18v-3"/>',
    'flask':       '<path d="M9 3h6M10 3v6L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-6-10V3"/>',
    'syringe':     '<path d="M18 2l4 4"/><path d="M15 5l4 4"/><path d="M12 8L5 15l4 4 7-7"/><path d="M8 12l-3 3 4 4 3-3"/>',
    'star':        '<path d="M12 2l3 7 7 .5-5.5 4.5L18 21l-6-4-6 4 1.5-7L2 9.5 9 9z"/>',
    'pin':         '<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    'phone':       '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l1 4.6-2.3 1.2a16 16 0 0 0 6 6l1.2-2.3 4.6 1a2 2 0 0 1 1.7 2z"/>',
    'lock':        '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    'eye':         '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
    'eye-off':     '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/>',
    'flame':       '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2.5-1-3.5-.5 0-2 1.5-2 3.5 0 .8.4 1.5.5 2.5z"/><path d="M12 22c4 0 7-3 7-7 0-3-2-5-3.5-7C14 10 14 12 12 12c-1 0-1.5-.5-1.5-.5C9 13 8 14 8 16c0 2 1.5 3 2.5 3.5C9 21 12 22 12 22z"/>',
    'logo-mark':   '<rect width="100" height="100" rx="22" fill="currentColor"/><g transform="translate(0,0)"><path d="M52 22c-15 0-23 12-23 28s8 28 23 28c4 0 8-1 11-2l-1-6c-3 1-6 1.5-9 1.5-10 0-15-8-15-21.5S43 28 53 28c3 0 6 .5 9 1.5l1-6c-3-1-7-1.5-11-1.5z" fill="#faf6ee"/><path d="M28 22v6h6v-6zm0 8v6h6v-6zm0 8v6h6v-6zm0 8v6h6v-6z" fill="#d99c2c"/></g>',
    'logo-mark-light':'<rect width="100" height="100" rx="22" fill="#faf6ee"/><g><path d="M52 22c-15 0-23 12-23 28s8 28 23 28c4 0 8-1 11-2l-1-6c-3 1-6 1.5-9 1.5-10 0-15-8-15-21.5S43 28 53 28c3 0 6 .5 9 1.5l1-6c-3-1-7-1.5-11-1.5z" fill="#0e3a23"/><path d="M28 22v6h6v-6zm0 8v6h6v-6zm0 8v6h6v-6zm0 8v6h6v-6z" fill="#d99c2c"/></g>',
    'menu':        '<path d="M3 6h18M3 12h18M3 18h18"/>',
    'chevron-right':'<path d="M9 6l6 6-6 6"/>',
    'chevron-down':'<path d="M6 9l6 6 6-6"/>',
    'edit':        '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>',
    'sparkle':     '<path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6z"/>',
    'water':       '<path d="M12 2.5C8 8 6 11 6 14a6 6 0 0 0 12 0c0-3-2-6-6-11.5z"/>',
    'barn':        '<path d="M3 21V11l9-6 9 6v10"/><path d="M3 21h18"/><path d="M9 21v-6h6v6"/>',
    'tractor':     '<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M9 17h6"/><path d="M15 17V9h-4l-1-3H6"/>'
  };

  window.KMW_ICONS = ICONS;

  // Render an <svg> with one of the icons. Returns HTMLElement.
  function svg(name, size) {
    var s = size || 20;
    var wrap = document.createElement('span');
    wrap.className = 'icon-wrap';
    wrap.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;line-height:0;';
    wrap.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
    return wrap.firstChild;
  }

  window.svg = svg;

  // Inject a hidden sprite (for <use href="#i-name"/>)
  function svgSprite() {
    if (document.getElementById('kmw-sprite')) return;
    var ns = 'http://www.w3.org/2000/svg';
    var sprite = document.createElementNS(ns, 'svg');
    sprite.setAttribute('id', 'kmw-sprite');
    sprite.setAttribute('aria-hidden', 'true');
    sprite.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
    Object.keys(ICONS).forEach(function (k) {
      var sym = document.createElementNS(ns, 'symbol');
      sym.setAttribute('id', 'i-' + k);
      sym.setAttribute('viewBox', '0 0 24 24');
      sym.innerHTML = ICONS[k];
      sprite.appendChild(sym);
    });
    document.body.appendChild(sprite);
  }

  window.svgSprite = svgSprite;
  document.addEventListener('DOMContentLoaded', svgSprite);
})();
