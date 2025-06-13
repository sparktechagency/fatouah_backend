import { Schema, model, Types } from 'mongoose';

const NotificationSchema = new Schema(
  {
    title: {
      type: String,
    },
    receiver: {
      type: Types.ObjectId,
      ref: 'User',
    },
    read: {
      type: Boolean,
      required: true,
      default: false,
    },
    riderId: {
      type: String,
      required: true,
    },
    orderId: {
      type: String,
      required: true,
    },
    sender: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
    delivery: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

NotificationSchema.index({ 'geoLocation.geoLocation': '2dsphere' });

export const Notification = model('Notification', NotificationSchema);
