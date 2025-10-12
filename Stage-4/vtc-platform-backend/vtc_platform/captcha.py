# vtc_platform/captcha.py
import os
import json
import urllib.request
import urllib.parse
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


def get_client_ip(request):
    """Récupère l'IP client (gère X-Forwarded-For si présent)."""
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def verify_turnstile_token(token: str, remoteip: str | None = None):
    """
    Vérifie le token Turnstile côté serveur.
    Retourne (ok: bool, payload: dict)
    """
    # On accepte settings.TURNSTILE_SECRET OU la variable d'env directe
    secret = getattr(settings, "TURNSTILE_SECRET", "") or os.getenv("TURNSTILE_SECRET", "")

    if not secret:
        logger.warning("Turnstile: secret key manquante dans le process (settings/env).")
        return False, {"error": "missing_secret_or_token", "which": "secret_empty_in_server"}
    if not token:
        logger.warning("Turnstile: token manquant dans la requête (captcha_token).")
        return False, {"error": "missing_secret_or_token", "which": "token_missing_in_request"}

    data = urllib.parse.urlencode({
        "secret": secret,
        "response": token,
        **({"remoteip": remoteip} if remoteip else {}),
    }).encode()

    req = urllib.request.Request(
        TURNSTILE_VERIFY_URL,
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
            ok = bool(payload.get("success"))
            logger.info("Turnstile verify: ok=%s, action=%s, cdata=%s, errors=%s",
                        ok, payload.get("action"), payload.get("cdata"), payload.get("error-codes"))
            return ok, payload
    except Exception as e:
        logger.exception("Turnstile verification exception")
        return False, {"exception": str(e)}
