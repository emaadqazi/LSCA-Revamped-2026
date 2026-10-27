import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
  DoubleSide,
} from 'three';

// Brand palette (see src/styles/global.css).
const C = {
  deep: new Color('#062a36'),
  ocean: new Color('#08313f'),
  mist: new Color('#e3ebf1'),
  signal: new Color('#0a9cc0'),
  signalBright: new Color('#3cc4e6'),
};

type Hub = { name: string; lat: number; lon: number };

const HUBS: Record<string, Hub> = {
  waterloo: { name: 'Waterloo', lat: 43.46, lon: -80.52 },
  vancouver: { name: 'Vancouver', lat: 49.28, lon: -123.12 },
  la: { name: 'Los Angeles', lat: 33.74, lon: -118.27 },
  chicago: { name: 'Chicago', lat: 41.88, lon: -87.63 },
  newyork: { name: 'New York', lat: 40.71, lon: -74.0 },
  mexico: { name: 'Mexico City', lat: 19.43, lon: -99.13 },
  saopaulo: { name: 'São Paulo', lat: -23.55, lon: -46.63 },
  rotterdam: { name: 'Rotterdam', lat: 51.92, lon: 4.48 },
  lagos: { name: 'Lagos', lat: 6.45, lon: 3.39 },
  dubai: { name: 'Dubai', lat: 25.2, lon: 55.27 },
  mumbai: { name: 'Mumbai', lat: 19.07, lon: 72.88 },
  singapore: { name: 'Singapore', lat: 1.29, lon: 103.85 },
  shenzhen: { name: 'Shenzhen', lat: 22.54, lon: 114.06 },
  shanghai: { name: 'Shanghai', lat: 31.23, lon: 121.47 },
  busan: { name: 'Busan', lat: 35.1, lon: 129.04 },
  sydney: { name: 'Sydney', lat: -33.86, lon: 151.2 },
};

// Waterloo's routes first, so the home connections draw in before the global network.
const ROUTES: [string, string][] = [
  ['waterloo', 'chicago'],
  ['waterloo', 'newyork'],
  ['waterloo', 'vancouver'],
  ['waterloo', 'mexico'],
  ['waterloo', 'rotterdam'],
  ['vancouver', 'shanghai'],
  ['la', 'shenzhen'],
  ['la', 'busan'],
  ['mexico', 'la'],
  ['newyork', 'saopaulo'],
  ['rotterdam', 'newyork'],
  ['saopaulo', 'rotterdam'],
  ['lagos', 'rotterdam'],
  ['dubai', 'rotterdam'],
  ['mumbai', 'dubai'],
  ['singapore', 'dubai'],
  ['shenzhen', 'singapore'],
  ['shanghai', 'singapore'],
  ['singapore', 'sydney'],
];

const R = 1;

function toVec(lat: number, lon: number, r = R) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

/** Great-circle arc lifted off the surface, proportional to distance. */
function arcPoints(a: Vector3, b: Vector3, segments = 72) {
  const angle = a.angleTo(b);
  const lift = 0.05 + 0.2 * (angle / Math.PI);
  const pts: Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // Spherical interpolation between the two unit vectors.
    const s = Math.sin(angle);
    const p = a
      .clone()
      .multiplyScalar(Math.sin((1 - t) * angle) / s)
      .add(b.clone().multiplyScalar(Math.sin(t * angle) / s));
    pts.push(p.normalize().multiplyScalar(R + lift * Math.sin(Math.PI * t)));
  }
  return pts;
}

const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

