import { Request, Response } from 'express';
import { PrismaClient, StatusAgendamento } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler';
import { z } from 'zod';
import BaseController, { BaseControllerConfig } from './BaseController';
import { ErrorHandler } from '../utils/errorHandler';

const prisma = new PrismaClient();

// Schemas de validação
const createAppointmentSchema = z.object({
  patientId: z.string().uuid('ID do paciente deve ser um UUID válido'),
  procedureId: z.string().uuid('ID do procedimento deve ser um UUID válido'),
  medicoId: z.string().uuid('ID do médico deve ser um UUID válido').optional(),
  dataHora: z.string().datetime('Data e hora devem estar no formato ISO'),
  duracao: z
    .number()
    .int()
    .positive('Duração deve ser um número positivo')
    .optional(),
  observacoes: z.string().optional(),
  tipoAgendamento: z.string().optional(),
});

const updateAppointmentSchema = z.object({
  patientId: z.string().uuid().optional(),
  procedureId: z.string().uuid().optional(),
  medicoId: z.string().uuid().optional(),
  dataHora: z.string().datetime().optional(),
  duracao: z.number().int().positive().optional(),
  observacoes: z.string().optional(),
  tipoAgendamento: z.string().optional(),
  status: z
    .enum([
      'AGENDADO',
      'CONFIRMADO',
      'EM_ATENDIMENTO',
      'CONCLUIDO',
      'CANCELADO',
      'FALTOU',
    ])
    .optional(),
  motivoCancelamento: z.string().optional(),
  confirmado: z.boolean().optional(),
});

const listAppointmentsSchema = z.object({
  page: z
    .string()
    .transform((val) => parseInt(val))
    .default('1'),
  limit: z
    .string()
    .transform((val) => parseInt(val))
    .default('10'),
  search: z.string().optional(),
  status: z
    .enum([
      'AGENDADO',
      'CONFIRMADO',
      'EM_ATENDIMENTO',
      'CONCLUIDO',
      'CANCELADO',
      'FALTOU',
    ])
    .optional(),
  medicoId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  dataInicio: z.string().datetime().optional(),
  dataFim: z.string().datetime().optional(),
  orderBy: z.enum(['dataHora', 'createdAt', 'updatedAt']).default('dataHora'),
  orderDirection: z.enum(['asc', 'desc']).default('asc'),
});

export class AppointmentController extends BaseController<any> {
  constructor() {
    const config: BaseControllerConfig<any> = {
      entityName: 'Agendamento',
      createSchema: createAppointmentSchema,
      updateSchema: updateAppointmentSchema,
      defaultSort: { field: 'dataHora', direction: 'asc' },
      defaultLimit: 10,
      filterableFields: ['status', 'medicoId', 'patientId'],
      sortableFields: ['dataHora', 'createdAt', 'updatedAt'],
    };
    super(config);
  }

  protected getModel(): any {
    return this.prisma.appointment;
  }

