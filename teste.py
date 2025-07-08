from winotify import Notification

toast = Notification(
    app_id="MeuAppTeste",
    title="Teste de Notificação",
    msg="Se você está vendo isso, seu app deve aparecer na lista!"
)
toast.show()