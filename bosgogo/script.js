const menuButton = document.querySelector('.menu-button');
const mobileMenu = document.querySelector('#mobile-menu');
const closeMenu = () => {
  mobileMenu.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open menu');
};
menuButton.addEventListener('click', () => {
  const open = mobileMenu.hidden;
  mobileMenu.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});
mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !mobileMenu.hidden) {
    closeMenu();
    menuButton.focus();
  }
});
window.matchMedia('(min-width: 901px)').addEventListener('change', event => {
  if (event.matches) closeMenu();
});

document.querySelectorAll('[data-screen-explorer]').forEach(explorer => {
  const tabs = [...explorer.querySelectorAll('[role="tab"]')];
  const activate = (tab, moveFocus = false) => {
    tabs.forEach(candidate => {
      const selected = candidate === tab;
      candidate.setAttribute('aria-selected', String(selected));
      candidate.tabIndex = selected ? 0 : -1;
      document.getElementById(candidate.getAttribute('aria-controls')).hidden = !selected;
    });
    if (moveFocus) tab.focus();
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', event => {
      let target;
      if (event.key === 'ArrowRight') target = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') target = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') target = 0;
      if (event.key === 'End') target = tabs.length - 1;
      if (target === undefined) return;
      event.preventDefault();
      activate(tabs[target], true);
    });
  });
});
