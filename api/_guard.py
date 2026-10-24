"""Límites anti-abuso por IP, en memoria (sin base de datos ni estado persistente).

Segunda capa, después de la regla de firewall de Vercel (20 req/min por IP a /api/):
- LIMIT_PER_MIN predicciones por minuto por IP.
- LIMIT_PER_DAY_IP predicciones por día por IP.
Los contadores viven en cada instancia de la función: alcanzan para frenar a un cliente
insistente; el tope duro del costo es el propio plan Hobby (que pausa en vez de cobrar).
"""
import os
import time
from collections import defaultdict, deque
from dataclasses import dataclass

LIMIT_PER_MIN = int(os.environ.get("LIMIT_PER_MIN", "6"))
LIMIT_PER_DAY_IP = int(os.environ.get("LIMIT_PER_DAY_IP", "40"))
MAX_TRACKED_IPS = 5000  # acota la memoria si llegan muchas IPs distintas


@dataclass
class Decision:
    allowed: bool
    message: str = ""
    retry_after: int = 0


def client_ip(request) -> str:
    fwd = request.headers.get("x-vercel-forwarded-for") or request.headers.get("x-forwarded-for") or ""
    return fwd.split(",")[0].strip() or (request.client.host if request.client else "unknown")


class Guard:
    def __init__(self):
        self._hits: dict[str, deque] = defaultdict(deque)  # ip -> timestamps de la última jornada

    def _prune(self, now: float) -> None:
        for ip in [ip for ip, hits in self._hits.items() if not hits or now - hits[-1] > 86400]:
            del self._hits[ip]

    def check(self, ip: str) -> Decision:
        now = time.time()
        if len(self._hits) > MAX_TRACKED_IPS:
            self._prune(now)
        hits = self._hits[ip]
        while hits and now - hits[0] > 86400:
            hits.popleft()
        per_min = sum(1 for t in hits if now - t < 60)
        if len(hits) >= LIMIT_PER_DAY_IP:
            return Decision(False, "Alcanzaste el límite diario de predicciones para tu conexión.", 3600)
        if per_min >= LIMIT_PER_MIN:
            return Decision(False, "Demasiadas consultas seguidas. Esperá un minuto.", 60)
        return Decision(True)

    def record(self, ip: str) -> None:
        self._hits[ip].append(time.time())
