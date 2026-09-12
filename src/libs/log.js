   
               
                                                                                 
   

         
export const LogLevel = {
  DEBUG: { value: 0, name: "DEBUG", color: "#6495ED" },       
  INFO: { value: 1, name: "INFO", color: "#4CAF50" },      
  WARN: { value: 2, name: "WARN", color: "#FFC107" },       
  ERROR: { value: 3, name: "ERROR", color: "#F44336" },      
  SILENT: { value: 4, name: "SILENT" },                 
};

                    
function findLogLevelByValue(value) {
  return Object.values(LogLevel).find((level) => level.value === value);
}

                    
function findLogLevelByName(name) {
  if (typeof name !== "string" || name.length === 0) return undefined;
  const upperCaseName = name.toUpperCase();
  return Object.values(LogLevel).find((level) => level.name === upperCaseName);
}

   
                    
   
class Logger {
     
                                      
                                                                
                                                                 
     
  constructor(options = {}) {
    this.config = {
      level: options.level || LogLevel.INFO,
      prefix: options.prefix || "ParallelText",
    };
  }

     
             
                                                   
     
  setLevel(level) {
    let newLevelObject;

    if (typeof level === "string") {
      newLevelObject = findLogLevelByName(level);
      if (!newLevelObject) {
        this.warn(
          `Invalid log level name provided: "${level}". Keeping current level.`
        );
        return;
      }
    } else if (typeof level === "number") {
      newLevelObject = findLogLevelByValue(level);
      if (!newLevelObject) {
        this.warn(
          `Invalid log level value provided: ${level}. Keeping current level.`
        );
        return;
      }
    } else if (level && typeof level.value === "number") {
      newLevelObject = level;
    } else {
      this.warn(
        "Invalid argument passed to setLevel. Must be a LogLevel object, number, or string."
      );
      return;
    }

    if (this.config.level.value !== newLevelObject.value) {
      this.config.level = newLevelObject;
      console.log(
        `[${this.config.prefix}] Log level dynamically set to ${this.config.level.name}`
      );
    }
  }

     
             
             
                                        
                                            
     
  _log(level, ...args) {
                           
    if (level.value < this.config.level.value) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefixStr = `[${this.config.prefix}]`;
    const levelStr = `[${level.name}]`;

                                   
    const isBrowser =
      typeof window !== "undefined" && typeof window.document !== "undefined";

    if (isBrowser) {
                    
      const consoleMethod = this._getConsoleMethod(level);
      consoleMethod(
        `%c${timestamp} %c${prefixStr} %c${levelStr}`,
        "color: gray; font-weight: lighter;",         
        "color: #7c57e0; font-weight: bold;",             
        `color: ${level.color}; font-weight: bold;`,          
        ...args
      );
    } else {
                                   
      const consoleMethod = this._getConsoleMethod(level);
      consoleMethod(timestamp, prefixStr, levelStr, ...args);
    }
  }

     
                           
             
                            
                                   
     
  _getConsoleMethod(level) {
    switch (level) {
      case LogLevel.ERROR:
        return console.error;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.INFO:
        return console.info;
      default:
        return console.log;
    }
  }

     
                   
                         
     
  debug(...args) {
    this._log(LogLevel.DEBUG, ...args);
  }

     
                  
                         
     
  info(...args) {
    this._log(LogLevel.INFO, ...args);
  }

     
                  
                         
     
  warn(...args) {
    this._log(LogLevel.WARN, ...args);
  }

     
                   
                         
     
  error(...args) {
    this._log(LogLevel.ERROR, ...args);
  }
}

                      
export const logger = new Logger();

                                                                          
                                                        
export const kissLog = logger.info.bind(logger);

                 
