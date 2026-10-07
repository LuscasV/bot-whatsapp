const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const qrcode = require("qrcode-terminal");

const { saveMedia } = require("./media");
const { addToBatch,setWhatsAppSocket } = require("./batch");

function getSenderId(message) {

    return (
        message.key.participant ||
        message.key.remoteJid ||
        null
    );

}

async function startWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState("./auth");

    const { version } = await fetchLatestBaileysVersion();

    console.log("Iniciando WhatsApp...");
    console.log("Versão Baileys:", version.join("."));

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false
    });

    setWhatsAppSocket(sock);


    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // Mostra QR Code
        if (qr) {
            console.log("\nEscaneie o QR Code abaixo com o WhatsApp:\n");
            qrcode.generate(qr, { small: true });
        }

        // Conectado
        if (connection === "open") {

    console.log("\nWhatsApp conectado com sucesso! ✅");

    try {

        console.log("\nCarregando grupos...");

        const groups =
            await sock.groupFetchAllParticipating();


        console.log("\n=================================");
        console.log("        GRUPOS DISPONÍVEIS");
        console.log("=================================\n");


        Object.values(groups).forEach((group) => {

            console.log("NOME:", group.subject);

            console.log("ID:", group.id);

            console.log("---------------------------------");

        });


    } catch (error) {

        console.error("❌ Erro ao carregar grupos:");

        console.error(error);

    }

}

        // Conexão fechada
        if (connection === "close") {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !==
                DisconnectReason.loggedOut;

            console.log("Conexão fechada.");

            if (shouldReconnect) {
                console.log("Tentando reconectar...");
                startWhatsApp();
            } else {
                console.log(
                    "Sessão encerrada. Apague a pasta auth e conecte novamente."
                );
            }
        }
    });

    // ========================================
// RECEBER MENSAGENS
// ========================================

sock.ev.on("messages.upsert", async ({ messages, type }) => {

    if (type !== "notify") {
        return;
    }

    for (const message of messages) {

        if (!message.message) {
            continue;
        }

        const remoteJid = message.key.remoteJid;
        const senderId = getSenderId(message);
        
        const AUTHORIZED_SENDER = process.env.AUTHORIZED_SENDER;

        // Ignora mensagens enviadas pelo próprio bot
        if (message.key.fromMe) {
            continue;
        }

        // ========================================
        // VERIFICAR REMETENTE AUTORIZADO
        // ========================================

        if (senderId !== AUTHORIZED_SENDER) {
            console.log("⛔ Mensagem ignorada.");
            console.log("Remetente não autorizado:", senderId);

            continue;
}
        

console.log("\n=================================");
console.log("NOVA MENSAGEM AUTORIZADA");
console.log("=================================");

console.log("Conversa:", remoteJid);
console.log("Remetente:", senderId);

// ========================================
// MENSAGEM DE TEXTO SIMPLES
// ========================================

if (message.message.conversation) {

    console.log("TIPO: TEXTO");
    console.log("CONTEÚDO:", message.message.conversation);
}


// ========================================
// TEXTO ESTENDIDO
// ========================================

else if (message.message.extendedTextMessage) {

    console.log("TIPO: TEXTO");
    console.log(
        "CONTEÚDO:",
        message.message.extendedTextMessage.text
    );
}


// ========================================
// IMAGEM
// ========================================

else if (message.message.imageMessage) {

    const image = message.message.imageMessage;

    console.log("TIPO: IMAGEM");

    console.log(
        "LEGENDA:",
        image.caption || "(sem legenda)"
    );

    console.log(
        "MIME TYPE:",
        image.mimetype
    );


    const savedMedia = await saveMedia(
        message,
        "image",
        image.mimetype
    );


    if (savedMedia) {

        console.log(
            "CAMINHO:",
            savedMedia.filePath
        );


        addToBatch({
            ...savedMedia,
            caption: image.caption || null,
            receivedAt: new Date()
        });

    }

}

// ========================================
// VÍDEO
// ========================================

else if (message.message.videoMessage) {

    const video = message.message.videoMessage;

    console.log("TIPO: VÍDEO");

    console.log(
        "LEGENDA:",
        video.caption || "(sem legenda)"
    );

    console.log(
        "MIME TYPE:",
        video.mimetype
    );

    console.log(
        "DURAÇÃO:",
        video.seconds,
        "segundos"
    );


    const savedMedia = await saveMedia(
        message,
        "video",
        video.mimetype
    );


    if (savedMedia) {

        console.log(
            "CAMINHO:",
            savedMedia.filePath
        );


        addToBatch({
            ...savedMedia,
            caption: video.caption || null,
            receivedAt: new Date()
        });

    }

}

// ========================================
// ÁLBUM DO WHATSAPP
// ========================================

else if (message.message.albumMessage) {

    console.log("📚 Álbum detectado...");

}

// ========================================
// OUTROS TIPOS
// ========================================

else {

    console.log("TIPO: DESCONHECIDO");

    console.log(
        JSON.stringify(
            message.message,
            null,
            2
        )
    );
}
}

});

    // Salva credenciais
    sock.ev.on("creds.update", saveCreds);

    return sock;
}

module.exports = {
    startWhatsApp
};