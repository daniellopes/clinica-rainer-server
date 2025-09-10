import { Request, Response } from 'express';
import { PrismaClient, StatusAgendamento } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler';
import { ErrorHandler } from '../utils/errorHandler';
import { z } from 'zod';

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

// Interface AuthenticatedRequest removida - usando Request estendido globalmente pelo authMiddleware

export class AppointmentController {
  // Listar agendamentos com filtros e paginação
  async list(req: Request, res: Response) {
    try {
      const validatedQuery = listAppointmentsSchema.parse(req.query);
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
      const { userUnidade } = req;

      // Construir filtros dinâmicos
      const where: any = {
        unidade: userUnidade,
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

      // Calcular paginação
      const skip = (page - 1) * limit;

      // Buscar agendamentos com paginação
      const [appointments, totalCount] = await Promise.all([
        prisma.appointment.findMany({
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
          orderBy: {
            [orderBy]: orderDirection,
          },
          skip,
          take: limit,
        }),
        prisma.appointment.count({ where }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return res.json({
        success: true,
        data: appointments,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });
    } catch (error: unknown) {
      return ErrorHandler.handleError(
        error,
        res,
        'AppointmentController.list',
        'Erro ao listar agendamentos'
      );
    }
  }

  // Buscar agendamento por ID
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userUnidade } = req;

      if (!id) {
        throw new AppError('ID do agendamento é obrigatório', 400);
      }

      const appointment = await prisma.appointment.findFirst({
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
        'AppointmentController.getById',
        'Erro ao buscar agendamento'
      );
    }
  }

  // Criar novo agendamento
  async create(req: Request, res: Response) {
    try {
      const validatedData = createAppointmentSchema.parse(req.body);
      const { userId, userUnidade } = req;

      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }

      // Verificar se paciente existe
      const patient = await prisma.patient.findFirst({
        where: {
          id: validatedData.patientId,
          unidade: userUnidade as any,
        },
      });

      if (!patient) {
        throw new AppError('Paciente não encontrado', 404);
      }

      // Verificar se procedimento existe
      const procedure = await prisma.procedure.findFirst({
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
        const medico = await prisma.user.findFirst({
          where: {
            id: validatedData.medicoId,
            unidade: userUnidade as any,
            role: 'MEDICO',
            ativo: true,
          },
        });

        if (!medico) {
          throw new AppError('Médico não encontrado ou inativo', 404);
        }
      }

      // Verificar conflitos de horário (se médico especificado)
      if (validatedData.medicoId) {
        const dataHora = new Date(validatedData.dataHora);
        const duracao = validatedData.duracao || procedure.duracao || 30;
        const dataFim = new Date(dataHora.getTime() + duracao * 60000);

        const conflictingAppointment = await prisma.appointment.findFirst({
          where: {
            medicoId: validatedData.medicoId,
            status: {
              in: ['AGENDADO', 'CONFIRMADO', 'EM_ATENDIMENTO'],
            },
            OR: [
              {
                AND: [
                  { dataHora: { lte: dataHora } },
                  {
                    dataHora: {
                      gte: new Date(
                        dataHora.getTime() - (procedure.duracao || 30) * 60000,
                      ),
                    },
                  },
                ],
              },
              {
                AND: [
                  { dataHora: { gte: dataHora } },
                  { dataHora: { lt: dataFim } },
                ],
              },
            ],
          },
        });

        if (conflictingAppointment) {
          throw new AppError(
            'Já existe um agendamento neste horário para o médico selecionado',
            400,
          );
        }
      }

      // Criar agendamento
      const appointment = await prisma.appointment.create({
        data: {
          ...validatedData,
          dataHora: new Date(validatedData.dataHora),
          duracao: validatedData.duracao || procedure.duracao,
          criadoPorId: userId,
          unidade: userUnidade as any,
          status: 'AGENDADO',
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
    } catch (error: any) {
      return ErrorHandler.handleError(
        error,
        res,
        'AppointmentController.create',
        'Erro ao criar agendamento'
      );
    }
  }

  // Atualizar agendamento
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updateAppointmentSchema.parse(req.body);
      const { userUnidade } = req;

      if (!id) {
        throw new AppError('ID do agendamento é obrigatório', 400);
      }

      // Verificar se agendamento existe
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          id,
          unidade: userUnidade as any,
        },
      });

      if (!existingAppointment) {
        throw new AppError('Agendamento não encontrado', 404);
      }

      // Verificar se pode ser alterado
      if (existingAppointment.status === 'CONCLUIDO') {
        throw new AppError(
          'Não é possível alterar agendamento já concluído',
          400,
        );
      }

      // Validações adicionais se estiver alterando dados críticos
      if (
        validatedData.patientId &&
        validatedData.patientId !== existingAppointment.patientId
      ) {
        const patient = await prisma.patient.findFirst({
          where: {
            id: validatedData.patientId,
            unidade: userUnidade as any,
          },
        });

        if (!patient) {
          throw new AppError('Paciente não encontrado', 404);
        }
      }

      if (
        validatedData.procedureId &&
        validatedData.procedureId !== existingAppointment.procedureId
      ) {
        const procedure = await prisma.procedure.findFirst({
          where: {
            id: validatedData.procedureId,
            unidade: userUnidade as any,
            ativo: true,
          },
        });

        if (!procedure) {
          throw new AppError('Procedimento não encontrado ou inativo', 404);
        }
      }

      // Atualizar agendamento
      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: {
          patientId: validatedData.patientId,
          procedureId: validatedData.procedureId,
          medicoId: validatedData.medicoId,
          dataHora: validatedData.dataHora
            ? new Date(validatedData.dataHora)
            : undefined,
          duracao: validatedData.duracao,
          observacoes: validatedData.observacoes,
          tipoAgendamento: validatedData.tipoAgendamento,
          status: validatedData.status,
          motivoCancelamento: validatedData.motivoCancelamento,
          confirmado: validatedData.confirmado,
          dataConfirmacao: validatedData.confirmado ? new Date() : undefined,
          updatedAt: new Date(),
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

      return res.json({
        success: true,
        message: 'Agendamento atualizado com sucesso',
        data: updatedAppointment,
      });
    } catch (error: unknown) {
      return ErrorHandler.handleError(
        error,
        res,
        'AppointmentController.update',
        'Erro ao atualizar agendamento'
      );
    }
  }

  // Cancelar agendamento
  async cancel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { motivoCancelamento } = req.body;
      const { userUnidade } = req;

      if (!id) {
        throw new AppError('ID do agendamento é obrigatório', 400);
      }

      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          id,
          unidade: userUnidade as any,
        },
      });

      if (!existingAppointment) {
        throw new AppError('Agendamento não encontrado', 404);
      }

      if (existingAppointment.status === 'CANCELADO') {
        throw new AppError('Agendamento já está cancelado', 400);
      }

      if (existingAppointment.status === 'CONCLUIDO') {
        throw new AppError(
          'Não é possível cancelar agendamento já concluído',
          400,
        );
      }

      const cancelledAppointment = await prisma.appointment.update({
        where: { id },
        data: {
          status: 'CANCELADO',
          motivoCancelamento: motivoCancelamento || 'Cancelado pelo usuário',
          updatedAt: new Date(),
        },
      });

      return res.json({
        success: true,
        message: 'Agendamento cancelado com sucesso',
        data: cancelledAppointment,
      });
    } catch (error: unknown) {
      return ErrorHandler.handleError(
        error,
        res,
        'AppointmentController.cancel',
        'Erro ao cancelar agendamento'
      );
    }
  }

  // Listar agendamentos do dia
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
        today.getDate(),
        23,
        59,
        59,
      );

      const appointments = await prisma.appointment.findMany({
        where: {
          unidade: userUnidade as any,
          dataHora: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: {
            in: ['AGENDADO', 'CONFIRMADO', 'EM_ATENDIMENTO'],
          },
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
          dataHora: 'asc',
        },
      });

      return res.json({
        success: true,
        data: appointments,
        count: appointments.length,
      });
    } catch (error: unknown) {
      return ErrorHandler.handleError(
        error,
        res,
        'AppointmentController.getToday',
        'Erro ao buscar agendamentos do dia'
      );
    }
  }

  // Confirmar agendamento
  async confirm(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userUnidade } = req;

      if (!id) {
        throw new AppError('ID do agendamento é obrigatório', 400);
      }

      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          id,
          unidade: userUnidade as any,
        },
      });

      if (!existingAppointment) {
        throw new AppError('Agendamento não encontrado', 404);
      }

      if (existingAppointment.status !== 'AGENDADO') {
        throw new AppError(
          'Apenas agendamentos com status AGENDADO podem ser confirmados',
          400,
        );
      }

      const confirmedAppointment = await prisma.appointment.update({
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
        data: confirmedAppointment,
      });
    } catch (error: unknown) {
      return ErrorHandler.handleError(
        error,
        res,
        'AppointmentController.confirm',
        'Erro ao confirmar agendamento'
      );
    }
  }

  // Iniciar consulta (transição de agendamento para consulta)
  async startConsultation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userId, userUnidade } = req;

      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }

      if (!id) {
        throw new AppError('ID do agendamento é obrigatório', 400);
      }

      // Buscar agendamento
      const appointment = await prisma.appointment.findFirst({
        where: {
          id,
          unidade: userUnidade as any,
        },
        include: {
          consulta: true,
        },
      });

      if (!appointment) {
        throw new AppError('Agendamento não encontrado', 404);
      }

      if (appointment.status !== 'CONFIRMADO') {
        throw new AppError(
          'Apenas agendamentos confirmados podem ser iniciados',
          400,
        );
      }

      // Verificar se já existe consulta para este agendamento
      if (appointment.consulta) {
        return res.json({
          success: true,
          message: 'Consulta já existe para este agendamento',
          data: {
            appointment,
            consultation: appointment.consulta,
          },
        });
      }

      // Criar consulta e atualizar status do agendamento em uma transação
      const result = await prisma.$transaction(async (tx) => {
        // Atualizar status do agendamento
        const updatedAppointment = await tx.appointment.update({
          where: { id },
          data: {
            status: 'EM_ATENDIMENTO',
            updatedAt: new Date(),
          },
        });

        // Criar consulta
        const consultation = await tx.consultation.create({
          data: {
            appointmentId: id,
            patientId: appointment.patientId,
            procedureId: appointment.procedureId,
            medicoId: appointment.medicoId || userId,
            dataConsulta: new Date(),
            status: 'EM_ANDAMENTO',
            unidade: userUnidade as any,
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
        });

        return {
          appointment: updatedAppointment,
          consultation,
        };
      });

      return res.json({
        success: true,
        message: 'Consulta iniciada com sucesso',
        data: result,
      });
    } catch (error: unknown) {
      return ErrorHandler.handleError(
        error,
        res,
        'AppointmentController.startConsultation',
        'Erro ao iniciar consulta'
      );
    }
  }
}

export default new AppointmentController();
