// Cena 3D de fundo: blob iridescente com ruído, formas de vidro orbitando e campo de partículas.
// Um único canvas fixo; a posição/escala do blob acompanha o scroll da página.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const NOISE = /* glsl */`
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const blobVertex = /* glsl */`
uniform float uTime; uniform float uAmp; uniform float uFreq;
varying vec3 vNormal; varying vec3 vView; varying float vNoise;
${NOISE}
float disp(vec3 p){ return snoise(p*uFreq + uTime*.35) * uAmp + snoise(p*uFreq*2.3 - uTime*.2) * uAmp*.35; }
void main(){
  vec3 p = position;
  float n = disp(p);
  vec3 displaced = p + normal * n;
  // normal recalculada por diferenças finitas
  vec3 up = abs(normal.y) > .95 ? vec3(1.,0.,0.) : vec3(0.,1.,0.);
  vec3 t = normalize(cross(normal, up));
  vec3 bt = normalize(cross(normal, t));
  float e = .01;
  vec3 a = p + t*e;  a += normal * disp(a);
  vec3 b = p + bt*e; b += normal * disp(b);
  vec3 cr = cross(a - displaced, b - displaced);
  vec3 nrm = length(cr) > 1e-8 ? normalize(cr) : normal;
  vNormal = normalize(normalMatrix * nrm);
  vec4 mv = modelViewMatrix * vec4(displaced, 1.);
  vView = normalize(-mv.xyz);
  vNoise = n;
  gl_Position = projectionMatrix * mv;
}`;

const blobFragment = /* glsl */`
uniform float uTime; uniform float uHue;
varying vec3 vNormal; varying vec3 vView; varying float vNoise;
vec3 palette(float t){
  vec3 a=vec3(.5,.5,.6), b=vec3(.5,.45,.5), c=vec3(1.,1.,1.), d=vec3(.62+uHue,.33+uHue,.12+uHue);
  return a + b*cos(6.28318*(c*t+d));
}
void main(){
  float fres = pow(1. - max(dot(vNormal, vView), 0.), 2.2);
  vec3 col = palette(vNoise*1.4 + dot(vNormal, vec3(.3,.6,.2)) * .55 + uTime*.04);
  col = mix(col*.35, col, .35 + fres*.9);
  col += fres * vec3(.55,.5,1.) * .9;
  // limita a saída: NaN/valores negativos viram blocos pretos no bloom
  col = clamp(col, 0., 4.);
  if (col.r != col.r || col.g != col.g || col.b != col.b) col = vec3(.5, .45, 1.);
  gl_FragColor = vec4(col, 1.);
}`;

