function e(e,t){let n=[],r=(e,t,r,i)=>{e.addEventListener(t,r,i),n.push([e,t,r,i])},i=t=>(t.clientX-e.getBoundingClientRect().left)/d,a=t=>(t.clientY-e.getBoundingClientRect().top)/d,o=(t,n)=>t>=0&&n>=0&&t<=e.clientWidth&&n<=e.clientHeight,s=1/240,c=25,l={reach:120,awareness:220,maxStrands:6,snapStretch:1.6,maxLen:160,creep:.25,slither:1,whip:1,magnet:1.6,grip:1,thickness:1,pull:1,gravity:900,sheen:0};({...l});let u=matchMedia(`(prefers-reduced-motion: reduce)`).matches,d=t.scale||1,f=()=>Math.max(1,e.clientWidth/d),p=()=>Math.max(1,e.clientHeight/d),m=t.fontFamily||`"Instrument Serif", ui-serif, Georgia, serif`,h=t.fontWeight||400,g=document.fonts?document.fonts.load(`${h} 120px ${m}`).catch(()=>{}):Promise.resolve(),_=e=>{let t=parseInt(e.replace(`#`,``),16);return[(t>>16&255)/255,(t>>8&255)/255,(t&255)/255]},v=e=>e.map(e=>e**2.2),y=v(_(t.gooColor||`#ffb867`)).map((e,t)=>e*[1.05,.82,.62][t]),b=v(_(t.labelColor||`#f4f2ec`)),x=_(t.floorColor||`#070503`),ee=t.label,S=t.labelSize||19,C=t.liftH||14,te=0,w=t.canvas,T=t.button,E=[],D=[],O=[],ne=2.3,k={m:0,mV:0,s:ne,v:0,ang:0,angV:0,on:!1,ready:!1,coat:-60,coatV:0,thr:.8,ox:0,oy:0,oxV:0,oyV:0},A=Math.atan2(15.5,5.7),j=[{a:[8.45,4.4],b:[9.6,10.8],hw:1.5,turns:2.4,t0:.12,t1:.78},{a:[12.45,8.4],b:[12.6,12.8],hw:1.38,turns:1.6,t0:.12,t1:.82},{a:[13.7,16.9],b:[13.7,20.1],hw:4.1,turns:1.4,t0:.08,t1:.92},{a:[16,8.6],b:[16.1,12.8],hw:1.55,turns:1.6,t0:.12,t1:.82},{a:[4.6,11.4],b:[7.4,14.6],hw:1.25,turns:1.7,t0:.1,t1:.82},{a:[19.3,9.6],b:[19.6,12.8],hw:1.1,turns:1.4,t0:.12,t1:.86}],M={x:-1e4,y:-1e4,vx:0,vy:0,lx:-1e4,ly:-1e4,present:!1,down:!1,mouse:!1,t:0},N={cx:0,cy:0,hw:150,hh:30,lbw:72,lbh:18,top:14,sink:5,dome:1.2,lift:0,liftV:0,press:0,pressV:0,pressTarget:0,intro:+!!u,introV:0},P={x:0,y:0,amt:0,v:0},F={x:0,y:0,amt:0,v:0},I=u?3:0,L=-1,re=-1,ie=-1,ae=2.6,oe=0,se=0,ce=0,R=1,z=1,le=1,ue=1,B=18,V=24,H=(e,t,n)=>e<t?t:e>n?n:e,de=(e,t,n)=>{let r=H((n-e)/(t-e),0,1);return r*r*(3-2*r)},U=(e,t)=>e+Math.random()*(t-e);function W(e,t,n,r,i,a,o){e[n]+=(i*i*(r-e[t])-2*a*i*e[n])*o,e[t]+=e[n]*o}let G=w.getContext(`webgl2`,{antialias:!1,alpha:!0,premultipliedAlpha:!0,depth:!1,stencil:!1,powerPreference:`high-performance`});if(!G)return null;e.classList.add(`has-gl`);let fe=!!(G.getExtension(`EXT_color_buffer_float`)||G.getExtension(`EXT_color_buffer_half_float`));G.getParameter(G.MAX_FRAGMENT_UNIFORM_VECTORS)<900&&(B=6,V=3);let pe=`#version 300 es
precision highp float;
precision highp int;
#define MAXS ${B}
#define NP 14
#define MAXB 5
#define MAXR 6
#define MAXBR 9
#define MAXC ${V}
#define WP 18
${fe?``:`#define ENC8 1`}

uniform vec2 uRes;
uniform float uDpr;
uniform float uTime;
uniform int uNC;
uniform vec4 uCoil[MAXC * WP]; // goo coils wrapped around the hand (xyz + r)
uniform vec4 uCBox[MAXC];
uniform sampler2D uHandSDF;    // signed distance of the hand icon, in icon units (24-unit frame)
uniform sampler2D uArrowSDF;   // same for the arrow icon
uniform float uMorph;         // 0 = arrow, 1 = hand
uniform vec4 uHand;            // hotspot x, y, px per icon unit, visible
uniform vec4 uHand2;           // cos, sin of tilt, slab centre z, slab half thickness
uniform vec3 uCoat;            // engulf front (px of pill distance), softness, patch threshold
uniform vec4 uBtn;     // cx, cy, half width, half height
uniform vec4 uBtnZ;    // top, sink, dome, flow amplitude
uniform vec4 uBtnZ2;   // lift off the floor, bevel radius
uniform vec4 uPull;    // x, y, amount, sigma
uniform vec4 uPeak;    // x, y, amount, sigma
uniform int uNS;
uniform vec4 uPts[MAXS * NP];  // xyz + radius
uniform vec4 uBox[MAXS];       // strand 2D bounds
uniform vec4 uAnc[MAXS];       // anchor x, y, mound, sigma
uniform vec4 uAncD[MAXS];      // pull direction xy, elongation
uniform int uNBr;
uniform vec4 uBr[MAXBR * 3];   // silk bridges: a, sag midpoint, b (xyz + r)
uniform int uNB;
uniform vec4 uBlob[MAXB];      // x, y, z, r
uniform float uBlobZ[MAXB];    // vertical squash
uniform vec4 uRip[MAXR];       // x, y, age, amp
uniform sampler2D uLabel;
uniform vec4 uLabelBox;
uniform float uEmboss;
uniform float uZTop;
uniform vec3 uK;               // smooth radii: strand-strand, strand-button, blob

out vec4 outG;

uint gMask[MAXS];
uint gCMask[MAXC];
bool gBlob[MAXB];
bool gBr[MAXBR];
bool gHand;
const vec2 HOT = vec2(8.0, 3.0);    // hotspot of the hand icon (index fingertip)
const vec2 HOT_A = vec2(6.1, 0.9);  // hotspot of the arrow icon (its tip)

vec2 iconQ(vec2 p, vec2 hot) {
  vec2 d = p - uHand.xy;
  return vec2(uHand2.x * d.x + uHand2.y * d.y, -uHand2.y * d.x + uHand2.x * d.y) / uHand.z + hot;
}
float iconSdf(sampler2D t, vec2 q) {
  vec2 qc = clamp(q, vec2(0.0), vec2(24.0));
  return textureLod(t, qc / 24.0, 0.0).r + length(q - qc);
}
// the cursor icon as a thin floating slab. Arrow and hand distance fields are blended, so the
// silhouette flows from one shape into the other while both hotspots stay pinned to the pointer
float hand2D(vec2 p) {
  float dh = uMorph > 0.001 ? iconSdf(uHandSDF, iconQ(p, HOT)) : 0.0;
  float da = uMorph < 0.999 ? iconSdf(uArrowSDF, iconQ(p, HOT_A)) : 0.0;
  return mix(da, dh, uMorph) * uHand.z;
}
float sdHand(float h2, float z, float th) {
  return length(vec2(max(h2 + th, 0.0), z - uHand2.z)) - th;
}

float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash12(i), b = hash12(i + vec2(1, 0)), c = hash12(i + vec2(0, 1)), d = hash12(i + vec2(1, 1));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { s += a * vnoise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p + 3.1; a *= 0.5; }
  return s;
}
float smin(float a, float b, float k) { float h = max(k - abs(a - b), 0.0) / k; return min(a, b) - h * h * k * 0.25; }

// 2D pill distance + surface displacement (both depend only on xy, so a vertical ray computes them once)
vec2 button2D(vec2 p) {
  vec2 q = p - uBtn.xy;
  float d = length(vec2(max(abs(q.x) - (uBtn.z - uBtn.w), 0.0), q.y)) - uBtn.w;
  if (d > 110.0) return vec2(d, 0.0);
  float inner = clamp(-d / uBtn.w, 0.0, 1.0);
  float disp = uBtnZ.z * (1.0 - (1.0 - inner) * (1.0 - inner));
  // everything below only lifts the top surface: zero at the outline, so the pill never changes size;
  // the reaching happens through the strands that leave it
  float body = smoothstep(1.0, -14.0, d);
  float lift = 0.0;
  // living surface: a slow, broad swell only, so the pill keeps its shape and reads like poured glass
  float t = uTime;
  vec2 nq = q * 0.008;
  vec2 w = vec2(vnoise(nq + vec2(t * 0.07, -t * 0.05)), vnoise(nq * 1.3 + vec2(-t * 0.06, t * 0.04) + 4.7));
  lift += (vnoise(nq * 1.2 + 1.2 * w) - 0.5) * uBtnZ.w;
  vec2 dp = p - uPull.xy;
  lift += uPull.z * exp(-dot(dp, dp) / (2.0 * uPull.w * uPull.w));
  dp = p - uPeak.xy;
  float rr = dot(dp, dp) / (uPeak.w * uPeak.w);
  lift += uPeak.z / ((1.0 + rr) * (1.0 + rr));
  for (int i = 0; i < MAXS; i++) {
    if (i >= uNS) break;
    vec4 an = uAnc[i];
    if (an.z <= 0.0) continue;
    vec4 ad = uAncD[i];
    dp = p - an.xy;
    float al = dot(dp, ad.xy), ac = dp.x * ad.y - dp.y * ad.x;
    float sl = an.w * (1.0 + ad.z), a0 = an.w * ad.z * 0.7;
    lift += an.z * exp(-ac * ac / (2.0 * an.w * an.w) - (al - a0) * (al - a0) / (2.0 * sl * sl));
  }
  for (int i = 0; i < MAXR; i++) {
    vec4 r = uRip[i];
    if (r.w <= 0.0) continue;
    // melted-rubber settle: one soft swell that spreads and sinks, no rings
    float sg = 12.0 + r.z * 40.0, rd = length(p - r.xy);
    lift += r.w * 0.6 * exp(-rd * rd / (2.0 * sg * sg)) * exp(-r.z * 5.0);
  }
  disp += lift * body;
  if (uEmboss > 0.0) {
    vec2 lu = (p - uLabelBox.xy) / (2.0 * uLabelBox.zw) + 0.5;
    if (lu.x > 0.0 && lu.y > 0.0 && lu.x < 1.0 && lu.y < 1.0) disp += uEmboss * textureLod(uLabel, lu, 2.0).a;
  }
  return vec2(d, disp);
}

