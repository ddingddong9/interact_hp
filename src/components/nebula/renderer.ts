import { HORIZONTAL_ARC, VERTICAL_ARC, PANORAMA_PERIOD, PANORAMA_OVERLAP } from './view';
import type { CollapseScene } from './collapse';

const vertexSource = `
attribute vec2 position;
varying vec2 uv;
void main() {
  uv = position * .5 + .5;
  gl_Position = vec4(position, 0., 1.);
}`;

const fragmentSource = `
precision highp float;
varying vec2 uv;
uniform sampler2D photograph;
uniform vec2 resolution;
uniform vec2 orientation;
uniform float halfFov;
uniform vec4 collapse;
uniform float effectActive;
uniform float rebuilding;
uniform float pointRadius;

vec2 rotatePoint(vec2 p, float angle) {
  float c = cos(angle), s = sin(angle);
  return mat2(c, s, -s, c) * p;
}
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x),
    mix(hash(i + vec2(0., 1.)), hash(i + vec2(1.)), f.x), f.y);
}
vec3 panorama(vec2 coord) {
  // A photographic environment wrapped around the viewer, including outside
  // the viewport. Longitude is periodic for both navigation and the black hole.
  vec2 screen = coord * 2. - 1.;
  screen.x *= resolution.x / resolution.y;
  vec3 ray = normalize(vec3(screen * tan(halfFov), 1.));
  float cp = cos(orientation.y), sp = sin(orientation.y);
  ray.yz = mat2(cp, -sp, sp, cp) * ray.yz;
  float cy = cos(orientation.x), sy = sin(orientation.x);
  ray.xz = mat2(cy, -sy, sy, cy) * ray.xz;
  float longitude = atan(ray.x, ray.z);
  float u = fract(.5 + longitude / ${HORIZONTAL_ARC.toFixed(10)}) * ${PANORAMA_PERIOD.toFixed(2)};
  float v = clamp(.5 + asin(clamp(ray.y, -1., 1.)) / ${VERTICAL_ARC.toFixed(10)}, .001, .999);
  vec3 color = texture2D(photograph, vec2(u, v)).rgb;
  if (u < ${PANORAMA_OVERLAP.toFixed(2)}) {
    vec3 wrapped = texture2D(photograph, vec2(u + ${PANORAMA_PERIOD.toFixed(2)}, v)).rgb;
    color = mix(wrapped, color, smoothstep(0., ${PANORAMA_OVERLAP.toFixed(2)}, u));
  }
  return color;
}
float vignette() {
  return 1. - smoothstep(.35, 1.5, length(uv * 2. - 1.)) * .09;
}

// Sparse dust in advected polar coordinates. Angular cells wrap exactly at 2π;
// elongated kernels follow the same inward spiral as the photographic material.
float dust(vec2 flow, float density, float pixelFootprint) {
  vec2 grid = vec2(flow.x * density, flow.y * 28.);
  vec2 cell = floor(grid), f = fract(grid);
  float seed = hash(cell + 17.);
  vec2 center = vec2(.2 + .6 * hash(cell + 4.), .25 + .5 * hash(cell + 9.));
  vec2 d = f - center;
  float footprint = pixelFootprint * density;
  float width = clamp(footprint, .035, .24);
  float spark = exp(-pow(d.x / width, 2.) - pow(d.y / .22, 2.));
  return spark * smoothstep(.80, .99, seed) * (1. - smoothstep(.5, 1.5, footprint));
}
// Rebirth has its own outward field: a charged point, a brief luminous front,
// then photographic clouds settling behind it. It is not reverse accretion.
vec3 rebirth(vec2 q, float r, float t, vec2 aspect, vec3 point) {
  vec3 base = panorama(uv) * vignette();
  if (t >= .9999) return base;
  vec3 darkness = vec3(.001, .002, .004);
  if (t <= .0001) return darkness + point;
  float extent = length(max(collapse.xy, 1. - collapse.xy) * aspect);
  float launch = smoothstep(.025, .90, t);
  float radius = extent * 1.48 * pow(launch, .65);
  float width = max(.018, radius * .13);
  vec2 direction = q / max(r, .000001);
  float angle = atan(q.y, q.x);
  // An uneven front avoids a hard circular reveal or a uniform neon shock ring.
  float structure = noise(direction * 4.7 + vec2(r * 1.8));
  float front = radius * (.93 + structure * .12);
  float band = exp(-pow((r - front) / width, 2.));
  float energy = smoothstep(.025, .10, t) * (1. - smoothstep(.24, .80, t));
  float reveal = (1. - smoothstep(front - width * 1.8, front + width * .5, r))
    * smoothstep(.028, .14, t);
  // The passing front briefly refracts the environment; the settled interior
  // converges to the exact idle photograph without a camera jump.
  float pressure = energy * band;
  vec2 source = rotatePoint(q, -.055 * pressure) * (1. - .095 * pressure);
  vec3 cloud = panorama(collapse.xy + source / aspect);
  float brightness = dot(cloud, vec3(.2126, .7152, .0722));
  vec3 color = mix(darkness, cloud * vignette(), reveal);

  float envelope = smoothstep(.02, .10, t) * (1. - smoothstep(.32, .82, t));
  float radial = r / max(.012, radius);
  float filaments = noise(direction * 46. + vec2(radial * .8));
  filaments = pow(filaments, 5.);
  float rays = exp(-pow((radial - .68) / .29, 2.)) * filaments;
  vec3 tint = mix(vec3(.38, .65, .95), vec3(1., .79, .50), structure);
  color += tint * rays * envelope * .75;
  color += mix(tint, cloud, .55) * band * energy * (.10 + brightness * .32);

  // Sparse outward-moving flecks, concentrated in the wake of the front.
  vec2 flow = vec2(fract(angle / 6.2831853 + .5), radial - t * .6);
  float specks = dust(flow, 224., 1. / resolution.y / max(.02, r) / 6.2831853);
  float wake = exp(-pow((radial - .77) / .19, 2.));
  color += tint * specks * wake * envelope * (.12 + brightness * .48);

  // Keep the initial ignition local, rather than flashing the entire viewport.
  float charge = smoothstep(0., .04, t) * (1. - smoothstep(.055, .21, t));
  float nucleusRadius = pointRadius + .013 * charge;
  float nucleus = exp(-pow(r / max(pointRadius, nucleusRadius), 2.));
  float glow = exp(-r / (.009 + .033 * charge)) * charge * .28;
  color += vec3(.93, .96, 1.) * nucleus * charge * .85 + tint * glow;
  color += point * (1. - smoothstep(.035, .10, t));
  return mix(color, base, smoothstep(.88, 1., t));
}
void main() {
  if (effectActive < .5) { gl_FragColor = vec4(panorama(uv) * vignette(), 1.); return; }
  float p = collapse.z;
  vec2 aspect = vec2(resolution.x / resolution.y, 1.);
  vec2 q = (uv - collapse.xy) * aspect;
  float r = length(q);
  float px = 1. / resolution.y;
  vec3 darkness = vec3(.001, .002, .004);
  float star = 1. - smoothstep(pointRadius * .45, pointRadius, r);
  vec3 point = vec3(.89, .94, 1.) * star
    + vec3(.46, .63, .8) * exp(-r / (pointRadius * 2.1)) * .07;
  if (p >= .9999) { gl_FragColor = vec4(darkness + point, 1.); return; }
  if (collapse.w > .5) {
    vec3 color = panorama(uv) * vignette() * (1. - smoothstep(0., .87, p));
    gl_FragColor = vec4(mix(color, darkness + point, smoothstep(.75, 1., p)), 1.);
    return;
  }

  if (rebuilding > .5) {
    gl_FragColor = vec4(rebirth(q, r, 1. - p, aspect, point), 1.);
    return;
  }

  float birth = smoothstep(0., .19, p);
  float feed = smoothstep(.12, .84, p);
  float close = smoothstep(.81, .982, p);
  float horizon = (.043 + .016 * feed) * birth * (1. - close);
  float safeHorizon = max(.0001, horizon);
  float angle = atan(q.y, q.x);
  vec2 direction = q / max(r, .000001);
  float extent = length(max(collapse.xy, 1. - collapse.xy) * aspect);
  float reach = mix(.22, extent * 1.45, smoothstep(.16, .76, p));
  float influence = exp(-pow(r / reach, 3.));

  // Inverse radial advection. The inner field accelerates while the outer
  // photograph stays intact; no viewport rectangle is scaled, masked or rotated.
  float drain = pow(feed, 2.7) * .38 * influence;
  float sourceR = pow(max(.000000001, r*r*r + drain), 1. / 3.);
  float nearCore = exp(-r / (.09 + feed * .18));
  float twist = 2.7 * pow(feed, 1.5) * nearCore;
  float lens = .004 * birth * exp(-r / .22) / max(.035, r - horizon * .65);
  vec2 source = rotatePoint(direction, twist) * (sourceR + lens);
  vec3 material = panorama(collapse.xy + source / aspect);
  float luminance = dot(material, vec3(.2126, .7152, .0722));

  // A short exposure of the curved trajectory, only in the tidal region.
  float tidal = feed * exp(-pow((r - horizon * 1.9) / .19, 2.));
  float trail = tidal * .018;
  material = material * .60
    + panorama(collapse.xy + rotatePoint(source, -trail) * (1. + trail) / aspect) * .27
    + panorama(collapse.xy + rotatePoint(source, -trail * 2.5) * (1. + trail * 2.) / aspect) * .13;

  // The reservoir empties from the distance toward the core. Its soft, irregular
  // density contour is radial in the scene and independent of viewport edges.
  float emptying = smoothstep(.35, .91, p);
  float reservoir = mix(extent * 2.8, .012, emptying);
  vec2 flowDirection = rotatePoint(direction, twist);
  float cloud = noise(flowDirection * 3.1 + sourceR * 2.4);
  float density = exp(-pow(r / max(.008, reservoir * (.84 + cloud * .32)), 2.5) * emptying * 2.4);
  float remaining = 1. - smoothstep(.79, .95, p);
  material *= density * remaining;

  // Bright photographic filaments break into dust only just outside the horizon.
  float annulus = smoothstep(horizon * 1.12, horizon * 1.9 + .008, r)
    * exp(-pow(r / .24, 3.));
  float phase = (angle + twist) / 6.2831853 + .5;
  vec2 flow = vec2(fract(phase), sourceR - feed * .78);
  float grit = dust(flow, 192., px / max(.02, r) / 6.2831853);
  grit += dust(flow + vec2(.125, .173), 320., px / max(.02, r) / 6.2831853) * .40;
  float dissolution = tidal * annulus * smoothstep(.25, .68, p);
  material *= 1. - dissolution * .25;
  vec3 heated = mix(material, vec3(.94, .71, .43), .32);
  vec3 particles = heated * grit * dissolution * smoothstep(.12, .58, luminance) * density * remaining * 1.4;

  // An inclined accretion flow, with fine nonuniform filaments and a bent far arc.
  // Keep it low contrast against the photograph; avoid an opaque neon ellipse.
  vec2 diskQ = rotatePoint(q, -.22);
  float diskR = length(vec2(diskQ.x, diskQ.y * 3.25));
  float diskAngle = atan(diskQ.y * 3.25, diskQ.x);
  float diskRatio = diskR / safeHorizon;
  float diskEnvelope = smoothstep(1.25, 1.8, diskRatio) * exp(-max(0., diskRatio - 1.9) * 1.55);
  float threads = noise(vec2(diskRatio * 31., sin(diskAngle) * 2. + cos(diskAngle) * 3. + p * 12.));
  threads = .25 + .75 * threads * threads;
  float hotSide = .32 + .68 * smoothstep(-.8, .9, -direction.x);
  vec3 tint = mix(vec3(.43, .62, .78), vec3(1., .77, .48), .5 + .5 * direction.x);
  float fuel = birth * (1. - smoothstep(.76, .985, p));
  float bentArc = exp(-pow((r / safeHorizon - 1.43) / .13, 2.))
    * smoothstep(-.05, .8, direction.y) * (.4 + .6 * noise(flowDirection * 6. + feed));
  vec3 emission = tint * (diskEnvelope * threads * .55 + bentArc * .19) * hotSide * fuel;

  float edgeWidth = max(px, horizon * .012);
  float outside = smoothstep(horizon - edgeWidth, horizon + edgeWidth, r);
  vec3 color = (material + particles + emission) * mix(1., outside, birth);
  float rim = exp(-pow((r - horizon * 1.055) / max(px * .8, horizon * .021), 2.));
  float corona = exp(-abs(r - horizon * 1.12) / max(px, horizon * .10));
  color += tint * (rim * .58 + corona * .09) * hotSide * fuel;
  color = color * vignette() + darkness * (1. - density * remaining);
  color = mix(color, darkness + point, smoothstep(.959, 1., p));
  gl_FragColor = vec4(color, 1.);
}`;

