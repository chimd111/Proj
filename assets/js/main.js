/*------------------------------------------------------------------------------
 * COMP 3020 HCI - UMSU Clubs Website
 * NAME: UMSU Clubs Website Main JavaScript
 * COURSE: Human-Computer Interaction
 * AUTHORS: 
 *   - Patrick Kotelko
 *   - Harshvardhan Gadhavi
 *   - Chimdi Iwuchukwu
 *   - Gurwinder Khandal
 *   - Seth Morris
 * GROUP: Group-5
 *------------------------------------------------------------------------------
 *
 * Description:
 * Main JavaScript module for global website functionality including mobile
 * navigation toggle, accessibility enhancements, and home page interactivity.
 *------------------------------------------------------------------------------*/

//------------------------------------------------------------------------------
// Utility Functions
// Shared utility functions used across multiple JavaScript modules.
//------------------------------------------------------------------------------

/**
 * Executes a function when the DOM is ready.
 * Handles both cases where the DOM is already loaded or still loading.
 * 
 * @param {Function} fn - Function to execute when DOM is ready
 */
function onReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

/**
 * Makes an element clickable for navigation while preserving existing interactive elements.
 * Adds click and keyboard event handlers, accessibility attributes, and prevents
 * conflicts with links, buttons, and other interactive child elements.
 * 
 * @param {HTMLElement} element - Element to make clickable
 * @param {string} href - URL to navigate to when element is clicked
 * @param {Object} options - Configuration options
 * @param {string[]} options.excludeTags - HTML tag names to exclude from navigation (default: ['A', 'BUTTON'])
 * @param {string[]} options.excludeClasses - CSS class names to exclude from navigation (default: [])
 * @param {string} options.ariaLabel - Custom aria-label (optional, defaults to generic)
 */
function makeCardClickable(element, href, options = {}) {
  if (!element || !href) return;
  
  const { 
    excludeTags = ['A', 'BUTTON'], 
    excludeClasses = [],
    ariaLabel = null
  } = options;
  
  element.style.cursor = 'pointer';
  element.setAttribute('tabindex', '0');
  element.setAttribute('role', 'link');
  if (ariaLabel) {
    element.setAttribute('aria-label', ariaLabel);
  }
  
  element.addEventListener('click', function(e) {
    const isExcludedTag = excludeTags.includes(e.target.tagName);
    const isExcludedClass = excludeClasses.some(cls => 
      e.target.classList.contains(cls) || e.target.closest('.' + cls)
    );
    if (isExcludedTag || isExcludedClass) return;
    window.location.href = href;
  });
  
  element.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.location.href = href;
    }
  });
}

(function(){
  // Highlights navigation link matching the current page without duplicating markup.
  function setActiveNavLink() {
    const nav = document.getElementById('site-nav');
    if (!nav) return;

    const current = (location.pathname.replace(/^.*\//, '') || 'index.html').toLowerCase();
    nav.querySelectorAll('a[href]').forEach(link => {
      const target = (link.getAttribute('href') || '').replace(/^.*\//, '').toLowerCase();
      const isActive = current === target || (current === '' && target === 'index.html');
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  onReady(setActiveNavLink);
})();


(function(){
  function initNavToggle() {
    const toggle = document.getElementById('navToggle');
    const nav = document.getElementById('site-nav');
    if(!toggle || !nav) return;
    
    toggle.addEventListener('click', ()=>{
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  
  // Initialize when DOM is ready
  onReady(initNavToggle);
})();


(function(){
  function makeHomeCardsClickable(){
    // Make calendar card clickable
    const calendarCard = document.querySelector('.card.mini-calendar');
    if(calendarCard){
      makeCardClickable(calendarCard, 'calendar.html', {
        excludeClasses: ['pill'],
        ariaLabel: 'View full calendar'
      });
    }
    
    // Make My Events card clickable
    const myEventsCard = document.querySelector('#myEventsBar')?.closest('.card');
    if(myEventsCard){
      makeCardClickable(myEventsCard, 'events.html', {
        excludeClasses: ['event-chip'],
        ariaLabel: 'View my events'
      });
    }
  }
  
  onReady(makeHomeCardsClickable);
})();
