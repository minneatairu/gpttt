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
    let word1;
    let word2;
    let introProgress = 0;
    let targetProgress = 1;
    let modalTransitionInterval;
    let animationFrame;
    let isDisposed = false;

    const loadingEl = document.getElementById("loading");
    const container = document.getElementById("canvas-container");
    const modal = document.getElementById("infoModal");
    const playPauseBtn = document.getElementById("playPauseBtn");

    if (!container || !loadingEl || !modal || !playPauseBtn) {
      return undefined;
    }

    function togglePlayState() {
      const isShowing = modal.classList.contains("active");

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

    playPauseBtn.addEventListener("click", togglePlayState);

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
        streakLight1.add(
          new THREE.Mesh(
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
          )
        );
        group.add(streakLight1);

        streakLight2 = new THREE.PointLight(0x0055ff, 4, 300);
        const streakMesh2 = new THREE.Mesh(
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

        if (streakLight1 && streakLight2) {
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
      if (modalTransitionInterval) {
        clearInterval(modalTransitionInterval);
      }
      playPauseBtn.removeEventListener("click", togglePlayState);
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
        <title>Okada Air - Futuristic Transit</title>
      </Head>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=MuseoModerno:ital,wght@0,100..900;1,100..900&family=Share+Tech+Mono&display=swap");
      `}</style>

      <main className="home-page">
        <div id="loading">Loading 3D Engine...</div>

        <div className="y2k-btn-container">
          <button id="playPauseBtn" className="y2k-btn" type="button">
            ▶
          </button>
        </div>

        <div className="info-modal" id="infoModal">
          <div className="modal-content">
            <div className="modal-body">
              <p className="route-intro" style={{ marginBottom: 0 }}>
                A transit system for the reconstructed Walls of Benin.
              </p>
            </div>
          </div>
          <div className="credits-text">Conceptualized by Minne Atairu</div>
        </div>

        <div className="main-credits-text">Conceptualized by Minne Atairu</div>

        <div id="canvas-container" />
      </main>

      <style jsx>{`
        .home-page {
          margin: 0;
          overflow: hidden;
          background-color: #000511;
          align-items: center;
          height: 100vh;
          color: white;
          position: relative;
        }

        #canvas-container {
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          z-index: 1;
        }

        #loading {
          position: absolute;
          z-index: 2;
          font-size: 1.2rem;
          letter-spacing: 2px;
          color: #00ffff;
          text-transform: uppercase;
          animation: pulse 1.5s infinite;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        @keyframes pulse {
          0% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.5;
          }
        }

        .y2k-btn-container {
          position: absolute;
          bottom: 40px;
          right: 50px;
          z-index: 20;
          display: flex;
        }

        .y2k-btn {
          position: relative;
          background: radial-gradient(circle at 50% 10%, rgba(0, 255, 255, 0.3), rgba(0, 34, 102, 0.8));
          border: 1px solid rgba(0, 255, 255, 0.6);
          border-radius: 50%;
          width: 55px;
          height: 55px;
          display: flex;
          justify-content: center;
          align-items: center;
          color: #0ff;
          font-family: "MuseoModerno", sans-serif;
          font-weight: 700;
          font-size: 18px;
          letter-spacing: 0;
          cursor: pointer;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.4),
            inset 0 -5px 15px rgba(0, 255, 255, 0.2);
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
          outline: none;
        }

        .y2k-btn::before {
          content: "";
          position: absolute;
          top: 2px;
          left: 10%;
          width: 80%;
          height: 40%;
          background: linear-gradient(to bottom, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0));
          border-radius: 50%;
          pointer-events: none;
        }

        .y2k-btn:hover {
          transform: scale(1.05);
          color: #fff;
          border-color: #0ff;
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.4),
            inset 0 2px 6px rgba(255, 255, 255, 0.6),
            inset 0 -5px 20px rgba(0, 255, 255, 0.5);
        }

        .y2k-btn:active {
          transform: scale(0.95);
          box-shadow: inset 0 3px 8px rgba(0, 0, 0, 0.5),
            inset 0 -2px 10px rgba(0, 255, 255, 0.2);
        }

        .info-modal {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: transparent;
          z-index: 30;
          display: none;
          justify-content: center;
          align-items: center;
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .info-modal.active {
          display: flex;
          opacity: 1;
        }

        .info-modal.active .modal-content {
          transform: translateY(0) scale(1);
        }

        .modal-content {
          background: transparent;
          border: none;
          padding: 40px;
          max-width: 1200px;
          width: 90%;
          color: #b3cce6;
          font-family: "MuseoModerno", sans-serif;
          font-weight: 300;
          text-align: center;
          box-shadow: none;
          position: relative;
          transform: translateY(20px) scale(0.95);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .route-intro {
          font-size: clamp(32px, 5vw, 65px);
          color: #e0f7fa;
          line-height: 1.3;
          letter-spacing: 1px;
          text-shadow: 0 5px 15px rgba(0, 0, 0, 0.9),
            0 0 20px rgba(0, 255, 255, 0.5);
        }

        .credits-text {
          position: absolute;
          bottom: 40px;
          left: 0;
          width: 100%;
          text-align: center;
          color: #00ffff;
          font-size: 12px;
          font-weight: 300;
          letter-spacing: 2px;
          opacity: 0.8;
          pointer-events: none;
          font-family: "MuseoModerno", sans-serif;
        }

        .main-credits-text {
          position: absolute;
          bottom: 12px;
          left: 0;
          width: 100%;
          text-align: center;
          color: #00ffff;
          font-size: 10px;
          font-weight: 300;
          letter-spacing: 1.5px;
          opacity: 0.75;
          pointer-events: none;
          font-family: "MuseoModerno", sans-serif;
          z-index: 20;
        }
      `}</style>
    </>
  );
}
