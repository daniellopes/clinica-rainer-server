import { PrismaClient, StatusConsulta, Unidade } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler';

const prisma = new PrismaClient();

export interface ConsultationService {
  getById(id: string, unidade: Unidade): Promise<any>;
  finish(id: string, unidade: Unidade, observacoes?: string): Promise<any>;
  getAll(unidade: Unidade, filters?: any): Promise<any>;
  update(id: string, unidade: Unidade, data: any): Promise<any>;
  cancel(id: string, unidade: Unidade, motivo?: string): Promise<any>;
  getInProgress(unidade: Unidade): Promise<any>;
}

export class ConsultationService implements ConsultationService {
  /**
   * Buscar consulta por ID
   */
  async getById(id: string, unidade: Unidade): Promise<any> {
    try {
      if (!id) {
        throw new AppError('ID da consulta é obrigatório', 400);
      }

      const consultation = await prisma.consultation.findFirst({
        where: {
          id,
          unidade,
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
              email: true,
            },
          },
          procedure: {
            select: {
              id: true,
              nome: true,
              duracao: true,
              valor: true,
              descricao: true,
            },
          },
          medico: {
            select: {
              id: true,
              nome: true,
              especialidade: true,
              email: true,
            },
          },
          appointment: {
            select: {
              id: true,
              dataHora: true,
              status: true,
              observacoes: true,
            },
          },
          anamneses: {
            include: {
              form: {
                select: {
                  id: true,
                  nome: true,
                  especialidade: true,
                },
              },
            },
          },
          receitas: {
            select: {
              id: true,
              conteudo: true,
              observacoes: true,
              createdAt: true,
            },
          },
        },
      });

      if (!consultation) {
        throw new AppError('Consulta não encontrada', 404);
      }