  // Override do método list para incluir filtros específicos e includes
  async list(req: Request, res: Response) {
    try {
      const validatedQuery = listAppointmentsSchema.parse(req.query);
      const { userUnidade } = req;

      const {
        page,
        limit,
        search,
        status,
        medicoId,
        patientId,
        dataInicio,
        dataFim,
        orderBy,
        orderDirection,
      } = validatedQuery;

      // Construir filtros dinâmicos
      const where: any = {
        unidade: userUnidade as any,
      };

      if (search) {
        where.OR = [
          {
            patient: {
              nome: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
          {
            procedure: {
              nome: {
                contains: search,
                mode: 'insensitive',
              },
            },
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
        where.dataHora = {};
        if (dataInicio) {
          where.dataHora.gte = new Date(dataInicio);
        }
        if (dataFim) {
          where.dataHora.lte = new Date(dataFim);
        }
      }

      const skip = (page - 1) * limit;

      // Buscar agendamentos com paginação
      const [appointments, total] = await Promise.all([
        this.prisma.appointment.findMany({
          where,
          include: {
            patient: {
              select: {
                id: true,
                nome: true,
                cpf: true,
                telefone: true,
                email: true,
              },
            },
            procedure: {
              select: {
                id: true,
                nome: true,
                valor: true,
                duracao: true,
                categoria: true,
              },
            },
            medico: {
              select: {
                id: true,
                nome: true,
                email: true,
                especialidade: true,
              },
            },
            criadoPor: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
          orderBy: { [orderBy]: orderDirection },
          skip,
          take: limit,
        }),
        this.prisma.appointment.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return res.json({
        success: true,
        data: appointments,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });
    } catch (error: unknown) {
      return ErrorHandler.handleError(
        error,
        res,
        'AppointmentControllerRefactored.list',
        'Erro ao listar agendamentos'
      );
    }
  }

  // Override do método getById para incluir relacionamentos
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userUnidade } = req;

      if (!id) {
        throw new AppError('ID do agendamento é obrigatório', 400);
      }

      const appointment = await this.prisma.appointment.findFirst({
        where: {
          id,
          unidade: userUnidade as any,
        },
        include: {
          patient: {
            select: {
              id: true,
              nome: true,
              cpf: true,
              telefone: true,
              email: true,
              endereco: true,
            },
          },
          procedure: {
            select: {
              id: true,
              nome: true,
              valor: true,
              duracao: true,
              categoria: true,
              descricao: true,
            },
          },
          medico: {
            select: {
              id: true,
              nome: true,
              email: true,
              especialidade: true,
            },
          },
          criadoPor: {
            select: {
              id: true,
              nome: true,
            },
          },
          consulta: {
            select: {
              id: true,
              status: true,
              dataConsulta: true,
            },
          },
        },
      });

      if (!appointment) {
        throw new AppError('Agendamento não encontrado', 404);
      }

      return res.json({
        success: true,
        data: appointment,
      });
    } catch (error: unknown) {
      return ErrorHandler.handleError(
        error,
        res,
        'AppointmentControllerRefactored.getById',
        'Erro ao buscar agendamento'
      );
    }
  }

  // Override do método create com validações específicas
  async create(req: Request, res: Response) {
    try {
      const validatedData = createAppointmentSchema.parse(req.body);
      const { userId, userUnidade } = req;

      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }

      // Verificar se paciente existe
      const patient = await this.prisma.patient.findFirst({
        where: {
          id: validatedData.patientId,
          unidade: userUnidade as any,
        },
      });

      if (!patient) {
        throw new AppError('Paciente não encontrado', 404);
      }

      // Verificar se procedimento existe
      const procedure = await this.prisma.procedure.findFirst({
        where: {
          id: validatedData.procedureId,
          unidade: userUnidade as any,
          ativo: true,
        },
      });

      if (!procedure) {
        throw new AppError('Procedimento não encontrado ou inativo', 404);
      }

      // Verificar se médico existe (se fornecido)
      if (validatedData.medicoId) {
        const medico = await this.prisma.user.findFirst({
          where: {
            id: validatedData.medicoId,
            unidade: userUnidade as any,
            ativo: true,
          },
        });

        if (!medico) {
          throw new AppError('Médico não encontrado ou inativo', 404);
        }
      }

      // Criar agendamento
      const appointment = await this.prisma.appointment.create({
        data: {
          patientId: validatedData.patientId,
          procedureId: validatedData.procedureId,
          medicoId: validatedData.medicoId,
          dataHora: new Date(validatedData.dataHora),
          duracao: validatedData.duracao || procedure.duracao,
          observacoes: validatedData.observacoes,
          tipoAgendamento: validatedData.tipoAgendamento,
          status: 'AGENDADO',
          unidade: userUnidade as any,
          criadoPorId: userId,
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
              valor: true,
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
      });

      return res.status(201).json({
        success: true,
        message: 'Agendamento criado com sucesso',
        data: appointment,
      });
    } catch (error: unknown) {
      return ErrorHandler.handleError(
        error,
        res,
        'AppointmentControllerRefactored.create',
        'Erro ao criar agendamento'
      );
    }
  }

  // Métodos específicos de agendamento
  async cancel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { motivoCancelamento } = req.body;
      const { userUnidade } = req;

      if (!id) {
        throw new AppError('ID do agendamento é obrigatório', 400);
      }

      const appointment = await this.prisma.appointment.findFirst({
        where: {
          id,
          unidade: userUnidade as any,
        },
      });

      if (!appointment) {
        throw new AppError('Agendamento não encontrado', 404);
      }

      if (appointment.status === 'CANCELADO') {
        throw new AppError('Agendamento já está cancelado', 400);
      }

      if (appointment.status === 'CONCLUIDO') {
        throw new AppError(
          'Não é possível cancelar agendamento já concluído',
          400,
        );
      }

      const updatedAppointment = await this.prisma.appointment.update({
        where: { id },
        data: {
          status: 'CANCELADO',
          motivoCancelamento,
          updatedAt: new Date(),
        },
      });

      return res.json({
        success: true,
        message: 'Agendamento cancelado com sucesso',
        data: updatedAppointment,
      });
    } catch (error: unknown) {
      return ErrorHandler.handleError(
        error,
        res,
        'AppointmentControllerRefactored.cancel',
        'Erro ao cancelar agendamento'
      );
    }
  }

  async confirm(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userUnidade } = req;

      if (!id) {
        throw new AppError('ID do agendamento é obrigatório', 400);
      }

      const appointment = await this.prisma.appointment.findFirst({
        where: {
          id,
          unidade: userUnidade as any,
        },
      });

      if (!appointment) {
        throw new AppError('Agendamento não encontrado', 404);
      }

      if (appointment.status !== 'AGENDADO') {
        throw new AppError(
          'Apenas agendamentos com status AGENDADO podem ser confirmados',
          400,
        );
      }

      const updatedAppointment = await this.prisma.appointment.update({
        where: { id },
        data: {
          status: 'CONFIRMADO',
          confirmado: true,
          dataConfirmacao: new Date(),
          updatedAt: new Date(),
        },
      });

      return res.json({
        success: true,
        message: 'Agendamento confirmado com sucesso',
        data: updatedAppointment,
      });
    } catch (error: unknown) {
      return ErrorHandler.handleError(
        error,
        res,
        'AppointmentControllerRefactored.confirm',
        'Erro ao confirmar agendamento'
      );
    }
  }

