FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
# Dependências em camada própria: só refaz quando o pom muda.
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -q
COPY src ./src
RUN ./mvnw clean package -DskipTests -q

FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

RUN addgroup -S -g 1001 spring && adduser -S -u 1001 -G spring spring

COPY --from=builder --chown=spring:spring /app/target/*.jar app.jar

USER spring

# Pensado para containers com pouca memória; sobrescreva JAVA_OPTS se precisar.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=70 -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Xss512k"

EXPOSE 8081

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${SERVER_PORT:-8081}/api/health >/dev/null || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
