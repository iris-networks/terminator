/*
 * Copyright 2025 hivelogic pvt ltd, singapore
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types/index.js';

export const errorHandler = (
  error: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('❌ Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Default error values
  let status = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';

  // Handle API errors
  if ('status' in error && 'code' in error) {
    status = error.status;
    code = error.code;
    message = error.message;
  }

  // Handle specific error types
  if (error.name === 'ValidationError') {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = error.message;
  }

  if (error.name === 'UnauthorizedError') {
    status = 401;
    code = 'UNAUTHORIZED';
    message = 'Authentication required';
  }

  if (error.name === 'JsonWebTokenError') {
    status = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && status === 500) {
    message = 'Internal server error';
  }

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
      }),
    },
  });
};

export const createApiError = (
  message: string,
  status: number = 500,
  code: string = 'API_ERROR'
): ApiError => {
  const error = new Error(message) as ApiError;
  error.status = status;
  error.code = code;
  return error;
};