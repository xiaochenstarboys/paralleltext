import { DEFAULT_FETCH_INTERVAL, DEFAULT_FETCH_LIMIT } from "../config";
import { kissLog } from "./log";

   
                
                                                   
   
class TaskPool {
  #pool = [];            

  #maxRetry = 2;          
  #retryInterval = 1000;                    
  #limit;           
  #interval;                           

  #currentConcurrent = 0;              
  #lastExecutionTime = 0;                      
  #schedulerTimer = null;                   
  #retryTimers = new Set();                                         

     
         
                                        
                                  
                                           
     
  constructor(
    interval = DEFAULT_FETCH_INTERVAL,
    limit = DEFAULT_FETCH_LIMIT,
    retryInterval = 1000
  ) {
    this.#interval = interval;
    this.#limit = limit;
    this.#retryInterval = retryInterval;
  }

     
        
                                    
     
  #scheduleNext() {
                             
    if (this.#schedulerTimer) {
      return;
    }

                                  
    if (this.#currentConcurrent >= this.#limit || this.#pool.length === 0) {
      return;
    }

    const now = Date.now();
    const timeSinceLast = now - this.#lastExecutionTime;
                                        
    const delay = Math.max(0, this.#interval - timeSinceLast);

    this.#schedulerTimer = setTimeout(() => {
      this.#schedulerTimer = null;
                              
      if (this.#currentConcurrent < this.#limit && this.#pool.length > 0) {
        const task = this.#pool.shift();
        if (task) {
          this.#lastExecutionTime = Date.now();
          this.#execute(task);
        }
      }

                          
      if (this.#pool.length > 0) {
        this.#scheduleNext();
      }
    }, delay);
  }

     
           
                                                            
     
  async #execute(task) {
    this.#currentConcurrent++;
    const { fn, args, resolve, reject, retry } = task;

    try {
                    
      const res = await fn(args);
      resolve(res);
    } catch (err) {
                                                            
      if (err?.name === "AbortError") {
        reject(err);
        return;
      }
      kissLog("task pool", err);
                                 
      if (retry < this.#maxRetry) {
        const timer = setTimeout(() => {
          this.#retryTimers.delete(entry);
                                        
          this.#pool.unshift({ ...task, retry: retry + 1 });
          this.#scheduleNext();
        }, this.#retryInterval);
        const entry = { timer, task };
        this.#retryTimers.add(entry);
      } else {
                                    
        reject(err);
      }
    } finally {
                           
      this.#currentConcurrent--;
      this.#scheduleNext();
    }
  }

     
                 
                                    
                            
                                                    
     
  push(fn, args) {
    return new Promise((resolve, reject) => {
      this.#pool.push({ fn, args, resolve, reject, retry: 0 });
      this.#scheduleNext();
    });
  }

     
                 
                                            
                                    
     
  update(interval, limit) {
    if (interval >= 0) {
      this.#interval = interval;
    }
    if (limit >= 1) {
      this.#limit = limit;
    }

    this.#scheduleNext();
  }

     
          
                                   
                                       
     
  clear() {
                     
    for (const task of this.#pool) {
      task.reject("the task pool was cleared");
    }

             
    this.#pool.length = 0;
                 
    if (this.#schedulerTimer) {
      clearTimeout(this.#schedulerTimer);
      this.#schedulerTimer = null;
    }
                                         
    for (const entry of this.#retryTimers) {
      clearTimeout(entry.timer);
      entry.task.reject("the task pool was cleared");
    }
    this.#retryTimers.clear();
  }
}

   
             
   
let fetchPool;

   
                
                                        
                                  
                      
   
export const getFetchPool = (interval, limit) => {
  if (!fetchPool) {
    fetchPool = new TaskPool(
      interval ?? DEFAULT_FETCH_INTERVAL,
      limit ?? DEFAULT_FETCH_LIMIT
    );
  } else if (interval != null || limit != null) {
                                       
    updateFetchPool(interval, limit);
  }
  return fetchPool;
};

   
            
                                      
                                
   
export const updateFetchPool = (interval, limit) => {
  fetchPool?.update(interval, limit);
};

   
                
   
export const clearFetchPool = () => {
  fetchPool?.clear();
};
