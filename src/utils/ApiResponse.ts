import { Response } from 'express';

export class ApiResponse {
  static success(res: Response, data: any, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  static created(res: Response, data: any, message = 'Resource created successfully') {
    return this.success(res, data, message, 201);
  }

  static noContent(res: Response) {
    return res.status(204).send();
  }

  static error(res: Response, message: string, statusCode = 400) {
    return res.status(statusCode).json({
      success: false,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  static paginated(
    res: Response,
    data: any[],
    page: number,
    limit: number,
    total: number,
    message = 'Success'
  ) {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
