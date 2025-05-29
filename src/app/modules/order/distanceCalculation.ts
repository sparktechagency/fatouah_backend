import axios from 'axios';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

interface DistanceMatrixResponse {
    distance: number; // meters
    duration: number; // seconds
}

async function getDistanceAndDurationFromGoogle(
    origin: [number, number],
    destination: [number, number]
): Promise<DistanceMatrixResponse> {
    // google expects: origin and destination as "lat,lng" string
    const originStr = `${origin[1]},${origin[0]}`; // lat,lng
    const destinationStr = `${destination[1]},${destination[0]}`;

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${originStr}&destinations=${destinationStr}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await axios.get(url);
    const data = response.data;

    if (data.status !== 'OK') {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Google Distance Matrix API error: ' + data.error_message);
    }

    const element = data.rows[0].elements[0];

    if (element.status !== 'OK') {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'No route found between origin and destination.');
    }

    return {
        distance: element.distance.value, // in meters
        duration: element.duration.value, // in seconds
    };
}
