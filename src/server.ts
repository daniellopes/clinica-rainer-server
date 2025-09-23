import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import routes from './routes';
import { RequestHandler } from 'express';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { apiRateLimit } from './middlewares/rateLimitMiddleware';

dotenv.config();

const app = express();

app.use(apiRateLimit as RequestHandler);

app.set('trust proxy', 1);

// Helmet (segurança)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  }),
);

// Configuração de CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'https://clinica-rainer-frontend.vercel.app', // produção
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS bloqueado para origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-unidade'],
  }),
);

// Garantir resposta para preflight (OPTIONS)
app.options('*', cors());

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Healthcheck
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'esthetic-pro-api',
    version: '1.0.0',
  });
});

// Rotas
app.use('/api', routes);

// Middlewares finais
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
