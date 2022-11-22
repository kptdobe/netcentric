import { readBlockConfig, decorateIcons } from '../../scripts/lib-franklin.js';

const mobileBreakpoint = 922;
let globalWindowWidth = window.innerWidth;

/**
 * collapses all open nav sections
 * @param {Element} sections The container element
 */
function collapseAllNavSections(sections) {
  sections.querySelectorAll(':scope .nav-drop').forEach((section) => {
    section.setAttribute('aria-expanded', 'false');
  });
}

/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */

export default async function decorate(block) {
  const cfg = readBlockConfig(block);
  block.textContent = '';

  // fetch nav content
  const navPath = cfg.nav || '/nav';
  const resp = await fetch(`${navPath}.plain.html`);
  if (resp.ok) {
    const html = await resp.text();

    // decorate nav DOM
    const nav = document.createElement('nav');
    nav.innerHTML = html;

    const classes = ['brand', 'sections', 'tools'];
    classes.forEach((e, j) => {
      const section = nav.children[j];
      if (section) section.classList.add(`nav-${e}`);
    });

    const navSections = [...nav.children][1];

    // Set up sub menu classes and elements
    navSections.querySelectorAll(':scope ul > li').forEach((section) => {
      const subSection = section.querySelector(':scope > ul');
      if (subSection) {
        // Add icon to open sub-section
        const openArrow = document.createElement('span');
        openArrow.classList.add('icon', 'icon-submenu-arrow', 'open-menu-arrow');
        section.append(openArrow);
        section.classList.add('nav-drop');

        // Add wrapper div to center dropdown items on screen
        const wrapperDiv = document.createElement('div');
        wrapperDiv.classList.add('nav-drop-ul-wrapper');
        wrapperDiv.append(subSection);
        section.insertBefore(wrapperDiv, openArrow);

        // Add icon/text to close sub-section
        const sectionBack = section.querySelector('a')?.outerHTML ?? '<span>Back</span>';
        const backLi = document.createElement('li');
        const closeArrow = document.createElement('span');
        closeArrow.classList.add('icon', 'icon-submenu-arrow', 'close-menu-arrow');
        backLi.innerHTML = sectionBack;
        backLi.classList.add('back-button');
        backLi.prepend(closeArrow.cloneNode());
        subSection.prepend(backLi);
      }
    });

    // const removeAllEventListeners = (element) => {
    //   // TODO fix
    //   element.parentNode.replaceChild(element.cloneNode(true), element);
    // };

    const attachEventListenersDesktop = () => {
      // all nav open
      block.querySelectorAll('.nav-sections ul > .nav-drop').forEach((navSection) => {
        navSection.addEventListener('mouseenter', () => {
          collapseAllNavSections(navSection.parentElement);
          navSection.setAttribute('aria-expanded', 'true');
        });
      });

      // sub-level nav close
      // TODO: Once all the links in the nav are done properly, make it so only hovering a new
      //  anchor will close the current section
      block.querySelectorAll('.nav-sections ul > .nav-drop ul > .nav-drop').forEach((navSection) => {
        navSection.addEventListener('mouseleave', () => {
          collapseAllNavSections(navSection.parentElement);
        });
      });

      // top-level nav close
      navSections.addEventListener('mouseleave', () => {
        collapseAllNavSections(navSections);
      });
    };

    const attachEventListenersMobile = () => {
      block.querySelectorAll('span.icon.open-menu-arrow').forEach((expansionArrow) => {
        expansionArrow.addEventListener('click', () => {
          const section = expansionArrow.parentElement;
          section.setAttribute('aria-expanded', 'true');
        });
      });
      block.querySelectorAll('span.icon.close-menu-arrow').forEach((expansionArrow) => {
        expansionArrow.addEventListener('click', () => {
          const section = expansionArrow.closest('li[aria-expanded="true"]');
          section.setAttribute('aria-expanded', 'false');
        });
      });
    };

    const reAttachEventListeners = () => {
      if (window.innerWidth < mobileBreakpoint) {
        attachEventListenersMobile();
      } else {
        attachEventListenersDesktop();
      }
    };

    const shouldResize = () => {
      const resize = (window.innerWidth > mobileBreakpoint && globalWindowWidth <= mobileBreakpoint)
        || (window.innerWidth < mobileBreakpoint && globalWindowWidth >= mobileBreakpoint);
      globalWindowWidth = window.innerWidth;
      return resize;
    };

    // hamburger for mobile
    const hamburger = document.createElement('div');
    hamburger.classList.add('nav-hamburger');
    hamburger.innerHTML = '<div class="nav-hamburger-icon"></div>';
    hamburger.addEventListener('click', () => {
      const expanded = nav.getAttribute('aria-expanded') === 'true';
      document.body.style.overflowY = expanded ? '' : 'hidden';
      nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    });
    nav.prepend(hamburger);
    nav.setAttribute('aria-expanded', 'false');
    decorateIcons(nav);
    block.append(nav);

    window.addEventListener('resize', () => {
      if (shouldResize()) {
        nav.setAttribute('aria-expanded', 'false');
        collapseAllNavSections(block);
        reAttachEventListeners();
      }
    });

    reAttachEventListeners();
  }
}
