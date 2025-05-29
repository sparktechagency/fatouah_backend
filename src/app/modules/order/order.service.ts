import { JwtPayload } from "jsonwebtoken";
import { IOrder } from "./order.interface";
import { Order } from "./order.model";
import { Delivery } from "../delivery/delivery.model";

const CHARGE_PER_KM = 2;

function getDistanceFromLatLonInKm(coord1: [number, number], coord2: [number, number]): number {
    const toRad = (value: number) => (value * Math.PI) / 180;

    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;

    const R = 6371; // Radius of earth in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export const createParcelOrderToDB = async (user: JwtPayload, payload: IOrder) => {
    // calculate distance  using pickupLocation and destinationLocation coordinates
    const distance = getDistanceFromLatLonInKm(
        payload.pickupLocation.coordinates,
        payload.destinationLocation.coordinates
    );

    // calculate delivery charge based on distance
    const deliveryCharge = distance * CHARGE_PER_KM;

    // create order with calculated distance and deliveryCharge
    const order = await Order.create({
        ...payload,
        user: user.id,
        distance,
        deliveryCharge,
    });

    const delivery = await Delivery.create({
        order: order._id,
        status: "REQUESTED",
    });

    return { order, delivery };
};

export const OrderServices = {
    createParcelOrderToDB,
}