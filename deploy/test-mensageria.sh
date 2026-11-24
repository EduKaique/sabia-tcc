#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"

falha_servico=""
status_java="UP"
filas_mock=$'pedagogico.aluno-perfil.queue\t1\npedagogico.revisao-ia.queue\t1\nia.submissao-revisao.queue\t1'
bindings_mock=$'sabia.eventos\tpedagogico.aluno-perfil.queue\taluno.perfil-atualizado\nsabia.eventos\tpedagogico.revisao-ia.queue\tsubmissao.revisao-ia.gerada\nsabia.eventos\tia.submissao-revisao.queue\tsubmissao.enviada'

compose() {
  [[ "$1" == exec && "$2" == -T ]] || return 1
  if [[ "$3" == "$falha_servico" ]]; then return 1; fi
  case "$3" in
    auth-service|pedagogico-service)
      [[ "$status_java" == UP ]]
      ;;
    rabbitmq)
      case "$6" in
        list_queues) printf '%s\n' "$filas_mock" ;;
        list_bindings) printf '%s\n' "$bindings_mock" ;;
        *) return 1 ;;
      esac
      ;;
  esac
}

mensageria_pronta || { echo "Mensageria pronta foi rejeitada" >&2; exit 1; }

for servico in auth-service pedagogico-service ia-service rabbitmq; do
  falha_servico="$servico"
  if mensageria_pronta; then
    echo "Falha de $servico não foi detectada" >&2
    exit 1
  fi
done
falha_servico=""

status_java="DISABLED"
if mensageria_pronta; then
  echo "RabbitMQ desligado não foi detectado" >&2
  exit 1
fi
status_java="UP"

for fila in pedagogico.aluno-perfil.queue pedagogico.revisao-ia.queue ia.submissao-revisao.queue; do
  original="$filas_mock"
  filas_mock="$(printf '%s\n' "$original" | awk -v fila="$fila" '$1 != fila')"
  if mensageria_pronta; then
    echo "Fila ausente $fila não foi detectada" >&2
    exit 1
  fi
  filas_mock="$(printf '%s\n' "$original" | awk -v fila="$fila" 'BEGIN { OFS="\t" } $1 == fila { $2 = 0 } { print }')"
  if mensageria_pronta; then
    echo "Fila sem consumidor $fila não foi detectada" >&2
    exit 1
  fi
  filas_mock="$original"
done

for fila in pedagogico.aluno-perfil.queue pedagogico.revisao-ia.queue ia.submissao-revisao.queue; do
  original="$bindings_mock"
  bindings_mock="$(printf '%s\n' "$original" | awk -v fila="$fila" '$2 != fila')"
  if mensageria_pronta; then
    echo "Binding ausente $fila não foi detectado" >&2
    exit 1
  fi
  bindings_mock="$original"
done

echo "Verificações de mensageria: OK"
