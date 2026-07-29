(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  const loader = $('#loadingScreen');
  const hideLoader = () => loader?.classList.add('hidden');
  window.addEventListener('load', () => setTimeout(hideLoader, 250), { once: true });
  setTimeout(hideLoader, 3000);

  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    $$('.reveal').forEach((el) => observer.observe(el));
  } else {
    $$('.reveal').forEach((el) => el.classList.add('visible'));
  }

  const progress = $('#scrollProgress');
  const backTop = $('#backToTop');
  const handleScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
    backTop?.classList.toggle('visible', scrollY > 500);
  };
  addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
  backTop?.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  const target = new Date('2026-08-08T09:30:00+07:00').getTime();
  const updateCountdown = () => {
    const diff = target - Date.now();
    const ids = ['days', 'hours', 'minutes', 'seconds'];
    if (diff <= 0) {
      ids.forEach((id) => { const el = $('#' + id); if (el) el.textContent = '00'; });
      const msg = $('#countdownMessage'); if (msg) msg.textContent = '🎉 Hôm nay là ngày tốt nghiệp!';
      return;
    }
    const values = [Math.floor(diff / 86400000), Math.floor(diff / 3600000) % 24, Math.floor(diff / 60000) % 60, Math.floor(diff / 1000) % 60];
    ids.forEach((id, i) => { const el = $('#' + id); if (el) el.textContent = String(values[i]).padStart(2, '0'); });
  };
  updateCountdown();
  setInterval(updateCountdown, 1000);

  const audio = $('#bgMusic');
  const player = $('#musicPlayer');
  const playBtn = $('#musicToggle');
  const muteBtn = $('#muteToggle');
  const syncAudio = () => {
    if (playBtn && audio) playBtn.textContent = audio.paused ? '▶' : '❚❚';
    if (muteBtn && audio) muteBtn.textContent = audio.muted ? '🔇' : '🔊';
  };
  $('#openInvitation')?.addEventListener('click', async () => {
    player?.classList.add('visible');
    try { await audio?.play(); } catch (_) {}
    syncAudio();
    launchConfetti();
    $('#message')?.scrollIntoView({ behavior: 'smooth' });
  });
  playBtn?.addEventListener('click', async () => {
    if (!audio) return;
    if (audio.paused) { try { await audio.play(); } catch (_) {} } else audio.pause();
    syncAudio();
  });
  muteBtn?.addEventListener('click', () => { if (audio) { audio.muted = !audio.muted; syncAudio(); } });
  audio?.addEventListener('play', syncAudio);
  audio?.addEventListener('pause', syncAudio);

  const lightbox = $('#lightbox');
  const closeLightbox = () => { if (lightbox) lightbox.hidden = true; };
  $('#openLightbox')?.addEventListener('click', () => { if (lightbox) lightbox.hidden = false; });
  $('#closeLightbox')?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

  function launchConfetti() {
    const canvas = $('#confettiCanvas');
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const mobile = innerWidth < 700;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const colors = ['#f0c45e', '#ffe49b', '#ffffff', '#204098'];
    const pieces = Array.from({ length: mobile ? 70 : 140 }, () => ({
      x: innerWidth / 2, y: innerHeight * .35, vx: (Math.random() - .5) * 13, vy: -Math.random() * 10 - 3,
      g: .22, r: Math.random() * 5 + 3, a: 1, rot: Math.random() * 6, vr: (Math.random() - .5) * .25,
      c: colors[Math.floor(Math.random() * colors.length)]
    }));
    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      pieces.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.vy += p.g; p.rot += p.vr; p.a -= .008;
        ctx.save(); ctx.globalAlpha = Math.max(0, p.a); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
        ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore();
      });
      if (frame++ < 150) requestAnimationFrame(draw); else ctx.clearRect(0, 0, innerWidth, innerHeight);
    };
    draw();
  }

  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxrOJMIX2QZ8IdAkey5Dv7X1xzc4D55GRDMC8L43WvnVFFh-NLEb00V9Fk83Rx9Rq6F/exec';
  const form = $('#rsvpForm');
  const submit = $('#submitRsvp');
  const status = $('#formStatus');
  const message = $('#guestMessage');
  message?.addEventListener('input', () => { const c = $('#messageCount'); if (c) c.textContent = String(message.value.length); });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fd = new FormData(form);
    const name = String(fd.get('name') || '').trim();
    const attendance = String(fd.get('attendance') || '').trim();
    const note = String(fd.get('message') || '').trim();
    const website = String(fd.get('website') || '').trim();
    const nameError = $('#nameError'); const attendanceError = $('#attendanceError');
    if (nameError) nameError.textContent = ''; if (attendanceError) attendanceError.textContent = '';
    if (status) { status.textContent = ''; status.className = 'form-status'; }
    let valid = true;
    if (name.length < 2) { if (nameError) nameError.textContent = 'Bạn vui lòng nhập họ và tên.'; valid = false; }
    if (!attendance) { if (attendanceError) attendanceError.textContent = 'Bạn vui lòng chọn một phương án.'; valid = false; }
    if (!valid || website) return;
    if (submit) { submit.disabled = true; submit.textContent = 'Đang gửi...'; }
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ name, attendance, message: note })
      });
      if (status) { status.textContent = 'Cảm ơn bạn! Mình đã nhận được xác nhận.'; status.className = 'form-status success'; }
      form.reset(); const c = $('#messageCount'); if (c) c.textContent = '0'; launchConfetti();
    } catch (error) {
      console.error(error);
      if (status) { status.textContent = 'Không gửi được xác nhận. Bạn thử lại giúp mình nhé.'; status.className = 'form-status error'; }
    } finally {
      if (submit) { submit.disabled = false; submit.textContent = 'Gửi xác nhận'; }
    }
  });
})();
