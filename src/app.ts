import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';

const app = express();

// Middlewares comuns
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'clinica-rainer-server',
    timestamp: new Date().toISOString(),
  });
});

// Suas rotas
app.use('/api', routes);

// Tratamento de erros
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
