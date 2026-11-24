(() => {
  const library = document.querySelector('[data-youtube-library]');
  if (!library) return;
  const stage = library.querySelector('[data-youtube-stage]');
  const launch = library.querySelector('[data-youtube-launch]');
  const choices = [...library.querySelectorAll('[data-youtube-select]')];
  const title = library.querySelector('[data-youtube-title]');
  const category = library.querySelector('[data-youtube-category]');
  const external = library.querySelector('[data-youtube-external]');
  let selected = choices[0];

  function choose(choice) {
    selected = choice;
    for (const button of choices) button.setAttribute('aria-pressed', String(button === selected));
    title.textContent = selected.dataset.videoTitle;
    category.textContent = selected.dataset.videoCategory;
    launch.setAttribute('aria-label', `Play ${selected.dataset.videoTitle}`);
    external.href = `https://www.youtube.com/watch?v=${selected.dataset.videoId}`;
  }

  function play() {
    const id = selected.dataset.videoId;
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return;
    const frame = document.createElement('iframe');
    const url = new URL(`https://www.youtube-nocookie.com/embed/${id}`);
    url.search = new URLSearchParams({ autoplay: '1', rel: '0', playsinline: '1' });
    frame.src = url.href;
    frame.title = `${selected.dataset.videoTitle} — YouTube player`;
    frame.width = '1280'; frame.height = '720';
    frame.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    // Replacing the previous frame stops its sound before another video loads.
    stage.querySelector('iframe')?.remove();
    launch.hidden = true;
    stage.append(frame);
  }

  choices.forEach(choice => {
    choice.hidden = false;
    choice.addEventListener('click', () => {
      choose(choice);
      play();
      history.replaceState(null, '', `#${selected.dataset.videoSlug}`);
      const panel = library.querySelector('.watch-panel');
      const rect = panel.getBoundingClientRect();
      if (rect.top < 82 || rect.top > innerHeight / 2) panel.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    });
  });
  launch.hidden = false;
  launch.addEventListener('click', play);
  const hash = location.hash.slice(1);
  const initial = choices.find(choice => choice.dataset.videoSlug === hash);
  if (initial) choose(initial);
  window.addEventListener('hashchange', () => {
    const target = choices.find(choice => choice.dataset.videoSlug === location.hash.slice(1));
    if (target) {
      stage.querySelector('iframe')?.remove();
      launch.hidden = false;
      choose(target);
    }
  });
})();
