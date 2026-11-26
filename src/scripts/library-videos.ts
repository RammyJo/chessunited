import type Hls from 'hls.js';

// The streaming adapter is fetched only after a visitor presses Play.
let hlsModule: Promise<typeof import('hls.js')> | undefined;
const library = document.querySelector('[data-video-library]');
const players = [...(library?.querySelectorAll<HTMLVideoElement>('video') ?? [])];
players.forEach(video => {
  const card = video.closest('article')!;
  const launch = card.querySelector<HTMLButtonElement>('[data-stream-play]');
  const status = card.querySelector<HTMLElement>('[data-video-status]')!;
  let controller: Hls | undefined;
  const message = (text = '') => { status.textContent = text; status.hidden = !text; };
  video.addEventListener('playing', () => {
    message();
    if (launch) launch.hidden = true;
    players.forEach(other => { if (other !== video) other.pause(); });
  });
  if (video.dataset.videoKind !== 'hls') {
    video.addEventListener('error', () => message('The video could not load. Check your connection, then try playing it again.'));
    return;
  }
  // Safari/iOS can play the same playlist using their native video controls.
  if (video.canPlayType('application/vnd.apple.mpegurl')) return;
  if (!launch) return;
  video.querySelector('source')?.remove();
  video.controls = false;
  video.load();
  launch.hidden = false;
  launch.addEventListener('click', async () => {
    if (launch.disabled) return;
    launch.disabled = true;
    message('Loading video…');
    const retry = () => {
      controller?.destroy();
      controller = undefined;
      video.controls = false;
      launch.hidden = false;
      launch.disabled = false;
      message('The video could not load. Check your connection and press Play to try again.');
    };
    try {
      hlsModule ??= import('hls.js');
      const { default: HlsPlayer } = await hlsModule;
      if (!HlsPlayer.isSupported()) {
        message('To play this video, open this page in a current version of Safari, Chrome, Firefox or Edge.');
        launch.hidden = true;
        return;
      }
      controller = new HlsPlayer({ enableWorker: false, maxBufferLength: 30, maxMaxBufferLength: 60, backBufferLength: 20 });
      controller.on(HlsPlayer.Events.ERROR, (_event, data) => { if (data.fatal) retry(); });
      controller.once(HlsPlayer.Events.MANIFEST_PARSED, () => {
        video.controls = true;
        launch.hidden = true;
        void video.play().catch(() => message('The video is ready. Press Play in the video controls to watch.'));
      });
      controller.loadSource(video.dataset.streamSrc!);
      controller.attachMedia(video);
    } catch {
      // Let a later retry fetch a script again after a transient network failure.
      hlsModule = undefined;
      retry();
    }
  });
});
