require("dotenv").config();

const { startWhatsApp } = require("./whatsapp");

async function main() {
    console.log("=================================");
    console.log("      BOT DE OFERTAS");
    console.log("=================================\n");

    await startWhatsApp();
}

main();