const {
downloadMediaMessage
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const fs = require("fs");
const path = require("path");

// ========================================
// SALVAR IMAGEM OU VÍDEO
// ========================================

async function saveMedia(message, type, mimetype) {

try {

    console.log(`Baixando ${type}...`);


    const buffer = await downloadMediaMessage(
        message,
        "buffer",
        {},
        {
            logger: pino({ level: "silent" }),
            reuploadRequest: null
        }
    );


    // ========================================
    // PASTA MEDIA
    // ========================================

    const mediaDir = path.join(
        __dirname,
        "..",
        "media"
    );

    if (!fs.existsSync(mediaDir)) {

        fs.mkdirSync(mediaDir, {
            recursive: true
        });

    }


    // ========================================
    // DESCOBRIR EXTENSÃO
    // ========================================

    let extension = "bin";

    if (mimetype) {

        const parts = mimetype.split("/");

        if (parts.length === 2) {

            extension = parts[1];

        }

    }


    // JPEG → JPG
    if (extension === "jpeg") {

        extension = "jpg";

    }


    // ========================================
    // PREFIXO DO ARQUIVO
    // ========================================

    const prefix =
        type === "image"
            ? "imagem"
            : "video";


    // Nome único
    const fileName =
        `${prefix}_${Date.now()}.${extension}`;


    const filePath = path.join(
        mediaDir,
        fileName
    );


    // ========================================
    // SALVAR ARQUIVO
    // ========================================

    fs.writeFileSync(
        filePath,
        buffer
    );


    console.log("📁 Mídia salva com sucesso!");
    console.log("Arquivo:", fileName);


    // ========================================
    // RETORNAR INFORMAÇÕES
    // ========================================

    return {
        fileName,
        filePath,
        type,
        mimetype
    };


} catch (error) {

    console.error(
        `❌ Erro ao baixar ${type}:`
    );

    console.error(error);

    return null;

}

}

// ========================================
// EXPORTAÇÃO
// ========================================

module.exports = {
saveMedia
};