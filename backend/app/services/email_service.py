import os
import smtplib
from email.message import EmailMessage


def send_email(to_email: str, subject: str, body: str) -> bool:
    host = os.getenv("SMTP_HOST")
    port = os.getenv("SMTP_PORT", "587")
    username = os.getenv("SMTP_USERNAME")
    password = os.getenv("SMTP_PASSWORD")
    sender = os.getenv("SMTP_FROM_EMAIL") or username
    use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in {
        "1", "true", "yes"
    }

    if not host or not sender:
        return False

    try:
        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = sender
        message["To"] = to_email
        message.set_content(body)

        with smtplib.SMTP(host, int(port), timeout=10) as server:
            if use_tls:
                server.starttls()

            if username and password:
                server.login(username, password)

            server.send_message(message)

        return True
    except Exception:
        return False
