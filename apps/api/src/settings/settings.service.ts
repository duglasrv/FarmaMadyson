import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertSettingDto } from './dto/upsert-setting.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(group?: string) {
    const where = group ? { group } : {};
    const settings = await this.prisma.setting.findMany({
      where,
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });

    // Group settings by group name
    const grouped: Record<string, Record<string, any>> = {};
    for (const s of settings) {
      if (!grouped[s.group]) grouped[s.group] = {};
      grouped[s.group]![s.key] = s.value;
    }

    return grouped;
  }

  async findPublic() {
    // Only return settings safe for public consumption
    const publicGroups = ['general', 'store'];
    const settings = await this.prisma.setting.findMany({
      where: { group: { in: publicGroups } },
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });

    const result: Record<string, any> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  }

  async upsertMany(items: UpsertSettingDto[]) {
    const results = await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.setting.upsert({
          where: { key: item.key },
          update: { value: item.value, group: item.group },
          create: {
            key: item.key,
            value: item.value,
            group: item.group ?? 'general',
          },
        }),
      ),
    );
    return results;
  }
}
