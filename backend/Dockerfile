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
EXPOSE 8080

# 환경 변수 설정
ENV SPRING_PROFILES_ACTIVE=aws
ENV JAVA_OPTS="--add-opens java.base/java.lang=ALL-UNNAMED"

# 👇 실행 시 JAVA_OPTS를 포함시켜줌
CMD ["sh", "-c", "java $JAVA_OPTS -jar /app/server.jar"]
