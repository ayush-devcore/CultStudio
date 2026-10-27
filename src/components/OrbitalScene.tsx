import { useEffect, useRef } from 'react';

type MeshData = { positions: Float32Array; normals: Float32Array; colors: Float32Array; indices: Uint16Array };

const vertexShader = `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec3 aColor;
uniform mat4 uProjection;
uniform mat4 uModel;
uniform float uPointSize;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vColor;
void main() {
  vec4 viewPosition = uModel * vec4(aPosition, 1.0);
  vPosition = viewPosition.xyz;
  vNormal = mat3(uModel) * aNormal;
  vColor = aColor;
  gl_Position = uProjection * viewPosition;
  gl_PointSize = uPointSize;
}`;

const fragmentShader = `
precision mediump float;
uniform float uParticles;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vColor;
void main() {
  if (uParticles > 0.5) {
    float radius = distance(gl_PointCoord, vec2(0.5));
    if (radius > 0.5) discard;
    float alpha = (1.0 - smoothstep(0.32, 0.5, radius)) * 0.7;
    gl_FragColor = vec4(vColor, alpha);
  } else {
    vec3 normal = normalize(vNormal);
    vec3 light = normalize(vec3(-0.42, 0.68, 0.9));
    vec3 viewDirection = normalize(-vPosition);
    vec3 halfDirection = normalize(light + viewDirection);
    float diffuse = max(dot(normal, light), 0.0);
    float specular = pow(max(dot(normal, halfDirection), 0.0), 44.0);
    float rim = pow(1.0 - max(dot(normal, viewDirection), 0.0), 2.0);
    vec3 color = vColor * (0.54 + diffuse * 0.76) + vec3(1.0) * specular * 0.64 + vColor * rim * 0.3;
    gl_FragColor = vec4(color, 1.0);
  }
}`;

const mixColor = (a: number[], b: number[], t: number) => a.map((value, index) => value + (b[index] - value) * t);
const normalize = (value: number[]) => {
  const length = Math.hypot(value[0], value[1], value[2]) || 1;
  return value.map((part) => part / length);
};
const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

function createKnot(p: number, q: number, majorRadius: number, tubeRadius: number, segments: number, sides: number): MeshData {
  const blue = [0.27, 0.53, 1];
  const violet = [0.59, 0.42, 1];
  const rose = [1, 0.55, 0.62];
  const rows = segments + 1;
  const columns = sides + 1;
  const positions = new Float32Array(rows * columns * 3);
  const normals = new Float32Array(rows * columns * 3);
  const colors = new Float32Array(rows * columns * 3);
  const indices = new Uint16Array(segments * sides * 6);
  const pointAt = (angle: number) => {
    const around = q * angle / p;
    const radius = majorRadius + Math.cos(around) * majorRadius * 0.48;
    return [radius * Math.cos(angle * p), Math.sin(around) * majorRadius * 0.48, radius * Math.sin(angle * p)];
  };

  for (let row = 0; row <= segments; row += 1) {
    const angle = row / segments * Math.PI * 2;
    const center = pointAt(angle);
    const before = pointAt(angle - 0.001);
    const after = pointAt(angle + 0.001);
    const tangent = normalize(after.map((part, axis) => part - before[axis]));
    const reference = Math.abs(tangent[1]) < 0.88 ? [0, 1, 0] : [1, 0, 0];
    const normal = normalize(cross(tangent, reference));
    const binormal = normalize(cross(tangent, normal));
    const cycle = row / segments;
    const color = cycle < 0.52 ? mixColor(blue, violet, cycle / 0.52) : mixColor(violet, rose, (cycle - 0.52) / 0.48);

    for (let side = 0; side <= sides; side += 1) {
      const around = side / sides * Math.PI * 2;
      const cos = Math.cos(around);
      const sin = Math.sin(around);
      const i3 = (row * columns + side) * 3;
      for (let axis = 0; axis < 3; axis += 1) {
        const radial = normal[axis] * cos + binormal[axis] * sin;
        positions[i3 + axis] = center[axis] + tubeRadius * radial;
        normals[i3 + axis] = radial;
        colors[i3 + axis] = color[axis];
      }
    }
  }

  let index = 0;
  for (let row = 0; row < segments; row += 1) {
    for (let side = 0; side < sides; side += 1) {
      const a = row * columns + side;
      const b = a + columns;
      indices[index++] = a; indices[index++] = b; indices[index++] = a + 1;
      indices[index++] = b; indices[index++] = b + 1; indices[index++] = a + 1;
    }
  }
  return { positions, normals, colors, indices };
}

