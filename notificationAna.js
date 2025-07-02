// Importa bibliotecas necessárias
import notifier from "node-notifier"; // Biblioteca para mostrar notificações na área de trabalho
import open from "open"; // Abre URLs no navegador padrão
import path from "path"; // Manipula caminhos de diretórios
import { fileURLToPath } from "url"; // Converte a URL do arquivo para um caminho tradicional
import mysql from "mysql2/promise"; // Cliente MySQL moderno com suporte a async/await

// Adaptando para ES Modules, pois __dirname não está disponível nativamente
const __filename = fileURLToPath(import.meta.url); // Caminho completo do arquivo atual
const __dirname = path.dirname(__filename); // Nome da pasta onde o arquivo está

// Caminho absoluto para o ícone que será usado na notificação
const iconPath = path.join(__dirname, "/download.ico");

// Função principal para verificar as solicitações pendentes
async function verificarSolicitacoes() {
  let connection; // Variável que vai guardar a conexão com o banco de dados
  try {
    // Estabelece conexão com o banco de dados MySQL
    connection = await mysql.createConnection({
      host: "192.168.0.17", // Endereço do banco de dados
      user: "connectdl",    // Nome do usuário de acesso
      password: "123456",   // Senha desse usuário
      database: "glpi10",   // Nome do banco que será acessado
    });

    // Executa uma consulta SQL para encontrar solicitações pendentes de validação para o usuário ID 8
    const [rows] = await connection.execute(`
      SELECT b.tickets_id,
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
      FROM glpi_tickets a,
           glpi_ticketvalidations b,
           glpi_users c
      WHERE a.id = b.tickets_id
        AND b.users_id_validate = c.id
        AND a.status = 2
        AND b.validation_date IS NULL
        AND b.users_id_validate = 8;
    `);

    // Conta o total de solicitações encontradas
    const totalSolicitacoes = rows.length;

    // Define a mensagem da notificação conforme o número de resultados
    let mensagem = "";
    if (totalSolicitacoes === 1) {
      mensagem = "Existe 1 solicitação em aberto!";
    } else {
      mensagem = `Existem ${totalSolicitacoes} solicitações em aberto!`;
    }

    // Se houver solicitações, dispara a notificação visual
    if (totalSolicitacoes > 0) {
      notifier.notify({
        title: "🔔 Solicitações Abertas",
        message: mensagem,
        sound: true,         // Faz som ao exibir
        icon: iconPath,      // Exibe o ícone personalizado
        timeout: 10,         // Some após 10 segundos
        // wait: true,       // Você pode ativar isso se quiser que a execução espere por uma ação
      });

      // Se o usuário clicar na notificação, abre o link do GLPI
      notifier.on("click", () => {
        open("http://mp.uniforca.com.br/front/central.php");
      });

      // Caso o tempo da notificação acabe sem interação
      notifier.on("timeout", () => {
        console.log("Notificação fechada sem interação.");
      });
    } else {
      console.log("Nenhuma solicitação aberta no momento.");
    }

  } catch (err) {
    // Em caso de erro na conexão ou execução da query
    console.error("Erro ao verificar solicitações:", err);
  } finally {
    // Garante que a conexão com o banco será encerrada
    if (connection) {
      await connection.end();
    }
  }
}

// Executa a função de verificação a cada 5 minutos (300.000 milissegundos)
setInterval(verificarSolicitacoes, 300000);

// Também executa a verificação imediatamente ao iniciar o script
verificarSolicitacoes();
