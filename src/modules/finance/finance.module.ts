import { Module } from '@nestjs/common';

// ─── Entities ────────────────────────────────────────────────────────────────
import { ChartOfAccountModel } from './entities/coa.model';
import { SupplierInvoiceModel, PaymentVoucherModel } from './entities/ap.model';
import {
  BankAccountModel,
  CashAccountModel,
  BankReconciliationModel,
} from './entities/cash-bank.model';
import { ProjectBudgetModel, CollectionVoucherModel } from './entities/budget.model';

// ─── Shared Models from other modules ────────────────────────────────────────
import {
  JournalEntryModel,
  SalesInvoiceModel,
} from '../billing/invoices/entities/billing.model';
import { EquipmentModel } from '../assets/equipment/entities/equipment.model';
import { ProjectModel } from '../projects/entities/project.model';

// ─── Services ────────────────────────────────────────────────────────────────
import { CoaService } from './coa/coa.service';
import { GlService } from './gl/gl.service';
import { ApService } from './ap/ap.service';
import { ArService } from './ar/ar.service';
import { CashBankService } from './cash-bank/cash-bank.service';
import { BudgetService } from './budget/budget.service';
import { DepreciationService } from './depreciation/depreciation.service';
import { VatService } from './vat/vat.service';
import { StatementsService } from './statements/statements.service';

// ─── Controllers ─────────────────────────────────────────────────────────────
import { CoaController } from './coa/coa.controller';
import { GlController } from './gl/gl.controller';
import { ApController } from './ap/ap.controller';
import { ArController } from './ar/ar.controller';
import { CashBankController } from './cash-bank/cash-bank.controller';
import { BudgetController } from './budget/budget.controller';
import { DepreciationController } from './depreciation/depreciation.controller';
import { VatController } from './vat/vat.controller';
import { StatementsController } from './statements/statements.controller';

@Module({
  imports: [
    // Finance-owned models
    ChartOfAccountModel,
    SupplierInvoiceModel,
    PaymentVoucherModel,
    BankAccountModel,
    CashAccountModel,
    BankReconciliationModel,
    ProjectBudgetModel,
    CollectionVoucherModel,

    // Cross-module shared models
    JournalEntryModel,
    SalesInvoiceModel,
    EquipmentModel,
    ProjectModel,
  ],
  providers: [
    CoaService,
    GlService,
    ApService,
    ArService,
    CashBankService,
    BudgetService,
    DepreciationService,
    VatService,
    StatementsService,
  ],
  controllers: [
    CoaController,
    GlController,
    ApController,
    ArController,
    CashBankController,
    BudgetController,
    DepreciationController,
    VatController,
    StatementsController,
  ],
  exports: [
    CoaService,
    GlService,
    ApService,
    ArService,
    CashBankService,
    BudgetService,
    DepreciationService,
    VatService,
    StatementsService,
    // Exported models for other modules
    ChartOfAccountModel,
    SupplierInvoiceModel,
    PaymentVoucherModel,
    BankAccountModel,
    CashAccountModel,
    CollectionVoucherModel,
    ProjectBudgetModel,
  ],
})
export class FinanceModule {}
