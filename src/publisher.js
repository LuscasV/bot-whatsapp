const fs = require("fs");

// ========================================
// CONFIGURAÇÃO DOS GRUPOS
// ========================================

function getTargetGroups() {

const groups = [

    process.env.TARGET_GROUP_1,

    process.env.TARGET_GROUP_2

];

return groups.filter(Boolean);

}

// ========================================
// CONFIGURAÇÃO DE RETRY
// ========================================

const RETRY_DELAY = 10000;

// ========================================
// PAUSA ENTRE ENVIO DE MENSAGENS
// ========================================

function delay(ms) {

return new Promise((resolve) => {

    setTimeout(resolve, ms);

});

}

// ========================================
// PUBLICAR UMA MÍDIA
// ========================================

async function publishMedia(sock, groupId, media) {

try {

    console.log("\n📤 Enviando mídia...");

    console.log("Grupo:", groupId);

    console.log("Tipo:", media.type);

    console.log("Arquivo:", media.fileName);


    // ========================================
    // IMAGEM
    // ========================================

    if (media.type === "image") {

        await sock.sendMessage(

            groupId,

            {

                image: {

                    url: media.filePath

                },

                caption: media.caption || undefined

            }

        );

    }


    // ========================================
    // VÍDEO
    // ========================================

    else if (media.type === "video") {

        await sock.sendMessage(

            groupId,

            {

                video: {

                    url: media.filePath

                },

                caption: media.caption || undefined

            }

        );

    }


    console.log("✅ Mídia enviada com sucesso!");

    return true;


} catch (error) {

    console.error("\n❌ Erro ao enviar mídia.");

    console.error(
        "Arquivo:",
        media.fileName
    );

    console.error(
        "Grupo:",
        groupId
    );

    console.error(error);

    return false;

}

}

// ========================================
// PUBLICAR COM RETRY INFINITO
// ========================================

async function publishMediaWithRetry(
sock,
groupId,
media
) {

let attempts = 0;


while (true) {

    attempts++;


    console.log(

        `\n🔄 Tentativa ${attempts}`

    );


    const success = await publishMedia(

        sock,

        groupId,

        media

    );


    if (success) {

        return true;

    }


    console.log(

        `⏳ Falhou. Nova tentativa em ${RETRY_DELAY / 1000} segundos...`

    );


    await delay(RETRY_DELAY);

}

}

// ========================================
// PUBLICAR LOTE
// ========================================

async function publishBatch(sock, batch) {

const groups = getTargetGroups();


console.log("\n");

console.log("=================================");

console.log("      INICIANDO PUBLICAÇÃO");

console.log("=================================");

console.log(

    "Quantidade de mídias:",

    batch.length

);

console.log(

    "Grupos de destino:",

    groups.length

);


// ========================================
// PUBLICAR EM CADA GRUPO
// ========================================

for (const groupId of groups) {

    console.log("\n---------------------------------");

    console.log(

        "📢 Publicando no grupo:",

        groupId

    );

    console.log("---------------------------------");


    // ========================================
    // PUBLICAR CADA MÍDIA NA ORDEM
    // ========================================

    for (const media of batch) {

        await publishMediaWithRetry(

            sock,

            groupId,

            media

        );


        // Pequeno intervalo entre mídias

        await delay(1500);

    }


    // Intervalo antes do próximo grupo

    await delay(3000);

}


console.log("\n");

console.log("=================================");

console.log("     PUBLICAÇÃO FINALIZADA");

console.log("=================================\n");


return true;

}

module.exports = {

publishBatch

};