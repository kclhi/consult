var winston = require('winston');

var customLogLevels = {
  levels: {
    experiment: -1,
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
  },
  colors: {
    experiment: "green",
    error: "red",
    warn: "yellow",
    info: "blue",
    http: "white",
    verbose: "white",
    debug: "orange",
  }
};

// define the custom settings for each transport (file, console)
var options = {
  experimentFile: {
    level: 'experiment',
    filename: `experiment.log`,
    json: false,
    format: winston.format.printf(({ level, message, label, timestamp }) => { return `${message}`; }) // Plaintext output to support CSV.
  },
  file: {
    level: 'info',
    filename: `app.log`,
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false,
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
  }
};

// instantiate a new Winston Logger with the settings defined above
var logger = winston.createLogger({
  levels: customLogLevels.levels,
  transports: [
    new winston.transports.File(options.experimentFile),
    new winston.transports.File(options.file),
    new winston.transports.Console(options.console),
  ],
  exitOnError: false, // do not exit on handled exceptions
});

winston.addColors(customLogLevels.colors);

// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
  write: function(message, encoding) {
    // use the 'info' log level so the output will be picked up by both transports (file and console)
    logger.info(message);
  },
};

module.exports = logger;
