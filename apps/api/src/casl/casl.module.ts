import { Module, Global } from '@nestjs/common';
import { CaslAbilityFactory } from './casl-ability.factory';
import { CaslAbilityGuard } from './casl-ability.guard';

@Global()
@Module({
  providers: [CaslAbilityFactory, CaslAbilityGuard],
  exports: [CaslAbilityFactory, CaslAbilityGuard],
})
export class CaslModule {}
