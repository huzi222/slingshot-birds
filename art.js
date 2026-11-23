(() => {
  "use strict";
  const C = {
    ink: "#3a5742",
    sky: "#d7eff0",
    cream: "#fffce9",
    red: "#ee795a",
    yellow: "#f6c851",
    black: "#555e67",
    wood: "#ddb071",
    woodEdge: "#9a7141",
    glass: "#b1e2d9",
    glassEdge: "#689f98",
    stone: "#afb8a7",
    stoneEdge: "#758572",
  };
  function rr(c, x, y, w, h, r, fill, stroke, lw = 2) {
    c.beginPath();
    c.roundRect(x, y, w, h, r);
    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = lw;
      c.stroke();
    }
  }
  function ellipse(c, x, y, rx, ry, fill, stroke, lw = 2) {
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = lw;
      c.stroke();
    }
  }
  function path(c, points, fill, stroke, lw = 2) {
    c.beginPath();
    points.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p)));
    if (fill) {
      c.closePath();
      c.fillStyle = fill;
      c.fill();
    }
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = lw;
      c.stroke();
    }
  }
  function line(c, points, color, width = 2) {
    path(c, points, null, color, width);
  }
  function star(c, x, y, r, fill = "#f8c453", rotation = 0) {
    c.save();
    c.translate(x, y);
    c.rotate(rotation);
    let p = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const d = i % 2 ? r * 0.46 : r;
      p.push([Math.cos(a) * d, Math.sin(a) * d]);
    }
    path(c, p, fill, "#c8943c", 1.5);
    c.restore();
  }
  function cloud(c, x, y, s, alpha = 1) {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    c.globalAlpha = alpha;
    const p = new Path2D(
      "M-74 17C-83-3-59-21-43-13C-39-48 14-51 24-22C46-31 68-17 66 0C97-4 101 26 72 29L-60 29Q-73 28-74 17Z",
    );
    c.fillStyle = "#bedddc";
    c.translate(0, 5);
    c.fill(p);
    c.translate(0, -5);
    c.fillStyle = "#f4faf0";
    c.fill(p);
    c.restore();
  }
  function hill(c, x, y, rx, ry, color) {
    ellipse(c, x, y, rx, ry, color);
  }
  function tree(c, x, y, s, color = "#90b58e") {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    line(
      c,
      [
        [0, 0],
        [0, -70],
      ],
      "#80a27a",
      6,
    );
    ellipse(c, -13, -91, 31, 42, color);
    ellipse(c, 17, -115, 35, 44, color);
    ellipse(c, 36, -78, 28, 35, color);
    line(
      c,
      [
        [0, -38],
        [16, -71],
      ],
      "#7f9f72",
      3,
    );
    c.restore();
  }
  function grass(c, x, y, s = 1, color = "#78a164") {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    line(
      c,
      [
        [-8, 0],
        [-12, -10],
        [-5, -5],
        [-2, -16],
        [2, -6],
        [8, -13],
        [7, -2],
        [13, -6],
      ],
      color,
      2,
    );
    c.restore();
  }
  function bush(c, x, y, s = 1, color = "#6f9860") {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    ellipse(c, -30, 0, 35, 28, color);
    ellipse(c, 0, -14, 41, 35, color);
    ellipse(c, 36, 1, 35, 28, color);
    line(
      c,
      [
        [-39, -8],
        [-29, -18],
      ],
      "#95b77c",
      3,
    );
    line(
      c,
      [
        [9, -19],
        [19, -24],
      ],
      "#95b77c",
      3,
    );
    c.restore();
  }
  function background(c, t, home = false) {
    c.fillStyle = C.sky;
    c.fillRect(-1000, -1000, 3500, 2100);
    const glow = c.createLinearGradient(0, 0, 0, 730);
    glow.addColorStop(0, "#d3edf0");
    glow.addColorStop(1, "#f2f5d9");
    c.fillStyle = glow;
    c.fillRect(-1000, -300, 3500, 1045);
    cloud(c, 230 + Math.sin(t * 0.04) * 12, 125, 0.73, 0.75);
    cloud(c, 675 + Math.sin(t * 0.025) * 14, 129, 0.85, 0.9);
    cloud(c, 1195 + Math.sin(t * 0.03) * 15, 135, 0.95, 0.9);
    cloud(c, 1423, 345, 0.67, 0.65);
    if (!home) cloud(c, 77, 346, 0.7, 0.72);
    hill(c, 118, 740, 455, 250, "#bfddc4");
    hill(c, 638, 766, 395, 247, "#c4dfc4");
    hill(c, 1125, 738, 392, 295, "#b8d8b7");
    hill(c, 1430, 790, 200, 280, "#bedbc0");
    c.beginPath();
    c.moveTo(-600, 699);
    c.bezierCurveTo(50, 694, 18, 603, 315, 633);
    c.bezierCurveTo(567, 644, 637, 742, 845, 677);
    c.bezierCurveTo(1124, 561, 1326, 657, 1990, 680);
    c.lineTo(1990, 800);
    c.lineTo(-600, 800);
    c.closePath();
    c.fillStyle = "#a3cba4";
    c.fill();
    tree(c, 42, 701, 0.88, "#9cc69b");
    tree(c, 1391, 695, 1.18, "#a1c399");
    tree(c, 753, 721, 0.58, "#9abd8c");
    tree(c, 1312, 695, 0.64, "#96bc8b");
    if (home) {
      c.save();
      c.translate(1245, 559);
      c.globalAlpha = 0.45;
      path(
        c,
        [
          [-14, 111],
          [-8, 0],
          [12, 0],
          [28, 111],
        ],
        "#e8e9cd",
        "#98b791",
        2,
      );
      ellipse(c, 1, 7, 6, 6, "#779b7f");
      c.save();
      c.translate(1, 7);
      c.rotate(t * 0.035);
      for (let i = 0; i < 4; i++) {
        c.rotate(Math.PI / 2);
        path(
          c,
          [
            [6, -3],
            [53, -13],
            [61, 1],
            [7, 4],
          ],
          "#eff3da",
          "#91b19b",
          1.5,
        );
      }
      c.restore();
      c.restore();
    }
    c.beginPath();
    c.moveTo(-600, 734);
    c.bezierCurveTo(-125, 696, 207, 722, 560, 735);
    c.bezierCurveTo(805, 697, 1120, 724, 2000, 718);
    c.lineTo(2000, 900);
    c.lineTo(-600, 900);
    c.closePath();
    c.fillStyle = "#8bb77d";
    c.fill();
    c.fillStyle = "#dce5b5";
    c.fillRect(-1000, 742, 3500, 1000);
    c.fillStyle = "#b0cd8a";
    c.fillRect(-1000, 741, 3500, 12);
    for (let i = 0; i < 37; i++) {
      const x = ((i * 107 + 31) % 1600) - 90;
      const y = 767 + ((i * 31) % 127);
      rr(c, x, y, 4 + (i % 4) * 3, 3, 2, i % 3 === 0 ? "#c1d398" : "#cbd9a4");
    }
    for (let i = 0; i < 18; i++)
      grass(c, i * 97 - 40, 738 + (i % 3) * 2, 0.7, "#77a268");
    c.beginPath();
    c.moveTo(-100, 850);
    c.bezierCurveTo(170, 797, 408, 867, 603, 837);
    c.bezierCurveTo(915, 798, 1140, 852, 1600, 801);
    c.strokeStyle = "#cbdca1";
    c.lineWidth = 32;
    c.stroke();
    bush(c, -5, 850, 1.4, "#799d62");
    bush(c, 1453, 834, 1.5, "#80a969");
    ellipse(c, 85, 804, 5, 5, "#f8f2c5");
    ellipse(c, 88, 803, 2, 2, "#d4ad54");
    ellipse(c, 1350, 795, 4, 4, "#f8f2c5");
  }
  function bird(
    c,
    x,
    y,
    r,
    type = "red",
    angle = 0,
    expression = "normal",
    t = 0,
  ) {
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    c.scale(r / 28, r / 28);
    c.lineCap = "round";
    c.lineJoin = "round";
    const fill = C[type] || C.red;
    const edge = type === "black" ? "#38474b" : "#87573d";
    path(
      c,
      [
        [-22, 6],
        [-39, 2],
        [-34, 10],
        [-41, 14],
        [-21, 17],
      ],
      fill,
      edge,
      2,
    );
    if (type === "yellow") {
      path(
        c,
        [
          [-9, -20],
          [-14, -39],
          [-2, -28],
          [3, -40],
          [8, -25],
        ],
        "#e8b743",
        edge,
        2,
      );
    } else if (type === "black") {
      line(
        c,
        [
          [0, -23],
          [1, -37],
          [9, -41],
        ],
        "#574e38",
        4,
      );
      ellipse(c, 11, -40, 4, 5, "#f6c453");
    } else {
      path(
        c,
        [
          [-9, -22],
          [-10, -38],
          [1, -31],
          [8, -36],
          [9, -23],
        ],
        "#da6b50",
        edge,
        2,
      );
    }
    c.beginPath();
    c.moveTo(-27, 4);
    c.bezierCurveTo(-29, -21, -12, -29, 7, -26);
    c.bezierCurveTo(30, -23, 34, -1, 27, 17);
    c.bezierCurveTo(20, 32, -16, 31, -24, 17);
    c.closePath();
    c.fillStyle = fill;
    c.fill();
    c.strokeStyle = edge;
    c.lineWidth = 2.4;
    c.stroke();
    c.save();
    c.clip();
    ellipse(c, 5, 25, 25, 17, type === "black" ? "#adb4b2" : "#ffe2b1");
    ellipse(
      c,
      -16,
      -12,
      8,
      10,
      type === "red" ? "#f59071" : type === "yellow" ? "#ffdb72" : "#717b7f",
    );
    c.restore();
    c.beginPath();
    c.moveTo(-21, 3);
    c.quadraticCurveTo(-6, 0, -10, 13);
    c.quadraticCurveTo(-20, 18, -22, 11);
    c.strokeStyle = type === "black" ? "#414f54" : "#b97541";
    c.lineWidth = 1.8;
    c.stroke();
    if (expression === "blink") {
      line(
        c,
        [
          [1, -9],
          [8, -7],
        ],
        "#394538",
        2.5,
      );
      line(
        c,
        [
          [15, -8],
          [23, -10],
        ],
        "#394538",
        2.5,
      );
    } else {
      ellipse(c, 6, -8, 7, 8, "#fffbeb");
      ellipse(c, 20, -9, 6.5, 7.5, "#fffbeb");
      ellipse(c, 8, -7, 2.5, 4, "#344638");
      ellipse(c, 22, -8, 2.5, 4, "#344638");
      ellipse(c, 9, -9, 1, 1, "#fff");
    }
    path(
      c,
      [
        [12, 0],
        [37, 4],
        [18, 13],
      ],
      "#ffc55b",
      "#9b713a",
      1.8,
    );
    line(
      c,
      [
        [19, 6],
        [30, 5],
      ],
      "#bc8b42",
      1.1,
    );
    ellipse(c, 2, 6, 4, 2.5, type === "black" ? "#b58672" : "#d75c49");
    if (expression === "flying") {
      line(
        c,
        [
          [0, -19],
          [11, -15],
        ],
        "#614b3b",
        2.4,
      );
      line(
        c,
        [
          [15, -15],
          [26, -19],
        ],
        "#614b3b",
        2.4,
      );
    } else {
      line(
        c,
        [
          [3, -19],
          [10, -20],
        ],
        type === "black" ? "#dfb563" : "#845e3d",
        2,
      );
    }
    c.restore();
  }
  function pig(c, x, y, r, king = false, angle = 0, mood = "normal", t = 0) {
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    c.scale(r / 27, r / 27);
    c.lineCap = "round";
    c.lineJoin = "round";
    const fill = king ? "#9abe67" : "#a6cb70";
    const edge = "#63834c";
    c.beginPath();
    c.moveTo(-24, 9);
    c.bezierCurveTo(-41, 9, -38, -5, -29, -3);
    c.bezierCurveTo(-20, 0, -32, 4, -30, -1);
    c.strokeStyle = edge;
    c.lineWidth = 2.4;
    c.stroke();
    ellipse(c, -16, -23, 9, 11, fill, edge);
    ellipse(c, 15, -23, 9, 11, fill, edge);
    ellipse(c, -16, -24, 4, 6, "#dfb17d");
    ellipse(c, 15, -24, 4, 6, "#dfb17d");
    rr(c, -28, -25, 56, 54, 23, fill, edge, 2.5);
    ellipse(c, -18, -12, 4, 7, "#bfdc8f");
    ellipse(c, -18, 10, 6, 3.5, "#d2ba7e");
    ellipse(c, 20, 10, 5, 3.5, "#d2ba7e");
    const blink = mood === "normal" && Math.sin(t * 1.1 + x) > 0.992;
    if (mood === "hurt") {
      line(
        c,
        [
          [-14, -14],
          [-8, -7],
          [-15, -2],
        ],
        "#43593d",
        2.5,
      );
      line(
        c,
        [
          [15, -14],
          [9, -7],
          [16, -2],
        ],
        "#43593d",
        2.5,
      );
    } else if (blink) {
      line(
        c,
        [
          [-17, -7],
          [-9, -7],
        ],
        "#43593d",
        2.5,
      );
      line(
        c,
        [
          [7, -7],
          [16, -7],
        ],
        "#43593d",
        2.5,
      );
    } else {
      ellipse(c, -12, -9, 7, 8, "#f9f8e7");
      ellipse(c, 12, -9, 7, 8, "#f9f8e7");
      const dx = Math.sin(t * 0.7) * 1.2;
      ellipse(c, -13 + dx, -8, 2.7, 3.8, "#3b563c");
      ellipse(c, 11 + dx, -8, 2.7, 3.8, "#3b563c");
    }
    rr(c, -15, 1, 31, 21, 10, "#c4db8c", "#769657", 1.8);
    ellipse(c, -6, 11, 3, 4, "#739351");
    ellipse(c, 7, 11, 3, 4, "#739351");
    if (mood === "hurt") ellipse(c, 0, 26, 5, 3, "#5c773f");
    else {
      c.beginPath();
      c.arc(0, 17, 11, 0.12 * Math.PI, 0.78 * Math.PI);
      c.strokeStyle = "#608043";
      c.lineWidth = 1.5;
      c.stroke();
    }
    if (king) {
      rr(c, -33, -30, 66, 9, 4, "#7b8e8c", "#536e69", 2);
      c.beginPath();
      c.ellipse(0, -29, 27, 18, 0, Math.PI, 0);
      c.closePath();
      c.fillStyle = "#b7c8c0";
      c.fill();
      c.strokeStyle = "#536e69";
      c.lineWidth = 2;
      c.stroke();
      for (const px of [-14, 0, 14]) {
        ellipse(c, px, -34, 2, 2, "#809990");
      }
      rr(c, -7, -51, 14, 7, 3, "#7c9690", "#536e69", 1.5);
      line(
        c,
        [
          [-19, -36],
          [-12, -41],
        ],
        "#e1e9d9",
        3,
      );
    }
    c.restore();
  }
  function block(c, x, y, w, h, material = "wood", angle = 0, health = 1) {
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    const wood = material === "wood",
      glass = material === "glass";
    rr(
      c,
      -w / 2,
      -h / 2,
      w,
      h,
      Math.min(4, w / 5, h / 5),
      C[material],
      C[material + "Edge"],
      2.2,
    );
    if (wood) {
      rr(
        c,
        -w / 2 + 4,
        -h / 2 + 3,
        w - 8,
        Math.max(2, Math.min(5, h - 6)),
        2,
        "#ebc791",
      );
      c.save();
      c.beginPath();
      c.rect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8);
      c.clip();
      if (w > h) {
        line(
          c,
          [
            [-w / 2 + 8, 1],
            [-w * 0.12, -2],
            [w * 0.1, 2],
            [w / 2 - 8, 0],
          ],
          "#ba8b50",
          1.2,
        );
        line(
          c,
          [
            [-w / 2 + 10, h * 0.25],
            [w * 0.25, h * 0.25],
            [w / 2, h * 0.1],
          ],
          "#c5975a",
          1,
        );
      } else {
        line(
          c,
          [
            [0, -h / 2 + 8],
            [-2, -h * 0.1],
            [2, h * 0.2],
            [0, h / 2 - 7],
          ],
          "#ba8b50",
          1.2,
        );
        line(
          c,
          [
            [w * 0.22, -h * 0.3],
            [w * 0.2, h * 0.3],
          ],
          "#c5975a",
          1,
        );
      }
      c.restore();
      if (w > 45) {
        ellipse(c, -w / 2 + 8, 0, 1.8, 1.8, "#9b7649");
        ellipse(c, w / 2 - 8, 0, 1.8, 1.8, "#9b7649");
      } else {
        ellipse(c, 0, -h / 2 + 8, 1.7, 1.7, "#9b7649");
        ellipse(c, 0, h / 2 - 8, 1.7, 1.7, "#9b7649");
      }
    } else if (glass) {
      rr(c, -w / 2 + 4, -h / 2 + 4, w - 8, Math.max(3, h - 8), 2, "#c5eae0");
      c.save();
      c.beginPath();
      c.rect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6);
      c.clip();
      line(
        c,
        [
          [-w / 2 - 10, h / 2],
          [w / 2, -h / 2],
        ],
        "#f1fff0",
        7,
      );
      line(
        c,
        [
          [-w / 2 + 10, h / 2],
          [w / 2 + 20, -h / 2],
        ],
        "#effff1",
        3,
      );
      c.restore();
    } else {
      line(
        c,
        [
          [-w / 2 + 5, -h / 2 + 5],
          [w / 2 - 5, -h / 2 + 5],
        ],
        "#d0d6c6",
        3,
      );
      rr(c, -w / 2 + 6, h / 2 - 8, Math.min(12, w - 12), 3, 1, "#919f89");
      if (w > 65)
        line(
          c,
          [
            [w * 0.17, -h / 2],
            [w * 0.1, -h * 0.1],
            [w * 0.2, h * 0.2],
          ],
          "#94a18c",
          1.5,
        );
    }
    if (health < 0.6) {
      line(
        c,
        [
          [0, -h / 2],
          [w * 0.16, -h * 0.15],
          [-w * 0.08, h * 0.1],
          [w * 0.13, h / 2],
        ],
        glass ? "#709f99" : "#8e744e",
        1.8,
      );
    }
    c.restore();
  }
  function tnt(c, x, y, w = 46, h = 46, angle = 0, armed = false) {
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    rr(
      c,
      -w / 2,
      -h / 2,
      w,
      h,
      5,
      armed ? "#eea74c" : "#da7960",
      "#925d40",
      2.4,
    );
    line(
      c,
      [
        [-w / 2 + 4, -h / 2 + 5],
        [w / 2 - 4, -h / 2 + 5],
      ],
      "#efb392",
      3,
    );
    line(
      c,
      [
        [-w / 2 + 5, -h / 2 + 8],
        [w / 2 - 5, h / 2 - 5],
      ],
      "#b96950",
      5,
    );
    line(
      c,
      [
        [w / 2 - 5, -h / 2 + 8],
        [-w / 2 + 5, h / 2 - 5],
      ],
      "#b96950",
      5,
    );
    rr(c, -18, -10, 36, 20, 3, "#fff0ce", "#b27b52", 1.4);
    c.fillStyle = "#9c533b";
    c.font = "900 11px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("BOOM", 0, 1);
    line(
      c,
      [
        [0, -h / 2],
        [1, -h / 2 - 8],
        [7, -h / 2 - 11],
      ],
      "#706044",
      3,
    );
    c.restore();
  }
  function rock(c, x, y, r, angle = 0) {
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    path(
      c,
      [
        [-r, -r * 0.05],
        [-r * 0.68, -r * 0.8],
        [r * 0.1, -r],
        [r * 0.85, -r * 0.5],
        [r, r * 0.37],
        [r * 0.45, r * 0.9],
        [-r * 0.49, r * 0.87],
      ],
      "#a8b3a1",
      "#75836e",
      2.4,
    );
    line(
      c,
      [
        [-r * 0.58, -r * 0.47],
        [-r * 0.05, -r * 0.69],
        [r * 0.4, -r * 0.42],
      ],
      "#cbd4c0",
      4,
    );
    line(
      c,
      [
        [r * 0.44, r * 0.32],
        [r * 0.65, r * 0.13],
      ],
      "#8b9b81",
      3,
    );
    c.restore();
  }
  function spring(c, x, y, w = 76, compression = 0) {
    c.save();
    c.translate(x, y);
    rr(c, -w / 2, 6, w, 10, 4, "#798e72", "#536b52", 2);
    const top = -9 + compression;
    line(
      c,
      [
        [-22, 6],
        [22, 0],
        [-22, -6 + compression / 2],
        [22, top],
      ],
      "#7d8c75",
      4,
    );
    rr(c, -w / 2, top - 6, w, 11, 5, "#edbd64", "#9d8350", 2);
    line(
      c,
      [
        [-w / 2 + 7, top - 3],
        [w / 2 - 7, top - 3],
      ],
      "#ffe3a0",
      2,
    );
    c.restore();
  }
  function sling(c, x, y, pull, front = false) {
    const bx = pull ? pull.x : x,
      by = pull ? pull.y : y;
    c.save();
    c.lineCap = "round";
    c.lineJoin = "round";
    if (!front) {
      ellipse(c, x + 5, 744, 41, 7, "#8aa16945");
      path(
        c,
        [
          [x - 9, 739],
          [x - 13, y + 51],
          [x - 32, y + 9],
          [x - 30, y - 15],
          [x - 17, y - 17],
          [x - 13, y + 12],
          [x + 1, y + 39],
          [x + 22, y + 9],
          [x + 24, y - 18],
          [x + 39, y - 17],
          [x + 40, y + 12],
          [x + 14, y + 55],
          [x + 14, 737],
        ],
        "#b68952",
        "#79633f",
        3,
      );
      line(
        c,
        [
          [x + 5, 727],
          [x + 3, y + 54],
          [x + 30, y + 14],
          [x + 32, y - 9],
        ],
        "#dbb175",
        5,
      );
      for (let i = 0; i < 3; i++)
        line(
          c,
          [
            [x - 13, 704 + i * 8],
            [x + 13, 700 + i * 8],
          ],
          "#957345",
          3,
        );
      line(
        c,
        [
          [x + 31, y - 6],
          [bx, by + 6],
        ],
        "#634b36",
        8,
      );
      line(
        c,
        [
          [x + 31, y - 8],
          [bx, by + 4],
        ],
        "#9c7350",
        3,
      );
      rr(c, x + 22, y - 16, 20, 17, 4, "#947147", "#715c3d", 2);
    } else {
      line(
        c,
        [
          [x - 23, y - 5],
          [bx, by + 8],
        ],
        "#69503b",
        8,
      );
      line(
        c,
        [
          [x - 23, y - 7],
          [bx, by + 6],
        ],
        "#b28957",
        2,
      );
      rr(c, x - 34, y - 16, 21, 17, 4, "#ad8c59", "#715c3d", 2);
      if (pull) rr(c, bx - 12, by + 13, 24, 7, 3, "#836346", "#6d543b", 1.4);
    }
    c.restore();
  }
  function pennant(c, x, y, t) {
    line(
      c,
      [
        [x, y + 52],
        [x, y - 25],
      ],
      "#81906d",
      3,
    );
    c.beginPath();
    c.moveTo(x, y - 25);
    c.quadraticCurveTo(x + 20, y - 34 + Math.sin(t) * 2, x + 44, y - 23);
    c.lineTo(x + 34, y - 12);
    c.lineTo(x + 44, y - 3);
    c.quadraticCurveTo(x + 18, y - 13, x, y - 5);
    c.closePath();
    c.fillStyle = "#f0b75e";
    c.fill();
    c.strokeStyle = "#b39351";
    c.lineWidth = 1.5;
    c.stroke();
  }
  function homeScene(c, t) {
    const ground = 741;
    ellipse(c, 1090, ground + 5, 200, 10, "#809a6430");
    block(c, 953, 689, 26, 100);
    block(c, 1089, 689, 26, 100);
    block(c, 1021, 629, 183, 23);
    pig(c, 1020, 710, 29, false, Math.sin(t) * 0.025, "normal", t);
    block(c, 976, 563, 24, 106, "glass");
    block(c, 1067, 563, 24, 106, "glass");
    block(c, 1021, 499, 149, 23);
    pig(c, 1020, 590, 29, false, 0, "normal", t);
    block(c, 993, 449, 22, 77);
    block(c, 1052, 449, 22, 77);
    block(c, 1023, 402, 105, 19);
    pig(c, 1023, 373, 30, true, Math.sin(t * 0.7) * 0.025, "normal", t);
    tnt(c, 1158, 716);
    block(c, 1199, 687, 24, 105, "stone");
    block(c, 1150, 625, 125, 20);
    pig(c, 1184, 596, 27, false, 0, "normal", t);
    pennant(c, 1238, 550, t);
    block(c, 1120, 689, 18, 83, "glass");
    block(c, 928, 729, 62, 23, "stone");
    rock(c, 1257, 714, 29, 0.3);
    c.save();
    c.strokeStyle = "#799e8470";
    c.lineWidth = 2;
    c.setLineDash([3, 10]);
    c.beginPath();
    c.moveTo(563, 612);
    c.bezierCurveTo(683, 200, 860, 207, 953, 384);
    c.stroke();
    c.restore();
    for (const [x, y, r] of [
      [792, 239, 7],
      [883, 296, 5],
      [694, 330, 5],
    ]) {
      star(c, x, y + Math.sin(t * 0.9 + x) * 3, r, "#eec778", t * 0.05);
    }
    sling(c, 512, 629, { x: 483, y: 650 }, false);
    bird(c, 483, 650, 30, "red", -0.12, "normal", t);
    sling(c, 512, 629, { x: 483, y: 650 }, true);
    c.save();
    c.translate(787, 337 + Math.sin(t * 1.7) * 6);
    c.rotate(-0.15);
    line(
      c,
      [
        [-76, 16],
        [-109, 25],
      ],
      "#94b8a3",
      3,
    );
    line(
      c,
      [
        [-72, 30],
        [-88, 35],
      ],
      "#a5c5ae",
      3,
    );
    bird(c, 0, 0, 63, "red", 0, "flying", t);
    c.restore();
    bird(
      c,
      688,
      477 + Math.sin(t * 1.6 + 1) * 5,
      37,
      "yellow",
      -0.22,
      "flying",
      t,
    );
    bird(c, 424, 715, 24, "black", -0.1, "normal", t);
    bush(c, 1325, 755, 0.6, "#81a369");
    grass(c, 1168, 749, 1.3);
    grass(c, 570, 754, 1.1);
    grass(c, 456, 748, 0.9);
  }
  function foreground(c) {
    grass(c, 195, 745, 1.1);
    grass(c, 775, 748, 0.9);
    grass(c, 1270, 752, 1.1);
  }
  window.Art = {
    C,
    rr,
    ellipse,
    path,
    line,
    star,
    cloud,
    background,
    bird,
    pig,
    block,
    tnt,
    rock,
    spring,
    sling,
    homeScene,
    foreground,
  };
})();
