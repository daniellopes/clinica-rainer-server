import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../middlewares/errorHandler';
import { ErrorHandler } from '../utils/errorHandler';

const prisma = new PrismaClient();

// Schema de validação para criar/atualizar anamnese
const anamneseSchema = z.object({
  formId: z.string().uuid(),
  consultationId: z.string().uuid(),
  respostas: z.record(z.any()),
  unidade: z.enum(['BARRA', 'TIJUCA']),
});

const updateAnamneseSchema = z.object({
  respostas: z.record(z.any()).optional(),
  unidade: z.enum(['BARRA', 'TIJUCA']).optional(),
});

// Schema de validação para criar/atualizar template de formulário
const templateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  especialidade: z.string().optional(),
  campos: z.any(), // JSON com a estrutura dos campos
  unidade: z.enum(['BARRA', 'TIJUCA']),
});

const updateTemplateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').optional(),
  descricao: z.string().optional(),
  especialidade: z.string().optional(),
  campos: z.any().optional(),
  ativo: z.boolean().optional(),
});

// Buscar anamneses de um paciente através das consultas
export const getAnamnesesByPaciente = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({
        error: 'ID do paciente é obrigatório',
      });
    }

    // Buscar anamneses do paciente através das consultas
    const anamneses = await prisma.anamnesisResponse.findMany({
      where: {
        consultation: {
          patientId: patientId,
        },
      },
      include: {
        form: true,
        consultation: {
          select: {
            id: true,
            patientId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Formatar anamneses
    const formattedAnamneses = anamneses.map((anamnese) => ({
      id: anamnese.id,
      pacienteId: anamnese.consultation.patientId,
      templateId: anamnese.formId,
      especialidade: anamnese.form.especialidade || 'Geral',
      respostas: anamnese.respostas,
      status: 'completa' as const,
      criadoPor: 'Sistema', // TODO: Implementar usuário logado
      criadoEm: anamnese.createdAt.toISOString(),
      atualizadoEm: anamnese.updatedAt.toISOString(),
      versao: '1.0',
      consultationId: anamnese.consultation.id,
    }));

    res.json({
      data: formattedAnamneses,
    });
  } catch (error: unknown) {
    return ErrorHandler.handleError(
      error,
      res,
      'getAnamnesesByPaciente',
      'Erro ao buscar anamneses do paciente'
    );
  }
};

// Criar nova anamnese
export const createAnamnese = async (req: Request, res: Response) => {
  try {
    const validatedData = anamneseSchema.parse(req.body);

    const anamnese = await prisma.anamnesisResponse.create({
      data: {
        formId: validatedData.formId,
        consultationId: validatedData.consultationId,
        respostas: validatedData.respostas,
        unidade: validatedData.unidade,
      },
      include: {
        form: true,
        consultation: true,
      },
    });

    const response = {
      id: anamnese.id,
      pacienteId: anamnese.consultation.patientId,
      templateId: anamnese.formId,
      especialidade: anamnese.form.especialidade || 'Geral',
      respostas: anamnese.respostas,
      status: 'completa' as const,
      criadoPor: 'Sistema', // TODO: Implementar usuário logado
      criadoEm: anamnese.createdAt.toISOString(),
      atualizadoEm: anamnese.updatedAt.toISOString(),
      versao: '1.0',
    };

    res.status(201).json({
      data: response,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors,
      });
    }

    return ErrorHandler.handleError(
      error,
      res,
      'createAnamnese',
      'Erro ao criar anamnese'
    );
  }
};

// Atualizar anamnese existente
export const updateAnamnese = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateAnamneseSchema.parse(req.body);

    const anamnese = await prisma.anamnesisResponse.update({
      where: { id },
      data: validatedData,
    });

    // Buscar dados relacionados separadamente
    const consultation = await prisma.consultation.findUnique({
      where: { id: anamnese.consultationId },
      select: { patientId: true },
    });

    const form = await prisma.anamnesisForm.findUnique({
      where: { id: anamnese.formId },
      select: { especialidade: true },
    });

    const response = {
      id: anamnese.id,
      pacienteId: consultation?.patientId || '',
      templateId: anamnese.formId,
      especialidade: form?.especialidade || 'Geral',
      respostas: anamnese.respostas,
      status: 'completa' as const,
      criadoPor: 'Sistema', // TODO: Implementar usuário logado
      criadoEm: anamnese.createdAt.toISOString(),
      atualizadoEm: anamnese.updatedAt.toISOString(),
      versao: '1.1',
    };

    res.json({
      data: response,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors,
      });
    }

    return ErrorHandler.handleError(
      error,
      res,
      'updateAnamnese',
      'Erro ao atualizar anamnese'
    );
  }
};

