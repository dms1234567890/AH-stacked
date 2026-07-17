import { Injectable, UnauthorizedException, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma.service';
import { GoogleSheetsService } from '../sync/google-sheets.service';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly googleSheetsService: GoogleSheetsService,
  ) {}

  async onApplicationBootstrap() {
    try {
      // First try importing users from the Login Google Sheet into PostgreSQL
      const sheetUsers = await this.googleSheetsService.fetchAllUsersFromSheet();
      let imported = 0;
      for (const sUser of sheetUsers) {
        const existing = await this.prisma.user.findUnique({ where: { username: sUser.username } });
        if (!existing) {
          const passwordHash = await bcrypt.hash(sUser.password, 10);
          await this.prisma.user.create({
            data: {
              username: sUser.username,
              passwordHash,
              name: sUser.name || sUser.username,
              email: sUser.email,
              mobile: sUser.mobile,
              post: sUser.post,
              role: sUser.post === 'ADMIN' ? 'ADMIN' : 'STAFF',
            },
          });
          imported++;
        }
      }

      if (imported > 0) {
        this.logger.log(`Synced ${imported} user(s) from Google Sheets to PostgreSQL.`);
      }

      // If database is still completely empty, seed default admin user
      const count = await this.prisma.user.count();
      if (count === 0) {
        const passwordHash = await bcrypt.hash('acd@123', 10);
        await this.prisma.user.create({
          data: {
            username: 'acd@123',
            passwordHash,
            name: 'Academic Manager',
            post: 'ADMIN',
            role: 'ADMIN',
          },
        });
        this.logger.log('Default admin user (username: acd@123, password: acd@123) automatically created.');
      }
    } catch (err: any) {
      this.logger.warn(`User bootstrap sync note: ${err.message}`);
    }
  }

  async login(username: string, password: string) {
    const trimmedUsername = (username || '').trim();
    let user = await this.prisma.user.findUnique({
      where: { username: trimmedUsername },
    });

    // If user not found in PostgreSQL, check Google Sheets Login tab dynamically
    if (!user) {
      const sheetUser = await this.googleSheetsService.fetchUserFromSheet(trimmedUsername);
      if (sheetUser && sheetUser.password === password) {
        const passwordHash = await bcrypt.hash(password, 10);
        user = await this.prisma.user.create({
          data: {
            username: sheetUser.username,
            passwordHash,
            name: sheetUser.name || sheetUser.username,
            email: sheetUser.email,
            mobile: sheetUser.mobile,
            post: sheetUser.post,
            role: sheetUser.post === 'ADMIN' ? 'ADMIN' : 'STAFF',
          },
        });
        this.logger.log(`Created & authenticated user "${trimmedUsername}" from Google Sheet credentials.`);
      }
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password against bcrypt hash or plaintext fallback
    let isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid && user.passwordHash === password) {
      // Plain text match from initial sync: upgrade to bcrypt hash in PostgreSQL
      isPasswordValid = true;
      const newHash = await bcrypt.hash(password, 10);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });
    }

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        refreshToken: tokens.refreshToken,
      },
    });

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