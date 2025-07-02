import notifier from "node-notifier";
import open from "open";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

// Necessário para usar __dirname com ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho absoluto do ícone
const iconPath = path.join(__dirname, "/download.ico");

// Função para conectar ao banco e buscar solicitações
async function verificarSolicitacoes() {
  let connection;
  try {
    // Cria conexão com o banco
    connection = await mysql.createConnection({
      host: "192.168.0.17",
      user: "connectdl",
      password: "123456",
      database: "glpi10"
    });

    // Executa a query
    const [rows] = await connection.execute(`
      select b.tickets_id,
             a.name,
             CASE a.status
                WHEN 1 THEN 'Novo'
                WHEN 2 THEN 'Em andamento (atribuído)'
                WHEN 3 THEN 'Em andamento (planejado)'
                WHEN 4 THEN 'Pendente'
                WHEN 5 THEN 'Resolvido'
                WHEN 6 THEN 'Fechado'
                ELSE 'Desconhecido'
             END AS status_descricao,
             b.users_id_validate,
             c.name
      from glpi_tickets a, glpi_ticketvalidations b, glpi_users c
      where a.id = b.tickets_id
        and b.users_id_validate = c.id
        and a.status = 2
        and b.users_id_validate = 8;
    `);

    const totalSolicitacoes = rows.length;

    // Monta mensagem de acordo com o resultado
    let mensagem = "";
    if (totalSolicitacoes === 1) {
      mensagem = "Existe 1 solicitação em aberto!";
    } else {
      mensagem = `Existem ${totalSolicitacoes} solicitações em aberto!`;
    }

    // Se houver solicitações, dispara a notificação
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
        // Link para GLPI ou página desejada
        open("http://mp.uniforca.com.br/front/central.php"); 
      });

      notifier.on("timeout", () => {
        console.log("Notificação fechada sem interação.");
      });
    } else {
      console.log("Nenhuma solicitação aberta no momento.");
    }

  } catch (err) {
    console.error("Erro ao verificar solicitações:", err);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Executa a verificação a cada 5 minutos (300000 ms)
setInterval(verificarSolicitacoes, 300000);

// Executa imediatamente ao iniciar
verificarSolicitacoes();
