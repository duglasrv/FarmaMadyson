import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @RequirePermission('report', 'view_sales')
  getSalesReport(@Query() query: { from?: string; to?: string }) {
    return this.reportsService.getSalesReport(query);
  }

  @Get('inventory')
  @RequirePermission('report', 'view_sales')
  getInventoryReport() {
    return this.reportsService.getInventoryReport();
  }

  @Get('financial')
  @RequirePermission('report', 'view_sales')
  getFinancialReport(@Query() query: { from?: string; to?: string }) {
    return this.reportsService.getFinancialReport(query);
  }

  @Get('expiring')
  @RequirePermission('report', 'view_sales')
  getExpiringReport() {
    return this.reportsService.getExpiringReport();
  }
}
