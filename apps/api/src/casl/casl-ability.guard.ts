import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSION_KEY,
  RequiredPermission,
} from '../auth/decorators/require-permission.decorator';
import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator';
import { CaslAbilityFactory } from './casl-ability.factory';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class CaslAbilityGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // Get required permission from decorator
    const requiredPermission =
      this.reflector.getAllAndOverride<RequiredPermission>(PERMISSION_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    // No @RequirePermission decorator = just authenticated is enough
    if (!requiredPermission) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (!user?.sub) {
      throw new ForbiddenException('No tiene permisos para esta acción');
    }

    const ability = await this.caslAbilityFactory.createForUser(user.sub);

    if (!ability.can(requiredPermission.action, requiredPermission.subject)) {
      throw new ForbiddenException('No tiene permisos para esta acción');
    }

    return true;
  }
}