function createProgram(gl: WebGLRenderingContext) {
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('WebGL could not allocate a shader.');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const reason = gl.getShaderInfoLog(shader) || 'Shader compilation failed.';
      gl.deleteShader(shader);
      throw new Error(reason);
    }
    return shader;
  };
  const vertex = compile(gl.VERTEX_SHADER, vertexShader);
  const fragment = compile(gl.FRAGMENT_SHADER, fragmentShader);
  const program = gl.createProgram();
  if (!program) throw new Error('WebGL could not allocate a program.');
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const reason = gl.getProgramInfoLog(program) || 'Shader linking failed.';
    gl.deleteProgram(program);
    throw new Error(reason);
  }
  return program;
}

function multiply(a: Float32Array, b: Float32Array) {
  const result = new Float32Array(16);
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      result[column * 4 + row] = a[row] * b[column * 4] + a[4 + row] * b[column * 4 + 1] + a[8 + row] * b[column * 4 + 2] + a[12 + row] * b[column * 4 + 3];
    }
  }
  return result;
}
const rotateX = (angle: number) => new Float32Array([1, 0, 0, 0, 0, Math.cos(angle), Math.sin(angle), 0, 0, -Math.sin(angle), Math.cos(angle), 0, 0, 0, 0, 1]);
const rotateY = (angle: number) => new Float32Array([Math.cos(angle), 0, -Math.sin(angle), 0, 0, 1, 0, 0, Math.sin(angle), 0, Math.cos(angle), 0, 0, 0, 0, 1]);
const rotateZ = (angle: number) => new Float32Array([Math.cos(angle), Math.sin(angle), 0, 0, -Math.sin(angle), Math.cos(angle), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
const translate = (z: number, y = 0) => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, y, z, 1]);
const scale = (value: number) => new Float32Array([value, 0, 0, 0, 0, value, 0, 0, 0, 0, value, 0, 0, 0, 0, 1]);

function projectionMatrix(aspect: number) {
  const near = 0.1;
  const far = 100;
  const f = 1 / Math.tan((35 * Math.PI / 180) / 2);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, (2 * far * near) / (near - far), 0]);
}

