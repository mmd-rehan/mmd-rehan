"""Build the hero head-turn frames (public/frames/turn/d and /m) from the source video.

    python3 scripts/turn-frames.py ../media/gemini_generated_video_eb916fe2.mp4

Needs ffmpeg and cwebp on the PATH, and numpy + opencv-python-headless.

The turn is source frames 44 to 84 of the 24 fps video (1.83 s to 3.50 s), cropped 600x720 at x=330
and played in reverse: 41 true frames, side view first. The 101 frames of the sequence put the
in-betweens at exactly even times (frame k is at source position 0.4 k), so the head turns at an even
pace, and every in-between is made the same way: dense optical flow both ways between the two true
frames around it, both warped to that moment and blended. A motion-compensated average over five
frames then evens out what is left, so no frame is crisper or softer than its neighbours.
(ffmpeg minterpolate, used before, made four soft frames for every true one and moved the head in
uneven steps, which read as flicker while scrolling.)

The edges fade to the page colour #020d17 through a fixed ellipse, fitted to the earlier frames, which
also hides the watermark at the bottom right of the crop.
"""
import os, subprocess, sys, tempfile
import numpy as np, cv2

VIDEO = sys.argv[1] if len(sys.argv) > 1 else '../media/gemini_generated_video_eb916fe2.mp4'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'frames', 'turn')
FIRST, LAST, X0, W, H, N = 44, 84, 330, 600, 720, 101
SIZES = {'d': (600, 720), 'm': (420, 504)}
QUALITY = 80
INK = np.array([0x02, 0x0d, 0x17], np.float32) / 255

def rgb(p): return cv2.cvtColor(cv2.imread(p, cv2.IMREAD_COLOR), cv2.COLOR_BGR2RGB).astype(np.float32) / 255
def gray(x): return cv2.cvtColor((np.clip(x, 0, 1) * 255 + .5).astype(np.uint8), cv2.COLOR_RGB2GRAY)

gx, gy = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
dis.setFinestScale(0); dis.setVariationalRefinementIterations(10)
def flow(a, b): return dis.calc(gray(a), gray(b), None)  # a(x) ~ b(x + flow(x))
def warp(img, fl): return cv2.remap(img, gx + fl[..., 0], gy + fl[..., 1], cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

def average_along_motion(seq, r, sigma):
    """each frame averaged with its +-r neighbours, each warped onto it; pixels the warp got wrong
    (the turning ear, the glasses edge) are left out by the range weight"""
    out = []
    for i in range(len(seq)):
        acc, total = seq[i].copy(), np.ones((H, W, 1), np.float32)
        for k in range(-r, r + 1):
            j = i + k if 0 <= i + k < len(seq) else i - k  # mirror at the ends to keep windows balanced
            if k == 0 or not 0 <= j < len(seq): continue
            wj = warp(seq[j], flow(seq[i], seq[j]))
            w = np.exp(-(np.abs(wj - seq[i]).max(2, keepdims=True) / sigma) ** 2)
            acc += w * wj; total += w
        out.append(np.clip(acc / total, 0, 1))
    return out

def fade_mask():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt(((xx - 300.0) / 278.1) ** 2 + ((yy - 307.8) / 409.9) ** 2)
    u = np.clip((d - .674) / (1.080 - .674), 0, 1)
    return ((1 - u * u * (3 - 2 * u)) ** .89)[..., None].astype(np.float32)

with tempfile.TemporaryDirectory() as tmp:
    subprocess.run(['ffmpeg', '-v', 'error', '-i', VIDEO, '-vf', f"select='between(n,{FIRST},{LAST})',crop={W}:{H}:{X0}:0",
                    '-fps_mode', 'passthrough', '-start_number', str(FIRST), os.path.join(tmp, 'f%03d.png')], check=True)
    true = [rgb(os.path.join(tmp, 'f%03d.png' % i)) for i in range(LAST, FIRST - 1, -1)]
    assert len(true) == LAST - FIRST + 1, 'could not read the turn from the video'

    true = average_along_motion(true, 1, .08)  # calm the generated video's texture shimmer first
    f01 = [flow(true[j], true[j + 1]) for j in range(len(true) - 1)]
    f10 = [flow(true[j + 1], true[j]) for j in range(len(true) - 1)]
    frames = []
    for k in range(N):
        u = k * (len(true) - 1) / (N - 1)
        j = min(int(u + 1e-9), len(true) - 2); t = u - j
        if t < 1e-6: frames.append(true[j]); continue
        if t > 1 - 1e-6: frames.append(true[j + 1]); continue
        a = warp(true[j], -(1 - t) * t * f01[j] + t * t * f10[j])
        b = warp(true[j + 1], (1 - t) * (1 - t) * f01[j] - t * (1 - t) * f10[j])
        # where the two warps disagree (something came into view), lean on the nearer true frame
        near = np.clip((np.abs(a - b).max(2, keepdims=True) - .06) / .12, 0, 1)
        wa = (1 - near) * (1 - t) + near * (1.0 if t < .5 else 0.0)
        frames.append(np.clip(wa * a + (1 - wa) * b, 0, 1))
    frames = average_along_motion(frames, 2, 9.0)  # any five in a row hold exactly one untouched true frame

    mask = fade_mask()
    for name, size in SIZES.items():
        os.makedirs(os.path.join(OUT, name), exist_ok=True)
        for k, f in enumerate(frames):
            img = cv2.cvtColor((np.clip(mask * f + (1 - mask) * INK, 0, 1) * 255 + .5).astype(np.uint8), cv2.COLOR_RGB2BGR)
            if size != (W, H): img = cv2.resize(img, size, interpolation=cv2.INTER_LINEAR)  # keeps the old phone crispness
            png = os.path.join(tmp, f'{name}{k:03d}.png'); cv2.imwrite(png, img)
            subprocess.run(['cwebp', '-quiet', '-q', str(QUALITY), '-m', '6', '-sharp_yuv', '-af', png,
                            '-o', os.path.join(OUT, name, f'{k:03d}.webp')], check=True)
        total = sum(os.path.getsize(os.path.join(OUT, name, f'{k:03d}.webp')) for k in range(N))
        print(f'{name}: {N} frames, {total / 1024:.0f} KB')
