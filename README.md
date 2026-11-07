# 个人介绍网站

纯静态个人展示站，通过 GitHub Pages 发布：https://zyttt2007.github.io/

## 内容怎么改

不需要改代码：打开网站，点左下角「✎ 编辑内容」（或访问 `?edit=1`）进入编辑模式，
点文字即可修改，卡片可编辑 / 删除 / 排序，每个列表末尾可以新增条目；项目卡片支持填写封面图地址。
改动自动保存在当前浏览器（localStorage），刷新后保留。

要让公网所有人都看到新内容：在编辑条点「导出 index.html」，
用下载的文件替换本仓库根目录的 index.html 即可。导出的 HTML 里静态内容和内嵌数据
会一起更新，不执行 JavaScript 也能读到新内容。

「导出数据 / 导入数据」用于备份与换设备；「恢复默认」回到初始内容。

## 目录说明

`images/` 存放三个全栈项目（青苔笔记 / 灶台问答 / 一枚手作）的线上真实界面截图，
在 `site-data.json` 的对应项目里用 `image` 字段引用，点击图片可打开该网站。

`site-data.json` 是默认数据源，`template.html` 是页面骨架，运行 `python build.py`
可重新生成 `index.html`（生成的页面本身是完整静态 HTML，不依赖脚本也能阅读）。
`editor.js` 提供网页内编辑功能，`style.css` 含编辑模式样式。

推送到 main 会由 `.github/workflows/pages.yml` 自动部署到 GitHub Pages。
