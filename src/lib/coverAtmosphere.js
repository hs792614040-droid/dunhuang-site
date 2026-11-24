// The cover uses a single canvas and one animation loop for its light and depth.
export function createCoverAtmosphere(canvas, root, isPaused) {
  const context = canvas.getContext('2d', { alpha: true })
  if (!context) return () => {}
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  const fine = window.matchMedia('(pointer: fine)')
  let width = 1, height = 1, frame, last = 0, time = 0
  let x = 0, y = 0, targetX = 0, targetY = 0
  let visible = true, wasPaused = false
  const particles = Array.from({ length: fine.matches ? 100 : 46 }, () => ({
    phase: Math.random() * Math.PI * 2, radius: .2 + Math.random() * .8,
    speed: .035 + Math.random() * .065, size: .5 + Math.random() * 1.5,
    depth: .4 + Math.random() * .6
  }))
  const bursts = []
  function resize() {
    const rect = root.getBoundingClientRect()
    width = rect.width; height = rect.height
    const ratio = Math.min(window.devicePixelRatio || 1, 1.75)
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio)
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    draw()
  }
  function point(event) {
    if (!fine.matches || reduced.matches || isPaused()) return
    const rect = root.getBoundingClientRect()
    targetX = (event.clientX - rect.left) / width - .5
    targetY = (event.clientY - rect.top) / height - .5
  }
  function leave() { targetX = 0; targetY = 0 }
  function burst(event) {
    if (reduced.matches || isPaused() || event.target.closest('a,button,dialog,nav')) return
    const rect = root.getBoundingClientRect()
    if (bursts.length > 60) bursts.splice(0, 24)
    for (let i = 0; i < 24; i++) {
      const angle = Math.PI * 2 * i / 24
      bursts.push({ x: event.clientX - rect.left, y: event.clientY - rect.top,
        vx: Math.cos(angle) * (22 + Math.random() * 55), vy: Math.sin(angle) * (22 + Math.random() * 55), life: 1 })
    }
  }
  function draw(delta = 0) {
    context.clearRect(0, 0, width, height)
    context.globalCompositeOperation = 'lighter'
    const centerX = width * (width > 720 ? .72 : .55)
    const centerY = height * (width > 720 ? .48 : .32)
    const radius = Math.min(width * .37, height * .57)
    for (const particle of particles) {
      const angle = particle.phase + time * particle.speed
      const px = centerX + Math.cos(angle) * radius * particle.radius + x * 42 * particle.depth
      const py = centerY + Math.sin(angle * 1.2) * radius * .65 * particle.radius + y * 24 * particle.depth
      const alpha = .2 + .55 * (.5 + .5 * Math.sin(time * .65 + particle.phase))
      context.fillStyle = `rgba(255,211,143,${alpha})`
      context.beginPath(); context.arc(px, py, particle.size, 0, Math.PI * 2); context.fill()
      if (particle.size > 1.6) {
        context.strokeStyle = `rgba(255,210,142,${alpha * .25})`
        context.beginPath(); context.moveTo(px - 5, py); context.lineTo(px + 5, py)
        context.moveTo(px, py - 5); context.lineTo(px, py + 5); context.stroke()
      }
    }
    for (let i = bursts.length - 1; i >= 0; i--) {
      const p = bursts[i]; p.life -= delta * .6; p.x += p.vx * delta; p.y += p.vy * delta
      if (p.life <= 0) { bursts.splice(i, 1); continue }
      context.fillStyle = `rgba(255,221,166,${p.life})`
      context.beginPath(); context.arc(p.x, p.y, p.life * 2, 0, Math.PI * 2); context.fill()
    }
    context.globalCompositeOperation = 'source-over'
  }
  function tick(now) {
    frame = undefined
    const delta = Math.min((now - (last || now)) / 1000, .045); last = now
    const paused = isPaused() || reduced.matches
    if (!paused) {
      time += delta
      const ease = 1 - Math.exp(-delta * 4)
      x += (targetX - x) * ease; y += (targetY - y) * ease
      root.style.setProperty('--depth-x', `${x * 26}px`)
      root.style.setProperty('--depth-y', `${y * 18}px`)
      root.style.setProperty('--light-x', `${50 + x * 55}%`)
      root.style.setProperty('--light-y', `${50 + y * 55}%`)
      draw(delta)
    } else if (!wasPaused) {
      root.style.setProperty('--depth-x', '0px'); root.style.setProperty('--depth-y', '0px')
      draw()
    }
    wasPaused = paused
    // Reduced motion needs no continuous redraw. The media listener resumes it.
    if (visible && !reduced.matches) frame = requestAnimationFrame(tick)
  }
  function resume() {
    if (frame) cancelAnimationFrame(frame)
    last = 0
    if (!document.hidden && visible) frame = requestAnimationFrame(tick)
  }
  const observer = new ResizeObserver(resize)
  observer.observe(root)
  const intersection = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; resume() })
  intersection.observe(root)
  root.addEventListener('pointermove', point, { passive: true })
  root.addEventListener('pointerleave', leave)
  root.addEventListener('click', burst)
  document.addEventListener('visibilitychange', resume)
  reduced.addEventListener('change', resume)
  resize(); resume()
  return () => {
    cancelAnimationFrame(frame); observer.disconnect(); intersection.disconnect()
    root.removeEventListener('pointermove', point); root.removeEventListener('pointerleave', leave)
    root.removeEventListener('click', burst); document.removeEventListener('visibilitychange', resume)
    reduced.removeEventListener('change', resume)
  }
}
