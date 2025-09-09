// REQUEST
{
    "_id": "68bbc4e7669b954b6bfdb02a",
    "order": {
        "pickupLocation": {
            "type": "Point",
            "address": "Qasba",
            "coordinates": [
                90.4125,
                23.8103
            ]
        },
        "destinationLocation": {
            "type": "Point",
            "address": "456 Secondary Road, Chittagong",
            "coordinates": [
                91.7832,
                22.3569
            ]
        },
        "_id": "68bbc4e7669b954b6bfdb028",
        "orderId": "ORD-20250906-0002",
        "user": "684d42a9dda3398c4bba2943",
        "receiversName": "Emam Bokhari",
        "receiversImage": "",
        "contact": "01915842073",
        "additionalInformation": "This is test, and time is 05:49PM date 9-4-2025",
        "parcelType": "DOCUMENTS",
        "parcelValue": 1500,
        "minParcelWeight": 1.2,
        "maxParcelWeight": 3.2,
        "ride": "BIKE",
        "distance": 213.95,
        "deliveryCharge": 641.85,
        "commissionAmount": 64.19,
        "riderAmount": 577.66,
        "createdAt": "2025-09-06T05:21:43.937Z",
        "updatedAt": "2025-09-06T05:21:43.937Z"
    },
    "orderId": "ORD-20250906-0002",
    "status": "REQUESTED",
    "attempts": [],
    "createdAt": "2025-09-06T05:21:43.984Z",
    "updatedAt": "2025-09-06T05:21:43.984Z",
    "__v": 0
}

// ORDER DETAILS
{
    "success": true,
    "message": "Order details are retrieved successfully",
    "data": {
        "_id": "686f40fb1df1bd74f243b1eb",
        "orderId": "ORD-20250710-0001",
        "pickupLocation": {
            "type": "Point",
            "address": "Qasba",
            "coordinates": [
                90.4125,
                23.8103
            ]
        },
        "destinationLocation": {
            "type": "Point",
            "address": "456 Secondary Road, Chittagong",
            "coordinates": [
                91.7832,
                22.3569
            ]
        },
        "receiversName": "Jowel Ahmed",
        "contact": "01915842073",
        "parcelType": "DOCUMENTS",
        "parcelValue": 1500,
        "ride": "BIKE",
        "distance": 213.95,
        "deliveryCharge": 641.85,
        "commissionAmount": 64.19,
        "riderAmount": 577.66,
        "rider": {
            "trips": 0,
            "rating": {
                "average": null
            }
        },
        "status": "unknown",
        "createdAt": "2025-07-10T04:26:35.687Z",
        "payment": {},
        "deliveryInfo": {
            "status": "REQUESTED"
        }
    }
}
