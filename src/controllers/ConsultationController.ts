import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../middlewares/errorHandler';

const prisma = new PrismaClient();

// Esquemas de validação
const listConsultationsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['AGENDADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA']).optional(),
  medicoId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  orderBy: z.enum(['dataConsulta', 'createdAt', 'updatedAt']).default('dataConsulta'),
  orderDirection: z.enum(['asc', 'desc']).default('desc')
});

const updateConsultationSchema = z.object({
  queixaPrincipal: z.string().optional(),
  historiaDoenca: z.string().optional(),
  exameFisico: z.string().optional(),
  hipoteseDiagnostica: z.string().optional(),
  conduta: z.string().optional(),
  observacoes: z.string().optional(),
  status: z.enum(['AGENDADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA']).optional()
});

// Interface para requisições autenticadas
interface AuthenticatedRequest extends Request {
  userId: string;
  userRole: any;
  userUnidade: string;
}

export class ConsultationController {
  // Listar consultas com filtros e paginação
  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const validatedQuery = listConsultationsSchema.parse(req.query);
      const { page, limit, search, status, medicoId, patientId, dataInicio, dataFim, orderBy, orderDirection } = validatedQuery;
      const { userUnidade } = req;

      // Construir filtros dinâmicos
      const where: any = {
        unidade: userUnidade as any
      };

      if (search) {
        where.OR = [
          {
            patient: {
              OR: [
                { nome: { contains: search, mode: 'insensitive' } },
                { cpf: { contains: search } },
                { telefone: { contains: search } }
              ]
            }
          },
          {
            procedure: {
              nome: { contains: search, mode: 'insensitive' }
            }
          },
          {
            queixaPrincipal: { contains: search, mode: 'insensitive' }
          }
        ];
      }

      if (status) {
        where.status = status;
      }

      if (medicoId) {
        where.medicoId = medicoId;
      }

      if (patientId) {
        where.patientId = patientId;
      }

      if (dataInicio || dataFim) {
        where.dataConsulta = {};
        if (dataInicio) {
          where.dataConsulta.gte = new Date(dataInicio);
        }
        if (dataFim) {
          where.dataConsulta.lte = new Date(dataFim);
        }
      }

      // Calcular paginação
      const skip = (page - 1) * limit;