// Deletar anamnese
export const deleteAnamnese = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.anamnesisResponse.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error: unknown) {
    return ErrorHandler.handleError(
      error,
      res,
      'deleteAnamnese',
      'Erro ao deletar anamnese'
    );
  }
};

// Buscar formulários de anamnese disponíveis
export const getAnamneseForms = async (req: Request, res: Response) => {
  try {
    const forms = await prisma.anamnesisForm.findMany({
      where: {
        ativo: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });

    res.json({
      data: forms,
    });
  } catch (error: unknown) {
    return ErrorHandler.handleError(
      error,
      res,
      'getAnamneseForms',
      'Erro ao buscar formulários de anamnese'
    );
  }
};

// Criar novo template de formulário
export const saveAnamneseTemplate = async (req: Request, res: Response) => {
  try {
    const validatedData = templateSchema.parse(req.body);

    const template = await prisma.anamnesisForm.create({
      data: {
        nome: validatedData.nome,
        descricao: validatedData.descricao,
        especialidade: validatedData.especialidade,
        campos: validatedData.campos,
        unidade: validatedData.unidade,
        ativo: true,
      },
    });

    res.status(201).json({
      data: template,
      message: 'Template criado com sucesso',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors,
      });
    }

    return ErrorHandler.handleError(
      error,
      res,
      'saveAnamneseTemplate',
      'Erro ao criar template'
    );
  }
};

// Atualizar template de formulário existente
export const updateAnamneseTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateTemplateSchema.parse(req.body);

    // Verificar se o template existe
    const existingTemplate = await prisma.anamnesisForm.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return res.status(404).json({
        error: 'Template não encontrado',
      });
    }

    const updatedTemplate = await prisma.anamnesisForm.update({
      where: { id },
      data: validatedData,
    });

    res.json({
      data: updatedTemplate,
      message: 'Template atualizado com sucesso',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors,
      });
    }

    return ErrorHandler.handleError(
      error,
      res,
      'updateAnamneseTemplate',
      'Erro ao atualizar template'
    );
  }
};

// Duplicar template de formulário
export const duplicateAnamneseTemplate = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    // Buscar o template original
    const originalTemplate = await prisma.anamnesisForm.findUnique({
      where: { id },
    });

    if (!originalTemplate) {
      return res.status(404).json({
        error: 'Template não encontrado',
      });
    }

    // Criar cópia do template
    const duplicatedTemplate = await prisma.anamnesisForm.create({
      data: {
        nome: `${originalTemplate.nome} (Cópia)`,
        descricao: originalTemplate.descricao,
        especialidade: originalTemplate.especialidade,
        campos: originalTemplate.campos as Prisma.InputJsonValue,
        unidade: originalTemplate.unidade,
        ativo: true,
      },
    });

    res.status(201).json({
      data: duplicatedTemplate,
      message: 'Template duplicado com sucesso',
    });
  } catch (error: unknown) {
    return ErrorHandler.handleError(
      error,
      res,
      'duplicateAnamneseTemplate',
      'Erro ao duplicar template'
    );
  }
};
