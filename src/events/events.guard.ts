import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class EventsGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // Check if the authorization header exists and starts with "Bearer "
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Bearer token is present
      return true;
    } else {
      // Bearer token is not present
      return false;
    }
  }
}
