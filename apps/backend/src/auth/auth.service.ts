import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma.service';
import { GoogleSheetsService } from '../sync/google-sheets.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly googleSheetsService: GoogleSheetsService,
  ) {}

  async login(username: string, password: string) {
    const trimmedUsername = (username || '').trim();
    if (!trimmedUsername || !password) {
      throw new UnauthorizedException('Username and password are required');
    }

    let user: any = null;

    // 1. Try Google Sheets Academic Departments user first
    const sheetUser = await this.googleSheetsService.fetchAcademicDepartmentUser(trimmedUsername);
    if (sheetUser && sheetUser.password === password) {
      const passwordHash = await bcrypt.hash(password, 10);
      let existingUser: any = null;
      try {
        existingUser = await this.prisma.user.findUnique({
          where: { username: sheetUser.username },
        });
      } catch (err: any) {
        this.logger.warn(`Prisma findUnique warning during Google Sheets auth: ${err.message}`);
      }

      if (existingUser && !existingUser.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      try {
        user = existingUser
          ? await this.prisma.user.update({
              where: { id: existingUser.id },
              data: {
                passwordHash,
                name: sheetUser.name,
                email: sheetUser.email,
                mobile: sheetUser.mobile,
                post: sheetUser.post,
                role: 'MANAGER',
              },
            })
          : await this.prisma.user.create({
              data: {
                username: sheetUser.username,
                passwordHash,
                name: sheetUser.name,
                email: sheetUser.email,
                mobile: sheetUser.mobile,
                post: sheetUser.post,
                role: 'MANAGER',
              },
            });
      } catch (err: any) {
        this.logger.warn(`Could not save user to DB during Sheets auth: ${err.message}`);
        user = {
          id: existingUser?.id || `usr_${Date.now()}`,
          username: sheetUser.username,
          name: sheetUser.name,
          email: sheetUser.email,
          mobile: sheetUser.mobile,
          post: sheetUser.post,
          role: 'MANAGER',
          isActive: true,
        };
      }
      this.logger.log(`Authenticated Academic user "${sheetUser.username}" from Departments.`);
    } else {
      // 2. Fallback to Database user or Admin bootstrap
      let dbUser: any = null;
      try {
        dbUser = await this.prisma.user.findUnique({
          where: { username: trimmedUsername },
        });
      } catch (err: any) {
        this.logger.warn(`Prisma findUnique error: ${err.message}`);
      }

      // Special bootstrap for 'admin' / 'admin123' if not yet created
      if (!dbUser && trimmedUsername.toLowerCase() === 'admin') {
        const passwordHash = await bcrypt.hash('admin123', 10);
        try {
          dbUser = await this.prisma.user.create({
            data: {
              username: 'admin',
              passwordHash,
              name: 'Academic Head Admin',
              post: 'ACADEMIC MANAGER',
              role: 'ADMIN',
            },
          });
        } catch (err: any) {
          dbUser = {
            id: 'admin_bootstrap',
            username: 'admin',
            passwordHash,
            name: 'Academic Head Admin',
            post: 'ACADEMIC MANAGER',
            role: 'ADMIN',
            isActive: true,
          };
        }
      }

      if (!dbUser) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!dbUser.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      // Verify password against stored hash or fallback default
      const isValid = dbUser.passwordHash ? await bcrypt.compare(password, dbUser.passwordHash) : false;
      const isDefaultAdmin = trimmedUsername.toLowerCase() === 'admin' && password === 'admin123';

      if (!isValid && !isDefaultAdmin) {
        throw new UnauthorizedException('Invalid credentials');
      }

      user = dbUser;
      this.logger.log(`Authenticated user "${user.username}" from Database.`);
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Update last login safely
    try {
      if (user.id && typeof user.id === 'string' && !user.id.startsWith('usr_')) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            refreshToken: tokens.refreshToken,
          },
        });
      }
    } catch (err: any) {
      this.logger.warn(`Could not update user lastLoginAt in DB: ${err.message}`);
    }

    return {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        post: user.post,
        role: user.role,
      },
      tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Removal from the Academic sheet or a password change invalidates
      // outstanding refresh sessions as well as future password logins.
      const sheetUser = await this.googleSheetsService.fetchAcademicDepartmentUser(user.username);
      const sourcePasswordMatches = sheetUser
        ? await bcrypt.compare(sheetUser.password, user.passwordHash)
        : false;
      if (!user.isActive || !sourcePasswordMatches) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      const tokens = await this.generateTokens(user);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: tokens.refreshToken },
      });

      return { tokens };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        mobile: true,
        post: true,
        role: true,
        isActive: true,
      },
    });
  }

  private async generateTokens(user: { id: string; username: string; role: string; name: string }) {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key',
        expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
