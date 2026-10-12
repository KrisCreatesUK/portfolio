import * as THREE from "three";

/* Canvas-drawn textures — no font files fetched, no external assets. */

export function labelTexture(lines, opts = {}) {
  const {
    width = 512,
    height = 128,
    bg = "rgba(0,0,0,0)",
    color = "#7fa08f",
    size = 30,
    weight = 700,
    spacing = 6,
    align = "left",
    font = "monospace",
  } = opts;

  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const g = c.getContext("2d");

  g.fillStyle = bg;
  g.fillRect(0, 0, width, height);
  g.textBaseline = "middle";
  g.textAlign = align;

  const x = align === "center" ? width / 2 : align === "right" ? width - 16 : 16;
  const step = height / (lines.length + 1);

  lines.forEach((line, i) => {
    const s = line.size ?? size;
    g.font = `${line.weight ?? weight} ${s}px ${line.font ?? font}`;
    g.fillStyle = line.color ?? color;
    const text = (line.text ?? line).toString();
    const tracked = line.spacing ?? spacing;

    if (tracked) {
      let cursor = x;
      const total = [...text].reduce((a, ch) => a + g.measureText(ch).width + tracked, 0);
      if (align === "center") cursor = (width - total) / 2;
      g.textAlign = "left";
      for (const ch of text) {
        g.fillText(ch, cursor, step * (i + 1));
        cursor += g.measureText(ch).width + tracked;
      }
      g.textAlign = align;
    } else {
      g.fillText(text, x, step * (i + 1));
    }
  });

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* Floor grid that fades out towards the edge */
export function gridTexture(accent = "#57B41A") {
  const S = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d");

  g.fillStyle = "#040706";
  g.fillRect(0, 0, S, S);

  const cell = S / 24;
  g.strokeStyle = "rgba(83,120,110,0.34)";
  g.lineWidth = 1.4;

  for (let i = 0; i <= 24; i++) {
    g.beginPath();
    g.moveTo(i * cell, 0);
    g.lineTo(i * cell, S);
    g.stroke();
    g.beginPath();
    g.moveTo(0, i * cell);
    g.lineTo(S, i * cell);
    g.stroke();
  }

  /* accent cross through the middle */
  g.strokeStyle = accent;
  g.globalAlpha = 0.25;
  g.lineWidth = 2.5;
  g.beginPath();
  g.moveTo(S / 2, 0);
  g.lineTo(S / 2, S);
  g.moveTo(0, S / 2);
  g.lineTo(S, S / 2);
  g.stroke();
  g.globalAlpha = 1;

  /* radial fade */
  const grad = g.createRadialGradient(S / 2, S / 2, S * 0.08, S / 2, S / 2, S * 0.5);
  grad.addColorStop(0, "rgba(4,7,6,0)");
  grad.addColorStop(0.55, "rgba(4,7,6,0.35)");
  grad.addColorStop(1, "rgba(3,4,4,1)");
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* Crop a texture to fill a given aspect ratio without squashing it */
export function cover(tex, aspect) {
  if (!tex?.image) return tex;
  const imgAspect = tex.image.width / tex.image.height;
  tex.center.set(0.5, 0.5);

  if (imgAspect > aspect) {
    const r = aspect / imgAspect;
    tex.repeat.set(r, 1);
  } else {
    const r = imgAspect / aspect;
    tex.repeat.set(1, r);
  }
  tex.needsUpdate = true;
  return tex;
}

/* =========================================================
   FILM
   ---------------------------------------------------------
   A length of stock: sprocket holes down both edges and a
   frame line between each frame. Drawn once and tiled, so
   running it is a matter of moving the offset rather than
   redrawing anything.
   ========================================================= */
export function filmTexture(accent = "#FF5C8A") {
  const W = 512;
  const H = 128;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");

  g.fillStyle = "#0a0d10";
  g.fillRect(0, 0, W, H);

  /* the picture area, a shade lighter than the stock */
  g.fillStyle = "#141a20";
  g.fillRect(0, H * 0.26, W, H * 0.48);

  /* four frames across, with a line between them */
  g.strokeStyle = "rgba(190,210,225,0.22)";
  g.lineWidth = 2;
  for (let i = 0; i <= 4; i++) {
    const x = (i * W) / 4;
    g.beginPath();
    g.moveTo(x, H * 0.26);
    g.lineTo(x, H * 0.74);
    g.stroke();
  }

  /* sprockets top and bottom */
  g.fillStyle = "#04070a";
  const holes = 8;
  for (let i = 0; i < holes; i++) {
    const x = (i + 0.5) * (W / holes) - W / holes / 4;
    const w = W / holes / 2;
    g.fillRect(x, H * 0.07, w, H * 0.12);
    g.fillRect(x, H * 0.81, w, H * 0.12);
  }

  /* a wash of the product colour through the picture area */
  g.fillStyle = accent;
  g.globalAlpha = 0.14;
  g.fillRect(0, H * 0.26, W, H * 0.48);
  g.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
