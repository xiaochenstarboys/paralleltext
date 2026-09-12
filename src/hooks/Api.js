import { useCallback, useEffect, useMemo } from "react";
import {
  DEFAULT_API_LIST,
  API_SPE_TYPES,
  REMOVED_TRANS_TYPES,
  normalizeApiModelListUrls,
  normalizeApiThinkingSettings,
  normalizeApiBuiltinModels,
} from "../config";
import { useSetting } from "./Setting";

                                   
function useApiState() {
  const { setting, updateSetting } = useSetting();
                                                  
                                                      
                                             
  const transApis = useMemo(
    () =>
      [
        ...normalizeApiBuiltinModels(
          normalizeApiThinkingSettings(
            normalizeApiModelListUrls(setting?.transApis || [])
          )
        ),
      ]
        .filter((api) => !REMOVED_TRANS_TYPES.has(api.apiType))
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    [setting?.transApis]
  );

  return { setting, transApis, updateSetting };
}

                                           
function normalizeApiOrder(apis = []) {
  const pinnedApis = apis
    .filter((api) => api.sortOrder === -1 && !api.isDisabled)
    .map((api) => ({ ...api, sortOrder: -1 }));
  const normalApis = apis
    .filter((api) => api.sortOrder !== -1 && !api.isDisabled)
    .map((api, index) => ({ ...api, sortOrder: index }));
  const disabledApis = apis
    .filter((api) => api.isDisabled)
    .map((api, index) => ({ ...api, sortOrder: 999 + index }));

  return [...pinnedApis, ...normalApis, ...disabledApis];
}

