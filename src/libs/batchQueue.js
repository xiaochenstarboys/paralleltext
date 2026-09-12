import {
  DEFAULT_BATCH_INTERVAL,
  DEFAULT_BATCH_SIZE,
  DEFAULT_BATCH_LENGTH,
  DEFAULT_BATCH_CONCURRENCY,
} from "../config";

   
            
                                                             
                                                 
  
                                        
                                   
                                                               
                                                       
                                                                      
                                                          
                                                   
   
const BatchQueue = (
  taskFn,
  {
    batchInterval = DEFAULT_BATCH_INTERVAL,
    batchSize = DEFAULT_BATCH_SIZE,
    batchLength = DEFAULT_BATCH_LENGTH,
    batchConcurrency = DEFAULT_BATCH_CONCURRENCY,
  } = {}
) => {
  const queue = [];                
  const configuredBatchConcurrency = Number(batchConcurrency);
  const concurrency =
    Number.isFinite(configuredBatchConcurrency) &&
    configuredBatchConcurrency >= 1
      ? Math.floor(configuredBatchConcurrency)
      : DEFAULT_BATCH_CONCURRENCY;
  let activeBatchCount = 0;              
  let timer = null;                

     
               
                                                                                               
                                                                          
                                                                            
     
  const processQueue = async () => {
                     
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

                              
    if (queue.length === 0 || activeBatchCount >= concurrency) {
      return;
    }

    activeBatchCount++;

    let tasksToProcess = [];
    let currentBatchLength = 0;
    let endIndex = 0;

                                                           
    for (const task of queue) {
      const textLength = task.payload?.length || 0;
      if (
        endIndex >= batchSize ||
        (currentBatchLength + textLength > batchLength && endIndex > 0)
      ) {
        break;
      }
      currentBatchLength += textLength;
      endIndex++;
    }

                     
    if (endIndex > 0) {
      tasksToProcess = queue.splice(0, endIndex);
    }

    if (tasksToProcess.length === 0) {
      activeBatchCount--;
      return;
    }

    try {
      const payloads = tasksToProcess.map((item) => item.payload);
                                                 
      const batchController = new AbortController();
      tasksToProcess.forEach((task) => {
        task.abortBatch = () => {
          if (tasksToProcess.every((item) => item.resolved)) batchController.abort();
        };
      });
      const batchArgs = { ...tasksToProcess[0].args, signal: batchController.signal };

                                                 
      const generator = taskFn(payloads, batchArgs);

                                            
      if (generator && typeof generator[Symbol.asyncIterator] === "function") {
        for await (const item of generator) {
          const id = item.id;
          const isComplete = item.isComplete !== false;                
          const taskItem = tasksToProcess[id];

          if (taskItem && !taskItem.resolved) {
                                                        
            if (!isComplete && taskItem.args?.onStreamChunk) {
              taskItem.args.onStreamChunk({
                id,
                text: item.partialText,
                isComplete: false,
              });
            }
                                                     
            if (isComplete) {
              if (taskItem.args?.onStreamChunk) {
                taskItem.args.onStreamChunk({
                  id,
                  text: item.result,
                  isComplete: true,
                });
              }
              if (!taskItem.resolved) {
                taskItem.resolved = true;
                taskItem.resolve(item.result);
              }
            }
          }
        }

                                          
        tasksToProcess.forEach((taskItem, index) => {
          if (!taskItem.resolved) {
            taskItem.reject(
              new Error(`No response for item at index ${index}`)
            );
          }
        });
      } else {
                                              
        const responses = await generator;
        if (!Array.isArray(responses)) {
          throw new Error("responses format error");
        }

        tasksToProcess.forEach((taskItem, index) => {
          if (taskItem.resolved) return;
          const response = responses[index];
          if (response) {
            taskItem.resolve(response);
          } else {
            taskItem.reject(
              new Error(`No response for item at index ${index}`)
            );
          }
        });
      }
    } catch (error) {
                                                     
      tasksToProcess.forEach((taskItem) => {
        if (!taskItem.resolved) {
          taskItem.resolved = true;
          taskItem.reject(error);
        }
      });
    } finally {
      activeBatchCount--;
                                     
      if (queue.length > 0) {
        if (queue.length >= batchSize) {
          setTimeout(processQueue, 0);                       
        } else {
          scheduleProcessing();                  
        }
      }
    }
  };

     
                   
     
  const scheduleProcessing = () => {
    if (activeBatchCount < concurrency && !timer && queue.length > 0) {
      timer = setTimeout(processQueue, batchInterval);
    }
  };

     
                     
                                      
                                        
                               
     
  const addTask = (data, args) => {
    return new Promise((resolve, reject) => {
                               
      if (destroyed) {
        reject(new Error("Queue instance was destroyed."));
        return;
      }
      if (args?.signal?.aborted) {
        reject(new DOMException("The operation was aborted.", "AbortError"));
        return;
      }
      const cleanup = () => args?.signal?.removeEventListener("abort", onAbort);
      const task = {
        payload: data, args, resolved: false,
        resolve: (value) => { task.resolved = true; cleanup(); resolve(value); },
        reject: (error) => { task.resolved = true; cleanup(); reject(error); },
      };
      const onAbort = () => {
        if (task.resolved) return;
        const index = queue.indexOf(task);
        if (index >= 0) queue.splice(index, 1);
        task.reject(new DOMException("The operation was aborted.", "AbortError"));
        task.abortBatch?.();
      };
      args?.signal?.addEventListener("abort", onAbort, { once: true });
      queue.push(task);

                                  
      if (queue.length >= batchSize) {
        processQueue();
      } else {
        scheduleProcessing();
      }
    });
  };

  let destroyed = false;

     
                              
     
  const destroy = () => {
    destroyed = true;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    queue.forEach((task) =>
      task.reject(new Error("Queue instance was destroyed."))
    );
    queue.length = 0;
  };

  return { addTask, destroy, get destroyed() { return destroyed; } };
};

                                              
const queueMap = new Map();

   
                          
                             
                                  
                                 
                                  
   
export const getBatchQueue = (key, taskFn, options) => {
  if (queueMap.has(key)) {
    return queueMap.get(key);
  }

  const queue = BatchQueue(taskFn, options);
  queueMap.set(key, queue);
  return queue;
};

   
                  
   
export const clearAllBatchQueue = () => {
  for (const queue of queueMap.values()) {
    queue.destroy();
  }
                                    
                                             
  queueMap.clear();
};
