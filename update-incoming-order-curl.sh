#!/bin/bash

# Curl request to update incoming order
# Order ID: 690f73d10f233cd4313cda6e
# Updates: Variety B 50kg quantity from 75 to 100, currentStockAtThatTime from 225 to 250

curl --location --request PUT 'http://localhost:3000/api/v1/base/incoming-orders/690f73d10f233cd4313cda6e' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
--data-raw '{
  "currentStockAtThatTime": 250,
  "varieties": [
    {
      "name": "Variety A",
      "bagSizes": [
        {
          "name": "50kg",
          "quantityInit": 100,
          "quantityCurr": 100,
          "approxWeight": 50.5,
          "floor": "F1",
          "row": "R1",
          "chamber": "C1"
        },
        {
          "name": "25kg",
          "quantityInit": 50,
          "quantityCurr": 50,
          "approxWeight": 25.2,
          "floor": "F1",
          "row": "R2",
          "chamber": "C1"
        }
      ]
    },
    {
      "name": "Variety B",
      "bagSizes": [
        {
          "name": "50kg",
          "quantityInit": 100,
          "quantityCurr": 100,
          "approxWeight": null,
          "floor": "F1",
          "row": "R3",
          "chamber": "C1"
        }
      ]
    }
  ]
}'
