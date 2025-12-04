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

app.set('trust proxy', 1);

// Configuração de CORS - DEVE SER O PRIMEIRO MIDDLEWARE
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL,
  'https://clinica-rainer-frontend.vercel.app',
].filter(Boolean) as string[];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Permitir requisições sem origin (mobile apps, Postman, etc)
    if (!origin) {
      return callback(null, true);
    }

    // Verificar se a origin está na lista permitida
    if (allowedOrigins.includes(origin)) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`✅ CORS permitido para origin: ${origin}`);
      }
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS bloqueado para origin: ${origin}`);
      console.log(`📋 Origens permitidas: ${allowedOrigins.join(', ')}`);
      // Em desenvolvimento, permitir mesmo assim para facilitar debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Modo desenvolvimento: permitindo origin mesmo não estando na lista');
        callback(null, true);
      } else {
        callback(new Error(`CORS bloqueado para origin: ${origin}`));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-unidade', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 horas
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Aplicar CORS antes de qualquer outro middleware
app.use(cors(corsOptions));

// Tratar requisições preflight explicitamente
app.options('*', cors(corsOptions));

// Helmet (segurança) - ajustado para não interferir com CORS
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
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

// Rate limiting - após CORS
app.use(apiRateLimit as RequestHandler);

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
