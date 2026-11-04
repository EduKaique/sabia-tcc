"""Conexão com o RabbitMQ: reconexão automática, consumo da fila e status para o health check."""
import asyncio
import logging

import aio_pika
from aio_pika.abc import AbstractIncomingMessage, AbstractRobustConnection

from app.core.config import Settings
from app.messaging import contratos, topologia
from app.messaging.consumidor import ProcessadorRevisao, Resultado, serializar
from app.messaging.logs import configurar
from app.services.revisao import RevisaoService

logger = logging.getLogger("sabia.mensageria")

INTERVALO_RECONEXAO = 5.0


class Broker:
    def __init__(self, settings: Settings, revisao_service: RevisaoService) -> None:
        self.settings = settings
        self._connection: AbstractRobustConnection | None = None
        self._exchange: aio_pika.abc.AbstractExchange | None = None
        self._task: asyncio.Task | None = None
        self.processador = ProcessadorRevisao(
            revisao_service,
            self._publicar,
            max_tentativas=settings.rabbitmq_retry_max_attempts,
            intervalo_inicial=settings.rabbitmq_retry_initial_interval,
        )

    @property
    def status(self) -> str:
        if not self.settings.rabbitmq_enabled:
            return "DISABLED"
        if self._connection is not None and not self._connection.is_closed:
            return "UP"
        return "DOWN"

    def iniciar(self) -> None:
        if not self.settings.rabbitmq_enabled:
            return
        configurar()
        self._task = asyncio.create_task(self._conectar_e_consumir())

    async def parar(self) -> None:
        if self._task:
            self._task.cancel()
            await asyncio.gather(self._task, return_exceptions=True)
        if self._connection is not None:
            await self._connection.close()

    async def _conectar_e_consumir(self) -> None:
        s = self.settings
        while True:
            try:
                self._connection = await aio_pika.connect_robust(
                    host=s.rabbitmq_host,
                    port=s.rabbitmq_port,
                    login=s.rabbitmq_user,
                    password=s.rabbitmq_pass,
                    virtualhost=s.rabbitmq_vhost,
                    timeout=5,
                )
                channel = await self._connection.channel(publisher_confirms=True)
                # Revisão por IA é lenta e limitada por cota: uma mensagem por vez.
                await channel.set_qos(prefetch_count=1)
                self._exchange, fila = await topologia.declarar(channel)
                await fila.consume(self._ao_receber)
                logger.info("Consumindo %s", topologia.FILA_SUBMISSAO_REVISAO)
                await asyncio.Event().wait()
            except asyncio.CancelledError:
                raise
            except Exception as exc:  # noqa: BLE001
                logger.warning("RabbitMQ indisponível (%s); nova tentativa em %.0fs",
                               type(exc).__name__, INTERVALO_RECONEXAO)
                await asyncio.sleep(INTERVALO_RECONEXAO)

    async def _ao_receber(self, mensagem: AbstractIncomingMessage) -> None:
        try:
            resultado = await self.processador.tratar(mensagem.body)
        except Exception:  # noqa: BLE001 - nunca deixar a mensagem sem ack/reject
            logger.exception("Erro inesperado ao tratar mensagem")
            resultado = Resultado.DLQ
        if resultado is Resultado.ACK:
            await mensagem.ack()
        else:
            await mensagem.reject(requeue=False)

    async def _publicar(self, envelope: contratos.EnvelopeEvento) -> None:
        if self._exchange is None:
            raise RuntimeError("RabbitMQ não conectado")
        mensagem = aio_pika.Message(
            body=serializar(envelope),
            content_type="application/json",
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            message_id=envelope.messageId,
            correlation_id=envelope.correlationId,
            type=envelope.eventType,
            headers={"x-producer": contratos.PRODUTOR},
        )
        await self._exchange.publish(
            mensagem, routing_key=envelope.eventType, mandatory=True
        )
