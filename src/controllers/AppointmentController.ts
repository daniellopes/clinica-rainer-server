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
  dataHora: z
    .any()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      if (val instanceof Date) return val.toISOString();
      if (typeof val === 'string') {
        const date = new Date(val);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
      return val;
    }),
  duracao: z.number().int().positive().optional(),
  observacoes: z.string().optional(),
  tipoAgendamento: z.string().optional(),
  status: z
    .string()
    .optional()
    .transform((val) => {
      // Mapear status do frontend para status do backend
      if (!val) return undefined;
      const statusMap: { [key: string]: string } = {
        executado: 'CONCLUIDO',
        executado_nao_pago: 'CONCLUIDO',
        pendente: 'AGENDADO',
        FINALIZADO: 'CONCLUIDO',
      };
      // Se já estiver no formato correto do backend, retornar como está
      const backendStatuses = [
        'AGENDADO',
        'CONFIRMADO',
        'EM_ATENDIMENTO',
        'CONCLUIDO',
        'CANCELADO',
        'FALTOU',
      ];
      if (backendStatuses.includes(val)) {
        return val;
      }
      // Caso contrário, tentar mapear - sempre retornar um valor válido
      const mapped = statusMap[val];
      return mapped || 'CONCLUIDO'; // Default para CONCLUIDO se não encontrar
    }),
  motivoCancelamento: z.string().optional(),
  confirmado: z.boolean().optional(),
  executado: z.boolean().optional(), // Campo enviado pelo frontend
  executadoNaoPago: z.boolean().optional(), // Campo enviado pelo frontend
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
    .union([
      z.enum([
        'AGENDADO',
        'CONFIRMADO',
        'EM_ATENDIMENTO',
        'CONCLUIDO',
        'CANCELADO',
        'FALTOU',
      ]),
      z.enum(['executado', 'pendente', 'executado_nao_pago']),
    ])
    .optional()
    .transform((val) => {
      // Mapear status do frontend para status do backend
      if (!val) return undefined;
      const statusMap: { [key: string]: string } = {
        executado: 'CONCLUIDO',
        executado_nao_pago: 'CONCLUIDO',
        pendente: 'AGENDADO',
      };
      return statusMap[val] || val;
    }),
  tipo: z.enum(['consulta', 'procedimento']).optional(), // Novo filtro: consulta ou procedimento
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
        tipo,
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

      // Construir filtro de procedimento baseado no tipo
      let categoriaFilter: any = null;

      if (tipo) {
        if (tipo === 'consulta') {
          // Filtrar apenas procedimentos com categoria "Consulta"
          categoriaFilter = {
            equals: 'Consulta',
            mode: 'insensitive',
          };
        } else if (tipo === 'procedimento') {
          // Filtrar procedimentos que NÃO são consultas
          categoriaFilter = {
            not: {
              equals: 'Consulta',
              mode: 'insensitive',
            },
          };
        }
      }

      if (search) {
        const searchConditions: any[] = [
          {
            patient: {
              OR: [
                { nome: { contains: search, mode: 'insensitive' } },
                { cpf: { contains: search } },
                { telefone: { contains: search } },
              ],
            },
          },
        ];

        // Adicionar filtro de nome do procedimento com categoria se necessário
        const procedureSearchFilter: any = {
          nome: { contains: search, mode: 'insensitive' },
        };

        if (categoriaFilter) {
          procedureSearchFilter.categoria = categoriaFilter;
        }

        searchConditions.push({
          procedure: procedureSearchFilter,
        });

        where.OR = searchConditions;
      } else if (categoriaFilter) {
        // Se não há busca, mas há filtro de tipo, aplicar diretamente
        where.procedure = {
          categoria: categoriaFilter,
        };
      }

      // REGRA: Se está filtrando por tipo (consulta ou procedimento),
      // apenas mostrar agendamentos confirmados ou posteriores
      // Agendamentos com status "AGENDADO" não aparecem nessas telas
      if (tipo) {
        // Se já há um filtro de status, mesclar com o filtro de tipo
        if (status) {
          // Se o status filtrado está na lista de status válidos para tipo, usar
          // Caso contrário, aplicar o filtro de tipo (confirmado ou posterior)
          const validStatusForType = [
            'CONFIRMADO',
            'EM_ATENDIMENTO',
            'CONCLUIDO',
          ];
          if (validStatusForType.includes(status)) {
            where.status = status; // Usar o filtro específico se for válido
          } else {
            // Se o status não é válido para tipo, aplicar filtro padrão
            where.status = {
              in: ['CONFIRMADO', 'EM_ATENDIMENTO', 'CONCLUIDO'],
            };
          }
        } else {
          // Se não há filtro de status, aplicar filtro padrão para tipo
          where.status = {
            in: ['CONFIRMADO', 'EM_ATENDIMENTO', 'CONCLUIDO'],
          };
        }
      } else if (status) {
        // Se não há filtro de tipo, aplicar filtro de status normalmente
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
            consulta: {
              select: {
                id: true,
                status: true,
                dataConsulta: true,
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

      // Formatar agendamentos com campos calculados para o frontend
      const appointmentsWithType = appointments.map((apt) => {
        const isConsulta =
          apt.procedure?.categoria?.toLowerCase() === 'consulta';

        // Determinar status no formato do frontend
        let statusFrontend:
          | 'executado'
          | 'pendente'
          | 'executado_nao_pago'
          | string = apt.status;

        if (apt.status === 'CONCLUIDO') {
          // Se tem consulta, está executado e pago
          // Se não tem consulta, está executado mas não pago
          statusFrontend = apt.consulta ? 'executado' : 'executado_nao_pago';
        } else if (apt.status === 'AGENDADO' || apt.status === 'CONFIRMADO') {
          statusFrontend = 'pendente';
        }

        return {
          ...apt,
          isConsulta,
          tipo: isConsulta ? 'consulta' : 'procedimento',
          statusFrontend, // Status formatado para o frontend
        };
      });

      return res.json({
        success: true,
        data: appointmentsWithType,
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
        'Erro ao listar agendamentos',
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

      // Primeiro verificar se existe sem filtro de unidade para diagnóstico
      const appointmentCheck = await prisma.appointment.findUnique({
        where: { id },
        select: {
          id: true,
          unidade: true,
          status: true,
        },
      });

      if (!appointmentCheck) {
        console.log(
          `[Get Appointment] ❌ Agendamento ${id} não encontrado no banco de dados`,
        );
        throw new AppError('Agendamento não encontrado', 404);
      }

      if (appointmentCheck.unidade !== userUnidade) {
        console.log(
          `[Get Appointment] ⚠️ Unidade não corresponde: agendamento está em ${appointmentCheck.unidade}, usuário está em ${userUnidade}`,
        );
        throw new AppError(
          `Agendamento não encontrado na unidade ${userUnidade}. Este agendamento pertence à unidade ${appointmentCheck.unidade}.`,
          404,
        );
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
        console.log(
          `[Get Appointment] ❌ Agendamento ${id} não encontrado após verificação de unidade`,
        );
        throw new AppError('Agendamento não encontrado', 404);
      }

      // Formatar resposta com campos calculados para o frontend
      const isConsulta =
        appointment.procedure?.categoria?.toLowerCase() === 'consulta';
      let statusFrontend:
        | 'executado'
        | 'pendente'
        | 'executado_nao_pago'
        | string = appointment.status;

      if (appointment.status === 'CONCLUIDO') {
        statusFrontend = appointment.consulta
          ? 'executado'
          : 'executado_nao_pago';
      } else if (
        appointment.status === 'AGENDADO' ||
        appointment.status === 'CONFIRMADO'
      ) {
        statusFrontend = 'pendente';
      }

      return res.json({
        success: true,
        data: {
          ...appointment,
          isConsulta,
          tipo: isConsulta ? 'consulta' : 'procedimento',
          statusFrontend,
        },
      });
    } catch (error: unknown) {
      return ErrorHandler.handleError(
        error,
        res,
        'AppointmentController.getById',
        'Erro ao buscar agendamento',
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
        'Erro ao criar agendamento',
      );
    }
  }

  // Atualizar agendamento
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userUnidade } = req;

      // Validar dados com tratamento de erro melhor
      let validatedData;
      try {
        validatedData = updateAppointmentSchema.parse(req.body);
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            error: 'Dados inválidos',
            message: 'Erro de validação dos dados',
            details: error.errors,
          });
        }
        throw error;
      }

      if (!id) {
        throw new AppError('ID do agendamento é obrigatório', 400);
      }

      // Verificar se agendamento existe (incluindo consulta para verificar se está pago)
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          id,
          unidade: userUnidade as any,
        },
        include: {
          consulta: true,
        },
      });

      if (!existingAppointment) {
        throw new AppError('Agendamento não encontrado', 404);
      }

      // Permitir atualizar appointments concluídos (para ajustar detalhes da execução)
      // A validação de status já foi feita no schema

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

      // Construir objeto de atualização apenas com campos fornecidos
      const updateData: any = {};

      if (validatedData.patientId !== undefined)
        updateData.patientId = validatedData.patientId;
      if (validatedData.procedureId !== undefined)
        updateData.procedureId = validatedData.procedureId;
      if (validatedData.medicoId !== undefined)
        updateData.medicoId = validatedData.medicoId;
      if (validatedData.dataHora)
        updateData.dataHora = new Date(validatedData.dataHora);
      if (validatedData.duracao !== undefined)
        updateData.duracao = validatedData.duracao;
      if (validatedData.observacoes !== undefined)
        updateData.observacoes = validatedData.observacoes;
      if (validatedData.tipoAgendamento !== undefined)
        updateData.tipoAgendamento = validatedData.tipoAgendamento;
      if (validatedData.status)
        updateData.status = validatedData.status as StatusAgendamento;
      if (validatedData.motivoCancelamento !== undefined)
        updateData.motivoCancelamento = validatedData.motivoCancelamento;
      if (validatedData.confirmado !== undefined) {
        updateData.confirmado = validatedData.confirmado;
        if (validatedData.confirmado) {
          updateData.dataConfirmacao = new Date();
        }
      }

      // Atualizar agendamento
      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: updateData,
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
              categoria: true,
            },
          },
          medico: {
            select: {
              id: true,
              nome: true,
              especialidade: true,
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

      // Processar criação/remoção de Consultation baseado em executado/executadoNaoPago
      // Se executado = true, criar Consultation (marcar como pago)
      // Se executadoNaoPago = true, garantir que NÃO tem Consultation (não pago)
      const hasConsultation = !!existingAppointment.consulta;
      const hasExecutadoFields =
        validatedData.executado !== undefined ||
        validatedData.executadoNaoPago !== undefined;
      const isMarkingConcluido =
        validatedData.status === 'CONCLUIDO' ||
        updateData.status === 'CONCLUIDO';
      const isAlreadyConcluido = existingAppointment.status === 'CONCLUIDO';

      // Processar se:
      // 1. Os campos executado/executadoNaoPago foram enviados (sempre processar nesse caso)
      // 2. Está marcando como concluído pela primeira vez
      if (hasExecutadoFields || (isMarkingConcluido && !isAlreadyConcluido)) {
        let shouldHaveConsultation: boolean | null = null;

        if (hasExecutadoFields) {
          // Se os campos foram enviados explicitamente, seguir os valores
          // Prioridade: executadoNaoPago tem precedência sobre executado
          if (validatedData.executadoNaoPago === true) {
            // Se executadoNaoPago = true, NÃO deve ter consulta
            shouldHaveConsultation = false;
          } else if (validatedData.executado === true) {
            // Se executado = true e executadoNaoPago não é true, deve ter consulta
            shouldHaveConsultation = true;
          }
          // Se ambos são false/undefined, não mudar (shouldHaveConsultation = null)
        } else if (isMarkingConcluido && !isAlreadyConcluido) {
          // Se está marcando como concluído pela primeira vez e não especificou, assumir que está pago
          shouldHaveConsultation = true;
        }

        // Aplicar mudança se necessário
        if (shouldHaveConsultation !== null) {
          if (shouldHaveConsultation && !hasConsultation) {
            // Criar Consultation para marcar como pago
            await prisma.consultation.create({
              data: {
                appointmentId: id,
                patientId: updatedAppointment.patientId,
                procedureId: updatedAppointment.procedureId,
                medicoId:
                  updatedAppointment.medicoId ||
                  existingAppointment.criadoPorId,
                dataConsulta: updatedAppointment.dataHora,
                status: 'CONCLUIDA',
                unidade: userUnidade as any,
                observacoes: updatedAppointment.observacoes,
              },
            });
          } else if (
            !shouldHaveConsultation &&
            hasConsultation &&
            existingAppointment.consulta
          ) {
            // Remover Consultation para marcar como não pago
            await prisma.consultation.delete({
              where: {
                id: existingAppointment.consulta.id,
              },
            });
          }
        }
      }

      // Buscar appointment atualizado com consulta
      const finalAppointment = await prisma.appointment.findUnique({
        where: { id },
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
              categoria: true,
            },
          },
          medico: {
            select: {
              id: true,
              nome: true,
              especialidade: true,
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

      const appointmentToReturn = finalAppointment || updatedAppointment;

      // Formatar resposta com campos calculados para o frontend
      const isConsulta =
        appointmentToReturn.procedure?.categoria?.toLowerCase() === 'consulta';
      let statusFrontend:
        | 'executado'
        | 'pendente'
        | 'executado_nao_pago'
        | string = appointmentToReturn.status;

      if (appointmentToReturn.status === 'CONCLUIDO') {
        statusFrontend = appointmentToReturn.consulta
          ? 'executado'
          : 'executado_nao_pago';
      } else if (
        appointmentToReturn.status === 'AGENDADO' ||
        appointmentToReturn.status === 'CONFIRMADO'
      ) {
        statusFrontend = 'pendente';
      }

      return res.json({
        success: true,
        message: 'Agendamento atualizado com sucesso',
        data: {
          ...appointmentToReturn,
          isConsulta,
          tipo: isConsulta ? 'consulta' : 'procedimento',
          statusFrontend,
        },
      });
    } catch (error: unknown) {
      return ErrorHandler.handleError(
        error,
        res,
        'AppointmentController.update',
        'Erro ao atualizar agendamento',
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
        'Erro ao cancelar agendamento',
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
        'Erro ao buscar agendamentos do dia',
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

      console.log(
        `[Confirm Appointment] Tentando confirmar agendamento ${id} para unidade ${userUnidade}`,
      );

      // Verificar se o agendamento existe (primeiro sem filtrar por unidade para dar mensagem melhor)
      const appointmentExists = await prisma.appointment.findUnique({
        where: { id },
        select: {
          id: true,
          unidade: true,
          status: true,
          patientId: true,
          procedureId: true,
          dataHora: true,
        },
      });

      if (!appointmentExists) {
        console.log(
          `[Confirm Appointment] ❌ Agendamento ${id} não encontrado no banco de dados`,
        );
        throw new AppError('Agendamento não encontrado', 404);
      }

      console.log(`[Confirm Appointment] ✅ Agendamento encontrado:`, {
        id: appointmentExists.id,
        unidade: appointmentExists.unidade,
        userUnidade: userUnidade,
        status: appointmentExists.status,
        dataHora: appointmentExists.dataHora,
      });

      // Verificar se o agendamento pertence à unidade do usuário
      if (appointmentExists.unidade !== userUnidade) {
        console.log(
          `[Confirm Appointment] ⚠️ Unidade não corresponde: agendamento está em ${appointmentExists.unidade}, usuário está em ${userUnidade}`,
        );
        throw new AppError(
          `Agendamento não encontrado na unidade ${userUnidade}. Este agendamento pertence à unidade ${appointmentExists.unidade}.`,
          404,
        );
      }

      // Buscar agendamento completo
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          id,
          unidade: userUnidade as any,
        },
        include: {
          patient: {
            select: {
              id: true,
              nome: true,
            },
          },
          procedure: {
            select: {
              id: true,
              nome: true,
              categoria: true,
            },
          },
        },
      });

      if (!existingAppointment) {
        console.log(
          `[Confirm Appointment] ❌ Agendamento ${id} não encontrado após verificação de unidade`,
        );
        throw new AppError('Agendamento não encontrado', 404);
      }

      console.log(
        `[Confirm Appointment] Status atual: ${existingAppointment.status}, Paciente: ${existingAppointment.patient.nome}, Procedimento: ${existingAppointment.procedure.nome}`,
      );

      if (existingAppointment.status !== 'AGENDADO') {
        console.log(
          `[Confirm Appointment] ⚠️ Status inválido: ${existingAppointment.status} (esperado: AGENDADO)`,
        );
        throw new AppError(
          `Apenas agendamentos com status AGENDADO podem ser confirmados. Status atual: ${existingAppointment.status}`,
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
        include: {
          patient: {
            select: {
              id: true,
              nome: true,
            },
          },
          procedure: {
            select: {
              id: true,
              nome: true,
              categoria: true,
            },
          },
        },
      });

      console.log(
        `[Confirm Appointment] ✅ Agendamento ${id} confirmado com sucesso para ${confirmedAppointment.patient.nome}`,
      );

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
        'Erro ao confirmar agendamento',
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
        'Erro ao iniciar consulta',
      );
    }
  }

  // Excluir agendamento
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userUnidade } = req;

      if (!id) {
        throw new AppError('ID do agendamento é obrigatório', 400);
      }

      // Verificar se o agendamento existe
      const appointmentExists = await prisma.appointment.findUnique({
        where: { id },
        include: {
          consulta: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!appointmentExists) {
        throw new AppError('Agendamento não encontrado', 404);
      }

      // Verificar se o agendamento pertence à unidade do usuário
      if (appointmentExists.unidade !== userUnidade) {
        throw new AppError(
          `Agendamento não encontrado na unidade ${userUnidade}. Este agendamento pertence à unidade ${appointmentExists.unidade}.`,
          404,
        );
      }

      // Não permitir excluir agendamentos concluídos
      if (appointmentExists.status === 'CONCLUIDO') {
        throw new AppError(
          'Não é possível excluir agendamento já concluído. Use cancelar antes de concluir.',
          400,
        );
      }

      // Não permitir excluir se tem consulta vinculada
      if (appointmentExists.consulta) {
        throw new AppError(
          'Não é possível excluir agendamento que possui consulta vinculada.',
          400,
        );
      }

      // Deletar agendamento
      await prisma.appointment.delete({
        where: { id },
      });

      return res.json({
        success: true,
        message: 'Agendamento excluído com sucesso',
      });
    } catch (error: unknown) {
      return ErrorHandler.handleError(
        error,
        res,
        'AppointmentController.delete',
        'Erro ao excluir agendamento',
      );
    }
  }
}

export default new AppointmentController();
