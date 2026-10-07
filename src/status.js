const fs = require("fs");
const path = require("path");

// ========================================
// CAMINHO DO ARQUIVO
// ========================================

const dataDir = path.join(
__dirname,
"..",
"data"
);

const statusFile = path.join(
dataDir,
"status.json"
);

// ========================================
// CRIAR PASTA DATA
// ========================================

if (!fs.existsSync(dataDir)) {

fs.mkdirSync(
    dataDir,
    { recursive: true }
);

}

// ========================================
// STATUS PADRÃO
// ========================================

const defaultStatus = {

whatsapp: "starting",

publishing: false,

queue: 0,

lastPublication: null,

lastError: null,

updatedAt: null

};

// ========================================
// LER STATUS ATUAL
// ========================================

function getStatus() {

try {

    if (!fs.existsSync(statusFile)) {

        return {
            ...defaultStatus
        };

    }

    const content = fs.readFileSync(
        statusFile,
        "utf8"
    );

    return JSON.parse(content);

} catch (error) {

    console.error(
        "❌ Erro ao ler status.json:"
    );

    console.error(error);

    return {
        ...defaultStatus
    };

}

}

// ========================================
// ATUALIZAR STATUS
// ========================================

function updateStatus(data) {

try {

    const currentStatus =
        getStatus();


    const newStatus = {

        ...currentStatus,

        ...data,

        updatedAt:
            new Date().toISOString()

    };


    fs.writeFileSync(

        statusFile,

        JSON.stringify(
            newStatus,
            null,
            2
        )

    );


    return newStatus;


} catch (error) {

    console.error(
        "❌ Erro ao atualizar status:"
    );

    console.error(error);

    return null;

}

}

// ========================================
// EXPORTAR
// ========================================

module.exports = {

getStatus,

updateStatus

};