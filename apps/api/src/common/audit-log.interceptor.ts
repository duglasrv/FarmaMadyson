import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;

    // Only audit mutating requests
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const user = req.user;
    if (!user) return next.handle();

    const path = req.route?.path || req.url;
    const action = this.methodToAction(method);
    const resource = this.extractResource(path);

    return next.handle().pipe(
      tap({
        next: () => {
          this.prisma.auditLog
            .create({
              data: {
                userId: user.id,
                action,
                resource,
                resourceId: req.params?.id || null,
                newData: method === 'DELETE' ? undefined : (req.body || undefined),
                ipAddress: req.ip,
                userAgent: req.headers?.['user-agent'] || null,
              },
            })
            .catch(() => {
              // Non-blocking — don't fail the request if audit fails
            });
        },
      }),
    );
  }

  private methodToAction(method: string): string {
    switch (method) {
      case 'POST':
        return 'CREATE';
      case 'PUT':
      case 'PATCH':
        return 'UPDATE';
      case 'DELETE':
        return 'DELETE';
      default:
        return method;
    }
  }

  private extractResource(path: string): string {
    // /api/products/:id → products
    const segments = path.replace(/^\/api\//, '').split('/');
    return segments[0] || 'unknown';
  }
}