  async startConsultation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userUnidade } = req;

      if (!id) {
        throw new AppError('ID do agendamento é obrigatório', 400);
      }

      const appointment = await this.prisma.appointment.findFirst({
        where: {
          id,
          unidade: userUnidade as any,
        },
      });

      if (!appointment) {
        throw new AppError('Agendamento não encontrado', 404);
      }

      if (appointment.status !== 'CONFIRMADO') {
        throw new AppError(
          'Apenas agendamentos confirmados podem iniciar consulta',
          400,
        );
      }

      const updatedAppointment = await this.prisma.appointment.update({
        where: { id },
        data: {
          status: 'EM_ATENDIMENTO',
          updatedAt: new Date(),
        },
      });

      return res.json({
        success: true,
        message: 'Consulta iniciada com sucesso',
        data: updatedAppointment,
      });
    } catch (error: unknown) {
      return ErrorHandler.handleError(
        error,
        res,
        'AppointmentControllerRefactored.startConsultation',
        'Erro ao iniciar consulta'
      );
    }
  }

  async getToday(req: Request, res: Response) {
    try {
      const { userUnidade } = req;
      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1,
      );

      const appointments = await this.prisma.appointment.findMany({
        where: {
          unidade: userUnidade as any,
          dataHora: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
        include: {
          patient: {
            select: {
              id: true,
              nome: true,
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
            },
          },
        },
        orderBy: {
          dataHora: 'asc',
        },
      });

      return res.json({
        success: true,
        data: appointments,
      });
    } catch (error: unknown) {
      return ErrorHandler.handleError(
        error,
        res,
        'AppointmentControllerRefactored.getToday',
        'Erro ao buscar agendamentos de hoje'
      );
    }
  }
}

export default new AppointmentController();
