import * as THREE from 'https://unpkg.com/three@0.180.0/build/three.module.js';

const canvas = document.querySelector('#three-sky');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (canvas && !reduce) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 7;

  const count = 190;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const base = [];
  const lime = new THREE.Color('#caff58');
  const blue = new THREE.Color('#70d5ff');
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - .5) * 14;
    const y = (Math.random() - .5) * 9;
    const z = (Math.random() - .5) * 3;
    positions.set([x, y, z], i * 3);
    const color = Math.random() > .78 ? lime : blue;
    colors.set([color.r, color.g, color.b], i * 3);
    base.push({ x, y, z, phase: Math.random() * Math.PI * 2, speed: .18 + Math.random() * .35 });
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({ size: .032, sizeAttenuation: true, transparent: true, opacity: .72, vertexColors: true, depthWrite: false });
  const stars = new THREE.Points(geometry, material);
  scene.add(stars);

  const lineGeo = new THREE.BufferGeometry();
  const linePositions = new Float32Array([
    -3.4, .7, -.7, -2.2, 1.25, -.3,
    -2.2, 1.25, -.3, -1.02, .43, -.45,
    -1.02, .43, -.45, .1, 1.18, -.6,
    .1, 1.18, -.6, 1.24, .1, -.2,
  ]);
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  const constellation = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: '#9fe0ff', transparent: true, opacity: .18 }));
  scene.add(constellation);

  let mouseX = 0, mouseY = 0;
  window.addEventListener('pointermove', (event) => {
    mouseX = (event.clientX / window.innerWidth - .5) * .38;
    mouseY = (event.clientY / window.innerHeight - .5) * .24;
  }, { passive: true });

  function resize() {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const clock = new THREE.Clock();
  function render() {
    const t = clock.getElapsedTime();
    const attr = geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      const b = base[i];
      attr.setXYZ(i, b.x + Math.sin(t * b.speed + b.phase) * .035, b.y + Math.cos(t * b.speed + b.phase) * .035, b.z);
    }
    attr.needsUpdate = true;
    stars.rotation.y += .00032;
    stars.rotation.x += (mouseY - stars.rotation.x) * .012;
    stars.rotation.y += (mouseX - stars.rotation.y) * .009;
    constellation.rotation.y = stars.rotation.y * .72;
    constellation.rotation.x = stars.rotation.x * .72;
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  render();
}
