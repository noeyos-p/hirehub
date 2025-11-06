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

# ✅ 환경 변수는 외부에서 주입받게만 정의 (하드코딩 금지)
ENV SPRING_PROFILES_ACTIVE=aws
ENV JAVA_OPTS="--add-opens java.base/java.lang=ALL-UNNAMED"

EXPOSE 8080

CMD ["sh", "-c", "java $JAVA_OPTS -jar /app/server.jar"]
