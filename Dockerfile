FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_API_BASE=https://conqbot.blcdev.com
ARG VITE_USE_MOCKS=false
ENV VITE_API_BASE=${VITE_API_BASE}
ENV VITE_USE_MOCKS=${VITE_USE_MOCKS}

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/public/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
