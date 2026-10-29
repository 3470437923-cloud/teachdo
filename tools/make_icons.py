"""生成师作 TeachDo 的应用图标（曜石黑底 · 靛青墨「师」字方印）。
一次性脚本：图标生成完即可删除。

★★★ 安全警告（移植时加的，务必先读）★★★
本脚本会**直接覆盖** src-tauri/icons/ 下的既有图标。
在补好字体查找之前跑它，会得到「空白底 + 一条横杠」的废图标：
    Pillow ≥ 10.1 的 ImageFont.load_default() 是位图字体，**不含 CJK 字形**，
    「师」字画不出来也不会报错，只是什么都不画。
原实现正是这样：四个候选全是 C:\\Windows\\Fonts\\*，macOS 上全不存在，
于是静默回落到 load_default()。

因此现在有两道硬闸：
  1. 找不到任何「既存在、又确实带『师』字形」的字体 → **直接中止**，不写盘；
  2. 真画完了还要检查字形包围盒非空 → 空白同样中止，不覆盖既有图标。
也就是说：这个脚本现在**要么产出正确图标，要么什么都不做**。

用法（macOS 上）：
    python3 tools/make_icons.py
产物：32/128/256/512 PNG、128x128@2x.png、icon.png、icon.ico，
      以及给 `pnpm tauri icon` 用的 1024 主图 icon-1024.png。
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFont

# 项目根 = 本文件所在目录（tools/）的上一级；原实现写死 S:\\dsh\\...，换机器必挂。
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "src-tauri", "icons")
# 注意：这里**不**建目录。建目录放在字体探测通过之后 ——
# 否则「找不到字体」时虽然没写图标，却会留下一个空的 icons/ 目录，
# 与下面「要么产出正确图标，要么什么都不做」的承诺不符。

BG = (14, 17, 22, 255)        # 曜石黑
ACC = (110, 132, 224, 255)    # 靛青墨
WHITE = (236, 238, 241, 255)

#: 中文字体候选。两个平台的路径都列上，靠 os.path.isfile 过滤 ——
#: 在哪个平台就跑哪个平台那几条，不需要额外的平台分支。
FONT_CANDIDATES = [
    # Windows
    r"C:\Windows\Fonts\msyhbd.ttc",     # 微软雅黑 粗体
    r"C:\Windows\Fonts\msyh.ttc",       # 微软雅黑
    r"C:\Windows\Fonts\simhei.ttf",     # 黑体
    r"C:\Windows\Fonts\simsun.ttc",     # 宋体
    # macOS（系统内置，无需安装）
    "/System/Library/Fonts/PingFang.ttc",             # 苹方
    "/System/Library/Fonts/STHeiti Medium.ttc",       # 华文黑体
    "/System/Library/Fonts/Hiragino Sans GB.ttc",     # 冬青黑体
    "/System/Library/Fonts/Supplemental/Songti.ttc",  # 宋体-简
    "/Library/Fonts/Arial Unicode.ttf",
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
]

GLYPH = "师"


def pick_font(size):
    """找第一个「文件存在 + 能加载 + 真的有 GLYPH 字形」的字体。

    返回 (font, path) 或 (None, None)。
    比只判断 os.path.exists 严一档：.ttc 里的某一面可能缺字，
    或者加载成功但字形为空 —— 那样画出来就是空白。
    """
    for p in FONT_CANDIDATES:
        if not os.path.isfile(p):
            continue
        try:
            f = ImageFont.truetype(p, size)
        except Exception:
            continue
        try:
            if f.getmask(GLYPH).getbbox() is not None:
                return f, p
        except Exception:
            continue
    return None, None


# 探测一次，确定用哪个字体文件；探不到就立刻退出，绝不回退 load_default()。
_FONT_PATH = None
_probe, _probe_path = pick_font(64)
if _probe is None:
    sys.exit(
        "✗ 找不到任何带中文字形的字体，已中止（不写任何文件）。\n"
        "  为什么不回退 load_default()：Pillow 的默认位图字体没有 CJK 字形，\n"
        "  「%s」会画成空白，结果是「空白底 + 一条横杠」的废图标，\n"
        "  而且会静默覆盖现有图标。\n"
        "  请安装一个中文字体，或把它的路径补进本文件的 FONT_CANDIDATES。\n"
        "  当前候选（均不存在或不可用）：\n    %s"
        % (GLYPH, "\n    ".join(FONT_CANDIDATES))
    )
_FONT_PATH = _probe_path
print("字体: %s" % _FONT_PATH)


def font(size):
    return ImageFont.truetype(_FONT_PATH, size)


def make(size):
    img = Image.new("RGBA", (size, size), BG)
    d = ImageDraw.Draw(img)
    # 圆角方印
    r = max(2, size // 6)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=BG)
    # 靛青下划线（重「师」这一横）
    bar_h = max(2, size // 12)
    y = size - bar_h - max(1, size // 8)
    d.rounded_rectangle(
        [size * 0.26, y, size * 0.74, y + bar_h], radius=bar_h // 2, fill=ACC
    )
    # 「师」字
    f = font(int(size * 0.56))
    bbox = d.textbbox((0, 0), GLYPH, font=f)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    # 第二道闸：真画出来是空的就中止，不留半个废图标。
    if tw <= 0 or th <= 0:
        sys.exit(
            "✗ 「%s」渲染后的包围盒为空（%s 缺该字形），已中止，未覆盖任何图标。"
            % (GLYPH, _FONT_PATH)
        )
    tx = (size - tw) / 2 - bbox[0]
    ty = (size - bar_h) / 2 - th / 2 - bbox[1] - size * 0.03
    d.text((tx, ty), GLYPH, font=f, fill=WHITE)
    return img


# 字体探测已通过，这时才建目录、才开始写盘。
os.makedirs(OUT, exist_ok=True)

for s in (32, 128, 256, 512):
    make(s).save(os.path.join(OUT, f"{s}x{s}.png"))
make(256).save(os.path.join(OUT, "128x128@2x.png"))
make(256).save(os.path.join(OUT, "icon.png"))
# 1024 主图：`pnpm tauri icon` 的输入（低于 1024 会警告/拒绝）。
make(1024).save(os.path.join(OUT, "icon-1024.png"))

# 多尺寸 ico
imgs = [make(s) for s in (16, 32, 48, 64, 128, 256)]
imgs[2].save(
    os.path.join(OUT, "icon.ico"),
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
)
print("icons ok:", sorted(os.listdir(OUT)))
