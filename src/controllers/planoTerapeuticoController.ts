import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getPlanosPorConsulta = async (req: Request, res: Response) => {
  try {
    const { consultaId } = req.query;
    if (!consultaId) return res.status(400).json({ success: false, message: "consultaId é obrigatório" });

    const planos = await prisma.planoTerapeutico.findMany({
      where: { consultationId: String(consultaId) },
      orderBy: { id: 'desc' },
    });

    res.json({ success: true, data: planos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erro ao buscar planos" });
  }
};

export const criarPlano = async (req: Request, res: Response) => {
  try {
    const { consultaId, medicamento, dosagem, frequencia, quantidadeSessoes, observacoes } = req.body;
    if (!consultaId || !medicamento) return res.status(400).json({ success: false, message: "Campos obrigatórios ausentes" });

    const plano = await prisma.planoTerapeutico.create({
      data: {
        consultationId: consultaId,
        medicamento,
        dosagem,
        frequencia,
        quantidadeSessoes: Number(quantidadeSessoes || 0),
        observacoes,
      },
    });

    res.status(201).json({ success: true, data: plano });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erro ao criar plano" });
  }
};

export const atualizarPlano = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const dados = req.body;

    const plano = await prisma.planoTerapeutico.update({
      where: { id: Number(id) },
      data: dados,
    });

    res.json({ success: true, data: plano });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erro ao atualizar plano" });
  }
};

export const deletarPlano = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.planoTerapeutico.delete({ where: { id: Number(id) } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erro ao deletar plano" });
  }
};
