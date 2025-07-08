import pymysql
from winotify import Notification, audio
import os
import time
import traceback  # Para mostrar o erro completo

# Caminho absoluto para o ícone
icon_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "download.ico")

def mostrar_notificacao(mensagem):
    toast = Notification(
        app_id="GLPINotificador",  # Use um nome sem espaço, igual ao teste que funcionou
        title="🔔 Solicitações Abertas",
        msg=mensagem,
        icon=icon_path if os.path.exists(icon_path) else None
    )
    toast.set_audio(audio.Default, loop=False)
    toast.add_actions(label="Abrir GLPI", launch="http://mp.uniforca.com.br/front/central.php")
    toast.show()

def verificar_solicitacoes():
    try:
        # Tenta conectar ao banco de dados e mostra erro detalhado se falhar
        try:
            conn = pymysql.connect(
                host="192.168.0.17",
                user="connectdl",
                password="123456",
                database="glpi10"
            )
        except pymysql.MySQLError as err:
            print("Erro ao conectar no MySQL:", err)
            traceback.print_exc()
            return

        cursor = conn.cursor()

        # Consulta SQL
        query = """
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
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        total_solicitacoes = len(rows)

        print("Total de solicitações encontradas:", total_solicitacoes)

        if total_solicitacoes == 1:
            mensagem = "Existe 1 solicitação em aberto!"
        else:
            mensagem = f"Existem {total_solicitacoes} solicitações em aberto!"

        if total_solicitacoes > 0:
            print("Chamando notificação...")
            mostrar_notificacao(mensagem)
        else:
            print("Nenhuma solicitação aberta no momento.")

        cursor.close()
        conn.close()
    except Exception:
        print("Erro ao verificar solicitações:")
        traceback.print_exc()

if __name__ == "__main__":
    while True:
        verificar_solicitacoes()
        time.sleep(300)  # 5 minutos