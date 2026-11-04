#!/usr/bin/env python3
"""Reenvia mensagens de uma DLQ do RabbitMQ para o exchange de eventos (reprocessamento).

Uso:
    python3 scripts/reprocessar-dlq.py pedagogico.aluno-perfil.queue.dlq [--max 100] [--dry-run]

Usa a API de gerenciamento (RABBITMQ_MANAGEMENT_URL, RABBITMQ_USER, RABBITMQ_PASS).
A mensagem sai da DLQ e é republicada com a routing key original (propriedade `type`);
o messageId é preservado, então consumidores idempotentes não aplicam o efeito duas vezes.
Corrija a causa da falha antes de reprocessar, senão a mensagem volta para a DLQ.
"""
import argparse
import base64
import json
import os
import sys
import urllib.parse
import urllib.request

EXCHANGE = "sabia.eventos"


def chamar(base: str, auth: str, caminho: str, corpo: dict | None = None):
    req = urllib.request.Request(
        f"{base}{caminho}",
        data=json.dumps(corpo).encode() if corpo is not None else None,
        headers={"Authorization": f"Basic {auth}", "Content-Type": "application/json"},
        method="POST" if corpo is not None else "GET",
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.load(resp)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("dlq", help="nome da DLQ (termina em .dlq)")
    parser.add_argument("--max", type=int, default=100, help="máximo de mensagens (padrão: 100)")
    parser.add_argument("--dry-run", action="store_true", help="só lista, sem mover")
    args = parser.parse_args()

    if not args.dlq.endswith(".dlq"):
        print("Informe uma fila terminada em .dlq", file=sys.stderr)
        return 2

    base = os.environ.get("RABBITMQ_MANAGEMENT_URL", "http://localhost:15672").rstrip("/")
    usuario = os.environ.get("RABBITMQ_USER", "sabia")
    senha = os.environ.get("RABBITMQ_PASS", "sabia")
    auth = base64.b64encode(f"{usuario}:{senha}".encode()).decode()
    fila = urllib.parse.quote(args.dlq, safe="")

    # ack_requeue_true no dry-run: apenas inspeciona; senão remove da DLQ ao ler.
    mensagens = chamar(base, auth, f"/api/queues/%2F/{fila}/get", {
        "count": args.max,
        "ackmode": "ack_requeue_true" if args.dry_run else "ack_requeue_false",
        "encoding": "auto",
    })
    for m in mensagens:
        props = m.get("properties", {})
        chave = props.get("type") or json.loads(m["payload"]).get("eventType")
        print(f"messageId={props.get('message_id')} eventType={chave}")
        if args.dry_run:
            continue
        resposta = chamar(base, auth, f"/api/exchanges/%2F/{EXCHANGE}/publish", {
            "routing_key": chave,
            "payload": m["payload"],
            "payload_encoding": m.get("payload_encoding", "string"),
            "properties": {k: v for k, v in props.items() if k in
                           ("message_id", "correlation_id", "type", "content_type", "delivery_mode", "headers")},
        })
        if not resposta.get("routed"):
            print(f"  ATENÇÃO: sem fila de destino para {chave}", file=sys.stderr)
    print(f"{len(mensagens)} mensagem(ns) {'listada(s)' if args.dry_run else 'reenviada(s)'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
