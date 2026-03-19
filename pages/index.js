import { useEffect } from "react";
import Head from "next/head";

export default function Home() {
  useEffect(() => {
    let scene;
    let camera;
    let renderer;
    let group;
    let particles;
    let streakLight1;
    let streakLight2;
    let streakMesh1;
    let streakMesh2;
    let word1;
    let word2;
    let chromeEnvTarget;
    let introProgress = 0;
    let targetProgress = 1;
    let modalTransitionInterval;
    let animationFrame;
    let isDisposed = false;
    let isModalOpen = false;

    const loadingEl = document.getElementById("loading");
    const container = document.getElementById("canvas-container");
    const modal = document.getElementById("infoModal");
    const playPauseBtn = document.getElementById("playPauseBtn");

    if (!container || !loadingEl || !modal) {
      return undefined;
    }

    function togglePlayState() {
      const isShowing = modal.classList.contains("active");
      isModalOpen = !isShowing;

      if (modalTransitionInterval) {
        clearInterval(modalTransitionInterval);
      }

      if (!isShowing) {
        targetProgress = 0;
        playPauseBtn.innerText = "||";

        modalTransitionInterval = setInterval(() => {
          if (introProgress <= 0) {
            clearInterval(modalTransitionInterval);
            modal.style.display = "flex";
            void modal.offsetWidth;
            modal.classList.add("active");
          }
        }, 50);
      } else {
        modal.classList.remove("active");
        playPauseBtn.innerText = "▶";

        setTimeout(() => {
          if (!modal.classList.contains("active")) {
            modal.style.display = "none";
            targetProgress = 1;
          }
        }, 400);
      }
    }

    playPauseBtn?.addEventListener("click", togglePlayState);

    const bootstrap = async () => {
      const THREE = await import("three");
      const { FontLoader } = await import("three/examples/jsm/loaders/FontLoader.js");
      const { TTFLoader } = await import("three/examples/jsm/loaders/TTFLoader.js");
      const { TextGeometry } = await import("three/examples/jsm/geometries/TextGeometry.js");

      if (isDisposed) {
        return;
      }

      function createCircleTexture() {
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext("2d");
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
        gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.8)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(canvas);
      }

      function createStreakTexture() {
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 128;
        const context = canvas.getContext("2d");

        const gradient = context.createLinearGradient(0, 64, 512, 64);
        gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
        gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.4)");
        gradient.addColorStop(0.5, "rgba(255, 255, 255, 1)");
        gradient.addColorStop(0.7, "rgba(255, 255, 255, 0.4)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        context.fillStyle = gradient;
        context.fillRect(0, 0, 512, 128);

        const vGrad = context.createLinearGradient(256, 0, 256, 128);
        vGrad.addColorStop(0, "rgba(0,0,0,1)");
        vGrad.addColorStop(0.4, "rgba(0,0,0,0)");
        vGrad.addColorStop(0.6, "rgba(0,0,0,0)");
        vGrad.addColorStop(1, "rgba(0,0,0,1)");

        context.globalCompositeOperation = "destination-out";
        context.fillStyle = vGrad;
        context.fillRect(0, 0, 512, 128);

        return new THREE.CanvasTexture(canvas);
      }

      function onWindowResize() {
        if (!camera || !renderer) {
          return;
        }
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }

      function buildChromeEnvironment() {
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();

        const envScene = new THREE.Scene();
        envScene.background = new THREE.Color(0x02040a);

        const skyGeo = new THREE.SphereGeometry(250, 32, 32);
        const skyMat = new THREE.MeshBasicMaterial({
          color: 0x07111f,
          side: THREE.BackSide,
        });
        const sky = new THREE.Mesh(skyGeo, skyMat);
        envScene.add(sky);

        const glowColors = [0x00d9ff, 0x0055ff, 0xffffff];
        glowColors.forEach((color, index) => {
          const glow = new THREE.Mesh(
            new THREE.SphereGeometry(index === 2 ? 22 : 14, 24, 24),
            new THREE.MeshBasicMaterial({ color })
          );
          glow.position.set(index === 0 ? -60 : index === 1 ? 70 : 0, index === 2 ? 60 : -10, -40 + index * 40);
          envScene.add(glow);
        });

        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(90, 8, 16, 64),
          new THREE.MeshBasicMaterial({ color: 0x66ccff })
        );
        ring.rotation.x = Math.PI / 2.8;
        ring.position.z = -60;
        envScene.add(ring);

        const envRenderTarget = pmremGenerator.fromScene(envScene, 0.04);
        const environmentMap = envRenderTarget.texture;

        sky.geometry.dispose();
        sky.material.dispose();
        ring.geometry.dispose();
        ring.material.dispose();
        envScene.children
          .filter((child) => child !== sky && child !== ring)
          .forEach((child) => {
            child.geometry?.dispose?.();
            child.material?.dispose?.();
          });
        pmremGenerator.dispose();

        return { environmentMap, envRenderTarget };
      }

      function build3DText(font) {
        loadingEl.style.display = "none";

        const textOptions = {
          font,
          size: 70,
          depth: 40,
          curveSegments: 12,
          bevelEnabled: true,
          bevelThickness: 3,
          bevelSize: 2,
          bevelOffset: 0,
          bevelSegments: 5,
        };

        const { environmentMap, envRenderTarget } = buildChromeEnvironment();
        chromeEnvTarget = envRenderTarget;
        scene.environment = environmentMap;

        const material = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          metalness: 1,
          roughness: 0.08,
          envMapIntensity: 2.2,
          clearcoat: 1,
          clearcoatRoughness: 0.05,
          emissive: 0x06080f,
        });

        const lineMat = new THREE.LineBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.4,
          blending: THREE.AdditiveBlending,
        });

        const geo1 = new TextGeometry("Okada", textOptions);
        geo1.computeBoundingBox();
        const w1 = geo1.boundingBox.max.x - geo1.boundingBox.min.x;
        geo1.translate(
          -(geo1.boundingBox.max.x + geo1.boundingBox.min.x) / 2,
          -(geo1.boundingBox.max.y + geo1.boundingBox.min.y) / 2,
          -20
        );

        word1 = new THREE.Mesh(geo1, material);
        word1.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo1), lineMat));

        const geo2 = new TextGeometry("Air", textOptions);
        geo2.computeBoundingBox();
        const w2 = geo2.boundingBox.max.x - geo2.boundingBox.min.x;
        geo2.translate(
          -(geo2.boundingBox.max.x + geo2.boundingBox.min.x) / 2,
          -(geo2.boundingBox.max.y + geo2.boundingBox.min.y) / 2,
          -20
        );

        word2 = new THREE.Mesh(geo2, material);
        word2.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo2), lineMat));

        const gap = 35;
        const totalW = w1 + gap + w2;

        word1.userData = { targetX: -totalW / 2 + w1 / 2, targetZ: 0 };
        word2.userData = { targetX: totalW / 2 - w2 / 2, targetZ: 0 };

        word1.scale.set(0, 0, 0);
        word2.scale.set(0, 0, 0);

        group.add(word1);
        group.add(word2);
      }

      function init() {
        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
        camera.position.set(0, 0, 800);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        group = new THREE.Group();
        group.position.y = 10;
        group.rotation.x = -0.7;
        scene.add(group);

        scene.add(new THREE.HemisphereLight(0x00ffff, 0x002266, 0.8));

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
        dirLight.position.set(50, 100, 150);
        scene.add(dirLight);

        const cyanLight = new THREE.PointLight(0x00ffff, 1.6, 600);
        cyanLight.position.set(-100, 50, 80);
        scene.add(cyanLight);

        const coolBlueLight = new THREE.PointLight(0x0055ff, 1.4, 600);
        coolBlueLight.position.set(100, -50, 80);
        scene.add(coolBlueLight);

        const blueLight = new THREE.PointLight(0x0088ff, 1.1, 600);
        blueLight.position.set(0, 0, 150);
        scene.add(blueLight);

        const particleCount = 1200;
        const particleGeo = new THREE.BufferGeometry();
        const particlePos = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount * 3; i += 1) {
          particlePos[i] = (Math.random() - 0.5) * 2000;
        }
        particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));
        const particleMat = new THREE.PointsMaterial({
          color: 0x00ffff,
          size: 3,
          map: createCircleTexture(),
          transparent: true,
          opacity: 0.6,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        particles = new THREE.Points(particleGeo, particleMat);
        scene.add(particles);

        const streakGeo = new THREE.PlaneGeometry(350, 15);
        const streakTex = createStreakTexture();

        streakLight1 = new THREE.PointLight(0x00ffff, 4, 300);
        streakMesh1 = new THREE.Mesh(
          streakGeo,
          new THREE.MeshBasicMaterial({
            map: streakTex,
            color: 0x00ffff,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
          })
        );
        streakLight1.add(streakMesh1);
        group.add(streakLight1);

        streakLight2 = new THREE.PointLight(0x0055ff, 4, 300);
        streakMesh2 = new THREE.Mesh(
          streakGeo,
          new THREE.MeshBasicMaterial({
            map: streakTex,
            color: 0x00aaff,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
          })
        );
        streakMesh2.scale.set(0.8, 1.5, 1);
        streakLight2.add(streakMesh2);
        group.add(streakLight2);

        const ttfLoader = new TTFLoader();
        const fontUrlsToTry = [
          "https://cdn.jsdelivr.net/gh/Omnibus-Type/MuseoModerno@master/fonts/ttf/MuseoModerno-Bold.ttf",
          "https://raw.githubusercontent.com/Omnibus-Type/MuseoModerno/master/fonts/ttf/MuseoModerno-Bold.ttf",
          "https://raw.githubusercontent.com/google/fonts/main/ofl/museomoderno/static/MuseoModerno-Bold.ttf",
          "https://raw.githubusercontent.com/google/fonts/main/ofl/museomoderno/static/MuseoModerno-Regular.ttf",
        ];

        const fontLoader = new FontLoader();
        function attemptLoadFont(index) {
          if (index >= fontUrlsToTry.length) {
            loadingEl.innerText = "Loading Native Font...";
            fontLoader.load(
              "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/fonts/helvetiker_bold.typeface.json",
              (nativeFont) => {
                if (!isDisposed) {
                  build3DText(nativeFont);
                }
              }
            );
            return;
          }

          ttfLoader.load(
            fontUrlsToTry[index],
            (json) => {
              if (isDisposed) {
                return;
              }
              build3DText(fontLoader.parse(json));
            },
            undefined,
            () => {
              attemptLoadFont(index + 1);
            }
          );
        }

        attemptLoadFont(0);
        window.addEventListener("resize", onWindowResize);
      }

      function render() {
        if (word1 && word2) {
          if (introProgress !== targetProgress) {
            const speed = 0.015;
            introProgress += introProgress < targetProgress ? speed : -speed;
            if (Math.abs(introProgress - targetProgress) < speed) {
              introProgress = targetProgress;
            }
          }

          if (introProgress > 0 && introProgress < 1) {
            const p1 = Math.max(0, Math.min(1, introProgress / 0.6));
            const p2 = Math.max(0, Math.min(1, (introProgress - 0.3) / 0.6));
            const easeBack = (t) => {
              const c1 = 1.70158;
              const c3 = c1 + 1;
              return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
            };

            const ease1 = easeBack(p1);
            const ease2 = easeBack(p2);

            if (p1 > 0) {
              const s1 = Math.max(0.001, ease1);
              word1.scale.set(s1, s1, s1);
              word1.position.x = word1.userData.targetX - (1 - ease1) * 300;
              word1.position.z = word1.userData.targetZ - (1 - ease1) * 600;
              word1.rotation.y = (1 - ease1) * Math.PI * 2;
            } else {
              word1.scale.set(0, 0, 0);
            }

            if (p2 > 0) {
              const s2 = Math.max(0.001, ease2);
              word2.scale.set(s2, s2, s2);
              word2.position.x = word2.userData.targetX + (1 - ease2) * 300;
              word2.position.z = word2.userData.targetZ - (1 - ease2) * 600;
              word2.rotation.y = -(1 - ease2) * Math.PI * 2;
            } else {
              word2.scale.set(0, 0, 0);
            }

            group.rotation.y = Math.sin(Date.now() * 0.0005) * 0.6;
          } else if (introProgress === 1) {
            word1.scale.set(1, 1, 1);
            word1.position.set(word1.userData.targetX, 0, 0);
            word1.rotation.set(0, 0, 0);

            word2.scale.set(1, 1, 1);
            word2.position.set(word2.userData.targetX, 0, 0);
            word2.rotation.set(0, 0, 0);
            group.rotation.y = Math.sin(Date.now() * 0.0005) * 0.6;
          } else {
            word1.scale.set(0, 0, 0);
            word2.scale.set(0, 0, 0);
            group.rotation.y = Math.sin(Date.now() * 0.0005) * 0.6;
          }
        }

        if (streakLight1 && streakLight2 && streakMesh1 && streakMesh2) {
          const streaksVisible = !isModalOpen;
          streakMesh1.visible = streaksVisible;
          streakMesh2.visible = streaksVisible;

          streakLight1.intensity = streaksVisible ? 4 * introProgress : 0;
          streakLight2.intensity = streaksVisible ? 4 * introProgress : 0;

          if (streaksVisible && introProgress > 0) {
            const time = Date.now() * 0.0012;
            streakLight1.position.set(Math.sin(time) * 380, 15, 35);
            streakLight2.position.set(Math.sin(time * 0.7 + Math.PI) * 380, -10, 40);
          }
        }

        if (particles) {
          particles.rotation.y += 0.0003;
          const positions = particles.geometry.attributes.position.array;
          for (let i = 1; i < positions.length; i += 3) {
            positions[i] += 0.4;
            if (positions[i] > 1000) {
              positions[i] = -1000;
            }
          }
          particles.geometry.attributes.position.needsUpdate = true;
        }

        renderer.render(scene, camera);
      }

      const animate = () => {
        animationFrame = requestAnimationFrame(animate);
        render();
      };

      init();
      animate();

      window.__okadaCleanup = () => {
        window.removeEventListener("resize", onWindowResize);
      };
    };

    bootstrap().catch(() => {
      loadingEl.innerText = "Failed to load 3D Engine";
    });

    return () => {
      isDisposed = true;
      if (modalTransitionInterval) {
        clearInterval(modalTransitionInterval);
      }
      playPauseBtn?.removeEventListener("click", togglePlayState);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      if (window.__okadaCleanup) {
        window.__okadaCleanup();
        delete window.__okadaCleanup;
      }
      if (renderer?.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      if (scene) {
        scene.environment = null;
      }
      chromeEnvTarget?.dispose?.();
      renderer?.dispose();
    };
  }, []);

  return (
    <>
      <Head>
        <title>Okada Air</title>
        <link rel="icon" href="/favicon.svg" />
      </Head>

      <main className="home-page">
        <div id="loading">Loading 3D Engine...</div>

        {/*
        <div className="y2k-btn-container">
          <button id="playPauseBtn" className="y2k-btn" type="button">
            ▶
          </button>
        </div>
        */}

        <div className="info-modal" id="infoModal">
          <div className="modal-content">
            <div className="modal-body">
              <p className="route-intro" style={{ marginBottom: 0 }}>
                A transit system for the reconstructed Walls of Benin.
              </p>
            </div>
          </div>
        </div>

        <div className="credits-text">Conceptualized by Minne Atairu</div>

        <div id="canvas-container" />
      </main>
    </>
  );
}
