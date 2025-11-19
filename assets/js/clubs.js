/*------------------------------------------------------------------------------
 * COMP 3020 HCI - UMSU Clubs Website
 * NAME: UMSU Clubs Website Clubs Page JavaScript
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
 * JavaScript module for clubs page functionality. Handles client-side filtering
 * of club cards by search term and category, and makes entire club cards
 * clickable for navigation to club detail pages.
 *------------------------------------------------------------------------------*/


(function(){
  const grid = document.getElementById('clubGrid');
  if(!grid) return;
  const cards = Array.from(grid.querySelectorAll('.card'));
  const q = document.getElementById('search');
  const cat = document.getElementById('category');

  function normalize(s){ return (s||'').toLowerCase(); }

  function apply(){
    const needle = normalize(q && q.value);
    const category = cat && cat.value;
    cards.forEach(card => {
      const name = normalize(card.dataset.name);
      const text = normalize(card.textContent);
      const c = card.dataset.category || '';
      const matchText = !needle || name.includes(needle) || text.includes(needle);
      const matchCat = !category || c === category;
      card.style.display = (matchText && matchCat) ? '' : 'none';
    });
  }


  function makeClubCardsClickable(){
    cards.forEach(card => {
      const link = card.querySelector('.card-link');
      if(!link) return;
      const href = link.getAttribute('href');
      if(!href) return;
      
      makeCardClickable(card, href, {
        ariaLabel: `Club: ${card.dataset.name || link.textContent}`
      });
    });
  }

  q && q.addEventListener('input', apply);
  cat && cat.addEventListener('change', apply);
  apply();
  
  // Make cards clickable after filtering is set up
  onReady(makeClubCardsClickable);
})();