// a slab of goo with a tight bevel, so the gloss runs right up to a crisp border; uBtnZ2.x lifts it off the floor
float sdButton(vec2 bd, float z) {
  float hh = 0.5 * (uBtnZ.x + uBtnZ.y), zc = 0.5 * (uBtnZ.x - uBtnZ.y) + uBtnZ2.x;
  float re = min(uBtnZ2.y, hh);
  vec2 w = vec2(bd.x + re, abs(z - zc) - hh + re);
  return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - re - bd.y;
}
float sdSeg(vec3 p, vec4 a, vec4 b) {
  vec3 pa = p - a.xyz, ba = b.xyz - a.xyz;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0);
  return length(pa - ba * h) - mix(a.w, b.w, h);
}
float sdEll(vec3 p, vec3 r) { float k0 = length(p / r); float k1 = length(p / (r * r)); return k0 * (k0 - 1.0) / max(k1, 1e-5); }

float map(vec3 p, vec2 bd, float h2, out float dB, out float dS, out float dH) {
  dB = sdButton(bd, p.z);
  float ds = 1e5;
  for (int s = 0; s < MAXS; s++) {
    if (s >= uNS) break;
    uint m = gMask[s];
    if (m == 0u) continue;
    float dd = 1e5;
    for (int j = 0; j < NP - 1; j++) {
      if ((m & (1u << uint(j))) == 0u) continue;
      dd = min(dd, sdSeg(p, uPts[s * NP + j], uPts[s * NP + j + 1]));
    }
    ds = smin(ds, dd, uK.x);
  }
  for (int b = 0; b < MAXBR; b++) {
    if (b >= uNBr) break;
    if (!gBr[b]) continue;
    vec4 a = uBr[b * 3], m = uBr[b * 3 + 1], c = uBr[b * 3 + 2];
    ds = smin(ds, min(sdSeg(p, a, m), sdSeg(p, m, c)), uK.x * 0.6);
  }
  for (int b = 0; b < MAXB; b++) {
    if (b >= uNB) break;
    if (!gBlob[b]) continue;
    vec4 bl = uBlob[b];
    ds = smin(ds, sdEll(p - bl.xyz, vec3(bl.w, bl.w, bl.w * uBlobZ[b])), uK.z);
  }
  for (int c = 0; c < MAXC; c++) {
    if (c >= uNC) break;
    uint m = gCMask[c];
    if (m == 0u) continue;
    for (int j = 0; j < WP - 1; j++) {
      if ((m & (1u << uint(j))) == 0u) continue;
      ds = smin(ds, sdSeg(p, uCoil[c * WP + j], uCoil[c * WP + j + 1]), 0.8);
    }
  }
  dH = 1e5;
  if (gHand) {
    dH = sdHand(h2, p.z, uHand2.w);
    // the closer the hand is to the body, the more the goo takes it over: a shell creeps across the
    // icon from whatever is nearest the button (uneven, living front), fully sealing it over the button
    if (uCoat.x > -uCoat.y) {
      // goo blends onto the icon in drifting patches; the threshold keeps most of the icon visible
      float n = 0.6 * vnoise(p.xy * 0.075 + vec2(uTime * 0.55, -uTime * 0.35)) + 0.4 * vnoise(p.xy * 0.16 - vec2(uTime * 0.8, uTime * 0.45));
      float coat = clamp((uCoat.x - bd.x) / uCoat.y, 0.0, 1.0) * smoothstep(uCoat.z, uCoat.z + 0.12, n);
      if (coat > 0.0) {
        float sh = 2.8 * coat - 0.9;
        ds = smin(ds, sdHand(h2 - sh, p.z, uHand2.w + sh), 2.5);
      }
    }
  }
  dS = ds;
  float dg = smin(dB, ds, uK.y);
  if (!gHand) return dg;
  return smin(dg, dH, 1.2);  // goo clings to the icon with a tiny meniscus
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;

  // per-pixel candidate segments: a vertical ray never gets closer than the 2D distance
  for (int s = 0; s < MAXS; s++) {
    gMask[s] = 0u;
    if (s >= uNS) continue;
    vec4 bb = uBox[s];
    if (p.x < bb.x || p.y < bb.y || p.x > bb.z || p.y > bb.w) continue;
    uint m = 0u;
    for (int j = 0; j < NP - 1; j++) {
      vec4 a = uPts[s * NP + j], b = uPts[s * NP + j + 1];
      vec2 pa = p - a.xy, ba = b.xy - a.xy;
      float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0);
      if (length(pa - ba * h) - max(a.w, b.w) < uK.y + 2.0) m |= (1u << uint(j));
    }
    gMask[s] = m;
  }
  for (int b = 0; b < MAXB; b++) {
    gBlob[b] = false;
    if (b >= uNB) continue;
    gBlob[b] = length(p - uBlob[b].xy) - uBlob[b].w < uK.y + uK.z + 2.0;
  }
  for (int b = 0; b < MAXBR; b++) {
    gBr[b] = false;
    if (b >= uNBr) continue;
    vec2 lo = min(min(uBr[b * 3].xy, uBr[b * 3 + 1].xy), uBr[b * 3 + 2].xy) - uK.x - 3.0;
    vec2 hi = max(max(uBr[b * 3].xy, uBr[b * 3 + 1].xy), uBr[b * 3 + 2].xy) + uK.x + 3.0;
    gBr[b] = all(greaterThan(p, lo)) && all(lessThan(p, hi));
  }
  for (int c = 0; c < MAXC; c++) {
    gCMask[c] = 0u;
    if (c >= uNC) continue;
    vec4 bb = uCBox[c];
    if (p.x < bb.x || p.y < bb.y || p.x > bb.z || p.y > bb.w) continue;
    uint m = 0u;
    for (int j = 0; j < WP - 1; j++) {
      vec4 a = uCoil[c * WP + j], b = uCoil[c * WP + j + 1];
      vec2 pa = p - a.xy, ba = b.xy - a.xy;
      float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0);
      if (length(pa - ba * h) - max(a.w, b.w) < uK.y + 2.0) m |= (1u << uint(j));
    }
    gCMask[c] = m;
  }
  // icon centre (12,12) sits at offset (4,9) from the hotspot
  vec2 hc = uHand.xy + mat2(uHand2.x, uHand2.y, -uHand2.y, uHand2.x) * (vec2(4.0, 9.0) * uHand.z);
  gHand = uHand.w > 0.5 && length(p - hc) < 17.5 * uHand.z + 4.0;

  vec2 bd = button2D(p);
  float h2 = gHand ? hand2D(p) : 1e5;
  float z = uZTop, minD = 1e5, dB, dS, dH;
  bool hit = false;
  for (int i = 0; i < 64; i++) {
    float d = map(vec3(p, z), bd, h2, dB, dS, dH);
    minD = min(minD, d);
    if (d < 0.02) { hit = true; break; }
    z -= max(d * 0.8, 0.01);
    if (z < 0.0) break;
  }
  if (!hit) {
#ifdef ENC8
    outG = vec4(clamp(minD / 4.0, 0.0, 1.0), 0.0, 0.0, 0.0);
#else
    outG = vec4(minD, 0.0, 0.0, 0.0);
#endif
    return;
  }

  vec3 pos = vec3(p, z);
  const vec2 k = vec2(1.0, -1.0);
  const float e = 0.3;
  float t0, t1, t2;
  vec3 n = k.xyy * map(pos + k.xyy * e, button2D(pos.xy + k.xy * e), gHand ? hand2D(pos.xy + k.xy * e) : 1e5, t0, t1, t2)
         + k.yyx * map(pos + k.yyx * e, button2D(pos.xy + k.yy * e), gHand ? hand2D(pos.xy + k.yy * e) : 1e5, t0, t1, t2)
         + k.yxy * map(pos + k.yxy * e, button2D(pos.xy + k.yx * e), gHand ? hand2D(pos.xy + k.yx * e) : 1e5, t0, t1, t2)
         + k.xxx * map(pos + k.xxx * e, button2D(pos.xy + k.xx * e), gHand ? hand2D(pos.xy + k.xx * e) : 1e5, t0, t1, t2);
  n = normalize(n);
  // material: 0 floor, 1..2 goo (button → strand), 3 hand icon
  float mat = dH < min(dB, dS) - 0.05 ? 3.0 : 1.0 + smoothstep(-1.5, 1.5, dB - dS);
#ifdef ENC8
  outG = vec4(n.xy * 0.5 + 0.5, z / 128.0, mat * 0.25);
#else
  outG = vec4(n.xy, z, mat);
#endif
}`,me=`#version 300 es
precision highp float;
${fe?``:`#define ENC8 1`}
uniform sampler2D uG;
uniform sampler2D uLabel;
uniform vec2 uRes;
uniform float uDpr;
uniform float uTime;
uniform vec4 uLabelBox;
uniform float uLabelAmt;
uniform float uLabelLod;
uniform float uIri;
uniform vec3 uGoo;
uniform vec3 uLabelCol;
uniform vec3 uFloor;
uniform float uZMax;
uniform float uLift;
uniform vec4 uBtnP;   // button centre and half size, for the face's planar reflection
uniform vec2 uWin;    // window reflection centre x and half width, in button half-widths
uniform vec2 uBtnH;   // button top height and current lift, px (for its floor shadow)
uniform sampler2D uHandCol;
uniform sampler2D uArrowCol;
uniform float uMorph;
uniform vec4 uHand;
uniform vec4 uHand2;
out vec4 outC;

vec3 KEY;

vec4 dec(vec4 g) {
#ifdef ENC8
  if (g.a < 0.1) return vec4(g.r * 4.0, 0.0, 0.0, 0.0);
  return vec4(g.rg * 2.0 - 1.0, g.b * 128.0, g.a * 4.0);
#else
  return g;
#endif
}
float decH(vec4 g) {
#ifdef ENC8
  return g.b * 128.0;
#else
  return g.b;
#endif
}
vec2 uvOf(vec2 p) { return vec2(p.x * uDpr / uRes.x, 1.0 - p.y * uDpr / uRes.y); }
vec4 gAt(ivec2 c) { return dec(texelFetch(uG, clamp(c, ivec2(0), ivec2(uRes) - 1), 0)); }
float hAt(vec2 p, float lod) { return decH(textureLod(uG, uvOf(p), lod)); }
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }

float softShadow(vec2 p, float h0) {
  vec2 L2 = normalize(KEY.xy);
  float tanE = KEY.z / length(KEY.xy);
  float res = 1.0, s = 1.0;
  for (int i = 0; i < 28; i++) {
    float zr = h0 + s * tanE;
    if (zr > uZMax) break;
    float hgt = hAt(p + L2 * s, log2(1.0 + s * 0.08 * uDpr));
    res = min(res, (1.5 - 0.7 * uLift) * (zr - hgt) / s);
    if (res < -0.2) break;
    s += 0.8 + s * 0.14;
  }
  res = clamp(res, 0.0, 1.0);
  return res * res * (3.0 - 2.0 * res);
}
float occlusion(vec2 p, float h) {
  vec2 uv = uvOf(p);
  float o = 0.0;
  o += 0.50 * clamp((decH(textureLod(uG, uv, log2(6.0 * uDpr))) - h) / 9.0, 0.0, 1.0);
  o += 0.32 * clamp((decH(textureLod(uG, uv, log2(20.0 * uDpr))) - h) / 26.0, 0.0, 1.0);
  o += 0.26 * clamp((decH(textureLod(uG, uv, log2(60.0 * uDpr))) - h) / 60.0, 0.0, 1.0);
  return clamp(1.0 - o, 0.0, 1.0);
}
bool isNear(vec2 p) {
  float l = log2(96.0 * uDpr);
  float m = max(max(hAt(p + vec2(48.0, 48.0), l), hAt(p + vec2(-48.0, 48.0), l)),
                max(hAt(p + vec2(48.0, -48.0), l), hAt(p + vec2(-48.0, -48.0), l)));
  return max(m, hAt(p, l)) > 0.02;
}

