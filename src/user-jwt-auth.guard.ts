import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class UserJwtAuthGuard implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies.user_jwt;

    if (token) {
      try {
        const decodedValue = await jwt.verify(token, process.env.JWT_SECRET);
        res.locals.user = decodedValue;
        console.log(decodedValue);
        next();
      } catch (error) {
        res.redirect('/views/users/login')
        throw new UnauthorizedException('Invalid or expired token');
      }
    } else {
      res.redirect('/views/users/login')
      throw new UnauthorizedException('Token not found');
    }
  }
}
