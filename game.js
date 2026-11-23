(() => {
  "use strict";
  if (!window.Matter || !window.Art) {
    document.getElementById("load-error").hidden = false;
    return;
  }
  const { Engine, Bodies, Body, Composite, Events, Sleeping } = Matter;
  const $ = (id) => document.getElementById(id);
  const W = 1440,
    H = 900,
    FLOOR = 742,
    ANCHOR = { x: 280, y: 600 };
  const PHYSICS = Object.freeze({
    step: 1000 / 120,
    maxPull: 108,
    launchScale: 0.195,
    gravity: 1,
    birdBonus: 1500,
    maxParticles: 180,
  });
  const TYPES = {
    red: {
      name: "椒椒",
      ability: "加速冲刺",
      tip: "椒椒就位！飞行中点击，加速冲刺。",
    },
    yellow: {
      name: "啾啾",
      ability: "三重分身",
      tip: "啾啾就位！飞行中点击，一只变三只。",
    },
    black: {
      name: "煤球",
      ability: "快乐爆破",
      tip: "煤球就位！点击引爆，撞到也会炸。",
    },
  };
  const LEVELS = [
    {
      title: "猪猪茅草屋",
      chapter: "第一站 · 青草试验场",
      birds: ["red", "red", "red", "red"],
      thresholds: [8500, 11500],
      hint: "先给左边的木柱一点小小的震撼。",
      build(g) {
        g.block(910, 683, 22, 118);
        g.block(1040, 683, 22, 118);
        g.block(975, 613, 184, 22);
        g.pig(969, 715);
        g.block(933, 563, 20, 78);
        g.block(1017, 563, 20, 78);
        g.block(975, 514, 128, 20);
        g.pig(975, 575);
        g.block(1155, 694, 20, 96);
        g.block(1220, 694, 20, 96);
        g.block(1187, 637, 109, 18);
        g.pig(1186, 715);
        g.rock(1266, 716, 26);
        g.spring(782, 725);
      },
    },
    {
      title: "摇摇晃晃塔",
      chapter: "第二站 · 玻璃工坊",
      birds: ["yellow", "red", "black", "yellow"],
      thresholds: [11000, 16000],
      hint: "玻璃很脆，炸药很乖——不碰它的时候。",
      build(g) {
        g.block(890, 673, 22, 138, "glass");
        g.block(1002, 673, 22, 138, "glass");
        g.block(946, 594, 165, 20);
        g.pig(949, 715);
        g.tnt(1041, 719);
        g.block(916, 540, 20, 88, "glass");
        g.block(978, 540, 20, 88, "glass");
        g.block(947, 486, 108, 20);
        g.pig(947, 557);
        g.block(1120, 682, 24, 120);
        g.block(1254, 682, 24, 120);
        g.block(1187, 612, 181, 20, "stone");
        g.pig(1190, 715);
        g.tnt(1189, 579);
        g.block(1147, 535, 20, 134, "glass");
        g.block(1231, 535, 20, 134, "glass");
        g.block(1189, 458, 130, 20);
        g.pig(1189, 421);
        g.rock(1291, 717, 25);
        g.spring(791, 725);
      },
    },
    {
      title: "猪王堡垒",
      chapter: "最后一站 · 锅盖王的城堡",
      birds: ["black", "yellow", "red", "black", "red"],
      thresholds: [15500, 22000],
      hint: "锅盖也挡不住快乐。试试让炸药连成一线！",
      build(g) {
        g.block(887, 679, 26, 126);
        g.block(1020, 679, 26, 126);
        g.block(954, 605, 190, 22, "stone");
        g.pig(931, 715);
        g.tnt(981, 719);
        g.block(913, 549, 22, 90, "glass");
        g.block(995, 549, 22, 90, "glass");
        g.block(954, 493, 132, 22);
        g.pig(950, 568);
        g.block(1091, 674, 28, 136, "stone");
        g.block(1265, 674, 28, 136, "stone");
        g.block(1178, 594, 220, 24, "stone");
        g.pig(1222, 715);
        g.tnt(1118, 719);
        g.tnt(1170, 719);
        g.block(1114, 534, 23, 96);
        g.block(1242, 534, 23, 96);
        g.block(1178, 475, 176, 22);
        g.pig(1154, 556);
        g.tnt(1206, 560);
        g.block(1145, 421, 22, 86, "glass");
        g.block(1210, 421, 22, 86, "glass");
        g.block(1178, 367, 120, 22);
        g.pig(1178, 325, true);
        g.rock(1303, 715, 27);
        g.spring(776, 725);
      },
    },
  ];
  function loadSave() {
    const empty = {
      levels: Array.from({ length: 3 }, () => ({ score: 0, stars: 0 })),
      muted: false,
    };
    try {
      const s = JSON.parse(localStorage.getItem("little-bird-club-v1"));
      if (!s) return empty;
      return {
        muted: !!s.muted,
        levels: empty.levels.map((v, i) => ({
          score: Math.max(0, Number(s.levels?.[i]?.score) || 0),
          stars: Math.max(0, Math.min(3, Number(s.levels?.[i]?.stars) || 0)),
        })),
      };
    } catch {
      return empty;
    }
  }
  class SlingshotGame {
    constructor() {
      this.canvas = $("world");
      this.ctx = this.canvas.getContext("2d");
      this.mode = "home";
      this.phase = "aim";
      this.levelIndex = 0;
      this.save = loadSave();
      this.journey = [];
      this.seenTips = new Set();
      this.audio = window.GameAudio
        ? new GameAudio()
        : { unlock() {}, play() {}, setMuted() {}, suspend() {}, resume() {} };
      this.audio.setMuted(this.save.muted);
      this.engine = Engine.create({
        enableSleeping: true,
        positionIterations: 9,
        velocityIterations: 8,
      });
      this.engine.gravity.y = PHYSICS.gravity;
      this.entities = [];
      this.particles = [];
      this.rings = [];
      this.floaters = [];
      this.timers = [];
      this.time = 0;
      this.visualTime = 0;
      this.score = 0;
      this.spent = 0;
      this.currentBird = null;
      this.drag = null;
      this.accumulator = 0;
      this.shake = 0;
      this.slowRemaining = 0;
      this.reducedMotion = matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      this.lastFrame = performance.now();
      this.lastHit = -10;
      this.combo = 0;
      this.shotKills = 0;
      this.resultAnimation = null;
      this.damageEnabled = false;
      this.storageWarned = false;
      Events.on(this.engine, "collisionStart", (e) => this.collisions(e));
      this.bind();
      this.resize();
      this.updateSoundButtons();
      this.drawPortraits();
      requestAnimationFrame((t) => this.frame(t));
    }
    bind() {
      $("start-button").addEventListener("click", () => {
        this.audio.unlock();
        this.journey = [];
        this.startLevel(0);
      });
      document
        .querySelector(".brand")
        .addEventListener("click", (e) => e.preventDefault());
      $("help-button").addEventListener("click", () => {
        this.audio.unlock();
        this.audio.play("click");
        this.showModal("help-panel");
      });
      document.querySelectorAll(".close-dialog").forEach((b) =>
        b.addEventListener("click", () => {
          this.audio.play("click");
          this.hideModal();
        }),
      );
      document.querySelectorAll(".sound-button").forEach((b) =>
        b.addEventListener("click", () => {
          this.save.muted = !this.save.muted;
          this.audio.setMuted(this.save.muted);
          this.audio.unlock();
          this.persist();
          this.updateSoundButtons();
          this.toast(
            this.save.muted
              ? "声音已关闭，快乐照常。"
              : "声音已开启，快乐加点料。",
          );
        }),
      );
      $("pause-button").addEventListener("click", () => this.pause());
      $("resume-button").addEventListener("click", () => this.resume());
      for (const id of ["restart-button", "pause-restart", "result-retry"])
        $(id).addEventListener("click", () => {
          this.audio.unlock();
          this.audio.resume();
          this.startLevel(this.levelIndex);
        });
      document
        .querySelectorAll(".home-button")
        .forEach((b) => b.addEventListener("click", () => this.goHome()));
      $("next-button").addEventListener("click", () => {
        this.audio.unlock();
        if (!this.won) this.startLevel(this.levelIndex);
        else if (this.levelIndex < 2) this.startLevel(this.levelIndex + 1);
        else {
          this.journey = [];
          this.startLevel(0);
        }
      });
      $("ability-button").addEventListener("click", () => this.ability());
      this.canvas.addEventListener("pointerdown", (e) => this.pointerDown(e));
      this.canvas.addEventListener("pointermove", (e) => this.pointerMove(e));
      this.canvas.addEventListener("pointerup", (e) => this.pointerUp(e));
      this.canvas.addEventListener("pointercancel", () => this.cancelDrag());
      this.canvas.addEventListener("lostpointercapture", () => {
        if (this.drag) this.cancelDrag();
      });
      window.addEventListener("resize", () => this.resize());
      window.addEventListener("blur", () => {
        if (this.mode === "playing") this.pause(true);
        this.audio.suspend();
      });
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          if (this.mode === "playing") this.pause(true);
          this.audio.suspend();
        } else if (this.mode !== "paused") this.audio.resume();
      });
      window.addEventListener("keydown", (e) => {
        if (!e.repeat && (e.code === "KeyP" || e.code === "Escape")) {
          if (!$("help-panel").hidden) {
            this.hideModal();
            return;
          }
          if (this.mode === "playing") this.pause();
          else if (this.mode === "paused") this.resume();
        }
        if (
          e.code === "Space" &&
          this.mode === "playing" &&
          !["BUTTON", "A"].includes(document.activeElement.tagName)
        ) {
          e.preventDefault();
          if (!e.repeat) this.ability();
        }
        if (e.code === "KeyR" && this.mode === "playing" && !e.repeat)
          this.startLevel(this.levelIndex);
        if (e.code === "Tab" && !$("modal-layer").hidden) {
          const panel = $("modal-layer").querySelector(".panel:not([hidden])");
          const items = [...panel.querySelectorAll("button:not([disabled])")];
          const first = items[0],
            last = items.at(-1);
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      });
      document
        .querySelectorAll("button")
        .forEach((b) =>
          b.addEventListener("pointerdown", () => this.audio.unlock()),
        );
    }
    resize() {
      const width = window.innerWidth,
        height = window.innerHeight,
        dpr = Math.min(devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(width * dpr);
      this.canvas.height = Math.round(height * dpr);
      this.view = {
        width,
        height,
        dpr,
        scale: Math.min(width / W, height / H),
        x: 0,
        y: 0,
      };
      this.view.x = (width - W * this.view.scale) / 2;
      this.view.y = (height - H * this.view.scale) / 2;
      this.cancelDrag();
      this.positionTip();
      if (width < height && width <= 800 && this.mode === "playing")
        this.pause(true);
    }
    positionTip() {
      if (!this.view) return;
      const v = this.view;
      $("ability-tip").style.left =
        Math.max(14, v.x + (ANCHOR.x - 95) * v.scale) + "px";
      $("ability-tip").style.top =
        Math.max(90, v.y + (ANCHOR.y - 150) * v.scale) + "px";
    }
    worldPoint(e) {
      return {
        x: (e.clientX - this.view.x) / this.view.scale,
        y: (e.clientY - this.view.y) / this.view.scale,
      };
    }
    pointerDown(e) {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      if (this.mode !== "playing" || this.drag) return;
      this.audio.unlock();
      if (this.phase === "flight") {
        this.ability();
        return;
      }
      if (this.phase !== "aim" || !this.currentBird) return;
      const p = this.worldPoint(e);
      if (
        Math.hypot(p.x - ANCHOR.x, p.y - ANCHOR.y) >
        Math.max(60, 32 / this.view.scale)
      ) {
        this.toast("按住弹弓上的小鸟，向后拉一拉。");
        return;
      }
      e.preventDefault();
      this.drag = { id: e.pointerId, x: ANCHOR.x, y: ANCHOR.y };
      this.canvas.setPointerCapture(e.pointerId);
      this.canvas.classList.add("aiming");
      $("ability-tip").hidden = true;
      this.pointerMove(e);
    }
    pointerMove(e) {
      if (!this.drag || this.drag.id !== e.pointerId || this.mode !== "playing")
        return;
      e.preventDefault();
      const p = this.worldPoint(e);
      let dx = p.x - ANCHOR.x,
        dy = p.y - ANCHOR.y;
      dx = Math.min(dx, 22);
      const d = Math.hypot(dx, dy);
      if (d > PHYSICS.maxPull) {
        dx *= PHYSICS.maxPull / d;
        dy *= PHYSICS.maxPull / d;
      }
      this.drag.x = ANCHOR.x + dx;
      this.drag.y = ANCHOR.y + dy;
      Body.setPosition(this.currentBird, { x: this.drag.x, y: this.drag.y });
      if (this.time - (this.lastStretch || -10) > 0.13 && d > 16) {
        this.audio.play("stretch", Math.min(d / 108, 1));
        this.lastStretch = this.time;
      }
    }
    pointerUp(e) {
      if (!this.drag || this.drag.id !== e.pointerId) return;
      e.preventDefault();
      const p = { x: this.drag.x, y: this.drag.y };
      this.drag = null;
      this.canvas.classList.remove("aiming");
      if (this.canvas.hasPointerCapture(e.pointerId))
        this.canvas.releasePointerCapture(e.pointerId);
      const dx = ANCHOR.x - p.x,
        dy = ANCHOR.y - p.y;
      if (Math.hypot(dx, dy) < 12 || dx < 5) {
        this.cancelDrag();
        Body.setPosition(this.currentBird, ANCHOR);
        return;
      }
      this.launch(dx * PHYSICS.launchScale, dy * PHYSICS.launchScale);
    }
    cancelDrag() {
      if (this.drag) {
        const id = this.drag.id;
        this.drag = null;
        this.canvas.classList.remove("aiming");
        if (this.canvas.hasPointerCapture(id))
          this.canvas.releasePointerCapture(id);
      }
      if (this.currentBird && this.phase === "aim")
        Body.setPosition(this.currentBird, ANCHOR);
    }
    startLevel(index) {
      this.hideModal();
      this.audio.resume();
      this.audio.play("click");
      this.levelIndex = index;
      this.level = LEVELS[index];
      this.mode = "playing";
      this.phase = "aim";
      this.won = false;
      this.time = 0;
      this.score = 0;
      this.spent = 0;
      this.currentBird = null;
      this.drag = null;
      this.timers = [];
      this.particles = [];
      this.rings = [];
      this.floaters = [];
      this.entities = [];
      this.combo = 0;
      this.lastHit = -10;
      this.shotKills = 0;
      this.shake = 0;
      this.slowRemaining = 0;
      this.accumulator = 0;
      this.resultAnimation = null;
      this.damageEnabled = false;
      this.flightTime = 0;
      Composite.clear(this.engine.world, false);
      Engine.clear(this.engine);
      this.engine.timing.timestamp = 0;
      Composite.add(
        this.engine.world,
        Bodies.rectangle(720, FLOOR + 50, 3600, 100, {
          isStatic: true,
          friction: 0.88,
          restitution: 0.02,
          label: "ground",
        }),
      );
      this.level.build(this);
      for (let i = 0; i < 100; i++) Engine.update(this.engine, PHYSICS.step);
      this.entities.forEach((b) => {
        b.game.birth = this.time;
        if (b.game.kind !== "spring") Sleeping.set(b, true);
      });
      this.damageEnabled = true;
      $("app").dataset.screen = "play";
      $("game-ui").hidden = false;
      $("level-number").textContent = String(index + 1).padStart(2, "0");
      $("level-title").textContent = this.level.title;
      $("level-chapter").textContent = this.level.chapter;
      $("level-intro").textContent =
        this.level.title + " · " + (index + 1) + "/3";
      $("level-intro").classList.add("visible");
      this.schedule(2.6, () => $("level-intro").classList.remove("visible"));
      this.spawnBird();
      this.updateHud();
      this.toast(this.level.hint, 3.5);
      this.canvas.focus({ preventScroll: true });
    }
    add(body, data) {
      body.game = { ...data, dead: false, lastDamage: -10, birth: this.time };
      this.entities.push(body);
      Composite.add(this.engine.world, body);
      return body;
    }
    block(x, y, w, h, material = "wood") {
      const hp = { wood: 25, glass: 13, stone: 80 }[material];
      return this.add(
        Bodies.rectangle(x, y, w, h, {
          density: material === "stone" ? 0.0032 : 0.0018,
          friction: 0.7,
          frictionStatic: 1,
          restitution: 0.025,
          frictionAir: 0.006,
          chamfer: { radius: 2 },
          sleepThreshold: 65,
        }),
        { kind: "block", material, w, h, hp, maxHp: hp },
      );
    }
    pig(x, y, king = false) {
      const r = king ? 31 : 26,
        hp = king ? 66 : 25;
      return this.add(
        Bodies.circle(x, y, r, {
          density: 0.0025,
          friction: 0.8,
          frictionAir: 0.02,
          restitution: 0.04,
          sleepThreshold: 65,
        }),
        { kind: "pig", r, king, hp, maxHp: hp, hurtUntil: 0 },
      );
    }
    tnt(x, y) {
      return this.add(
        Bodies.rectangle(x, y, 44, 44, {
          density: 0.0023,
          friction: 0.75,
          restitution: 0.01,
          chamfer: { radius: 3 },
          sleepThreshold: 65,
        }),
        { kind: "tnt", w: 44, h: 44, hp: 12, maxHp: 12, armed: false },
      );
    }
    rock(x, y, r) {
      return this.add(
        Bodies.circle(x, y, r, {
          density: 0.006,
          friction: 0.65,
          restitution: 0.02,
          frictionAir: 0.009,
          sleepThreshold: 65,
        }),
        { kind: "rock", r, hp: 1000, maxHp: 1000 },
      );
    }
    spring(x, y) {
      return this.add(
        Bodies.rectangle(x, y, 76, 14, { isStatic: true, restitution: 0.7 }),
        { kind: "spring", w: 76, h: 14, hitAt: -10 },
      );
    }
    makeBird(x, y, type, staticBird = false, r = 25) {
      const body = Bodies.circle(x, y, r, {
        density: 0.008,
        friction: 0.65,
        frictionAir: 0.0025,
        restitution: 0.22,
        sleepThreshold: 75,
      });
      if (staticBird) Body.setStatic(body, true);
      return this.add(body, {
        kind: "bird",
        type,
        r,
        hp: 1000,
        maxHp: 1000,
        abilityUsed: false,
        launched: !staticBird,
        hit: false,
        trail: [],
        fading: false,
      });
    }
    spawnBird() {
      if (this.spent >= this.level.birds.length) {
        this.currentBird = null;
        this.phase = "waiting";
        this.waitingTime = 0;
        this.updateHud();
        return;
      }
      this.currentBird = this.makeBird(
        ANCHOR.x,
        ANCHOR.y,
        this.level.birds[this.spent],
        true,
      );
      this.phase = "aim";
      this.activeIndex = this.spent;
      this.flightTime = 0;
      const type = this.currentBird.game.type;
      if (!this.seenTips.has(type)) {
        this.seenTips.add(type);
        $("ability-tip").querySelector("span").textContent = TYPES[type].tip;
        $("ability-tip").hidden = false;
        this.schedule(7, () => ($("ability-tip").hidden = true));
      } else $("ability-tip").hidden = true;
      $("ability-name").textContent = TYPES[type].ability;
      this.positionTip();
      this.updateHud();
    }
    launch(vx, vy) {
      const b = this.currentBird;
      Body.setStatic(b, false);
      Body.setDensity(b, 0.008);
      Sleeping.set(b, false);
      Body.setVelocity(b, { x: vx, y: vy });
      Body.setAngularVelocity(b, 0.018);
      b.game.launched = true;
      this.phase = "flight";
      this.flightTime = 0;
      this.spent++;
      this.shotKills = 0;
      this.audio.play("launch");
      $("ability-tip").hidden = true;
      this.updateHud();
    }
    ability() {
      const b = this.currentBird;
      if (
        this.mode !== "playing" ||
        this.phase !== "flight" ||
        !b ||
        b.game.dead ||
        b.game.abilityUsed
      )
        return;
      b.game.abilityUsed = true;
      this.audio.play("ability");
      const p = b.position,
        v = b.velocity;
      if (b.game.type === "red") {
        const speed = Math.hypot(v.x, v.y);
        const direction =
          speed > 1 ? { x: v.x / speed, y: v.y / speed } : { x: 1, y: 0 };
        Sleeping.set(b, false);
        Body.setVelocity(b, { x: direction.x * 29, y: direction.y * 29 });
        this.burst(p.x, p.y, "#f8b868", 16);
        this.floatText("椒椒加速！", p.x, p.y - 60, "#c87843", 17);
      } else if (b.game.type === "yellow") {
        for (const sign of [-1, 1]) {
          const extra = this.makeBird(
            p.x - 8,
            p.y + sign * 32,
            "yellow",
            false,
            18,
          );
          extra.game.abilityUsed = true;
          extra.game.clone = true;
          extra.collisionFilter.group = -2;
          b.collisionFilter.group = -2;
          Body.setVelocity(extra, { x: v.x * 1.04, y: v.y + sign * 4.4 });
          Body.setAngularVelocity(extra, sign * 0.04);
        }
        Body.setVelocity(b, { x: v.x * 1.07, y: v.y });
        this.burst(p.x, p.y, "#ffda68", 15);
        this.floatText("快乐 × 3", p.x, p.y - 55, "#b49138", 18);
      } else this.explode(p.x, p.y, 173, b);
      this.updateHud();
    }
    collisions(event) {
      if (!this.damageEnabled || !["playing"].includes(this.mode)) return;
      for (const pair of event.pairs) {
        const a = pair.bodyA,
          b = pair.bodyB;
        const ga = a.game,
          gb = b.game;
        if (ga?.dead || gb?.dead) continue;
        const av = Body.getVelocity(a),
          bv = Body.getVelocity(b);
        const vx = av.x - bv.x,
          vy = av.y - bv.y,
          speed = Math.hypot(vx, vy);
        for (const [self, other] of [
          [a, b],
          [b, a],
        ]) {
          const d = self.game,
            o = other.game;
          if (!d || d.dead) continue;
          if (
            d.kind === "spring" &&
            o &&
            other.position.y < self.position.y &&
            this.time - d.hitAt > 0.35 &&
            !other.isStatic
          ) {
            d.hitAt = this.time;
            this.schedule(0.01, () => {
              if (o.dead) return;
              Sleeping.set(other, false);
              Body.setVelocity(other, {
                x: Math.max(8, other.velocity.x + 3),
                y: -14,
              });
              this.audio.play("spring");
              this.floatText(
                "弹一下！",
                self.position.x,
                self.position.y - 45,
                "#80974f",
                16,
              );
            });
            continue;
          }
          if (d.kind === "bird" && d.launched) {
            d.hit = true;
            if (
              d.type === "black" &&
              !d.abilityUsed &&
              !d.armed &&
              speed > 1.8
            ) {
              d.armed = true;
              this.schedule(0.14, () => {
                if (!d.dead) {
                  d.abilityUsed = true;
                  this.explode(self.position.x, self.position.y, 173, self);
                  this.updateHud();
                }
              });
            }
            continue;
          }
          if (
            ["spring", "rock"].includes(d.kind) ||
            speed < 2.1 ||
            this.time - d.lastDamage < 0.11
          )
            continue;
          const normalSpeed = Math.abs(
            vx * pair.collision.normal.x + vy * pair.collision.normal.y,
          );
          if (normalSpeed < 1.6) continue;
          const factor =
            o?.kind === "bird"
              ? 1.65
              : other.isStatic
                ? 1
                : Math.min(1.3, Math.max(0.45, other.mass / (self.mass || 1)));
          const damage = (normalSpeed - 1.1) * 5.4 * factor;
          this.damage(self, damage);
        }
        if (speed > 2.8 && (ga?.kind === "bird" || gb?.kind === "bird")) {
          this.audio.play("impact", Math.min(speed / 12, 1));
          this.shake = Math.max(this.shake, Math.min(4, speed / 5));
        }
      }
    }
    damage(body, amount) {
      const d = body.game;
      if (!d || d.dead || !Number.isFinite(amount)) return;
      d.lastDamage = this.time;
      d.hp -= amount;
      if (d.kind === "pig") {
        d.hurtUntil = this.time + 1;
        this.audio.play("pig", 0.6);
      }
      if (d.hp <= 0) this.destroy(body);
      else if (amount > 12 && d.kind === "block")
        this.burst(body.position.x, body.position.y, Art.C[d.material], 4);
    }
    destroy(body) {
      const d = body.game;
      if (!d || d.dead) return;
      if (d.kind === "tnt") {
        if (!d.armed) {
          d.armed = true;
          this.schedule(0.06, () => {
            if (!d.dead)
              this.explode(body.position.x, body.position.y, 165, body);
          });
        }
        return;
      }
      d.dead = true;
      const { x, y } = body.position;
      this.schedule(0, () => {
        Composite.remove(this.engine.world, body);
        if (d.kind === "block")
          this.entities.forEach((b) => {
            if (!b.isStatic && !b.game.dead) Sleeping.set(b, false);
          });
      });
      if (d.kind === "bird") {
        this.burst(x, y, Art.C[d.type], 16);
        return;
      }
      if (d.kind === "pig") {
        this.addScore(d.king ? 3500 : 2000, x, y);
        this.shotKills++;
        this.burst(x, y, "#a3c66f", 20, "star");
        this.audio.play("pig", 1);
        this.floatText(
          d.king
            ? "锅盖也救不了我！"
            : this.shotKills === 2
              ? "一鸟双猪！"
              : ["猪呢？飞走啦！", "哎呀，我的房！", "这不科学！"][
                  Math.floor(Math.random() * 3)
                ],
          x,
          y - 52,
          "#628746",
          18,
        );
        this.shake = Math.max(this.shake, 4);
      } else if (d.kind === "block") {
        this.addScore({ wood: 250, glass: 180, stone: 500 }[d.material], x, y);
        this.burst(
          x,
          y,
          Art.C[d.material],
          d.material === "glass" ? 12 : 8,
          "chip",
        );
        this.audio.play(d.material, 0.75);
      }
      this.updateHud();
      if (
        this.pigsLeft() === 0 &&
        this.phase !== "ending" &&
        this.mode === "playing"
      ) {
        this.phase = "ending";
        this.endingTime = 2.3;
        this.slowRemaining = this.reducedMotion ? 0 : 0.7;
        $("ability-tip").hidden = true;
        this.floatText("最后一击，漂亮！", 870, 270, "#b78437", 30);
        this.updateHud();
      }
    }
    explode(x, y, radius, source) {
      if (source?.game.dead) return;
      if (source) {
        source.game.dead = true;
        source.game.abilityUsed = true;
        this.schedule(0, () => Composite.remove(this.engine.world, source));
        if (source.game.kind === "tnt") this.addScore(600, x, y);
      }
      this.audio.play("explosion");
      this.shake = this.reducedMotion ? 0 : 8;
      this.rings.push({ x, y, r: radius, life: 0.48, max: 0.48 });
      this.burst(x, y, "#ed9c58", 28, "chip");
      this.burst(x, y, "#ffd36c", 14, "star");
      for (const b of this.entities) {
        const d = b.game;
        if (d.dead || b.isStatic || b === source) continue;
        const dx = b.position.x - x,
          dy = b.position.y - y,
          dist = Math.hypot(dx, dy);
        if (dist > radius + (d.r || 15)) continue;
        const falloff = Math.max(0.1, 1 - dist / (radius + 25));
        Sleeping.set(b, false);
        Body.setVelocity(b, {
          x: b.velocity.x + (dx / (dist || 1)) * 14 * falloff,
          y: b.velocity.y + (dy / (dist || 1)) * 13 * falloff - 4 * falloff,
        });
        Body.setAngularVelocity(b, (dx >= 0 ? 1 : -1) * falloff * 0.12);
        if (["pig", "block", "tnt"].includes(d.kind))
          this.damage(b, 105 * falloff + 10);
      }
      this.updateHud();
    }
    addScore(points, x, y) {
      this.combo = this.time - this.lastHit < 1.6 ? this.combo + 1 : 1;
      this.lastHit = this.time;
      const earned =
        Math.round((points * (1 + Math.min(5, this.combo - 1) * 0.08)) / 10) *
        10;
      this.score += earned;
      if (points >= 500)
        this.floatText("+" + earned, x + 20, y - 20, "#fff5b4", 18, true);
      if (this.combo === 3 || this.combo === 6 || this.combo === 10)
        this.floatText(
          this.combo +
            " 连击 · " +
            (this.combo >= 6 ? "拆得漂亮！" : "好事成双！"),
          780,
          350,
          "#c48839",
          24,
        );
      $("score-value").textContent = this.score.toLocaleString("en-US");
    }
    pigsLeft() {
      return this.entities.filter((b) => b.game.kind === "pig" && !b.game.dead)
        .length;
    }
    schedule(delay, action) {
      this.timers.push({ at: this.time + delay, action });
    }
    update(dt) {
      this.time += dt;
      this.accumulator += Math.min(dt, 0.045) * 1000;
      const slow = this.slowRemaining > 0 ? 0.24 : 1;
      this.slowRemaining = Math.max(0, this.slowRemaining - dt);
      while (this.accumulator >= PHYSICS.step) {
        Engine.update(this.engine, PHYSICS.step * slow);
        this.accumulator -= PHYSICS.step;
      }
      const due = this.timers.filter((t) => t.at <= this.time);
      this.timers = this.timers.filter((t) => t.at > this.time);
      for (const t of due) t.action();
      for (const b of this.entities) {
        const d = b.game;
        if (d.dead || b.isStatic) continue;
        if (d.kind === "bird" && d.launched) {
          if (b.speed > 1 && this.time - (d.lastTrail || 0) > 0.05) {
            d.trail.push({ x: b.position.x, y: b.position.y });
            if (d.trail.length > 22) d.trail.shift();
            d.lastTrail = this.time;
          }
        }
        if (b.position.y > 1050 || b.position.x > 1600 || b.position.x < -200) {
          if (d.kind === "pig") this.destroy(b);
          else {
            d.dead = true;
            Composite.remove(this.engine.world, b);
          }
        }
        if (b.speed > 34) {
          const k = 34 / b.speed;
          Body.setVelocity(b, { x: b.velocity.x * k, y: b.velocity.y * k });
        }
        if (Math.abs(b.angularVelocity) > 0.35)
          Body.setAngularVelocity(b, Math.sign(b.angularVelocity) * 0.35);
      }
      if (this.phase === "flight") {
        this.flightTime += dt;
        const bird = this.currentBird;
        if (
          this.flightTime > 7 ||
          (this.flightTime > 2.8 &&
            (!bird ||
              bird.game.dead ||
              bird.speed < 1 ||
              bird.position.x > 1400))
        ) {
          if (bird && !bird.game.dead) bird.game.fading = true;
          this.spawnBird();
        }
      } else if (this.phase === "waiting") {
        this.waitingTime += dt;
        const moving = this.entities.some(
          (b) =>
            !b.game.dead &&
            !b.isStatic &&
            b.game.kind !== "bird" &&
            b.speed > 1.4,
        );
        if (this.pigsLeft() === 0) {
          this.phase = "ending";
          this.endingTime = 1.5;
        } else if (this.waitingTime > 2.4 && (!moving || this.waitingTime > 9))
          this.finish(false);
      } else if (this.phase === "ending") {
        this.endingTime -= dt;
        if (this.endingTime <= 0) this.finish(true);
      }
      this.updateEffects(dt);
      this.shake = Math.max(0, this.shake - dt * 18);
    }
    updateEffects(dt) {
      for (const p of this.particles) {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 250 * dt;
        p.rotation += p.spin * dt;
      }
      this.particles = this.particles.filter((p) => p.life > 0);
      for (const p of this.rings) p.life -= dt;
      this.rings = this.rings.filter((p) => p.life > 0);
      for (const p of this.floaters) {
        p.life -= dt;
        p.y -= dt * 20;
      }
      this.floaters = this.floaters.filter((p) => p.life > 0);
    }
    burst(x, y, color, count = 12, type = "dot") {
      if (this.reducedMotion) count = Math.ceil(count * 0.4);
      for (let i = 0; i < count; i++) {
        if (this.particles.length >= PHYSICS.maxParticles)
          this.particles.shift();
        const a = Math.random() * Math.PI * 2,
          s = 60 + Math.random() * 155,
          life = 0.5 + Math.random() * 0.7;
        this.particles.push({
          x,
          y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - 50,
          life,
          max: life,
          color,
          size: 3 + Math.random() * 5,
          rotation: Math.random() * 6,
          spin: Math.random() * 8 - 4,
          type,
        });
      }
    }
    floatText(text, x, y, color = "#688953", size = 18, outline = false) {
      if (this.floaters.length > 12) this.floaters.shift();
      this.floaters.push({
        text,
        x,
        y,
        color,
        size,
        outline,
        life: 1.65,
        max: 1.65,
      });
    }
    finish(won) {
      if (this.mode !== "playing") return;
      this.cancelDrag();
      this.mode = "result";
      this.phase = "result";
      this.won = won;
      this.timers = [];
      this.audio.play(won ? "win" : "lose");
      $("ability-tip").hidden = true;
      $("level-intro").classList.remove("visible");
      const bonus = won
        ? (this.level.birds.length - this.spent) * PHYSICS.birdBonus
        : 0;
      const total = this.score + bonus;
      const stars = won
        ? 1 +
          (total >= this.level.thresholds[0] ? 1 : 0) +
          (total >= this.level.thresholds[1] ? 1 : 0)
        : 0;
      this.lastResult = {
        won,
        score: total,
        stars,
        bonus,
        destruction: this.score,
      };
      const oldBest = this.save.levels[this.levelIndex].score;
      if (won) {
        this.journey[this.levelIndex] = {
          score: total,
          stars,
          bonus,
          destruction: this.score,
        };
        this.save.levels[this.levelIndex] = {
          score: Math.max(total, oldBest),
          stars: Math.max(stars, this.save.levels[this.levelIndex].stars),
        };
        this.persist();
      }
      const final = won && this.levelIndex === 2;
      const shownScore = final
        ? this.journey.reduce((sum, r) => sum + (r?.score || 0), 0)
        : total;
      $("result-panel").classList.toggle("loss", !won);
      $("result-kicker").textContent = final
        ? "THE LITTLE ADVENTURE · COMPLETE"
        : won
          ? "A BEAUTIFUL SHOT"
          : "ONE MORE LITTLE TRY";
      $("result-title").textContent = final
        ? "今日份快乐，满载而归！"
        : won
          ? ["好耶！猪窝拆迁成功", "漂亮！快乐连锁反应", "锅盖王也投降啦"][
              this.levelIndex
            ]
          : "差一点点，就亿点点。";
      $("result-description").textContent = final
        ? "三座堡垒全部拿下，你就是今日拆迁队长。"
        : won
          ? "小猪说：下次一定把房子盖结实点。"
          : "小猪在偷笑。换个角度，再给它们一发？";
      $("result-stars").innerHTML = Array.from(
        { length: 3 },
        (_, i) =>
          `<svg class="${i < stars ? "earned" : ""}" aria-label="${i < stars ? "已获得星星" : "未获得星星"}"><use href="#i-star"/></svg>`,
      ).join("");
      $("result-score-label").textContent = final ? "三关总成绩" : "本关得分";
      $("result-score").textContent = "0";
      $("best-label").textContent = won
        ? total > oldBest
          ? "新纪录！比上次更会捣蛋"
          : "本关最佳 " +
            this.save.levels[this.levelIndex].score.toLocaleString("en-US")
        : "还剩 " + this.pigsLeft() + " 只小猪 · 下次瞄准支撑点";
      if (final)
        $("best-label").textContent =
          `三关共获得 ${this.journey.reduce((sum, r) => sum + (r?.stars || 0), 0)} / 9 颗星`;
      const shownDestruction = final
        ? this.journey.reduce((sum, r) => sum + (r?.destruction || 0), 0)
        : this.score;
      const shownBonus = final
        ? this.journey.reduce((sum, r) => sum + (r?.bonus || 0), 0)
        : bonus;
      $("destruction-score").textContent =
        shownDestruction.toLocaleString("en-US");
      $("bonus-score").textContent = "+" + shownBonus.toLocaleString("en-US");
      $("journey-results").hidden = !final;
      if (final) {
        $("journey-results").innerHTML = this.journey
          .map(
            (r, i) =>
              `<div><small>第 ${i + 1} 关</small><b>${(r?.score || 0).toLocaleString("en-US")}</b><span>${Array.from({ length: r?.stars || 0 }, () => '<svg><use href="#i-star"/></svg>').join("")}</span></div>`,
          )
          .join("");
      }
      $("next-button").innerHTML =
        (final ? "再玩一次" : won ? "下一关" : "再试一次") +
        '<svg><use href="' +
        (won ? "#i-arrow" : "#i-retry") +
        '"/></svg>';
      $("result-retry").hidden = !won;
      this.resultAnimation = { start: performance.now(), target: shownScore };
      this.showModal("result-panel");
      $("next-button").focus();
      this.updateHud();
    }
    persist() {
      try {
        localStorage.setItem("little-bird-club-v1", JSON.stringify(this.save));
      } catch {
        if (!this.storageWarned) {
          this.storageWarned = true;
          this.toast("浏览器未开放本地存储，本次成绩仍可正常查看。");
        }
      }
    }
    pause(automatic = false) {
      if (this.mode !== "playing") return;
      this.cancelDrag();
      this.mode = "paused";
      this.audio.suspend();
      this.showModal("pause-panel");
      if (automatic) $("pause-title").textContent = "小鸟在这里等你";
      else $("pause-title").textContent = "小鸟也要歇口气";
    }
    resume() {
      if (this.mode !== "paused") return;
      this.audio.unlock();
      this.audio.resume();
      this.mode = "playing";
      this.accumulator = 0;
      this.lastFrame = performance.now();
      this.hideModal();
      this.canvas.focus({ preventScroll: true });
    }
    goHome() {
      this.cancelDrag();
      this.mode = "home";
      this.phase = "aim";
      this.timers = [];
      this.currentBird = null;
      this.resultAnimation = null;
      this.hideModal();
      this.audio.resume();
      this.audio.play("click");
      $("app").dataset.screen = "home";
      $("game-ui").hidden = true;
      $("start-button").focus();
    }
    showModal(id) {
      $("toast").classList.remove("visible");
      this.toastEnd = 0;
      this.previousFocus = document.activeElement;
      document
        .querySelectorAll(".panel")
        .forEach((p) => (p.hidden = p.id !== id));
      $("modal-layer").hidden = false;
      $("game-ui").inert = true;
      $("home").inert = true;
      document.querySelector(".home-header").inert = true;
      const focus = $(id).querySelector(".primary,button");
      focus?.focus({ preventScroll: true });
    }
    hideModal() {
      const wasOpen = !$("modal-layer").hidden;
      $("modal-layer").hidden = true;
      document.querySelectorAll(".panel").forEach((p) => (p.hidden = true));
      $("game-ui").inert = false;
      $("home").inert = false;
      document.querySelector(".home-header").inert = false;
      if (wasOpen && this.previousFocus?.isConnected)
        this.previousFocus.focus({ preventScroll: true });
    }
    toast(text, duration = 2.5) {
      $("toast").textContent = text;
      $("toast").classList.add("visible");
      this.toastEnd = performance.now() + duration * 1000;
    }
    updateSoundButtons() {
      document.querySelectorAll(".sound-button").forEach((b) => {
        b.querySelector("use").setAttribute(
          "href",
          this.save.muted ? "#i-mute" : "#i-sound",
        );
        b.setAttribute("aria-label", this.save.muted ? "开启声音" : "关闭声音");
        b.title = this.save.muted ? "开启声音" : "关闭声音";
        b.setAttribute("aria-pressed", String(this.save.muted));
      });
    }
    updateHud() {
      if (!this.level) return;
      $("score-value").textContent = this.score.toLocaleString("en-US");
      $("pig-count").textContent = this.pigsLeft();
      $("bird-remaining").textContent =
        this.level.birds.length - this.spent + " / " + this.level.birds.length;
      const signature = this.levelIndex + "-" + this.spent + "-" + this.phase;
      if (signature !== this.queueSignature) {
        this.queueSignature = signature;
        $("bird-queue").replaceChildren();
        this.level.birds.forEach((type, i) => {
          const item = document.createElement("div");
          item.className =
            "bird-avatar" +
            (i < this.spent ? " used" : "") +
            (i === this.activeIndex && ["aim", "flight"].includes(this.phase)
              ? " current"
              : "");
          item.title = TYPES[type].name + " · " + TYPES[type].ability;
          item.setAttribute(
            "aria-label",
            item.title +
              (i < this.spent
                ? "，已发射"
                : i === this.activeIndex
                  ? "，当前小鸟"
                  : "，待发射"),
          );
          const canvas = document.createElement("canvas");
          canvas.width = 96;
          canvas.height = 96;
          Art.bird(canvas.getContext("2d"), 48, 53, 30, type);
          item.append(canvas);
          $("bird-queue").append(item);
        });
      }
      $("ability-button").disabled = !(
        this.mode === "playing" &&
        this.phase === "flight" &&
        this.currentBird &&
        !this.currentBird.game.dead &&
        !this.currentBird.game.abilityUsed
      );
      $("play-hint").innerHTML =
        this.phase === "aim"
          ? '<span class="mouse-symbol"></span>向后拖动 · 松手发射<span class="hint-key">P</span> 暂停'
          : this.phase === "flight"
            ? '<span class="mouse-symbol"></span>飞行中点击 · 释放技能'
            : "让快乐，再飞一会儿";
    }
    drawPortraits() {
      document
        .querySelectorAll("canvas[data-bird]")
        .forEach((c) =>
          Art.bird(c.getContext("2d"), 50, 51, 26, c.dataset.bird),
        );
    }
    frame(now) {
      const dt = Math.min((now - this.lastFrame) / 1000, 0.05);
      this.lastFrame = now;
      if (this.mode !== "paused") this.visualTime += dt;
      if (this.mode === "playing") this.update(dt);
      else if (this.mode === "result") this.updateEffects(dt);
      if (this.toastEnd && now > this.toastEnd) {
        $("toast").classList.remove("visible");
        this.toastEnd = 0;
      }
      if (this.resultAnimation) {
        const t = Math.min(1, (now - this.resultAnimation.start) / 850),
          v = Math.round(
            this.resultAnimation.target * (1 - Math.pow(1 - t, 3)),
          );
        $("result-score").textContent = v.toLocaleString("en-US");
        if (t === 1) this.resultAnimation = null;
      }
      this.draw();
      requestAnimationFrame((t) => this.frame(t));
    }
    draw() {
      const c = this.ctx,
        v = this.view;
      c.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
      c.clearRect(0, 0, v.width, v.height);
      c.save();
      c.translate(v.x, v.y);
      c.scale(v.scale, v.scale);
      if (this.shake && !this.reducedMotion && this.mode === "playing")
        c.translate(
          Math.sin(this.time * 61) * this.shake,
          Math.cos(this.time * 73) * this.shake * 0.5,
        );
      Art.background(c, this.visualTime, this.mode === "home");
      if (this.mode === "home") Art.homeScene(c, this.visualTime);
      else {
        Art.sling(
          c,
          ANCHOR.x,
          ANCHOR.y,
          this.drag || (this.phase === "aim" ? ANCHOR : null),
          false,
        );
        for (const b of this.entities) {
          const d = b.game;
          if (d.dead || d.kind !== "bird" || !d.launched) continue;
          c.save();
          d.trail.forEach((p, i) => {
            c.globalAlpha = (i / d.trail.length) * 0.3;
            Art.ellipse(c, p.x, p.y, 3, 3, "#fffcdd");
          });
          c.restore();
        }
        for (const b of this.entities) {
          const d = b.game;
          if (d.dead) continue;
          const { x, y } = b.position;
          if (d.kind === "block")
            Art.block(
              c,
              x,
              y,
              d.w,
              d.h,
              d.material,
              b.angle,
              Math.max(0, d.hp / d.maxHp),
            );
          else if (d.kind === "pig")
            Art.pig(
              c,
              x,
              y,
              d.r,
              d.king,
              b.angle,
              this.time < d.hurtUntil ? "hurt" : "normal",
              this.visualTime,
            );
          else if (d.kind === "tnt")
            Art.tnt(c, x, y, d.w, d.h, b.angle, d.armed);
          else if (d.kind === "rock") Art.rock(c, x, y, d.r, b.angle);
          else if (d.kind === "spring")
            Art.spring(c, x, y, 76, this.time - d.hitAt < 0.15 ? 7 : 0);
          else if (d.kind === "bird") {
            c.save();
            c.globalAlpha = d.fading ? 0.47 : 1;
            Art.bird(
              c,
              x,
              y,
              d.r,
              d.type,
              d.launched ? b.angle : Math.sin(this.visualTime * 2) * 0.03,
              d.launched
                ? "flying"
                : Math.sin(this.visualTime * 1.7) > 0.995
                  ? "blink"
                  : "normal",
              this.visualTime,
            );
            c.restore();
          }
        }
        Art.sling(
          c,
          ANCHOR.x,
          ANCHOR.y,
          this.drag || (this.phase === "aim" ? ANCHOR : null),
          true,
        );
        if (this.drag) this.drawTrajectory(c);
        else if (this.phase === "aim") {
          const a = 1 + Math.sin(this.visualTime * 3) * 0.07;
          c.save();
          c.globalAlpha = 0.5;
          c.strokeStyle = "#fcf9df";
          c.lineWidth = 2;
          c.setLineDash([4, 7]);
          c.beginPath();
          c.ellipse(ANCHOR.x, ANCHOR.y, 45 * a, 45 * a, 0, 0, Math.PI * 2);
          c.stroke();
          c.restore();
          if (this.spent === 0) {
            c.fillStyle = "#688756";
            c.font = '600 12px "Microsoft YaHei",sans-serif';
            c.textAlign = "center";
            c.fillText("拉开一点，好戏开场", ANCHOR.x, ANCHOR.y + 83);
          }
        }
        const left = this.level.birds.slice(
          this.spent + (this.phase === "aim" ? 1 : 0),
        );
        left.slice(0, 4).forEach((type, i) => {
          Art.ellipse(c, 204 - i * 42, 742, 20, 3, "#819f6430");
          Art.bird(
            c,
            201 - i * 42,
            721,
            18,
            type,
            Math.sin(this.visualTime * 1.5 + i) * 0.035,
            "normal",
            this.visualTime,
          );
        });
        Art.foreground(c);
        this.drawEffects(c);
        if (this.slowRemaining > 0) {
          c.save();
          c.globalAlpha = this.slowRemaining * 0.18;
          c.fillStyle = "#fff3ad";
          c.fillRect(-400, 0, 2240, H);
          c.restore();
        }
      }
      c.restore();
    }
    drawTrajectory(c) {
      let x = this.drag.x,
        y = this.drag.y,
        vx = (ANCHOR.x - x) * PHYSICS.launchScale,
        vy = (ANCHOR.y - y) * PHYSICS.launchScale;
      const power = Math.min(
        1,
        Math.hypot(vx, vy) / (PHYSICS.maxPull * PHYSICS.launchScale),
      );
      for (let i = 0; i < 70; i++) {
        vx *= 0.9975;
        vy = vy * 0.9975 + 0.27778;
        x += vx;
        y += vy;
        if (i % 3 === 0 && x >= 0 && x < W && y > 90) {
          c.globalAlpha = Math.max(0.1, 0.8 - i / 90);
          Art.ellipse(
            c,
            x,
            y,
            Math.max(2, 5 - i * 0.04),
            Math.max(2, 5 - i * 0.04),
            "#fffef0",
            "#6d8b6c",
            0.7,
          );
        }
        if (y > FLOOR - 20) break;
      }
      c.globalAlpha = 1;
      const label = Math.round(power * 100) + "%";
      Art.rr(
        c,
        this.drag.x - 27,
        this.drag.y + 40,
        54,
        24,
        10,
        "#fff7dc",
        "#c5b77d",
        1.5,
      );
      c.fillStyle = "#807243";
      c.font = "800 11px sans-serif";
      c.textAlign = "center";
      c.fillText(label, this.drag.x, this.drag.y + 56);
    }
    drawEffects(c) {
      for (const p of this.rings) {
        const progress = 1 - p.life / p.max;
        c.save();
        c.globalAlpha = (1 - progress) * 0.6;
        c.strokeStyle = "#ffdf85";
        c.lineWidth = 20 * (1 - progress) + 2;
        c.beginPath();
        c.arc(p.x, p.y, 25 + progress * p.r, 0, Math.PI * 2);
        c.stroke();
        c.globalAlpha = (1 - progress) * 0.2;
        Art.ellipse(
          c,
          p.x,
          p.y,
          20 + progress * p.r,
          20 + progress * p.r,
          "#f6bb60",
        );
        c.restore();
      }
      for (const p of this.particles) {
        c.save();
        c.globalAlpha = Math.min(1, p.life / 0.25);
        c.translate(p.x, p.y);
        c.rotate(p.rotation);
        if (p.type === "star") Art.star(c, 0, 0, p.size, p.color);
        else if (p.type === "chip")
          Art.rr(c, -p.size / 2, -p.size / 3, p.size, p.size * 0.7, 1, p.color);
        else Art.ellipse(c, 0, 0, p.size, p.size * 0.5, p.color);
        c.restore();
      }
      for (const p of this.floaters) {
        c.save();
        c.globalAlpha = Math.min(1, p.life / 0.35);
        c.font = `900 ${p.size}px "Microsoft YaHei",sans-serif`;
        c.textAlign = "center";
        c.lineJoin = "round";
        c.strokeStyle = p.outline ? "#7c8d5f" : "#fffbe8";
        c.lineWidth = p.outline ? 3 : 5;
        c.strokeText(p.text, p.x, p.y);
        c.fillStyle = p.color;
        c.fillText(p.text, p.x, p.y);
        c.restore();
      }
    }
  }
  window.game = new SlingshotGame();
})();
