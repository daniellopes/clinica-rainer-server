import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler';
import { 
  createPatientRelativeSchema, 
  updatePatientRelativeSchema, 
  listPatientRelativesSchema,
  CreatePatientRelativeData,
  UpdatePatientRelativeData,
  ListPatientRelativesQuery 
} from '../schemas/patient-relative.schema';

const prisma = new PrismaClient();

export class PatientRelativeController {
  // Listar dependentes/responsáveis de um paciente
  async list(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedQuery = listPatientRelativesSchema.parse(req.query);
      const { page, limit, tipo } = validatedQuery;

      // Construir filtros
      const where: any = { patientId: id };
      
      if (tipo === 'dependentes') {
        where.isDependente = true;
      } else if (tipo === 'responsaveis') {
        where.isResponsavel = true;
      }

      // Buscar dependentes/responsáveis com paginação
      const [relatives, totalCount] = await Promise.all([
        prisma.patientRelative.findMany({
          where,
          orderBy: { nome: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            patient: {
              select: { nome: true, id: true }
            }
          }
        }),
        prisma.patientRelative.count({ where })
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return res.status(200).json({
        success: true,
        data: relatives,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });
    } catch (error: any) {
      throw new AppError('Erro ao listar dependentes/responsáveis: ' + error.message, 500);
    }
  }

  // Buscar dependente/responsável por ID
  async getById(req: Request, res: Response) {
    try {
      const { id, relativeId } = req.params;

      const relative = await prisma.patientRelative.findFirst({
        where: { 
          id: relativeId,
          patientId: id 
        },
        include: {
          patient: {
            select: { nome: true, id: true }
          }
        }
      });

      if (!relative) {
        throw new AppError('Dependente/responsável não encontrado', 404);
      }

      return res.status(200).json({
        success: true,
        data: relative
      });
    } catch (error: any) {
      throw new AppError('Erro ao buscar dependente/responsável: ' + error.message, 500);
    }
  }

  // Criar novo dependente/responsável
  async create(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = createPatientRelativeSchema.parse(req.body);

      // Verificar se o paciente existe
      const patient = await prisma.patient.findUnique({ where: { id } });
      if (!patient) {
        throw new AppError('Paciente não encontrado', 404);
      }

      // Converter data de nascimento se fornecida
      const relativeData: any = { ...validatedData, patientId: id };
      if (validatedData.nascimento) {
        relativeData.nascimento = new Date(validatedData.nascimento);
      }

      // Criar dependente/responsável
      const relative = await prisma.patientRelative.create({
        data: relativeData,
        include: {
          patient: {
            select: { nome: true, id: true }
          }
        }
      });

      return res.status(201).json({
        success: true,
        data: relative,
        message: 'Dependente/responsável criado com sucesso'
      });
    } catch (error: any) {
      throw new AppError('Erro ao criar dependente/responsável: ' + error.message, 500);
    }
  }

  // Atualizar dependente/responsável
  async update(req: Request, res: Response) {
    try {
      const { id, relativeId } = req.params;
      const validatedData = updatePatientRelativeSchema.parse(req.body);

      // Verificar se existe
      const existingRelative = await prisma.patientRelative.findFirst({
        where: { 
          id: relativeId,
          patientId: id 
        }
      });

      if (!existingRelative) {
        throw new AppError('Dependente/responsável não encontrado', 404);
      }

      // Converter data de nascimento se fornecida
      const relativeData: any = { ...validatedData };
      if (validatedData.nascimento) {
        relativeData.nascimento = new Date(validatedData.nascimento);
      }

      // Atualizar
      const relative = await prisma.patientRelative.update({
        where: { id: relativeId },
        data: relativeData,
        include: {
          patient: {
            select: { nome: true, id: true }
          }
        }
      });

      return res.status(200).json({
        success: true,
        data: relative,
        message: 'Dependente/responsável atualizado com sucesso'
      });
    } catch (error: any) {
      throw new AppError('Erro ao atualizar dependente/responsável: ' + error.message, 500);
    }
  }

  // Deletar dependente/responsável
  async delete(req: Request, res: Response) {
    try {
      const { id, relativeId } = req.params;

      // Verificar se existe
      const existingRelative = await prisma.patientRelative.findFirst({
        where: { 
          id: relativeId,
          patientId: id 
        }
      });

      if (!existingRelative) {
        throw new AppError('Dependente/responsável não encontrado', 404);
      }

      // Deletar
      await prisma.patientRelative.delete({
        where: { id: relativeId }
      });

      return res.status(200).json({
        success: true,
        message: 'Dependente/responsável removido com sucesso'
      });
    } catch (error: any) {
      throw new AppError('Erro ao remover dependente/responsável: ' + error.message, 500);
    }
  }

  // Buscar responsáveis de um menor de idade
  async getResponsaveisLegais(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Verificar se o paciente é menor de idade
      const patient = await prisma.patient.findUnique({ where: { id } });
      if (!patient) {
        throw new AppError('Paciente não encontrado', 404);
      }

      const hoje = new Date();
      const nascimento = new Date(patient.nascimento);
      const idade = hoje.getFullYear() - nascimento.getFullYear();
      const menorIdade = idade < 18;

      // Buscar responsáveis legais
      const responsaveis = await prisma.patientRelative.findMany({
        where: { 
          patientId: id,
          isResponsavel: true
        },
        orderBy: { nome: 'asc' }
      });

      return res.status(200).json({
        success: true,
        data: responsaveis,
        menorIdade,
        message: menorIdade && responsaveis.length === 0 
          ? 'Atenção: Paciente menor de idade sem responsável legal cadastrado' 
          : undefined
      });
    } catch (error: any) {
      throw new AppError('Erro ao buscar responsáveis legais: ' + error.message, 500);
    }
  }
}

export default new PatientRelativeController();