export function initScene(canvas, { isMobile, reducedMotion }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: false, powerPreference: 'high-performance' });
  } catch (e) {
    return null;
  }
  // Fundo opaco: evita artefatos de composição entre o canvas e as camadas de texto acima
  renderer.setClearColor(0x07070c, 1);
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 1.75));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, .1, 100);
  camera.position.set(0, 0, 8);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;

  // Grupo principal que se move com o scroll
  const rig = new THREE.Group();
  scene.add(rig);

  // Blob
  const blobUniforms = { uTime: { value: 0 }, uAmp: { value: .32 }, uFreq: { value: .85 }, uHue: { value: 0 } };
  const blob = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.55, isMobile ? 64 : 128),
    new THREE.ShaderMaterial({ uniforms: blobUniforms, vertexShader: blobVertex, fragmentShader: blobFragment })
  );
  rig.add(blob);

  // Casca wireframe
  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.35, 2),
    new THREE.MeshBasicMaterial({ color: 0x8b7fff, wireframe: true, transparent: true, opacity: .12 })
  );
  rig.add(shell);

  // Anel
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.9, .012, 8, 220),
    new THREE.MeshBasicMaterial({ color: 0x3dd6e6, transparent: true, opacity: .55 })
  );
  ring.rotation.x = 1.25;
  rig.add(ring);

  // Formas de vidro orbitando
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: .06, transmission: 1, thickness: 1.2, ior: 1.45,
    iridescence: 1, iridescenceIOR: 1.3, clearcoat: 1, envMapIntensity: 1.4
  });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: .12 });
  const shapes = [
    { geo: new THREE.TorusKnotGeometry(.32, .11, 160, 24), mat: glass, r: 3.1, s: .55, y: .9, ph: 0 },
    { geo: new THREE.OctahedronGeometry(.42), mat: glass, r: 3.4, s: .38, y: -1.1, ph: 2.1 },
    { geo: new THREE.TorusGeometry(.32, .12, 32, 80), mat: chrome, r: 2.8, s: .47, y: -.3, ph: 4.2 },
    { geo: new THREE.IcosahedronGeometry(.26, 0), mat: chrome, r: 3.7, s: .3, y: 1.6, ph: 5.3 },
    { geo: new THREE.SphereGeometry(.2, 48, 48), mat: glass, r: 2.6, s: .62, y: 1.3, ph: 1.2 },
  ].map(o => { const m = new THREE.Mesh(o.geo, o.mat); rig.add(m); return { ...o, mesh: m }; });

  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.PointLight(0x8b7fff, 30, 20); rim.position.set(-4, -2, 3); scene.add(rim);

  // Partículas
  const count = isMobile ? 900 : 2600;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const c1 = new THREE.Color(0x8b7fff), c2 = new THREE.Color(0x3dd6e6), tmp = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const r = 6 + Math.random() * 22;
    const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * .6;
    pos[i * 3 + 2] = r * Math.cos(ph) - 8;
    tmp.copy(c1).lerp(c2, Math.random());
    col.set([tmp.r, tmp.g, tmp.b], i * 3);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const sprite = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.3, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  const points = new THREE.Points(pGeo, new THREE.PointsMaterial({
    size: .09, map: sprite, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  scene.add(points);

  // Halo de brilho atrás do blob (mais barato e estável que bloom)
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: sprite, color: 0x7a6cff, transparent: true, opacity: .35, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  halo.scale.setScalar(9);
  halo.position.z = -1.5;
  rig.add(halo);
  const halo2 = halo.clone();
  halo2.material = halo.material.clone();
  halo2.material.color.set(0x2fc9da);
  halo2.material.opacity = .18;
  halo2.scale.setScalar(13);
  halo2.position.set(1, -.6, -2.5);
  rig.add(halo2);


  // Estado controlado de fora (scroll) + mouse
  const state = { x: 0, y: 0, z: 0, scale: 1, hue: 0, amp: .32, spin: 0 };
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', e => {
    mouse.tx = (e.clientX / innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });

  const onResize = () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  };
  addEventListener('resize', onResize);

  const clock = new THREE.Clock();
  let running = true;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) clock.getDelta(); });

  function frame() {
    requestAnimationFrame(frame);
    if (!running) return;
    const dt = Math.min(clock.getDelta(), .05);
    const t = clock.elapsedTime * (reducedMotion ? .15 : 1);

    mouse.x += (mouse.tx - mouse.x) * .05;
    mouse.y += (mouse.ty - mouse.y) * .05;

    blobUniforms.uTime.value = t;
    blobUniforms.uHue.value += (state.hue - blobUniforms.uHue.value) * .05;
    blobUniforms.uAmp.value += (state.amp + Math.hypot(mouse.x, mouse.y) * .08 - blobUniforms.uAmp.value) * .05;

    rig.position.x += (state.x - rig.position.x) * .06;
    rig.position.y += (state.y - rig.position.y) * .06;
    rig.position.z += (state.z - rig.position.z) * .06;
    const s = rig.scale.x + (state.scale - rig.scale.x) * .06;
    rig.scale.setScalar(s);
    rig.rotation.y = t * .08 + mouse.x * .35 + state.spin;
    rig.rotation.x = mouse.y * .2;

    blob.rotation.y = t * .1;
    shell.rotation.set(t * .05, -t * .07, 0);
    ring.rotation.z = t * .15;
    halo.material.opacity = .3 + Math.sin(t * 1.3) * .07;

    for (const o of shapes) {
      const a = t * o.s + o.ph;
      o.mesh.position.set(Math.cos(a) * o.r, o.y + Math.sin(t * .8 + o.ph) * .25, Math.sin(a) * o.r * .6);
      o.mesh.rotation.x += dt * .6; o.mesh.rotation.y += dt * .4;
    }

    points.rotation.y = t * .012 + state.spin * .3;
    points.rotation.x = mouse.y * .05;

    camera.position.x += (mouse.x * .4 - camera.position.x) * .04;
    camera.position.y += (-mouse.y * .3 - camera.position.y) * .04;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  frame();

  return { state };
}
