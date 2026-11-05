import os
from PIL import Image, ImageDraw, ImageFont

OUT = r"D:/桌面/刷题/public/icons"
os.makedirs(OUT, exist_ok=True)

FONT = "C:/Windows/Fonts/msyhbd.ttc"
BG_TOP = (91, 140, 255)
BG_BOTTOM = (58, 96, 214)


def gradient(size: int) -> Image.Image:
    grad = Image.new("RGB", (1, size))
    px = grad.load()
    for y in range(size):
        t = y / max(1, size - 1)
        px[0, y] = (
            round(BG_TOP[0] + (BG_BOTTOM[0] - BG_TOP[0]) * t),
            round(BG_TOP[1] + (BG_BOTTOM[1] - BG_TOP[1]) * t),
            round(BG_TOP[2] + (BG_BOTTOM[2] - BG_TOP[2]) * t),
        )
    return grad.resize((size, size))


def make(size: int, rounded: bool) -> Image.Image:
    img = gradient(size).convert("RGBA")
    if rounded:
        radius = int(size * 0.22)
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
        img.putalpha(mask)

    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT, int(size * 0.56))
    text = "刷"
    bbox = draw.textbbox((0, 0), text, font=font)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((size - w) / 2 - bbox[0], (size - h) / 2 - bbox[1]), text, font=font, fill=(255, 255, 255, 255))
    return img


make(192, rounded=True).save(os.path.join(OUT, "icon-192.png"))
make(512, rounded=True).save(os.path.join(OUT, "icon-512.png"))
make(512, rounded=False).save(os.path.join(OUT, "icon-512-maskable.png"))
print("icons generated")
