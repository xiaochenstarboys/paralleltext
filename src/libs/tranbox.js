import React from "react";
import ReactDOM from "react-dom/client";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import Slection from "../views/Selection";
import {
  hardenShadowHost,
  getShadowHostMountRoot,
  isShadowHostAttached,
} from "./shadowHost";
import {
  DEFAULT_TRANBOX_SETTING,
  APP_CONSTS,
  resolveApiPromptList,
} from "../config";

function resolvePromptProps(props = {}) {
  return {
    ...props,
    tranboxSetting: { ...DEFAULT_TRANBOX_SETTING, ...props.tranboxSetting },
    transApis: resolveApiPromptList(props.transApis, props.prompts),
  };
}

export class TransboxManager {
  #container = null;
  #reactRoot = null;
  #shadowContainer = null;
  #cache = null;
  #props = {};

  constructor(initialProps = {}) {
    this.#props = resolvePromptProps(initialProps);

    const { tranboxSetting = DEFAULT_TRANBOX_SETTING } = this.#props;
    if (tranboxSetting?.transOpen) {
      this.enable();
    }
  }

  isEnabled() {
    return !!this.#container && isShadowHostAttached(this.#container);
  }

  enable() {
    if (!this.isEnabled()) {
      this.#container = document.createElement("div");
      this.#container.id = APP_CONSTS.boxID;
      this.#container.className = "notranslate";
                                                        
      hardenShadowHost(this.#container);

      getShadowHostMountRoot().appendChild(this.#container);
      this.#shadowContainer = this.#container.attachShadow({ mode: "open" });
      const shadowRootElement = document.createElement("div");
      shadowRootElement.className = `${APP_CONSTS.boxID}_wrapper notranslate`;
      this.#shadowContainer.appendChild(shadowRootElement);

      this.#cache = createCache({
        key: APP_CONSTS.boxID,
        prepend: true,
        container: this.#shadowContainer,
      });

      this.#reactRoot = ReactDOM.createRoot(shadowRootElement);
      this.#render();
    }
  }

  #render() {
    if (!this.#reactRoot || !this.#cache) {
      return;
    }

    this.#reactRoot.render(
      <React.StrictMode>
        <CacheProvider value={this.#cache}>
          <Slection {...this.#props} />
        </CacheProvider>
      </React.StrictMode>
    );
  }

  disable() {
    if (!this.isEnabled() || !this.#reactRoot) {
      return;
    }
    this.#reactRoot.unmount();
    this.#container.remove();
    this.#container = null;
    this.#reactRoot = null;
    this.#shadowContainer = null;
    this.#cache = null;
  }

  toggle(enabled) {
    const transOpen = typeof enabled === "boolean" ? enabled : !this.isEnabled();
    this.update({ tranboxSetting: { ...this.#props.tranboxSetting, transOpen } });
  }

     
                         
                                
                                                                                             
                                                                     
                                                                             
                                                                     
                                      
     
  update(newProps) {
    this.#props = resolvePromptProps({ ...this.#props, ...newProps,
      tranboxSetting: { ...this.#props.tranboxSetting, ...newProps.tranboxSetting },
    });
    if (this.isEnabled()) {
      if (!this.#props.tranboxSetting?.transOpen) {
        this.disable();
      } else {
        this.#render();
      }
      return;
    }

    if (this.#props.tranboxSetting?.transOpen) {
      this.enable();
    }
  }
}
