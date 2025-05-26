import notifier from "node-notifier";
import open from "open";
import path from "path";
import { fileURLToPath } from "url";

// Necessário para usar __dirname com ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho absoluto do ícone
const iconPath = path.join(__dirname, "/download.ico");

// Simula a verificação de solicitações abertas
function verificarSolicitacoes() {
  const totalSolicitacoes = Math.floor(Math.random() * 6);

  // Referente mudança singular e Plural.
  let mensagem = "";
  if (totalSolicitacoes === 1) {
    mensagem = "Existe 1 solicitação em aberto!";
  } else {
    mensagem = `Existem ${totalSolicitacoes} solicitações em aberto!`;
  }

  if (totalSolicitacoes > 0) {
    notifier.notify({
      title: "🔔 Solicitações Abertas",
      message: mensagem,
      sound: true,
      icon: iconPath,
      timeout: 10
      // wait: true,
    });

    notifier.on("click", () => {
      open("https://www.linkedin.com/in/lucasserafimx/");
    });

    notifier.on("timeout", () => {
      console.log("Notificação fechada sem interação.");
    });
  } else {
    console.log("Nenhuma solicitação aberta no momento.");
  }
}

// Executa a verificação a cada 5 segundos
setInterval(verificarSolicitacoes, 5000);
verificarSolicitacoes();
