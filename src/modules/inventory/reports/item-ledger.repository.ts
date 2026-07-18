import { Injectable } from '@nestjs/common';
import { AbstractRepository } from 'src/DB/repositories/abstract.repository';
import {
  ItemLedgerDocument,
  ItemLedgerModelName,
} from './entities/item-ledger.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class ItemLedgerRepository extends AbstractRepository<ItemLedgerDocument> {
  constructor(
    @InjectModel(ItemLedgerModelName) ItemLedger: Model<ItemLedgerDocument>,
  ) {
    super(ItemLedger);
  }
}
