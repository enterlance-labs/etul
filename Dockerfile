FROM oven/bun:1

RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app
COPY . .

RUN bun install
RUN bunx prisma generate

EXPOSE 2225
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
