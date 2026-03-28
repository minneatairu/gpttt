import { useEffect, useState } from "react";
import Head from "next/head";

const INFO_SLIDES = ["/okada.jpg", "/okada2.jpeg"];

export default function Home() {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isInfoModalMounted, setIsInfoModalMounted] = useState(false);
  const [activeInfoSlide, setActiveInfoSlide] = useState(0);

  const openInfoModal = () => {
    setIsInfoModalMounted(true);
    setIsInfoModalOpen(true);
  };

  const closeInfoModal = () => {
    setIsInfoModalOpen(false);
  };

  useEffect(() => {
    if (isInfoModalOpen) {
      return undefined;
    }

    const teardownTimer = window.setTimeout(() => {
      setIsInfoModalMounted(false);
    }, 320);

    return () => {
      window.clearTimeout(teardownTimer);
    };
  }, [isInfoModalOpen]);

  useEffect(() => {
    if (!isInfoModalOpen) {
      setActiveInfoSlide(0);
      return undefined;
    }

    const slideshowInterval = window.setInterval(() => {
      setActiveInfoSlide((currentSlide) => (currentSlide + 1) % INFO_SLIDES.length);
    }, 3500);

    return () => {
      window.clearInterval(slideshowInterval);
    };
  }, [isInfoModalOpen]);

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
    let introProgress = 0;
    const targetProgress = 1;
    let animationFrame;
    let isDisposed = false;

    const loadingEl = document.getElementById("loading");
    const container = document.getElementById("canvas-container");

    if (!container || !loadingEl) {
      return undefined;
    }

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

      function build3DText(font) {
        loadingEl.style.display = "none";

        const italicSkewMatrix = new THREE.Matrix4().set(
          1,
          0.22,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1
        );

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

        const material = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          metalness: 0.85,
          roughness: 0.15,
          clearcoat: 1,
          clearcoatRoughness: 0.1,
          emissive: 0x111122,
        });

        const lineMat = new THREE.LineBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.4,
          blending: THREE.AdditiveBlending,
        });

        const geo1 = new TextGeometry("Okada", textOptions);
        geo1.applyMatrix4(italicSkewMatrix);
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
        geo2.applyMatrix4(italicSkewMatrix);
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

        const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
        dirLight.position.set(50, 100, 150);
        scene.add(dirLight);

        const cyanLight = new THREE.PointLight(0x00ffff, 3, 600);
        cyanLight.position.set(-100, 50, 80);
        scene.add(cyanLight);

        const coolBlueLight = new THREE.PointLight(0x0055ff, 3, 600);
        coolBlueLight.position.set(100, -50, 80);
        scene.add(coolBlueLight);

        const blueLight = new THREE.PointLight(0x0088ff, 2, 600);
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
          } else {
            word1.scale.set(1, 1, 1);
            word1.position.set(word1.userData.targetX, 0, 0);
            word1.rotation.set(0, 0, 0);

            word2.scale.set(1, 1, 1);
            word2.position.set(word2.userData.targetX, 0, 0);
            word2.rotation.set(0, 0, 0);
            group.rotation.y = Math.sin(Date.now() * 0.0005) * 0.6;
          }
        }

        if (streakLight1 && streakLight2 && streakMesh1 && streakMesh2) {
          streakMesh1.visible = introProgress > 0;
          streakMesh2.visible = introProgress > 0;

          streakLight1.intensity = 4 * introProgress;
          streakLight2.intensity = 4 * introProgress;

          if (introProgress > 0) {
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
        <a
          className="project-credit"
          href="https://minneatairu.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          A project by Minne Atairu (2026)
        </a>

        <div id="loading">Loading 3D Engine...</div>
        <div id="canvas-container" />

        <button
          type="button"
          className="info-button"
          aria-label="Open info image"
          onClick={openInfoModal}
        >
          ?
        </button>

        {isInfoModalMounted ? (
          <div
            className={`info-modal-overlay ${isInfoModalOpen ? "is-open" : "is-closing"}`}
            role="button"
            tabIndex={0}
            onClick={closeInfoModal}
            onKeyDown={(event) => {
              if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
                closeInfoModal();
              }
            }}
          >
            <div
              className={`info-modal-content ${isInfoModalOpen ? "is-open" : "is-closing"}`}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="info-modal-close"
                aria-label="Close image modal"
                onClick={closeInfoModal}
              >
                x
              </button>

              <div className="info-modal-layout">
                <section className="info-modal-copy">
                  <article className="terminology-card" aria-label="Okada terminology info">
                    <header className="terminology-card-header">
                      <h2>Okada</h2>
            
                    </header>

            


                    <p className="terminology-card-definition">
                      A commercial motorcycle taxi used to transport passengers, particularly favored for
                      its ability to navigate through heavy urban traffic and reach areas inaccessible to
                      cars.
                    </p>

                
                    <section className="terminology-card-origin">
                      <h2>Word Origin</h2>
                      <p>
                        <strong>Late 20th century:</strong> Named after Okada Air, a
                        now-defunct Nigerian domestic airline founded in the 1980s. Because these
                        motorcycle taxis could bypass Lagos traffic jams and get passengers to their
                        destinations with airplane-like speed, locals began humorously comparing them to
                        the airline.
                      </p>
                    </section>
                  </article>
                </section>

                <section className="info-modal-media">
                  {INFO_SLIDES.map((slideSrc, slideIndex) => (
                    <img
                      key={slideSrc}
                      src={slideSrc}
                      alt="Okada"
                      className={`info-modal-image ${slideIndex === activeInfoSlide ? "is-visible" : ""}`}
                    />
                  ))}
                </section>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </>
  );
}
