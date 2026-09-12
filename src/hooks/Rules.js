import { STOKEY_RULES, DEFAULT_RULES } from "../config";
import { useStorage } from "./Storage";
import { useCallback } from "react";

   
                                  
   
export function useRules() {
                               
  const { data: list = [], save: saveRules } = useStorage(
    STOKEY_RULES,
    DEFAULT_RULES
  );

                                             
  const add = useCallback(
    (rule) => {
      saveRules((prev) => {
        if (
          rule.pattern === "*" ||
          prev.some((item) => item.pattern === rule.pattern)
        ) {
          return prev;
        }
        return [rule, ...prev];
      });
    },
    [saveRules]
  );

                                           
  const del = useCallback(
    (pattern) => {
      saveRules((prev) => {
        if (pattern === "*") {
          return prev;
        }
        return prev.filter((item) => item.pattern !== pattern);
      });
    },
    [saveRules]
  );

                           
  const clear = useCallback(() => {
    saveRules((prev) => prev.filter((item) => item.pattern === "*"));
  }, [saveRules]);

                              
  const put = useCallback(
    (pattern, obj) => {
      saveRules((prev) => {
        return prev.map((item) =>
          item.pattern === pattern ? { ...item, ...obj } : item
        );
      });
    },
    [saveRules]
  );

  return { list, add, del, clear, put };
}
