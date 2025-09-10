import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { checkUnidadeMiddleware } from '../middlewares/checkUnidadeMiddleware';
import { getAccessLogs } from '../middlewares/auditMiddleware';

const router = Router();

// Middleware para autenticação e verificação de unidade
router.use(authMiddleware);
router.use(checkUnidadeMiddleware);

/**
 * GET /api/audit/logs
 * Lista logs de acesso com filtros
 */
router.get('/logs', async (req, res, next) => {
  try {
    const {
      userId,
      resource,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;
    const userUnidade = req.headers['x-unidade'] as string;

    const filters: any = {
      unidade: userUnidade,
      page: Number(page),
      limit: Number(limit),
    };

    if (userId) filters.userId = userId as string;
    if (resource) filters.resource = resource as string;
    if (action) filters.action = action as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const result = await getAccessLogs(filters);

    res.json({
      success: true,
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/audit/users/:userId/logs
 * Lista logs de um usuário específico
 */
router.get('/users/:userId/logs', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userUnidade = req.headers['x-unidade'] as string;

    const result = await getAccessLogs({
      userId,
      unidade: userUnidade,
      page: Number(page),
      limit: Number(limit),
    });

    res.json({
      success: true,
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/audit/resources/:resource/logs
 * Lista logs de um recurso específico
 */
router.get('/resources/:resource/logs', async (req, res, next) => {
  try {
    const { resource } = req.params;
    const { resourceId, page = 1, limit = 50 } = req.query;
    const userUnidade = req.headers['x-unidade'] as string;

    const filters: any = {
      resource,
      unidade: userUnidade,
      page: Number(page),
      limit: Number(limit),
    };

    if (resourceId) filters.resourceId = resourceId as string;

    const result = await getAccessLogs(filters);

    res.json({
      success: true,
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/audit/reports/activity
 * Relatório de atividades por período
 */
router.get('/reports/activity', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const userUnidade = req.headers['x-unidade'] as string;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Período obrigatório (startDate e endDate)',
      });
    }

    const result = await getAccessLogs({
      unidade: userUnidade,
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
      limit: 10000, // Buscar todos para estatísticas
    });

    // Calcular estatísticas
    const logs = result.logs;
    const uniqueUsers = new Set(logs.map((log) => log.userId)).size;
    const failedAttempts = logs.filter((log) => !log.success).length;
    const successRate =
      logs.length > 0
        ? (((logs.length - failedAttempts) / logs.length) * 100).toFixed(2)
        : '0';

    // Top ações
    const actionCounts: Record<string, number> = {};
    logs.forEach((log) => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });
    const topActions = Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }));

    // Top recursos
    const resourceCounts: Record<string, number> = {};
    logs.forEach((log) => {
      resourceCounts[log.resource] = (resourceCounts[log.resource] || 0) + 1;
    });
    const topResources = Object.entries(resourceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([resource, count]) => ({ resource, count }));

    res.json({
      success: true,
      data: {
        period: {
          startDate,
          endDate,
        },
        statistics: {
          totalLogs: logs.length,
          uniqueUsers,
          failedAttempts,
          successRate,
        },
        topActions,
        topResources,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
