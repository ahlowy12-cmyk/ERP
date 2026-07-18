import { Global, Module } from '@nestjs/common';
import { NumberingService } from './services/numbering.service';
import { InventoryEngineService } from './services/inventory-engine.service';
import { CounterModel } from './models/counter.model';
import { AuditLogModel } from './audit-logs/entities/audit-log.model';
import { AuditLogService } from './audit-logs/audit-logs.service';
import { AuditLogsRepository } from './audit-logs/audit-logs.repository';
// استيراد الموديولات التي تحتوي على المستودعات المطلوبة لمحرك المخزون
import { ItemsModule } from 'src/modules/inventory/items/items.module';
import { ReportsModule } from 'src/modules/inventory/reports/reports.module';

@Global() // هام جداً: هذا الديكوريتور يجعل الخدمات متاحة في كل المشروع دون الحاجة لاستيراد الموديول في كل مرة
@Module({
  imports: [
    CounterModel,
    AuditLogModel,
    ItemsModule, // لكي نتمكن من حقن InventoryItemRepository
    ReportsModule, // لكي نتمكن من حقن ItemLedgerRepository
  ],
  providers: [NumberingService, InventoryEngineService, AuditLogService, AuditLogsRepository],
  exports: [
    NumberingService,
    InventoryEngineService,
    CounterModel,
    AuditLogModel,
    AuditLogService,
    AuditLogsRepository,
  ],
})
export class SharedModule {}