      // Buscar consultas com relacionamentos
      const [consultations, total] = await Promise.all([
        prisma.consultation.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            [orderBy]: orderDirection
          },
          include: {
            patient: {
              select: {
                id: true,
                nome: true,
                cpf: true,
                telefone: true,
                nascimento: true
              }
            },
            procedure: {
              select: {
                id: true,
                nome: true,
                duracao: true,
                valor: true
              }
            },
            medico: {
              select: {
                id: true,
                nome: true,
                especialidade: true
              }
            },
            appointment: {
              select: {
                id: true,
                dataHora: true,
                status: true
              }
            }
          }
        }),
        prisma.consultation.count({ where })
      ]);

      // Calcular metadados de paginação
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return res.json({
        success: true,
        data: consultations,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage,
          hasPreviousPage
        }
      });

    } catch (error: any) {
      console.error('Erro ao listar consultas:', error);
      
      if (error instanceof z.ZodError) {
        throw new AppError('Dados de entrada inválidos', 400);
      }
      
      throw new AppError('Erro ao listar consultas', 500);
    }
  }

  // Buscar consulta por ID
  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { userUnidade } = req;

      if (!id) {
        throw new AppError('ID da consulta é obrigatório', 400);
      }

      const consultation = await prisma.consultation.findFirst({
        where: {
          id,
          unidade: userUnidade as any as any as any as any as any as any as any
        },
        include: {
          patient: {
            select: {
              id: true,
              nome: true,
              cpf: true,
              telefone: true,
              nascimento: true,
              endereco: true,
              email: true
            }
          },
          procedure: {
            select: {
              id: true,
              nome: true,
              duracao: true,
              valor: true,
              descricao: true
            }
          },
          medico: {
            select: {
              id: true,
              nome: true,
              especialidade: true,
              email: true
            }
          },
          appointment: {
            select: {
              id: true,
              dataHora: true,
              status: true,
              observacoes: true
            }
          },
          anamneses: {
            include: {
              form: {
                select: {
                  id: true,
                  nome: true,
                  especialidade: true
                }
              }
            }
          },
          receitas: {
            select: {
              id: true,
              conteudo: true,
              observacoes: true,
              createdAt: true
            }
          }
        }
      });

      if (!consultation) {
        throw new AppError('Consulta não encontrada', 404);
      }

      return res.json({
        success: true,
        data: consultation
      });

    } catch (error: any) {
      console.error('Erro ao buscar consulta:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('Erro ao buscar consulta', 500);
    }
  }

  // Atualizar consulta
  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { userUnidade } = req;
      const validatedData = updateConsultationSchema.parse(req.body);

      if (!id) {
        throw new AppError('ID da consulta é obrigatório', 400);
      }

      // Verificar se a consulta existe
      const existingConsultation = await prisma.consultation.findFirst({
        where: {
          id,
          unidade: userUnidade as any
        }
      });

      if (!existingConsultation) {
        throw new AppError('Consulta não encontrada', 404);
      }

      // Atualizar consulta
      const updatedConsultation = await prisma.consultation.update({
        where: { id },
        data: {
          ...validatedData,
          updatedAt: new Date()
        },
        include: {
          patient: {
            select: {
              id: true,
              nome: true,
              cpf: true
            }
          },
          procedure: {
            select: {
              id: true,
              nome: true
            }
          },
          medico: {
            select: {
              id: true,
              nome: true,
              especialidade: true
            }
          }
        }
      });

      return res.json({
        success: true,
        message: 'Consulta atualizada com sucesso',
        data: updatedConsultation
      });

    } catch (error: any) {
      console.error('Erro ao atualizar consulta:', error);
      
      if (error instanceof z.ZodError) {
        throw new AppError('Dados de entrada inválidos', 400);
      }
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('Erro ao atualizar consulta', 500);
    }
  }

  // Finalizar consulta
  async finish(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { userUnidade } = req;

      if (!id) {
        throw new AppError('ID da consulta é obrigatório', 400);
      }

      // Buscar consulta com agendamento relacionado
      const consultation = await prisma.consultation.findFirst({
        where: {
          id,
          unidade: userUnidade as any
        },
        include: {
          appointment: true
        }
      });

      if (!consultation) {
        throw new AppError('Consulta não encontrada', 404);
      }

      if (consultation.status === 'CONCLUIDA') {
        throw new AppError('Consulta já foi finalizada', 400);
      }

      // Finalizar consulta e atualizar agendamento em uma transação
      const result = await prisma.$transaction(async (tx) => {
        // Finalizar consulta
        const finishedConsultation = await tx.consultation.update({
          where: { id },
          data: {
            status: 'CONCLUIDA',
            updatedAt: new Date()
          }
        });

        // Atualizar status do agendamento se existir
        if (consultation.appointmentId) {
          await tx.appointment.update({
            where: { id: consultation.appointmentId },
            data: {
              status: 'CONCLUIDO',
              updatedAt: new Date()
            }
          });
        }

        return finishedConsultation;
      });

      return res.json({
        success: true,
        message: 'Consulta finalizada com sucesso',
        data: result
      });

    } catch (error: any) {
      console.error('Erro ao finalizar consulta:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('Erro ao finalizar consulta', 500);
    }
  }

  // Cancelar consulta
  async cancel(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { userUnidade } = req;
      const { motivo } = req.body;

      if (!id) {
        throw new AppError('ID da consulta é obrigatório', 400);
      }

      // Buscar consulta com agendamento relacionado
      const consultation = await prisma.consultation.findFirst({
        where: {
          id,
          unidade: userUnidade as any
        },
        include: {
          appointment: true
        }
      });

      if (!consultation) {
        throw new AppError('Consulta não encontrada', 404);
      }

      if (consultation.status === 'CANCELADA') {
        throw new AppError('Consulta já foi cancelada', 400);
      }

      if (consultation.status === 'CONCLUIDA') {
        throw new AppError('Não é possível cancelar uma consulta finalizada', 400);
      }

      // Cancelar consulta e atualizar agendamento em uma transação
      const result = await prisma.$transaction(async (tx) => {
        // Cancelar consulta
        const cancelledConsultation = await tx.consultation.update({
          where: { id },
          data: {
            status: 'CANCELADA',
            observacoes: motivo ? `${consultation.observacoes || ''}\n\nMotivo do cancelamento: ${motivo}` : consultation.observacoes,
            updatedAt: new Date()
          }
        });

        // Atualizar status do agendamento se existir
        if (consultation.appointmentId) {
          await tx.appointment.update({
            where: { id: consultation.appointmentId },
            data: {
              status: 'CANCELADO',
              motivoCancelamento: motivo,
              updatedAt: new Date()
            }
          });
        }

        return cancelledConsultation;
      });

      return res.json({
        success: true,
        message: 'Consulta cancelada com sucesso',
        data: result
      });

    } catch (error: any) {
      console.error('Erro ao cancelar consulta:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('Erro ao cancelar consulta', 500);
    }
  }

  // Buscar consultas em andamento
  async getInProgress(req: AuthenticatedRequest, res: Response) {
    try {
      const { userUnidade } = req;

      const consultationsInProgress = await prisma.consultation.findMany({
        where: {
          unidade: userUnidade as any,
          status: 'EM_ANDAMENTO'
        },
        include: {
          patient: {
            select: {
              id: true,
              nome: true,
              cpf: true,
              telefone: true
            }
          },
          procedure: {
            select: {
              id: true,
              nome: true,
              duracao: true
            }
          },
          medico: {
            select: {
              id: true,
              nome: true,
              especialidade: true
            }
          }
        },
        orderBy: {
          dataConsulta: 'asc'
        }
      });

      return res.json({
        success: true,
        data: consultationsInProgress
      });

    } catch (error: any) {
      console.error('Erro ao buscar consultas em andamento:', error);
      throw new AppError('Erro ao buscar consultas em andamento', 500);
    }
  }
}

export default new ConsultationController();