export function createNebulaRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
  if (!gl) return null;
  const shaders: WebGLShader[] = [];
  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  const texture = gl.createTexture();
  if (!program || !buffer || !texture) return null;
  function dispose() {
    shaders.forEach(shader => gl!.deleteShader(shader));
    gl!.deleteTexture(texture);
    gl!.deleteBuffer(buffer);
    gl!.deleteProgram(program);
  }
  try {
    for (const [type, source] of [[gl.VERTEX_SHADER, vertexSource], [gl.FRAGMENT_SHADER, fragmentSource]] as const) {
      const shader = gl.createShader(type);
      if (!shader) throw new Error('Could not create panorama shader');
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'Panorama shader failed');
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Panorama shader link failed');
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.uniform1i(gl.getUniformLocation(program, 'photograph'), 0);
    const collapse = gl.getUniformLocation(program, 'collapse');
    const effectActive = gl.getUniformLocation(program, 'effectActive');
    const rebuilding = gl.getUniformLocation(program, 'rebuilding');
    const pointRadius = gl.getUniformLocation(program, 'pointRadius');
    const resolution = gl.getUniformLocation(program, 'resolution');
    const orientation = gl.getUniformLocation(program, 'orientation');
    const halfFov = gl.getUniformLocation(program, 'halfFov');
    const maximumTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    return {
      maximumTextureSize,
      upload(image: HTMLImageElement) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        if (gl.getError() !== gl.NO_ERROR) throw new Error('Panorama texture could not be uploaded');
      },
      resize(width: number, height: number) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
        gl.uniform2f(resolution, width, height);
        gl.uniform1f(pointRadius, 2.5 / Math.max(1, canvas.clientHeight));
      },
      draw(yaw: number, pitch: number, fov: number, effect?: CollapseScene, reduced = false) {
        gl.uniform1f(effectActive, effect && effect.phase !== 'idle' ? 1 : 0);
        gl.uniform1f(rebuilding, effect?.phase === 'restore' ? 1 : 0);
        if (effect) gl.uniform4f(collapse, effect.x, 1 - effect.y, effect.progress, reduced ? 1 : 0);
        gl.uniform2f(orientation, yaw, pitch);
        gl.uniform1f(halfFov, fov);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      },
      dispose,
    };
  } catch (error) {
    console.warn('Using the photographic panorama fallback.', error);
    dispose();
    return null;
  }
}
