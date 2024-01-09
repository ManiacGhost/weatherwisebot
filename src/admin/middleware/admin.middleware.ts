import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

type JwtPayload = {
  UserInfo: {
    username: string;
    roles: {
      User?: number;
      Editor?: number;
      Admin?: number;
    };
  };
} & jwt.JwtPayload;

@Injectable()
export class AdminMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}
  use(req: Request, res: Response, next: NextFunction) {
    const token: string =
      (req.headers.authorization as string) ||
      (req.headers.Authorization as string);
    if (!token) {
      return res.status(400).json({ message: 'Unauthorized' });
    }

    try {
      const decoded: JwtPayload = this.jwtService.verify(token, {
        secret: process.env.ACCESS_TOKEN_SECRET,
      });
      req['user'] = decoded.UserInfo.username;
      // Object.defineProperty(req, "roles", decoded.UserInfo.roles);
      req['roles'] = decoded.UserInfo.roles;

      next();
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
}
