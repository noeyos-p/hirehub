# ===== Build stage =====
FROM amazoncorretto:17.0.12 as build
WORKDIR /app
COPY . .
RUN chmod +x ./gradlew
RUN ./gradlew clean bootJar --no-daemon

# ===== Run stage =====
FROM amazoncorretto:17.0.12
WORKDIR /app

# 빌드 결과물 복사
COPY --from=build /app/build/libs/*.jar /app/server.jar

# .env.prod 복사 (JWT_SECRET 등 환경변수 주입용)
COPY .env.prod .env.prod

EXPOSE 8080

# 기본 환경 설정
ENV SPRING_PROFILES_ACTIVE=aws
ENV JAVA_OPTS="--add-opens java.base/java.lang=ALL-UNNAMED"

# ✅ .env.prod의 환경변수를 export 후 애플리케이션 실행
CMD ["sh", "-c", "export $(cat .env.prod | xargs) && java $JAVA_OPTS -jar /app/server.jar"]
