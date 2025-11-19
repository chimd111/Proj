/*------------------------------------------------------------------------------
 * COMP 3020 HCI - UMSU Clubs Website
 * NAME: UMSU Clubs Website Event Management JavaScript
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
 * JavaScript module for managing event functionality on the UMSU Clubs website.
 * Handles localStorage-based persistence of user's saved events ("My Upcoming Events"),
 * dynamic rendering of event displays, filtering, sorting, and interactive elements
 * such as tearaway calendars and clickable event tiles.
 *------------------------------------------------------------------------------*/

(function(){
  const STORE_KEY = 'umsu.myEvents.v1';

  function readStore(){
    try{ return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }catch{ return []; }
  }

  function writeStore(list){ localStorage.setItem(STORE_KEY, JSON.stringify(list)); }

  function upsertEvent(ev){
    const list = readStore();
    const idx = list.findIndex(x => x.id === ev.id);
    if(idx >= 0){ list[idx] = ev; } else { list.push(ev); }
    writeStore(list);
    return list;
  }


  /**
   * Determines the category of an event based on its URL filename.
   * Maps specific event page filenames to their corresponding category names.
   * 
   * @param {string} url - Event page filename (e.g., "event-welcome-week-fair.html")
   * @returns {string} Category name (e.g., "General", "Technology", "Arts")
   */
  function getEventCategory(url){
    // Map event URLs to their categories based on events.html
    const categoryMap = {
      'event-welcome-week-fair.html': 'General',
      'event-hack-night.html': 'Technology',
      'event-robotics-workshop.html': 'Technology',
      'event-cultural-potluck.html': 'Cultural',
      'event-charity-drive.html': 'Service',
      'event-dance-night.html': 'Arts',
      'event-outdoor-rec-day-hike.html': 'Sports & Rec',
      'event-wis-mentor-panel.html': 'Academic',
      'event-art-jam.html': 'Arts',
      'event-meetup.html': 'General'
    };
    return categoryMap[url] || 'General';
  }

  /**
   * Maps a category name to its corresponding CSS class name for styling.
   * Converts category names to lowercase for case-insensitive matching.
   * 
   * @param {string} category - Category name (e.g., "Arts", "Technology")
   * @returns {string} CSS class name (e.g., "event-cat-arts", "event-cat-technology")
   */
  function getCategoryColorClass(category){
    const map = {
      'arts': 'event-cat-arts',
      'technology': 'event-cat-technology',
      'sports & rec': 'event-cat-sports',
      'sports': 'event-cat-sports',
      'general': 'event-cat-general',
      'cultural': 'event-cat-cultural',
      'service': 'event-cat-service',
      'academic': 'event-cat-academic'
    };
    const raw = (category || '').toLowerCase();
    return map[raw] || 'event-cat-general';
  }

  function bindEventDetail(){
    const root = document.getElementById('eventData');
    const btn = document.getElementById('btnSaveEvent');
    const more = document.getElementById('btnMoreClub');
    const notice = document.getElementById('saveNotice');
    if(!root || !btn) return;
    // Apply category-based styling to event detail page
    const url = location.pathname.replace(/^.*\//,'');
    const category = root.dataset.category || getEventCategory(url);
    const categoryClass = getCategoryColorClass(category);
    // Remove any existing category classes
    root.classList.remove('event-cat-arts','event-cat-technology','event-cat-sports','event-cat-general','event-cat-cultural','event-cat-service','event-cat-academic');
    // Add appropriate category class
    root.classList.add(categoryClass);
    // Ensure "More info on the club" points to the club page from data attributes
    if(more && root.dataset.clubUrl){
      more.setAttribute('href', root.dataset.clubUrl);
    }
    // Make the event-graphic (club icon box) clickable to navigate to club page
    const eventGraphic = document.querySelector('.event-graphic');
    if(eventGraphic && root.dataset.clubUrl){
      makeCardClickable(eventGraphic, root.dataset.clubUrl, {
        ariaLabel: `View ${root.dataset.club || 'club'} information`
      });
    }
    btn.addEventListener('click', function(){
      const url = location.pathname.replace(/^.*\//,''); // filename
      const datetime = root.dataset.datetime || '';
      const ev = {
        id: root.dataset.id,
        title: root.dataset.title,
        datetime: datetime,
        location: root.dataset.location,
        club: root.dataset.club,
        url: url,
        category: root.dataset.category || getEventCategory(url),
        date: root.dataset.date || extractDateFromDatetime(datetime)
      };
      upsertEvent(ev);
      btn.textContent = 'Added to My Upcoming Events';
      btn.disabled = true;
      if(notice){ notice.hidden = false; }
    });
  }

  /**
   * Removes an event from the stored events list by its ID.
   * 
   * @param {string} id - Unique identifier of the event to remove
   * @returns {Array<Object>} The updated events array after removal
   */
  function removeEvent(id){
    const list = readStore();
    const filtered = list.filter(x => x.id !== id);
    writeStore(filtered);
    return filtered;
  }


  /**
   * Extracts a YYYY-MM-DD date string from a datetime display string.
   * Parses formats like "Mon 5 Nov • 10:00–16:00" to extract day and month.
   * Assumes the year 2024 for all parsed dates.
   * 
   * @param {string} datetime - Datetime string in format "Day DD Mon • HH:MM–HH:MM"
   * @returns {string} ISO date string in YYYY-MM-DD format, or empty string if parsing fails
   */
  function extractDateFromDatetime(datetime){
    // Try to extract date from datetime string like "Mon 5 Nov • 10:00–16:00"
    if(!datetime) return '';
    // Try to match day and month from formats like "Mon 5 Feb" or "Tue 20 Feb"
    const match = datetime.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i);
    if(match) {
      const day = match[1];
      const month = match[2];
      // Map month abbreviation to full date (assuming current year, Feb 2024)
      const monthMap = {'jan':'01','feb':'02','mar':'03','apr':'04','may':'05','jun':'06','jul':'07','aug':'08','sep':'09','oct':'10','nov':'11','dec':'12'};
      const monthNum = monthMap[month.toLowerCase()] || '02';
      return `2024-${monthNum}-${day.padStart(2, '0')}`;
    }
    return '';
  }

  //------------------------------------------------------------------------------
  // Event Rendering Functions
  // Dynamically generates DOM elements to display saved events.
  // Includes tearaway calendar icons, club icons, and interactive controls.
  //------------------------------------------------------------------------------

  /**
   * Renders the "My Upcoming Events" list on the events page.
   * Creates article elements for each saved event, sorted chronologically.
   * Each event tile includes a tearaway calendar, event details, club icon, and remove button.
   * Makes entire event tiles clickable for navigation to event detail pages.
   */
  function renderMyEvents(){
    const container = document.getElementById('myEventsList');
    if(!container) return;
    const data = readStore();
    if(!data.length){
      container.innerHTML = '<p class="meta">No saved events yet.</p>';
      return;
    }
    
    // Sort events by date (earliest first)
    const sortedData = [...data].sort((a, b) => {
      const dateA = a.date || extractDateFromDatetime(a.datetime) || '';
      const dateB = b.date || extractDateFromDatetime(b.datetime) || '';
      
      // Events without dates go to the end
      if(!dateA && !dateB) return 0;
      if(!dateA) return 1;
      if(!dateB) return -1;
      
      // Compare dates (YYYY-MM-DD format allows direct string comparison)
      return dateA.localeCompare(dateB);
    });
    
    // Clear container first
    container.innerHTML = '';
    
    sortedData.forEach(ev => {
      const category = ev.category || getEventCategory(ev.url);
      const colorClass = getCategoryColorClass(category);
      const eventDate = ev.date || extractDateFromDatetime(ev.datetime);
      const clubIcon = getClubIcon(ev.club || '');
      
      const article = document.createElement('article');
      article.className = `event ${colorClass}`;
      
      const wrapper = document.createElement('div');
      wrapper.className = 'event-content-wrapper';
      
      // Tearaway calendar
      const calendarEl = createTearawayCalendar(eventDate);
      wrapper.appendChild(calendarEl);
      
      // Middle content
      const middleContent = document.createElement('div');
      middleContent.className = 'event-middle-content';
      middleContent.style.flex = '1';
      
      const titleEl = document.createElement('h3');
      const linkEl = document.createElement('a');
      linkEl.href = ev.url;
      linkEl.textContent = ev.title;
      titleEl.appendChild(linkEl);
      middleContent.appendChild(titleEl);
      
      const meta1 = document.createElement('p');
      meta1.className = 'meta';
      meta1.textContent = `${ev.datetime || ''} ${ev.location ? '• ' + ev.location : ''}`.trim();
      middleContent.appendChild(meta1);
      
      if(ev.club){
        const meta2 = document.createElement('p');
        meta2.className = 'meta';
        meta2.textContent = `Hosted by ${ev.club}`;
        middleContent.appendChild(meta2);
      }
      
      wrapper.appendChild(middleContent);
      
      // Club icon
      const clubIconEl = document.createElement('div');
      clubIconEl.className = 'event-club-icon';
      clubIconEl.setAttribute('aria-hidden', 'true');
      clubIconEl.textContent = clubIcon;
      wrapper.appendChild(clubIconEl);
      
      // Remove button
      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn event-remove-btn';
      removeBtn.setAttribute('data-remove-id', ev.id);
      removeBtn.style.cssText = 'flex-shrink:0;font-size:12px;padding:6px 10px;margin-left:8px';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', function(e){
        e.stopPropagation();
        removeEvent(ev.id);
        renderMyEvents();
        renderMyEventsBar();
        // Refresh Add buttons so they become available again
        addEventAddButtons();
      });
      wrapper.appendChild(removeBtn);
      
      makeCardClickable(article, ev.url, {
        ariaLabel: `Event: ${ev.title}`
      });
      
      article.appendChild(wrapper);
      container.appendChild(article);
    });
  }

  /**
   * Renders the "My Events" chip list on the main page.
   * Creates compact event chip elements for each saved event, sorted chronologically.
   * Each chip includes a tearaway calendar, event details, and club icon.
   * Makes entire chips clickable for navigation to event detail pages.
   */
  function renderMyEventsBar(){
    const container = document.getElementById('myEventsBar');
    if(!container) return;
    const data = readStore();
    if(!data.length){
      container.innerHTML = '<p class="meta">No saved events yet. Visit an event page and click "Add".</p>';
      return;
    }
    
    // Sort events by date (earliest first)
    const sortedData = [...data].sort((a, b) => {
      const dateA = a.date || extractDateFromDatetime(a.datetime) || '';
      const dateB = b.date || extractDateFromDatetime(b.datetime) || '';
      
      // Events without dates go to the end
      if(!dateA && !dateB) return 0;
      if(!dateA) return 1;
      if(!dateB) return -1;
      
      // Compare dates (YYYY-MM-DD format allows direct string comparison)
      return dateA.localeCompare(dateB);
    });
    
    // Clear container first
    container.innerHTML = '';
    const stack = document.createElement('div');
    stack.className = 'events-bar';
    
    sortedData.forEach(ev => {
      const category = ev.category || getEventCategory(ev.url);
      const colorClass = getCategoryColorClass(category).replace('event-', 'chip-');
      const eventDate = ev.date || extractDateFromDatetime(ev.datetime);
      const clubIcon = getClubIcon(ev.club || '');
      
      const chip = document.createElement('div');
      chip.className = `event-chip ${colorClass}`;
      
      const wrapper = document.createElement('div');
      wrapper.className = 'event-content-wrapper';
      
      // Tearaway calendar
      const calendarEl = createTearawayCalendar(eventDate);
      wrapper.appendChild(calendarEl);
      
      // Middle content
      const middleContent = document.createElement('div');
      middleContent.className = 'event-middle-content';
      middleContent.style.flex = '1';
      
      const titleEl = document.createElement('div');
      const linkEl = document.createElement('a');
      linkEl.href = ev.url;
      linkEl.textContent = ev.title;
      linkEl.style.cssText = 'color:var(--brand);text-decoration:none;font-weight:600';
      titleEl.appendChild(linkEl);
      middleContent.appendChild(titleEl);
      
      const meta1 = document.createElement('div');
      meta1.className = 'meta';
      meta1.textContent = `${ev.datetime || ''}${ev.location ? ' • ' + ev.location : ''}`.trim();
      middleContent.appendChild(meta1);
      
      if(ev.club){
        const meta2 = document.createElement('div');
        meta2.className = 'meta';
        meta2.textContent = ev.club;
        middleContent.appendChild(meta2);
      }
      
      wrapper.appendChild(middleContent);
      
      // Club icon
      const clubIconEl = document.createElement('div');
      clubIconEl.className = 'event-club-icon';
      clubIconEl.setAttribute('aria-hidden', 'true');
      clubIconEl.textContent = clubIcon;
      wrapper.appendChild(clubIconEl);
      
      chip.appendChild(wrapper);
      
      // Make chip clickable
      makeCardClickable(chip, ev.url, {
        ariaLabel: `Event: ${ev.title}`
      });
      
      stack.appendChild(chip);
    });
    
    container.appendChild(stack);
  }

  /**
   * Public API exposed to the global window object for external use.
   * Allows manual triggering of event list rendering if needed.
   * 
   * @namespace window.UMSUEvents
   * @property {Function} renderMyEvents - Renders "My Upcoming Events" on events page
   * @property {Function} renderMyEventsBar - Renders "My Events" chips on main page
   */
  // Expose for inline use if needed
  window.UMSUEvents = { renderMyEvents, renderMyEventsBar };


  /**
   * Binds filter controls (search, category, club) for the calendar page.
   * Filters calendar event pills based on user input, showing/hiding matching events.
   * Applies filters in real-time as the user types or selects options.
   */
  function bindCalendarFilters(){
    const grid = document.querySelector('.calendar-grid');
    const search = document.getElementById('calSearch');
    const cat = document.getElementById('calCategory');
    const club = document.getElementById('calClub');
    if(!grid) return;

    const pills = Array.from(grid.querySelectorAll('.pill'));
    const norm = s => (s||'').toLowerCase();

    function apply(){
      const q = norm(search && search.value);
      const c = cat && cat.value;
      const cl = club && club.value;
      pills.forEach(a => {
        const t = norm(a.dataset.title || a.textContent);
        const ac = a.dataset.category || '';
        const ab = a.dataset.club || '';
        const matchQ = !q || t.includes(q);
        const matchC = !c || ac === c;
        const matchB = !cl || ab === cl;
        a.style.display = (matchQ && matchC && matchB) ? '' : 'none';
      });
    }

    search && search.addEventListener('input', apply);
    cat && cat.addEventListener('change', apply);
    club && club.addEventListener('change', apply);
    apply();
  }

  /**
   * Applies category-based CSS classes to calendar event pills for color coding.
   * Removes existing category classes before adding the appropriate one.
   */
  function applyCategoryColors(){
    const pills = Array.from(document.querySelectorAll('.calendar-grid .pill'));
    const map = {
      'arts':'cat-arts',
      'technology':'cat-technology',
      'sports & rec':'cat-sports',
      'sports':'cat-sports',
      'general':'cat-general',
      'cultural':'cat-cultural',
      'service':'cat-service',
      'academic':'cat-academic'
    };
    pills.forEach(a => {
      // remove any previous cat- classes
      a.classList.remove('cat-arts','cat-technology','cat-sports','cat-general','cat-cultural','cat-service');
      const raw = (a.dataset.category || '').toLowerCase();
      const klass = map[raw] || 'cat-general';
      a.classList.add(klass);
    });
  }

  /**
   * Marks calendar event pills that correspond to saved events in "My Upcoming Events".
   * Adds a "mine" CSS class to pills whose event URL matches a saved event.
   * Used to visually highlight saved events on the calendar view.
   */
  function markMyEventsOnCalendars(){
    // Mark any .pill whose href filename matches a saved event url
    const saved = new Set((readStore() || []).map(ev => ev.url));
    const pills = Array.from(document.querySelectorAll('.calendar-grid .pill'));
    pills.forEach(a => {
      const href = a.getAttribute('href') || '';
      const file = href.split('/').pop();
      if(saved.has(file)) a.classList.add('mine'); else a.classList.remove('mine');
    });
  }


  /**
   * Makes event tiles clickable for navigation to event detail pages.
   * Works on both the main events page and club detail pages.
   * Adds keyboard navigation support (Enter/Space keys) and accessibility attributes.
   * Prevents navigation when clicking on buttons or links within the tile.
   */
  function makeEventBoxesClickable(){
    // Find events on events page (#eventsList) or on club pages (.list.events)
    const eventsList = document.getElementById('eventsList');
    const clubEventsList = document.querySelector('main .list.events');
    const container = eventsList || clubEventsList;
    if(!container) return;
    
    const events = container.querySelectorAll('.event');
    events.forEach(article => {
      const link = article.querySelector('h3 a') || article.querySelector('.event-middle-content h3 a');
      if(!link) return;
      const href = link.getAttribute('href');
      if(!href) return;
      
      makeCardClickable(article, href, {
        ariaLabel: `Event: ${article.dataset.title || link.textContent}`
      });
    });
  }

  /**
   * Sorts events within a container by their date attribute in ascending order.
   * Events with earlier dates appear first. Events without dates are placed at the end.
   * Modifies the DOM by reordering the event articles within the container.
   * 
   * @param {HTMLElement} container - The container element containing event articles to sort
   */
  function sortEventsByDate(container){
    if(!container) return;
    const events = Array.from(container.querySelectorAll('.event'));
    
    // Sort events by date
    events.sort((a, b) => {
      const dateA = a.dataset.date || '';
      const dateB = b.dataset.date || '';
      
      // Events without dates go to the end
      if(!dateA && !dateB) return 0;
      if(!dateA) return 1;
      if(!dateB) return -1;
      
      // Compare dates (YYYY-MM-DD format allows direct string comparison)
      return dateA.localeCompare(dateB);
    });
    
    // Re-append sorted events to maintain order
    events.forEach(event => container.appendChild(event));
  }

  //------------------------------------------------------------------------------
  // Event Filtering and Sorting
  // Handles multi-criteria filtering (search, category, club, date range) for events.
  // Maintains chronological sorting of filtered results.
  //------------------------------------------------------------------------------

  /**
   * Binds filter controls for the events page.
   * Filters events by search text, category, club, and date range (start and end dates).
   * Re-sorts visible events chronologically after filtering.
   * Sets min/max constraints on date inputs based on available event dates.
   * Handles edge cases such as swapped date ranges and out-of-bounds selections.
   */
  function bindEventFilters(){
    const container = document.getElementById('eventsList');
    if(!container) return;
    const events = Array.from(container.querySelectorAll('.event'));
    const search = document.getElementById('eventSearch');
    const cat = document.getElementById('eventCategory');
    const club = document.getElementById('eventClub');
    const dateStart = document.getElementById('eventDateStart');
    const dateEnd = document.getElementById('eventDateEnd');
    
    const norm = s => (s||'').toLowerCase();

    // Determine event date bounds (ISO YYYY-MM-DD strings sort lexicographically)
    const eventDates = events
      .map(a => (a.dataset.date || '').trim())
      .filter(Boolean)
      .sort((a,b) => a.localeCompare(b));
    const minEventDate = eventDates[0] || '';
    const maxEventDate = eventDates[eventDates.length - 1] || '';

    // Set input min/max to guide valid selections
    if(dateStart){
      if(minEventDate) dateStart.min = minEventDate;
      if(maxEventDate) dateStart.max = maxEventDate;
    }
    if(dateEnd){
      if(minEventDate) dateEnd.min = minEventDate;
      if(maxEventDate) dateEnd.max = maxEventDate;
    }

    function apply(){
      const q = norm(search && search.value);
      const c = cat && cat.value;
      const cl = club && club.value;
      let startDate = dateStart && dateStart.value ? dateStart.value.trim() : '';
      let endDate = dateEnd && dateEnd.value ? dateEnd.value.trim() : '';

      // Normalize invalid ranges by swapping when start > end
      if(startDate && endDate && startDate > endDate){
        const tmp = startDate; startDate = endDate; endDate = tmp;
        if(dateStart) dateStart.value = startDate;
        if(dateEnd) dateEnd.value = endDate;
      }

      // If only Start is set beyond the last event, clear it (show all)
      if(startDate && !endDate && maxEventDate && startDate > maxEventDate){
        startDate = '';
        if(dateStart) dateStart.value = '';
      }
      // If only End is set before the first event, clear it (show all)
      if(endDate && !startDate && minEventDate && endDate < minEventDate){
        endDate = '';
        if(dateEnd) dateEnd.value = '';
      }

      let visibleCount = 0;
      events.forEach(article => {
        const title = norm(article.dataset.title || article.textContent);
        const category = article.dataset.category || '';
        const eventClub = article.dataset.club || '';
        const eventDate = (article.dataset.date || '').trim();

        const matchQ = !q || title.includes(q);
        const matchC = !c || category === c;
        const matchB = !cl || eventClub === cl;
        
        // Inclusive date range matching
        let matchDate = true;
        if(eventDate){
          if(startDate && eventDate < startDate) matchDate = false;
          if(endDate && eventDate > endDate) matchDate = false;
        }

        const shouldShow = matchQ && matchC && matchB && matchDate;
        article.style.display = shouldShow ? '' : 'none';
        if(shouldShow) visibleCount++;
      });
      
      // Re-sort visible events after filtering
      sortEventsByDate(container);
    }

    search && search.addEventListener('input', apply);
    cat && cat.addEventListener('change', apply);
    club && club.addEventListener('change', apply);
    dateStart && dateStart.addEventListener('input', apply);
    dateStart && dateStart.addEventListener('change', apply);
    dateEnd && dateEnd.addEventListener('input', apply);
    dateEnd && dateEnd.addEventListener('change', apply);
    // Apply filters on initial load to handle any pre-set values
    apply();
  }

  /**
   * Applies category-based CSS classes to event articles for visual color coding.
   * Works on both the main events page and club detail pages.
   * Removes existing category classes before adding the appropriate one based on data-category attribute.
   */
  function applyEventCategoryColors(){
    // Find events on events page (#eventsList) or on club pages (.list.events)
    const eventsList = document.getElementById('eventsList');
    const clubEventsList = document.querySelector('main .list.events');
    const container = eventsList || clubEventsList;
    if(!container) return;
    
    const events = Array.from(container.querySelectorAll('.event'));
    const map = {
      'arts':'cat-arts',
      'technology':'cat-technology',
      'sports & rec':'cat-sports',
      'sports':'cat-sports',
      'general':'cat-general',
      'cultural':'cat-cultural',
      'service':'cat-service',
      'academic':'cat-academic'
    };
    events.forEach(article => {
      // Remove any previous category background classes
      article.classList.remove('event-cat-arts','event-cat-technology','event-cat-sports','event-cat-general','event-cat-cultural','event-cat-service','event-cat-academic');
      const raw = (article.dataset.category || '').toLowerCase();
      const klass = 'event-' + (map[raw] || 'cat-general');
      article.classList.add(klass);
    });
  }


  /**
   * Maps club names to emoji icons for visual representation.
   * Returns a default star icon if the club name is not found in the mapping.
   * 
   * @param {string} clubName - Name of the club
   * @returns {string} Emoji icon string
   */
  function getClubIcon(clubName){
    const clubIconMap = {
      'Art Society': '🎨',
      'Robotics Club': '🤖',
      'Dance Club': '💃',
      'Outdoor Rec': '🥾',
      'Cultural Exchange': '🌍',
      'Women in STEM': '🧪',
      'Volunteers United': '🤝',
      'UMSU Clubs': '🎉'
    };
    return clubIconMap[clubName] || '⭐';
  }

  /**
   * Formats a YYYY-MM-DD date string into day and month abbreviation components.
   * Used for displaying dates in the tearaway calendar widget.
   * 
   * @param {string} dateString - ISO date string in YYYY-MM-DD format
   * @returns {Object} Object with `day` (number) and `month` (string, e.g., "Nov") properties
   */
  function formatDateForCalendar(dateString){
    if(!dateString) return { day: '', month: '' };
    try {
      const date = new Date(dateString + 'T00:00:00');
      const day = date.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      return { day, month };
    } catch(e) {
      return { day: '', month: '' };
    }
  }

  /**
   * Creates a tearaway-style calendar widget DOM element displaying a date.
   * Generates a visually styled calendar component with a torn top edge effect.
   * Used to display event dates in a distinctive, calendar-like format.
   * 
   * @param {string} dateString - ISO date string in YYYY-MM-DD format
   * @returns {HTMLElement} A div element with class "tearaway-calendar" containing the calendar widget
   */
  function createTearawayCalendar(dateString){
    const { day, month } = formatDateForCalendar(dateString);
    
    const calendarEl = document.createElement('div');
    calendarEl.className = 'tearaway-calendar';
    calendarEl.setAttribute('aria-hidden', 'true');
    
    // Top tear effect
    const tearTop = document.createElement('div');
    tearTop.className = 'calendar-tear-top';
    
    // Calendar body
    const calendarBody = document.createElement('div');
    calendarBody.className = 'calendar-body';
    
    const monthEl = document.createElement('div');
    monthEl.className = 'calendar-month';
    monthEl.textContent = month;
    
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    dayEl.textContent = day;
    
    calendarBody.appendChild(monthEl);
    calendarBody.appendChild(dayEl);
    
    calendarEl.appendChild(tearTop);
    calendarEl.appendChild(calendarBody);
    
    return calendarEl;
  }

  /**
   * Dynamically adds tearaway calendar and club icons to event tiles.
   * Restructures existing event HTML to include calendar widget on the left and club icon on the right.
   * Preserves existing content (title, meta info, description) in a middle content area.
   * Marks processed events to prevent duplicate processing.
   * Works on both the main events page and club detail pages.
   */
  function addEventIcons(){
    // Find events on events page (#eventsList) or on club pages (.list.events)
    const eventsList = document.getElementById('eventsList');
    const clubEventsList = document.querySelector('main .list.events');
    const container = eventsList || clubEventsList;
    if(!container) return;
    
    const events = Array.from(container.querySelectorAll('.event'));
    events.forEach(article => {
      // Skip if already processed
      if(article.classList.contains('has-icons')) return;
      
      const clubName = article.dataset.club || '';
      const clubIcon = getClubIcon(clubName);
      const eventDate = article.dataset.date || '';
      
      // Get existing content
      const titleEl = article.querySelector('h3');
      const metaEl = article.querySelector('.meta');
      const descEl = article.querySelector('p:not(.meta)');
      
      if(!titleEl) return;
      
      // Create new structure
      const wrapper = document.createElement('div');
      wrapper.className = 'event-content-wrapper';
      
      // Tearaway calendar on left
      const calendarEl = createTearawayCalendar(eventDate);
      
      // Middle content
      const middleContent = document.createElement('div');
      middleContent.className = 'event-middle-content';
      if(titleEl) middleContent.appendChild(titleEl.cloneNode(true));
      if(metaEl) middleContent.appendChild(metaEl.cloneNode(true));
      if(descEl) middleContent.appendChild(descEl.cloneNode(true));
      
      // Club icon on right
      const clubIconEl = document.createElement('div');
      clubIconEl.className = 'event-club-icon';
      clubIconEl.setAttribute('aria-hidden', 'true');
      clubIconEl.textContent = clubIcon;
      
      wrapper.appendChild(calendarEl);
      wrapper.appendChild(middleContent);
      wrapper.appendChild(clubIconEl);
      
      // Clear existing content and add wrapper
      article.innerHTML = '';
      article.appendChild(wrapper);
      article.classList.add('has-icons');
    });
  }

  /**
   * Adds "Add" buttons to event tiles on the events page.
   * Buttons are disabled for events already saved in "My Upcoming Events".
   * Updates button states when events are added or removed.
   * Handles button state synchronization across the page and with localStorage changes.
   * Inserts buttons before the club icon in the event content wrapper.
   */
  function addEventAddButtons(){
    // Find events on events page (#eventsList) only
    const eventsList = document.getElementById('eventsList');
    if(!eventsList) return;
    
    const events = Array.from(eventsList.querySelectorAll('.event'));
    const savedEvents = new Set((readStore() || []).map(ev => ev.id));
    
    events.forEach(article => {
      const titleLink = article.querySelector('.event-middle-content h3 a') || article.querySelector('h3 a');
      if(!titleLink) return;
      
      const eventUrl = titleLink.getAttribute('href') || '';
      const eventTitle = article.dataset.title || titleLink.textContent || '';
      // Generate event ID from URL (e.g., "event-welcome-week-fair.html" -> "event-welcome-week-fair")
      const eventId = eventUrl ? eventUrl.replace('.html', '').replace(/^.*\//, '') : `event-${eventTitle.toLowerCase().replace(/\s+/g, '-')}`;
      const metaText = article.querySelector('.event-middle-content .meta')?.textContent || article.querySelector('.meta')?.textContent || '';
      
      const isSaved = savedEvents.has(eventId);
      
      // Find wrapper (should exist after addEventIcons runs)
      const wrapper = article.querySelector('.event-content-wrapper');
      if(!wrapper) return;
      
      // Check if button already exists
      let addBtn = article.querySelector('.event-add-btn');
      
      if(addBtn){
        // Update existing button state
        addBtn.disabled = isSaved;
      } else {
        // Create Add button
        addBtn = document.createElement('button');
        addBtn.className = 'event-add-btn btn';
        addBtn.textContent = 'Add';
        addBtn.disabled = isSaved;
        addBtn.style.cssText = 'flex-shrink:0;font-size:12px;padding:6px 10px;margin-left:8px';
        
        addBtn.addEventListener('click', function(e){
          e.stopPropagation();
          
          // Extract event data
          const url = eventUrl.split('/').pop() || eventUrl;
          const locationMatch = metaText.match(/•\s*([^•]+)$/);
          const location = locationMatch ? locationMatch[1].trim() : '';
          
          const ev = {
            id: eventId,
            title: eventTitle,
            datetime: metaText,
            location: location,
            club: article.dataset.club || '',
            url: url,
            category: article.dataset.category || getEventCategory(url),
            date: article.dataset.date || extractDateFromDatetime(metaText)
          };
          
          upsertEvent(ev);
          addBtn.disabled = true;
          
          // Refresh My Events displays
          renderMyEvents();
          renderMyEventsBar();
          
          // Update all button states in case IDs changed
          addEventAddButtons();
        });
        
        // Insert button before club icon (or append if no club icon)
        const clubIcon = wrapper.querySelector('.event-club-icon');
        if(clubIcon){
          wrapper.insertBefore(addBtn, clubIcon);
        } else {
          wrapper.appendChild(addBtn);
        }
      }
    });
  }

  function initEvents() {
    bindEventDetail(); 
    renderMyEvents(); 
    renderMyEventsBar(); 
    bindCalendarFilters(); 
    applyCategoryColors(); 
    markMyEventsOnCalendars();
    // Sort events by date before applying filters and styling
    const eventsList = document.getElementById('eventsList');
    if(eventsList) sortEventsByDate(eventsList);
    bindEventFilters();
    applyEventCategoryColors();
    addEventIcons();
    addEventAddButtons();
    makeEventBoxesClickable();
  }

  // Auto-bind when relevant DOM exists
  onReady(initEvents);

  window.addEventListener('storage', function(e){
    if(e && e.key && e.key !== 'umsu.myEvents.v1') return;
    markMyEventsOnCalendars();
    renderMyEvents();
    renderMyEventsBar();
    // Update Add button states
    addEventAddButtons();
  });
})();
