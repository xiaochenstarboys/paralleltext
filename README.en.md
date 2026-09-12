# ParallelText

[English](README.en.md) | [中文](README.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

A simple, open source [bilingual translation extension](https://github.com/xiaochenstarboys/paralleltext).

## License & Attribution

This project is a derivative work of [kiss-translator](https://github.com/fishjar/kiss-translator) by [fishjar](https://github.com/fishjar), open-sourced under the upstream [GNU General Public License v3.0](LICENSE). See the `LICENSE` file for the full text. Many thanks to the original author.

This repository publishes the extension core derived from upstream; our proprietary website, membership and payment services are not part of this publication.

## Features

- [x] Keep it simple
- [x] Open source
- [x] Adapt to common browsers
  - [x] Chrome/Edge
  - [x] Firefox
- [x] Support multiple translation services
  - [x] Google
  - [x] DeepSeek/Qwen/OpenAI
  - [x] Custom API
- [x] Cover common translation scenarios
  - [x] Web bilingual translation
  - [x] Input box translation
    - Instantly translate text in the input box via shortcut
  - [x] Selection translation
    - [x] Open the translation box on any page and compare translations across services
    - [x] English dictionary
    - [x] Favorite words
  - [x] Mouse hover translation
- [x] Diverse translation effects
  - [x] Automatic text recognition and manual rules
    - Automatic mode translates most sites completely without writing rules
    - Manual rule mode for site-specific optimization
  - [x] Colorful sentence-by-sentence reading with matching colors for source and translation
  - [x] Custom translation styles
  - [x] Rich-text translation that preserves links and text styles
  - [x] Show translation only (hide original)
- [x] Advanced API features
  - [x] In theory, any translation API can be supported through custom interfaces
  - [x] Aggregated batch sending of translation text
  - [x] Streaming transmission with real-time results
  - [x] Custom AI terminology dictionary
  - [x] Hooks and custom parameters on all interfaces
- [x] Cross-device data sync
  - [x] Cloud sync of favorites, wordbook and translation history with your account
- [x] Custom translation rules
  - [x] Rule subscription/sharing
  - [x] Custom terminology
- [x] Custom shortcuts
  - `Alt+Q` Toggle page translation
  - `Alt+K` Open/close the extension popup
  - `Alt+S` Open the translation box
  - `Alt+D` Open the separate translation window
  - `Alt+C` Toggle translation style
  - `Alt+O` Open the options page
  - More shortcuts can be customized on the browser's extension shortcuts page and in settings

## Install

- Download and install from the official website: [https://www.braintiktok.com](https://www.braintiktok.com)
- Chrome / Edge / Firefox add-on store listings are rolling out

## Associated Projects

- Community subscription rules: [https://github.com/fishjar/kiss-rules](https://github.com/fishjar/kiss-rules)
  - Community-maintained subscription rule lists (used by this project as a public data source; rule format compatible).

## Frequently Asked Questions

### How to Set Keyboard Shortcuts

Set this in the extension management page, for example:

- chrome [chrome://extensions/shortcuts](chrome://extensions/shortcuts)
- firefox [about:addons](about:addons)

### What is the priority order of rule settings?

Personal Rules > Subscription Rules > Global Rules

Among these, Global Rules have the lowest priority but are very important as they serve as the default rules.

### API (Ollama, etc.) Test Failure

Common reasons for API test failures include:

- Incorrect address:
  - For example, `Ollama` has a native API address and an `Openai`-compatible address. This plugin currently supports the `Openai`-compatible address and does not support the `Ollama` native API address.
- Some AI models do not support batch translation:
  - In this case, you can choose to disable batch translation or use a custom API.
  - Alternatively, you can use a custom API. For details, please refer to: [Custom API Example Documentation](custom-api_v2.md)
- Some AI models have inconsistent parameters:
  - For example, the parameters of the `Gemini` native API are highly inconsistent. Some model versions do not support certain parameters, leading to errors.
  - In this case, you can modify the request body using a `Hook`, or replace it with `Gemini2` (an OpenAI-compatible address).
- The server restricts cross-origin access, returning a 403 error:
  - For example, `Ollama` requires adding the environment variable `OLLAMA_ORIGINS=*` when starting.

### How to set up a hook function for a custom API

Custom APIs are very powerful and flexible, and can theoretically connect to any translation API.

Example reference: [custom-api_v2.md](custom-api_v2.md)

## Future Plans 

 This project is developed in spare time without a strict schedule. Community contributions are welcome. Preliminary ideas:

- [x] **Aggregated text sending**: Optimize request strategy to reduce API calls and improve performance.
- [x] **Enhanced rich-text translation**: Accurate translation of complex page structures and rich text.
- [x] **Enhanced custom/AI interfaces**: Advanced AI features such as streaming transmission.
- [x] **English dictionary backup mechanism**: When a translation service fails, switch to another dictionary or fall back to local dictionary queries.
- [ ] **Rule co-building mechanism upgrade**: More flexible rule sharing, version management and community review.

 If you are interested in any of these, feel free to discuss in [Issues](https://github.com/xiaochenstarboys/paralleltext/issues) or submit a PR!

## Development Guidelines

```sh
git clone https://github.com/xiaochenstarboys/paralleltext.git
cd paralleltext
pnpm install
pnpm build
```

### External Trigger Example

```js
// `toggle_translate`   Toggle translation
// `toggle_styles`      Toggle styles
// `toggle_popup`       Open/close control panel
// `toggle_transbox`    Open/close translation popup
// `toggle_hover_node`  Translate hovered paragraph
// `input_translate`    Translate input box
window.dispatchEvent(new CustomEvent("kiss_translator", {detail: { action: "toggle_translate" }}));
```

## Discussion

- Website: [https://www.braintiktok.com](https://www.braintiktok.com)
- Feedback: submit a ticket via the Support Center on our website
