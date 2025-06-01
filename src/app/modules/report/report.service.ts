import { Payment } from '../payment/payment.model';
import { User } from '../user/user.model';

const userReport = async () => {
    const result = await User.aggregate([
        {
            $match: { role: 'USER' },
        },
        {
            $lookup: {
                from: 'payments',
                let: { userIdStr: { $toString: '$_id' } },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$userId', '$$userIdStr'],
                            },
                        },
                    },
                ],
                as: 'payments',
            },
        },
        {
            $match: {
                'payments.0': { $exists: true },
            },
        },
        {
            $project: {
                name: 1,
                status: 1,
                joiningDate: '$createdAt',
                parcelSent: { $size: '$payments' },
            },
        },
    ]);

    return result;
};

const riderReport = async () => {
    const result = await Payment.aggregate([
        // Step 1: Convert deliveryId to ObjectId
        {
            $addFields: {
                deliveryId: { $toObjectId: "$deliveryId" }
            }
        },
        // Step 2: Lookup delivery
        {
            $lookup: {
                from: "deliveries",
                localField: "deliveryId",
                foreignField: "_id",
                as: "delivery"
            }
        },
        {
            $unwind: "$delivery"
        },
        // Step 3: Filter only delivered deliveries
        {
            $match: {
                "delivery.status": "DELIVERED"
            }
        },
        // Step 5: Convert delivery.rider to ObjectId
        {
            $addFields: {
                "delivery.rider": { $toObjectId: "$delivery.rider" }
            }
        },
        // Step 6: Lookup rider info
        {
            $lookup: {
                from: "users", // or 'riders' if your rider collection has a different name
                localField: "delivery.rider",
                foreignField: "_id",
                as: "rider"
            }
        },

        // Step 7: Unwind rider
        {
            $unwind: "$rider"
        },

        // Step 8: Lookup total deliveries by this rider (with status DELIVERED)
        {
            $lookup: {
                from: "deliveries",
                let: { riderId: "$delivery.rider" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$rider", "$$riderId"] },
                                    { $eq: ["$status", "DELIVERED"] }
                                ]
                            }
                        }
                    },
                    { $count: "deliveredCount" }
                ],
                as: "riderDelivered"
            }
        },

        // Step 9: Flatten deliveredCount result
        {
            $addFields: {
                deliveredCount: {
                    $ifNull: [{ $arrayElemAt: ["$riderDelivered.deliveredCount", 0] }, 0]
                }
            }
        },

        // Step 10: Final projection
        {
            $project: {
                _id: 0,
                transactionId: 1,
                amountPaid: 1,
                paidAt: 1,
                status: 1,
                "riderName": "$rider.name",
                "riderStatus": "$rider.status",
                "riderJoinedAt": "$rider.createdAt",
                "deliveredParcelCount": "$deliveredCount"
            }
        }

    ]);

    return result;
};



export const ReportServices = {
    userReport,
    riderReport,
};