float softbox(vec3 R, vec3 c, vec2 size, float edge) {
  float cd = dot(R, c);
  if (cd <= 0.0) return 0.0;
  vec3 t1 = normalize(cross(c, vec3(0.0, 0.0, 1.0)));
  vec3 t2 = cross(t1, c);
  vec2 q = abs(vec2(dot(R, t1), dot(R, t2)) / cd) / size;
  return (1.0 - smoothstep(edge, 1.0, q.x)) * (1.0 - smoothstep(edge, 1.0, q.y)) * (0.85 + 0.15 * (1.0 - q.y));
}
float vn(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x), mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}
// a living room up and to the left, where the key light comes from: a daylight window with mullions and a
// tree line, a warm wall and a lamp around it. Slightly saturated so the goo feels like it sits in a real
// place; outside this patch of the sky everything stays studio black
vec3 room(vec3 R) {
  vec3 c = normalize(vec3(-0.34, -0.42, 0.84));
  float cd = dot(R, c);
  if (cd <= 0.2) return vec3(0.0);
  vec3 t1 = normalize(cross(c, vec3(0.0, 0.0, 1.0)));
  vec3 t2 = cross(t1, c);                       // points up the wall
  vec2 w = vec2(dot(R, t1), dot(R, t2)) / cd / vec2(0.34, 0.28); // window space: |w| < 1 is glass
  float wallMask = 1.0 - smoothstep(1.3, 2.3, length(w * vec2(0.8, 1.0)));
  vec3 col = vec3(0.92, 0.78, 0.6) * 0.3 * wallMask;                        // warm plaster
  float shelf = smoothstep(-2.3, -2.2, w.y) * (1.0 - smoothstep(-1.35, -1.25, w.y));
  col = mix(col, vec3(0.3, 0.18, 0.1) * 0.5, shelf * wallMask);             // walnut sideboard
  vec2 lp = w - vec2(1.75, -0.55);
  col += vec3(1.0, 0.7, 0.4) * 5.0 * exp(-dot(lp, lp) / 0.05);              // lamp
  vec2 aw = abs(w);
  float glass = (1.0 - smoothstep(0.94, 1.0, aw.x)) * (1.0 - smoothstep(0.94, 1.0, aw.y));
  if (glass > 0.0) {
    float v = w.y * 0.5 + 0.5;
    vec3 sky = mix(vec3(1.0, 0.92, 0.8), vec3(0.6, 0.76, 1.0), smoothstep(0.2, 1.0, v)) * 16.0;
    float line = 0.3 + 0.16 * vn(vec2(w.x * 4.0, 3.1)) + 0.07 * vn(vec2(w.x * 11.0, 7.3));
    float tree = 1.0 - smoothstep(line - 0.03, line + 0.03, v);
    vec3 green = mix(vec3(0.16, 0.3, 0.12), vec3(0.32, 0.45, 0.2), vn(w * 9.0)) * 3.0;
    vec3 view = mix(sky, green, tree);
    float mull = max(1.0 - smoothstep(0.025, 0.05, aw.x), 1.0 - smoothstep(0.025, 0.05, abs(w.y - 0.1)));
    view = mix(view, vec3(0.85, 0.8, 0.72) * 0.6, mull);                    // window frame
    col = mix(col, view, glass);
  }
  return col;
}

// black-product studio: flags absorb everything, so the body stays jet black and the only
// reflections are shaped sources that describe the form
vec3 env(vec3 R) {
  vec2 rd = normalize(R.xy + vec2(1e-5));
  float keySide = 0.5 + 0.5 * dot(rd, normalize(KEY.xy));
  // white floor seen at grazing angles: a faint bounce that dies out quickly under the goo
  if (R.z < 0.0) return mix(vec3(0.012) * keySide, vec3(0.0015), smoothstep(0.0, -0.22, R.z));
  vec3 c = vec3(0.0015);
  // the room reflection up and to the left replaces the plain key window
  c += room(R);
  // low strip lights left and right: thin rim lines that trace the contour of the caps and strands
  c += vec3(1.0) * 7.0 * softbox(R, normalize(vec3(-0.96, 0.08, 0.2)), vec2(0.75, 0.035), 0.7);
  c += vec3(1.0) * 5.0 * softbox(R, normalize(vec3(0.95, -0.12, 0.24)), vec2(0.75, 0.035), 0.7);
  // small high kicker bottom right: a second, smaller specular so curves read as round
  c += vec3(1.0) * 5.0 * softbox(R, normalize(vec3(0.45, 0.55, 0.75)), vec2(0.07, 0.07), 0.5);
  // very dim broad top fill: just enough gradient on the dome to feel curved, never a line
  c += vec3(0.1) * softbox(R, normalize(vec3(0.12, 0.25, 1.0)), vec2(0.8, 0.55), 0.2);
  // white cyc glimpsed only at the very edge: a hairline, not a stripe
  float wall = 1.0 - smoothstep(0.0, 0.1, R.z);
  c += vec3(0.02) * wall * wall * keySide * keySide * keySide;
  return c;
}

// the label is a separate, flat layer of polished silver laid on top of the goo. It is shaded on its own,
// never through the goo's normals, so the letters cannot warp; only their stamped edges catch the light
vec3 shadeLabel(vec2 lu, float sh, float ao) {
  vec2 tx = vec2(2.5 / 1024.0, 2.5 / 256.0);
  float mx = textureLod(uLabel, lu + vec2(tx.x, 0.0), uLabelLod).a - textureLod(uLabel, lu - vec2(tx.x, 0.0), uLabelLod).a;
  float my = textureLod(uLabel, lu + vec2(0.0, tx.y), uLabelLod).a - textureLod(uLabel, lu - vec2(0.0, tx.y), uLabelLod).a;
  vec3 N = normalize(vec3(-mx * 1.1, -my * 1.1, 1.0));
  vec3 R = reflect(vec3(0.0, 0.0, -1.0), N);
  vec3 silver = uLabelCol;
  // polished silver: the classic chrome profile across the letter height (bright sky on top, a darker
  // horizon band through the middle, a lighter floor bounce at the bottom)
  float t = clamp((lu.y - 0.32) / 0.36, 0.0, 1.0);
  float grad = mix(1.0, 0.9, smoothstep(0.3, 1.0, t)); // flat ink, like printed text, not chrome
  vec3 col = silver * grad * (0.82 + 0.18 * sh);
                                               // bevels pick up the room
  // stamped edge: a crisp lit rim on the side facing the key light, a darker one opposite
  float edge = clamp(length(vec2(mx, my)) * 1.6, 0.0, 1.0);
  float facing = dot(normalize(vec2(mx, my) + 1e-5), normalize(KEY.xy));
  col *= 1.0 - 0.25 * edge * smoothstep(0.0, 0.8, -facing);
  col += silver * 0.15 * edge * smoothstep(0.1, 0.9, facing);
  vec3 Hh = normalize(KEY + vec3(0.0, 0.0, 1.0));
  float NdH = max(dot(N, Hh), 0.0), a2 = 0.01;
  return col * mix(0.85, 1.0, ao);
}

// window reflected in the button face, in button space (x / half width, y / half height, y down).
// Out of focus, like a real reflection in matte rubber: no hard frame or fine detail, just soft
// sky, a blurred tree line and the shadow of the sash, dissolving toward its edges
vec3 faceWindow(vec2 b) {
  vec2 w = vec2((b.x - uWin.x + b.y * 0.08) / uWin.y, (b.y + 0.3) / 1.15);
  float fade = 1.0 - smoothstep(0.2, 1.05, length(w * vec2(0.85, 0.8)));
  if (fade <= 0.0) return vec3(0.0);
  float v = 0.5 - 0.5 * w.y;                                     // 1 toward the top of the window
  vec3 sky = mix(vec3(0.95, 0.88, 0.8), vec3(0.66, 0.78, 0.96), smoothstep(0.2, 1.0, v));
  float line = 0.36 + 0.1 * vn(vec2(w.x * 1.6, 2.0));
  float tree = 1.0 - smoothstep(line - 0.2, line + 0.2, v);
  vec3 view = mix(sky, vec3(0.24, 0.36, 0.18) * 0.65, tree * 0.85);
  float sash = 1.0 - smoothstep(0.04, 0.26, abs(w.y + 0.1));
  float stile = 1.0 - smoothstep(0.05, 0.3, abs(w.x));
  view *= 1.0 - 0.5 * max(sash, stile * 0.6);
  return view * 0.14 * fade;
}

