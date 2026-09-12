# ParallelText 平行悦读

[English](README.en.md) | [中文](README.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

一个简约、开源的双语对照翻译扩展。

## 开源许可与出处

本项目基于 [kiss-translator](https://github.com/fishjar/kiss-translator)（作者 [fishjar](https://github.com/fishjar)）二次开发，依照上游许可证以 [GNU General Public License v3.0](LICENSE) 开源，许可证全文见仓库根目录 `LICENSE` 文件。感谢原作者的开源工作。

本仓库公开的是衍生自上游的扩展核心代码；产品的官网、会员与支付服务等自研部分不属于本仓库公开范围。

## 特性

- [x] 保持简约
- [x] 开放源代码
- [x] 适配常见浏览器
  - [x] Chrome/Edge
  - [x] Firefox
- [x] 支持多种翻译服务
  - [x] Google
  - [x] DeepSeek/千问/OpenAI
  - [x] 自定义接口
- [x] 覆盖常见翻译场景
  - [x] 网页双语对照翻译
  - [x] 输入框翻译
    - 通过快捷键立即将输入框内文本翻译成其他语言
  - [x] 划词翻译
    - [x] 任意页面打开翻译框，多种翻译服务可选
    - [x] 英文词典翻译
    - [x] 收藏词汇
  - [x] 鼠标悬停翻译
- [x] 支持多样翻译效果
  - [x] 支持自动识别文本与手动规则两种模式
    - 自动识别文本模式使得绝大部分网站无需编写规则也能翻译完整
    - 手动规则模式，可以针对特定网站极致优化
  - [x] 多彩分句阅读，原文与译文同色对照
  - [x] 自定义译文样式
  - [x] 支持富文本翻译及显示，能够尽量保留原文中的链接及其他文本样式
  - [x] 支持仅显示译文（隐藏原文）
- [x] 翻译接口高级功能
  - [x] 通过自定义接口，理论上支持任何翻译接口
  - [x] 聚合批量发送翻译文本
  - [x] 支持流式传输，实时显示翻译结果
  - [x] 自定义AI术语词典
  - [x] 所有接口均支持Hook和自定义参数等高级功能
- [x] 跨设备数据同步
  - [x] 登录账号云端同步收藏、生词本与翻译历史
- [x] 自定义翻译规则
  - [x] 规则订阅
  - [x] 自定义专业术语
- [x] 自定义快捷键
  - `Alt+Q` 切换整页翻译
  - `Alt+K` 打开/关闭扩展弹窗
  - `Alt+S` 打开翻译弹窗
  - `Alt+D` 打开独立翻译窗口
  - `Alt+C` 切换译文样式
  - `Alt+O` 打开设置页面
  - 更多快捷键可在浏览器扩展快捷键页与设置页中自定义

## 安装

- 官网下载安装：[https://www.braintiktok.com](https://www.braintiktok.com)
- Chrome / Edge / Firefox 扩展商店陆续上架中

## 关联项目

- 社区订阅规则: [https://github.com/fishjar/kiss-rules](https://github.com/fishjar/kiss-rules)
  - 社区维护的订阅规则列表（本项目沿用其公开数据源，规则格式兼容）。

## 常见问题

### 如何设置快捷键

在插件管理那里设置，例如： 

- chrome [chrome://extensions/shortcuts](chrome://extensions/shortcuts)
- firefox [about:addons](about:addons)

### 规则设置的优先级是如何的

个人规则 > 订阅规则 > 全局规则

其中全局规则优先级最低，但非常重要，相当于兜底规则。

### 接口（Ollama等）测试失败

一般接口测试失败常见有以下几种原因：

- 地址填错了：
  - 比如 `Ollama` 有原生接口地址和 `Openai` 兼容的地址，本插件目前统一支持 `Openai` 兼容的地址，不支持 `Ollama` 原生接口地址
- 某些AI模型不支持聚合翻译：
  - 此种情况可通过自定义接口（Hook）单独适配，详情参考： [自定义接口示例文档](custom-api_v2.md)
- 服务器跨域限制访问，返回403错误：
  - 比如 `Ollama` 启动时须添加环境变量 `OLLAMA_ORIGINS=*`

### 如何设置自定义接口的hook函数

自定义接口功能非常强大、灵活，理论可以接入任何翻译接口。

示例参考： [custom-api_v2.md](custom-api_v2.md)

## 未来规划 

 本项目为业余开发，无严格时间表，欢迎社区共建。以下为初步设想的功能方向：

- [x] **聚合发送文本**：优化请求策略，减少翻译接口调用次数，提升性能。
- [x] **增强富文本翻译**：支持更复杂的页面结构和富文本内容的准确翻译。
- [x] **强化自定义/AI 接口**：支持流式传输等高级 AI 功能。
- [ ] **规则共建机制升级**：引入更灵活的规则分享、版本管理与社区评审流程。

 如果你对某个方向感兴趣，欢迎在本仓库 [Issues](https://github.com/xiaochenstarboys/paralleltext/issues) 中讨论或提交 PR！

## 开发指引

```sh
git clone https://github.com/xiaochenstarboys/paralleltext.git
cd paralleltext
pnpm install       # 需要 pnpm 9（见 .pnpm-version）
pnpm build:chrome  # 构建 Chrome 扩展；Firefox 用 pnpm build:firefox
```

### 外部触发示例

```js
// `toggle_translate`   切换翻译
// `toggle_styles`      切换样式
// `toggle_popup`       打开/关闭控制面板
// `toggle_transbox`    打开/关闭翻译弹窗
// `toggle_hover_node`  翻译鼠标悬停段落
// `input_translate`    翻译输入框
window.dispatchEvent(new CustomEvent("kiss_translator", {detail: { action: "toggle_translate" }}));
```

## 交流

- 官网：[https://www.braintiktok.com](https://www.braintiktok.com)
- 问题反馈：官网「工单中心」提交工单
