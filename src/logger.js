const fs = require("fs");
const path = require("path");

// ========================================
// CONFIGURAÇÃO
// ========================================

const logsDir = path.join(
__dirname,
"..",
"logs"
);

// Cria a pasta logs caso não exista

if (!fs.existsSync(logsDir)) {

fs.mkdirSync(
    logsDir,
    { recursive: true }
);

}

// ========================================
// DATA E HORA
// ========================================

function getDateTime() {

const now = new Date();

return now.toLocaleString(
    "pt-BR"
);

}

// ========================================
// NOME DO ARQUIVO DIÁRIO
// ========================================

function getDailyLogFile() {

const now = new Date();

const date = now
    .toISOString()
    .split("T")[0];

return path.join(

    logsDir,

    `${date}.log`

);

}

// ========================================
// ESCREVER LOG
// ========================================

function writeLog(
level,
message
) {

const timestamp =
    getDateTime();

const formattedMessage =

    `[${timestamp}] [${level}] ${message}\n`;


const logFile =
    getDailyLogFile();


fs.appendFileSync(

    logFile,

    formattedMessage

);


// Erros também vão para errors.log

if (level === "ERROR") {

    const errorFile = path.join(

        logsDir,

        "errors.log"

    );

    fs.appendFileSync(

        errorFile,

        formattedMessage

    );

}

}

// ========================================
// TIPOS DE LOG
// ========================================

function info(message) {

writeLog(
    "INFO",
    message
);

}

function success(message) {

writeLog(
    "SUCCESS",
    message
);

}

function warning(message) {

writeLog(
    "WARNING",
    message
);

}

function error(message) {

writeLog(
    "ERROR",
    message
);

}

// ========================================
// EXPORTAR
// ========================================

module.exports = {

info,

success,

warning,

error

};