vec3 shadeGoo(vec2 p, vec4 g) {
  vec3 N = vec3(g.xy, sqrt(max(1e-4, 1.0 - dot(g.xy, g.xy))));
  float strandness = clamp(g.w - 1.0, 0.0, 1.0);
  vec3 V = vec3(0.0, 0.0, 1.0);
  float NdV = clamp(N.z, 0.03, 1.0);
  vec3 R = reflect(-V, N);
  float F = 0.04 + 0.96 * pow(1.0 - NdV, 5.0);
  float sh = softShadow(p, g.z + 0.6);
  float ao = occlusion(p, g.z);

  // reflections disperse a little: red and blue sample the room from slightly different angles,
  // so window edges and highlights carry thin colour fringes
  vec3 dN = vec3(N.xy, 0.0) * 0.07 + vec3(0.012, 0.008, 0.0);
  vec3 spec = vec3(env(normalize(R + dN)).r, env(R).g, env(normalize(R - dN)).b) * F * mix(0.5, 1.0, min(sh, ao));
  // oily thin-film sheen, biased toward Venom blue / violet
  // cool sheen only (blue → violet), so the rim never picks up warm orange/red fringes
  float fr = pow(1.0 - NdV, 2.0);
  vec3 film = mix(vec3(0.8, 0.88, 1.12), vec3(0.9, 0.86, 1.1), 0.5 + 0.5 * sin((1.0 - NdV) * 9.0));
  spec *= mix(vec3(1.0), film, uIri * fr);
  // tight key sparkle
  vec3 Hh = normalize(KEY + V);
  float NdH = max(dot(N, Hh), 0.0), a2 = 0.0025;
  float D = a2 / (3.14159 * pow(NdH * NdH * (a2 - 1.0) + 1.0, 2.0));
  spec += vec3(0.9, 0.95, 1.0) * D * F * 0.55 * sh;

  // the button's face is matte rubber: a broad soft sheen and a soft glow from the room, no mirror
  // reflections. Tendrils (strandness → 1) keep the glossy goo look
  float matte = (1.0 - strandness) * 0.92;
  float ar2 = 0.16;
  float Dr = ar2 / (3.14159 * pow(NdH * NdH * (ar2 - 1.0) + 1.0, 2.0));
  vec3 cRoom = normalize(vec3(-0.34, -0.42, 0.84));
  vec3 rough = vec3(1.0) * Dr * F * 0.06 * sh
             + vec3(0.95, 0.9, 0.84) * pow(max(dot(R, cRoom), 0.0), 10.0) * F * 0.9;
  spec = mix(spec, rough, matte);

  vec3 diff = uGoo * (0.55 * max(dot(N, KEY), 0.0) * sh + 0.35 * ao);
  spec *= 0.45;
  vec3 col = diff + spec;

  // the living-room window as a flat, planar reflection on the face (top left): it only bends where the
  // bevel curves, so the face reads as a flat sheet of rubber, not a blob of water
  vec2 bq = (p - uBtnP.xy) / uBtnP.zw + N.xy * 1.6;
  vec2 dsp = normalize(bq - vec2(uWin.x, -0.3) + 1e-4) * 0.02;
  vec3 win = vec3(faceWindow(bq + dsp).r, faceWindow(bq).g, faceWindow(bq - dsp).b);
  col += win * matte * mix(0.6, 1.0, ao);

  // rim light along the bevel: cool from the window side (top left), a softer warm kicker from the
  // bottom right, and a slow glint that travels around the contour so the edge catches and shines
  float bevel = 1.0 - smoothstep(0.3, 0.86, N.z);
  vec2 nd = normalize(N.xy + 1e-5);
  float rimL = pow(max(dot(nd, vec2(-0.6, -0.8)), 0.0), 2.0);
  float rimR = pow(max(dot(nd, vec2(0.8, 0.6)), 0.0), 3.0) * 0.55;
  vec2 cq = (p - uBtnP.xy) / uBtnP.zw;
  float glint = pow(0.5 + 0.5 * cos(atan(cq.y, cq.x) - uTime * 0.9), 28.0);
  vec3 rimC = vec3(0.82, 0.9, 1.0) * rimL + vec3(1.0, 0.94, 0.86) * rimR + vec3(1.0) * glint * 1.4;
  col += rimC * bevel * 0.5 * (1.0 - strandness) * mix(0.7, 1.0, sh);

  if (uLabelAmt > 0.0) {
    vec2 lu = (p - uLabelBox.xy) / (2.0 * uLabelBox.zw) + 0.5;
    if (lu.x > 0.0 && lu.y > 0.0 && lu.x < 1.0 && lu.y < 1.0) {
      float m = textureLod(uLabel, lu, uLabelLod).a * (1.0 - smoothstep(0.15, 0.5, strandness)) * uLabelAmt;
      if (m > 0.002) col = mix(col, shadeLabel(lu, sh, ao), m);
    }
  }
  return col;
}

// the Figma hand icon: its own white fill + black outline, lit like a glossy vinyl decal
vec3 shadeHand(vec2 p, vec4 g) {
  vec3 N = vec3(g.xy, sqrt(max(1e-4, 1.0 - dot(g.xy, g.xy))));
  vec2 d = p - uHand.xy;
  vec2 r = vec2(uHand2.x * d.x + uHand2.y * d.y, -uHand2.y * d.x + uHand2.x * d.y) / uHand.z;
  vec4 tc = mix(textureLod(uArrowCol, clamp((r + vec2(6.1, 0.9)) / 24.0, 0.0, 1.0), 0.0),
                textureLod(uHandCol, clamp((r + vec2(8.0, 3.0)) / 24.0, 0.0, 1.0), 0.0), uMorph);
  vec3 alb = pow(mix(vec3(0.0), tc.rgb, smoothstep(0.2, 0.8, tc.a)), vec3(2.2)) * 0.86 + 0.012;
  float sh = softShadow(p, g.z + 0.6);
  float ao = occlusion(p, g.z);
  vec3 R = reflect(vec3(0.0, 0.0, -1.0), N);
  float F = 0.04 + 0.96 * pow(1.0 - clamp(N.z, 0.03, 1.0), 5.0);
  vec3 Hh = normalize(KEY + vec3(0.0, 0.0, 1.0));
  float NdH = max(dot(N, Hh), 0.0), a2 = 0.004;
  float D = a2 / (3.14159 * pow(NdH * NdH * (a2 - 1.0) + 1.0, 2.0));
  // glazed like glass: crisp studio reflections and a tight key sparkle over the icon's own colours
  return alb * (1.2 * max(dot(N, KEY), 0.0) * sh + 0.9 * ao) + env(R) * F * 1.15 * mix(0.6, 1.0, sh) + vec3(0.95) * D * F * 0.5 * sh;
}
vec3 shadeAny(vec2 p, vec4 g) { return g.w > 2.5 ? shadeHand(p, g) : shadeGoo(p, g); }

float sdPill(vec2 q, vec2 b) { return length(vec2(max(abs(q.x) - (b.x - b.y), 0.0), q.y)) - b.y; }
// the button's shadow on the white floor, layered like a studio product shot: a tight contact crease at
// the base, a soft cast shadow pushed away from the key light, and a wide faint ambient spread.
// Lifting the button fades the crease and pushes the cast shadow further out and softer
float buttonShadow(vec2 p) {
  // how a real object shades the surface it rests on: darkest right at the base (light can't get
  // under it), falling off smoothly and continuously with distance, pushed toward the lower right
  // away from the key light, with a faint wide ambient fade. Lifting thins the contact out
  vec2 q = p - uBtnP.xy;
  float d0 = max(sdPill(q, uBtnP.zw), 0.0);
  float lift = uBtnH.y, h = uBtnH.x + lift;
  vec2 off = -normalize(KEY.xy) * (h * 0.38 + lift * 0.45);
  float d1 = max(sdPill(q - off, uBtnP.zw - vec2(1.0)), 0.0);
  float grounded = 1.0 - smoothstep(0.0, 12.0, lift);
  float contact = exp(-d0 / (2.2 + lift * 0.4)) * 0.62 * grounded;           // tight dark crease
  float occl = exp(-d0 / 7.0) * 0.3 * mix(0.45, 1.0, grounded);             // near-field occlusion
  float dropSh = exp(-d1 / (8.0 + h * 0.25 + lift * 0.6)) * (0.34 - 0.08 * (1.0 - grounded)); // soft key shadow
  float ambient = exp(-d0 / 34.0) * 0.12;                                     // wide skylight fade
  float lit = (1.0 - contact) * (1.0 - occl) * (1.0 - dropSh) * (1.0 - ambient);
  return clamp(1.0 - lit, 0.0, 0.88);
}

#define INK uFloor
// dark floor: how much of the key light reaches it (soft shadow + AO under the goo), 0..1
float floorLight(vec2 p) {
  if (!isNear(p)) return 1.0;
  return min(softShadow(p, 0.0), mix(occlusion(p, 0.0), 1.0, 0.55 * uLift));
}
vec3 floorShade(vec2 p) {
  float sh = 1.0, ao = 1.0;
  if (isNear(p)) { sh = softShadow(p, 0.0); ao = mix(occlusion(p, 0.0), 1.0, 0.55 * uLift); } // lifted: no contact crease
  vec2 v = p / (uRes / uDpr);
  float falloff = 1.0 - 0.08 * length(v - vec2(0.32, 0.22));
  vec3 alb = vec3(0.86, 0.865, 0.875);
  vec3 lit = alb * (vec3(1.0, 0.985, 0.96) * 1.3 * KEY.z * sh + vec3(0.92, 0.95, 1.0) * 1.2 * ao) * falloff;
  return lit * (1.0 - buttonShadow(p) * vec3(0.96, 0.94, 0.9)); // shadows stay a touch cool, like skylight fill
}

vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

