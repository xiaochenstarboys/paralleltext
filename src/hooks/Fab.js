import { STOKEY_FAB } from "../config";
import { useStorage } from "./Storage";

const DEFAULT_FAB = { hideExceptionList: "" };

   
                                             
                                       
   
export function useFab() {
                                            
  const { data, update } = useStorage(STOKEY_FAB, DEFAULT_FAB);
  return { fab: data, updateFab: update };
}
