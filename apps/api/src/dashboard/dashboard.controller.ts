import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @RequirePermission('report', 'view_sales')
  getFullDashboard() {
    return this.dashboardService.getFullDashboard();
  }

  @Get('kpis')
  @RequirePermission('report', 'view_sales')
  getKpis() {
    return this.dashboardService.getKpis();
  }

  @Get('sales-chart')
  @RequirePermission('report', 'view_sales')
  getSalesChart() {
    return this.dashboardService.getSalesChart();
  }

  @Get('top-products')
  @RequirePermission('report', 'view_sales')
  getTopProducts() {
    return this.dashboardService.getTopProducts();
  }

  @Get('orders-by-status')
  @RequirePermission('report', 'view_sales')
  getOrdersByStatus() {
    return this.dashboardService.getOrdersByStatus();
  }
}
