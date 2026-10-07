const fs = require("fs");
const path = require("path");

// ========================================
// CAMINHOS
// ========================================

const dataDir = path.join(
__dirname,
"..",
"data"
);

const queueFile = path.join(
dataDir,
"queue.json"
);

// ========================================
// GARANTIR PASTA DATA
// ========================================

if (!fs.existsSync(dataDir)) {

fs.mkdirSync(
    dataDir,
    {
        recursive: true
    }
);

}

// ========================================
// CARREGAR FILA
// ========================================

function loadQueue() {

try {

    if (!fs.existsSync(queueFile)) {

        return [];

    }


    const content = fs.readFileSync(
        queueFile,
        "utf8"
    );


    if (!content.trim()) {

        return [];

    }


    const queue = JSON.parse(
        content
    );


    if (!Array.isArray(queue)) {

        console.error(
            "⚠️ queue.json inválido. Criando nova fila."
        );

        return [];

    }


    console.log(
        `📂 Fila carregada do disco: ${queue.length} lote(s).`
    );


    return queue;


} catch (error) {

    console.error(
        "❌ Erro ao carregar fila:"
    );

    console.error(error);


    return [];

}

}

// ========================================
// SALVAR FILA
// ========================================

function saveQueue(queue) {

try {

    fs.writeFileSync(

        queueFile,

        JSON.stringify(
            queue,
            null,
            2
        )

    );


    return true;


} catch (error) {

    console.error(
        "❌ Erro ao salvar fila:"
    );

    console.error(error);


    return false;

}

}

// ========================================
// EXPORTAR
// ========================================

module.exports = {

loadQueue,

saveQueue

};