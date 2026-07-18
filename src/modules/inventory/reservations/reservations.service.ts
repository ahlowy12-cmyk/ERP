import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ReservationsRepository } from './reservations.repository';
import { NumberingService } from 'src/shared/services/numbering.service';
import { InventoryEngineService } from 'src/shared/services/inventory-engine.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly _ReservationsRepository: ReservationsRepository,
    private readonly _NumberingService: NumberingService,
    private readonly _InventoryEngineService: InventoryEngineService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  // 1. إنشاء طلب الحجز (Draft/Pending)
  async createReservation(data: CreateReservationDto) {
    // 💡 يفترض إضافة دالة generateReservationNumber في NumberingService لتوليد RSV-YYYY-NNN
    const seqNum = await this._NumberingService.generateMIVNumber(); // Placeholder
    const reservationNumber = seqNum.replace('MIV', 'RSV');

    let totalValue = 0;
    data.items.forEach((item: any) => {
      totalValue += item.requestedQuantity * item.unitPrice;
    });

    const reservation = await this._ReservationsRepository.create({
      ...data,
      reservationNumber,
      totalValue,
      status: 'Pending',
    });

    return {
      message: 'Reservation request created successfully',
      data: reservation,
    };
  }

  // 2. الموافقة على الحجز وتطبيق حجز المخزون فعلياً (Approve)
  async approveReservation(reservationId: string) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const reservation = await this._ReservationsRepository.findOne({
        filter: { _id: reservationId },
        options: { session },
      });
      if (!reservation) throw new NotFoundException('Reservation not found');
      if (reservation.status !== 'Pending')
        throw new BadRequestException('Reservation is not in Pending status');

      let allReserved = true;

      // تطبيق الحجز لكل صنف من خلال محرك المخزون
      for (const item of reservation.items) {
        try {
          // نحاول حجز الكمية المطلوبة بالكامل
          await this._InventoryEngineService.reserveStock(
            item.itemCode,
            item.requestedQuantity,
            session,
          );
          item.reservedQuantity = item.requestedQuantity;
        } catch (error) {
          // إذا لم تتوفر الكمية بالكامل، سنحجز المتاح فقط أو نتركه 0 (حسب قواعد الشركة)
          // هنا للتبسيط، نعتبر أنه لم يحجز هذا الصنف بالكامل
          allReserved = false;
          item.reservedQuantity = 0;
        }
      }

      reservation.status = allReserved ? 'Approved' : 'Partially Reserved';
      await reservation.save({ session });

      await session.commitTransaction();
      return {
        message: `Reservation processed with status: ${reservation.status}`,
        data: reservation,
      };
    } catch (error) {
      await session.abortTransaction();
      throw new InternalServerErrorException(
        `Failed to approve reservation: ${error.message}`,
      );
    } finally {
      session.endSession();
    }
  }

  // 3. تحرير/إلغاء الحجز (Release)
  async releaseReservation(reservationId: string) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const reservation = await this._ReservationsRepository.findOne({
        filter: { _id: reservationId },
        options: { session },
      });
      if (!reservation) throw new NotFoundException('Reservation not found');
      if (
        reservation.status === 'Released' ||
        reservation.status === 'Cancelled'
      ) {
        throw new BadRequestException(
          'Reservation is already released or cancelled',
        );
      }

      // فك الحجز من محرك المخزون للأصناف التي تم حجزها فعلياً
      for (const item of reservation.items) {
        if (item.reservedQuantity > 0) {
          await this._InventoryEngineService.releaseStock(
            item.itemCode,
            item.reservedQuantity,
            session,
          );
          item.reservedQuantity = 0;
        }
      }

      reservation.status = 'Released';
      await reservation.save({ session });

      await session.commitTransaction();
      return {
        message: 'Reservation released successfully',
        data: reservation,
      };
    } catch (error) {
      await session.abortTransaction();
      throw new InternalServerErrorException(
        `Failed to release reservation: ${error.message}`,
      );
    } finally {
      session.endSession();
    }
  }
}
