# Taller Charli Auth API

Backend en NestJS para registro y login con JWT y roles básicos.

## Requisitos
- Node.js >= 18
- npm

## Configuración
1. Copia `.env.example` a `.env` y ajusta los valores (cambia `JWT_SECRET` y `DATABASE_URL`).
2. Instala dependencias:
```bash
npm install
```
3. Ejecuta en modo desarrollo:
```bash
npm run start:dev
```
4. Compila y ejecuta en producción:
```bash
npm run build
npm start
```

## Endpoints
- `POST /api/auth/register`: body `{ email, password, fullName? }` → crea usuario (rol CLIENT por defecto).
- `POST /api/auth/login`: body `{ email, password }` → entrega `{ accessToken, tokenType, expiresIn, user }`.
- `GET /api/auth/profile`: requiere header `Authorization: Bearer <token>`.

## Seguridad y buenas prácticas
- Validación y sanitización con `class-validator` / `class-transformer`.
- JWT con expiración configurable y guardias por endpoint.
- Rate limiting global (`20 req/min`) y Helmet.
- Restricción: el registro siempre crea usuarios con rol `CLIENT`. Para un admin inicial, crea uno manualmente en la base de datos o agrega un seed controlado.

## Base de datos (Neon PostgreSQL)
- Usa la cadena de conexión completa de Neon (incluye `sslmode=require`).
- Por defecto se desactiva `rejectUnauthorized` para compatibilidad con Neon; si usas un certificado confiable, cámbialo a `true` en `DATABASE_SSL_REJECT_UNAUTHORIZED`.

## Notas para front
- Prefijo de API: `/api`.
- Habilitado CORS; ajusta `FRONTEND_ORIGIN` en `.env` para restringir orígenes.
