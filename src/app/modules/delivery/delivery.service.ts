import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import { IOrder } from "../order/order.interface";
import { User } from "../user/user.model";
import { Delivery } from "./delivery.model";

// find nearest riders
const findNearestOnlineRiders = async (location: { coordinates: [number, number] }) => {
    return await User.find({
        role: 'RIDER',
        isOnline: true,
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: location.coordinates,
                },
                $maxDistance: 5000, // 5 km radius
            }
        }
    });
};

// assign rider logic with fallback
const assignRiderWithTimeout = async (deliveryId: string) => {
    const delivery = await Delivery.findById(deliveryId).populate<{ order: IOrder }>('order');

    if (!delivery || !delivery.order) throw new ApiError(StatusCodes.BAD_REQUEST, 'Delivery not found');

    const attemptedRiders = delivery.attempts.map(a => a.rider.toString());

    const riders = await findNearestOnlineRiders(delivery.order.pickupLocation);
    const nextRider = riders.find(r => !attemptedRiders.includes(r._id.toString()));

    if (!nextRider) throw new ApiError(StatusCodes.BAD_REQUEST, 'No available rider');

    delivery.rider = nextRider._id;
    delivery.status = 'ASSIGNED';
    delivery.timestamps.assignedAt = new Date();
    delivery.attempts.push({
        rider: nextRider._id,
        attemptedAt: new Date(),
    });
    await delivery.save();

    // start 1-minute fallback timer (without socket.io)
    setTimeout(async () => {
        const updatedDelivery = await Delivery.findById(deliveryId);

        if (updatedDelivery?.status === 'ASSIGNED') {
            // rider didn’t accept yet
            updatedDelivery.rider = undefined;
            updatedDelivery.status = 'REQUESTED';
            await updatedDelivery.save();

            // re-run assignment
            await assignRiderWithTimeout(deliveryId);
        }
    }, 60000); // 1 minute

    return delivery;
};

// service to re-assign delivery when rider rejects
const rejectDeliveryByRider = async (deliveryId: string, riderId: string) => {
    const delivery = await Delivery.findById(deliveryId);

    if (!delivery) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Delivery not found");
    }

    // check if the rider is the currently assigned rider
    if (delivery.rider?.toString() !== riderId) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "You are not assigned to this delivery");
    }

    // set delivery status back to REQUESTED
    delivery.status = "REQUESTED";

    // remove current rider assignment
    delivery.rider = undefined;

    // save updated delivery
    await delivery.save();

    // re-run rider assignment logic (assign nearest rider)
    await assignRiderWithTimeout(deliveryId);

    return delivery;
};

const cancelDeliveryByUser = async (deliveryId: string, userId: string) => {

    const delivery = await Delivery.findById(deliveryId).populate<{ order: IOrder }>('order');

    if (!delivery) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Delivery not found');
    }

    //  check if only the owner of the order (user) can cancel the delivery:
    if (delivery.order?.user.toString() !== userId) {
        throw new ApiError(StatusCodes.FORBIDDEN, 'You are not authorized to cancel this delivery');
    }

    // Cancel only if the delivery is not already delivered or cancelled:
    if (delivery.status === 'DELIVERED' || delivery.status === 'CANCELLED') {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Cannot cancel delivered or already cancelled delivery');
    }

    delivery.status = 'CANCELLED';
    delivery.timestamps.cancelledAt = new Date();

    await delivery.save();

    // @ts-ignore
    const io = global.io;
    if (io) {
        io.emit(`delivery-status::${deliveryId}`, {
            deliveryId,
            status: 'CANCELLED',
        });
    }

    return delivery;
};



const getDeliveryDetails = async (deliveryId: string) => {
    const delivery = await Delivery.findById(deliveryId).populate('order');

    if (!delivery) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Delivery not found");
    }

    return delivery;
};

const acceptDeliveryByRider = async (deliveryId: string, riderId: string) => {
    const delivery = await Delivery.findById(deliveryId);

    if (!delivery) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Delivery not found");
    }

    if (delivery.status !== 'ASSIGNED' || delivery.rider?.toString() !== riderId) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Delivery cannot be accepted");
    }

    delivery.status = 'ACCEPTED';
    delivery.timestamps.acceptedAt = new Date();

    await delivery.save();

    return delivery;
};


const updateRiderLocation = async (
    deliveryId: string,
    riderId: string,
    coordinates: [number, number]
) => {
    const delivery = await Delivery.findById(deliveryId);

    if (!delivery) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Delivery not found");
    }

    if (delivery.rider?.toString() !== riderId) {
        throw new ApiError(StatusCodes.FORBIDDEN, "You are not assigned to this delivery");
    }

    // update rider current location in delivery
    delivery.riderCurrentLocation = {
        type: 'Point',
        coordinates,
    };

    await delivery.save();

    // emit live location update via socket
    //@ts-ignore
    const io = global.io;
    if (io) {
        io.emit(`location-update::${deliveryId}`, {
            deliveryId,
            coordinates,
        });
    }

    return delivery;
};



export const DeliveryServices = {
    findNearestOnlineRiders,
}