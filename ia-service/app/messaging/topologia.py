"""Nomes e declaração da topologia (idêntica à declarada pelo pedagogico-service)."""
import aio_pika
from aio_pika.abc import AbstractChannel, AbstractExchange

EXCHANGE = "sabia.eventos"
DLX = "sabia.eventos.dlx"
FILA_SUBMISSAO_REVISAO = "ia.submissao-revisao.queue"
FILA_SUBMISSAO_REVISAO_DLQ = f"{FILA_SUBMISSAO_REVISAO}.dlq"
BINDING_SUBMISSAO_ENVIADA = "submissao.enviada"


async def declarar(channel: AbstractChannel) -> tuple[AbstractExchange, aio_pika.abc.AbstractQueue]:
    exchange = await channel.declare_exchange(EXCHANGE, aio_pika.ExchangeType.TOPIC, durable=True)
    dlx = await channel.declare_exchange(DLX, aio_pika.ExchangeType.DIRECT, durable=True)

    dlq = await channel.declare_queue(FILA_SUBMISSAO_REVISAO_DLQ, durable=True)
    await dlq.bind(dlx, routing_key=FILA_SUBMISSAO_REVISAO_DLQ)

    fila = await channel.declare_queue(
        FILA_SUBMISSAO_REVISAO,
        durable=True,
        arguments={
            "x-dead-letter-exchange": DLX,
            "x-dead-letter-routing-key": FILA_SUBMISSAO_REVISAO_DLQ,
        },
    )
    await fila.bind(exchange, routing_key=BINDING_SUBMISSAO_ENVIADA)
    return exchange, fila
