import pymysql
import requests
import time
from datetime import datetime, timedelta

# Configurações do Banco
DB_CONFIG = {
    'host': '192.168.0.17',
    'user': 'connectdl',
    'password': '123456',
    'database': 'glpi10'
}

# Configurações WhatsApp
WHATSAPP = {
    'phone': '558189481449',
    'apikey': '4710604'
}

ultima_verificacao = datetime.now() - timedelta(minutes=2)

def verificar_chamados():
    global ultima_verificacao
    try:
        print("🔄 Conectando ao banco...")
        conexao = pymysql.connect(**DB_CONFIG)
        cursor = conexao.cursor()

        data_verificacao = ultima_verificacao.strftime('%Y-%m-%d %H:%M:%S')
        print(f"📋 Buscando novos chamados criados após {data_verificacao}")

        cursor.execute("""
            SELECT id, name, date
            FROM glpi_tickets
            WHERE status = 1 AND is_deleted = 0 AND date > %s
        """, (data_verificacao,))

        novos_chamados = cursor.fetchall()
        print(f"Encontrados {len(novos_chamados)} novos chamados")

        for id_chamado, titulo, data in novos_chamados:
            print(f"➡️ Enviando chamado ID {id_chamado} para WhatsApp...")
            mensagem = f"Novo Chamado GLPI\nID: {id_chamado}\nTítulo: {titulo}"
            try:
                response = requests.get(
                    'https://api.callmebot.com/whatsapp.php',
                    params={
                        'phone': WHATSAPP['phone'],
                        'text': mensagem,
                        'apikey': WHATSAPP['apikey']
                    },
                    timeout=10
                )
                if response.status_code == 200:
                    print("✅ Enviado com sucesso!")
                else:
                    print(f"❌ Erro na API: {response.text}")
            except Exception as e:
                print(f"❌ Falha ao enviar WhatsApp: {e}")

        ultima_verificacao = datetime.now()

        cursor.close()
        conexao.close()
        print("✅ Verificação finalizada.\n")

    except Exception as e:
        print(f"❌ Erro geral: {e}")

def enviar_chamados_sem_validacao():
    try:
        print("🔄 Verificando chamados sem validação...")
        conexao = pymysql.connect(**DB_CONFIG)
        cursor = conexao.cursor()

        cursor.execute("""
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
              AND b.users_id_validate = 9
        """)

        resultados = cursor.fetchall()
        quantidade = len(resultados)
        print(f"🔎 {quantidade} chamados sem validação encontrados.")

        mensagem = f"Você possui {quantidade} chamado(s) em andamento aguardando validação."

        try:
            response = requests.get(
                'https://api.callmebot.com/whatsapp.php',
                params={
                    'phone': WHATSAPP['phone'],
                    'text': mensagem,
                    'apikey': WHATSAPP['apikey']
                },
                timeout=10
            )
            if response.status_code == 200:
                print("✅ Mensagem enviada com sucesso!")
            else:
                print(f"❌ Erro na API: {response.text}")
        except Exception as e:
            print(f"❌ Falha ao enviar WhatsApp: {e}")

        cursor.close()
        conexao.close()
        print("✅ Consulta e envio finalizados.\n")

    except Exception as e:
        print(f"❌ Erro ao consultar chamados sem validação: {e}")

if __name__ == "__main__":
    print("🚀 Monitoramento GLPI-WhatsApp iniciado...")
    # Envia a quantidade de chamados sem validação ao iniciar
    enviar_chamados_sem_validacao()
    # Depois entra no loop normal de monitoramento
    while True:
        verificar_chamados()
        time.sleep(10)