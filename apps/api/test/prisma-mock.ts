import { PrismaService } from '../src/prisma/prisma.service';

export type MockPrismaService = {
  [K in keyof PrismaService]: jest.Mocked<Record<string, jest.Mock>>;
};

export const createMockPrismaService = (): MockPrismaService => {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop) {
      if (prop === 'then') return undefined;
      if (typeof prop === 'symbol') return undefined;
      if (!_target[prop as string]) {
        _target[prop as string] = new Proxy(
          {},
          {
            get(modelTarget, modelProp) {
              if (typeof modelProp === 'symbol') return undefined;
              if (!modelTarget[modelProp as string]) {
                modelTarget[modelProp as string] = jest.fn();
              }
              return modelTarget[modelProp as string];
            },
          },
        );
      }
      return _target[prop as string];
    },
  };

  return new Proxy({}, handler) as unknown as MockPrismaService;
};
