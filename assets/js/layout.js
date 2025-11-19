/*------------------------------------------------------------------------------
 * COMP 3020 HCI - UMSU Clubs Website
 * NAME: Layout Bootstrap
 * COURSE: Human-Computer Interaction
 *------------------------------------------------------------------------------
 *
 * Description:
 * Injects shared header and footer markup so individual pages stay lean while
 * remaining 100% client-side (no network fetches). Ensures the skip link,
 * navigation, and footer are consistent across all pages.
 *------------------------------------------------------------------------------*/

(function(){
  const headerHTML = `
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header ribbon">
      <div class="container header-inner">
        <a class="brand" href="index.html">
          <img src="assets/img/logo.svg" alt="UMSU" class="logo" />
          <span class="brand-text">UMSU Clubs</span>
        </a>
        <button class="nav-toggle" aria-expanded="false" aria-controls="site-nav" id="navToggle">
          <span class="sr-only">Toggle navigation</span>
          ☰
        </button>
        <nav id="site-nav" class="site-nav" aria-label="Primary">
          <a href="index.html">Main page</a>
          <a href="calendar.html">Calendar</a>
          <a href="events.html">Events</a>
          <a href="clubs.html">Clubs</a>
          <a href="about.html">About</a>
        </nav>
      </div>
    </header>
  `;

  const footerHTML = `
    <footer class="site-footer">
      <div class="container footer-inner">
        <div>
          <strong>UMSU Clubs</strong>
          <p>Student life. Community. Belonging.</p>
          <p class="meta footer-group">Group-5</p>
        </div>
        <div class="footer-links">
          <a href="about.html">About</a>
          <a href="clubs.html">Clubs</a>
          <a href="events.html">Events</a>
          <a href="calendar.html">Calendar</a>
        </div>
      </div>
    </footer>
  `;

  function injectLayout() {
    const body = document.body;
    if (!body || body.dataset.layoutInjected === 'true') return;

    const hasHeader = body.querySelector('.site-header');
    if (!hasHeader) {
      body.insertAdjacentHTML('afterbegin', headerHTML);
    }

    const hasFooter = body.querySelector('.site-footer');
    if (!hasFooter) {
      body.insertAdjacentHTML('beforeend', footerHTML);
    }

    body.dataset.layoutInjected = 'true';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectLayout);
  } else {
    injectLayout();
  }
})();