      return consultation;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Erro ao buscar consulta', 500);
    }
  }

  /**
   * Finalizar consulta
   */
  async finish(id: string, unidade: Unidade, observacoes?: string): Promise<any> {
    try {
      if (!id) {
        throw new AppError('ID da consulta é obrigatório', 400);
      }

      // Buscar consulta com agendamento relacionado
      const consultation = await prisma.consultation.findFirst({
        where: {
          id,
          unidade,
        },
        include: {
          appointment: true,
        },
      });

      if (!consultation) {
        throw new AppError('Consulta não encontrada', 404);
      }

      if (consultation.status === StatusConsulta.CONCLUIDA) {
        throw new AppError('Consulta já foi finalizada', 400);
      }

      // Finalizar consulta e atualizar agendamento em uma transação
      const result = await prisma.$transaction(async (tx) => {
        // Finalizar consulta
        const finishedConsultation = await tx.consultation.update({
          where: { id },
          data: {
            status: StatusConsulta.CONCLUIDA,
            observacoes: observacoes || consultation.observacoes,
            updatedAt: new Date(),
          },
        });

        // Atualizar status do agendamento se existir
        if (consultation.appointmentId) {
          await tx.appointment.update({
            where: { id: consultation.appointmentId },
            data: {
              status: 'CONCLUIDO',
              updatedAt: new Date(),
            },
          });
        }

        return finishedConsultation;
      });

      return result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Erro ao finalizar consulta', 500);
    }
  }

  /**
   * Listar consultas com filtros
   */
  async getAll(unidade: Unidade, filters: any = {}): Promise<any> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        status,
        medicoId,
        patientId,
        dataInicio,
        dataFim,
        orderBy = 'dataConsulta',
        orderDirection = 'desc',
      } = filters;

      // Construir filtros dinâmicos
      const where: any = {
        unidade,
      };

      if (search) {
        where.OR = [
          {
            patient: {
              OR: [
                { nome: { contains: search, mode: 'insensitive' } },
                { cpf: { contains: search } },
                { telefone: { contains: search } },
              ],
            },
          },
          {
            procedure: {
              nome: { contains: search, mode: 'insensitive' },
            },
          },
          {
            queixaPrincipal: { contains: search, mode: 'insensitive' },
          },
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
            [orderBy]: orderDirection,
          },
          include: {
            patient: {
              select: {
                id: true,
                nome: true,
                cpf: true,
                telefone: true,
                nascimento: true,
              },
            },
            procedure: {
              select: {
                id: true,
                nome: true,
                duracao: true,
                valor: true,
              },
            },
            medico: {
              select: {
                id: true,
                nome: true,
                especialidade: true,
              },
            },
            appointment: {
              select: {
                id: true,
                dataHora: true,
                status: true,
              },
            },
          },
        }),
        prisma.consultation.count({ where }),
      ]);

      // Calcular metadados de paginação
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        consultations,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        },
      };
    } catch (error) {
      throw new AppError('Erro ao listar consultas', 500);
    }
  }

  /**
   * Atualizar consulta
   */
  async update(id: string, unidade: Unidade, data: any): Promise<any> {
    try {
      if (!id) {
        throw new AppError('ID da consulta é obrigatório', 400);
      }

      // Verificar se a consulta existe
      const existingConsultation = await prisma.consultation.findFirst({
        where: {
          id,
          unidade,
        },
      });

      if (!existingConsultation) {
        throw new AppError('Consulta não encontrada', 404);
      }

      // Atualizar consulta
      const updatedConsultation = await prisma.consultation.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          patient: {
            select: {
              id: true,
              nome: true,
              cpf: true,
            },
          },
          procedure: {
            select: {
              id: true,
              nome: true,
            },
          },
          medico: {
            select: {
              id: true,
              nome: true,
              especialidade: true,
            },
          },
        },
      });

      return updatedConsultation;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Erro ao atualizar consulta', 500);
    }
  }

  /**
   * Cancelar consulta
   */
  async cancel(id: string, unidade: Unidade, motivo?: string): Promise<any> {
    try {
      if (!id) {
        throw new AppError('ID da consulta é obrigatório', 400);
      }

      // Buscar consulta com agendamento relacionado
      const consultation = await prisma.consultation.findFirst({
        where: {
          id,
          unidade,
        },
        include: {
          appointment: true,
        },
      });

      if (!consultation) {
        throw new AppError('Consulta não encontrada', 404);
      }

      if (consultation.status === StatusConsulta.CANCELADA) {
        throw new AppError('Consulta já foi cancelada', 400);
      }

      if (consultation.status === StatusConsulta.CONCLUIDA) {
        throw new AppError(
          'Não é possível cancelar uma consulta finalizada',
          400,
        );
      }

      // Cancelar consulta e atualizar agendamento em uma transação
      const result = await prisma.$transaction(async (tx) => {
        // Cancelar consulta
        const cancelledConsultation = await tx.consultation.update({
          where: { id },
          data: {
            status: StatusConsulta.CANCELADA,
            observacoes: motivo
              ? `${consultation.observacoes || ''}\n\nMotivo do cancelamento: ${motivo}`
              : consultation.observacoes,
            updatedAt: new Date(),
          },
        });

        // Atualizar status do agendamento se existir
        if (consultation.appointmentId) {
          await tx.appointment.update({
            where: { id: consultation.appointmentId },
            data: {
              status: 'CANCELADO',
              motivoCancelamento: motivo,
              updatedAt: new Date(),
            },
          });
        }

        return cancelledConsultation;
      });

      return result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Erro ao cancelar consulta', 500);
    }
  }

  /**
   * Buscar consultas em andamento
   */
  async getInProgress(unidade: Unidade): Promise<any> {
    try {
      const consultationsInProgress = await prisma.consultation.findMany({
        where: {
          unidade,
          status: StatusConsulta.EM_ANDAMENTO,
        },
        include: {
          patient: {
            select: {
              id: true,
              nome: true,
              cpf: true,
              telefone: true,
            },
          },
          procedure: {
            select: {
              id: true,
              nome: true,
              duracao: true,
            },
          },
          medico: {
            select: {
              id: true,
              nome: true,
              especialidade: true,
            },
          },
        },
        orderBy: {
          dataConsulta: 'asc',
        },
      });

      return consultationsInProgress;
    } catch (error) {
      throw new AppError('Erro ao buscar consultas em andamento', 500);
    }
  }
}

export default new ConsultationService();

