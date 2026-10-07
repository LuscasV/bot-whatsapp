const { publishBatch } = require("./publisher");
const { updateStatus } = require("./status");
const { loadQueue, saveQueue } = require("./queue");

const logger = require("./logger");
const fs = require("fs");

// ========================================
// ESTADO DO LOTE ATUAL
// ========================================

let currentBatch = [];

let batchTimer = null;

let whatsappSocket = null;

// ========================================
// FILA DE PUBLICAÇÃO
// ========================================

let publicationQueue = loadQueue();

let isPublishing = false;

// ========================================
// CONFIGURAÇÃO
// ========================================

// Tempo sem receber mídias para considerar o lote encerrado

const BATCH_TIMEOUT = 30000;

// ========================================
// RECEBER CONEXÃO DO WHATSAPP
// ========================================

function setWhatsAppSocket(sock) {

    whatsappSocket = sock;

    console.log("🔌 Publisher conectado ao WhatsApp.");

    logger.success(
        "Publisher conectado ao WhatsApp."
    );


    // ========================================
    // VERIFICAR FILA SALVA
    // ========================================

    if (publicationQueue.length > 0) {

        console.log(
            `📂 ${publicationQueue.length} lote(s) pendente(s) encontrado(s).`
        );

        console.log(
            "▶️ Retomando processamento da fila..."
        );


        logger.info(
            `Retomando fila salva. Lotes pendentes: ${publicationQueue.length}`
        );


        // Pequeno atraso para garantir
        // que o socket esteja completamente pronto

        setTimeout(() => {

            processQueue();

        }, 3000);

    }

}

// ========================================
// ADICIONAR MÍDIA AO LOTE
// ========================================

function addToBatch(media) {

    currentBatch.push({

        order: currentBatch.length + 1,

        ...media

    });


    console.log("\n📦 MÍDIA ADICIONADA AO LOTE");

    console.log(
        "Tipo:",
        media.type.toUpperCase()
    );

    console.log(
        "Ordem:",
        currentBatch.length
    );

    console.log(
        "Arquivo:",
        media.fileName
    );

    console.log(
        "Legenda:",
        media.caption || "(sem legenda)"
    );


    // ========================================
    // REINICIAR TEMPORIZADOR
    // ========================================

    if (batchTimer) {

        clearTimeout(batchTimer);

    }


    batchTimer = setTimeout(() => {

        finishBatch();

    }, BATCH_TIMEOUT);

}

// ========================================
// LIMPAR MÍDIAS PUBLICADAS
// ========================================

function deletePublishedMedia(batch) {

    console.log("\n🗑️ Limpando arquivos publicados...");


    batch.forEach((media) => {

        try {

            if (fs.existsSync(media.filePath)) {

                fs.unlinkSync(media.filePath);

                console.log(
                    "🗑️ Arquivo removido:",
                    media.fileName
                );

            } else {

                console.log(
                    "⚠️ Arquivo não encontrado:",
                    media.fileName
                );

            }

        } catch (error) {

            console.error(
                "❌ Erro ao remover arquivo:",
                media.fileName
            );

            console.error(error);

        }

    });


    console.log(
        "✅ Limpeza de mídias concluída."
    );

}

// ========================================
// FINALIZAR LOTE
// ========================================

function finishBatch() {

    if (currentBatch.length === 0) {

        return;

    }


    // ========================================
    // COPIA O LOTE ATUAL
    // ========================================

    const batchToPublish = [

        ...currentBatch

    ];


    // ========================================
    // LIMPA IMEDIATAMENTE O LOTE ATUAL
    //
    // Isso permite receber novas mídias
    // enquanto o lote anterior publica.
    // ========================================

    currentBatch = [];

    batchTimer = null;


    console.log("\n");

    console.log("=================================");

    console.log("        LOTE FINALIZADO");

    console.log("=================================");

    console.log(
        "Quantidade de mídias:",
        batchToPublish.length
    );

    console.log("\nMÍDIAS:");


    batchToPublish.forEach((item) => {

        console.log(
            `${item.order} → ${item.type.toUpperCase()} → ${item.fileName}`
        );


        if (item.caption) {

            console.log(
                `    Legenda: ${item.caption}`
            );

        }

    });


    console.log("=================================\n");


    // ========================================
    // ADICIONAR LOTE À FILA
    // ========================================

    publicationQueue.push(batchToPublish);

    saveQueue(publicationQueue);

    console.log("📥 LOTE ADICIONADO À FILA");

    console.log(
        "Lotes aguardando:",
        publicationQueue.length
    );

    // Atualiza status

    updateStatus({

        queue: publicationQueue.length

    });

    logger.info(

        `Lote adicionado à fila. Total na fila: ${publicationQueue.length}`

    );


    // ========================================
    // INICIAR PROCESSAMENTO DA FILA
    // ========================================

    processQueue();

}

