import { Schema } from "mongoose"

export type IDelivery = {
    order: Schema.Types.ObjectId;
    rider: Schema.Types.ObjectId;
    status: "REQUESTED" | "ASSIGNED" | "ARRIVED" | "PICKED" | "STARTED" | "DELIVERED";
    timestamps: {
        assignedAt: string;
        arrivedAt: string;
        pickedAt: string;
        startedAt: string;
        deliveredAt: string;
    };
    attempts: [
        rider: Schema.Types.ObjectId,
        attemptedAt: string,
    ];
}