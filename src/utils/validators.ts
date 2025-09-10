/**
 * Utilitários de validação comuns
 * Centraliza validações reutilizáveis para manter consistência
 */

/**
 * Valida formato de email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida força da senha
 */
export const isValidPassword = (
  password: string,
): { valid: boolean; message?: string } => {
  if (!password) {
    return { valid: false, message: 'Senha é obrigatória' };
  }

  if (password.length < 6) {
    return { valid: false, message: 'Senha deve ter pelo menos 6 caracteres' };
  }

  if (password.length > 128) {
    return {
      valid: false,
      message: 'Senha não pode ter mais de 128 caracteres',
    };
  }

  return { valid: true };
};

/**
 * Valida formato de telefone brasileiro
 */
export const isValidPhone = (phone: string): boolean => {
  if (!phone) return true; // Telefone é opcional

  // Remove caracteres especiais
  const cleanPhone = phone.replace(/\D/g, '');

  // Valida formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
  return cleanPhone.length === 10 || cleanPhone.length === 11;
};

/**
 * Sanitiza string removendo espaços extras e caracteres especiais
 */
export const sanitizeString = (str: string): string => {
  if (!str) return '';
  return str.trim().replace(/\s+/g, ' ');
};

/**
 * Valida UUID
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Mascara email para logs (segurança)
 */
export const maskEmail = (email: string): string => {
  if (!email) return '';
  return email.replace(/(.{2}).*(@.*)/, '$1***$2');
};

/**
 * Gera senha aleatória segura
 */
export const generateSecurePassword = (length: number = 12): string => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
};

/**
 * Valida se string contém apenas caracteres permitidos para nome
 */
export const isValidName = (name: string): boolean => {
  if (!name) return false;

  // Permite letras, espaços, acentos e hífens
  const nameRegex = /^[a-zA-ZÀ-ÿ\s\-'.]+$/;
  return nameRegex.test(name) && name.length >= 2 && name.length <= 100;
};

/**
 * Normaliza string para busca (remove acentos, maiúsculas)
 */
export const normalizeForSearch = (str: string): string => {
  if (!str) return '';

  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};
