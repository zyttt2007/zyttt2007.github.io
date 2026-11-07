# -*- coding: utf-8 -*-
"""从 site-data.json + template.html 生成静态 index.html。

浏览器直接打开 index.html 也能看到完整内容（不依赖 JavaScript），
网页上的编辑功能由 editor.js 提供。
"""
import html
import json
from pathlib import Path

BASE = Path(__file__).resolve().parent
data = json.loads((BASE / "site-data.json").read_text(encoding="utf-8"))
tpl = (BASE / "template.html").read_text(encoding="utf-8")


def e(value) -> str:
    return html.escape(str(value if value is not None else ""), quote=True)


def render_about(items):
    return "\n          ".join(f"<p>{e(x)}</p>" for x in items)


def render_education(items):
    out = []
    for x in items:
        extra = f'\n          <p class="timeline-extra">{e(x["extra"])}</p>' if x.get("extra") else ""
        out.append(
            '<li class="timeline-item">\n'
            '          <div class="timeline-dot" aria-hidden="true"></div>\n'
            f'          <p class="timeline-date">{e(x["date"])}</p>\n'
            f'          <h3>{e(x["title"])}</h3>\n'
            f'          <p>{e(x["desc"])}</p>{extra}\n'
            '        </li>'
        )
    return "\n        ".join(out)


def render_skills(items):
    out = []
    for x in items:
        tags = "\n".join(
            f'            <li><span>{e(t[0])}</span><em>{e(t[1])}</em></li>' for t in x.get("tags", [])
        )
        out.append(
            '<article class="skill-card">\n'
            f'          <div class="skill-icon" aria-hidden="true">{e(x["icon"])}</div>\n'
            f'          <h3>{e(x["title"])}</h3>\n'
            '          <ul class="tag-list">\n'
            f'{tags}\n'
            '          </ul>\n'
            f'          <p class="skill-note">{e(x["note"])}</p>\n'
            '        </article>'
        )
    return "\n        ".join(out)


def render_stats(items):
    return "\n        ".join(
        f'<div class="stat"><b>{e(x[0])}</b><span>{e(x[1])}</span></div>' for x in items
    )


def render_projects(items):
    out = []
    for i, x in enumerate(items, 1):
        feats = "".join(f"<li>{e(f)}</li>" for f in x.get("features", []))
        tech = "".join(f"<span>{e(t)}</span>" for t in x.get("tech", []))
        links = "".join(
            f'<a href="{e(l["url"])}" target="_blank" rel="noreferrer">{e(l["label"])}</a>'
            for l in x.get("links", [])
        )
        first = (x.get("links") or [{}])[0].get("url", "#")
        media = []
        if x.get("photo"):
            media.append(
                f'<a class="media-photo" href="{e(first)}" target="_blank" rel="noreferrer" title="真实摄影配图">'
                f'<img src="{e(x["photo"])}" alt="{e(x["name"])} 主题真实摄影照片" loading="eager" />'
                f'<span class="media-cap">真实摄影</span></a>'
            )
        if x.get("image"):
            media.append(
                f'<a class="media-shot" href="{e(first)}" target="_blank" rel="noreferrer" title="线上真实界面截图">'
                f'<img src="{e(x["image"])}" alt="{e(x["name"])} 网站真实界面截图" loading="eager" />'
                f'<span class="media-cap">网站界面</span></a>'
            )
        cover = ('\n          <div class="project-media">' + "".join(media) + '</div>') if media else ''
        out.append(
            '<article class="project-card">\n' + cover + '\n'
            '          <div class="project-top">\n'
            f'            <span class="project-no">{i:02d}</span>\n'
            f'            <span class="project-kind">{e(x["kind"])}</span>\n'
            '          </div>\n'
            f'          <h3>{e(x["name"])} <span>{e(x["en"])}</span></h3>\n'
            f'          <p class="project-desc">{e(x["desc"])}</p>\n'
            f'          <ul class="feature-list">{feats}</ul>\n'
            f'          <div class="tech-row">{tech}</div>\n'
            f'          <div class="project-links">{links}</div>\n'
            '        </article>'
        )
    return "\n        ".join(out)


def render_hobbies(items):
    return "\n        ".join(
        '<div class="hobby">'
        f'<span class="hobby-mark">{e(x["mark"])}</span>'
        f'<h3>{e(x["title"])}</h3>'
        f'<p>{e(x["desc"])}</p></div>'
        for x in items
    )


def render_contacts(items):
    out = []
    for x in items:
        note = f'<small>{e(x["note"])}</small>' if x.get("note") else ""
        out.append(
            '<div class="contact-line">'
            f'<span class="contact-label">{e(x["label"])}</span>'
            f'<a href="{e(x["url"])}" target="_blank" rel="noreferrer">{e(x["text"])}</a>'
            f'{note}</div>'
        )
    return "\n        ".join(out)


payload = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")

fields = {
    "NAME": data["name"],
    "HERO_SUB": data["heroSub"],
    "HERO_DESC": data["heroDesc"],
    "ABOUT_DESC": data["aboutDesc"],
    "ABOUT_HTML": render_about(data["about"]),
    "EDUCATION_DESC": data["educationDesc"],
    "EDUCATION_HTML": render_education(data["education"]),
    "SKILLS_DESC": data["skillsDesc"],
    "SKILLS_HTML": render_skills(data["skills"]),
    "PROJECTS_DESC": data["projectsDesc"],
    "STATS_HTML": render_stats(data["stats"]),
    "PROJECTS_HTML": render_projects(data["projects"]),
    "PROCESS_TITLE": data["processTitle"],
    "PROCESS_TEXT": data["processText"],
    "VERIFY_TEXT": data["verifyText"],
    "HOBBIES_DESC": data["hobbiesDesc"],
    "HOBBIES_HTML": render_hobbies(data["hobbies"]),
    "CONTACT_DESC": data["contactDesc"],
    "CONTACTS_HTML": render_contacts(data["contacts"]),
    "FOOTER_LEFT": data["footerLeft"],
    "FOOTER_RIGHT": data["footerRight"],
}

html_fields = {
    "ABOUT_HTML", "EDUCATION_HTML", "SKILLS_HTML", "STATS_HTML",
    "PROJECTS_HTML", "HOBBIES_HTML", "CONTACTS_HTML",
}
for key, value in fields.items():
    tpl = tpl.replace("{{" + key + "}}", value if key in html_fields else e(value))
tpl = tpl.replace("{{SITE_DATA_JSON}}", payload)

assert "{{" not in tpl, "模板里还有未替换的占位符"
(BASE / "index.html").write_text(tpl, encoding="utf-8")
print("生成 index.html:", (BASE / "index.html").stat().st_size, "bytes,", len(data["projects"]), "个项目")
