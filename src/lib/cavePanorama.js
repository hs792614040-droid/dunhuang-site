const vertexSource = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`

const fragmentSource = `
precision mediump float;

uniform sampler2D murals;
uniform vec2 viewport;
uniform vec2 camera;

void main() {
  vec2 screen = (gl_FragCoord.xy * 2.0 - viewport) / max(viewport.x, viewport.y);
  // Keep a generous vertical field of view on a narrow phone.
  vec3 ray = normalize(vec3(screen * 0.92, 1.0));
  float sx = sin(camera.y);
  float cx = cos(camera.y);
  float sy = sin(camera.x);
  float cy = cos(camera.x);
  ray = vec3(ray.x, ray.y * cx + ray.z * sx, ray.z * cx - ray.y * sx);
  ray = vec3(ray.x * cy + ray.z * sy, ray.y, ray.z * cy - ray.x * sy);

  vec3 halfRoom = vec3(1.40, 1.08, 1.67);
  vec3 distanceToWall = halfRoom / max(abs(ray), vec3(0.0001));
  float depth = min(distanceToWall.x, min(distanceToWall.y, distanceToWall.z));
  vec3 hit = ray * depth / halfRoom;
  vec2 face;
  vec2 tile;
  float light = 1.0;

  if (distanceToWall.z <= min(distanceToWall.x, distanceToWall.y)) {
    face = vec2(hit.x * sign(ray.z), -hit.y);
    tile = ray.z >= 0.0 ? vec2(0.0, 0.0) : vec2(0.0, 1.0);
  } else if (distanceToWall.x <= distanceToWall.y) {
    face = vec2(-hit.z * sign(ray.x), -hit.y);
    tile = ray.x >= 0.0 ? vec2(1.0, 0.0) : vec2(2.0, 0.0);
    light = 0.78;
  } else {
    face = vec2(hit.x, hit.z * sign(ray.y));
    tile = ray.y >= 0.0 ? vec2(1.0, 1.0) : vec2(2.0, 1.0);
    light = ray.y >= 0.0 ? 0.70 : 0.48;
  }

  vec2 uv = clamp(face * 0.5 + 0.5, 0.003, 0.997);
  vec3 color = texture2D(murals, (uv + tile) / vec2(3.0, 2.0)).rgb;
  float edgeShade = 0.74 + 0.26 * smoothstep(0.0, 0.20, min(uv.x, min(uv.y, min(1.0 - uv.x, 1.0 - uv.y))));
  float vignette = 1.11 - 0.20 * dot(screen, screen);
  gl_FragColor = vec4(color * light * edgeShade * vignette * vec3(1.07, 0.99, 0.88), 1.0);
}`

export const panoramaFaces = [
  '/images/banner-three.jpg',
  '/images/his1.jpg',
  '/images/his2.jpg',
  '/images/bg5.jpg',
  '/images/3.jpg',
  '/images/2.jpg'
]

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = url
  })
}

function makeAtlas(images) {
  const size = 672
  const atlas = document.createElement('canvas')
  atlas.width = size * 3
  atlas.height = size * 2
  const context = atlas.getContext('2d')

  images.forEach((image, index) => {
    const crop = Math.min(image.width, image.height)
    const cropX = (image.width - crop) * (index === 0 ? 0.32 : 0.5)
    const cropY = (image.height - crop) * 0.5
    context.drawImage(image, cropX, cropY, crop, crop, index % 3 * size, Math.floor(index / 3) * size, size, size)
  })

  return atlas
}

function compile(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader
  gl.deleteShader(shader)
  return null
}

export async function createCavePanorama(canvas) {
  const images = await Promise.all(panoramaFaces.map(loadImage))
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false })
  if (!gl) return null

  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource)
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource)
  const program = gl.createProgram()
  const geometry = gl.createBuffer()
  const texture = gl.createTexture()

  function dispose() {
    gl.deleteTexture(texture)
    gl.deleteBuffer(geometry)
    gl.deleteProgram(program)
    if (vertex) gl.deleteShader(vertex)
    if (fragment) gl.deleteShader(fragment)
  }

  if (!vertex || !fragment) {
    dispose()
    return null
  }

  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    dispose()
    return null
  }

  gl.useProgram(program)
  gl.bindBuffer(gl.ARRAY_BUFFER, geometry)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const position = gl.getAttribLocation(program, 'position')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, makeAtlas(images))
  gl.uniform1i(gl.getUniformLocation(program, 'murals'), 0)

  const viewport = gl.getUniformLocation(program, 'viewport')
  const camera = gl.getUniformLocation(program, 'camera')

  function draw(yaw, pitch) {
    const cssWidth = canvas.clientWidth
    const cssHeight = canvas.clientHeight
    const scale = Math.min(window.devicePixelRatio || 1, 1.7, 1800 / Math.max(cssWidth, cssHeight))
    const width = Math.max(1, Math.round(cssWidth * scale))
    const height = Math.max(1, Math.round(cssHeight * scale))
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }
    gl.viewport(0, 0, width, height)
    gl.uniform2f(viewport, width, height)
    gl.uniform2f(camera, yaw, pitch)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  return { draw, dispose }
}
