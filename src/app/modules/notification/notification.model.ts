import { Schema, model, Types } from 'mongoose';

enum NotificationType {
  ADMIN = 'ADMIN',
  SYSTEM = 'SYSTEM',
  PAYMENT = 'PAYMENT',
  MESSAGE = 'MESSAGE',
  REFUND = 'REFUND',
  ALERT = 'ALERT',
  ORDER = 'ORDER',
  DELIVERY = 'DELIVERY',
  CANCELLED = 'CANCELLED',
}

const notificationSchema = new Schema(
  {
    title: {
      type: String,
    },
    message: {
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
    delivery: { type: Schema.Types.Mixed },
    type: {
      type: String,
      enum: Object.values(NotificationType),
    },

    data: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

notificationSchema.index({ 'geoLocation.geoLocation': '2dsphere' });

export const Notification = model('Notification', notificationSchema);
