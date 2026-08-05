import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import {
  SalesInvoiceModel, JournalEntryModel, CollectionModel,
} from './entities/billing.model';
import { WCCModel } from '../wcc/entities/wcc.model';
import { ContractModel } from '../../workflow/contracts/entities/contract.model';

@Module({
  imports: [
    SalesInvoiceModel, JournalEntryModel, CollectionModel,
    WCCModel, ContractModel,
  ],
  providers: [InvoicesService],
  controllers: [InvoicesController],
  exports: [InvoicesService, SalesInvoiceModel, JournalEntryModel, CollectionModel],
})
export class InvoicesModule {}
