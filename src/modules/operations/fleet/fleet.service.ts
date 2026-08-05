import {
  Injectable, NotFoundException, BadRequestException, ConflictException, Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VehicleModelName, TripModelName } from './entities/fleet.model';

@Injectable()
export class FleetService {
  private readonly logger = new Logger(FleetService.name);

  constructor(
    @InjectModel(VehicleModelName) private vehicleModel: Model<any>,
    @InjectModel(TripModelName) private tripModel: Model<any>,
  ) {}

  // ── VEHICLES ──────────────────────────────────────────────────────────────
  async getVehicles(query: { status?: string; projectCode?: string; type?: string }) {
    const filter: any = {};
    if (query.status)      filter.status              = query.status;
    if (query.projectCode) filter.currentProjectCode  = query.projectCode;
    if (query.type)        filter.type                = query.type;
    return this.vehicleModel.find(filter).sort({ createdAt: -1 }).lean();
  }

  async createVehicle(dto: any, userId: string) {
    const exists = await this.vehicleModel.findOne({
      $or: [{ vehicleCode: dto.vehicleCode }, { plateNumber: dto.plateNumber }],
    });
    if (exists) {
      throw new ConflictException(
        exists.vehicleCode === dto.vehicleCode
          ? `Vehicle code "${dto.vehicleCode}" already exists`
          : `Plate number "${dto.plateNumber}" already exists`,
      );
    }
    return this.vehicleModel.create({ ...dto, createdBy: new Types.ObjectId(userId) });
  }

  async getVehicle(id: string) {
    const v = await this.vehicleModel.findById(id).lean();
    if (!v) throw new NotFoundException('Vehicle not found');
    return v;
  }

  async updateVehicleStatus(id: string, status: string) {
    const v = await this.vehicleModel.findByIdAndUpdate(id, { $set: { status } }, { new: true }).lean();
    if (!v) throw new NotFoundException('Vehicle not found');
    return v;
  }

  // ── TRIPS ─────────────────────────────────────────────────────────────────
  async getTrips(query: { vehicleId?: string; projectCode?: string; status?: string }) {
    const filter: any = {};
    if (query.vehicleId)   filter.vehicleId   = new Types.ObjectId(query.vehicleId);
    if (query.projectCode) filter.projectCode = query.projectCode;
    if (query.status)      filter.status      = query.status;
    return this.tripModel.find(filter).sort({ startDate: -1 }).lean();
  }

  async createTrip(dto: any, userId: string) {
    const vehicle = await this.vehicleModel.findById(dto.vehicleId);
    if (!vehicle) throw new NotFoundException(`Vehicle "${dto.vehicleId}" not found`);
    if (vehicle.status === 'Maintenance') {
      throw new BadRequestException(`Vehicle "${vehicle.vehicleCode}" is under maintenance`);
    }

    const trip = await this.tripModel.create({
      vehicleId: new Types.ObjectId(dto.vehicleId),
      vehicleCode: vehicle.vehicleCode,
      plateNumber: vehicle.plateNumber,
      projectId: dto.projectId ? new Types.ObjectId(dto.projectId) : null,
      projectCode: dto.projectCode || null,
      costCenterCode: dto.costCenterCode || null,
      driverName: dto.driverName,
      startLocation: dto.startLocation,
      endLocation: dto.endLocation,
      startDate: new Date(dto.startDate),
      startOdometer: dto.startOdometer,
      purpose: dto.purpose || '',
      status: 'In Progress',
      createdBy: new Types.ObjectId(userId),
    });

    // Update vehicle status
    await this.vehicleModel.findByIdAndUpdate(dto.vehicleId, { $set: { status: 'In Use' } });

    this.logger.log(`Trip created: ${vehicle.vehicleCode} → ${dto.startLocation} to ${dto.endLocation}`);
    return trip;
  }

  async completeTrip(id: string, dto: { endOdometer: number; endDate?: string }) {
    const trip = await this.tripModel.findById(id);
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.status === 'Completed') throw new BadRequestException('Trip already completed');

    if (dto.endOdometer < trip.startOdometer) {
      throw new BadRequestException(
        `End odometer (${dto.endOdometer}) cannot be less than start odometer (${trip.startOdometer})`,
      );
    }

    const distance = dto.endOdometer - trip.startOdometer;
    const endDate  = dto.endDate ? new Date(dto.endDate) : new Date();

    const updated = await this.tripModel.findByIdAndUpdate(
      id,
      { $set: { endOdometer: dto.endOdometer, distance, endDate, status: 'Completed' } },
      { new: true },
    ).lean();

    // Update vehicle odometer and status
    await this.vehicleModel.findByIdAndUpdate(trip.vehicleId, {
      $set: { currentOdometer: dto.endOdometer, status: 'Available' },
    });

    this.logger.log(`Trip completed: ${trip.vehicleCode}, distance: ${distance}km`);
    return updated;
  }
}
