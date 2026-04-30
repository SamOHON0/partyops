/*
 * PartyOps Booking Widget
 * Embed this script on any site:
 *   <script src="https://YOUR_DOMAIN/widget.js" data-business-id="YOUR_BUSINESS_ID"></script>
 *
 * Optional attributes:
 *   data-target="#some-element"   render inside a specific element instead of inline
 *   data-height="800"             iframe height in px (default 780)
 *   data-item="product-slug"      pre-select this product when the widget loads.
 *                                 Slug must match the product's `slug` column in
 *                                 PartyOps. If the page URL has ?item=<slug>, that
 *                                 takes precedence over this attribute.
 */
(function () {
  'use strict';

  var script =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();

  var businessId = script.getAttribute('data-business-id');
  if (!businessId) {
    console.error('[partyops] Missing data-business-id');
    return;
  }

  var origin = new URL(script.src).origin;
  var height = parseInt(script.getAttribute('data-height') || '780', 10);
  var targetSelector = script.getAttribute('data-target');

  // Pre-select item: prefer URL ?item=<slug>, fall back to data-item attribute.
  var preselectSlug = null;
  try {
    preselectSlug = new URLSearchParams(window.location.search).get('item');
  } catch (e) { /* old browser, ignore */ }
  if (!preselectSlug) {
    preselectSlug = script.getAttribute('data-item');
  }

  var iframeSrc = origin + '/embed/' + encodeURIComponent(businessId);
  if (preselectSlug) {
    iframeSrc += '?item=' + encodeURIComponent(preselectSlug);
  }
  var iframe = document.createElement('iframe');
  iframe.src = iframeSrc;
  iframe.style.width = '100%';
  iframe.style.maxWidth = '760px';
  iframe.style.height = height + 'px';
  iframe.style.border = '0';
  iframe.style.display = 'block';
  iframe.style.margin = '0 auto';
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('title', 'PartyOps booking widget');

  var container;
  if (targetSelector) {
    container = document.querySelector(targetSelector);
    if (!container) {
      console.error('[partyops] target not found:', targetSelector);
      return;
    }
  } else {
    container = document.createElement('div');
    script.parentNode.insertBefore(container, script);
  }
  container.appendChild(iframe);

  // Allow the embedded page to resize the iframe
  window.addEventListener('message', function (event) {
    if (event.origin !== origin) return;
    if (!event.data) return;
    if (
      (event.data.type === 'partyops:height' || event.data.type === 'rental-widget:height') &&
      typeof event.data.height === 'number'
    ) {
      iframe.style.height = event.data.height + 'px';
    }
  });
})();
