import { Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../middlewares/errorHandler';

// Interface para padronizar respostas de erro
interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  details?: unknown;
}

// Classe utilitária para tratamento centralizado de erros
export class ErrorHandler {
  /**
   * Método principal para tratamento de erros em controllers
   */
  static handleError(
    error: unknown,
    res: Response,
    context: string,
    defaultMessage: string = 'Erro interno do servidor',
  ): Response<ErrorResponse> {
    console.error(`Erro em ${context}:`, error);

    // Tratamento específico para erros de validação Zod
    if (this.isZodError(error)) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        error: 'Validation Error',
        details: error.errors,
      });
    }

    // Tratamento para AppError (erros customizados)
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        error: error.name,
      });
    }

    // Tratamento para erros padrão do JavaScript
    if (error instanceof Error) {
      return res.status(500).json({
        success: false,
        message: error.message || defaultMessage,
        error: error.name,
      });
    }

    // Erro desconhecido
    return res.status(500).json({
      success: false,
      message: defaultMessage,
      error: 'Unknown Error',
    });
  }

  /**
   * Método para logging de erros
   */
  static logError(error: unknown, context: string): void {
    console.error(`[${context}] Erro:`, error);
  }

  /**
   * Método para extrair mensagem de erro
   */
  static getErrorMessage(error: unknown, defaultMessage: string): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return defaultMessage;
  }

  /**
   * Type guard para verificar se é um erro Zod
   */
  static isZodError(error: unknown): error is ZodError {
    return error instanceof ZodError;
  }

  /**
   * Type guard para verificar se é um Error
   */
  static isError(error: unknown): error is Error {
    return error instanceof Error;
  }
}

/**
 * Decorator para tratamento automático de erros em métodos de controller
 */
export function handleControllerError(
  context: string,
  defaultMessage?: string,
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        const res = args.find((arg) => arg && typeof arg.status === 'function');
        if (res) {
          return ErrorHandler.handleError(
            error,
            res,
            `${context}.${propertyKey}`,
            defaultMessage || 'Erro interno do servidor',
          );
        }
        throw error;
      }
    };
  };
}