function getDisplayOrderedApis(apis = []) {
  return [...apis].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

   
                                                
   
export function useApiList() {
  const { setting, transApis, updateSetting } = useApiState();

                                                               
                                           
                                              
                                                                                                                
                                                                         
                                                                                          
  useEffect(() => {
    const deletedSlugs = new Set(setting?.deletedTransApiSlugs || []);
    const curSlugs = new Set(transApis.map((api) => api.apiSlug));
    const missApis = DEFAULT_API_LIST.filter(
      (api) => !curSlugs.has(api.apiSlug) && !deletedSlugs.has(api.apiSlug)
    );
    if (missApis.length > 0) {
      updateSetting((prev) => ({
        ...prev,
        transApis: [...(prev?.transApis || []), ...missApis],
      }));
    }
  }, [setting?.deletedTransApiSlugs, transApis, updateSetting]);

  useEffect(() => {
    if (!Array.isArray(setting?.transApis)) {
      return;
    }

    const normalizedTransApis = normalizeApiModelListUrls(setting.transApis);
    if (normalizedTransApis === setting.transApis) {
      return;
    }

    updateSetting((prev) => {
      const prevTransApis = Array.isArray(prev?.transApis)
        ? prev.transApis
        : [];
      const nextTransApis = normalizeApiModelListUrls(prevTransApis);
      if (nextTransApis === prevTransApis) {
        return prev;
      }
      return {
        ...prev,
        transApis: nextTransApis,
      };
    });
  }, [setting?.transApis, updateSetting]);

                                 
                                               
  const userApis = useMemo(
    () => transApis.filter((api) => !API_SPE_TYPES.builtin.has(api.apiSlug)),
    [transApis]
  );

                
  const builtinApis = useMemo(
    () => transApis.filter((api) => API_SPE_TYPES.builtin.has(api.apiSlug)),
    [transApis]
  );

                   
  const enabledApis = useMemo(
    () => transApis.filter((api) => !api.isDisabled),
    [transApis]
  );

                          
  const aiEnabledApis = useMemo(
    () => enabledApis.filter((api) => API_SPE_TYPES.ai.has(api.apiType)),
    [enabledApis]
  );

                  
  const addApi = useCallback(
    (apiType) => {
                             
      const defaultApiOpt =
        DEFAULT_API_LIST.find((da) => da.apiType === apiType) || {};
      const uuid = crypto.randomUUID();
                                               
      const apiSlug = `${apiType}_${crypto.randomUUID()}`;
      const apiName = `${apiType}_${uuid.slice(0, 8)}`;
      const newApi = {
        ...defaultApiOpt,
        apiSlug,
        apiName,
        apiType,
      };
      updateSetting((prev) => ({
        ...prev,
        transApis: [...(prev?.transApis || []), newApi],
      }));
    },
    [updateSetting]
  );

                                      
  const copyApi = useCallback(
    (sourceApi) => {
      const uuid = crypto.randomUUID();
      const apiSlug = `${sourceApi.apiType}_${uuid}`;
      const apiName = `${sourceApi.apiName} - copy`;
      const newApi = {
        ...sourceApi,
        apiSlug,
        apiName,
      };
      updateSetting((prev) => ({
        ...prev,
        transApis: [...(prev?.transApis || []), newApi],
      }));
    },
    [updateSetting]
  );

                                             
  const deleteApis = useCallback(
    (apiSlugs) => {
      if (!Array.isArray(apiSlugs) || apiSlugs.length === 0) {
        return;
      }

      updateSetting((prev) => {
        const apiSlugSet = new Set(apiSlugs);
        const defaultApiSlugs = DEFAULT_API_LIST.filter((api) =>
          apiSlugSet.has(api.apiSlug)
        ).map((api) => api.apiSlug);
        const deletedTransApiSlugs =
          defaultApiSlugs.length > 0
            ? Array.from(
                new Set([
                  ...(prev?.deletedTransApiSlugs || []),
                  ...defaultApiSlugs,
                ])
              )
            : prev?.deletedTransApiSlugs || [];

        return {
          ...prev,
          deletedTransApiSlugs,
          transApis: (prev?.transApis || []).filter(
            (api) => !apiSlugSet.has(api.apiSlug)
          ),
        };
      });
    },
    [updateSetting]
  );

                   
  const deleteApi = useCallback(
    (apiSlug) => {
      deleteApis([apiSlug]);
    },
    [deleteApis]
  );

                                  
  const pinApis = useCallback(
    (apiSlugs) => {
      if (!Array.isArray(apiSlugs) || apiSlugs.length === 0) {
        return;
      }

      updateSetting((prev) => {
        const apiSlugSet = new Set(apiSlugs);
        const nextApis = getDisplayOrderedApis(prev?.transApis || []).map(
          (api) =>
            apiSlugSet.has(api.apiSlug) && !api.isDisabled
              ? { ...api, sortOrder: -1 }
              : api
        );

        return {
          ...prev,
          transApis: normalizeApiOrder(nextApis),
        };
      });
    },
    [updateSetting]
  );

                        
  const disableApis = useCallback(
    (apiSlugs) => {
      if (!Array.isArray(apiSlugs) || apiSlugs.length === 0) {
        return;
      }

      updateSetting((prev) => {
        const apiSlugSet = new Set(apiSlugs);
        const nextApis = getDisplayOrderedApis(prev?.transApis || []).map(
          (api) =>
            apiSlugSet.has(api.apiSlug)
              ? { ...api, isDisabled: true, sortOrder: 999 }
              : api
        );

        return {
          ...prev,
          transApis: normalizeApiOrder(nextApis),
        };
      });
    },
    [updateSetting]
  );

                                     
  const enableApis = useCallback(
    (apiSlugs) => {
      if (!Array.isArray(apiSlugs) || apiSlugs.length === 0) {
        return;
      }

      updateSetting((prev) => {
        const apiSlugSet = new Set(apiSlugs);
        const nextApis = getDisplayOrderedApis(prev?.transApis || []).map(
          (api) => {
            if (!apiSlugSet.has(api.apiSlug) || !api.isDisabled) {
              return api;
            }

            return { ...api, isDisabled: false, chainDisabled: false, sortOrder: 0 };
          }
        );

        return {
          ...prev,
          transApis: normalizeApiOrder(nextApis),
        };
      });
    },
    [updateSetting]
  );

                              
  const alphaSortApis = useCallback(
    (direction = "asc") => {
      updateSetting((prev) => {
        const apis = prev?.transApis || [];
                                        
        const pinnedApis = apis.filter(
          (a) => a.sortOrder === -1 && !a.isDisabled
        );
                                        
        const disabledApis = apis.filter((a) => a.isDisabled);
                           
        const normalApis = apis.filter(
          (a) => a.sortOrder !== -1 && !a.isDisabled
        );

               
        const sorted = [...normalApis].sort((a, b) => {
          const nameA = (a.apiName || "").toLowerCase();
          const nameB = (b.apiName || "").toLowerCase();
          return direction === "asc"
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
        });

                                                         
        return {
          ...prev,
          transApis: normalizeApiOrder([
            ...pinnedApis,
            ...sorted,
            ...disabledApis,
          ]),
        };
      });
    },
    [updateSetting]
  );

  const reorderApis = useCallback(
    (activeSlug, overSlug) => {
      if (!activeSlug || !overSlug || activeSlug === overSlug) return;

      updateSetting((prev) => {
        const apis = [...(prev?.transApis || [])].sort(
          (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
        );
        const fromIndex = apis.findIndex((api) => api.apiSlug === activeSlug);
        const toIndex = apis.findIndex((api) => api.apiSlug === overSlug);

        if (fromIndex < 0 || toIndex < 0) {
          return prev;
        }

        const nextApis = [...apis];
        const [movedApi] = nextApis.splice(fromIndex, 1);
        nextApis.splice(toIndex, 0, movedApi);

        return {
          ...prev,
          transApis: normalizeApiOrder(nextApis),
        };
      });
    },
    [updateSetting]
  );

  return {
    transApis,
    userApis,
    builtinApis,
    enabledApis,
    aiEnabledApis,
    addApi,
    copyApi,
    deleteApi,
    deleteApis,
    pinApis,
    disableApis,
    enableApis,
    alphaSortApis,
    reorderApis,
  };
}

   
                            
                                        
   
export function useApiItem(apiSlug) {
  const { transApis, updateSetting } = useApiState();

                 
  const api = useMemo(
    () => transApis.find((a) => a.apiSlug === apiSlug),
    [transApis, apiSlug]
  );

                                     
  const update = useCallback(
    (updateData) => {
      updateSetting((prev) => ({
        ...prev,
        transApis: (prev?.transApis || []).map((item) =>
          item.apiSlug === apiSlug ? { ...item, ...updateData, apiSlug } : item
        ),
      }));
    },
    [apiSlug, updateSetting]
  );

                                                                   
  const reset = useCallback(() => {
    updateSetting((prev) => ({
      ...prev,
      transApis: (prev?.transApis || []).map((item) => {
        if (item.apiSlug === apiSlug) {
          const defaultApiOpt =
            DEFAULT_API_LIST.find((da) => da.apiType === item.apiType) || {};
          return {
            ...defaultApiOpt,
            apiSlug: item.apiSlug,
            apiName: item.apiName,
            apiType: item.apiType,
            key: item.key,
          };
        }
        return item;
      }),
    }));
  }, [apiSlug, updateSetting]);

  return { api, update, reset };
}
