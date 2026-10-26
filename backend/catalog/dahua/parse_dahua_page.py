"""Lee una página de producto de dahuasecurity.com (HTML guardado por fetch_dahua.py)."""
import html
import re


def text(fragment):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", fragment))).strip()


def parse(page):
    """Devuelve {model, name, features, specs, images} o None si no es una página de producto."""
    m = re.search(r'class="product-model">(.*?)</span>', page, re.S)
    if not m:
        return None
    name = re.search(r'<h1[^>]*class="product-desc[^"]*">(.*?)</h1>', page, re.S)
    points = re.search(r'<ul class="points-list">(.*?)<li class="item-expand">', page, re.S)
    features = [text(f).lstrip("•").strip() for f in re.split(r"<br\s*/?>", points.group(1))] if points else []
    specs = {}
    for section, body in re.findall(r'<h4 class="specifi-item-title">(.*?)</h4>(.*?)</table>', page, re.S):
        for th, td in re.findall(r'<th scope="row">(.*?)</th>\s*<td>(.*?)</td>', body, re.S):
            specs[f"{text(section)} / {text(th)}"] = text(td)
    imgs = re.findall(r'(https://material(?:file)?\.dahuasecurity\.com/uploads/cpq/prm-os-srv-res/[^"\'\s]+?/ProductImage/[^"\'\s]+?\.png)', page)
    return {"model": text(m.group(1)), "name": text(name.group(1)) if name else "",
            "features": [f for f in features if f], "specs": specs,
            "images": [u for u in dict.fromkeys(imgs) if "_thumb" not in u]}
