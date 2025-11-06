# ===== Build stage =====
FROM amazoncorretto:17.0.12 as build
WORKDIR /app
COPY . .
RUN chmod +x ./gradlew
RUN ./gradlew clean bootJar --no-daemon

# ===== Run stage =====
FROM amazoncorretto:17.0.12
WORKDIR /app
COPY --from=build /app/build/libs/*.jar /app/server.jar

# ✅ 환경변수 파일 복사 (백엔드용)
COPY .env.prod .env.prod
ENV SPRING_PROFILES_ACTIVE=aws
ENV JAVA_OPTS="--add-opens java.base/java.lang=ALL-UNNAMED"

CMD ["sh", "-c", "export $(cat .env.prod | xargs) && java $JAVA_OPTS -jar /app/server.jar"]