void main() {
  KEY = normalize(vec3(-0.45, -0.56, 0.74));
  ivec2 c = ivec2(gl_FragCoord.xy);
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  vec4 g = gAt(c);
  vec3 col;
  if (g.w < 0.5) {
    // transparent floor: only the goo's shadow darkens the page, so the wordmark beside it shows through
    float shA = 1.0 - (1.0 - buttonShadow(p) * 0.85) * mix(0.55, 1.0, floorLight(p));
    vec3 inkF = vec3(0.0);
    // analytic edge coverage from the closest approach of the ray (also keeps hair-thin strands visible)
    float cov = clamp(0.5 - g.x * uDpr, 0.0, 1.0);
    if (cov > 0.0) {
      vec4 n0 = gAt(c + ivec2(1, 0)), n1 = gAt(c - ivec2(1, 0)), n2 = gAt(c + ivec2(0, 1)), n3 = gAt(c - ivec2(0, 1));
      vec4 gn = n0.w > 0.5 ? n0 : n1.w > 0.5 ? n1 : n2.w > 0.5 ? n2 : n3.w > 0.5 ? n3 : vec4(0.0);
      vec3 gc = gn.w > 0.5 ? pow(aces(shadeAny(p, gn) * 0.95), vec3(1.0 / 2.2)) : INK * 0.5;
      inkF = gc * cov;
    }
    outC = vec4(inkF, cov + shA * (1.0 - cov));
    return;
  } else {
    col = pow(aces(shadeAny(p, g) * 0.95), vec3(1.0 / 2.2));
  }
  col += (hash12(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) / 255.0;
  outC = vec4(col, 1.0);
}`;function he(e,t){let n=G.createShader(e);if(G.shaderSource(n,t.trim()),G.compileShader(n),!G.getShaderParameter(n,G.COMPILE_STATUS)){let e=G.getShaderInfoLog(n);throw console.error(e,`
`,t.split(`
`).map((e,t)=>`${t+1}: ${e}`).join(`
`)),Error(`shader compile failed: `+e)}return n}function ge(e,t){let n=G.createProgram();if(G.attachShader(n,he(G.VERTEX_SHADER,`#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`)),G.attachShader(n,he(G.FRAGMENT_SHADER,e)),G.linkProgram(n),!G.getProgramParameter(n,G.LINK_STATUS))throw Error(G.getProgramInfoLog(n));let r={};for(let e of t)r[e]=G.getUniformLocation(n,e);return{prog:n,u:r}}let _e=ge(pe,`uArrowSDF.uMorph.uCoat.uNC.uCoil.uCBox.uHandSDF.uHand.uHand2.uRes.uDpr.uTime.uBtn.uBtnZ.uBtnZ2.uPull.uPeak.uNS.uPts.uBox.uAnc.uAncD.uNBr.uBr.uNB.uBlob.uBlobZ.uRip.uLabel.uLabelBox.uEmboss.uZTop.uK`.split(`.`)),ve=ge(me,[`uG`,`uLabel`,`uRes`,`uDpr`,`uTime`,`uLabelBox`,`uLabelAmt`,`uLabelLod`,`uIri`,`uGoo`,`uLabelCol`,`uFloor`,`uZMax`,`uLift`,`uBtnP`,`uWin`,`uBtnH`,`uHandCol`,`uArrowCol`,`uMorph`,`uHand`,`uHand2`]),ye=G.createTexture(),be=G.createTexture(),xe=G.createTexture(),Se=G.createTexture(),Ce=0;function we(t,n,r){let i=getComputedStyle(e).getPropertyValue(t).trim(),a=decodeURIComponent(i.slice(i.indexOf(`,`)+1,i.lastIndexOf(`"`))).replace(/\sfilter=(["'])url\([^)]*\)\1/g,``),o=new Image;o.onload=()=>{let e=document.createElement(`canvas`);e.width=e.height=256,e.getContext(`2d`).drawImage(o,0,0,256,256),G.bindTexture(G.TEXTURE_2D,n),G.pixelStorei(G.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),G.texImage2D(G.TEXTURE_2D,0,G.RGBA,G.RGBA,G.UNSIGNED_BYTE,e),G.generateMipmap(G.TEXTURE_2D),G.texParameteri(G.TEXTURE_2D,G.TEXTURE_MIN_FILTER,G.LINEAR_MIPMAP_LINEAR),G.texParameteri(G.TEXTURE_2D,G.TEXTURE_WRAP_S,G.CLAMP_TO_EDGE),G.texParameteri(G.TEXTURE_2D,G.TEXTURE_WRAP_T,G.CLAMP_TO_EDGE);let t=document.createElement(`canvas`);t.width=t.height=96;let i=t.getContext(`2d`);i.drawImage(o,0,0,96,96);let a=i.getImageData(0,0,96,96).data,s=new Uint8Array(9216);for(let e=0;e<9216;e++)s[e]=+(a[e*4+3]>127);let c=[];for(let e=0;e<96;e++)for(let t=0;t<96;t++){let n=s[e*96+t];(t>0&&s[e*96+t-1]!==n||t<95&&s[e*96+t+1]!==n||e>0&&s[(e-1)*96+t]!==n||e<95&&s[(e+1)*96+t]!==n)&&c.push(t,e)}let l=new Float32Array(9216);for(let e=0;e<96;e++)for(let t=0;t<96;t++){let n=1e9;for(let r=0;r<c.length;r+=2){let i=c[r]-t,a=c[r+1]-e,o=i*i+a*a;o<n&&(n=o)}let r=(Math.sqrt(n)+.5)*.25;l[e*96+t]=s[e*96+t]?-r:r}G.bindTexture(G.TEXTURE_2D,r),G.texImage2D(G.TEXTURE_2D,0,G.R16F,96,96,0,G.RED,G.FLOAT,l),G.texParameteri(G.TEXTURE_2D,G.TEXTURE_MIN_FILTER,G.LINEAR),G.texParameteri(G.TEXTURE_2D,G.TEXTURE_MAG_FILTER,G.LINEAR),G.texParameteri(G.TEXTURE_2D,G.TEXTURE_WRAP_S,G.CLAMP_TO_EDGE),G.texParameteri(G.TEXTURE_2D,G.TEXTURE_WRAP_T,G.CLAMP_TO_EDGE),++Ce===2&&(k.ready=!0)},o.src=`data:image/svg+xml,`+encodeURIComponent(a)}we(`--cur-hand`,ye,be),we(`--cur-arrow`,xe,Se);let Te=G.createVertexArray(),Ee=ge(`#version 300 es
precision highp float;
uniform sampler2D uC;
uniform vec2 uRes;
out vec4 outC;
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
void main() {
  vec2 px = 1.0 / uRes, uv = gl_FragCoord.xy * px;
  vec4 cM4 = texture(uC, uv); vec3 cM = cM4.rgb;
  float lNW = luma(texture(uC, uv + vec2(-1.0, -1.0) * px).rgb), lNE = luma(texture(uC, uv + vec2(1.0, -1.0) * px).rgb);
  float lSW = luma(texture(uC, uv + vec2(-1.0, 1.0) * px).rgb), lSE = luma(texture(uC, uv + vec2(1.0, 1.0) * px).rgb);
  float lM = luma(cM);
  float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE))), lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
  if (lMax - lMin < max(0.03, lMax * 0.08)) { outC = cM4; return; }
  vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), (lNW + lSW) - (lNE + lSE));
  float reduce = max((lNW + lNE + lSW + lSE) * 0.03125, 1.0 / 128.0);
  dir = clamp(dir / (min(abs(dir.x), abs(dir.y)) + reduce), -8.0, 8.0) * px;
  vec4 A4 = 0.5 * (texture(uC, uv - dir / 6.0) + texture(uC, uv + dir / 6.0));
  vec4 B4 = A4 * 0.5 + 0.25 * (texture(uC, uv - dir * 0.5) + texture(uC, uv + dir * 0.5));
  vec3 A = A4.rgb;
  vec3 B = A * 0.5 + 0.25 * (texture(uC, uv - dir * 0.5).rgb + texture(uC, uv + dir * 0.5).rgb);
  float lB = luma(B);
  outC = (lB < lMin || lB > lMax) ? A4 : B4;
}`,[`uC`,`uRes`]),K=null,De=G.createFramebuffer(),q=null,Oe=G.createFramebuffer();function ke(){q&&G.deleteTexture(q),q=G.createTexture(),G.bindTexture(G.TEXTURE_2D,q);let e=Math.floor(Math.log2(Math.max(R,z)))+1;G.texStorage2D(G.TEXTURE_2D,e,fe?G.RGBA16F:G.RGBA8,R,z),G.texParameteri(G.TEXTURE_2D,G.TEXTURE_MIN_FILTER,G.LINEAR_MIPMAP_LINEAR),G.texParameteri(G.TEXTURE_2D,G.TEXTURE_MAG_FILTER,G.LINEAR),G.texParameteri(G.TEXTURE_2D,G.TEXTURE_WRAP_S,G.CLAMP_TO_EDGE),G.texParameteri(G.TEXTURE_2D,G.TEXTURE_WRAP_T,G.CLAMP_TO_EDGE),G.bindFramebuffer(G.FRAMEBUFFER,Oe),G.framebufferTexture2D(G.FRAMEBUFFER,G.COLOR_ATTACHMENT0,G.TEXTURE_2D,q,0),K&&G.deleteTexture(K),K=G.createTexture(),G.bindTexture(G.TEXTURE_2D,K),G.texStorage2D(G.TEXTURE_2D,1,G.RGBA8,R,z),G.texParameteri(G.TEXTURE_2D,G.TEXTURE_MIN_FILTER,G.LINEAR),G.texParameteri(G.TEXTURE_2D,G.TEXTURE_MAG_FILTER,G.LINEAR),G.texParameteri(G.TEXTURE_2D,G.TEXTURE_WRAP_S,G.CLAMP_TO_EDGE),G.texParameteri(G.TEXTURE_2D,G.TEXTURE_WRAP_T,G.CLAMP_TO_EDGE),G.bindFramebuffer(G.FRAMEBUFFER,De),G.framebufferTexture2D(G.FRAMEBUFFER,G.COLOR_ATTACHMENT0,G.TEXTURE_2D,K,0),G.bindFramebuffer(G.FRAMEBUFFER,null)}let J=1024,Ae=document.createElement(`canvas`);Ae.width=J,Ae.height=256;let Y=Ae.getContext(`2d`),je=G.createTexture();G.bindTexture(G.TEXTURE_2D,je),G.texImage2D(G.TEXTURE_2D,0,G.RGBA,1,1,0,G.RGBA,G.UNSIGNED_BYTE,new Uint8Array(4));function Me(){G.bindTexture(G.TEXTURE_2D,je),G.pixelStorei(G.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),G.texImage2D(G.TEXTURE_2D,0,G.RGBA,G.RGBA,G.UNSIGNED_BYTE,Ae),G.generateMipmap(G.TEXTURE_2D),G.texParameteri(G.TEXTURE_2D,G.TEXTURE_MIN_FILTER,G.LINEAR_MIPMAP_LINEAR),G.texParameteri(G.TEXTURE_2D,G.TEXTURE_MAG_FILTER,G.LINEAR),G.texParameteri(G.TEXTURE_2D,G.TEXTURE_WRAP_S,G.CLAMP_TO_EDGE),G.texParameteri(G.TEXTURE_2D,G.TEXTURE_WRAP_T,G.CLAMP_TO_EDGE)}async function Ne(e){await g,Y.clearRect(0,0,J,256),Y.font=`${h} 120px ${m}`,`letterSpacing`in Y&&(Y.letterSpacing=`${(t.letterSpacingEm||0)*120}px`),Y.fillStyle=`white`,Y.textAlign=`center`,Y.textBaseline=`alphabetic`;let n=Y.measureText(e);Y.fillText(e,J/2,128+(n.actualBoundingBoxAscent-n.actualBoundingBoxDescent)/2),te=n.actualBoundingBoxLeft+n.actualBoundingBoxRight,Me(),se=0,ce=1,T.setAttribute(`aria-label`,e),T.textContent=e,mt()}Ne(ee);function Pe(){let e=N.intro,t=N.press;return{cx:N.cx,cy:N.cy,hw:N.hh*.5+(N.hw-N.hh*.5)*e+2.5*t,hh:N.hh*(.55+.45*e)+1*t,top:Math.max(1,N.top*e*(1-.3*t))}}function X(e,t,n,r=0){let i=n.hw-n.hh,a=H(e-n.cx,-i,i),o=e-n.cx-a,s=t-n.cy,c=Math.hypot(o,s);c<.001?(o=0,s=-1,c=.001):(o/=c,s/=c);let l=n.hh-r;return{x:n.cx+a+o*l,y:n.cy+s*l,nx:o,ny:s,d:c-n.hh}}function Fe(e,t,n,r){let i=X(e,t,r);return X(i.x-i.ny*n-i.nx*4,i.y+i.nx*n-i.ny*4,r,10)}function Ie(e,t,n){u||(O.push({x:e,y:t,age:0,amp:n}),O.length>6&&O.shift())}function Le(e,t,n,r){let i={kind:e,state:`grow`,pin:`anchor`,lx:(n-t.cx)/t.hw,ly:(r-t.cy)/t.hh,pos:new Float32Array(42),prev:new Float32Array(42),rad:new Float32Array(14).fill(2),u:0,ud:0,uKick:!0,rest:1,vol:0,stretch:1,pinch:0,len:0,neckS:U(.42,.62),side:Math.random()<.5?-1:1,wig:U(.5,1.2),phase:U(0,100),snapMul:U(.85,1.15),lenMul:U(.88,1.12),wrap:null,lat:0,life:0,ttl:0,probe:null,mound:0,dead:!1,retract:0},a=Math.max(2,t.top-4)+N.lift*C,o=X(n,r,t);for(let e=0;e<14;e++){let t=e*3;i.pos[t]=i.prev[t]=n+o.nx*e*.4,i.pos[t+1]=i.prev[t+1]=r+o.ny*e*.4,i.pos[t+2]=i.prev[t+2]=a}return i}function Re(e){if(E.length>=B-1)return;let t=[0,30,-30,58,-58,82,-82][E.filter(e=>e.kind===`reach`&&e.pin===`anchor`&&e.state!==`recoil`).length%7]+U(-6,6),n=Fe(M.x,M.y,t,e),r=Le(`reach`,e,n.x,n.y);r.lat=t,r.vol=Math.PI*1.25*1.25*170;let i=new Set(E.filter(e=>e.wrap).map(e=>e.wrap.f)),a=0;for(;i.has(a)&&a<j.length-1;)a++;r.wrap={f:a,prog:0,th0:null,dir:1,ph:U(0,6.28),slide:0,r:.7},E.push(r)}function ze(e,t){let n=(e-8)*k.s,r=(t-3)*k.s,i=Math.cos(k.ang),a=Math.sin(k.ang);return[M.x+k.ox+i*n-a*r,M.y+k.oy+a*n+i*r]}let Be=()=>.8*k.s,Ve=[0,0,0,0];function He(e,t,n){let r=e.wrap,i=j[r.f],a=ze(i.a[0],i.a[1]),o=ze(i.b[0],i.b[1]),s=o[0]-a[0],u=o[1]-a[1],d=Math.hypot(s,u)||1;s/=d,u/=d;let f=-u,p=s;if(r.th0===null){let t=(e.pos[0]-(a[0]+o[0])/2)*f+(e.pos[1]-(a[1]+o[1])/2)*p;r.th0=t>0?0:Math.PI,r.dir=t>0?1:-1}let m=(n?.45:r.r)*l.thickness,h=t*i.turns*(n?1.25:1)*2*Math.PI*r.prog,g=H(i.t0+r.slide+(i.t1-i.t0)*h/(i.turns*2*Math.PI*(n?1.1:1)),.02,.98),_=r.th0+r.dir*h,v=i.hw*k.s+m+.35,y=Be()+m+.3;return Ve[0]=a[0]+s*g*d+f*Math.cos(_)*v,Ve[1]=a[1]+u*g*d+p*Math.cos(_)*v,Ve[2]=c+Math.sin(_)*y,Ve[3]=m*(1-.35*t*t),Ve}function Ue(e){let t=He(e,0,!1);return[t[0],t[1],t[2]]}function We(e){if(E.length>=B-6)return;let t=U(-1,1)*75,n=Fe(M.x,M.y,t,e),r=Le(`micro`,e,n.x,n.y);r.lat=t,r.probe={len:U(.5,1.2),z:U(1,5),ph:U(0,6.28)},r.ttl=U(.7,1.9),r.vol=Math.PI*.55*.55*40,E.push(r)}function Ge(e,t){let n=t.hw-t.hh,r=2*n,i=Math.PI*t.hh,a=2*r+2*i,o=(e%1+1)%1*a;if(o<r)return X(t.cx-n+o,t.cy-t.hh-1,t);if(o-=r,o<i){let e=-Math.PI/2+o/t.hh;return X(t.cx+n+Math.cos(e)*t.hh*2,t.cy+Math.sin(e)*t.hh*2,t)}if(o-=i,o<r)return X(t.cx+n-o,t.cy+t.hh+1,t);o-=r;let s=Math.PI/2+o/t.hh;return X(t.cx-n+Math.cos(s)*t.hh*2,t.cy+Math.sin(s)*t.hh*2,t)}let Ke=Math.random();function qe(e){let t=Math.random()<.5?-1:1,n=Math.random()<.5?2:3,r=Ke+U(.25,.75);Ke=r;let i=Ge(r,e);for(let r=0;r<n&&E.length<B-2;r++){let a=(r-(n-1)/2)*13+U(-3,3),o=X(i.x-i.ny*a,i.y+i.nx*a,e,8),s=Le(`probe`,e,o.x,o.y);s.probe={nx:o.nx,ny:o.ny,dist:U(11,20),z:U(2,6),dir:t,delay:r*.07},s.ttl=U(.8,1),s.vol=Math.PI*.8*.8*40,E.push(s)}}let Z=new Float32Array(14),Je=new Float32Array(42),Ye=new Float32Array(42);function Xe(e,t){let n=e.pos,r=e.prev;Z[0]=0;for(let e=1;e<14;e++){let t=(e-1)*3,r=e*3;Z[e]=Z[e-1]+Math.hypot(n[r]-n[t],n[r+1]-n[t+1],n[r+2]-n[t+2])}if(Z[13]<.001||t>=Z[13])return;let i=0;for(let e=0;e<14;e++){let a=t*e/13;for(;i<12&&Z[i+1]<a;)i++;let o=H((a-Z[i])/Math.max(Z[i+1]-Z[i],1e-6),0,1);for(let t=0;t<3;t++)Je[e*3+t]=n[i*3+t]*(1-o)+n[(i+1)*3+t]*o,Ye[e*3+t]=r[i*3+t]*(1-o)+r[(i+1)*3+t]*o}n.set(Je),r.set(Ye)}function Ze(e,t,n){let r=new Float32Array(42);for(let i=0;i<14;i++){let a=t+(n-t)*i/13,o=H(Math.floor(a),0,12),s=a-o;for(let t=0;t<3;t++)r[i*3+t]=e[o*3+t]*(1-s)+e[(o+1)*3+t]*s}return r}function Qe(e,t){let n=e.neckS*13,r={...e,kind:`piece`,state:`recoil`,pin:`anchor`,pinch:0,mound:e.mound,wrap:null,pos:Ze(e.pos,0,n),prev:Ze(e.prev,0,n),rad:new Float32Array(14),vol:e.vol*e.neckS},i={...e,kind:`piece`,state:`recoil`,pin:`cursor`,pinch:0,mound:0,pos:Ze(e.pos,13,n),prev:Ze(e.prev,13,n),rad:new Float32Array(14),vol:e.vol*(1-e.neckS)};r.len=e.len*e.neckS,r.rest=r.len/13,i.len=e.len*(1-e.neckS),i.rest=i.len/13,r.retract=i.retract=0;let a=E.indexOf(e);E[a]=r,E.length<B&&E.push(i),Ie(t.cx+e.lx*t.hw,t.cy+e.ly*t.hh,.8),L=I}function $e(e){for(let t of E)t.kind===`reach`&&(t.state===`grow`||t.state===`attached`)&&(e||t.state===`grow`?(t.state=`recoil`,t.kind=`piece`):t.pinch||=1e-4)}function et(e,t,n,r,i){e.life+=t;let a=e.wrap;a&&(a.slide=.045*Math.sin(I*1.4+a.ph),e.state===`attached`?a.prog+=(1-a.prog)*(1-Math.exp(-t*10)):e.state===`recoil`&&(a.prog-=t*5,a.prog<=0&&(e.wrap=null,e.pin===`cursor`&&(e.dead=!0))));let o=e.pin===`anchor`?[n.cx+e.lx*n.hw,n.cy+e.ly*n.hh,Math.max(2,n.top-4)+N.lift*C]:e.wrap?Ue(e):[M.x,M.y,c],s=null;if(e.kind===`reach`&&(e.state===`grow`||e.state===`attached`)){if(s=Ue(e),e.state===`attached`){let r=Fe(M.x,M.y,e.lat,n),i=1-Math.exp(-t*1.4);e.lx+=((r.x-n.cx)/n.hw-e.lx)*i,e.ly+=((r.y-n.cy)/n.hh-e.ly)*i}}else if(e.kind===`micro`&&e.state!==`recoil`){let r=Fe(M.x,M.y,e.lat,n),i=1-Math.exp(-t*2);e.lx+=((r.x-n.cx)/n.hw-e.lx)*i,e.ly+=((r.y-n.cy)/n.hh-e.ly)*i;let a=X(o[0],o[1],n),c=M.x-o[0],l=M.y-o[1],u=Math.hypot(c,l)||1,d=a.nx*.25+c/u*.75,f=a.ny*.25+l/u*.75,p=Math.hypot(d,f)||1;d/=p,f/=p;let m=(10+38*oe)*e.probe.len,h=Math.sin(I*3+e.probe.ph)*4;s=[o[0]+d*m-f*h,o[1]+f*m+d*h,o[2]+e.probe.z*oe],(e.life>e.ttl||oe<.08)&&(e.state=`recoil`,s=null)}else if(e.kind===`probe`&&e.state!==`recoil`){let t=e.probe,n=H((e.life-t.delay)/e.ttl,0,1),r=Math.sin(Math.PI*n),i=t.dir*(n-.3)*24,a=3+t.dist*r;s=[o[0]+t.nx*a-t.ny*i,o[1]+t.ny*a+t.nx*i,o[2]+t.z*r],e.life>e.ttl+t.delay&&(e.state=`recoil`,s=null)}let d=null;if(s){let n=Math.hypot(s[0]-o[0],s[1]-o[1],s[2]-o[2]);if(e.state===`grow`){let r=3.8*l.whip*(.75+.25*l.magnet),i=.5,a=i/(Math.PI*r),c=1/(2*Math.PI*r)**2,u=-.2*i/(2*Math.PI*r),f=e.uKick?1/t:0;e.uKick=!1;let p=Math.max(c,t*t/2+t*a/2,t*a);e.u+=t*e.ud,e.ud+=t*(1+u*f-e.u-a*e.ud)/p;let m=e.u,h=H(m,0,1),g=Math.hypot(s[0]-o[0],s[1]-o[1])||1,_=-(s[1]-o[1])/g,v=(s[0]-o[0])/g,y=e.side*e.wig*Math.sin(Math.PI*h)*Math.min(g*.3,38);d=[o[0]+(s[0]-o[0])*m+_*y,o[1]+(s[1]-o[1])*m+v*y,o[2]+(s[2]-o[2])*h+22*Math.sin(Math.PI*h)],e.rest=Math.max(4,n*Math.max(m,.03))*1.05/13,m>.85&&Math.abs(e.ud)<1.6&&(e.state=`attached`)}else{d=s;let r=e.rest*13;n<r*1.03?r+=(n*1.03-r)*(1-Math.exp(-t*3.5)):r+=(n-r)*(1-Math.exp(-t*l.creep)),e.rest=r/13,e.stretch=n/Math.max(r,1),e.kind===`reach`&&!e.pinch&&(e.stretch>l.snapStretch*e.snapMul||n>l.maxLen*e.lenMul)&&(e.pinch=1e-4)}}else if(e.state===`recoil`){e.retract+=t;let n=Math.max(0,e.len*Math.exp(-t*9)-(e.pin===`cursor`?160:110)*t);Xe(e,n),e.rest=n/13}if(e.pinch>0&&(e.pinch+=t/.1,e.pinch>=1)){Qe(e,n);return}let f=e.pos,p=e.prev,m=e.state===`recoil`?.94:.975,h=f[39]-o[0],g=f[40]-o[1],_=Math.hypot(h,g)||1,v=-g/_,y=h/_,b=H(1.35-e.stretch,.15,1),x=(u||e.state===`recoil`?0:700)*l.slither*b*(e.state===`grow`?.4:1),ee=l.gravity*t*t,S=(e.kind===`reach`||e.kind===`micro`)&&e.state!==`recoil`&&M.present?l.magnet*900*t*t:0;for(let n=1;n<14;n++){let r=n*3,i=n/13,a=(f[r]-p[r])*m,o=(f[r+1]-p[r+1])*m,s=(f[r+2]-p[r+2])*m;p[r]=f[r],p[r+1]=f[r+1],p[r+2]=f[r+2];let c=Math.sin(Math.PI*i),l=Math.sin(i*8.5-I*7.5+e.phase)*c*x*t*t;if(f[r]+=a+v*l,f[r+1]+=o+y*l,f[r+2]+=s-ee+Math.cos(i*6-I*5+e.phase)*c*x*.25*t*t,S){let e=M.x-f[r],t=M.y-f[r+1],n=Math.hypot(e,t)||1;f[r]+=e/n*S*c,f[r+1]+=t/n*S*c}}let te=Math.max(e.rest,.05);for(let e=0;e<3;e++){f[0]=o[0],f[1]=o[1],f[2]=o[2],d&&(f[39]=d[0],f[40]=d[1],f[41]=d[2]);for(let e=0;e<13;e++){let t=e*3,n=t+3,r=f[n]-f[t],i=f[n+1]-f[t+1],a=f[n+2]-f[t+2],o=Math.hypot(r,i,a)||1e-6,s=e===0?0:1,c=e+1===13&&d?0:1,l=s+c;if(!l)continue;let u=(o-te)/o*.95;if(r*=u,i*=u,a*=u,s){let e=s/l;f[t]+=r*e,f[t+1]+=i*e,f[t+2]+=a*e}if(c){let e=c/l;f[n]-=r*e,f[n+1]-=i*e,f[n+2]-=a*e}}for(let e=0;e<12;e++){let t=e*3,n=t+6,r=f[n]-f[t],i=f[n+1]-f[t+1],a=f[n+2]-f[t+2],o=Math.hypot(r,i,a)||1e-6,s=te*1.55;if(o>=s)continue;let c=e===0?0:1,l=e+2===13&&d?0:1,u=c+l;if(!u)continue;let p=(o-s)/o*.25;if(r*=p,i*=p,a*=p,c){let e=c/u;f[t]+=r*e,f[t+1]+=i*e,f[t+2]+=a*e}if(l){let e=l/u;f[n]-=r*e,f[n+1]-=i*e,f[n+2]-=a*e}}}for(let t=1;t<14;t++){let n=t*3,r=e.rad[t]*.7;f[n+2]<r&&(f[n+2]=r,p[n]+=(f[n]-p[n])*.3,p[n+1]+=(f[n+1]-p[n+1])*.3)}let w=0;for(let e=0;e<13;e++){let t=e*3,n=t+3;w+=Math.hypot(f[n]-f[t],f[n+1]-f[t+1],f[n+2]-f[t+2])}e.len=w;let T=H(Math.sqrt(e.vol/(Math.PI*Math.max(w,2))),.55,e.state===`recoil`?5:7.5)*l.thickness,E=e.state===`attached`,D=(E?H((e.stretch-1.15)/1.2,0,.7):0)*(1-e.pinch)+e.pinch*.96,O=E?H((e.stretch-1.5)/.8,0,1):0,ne=w/(9*Math.max(T,.6)),k=e.state===`recoil`?Math.min(.8,e.retract*3):0;for(let t=0;t<14;t++){let n=t/13,r=T*(e.pin===`cursor`?.6:1+.55*Math.exp(-n/.08));e.wrap&&e.kind===`reach`||e.kind===`micro`||e.kind===`probe`?r*=1-.62*de(.5,1,n):r*=1+(.5+k)*Math.exp(-(1-n)/.07),r*=1-D*Math.exp(-(((n-e.neckS)/.16)**2)),r*=1+O*.3*Math.sin(n*Math.PI*2*ne+e.phase),e.rad[t]=Math.max(r,.35)}let A=0,j=0;e.pin===`anchor`&&(e.state===`grow`?(A=7,j=.9):e.state===`attached`&&(A=6+6*H(e.stretch-1,0,1.4),j=1+1.6*H(e.stretch-.8,0,1.4)),e.kind===`micro`&&(A*=.35,j*=.6),e.kind===`probe`&&(A*=.12,j*=.4)),e.mound+=(A*.55*l.pull-e.mound)*(1-Math.exp(-t*(A>e.mound?10:5))),e.elong=(e.elong||0)+(j-(e.elong||0))*(1-Math.exp(-t*8));let P=f[9]-f[0],F=f[10]-f[1],L=Math.hypot(P,F);L>1?(e.dirX=P/L,e.dirY=F/L):e.dirX===void 0&&(e.dirX=0,e.dirY=-1),e.state===`recoil`&&(e.rest*13<12||w<5)&&(e.dead=!0,e.pin===`anchor`&&e.kind!==`micro`&&Ie(o[0],o[1],.5))}function tt(e,t,n){if(e.t+=t,e.state===`fall`){e.vz-=l.gravity*1.6*t,e.x+=e.vx*t,e.y+=e.vy*t,e.z+=e.vz*t,e.vx*=.985,e.vy*=.985,e.z<=e.r*.55&&(e.z=e.r*.55,e.state=`crawl`,e.sqV=-5,e.sq=.55);return}let r=X(e.x,e.y,n),i=Math.sin(e.t*9)**2,a=110+230*i,o=Math.sin(e.t*11+e.phase)*40;e.x+=(-r.nx*a-r.ny*o)*t,e.y+=(-r.ny*a+r.nx*o)*t,W(e,`sq`,`sqV`,.5+.16*i,30,.5,t),e.z=e.r*e.sq*.9,r.d<-e.r&&(e.dead=!0,Ie(r.x+r.nx*e.r,r.y+r.ny*e.r,1))}function nt(e){u||(I+=e),W(N,`intro`,`introV`,1,9,.85,e),W(N,`press`,`pressV`,N.pressTarget,30,.75,e),se+=(ce-se)*(1-Math.exp(-e*(I>.6?4:0)));let t=Pe(),n=M.present&&N.intro>.6,r=X(M.x,M.y,t),i=n&&r.d<-4,a=n&&!i?de(l.awareness,18,r.d):0;oe=a,u||1+.03*Math.sin(I*19)*a,W(P,`amt`,`v`,0,14,1,e);let o=1-Math.exp(-e*10);P.x+=(r.x-r.nx*6-P.x)*o,P.y+=(r.y-r.ny*6-P.y)*o,W(F,`amt`,`v`,0,12,1,e),W(N,`lift`,`liftV`,+!!i,11,.95,e),c=t.top+N.lift*C+11;let s=1-Math.exp(-e*14);if(F.x+=(M.x-F.x)*(F.amt<.02?1:s),F.y+=(M.y-F.y)*(F.amt<.02?1:s),!u){let e=E.filter(e=>e.kind===`reach`&&(e.state===`grow`||e.state===`attached`)).length;n?i?$e(!0):(e<(r.d<l.reach?Math.min(l.maxStrands,Math.round(Math.min(2,l.maxStrands)+Math.max(0,l.maxStrands-2)*de(l.reach,l.reach*.4,r.d))):0)&&I-re>U(.03,.06)&&I-L>.15&&(Re(t),re=I),E.filter(e=>e.kind===`micro`&&e.state!==`recoil`).length<Math.round(9*de(.1,.8,a))&&I-ie>U(.03,.07)&&(We(t),ie=I)):$e(!1),!i&&a<.02&&I>ae&&N.intro>.95&&(E.every(e=>e.kind===`probe`||e.state===`recoil`)&&qe(t),ae=I+U(1.8,2.3))}for(let r=0;r<E.length;r++)et(E[r],e,t,n,i);for(let e=E.length-1;e>=0;e--)E[e].dead&&E.splice(e,1);let d=E.some(e=>e.wrap),f=!u&&k.ready&&n&&(r.d<l.reach+40||i||d);W(k,`s`,`v`,ne,16,.9,e),W(k,`coat`,`coatV`,i?160:n?H(45-r.d,-60,160):-60,9,.9,e);let p=i?.57:.8-.2*H(1-r.d/60,0,1);k.thr+=(p-k.thr)*(1-Math.exp(-e*4)),k.on=k.ready&&M.present&&M.mouse;let m=i||E.some(e=>e.kind===`reach`&&(e.state===`attached`||e.state===`grow`&&e.u>.5));W(k,`m`,`mV`,f&&m||k.on&&i?1:0,32,1,e),k.m=H(k.m,0,1);let h=0,g=0;for(let e of E){if(e.kind!==`reach`||e.state!==`attached`||!e.wrap)continue;let t=e.pos[30]-e.pos[39],n=e.pos[31]-e.pos[40],r=Math.hypot(t,n)||1,i=H(e.stretch-.7,0,1.2)*e.wrap.prog;h+=t/r*i,g+=n/r*i}let _=Math.hypot(h,g),v=k.on?Math.min(1,_/1.5)*l.grip:0,y=_>1e-4?h/_:0,b=_>1e-4?g/_:0;W(k,`ox`,`oxV`,y*10*v,16,.62,e),W(k,`oy`,`oyV`,b*10*v,16,.62,e);let x=Math.atan2(b,y)-A;x=Math.atan2(Math.sin(x),Math.cos(x));let ee=_>1e-4?H(x*.35,-.36,.36)*v:0;W(k,`ang`,`angV`,H(M.vx*22e-5,-.32,.32)+ee,12,.85,e);for(let n of D)tt(n,e,t);for(let e=D.length-1;e>=0;e--)D[e].dead&&D.splice(e,1);for(let t of O)t.age+=e;for(;O.length&&O[0].age>1.6;)O.shift();M.vx*=Math.exp(-e*8),M.vy*=Math.exp(-e*8)}let rt=new Float32Array(B*14*4),it=new Float32Array(B*4),at=new Float32Array(B*4),ot=new Float32Array(B*4),st=new Float32Array(108),ct=new Float32Array(V*18*4),lt=new Float32Array(V*4),ut=new Float32Array(20),dt=new Float32Array(5),ft=new Float32Array(24),Q=[2.5,6,5];function pt(){let e=Pe(),t=e.top+N.dome+P.amt+F.amt*15*l.pull+N.lift*C+4,n=0,r=Math.min(E.length,B);for(let i=0;i<r;i++){let r=E[i],a=1e9,o=1e9,s=-1e9,c=-1e9,l=0;for(let e=0;e<14;e++){let n=(i*14+e)*4,u=r.pos[e*3],d=r.pos[e*3+1],f=r.pos[e*3+2],p=r.rad[e];rt[n]=u,rt[n+1]=d,rt[n+2]=f,rt[n+3]=p,a=Math.min(a,u),o=Math.min(o,d),s=Math.max(s,u),c=Math.max(c,d),l=Math.max(l,p),t=Math.max(t,f+p+Q[1]*.3)}let u=l+Q[1]+3;it.set([a-u,o-u,s+u,c+u],i*4);let d=r.pin===`anchor`?e.cx+r.lx*e.hw:0,f=r.pin===`anchor`?e.cy+r.ly*e.hh:0,p=r.pin===`anchor`?r.mound:0;n=Math.max(n,p),at.set([d,f,p,17],i*4),ot.set([r.dirX??0,r.dirY??-1,r.elong||0,0],i*4)}t+=n;let i=E.filter(e=>e.kind===`reach`&&e.state===`attached`).sort((e,t)=>e.lat-t.lat),a=0;for(let e=0;e+1<i.length&&a<9;e++){let t=i[e],n=i[e+1],r=H((Math.min(t.life,n.life)-.3)*4,0,1),o=H(2.3-Math.max(t.stretch,n.stretch),.25,1);for(let e of[.22,.42,.62]){if(a>=9)break;let i=Math.round(e*13)*3,s=t.pos[i],c=t.pos[i+1],u=t.pos[i+2],d=n.pos[i],f=n.pos[i+1],p=n.pos[i+2],m=Math.hypot(d-s,f-c),h=.22*l.thickness*H(1.6-m/70,0,1)*r*o;if(h<.2)continue;let g=(t.pos[0]+n.pos[0])/2,_=(t.pos[1]+n.pos[1])/2,v=(s+d)/2,y=(c+f)/2,b=Math.hypot(g-v,_-y)||1,x=m*.22;v+=(g-v)/b*x,y+=(_-y)/b*x,st.set([s,c,u,h,v,y,(u+p)/2-m*.05,h*.75,d,f,p,h],a*12),a++}}let o=0;if(k.on&&k.m>.6)for(let e of[!1,!0])for(let t of E){if(o>=V)break;if(!t.wrap||t.wrap.prog<.02)continue;let n=1e9,r=1e9,i=-1e9,a=-1e9;for(let s=0;s<18;s++){let c=He(t,s/17,e);ct.set(c,(o*18+s)*4),n=Math.min(n,c[0]),r=Math.min(r,c[1]),i=Math.max(i,c[0]),a=Math.max(a,c[1])}let s=4+Q[1];lt.set([n-s,r-s,i+s,a+s],o*4),o++}k.on&&(t=Math.max(t,c+Be()+6));for(let e of E){if(e.kind!==`reach`||e.state!==`attached`)continue;let t=H((e.stretch-.8)*18,0,9)*H((e.life-.4)*3,0,1);if(!(t<.5))for(let n of[-1,1,.4]){if(o>=V)break;let r=1e9,i=1e9,a=-1e9,s=-1e9;for(let c=0;c<18;c++){let u=c/17,d=u*13,f=Math.min(12,Math.floor(d)),p=d-f,m=f*3,h=m+3,g=e.pos,_=g[h]-g[m],v=g[h+1]-g[m+1],y=Math.hypot(_,v)||1,b=Math.sin(Math.PI*u)**1.4,x=.75+.25*Math.sin(I*3.1+u*7+e.phase+n),ee=n*t*b*x*(n>0?1:.7),S=[g[m]+(g[h]-g[m])*p-v/y*ee,g[m+1]+(g[h+1]-g[m+1])*p+_/y*ee,g[m+2]+(g[h+2]-g[m+2])*p-t*(n===.4?-.25:.35)*b,(.24+.1*(1-b))*l.thickness];ct.set(S,(o*18+c)*4),r=Math.min(r,S[0]),i=Math.min(i,S[1]),a=Math.max(a,S[0]),s=Math.max(s,S[1])}let c=4+Q[1];lt.set([r-c,i-c,a+c,s+c],o*4),o++}}let s=k.on&&k.ready?1:0,d=0;for(let e of D){if(d>=5)break;ut.set([e.x,e.y,e.z,e.r],d*4),dt[d]=e.state===`fall`?1:e.sq,t=Math.max(t,e.z+e.r+2),d++}ft.fill(0),O.forEach((e,t)=>ft.set([e.x,e.y,e.age,e.amp],t*4));let f=[e.cx,e.cy+1,N.lbw,N.lbh],p=u?3:I;G.bindFramebuffer(G.FRAMEBUFFER,Oe),G.viewport(0,0,R,z),G.useProgram(_e.prog),G.bindVertexArray(Te);let m=_e.u;G.uniform2f(m.uRes,R,z),G.uniform1f(m.uDpr,le),G.uniform1f(m.uTime,p),G.uniform4f(m.uBtn,e.cx,e.cy,e.hw,e.hh),G.uniform4f(m.uBtnZ2,N.lift*C,3,0,0),G.uniform4f(m.uBtnZ,e.top,N.sink*Math.min(1,N.intro),N.dome*Math.min(1,N.intro),0),G.uniform4f(m.uPull,P.x,P.y,P.amt,34),G.uniform4f(m.uPeak,F.x,F.y,F.amt*15*l.pull,24),G.uniform1i(m.uNS,r),G.uniform4fv(m.uPts,rt),G.uniform4fv(m.uBox,it),G.uniform4fv(m.uAnc,at),G.uniform4fv(m.uAncD,ot),G.uniform1i(m.uNBr,a),G.uniform4fv(m.uBr,st),G.uniform1i(m.uNB,d),G.uniform4fv(m.uBlob,ut),G.uniform1fv(m.uBlobZ,dt),G.uniform4fv(m.uRip,ft),G.uniform4f(m.uLabelBox,f[0],f[1],f[2],f[3]),G.uniform1f(m.uEmboss,0),G.uniform1f(m.uZTop,t),G.uniform3f(m.uK,Q[0],Q[1],Q[2]),G.uniform1i(m.uLabel,1),G.uniform1i(m.uNC,o),G.uniform4fv(m.uCoil,ct),G.uniform4fv(m.uCBox,lt),G.uniform4f(m.uHand,M.x+k.ox,M.y+k.oy,k.s,s),G.uniform4f(m.uHand2,Math.cos(k.ang),Math.sin(k.ang),c,Be()),G.uniform3f(m.uCoat,k.coat,22,k.thr),G.uniform1i(m.uHandSDF,2),G.activeTexture(G.TEXTURE2),G.bindTexture(G.TEXTURE_2D,be),G.uniform1i(m.uArrowSDF,5),G.activeTexture(G.TEXTURE5),G.bindTexture(G.TEXTURE_2D,Se),G.uniform1f(m.uMorph,k.m),G.activeTexture(G.TEXTURE1),G.bindTexture(G.TEXTURE_2D,je),G.drawArrays(G.TRIANGLES,0,3),G.activeTexture(G.TEXTURE0),G.bindTexture(G.TEXTURE_2D,q),G.generateMipmap(G.TEXTURE_2D),G.bindFramebuffer(G.FRAMEBUFFER,De),G.viewport(0,0,R,z),G.useProgram(ve.prog);let h=ve.u;G.uniform1i(h.uG,0),G.uniform1i(h.uLabel,1),G.uniform2f(h.uRes,R,z),G.uniform1f(h.uDpr,le),G.uniform1f(h.uTime,p),G.uniform4f(h.uLabelBox,f[0],f[1],f[2],f[3]),G.uniform1f(h.uLabelAmt,se),G.uniform1f(h.uLabelLod,Math.max(0,Math.log2(J/(2*f[2]*le))-.6)),G.uniform1f(h.uIri,l.sheen),G.uniform3f(h.uGoo,y[0],y[1],y[2]),G.uniform3f(h.uLabelCol,b[0],b[1],b[2]),G.uniform3f(h.uFloor,x[0],x[1],x[2]),G.uniform1f(h.uZMax,t),G.uniform1f(h.uLift,N.lift),G.uniform4f(h.uBtnP,e.cx,e.cy,e.hw,e.hh);let g=te*S/120/2;G.uniform2f(h.uWin,-(g+16)/e.hw,15/e.hw),G.uniform2f(h.uBtnH,e.top,N.lift*C),G.uniform4f(h.uHand,M.x+k.ox,M.y+k.oy,k.s,s),G.uniform4f(h.uHand2,Math.cos(k.ang),Math.sin(k.ang),c,Be()),G.uniform1i(h.uHandCol,3),G.activeTexture(G.TEXTURE3),G.bindTexture(G.TEXTURE_2D,ye),G.uniform1i(h.uArrowCol,6),G.activeTexture(G.TEXTURE6),G.bindTexture(G.TEXTURE_2D,xe),G.uniform1f(h.uMorph,k.m),G.drawArrays(G.TRIANGLES,0,3),G.bindFramebuffer(G.FRAMEBUFFER,null),G.useProgram(Ee.prog),G.uniform1i(Ee.u.uC,4),G.uniform2f(Ee.u.uRes,R,z),G.activeTexture(G.TEXTURE4),G.bindTexture(G.TEXTURE_2D,K),G.drawArrays(G.TRIANGLES,0,3)}function mt(){N.cx=f()/2+(t.offsetX||0),N.cy=p()/2+(t.offsetY||0);let e=S/120;N.hh=t.halfHeight||30,N.hw=(te||520)*e/2+(t.padX||30),N.lbw=J*e/2,N.lbh=256*e/2,Object.assign(T.style,{left:`${(N.cx-N.hw)*d}px`,top:`${(N.cy-N.hh)*d}px`,width:`${N.hw*2*d}px`,height:`${N.hh*2*d}px`})}function ht(){mt();let t=Math.min(devicePixelRatio||1,2)*ue;R=Math.max(1,Math.round(e.clientWidth*t)),z=Math.max(1,Math.round(e.clientHeight*t)),w.width=R,w.height=z,le=R/f(),ke()}let gt=new ResizeObserver(()=>ht());gt.observe(e),ht();let _t=performance.now(),vt=0,yt=1/60,bt=0,xt=0;function St(t){let n=(t-_t)/1e3;_t=t,n>.1&&(n=.1),yt+=(n-yt)*.05,vt+=n;let r=0;for(;vt>=s&&r<40;)nt(s),vt-=s,r++;r===40&&(vt=0),k.on!==e.classList.contains(`is-engaged`)&&e.classList.toggle(`is-engaged`,k.on),pt(),yt>1/40&&n<.09&&document.visibilityState===`visible`?bt+=n:bt=0,bt>2&&ue>.8&&(ue-=.1,bt=0,ht()),(xt+=n)>.5&&(xt=0,`${Math.round(1/yt)}${Math.round(ue*100)}`),$=Ct?requestAnimationFrame(St):0}let $=0,Ct=!1;function wt(e,t){return X(e,t,Pe()).d<0}function Tt(t){e.classList.toggle(`is-over-goo`,t)}r(window,`pointermove`,e=>{let t=performance.now(),n=Math.max(1,t-M.t)/1e3,r=i(e),s=a(e);M.present&&(M.vx=(r-M.lx)/n,M.vy=(s-M.ly)/n),M.t=t,M.x=M.lx=r,M.y=M.ly=s,M.mouse=e.pointerType===`mouse`||e.pointerType===`pen`,M.present=M.mouse&&o(r,s)||M.down,Tt(wt(M.x,M.y))},{passive:!0}),`onpointerrawupdate`in window&&r(window,`pointerrawupdate`,e=>{M.present&&M.mouse&&(M.x=i(e),M.y=a(e))},{passive:!0}),r(e,`pointerleave`,()=>{M.present=!1,Tt(!1)}),r(window,`blur`,()=>{M.present=!1}),r(window,`pointerdown`,e=>{M.down=!0,M.x=i(e),M.y=a(e),M.present=!0}),r(window,`pointerup`,e=>{M.down=!1,e.pointerType===`touch`&&(M.present=!1)});function Et(e,t,n){if(N.pressTarget=+!!e,!e){Ie(t,n,1.6);for(let e of E)e.state===`attached`&&(e.rest*=.82)}}return r(T,`pointerdown`,e=>{wt(i(e),a(e))&&Et(!0)}),r(window,`pointerup`,e=>{N.pressTarget&&Et(!1,i(e),a(e))}),r(T,`keydown`,e=>{(e.key===`Enter`||e.key===` `)&&!e.repeat&&Et(!0)}),r(T,`keyup`,e=>{(e.key===`Enter`||e.key===` `)&&Et(!1,N.cx,N.cy)}),r(T,`click`,()=>{T.dispatchEvent(new CustomEvent(`venom:activate`,{bubbles:!0}))}),{start(){Ct||(Ct=!0,_t=performance.now(),$=requestAnimationFrame(St))},stop(){Ct=!1,cancelAnimationFrame($),$=0,M.present=!1,e.classList.remove(`is-engaged`,`is-over-goo`)},destroy(){Ct=!1,cancelAnimationFrame($),gt.disconnect();for(let[e,t,r,i]of n)e.removeEventListener(t,r,i);e.classList.remove(`has-gl`,`is-engaged`,`is-over-goo`),G.getExtension(`WEBGL_lose_context`)?.loseContext()}}}export{e as mountVenom};