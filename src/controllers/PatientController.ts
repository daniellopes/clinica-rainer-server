import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler';
import { ErrorHandler } from '../utils/errorHandler';
import {
  createPatientSchema,
  listPatientsSchema,
  getPatientByIdSchema,
} from '../schemas/patient.schema';

const prisma = new PrismaClient();

export class PatientController {
  // Listar pacientes com filtros e paginação
  async list(req: Request, res: Response) {
    try {
      console.log('🔍 [PATIENT DEBUG] Iniciando listagem de pacientes');
      console.log('🔍 [PATIENT DEBUG] Query params recebidos:', req.query);
      console.log('🔍 [PATIENT DEBUG] Headers recebidos:', {
        'x-unidade': req.headers['x-unidade'],
        'authorization': req.headers.authorization ? 'Presente' : 'Ausente'
      });

      // Validar query parameters
      const validatedQuery = listPatientsSchema.parse(req.query);
      const { page, limit, search, unidade, status, orderBy, orderDirection } =
        validatedQuery;

      // Construir filtros dinâmicos
      const where: any = {};

      // Sempre filtrar pela unidade do usuário logado se não especificada
      const unidadeToUse = unidade || req.userUnidade;
      if (unidadeToUse) {
        where.unidade = unidadeToUse;
      }

      if (search) {
        where.OR = [
          { nome: { contains: search, mode: 'insensitive' } },
          { cpf: { contains: search } },
          { telefone: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } },
          { prontuario: { contains: search } },
        ];
      }

      // Se foi especificado um status, usar o status especificado
      if (status) {
        where.status = status;
      }
      // Se não foi especificado status, não filtra (lista todos)

      console.log('🔍 [PATIENT DEBUG] Filtros aplicados:', where);

      // Buscar pacientes com paginação
      const [patients, totalCount] = await Promise.all([
        prisma.patient.findMany({
          where,
          orderBy: { [orderBy]: orderDirection },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            nome: true,
            nomeSocial: true,
            nascimento: true,
            cpf: true,
            telefone: true,
            email: true,
            foto: true,
            prontuario: true,
            sexo: true,
            unidade: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            // Incluir contagens de relacionamentos
            _count: {
              select: {
                agendamentos: true,
                consultas: true,
                convenios: true,
              },
            },
          },
        }),
        prisma.patient.count({ where }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      console.log('✅ [PATIENT DEBUG] Listagem concluída com sucesso:', {
        totalCount,
        returnedCount: patients.length,
        page,
        totalPages
      });

      return res.json({
        success: true,
        data: patients,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });
    } catch (error: unknown) {
      console.error('❌ [PATIENT DEBUG] Erro na listagem de pacientes:', error);
      return ErrorHandler.handleError(
        error,
        res,
        'PatientController.list',
        'Erro ao listar pacientes',
      );
    }
  }

  // Buscar paciente por ID
  async getById(req: Request, res: Response) {
    try {
      const { id } = getPatientByIdSchema.parse(req.params);

      const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
          convenios: {
            where: { ativo: true },
            orderBy: { createdAt: 'desc' },
          },
          parentes: {
            orderBy: { nome: 'asc' },
          },
          agendamentos: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              dataHora: true,
              status: true,
              observacoes: true,
            },
          },
          _count: {
            select: {
              agendamentos: true,
              consultas: true,
              transacoes: true,
            },
          },
        },
      });

      if (!patient) {
        throw new AppError('Paciente não encontrado', 404);
      }

      return res.json({
        success: true,
        data: patient,
      });
    } catch (error: unknown) {
      return ErrorHandler.handleError(
        error,
        res,
        'PatientController.getById',
        'Erro ao buscar paciente',
      );
    }
  }

  // Criar novo paciente
  async create(req: Request, res: Response) {
    try {
      const validatedData = createPatientSchema.parse(req.body);

      // Verificar se CPF já existe
      const existingPatient = await prisma.patient.findUnique({
        where: { cpf: validatedData.cpf.replace(/[^\d]/g, '') },
      });
      if (existingPatient) {
        throw new AppError(
          'Já existe um paciente cadastrado com este CPF',
          400,
        );
      }

      // Verificar se e-mail já existe (se informado)
      if (validatedData.email) {
        const existingEmail = await prisma.patient.findUnique({
          where: { email: validatedData.email },
        });
        if (existingEmail) {
          throw new AppError(
            'Já existe um paciente cadastrado com este e-mail',
            400,
          );
        }
      }

      // Gerar prontuário único se não fornecido
      let prontuario = validatedData.prontuario;
      if (!prontuario) {
        const year = new Date().getFullYear();
        const lastPatient = await prisma.patient.findFirst({
          where: {
            prontuario: {
              startsWith: year.toString(),
            },
          },
          orderBy: { prontuario: 'desc' },
        });

        const nextNumber = lastPatient
          ? parseInt(lastPatient.prontuario.slice(-4)) + 1
          : 1;

        prontuario = `${year}${nextNumber.toString().padStart(4, '0')}`;
      }

      // Verificar se prontuário já existe
      const existingProntuario = await prisma.patient.findUnique({
        where: { prontuario },
      });

      if (existingProntuario) {
        throw new AppError('Prontuário já existe', 400);
      }

      // Garantir que nascimento seja Date
      let nascimentoDate: Date;
      if (validatedData.nascimento instanceof Date) {
        nascimentoDate = validatedData.nascimento;
      } else if (typeof validatedData.nascimento === 'string') {
        nascimentoDate = new Date(validatedData.nascimento);
        if (isNaN(nascimentoDate.getTime())) {
          throw new AppError('Data de nascimento inválida', 400);
        }
      } else {
        throw new AppError('Data de nascimento inválida', 400);
      }

      // Processar dados numéricos e garantir tipos corretos
      const processedData = {
        ...validatedData,
        cpf: validatedData.cpf.replace(/[^\d]/g, ''),
        nascimento: nascimentoDate,
        prontuario,
        unidade: req.userUnidade as any, // Usar a unidade do usuário logado
        altura:
          validatedData.altura && typeof validatedData.altura === 'number'
            ? validatedData.altura
            : validatedData.altura && typeof validatedData.altura === 'string'
              ? parseFloat(validatedData.altura)
              : null,
        peso:
          validatedData.peso && typeof validatedData.peso === 'number'
            ? validatedData.peso
            : validatedData.peso && typeof validatedData.peso === 'string'
              ? parseFloat(validatedData.peso)
              : null,
        imc:
          validatedData.imc && typeof validatedData.imc === 'number'
            ? validatedData.imc
            : validatedData.imc && typeof validatedData.imc === 'string'
              ? parseFloat(validatedData.imc)
              : null,
        foto: validatedData.foto === '' ? null : validatedData.foto,
        email: validatedData.email === '' ? null : validatedData.email,
      };

      // Criar paciente
      const patient = await prisma.patient.create({
        data: processedData,
        include: {
          _count: {
            select: {
              agendamentos: true,
              consultas: true,
              convenios: true,
            },
          },
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Paciente criado com sucesso',
        data: patient,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        throw new AppError(
          'Dados inválidos: ' +
            error.errors
              .map((e: any) => `${e.path.join('.')}: ${e.message}`)
              .join(', '),
          400,
        );
      }

      if (error.code === 'P2002') {
        if (error.meta?.target?.includes('cpf')) {
          throw new AppError('CPF já cadastrado', 400);
        }
        if (error.meta?.target?.includes('prontuario')) {
          throw new AppError('Prontuário já existe', 400);
        }
      }

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Erro ao criar paciente', 500);
    }
  }

  // Atualizar paciente
  async update(req: Request, res: Response) {
    try {
      const { id } = getPatientByIdSchema.parse(req.params);

      // Validar apenas os dados do body (sem o id)
      const validatedData = createPatientSchema.partial().parse(req.body);

      // Verificar se paciente existe
      const existingPatient = await prisma.patient.findUnique({
        where: { id },
      });

      if (!existingPatient) {
        throw new AppError('Paciente não encontrado', 404);
      }

      // Se está atualizando CPF, verificar se não existe em outro paciente
      if (validatedData.cpf) {
        const cpfClean = validatedData.cpf.replace(/[^\d]/g, '');
        const patientWithCpf = await prisma.patient.findUnique({
          where: { cpf: cpfClean },
        });
        if (patientWithCpf && patientWithCpf.id !== id) {
          throw new AppError('CPF já cadastrado em outro paciente', 400);
        }
      }

      // Se está atualizando e-mail, verificar se não existe em outro paciente
      if (validatedData.email) {
        const patientWithEmail = await prisma.patient.findUnique({
          where: { email: validatedData.email },
        });
        if (patientWithEmail && patientWithEmail.id !== id) {
          throw new AppError(
            'Já existe um paciente cadastrado com este e-mail',
            400,
          );
        }
      }

      // Se está atualizando prontuário, verificar se não existe
      if (
        validatedData.prontuario &&
        validatedData.prontuario !== existingPatient.prontuario
      ) {
        const patientWithProntuario = await prisma.patient.findUnique({
          where: { prontuario: validatedData.prontuario },
        });

        if (patientWithProntuario && patientWithProntuario.id !== id) {
          throw new AppError('Prontuário já existe', 400);
        }
      }

      // Processar dados para atualização
      const processedData: any = { ...validatedData };

      if (validatedData.cpf) {
        processedData.cpf = validatedData.cpf.replace(/[^\d]/g, '');
      }

      if (validatedData.nascimento) {
        processedData.nascimento = new Date(validatedData.nascimento);
      }

      if (validatedData.altura) {
        processedData.altura = parseFloat(validatedData.altura.toString());
      }

      if (validatedData.peso) {
        processedData.peso = parseFloat(validatedData.peso.toString());
      }

      if (validatedData.imc) {
        processedData.imc = parseFloat(validatedData.imc.toString());
      }

      if (validatedData.foto === '') {
        processedData.foto = null;
      }

      if (validatedData.email === '') {
        processedData.email = null;
      }

      // Atualizar paciente
      const updatedPatient = await prisma.patient.update({
        where: { id },
        data: processedData,
        include: {
          convenios: {
            where: { ativo: true },
          },
          parentes: true,
          _count: {
            select: {
              agendamentos: true,
              consultas: true,
              transacoes: true,
            },
          },
        },
      });

      return res.json({
        success: true,
        message: 'Paciente atualizado com sucesso',
        data: updatedPatient,
      });
    } catch (error: unknown) {
      return ErrorHandler.handleError(
        error,
        res,
        'PatientController.update',
        'Erro ao atualizar paciente',
      );
    }
  }

  // Soft delete do paciente
  async delete(req: Request, res: Response) {
    try {
      const { id } = getPatientByIdSchema.parse(req.params);

      // Verificar se paciente existe
      const existingPatient = await prisma.patient.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              agendamentos: true,
              consultas: true,
              transacoes: true,
            },
          },
        },
      });

      if (!existingPatient) {
        throw new AppError('Paciente não encontrado', 404);
      }

      // Verificar se tem agendamentos ou consultas futuras
      const futureAppointments = await prisma.appointment.count({
        where: {
          patientId: id,
          dataHora: {
            gte: new Date(),
          },
          status: {
            in: ['AGENDADO', 'CONFIRMADO'],
          },
        },
      });

      if (futureAppointments > 0) {
        throw new AppError(
          'Não é possível excluir paciente com agendamentos futuros',
          400,
        );
      }

      // Fazer soft delete (marcar como inativo)
      const deletedPatient = await prisma.patient.update({
        where: { id },
        data: {
          status: 'INATIVO',
          updatedAt: new Date(),
        },
      });

      return res.json({
        success: true,
        message: 'Paciente inativado com sucesso',
        data: {
          id: deletedPatient.id,
          nome: deletedPatient.nome,
          status: deletedPatient.status,
        },
      });
    } catch (error: unknown) {
      return ErrorHandler.handleError(
        error,
        res,
        'PatientController.delete',
        'Erro ao excluir paciente',
      );
    }
  }

  // Buscar pacientes aniversariantes
  async getBirthdays(req: Request, res: Response) {
    try {
      const today = new Date();
      const todayMonth = today.getMonth() + 1;
      const todayDay = today.getDate();

      const birthdays = await prisma.$queryRaw`
        SELECT id, nome, nascimento, telefone, email, unidade
        FROM patients 
        WHERE EXTRACT(month FROM nascimento) = ${todayMonth}
        AND EXTRACT(day FROM nascimento) = ${todayDay}
        AND status = 'ATIVO'
        ORDER BY nome
      `;

      return res.json({
        success: true,
        data: birthdays,
        message: `${(birthdays as any[]).length} aniversariante(s) hoje`,
      });
    } catch (error: unknown) {
      return ErrorHandler.handleError(
        error,
        res,
        'PatientController.getBirthdays',
        'Erro ao buscar aniversariantes',
      );
    }
  }

  // Upload de documento do paciente
  async uploadDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!req.file) {
        throw new AppError('Nenhum arquivo enviado', 400);
      }

      // Salva o arquivo diretamente no banco de dados
      const document = await prisma.patientDocument.create({
        data: {
          patientId: id,
          filename: req.file.filename || `file_${Date.now()}`,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          data: req.file.buffer, // Armazena o conteúdo binário do arquivo
        } as any,
      });

      return res.status(201).json({
        success: true,
        document: {
          id: document.id,
          filename: document.filename,
          originalname: document.originalname,
          mimetype: document.mimetype,
          size: document.size,
          uploadedAt: document.uploadedAt,
        },
      });
    } catch (error: any) {
      throw new AppError(
        'Erro ao fazer upload do documento: ' + error.message,
        500,
      );
    }
  }

  // Listar documentos do paciente
  async listDocuments(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const documents = await prisma.patientDocument.findMany({
        where: { patientId: id },
        orderBy: { uploadedAt: 'desc' },
      });
      return res.status(200).json({ success: true, documents });
    } catch (error: any) {
      throw new AppError('Erro ao listar documentos: ' + error.message, 500);
    }
  }

  // Download/visualização de documento do paciente
  async downloadDocument(req: Request, res: Response) {
    try {
      const { documentId } = req.params;
      const document: any = await prisma.patientDocument.findUnique({
        where: { id: documentId },
      });
      if (!document) {
        console.error(
          `[downloadDocument] Documento não encontrado: id=${documentId}`,
        );
        return res.status(404).json({ error: 'Documento não encontrado' });
      }

      // Define headers para download
      res.setHeader('Content-Type', document.mimetype);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${document.originalname}"`,
      );
      res.setHeader('Content-Length', document.size.toString());

      // Envia o conteúdo binário do banco
      res.send(document.data);
    } catch (error: any) {
      console.error(`[downloadDocument] Erro inesperado:`, error);
      return res.status(500).json({ error: 'Erro ao baixar documento' });
    }
  }
}

export default new PatientController();
