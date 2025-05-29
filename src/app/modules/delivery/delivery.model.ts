import { Schema, model } from 'mongoose';
import { IDelivery } from './delivery.interface';

const deliverySchema = new Schema<IDelivery>({
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    rider: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
        type: String,
        enum: ['REQUESTED', 'ASSIGNED', 'ARRIVED', 'PICKED', 'STARTED', 'DELIVERED'],
        default: 'REQUESTED',
    },
    timestamps: {
        assignedAt: Date,
        arrivedAt: Date,
        pickedAt: Date,
        startedAt: Date,
        deliveredAt: Date,
    },

    attempts: [{
        rider: { type: Schema.Types.ObjectId, ref: 'User' },
        attemptedAt: { type: Date, default: Date.now },
    }]
}, {
    timestamps: true,
});

export const Delivery = model('Delivery', deliverySchema);
