import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// Check if the device is in desktop mode
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Handles the Escape key to close the menu or collapse dropdowns.
 */
function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const expandedSection = nav.querySelector('[aria-expanded="true"]');

    if (expandedSection) {
      if (isDesktop.matches) {
        toggleAllSections(nav, false);
        expandedSection.focus();
      } else {
        toggleMenu(nav, false);
        nav.querySelector('.nav-hamburger button').focus();
      }
    }
  }
}

/**
 * Toggles all sections within the navigation.
 * @param {Element} nav The navigation container
 * @param {Boolean} expanded Whether sections should be expanded or collapsed
 */
function toggleAllSections(nav, expanded = false) {
  nav.querySelectorAll('.nav-drop').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the main navigation menu.
 * @param {Element} nav The navigation container
 * @param {Boolean} forceExpanded Force the menu to a specific state (true/false)
 */
function toggleMenu(nav, forceExpanded = null) {
  const isCurrentlyExpanded = nav.getAttribute('aria-expanded') === 'true';
  const expanded = forceExpanded !== null ? forceExpanded : !isCurrentlyExpanded;
  const hamburgerButton = nav.querySelector('.nav-hamburger button');

  nav.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  document.body.style.overflowY = expanded && !isDesktop.matches ? 'hidden' : '';
  hamburgerButton.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');

  toggleAllSections(nav, expanded || isDesktop.matches);
}

/**
 * Adds functionality for dropdown navigation on desktop and mobile.
 * @param {Element} nav The navigation container
 */
function enableDropdowns(nav) {
  const navSections = nav.querySelector('.nav-sections');
  navSections.querySelectorAll('.nav-drop').forEach((dropdown) => {
    if (isDesktop.matches) {
      dropdown.addEventListener('click', () => {
        const expanded = dropdown.getAttribute('aria-expanded') === 'true';
        toggleAllSections(navSections, false);
        dropdown.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      });
    } else {
      dropdown.removeEventListener('click', () => {});
    }
  });
}

/**
 * Decorates and initializes the header navigation block.
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // Load navigation as a fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // Clear block and create navigation container
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // Add classes to navigation sections
  ['brand', 'sections', 'tools'].forEach((className, index) => {
    const section = nav.children[index];
    if (section) section.classList.add(`nav-${className}`);
  });

  // Add dropdown functionality to sections
  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll('ul > li').forEach((li) => {
      if (li.querySelector('ul')) {
        li.classList.add('nav-drop');
        li.setAttribute('aria-expanded', 'false');
      }
    });
    enableDropdowns(nav);
  }

  // Create a hamburger button for mobile navigation
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = `
    <button type="button" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>
  `;
  hamburger.addEventListener('click', () => toggleMenu(nav));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  // Handle screen resizing and toggle menu accordingly
  isDesktop.addEventListener('change', () => toggleMenu(nav, isDesktop.matches));

  // Wrap and append navigation
  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  // Close on Escape key
  window.addEventListener('keydown', closeOnEscape);
}
