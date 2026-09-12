   
                 
                                                     
   

import { GLOBLA_RULE, GLOBAL_KEY, TERM_LIBRARY } from "../config";
import { getRulesWithDefault, getSettingWithDefault } from "./storage";
import { kissLog } from "./log";

                                                           
const hostMatchesGlossary = (host, patterns) => {
  const hostLower = String(host || "").toLowerCase();
  return String(patterns || "")
    .split(/[,，\s]+/)
    .filter(Boolean)
    .some((p) => {
                                               
      const pat = p
        .toLowerCase()
        .replace(/^[a-z][a-z0-9+.-]*:\/\//, "")
        .replace(/^\*\./, "")
        .replace(/[:/].*$/, "")
        .replace(/\.$/, "");
      return Boolean(pat) && (hostLower === pat || hostLower.endsWith("." + pat));
    });
};

                                
const isGlobalSites = (sites) => {
  const t = String(sites || "").trim();
  return t === "" || t === "*";
};

   
               
                                     
                                               
                                                   
                                
                                      
   
export const matchRule = async (href) => {
  const rules = await getRulesWithDefault();
  const savedGlobalRule = rules.find((r) => r.pattern === GLOBAL_KEY);
  const rule = {
    ...GLOBLA_RULE,
    ...(savedGlobalRule || {}),
  };

                                                
                                          
  try {
    const setting = await getSettingWithDefault();

                     
    const enabledIds = Array.isArray(setting?.enabledLibraryDomains)
      ? setting.enabledLibraryDomains
      : [];
    const libraryTerms = TERM_LIBRARY.filter((d) => enabledIds.includes(d.id));

                                          
                                             
    const glossaries = Array.isArray(setting?.termGlossaries)
      ? setting.termGlossaries
      : [];
    let host = "";
    try {
      host = href ? new URL(href).hostname : "";
    } catch (err) {
      host = "";
    }
    const enabledGlossaries = glossaries.filter((g) => g && g.enabled !== false);
    const globalGlossaries = enabledGlossaries.filter((g) =>
      isGlobalSites(g.sites)
    );
    const siteGlossaries = host
      ? enabledGlossaries.filter(
          (g) => !isGlobalSites(g.sites) && hostMatchesGlossary(host, g.sites)
        )
      : [];

    const mergeTerms = (...parts) =>
      parts
        .filter((p) => typeof p === "string" && p.trim())
        .join("\n");
    rule.terms = mergeTerms(
      ...siteGlossaries.map((g) => g.terms),
      ...libraryTerms.map((d) => d.terms),
      ...globalGlossaries.map((g) => g.terms),
      rule.terms
    );
    rule.aiTerms = mergeTerms(
      ...siteGlossaries.map((g) => g.aiTerms),
      ...globalGlossaries.map((g) => g.aiTerms),
      rule.aiTerms
    );
  } catch (err) {
    kissLog("resolve term glossary error", err);
  }

  return rule;
};
