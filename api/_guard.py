"""Límites anti-abuso + historial (Neon Postgres opcional).

Objetivo: que bots/tráfico no puedan agotar el free tier de Vercel Hobby ni de Neon.
- Por IP (hash): LIMIT_PER_MIN por minuto y LIMIT_PER_DAY_IP por día.
- Global: LIMIT_PER_DAY_GLOBAL predicciones por día (tope duro de costo).
- Almacenamiento acotado: sólo (resultado, probabilidad, hash de IP, fecha) y purga a 2 días.
Si no hay DATABASE_URL (o la DB falla) se degrada a contadores en memoria por instancia.
"""
import hashlib
import os
import random
import time
from collections import defaultdict, deque
from contextlib import contextmanager
from dataclasses import dataclass

LIMIT_PER_MIN = int(os.environ.get("LIMIT_PER_MIN", "6"))
LIMIT_PER_DAY_IP = int(os.environ.get("LIMIT_PER_DAY_IP", "40"))
LIMIT_PER_DAY_GLOBAL = int(os.environ.get("LIMIT_PER_DAY_GLOBAL", "1500"))
SALT = os.environ.get("IP_HASH_SALT", "bankml-demo")
DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("POSTGRES_URL")
RETENTION = "2 days"
TIER_CODES = {"baja": 0, "media": 1, "alta": 2}
TIER_NAMES = {v: k for k, v in TIER_CODES.items()}

DDL = """
CREATE TABLE IF NOT EXISTS predictions (
    id BIGSERIAL PRIMARY KEY,
    tier SMALLINT NOT NULL,
    probability REAL NOT NULL,
    ip_hash CHAR(16) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS predictions_created_at_idx ON predictions (created_at);
"""


@dataclass
class Decision:
    allowed: bool
    message: str = ""
    retry_after: int = 0


def client_ip(request) -> str:
    fwd = request.headers.get("x-vercel-forwarded-for") or request.headers.get("x-forwarded-for") or ""
    return (fwd.split(",")[0].strip() or (request.client.host if request.client else "unknown"))


def _hash(ip: str) -> str:
    return hashlib.sha256(f"{SALT}:{ip}".encode()).hexdigest()[:16]


class Guard:
    def __init__(self):
        self.db_enabled = bool(DATABASE_URL)
        self._schema_ready = False
        self._mem_hits = defaultdict(deque)  # ip_hash -> timestamps (fallback)
        self._mem_history = deque(maxlen=50)

    # ---- DB helpers -------------------------------------------------------
    @contextmanager
    def _conn(self):
        import psycopg

        with psycopg.connect(DATABASE_URL, connect_timeout=5, autocommit=True) as conn:
            if not self._schema_ready:
                conn.execute(DDL)
                self._schema_ready = True
            yield conn

    # ---- API --------------------------------------------------------------
    def check(self, ip: str) -> Decision:
        h = _hash(ip)
        if self.db_enabled:
            try:
                with self._conn() as conn:
                    per_min, per_day, global_day = conn.execute(
                        """
                        SELECT
                          count(*) FILTER (WHERE ip_hash = %s AND created_at > now() - interval '1 minute'),
                          count(*) FILTER (WHERE ip_hash = %s),
                          count(*) FILTER (WHERE created_at >= date_trunc('day', now()))
                        FROM predictions WHERE created_at > now() - interval '1 day'
                        """,
                        (h, h),
                    ).fetchone()
                return self._decide(per_min, per_day, global_day)
            except Exception:
                pass  # degradar a memoria
        return self._check_memory(h)

    def record(self, ip: str, tier: str, probability: float) -> None:
        h = _hash(ip)
        self._mem_history.appendleft({"tier": tier, "probability": probability,
                                      "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())})
        if not self.db_enabled:
            self._mem_hits[h].append(time.time())
            return
        try:
            with self._conn() as conn:
                conn.execute("INSERT INTO predictions (tier, probability, ip_hash) VALUES (%s, %s, %s)",
                             (TIER_CODES[tier], probability, h))
                if random.random() < 0.05:  # purga ocasional: mantiene la tabla diminuta
                    conn.execute(f"DELETE FROM predictions WHERE created_at < now() - interval '{RETENTION}'")
        except Exception:
            self._mem_hits[h].append(time.time())

    def history(self, limit: int):
        if self.db_enabled:
            try:
                with self._conn() as conn:
                    rows = conn.execute(
                        "SELECT id, tier, probability, created_at FROM predictions ORDER BY id DESC LIMIT %s",
                        (limit,),
                    ).fetchall()
                return [{"id": r[0], "tier": TIER_NAMES.get(r[1], "baja"), "probability": r[2],
                         "created_at": r[3].isoformat()} for r in rows]
            except Exception:
                pass
        return [{"id": i, **r} for i, r in enumerate(list(self._mem_history)[:limit])]

    # ---- reglas -----------------------------------------------------------
    @staticmethod
    def _decide(per_min: int, per_day: int, global_day: int) -> Decision:
        if global_day >= LIMIT_PER_DAY_GLOBAL:
            return Decision(False, "La demo alcanzó su límite diario de predicciones. Volvé mañana.", 3600)
        if per_day >= LIMIT_PER_DAY_IP:
            return Decision(False, "Alcanzaste el límite diario de predicciones para tu conexión.", 3600)
        if per_min >= LIMIT_PER_MIN:
            return Decision(False, "Demasiadas consultas seguidas. Esperá un minuto.", 60)
        return Decision(True)

    def _check_memory(self, h: str) -> Decision:
        now = time.time()
        hits = self._mem_hits[h]
        while hits and now - hits[0] > 86400:
            hits.popleft()
        per_min = sum(1 for t in hits if now - t < 60)
        return self._decide(per_min, len(hits), len(self._mem_history))
