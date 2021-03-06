import { AbstractVehicle, VEHICLE, VehicleType } from "@vehicle-manager/api";

import { DatabaseCrudService } from "./database-service";
import { createDatabase } from "./utils";
import { ModelConstraits, validate, ValidationError } from "./validation";

const db = createDatabase<AbstractVehicle>(VEHICLE);

export const VehicleConstraints: ModelConstraits<AbstractVehicle> = {
  chassisSeries: {
    presence: true,
    format: {
      pattern: /[a-zA-Z0-9\-]+$/,
      message: "^%{num} is not a valid chassis series",
    },
  },
  chassisNumber: {
    presence: true,
    numericality: {
      onlyInteger: true,
      greaterThanOrEqualTo: 0,
    },
  },
};

class VehicleService extends DatabaseCrudService<AbstractVehicle> {
  constructor() {
    super(db);
  }

  protected async beforeCreate(data: AbstractVehicle) {
    await validate(data, VehicleConstraints);

    const vehiclesWithTheSameChassisId = await this.find({
      chassisSeries: data.chassisSeries,
      chassisNumber: data.chassisNumber,
    });

    if (vehiclesWithTheSameChassisId.length) {
      throw new ValidationError({ chassisId: "Already exists" });
    }

    switch (data.type) {
      case VehicleType.TRUCK:
        return { ...data, numberOfPassengers: 1 };
      case VehicleType.BUS:
        return { ...data, numberOfPassengers: 42 };
      case VehicleType.CAR:
        return { ...data, numberOfPassengers: 4 };
      default:
        throw new ValidationError({ type: "Type unknown" });
    }

  }

  protected async beforeUpdate(before: AbstractVehicle, { color, ...data }: AbstractVehicle) {
    const nonEditableAttributes = Object.keys(data);

    if (nonEditableAttributes.length) {
      const errors: Record<string, string> = {};
      for (const attr of nonEditableAttributes) {
        errors[attr] = "Can not be changed";
      }
      throw new ValidationError({ errors });
    }

    const vehicle = { ...before, color };

    await validate(vehicle, VehicleConstraints);

    return vehicle;
  }
}

export const vehicleService = new VehicleService();
