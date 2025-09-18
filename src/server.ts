import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';
// Rate limiting removido

// Carregar variáveis de ambiente
dotenv.config();

const app = express();

// Configuração CORS aprimorada
const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) {
    // Lista de origens permitidas
    const allowedOrigins = [
      'http://localhost:3001', // Desenvolvimento
      'https://clinica-rainer-frontend.vercel.app', // Produção
      'https://staging-clinica-rainer-frontend.vercel.app', // Staging (se houver)
    ];

    // Permitir requisições sem origin (ex: Postman, mobile apps)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-unidade'],
};

// Rate limiting removido - sem limitações de requisições

// Configuração de segurança aprimorada
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

// CORS configurado adequadamente
app.use(cors(corsOptions));

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
    version: '1.0.0',
  });
});

// Rotas principais
app.use('/api', routes);

// Tratamento de erros (ordem importante)
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3001; // Porta correta

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 Server running on port ${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  // eslint-disable-next-line no-console
  console.log(`🔓 Rate limiting disabled`);
  // eslint-disable-next-line no-console
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
