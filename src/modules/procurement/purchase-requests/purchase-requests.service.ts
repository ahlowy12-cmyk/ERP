import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { PurchaseRequestRepository } from './purchase-requests.repository';
import { CreatePurchaseRequestDto } from './dto/create-pr.dto';
import { NumberingService } from 'src/shared/services/numbering.service';
import { InventoryEngineService } from 'src/shared/services/inventory-engine.service';
import { MivsService } from 'src/modules/inventory/mivs/mivs.service';
import { FindPrsDto } from './dto/find-prs.dto';
@Injectable()
export class PurchaseRequestsService {
  constructor(
    private readonly _PRRepository: PurchaseRequestRepository,
    private readonly _NumberingService: NumberingService,
    private readonly _InventoryEngineService: InventoryEngineService,
    private readonly _MivsService: MivsService,
    @InjectConnection() private readonly connection: Connection,
  ) {}
  async create(data: CreatePurchaseRequestDto) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const documentNumber = await this._NumberingService.generatePRNumber(session);
      const procurementChain = 'PR';
      const chainId = documentNumber;

      const mivItemsToCreate: any[] = [];

      for (const item of data.items) {
        if (
          item.fulfillFromStock &&
          item.fulfillFromStock > 0 &&
          item.itemCode
        ) {
          await this._InventoryEngineService.deductStock(
            item.itemCode,
            item.fulfillFromStock,
            documentNumber,
            'MIV',
            session,
          );
          mivItemsToCreate.push(item);
        }
      }

      const purchaseRequest = await this._PRRepository.create(
        {
          ...data,
          prNumber: documentNumber,
          requestNumber: documentNumber,
          documentNumber: documentNumber,
          procurementChain,
          rootProcurementNumber: documentNumber,
          chainId,
        },
        { session },
      );

      // ✅ تم حل الـ TODO: إنشاء سند صرف للمواد المتوفرة فوراً
      if (mivItemsToCreate.length > 0) {
        await this._MivsService.createAutoFromPR(
          purchaseRequest,
          mivItemsToCreate,
          session,
        );
      }

      await session.commitTransaction();
      return {
        message: 'Purchase Request created successfully',
        data: purchaseRequest,
      };
    } catch (error) {
      await session.abortTransaction();
      throw new InternalServerErrorException(
        `Failed to create PR: ${error.message}`,
      );
    } finally {
      session.endSession();
    }
  }
  async updateStatus(id: string, status: string, approvedBy?: string) {
    const pr = await this._PRRepository.findOneAndUpdate(
      { _id: id },
      { status },
    );
    if (!pr) throw new NotFoundException('Purchase Request not found');
    return { message: `PR Status updated to ${status}`, data: pr };
  }

  // حذف طلب الشراء (مسودة فقط)
  async remove(id: string) {
    const pr = await this._PRRepository.findOne({ filter: { _id: id } });
    if (!pr) throw new NotFoundException('Purchase Request not found');

    if (pr.status !== 'Draft') {
      throw new BadRequestException(
        'Only Draft Purchase Requests can be deleted',
      );
    }

    await this._PRRepository.delete({ _id: id });
    return { message: 'Purchase Request deleted successfully' };
  }

  async findAll(query: FindPrsDto) {
    const filter: any = { isDeleted: { $ne: true } }; // تجاهل المحذوف

    if (query.status) filter.status = query.status;
    if (query.department) filter.department = query.department;

    if (query.search) {
      const searchRegex = { $regex: query.search, $options: 'i' };
      filter.$or = [
        { requestNumber: searchRegex },
        { department: searchRegex },
        { description: searchRegex },
        { costCenter: searchRegex },
      ];
    }

    const sortField = query.sortBy || 'requestNumber';
    const sortDirection = query.sortOrder === 'ASC' ? 1 : -1;

    return await this._PRRepository.findAll({
      filter,
      sort: { [sortField]: sortDirection },
      paginate: { page: query.page || 1, limit: query.limit || 20 },
    });
  }

  async findOne(id: string) {
    const pr = await this._PRRepository.findOne({ filter: { _id: id } });
    if (!pr) throw new NotFoundException('Purchase Request not found');
    return { data: pr };
  }
}
