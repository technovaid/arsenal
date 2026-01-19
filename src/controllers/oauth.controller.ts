import { Request, Response, NextFunction } from 'express';
import { oauthService } from '../services/oauth.service';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export class OAuthController {
  /**
   * Get Azure AD authorization URL
   */
  async getAzureAuthUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const redirectUri = req.query.redirectUri as string || process.env.AZURE_REDIRECT_URI!;
      
      const authUrl = await oauthService.getAuthorizationUrl(redirectUri);
      
      return ApiResponse.success(res, { authUrl }, 'Authorization URL generated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle Azure AD OAuth callback
   */
  async handleAzureCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, redirectUri } = req.body;

      if (!code) {
        throw ApiError.badRequest('Authorization code is required');
      }

      const result = await oauthService.handleCallback(
        code,
        redirectUri || process.env.AZURE_REDIRECT_URI!
      );

      return ApiResponse.success(res, result, 'OAuth login successful');
    } catch (error) {
      next(error);
    }
  }
}

export const oauthController = new OAuthController();
