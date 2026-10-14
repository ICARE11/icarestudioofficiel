import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const mount = document.getElementById("portfolio-three-scene");
const viewport = document.getElementById("portfolio-conveyor");
const projectGrid = document.getElementById("portfolio-grid");

if (mount && viewport && projectGrid) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: window.devicePixelRatio <= 1.5,
      powerPreference: "low-power"
    });
  } catch (error) {
    mount.hidden = true;
    viewport.classList.add("portfolio-hub-fallback");
    console.warn("Le rendu WebGL du portfolio n’est pas disponible.", error);
  }

  if (renderer) {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080b12, 0.035);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0.7, 11);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.domElement.setAttribute("aria-hidden", "true");
    mount.append(renderer.domElement);
    renderer.domElement.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      viewport.classList.remove("portfolio-hub-ready");
      viewport.classList.add("portfolio-hub-fallback");
      mount.hidden = true;
    });

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.58, 0.62, 0.2);
    bloom.threshold = 0.72;
    bloom.strength = 0.55;
    bloom.radius = 0.72;
    composer.addPass(bloom);

    scene.add(new THREE.AmbientLight(0xa7c9ff, 1.45));
    const keyLight = new THREE.PointLight(0x77aaff, 50, 24, 2);
    keyLight.position.set(-4, 4, 5);
    scene.add(keyLight);
    const cyanLight = new THREE.PointLight(0x42e6ff, 30, 18, 2);
    cyanLight.position.set(4, -1, 2);
    scene.add(cyanLight);

    const world = new THREE.Group();
    scene.add(world);
    const orbitRoot = new THREE.Group();
    world.add(orbitRoot);

    const coreUniforms = { uTime: { value: 0 } };
    const coreMaterial = new THREE.ShaderMaterial({
      uniforms: coreUniforms,
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          float wave = sin(vPosition.y * 13.0 + uTime * 1.4) * 0.5 + 0.5;
          float bands = sin((vPosition.x + vPosition.z) * 19.0 - uTime * 1.8) * 0.5 + 0.5;
          float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 2.0);
          vec3 deep = vec3(0.015, 0.055, 0.12);
          vec3 electric = vec3(0.12, 0.66, 0.98);
          vec3 color = mix(deep, electric, wave * 0.38 + bands * 0.18 + fresnel * 0.7);
          gl_FragColor = vec4(color, 0.94);
        }
      `,
      transparent: true
    });
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.86, 5), coreMaterial);
    world.add(core);

    const wireCore = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.98, 2),
      new THREE.MeshBasicMaterial({ color: 0x79dfff, wireframe: true, transparent: true, opacity: 0.17 })
    );
    world.add(wireCore);

    const createRing = (radius, tube, color, tilt, speed) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, tube, 10, 180),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.62 })
      );
      ring.rotation.set(tilt, 0.25, 0.1);
      ring.userData.rotationSpeed = speed;
      world.add(ring);
      return ring;
    };
    const rings = [
      createRing(1.32, 0.012, 0x46cfff, 0.66, 0.14),
      createRing(1.58, 0.008, 0x567eff, 1.08, -0.1),
      createRing(1.08, 0.006, 0xb9edff, 0.32, 0.18)
    ];

    const particleCount = window.innerWidth < 650 ? 420 : 900;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let index = 0; index < particleCount; index += 1) {
      const radius = 3.5 + Math.random() * 12;
      const theta = Math.random() * Math.PI * 2;
      particlePositions[index * 3] = Math.cos(theta) * radius;
      particlePositions[index * 3 + 1] = (Math.random() - 0.5) * 11;
      particlePositions[index * 3 + 2] = -Math.random() * 13 - 1;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({ color: 0x92c9ff, size: 0.025, transparent: true, opacity: 0.7 })
    );
    scene.add(particles);

    const floorGrid = new THREE.GridHelper(40, 48, 0x25547b, 0x162943);
    floorGrid.position.set(0, -3.15, -4);
    const gridMaterials = Array.isArray(floorGrid.material) ? floorGrid.material : [floorGrid.material];
    gridMaterials.forEach((material) => {
      material.transparent = true;
      material.opacity = 0.23;
    });
    scene.add(floorGrid);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const cards = [];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const status = document.getElementById("portfolio-hub-status");
    const focusIndex = document.getElementById("portfolio-focus-index");
    const focusTitle = document.getElementById("portfolio-focus-title");
    const focusSummary = document.getElementById("portfolio-focus-summary");
    const focusTags = document.getElementById("portfolio-focus-tags");
    const openButton = document.getElementById("portfolio-open");
    const previousButton = document.getElementById("portfolio-prev");
    const nextButton = document.getElementById("portfolio-next");

    let projects = [];
    let selectedIndex = 0;
    let hoveredIndex = -1;
    let dragging = false;
    let lastPointerX = 0;
    let targetRotation = 0;
    let mouseX = 0;
    let mouseY = 0;
    let animationFrame = 0;
    let isVisible = true;
    let lastFrame = 0;

    const setSelected = (index) => {
      if (!projects.length) return;
      selectedIndex = (index + projects.length) % projects.length;
      targetRotation = -selectedIndex * (Math.PI * 2 / projects.length);
      const project = projects[selectedIndex];
      focusIndex.textContent = `PROJET ${String(selectedIndex + 1).padStart(2, "0")} / ${String(projects.length).padStart(2, "0")}`;
      focusTitle.textContent = project.title || `Projet ${selectedIndex + 1}`;
      focusSummary.textContent = project.description || "Projet sélectionné par Icare Studio.";
      focusTags.replaceChildren(...(project.tags || []).slice(0, 4).map((tag) => {
        const element = document.createElement("span");
        element.textContent = tag;
        return element;
      }));
      openButton.disabled = false;
      cards.forEach((card, cardIndex) => {
        card.userData.selected = cardIndex === selectedIndex;
      });
    };

    const makeCardTexture = (project, index) => {
      const canvas = document.createElement("canvas");
      canvas.width = 768;
      canvas.height = 480;
      const context = canvas.getContext("2d");
      const gradient = context.createLinearGradient(0, 0, 768, 480);
      gradient.addColorStop(0, "#16263e");
      gradient.addColorStop(0.55, "#101b2b");
      gradient.addColorStop(1, "#09111e");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 768, 480);
      context.strokeStyle = "rgba(111,200,255,.6)";
      context.lineWidth = 3;
      context.strokeRect(14, 14, 740, 452);
      context.fillStyle = "rgba(93,185,255,.11)";
      context.fillRect(28, 28, 712, 424);
      context.fillStyle = "#91d9ff";
      context.font = "600 23px Arial";
      context.letterSpacing = "5px";
      context.fillText(`ICARE STUDIO  /  ${String(index + 1).padStart(2, "0")}`, 52, 82);
      context.fillStyle = "#f4f8ff";
      context.font = "600 47px Arial";
      const title = String(project.title || `Projet ${index + 1}`).slice(0, 27);
      context.fillText(title, 52, 206);
      context.fillStyle = "#a4bad4";
      context.font = "24px Arial";
      const tags = (project.tags || []).slice(0, 3).join("  ·  ");
      context.fillText(tags.slice(0, 54) || "PROJET SÉLECTIONNÉ", 52, 256);
      context.fillStyle = "rgba(130,192,255,.2)";
      context.fillRect(52, 330, 160, 4);
      context.fillStyle = "#829bb8";
      context.font = "18px Arial";
      context.fillText("DOSSIER PROJET  ·  OUVRIR POUR EXPLORER", 52, 390);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    };

    const clearCards = () => {
      while (orbitRoot.children.length) {
        const card = orbitRoot.children[0];
        orbitRoot.remove(card);
        card.traverse((object) => {
          object.geometry?.dispose();
          if (object.material) {
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((material) => {
              material.map?.dispose();
              material.dispose();
            });
          }
        });
      }
      cards.length = 0;
    };

    const rebuild = () => {
      clearCards();
      if (!projects.length) {
        focusTitle.textContent = "La constellation arrive.";
        focusSummary.textContent = "Les projets publiés apparaîtront ici.";
        focusIndex.textContent = "SYSTEM · IDLE";
        focusTags.replaceChildren();
        status.textContent = "AWAITING PROJECTS";
        openButton.disabled = true;
        return;
      }
      const radiusX = window.innerWidth < 650 ? 2.65 : 4.2;
      const radiusZ = window.innerWidth < 650 ? 0.5 : 1.2;
      projects.forEach((project, index) => {
        const angle = index * Math.PI * 2 / projects.length;
        const group = new THREE.Group();
        group.position.set(Math.sin(angle) * radiusX, 1.72, Math.cos(angle) * radiusZ);
        group.userData.baseY = group.position.y;
        group.rotation.y = -angle * 0.18;
        group.userData.projectIndex = index;
        const frame = new THREE.Mesh(
          new THREE.BoxGeometry(2.6, 1.64, 0.1),
          new THREE.MeshPhysicalMaterial({
            color: 0x91cfff,
            metalness: 0.36,
            roughness: 0.2,
            transparent: true,
            opacity: 0.22,
            transmission: 0.14,
            emissive: 0x123960,
            emissiveIntensity: 0.65
          })
        );
        group.add(frame);
        const face = new THREE.Mesh(
          new THREE.PlaneGeometry(2.48, 1.52),
          new THREE.MeshBasicMaterial({ map: makeCardTexture(project, index), transparent: true, side: THREE.DoubleSide })
        );
        face.position.z = 0.061;
        group.add(face);
        const edge = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.BoxGeometry(2.64, 1.68, 0.11)),
          new THREE.LineBasicMaterial({ color: 0x70d8ff, transparent: true, opacity: 0.8 })
        );
        edge.userData.edge = true;
        group.add(edge);
        const hitArea = new THREE.Mesh(
          new THREE.PlaneGeometry(2.64, 1.68),
          new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide })
        );
        hitArea.position.z = 0.12;
        hitArea.userData.projectIndex = index;
        group.add(hitArea);
        orbitRoot.add(group);
        cards.push(group);
      });
      status.textContent = "SYSTEM ONLINE";
      setSelected(Math.min(selectedIndex, projects.length - 1));
    };

    const openSelected = () => {
      const card = projectGrid.querySelector(`[data-station="${selectedIndex + 1}"]`);
      card?.click();
    };
    openButton.addEventListener("click", openSelected);
    previousButton.addEventListener("click", () => setSelected(selectedIndex - 1));
    nextButton.addEventListener("click", () => setSelected(selectedIndex + 1));

    viewport.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button")) return;
      dragging = true;
      lastPointerX = event.clientX;
      viewport.classList.add("is-dragging");
      viewport.setPointerCapture?.(event.pointerId);
    });
    viewport.addEventListener("pointermove", (event) => {
      const bounds = viewport.getBoundingClientRect();
      mouseX = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      mouseY = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      if (!dragging) return;
      const delta = event.clientX - lastPointerX;
      lastPointerX = event.clientX;
      targetRotation += delta * 0.0055;
      scheduleRender();
    });
    const releaseDrag = () => {
      if (dragging && projects.length) {
        selectedIndex = ((Math.round(-targetRotation / (Math.PI * 2 / projects.length)) % projects.length) + projects.length) % projects.length;
        setSelected(selectedIndex);
      }
      dragging = false;
      viewport.classList.remove("is-dragging");
    };
    viewport.addEventListener("pointerup", releaseDrag);
    viewport.addEventListener("pointercancel", releaseDrag);
    viewport.addEventListener("pointerleave", () => { mouseX *= 0.6; mouseY *= 0.6; });
    viewport.addEventListener("wheel", (event) => {
      event.preventDefault();
      setSelected(selectedIndex + (event.deltaX + event.deltaY > 0 ? 1 : -1));
    }, { passive: false });
    viewport.addEventListener("click", (event) => {
      if (event.target.closest(".portfolio-hud")) return;
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const targets = cards.flatMap((card) => card.children.filter((child) => child.userData.projectIndex !== undefined));
      const hit = raycaster.intersectObjects(targets, false)[0];
      if (hit) {
        setSelected(hit.object.userData.projectIndex);
        openSelected();
      }
    });

    window.addEventListener("icare:portfolio-projects-updated", (event) => {
      projects = Array.isArray(event.detail?.projects) ? event.detail.projects : [];
      rebuild();
    });
    if (Array.isArray(window.IcarePortfolioProjects)) {
      projects = window.IcarePortfolioProjects;
      rebuild();
    }

    const resize = () => {
      const bounds = mount.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      renderer.setSize(bounds.width, bounds.height, false);
      composer.setSize(bounds.width, bounds.height);
      camera.aspect = bounds.width / bounds.height;
      camera.updateProjectionMatrix();
      rebuild();
    };
    new ResizeObserver(resize).observe(viewport);
    new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) scheduleRender();
      else {
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    }).observe(viewport);
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("keydown", (event) => {
      if (!viewport.closest(".spa-page")?.hidden && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        setSelected(selectedIndex + (event.key === "ArrowRight" ? 1 : -1));
      }
    });

    const render = (time) => {
      animationFrame = 0;
      if (!isVisible) return;
      const delta = Math.min((time - lastFrame) / 1000 || 0, 0.04);
      lastFrame = time;
      coreUniforms.uTime.value = time * 0.001;
      if (!reduceMotion.matches) {
        core.rotation.y += delta * 0.18;
        core.rotation.x += delta * 0.08;
        wireCore.rotation.y -= delta * 0.08;
        rings.forEach((ring) => { ring.rotation.z += delta * ring.userData.rotationSpeed; });
        particles.rotation.y += delta * 0.006;
        world.rotation.y += ((mouseX * 0.12) - world.rotation.y) * 0.025;
        world.rotation.x += ((mouseY * 0.06) - world.rotation.x) * 0.025;
      }
      orbitRoot.rotation.y += (targetRotation - orbitRoot.rotation.y) * Math.min(1, delta * 5);
      cards.forEach((card, index) => {
        const selected = card.userData.selected;
        const hovered = index === hoveredIndex;
        const scale = selected ? 1.06 : hovered ? 1.03 : 0.86;
        card.scale.setScalar(card.scale.x + (scale - card.scale.x) * 0.08);
        card.position.y = card.userData.baseY + (reduceMotion.matches ? 0 : Math.sin(time * 0.001 + index * 1.7) * 0.08);
        const edges = card.children.find((child) => child.userData.edge);
        if (edges) edges.material.opacity = selected || hovered ? 1 : 0.42;
      });
      composer.render();
      if (!reduceMotion.matches || cards.length) scheduleRender();
    };
    function scheduleRender() {
      if (isVisible && !animationFrame) animationFrame = requestAnimationFrame(render);
    }

    let pointerMoveFrame = 0;
    renderer.domElement.addEventListener("pointermove", (event) => {
      if (dragging || pointerMoveFrame) return;
      pointerMoveFrame = requestAnimationFrame(() => {
        pointerMoveFrame = 0;
        const bounds = renderer.domElement.getBoundingClientRect();
        pointer.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1);
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(cards.flatMap((card) => card.children.filter((child) => child.userData.projectIndex !== undefined)), false);
        hoveredIndex = hits[0]?.object.userData.projectIndex ?? -1;
        if (hoveredIndex >= 0 && hoveredIndex !== selectedIndex) setSelected(hoveredIndex);
        renderer.domElement.style.cursor = hoveredIndex >= 0 ? "pointer" : "grab";
        scheduleRender();
      });
    });

    viewport.classList.add("portfolio-hub-ready");
    resize();
    scheduleRender();
  }
}
