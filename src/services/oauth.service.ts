import { ConfidentialClientApplication, AuthorizationUrlRequest, AuthorizationCodeRequest } from '@azure/msal-node';
import axios from 'axios';
import prisma from '../config/database';
import { ApiError } from '../utils/ApiError';
import { UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

interface AzureUserInfo {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
}

class OAuthService {
  private msalClient: ConfidentialClientApplication;

  constructor() {
    const msalConfig = {
      auth: {
        clientId: process.env.AZURE_CLIENT_ID!,
        authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
        clientSecret: process.env.AZURE_CLIENT_SECRET!,
      },
    };

    this.msalClient = new ConfidentialClientApplication(msalConfig);
  }

  /**
   * Get Azure AD authorization URL
   */
  async getAuthorizationUrl(redirectUri: string): Promise<string> {
    const authCodeUrlParameters: AuthorizationUrlRequest = {
      scopes: ['user.read', 'openid', 'profile', 'email'],
      redirectUri,
    };

    try {
      const authUrl = await this.msalClient.getAuthCodeUrl(authCodeUrlParameters);
      return authUrl;
    } catch (error) {
      logger.error('Error generating authorization URL:', error);
      throw ApiError.internal('Failed to generate authorization URL');
    }
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleCallback(code: string, redirectUri: string) {
    try {
      const tokenRequest: AuthorizationCodeRequest = {
        code,
        scopes: ['user.read', 'openid', 'profile', 'email'],
        redirectUri,
      };

      const tokenResponse = await this.msalClient.acquireTokenByCode(tokenRequest);

      if (!tokenResponse || !tokenResponse.accessToken) {
        throw ApiError.unauthorized('Failed to acquire access token');
      }

      const userInfo = await this.getUserInfo(tokenResponse.accessToken);

      const user = await this.findOrCreateUser(userInfo, tokenResponse);

      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      logger.info(`User logged in via Azure AD: ${user.email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error('OAuth callback error:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.unauthorized('OAuth authentication failed');
    }
  }

  /**
   * Get user info from Microsoft Graph API
   */
  private async getUserInfo(accessToken: string): Promise<AzureUserInfo> {
    try {
      const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error) {
      logger.error('Error fetching user info from Microsoft Graph:', error);
      throw ApiError.internal('Failed to fetch user information');
    }
  }

  /**
   * Find or create user in database
   */
  private async findOrCreateUser(userInfo: AzureUserInfo, tokenResponse: any) {
    const email = userInfo.mail || userInfo.userPrincipalName;
    const providerId = userInfo.id;

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { provider: 'azure', providerId },
        ],
      },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date(),
          provider: 'azure',
          providerId,
          providerData: {
            displayName: userInfo.displayName,
            userPrincipalName: userInfo.userPrincipalName,
            lastTokenRefresh: new Date().toISOString(),
          },
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          name: userInfo.displayName,
          provider: 'azure',
          providerId,
          role: UserRole.VIEWER,
          isActive: true,
          lastLogin: new Date(),
          providerData: {
            displayName: userInfo.displayName,
            userPrincipalName: userInfo.userPrincipalName,
            registeredAt: new Date().toISOString(),
          },
        },
      });

      logger.info(`New user created via Azure AD: ${user.email}`);
    }

    return user;
  }

  /**
   * Generate JWT access token
   */
  private generateAccessToken(user: any): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      } as jwt.SignOptions
    );
  }

  /**
   * Generate JWT refresh token
   */
  private generateRefreshToken(user: any): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_REFRESH_SECRET!,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
      } as jwt.SignOptions
    );
  }
}

export const oauthService = new OAuthService();