/** A small hand-built WebGL scene keeps the 3D hero smooth without shipping a large 3D engine. */
export default function OrbitalScene() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const canvas = document.createElement('canvas');
    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext('webgl', { alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch { /* Keep the CSS fallback if this browser blocks WebGL. */ }
    if (!gl) {
      host.classList.add('hero-scene--fallback');
      return;
    }

    const resources: Array<WebGLBuffer | WebGLProgram> = [];
    let frame = 0;
    let elapsed = 0;
    let last = 0;
    let visible = true;
    let pointerX = 0;
    let pointerY = 0;
    let targetPointerX = 0;
    let targetPointerY = 0;
    let hostWidth = 1;
    let hostHeight = 1;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    try {
      const program = createProgram(gl);
      resources.push(program);
      const locations = {
        position: gl.getAttribLocation(program, 'aPosition'),
        normal: gl.getAttribLocation(program, 'aNormal'),
        color: gl.getAttribLocation(program, 'aColor'),
        projection: gl.getUniformLocation(program, 'uProjection'),
        model: gl.getUniformLocation(program, 'uModel'),
        pointSize: gl.getUniformLocation(program, 'uPointSize'),
        particles: gl.getUniformLocation(program, 'uParticles'),
      };

      const knot = createKnot(2, 3, 1.08, 0.27, 240, 28);
      const filament = createKnot(3, 2, 0.8, 0.012, 200, 6);
      const makeBuffer = (target: number, data: BufferSource) => {
        const buffer = gl!.createBuffer();
        if (!buffer) throw new Error('WebGL could not allocate a geometry buffer.');
        gl!.bindBuffer(target, buffer);
        gl!.bufferData(target, data, gl!.STATIC_DRAW);
        resources.push(buffer);
        return buffer;
      };
      const makeMesh = (mesh: MeshData) => ({
        position: makeBuffer(gl!.ARRAY_BUFFER, mesh.positions),
        normal: makeBuffer(gl!.ARRAY_BUFFER, mesh.normals),
        color: makeBuffer(gl!.ARRAY_BUFFER, mesh.colors),
        index: makeBuffer(gl!.ELEMENT_ARRAY_BUFFER, mesh.indices),
        count: mesh.indices.length,
      });
      const mainMesh = makeMesh(knot);
      const filamentMesh = makeMesh(filament);

      const particleCount = window.innerWidth < 700 ? 240 : 440;
      const particlePositions = new Float32Array(particleCount * 3);
      const particleColors = new Float32Array(particleCount * 3);
      const colors = [[0.35, 0.58, 1], [0.91, 0.57, 0.72], [0.62, 0.52, 0.93], [0.52, 0.74, 0.63]];
      for (let i = 0; i < particleCount; i += 1) {
        const i3 = i * 3;
        particlePositions[i3] = (Math.random() - 0.5) * 7.7;
        particlePositions[i3 + 1] = (Math.random() - 0.5) * 6;
        particlePositions[i3 + 2] = (Math.random() - 0.5) * 3 - 0.8;
        const color = colors[Math.floor(Math.random() * colors.length)];
        particleColors.set(color, i3);
      }
      const pointMesh = {
        position: makeBuffer(gl.ARRAY_BUFFER, particlePositions),
        color: makeBuffer(gl.ARRAY_BUFFER, particleColors),
        count: particleCount,
      };
      const zeroNormals = makeBuffer(gl.ARRAY_BUFFER, new Float32Array(3));

      const bindMesh = (mesh: typeof mainMesh | typeof pointMesh) => {
        const bindAttribute = (location: number, buffer: WebGLBuffer) => {
          gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer);
          gl!.enableVertexAttribArray(location);
          gl!.vertexAttribPointer(location, 3, gl!.FLOAT, false, 0, 0);
        };
        bindAttribute(locations.position, mesh.position);
        bindAttribute(locations.color, mesh.color);
        bindAttribute(locations.normal, 'normal' in mesh ? mesh.normal : zeroNormals);
      };

      gl.useProgram(program);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
      canvas.setAttribute('aria-hidden', 'true');
      host.appendChild(canvas);

      const resize = () => {
        const bounds = host.getBoundingClientRect();
        hostWidth = Math.max(1, bounds.width);
        hostHeight = Math.max(1, bounds.height);
        const width = Math.max(1, Math.round(hostWidth * Math.min(window.devicePixelRatio || 1, 1.6)));
        const height = Math.max(1, Math.round(hostHeight * Math.min(window.devicePixelRatio || 1, 1.6)));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
        gl!.viewport(0, 0, width, height);
        gl!.useProgram(program);
        gl!.uniformMatrix4fv(locations.projection, false, projectionMatrix(width / height));
      };
      resize();
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);

      const onPointer = (event: PointerEvent) => {
        targetPointerX = (event.offsetX / hostWidth - 0.5) * 2;
        targetPointerY = (event.offsetY / hostHeight - 0.5) * 2;
      };
      const onPointerLeave = () => { targetPointerX = 0; targetPointerY = 0; };
      const draw = (time: number) => {
        frame = 0;
        if (!visible) return;
        if (!reduceMotion.matches) elapsed += Math.min((time - (last || time)) / 1000, 0.05);
        last = time;
        pointerX += (targetPointerX - pointerX) * 0.08;
        pointerY += (targetPointerY - pointerY) * 0.08;
        const x = 0.64 + Math.sin(elapsed * 0.34) * 0.12 - pointerY * 0.08;
        const y = 0.36 + elapsed * 0.34 + pointerX * 0.12;
        const z = Math.sin(elapsed * 0.24) * 0.08;
        const rotation = multiply(multiply(rotateZ(z), rotateX(x)), rotateY(y));
        const base = multiply(translate(-7.7, Math.sin(elapsed * 0.82) * 0.1), rotation);

        gl!.clear(gl!.COLOR_BUFFER_BIT | gl!.DEPTH_BUFFER_BIT);
        gl!.useProgram(program);
        gl!.uniform1f(locations.particles, 0);
        gl!.uniform1f(locations.pointSize, 1);
        gl!.uniformMatrix4fv(locations.model, false, base);
        bindMesh(mainMesh);
        gl!.bindBuffer(gl!.ELEMENT_ARRAY_BUFFER, mainMesh.index);
        gl!.drawElements(gl!.TRIANGLES, mainMesh.count, gl!.UNSIGNED_SHORT, 0);

        const filamentBase = multiply(base, multiply(rotateY(-elapsed * 0.21), multiply(rotateX(0.45 + Math.sin(elapsed * 0.45) * 0.12), scale(0.78))));
        gl!.uniformMatrix4fv(locations.model, false, filamentBase);
        bindMesh(filamentMesh);
        gl!.bindBuffer(gl!.ELEMENT_ARRAY_BUFFER, filamentMesh.index);
        gl!.drawElements(gl!.TRIANGLES, filamentMesh.count, gl!.UNSIGNED_SHORT, 0);

        const particleBase = multiply(translate(-7.7), multiply(rotateY(elapsed * 0.018), rotateX(Math.sin(elapsed * 0.13) * 0.025)));
        gl!.uniformMatrix4fv(locations.model, false, particleBase);
        gl!.uniform1f(locations.particles, 1);
        gl!.uniform1f(locations.pointSize, Math.max(1.4, Math.min(window.devicePixelRatio || 1, 1.6) * 1.8));
        gl!.depthMask(false);
        bindMesh(pointMesh);
        gl!.drawArrays(gl!.POINTS, 0, pointMesh.count);
        gl!.depthMask(true);
        if (!reduceMotion.matches) frame = window.requestAnimationFrame(draw);
      };
      const start = () => { if (!frame && visible && !reduceMotion.matches) frame = window.requestAnimationFrame(draw); };
      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          if (reduceMotion.matches) draw(performance.now());
          else start();
        } else if (frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      }, { threshold: 0.05 });
      observer.observe(host);
      host.addEventListener('pointermove', onPointer, { passive: true });
      host.addEventListener('pointerleave', onPointerLeave, { passive: true });
      const onMotionChange = () => {
        if (reduceMotion.matches) {
          if (frame) cancelAnimationFrame(frame);
          frame = 0;
          draw(performance.now());
        } else start();
      };
      reduceMotion.addEventListener('change', onMotionChange);
      const onContextLost = (event: Event) => {
        event.preventDefault();
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        host.classList.add('hero-scene--fallback');
      };
      canvas.addEventListener('webglcontextlost', onContextLost, false);
      if (reduceMotion.matches) draw(performance.now());
      else start();

      return () => {
        if (frame) cancelAnimationFrame(frame);
        observer.disconnect();
        resizeObserver.disconnect();
        reduceMotion.removeEventListener('change', onMotionChange);
        host.removeEventListener('pointermove', onPointer);
        host.removeEventListener('pointerleave', onPointerLeave);
        canvas.removeEventListener('webglcontextlost', onContextLost);
        resources.forEach((resource) => {
          if (resource instanceof WebGLProgram) gl!.deleteProgram(resource);
          else gl!.deleteBuffer(resource);
        });
        host.classList.remove('hero-scene--fallback');
        canvas.remove();
      };
    } catch {
      resources.forEach((resource) => {
        if (resource instanceof WebGLProgram) gl!.deleteProgram(resource);
        else gl!.deleteBuffer(resource);
      });
      host.classList.add('hero-scene--fallback');
      return;
    }
  }, []);

  return <div ref={hostRef} className="hero-scene" role="img" aria-label="An animated, colorful 3D infinity-knot sculpture with drifting particles" />;
}
