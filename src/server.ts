import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { apiRateLimit } from './middlewares/rateLimitMiddleware';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();

// Rate limiting geral (aplicado antes de outros middlewares)
app.use(apiRateLimit);

// Configuração de segurança aprimorada
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configurado adequadamente
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-unidade']
}));

// Middlewares de processamento
app.use(compression());
app.use(express.json({ limit: '10mb' })); // Limite de payload
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging apenas em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'esthetic-pro-api',
    version: '1.0.0'
  });
});

// Rotas principais
app.use('/api', routes);

// Tratamento de erros (ordem importante)
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3001; // Porta correta

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔒 Rate limiting enabled`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});