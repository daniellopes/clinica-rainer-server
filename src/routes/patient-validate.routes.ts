import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Validação de e-mail de paciente
router.post('/email', async (req, res) => {
  try {
    const { email, excludeId } = req.body;
    if (!email) return res.status(400).json({ exists: false, error: 'E-mail não informado' });
    
    const where: any = { email: String(email) };
    if (excludeId) where.id = { not: String(excludeId) };
    
    const exists = await prisma.patient.findFirst({ where });
    return res.json({ exists: !!exists });
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Validação de CPF de paciente
router.post('/cpf', async (req, res) => {
  try {
    const { cpf, excludeId } = req.body;
    if (!cpf) return res.status(400).json({ exists: false, error: 'CPF não informado' });
    
    const cleanCpf = String(cpf).replace(/[^\d]/g, '');
    const where: any = { cpf: cleanCpf };
    if (excludeId) where.id = { not: String(excludeId) };
    
    const exists = await prisma.patient.findFirst({ where });
    return res.json({ exists: !!exists });
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