// ========================================
// PROCESSAR FILA DE PUBLICAÇÃO
// ========================================

async function processQueue() {

    // Se já existe uma publicação acontecendo,
    // não inicia outra.

    if (isPublishing) {

        console.log(
            "⏳ Publisher ocupado. Lote aguardando na fila."
        );

        return;

    }


    // Se não existe nenhum lote na fila,
    // não faz nada.

    if (publicationQueue.length === 0) {

        return;

    }


    // Verifica se o WhatsApp está conectado.

    if (!whatsappSocket) {

        console.error(
            "❌ WhatsApp não está conectado ao publisher."
        );

        return;

    }


    // Marca o publisher como ocupado.

    isPublishing = true;

    updateStatus({

        publishing: true,

        queue: publicationQueue.length

    });

    logger.info(

        `Iniciando processamento da fila. Lotes: ${publicationQueue.length}`

    );


    console.log("\n");

    console.log("=================================");

    console.log("      PROCESSANDO FILA");

    console.log("=================================");


    // ========================================
    // PROCESSA UM LOTE POR VEZ
    // ========================================

    while (publicationQueue.length > 0) {


        // Pega sempre o primeiro lote da fila.

        const batchToPublish = publicationQueue[0];


        console.log("\n📦 PRÓXIMO LOTE DA FILA");

        console.log(
            "Quantidade de mídias:",
            batchToPublish.length
        );

        console.log(
            "Lotes na fila:",
            publicationQueue.length
        );


        try {


            // ========================================
            // PUBLICAR LOTE
            // ========================================

            await publishBatch(

                whatsappSocket,

                batchToPublish

            );


            console.log(
                "✅ Lote publicado com sucesso."
            );

            logger.success(
                `Lote publicado com sucesso. Mídias: ${ batchToPublish.length }`
            );

            updateStatus({

                lastPublication:

                    new Date().toISOString(),

                lastError: null

            });


            // ========================================
            // LIMPAR ARQUIVOS
            //
            // Só acontece depois que TODOS
            // os grupos receberam o lote.
            // ========================================

            deletePublishedMedia(
                batchToPublish
            );


            // ========================================
            // REMOVER LOTE DA FILA
            // ========================================

            publicationQueue.shift();


            saveQueue(publicationQueue);

            console.log(
                "🗑️ Lote removido da fila."
            );

            updateStatus({

                queue: publicationQueue.length

            });


            console.log(
                "📊 Lotes restantes:",
                publicationQueue.length
            );


        } catch (error) {


            console.error(
                "❌ Erro inesperado ao publicar lote:"
            );

            console.error(error);

            const errorMessage =
                error?.message ||
                String(error);

            logger.error(

                `Erro ao publicar lote: ${errorMessage}`

            );

            updateStatus({

                lastError: errorMessage,

                publishing: true,

                queue: publicationQueue.length

            });


            // Não remove o lote da fila.
            // Aguarda e tenta novamente.

            console.log(
                "⏳ O lote permanecerá na fila."
            );

            console.log(
                "🔄 Nova tentativa em 10 segundos..."
            );


            await new Promise((resolve) => {

                setTimeout(resolve, 10000);

            });

        }

    }


    // ========================================
    // FILA FINALIZADA
    // ========================================

    isPublishing = false;

    updateStatus({

        publishing: false,

        queue: 0

    });

    logger.info(
        "Fila de publicação finalizada."
    );


    console.log("\n");

    console.log("=================================");

    console.log("        FILA FINALIZADA");

    console.log("=================================\n");

}

// ========================================
// EXPORTAR FUNÇÕES
// ========================================

module.exports = {

    addToBatch,

    setWhatsAppSocket

};