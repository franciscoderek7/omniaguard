/**
 * empire/engine.js
 *
 * Three.js scene mount — owns the WebGLRenderer, render loop, and resize
 * handling. Has no knowledge of floors, elevators, or buildings: it just
 * renders whatever {scene, camera, update} triple the mounted object
 * returns from getActive() every frame. scene.js's SkyscraperBuilding is
 * the thing actually mounted in practice.
 */

export class Engine {
  constructor(container, { THREE, antialias = true } = {}) {
    if (!THREE) throw new Error('Engine: THREE must be passed in (e.g. { THREE })');
    this.THREE = THREE;
    this.container = container;

    this.renderer = new THREE.WebGLRenderer({ antialias });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    this.building = null;
    this._running = false;
    this._frameId = null;

    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
  }

  mount(building) {
    this.building = building;
  }

  _onResize() {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    const active = this.building?.getActive?.();
    if (active?.camera?.isPerspectiveCamera) {
      active.camera.aspect = w / h;
      active.camera.updateProjectionMatrix();
    }
  }

  start() {
    if (this._running) return;
    this._running = true;
    const loop = () => {
      if (!this._running) return;
      this._frameId = requestAnimationFrame(loop);
      const active = this.building?.getActive?.();
      if (!active) return;
      active.update?.();
      this.renderer.render(active.scene, active.camera);
    };
    loop();
  }

  stop() {
    this._running = false;
    if (this._frameId != null) cancelAnimationFrame(this._frameId);
    this._frameId = null;
  }

  dispose() {
    this.stop();
    window.removeEventListener('resize', this._onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}

export default Engine;