export function mountGlobe(root: HTMLElement, landDots: number[]) {
  const canvasHost = root.querySelector<HTMLElement>('[data-globe-canvas]')!;
  const label = root.querySelector<HTMLElement>('[data-globe-label]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return; // No WebGL: the static fallback stays in place.
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  canvasHost.appendChild(renderer.domElement);
  root.dataset.globeReady = '';

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 4.1);

  const globe = new Group();
  // Tilt so the northern hemisphere (and Waterloo) faces the viewer.
  globe.rotation.x = 0.62;
  scene.add(globe);

  // Ocean sphere: hides dots and arcs on the far side.
  globe.add(new Mesh(new SphereGeometry(R * 0.985, 64, 64), new MeshBasicMaterial({ color: C.ocean })));

  // Land dots, assembled from a scattered cloud.
  const n = landDots.length / 2;
  const pos = new Float32Array(n * 3);
  const scatter = new Float32Array(n * 3);
  const delay = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const v = toVec(landDots[i * 2] / 10, landDots[i * 2 + 1] / 10, R * 1.002);
    pos.set([v.x, v.y, v.z], i * 3);
    const dir = new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    const s = dir.multiplyScalar(1.8 + Math.random() * 3.2);
    scatter.set([s.x, s.y, s.z], i * 3);
    // Dots nearer the viewer land first, so the globe resolves front-to-back.
    delay[i] = 0.55 * (1 - (v.z + 1) / 2) + Math.random() * 0.35;
  }
  const dotGeo = new BufferGeometry();
  dotGeo.setAttribute('position', new BufferAttribute(pos, 3));
  dotGeo.setAttribute('aScatter', new BufferAttribute(scatter, 3));
  dotGeo.setAttribute('aDelay', new BufferAttribute(delay, 1));
  const dotMat = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uProgress: { value: reduced ? 2 : 0 },
      uSize: { value: 11 },
      uPixelRatio: { value: renderer.getPixelRatio() },
      uColor: { value: C.mist },
      uFlash: { value: C.signalBright },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aScatter;
      attribute float aDelay;
      uniform float uProgress;
      uniform float uSize;
      uniform float uPixelRatio;
      varying float vFacing;
      varying float vArrive;
      varying float vFlash;
      void main() {
        float p = clamp((uProgress - aDelay) / 0.9, 0.0, 1.0);
        float e = 1.0 - pow(1.0 - p, 3.0);
        vec3 pos = mix(aScatter, position, e);
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * uPixelRatio / -mv.z;
        vFacing = normalize(normalMatrix * position).z;
        vArrive = p;
        // Brief flash of signal blue as each dot lands.
        vFlash = p > 0.85 && p < 1.0 ? (p - 0.85) / 0.15 : 0.0;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform vec3 uFlash;
      varying float vFacing;
      varying float vArrive;
      varying float vFlash;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        if (length(c) > 0.5) discard;
        float limb = vArrive < 1.0 ? 1.0 : smoothstep(-0.05, 0.45, vFacing);
        float alpha = mix(0.25, 0.9, vArrive) * limb;
        gl_FragColor = vec4(mix(uColor, uFlash, vFlash), alpha);
      }
    `,
  });
  globe.add(new Points(dotGeo, dotMat));

  // Hubs.
  const hubMat = new MeshBasicMaterial({ color: C.signalBright, transparent: true, opacity: 0 });
  const hubGeo = new SphereGeometry(0.014, 12, 12);
  const hubVecs: Record<string, Vector3> = {};
  for (const [key, h] of Object.entries(HUBS)) {
    hubVecs[key] = toVec(h.lat, h.lon);
    const m = new Mesh(key === 'waterloo' ? new SphereGeometry(0.022, 16, 16) : hubGeo, key === 'waterloo' ? new MeshBasicMaterial({ color: C.mist, transparent: true, opacity: 0 }) : hubMat);
    m.position.copy(hubVecs[key]).multiplyScalar(1.004);
    globe.add(m);
    if (key === 'waterloo') m.userData.home = true;
  }
  const home = globe.children.find((c) => c.userData.home) as Mesh;

  // Waterloo pulse ring.
  const ringMat = new MeshBasicMaterial({ color: C.signalBright, transparent: true, opacity: 0, side: DoubleSide, depthWrite: false });
  const ring = new Mesh(new RingGeometry(0.03, 0.038, 48), ringMat);
  ring.position.copy(hubVecs.waterloo).multiplyScalar(1.006);
  ring.lookAt(hubVecs.waterloo.clone().multiplyScalar(2));
  globe.add(ring);

  // Routes and the packages moving along them.
  const arcMat = (o: number) => new LineBasicMaterial({ color: C.signal, transparent: true, opacity: o, depthWrite: false });
  const routes = ROUTES.map(([a, b], i) => {
    const pts = arcPoints(hubVecs[a], hubVecs[b]);
    const geo = new BufferGeometry().setFromPoints(pts);
    geo.setDrawRange(0, reduced ? pts.length : 0);
    const line = new Line(geo, arcMat(a === 'waterloo' ? 0.9 : 0.55));
    globe.add(line);
    return { a, b, pts, geo, start: 1.5 + i * 0.07, speed: 0.12 + Math.random() * 0.1, offset: Math.random(), dir: i % 2 ? 1 : -1, prev: [0, 0] };
  });
  const packetPos = new Float32Array(routes.length * 2 * 3);
  const packetGeo = new BufferGeometry();
  packetGeo.setAttribute('position', new BufferAttribute(packetPos, 3));
  const packetMat = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { uOpacity: { value: reduced ? 1 : 0 }, uPixelRatio: { value: renderer.getPixelRatio() }, uColor: { value: C.mist } },
    vertexShader: /* glsl */ `
      uniform float uPixelRatio;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = 26.0 * uPixelRatio / -mv.z;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      uniform vec3 uColor;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float core = smoothstep(0.22, 0.0, d);
        float glow = smoothstep(0.5, 0.0, d) * 0.35;
        gl_FragColor = vec4(uColor, (core + glow) * uOpacity);
      }
    `,
  });
  globe.add(new Points(packetGeo, packetMat));

  const samplePath = (pts: Vector3[], t: number, out: Vector3) => {
    const f = Math.min(1, Math.max(0, t)) * (pts.length - 1);
    const i = Math.floor(f);
    return out.copy(pts[i]).lerp(pts[Math.min(i + 1, pts.length - 1)], f - i);
  };

  // Sizing.
  const resize = () => {
    const { width, height } = canvasHost.getBoundingClientRect();
    if (!width || !height) return;
    // Let three.js set the canvas's CSS size too, otherwise on 2x and 3x screens the canvas
    // displays at its device-pixel size and spills out of its container.
    renderer.setSize(width, height);
    camera.aspect = width / height;
    // Keep the whole globe in frame on tall, narrow containers.
    camera.position.z = camera.aspect < 1 ? 4.1 / camera.aspect : 4.1;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvasHost);
  resize();

  // Drag to spin (horizontal only, so vertical swipes still scroll the page on phones).
  const baseY = -0.2;
  let spinY = reduced ? baseY : baseY - 2.4;
  let velocity = 0;
  let dragging = false;
  let lastX = 0;
  const el = renderer.domElement;
  el.style.touchAction = 'pan-y';
  el.style.cursor = 'grab';
  el.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    el.setPointerCapture(e.pointerId);
    el.style.cursor = 'grabbing';
  });
  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    spinY += dx * 0.006;
    velocity = dx * 0.006;
  });
  const release = () => {
    dragging = false;
    el.style.cursor = 'grab';
  };
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);

  // Only animate while visible.
  let visible = true;
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) loop();
  }).observe(root);
  document.addEventListener('visibilitychange', () => !document.hidden && loop());

  const start = performance.now();
  let last = start;
  let running = false;
  const tmp = new Vector3();
  const homeWorld = new Vector3();

  function frame(now: number) {
    // The first rAF timestamp can precede `start` by a few ms; a negative t would put a package
    // off the end of its route and throw, which stops the loop for good.
    const t = reduced ? 10 : Math.max(0, (now - start) / 1000);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // Intro: dots assemble, globe spins into place, routes draw, packages depart.
    dotMat.uniforms.uProgress.value = reduced ? 2 : t * 0.85;
    if (!dragging) {
      if (Math.abs(velocity) > 0.0001) {
        spinY += velocity;
        velocity *= 0.94;
      } else if (!reduced) {
        // Ease back toward the spin target, then drift slowly.
        const target = baseY + (t > 2.2 ? Math.sin((t - 2.2) * 0.12) * 0.55 : 0);
        spinY += (target - spinY) * (t < 2.4 ? 0.045 : 0.01);
      }
    }
    globe.rotation.y = spinY;

    const hubOpacity = easeOut((t - 1.3) / 0.6);
    hubMat.opacity = hubOpacity;
    (home.material as MeshBasicMaterial).opacity = hubOpacity;

    routes.forEach((r, i) => {
      const p = easeOut((t - r.start) / 0.9);
      r.geo.setDrawRange(0, Math.ceil(p * r.pts.length));
      for (let k = 0; k < 2; k++) {
        const raw = (r.offset + k * 0.5 + t * r.speed) % 1;
        // The counter wrapping means a package just reached the end of its route.
        if (raw < r.prev[k] && t > 3.5 && !reduced) {
          const [from, to] = r.dir > 0 ? [r.a, r.b] : [r.b, r.a];
          root.dispatchEvent(new CustomEvent('lsca:arrival', { detail: { from: HUBS[from].name, to: HUBS[to].name } }));
        }
        r.prev[k] = raw;
        const u = r.dir < 0 ? 1 - raw : raw;
        samplePath(r.pts, u, tmp);
        packetPos.set([tmp.x, tmp.y, tmp.z], (i * 2 + k) * 3);
      }
    });
    packetGeo.attributes.position.needsUpdate = true;
    packetMat.uniforms.uOpacity.value = easeOut((t - 2.6) / 0.8);

    const pulse = reduced ? 0.5 : ((t * 0.7) % 1);
    ring.scale.setScalar(1 + pulse * 2.4);
    ringMat.opacity = hubOpacity * (1 - pulse) * 0.9;

    renderer.render(scene, camera);

    // Pin the HTML label to Waterloo, hidden when it rotates out of view.
    if (label) {
      home.getWorldPosition(homeWorld);
      const facing = homeWorld.clone().normalize().dot(camera.position.clone().normalize()) > 0.25;
      homeWorld.project(camera);
      const { width, height } = canvasHost.getBoundingClientRect();
      label.style.transform = `translate(${((homeWorld.x + 1) / 2) * width}px, ${((1 - homeWorld.y) / 2) * height}px)`;
      label.style.opacity = String(facing ? hubOpacity : 0);
    }
  }

  function loop() {
    if (running) return;
    running = true;
    last = performance.now();
    const tick = (now: number) => {
      frame(now);
      // With reduced motion, only redraw while the person is dragging the globe.
      if (visible && !document.hidden && (!reduced || dragging || Math.abs(velocity) > 0.0001)) requestAnimationFrame(tick);
      else running = false;
    };
    requestAnimationFrame(tick);
  }
  if (reduced) el.addEventListener('pointerdown', loop);
  loop();
}
